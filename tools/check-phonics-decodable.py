# -*- coding: utf-8 -*-
"""Is each Phonics reading decodable AT THE POINT IT APPEARS?

    python tools/check-phonics-decodable.py              # every unit; exit 1 on a finding
    python tools/check-phonics-decodable.py 5 12         # just those units
    python tools/check-phonics-decodable.py --authored <dir>   # another tree

This is the one property that makes a phonics text a phonics text. A decodable
reader contains only the graphemes taught so far plus the sight words taught so
far, because a learner who meets an untaught spelling has no move except to
guess — and guessing from the first letter and the picture is exactly the habit
the whole level exists to replace. A text with forward references does not
teach reading slightly less well; it teaches the opposite thing.

What is read: each unit's SHORT TEXT (the decodable reader) and the ROWS of its
WORD LIST ("Words You Can Read Now" — what the learner is told they can read).
Not a Short talk, which is heard and not read, and not a Notice. A word list's
"Tricky:" line is sight words, and its framing sentences ("Read them down.",
"That is over two hundred words.") are the tutor's; a row has no sentence
punctuation, which is how the two are told apart.

How it decides. Each word is segmented left to right, longest grapheme first,
against the set taught up to and including that unit. A word that segments is
decodable. A word that does not is a violation unless it is a sight word taught
by then. Rules catch words that segment but should not:

  a silent e at the end   rice, name, time  — not until Unit 15 (split digraph)
  c before e, i or y      city, cent, rice  — not until Unit 19 (soft c)
  g before e at the end   age, page, huge   — not until Unit 19 (soft g)
  y as a vowel at the end my, by, try       — not until Unit 16 (y says long i)
  y at the end of a longer word  very, happy — not until Unit 19 (its third job)

The soft-g rule is narrower than the soft-c rule because the letters are not
alike: c before e, i or y is ALWAYS soft, while g is soft in age and hard in
get, give, girl and gift. Flagging every g before a front vowel reported four
instances of `get` — a word decodable since Unit 4 — in four different units.

A word whose letters segment ONE AT A TIME although they are really a pair is
caught too: `shop` at Unit 8 segments as s-h-o-p, every letter taught, but sh
is Unit 12, and a learner sounding s-h-o-p gets nothing. So any multi-letter
spelling from a LATER unit anywhere in the word is a violation.

And a word whose letters segment and whose SOUNDS do not make it is caught by
IRREGULAR below — d-o is not "do". This is the hole that let 22 words through
until 2026-09-18, found by opening the app rather than by this check: Unit 5
taught `am` as a word "phonics cannot sound out" in the unit that teaches m,
and the readers used do, put, full, old, all, want, work, word, walk, four,
come, door, call, wall, sign, easy and Friday where no sounds taught could make
them, and `I` — which says the letter's NAME — from the first text on. `I` is
now taught in Unit 3 (EXTRA_SIGHT). IRREGULAR is a list, so it can miss a word
nobody put on it; add to it when a new text brings one.

It over-reports rather than under-reports, which is the right way round: a false
positive costs one look, a false negative ships a word the learner cannot read.
"""
from __future__ import print_function, unicode_literals

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
AUTHORED = os.path.join(HERE, "..", "inputs", "ehel-english-intensive-source", "authored")
UNITS = 20

# What each unit ADDS. Units 1, 11 and 20 add no grapheme: Unit 1 is listening,
# Unit 11 is adjacent consonants already known, Unit 20 is sight words only.
NEW = {
    1: [], 2: ["s", "a", "t", "n"], 3: ["i", "p"], 4: ["o", "g", "d"],
    5: ["m", "c", "k"], 6: ["r", "e", "u"], 7: ["h", "b", "l", "f"],
    8: ["ck", "ll", "ff", "ss"], 9: ["j", "v", "w", "x"],
    10: ["y", "z", "zz", "qu"], 11: [],
    12: ["ng", "nk", "th", "sh", "ch"],
    13: ["ai", "ee", "ie", "oa", "oo"],
    14: ["ar", "or", "ir", "er", "ow", "oi", "ear", "air"],
    15: ["ay"], 16: ["ea", "igh"], 17: ["oe", "ew", "ue"],
    18: ["ur", "aw", "ore", "ou", "oy", "are", "eer"],
    19: ["ph", "wh"], 20: [],
}
# Taught by sight but not as a vocabulary card. `I` is Unit 3's: the build keys
# its one-word-one-unit rule on the lower-case word, and the letter i is that
# unit's card, so the word is taught in its lecture, pattern card and lists.
EXTRA_SIGHT = {3: ["i"]}

# Words whose letters SEGMENT into taught spellings but whose sounds do not make
# the word. Each must be a taught sight word wherever a reader uses it.
IRREGULAR = set("""
do to into two go no so old cold gold hold told most both he me we be she the
put push pull full bull all ball call fall tall wall small talk walk want was
what watch wash who work word world one once come some done love have give
live door floor four pour your sign friday easy any many said says again
could would should people because there where were here they you are of
""".split())

SPLIT_FROM = 15     # a_e, i_e, o_e, u_e — a silent e reaching back over one letter
SOFT_FROM = 19      # c and g before e, i or y
Y_FROM = 16         # y at the end of a word, saying the long i
Y_LONG_E_FROM = 19  # very, happy: "The letter y has three jobs"

UNIT_OF = dict((g, n) for n, gs in NEW.items() for g in gs)


def LATER(unit_no):
    """Multi-letter spellings not yet taught, longest first."""
    return sorted([g for g, n in UNIT_OF.items() if n > unit_no and len(g) > 1],
                  key=len, reverse=True)


def graphemes_through(unit_no):
    out = set()
    for n in range(1, unit_no + 1):
        out.update(NEW.get(n, []))
    return out


def unit_path(n):
    return os.path.join(AUTHORED, "lph-u%02d.json" % n)


def sight_words_through(unit_no):
    """Every word a unit teaches by sight, plus every word it teaches at all.

    A unit's own vocabulary is readable in that unit by definition — that is
    what the unit did. What must be decodable is the rest of the sentence.
    `a` is the one word read as its own sound from Unit 2.
    """
    out = set(["a"])
    for n, words in EXTRA_SIGHT.items():
        if n <= unit_no:
            out.update(words)
    for n in range(1, unit_no + 1):
        if not os.path.exists(unit_path(n)):
            continue
        doc = json.load(io.open(unit_path(n), encoding="utf-8"))
        for group in doc["groups"]:
            for w in group["words"]:
                out.add(w["w"].lower())
    return out


def segments(w, gs):
    """Greedy longest-match, left to right. None when the word does not segment."""
    parts, i = [], 0
    while i < len(w):
        for size in (3, 2, 1):
            if w[i:i + size] in gs:
                parts.append(w[i:i + size])
                i += size
                break
        else:
            return None
    return parts


def why_not(w, unit_no, gs):
    """The reason a learner at this unit cannot decode `w`, or None."""
    # wants, words: the -s form of a listed word is as irregular as the word.
    if w in IRREGULAR or (w.endswith("s") and w[:-1] in IRREGULAR):
        return "irregular: its letters segment, its sounds do not make it"
    if unit_no < SPLIT_FROM and re.search(r"[aeiou][bcdfgklmnprstvz]es?$", w):
        return "silent e (split digraph, Unit %d)" % SPLIT_FROM
    if unit_no < Y_FROM and re.search(r"[bcdfghklmnprstvwz]y$", w):
        return "y as a vowel (Unit %d)" % Y_FROM
    if unit_no < Y_LONG_E_FROM and re.search(r"[aeiou][^aeiouy]+y$", w):
        return "y as long e at the end of a longer word (Unit %d)" % Y_LONG_E_FROM
    if unit_no < SOFT_FROM and re.search(r"c[eiy]", w):
        return "soft c (Unit %d)" % SOFT_FROM
    if unit_no < SOFT_FROM and re.search(r"ge$|gi[ao]", w):
        return "soft g (Unit %d)" % SOFT_FROM
    later = [g for g in LATER(unit_no) if g in w]
    if later:
        return "contains %s, taught in Unit %d" % (later[0], UNIT_OF[later[0]])
    if segments(w, gs) is None:
        missing = sorted(set(re.findall(r"[a-z]", w)) - gs)
        return "no segmentation" + (" (%s untaught)" % ", ".join(missing) if missing else "")
    return None


def violations(unit_no):
    if not os.path.exists(unit_path(unit_no)):
        return None
    doc = json.load(io.open(unit_path(unit_no), encoding="utf-8"))
    gs, sight = graphemes_through(unit_no), sight_words_through(unit_no)
    bad = {}
    for r in [x for x in doc["readings"] if x["type"] in ("Short text", "Word list")]:
        text = r["passage"]
        if r["type"] == "Word list":
            text = "\n".join(l for l in text.split("Tricky:")[0].split("\n")
                             if not re.search(r"[.?!:]", l))
        for raw in re.findall(r"[A-Za-z][A-Za-z']*", text):
            w = raw.lower().replace("'", "")
            if not w or w in sight:
                continue
            why = why_not(w, unit_no, gs)
            if why:
                bad.setdefault(w, []).append((r["title"], why))
    return bad


def main(argv):
    global AUTHORED
    if "--authored" in argv:
        AUTHORED = argv[argv.index("--authored") + 1]
        argv = [a for a in argv if a not in ("--authored", AUTHORED)]
    unknown = [a for a in argv if not a.isdigit()]
    if unknown:
        print("unknown argument(s): %s" % " ".join(unknown), file=sys.stderr)
        return 2
    only = [int(a) for a in argv]
    # A tree with the units missing reads as clean. Refuse instead.
    present = [n for n in range(1, UNITS + 1) if os.path.exists(unit_path(n))]
    if len(present) < UNITS:
        print("found %d of %d authored Phonics units in %s - refusing to report a clean level"
              % (len(present), UNITS, AUTHORED), file=sys.stderr)
        return 2
    total = 0
    for n in (only or range(1, UNITS + 1)):
        bad = violations(n)
        total += len(bad)
        if not bad:
            print("  U%02d  decodable" % n)
            continue
        print("  U%02d  %d word(s) a learner cannot decode here:" % (n, len(bad)))
        for w in sorted(bad):
            print("         %-10s %s  [%s]" % (w, bad[w][0][1], bad[w][0][0]))
    print("\nPhonics decodability: %d undecodable word(s) across the level." % total)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
