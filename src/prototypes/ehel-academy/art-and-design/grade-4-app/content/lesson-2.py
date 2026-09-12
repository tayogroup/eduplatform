# -*- coding: utf-8 -*-
"""Lesson 2 - Mixing to Match.

0067 Stage 4: E.02 explore media further - what white, black and a little of
the opposite colour each do to a mix (computed by _rules.py, never typed);
M.01 judge which paint suits a task and say why; M.02 decisions "informed by
experience and through teaching", trialled in a visual journal; R.01 the
progression text's own celebrated change, "changing a colour scheme", here at
the scale of one colour; TWA.02 keep going at a mix until it matches. The step
up from Grade 3: Grade 3 read the colour wheel and chose a scheme; Grade 4
mixes a colour until it MATCHES something real, and knows what to add when it
is nearly right.
"""
from _kit import explain, step, opt, q, pot, swatch, material, change, part, word, home

LESSON = {
    "slug": "mixing-to-match",
    "title": "Mixing to Match",
    "blurb": "Mix colours to match real things, put five tints in order from light to dark, work out what was added to each colour, choose the right paint for four jobs, and fix three colours that are nearly right.",
    "steps": [
        step("mix", "Mix it to match", "🎨", "Colour matcher", ["4E.02", "4M.01"],
             "Each card shows something real. Guess the mix that matches it, then tap the two pots.",
             explain(
                 ["Matching a colour means mixing until it looks like the real thing, not like the colour in the tube."],
                 ["Two colours side by side on the wheel make a bright mix.",
                  "Two complementary colours - opposites on the wheel - dull each other down to brown.",
                  "White lightens, black darkens.",
                  "Hold the mix against the real thing, and change it again."],
                 ["Children hunt for the right tube.", "Most real colours are not in any tube. You mix them."],
                 ["Tap your guess, then tap the two pots."]),
             {"pots": [pot("red"), pot("yellow"), pot("blue"), pot("green"), pot("black"), pot("white")],
              "rounds": [
                  {"a": "red", "b": "yellow", "opts": ["orange", "brown", "green"], "why": "Red and yellow make orange, the colour of a ripe mango skin."},
                  {"a": "blue", "b": "yellow", "opts": ["green", "grey", "orange"], "why": "Blue and yellow make green, for a leaf."},
                  {"a": "red", "b": "green", "opts": ["brown", "orange", "purple"], "why": "Red and green are opposites. They dull each other to brown, like bark."},
                  {"a": "black", "b": "white", "opts": ["grey", "brown", "blue"], "why": "Black and white make grey, like a pebble."},
              ]},
             "You matched four real colours by mixing them."),

        step("tone", "Light to dark", "🌓", "Tone sorter", ["4E.01", "4M.01"],
             "Here is one blue with more and more white in it. Put them in order, lightest first.",
             explain(
                 ["Add white to a colour and you get a tint. Add more white and you get a lighter tint still.", "In Grade 3, shade meant the dark side of a thing. In mixing, a shade is a colour with black in it."],
                 ["A row of tints, light to dark, is called a tone ladder.",
                  "Artists paint one to find the exact tone they need."],
                 ["Children mix a new blob each time and lose the order.",
                  "Mix a ladder, and you can see every step."],
                 ["Tap the lightest one."]),
             {"swatches": [
                 swatch("t1", "almost white blue", "#E8F1FC", "Almost white, with only a whisper of blue."),
                 swatch("t2", "very pale blue", "#C5DCF5", "A very pale blue."),
                 swatch("t3", "light blue", "#9CC8F0", "A light blue."),
                 swatch("t4", "mid blue", "#5E96DE", "A mid blue."),
                 swatch("t5", "full blue", "#2D6CDF", "The blue straight from the pot, with no white at all."),
              ]},
             "One blue, and four tints of it, in order. That is a tone ladder."),

        step("sort", "What was added?", "🗂️", "Mix reader", ["4E.02", "4M.01"],
             "Someone mixed each of these. What did they add? Tap the bin.",
             explain(
                 ["Three things change a colour, and each does its own job."],
                 ["White makes it lighter: a tint.", "Black makes it darker: a shade.",
                  "A little of the opposite colour on the wheel - its complementary - makes it duller, without making it lighter or darker."],
                 ["Children add black to calm a colour down, and get mud.",
                  "To calm a colour, add a little of its opposite."],
                 ["Read it, then tap the bin."]),
             {"ask": "White, black, or a little of the opposite?",
              "bins": [{"id": "w", "label": "Added white", "pic": "⚪"}, {"id": "b", "label": "Added black", "pic": "⚫"}, {"id": "o", "label": "Added the opposite", "pic": "🎡"}],
              "items": [
                  {"pic": "🩷", "label": "red became a soft pink", "bin": "w", "why": "Lighter, and still red. White made a tint."},
                  {"pic": "🟫", "label": "bright red became a dull brown", "bin": "o", "why": "Duller, not lighter. A little green did that."},
                  {"pic": "🌑", "label": "blue became a deep midnight blue", "bin": "b", "why": "Darker, and still blue. Black made a shade."},
                  {"pic": "🌤️", "label": "blue became a pale sky blue", "bin": "w", "why": "Lighter blue. White again."},
                  {"pic": "🫒", "label": "bright green became a quiet green-brown, no lighter and no darker", "bin": "o", "why": "Only the opposite colour dulls a green without lightening or darkening it."},
                  {"pic": "🌲", "label": "green became a dark forest green", "bin": "b", "why": "Darker green. Black."},
                  {"pic": "🍑", "label": "orange became a pale peach", "bin": "w", "why": "Pale and warm. White in orange."},
              ]},
             "You read seven mixes and said what went in."),

        step("choose", "The right paint for the job", "🧰", "Paint chooser", ["4M.01", "4M.02"],
             "Different paints do different jobs. Which one does this job? Tap it.",
             explain(
                 ["Paint is not just colour. Each kind behaves differently."],
                 ["Watercolour is see-through, so it is good for a wash.",
                  "Thick poster paint covers what is under it.",
                  "Oil pastel is waxy: paint over it and the paint slides off, which makes a resist.",
                  "Ink makes a strong, fine line."],
                 ["Children use the same paint for everything and wonder why the sky looks heavy."],
                 ["Read the job, then tap the paint."]),
             {"materials": [
                 material("water", "Watercolour", "💧", ["see-through"], "Watercolour is see-through. The paper glows through it."),
                 material("poster", "Thick poster paint", "🎨", ["covers"], "Poster paint is thick and covers what is underneath."),
                 material("pastel", "Oil pastel", "🖍️", ["waxy"], "Oil pastel is waxy, so watery paint will not stick to it."),
                 material("ink", "Ink and a fine pen", "🖊️", ["fine line"], "Ink gives a strong, fine line."),
                ],
              "rounds": [
                  {"purpose": "a soft wash of sky, with the paper glowing through", "needs": "see-through", "pic": "🌤️", "why": "A wash wants a see-through paint, so the white paper still shines."},
                  {"purpose": "covering a mistake you have already painted", "needs": "covers", "pic": "🩹", "why": "Only a thick, covering paint hides what is under it."},
                  {"purpose": "white stars that stay white when you paint the sky over them", "needs": "waxy", "pic": "⭐", "why": "Wax resists the paint, so the stars stay."},
                  {"purpose": "thin dark lines on top of dry paint", "needs": "fine line", "pic": "🖊️", "why": "Ink and a fine pen make a sharp line over dry paint."},
              ]},
             "You matched four jobs to four paints."),

        step("refine", "Nearly right", "🔧", "Colour fixer", ["4R.01", "4M.02", "4TWA.02"],
             "Each mix is close, but not right yet. Tap the change that fixes it.",
             explain(
                 ["A colour that is nearly right does not need throwing away. It needs one small change."],
                 ["Too bright: add a little of the opposite colour.",
                  "Too dark: add white.", "Too orange for a lemon: add more yellow."],
                 ["Children start again from scratch, and lose the good part of the mix.",
                  "Change ONE thing, then hold it against the real colour again."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Zain's brick wall", "pic": "🟥", "fixedPic": "🧱", "problem": "His red is far brighter than any brick he can see.", "fixed": "Now it matches the wall."},
                  "needs": "dull",
                  "changes": [
                      change("opp", "Add a little green, the opposite of red", "🎡", "dull", "A touch of green takes the shout out of the red. Now it is brick."),
                      change("black", "Add black", "⚫", "worse", "Darker, and muddy. Still not brick."),
                      change("white", "Add white", "⚪", "worse", "Paler and pinker. Further away than before."),
                      change("more", "Add more red", "🟥", "worse", "Brighter still."),
                  ],
                  "why": "To calm a colour without darkening it, add a little of its opposite."},
                 {"piece": {"title": "Lina's misty hill", "pic": "🌑", "fixedPic": "🌫️", "problem": "The far hill is as dark as the wall beside her.", "fixed": "Now the hill sits back in the distance."},
                  "needs": "lighter",
                  "changes": [
                      change("white", "Add white until it is pale", "⚪", "lighter", "Pale and quiet. Now it reads as far away."),
                      change("black", "Add black", "⚫", "worse", "Darker. It jumps forward, in front of the wall."),
                      change("bigger", "Make the hill bigger", "🔍", "size", "A bigger hill, still too dark to look far off."),
                      change("outline", "Draw a dark outline round it", "✏️", "worse", "A hard dark line pulls it forwards."),
                  ],
                  "why": "Far things are paler. White is what moves a colour back."},
                 {"piece": {"title": "Ravi's lemon", "pic": "🟠", "fixedPic": "🍋", "problem": "His yellow has too much red in it, so the lemon looks like an orange.", "fixed": "Now it is a lemon."},
                  "needs": "yellower",
                  "changes": [
                      change("yellow", "Add more yellow", "🟡", "yellower", "More yellow pulls it back from orange. Now it is a lemon."),
                      change("red", "Add more red", "🔴", "worse", "Redder. Now it is nearly a tomato."),
                      change("white", "Add white", "⚪", "lighter", "A pale peachy colour. Still not a lemon."),
                      change("shine", "Paint a shine on it", "✨", "add", "A shiny orange is still an orange."),
                  ],
                  "why": "A mix that has gone too far one way needs more of the other colour."},
             ]},
             "You fixed three colours that were nearly right."),

        step("questions", "Colour spotter", "💬", "Colour spotter", ["4E.02", "4M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about mixing to match.", "You have met every one of them."],
                 ["Think about tints, shades, opposites and the paints."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Mixing", "items": [
                 q("What does white do to a colour?", "⚪", "makes a lighter tint", ["turns it into its opposite", "makes it darker"], "White lightens: that is a tint."),
                 q("Which paint is see-through?", "💧", "watercolour", ["thick poster paint", "oil pastel"], "Watercolour lets the paper glow through."),
                 q("Red and green mixed make…", "🟫", "a dull brown", ["a bright orange", "purple"], "Opposites dull each other down."),
                 q("A row of tints from light to dark is a…", "🌓", "tone ladder", ["colour wheel", "palette knife"], "A tone ladder shows every step."),
             ]},
             "You know how to mix a colour to match."),

        step("quiz", "Show what you know", "⭐", "Star colour matcher", ["4E.02", "4M.01", "4M.02", "4R.01", "4TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about matching, tints and shades, the opposite colour, and the paints."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Blue and yellow make…", "🍃", "green", ["brown", "grey"], "Blue and yellow make green."),
                 q("Why add a little green to a red that is too bright?", "🎡", "because a little of the opposite colour makes it duller without darkening it", ["because green is cheaper", "because red is not allowed"], "Opposites calm each other down."),
                 q("Black and white make…", "🪨", "grey", ["brown", "cream"], "Black and white make grey."),
                 q("Which paint would keep white stars white under a dark wash?", "🖍️", "oil pastel, because wax resists paint", ["watercolour", "ink"], "Wax resists a watery paint."),
                 q("Why is a far hill painted paler?", "🌫️", "because distance makes colours paler, so pale reads as far away", ["because pale paint is thinner", "because hills are white"], "Pale colours sit back."),
                 q("Adding black to a colour makes…", "⚫", "a darker shade", ["a lighter tint", "a duller version of the same brightness"], "Black darkens: that is a shade."),
                 q("Your mix is nearly right. What should you do?", "🔧", "change one thing and check it against the real colour again", ["throw it away and start again", "use it anyway"], "One change at a time, checked each time."),
                 q("What is the point of matching a colour?", "🎨", "so your picture looks like the thing you are painting", ["so the tube lasts longer", "so everyone uses the same colour"], "Matching is looking, then mixing."),
             ]},
             "That is the whole lesson finished. You can mix a colour until it matches."),
    ],
}


LESSON["about"] = [
    "Mix colours that match real things.",
    "Put five tints in order from light to dark.",
    "Say what was added to a colour: white, black, or its opposite.",
    "Choose the right kind of paint for a job.",
    "Fix a colour that is nearly right.",
]

LESSON["lecture"] = [
    part("🎨", "The colour is not in the tube",
         "Look at a brick, a leaf or a pebble and you will not find that colour in any tube. Real colours are mixed. Matching means mixing, holding it up, and changing it until it looks right."),
    part("⚪", "White, black and the opposite",
         "Three changes do three different jobs. White lightens a colour into a tint. Black darkens it into a shade. A little of the opposite colour on the wheel makes it duller without making it lighter or darker."),
    part("🌓", "A tone ladder",
         "Mix a colour, then mix it again with a little more white each time. Line the steps up and you have a ladder of tones. Now you can find the exact tone you need instead of guessing."),
    part("💧", "Paint behaves differently",
         "Watercolour is see-through, so it washes. Poster paint covers. Oil pastel is waxy, so paint slides off it and the mark stays white. Ink makes a fine, strong line on top of dry paint."),
]

LESSON["words"] = [
    word("match", "🎯", "To mix a colour until it looks like the real thing.",
         ["I mixed it to match the brick.", "Hold it up and check the match."]),
    word("tint", "⚪", "A colour with white added.",
         ["Pink is a tint of red.", "I mixed five tints."]),
    word("shade", "⚫", "A colour with black added.",
         ["Navy is a shade of blue.", "That shade is too dark."]),
    word("complementary", "🎡", "Opposite on the colour wheel. A little of a colour's complementary dulls it.",
         ["Green is red's complementary.", "A little complementary colour dulled the red."]),
    word("wash", "💧", "A thin, see-through layer of watery paint.",
         ["I put a blue wash over the sky.", "Let the wash dry."]),
    word("resist", "🖍️", "Wax under paint, which keeps the paint off.",
         ["The crayon acts as a resist.", "I used a wax resist for the stars."]),
]

LESSON["home"] = [
    home("Match three things", "Paints, a brush, water, paper, and three things from your home",
         ["Pick a leaf, a stone and something from the kitchen.",
          "Mix a patch of colour beside each one until they match.",
          "Write beside each patch what you mixed."],
         "Which was hardest to match, and why?"),
    home("A tone ladder", "One colour of paint, white paint, a brush and paper",
         ["Paint a patch of the colour straight from the pot.",
          "Add a little white, paint the next patch, and keep going for five patches.",
          "Line them up light to dark."],
         "Which step is closest to the sky today?"),
    home("Calm it down", "Two opposite colours of paint, like red and green",
         ["Paint a bright patch of one colour.",
          "Mix in a tiny amount of its opposite and paint the next patch.",
          "Keep going until the colour is nearly brown."],
         "Where did it stop looking bright and start looking real?"),
]

LESSON["journal"] = {
    "changes": ["add a little of the opposite colour", "add white to move it back", "mix a tone ladder first", "hold it against the real thing again", "keep it just as it is"],
}
