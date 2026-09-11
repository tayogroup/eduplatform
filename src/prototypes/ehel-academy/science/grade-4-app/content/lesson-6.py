# -*- coding: utf-8 -*-
"""Lesson 6 - Particles.

0097 Stage 4: 4Cm.01 the particle model for solids and liquids; 4Cm.02
materials, substances and particles; 4Cm.03 particles are always moving,
even in a solid; 4Cp.01 the particle model explains the properties of solids
and liquids; 4Cp.02 powders can behave like liquids; 4TWSm.01 a model is
not the whole truth; with 4TWSp.03, 4TWSa.01 and 4TWSa.03.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "particles",
    "title": "Particles",
    "blurb": "Meet the particle model, heat a solid until its particles break out of their rows, find out why sand pours like a liquid, and say what a model shows and what it leaves out.",
    "steps": [
        step("demo", "Everything is made of particles", "\U0001F7E2", "Particle model", ["4Cm.01", "4Cm.03"],
             "Scientists explain solids and liquids with a model. Press <b>Next</b>.",
             explain(
                 ["Everything is made of particles: bits far too small to see.", "In a solid they are packed in rows and vibrate on the spot. In a liquid they stay touching but slide past each other."],
                 ["A solid keeps its shape because its particles hold their rows.", "A liquid flows because its particles slide.", "The particles never stop moving, even in ice."],
                 ["Children think particles in a solid are still.", "They vibrate all the time. Only a little, but always."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F9CA", "cap": "Everything is made of <b>particles</b>, far too small to see.", "say": "Everything, a spoon, water, air, you, is made of particles: bits so small that no eye can see them."},
                 {"pic": "\U0001F7E2", "cap": "In a <b>solid</b>, the particles are packed in rows and <b>vibrate</b> on the spot. That is why a solid keeps its shape.", "say": "In a solid the particles are packed tightly in rows. They cannot move about, but they vibrate, jiggling on the spot. Because they hold their rows, a solid keeps its shape."},
                 {"pic": "\U0001F4A7", "cap": "In a <b>liquid</b>, the particles still touch, but they <b>slide</b> past each other. That is why a liquid flows.", "say": "In a liquid the particles are still touching, but they are not in rows. They slide past each other. That is why a liquid flows and takes the shape of its container."},
                 {"pic": "\U0001F504", "cap": "The particles <b>never stop moving</b>, even in a block of ice.", "say": "The particles never stop moving. Even in a block of ice, they are vibrating. Heat them and they move faster. Cool them and they move less. But never nothing."},
             ]},
             "Particles: in rows and vibrating in a solid, sliding in a liquid, always moving."),

        step("experiment", "Heat the particles", "\U0001F525", "Melt and freeze", ["4Cp.01", "4Cm.03", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "A box of particles in a solid. Predict what heating will do.",
             explain(
                 ["Heat gives particles energy. More energy, more movement."],
                 ["A little heat: they vibrate harder but hold their rows.", "More heat: they break out of the rows and slide. The solid has melted.", "Cool it: they slow down and lock back into rows. Frozen."],
                 ["Children think melting makes new particles.", "Same particles. They just move differently."],
                 ["Predict, heat it twice, cool it, then conclude."]),
             {"sim": "particles",
              "predict": {"ask": "When the solid is heated enough, its particles will...",
                          "opts": [opt("break out of their rows and slide past each other", True), opt("stop moving", False), opt("disappear", False)]},
              "runAsk": "Press Heat it twice, watch the particles, then press Cool it.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("Heated, the particles vibrated harder, then broke out of their rows and slid: it melted. Cooled, they locked back into rows", True), opt("The particles stopped moving when heated", False), opt("New particles appeared", False)],
                           "why": "Heat is energy for the particles. Enough of it and they leave their rows: melting. Take it away and they return: freezing."},
              "conclude": {"ask": "Why does a liquid flow when a solid does not?",
                           "opts": [opt("In a liquid the particles slide past each other; in a solid they hold their rows", True), opt("Liquids have fewer particles", False), opt("Liquids are wet", False)],
                           "why": "The particle model explains it: sliding particles flow, particles in rows hold a shape."}},
             "Heat makes particles move more. Enough, and they leave their rows."),

        step("explore", "Material, substance, particle", "\U0001F9F1", "Three words", ["4Cm.02"],
             "Three words scientists keep apart. Tap each one.",
             explain(
                 ["A material is what a thing is made of. A substance is one pure kind of stuff. A particle is one of the tiny bits a substance is made of."],
                 ["Wood is a material: a tree's trunk is made of it, and it is a mix of many substances.", "Water is a substance: one kind of stuff, the same all the way through.", "A water particle is one tiny bit of water."],
                 ["Children use material and substance to mean the same thing.", "A material can be a mixture of substances. A substance is just one."],
                 ["Tap all three."]),
             {"items": [
                 {"pic": "\U0001F9F1", "label": "material", "sub": "what a thing is made of", "say": "A material is what an object is made of: wood, glass, plastic, fabric. Many materials are mixtures of several substances. Wood is."},
                 {"pic": "\U0001F4A7", "label": "substance", "sub": "one pure kind of stuff", "say": "A substance is one kind of stuff, the same all the way through: water, salt, iron, sugar. Pure."},
                 {"pic": "\U0001F7E2", "label": "particle", "sub": "a tiny bit of a substance", "say": "A particle is one of the tiny bits a substance is made of. A drop of water holds more water particles than there are people on Earth."},
             ], "need": 3,
              "then": {"ask": "Iron is one pure kind of stuff, the same all through. It is a...",
                       "opts": [opt("substance", True), opt("particle", False), opt("mixture", False)],
                       "why": "One pure kind of stuff is a substance. Its particles are the tiny bits it is made of."}},
             "Material, substance, particle: what it is made of, one pure stuff, the tiny bits."),

        step("demo", "Why sand pours", "\U0001F3D6️", "Powders", ["4Cp.02", "4Cp.01"],
             "Sand pours like a liquid, but it is a solid. Press <b>Next</b> to see why.",
             explain(
                 ["A powder is lots of tiny solid grains.", "Each grain is a solid: particles in rows. But the grains roll over each other, like the particles of a liquid do."],
                 ["Pour sand and it flows.", "Look at one grain: solid, keeps its shape.", "The grains slide past each other, not the particles inside them."],
                 ["Children call sand a liquid.", "Each grain keeps its shape. Sand is a solid that behaves like a liquid because its grains roll."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F3D6️", "cap": "Sand pours and takes the shape of its container, like a liquid.", "say": "Pour sand into a cup and it takes the cup's shape. Tip it out and it flows. It behaves like a liquid."},
                 {"pic": "\U0001F50D", "cap": "But one grain is a <b>solid</b>: it keeps its shape. Inside it, the particles are in rows.", "say": "Look at one grain through a lens. It is a tiny solid. It keeps its shape. Inside the grain, the particles are packed in rows, vibrating."},
                 {"pic": "\U0001F7E2", "cap": "The <b>grains</b> slide over each other, the way the particles of a liquid slide.", "say": "So what slides is not the particles. It is the grains. Millions of tiny solids rolling over each other, the way the particles of a liquid slide past each other."},
                 {"pic": "\U0001F9C2", "cap": "Salt, sugar, flour and sand are all <b>powders</b>: solids that pour.", "say": "Salt, sugar, flour and sand are all powders: solids made of tiny grains, which pour like liquids because the grains roll."},
             ]},
             "A powder is a solid that pours because its grains roll, not its particles."),

        step("explore", "What the model leaves out", "\U0001F4D0", "Model limits", ["4TWSm.01"],
             "The particle model is useful and it is not the whole truth. Tap each one.",
             explain(
                 ["A model shows an idea clearly by leaving things out. Knowing what it leaves out is part of using it."],
                 ["Particles are not coloured balls. The colour is for us.", "Particles are far, far smaller than the picture.", "Real particles come in many shapes and kinds; the picture shows one.", "The model shows a few dozen particles; one drop of water has more than you could count in a lifetime."],
                 ["Children think the model is a photograph.", "Nobody has a photograph. It is a picture of an idea that works."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F7E2", "label": "the colour", "sub": "not real", "say": "The particles are drawn green or blue so you can see them. Real particles have no colour of their own. The colour is for us."},
                 {"pic": "\U0001F50D", "label": "the size", "sub": "far too big", "say": "The picture draws each particle as big as a pea. Real ones are so small that millions fit in a grain of sand. The model makes them huge so you can see them."},
                 {"pic": "\U0001F52E", "label": "the shape", "sub": "all drawn the same", "say": "The model draws every particle as a ball. Real particles come in many kinds and shapes. The model shows one, to keep the idea clear."},
                 {"pic": "\U0001F522", "label": "the number", "sub": "far too few", "say": "The model shows forty particles. A single drop of water has more particles than you could count in a lifetime. The model shows enough to see the pattern."},
             ], "need": 4,
              "then": {"ask": "Why is the particle model still useful if it is not exactly true?",
                       "opts": [opt("It shows the idea clearly and explains what we see", True), opt("It is exactly true", False), opt("It is not useful", False)],
                       "why": "A model is judged by what it explains. This one explains melting, flowing and pouring."}},
             "A model shows the idea and leaves out the rest. Know what it leaves out."),

        step("questions", "Particle check", "✅", "Particle check", ["4Cm.01", "4Cm.02", "4Cm.03", "4Cp.01", "4Cp.02"],
             "Tap the answer.",
             explain(
                 ["The particle model, three words, and powders."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("In a solid, the particles are...", "\U0001F9CA", "packed in rows, vibrating on the spot", ["far apart and flying", "sliding past each other"], "Rows, and a jiggle."),
                 q("In a liquid, the particles are...", "\U0001F4A7", "touching, but sliding past each other", ["packed tightly in rows", "not moving at all"], "That is why it flows."),
                 q("Do the particles in ice move?", "\U0001F9CA", "yes, they vibrate all the time", ["no, they are frozen still", "only when it melts"], "Always moving."),
                 q("Water is one pure kind of stuff. It is a...", "\U0001F4A7", "substance", ["material", "particle"], "One pure stuff."),
                 q("Why does sand pour?", "\U0001F3D6️", "its solid grains roll over each other", ["it is a liquid", "its particles are liquid"], "Grains slide, not particles."),
             ]},
             "You know the particle model."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Cm.01", "4Cm.02", "4Cm.03", "4Cp.01", "4Cp.02", "4TWSm.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is everything made of?", "\U0001F7E2", "particles too small to see", ["tiny animals too small to see", "air and nothing else"], "Everything."),
                 q("Why does a solid keep its shape?", "\U0001F9CA", "its particles hold their rows", ["it is always cold", "it is always heavy"], "Rows hold a shape."),
                 q("What does heat do to particles?", "\U0001F525", "gives them energy so they move more", ["makes them stop moving at once", "makes brand new particles appear"], "More energy, more movement."),
                 q("What happens when a solid melts?", "\U0001F4A7", "its particles break out of their rows and slide", ["its particles vanish one by one", "new particles appear between the old ones"], "Same particles, new arrangement."),
                 q("Which is a material?", "\U0001F9F1", "wood", ["a water particle", "one tiny particle of salt"], "What a tree trunk is made of."),
                 q("Which is a substance?", "❓", "salt", ["a chair", "wood"], "One pure kind of stuff."),
                 q("Flour pours. Is flour a liquid?", "\U0001F33E", "no, it is a powder of tiny solid grains", ["yes, because it pours like water", "yes, but only when it is warm"], "Each grain is a solid, and the grains roll."),
                 q("What does the particle model get wrong on purpose?", "\U0001F4D0", "the size, colour and number of the particles", ["nothing, it is a photograph of them", "only the way the particles move"], "It leaves things out to show the idea."),
                 q("A bar of chocolate is put in a fridge. What happens to its particles?", "\U0001F914", "they move less, but they never stop", ["they stop moving completely", "they break out of their rows and slide"], "Cooling takes energy away, so the particles move less. They never stop moving, even in a solid."),
             ]},
             "That is the whole lesson finished. You know what everything is made of."),
    ],
}

LESSON["about"] = [
    "Describe the particle model for a solid and a liquid.",
    "Say that particles never stop moving, and what heat does to them.",
    "Tell a material from a substance from a particle.",
    "Say why a powder pours, and what the particle model leaves out.",
]

LESSON["warmup"] = [
    q("What is a habitat?", "\U0001F333", "the place where a living thing naturally lives", ["a kind of food", "a type of rock"], "From the last lesson."),
    q("Is ice a solid or a liquid?", "\U0001F9CA", "a solid", ["a liquid", "a gas"], "Ice keeps its shape: a solid."),
]

LESSON["lecture"] = [
    part("\U0001F7E2", "Particles",
         "Everything is made of particles: bits far too small for any eye to see. A spoon, water, the air, you. Scientists use a model, a picture of an idea, to show how those particles behave."),
    part("\U0001F9CA", "In a solid",
         "In a solid the particles are packed tightly in rows. They cannot move about, but they vibrate on the spot, all the time, even in a block of ice. Because they hold their rows, a solid keeps its shape."),
    part("\U0001F4A7", "In a liquid",
         "In a liquid the particles are still touching, but they have left their rows and slide past each other. That is why a liquid flows and takes the shape of its container. Heat a solid enough and this is what happens: it melts."),
    part("\U0001F3D6️", "Powders",
         "Sand pours like a liquid, but each grain is a tiny solid, particles in rows inside it. What slides is the grains, rolling over each other. Salt, sugar and flour are the same: powders, solids that pour."),
    part("\U0001F4D0", "A model, not a photograph",
         "The particle model draws particles as coloured balls the size of peas, a few dozen of them. Real particles have no colour, are millions of times smaller, and come in countless kinds. The model leaves that out on purpose, to show the idea."),
]

LESSON["words"] = [
    word("particle", "\U0001F7E2", "One of the tiny bits everything is made of, far too small to see.",
         ["Water is made of particles.", "The particles vibrate."]),
    word("model", "\U0001F4D0", "A picture or object that shows an idea clearly by leaving the rest out.",
         ["The particle model shows rows of balls.", "A model is not a photograph."]),
    word("vibrate", "\U0001F504", "To shake on the spot.",
         ["Particles in a solid vibrate.", "Heat makes them vibrate harder."]),
    word("substance", "\U0001F4A7", "One pure kind of stuff, the same all the way through.",
         ["Salt is a substance.", "Water is a substance."]),
    word("material", "\U0001F9F1", "What a thing is made of. It may be a mixture of substances.",
         ["Wood is a material.", "The chair's material is plastic."]),
    word("powder", "\U0001F9C2", "A solid made of tiny grains that pour like a liquid.",
         ["Flour is a powder.", "A powder pours because its grains roll."]),
    word("melt", "\U0001F525", "To change from a solid to a liquid when heated.",
         ["Ice melts into water.", "When it melts, the particles leave their rows."]),
]

LESSON["home"] = [
    home("Melt and freeze", "An ice cube, or a square of chocolate, a plate, a grown-up",
         ["Watch the ice cube melt on the plate, or leave the chocolate somewhere warm until it goes soft and runny. Say what the particles are doing.",
          "If you have a freezer, pour the water into a tray and freeze it. If not, put the runny chocolate somewhere cool until it sets hard again.",
          "Say what the particles did as it went solid again."],
         "Same particles all the way through. Only how they are arranged changed."),
    home("Powder or liquid?", "Sugar, flour, rice, salt, water, a spoon, a lens",
         ["Pour each one from a spoon. Which ones flow?",
          "Look at a pinch of each dry one through a lens.",
          "Say which are powders and why they pour."],
         "Grains you can see are solids. They roll. That is why the powder pours."),
    home("Make the model", "Dried peas or marbles, a small box or a tray",
         ["Pack the peas in tight rows in the box: a solid. Jiggle the box gently.",
          "Tip a few out so they can roll past each other: a liquid.",
          "Say what the model shows, and three things it gets wrong."],
         "Peas are not particles. They are the right size to see, which is the point of a model."),
]
