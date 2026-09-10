# -*- coding: utf-8 -*-
"""The things this kit COMPUTES rather than trusts, in one place.

build-lessons.py refuses content that breaks them and check-coverage.py
re-checks the shipped pages against them. Both import from here, so the
builder and the gate cannot drift apart - the rule the Global Perspectives
kit's _rules.py keeps, and the topic index and the narration hashes before
it: one definition, shared by the builder and the gate. lib/art.js carries
the same tables for the page (MIX, TEXTURE, HEX), and build-lessons.py reads
them out of the JS by regex and refuses to build if they disagree with the
ones here.

Art & Design at Stage 1 is about MATERIALS and COLOURS and MARKS, so what can
be computed is what those things DO:

  mix              what two paints make (Cambridge's own example: "Let us try
                   mixing red and blue. What happened?") - E.02, M.01, R.02
  tone_order       the order of swatches from light to dark, from the
                   colours' own lightness, never from an authored list - E.01
  pattern_period   the repeat of a pattern, and so what comes next - E.01
  is_repeating     whether a row the child made IS a pattern - TWA.01
  fits             which materials have the property a purpose needs - M.02
  compare          whether a feature is in both works or only one - R.02
  comment_fits     whether a kind comment names something in the work - R.01
  refinements      which change has the effect a problem needs - TWA.03
  paint_texture    what adding rice, flour, sugar or water does to paint
                   (Cambridge's own example again) - TWA.02
  journal_fallback the record of what a lesson makes, derived from its own
                   steps, for a journal opened without playing them - R.01
"""

# ---- colour -------------------------------------------------------------

# the paint pots, and every colour a mix can make; the page draws these hexes
HEX = {
    "red": "#E0312B", "yellow": "#F6C700", "blue": "#2D6CDF",
    "white": "#FFFFFF", "black": "#1B1B1B",
    "orange": "#F28C28", "purple": "#7B3FA0", "green": "#3FA34D",
    "pink": "#F5A3B7", "light blue": "#9CC8F0", "light yellow": "#FBE99A",
    "light orange": "#F9C89A", "light purple": "#C7A3DD", "light green": "#A6DBA0",
    "dark red": "#8B1A14", "dark blue": "#1B3A75", "dark yellow": "#A08A00",
    "dark orange": "#A5560F", "dark purple": "#46215E", "dark green": "#1F5E2A",
    "brown": "#7A4A2A", "grey": "#8A8F94",
}

# the secondary colours, by the unordered pair of primaries that makes them
MIX = {
    "blue+red": "purple",
    "red+yellow": "orange",
    "blue+yellow": "green",
    "black+white": "grey",
}

# what white and black do to a colour: a tint and a shade
TINT = {"red": "pink", "yellow": "light yellow", "blue": "light blue",
        "orange": "light orange", "purple": "light purple", "green": "light green",
        "white": "white", "black": "grey"}
SHADE = {"red": "dark red", "yellow": "dark yellow", "blue": "dark blue",
         "orange": "dark orange", "purple": "dark purple", "green": "dark green",
         "black": "black", "white": "grey"}


def mix(a, b):
    """The colour two paints make, or None if this kit has no answer for
    the pair (a mix of two secondaries is mud, and a Stage 1 page does not
    ask about it)."""
    if a == b:
        return a
    key = "+".join(sorted([a, b]))
    if key in MIX:
        return MIX[key]
    if "white" in (a, b):
        other = b if a == "white" else a
        return TINT.get(other)
    if "black" in (a, b):
        other = b if a == "black" else a
        return SHADE.get(other)
    return None


def luminance(hex_):
    """Relative lightness of a hex colour, 0 (black) to 1 (white)."""
    h = hex_.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def tone_order(swatches):
    """Ids of the swatches from lightest to darkest, or None on a tie - two
    swatches of one lightness have no single order and the round is unfair."""
    lums = [(luminance(s["hex"]), s["id"]) for s in swatches]
    vals = [round(l, 4) for l, _ in lums]
    if len(set(vals)) != len(vals):
        return None
    return [i for _, i in sorted(lums, key=lambda x: -x[0])]


# ---- pattern ------------------------------------------------------------

def pattern_period(seq, max_period=4):
    """The smallest repeat of a sequence, or None if it does not repeat at
    least twice in full."""
    for p in range(1, max_period + 1):
        if len(seq) >= 2 * p and all(seq[i] == seq[i % p] for i in range(len(seq))):
            return p
    return None


def pattern_next(seq, k):
    """The k-th element (0-based, beyond the shown part) a repeating
    pattern continues with, or None if the sequence is not a pattern."""
    p = pattern_period(seq)
    if p is None:
        return None
    return seq[k % p]


def is_repeating(row, max_period=3):
    """Whether a row the child built is a pattern: it repeats a unit of at
    most `max_period` tiles at least twice, and the unit is not one tile
    repeated (a row of the same tile is a line, not a pattern)."""
    p = pattern_period(row, max_period)
    return p is not None and p >= 2


# ---- materials, features, changes ----------------------------------------

def fits(materials, needs):
    """Ids of the materials that have the property the purpose needs."""
    return [m["id"] for m in materials if needs in (m.get("props") or [])]


def compare(a_features, b_features, tag):
    """"both" if a feature is in both works, "one" if in exactly one, None
    if in neither (a card about nothing in either picture is unfair)."""
    in_a, in_b = tag in a_features, tag in b_features
    if in_a and in_b:
        return "both"
    if in_a or in_b:
        return "one"
    return None


def comment_fits(about, features):
    """Whether a celebratory comment names something the work actually has."""
    return about in features


def refinements(changes, needs):
    """Ids of the changes whose effect is what the problem needs."""
    return [c["id"] for c in changes if c.get("effect") == needs]


# ---- paint --------------------------------------------------------------

# Cambridge's own Stage 1-2 example: "investigate the creation of different
# textures of paint by adding rice, flour, sugar, water, etc."
TEXTURE = {
    "rice": "bumpy",
    "flour": "thick",
    "sugar": "gritty",
    "water": "runny",
    "sand": "rough",
    "glue": "shiny",
}


def paint_texture(additive):
    return TEXTURE.get(additive)


# ---- the journal ---------------------------------------------------------

def journal_fallback(steps):
    """What a lesson's own steps make, as journal entries, for a journal
    opened without the steps having been played: one line per making step,
    in the order the lesson does them. The page prefers its own live log."""
    out = []
    for s in steps:
        d = s["data"]
        if s["kind"] == "mix":
            for rd in d["rounds"]:
                made = mix(rd["a"], rd["b"])
                if made:
                    out.append({"kind": "mix", "text": "mixed %s and %s and made %s" % (rd["a"], rd["b"], made),
                                "pic": "\U0001F3A8", "hex": HEX.get(made)})
        elif s["kind"] == "marks":
            for rd in d["rounds"]:
                out.append({"kind": "marks", "text": "made %s with the %s" % (rd["made"], rd["tool"]), "pic": "✏️"})
        elif s["kind"] == "pattern":
            out.append({"kind": "pattern", "text": "made a pattern that repeats", "pic": "\U0001F9F1"})
        elif s["kind"] == "choose":
            for rd in d["rounds"]:
                good = fits(d["materials"], rd["needs"])
                names = [m["label"] for m in d["materials"] if m["id"] in good]
                if names:
                    out.append({"kind": "choose", "text": "chose %s for %s" % (names[0], rd["purpose"]), "pic": "\U0001F9F0"})
        elif s["kind"] == "refine":
            for rd in d["rounds"]:
                good = refinements(rd["changes"], rd["needs"])
                names = [c["t"] for c in rd["changes"] if c["id"] in good]
                if names:
                    out.append({"kind": "refine", "text": "fixed %s: %s" % (rd["piece"]["title"], names[0].lower()), "pic": "\U0001F527"})
        elif s["kind"] == "experiment":
            for rd in d["rounds"]:
                tx = paint_texture(rd["additive"])
                if tx:
                    out.append({"kind": "experiment", "text": "added %s to paint and made it %s" % (rd["additive"], tx), "pic": "\U0001F9EA"})
        elif s["kind"] == "tone":
            out.append({"kind": "tone", "text": "put %d colours in order from light to dark" % len(d["swatches"]), "pic": "\U0001F311"})
    return out
