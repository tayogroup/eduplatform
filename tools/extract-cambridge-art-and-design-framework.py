"""Extract the Cambridge Primary Art & Design 0067 curriculum framework from Cambridge's PDF.

Produces the same JSON shape as src/curriculum/cambridge-{english,science,
global-perspectives,mathematics,computing}-*.json so validate-curriculum-framework.mjs
and the lesson kits can read it:

    framework, curriculumCode, published, source, note, codeScheme,
    strands{}, subStrands{}, objectiveStyle{}, counts{}, objectivesByStage{},
    progressionStagePairs[], glossary{}

TWO WAYS THIS FRAMEWORK IS UNLIKE EVERY OTHER ONE IN src/curriculum/
===================================================================
1. CAMBRIDGE PRINTS CODES, BUT NO STAGE IN THEM. The ten learning objectives
   are E.01-E.03, M.01-M.02, R.01-R.02 and TWA.01-TWA.03, and the PDF says
   (section 3) that "the same learning objectives are used to structure
   learning from Stage 1 to Stage 6". The repo's convention is
   <stage><strand>.<nn> - the unit validators and the lesson kits resolve a
   code by its leading stage digit - so this publishes 1E.01 ... 1TWA.03 under
   every stage 1-6, marks each `recurring: true` and `sharedWith` the other
   five, and records in `codeScheme` that the stage digit is Ehel's and the
   rest is Cambridge's. `cambridgeCode` on every objective keeps the printed
   form. The strand IS the sub-strand, exactly as Computing 0059's is.

2. WHAT DIFFERS BY STAGE IS THE PROGRESSION TEXT, not the objective. Section
   4 gives one paragraph of "how learners might demonstrate progression" per
   objective per stage PAIR (Stages 1 and 2, 3 and 4, 5 and 6). That text is
   the only thing a Stage 1 lesson can be pitched against, so it is stored on
   every objective as `progression`, with `progressionPair` naming the pair
   it came from. A Stage 1 and a Stage 2 entry therefore carry the same
   progression paragraph, and the file says so rather than hiding it.

The glossary (section 5) is carried too, as `glossary`, because it is the
subject vocabulary the lesson words are drawn from ("Mark making", "Blend",
"Visual journal"...).

The PDF's bullets (U+2022), curly quotes (U+2018/9) and en-dashes (U+2013)
come through pdfplumber as themselves - they only LOOK like U+FFFD on a
Windows console - and are straightened to ASCII so the file reads the same
as the other framework files.

Usage:
    python tools/extract-cambridge-art-and-design-framework.py \
        --pdf "<0067 pdf>" --output src/curriculum/cambridge-art-and-design-0067.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pdfplumber

CODE = "0067"
FRAMEWORK = "Cambridge Primary Art & Design"
PUBLISHED = "2019"
STAGES = [1, 2, 3, 4, 5, 6]
PAIRS = [(1, 2), (3, 4), (5, 6)]

STRANDS = {
    "E": "Experiencing",
    "M": "Making",
    "R": "Reflecting",
    "TWA": "Thinking and Working Artistically",
}
STRAND_BY_NAME = {v: k for k, v in STRANDS.items()}

OBJ_LINE = re.compile(r"^\s*(E|M|R|TWA)\.(\d{2})\s+(.*\S)\s*$")
NOISE = re.compile(
    r"^\s*(?:Progression|Cambridge Primary Art & Design 0067 Curriculum Framework\.?(?:\s*\w+)?|"
    r"\d{1,2}\s+www\.cambridgeinternational\.org/primary\s+Back to contents page|"
    r"Back to contents page\s+www\.cambridgeinternational\.org/primary\s+\d{1,2})\s*$"
)
PAIR_HEAD = re.compile(r"^\s*Stages\s+(\d)\s+and\s+(\d)\s*$")
GLOSSARY_HEAD = re.compile(r"^\s*5\s*Glossary\s*$")
OBJECTIVES_HEAD = re.compile(r"^\s*3\s*Learning objectives\s*$")
PROGRESSION_HEAD = re.compile(r"^\s*4\s*Progression\s*$")


def tidy(s: str) -> str:
    """Drop the bullet, straighten the quotes and the dash, collapse whitespace."""
    s = re.sub(r"^\s*[•●▪]\s*", "", s)   # a bullet
    s = s.replace("’", "'").replace("‘", "'")   # curly single quotes
    s = s.replace("“", '"').replace("”", '"')   # curly double quotes
    s = s.replace("–", "-").replace("—", "-")   # en and em dashes
    return re.sub(r"\s+", " ", s).strip()


def page_lines(pdf: Path) -> list[str]:
    out: list[str] = []
    with pdfplumber.open(str(pdf)) as doc:
        for page in doc.pages:
            for raw in (page.extract_text() or "").split("\n"):
                line = tidy(raw)
                if not line or NOISE.match(line):
                    continue
                out.append(line)
    return out


def section(lines: list[str], start: re.Pattern, end: re.Pattern) -> list[str]:
    out, on = [], False
    for line in lines:
        if not on and start.match(line):
            on = True
            continue
        if on and end.match(line):
            break
        if on:
            out.append(line)
    if not out:
        sys.exit("REFUSED: found nothing between %r and %r" % (start.pattern, end.pattern))
    return out


def parse_objectives(lines: list[str]) -> list[dict]:
    """The ten printed objectives: code, strand, text; a wrapped line continues the last."""
    objs: list[dict] = []
    strand = None
    for line in lines:
        if line in STRAND_BY_NAME:
            strand = line
            continue
        m = OBJ_LINE.match(line)
        if m:
            key, num, text = m.groups()
            if strand is None or STRANDS[key] != strand:
                sys.exit("REFUSED: %s.%s printed under strand %r" % (key, num, strand))
            objs.append({"key": key, "num": num, "strand": strand, "text": text})
        elif objs and not objs[-1]["text"].endswith("."):
            objs[-1]["text"] += " " + line
    if len(objs) != 10:
        sys.exit("REFUSED: expected the 10 printed objectives, parsed %d" % len(objs))
    for o in objs:
        if not o["text"].endswith("."):
            sys.exit("REFUSED: %s.%s did not end in a full stop: %r" % (o["key"], o["num"], o["text"]))
    return objs


def parse_progression(lines: list[str], objs: list[dict]) -> dict[tuple[int, int], dict[str, str]]:
    """{(lo, hi): {"E.01": paragraph, ...}} - a block starts where the lines
    join up to an objective's printed text and runs to the next such heading."""
    texts = {o["text"]: "%s.%s" % (o["key"], o["num"]) for o in objs}
    out: dict[tuple[int, int], dict[str, str]] = {}
    pair, current, pending, body = None, None, "", []

    def flush():
        if pair and current:
            para = " ".join(body).strip()
            if len(para) < 200:
                sys.exit("REFUSED: progression for %s at stages %s is suspiciously short: %r" % (current, pair, para))
            out[pair][current] = para

    for line in lines:
        m = PAIR_HEAD.match(line)
        if m:
            flush()
            pair = (int(m.group(1)), int(m.group(2)))
            out.setdefault(pair, {})
            current, pending, body = None, "", []
            continue
        if pair is None:
            continue
        if line in STRAND_BY_NAME:
            continue
        cand = (pending + " " + line).strip() if pending else line
        if cand in texts:
            flush()
            current, pending, body = texts[cand], "", []
            continue
        if any(t.startswith(cand) for t in texts):
            pending = cand
            continue
        if pending:            # a false start: those lines were prose after all
            body.append(pending)
            pending = ""
        if current:
            body.append(line)
    flush()
    for lo, hi in PAIRS:
        got = out.get((lo, hi), {})
        if len(got) != 10:
            sys.exit("REFUSED: stages %d and %d: progression found for %d of 10 objectives (%s)"
                     % (lo, hi, len(got), ", ".join(sorted(got))))
    return out


def parse_glossary(lines: list[str]) -> dict[str, str]:
    terms: dict[str, str] = {}
    term = None
    for line in lines:
        m = re.match(r"^([A-Z][A-Za-z() -]{2,40}?) - (.+)$", line)
        if m and not line.startswith(("Cambridge", "The ")):
            term = m.group(1).strip()
            terms[term] = m.group(2).strip()
        elif term and not re.match(r"^(Cambridge Assessment|The Triangle|Tel:|Email:|Copyright|\*)", line):
            terms[term] += " " + line
    if len(terms) < 15:
        sys.exit("REFUSED: parsed only %d glossary terms" % len(terms))
    return terms


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--output", required=True)
    a = ap.parse_args()
    pdf = Path(a.pdf)
    lines = page_lines(pdf)
    objs = parse_objectives(section(lines, OBJECTIVES_HEAD, PROGRESSION_HEAD))
    prog = parse_progression(section(lines, PROGRESSION_HEAD, GLOSSARY_HEAD), objs)
    glossary = parse_glossary(section(lines, GLOSSARY_HEAD, re.compile(r"^\s*\*\d+\*\s*$")))

    by_stage: dict[str, list[dict]] = {}
    for stage in STAGES:
        pair = next(p for p in PAIRS if stage in p)
        rows = []
        for o in objs:
            printed = "%s.%s" % (o["key"], o["num"])
            rows.append({
                "code": "%d%s" % (stage, printed),
                "stage": stage,
                "strand": o["strand"],
                "subStrandCode": o["key"],
                "subStrand": o["strand"],
                "recurring": True,
                "sharedWith": [s for s in STAGES if s != stage],
                "cambridgeCode": printed,
                "text": o["text"],
                "progressionPair": "Stages %d and %d" % pair,
                "progression": prog[pair][printed],
            })
        by_stage[str(stage)] = rows

    out = {
        "framework": FRAMEWORK,
        "curriculumCode": CODE,
        "published": PUBLISHED,
        "source": "%s (Cambridge Assessment International Education, Version 1, September 2019)" % pdf.name,
        "note": ("Stage N maps to Ehel Grade N. Cambridge publishes ONE set of ten learning objectives for all six "
                 "primary stages (and lower secondary); what progresses is described per stage pair. Objective code = "
                 "<stage><cambridgeCode>; see codeScheme."),
        "codeScheme": {
            "codesArePublishedByCambridge": True,
            "stageDigitIsPublishedByCambridge": False,
            "assignedBy": "tools/extract-cambridge-art-and-design-framework.py",
            "pattern": "<stage><strandCode>.<nn>, e.g. 1E.01 for Cambridge's E.01 at Stage 1",
            "why": ("Cambridge prints E.01-E.03, M.01-M.02, R.01-R.02 and TWA.01-TWA.03 with no stage, because the same "
                    "objectives run from Stage 1 to Stage 6. Every other framework here is resolved by a leading stage "
                    "digit, so the digit is prefixed here; `cambridgeCode` keeps the printed form. The strand is the "
                    "sub-strand, as in Computing 0059."),
            "progression": ("`progression` on each objective is section 4's text for that objective's stage pair - the "
                            "only thing that differs between stages, and what a lesson at a stage is pitched against."),
        },
        "strands": dict(STRANDS),
        "subStrands": dict(STRANDS),
        "objectiveStyle": {"terminalPunctuation": True, "minTextChars": 18},
        "counts": {str(s): 10 for s in STAGES},
        "objectivesByStage": by_stage,
        "progressionStagePairs": ["Stages %d and %d" % p for p in PAIRS],
        "glossary": glossary,
    }
    Path(a.output).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print("wrote %s: %d objectives x %d stages, %d glossary terms" % (a.output, len(objs), len(STAGES), len(glossary)))


if __name__ == "__main__":
    main()
