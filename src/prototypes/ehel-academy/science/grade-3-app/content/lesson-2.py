# -*- coding: utf-8 -*-
"""Lesson 2 - Flowering Plants.

0097 Stage 3: 3Bs.01 the function of roots, leaves, stems and flowers;
3Bp.03 plants need the right temperature, light and water to be healthy;
with 3TWSp.03 (predict), 3TWSa.01 (did the results support it), 3TWSa.03
(a conclusion), 3TWSc.06 (record in a table) and 3TWSp.02.
"""
from _kit import explain, step, opt, q, part, word, home, icon

PARTS = [
    {"id": "roots", "label": "roots", "say": "The roots. They anchor the plant in the soil and take in water and minerals."},
    {"id": "stem", "label": "stem", "say": "The stem. It holds the plant up and carries water from the roots to every leaf and flower."},
    {"id": "leaves", "label": "leaves", "say": "The leaves. They catch sunlight and use it to make the plant's food."},
    {"id": "flower", "label": "flower", "say": "The flower. It makes seeds, so there can be new plants."},
]

LESSON = {
    "slug": "flowering-plants",
    "title": "Flowering Plants",
    "blurb": "Name what each part of a flowering plant does, find out what happens to a plant kept in the cold, record it in a table, and draw a conclusion like a scientist.",
    "steps": [
        step("label", "The parts of a flowering plant", "\U0001F33B", "Plant parts", ["3Bs.01"],
             "Tap the <b>%s</b>.",
             explain(
                 ["A flowering plant has four main parts, and each one has a job."],
                 ["Roots, under the soil.", "The stem, standing up.", "Leaves, spread out to the light.", "The flower, at the top."],
                 ["Children think the flower is the whole plant.", "The flower is one part, and it has one job: making seeds."],
                 ["Listen for the part, then tap it."]),
             {"figure": "plant", "ask": "Tap the %s.", "parts": PARTS},
             "Roots, stem, leaves, flower."),

        step("explore", "What each part does", "\U0001F331", "Part jobs", ["3Bs.01"],
             "Each part has a job. Tap each one to hear it.",
             explain(
                 ["Roots take in water and hold the plant still.", "The stem carries the water up and holds the plant up.",
                  "Leaves make food from sunlight.", "The flower makes seeds."],
                 ["Pull a plant up and the roots are the hairy part.", "Cut a stem and it is wet inside: that is the water going up.",
                  "A leaf is flat and wide to catch as much light as it can.", "Inside a flower, after the petals fall, the seeds grow."],
                 ["Children think roots eat the soil.", "Roots take in water and minerals dissolved in it. The food is made in the leaves."],
                 ["Tap all four and say the job out loud."]),
             {"items": [
                 {"pic": icon("roots"), "label": "roots", "sub": "anchor, take in water", "say": "Roots anchor the plant so the wind cannot blow it over, and they take in water and minerals from the soil."},
                 {"pic": "\U0001F331", "label": "stem", "sub": "holds up, carries water", "say": "The stem holds the plant up towards the light and carries water from the roots to the leaves and flowers."},
                 {"pic": "\U0001F343", "label": "leaves", "sub": "make food from light", "say": "Leaves are wide and flat to catch sunlight. They use the light to make the plant's food. That is why leaves spread out towards the light."},
                 {"pic": "\U0001F33C", "label": "flower", "sub": "makes seeds", "say": "The flower makes seeds. Its bright petals attract insects, and after the petals fall the seeds grow."},
             ], "need": 4,
              "then": {"ask": "A plant's leaves are torn off by a goat. Which job can the plant no longer do well?",
                       "opts": [opt("making its food from sunlight", True), opt("taking in water", False), opt("standing up", False)],
                       "why": "Leaves make the food. Without them the plant starves, even with water."}},
             "Roots take in water, the stem carries it, leaves make food, the flower makes seeds."),

        step("experiment", "Does a plant need warmth?", "\U0001F321️", "Warm or cold", ["3Bp.03", "3TWSp.03", "3TWSa.01", "3TWSa.03"],
             "Two plants, watered the same, in the same light. One stays somewhere warm. One goes somewhere very cold. Predict first.",
             explain(
                 ["A plant needs water, light and the right temperature to stay healthy."],
                 ["Both plants get the same water and the same light.", "Only one thing changes: how warm they are.", "That is a fair test."],
                 ["Children think water and light are enough.", "Keep a plant somewhere very cold, in the same light, and watch."],
                 ["Predict, try it, say what happened, then conclude."]),
             {"sim": "plantWarm",
              "predict": {"ask": "What will happen to the plant in the <b>cold</b> after five days?",
                          "opts": [opt("It will stop growing and droop", True), opt("It will grow just as well", False), opt("It will grow faster", False)]},
              "runAsk": "Press Wait a day, five times. Watch both plants.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The warm plant stayed healthy; the cold plant drooped and its leaves went yellow", True), opt("Both plants stayed healthy", False), opt("The cold plant grew taller", False)],
                           "why": "Same water, same light. Only the cold was different, and the cold plant drooped. Temperature matters."},
              "conclude": {"ask": "What does this tell us?",
                           "opts": [opt("Plants need the right temperature to be healthy, as well as water and light", True), opt("Plants do not need light", False), opt("Cold makes plants grow", False)],
                           "why": "The only thing that changed was temperature, and it made the difference. A plant needs warmth, water and light."}},
             "Plants need the right temperature, as well as water and light."),

        step("record", "Record what you saw", "\U0001F4CB", "Plant table", ["3TWSc.06", "3Bp.03"],
             "Fill in the table. What was the <b>%s</b> like on day five?",
             explain(
                 ["A table keeps results tidy, so you can compare them."],
                 ["One row for the warm plant, one for the cold plant.", "Write what each looked like on day five."],
                 [],
                 ["Tap the right answer for each row."]),
             {"ask": "On day five, what was the %s like?",
              "columns": ["Plant", "On day five"],
              "rows": [
                  {"pic": "☀️", "label": "warm plant", "answer": "healthy", "why": "the warm plant, with water and light, stayed healthy and green."},
                  {"pic": "❄️", "label": "cold plant", "answer": "drooping", "why": "the cold plant drooped and went yellow, even with the same water and light."},
              ],
              "choices": [{"id": "healthy", "t": "healthy and green", "pic": "\U0001F331"}, {"id": "drooping", "t": "drooping and yellow", "pic": "\U0001F940"}]},
             "Two rows, two results, one difference: the temperature."),

        step("demo", "Three things a plant needs", "\U0001F4A7", "Plant needs", ["3Bp.03"],
             "Press <b>Next</b> to see what happens when a plant is short of each thing.",
             explain(
                 ["Water, light and the right temperature. Take any one away and the plant suffers."],
                 ["No water: it wilts.", "No light: it goes pale and thin.", "Too cold: it stops growing and droops.", "Too hot: it dries out."],
                 ["Children think more of everything is always better.", "Too much water drowns the roots. The right amount is what a plant needs."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F331", "cap": "A healthy plant: water, light and the right temperature.", "say": "A healthy plant has water, light and the right temperature. All three."},
                 {"pic": "\U0001F940", "cap": "<b>No water</b>: it wilts and its leaves go yellow.", "say": "Take away the water and it wilts. The leaves droop and go yellow."},
                 {"pic": "\U0001F319", "cap": "<b>No light</b>: it goes pale and thin, reaching for light.", "say": "Take away the light and it goes pale and thin, stretching towards any light it can find."},
                 {"pic": "❄️", "cap": "<b>Too cold</b>: it stops growing and droops.", "say": "Make it too cold and it stops growing and droops. That is what you saw in the cold place."},
                 {"pic": "\U0001F525", "cap": "<b>Too hot</b>: it dries out fast.", "say": "Make it too hot and it dries out. The right temperature is not too cold and not too hot."},
             ]},
             "Water, light, and the right temperature."),

        step("questions", "Plant check", "✅", "Plant check", ["3Bs.01", "3Bp.03"],
             "Tap the answer.",
             explain(
                 ["The parts and their jobs, and what a plant needs."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which part takes in water from the soil?", icon("roots"), "the roots", ["the flower", "the leaves", "the stem"], "Roots take in water and minerals."),
                 q("Which part makes the plant's food?", "\U0001F343", "the leaves", ["the roots", "the flower"], "Leaves make food from sunlight."),
                 q("Which part makes seeds?", "\U0001F33C", "the flower", ["the stem", "the roots"], "The flower's job is seeds."),
                 q("A plant has water and light but is kept somewhere very cold. What happens?", "❄️", "it droops and stops growing", ["it grows well", "it grows faster"], "You saw it. Too cold, and a plant is not healthy."),
                 q("Which three things does a plant need to be healthy?", "\U0001F331", "water, light and the right temperature", ["water, sugar and music", "light, soil and wind"], "Water, light, temperature."),
             ]},
             "You know your plants."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Bs.01", "3Bp.03", "3TWSa.01", "3TWSa.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("The stem's job is to...", "\U0001F331", "hold the plant up and carry water", ["make seeds", "take in water from the soil", "catch sunlight"], "Holds it up, carries water."),
                 q("Why are leaves wide and flat?", "\U0001F343", "to catch as much sunlight as they can", ["to hold water", "to look pretty"], "More light, more food."),
                 q("What are the roots for?", icon("roots"), "anchoring the plant and taking in water", ["making food", "making seeds"], "Anchor and drink."),
                 q("In the cold-plant experiment, what was the one thing that changed?", "\U0001F321️", "the temperature", ["the water", "the light", "the pot"], "Only the temperature. That is what made it a fair test."),
                 q("You predicted the cold plant would droop, and it did. Did the results support your prediction?", "✅", "yes", ["no", "you cannot tell"], "The result matched the prediction, so it supported it."),
                 q("What conclusion did you make?", "\U0001F4DD", "plants need the right temperature to stay healthy", ["plants do not need water", "cold makes plants grow taller"], "That is what the result showed."),
                 q("Why did both plants get the same water and the same light?", "\u2696\ufe0f", "so only the temperature changed, and the test was fair", ["so the plants would look pretty", "because a plant only needs one thing"], "If two things changed, you could not tell which one made the plant droop."),
                 q("A plant in a dark cupboard, with water, will...", "\U0001F319", "go pale and thin", ["stay green", "make more flowers"], "No light, no food."),
                 q("The flower's job is...", "\U0001F33C", "making seeds", ["making food", "holding the plant up"], "Seeds for new plants."),
                 q("What would happen to a plant if its roots were cut off?", "\U0001F331", "it could not take in water, so it would droop", ["it would grow more flowers", "nothing, because roots have no job"], "Roots take in water from the soil. Without them the plant dries out."),
                 q("You want to test if a plant needs light. Which is the fair test?", "\U0001F4A1", "two plants with the same water and warmth, one in the light and one in the dark", ["one plant in the light with water, one in the dark with no water", "one plant in the light, looked at only once"], "Change only the light. Keep everything else the same."),
             ]},
             "That is the whole lesson finished. You know what a plant needs and what its parts do."),
    ],
}

LESSON["about"] = [
    "Say what the roots, stem, leaves and flower each do.",
    "Predict, test and record what happens to a plant kept in the cold.",
    "Say whether your results supported your prediction.",
    "Make a conclusion: plants need water, light and the right temperature.",
]

LESSON["warmup"] = [
    q("Is a growing plant living, once alive, or never alive?", "\U0001F331", "living", ["once alive", "never alive"], "A plant grows, takes in food and makes seeds. It is living."),
    q("Which life process do plants and animals share?", "\U0001F4C8", "growth", ["talking", "flying"], "Every living thing grows."),
]

LESSON["lecture"] = [
    part(icon("roots"), "Roots and stem",
         "The roots hold the plant in the soil so the wind cannot blow it over, and they take in water. The stem holds the plant up and carries that water to every leaf and flower."),
    part("\U0001F343", "Leaves and flower",
         "Leaves are wide and flat to catch sunlight, and they use it to make the plant's food. The flower makes seeds, so there can be new plants next year."),
    part("\U0001F321️", "Warm or cold",
         "A plant needs water and light. But it also needs the right temperature. Today you will keep one plant warm and put one somewhere very cold, with the same water and the same light, and see what happens."),
    part("⚖️", "A fair test",
         "Only one thing changes: the temperature. Everything else stays the same. That is what makes it a fair test. If the cold plant droops, you know why."),
    part("\U0001F4DD", "A conclusion",
         "After an experiment, a scientist asks two things. Did the result support my prediction? And what does it tell me? That second answer is a conclusion. You will make one today."),
]

LESSON["words"] = [
    word("roots", icon("roots"), "The parts under the soil that anchor a plant and take in water.",
         ["The roots take in water.", "Roots hold the tree in the ground."]),
    word("stem", "\U0001F331", "The part that holds a plant up and carries water to the leaves.",
         ["Water travels up the stem.", "A tree trunk is a very thick stem."]),
    word("temperature", "\U0001F321️", "How hot or cold something is.",
         ["Plants need the right temperature.", "A frosty night can be too cold for a plant."]),
    word("healthy", "\U0001F331", "Growing well, with everything it needs.",
         ["The warm plant stayed healthy.", "A healthy plant is green and upright."]),
    word("wilt", "\U0001F940", "To droop because a plant is short of water or is too cold.",
         ["The plant began to wilt in the cold.", "Without water, leaves wilt."]),
    word("prediction", "\U0001F52E", "What you think will happen, said before you test it.",
         ["My prediction was that the cold plant would droop.", "Make a prediction, then test it."]),
    word("conclusion", "\U0001F4DD", "What your results tell you about the question you asked.",
         ["My conclusion is that plants need warmth.", "A conclusion comes from the results."]),
]

LESSON["home"] = [
    home("Warm plant, cold plant", "Two small plants in pots, water, a warm bright windowsill, a cold but bright place, a grown-up",
         ["A grown-up finds a cold, bright place, such as a shady window in the coldest room. If there is none, skip this one. Never use a fridge, because it is dark inside.",
          "Water both plants the same. Put one on the warm windowsill and one in the cold, bright place.",
          "Each day, look at both and draw them.",
          "After five days, put them side by side and compare."],
         "Same water, same light, only colder. If the cold place is cold enough, that plant stops growing and droops. Say the conclusion out loud."),
    home("Celery drinks", "A stick of celery with leaves, a clear plastic cup of water, food colouring, a grown-up",
         ["Put a few drops of food colouring in the water.",
          "Stand the celery in it overnight.",
          "A grown-up cuts the stem across. Look at the cut end."],
         "Coloured dots in the stem: the tubes that carry water up to the leaves."),
    home("Find the four parts", "A weed from a garden, a park edge or a pot, with a grown-up who says it is safe to pull up",
         ["Pull up the weed the grown-up chose, gently, roots and all.",
          "Lay it out and find the roots, the stem, the leaves and a flower if it has one.",
          "Say what each part does. Wash your hands afterwards."],
         "The roots are the hairy part. Are they longer than you expected?"),
]
