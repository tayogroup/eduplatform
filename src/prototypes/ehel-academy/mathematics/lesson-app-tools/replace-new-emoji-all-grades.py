# -*- coding: utf-8 -*-
"""Draw every Grade 1-4 Maths picture with emoji a school tablet already has.

    python replace-new-emoji-all-grades.py            # report
    python replace-new-emoji-all-grades.py --write

grade-1-app/replace-new-emoji.py took six glyphs out of Grade 1 on 2026-09-11.
A scan of all four builds the same evening found 27 more past the Emoji 5.0
line (see _emoji.py), across every grade - a device whose font stops at 5.0
draws each as an empty box. Seven of the places spell the glyph as an escape,
which a scan of the literal characters cannot see - the window and the ice
cube in Grade 2's "shapes in real things" (\\u{1FA9F}, \\u{1F9CA}) and five of
Grade 4's composed stickers in compose-lessons.py (\\U0001f9ee and friends) -
and two glyphs, the window and the abacus, existed ONLY that way, so a
literal scan did not know they were there at all. This covers every place,
in the SOURCES: Grades 1 and 2
are hand-edited pages, Grade 3 builds from grade-3-app/src/, Grade 4 from its
tracked slides and compose-lessons.py - so run both builds afterwards.

WHERE THE PICTURE IS THE CONTENT, THE WORDS MOVE WITH IT, so each item still
agrees with itself:
  - Grade 1's fruit survey asks about mango eleven ways and draws it in the
    list, the table, the pictogram and the block graph. It becomes pineapple
    everywhere in that lesson (38 words, 9 pictures), which is also a fruit
    every child there knows. The plates of mangoes in Adding and Taking Away
    become oranges.
  - Grade 2's shop: "a juice" is a cup of tea, "a bar of soap" a balloon, same
    prices. Its measuring: the thread is a spoon, the worm a caterpillar, and
    the 700 g bottle a coconut, which is what a coconut weighs.
  - Grade 2's real things: the ice cube (a cube) is a dice, the window (a
    square) a picture frame.
  - Grade 1's "a minute" card showed brushing teeth; it shows a tap - washing
    your hands takes about a minute.
  - Grade 3's direction pad had a compass in its middle square; it has the
    "you are here" pin.

Every other change is a sticker, and a sticker's only job is to tell one step
from another at a glance - so each replacement was checked against every
other sticker on its shelf, and this refuses to write a shelf that repeats a
face. That check found two shelves ALREADY repeating: Grade 1's Counting to
Twenty showed the keycap ten for "I can count to 10" and for "Counting in
tens" (the first replace-new-emoji.py gave the second one it), and Grade 3's
Ask, Count and Chart gave the thinking face to "Choosing the right chart" and
to the "How do you know" step every Grade 3 lesson ends with. Both are fixed
here. Grade 4's compose-lessons.py asserts the same property on its own
shelves, so a repeat there fails the build rather than this tool.

Every anchor must match exactly once or the file is left alone; a second run
changes nothing.
"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
MATH = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _emoji import late_glyphs, stickers, repeated_faces  # noqa: E402

argv = sys.argv[1:]
WRITE = "--write" in argv
# --only grade-1-app/ limits it to one build's files: grade-1-app/rebuild-g1v2.py
# re-derives Grade 1 in a temporary copy that holds no other grade
ONLY = argv[argv.index("--only") + 1] if "--only" in argv else ""
for i, a in enumerate(argv):
    if a not in ("--write", "--only") and not (i and argv[i - 1] == "--only"):
        sys.exit("unrecognised argument: %s" % a)

G1, G2, G3, G4 = "grade-1-app/g1v2/", "grade-2-app/", "grade-3-app/src/", "grade-4-app/"

EDITS = {
    # ------------------------------------------------------------ Grade 1
    G1 + "counting-to-twenty.html": [
        ('["\U0001F51F", "Counting in tens"]', '["\U0001F64C", "Counting in tens"]'),   # two hands, ten fingers
        ('["\U0001F9FA", "Zero means empty"]', '["\U0001F37D\uFE0F", "Zero means empty"]'),   # an empty plate
    ],
    G1 + "adding-and-taking-away.html": [
        ('["\U0001FA99", "Money to 20"]', '["\U0001F4B5", "Money to 20"]'),
        ('["\U0001F998", "I can count on"]', '["\U0001F438", "I can count on"]'),
        ('{ ask: "One plate has 4 mangoes and one has 5. Put them together. How many mangoes?", pic: \'<div class="ss-emo sm">'
         + "\U0001F96D" * 4 + " &nbsp; " + "\U0001F96D" * 5 + "</div>',",
         '{ ask: "One plate has 4 oranges and one has 5. Put them together. How many oranges?", pic: \'<div class="ss-emo sm">'
         + "\U0001F34A" * 4 + " &nbsp; " + "\U0001F34A" * 5 + "</div>',"),
    ],
    G1 + "halves-and-wholes.html": [
        ('["\U0001F9E9", "Two halves, one whole"]', '["\U0001F517", "Two halves, one whole"]'),
    ],
    G1 + "what-comes-next.html": [
        ('["\U0001F9E9", "Missing numbers"]', '["\u2753", "Missing numbers"]'),
        ('["\U0001F998", "Jump patterns"]', '["\U0001F438", "Jump patterns"]'),
    ],
    G1 + "shapes-and-sizes.html": [
        ('["\U0001F9FA", "I can sort shapes"]', '["\U0001F5C2\uFE0F", "I can sort shapes"]'),
        ('["\U0001F9CA", "Solid shapes"]', '["\U0001F4E6", "Solid shapes"]'),
        ('["\U0001F9F0", "The right tool"]', '["\U0001F527", "The right tool"]'),
        ('["\U0001F9ED", "Where it is"]', '["\U0001F4CD", "Where it is"]'),
    ],
    G1 + "days-months-and-clocks.html": [
        ('{ n: "a minute", v: 2, e: "\U0001FAA5" },', '{ n: "a minute", v: 2, e: "\U0001F6B0" },'),
    ],
    G1 + "asking-and-sorting.html": [
        ('["\U0001F9FE", "I can fill a table"]', '["\U0001F4CB", "I can fill a table"]'),
    ],
    # ------------------------------------------------------------ Grade 2
    G2 + "tens-and-ones.html": [
        ('["\U0001F9F1", "Tens and ones"]', '["\U0001F51F", "Tens and ones"]'),
        ('["\U0001F9E9", "Make 20 and 100"]', '["\U0001F91D", "Make 20 and 100"]'),
    ],
    G2 + "coins-and-change.html": [
        ('["\U0001F9FA", "Shop totals"]', '["\U0001F6D2", "Shop totals"]'),
        ('["\U0001F9C3", "a juice", 23]', '["\u2615", "a cup of tea", 23]'),
        ('["\U0001F9FC", "a bar of soap", 30]', '["\U0001F388", "a balloon", 30]'),
    ],
    G2 + "fair-shares.html": [
        ('["\U0001F9F1", "Same size, new name"]', '["\U0001F3F7\uFE0F", "Same size, new name"]'),
    ],
    G2 + "patterns-that-grow.html": [
        ('["\U0001FA79", "Mend the pattern"]', '["\U0001F527", "Mend the pattern"]'),
    ],
    G2 + "sides-and-corners.html": [
        ('["\U0001F9E9", "Shape riddles"]', '["\u2753", "Shape riddles"]'),
        ('["\U0001F9CA", "Solid shapes"]', '["\U0001F4E6", "Solid shapes"]'),
        ('["\U0001F9ED", "Where is it?"]', '["\U0001F4CD", "Where is it?"]'),
        ('{ ic: "\\u{1F9CA}", name: "an ice cube", a: "cube",', '{ ic: "\\u{1F3B2}", name: "a dice", a: "cube",'),
        ('{ ic: "\\u{1FA9F}", name: "a window", a: "square",', '{ ic: "\\u{1F5BC}\\u{FE0F}", name: "a picture frame", a: "square",'),
    ],
    G2 + "which-way-from-here.html": [
        ('["\U0001FA9E", "Reflection"]', '["\U0001F98B", "Reflection"]'),
    ],
    G2 + "how-much-how-long.html": [
        ('["\U0001F9CA", "Measure with cubes"]', '["\U0001F3B2", "Measure with cubes"]'),
        ('["\U0001F9F5", "thread"]', '["\U0001F944", "spoon"]'),
        ('["\U0001FAB1", "worm"]', '["\U0001F41B", "caterpillar"]'),
        ('["\U0001F9F4", "bottle", 700]', '["\U0001F965", "coconut", 700]'),
    ],
    G2 + "count-it-chart-it.html": [
        ('["\U0001F9F1", "Block graphs"]', '["\U0001F4CA", "Block graphs"]'),
        ('["\U0001F9F1", "Reading a block graph"]', '["\U0001F50D", "Reading a block graph"]'),
    ],
    # ------------------------------------------------------------ Grade 3 (src)
    G3 + "l1-content.js": [
        ('["\U0001F9E9", "Break it apart"]', '["\u2702\uFE0F", "Break it apart"]'),
        ('["\U0001FA9C", "Count in steps"]', '["\U0001F463", "Count in steps"]'),
    ],
    G3 + "l2-content.js": [
        ('["\U0001FA99", "Money and the dot"]', '["\U0001F4B5", "Money and the dot"]'),
    ],
    G3 + "l3-content.js": [
        ('["\U0001FA93", "Split it to multiply"]', '["\u2702\uFE0F", "Split it to multiply"]'),
    ],
    G3 + "l4-content.js": [
        ('["\U0001F7F0", "The same, in different pieces"]', '["\u2696\uFE0F", "The same, in different pieces"]'),
    ],
    G3 + "l5-content.js": [
        ('["\U0001FA9E", "Lines of symmetry"]', '["\U0001F98B", "Lines of symmetry"]'),
        ('["\U0001F9CA", "Solid shapes"]', '["\U0001F4E6", "Solid shapes"]'),
        ('["\U0001F7E9", "Area"]', '["\U0001F532", "Area"]'),
    ],
    G3 + "l7-content.js": [
        ("return '<div class=\"mid\">\U0001F9ED</div>';", "return '<div class=\"mid\">\U0001F4CD</div>';"),
        ('["\U0001F9ED", "North, south, east, west"]', '["\U0001F5FA\uFE0F", "North, south, east, west"]'),
    ],
    G3 + "l8-content.js": [
        ('["\U0001F914", "Choosing the right chart"]', '["\U0001F4C8", "Choosing the right chart"]'),
    ],
    # ------------------------------------------------------------ Grade 4 (sources)
    G4 + "shape-slides.js": [
        ('["\U0001F9CA", "The faces of a solid"]', '["\U0001F3B2", "The faces of a solid"]'),
        ('["\U0001FA9E", "Reflect it in the mirror"]', '["\u2194\uFE0F", "Reflect it in the mirror"]'),
        ('["\U0001FAD0", "An odd shape on a grid"]', '["\U0001F343", "An odd shape on a grid"]'),
        ('["\U0001F9ED", "Which way from here?"]', '["\U0001F4CD", "Which way from here?"]'),
    ],
    G4 + "frac-slides.js": [
        ('["\U0001F9FA", "A fraction of an amount"]', '["\U0001F36A", "A fraction of an amount"]'),
        ('["\U0001F7F0", "Same value, different name"]', '["\U0001F3F7\uFE0F", "Same value, different name"]'),
    ],
    G4 + "num-slides.js": [
        ('["\U0001FA9C", "What comes next?"]', '["\U0001F463", "What comes next?"]'),
        ('["\U0001F7E6", "Numbers that make squares"]', '["\U0001F532", "Numbers that make squares"]'),
    ],
    # the donor lesson's own shelf; compose takes its stickers from DONOR_EXTRAS,
    # so nothing ships from here - changed so a scan of the sources is clean
    G4 + "g4-lesson.js": [
        ('["\U0001F9CA", "Numbers to 10,000"]', '["\U0001F522", "Numbers to 10,000"]'),
        ('["\U0001F7E7", "Tenths and hundredths"]', '["\U0001F538", "Tenths and hundredths"]'),
    ],
    # compose spells these as \\U escapes "so this file stays ASCII"; keep that
    G4 + "compose-lessons.py": [
        (r'''        4: ("\\U0001f9f1",''' + "\n" + r'''            '{ q: "What is 342''',
         r'''        4: ("\\u2702\\ufe0f",''' + "\n" + r'''            '{ q: "What is 342'''),
        (r'''        5: ("\\U0001f9fa",''' + "\n" + r'''            '{ q: "What is 87''',
         r'''        5: ("\\U0001f36c",''' + "\n" + r'''            '{ q: "What is 87'''),
        (r'''        2: ("\\U0001f9f1",''' + "\n" + r'''            '{ q: "Which of these is the same number as 4,208?",''',
         r'''        2: ("\\U0001f504",''' + "\n" + r'''            '{ q: "Which of these is the same number as 4,208?",'''),
        (r'''        4: ("\\U0001fa9c",''' + "\n" + r'''            '{ q: "Which list is in order, smallest first?",''',
         r'''        4: ("\\U0001f4f6",''' + "\n" + r'''            '{ q: "Which list is in order, smallest first?",'''),
        (r'''        6: ("\\U0001f9ee",''' + "\n" + r'''            '{ q: "Round 47,318 to the nearest 1000.",''',
         r'''        6: ("\\U0001f590\\ufe0f",''' + "\n" + r'''            '{ q: "Round 47,318 to the nearest 1000.",'''),
    ],
}

# One lesson's fruit, renamed everywhere the lesson says or draws it.
WORDS = {
    G1 + "asking-and-sorting.html": {
        "pattern": re.compile(r"\b([Mm])ango(es)?\b"),
        "sub": lambda m: ("P" if m.group(1) == "M" else "p") + "ineapple" + ("s" if m.group(2) else ""),
        "count": 38,
        "glyphs": ("\U0001F96D", "\U0001F34D", 9),
    },
}

PYESC = re.compile(r"\\{1,2}U(000[0-9a-fA-F]{5})")


def late_in(path, s):
    if path.endswith(".py"):
        s = PYESC.sub(lambda m: chr(int(m.group(1), 16)), s)
    return sorted(set(g for g, _ in late_glyphs(s)))


bad = 0
changed = 0
for rel in sorted(set(EDITS) | set(WORDS)):
    if not rel.startswith(ONLY):
        continue
    p = os.path.join(MATH, rel)
    s = io.open(p, encoding="utf-8", newline="").read()
    t = s
    refused = None
    for old, new in EDITS.get(rel, []):
        if old not in t and new in t:
            continue
        if t.count(old) != 1:
            refused = "an anchor matches %d times: %s" % (t.count(old), old[:70].replace("\n", " "))
            break
        t = t.replace(old, new)
    if not refused and rel in WORDS:
        w = WORDS[rel]
        n = len(w["pattern"].findall(t))
        old_g, new_g, n_g = w["glyphs"]
        if n or old_g in t:
            if n != w["count"] or t.count(old_g) != n_g:
                refused = "expected %d words and %d pictures to rename, found %d and %d" % (
                    w["count"], n_g, n, t.count(old_g))
            else:
                t = w["pattern"].sub(w["sub"], t).replace(old_g, new_g)
    if not refused:
        left = late_in(rel, t)
        if left:
            refused = "still carries %s" % " ".join(left)
    if not refused and rel.endswith(".html"):
        shelf = stickers(t)
        rep = repeated_faces(shelf) if shelf else []
        if rep:
            refused = "its sticker shelf repeats %s" % " ".join(rep)
    if refused:
        print("  REFUSED  %s: %s" % (rel, refused))
        bad += 1
        continue
    if t != s:
        changed += 1
        if WRITE:
            io.open(p, "w", encoding="utf-8", newline="").write(t)
    print("  %s  %s" % (("changed " if WRITE else "would change") if t != s else "already ", rel))

print("\n  %d file(s) %s, %d refused%s" % (
    changed, "changed" if WRITE else "to change", bad,
    "" if WRITE or not changed else " - run with --write to apply"))
if WRITE and changed:
    print("  now rebuild Grade 3 (src/build-all.sh) and Grade 4 (build-all.sh), and\n"
          "  regenerate Grade 1's hub (grade-1-app/build-grownup-section.py --write)")
sys.exit(1 if bad else 0)
