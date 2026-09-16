"""Extract the Cambridge Primary English as a Second Language 0057 framework.

Produces the same JSON shape as src/curriculum/cambridge-english-0058.json so
that validate-curriculum-framework.mjs and build-intensive-units.js can read it:

    framework, curriculumCode, published, source, note,
    strands{}, subStrands{}, counts{}, objectivesByStage{}

0057 is the CEFR-based sibling of 0058. Five strands, thirteen sub-strands, and
a code convention where the reporting code is one strand letter plus a one- or
two-letter sub-strand tag:

    Listening       Lm  Ld  Lo          1Lm.01  1Ld.01  3Lo.01
    Speaking        Sc  So  Sor         1Sc.01  2So.01  1Sor.01
    Writing         Wca Wor Wc          1Wca.01 2Wor.01 1Wc.01
    Reading         Rm  Rd  Ro          2Rm.01  1Rd.01  3Ro.01
    Use of English  Ug  Uv  Us          1Ug.01  1Uv.01  1Us.01

Unlike 0058, every objective is unique to its stage - the framework says so on
page 13 - so `recurring` is false on every objective and only carried so the
validator's boolean check holds.

One thing the validator would otherwise read as a parser slip is genuine here:
Cambridge prints the SAME can-do under a Speaking code and a Writing code where
the skill is the same in both modes (2Sc.06 = 2Wca.05 "Use some simple
grammatical structures, allowing for frequent, basic mistakes"; 2So.01 = 2Wc.02
"Express, with support, basic feelings"). The file declares
`objectiveStyle.identicalTextAcrossStrands` so the validator allows identical
wording across DIFFERENT strands and still fails it within one.

Three traps in this PDF, all handled below and all worth knowing before
re-running on a later edition:

  - The framework's own text misprints one code: "1Wca04 Write familiar words."
    has no dot. It is normalised to 1Wca.04 and the misprint is recorded in the
    file's `note` so nobody "corrects" the data back to match the page.
  - The code table on pages 13-14 quotes real codes as EXAMPLES ("1Lm.01",
    "5Rd.01") before Stage 1 begins. Nothing is an objective until a "Stage N"
    heading has been seen.
  - The sub-strand headings for Reading and Listening have the same last word
    ("... for detail"), so the heading is matched whole, not by its last word.

The owner's copy in OneDrive ("Cambridge English ESL Curriculum Framework
0057.pdf") is a page-image capture with NO text layer, so this extractor cannot
read it. Run it on the official text PDF instead - the September 2020 edition
published at cambridgeinternational.org (a public copy sits at
https://www.pea.ae/linkfiles/English-as-a-Second-Language-Curriculum-Framework-0057_tcm142-592536.pdf).
The two were compared page by page on 2026-09-11: same edition, same
objectives.

Usage:
    python tools/extract-cambridge-esl-framework.py \\
        --pdf "<path to the 0057 text pdf>" --output src/curriculum/cambridge-english-0057.json
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

import pypdf

STRANDS = {
    "L": "Listening",
    "S": "Speaking",
    "W": "Writing",
    "R": "Reading",
    "U": "Use of English",
}

SUB_STRANDS = {
    "Lm": "Listening for global meaning",
    "Ld": "Listening for detail",
    "Lo": "Listening for opinion",
    "Sc": "Communication",
    "So": "Express opinion",
    "Sor": "Organisation",
    "Wca": "Communicative achievement",
    "Wor": "Organisation",
    "Wc": "Content",
    "Rm": "Reading for global meaning",
    "Rd": "Reading for detail",
    "Ro": "Reading for opinion",
    "Ug": "Grammatical forms",
    "Uv": "Vocabulary",
    "Us": "Sentence structure",
}

# "1Wca04" is the framework's own misprint; the optional dot admits it.
CODE = re.compile(r"^(\d)(Lm|Ld|Lo|Sc|Sor|So|Wca|Wor|Wc|Rm|Rd|Ro|Ug|Uv|Us)\.?(\d{2})\s+(.+)$")
# Two frameworks, same shape. 0876 is the Lower Secondary sibling of 0057 and
# uses the SAME five strands, the SAME fifteen sub-strands and the same code
# convention — verified against its own strand table, which is why nothing below
# this needed a second spelling.
PRESETS = {
    "0057": {
        "framework": "Cambridge Primary English as a Second Language",
        "published": "September 2020 (first teaching September 2021)",
        "source": "English as a Second Language Curriculum Framework 0057 "
                  "(Cambridge Assessment International Education)",
        "stages": ["1", "2", "3", "4", "5", "6"],
        "cefr": "The CEFR alignment stated by Cambridge: Stages 1-3 work towards A1 and "
                "Stages 4-6 towards A2, against the Young Learner descriptors; ",
    },
    "0876": {
        "framework": "Cambridge Lower Secondary English as a Second Language",
        "published": "Version 2.0, August 2021",
        "source": "Cambridge Lower Secondary English as a Second Language 0876 Curriculum "
                  "Framework, version 2.0 (Cambridge University Press Assessment 2021). "
                  "EXTRACTED FROM A THIRD-PARTY PAGE CAPTURE re-hosted on Studocu, not from "
                  "the official PDF, because that is the copy this repository was given. The "
                  "capture states its own version and the extraction is internally complete — "
                  "159 objectives, all 15 sub-strands present in all three stages, no "
                  "numbering gaps — but it has NOT been compared against the official "
                  "cambridgeinternational.org PDF the way 0057's was on 2026-09-11. Do that "
                  "before this framework carries a released course.",
        "stages": ["7", "8", "9"],
        "cefr": "Cambridge places Lower Secondary above the Primary framework's A2 exit; "
                "this repository targets Stages 7-9 at A2 to B1 and reports per strand; ",
        # The capture's OCR lost ONE objective code. Line 762 of the extracted
        # text reads "oe     Spell familiar words accurately on an increasing
        # range of topics." -- the statement survived and the code did not, and
        # the numbering gap in 7Wca (2,3,4 with no 1) is what names it. Declared
        # here rather than hand-patched into the JSON so the extraction stays
        # reproducible and the framework says which objective is not the OCR's.
        "repairs": [
            {
                "stage": "7",
                "code": "7Wca.01",
                "tag": "Wca",
                "nn": 1,
                "text": "Spell familiar words accurately on an increasing range of topics.",
                "why": "the capture's OCR dropped the code and kept the statement",
            }
        ],
    },
}

STAGE = re.compile(r"^\s*Stage\s+(\d)\s*$")
BULLET = re.compile(r"^\s*[•●▪·]\s*$")

# A bullet SHARING A LINE with its objective, which 0057's own PDF never does
# and a page capture routinely does: "� 7Sc.01 Describe people, places ...".
# In the 0876 capture 63 objectives carry U+FFFD, the replacement character the
# OCR left where the bullet glyph was, and one carries a plain "e" — the same
# bullet misread as a letter. The lookahead is what makes stripping a leading
# letter safe: it only fires when an objective code follows immediately, so no
# line of prose can lose its first word.
LEAD_BULLET = re.compile(
    r"^(?:[•●▪·�]|[A-Za-z])\s+(?=\d[A-Z][a-z]{1,3}\.?\d{2}\s)"
)

# Running headers/footers to drop before parsing.
def noise_for(code: str) -> re.Pattern:
    return re.compile(
        rf"{code} Curriculum Framework|www\.cambridgeinternational\.org|"
        r"Back to contents page|^\s*\d{1,3}\s*$",
        re.IGNORECASE,
    )
BACK_MATTER = re.compile(r"^\s*(?:\d{1,2}\s+)?Glossary\b", re.IGNORECASE)

# Every heading line in the objectives section, so a stray heading is never
# glued onto the objective above it.
HEADINGS = set(STRANDS.values()) | set(SUB_STRANDS.values())


def page_lines(pdf_path: Path | None, text_path: Path | None, noise: re.Pattern) -> list[str]:
    """Lines of the framework, from a PDF via pypdf or from pre-extracted text.

    --text exists because pypdf CANNOT READ EVERY PDF and does not say so. On the
    0876 capture it reported 6 pages for a 349-page file and returned 155 of the
    159 objective codes, silently dropping 7Wc.02, 8Rd.01, 8Wca.03 and 8Wca.04 —
    `pdftotext -layout` reads the same file correctly. The numbering check below
    would have caught the loss and refused rather than written a short framework,
    which is the right failure, but refusing is not extracting. So: run
    `pdftotext -layout <pdf> <txt>` and pass --text when pypdf disagrees with it.
    ALWAYS compare the two code counts before trusting either.
    """
    if (pdf_path is None) == (text_path is None):
        raise SystemExit("pass exactly one of --pdf or --text")
    if text_path is not None:
        raw_lines = text_path.read_text(encoding="utf-8", errors="replace").splitlines()
    else:
        reader = pypdf.PdfReader(str(pdf_path))
        raw_lines = [
            line
            for page in reader.pages
            for line in (page.extract_text() or "").splitlines()
        ]
    lines: list[str] = []
    for raw in raw_lines:
        line = raw.strip()
        if not line or noise.search(line):
            continue
        lines.append(LEAD_BULLET.sub("", line))
    return lines


def extract(pdf_path: Path | None, text_path: Path | None, curriculum_code: str) -> dict:
    # NOT `code`: the parse loop below binds that to each objective's own code,
    # and the shadowing put "9Us.03" in the file's curriculumCode field.
    preset = PRESETS[curriculum_code]
    lines = page_lines(pdf_path, text_path, noise_for(curriculum_code))
    by_stage: dict[str, list[dict]] = {}
    stage: int | None = None
    current: dict | None = None
    misprints: list[str] = []

    for line in lines:
        # Back matter ends the parse -- but only once something has been
        # parsed. 0876's CONTENTS page lists "Stage 8", "Stage 9" and then
        # "4 Glossary", so testing `stage is not None` stopped the run in the
        # table of contents and reported Stage 9 as the only stage in the
        # framework. A Glossary line before the first objective is front matter.
        if BACK_MATTER.match(line) and any(by_stage.values()):
            break
        m = STAGE.match(line)
        if m:
            stage = int(m.group(1))
            by_stage.setdefault(str(stage), [])
            current = None
            continue
        if stage is None:
            continue
        if BULLET.match(line) or line in HEADINGS:
            current = None
            continue
        # pypdf keeps the bullet on the code's own line ("• 1Lm.01 …"); pymupdf
        # puts it on a line of its own. Accept both.
        line = re.sub(r"^[•●▪·]\s*", "", line)
        m = CODE.match(line)
        if m:
            digit, tag, nn, text = m.groups()
            if int(digit) != stage:
                raise SystemExit(f"code {digit}{tag}.{nn} appears under Stage {stage}")
            code = f"{digit}{tag}.{nn}"
            if f"{digit}{tag}{nn}" == line.split()[0]:
                misprints.append(f"{line.split()[0]} printed without its dot; recorded as {code}")
            current = {
                "code": code,
                "stage": stage,
                "strand": STRANDS[tag[0]],
                "subStrandCode": tag,
                "subStrand": SUB_STRANDS[tag],
                # Never true here (page 13: every objective is unique to its
                # stage); carried so the validator's boolean check holds.
                "recurring": False,
                "text": text.strip(),
            }
            by_stage[str(stage)].append(current)
            continue
        if current is not None:
            # A continuation line of the objective above.
            current["text"] = f"{current['text']} {line}".strip()

    for objectives in by_stage.values():
        for objective in objectives:
            objective["text"] = re.sub(r"\s+", " ", objective["text"]).strip()
            objective["text"] = objective["text"].replace("’", "'").replace("‘", "'")

    # Every code must be unique across the framework and numbered without gaps
    # within its sub-strand.
    # Declared repairs, applied only where the objective is genuinely absent --
    # so a later, cleaner source silently makes each one a no-op rather than a
    # duplicate, and re-running on a fixed PDF needs no edit here.
    repaired: list[str] = []
    for fix in preset.get("repairs", []):
        objs = by_stage.get(fix["stage"], [])
        if any(o["code"] == fix["code"] for o in objs):
            continue
        entry = {
            "code": fix["code"],
            "stage": int(fix["stage"]),
            "strand": STRANDS[fix["tag"][0]],
            "subStrandCode": fix["tag"],
            "subStrand": SUB_STRANDS[fix["tag"]],
            "recurring": False,
            "text": fix["text"],
        }
        at = next(
            (i for i, o in enumerate(objs)
             if o["subStrandCode"] == fix["tag"] and int(o["code"].split(".")[1]) > fix["nn"]),
            len(objs),
        )
        objs.insert(at, entry)
        repaired.append(f"{fix['code']} ({fix['why']})")

    seen = Counter(o["code"] for objs in by_stage.values() for o in objs)
    dupes = [c for c, n in seen.items() if n > 1]
    if dupes:
        raise SystemExit(f"duplicate codes: {dupes}")
    for st, objs in by_stage.items():
        per_sub: dict[str, list[int]] = {}
        for o in objs:
            per_sub.setdefault(o["subStrandCode"], []).append(int(o["code"].split(".")[1]))
        for tag, numbers in per_sub.items():
            if sorted(numbers) != list(range(1, len(numbers) + 1)):
                raise SystemExit(f"Stage {st} {tag} numbering has a gap: {sorted(numbers)}")

    # In stage order, whatever order the source introduced them in: 0876's
    # contents page names Stages 8 and 9 before Stage 7 begins.
    by_stage = {st: by_stage[st] for st in sorted(by_stage, key=int)}
    counts = {st: len(objs) for st, objs in by_stage.items()}
    if sorted(counts) != preset["stages"]:
        raise SystemExit(f"expected Stages {preset['stages']}, found {sorted(counts)}")

    note = (
        "Stage N maps to Ehel Grade N. Objective code = <stage><strand letter><sub-strand tag>.<nn>. "
        "Every objective is unique to its stage (the framework has no recurring objectives). "
        + preset["cefr"]
        + "the framework is a can-do sequence and the CEFR level is "
        "reported per strand, never as a single grade equivalence."
    )
    if misprints:
        note += " Source misprints normalised: " + "; ".join(misprints) + "."
    if repaired:
        note += (" Objectives supplied by declared repair rather than read from the source: "
                 + "; ".join(repaired) + ".")

    return {
        "framework": preset["framework"],
        "curriculumCode": curriculum_code,
        "published": preset["published"],
        "source": preset["source"],
        "note": note,
        "objectiveStyle": {"identicalTextAcrossStrands": True},
        "strands": STRANDS,
        "subStrands": SUB_STRANDS,
        "counts": counts,
        "objectivesByStage": by_stage,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path)
    parser.add_argument("--text", type=Path, help="pre-extracted text (pdftotext -layout)")
    parser.add_argument("--code", default="0057", choices=sorted(PRESETS))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = extract(args.pdf, args.text, args.code)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total = sum(data["counts"].values())
    print(f"{args.output}: {total} objectives across stages {', '.join(data['counts'])} -> {data['counts']}")


if __name__ == "__main__":
    main()
