# -*- coding: utf-8 -*-
"""Lesson 12 - Rocks and Fossils.

0097 Stage 3: 3ESp.01 planet Earth is the source of every material we use,
and oil, gas and metals come from rocks; 3ESp.02 fossils are the impressions
or remains of things that were once alive; with 3TWSc.05, 3TWSc.01, 3SIC.03
and 3SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "rocks-and-fossils",
    "title": "Rocks and Fossils",
    "blurb": "Follow a spoon, a window and a bottle of petrol back to the rocks they came from, watch a fish become a fossil, look up how fossils are found, and see how taking things from the Earth changes it.",
    "steps": [
        step("explore", "Everything comes from the Earth", "\U0001F30D", "Earth's materials", ["3ESp.01"],
             "Every material we use comes from planet Earth. Tap each one to see where.",
             explain(
                 ["There is nowhere else to get materials from.", "Wood and wool come from living things. Metal, glass, oil and gas come from rocks."],
                 ["Metal is dug out of rocks called ores and melted out.", "Glass is made from sand, which is tiny bits of rock.", "Oil and natural gas are found deep in rocks, and plastic is made from oil.", "Bricks are baked clay, which is soft rock."],
                 ["Children think plastic comes from a factory and stop there.", "The factory makes it from oil, and the oil came out of rock."],
                 ["Tap all six and say where each began."]),
             {"items": [
                 {"pic": "\U0001F944", "label": "metal", "sub": "melted out of rock", "say": "Metals like iron, copper and gold are found inside rocks called ores. The rock is dug up and heated until the metal melts out."},
                 {"pic": "\U0001FA9F", "label": "glass", "sub": "made from sand", "say": "Glass is made by melting sand. Sand is rock, worn into tiny grains."},
                 {"pic": "\U0001F6E2️", "label": "oil", "sub": "pumped from deep rock", "say": "Oil is found deep underground, trapped in rock. It is pumped up and made into petrol, and into plastic."},
                 {"pic": "\U0001F525", "label": "natural gas", "sub": "trapped in rock", "say": "Natural gas is trapped in rocks underground too. It is piped to houses to cook and heat with."},
                 {"pic": "\U0001F9F1", "label": "bricks", "sub": "baked clay", "say": "Bricks are made from clay, a soft rock, shaped and baked hard in an oven."},
                 {"pic": "\U0001F9F4", "label": "plastic", "sub": "made from oil", "say": "Plastic is made in a factory from oil. And the oil came out of rock. So even plastic began in the Earth."},
             ], "need": 6,
              "then": {"ask": "Where does the metal in a spoon come from, in the end?",
                       "opts": [opt("From rocks in the Earth, melted out", True), opt("From trees", False), opt("From the sea", False)],
                       "why": "Metals come from rocks called ores. Everything we use comes from the Earth."}},
             "Metal, glass, oil, gas, bricks, plastic: all from rocks in the Earth."),

        step("sort", "From rocks, or from living things?", "\U0001F5C2️", "Source sorter", ["3ESp.01", "3TWSc.01"],
             "Everything comes from the Earth. Did this come from <b>rocks</b>, or from a <b>living thing</b>? Tap the bin.",
             explain(
                 ["Two big sources: rocks in the ground, and living things on top of it."],
                 ["A metal spoon, glass, a brick, petrol: from rocks.", "Wool, wood, cotton, paper, leather: from living things."],
                 ["Children put plastic with living things because it is soft.", "Plastic is made from oil, and oil comes out of rock."],
                 ["Ask where it began, then tap."]),
             {"ask": "From rocks, or from living things?",
              "bins": [{"id": "rock", "label": "From rocks", "pic": "\U0001FAA8"}, {"id": "living", "label": "From living things", "pic": "\U0001F333"}],
              "items": [
                  {"pic": "\U0001F944", "label": "a metal spoon", "bin": "rock", "why": "Metal is melted out of rock."},
                  {"pic": "\U0001F9F6", "label": "a woollen hat", "bin": "living", "why": "Wool grew on a sheep."},
                  {"pic": "\U0001FA9F", "label": "a glass window", "bin": "rock", "why": "Glass is melted sand, and sand is rock."},
                  {"pic": "\U0001FAB5", "label": "a wooden table", "bin": "living", "why": "Wood came from a tree."},
                  {"pic": "\U0001F9F1", "label": "a brick", "bin": "rock", "why": "A brick is baked clay, a soft rock."},
                  {"pic": "\U0001F455", "label": "a cotton T-shirt", "bin": "living", "why": "Cotton grows on a plant."},
                  {"pic": "⛽", "label": "petrol", "bin": "rock", "why": "Petrol is made from oil, which is pumped out of rock."},
                  {"pic": "\U0001F4D6", "label": "a paper book", "bin": "living", "why": "Paper is made from trees."},
                  {"pic": "\U0001F9F4", "label": "a plastic bottle", "bin": "rock", "why": "Plastic is made from oil, and oil comes from rock."},
                  {"pic": "\U0001F45E", "label": "a leather shoe", "bin": "living", "why": "Leather is animal skin."},
              ]},
             "Rocks, or living things. Everything began in the Earth."),

        step("demo", "How a fossil forms", "\U0001F41F", "Fossil maker", ["3ESp.02"],
             "Press <b>Next</b> to watch a fish become a fossil.",
             explain(
                 ["A fossil is the shape or the remains of something that was once alive, kept in rock for a very long time."],
                 ["A fish dies and sinks into the mud.", "More mud piles on top, layer after layer, for millions of years.", "The mud turns to rock, with the fish's shape pressed inside.", "One day the rock splits and there is the fish."],
                 ["Children think fossils are bones.", "Often they are just the shape, pressed into the rock like a footprint."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"scene": {"id": "fossil", "state": 0}, "cap": "A fish swims in the sea, long, long ago.", "say": "A fish swims in the sea, millions of years ago."},
                 {"scene": {"id": "fossil", "state": 1}, "cap": "It dies and sinks into the soft mud at the bottom.", "say": "It dies and sinks to the bottom, into the soft mud."},
                 {"scene": {"id": "fossil", "state": 2}, "cap": "Layer after layer of mud piles on top. Slowly, the mud turns to <b>rock</b>, with the fish's shape pressed inside.", "say": "More mud settles on top, layer after layer, for millions of years. The weight squashes the mud into rock, with the shape of the fish pressed inside it."},
                 {"scene": {"id": "fossil", "state": 3}, "cap": "The rock splits, and there is the fish: a <b>fossil</b>.", "say": "One day the rock is dug up or splits open, and there is the fish. Not the fish itself, but its shape, kept in stone. A fossil."},
             ]},
             "A fossil is the shape or remains of something once alive, kept in rock."),

        step("lookup", "Look it up: finding fossils", "\U0001F4DA", "Fossil facts", ["3TWSc.05", "3ESp.02"],
             "Read the fact card, then answer from it.",
             explain(
                 ["A fact card is a secondary source: somebody found this out and wrote it down for you."],
                 ["Read the whole card.", "Find each answer IN the card."],
                 [],
                 ["Read, then tap."]),
             {"source": {"title": "Fossil hunting",
                         "lines": ["Fossils are found in rocks that formed from <b>layers of mud or sand</b>, such as <b>sandstone</b>, <b>limestone</b> and <b>shale</b>. They are almost never found in very hard rocks like granite.",
                                   "The best places to look are <b>cliffs</b> and <b>beaches</b> where the sea wears the rock away and splits it open.",
                                   "Most fossils are of things with <b>hard parts</b>: shells, bones and teeth. Soft animals like jellyfish rarely leave one.",
                                   "The scientists who study fossils are called <b>palaeontologists</b>. They use small hammers and brushes to free a fossil from the rock without breaking it.",
                                   "Fossils tell us about animals that lived <b>millions of years ago</b>, like dinosaurs, which nobody has ever seen alive."]},
              "items": [
                  {"ask": "In which kind of rock are fossils found?", "opts": [opt("rocks made from layers of mud or sand, like sandstone", True), opt("very hard rocks like granite", False), opt("metal", False)], "why": "The card says layers of mud or sand: sandstone, limestone, shale."},
                  {"ask": "Where are the best places to look?", "opts": [opt("cliffs and beaches", True), opt("the middle of a field", False), opt("inside a house", False)], "why": "The card says cliffs and beaches, where the sea splits the rock."},
                  {"ask": "Why are there few jellyfish fossils?", "opts": [opt("jellyfish have no hard parts", True), opt("jellyfish are too big", False), opt("jellyfish never die", False)], "why": "The card says most fossils are of things with hard parts."},
                  {"ask": "What is a scientist who studies fossils called?", "opts": [opt("a palaeontologist", True), opt("a vet", False), opt("an astronaut", False)], "why": "The card says palaeontologists."},
              ]},
             "You found every answer in the card. Fossils tell us about life millions of years ago."),

        step("context", "Taking from the Earth", "⛏️", "Earth and us", ["3SIC.04", "3SIC.03", "3ESp.01"],
             "Everything we use is taken from the Earth, and that changes it. Tap each one.",
             explain(
                 ["Science helps us see what taking materials does to the world, and how to do less harm."],
                 ["A quarry takes rock and leaves a hole.", "A mine can pollute rivers if it is not run carefully.", "Recycling metal and glass means less digging.", "A geologist finds the rocks and works out how to take them safely."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "⛏️", "label": "a quarry", "say": "A quarry cuts rock out of a hillside for buildings and roads. It leaves a huge hole and dust. Some old quarries are turned into lakes and nature reserves."},
                 {"pic": "\U0001F6E2️", "label": "an oil well", "say": "An oil well pumps oil from deep in the rock. A spill can cover beaches and birds in oil, so it has to be done very carefully."},
                 {"pic": "♻️", "label": "recycling", "say": "A recycled can is melted and made into a new can. That means less rock dug up and less energy used. Glass and paper can be recycled too."},
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F52C", "label": "geologist", "say": "A geologist studies rocks. They find where the metals and oil are, and work out how to take them out with the least harm to the land."},
             ], "need": 4,
              "then": {"ask": "Why does recycling a can help the Earth?",
                       "opts": [opt("Less rock has to be dug up to make a new one", True), opt("It makes the can shinier", False), opt("It does not help", False)],
                       "why": "Every material comes from the Earth. Reusing it means taking less."}},
             "Everything comes from the Earth, so taking it carefully matters."),

        step("questions", "Earth check", "✅", "Earth check", ["3ESp.01", "3ESp.02"],
             "Tap the answer.",
             explain(
                 ["Where materials come from, and what a fossil is."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Where do all the materials we use come from?", "\U0001F30D", "planet Earth", ["the Moon", "the Sun", "space"], "There is nowhere else."),
                 q("Where is oil found?", "\U0001F6E2️", "deep in rocks underground", ["in trees", "in the air"], "Trapped in rock."),
                 q("What is glass made from?", "\U0001FA9F", "sand", ["wood", "wool"], "Melted sand."),
                 q("What is a fossil?", "\U0001F41F", "the shape or remains of something once alive, kept in rock", ["a shiny stone", "a kind of metal"], "Once alive, kept in rock."),
                 q("What is plastic made from?", "\U0001F9F4", "oil", ["sand", "wool"], "Oil, from rock."),
             ]},
             "You know where things come from."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3ESp.01", "3ESp.02", "3TWSc.05", "3SIC.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How is metal got out of rock?", "\U0001F944", "the rock is heated until the metal melts out", ["it is washed out", "it grows out"], "Melted from ore."),
                 q("Which of these comes from rocks?", "\U0001FAA8", "a brick", ["a woollen hat", "a paper book", "a leather shoe"], "Baked clay."),
                 q("Which of these comes from a living thing?", "\U0001F333", "a wooden table", ["a glass window", "petrol", "a metal spoon"], "Wood from a tree."),
                 q("What happens to the mud on top of a dead fish?", "\U0001F41F", "layers pile up and slowly turn to rock", ["it washes away", "it turns to gold"], "Millions of years of layers."),
                 q("Why are most fossils of shells, bones and teeth?", "\U0001F9B4", "hard parts last; soft parts rot away", ["they are pretty", "they are big"], "The card said so."),
                 q("Where would you look for fossils?", "\U0001F3D6️", "cliffs and beaches where rock splits open", ["in a field of grass", "up a tree"], "The sea splits the rock."),
                 q("What does a palaeontologist study?", "\U0001F469\U0001F3FE‍\U0001F52C", "fossils", ["stars", "plants"], "Fossil scientists."),
                 q("Why recycle a glass bottle?", "♻️", "less sand has to be dug up to make new glass", ["glass cannot be recycled", "to make it heavier"], "Taking less from the Earth."),
             ]},
             "That is the whole lesson finished. You know where every material began."),
    ],
}

LESSON["about"] = [
    "Say that every material we use comes from planet Earth.",
    "Say where metal, glass, oil, gas and plastic come from.",
    "Say what a fossil is and how one forms.",
    "Find answers about fossils in a fact card.",
]

LESSON["lecture"] = [
    part("\U0001F30D", "Only one planet",
         "Every single material we use comes from planet Earth. There is nowhere else to get it. Wood and wool come from living things. But metal, glass, oil and gas come from rocks."),
    part("\U0001F944", "Out of the rocks",
         "Metal is found inside rocks called ores. The rock is dug up and heated until the metal melts out. Glass is melted sand, and sand is tiny bits of rock. Bricks are baked clay, a soft rock."),
    part("\U0001F6E2️", "Oil and gas",
         "Oil and natural gas are trapped deep in rocks underground. Oil is pumped up and made into petrol, and into plastic. So even a plastic bottle began in the Earth."),
    part("\U0001F41F", "A fossil",
         "A fish dies and sinks into the mud. Layer after layer of mud piles on top for millions of years and turns to rock, with the fish's shape pressed inside. One day the rock splits open. That shape is a fossil."),
    part("⛏️", "Taking carefully",
         "Digging quarries and mines and pumping oil all change the Earth. Science helps us see the harm and do less of it: recycling metal and glass means less digging. Today you will look it all up."),
]

LESSON["words"] = [
    word("material", "\U0001F9F1", "What a thing is made of.",
         ["Metal is a material.", "Every material comes from the Earth."]),
    word("ore", "\U0001FAA8", "A rock that has metal inside it.",
         ["Iron is melted out of ore.", "Miners dig up ore."]),
    word("oil", "\U0001F6E2️", "A dark liquid found deep in rocks, used to make petrol and plastic.",
         ["Oil is pumped from underground.", "Plastic is made from oil."]),
    word("natural gas", "\U0001F525", "A gas trapped in rocks underground, piped to houses for cooking and heating.",
         ["Natural gas heats our water.", "Natural gas comes from rocks."]),
    word("fossil", "\U0001F41F", "The shape or remains of something once alive, kept in rock for a very long time.",
         ["We found a fossil of a shell.", "A fossil forms over millions of years."]),
    word("palaeontologist", "\U0001F469\U0001F3FE‍\U0001F52C", "A scientist who studies fossils.",
         ["A palaeontologist found a dinosaur bone.", "Palaeontologists use brushes and small hammers."]),
    word("recycle", "♻️", "To make something used into something new, so less has to be taken from the Earth.",
         ["We recycle cans and glass.", "Recycling means less digging."]),
]

LESSON["home"] = [
    home("Where did it come from?", "Paper and a pencil, one room of your house",
         ["Pick ten things.",
          "For each one, say the material, then say where it began: rock, or living thing.",
          "Draw an arrow from each thing back to the Earth."],
         "Every arrow ends at the Earth. Which room has the most things from rocks?"),
    home("Make a fossil", "Play dough or clay, a shell or a leaf, a plate",
         ["Flatten the clay on the plate.",
          "Press the shell or leaf into it firmly, then lift it out.",
          "Leave the clay to go hard for a day."],
         "The shape stays in the hard clay. That is how a real fossil keeps a shape in rock."),
    home("Recycling count", "Your recycling bin, a grown-up",
         ["Look at what is in the recycling for one day.",
          "Sort it: metal, glass, paper, plastic.",
          "For each pile, say what it came from in the Earth."],
         "Metal from ore, glass from sand, plastic from oil, paper from trees. All going round again."),
]
