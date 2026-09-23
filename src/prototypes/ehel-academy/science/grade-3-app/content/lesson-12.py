# -*- coding: utf-8 -*-
"""Lesson 12 - Rocks and Fossils.

0097 Stage 3: 3ESp.01 planet Earth is the source of every material we use,
and oil, gas and metals come from rocks; 3ESp.02 fossils are the impressions
or remains of things that were once alive; with 3TWSc.05, 3TWSc.01, 3SIC.03
and 3SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home, cando

LESSON = {
    "slug": "rocks-and-fossils",
    "title": "Rocks and Fossils",
    "blurb": "Follow a spoon, a window and a bottle of petrol back to the rocks they came from, watch a fish become a fossil, look up how fossils are found, and see how taking things from the Earth changes it.",
    "steps": [
        step("explore", "Everything comes from the Earth", "\U0001F30D", "Earth's materials", ["3ESp.01"],
             "Every material we use comes from planet Earth. Tap each one to see where.",
             explain(
                 ["There is nowhere else to get materials from.", "Wood and wool come from living things. Metal, glass, oil and gas come from rocks."],
                 ["Metal is dug out of rocks called ores, then heated, and the metal is separated out.", "Glass is made from sand, which is tiny bits of rock.", "Oil and natural gas are found deep in rocks, and plastic is made from oil.", "Bricks are baked clay, which is soft rock."],
                 ["Children think plastic comes from a factory and stop there.", "The factory makes it from oil, and the oil came out of rock."],
                 ["Tap all six and say where each began."]),
             {"items": [
                 {"pic": "\U0001F944", "label": "metal", "sub": "taken out of rock", "say": "Metals like iron and copper are found inside rocks called ores. The rock is dug up and heated, and the metal is separated out."},
                 {"pic": "\U0001FA9F", "label": "glass", "sub": "made from sand", "say": "Glass is made by melting sand. Sand is rock, worn into tiny grains."},
                 {"pic": "\U0001F6E2️", "label": "oil", "sub": "pumped from deep rock", "say": "Oil is found deep underground, trapped in rock. It is pumped up and made into petrol, and into plastic."},
                 {"pic": "\U0001F525", "label": "natural gas", "sub": "trapped in rock", "say": "Natural gas is trapped in rocks underground too. It is piped to houses to cook and heat with."},
                 {"pic": "\U0001F9F1", "label": "bricks", "sub": "baked clay", "say": "Bricks are made from clay, a soft rock, shaped and baked hard in an oven."},
                 {"pic": "\U0001F9F4", "label": "plastic", "sub": "made from oil", "say": "Plastic is made in a factory from oil. And the oil came out of rock. So even plastic began in the Earth."},
             ], "need": 6,
              "then": {"ask": "Where does the metal in a spoon come from, in the end?",
                       "opts": [opt("From rocks in the Earth, called ores", True), opt("From trees", False), opt("From the sea", False)],
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
                  {"pic": "\U0001F944", "label": "a metal spoon", "bin": "rock", "why": "Metal is taken out of rock."},
                  {"pic": "\U0001F9F6", "label": "a woollen hat", "bin": "living", "why": "Wool grew on a sheep."},
                  {"pic": "\U0001FA9F", "label": "a glass window", "bin": "rock", "why": "Glass is melted sand, and sand is rock."},
                  {"pic": "\U0001FAB5", "label": "a wooden table", "bin": "living", "why": "Wood came from a tree."},
                  {"pic": "\U0001F9F1", "label": "a brick", "bin": "rock", "why": "A brick is baked clay, a soft rock."},
                  {"pic": "\U0001F455", "label": "a cotton T-shirt", "bin": "living", "why": "Cotton grows on a plant."},
                  {"pic": "⛽", "label": "petrol", "bin": "rock", "why": "Petrol is made from oil. Oil is found in rock deep underground. It formed there long ago from tiny living things in the sea."},
                  {"pic": "\U0001F4D6", "label": "a paper book", "bin": "living", "why": "Paper is made from trees."},
                  {"pic": "\U0001F9F4", "label": "a plastic bottle", "bin": "rock", "why": "Plastic is made from oil, which is found in rock deep underground. The oil formed there long ago from tiny living things in the sea."},
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

        step("lookup", "Look it up: finding fossils", "\U0001F4DA", "Fossil facts", ["3TWSc.05", "3ESp.02", "3TWSp.04"],
             "Read the fact card, then answer from it.",
             explain(
                 ["A fact card is a secondary source: somebody found this out and wrote it down for you."],
                 ["Read the whole card.", "Find each answer in the card."],
                 [],
                 ["Read, then tap."]),
             {"source": {"title": "Fossil hunting",
                         "lines": ["Fossils are found in rocks that formed from <b>layers of mud or sand</b>, such as <b>sandstone</b>, <b>limestone</b> and <b>shale</b>. They are almost never found in rocks that were once melted, like granite.",
                                   "The best places to look are <b>cliffs</b> and <b>beaches</b> where the sea wears the rock away and splits it open. Always go with a <b>grown-up</b>, check the tide together, and never stand under a cliff: rocks can fall.",
                                   "Fossil hunters wear <b>goggles</b> when a grown-up taps a rock with a hammer, because small chips of rock can fly out.",
                                   "Most fossils are of things with <b>hard parts</b>: shells, bones and teeth. Soft animals like jellyfish rarely leave one.",
                                   "The scientists who study fossils are called <b>palaeontologists</b>. They use small hammers and brushes to free a fossil from the rock without breaking it.",
                                   "Fossils tell us about animals that lived <b>millions of years ago</b>, like dinosaurs, which nobody has ever seen alive."]},
              "items": [
                  {"ask": "In which kind of rock are fossils found?", "opts": [opt("rocks made from layers of mud or sand, like sandstone", True), opt("rocks that were once melted, like granite", False), opt("metal", False)], "why": "The card says layers of mud or sand: sandstone, limestone, shale."},
                  {"ask": "Where are the best places to look?", "opts": [opt("cliffs and beaches", True), opt("the middle of a field", False), opt("inside a house", False)], "why": "The card says cliffs and beaches, where the sea splits the rock. Go with a grown-up, and never stand under a cliff."},
                  {"ask": "Why are there few jellyfish fossils?", "opts": [opt("jellyfish have no hard parts", True), opt("jellyfish are too big", False), opt("jellyfish never die", False)], "why": "The card says most fossils are of things with hard parts."},
                  {"ask": "What is a scientist who studies fossils called?", "opts": [opt("a palaeontologist", True), opt("a vet", False), opt("an astronaut", False)], "why": "The card says palaeontologists."},
                  {"ask": "How do you stay safe on a fossil hunt?", "opts": [opt("go with a grown-up and never stand under a cliff", True), opt("go alone and climb the cliff", False), opt("stand right under the cliff to look up at it", False)], "why": "The card says rocks can fall from cliffs. Going with a grown-up, and keeping away from the bottom of the cliff, keeps you safe."},
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
                 q("Wool comes from a sheep. Does it come from planet Earth?", "\U0001F411", "Yes. Follow it back: the sheep ate plants, and the plants grew here.", ["No, it comes from an animal, not the Earth", "Only the washing water does"],
                   "A plant makes its food from water, air and sunlight. Every animal material starts with the Earth."),
                 q("Is the air part of planet Earth?", "\U0001F32C\uFE0F", "Yes. It is a layer of gases held on by the Earth's gravity.", ["No, the air is above the Earth", "No, air is not a material"],
                   "The air is as much part of the planet as the rock is. Gravity holds it in place."),
                 q("How long ago did the animal in a fossil live?", "\U0001F995", "millions of years ago", ["a few years ago", "about a hundred years ago"],
                   "The animals in fossils are nothing like the ones alive now, and they were buried for a very long time."),
             ],
              "support": [
                 q("Do we dig metal out of the ground?", "\u26CF\uFE0F", "Yes", ["No"],
                   "Metal is dug out of the ground inside rocks, and then separated from them."),
                 q("Is a fossil found in rock?", "\U0001F41A", "Yes", ["No"],
                   "A fossil is a shape left in rock."),
                 q("Does oil come from underground?", "\U0001F6E2\uFE0F", "Yes", ["No"],
                   "It is pumped up from deep inside rocks."),
                 q("Is wool a material from a living thing?", "\U0001F411", "Yes", ["No"],
                   "It grows on a sheep, and the sheep ate plants that grew in the Earth."),
              ],
              "extension": [
                 q("Coal burns and gives heat. Where did that energy come from originally?", "\U0001F332", "sunlight caught by plants that lived long ago", ["the heat of the rock underground", "the mining machinery that dug it out"],
                   "Coal is the squashed remains of ancient forests. Burning it lets go of sunlight those plants caught long ago."),
                 q("Oil took millions of years to form underground. Why can we not simply make more of it?", "\U0001F6E2\uFE0F", "nothing can make it in a human lifetime - it took millions of years", ["we can, in a factory", "there is an endless amount down there"],
                   "Some of what the Earth gives us is replaced far more slowly than we use it. That is why people look for other ways."),
                 q("A mobile phone has metal, glass and plastic in it. Where did all three start?", "\U0001F4F1", "in the Earth - metal from ore, glass from sand, plastic from oil", ["in a factory, all three of them", "metal from the Earth and the other two from nowhere"],
                   "Follow any material back far enough and it came out of the ground."),
                 q("Why are fossils almost never found in the middle of a lava flow?", "\U0001F30B", "the heat destroys the remains, and fossils form in layers of mud and sand instead", ["lava is the best place to look", "fossils only form in lava"],
                   "A fossil needs to be buried gently and left alone. Molten rock is neither."),
              ]},
             "You know where things come from.",
             mis=["2.5-m1", "2.5-m2", "4.4-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3ESp.01", "3ESp.02", "3TWSc.05", "3SIC.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How is metal got out of rock?", "\U0001F944", "the rock is heated, and the metal is separated out", ["it is washed out", "it grows out"], "Heated, and separated from the ore."),
                 q("Which of these comes from rocks?", "\U0001FAA8", "a brick", ["a woollen hat", "a paper book", "a leather shoe"], "Baked clay."),
                 q("Which of these comes from a living thing?", "\U0001F333", "a wooden table", ["a glass window", "petrol", "a metal spoon"], "Wood from a tree."),
                 q("What happens to the mud on top of a dead fish?", "\U0001F41F", "layers pile up and slowly turn to rock", ["it washes away", "it turns to gold"], "Millions of years of layers."),
                 q("Why are most fossils of shells, bones and teeth?", "\U0001F9B4", "hard parts last; soft parts rot away", ["they are pretty", "they are big"], "The card said so."),
                 q("Where would you look for fossils?", "\U0001F3D6️", "cliffs and beaches where rock splits open", ["in a field of grass", "up a tree"], "The sea splits the rock. Go with a grown-up, and never stand under a cliff."),
                 q("What does a palaeontologist study?", "\U0001F469\U0001F3FE‍\U0001F52C", "fossils", ["stars", "plants"], "Fossil scientists."),
                 q("Why recycle a glass bottle?", "♻️", "less sand has to be dug up to make new glass", ["glass cannot be recycled", "to make it heavier"], "Taking less from the Earth."),
                 q("Plastic is made in a factory. Why do we say it comes from rock?", "\U0001F9F4", "it is made from oil, and oil is pumped out of rock", ["plastic grows on trees", "factories are made of rock"], "Follow it back: plastic, then oil, then rock deep underground."),
                 q("Why is a fossil of a jellyfish very rare?", "\U0001F30A", "a jellyfish has no hard parts, and soft parts rot away", ["jellyfish never lived in the sea", "jellyfish are too big to be fossils"], "Hard parts last. A jellyfish is soft all through."),
                 q("If nobody recycled metal cans, what would happen?", "\u267B\uFE0F", "more rock would be dug up to make new metal", ["metal would grow on trees", "old cans would turn back into rock"], "Metal comes from rock. Recycling means less digging."),
                 q("Is a fossil the actual animal?", "\U0001F41A", "No. It is a shape left in rock.", ["Yes, it is the animal turned to stone", "Yes, it is the animal's skin"],
                   "Press a shell into clay and lift it out: the shape you see is not the shell. A fossil is a print of part of the animal."),
                 q("Yusuf heard that some fossils were faked, so he says they all are. Is he right?", "\U0001F994", "No. A few fakes were made; there are many thousands of real ones.", ["Yes, all fossils are fake", "Yes, unless a museum made them"],
                   "Real fossils in museums all over the world are how we know what used to live here."),
             ],
              "support": [
                 q("Where does rock come from?", "\U0001FAA8", "the Earth", ["a factory"],
                   "Rock is dug out of the ground."),
                 q("Is a fossil older than you?", "\U0001F995", "Yes, far older", ["No"],
                   "Fossils are millions of years old."),
                 q("Did the animal in a fossil live before there were any people?", "\U0001F50D", "Yes", ["No"],
                   "Millions of years before. Fossils are far older than anything human."),
                 q("Does recycling mean less rock has to be dug up?", "\u267B\uFE0F", "Yes", ["No"],
                   "Using a material again means taking less out of the ground."),
              ],
              "extension": [
                 q("A fossil of a sea creature is found on top of a mountain. How?", "\U0001F41A", "that rock was once under the sea, and the land has risen since", ["somebody carried it up there", "the creature climbed the mountain"],
                   "Rock carries the story of where it formed. Mountains are pushed up over millions of years, fossils and all."),
                 q("Two fossils are found, one in a deep rock layer and one near the surface. Which animal lived first?", "\U0001F9F1", "the one in the deep layer", ["the one near the surface", "you cannot tell from the layers"],
                   "Layers pile up over time, so the deepest is the oldest. A fossil's layer tells you roughly when it lived."),
                 q("A fossil shell is found in the rock of a quarry, far inland. What does that tell you about the place?", "\U0001F41A", "it was under the sea when that rock was forming", ["somebody carried the shell there", "shells grow inside rocks"],
                   "The rock records where it formed. That is how the sea is known to have covered the land."),
                 q("Why can a palaeontologist say which of two fossils is older without knowing either date?", "\U0001FAA8", "the deeper layer was laid down first, so what is in it is older", ["the bigger fossil is always older", "they cannot say without a date"],
                   "Layers pile up in order. The order is the evidence, even with no numbers attached."),
              ]},
             "That is the whole lesson finished. You know where every material began.",
             mis=["4.4-m2", "4.4-m3"]),
    ],
}

LESSON["about"] = [
    "Say that every material we use comes from planet Earth.",
    "Say where metal, glass, oil, gas and plastic come from.",
    "Say what a fossil is and how one forms.",
    "Find answers about fossils in a fact card.",
]

LESSON["warmup"] = [
    q("Two north poles meet. What do they do?", "\U0001F9F2", "push apart", ["pull together", "nothing at all"], "Like poles repel."),
    q("Where did the wood in a wooden chair come from?", "\U0001FA91", "a tree", ["a rock", "the sea"], "Wood grew as part of a tree. It was once alive."),
    q("Which surface gives more friction, ice or carpet?", "\U0001F9F6", "carpet", ["ice"],
      "Rough carpet rubs far more than smooth ice."),
    q("What do we call an animal in a food chain?", "\U0001F98A", "a consumer", ["a producer", "a plant"],
      "It has to eat other living things, so it is a consumer."),
]

LESSON["lecture"] = [
    part("\U0001F30D", "Only one planet",
         "Every single material we use comes from planet Earth. There is nowhere else to get it. Wood and wool come from living things. But metal, glass, oil and gas come from rocks."),
    part("\U0001F944", "Out of the rocks",
         "Metal is found inside rocks called ores. The rock is dug up and heated, and the metal is separated out. Glass is melted sand, and sand is tiny bits of rock. Bricks are baked clay, a soft rock."),
    part("\U0001F6E2️", "Oil and gas",
         "Oil and natural gas are trapped deep in rocks underground. Oil is pumped up and made into petrol, and into plastic. So even a plastic bottle began in the Earth."),
    part("\U0001F41F", "A fossil",
         "A fish dies and sinks into the mud. Layer after layer of mud piles on top for millions of years and turns to rock, with the fish's shape pressed inside. One day the rock splits open. That shape is a fossil."),
    part("⛏️", "Taking carefully",
         "Digging quarries and mines and pumping oil all change the Earth. Science helps us see the harm and do less of it: recycling metal and glass means less digging. Today you will look it all up."),
]

# The unit lecture film (tools/create-ehel-unit-lecture.js; storyboard and
# pictures in lecture-video/rocks-and-fossils.json). The lecture step draws it
# above the parts; build-lessons.py refuses a path that is not on disk AND in
# app.config.json :: extraPages, and a --draft render.
LESSON["video"] = {
    "src": "lecture-video/rocks-and-fossils.c277e5c7.mp4",
    "captions": "lecture-video/rocks-and-fossils.eab3f309.vtt",
    "poster": "lecture-video/rocks-and-fossils.b577200b.jpg",
    "note": "About two and a half minutes. Watch it through, then go back over it a part at a time below.",
}

LESSON["words"] = [
    word("material", "\U0001F9F1", "What a thing is made of.",
         ["Metal is a material.", "Every material comes from the Earth."]),
    word("ore", "\U0001FAA8", "A rock that has metal inside it.",
         ["Iron is separated out of its ore.", "Miners dig up ore."]),
    word("oil", "\U0001F6E2️", "A dark liquid found deep in rocks, used to make petrol and plastic.",
         ["Oil is pumped from underground.", "Plastic is made from oil."]),
    word("natural gas", "\U0001F525", "A gas trapped in rocks underground, piped to houses for cooking and heating.",
         ["Natural gas can heat water.", "Natural gas comes from rocks."]),
    word("fossil", "\U0001F41F", "The shape or remains of something once alive, kept in rock for a very long time.",
         ["We found a fossil of a shell.", "A fossil forms over millions of years."]),
    word("palaeontologist", "\U0001F469\U0001F3FE‍\U0001F52C", "A scientist who studies fossils.",
         ["A palaeontologist found a dinosaur bone.", "Palaeontologists use brushes and small hammers."]),
    word("recycle", "♻️", "To make something used into something new, so less has to be taken from the Earth.",
         ["We recycle cans and glass.", "Recycling means less digging."]),
    word("impression", "\U0001F41A", "A shape pressed into something and left behind.",
         ["A fossil is an impression of a living thing.", "Press a shell into clay and it leaves an impression."]),
    word("layer", "\U0001F9F1", "An amount of material covering a surface, with more on top of it.",
         ["The rock is made of layers.", "The deepest layer is the oldest."]),
    word("petrol", "\u26FD", "A liquid fuel made from oil. Cars burn it.",
         ["Petrol comes from oil.", "Oil is taken out of the ground and made into petrol."]),
]

LESSON["cando"] = [
    cando("I can name the source of all the materials we use.", "3ESp.01"),
    cando("I can say where oil, natural gas and metal are found.", "3ESp.01"),
    cando("I can explain that a fossil is an impression, or the remains, of something once alive.", "3ESp.02"),
    cando("I can look an answer up in a book or on a fact card.", "3TWSc.05"),
    cando("I can sort materials by where they come from.", "3TWSc.01"),
    cando("I can say what the risks are and how to stay safe.", "3TWSp.04"),
    cando("I can talk about how taking materials out of the Earth affects the world.", "3SIC.04"),
]

LESSON["home"] = [
    home("Where did it come from?", "Paper and a pencil, one room of your house",
         ["Pick ten things.",
          "For each one, say the material and where it began. Write it in one of two lists: from rocks, or from living things.",
          "Draw an arrow from each thing back to the Earth."],
         "Every arrow ends at the Earth. Which list is longer: from rocks or from living things?"),
    home("Make a fossil", "Play dough or clay, a shell or a leaf, a plate",
         ["Flatten the clay on the plate.",
          "Press the shell or leaf into it firmly, then lift it out.",
          "Leave the clay to go hard for a day."],
         "The shape stays in the hard clay. That is how a real fossil keeps a shape in rock."),
    home("Recycling count", "The rubbish or recycling at home or at school, a grown-up",
         ["With a grown-up, look at what is in the rubbish or recycling for one day.",
          "Sort it into metal, glass, paper and plastic. A grown-up handles the glass and the cans, which can have sharp edges.",
          "For each pile, say what it came from in the Earth. Wash your hands afterwards."],
         "Metal from ore, glass from sand, plastic from oil, paper from trees. All going round again."),
]
