# -*- coding: utf-8 -*-
"""Lesson 8 - Mixtures.

0097 Stage 3: 3Cm.02 a mixture holds two or more materials that can be
physically separated; 3Cp.02 materials keep their properties in a mixture;
3Cp.03 separating solid/solid mixtures; 3Cp.04 separating an insoluble
solid from a liquid; 3Cc.01 a dissolved solid is still there; 3TWSp.04
risks and staying safe; with 3TWSc.04, 3TWSc.06, 3TWSa.03 and 3TWSc.01.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "mixtures",
    "title": "Mixtures",
    "blurb": "Mix sand and stones and see that each keeps its properties, separate three mixtures with a sieve, a magnet and a filter, find out where salt goes when it dissolves, and learn the safety rules for practical work.",
    "steps": [
        step("demo", "What a mixture is", "\U0001F963", "Mixtures", ["3Cm.02", "3Cp.02"],
             "Press <b>Next</b> to mix sand and stones, and look at what happens to each.",
             explain(
                 ["A mixture is two or more materials mixed together.", "Each one keeps its own properties, and that is what lets you get them apart again."],
                 ["Sand is fine and pours.", "Stones are big and hard.", "Mix them: the sand is still fine, the stones are still big.", "So a sieve can separate them."],
                 ["Children think mixing makes one new material.", "It does not. Look closely: the sand is still sand."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "\U0001F3D6️", "cap": "Sand: fine grains that pour.", "say": "Here is sand. Fine grains that pour through your fingers."},
                 {"pic": "\U0001FAA8", "cap": "Stones: big, hard, and they do not pour.", "say": "Here are stones. Big and hard. They do not pour."},
                 {"pic": "\U0001F963", "cap": "Mix them. A <b>mixture</b> of sand and stones.", "say": "Mix them together in a bowl. Now you have a mixture of sand and stones."},
                 {"pic": "\U0001F50D", "cap": "Look closely: the sand is still fine, the stones are still big. Each <b>keeps its properties</b>.", "say": "Look closely. The sand is still fine. The stones are still big and hard. Mixing changed nothing about either material. Each one keeps its properties."},
                 {"pic": icon("sieve"), "cap": "So they can be <b>separated</b>: a sieve lets the sand through and keeps the stones.", "say": "And because they kept their properties, you can separate them. A sieve lets the fine sand through and holds the big stones back."},
             ]},
             "A mixture is materials mixed together. Each keeps its properties, so they can be separated."),

        step("experiment", "Four mixtures", "\U0001F9EA", "Separator", ["3Cp.03", "3Cp.04", "3Cc.01", "3TWSp.03", "3TWSa.03"],
             "Four mixtures. A sieve, a magnet and a filter separate three of them. In the fourth, the salt dissolves. Predict first.",
             explain(
                 ["A mixture is separated using a property the two materials do not share."],
                 ["Sand and stones: different sizes, so a sieve.", "Iron filings and sand: only one is magnetic, so a magnet.", "Sand and water: the sand cannot get through filter paper.", "Salt and water: the salt dissolves. It looks gone, but the water tastes salty. Taste only with a grown-up, and only kitchen salt in drinking water."],
                 ["Children think dissolved salt has disappeared.", "With a grown-up, taste a drop of the water. It is salty. The salt is still there, in pieces too small to see."],
                 ["Predict, then press each button and watch."]),
             {"sim": "separate",
              "predict": {"ask": "You stir salt into water and it disappears. Is the salt still there?",
                          "opts": [opt("Yes, in pieces too small to see", True), opt("No, it has gone for ever", False), opt("It turned into water", False)]},
              "runAsk": "Press each button: sieve, magnet, filter, then stir the salt in. In real life, taste only with a grown-up, and only kitchen salt in drinking water.",
              "happened": {"ask": "What happened with the salt?",
                           "opts": [opt("It disappeared into the water, but the water tasted salty: it was still there", True), opt("It sank to the bottom", False), opt("The water went solid", False)],
                           "why": "Dissolving is mixing. The salt spread through the water in tiny pieces. The salty taste proves it is still there."},
              "conclude": {"ask": "What lets you separate a mixture?",
                           "opts": [opt("Each material keeps its own properties, so you use a property they do not share", True), opt("Mixing makes a new material", False), opt("You cannot separate mixtures", False)],
                           "why": "Size for the sieve, magnetism for the magnet, size again for the filter. A property one material has and the other does not."}},
             "Sieve, magnet, filter. And dissolved salt is still there."),

        step("sort", "Which tool separates it?", "\U0001F5C2️", "Tool sorter", ["3Cp.03", "3Cp.04", "3TWSc.01"],
             "Sieve, magnet or filter? Tap the bin that would separate this mixture.",
             explain(
                 ["Ask which property is different: size, or being magnetic.", "Big and small: sieve.", "Magnetic and not: magnet.", "A solid in a liquid: filter."],
                 ["Peas and flour: different sizes, sieve.", "Iron filings and sand: the same size, but only iron is magnetic, magnet.", "Muddy water: mud is a solid in water, filter."],
                 ["Children reach for the magnet for any metal.", "Not every metal is magnetic. Iron and steel are; copper wire is not."],
                 ["Which property is different? Then tap."]),
             {"ask": "Sieve, magnet or filter?",
              "bins": [{"id": "sieve", "label": "Sieve", "pic": icon("sieve")}, {"id": "magnet", "label": "Magnet", "pic": "\U0001F9F2"}, {"id": "filter", "label": "Filter", "pic": "\U0001F4C4"}],
              "items": [
                  {"pic": "\U0001FAA8", "label": "stones and sand", "bin": "sieve", "why": "Different sizes: the sand falls through, the stones stay."},
                  {"pic": "\U0001F4CE", "label": "steel paperclips and plastic paperclips of the same size", "bin": "magnet", "why": "The same size, so a sieve cannot do it. Steel paperclips are magnetic; plastic ones are not."},
                  {"pic": "\U0001F4A7", "label": "muddy water", "bin": "filter", "why": "A solid in a liquid: the filter paper holds the mud back."},
                  {"pic": "\U0001F7E2", "label": "peas and flour", "bin": "sieve", "why": "Flour falls through a sieve; peas do not."},
                  {"pic": "⚫", "label": "iron filings and sand", "bin": "magnet", "why": "Tiny grains, both of them, so a sieve cannot do it. Iron is magnetic: the filings jump to the magnet."},
                  {"pic": "\U0001F3D6️", "label": "sand and water", "bin": "filter", "why": "The sand stays in the filter; the water drips through clear."},
                  {"pic": "\U0001F35D", "label": "pasta and sugar", "bin": "sieve", "why": "Sugar grains fall through; pasta stays."},
                  {"pic": "\U0001F4CD", "label": "steel beads and glass beads of the same size", "bin": "magnet", "why": "The same size, so a sieve cannot do it. Steel is magnetic; glass is not."},
              ]},
             "Different size: sieve or filter. Magnetic or not: magnet."),

        step("record", "Does it dissolve?", "\U0001F4CB", "Dissolve table", ["3Cc.01", "3TWSc.06"],
             "Stir each solid into water. Fill in the table: does the <b>%s</b> dissolve?",
             explain(
                 ["Some solids dissolve in water: they spread out in tiny pieces and seem to vanish.", "Some do not: they sink and stay as they are."],
                 ["Salt and sugar dissolve.", "Sand and pebbles do not."],
                 ["Children think dissolving is melting.", "Melting needs heat. Dissolving needs a liquid to mix into. The salt is still salt."],
                 ["Tap dissolves or does not dissolve for each row."]),
             {"ask": "Stir the %s into water. What happens?",
              "columns": ["Solid", "In water"],
              "rows": [
                  {"pic": "\U0001F9C2", "label": "salt", "answer": "yes", "why": "salt dissolves. It seems to vanish, but the water tastes salty."},
                  {"pic": "\U0001F3D6️", "label": "sand", "answer": "no", "why": "sand sinks to the bottom and stays sand."},
                  {"pic": "\U0001F36C", "label": "sugar", "answer": "yes", "why": "sugar dissolves. The water tastes sweet."},
                  {"pic": "\U0001FAA8", "label": "pebbles", "answer": "no", "why": "pebbles sink and do not change."},
              ],
              "choices": [{"id": "yes", "t": "dissolves", "pic": "\U0001F4A7"}, {"id": "no", "t": "does not dissolve", "pic": "\U0001FAA8"}]},
             "Salt and sugar dissolve. Sand and pebbles do not. Dissolving is still mixing."),

        step("sort", "Safe, or risky?", "⚠️", "Safe scientist", ["3TWSp.04", "3TWSc.04"],
             "You will do mixture tests at home. Before you start, spot the risks. Is this <b>safe</b>, or <b>risky</b>? Tap the bin.",
             explain(
                 ["A risk is something that could hurt someone. Scientists spot risks first and stay safe.", "Do this before your own mixture tests at home."],
                 ["Goggles on when pouring: safe.", "Tasting an unknown powder: risky. You only tasted the salt water because a grown-up said it was safe.",
                  "Wiping spills straight away: safe. A wet floor is a risk.", "Running with a tray of glass: risky."],
                 ["Children think risky means exciting.", "It means somebody could get hurt."],
                 ["Ask: could this hurt someone?"]),
             {"ask": "Safe, or risky?",
              "bins": [{"id": "safe", "label": "Safe", "pic": "✅"}, {"id": "risky", "label": "Risky", "pic": "⚠️"}],
              "items": [
                  {"pic": "\U0001F97D", "label": "goggles on when pouring", "bin": "safe", "why": "Goggles keep splashes out of your eyes."},
                  {"pic": "\U0001F445", "label": "tasting an unknown powder", "bin": "risky", "why": "Never taste anything in an experiment unless a grown-up says it is safe."},
                  {"pic": "\U0001F9FD", "label": "wiping up a spill straight away", "bin": "safe", "why": "A wet floor is a slip. Wiping it up removes the risk."},
                  {"pic": "\U0001F3C3\U0001F3FE", "label": "running with a tray of glass", "bin": "risky", "why": "Trip, and the glass breaks and cuts."},
                  {"pic": "\U0001F487\U0001F3FE", "label": "tying long hair back", "bin": "safe", "why": "Hair cannot fall into the mixture or a flame."},
                  {"pic": "\U0001F443\U0001F3FE", "label": "sniffing a chemical up close", "bin": "risky", "why": "Waft the smell towards you with a hand, never sniff close up."},
                  {"pic": "\U0001F9D1\U0001F3FE‍\U0001F373", "label": "a grown-up doing the hot part", "bin": "safe", "why": "Heat is for the grown-up."},
                  {"pic": "\U0001F392", "label": "a bag left on the floor", "bin": "risky", "why": "Somebody trips over it carrying water."},
              ]},
             "Spot the risk, then remove it. That is how scientists work safely."),

        step("questions", "Mixture check", "✅", "Mixture check", ["3Cm.02", "3Cp.02", "3Cp.03", "3Cp.04", "3Cc.01"],
             "Tap the answer.",
             explain(
                 ["Mixtures, properties, three tools, and dissolving."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What is a mixture?", "\U0001F963", "two or more materials mixed together that can be separated", ["one new material", "a liquid"], "Mixed, not changed."),
                 q("You mix sand and stones. What happens to the sand's properties?", "\U0001F3D6️", "they stay the same", ["it turns into stone", "it becomes wet"], "Each material keeps its properties."),
                 q("Which tool separates sand from water?", "\U0001F4A7", "a filter", ["a magnet", "a ruler"], "The sand stays in the paper."),
                 q("Which tool separates iron filings from sand?", "\U0001F9F2", "a magnet", ["a sieve", "a filter"], "Only the iron is magnetic."),
                 q("Salt dissolves in water. Where is the salt?", "\U0001F9C2", "still in the water, in pieces too small to see", ["gone", "on the bottom"], "Taste it: salty."),
             ]},
             "You know your mixtures."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Cm.02", "3Cp.02", "3Cp.03", "3Cp.04", "3Cc.01", "3TWSp.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which is a mixture?", "\U0001F963", "sand and stones in a bowl", ["a glass of pure water", "a wooden block"], "Two materials, mixed."),
                 q("Why can a sieve separate peas from flour?", icon("sieve"), "they are different sizes", ["peas are magnetic", "flour is wet"], "The flour falls through the holes."),
                 q("Why can a magnet separate iron filings from sand?", "\U0001F9F2", "the iron is magnetic and the sand is not", ["the filings are bigger", "sand is heavier"], "A property one has and the other lacks."),
                 q("Muddy water goes through filter paper. What comes out?", "\U0001F4A7", "clear water; the mud stays in the paper", ["mud", "nothing"], "The filter holds the solid back."),
                 q("Which solid does not dissolve in water?", "\U0001FAA8", "sand", ["salt", "sugar"], "Sand sinks and stays."),
                 q("How do you know dissolved salt is still there?", "\U0001F445", "the water tastes salty", ["you can see it", "you cannot know"], "The taste proves it."),
                 q("Which is a risk in practical work?", "⚠️", "running with a tray of glass", ["wearing goggles", "wiping up a spill"], "Trip, break, cut."),
                 q("What should you do before you smell a chemical?", "\U0001F443\U0001F3FE", "waft the smell towards you with your hand", ["sniff it up close", "taste it first"], "Waft, never sniff."),
                 q("Why can a filter not take the salt back out of salt water?", "\U0001F9C2", "the dissolved salt is in pieces small enough to go through the paper", ["the salt is too heavy", "the salt has turned into water"], "Dissolved salt spreads out in pieces too small to see, so it goes through the filter with the water."),
                 q("Iron filings, sand and water are all mixed. Which tools would you use if you wanted all three back?", "\U0001F9F2", "a magnet for the iron and a filter for the sand", ["a sieve for the water and a magnet for the sand", "a filter for the iron and a magnet for the water"], "The magnet pulls out the iron. The filter keeps the sand and lets the water through."),
                 q("Why does the sand stay in the filter paper while the water goes through?", "\U0001F4A7", "the sand grains are too big for the tiny holes in the paper", ["the sand is magnetic", "the water dissolves the paper"], "Water passes through the tiny holes. The grains of sand cannot."),
             ]},
             "That is the whole lesson finished. You can separate a mixture and stay safe doing it."),
    ],
}

LESSON["about"] = [
    "Say what a mixture is and that each material in it keeps its properties.",
    "Separate mixtures with a sieve, a magnet and a filter, and say which property you used.",
    "Say where salt goes when it dissolves.",
    "Spot the risks in practical work and say how to stay safe.",
]

LESSON["warmup"] = [
    q("Is water a solid, a liquid or a gas?", "\U0001F4A7", "a liquid", ["a solid", "a gas"], "Water flows and takes the shape of its container: a liquid."),
    q("Which tool measures how hot something is?", "\U0001F321\ufe0f", "a thermometer", ["a ruler", "a measuring jug"], "A thermometer measures temperature."),
]

LESSON["lecture"] = [
    part("\U0001F963", "A mixture",
         "Mix sand and stones in a bowl. That is a mixture: two materials together. Look closely. The sand is still sand and the stones are still stones. Mixing does not change them."),
    part(icon("sieve"), "Sieve and magnet",
         "Because each material keeps its properties, you can get them apart. Sand and stones are different sizes, so a sieve separates them. Iron filings and sand: only the iron is magnetic, so a magnet pulls it out."),
    part("\U0001F4A7", "The filter",
         "Sand in water is a mixture too. Pour it through filter paper. The water drips through clear. The sand cannot get through the tiny holes and stays behind."),
    part("\U0001F9C2", "Dissolving",
         "Stir salt into water and it disappears. But taste a drop, with a grown-up: salty. The salt is still there, in pieces far too small to see. Dissolving is a kind of mixing, not a vanishing."),
    part("⚠️", "Risks",
         "Practical work has risks. Glass can break. Floors get wet. Powders can hurt. A scientist spots the risks first: goggles on, spills wiped, hair tied back, nothing tasted unless a grown-up says so."),
]

LESSON["words"] = [
    word("mixture", "\U0001F963", "Two or more materials mixed together that can be separated again.",
         ["Sand and stones make a mixture.", "Salt water is a mixture too."]),
    word("separate", icon("sieve"), "To get the materials in a mixture apart.",
         ["A sieve can separate sand from stones.", "We separated the iron filings with a magnet."]),
    word("sieve", icon("sieve"), "A tool with holes that lets small things through and keeps big things back.",
         ["Shake the sieve and the flour falls through.", "A sieve separates by size."]),
    word("filter", "\U0001F4A7", "Paper or cloth with tiny holes that lets a liquid through and keeps a solid back.",
         ["Pour the muddy water through the filter.", "The sand stayed in the filter paper."]),
    word("dissolve", "\U0001F9C2", "To mix into a liquid in pieces too small to see.",
         ["Salt dissolves in water.", "Sugar dissolved in my tea."]),
    word("magnetic", "\U0001F9F2", "Pulled by a magnet. Iron and steel are magnetic.",
         ["Iron filings are magnetic.", "Sand is not magnetic, so the magnet leaves it."]),
    word("risk", "⚠️", "Something that could hurt someone.",
         ["A wet floor is a risk.", "Spot the risk and remove it."]),
]

LESSON["home"] = [
    home("Separate a mixture", "Dry sand or flour, a few pebbles, some steel paperclips, a sieve, a magnet, a tray",
         ["Mix the sand or flour, the pebbles and the paperclips on the tray.",
          "Use the magnet first. What jumps to it?",
          "Then tip the rest through the sieve."],
         "The magnet took the paperclips. The sieve kept the pebbles. Say which property each one used."),
    home("The filter test", "A coffee filter or kitchen paper, a funnel or a plastic cup with holes (a grown-up makes the holes with a skewer), muddy water, a jug",
         ["Stir a spoon of soil into a jug of water.",
          "Pour it slowly through the filter into a clean plastic cup.",
          "Look at what dripped through and what stayed."],
         "Clearer water comes through. The soil stays. Do not drink it."),
    home("Is the sugar still there?", "Two plastic cups of drinking water, a spoon of kitchen sugar, a saucer, a grown-up",
         ["Stir the sugar into one cup until it disappears.",
          "With a grown-up, taste a sip from each cup. Only taste because a grown-up says it is safe.",
          "Pour a spoonful of the sugar water onto a saucer and leave it on a sunny windowsill for a few days."],
         "The sweet taste proves the sugar is still there. When the water dries away, what is left on the saucer?"),
]
