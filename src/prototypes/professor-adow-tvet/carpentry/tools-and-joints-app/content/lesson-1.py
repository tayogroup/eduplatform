# -*- coding: utf-8 -*-
"""Lesson 1 — Marking Out and Cutting a Halving Joint.

Carpentry Tools & Joints, unit TJ.02 (mark out a joint) and TJ.03 (cut a
joint), with TJ.05.1 and TJ.05.3 at the end where the joint is fitted.

Content from the Sokoine University of Agriculture Workshop Technology
Manual, Carpentry and Joinery (F. C. Kahimba, 2010), Lesson 2 and
practice exercise 2 — the corner halving joint marked with a carpentry
square and marking gauge and cut with a tenon saw. Terminology is UK /
East African throughout.
"""
from _kit import step, opt, q, check, word

LESSON = {
    "slug": "marking-out-and-cutting-a-halving-joint",
    "title": "Marking Out and Cutting a Halving Joint",
    "module": "tools-joints",
    "blurb": (
        "Name the three tools the job needs, make the workshop safe, put the stages "
        "in order, mark out a halving joint one line at a time, decide which side of "
        "the line to saw, and close the joint."
    ),
    "outcomes": [
        "Name the parts of a try square, a marking gauge and a tenon saw.",
        "Take every measurement from the face side and the face edge.",
        "Square a shoulder line and score a gauge line to half the thickness.",
        "Mark the waste before any cut is made.",
        "Saw on the waste side of the line, and say what happens if you do not.",
        "Fit a halving joint and check the assembly is square.",
    ],
    "steps": [

        # THE UNIT LECTURE, first, before the learner does anything — the
        # same place the Ehel Science lessons put it, and for the same
        # reason: the whole job told through once, so that every step after
        # it is a thing being practised rather than a thing being met.
        #
        # A RENDERED FILM, and the same parts below it. This said the
        # opposite until the film existed — that a prototype had neither the
        # budget for narration nor anywhere to serve the file from. The
        # narration was bought (3,097 characters over two passes), the film
        # is 11.2 MB at 3:52, and the parts remain: Ehel plays the film and keeps the
        # parts as the way back through it a piece at a time, which is what
        # a learner wants after watching three minutes once.
        step("lecture", "Unit lecture", ["ADOW-CJ-TJ.02.1", "ADOW-CJ-TJ.03.1"],
             {"w": 420, "h": 240,
              # The rendered film. Names are content-addressed by the tool that
              # made them, so a re-render cannot be shadowed by a CDN holding a
              # path for a year — and a changed film gets a changed name.
              "video": {
                  "src": "lecture-video/marking-out-and-cutting-a-halving-joint.38840040.mp4",
                  "captions": "lecture-video/marking-out-and-cutting-a-halving-joint.54b24e37.vtt",
                  "poster": "lecture-video/marking-out-and-cutting-a-halving-joint.7cfa3a81.jpg",
              },
              # The same lecture, stepped through a beat at a time, built by
              # --slides from this storyboard and these drawings. 229 KB
              # against the film's 11.2 MB, so it is also what a learner on a
              # thin connection gets. It speaks: the deck loads its own copy
              # of the SAME bought narration (a further 2.7 MB), levelled to
              # -16 LUFS so the lecture sounds the same whether it is watched
              # or stepped through. The first build of that audio was a bare
              # 64k mono encode at -21.1 LUFS - three and a half decibels
              # under the film carrying the same words, which is audible. A SIBLING of "video", not a key inside
              # it: the renderer reads data.slides, and nested here it drew
              # nothing at all while every gate stayed green.
              "slides": "lecture-video/marking-out-and-cutting-a-halving-joint.37a8c1de.slides.html",
              # A ten-second demonstration clip of the real thing, between
              # the film and the line that sends the learner back through it.
              # The lecture is DRAWN; this is footage — the drawings say what
              # to do and why, and ten seconds of a saw in timber says what it
              # looks and sounds like.
              #
              # Played at 0.6: shipped at 0.75 and slowed on the owner's word,
              # because the point of a demonstration is to see HOW, and real
              # time is faster than a learner can follow. It does not autoplay
              # — it carries sound.
              "demo": {
                  "src": "lecture-video/wood-cutting-demonstration.901c652c.mp4",
                  "caption": "Wood Cutting Demonstration Video",
                  # Narration for footage that has none. The clip carries no
                  # speech — the audio sits flat at about -20 dB throughout,
                  # which is tool and room noise — so these lines are written
                  # against what is on screen, checked frame by frame, and
                  # worded to tie the footage back to the job just taught.
                  # `at` is in the CLIP's seconds, not wall-clock: at rate 0.6
                  # these ten seconds take nearly seventeen to watch.
                  "narration": [
                      {"at": 0.0, "say": "A prepared piece on the bench. Everything that follows is taken from a face side and a face edge."},
                      {"at": 2.0, "say": "The three tools this job needs: a try square, a marking gauge and a tenon saw."},
                      {"at": 4.2, "say": "The marking gauge, worked along the wood, scoring its line from a prepared face."},
                      {"at": 6.6, "say": "The waste, hatched before any cut — so there is no way to saw off the wrong half."},
                      {"at": 8.2, "say": "Then the tenon saw: fine teeth for a clean cut across the grain, and a stiff back to keep it straight."},
                  ],
                  "rate": 0.6,
              },
              "parts": [
                  {"sequence": "joint", "state": 1,
                   "say": "This is a halving joint. Two pieces of timber cross, and each one has had exactly half its thickness cut away, so the two faces finish flush. By the end of this lesson you will have marked one out and cut it."},
                  {"sequence": "markout", "state": 0,
                   "say": "It starts with a prepared piece. Planed straight, planed square, and gauged to size. Nothing that follows works on a piece that is not true."},
                  {"sequence": "markout", "state": 1, "keep": True,
                   "say": "The face side and the face edge are marked first. Every measurement, every squared line and every gauge line is taken from these two surfaces, and from nothing else."},
                  {"sequence": "markout", "state": 2, "keep": True,
                   "say": "The shoulder line is squared across the face and down both edges with a try square. The stock of the square is pressed hard against the face edge. If it lifts, the line is not square, and neither is anything you cut to it."},
                  {"sequence": "markout", "state": 3, "keep": True,
                   "say": "Then the gauge line, scored to half the thickness, with the fence of the gauge riding on the face side. Both members are scored from the same setting, so the two halves meet flush."},
                  {"sequence": "markout", "state": 4, "keep": True,
                   "say": "The waste is hatched. This is the last thing on the wood before the first thing that cannot be undone, and it is the cheapest insurance in the trade."},
                  {"sequence": "kerf", "state": "waste",
                   "say": "Now the cut. The saw takes out a kerf about a millimetre wide, and that millimetre comes out of the waste — never out of the joint. Saw on the waste side, and leave the line on the work."},
                  {"sequence": "joint", "state": 1,
                   "say": "Pare to the line with a chisel, cutting from both faces towards the middle so the edges do not break out. Dry-fit before any glue. Check both diagonals. That is the whole job, and now you are going to do it."},
              ]},
             ask="Watch the film. Then go back through the job a part at a time below.",
             error=("Skipping the lecture and starting at the first thing that looks like doing.",
                    "Every step after this one is a part of the job you have now heard in full, "
                    "which is what makes them practice rather than instructions. Three minutes "
                    "here saves the piece of timber.")),

        step("label", "The tools this job needs", ["ADOW-CJ-CF.01.2"],
             {"tool": "trySquare"},
             error=("Apprentices let the stock lift off the face edge while they draw.",
                    "If the stock lifts even slightly the line is no longer square, and "
                    "every cut taken from it is out. Press the stock hard against the "
                    "edge and draw the line towards you.")),

        step("label", "The marking gauge", ["ADOW-CJ-CF.01.2", "ADOW-CJ-TJ.02.3"],
             {"tool": "markingGauge"},
             error=("Setting the gauge by eye against the rule and never checking it.",
                    "A gauge that is a millimetre out puts every cheek a millimetre out, "
                    "on both members, in the same direction. Set it, lock it, then measure "
                    "it again before you touch the wood.")),

        step("label", "The tenon saw", ["ADOW-CJ-CF.01.2", "ADOW-CJ-CF.01.3"],
             {"tool": "tenonSaw"},
             error=("Reaching for a rip saw because it is the one on the bench.",
                    "A rip saw is filed to cut along the grain and will tear a shoulder "
                    "to pieces. The tenon saw's fine teeth and stiff back are what make "
                    "an accurate cut across the grain possible.")),

        step("safety", "Before you cut", ["ADOW-CJ-CF.03.1", "ADOW-CJ-CF.03.2"],
             {"ask": "Tick every precaution you must take before sawing. One of these is not a precaution — leave it alone.",
              "done": "Now the cut can be made.",
              "items": [
                  check("Put on eye protection.", True,
                        "Sawdust and a sprung splinter both go for the eyes. Eye protection goes on before the tool is picked up, not after the first cut."),
                  check("Cramp the work to the bench or hold it in the vice.", True,
                        "Work that moves under the saw is what makes a cut wander and a hand slip. If you are holding the work with one hand you have already lost."),
                  check("Check the saw handle is tight and the teeth are sharp.", True,
                        "A blunt saw has to be forced, and force is what slips. A loose handle turns in the hand mid-stroke."),
                  check("Keep your free hand behind the line of the cut.", True,
                        "Everything in front of the teeth is in the path of the saw when it jumps out of the kerf at the start of a cut."),
                  check("Wear gloves so the saw does not blister your hand.", False,
                        "No — this is the one that is not a precaution. Gloves reduce your feel for the tool and near any rotating machine they can be caught and drag the hand in. Bare, dry hands on a hand saw."),
                  check("Clear the bench of offcuts and tools you are not using.", True,
                        "A chisel under the workpiece tips it as you cut. A clear bench is a safety measure, not tidiness."),
              ]}),

        step("order", "The order of work", ["ADOW-CJ-TJ.02.1", "ADOW-CJ-CF.04.3"],
             {"ask": "A halving joint, from prepared timber to a finished cut. Tap the stages in the order you would do them.",
              "finish": "That is the order of work. Nothing in it can be swapped without losing accuracy.",
              "items": [
                  "Plane the face side and face edge, and mark them",
                  "Measure the width of the other member",
                  "Square the shoulder line across the face and down both edges",
                  "Set the gauge to half the thickness and score the cheek line",
                  "Hatch the waste",
                  "Saw down to the shoulder on the waste side",
                  "Pare to the line with a chisel",
                  "Dry-fit the joint and check for square",
              ],
              "why": [
                  "Yes. Nothing can be measured until there is a face side and a face edge to measure from.",
                  "Yes. The halving must be exactly as wide as the piece that goes into it, so you take the width from the actual member, not from the drawing.",
                  "Yes. The shoulder is squared across while the gauge is still untouched.",
                  "Yes. Half the thickness, scored from the face side on both members, so the two halves meet flush.",
                  "Yes. Marking the waste is the last thing before cutting, and the cheapest insurance in the trade.",
                  "Yes. Down to the shoulder line, never past it.",
                  "Yes. Pare from both faces towards the middle so the edge does not break out.",
                  "Yes. Dry first. Glue commits you to whatever you have made.",
              ],
              "before": [
                  "This has to come first — there is nothing to measure from yet.",
                  "Not yet. You need a face side and face edge before any measurement means anything.",
                  "Not yet. Mark your faces and take the width first.",
                  "Not yet. Square the shoulder before you gauge the cheek.",
                  "Not yet. There is nothing to mark as waste until both lines are on.",
                  "Not yet. Marking out is not finished.",
                  "Not yet. The saw cut comes before the chisel.",
                  "Not yet. There is nothing to fit.",
              ]}),

        step("demo", "Marking out, one line at a time", ["ADOW-CJ-TJ.02.1", "ADOW-CJ-TJ.02.2", "ADOW-CJ-TJ.02.3", "ADOW-CJ-TJ.02.4"],
             {},
             ask="Press Next and watch a prepared piece become a marked-out halving joint.",
             error=("Measuring from whichever end is nearest, or from a sawn end.",
                    "A sawn end is not square and may be damaged. Every measurement comes "
                    "from the face side and the face edge — that is the entire reason they "
                    "are marked.")),

        step("predict", "Which side of the line?", ["ADOW-CJ-TJ.03.1"],
             {"ask": "The saw takes out a kerf about a millimetre wide. Where do you put it?"},
             error=("Sawing down the middle of the line, because that looks like accuracy.",
                    "It is the commonest way to make a slack joint. Half the kerf comes out "
                    "of the work, so the joint finishes half a saw-blade undersize — and no "
                    "amount of care afterwards puts wood back.")),

        step("build", "Close the joint", ["ADOW-CJ-TJ.05.1", "ADOW-CJ-TJ.05.3"],
             {"ask": "Both members have been cut. Bring them together.",
              "say": "Each member has lost exactly half its thickness, so the two faces finish flush and the joint is as thick as one piece. Check both diagonals before the glue goes anywhere near it."},
             error=("Forcing a tight joint together with the mallet.",
                    "If it needs force it is too tight, and driving it home splits the "
                    "member along the grain. Pare a shaving off the cheek and try it "
                    "again — a joint should go together by hand and stay there.")),

        step("questions", "What you now know", ["ADOW-CJ-TJ.02.4", "ADOW-CJ-TJ.03.1", "ADOW-CJ-TJ.05.2", "ADOW-CJ-CF.01.3"],
             {"items": [
                 q("You have squared the shoulder line. What goes on the wood next?",
                   [opt("Hatch the waste", False, "Not yet — you have not scored the cheek line, so you do not yet know which part is waste."),
                    opt("The gauge line, scored to half the thickness", True),
                    opt("The first saw cut", False, "Marking out is not finished. A cut made now is a guess.")],
                   "The gauge line. Shoulder first with the try square, then the cheek with the gauge, then the waste."),

                 q("Why is the waste hatched before any cut is made?",
                   [opt("So the piece looks finished", False, "It is not decoration. It is the last check before an irreversible cut."),
                    opt("Because it is required by the drawing", False, "No drawing asks for it. It is a working habit."),
                    opt("So there is no way to cut the wrong side of the joint", True)],
                   "Once the waste is hatched the cut is unambiguous. Every carpenter who has sawn off the wrong half did it on a piece that was not hatched."),

                 q("Your tenon saw takes a kerf one millimetre wide. You saw exactly down the middle of your line. What have you made?",
                   [opt("A joint that is correct — the line is the centre of the cut", False, "The line marks where the WOOD ends, not where the cut is centred."),
                    opt("A joint half a millimetre undersize, and slack", True),
                    opt("A joint half a millimetre oversize, needing paring", False, "Oversize could be corrected. This is the other way, and it cannot.")],
                   "Half the kerf came out of the work, so the joint is half a millimetre small. Undersize is the one error you cannot correct."),

                 q("Which saw for cutting the shoulder of a halving joint across the grain?",
                   [opt("Rip saw", False, "Filed for cutting along the grain. Across it, it tears the shoulder."),
                    opt("Tenon saw", True),
                    opt("Frame saw", False, "For straight and curved cuts in thicker stock, not for a fine shoulder.")],
                   "The tenon saw: fine teeth for a clean cut across the grain, and a stiff back that keeps the cut straight."),

                 q("A halving joint you have cut needs a mallet to drive it together. What should you do?",
                   [opt("Drive it home — a tight joint is a strong joint", False, "A joint driven home under force splits along the grain, and the split usually appears after the glue has set."),
                    opt("Pare a shaving off the cheek and try it again", True),
                    opt("Leave it, the glue will take up the difference", False, "Glue fills nothing usefully. This joint is too tight, not too slack.")],
                   "Too tight is as much a fault as too slack. Pare a shaving and try again — it should go together by hand."),
             ]}),

        step("words", "The words of this job", ["ADOW-CJ-CF.01.2"],
             {"items": [
                 word("face side", "The first surface planed true. Marked with a looping f. Every gauge line is scored from it."),
                 word("face edge", "The edge planed straight and square to the face side. Marked so the two marks meet. Every squared line is taken from it."),
                 word("shoulder", "The line across the member where the joint begins, and the surface left when the waste is cut away."),
                 word("cheek", "The long face of the joint, cut along the grain to the gauge line."),
                 word("kerf", "The slot the saw takes out. About a millimetre wide, and it comes out of the waste."),
                 word("waste", "The part that is cut away. Hatched before any cut is made."),
                 word("halving joint", "A joint where each member loses half its thickness so the two finish flush."),
                 word("dry fit", "Assembling a joint without glue to check the fit while it can still be corrected."),
             ]}),
    ],
}
