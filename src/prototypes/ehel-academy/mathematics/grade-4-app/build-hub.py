"""Build g4-index.html, the lesson picker for the Grade 4 standalone build.

The design is Grade 2's, deliberately and by reuse rather than by imitation: its
stylesheet and page framing are lifted from ../grade-2-app/g2-index.html and only the
text and the cards are this grade's. add-header-bars.py makes the same argument for the
lesson header -- the builds should look like one product, and none of these tools invents
a design.

Card order is the teaching order and IS the unit number, so it must match the `lessons`
array in app.config.json. This asserts that rather than trusting it: the two descriptions
of "which lesson is unit 3" are exactly the kind that drift.
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
G2 = os.path.join(HERE, "..", "grade-2-app", "g2-index.html")

# strand class -> the colour family Grade 2 already uses. Reused, not invented.
CARDS = [
    ("big-numbers-below-zero.html", "c-number", "Place value",
     "Numbers up to a hundred thousand and down past zero. What each digit is worth, "
     "building a number from its parts, ten times and a hundred times, rounding, and "
     "putting positives and negatives in order.",
     "4 steps"),
    ("patterns-and-squares.html", "c-pattern", "Counting and sequences",
     "What numbers do when you look for the rule. Odd and even and what adding them "
     "always gives, a shape standing for a number nobody has told you, sequences that "
     "step evenly and ones that do not, and the dots that make a square.",
     "4 steps"),
    ("ways-to-calculate.html", "c-number", "Calculating",
     "Reading and writing numbers in words, estimating before you work, all ten times "
     "tables and the trick of regrouping them, multiples and factor pairs, and the tests "
     "that tell you what divides exactly.",
     "5 steps"),
    ("parts-of-a-whole.html", "c-frac", "Fractions",
     "More parts means smaller parts. A fraction as a division, a fraction of an amount, "
     "equivalence, per cent, comparing, and adding and taking away with the same bottom "
     "number.",
     "7 steps"),
    ("telling-the-time.html", "c-measure", "Time",
     "Units of time and how to convert them, one moment written three ways, reading a "
     "timetable, and working out how long something takes.",
     "4 steps"),
    ("shape-and-measures.html", "c-shape", "Shape and measures",
     "The faces of a solid and the nets that fold into one, every line of symmetry, "
     "tessellation, area without counting, estimating an odd shape on a grid, reading "
     "between the marks on a scale, and naming an angle.",
     "8 steps"),
    ("where-things-are.html", "c-shape", "Position and direction",
     "Saying where something is and how to get there: reflecting a shape in a mirror "
     "line, the eight points of the compass, and reading coordinates by going along "
     "first and then up.",
     "3 steps"),
    ("asking-sorting-chance.html", "c-data", "Statistics and probability",
     "Plan a question worth asking, tally it, show the same data three ways, sort it two "
     "ways at once, compare two classes, then put events on a line from impossible to "
     "certain and spin a spinner a thousand times.",
     "7 steps"),
]

MARKS = {
    "c-number": '<rect x="2.5" y="6" width="19" height="12" rx="2"></rect><path d="M7 6v12M12 6v12M17 6v12"></path>',
    "c-frac": '<circle cx="12" cy="12" r="9"></circle><path d="M12 3v18M3 12h18"></path>',
    "c-measure": '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    "c-shape": '<path d="M12 3l9 16H3z"></path>',
    "c-data": '<path d="M4 20V10M10 20V4M16 20v-7M22 20h-20"></path>',
    # Grade 2's own pattern mark, taken from its Patterns That Grow card
    "c-pattern": ('<rect x="2.5" y="9.5" width="5" height="5" rx="1"></rect>'
                  '<circle cx="12" cy="12" r="2.6"></circle>'
                  '<rect x="16.5" y="9.5" width="5" height="5" rx="1"></rect>'),
}


def card(file, cls, strand, covers, steps):
    return (
        '    <a class="lesson %s" href="%s?from=g4">\n'
        '      <span class="mark" aria-hidden="true">\n'
        '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" '
        'stroke-linecap="round" stroke-linejoin="round">\n'
        "          %s\n"
        "        </svg>\n"
        "      </span>\n"
        '      <span class="strand">%s</span>\n'
        "      <h2>%s</h2>\n"
        '      <p class="covers">%s</p>\n'
        '      <p class="go">%s <span aria-hidden="true">&rarr;</span></p>\n'
        "    </a>\n" % (cls, file, MARKS[cls], strand, TITLES[file], covers, steps)
    )


cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
TITLES = {l["file"]: l["title"] for l in cfg["lessons"]}

order_cfg = [l["file"] for l in cfg["lessons"]]
order_hub = [c[0] for c in CARDS]
assert order_cfg == order_hub, (
    "card order must match app.config.json -- order IS the unit number\n"
    "  config: %s\n  hub:    %s" % (order_cfg, order_hub))
for f in order_hub:
    assert os.path.exists(os.path.join(HERE, f)), "no such lesson: %s" % f

src = io.open(G2, encoding="utf-8").read()
head = src[: src.index('<a class="lesson')]
foot = src[src.rindex("</a>") + 4:]

head = (head
        .replace("<title>Grade 2 Mathematics</title>", "<title>Grade 4 Mathematics</title>")
        .replace("<h1>Grade 2 <em>Mathematics</em></h1>", "<h1>Grade 4 <em>Mathematics</em></h1>")
        .replace("Nine lessons, one for each part of the maths you learn this year.",
                 "Eight lessons, one for each part of the maths you learn this year."))

# The head carries a design comment explaining Grade 2's choices. Relabelling it would
# leave prose arguing for nine cards above six, so it is replaced rather than patched.
DESIGN_NOTE = """
       Grade 4 Mathematics - the way in. Built on the Grade 2 index, which was built
       on Grade 1's, so moving up a year reads as continuity rather than a jump: same
       ground, same card, same gold Start.

       EIGHT lessons, one per Cambridge sub-strand, with Statistics and Probability
       together exactly as Grade 2 pairs them. The survey lesson this build began with
       is gone: it spent eleven steps carrying six objectives and re-taught five
       slides' worth of what the strand lessons cover at more length.

       The MARK COLOUR is doing the same work it does at Grade 2: cards sharing a
       colour share a strand, so a learner scanning for "the fractions one" has a
       second cue besides the words.
  """
note_block = re.search(r"/\* ={5,}.*?\*/", head, re.S)
assert note_block, "the hub's design comment moved; check ../grade-2-app/g2-index.html"
head = head.replace(note_block.group(0), "/* " + DESIGN_NOTE.strip("\n") + "\n  */", 1)
# Assert on what a learner can SEE. The design note above deliberately says "built on
# the Grade 2 index" and "Stage 2's 48", which is history and belongs there; a check
# that forbade it would be a check on the wrong property.
visible = re.sub(r"/\*.*?\*/", " ", head, flags=re.S)
leftover = re.findall(r"Grade 2|Stage 2|Nine lessons", visible)
assert not leftover, "a Grade 2 label survived into the Grade 4 hub: %s" % leftover

# The foot is Grade 2's prose about Grade 2's lessons; this grade needs its own.
foot = re.sub(r'<p class="note">.*?</p>\s*(?=<p class="note">|\s*</div>|\s*<footer|\Z)', "", foot,
              flags=re.S)
note = (
    '  <p class="note"><b>For the grown-up.</b> These eight lessons cover all 46 objectives of '
    "Cambridge Primary Mathematics Stage 4 &mdash; number, fractions and percentages, time, "
    "geometry and measure, position, and statistics and probability. Cards that share a colour "
    "share a strand.</p>\n\n"
    '  <p class="note"><b>Every step ends with a question.</b> A slider that only moves cannot '
    "tell a learner they have understood, so each teaching step finishes with one question that "
    "can come back <i>not quite</i>, and a fresh one on request.</p>\n"
)
foot = foot.replace("</div>", note + "</div>", 1) if "</div>" in foot else foot + note

doc = head + "".join(card(*c) for c in CARDS) + foot
io.open(os.path.join(HERE, "g4-index.html"), "w", encoding="utf-8").write(doc)
print("wrote g4-index.html %d bytes | %d cards" % (len(doc), len(CARDS)))
