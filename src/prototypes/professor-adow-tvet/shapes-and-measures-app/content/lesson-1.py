# -*- coding: utf-8 -*-
"""Lesson 1 — Reading a Measurement.

Shapes and Measurements, units SM.01 (read a measurement) and SM.02
(units and converting between them). Eight criteria.

Cross-trade by design: the worked examples come from joinery, welding,
irrigation and food processing, because the skill is the same in all of
them and a learner from any department should see their own bench in it.
"""
from _kit import step, opt, q, word

LESSON = {
    "slug": "reading-a-measurement",
    "title": "Reading a Measurement",
    "module": "shapes-measures",
    "blurb": (
        "Find a measurement on a rule to the nearest millimetre, learn why a tape's "
        "hook is meant to move, convert between millimetres and metres without changing "
        "the quantity, and decide whether a measurement is inside the tolerance a job allows."
    ),
    "outcomes": [
        "Read a steel rule to the nearest millimetre.",
        "Measure from a true end or datum, never from a damaged one.",
        "Say why a tape's hook slides, and why bending it straight ruins the tape.",
        "Convert between millimetres, centimetres and metres.",
        "Work in one unit throughout and say which unit an answer is in.",
        "Say whether a measurement is inside a stated tolerance.",
    ],
    "steps": [

        step("findmark", "Find it on the rule", ["ADOW-SM-SM.01.1"],
             {"finish": "Whole centimetres first, then the millimetres past them. That is the whole method.",
              "items": [
                  {"ask": "Tap the rule at 47 mm.", "mm": 47,
                   "why": "Forty-seven. Four whole centimetres, then seven millimetre marks past the 4."},
                  {"ask": "Tap the rule at 8 mm.", "mm": 8,
                   "why": "Eight millimetres — not quite one centimetre. Under ten, there are no whole centimetres to count first.",
                   "miss": "Under one centimetre. Count the small marks up from zero."},
                  {"ask": "Tap the rule at 62 mm.", "mm": 62,
                   "why": "Sixty-two. Six centimetres and two millimetres — which is also 6.2 cm, the same length written differently."},
                  {"ask": "A drawing calls for 9.5 cm. Tap it.", "mm": 95,
                   "why": "9.5 cm is 95 mm: nine whole centimetres and five more marks — the half-centimetre mark, which is usually drawn longer.",
                   "miss": "9.5 cm is 95 mm. Find 9 on the scale first, then count five small marks past it."},
              ]},
             error=("Reading to the nearest mark instead of naming the millimetre.",
                    "\"Just under five centimetres\" is not a measurement, it is an impression. "
                    "The rule has a millimetre mark for every millimetre so that a reading can "
                    "be a number, and a number is the only thing another person can check.")),

        step("label", "The tape, and the hook that moves", ["ADOW-SM-SM.01.2"],
             {"tool": "tape"},
             error=("Finding the hook loose and squeezing it tight to \"fix\" it.",
                    "The hook slides by exactly its own thickness on purpose: pushed against a "
                    "surface it sits back for an inside measurement, hooked over an edge it pulls "
                    "forward for an outside one. Both then read true. Pinch it tight and every "
                    "measurement is out by the thickness of the hook, in one direction or the "
                    "other, for the life of the tape.")),

        step("questions", "Where a measurement starts",
             ["ADOW-SM-SM.01.2", "ADOW-SM-SM.01.4"],
             {"items": [
                 q("You are measuring a 6 m run with a tape held at both ends. The middle of the tape sags. What does the reading do?",
                   [opt("It reads LONG — the sagging tape travels further than the straight line", True),
                    opt("It reads short", False,
                        "A curve between two points is longer than the straight line between them, so the tape gives you more millimetres than the distance has."),
                    opt("Nothing — steel tapes do not sag", False,
                        "Over a long span held in the air, any tape sags under its own weight.")],
                   "Long. Support a long tape along its length, or lay it on the work, and pull it just taut — not stretched, which is the opposite error."),

                 q("How do you know a long measurement was taken with the tape straight?",
                   [opt("Take it twice and see whether the two readings agree", True),
                    opt("Pull harder the second time", False,
                        "Stretching the tape introduces a different error in the other direction."),
                    opt("You cannot know", False,
                        "A second reading is exactly how you find out.")],
                   "Repeat it. Two readings that agree over a long span mean the tape ran true both times; two that differ mean at least one of them was sagging or twisted."),

                 q("A length of steel has a burred, saw-cut end. Where do you measure from?",
                   [opt("Square the end first, or measure from a clean mark set in from it", True),
                    opt("From the longest point of the burr", False,
                        "The burr is not the end of the work — it is waste, and it is not even the same length across the section."),
                    opt("From the shortest point, to be safe", False,
                        "Safe in one direction and wrong in the other. The cut end is not square, so there is no single point to measure from.")],
                   "Measure from something true. Either square the end first, or set a datum mark in from it and work from that."),

                 q("Four brackets must be fixed along a rail at 300 mm spacing. How do you mark them?",
                   [opt("All four from the same datum: 300, 600, 900, 1200", True),
                    opt("Measure 300 from the last mark each time", False,
                        "Any error in one mark is carried into every mark after it, and they add up. This is the commonest cause of a run of holes that drifts."),
                    opt("Mark the two ends and space the rest by eye", False,
                        "Eye is not a method when the spacing is specified.")],
                   "From one datum. Measuring from mark to mark accumulates every small error; measuring from a single datum does not."),

                 q("Why is a measurement taken twice?",
                   [opt("Because a single reading has no way of being wrong that you could notice", True),
                    opt("Because tapes stretch between readings", False,
                        "A steel tape does not stretch meaningfully. The uncertainty is in the reading and the holding, not the tape."),
                    opt("It is not — checking twice wastes time", False,
                        "It costs seconds. Cutting to a wrong measurement costs the material.")],
                   "A second reading is the only cheap check there is. Two readings that agree are worth far more than one careful one."),
             ]}),

        step("calc", "Same length, different units", ["ADOW-SM-SM.02.1", "ADOW-SM-SM.02.3"],
             {"finish": "The quantity never changed — only the unit it was written in.",
              "items": [
                  {"ask": "A rail is 2.4 m long. How many millimetres is that?",
                   "unit": "mm", "answer": 2400, "tol": 0,
                   "working": ["1 m = 1000 mm", "2.4 × 1000 = 2400", "2.4 m = 2400 mm"],
                   "why": "Metres to millimetres: multiply by a thousand. The rail did not get longer — it is written in a smaller unit, so the number got bigger."},

                  {"ask": "A weld bead is 85 mm long. How many centimetres?",
                   "unit": "cm", "answer": 8.5, "tol": 0,
                   "working": ["10 mm = 1 cm", "85 ÷ 10 = 8.5", "85 mm = 8.5 cm"],
                   "why": "Millimetres to centimetres: divide by ten. Going to a bigger unit always makes the number smaller."},

                  {"ask": "A tank holds 2.5 cubic metres. How many litres?",
                   "unit": "litres", "answer": 2500, "tol": 0,
                   "working": ["1 m³ = 1000 litres", "2.5 × 1000 = 2500", "2.5 m³ = 2500 litres"],
                   "why": "A thousand litres to the cubic metre. This is the conversion irrigation and dairy work turn on, and it is worth knowing without looking it up."},
              ]},
             error=("Converting halfway through a calculation instead of at the start.",
                    "Put everything in ONE unit before you calculate anything. A sum with "
                    "millimetres and metres mixed into it will produce a number, and the number "
                    "will be wrong by a factor of a thousand — which is large enough to order a "
                    "lorry-load of something you needed a bucket of.")),

        step("questions", "An answer in the wrong unit",
             ["ADOW-SM-SM.02.2", "ADOW-SM-SM.02.4"],
             {"items": [
                 q("Asked for the area of a room, a learner answers \"14 metres\". What is wrong?",
                   [opt("Area is measured in square metres — 14 m is a length, not an area", True),
                    opt("Nothing, 14 metres is a reasonable size", False,
                        "The size may be reasonable. The unit says it is a length, and a length cannot be an area."),
                    opt("It should be in centimetres", False,
                        "The unit is wrong in kind, not in size.")],
                   "Square metres. A unit is part of the answer, and an answer with the wrong KIND of unit is wrong however good the arithmetic was."),

                 q("Asked for the volume of a trench, a learner answers \"7.2 m²\". What is wrong?",
                   [opt("Volume is in cubic metres — m² is an area", True),
                    opt("The number is too small", False,
                        "You cannot judge that until the unit is right."),
                    opt("Nothing", False,
                        "Squared is a surface. A trench holds a volume, which is cubed.")],
                   "Cubic metres. Squared for a surface, cubed for a space — and the exponent is how you can check an answer's kind before you check its size."),

                 q("A cutting list says a stile is 1.2 m and a rail is 900. What does \"900\" mean, and what is the risk?",
                   [opt("Millimetres — and the risk is that the two figures are in different units on the same list", True),
                    opt("900 metres", False, "Nothing in a cutting list is 900 metres long."),
                    opt("900 centimetres, which is 9 metres", False, "Also not a joinery component.")],
                   "Millimetres. A list that mixes units is an accident waiting to happen: write the whole list in one unit, and say at the top which it is."),
             ]}),

        step("calc", "Inside tolerance, or not", ["ADOW-SM-SM.01.3"],
             {"finish": "A tolerance is part of the specification. \"Close enough\" is not — somebody wrote down how close.",
              "items": [
                  {"ask": "A shelf must be 600 mm ± 2 mm. You measure 603 mm. By how many millimetres is it OUTSIDE tolerance?",
                   "unit": "mm", "answer": 1, "tol": 0,
                   "working": ["Allowed: 598 mm to 602 mm", "Measured: 603 mm", "603 − 602 = 1 mm outside"],
                   "why": "One millimetre over. It is a reject — and knowing by how much tells you whether it can be trimmed or has to be remade."},

                  {"ask": "A machined shaft must be 25.0 mm ± 0.1 mm. You measure 24.95 mm. Is it in tolerance? Enter 1 for yes, 0 for no.",
                   "unit": "1 = yes, 0 = no", "answer": 1, "tol": 0,
                   "working": ["Allowed: 24.9 mm to 25.1 mm", "Measured: 24.95 mm", "24.9 ≤ 24.95 ≤ 25.1 — inside"],
                   "why": "Inside. Note how much finer this tolerance is than the shelf's: a tenth of a millimetre against two whole ones. The trade sets the tolerance, not the tool."},
              ]},
             error=("Treating every job as needing the same accuracy.",
                    "A fence post within ten millimetres is fine work. A machined shaft ten "
                    "millimetres out is scrap. Ask what tolerance the job allows BEFORE choosing "
                    "the measuring tool — that is what decides whether a tape will do or whether "
                    "it has to be a rule or a gauge.")),

        step("words", "The words of this job", ["ADOW-SM-SM.02.2"],
             {"items": [
                 word("datum", "The one point every measurement on a job is taken from."),
                 word("tolerance", "How far from the stated size a job is still allowed to be. Written as ± a figure."),
                 word("millimetre", "A thousandth of a metre. The working unit of most trade drawings."),
                 word("square metre (m²)", "A unit of AREA — a surface. Floors, walls, sheet material."),
                 word("cubic metre (m³)", "A unit of VOLUME — a space. Concrete, soil, water, grain. One cubic metre is 1000 litres."),
                 word("hook", "The sliding end of a tape. It moves by its own thickness so inside and outside measurements both read true."),
                 word("accumulated error", "Small errors adding up because each mark was measured from the last one instead of from a datum."),
             ]}),
    ],
}
