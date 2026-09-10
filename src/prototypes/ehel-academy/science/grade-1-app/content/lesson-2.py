# -*- coding: utf-8 -*-
"""Lesson 2 - Parts of a Plant.

0097 Stage 1: 1Bs.01 roots, leaves, stems and flowers; 1Bp.03 plants need
light and water (the light half); with 1TWSp.01, 1TWSp.02, 1TWSc.02,
1TWSc.03, 1TWSc.04, 1TWSc.05, 1TWSa.01 and 1SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home

PLANT_PARTS = [
    {"id": "roots", "label": "roots", "say": "The roots hide in the soil. They hold the plant steady and drink up water."},
    {"id": "stem", "label": "stem", "say": "The stem stands up tall. It holds the plant up and carries water to the leaves."},
    {"id": "leaves", "label": "leaves", "say": "The leaves are green. They catch the sunlight and make food for the plant."},
    {"id": "flower", "label": "flower", "say": "The flower is the colourful part. It makes the seeds for new plants."},
]

LESSON = {
    "slug": "parts-of-a-plant",
    "title": "Parts of a Plant",
    "blurb": "Watch a seed grow day by day, name the roots, stem, leaves and flower, and find out what happens to a plant kept in the dark.",
    "steps": [
        step("demo", "A seed grows", "\U0001F331", "Seed to flower", ["1Bs.01", "1Bp.03"],
             "Press <b>Next day</b> and watch the seed. Which part grows first?",
             explain(
                 ["A whole plant is packed inside a tiny seed.", "Give it water and it starts to grow."],
                 ["Day one: a seed in the soil.", "First a root grows down, to drink water.", "Then a shoot grows up, towards the light.",
                  "Then leaves open out to catch the sun.", "The stem grows taller, and at last a flower opens."],
                 ["Children think the shoot comes first because that is the part they can see.", "The root comes first, hidden in the soil."],
                 ["Press Next day and say the name of each new part as it appears."]),
             {"button": "Next day ▶", "frames": [
                 {"scene": {"id": "plant", "state": 0}, "cap": "Day 1. A <b>seed</b> in the soil, with water.", "say": "Day one. A seed in the soil. We give it water."},
                 {"scene": {"id": "plant", "state": 1}, "cap": "Day 3. A <b>root</b> grows down first, to drink.", "say": "Day three. A root grows down first. It drinks water from the soil."},
                 {"scene": {"id": "plant", "state": 2}, "cap": "Day 5. A <b>shoot</b> pushes up towards the light.", "say": "Day five. A shoot pushes up out of the soil, towards the light."},
                 {"scene": {"id": "plant", "state": 3}, "cap": "Day 7. <b>Leaves</b> open to catch the sunlight.", "say": "Day seven. Leaves open out to catch the sunlight."},
                 {"scene": {"id": "plant", "state": 4}, "cap": "Day 14. The <b>stem</b> grows taller and more leaves grow.", "say": "Day fourteen. The stem grows taller and more leaves grow."},
                 {"scene": {"id": "plant", "state": 5}, "cap": "Day 30. A <b>flower</b> opens. It will make new seeds.", "say": "Day thirty. A flower opens. The flower will make new seeds, and it all starts again."},
             ]},
             "Root, shoot, leaves, stem, flower. That is how a seed grows."),

        step("label", "Tap the part", "\U0001F33C", "Named the parts", ["1Bs.01"],
             "Find each part of the plant. Tap the <b>%s</b>.",
             explain(
                 ["A flowering plant has four main parts: roots, stem, leaves and flower."],
                 ["The roots are at the bottom, in the soil.", "The stem is the tall stalk in the middle.",
                  "The leaves are the flat green parts that stick out from the stem.", "The flower is the colourful part at the top."],
                 ["Children tap a leaf when asked for the stem, because the leaf is joined to it.", "The stem is the stalk itself, not what grows out of it."],
                 ["Listen for the part, look for it, then tap it."]),
             {"figure": "plant", "ask": "Tap the %s.", "parts": PLANT_PARTS},
             "Roots, stem, leaves and flower. You can find them all."),

        step("explore", "What does each part do?", "\U0001F9E0", "Part jobs", ["1Bs.01"],
             "Every part has a job. Tap each one to hear it.",
             explain(
                 ["Each part of a plant does a different job, and the plant needs all four."],
                 ["Roots hold the plant in the soil and drink water.", "The stem carries that water up to the leaves.",
                  "Leaves catch sunlight and make the plant's food.", "The flower makes seeds for new plants."],
                 ["Children think plants eat soil.", "Plants make their own food in their leaves, using sunlight. The soil gives them water and something to hold on to."],
                 ["Tap all four and say each job out loud."]),
             {"items": [
                 {"pic": "\U0001FAB4", "label": "roots", "sub": "hold and drink", "say": "The roots hold the plant in the soil and drink up water, like straws."},
                 {"pic": "\U0001F33F", "label": "stem", "sub": "holds up, carries water", "say": "The stem holds the plant up and carries water from the roots to the leaves."},
                 {"pic": "\U0001F343", "label": "leaves", "sub": "make food from sunlight", "say": "The leaves catch sunlight and use it to make the plant's food."},
                 {"pic": "\U0001F33C", "label": "flower", "sub": "makes seeds", "say": "The flower makes seeds. Each seed can grow into a new plant."},
             ], "need": 4},
             "Roots drink, the stem carries, leaves make food, the flower makes seeds."),

        step("questions", "Which part?", "✅", "Which part?", ["1Bs.01"],
             "Which part of the plant does the job? Tap it.",
             explain(
                 ["Now you know the four parts and their jobs, you can work out which part is being talked about."],
                 ["If it says drinking water from the soil, that is the roots.", "If it says catching sunlight, that is the leaves.",
                  "If it says making seeds, that is the flower.", "If it says holding the plant up, that is the stem."],
                 [],
                 ["Read the question, think about the job, then tap the part."]),
             {"label": "Question", "items": [
                 q("Which part drinks water from the soil?", "\U0001F4A7", "roots", ["leaves", "flower", "stem"], "The roots are in the soil and drink up the water."),
                 q("Which part catches sunlight and makes food?", "☀️", "leaves", ["roots", "flower", "stem"], "The green leaves catch the sunlight."),
                 q("Which part makes the seeds?", "\U0001F330", "flower", ["roots", "leaves", "stem"], "The flower makes seeds for new plants."),
                 q("Which part holds the plant up tall?", "\U0001F33F", "stem", ["roots", "flower", "leaves"], "The stem is the stalk that holds the plant up."),
                 q("Which part is hidden under the soil?", "\U0001F33E", "roots", ["flower", "leaves", "stem"], "The roots grow down into the soil."),
                 q("Which part is usually the most colourful?", "\U0001F3A8", "flower", ["roots", "stem", "leaves"], "Flowers are colourful to attract bees and other insects."),
             ]},
             "You know the parts of a plant and what each one does."),

        step("experiment", "Does a plant need light?", "\U0001F9EA", "Light test", ["1Bp.03", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Two plants. One <b>by the window</b>, one <b>in a dark cupboard</b>. Both get water. Predict first!",
             explain(
                 ["This is a fair test.", "Both plants get water. Only one thing is different: the light."],
                 ["Predict first: what will happen to the plant in the dark?",
                  "Then wait a day at a time and look at both.", "At the end, say what happened and whether it matched your prediction."],
                 ["Children think that because both plants have water, both will be fine.", "Water is not enough. Leaves need light to make food."],
                 ["Tap your prediction, then press Wait a day and watch the plant in the cupboard."]),
             {"sim": "plantLight",
              "predict": {"ask": "What do you think will happen to the plant in the <b>dark cupboard</b>?",
                          "opts": [opt("It will go pale and droopy", True), opt("It will grow big and green", False), opt("It will stay the same", False)]},
              "runAsk": "Press Wait a day. Look at the plant in the dark cupboard.",
              "happened": {"ask": "What happened to the plant in the dark?",
                           "opts": [opt("It went pale, thin and droopy", True), opt("It grew bigger than the window plant", False), opt("Nothing changed", False)],
                           "why": "Without light the plant went pale and droopy, even with water. Plants need light AND water."}},
             "Plants need light and water. Both."),

        step("record", "My plant diary", "\U0001F4D3", "Plant diary", ["1TWSc.05", "1Bs.01"],
             "A plant diary is a table. Fill in what you saw on <b>%s</b>.",
             explain(
                 ["Scientists keep a diary of what they see, day by day, so they can look back at how something changed."],
                 ["Think back to the seed you watched grow.", "On day one there was just a seed.", "On day three a root.", "On day five a shoot.", "On day seven, leaves.",
                  "Tap each day and choose the picture that matches."],
                 ["Children fill in what they think should happen.", "A diary only holds what you actually saw."],
                 ["Fill in each row of the diary."]),
             {"ask": "What did you see on %s?",
              "columns": ["Day", "What I saw"],
              "rows": [
                  {"pic": "1️⃣", "label": "day 1", "answer": "seed", "why": "on day one there was just the seed in the soil."},
                  {"pic": "3️⃣", "label": "day 3", "answer": "root", "why": "on day three a root had grown down."},
                  {"pic": "5️⃣", "label": "day 5", "answer": "shoot", "why": "on day five a shoot had pushed up."},
                  {"pic": "7️⃣", "label": "day 7", "answer": "leaves", "why": "on day seven the leaves had opened."},
              ],
              "choices": [{"id": "seed", "t": "a seed", "pic": "\U0001F330"}, {"id": "root", "t": "a root", "pic": "\U0001FAB4"},
                          {"id": "shoot", "t": "a shoot", "pic": "\U0001F331"}, {"id": "leaves", "t": "leaves", "pic": "\U0001F33F"}]},
             "Your plant diary is complete."),

        step("measure", "How tall is the plant?", "\U0001F4CF", "Measured it", ["1TWSc.03"],
             "Measure <b>%s</b> in cubes. Press to stack a cube each time.",
             explain(
                 ["You can measure how tall something is by counting cubes stacked beside it."],
                 ["Put down one cube. Say one.", "Put down another. Say two.", "Keep going until the cubes reach the top of the plant.",
                  "The last number you say is how tall the plant is, in cubes."],
                 ["Children stop stacking before they reach the top, or keep going past it.", "Stop exactly when the cubes reach the top."],
                 ["Stack cubes for each plant, then say which is taller."]),
             {"ask": "How tall is %s? Stack cubes until you reach the top.",
              "unit": {"name": "cubes", "singular": "cube", "pic": "\U0001F7E9", "button": "Add a cube"},
              "objects": [
                  {"pic": "\U0001F331", "label": "the seedling", "units": 3},
                  {"pic": "\U0001F33B", "label": "the sunflower", "units": 8},
              ],
              "compare": {"ask": "The seedling is 3 cubes. The sunflower is 8 cubes. Which is taller?",
                          "opts": [opt("the sunflower", True), opt("the seedling", False), opt("they are the same", False)],
                          "why": "8 cubes is more than 3 cubes, so the sunflower is taller."}},
             "You measured in cubes. That is measuring like a scientist."),

        step("explore", "Use the tools safely", "\U0001F9E4", "Safe hands", ["1TWSc.02", "1TWSc.04"],
             "Scientists use tools carefully. Tap each tool to hear how to use it.",
             explain(
                 ["Every tool has a right way to use it, and using it that way keeps you and the plant safe."],
                 ["A watering can pours gently at the soil, not on the flower.", "A magnifying glass goes close to your eye, and you move the leaf, not the glass.",
                  "A trowel digs a small hole, held by the handle.", "Gloves keep soil off your hands, and you wash your hands after anyway."],
                 ["Children point a magnifying glass at the sun to see it better.", "Never do that. It can burn."],
                 ["Tap every tool and listen to the rule."]),
             {"items": [
                 {"pic": "\U0001FAB4", "label": "watering can", "say": "Pour gently at the soil, near the roots. Not on the flower. Stop when the soil is damp."},
                 {"pic": "\U0001F50D", "label": "magnifying glass", "say": "Hold it near your eye and move the leaf closer until it looks sharp. Never point it at the sun."},
                 {"pic": "\U0001F33E", "label": "trowel", "say": "Hold the handle and dig a small hole. Keep it pointing down, away from other people."},
                 {"pic": "\U0001F9E4", "label": "gloves", "say": "Gloves keep soil off your hands. Wash your hands afterwards anyway."},
                 {"pic": "\U0001F4CF", "label": "ruler", "say": "Put the zero end at the bottom of the plant and read the number at the top."},
             ], "need": 5,
              "then": {"ask": "You want to look closely at a leaf. Which tool?",
                       "opts": [opt("magnifying glass", True), opt("trowel", False), opt("watering can", False)],
                       "why": "A magnifying glass makes small things look big."}},
             "The right tool, used the right way, keeps everyone safe."),

        step("context", "People who use science", "\U0001F468‍\U0001F33E", "Science jobs", ["1SIC.03"],
             "Some people use plant science every day at work. Tap each one.",
             explain(
                 ["Everyone uses science, and some people use it as their job."],
                 ["A farmer knows plants need water and light, so they plant in sunny fields and water in dry weather.",
                  "A gardener knows which part is the root, so they plant it the right way up.", "A florist keeps flowers in water so they stay fresh."],
                 ["Children think science only happens in a laboratory.", "A farmer in a field is doing science too."],
                 ["Tap each person and hear how they use what you learned today."]),
             {"items": [
                 {"pic": "\U0001F469‍\U0001F33E", "label": "farmer", "say": "A farmer knows that plants need light and water, so the crops are planted in the sun and watered when it is dry."},
                 {"pic": "\U0001F9D1‍\U0001F33E", "label": "gardener", "say": "A gardener knows the roots go down in the soil and the stem goes up. Plant it upside down and it will not grow."},
                 {"pic": "\U0001F490", "label": "florist", "say": "A florist keeps cut flowers standing in water, because the stem still carries water up to the petals."},
                 {"pic": "\U0001F52C", "label": "plant scientist", "say": "A plant scientist grows seeds in a laboratory to find out what helps them grow best."},
             ], "need": 4,
              "then": {"ask": "A farmer plants seeds in a sunny field and waters them. Why?",
                       "opts": [opt("Because plants need light and water", True), opt("Because the field looks nice", False), opt("Because seeds like to be busy", False)],
                       "why": "The farmer is using plant science: light and water."}},
             "Everyone uses science. Some people use it all day at work."),

        step("ask", "Ask a question about a plant", "❓", "Asked why", ["1TWSp.01"],
             "Look at the flower. Tap a question you would like to ask about it.",
             explain(
                 ["Every experiment begins with somebody asking a question."],
                 ["You could ask why bees visit the flower.", "Or whether it would grow in sand.", "Then think how to find out.",
                  "For most questions about plants, the answer is to try it and watch."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F33A",
              "questions": ["Why do bees visit the flower?", "Would the plant grow in sand instead of soil?", "Does a bigger seed make a bigger plant?"],
              "findOut": {"ask": "How could we find out?",
                          "opts": [opt("Try it, and watch carefully for a few days", True), opt("Ask the flower", False), opt("Say the first answer that comes into your head", False)],
                          "why": "Trying it and watching is an experiment. That is how scientists answer questions."}},
             "Ask, then try it and watch. That is what scientists do."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Bs.01", "1Bp.03", "1TWSc.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["If it asks about a part, picture the plant: roots at the bottom, then stem, leaves, flower at the top.",
                  "If it asks what a plant needs, think light and water."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which part holds the plant in the soil?", "\U0001FAB4", "roots", ["leaves", "flower", "stem"], "The roots grow down into the soil and hold the plant steady."),
                 q("Which part makes food using sunlight?", "☀️", "leaves", ["roots", "stem", "flower"], "The green leaves catch sunlight to make food."),
                 q("A new plant grows from a...", "\U0001F330", "seed", ["stone", "leaf", "flower"], "A seed holds a tiny new plant inside it."),
                 q("What do plants need to stay alive?", "\U0001F331", "light and water", ["sweets and toys", "only soil", "only air"], "Plants need light and water. You tested both."),
                 q("Which part carries water up to the leaves?", "\U0001F33F", "the stem", ["the flower", "the roots", "the petals"], "The stem carries water from the roots up to the leaves."),
                 q("A plant is kept in a dark cupboard with water. What happens?", "\U0001F6AA", "it goes pale and droopy", ["it grows big and green", "it turns into a flower", "nothing changes"], "You saw it in the experiment. Without light a plant goes pale."),
                 q("Which grew first from the seed?", "\U0001F331", "the root", ["the flower", "the leaves", "the stem"], "The root grows down first, to drink water."),
                 q("A seedling is 3 cubes tall and a sunflower is 8 cubes tall. Which is taller?", "\U0001F4CF", "the sunflower", ["the seedling", "they are the same"], "8 is more than 3, so the sunflower is taller."),
             ]},
             "That is the whole lesson finished. You know a plant from root to flower."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Name the roots, stem, leaves and flower of a plant.",
    "Say what each part does.",
    "Do an experiment to find out whether a plant needs light.",
    "Measure how tall a plant is in cubes.",
]

LESSON["lecture"] = [
    part("\U0001F330", "A seed wakes up",
         "A seed looks dead, but it is not. Give it water and warmth and it wakes up. A root pushes down first. Then a shoot pushes up, towards the light."),
    part("\U0001F33F", "Roots and stem",
         "The roots hold the plant in the soil and drink up water. The stem holds the plant up and carries the water to every part."),
    part("\U0001F343", "Leaves and flower",
         "Leaves catch sunlight and use it to make the plant's food. The flower makes seeds, so there can be new plants next year."),
    part("\u2600\uFE0F", "Light and water",
         "A plant needs water AND light. Take away the water and it droops. Take away the light and it goes pale and thin. You will test that today."),
    part("\U0001F4CF", "Tools and measuring",
         "Scientists use tools. A magnifying glass to look closely. A ruler or cubes to measure. Gloves to keep hands safe. You will measure a plant in cubes."),
]

LESSON["words"] = [
    word("roots", "\U0001F33F", "The parts of a plant under the soil. They hold it up and drink water.",
         ["The roots grow down into the soil.", "Pull up a weed and you can see its roots."]),
    word("stem", "\U0001F331", "The part that holds a plant up and carries water to the leaves.",
         ["A sunflower has a tall stem.", "Water goes up the stem to the leaves."]),
    word("leaf", "\U0001F343", "The flat green part of a plant. Leaves make the plant's food from sunlight.",
         ["A leaf catches sunlight.", "This tree has lost its leaves."]),
    word("flower", "\U0001F338", "The part of a plant that makes seeds.",
         ["The flower is red.", "Bees visit the flower."]),
    word("seed", "\U0001F330", "The small thing a new plant grows from.",
         ["We planted a seed.", "A bean is a seed."]),
    word("shoot", "\U0001F331", "The first green stem that pushes up out of a seed.",
         ["The shoot came up on day five.", "A shoot grows towards the light."]),
    word("measure", "\U0001F4CF", "To find out how long, tall or heavy something is.",
         ["We measure the plant in cubes.", "Measure it again next week."]),
]

LESSON["home"] = [
    home("Grow a bean in a jar", "A dried bean, a glass jar, kitchen paper, water",
         ["Line the jar with wet kitchen paper and push the bean between the paper and the glass.",
          "Keep the paper damp and the jar on a windowsill.",
          "Look every day. Draw what you see."],
         "The root comes first, going DOWN. Then the shoot, going UP."),
    home("Plant in the dark", "Two small plants, a cupboard, water",
         ["Put one plant on a sunny windowsill and one inside a dark cupboard.",
          "Water both the same.",
          "After four days, put them side by side."],
         "The plant from the dark is pale, thin and floppy."),
    home("Measure a plant in cubes", "A plant, some building bricks or sugar cubes",
         ["Stand the bricks in a tower next to the plant.",
          "Count the bricks up to the top leaf.",
          "Do it again in a week."],
         "Did the number go up? By how many?"),
]
