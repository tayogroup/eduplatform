"""Extract Cambridge mathematics curriculum frameworks from Cambridge's PDFs.

Produces the same JSON shape as src/curriculum/cambridge-science-*.json so
validate-curriculum-framework.mjs can read it:

    framework, curriculumCode, published, source, note,
    strands{}, subStrands{}, counts{}, objectivesByStage{}

Maths codes are "<stage><Strand><sub>.<nn>" — 7Ni.01, 8Ae.03, 9Gg.05 — with the
sub-strand printed as a plain heading above each run of bullets. The strand
letter is the capital; the lower-case tail distinguishes sub-strands within it.

Usage:
    python tools/extract-cambridge-mathematics-framework.py \
        --pdf "<path to 0862 pdf>" --code 0862 \
        --output src/curriculum/cambridge-mathematics-0862.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pypdf

# "• 7Ni.01 Estimate, add and subtract integers."
CODE = re.compile(r"^[•●▪·\-]?\s*(\d)([A-Z][a-z]{1,3})\.(\d{2})\s+(.+)$")
# Sub-bullets under one objective ("o is the pair of values that satisfy both").
SUBBULLET = re.compile(r"^\s*o\s+(.+)$")
NOISE = re.compile(
    r"^\s*(Back to contents page|www\.cambridge|Cambridge Lower Secondary|"
    r"Cambridge Primary|\d+\s*$|Learning objectives by stage\s*$)", re.I)
# The same furniture also arrives glued to the END of a wrapped objective, where
# an anchored pattern never sees it: "…continuous data. Choose and explain which
# www.cambridgeinternational.org/lowersecondary Back to contents page".
FURNITURE = re.compile(
    r"\s*(?:www\.cambridgeinternational\.org\S*|Back to contents page|"
    r"Cambridge (?:Lower Secondary|Primary) Mathematics \d{4} Curriculum Framework\.?"
    r"|Learning objectives by stage)\s*", re.I)

# The heading arrives with the page number glued to its front ("4 Glossary This
# glossary…"), so an anchored word match never sees it.
SECTION_END = re.compile(
    r"^\s*\d{0,3}\s*(Glossary|Appendix|Changes to this|Thinking and Working Mathematically\b)", re.I)
# Belt and braces: if a marker still lands mid-line, cut the text there rather
# than shipping an objective with the glossary inside it. "Index" is NOT a
# marker: maths objectives talk about "index laws", and matching it truncated
# 8Ni.05 and 9Ni.02 mid-sentence.
SECTION_CUT = re.compile(r"\s+\d{0,3}\s*(?:Glossary|Appendix)\b.*$", re.I | re.S)

def is_heading(line: str) -> bool:
    """A sub-strand heading is short, unpunctuated prose — not an objective and
    not a stray maths glyph. The PDF drops italic variables like "𝑛𝑛" onto their
    own line, and taken as a heading they become the subStrand of everything
    that follows."""
    if len(line) < 4 or len(line) >= 60 or line.endswith("."):
        return False
    # A wrapped objective breaks mid-sentence, and its tail ("representation to
    # use in a given situation:") is short and unpunctuated like a heading. A
    # real heading is a noun phrase: it starts with a capital and does not run
    # on into a colon.
    if line.endswith(":") or not line[0].isupper():
        return False
    letters = sum(ch.isascii() and ch.isalpha() for ch in line)
    return letters >= max(3, len(line) // 2)

STRAND_NAMES = {
    "N": "Number",
    "A": "Algebra",
    "G": "Geometry and Measure",
    "S": "Statistics and Probability",
    "T": "Thinking and Working Mathematically",
}


def parse(pdf_path: Path):
    reader = pypdf.PdfReader(str(pdf_path))
    lines: list[str] = []
    for page in reader.pages:
        for raw in (page.extract_text() or "").splitlines():
            text = raw.strip()
            if not text or NOISE.match(text):
                continue
            lines.append(text)

    objectives: list[dict] = []
    sub_strands: dict[str, str] = {}
    current_sub_heading = ""
    warnings: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        match = CODE.match(line)
        if not match:
            # A short line with no code and no sentence punctuation is the
            # sub-strand heading the following bullets belong to.
            if is_heading(line) and not SUBBULLET.match(line):
                current_sub_heading = line
            i += 1
            continue

        stage, sub_code, number, text = match.groups()
        # Continuations: Cambridge wraps an objective across lines, and nests
        # "o " sub-bullets under it. Both belong to the objective above them.
        i += 1
        while i < len(lines):
            nxt = lines[i]
            if CODE.match(nxt):
                break
            if is_heading(nxt) and not SUBBULLET.match(nxt):
                break                                  # next sub-strand heading
            # The last objective of the last stage has no code after it, so
            # without an end-of-section stop it absorbs the Glossary and every
            # appendix behind it — 9Sp.04 came out 4,161 characters long.
            if SECTION_END.match(nxt):
                break
            sub = SUBBULLET.match(nxt)
            text = f"{text} {sub.group(1) if sub else nxt}".strip()
            i += 1

        strand_letter = sub_code[0]
        code = f"{stage}{sub_code}.{number}"
        sub_strands.setdefault(sub_code, current_sub_heading or sub_code)
        objectives.append({
            "code": code,
            "stage": int(stage),
            "strand": STRAND_NAMES.get(strand_letter, strand_letter),
            "subStrandCode": sub_code,
            "subStrand": current_sub_heading or sub_code,
            "recurring": False,
            # The page number survives the furniture strip because it sits alone
            # at the end ("…into a given ratio with two parts. 16").
            "text": re.sub(r"\s+\d{1,3}$", "",
                           SECTION_CUT.sub("", re.sub(r"\s+", " ", FURNITURE.sub(" ", text)).strip())).strip(),
        })
    return objectives, sub_strands, warnings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--code", required=True, choices=["0845", "0862", "0096"])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    objectives, sub_strands, warnings = parse(args.pdf)
    if not objectives:
        raise SystemExit(f"no objectives parsed from {args.pdf}")

    by_stage: dict[str, list[dict]] = {}
    for objective in objectives:
        by_stage.setdefault(str(objective["stage"]), []).append(objective)
    for stage in by_stage:
        by_stage[stage].sort(key=lambda o: o["code"])

    strands = {}
    for objective in objectives:
        strands[objective["strand"][0] if objective["strand"] else "?"] = objective["strand"]

    level = ("Cambridge Lower Secondary Mathematics" if args.code == "0862"
             else "Cambridge Primary Mathematics")
    payload = {
        "framework": f"{level} {args.code}",
        "curriculumCode": args.code,
        "published": 2020 if args.code == "0862" else 2018,
        "source": args.pdf.name,
        "note": "Extracted from Cambridge's published curriculum framework PDF by "
                "tools/extract-cambridge-mathematics-framework.py.",
        "strands": dict(sorted(strands.items())),
        "subStrands": dict(sorted(sub_strands.items())),
        "counts": {stage: len(items) for stage, items in sorted(by_stage.items())},
        "objectivesByStage": dict(sorted(by_stage.items())),
        # Nested "o" bullets belong to the objective above them in maths, so a
        # handful legitimately exceed the 340 that flags a swallowed section.
        "objectiveStyle": {"terminalPunctuation": True, "minTextChars": 14, "maxTextChars": 400},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")
    print("  counts:", payload["counts"])
    print("  subStrands:", len(sub_strands))
    for warning in warnings:
        print("  warning:", warning)


if __name__ == "__main__":
    main()
