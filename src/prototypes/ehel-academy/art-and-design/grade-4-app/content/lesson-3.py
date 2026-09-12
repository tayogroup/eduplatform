# -*- coding: utf-8 -*-
"""Lesson 3 - Print It Twice.

0067 Stage 4: TWA.01 the progression text's own second example - "an
individual print that will then form part of a collaborative textile work" -
and "explaining the stages that they followed when making a printing block and
the resulting print"; M.02 register marks and a trial print are decisions
"informed by experience"; E.03 the visual journal a design is worked out in;
M.01 choose the ink and the surface, and say why; R.01 celebrate a class piece
nobody made alone. The step up from Grade 2 and Grade 3: Grade 2 printed one
stamp again and again, Grade 3 took a sketch to a printing block; Grade 4
prints TWO colours that have to line up, and the tile joins a class cloth.
"""
from _kit import explain, step, opt, q, spot, material, change, part, word, home

LESSON = {
    "slug": "print-it-twice",
    "title": "Print It Twice",
    "blurb": "Watch a two-colour print being made, read a block-printed cloth, build a repeat, choose what to print with and on, put the printing in order, and fix three prints that went wrong.",
    "steps": [
        step("demo", "Two blocks, two colours", "🖨️", "Print watcher", ["4TWA.01", "4M.02"],
             "Press <b>Next</b> and watch one picture printed in two colours.",
             explain(
                 ["One block prints one colour. For two colours you need two blocks, and they must line up."],
                 ["Cut the first block and print it in the lighter colour.", "Let it dry.",
                  "Cut the second block for the darker parts.", "Line it up using register marks.",
                  "Print the second colour on top."],
                 ["Children print the second colour while the first is wet, and the two colours run together.",
                  "Dry first, then print again."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "✏️", "cap": "Draw the design, then split it: what is <b>light</b>, what is <b>dark</b>.", "say": "Draw the design, then split it. What is light, and what is dark."},
                 {"pic": "🔪", "cap": "Cut the <b>first block</b>: only the light parts.", "say": "Cut the first block, with only the light parts on it."},
                 {"pic": "🎨", "cap": "Roll ink on it and press. That is the first colour down.", "say": "Roll ink on it and press. That is the first colour down.", "sound": "dab"},
                 {"pic": "⏳", "cap": "<b>Wait</b> for it to dry. Printing on wet ink makes mud.", "say": "Wait for it to dry. Printing on wet ink makes mud."},
                 {"pic": "🎯", "cap": "<b>Register marks</b>: two pencil crosses that tell the second block where to sit.", "say": "Register marks: two pencil crosses that tell the second block exactly where to sit."},
                 {"pic": "🟦", "cap": "Print the <b>second</b> colour on top, lined up on the marks.", "say": "Print the second colour on top, lined up on the marks.", "sound": "dab"},
             ]},
             "Cut, print, dry, line up, print again. That is a two-colour print."),

        step("source", "A cloth printed with a block", "🧵", "Cloth reader", ["4E.01", "4E.03"],
             "This cloth is drawn in the manner of hand block printing from Rajasthan, in India. Tap the parts to find out how it was printed.",
             explain(
                 ["In Rajasthan, printers press blocks of carved wood onto cloth by hand, one block at a time.",
                  "A two-colour cloth goes under the block twice."],
                 ["Tap one flower: that is one press of the block.",
                  "Tap the row that has shifted: the rows do not sit square, they step across.",
                  "Tap where the red peeps out from under the dark blue."],
                 ["Children think a patterned cloth is printed all at once, like a photo.",
                  "It is one block, pressed hundreds of times, by hand."],
                 ["Tap three things and listen."]),
             {"scene": "blockprint", "need": 3, "caption": "Tap a flower, a shifted row, the second colour and the border.",
              "spots": [
                  spot("flower", "one flower", "One flower is one press of the carved block. The printer inks it, presses, lifts, and moves along.", 72, 34, "🌸"),
                  spot("offset", "the shifted row", "This row does not sit under the one above. It steps across by half. A shifted repeat hides the joins.", 135, 76, "↔️"),
                  spot("second", "the second colour", "The red was printed first. The dark blue block went on top, and the red still shows at the edge.", 219, 160, "🟥"),
                  spot("border", "the border", "A border block runs all the way round, printed after the middle is finished.", 160, 224, "🖼️"),
              ],
              "then": {"ask": "How was the red made to show under the blue?",
                       "opts": [{"t": "the red was printed first, and the blue block went on top", "spot": "second"}, {"t": "the printer drew it on afterwards"}, {"t": "the cloth was already red"}],
                       "why": "Two blocks, one colour at a time: red first, then blue over it."}},
             "You found the flower, the shifted row, the second colour and the border."),

        step("pattern", "Build the repeat", "🔁", "Repeat builder", ["4E.03", "4TWA.01"],
             "A printing block repeats. Tap the tile that comes next, then build a row of your own.",
             explain(
                 ["A repeat is the bit that happens again and again. Find it and you can print for ever."],
                 ["Look along the row and say it out loud: flower, leaf, flower, leaf.",
                  "The repeat is the shortest bit that keeps coming back."],
                 ["Children add whatever they like next and the repeat breaks.",
                  "A repeat only counts if it really repeats."],
                 ["Tap the tile that comes next."]),
             {"tiles": [
                 {"id": "flower", "label": "flower", "pic": "🌸"},
                 {"id": "leaf", "label": "leaf", "pic": "🍃"},
                 {"id": "dot", "label": "dot", "pic": "🔵"},
                 {"id": "diamond", "label": "diamond", "pic": "🔶"},
              ],
              "rounds": [
                  {"seq": ["flower", "leaf", "flower", "leaf", "flower", "leaf", "flower", "leaf"], "show": 4, "ask_n": 2, "ask": "Flower, leaf, flower, leaf. What comes next?"},
                  {"seq": ["flower", "dot", "dot", "flower", "dot", "dot", "flower", "dot", "dot"], "show": 6, "ask_n": 3, "ask": "Flower, dot, dot. What comes next?"},
                  {"seq": ["flower", "leaf", "dot", "diamond", "flower", "leaf", "dot", "diamond", "flower", "leaf", "dot", "diamond"], "show": 8, "ask_n": 4, "ask": "Flower, leaf, dot, diamond. What comes next?"},
              ],
              "ownMin": 6},
             "You found the repeat, and built one of your own."),

        step("choose", "What to print with, and on", "🧰", "Print chooser", ["4M.01", "4M.02"],
             "Each job needs the right ink or the right surface. Tap the one that fits.",
             explain(
                 ["Ink for paper and ink for cloth are not the same, and neither are the surfaces."],
                 ["Fabric ink stays in the cloth when it is washed.",
                  "Water-based ink washes out of a block easily, and out of cloth too.",
                  "A soft foam block takes a drawn line pressed in with a pencil.",
                  "Smooth paper takes a crisp print; rough paper breaks it up."],
                 ["Children print the class cloth with paint that washes out in the first wash."],
                 ["Read the job, then tap."]),
             {"materials": [
                 material("fabric", "Fabric ink", "🧵", ["stays in cloth"], "Fabric ink is made to stay in cloth, even when it is washed."),
                 material("water", "Water-based ink", "💧", ["washes off"], "Water-based ink washes out of your block, and out of cloth."),
                 material("foam", "A foam block", "🟦", ["takes a drawn line"], "Press a pencil into foam and the line stays, ready to print."),
                 material("smooth", "Smooth paper", "📄", ["crisp print"], "Smooth paper takes a crisp, clean print."),
                ],
              "rounds": [
                  {"purpose": "printing a tile for the class cloth, which will be washed", "needs": "stays in cloth", "pic": "🧺", "why": "Only fabric ink survives a wash."},
                  {"purpose": "an ink you can clean off your block at the end of the lesson", "needs": "washes off", "pic": "🚿", "why": "Water-based ink cleans off with water."},
                  {"purpose": "a block you can draw your design into with a pencil", "needs": "takes a drawn line", "pic": "✏️", "why": "Foam takes a pressed line without any cutting."},
                  {"purpose": "a test print where every edge must show clearly", "needs": "crisp print", "pic": "🔍", "why": "Smooth paper shows exactly what the block is doing."},
              ]},
             "You chose the ink and the surface for four jobs."),

        step("order", "From block to class cloth", "📋", "Print planner", ["4TWA.01", "4M.02", "4R.01"],
             "Your tile is going to join everyone else's. Tap the steps in order.",
             explain(
                 ["A collaborative work is one piece that no one person made.",
                  "Everybody prints one tile, and the tiles are sewn into a cloth."],
                 ["Design it in your journal.", "Cut the block.", "Take a test print and look at it.",
                  "Change the block if the test says so.", "Print your tile on the fabric.",
                  "Then the tiles are joined."],
                 ["Children print the real tile first and find the mistake afterwards.",
                  "The test print is where mistakes are cheap."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "📓", "label": "design it in your journal", "say": "First, design your tile in your journal, beside the patterns you collected."},
                 {"pic": "🔪", "label": "cut or press the block", "say": "Cut the block, or press the design into foam."},
                 {"pic": "🧪", "label": "take a test print", "say": "Take a test print on paper, and look hard at it."},
                 {"pic": "🔧", "label": "change the block", "say": "Change the block: cut away anything that printed when it should not have."},
                 {"pic": "🧵", "label": "print your tile on the fabric", "say": "Now print your tile on the fabric, with fabric ink."},
                 {"pic": "🤝", "label": "join the tiles into one cloth", "say": "All the tiles are sewn together into one cloth that belongs to the whole class."},
             ]},
             "Design, cut, test, change, print, join. Your tile is part of something bigger."),

        step("refine", "The print went wrong", "🔧", "Print mender", ["4M.02", "4TWA.03", "4R.01"],
             "Three prints did not come out right. Work out why, then tap the change that fixes it.",
             explain(
                 ["A bad print nearly always tells you what went wrong."],
                 ["Solid and smudgy: too much ink.",
                  "The second colour sits off to one side: no register marks.",
                  "Patchy and faint: not enough pressure, or a rough surface."],
                 ["Children print harder and harder with more and more ink.",
                  "Read the print, then change the one thing it is complaining about."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Ama's smudged flower", "pic": "🌫️", "fixedPic": "🌸", "problem": "The flower is a solid blob and the cut lines have filled in.", "fixed": "Every cut line shows again."},
                  "needs": "less ink",
                  "changes": [
                      change("thin", "Roll the ink out thinner before you ink the block", "🎨", "less ink", "A thin, even layer of ink. The cut lines stay open."),
                      change("more", "Put more ink on", "🪣", "worse", "More ink fills the lines in completely."),
                      change("press", "Press much harder", "👇", "worse", "Hard pressing squeezes the ink into the lines."),
                      change("paper", "Use rougher paper", "📄", "add", "Rough paper and thick ink: a worse blob."),
                  ],
                  "why": "Filled-in lines mean too much ink, not too little pressure."},
                 {"piece": {"title": "Hugo's two colours", "pic": "🟥", "fixedPic": "🟦", "problem": "The blue block printed half a centimetre to the left of the red.", "fixed": "The two colours sit exactly on top of each other."},
                  "needs": "register",
                  "changes": [
                      change("marks", "Mark two register crosses and line the block up on them", "🎯", "register", "The crosses tell the block where to sit. Both colours land in the same place."),
                      change("eye", "Line it up by eye, more carefully", "👁️", "worse", "Careful eyes still miss by a few millimetres, every time."),
                      change("bigger", "Make the second block bigger", "🔍", "size", "A bigger block, still in the wrong place."),
                      change("skip", "Print only one colour", "1️⃣", "worse", "That is not a two-colour print any more."),
                  ],
                  "why": "Lining up two blocks is what register marks are for."},
                 {"piece": {"title": "Sofia's faint tile", "pic": "🫥", "fixedPic": "🧵", "problem": "Half the flower printed and half of it did not.", "fixed": "The whole flower printed evenly."},
                  "needs": "even pressure",
                  "changes": [
                      change("pad", "Print on a soft pad, and press evenly all over", "🧽", "even pressure", "A soft pad under the cloth lets every part of the block make contact."),
                      change("corner", "Press hard on one corner", "👇", "worse", "One corner prints, the rest still does not."),
                      change("ink", "Add much more ink", "🪣", "worse", "Now the parts that did print are blobs."),
                      change("wait", "Wait longer before lifting", "⏳", "add", "Waiting does not press the block down."),
                  ],
                  "why": "Patchy printing is uneven contact. A soft pad and even pressure fix it."},
             ]},
             "You read three prints and fixed what each one was telling you."),

        step("questions", "Print spotter", "💬", "Print spotter", ["4TWA.01", "4M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about printing twice.", "You have met every one of them."],
                 ["Think about blocks, drying, register marks and the class cloth."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Printing", "items": [
                 q("What are register marks for?", "🎯", "lining up the second block with the first", ["counting your prints", "signing your work"], "They tell the second block where to sit."),
                 q("Why wait before printing the second colour?", "⏳", "because wet ink under a new block makes mud", ["because the block is tired", "because it is the rule"], "Dry first, then print again."),
                 q("A collaborative cloth is…", "🤝", "one piece made from everybody's tiles", ["a cloth made by the teacher", "a cloth you buy"], "Everyone prints one tile, and they are joined."),
                 q("Filled-in cut lines mean…", "🌫️", "too much ink", ["not enough ink", "the wrong paper"], "Thin the ink out."),
             ]},
             "You know how a two-colour print is made."),

        step("quiz", "Show what you know", "⭐", "Star printer", ["4E.01", "4E.03", "4M.01", "4M.02", "4R.01", "4TWA.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the two blocks, the cloth from Rajasthan, the repeat and the class cloth."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How many blocks does a two-colour print need?", "2️⃣", "two, one for each colour", ["one", "four"], "One block prints one colour."),
                 q("Why take a test print before printing your tile?", "🧪", "because a mistake is easy to fix on the test and hard to fix on the cloth", ["because tests are quicker", "because the ink is free"], "The test print is where mistakes are cheap."),
                 q("Hand block printers in Rajasthan press their design…", "🧵", "one block at a time, by hand", ["with a photocopier", "all in one go"], "One carved block, pressed again and again."),
                 q("What is a repeat?", "🔁", "the shortest bit of a pattern that happens again and again", ["the biggest shape", "the border"], "Find the repeat and you can print for ever."),
                 q("Why does a class cloth need fabric ink?", "🧺", "because the cloth will be washed and fabric ink stays in", ["because it is cheaper", "because it dries slower"], "Fabric ink survives a wash."),
                 q("Your blue printed to the left of your red. What fixes it?", "🎯", "register marks", ["more ink", "a bigger block"], "Register marks line the blocks up."),
                 q("A shifted row in a pattern…", "↔️", "steps across so the joins do not line up", ["is a mistake", "means the printer got tired"], "A shifted repeat hides the joins."),
                 q("Your tile joins everyone else's. That makes it…", "🤝", "a collaborative work", ["a copy", "a test print"], "A collaborative work is made by many people together."),
             ]},
             "That is the whole lesson finished. You can print in two colours, and your tile belongs to a cloth."),
    ],
}


LESSON["about"] = [
    "Say how a two-colour print is made.",
    "Read a cloth printed with a carved block.",
    "Find the repeat, and build one.",
    "Choose the right ink and surface for the job.",
    "Fix a print that smudged, slipped or came out faint.",
]

LESSON["lecture"] = [
    part("🖨️", "One block, one colour",
         "A printing block prints one colour. For two colours you cut two blocks: one for the light parts, one for the dark. The first colour is printed, left to dry, and then the second goes on top."),
    part("🎯", "Register marks",
         "Two pencil crosses on the paper, and two on the block, tell the second block exactly where to sit. Without them the colours land apart, however carefully you line them up by eye."),
    part("🧵", "Printed by hand in Rajasthan",
         "In north-west India, printers press blocks of carved wood onto cloth by hand, one press at a time, one colour at a time. A whole cloth is hundreds of presses, and the rows step across so the joins do not show."),
    part("🤝", "One cloth, everybody's tiles",
         "Your tile is yours. Sewn beside everyone else's, it becomes one cloth that nobody made alone. That is a collaborative work, and it only works if every tile is printed to last."),
]

LESSON["words"] = [
    word("block", "🟦", "The carved or pressed shape you print with.",
         ["I cut my block from foam.", "One block prints one colour."]),
    word("register", "🎯", "Lining the second block up with the first.",
         ["The register was out by a centimetre.", "Register marks fixed it."]),
    word("repeat", "🔁", "The bit of a pattern that happens again and again.",
         ["The repeat is flower, leaf.", "I printed the repeat eight times."]),
    word("collaborative", "🤝", "Made by several people working together.",
         ["The class cloth is collaborative.", "We made a collaborative print."]),
    word("test print", "🧪", "A first print, taken to see what the block does.",
         ["My test print showed a blob.", "Always take a test print."]),
    word("fabric ink", "🧵", "Ink made to stay in cloth when it is washed.",
         ["We printed with fabric ink.", "Fabric ink does not wash out."]),
]

LESSON["home"] = [
    home("A foam block", "A clean polystyrene food tray, a blunt pencil, paint, a roller or brush, and paper",
         ["Cut a flat piece from the tray.", "Press your design into it with a blunt pencil, lines pushed well in.",
          "Roll paint over it and press it onto paper."],
         "Which lines printed, and which disappeared?"),
    home("Print it twice", "Your block, a second block, paint in two colours, paper and a pencil",
         ["Print the lighter colour first and let it dry.",
          "Mark two small crosses on the paper, and two on the block.",
          "Print the second colour, lining the crosses up."],
         "How close did the two colours land?"),
    home("A repeat of your own", "Your block, paint and a long strip of paper",
         ["Print your block in a straight row.", "Print a second row, shifted across by half a block.",
          "Keep going until the strip is full."],
         "Can you see where one press ends and the next begins?"),
]

LESSON["journal"] = {
    "changes": ["roll the ink thinner", "add register marks", "press more evenly", "shift the rows across", "keep it just as it is"],
}
