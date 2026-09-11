# -*- coding: utf-8 -*-
"""Lesson 2 - Colour Magic.

0067 Stage 1: E.02 explore media (mixing paints; Cambridge's own example is
"Let us try mixing red and blue. What happened?"); M.01 use paint with
growing confidence; R.02 reflect on what the mix did (the prediction against
the result); E.01 encounter colour and tone as formal elements, and colour
in a patterned cloth; E.03 gather by ordering (the tone ladder). The mixed
colour is computed by the kit's own table, never typed.
"""
from _kit import explain, step, opt, q, spot, part, word, home, pot, swatch

LESSON = {
    "slug": "colour-magic",
    "title": "Colour Magic",
    "blurb": "Meet the three primary colours, mix them and see what they make, put colours in order from light to dark, sort warm from cool, and find the colours in a patterned cloth.",
    "steps": [
        step("explore", "The three primary colours", "🔴", "Primary colours", ["1E.01"],
             "Red, yellow and blue are the primary colours. Tap each one.",
             explain(
                 ["There are three primary colours: red, yellow and blue.", "You cannot make them by mixing. You can make every other colour FROM them."],
                 ["Red, like a tomato.", "Yellow, like the sun.", "Blue, like the sea.", "Mix two of them and you get a new colour."],
                 ["Children think green is a primary colour.", "Green is made from blue and yellow. It is a mix."],
                 ["Tap all three."]),
             {"items": [
                 {"pic": "🍅", "label": "red", "say": "Red. A primary colour. Tomatoes, fire engines and strawberries are red."},
                 {"pic": "☀️", "label": "yellow", "say": "Yellow. A primary colour. The sun, a lemon and a banana are yellow."},
                 {"pic": "🌊", "label": "blue", "say": "Blue. A primary colour. The sea, the sky and blueberries are blue."},
             ], "need": 3,
              "then": {"ask": "Which of these is NOT a primary colour?",
                       "opts": [opt("orange", True), opt("red", False), opt("blue", False)],
                       "why": "Orange is made by mixing red and yellow. Red and blue are primary colours."}},
             "Red, yellow and blue. The three colours everything starts from."),

        step("mix", "Mix two colours", "🎨", "Colour mixer", ["1E.02", "1M.01", "1R.02"],
             "Say what you think the mix will make. Then tap the two pots and see.",
             explain(
                 ["When you mix two colours, you make a new one.", "Guessing first, then looking, is how artists learn what paint does."],
                 ["Red and yellow make orange.", "Red and blue make purple.", "Blue and yellow make green.",
                  "White makes a colour lighter. Black makes it darker."],
                 ["Children guess and then do not look.", "Look at the bowl. What ACTUALLY happened is the lesson."],
                 ["Tap the colour you think, then the two pots."]),
             {"pots": [pot("red"), pot("yellow"), pot("blue"), pot("white"), pot("black")],
              "rounds": [
                  {"a": "red", "b": "yellow", "opts": ["orange", "green", "purple"], "why": "Red and yellow always make orange."},
                  {"a": "red", "b": "blue", "opts": ["purple", "orange", "green"], "why": "Red and blue make purple. That was the question artists have asked for hundreds of years."},
                  {"a": "blue", "b": "yellow", "opts": ["green", "purple", "orange"], "why": "Blue and yellow make green, the colour of leaves."},
                  {"a": "red", "b": "white", "opts": ["pink", "dark red", "orange"], "why": "White makes a colour lighter. Light red is pink."},
                  {"a": "blue", "b": "black", "opts": ["dark blue", "light blue", "green"], "why": "Black makes a colour darker. That is a dark blue, like the night."},
              ]},
             "You know what the primary colours make, and you have made colours of your own."),

        step("tone", "Light to dark", "🌗", "Tone ladder", ["1E.01", "1E.03"],
             "Put the colours in order, from the lightest to the darkest.",
             explain(
                 ["How light or dark a colour is has a name: tone.", "White is the lightest tone. Black is the darkest."],
                 ["Light blue is lighter than blue.", "Dark blue is darker than blue.", "Put them in a row and you have a ladder from light to dark."],
                 ["Children put the brightest colour first.", "Bright is not the same as light. Look at how pale it is."],
                 ["Tap the lightest one first."]),
             {"swatches": [
                 swatch("white", "white", "#FFFFFF", say="White. The lightest of all."),
                 swatch("lightblue", "light blue", "#9CC8F0", say="Light blue. Blue with white in it."),
                 swatch("blue", "blue", "#2D6CDF", say="Blue. Right in the middle."),
                 swatch("darkblue", "dark blue", "#1B3A75", say="Dark blue. Blue with black in it."),
                 swatch("black", "black", "#1B1B1B", say="Black. The darkest of all."),
             ]},
             "From light to dark. That ladder is called tone."),

        step("sort", "Warm or cool?", "🌡️", "Warm and cool", ["1E.01"],
             "Some colours feel warm, like fire. Some feel cool, like ice. Which is it?",
             explain(
                 ["Colours can feel warm or cool.", "Red, orange and yellow feel warm, like the sun and fire.", "Blue and the colours near it feel cool, like water and ice."],
                 ["A pumpkin is orange. Warm.", "The sea is blue. Cool."],
                 ["Children think warm means hot to touch.", "It means the colour REMINDS you of warm things."],
                 ["Look at the colour, then tap the bin."]),
             {"ask": "Does its colour feel warm or cool?",
              "bins": [{"id": "warm", "label": "Warm", "pic": "🔥"}, {"id": "cool", "label": "Cool", "pic": "🧊"}],
              "items": [
                  {"pic": "☀️", "label": "the sun", "bin": "warm", "why": "Yellow feels warm, like sunshine."},
                  {"pic": "🧊", "label": "an ice cube", "bin": "cool", "why": "Pale blue feels cool, like ice."},
                  {"pic": "🔥", "label": "a fire", "bin": "warm", "why": "Red and orange feel warm, like flames."},
                  {"pic": "🌊", "label": "the sea", "bin": "cool", "why": "Blue feels cool, like deep water."},
                  {"pic": "🎃", "label": "a pumpkin", "bin": "warm", "why": "Orange feels warm."},
                  {"pic": "🫐", "label": "blueberries", "bin": "cool", "why": "Deep blue feels cool."},
                  {"pic": "🍅", "label": "a tomato", "bin": "warm", "why": "Red feels warm."},
              ]},
             "Warm colours and cool colours. Artists choose them to make you feel something."),

        step("source", "Colours in a cloth", "🧵", "Cloth looker", ["1E.01"],
             "This cloth was woven in bright stripes. Tap the colours to find out about them.",
             explain(
                 ["Cloth can be art too.", "Weavers choose colours and put them in rows that repeat."],
                 ["Tap the red stripe.", "Tap the yellow shapes.", "Tap the black squares.", "Every colour was chosen on purpose."],
                 ["Children see only 'stripes'.", "Look at WHICH colours, and how they come back again and again."],
                 ["Tap four colours and listen."]),
             {"scene": "cloth", "need": 4, "caption": "Tap the red, the yellow, the green and the black.",
              "spots": [
                  spot("red", "the red stripe", "Red is a warm colour. The weaver put it at the top and near the bottom.", 160, 20, "🟥"),
                  spot("yellow", "the yellow shapes", "Yellow diamonds sit in the middle. Warm and bright, so your eye goes there first.", 160, 128, "🔶"),
                  spot("green", "the green stripe", "Green is a mix of blue and yellow. It is cool next to the red.", 40, 100, "🟩"),
                  spot("black", "the black squares", "Black squares repeat along the stripe. Black is the darkest tone there is.", 260, 60, "◼️"),
              ],
              "then": {"ask": "What does the weaver do with the colours in this cloth?",
                       "opts": [{"t": "puts them in stripes that repeat", "spot": "yellow"}, {"t": "mixes them all into brown"}, {"t": "uses only one colour"}],
                       "why": "Look at the stripes: red, yellow, green, black, yellow, red. The colours come back again and again."}},
             "You found the colours in a cloth and how the weaver used them."),

        step("questions", "Colour quiz", "💬", "Colour spotter", ["1E.02", "1R.02"],
             "What happened when we mixed? Tap the answer.",
             explain(
                 ["Every question here is about the mixing you just did."],
                 ["Think about the bowl, and what each pair of pots made."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Colour", "items": [
                 q("What happened when we mixed red and blue?", "🎨", "it made purple", ["it made orange", "it made green"], "Red and blue made purple. You saw it in the bowl."),
                 q("To make a colour lighter, you add…", "⚪", "white", ["black", "more of the same colour"], "White makes a tint: a lighter colour."),
                 q("Blue and yellow make…", "🍃", "green", ["purple", "pink"], "Blue and yellow make green."),
                 q("Which colour is the darkest tone?", "⚫", "black", ["white", "light blue"], "Black is the darkest of all."),
             ]},
             "You know what the colours make."),

        step("quiz", "Show what you know", "⭐", "Star colour mixer", ["1E.01", "1E.02", "1E.03", "1M.01", "1R.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the primary colours, the mixing bowl, the tone ladder, warm and cool, and the cloth."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which three are the primary colours?", "🔴", "red, yellow and blue", ["green, orange and purple", "black, white and grey"], "Red, yellow and blue. Everything else is mixed from them."),
                 q("Red and yellow make…", "🍊", "orange", ["green", "purple"], "Red and yellow make orange."),
                 q("Red and blue make…", "🍇", "purple", ["orange", "green"], "Red and blue make purple."),
                 q("Red and white make…", "🌸", "pink", ["dark red", "brown"], "White makes red lighter: pink."),
                 q("Why does a little white make a colour lighter?", "⚪", "because white is the lightest colour of all", ["because white is a primary colour", "because white is wet"], "White is the lightest of all. A little white makes any colour lighter."),
                 q("Why paint a sunset in red and orange?", "🌅", "because red and orange feel warm, like the sun", ["because blue is too dark", "because they are the only colours"], "Red, orange and yellow feel warm. Blue and green feel cool."),
                 q("The weaver put the colours in…", "🧵", "stripes that repeat", ["one big blob", "no order at all"], "Rows of colour that come back again and again."),
                 q("Before you mix, an artist should…", "🤔", "guess what it will make, then look", ["close their eyes", "throw the paint"], "Guess, mix, look. That is how you learn what paint does."),
             ]},
             "That is the whole lesson finished. You are a colour mixer now."),
    ],
}


LESSON["about"] = [
    "Name the three primary colours: red, yellow and blue.",
    "Say what two colours make when you mix them, and mix them yourself.",
    "Put colours in order from light to dark.",
    "Say whether a colour feels warm or cool.",
    "Find the colours in a woven cloth and say how the weaver used them.",
]

LESSON["lecture"] = [
    part("🔴", "The primary colours",
         "Red, yellow and blue are the primary colours. You cannot make them by mixing other colours. But you can make almost every other colour by mixing them. That is why every paint box has them."),
    part("🎨", "Mixing",
         "Red and yellow make orange. Red and blue make purple. Blue and yellow make green. Before you mix, guess. Then mix, and look. What actually happened is what you learn."),
    part("🌗", "Light and dark",
         "Add white to a colour and it gets lighter. Add black and it gets darker. How light or dark a colour is has a name: tone. You can put colours in a ladder from the lightest to the darkest."),
    part("🔥", "Warm and cool",
         "Red, orange and yellow feel warm, like fire and sunshine. Blue feels cool, like water and ice. Artists choose warm or cool colours to make you feel something."),
    part("🧵", "Colour in a cloth",
         "A weaver makes cloth in coloured stripes that come back again and again. Every colour was chosen on purpose. Cloth is art too."),
]

LESSON["words"] = [
    word("primary", "🔴", "One of the three colours you cannot mix: red, yellow and blue.",
         ["Red is a primary colour.", "Mix two primary colours to make a new one."]),
    word("mix", "🎨", "To stir two colours together to make a new one.",
         ["I mixed red and blue.", "Let us mix and see what happens."]),
    word("tone", "🌗", "How light or dark a colour is.",
         ["Light blue is a light tone.", "Put the tones in order."]),
    word("light", "⚪", "Pale. A light colour has white in it.",
         ["Pink is light red.", "Add white to make it light."]),
    word("dark", "⚫", "Deep. A dark colour has black in it.",
         ["Dark blue is like the night.", "Add black to make it dark."]),
    word("warm", "🔥", "A colour that reminds you of fire and sun: red, orange or yellow.",
         ["Orange is a warm colour.", "The sun is warm yellow."]),
    word("cool", "🧊", "A colour that reminds you of water and ice: blue and its friends.",
         ["Blue is a cool colour.", "The sea is cool."]),
]

LESSON["home"] = [
    home("Real mixing", "Red, yellow and blue paint, a little white, a paper plate and a brush",
         ["Put a blob of red and a blob of yellow next to each other.", "Say what you think they will make. Then mix them.",
          "Try red and blue, then blue and yellow, then red and white."],
         "Did each mix make what you said? Which one surprised you?"),
    home("A tone ladder", "One colour of paint, some white, some black, and a strip of paper",
         ["Paint a patch of the colour in the middle of the strip.", "Add a little white and paint a patch to the left. Add more white, another patch.",
          "Add a little black and paint to the right. Then more black."],
         "Can you see the ladder from light to dark?"),
    home("Warm and cool hunt", "A grown-up and a room full of things",
         ["Find five things with warm colours: red, orange or yellow.", "Find five things with cool colours: blue or green.",
          "Put them in two piles."],
         "Which pile makes you feel warmer just by looking?"),
]

LESSON["journal"] = {
    "changes": ["mix a lighter colour next time", "add more white", "try black to make it darker", "mix three colours instead of two", "keep it just as it is"],
}
