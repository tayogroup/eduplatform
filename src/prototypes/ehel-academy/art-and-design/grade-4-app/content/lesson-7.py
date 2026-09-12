# -*- coding: utf-8 -*-
"""Lesson 7 - Pictures of People.

0067 Stage 4: E.01 the progression text's own words - "comparisons are made
between works of art and design from different times and cultures, to identify
features such as the use of media or the subject that is being represented" -
here ONE subject, a person, in two materials from two places; R.02 analysis and
critique, and preferences that are justified; R.01 respond to another artist's
work in your own; TWA.02 use artistic terms confidently. The step up from
Grade 3: Grade 3 compared two paintings and borrowed a technique; Grade 4
compares how two cultures showed the SAME subject, names the media, and fixes
proportion in a portrait of its own.
"""
from _kit import explain, step, opt, q, spot, work, comment, change, part, word, home

LESSON = {
    "slug": "pictures-of-people",
    "title": "Pictures of People",
    "blurb": "Look closely at a cast metal head and a painted wall figure, find what they share and what only one has, sort what each artist used, and fix three portraits where the face is out of proportion.",
    "steps": [
        step("source", "A head cast in metal", "🗿", "Head looker", ["4E.01", "4R.02"],
             "This head is drawn in the manner of the brass heads made in Benin City, in what is now Nigeria. Tap the parts to find out what its makers did.",
             explain(
                 ["In Benin City, casters worked in brass for the Oba, the ruler. The casters all belonged to one group of families, who taught the work to their children.",
                  "A head like this was made to remember an Oba who had died, and stood on an altar in the palace. It was never meant to look exactly like him."],
                 ["Tap the cap of beads over the head.", "Tap the eyes: wide, calm, and raised at the rim.",
                  "Tap the high collar of beaded rings."],
                 ["Children think a metal head was hammered out of a sheet.",
                  "It was cast: modelled in wax first, then the wax was melted out and metal took its place."],
                 ["Tap all three and listen."]),
             {"scene": "bronzehead", "need": 3, "caption": "Tap the cap, the eyes and the collar.",
              "spots": [
                  spot("cap", "the cap of beads", "Rows and rows of beads over the head. The real ones are made of coral, and only certain people at court could wear them.", 128, 46, "🔘"),
                  spot("eyes", "the eyes", "Wide, calm, open eyes with a raised rim, set about halfway down the head, and the ears sit level with them. The face is still and grand.", 179, 92, "👁️"),
                  spot("collar", "the collar", "A high collar of beaded rings, going right up under the chin. It tells you who this person was.", 160, 190, "📿"),
              ],
              "then": {"ask": "How was a head like this made?",
                       "opts": [{"t": "modelled in wax, then cast in metal", "spot": "cap"}, {"t": "carved out of a block of metal"}, {"t": "printed"}],
                       "why": "Wax model first; the wax is melted out and metal poured in. That is casting."}},
             "You found the cap, the eyes and the collar."),

        step("source", "A figure painted on a wall", "🧱", "Wall looker", ["4E.01", "4R.02"],
             "This figure is drawn in the manner of ancient Egyptian wall painting. Tap the parts to find out how a person was shown.",
             explain(
                 ["In ancient Egypt, painters showed each part of a person from the side that shows it CLEAREST.",
                  "So one figure mixes two viewpoints, on purpose."],
                 ["Tap the head: it faces sideways.",
                  "Tap the shoulders: they face you.",
                  "Tap the legs: sideways again, one striding in front of the other."],
                 ["Children think the painter could not draw a front view.",
                  "It is a rule, not a mistake: every part from its clearest side."],
                 ["Tap three things and listen."]),
             {"scene": "profile", "need": 3, "caption": "Tap the head, the shoulders, the legs and the band above.",
              "spots": [
                  spot("head", "the head", "The head faces sideways, so you see the shape of the nose and the chin. But the EYE is drawn as if you were looking straight at it.", 170, 46, "👤"),
                  spot("shoulders", "the shoulders", "The shoulders and chest face you, square on, because that shows the whole width of the body.", 140, 104, "🫱"),
                  spot("legs", "the legs", "The legs face sideways, one striding in front of the other, with both feet flat on the ground line. That shows the shape of a leg best.", 170, 186, "🦵"),
                  spot("band", "the band above", "A painted band runs along the top. On a real wall this would be hieroglyphs, which are writing; the signs here are our own pattern and do not spell anything.", 60, 18, "🔤"),
              ],
              "then": {"ask": "Why does one figure mix a sideways head with front-on shoulders?",
                       "opts": [{"t": "because each part is shown from the side that shows it clearest", "spot": "shoulders"}, {"t": "because the painter made a mistake"}, {"t": "because the wall was bent"}],
                       "why": "It is a rule the painters followed: the clearest view of every part."}},
             "You found the head, the shoulders, the legs and the band."),

        step("compare", "Two people, two ways", "⚖️", "Portrait comparer", ["4E.01", "4R.02"],
             "Both works show a person. Is each thing in BOTH of them, or only in one?",
             explain(
                 ["Comparing works from different times and places starts with the same two questions.",
                  "What is the SUBJECT? What did they MAKE it with?"],
                 ["Both show one person, and both were made to last.",
                  "One is metal, cast. One is paint, on a wall.",
                  "Only one has a collar of beads; only one shows the whole body."],
                 ["Children say one is better.", "Ask what each one is FOR, first."],
                 ["Look at both, then tap a bin."]),
             {"a": work("head", "The cast head", "bronzehead", ["one person", "made to last", "a collar", "cast in metal", "only the head", "a calm face"]),
              "b": work("wall", "The painted figure", "profile", ["one person", "made to last", "a collar", "painted on a wall", "the whole body", "a sideways head"]),
              "cards": [
                  comment("one person", "one person"),
                  comment("made to last", "made to last"),
                  comment("a collar", "a collar"),
                  comment("cast in metal", "cast in metal"),
                  comment("painted on a wall", "painted on a wall"),
                  comment("the whole body", "the whole body"),
                  comment("only the head", "only the head"),
              ]},
             "You compared two pictures of a person, made far apart."),

        step("sort", "What did they use?", "🗂️", "Medium sorter", ["4E.01", "4M.01"],
             "The material an artist uses is called the medium. Which medium is each of these? Tap the bin.",
             explain(
                 ["Naming the medium is the first thing an artist says about a work."],
                 ["Cast metal is poured in as a liquid and sets hard.",
                  "Paint on a wall is brushed on, and stays flat.",
                  "Carved stone or wood has material taken AWAY."],
                 ["Children say 'it is a statue' for anything that is not flat.",
                  "Say how it was made: cast, carved, painted, printed, stitched."],
                 ["Read it, then tap the bin."]),
             {"ask": "Cast, painted or carved?",
              "bins": [{"id": "cast", "label": "Cast", "pic": "🫗"}, {"id": "paint", "label": "Painted", "pic": "🖌️"}, {"id": "carve", "label": "Carved", "pic": "🔪"}],
              "items": [
                  {"pic": "🗿", "label": "a head modelled in wax, then filled with metal", "bin": "cast", "why": "The wax is melted out and metal takes its place. Casting."},
                  {"pic": "🧱", "label": "a figure brushed onto a wall in colours", "bin": "paint", "why": "Brushed on, and flat. Painted."},
                  {"pic": "🪵", "label": "a face cut out of a block of wood with a chisel", "bin": "carve", "why": "Material taken away. Carving."},
                  {"pic": "🔔", "label": "a bell poured into a mould", "bin": "cast", "why": "Poured as a liquid, set hard. Cast."},
                  {"pic": "🏛️", "label": "a lion cut from a block of stone", "bin": "carve", "why": "Cut away from stone. Carved."},
                  {"pic": "🖼️", "label": "a portrait made with brushes and colour on a board", "bin": "paint", "why": "Brushes and colour. Painted."},
                  {"pic": "💍", "label": "a ring made by pouring gold into a shaped hollow", "bin": "cast", "why": "Poured into a hollow: cast again."},
              ]},
             "You named the medium of seven works."),

        step("refine", "Getting a face right", "🔧", "Portrait fixer", ["4R.01", "4R.02", "4TWA.02"],
             "Three portraits are out of proportion. Tap the change that fixes each one.",
             explain(
                 ["A face has measurements, and they surprise people."],
                 ["The eyes sit about HALFWAY down the head, not near the top.",
                  "There is about one eye's width between the eyes.",
                  "The ears run from the eye line down to the bottom of the nose."],
                 ["Children draw the eyes high up and leave a huge chin.",
                  "Measure with your pencil, the way you did in Lesson 1."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Ama's portrait of her sister", "pic": "😧", "fixedPic": "🙂", "problem": "The eyes are right up near the hairline, and the chin is enormous.", "fixed": "The face looks like a real person."},
                  "needs": "eyeline",
                  "changes": [
                      change("half", "Move the eyes down to halfway between the chin and the top of the head", "📏", "eyeline", "Eyes halfway down. Suddenly it looks like a person."),
                      change("bigger", "Draw bigger eyes", "👀", "worse", "Bigger eyes, still in the wrong place."),
                      change("chin", "Cut the chin off", "✂️", "add", "A shorter head, and the eyes are still too high."),
                      change("hair", "Add more hair", "💇", "add", "Hair over a face that is still out of proportion."),
                  ],
                  "why": "On nearly every face, the eyes are about halfway down the head."},
                 {"piece": {"title": "Zain's self-portrait", "pic": "😯", "fixedPic": "😌", "problem": "The two eyes are almost touching in the middle of the face.", "fixed": "The eyes sit where they really are."},
                  "needs": "spacing",
                  "changes": [
                      change("gap", "Leave about one eye's width between the eyes", "↔️", "spacing", "One eye's width between them. That is how faces are built."),
                      change("close", "Move them closer still", "🔍", "worse", "Closer together and stranger still."),
                      change("nose", "Draw a bigger nose between them", "👃", "add", "A big nose between two eyes that are still too close."),
                      change("glasses", "Draw glasses over them", "👓", "add", "Glasses hide the problem instead of fixing it."),
                  ],
                  "why": "There is roughly one eye's width of space between the eyes."},
                 {"piece": {"title": "Sofia's grandfather", "pic": "🫤", "fixedPic": "👴", "problem": "The ears are tiny and sit right at the top of the head.", "fixed": "The ears look right."},
                  "needs": "ears",
                  "changes": [
                      change("line", "Run the ears from the eye line down to the bottom of the nose", "👂", "ears", "From the eye line to the bottom of the nose. That is where ears live."),
                      change("tiny", "Make them even smaller", "🔍", "worse", "Smaller ears, still in the wrong place."),
                      change("top", "Move them higher", "⬆️", "worse", "Higher still, above the head."),
                      change("hide", "Cover them with hair", "💇", "add", "Hiding them does not teach you where they go."),
                  ],
                  "why": "Ears sit between the eye line and the bottom of the nose."},
             ]},
             "You fixed three faces by measuring instead of guessing."),

        step("questions", "Portrait spotter", "💬", "Portrait spotter", ["4E.01", "4R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about pictures of people.", "You have met every one of them."],
                 ["Think about casting, wall painting, media and proportion."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Portraits", "items": [
                 q("The material an artist uses is called the…", "🎨", "medium", ["message", "mould"], "Cast metal, paint, clay: those are media."),
                 q("Casting means…", "🫗", "pouring metal into a shaped hollow", ["cutting a block away", "brushing colour on"], "Cast metal is poured in as a liquid."),
                 q("On an Egyptian wall painting, the head is shown…", "👤", "sideways, with the eye drawn front-on", ["straight at you", "from behind"], "Each part from its clearest side."),
                 q("On most faces, the eyes are…", "📏", "about halfway down the head", ["near the top", "near the chin"], "Halfway down. Measure and see."),
             ]},
             "You know how to look at a picture of a person."),

        step("quiz", "Show what you know", "⭐", "Star portrait reader", ["4E.01", "4M.01", "4R.01", "4R.02", "4TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the cast head, the painted wall, media and proportion."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where were brass heads like this one made?", "🗿", "Benin City, in what is now Nigeria", ["ancient Egypt", "Rajasthan"], "Casters in Benin City made them for the Oba's court."),
                 q("Why did Egyptian painters show a sideways head with front-on shoulders?", "👤", "because each part is shown from the side that shows it clearest", ["because they could not draw", "because the wall was curved"], "It was a rule they followed."),
                 q("What do BOTH works show?", "🔁", "one person", ["two handles", "the whole body"], "Both are pictures of a person. Only the wall painting shows the whole body."),
                 q("A bell poured into a mould was…", "🔔", "cast", ["carved", "painted"], "Poured as a liquid, set hard."),
                 q("A lion cut from a block of stone was…", "🏛️", "carved", ["cast", "printed"], "Carving takes material away."),
                 q("Why measure a face instead of guessing?", "📏", "because the eyes are lower down than people expect", ["because measuring is quicker", "because guessing is not allowed"], "Nearly everyone draws the eyes too high."),
                 q("How much space is there between the eyes?", "↔️", "about one eye's width", ["none", "half a head"], "Roughly one eye's width."),
                 q("Before saying which work you prefer, an artist asks…", "🤔", "what is each one for, and what is it made of?", ["which is newer?", "which is bigger?"], "Purpose and medium come before preference."),
             ]},
             "That is the whole lesson finished. You can read a picture of a person, and name what made it."),
    ],
}


LESSON["about"] = [
    "Find what the makers of a cast head did.",
    "Say how an Egyptian wall painting shows a person.",
    "Compare two works that show the same subject.",
    "Name the medium: cast, painted or carved.",
    "Put the eyes, the ears and the gaps in the right places.",
]

LESSON["lecture"] = [
    part("🗿", "Cast in metal",
         "In Benin City, in what is now Nigeria, casters made brass heads for the Oba's court. The head was modelled in wax, covered in clay, and the wax melted out so metal could take its place. Each one was made to remember an Oba who had died, and stood on an altar in the palace, so it was never meant to be an exact likeness."),
    part("🧱", "Painted on a wall",
         "Ancient Egyptian painters showed every part of a person from the side that shows it clearest: the head and legs sideways, the eye and the shoulders front-on. It looks strange to us, and it was a careful rule, not a mistake."),
    part("🎨", "Naming the medium",
         "The medium is what a work is made of and how. Cast metal is poured in as a liquid. Carving takes material away. Painting puts colour on a surface. Naming the medium is the first thing an artist says about a work."),
    part("📏", "A face has measurements",
         "The eyes sit about halfway down the head, not near the top. There is about one eye's width between them. The ears run from the eye line to the bottom of the nose. Measure, and your portrait stops looking odd."),
]

LESSON["words"] = [
    word("portrait", "🖼️", "A picture of a particular person.",
         ["I drew a portrait of my aunt.", "A portrait is meant to look like one person."]),
    word("medium", "🎨", "What a work is made of, and how: cast metal, paint, clay.",
         ["What medium is it?", "The medium is cast brass."]),
    word("cast", "🫗", "Made by pouring metal into a shaped hollow.",
         ["The head was cast in brass.", "Casting starts with a wax model."]),
    word("carve", "🔪", "To make something by taking material away.",
         ["The lion was carved from stone.", "Carving cannot be undone."]),
    word("proportion", "📏", "How big one part is compared with another.",
         ["The eyes are in proportion now.", "Measure the proportions of the face."]),
    word("viewpoint", "👁️", "The place something is shown from, and so the side of it you see.",
         ["The head is drawn from a side viewpoint.", "Two viewpoints in one figure."]),
]

LESSON["home"] = [
    home("Halfway down", "A mirror, paper and a pencil",
         ["Look in the mirror and hold a pencil level with your eyes.",
          "Check: is that halfway between your chin and the top of your head?",
          "Now draw your own face, eyes first, halfway down."],
         "Were your eyes higher or lower than you expected?"),
    home("One subject, two media", "Paper, a pencil, and clay, dough or foil",
         ["Draw somebody you know.", "Now make the same person's head out of clay, dough or scrunched foil.",
          "Put them side by side."],
         "What could you do in one that you could not do in the other?"),
    home("Whose face is it?", "A book, or a museum website with a grown-up",
         ["With a grown-up, find a picture of a person made more than two hundred years ago.",
          "Write down what it is made of, who it shows, and where it is kept today.",
          "Write one thing the artist wanted you to think about that person."],
         "How do you know they were important?"),
]

LESSON["journal"] = {
    "changes": ["move the eyes halfway down", "leave an eye's width between the eyes", "put the ears on the eye line", "try it in another medium", "keep it just as it is"],
}
