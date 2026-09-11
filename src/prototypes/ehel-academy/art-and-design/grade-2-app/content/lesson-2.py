# -*- coding: utf-8 -*-
"""Lesson 2 - Colours and Feelings.

0067 Stage 2: M.01 mixing with growing skill - now tints AND shades, with
white and with black; E.03 record by ordering (a blue from lightest to
darkest); R.01 celebrate by "grouping work in response to the feelings that
they generate" (the progression text's own words); M.02 choose the colours
"appropriate to represent an object or feeling"; R.02 compare two paintings
and say what is the same and different; E.01 encounter warm, cool, pale and
dark colour. The step up from Grade 1's Colour Magic: Grade 1 mixed the
primaries and tinted and shaded them; Grade 2 tints and shades the colours
Grade 1 MADE (purple, green, yellow), and asks what a colour makes you FEEL.
"""
from _kit import explain, step, opt, q, pot, swatch, material, work, comment, part, word, home

LESSON = {
    "slug": "colours-and-feelings",
    "title": "Colours and Feelings",
    "blurb": "Find out how colours can feel warm, cool, calm or stormy, mix tints and shades, put a blue in order from light to dark, group pictures by their feeling, and choose the colours for a feeling of your own.",
    "steps": [
        step("explore", "Colours have feelings", "🎨", "Feeling finder", ["2E.01", "2R.01"],
             "Colours can make us feel things. Tap each set of colours to hear how it feels.",
             explain(
                 ["Colours do more than show what a thing is.", "They can make a picture feel happy, calm, sleepy or stormy."],
                 ["Warm colours feel sunny and happy.", "Cool colours feel calm and fresh.", "Pale colours feel soft and gentle.",
                  "Dark colours feel quiet or stormy.", "Bright colours feel busy and excited."],
                 ["Children think there is one right feeling for each colour.", "Colours can feel different to different people. Say how it feels to YOU."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🔥", "label": "warm colours", "say": "Warm colours: red, orange and yellow. They feel sunny and happy, like a fire or the summer sun."},
                 {"pic": "🧊", "label": "cool colours", "say": "Cool colours: blue, green and purple. They feel calm and fresh, like water and ice."},
                 {"pic": "☁️", "label": "pale colours", "say": "Pale colours, like pink and light blue. They feel soft and gentle, like a quiet morning."},
                 {"pic": "🌑", "label": "dark colours", "say": "Dark colours, like dark blue and dark green. They can feel quiet and sleepy, or stormy."},
                 {"pic": "🎉", "label": "bright colours", "say": "Bright colours, all together. They feel busy and excited, like a party."},
                 {"pic": "🌈", "label": "every colour", "say": "Every colour at once. A rainbow can feel happy and full of surprises."},
             ], "need": 6,
              "then": {"ask": "Which colours often feel calm and cool?",
                       "opts": [opt("blue and green", True), opt("red and orange", False), opt("bright pink and yellow", False)],
                       "why": "Blue and green remind us of water and trees, so they often feel calm and cool. Red and orange feel warm."}},
             "Warm, cool, pale, dark and bright. Colours carry feelings."),

        step("mix", "Tints and shades", "🎨", "Tint and shade mixer", ["2M.01", "2E.02"],
             "White makes a colour lighter. Black makes it darker. Guess what each mix makes, then tap the two pots.",
             explain(
                 ["A colour with white added is called a tint. It is lighter.", "A colour with black added is called a shade. It is darker."],
                 ["Purple and white make light purple, a tint.", "Green and black make dark green, a shade.",
                  "Always add just a little black. A little black goes a long way."],
                 ["Children pour in lots of black and the colour disappears.", "A tiny bit of black is enough."],
                 ["Tap your guess, then tap the two pots."]),
             {"pots": [pot("purple"), pot("green"), pot("yellow"), pot("blue"), pot("white"), pot("black")],
              "rounds": [
                  {"a": "purple", "b": "white", "opts": ["light purple", "dark purple", "pink"], "why": "White makes purple lighter. Light purple is a tint."},
                  {"a": "green", "b": "black", "opts": ["dark green", "light green", "blue"], "why": "Black makes green darker. Dark green is a shade, like a forest at night."},
                  {"a": "yellow", "b": "white", "opts": ["light yellow", "dark yellow", "orange"], "why": "White makes yellow lighter, like a pale morning sun."},
                  {"a": "yellow", "b": "black", "opts": ["dark yellow", "light yellow", "green"], "why": "Black makes yellow darker. A little black turns yellow a dark, muddy yellow."},
                  {"a": "yellow", "b": "blue", "opts": ["green", "orange", "grey"], "why": "Yellow and blue make green, as they always do."},
              ]},
             "You mixed two tints, two shades and a green."),

        step("tone", "Red, from light to dark", "🟥", "Red ladder", ["2E.03", "2M.01"],
             "Here is red with more and more white or black in it. Put the reds in order, from lightest to darkest.",
             explain(
                 ["One colour can be light or dark.", "Adding white makes it lighter. Adding black makes it darker."],
                 ["Find the palest red first.", "Then the next one.", "End with the darkest."],
                 ["Children put bright red first.", "Look at how PALE each one is."],
                 ["Tap the lightest one first."]),
             {"swatches": [
                 swatch("blush", "pale pink", "#FBD3DC", "Pale pink, with lots of white in it."),
                 swatch("pink", "pink", "#F2929F", "Pink, a tint of red."),
                 swatch("red", "red", "#E0312B", "Red, straight from the pot."),
                 swatch("dark", "dark red", "#8B1A14", "Dark red, a shade."),
                 swatch("deep", "deep red", "#4A0D0A", "Deep red, with lots of black in it."),
              ]},
             "You put five reds in order, from the lightest tint to the darkest shade."),

        step("sort", "How does it feel?", "🗂️", "Feeling sorter", ["2R.01", "2E.03"],
             "Here are some pictures, told in words. Which feeling do their colours USUALLY give: happy, calm or stormy? Tap the bin.",
             explain(
                 ["One way to look at a lot of pictures is to group them by how they feel.",
                  "Artists and galleries do this too."],
                 ["Warm, bright colours often feel happy.", "Pale and cool colours often feel calm.",
                  "Dark colours and sharp shapes often feel stormy."],
                 ["Children sort by what is IN the picture.", "Sort by how the COLOURS make you feel."],
                 ["Read it, feel it, then tap the bin."]),
             {"ask": "Which feeling do these colours usually give?",
              "bins": [{"id": "hp", "label": "Happy", "pic": "😊"}, {"id": "cm", "label": "Calm", "pic": "😌"}, {"id": "st", "label": "Stormy", "pic": "⛈️"}],
              "items": [
                  {"pic": "🌻", "label": "a yellow sun over orange fields", "bin": "hp", "why": "Warm, bright yellow and orange feel happy."},
                  {"pic": "🌊", "label": "a pale blue sea at dawn", "bin": "cm", "why": "Pale, cool blue feels calm."},
                  {"pic": "🌩️", "label": "dark grey clouds and a zigzag of lightning", "bin": "st", "why": "Dark colours and a sharp zigzag feel stormy."},
                  {"pic": "🎉", "label": "a bright pink and orange party", "bin": "hp", "why": "Bright, warm colours feel happy and excited."},
                  {"pic": "🏞️", "label": "soft green hills under a light blue sky", "bin": "cm", "why": "Soft greens and light blue feel calm."},
                  {"pic": "🌪️", "label": "dark purple swirls and black trees", "bin": "st", "why": "Dark purple and black feel stormy."},
                  {"pic": "❄️", "label": "white snow with light blue shadows", "bin": "cm", "why": "White and pale blue feel quiet and calm."},
              ]},
             "You grouped seven pictures by how they feel. That is how a gallery hangs a show."),

        step("choose", "Colours for a feeling", "🖍️", "Colour chooser", ["2M.02", "2TWA.01"],
             "You want your picture to feel a certain way. Which colours would do it? Tap them.",
             explain(
                 ["When you know how you want a picture to feel, you can choose its colours on purpose."],
                 ["A hot day wants warm colours.", "A quiet lake wants cool colours.",
                  "A soft blanket wants pale tints.", "A forest at night wants dark shades."],
                 ["Children use every colour in the box.", "Choose the colours that give the feeling."],
                 ["Read the picture, then tap the colours."]),
             {"materials": [
                 material("warm", "Red, orange and yellow", "🔥", ["warm", "bright"], "Warm colours: red, orange and yellow."),
                 material("cool", "Blue, green and purple", "🧊", ["cool"], "Cool colours: blue, green and purple."),
                 material("tints", "Pink and light blue", "🩷", ["pale", "soft"], "Tints: pink and light blue, soft and pale."),
                 material("shades", "Dark blue and dark green", "🌲", ["dark"], "Shades: dark blue and dark green."),
              ],
              "rounds": [
                  {"purpose": "a hot afternoon in the desert", "needs": "warm", "pic": "🏜️", "why": "A hot day wants warm colours: red, orange and yellow."},
                  {"purpose": "a quiet swim in a cool lake", "needs": "cool", "pic": "🏊", "why": "Cool water wants cool colours: blue and green."},
                  {"purpose": "a baby's soft blanket", "needs": "pale", "pic": "🧸", "why": "Soft and gentle wants pale tints."},
                  {"purpose": "a forest at night", "needs": "dark", "pic": "🌲", "why": "Night-time wants dark shades."},
              ]},
             "You chose the colours for four feelings."),

        step("compare", "Two paintings, two feelings", "⚖️", "Painting comparer", ["2R.02", "2R.01"],
             "Two paintings feel very different. Is each thing in BOTH of them, or only in one?",
             explain(
                 ["Artists compare paintings and say what is the same and what is different.", "Then they say which feeling each one gives."],
                 ["Both paintings have a sky.", "Only one has a sun.", "Only one is mostly dark colours."],
                 ["Children say 'one is day and one is night' and stop.", "Look for the colours too."],
                 ["Look at both paintings, then tap a bin."]),
             {"a": work("day", "A Sunny Day", "sunpainting", ["a sun", "a tree", "yellow", "green", "the sky", "flowers", "bright colours"]),
              "b": work("night", "The Night", "night", ["a moon", "stars", "dark blue", "hills", "the sky", "mostly dark colours"]),
              "cards": [
                  comment("the sky", "the sky"),
                  comment("a sun", "a sun"),
                  comment("a moon", "a moon"),
                  comment("bright colours", "bright colours"),
                  comment("mostly dark colours", "mostly dark colours"),
                  comment("stars", "stars"),
              ]},
             "You found what is the same and what is different, and said how each one feels."),

        step("questions", "Colour spotter", "💬", "Colour spotter", ["2M.01", "2R.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about colours and feelings.", "You have met every one of them."],
                 ["Think about tints, shades and the feelings colours give."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Colours", "items": [
                 q("A colour with white added is called…", "⚪", "a tint", ["a shade", "a stamp"], "White makes a tint. Black makes a shade."),
                 q("Green and black make…", "🌲", "dark green", ["light green", "yellow"], "Black makes green darker."),
                 q("Which colours feel warm?", "🔥", "red, orange and yellow", ["blue and green", "dark blue and black"], "Red, orange and yellow remind us of fire and sun."),
                 q("Dark grey clouds and lightning feel…", "🌩️", "stormy", ["calm", "sleepy"], "Dark colours and sharp zigzags feel stormy."),
             ]},
             "You know your tints, your shades and your feelings."),

        step("quiz", "Show what you know", "⭐", "Star colourist", ["2E.01", "2E.02", "2E.03", "2M.01", "2M.02", "2R.01", "2R.02", "2TWA.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about tints, shades, the blue ladder, the feelings and the two paintings."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Purple and white make…", "🟪", "light purple", ["dark purple", "orange"], "White makes purple lighter. Light purple is a tint."),
                 q("A colour with black added is called…", "⚫", "a shade", ["a tint", "a print"], "Black makes a shade. White makes a tint."),
                 q("Why add only a tiny bit of black?", "🖌️", "because a little black makes a colour much darker", ["because black paint is heavy", "because black paint is sticky"], "A little black goes a long way. Too much, and the colour disappears."),
                 q("Which red is the lightest?", "🩷", "pale pink", ["dark red", "deep red"], "Pale pink has the most white in it."),
                 q("Which colours often feel calm?", "😌", "pale blue and soft green", ["dark purple and black", "bright red and orange"], "Pale, cool colours often feel calm."),
                 q("Why paint a hot desert with warm colours?", "🏜️", "because warm colours feel hot and sunny", ["because they are the only colours", "because blue is too dark"], "Red, orange and yellow feel hot, like the sun on sand."),
                 q("What do the sunny painting and the night painting both have?", "🏞️", "the sky", ["a sun", "a moon"], "Both have a sky. Only one has a sun, and only one has a moon."),
                 q("Grouping pictures by how they feel is a way of…", "🗂️", "looking at and celebrating art", ["mixing paint", "making a print"], "Galleries group pictures by feeling, colour or subject. It helps us look."),
             ]},
             "That is the whole lesson finished. You can mix tints and shades, and choose colours for a feeling."),
    ],
}


LESSON["about"] = [
    "Say how warm, cool, pale, dark and bright colours can feel.",
    "Mix a tint with white and a shade with black.",
    "Put one colour in order, from its lightest tint to its darkest shade.",
    "Group pictures by the feeling they give.",
    "Choose the colours for a feeling, and compare two paintings.",
]

LESSON["lecture"] = [
    part("🎨", "Colours have feelings",
         "Colours can make us feel things. Red, orange and yellow feel warm, like the sun. Blue and green feel cool, like water. Colours can feel different to different people, so say how they feel to you."),
    part("⚪", "Tints",
         "Add white to a colour and it gets lighter. Purple and white make light purple. Yellow and white make light yellow. A colour with white in it is called a tint."),
    part("⚫", "Shades",
         "Add black to a colour and it gets darker. Green and black make dark green. A colour with black in it is called a shade. Add just a tiny bit of black. A little goes a long way."),
    part("😌", "Choose on purpose",
         "When you know how you want a picture to feel, choose its colours on purpose. Warm for a hot day. Cool for a quiet lake. Pale for something soft. Dark for the night."),
]

LESSON["words"] = [
    word("tint", "🩷", "A colour with white added, so it is lighter.",
         ["Pink is a tint of red.", "I mixed a tint for the sky."]),
    word("shade", "🌲", "A colour with black added, so it is darker.",
         ["Dark blue is a shade of blue.", "I painted the night in shades."]),
    word("warm", "🔥", "Warm colours are red, orange and yellow.",
         ["Yellow is a warm colour, like the sun.", "My picture feels warm."]),
    word("cool", "🧊", "Cool colours are blue, green and purple.",
         ["The lake is painted in cool colours.", "Cool colours feel calm."]),
    word("pale", "☁️", "Light and soft, with lots of white in it.",
         ["The morning sky is pale.", "I used a pale pink."]),
    word("mood", "😊", "The feeling a picture gives you.",
         ["The mood of this picture is happy.", "Dark colours give a stormy mood."]),
]

LESSON["home"] = [
    home("One picture, two moods", "Paints, white and black paint, a brush, a saucer and two sheets of paper",
         ["Draw the same simple picture on both sheets: a house, a tree, or a boat on the sea.",
          "Paint the first one only in tints: mix a little white into every colour.",
          "Paint the second one only in shades: mix a tiny bit of black into every colour."],
         "Which one feels calm? Which one feels like night?"),
    home("Mood hunt", "A grown-up, and some books or magazines with pictures",
         ["Find a picture that feels happy.", "Find one that feels calm, and one that feels stormy.",
          "Look at the colours in each one."],
         "What colours did the happy picture use? And the stormy one?"),
    home("Paint a feeling", "Paints, a brush and paper",
         ["Think of a feeling: happy, calm, sleepy or excited.", "Choose three colours that give that feeling.",
          "Paint shapes and lines with only those colours. It does not have to be a thing."],
         "Can your grown-up guess the feeling from the colours?"),
]

LESSON["journal"] = {
    "changes": ["add a little more white", "use a cooler colour", "try a darker shade", "use warmer colours", "keep it just as it is"],
}
