# -*- coding: utf-8 -*-
"""Lesson 4 - Coils and Slabs.

0067 Stage 4: E.02 the progression text's own clay ladder - "if learners were
previously introduced to simple ways to manipulate clay, they would now be
taught how to join clay, how to make marks and how to create reliefs" - taken
one step past Grade 3's relief into a vessel built from coils and slabs;
M.01 an outcome reached in more than one way, with reasons for the difference;
TWA.02 the same idea made three ways; R.02 judge a pot against what it has to
do; E.01 a jar from another time, and what its maker did. The step up from
Grade 2 and Grade 3: Grade 2 pinched a pot and joined clay, Grade 3 pressed a
relief; Grade 4 BUILDS a vessel, and its walls have to hold.
"""
from _kit import explain, step, opt, q, spot, material, change, part, word, home

LESSON = {
    "slug": "coils-and-slabs",
    "title": "Coils and Slabs",
    "blurb": "Watch a coil pot being built, put the building in order, sort pots by how they were made, choose how to finish a surface, fix three pots that failed, and read a jar painted in bands long ago.",
    "steps": [
        step("demo", "From a ball to a pot", "🏺", "Pot watcher", ["4E.02", "4M.01"],
             "Press <b>Next</b> and watch a pot built out of coils.",
             explain(
                 ["A coil pot is built from rolled sausages of clay, one on top of another."],
                 ["Roll a coil as thick as your finger, and keep it even.",
                  "Score and slip where each coil meets the last one.",
                  "Smooth the inside so the wall becomes one piece.",
                  "Turn the pot as you build, so it grows evenly."],
                 ["Children stack coils without joining them, and the pot comes apart as it dries.",
                  "Every coil is scored, slipped and smoothed."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🟤", "cap": "Start with a flat round <b>base</b>, cut from a slab.", "say": "Start with a flat round base, cut from a slab."},
                 {"pic": "🌭", "cap": "Roll a <b>coil</b>, as thick as your finger and the same all the way along.", "say": "Roll a coil, as thick as your finger and the same all the way along."},
                 {"pic": "🍴", "cap": "<b>Score and slip</b> the top of the base, and lay the coil on.", "say": "Score and slip the top of the base, and lay the coil on.", "sound": "click"},
                 {"pic": "🔄", "cap": "Smooth the inside so the coils become <b>one wall</b>. Turn as you go.", "say": "Smooth the inside so the coils become one wall. Turn the pot as you go."},
                 {"pic": "🏺", "cap": "Build up, coil by coil. Lean them out and the pot widens.", "say": "Build up, coil by coil. Lean them out and the pot widens."},
                 {"pic": "🐢", "cap": "Dry it <b>slowly</b>, so the thick and thin parts dry together.", "say": "Dry it slowly, so the thick and thin parts dry together."},
             ]},
             "Base, coil, score, slip, smooth, turn. That is a coil pot."),

        step("order", "Build a pot", "📋", "Pot planner", ["4M.01", "4E.02"],
             "Tap the steps in the order you would do them.",
             explain(
                 ["A pot is built from the bottom up, and every join is made as you go."],
                 ["The base first.", "Then a coil, scored and slipped on.",
                  "Smooth the inside.", "Keep building, turning as you go.",
                  "Finish the rim last, and dry it slowly."],
                 ["Children decorate the outside before the walls are joined.",
                  "Join first. Decorate when the pot holds together."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "🟤", "label": "cut a round base from a slab", "say": "First, roll a slab and cut a round base."},
                 {"pic": "🌭", "label": "roll an even coil", "say": "Roll a coil, as thick as your finger, even all the way along."},
                 {"pic": "🍴", "label": "score and slip the join", "say": "Score and slip where the coil will sit."},
                 {"pic": "👆", "label": "smooth the inside wall", "say": "Smooth the inside so the coils become one wall."},
                 {"pic": "🏺", "label": "build up, turning as you go", "say": "Build up coil by coil, turning the pot so it grows evenly."},
                 {"pic": "🐢", "label": "dry it slowly", "say": "Finish the rim, then dry it slowly under loose plastic."},
             ]},
             "Base, coil, join, smooth, build, dry. In that order."),

        step("sort", "How was it made?", "🗂️", "Pot sorter", ["4M.01", "4E.02"],
             "Clay can be built three ways. How was each of these made? Tap the bin.",
             explain(
                 ["The same pot can be made more than one way, and the marks tell you which."],
                 ["Pinched: pressed out of one lump with your thumb, so it is small and round.",
                  "Coiled: built from rings, so the wall can be tall.",
                  "Slab: cut from a rolled sheet, so the sides are flat and the corners sharp."],
                 ["Children think every pot is thrown on a wheel.",
                  "Most pots you will make are pinched, coiled or slabbed."],
                 ["Read it, then tap the bin."]),
             {"ask": "Pinched, coiled or slab-built?",
              "bins": [{"id": "pinch", "label": "Pinched", "pic": "👌"}, {"id": "coil", "label": "Coiled", "pic": "🌭"}, {"id": "slab", "label": "Slab-built", "pic": "🟫"}],
              "items": [
                  {"pic": "🥣", "label": "a small round bowl that fits in one hand", "bin": "pinch", "why": "Pressed out of one lump with a thumb. Pinched."},
                  {"pic": "📦", "label": "a square box with flat sides and sharp corners", "bin": "slab", "why": "Flat sides come from flat sheets. Slab-built."},
                  {"pic": "🏺", "label": "a tall pot with rings you can feel inside", "bin": "coil", "why": "Rings inside are the coils, smoothed on the outside only."},
                  {"pic": "🪟", "label": "a flat tile with a picture pressed into it", "bin": "slab", "why": "A tile is a piece of a rolled slab."},
                  {"pic": "🐍", "label": "a wobbly jug that got taller ring by ring", "bin": "coil", "why": "Ring by ring is coiling."},
                  {"pic": "🥚", "label": "a thumb-sized pot with thumb dents inside", "bin": "pinch", "why": "The dents are the thumb that made it."},
                  {"pic": "🏠", "label": "a little house with four walls cut to shape", "bin": "slab", "why": "Cut walls, joined at the corners. Slab-built."},
              ]},
             "You sorted seven pots by how they were built."),

        step("choose", "Finish the surface", "🧰", "Surface chooser", ["4M.01", "4M.02", "4TWA.02"],
             "The pot is built. Now the outside. Which finish does each job need? Tap it.",
             explain(
                 ["A surface can be smoothed, marked, carved or coloured, and each tool does its own thing."],
                 ["The back of a spoon rubbed over leather-hard clay burnishes it: a soft shine, no glaze.",
                  "A stamp presses a shape in, again and again.",
                  "A loop tool carves a line out.",
                  "Coloured slip is runny clay you paint on."],
                 ["Children paint a pot with poster paint and it washes off.",
                  "Clay is finished with clay, or with a tool, before it is fired."],
                 ["Read the job, then tap."]),
             {"materials": [
                 material("spoon", "The back of a spoon", "🥄", ["shine"], "Rubbed over leather-hard clay, a spoon burnishes it to a soft shine."),
                 material("stamp", "A stamp", "🔘", ["repeat"], "A stamp presses the same shape in, again and again."),
                 material("loop", "A loop tool", "🪝", ["carve out"], "A loop tool carves a line out of the clay."),
                 material("slip", "Coloured slip", "🎨", ["colour"], "Slip is runny clay, and it colours the surface before firing."),
                ],
              "rounds": [
                  {"purpose": "a soft shine without any glaze", "needs": "shine", "pic": "✨", "why": "Burnishing with a smooth back of a spoon gives a shine."},
                  {"purpose": "a band of the same little shape all the way round", "needs": "repeat", "pic": "🔁", "why": "A stamp repeats a shape exactly."},
                  {"purpose": "a groove cut into the wall", "needs": "carve out", "pic": "〰️", "why": "A loop tool takes clay away."},
                  {"purpose": "a red band that will still be there after firing", "needs": "colour", "pic": "🟥", "why": "Coloured slip is clay, so it fires with the pot."},
              ]},
             "You chose a finish for four jobs."),

        step("refine", "Three pots that failed", "🔧", "Pot mender", ["4R.02", "4TWA.03", "4M.02"],
             "Each of these went wrong. Work out why, then tap the change that fixes it.",
             explain(
                 ["A cracked or slumped pot is telling you what it needed."],
                 ["Coils that split apart were not scored and slipped.",
                  "A wall that slumps is too thin at the bottom for the weight above.",
                  "A lopsided pot was built from one side only."],
                 ["Children blame the clay.", "Read the fault: it names the step you skipped."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Lina's coil pot", "pic": "💔", "fixedPic": "🏺", "problem": "As it dried, the coils came apart in rings.", "fixed": "The wall dried as one piece."},
                  "needs": "join",
                  "changes": [
                      change("slip", "Score and slip every coil, and smooth the inside", "🍴", "join", "Scored, slipped and smoothed, the coils become one wall."),
                      change("press", "Press the coils down harder", "👇", "worse", "Pressing squashes the coils, and they still come apart."),
                      change("paint", "Paint over the cracks", "🎨", "colour", "Painted cracks are still cracks."),
                      change("fast", "Dry it faster", "🔥", "worse", "Fast drying pulls the rings apart even sooner."),
                  ],
                  "why": "Clay joins to clay only where it is scored and slipped."},
                 {"piece": {"title": "Zain's tall jug", "pic": "🫠", "fixedPic": "🫙", "problem": "The bottom bulged out and the jug sank while he built it.", "fixed": "It stood up all the way."},
                  "needs": "thicker",
                  "changes": [
                      change("thick", "Make the lower coils thicker, and let them firm up before building higher", "💪", "thicker", "A thicker base carries the weight, and a firmer wall holds its shape."),
                      change("taller", "Build it taller quickly", "⬆️", "worse", "More weight on a wall that is already sinking."),
                      change("water", "Add more water to the clay", "💧", "worse", "Wetter clay slumps faster."),
                      change("wide", "Make the rim wider", "⭕", "add", "A wide rim on a sinking wall."),
                  ],
                  "why": "The part that carries the weight has to be the strongest, and clay needs time to firm up."},
                 {"piece": {"title": "Ravi's lopsided bowl", "pic": "🥴", "fixedPic": "🥣", "problem": "One side is tall and the other is low.", "fixed": "The rim is level all the way round."},
                  "needs": "turn",
                  "changes": [
                      change("turn", "Turn the pot as you build, and check the rim by eye at each coil", "🔄", "turn", "Turning means you build all sides equally, and you can see the rim going wrong early."),
                      change("cut", "Cut the tall side off at the end", "✂️", "add", "Now it is level and much shorter than you wanted."),
                      change("lean", "Lean the low side out", "↗️", "worse", "Now it is lopsided and leaning."),
                      change("more", "Add more coils to the tall side", "➕", "worse", "The tall side gets taller."),
                  ],
                  "why": "A pot built from one side only grows lopsided. Turn it as you build."},
             ]},
             "You worked out why three pots failed, and fixed each one."),

        step("source", "A jar from long ago", "🏺", "Jar reader", ["4E.01", "4R.02"],
             "This jar is drawn in the manner of ancient Greek black-figure pottery. Tap the parts to find out what its makers did.",
             explain(
                 ["About 2,500 years ago in Greece, a potter made the jar and a painter put the figures on.",
                  "The figures are black shapes on the clay colour, painted in a slip that turned black in the firing, with fine lines scratched through them."],
                 ["Tap the handles: two, one each side, for lifting a heavy jar.",
                  "Tap the band of figures: the story runs round the widest part.",
                  "Tap the foot, and the narrow neck."],
                 ["Children think the black is paint put on afterwards.",
                  "It is clay slip, fired until it turned black. It is part of the pot."],
                 ["Tap three things and listen."]),
             {"scene": "amphora", "need": 3, "caption": "Tap the handles, the band of figures, the foot and the neck.",
              "spots": [
                  spot("handles", "a handle", "Two handles, one on each side, joined at the neck and again at the shoulder. A full jar is heavy, and two hands lift it better than one.", 114, 90, "🤲"),
                  spot("band", "the band of figures", "The figures are the BLACK shapes, and the clay colour around them is the background. They were painted in a slip that fired black, and fine lines were scratched through it.", 160, 143, "🖤"),
                  spot("foot", "the foot", "A foot wide enough to stand on, and thicker than the wall above it.", 160, 210, "🦶"),
                  spot("neck", "the neck", "The neck is narrower than the belly, so what is inside does not slop out and dust does not get in.", 160, 34, "⭕"),
              ],
              "then": {"ask": "Why is the neck of the jar narrow?",
                       "opts": [{"t": "so what is inside does not spill, and dust stays out", "spot": "neck"}, {"t": "so it looks pretty"}, {"t": "because the potter ran out of clay"}],
                       "why": "The shape of a pot comes from the job it does."}},
             "You read the handles, the figures, the foot and the neck."),

        step("questions", "Pot spotter", "💬", "Pot spotter", ["4E.02", "4M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about building with clay.", "You have met every one of them."],
                 ["Think about coils, slabs, joins and finishes."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Clay", "items": [
                 q("A coil is…", "🌭", "a rolled sausage of clay", ["a flat sheet", "a kind of glaze"], "Coils are rolled, then stacked."),
                 q("A slab is…", "🟫", "a flat rolled sheet of clay", ["a rolled sausage", "a tool"], "Slabs make flat sides and sharp corners."),
                 q("What joins one coil to the next?", "🍴", "scoring and slip", ["glue", "tape"], "Clay joins to clay with score and slip."),
                 q("Burnishing with a spoon gives…", "✨", "a soft shine", ["a rough surface", "a crack"], "Rubbing smooths and shines leather-hard clay."),
             ]},
             "You know how a pot is built."),

        step("quiz", "Show what you know", "⭐", "Star potter", ["4E.01", "4E.02", "4M.01", "4M.02", "4R.02", "4TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about coils and slabs, joins, finishes and the jar from long ago."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A pot with rings you can feel inside was…", "🏺", "coiled", ["pinched", "slab-built"], "The rings are the coils."),
                 q("Why score and slip every join?", "🍴", "because clay only sticks to clay where it is scratched and wetted", ["because it looks nice", "to make it dry faster"], "An unscored join comes apart as it dries."),
                 q("Why should the bottom coils be thicker?", "💪", "because they carry the weight of everything above", ["because thick clay is cheaper", "so the pot is heavier"], "The part under stress has to be strongest."),
                 q("Why turn the pot as you build?", "🔄", "so every side grows the same and the rim stays level", ["so it dries faster", "to make a pattern"], "Building from one side makes it lopsided."),
                 q("Coloured slip is…", "🎨", "runny clay you paint on before firing", ["poster paint", "glue"], "Slip is clay, so it fires with the pot."),
                 q("A square box with sharp corners was made from…", "📦", "slabs", ["coils", "one pinched lump"], "Flat sheets, cut and joined."),
                 q("On a Greek jar, the black figures are…", "🖤", "clay slip that turned black in the firing", ["ink", "black paper"], "The black is fired clay, not paint added afterwards."),
                 q("Why does the jar have two handles?", "🤲", "because a full jar is heavy and needs two hands", ["for decoration only", "so it can hang up"], "The shape follows the job."),
             ]},
             "That is the whole lesson finished. You can build a pot that holds together."),
    ],
}


LESSON["about"] = [
    "Build a pot from coils, in the right order.",
    "Tell a pinched pot from a coiled one and a slab-built one.",
    "Choose how to finish a clay surface.",
    "Say why a pot cracked, slumped or went lopsided.",
    "Read a jar made long ago, and what its shape is for.",
]

LESSON["lecture"] = [
    part("🌭", "Coils",
         "A coil pot is built from rolled sausages of clay. Each one is scored, slipped and smoothed into the one below, so the rings become a single wall. Turn the pot as you build and it grows evenly."),
    part("🟫", "Slabs",
         "Roll the clay flat and you have a slab. Cut it and you get flat sides and sharp corners: tiles, boxes, little houses. A slab pot is built like a piece of carpentry."),
    part("💪", "Where the weight goes",
         "The bottom of a tall pot carries everything above it, so the lower coils are made thicker and given time to firm up. The part under the most stress is always the part you build strongest."),
    part("🏺", "A jar with a job",
         "The two-handled jars of ancient Greece were built for carrying oil and water: a narrow neck so nothing slops out, a wide belly to hold a lot, two handles because a full jar is heavy, and a foot to stand on."),
]

LESSON["words"] = [
    word("coil", "🌭", "A rolled sausage of clay, stacked to build a wall.",
         ["I rolled six coils.", "The coils showed inside the pot."]),
    word("slab", "🟫", "A flat rolled sheet of clay.",
         ["I cut the base from a slab.", "Slab-built boxes have sharp corners."]),
    word("leather-hard", "🧱", "Clay that has dried enough to hold its shape, but is not dry through.",
         ["Burnish it when it is leather-hard.", "Carve at the leather-hard stage."]),
    word("burnish", "✨", "To rub clay smooth and shiny with something hard.",
         ["I burnished it with a spoon.", "A burnished pot shines without glaze."]),
    word("slip", "🎨", "Runny clay, used to join pieces or to colour a surface.",
         ["Score and slip the join.", "I painted a band of red slip."]),
    word("rim", "⭕", "The top edge of a pot.",
         ["Keep the rim level.", "I smoothed the rim last."]),
]

LESSON["home"] = [
    home("A coil pot", "Air-dry clay or salt dough, a blunt knife, water, and a board",
         ["Cut a round base.", "Roll coils as thick as your finger and score, slip and smooth each one on.",
          "Turn the pot as you build, and keep the rim level."],
         "Can you feel the coils inside?"),
    home("A slab box", "Air-dry clay or salt dough, a rolling pin, a ruler and a blunt knife",
         ["Roll a slab as thick as your little finger.", "Cut a base and four walls.",
          "Score, slip and join every corner, and press a coil of clay inside each join."],
         "Which is easier to build straight: coils or slabs?"),
    home("Surfaces", "Leftover clay, a spoon, a pencil, a fork and anything with a pattern",
         ["Flatten five small tiles.", "Finish each one differently: burnished, stamped, carved, combed, left plain.",
          "Label them when they are dry."],
         "Which surface would you want on a pot, and why?"),
]

LESSON["journal"] = {
    "changes": ["score and slip every join", "make the bottom thicker", "turn it as I build", "burnish the surface", "keep it just as it is"],
}
