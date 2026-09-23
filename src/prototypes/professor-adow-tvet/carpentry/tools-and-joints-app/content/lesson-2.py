# -*- coding: utf-8 -*-
"""Lesson 2 — The Five Families of Joint.

Carpentry Tools & Joints, unit TJ.01 in full.

Content from the Sokoine University of Agriculture Workshop Technology
Manual, Carpentry and Joinery (F. C. Kahimba, 2010), section 2.1, which
groups wood joints into corner, frame, widening, lengthening and
crossing joints. Terminology is UK / East African throughout.
"""
from _kit import step, opt, q, word

LESSON = {
    "slug": "the-five-families-of-joint",
    "title": "The Five Families of Joint",
    "module": "tools-joints",
    "blurb": (
        "Meet the five families of wood joint, see two from each, sort ten joints into "
        "the family they belong to, and choose a joint for a job by asking which way "
        "the load pulls."
    ),
    "outcomes": [
        "Name the five families: corner, frame, widening, lengthening and crossing.",
        "Say what each family is FOR, not just what it looks like.",
        "Sort a joint into its family from the job it does.",
        "Choose a joint for a job, giving a reason from strength, appearance and load.",
        "Say why a table top needs a widening joint and a truss member a lengthening one.",
    ],
    "steps": [

        step("browse", "Corner and frame joints", ["ADOW-CJ-TJ.01.2"],
             {"ask": "Four joints. Tap each one to find out what it is for.",
              "finish": "Corner joints close a box. Frame joints make a flat frame that will not rack.",
              "items": [
                  {"draw": "butt", "say": "The butt joint. One piece meets another end to face, held by nails or screws. The simplest corner there is — quick, weak, and used everywhere work is going to be covered up."},
                  {"draw": "dovetail", "say": "The through dovetail. The tails are wider at the end than at the root, so the joint cannot be pulled apart in the direction the drawer is pulled. Drawer fronts and boxes."},
                  {"draw": "mortiseTenon", "say": "The through mortise and tenon. A tongue on one member goes right through a hole in the other. Doors, windows, tables and chairs are all held together by this one."},
                  {"draw": "bridle", "say": "The bridle, or open mortise and tenon. The mortise is open at the end so the tenon slides in from the side. Easier to cut, and used at the corner of a frame."},
              ]},
             error=("Reaching for a dovetail because it looks like good work.",
                    "A dovetail resists being pulled apart in ONE direction. On a joint that is "
                    "never pulled that way it is hours of work buying nothing, and a mortise and "
                    "tenon would have been both quicker and stronger.")),

        step("browse", "Widening, lengthening and crossing", ["ADOW-CJ-TJ.01.2", "ADOW-CJ-TJ.01.4"],
             {"ask": "Five more. Tap each one.",
              "finish": "Widening makes a board WIDER. Lengthening makes a member LONGER. Crossing joins two members near their middles.",
              "items": [
                  {"draw": "edgeGlued", "say": "Edge to edge, glued. Two boards planed dead straight on the edge, glued and cramped. This is how a table top is made — almost no table top is one board."},
                  {"draw": "looseTongue", "say": "The loose tongue. A separate strip sits in a groove in both edges. It keeps the two boards level while the glue sets and adds gluing area."},
                  {"draw": "scarf", "say": "The scarf joint. Two long tapers overlapping, so a short piece becomes a long one. Roof members, wall plates, formwork and scaffolding."},
                  {"draw": "fished", "say": "The fished joint. Two ends butted and plated on both sides, bolted through. Quick, strong in tension, and used where appearance does not matter."},
                  {"draw": "crossHalving", "say": "The cross halving. Two members crossing near their middles, each halved so the two finish flush. Trestles, lamp stands, one-legged tables."},
              ]},
             error=("Trying to make a wide board by lengthening, or a long one by widening.",
                    "The names describe the DIMENSION they add. A widening joint runs along the "
                    "grain and makes a board wider; a lengthening joint runs across it and makes "
                    "a member longer. They are not interchangeable in any direction.")),

        step("sort", "Which family?", ["ADOW-CJ-TJ.01.1"],
             {"registry": True,
              "ask": "Which family does the %s belong to?",
              "finish": "Five families, and every joint in the trade sits in one of them. Ask what the joint is FOR and the family follows.",
              "groups": [
                  {"key": "corner", "label": "corner"},
                  {"key": "frame", "label": "frame"},
                  {"key": "widening", "label": "widening"},
                  {"key": "lengthening", "label": "lengthening"},
                  {"key": "crossing", "label": "crossing"},
              ],
              "items": [
                  {"draw": "dovetail", "group": "corner",
                   "say": "Corner. It closes the corner of a box or a drawer."},
                  {"draw": "scarf", "group": "lengthening",
                   "say": "Lengthening. Two tapers overlapping to make a short member into a long one."},
                  {"draw": "edgeGlued", "group": "widening",
                   "say": "Widening. Narrow boards edge to edge, making a wide surface."},
                  {"draw": "mortiseTenon", "group": "frame",
                   "say": "Frame. A door, a window or a table frame is held square by these."},
                  {"draw": "crossHalving", "group": "crossing",
                   "say": "Crossing. The members meet near their middles, not at their ends."},
                  {"draw": "butt", "group": "corner",
                   "say": "Corner. The plainest of them, and still a corner joint."},
                  {"draw": "fished", "group": "lengthening",
                   "say": "Lengthening. Butted and plated, to make a long member out of two short ones."},
                  {"draw": "looseTongue", "group": "widening",
                   "say": "Widening. The tongue is there to keep the boards level and add gluing area, but the job is still making a board wider."},
              ]},
             error=("Sorting by what the joint looks like instead of what it does.",
                    "A cross halving and a corner halving are cut almost identically and are in "
                    "different families, because one joins members at their middles and the other "
                    "makes a frame. The family is the JOB.")),

        step("questions", "Choosing a joint for the job",
             ["ADOW-CJ-TJ.01.3", "ADOW-CJ-TJ.01.4"],
             {"items": [
                 q("A workbench top, 700 mm wide. Your widest board is 225 mm. Which family?",
                   [opt("Widening", True),
                    opt("Lengthening", False, "That would give you a longer bench, not a wider top."),
                    opt("Frame", False, "A frame will carry the top. It is not the top.")],
                   "Widening. Three or four boards jointed edge to edge, and the top is as wide as you need.",
                   ),

                 q("A roof member must span 6 metres and the longest timber on site is 4 metres. Which family?",
                   [opt("Lengthening", True),
                    opt("Crossing", False, "Crossing joins members at their middles. It adds no length."),
                    opt("Corner", False, "There is no corner here — this is one member that is too short.")],
                   "Lengthening. A scarf or a fished joint, placed where the bending stress is lowest — over a support, never mid-span.",
                   ),

                 q("A drawer front. The handle is pulled straight out, every day, for years. Which joint, and why?",
                   [opt("A through dovetail — the tails cannot pull out in that direction", True),
                    opt("A butt joint with long screws — quicker and the screws hold", False,
                        "Screws in end grain hold poorly, and a drawer front is pulled in exactly the direction that works them loose."),
                    opt("A mortise and tenon — the strongest joint there is", False,
                        "Strong, but it resists racking rather than direct withdrawal, and it is the wrong shape for a drawer corner.")],
                   "The dovetail. Its whole point is the ONE direction it cannot be pulled apart in, and that is the direction a drawer is pulled.",
                   ),

                 q("Which question tells you most about which joint to use?",
                   [opt("Which way will the load pull this joint apart?", True),
                    opt("Which joint looks most like skilled work?", False,
                        "Appearance is one consideration of three, and it is the last one."),
                    opt("Which joint is quickest to cut?", False,
                        "Speed matters on site and it does not decide the joint. A quick joint that fails is not quick.")],
                   "The direction of the load. Strength, appearance and the way the load pulls are the three, and the load is the one that rules out whole families at a stroke.",
                   ),
             ]}),

        step("words", "The words of this job", ["ADOW-CJ-TJ.01.2"],
             {"items": [
                 word("corner joint", "Joins two members at a corner — the sides of a box, a drawer, a cupboard."),
                 word("frame joint", "Makes a flat frame that resists racking: doors, windows, table frames."),
                 word("widening joint", "Makes a wide surface out of narrow boards. Runs along the grain."),
                 word("lengthening joint", "Makes a long member out of short ones. Runs across the grain."),
                 word("crossing joint", "Joins members at or near their middles rather than their ends."),
                 word("racking", "A frame going out of square under load, into a parallelogram. What frame joints exist to resist."),
                 word("tenon", "The tongue cut on one member that enters the mortise."),
                 word("mortise", "The hole cut in the other member that the tenon enters."),
                 word("tail", "The wedge-shaped part of a dovetail, wider at its end than at its root."),
             ]}),
    ],
}
