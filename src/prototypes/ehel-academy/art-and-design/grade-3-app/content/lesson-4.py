# -*- coding: utf-8 -*-
"""Lesson 4 - Clay Relief.

0067 Stage 3: E.02 "if learners were previously introduced to simple ways
to manipulate clay, they would now be taught how to join clay, how to make
marks and how to create reliefs" - the progression text's own example; M.01
the stages of making a relief tile; M.02 choose a tool for each texture;
TWA.03 review and refine a tile that went wrong; R.02 connect a child's
relief to one made long ago; E.01 encounter a pictorial brick in the manner
of Han dynasty China; E.03 sort raised from pressed-in surfaces. The step up
from Grade 2: Grade 2 joined clay so a model stood up; Grade 3 uses joins and
marks to make a picture stand out from a flat surface.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material, change

LESSON = {
    "slug": "clay-relief",
    "title": "Clay Relief",
    "blurb": "Watch a relief tile being made, sort raised surfaces from pressed-in ones, choose tools for clay textures, fix three tiles that went wrong, and look closely at a picture brick from long ago.",
    "steps": [
        step("demo", "Make a relief tile", "🟫", "Tile watcher", ["3E.02", "3M.01"],
             "Press <b>Next</b> and watch a clay relief tile being made.",
             explain(
                 ["A relief is a picture that stands out from a flat surface.", "Some parts are raised up. Some are pressed in."],
                 ["Roll a flat slab and cut a tile.", "Score and slip shapes on to make raised parts.",
                  "Press lines and textures in.", "Dry it slowly so it does not crack."],
                 ["Children stick shapes on without scoring.", "Raised parts must be scored and slipped, or they fall off."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🫓", "cap": "Roll the clay into a flat <b>slab</b>, as thick as your finger.", "say": "Roll the clay into a flat slab, as thick as your finger."},
                 {"pic": "🔲", "cap": "Cut out a square <b>tile</b>.", "say": "Cut out a square tile."},
                 {"pic": "✏️", "cap": "Draw your design lightly on the tile with a pencil.", "say": "Draw your design lightly on the tile with a pencil."},
                 {"pic": "🍴", "cap": "<b>Score and slip</b> clay shapes on top, so they stand up: that is <b>raised</b>.", "say": "Score and slip clay shapes on top, so they stand up: that is raised.", "sound": "squelch"},
                 {"pic": "👇", "cap": "<b>Press in</b> lines and textures with tools.", "say": "Press in lines and textures with tools.", "sound": "click"},
                 {"pic": "🐢", "cap": "Dry it <b>slowly</b>, under a loose sheet of plastic, so it does not crack.", "say": "Dry it slowly, under a loose sheet of plastic, so it does not crack.", "sound": "tada"},
             ]},
             "Slab, tile, design, raise, press, and dry slowly. That is a relief tile."),

        step("sort", "Raised or pressed in?", "🗂️", "Relief sorter", ["3E.02", "3E.03"],
             "Some surfaces stand out and some are pressed in. Which is each one? Tap the bin.",
             explain(
                 ["A raised relief stands up from the surface.", "A pressed-in design sinks into it."],
                 ["The head on a coin stands up: raised.", "A footprint in the sand sinks in: pressed in."],
                 ["Children call everything raised if they can feel it.", "Ask: does it stand UP, or sink IN?"],
                 ["Think up or in, then tap the bin."]),
             {"ask": "Raised, or pressed in?",
              "bins": [{"id": "up", "label": "Raised", "pic": "⬆️"}, {"id": "in", "label": "Pressed in", "pic": "⬇️"}],
              "items": [
                  {"pic": "🪙", "label": "the head on a coin", "bin": "up", "why": "The head stands up from the coin. Raised."},
                  {"pic": "👣", "label": "a footprint in wet sand", "bin": "in", "why": "Your foot pressed the sand down. Pressed in."},
                  {"pic": "🪧", "label": "letters written with a stick in wet cement", "bin": "in", "why": "The stick pushed the cement down. Pressed in."},
                  {"pic": "🔘", "label": "a flower standing up on a button", "bin": "up", "why": "The flower stands up from the button. Raised."},
                  {"pic": "🍂", "label": "a leaf print on a clay tile", "bin": "in", "why": "The leaf was pressed into the clay. Pressed in."},
                  {"pic": "🦯", "label": "bumps on the pavement that blind people feel with their feet", "bin": "up", "why": "The bumps stand up so feet and canes can feel them. Raised."},
                  {"pic": "🧱", "label": "a maker's mark on an old brick, made with a stamp", "bin": "in", "why": "The stamp pushed the name into the clay. Pressed in."},
              ]},
             "You sorted seven surfaces into raised and pressed in."),

        step("choose", "Tools for clay textures", "🧰", "Texture chooser", ["3M.02", "3E.02"],
             "Each part of a tile needs a different texture. Which tool would press it in? Tap one.",
             explain(
                 ["Almost anything can make a mark in soft clay.", "Choose the tool whose mark looks like the thing."],
                 ["A fork drags lines, like fur.", "A pencil end makes dots.", "A shell presses curved ridges, like scales.",
                  "Lace presses a lacy pattern."],
                 ["Children use a finger for everything.", "Try the tool that matches the texture."],
                 ["Read the part, then tap the tool."]),
             {"materials": [
                 material("fork", "A fork", "🍴", ["lines"], "A fork drags rows of lines."),
                 material("pencil", "The end of a pencil", "✏️", ["dots"], "A pencil end presses dots."),
                 material("shell", "A shell", "🐚", ["ridges"], "A shell presses curved ridges."),
                 material("lace", "A piece of lace", "🧶", ["lacy"], "Lace presses a lacy pattern."),
                 material("leaf", "A real leaf", "🍃", ["veins"], "A leaf presses its veins."),
              ],
              "rounds": [
                  {"purpose": "the fur on a cat", "needs": "lines", "pic": "🐈", "why": "Fur is lines. A fork drags them."},
                  {"purpose": "raindrops", "needs": "dots", "pic": "🌧️", "why": "Raindrops are dots. A pencil end presses them."},
                  {"purpose": "the scales on a fish", "needs": "ridges", "pic": "🐟", "why": "Scales are curved ridges, like the ridges of a shell."},
                  {"purpose": "a pretty border round the edge", "needs": "lacy", "pic": "🖼️", "why": "Lace presses a lacy pattern."},
                  {"purpose": "a leaf on a tree", "needs": "veins", "pic": "🌳", "why": "A real leaf presses its own veins."},
              ]},
             "You chose the tool for five clay textures."),

        step("refine", "Fix the relief", "🔧", "Relief mender", ["3TWA.03", "3R.02"],
             "These tiles went wrong. Why did it happen? Which change fixes it? Tap one and see.",
             explain(
                 ["When a tile goes wrong, look at what happened and why.", "Then change the one thing that caused it."],
                 ["A raised part fell off: it was not scored and slipped.", "The lines are too faint: press deeper.",
                  "The tile cracked: it dried too fast."],
                 ["Children blame the clay.", "The clay did what clay does. Find what YOU can change."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Ama's bird tile", "pic": "🐦", "fixedPic": "🕊️", "problem": "The raised bird fell off as the tile dried.", "fixed": "The bird stays on the tile."},
                  "needs": "join",
                  "changes": [
                      change("score", "Make a new bird, and score and slip it on while the clay is soft", "🍴", "join", "Scored and slipped while soft, the new bird stays on for good."),
                      change("paint", "Paint the bird blue", "🟦", "colour", "A blue bird, still falling off."),
                      change("press", "Press it on harder, dry", "👇", "worse", "Pressed on dry, it cracks off again."),
                      change("wing", "Give it bigger wings", "🐦", "add", "Bigger wings, and it still falls off."),
                  ],
                  "why": "A raised part must be scored and slipped, or it falls off when it dries."},
                 {"piece": {"title": "Hugo's fish tile", "pic": "🐟", "fixedPic": "🐠", "problem": "The scales are so faint you can hardly see them.", "fixed": "The scales show clearly now."},
                  "needs": "deep",
                  "changes": [
                      change("deeper", "Press the shell in deeper", "🐚", "deep", "Deeper marks catch the light and the shadow. Now the scales show."),
                      change("smooth", "Smooth the tile with a wet finger", "💧", "worse", "Smoothing rubbed the faint scales away completely."),
                      change("big", "Make the tile bigger", "🔍", "size", "A bigger tile with the same faint scales."),
                      change("colour", "Colour it with a felt pen", "🖊️", "colour", "Felt pen on clay smudges, and the scales are still faint."),
                  ],
                  "why": "Faint marks need pressing deeper, so they catch light and shadow."},
                 {"piece": {"title": "Sofia's leaf tile", "pic": "💔", "fixedPic": "🍃", "problem": "The tile cracked as it dried.", "fixed": "It dried in one piece."},
                  "needs": "slow",
                  "changes": [
                      change("slow", "Dry the next one slowly, under a loose plastic sheet", "🐢", "slow", "Drying slowly, the clay shrinks evenly and does not crack."),
                      change("oven", "Put it on the radiator to dry fast", "♨️", "worse", "Drying fast makes it crack even more."),
                      change("thin", "Make it thinner at one end", "📐", "worse", "Thick and thin parts dry unevenly, and crack."),
                      change("leaf", "Add another leaf", "🍂", "add", "Two leaves, and still a crack."),
                  ],
                  "why": "Clay shrinks as it dries. Dry it slowly and evenly, and it stays whole."},
             ]},
             "You found why three tiles went wrong, and fixed each one."),

        step("source", "A brick with a picture, from long ago", "🐎", "Brick looker", ["3E.01", "3R.02"],
             "This brick is drawn in the manner of picture bricks made in China about two thousand years ago. Tap the parts.",
             explain(
                 ["About two thousand years ago, in Han dynasty China, people made clay bricks with pictures on them.",
                  "The pictures show everyday life: horses, carts, farmers and markets."],
                 ["Tap the horse. It is raised.", "Tap the cart's wheel.", "Tap the dots pressed into the border."],
                 ["Children think it was carved one brick at a time.", "Many were pressed from a carved mould, so the same picture could be made again."],
                 ["Tap three things and listen."]),
             {"scene": "relief", "need": 3, "caption": "Tap the horse, the wheel and the dots.",
              "spots": [
                  spot("horse", "the horse", "The horse stands up from the brick. It is a raised relief, and it throws a little shadow.", 100, 132, "🐎"),
                  spot("wheel", "the cart's wheel", "The cart and its wheel are raised too, with lines pressed in for the spokes.", 210, 164, "☸️"),
                  spot("dots", "the dotted border", "A row of dots pressed into the clay. These are pressed in, not raised.", 120, 209, "⚫"),
              ],
              "then": {"ask": "Which parts stand up from the brick?",
                       "opts": [{"t": "the horse and the cart", "spot": "horse"}, {"t": "the dots in the border"}, {"t": "the flat background"}],
                       "why": "The horse and cart are raised. The border dots are pressed in, and the background is flat."}},
             "You found the raised and pressed-in parts of a picture brick."),

        step("questions", "Relief spotter", "💬", "Relief spotter", ["3E.02", "3M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about clay reliefs.", "You have met every one of them."],
                 ["Think about raised and pressed in, textures, and fixing tiles."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Relief", "items": [
                 q("A footprint in wet sand is…", "👣", "pressed in", ["raised", "painted"], "It sinks into the sand."),
                 q("Which tool presses dots?", "✏️", "the end of a pencil", ["a fork", "a shell"], "A pencil end presses dots."),
                 q("How should a relief tile dry?", "🐢", "slowly, under loose plastic", ["fast, on a radiator", "in the sun, quickly"], "Slow, even drying stops cracks."),
                 q("What is a relief?", "🟫", "a picture that stands out from a flat surface", ["a flat painting", "a woven mat"], "A relief stands out from a flat surface."),
             ]},
             "You know how reliefs are made."),

        step("quiz", "Show what you know", "⭐", "Star relief maker", ["3E.01", "3E.02", "3E.03", "3M.01", "3M.02", "3R.02", "3TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the tile, raised and pressed in, textures, fixing, and the picture brick."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("The head on a coin is…", "🪙", "raised", ["pressed in", "flat"], "It stands up from the coin."),
                 q("Why score and slip a raised shape onto a tile?", "🍴", "so it stays on when the clay dries", ["so it changes colour", "so it dries faster"], "Unjoined shapes fall off as the clay dries."),
                 q("Why did Sofia's tile crack?", "💔", "because it dried too fast", ["because it was too square", "because it had a leaf on it"], "Fast drying makes clay shrink unevenly and crack."),
                 q("Which tool would press fish scales?", "🐚", "a shell", ["a fork", "the end of a pencil"], "A shell presses curved ridges, like scales."),
                 q("Why press the scales in deeper?", "🐠", "so they catch light and shadow and show clearly", ["so the tile gets heavier", "so it dries faster"], "Deeper marks catch the light."),
                 q("What did Han dynasty picture bricks show?", "🐎", "everyday life, like horses and carts", ["only patterns, with no pictures", "only writing"], "They show everyday life from about two thousand years ago."),
                 q("How could the same picture be made on many bricks?", "🧱", "by pressing clay into a carved mould", ["by painting each one by hand", "with a camera"], "A carved mould makes the same picture again and again."),
                 q("Bumps on the pavement for blind people are…", "🦯", "raised", ["pressed in", "painted on"], "They stand up so feet and canes can feel them."),
             ]},
             "That is the whole lesson finished. You can make a relief, and fix one that goes wrong."),
    ],
}


LESSON["about"] = [
    "Say what a relief is: a picture that stands out from a flat surface.",
    "Sort surfaces into raised and pressed in.",
    "Choose a tool for each clay texture.",
    "Say why a tile went wrong, and fix it.",
    "Find the raised and pressed-in parts of a brick from long ago.",
]

LESSON["lecture"] = [
    part("🟫", "What is a relief?",
         "A relief is a picture that stands out from a flat surface. Some parts are raised, standing up. Some are pressed in, sinking down. The head on a coin is a relief."),
    part("🍴", "Raised parts",
         "To make a raised part, add a clay shape on top of the tile. Score and slip it, so it stays on when the clay dries. Raised parts catch the light and throw small shadows."),
    part("👇", "Pressed-in marks",
         "Press tools into the soft clay to make textures. A fork makes lines like fur. A pencil end makes dots. A shell makes curved ridges, like fish scales."),
    part("🐎", "Picture bricks",
         "About two thousand years ago, in Han dynasty China, people made clay bricks with pictures of everyday life: horses, carts, farmers and markets. Many were pressed from carved moulds."),
]

LESSON["words"] = [
    word("relief", "🟫", "A picture that stands out from a flat surface.",
         ["I made a relief tile.", "The horse is in relief."]),
    word("raised", "⬆️", "Standing up from a surface.",
         ["The bird is raised.", "Raised parts catch the light."]),
    word("slab", "🫓", "A flat, even piece of clay.",
         ["Roll a slab of clay.", "I cut a tile from the slab."]),
    word("texture", "🍴", "How a surface feels, or looks as if it feels.",
         ["The fork made a furry texture.", "The shell gave a ridged texture."]),
    word("mould", "🧱", "A hollow shape that clay is pressed into to copy a picture.",
         ["The brick was made in a mould.", "A mould makes the same picture again."]),
    word("crack", "💔", "A thin break in something.",
         ["The tile has a crack.", "Dry it slowly so it will not crack."]),
]

LESSON["home"] = [
    home("Texture tile", "Air-drying clay, a rolling pin, a blunt knife, and a fork, a shell or a leaf, and a grown-up",
         ["Roll a slab as thick as your finger and cut a square tile, with a grown-up.",
          "Press textures in with the fork, the shell and the leaf.", "Dry it slowly under a loose sheet of plastic."],
         "Which texture shows up best?"),
    home("Raised and pressed in", "Air-drying clay, a fork and a little water",
         ["Make a tile.", "Score and slip a small clay shape on top, like a sun or a fish.",
          "Press a pattern of dots into the background with a pencil end."],
         "Can you feel the difference between raised and pressed in with your eyes closed?"),
    home("Relief hunt", "A grown-up and a walk around the house",
         ["Look for reliefs: coins, buttons, carved doors, embossed cards, bricks with names.",
          "Feel them gently with your fingers."],
         "Which were raised and which were pressed in?"),
]

LESSON["journal"] = {
    "changes": ["press the marks in deeper", "score and slip every raised part", "dry it more slowly", "add a border of texture", "keep it just as it is"],
}
