# -*- coding: utf-8 -*-
"""Recut Grade 4 into one lesson per Cambridge sub-strand.

WHY. The six lessons were a survey plus its own patches: Four Digits Strong came
first and covered the whole stage, and the five strand lessons were written around
the gaps it left. So it spent 11 steps carrying 6 objectives, re-taught five slides'
worth of material the strand lessons cover at more length, and was the only lesson
that was not about one thing. Grades 1, 2 and 3 all divide by sub-strand (7, 9 and
8 lessons); Grade 4 had 6.

EVERY SPLIT IS WITHIN ONE FILE. That is a hard constraint here, for a sharper reason
than the one ../grade-1-app/compose-lessons.py gives. Grade 1's check arrays are not
portable; Grade 4's are (every quiz is the same {q,o,a,w} shape with one renderer).
What is not portable is the IDS: num-body and g4-lesson-body share 34 of them --
fb1..fb11, work1.., say1.. -- because both number from slide 1. Grafting a slide
across files silently collides. So Four Digits Strong is retired rather than
redistributed, and the six objectives it alone carried are AUTHORED FRESH into the
strand lesson each belongs to (see addons/).

What this rewrites, all of which a split breaks if left alone:
  - the slide badge <span class="n">N</span>
  - finish(i), 0-based, which drives both the dot rail and the sticker shelf
  - ask(N, ...) and its id="askN" placeholder -- ask() calls finish(n - 1), so an
    un-renumbered panel ticks the wrong slide
  - the STICKERS array, parallel to done[]
  - the quiz, partitioned to the slides each lesson keeps
DOM ids are deliberately NOT renumbered: they come from one source file, so they
stay unique, and rewriting them is churn that can only introduce mistakes.
"""
import io
import json
import os
import re
import sys

# ONE pass mark for every check in every Maths grade - see _app.pass_mark.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "lesson-app-tools"))
from _app import pass_mark  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))

# out-key, title, source, ORDERED slide sequence, quiz items to keep
#
# The sequence is the teaching order and mixes both origins: an int is a slide of the
# source file, ("d", n) is Four Digits Strong's slide n. It has to be explicit because
# appending the donor slides put "Numbers to 10,000" third in Big Numbers, behind two
# slides that assume it -- a lesson whose foundation arrives after the things built on
# it. None means "the whole source, in its own order".
STRUCTURE = [
    # Place value is built concretely first, then extended past ten thousand, and only
    # then regrouped -- and the two rounding slides come after the number line has been
    # drawn for ordering, because rounding is asking which neighbour on it is nearer.
    ("bignum", "Big Numbers and Below Zero", "num",
     [("d", 1), ("n", 1), ("n", 2), 9, ("n", 3), ("d", 2), 10, ("n", 4), ("n", 5), ("n", 6)],
     [8, 9]),
    # Odd and even is taught for adding and then for taking away; the unknown moves
    # from the middle of the sum, to the front, to appearing twice; and sequences go
    # find-the-next-term, classify, then NAME the rule -- which is the objective's own
    # verb and the one thing the kept slide cannot ask, since its chip says the rule.
    ("patterns", "Patterns and Square Numbers", "num",
     [2, ("n", 1), 3, ("n", 2), ("n", 3), 4, ("n", 4), ("n", 5), 5, ("n", 6)],
     [2, 3, 4, 5]),
    # Estimate, then the exact answer it was an estimate OF -- which the kept slide
    # shows in its working and never asks for. Then the tables, the shortcut, and the
    # two calculations 4Ni.05 and 4Ni.06 name; factors last, since divisibility rests
    # on them.
    ("calc", "Ways to Calculate", "num",
     [1, 6, ("n", 1), ("n", 2), 7, ("n", 3), ("n", 4), ("n", 5), ("d", 6), ("n", 6), 8],
     [1, 6, 7, 10]),
    # The thinnest lessons grew a step each way (2026-09-11 validation, area 3:
    # "grow the thinnest lessons"): a fraction of an amount met again as a word
    # problem about somebody, straight after the slide that teaches it, and
    # ordering three fractions after comparing two - 4Nf.07 says "compare AND
    # order", and the kept slide only ever compares a pair.
    ("frac", "Parts of a Whole", "frac",
     [1, 2, 3, ("n", 1), 4, 5, 6, ("n", 2), 7], None),
    # Units are converted both ways before a clock is read; the clock is read before
    # it is rewritten in 24-hour; the timetable is read before it is used to choose;
    # and intervals go clock, then over a month end, then months and years.
    ("time", "Telling the Time", "time",
     [1, ("n", 1), 2, ("n", 2), ("n", 3), 3, ("n", 4), 4, ("n", 5), ("n", 6)],
     None),
    # 4Gg.02 and 4Gg.03 shared 'Area without counting', an exploration with two
    # sliders; each now gets a step that asks: the perimeter a rectangle's formula
    # gives, then the area of an L shape as two rectangles added.
    ("shape", "Shape and Measures", "shape",
     [1, 2, 3, ("d", 10), 5, 6, ("n", 1), ("n", 2), 7, 8], [1, 2, 3, 4, 5, 6, 7, 8, 9]),
    # Direction is taught before it is used, coordinates are introduced before the
    # order of the pair is argued about, and the mirror-on-the-edge case comes after
    # an ordinary reflection rather than before it.
    ("where", "Where Things Are", "shape",
     [("n", 1), ("n", 2), 9, ("n", 3), ("d", 11), ("n", 4), ("n", 5), 4, ("n", 6)], [10]),
    # Choosing a representation comes after all four have been drawn (4Ss.02 says
    # "choose and explain which representation to use"); the words of chance are
    # used on familiar events after the line that introduces them, before the
    # experiment that tests them.
    ("stats", "Asking, Sorting and Chance", "stats",
     [1, 2, 3, 4, ("n", 1), 5, 6, ("n", 2), 7], None),
]

SRC = {"num": "num", "shape": "shape", "frac": "frac", "time": "time", "stats": "stats"}

# The five objectives Four Digits Strong alone carried, moved into the strand lesson
# each belongs to. Its slides ARE portable -- they declare nothing another slide needs
# and build no id dynamically, so every $() call is a literal that can be rewritten --
# but its IDS collide with the target's (both files number from slide 1), so each block
# is prefixed. Its QUIZ is not portable: Four Digits Strong writes {q, opts, a} with the
# answer as a VALUE, while the five write {q, o, a, w} with the answer as an INDEX and
# an explanation. So these five items are authored here rather than moved.
#   (donor slide, sticker, quiz item)
DONOR_EXTRAS = {
    1: ("\\U0001f522",
         '{ q: "How many hundreds are there in 4,072?", o: ["0", "4", "7"], a: 0,'
         ' w: "The hundreds place holds a 0. The 4 is thousands and the 7 is tens." }'),
    2: ("\\u2744\\ufe0f",
         '{ q: "On Mount Kenya it is 3\\u00b0C, and in the night it gets 5 degrees colder. What is the temperature now?",'
         ' o: ["\\u22122\\u00b0C", "2\\u00b0C", "\\u22128\\u00b0C"], a: 0,'
         ' w: "Count back from 3 through zero: 2, 1, 0, \\u22121, \\u22122." }'),
    6: ("\u2b1c",           # a rectangle, because that is how the slide draws a factor pair
         '{ q: "Which of these is a factor pair of 24?", o: ["4 and 6", "5 and 5", "3 and 9"], a: 0,'
         ' w: "4 \\u00d7 6 = 24. A factor pair is two numbers that multiply to give the number." }'),
    10: ("\U0001f53a",       # shape already uses the set square for area
         '{ q: "An angle of 120\\u00b0 is:", o: ["Obtuse", "Acute", "A right angle"], a: 0,'
         ' w: "More than 90\\u00b0 but less than 180\\u00b0 is obtuse. Acute is under 90\\u00b0." }'),
    11: ("\\U0001f5fa\\ufe0f",
         '{ q: "In the coordinates (3, 5), what does the 3 tell you?",'
         ' o: ["How far along", "How far up", "Which square to shade"], a: 0,'
         ' w: "Go along first, then up. The first number is always the across one." }'),
}
DONOR_BODY, DONOR_JS = "g4-lesson-body.html", "g4-lesson.js"

# Slides written for THIS build rather than cut from an existing lesson, one pair of
# files per lesson (new-<key>-body.html / new-<key>-slides.js). They exist because the
# grade was thin: 42 teaching slides against Grade 2's 104 and Grade 3's 72, with
# several objectives sharing one slide where Grade 2 gives each skill its own. They
# need no id prefixing -- everything in them is already prefixed w -- and no your-turn
# panel, because each one judges the learner directly.
#   lesson -> {slide number in the new file: (sticker, quiz item)}
NEW_EXTRAS = {
    "calc": {
        1: ("\\u2795",
            '{ q: "What is 347 + 185?", o: ["532", "522", "432"], a: 0,'
            ' w: "7 + 5 = 12, so carry a ten; 4 + 8 + 1 = 13, so carry a hundred; 3 + 1 + 1 = 5.'
            ' The other two answers are what you get by dropping one of those carries." }'),
        2: ("\\u2796",
            '{ q: "What is 623 \\u2212 187?", o: ["436", "564", "444"], a: 0,'
            ' w: "3 is less than 7, so exchange a ten: 13 \\u2212 7 = 6. Taking the smaller digit from'
            ' the bigger in each column instead gives 564, which is the mistake to avoid." }'),
        3: ("\\u2696\\ufe0f",
            '{ q: "16 \\u00d7 25 is the same as:", o: ["8 \\u00d7 50", "32 \\u00d7 50", "8 \\u00d7 25"], a: 0,'
            ' w: "Halve one and double the other and they cancel out, so the answer cannot change:'
            ' both come to 400. Doubling both would make it four times too big." }'),
        4: ("\\u2702\\ufe0f",
            '{ q: "What is 342 \\u00d7 6?", o: ["2,052", "1,812", "2,040"], a: 0,'
            ' w: "300 \\u00d7 6 = 1,800, 40 \\u00d7 6 = 240 and 2 \\u00d7 6 = 12. Add all three: 2,052.'
            ' Forgetting the 40 leaves you 240 short." }'),
        5: ("\\U0001f36c",
            '{ q: "Omar shares 87 sweets equally among 5 friends. How many does each friend get, and how many are left over?",'
            ' o: ["17 each, 2 left over", "17 each, none left over", "18 each, 2 left over"], a: 0,'
            ' w: "5 \\u00d7 17 = 85, and 2 are left over \\u2014 not enough to make another group of 5.'
            ' Check it: 85 + 2 = 87." }'),
        6: ("\\U0001f501",
            '{ q: "Which sentence is true about 6 and 24?",'
            ' o: ["6 is a factor of 24", "6 is a multiple of 24", "24 is a factor of 6"], a: 0,'
            ' w: "6 \\u00d7 4 = 24 says both things at once: the smaller number is the factor and the'
            ' bigger one is the multiple." }'),
    },
    "time": {
        1: ("\\U0001f501",
            '{ q: "How many hours is 180 minutes?", o: ["3", "180", "10 800"], a: 0,'
            ' w: "Going to a BIGGER unit means dividing: 180 \\u00f7 60 = 3. Multiplying would have'
            ' given the seconds instead." }'),
        2: ("\U0001f550",
            '{ q: "The short hand is between 4 and 5, and the long hand points at 8. What time is it?",'
            ' o: ["4:40", "8:20", "5:40"], a: 0,'
            ' w: "The short hand gives the hour it has PASSED, so 4. The long hand on the 8 is'
            ' 8 \\u00d7 5 = 40 minutes." }'),
        3: ("\\U0001f303",
            '{ q: "Write 12:20 am in 24-hour time.", o: ["00:20", "12:20", "24:20"], a: 0,'
            ' w: "12 am is midnight, and the hour after midnight is written 00. There is no 24 in'
            ' 24-hour time \\u2014 it runs 00:00 to 23:59." }'),
        4: ("\U0001f68f",
            '{ q: "Buses reach the library at 09:05, 09:25 and 09:45. Leila must be there by 09:30.'
            ' Which one should Leila catch?", o: ["The one arriving 09:25", "The one arriving 09:05",'
            ' "The one arriving 09:45"], a: 0,'
            ' w: "09:45 is too late. 09:05 would get you there, but 09:25 is the LATEST that still'
            ' makes it, so it is the one to catch." }'),
        5: ("\\U0001f4c6",
            '{ q: "It is 28 April. What is the date 9 days later?",'
            ' o: ["7 May", "6 May", "37 April"], a: 0,'
            ' w: "April has 30 days, so 2 days take you to the 30th and 7 are left over: 7 May." }'),
        6: ("\\U0001f5d3\\ufe0f",
            '{ q: "How many months from March 2024 to January 2026?", o: ["22", "10", "24"], a: 0,'
            ' w: "Two whole years is 24 months, but January is two months BEFORE March, so it is'
            ' 24 \\u2212 2 = 22." }'),
    },
    "patterns": {
        1: ("\\u2796",
            '{ q: "An odd number take away an odd number always gives:",'
            ' o: ["An even number", "An odd number", "It depends"], a: 0,'
            ' w: "Each one has a single leftover, and those two leftovers cancel \\u2014 so nothing is left'
            ' over and the answer pairs up exactly." }'),
        2: ("\\u2753",
            '{ q: "If \\u25b2 \\u2212 14 = 30, what is \\u25b2?", o: ["44", "16", "30"], a: 0,'
            ' w: "Here the shape is the WHOLE, before anything was taken. Put the pieces back: 30 + 14 = 44." }'),
        3: ("\\u2696\\ufe0f",
            '{ q: "If \\u25a0 + \\u25a0 + \\u25a0 = 24, what is \\u25a0?", o: ["8", "12", "21"], a: 0,'
            ' w: "The same shape is the same number every time, so 24 splits into three equal parts: 24 \\u00f7 3 = 8." }'),
        4: ("\\U0001f4c8",
            '{ q: "5, 12, 19, 26 \\u2026 is this linear or non-linear?",'
            ' o: ["Linear", "Non-linear", "Neither"], a: 0,'
            ' w: "The steps are +7, +7, +7 \\u2014 the same every time, which is what linear means." }'),
        5: ("\\U0001f4dc",
            '{ q: "2, 5, 9, 14 \\u2026 what is the term-to-term rule?",'
            ' o: ["Add one more each time than you added before", "Add 3 every time", "Double it"], a: 0,'
            ' w: "The steps are +3, +4, +5. They are not the same, so it is not add 3 every time \\u2014 each'
            ' step is one bigger than the last." }'),
        6: ("\\u2795",
            '{ q: "How many dots turn a 6 by 6 square into a 7 by 7 one?", o: ["13", "12", "7"], a: 0,'
            ' w: "An arm of 6 down one side, an arm of 6 along the other, and 1 in the corner: 6 + 6 + 1 = 13.'
            ' That is why the gaps between square numbers are the odd numbers." }'),
    },
    "bignum": {
        1: ("\\U0001f3f7\\ufe0f",
            '{ q: "What is the 6 worth in 63,451?", o: ["60 000", "6 000", "6"], a: 0,'
            ' w: "It sits in the ten thousands column, so it is worth 6 \\u00d7 10 000." }'),
        2: ("\\U0001f504",
            '{ q: "Which of these is the same number as 4,208?",'
            ' o: ["3 thousands, 12 hundreds, 0 tens, 8 ones", "4 thousands, 12 hundreds, 0 tens, 8 ones",'
            ' "3 thousands, 2 hundreds, 0 tens, 8 ones"], a: 0,'
            ' w: "One thousand was swapped for ten hundreds: 3,000 + 1,200 + 8 = 4,208." }'),
        3: ("\\U0001f463",
            '{ q: "A sequence goes 1,240, 1,290, 1,340 \\u2026 what comes next?",'
            ' o: ["1,390", "1,350", "1,440"], a: 0,'
            ' w: "Each step adds 50, because 1,290 \\u2212 1,240 = 50. So 1,340 + 50 = 1,390." }'),
        4: ("\\U0001f4f6",
            '{ q: "Which list is in order, smallest first?",'
            ' o: ["\\u22128, \\u22123, 0, 5", "\\u22123, \\u22128, 0, 5", "0, \\u22123, \\u22128, 5"], a: 0,'
            ' w: "Further left on the line is smaller, so \\u22128 comes before \\u22123." }'),
        5: ("\\U0001f3af",
            '{ q: "Round 4,650 to the nearest 100.", o: ["4,700", "4,600", "5,000"], a: 0,'
            ' w: "It is exactly halfway between 4,600 and 4,700, and halfway is the case that rounds up." }'),
        6: ("\\U0001f590\\ufe0f",
            '{ q: "Round 47,318 to the nearest 1000.", o: ["47,000", "47,300", "50,000"], a: 0,'
            ' w: "It sits between 47,000 and 48,000, and it is only 318 past 47,000. The other two answers'
            ' round it to the nearest 100 and the nearest 10 000." }'),
    },
    "where": {
        1: ("\\U0001f504",
            '{ q: "You face north and make a quarter turn clockwise. Which way now?",'
            ' o: ["East", "West", "South"], a: 0,'
            ' w: "The points run north, east, south, west, so one quarter turn moves you on one." }'),
        2: ("\\u2197\\ufe0f",
            '{ q: "Which point lies between south and west?", o: ["SW", "SE", "NW"], a: 0,'
            ' w: "Join the two names: south-west, written SW. The north or south part comes first." }'),
        3: ("\\U0001f6b6",
            '{ q: "Hodan starts on a square and walks 3 squares east, then 2 north. How many squares east of her start is she?", o: ["3", "5", "1"], a: 0,'
            ' w: "Only the first move went east. Going north changes the row, not the column." }'),
        4: ("\\u2195\\ufe0f",
            '{ q: "Is (2, 6) the same place as (6, 2)?", o: ["No", "Yes", "Only on a big grid"], a: 0,'
            ' w: "The first number is along and the second is up, so swapping them moves the point." }'),
        5: ("\\u25fb\\ufe0f",
            '{ q: "A rectangle has corners at (1, 1) and (4, 3). What are the other two?",'
            ' o: ["(4, 1) and (1, 3)", "(1, 4) and (3, 1)", "(4, 4) and (1, 1)"], a: 0,'
            ' w: "The corners share their numbers: each one takes an along from one and an up from the other." }'),
        6: ("\\U0001f98b",
            '{ q: "The mirror line runs along the edge of a shape. Where does the reflection sit?",'
            ' o: ["Touching the shape", "One square away", "On top of the shape"], a: 0,'
            ' w: "A square against the mirror has no distance to cross, so its partner sits right beside it." }'),
    },
    # 2026-09-11: the thinnest lessons grew, and every new step is about a named child
    "frac": {
        1: ("\\U0001f36c",
            '{ q: "Amina has 30 mangoes and gives one fifth of them to her grandmother. How many does she give?",'
            ' o: ["6", "5", "25"], a: 0,'
            ' w: "One fifth means 5 equal groups: 30 \\u00f7 5 = 6 in each group. 5 is the number of groups, and 25 is what she keeps." }'),
        2: ("\\U0001f4f6",
            '{ q: "Which list is in order, smallest first?",'
            ' o: ["One quarter, one half, five eighths", "Five eighths, one half, one quarter", "One half, one quarter, five eighths"], a: 0,'
            ' w: "In eighths they are 2, 4 and 5 eighths, so one quarter is the smallest and five eighths the biggest." }'),
    },
    "stats": {
        1: ("\\U0001f4c8",
            '{ q: "Which would you use to sort children by two questions at once: has a pet, and walks to school?",'
            ' o: ["A Carroll diagram", "A bar chart", "A dot plot"], a: 0,'
            ' w: "A Carroll diagram has a box for each pair of answers, so it sorts by two questions at once." }'),
        2: ("\\u2614",
            '{ q: "Musa rolls an ordinary dice. How likely is it that he rolls a number less than 7?",'
            ' o: ["Certain", "Maybe", "Impossible"], a: 0,'
            ' w: "Every number on an ordinary dice, 1 to 6, is less than 7, so it is certain." }'),
    },
    "shape": {
        1: ("\\U0001f6a7",
            '{ q: "Hodan puts a fence all the way round a garden 7 metres long and 3 metres wide. How much fence does she need?",'
            ' o: ["20 metres", "21 metres", "10 metres"], a: 0,'
            ' w: "All the way round is 7 + 3 + 7 + 3 = 2 \\u00d7 (7 + 3) = 20 metres. 21 is the area inside, and 10 only goes half way round." }'),
        2: ("\\u2795",
            '{ q: "An L shape is a 5 by 3 rectangle joined to a 2 by 2 square. What is its area?",'
            ' o: ["19 squares", "15 squares", "25 squares"], a: 0,'
            ' w: "Add the two areas: 5 \\u00d7 3 = 15 and 2 \\u00d7 2 = 4, so 15 + 4 = 19 squares." }'),
    },
}


def blocks(js):
    """(label, text) per top-level slide block, plus the preamble."""
    marks = [(m.start(), m.group(1) or "ask")
             for m in re.finditer(r"/\* ---- (?:(\d+):|your turn)", js)]
    out, pre = [], js[: marks[0][0]]
    for i, (pos, lab) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(js)
        out.append((lab, js[pos:end]))
    return pre, out


def sections(body):
    """(text) per <section class="slide">, in order."""
    idx = [m.start() for m in re.finditer(r'<section class="slide"', body)]
    end = body.rindex("</section>") + len("</section>")
    out = []
    for i, p in enumerate(idx):
        stop = idx[i + 1] if i + 1 < len(idx) else end
        out.append(body[p:stop])
    return body[: idx[0]], out, body[end:]


def quiz_items(js):
    m = re.search(r"(const Q\d+ = shuffle\(\[)(.*?)(\n  \]\))", js, re.S)
    assert m, "no quiz array found"
    raw = m.group(2)
    parts, depth, cur = [], 0, ""
    for ch in raw:
        cur += ch
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                # every item after the first arrives with the previous item's
                # separating comma still attached; strip it before the shape test
                parts.append(cur.strip().lstrip(",").strip().rstrip(","))
                cur = ""
    got = [p for p in parts if p.startswith("{")]
    assert len(got) == len(parts), "quiz parser dropped %d item(s)" % (len(parts) - len(got))
    return m, got


def heading(section):
    """The <h2> of a composed slide, as plain text -- what its sticker is called."""
    m = re.search(r"<h2>(.*?)</h2>", section, re.S)
    assert m, "a slide has no <h2> to name its sticker by"
    t = re.sub(r"<[^>]*>", "", m.group(1))
    for ent, ch in (("&amp;", "&"), ("&mdash;", u"—"), ("&ndash;", u"–"),
                    ("&rsquo;", u"’"), ("&nbsp;", " ")):
        t = t.replace(ent, ch)
    return " ".join(t.split())


def js_str(s):
    """Text for a double-quoted JS string.

    The extras tables spell an emoji \\U0001f522 so this file stays ASCII, and JS has
    no \\U escape -- it reads the backslash as nothing and prints a literal U followed
    by eight digits, which is half of what the sticker shelf was showing. Decode here
    and emit the character. \\u2744 IS valid JS and would have survived either way,
    which is why some stickers looked right and others did not.
    """
    if "\\" in s:
        s = s.encode("ascii").decode("unicode_escape")
    return s.replace("\\", "\\\\").replace('"', '\\"')


def declared_names(js):
    """Every name a top-level const/let/var/function in `js` introduces.

    Reads the WHOLE declaration, not the first identifier in it. `let deg10 = 45,
    quiz10 = null, right10 = 0` introduces three names, and a scan that stops at the
    first `=` sees one -- which is how a collision with the check block's own
    `right10` survived both a duplicate-scan and a rename and only surfaced as a
    node --check error two steps later. Commas are split at bracket depth 0 so an
    array or object initialiser cannot be mistaken for a second declarator.
    """
    out = []
    for m in re.finditer(r"^  (?:const|let|var)\s+(.+?);\s*$", js, re.M | re.S):
        text, depth, cur, parts = m.group(1), 0, "", []
        for ch in text:
            if ch in "([{":
                depth += 1
            elif ch in ")]}":
                depth -= 1
            if ch == "," and depth == 0:
                parts.append(cur); cur = ""
            else:
                cur += ch
        parts.append(cur)
        for p in parts:
            n = p.split("=")[0].strip()
            if re.fullmatch(r"[A-Za-z_$][\w$]*", n or ""):
                out.append(n)
    out += re.findall(r"^  function\s+([A-Za-z_$][\w$]*)", js, re.M)
    return out


def new_slide(key, no, newpos, with_pre):
    """One slide written for this build, from new-<key>-{body.html,slides.js}.

    No id prefixing and no declaration renaming: everything in those files is already
    prefixed, which is checked by the duplicate assertion in main() rather than
    assumed here.

    `with_pre` carries the file's shared preamble and is decided by the CALLER, which
    is the only place that knows the teaching order. It used to be `no == 1` -- the
    file's own first slide -- which is right only while the new slides happen to be
    authored in the order the lesson uses them. Telling the Time wants its units slide
    second and its clock slide fourth; numbering the clock 1 would have put every
    shared helper into the file AFTER the slide that calls them, as a bare reference
    error at load with nothing to say which file it came from."""
    body = io.open(os.path.join(HERE, "new-%s-body.html" % key), encoding="utf-8").read()
    js = io.open(os.path.join(HERE, "new-%s-slides.js" % key), encoding="utf-8").read()
    sec = re.split(r'(?=<section class="slide")', body)[1:][no - 1]
    marks = [(m.start(), int(m.group(1))) for m in re.finditer(r"/\* ---- (\d+):", js)]
    pos = [p for p, n in marks if n == no][0]
    nxt = [p for p, n in marks if n == no + 1]
    blk = js[pos:(nxt[0] if nxt else len(js))]
    pre = js[: marks[0][0]] if with_pre else ""
    sec = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newpos, sec, count=1)
    blk = re.sub(r"\bfinish\(\s*%d\s*," % (no - 1), "finish(%d," % (newpos - 1), blk)
    return sec, pre + blk


def donor_slide(no, newpos):
    """One Four Digits Strong slide, ids prefixed so it cannot collide, badge and
    finish() set to its new position. Safe because that file builds no id
    dynamically -- every $() call in these blocks takes a literal."""
    body = io.open(os.path.join(HERE, DONOR_BODY), encoding="utf-8").read()
    js = io.open(os.path.join(HERE, DONOR_JS), encoding="utf-8").read()
    sec = re.split(r'(?=<section class="slide")', body)[1:][no - 1]
    marks = [(m.start(), int(m.group(1))) for m in re.finditer(r"/\* ---- (\d+):", js)]
    pos = [p for p, n in marks if n == no][0]
    nxt = [p for p, n in marks if n == no + 1]
    blk = js[pos:(nxt[0] if nxt else len(js))]

    pre = "d%d_" % no
    for i in sorted(set(re.findall(r'id="([A-Za-z][A-Za-z0-9_]*)"', sec)), key=len, reverse=True):
        sec = sec.replace('id="%s"' % i, 'id="%s%s"' % (pre, i))
        sec = sec.replace('for="%s"' % i, 'for="%s%s"' % (pre, i))
        blk = blk.replace('"%s"' % i, '"%s%s"' % (pre, i))

    # Rename this block's own top-level declarations too. Ids alone are not enough:
    # the donor numbers its variables by slide, so `let deg10 = 0, right10 = 0` from
    # slide 10 collides with the target's check block, which also counts `right10`.
    # Every name in a comma list has to be taken, which is why this reads past the
    # first identifier -- a scan that stops at it reports no duplicates and is wrong.
    names = set(declared_names(blk))
    for n in sorted(names, key=len, reverse=True):
        blk = re.sub(r"\b%s\b" % re.escape(n), pre + n, blk)
    sec = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newpos, sec, count=1)
    blk = re.sub(r"\bfinish\(\s*%d\s*," % (no - 1), "finish(%d," % (newpos - 1), blk)
    return sec, blk


def compose(key, title, srckey, keep, keepq):
    body = io.open(os.path.join(HERE, "%s-body.html" % srckey), encoding="utf-8").read()
    js = io.open(os.path.join(HERE, "%s-slides.js" % srckey), encoding="utf-8").read()
    pre, blks = blocks(js)
    head, secs, tail = sections(body)
    by = {}
    for lab, txt in blks:
        by.setdefault(lab, []).append(txt)
    teach = sorted(int(k) for k in by if k.isdigit())
    n_teach = len(secs) - 2                      # last two are check + stickers
    if keep is None:
        keep = list(range(1, n_teach + 1))
    checkno, stickno = n_teach + 1, n_teach + 2

    seq = keep
    total = len(seq)
    newpos = {}          # source slide number -> its position in this lesson

    # ---- body and slide js, walked in the ORDERED sequence ----
    out_secs, slide_blks = [], []
    for new, item in enumerate(seq, start=1):
        if isinstance(item, tuple) and item[0] == "d":    # a Four Digits Strong slide
            sec, blk = donor_slide(item[1], new)
        elif isinstance(item, tuple) and item[0] == "n":  # a slide written for this build
            first_new = next(i for i in seq if isinstance(i, tuple) and i[0] == "n")
            sec, blk = new_slide(key, item[1], new, item == first_new)
        else:
            newpos[item] = new
            sec = secs[item - 1]
            sec = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % new, sec, count=1)
            sec = sec.replace('id="ask%d"' % item, 'id="ask%d"' % new)
            blk = by[str(item)][0]
            blk = re.sub(r"\bfinish\(\s*%d\s*," % (item - 1), "finish(%d," % (new - 1), blk)
        out_secs.append(sec)
        slide_blks.append(blk)
    for extra, newno in ((checkno, total + 1), (stickno, total + 2)):
        s = secs[extra - 1]
        s = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newno, s, count=1)
        out_secs.append(s)
    new_body = head + "\n".join(out_secs) + tail

    # ---- slides js ----
    parts = [pre] + slide_blks
    # check block, with its quiz partitioned and each donor slide's own item added
    chk = by[str(checkno)][0]
    m, items = quiz_items(chk)
    if keepq is None:
        keepq = list(range(1, len(items) + 1))
    picked = [items[i - 1] for i in keepq]
    picked += [DONOR_EXTRAS[d[1]][1] for d in seq if isinstance(d, tuple) and d[0] == "d"]
    picked += [NEW_EXTRAS[key][d[1]][1] for d in seq if isinstance(d, tuple) and d[0] == "n"]
    chk = chk[: m.start(2)] + "\n    " + ",\n    ".join(picked) + chk[m.end(2):]
    # THE PASS MARK IS AN ABSOLUTE NUMBER AND THE QUIZ LENGTH JUST CHANGED.
    # Each source ends its check with `if (rq >= 7) finish(...)` -- 7 of that
    # source's 10 -- and the recut left the 7 while cutting the quiz to four
    # questions, so in bignum, patterns and calc the check slide could not be
    # finished at all: no dot, and no sticker for it either.
    #
    # It used to SCALE the source's own number rather than impose a house rule,
    # on the stated grounds that "the authors do not agree on a ratio (num
    # 7/10, frac 6/8, time 6/11, stats 6/15)". That preserved the disagreement
    # instead of the ratio: measured on the live pages 2026-09-12, Grade 4 asked
    # for 67% in Shape and Measures and 80% in Parts of a Whole, and Grade 3 for
    # 67% where Grade 1 asked three quarters. The ratio the authors did not
    # agree on is exactly the thing a house rule is for, so _app.pass_mark is
    # now the one definition and every grade computes from it.
    mth = re.search(r"if \((\w+) >= (\d+)\) finish\(\s*%d\s*," % (checkno - 1), chk)
    assert mth, "%s: cannot find the check slide's pass mark" % key
    scaled = pass_mark(len(picked))
    chk = chk[: mth.start(2)] + str(scaled) + chk[mth.end(2):]
    # ...and the same number where Try again says how many are needed
    # (fix-validation.py, 2026-09-11) - two copies of one mark must not disagree
    chk, nr = re.subn(r"(retryCheck\([^;]*?\.length, )\d+(, function)",
                      lambda r: r.group(1) + str(scaled) + r.group(2), chk)
    assert nr == 1, "%s: expected one retryCheck in the check block, found %d" % (key, nr)
    chk = re.sub(r"\bfinish\(\s*%d\s*," % (checkno - 1), "finish(%d," % total, chk)
    parts.append(chk)
    # Stickers, one per finishable step, in sequence order so they stay parallel to
    # done[] -- which is every teaching slide AND the check, so total + 1 of them.
    #
    # EACH ENTRY IS A PAIR, ["emoji", "label"], and reading it as a flat list of
    # strings is what shipped a broken shelf in all eight lessons: a findall over
    # every quoted string took the emoji of slide 5 and the label of slide 5 as two
    # separate stickers, and paintStickers does s[0] and s[1] -- so on a plain string
    # it renders the first two CHARACTERS. The shelf read: U 0 | half a surrogate |
    # a snowflake and its variation selector | N u.
    #
    # The label is read from the slide's own <h2> rather than carried in a second
    # table. The source array agrees with the headings today; a sticker naming a
    # different step than the one the learner finished is exactly the drift a
    # parallel list invites, and the donor and newly written slides would each need
    # a label of their own besides.
    stk = by[str(stickno)][0]
    sm = re.search(r"(const STICKERS = \[)(.*?)(\];)", stk, re.S)
    assert sm, "no STICKERS array"
    src_st = re.findall(r'\[\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\]', sm.group(2))
    assert len(src_st) >= n_teach, (
        "%s: STICKERS parsed as %d pair(s) against %d teaching slides -- if the array\n"
        "has stopped being pairs, fix this parser rather than let it read fewer"
        % (key, len(src_st), n_teach))
    picked_st = []
    for pos, item in enumerate(seq):
        if isinstance(item, tuple):
            table = DONOR_EXTRAS if item[0] == "d" else NEW_EXTRAS[key]
            emoji = table[item[1]][0]
        else:
            emoji = src_st[item - 1][0] if item - 1 < len(src_st) else "\\u2b50"
        picked_st.append('["%s", "%s"]' % (js_str(emoji), js_str(heading(out_secs[pos]))))
    # the check slide is finishable too, so it has a sticker; the recut had been
    # dropping it, leaving done[total] with nothing on the shelf to show for it
    picked_st.append('["%s", "%s"]' % (js_str(src_st[-1][0]), js_str(heading(out_secs[total]))))
    # TWO STICKERS THE SAME ARE ONE STICKER TO A CHILD. Within a shelf the emoji is
    # what tells a step apart at a glance, and three shelves had a repeat before this
    # was asserted -- Where Things Are drew the compass twice and the mirror twice,
    # Telling the Time the mantel clock twice and the bus twice, and Ways to Calculate
    # the multiplication sign twice. Across lessons a repeat is fine; nobody sees two
    # shelves at once.
    faces = [re.match(r'\["(.*?)",', p).group(1) for p in picked_st]
    dupe = sorted(set(f for f in faces if faces.count(f) > 1))
    assert not dupe, ("%s: two steps share a sticker %s -- give one of them its own in\n"
                      "DONOR_EXTRAS / NEW_EXTRAS, or in the source lesson's STICKERS"
                      % (key, dupe))
    assert len(picked_st) == total + 1, (
        "STICKERS must cover done[0..total]: %d vs %d" % (len(picked_st), total + 1))
    stk = stk[: sm.start(2)] + " " + ", ".join(picked_st) + " " + stk[sm.end(2):]
    stk = re.sub(r"\bfinish\(\s*%d\s*," % (stickno - 1), "finish(%d," % (total + 1), stk)
    parts.append(stk)
    # your-turn panels that belong to a kept slide
    for lab, txt in blks:
        if lab != "ask":
            continue
        head_ask, kept_ask = txt.split("ask(", 1)
        chunks = ("ask(" + kept_ask).split("\n  ask(")
        chunks = [chunks[0]] + ["  ask(" + c for c in chunks[1:]]
        keptc = [head_ask]
        for c in chunks:
            mm = re.match(r"\s*ask\((\d+),", c)
            if not mm:
                continue
            old = int(mm.group(1))
            if old in newpos:            # its slide survived; move the panel with it
                keptc.append(re.sub(r"ask\(\s*%d\s*," % old,
                                    "ask(%d," % newpos[old], c, count=1))
        if len(keptc) > 1:
            parts.append("".join(keptc))
    return new_body, "".join(parts)


def main():
    written = 0
    for key, title, srckey, keep, keepq in STRUCTURE:
        body, js = compose(key, title, srckey, keep, keepq)
        # Catch a name collision HERE rather than as a node --check error on the
        # built page two steps later. All slide code shares one scope, so a repeat
        # breaks the whole lesson at load.
        seen, dup = set(), []
        for n in declared_names(js):
            (dup.append(n) if n in seen else seen.add(n))
        assert not dup, "%s: duplicate top-level declaration(s): %s" % (key, sorted(set(dup)))
        io.open(os.path.join(HERE, "c-%s-body.html" % key), "w", encoding="utf-8", newline="").write(body)
        io.open(os.path.join(HERE, "c-%s-slides.js" % key), "w", encoding="utf-8", newline="").write(js)
        n = body.count('<section class="slide"')
        print("  %-9s %-30s %d slides (%d teaching) from %s"
              % (key, title, n, n - 2, srckey))
        written += 1
    print("\n%d lesson sources composed (c-*-body.html, c-*-slides.js)" % written)


if __name__ == "__main__":
    main()
