# -*- coding: utf-8 -*-
"""Lesson 4 - What Is It Made Of?

0097 Stage 1 Chemistry, all five: 1Cm.01 common materials; 1Cm.02 object
versus material; 1Cp.01 materials have a variety of properties (the
tester, and "Describe it", whose last two questions ask for a second and
third property of one material); 1Cp.02
describe materials by their properties; 1Cc.01 changing materials by
stretching, compressing, bending and twisting; with 1TWSc.01, 1TWSc.02,
1TWSc.04, 1TWSc.05, 1TWSp.02, 1TWSa.01 and 1SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "what-is-it-made-of",
    "title": "What Is It Made Of?",
    "blurb": "Find out what everyday objects are made from, test materials to see how they behave, and squash, bend, twist and stretch them.",
    "steps": [
        step("explore", "What is it made of?", "\U0001F944", "Materials", ["1Cm.01"],
             "Tap each object. Hear what <b>material</b> it is made from.",
             explain(
                 ["Everything around you is made from a material.", "Wood, metal, plastic, glass, rock, paper and fabric are seven materials you see every day."],
                 ["Tap the spoon.", "It is made of metal.", "Tap the chair.", "It is made of wood, which comes from trees.",
                  "Tap the window.", "It is made of glass, so you can see through it."],
                 ["Children say the spoon is made of spoon.", "Spoon is what it is. Metal is what it is made of."],
                 ["Tap every object and say the material out loud."]),
             {"items": [
                 {"pic": "\U0001F944", "label": "spoon", "sub": "metal", "say": "A spoon is made of metal. Metal is hard and shiny."},
                 {"pic": "\U0001FA91", "label": "chair", "sub": "wood", "say": "A chair is made of wood. Wood comes from trees."},
                 {"pic": "\U0001F9F4", "label": "bottle", "sub": "plastic", "say": "A bottle is made of plastic. Plastic is light and does not break easily."},
                 {"pic": "\U0001FA9F", "label": "window", "sub": "glass", "say": "A window is made of glass. Glass is hard and you can see through it."},
                 {"pic": "\U0001FAA8", "label": "stone wall", "sub": "rock", "say": "A wall can be made of rock. Rock is very hard and heavy."},
                 {"pic": "\U0001F4D6", "label": "book", "sub": "paper", "say": "A book is made of paper. Paper is thin and it tears."},
                 {"pic": "\U0001F455", "label": "T-shirt", "sub": "fabric", "say": "A T-shirt is made of fabric. Fabric is soft and bendy."},
                 {"pic": "\U0001F511", "label": "key", "sub": "metal", "say": "A key is made of metal, like the spoon."},
             ], "need": 8},
             "Wood, metal, plastic, glass, rock, paper and fabric. Seven materials."),

        step("demo", "Object or material?", "\U0001F3F7️", "Object vs material", ["1Cm.02"],
             "An <b>object</b> is a thing. A <b>material</b> is what it is made from. Press <b>Next</b>.",
             explain(
                 ["An object is a thing you can point at: a spoon, a door, a cup.", "A material is what the thing is made from: metal, wood, plastic."],
                 ["A spoon is an object.", "It is made of metal, so metal is the material.",
                  "A door is an object.", "It is made of wood, so wood is the material.",
                  "One material can make many objects: wood makes doors, chairs, tables and pencils."],
                 ["Children think metal is an object because you can touch it.", "You touch a metal spoon. Metal is the material the spoon is made of."],
                 ["Press Next and say object or material each time."]),
             {"frames": [
                 {"pic": "\U0001F944", "cap": "A spoon is an <b>object</b>. You can pick it up.", "say": "A spoon is an object. You can pick it up and point at it."},
                 {"pic": "\U0001F944⚙️", "cap": "It is made of <b>metal</b>. Metal is the <b>material</b>.", "say": "The spoon is made of metal. Metal is the material."},
                 {"pic": "\U0001F6AA", "cap": "A door is an <b>object</b>. It is made of <b>wood</b>.", "say": "A door is an object. It is made of wood. Wood is the material."},
                 {"pic": "\U0001FA91✏️\U0001F6AA", "cap": "One material makes many objects: wood makes chairs, pencils and doors.", "say": "One material can make many objects. Wood makes chairs, pencils and doors."},
                 {"pic": "\U0001F9F4\U0001F95B\U0001F9F8", "cap": "And one object can use many materials: a toy has plastic, fabric and metal.", "say": "And one object can be made of several materials. A toy can have plastic, fabric and metal in it."},
             ]},
             "Object is the thing. Material is what it is made of."),

        step("sort", "Object, or material?", "\U0001F5C2️", "Sorted it", ["1Cm.02", "1TWSc.01"],
             "Is this an <b>object</b>, or a <b>material</b>? Tap the right bin.",
             explain(
                 ["A thing you can name and pick up is an object.", "What it is made from is a material."],
                 ["Cup: an object.", "Glass: a material.", "Shoe: an object.", "Fabric: a material."],
                 ["Children put wood in Objects because they picture a stick.", "A stick is the object. Wood is what it is made of."],
                 ["Ask: is this a thing, or what a thing is made from?"]),
             {"ask": "Object, or material?",
              "bins": [{"id": "obj", "label": "Object", "pic": "\U0001F9F8"}, {"id": "mat", "label": "Material", "pic": "\U0001FAB5"}],
              "items": [
                  {"pic": "☕", "label": "cup", "bin": "obj", "why": "A cup is a thing. It is an object."},
                  {"pic": "⚙️", "label": "metal", "bin": "mat", "why": "Metal is what spoons and keys are made of. A material."},
                  {"pic": "\U0001F45F", "label": "shoe", "bin": "obj", "why": "A shoe is a thing you can wear. An object."},
                  {"pic": "\U0001FAB5", "label": "wood", "bin": "mat", "why": "Wood is what chairs and doors are made of. A material."},
                  {"pic": "\U0001F511", "label": "key", "bin": "obj", "why": "A key is a thing. An object."},
                  {"pic": "\U0001F9F5", "label": "fabric", "bin": "mat", "why": "Fabric is what clothes are made of. A material."},
                  {"pic": "\U0001FA9F", "label": "glass (what windows are made of)", "bin": "mat", "why": "Glass is what windows are made of. A material."},
                  {"pic": "\U0001F4D6", "label": "book", "bin": "obj", "why": "A book is a thing. An object made of paper."},
              ]},
             "Objects are things. Materials are what they are made of."),

        step("sort", "Sort by material", "\U0001F9F1", "Material sorter", ["1Cm.01", "1TWSc.01"],
             "Which material is this object made from? Tap the right bin.",
             explain(
                 ["Sorting by material means putting together everything made of the same stuff."],
                 ["A pencil and a chair look different, but both are wood.", "A coin and a nail are both metal.",
                  "Look at the object and ask: what is it made from?"],
                 ["Children sort by colour or by what the thing is for.", "Here we sort only by material."],
                 ["Look, decide the material, then tap its bin."]),
             {"ask": "What material is it made from?",
              "bins": [{"id": "wood", "label": "Wood", "pic": "\U0001FAB5"}, {"id": "metal", "label": "Metal", "pic": "⚙️"},
                       {"id": "plastic", "label": "Plastic", "pic": "\U0001F9F4"}, {"id": "glass", "label": "Glass", "pic": "\U0001FA9F"},
                       {"id": "paper", "label": "Paper", "pic": "\U0001F4C4"}, {"id": "fabric", "label": "Fabric", "pic": "\U0001F9F5"}],
              "items": [
                  {"pic": "✏️", "label": "pencil", "bin": "wood", "why": "A pencil is made of wood, with a grey stick inside that writes."},
                  {"pic": "\U0001FA99", "label": "coin", "bin": "metal", "why": "A coin is made of metal."},
                  {"pic": "\U0001F9F4", "label": "shampoo bottle", "bin": "plastic", "why": "A shampoo bottle is made of plastic."},
                  {"pic": "\U0001F95B", "label": "drinking glass", "bin": "glass", "why": "A drinking glass is made of glass. You can see through it."},
                  {"pic": "\U0001F4F0", "label": "newspaper", "bin": "paper", "why": "A newspaper is made of paper."},
                  {"pic": "\U0001F9E3", "label": "scarf", "bin": "fabric", "why": "A scarf is made of fabric."},
                  {"pic": "\U0001FA91", "label": "chair", "bin": "wood", "why": "A wooden chair is made of wood."},
                  {"pic": "\U0001F529", "label": "nut and bolt", "bin": "metal", "why": "A nut and bolt are made of metal."},
                  {"pic": "\U0001FAA5", "label": "toothbrush", "bin": "plastic", "why": "Most toothbrushes are made of plastic."},
                  {"pic": "\U0001F9E6", "label": "socks", "bin": "fabric", "why": "Socks are made of fabric."},
              ]},
             "Every object is made from one material or more."),

        step("tester", "Test the materials", "\U0001F52C", "Material tester", ["1Cp.01", "1Cp.02", "1TWSc.02"],
             "Choose a material, then press each test. Test at least <b>three</b> materials fully.",
             explain(
                 ["A property is something a material is like: hard or soft, bendy or stiff, shiny or dull, waterproof or not.",
                  "Every material has lots of properties at once."],
                 ["Choose the sponge.", "Press it: soft.", "Bend it: bendy.", "Look at it: dull.", "Pour water: it soaks it up.",
                  "Now choose the metal spoon and do the same four tests.", "Hard, stiff, shiny, waterproof. Very different!"],
                 ["Children think hard things are always strong.", "Glass is hard but it breaks. Hard and strong are two different properties."],
                 ["Test three materials with all four tests and watch the badges appear."]),
             {"need": 3,
              "tests": [
                  {"id": "press", "label": "Press it", "pic": "\U0001F447", "anim": "scale(1.15, 0.7)", "sound": "thud",
                   "say": "Press the %m. It is %r."},
                  {"id": "bend", "label": "Bend it", "pic": "↩️", "anim": "rotate(-25deg) skewX(18deg)", "sound": "boing",
                   "say": "Try to bend the %m. It is %r."},
                  {"id": "look", "label": "Look closely", "pic": "\U0001F50D", "anim": "scale(1.3)", "sound": "click",
                   "say": "Look closely at the %m. It is %r."},
                  {"id": "water", "label": "Pour water on it", "pic": "\U0001F4A7", "anim": "translateY(8px)", "sound": "splash",
                   "say": "Pour water on the %m. It %r."},
              ],
              "materials": [
                  {"id": "sponge", "pic": "\U0001F9FD", "label": "sponge", "props": {"press": "soft", "bend": "bendy", "look": "dull", "water": "soaks up water"}},
                  {"id": "spoon", "pic": "\U0001F944", "label": "metal spoon", "props": {"press": "hard", "bend": "stiff", "look": "shiny", "water": "is waterproof"}, "animates": {"bend": False}},
                  {"id": "wood", "pic": "\U0001FAB5", "label": "wood block", "props": {"press": "hard", "bend": "stiff", "look": "dull", "water": "soaks up a little water"}, "animates": {"bend": False}},
                  {"id": "cloth", "pic": "\U0001F9E3", "label": "cotton scarf", "props": {"press": "soft", "bend": "bendy", "look": "dull", "water": "soaks up water"}},
                  {"id": "glass", "pic": "\U0001F95B", "label": "glass", "props": {"press": "hard", "bend": "stiff", "look": "shiny", "water": "is waterproof"}, "animates": {"bend": False}},
                  {"id": "cup", "pic": "\U0001F964", "label": "plastic cup", "props": {"press": "hard", "bend": "stiff", "look": "shiny", "water": "is waterproof"}, "animates": {"bend": False}},
              ]},
             "Every material has its own properties. You tested them."),

        step("questions", "Describe it", "\U0001F5E3️", "Describe it", ["1Cp.02", "1Cp.01"],
             "Which word describes the material? Tap it.",
             explain(
                 ["Now you know the words, you can describe any material: hard, soft, rough, smooth, bendy, stiff, shiny, dull.", "And one material has many properties at once: a metal spoon is hard, shiny and waterproof."],
                 ["A pillow is soft.", "A stone is hard.", "Sandpaper is rough.", "Glass is smooth."],
                 ["Children mix up soft and smooth.", "Soft means it squashes. Smooth means it has no bumps. A marble is smooth but hard."],
                 ["Picture the material, feel it in your mind, then tap the word."]),
             {"label": "Question", "items": [
                 q("A pillow feels...", "\U0001F6CF️", "soft", ["hard", "rough", "stiff"], "A pillow presses in easily. That is soft."),
                 q("A stone feels...", "\U0001FAA8", "hard", ["soft", "bendy", "fluffy"], "A stone does not press in. That is hard."),
                 q("Sandpaper feels...", "\U0001F9F1", "rough", ["smooth", "soft", "shiny"], "Sandpaper is bumpy to touch. That is rough."),
                 q("A glass window is...", "\U0001FA9F", "smooth and see-through", ["rough and bendy", "soft and furry"], "Glass is smooth, and you can see through it."),
                 q("An elastic band is...", "➰", "bendy and stretchy", ["stiff", "hard", "rough"], "An elastic band bends and stretches."),
                 q("A metal spoon is...", "\U0001F944", "hard and shiny", ["soft and dull", "bendy and rough"], "Metal is hard and shiny."),
                 q("A wooden ruler is...", "\U0001F4CF", "stiff", ["stretchy", "soft", "runny"], "Wood keeps its shape. It is stiff."),
                 q("A metal spoon is hard. What else is it?", "\U0001F944", "shiny and waterproof too", ["soft", "stretchy"], "One material has many properties at once. A metal spoon is hard, shiny, stiff and waterproof, all at the same time."),
                 q("A sponge is soft. What else is it?", "\U0001F9FD", "bendy, and it soaks up water", ["hard", "shiny and stiff"], "One material has many properties at once. A sponge is soft, bendy and dull, and it soaks up water."),
             ]},
             "You can describe materials with science words."),

        step("experiment", "Squash, bend, twist, stretch", "\U0001F9EA", "Shape changer", ["1Cc.01", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Can we change a material's shape with our hands? Predict first, then try clay, an elastic band and a stone.",
             explain(
                 ["You can change some materials by squashing, bending, twisting or stretching them.", "Other materials will not change at all."],
                 ["Predict: will the stone change shape when you squash it?", "Then try two actions on the clay, two on the elastic band, and two on the stone, and watch."],
                 ["Children think everything changes if you push hard enough.", "A stone stays a stone however hard you squash it."],
                 ["Tap your prediction, then press the action buttons and watch what each material does."]),
             {"sim": "shapeChange",
              "predict": {"ask": "What do you think will happen when you squash the <b>stone</b>?",
                          "opts": [opt("Nothing. The stone will keep its shape", True), opt("It will squash flat like clay", False), opt("It will stretch", False)]},
              "runAsk": "Press two actions on each material. Watch what changes and what does not.",
              "happened": {"ask": "What happened when you squashed the stone?",
                           "opts": [opt("Nothing. It kept its shape", True), opt("It squashed flat", False), opt("It stretched long", False)],
                           "why": "Clay and the elastic band changed shape. The stone did not change at all."}},
             "Some materials change shape when you push them. Some do not."),

        step("record", "Did it change shape?", "\U0001F4DD", "Recorded it", ["1TWSc.05", "1Cc.01"],
             "Record what happened. Did <b>%s</b> change shape when you pushed, pulled or twisted it?",
             explain(
                 ["A results table says what happened to each material, in one tidy place."],
                 ["The clay squashed and bent: yes, it changed.", "The elastic band stretched and twisted: yes.", "The stone did nothing: no."],
                 [],
                 ["Fill in each row from what you saw."]),
             {"ask": "Did %s change shape?",
              "columns": ["Material", "Changed shape?"],
              "rows": [
                  {"pic": "\U0001F7E4", "label": "the clay", "answer": "yes", "why": "the clay squashed and bent into new shapes."},
                  {"pic": "➰", "label": "the elastic band", "answer": "yes", "why": "the elastic band stretched and twisted."},
                  {"pic": "\U0001FAA8", "label": "the stone", "answer": "no", "why": "the stone kept its shape whatever you did."},
              ],
              "choices": [{"id": "yes", "t": "Yes, it changed", "pic": "✅"}, {"id": "no", "t": "No, it stayed the same", "pic": "❌"}]},
             "Your results table is complete."),

        step("context", "The right material for the job", "\U0001F3E0", "Right material", ["1SIC.02", "1Cp.02"],
             "Why is a window made of glass and a raincoat of plastic? Tap each one.",
             explain(
                 ["People choose a material because of its properties.", "That is science, used every day."],
                 ["A window is glass because glass is see-through and hard.", "A raincoat is plastic because plastic is waterproof.",
                  "A pillow is fabric because fabric is soft.", "A spoon is metal because metal is hard and does not soak up soup."],
                 ["Children ask why not make a raincoat from paper.", "Paper soaks up water. Try it and you would get wet."],
                 ["Tap each object and hear which property made it the right choice."]),
             {"items": [
                 {"pic": "\U0001FA9F", "label": "glass window", "say": "A window is made of glass because glass is see-through and hard. Light comes in and the rain stays out."},
                 {"pic": "\U0001F9E5", "label": "plastic raincoat", "say": "A raincoat is plastic because plastic is waterproof. Water runs off it."},
                 {"pic": "\U0001F6CF️", "label": "fabric pillow", "say": "A pillow is fabric because fabric is soft. A rock pillow would hurt."},
                 {"pic": "\U0001F944", "label": "metal spoon", "say": "A spoon is metal because metal is hard, smooth and does not soak up the soup."},
             ], "need": 4,
              "then": {"ask": "Why would a paper raincoat be a bad idea?",
                       "opts": [opt("Paper soaks up water, so you would get wet", True), opt("Paper is too shiny", False), opt("Paper is too heavy", False)],
                       "why": "Paper is not waterproof. Plastic is, which is why raincoats are plastic."}},
             "The right material has the right properties for the job."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Cm.01", "1Cm.02", "1Cp.02", "1Cc.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["If it asks what a thing is made of, picture the object.", "If it asks for a describing word, feel the material in your mind."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A metal spoon. Which word is the <b>material</b>?", "\U0001F944", "metal", ["spoon", "shiny", "soup"], "Metal is what the spoon is made of. Spoon is the object."),
                 q("What is a wooden chair made from?", "\U0001FA91", "wood", ["glass", "paper", "metal"], "Wood comes from trees and makes chairs, doors and pencils."),
                 q("Which material can you see through?", "\U0001FA9F", "glass", ["wood", "fabric", "rock"], "Glass is see-through, which is why windows are made of it."),
                 q("Which of these feels rough?", "\U0001F9F1", "sandpaper", ["a glass window", "a silk scarf", "a marble"], "Sandpaper is bumpy to touch. That is rough; the others are smooth."),
                 q("Which of these is bendy?", "➰", "an elastic band", ["a stone", "a drinking glass", "a brick"], "An elastic band bends and stretches."),
                 q("You squash a ball of clay. What happens?", "\U0001F7E4", "it changes shape", ["nothing", "it turns to glass", "it gets harder"], "Clay changes shape when you squash it."),
                 q("You squash a stone as hard as you can. What happens?", "\U0001FAA8", "nothing, it keeps its shape", ["it goes flat", "it stretches"], "You tried it. A stone keeps its shape."),
                 q("Which is the best material for a raincoat?", "\U0001F9E5", "plastic, because it is waterproof", ["paper, because it is thin", "sponge, because it is soft"], "A raincoat needs to be waterproof. Plastic is."),
                 q("Why would a sponge be a bad material for a cup?", "\U0001F9FD", "It soaks up water, so the drink would leak out", ["It is too heavy to lift", "It is too shiny"], "A cup has to hold a drink. A sponge soaks up water, so it cannot hold one."),
             ]},
             "That is the whole lesson finished. You know your materials."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say what everyday objects are made of.",
    "Tell an object from a material.",
    "Test a material and describe it with science words.",
    "Say why a material was chosen for a job.",
]

LESSON["warmup"] = [
    q("What is a window made of?", "\U0001FA9F", "glass", ["paper", "wool"], "Windows are made of glass, so you can see through them."),
    q("Which of these is soft?", "\U0001F9F8", "a teddy bear", ["a stone", "a metal spoon"], "A teddy bear squashes when you press it. It is soft."),
]

LESSON["lecture"] = [
    part("\U0001F944", "Object and material",
         "A spoon is an object. It is made of metal. Metal is the material. A chair is an object. It is made of wood. Wood is the material. The object is the thing; the material is what it is made of."),
    part("\U0001F9F1", "Seven materials",
         "Wood, metal, plastic, glass, rock, paper and fabric. Look around the room. Almost everything you see is made of one of these seven."),
    part("\U0001F50D", "Testing materials",
         "Scientists test materials. Press it: is it hard or soft? Bend it: does it bend or break? Wet it: does the water go through? Each test tells you a property."),
    part("\U0001F9F6", "Squash, bend, twist, stretch",
         "Push on clay and it squashes. Pull an elastic band and it stretches. Push on a stone and nothing happens. Some materials change shape, some do not."),
    part("\U0001FA9F", "The right material for the job",
         "A window is glass because you can see through it. A raincoat is plastic because water runs off it. The right material has the right properties for the job."),
]

LESSON["words"] = [
    word("material", "\U0001F9F1", "What a thing is made of, like wood, metal or glass.",
         ["Wood is a material.", "What material is a window made of?"]),
    word("object", "\U0001F944", "A thing you can see and touch.",
         ["A spoon is an object.", "Every object is made of a material."]),
    word("metal", "\U0001F529", "A hard, shiny material that feels cold to touch.",
         ["A key is made of metal.", "Metal spoons are strong."]),
    word("plastic", "\U0001F9F4", "A light material that people make. It can be soft or hard.",
         ["A bottle can be plastic.", "Plastic does not let water through."]),
    word("hard", "\U0001FAA8", "Does not press in when you push it.",
         ["A stone is hard.", "Wood is hard, but a sponge is soft."]),
    word("waterproof", "\u2614", "Water does not go through it.",
         ["A raincoat is waterproof.", "Paper is not waterproof. It goes soggy."]),
    word("property", "\U0001F50D", "Something a material is like: hard, soft, bendy, shiny, waterproof.",
         ["Being shiny is a property of metal.", "Each test finds one property."]),
]

LESSON["home"] = [
    home("Material hunt", "Paper and a pencil, your house",
         ["Find something made of wood, metal, plastic, glass, paper and fabric.",
          "Draw each one and write its material.",
          "Find one object made of two materials."],
         "An object can have more than one material. A pencil is wood and something else."),
    home("The waterproof test", "A tray, a cup of water, small pieces of paper, fabric, plastic, foil, a leaf",
         ["Lay each piece on the tray.",
          "Drip a little water on each one.",
          "Wait a minute and lift each piece up."],
         "Which pieces let the water through, and which kept it out."),
    home("Squash it, bend it", "Play dough, an elastic band, a stone, a sponge",
         ["Squash each thing. Then bend it. Then stretch it. Stretch the elastic band gently, away from your face.",
          "Say what happened to each one.",
          "Put them in two piles: changed shape, did not change shape."],
         "Does the sponge go back to its shape? Does the play dough?"),
]
