# -*- coding: utf-8 -*-
"""Lesson 4 - Natural or Made?

0097 Stage 2: 2Cm.01 natural and manufactured materials; 2Cp.01 a property
is a characteristic and a material has more than one; 2Cp.02 why a material
is chosen for a purpose; 2Cp.03 materials can be tested for their properties;
with 2TWSc.01, 2TWSc.02, 2TWSc.06 and 2SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "natural-or-made",
    "title": "Natural or Made?",
    "blurb": "Sort materials that come from nature from ones people make, test materials to find their properties, and work out why the right material was chosen for each job.",
    "steps": [
        step("explore", "Where does it come from?", "\U0001F333", "Natural or made", ["2Cm.01"],
             "Some materials come straight from nature. Others are <b>manufactured</b>: made by people. Tap each one.",
             explain(
                 ["A natural material is found in nature: it grows, or it is dug up.", "A manufactured material is made by people in a factory, usually out of natural ones."],
                 ["Wood grows on trees: natural.", "Wool grows on sheep: natural.", "Stone is dug from the ground: natural.",
                  "Plastic is made in a factory from oil: manufactured.", "Glass is made by melting sand: manufactured."],
                 ["Children think anything in a shop is manufactured.", "A wooden spoon in a shop is still made of a natural material. Ask where the material came from."],
                 ["Tap every card and say natural or manufactured."]),
             {"items": [
                 {"pic": "\U0001FAB5", "label": "wood", "sub": "natural", "say": "Wood grows on trees. Natural."},
                 {"pic": "\U0001F411", "label": "wool", "sub": "natural", "say": "Wool grows on a sheep and is cut off and spun. Natural."},
                 {"pic": "\U0001FAA8", "label": "stone", "sub": "natural", "say": "Stone is dug out of the ground. Natural."},
                 {"pic": "\U0001F9F4", "label": "plastic", "sub": "manufactured", "say": "Plastic is made in a factory, from oil. Manufactured."},
                 {"pic": "\U0001FA9F", "label": "glass", "sub": "manufactured", "say": "Glass is made by melting sand very hot. Manufactured, from a natural material."},
                 {"pic": "\U0001F9F5", "label": "cotton", "sub": "natural", "say": "Cotton is the fluffy seed hair of a plant. Natural."},
                 {"pic": "\U0001F9F1", "label": "brick", "sub": "manufactured", "say": "A brick is clay shaped and baked hard in a kiln. Manufactured."},
                 {"pic": "\U0001F4C4", "label": "paper", "sub": "manufactured", "say": "Paper is made in a factory by mashing wood into pulp. Manufactured, from wood."},
             ], "need": 8},
             "Natural materials grow or are dug up. Manufactured ones are made by people."),

        step("sort", "Natural, or manufactured?", "\U0001F5C2️", "Sorted it", ["2Cm.01", "2TWSc.01"],
             "Does this material come from nature, or did people make it? Tap the right bin.",
             explain(
                 ["Ask one question: could you find this material in nature, without a factory?"],
                 ["Sand on a beach: yes, natural.", "A plastic bag: no, manufactured.", "Leather from a cow's skin: natural.", "Rubber from a tree: natural, though tyres are manufactured from it."],
                 ["Children mix up the object and the material.", "A glass jar is an object; glass, the material, is manufactured from sand."],
                 ["Look at the material, decide where it came from, then tap."]),
             {"ask": "Natural, or manufactured?",
              "bins": [{"id": "nat", "label": "Natural", "pic": "\U0001F333"}, {"id": "man", "label": "Manufactured", "pic": "\U0001F3ED"}],
              "items": [
                  {"pic": "\U0001F3D6️", "label": "sand", "bin": "nat", "why": "Sand is tiny bits of rock. Natural."},
                  {"pic": "\U0001F6CD️", "label": "plastic bag", "bin": "man", "why": "Plastic is made in a factory from oil."},
                  {"pic": "\U0001F45E", "label": "leather", "bin": "nat", "why": "Leather is animal skin. Natural."},
                  {"pic": "\U0001F95B", "label": "glass", "bin": "man", "why": "Glass is made by melting sand. Manufactured."},
                  {"pic": "\U0001F9F6", "label": "wool", "bin": "nat", "why": "Wool grows on sheep. Natural."},
                  {"pic": "\U0001F9F1", "label": "brick", "bin": "man", "why": "Clay baked in a kiln by people. Manufactured."},
                  {"pic": "\U0001FAB5", "label": "wood", "bin": "nat", "why": "Wood grows on trees. Natural."},
                  {"pic": "\U0001F4C4", "label": "paper", "bin": "man", "why": "Made in a factory from wood pulp. Manufactured."},
                  {"pic": "\U0001F944", "label": "steel", "bin": "man", "why": "Steel is made by heating iron rock in a furnace. Manufactured."},
                  {"pic": "\U0001F331", "label": "cotton", "bin": "nat", "why": "Cotton grows on a plant. Natural."},
              ]},
             "Natural or manufactured: you can tell by asking where it came from."),

        step("tester", "Test the materials", "\U0001F52C", "Material tester", ["2Cp.01", "2Cp.03", "2TWSc.02"],
             "A <b>property</b> is what a material is like. Every material has several. Press each test on at least <b>four</b> materials.",
             explain(
                 ["A property is a characteristic of a material: hard, bendy, waterproof, see-through, strong.", "One material has lots of properties at once, and you can test for each one."],
                 ["Choose glass.", "Press it: hard.", "Bend it: stiff. Another word for stiff is rigid.", "Hold it up: see-through. Another word for see-through is transparent.", "Pour water: waterproof.", "Four properties, one material.",
                  "Now choose wool and see how different its answers are.", "Wool bends easily. Another word for bendy is flexible."],
                 ["Children think one test tells you everything.", "Each test finds one property. A material has many."],
                 ["Test four materials with all four tests."]),
             {"need": 4,
              "tests": [
                  {"id": "press", "label": "Press it", "pic": "\U0001F447", "anim": "scale(1.15, 0.7)", "sound": "thud", "say": "Press the %m. It is %r."},
                  {"id": "bend", "label": "Bend it", "pic": "↩️", "anim": "rotate(-25deg) skewX(18deg)", "sound": "boing", "say": "Try to bend the %m. It is %r."},
                  {"id": "light", "label": "Hold it to the light", "pic": "\U0001F526", "anim": "scale(1.25)", "sound": "click", "say": "Hold the %m up to the light. It is %r."},
                  {"id": "water", "label": "Pour water on it", "pic": "\U0001F4A7", "anim": "translateY(8px)", "sound": "splash", "say": "Pour water on the %m. It is %r."},
              ],
              "materials": [
                  {"id": "glass", "pic": "\U0001F95B", "label": "glass", "props": {"press": "hard", "bend": "stiff", "light": "see-through", "water": "waterproof"}, "animates": {"bend": False}},
                  {"id": "wool", "pic": "\U0001F9F6", "label": "wool", "props": {"press": "soft", "bend": "bendy", "light": "not see-through", "water": "soaks up water"}},
                  {"id": "wood", "pic": "\U0001FAB5", "label": "wood", "props": {"press": "hard", "bend": "stiff", "light": "not see-through", "water": "soaks it up slowly"}, "animates": {"bend": False}},
                  {"id": "plastic", "pic": "\U0001F9F4", "label": "thin plastic", "props": {"press": "soft", "bend": "bendy", "light": "see-through", "water": "waterproof"}},
                  {"id": "metal", "pic": "\U0001F944", "label": "metal", "props": {"press": "hard", "bend": "stiff", "light": "not see-through", "water": "waterproof"}, "animates": {"bend": False}},
                  {"id": "sponge", "pic": "\U0001F9FD", "label": "sponge", "props": {"press": "soft", "bend": "bendy", "light": "not see-through", "water": "soaks up water"}},
              ]},
             "Every material has several properties, and each test finds one of them."),

        step("record", "Record: is it waterproof?", "\U0001F4DD", "Recorded it", ["2TWSc.06", "2Cp.03"],
             "Put your water test into the table. Was <b>%s</b> waterproof?",
             explain(
                 ["A results table holds one property for every material, so you can compare them."],
                 ["Glass: waterproof.", "Wool: soaked up the water.", "Metal: waterproof.", "Sponge: soaked it up."],
                 [],
                 ["Fill in each row from what the test showed."]),
             {"ask": "Was %s waterproof?",
              "columns": ["Material", "Waterproof?"],
              "rows": [
                  {"pic": "\U0001F95B", "label": "glass", "answer": "yes", "why": "the water ran off the glass."},
                  {"pic": "\U0001F9F6", "label": "wool", "answer": "no", "why": "the wool soaked the water up."},
                  {"pic": "\U0001F944", "label": "metal", "answer": "yes", "why": "the water ran off the metal."},
                  {"pic": "\U0001F9FD", "label": "sponge", "answer": "no", "why": "the sponge soaked the water up."},
                  {"pic": "\U0001F9F4", "label": "thin plastic", "answer": "yes", "why": "the water ran off the plastic."},
              ],
              "choices": [{"id": "yes", "t": "Yes, waterproof", "pic": "☔"}, {"id": "no", "t": "No, it soaks it up", "pic": "\U0001F4A7"}]},
             "Your table compares five materials on one property."),

        step("questions", "The right material for the job", "\U0001F3E0", "Right material", ["2Cp.02", "2Cp.01"],
             "Why was this material chosen? Tap the property that made it the right one.",
             explain(
                 ["People choose a material for a job because of its properties.", "A property is what a material is like, and one material has several properties at once."],
                 ["A window is glass because glass is see-through.", "A saucepan is metal because metal is hard and does not burn.",
                  "A jumper is wool because wool is soft and warm.", "A raincoat is plastic because plastic is waterproof."],
                 ["Children answer with the object's name instead of a property.", "The question is why: which property does the job?"],
                 ["Think about what the object has to do, then tap the property."]),
             {"label": "Question", "items": [
                 q("Why is a window made of glass?", "\U0001FA9F", "glass is see-through", ["glass is soft", "glass is warm", "glass soaks up water"], "A window has to let light through and let you see out."),
                 q("Why is a saucepan made of metal?", "\U0001F373", "metal is hard and does not burn", ["metal is soft", "metal is see-through", "metal is bendy"], "A saucepan sits on a hot cooker; metal does not burn or melt there."),
                 q("Why is a jumper made of wool?", "\U0001F9F6", "wool is soft and warm", ["wool is hard", "wool is see-through", "wool is waterproof"], "A jumper has to be soft on your skin and keep you warm."),
                 q("Why are wellington boots made of rubber?", "\U0001F462", "rubber is waterproof", ["rubber is see-through", "rubber soaks up water", "rubber is hard and stiff"], "Boots for puddles have to keep your feet dry."),
                 q("Why is a towel made of cotton?", icon("towel"), "cotton soaks up water", ["cotton is waterproof", "cotton is hard", "cotton is see-through"], "A towel has to soak the water off you."),
                 q("Why is a bicycle frame made of metal?", "\U0001F6B2", "metal is strong and stiff", ["metal is soft", "metal soaks up water", "metal is bendy"], "A bicycle has to hold a person up without bending."),
                 q("Would a sponge make a good window?", "\U0001F9FD", "No. A sponge is not see-through", ["Yes, it is soft", "Yes, it soaks up rain"], "A window needs to be see-through, and a sponge is not."),
                 q("Glass is hard, see-through and waterproof. What are those three words?", "\U0001FA9F", "three properties of one material", ["three kinds of glass", "three names for a window"], "Each word says what glass is like. One material can have many properties."),
                 q("Which of these words is a property of a material?", "❓", "bendy", ["spoon", "factory"], "A property says what a material is like. Bendy is a property; a spoon is an object and a factory is a place."),
             ]},
             "A material is chosen for its properties."),

        step("context", "The science in everyday things", "\U0001F527", "How it works", ["2SIC.02", "2Cp.02"],
             "Science explains why everyday objects are made the way they are. Tap each one.",
             explain(
                 ["Every object around you was made of a material somebody chose on purpose."],
                 ["A kettle is metal on the outside because metal is strong, and the handle is plastic because plastic does not carry the heat to your hand.",
                  "A tyre is rubber because rubber grips and bends.", "A pencil is wood around a soft grey core, because wood is easy to sharpen."],
                 [],
                 ["Tap each object and hear which property does which job."]),
             {"items": [
                 {"pic": icon("kettle"), "label": "kettle", "say": "The body is metal, which is strong and does not melt. The handle is plastic, because plastic does not carry the heat to your hand."},
                 {"pic": "\U0001F6B2", "label": "bicycle tyre", "say": "A tyre is rubber. Rubber bends over bumps and grips the road."},
                 {"pic": "✏️", "label": "pencil", "say": "A pencil is wood around a soft grey core. Wood is easy to sharpen and light to hold."},
                 {"pic": "\U0001FA9F", "label": "window", "say": "Glass is see-through, hard and waterproof. Light comes in and the rain stays out."},
             ], "need": 4,
              "then": {"ask": "Why is a kettle's handle plastic when its body is metal?",
                       "opts": [opt("Plastic does not carry the heat to your hand", True), opt("Plastic is see-through", False), opt("Plastic is heavier", False)],
                       "why": "Metal carries heat; plastic does not, so the handle stays cool."}},
             "Science explains why things are made the way they are."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Cm.01", "2Cp.01", "2Cp.02", "2Cp.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Natural grows or is dug up; manufactured is made by people.", "A property is what a material is like, and a material has several.", "Materials are chosen for their properties."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which material is natural?", "\U0001F333", "wood", ["plastic", "glass", "brick"], "Wood grows on trees."),
                 q("Which material is manufactured?", "\U0001F3ED", "plastic", ["wool", "stone", "cotton"], "Plastic is made in a factory from oil."),
                 q("What is a property?", "❓", "what a material is like, such as hard or bendy", ["the name of an object", "a kind of factory", "a colour only"], "A property is a characteristic of a material."),
                 q("How many properties can one material have?", "\U0001F52C", "several at once", ["only one", "none"], "Glass is hard, stiff, see-through and waterproof all at once."),
                 q("How do we find out if a material is waterproof?", "\U0001F4A7", "test it: pour water on it and watch", ["guess from its colour", "ask the material"], "Materials can be tested for their properties."),
                 q("Why is a raincoat made of plastic?", "\U0001F9E5", "plastic is waterproof", ["plastic is soft and warm", "plastic soaks up water"], "A raincoat's job is to keep the rain off."),
                 q("Glass is made by melting...", "\U0001FA9F", "sand", ["wood", "wool", "water"], "Sand melted very hot becomes glass: a manufactured material from a natural one."),
                 q("Which is the best material for a towel?", icon("towel"), "cotton, because it soaks up water", ["glass, because it is see-through", "metal, because it is hard"], "A towel has to soak water up."),
                 q("What would happen if a raincoat were made of wool?", "\U0001F9E5", "the wool would soak up the rain and you would get wet", ["you would stay dry", "the rain would bounce off"], "Wool soaks up water. A raincoat needs a waterproof material, like plastic."),
             ]},
             "That is the whole lesson finished. You know your materials and why they are chosen."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Tell a natural material from a manufactured one.",
    "Test materials to find their properties.",
    "Record which materials are waterproof in a table.",
    "Say why the right material was chosen for a job.",
]

LESSON["warmup"] = [
    q("Where does wood come from?", "\U0001F333", "trees", ["a factory", "the sea"], "Wood grows on trees. It is a natural material."),
    q("Which of these can you see through?", "❓", "a glass window", ["a brick wall", "a wooden door"], "Light goes through glass, so you can see through it."),
]

LESSON["lecture"] = [
    part("\U0001FAB5", "Natural materials",
         "Wood comes from trees. Wool comes from sheep. Stone is dug out of the ground. A natural material grows or is dug up. People do not make it."),
    part("\U0001F3ED", "Manufactured materials",
         "Plastic, glass, brick and paper are made by people, in factories. Glass is made by melting sand. Paper is made from mashed-up wood. These are manufactured."),
    part("\U0001F50D", "Testing for properties",
         "Is it hard? Does it bend? Does water go through it? Can you see through it? Each test finds one property. A material has several."),
    part("\U0001F4A7", "Waterproof or not",
         "Drip water on glass and it runs off. Drip it on wool and it soaks in. Glass is waterproof. Wool is not. You will record that in a table."),
    part(icon("kettle"), "Chosen for the job",
         "A kettle is metal because metal does not melt when it gets hot. A tyre is rubber because rubber grips and bends. Every material is chosen for its properties."),
]

LESSON["words"] = [
    word("natural", "\U0001FAB5", "Comes from nature: it grows, or is dug from the ground.",
         ["Wood is a natural material.", "Wool is natural. It comes from sheep."]),
    word("manufactured", "\U0001F3ED", "Made by people, usually in a factory.",
         ["Plastic is manufactured.", "Glass is manufactured from sand."]),
    word("property", "\U0001F50D", "Something a material is like: hard, bendy, shiny, waterproof.",
         ["Being waterproof is a property of glass.", "Test to find each property."]),
    word("waterproof", "\u2614", "Water does not go through it.",
         ["Plastic is waterproof.", "A sponge is not waterproof."]),
    word("transparent", "\U0001FA9F", "You can see through it.",
         ["Glass is transparent.", "A window must be transparent."]),
    word("flexible", "\U0001F9F6", "Bends easily without breaking.",
         ["Wool is flexible.", "A rubber tyre is flexible."]),
    word("rigid", "\U0001F9F1", "Stiff. Does not bend.",
         ["Brick is rigid.", "A rigid ruler draws a straight line."]),
]

LESSON["home"] = [
    home("Natural or manufactured hunt", "Paper and a pencil, your house",
         ["Find ten things and ask: did this grow, get dug up, or get made in a factory?",
          "Draw two lists.",
          "Find one thing made of a natural material and a manufactured one, like a wooden table with a plastic top."],
         "Most things are manufactured. Which natural ones did you find?"),
    home("Drip test", "A tray, water, small pieces of paper, fabric, plastic, foil, cardboard, a leaf",
         ["Lay each piece on the tray.",
          "Drip water on each one and wait a minute.",
          "Write a table: material, and waterproof yes or no."],
         "Which soaked it up, and which let it run off?"),
    home("Why this material?", "A kitchen, a grown-up",
         ["Pick five things: a pan, a cup, a spoon, a chopping board, a cloth.",
          "Say what each is made of.",
          "Say one property that makes it right for the job."],
         "The pan is metal because it does not melt. What about the cloth?"),
]
