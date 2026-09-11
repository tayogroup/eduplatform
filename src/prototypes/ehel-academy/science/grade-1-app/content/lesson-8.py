# -*- coding: utf-8 -*-
"""Lesson 8 - Our Earth, Our Sun.

0097 Stage 1 Earth and Space, all four: 1ESp.01 Earth is mostly covered in
water; 1ESp.02 land is rock and soil; 1ESs.01 Earth is the planet we live
on; 1ESs.02 the Sun is a source of heat and light and one of many stars;
with 1TWSp.01, 1TWSp.02, 1TWSc.01, 1TWSc.04, 1TWSc.05, 1TWSa.01, 1SIC.01
and 1SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "our-earth-our-sun",
    "title": "Our Earth, Our Sun",
    "blurb": "Zoom out from your house to the whole planet, catch a globe ten times to find out how much of Earth is water, dig into the ground, and test the heat of the Sun.",
    "steps": [
        step("demo", "Where do we live?", "\U0001F30D", "Planet Earth", ["1ESs.01"],
             "Press <b>Next</b> and zoom out, from your house to the whole planet.",
             explain(
                 ["We live on a planet.", "A planet is a huge round ball in space, and ours is called Earth."],
                 ["Start at your house.", "Zoom out and you see your town.", "Zoom out more and you see your whole country.",
                  "Zoom out again and you see the whole Earth: a round ball, blue and green, floating in space.", "Everyone you know lives on it."],
                 ["Children think the Earth is flat because the ground looks flat.", "It is so big that a little piece of it looks flat. From space it is round."],
                 ["Press Next and watch the picture get further away."]),
             {"button": "Zoom out ▶", "frames": [
                 {"scene": {"id": "zoom", "state": 0}, "cap": "Your <b>house</b>.", "say": "Here is your house."},
                 {"scene": {"id": "zoom", "state": 1}, "cap": "Zoom out: your <b>town</b>, with lots of houses.", "say": "Zoom out. Your town, with lots of houses and roads."},
                 {"scene": {"id": "zoom", "state": 2}, "cap": "Zoom out: your <b>country</b>.", "say": "Zoom out again. Your whole country, with many towns."},
                 {"scene": {"id": "zoom", "state": 3}, "cap": "Zoom out: the whole <b>Earth</b>. A round planet in space. We all live on it.", "say": "Zoom out one more time. The whole Earth. A round planet floating in space, and every person you know lives on it."},
                 {"scene": {"id": "globe", "state": 0}, "cap": "Earth is <b>blue</b> and <b>green</b>. Blue is water, green is land.", "say": "Look at the colours. Blue is water. Green is land. There is a lot of blue."},
             ]},
             "Earth is the planet we live on. It is round, and mostly blue."),

        step("experiment", "Mostly water?", "\U0001F9EA", "Globe catch", ["1ESp.01", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Is Earth mostly water or mostly land? Predict, then catch the globe ten times and see where your finger lands.",
             explain(
                 ["Here is a way to find out what most of Earth is covered by: throw a globe, catch it, and look under your finger."],
                 ["Predict first: more water or more land?", "Then catch the globe ten times.", "Each time, see if your finger landed on blue water or green land.",
                  "Count them up."],
                 ["Children think there is more land because they live on land.", "Most of Earth is ocean. The catches will show it."],
                 ["Tap your prediction, then press Catch it ten times and count."]),
             {"sim": "globeCatch",
              "predict": {"ask": "Which do you think there is <b>more</b> of on Earth?",
                          "opts": [opt("More water than land", True), opt("More land than water", False), opt("Exactly the same amount", False)]},
              "runAsk": "Press Catch it! ten times. Water or land under your finger?",
              "happened": {"ask": "What happened in your ten catches?",
                           "opts": [opt("More landed on water than on land", True), opt("More landed on land than on water", False), opt("Every catch landed on land", False)],
                           "why": "Seven catches landed on water and three on land. Earth is mostly covered in water."}},
             "Earth is mostly covered in water."),

        step("record", "Count the catches", "\U0001F4DD", "Tally table", ["1TWSc.05", "1ESp.01"],
             "Put your catches into the table. How many landed on <b>%s</b>?",
             explain(
                 ["A tally table counts how many times each thing happened."],
                 ["Seven catches landed on water.", "Three landed on land.", "Seven and three make ten, all the catches."],
                 [],
                 ["Fill in both rows."]),
             {"ask": "How many of your 10 catches landed on %s?",
              "columns": ["Where", "Catches out of 10"],
              "rows": [
                  {"pic": "\U0001F4A7", "label": "water", "answer": "7", "why": "seven catches landed on water."},
                  {"pic": "⛰️", "label": "land", "answer": "3", "why": "three catches landed on land."},
              ],
              "choices": [{"id": "3", "t": "3", "pic": "3️⃣"}, {"id": "5", "t": "5", "pic": "5️⃣"}, {"id": "7", "t": "7", "pic": "7️⃣"}]},
             "Seven water, three land. That is most of Earth."),

        step("demo", "Dig into the land", "⛏️", "Rock and soil", ["1ESp.02"],
             "What is land made of? Press <b>Dig</b> and go down.",
             explain(
                 ["Land is made of two things: soil on top, and rock underneath."],
                 ["On the top is grass.", "Dig down and you find soil: dark, crumbly, with little stones in it.",
                  "Dig deeper and the soil runs out and you hit solid rock.", "Rock goes down a very long way."],
                 ["Children think it is soil all the way down.", "Soil is only a thin layer. Under it, everywhere, is rock."],
                 ["Press Dig and watch what you find at each level."]),
             {"button": "Dig ⛏️", "frames": [
                 {"scene": {"id": "ground", "state": 0}, "cap": "On top is <b>grass</b>. What is underneath?", "say": "On top is grass. What is underneath? Let us dig."},
                 {"scene": {"id": "ground", "state": 1}, "cap": "Under the grass is <b>soil</b>: dark and crumbly.", "say": "Under the grass is soil. It is dark and crumbly, and plants grow in it.", "sound": "thud"},
                 {"scene": {"id": "ground", "state": 2}, "cap": "In the soil are little <b>stones</b>. Stones are tiny bits of rock.", "say": "In the soil are little stones. A stone is a tiny piece of rock.", "sound": "thud"},
                 {"scene": {"id": "ground", "state": 3}, "cap": "Deeper down, hard <b>rock</b>. Land is soil on top and rock below.", "say": "Deeper down, the spade hits hard rock. Land is soil on top and rock underneath, everywhere.", "sound": "click"},
             ]},
             "Land is made of soil on top and rock underneath."),

        step("sort", "Rock, soil or water?", "\U0001F5C2️", "Earth sorter", ["1ESp.02", "1ESp.01", "1TWSc.01"],
             "Is this <b>rock</b>, <b>soil</b> or <b>water</b>? Tap the right bin.",
             explain(
                 ["The land and the sea are made of rock, soil and water."],
                 ["A pebble is rock.", "A mountain is a huge piece of rock.", "The soil in a flower pot is soil.", "The sea is water."],
                 ["Children think sand is soil.", "Sand is tiny bits of rock, ground up by the sea."],
                 ["Look at each one and decide: rock, soil or water?"]),
             {"ask": "Rock, soil, or water?",
              "bins": [{"id": "rock", "label": "Rock", "pic": "\U0001FAA8"}, {"id": "soil", "label": "Soil", "pic": icon("soil")}, {"id": "water", "label": "Water", "pic": "\U0001F4A7"}],
              "items": [
                  {"pic": "\U0001FAA8", "label": "pebble", "bin": "rock", "why": "A pebble is a small, smooth piece of rock."},
                  {"pic": "\U0001F30A", "label": "the sea", "bin": "water", "why": "The sea is water, and it covers most of Earth."},
                  {"pic": "\U0001F33E", "label": "garden soil", "bin": "soil", "why": "Garden soil is dark and crumbly. Plants grow in it."},
                  {"pic": "\U0001F3D4️", "label": "mountain", "bin": "rock", "why": "A mountain is a huge piece of rock."},
                  {"pic": "\U0001F30A", "label": "river", "bin": "water", "why": "A river is water flowing over the land."},
                  {"pic": "\U0001FAB4", "label": "soil in a flower pot", "bin": "soil", "why": "The soil in a flower pot is where the plant's roots grow."},
                  {"pic": "\U0001F3D6️", "label": "sand", "bin": "rock", "why": "Sand is tiny bits of rock, ground up by the sea."},
                  {"pic": "\U0001F3DE️", "label": "lake", "bin": "water", "why": "A lake is water."},
              ]},
             "Rock, soil and water. That is the surface of Earth."),

        step("demo", "The Sun brings light and heat", "☀️", "Sunrise", ["1ESs.02"],
             "Press <b>Next</b> and watch the Sun come up. What does it bring?",
             explain(
                 ["The Sun gives us two things: light and heat."],
                 ["At night, with no Sun, it is dark and cooler.", "The Sun rises, and the sky fills with light.",
                  "By the middle of the day the Sun is high and the ground is warm.", "Stand in the sunshine and you feel the heat on your skin."],
                 ["Children think the Moon gives light at night the same way.", "The Moon only bounces the Sun's light back. It makes none of its own."],
                 ["Press Next and watch the light and the heat arrive."]),
             {"frames": [
                 {"scene": {"id": "sky", "state": 0}, "cap": "Night. No Sun. It is <b>dark</b> and <b>cooler</b>.", "say": "Night time. The Sun has gone down. It is dark, and it is cooler."},
                 {"scene": {"id": "sky", "state": 1}, "cap": "The Sun rises. <b>Light</b> fills the sky.", "say": "The Sun rises. Light fills the sky. The Sun is a source of light."},
                 {"scene": {"id": "sky", "state": 2}, "cap": "Midday. The Sun is high. The ground is <b>warm</b>.", "say": "Midday. The Sun is high. Touch the ground and it is warm. The Sun is a source of heat."},
                 {"pic": "☀️\U0001F9D2", "cap": "Stand in the sunshine. Feel the <b>heat</b> on your skin.", "say": "Stand in the sunshine. Feel the heat on your skin. That heat came all the way from the Sun."},
                 {"pic": "⚠️☀️", "cap": "Never look straight at the Sun. It is so bright it can hurt your eyes.", "say": "One rule. Never look straight at the Sun. It is so bright it can hurt your eyes."},
             ]},
             "The Sun gives light and heat."),

        step("experiment", "Sun or shade?", "\U0001F9EA", "Sun test", ["1ESs.02", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Two cups of water: one in the <b>sun</b>, one in the <b>shade</b>. Which gets warmer? Predict first.",
             explain(
                 ["This is a fair test of the Sun's heat.", "Two cups the same, same water, and only one thing different: sun or shade."],
                 ["Predict which cup will get warmer.", "Then wait an hour at a time and watch the two thermometers.",
                  "The red line goes up as the water gets warmer."],
                 ["Children think the shade is just as warm because it is the same day.", "Try it. The cup in the sun is warm and the shade one stays cool."],
                 ["Tap your prediction, then press Wait an hour and watch the thermometers."]),
             {"sim": "sunShade",
              "predict": {"ask": "Which cup of water do you think will get <b>warmer</b>?",
                          "opts": [opt("The cup in the sun", True), opt("The cup in the shade", False), opt("Both will stay exactly the same", False)]},
              "runAsk": "Press Wait an hour, three times. Watch the red lines on the thermometers.",
              "happened": {"ask": "What happened after three hours?",
                           "opts": [opt("The cup in the sun got much warmer than the cup in the shade", True), opt("The cup in the shade got warmer", False), opt("Both stayed cold", False)],
                           "why": "The water in the sun got warm. The water in the shade stayed cool. The Sun's heat warmed it."}},
             "The Sun's heat warms things. The shade stays cooler."),

        step("demo", "The Sun is a star", "⭐", "Star Sun", ["1ESs.02", "1ESs.01"],
             "At night you can see many stars. Press <b>Next</b> to find out what the Sun really is.",
             explain(
                 ["The Sun is a star.", "The stars you see at night are suns too, but very, very far away."],
                 ["At night the sky is full of tiny lights: stars.", "Each one is a huge ball of hot, glowing gas like our Sun, but so far away it looks tiny.",
                  "Our Sun looks big and bright because it is the nearest star to Earth."],
                 ["Children think the Sun and the stars are different kinds of thing.", "They are the same kind of thing. Ours is just close."],
                 ["Press Next and see."]),
             {"frames": [
                 {"scene": {"id": "sky", "state": 0}, "cap": "Night. The sky is full of tiny lights: <b>stars</b>.", "say": "At night the sky is full of tiny lights. Those are stars."},
                 {"scene": {"id": "sky", "state": 3}, "cap": "Each star is a huge ball of hot, glowing gas, like our <b>Sun</b>, but very far away.", "say": "Each star is a huge ball of hot, glowing gas, just like our Sun, but so far away it looks like a dot."},
                 {"scene": {"id": "sky", "state": 2}, "cap": "The Sun is a star too. It looks big because it is the <b>nearest</b> one.", "say": "The Sun is a star too. It looks big and bright only because it is the nearest star to Earth."},
                 {"pic": "\U0001F30D☀️", "cap": "Earth is our planet. The Sun is our star. It gives us light and heat.", "say": "Earth is our planet. The Sun is our star. It gives us light and heat every day."},
             ]},
             "The Sun is a star, and the nearest one to us."),

        step("context", "Long ago, and the people who look up", "\U0001F52D", "Sky watchers", ["1SIC.01", "1SIC.03"],
             "Long ago people thought different things about the Earth and the Sun. Tap each picture.",
             explain(
                 ["What people know changes as they find out more.", "Some ideas from long ago turned out to be wrong."],
                 ["Long ago some people thought the Earth was flat, like a plate.", "Now we have photographs from space showing it is round.",
                  "Long ago people thought the Sun went round the Earth.", "Now we know Earth goes round the Sun.",
                  "People who study the sky are called astronomers. Science is their job."],
                 [],
                 ["Tap each picture and hear how thinking changed."]),
             {"items": [
                 {"pic": "\U0001F30D", "label": "flat or round?", "say": "Long ago some people thought the Earth was flat, like a plate. Now we have photographs from space, and it is round like a ball."},
                 {"pic": "☀️", "label": "what goes round what?", "say": "Long ago people thought the Sun went round the Earth. Now we know the Earth goes round the Sun, once a year."},
                 {"pic": "\U0001F52D", "label": "astronomer", "say": "An astronomer studies the stars and planets through a telescope. Finding out about the sky is their job."},
                 {"pic": "\U0001F468‍\U0001F680", "label": "astronaut", "say": "An astronaut flies into space and sees with their own eyes that Earth is a round blue planet."},
             ], "need": 4,
              "then": {"ask": "How do we know the Earth is round?",
                       "opts": [opt("Photographs taken from space show it", True), opt("Because the ground looks flat", False), opt("Because someone guessed", False)],
                       "why": "People worked out long ago that Earth is round. Photographs from space show it."}},
             "What people know changes as they find out more."),

        step("ask", "Ask a question about the sky", "❓", "Asked why", ["1TWSp.01"],
             "Look up. Tap a question you would like to ask about the sky.",
             explain(
                 ["The sky has always made people ask questions.", "Astronomers are the people who kept asking."],
                 ["Why is the sky blue? Where does the Sun go at night? How far away are the stars?",
                  "For a question about the Sun moving, you could watch and note where it is at different times."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F305",
              "questions": ["Where does the Sun go at night?", "Why is the sky blue in the day and black at night?", "Are the stars there in the daytime too?"],
              "findOut": {"ask": "You want to know where the Sun goes. How could you start finding out?",
                          "opts": [opt("Watch where the Sun is in the morning, at midday and in the evening, and note it down", True), opt("Look straight at the Sun for a long time", False), opt("Guess", False)],
                          "why": "Watching and noting it down is observing, the scientist's way. And never look straight at the Sun."}},
             "Ask, watch, note it down. That is how astronomers began."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1ESp.01", "1ESp.02", "1ESs.01", "1ESs.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Earth: the planet we live on, mostly water, land is soil on rock.", "Sun: light and heat, and a star."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is the name of the planet we live on?", "\U0001F30D", "Earth", ["the Sun", "the Moon", "a star"], "We live on the planet Earth."),
                 q("Most of Earth is covered in...", "\U0001F30A", "water", ["sand", "grass", "ice"], "Seven of your ten catches landed on water. Earth is mostly water."),
                 q("Dig down through the soil. What do you find underneath?", "⛏️", "rock", ["more grass", "clouds", "sky"], "Land is soil on top and rock underneath."),
                 q("What is soil?", "\U0001F33E", "the dark, crumbly top layer of the land", ["a kind of water", "a piece of the Sun", "a cloud"], "Soil is the crumbly layer plants grow in, on top of the rock."),
                 q("The Sun gives us...", "☀️", "light and heat", ["rain and wind", "rock and soil", "nothing"], "The Sun is a source of light and heat."),
                 q("Which cup of water got warmer?", "\U0001F964", "the one in the sun", ["the one in the shade", "neither"], "The Sun's heat warmed the water in the sun."),
                 q("What is the Sun?", "⭐", "a star, the nearest one to Earth", ["a planet", "a cloud", "a big lamp"], "The Sun is a star. The others look small because they are far away."),
                 q("Long ago some people thought the Earth was flat. How do we know it is round?", "\U0001F6F0️", "photographs from space show it", ["because the ground is bumpy", "because the Sun is round"], "Science changed what people knew."),
                 q("On a hot day, why does it feel cooler in the shade of a tree?", "\U0001F333", "The tree stops the Sun's heat reaching you", ["The tree is made of ice", "The shade makes it night time"], "The Sun gives heat. In the shade, the tree is in the way, so less of the Sun's heat reaches you."),
             ]},
             "That is the whole lesson finished. You know your Earth and your Sun."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say what the Earth is like: round, and mostly water.",
    "Say what the land is made of: soil on top, rock underneath.",
    "Say what the Sun gives us: light and heat.",
    "Say that the Sun is a star.",
]

LESSON["warmup"] = [
    q("What is the big bright light in the sky in the daytime?", "☀️", "the Sun", ["the Moon", "a lamp"], "In the daytime the Sun lights up the sky."),
    q("What is the sea made of?", "\U0001F30A", "water", ["sand", "rock"], "The sea is water, and there is a lot of it on Earth."),
]

LESSON["lecture"] = [
    part("\U0001F30D", "Our planet",
         "Zoom out from your house. Your street, your town, your country. Zoom out again and there is the whole Earth: a round planet, floating in space. That is where we live."),
    part("\U0001F4A7", "Mostly water",
         "Look at the Earth from space and most of it is blue. That is the sea. Earth is mostly water. The green and brown parts are the land."),
    part("\U0001FAA8", "Under the ground",
         "Dig down through the grass. First there is soil, dark and crumbly. In it are small stones. Deeper down the spade hits hard rock. Land is soil on top and rock underneath."),
    part("\u2600\uFE0F", "The Sun gives light and heat",
         "The Sun lights up the day. It warms the ground, the sea and your skin. Without the Sun it would be dark and cold. Never look straight at the Sun."),
    part("\u2B50", "The Sun is a star",
         "At night the sky is full of tiny lights: stars. Each one is a huge ball of hot, glowing gas, very far away. The Sun is a star too. It looks big because it is the nearest one."),
]

LESSON["words"] = [
    word("Earth", "\U0001F30D", "The planet we live on.",
         ["Earth is round.", "Earth is mostly covered in water."]),
    word("planet", "\U0001FA90", "A huge round world that goes round a star.",
         ["Earth is a planet.", "There are other planets, far away."]),
    word("soil", icon("soil"), "The dark, crumbly top part of the land, where plants grow.",
         ["Seeds grow in soil.", "Dig down and there is soil."]),
    word("rock", "\U0001FAA8", "The hard stuff under the soil. A stone is a small piece of rock.",
         ["The mountain is made of rock.", "Under the soil is rock."]),
    word("Sun", "\u2600\uFE0F", "The star that gives Earth light and heat.",
         ["The Sun rises in the morning.", "The Sun warms the ground."]),
    word("star", "\u2B50", "A huge ball of hot, glowing gas, very far away. The Sun is a star.",
         ["I can see a star.", "The Sun is our nearest star."]),
    word("heat", "\U0001F525", "Warmth. The Sun gives us heat.",
         ["Feel the heat of the Sun.", "The shade has less heat."]),
]

LESSON["home"] = [
    home("Catch the globe", "A ball with blue and green paper stuck on it, or a globe; two people",
         ["Throw the ball to each other and catch it ten times.",
          "Each catch, look where your right thumb landed: water or land.",
          "Keep a tally of water and land."],
         "More water than land. Earth is mostly water."),
    home("Dig a hole", "A trowel or a spoon, a patch of garden or a big plant pot, a grown-up",
         ["Dig down slowly.",
          "Put what you find in a line: grass, soil, little stones.",
          "Feel the soil. Is it crumbly? Is it damp?",
          "Wash your hands afterwards."],
         "Small stones in the soil are little pieces of rock."),
    home("Sun or shade", "Two cups of water, a sunny day",
         ["Put one cup in the sun and one in the shade.",
          "Wait an hour.",
          "Dip a finger in each."],
         "The sunny cup is warmer. The Sun gives heat. Never look straight at the Sun."),
]
