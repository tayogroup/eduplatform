# -*- coding: utf-8 -*-
"""Pictures the kit draws itself, because the emoji for them are too new.

WHY. Emoji 13 (2020) and later are missing from devices a school still
uses: Android before 11, iOS before 14, and Windows 10, whose emoji font
stops at Emoji 12. On those a glyph like the rock or the log is an empty
box - on the very card that is supposed to show the child what a rock is.
The validation of Grade 1 (2026-09-11) counted eight such glyphs on Grade 1
pages and could not test them on the school's devices, so the fix does not
depend on a test: nothing newer than Emoji 12 reaches a page.

HOW. A content module still writes the emoji; `iconize()` in the builder
swaps each Emoji 13+ code point listed in BY_CODEPOINT for the drawing of
the same object here, and `build-lessons.py` REFUSES a page that still
carries any Emoji 13+ code point afterwards - so a new one cannot slip in
unnoticed; it needs a drawing here first. A few drawings (roots, soil,
watering can, chrysalis, woodlouse) have no emoji at all; the content asks
for them by name with `icon("roots")`, because the nearest emoji showed
something else (a pot plant for "roots", a feather for "chrysalis").

Every drawing is 64x64, sized 1em so it takes the size of the text or
picture box it sits in, and aria-hidden: like the emoji it replaces, it is
decoration beside a word that says the same thing.
"""

_OPEN = '<svg class="ico" viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true" focusable="false" style="vertical-align:-0.125em">'

_BODIES = {
    "rock": (
        '<path d="M8 46 L14 27 L29 15 L46 18 L57 33 L53 49 L35 56 L15 53 Z" fill="#8F8F8F" stroke="#555" stroke-width="2.5" stroke-linejoin="round"/>'
        '<path d="M14 27 L29 15 L46 18 L38 30 L21 32 Z" fill="#B9B9B9"/>'
        '<path d="M38 30 L57 33 L53 49 L35 56 Z" fill="#6F6F6F"/>'
        '<path d="M22 40 l5 3 M42 40 l4 -2" stroke="#5E5E5E" stroke-width="2" stroke-linecap="round"/>'),
    "wood": (
        '<rect x="6" y="20" width="46" height="26" rx="4" fill="#9A6A3A" stroke="#6E4520" stroke-width="2.5"/>'
        '<path d="M12 27h18 M16 34h24 M10 40h16" stroke="#6E4520" stroke-width="2" stroke-linecap="round"/>'
        '<ellipse cx="52" cy="33" rx="8" ry="13" fill="#E2B878" stroke="#6E4520" stroke-width="2.5"/>'
        '<ellipse cx="52" cy="33" rx="4.5" ry="7.5" fill="none" stroke="#B5834A" stroke-width="1.5"/>'
        '<circle cx="52" cy="33" r="1.6" fill="#B5834A"/>'),
    "window": (
        '<rect x="9" y="7" width="46" height="48" rx="3" fill="#7A5A3A"/>'
        '<rect x="13" y="11" width="18" height="19" fill="#BFE3F5"/><rect x="33" y="11" width="18" height="19" fill="#BFE3F5"/>'
        '<rect x="13" y="32" width="18" height="19" fill="#BFE3F5"/><rect x="33" y="32" width="18" height="19" fill="#BFE3F5"/>'
        '<path d="M16 26 L26 14 M36 26 L44 16 M16 47 L24 37" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>'
        '<rect x="5" y="54" width="54" height="5" rx="2" fill="#5E432A"/>'),
    "coin": (
        '<circle cx="32" cy="32" r="24" fill="#E8B931" stroke="#A87C12" stroke-width="3"/>'
        '<circle cx="32" cy="32" r="17" fill="none" stroke="#C99A1E" stroke-width="2"/>'
        '<path d="M28 25 L33 21 V43" stroke="#A87C12" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M17 25 A17 17 0 0 1 27 15" stroke="#FFF1BF" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    "rope": (
        '<g transform="rotate(-28 32 32)">'
        '<rect x="3" y="26" width="58" height="12" rx="6" fill="#C9A26B" stroke="#8A6A3A" stroke-width="2"/>'
        '<path d="M10 26 l-5 12 M17 26 l-5 12 M24 26 l-5 12 M31 26 l-5 12 M38 26 l-5 12 M45 26 l-5 12 M52 26 l-5 12 M59 26 l-5 12"'
        ' stroke="#8A6A3A" stroke-width="2"/></g>'),
    "bucket": (
        '<path d="M13 24 C13 5 51 5 51 24" fill="none" stroke="#56687A" stroke-width="3"/>'
        '<path d="M13 24 H51 L45 57 H19 Z" fill="#8FA3B3" stroke="#56687A" stroke-width="2.5" stroke-linejoin="round"/>'
        '<ellipse cx="32" cy="24" rx="19" ry="5" fill="#C9D6E0" stroke="#56687A" stroke-width="2.5"/>'
        '<path d="M17 38 H47" stroke="#56687A" stroke-width="2" opacity=".6"/>'),
    "plant": (
        '<path d="M32 36 V12" stroke="#2F7D32" stroke-width="3" fill="none"/>'
        '<path d="M32 27 C22 27 16 19 16 12 C24 12 32 18 32 27 Z" fill="#3E9A42"/>'
        '<path d="M32 22 C42 22 48 14 48 8 C40 8 32 14 32 22 Z" fill="#4CAF50"/>'
        '<path d="M32 33 C40 33 46 29 48 23 C40 23 34 27 32 33 Z" fill="#3E9A42"/>'
        '<rect x="14" y="35" width="36" height="7" rx="2" fill="#A8522B"/>'
        '<path d="M18 42 H46 L42 58 H22 Z" fill="#C8683A"/>'),
    "roots": (
        '<rect x="3" y="30" width="58" height="31" rx="3" fill="#8A5A3A"/>'
        '<path d="M3 30 H61" stroke="#5E3B1E" stroke-width="2"/>'
        '<path d="M32 30 V12" stroke="#2F7D32" stroke-width="3"/>'
        '<path d="M32 21 C24 21 18 15 18 9 C26 9 32 15 32 21 Z" fill="#4CAF50"/>'
        '<path d="M32 17 C40 17 46 11 46 5 C38 5 32 11 32 17 Z" fill="#3E9A42"/>'
        '<path d="M32 30 V52 M32 36 C26 40 21 45 17 54 M32 38 C38 42 43 47 47 55 M32 45 C28 49 26 53 26 59 M32 47 C36 51 38 55 38 59"'
        ' stroke="#F2E2C4" stroke-width="2.5" fill="none" stroke-linecap="round"/>'),
    "soil": (
        '<path d="M3 46 C11 33 23 29 32 29 C42 29 53 35 61 46 V59 H3 Z" fill="#6E4520"/>'
        '<circle cx="15" cy="49" r="2" fill="#8F6440"/><circle cx="26" cy="41" r="1.8" fill="#8F6440"/><circle cx="40" cy="47" r="2.2" fill="#8F6440"/>'
        '<circle cx="50" cy="53" r="1.8" fill="#8F6440"/><circle cx="23" cy="54" r="1.6" fill="#4E2F16"/><circle cx="44" cy="38" r="1.6" fill="#4E2F16"/>'
        '<path d="M34 30 V19" stroke="#2F7D32" stroke-width="2.5"/>'
        '<path d="M34 24 C28 24 25 20 25 15 C30 15 34 18 34 24 Z" fill="#4CAF50"/>'
        '<path d="M34 22 C40 22 43 18 43 13 C38 13 34 16 34 22 Z" fill="#4CAF50"/>'),
    "wateringcan": (
        '<path d="M20 26 C20 14 36 14 36 26" fill="none" stroke="#2F7D32" stroke-width="4"/>'
        '<path d="M17 30 C5 30 5 46 17 46" fill="none" stroke="#2F7D32" stroke-width="4"/>'
        '<path d="M15 26 H41 L39 54 H17 Z" fill="#4CAF50" stroke="#2F7D32" stroke-width="2.5" stroke-linejoin="round"/>'
        '<path d="M40 32 L55 19" stroke="#2F7D32" stroke-width="4.5" stroke-linecap="round"/>'
        '<ellipse cx="56" cy="18" rx="4.5" ry="3" fill="#2F7D32" transform="rotate(-40 56 18)"/>'
        '<path d="M58 25 l2 5 M61 22 l4 3 M55 27 l0 5" stroke="#3B7FD1" stroke-width="2" stroke-linecap="round"/>'),
    "kettle": (
        '<path d="M26 12 C24 9 29 7 27 4 M34 12 C32 9 37 7 35 4" stroke="#9AA9B6" stroke-width="2" fill="none" stroke-linecap="round"/>'
        '<path d="M44 24 C57 24 57 45 47 47" fill="none" stroke="#4E6070" stroke-width="5" stroke-linecap="round"/>'
        '<path d="M19 27 L7 20 L10 17 L21 23" fill="#B8C6D1" stroke="#4E6070" stroke-width="2.5" stroke-linejoin="round"/>'
        '<path d="M19 19 H44 L48 50 H15 Z" fill="#B8C6D1" stroke="#4E6070" stroke-width="2.5" stroke-linejoin="round"/>'
        '<rect x="23" y="14" width="17" height="6" rx="2" fill="#4E6070"/>'
        '<rect x="11" y="50" width="41" height="6" rx="2" fill="#4E6070"/>'),
    "mirror": (
        '<rect x="29" y="47" width="6" height="14" rx="2" fill="#8C6A43"/>'
        '<ellipse cx="32" cy="27" rx="19" ry="23" fill="#8C6A43"/>'
        '<ellipse cx="32" cy="27" rx="15" ry="19" fill="#CFE8F5"/>'
        '<path d="M24 22 L32 12 M25 31 L38 15" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'),
    "toothbrush": (
        '<g transform="rotate(-35 32 32)">'
        '<rect x="4" y="30" width="40" height="8" rx="4" fill="#3B7FD1"/>'
        '<rect x="40" y="29" width="18" height="10" rx="3" fill="#E9EEF2" stroke="#3B7FD1" stroke-width="2"/>'
        '<path d="M43 29 V21 M47 29 V21 M51 29 V21 M55 29 V21" stroke="#8FC9EA" stroke-width="3" stroke-linecap="round"/></g>'),
    "feather": (
        '<path d="M52 7 C29 9 13 30 13 55 C31 51 52 34 52 7 Z" fill="#7FB6E0" stroke="#3E6E94" stroke-width="2"/>'
        '<path d="M52 7 L10 59" stroke="#3E6E94" stroke-width="2.5" stroke-linecap="round"/>'
        '<path d="M41 20 H31 M37 28 L24 30 M31 37 L20 40 M44 24 L46 30 M38 33 L41 39" stroke="#3E6E94" stroke-width="1.5" opacity=".6"/>'),
    "chrysalis": (
        '<path d="M8 9 H56" stroke="#7A5A3A" stroke-width="4.5" stroke-linecap="round"/>'
        '<path d="M32 9 V16" stroke="#7A5A3A" stroke-width="2"/>'
        '<path d="M32 16 C45 22 43 45 32 58 C21 45 19 22 32 16 Z" fill="#7DB35A" stroke="#4E7F32" stroke-width="2"/>'
        '<path d="M25 30 H39 M24 38 H40 M26 46 H38" stroke="#4E7F32" stroke-width="1.5" opacity=".7"/>'
        '<circle cx="35" cy="25" r="1.7" fill="#F4C95D"/>'),
    "beetle": (
        '<path d="M21 24 L10 17 M20 34 L7 34 M21 44 L10 51 M43 24 L54 17 M44 34 L57 34 M43 44 L54 51" stroke="#2B2B2B" stroke-width="3" stroke-linecap="round"/>'
        '<path d="M29 10 L24 3 M35 10 L40 3" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round"/>'
        '<ellipse cx="32" cy="37" rx="14" ry="19" fill="#3E5230"/>'
        '<path d="M32 20 V56" stroke="#1E2616" stroke-width="2"/>'
        '<circle cx="32" cy="16" r="7" fill="#2B2B2B"/>'
        '<ellipse cx="26" cy="31" rx="3" ry="6" fill="#7D9A5C" opacity=".75"/>'),
    "woodlouse": (
        '<path d="M11 31 L3 25 M11 35 L3 38" stroke="#4A5058" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M16 45 l-3 6 M21 47 l-2 6 M26 48 l-1 6 M32 48 v6 M38 48 l1 6 M43 47 l2 6 M48 45 l3 6" stroke="#4A5058" stroke-width="2" stroke-linecap="round"/>'
        '<ellipse cx="32" cy="34" rx="22" ry="14" fill="#7E8791"/>'
        '<path d="M17 23 V45 M23 21 V47 M29 20 V48 M35 20 V48 M41 21 V47 M47 23 V45" stroke="#5C646D" stroke-width="2"/>'),
    "heart": (
        '<path d="M26 14 V5 M34 15 V7 M40 16 C42 10 48 8 53 10" stroke="#8E2A24" stroke-width="4" fill="none" stroke-linecap="round"/>'
        '<path d="M32 57 C12 45 7 31 11 22 C15 14 26 14 30 20 C34 14 45 12 51 20 C57 30 51 45 32 57 Z" fill="#C8453B"/>'
        '<path d="M21 30 C25 37 30 39 37 37" stroke="#8E2A24" stroke-width="2" fill="none" opacity=".7"/>'),
    "lungs": (
        '<path d="M28 22 C18 20 8 34 8 48 C8 56 16 58 22 56 C28 54 29 46 29 38 Z" fill="#E8909A"/>'
        '<path d="M36 22 C46 20 56 34 56 48 C56 56 48 58 42 56 C36 54 35 46 35 38 Z" fill="#E8909A"/>'
        '<path d="M32 5 V26 M32 25 L24 34 M32 25 L40 34" stroke="#B8606A" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    "worm": (
        '<path d="M7 44 C13 29 24 29 28 40 S42 51 46 38 S54 25 58 29" stroke="#D98A8A" stroke-width="10" fill="none" stroke-linecap="round"/>'
        '<path d="M7 44 C13 29 24 29 28 40 S42 51 46 38 S54 25 58 29" stroke="#B86A6A" stroke-width="10" fill="none" stroke-dasharray="1.5 6"/>'
        '<circle cx="57" cy="28" r="1.4" fill="#1B1B1B"/>'),
    "jellyfish": (
        '<path d="M18 33 C16 43 22 49 18 59 M26 34 C24 45 30 51 26 61 M34 34 C32 45 38 51 34 61 M42 33 C40 43 46 49 42 59"'
        ' stroke="#A67CC4" stroke-width="3" fill="none" stroke-linecap="round"/>'
        '<path d="M11 31 C11 11 53 11 53 31 C46 35 18 35 11 31 Z" fill="#C79BE0" stroke="#8E62B0" stroke-width="2"/>'
        '<path d="M20 21 C23 16 28 14 33 14" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>'),
    "seal": (
        '<path d="M11 45 L2 38 L4 51 Z" fill="#6F7B87"/>'
        '<path d="M8 47 C8 35 24 26 40 28 C50 29 56 35 56 41 C56 47 50 49 44 47 L20 51 C12 53 8 51 8 47 Z" fill="#8E9AA6"/>'
        '<ellipse cx="45" cy="27" rx="11" ry="10" fill="#8E9AA6"/>'
        '<path d="M33 45 L29 55 L40 50 Z" fill="#6F7B87"/>'
        '<circle cx="49" cy="24" r="2" fill="#1B1B1B"/><circle cx="55" cy="29" r="1.8" fill="#3A3A3A"/>'
        '<path d="M55 31 l7 -1 M55 32 l7 2" stroke="#3A3A3A" stroke-width="1" stroke-linecap="round"/>'),
}

ICONS = {name: _OPEN + body + "</svg>" for name, body in _BODIES.items()}

# The emoji (Emoji 13 and later) a content module may still write, and the
# drawing that replaces it. The object must be the SAME: a content use that
# means something else asks for its own drawing by name instead.
BY_CODEPOINT = {
    0x1FAA8: "rock",        # rock
    0x1FAB5: "wood",        # wood (a log)
    0x1FA9F: "window",      # window
    0x1FA99: "coin",        # coin
    0x1FAA2: "rope",        # knot (a rope: tug of war, pull, stretch)
    0x1FAA3: "bucket",      # bucket
    0x1FAB4: "plant",       # potted plant
    0x1FAD6: "kettle",      # teapot (every use in this course is a kettle)
    0x1FA9E: "mirror",      # mirror
    0x1FAA5: "toothbrush",  # toothbrush
    0x1FAB6: "feather",     # feather
    0x1FAB2: "beetle",      # beetle
    0x1FAC0: "heart",       # anatomical heart
    0x1FAC1: "lungs",       # lungs
    0x1FAB1: "worm",        # worm
    0x1FABC: "jellyfish",   # jellyfish (Emoji 15)
    0x1F9AD: "seal",        # seal
}


def icon(name):
    """A drawing by name, for a picture no emoji shows (roots, soil, a chrysalis...)."""
    if name not in ICONS:
        raise SystemExit("REFUSED: no icon %r; lesson-kit/_icons.py draws %s" % (name, sorted(ICONS)))
    return ICONS[name]


# ---- Emoji versions: which standard added a code point ----------------------
# Only the versions that matter here (12 and later). A code point not listed is
# Emoji 11 or older and is on every device the school has.
_RANGES = [
    (0x1FAE9, 0x1FAE9, 16), (0x1FAC6, 0x1FAC6, 16), (0x1FABE, 0x1FABE, 16), (0x1FADC, 0x1FADC, 16),
    (0x1FA89, 0x1FA89, 16), (0x1FA8F, 0x1FA8F, 16), (0x1FADF, 0x1FADF, 16),
    (0x1FA75, 0x1FA77, 15), (0x1FA87, 0x1FA88, 15), (0x1FAAD, 0x1FAAF, 15), (0x1FABB, 0x1FABD, 15),
    (0x1FABF, 0x1FABF, 15), (0x1FACE, 0x1FACF, 15), (0x1FADA, 0x1FADB, 15), (0x1FAE8, 0x1FAE8, 15),
    (0x1FAF7, 0x1FAF8, 15), (0x1F6DC, 0x1F6DC, 15),
    (0x1FAE0, 0x1FAE7, 14), (0x1F979, 0x1F979, 14), (0x1FAB7, 0x1FABA, 14), (0x1FAC3, 0x1FAC5, 14),
    (0x1FAD7, 0x1FAD9, 14), (0x1FAF0, 0x1FAF6, 14), (0x1F6DD, 0x1F6DF, 14), (0x1F7F0, 0x1F7F0, 14),
    (0x1FA7B, 0x1FA7C, 14), (0x1FAA9, 0x1FAAC, 14),
    (0x1F972, 0x1F972, 13), (0x1F978, 0x1F978, 13), (0x1F90C, 0x1F90C, 13), (0x1F9A3, 0x1F9A4, 13),
    (0x1F9AB, 0x1F9AD, 13), (0x1F9CB, 0x1F9CB, 13), (0x1FA74, 0x1FA74, 13), (0x1FA83, 0x1FA86, 13),
    (0x1FA96, 0x1FAA8, 13), (0x1FAB0, 0x1FAB6, 13), (0x1FAC0, 0x1FAC2, 13), (0x1FAD0, 0x1FAD6, 13),
    (0x1F6D6, 0x1F6D7, 13), (0x1F6FB, 0x1F6FC, 13), (0x26A7, 0x26A7, 13),
]


def emoji_version(cp):
    for lo, hi, v in _RANGES:
        if lo <= cp <= hi:
            return v
    return 0


TOO_NEW = 13   # the first Emoji version a school device may not draw


def _esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def iconize_value(s):
    """One picture value: an emoji too new for the school's devices becomes its
    drawing. A value that is only that emoji becomes the drawing itself; a value
    that mixes it with other emoji becomes a row, so it still renders as HTML."""
    if not isinstance(s, str) or s.startswith("<"):
        return s
    chars = list(s)
    if not any(emoji_version(ord(c)) >= TOO_NEW for c in chars):
        return s
    out, swapped, i = [], False, 0
    while i < len(chars):
        c = chars[i]
        cp = ord(c)
        if emoji_version(cp) >= TOO_NEW:
            if cp not in BY_CODEPOINT:
                raise SystemExit("REFUSED: picture %r uses U+%X (Emoji %d), which devices before 2020 cannot draw, "
                                 "and lesson-kit/_icons.py has no drawing for it - add one to BY_CODEPOINT"
                                 % (s, cp, emoji_version(cp)))
            out.append(("svg", ICONS[BY_CODEPOINT[cp]]))
            swapped = True
            if i + 1 < len(chars) and chars[i + 1] == "\ufe0f":
                i += 1
        else:
            out.append(("txt", c))
        i += 1
    if len(out) == 1:
        return out[0][1]
    return '<span class="picrow">' + "".join(v if k == "svg" else _esc(v) for k, v in out) + "</span>" if swapped else s


def iconize(obj):
    """Every picture field in a lesson (any key named pic or icon, at any depth)."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("pic", "icon") and isinstance(v, str):
                obj[k] = iconize_value(v)
            else:
                iconize(v)
    elif isinstance(obj, list):
        for v in obj:
            iconize(v)
    return obj


def too_new_in(text):
    """Every Emoji 13+ code point left in a built page, written literally or as a
    JavaScript escape (\\u{1FAA8}), with a little context for the refusal."""
    import re
    found = []
    for i, c in enumerate(text):
        if emoji_version(ord(c)) >= TOO_NEW:
            found.append("U+%X near %r" % (ord(c), text[max(0, i - 40):i + 10]))
    for m in re.finditer(r"\\u\{([0-9A-Fa-f]{4,6})\}|\\U([0-9A-Fa-f]{8})", text):
        cp = int(m.group(1) or m.group(2), 16)
        if emoji_version(cp) >= TOO_NEW:
            found.append("U+%X (escaped) near %r" % (cp, text[max(0, m.start() - 40):m.end() + 10]))
    return found
