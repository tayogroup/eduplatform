# -*- coding: utf-8 -*-
"""Every 'Common misconception' table in a Cambridge English Teacher's Resource.

WHY THIS IS A TOOL AND NOT A ONE-OFF
====================================
`english/data/cambridge-misconceptions-1-4.json` was extracted by hand and its
own note records the cost: "the identify/overcome split is a heuristic on the
leading verb and succeeds on 106" of 185 entries. That is a 43% failure rate on
two of the three fields a teacher reads, and nothing could re-derive it.

This reads the PDF's real TABLE STRUCTURE (PyMuPDF `find_tables()`, which walks
the ruling lines) rather than splitting a flat string, so the three columns come
out as the three columns. The split is exact for every row it emits, and the
fixture can be rebuilt from the books at any time.

    python tools/extract-english-misconceptions.py --books "<dir of TR pdfs>"
    python tools/extract-english-misconceptions.py --books "<dir>" --check

`--check` re-derives and byte-compares against the committed fixture, so a
fixture edited by hand fails rather than drifting from the books it cites.

STAGE 9 IS DELIBERATELY NOT EXTRACTED. Its Teacher's Resource holds 13 tables,
but English has no Grade 9 course - there is no grade-9 directory and no unit
data - so entries for it would be data nothing can reach. Add "9" to STAGES in
the same change that authors the course, never before.
"""

import argparse
import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:      # pragma: no cover
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "data",
                   "cambridge-misconceptions-5-8.json")

# Stage -> the Teacher's Resource that covers it, by filename.
STAGES = {
    5: "Cambridge Primary English 2nd TR5.pdf",
    6: "Cambridge Primary English 2nd TR6.pdf",
    7: "Cambridge Lower Secondary  TR7.pdf",      # two spaces, as shipped
    8: "Cambridge Lower Secondary 8 TR.pdf",
}
FRAMEWORK = {5: "cambridge-english-0058", 6: "cambridge-english-0058",
             7: "cambridge-english-0861", 8: "cambridge-english-0861"}

# What the books reported when this was written. A stage that comes back with
# fewer tables than this has lost some to a layout change or a failed parse,
# which is silent otherwise - the fixture would just be smaller.
FLOOR = {5: 57, 6: 40, 7: 23, 8: 14}

HEAD = ("misconception", "how to identify", "how to overcome")


def norm(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def is_header(row):
    cells = [norm(c).lower() for c in row]
    return len(cells) >= 3 and all(h in " ".join(cells) for h in HEAD)


def extract(pdf_path, stage):
    import pymupdf
    doc = pymupdf.open(pdf_path)
    rows = []
    for i in range(doc.page_count):
        page = doc[i]
        if "Misconception" not in page.get_text():
            continue
        for tab in page.find_tables().tables:
            data = tab.extract()
            if not data or not is_header(data[0]):
                continue
            for r in data[1:]:
                if len(r) < 3:
                    continue
                mis, ident, over = (norm(r[0]), norm(r[1]), norm(r[2]))
                if not mis:
                    continue
                rows.append({
                    "stage": stage,
                    # The PDF page, 1-based - the same convention the 1-4
                    # fixture uses. These books carry no extractable printed
                    # folio (it is set outside the text blocks), so this is the
                    # page of the FILE, which is what a reader opening the PDF
                    # needs, and it is what "page" means in both fixtures.
                    "page": i + 1,
                    "misconception": mis,
                    "identify": ident,
                    "overcome": over,
                    "raw": " / ".join(x for x in (mis, ident, over) if x),
                })
    doc.close()
    return rows


def build(books):
    entries, counts, report = [], {}, []
    for stage in sorted(STAGES):
        path = os.path.join(books, STAGES[stage])
        if not os.path.isfile(path):
            sys.stderr.write("REFUSED: no Teacher's Resource for stage %d at %s\n" % (stage, path))
            return None, None
        rows = extract(path, stage)
        seen, keep = set(), []
        for r in rows:
            k = r["misconception"].lower()
            if k in seen:
                continue
            seen.add(k)
            keep.append(r)
        dropped = len(rows) - len(keep)
        if len(rows) < FLOOR[stage]:
            sys.stderr.write("REFUSED: stage %d yielded %d table rows, below the recorded %d. "
                             "A layout change or a failed parse loses entries silently.\n"
                             % (stage, len(rows), FLOOR[stage]))
            return None, None
        for n, r in enumerate(keep):
            r["id"] = "cme-s%d-%03d" % (stage, n)
        entries += keep
        counts[str(stage)] = len(keep)
        report.append((stage, len(rows), len(keep), dropped))
    counts["total"] = len(entries)
    doc = {
        "source": "Cambridge Primary English 2nd edition Teacher's Resource 5-6; "
                  "Cambridge Lower Secondary English Teacher's Resource 7-8",
        "framework": "cambridge-english-0058 (stages 5-6), cambridge-english-0861 (stages 7-8)",
        "note": "Every 'Common misconception' table in the four Teacher's Resources that cover a "
                "grade this course teaches. Read from the PDF's own table structure, so the three "
                "columns are the three columns - the identify/overcome split is EXACT for every "
                "entry here, unlike the 1-4 fixture, whose note records a leading-verb heuristic "
                "that succeeded on 106 of 185. `page` is the 1-based page of the PDF file; these "
                "books place the printed folio outside the extractable text. Stage 9's Teacher's "
                "Resource holds 13 more tables and is deliberately not extracted: English has no "
                "Grade 9 course for them to reach. "
                "THE SOURCE ITSELF CARRIES DEFECTS AND THEY ARE REPRODUCED FAITHFULLY, not "
                "repaired: cme-s5-038 ('Poems need punctuation like sentences') opens its identify "
                "cell with 'Check the context - the preposition must be followed by a noun', a "
                "sentence about a different misconception that Cambridge left in the cell (TR5 "
                "p219, confirmed against the raw page text). An entry is a quotation, so nothing "
                "here edits one - which is exactly why every misconception surfaced to a teacher "
                "has to be READ before it is picked, never chosen by a score.",
        "counts": counts,
        "entries": [
            {k: e[k] for k in ("id", "stage", "page", "misconception", "identify", "overcome", "raw")}
            for e in entries
        ],
    }
    return doc, report


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--books", required=True, help="directory holding the Teacher's Resource PDFs")
    ap.add_argument("--check", action="store_true",
                    help="re-derive and byte-compare against the committed fixture")
    args = ap.parse_args(argv)

    doc, report = build(args.books)
    if doc is None:
        return 1
    text = json.dumps(doc, indent=1, ensure_ascii=False) + "\n"

    for stage, found, kept, dropped in report:
        print("  stage %d: %3d table rows, %3d distinct%s"
              % (stage, found, kept, ("  (%d repeat(s) dropped)" % dropped) if dropped else ""))
    print("\n  %d misconceptions across stages %s"
          % (doc["counts"]["total"], ", ".join(str(s) for s in sorted(STAGES))))

    if args.check:
        if not os.path.isfile(OUT):
            sys.stderr.write("REFUSED: nothing to check against - %s does not exist\n" % OUT)
            return 1
        have = io.open(OUT, encoding="utf-8").read()
        if have != text:
            sys.stderr.write("\nDRIFT: the committed fixture is not what the books produce.\n")
            return 1
        print("  fixture matches the books exactly")
        return 0

    io.open(OUT, "w", encoding="utf-8", newline="\n").write(text)
    print("  -> %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
