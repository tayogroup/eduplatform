"""Extract Cambridge science curriculum frameworks from Cambridge's PDFs.

Produces the same JSON shape as src/curriculum/cambridge-english-*.json so that
validate-curriculum-framework.mjs and the unit validators can read them:

    framework, curriculumCode, published, source, note,
    strands{}, subStrands{}, counts{}, objectivesByStage{}

Two PDFs, two different objective-code conventions:

    0846 Cambridge Primary Science (stages 1-6)      1Ep1, 1Bp1, 3Cc2
    0893 Cambridge Lower Secondary Science (7-9)     7TWSm.01, 7Bs.01, 8Pf.03

Usage:
    python tools/extract-cambridge-science-framework.py \
        --pdf "<path to 0846 pdf>" --code 0846 --output src/curriculum/cambridge-science-0846.json
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

import pypdf

# Bullet glyphs Cambridge uses; the 0893 PDF mixes several.
BULLET = re.compile(r"^\s*[•●▪·\-]\s*")

# 0846: "1Ep1 Try to answer questions..."  (no dot, no zero padding)
CODE_0846 = re.compile(r"^(\d)([EBCP])([a-z]{1,2})(\d{1,2})\s+(.+)$")
# 0893: "7TWSm.01 ...", "8Bs.02 ...", "9ESp.01 ...", "7SIC.02 ..."
# Earth and Space (ES*) and Science in Context (SIC) carry an inner capital, so
# a [a-z]-only tail silently drops all three Earth and Space sub-strands.
CODE_0893 = re.compile(r"^(\d)(TWS[a-z]|TSW[a-z]|ES[a-z]|SIC|[BCP][a-z])\.(\d{2})\s+(.+)$")

STRAND_NAMES = {
    "E": "Scientific enquiry",
    "B": "Biology",
    "C": "Chemistry",
    "P": "Physics",
    "ES": "Earth and Space",
    "SIC": "Science in Context",
    "TWS": "Thinking and Working Scientifically",
}

# Running headers/footers to drop before parsing.
NOISE = re.compile(
    r"Curriculum Framework|www\.cambridgeinternational\.org|Back to contents page|"
    r"^\s*\d{1,3}\s*$|Learning objectives by stage|Curriculum overview",
    re.IGNORECASE,
)

# Everything from here on is back matter (glossary, changes table, copyright
# block). Without this the final objective on the last page absorbs the rest of
# the document — 9SIC.05 came out 3963 characters long.
# The heading carries its section number on the same line ("4 Glossary"), so
# allow a leading number before the keyword.
BACK_MATTER = re.compile(
    r"^\s*(?:\d{1,2}\s+)?(Glossary|Changes to this curriculum framework)\b",
    re.IGNORECASE,
)


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
    text = re.sub(r"\s+", " ", text).strip()
    # Cambridge's own PDFs hyphenate across line breaks in a few places.
    text = re.sub(r"(\w)-\s(\w)", r"\1\2", text)
    return text


def parse(lines: list[str], code_re: re.Pattern, dotted: bool) -> tuple[list[dict], dict, list[str]]:
    """Return (objectives, subStrands, warnings)."""
    objectives: list[dict] = []
    sub_strands: dict[str, str] = {}
    warnings: list[str] = []
    stage = None
    strand = None
    sub_strand_label = None

    for line in lines:
        bare = line.strip()
        # Only once objectives have started — the front matter mentions these
        # words too, and breaking there would yield an empty framework.
        if objectives and BACK_MATTER.match(bare):
            break
        stage_match = re.match(r"^Stage\s+(\d)\s*$", bare)
        if stage_match:
            stage = int(stage_match.group(1))
            continue
        # Strand headings appear alone on a line.
        collapsed = re.sub(r"\s+", " ", bare)
        if collapsed in ("Thinking and Working Scientifically", "Scientific enquiry", "Biology", "Chemistry", "Physics", "Earth and Space"):
            strand = collapsed
            sub_strand_label = None
            continue

        body = BULLET.sub("", line).strip()
        match = code_re.match(body)
        if match:
            if dotted:
                stage_digit, sub_code, number, text = match.groups()
                # Cambridge's own PDF misspells one code as 7TSWa.05. Normalise
                # it so the sub-strand does not split in two, and report it.
                if sub_code.startswith("TSW"):
                    warnings.append(f"source typo {stage_digit}{sub_code}.{number} normalised to TWS{sub_code[3:]}")
                    sub_code = "TWS" + sub_code[3:]
                if sub_code.startswith("TWS"):
                    strand_key = "TWS"
                elif sub_code.startswith("ES"):
                    strand_key = "ES"
                elif sub_code == "SIC":
                    strand_key = "SIC"
                else:
                    strand_key = sub_code[0]
            else:
                stage_digit, strand_letter, sub_letters, number, text = match.groups()
                sub_code = f"{strand_letter}{sub_letters}"
                strand_key = strand_letter
            code = f"{stage_digit}{sub_code}.{number}" if dotted else f"{stage_digit}{sub_code}{number}"
            objectives.append({
                "code": code,
                "stage": int(stage_digit),
                "strand": STRAND_NAMES.get(strand_key, strand or "Unknown"),
                "subStrandCode": sub_code,
                "subStrand": sub_strand_label or "",
                "recurring": False,
                "text": normalise(text),
                "_number": int(number),
            })
            # 0846 states outright that one reporting code can span two
            # sub-strand headings ("the Ep reporting code covers both the Ideas
            # and evidence and the Plan investigative work sub-strands"). Keep
            # the precise heading on the objective as `section`, and let the
            # code's map entry accumulate every heading it covers, so the map
            # and the objectives cannot disagree.
            if sub_strand_label:
                headings = sub_strands.setdefault(sub_code, [])
                if sub_strand_label not in headings:
                    headings.append(sub_strand_label)
                objectives[-1]["section"] = sub_strand_label
            if stage is not None and int(stage_digit) != stage:
                warnings.append(f"{code} appears under Stage {stage}")
            continue

        # A non-bullet, non-code line is either a sub-strand heading or the
        # continuation of the previous objective wrapping onto a new line.
        if objectives and not re.match(r"^[A-Z][a-z]+.*:$", bare) and objectives[-1]["text"] and not bare.endswith(":"):
            looks_like_heading = len(bare) < 60 and not bare.endswith((".", ",", ";")) and bare[:1].isupper()
            if not looks_like_heading:
                objectives[-1]["text"] = normalise(objectives[-1]["text"] + " " + bare)
                continue
        if 3 < len(bare) < 70:
            # Some headings are typeset with the reporting code glued to the
            # label ("Cs States of matter"); keep only the human-readable part.
            sub_strand_label = normalise(re.sub(r"^(?:TWS[a-z]|ES[a-z]|SIC|[EBCP][a-z]{1,2})\s+(?=[A-Z])", "", bare))

    # Collapse each code's heading list into one label, and stamp every
    # objective with it so subStrand and the map always agree.
    labels = {code: "; ".join(headings) for code, headings in sub_strands.items()}
    for objective in objectives:
        objective["subStrand"] = labels.get(objective["subStrandCode"], objective["subStrandCode"])
    return objectives, labels, warnings


def check(objectives: list[dict]) -> list[str]:
    """Numbering gaps within a sub-strand, and duplicate codes."""
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
    return problems


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--code", required=True, choices=["0846", "0893"])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    dotted = args.code == "0893"
    lines = page_lines(args.pdf)
    objectives, sub_strands, warnings = parse(lines, CODE_0893 if dotted else CODE_0846, dotted)

    if args.code == "0846":
        framework, published, stages = "Cambridge Primary Science", "2018", [1, 2, 3, 4, 5, 6]
    else:
        framework, published, stages = "Cambridge Lower Secondary Science", "September 2020 (first teaching September 2021)", [7, 8, 9]

    by_stage: dict[str, list[dict]] = {str(s): [] for s in stages}
    for objective in objectives:
        key = str(objective["stage"])
        if key in by_stage:
            by_stage[key].append(objective)

    problems = check(objectives)
    for objective in objectives:
        objective.pop("_number", None)

    strands = {k: v for k, v in STRAND_NAMES.items() if any(o["strand"] == v for o in objectives)}
    payload = {
        "framework": framework,
        "curriculumCode": args.code,
        "published": published,
        "source": f"{args.pdf.name} (Cambridge Assessment International Education)",
        "note": "Stage N maps to Ehel Grade N. Objective code = <stage><subStrand><number>.",
        "strands": strands,
        "subStrands": dict(sorted(sub_strands.items())),
        "counts": {str(s): len(by_stage[str(s)]) for s in stages},
        "objectivesByStage": by_stage,
    }
    if args.code == "0846":
        # 0846 prints objectives as unpunctuated fragments, a few of them very
        # short ("Make predictions", "Make comparisons"). Both are the
        # publisher's house style, not extraction damage — declared here so the
        # framework validator does not read them as truncated bullets.
        payload["objectiveStyle"] = {"terminalPunctuation": False, "minTextChars": 14}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {args.output}: {len(objectives)} objectives")
    print("  counts:", payload["counts"])
    print("  subStrands:", len(sub_strands))
    for w in warnings[:10]:
        print("  WARN", w)
    for p in problems[:20]:
        print("  CHECK", p)


if __name__ == "__main__":
    main()
