# -*- coding: utf-8 -*-
"""Redraw the Grade 3 hub for the eight lessons.

Reads app.config.json so the hub cannot drift from the build: the order there IS
the teaching order and the unit number, and the step count on each card is
counted out of the built lesson rather than typed in. A card whose count is
written by hand goes stale the first time a step is added, and the hub is the
one page that promises what a lesson contains before a child commits to it.
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
os.chdir(APP)

ICONS = {
    "up-to-a-thousand": '<rect x="2.5" y="6" width="19" height="12" rx="2"></rect><path d="M7 6v12M12 6v12M17 6v12"></path>',
    "adding-and-money": '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v9M8.5 10.5h7M8.5 13.5h7"></path>',
    "rows-and-rules": '<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M3 15h18M9 3v18M15 3v18"></path>',
    "equal-parts": '<circle cx="12" cy="12" r="9"></circle><path d="M12 3v18M3 12h18"></path>',
    "shapes-and-symmetry": '<path d="M12 3l9 16H3z"></path><path d="M12 3v16"></path>',
    "measure-it": '<rect x="2" y="8" width="20" height="8" rx="1.5"></rect><path d="M7 8v4M12 8v5M17 8v4"></path>',
    "time-and-direction": '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path>',
    "ask-count-chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>',
}
STRAND = {
    "up-to-a-thousand": ("Number", "c-number"),
    "adding-and-money": ("Calculation", "c-calc"),
    "rows-and-rules": ("Number", "c-pattern"),
    "equal-parts": ("Fractions", "c-frac"),
    "shapes-and-symmetry": ("Geometry", "c-shape"),
    "measure-it": ("Measurement", "c-measure"),
    "time-and-direction": ("Time", "c-time"),
    "ask-count-chart": ("Statistics", "c-data"),
}
COVERS = {
    "up-to-a-thousand": "Build and read 3-digit numbers, break them apart and put them back together, multiply by 10, count on and back in ones, tens and hundreds, then compare, order, round and estimate.",
    "adding-and-money": "Make 100 and 1000, choose the easy pair to add first, add and take away in columns with regrouping, read money with a decimal point, and work out change.",
    "rows-and-rules": "Read an array four ways, learn the times tables, split a number to multiply it, estimate first, share with something left over, and find the rule a pattern is hiding.",
    "equal-parts": "Tell equal parts from unequal ones, see that all the parts make one whole, find a fraction of a shape and of a group, add and take away pieces, and compare.",
    "shapes-and-symmetry": "Name flat shapes by their sides, tell regular from irregular, find lines of symmetry, mirror a shape, name solids, and work out perimeter and area.",
    "measure-it": "Choose between millimetres, centimetres, metres and kilometres, weigh in grams and kilograms, measure in millilitres and litres, read a scale, and compare angles with a right angle.",
    "time-and-direction": "Read a clock face and digital time, work out how long something took, follow a timetable, and describe direction with north, south, east and west.",
    "ask-count-chart": "Ask a question data can answer, keep a tally, read pictograms and bar charts, sort with Venn and Carroll diagrams, and say whether something will happen, might happen or will not.",
}

cfg = json.loads(io.open("app.config.json", encoding="utf-8").read())
src = io.open("index.html", encoding="utf-8").read()

# three new colour classes, beside the five already there
src = src.replace(
    "  .c-frac { --mark: var(--green); }",
    "  .c-frac { --mark: var(--green); }\n"
    "  .c-calc { --mark: var(--teal); }\n"
    "  .c-measure { --mark: var(--green); }\n"
    "  .c-time { --mark: var(--gold); }")
src = src.replace(
    "  .c-pattern .mark, .c-shape .mark, .c-data .mark, .c-frac .mark { color: #2A1F05; }",
    "  .c-pattern .mark, .c-shape .mark, .c-data .mark, .c-frac .mark,\n"
    "  .c-measure .mark, .c-time .mark { color: var(--gold-ink, #2A1F05); }")

cards = []
for lesson in cfg["lessons"]:
    slug = lesson["file"][:-5]
    html = io.open(lesson["file"], encoding="utf-8").read()
    # the step count is COUNTED, never typed: total slides less the check, the
    # Convincing step and the sticker shelf
    steps = html.count('class="slide"') - 3
    strand, css = STRAND[slug]
    cards.append(
        '    <a class="lesson %s" href="%s?from=g3">\n'
        '      <span class="mark" aria-hidden="true">\n'
        '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">\n'
        '          %s\n'
        '        </svg>\n'
        '      </span>\n'
        '      <span class="strand">%s</span>\n'
        '      <h2>%s</h2>\n'
        '      <p class="covers">%s</p>\n'
        '      <span class="foot"><span class="steps">%d steps &middot; check &middot; why &middot; stickers</span><span class="go">Start</span></span>\n'
        '    </a>\n' % (css, lesson["file"], ICONS[slug], strand, lesson["title"], COVERS[slug], steps))

first = src.index('    <a class="lesson')
last = src.rindex("</a>\n") + len("</a>\n")
out = src[:first] + "\n".join(cards) + src[last:]
out = re.sub(r"(Five|Eight) lessons, one for each part of the maths you learn this year",
             "Eight lessons, one for each part of the maths you learn this year", out)
io.open("index.html", "w", encoding="utf-8", newline="").write(out)
print("hub rebuilt: %d cards" % len(cards))
for lesson in cfg["lessons"]:
    print("  %-32s %s" % (lesson["title"], lesson["file"]))
