#!/usr/bin/env python
"""Record each lecture's slide times in lecture-media.json.

The lecture player walks a lecture slide by slide, which needs to know where
each slide starts and ends. Those times were never stored: the renderer used
them to lay out the video and then threw them away. They cannot be recomputed
either — reproducing them by word-count weighting matches some lectures to the
millisecond and misses others by more than five seconds.

They survive in the caption file, because a slide change leaves a double gap
between cues (see ehel_lecture_captions.slide_spans). This reads them from there
once and writes them into lecture-media.json, which the app already fetches, so
nothing downstream has to infer a slide boundary from a gap width ever again.
create-ehel-english-unit-lecture.py writes the same field directly for lectures
rendered from now on, where the durations are known exactly.

Usage:
  python tools/backfill-ehel-lecture-slides.py --dry
  python tools/backfill-ehel-lecture-slides.py
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from ehel_lecture_captions import parse_cues, slide_spans  # noqa: E402

ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"


def slides_for_unit(media_dir: Path) -> list[dict] | None:
    """[{start, end, title}] for one lecture, or None when it cannot be read."""
    captions = media_dir / "teacher-lecture.vtt"
    script = media_dir / "teacher-lecture-script.json"
    if not captions.exists() or not script.exists():
        return None
    spans = slide_spans(parse_cues(captions.read_text(encoding="utf-8")))
    slides = json.loads(script.read_text(encoding="utf-8")).get("slides", [])
    if not spans or len(spans) != len(slides):
        # Refuse rather than guess: a player that pauses on the wrong frame is
        # worse than one that falls back to playing straight through.
        #
        # The usual cause is that the lecture has since been REALIGNED. This tool
        # reads slide boundaries from the gap between cues, which only carries
        # that signal in captions written by the proportional splitter. Realigned
        # captions are timed from the words actually spoken, so every sentence
        # pause looks like a slide change and the count comes out far too high
        # (Grade 8 Unit 1: 30 groups for a 7-slide lecture). Realign is also the
        # remedy — it knows the true boundaries and writes them itself.
        print(f"  SKIP {media_dir.name}: {len(spans)} caption groups vs {len(slides)} slides")
        if len(spans) > len(slides):
            grade = media_dir.parents[1].name.replace("grade-", "")
            unit = media_dir.name.replace("unit-", "")
            print(f"       these captions look realigned; use instead:")
            print(f"       python tools/realign-ehel-lecture-video.py --grades {grade} --units {unit}")
        return None
    return [
        {"start": round(start, 3), "end": round(end, 3), "title": slide.get("title", "")}
        for (start, end), slide in zip(spans, slides)
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true", help="report, write nothing")
    parser.add_argument("--grades", nargs="*", type=int)
    args = parser.parse_args()

    written = skipped = unchanged = 0
    for grade in args.grades or range(1, 9):
        manifest_path = ENGLISH / f"grade-{grade}" / "data" / "lecture-media.json"
        if not manifest_path.exists():
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        changed = False
        for unit_number, entry in sorted(manifest.get("units", {}).items(), key=lambda kv: int(kv[0])):
            if entry.get("lectureMode") != "video":
                continue
            slides = slides_for_unit(ENGLISH / f"grade-{grade}" / "media" / f"unit-{unit_number}")
            if slides is None:
                skipped += 1
                continue
            if entry.get("lectureSlides") == slides:
                unchanged += 1
                continue
            print(f"grade {grade} unit {unit_number}: {len(slides)} slides, "
                  f"{slides[0]['start']:.1f}s–{slides[-1]['end']:.1f}s")
            entry["lectureSlides"] = slides
            changed = True
            written += 1
        if changed and not args.dry:
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"\n{'would write' if args.dry else 'wrote'}: {written} | already current: {unchanged} | skipped: {skipped}")


if __name__ == "__main__":
    main()
