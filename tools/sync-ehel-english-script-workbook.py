#!/usr/bin/env python3
"""Bring the reviewed English narration workbook back in step with the unit JSON.

The workbook (OneDrive, not in the repo — see the memory note
project-ehel-english-narration-scripts) is the record of what each clip SAYS. The
2026-08-17 content review edited narrated text and re-recorded 68 clips, and
respelled 730 strings British (homophones — recordings unchanged), so the
workbook's Script Text lagged the JSON in two ways. This tool recomposes every
row's Script Text from the JSON the same way the (unavailable) exporter did —

  Reading                       passageScript
  Grammar (narrated)            explanation + " " + ruleAndExamples
  Grammar practice + answer key practice
  Speaking                      instructionsAndModelLines
  Writing                       promptAndInstructions
  Activities                    instructionsAndItems
  Vocabulary                    "Meaning: …\\nExample: …\\nPractice sentences:\\n1. …"

— and classifies each difference before writing it:

  re-recorded   the item id is in the stale list the audio run used → new text,
                comment "Re-recorded 2026-08-17 …"
  respelling    old and new agree once both are mapped US→British (and hyphens
                between letters dropped) → new text, comment "British spelling …"
  other         left alone and reported — the reviewer decides (this is where the
                four Grade 1 readings whose cell is a deliberate truncated prefix
                of the JSON live).

Writes a timestamped backup beside the workbook first. openpyxl round-trips cell
values and column widths; it does not keep every bit of styling, which this
review workbook does not depend on.

Usage: python tools/sync-ehel-english-script-workbook.py --stale <stale.json> [--dry]
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import re
import shutil
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
WORKBOOK = Path(r"C:\Users\inawa\OneDrive\Documents\Elevenlabs\ehel-english-scripts-complete-reviewed_codex_01082026.xlsx")

sys.path.insert(0, str(ROOT / "tools"))
# The same US→UK map the staleness checker uses, so "same recording" means the
# same thing in both tools.
import importlib.util
_spec = importlib.util.spec_from_file_location("stale", ROOT / "tools" / "check-english-audio-staleness.py")
_stale = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_stale)
british = _stale.british


def norm(s) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()


def compose(cat: str, item: dict) -> str | None:
    if cat == "Reading":
        return item.get("passageScript")
    if cat == "Grammar (narrated)":
        return f"{item.get('explanation', '')} {item.get('ruleAndExamples', '')}".strip()
    if cat == "Grammar practice + answer key":
        return item.get("practice")
    if cat == "Speaking":
        return item.get("instructionsAndModelLines")
    if cat == "Writing":
        return item.get("promptAndInstructions")
    if cat == "Activities":
        return item.get("instructionsAndItems")
    if cat == "Vocabulary":
        lines = [f"Meaning: {item.get('childMeaning', '')}", f"Example: {item.get('exampleSentence', '')}", "Practice sentences:"]
        lines += [f"{i + 1}. {s}" for i, s in enumerate(item.get("practiceSentences") or [])]
        return "\n".join(lines)
    return None


def has_recording(cat: str, item: dict) -> bool:
    """Does a live clip narrate this row's text? If not, the workbook can follow the
    JSON without a re-record. Grammar rules and practice carry separate clips."""
    if cat == "Grammar practice + answer key":
        return bool((item.get("practiceAudio") or {}).get("available"))
    if cat == "Vocabulary":
        return any((d or {}).get("available") for d in (item.get("sentenceAudio") or []))
    return bool((item.get("audio") or {}).get("available"))


def items_for_grade(grade: int) -> dict:
    out = {}
    for f in glob.glob(str(ENGLISH / f"grade-{grade}" / "data" / "units" / "unit-*.json")):
        u = json.load(open(f, encoding="utf-8"))
        for sec, key in (("readings", "readingId"), ("grammar", "grammarId"), ("writing", "writingId"),
                         ("activities", "activityId"), ("speaking", "speakingId")):
            for it in u.get(sec, []):
                out[it[key]] = it
        for link in u.get("dictionaryLinks", []):
            out[f"g{grade}-{link['vocabularyId']}"] = link
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stale", required=True, help="the --only-file JSON the audio re-record used ({grade: [clip ids]})")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--workbook", default=str(WORKBOOK))
    args = ap.parse_args()
    stale = json.load(open(args.stale, encoding="utf-8"))
    rerecorded = {}
    for g, ids in stale.items():
        for cid in ids:
            # grammar clips: "<grammarId>" is the narrated rule, "<grammarId>-practice" the practice
            if cid.endswith("-practice"):
                rerecorded[(int(g), "Grammar practice + answer key", cid[:-len("-practice")])] = True
            elif "-grammar" in cid:
                rerecorded[(int(g), "Grammar (narrated)", cid)] = True
            else:
                m = re.match(r"(.+)-sentence-\d+$", cid)
                rerecorded[(int(g), "Vocabulary", f"g{g}-{m.group(1)}" if m else cid)] = True
                rerecorded[(int(g), "*", cid)] = True

    wb_path = Path(args.workbook)
    wb = openpyxl.load_workbook(wb_path)
    counts = {"re-recorded": 0, "respelling": 0, "text-only": 0, "json-newer": 0, "other": 0, "unchanged": 0}
    other = []
    stamp = dt.date.today().isoformat()
    for ws in wb.worksheets:
        m = re.match(r"Grade (\d)", ws.title)
        if not m:
            continue
        grade = int(m.group(1))
        items = items_for_grade(grade)
        for row in ws.iter_rows(min_row=2):
            unit, cat, cid, title, script, comment = (c.value for c in row[:6])
            if not cid:
                continue
            item = items.get(cid)
            if item is None:
                continue
            new = compose(cat, item)
            if new is None:
                continue
            if norm(new) == norm(script):
                counts["unchanged"] += 1
                continue
            key = (grade, cat, cid)
            if key in rerecorded or (grade, "*", cid) in rerecorded:
                note = f"Re-recorded {stamp}: text corrected in the content review (docs/english-content-review-2026-08-17.md)."
                counts["re-recorded"] += 1
            elif british(norm(new)) == british(norm(script)):
                note = f"British spelling {stamp} (homophone; recording unchanged)."
                counts["respelling"] += 1
            elif norm(new).startswith(norm(script)) and len(norm(script)) > 40:
                # The four Grade 1 readings whose cell is a deliberate truncated
                # prefix of the fuller JSON (see the narration-scripts memory).
                counts["other"] += 1
                other.append((grade, cat, cid, "workbook cell is a prefix of the JSON — left as is"))
                continue
            elif not has_recording(cat, item):
                note = f"Text corrected {stamp} (no recording exists for this item)."
                counts["text-only"] += 1
            else:
                # A recording exists and the staleness checker says it matches the
                # JSON, so the workbook is what lags (e.g. Grade 1 Unit 0's phoneme
                # lines, re-recorded before this pass). Follow the JSON.
                note = f"Updated {stamp} to the current script (recording already matches)."
                counts["json-newer"] += 1
            row[4].value = new
            row[5].value = f"{comment} | {note}" if comment else note
    print(json.dumps({"dry": args.dry, **counts}))
    for o in other:
        print("  OTHER (left alone):", o)
    if not args.dry:
        backup = wb_path.with_name(f"{wb_path.stem}.backup-{dt.datetime.now():%Y%m%d-%H%M%S}{wb_path.suffix}")
        shutil.copy2(wb_path, backup)
        wb.save(wb_path)
        print(f"saved; backup at {backup}")


if __name__ == "__main__":
    main()
