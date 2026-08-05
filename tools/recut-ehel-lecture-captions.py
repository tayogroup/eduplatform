#!/usr/bin/env python
"""Re-cut existing teacher-lecture caption files into sentence-sized cues.

The lectures rendered before the caption fix carry one cue per slide: a whole
narration paragraph held for the whole slide, which WebVTT renders in full and
which therefore covers the video (see tools/lib/ehel_lecture_captions.py).

This rewrites the .vtt files only. The mp4, the narration audio and the slide
timings are untouched, so nothing is re-encoded and nothing is re-narrated: each
existing cue keeps its own [start, end) span, and that span is shared out
between the sentences inside it. Idempotent — a file whose cues are already
under the limit splits into itself and is reported as unchanged.

Usage:
  python tools/recut-ehel-lecture-captions.py --dry
  python tools/recut-ehel-lecture-captions.py
  python tools/recut-ehel-lecture-captions.py --grades 3 4
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from ehel_lecture_captions import MAX_CUE_CHARS, caption_cues, parse_cues, render_vtt  # noqa: E402

ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"


def recut(path: Path) -> tuple[int, int, int]:
    """Returns (cues before, cues after, longest cue before)."""
    original = path.read_text(encoding="utf-8")
    cues = parse_cues(original)
    longest = max((len(body) for _, _, body in cues), default=0)
    rebuilt: list[tuple[float, float, str]] = []
    for start, end, body in cues:
        rebuilt.extend(caption_cues(body, start, end))
    return cues, rebuilt, longest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true", help="report, write nothing")
    parser.add_argument("--grades", nargs="*", type=int, help="limit to these grades")
    args = parser.parse_args()

    grades = args.grades or list(range(1, 9))
    files = sorted(
        path
        for grade in grades
        for path in ENGLISH.glob(f"grade-{grade}/media/unit-*/teacher-lecture.vtt")
    )
    if not files:
        raise SystemExit("no teacher-lecture.vtt files found for those grades")

    changed = unchanged = 0
    before_total = after_total = 0
    worst = 0
    for path in files:
        cues, rebuilt, longest = recut(path)
        before_total += len(cues)
        after_total += len(rebuilt)
        worst = max(worst, longest)
        if len(rebuilt) == len(cues) and longest <= MAX_CUE_CHARS:
            unchanged += 1
            continue
        changed += 1
        label = path.relative_to(ENGLISH).as_posix()
        print(f"{label}: {len(cues)} -> {len(rebuilt)} cues (longest was {longest} chars)")
        if not args.dry:
            path.write_text(render_vtt(rebuilt), encoding="utf-8")

    print(f"\n{'would rewrite' if args.dry else 'rewrote'}: {changed} | already fine: {unchanged}")
    print(f"cues {before_total} -> {after_total} | longest cue before: {worst} chars"
          f" | cue limit: {MAX_CUE_CHARS}")


if __name__ == "__main__":
    main()
