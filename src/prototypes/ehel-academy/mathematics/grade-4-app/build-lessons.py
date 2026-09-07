"""Assemble the eight Grade 4 lessons from the composed sources.

Replaces the six per-lesson builders. Those existed because each lesson had its own
hand-written body and slide file; since compose-lessons.py now emits both, one builder
reads a table instead of six scripts repeating the same eleven lines.

The shell -- narration client, deck navigation, stickers, finish, lines, nline, fmt,
rnd, shuffle, cheer, say, ask, pick3 -- is taken VERBATIM from Four Digits Strong, so
every lesson is a sibling of the one Grade 4 already had rather than a lookalike.

Each output takes the per-lesson stylesheet of the SOURCE it was cut from, because that
is where its components live: the place-value table and number line are in num-extra,
the solids and grids in shape-extra.
"""
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))

#  key        output file                     title                          extra css
LESSONS = [
    ("bignum",   "big-numbers-below-zero.html", "Big Numbers and Below Zero", "num"),
    ("patterns", "patterns-and-squares.html",   "Patterns and Square Numbers", "num"),
    ("calc",     "ways-to-calculate.html",      "Ways to Calculate",           "num"),
    ("frac",     "parts-of-a-whole.html",       "Parts of a Whole",            "frac"),
    ("time",     "telling-the-time.html",       "Telling the Time",            "time"),
    ("shape",    "shape-and-measures.html",     "Shape and Measures",          "shape"),
    ("where",    "where-things-are.html",       "Where Things Are",            "shape"),
    ("stats",    "asking-sorting-chance.html",  "Asking, Sorting and Chance",  "stats"),
]

FONTS = ("https://fonts.googleapis.com/css2?"
         "family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap")


def read(name):
    return io.open(os.path.join(HERE, name), encoding="utf-8").read()


def main():
    head = read("g4-lesson.css")
    shell = read("shell.js")
    for key, out, title, css in LESSONS:
        body = read("c-%s-body.html" % key)
        slides = read("c-%s-slides.js" % key)
        extra = read("%s-extra.css" % css)
        doc = ('<meta charset="utf-8">\n'
               '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
               "<title>%s</title>\n" % title +
               '<link rel="stylesheet" href="%s">\n' % FONTS +
               "<style>\n" + head + extra + "</style>\n" + body +
               "\n<script>\n" + shell + slides + "\n})();\n</script>\n")
        io.open(os.path.join(HERE, out), "w", encoding="utf-8").write(doc)
        n = doc.count('<section class="slide"')
        print("  %-30s %6d bytes  %d slides (%d teaching)" % (out, len(doc), n, n - 2))
    print("\n%d lessons built" % len(LESSONS))


if __name__ == "__main__":
    main()
