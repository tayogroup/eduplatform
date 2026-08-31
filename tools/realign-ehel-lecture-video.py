#!/usr/bin/env python
"""Re-time an ALREADY RENDERED teacher lecture against the voice recorded for it.

Since 2026-08-31 create-ehel-english-unit-lecture.py measures the slide times as
it renders, using the same ehel_lecture_alignment this does, so a lecture is born
aligned and does not need this. It is kept for the lectures rendered before that,
because re-timing them costs no ElevenLabs spend and re-narrating them would.

The renderer used to send the whole narration to ElevenLabs in one request and
then decide how long each slide stays on screen by WORD COUNT — every word
assumed to take the same time. Speech does not work that way: measured against
the audio, the picture ran up to 5.9 seconds away from the voice, and only 68 of
384 slide changes across the seven grades landed in a pause at all, against an
18% chance baseline. The captions were written from the same estimate, so they
drifted with it.

This measures the real timings instead of guessing them, and rebuilds around
them:

  * Whisper (already installed here) transcribes the EXISTING audio with word
    timestamps; the script of each slide is aligned to that transcript, so every
    slide's true start is read off the recording.
  * The video is re-rendered with those durations. Slides are re-drawn from
    teacher-lecture-script.json — the record of what was actually narrated, not
    the unit data, which may have moved since — and the original audio stream is
    copied in untouched. Nothing is re-narrated: no ElevenLabs spend, same voice.
  * The captions are rewritten from the same word timestamps, so a cue now
    appears when its words are spoken rather than when a word count guessed.
  * lecture-media.json gets the corrected lectureSlides. The player reads them
    to label the slide being watched and to drive its arrows; it plays
    straight through and no longer stops on them.

Silence detection was tried first and rejected: paragraph pauses are not longer
than sentence pauses in this narration (shortest kept 0.90s against longest
dropped 0.87s), so "snap to the nearest gap" snaps confidently to the wrong one.

Usage:
  python tools/realign-ehel-lecture-video.py --grades 3 --units 1 --dry
  python tools/realign-ehel-lecture-video.py --grades 3 --units 1
  python tools/realign-ehel-lecture-video.py            # every lecture
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from ehel_lecture_captions import chunk_narration, balance_lines, render_vtt  # noqa: E402
import ehel_lecture_alignment as alignment_lib  # noqa: E402

ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
# Every piece of the measurement — the alignment, where a slide should change,
# and the caption times that follow from it — lives in ehel_lecture_alignment,
# because create-ehel-english-unit-lecture.py needs the same answers. It used to
# live here alone, and that is exactly how a re-render on 2026-08-17 quietly put
# the word-count estimate back into all 64 lectures this tool had corrected.


def generator():
    """The lecture renderer, imported for its slide drawing (hyphenated name)."""
    path = Path(__file__).resolve().parent / "create-ehel-english-unit-lecture.py"
    spec = importlib.util.spec_from_file_location("ehel_lecture_generator", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=True, capture_output=True, text=True)


def audio_duration(path: Path) -> float:
    out = run("ffprobe", "-v", "error", "-select_streams", "a:0",
              "-show_entries", "stream=duration", "-of", "csv=p=0", str(path))
    return float(out.stdout.strip())


def rebuild(grade: int, unit_number: int, model, dry: bool) -> dict | None:
    gen = generator()
    grade_root = ENGLISH / f"grade-{grade}"
    media_dir = grade_root / "media" / f"unit-{unit_number}"
    video_path = media_dir / "teacher-lecture.mp4"
    script_path = media_dir / "teacher-lecture-script.json"
    if not video_path.exists() or not script_path.exists():
        return None
    slides = json.loads(script_path.read_text(encoding="utf-8"))["slides"]
    duration = audio_duration(video_path)

    with tempfile.TemporaryDirectory() as work:
        work_dir = Path(work)
        wav = work_dir / "narration.wav"
        alignment_lib.extract_wav(video_path, wav)
        spoken = alignment_lib.transcribe(wav, model)
        script_words, ranges = alignment_lib.slide_word_ranges(slides)
        alignment = alignment_lib.Alignment(script_words, spoken, duration)

        switches = alignment_lib.switch_times(slides, ranges, alignment)

        old = json.loads((grade_root / "data" / "lecture-media.json").read_text(encoding="utf-8"))
        old_slides = old["units"].get(str(unit_number), {}).get("lectureSlides") or []
        drift = [round(old_slides[i]["start"] - switches[i], 1)
                 for i in range(min(len(old_slides), len(switches)))] if old_slides else []

        new_slides = alignment_lib.slide_times(slides, switches, duration)
        report = {"grade": grade, "unit": unit_number, "slides": len(slides),
                  "matched": f"{alignment.matched}/{alignment.count} words",
                  "picture was behind by": drift}
        if dry:
            return report

        # Re-render the slides from the script that was narrated, at the sizes
        # the renderer itself uses, then hold each for its measured duration.
        unit = json.loads((grade_root / "data" / "units" / f"unit-{unit_number}.json").read_text(encoding="utf-8"))
        background = gen.Image.open(gen.resolve_asset(grade_root, unit["visual"]["image"]))
        concat_lines: list[str] = []
        for index, slide in enumerate(slides):
            image = work_dir / f"slide-{index + 1:02d}.png"
            gen.render_slide(slide, index, len(slides), background).save(image)
            hold = new_slides[index]["end"] - new_slides[index]["start"]
            concat_lines.extend([f"file '{image.as_posix()}'", f"duration {hold:.3f}"])
        concat_lines.append(f"file '{(work_dir / f'slide-{len(slides):02d}.png').as_posix()}'")
        concat = work_dir / "slides.txt"
        concat.write_text("\n".join(concat_lines), encoding="utf-8")

        rebuilt = work_dir / "teacher-lecture.mp4"
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(video_path),
            "-map", "0:v:0", "-map", "1:a:0",
            "-vf", "fps=12,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            # The audio is copied, never re-encoded: this run must not touch the
            # recording it is measuring.
            # -t for the same reason as the generator: -shortest alone leaves the
            # closing slide held in silence past the end of the audio.
            "-t", f"{duration:.3f}",
            "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(rebuilt))
        shutil.copyfile(rebuilt, video_path)

    cues = alignment_lib.caption_cues_from_alignment(
        slides, ranges, alignment, switches, duration, chunk_narration, balance_lines)
    (media_dir / "teacher-lecture.vtt").write_text(render_vtt(cues), encoding="utf-8")

    manifest_path = grade_root / "data" / "lecture-media.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    entry = manifest["units"].get(str(unit_number))
    if entry is None:
        # Grade 8 Unit 1 has a rendered lecture on disk that the manifest never
        # listed. Creating an entry here would be publishing it — a decision
        # about what learners see, not a re-timing — and a stub carrying only
        # lectureSlides is worse still: it looks configured and plays nothing.
        report["note"] = "no manifest entry; video and captions re-timed, lectureSlides not written"
        return report
    entry["lectureSlides"] = new_slides
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    report["cues"] = len(cues)
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grades", nargs="*", type=int)
    parser.add_argument("--units", nargs="*", type=int)
    parser.add_argument("--model", default="base", help="Whisper model (base is enough for alignment)")
    parser.add_argument("--dry", action="store_true", help="measure and report, change nothing")
    args = parser.parse_args()

    model = alignment_lib.load_model(args.model)

    done = 0
    for grade in args.grades or range(1, 9):
        media_root = ENGLISH / f"grade-{grade}" / "media"
        if not media_root.exists():
            continue
        units = args.units or sorted(
            int(path.name.split("-")[1]) for path in media_root.glob("unit-*")
            if (path / "teacher-lecture.mp4").exists()
        )
        for unit_number in units:
            report = rebuild(grade, unit_number, model, args.dry)
            if report is None:
                continue
            done += 1
            print(json.dumps(report), flush=True)
    print(f"\n{'measured' if args.dry else 'rebuilt'}: {done} lectures")


if __name__ == "__main__":
    main()
