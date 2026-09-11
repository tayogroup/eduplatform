# -*- coding: utf-8 -*-
"""Lesson 3 - Weave It.

0067 Stage 2: M.01 a new process the progression text names, weaving
("processes such as weaving, felting and sculpting"); E.02 explore what can
be woven and with what; E.03 record a process by ordering its steps; M.02
choose the material a woven thing needs; TWA.02 embrace the challenge of a
weave that will not hold, and TWA.03 review and refine it; R.02 say why a
weave went wrong ("Why wouldn't those two items join together?" is the
progression text's own kind of question); E.01 encounter weaving from around
the world (a loom, and the basket and cloth Grade 1 met). The step up from
Grade 1: Grade 1 LOOKED at a woven basket; Grade 2 weaves, and fixes a weave.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material, change

LESSON = {
    "slug": "weave-it",
    "title": "Weave It",
    "blurb": "Find out how weaving goes over and under, see what people weave, make a paper weave in the right order, choose what to weave with, fix a weave that falls apart, and look closely at a weaving on a loom.",
    "steps": [
        step("demo", "Over and under", "🧶", "Weave watcher", ["2E.02", "2M.01"],
             "Press <b>Next</b> and watch how a weave is made.",
             explain(
                 ["Weaving is going over and under, again and again.", "It turns loose threads into something strong."],
                 ["The threads stretched on the loom are the warp.", "The thread you weave in is the weft.",
                  "The weft goes over one warp thread and under the next.", "The next row goes the other way."],
                 ["Children go over two threads at once.", "Over ONE, under ONE."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🧵", "cap": "These threads are stretched tight on a loom. They are called the <b>warp</b>.", "say": "These threads are stretched tight on a loom. They are called the warp."},
                 {"pic": "⬆️", "cap": "The <b>weft</b> goes <b>over</b> the first warp thread…", "say": "The weft goes over the first warp thread."},
                 {"pic": "⬇️", "cap": "…and <b>under</b> the next one. Over, under, over, under.", "say": "And under the next one. Over, under, over, under.", "sound": "swish"},
                 {"pic": "🔄", "cap": "The next row goes the <b>other way</b>: under, over, under, over.", "say": "The next row goes the other way: under, over, under, over."},
                 {"pic": "👉", "cap": "Push the rows close together, so there are no gaps.", "say": "Push the rows close together, so there are no gaps."},
                 {"pic": "🧣", "cap": "Row after row, and the threads become <b>cloth</b>.", "say": "Row after row, and the threads become cloth.", "sound": "tada"},
             ]},
             "Over one, under one, and the next row the other way. That is weaving."),

        step("explore", "Things people weave", "🧺", "Weave finder", ["2E.01", "2E.02"],
             "People weave all over the world, and even some birds weave. Tap each one to hear about it.",
             explain(
                 ["Weaving is one of the oldest ways of making things.", "People weave cloth, baskets, mats, hats and chair seats."],
                 ["A basket is woven from grass or reed.", "A scarf is woven from wool.", "Some birds weave their nests from grass.",
                  "A straw hat is woven from dry grass."],
                 ["Children think weaving is only for cloth.", "Anything made by going over and under is weaving."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🧺", "label": "a basket", "say": "A basket, woven from grass, reed or thin sticks, over and under."},
                 {"pic": "🧣", "label": "a scarf", "say": "A scarf, woven from wool on a loom. Soft and warm."},
                 {"pic": "🪺", "label": "a bird's nest", "say": "A bird's nest. Some birds weave grass in and out to make a strong home."},
                 {"pic": "👒", "label": "a straw hat", "say": "A straw hat, woven from dry grass that has been flattened."},
                 {"pic": "🪑", "label": "a chair seat", "say": "A woven chair seat. Strips go over and under so it can hold you up."},
                 {"pic": "🟨", "label": "strip cloth", "say": "Strip cloth, like kente from Ghana: long narrow strips woven on a loom and sewn together."},
             ], "need": 6,
              "then": {"ask": "What is weaving?",
                       "opts": [opt("going over and under, again and again", True), opt("gluing strips side by side", False), opt("painting stripes", False)],
                       "why": "Weaving is over and under, again and again. The threads hold each other in place."}},
             "Baskets, scarves, nests, hats, seats and cloth. All woven."),

        step("order", "Make a paper weave, in order", "📄", "Paper weaver", ["2M.01", "2E.03"],
             "A paper weave is made in steps. Tap them in the order you would do them.",
             explain(
                 ["You can weave with paper.", "A sheet with slits is the warp, and strips of paper are the weft."],
                 ["First cut slits in a folded sheet, and cut some strips, with a grown-up.", "Weave the first strip over, under.",
                  "Weave the next strip under, over.", "Push them close, and glue the ends."],
                 ["Children weave every strip the same way.", "The next strip starts the OTHER way."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "✂️", "label": "cut slits in a folded sheet, and cut some strips", "say": "First, fold a sheet of paper and cut slits in it, with a grown-up, and cut some long strips of coloured paper."},
                 {"pic": "⬆️", "label": "weave the first strip over, under", "say": "Weave the first strip over, under, over, under, all the way across."},
                 {"pic": "🔄", "label": "weave the next strip under, over", "say": "Weave the next strip the other way: under, over, under, over."},
                 {"pic": "👉", "label": "push the strips close together", "say": "Push the strips close together, so there are no gaps."},
                 {"pic": "🧴", "label": "glue down the ends", "say": "Glue down the ends so the strips cannot slide out."},
             ]},
             "Slits and strips, over-under, under-over, push, glue. That is a paper weave."),

        step("choose", "What to weave with", "🧰", "Weave chooser", ["2M.02", "2TWA.02"],
             "Each weaving needs a different material. Which would work? Tap one.",
             explain(
                 ["The material decides what the weaving is like.", "Wool makes it soft. Ribbon makes it shiny. Sticks make it strong."],
                 ["A warm scarf wants something soft.", "A party mat wants something shiny.",
                  "A strong frame wants something stiff.", "A mat for the rain wants something that stays dry."],
                 ["Children pick the prettiest one.", "Pick the one that does the JOB."],
                 ["Read what it is for, then tap."]),
             {"materials": [
                 material("wool", "Wool", "🧶", ["soft", "bendy"], "Wool is soft and bendy."),
                 material("ribbon", "Ribbon", "🎀", ["shiny", "bendy"], "Ribbon is shiny and bendy."),
                 material("sticks", "Thin sticks", "🥢", ["stiff", "strong"], "Thin sticks are stiff and strong."),
                 material("plastic", "Strips of plastic bag", "🛍️", ["waterproof", "bendy"], "Plastic strips are bendy and keep the water out."),
                 material("paper", "Paper strips", "📜", ["flat", "bendy"], "Paper strips are flat and bendy, but they go soggy in the rain."),
              ],
              "rounds": [
                  {"purpose": "a soft, warm scarf", "needs": "soft", "pic": "🧣", "why": "A scarf goes round your neck. It wants something soft: wool."},
                  {"purpose": "a sparkly mat for a party", "needs": "shiny", "pic": "🎉", "why": "Sparkly wants shiny. Ribbon shines."},
                  {"purpose": "a strong frame to weave on", "needs": "strong", "pic": "🪟", "why": "A frame must not bend. Thin sticks are stiff and strong."},
                  {"purpose": "a mat to sit on in the rain", "needs": "waterproof", "pic": "🌧️", "why": "Rain would make paper soggy. Plastic strips keep the water out."},
              ]},
             "You chose what to weave with for four different jobs."),

        step("refine", "Fix the weave", "🔧", "Weave mender", ["2TWA.03", "2R.02", "2TWA.02"],
             "These weaves have a problem. Why did it go wrong? Which change fixes it? Tap one and see.",
             explain(
                 ["When a weave goes wrong, ask why.", "Then change the one thing that fixes it."],
                 ["Gaps between the strips: push them close.", "A strip that falls out went on top, not over and under.",
                  "Strips sliding out at the edge: glue the ends."],
                 ["Children pull it all out and start again.", "Find the ONE thing that went wrong."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Zara's paper weave", "pic": "🥅", "fixedPic": "🟥", "problem": "There are big gaps between the strips.", "fixed": "No gaps now. It looks like cloth."},
                  "needs": "close",
                  "changes": [
                      change("push", "Push the strips close together", "👉", "close", "Pushed close, the gaps disappear."),
                      change("more", "Add more glue", "🧴", "glue", "Sticky, but the gaps are still there."),
                      change("colour", "Use a brighter colour", "🟨", "colour", "Brighter, and still full of gaps."),
                      change("cut", "Cut the strips shorter", "✂️", "worse", "Shorter strips, and now they do not reach the edge."),
                  ],
                  "why": "Gaps come from strips that are too far apart. Push them close."},
                 {"piece": {"title": "Kofi's wool weave", "pic": "🧶", "fixedPic": "🧣", "problem": "One piece of wool keeps falling out.", "fixed": "It stays in now."},
                  "needs": "overunder",
                  "changes": [
                      change("weave", "Weave it over and under, not just lying on top", "🔄", "overunder", "Over and under, the warp holds it tight. It cannot fall out."),
                      change("longer", "Use a longer piece of wool", "📏", "size", "Longer, but still lying on top, and it falls out again."),
                      change("red", "Use red wool", "🟥", "colour", "Red wool falls out just the same."),
                      change("shake", "Shake it", "👋", "worse", "Now two strips have fallen out."),
                  ],
                  "why": "It fell out because it only lay on top. Over and under is what holds a weave together."},
                 {"piece": {"title": "Mei's ribbon mat", "pic": "🎀", "fixedPic": "🟪", "problem": "The strips slide out at the edges.", "fixed": "The edges stay neat."},
                  "needs": "ends",
                  "changes": [
                      change("glue", "Glue down the ends", "🧴", "ends", "The ends are stuck down, so nothing slides out."),
                      change("gaps", "Leave bigger gaps", "↔️", "worse", "Bigger gaps, and more sliding."),
                      change("pat", "Pat it flat", "✋", "flat", "Flatter, but the ends still slide."),
                      change("sparkle", "Add glitter", "✨", "add", "Sparkly, and the ends still slide out."),
                  ],
                  "why": "Loose ends slide. Glue them down and they stay."},
             ]},
             "You found why three weaves went wrong, and fixed each one with one change."),

        step("source", "A weaving on a loom", "🪡", "Loom looker", ["2E.01", "2E.02"],
             "This weaving is still on its loom. Tap the parts to find out what the weaver did.",
             explain(
                 ["A loom holds the warp threads tight while you weave.", "People weave on looms all over the world."],
                 ["Tap the warp: the threads at the top, still waiting.", "Tap the weft: the colours going over and under.",
                  "Tap the stripes, and the loom itself."],
                 ["Children call every thread a string.", "Weavers say warp and weft."],
                 ["Tap three things and listen."]),
             {"scene": "loom", "need": 3, "caption": "Tap the warp, the weft and the stripes.",
              "spots": [
                  spot("warp", "the warp", "The warp threads are stretched tight from top to bottom. At the top, they are still waiting for the weft.", 120, 36, "🧵"),
                  spot("weft", "the weft", "The weft goes across: over one warp thread and under the next. Look how each row goes the other way.", 160, 128, "🔄"),
                  spot("stripes", "the stripes", "Two rows of red, two of yellow, two of blue, and again. The weaver made a pattern of stripes.", 240, 196, "🟥"),
                  spot("frame", "the loom", "The loom holds the warp tight, so the weaving stays flat and even.", 20, 120, "🪵"),
              ],
              "then": {"ask": "What goes over and under the warp threads?",
                       "opts": [{"t": "the weft", "spot": "weft"}, {"t": "the loom"}, {"t": "a stamp"}],
                       "why": "The weft goes across, over and under the warp. The loom just holds the warp tight."}},
             "You found the warp, the weft, the stripes and the loom."),

        step("questions", "Weave spotter", "💬", "Weave spotter", ["2E.02", "2M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about weaving.", "You have met every one of them."],
                 ["Think about over and under, warp and weft, and what to weave with."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Weaving", "items": [
                 q("The threads stretched tight on the loom are the…", "🧵", "warp", ["weft", "wool"], "The warp is stretched on the loom. The weft goes across."),
                 q("After a row of over, under, the next row goes…", "🔄", "under, over", ["over, under again", "on top"], "Each row goes the other way, so they lock together."),
                 q("Which would make a soft scarf?", "🧶", "wool", ["thin sticks", "plastic strips"], "Wool is soft and warm."),
                 q("What is a loom for?", "🪵", "holding the warp tight", ["cutting the strips", "painting the wool"], "The loom keeps the warp tight while you weave."),
             ]},
             "You know how weaving works."),

        step("quiz", "Show what you know", "⭐", "Star weaver", ["2E.01", "2E.02", "2E.03", "2M.01", "2M.02", "2R.02", "2TWA.02", "2TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about over and under, the paper weave, the materials, the weaves you fixed and the loom."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Weaving is going…", "🧶", "over and under, again and again", ["round and round", "up and down with paint"], "Over and under is what holds a weave together."),
                 q("The thread that goes across, over and under, is the…", "🔄", "weft", ["warp", "loom"], "The weft goes across. The warp is stretched on the loom."),
                 q("Why did Kofi's piece of wool fall out?", "🧶", "because it only lay on top instead of going over and under", ["because it was red", "because it was too long"], "Over and under holds it. Lying on top does not."),
                 q("What do you do first for a paper weave?", "✂️", "cut slits in a folded sheet", ["glue the ends", "push the strips close"], "The slits make the warp. They come first."),
                 q("Why would you not weave a rain mat from paper?", "🌧️", "because paper goes soggy when it gets wet", ["because paper is too colourful", "because paper is too heavy"], "Wet paper goes soggy and tears. Plastic strips keep the water out."),
                 q("Which would make a strong frame to weave on?", "🥢", "thin sticks", ["wool", "ribbon"], "Sticks are stiff and strong. Wool and ribbon bend."),
                 q("How do you get rid of gaps in a weave?", "👉", "push the strips close together", ["add more glue", "use a brighter colour"], "Gaps come from strips that are far apart."),
                 q("Which of these is woven from dry grass?", "👒", "a straw hat", ["a clay pot", "a painting"], "A straw hat is woven from flattened dry grass."),
             ]},
             "That is the whole lesson finished. You can weave, and fix a weave that goes wrong."),
    ],
}


LESSON["about"] = [
    "Weave over and under, and say what the warp and the weft are.",
    "Name things people weave, from baskets to scarves.",
    "Put the steps of a paper weave in order.",
    "Choose the right material for a woven thing.",
    "Say why a weave went wrong, and fix it with one change.",
]

LESSON["lecture"] = [
    part("🧶", "Over and under",
         "Weaving is going over and under, again and again. The threads hold each other in place. That is how loose threads become something strong, like cloth or a basket."),
    part("🧵", "Warp and weft",
         "On a loom, some threads are stretched tight. They are the warp. The thread you weave across is the weft. It goes over one warp thread and under the next. The next row goes the other way."),
    part("🧺", "Woven everywhere",
         "People weave all over the world. Baskets from grass. Scarves from wool. In Ghana, long strips of cloth are woven on a loom and sewn together. Some birds even weave their nests."),
    part("🔧", "When it goes wrong",
         "If a strip falls out, ask why. Did it go over and under, or just lie on top? If there are gaps, push the strips close. Find the one thing that went wrong, and fix it."),
]

LESSON["words"] = [
    word("weave", "🧶", "To make something by going over and under, again and again.",
         ["I can weave with paper.", "We wove a mat."]),
    word("warp", "🧵", "The threads stretched tight on a loom.",
         ["The warp goes up and down.", "Tie the warp tight."]),
    word("weft", "🔄", "The thread you weave across, over and under the warp.",
         ["The weft is red.", "Push the weft down."]),
    word("loom", "🪵", "A frame that holds the warp tight while you weave.",
         ["We made a loom from card.", "The scarf was woven on a loom."]),
    word("strip", "📏", "A long, narrow piece of paper, cloth or plastic.",
         ["Cut a strip of paper.", "I wove the strips in."]),
    word("gap", "↔️", "An empty space between two things.",
         ["Push the strips so there is no gap.", "There is a gap in my weave."]),
]

LESSON["home"] = [
    home("Paper weave", "Two sheets of coloured paper, safe scissors, glue and a grown-up",
         ["Fold one sheet in half and cut slits from the fold, stopping before the edge. Open it out.",
          "Cut the other sheet into strips.", "Weave the first strip over, under. Weave the next one under, over.",
          "Push the strips close and glue down the ends."],
         "Does your weave make a pattern of squares?"),
    home("Card loom", "A piece of card, safe scissors, wool and a grown-up",
         ["Ask a grown-up to cut small notches along the top and bottom of the card.",
          "Wrap the wool round and round through the notches. That is your warp.",
          "Weave a different wool over and under, across. Turn back at the edge and go the other way."],
         "Can you make stripes by changing the colour of the weft?"),
    home("Weave hunt", "A grown-up and a walk around the house",
         ["Look for things that are woven: a basket, a mat, a scarf, a chair seat.",
          "Look closely. Can you see the over and under?"],
         "How many woven things did you find?"),
]

LESSON["journal"] = {
    "changes": ["push the strips closer", "use softer wool", "add a stripe of a new colour", "glue the ends down", "keep it just as it is"],
}
