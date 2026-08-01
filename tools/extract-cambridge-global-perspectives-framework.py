"""Extract the Cambridge Global Perspectives curriculum frameworks from Cambridge's PDFs.

Produces the same JSON shape as src/curriculum/cambridge-{english,science}-*.json
so validate-curriculum-framework.mjs and the unit validators can read them:

    framework, curriculumCode, published, source, note,
    strands{}, subStrands{}, counts{}, objectivesByStage{}

Two PDFs, two stage ranges:

    0838 Cambridge Primary Global Perspectives          stages 1-6
    1129 Cambridge Lower Secondary Global Perspectives  stages 7-9

THE DIFFERENCE FROM EVERY OTHER FRAMEWORK IN src/curriculum/
============================================================
English and Science publish an objective code against every bullet ("7Rv.01",
"1Ep1"), so extraction reads the code off the page. Global Perspectives does
not print codes at all. Its pages are three nested headings deep —

    Stages 5 to 6            <- stage heading
    Research                 <- strand
    Constructing research questions   <- sub-strand
    • Begin to construct research questions with support

— and the bullet is the whole objective. So the codes in the output are
ASSIGNED HERE, not read from Cambridge. They are recorded in the output under
`codeScheme` with `codesArePublishedByCambridge: false` so no reader mistakes
them for official Cambridge codes. They exist because units have to reference
objectives by a stable identifier and validate-unit.mjs resolves that reference
by code.

The scheme is <stage><subStrandCode>.01, where the sub-strand code's first
letter is its strand's key. Research/Analysis/Evaluation take R/A/E; Reflection
takes F and Communication takes M, because R and C are already spoken for by
Research and Collaboration.

Every sub-strand carries exactly one objective per stage, so the number is
always .01. It is kept in the code anyway to match the shape the unit validator
and the other frameworks use.

STAGE PAIRS
===========
Cambridge writes one set of objectives for a pair of stages ("Stages 3 to 4",
"Stages 5 to 6", "Stages 7 and 8"). Both stages in a pair genuinely carry the
same wording. This publishes the objectives under BOTH stage keys, so a Grade 4
unit can map to 4Rq.01 rather than borrowing Grade 3's code, and marks them
`recurring: true` with `sharedWith` naming the partner stage.

Usage:
    python tools/extract-cambridge-global-perspectives-framework.py \
        --pdf "<0838 pdf>" --code 0838 --output src/curriculum/cambridge-global-perspectives-0838.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pdfplumber

BULLET = re.compile(r"^\s*[•●▪·]\s*")

# Running headers/footers, and the section heading that repeats on every page.
NOISE = re.compile(
    r"Curriculum Framework Global Perspectives|www\.cambridgeinternational\.org|"
    r"Back to contents page|^\s*\d{1,3}\s*$|^\s*\d?\s*Learning objectives by stage\s*$",
    re.IGNORECASE,
)

# The objectives section runs from "Learning objectives by stage" to the next
# numbered section. Without a stop, the last bullet of the last stage absorbs
# the programme-topics prose that follows it.
SECTION_START = re.compile(r"^\s*3\s+Learning objectives by stage\s*$", re.IGNORECASE)
SECTION_END = re.compile(r"^\s*4\s+Teaching and learning in Cambridge\b", re.IGNORECASE)

# "Stage 1" / "Stage 9" / "Stages 3 to 4" / "Stages 7 and 8"
STAGE_ONE = re.compile(r"^\s*Stage\s+(\d)\s*$", re.IGNORECASE)
STAGE_PAIR = re.compile(r"^\s*Stages\s+(\d)\s+(?:to|and)\s+(\d)\s*$", re.IGNORECASE)

STRANDS = {
    "R": "Research",
    "A": "Analysis",
    "E": "Evaluation",
    "F": "Reflection",
    "C": "Collaboration",
    "M": "Communication",
}
STRAND_BY_NAME = {v.lower(): k for k, v in STRANDS.items()}

# (strand key, lowercased sub-strand heading) -> sub-strand code.
# Keyed by strand because "Teamwork" is a Reflection sub-strand while
# "Engaging in teamwork" is a Collaboration one, and the headings alone are
# ambiguous. Cambridge also prints "Evaluating sources" in some stages and
# "Evaluating Sources" in others, hence the lowercasing.
SUB_STRANDS = {
    ("R", "constructing research questions"): "Rq",
    ("R", "information skills"): "Ri",
    ("R", "conducting research"): "Rc",
    ("R", "recording findings"): "Rf",
    ("A", "identifying perspectives"): "Ap",
    ("A", "interpreting data"): "Ad",
    ("A", "making connections"): "Ac",
    ("A", "solving problems"): "As",
    ("E", "evaluating sources"): "Es",
    ("E", "evaluating arguments"): "Ea",
    ("F", "personal contribution"): "Fc",
    ("F", "teamwork"): "Ft",
    ("F", "personal viewpoints"): "Fv",
    ("F", "personal learning"): "Fl",
    ("C", "cooperation and interdependence"): "Cc",
    ("C", "engaging in teamwork"): "Ct",
    ("M", "communicating information"): "Mi",
    ("M", "listening and responding"): "Ml",
}
# Canonical label per sub-strand code, for the subStrands map in the output.
SUB_STRAND_LABELS = {
    "Rq": "Constructing research questions",
    "Ri": "Information skills",
    "Rc": "Conducting research",
    "Rf": "Recording findings",
    "Ap": "Identifying perspectives",
    "Ad": "Interpreting data",
    "Ac": "Making connections",
    "As": "Solving problems",
    "Es": "Evaluating sources",
    "Ea": "Evaluating arguments",
    "Fc": "Personal contribution",
    "Ft": "Teamwork",
    "Fv": "Personal viewpoints",
    "Fl": "Personal learning",
    "Cc": "Cooperation and interdependence",
    "Ct": "Engaging in teamwork",
    "Mi": "Communicating information",
    "Ml": "Listening and responding",
}

META = {
    "0838": {
        "framework": "Cambridge Primary Global Perspectives",
        "published": "2020",
        "stages": [1, 2, 3, 4, 5, 6],
    },
    "1129": {
        "framework": "Cambridge Lower Secondary Global Perspectives",
        "published": "2020",
        "stages": [7, 8, 9],
    },
}


def section_lines(pdf_path: Path) -> list[str]:
    """Every line of the 'Learning objectives by stage' section, noise removed.

    pdfplumber rather than pypdf: these PDFs lay the sub-strand headings out in
    a way pypdf reorders, which shuffles bullets under the wrong heading.
    """
    lines: list[str] = []
    inside = False
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            for raw in (page.extract_text() or "").splitlines():
                line = raw.rstrip()
                if SECTION_START.match(line):
                    inside = True
                    continue
                if inside and SECTION_END.match(line):
                    return lines
                if not inside or not line.strip() or NOISE.search(line):
                    continue
                lines.append(line)
    return lines


def parse(lines: list[str]) -> list[dict]:
    """Walk the heading stack and collect one objective per (stage, sub-strand)."""
    found: list[dict] = []
    stages: list[int] = []
    strand: str | None = None
    sub: str | None = None
    buf: list[str] = []

    def flush() -> None:
        """Close the bullet being accumulated and record it against each stage."""
        nonlocal buf
        if not buf:
            return
        text = re.sub(r"\s+", " ", " ".join(buf)).strip()
        buf = []
        if not (stages and strand and sub):
            return
        for stage in stages:
            found.append(
                {
                    "stage": stage,
                    "strandKey": strand,
                    "subStrandCode": sub,
                    "text": text,
                    "sharedWith": [s for s in stages if s != stage],
                }
            )

    for line in lines:
        m_pair = STAGE_PAIR.match(line)
        m_one = STAGE_ONE.match(line)
        if m_pair or m_one:
            flush()
            stages = [int(g) for g in (m_pair.groups() if m_pair else m_one.groups())]
            strand = sub = None
            continue

        key = STRAND_BY_NAME.get(line.strip().lower())
        if key:
            flush()
            strand = key
            sub = None
            continue

        if strand and (strand, line.strip().lower()) in SUB_STRANDS:
            flush()
            sub = SUB_STRANDS[(strand, line.strip().lower())]
            continue

        if BULLET.match(line):
            flush()
            buf = [BULLET.sub("", line).strip()]
        elif buf:
            # A wrapped bullet. Cambridge wraps long objectives mid-sentence
            # with no continuation marker, so anything that is not a heading
            # and not a new bullet belongs to the bullet above it.
            buf.append(line.strip())

    flush()
    return found


def build(found: list[dict], code: str, source_name: str) -> dict:
    meta = META[code]
    expected_stages = meta["stages"]
    by_stage: dict[str, list[dict]] = {str(s): [] for s in expected_stages}

    for item in found:
        stage = item["stage"]
        if str(stage) not in by_stage:
            continue
        sub_code = item["subStrandCode"]
        strand_key = item["strandKey"]
        entry = {
            "code": f"{stage}{sub_code}.01",
            "stage": stage,
            "strand": STRANDS[strand_key],
            "subStrandCode": sub_code,
            "subStrand": SUB_STRAND_LABELS[sub_code],
            "recurring": bool(item["sharedWith"]),
            "text": item["text"],
        }
        if item["sharedWith"]:
            entry["sharedWith"] = item["sharedWith"]
        by_stage[str(stage)].append(entry)

    # Publish sub-strands in curriculum order, not discovery order.
    order = list(SUB_STRAND_LABELS)
    for stage in by_stage:
        by_stage[stage].sort(key=lambda o: order.index(o["subStrandCode"]))

    return {
        "framework": meta["framework"],
        "curriculumCode": code,
        "published": meta["published"],
        "source": f"{source_name} (Cambridge Assessment International Education)",
        "note": (
            "Stage N maps to Ehel Grade N. Objective code = <stage><subStrand>.01. "
            "Cambridge does not print objective codes in this framework; see codeScheme."
        ),
        "codeScheme": {
            "codesArePublishedByCambridge": False,
            "assignedBy": "tools/extract-cambridge-global-perspectives-framework.py",
            "pattern": "<stage><subStrandCode>.01",
            "why": (
                "Global Perspectives publishes objectives as bare bullets under "
                "strand and sub-strand headings, with no codes. Units need a stable "
                "identifier to reference, so these codes are assigned during extraction. "
                "They are stable across re-extraction because they derive from the "
                "sub-strand, not from position on the page."
            ),
            "strandLetters": (
                "Reflection takes F and Communication takes M because R and C are "
                "already used by Research and Collaboration."
            ),
        },
        "strands": STRANDS,
        "subStrands": SUB_STRAND_LABELS,
        "objectiveStyle": {"terminalPunctuation": False, "minTextChars": 18},
        "counts": {s: len(o) for s, o in by_stage.items()},
        "objectivesByStage": by_stage,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--pdf", required=True, type=Path)
    ap.add_argument("--code", required=True, choices=sorted(META))
    ap.add_argument("--output", required=True, type=Path)
    args = ap.parse_args()

    if not args.pdf.exists():
        print(f"error: no such PDF: {args.pdf}", file=sys.stderr)
        return 2

    lines = section_lines(args.pdf)
    if not lines:
        print("error: found no 'Learning objectives by stage' section", file=sys.stderr)
        return 1

    found = parse(lines)
    doc = build(found, args.code, args.pdf.name)

    # Every stage must carry every sub-strand exactly once. This is the check
    # that would catch a heading Cambridge renames, or a page pdfplumber reads
    # in an order that drops a bullet — both of which are silent otherwise.
    problems = []
    for stage, objs in doc["objectivesByStage"].items():
        seen = [o["subStrandCode"] for o in objs]
        missing = [c for c in SUB_STRAND_LABELS if c not in seen]
        extra = [c for c, n in ((c, seen.count(c)) for c in set(seen)) if n > 1]
        if missing:
            problems.append(f"stage {stage} missing: {', '.join(missing)}")
        if extra:
            problems.append(f"stage {stage} duplicated: {', '.join(sorted(extra))}")
    if problems:
        print("error: extraction is incomplete", file=sys.stderr)
        for p in problems:
            print(f"  {p}", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total = sum(doc["counts"].values())
    print(
        f"wrote {args.output} - {total} objectives across stages "
        f"{', '.join(doc['objectivesByStage'])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
