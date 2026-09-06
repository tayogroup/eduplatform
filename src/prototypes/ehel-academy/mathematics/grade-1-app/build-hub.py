# -*- coding: utf-8 -*-
"""Rebuild the Grade 1 hub for the seven-lesson structure.

Card order IS the learning order. The two Number lessons share the teal mark
because they are one strand taught over two sittings; Time gets its own mark
because it is now its own lesson rather than a third of "Shape, measure and
time".
"""
import re, io, os

SP = os.path.dirname(os.path.abspath(__file__))
src = io.open(os.path.join(SP, "g1-index.html"), encoding="utf-8").read()

ICON = {
 "count": '<rect x="2.5" y="6" width="19" height="12" rx="2"></rect><path d="M7 6v12M12 6v12M17 6v12"></path>',
 "add":   '<path d="M4 8.5h7M7.5 5v7M13.5 16h7"></path><circle cx="12" cy="12" r="9.2" opacity=".35"></circle>',
 "half":  '<circle cx="12" cy="12" r="9"></circle><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"></path><path d="M12 3v18"></path>',
 "pat":   '<circle cx="5" cy="12" r="2.6"></circle><rect x="10" y="9.4" width="5.2" height="5.2" rx="1"></rect><path d="M19.5 9.2v5.6M16.8 12h5.4"></path>',
 "shape": '<circle cx="7.5" cy="7.5" r="4.4"></circle><rect x="12.6" y="12.4" width="8.4" height="8.4" rx="1.2"></rect><path d="M3 21h7.5L6.7 14.2 3 21z"></path>',
 "time":  '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5.4l3.4 2"></path>',
 "data":  '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"></path>',
}

CARDS = [
 ("c-number", "count", "Number", "Counting to Twenty", "counting-to-twenty.html", 16,
  "Count to 20 and know what the numbers mean: read them, write them, count in twos and tens, "
  "put them in order, compare them, say which is odd and which is even, and estimate before you count."),
 ("c-number", "add", "Number", "Adding and Taking Away", "adding-and-taking-away.html", 8,
  "Add by counting on and by putting two groups together, take away, find how many more, "
  "make ten, learn your doubles, and pay with coins."),
 ("c-frac", "half", "Halves", "Halves and Wholes", "halves-and-wholes.html", 8,
  "Split a shape into two equal parts, colour one half, find half of a group and half of a number, "
  "and put two halves back together to make a whole."),
 ("c-pattern", "pat", "Patterns", "What Comes Next", "what-comes-next.html", 14,
  "Find the part that repeats, fill the missing shape and the missing number, count on in jumps, "
  "balance both sides, and make a pattern of your own."),
 ("c-shape", "shape", "Shape and measure", "Shapes and Sizes", "shapes-and-sizes.html", 10,
  "Name flat and solid shapes and sort them by their sides, faces and edges, turn a shape round, "
  "compare length, weight and how much a jug holds, pick the right measuring tool, and say where something is."),
 ("c-time", "time", "Time", "Days, Months and Clocks", "days-months-and-clocks.html", 4,
  "Say the days of the week and the months of the year in order, work out which things take longer, "
  "and read the clock at o'clock and half past."),
 ("c-data", "data", "Data", "Asking and Sorting", "asking-and-sorting.html", 11,
  "Ask everyone a question, write the answers in a list and a table, build a block graph and a pictogram, "
  "sort into hoops and a Carroll diagram, then say what the data shows."),
]

def card(cls, icon, strand, title, href, steps, covers):
    return (
 '    <a class="lesson %s" href="%s?from=g1">\n'
 '      <span class="mark" aria-hidden="true">\n'
 '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">\n'
 '          %s\n'
 '        </svg>\n'
 '      </span>\n'
 '      <span class="strand">%s</span>\n'
 '      <h2>%s</h2>\n'
 '      <p class="covers">%s</p>\n'
 '      <span class="foot"><span class="steps">%d steps &middot; check &middot; stickers</span><span class="go">Start</span></span>\n'
 '    </a>\n' % (cls, href, ICON[icon], strand, title, covers, steps))

grid = '  <div class="grid">\n' + "\n".join(card(*c) for c in CARDS) + '  </div>'
new = re.sub(r'  <div class="grid">.*?\n  </div>', lambda m: grid, src, count=1, flags=re.S)
assert new != src, "grid not replaced"
out = new

# a colour for the Time card
out = out.replace("  --green: #4FD1A0", "  --green: #4FD1A0;\n      --sky: #6FB6E8", 1)
out = out.replace(".c-frac { --mark: var(--green); }",
                  ".c-frac { --mark: var(--green); }\n    .c-time { --mark: var(--sky); }", 1)
out = out.replace(".c-pattern .mark, .c-shape .mark, .c-data .mark, .c-frac .mark",
                  ".c-pattern .mark, .c-shape .mark, .c-data .mark, .c-frac .mark, .c-time .mark", 1)

out = out.replace(
 "Five lessons, one for each part of the maths you learn this year. Pick the one you want &mdash; you can come back and change your mind.",
 "Seven lessons, in the order they are meant to be done. Start at the top &mdash; each one gets you ready for the next.", 1)

out = re.sub(
 r'<p class="note"><b>For the grown-up\.</b>.*?</p>',
 '<p class="note"><b>For the grown-up.</b> These seven lessons cover the Cambridge Primary Mathematics Stage 1 strands: '
 'number, fractions, pattern, geometry and measure, time, and statistics. They are ordered so that each lesson only needs '
 'what the ones above it have already taught &mdash; halving comes straight after doubling, and the data lesson comes last '
 'because it needs counting and sorting. Fractions at Stage 1 is halves only &mdash; quarters, thirds and equivalence are '
 'Stage 2, so nothing here is ever cut into more than two parts.</p>', out, count=1, flags=re.S)

io.open(os.path.join(SP, "g1v2", "g1-index.html"), "w", encoding="utf-8", newline="").write(out)
print("  g1v2/g1-index.html written: %d cards, %d bytes" % (len(CARDS), len(out)))
for c in CARDS:
    print("    %-18s %-26s %2d steps  -> %s" % (c[2], c[3], c[5], c[4]))
