# -*- coding: utf-8 -*-
"""Lesson 4 — Nails, Screws and Glue.

Carpentry Tools & Joints, unit TJ.04 in full, and TJ.05.4 — cleaning up
and inspecting the finished work against the drawing, which is where the
module ends.

Content from the Sokoine University of Agriculture Workshop Technology
Manual, Carpentry and Joinery (F. C. Kahimba, 2010), sections 2.2 and
2.3: the nail and screw tables, the two-thirds rule of thumb, pre-
drilling near an end and in hardwood, and applying glue without
spill-over. Terminology is UK / East African throughout, so the head
types are lost head and countersunk rather than finish and flat.
"""
from _kit import step, opt, q, word

LESSON = {
    "slug": "nails-screws-and-glue",
    "title": "Nails, Screws and Glue",
    "module": "tools-joints",
    "blurb": (
        "Tell nails apart by head and section, choose a screw by its head, drive a "
        "fastener deep enough to hold, pre-drill where the timber would split, glue a "
        "joint without flooding it, and inspect the finished work against the drawing."
    ),
    "outcomes": [
        "Select a nail for a job from its head and its section.",
        "Select a screw by head type: countersunk, round head, coach screw.",
        "Apply the rule that two thirds of a fastener should enter the lower member.",
        "Pre-drill in hardwood and near the end of a piece.",
        "Apply glue as a thin even film rather than a flood or a few spots.",
        "Clean up and inspect the finished work against the drawing before passing it on.",
    ],
    "steps": [

        step("browse", "The nails", ["ADOW-CJ-TJ.04.1"],
             {"ask": "Four nails. Tap each one to find out what it is for.",
              "finish": "Head and section. The head decides whether the fixing shows; the section decides whether the timber splits.",
              "items": [
                  {"draw": "wireNail", "say": "The wire nail. A big flat head that cannot pull through, and a round section. Rough carpentry and formwork — anything that will be covered. It splits timber readily, so blunting the point first helps."},
                  {"draw": "ovalBrad", "say": "The oval brad. Driven with its long axis ALONG the grain it parts the fibres rather than wedging them apart, so it is far less likely to split the wood. The general carpentry nail."},
                  {"draw": "lostHead", "say": "The lost head. The head is barely wider than the shank, so it can be punched below the surface and the hole filled. Used where the fixing must not show."},
                  {"draw": "panelPin", "say": "The panel pin. Small and thin, for light work. The glue does the holding; the pin only stops the work moving while it sets."},
              ]},
             error=("Choosing a nail by length alone and taking whatever is in the tin.",
                    "Two nails of the same length behave completely differently. A wire nail in "
                    "the end of a piece of hardwood splits it; an oval brad in the same place "
                    "does not. The section is not a detail.")),

        step("browse", "The screws", ["ADOW-CJ-TJ.04.3"],
             {"ask": "Three screws. Tap each one.",
              "finish": "A screw is chosen by its head, because the head is what decides how it sits against the work.",
              "items": [
                  {"draw": "countersunk", "say": "The countersunk screw. A tapered head that pulls down flush with the surface or just below it. The general woodworking screw — and it needs the hole countersunk first, or it will not sit down and it will split the wood trying."},
                  {"draw": "roundHead", "say": "The round head. A domed head that stays proud of the surface, for fixing hardware that has no countersunk hole — hinges, catches, brackets."},
                  {"draw": "coach", "say": "The coach screw. Heavy, with a square or hexagon head turned by a spanner rather than a screwdriver. Heavy framing, and fixing equipment down to timber."},
              ]},
             error=("Driving a countersunk screw into an un-countersunk hole and leaning on it.",
                    "The tapered head acts as a wedge. It will either stand proud, or it will "
                    "split the timber as it forces its way down. Countersink the hole, and the "
                    "head pulls the two members together instead of pushing them apart.")),

        step("demo", "How deep is deep enough?", ["ADOW-CJ-TJ.04.2"],
             {"sequence": "twothirds"},
             ask="A nail through an upper member into a lower one. Slide it in.",
             error=("Judging by whether the head is down rather than by how much is in the lower member.",
                    "A short fastener can look perfectly driven — head flush, nothing showing — "
                    "and be holding almost nothing, because nearly all of its length is in the "
                    "piece it is meant to be holding DOWN rather than in the one it is holding "
                    "down TO.")),

        step("questions", "Where timber splits", ["ADOW-CJ-TJ.04.2"],
             {"items": [
                 q("You are nailing 40 mm from the end of a piece of hardwood. What do you do first?",
                   [opt("Drill a pilot hole", True),
                    opt("Blunt the nail point", False,
                        "That helps in softwood and it is not enough in hardwood near an end. Both, if you like — but drill."),
                    opt("Nothing — hardwood is strong", False,
                        "Strong and brittle along the grain. Hardwood near an end is the most likely place in the workshop to split.")],
                   "Pre-drill. Near an end and in hardwood are the two cases the rule names, and this is both at once."),

                 q("How long should a pilot hole be, roughly?",
                   [opt("About the length of the fastener, and slightly under its core diameter", True),
                    opt("As deep as the upper member only", False,
                        "Then the fastener still has to force its own way through the lower member, which is where the split would happen."),
                    opt("Right through both members", False,
                        "Then there is nothing for the thread or the shank to grip in the lower member.")],
                   "Full length, slightly undersize. The fastener is guided the whole way and still grips."),

                 q("A joint is nailed and the timber has split along the grain from the nail. Is the joint sound?",
                   [opt("No — a split runs further under load and the nail has lost its grip", True),
                    opt("Yes, if the split is small and the nail is tight now", False,
                        "A split does not stay small. Every load opens it further."),
                    opt("Yes, once glue is worked into the split", False,
                        "Glue in a split made by a fastener is a repair to a joint that should be remade.")],
                   "Not sound. Take it apart, and this time pre-drill."),
             ]}),

        step("predict", "How much glue?", ["ADOW-CJ-TJ.04.4"],
             {"cases": "glue",
              "ask": "A widening joint, two planed edges, about to be cramped up. How much glue goes on?"},
             error=("Using plenty on the grounds that more glue means a stronger joint.",
                    "It does not. A thin continuous film is stronger than a thick one, and the "
                    "excess squeezes out under the cramps, runs down the work and seals the grain "
                    "where it dries — so the finish will not take, and the mark shows for the "
                    "life of the piece.")),

        step("questions", "Inspecting the finished work", ["ADOW-CJ-TJ.05.4"],
             {"items": [
                 q("The joint is cramped, the glue has set, the cramps are off. What comes before the work is passed on?",
                   [opt("Clean it up and check it against the drawing", True),
                    opt("Nothing — it is finished", False,
                        "Finished is a judgement somebody has to make by checking, not a state work arrives in."),
                    opt("Apply the finish straight away", False,
                        "Finish over dried squeeze-out is how a glue mark becomes permanent.")],
                   "Clean up and inspect against the drawing. The drawing is the specification; your memory of it is not."),

                 q("What are you looking for when you inspect against the drawing?",
                   [opt("Dimensions, square, and that every feature the drawing asks for is there", True),
                    opt("Whether it looks tidy", False,
                        "Tidy is part of it and it is not a specification."),
                    opt("Whether the joints are tight", False,
                        "You checked that at the dry fit. Now you are checking the whole piece.")],
                   "Against the drawing means against the dimensions and the features it specifies — not against how you remember it."),

                 q("You find the piece is 3 mm over length. When was the best time to have found that?",
                   [opt("At marking out, before anything was cut", True),
                    opt("Now, at the final inspection", False,
                        "Now is when it is found. It is not when it was cheapest to fix."),
                    opt("At the dry fit", False,
                        "Better than now, and still after the cutting.")],
                   "At marking out. Every check moves the cost of an error earlier, which is the whole argument for marking out carefully and for dry-fitting before glue."),
             ]}),

        step("words", "The words of this job", ["ADOW-CJ-TJ.04.1"],
             {"items": [
                 word("section", "The shape of a nail's shank seen end-on: round, oval or square. It decides whether the timber splits."),
                 word("lost head", "A nail whose head is barely wider than its shank, so it can be punched below the surface."),
                 word("punch", "The tool that drives a head below the surface, so the hole can be filled."),
                 word("pilot hole", "A hole drilled before a fastener, slightly under its core diameter, to stop the timber splitting."),
                 word("countersink", "The tapered recess cut so a countersunk head can pull down flush."),
                 word("squeeze-out", "Glue forced from a joint as it is cramped. A little is right; a lot means too much was used."),
                 word("dry fit", "Assembling without glue to check the fit while it can still be corrected."),
             ]}),
    ],
}
