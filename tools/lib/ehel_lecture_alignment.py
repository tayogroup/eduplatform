"""Where each slide of an English teacher lecture actually changes — the one definition.

The lecture renderer sends the whole narration to ElevenLabs in ONE request, so
the recording is a single continuous take and nothing in it says where one slide
ends and the next begins. The renderer used to decide that by WORD COUNT — every
word assumed to take the same time — and speech does not work that way. Measured
against the recording with the alignment below, the picture ran up to 5.9 seconds
away from the voice, and only 68 of 384 slide changes landed in a pause at all:
silence is 18% of a lecture's timeline and 18% of slide changes fell in one,
which is chance. The other 316 cut a sentence in half.

So the times are MEASURED here instead of guessed. Whisper (already installed,
local, no API spend) transcribes the audio with word timestamps and the written
script is aligned to that transcript, which gives every slide's true first and
last word.

This module is imported by BOTH:

  * create-ehel-english-unit-lecture.py, so a lecture is born aligned, and
  * realign-ehel-lecture-video.py, which re-times lectures already rendered.

That sharing is the point, and it is what was missing. The realign tool existed
from 2026-08-05 and worked; the 2026-08-17 and 2026-08-18 re-renders then rebuilt
all 64 lectures from the generator and put the word-count estimate back. A repair
living outside the thing that builds the artefact is undone by the next build,
silently — the same shape as Mathematics' in-place repair tools and its
`build:math --force` guard. Now there is one definition and a re-render cannot
lose it.

Silence detection was tried first, twice, and rejected both times: paragraph
pauses in this narration are not longer than sentence pauses (shortest kept
0.90s against longest dropped 0.87s), so "snap to the nearest gap" snaps
confidently to the wrong one.
"""

from __future__ import annotations

import difflib
import re
import subprocess
from pathlib import Path

# The picture should change in the pause BEFORE the next slide is spoken, never
# after its first word — a slide arriving late is exactly the defect being fixed.
SWITCH_LEAD_SECONDS = 0.25
# No slide may be shorter than this, whatever the alignment says. Guards against
# a badly misheard run collapsing two boundaries onto each other.
MIN_SLIDE_SECONDS = 0.5


def normalise(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def extract_wav(source: Path, dest: Path, ffmpeg: str = "ffmpeg") -> Path:
    """Whisper's input: mono 16 kHz, straight out of the rendered audio or video."""
    subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
         "-vn", "-ac", "1", "-ar", "16000", str(dest)],
        check=True, capture_output=True, text=True,
    )
    return dest


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

    Whisper mishears the odd word, and the text SENT to the voice is not quite
    the text written on the slide (speakable_blanks and speakable_letter_ranges
    rewrite "___" and "A-Z" before the request), so this aligns the two word
    sequences with difflib and interpolates across the gaps rather than
    demanding an exact match — one misheard word must not throw a slide
    boundary. Typical match rate on these lectures is 97%.
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


def switch_times(slides, ranges, alignment: Alignment) -> list[float]:
    """When the picture should change, one time per slide, the first at 0.

    In the pause before the next slide is spoken, halfway back towards the
    previous slide's last word — so the change lands in silence rather than
    over either slide's words.
    """
    switches = [0.0]
    for index in range(1, len(slides)):
        next_start = alignment.start_of(ranges[index][0])
        previous_end = alignment.end_of(ranges[index - 1][1])
        if previous_end < next_start:
            switch = min(next_start - SWITCH_LEAD_SECONDS, (previous_end + next_start) / 2)
        else:
            switch = next_start - SWITCH_LEAD_SECONDS
        switches.append(max(switches[-1] + MIN_SLIDE_SECONDS, switch))
    return switches


def slide_times(slides, switches, duration: float) -> list[dict]:
    """lectureSlides for lecture-media.json: contiguous {start, end, title}."""
    return [
        {"start": round(switches[index], 3),
         "end": round(switches[index + 1] if index + 1 < len(switches) else duration, 3),
         "title": slide.get("title", "")}
        for index, slide in enumerate(slides)
    ]


def hold_durations(switches, duration: float) -> list[float]:
    """How long each slide image is held, for the ffmpeg concat demuxer."""
    edges = list(switches) + [duration]
    return [edges[index + 1] - edges[index] for index in range(len(switches))]


def caption_cues_from_alignment(slides, ranges, alignment, switches, duration,
                                chunk_narration, balance_lines):
    """Sentence-sized cues timed by the words actually spoken.

    The chunker is passed in rather than imported so this module stays free of
    the caption module and the two can be read independently; both callers
    already have ehel_lecture_captions open.
    """
    cues: list[tuple[float, float, str]] = []
    for slide_index, slide in enumerate(slides):
        cursor = ranges[slide_index][0]
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


def load_model(name: str = "base"):
    """Whisper, or a message naming what to install.

    Loaded BEFORE any ElevenLabs request in the generator: discovering that the
    aligner is unavailable after the narration has been bought is a bill for a
    lecture that cannot be finished.
    """
    try:
        import whisper
    except ImportError as error:  # pragma: no cover - environment, not logic
        raise SystemExit(
            "openai-whisper is required to time a lecture's slides against its narration.\n"
            "  pip install openai-whisper\n"
            "Slide times are not estimated instead: word-count weighting is the "
            "defect this replaces (up to 5.9s out, 82% of slide changes mid-sentence)."
        ) from error
    return whisper.load_model(name)
