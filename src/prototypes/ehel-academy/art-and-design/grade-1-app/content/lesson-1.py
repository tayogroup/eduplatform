# -*- coding: utf-8 -*-
"""Lesson 1 - Marks and Lines.

0067 Stage 1: E.02 explore media, materials, tools (a pencil, a brush, a
sponge, chalk, a finger - each leaves a different mark); E.03 gather and
record (mark making, and sorting by a formal element, line); M.01 use the
tools with growing confidence; E.01 encounter line in art from long ago (a
cave painting). Line is the first formal element because it is the one a
five-year-old already makes every day.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "marks-and-lines",
    "title": "Marks and Lines",
    "blurb": "Meet the tools that make marks, find out about kinds of line, draw them for real on the paper, sort lines, and find the lines in a painting from long ago.",
    "steps": [
        step("demo", "Every tool makes its own mark", "✏️", "Tool spotter", ["1E.02"],
             "Press <b>Next</b> and watch what each tool does.",
             explain(
                 ["A tool is a thing you make art with.", "Every tool leaves a different kind of mark."],
                 ["A pencil makes a thin grey line.", "A brush makes a wide wet line.", "A sponge makes a soft dab.",
                  "Chalk makes a dusty line.", "And your finger makes a mark too."],
                 ["Children think only a pencil can draw.", "Anything that leaves a mark is a tool."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "✏️", "cap": "A <b>pencil</b> makes a thin, grey line.", "say": "A pencil makes a thin, grey line."},
                 {"pic": "🖌️", "cap": "A <b>brush</b> makes a wide, wet line.", "say": "A brush makes a wide, wet line.", "sound": "swish"},
                 {"pic": "🧽", "cap": "A <b>sponge</b> makes a soft, blobby dab.", "say": "A sponge makes a soft, blobby dab.", "sound": "dab"},
                 {"pic": "🧱", "cap": "<b>Chalk</b> makes a dusty, pale line.", "say": "Chalk makes a dusty, pale line.", "sound": "rustle"},
                 {"pic": "👆", "cap": "Your <b>finger</b> in the paint makes a mark too!", "say": "Your finger in the paint makes a mark too!", "sound": "squelch"},
                 {"pic": "🎨", "cap": "Different tools, different marks. That is why artists have lots of them.", "say": "Different tools, different marks. That is why artists have lots of them.", "sound": "tada"},
             ]},
             "Five tools, five kinds of mark. You will try every one."),

        step("explore", "Kinds of line", "〰️", "Line kinds", ["1E.01"],
             "A line can be straight, wavy, zigzag, dotted, thick or thin. Tap each one to hear about it.",
             explain(
                 ["A line is a mark that goes from one place to another.", "Lines come in kinds."],
                 ["A straight line does not bend.", "A wavy line goes up and down gently, like the sea.",
                  "A zigzag turns sharply, like lightning.", "A dotted line is lots of little dots in a row.",
                  "A thick line is wide. A thin line is narrow."],
                 ["Children mix up wavy and zigzag.", "Wavy is gentle and round. Zigzag is sharp and pointy."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "📏", "label": "straight", "say": "A straight line does not bend. A ruler makes one."},
                 {"pic": "🌊", "label": "wavy", "say": "A wavy line goes up and down gently, like the sea."},
                 {"pic": "⚡", "label": "zigzag", "say": "A zigzag line turns sharply, up and down, like lightning."},
                 {"pic": "🐾", "label": "dotted", "say": "A dotted line is lots of little dots in a row, like footprints."},
                 {"pic": "🪵", "label": "thick", "say": "A thick line is wide, like a tree trunk."},
                 {"pic": "🧵", "label": "thin", "say": "A thin line is narrow, like a thread."},
             ], "need": 6,
              "then": {"ask": "Which line goes up and down gently, like the sea?",
                       "opts": [opt("wavy", True), opt("straight", False), opt("zigzag", False)],
                       "why": "A wavy line goes up and down gently, like the sea. A zigzag is sharp."}},
             "Straight, wavy, zigzag, dotted, thick and thin. Six kinds of line."),

        step("marks", "Make the marks", "🖌️", "Mark maker", ["1E.03", "1M.01", "1E.02"],
             "Draw on the paper with your finger or the mouse. Make the mark the card asks for.",
             explain(
                 ["Now you make the marks yourself.", "The page looks at your line and says what kind it is."],
                 ["Pick up the tool the card asks for.", "Draw on the paper.", "If the line is the right kind, you go on to the next one.",
                  "If not, the page tells you what to try."],
                 ["Children draw very small.", "Use the whole paper. A big line is easier to see."],
                 ["Draw a straight line with the pencil."]),
             {"tools": ["pencil", "brush", "crayon", "finger", "chalk"],
              "rounds": [
                  {"tool": "pencil", "want": "straight", "made": "a straight line", "ask": "Draw a straight line.", "pic": "📏", "why": "It does not bend. That is what straight means."},
                  {"tool": "brush", "want": "wavy", "made": "a wavy line", "ask": "Draw a wavy line, like the sea.", "pic": "🌊", "why": "Up and down, gently. That is a wavy line."},
                  {"tool": "crayon", "want": "zigzag", "made": "a zigzag", "ask": "Draw a zigzag, like lightning.", "pic": "⚡", "why": "Sharp turns, up and down. That is a zigzag."},
                  {"tool": "finger", "want": "dots", "made": "lots of dots", "ask": "Make lots of dots with your finger.", "pic": "🐾", "why": "Tap, tap, tap. Dots are the smallest marks of all."},
                  {"tool": "chalk", "want": "long", "made": "a long line", "ask": "Draw a long, long line, right across the paper.", "pic": "🧱", "why": "All the way across. That is a long line."},
              ]},
             "You made five kinds of mark with five tools, and a drawing of your own."),

        step("sort", "What kind of line?", "🗂️", "Line sorter", ["1E.03", "1E.01"],
             "Look at each thing. Is its line straight, wavy or zigzag?",
             explain(
                 ["Artists sort things by their lines.", "Sorting is one way of gathering what you notice."],
                 ["A road goes straight.", "A snake goes wavy.", "A mountain top goes zigzag."],
                 ["Children look at the colour instead of the line.", "Look at the SHAPE of the line."],
                 ["Look at the line, then tap the bin."]),
             {"ask": "Straight, wavy or zigzag?",
              "bins": [{"id": "st", "label": "Straight", "pic": "📏"}, {"id": "wa", "label": "Wavy", "pic": "🌊"}, {"id": "zz", "label": "Zigzag", "pic": "⚡"}],
              "items": [
                  {"pic": "🛣️", "label": "a road", "bin": "st", "why": "A road goes straight ahead."},
                  {"pic": "🐍", "label": "a snake", "bin": "wa", "why": "A snake wiggles gently. That is wavy."},
                  {"pic": "🏔️", "label": "mountain tops", "bin": "zz", "why": "Mountain tops go sharply up and down. Zigzag."},
                  {"pic": "🪜", "label": "a ladder", "bin": "st", "why": "A ladder's sides are straight."},
                  {"pic": "🌊", "label": "a wave", "bin": "wa", "why": "A wave goes up and down gently. Wavy."},
                  {"pic": "⚡", "label": "lightning", "bin": "zz", "why": "Lightning turns sharply. Zigzag."},
                  {"pic": "🧵", "label": "a thread on the floor", "bin": "wa", "why": "A thread lies in gentle curves. Wavy."},
              ]},
             "You sorted lines by their kind. That is looking like an artist."),

        step("source", "Lines on a cave wall", "🪨", "Cave looker", ["1E.01"],
             "This is a painting from long, long ago, on the wall of a cave. Tap the things in it.",
             explain(
                 ["People made art thousands of years ago.", "They painted on cave walls with earth and charcoal."],
                 ["Tap the animal. It is made of lines.", "Tap the hands. They pressed a hand on the wall and blew colour around it.",
                  "Tap the dots. Dots are marks too."],
                 ["Children think old art is not real art.", "It is some of the oldest art there is, and it is full of lines."],
                 ["Tap three things and listen."]),
             {"scene": "cave", "need": 3, "caption": "Tap the animal, the hands and the dots.",
              "spots": [
                  spot("animal", "the animal", "The artist drew the animal with thick, dark lines. Look at its legs and its back.", 160, 160, "🦌"),
                  spot("hands", "the handprints", "Someone put their hand on the wall and blew colour around it. That was their mark.", 50, 90, "✋"),
                  spot("dots", "the dots", "A row of dots, made one tap at a time, just like you did.", 100, 200, "🐾"),
              ],
              "then": {"ask": "What did the cave artist use to make the animal?",
                       "opts": [{"t": "thick, dark lines", "spot": "animal"}, {"t": "a camera"}, {"t": "a computer"}],
                       "why": "Look at the animal: it is made of thick, dark lines, drawn by hand, thousands of years ago."}},
             "You looked closely at art from long ago and found its lines."),

        step("questions", "Line spotter", "💬", "Line spotter", ["1E.01", "1E.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about lines and tools.", "You have met every one of them."],
                 ["Think about the tools, the six kinds of line, and the cave wall."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Lines", "items": [
                 q("Which tool makes a wide, wet line?", "🖌️", "a brush", ["a pencil", "chalk"], "A brush is wide and wet. A pencil is thin and dry."),
                 q("A line that turns sharply, like lightning, is…", "⚡", "zigzag", ["wavy", "straight"], "Sharp turns make a zigzag."),
                 q("A line that does not bend is…", "📏", "straight", ["dotted", "wavy"], "Straight means it does not bend at all."),
                 q("Lots of little dots in a row make a…", "🐾", "dotted line", ["thick line", "zigzag"], "Dots in a row make a dotted line."),
             ]},
             "You know your lines and your tools."),

        step("quiz", "Show what you know", "⭐", "Star mark maker", ["1E.01", "1E.02", "1E.03", "1M.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the five tools, the six lines, the sorting and the cave wall."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a tool?", "🧰", "a thing you make art with", ["a kind of line", "a colour"], "A tool is anything you make marks with: a pencil, a brush, even your finger."),
                 q("Which line goes up and down gently, like the sea?", "🌊", "wavy", ["straight", "zigzag", "dotted"], "Gentle up and down is wavy. Sharp up and down is zigzag."),
                 q("Which tool makes a soft, blobby dab?", "🧽", "a sponge", ["a pencil", "chalk"], "A sponge dabs. A pencil draws thin lines."),
                 q("A tree trunk line is…", "🪵", "thick", ["thin", "dotted"], "A trunk is wide, so its line is thick."),
                 q("Where did people paint thousands of years ago?", "🪨", "on cave walls", ["on computers", "on cars"], "Cave walls. They used earth colours and charcoal."),
                 q("Why does a brush make a thicker line than a pencil?", "🖌️", "because its tip is wider", ["because it is red", "because it is longer"], "A wide tip leaves a wide mark. A pencil has a thin tip."),
                 q("Which line is made of sharp turns?", "🏔️", "zigzag", ["wavy", "straight"], "Sharp turns, like mountain tops, make a zigzag."),
                 q("Why draw a calm sea with wavy lines, not zigzags?", "🌊", "because calm waves go gently up and down", ["because zigzags are too long", "because wavy lines are always blue"], "Wavy lines are gentle, like a calm sea. Zigzags are sharp, like lightning."),
             ]},
             "That is the whole lesson finished. You can make marks, and you know your lines."),
    ],
}


LESSON["about"] = [
    "Name five tools that make marks: a pencil, a brush, a sponge, chalk and your finger.",
    "Say what kind of line a line is: straight, wavy, zigzag, dotted, thick or thin.",
    "Make each kind of mark yourself, on paper.",
    "Sort things by the kind of line they have.",
    "Find the lines in a painting from long ago.",
]

LESSON["lecture"] = [
    part("✏️", "Marks",
         "Art starts with a mark. A mark is anything you leave on the paper: a dot, a dab, a line. A pencil makes one kind of mark. A brush makes another. A sponge makes another. Your finger makes one too."),
    part("〰️", "Kinds of line",
         "A line is a mark that goes from one place to another. It can be straight, like a ruler. Wavy, like the sea. Zigzag, like lightning. Dotted, like footprints. Thick, like a trunk, or thin, like a thread."),
    part("🖌️", "Try every tool",
         "Artists try every tool to see what it does. A brush cannot make a thin line as well as a pencil. A pencil cannot make a big soft dab like a sponge. Knowing what each tool does is how you choose."),
    part("🪨", "Lines from long ago",
         "Thousands of years ago, people drew animals on cave walls with thick dark lines, and pressed their hands on the wall to leave a mark. Their marks are still there. Yours can be too."),
]

LESSON["words"] = [
    word("mark", "✏️", "Anything you leave on the paper: a dot, a dab or a line.",
         ["I made a mark with my finger.", "Every tool leaves a different mark."]),
    word("line", "📏", "A mark that goes from one place to another.",
         ["I drew a long line.", "A wavy line goes up and down."]),
    word("tool", "🧰", "A thing you make art with, like a brush or a pencil.",
         ["A brush is a tool.", "Pick the right tool for the mark."]),
    word("zigzag", "⚡", "A line that turns sharply, up and down, like lightning.",
         ["I drew a zigzag.", "Mountain tops make a zigzag."]),
    word("thick", "🪵", "Wide. A thick line is a wide line.",
         ["The brush made a thick line.", "A tree trunk is thick."]),
    word("thin", "🧵", "Narrow. A thin line is a narrow line.",
         ["The pencil made a thin line.", "A thread is thin."]),
]

LESSON["home"] = [
    home("Five tools, one paper", "A big piece of paper, a pencil, a brush and some paint, a sponge, a piece of chalk, and your own finger",
         ["Draw a straight line with the pencil.", "Draw a wavy line with the brush.", "Dab with the sponge, draw with the chalk, and make dots with your finger.",
          "Look at all five marks together."],
         "Which tool made the thickest mark? Which made the thinnest?"),
    home("Line hunt", "A grown-up and a walk around the house or outside",
         ["Find something with a straight line, like a door.", "Find something wavy, like a curtain or a puddle edge.",
          "Find something zigzag, like a roof or a fence."],
         "Which kind of line did you find most?"),
    home("Rubbing lines", "Thin paper, a crayon with the paper peeled off, and a coin, a leaf or a bumpy wall",
         ["Put the paper over the coin or the leaf.", "Rub the side of the crayon over it, gently.",
          "Watch the lines appear."],
         "What kind of lines came through?"),
]

LESSON["journal"] = {
    "changes": ["make the wavy line even bigger", "use a different colour", "add more dots", "try the sponge next time", "keep it just as it is"],
}
