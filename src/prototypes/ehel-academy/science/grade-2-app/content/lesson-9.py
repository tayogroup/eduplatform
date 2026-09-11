# -*- coding: utf-8 -*-
"""Lesson 9 - Rocks and the Earth.

0097 Stage 2 Planet Earth, all three: 2ESp.01 describe and compare rocks;
2ESp.02 rock is extracted from quarries, mines and riverbeds; 2ESp.03 human
activity affects the environment; with 2Cp.03, 2TWSc.01, 2TWSc.03, 2TWSc.05,
2TWSc.06, 2TWSp.01 and 2SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "rocks-and-the-earth",
    "title": "Rocks and the Earth",
    "blurb": "Compare six kinds of rock by testing them, measure a rock in cubes, see how rock is taken out of the ground, and sort what people do to the land into help and harm.",
    "steps": [
        step("explore", "Not all rock is the same", "\U0001FAA8", "Rock kinds", ["2ESp.01"],
             "There are many kinds of rock. Tap each one and hear what it is like.",
             explain(
                 ["Rock is the hard stuff the land is made of, under the soil, and there are many different kinds."],
                 ["Granite is very hard and speckled.", "Chalk is soft and white; you can write with it.", "Sandstone is grainy, like sand stuck together.",
                  "Marble is smooth and shiny when polished.", "Slate splits into flat sheets.", "Pumice is full of holes and so light it floats."],
                 ["Children think all rock is grey and hard.", "Chalk crumbles in your hand. Pumice floats. Rocks are as different as materials."],
                 ["Tap all six and say one thing about each."]),
             {"items": [
                 {"pic": "\U0001FAA8", "label": "granite", "sub": "hard, speckled", "say": "Granite. Very hard, with speckles of different colours. Kitchen worktops are often granite."},
                 {"pic": icon("chalk"), "label": "chalk", "sub": "soft, white", "say": "Chalk. Soft and white. It crumbles, and you can draw with it."},
                 {"pic": "\U0001F3DC️", "label": "sandstone", "sub": "grainy", "say": "Sandstone. Grains of sand stuck together. Rub it and grains come off."},
                 {"pic": "\U0001F3DB️", "label": "marble", "sub": "smooth, shiny", "say": "Marble. Smooth, and shiny when it is polished. Statues are often marble."},
                 {"pic": "\U0001F3E0", "label": "slate", "sub": "splits into sheets", "say": "Slate. Dark, and it splits into thin flat sheets, which is why roofs are made of it."},
                 {"pic": "\U0001F30B", "label": "pumice", "sub": "full of holes, light", "say": "Pumice comes from a volcano. It is full of holes and so light that it floats on water."},
             ], "need": 6},
             "Granite, chalk, sandstone, marble, slate, pumice. Six rocks, six sets of properties."),

        step("tester", "Test the rocks", "\U0001F52C", "Rock tester", ["2ESp.01", "2Cp.03", "2TWSc.02"],
             "Test each rock the way a geologist does. Press each test on at least <b>four</b> rocks.",
             explain(
                 ["Rocks can be tested for their properties, just like any material."],
                 ["Scratch it with a coin: does it scratch, or is it too hard?", "Look with a hand lens: grains, or smooth?", "Drop water on it: does it soak in?", "Rub it: do bits come off?"],
                 ["Children scratch too gently and call everything hard.", "Press the coin properly; chalk and sandstone will scratch."],
                 ["Test four rocks with all four tests and watch the badges."]),
             {"need": 4,
              "tests": [
                  {"id": "scratch", "label": "Scratch with a coin", "pic": "\U0001FA99", "anim": "translateX(6px)", "sound": "click", "say": "Scratch the %m with a coin. It is %r."},
                  {"id": "look", "label": "Look with a hand lens", "pic": "\U0001F50D", "anim": "scale(1.3)", "sound": "click", "say": "Look at the %m through the lens. It is %r."},
                  {"id": "water", "label": "Drop water on it", "pic": "\U0001F4A7", "anim": "translateY(8px)", "sound": "splash", "say": "Drop water on the %m. It %r."},
                  {"id": "rub", "label": "Rub it", "pic": "✋", "anim": "rotate(10deg)", "sound": "shake", "say": "Rub the %m. It is %r."},
              ],
              "materials": [
                  {"id": "granite", "pic": "\U0001FAA8", "label": "granite", "props": {"scratch": "too hard to scratch", "look": "speckled with crystals", "water": "does not soak it up", "rub": "hard, nothing comes off"}},
                  {"id": "chalk", "pic": icon("chalk"), "label": "chalk", "props": {"scratch": "soft, it scratches easily", "look": "smooth and powdery", "water": "soaks it up", "rub": "crumbly, white powder comes off"}},
                  {"id": "sandstone", "pic": "\U0001F3DC️", "label": "sandstone", "props": {"scratch": "fairly soft, it scratches", "look": "grainy, like sand", "water": "soaks it up", "rub": "grainy, sand comes off"}},
                  {"id": "marble", "pic": "\U0001F3DB️", "label": "marble", "props": {"scratch": "hard, it barely scratches", "look": "smooth with faint stripes", "water": "does not soak it up", "rub": "smooth, nothing comes off"}},
                  {"id": "slate", "pic": "\U0001F3E0", "label": "slate", "props": {"scratch": "hard, it barely scratches", "look": "flat layers", "water": "does not soak it up", "rub": "smooth, nothing comes off"}},
                  {"id": "pumice", "pic": "\U0001F30B", "label": "pumice", "props": {"scratch": "rough; the coin does not scratch it, but bits break off", "look": "full of tiny holes", "water": "soaks it up", "rub": "rough, bits come off"}},
              ]},
             "Every rock has its own properties, and testing finds them."),

        step("record", "Record: does water soak in?", "\U0001F4DD", "Rock table", ["2TWSc.06", "2ESp.01"],
             "Put your water test into the table. Did water soak into <b>%s</b>?",
             explain(
                 ["A table compares one property across every rock."],
                 ["Chalk and sandstone soaked the water up.", "Granite and marble did not."],
                 [],
                 ["Fill in each row from your test."]),
             {"ask": "Did water soak into %s?",
              "columns": ["Rock", "Soaks up water?"],
              "rows": [
                  {"pic": "\U0001FAA8", "label": "granite", "answer": "no", "why": "the water sat on top of the granite."},
                  {"pic": icon("chalk"), "label": "chalk", "answer": "yes", "why": "the chalk soaked it up."},
                  {"pic": "\U0001F3DC️", "label": "sandstone", "answer": "yes", "why": "the sandstone soaked it up between its grains."},
                  {"pic": "\U0001F3DB️", "label": "marble", "answer": "no", "why": "the water ran off the marble."},
              ],
              "choices": [{"id": "yes", "t": "Yes, it soaks in", "pic": "\U0001F4A7"}, {"id": "no", "t": "No, it runs off", "pic": "☔"}]},
             "Chalk and sandstone soak up water; granite and marble do not."),

        step("measure", "How big is the rock?", "\U0001F4CF", "Measured it", ["2TWSc.03"],
             "Measure <b>%s</b> in cubes. Press to lay a cube along it each time.",
             explain(
                 ["You can measure a rock by laying cubes along it and counting."],
                 ["Lay a cube. One.", "Lay the next, touching. Two.", "Stop when the cubes reach the end of the rock."],
                 ["Children leave gaps between cubes.", "Each cube touches the last one."],
                 ["Measure both rocks, then say which is longer."]),
             {"ask": "How long is %s? Lay cubes along it.",
              "unit": {"name": "cubes", "singular": "cube", "pic": "\U0001F7E9", "button": "Lay a cube"},
              "objects": [
                  {"pic": "\U0001FAA8", "label": "the granite rock", "units": 7},
                  {"pic": icon("chalk"), "label": "the piece of chalk", "units": 4},
              ],
              "compare": {"ask": "The granite is 7 cubes and the chalk is 4 cubes. Which is longer?",
                          "opts": [opt("the granite rock", True), opt("the piece of chalk", False), opt("they are the same", False)],
                          "why": "7 cubes is more than 4, so the granite is longer."}},
             "You measured rocks in cubes."),

        step("demo", "Where rock comes from", "⛏️", "Rock getters", ["2ESp.02"],
             "Rock is taken out of the Earth in different ways. Press <b>Next</b> to see three.",
             explain(
                 ["The rock in buildings, roads and roofs was dug out of the ground somewhere."],
                 ["A quarry is a huge open pit where rock is cut and blasted out.", "A mine goes underground in tunnels.", "Smooth pebbles and gravel are scooped from riverbeds."],
                 ["Children think rock is made in a factory.", "It is dug up. Only bricks and concrete are made."],
                 ["Press Next and see each place."]),
             {"button": "Next place ▶", "frames": [
                 {"scene": {"id": "extract", "state": 0}, "cap": "A <b>quarry</b>: a huge open pit. Rock is cut and blasted out in blocks.", "say": "A quarry. A huge open pit dug into a hillside. Rock is cut and blasted out in blocks and carried away in lorries."},
                 {"scene": {"id": "extract", "state": 1}, "cap": "A <b>mine</b>: tunnels dug underground to reach the rock.", "say": "A mine. Tunnels dug deep underground, where miners with lamps dig the rock out."},
                 {"scene": {"id": "extract", "state": 2}, "cap": "A <b>riverbed</b>: smooth pebbles and gravel scooped from the water.", "say": "A riverbed. The river has worn the rock into smooth pebbles and gravel, which are scooped out."},
                 {"pic": "\U0001F3E0", "cap": "Roofs, walls, roads and worktops all began in a quarry, a mine or a river.", "say": "The slate on a roof, the stone in a wall, the gravel on a path: all of it was taken out of the Earth."},
             ]},
             "Quarries, mines and riverbeds: three ways rock is taken from the Earth."),

        step("lookup", "Look it up: rock facts", "\U0001F4D6", "Fact finder", ["2TWSc.05", "2ESp.02"],
             "Read the fact card, then answer <b>from the card</b>.",
             explain(
                 ["A fact card is a secondary source: somebody found this out and wrote it down for you."],
                 ["Find the question's words in the card, and the answer is next to them."],
                 [],
                 ["Read the card, then find each answer in it."]),
             {"source": {"title": "Rock facts",
                         "lines": ["<b>Granite</b> is one of the hardest rocks. It is cut into blocks in quarries and used for kitchen worktops and steps.",
                                   "<b>Slate</b> splits into thin flat sheets, so it is used for roof tiles. Slate mines go deep underground.",
                                   "<b>Chalk</b> is soft and white. Sticks of chalk for writing are made from it.",
                                   "River <b>pebbles</b> are smooth because the water has rolled them against each other for thousands of years.",
                                   "A quarry can be as deep as a <b>fifty-storey building</b> is tall.",
                                   "When a quarry is finished it is sometimes filled with water to make a <b>lake</b> for wildlife."]},
              "items": [
                  {"ask": "Why is slate used for roof tiles?", "opts": [opt("it splits into thin flat sheets", True), opt("it is soft", False), opt("it floats", False)], "why": "The card says slate splits into thin flat sheets."},
                  {"ask": "Why are river pebbles smooth?", "opts": [opt("the water rolled them against each other for thousands of years", True), opt("people polish them", False), opt("they are made of glass", False)], "why": "Rolling in the river wears them smooth."},
                  {"ask": "What happens to some quarries when they are finished?", "opts": [opt("they are filled with water to make a lake", True), opt("they are turned into mines", False), opt("they float away", False)], "why": "The card says a finished quarry can become a lake for wildlife."},
                  {"ask": "Which rock is used for kitchen worktops?", "opts": [opt("granite", True), opt("chalk", False), opt("pumice", False)], "why": "Granite is hard, so it is cut for worktops."},
              ]},
             "You found every answer in the card."),

        step("sort", "Helping the land, or harming it?", "\U0001F5C2️", "Land carer", ["2ESp.03", "2SIC.04", "2TWSc.01"],
             "What people do can change the land, the water and the air. Does this <b>help</b> or <b>harm</b>?",
             explain(
                 ["Digging rock out, building, farming and throwing things away all change the environment.", "Some of what we do helps, and some harms."],
                 ["Filling an old quarry with water for wildlife: helps.", "Dumping rubbish in a river: harms.", "Planting trees: helps.", "Smoke from burning rubbish: harms."],
                 ["Children think a quarry is only bad.", "We need the rock; the question is what we do afterwards."],
                 ["Ask: is the land, water or air better or worse after this?"]),
             {"ask": "Helps the environment, or harms it?",
              "bins": [{"id": "help", "label": "Helps", "pic": "\U0001F49A"}, {"id": "harm", "label": "Harms", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F5D1️", "label": "dumping rubbish in a river", "bin": "harm", "why": "Rubbish poisons the water and the animals in it."},
                  {"pic": "\U0001F333", "label": "planting trees", "bin": "help", "why": "Trees give shade, homes for animals and clean air."},
                  {"pic": "\U0001F3DE️", "label": "turning an old quarry into a lake", "bin": "help", "why": "A flooded quarry becomes a habitat."},
                  {"pic": "\U0001F4A8", "label": "smoke from burning rubbish", "bin": "harm", "why": "Smoke dirties the air everyone breathes."},
                  {"pic": "♻️", "label": "recycling glass and cans", "bin": "help", "why": "Recycling means less rock and sand have to be dug up."},
                  {"pic": "\U0001F6E3️", "label": "covering a meadow with concrete", "bin": "harm", "why": "The plants and animals that lived there lose their habitat."},
                  {"pic": "\U0001F6B0", "label": "keeping streams clean", "bin": "help", "why": "Clean water keeps fish, frogs and people healthy."},
                  {"pic": "\U0001F5D1️", "label": "leaving litter on the beach", "bin": "harm", "why": "Litter harms sea birds and turtles."},
              ]},
             "What people do changes the environment, for better or worse."),

        step("ask", "Ask a question about rock", "❓", "Asked why", ["2TWSp.01"],
             "Look at the pebble. Tap a question you would like to ask.",
             explain(
                 ["Geologists, the scientists who study rock, started with questions like these."],
                 ["Why is it smooth? What is inside it? How old is it?", "Some you can test, some you look up."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001FAA8",
              "questions": ["Why is this pebble so smooth?", "What would I see if I cut it in half?", "How old is this rock?"],
              "findOut": {"ask": "You want to know what is inside the pebble. How could you find out?",
                          "opts": [opt("Ask a grown-up to break one open and look with a hand lens", True), opt("Guess", False), opt("Ask the pebble", False)],
                          "why": "Looking closely at the inside is observing. Testing and looking are how geologists find out."}},
             "Ask, then look closely or look it up."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2ESp.01", "2ESp.02", "2ESp.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which rock is soft, white and crumbly?", icon("chalk"), "chalk", ["granite", "marble", "slate"], "Chalk is soft; you can write with it."),
                 q("Which rock is so full of holes that it floats?", "\U0001F30B", "pumice", ["granite", "marble", "chalk"], "Pumice comes from a volcano and floats."),
                 q("Which rock splits into flat sheets for roofs?", "\U0001F3E0", "slate", ["sandstone", "chalk", "pumice"], "Slate splits into thin sheets."),
                 q("Which rock soaked up the water in your test?", "\U0001F4A7", "chalk", ["granite", "marble"], "Chalk and sandstone soak up water; granite and marble do not."),
                 q("A huge open pit where rock is cut out is a...", "⛏️", "quarry", ["mine", "riverbed", "factory"], "A quarry is an open pit; a mine is underground."),
                 q("Where do smooth pebbles come from?", "\U0001FAA8", "a riverbed, where water rolled them smooth", ["a factory", "the Moon"], "Rivers roll rock into smooth pebbles."),
                 q("Which of these harms the environment?", "\U0001F6AB", "dumping rubbish in a river", ["planting trees", "recycling cans", "making an old quarry a lake"], "Rubbish poisons water and animals."),
                 q("How do we find out a rock's properties?", "\U0001F52C", "test it: scratch, look, drop water, rub", ["guess from its name", "ask the rock"], "Rocks are tested like any material."),
                 q("Why is granite, not chalk, used for kitchen worktops?", icon("rock"), "granite is hard and does not soak up water; chalk is soft and crumbles", ["chalk is too heavy to lift", "granite is softer than chalk"], "A worktop has to stay hard and dry. Chalk would crumble and soak up every spill."),
             ]},
             "That is the whole lesson finished. You know your rocks."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say that not all rock is the same, and name some kinds.",
    "Test rocks and record their properties.",
    "Say where rock is taken from the Earth.",
    "Say how what people do helps or harms the land.",
]

LESSON["warmup"] = [
    q("Which of these is a kind of rock?", "❓", "a pebble", ["a leaf", "a feather"], "A pebble is a small piece of rock, worn smooth by water."),
    q("Which is the hardest?", "❓", "a stone", ["a sponge", "a slice of bread"], "A stone is a piece of rock, and most rock is hard."),
]

LESSON["lecture"] = [
    part("\U0001FAA8", "Many kinds of rock",
         "Granite is hard and speckled. Chalk is soft and white. Sandstone is grainy. Marble is smooth and shiny. Slate splits into sheets. Pumice is full of holes and floats. Not all rock is the same."),
    part("\U0001F50D", "Testing rocks",
         "Scratch it: is it hard or soft? Drip water on it: does it soak in? Look closely: is it grainy, smooth or full of holes? Every rock has its own properties."),
    part("\u26CF\uFE0F", "Where rock comes from",
         "A quarry is a huge pit where rock is cut from a hillside. A mine is tunnels deep underground. A riverbed is where water has worn rock into pebbles."),
    part("\U0001F3E0", "Rock all around",
         "Slate on roofs. Stone in walls. Gravel on paths. Marble on floors. Chalk on the board. Rock is everywhere you look."),
    part("\U0001F333", "Helping or harming",
         "Dumping rubbish, smoke, covering a meadow with concrete: these harm the land. Planting trees, recycling, keeping streams clean: these help. What we do changes the Earth."),
]

LESSON["words"] = [
    word("rock", "\U0001FAA8", "The hard material the Earth is made of under the soil.",
         ["Granite is a hard rock.", "Rock is dug from a quarry."]),
    word("pebble", "\u26AA", "A small, smooth piece of rock, worn smooth by water.",
         ["I found a pebble on the beach.", "The river makes pebbles smooth."]),
    word("quarry", "\u26CF\uFE0F", "A big open pit where rock is dug from the ground.",
         ["Stone for the wall came from a quarry.", "A quarry is cut into a hillside."]),
    word("mine", "\U0001F573\uFE0F", "Tunnels dug deep underground to take out rock or metal.",
         ["Miners work in a mine.", "Coal comes from a mine."]),
    word("soak", "\U0001F4A7", "To take in water.",
         ["Chalk soaks up water.", "Marble does not soak up water."]),
    word("grainy", "\U0001F7E4", "Made of tiny grains you can see or feel.",
         ["Sandstone is grainy.", "The grainy rock felt rough."]),
    word("environment", "\U0001F30D", "Everything around us: the land, the water, the air and the living things.",
         ["Litter harms the environment.", "Planting trees helps the environment."]),
]

LESSON["home"] = [
    home("Rock collection", "A bag, a walk outside with a grown-up, a magnifying glass",
         ["Go for a walk with a grown-up and collect five different stones.",
          "Look at each with the magnifying glass. Grainy, smooth, speckled, holes?",
          "Sort them by one property.",
          "Wash your hands afterwards."],
         "No two are quite the same."),
    home("The drip test on rocks", "Your five stones, a dropper or a spoon, water",
         ["Put one drop of water on each stone.",
          "Watch for one minute.",
          "Say which soaked it up and which stayed wet on top."],
         "Soft, grainy rocks soak. Hard, smooth ones do not."),
    home("Rock spotting walk", "A grown-up, a street, paper and a pencil",
         ["Walk along a street with a grown-up. Find rock used in five places: a wall, a roof, a path, a step, a kerb.",
          "Say what kind it might be.",
          "Draw the one you like best."],
         "Rock is all around, doing jobs."),
]
