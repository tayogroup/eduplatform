# -*- coding: utf-8 -*-
"""Lesson 1 - Printing Patterns.

0067 Stage 2: M.01 a new process, print ("media such as paint, print and
sculpture"), used with growing skill; E.02 explore what different things
print; E.03 gather by sorting prints by their marks; M.02 choose the thing
that prints what the picture needs; TWA.01 invent a printed pattern; E.01
encounter printed cloth from another culture (drawn in the manner of adinkra
cloth from Ghana). The step up from Grade 1's marks: a print makes the SAME
mark again and again, which is what turns a mark into a pattern.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material

LESSON = {
    "slug": "printing-patterns",
    "title": "Printing Patterns",
    "blurb": "Find out how a print is made, find what leaves, sponges and stamps print, choose the right printer for a picture, print a pattern that repeats, and look closely at a cloth printed with stamps.",
    "steps": [
        step("demo", "How a print is made", "🥔", "Print watcher", ["2E.02", "2M.01"],
             "Press <b>Next</b> and watch a print being made.",
             explain(
                 ["A print is a mark you make by pressing.", "You put paint on something, press it on the paper, and lift it off."],
                 ["The paint goes on the stamp.", "The stamp presses on the paper.", "You lift it, and the mark is left behind.",
                  "Press again, and you get the same mark again."],
                 ["Children rub the stamp round and round.", "Press it straight down, then lift it straight up."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🥔", "cap": "This is a <b>stamp</b>: half a potato with a star cut into it.", "say": "This is a stamp: half a potato with a star cut into it."},
                 {"pic": "🖌️", "cap": "Brush a little <b>paint</b> on the star.", "say": "Brush a little paint on the star.", "sound": "swish"},
                 {"pic": "👇", "cap": "<b>Press</b> it straight down on the paper.", "say": "Press it straight down on the paper.", "sound": "dab"},
                 {"pic": "⭐", "cap": "<b>Lift</b> it straight up. A star is left behind. That is a print.", "say": "Lift it straight up. A star is left behind. That is a print."},
                 {"pic": "🔁", "cap": "Press again, and you get the <b>same</b> star again.", "say": "Press again, and you get the same star again.", "sound": "dab"},
                 {"pic": "🧱", "cap": "Print two shapes in turn, again and again, and you make a <b>pattern</b>.", "say": "Print two shapes in turn, again and again, and you make a pattern.", "sound": "tada"},
             ]},
             "Paint, press, lift. Then press again for the same mark again."),

        step("explore", "Things that print", "🍃", "Print finder", ["2E.02", "2E.01"],
             "Lots of things can make a print. Tap each one to hear what it prints.",
             explain(
                 ["You can print with almost anything that has a shape or a bumpy side.", "Every thing prints its own marks."],
                 ["A leaf prints its lines.", "A sponge prints tiny dots.", "Bubble wrap prints rows of round dots.",
                  "A bottle top prints a circle.", "Half a potato prints the shape you cut into it.", "Your hand prints your hand."],
                 ["Children think only a stamp from a shop can print.", "Look around. Leaves, sponges and bottle tops all print."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🍃", "label": "a leaf", "say": "A leaf. Paint the bumpy back and press it. It prints all its little lines."},
                 {"pic": "🧽", "label": "a sponge", "say": "A sponge. It prints lots of tiny dots, soft and speckly."},
                 {"pic": "🫧", "label": "bubble wrap", "say": "Bubble wrap. It prints rows of round dots, all the same size."},
                 {"pic": "⚪", "label": "a bottle top", "say": "A bottle top. Press the rim in paint and it prints a circle."},
                 {"pic": "🥔", "label": "half a potato", "say": "Half a potato. A grown-up cuts a shape into it, and it prints that shape."},
                 {"pic": "✋", "label": "your hand", "say": "Your hand. Paint your palm and press. It prints your hand and every finger."},
             ], "need": 6,
              "then": {"ask": "Which one prints lines, like the veins you can see on a leaf?",
                       "opts": [opt("a leaf", True), opt("bubble wrap", False), opt("a bottle top", False)],
                       "why": "A leaf's veins stand up on its back, so they print as lines. Bubble wrap prints dots, and a bottle top prints a circle."}},
             "Six things that print, and each one prints its own marks."),

        step("sort", "What will it print?", "🗂️", "Print sorter", ["2E.03", "2E.02"],
             "Think about the bumpy side of each thing. Will it print lines, dots or a shape?",
             explain(
                 ["Before you print, you can guess what the print will look like.", "Look at the side that will touch the paper."],
                 ["A fork has lines, so it prints lines.", "Bubble wrap has bumps, so it prints dots.",
                  "A bottle top has a round rim, so it prints a circle shape."],
                 ["Children look at the colour of the thing.", "The colour does not matter. The bumpy side does."],
                 ["Look at the bumpy side, then tap the bin."]),
             {"ask": "Lines, dots or a shape?",
              "bins": [{"id": "ln", "label": "Lines", "pic": "〰️"}, {"id": "dt", "label": "Dots", "pic": "⚫"}, {"id": "sh", "label": "A shape", "pic": "⭐"}],
              "items": [
                  {"pic": "🍴", "label": "a fork", "bin": "ln", "why": "A fork has long prongs, so it prints lines."},
                  {"pic": "🫧", "label": "bubble wrap", "bin": "dt", "why": "Every bubble prints one round dot."},
                  {"pic": "⚪", "label": "a bottle top", "bin": "sh", "why": "The round rim prints a circle."},
                  {"pic": "🍃", "label": "a leaf", "bin": "ln", "why": "Its veins print as lines."},
                  {"pic": "🧽", "label": "a sponge", "bin": "dt", "why": "A sponge is full of tiny holes, so it prints tiny dots."},
                  {"pic": "🥔", "label": "a potato star", "bin": "sh", "why": "It prints the star shape cut into it."},
                  {"pic": "🪶", "label": "a feather", "bin": "ln", "why": "A feather prints lots of thin lines."},
                  {"pic": "🧻", "label": "the end of a cardboard tube", "bin": "sh", "why": "The round end prints a circle shape."},
              ]},
             "You guessed what eight things would print, from their bumpy sides."),

        step("choose", "Pick the printer", "🧰", "Printer picker", ["2M.02", "2E.02"],
             "Each picture needs a different print. Which thing would print it? Tap one.",
             explain(
                 ["Artists choose the tool that makes the mark they need."],
                 ["Grass wants lines, so pick something that prints lines.", "A ladybird's spots want dots.",
                  "A row of stars wants a star shape."],
                 ["Children pick the thing they like best.", "Pick the one that prints what the picture needs."],
                 ["Read what the picture needs, then tap."]),
             {"materials": [
                 material("leaf", "A leaf", "🍃", ["lines"], "A leaf prints lines."),
                 material("fork", "A fork", "🍴", ["lines"], "A fork prints straight lines."),
                 material("sponge", "A sponge", "🧽", ["dots"], "A sponge prints tiny dots."),
                 material("bubble", "Bubble wrap", "🫧", ["dots"], "Bubble wrap prints round dots in rows."),
                 material("potato", "A potato star", "🥔", ["star"], "A potato star prints a star."),
                 material("top", "A bottle top", "⚪", ["circle"], "A bottle top prints a circle."),
              ],
              "rounds": [
                  {"purpose": "long grass", "needs": "lines", "pic": "🌾", "why": "Grass is made of lines. A leaf or a fork prints lines."},
                  {"purpose": "the spots on a ladybird", "needs": "dots", "pic": "🐞", "why": "Spots are dots. A sponge or bubble wrap prints dots."},
                  {"purpose": "a sky full of stars", "needs": "star", "pic": "🌌", "why": "Stars want a star shape. The potato star prints one."},
                  {"purpose": "a row of balloons", "needs": "circle", "pic": "🎈", "why": "Balloons are round. A bottle top prints a circle."},
              ]},
             "You picked the right printer for four pictures."),

        step("pattern", "Print a pattern", "🧱", "Pattern printer", ["2M.01", "2TWA.01", "2E.03"],
             "Each row is printed with stamps. Tap the print that comes next. Then print your own pattern.",
             explain(
                 ["A printed pattern repeats, just like a pattern of tiles.", "This time some patterns have three or four prints before they start again."],
                 ["Say the prints out loud.", "Listen for where the pattern starts again.", "Then tap what comes next.",
                  "At the end, print your own. It only counts if it repeats!"],
                 ["Children stop listening after two prints.", "Some patterns are longer. Keep going until it starts again."],
                 ["Say it out loud, then tap."]),
             {"tiles": [
                 {"id": "leaf", "label": "leaf", "pic": "🍃"},
                 {"id": "star", "label": "star", "pic": "⭐"},
                 {"id": "circle", "label": "circle", "pic": "⚪"},
                 {"id": "hand", "label": "hand", "pic": "✋"},
              ],
              "rounds": [
                  {"seq": ["leaf", "star", "leaf", "star", "leaf", "star", "leaf", "star"], "show": 4, "ask_n": 2, "ask": "Leaf, star, leaf, star. What comes next?"},
                  {"seq": ["star", "star", "circle", "star", "star", "circle", "star", "star", "circle"], "show": 6, "ask_n": 3, "ask": "Star, star, circle. What comes next?"},
                  {"seq": ["hand", "circle", "leaf", "circle", "hand", "circle", "leaf", "circle", "hand", "circle", "leaf", "circle"], "show": 8, "ask_n": 4, "ask": "Hand, circle, leaf, circle. What comes next?"},
              ],
              "ownMin": 6},
             "One of them was four prints long."),

        step("source", "A cloth printed with stamps", "🟫", "Cloth looker", ["2E.01", "2R.02"],
             "This cloth was printed with stamps, in the manner of the adinkra cloths printed in Ghana. Tap the things in it.",
             explain(
                 ["In Ghana, people print adinkra cloth with stamps carved from a calabash, a hard fruit shell.", "The stamps are pressed in rows, again and again."],
                 ["Tap the circle stamps.", "Tap the lines between the squares. They were drawn with a comb.",
                  "Tap the diamond stamps and the flower stamps."],
                 ["Children think every shape was drawn one at a time.", "Look how the same shape comes again. That is a stamp."],
                 ["Tap three things and listen."]),
             {"scene": "adinkra", "need": 3, "caption": "Tap the circles, the comb lines and the diamonds.",
              "spots": [
                  spot("rings", "the circle stamps", "The same circle stamp, pressed four times in the square. Every one is the same, because it is one stamp.", 52, 58, "⭕"),
                  spot("comb", "the comb lines", "These lines were drawn with a comb dipped in dye. The comb makes four lines at once.", 112, 124, "〰️"),
                  spot("diamonds", "the diamond stamps", "A different stamp, a diamond, pressed again and again in this square.", 166, 186, "🔷"),
                  spot("flowers", "the flower stamps", "A third stamp, a flower of dots. Three stamps, used over and over, fill the whole cloth.", 274, 58, "🌸"),
              ],
              "then": {"ask": "How did the printer make the same shape again and again?",
                       "opts": [{"t": "by pressing the same stamp again and again", "spot": "rings"}, {"t": "by drawing each one by hand"}, {"t": "with a camera"}],
                       "why": "Look at the circles: every one is exactly the same, because one stamp was pressed again and again."}},
             "You found the stamps, the comb lines and the repeats in a printed cloth."),

        step("questions", "Print spotter", "💬", "Print spotter", ["2E.02", "2M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about printing.", "You have met every one of them."],
                 ["Think about paint, press and lift, and what each thing prints."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Prints", "items": [
                 q("What do you do after you press the stamp down?", "⬆️", "lift it straight up", ["rub it round and round", "leave it there"], "Press straight down, then lift straight up. The print is left behind."),
                 q("What does bubble wrap print?", "🫧", "rows of round dots", ["long lines", "a star"], "Every bubble prints a dot."),
                 q("Press the same stamp again, and you get…", "🔁", "the same mark again", ["a different mark", "no mark"], "One stamp makes the same mark every time."),
                 q("Which one prints a circle?", "⚪", "a bottle top", ["a fork", "a feather"], "The round rim of a bottle top prints a circle."),
             ]},
             "You know how printing works."),

        step("quiz", "Show what you know", "⭐", "Star printer", ["2E.01", "2E.02", "2E.03", "2M.01", "2M.02", "2TWA.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about how a print is made, what things print, the patterns and the printed cloth."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a print?", "🥔", "a mark made by pressing", ["a mark made with a pencil", "a colour"], "You put paint on something, press it and lift it. The mark left behind is a print."),
                 q("Which one prints lines?", "🍃", "a leaf", ["bubble wrap", "a bottle top"], "A leaf's veins print as lines."),
                 q("Why do all the circles on the printed cloth look the same?", "⭕", "because one stamp was pressed again and again", ["because the printer was lucky", "because they were drawn very slowly"], "One stamp makes the same shape every time it is pressed."),
                 q("Which one would you print a ladybird's spots with?", "🐞", "a sponge", ["a potato star", "a bottle top"], "Spots are dots, and a sponge prints dots."),
                 q("Hand, circle, leaf, circle. What comes next?", "✋", "hand", ["leaf", "circle"], "The pattern starts again: hand, circle, leaf, circle, hand."),
                 q("Why does a fork print lines?", "🍴", "because it has long, straight prongs", ["because it is shiny", "because it is used for food"], "The prongs touch the paper as long lines, so it prints lines."),
                 q("Star, leaf, star, leaf, again and again, makes…", "🧱", "a pattern", ["a mess", "a circle"], "Shapes that come back in the same order make a pattern."),
                 q("In Ghana, what are adinkra cloth stamps carved from?", "🟫", "a hard fruit shell", ["plastic", "glass"], "They are carved from a calabash, a hard fruit shell."),
             ]},
             "That is the whole lesson finished. You can print, and you can print a pattern that repeats."),
    ],
}


LESSON["about"] = [
    "Make a print: paint, press and lift.",
    "Say what a leaf, a sponge, bubble wrap and a bottle top will print.",
    "Choose the right thing to print what a picture needs.",
    "Print a pattern that repeats, even a long one.",
    "Find the stamps and repeats in a printed cloth.",
]

LESSON["lecture"] = [
    part("🥔", "Paint, press, lift",
         "A print is a mark you make by pressing. Put a little paint on a stamp. Press it straight down. Lift it straight up. The mark that is left is a print."),
    part("🔁", "The same again",
         "The best thing about a print is that you can make it again. Press the same stamp, and you get the same mark. Take turns with two stamps, again and again, and you have a pattern."),
    part("🍃", "Print with anything",
         "You do not need a shop stamp. A leaf prints its lines. A sponge prints tiny dots. A bottle top prints a circle. Look at the bumpy side and guess what it will print."),
    part("🟫", "Printed cloth",
         "In Ghana, people print adinkra cloth with stamps carved from a calabash, a hard fruit shell. They press each stamp again and again, in squares drawn with a comb. A whole cloth, from just a few stamps."),
]

LESSON["words"] = [
    word("print", "🥔", "A mark you make by pressing something with paint on it.",
         ["I made a leaf print.", "Every print came out the same."]),
    word("stamp", "🥔", "A thing with a shape on it that you press to make a print.",
         ["We cut a star stamp from a potato.", "Press the stamp straight down."]),
    word("press", "👇", "To push down hard and steady.",
         ["Press the stamp on the paper.", "I pressed my hand in the paint."]),
    word("repeat", "🔁", "To do the same thing again.",
         ["I repeated the leaf print.", "The pattern repeats."]),
    word("border", "🖼️", "A row of pattern round the edge of something.",
         ["I printed a border of stars.", "The card has a leaf border."]),
    word("dye", "🫙", "A colour that soaks into cloth.",
         ["The cloth was printed with dark dye.", "Dye soaks right into the cloth."]),
]

LESSON["home"] = [
    home("Potato stamps", "Half a potato, a grown-up with a knife, paint on a saucer, and paper",
         ["Ask a grown-up to cut a simple shape into the flat side of the potato, like a star or a heart.",
          "Dab paint on the shape.", "Press it on the paper, then lift it straight up.", "Print it again and again in a row."],
         "Is every print the same? Which one came out best, and why?"),
    home("Leaf prints", "Three different leaves, paint, a brush and paper",
         ["Paint the bumpy back of a leaf.", "Lay it paint side down on the paper and press all over it.",
          "Peel it off slowly.", "Try the other two leaves."],
         "Which leaf printed the most lines?"),
    home("A printed border", "A bottle top, a sponge, a fork, paint and a big sheet of paper",
         ["Print a pattern all round the edge of the paper.", "Use two or three of the printers, in the same order every time.",
          "Draw a picture in the middle when the border is dry."],
         "Does your border repeat all the way round?"),
]

LESSON["journal"] = {
    "changes": ["press the stamp more gently", "use a different colour", "make the pattern longer", "try printing with a leaf", "keep it just as it is"],
}
