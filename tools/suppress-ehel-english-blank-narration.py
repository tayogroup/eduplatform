#!/usr/bin/env python
"""Silence the clips that were narrated from fill-in-the-blank frames.

Five hundred English clips were generated from scripts containing "___". Handed
a blank, ElevenLabs improvises: a Grade 1 reading says "This is a dirisan dog…
I am making bomb bomb", a pattern page comes back in invented syllables. The
audio is unusable, and re-recording cannot help, because the blank is in the
source text.

generate-ehel-english-audio.js now refuses these items outright, which stops the
course making more of them. This deals with the ones already on disk: the mp3 is
deleted and the descriptor marked unavailable, which is what the renderers read
to decide whether to draw a Listen button at all. The descriptor is kept rather
than removed, so the item still records that narration is owed — these need a
spoken form of the frame ("This is a blank", or the pattern read with a pause)
written for the ear before they can carry a button again.

The rule matches the generator's, and each category's text is composed the way
the generator composes it, so the two cannot disagree about what has a blank.

Usage:
  python tools/suppress-ehel-english-blank-narration.py --dry
  python tools/suppress-ehel-english-blank-narration.py
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
BLANK = re.compile(r"_{2,}")
REASON = "Refused - the script is a fill-in-the-blank frame; needs a spoken form"

# (list key, descriptor key, how the generator builds the script for that item)
SHAPES = [
    ("readings", "audio", lambda i: str(i.get("passageScript") or "")),
    ("speaking", "audio", lambda i: str(i.get("instructionsAndModelLines") or "")),
    ("writing", "audio", lambda i: str(i.get("promptAndInstructions") or "")),
    ("activities", "audio", lambda i: str(i.get("instructionsAndItems") or "")),
    ("grammar", "audio", lambda i: f"{i.get('explanation')} {i.get('ruleAndExamples', '')}"),
    ("grammar", "practiceAudio", lambda i: str(i.get("practice") or "")),
]
ID_KEYS = ("readingId", "speakingId", "writingId", "activityId", "grammarId")

# The overview panels, which SHAPES cannot reach and which therefore survived the
# original sweep. Every shape above is a descriptor on an item in a LIST; an
# overview panel is a key on `unit.overviewAudio`, and its script is composed
# from elsewhere in the unit rather than read from one field. Five Grade 1 clips
# were still live because of that gap, still narrating "Say 'My name is ___.'"
# as "my name is Taken Seat. I am, mom, years old."
#
# The composition mirrors overviewPanels() in generate-ehel-english-audio.js.
# It cannot be taken from that file's --emit-scripts here, because the point is
# to catch scripts the generator refuses — asking it would return everything
# except the items this tool exists to find.
OVERVIEW_PANELS = {
    "intro": lambda u: ". ".join(str((u.get("unit") or {}).get("unitOverview") or "").split(". ")[:2]),
    "outcomes": lambda u: " ".join(
        o.get("learningOutcome") for o in (u.get("outcomes") or []) if o.get("learningOutcome")),
    "path": lambda u: " ".join(
        line.strip() for line in str((u.get("unit") or {}).get("learningPath") or "").split("\n") if line.strip()),
}


def item_id(item, descriptor_key):
    for key in ID_KEYS:
        if key in item:
            return item[key] + ("-practice" if descriptor_key == "practiceAudio" else "")
    return "?"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true", help="report, change nothing")
    args = parser.parse_args()

    found = collections.Counter()
    deleted = missing = 0
    touched_files = 0

    for grade in range(1, 9):
        units = ENGLISH / f"grade-{grade}" / "data" / "units"
        if not units.exists():
            continue
        for unit_path in sorted(units.glob("unit-*.json"), key=lambda p: int(re.findall(r"\d+", p.stem)[0])):
            unit = json.loads(unit_path.read_text(encoding="utf-8"))
            changed = False
            for list_key, descriptor_key, script_of in SHAPES:
                for item in unit.get(list_key) or []:
                    if not BLANK.search(script_of(item)):
                        continue
                    descriptor = item.get(descriptor_key)
                    if not descriptor or descriptor.get("available") is not True:
                        continue
                    found[f"g{grade} {list_key}{'-practice' if descriptor_key == 'practiceAudio' else ''}"] += 1
                    source = descriptor.get("source") or descriptor.get("normal") or ""
                    mp3 = ENGLISH / source.replace("./", "")
                    if mp3.exists():
                        deleted += 1
                        if not args.dry:
                            mp3.unlink()
                    else:
                        missing += 1
                    if not args.dry:
                        descriptor["available"] = False
                        descriptor["status"] = REASON
                    changed = True
            for panel, script_of in OVERVIEW_PANELS.items():
                descriptor = (unit.get("overviewAudio") or {}).get(panel)
                if not descriptor or descriptor.get("available") is not True:
                    continue
                if not BLANK.search(script_of(unit)):
                    continue
                found[f"g{grade} overview-{panel}"] += 1
                source = descriptor.get("source") or descriptor.get("normal") or ""
                mp3 = ENGLISH / source.replace("./", "")
                if mp3.exists():
                    deleted += 1
                    if not args.dry:
                        mp3.unlink()
                else:
                    missing += 1
                if not args.dry:
                    descriptor["available"] = False
                    descriptor["status"] = REASON
                changed = True

            if changed and not args.dry:
                unit_path.write_text(json.dumps(unit, indent=2) + "\n", encoding="utf-8")
                touched_files += 1

    for key in sorted(found):
        print(f"  {key}: {found[key]}")
    total = sum(found.values())
    print(f"\n{'would silence' if args.dry else 'silenced'}: {total} clips"
          f" | mp3s {'to delete' if args.dry else 'deleted'}: {deleted}"
          + (f" | already absent: {missing}" if missing else "")
          + ("" if args.dry else f" | unit files rewritten: {touched_files}"))
    if args.dry:
        print("\nnothing was changed (--dry)")


if __name__ == "__main__":
    main()
