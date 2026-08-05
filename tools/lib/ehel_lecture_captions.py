"""Caption cues for the English teacher lectures — the one definition.

A lecture's narration is written one paragraph per slide, and the first version
of the caption writer emitted one cue per slide: the whole paragraph, held for
the whole slide. WebVTT renders a cue in full for its entire duration, so a
585-character cue covered the slide it was captioning. Every cue in every
lecture was like that — 448 of 448 over 200 characters, the worst 924 characters
held for 65 seconds.

So a cue is cut here to roughly one sentence (long sentences split again at
clause boundaries), and the slide's time span is shared out between the pieces
in proportion to their length. That timing is estimated rather than measured,
which is the same estimate the slide durations themselves already rest on
(word-count weighting of the total audio length in
create-ehel-english-unit-lecture.py) — no new class of error, and a sentence
landing a little early beats a paragraph landing on top of the video.

Imported by both create-ehel-english-unit-lecture.py (so new lectures are born
correct) and recut-ehel-lecture-captions.py (so the 64 already rendered are
fixed without re-narrating or re-encoding anything). Deliberately dependency
free: the re-cut tool must not need PIL or ffmpeg to split text.
"""

from __future__ import annotations

import re

# One cue is about two comfortable lines. The lectures' sentences are a median
# 84 characters and 90% are under 145, so most cues end up a whole sentence.
MAX_CUE_CHARS = 120
# Above this a cue is wrapped onto two lines explicitly, rather than leaving the
# player to wrap where it likes — a balanced two-line box stays the same shape
# from cue to cue instead of flicking between one line and three.
MAX_LINE_CHARS = 62
# Matches the gap the caption writer already left between slides.
CUE_GAP_SECONDS = 0.08

# A sentence, including any closing quote or bracket that follows its full stop:
# the lectures quote model sentences ("The student is showing respect."), and a
# naive split on whitespace-after-period leaves the quote mark orphaned.
SENTENCE = re.compile(r'.+?[.!?…]+["”’\')\]]*(?:\s+|$)', re.S)
# Clause boundaries, in the order they are tried when one sentence is too long
# for a single cue. Em dash first: in this material it separates the most
# complete thoughts ("respect, honour, and duty — the values that…").
CLAUSE = re.compile(r'(?<=[—;:,])\s+')


def split_sentences(text: str) -> list[str]:
    """Split narration into sentences, keeping any trailing remainder."""
    body = re.sub(r'\s+', ' ', str(text or '')).strip()
    if not body:
        return []
    sentences = [match.group().strip() for match in SENTENCE.finditer(body)]
    consumed = sum(len(s) for s in sentences)
    if consumed < len(body.replace('  ', ' ')):
        tail = SENTENCE.sub('', body).strip()
        if tail:
            sentences.append(tail)
    return [s for s in sentences if s]


def _split_long(piece: str, max_chars: int) -> list[str]:
    """Break one over-long sentence at clause boundaries, then at words."""
    parts = CLAUSE.split(piece)
    chunks: list[str] = []
    current = ''
    for part in parts:
        candidate = f'{current} {part}'.strip()
        if current and len(candidate) > max_chars:
            chunks.append(current)
            current = part
        else:
            current = candidate
    if current:
        chunks.append(current)
    # A clause can still be longer than a cue (a long list, no punctuation).
    # Falling back to words guarantees termination; nothing is ever dropped.
    final: list[str] = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            final.append(chunk)
            continue
        words = chunk.split(' ')
        current = ''
        for word in words:
            candidate = f'{current} {word}'.strip()
            if current and len(candidate) > max_chars:
                final.append(current)
                current = word
            else:
                current = candidate
        if current:
            final.append(current)
    return final


def chunk_narration(text: str, max_chars: int = MAX_CUE_CHARS) -> list[str]:
    """Narration -> cue-sized pieces, in order, losing no words."""
    chunks: list[str] = []
    for sentence in split_sentences(text):
        if len(sentence) <= max_chars:
            chunks.append(sentence)
        else:
            chunks.extend(_split_long(sentence, max_chars))
    return chunks


def balance_lines(chunk: str, max_line: int = MAX_LINE_CHARS) -> str:
    """Wrap a cue onto two balanced lines when it is too wide for one."""
    if len(chunk) <= max_line:
        return chunk
    words = chunk.split(' ')
    target = len(chunk) / 2
    best_index, best_gap = 1, None
    length = 0
    for index, word in enumerate(words[:-1]):
        length += len(word) + 1
        gap = abs(length - target)
        if best_gap is None or gap < best_gap:
            best_gap, best_index = gap, index + 1
    return f"{' '.join(words[:best_index])}\n{' '.join(words[best_index:])}"


def caption_cues(text, start: float, end: float,
                 max_chars: int = MAX_CUE_CHARS,
                 gap: float = CUE_GAP_SECONDS) -> list[tuple[float, float, str]]:
    """One slide's narration as (start, end, body) cues filling [start, end).

    The span is shared out by character count, so a long sentence holds the
    screen longer than a short one — the closest stand-in for speech rate
    available without word-level timings from the voice provider.
    """
    chunks = chunk_narration(text, max_chars)
    if not chunks:
        return []
    span = max(0.0, end - start)
    total = sum(len(chunk) for chunk in chunks) or 1
    cues: list[tuple[float, float, str]] = []
    cursor = start
    for index, chunk in enumerate(chunks):
        # The last cue takes whatever is left, so rounding never leaves a
        # silent tail or overruns the slide.
        stop = end if index == len(chunks) - 1 else cursor + span * len(chunk) / total
        cues.append((cursor, max(cursor, stop - gap), balance_lines(chunk)))
        cursor = stop
    return cues


def parse_time(value: str) -> float:
    parts = value.strip().split(':')
    seconds = float(parts[-1])
    minutes = int(parts[-2]) if len(parts) > 1 else 0
    hours = int(parts[-3]) if len(parts) > 2 else 0
    return hours * 3600 + minutes * 60 + seconds


def parse_cues(text: str) -> list[tuple[float, float, str]]:
    """Every cue in a WEBVTT document as (start, end, body)."""
    cues: list[tuple[float, float, str]] = []
    for block in str(text).replace('\r\n', '\n').split('\n\n'):
        lines = [line for line in block.strip().split('\n') if line.strip()]
        if not lines or lines[0].startswith('WEBVTT'):
            continue
        timing_index = next((i for i, line in enumerate(lines) if '-->' in line), None)
        if timing_index is None:
            continue
        # Cue settings (align:, line:, …) may follow the timestamps. These
        # lectures use none, and dropping them silently would be a change no
        # caller asks for, so refuse the file rather than quietly reformat it.
        timing = lines[timing_index]
        start_text, _, end_text = timing.partition('-->')
        if len(end_text.split()) > 1:
            raise ValueError(f'cue settings are not handled: {timing.strip()}')
        body = ' '.join(lines[timing_index + 1:]).strip()
        if body:
            cues.append((parse_time(start_text), parse_time(end_text), body))
    return cues


def slide_spans(cues) -> list[tuple[float, float]]:
    """Recover the slide boundaries from a re-cut caption file.

    A lecture's slide times are not recorded anywhere else, and they cannot be
    recomputed: word-count weighting reproduces some lectures exactly and misses
    others by over five seconds. They are still readable here because the split
    preserved every original cue's start, and a slide change therefore shows a
    DOUBLE gap — this module's own gap plus the one the caption writer already
    left between slides — against a single gap inside a slide.

    This is a migration path, not a foundation: the slide times belong in
    lecture-media.json, which is what backfill-ehel-lecture-slides.py uses this
    for, once.
    """
    if not cues:
        return []
    starts = [0]
    for index in range(1, len(cues)):
        if cues[index][0] - cues[index - 1][1] > CUE_GAP_SECONDS * 1.5:
            starts.append(index)
    spans = []
    for position, first in enumerate(starts):
        last = starts[position + 1] - 1 if position + 1 < len(starts) else len(cues) - 1
        spans.append((cues[first][0], cues[last][1] + CUE_GAP_SECONDS))
    return spans


def format_time(seconds: float) -> str:
    """WEBVTT timestamp (mirrors vtt_time() in the lecture generator)."""
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f'{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}'


def render_vtt(cues) -> str:
    """A complete WEBVTT document from (start, end, body) triples."""
    lines = ['WEBVTT', '']
    for index, (start, end, body) in enumerate(cues, start=1):
        lines.extend([str(index), f'{format_time(start)} --> {format_time(end)}', body, ''])
    return '\n'.join(lines)
