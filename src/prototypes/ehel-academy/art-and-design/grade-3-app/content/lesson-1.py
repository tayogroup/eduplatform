# -*- coding: utf-8 -*-
"""Lesson 1 - My Sketchbook.

0067 Stage 3: E.03 "the use of a visual journal to support the process of
gathering and recording experiences ... using a visual journal to record the
patterns found on the surfaces of different buildings and then developing
this in a print design" - the Stages 3-4 progression text's own example,
played as this lesson's spine; M.02 choose how to record each thing; M.01
show the stages from a sketch to a print; TWA.01 develop a found pattern into
a design; R.01 a sketchbook as the record of personal progress; E.01 look
closely at a building as a source. The step up from Grade 2: Grade 2
collected things; Grade 3 records them on purpose, in the right way, and
turns the record into new work.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material

LESSON = {
    "slug": "my-sketchbook",
    "title": "My Sketchbook",
    "blurb": "Find out what a sketchbook is for, gather the patterns on a building, choose the best way to record each thing, sort patterns by their kind, turn a building's shapes into a print design, and put the steps from sketch to print in order.",
    "steps": [
        step("explore", "What goes in a sketchbook?", "📓", "Sketchbook explorer", ["3E.03", "3R.01"],
             "A sketchbook is where artists gather ideas. Tap each thing to hear why it belongs.",
             explain(
                 ["A sketchbook is an artist's notebook.", "It is not for best work. It is for gathering, trying and thinking."],
                 ["Quick sketches catch shapes.", "Notes beside a sketch are called annotations.", "Colour tests show what a colour will look like.",
                  "Rubbings and things you collect keep textures and memories."],
                 ["Children only put finished pictures in.", "Put in the messy tries too. They show how your ideas grew."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "✏️", "label": "quick sketches", "say": "Quick sketches. A few fast lines to catch a shape before you forget it."},
                 {"pic": "📝", "label": "annotations", "say": "Annotations: short notes beside a sketch, like 'rough bricks' or 'the door was bright blue'."},
                 {"pic": "🎨", "label": "colour tests", "say": "Colour tests. Little patches of paint to see which colour works best."},
                 {"pic": "🖍️", "label": "rubbings", "say": "Rubbings. Crayon rubbed over a bumpy surface keeps its texture."},
                 {"pic": "🎟️", "label": "things you collect", "say": "Things you collect, like a ticket or a leaf, stuck in to remember a day."},
                 {"pic": "💡", "label": "ideas for later", "say": "Ideas for later. A sketchbook remembers ideas you are not ready to use yet."},
             ], "need": 6,
              "then": {"ask": "What are short notes written beside a sketch called?",
                       "opts": [opt("annotations", True), opt("patterns", False), opt("rubbings", False)],
                       "why": "Notes beside a sketch are annotations. They say what the sketch cannot, like a colour or a feeling."}},
             "A sketchbook holds sketches, notes, colours, rubbings, finds and ideas."),

        step("source", "Patterns on a building", "🏠", "Pattern gatherer", ["3E.03", "3E.01"],
             "Buildings are full of patterns. Tap the patterns on this building, as if you were gathering them for your sketchbook.",
             explain(
                 ["Walk down any street and you will find patterns.", "Bricks, windows, railings and roofs all repeat."],
                 ["Tap the bricks.", "Tap the arch over the window.", "Tap the railings and the roof tiles."],
                 ["Children only see 'a house'.", "Look again, for the shapes that repeat."],
                 ["Tap three things and listen."]),
             {"scene": "buildings", "need": 3, "caption": "Tap the bricks, the arch and the railings.",
              "spots": [
                  spot("bricks", "the bricks", "Rectangles laid in rows, with each row moved along by half a brick. The pattern holds the wall together.", 40, 96, "🧱"),
                  spot("arch", "the arch", "The arched top of the window: a curve. Arches have been used in buildings for thousands of years.", 160, 80, "🌈"),
                  spot("railings", "the railings", "Straight lines with points, again and again. A pattern of lines.", 264, 224, "📍"),
                  spot("roof", "the roof tiles", "Curved tiles side by side, like a row of fish scales.", 100, 28, "🐟"),
              ],
              "then": {"ask": "Which pattern is made of rectangles in rows?",
                       "opts": [{"t": "the bricks", "spot": "bricks"}, {"t": "the arch"}, {"t": "the railings"}],
                       "why": "The bricks are rectangles in rows. The arch is a curve, and the railings are lines."}},
             "You gathered four patterns from one building."),

        step("choose", "How will you record it?", "🧰", "Recorder", ["3M.02", "3E.03"],
             "Each thing you found is best recorded in a different way. Which way would you use? Tap it.",
             explain(
                 ["There is more than one way to record what you see.", "Choosing the best way is part of being an artist."],
                 ["A shape is best sketched.", "A texture is best rubbed.", "A colour is best tested with paint.",
                  "A sound or a feeling is best written down."],
                 ["Children sketch everything.", "Ask: what am I trying to keep? Then choose."],
                 ["Read what you want to keep, then tap."]),
             {"materials": [
                 material("sketch", "A quick sketch", "✏️", ["shape"], "A sketch keeps a shape."),
                 material("rub", "A rubbing", "🖍️", ["texture"], "A rubbing keeps a texture."),
                 material("paint", "A colour test", "🎨", ["colour"], "A colour test keeps a colour."),
                 material("photo", "A photo", "📷", ["quick"], "A photo keeps everything at once, very fast."),
                 material("note", "A written note", "📝", ["words"], "A note keeps what you heard and felt."),
              ],
              "rounds": [
                  {"purpose": "the curved shape of the arch", "needs": "shape", "pic": "🌈", "why": "A shape is best kept with a quick sketch."},
                  {"purpose": "the bumpy surface of a brick", "needs": "texture", "pic": "🧱", "why": "A rubbing keeps the bumps."},
                  {"purpose": "the exact blue of the front door", "needs": "colour", "pic": "🚪", "why": "A colour test shows exactly which blue."},
                  {"purpose": "the whole street, in one second", "needs": "quick", "pic": "🏘️", "why": "A photo keeps the whole street at once."},
                  {"purpose": "the sound of the traffic and how it felt", "needs": "words", "pic": "🚌", "why": "Sounds and feelings are best written down."},
              ]},
             "You chose the best way to record five things."),

        step("sort", "Which kind of pattern?", "🗂️", "Pattern sorter", ["3E.03", "3E.01"],
             "Patterns on buildings come in kinds. Is each one made of rows and grids, lines, or curves? Tap the bin.",
             explain(
                 ["Sorting what you gathered helps you see it more clearly."],
                 ["Bricks and window panes make rows and grids.", "Railings and fences make lines.",
                  "Arches and roof tiles make curves."],
                 ["Children sort by what the thing is.", "Sort by the SHAPE of the pattern."],
                 ["Look at the pattern, then tap the bin."]),
             {"ask": "Grids, lines, or curves?",
              "bins": [{"id": "grid", "label": "Grids", "pic": "🔲"}, {"id": "line", "label": "Lines", "pic": "📏"}, {"id": "curve", "label": "Curves", "pic": "🌈"}],
              "items": [
                  {"pic": "🧱", "label": "a brick wall", "bin": "grid", "why": "Bricks sit in rows, one row above another."},
                  {"pic": "🪟", "label": "window panes", "bin": "grid", "why": "Window panes make a grid of squares."},
                  {"pic": "📍", "label": "iron railings", "bin": "line", "why": "Railings are straight lines, side by side."},
                  {"pic": "🪵", "label": "a wooden fence", "bin": "line", "why": "Planks stand side by side: lines."},
                  {"pic": "🏛️", "label": "arches over a doorway", "bin": "curve", "why": "An arch is a curve."},
                  {"pic": "🐟", "label": "curved roof tiles", "bin": "curve", "why": "Each tile is curved, like a scale."},
                  {"pic": "⛱️", "label": "stripes on a shop awning", "bin": "line", "why": "Stripes are lines."},
                  {"pic": "⭕", "label": "a round window", "bin": "curve", "why": "A round window is one big curve."},
              ]},
             "You sorted eight building patterns by their kind."),

        step("pattern", "From building to print design", "🧱", "Pattern designer", ["3TWA.01", "3M.01"],
             "These print designs use shapes from the building. Tap the shape that comes next. Then design your own.",
             explain(
                 ["A pattern you gathered can become a new design.", "Take a shape from the building, and repeat it your own way."],
                 ["Say the shapes out loud.", "Listen for where the pattern starts again.", "Some repeat every four shapes.",
                  "At the end, design your own. It only counts if it repeats!"],
                 ["Children stop at the first repeat.", "Check the whole row, all the way along."],
                 ["Say it out loud, then tap."]),
             {"tiles": [
                 {"id": "brick", "label": "brick", "pic": "🟫"},
                 {"id": "arch", "label": "arch", "pic": "🌈"},
                 {"id": "point", "label": "railing point", "pic": "🔺"},
                 {"id": "window", "label": "round window", "pic": "⭕"},
              ],
              "rounds": [
                  {"seq": ["brick", "arch", "brick", "arch", "brick", "arch", "brick", "arch"], "show": 4, "ask_n": 2, "ask": "Brick, arch, brick, arch. What comes next?"},
                  {"seq": ["point", "point", "brick", "point", "point", "brick", "point", "point", "brick"], "show": 6, "ask_n": 3, "ask": "Point, point, brick. What comes next?"},
                  {"seq": ["arch", "window", "point", "window", "arch", "window", "point", "window", "arch", "window", "point", "window"], "show": 8, "ask_n": 4, "ask": "Arch, window, point, window. What comes next?"},
              ],
              "ownMin": 6},
             "One of them repeated every four shapes."),

        step("order", "From sketch to print, in order", "📓", "Print planner", ["3M.01", "3E.03"],
             "Here is how a sketch becomes a print. Tap the steps in the order you would do them.",
             explain(
                 ["A print does not start with printing.", "It starts with looking, in your sketchbook."],
                 ["First look and sketch.", "Then add notes and try colours.", "Then choose your best idea.",
                  "Then make the printing block, and print."],
                 ["Children rush to the printing.", "The sketchbook steps are what make the print good."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "👀", "label": "look closely and sketch the pattern", "say": "First, look closely at the building and sketch the pattern."},
                 {"pic": "📝", "label": "write notes and try colours", "say": "Write notes beside the sketch, what it felt like, and try out some colours on the page."},
                 {"pic": "✅", "label": "choose your best idea", "say": "Look back at your pages and choose your best idea."},
                 {"pic": "✏️", "label": "press the design into a foam printing block", "say": "Draw your design on a foam printing block, pressing the lines in with a pencil."},
                 {"pic": "🖼️", "label": "print it", "say": "Roll ink on the tile, press it on paper, and print."},
             ]},
             "Look, note, try, choose, make, print. That is how a sketch becomes a print."),

        step("questions", "Sketchbook spotter", "💬", "Sketchbook spotter", ["3E.03", "3M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about sketchbooks and gathering.", "You have met every one of them."],
                 ["Think about what goes in a sketchbook, the building's patterns, and how to record each thing."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Sketchbooks", "items": [
                 q("What is the best way to record the bumpy surface of a brick?", "🧱", "a rubbing", ["a written note", "a photo"], "A rubbing keeps the bumps of a surface."),
                 q("Railings make a pattern of…", "📍", "lines", ["curves", "dots"], "Railings are straight lines, side by side."),
                 q("A sketchbook is for…", "📓", "gathering, trying and thinking", ["only your best work", "copying other people"], "A sketchbook is where ideas grow, messy tries and all."),
                 q("What do you do first, to make a print from a building's pattern?", "👀", "look closely and sketch it", ["print it", "roll on the ink"], "It starts with looking and sketching."),
             ]},
             "You know how to use a sketchbook."),

        step("quiz", "Show what you know", "⭐", "Star sketcher", ["3E.01", "3E.03", "3M.01", "3M.02", "3TWA.01", "3R.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the sketchbook, the building, recording, sorting, designing and printing."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What are notes beside a sketch called?", "📝", "annotations", ["rubbings", "prints"], "Notes beside a sketch are annotations."),
                 q("Why put messy tries in your sketchbook?", "📓", "because they show how your ideas grew", ["because you ran out of paper", "because messy is always best"], "A sketchbook shows the journey, not just the end."),
                 q("Which is the best way to keep the exact colour of a door?", "🚪", "a colour test", ["a rubbing", "a written note"], "A colour test shows exactly which colour."),
                 q("Why sketch the arch instead of rubbing it?", "🌈", "because you want its shape, not its texture", ["because arches have no colour", "because rubbings are not allowed"], "A sketch keeps a shape. A rubbing keeps a texture."),
                 q("Arches and roof tiles make a pattern of…", "🐟", "curves", ["lines", "rows and grids"], "Arches and curved tiles are curves."),
                 q("Arch, window, point, window. What comes next?", "🌈", "arch", ["window", "point"], "The pattern starts again: arch."),
                 q("Bricks in a wall are laid…", "🧱", "in rows, each row moved along by half a brick", ["in a circle", "one on top of another in a single line"], "Each row is moved along by half a brick."),
                 q("After you choose your best idea, what comes next?", "✏️", "make the printing block", ["sketch the building", "write the notes"], "Look, note, try, choose, then make the block and print."),
             ]},
             "That is the whole lesson finished. You can gather, record and design like an artist."),
    ],
}


LESSON["about"] = [
    "Say what a sketchbook is for, and what an annotation is.",
    "Gather the patterns on a building.",
    "Choose the best way to record a shape, a texture, a colour or a sound.",
    "Sort patterns into rows and grids, lines and curves.",
    "Turn a building's shapes into a print design, in the right order.",
]

LESSON["lecture"] = [
    part("📓", "An artist's notebook",
         "A sketchbook is an artist's notebook. It is not for best work. It is for gathering, trying and thinking. Messy tries belong in it, because they show how your ideas grew."),
    part("🏠", "Patterns everywhere",
         "Walk down any street and look for patterns. Bricks in rows. Railings in lines. Arches and roof tiles in curves. Gather them in your sketchbook."),
    part("🖍️", "Record it the right way",
         "Choose the best way to record each thing. Sketch a shape. Rub a texture. Test a colour. Write down a sound or a feeling. Notes beside a sketch are called annotations."),
    part("🖼️", "From sketch to print",
         "A print starts in the sketchbook. Look and sketch. Add notes and colours. Choose your best idea. Then press it into a foam printing block, and print it."),
]

LESSON["words"] = [
    word("sketchbook", "📓", "An artist's notebook for gathering, trying and thinking.",
         ["I drew the railings in my sketchbook.", "My sketchbook is full of ideas."]),
    word("sketch", "✏️", "A quick drawing that catches a shape.",
         ["I made a sketch of the arch.", "Sketch it fast, before it moves."]),
    word("annotation", "📝", "A short note written beside a sketch.",
         ["My annotation says 'rough bricks'.", "Add an annotation about the colour."]),
    word("record", "🖍️", "To keep what you saw, heard or felt.",
         ["I recorded the texture with a rubbing.", "Record the colour with paint."]),
    word("arch", "🌈", "A curved shape over a door or window.",
         ["The window has an arch.", "I sketched three arches."]),
    word("design", "🖼️", "A plan for how something will look.",
         ["My print design uses bricks and arches.", "I changed my design."]),
]

LESSON["home"] = [
    home("Pattern walk", "A small notebook, a pencil, a crayon and a grown-up",
         ["Walk down your street with a grown-up.", "Sketch three patterns you find on buildings: bricks, railings, tiles or windows.",
          "Make a rubbing of one bumpy surface.", "Write one annotation beside each sketch."],
         "Which pattern could become a print?"),
    home("A sketchbook page", "A page of your sketchbook, pencils and paints",
         ["Choose one pattern you gathered.", "Draw it three different ways: bigger, smaller, and in new colours.",
          "Circle the one you like best and write why."],
         "What did you change each time?"),
    home("Foam print", "A foam printing block or a flat polystyrene tray, a blunt pencil, paint, a roller or brush, and a grown-up",
         ["Draw your pattern on the foam, pressing the lines in.", "Roll or brush paint over the foam.",
          "Press paper on top, rub the back, and peel it off."],
         "Did the pressed lines stay white?"),
]

LESSON["journal"] = {
    "changes": ["gather more patterns first", "try it in new colours", "make the design repeat further", "add more annotations", "keep it just as it is"],
}
