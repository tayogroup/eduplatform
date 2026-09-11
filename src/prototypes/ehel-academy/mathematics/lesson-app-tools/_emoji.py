# -*- coding: utf-8 -*-
"""Which emoji a school tablet cannot draw, and what a sticker shelf holds.

Shared by check-lessons.py (the opt-in "emojiBaseline" and "uniqueStickers"
assertions) and replace-new-emoji-all-grades.py.

THE BASELINE IS EMOJI 5.0 (Unicode 10, 2017). Every Android and iOS font has
carried it since then; the older Android tablets schools run commonly stop
there, and a glyph past it is drawn as an empty box. Grade 1's own
replace-new-emoji.py set the line on 2026-09-11 and this module is that line
written down once.

LATE is every emoji code point added in Unicode 11 or later, block by block -
not "anything above U+1F90C", because the same blocks hold Emoji 3.0 and 5.0
glyphs that every tablet has (1F950-1F96B, 1F980-1F997, 1F9D0-1F9E6).
265F and 267E are old characters that only BECAME emoji in 11.0; an old font
draws them as a text symbol rather than a box, but a picture a child is meant
to read should not depend on that either.

A glyph hides in four spellings in these builds, and a check that reads only
the literal character is blind to three of them - which is how 🧮, 🧱, 🧺 and
🪜 sat in Grade 4's compose table as \\U0001f9ee escapes while a scan of the
sources reported them absent:
    the character itself          🧮
    a JS surrogate pair           \\ud83e\\uddee
    a JS code point escape        \\u{1F9EE}
    an HTML numeric reference     &#x1F9EE;  &#129518;
"""
import re

LATE = [
    (0x1F90C, 0x1F90F), (0x1F93F, 0x1F93F), (0x1F94D, 0x1F94F),
    (0x1F96C, 0x1F97F), (0x1F998, 0x1F9BF), (0x1F9C1, 0x1F9CF),
    (0x1F9E7, 0x1F9FF), (0x1FA70, 0x1FAFF), (0x1F7E0, 0x1F7FF),
    (0x1F6D5, 0x1F6DF), (0x1F6F9, 0x1F6FF), (0x265F, 0x265F), (0x267E, 0x267E),
]


def is_late(cp):
    return any(a <= cp <= b for a, b in LATE)


_PAIR = re.compile(r"\\u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})")
_CPESC = re.compile(r"\\u\{([0-9a-fA-F]{4,6})\}")
_HEX = re.compile(r"&#[xX]([0-9a-fA-F]+);")
_DEC = re.compile(r"&#([0-9]+);")


def _pair(m):
    s, a, b = m.string, m.start(), m.end()
    if s[b:b + 1] == "-" or s[a - 1:a] == "-":
        return m.group(0)   # a range bound, as in _cpesc below
    hi, lo = int(m.group(1), 16), int(m.group(2), 16)
    return chr(0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00))


def _cpesc(m):
    # A BOUND OF A REGEX RANGE IS NOT A PICTURE. Every page carries the voice
    # engine's /[\u{1F000}-\u{1FAFF}...]/u, which strips pictographs before a
    # line is spoken; decoding its upper bound reported U+1FAFF on all 33
    # pages. A code point escape next to a range hyphen is left as written.
    s, a, b = m.string, m.start(), m.end()
    if s[b:b + 1] == "-" or s[a - 1:a] == "-":
        return m.group(0)
    return chr(int(m.group(1), 16))


def decode(s):
    """The text with every escaped spelling of a character turned into it."""
    s = _PAIR.sub(_pair, s)
    s = _CPESC.sub(_cpesc, s)
    s = _HEX.sub(lambda m: chr(int(m.group(1), 16)), s)
    return _DEC.sub(lambda m: chr(int(m.group(1))) if int(m.group(1)) < 0x110000 else m.group(0), s)


def late_glyphs(s):
    """[(glyph, context)] for every late emoji in s, in any of its spellings."""
    t = decode(s)
    out = []
    for i, ch in enumerate(t):
        if is_late(ord(ch)):
            out.append((ch, " ".join(t[max(0, i - 50):i + 30].split())))
    return out


_STICKERS = re.compile(r"const STICKERS\s*=\s*\[(.*?)\]\s*;", re.S)
_ENTRY = re.compile(r'\[\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\]')


def face(glyph):
    """What a child SEES: the variation selectors do not make a second picture."""
    return glyph.replace("\ufe0f", "").replace("\ufe0e", "")


def stickers(s):
    """[(glyph, label)] of the page's sticker shelf, or None if it has none."""
    m = _STICKERS.search(s)
    if not m:
        return None
    return [(decode(g), decode(l)) for g, l in _ENTRY.findall(m.group(1))]


def repeated_faces(shelf):
    """The glyphs that appear on more than one sticker of one shelf."""
    faces = [face(g) for g, _ in shelf]
    return sorted(set(f for f in faces if faces.count(f) > 1))
