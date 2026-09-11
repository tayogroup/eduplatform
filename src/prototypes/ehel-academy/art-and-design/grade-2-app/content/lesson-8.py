# -*- coding: utf-8 -*-
"""Lesson 8 - Our Art Corner.

0067 Stage 2: R.01 the progression text's "art corner in the classroom that
contains a range of artists' work", celebrated by grouping and by kind words;
R.02 "forming connections between their own work and that of a peer or
other artist" - two artists' works compared, and every artist the year met
praised for what is really in the work; TWA.03 work "reviewed and refined
collectively" before it is shown; E.01 art from different times and
cultures, gathered in one place; E.03 sort the year's work by process. The
step up from Grade 1's Our Gallery: Grade 1 sorted by colour and praised
friends; Grade 2 sorts by HOW a thing was made, and connects one artist's
work with another's.
"""
from _kit import explain, step, opt, q, work, comment, change, part, word, home

LESSON = {
    "slug": "our-art-corner",
    "title": "Our Art Corner",
    "blurb": "Find out what goes in an art corner, group a year of art by how it was made, compare two artists' work, say something kind and true about each artist, get the corner ready together, and look back at your whole year.",
    "steps": [
        step("explore", "What goes in an art corner?", "🖼️", "Corner planner", ["2E.01", "2R.01"],
             "An art corner is a place to look at art and get ideas. Tap each thing to hear why it belongs.",
             explain(
                 ["An art corner is a small gallery in your classroom or at home.", "It holds art from everywhere, and your own work too."],
                 ["Art from far away shows how other people make things.", "Art from long ago shows how people made things before us.",
                  "Your own work shows how far you have come."],
                 ["Children think only 'best' work goes in.", "Every kind of work belongs. It is for looking and learning."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🌍", "label": "art from far away", "say": "Art from far away, like printed cloth from Ghana or a paper cut from China."},
                 {"pic": "🏺", "label": "art from long ago", "say": "Art from long ago, like the clay heads from Nigeria, more than two thousand years old."},
                 {"pic": "🖼️", "label": "your own work", "say": "Your own work: your prints, your weave, your clay and your collage."},
                 {"pic": "👫", "label": "your friends' work", "say": "Your friends' work, so you can see their ideas too."},
                 {"pic": "🍂", "label": "treasures from nature", "say": "Treasures from nature: a leaf, a feather, a pebble to draw."},
                 {"pic": "📒", "label": "your journal", "say": "Your journal, so everyone can see how your work changed over the year."},
             ], "need": 6,
              "then": {"ask": "What is an art corner for?",
                       "opts": [opt("looking at art and getting ideas", True), opt("keeping only the best pictures", False), opt("storing paint", False)],
                       "why": "An art corner is for looking at all kinds of art, and getting ideas from it."}},
             "Art from near and far, old and new, and your own. That is an art corner."),

        step("sort", "Group the art corner", "🗂️", "Corner sorter", ["2R.01", "2E.03"],
             "One way to hang an art corner is by how each thing was made. Printed, woven, clay or collage? Tap the bin.",
             explain(
                 ["A gallery groups its art so people can see how things connect.", "You can group by colour, by feeling, or by how it was made."],
                 ["A leaf print was printed.", "A paper weave was woven.", "A pinch pot is clay.", "A tissue-paper sea is a collage."],
                 ["Children group by what the picture shows.", "Group by HOW it was made."],
                 ["Think how it was made, then tap the bin."]),
             {"ask": "Printed, woven, clay or collage?",
              "bins": [{"id": "pr", "label": "Printed", "pic": "🥔"}, {"id": "wv", "label": "Woven", "pic": "🧶"}, {"id": "cl", "label": "Clay", "pic": "🟤"}, {"id": "co", "label": "Collage", "pic": "✂️"}],
              "items": [
                  {"pic": "🍃", "label": "a leaf print", "bin": "pr", "why": "A painted leaf was pressed and lifted. Printed."},
                  {"pic": "📄", "label": "a paper weave", "bin": "wv", "why": "Strips went over and under. Woven."},
                  {"pic": "🐕", "label": "a clay dog", "bin": "cl", "why": "Modelled from clay, with score and slip."},
                  {"pic": "🌊", "label": "a tissue-paper sea", "bin": "co", "why": "Torn tissue stuck down. A collage."},
                  {"pic": "⭐", "label": "a border of potato stars", "bin": "pr", "why": "One stamp pressed again and again. Printed."},
                  {"pic": "🧣", "label": "a small weaving from a card loom", "bin": "wv", "why": "Wool woven over and under the warp."},
                  {"pic": "🏺", "label": "a pinch pot", "bin": "cl", "why": "Pinched from a ball of clay."},
                  {"pic": "🍎", "label": "a fruit bowl from magazine pages", "bin": "co", "why": "Coloured pieces cut and stuck down. A collage."},
              ]},
             "You grouped a year of art by how it was made."),

        step("compare", "Two artists, one idea", "⚖️", "Art connector", ["2R.02", "2E.01"],
             "A cloth printer and a tile maker both made patterns. Is each thing in BOTH works, or only in one?",
             explain(
                 ["Artists connect works that are far apart.", "A cloth from Ghana and a tiled wall can share an idea."],
                 ["Both have a pattern that repeats.", "Both put their shapes in squares.", "Only one has stars. Only one has circles."],
                 ["Children only see the differences.", "Look for the idea they SHARE."],
                 ["Look at both, then tap a bin."]),
             {"a": work("cloth", "A printed cloth", "adinkra", ["a repeating pattern", "shapes in squares", "circles", "diamonds", "dark brown"]),
              "b": work("tiles", "A tiled wall", "tiles", ["a repeating pattern", "shapes in squares", "stars", "blue"]),
              "cards": [
                  comment("a repeating pattern", "a repeating pattern"),
                  comment("shapes in squares", "shapes in squares"),
                  comment("stars", "stars"),
                  comment("circles", "circles"),
                  comment("blue", "blue"),
                  comment("dark brown", "dark brown"),
              ]},
             "You connected two artists' work, and found the idea they share."),

        step("comment", "Kind words for every artist", "💛", "Art corner guide", ["2R.01", "2R.02"],
             "These works are in your art corner. Say something kind and true about what is really in each one.",
             explain(
                 ["Every artist deserves a kind word, near or far, old or new.", "The best kind word names something that is really there."],
                 ["The weaver made stripes. 'I love your stripes' is about the weaving.",
                  "'Your clay hair is neat' is about a different work."],
                 ["Children praise what they wish was there.", "Look first. Then name what IS there."],
                 ["Look, then tap the comment that is about it."]),
             {"works": [
                 work("printer", "A printed cloth", "adinkra", ["circles", "diamonds", "comb lines", "a repeating pattern"], owner="the cloth printer", owner_pic="🧑🏿‍🎨"),
                 work("weaver", "A weaving on a loom", "loom", ["stripes", "over and under", "red", "yellow", "blue"], owner="the weaver", owner_pic="👩🏽‍🎨"),
                 work("potter", "A clay head", "terracotta", ["hair in rows", "almond eyes", "an open mouth", "ears"], owner="the clay maker", owner_pic="👨🏾‍🎨"),
                 work("cutter", "A paper cut", "papercut", ["two matching halves", "holes cut out", "red paper"], owner="the paper cutter", owner_pic="👩🏻‍🎨"),
              ],
              "rounds": [
                  {"work": "printer", "opts": [comment("Your circle stamps are so even.", "circles"), comment("I love your stripes.", "stripes"), comment("Your two halves match perfectly.", "two matching halves")], "why": "The printed cloth has circle stamps. The stripes and the matching halves are in other works."},
                  {"work": "weaver", "opts": [comment("I love your red, yellow and blue stripes.", "stripes"), comment("Your clay eyes are beautiful.", "almond eyes"), comment("Your comb lines are straight.", "comb lines")], "why": "The weaving has stripes. The eyes and the comb lines belong to other works."},
                  {"work": "potter", "opts": [comment("The rows of hair you pressed are so neat.", "hair in rows"), comment("Your holes are cut so carefully.", "holes cut out"), comment("I like your diamonds.", "diamonds")], "why": "The clay head has hair pressed in rows. The holes and the diamonds are in other works."},
                  {"work": "cutter", "opts": [comment("Your two halves match perfectly.", "two matching halves"), comment("I like your over and under.", "over and under"), comment("Your ears stand out well.", "ears")], "why": "The paper cut has two matching halves. The weaving and the ears belong to other works."},
              ]},
             "You said something kind and true about four artists."),

        step("refine", "Get the corner ready", "🔧", "Corner mender", ["2TWA.03", "2R.02"],
             "Before the art corner opens, three things need fixing. Work out why, then tap the change that fixes it.",
             explain(
                 ["Before a show, the class looks at the art together and fixes what is wrong.", "Not because it is bad. So everyone can enjoy it."],
                 ["A sculpture near the edge might fall: move it to the middle.", "A collage curling up needs pressing flat.",
                  "A print with a smudge can be printed again."],
                 ["Children want to throw work away.", "Fix ONE thing, together."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "The clay dog on the shelf", "pic": "🐕", "fixedPic": "🐶", "problem": "It sits right on the edge, and it could fall off.", "fixed": "It sits safely in the middle of the shelf."},
                  "needs": "safe",
                  "changes": [
                      change("middle", "Move it to the middle, on a mat", "🟫", "safe", "In the middle, on a mat, it cannot be knocked off."),
                      change("taller", "Stand it on a tall box at the edge", "📦", "worse", "Higher and still at the edge. Even more likely to fall."),
                      change("paint", "Paint it brighter", "🎨", "colour", "Brighter, and still on the edge."),
                      change("hide", "Put it in a cupboard", "🗄️", "worse", "Safe, but now nobody can see it."),
                  ],
                  "why": "Something on the edge can fall. The middle is safe."},
                 {"piece": {"title": "The tissue-paper sea", "pic": "🌊", "fixedPic": "🖼️", "problem": "The collage is curling up at the corners.", "fixed": "It lies flat and neat."},
                  "needs": "flat",
                  "changes": [
                      change("press", "Press it flat under heavy books until the glue is dry", "📚", "flat", "Pressed while it dried, it stays flat."),
                      change("water", "Sprinkle water on it", "💧", "worse", "Wet paper curls even more."),
                      change("fold", "Fold the corners over", "📐", "worse", "Folded corners, and a smaller sea."),
                      change("boat", "Add a boat", "⛵", "add", "A boat, on a sea that still curls."),
                  ],
                  "why": "Wet glue makes paper curl. Pressing it flat while it dries keeps it flat."},
                 {"piece": {"title": "The potato-star border", "pic": "⭐", "fixedPic": "🌟", "problem": "One star is a smudgy blob.", "fixed": "Every star is clear now."},
                  "needs": "clean",
                  "changes": [
                      change("again", "Print a new star on a clean strip and stick it over the smudge", "🥔", "clean", "A crisp new star covers the smudge. The pattern looks right again."),
                      change("rub", "Rub the smudge with your finger", "👆", "worse", "A bigger smudge now."),
                      change("colour", "Colour the paper round it", "🖍️", "colour", "Coloured paper, and the blob is still there."),
                      change("more", "Add more paint to the stamp", "🖌️", "worse", "More paint makes more smudges."),
                  ],
                  "why": "A smudge came from a stamp that moved. A new, clean print fixes it."},
             ]},
             "You and your class got the art corner ready, one change at a time."),

        step("journal", "My journal, the whole year", "📒", "Year journal", ["2R.01", "2TWA.03"],
             "This is everything you made in every lesson this year. Which came first? What would you change now?",
             explain(
                 ["Your journal holds everything you made this year.", "Looking back at it shows how much you have learned."],
                 ["Tap the things in the order you made them: the first lesson first.", "Then pick one, and say what you would change now."],
                 ["Children think their first work was bad because it was first.", "It was not bad. It was where you started."],
                 ["Tap the thing you made first."]),
             {"scope": "course",
              "changes": ["make it bigger", "use a tint or a shade", "add something shiny", "weave it instead", "keep it just as it is"]},
             "You looked back over the whole year, and said what you would change. That is an artist reflecting."),

        step("questions", "Art corner quiz", "💬", "Corner spotter", ["2R.01", "2R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the art corner."],
                 ["Think about grouping, comparing and kind words."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Art corner", "items": [
                 q("A leaf print goes with…", "🍃", "the printed things", ["the woven things", "the clay things"], "A leaf print was printed."),
                 q("What do the printed cloth and the tiled wall both have?", "🔁", "a repeating pattern", ["stars", "blue"], "Both repeat their shapes. Only the tiles have stars and blue."),
                 q("A kind comment should name…", "💛", "something really in the work", ["something from a different work", "nothing at all"], "Name what is really there."),
                 q("A collage is curling up. What fixes it?", "📚", "pressing it flat while it dries", ["sprinkling water on it", "folding the corners"], "Pressing it while it dries keeps it flat."),
             ]},
             "You know how to run an art corner."),

        step("quiz", "Show what you know", "⭐", "Star curator", ["2E.01", "2E.03", "2R.01", "2R.02", "2TWA.03"],
             "Time to show what you know, about the whole year. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have done this year."],
                 ["Think about printing, colour, weaving, clay, nature, collage, tools and the art corner."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a print?", "🥔", "a mark made by pressing", ["a mark made with a pencil", "a woven thing"], "Paint, press, lift."),
                 q("Blue and white make…", "🩵", "light blue", ["dark blue", "green"], "White makes a tint."),
                 q("In weaving, the thread that goes across is the…", "🔄", "weft", ["warp", "stamp"], "The weft goes over and under the warp."),
                 q("Why do potters score and slip clay?", "🍴", "so the pieces stay joined when they dry", ["to make it shiny", "to change its colour"], "Scoring and slip make a join that lasts."),
                 q("Why do we group art in an art corner?", "🗂️", "so people can see how the works connect", ["so there is less to look at", "so the best work wins"], "Grouping helps people look and connect."),
                 q("Which line shows hopping forward?", "🦘", "a zigzag", ["a circle", "a straight line"], "Up and forward, down, again and again."),
                 q("How did the paper cutter make two matching halves?", "✂️", "folded the paper before cutting", ["cut each half separately", "printed it"], "Folding means one cut makes both halves."),
                 q("What does a label tell a visitor?", "🏷️", "what the work is, what it is made with and who made it", ["how much it cost", "what the weather was"], "A label tells visitors what the work is, what it is made with, and who made it."),
             ]},
             "That is the whole year finished. You are an artist: you look, you make, you connect, and you look again."),
    ],
}


LESSON["about"] = [
    "Say what goes in an art corner, and why.",
    "Group art by how it was made: printed, woven, clay or collage.",
    "Find the idea two artists share.",
    "Say something kind and true about every artist.",
    "Get the art corner ready together, and look back at your year.",
]

LESSON["lecture"] = [
    part("🖼️", "An art corner",
         "An art corner is a small gallery in your classroom. It holds art from far away and from long ago. It holds your work and your friends' work. It is a place to look and get ideas."),
    part("🗂️", "Group it",
         "You can group the art in lots of ways. By colour. By feeling. By how it was made: printed, woven, clay or collage. Grouping helps people see how the works connect."),
    part("🔁", "Connect it",
         "A cloth from Ghana and a tiled wall look different. But both have a pattern that repeats, and both put their shapes in squares. Finding the idea two works share is called connecting."),
    part("📒", "Look back",
         "Your journal holds everything you made this year. Look back through it. Your first print. Your first weave. Your clay dog. See how far you have come."),
]

LESSON["words"] = [
    word("art corner", "🖼️", "A small place to show and look at art.",
         ["Our art corner has a weaving in it.", "I put my print in the art corner."]),
    word("group", "🗂️", "To put things together that belong together.",
         ["We grouped the art by colour.", "The prints are in one group."]),
    word("connect", "🔗", "To find what two things share.",
         ["I connected the cloth and the tiles.", "Both works connect with a pattern."]),
    word("artist", "🧑‍🎨", "A person who makes art.",
         ["The weaver is an artist.", "I am an artist too."]),
    word("display", "📌", "To put art up so people can see it.",
         ["We display our work on the wall.", "The display looks great."]),
    word("label", "🏷️", "A small card that says what a work is and who made it.",
         ["I wrote a label for my collage.", "The label says my name."]),
]

LESSON["home"] = [
    home("A home art corner", "A shelf or a table, your art from this year, and a grown-up",
         ["Choose four things you made this year.", "Put them on the shelf, grouped by how you made them.",
          "Add one thing from nature and one picture of art from far away, from a book or a card."],
         "Which work do you look at the most? Why?"),
    home("Labels", "Small cards, a dark pen, and a grown-up to help with the writing",
         ["For each work, write what it is called, what you made it with, and your name.",
          "Put the label next to the work."],
         "Can a visitor tell how each work was made, just from its label?"),
    home("Art corner tour", "Your home art corner and a visitor",
         ["Show a visitor round your art corner.", "For each work, say one thing you did and one thing you would change."],
         "What did your visitor like best?"),
]
