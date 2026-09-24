# -*- coding: utf-8 -*-
"""Lesson 4 — Solids, Nets and Angles.

Shapes and Measurements, units SM.07 (solids and their developments)
and SM.08 (angles other than the right angle). Eight criteria.

Added after the Ehel Stage 4 shape-and-measures module was compared
against this one rather than copied from it. Reading a scale, perimeter,
area and the right angle were already covered by lessons 1 to 3; faces
and nets, and the angles that are not 90 degrees, were not.

Both earn a place in a trade school on their own merits. A NET is not
school geometry here — it is how a duct, a guard, a tray or a hopper is
marked out flat before anything is bent, and getting it wrong wastes the
sheet rather than the exercise. An angle that is not a right angle is a
mitre, a chamfer or a roof pitch.
"""
from _kit import step, opt, q, word

LESSON = {
    "slug": "solids-nets-and-angles",
    "title": "Solids, Nets and Angles",
    "module": "shapes-measures",
    "blurb": (
        "Name the faces, edges and vertices of a solid, read the flat development that "
        "folds into one, allow for the thickness of the material, tell an acute angle "
        "from an obtuse one, transfer an angle with a bevel, and work out a mitre."
    ),
    "outcomes": [
        "Name and count the faces, edges and vertices of a solid.",
        "Recognise which net folds into which solid — and which folds into nothing.",
        "Mark out a development to stated internal sizes.",
        "Say why the flat pattern is cut before any bend is made.",
        "Name an angle as acute, right, obtuse or reflex.",
        "Measure an angle with a protractor, reading the correct scale.",
        "Transfer an angle with a sliding bevel without naming it.",
        "Work out the angle each half of a mitre is cut at.",
    ],
    "steps": [

        # THE UNIT LECTURE, first, before the learner does anything.
        #
        # THIS FILM IS NOT OURS AND WAS NOT MADE FOR THIS SCHOOL. It is the
        # Ehel Academy Stage 4 shape-and-measures lecture, reused whole at
        # the owner's instruction rather than a new one being written for
        # this module. Nothing about it was changed except the encoding: the
        # original is 18.2 MB and a published artifact refuses a binary over
        # 15, so it is re-compressed to 11.1 MB at the same 352 seconds and
        # the same picture. The words, the pictures and the voice are Ehel's.
        #
        # Worth a trainer knowing: it is pitched at a nine-year-old, and it
        # covers symmetry and putting shapes together, which this module
        # deliberately does not. It is an introduction to the ideas, not to
        # this lesson's trade content - the ducts, the thickness allowance
        # and the mitre are taught in the steps below and are not in the film.
        #
        # No `parts` here. A lecture step used to assume them and threw
        # without them, which made reusing an existing film impossible
        # without inventing a walkthrough to sit beside it.
        step("lecture", "Unit lecture", ["ADOW-SM-SM.07.1", "ADOW-SM-SM.08.1"],
             {"video": {
                  "src": "lecture-video/shape-and-measures.534e9a4a.mp4",
                  "captions": "lecture-video/shape-and-measures.2613b081.vtt",
                  "poster": "lecture-video/shape-and-measures.29644ff7.jpg"},
              "underFilm": "An introduction to solids, nets and angles. The trade work — allowing for thickness, the circumference of a duct, halving a mitre — is in the steps below."},
             ask="Watch the film first. It introduces the ideas; the steps after it put them on the bench.",
             error=("Treating the film as the lesson.",
                    "It introduces faces, nets and angles and stops there. Everything this "
                    "module is actually assessed on — the thickness allowance, the duct that "
                    "is marked by its circumference, the mitre halved from the corner — comes "
                    "after it.")),

        step("label", "A solid, and what its parts are called", ["ADOW-SM-SM.07.1"],
             {"tool": "solidBox"},
             ask="Tap each part. These three words are what a drawing office and a sheet-metal shop both use.",
             error=("Using 'side' for all three.",
                    "A face is a surface, an edge is where two faces meet, a vertex is where edges "
                    "meet. On the flat pattern they become three different things — a panel, a "
                    "fold or cut line, and a notch — so a single word for all three cannot carry "
                    "an instruction.")),

        step("browse", "Which net folds into what?", ["ADOW-SM-SM.07.2"],
             {"ask": "Three flat patterns. Tap each one.",
              "finish": "A net is not just the right number of faces. They have to meet each other when it closes.",
              "items": [
                  {"draw": "netTray", "say": "An open tray. A base with four sides folded up — five faces, no lid. The dashed lines are folds and the solid ones are cuts, and confusing the two is the commonest error on a first development."},
                  {"draw": "netCylinder", "say": "A round duct: one rectangle and two ends. The long side of the rectangle is the CIRCUMFERENCE, not the diameter — mark it as the diameter and the duct will be about a third of the size you wanted."},
                  {"draw": "netNoFold", "say": "Six squares in a line. The right number of faces for a cube, and it folds into nothing: the far ends can never reach each other. Counting faces is not the same as checking it closes."},
              ]},
             error=("Counting faces and stopping there.",
                    "Six squares make a cube only in certain arrangements. The check is not how "
                    "many panels there are but whether every edge finds the edge it has to meet — "
                    "which is why a development is folded up in card before it is cut in steel.")),

        step("questions", "Marking out a development",
             ["ADOW-SM-SM.07.3", "ADOW-SM-SM.07.4"],
             {"items": [
                 q("A tray is to be 300 mm wide INSIDE, from 2 mm sheet. How wide is the base panel on the flat pattern?",
                   [opt("300 mm — the base sits between the sides, so the inside width is the base width", True),
                    opt("304 mm, adding the two thicknesses", False,
                        "That would be right for the OUTSIDE width. The sides stand on the edges of the base, so the base is the inside dimension."),
                    opt("296 mm", False,
                        "Taking the thickness off makes the tray undersize by two thicknesses.")],
                   "300 mm. Which dimension the thickness affects depends on how the fold goes, and that is exactly why a development is drawn rather than guessed."),

                 q("Why is the whole pattern marked out and cut before the first bend?",
                   [opt("Once a bend is made you cannot mark or cut flat across it", True),
                    opt("It is faster", False,
                        "It is faster, and that is not the reason. The reason is that the flat state is the only state in which the sheet can be marked accurately."),
                    opt("The metal work-hardens", False,
                        "It does at the bend, and that is a different problem.")],
                   "Because a folded sheet will not lie under a rule or on a bench. Every line has to exist before the first fold, in the order the folds will be made."),

                 q("A bend is put in 10 mm from where the line was. What has it cost?",
                   [opt("The sheet — a bend cannot be taken out and re-made in the same metal", True),
                    opt("Nothing, if it is bent back", False,
                        "Bending it back leaves a crease and a weakened line that will show and may crack.")],
                   "The sheet. This is why the flat pattern is checked against the stated sizes before it goes anywhere near the folder."),
             ]},
             error=("Adding the material thickness everywhere, to be safe.",
                    "Thickness is added on some dimensions and not others, depending on which side "
                    "of the fold a face ends up. Applying it everywhere is as wrong as ignoring "
                    "it, and it is wrong in a way that looks careful.")),

        step("browse", "Acute, right, obtuse", ["ADOW-SM-SM.08.1"],
             {"ask": "Three angles. Tap each to name it.",
              "finish": "Less than 90 is acute, exactly 90 is right, more than 90 up to 180 is obtuse. Past 180 it is reflex.",
              "items": [
                  {"draw": "angleAcute", "say": "Acute — less than 90°. A roof pitch, a chamfer, the taper on a wedge."},
                  {"draw": "angleRight", "say": "A right angle, exactly 90°. The only one on this page you can PROVE with a square rather than judge, which is why every setting-out job starts from it."},
                  {"draw": "angleObtuse", "say": "Obtuse — more than 90° and less than 180°. The inside angle of a hopper, or a corner that opens out."},
              ]},
             error=("Judging a right angle by eye because it looks square.",
                    "Two or three degrees out is invisible across a corner and obvious across a "
                    "three-metre run. A right angle is the one angle you never have to estimate, "
                    "because a square or a 3-4-5 proves it in seconds.")),

        step("questions", "Reading a protractor", ["ADOW-SM-SM.08.2"],
             {"items": [
                 q("A protractor has two scales running opposite ways. How do you know which to read?",
                   [opt("Start from the zero that lies on one arm of the angle, and read round from there", True),
                    opt("Always read the outer scale", False,
                        "Which scale is correct depends on which way the angle opens, not on which ring it is printed on."),
                    opt("Read both and take the average", False,
                        "The two always add to 180 — their average is always 90, whatever the angle is.")],
                   "Find the arm sitting on a zero and read from that zero. The two scales exist so the protractor works from either side."),

                 q("You read 40° on one scale and 140° on the other. The angle is clearly obtuse. Which is right?",
                   [opt("140° — an obtuse angle is more than 90°", True),
                    opt("40°", False,
                        "That contradicts what you can see. The picture is the check on the reading."),
                    opt("Cannot tell without measuring again", False,
                        "You can: acute or obtuse is decided by looking, and it rules one of the two out immediately.")],
                   "140°. Name the angle by eye FIRST, then read the scale — the eye is poor at degrees and excellent at telling which side of 90 an angle is on."),
             ]},
             error=("Reading the scale before deciding whether the angle is acute or obtuse.",
                    "It is the one judgement the eye makes reliably, and it eliminates half the "
                    "possible readings before you start.")),

        step("browse", "Copying an angle without naming it", ["ADOW-SM-SM.08.3"],
             {"ask": "Tap the tool.",
              "finish": "Some angles are measured. Many are copied — and a copy carries no rounding error.",
              "items": [
                  {"draw": "bevel", "say": "A sliding bevel. Loosen the screw, set the blade against the existing angle, tighten, and carry it to the work. It never tells you the number, which is the point: an angle read as 47° and re-marked as 47° has been rounded twice, while a copied angle has not been rounded at all."},
              ]},
             error=("Measuring an existing angle, writing it down, then setting the new one from the number.",
                    "Every reading and every re-setting rounds. Where the new part simply has to "
                    "match the old one — a replacement rafter, a repair to a frame — copy it "
                    "directly and never let a number into the process.")),

        step("calc", "Working out a mitre", ["ADOW-SM-SM.08.4"],
             {"finish": "A mitre splits the corner between the two pieces. Halve the angle the corner turns through, and cut both.",
              "items": [
                  {"ask": "A frame corner turns through 90°. What angle is each piece cut at?",
                   "unit": "°", "answer": 45, "tol": 0,
                   "working": ["The corner is 90°", "Two pieces share it equally", "90 ÷ 2 = 45"],
                   "why": "45° each. The commonest mitre there is, and the one that makes the rule easy to remember."},

                  {"ask": "A hopper corner turns through 120°. What angle is each piece cut at?",
                   "unit": "°", "answer": 60, "tol": 0,
                   "working": ["The corner is 120°", "120 ÷ 2 = 60"],
                   "why": "60° each. The rule does not change because the corner is not square — halve whatever the corner turns through."},

                  {"ask": "Six pieces make a regular hexagonal frame. Each corner turns through 120°. What angle is each end cut at?",
                   "unit": "°", "answer": 60, "tol": 0,
                   "working": ["A regular hexagon has 120° at each corner", "Each corner is shared by two ends", "120 ÷ 2 = 60"],
                   "why": "60°. Every end of every piece, twelve cuts, all the same — which is why a frame like this is set up once and cut in a batch."},
              ]},
             error=("Cutting one piece at the full corner angle and the other square.",
                    "It closes, and it puts the whole joint line on one face where it shows, with "
                    "one piece carrying a feather edge that will break away. Halving it shares the "
                    "line between both pieces and leaves both ends the same strength.")),

        step("words", "The words for it", ["ADOW-SM-SM.07.1", "ADOW-SM-SM.08.1"],
             {"items": [
                 word("face", "One flat surface of a solid. Becomes a panel on the flat pattern."),
                 word("edge", "Where two faces meet. Becomes a fold line or a cut line."),
                 word("vertex", "A corner where edges meet. Often a notch on the flat pattern."),
                 word("net / development", "The flat pattern that folds into a solid."),
                 word("acute", "An angle less than 90°."),
                 word("obtuse", "An angle more than 90° and less than 180°."),
                 word("reflex", "An angle more than 180°."),
                 word("mitre", "A corner where both pieces are cut at half the angle the corner turns through."),
                 word("sliding bevel", "A tool that copies an angle from one place to another without measuring it."),
             ]}),
    ],
}
