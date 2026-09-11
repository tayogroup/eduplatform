# -*- coding: utf-8 -*-
"""Lesson 4 - Shapes and Patterns.

0067 Stage 1: E.01 encounter shape and pattern as formal elements, and
pattern in a tiled wall; E.03 gather by sorting (things by their shape) and
record by mark making; TWA.01 generate ideas - continue a pattern, then
invent one, which counts only if it repeats (computed); M.01 make marks with
growing confidence.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "shapes-and-patterns",
    "title": "Shapes and Patterns",
    "blurb": "Meet the shapes, sort things by their shape, continue a pattern and then invent your own, find the pattern in a wall of tiles, and draw shapes and patterns of your own.",
    "steps": [
        step("explore", "Shapes all around", "🔷", "Shape finder", ["1E.01"],
             "A shape is the outside edge of a thing. Tap each shape to hear about it.",
             explain(
                 ["A shape is the outline of a thing, the line that goes all the way round it."],
                 ["A circle is round, like a ball.", "A square has four sides the same.", "A triangle has three pointy corners.",
                  "A rectangle has four straight sides, two long and two short.", "A star has points.", "An oval is a squashed circle."],
                 ["Children think a square on its corner is a different shape.", "Turn it round. It is still a square."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "⚽", "label": "circle", "say": "A circle. Round all the way, like a ball or a clock."},
                 {"pic": "🎲", "label": "square", "say": "A square. Four straight sides, all the same, like a dice."},
                 {"pic": "🍕", "label": "triangle", "say": "A triangle. Three sides and three pointy corners, like a slice of pizza."},
                 {"pic": "🚪", "label": "rectangle", "say": "A rectangle. Four straight sides, two long and two short, like a door."},
                 {"pic": "⭐", "label": "star", "say": "A star. Points all round, like the stars in the sky."},
                 {"pic": "🥚", "label": "oval", "say": "An oval. A squashed circle, like an egg."},
             ], "need": 6,
              "then": {"ask": "Which shape has three pointy corners?",
                       "opts": [opt("triangle", True), opt("circle", False), opt("square", False)],
                       "why": "A triangle has three sides and three corners. A circle has none."}},
             "Circle, square, triangle, rectangle, star, oval. Six shapes you can find anywhere."),

        step("sort", "Which shape is it?", "🗂️", "Shape sorter", ["1E.03", "1E.01"],
             "Look at the outside edge of each thing. Which shape is it?",
             explain(
                 ["Sorting by shape is gathering what you notice.", "Look at the edge that goes all the way round."],
                 ["A clock is round: circle.", "A door is tall: rectangle.", "A slice of pizza: triangle."],
                 ["Children look at what a thing is for, not its shape.", "A clock and a ball are different things and the same shape."],
                 ["Look at the edge, then tap the bin."]),
             {"ask": "Circle, square, triangle or rectangle?",
              "bins": [{"id": "c", "label": "Circle", "pic": "⚪"}, {"id": "s", "label": "Square", "pic": "🟥"}, {"id": "t", "label": "Triangle", "pic": "🔺"}, {"id": "r", "label": "Rectangle", "pic": "▬"}],
              "items": [
                  {"pic": "🕰️", "label": "a clock", "bin": "c", "why": "A clock face is round. Circle."},
                  {"pic": "🎲", "label": "a dice", "bin": "s", "why": "A dice has four equal sides on its face. Square."},
                  {"pic": "🍕", "label": "a slice of pizza", "bin": "t", "why": "Three sides, three corners. Triangle."},
                  {"pic": "🚪", "label": "a door", "bin": "r", "why": "Tall, with two long sides. Rectangle."},
                  {"pic": "⚽", "label": "a ball", "bin": "c", "why": "Round all the way. Circle."},
                  {"pic": "⚠️", "label": "a warning sign", "bin": "t", "why": "Three pointy corners. Triangle."},
                  {"pic": "📱", "label": "a phone", "bin": "r", "why": "Two long sides, two short. Rectangle."},
                  {"pic": "🪟", "label": "a window pane", "bin": "s", "why": "Four sides the same. Square."},
              ]},
             "You sorted things by their shape. Artists see shapes everywhere."),

        step("pattern", "What comes next?", "🧱", "Pattern maker", ["1E.01", "1TWA.01"],
             "A pattern says the same thing again and again. Tap the tile that comes next. Then make your own.",
             explain(
                 ["A pattern repeats.", "Red, blue, red, blue. After blue comes red, every time."],
                 ["Say the pattern out loud.", "Listen for where it starts again.", "Then tap what comes next.",
                  "At the end, you make your own. It only counts if it repeats!"],
                 ["Children tap their favourite colour.", "Say the pattern out loud first. It tells you the answer."],
                 ["Say it out loud, then tap."]),
             {"tiles": [
                 {"id": "red", "label": "red", "hex": "#E0312B"},
                 {"id": "blue", "label": "blue", "hex": "#2D6CDF"},
                 {"id": "yellow", "label": "yellow", "hex": "#F6C700"},
                 {"id": "green", "label": "green", "hex": "#3FA34D"},
              ],
              "rounds": [
                  {"seq": ["red", "blue", "red", "blue", "red", "blue", "red", "blue"], "show": 4, "ask_n": 2, "ask": "Red, blue, red, blue. What comes next?"},
                  {"seq": ["yellow", "yellow", "green", "yellow", "yellow", "green", "yellow", "yellow", "green"], "show": 6, "ask_n": 3, "ask": "Yellow, yellow, green. What comes next?"},
                  {"seq": ["red", "yellow", "blue", "red", "yellow", "blue", "red", "yellow", "blue"], "show": 6, "ask_n": 3, "ask": "Red, yellow, blue. What comes next?"},
              ],
              "ownMin": 6},
             "You continued three patterns and made one of your own. Yours repeats too."),

        step("source", "Patterns in tiles", "🔷", "Tile looker", ["1E.01"],
             "This wall is made of tiles. Tap the shapes to find the pattern.",
             explain(
                 ["Tiles are art you can walk past every day.", "Tile makers use shapes that repeat to cover a whole wall."],
                 ["Tap a star.", "Tap a blue tile.", "Tap a white tile.", "Blue, white, blue, white. The tiles are a pattern too."],
                 ["Children see only 'blue and white'.", "Look for the shape that comes back again and again."],
                 ["Tap three things and listen."]),
             {"scene": "tiles", "need": 3, "caption": "Tap the star, a blue tile and a white tile.",
              "spots": [
                  spot("star", "a star shape", "Every tile has a star in the middle. The same shape, again and again.", 120, 120, "⭐"),
                  spot("bluetile", "a blue tile", "A blue tile with a white star. Next to it is the opposite.", 200, 40, "🟦"),
                  spot("whitetile", "a white tile", "A white tile with a blue star. Blue, white, blue, white, across the whole wall.", 280, 40, "⬜"),
              ],
              "then": {"ask": "How does the tile maker cover the whole wall?",
                       "opts": [{"t": "with the same shapes, repeated again and again", "spot": "star"}, {"t": "with one giant tile"}, {"t": "with no shapes at all"}],
                       "why": "Look at the stars and the squares: the same shapes come back again and again, all the way across."}},
             "You found the pattern in a wall of tiles."),

        step("marks", "Draw shapes and patterns", "🖍️", "Shape drawer", ["1M.01", "1E.03"],
             "Now draw them yourself. Make the shape the card asks for.",
             explain(
                 ["You can draw a shape with one line, and a pattern with lots of marks."],
                 ["A circle is one line that goes all the way round, back to the start.", "A zigzag is a line of sharp turns, and a row of them is a pattern.",
                  "A row of dots is a pattern too."],
                 ["Children draw a circle that does not join up.", "Go all the way round to where you started."],
                 ["Draw a circle with the crayon."]),
             {"tools": ["crayon", "pencil", "finger", "brush"],
              "rounds": [
                  {"tool": "crayon", "want": "round", "made": "a circle", "ask": "Draw a circle. Go all the way round.", "pic": "⚪", "why": "One line, all the way round, back to the start. A circle."},
                  {"tool": "pencil", "want": "zigzag", "made": "a zigzag pattern", "ask": "Draw a zigzag: up, down, up, down, all along.", "pic": "🔺", "why": "Up, down, up, down. A zigzag repeats, so it is a pattern too."},
                  {"tool": "finger", "want": "dots", "made": "a row of dots", "ask": "Make a row of dots with your finger.", "pic": "🐾", "why": "Dot, dot, dot, dot. The same mark again and again is a pattern."},
              ]},
             "You drew a circle, a zigzag pattern and a row of dots, and then a drawing of your own."),

        step("questions", "Shape and pattern quiz", "💬", "Pattern spotter", ["1E.01", "1TWA.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about shapes and patterns."],
                 ["Think about the six shapes, the tiles, and the tiles you put in a row."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Pattern", "items": [
                 q("Red, blue, red, blue, red… what comes next?", "🟥", "blue", ["red", "yellow"], "After red comes blue, every time."),
                 q("A pattern is something that…", "🧱", "repeats", ["is very big", "is only blue"], "A pattern says the same thing again and again."),
                 q("Which shape is a squashed circle?", "🥚", "oval", ["square", "triangle"], "An oval is a circle squashed a little."),
                 q("Which shape has four sides, two long and two short?", "🚪", "rectangle", ["circle", "star"], "A rectangle has four straight sides: two long ones and two short ones."),
             ]},
             "You know your shapes and your patterns."),

        step("quiz", "Show what you know", "⭐", "Star pattern maker", ["1E.01", "1E.03", "1M.01", "1TWA.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the shapes, the sorting, the patterns, the tiles and the drawing."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a shape?", "🔷", "the outside edge of a thing", ["a colour", "a kind of paint"], "The line that goes all the way round a thing is its shape."),
                 q("A clock face is a…", "🕰️", "circle", ["square", "triangle"], "Round all the way. Circle."),
                 q("A slice of pizza is a…", "🍕", "triangle", ["rectangle", "oval"], "Three sides, three corners."),
                 q("Yellow, yellow, green, yellow, yellow… what comes next?", "🟨", "green", ["yellow", "blue"], "Yellow, yellow, green, and then it starts again."),
                 q("Does a row of the same tile count as a pattern?", "🟦", "no, a pattern needs two or more different tiles that repeat", ["yes, always", "only if it is red"], "Blue, blue, blue is a line of tiles. Blue, white, blue, white is a pattern."),
                 q("What repeats on the tile wall?", "⭐", "a star shape", ["a fish", "a face"], "Every tile has a star in the middle."),
                 q("To draw a circle, the line goes…", "⚪", "all the way round, back to the start", ["straight up", "in a zigzag"], "One line, all the way round, joined up."),
                 q("Up, down, up, down along the paper makes a…", "⚡", "zigzag pattern", ["circle", "blob"], "Sharp turns that repeat make a zigzag pattern."),
             ]},
             "That is the whole lesson finished. You can see a shape, and make a pattern."),
    ],
}


LESSON["about"] = [
    "Name six shapes: circle, square, triangle, rectangle, star and oval.",
    "Sort things by their shape.",
    "Say what comes next in a pattern, and make a pattern of your own that repeats.",
    "Find the shapes that repeat in a wall of tiles.",
    "Draw a circle, a zigzag pattern and a row of dots.",
]

LESSON["lecture"] = [
    part("🔷", "Shapes",
         "A shape is the outside edge of a thing, the line that goes all the way round it. A ball is a circle. A dice is a square. A slice of pizza is a triangle. A door is a rectangle. Once you start looking, shapes are everywhere."),
    part("🧱", "Patterns",
         "A pattern says the same thing again and again. Red, blue, red, blue. Star, square, star, square. If you can say what comes next, it is a pattern. If it never repeats, it is not."),
    part("🔷", "Patterns in tiles",
         "Tile makers cover a whole wall with the same shapes, repeated. A blue tile, a white tile, a blue tile, a white tile, and a star in every one. That is a pattern you can walk past every day."),
    part("🖍️", "Making your own",
         "You can make a pattern with anything: tiles, dots, zigzags, shapes. Choose two or three things, put them in a row, and say them again and again. That is your own pattern, and nobody else's."),
]

LESSON["words"] = [
    word("shape", "🔷", "The outside edge of a thing: the line that goes all the way round it.",
         ["A ball is a round shape.", "What shape is the door?"]),
    word("pattern", "🧱", "Something that says the same thing again and again.",
         ["Red, blue, red, blue is a pattern.", "I made a pattern with dots."]),
    word("repeat", "🔁", "To do the same thing again.",
         ["The stars repeat on every tile.", "A pattern has to repeat."]),
    word("circle", "⚪", "A round shape, the same all the way round.",
         ["A clock is a circle.", "I drew a circle."]),
    word("triangle", "🔺", "A shape with three sides and three corners.",
         ["A slice of pizza is a triangle.", "The roof is a triangle."]),
    word("rectangle", "▬", "A shape with four sides, two long and two short.",
         ["A door is a rectangle.", "My book is a rectangle."]),
]

LESSON["home"] = [
    home("Kitchen patterns", "Spoons, forks, cups, or anything you have lots of",
         ["Put them in a row: spoon, fork, spoon, fork.", "Ask a grown-up what comes next.",
          "Now let the grown-up make a pattern, and YOU say what comes next."],
         "How many things did your pattern use? Two, or three?"),
    home("Shape hunt", "A grown-up and a room",
         ["Find three circles, three squares and three rectangles.", "Find one triangle. They are the hardest!",
          "Draw the shapes you found."],
         "Which shape was easiest to find? Which was hardest?"),
    home("A printed pattern", "A potato cut in half, paint on a plate, and a long strip of paper",
         ["Ask a grown-up to cut a shape into the flat side of the potato.", "Dip it in paint and print it on the paper.",
          "Print it again and again, all along the strip, turning it or changing colour to make a pattern."],
         "Say your pattern out loud. Does it repeat?"),
]

LESSON["journal"] = {
    "changes": ["use three colours instead of two", "make the pattern longer", "add a star shape", "make the circle bigger", "keep it just as it is"],
}
