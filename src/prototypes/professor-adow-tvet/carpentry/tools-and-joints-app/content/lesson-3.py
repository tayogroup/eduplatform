# -*- coding: utf-8 -*-
"""Lesson 3 — Sawing and Paring to the Line.

Carpentry Tools & Joints, unit TJ.03 — the three criteria the first
lesson could not reach, because all three are things the hands do rather
than things the eye decides.

Every criterion here is BENCH-ONLY. The app rehearses the movement and
explains what goes wrong; competence is signed off by an assessor with
the learner at a bench. The page says so on every step.

Content from the Sokoine University of Agriculture Workshop Technology
Manual, Carpentry and Joinery (F. C. Kahimba, 2010), Lesson 2 and
practice exercise 2.
"""
from _kit import step, opt, q, word

LESSON = {
    "slug": "sawing-and-paring-to-the-line",
    "title": "Sawing and Paring to the Line",
    "module": "tools-joints",
    "blurb": (
        "Start a saw cut without it jumping, keep it square in both planes by watching "
        "the face you are not looking at, and pare waste with a chisel so the edges do "
        "not break out."
    ),
    "outcomes": [
        "Start a tenon saw cut at a low angle with the thumb guiding the blade.",
        "Saw down to the shoulder line square in both planes.",
        "Check the far face as the cut goes down, not after it is finished.",
        "Pare waste from both faces towards the middle.",
        "Say why cutting straight through from one face tears the far edge.",
    ],
    "steps": [

        step("demo", "Starting the cut", ["ADOW-CJ-TJ.03.2"],
             {"sequence": "saw"},
             ask="Press Next. Five stages, and the first three are all about the saw not jumping out of the cut.",
             error=("Pressing down to make the saw bite.",
                    "Downward pressure at the start is exactly what makes a saw jump out of the "
                    "kerf, and it jumps towards the hand holding the work. Let the saw's own "
                    "weight cut, and pull backwards two or three times to make a groove first.")),

        step("questions", "Square in both planes", ["ADOW-CJ-TJ.03.3"],
             {"items": [
                 q("You are sawing down a cheek. You watch the line on the face nearest you and it is perfect. What have you not checked?",
                   [opt("The far face — the cut can be square on one face and running out on the other", True),
                    opt("Nothing, one face is enough", False,
                        "A saw can lean without the near face showing it at all. By the time you see it on the near face the cut is well out."),
                    opt("The shoulder line", False,
                        "You will check that as you get near it. It is not the plane that is going wrong here.")],
                   "The far face. A saw that leans stays on the near line and runs off the far one, and you only find out when the joint will not close."),

                 q("When should the far face be checked?",
                   [opt("As the cut goes down, every few strokes", True),
                    opt("When the cut is finished", False,
                        "Then it is a finished cut in the wrong place. Nothing can be put back."),
                    opt("Only if the joint does not fit", False,
                        "That is finding out at the last possible moment, on work that is already scrap.")],
                   "As you go. A cut corrected in its first ten millimetres is a cut; the same error found at the shoulder is a new piece of timber."),

                 q("Your cut has started to lean. What do you do?",
                   [opt("Ease back to the line over several light strokes", True),
                    opt("Twist the saw to bring it back", False,
                        "Twisting binds the blade in the kerf, and a bound tenon saw kinks."),
                    opt("Finish the cut and pare the error out with a chisel", False,
                        "Sometimes the only option left, but it is a repair. Correct the cut while it is still correctable.")],
                   "Ease it back gradually. A saw is steered over many strokes, never in one."),
             ]},
             error=("Sighting only down the near face because that is where the line is.",
                    "Both faces carry the line — it was squared across and down BOTH edges at "
                    "marking out for exactly this reason. A carpenter who marks both faces and "
                    "then watches one has done the work and thrown away the benefit.")),

        step("predict", "Paring the waste", ["ADOW-CJ-TJ.03.4"],
             {"cases": "pare",
              "ask": "The saw cuts are made and waste has to come off with a chisel. Which way do you cut?"},
             error=("Chiselling straight through in one go because it is faster.",
                    "The fibres at the far face have nothing behind them to hold them, so they "
                    "tear out rather than cut. The break-out lands on the face you were trying to "
                    "make good, and no amount of cleaning up brings the fibres back.")),

        step("questions", "What you now know",
             ["ADOW-CJ-TJ.03.2", "ADOW-CJ-TJ.03.3", "ADOW-CJ-TJ.03.4"],
             {"items": [
                 q("Why is a saw cut started at a low angle rather than steeply?",
                   [opt("A low angle puts more teeth on the wood and starts where you can see the line", True),
                    opt("A low angle cuts faster", False,
                        "It cuts more slowly. Speed comes once the groove is made."),
                    opt("It keeps the back of the saw off the wood", False,
                        "The back only matters at the end of a deep cut, not at the start.")],
                   "More teeth in contact means less chance of the saw jumping, and at a low angle you can see the line you are cutting to."),

                 q("Where is the thumb of the free hand while a cut is started?",
                   [opt("Against the side of the blade, above the teeth", True),
                    opt("On top of the saw back, pressing down", False,
                        "Pressing down is what makes it jump."),
                    opt("Holding the work directly in front of the cut", False,
                        "That puts a hand in the path of a saw that is about to jump.")],
                   "Against the blade and ABOVE the teeth. It steadies the blade for the first strokes and it is nowhere the teeth can reach."),

                 q("You pare a housing straight through from one face. What do you find on the far face?",
                   [opt("The fibres torn out where the chisel came through", True),
                    opt("A clean cut, since the chisel is sharp", False,
                        "Sharpness helps and does not fix this. The last fibres have nothing supporting them."),
                    opt("Nothing — the far face is not cut", False,
                        "It is where the chisel exits, which is exactly where the damage appears.")],
                   "Break-out. Cut from both faces towards the middle and the fibres are supported the whole way."),
             ]}),

        step("words", "The words of this job", ["ADOW-CJ-TJ.03.2"],
             {"items": [
                 word("kerf", "The slot the saw takes out. Started as a shallow groove with backward strokes before any forward cut."),
                 word("run out", "A cut that leaves the line, usually on the face the sawyer is not watching."),
                 word("in both planes", "Square across the face AND square down the edge. A cut can be right in one and wrong in the other."),
                 word("pare", "To cut a thin shaving with a chisel, by hand pressure rather than a mallet."),
                 word("break-out", "Fibres torn from the face a cutting tool exits through, because nothing was behind them."),
                 word("housing", "A groove cut across a member to receive the end of another."),
             ]}),
    ],
}
