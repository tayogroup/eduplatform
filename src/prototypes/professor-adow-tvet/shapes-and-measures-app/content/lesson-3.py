# -*- coding: utf-8 -*-
"""Lesson 3 — Square, Level and Setting Out.

Shapes and Measurements, units SM.05 (square, level and plumb) and SM.06
(setting out and estimating materials). Eight criteria.

The lesson where measurement stops being arithmetic and becomes a way of
proving something on site: that a corner really is square, that a surface
really is level, and that the quantity ordered is one another person can
check.
"""
from _kit import step, opt, q, word

import base64, os

# Inlined, not linked: a published artifact refuses to serve a .vtt whatever
# content type it is given, so a linked track 404s there silently. The .vtt
# the renderer wrote stays the source of truth and is read at build time.
_VTT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "lecture-video", "square-level-and-setting-out.bed49319.vtt")
with open(_VTT, "rb") as _fh:
    CAPTIONS = "data:text/vtt;base64," + base64.b64encode(_fh.read()).decode("ascii")

LESSON = {
    "slug": "square-level-and-setting-out",
    "title": "Square, Level and Setting Out",
    "module": "shapes-measures",
    "blurb": (
        "Tell square, level and plumb apart and know which tool proves each, read a "
        "spirit level and say which way the work moves, prove a frame square by its "
        "diagonals, set out a right angle with 3-4-5, and produce an estimate somebody "
        "else can check."
    ),
    "outcomes": [
        "Say what square, level and plumb each mean, and which tool proves each.",
        "Read a spirit level and say which way the work must move.",
        "Prove a rectangle square by measuring both diagonals.",
        "Set out a right angle on the ground with the 3-4-5 rule.",
        "Calculate how many units a measured area or length needs.",
        "Add a stated waste allowance and present the working.",
    ],
    "steps": [

        # THE UNIT LECTURE, before the learner does anything.
        #
        # THIS FILM WAS MADE FOR THIS LESSON. It is not borrowed: all 116
        # storyboards in the Ehel library were scanned first, and nothing
        # there teaches this. "volume" appears nowhere in a measuring sense,
        # "area" only in the Stage 4 maths film another lesson already uses,
        # and the nearest thing to setting out teaches the right angle as a
        # compass quarter turn. So it is drawn in the trade's own terms, in
        # the school's own voice, and it covers the whole lesson rather than
        # a corner of it - which is why it claims every criterion below and
        # the borrowed films claim one each.
        #
        # Re-encoded after rendering for delivery only, because the published
        # demo has a 64 MB ceiling. Same length, same picture.
        #
        # No `parts`: a film and nothing else.
        step("lecture", "Unit lecture", ["ADOW-SM-SM.05.1", "ADOW-SM-SM.05.2", "ADOW-SM-SM.05.3", "ADOW-SM-SM.06.1", "ADOW-SM-SM.06.2", "ADOW-SM-SM.06.3"],
             {"video": {"src": "lecture-video/square-level-and-setting-out.f638b33d.mp4",
                        "captions": CAPTIONS,
                        "poster": "lecture-video/square-level-and-setting-out.b7d9591b.jpg"},
              # The same film, at the learner's pace. A SIBLING of "video",
              # not a key inside it: R.lecture reads data.slides.
              "slides": "lecture-video/square-level-and-setting-out.089c774a.slides.html",
              "underFilm": "What square, level and plumb each mean, the tool that proves each, the diagonals, the 3-4-5, and the waste allowance."},
             ask="Watch the film first. It proves each of the three, then sets out a corner and counts what goes in it.",
             error=("Taking the three words as one idea.",
                    "Square is two things at ninety degrees, level is horizontal and plumb is vertical, and each has its own tool. A wall can be dead plumb and still not square to the wall beside it, so a spirit level held upright proves nothing about a corner. The steps below test the three separately for exactly that reason.")),

        step("browse", "Square, level and plumb", ["ADOW-SM-SM.05.1"],
             {"ask": "Three different things, three different tools. Tap each one.",
              "finish": "Square is between two edges. Level is along the horizontal. Plumb is the vertical. Confusing them is how a wall ends up true to nothing.",
              "items": [
                  {"draw": "trySquare", "say": "SQUARE means two edges meet at ninety degrees. The try square proves it — and it says nothing at all about whether the work is level or upright. A perfectly square frame can be leaning."},
                  {"draw": "level", "say": "LEVEL means horizontal — true to the earth, not to the work beside it. The spirit level proves it. A surface can be level and still not square to the wall it meets."},
                  {"draw": "plumb", "say": "PLUMB means truly vertical. The plumb bob proves it, using gravity itself, which is why it needs no calibration and cannot drift. A spirit level's vertical vial does the same job faster and less reliably."},
                  {"draw": "diagonals", "say": "And this proves a whole RECTANGLE square without any tool but a tape: if both diagonals are the same length, the four corners are right angles. It checks the shape, not one corner."},
              ]},
             error=("Checking one corner with a square and calling the frame square.",
                    "A four-sided frame can have one perfect corner and still be a parallelogram. "
                    "One corner tells you about one corner; the diagonals tell you about the "
                    "whole frame, which is what you actually need to know.")),

        step("levelread", "Reading the bubble",
             ["ADOW-SM-SM.05.2", "ADOW-SM-SM.05.4"],
             {"finish": "The bubble runs UPHILL. Wherever it sits, that end is high.",
              "items": [
                  {"ask": "The bubble sits between the lines. What does the level read?",
                   "tilt": 0,
                   "opts": [opt("Level — no adjustment needed", True),
                            opt("High on the left", False, "The bubble is centred. Nothing to correct."),
                            opt("It cannot be read from this", False, "Between the two lines is exactly what level looks like.")],
                   "why": "Level. The bubble sits between the two marks, and that is the only reading that means no adjustment."},

                  {"ask": "The bubble has run to the RIGHT. Which end is high, and what do you do?",
                   "tilt": 0.8,
                   "opts": [opt("The right end is high — lower the right, or pack up the left", True),
                            opt("The right end is low — pack up the right", False,
                                "The bubble is air: it rises. It has gone right because right is UP."),
                            opt("The level is faulty", False,
                                "Possible, and check it by reversing it — but the ordinary reading is that the right is high.")],
                   "why": "The right is high. Air rises, so the bubble always runs to the high end — lower that end, or pack the other one up."},

                  {"ask": "You reverse the level end for end on the same surface and the bubble moves to the other side by the same amount. What does that tell you?",
                   "tilt": -0.8,
                   "opts": [opt("The surface really is out, and the level is reading true", False,
                                "If the surface were out, reversing would keep the bubble on the same physical end."),
                            opt("The LEVEL is out of true, and the surface may be fine", True),
                            opt("Nothing — reversing proves nothing", False,
                                "Reversing is the one test that separates a bad surface from a bad tool.")],
                   "why": "The level itself is out. A true level reads the same physical end high whichever way round it sits; one that swaps sides on reversal is lying, and this is how you catch it."},
              ]},
             error=("Trusting a level that has been dropped.",
                    "A spirit level is a precision tool with a glass vial in it. Reverse it on a "
                    "surface you have just read: if the bubble swaps sides, the tool is wrong, "
                    "not the work — and everything measured with it since the drop is suspect.")),

        step("calc", "Proving a frame square", ["ADOW-SM-SM.05.3"],
             {"finish": "Equal diagonals, square frame. It is the fastest true check on site and it costs one tape.",
              "items": [
                  {"ask": "A frame should be 1200 mm × 800 mm. If it is truly square, how long should each diagonal be? Use a² + b² = c².",
                   "draw": "diagonals", "unit": "mm", "answer": 1442, "tol": 5,
                   "working": ["c² = 1200² + 800²", "= 1 440 000 + 640 000 = 2 080 000",
                               "c = √2 080 000", "≈ 1442 mm"],
                   "why": "About 1442 mm. You rarely need this number on site — you only need the two diagonals to MATCH — but it is the check when you are setting out from nothing."},

                  {"ask": "You measure the diagonals of a cramped-up frame: 1442 mm and 1456 mm. By how much do they differ?",
                   "draw": "diagonals", "unit": "mm", "answer": 14, "tol": 0,
                   "working": ["1456 − 1442 = 14 mm"],
                   "why": "14 mm out of square. Ease the cramp on the LONG diagonal — pulling the frame along its longer diagonal shortens it and lengthens the other. Adjust before the glue sets, not after."},
              ]},
             error=("Measuring the diagonals after the glue has gone off.",
                    "The diagonals are checked while the assembly can still move. Once the glue "
                    "has set, an out-of-square frame is out of square permanently.")),

        step("calc", "Setting out with 3-4-5", ["ADOW-SM-SM.06.1"],
             {"finish": "3-4-5 makes a right angle out of a tape and two pegs. It is the oldest tool in setting out and still the best one.",
              "items": [
                  {"ask": "You set out 3 m along one line and 4 m along the other. If the corner is a true right angle, what must the distance between those two points be?",
                   "draw": "setOut345", "unit": "m", "answer": 5, "tol": 0,
                   "working": ["3² + 4² = 9 + 16 = 25", "√25 = 5", "The diagonal must measure 5 m"],
                   "why": "Five metres. If it measures five, the corner is square. If it does not, swing one line until it does."},

                  {"ask": "The corner is too small for 3-4-5, so you use the same rule at a smaller size: 1.5 m and 2.0 m. What must the diagonal be?",
                   "draw": "setOut345", "unit": "m", "answer": 2.5, "tol": 0,
                   "working": ["Every side halved: 1.5, 2.0, and 2.5", "Check: 1.5² + 2.0² = 2.25 + 4 = 6.25", "√6.25 = 2.5 m"],
                   "why": "2.5 m. ANY multiple of 3, 4 and 5 works — 6-8-10 on a big site, 1.5-2-2.5 in a tight corner. That is why it is a rule rather than three numbers."},

                  {"ask": "On a large site you want the longest version that fits in a 30 m tape. Using 6-8-10, what is the diagonal in metres?",
                   "draw": "setOut345", "unit": "m", "answer": 10, "tol": 0,
                   "working": ["3-4-5 doubled is 6-8-10", "6² + 8² = 36 + 64 = 100", "√100 = 10 m"],
                   "why": "Ten metres. Bigger is better: the same angular error shows up as a much larger distance error over long sides, so a large triangle sets out more accurately than a small one."},
              ]},
             error=("Setting out a whole building from a small square held against a peg.",
                    "A one-degree error on a 300 mm square becomes tens of millimetres by the far "
                    "corner of a building. Set out the right angle as LARGE as the site and the "
                    "tape allow — that is the whole reason 3-4-5 exists.")),

        step("calc", "Estimating what to order",
             ["ADOW-SM-SM.06.2", "ADOW-SM-SM.06.3"],
             {"finish": "Measure, calculate, add the stated allowance, and write all three down. An estimate nobody can check is a guess with a number on it.",
              "items": [
                  {"ask": "A floor of 10.0 m² is tiled with tiles 0.5 m × 0.5 m. How many tiles, before any waste allowance?",
                   "draw": "rectRoom", "unit": "tiles", "answer": 40, "tol": 0,
                   "working": ["Area of one tile = 0.5 × 0.5 = 0.25 m²", "10.0 ÷ 0.25 = 40 tiles"],
                   "why": "Forty tiles. Divide the area to be covered by the area of one unit — the same sum whether it is tiles, blocks, sheets or seedlings."},

                  {"ask": "Add a 10% allowance for cutting and breakage. How many tiles do you order? Round UP to a whole tile.",
                   "draw": "rectRoom", "unit": "tiles", "answer": 44, "tol": 0,
                   "working": ["10% of 40 = 4", "40 + 4 = 44 tiles"],
                   "why": "Forty-four. The allowance is stated as a percentage and shown separately, so whoever checks the order can see what it was and judge whether it was enough."},

                  {"ask": "A fence needs posts every 2.5 m along a 30 m run, with a post at BOTH ends. How many posts?",
                   "unit": "posts", "answer": 13, "tol": 0,
                   "working": ["Gaps: 30 ÷ 2.5 = 12 gaps", "Posts = gaps + 1 (there is a post at each end)", "12 + 1 = 13 posts"],
                   "why": "Thirteen, not twelve. Posts, studs, joists and rafters all have this catch: count the GAPS, then add one for the end. It is the single commonest counting error in setting out."},
              ]},
             error=("Dividing the length by the spacing and ordering that number.",
                    "That counts the gaps, not the posts. There is always one more post than "
                    "there are gaps in a run with both ends posted — and the missing one is "
                    "always noticed at the far end of the job, with nothing left to fix it.")),

        step("questions", "An estimate someone else can check", ["ADOW-SM-SM.06.4"],
             {"items": [
                 q("What should an estimate show, besides the answer?",
                   [opt("The measurements taken and the working, so it can be checked", True),
                    opt("Only the final quantity — the working is your own business", False,
                        "Then nobody can find an error but you, and you already missed it once."),
                    opt("The supplier's price list", False,
                        "Useful, and a different document. This one is about quantity.")],
                   "Measurements, working, answer. An estimate that shows only a number cannot be checked, corrected or defended."),

                 q("Your take-off says 44 tiles. The job uses 47. What should happen?",
                   [opt("Record it — the 10% allowance was too small for this layout", True),
                    opt("Nothing, estimates are always a bit out", False,
                        "They are, and the whole value of writing the allowance down is that you find out by how much."),
                    opt("Increase every future allowance to 25%", False,
                        "One job is not a pattern, and over-ordering has its own cost.")],
                   "Record the actual against the estimate. That is how an allowance stops being a guess and becomes a figure from your own work."),

                 q("Why is the waste allowance shown as a separate line rather than rolled into the total?",
                   [opt("So a checker can see what was allowed and judge whether it suits the job", True),
                    opt("So it can be removed to make the price look lower", False,
                        "Removing it does not make the job need less material."),
                    opt("Because suppliers require it", False,
                        "They do not. It is for whoever checks the estimate.")],
                   "So it can be seen and questioned. A diagonal-cut tile layout wastes far more than a square one, and a checker can only allow for that if the allowance is visible."),
             ]}),

        step("words", "The words of this job", ["ADOW-SM-SM.05.1"],
             {"items": [
                 word("square", "Two edges meeting at ninety degrees. Proved by a try square, or across a frame by equal diagonals."),
                 word("level", "Truly horizontal. Proved by a spirit level."),
                 word("plumb", "Truly vertical. Proved by a plumb bob, which uses gravity and cannot drift."),
                 word("diagonal", "Corner to opposite corner. Two equal diagonals mean a square frame."),
                 word("3-4-5", "A triangle with sides in that ratio has a right angle between the 3 and the 4. Any multiple works."),
                 word("setting out", "Marking the position and the lines of a job on the ground or the work before building it."),
                 word("take-off", "The measured list of quantities a job needs, taken off the drawing."),
                 word("waste allowance", "Extra added to an estimate for cutting and breakage, stated as a percentage and shown separately."),
             ]}),
    ],
}
