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
STAGE = re.compile(r"^\s*Stage\s+(\d)\s*$")
BULLET = re.compile(r"^\s*[•●▪·]\s*$")

# Running headers/footers to drop before parsing.
NOISE = re.compile(
    r"0057 Curriculum Framework|www\.cambridgeinternational\.org|Back to contents page|^\s*\d{1,3}\s*$",
    re.IGNORECASE,
)
BACK_MATTER = re.compile(r"^\s*(?:\d{1,2}\s+)?Glossary\b", re.IGNORECASE)

# Every heading line in the objectives section, so a stray heading is never
# glued onto the objective above it.
HEADINGS = set(STRANDS.values()) | set(SUB_STRANDS.values())


def page_lines(pdf_path: Path) -> list[str]:
    reader = pypdf.PdfReader(str(pdf_path))
    lines: list[str] = []
    for page in reader.pages:
        for raw in (page.extract_text() or "").splitlines():
            line = raw.strip()
            if not line or NOISE.search(line):
                continue
            lines.append(line)
    return lines


def extract(pdf_path: Path) -> dict:
    lines = page_lines(pdf_path)
    by_stage: dict[str, list[dict]] = {}
    stage: int | None = None
    current: dict | None = None
    misprints: list[str] = []

    for line in lines:
        if BACK_MATTER.match(line) and stage is not None:
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

    counts = {st: len(objs) for st, objs in by_stage.items()}
    if sorted(counts) != ["1", "2", "3", "4", "5", "6"]:
        raise SystemExit(f"expected Stages 1-6, found {sorted(counts)}")

    note = (
        "Stage N maps to Ehel Grade N. Objective code = <stage><strand letter><sub-strand tag>.<nn>. "
        "Every objective is unique to its stage (the framework has no recurring objectives). "
        "The CEFR alignment stated by Cambridge: Stages 1-3 work towards A1 and Stages 4-6 towards A2, "
        "against the Young Learner descriptors; the framework is a can-do sequence and the CEFR level is "
        "reported per strand, never as a single grade equivalence."
    )
    if misprints:
        note += " Source misprints normalised: " + "; ".join(misprints) + "."

    return {
        "framework": "Cambridge Primary English as a Second Language",
        "curriculumCode": "0057",
        "published": "September 2020 (first teaching September 2021)",
        "source": "English as a Second Language Curriculum Framework 0057 (Cambridge Assessment International Education)",
        "note": note,
        "objectiveStyle": {"identicalTextAcrossStrands": True},
        "strands": STRANDS,
        "subStrands": SUB_STRANDS,
        "counts": counts,
        "objectivesByStage": by_stage,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = extract(args.pdf)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total = sum(data["counts"].values())
    print(f"{args.output}: {total} objectives across stages {', '.join(data['counts'])} -> {data['counts']}")


if __name__ == "__main__":
    main()
