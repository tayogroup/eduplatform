# -*- coding: utf-8 -*-
"""Lesson 6 - Layers on Top.

0067 Stage 4: TWA.01 the progression text's own example of an original
development - "discovering that layers could be added to a painting by adding
pen marks on top"; E.02 explore media together rather than one at a time;
M.01 judge which medium goes under and which goes on top, and why; R.01 a
change that brings success, made to work that is nearly finished; TWA.02 take
a risk on a piece that is already good. The step up from Grade 2 and Grade 3:
Grade 2 stuck collage pieces down and Grade 3 painted with a scheme; Grade 4
puts one medium ON TOP of another, in an order that matters.
"""
from _kit import explain, step, opt, q, spot, material, change, part, word, home

LESSON = {
    "slug": "layers-on-top",
    "title": "Layers on Top",
    "blurb": "Watch a painting get pen marks and paper on top, read a picture made of layers, sort what goes under from what goes on top, make marks with a pen over dry paint, choose what to add, and rescue three pictures where a layer went wrong.",
    "steps": [
        step("demo", "Wash, then pen", "🖊️", "Layer watcher", ["4TWA.01", "4E.02"],
             "Press <b>Next</b> and watch one picture get better in layers.",
             explain(
                 ["A picture does not have to be finished in one go, in one material."],
                 ["A watery wash goes down first, and dries.",
                  "Pen marks go on top, where they stay sharp.",
                  "A piece of stuck paper can go over either.",
                  "Each layer has to be dry before the next one."],
                 ["Children draw in pen and then paint over it, and the pen disappears or smears.",
                  "Paint first. Pen last."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "💧", "cap": "A thin <b>wash</b> of colour, right across the paper.", "say": "A thin wash of colour, right across the paper.", "sound": "swish"},
                 {"pic": "⏳", "cap": "<b>Let it dry.</b> Pen on wet paint smears into a grey smudge.", "say": "Let it dry. Pen on wet paint smears into a grey smudge."},
                 {"pic": "🖊️", "cap": "<b>Pen marks</b> on top: grass, branches, the edge of the hill.", "say": "Pen marks on top. Grass, branches, the edge of the hill."},
                 {"pic": "✂️", "cap": "A strip of <b>torn paper</b> stuck over the sky, for a cloud.", "say": "A strip of torn paper stuck over the sky, for a cloud."},
                 {"pic": "🖼️", "cap": "Three layers, three materials, one picture.", "say": "Three layers, three materials, one picture."},
             ]},
             "Wash, dry, pen, paper. Each layer waits for the one before it."),

        step("source", "A picture built in layers", "🖼️", "Layer reader", ["4E.02", "4M.01"],
             "Look at this picture. Tap the parts to work out what went on first, and what went on last.",
             explain(
                 ["You can read the order of a picture by looking at what covers what."],
                 ["The paint is underneath: it covers the whole paper.",
                  "The pen marks sit on top of dry paint.",
                  "The stuck paper covers both, so it went on last.",
                  "Dashes of pen along the hill show where the artist wanted a hard edge."],
                 ["Children see one picture and one material.",
                  "Look for the edges: whatever is cut off by something else went on first."],
                 ["Tap three things and listen."]),
             {"scene": "mixedmedia", "need": 3, "caption": "Tap the stuck paper, the pen marks, the dashed edge and the sun.",
              "spots": [
                  spot("paper", "the stuck paper", "A torn strip of paper, stuck over the painted sky. It hides the paint, so it went on last.", 96, 64, "✂️"),
                  spot("pen", "the pen marks", "Little trees drawn in pen, on top of dry green paint. Pen gives a line paint cannot.", 78, 180, "🖊️"),
                  spot("dashes", "the dashed edge", "A dashed pen line along the top of the hill: a hard edge, over a soft wash.", 200, 140, "〰️"),
                  spot("sun", "the sun", "The sun was painted in the wash layer. Look: the pen lines cross straight over it, because they went on afterwards.", 252, 60, "☀️"),
              ],
              "then": {"ask": "How do you know the paper went on last?",
                       "opts": [{"t": "because it covers the painted sky", "spot": "paper"}, {"t": "because it is pink"}, {"t": "because paper is always last"}],
                       "why": "Whatever covers something else went on after it."}},
             "You read the layers: paint, then pen, then paper."),

        step("sort", "Under or on top?", "🗂️", "Layer sorter", ["4M.01", "4E.02"],
             "Some things belong under, and some belong on top. Which is each? Tap the bin.",
             explain(
                 ["The order of layers is not a matter of taste. Some materials only work one way round."],
                 ["A watery wash goes under: it is see-through and would hide nothing.",
                  "Wax crayon goes under a wash, because the wash slides off it.",
                  "Pen goes on top of dry paint.",
                  "Stuck paper and thick paint cover, so they go on top."],
                 ["Children put the wash on last and watch it lift everything underneath."],
                 ["Read it, then tap the bin."]),
             {"ask": "Does it go under, or on top?",
              "bins": [{"id": "under", "label": "Goes under", "pic": "⬇️"}, {"id": "top", "label": "Goes on top", "pic": "⬆️"}],
              "items": [
                  {"pic": "💧", "label": "a thin watery wash of colour", "bin": "under", "why": "A wash is see-through. It belongs at the bottom."},
                  {"pic": "🖍️", "label": "wax crayon that must stay white", "bin": "under", "why": "The wash slides off the wax, so the crayon has to be there first."},
                  {"pic": "🖊️", "label": "fine pen lines", "bin": "top", "why": "Pen stays sharp only on dry paint, on top."},
                  {"pic": "✂️", "label": "a stuck-down piece of torn paper", "bin": "top", "why": "Paper covers everything under it."},
                  {"pic": "🎨", "label": "thick paint used to cover a mistake", "bin": "top", "why": "Covering paint has to go over the mistake."},
                  {"pic": "✏️", "label": "a light pencil guide line", "bin": "under", "why": "Guide lines come first, and get covered."},
                  {"pic": "⭐", "label": "a white gel pen dot for a highlight", "bin": "top", "why": "A highlight is the very last thing, over everything."},
              ]},
             "You sorted seven materials into under and on top."),

        step("marks", "Marks over the paint", "🖊️", "Pen marker", ["4E.02", "4M.01", "4TWA.01"],
             "The paint is dry. Now add marks on top with the pen. Draw what each card asks for.",
             explain(
                 ["Pen does what paint cannot: thin, sharp, repeated marks."],
                 ["Lots of little dots build up a texture, and that is called stippling.",
                  "A thin line gives an edge.",
                  "A wavy line gives water or wind.",
                  "A zigzag gives grass or a rough edge."],
                 ["Children scrub the pen back and forth and tear the wet paper.",
                  "Let it dry, then keep the marks light and separate."],
                 ["Make the first mark."]),
             {"tools": ["pen", "pencil", "brush"],
              "rounds": [
                  {"tool": "pen", "want": "dots", "made": "a stippled texture", "ask": "With the pen, make lots of separate dots: stippling.", "pic": "⚫", "why": "Lots of little dots. That is stippling."},
                  {"tool": "pen", "want": "thin", "made": "a thin edge line", "ask": "With the pen, draw one thin line along an edge.", "pic": "📏", "why": "Thin and sharp. Pen gives an edge paint cannot."},
                  {"tool": "pen", "want": "wavy", "made": "a wavy line for water", "ask": "With the pen, draw a wavy line for water.", "pic": "🌊", "why": "Up and down, rolling along. Water."},
                  {"tool": "pen", "want": "zigzag", "made": "a zigzag of grass", "ask": "With the pen, draw a zigzag for grass.", "pic": "🌾", "why": "Sharp turns, up and down. Grass."},
              ]},
             "You added four kinds of pen mark over dry paint."),

        step("choose", "What to add on top", "🧰", "Layer chooser", ["4M.01", "4TWA.01", "4R.01"],
             "Each picture needs one more layer. Which one? Tap it.",
             explain(
                 ["Adding a layer is a decision, not a habit. Ask what the picture is missing."],
                 ["Missing texture: stipple it in pen.",
                  "Missing a hard edge in a soft wash: a pen line.",
                  "A part that must stay white under a wash: wax crayon, first.",
                  "A mistake to cover: thick paint."],
                 ["Children add every material to every picture.", "Add what is missing, and stop."],
                 ["Read what the picture needs, then tap."]),
             {"materials": [
                 material("stipple", "Pen stippling", "⚫", ["texture"], "Hundreds of pen dots make a texture you can almost feel."),
                 material("line", "A pen line", "🖊️", ["hard edge"], "A pen line gives a hard edge that a wash never can."),
                 material("wax", "Wax crayon, under the wash", "🖍️", ["stays white"], "Wax keeps the paint off, so what is under it stays."),
                 material("thick", "Thick covering paint", "🎨", ["covers"], "Thick paint covers whatever is under it."),
                ],
              "rounds": [
                  {"purpose": "a soft grey wash of a wall that needs to look rough", "needs": "texture", "pic": "🧱", "why": "Stippling builds texture on a flat wash."},
                  {"purpose": "a misty hill with no edge where it meets the sky", "needs": "hard edge", "pic": "🏔️", "why": "A pen line gives the edge the wash lost."},
                  {"purpose": "snowflakes that must stay white when the sky is washed dark", "needs": "stays white", "pic": "❄️", "why": "Wax resists the wash, so the flakes stay white."},
                  {"purpose": "a smudged corner you want gone", "needs": "covers", "pic": "🩹", "why": "Only a covering paint hides what is already there."},
              ]},
             "You chose the layer each picture was missing."),

        step("refine", "One layer too many", "🔧", "Layer mender", ["4R.01", "4TWA.03", "4M.02"],
             "A layer made each of these worse. Work out what went wrong, then tap the change that fixes it.",
             explain(
                 ["Layers can spoil a picture as easily as save it."],
                 ["Pen on wet paint smears: wait for dry.",
                  "Collage over the main thing hides it: put the paper at the edges instead.",
                  "Too many layers of paint go muddy: let some paper show."],
                 ["Children keep adding because the picture is not finished yet.",
                  "Ask what the picture needs, not what is left in the tray."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Zain's smeared trees", "pic": "🌫️", "fixedPic": "🌳", "problem": "He drew in pen while the paint was still wet, and the lines went grey and fuzzy.", "fixed": "The pen lines are sharp again."},
                  "needs": "dry",
                  "changes": [
                      change("dry", "Let the paint dry, then draw the pen marks", "⏳", "dry", "On dry paint the pen stays thin and black."),
                      change("press", "Press harder with the pen", "👇", "worse", "Harder pressing tears the wet paper."),
                      change("more", "Draw the lines again on top", "🖊️", "worse", "More smeared lines over smeared lines."),
                      change("paint", "Paint over the smears", "🎨", "add", "Now the trees are gone as well."),
                  ],
                  "why": "Pen only works on dry paint."},
                 {"piece": {"title": "Lina's collage bird", "pic": "📰", "fixedPic": "🐦", "problem": "She stuck so much paper on that the bird is hidden.", "fixed": "The bird is the first thing you see again."},
                  "needs": "edges",
                  "changes": [
                      change("edges", "Take the paper off the bird and keep it round the edges", "🖼️", "edges", "The paper frames the picture instead of burying it."),
                      change("bigger", "Add bigger pieces of paper", "📄", "worse", "Even more of the bird disappears."),
                      change("bird", "Draw another bird on top of the paper", "✏️", "add", "Two birds, and the picture is busier than ever."),
                      change("glue", "Use stronger glue", "🧴", "worse", "The paper sticks better and hides the bird just the same."),
                  ],
                  "why": "A layer that covers the main thing is one layer too many."},
                 {"piece": {"title": "Ravi's muddy sky", "pic": "🟫", "fixedPic": "🌤️", "problem": "He put six layers of paint on the sky and it has gone brown.", "fixed": "The sky is clear and light again."},
                  "needs": "fewer",
                  "changes": [
                      change("fewer", "Start the sky again with one clean wash, and stop", "💧", "fewer", "One clean wash, and the paper glows through it."),
                      change("another", "Add another layer of blue", "🔵", "worse", "Seven layers is muddier than six."),
                      change("black", "Add black to make it a night sky", "⚫", "worse", "Muddy brown with black in it."),
                      change("pen", "Cover it with pen marks", "🖊️", "add", "Pen marks over mud."),
                  ],
                  "why": "Each see-through layer takes light out of the one below it, so six of them turn any colour to mud. Fewer, and let the paper show."},
             ]},
             "You rescued three pictures where a layer had gone wrong."),

        step("questions", "Layer spotter", "💬", "Layer spotter", ["4E.02", "4M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about layers.", "You have met every one of them."],
                 ["Think about what goes under, what goes on top, and drying."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Layers", "items": [
                 q("Pen marks belong…", "🖊️", "on top of dry paint", ["under the paint", "on wet paint"], "Pen on dry paint stays sharp."),
                 q("Lots of little dots is called…", "⚫", "stippling", ["washing", "printing"], "Stippling builds texture out of dots."),
                 q("Wax crayon under a wash…", "🖍️", "stays white, because the paint slides off it", ["disappears", "turns blue"], "That is a wax resist."),
                 q("How can you tell what went on last?", "👀", "it covers the other layers", ["it is the brightest", "it is in the middle"], "Whatever covers something else came after it."),
             ]},
             "You know how a picture is built in layers."),

        step("quiz", "Show what you know", "⭐", "Star layerer", ["4E.02", "4M.01", "4M.02", "4R.01", "4TWA.01", "4TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about washes, pen, wax, stuck paper and drying time."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Of these three, which goes down first?", "💧", "the see-through wash", ["the pen lines", "the stuck paper"], "See-through layers go under. Only a wax crayon goes down before the wash."),
                 q("Why wait for the paint to dry before using a pen?", "⏳", "because pen on wet paint smears into a grey smudge", ["because pens dislike colour", "because it is quicker"], "Dry paint keeps the line sharp."),
                 q("A wax resist works because…", "🖍️", "watery paint slides off wax", ["wax is white", "wax is sticky"], "The wash cannot stick to wax."),
                 q("Which mark would you use for a rough wall?", "⚫", "stippling", ["one long straight line", "a wash"], "Dots build texture."),
                 q("Why can too many layers of paint go muddy?", "🟫", "because every layer takes light out of the one below it", ["because paint is brown underneath", "because paper hates paint"], "Six see-through layers turn any colour to mud."),
                 q("Collage that hides the main thing should be…", "🖼️", "moved to the edges", ["made bigger", "glued harder"], "A layer that buries the subject is one too many."),
                 q("A white gel pen highlight goes…", "⭐", "last of all, on top of everything", ["first", "under the wash"], "Highlights are the very last layer."),
                 q("Adding a layer should start with asking…", "🤔", "what is this picture missing?", ["what is left in the tray?", "what did my friend use?"], "Add what is missing, then stop."),
             ]},
             "That is the whole lesson finished. You can build a picture in layers, in the right order."),
    ],
}


LESSON["about"] = [
    "Say which materials go under and which go on top.",
    "Read the order a layered picture was made in.",
    "Make pen marks over dry paint: dots, lines, waves and zigzags.",
    "Choose the layer a picture is missing.",
    "Rescue a picture where a layer went wrong.",
]

LESSON["lecture"] = [
    part("💧", "Under and on top",
         "See-through things go under: a watery wash, a light pencil line, a wax crayon that has to stay white. Covering things go on top: pen, thick paint, stuck paper. Get the order wrong and the layer underneath is lost."),
    part("⏳", "Dry first",
         "The one rule that saves a picture. Pen on wet paint smears grey and tears the paper. Paint over wet paint goes muddy. Every layer waits for the one below it."),
    part("🖊️", "What pen can do that paint cannot",
         "Thin, sharp, repeated marks: dots that build a texture, called stippling; a hard edge across a soft wash; grass, branches, wire, rain. That is why a painting gets pen marks on top."),
    part("🤔", "One layer too many",
         "Adding is not always improving. Ask what the picture is missing, add that, and stop. If a layer buries the thing the picture is about, take it back to the edges."),
]

LESSON["words"] = [
    word("layer", "📚", "One covering of material, put on over another.",
         ["The sky has three layers.", "Let each layer dry."]),
    word("mixed media", "🎨", "A picture made with more than one material.",
         ["Paint and pen is mixed media.", "My mixed media picture has collage too."]),
    word("stippling", "⚫", "Making a texture out of lots of little dots.",
         ["I stippled the wall.", "Stippling takes patience."]),
    word("wash", "💧", "A thin, see-through layer of watery paint.",
         ["I put a wash over the whole page.", "The wash dried in a minute."]),
    word("highlight", "⭐", "The brightest spot, usually added last.",
         ["I added a white highlight.", "The highlight makes it shine."]),
    word("resist", "🖍️", "Wax under paint, which keeps the paint off.",
         ["The crayon resist kept the stars white.", "Try a wax resist."]),
]

LESSON["home"] = [
    home("Wash and pen", "Watery paint, a brush, paper, and a fine black pen",
         ["Paint a wash of one colour over the whole page and let it dry properly.",
          "Draw on top in pen: grass, branches, windows, rain.",
          "Try one patch of stippling."],
         "What can the pen do that the paint could not?"),
    home("Wax resist", "A white wax crayon, watery paint and paper",
         ["Draw with the white crayon: stars, snow, your name.",
          "Wash a dark colour over the whole page.",
          "Watch what happens where the wax is."],
         "Why did the wash slide off the crayon?"),
    home("Three layers", "Paint, pen, scrap paper and glue",
         ["Layer one: a wash. Let it dry.", "Layer two: pen marks on top.",
          "Layer three: one small piece of stuck paper, at the edge, not over the middle."],
         "Which layer did the most for the picture?"),
]

LESSON["journal"] = {
    "changes": ["wait until it is dry", "add stippling for texture", "move the collage to the edges", "use fewer layers", "keep it just as it is"],
}
