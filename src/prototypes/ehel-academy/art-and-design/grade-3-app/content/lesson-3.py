# -*- coding: utf-8 -*-
"""Lesson 3 - The Colour Wheel.

0067 Stage 3: E.01 the formal element of colour, studied on the colour
wheel; E.02 explore what happens when opposite colours are mixed (they dull
each other to a brown - computed by _rules.py, not typed); M.02 choose a
colour scheme for a purpose, informed by teaching; R.01 the progression
text's own celebrated change, "changing a colour scheme"; TWA.01 work for a
purpose and an audience (a poster that must stand out); TWA.03 review and
refine. The step up from Grade 2: Grade 2 chose warm or cool for a feeling;
Grade 3 reads the wheel, finds complementary pairs, and chooses a scheme
because of what it DOES.
"""
from _kit import explain, step, opt, q, spot, pot, part, word, home, material, change

LESSON = {
    "slug": "the-colour-wheel",
    "title": "The Colour Wheel",
    "blurb": "Read the colour wheel, find the colours that sit opposite each other, mix across the wheel and see what happens, sort colour schemes, choose a scheme for a purpose, and change a scheme to make a picture work.",
    "steps": [
        step("source", "The colour wheel", "🎡", "Wheel reader", ["3E.01", "3M.01"],
             "A colour wheel puts colours in a circle. Tap the colours to find out how the wheel works.",
             explain(
                 ["A colour wheel is a map of colours.", "The three primaries sit apart, and the colours they make sit between them."],
                 ["Red, yellow and blue are the primaries.", "Orange sits between red and yellow, because they make it.",
                  "Colours opposite each other are called complementary colours."],
                 ["Children think opposite means 'not friends'.", "Opposite colours make each other look brighter."],
                 ["Tap three things and listen."]),
             {"scene": "colourwheel", "need": 3, "caption": "Tap red, orange, blue and green.",
              "spots": [
                  spot("red", "red", "Red is a primary colour. You cannot mix it from other colours.", 160, 55, "🔴"),
                  spot("orange", "orange", "Orange sits between red and yellow, because red and yellow make orange.", 216, 88, "🟠"),
                  spot("blue", "blue", "Blue sits opposite orange. Opposite colours are called complementary colours.", 104, 152, "🔵"),
                  spot("green", "green", "Green sits opposite red. Put red and green side by side and both look brighter.", 160, 185, "🟢"),
              ],
              "then": {"ask": "Which colour sits opposite red on the wheel?",
                       "opts": [{"t": "green", "spot": "green"}, {"t": "orange"}, {"t": "purple"}],
                       "why": "Green sits straight across from red. They are complementary colours."}},
             "You read the colour wheel: primaries, secondaries and opposites."),

        step("mix", "Mixing across the wheel", "🎨", "Wheel mixer", ["3E.02", "3M.01"],
             "Mixing colours that sit side by side makes a bright colour. Mixing opposites is a surprise. Guess, then tap the two pots.",
             explain(
                 ["Colours next to each other on the wheel mix well.", "Colours opposite each other cancel each other out."],
                 ["Red and yellow, side by side, make orange.", "Red and green, opposites, make a dull brown.",
                  "Artists use this: a little of the opposite colour dulls a colour that is too bright."],
                 ["Children expect opposites to make a new bright colour.", "They do not. They make brown."],
                 ["Tap your guess, then tap the two pots."]),
             {"pots": [pot("red"), pot("yellow"), pot("blue"), pot("green"), pot("orange"), pot("purple")],
              "rounds": [
                  {"a": "red", "b": "yellow", "opts": ["orange", "brown", "green"], "why": "Red and yellow sit side by side, and make orange."},
                  {"a": "red", "b": "green", "opts": ["brown", "yellow", "purple"], "why": "Red and green are opposites. Mixed, they cancel out to a dull brown."},
                  {"a": "blue", "b": "orange", "opts": ["brown", "green", "pink"], "why": "Blue and orange are opposites too. Mixed, they make brown."},
                  {"a": "yellow", "b": "purple", "opts": ["brown", "orange", "light purple"], "why": "Yellow and purple are the third pair of opposites. They also make brown."},
              ]},
             "Side by side makes bright colours. Opposites make brown."),

        step("sort", "Which colour scheme?", "🗂️", "Scheme sorter", ["3E.01", "3R.01"],
             "A colour scheme is the set of colours a picture uses. Is each one warm, cool, or complementary? Tap the bin.",
             explain(
                 ["Artists often pick a few colours that work together. That is a colour scheme."],
                 ["Warm: reds, oranges and yellows.", "Cool: blues, greens and purples.",
                  "Complementary: two colours from opposite sides of the wheel."],
                 ["Children call any two colours complementary.", "Complementary means OPPOSITE on the wheel."],
                 ["Look at the colours, then tap the bin."]),
             {"ask": "Warm, cool or complementary?",
              "bins": [{"id": "warm", "label": "Warm", "pic": "🔥"}, {"id": "cool", "label": "Cool", "pic": "🧊"}, {"id": "comp", "label": "Complementary", "pic": "🎡"}],
              "items": [
                  {"pic": "🔥", "label": "red, orange and yellow flames", "bin": "warm", "why": "Reds, oranges and yellows are warm."},
                  {"pic": "🌊", "label": "blue sea and green seaweed", "bin": "cool", "why": "Blues and greens are cool."},
                  {"pic": "🍓", "label": "a red strawberry with green leaves", "bin": "comp", "why": "Red and green are opposite on the wheel."},
                  {"pic": "🟠", "label": "orange circles on a blue background", "bin": "comp", "why": "Orange and blue are opposites."},
                  {"pic": "🏜️", "label": "a yellow and orange desert", "bin": "warm", "why": "Yellow and orange are warm."},
                  {"pic": "🍇", "label": "purple grapes on green leaves", "bin": "cool", "why": "Purple and green are both cool colours."},
                  {"pic": "🌼", "label": "yellow flowers on a purple cloth", "bin": "comp", "why": "Yellow and purple are opposites."},
              ]},
             "You sorted seven colour schemes."),

        step("choose", "Pick a colour scheme", "🖍️", "Scheme chooser", ["3M.02", "3TWA.01"],
             "Each picture has a job to do. Which colour scheme would help it? Tap one.",
             explain(
                 ["Choose a colour scheme because of what it does."],
                 ["Complementary colours stand out from far away.", "Cool colours feel calm.", "Warm colours feel hot.",
                  "Tints feel soft and gentle."],
                 ["Children use their favourite colours for every job.", "Ask what the picture has to DO."],
                 ["Read the job, then tap the scheme."]),
             {"materials": [
                 material("warm", "A warm scheme", "🔥", ["hot"], "Reds, oranges and yellows feel hot."),
                 material("cool", "A cool scheme", "🧊", ["calm"], "Blues, greens and purples feel calm."),
                 material("comp", "Complementary colours", "🎡", ["stands out"], "Opposite colours side by side stand out."),
                 material("tints", "Soft tints", "🩷", ["gentle"], "Pale tints feel soft and gentle."),
              ],
              "rounds": [
                  {"purpose": "a poster that must be seen from across the playground", "needs": "stands out", "pic": "🪧", "why": "Complementary colours make each other brighter, so the poster stands out."},
                  {"purpose": "a calm painting of the sea at night", "needs": "calm", "pic": "🌙", "why": "Cool colours feel calm."},
                  {"purpose": "a desert at midday", "needs": "hot", "pic": "🏜️", "why": "Warm colours feel hot."},
                  {"purpose": "a soft, gentle picture for a baby's room", "needs": "gentle", "pic": "🧸", "why": "Soft tints feel gentle."},
              ]},
             "You chose a colour scheme for four jobs."),

        step("refine", "Change the colour scheme", "🔧", "Scheme changer", ["3R.01", "3TWA.03"],
             "These pictures do not work yet. Changing the colour scheme could fix them. Tap a change and see.",
             explain(
                 ["Sometimes a picture is drawn well but the colours work against it.", "Changing the colour scheme can make it work."],
                 ["A poster nobody notices: use complementary colours.", "A snowy day that feels hot: use a cool scheme.",
                  "A campfire that looks cold: use a warm scheme."],
                 ["Children redraw the whole picture.", "Keep the drawing. Change the colours."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Zain's fair poster", "pic": "📄", "fixedPic": "🪧", "problem": "Nobody notices it from across the playground.", "fixed": "Now it stands out from far away."},
                  "needs": "contrast",
                  "changes": [
                      change("comp", "Use orange letters on a dark blue background", "🎡", "contrast", "Orange on blue: opposites. The poster jumps out from across the playground."),
                      change("grey", "Use grey letters on a white background", "🩶", "worse", "Grey on white is even harder to see."),
                      change("small", "Make the letters smaller", "🔍", "worse", "Smaller letters are harder to read from far away."),
                      change("more", "Add more words", "📝", "add", "More words, and still nobody notices it."),
                  ],
                  "why": "To stand out, put opposite colours side by side."},
                 {"piece": {"title": "Lina's snowy day", "pic": "☃️", "fixedPic": "❄️", "problem": "It is painted in reds and oranges, and it feels hot, not cold.", "fixed": "Now it feels icy and cold."},
                  "needs": "cool",
                  "changes": [
                      change("cool", "Change to a cool scheme: blues, purples and white", "🧊", "cool", "Blues and white feel icy. Now it is a snowy day."),
                      change("brighter", "Make the reds brighter", "🟥", "worse", "Brighter reds feel even hotter."),
                      change("bigger", "Make the snowman bigger", "🔍", "size", "A bigger snowman, still in hot colours."),
                      change("sun", "Add a big yellow sun", "☀️", "worse", "Now it looks like a heatwave."),
                  ],
                  "why": "Cold wants cool colours."},
                 {"piece": {"title": "Ravi's campfire", "pic": "🪵", "fixedPic": "🔥", "problem": "The fire is painted blue and green, and it looks cold.", "fixed": "Now the fire looks hot."},
                  "needs": "warm",
                  "changes": [
                      change("warm", "Change to a warm scheme: red, orange and yellow", "🔥", "warm", "Red, orange and yellow flames. Now you can feel the heat."),
                      change("dark", "Add black to every colour", "⬛", "worse", "Darker blue and green. Colder than ever."),
                      change("logs", "Add more logs", "🪵", "add", "More logs, under a cold blue fire."),
                      change("white", "Add white to the blue", "🩵", "worse", "Pale blue flames look icy."),
                  ],
                  "why": "Heat wants warm colours."},
             ]},
             "You changed three colour schemes, and each picture works now."),

        step("questions", "Colour wheel spotter", "💬", "Wheel spotter", ["3E.01", "3M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the colour wheel.", "You have met every one of them."],
                 ["Think about primaries, opposites, mixing and colour schemes."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Colour wheel", "items": [
                 q("Which colour sits opposite blue?", "🔵", "orange", ["green", "purple"], "Blue and orange are complementary colours."),
                 q("What do red and green make when you mix them?", "🟫", "brown", ["yellow", "bright orange"], "Opposites cancel out to a dull brown."),
                 q("Blue sea and green seaweed are a…", "🌊", "cool colour scheme", ["warm colour scheme", "complementary colour scheme"], "Blues and greens are cool."),
                 q("Which scheme helps a poster stand out?", "🪧", "complementary colours", ["soft tints", "a cool scheme"], "Opposite colours stand out."),
             ]},
             "You know how the colour wheel works."),

        step("quiz", "Show what you know", "⭐", "Star colour mixer", ["3E.01", "3E.02", "3M.01", "3M.02", "3R.01", "3TWA.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the wheel, mixing across it, colour schemes, and changing a scheme."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What are colours opposite each other on the wheel called?", "🎡", "complementary colours", ["primary colours", "tints"], "Opposite colours are complementary."),
                 q("Which colour sits between red and yellow?", "🟠", "orange", ["green", "purple"], "Red and yellow make orange, so orange sits between them."),
                 q("Why do red and green make brown when mixed?", "🟫", "because opposites cancel each other out", ["because green is a primary", "because red is too dark"], "Opposite colours cancel out to a dull brown."),
                 q("Yellow flowers on a purple cloth are…", "🌼", "a complementary scheme", ["a warm scheme", "a cool scheme"], "Yellow and purple are opposites."),
                 q("Why use complementary colours on a poster?", "🪧", "because opposites make each other stand out", ["because they are quiet", "because they use less paint"], "Side by side, opposites look brighter."),
                 q("Lina's snowy day felt hot. What fixed it?", "☃️", "a cool colour scheme", ["brighter reds", "a bigger sun"], "Cold wants cool colours."),
                 q("A campfire looks cold in blue and green. Change it to…", "🔥", "a warm scheme", ["a cool scheme", "soft tints"], "Heat wants warm colours."),
                 q("Which colour sits opposite purple?", "🟡", "yellow", ["blue", "red"], "Purple and yellow are complementary."),
             ]},
             "That is the whole lesson finished. You can read the colour wheel and choose a scheme on purpose."),
    ],
}


LESSON["about"] = [
    "Read the colour wheel: primaries, secondaries and opposites.",
    "Say what happens when you mix colours from opposite sides of the wheel.",
    "Sort colour schemes into warm, cool and complementary.",
    "Choose a colour scheme for a job.",
    "Change a colour scheme to make a picture work.",
]

LESSON["lecture"] = [
    part("🎡", "A map of colours",
         "A colour wheel is a map of colours. Red, yellow and blue, the primaries, sit apart. The colours they make sit between them: orange, green and purple."),
    part("↔️", "Opposites",
         "Colours straight across from each other are called complementary colours: red and green, blue and orange, yellow and purple. Side by side, they make each other look brighter."),
    part("🟫", "Mixing opposites",
         "Mix two colours that sit side by side and you get a bright colour. Mix two opposites and they cancel each other out, into a dull brown. Artists use a little of the opposite to calm a colour down."),
    part("🖍️", "Choose a scheme",
         "A colour scheme is the set of colours a picture uses. Warm for heat. Cool for calm. Complementary to stand out. If a picture is not working, try changing the scheme before you change anything else."),
]

LESSON["words"] = [
    word("colour wheel", "🎡", "A circle that shows how colours are related.",
         ["Orange is between red and yellow on the colour wheel.", "I made my own colour wheel."]),
    word("primary", "🔴", "Red, yellow or blue: colours you cannot mix from others.",
         ["Red is a primary colour.", "The primaries are red, yellow and blue."]),
    word("secondary", "🟠", "A colour made by mixing two primaries.",
         ["Green is a secondary colour.", "Orange is a secondary."]),
    word("complementary", "↔️", "Colours opposite each other on the colour wheel.",
         ["Red and green are complementary.", "I used complementary colours."]),
    word("scheme", "🖍️", "The set of colours a picture uses.",
         ["My poster has a warm scheme.", "I changed the colour scheme."]),
    word("contrast", "⚫", "A big difference that makes things stand out.",
         ["Orange on blue has lots of contrast.", "More contrast makes it easier to see."]),
]

LESSON["home"] = [
    home("Paint a colour wheel", "Red, yellow and blue paint, a brush, water, and a paper plate",
         ["Paint red, yellow and blue round the plate, with gaps between them.",
          "In each gap, mix the two colours on either side and paint the new colour.",
          "Check: is each colour opposite its partner?"],
         "Which colour sits opposite each primary?"),
    home("Opposite mix", "Two opposite colours of paint, like red and green, a brush and paper",
         ["Paint a stripe of red and a stripe of green.", "Mix a little of each together and paint a stripe of the mix.",
          "Now paint red and green side by side, touching."],
         "Is the mix bright or dull? Do the colours look brighter side by side?"),
    home("Scheme swap", "A simple drawing, copied twice, and crayons or paints",
         ["Colour the first copy in a warm scheme.", "Colour the second copy in a cool scheme.",
          "Put them side by side."],
         "How does the same drawing feel different?"),
]

LESSON["journal"] = {
    "changes": ["try a complementary scheme", "use a cooler scheme", "use a warmer scheme", "mix a little opposite to dull it", "keep it just as it is"],
}
