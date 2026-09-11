# -*- coding: utf-8 -*-
"""Lesson 11 - Inside the Earth.

0097 Stage 4: 4ESp.01 the model of the Earth's structure: crust, mantle,
core; 4ESp.02 the features of volcanoes, found at breaks in the crust;
4ESp.03 the crust moves, and sudden moves are earthquakes; 4TWSm.01 a
model is not the whole truth; 4TWSm.02 a model showing scale; with
4TWSc.07 and 4SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home

LAYERS = [
    {"id": "crust", "label": "crust", "say": "The crust: the thin, hard, rocky outside. We live on it. It is thinner, compared with the Earth, than the skin on an apple."},
    {"id": "mantle", "label": "mantle", "say": "The mantle: a very thick layer of hot, solid rock under the crust. It is so hot that it can flow, very slowly, like very thick putty."},
    {"id": "core", "label": "core", "say": "The core: the centre of the Earth. Metal, and about as hot as the surface of the Sun. Its outer part is liquid metal; its inner part is solid."},
]

LESSON = {
    "slug": "inside-the-earth",
    "title": "Inside the Earth",
    "blurb": "Cut the Earth open to find the crust, the mantle and the core, watch a volcano erupt at a break in the crust, feel the crust slip in an earthquake, and say what an Earth model shows and what it cannot.",
    "steps": [
        step("label", "Crust, mantle, core", "\U0001F30D", "Earth layers", ["4ESp.01"],
             "Scientists model the inside of the Earth as three layers. Tap the <b>%s</b>.",
             explain(
                 ["Nobody has ever dug more than a few kilometres down. The three layers are a model, built from evidence like earthquake waves."],
                 ["The crust: thin, hard rock, where we live.", "The mantle: thick, hot, solid rock that can flow very slowly.", "The core: metal, unbelievably hot, at the centre."],
                 ["Children think the Earth is rock all the way through.", "The centre is metal, and most of the inside is hot enough to glow."],
                 ["Listen for the layer, then tap it."]),
             {"figure": "earthLayers", "ask": "Tap the %s.", "parts": LAYERS},
             "Crust, mantle, core: the model of the inside of the Earth."),

        step("demo", "A volcano", "\U0001F30B", "Volcano", ["4ESp.02", "4ESp.01"],
             "Press <b>Next</b> to see a volcano form where the crust is broken.",
             explain(
                 ["A volcano forms at a break in the crust, where hot melted rock from below can get through.", "Melted rock underground is magma. Once it comes out, it is lava."],
                 ["Magma under the crust.", "A crack: the magma rises.", "It erupts: lava, ash and gas.", "The lava cools into new rock, and the mountain grows."],
                 ["Children think volcanoes can happen anywhere.", "Only at breaks in the crust. That is why they come in lines."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"scene": {"id": "volcano", "state": 0}, "cap": "Deep under the crust, rock is so hot it melts: <b>magma</b>.", "say": "Under the crust the rock is so hot that in places it melts. Melted rock underground is called magma."},
                 {"scene": {"id": "volcano", "state": 1}, "cap": "Where the crust is <b>broken</b>, the magma pushes up through the crack.", "say": "Where the crust is broken, the magma pushes up through the crack. Volcanoes are found at breaks in the crust."},
                 {"scene": {"id": "volcano", "state": 2}, "cap": "It <b>erupts</b>: red-hot <b>lava</b>, clouds of ash, and gas.", "say": "It erupts. Red-hot lava pours out, ash and gas shoot into the sky. Lava is magma that has reached the surface."},
                 {"scene": {"id": "volcano", "state": 3}, "cap": "The lava cools into <b>new rock</b>. Eruption by eruption, the mountain grows.", "say": "The lava cools and hardens into new rock. Each eruption adds a layer, and the volcano grows into a mountain with a hole, the crater, at the top."},
             ]},
             "A volcano: magma from below, through a break in the crust, erupting as lava."),

        step("demo", "An earthquake", "\U0001F3DA️", "Earthquake", ["4ESp.03", "4ESp.01"],
             "The crust is not one piece. Press <b>Next</b> to see what happens when pieces move suddenly.",
             explain(
                 ["The crust is broken into huge pieces, called plates, which move very slowly over the hot mantle.", "Where two plates push against each other they stick, until they slip suddenly. That is an earthquake."],
                 ["Two plates, side by side.", "They push and stick.", "They slip: the ground shakes.", "A crack is left where they moved."],
                 ["Children think earthquakes come from underground explosions.", "It is rock slipping past rock, suddenly."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"scene": {"id": "quake", "state": 0}, "cap": "The crust is made of huge pieces called <b>plates</b>, resting on the hot mantle.", "say": "The crust is not one shell. It is broken into huge pieces called plates, which rest on the hot mantle below, which flows very slowly."},
                 {"scene": {"id": "quake", "state": 1}, "cap": "The plates <b>move</b>, very slowly, about as fast as your fingernails grow. Where they push together, they stick.", "say": "The plates move all the time, about as fast as your fingernails grow. Where two push against each other, their edges catch and stick."},
                 {"scene": {"id": "quake", "state": 2}, "cap": "The push builds up until they <b>slip suddenly</b>: an <b>earthquake</b>. The ground shakes.", "say": "The push builds up for years. Then the edges slip, all at once. That sudden move is an earthquake, and the ground shakes."},
                 {"scene": {"id": "quake", "state": 3}, "cap": "A crack is left where the crust moved. Earthquakes, like volcanoes, happen at the <b>breaks</b> in the crust.", "say": "Afterwards a crack is left where the crust moved. Earthquakes happen where the plates meet: the breaks in the crust, the same places as volcanoes."},
             ]},
             "The crust moves. A sudden move is an earthquake."),

        step("lookup", "Look it up: volcano features", "\U0001F4DA", "Volcano facts", ["4TWSc.07", "4ESp.02"],
             "Read the fact card, then answer from it.",
             explain(
                 ["A fact card is a secondary source."],
                 ["Read the whole card first.", "Find each answer in it."],
                 [],
                 ["Read, then tap."]),
             {"source": {"title": "The parts of a volcano",
                         "lines": ["Under the volcano is a <b>magma chamber</b>: a pocket of melted rock.",
                                   "A <b>vent</b> is the pipe the magma rises through. The opening at the top is the <b>crater</b>.",
                                   "Lava that pours out is between 700 and 1,200 degrees Celsius. It cools into rock, and layer on layer of it builds the volcano's <b>cone</b> shape.",
                                   "An eruption also throws out <b>ash</b>, tiny bits of rock that can fall like grey snow many kilometres away, and <b>gas</b>.",
                                   "Most of the world's volcanoes lie in a line round the Pacific Ocean called the <b>Ring of Fire</b>, along the edges of the plates."]},
              "items": [
                  {"ask": "What is the pocket of melted rock under a volcano called?", "opts": [opt("the magma chamber", True), opt("the crater", False), opt("the cone", False)], "why": "The card says magma chamber."},
                  {"ask": "What is the opening at the top of a volcano?", "opts": [opt("the crater", True), opt("the vent", False), opt("the mantle", False)], "why": "The vent is the pipe; the crater is the opening at the top."},
                  {"ask": "What gives a volcano its cone shape?", "opts": [opt("layer on layer of cooled lava", True), opt("wind", False), opt("rain", False)], "why": "The card says cooled lava builds the cone."},
                  {"ask": "Where are most of the world's volcanoes?", "opts": [opt("in a ring round the Pacific Ocean, along the plate edges", True), opt("at the North Pole", False), opt("spread evenly everywhere", False)], "why": "The Ring of Fire, along the breaks in the crust."},
              ]},
             "Magma chamber, vent, crater, cone, ash. You found every answer."),

        step("explore", "A model of the Earth to scale", "\U0001F34E", "Scale model", ["4TWSm.02", "4TWSm.01", "4ESp.01"],
             "How thick is the crust, really? Tap each one to see the Earth at the scale of an apple.",
             explain(
                 ["A model can show scale: how big things are compared with each other.", "At the scale of an apple, the Earth's crust is thinner than the apple's skin."],
                 ["Apple skin: the crust.", "The flesh: the mantle.", "The core in the middle: the core, though the apple's is far too small.", "And a model always leaves things out: the real mantle is hot enough to glow."],
                 ["Children draw the crust as thick as the mantle.", "It is a skin. The mantle makes up most of the Earth."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F34E", "label": "the skin", "sub": "the crust", "say": "If the Earth were an apple, the crust would be thinner than the skin. That is how thin the rock we live on is, compared with the whole planet."},
                 {"pic": "\U0001F7E1", "label": "the flesh", "sub": "the mantle", "say": "The flesh of the apple is the mantle: most of the Earth, thick and hot."},
                 {"pic": "\U0001F7E4", "label": "the core in the middle", "sub": "the core, too small", "say": "The apple's core in the middle stands for the Earth's core. But the apple gets its size wrong. The Earth's real core is huge: it reaches more than halfway from the centre to the surface. The apple's core is far too small."},
                 {"pic": "\U0001F4D0", "label": "what the model leaves out", "sub": "size of the core, heat, metal", "say": "The apple shows how thin the crust is. It gets the core far too small, and it leaves out the heat, the slow flowing of the mantle, and that the core is metal. No model shows everything, and this one is not meant to."},
             ], "need": 4,
              "then": {"ask": "What does the apple model show well?",
                       "opts": [opt("How thin the crust is, compared with the whole Earth", True), opt("How hot the inside of the Earth is", False), opt("How big the Earth's core is", False)],
                       "why": "A model shows some things and leaves out others. The apple shows the thin crust well, and gets the core far too small."}},
             "A thin crust, a thick mantle, a core in the middle. A model that shows some scale well, and its limits."),

        step("context", "How we found out", "\U0001F4DC", "Earth evidence", ["4SIC.01", "4ESp.01", "4ESp.03"],
             "Nobody has ever seen the mantle or the core. Tap each one to see how the evidence built the model.",
             explain(
                 ["Scientific knowledge changes as evidence comes in from enquiry."],
                 ["Long ago, people thought the Earth was solid rock, or hollow.", "Earthquake waves travel differently through liquid and solid. They show that the mantle is solid and that the outer part of the core is liquid.", "The Earth is far too heavy to be rock all the way through, and some rocks from space, called meteorites, are made of iron. That is how we know the core is metal.", "Volcanoes bring up rock from below.", "The idea that continents move was laughed at until the evidence piled up."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F5FF", "label": "old ideas", "say": "Long ago some people believed the Earth was solid rock all the way through, and some believed it was hollow. Nobody could check."},
                 {"pic": "\U0001F4E1", "label": "earthquake waves", "say": "Earthquakes send waves right through the Earth. Some kinds of wave can only travel through solids. They pass through the mantle, so the mantle is solid. But they cannot get through the outer part of the core, so that part must be liquid. Listening to the waves mapped the layers."},
                 {"pic": "☄️", "label": "weight and meteorites", "say": "Scientists worked out how heavy the whole Earth is. It is much too heavy to be rock all the way through, so the middle must be something heavier: metal. And meteorites, rocks from space left over from when the planets formed, are sometimes made of iron. That is how we know the core is metal."},
                 {"pic": "\U0001F30B", "label": "volcano rock", "say": "Volcanoes bring rock up from deep below. Studying it tells us what the mantle is made of."},
                 {"pic": "\U0001F5FA️", "label": "moving continents", "say": "A hundred years ago a scientist said the continents move. Most scientists laughed. Then the evidence piled up: matching rocks and fossils on both sides of the ocean, and the moving plates were measured. Knowledge changed."},
             ], "need": 5,
              "then": {"ask": "How do we know there is a metal core, if nobody has seen it?",
                       "opts": [opt("The Earth is too heavy to be rock all through, and some meteorites are made of iron", True), opt("Somebody dug down to the core and looked", False), opt("We do not know at all; it is only a guess", False)],
                       "why": "Evidence from enquiry, not a look. That is how the model was built."}},
             "Evidence from enquiry built the model of the Earth, and changed what people thought."),

        step("questions", "Earth check", "✅", "Earth check", ["4ESp.01", "4ESp.02", "4ESp.03"],
             "Tap the answer.",
             explain(
                 ["Three layers, volcanoes, earthquakes."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which layer do we live on?", "\U0001F30D", "the crust", ["the mantle", "the core"], "The thin outer layer."),
                 q("Which layer is at the centre?", "\U0001F525", "the core", ["the crust", "the mantle"], "Metal, and very hot."),
                 q("Where do volcanoes form?", "\U0001F30B", "at breaks in the crust", ["anywhere at all", "only at the poles"], "Where magma can get through."),
                 q("What is lava?", "\U0001F30B", "melted rock that has reached the surface", ["cold rock deep under the ground", "a kind of very hot water"], "Magma, once it is out."),
                 q("What is an earthquake?", "\U0001F3DA️", "a sudden movement of the crust", ["an underground explosion", "a big volcano"], "Plates slipping."),
             ]},
             "You know what is under your feet."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4ESp.01", "4ESp.02", "4ESp.03", "4TWSm.02", "4SIC.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Name the three layers, outside to inside.", "\U0001F30D", "crust, mantle, core", ["core, mantle, crust", "crust, core, mantle"], "Outside in."),
                 q("Which layer makes up most of the Earth?", "\U0001F30D", "the mantle", ["the crust", "the core"], "Most of the inside is mantle."),
                 q("Melted rock underground is called...", "\U0001F30B", "magma", ["lava", "ash"], "Magma below, lava above."),
                 q("What is a crater?", "\U0001F573️", "the opening at the top of a volcano", ["the pipe the magma rises through", "the pocket of magma underground"], "From the fact card."),
                 q("The crust is made of huge pieces called...", "\U0001F3DA️", "plates", ["cores", "craters"], "They move slowly."),
                 q("How fast do the plates move?", "\U0001F5FA️", "about as fast as your fingernails grow", ["about as fast as a car on a road", "they do not move at all"], "Slowly, all the time."),
                 q("In the apple model, what is the skin?", "\U0001F34E", "the crust", ["the mantle", "the core"], "Thin, like the crust."),
                 q("What do earthquake waves tell us about the inside of the Earth?", "\U0001F4E1", "the mantle is solid, and part of the core is liquid", ["the Earth is hollow in the middle", "the crust is the thickest layer"], "Some waves only travel through solids. They pass through the mantle but not the outer core."),
                 q("Why are earthquakes and volcanoes often found in the same places?", "\U0001F914", "both happen at breaks in the crust, where plates meet", ["every earthquake is caused by a volcano", "those places are closest to the Sun"], "Plates meeting make the breaks in the crust, and both happen there."),
                 q("Why is an apple a good model of the Earth's layers?", "\U0001F34E", "its thin skin, thick flesh and core are like the crust, mantle and core", ["an apple is round and red like the Earth", "an apple has lava inside it"], "The model shows the idea of the layers. It leaves the rest out."),
                 q("Why does a volcano get taller after each eruption?", "\U0001F30B", "the lava cools into new rock and adds a layer", ["the crust under it grows", "the magma pushes the top up for ever"], "Layer on layer of cooled lava builds the mountain."),
             ]},
             "That is the whole lesson finished. You know the inside of the Earth."),
    ],
}

LESSON["about"] = [
    "Describe the model of the Earth: crust, mantle and core.",
    "Say how a volcano forms and where volcanoes are found.",
    "Say what an earthquake is.",
    "Use a model to show scale, and say what it leaves out.",
]

LESSON["warmup"] = [
    q("You put a metal key in the gap of a circuit. What does the lamp do?", "\U0001F511", "it lights: metal conducts", ["it stays off", "it melts"], "From the last lesson: metals are conductors."),
    q("What do you find if you dig deep down under the soil?", "⛏️", "rock", ["only water", "only air"], "Dig deep enough anywhere and you reach solid rock."),
]

LESSON["lecture"] = [
    part("\U0001F30D", "Three layers",
         "Scientists model the Earth as three layers. The crust: a thin shell of hard rock, where we live. The mantle: a very thick layer of hot, solid rock that can flow very slowly. The core: metal at the centre, about as hot as the surface of the Sun."),
    part("\U0001F30B", "Volcanoes",
         "Where the crust is broken, melted rock from below, magma, can push up through the crack. It erupts as lava, ash and gas. The lava cools into new rock, and eruption by eruption a mountain grows. Volcanoes are found at breaks in the crust."),
    part("\U0001F3DA️", "Earthquakes",
         "The crust is broken into huge plates that creep along on the mantle, as fast as your fingernails grow. Where two plates push together they stick, and the push builds up. Then they slip, all at once. That sudden move is an earthquake."),
    part("\U0001F34E", "A model to scale",
         "If the Earth were an apple, the crust would be thinner than the skin, the flesh would be the mantle, and the core in the middle would be the core. The model shows how thin the crust is. It gets the core far too small, and it leaves out the heat and the metal."),
    part("\U0001F4E1", "How we know",
         "Nobody has seen the mantle or the core. The model was built from evidence: earthquake waves that show a solid mantle and a liquid outer core, the Earth's great weight and metal meteorites that tell us the core is metal, rock that volcanoes bring up, continents that fit together. Evidence from enquiry changed what people knew."),
]

LESSON["words"] = [
    word("crust", "\U0001F30D", "The thin, hard outer layer of the Earth that we live on.",
         ["Volcanoes form at breaks in the crust.", "The crust is thinner than an apple's skin, to scale."]),
    word("mantle", "\U0001F7E1", "The thick layer of hot rock under the crust.",
         ["The mantle is most of the inside of the Earth.", "The plates move slowly over the mantle."]),
    word("core", "\U0001F525", "The metal centre of the Earth.",
         ["The core is about as hot as the surface of the Sun.", "The Earth is so heavy that its core must be metal."]),
    word("magma", "\U0001F30B", "Melted rock underground.",
         ["Magma rises through a crack in the crust.", "A magma chamber lies under the volcano."]),
    word("lava", "\U0001F30B", "Melted rock that has come out onto the surface.",
         ["Lava pours from the crater.", "Lava cools into new rock."]),
    word("plate", "\U0001F3DA️", "One of the huge pieces the crust is broken into.",
         ["The plates move very slowly.", "Earthquakes happen where plates meet."]),
    word("earthquake", "\U0001F3DA️", "A sudden movement of the crust that shakes the ground.",
         ["An earthquake cracked the road.", "Plates slipping cause an earthquake."]),
]

LESSON["home"] = [
    home("The apple Earth", "An apple, a knife, a grown-up",
         ["A grown-up cuts the apple in half.",
          "Find the skin, the flesh and the core.",
          "Say which layer of the Earth each one stands for, and one thing the apple gets wrong."],
         "The skin is thinner than you thought. So is the crust."),
    home("Kitchen volcano", "Bicarbonate of soda, vinegar, a small bottle, a tray, red food colouring, goggles or sunglasses, a grown-up",
         ["Goggles on. Stand the bottle on the tray and put two spoons of bicarbonate in it.",
          "Add a drop of colouring, then pour in the vinegar slowly.",
          "Stand back and watch it erupt. Look from the side, never from straight above."],
         "The fizz pushing up the bottle neck is like magma pushing up a vent. A model, with limits."),
    home("Earthquake table", "Two books, a table",
         ["Put the two books side by side on the table, edges touching.",
          "Press them together and slide them past each other slowly.",
          "Feel them catch and then jerk."],
         "The jerk is the earthquake. The books are the plates."),
]
