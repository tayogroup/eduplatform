"""Extract the Cambridge Primary Computing 0059 framework from Cambridge's PDF.

Produces the same JSON shape as src/curriculum/cambridge-science-0097.json so
that validate-curriculum-framework.mjs and the standalone lesson kits can read
it:

    framework, curriculumCode, published, source, note,
    strands{}, subStrands{}, counts{}, objectivesByStage{}

0059 has ONE code convention and NO sub-strands. Every objective is
<stage><strand>.<nn> where the strand is its reporting code:

    CT  Computational Thinking          1CT.01 ... 1CT.07
    P   Programming                     1P.01  ... 1P.07
    MD  Managing Data                   1MD.01 ... 1MD.04
    DC  Networks and Digital Communication
    CS  Computer Systems

Because there are no sub-strands, `subStrandCode` on every objective IS the
strand code and the `subStrands` map is the `strands` map - the validator's
per-objective checks (sub-strand present, label agrees) then hold trivially and
its strand check is made real by resolving the whole code first (see the note
in validate-curriculum-framework.mjs).

Two traps in this PDF, both handled below and both worth knowing before
re-running on a later edition:

  - "count-controlled loops" (4CT.02) breaks across a line after the hyphen.
    The science extractor's hyphen repair (`(\\w)-\\s(\\w)` -> join) would have
    produced "countcontrolled", so a continuation onto a line that ends in a
    hyphen is joined WITHOUT a space and the hyphen is kept. Nothing in this
    document is a soft hyphen; every line-final hyphen is a real one.
  - "1CT.05" is quoted in the front matter as the example of a code, eleven
    pages before Stage 1 begins. Nothing is an objective until a "Stage N"
    heading has been seen.

Usage:
    python tools/extract-cambridge-computing-framework.py \\
        --pdf "<path to the 0059 pdf>" --output src/curriculum/cambridge-computing-0059.json
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

import pypdf

BULLET = re.compile(r"^\s*[•●▪·\-•]\s*")
CODE = re.compile(r"^(\d)(CT|P|MD|DC|CS)\.(\d{2})\s+(.+)$")

STRANDS = {
    "CT": "Computational Thinking",
    "P": "Programming",
    "MD": "Managing Data",
    "DC": "Networks and Digital Communication",
    "CS": "Computer Systems",
}
STRAND_HEADINGS = {v: k for k, v in STRANDS.items()}

# Running headers/footers to drop before parsing.
NOISE = re.compile(
    r"Curriculum Framework|www\.cambridgeinternational\.org|Back to contents page|"
    r"^\s*\d{1,3}\s*$|Learning objectives by stage",
    re.IGNORECASE,
)

# Everything from the glossary on is back matter. The heading carries its
# section number ("5 Glossary").
BACK_MATTER = re.compile(r"^\s*(?:\d{1,2}\s+)?(Glossary|Changes to this curriculum framework)\b", re.IGNORECASE)


def page_lines(pdf_path: Path) -> list[str]:
    reader = pypdf.PdfReader(str(pdf_path))
    lines: list[str] = []
    for page in reader.pages:
        for raw in (page.extract_text() or "").splitlines():
            line = raw.replace("\xa0", " ").rstrip()
            if not line.strip() or NOISE.search(line):
                continue
            lines.append(line)
    return lines


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def join(prev: str, more: str) -> str:
    """Append a continuation line; a line-final hyphen is a real hyphen here."""
    if prev.endswith("-"):
        return normalise(prev + more)
    return normalise(prev + " " + more)


def parse(lines: list[str]) -> tuple[list[dict], list[str]]:
    objectives: list[dict] = []
    warnings: list[str] = []
    stage = None
    strand = None

    for line in lines:
        bare = line.strip()
        if objectives and BACK_MATTER.match(bare):
            break
        stage_match = re.match(r"^Stage\s+(\d)\s*$", bare)
        if stage_match:
            stage = int(stage_match.group(1))
            strand = None
            continue
        collapsed = re.sub(r"\s+", " ", bare)
        if collapsed in STRAND_HEADINGS:
            strand = STRAND_HEADINGS[collapsed]
            continue

        body = BULLET.sub("", line).strip()
        match = CODE.match(body)
        if match and stage is None:
            match = None   # the front matter's worked example of a code
        if match:
            stage_digit, code_strand, number, text = match.groups()
            if strand and code_strand != strand:
                warnings.append(f"{stage_digit}{code_strand}.{number} sits under the {STRANDS[strand]} heading")
            if int(stage_digit) != stage:
                warnings.append(f"{stage_digit}{code_strand}.{number} appears under Stage {stage}")
            objectives.append({
                "code": f"{stage_digit}{code_strand}.{number}",
                "stage": int(stage_digit),
                "strand": STRANDS[code_strand],
                "subStrandCode": code_strand,
                "subStrand": STRANDS[code_strand],
                "recurring": False,
                "text": normalise(text),
                "_number": int(number),
            })
            continue

        # A non-bullet, non-code line inside the objectives is the previous
        # objective wrapping onto a new line (including 6P.05's "o" bullets).
        if objectives and stage is not None:
            looks_like_heading = len(bare) < 60 and not bare.endswith((".", ",", ";", ")")) and bare[:1].isupper()
            if not looks_like_heading:
                objectives[-1]["text"] = join(objectives[-1]["text"], bare)
    return objectives, warnings


def check(objectives: list[dict]) -> list[str]:
    problems = []
    seen = Counter(o["code"] for o in objectives)
    for code, n in seen.items():
        if n > 1:
            problems.append(f"duplicate code {code} ({n}x)")
    grouped: dict[tuple, list[int]] = {}
    for o in objectives:
        grouped.setdefault((o["stage"], o["subStrandCode"]), []).append(o["_number"])
    for (stage, sub), numbers in sorted(grouped.items()):
        numbers.sort()
        expected = list(range(1, len(numbers) + 1))
        if numbers != expected:
            problems.append(f"stage {stage} {sub}: numbering {numbers} != {expected}")
    for o in objectives:
        if not o["text"].endswith((".", ")")):
            problems.append(f"{o['code']} does not end in a full stop: ...{o['text'][-30:]}")
    return problems


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    lines = page_lines(args.pdf)
    objectives, warnings = parse(lines)
    stages = [1, 2, 3, 4, 5, 6]
    by_stage: dict[str, list[dict]] = {str(s): [] for s in stages}
    for objective in objectives:
        key = str(objective["stage"])
        if key in by_stage:
            by_stage[key].append(objective)

    problems = check(objectives)
    for objective in objectives:
        objective.pop("_number", None)

    payload = {
        "framework": "Cambridge Primary Computing",
        "curriculumCode": "0059",
        "published": "September 2021 (first teaching September 2022), version 1.0",
        "source": f"{args.pdf.name} (Cambridge Assessment International Education)",
        "note": ("Stage N maps to Ehel Grade N. Objective code = <stage><strand>.<number>. "
                 "Cambridge Primary Computing has no sub-strands, so subStrandCode is the strand's reporting code "
                 "and subStrands mirrors strands."),
        "strands": dict(STRANDS),
        "subStrands": dict(STRANDS),
        "counts": {str(s): len(by_stage[str(s)]) for s in stages},
        "objectivesByStage": by_stage,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {args.output}: {len(objectives)} objectives")
    print("  counts:", payload["counts"])
    for w in warnings[:10]:
        print("  WARN", w)
    for p in problems[:20]:
        print("  CHECK", p)
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
