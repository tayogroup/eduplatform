# -*- coding: utf-8 -*-
"""Lesson 6 - Cut, Tear and Stick.

0067 Stage 2: TWA.02 "simple choices of their own, such as the selection of
collaging materials based upon the representation of colour" - the
progression text's own example, played straight; TWA.01 "add collage to a
painting to show texture" to develop an idea; M.02 choose between tearing
and cutting for the edge a picture needs; M.01 and E.02 collage as a process
and its materials; TWA.03 refine a collage that does not yet say what it
means; E.01 encounter a paper cut in the manner of Chinese paper cutting.
The step up from Grade 1: Grade 1 added ONE material to fix a picture;
Grade 2 builds a picture from pieces, choosing each by colour and edge.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material, change

LESSON = {
    "slug": "cut-tear-stick",
    "title": "Cut, Tear and Stick",
    "blurb": "Find out how a collage is made, meet the materials, choose pieces by their colour, decide whether to tear or cut, add something to show your idea, and look closely at a folded paper cut.",
    "steps": [
        step("demo", "Tear, cut and stick", "✂️", "Collage watcher", ["2E.02", "2M.01"],
             "Press <b>Next</b> and watch a collage being made.",
             explain(
                 ["A collage is a picture made by sticking pieces on.", "The pieces can be paper, cloth, foil, anything flat."],
                 ["Tearing makes a soft, furry edge.", "Cutting makes a sharp, clean edge.", "Pieces can overlap: one on top of another.",
                  "A little glue is enough."],
                 ["Children cover the paper in glue first.", "Put a little glue on each piece, not on the whole paper."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🖼️", "cap": "A <b>collage</b> is a picture made from pieces stuck down.", "say": "A collage is a picture made from pieces stuck down."},
                 {"pic": "📄", "cap": "<b>Tear</b> the paper: the edge comes out soft and furry.", "say": "Tear the paper: the edge comes out soft and furry.", "sound": "rustle"},
                 {"pic": "✂️", "cap": "<b>Cut</b> the paper: the edge comes out sharp and clean.", "say": "Cut the paper: the edge comes out sharp and clean.", "sound": "click"},
                 {"pic": "🗂️", "cap": "<b>Overlap</b> the pieces: put one on top of another.", "say": "Overlap the pieces: put one on top of another."},
                 {"pic": "🧴", "cap": "A small dot of <b>glue</b> on each piece is enough.", "say": "A small dot of glue on each piece is enough.", "sound": "squelch"},
                 {"pic": "🎨", "cap": "Press it flat. Piece by piece, you have a picture.", "say": "Press it flat. Piece by piece, you have a picture.", "sound": "tada"},
             ]},
             "Tear, cut, overlap, stick. That is a collage."),

        step("explore", "Collage materials", "🧻", "Material finder", ["2E.02", "2E.01"],
             "Almost anything flat can go in a collage. Tap each one to hear what it adds.",
             explain(
                 ["Every material adds something different to a collage."],
                 ["Tissue paper is thin enough to see through.", "Magazine pages are full of colours.", "Fabric is soft.",
                  "Foil is shiny.", "Wool makes fluffy lines.", "Card is stiff."],
                 ["Children only use plain paper.", "Try the shiny, the soft and the see-through ones too."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🩵", "label": "tissue paper", "say": "Tissue paper. It is so thin you can see through it, and colours show through each other."},
                 {"pic": "📰", "label": "magazine pages", "say": "Magazine pages. Full of colours and patterns you can tear out."},
                 {"pic": "🧵", "label": "fabric scraps", "say": "Fabric scraps. Soft cloth, with its own colours and patterns."},
                 {"pic": "🪙", "label": "foil", "say": "Foil. Shiny and silver. It catches the light."},
                 {"pic": "🧶", "label": "wool", "say": "Wool. It makes fluffy lines and curls."},
                 {"pic": "🟫", "label": "card", "say": "Card. Stiff and strong, good for the back of a collage."},
             ], "need": 6,
              "then": {"ask": "Which one is thin enough to see through?",
                       "opts": [opt("tissue paper", True), opt("card", False), opt("foil", False)],
                       "why": "Tissue paper is so thin that light and colours show through it. Card and foil block the light."}},
             "Six materials, and each one adds something different."),

        step("choose", "Pick by colour", "🎨", "Colour picker", ["2TWA.02", "2M.02"],
             "You are making a collage. Which piece has the right colour for each part? Tap it.",
             explain(
                 ["In a collage, you can find a colour instead of painting it.", "You choose each piece because of its colour."],
                 ["An apple wants a red piece.", "A leaf wants a green piece.", "The sea wants blue."],
                 ["Children pick the piece they like and colour over it.", "Find a piece that is already the right colour."],
                 ["Read the part, then tap the piece."]),
             {"materials": [
                 material("mag", "Red magazine paper", "🟥", ["red", "smooth"], "A red page torn from a magazine."),
                 material("tissue", "Green tissue paper", "🟩", ["green", "see-through"], "Green tissue paper, thin enough to see through."),
                 material("card", "Yellow card", "🟨", ["yellow", "stiff"], "A piece of stiff yellow card."),
                 material("cloth", "Blue fabric", "🟦", ["blue", "soft"], "A soft blue scrap of fabric."),
                 material("bag", "A brown paper bag", "🟫", ["brown", "rough"], "A torn brown paper bag, a little rough."),
              ],
              "rounds": [
                  {"purpose": "a red apple", "needs": "red", "pic": "🍎", "why": "An apple wants red: the red magazine paper."},
                  {"purpose": "a green leaf", "needs": "green", "pic": "🍃", "why": "A leaf wants green: the green tissue paper."},
                  {"purpose": "the blue sea", "needs": "blue", "pic": "🌊", "why": "The sea wants blue: the blue fabric."},
                  {"purpose": "a tree trunk", "needs": "brown", "pic": "🌳", "why": "A trunk wants brown: the paper bag, and it is a little rough like bark."},
                  {"purpose": "the sun", "needs": "yellow", "pic": "☀️", "why": "The sun wants yellow: the yellow card."},
              ]},
             "You chose five pieces by their colour. That is how collage artists work."),

        step("sort", "Tear it or cut it?", "🗂️", "Edge chooser", ["2M.02", "2E.03"],
             "Some things have soft edges and some have sharp ones. Would you tear it or cut it? Tap the bin.",
             explain(
                 ["Tearing and cutting give different edges.", "Choose the one that looks like the real thing."],
                 ["A cloud has a soft edge, so tear it.", "A roof has straight, sharp edges, so cut it."],
                 ["Children cut everything.", "Look at the edge of the real thing first."],
                 ["Think about the edge, then tap the bin."]),
             {"ask": "Tear it, or cut it?",
              "bins": [{"id": "tear", "label": "Tear it", "pic": "📄"}, {"id": "cut", "label": "Cut it", "pic": "✂️"}],
              "items": [
                  {"pic": "☁️", "label": "a fluffy cloud", "bin": "tear", "why": "A cloud has a soft, fuzzy edge. Tear it."},
                  {"pic": "🏠", "label": "a straight house wall", "bin": "cut", "why": "A wall has straight, sharp edges. Cut it."},
                  {"pic": "🏞️", "label": "a hill with a soft, bumpy top", "bin": "tear", "why": "A soft, bumpy hill top looks best torn."},
                  {"pic": "🔺", "label": "a pointed roof", "bin": "cut", "why": "A roof has straight lines and a sharp point. Cut it."},
                  {"pic": "🌊", "label": "foamy waves", "bin": "tear", "why": "Foam is soft and fuzzy. Tear it."},
                  {"pic": "⭐", "label": "a star with sharp points", "bin": "cut", "why": "Sharp points need scissors. Cut it."},
              ]},
             "You chose tearing or cutting for six parts of a picture."),

        step("refine", "Show how it feels", "✨", "Collage improver", ["2TWA.01", "2TWA.03"],
             "These collages do not quite show what their maker meant. What could you add? Tap one and see.",
             explain(
                 ["When a picture does not say what you mean, add something that shows it.",
                  "Artists often stick collage onto a painting to show how things feel."],
                 ["A flat trunk: add rough, torn paper for bark.", "A plain sea: add layers of blue and green tissue.",
                  "A dull night sky: add shiny foil stars."],
                 ["Children start again.", "Add ONE thing that shows it."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Zara's tree", "pic": "🌳", "fixedPic": "🌳", "problem": "The trunk looks flat and smooth, not like bark.", "fixed": "Now the trunk looks rough, like real bark."},
                  "needs": "texture",
                  "changes": [
                      change("bark", "Stick on torn, crumpled brown paper", "🛍️", "texture", "Crumpled brown paper is rough and bumpy. It looks like bark."),
                      change("green", "Make the leaves greener", "🟩", "colour", "Greener leaves, and a trunk that is still flat."),
                      change("tall", "Make the tree taller", "⬆️", "size", "A taller tree with the same flat trunk."),
                      change("rip", "Tear the trunk off", "💥", "worse", "No trunk at all now."),
                  ],
                  "why": "Flat needs texture. Crumpled paper has texture, like bark."},
                 {"piece": {"title": "Kofi's sea", "pic": "🟦", "fixedPic": "🌊", "problem": "The sea is one flat block of blue.", "fixed": "Now the sea has deep and shallow parts."},
                  "needs": "layers",
                  "changes": [
                      change("layer", "Overlap torn strips of blue and green tissue", "🩵", "layers", "The tissue overlaps, and the colours show through each other, like deep and shallow water."),
                      change("card", "Stick a square of card on top", "🟫", "worse", "A brown square in the sea. That is not water."),
                      change("smaller", "Cut the sea smaller", "✂️", "size", "A smaller flat block of blue."),
                      change("boat", "Add a boat", "⛵", "add", "A boat on a sea that is still flat."),
                  ],
                  "why": "One flat colour looks flat. Layers of see-through tissue show deep and shallow water."},
                 {"piece": {"title": "Mei's night sky", "pic": "⬛", "fixedPic": "🌌", "problem": "The sky is dark, but you cannot see any stars.", "fixed": "The stars twinkle in the dark."},
                  "needs": "shine",
                  "changes": [
                      change("foil", "Stick on stars cut from shiny foil", "⭐", "shine", "Foil catches the light, so the stars shine against the dark."),
                      change("black", "Add more black paper", "⬛", "worse", "Even darker, and still no stars."),
                      change("big", "Make the picture bigger", "🔍", "size", "A bigger dark sky, with no stars."),
                      change("wool", "Stick on brown wool", "🧶", "texture", "Fluffy brown lines. Not like stars."),
                  ],
                  "why": "Stars shine. Shiny foil catches the light."},
             ]},
             "You added the right thing to three collages, so they show what their makers meant."),

        step("source", "A paper cut, folded and cut", "✂️", "Paper cut looker", ["2E.01", "2R.02"],
             "This red paper cut is drawn in the manner of Chinese paper cutting. Tap the parts to find out how it was made.",
             explain(
                 ["In China, people have cut pictures from paper for more than a thousand years.", "They fold the paper first, then cut."],
                 ["Tap the fold line down the middle.", "Tap the holes that were cut out.", "Tap the other half. Is it the same?"],
                 ["Children think both halves were cut one at a time.", "The paper was folded, so one cut makes both halves."],
                 ["Tap three things and listen."]),
             {"scene": "papercut", "need": 3, "caption": "Tap the fold, the holes and the other half.",
              "spots": [
                  spot("fold", "the fold line", "The paper was folded in half along this line before anything was cut.", 160, 26, "📏"),
                  spot("holes", "the cut-out holes", "Shapes were cut out of the folded paper. Where the paper was cut away, you see the background.", 126, 80, "🕳️"),
                  spot("same", "the other half", "This half is exactly the same as the first half, the other way round, because both were cut at once.", 216, 160, "🪞"),
              ],
              "then": {"ask": "Why are both halves exactly the same?",
                       "opts": [{"t": "the paper was folded before it was cut", "spot": "fold"}, {"t": "the maker copied very carefully"}, {"t": "it was printed with a stamp"}],
                       "why": "The paper was folded, so every cut went through both halves at once."}},
             "You found the fold, the holes and the matching halves."),

        step("questions", "Collage spotter", "💬", "Collage spotter", ["2M.02", "2TWA.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about collage and paper.", "You have met every one of them."],
                 ["Think about tearing, cutting, colours and the paper cut."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Collage", "items": [
                 q("Tearing paper makes an edge that is…", "📄", "soft and furry", ["sharp and clean", "shiny"], "A torn edge is soft and furry."),
                 q("A collage is…", "🖼️", "a picture made from pieces stuck down", ["a picture made by pressing a stamp", "a sculpture made of clay"], "A collage is made by sticking pieces down."),
                 q("Which piece would you use for the sun?", "☀️", "the yellow card", ["the blue fabric", "the green tissue"], "The sun wants yellow."),
                 q("A star with sharp points: tear it or cut it?", "⭐", "cut it", ["tear it", "fold it"], "Sharp points need scissors."),
             ]},
             "You know how to make a collage."),

        step("quiz", "Show what you know", "⭐", "Star collage maker", ["2E.01", "2E.02", "2M.01", "2M.02", "2TWA.01", "2TWA.02", "2TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about tearing and cutting, the materials, the colours, the collages you fixed and the paper cut."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Cutting paper makes an edge that is…", "✂️", "sharp and clean", ["soft and furry", "fluffy"], "Scissors make a sharp, clean edge."),
                 q("Why tear the paper for a cloud?", "☁️", "because a cloud has a soft, fuzzy edge", ["because tearing is quicker", "because clouds are blue"], "A torn edge is soft and fuzzy, like a cloud."),
                 q("In your collage, how did you get each colour?", "🎨", "by choosing a piece that is already that colour", ["by painting every piece", "by printing it"], "You chose each piece by its colour."),
                 q("Why did Zara stick crumpled paper on her tree?", "🌳", "to make the trunk look rough like bark", ["because she ran out of paint", "to make it green"], "Crumpled paper has texture, like bark."),
                 q("Which material is shiny?", "🪙", "foil", ["tissue paper", "wool"], "Foil catches the light."),
                 q("Why does the paper cut have two matching halves?", "📏", "because it was folded before it was cut", ["because it was traced", "because it was lucky"], "Folding means one cut makes both halves."),
                 q("Putting one piece on top of another is called…", "🗂️", "overlapping", ["tearing", "scoring"], "Overlapping is one piece on top of another."),
                 q("Which piece would you use for a green leaf?", "🍃", "the green tissue paper", ["the red magazine paper", "the brown paper bag"], "A leaf wants green."),
             ]},
             "That is the whole lesson finished. You can make a collage, choosing every piece on purpose."),
    ],
}


LESSON["about"] = [
    "Make a collage: tear, cut, overlap and stick.",
    "Say what tissue, fabric, foil and wool add to a collage.",
    "Choose collage pieces by their colour.",
    "Decide whether to tear or cut, from the edge you need.",
    "Find how a folded paper cut was made.",
]

LESSON["lecture"] = [
    part("🖼️", "What is a collage?",
         "A collage is a picture made by sticking pieces down. Paper, fabric, foil and wool can all go in. Instead of painting a colour, you can find a piece that is already the right colour."),
    part("✂️", "Tear or cut",
         "Tearing makes a soft, furry edge, good for clouds and hills. Cutting makes a sharp, clean edge, good for roofs and stars. Look at the edge of the real thing, and choose."),
    part("✨", "Add to show it",
         "If a picture does not show what you mean, add something. Crumpled paper makes a trunk look rough. Shiny foil makes stars twinkle. See-through tissue makes water look deep."),
    part("✂️", "Paper cuts",
         "In China, people have cut pictures from paper for more than a thousand years, often from red paper. They fold the paper first, then cut. When they open it, both halves are the same."),
]

LESSON["words"] = [
    word("collage", "🖼️", "A picture made by sticking pieces down.",
         ["I made a collage of the sea.", "My collage has foil in it."]),
    word("tear paper", "📄", "To pull paper apart with your fingers.",
         ["Tear paper for a cloud.", "A torn edge is soft."]),
    word("overlap", "🗂️", "To put one thing partly on top of another.",
         ["The pieces overlap.", "I overlapped the tissue."]),
    word("tissue", "🩵", "Very thin paper you can see through.",
         ["I used blue tissue for the sea.", "Tissue lets the light through."]),
    word("fold", "📏", "To bend paper over so one part lies on another.",
         ["Fold the paper in half.", "I folded it before I cut."]),
    word("edge", "🔲", "The outside line of a shape or a piece.",
         ["This edge is sharp.", "A torn edge is furry."]),
]

LESSON["home"] = [
    home("Colour collage", "Old magazines, glue, safe scissors, paper, and a grown-up",
         ["Choose something to make: a fruit bowl, a garden or the sea.", "Tear or cut pieces from magazines in the right colours.",
          "Overlap them and stick them down, a little glue on each piece."],
         "Did you find every colour you needed without painting?"),
    home("Folded paper cut", "Thin paper, safe scissors and a grown-up",
         ["Fold the paper in half.", "Cut small shapes out along the fold and the edges: triangles, half-circles.",
          "Open it out."],
         "Are both halves the same? Why?"),
    home("Texture collage", "Scraps: fabric, foil, crumpled paper, wool, and a glue stick",
         ["Draw a simple picture: an animal, a tree or a house.", "Stick on scraps to show how each part would feel.",
          "Rough bark, fluffy fur, a shiny window."],
         "Can someone guess what each part feels like just by looking?"),
]

LESSON["journal"] = {
    "changes": ["overlap the pieces more", "tear instead of cut", "add something shiny", "use see-through tissue", "keep it just as it is"],
}
