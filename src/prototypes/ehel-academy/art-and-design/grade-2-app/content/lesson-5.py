# -*- coding: utf-8 -*-
"""Lesson 5 - Nature's Art.

0067 Stage 2: E.01 encounters in "natural environments, such as parks and
gardens"; R.01 "collect items, for example fallen leaves when visiting
woodland, to represent their experience"; E.03 gather and record by sorting
(by texture) and ordering (autumn leaves by tone), and by drawing from life;
M.01 drawing tools used with growing control; E.02 exploring natural
materials. The step up from Grade 1: Grade 1 drew kinds of line on request;
Grade 2 LOOKS at a real thing and draws what is there - a circle for a
pebble, a zigzag for a leaf's edge.
"""
from _kit import explain, step, opt, q, swatch, spot, part, word, home

LESSON = {
    "slug": "natures-art",
    "title": "Nature's Art",
    "blurb": "Collect treasures on a nature walk, sort them by how they feel, put autumn leaves in order from light to dark, draw what you found, and look very closely at a leaf.",
    "steps": [
        step("explore", "Treasures from a nature walk", "🍂", "Nature collector", ["2E.01", "2R.01"],
             "Artists go outside to look and collect. Tap each treasure to hear about it.",
             explain(
                 ["A park, a garden or a path is full of shapes, colours and textures.", "Artists collect small things to look at closely and remember the walk."],
                 ["A leaf has lines and a jagged edge.", "A feather is soft, with thin lines.", "A pebble is round and smooth.",
                  "Some artists make art right there, outside, from what they find."],
                 ["Children pick flowers that are still growing.", "Only collect things that have already fallen.",
                  "Never put anything you find in your mouth, and wash your hands when you get home."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🍂", "label": "a fallen leaf", "say": "A fallen leaf. Look at its lines and its jagged edge. Autumn leaves are yellow, orange, red and brown."},
                 {"pic": "🪶", "label": "a feather", "say": "A feather. Soft to touch, and made of hundreds of thin lines."},
                 {"pic": "🪨", "label": "a pebble", "say": "A pebble. Round, smooth and cool, worn smooth by water over a very long time."},
                 {"pic": "🐚", "label": "a shell", "say": "A shell. Smooth inside, with lines and a spiral on the outside."},
                 {"pic": "🌰", "label": "a conker", "say": "A conker. Shiny and brown, and so smooth it slips in your hand. It is not for eating."},
                 {"pic": "🍁", "label": "leaves laid in a circle", "say": "Leaves laid on the grass in a circle. Art made outside, from nature, is called land art."},
             ], "need": 6,
              "then": {"ask": "What should you collect on a nature walk?",
                       "opts": [opt("things that have already fallen", True), opt("flowers that are still growing", False), opt("birds' eggs from a nest", False)],
                       "why": "Collect only what has already fallen, like leaves, feathers and pebbles. Leave growing plants and nests alone."}},
             "Six treasures, and a circle of leaves on the grass."),

        step("sort", "Treasures by touch", "🗂️", "Texture sorter", ["2E.03", "2E.02"],
             "Imagine touching each treasure. Is it rough, smooth or soft? Tap the bin.",
             explain(
                 ["Sorting your treasures by how they feel is a way of recording the walk."],
                 ["Bark is rough and scratchy.", "A pebble is smooth.", "A feather is soft."],
                 ["Children sort by colour instead.", "Think about how it FEELS under your fingers."],
                 ["Imagine touching it, then tap the bin."]),
             {"ask": "Rough, smooth or soft?",
              "bins": [{"id": "ro", "label": "Rough", "pic": "🪵"}, {"id": "sm", "label": "Smooth", "pic": "🪨"}, {"id": "so", "label": "Soft", "pic": "🪶"}],
              "items": [
                  {"pic": "🪵", "label": "a piece of bark", "bin": "ro", "why": "Bark is bumpy and scratchy. Rough."},
                  {"pic": "🪨", "label": "a pebble", "bin": "sm", "why": "Water wore the pebble smooth."},
                  {"pic": "🪶", "label": "a feather", "bin": "so", "why": "A feather is soft and light."},
                  {"pic": "🌲", "label": "a pine cone", "bin": "ro", "why": "A pine cone is covered in hard, bumpy scales. Rough."},
                  {"pic": "🐚", "label": "the inside of a shell", "bin": "sm", "why": "The inside of a shell is smooth and shiny."},
                  {"pic": "🌸", "label": "a flower petal", "bin": "so", "why": "A petal is soft and silky."},
                  {"pic": "🌰", "label": "a conker", "bin": "sm", "why": "A conker is smooth and shiny."},
                  {"pic": "🐑", "label": "a tuft of sheep's wool caught on a fence", "bin": "so", "why": "Sheep's wool is soft and fluffy."},
              ]},
             "You sorted eight treasures by how they feel."),

        step("tone", "Autumn leaves, light to dark", "🍁", "Leaf ladder", ["2E.03", "2M.01"],
             "These leaves fell in autumn. Put them in order, from the lightest to the darkest.",
             explain(
                 ["In places with an autumn, leaves change colour before they fall.", "Some are pale, some are bright, some are dark."],
                 ["Find the palest leaf first.", "Then the next one.", "End with the darkest brown."],
                 ["Children put red first because it is bright.", "Bright is not the same as light. Look at how PALE it is."],
                 ["Tap the lightest one first."]),
             {"swatches": [
                 swatch("pale", "pale green", "#E4EFA0", "A pale green leaf, just starting to change."),
                 swatch("yellow", "yellow", "#F6C700", "A yellow leaf."),
                 swatch("orange", "orange", "#F28C28", "An orange leaf."),
                 swatch("red", "red", "#C1440E", "A red leaf."),
                 swatch("brown", "brown", "#5A3014", "A brown leaf, the darkest of all."),
              ]},
             "You put five autumn leaves in order, from light to dark."),

        step("source", "A leaf, looked at closely", "🔍", "Leaf looker", ["2E.01", "2E.03"],
             "Artists look very closely before they draw. Tap the parts of this leaf.",
             explain(
                 ["When you look closely, a plain leaf is full of lines and shapes."],
                 ["Tap the middle vein.", "Tap the little veins.", "Tap the jagged edge, and the stalk."],
                 ["Children see 'a leaf' and stop looking.", "Look for the lines inside it."],
                 ["Tap three things and listen."]),
             {"scene": "leaf", "need": 3, "caption": "Tap the middle vein, the little veins and the edge.",
              "spots": [
                  spot("vein", "the middle vein", "One straight line down the middle. It carries water to the whole leaf.", 160, 116, "📏"),
                  spot("little", "the little veins", "Little veins branch off the middle one, like the branches of a tree.", 109, 154, "🌿"),
                  spot("edge", "the jagged edge", "The edge goes in and out, sharp and pointy, like a zigzag.", 138, 49, "⚡"),
                  spot("stalk", "the stalk", "The stalk held the leaf on the tree. It is thick and a little curved.", 40, 192, "🌱"),
              ],
              "then": {"ask": "Which part is a straight line down the middle of the leaf?",
                       "opts": [{"t": "the middle vein", "spot": "vein"}, {"t": "the jagged edge"}, {"t": "the stalk"}],
                       "why": "The middle vein runs straight down the middle. The edge is jagged, and the stalk is curved."}},
             "You looked closely at a leaf and found its lines."),

        step("marks", "Draw the lines you found", "✏️", "Nature drawer", ["2E.03", "2M.01", "2E.02"],
             "Look at each treasure and draw the line it has. The card tells you which tool to use.",
             explain(
                 ["You have just looked closely at a leaf.", "Now draw the lines you found. At home, you can draw a real leaf from life."],
                 ["The middle of a leaf has a straight line: its vein.", "The edge of a leaf is jagged, like a zigzag.",
                  "A pebble is round. Draw all the way round and back to the start.", "A ladybird has dots."],
                 ["Children draw a leaf they imagine.", "Think of the leaf you looked at. Then draw."],
                 ["Look, then draw."]),
             {"tools": ["pencil", "crayon", "brush", "finger"],
              "rounds": [
                  {"tool": "pencil", "want": "straight", "made": "the straight vein of a leaf", "ask": "Think of the leaf's middle vein. Draw it: one straight line.", "pic": "🍃", "why": "A leaf's middle vein runs straight down the middle."},
                  {"tool": "crayon", "want": "zigzag", "made": "a leaf's jagged edge", "ask": "Think of the leaf's jagged edge. Draw it: a zigzag.", "pic": "🍂", "why": "Up and down, sharp and pointy. That is a jagged edge."},
                  {"tool": "brush", "want": "round", "made": "a round pebble", "ask": "Draw a round pebble: go all the way round, back to the start.", "pic": "🪨", "why": "All the way round and joined up. That is a pebble."},
                  {"tool": "finger", "want": "dots", "made": "the dots on a ladybird", "ask": "Make the dots on a ladybird's back with your finger.", "pic": "🐞", "why": "Dot, dot, dot. Ladybird spots."},
                  {"tool": "pencil", "want": "thin", "made": "one thin line of a feather", "ask": "Draw one thin line from a feather, with the pencil.", "pic": "🪶", "why": "A feather is made of hundreds of thin lines. The pencil makes a thin one."},
              ]},
             "You drew five things from a nature walk."),

        step("questions", "Nature spotter", "💬", "Nature spotter", ["2E.03", "2R.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the nature walk.", "You have met every one of them."],
                 ["Think about what you collected, how it felt, and what you drew."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Nature", "items": [
                 q("A pebble feels…", "🪨", "smooth", ["rough", "fluffy"], "Water wore the pebble smooth."),
                 q("Which line is the edge of a leaf?", "🍂", "a zigzag", ["a circle", "dots"], "A leaf's edge is jagged, like a zigzag."),
                 q("Art made outside, from nature, is called…", "🍁", "land art", ["printing", "weaving"], "Land art is made outside, from leaves, stones and sticks."),
                 q("Which autumn leaf is the darkest?", "🍂", "brown", ["yellow", "pale green"], "Brown is the darkest of the autumn leaves."),
             ]},
             "You know your nature treasures."),

        step("quiz", "Show what you know", "⭐", "Star nature artist", ["2E.01", "2E.02", "2E.03", "2M.01", "2R.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the treasures, the sorting, the autumn leaves, the drawing and the leaf you looked at."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What should you collect on a nature walk?", "🍂", "things that have already fallen", ["flowers that are still growing", "birds' eggs"], "Only collect what has already fallen."),
                 q("Why do artists collect leaves and pebbles?", "🔍", "to look at them closely and get ideas", ["to throw them away", "to keep the garden tidy"], "Looking closely at real things gives artists ideas and shows them what to draw."),
                 q("Bark feels…", "🪵", "rough", ["smooth", "soft"], "Bark is bumpy and scratchy."),
                 q("Why is bright red not the lightest leaf?", "🍁", "because bright is not the same as light", ["because red is a cool colour", "because red leaves are small"], "A bright colour can still be dark. Pale is what makes a colour light."),
                 q("How do you draw a round pebble?", "🪨", "go all the way round, back to the start", ["draw a zigzag", "make lots of dots"], "A circle goes all the way round and joins up."),
                 q("What does a leaf's middle vein do?", "🍃", "carries water to the whole leaf", ["makes the leaf shiny", "holds the leaf on the tree"], "The vein carries water. The stalk holds the leaf on the tree."),
                 q("Drawing a real thing while you look at it is called…", "✏️", "drawing from life", ["printing", "drawing from memory"], "Look, then draw what is really there."),
                 q("Leaves laid in a circle on the grass are…", "🍁", "land art", ["a sculpture of clay", "a print"], "Art made outside, from nature, is land art."),
             ]},
             "That is the whole lesson finished. You can collect, sort and draw from nature."),
    ],
}


LESSON["about"] = [
    "Collect things that have fallen, on a walk outside.",
    "Sort nature's treasures by how they feel.",
    "Put autumn leaves in order from light to dark.",
    "Draw a real thing by looking at it.",
    "Find the lines inside a leaf.",
]

LESSON["lecture"] = [
    part("🍂", "Go outside",
         "A park, a garden or a path is full of art ideas. Leaves, feathers, pebbles and shells all have shapes, colours and textures. Collect only what has already fallen, never put anything in your mouth, and wash your hands afterwards."),
    part("🪨", "Touch and sort",
         "Touch your treasures. Bark is rough. A pebble is smooth. A feather is soft. Sorting them by how they feel is one way of remembering the walk."),
    part("✏️", "Draw from life",
         "Drawing from life means looking at a real thing while you draw it. Look first. A leaf has a straight vein and a jagged edge. A pebble is round. At home, put a real leaf in front of you and draw what is really there."),
    part("🍁", "Land art",
         "Some artists make art outside, from what they find. They lay leaves in a circle, or stones in a line. It is called land art. The wind and rain may take it away, so they take a photo."),
]

LESSON["words"] = [
    word("collect", "🧺", "To gather things together.",
         ["I collected leaves.", "We collect only fallen things."]),
    word("pebble", "🪨", "A small stone, worn smooth by water.",
         ["The pebble is round and smooth.", "I drew a pebble."]),
    word("vein", "🍃", "A thin line in a leaf that carries water.",
         ["The leaf has a straight vein.", "I can see little veins."]),
    word("jagged", "⚡", "With sharp points, going in and out.",
         ["The leaf has a jagged edge.", "A saw is jagged."]),
    word("autumn", "🍂", "The time of year when leaves change colour and fall.",
         ["In autumn the leaves turn brown.", "We collected autumn leaves."]),
    word("land art", "🍁", "Art made outside, from things found in nature.",
         ["We made land art from pebbles.", "Land art can blow away."]),
]

LESSON["home"] = [
    home("Nature walk collection", "A bag, a grown-up, and a walk in a park or garden",
         ["Collect ten things that have already fallen: leaves, feathers, pebbles, sticks.",
          "At home, wash your hands, then lay your treasures out on paper.", "Sort them: rough, smooth and soft.", "Never put anything you find in your mouth."],
         "Which treasure is the roughest? Which is the smoothest?"),
    home("Draw from life", "One treasure from your walk, a pencil and paper",
         ["Put the treasure in front of you.", "Look at it for a whole minute before you draw.",
          "Draw the lines you can see, big, filling the paper."],
         "What did you notice when you looked for a whole minute?"),
    home("Land art", "Leaves, sticks or pebbles, a grown-up, and a space outside",
         ["Lay your treasures in a pattern on the ground: a circle, a spiral or a line.",
          "Stand back and look.", "Ask your grown-up to take a photo before it blows away."],
         "What shape did you make?"),
]

LESSON["journal"] = {
    "changes": ["look for longer before drawing", "press harder with the crayon", "draw it bigger", "add the little veins", "keep it just as it is"],
}
