# -*- coding: utf-8 -*-
"""Lesson 1 - Alive or Never Alive.

0097 Stage 1: 1Bp.01 living things and things that have never been alive;
1Bp.02 animals need air, water and suitable food; 1Bp.03 plants need light
and water (the water half - light is Lesson 2's experiment); with 1TWSp.01,
1TWSp.02, 1TWSc.01, 1TWSc.04, 1TWSc.05, 1TWSa.01 and 1SIC.04 exercised on
the way.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "alive-or-never-alive",
    "title": "Alive or Never Alive",
    "blurb": "Sort the living things from the things that were never alive, find out what animals and plants need, and do your first real experiment.",
    "steps": [
        step("demo", "What makes something alive?", "\U0001F410", "Alive!", ["1Bp.01"],
             "Press <b>Next</b> and watch the goat. Living things do four things.",
             explain(
                 ["Alive means a thing grows, eats, drinks and can have babies.", "A thing that was never alive does none of those."],
                 ["Look at the goat.", "It eats grass.", "It drinks water.", "It grew from a tiny kid into a big goat.", "And it can have a baby goat of its own.",
                  "Now look at the stone.", "It never eats, never drinks, never grows and never has a baby stone."],
                 ["Children think anything that moves is alive.", "A car moves and a river moves, but they were never alive.", "Moving is not the test. Growing, eating and having babies are."],
                 ["So press Next, and each time ask: does the goat do this? Does the stone?"]),
             {"frames": [
                 {"pic": "\U0001F410", "cap": "This is a goat. Is it alive? Let us check.", "say": "This is a goat. Is it alive? Let us check four things."},
                 {"pic": "\U0001F410\U0001F33F", "cap": "It <b>eats</b> grass.", "say": "One. It eats grass. Living things eat."},
                 {"pic": "\U0001F410\U0001F4A7", "cap": "It <b>drinks</b> water.", "say": "Two. It drinks water. Living things drink."},
                 {"pic": "\U0001F411➡️\U0001F410", "cap": "It <b>grows</b>. A little kid grows into a big goat.", "say": "Three. It grows. A little kid grows into a big goat."},
                 {"pic": "\U0001F410\U0001F411", "cap": "It can have <b>babies</b>.", "say": "Four. It can have babies. So the goat is alive!"},
                 {"pic": "\U0001FAA8", "cap": "A stone never eats, drinks, grows or has babies. It was <b>never alive</b>.", "say": "Now a stone. Does it eat? No. Drink? No. Grow? No. Have babies? No. A stone was never alive."},
             ]},
             "Alive means it eats, drinks, grows and can have babies. A stone does none of these."),

        step("explore", "Alive, or never alive?", "\U0001F50D", "Looked closely", ["1Bp.01"],
             "Tap each picture and hear whether it is alive.",
             explain(
                 ["Every thing in the world is either alive, or it was never alive."],
                 ["Tap the mango tree.", "A tree does not walk, but it drinks water, it grows taller every year, and it makes seeds that grow into new trees.", "So a tree is alive.",
                  "Tap the spoon.", "It never eats, never grows and never has baby spoons.", "It was never alive."],
                 ["Children say a tree is not alive because it does not move about.", "Plants are alive.", "They grow and they make seeds, and that is enough."],
                 ["Tap every picture and listen for the reason each time."]),
             {"items": [
                 {"pic": "\U0001F415", "label": "dog", "say": "A dog is alive. It eats, drinks, grows and can have puppies."},
                 {"pic": "\U0001F96D", "label": "mango tree", "say": "A mango tree is alive. It drinks water, grows tall and makes seeds for new trees."},
                 {"pic": "\U0001FAA8", "label": "stone", "say": "A stone was never alive. It does not eat, drink or grow."},
                 {"pic": "\U0001F944", "label": "spoon", "say": "A spoon was never alive. Somebody made it. It never grows."},
                 {"pic": "\U0001F425", "label": "chick", "say": "A chick is alive. It eats seeds, drinks and grows into a hen."},
                 {"pic": "\U0001F697", "label": "car", "say": "A car moves, but it was never alive. It does not eat, grow or have babies."},
                 {"pic": "\U0001F33B", "label": "sunflower", "say": "A sunflower is alive. It grows from a seed and drinks water through its roots."},
                 {"pic": "\U0001F9F8", "label": "teddy bear", "say": "A teddy bear was never alive. It looks like a bear, but it never eats or grows."},
             ], "need": 8},
             "You looked closely at eight things. Now you can sort them."),

        step("sort", "Sort them into two bins", "\U0001F5C2️", "Sorted it", ["1Bp.01", "1TWSc.01"],
             "Is it <b>alive</b>, or was it <b>never alive</b>? Tap the right bin.",
             explain(
                 ["Sorting means putting things into groups by looking at what is the same about them."],
                 ["Look at the thing in the box.", "Ask the four questions: does it grow, eat, drink, and can it have babies?", "If yes, tap Alive.", "If no, tap Never alive.",
                  "A hen eats, drinks, grows and lays eggs, so hen goes in Alive.", "A cup does none of those, so cup goes in Never alive."],
                 ["Children put a cloud or a river in Alive because it moves.", "Moving is not the test.", "A river does not eat or have babies."],
                 ["Take your time with each one and say the reason out loud before you tap."]),
             {"ask": "Alive, or never alive?",
              "bins": [{"id": "alive", "label": "Alive", "pic": "\U0001F331"}, {"id": "never", "label": "Never alive", "pic": "\U0001FAA8"}],
              "items": [
                  {"pic": "\U0001F414", "label": "hen", "bin": "alive", "why": "A hen eats, drinks, grows and lays eggs."},
                  {"pic": "☕", "label": "cup", "bin": "never", "why": "A cup never eats or grows. It was never alive."},
                  {"pic": "\U0001F41F", "label": "fish", "bin": "alive", "why": "A fish eats, grows and has baby fish."},
                  {"pic": "\U0001F30A", "label": "river", "bin": "never", "why": "A river moves, but it does not eat, grow or have babies."},
                  {"pic": "\U0001F334", "label": "palm tree", "bin": "alive", "why": "A palm tree drinks water, grows and makes seeds."},
                  {"pic": "\U0001F9F1", "label": "brick", "bin": "never", "why": "A brick was never alive. It does not grow."},
                  {"pic": "\U0001F41D", "label": "bee", "bin": "alive", "why": "A bee eats, grows and there are baby bees in the hive."},
                  {"pic": "☁️", "label": "cloud", "bin": "never", "why": "A cloud moves in the sky, but it does not eat or have babies."},
                  {"pic": "\U0001F33F", "label": "grass", "bin": "alive", "why": "Grass grows. Cut it and it grows back. It is alive."},
                  {"pic": "\U0001F9F8", "label": "toy bear", "bin": "never", "why": "A toy bear was made in a factory. It never eats or grows."},
              ]},
             "Alive things grow, eat, drink and can have babies."),

        step("ask", "Ask a science question", "❓", "Asked why", ["1TWSp.01"],
             "Look at the puppy. Scientists start with a question. Tap one you would like to ask.",
             explain(
                 ["Science starts with a question about the world.", "Then scientists work out how to find the answer."],
                 ["Look at the puppy.", "You could ask: why does it sleep so much?", "Or: what does it eat?", "Any of those is a good science question.",
                  "Then ask: how could we find out?", "The best way is to watch the puppy carefully and see."],
                 ["Children think a question has to be answered by a grown-up.", "Often the best answer comes from looking carefully yourself."],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F436",
              "questions": ["Why does the puppy sleep so much?", "What does the puppy like to eat?", "How big will the puppy grow?"],
              "findOut": {"ask": "How could we find out the answer?",
                          "opts": [opt("Watch the puppy carefully every day and see", True), opt("Just guess", False), opt("Ask the puppy", False)],
                          "why": "Watching carefully is called observing. Scientists find answers by observing."}},
             "A good scientist asks a question, then watches carefully to find out."),

        step("demo", "What animals need", "\U0001F431", "Air, water, food", ["1Bp.02"],
             "Press <b>Next</b>. Every animal, and you, needs three things to stay alive.",
             explain(
                 ["Animals need air, water and the right food to stay alive.", "People are animals too, so you need them as well."],
                 ["Take a breath in.", "That is air going into your body, and you need it every minute.",
                  "When you feel thirsty, your body is asking for water.", "When you feel hungry, your body is asking for food.",
                  "A cat needs the same three things.", "It breathes air, drinks water and eats cat food."],
                 ["Children say a cat needs a toy or a bed.", "Those are nice, but a cat can live without them.", "It cannot live without air, water and food."],
                 ["Press Next and say the three needs with me: air, water, food."]),
             {"frames": [
                 {"pic": "\U0001F431", "cap": "A cat is an animal. What does it need to stay alive?", "say": "A cat is an animal. What does it need to stay alive? Three things."},
                 {"pic": "\U0001F32C️", "cap": "<b>Air.</b> It breathes in and out all day.", "say": "Air. The cat breathes in and out all day, even when it is asleep."},
                 {"pic": "\U0001F4A7", "cap": "<b>Water.</b> It drinks when it is thirsty.", "say": "Water. The cat drinks when it is thirsty."},
                 {"pic": "\U0001F35B", "cap": "<b>The right food.</b> Cat food, not sweets.", "say": "The right food. A cat eats cat food, not sweets. Every animal has food that is right for it."},
                 {"pic": "\U0001F9D2", "cap": "You are an animal too. You need <b>air, water and food</b>.", "say": "You are an animal too. You need air, water and food, just like the cat."},
             ]},
             "Every animal needs air, water and the right food."),

        step("sort", "What does the cat need?", "\U0001F37D️", "Needs it", ["1Bp.02", "1TWSc.01"],
             "Does the cat <b>need</b> this to stay alive? Tap the right bin.",
             explain(
                 ["Need means cannot live without it.", "Want means it would be nice to have."],
                 ["Water: can the cat live without water? No. So it is a need.", "A ball of wool: fun, but the cat can live without it. So it is not a need."],
                 ["Children put a bed in Needs because the cat sleeps in it.", "A cat can sleep on the floor. The bed is not a need."],
                 ["For each thing ask: could the cat stay alive without it?"]),
             {"ask": "Does the cat need this to stay alive?",
              "bins": [{"id": "need", "label": "Needs it", "pic": "✅"}, {"id": "want", "label": "Does not need it", "pic": "❌"}],
              "items": [
                  {"pic": "\U0001F4A7", "label": "water", "bin": "need", "why": "A cat cannot live without water."},
                  {"pic": "\U0001F9F6", "label": "ball of wool", "bin": "want", "why": "Fun to chase, but a cat can live without it."},
                  {"pic": "\U0001F32C️", "label": "air", "bin": "need", "why": "A cat has to breathe air every minute."},
                  {"pic": "\U0001F6CF️", "label": "cat bed", "bin": "want", "why": "Cosy, but a cat can sleep anywhere."},
                  {"pic": "\U0001F35B", "label": "cat food", "bin": "need", "why": "A cat cannot live without the right food."},
                  {"pic": "\U0001F380", "label": "ribbon", "bin": "want", "why": "A ribbon is pretty, but a cat does not need it."},
                  {"pic": "\U0001F4FA", "label": "television", "bin": "want", "why": "A cat does not need a television."},
              ]},
             "Air, water and the right food. Everything else is a want."),

        step("experiment", "Does a plant need water?", "\U0001F9EA", "Experiment!", ["1Bp.03", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Two plants. We will <b>water one</b> and give the other <b>no water</b>. First, predict!",
             explain(
                 ["An experiment is a fair test.", "Two plants that are the same, and we change only one thing: the water."],
                 ["First you predict.", "That means you say what you think will happen before we start.",
                  "Then we water one plant every day and give the other nothing, and we wait five days.",
                  "Then you say what happened, and whether it matched your prediction."],
                 ["Children think a wrong prediction means they did badly.", "It does not.", "Scientists are wrong all the time. What matters is looking carefully at what really happened."],
                 ["Tap your prediction, then press the button once for each day and watch both plants."]),
             {"sim": "plantWater",
              "predict": {"ask": "What do you think will happen to the plant with <b>no water</b>?",
                          "opts": [opt("It will droop and go yellow", True), opt("It will grow bigger than the other one", False), opt("Nothing will change", False)]},
              "runAsk": "Press the button once for each day. Watch the plant with no water.",
              "happened": {"ask": "What happened to the plant with no water?",
                           "opts": [opt("It drooped and went yellow", True), opt("It grew taller", False), opt("It stayed exactly the same", False)],
                           "why": "Without water the plant drooped and its leaves went yellow. Plants need water to stay alive."}},
             "Plants need water. Without it they droop and go yellow."),

        step("record", "Record what you saw", "\U0001F4DD", "Recorded it", ["1TWSc.05", "1Bp.03"],
             "Scientists write down what happened. Fill in the table for <b>%s</b>.",
             explain(
                 ["A table is a tidy way to write down what you saw, so you do not forget and so other people can read it."],
                 ["Each row is one plant.", "The second column is what it looked like after five days.",
                  "The watered plant was fresh and green.", "The plant with no water was droopy and yellow.", "Tap the row, then tap the picture that matches."],
                 ["Children write down what they expected instead of what they saw.", "A table only holds what really happened."],
                 ["Think back to the experiment and fill in each row."]),
             {"ask": "After five days, what did the %s look like?",
              "columns": ["Plant", "After 5 days"],
              "rows": [
                  {"pic": "\U0001F4A7", "label": "watered plant", "answer": "fresh", "why": "the watered plant stayed fresh and green."},
                  {"pic": "\U0001F6AB", "label": "plant with no water", "answer": "droopy", "why": "the plant with no water drooped and went yellow."},
              ],
              "choices": [{"id": "fresh", "t": "Fresh and green", "pic": "\U0001F33F"}, {"id": "droopy", "t": "Droopy and yellow", "pic": "\U0001F940"}]},
             "That is a real science table, and you filled it in."),

        step("context", "Caring for living things", "\U0001F49A", "I care", ["1SIC.04", "1Bp.02", "1Bp.03"],
             "Living things need us to look after them. Tap each picture to hear how.",
             explain(
                 ["Because we know what living things need, we can look after them, and we can stop hurting them by mistake."],
                 ["A plant in a pot cannot walk to a river.", "Somebody has to water it.",
                  "A goat in a pen cannot open the food sack.", "Somebody has to feed it.",
                  "Rubbish thrown in a river can hurt the fish that live there."],
                 ["Children think nature looks after itself.", "The living things near people depend on people."],
                 ["Tap each picture, then answer the question."]),
             {"items": [
                 {"pic": "\U0001FAB4", "label": "water the plant", "say": "A plant in a pot cannot find its own water. Water it and it stays green."},
                 {"pic": "\U0001F410", "label": "feed the goat", "say": "A goat in a pen needs somebody to bring food and clean water every day."},
                 {"pic": "\U0001F41F", "label": "keep the river clean", "say": "Rubbish in a river can hurt the fish. Keeping it clean keeps them alive."},
                 {"pic": "\U0001F333", "label": "plant a tree", "say": "A new tree gives shade, and a home for birds. Science tells us what it needs to grow."},
             ], "need": 4,
              "then": {"ask": "Your pot plant is drooping. What does it most likely need?",
                       "opts": [opt("Water", True), opt("A bigger pot", False), opt("A toy", False)],
                       "why": "You saw it in the experiment: a plant with no water droops. Water it."}},
             "Knowing what living things need helps us look after them."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Bp.01", "1Bp.02", "1Bp.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["If it asks whether a thing is alive, ask the four questions: does it grow, eat, drink, have babies?",
                  "If it asks what an animal needs, think air, water, food.", "If it asks about plants, think water and light."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which one is alive?", "❓", "a camel", ["a rock", "a metal spoon", "a plastic cup"], "A camel eats, drinks, grows and can have babies. It is alive."),
                 q("Which one was never alive?", "❓", "a stone", ["a mango tree", "a goat", "a bird"], "A stone never eats, grows or has babies. It was never alive."),
                 q("A car moves along the road. Is it alive?", "\U0001F697", "No. Moving is not enough. It never eats or grows.", ["Yes, because it moves", "Yes, because it is big"], "Moving is not the test. A car never eats, grows or has baby cars."),
                 q("What does a cat need to stay alive?", "\U0001F431", "air, water and food", ["a bed and a toy", "a television", "a ribbon"], "Every animal needs air, water and the right food."),
                 q("You feel thirsty. What is your body asking for?", "\U0001F9D2", "water", ["a toy", "a nap", "a hat"], "Thirsty means your body needs water. You are a living thing."),
                 q("A plant gets no water for five days. What happens?", "\U0001FAB4", "it droops and goes yellow", ["it grows bigger", "it turns into a tree", "nothing changes"], "You saw it in the experiment. Plants need water."),
                 q("A mango tree does not walk about. Is it alive?", "\U0001F96D", "Yes. It grows, drinks water and makes seeds.", ["No, because it does not move", "No, because it is made of wood"], "Plants are alive. They grow, drink and make new seeds."),
                 q("A hen has chicks. What does that tell you?", "\U0001F414", "The hen is alive, because living things can have babies.", ["The hen is a plant", "The hen was never alive"], "Only living things can have young."),
             ]},
             "That is the whole lesson finished. You know what alive means."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say whether something is alive or was never alive.",
    "Name what every animal needs: air, water and the right food.",
    "Do an experiment with a plant and say what happened.",
    "Fill in a science table.",
]

LESSON["lecture"] = [
    part("\U0001F410", "What alive means",
         "Look at a goat. It eats grass. It drinks water. It grows from a little kid into a big goat. It can have babies. Anything that does all of that is alive."),
    part("\U0001FAA8", "Never alive",
         "Now look at a stone. It does not eat. It does not drink. It never grows and it never has babies. A stone was never alive. Neither was a spoon, a car or a teddy bear."),
    part("\U0001F431", "What animals need",
         "Every animal needs three things to stay alive. Air to breathe. Water to drink. And the right food. A cat does not need a ball of wool. It wants one. That is different."),
    part("\U0001F331", "What plants need",
         "Plants are alive too. They do not eat like animals. They need water from the soil, light from the Sun, and air. Today you will find out what happens to a plant with no water."),
    part("\U0001F52C", "Being a scientist",
         "A scientist looks closely, asks a question, tries something, and writes down what happened. That is what you will do in this lesson. Ready? Let us go."),
]

LESSON["words"] = [
    word("alive", "\U0001F423", "Something that eats or drinks, grows, and can have babies.",
         ["A chick is alive. It eats, drinks and grows.", "My cat is alive, but my toy cat is not."]),
    word("non-living", "\U0001FAA8", "Something that was never alive. It does not eat, grow or have babies.",
         ["A stone is non-living.", "A spoon is a non-living thing."]),
    word("animal", "\U0001F415", "A living thing that moves about and eats to stay alive.",
         ["A dog is an animal.", "Every animal needs air, water and food."]),
    word("plant", "\U0001F331", "A living thing that grows in soil and makes its own food from sunlight.",
         ["A sunflower is a plant.", "The plant needs water, or it droops."]),
    word("need", "\U0001F4A7", "Something you must have to stay alive.",
         ["Water is a need. A toy is not.", "A cat needs air, water and food."]),
    word("grow", "\U0001F4C8", "To get bigger and change over time.",
         ["A kid grows into a goat.", "The plant grew taller after we watered it."]),
    word("experiment", "\U0001F9EA", "A fair test you do to find out an answer.",
         ["Our experiment showed that a plant needs water.", "Predict first, then do the experiment."]),
]

LESSON["home"] = [
    home("Two plants, one watering can", "Two small plants or two cuttings in cups, water, a sunny windowsill",
         ["Put both plants on the windowsill.",
          "Water one plant every day. Give the other no water at all.",
          "Look at both plants every day for a week, and say what you see."],
         "Which plant droops and goes yellow, and how many days it takes."),
    home("Alive or never alive hunt", "A garden or a park, paper and a pencil",
         ["Walk round slowly and point at ten things.",
          "For each one, ask: does it eat, drink, grow or have babies?",
          "Draw two lists: alive, and never alive."],
         "Things that trick you, like a fallen leaf. It WAS alive."),
    home("Feed a pet, or a bird", "A pet, or a bird table with seeds and a dish of water",
         ["Put out food and water.",
          "Watch from a window, without moving, for five minutes.",
          "Say which of the three needs you gave: air, water or food."],
         "Whether the animal eats, drinks, or both."),
]
