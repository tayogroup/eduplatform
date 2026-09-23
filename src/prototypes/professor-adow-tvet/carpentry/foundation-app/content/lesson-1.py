# -*- coding: utf-8 -*-
"""Lesson 1 — Preparing Timber to Size.

Carpentry Foundation. Covers all four units: CF.01 (identify and group
hand tools), CF.02 (care and maintenance), CF.03 (workshop safety, the
power-machine half) and CF.04 (prepare timber to size).

Content from the Sokoine University of Agriculture Workshop Technology
Manual, Carpentry and Joinery (F. C. Kahimba, 2010): section 1.1 on tool
groups and maintenance, 1.2 on safety rules for hand tools and power
machines, 1.3 on timber preparation, and the surface-planer precautions
in Lesson 3. Terminology is UK / East African throughout.

This lesson comes BEFORE ../../tools-and-joints-app's lesson, which
opens on a piece already planed, squared and gauged.
"""
from _kit import step, opt, q, check, word

LESSON = {
    "slug": "preparing-timber-to-size",
    "title": "Preparing Timber to Size",
    "module": "foundation",
    "blurb": (
        "Group the hand tools by what they do, name the parts of a smoothing plane, "
        "take four damaged tools out of service, choose timber for a job, and take a "
        "rough-sawn board to a straight, square, finished size."
    ),
    "outcomes": [
        "Group hand tools by what they do, not by what they are made of.",
        "Name the parts of a smoothing plane.",
        "Inspect a tool and decide whether it is fit to use, repaired or replaced.",
        "Choose timber for a job and mark it with an allowance for sawing and planing.",
        "Plane a face side and a face edge square to it, and mark both.",
        "Set a marking gauge to a dimension and plane to the gauge lines.",
        "State the rules that make a power planer safe to stand at.",
    ],
    "steps": [

        step("sort", "What each tool is for", ["ADOW-CJ-CF.01.1", "ADOW-CJ-CF.01.4"],
             {"groups": [
                 {"key": "measure", "label": "measuring & marking"},
                 {"key": "cut", "label": "cutting"},
                 {"key": "plane", "label": "planing"},
                 {"key": "strike", "label": "striking"},
             ],
              "items": [
                  {"tool": "trySquare", "label": "try square", "group": "measure",
                   "say": "Measuring and marking. It does not cut anything — it tells you where to cut and proves that an edge is square."},
                  {"tool": "tenonSaw", "label": "tenon saw", "group": "cut",
                   "say": "Cutting. Fine teeth across the grain, and a stiff back that keeps the cut straight."},
                  {"tool": "plane", "label": "smoothing plane", "group": "plane",
                   "say": "Planing. It takes a controlled shaving off a surface to make it straight, square and smooth. A chisel cuts; a plane makes flat."},
                  {"tool": "markingGauge", "label": "marking gauge", "group": "measure",
                   "say": "Measuring and marking. It carries one setting and scores that same distance from the face side every time."},
                  {"draw": "loose", "label": "mallet", "group": "strike",
                   "say": "Striking — and it is the ONLY thing that should strike a chisel handle. A claw hammer's steel face splits the handle; a mallet's wooden face does not."},
              ],
              "finish": "Tools are grouped by what they DO. That is why a mallet and a claw hammer are both striking tools and still are not interchangeable."},
             error=("Reaching for a claw hammer to drive a chisel, because it is the heavier tool.",
                    "A steel face on a wooden handle splits it, and a split handle is how a chisel "
                    "ends up loose in the hand. The mallet exists for this one job.")),

        step("label", "The smoothing plane", ["ADOW-CJ-CF.01.2"],
             {"tool": "plane"},
             error=("Keeping even pressure from one end of the stroke to the other.",
                    "The pressure moves: on the front knob as the plane goes on, on the rear tote "
                    "as it comes off. Even pressure rounds both ends of the board, and a board "
                    "rounded at the ends is not straight however many shavings you take.")),

        step("inspect", "Four tools off the rack",
             ["ADOW-CJ-CF.02.1", "ADOW-CJ-CF.02.2", "ADOW-CJ-CF.02.3", "ADOW-CJ-CF.02.4"],
             {"finish": "A tool is inspected BEFORE it is picked up. Three of those four go to the bench for repair, and one is fit to use.",
              "items": [
                  {"draw": "mushroom", "ask": "This striking head has spread over at the edges. What is it, and what does it do?",
                   "opts": [
                       opt("A mushroomed head — chips can fly off it when struck", True),
                       opt("Normal wear, it can stay in service", False,
                           "No. The spread metal is work-hardened and brittle, and it is at eye height when you strike."),
                       opt("Rust, which only needs cleaning", False,
                           "Not rust. The metal has spread under repeated blows."),
                   ],
                   "why": "A mushroomed head. The spread lip is hard and brittle, and a fragment can come off at speed towards your face. Dress it back on the grinder before it is used again."},

                  {"draw": "split", "ask": "This chisel handle has cracks running from the ferrule. Fit to use?",
                   "opts": [
                       opt("No — replace the handle before it is used", True),
                       opt("Yes, if you only push it by hand", False,
                           "A split runs further every time the handle is loaded, and it fails without warning — usually with your hand behind the blade."),
                       opt("Yes, if it is bound with tape", False,
                           "Tape hides the split and holds nothing. It will still fail."),
                   ],
                   "why": "Replace it. A split handle fails suddenly, and the hand driving it goes forward onto the blade."},

                  {"draw": "loose", "ask": "This mallet head moves on the shaft. What should happen to it?",
                   "opts": [
                       opt("Off the rack until the head is refitted tight", True),
                       opt("Use it gently until someone has time to fix it", False,
                           "A loose head comes off on the swing, and nobody controls where it goes."),
                       opt("It is a mallet, so a loose head is harmless", False,
                           "A hardwood head at the end of a swing is not harmless."),
                   ],
                   "why": "Off the rack. A head that moves will come off, and it leaves the hand at speed."},

                  {"draw": "sound", "ask": "And this one. Ground square, honed, handle tight, ferrule sound.",
                   "opts": [
                       opt("Fit to use — and it should be stored so the edge stays that way", True),
                       opt("Too sharp to be safe", False,
                           "The opposite. A sharp tool cuts where you put it; a blunt one needs force, and force is what slips."),
                       opt("It needs grinding before every use", False,
                           "Grinding is for a damaged edge. Honing keeps a good one, and this one is good."),
                   ],
                   "why": "Fit to use. Keep it clean, dry and covered at the edge — a chisel dropped loose in a drawer is a blunt chisel by next week."},
              ]},
             error=("Sharpening being treated as fussiness rather than safety.",
                    "A blunt edge has to be forced through the wood, and the moment it breaks free "
                    "it goes wherever the force was pointed. Most chisel injuries are made by blunt chisels.")),

        step("questions", "Choosing the timber", ["ADOW-CJ-CF.04.1"],
             {"items": [
                 q("You need a rail 250 mm long and 60 mm wide. The rack has a piece 260 mm long and a piece 400 mm long. Which do you take?",
                   [opt("The 400 mm piece", True),
                    opt("The 260 mm piece — less waste", False,
                        "It leaves 10 mm for a saw cut AND all the planing. You will finish under size with nothing left to correct it."),
                    opt("Either, they both exceed 250 mm", False,
                        "Only one of them exceeds it by enough to saw and plane.")],
                   "The 400 mm piece. Timber is chosen large enough that the allowance for sawing and planing is already in it."),

                 q("A workbench top needs to be 600 mm wide and the widest board you have is 200 mm. What does that tell you?",
                   [opt("It needs a widening joint — several boards jointed edge to edge", True),
                    opt("It cannot be made", False,
                        "Table tops and bench tops are almost never one board. That is what widening joints are for."),
                    opt("Use a 200 mm board and accept a narrow bench", False,
                        "The specification is 600 mm.")],
                   "A widening joint. Edge-to-edge glued, loose tongue, or dowelled — that family exists precisely to make wide surfaces out of narrow boards."),

                 q("Why is timber chosen large enough that unnecessary joints are avoided?",
                   [opt("Every joint is a weak point and a piece of work", True),
                    opt("Because joints are decorative and should be rare", False,
                        "Some joints are decorative. That is not why you avoid unnecessary ones."),
                    opt("Because glue is expensive", False,
                        "Glue is the cheapest thing in the workshop.")],
                   "A joint is somewhere the timber can fail and somewhere your time goes. One that the stock size made unnecessary is pure cost."),
             ]}),

        step("order", "The stages of preparation", ["ADOW-CJ-CF.04.2", "ADOW-CJ-CF.04.3"],
             {"ask": "A rough-sawn board to a finished piece. Tap the stages in the order you would do them.",
              "finish": "That is the order. Face side, then face edge, then everything else measured from those two.",
              "items": [
                  "Select timber large enough for the job",
                  "Mark to length, leaving an allowance for sawing and planing",
                  "Saw to the marked length",
                  "Plane one wide face straight — the face side — and mark it",
                  "Plane one edge straight and square to it — the face edge — and mark it",
                  "Set the gauge and score the width and thickness from those two",
                  "Plane down to the gauge lines",
              ],
              "why": [
                  "Yes. Everything after this depends on having enough wood.",
                  "Yes. The allowance is what the saw and the plane will consume.",
                  "Yes. Still oversize at this point, deliberately.",
                  "Yes. The face side is the first true surface, and it is marked so it can never be confused with the other three.",
                  "Yes. Square to the face side, and the two marks are made to meet so the pair is unmistakable.",
                  "Yes. Both settings are taken from the face side and face edge, never from the sawn faces.",
                  "Yes. Plane to the lines, and the piece is to size.",
              ],
              "before": [
                  "This is the first stage — nothing can happen before it.",
                  "Not yet. Choose the timber first.",
                  "Not yet. Mark it before you cut it.",
                  "Not yet. Saw to length first.",
                  "Not yet. There is no face side to be square to.",
                  "Not yet. The gauge is set from the face side and face edge, and you have not made them both.",
                  "Not yet. There are no gauge lines to plane to.",
              ]}),

        step("demo", "From rough board to finished size", ["ADOW-CJ-CF.04.3", "ADOW-CJ-CF.04.5"],
             {"sequence": "prep"},
             ask="Press Next and watch a rough-sawn board become a piece that can be marked out.",
             error=("Planing all four faces true and then wondering why nothing fits.",
                    "Only two surfaces are planed true on their own: the face side and the face edge. "
                    "The other two are planed to GAUGE LINES scored from those. Four independently "
                    "trued faces do not give you a piece of known thickness.")),

        step("setgauge", "Setting the gauge", ["ADOW-CJ-CF.04.4"],
             {"finish": "Set it, lock it, then lay it against the rule again before it touches the wood.",
              "targets": [
                  {"ask": "Set the marking gauge to 20 millimetres — the thickness of the piece.", "mm": 20,
                   "why": "Twenty millimetres, measured from the fence to the pin. The fence rides on the face side, so that is the distance every line will be from it."},
                  {"ask": "Now set it to 12 millimetres for the cheek of a joint.", "mm": 12,
                   "why": "Twelve. A gauge carries one setting at a time, and both members are scored from it before it is changed.",
                   "miss": "Both members would be gauged from this one setting, so the error lands on both, in the same direction — and the joint is out by twice it."},
              ]},
             error=("Setting the gauge against the rule by eye and locking it without checking.",
                    "The thumbscrew often drags the stem a fraction as it tightens. Set it, lock it, "
                    "and THEN measure it again — a gauge one millimetre out puts every line one "
                    "millimetre out, invisibly and consistently.")),

        step("safety", "At the surface planer",
             ["ADOW-CJ-CF.03.3", "ADOW-CJ-CF.03.4", "ADOW-CJ-CF.03.5"],
             {"ask": "You are about to face a board on the surface planer. Tick every precaution. Two of these are not precautions — leave them alone.",
              "done": "Now the machine can be started.",
              "items": [
                  check("Check the guard is in position and covers the block.", True,
                        "The cutter block turns at several thousand revolutions a minute and does not stop for a hand. The guard is the only thing between the two."),
                  check("Check the stock for nails, screws and grit before it goes on.", True,
                        "A nail meeting the cutters throws metal and wood across the shop and destroys the knives. Look at every piece, especially reclaimed timber."),
                  check("Use a push block for short pieces, and never plane less than 40 mm.", True,
                        "Below about 40 mm there is not enough board to keep your hand away from the block. The push block is what stands between them."),
                  check("Tie back loose clothing and remove rings, bracelets and a watch.", True,
                        "Anything that hangs can be caught and it takes the hand with it. This is also why gloves are not worn at a machine."),
                  check("Wear gloves for a better grip on the board.", False,
                        "No — a glove near rotating machinery is a hazard, not a precaution. If it catches, the hand goes in with it. Bare, dry hands."),
                  check("Isolate the power before you adjust the fence or the depth of cut.", True,
                        "Switched off is not isolated. A machine that starts while your fingers are at the block does not give you a second chance."),
                  check("Clear the shavings from the table by hand as you work.", False,
                        "No — never by hand, and never while it runs. A brush, with the machine stopped and the block still."),
                  check("Sweep the floor and clear the offcuts around the machine.", True,
                        "You will be walking backwards feeding a board. A floor with offcuts on it is where the trip happens."),
              ]},
             error=("Treating the guard as something that gets in the way of the cut.",
                    "Every guard on a woodworking machine was fitted after somebody was hurt. "
                    "A cut that cannot be made with the guard in place is a cut that needs a "
                    "different method, not a lifted guard.")),

        step("questions", "What you now know",
             ["ADOW-CJ-CF.01.1", "ADOW-CJ-CF.02.2", "ADOW-CJ-CF.04.2", "ADOW-CJ-CF.04.4"],
             {"items": [
                 q("What makes the face side and the face edge different from the other two surfaces?",
                   [opt("They are planed true on their own, and everything else is measured from them", True),
                    opt("They are the two widest surfaces", False,
                        "The face side is a wide surface and the face edge is a narrow one. Width is not what makes them."),
                    opt("They are the two that will show in the finished work", False,
                        "Sometimes true and never the reason. They are the reference surfaces.")],
                   "They are the reference pair. Every measurement, gauge line and squared line comes from them — which is why they are marked and why the marks are made to meet."),

                 q("You mark a 250 mm rail at exactly 250 mm and saw on the line. What have you got?",
                   [opt("A rail that will be under size once it is planed", True),
                    opt("A rail of exactly 250 mm", False,
                        "The saw takes its kerf and the plane takes shavings. Both come out of your 250."),
                    opt("A rail that can be corrected by planing", False,
                        "Planing removes more wood. It cannot add any.")],
                   "Under size. Mark with an allowance for the saw cut and for the planing, and take the allowance off afterwards."),

                 q("Your marking gauge is set one millimetre over. You gauge both members of a joint from it. How far out is the joint?",
                   [opt("Two millimetres — the error lands on both members", True),
                    opt("One millimetre", False,
                        "One millimetre on each of two members, both in the same direction."),
                    opt("Nothing — the same setting on both makes them match", False,
                        "They match each other and neither matches the drawing. The joint is still two millimetres out.")],
                   "Two. One setting used twice puts the error in twice, which is why the gauge is checked against the rule after it is locked."),

                 q("A striking head has spread and gone bright at the edges. What is the risk?",
                   [opt("The hardened lip can break off and fly", True),
                    opt("It will mark the work", False,
                        "It might. That is not the reason it is taken out of service."),
                    opt("It has gone soft and will bend", False,
                        "The opposite — it has work-hardened, which is what makes it brittle.")],
                   "A mushroomed head is brittle, and a fragment leaves it at the speed of the blow, at about eye height. Dress it back before it is used."),
             ]}),

        step("words", "The words of this job", ["ADOW-CJ-CF.01.2"],
             {"items": [
                 word("face side", "The first wide surface planed true. Marked with a looping f. Every gauge setting is taken from it."),
                 word("face edge", "The edge planed straight and square to the face side. Marked so the two marks meet."),
                 word("allowance", "The extra length and thickness left on for the saw cut and the planing. Marked on, then taken off."),
                 word("in wind", "Twisted, so the board rocks on a flat surface. Sighted down the length before any planing starts."),
                 word("sole", "The flat underside of a plane. The plane can only make a surface as flat as its own sole."),
                 word("tote", "The rear handle of a plane. The pressure moves to it at the end of the stroke."),
                 word("mushroomed", "A striking head spread and hardened at the edges by repeated blows. Brittle, and taken out of service."),
                 word("push block", "The block that feeds short stock over a planer so that a hand never has to."),
             ]}),
    ],
}
