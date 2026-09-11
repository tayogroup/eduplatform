# -*- coding: utf-8 -*-
"""Lesson 7 - Solids, Liquids and Gases.

0097 Stage 3: 3Cm.01 materials can be solids, liquids or gases; 3Cp.01 the
differences between solids and liquids; 3TWSc.03 standard units and why
they beat non-standard ones; 3TWSc.02 choose equipment; with 3TWSc.01,
3TWSc.06, 3TWSp.03 and 3TWSa.03.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "solids-liquids-and-gases",
    "title": "Solids, Liquids and Gases",
    "blurb": "Sort materials into solids, liquids and gases, pour, tip and squash them to find how they differ, measure in centimetres and say why standard units win, and choose the right equipment for the job.",
    "steps": [
        step("explore", "Three states", "\U0001F9CA", "Three states", ["3Cm.01", "3TWSc.04", "3TWSp.04"],
             "Every material is a solid, a liquid or a gas. Tap each one, then tap the safety card.",
             explain(
                 ["A material is in one of three states: solid, liquid or gas."],
                 ["A solid keeps its shape: wood, ice, a stone.", "A liquid flows and takes the shape of its container: water, milk, oil.", "A gas spreads out to fill any space: the air, steam, the gas in a balloon.",
                  "When you do the ice and water tests at home: a grown-up does anything hot while you stand well back, and you wipe up spills straight away."],
                 ["Children think gas is nothing.", "Air is a gas, and it is something. Feel it when you wave your hand."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F9CA", "label": "solid", "sub": "keeps its shape", "say": "A solid keeps its own shape. Ice, wood, a stone, a spoon. You can pick it up and it stays the shape it is."},
                 {"pic": "\U0001F4A7", "label": "liquid", "sub": "flows, takes the shape of its container", "say": "A liquid flows. Pour it into a cup and it is cup-shaped; pour it into a bowl and it is bowl-shaped. Water, milk, oil, honey."},
                 {"pic": "\U0001F4A8", "label": "gas", "sub": "spreads out to fill the space", "say": "A gas spreads out to fill every bit of space it can. The air around you, steam from a kettle, the gas inside a balloon."},
                 {"pic": "⚠️", "label": "stay safe", "sub": "when you do the ice test at home", "say": "When you do the ice and water tests at home, work safely. Steam from a kettle is very hot and can burn you, so a grown-up does anything hot while you stand well back. Spilt water makes the floor slippery, so wipe it up straight away."},
             ], "need": 4,
              "then": {"ask": "You pour orange juice from a jug into a glass and it becomes glass-shaped. Which state is it?",
                       "opts": [opt("a liquid", True), opt("a solid", False), opt("a gas", False)],
                       "why": "It flows and takes the shape of its container: a liquid."}},
             "Solid, liquid, gas."),

        step("sort", "Solid, liquid or gas?", "\U0001F5C2️", "State sorter", ["3Cm.01", "3TWSc.01"],
             "Which state is this material in? Tap the bin.",
             explain(
                 ["Ask: does it keep its shape, flow, or spread out?"],
                 ["Ice keeps its shape: solid.", "Water flows: liquid.", "Steam spreads out: gas.", "Sand pours, but every grain keeps its shape. Each grain is a tiny solid."],
                 ["Children call sand a liquid because it pours.", "Pick up one grain. It keeps its shape. Sand is lots of tiny solids."],
                 ["Keep its shape, flow, or spread out? Then tap."]),
             {"ask": "Solid, liquid or gas?",
              "bins": [{"id": "solid", "label": "Solid", "pic": "\U0001F9F1"}, {"id": "liquid", "label": "Liquid", "pic": "\U0001F30A"}, {"id": "gas", "label": "Gas", "pic": "\U0001F32C️"}],
              "items": [
                  {"pic": "\U0001F9CA", "label": "ice", "bin": "solid", "why": "Ice keeps its shape. A solid."},
                  {"pic": "\U0001F4A7", "label": "water", "bin": "liquid", "why": "Water flows and takes the shape of the glass."},
                  {"pic": "♨️", "label": "steam", "bin": "gas", "why": "Steam spreads out into the air. A gas."},
                  {"pic": "\U0001FAB5", "label": "wood", "bin": "solid", "why": "Wood keeps its shape."},
                  {"pic": "\U0001F95B", "label": "milk", "bin": "liquid", "why": "Milk pours and takes the shape of the cup."},
                  {"pic": "\U0001F388", "label": "the air in a balloon", "bin": "gas", "why": "Air is a gas. It fills the whole balloon."},
                  {"pic": "\U0001F3D6️", "label": "sand", "bin": "solid", "why": "Sand pours, but each grain keeps its shape. Lots of tiny solids."},
                  {"pic": "\U0001F36F", "label": "honey", "bin": "liquid", "why": "Honey flows slowly, but it flows. A liquid."},
                  {"pic": "\U0001FAA8", "label": "a stone", "bin": "solid", "why": "A stone keeps its shape."},
                  {"pic": "\U0001F4A8", "label": "the air in the room", "bin": "gas", "why": "Air spreads out to fill the whole room. A gas."},
              ]},
             "Keeps its shape, flows, or spreads out: solid, liquid, gas."),

        step("experiment", "Pour it, tip it, let it out", "\U0001F9EA", "State tester", ["3Cp.01", "3Cm.01", "3TWSp.03", "3TWSa.03"],
             "Water, a wooden block and a balloon of air. Predict what each will do.",
             explain(
                 ["A solid and a liquid behave differently, and a gas differently again."],
                 ["Pour the water and it takes the shape of the glass.", "Tip the block and it keeps its shape.", "Untie the balloon and the air spreads everywhere."],
                 ["Children think the block will change shape if you tip it hard.", "It does not. A solid keeps its shape however you turn it."],
                 ["Predict, try all three, say what happened, then conclude."]),
             {"sim": "states",
              "predict": {"ask": "What will the <b>water</b> do when you pour it into the glass?",
                          "opts": [opt("Take the shape of the glass", True), opt("Keep its own shape", False), opt("Spread out into the air", False)]},
              "runAsk": "Press all three buttons and watch what each material does.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The water took the shape of the glass, the block kept its shape, the air spread out", True), opt("All three kept their shape", False), opt("The block took the shape of the glass", False)],
                           "why": "Liquid flows into the shape of its container. Solid keeps its shape. Gas spreads out."},
              "conclude": {"ask": "What is the difference between a solid and a liquid?",
                           "opts": [opt("A solid keeps its shape; a liquid takes the shape of its container", True), opt("A solid is always bigger", False), opt("There is no difference", False)],
                           "why": "That is the conclusion the results support: shape is the difference."}},
             "Solid keeps its shape. Liquid takes the shape of its container. Gas spreads out."),

        step("tester", "Test the materials", "\U0001F50D", "Property tests", ["3Cp.01", "3TWSc.01"],
             "Tip it, squash it, pour it. Test each material and collect the badges.",
             explain(
                 ["Three tests tell you the state of a material."],
                 ["Tip it: does it keep its shape?", "Squash it: does it press in?", "Pour it: does it flow?"],
                 ["Children think honey is a solid because it is slow.", "Pour it. It flows. Slowly, but it flows."],
                 ["Test four materials with all three tests."]),
             {"need": 4,
              "tests": [
                  {"id": "tip", "label": "Tip it over", "pic": "↩️", "anim": "rotate(90deg)", "sound": "thud", "say": "Tip the %m over. It %r."},
                  {"id": "squash", "label": "Squash it", "pic": "\U0001F44A", "anim": "scale(1.3, 0.7)", "sound": "click", "say": "Squash the %m. It %r."},
                  {"id": "pour", "label": "Pour it", "pic": "\U0001F964", "anim": "translateY(10px)", "sound": "splash", "say": "Try to pour the %m. It %r."},
              ],
              "materials": [
                  {"id": "block", "pic": "\U0001FAB5", "label": "wooden block", "animates": {"squash": False, "pour": False}, "props": {"tip": "keeps exactly the same shape", "squash": "does not press in at all", "pour": "will not pour; it is one solid piece"}},
                  {"id": "water", "pic": "\U0001F4A7", "label": "water", "animates": {"squash": False}, "props": {"tip": "flows into the new shape", "squash": "cannot be squashed; it just moves out of the way", "pour": "pours easily"}},
                  {"id": "honey", "pic": "\U0001F36F", "label": "honey", "props": {"tip": "slowly flows into the new shape", "squash": "moves out of the way, slowly", "pour": "pours, slowly"}},
                  {"id": "sand", "pic": "\U0001F3D6️", "label": "sand", "props": {"tip": "pours, but every grain keeps its shape", "squash": "packs together; each grain stays a grain", "pour": "pours like a liquid, but it is lots of tiny solids"}},
                  {"id": "sponge", "pic": "\U0001F9FD", "label": "sponge", "animates": {"pour": False}, "props": {"tip": "keeps its shape", "squash": "presses in, then springs back", "pour": "will not pour"}},
              ]},
             "Solids keep their shape. Liquids flow. Sand is lots of tiny solids that pour."),

        step("measure", "Measure in centimetres", "\U0001F4CF", "Centimetres", ["3TWSc.03", "3TWSc.06"],
             "How deep is <b>%s</b>? Count the centimetres.",
             explain(
                 ["Last year you measured in hands and cubes.", "Scientists measure in standard units: centimetres, litres, grams. A centimetre is the same size for everyone."],
                 ["Lay centimetres up the side of the glass and count.", "Then answer: why are centimetres better than hand spans?"],
                 ["Children think a hand span is fine.", "Your hand and my hand are different sizes, so our answers would not agree. Every centimetre is the same."],
                 ["Add a centimetre at a time and count."]),
             {"ask": "How deep is %s? Add centimetres and count.", "dim": "deep",
              "unit": {"name": "centimetres", "singular": "centimetre", "pic": "\U0001F4CF", "button": "Add a centimetre"},
              "objects": [{"pic": icon("glass"), "label": "the water in the tall glass", "units": 8}, {"pic": "\U0001F963", "label": "the water in the wide bowl", "units": 3}],
              "compare": {"ask": "Why do scientists measure in centimetres instead of hand spans?",
                          "opts": [opt("Every centimetre is the same size, so anyone can check the result", True), opt("Centimetres are prettier", False), opt("Hands are too big", False)],
                          "why": "A standard unit is the same for everyone. Your hand span and mine are not, so results in hands cannot be compared."}},
             "Eight centimetres deep, three centimetres deep. Standard units: the same for everyone."),

        step("questions", "Choose the equipment", "\U0001F9F0", "Right tool", ["3TWSc.02", "3TWSc.03"],
             "Which piece of equipment does the job? Tap it.",
             explain(
                 ["Scientists choose the right equipment for the measurement."],
                 ["A ruler for length.", "A measuring jug for how much liquid.", "A thermometer for temperature.", "Scales for how heavy.", "A hand lens to see tiny things."],
                 ["Children reach for a ruler for everything.", "A ruler cannot tell you how much water is in a jug."],
                 ["Read what you need to measure, then tap the tool."]),
             {"label": "Question", "items": [
                 q("You want to know how long a leaf is. Which equipment?", "\U0001F343", "a ruler, in centimetres", ["a measuring jug", "a thermometer", "scales"], "Length: a ruler."),
                 q("You want to know how much water is in a jug. Which equipment?", "\U0001F4A7", "a measuring jug, in millilitres", ["a ruler", "a hand lens"], "Liquid: a measuring jug."),
                 q("You want to know how hot the water is. Which equipment?", "\U0001F321️", "a thermometer, in degrees", ["scales", "a ruler"], "Temperature: a thermometer."),
                 q("You want to know how heavy a stone is. Which equipment?", "\U0001FAA8", "scales, in grams", ["a measuring jug", "a hand lens"], "Mass: scales."),
                 q("You want to see the grains of sand up close. Which equipment?", "\U0001F3D6️", "a hand lens", ["a thermometer", "scales"], "To see small things: a lens."),
             ]},
             "The right tool for the measurement, and a standard unit to measure in."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Cm.01", "3Cp.01", "3TWSc.03", "3TWSc.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which state keeps its own shape?", "\U0001F9CA", "a solid", ["a liquid", "a gas"], "Solids keep their shape."),
                 q("Which state takes the shape of its container?", "\U0001F4A7", "a liquid", ["a solid", "a gas"], "Liquids flow into the shape."),
                 q("Which state spreads out to fill all the space?", "\U0001F4A8", "a gas", ["a solid", "a liquid"], "Gases fill the space."),
                 q("Sand pours. Why is it a solid?", "\U0001F3D6️", "each grain keeps its shape", ["it is wet", "it is heavy"], "Lots of tiny solids."),
                 q("Is honey a solid or a liquid?", "\U0001F36F", "a liquid, because it flows", ["a solid, because it is slow", "a gas"], "Slow, but it flows."),
                 q("What is a standard unit?", "\U0001F4CF", "a unit that is the same size for everyone, like a centimetre", ["a unit you make up", "a big unit"], "Same for everyone."),
                 q("Why not measure in hand spans?", "✋", "everyone's hand is a different size, so results cannot be compared", ["hands are dirty", "you cannot count hands"], "Standard units can be compared."),
                 q("Which equipment measures how much liquid?", "\U0001F964", "a measuring jug", ["a ruler", "a thermometer"], "Millilitres in a jug."),
                 q("You pour milk from a tall glass onto a flat plate. Why does its shape change?", "\U0001F95B", "milk is a liquid, so it takes the shape of its container", ["the plate squashes it", "milk is a solid"], "A liquid has no shape of its own. It flows into the shape of whatever holds it."),
             ]},
             "That is the whole lesson finished. You know your solids, liquids and gases."),
    ],
}

LESSON["about"] = [
    "Say whether a material is a solid, a liquid or a gas.",
    "Say how solids and liquids differ, from what you tested.",
    "Measure in centimetres and say why standard units beat hand spans.",
    "Choose the right equipment for a measurement.",
]

LESSON["warmup"] = [
    q("In a food chain, what do we call a plant?", "\U0001F33F", "a producer", ["a consumer", "a hunter"], "A plant makes its own food, so it is a producer."),
    q("What happens to an ice cube in a warm room?", "\U0001F9CA", "it melts into water", ["it grows bigger", "it turns into stone"], "Warmth melts ice into liquid water."),
]

LESSON["lecture"] = [
    part("\U0001F9CA", "Three states",
         "Every material is in one of three states. A solid, like ice or wood. A liquid, like water or milk. Or a gas, like the air around you. The same material can be in different states: ice, water and steam are all water."),
    part("\U0001F4A7", "Solids and liquids",
         "A solid keeps its own shape. Turn a block over and it is still a block. A liquid has no shape of its own. Pour it into a glass and it is glass-shaped. Pour it into a bowl and it is bowl-shaped."),
    part("\U0001F4A8", "Gases",
         "A gas spreads out to fill every bit of space it can. Untie a balloon and the air rushes out and spreads through the whole room. You cannot see the air, but it is there. Wave your hand and feel it."),
    part("\U0001F4CF", "Standard units",
         "Last year you measured in hands and cubes. But your hand and my hand are different sizes. So scientists measure in standard units, like centimetres. A centimetre is the same size for everyone, everywhere."),
    part("\U0001F9F0", "The right equipment",
         "A ruler measures length in centimetres. A measuring jug measures liquid in millilitres. A thermometer measures how hot. Scales measure how heavy. Choose the right tool, and measure in a standard unit."),
]

LESSON["words"] = [
    word("solid", "\U0001F9CA", "A material that keeps its own shape.",
         ["Ice is a solid.", "A solid does not pour."]),
    word("liquid", "\U0001F4A7", "A material that flows and takes the shape of its container.",
         ["Water is a liquid.", "Pour a liquid and it takes the shape of the glass."]),
    word("gas", "\U0001F4A8", "A material that spreads out to fill all the space it can.",
         ["Air is a gas.", "The gas escaped from the balloon."]),
    word("state", "\U0001F504", "Whether a material is a solid, a liquid or a gas.",
         ["Ice and water are the same material in different states.", "Which state is steam?"]),
    word("flow", "\U0001F30A", "To move along and spread, the way a liquid does.",
         ["Water flows down the hill.", "Honey flows slowly."]),
    word("standard unit", "\U0001F4CF", "A unit of measurement that is the same size for everyone, like a centimetre or a litre.",
         ["A centimetre is a standard unit.", "Use standard units so others can check your results."]),
    word("centimetre", "\U0001F4CF", "A standard unit for measuring length. About the width of a fingernail.",
         ["The water was eight centimetres deep.", "There are a hundred centimetres in a metre."]),
]

LESSON["home"] = [
    home("Three states in the kitchen", "Ice from a freezer if you have one (or from a shop), a kettle, a grown-up",
         ["Find water as a solid: an ice cube. Hold it and see it keep its shape.",
          "Find it as a liquid: pour it into two different-shaped glasses.",
          "A grown-up boils the kettle while you stand well back: steam burns. Just above the spout the steam is invisible. The white cloud higher up is tiny drops of water, and it spreads out and disappears."],
         "One material, three states."),
    home("Hand spans against a ruler", "A ruler or tape measure, three people, a table",
         ["Everyone measures the table in their own hand spans and writes the number down.",
          "Then measure it once with the ruler in centimetres.",
          "Compare the hand-span numbers."],
         "Different numbers for the same table. That is why scientists use standard units."),
    home("Choose the tool", "A ruler, and a measuring jug, kitchen scales and a thermometer if you have them. A cup or a spoon will do instead of a jug.",
         ["Pick five things in the kitchen.",
          "For each one, decide what to measure: how long, how much, how heavy, how hot.",
          "Pick the right tool, measure it, and say the unit. Measure only cold or room-temperature things, never anything hot.",
          "No measuring jug? Count cups or spoonfuls. They are not standard units, so say so."],
         "Did you say the unit every time? Centimetres, millilitres, grams, degrees."),
]
