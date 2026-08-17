#!/usr/bin/env python3
"""Which English teacher lectures no longer say what their unit says?

The lecture generator (create-ehel-english-unit-lecture.py) writes the narration
it spoke into media/unit-N/teacher-lecture-script.json. Nothing compared that
against the unit afterwards, so a lecture kept naming "Mail carriers", "janitor"
and "source text 1" for as long as nobody happened to listen. This rebuilds the
slides from the CURRENT unit JSON with the generator's own build_slides() and
diffs the narration against the recorded script — the same idea as
check-english-audio-staleness.py, for the one narrated thing that check does
not cover.

Prints one line per stale lecture (grade, unit, first differing slide) and exits
1 if any; --render prints the exact re-render commands.

Usage: python tools/check-english-lecture-staleness.py [--grades 1 4] [--render]
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"

spec = importlib.util.spec_from_file_location("lecture", ROOT / "tools" / "create-ehel-english-unit-lecture.py")
lecture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lecture)


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--grades", nargs="*", type=int, default=list(range(1, 9)))
    ap.add_argument("--render", action="store_true")
    args = ap.parse_args()
    stale, checked, missing = [], 0, 0
    for grade in args.grades:
        groot = ENGLISH / f"grade-{grade}"
        manifest_path = groot / "data" / "lecture-media.json"
        if not manifest_path.exists():
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        dictionary = json.loads((groot / "data" / f"master-dictionary.grade{grade}.json").read_text(encoding="utf-8"))
        for unit_no in manifest.get("units", {}):
            script_path = groot / "media" / f"unit-{unit_no}" / "teacher-lecture-script.json"
            unit_path = groot / "data" / "units" / f"unit-{unit_no}.json"
            if not script_path.exists() or not unit_path.exists():
                missing += 1
                continue
            checked += 1
            recorded = json.loads(script_path.read_text(encoding="utf-8"))["slides"]
            try:
                now = lecture.build_slides(json.loads(unit_path.read_text(encoding="utf-8")), dictionary)
            except SystemExit as e:  # placeholder titles etc. — the generator refuses
                stale.append((grade, unit_no, f"generator refuses: {e}"))
                continue
            for i, (a, b) in enumerate(zip(recorded, now)):
                if norm(a["narration"]) != norm(b["narration"]):
                    stale.append((grade, unit_no, f"slide {i + 1} ({b['kicker']}): now says “{norm(b['narration'])[:90]}…”"))
                    break
            else:
                if len(recorded) != len(now):
                    stale.append((grade, unit_no, "slide count differs"))
    print(f"checked {checked} lecture(s), {missing} without a script")
    if not stale:
        print("──────── ok ──────── every lecture says what its unit says")
        return
    print(f"──────── STALE: {len(stale)} lecture(s) ────────")
    for g, u, why in stale:
        print(f"  grade {g} unit {u}: {why}")
    if args.render:
        print("\nre-render with:")
        for g, u, _ in stale:
            print(f"  python tools/create-ehel-english-unit-lecture.py --grade {g} --unit {u}")
        print("then: node tools/version-lecture-captions.js")
    sys.exit(1)


if __name__ == "__main__":
    main()
