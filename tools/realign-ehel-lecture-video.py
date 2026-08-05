#!/usr/bin/env python
"""Re-time a teacher lecture against the voice that was actually recorded.

The lecture renderer sends the whole narration to ElevenLabs in one request and
then decides how long each slide stays on screen by WORD COUNT — every word
assumed to take the same time. Speech does not work that way, and the error
accumulates: measured against the audio, the picture runs up to 8.2 seconds
behind the voice, so a learner hears the next slide's opening sentence while the
previous slide is still up. The captions were written from the same estimate, so
they drift with it.

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
  * lecture-media.json gets the corrected lectureSlides the player pauses on.

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
import difflib
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from ehel_lecture_captions import chunk_narration, balance_lines, render_vtt  # noqa: E402

ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
# The picture should change in the pause BEFORE the next slide is spoken, never
# after its first word — a slide arriving late is exactly the defect being fixed.
SWITCH_LEAD_SECONDS = 0.25


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


def normalise(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def transcribe(wav: Path, model) -> list[tuple[float, float, str]]:
    result = model.transcribe(str(wav), word_timestamps=True, language="en", fp16=False)
    words = []
    for segment in result["segments"]:
        for word in segment.get("words", []):
            token = normalise(word["word"])
            if token:
                words.append((float(word["start"]), float(word["end"]), token))
    return words


class Alignment:
    """Maps a position in the written script to a time in the recording.

    Whisper mishears the odd word, so this aligns the two word sequences with
    difflib and interpolates across the gaps rather than demanding an exact
    match — one misheard word must not throw a slide boundary.
    """

    def __init__(self, script_words: list[str], spoken: list[tuple[float, float, str]], duration: float):
        self.duration = duration
        self.starts: dict[int, float] = {}
        self.ends: dict[int, float] = {}
        spoken_words = [w for _, _, w in spoken]
        matcher = difflib.SequenceMatcher(None, script_words, spoken_words, autojunk=False)
        for script_index, spoken_index, size in matcher.get_matching_blocks():
            for offset in range(size):
                self.starts[script_index + offset] = spoken[spoken_index + offset][0]
                self.ends[script_index + offset] = spoken[spoken_index + offset][1]
        self.count = len(script_words)
        self.matched = len(self.starts)

    def _lookup(self, table: dict[int, float], index: int) -> float:
        if index in table:
            return table[index]
        before = max((i for i in table if i < index), default=None)
        after = min((i for i in table if i > index), default=None)
        if before is None and after is None:
            return 0.0
        if before is None:
            return table[after]
        if after is None:
            return table[before]
        # Linear interpolation across the unmatched run.
        span = (table[after] - table[before]) / (after - before)
        return table[before] + span * (index - before)

    def start_of(self, index: int) -> float:
        return self._lookup(self.starts, index)

    def end_of(self, index: int) -> float:
        return self._lookup(self.ends, index)


def slide_word_ranges(slides: list[dict]) -> tuple[list[str], list[tuple[int, int]]]:
    """All script words in order, plus each slide's [first, last] index."""
    words: list[str] = []
    ranges: list[tuple[int, int]] = []
    for slide in slides:
        first = len(words)
        for raw in slide["narration"].split():
            token = normalise(raw)
            if token:
                words.append(token)
        ranges.append((first, len(words) - 1))
    return words, ranges


def caption_cues_from_alignment(slides, ranges, alignment, switches, duration):
    """Sentence-sized cues timed by the words actually spoken."""
    cues: list[tuple[float, float, str]] = []
    for slide_index, slide in enumerate(slides):
        first = ranges[slide_index][0]
        cursor = first
        chunks = chunk_narration(slide["narration"])
        slide_end = switches[slide_index + 1] if slide_index + 1 < len(switches) else duration
        for chunk in chunks:
            length = len([w for w in (normalise(x) for x in chunk.split()) if w])
            if not length:
                continue
            start = alignment.start_of(cursor)
            end = alignment.end_of(cursor + length - 1)
            cursor += length
            # Never let a cue outlive its slide or run backwards over the last.
            end = min(max(end, start + 0.4), slide_end)
            if cues and start < cues[-1][1]:
                start = cues[-1][1]
            if end <= start:
                continue
            cues.append((start, end, balance_lines(chunk)))
    return cues


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
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video_path),
            "-vn", "-ac", "1", "-ar", "16000", str(wav))
        spoken = transcribe(wav, model)
        script_words, ranges = slide_word_ranges(slides)
        alignment = Alignment(script_words, spoken, duration)

        # Where the picture should change: in the pause before the next slide is
        # spoken, halfway back towards the previous slide's last word.
        switches = [0.0]
        for index in range(1, len(slides)):
            next_start = alignment.start_of(ranges[index][0])
            previous_end = alignment.end_of(ranges[index - 1][1])
            if previous_end < next_start:
                switch = min(next_start - SWITCH_LEAD_SECONDS, (previous_end + next_start) / 2)
            else:
                switch = next_start - SWITCH_LEAD_SECONDS
            switches.append(max(switches[-1] + 0.5, switch))

        old = json.loads((grade_root / "data" / "lecture-media.json").read_text(encoding="utf-8"))
        old_slides = old["units"].get(str(unit_number), {}).get("lectureSlides") or []
        drift = [round(old_slides[i]["start"] - switches[i], 1)
                 for i in range(min(len(old_slides), len(switches)))] if old_slides else []

        new_slides = [
            {"start": round(switches[index], 3),
             "end": round(switches[index + 1] if index + 1 < len(switches) else duration, 3),
             "title": slide.get("title", "")}
            for index, slide in enumerate(slides)
        ]
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
            "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(rebuilt))
        shutil.copyfile(rebuilt, video_path)

    cues = caption_cues_from_alignment(slides, ranges, alignment, switches, duration)
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

    import whisper
    model = whisper.load_model(args.model)

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
