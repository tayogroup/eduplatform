# -*- coding: utf-8 -*-
"""Lesson 8 - My Portfolio.

0067 Stage 3: R.01 celebrate a year of learning, gathered in a portfolio;
R.02 "analyse, critique and connect own and others' work" - Grade 3's step
past a kind word: praise AND a next step, each naming what is really in the
work; TWA.03 review and refine: judge a piece against the goal it was made
for, and change one thing; E.03 gather and record - a portfolio keeps
sketches, notes and photographs, not only finished work; M.01 the year's
media and processes met again, at a glance. The step up from Grade 2's Our
Art Corner: Grade 2 grouped work and praised it; Grade 3 checks work against
its goal, and gives feedback that helps.
"""
from _kit import explain, step, opt, q, work, comment, change, part, word, home

LESSON = {
    "slug": "my-portfolio",
    "title": "My Portfolio",
    "blurb": "Find out what goes in a portfolio, check work against the goal it was made for, give praise and a next step, change one thing in three pieces, and look back at your whole year.",
    "steps": [
        step("explore", "What is a portfolio?", "📁", "Portfolio packer", ["3E.03", "3R.01"],
             "A portfolio is a collection of an artist's work. Tap each thing to hear why it belongs in yours.",
             explain(
                 ["A portfolio shows what an artist can do, and how their work has grown.",
                  "It holds the journey, not only the finished pieces."],
                 ["Sketchbook pages show your ideas.", "Photos keep work too big for your folder, like a clay model or a mural.",
                  "Notes and feedback show what you changed, and why."],
                 ["Children put in only their best pictures.", "The sketches and the changes show your learning."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "📓", "label": "sketchbook pages", "say": "Sketchbook pages, full of ideas, sketches and colour tests."},
                 {"pic": "🖼️", "label": "finished work", "say": "Finished work: your drawings, prints, stitching and paintings."},
                 {"pic": "📷", "label": "photos of big or 3D work", "say": "Photos of work too big for your folder, like a clay model or a mural."},
                 {"pic": "📝", "label": "notes about changes", "say": "Notes about what you changed, and why you changed it."},
                 {"pic": "🗣️", "label": "feedback from others", "say": "Feedback from friends and teachers, and what you did with it."},
                 {"pic": "🏷️", "label": "a label for each piece", "say": "A label for each piece: its title, what it is made with, your name and the date."},
             ], "need": 6,
              "then": {"ask": "Why keep sketches in a portfolio, not only finished work?",
                       "opts": [opt("because they show how your ideas grew", True), opt("because they fill up space", False), opt("because finished work is not allowed", False)],
                       "why": "Sketches and notes show the journey: how your ideas grew and changed."}},
             "Sketches, finished work, photos, notes, feedback and labels. That is a portfolio."),

        step("sort", "Does it meet the goal?", "🎯", "Goal checker", ["3TWA.03", "3R.02"],
             "Every piece was made for a goal. Read the goal and the piece. Does it meet the goal yet? Tap the bin.",
             explain(
                 ["To review your work, first remember what it was FOR.", "Then check: does it do that yet?"],
                 ["A drawing lit from one side needs a highlight and a shadow.", "A mural for small children needs big pictures.",
                  "'Not yet' is not a failure. It tells you what to change next."],
                 ["Children judge work by whether they like it.", "Judge it by the GOAL."],
                 ["Read the goal, then tap the bin."]),
             {"ask": "Does it meet the goal?",
              "bins": [{"id": "meets", "label": "Meets the goal", "pic": "✅"}, {"id": "notyet", "label": "Not yet", "pic": "🔜"}],
              "items": [
                  {"pic": "🍎", "label": "Goal: light from one side. The apple has a highlight on the left and a shadow on the right.", "bin": "meets", "why": "Highlight on one side, shadow on the other. It shows where the light comes from."},
                  {"pic": "🧸", "label": "Goal: a mural for small children. It has long sentences and tiny pictures.", "bin": "notyet", "why": "Small children need big pictures and few words."},
                  {"pic": "🪧", "label": "Goal: a poster that stands out. It uses orange on blue.", "bin": "meets", "why": "Opposite colours stand out."},
                  {"pic": "🐎", "label": "Goal: a raised clay relief. The horse is flat, pressed in only a little.", "bin": "notyet", "why": "A relief needs its picture to stand up from the surface."},
                  {"pic": "🐟", "label": "Goal: neat running stitch. The stitches are small, even and in a line.", "bin": "meets", "why": "Small, even stitches in a line. That is running stitch."},
                  {"pic": "🔥", "label": "Goal: a hot campfire. It is painted in blues and greens.", "bin": "notyet", "why": "Heat wants warm colours."},
                  {"pic": "🧱", "label": "Goal: a brick pattern that repeats. The bricks go long, short, long, short, all along.", "bin": "meets", "why": "It repeats. That is a pattern."},
              ]},
             "You checked seven pieces against their goals."),

        step("comment", "Praise and a next step", "💛", "Feedback friend", ["3R.02", "3TWA.03"],
             "Good feedback says what works AND what to try next, about what is really in the work. Tap the feedback that fits.",
             explain(
                 ["At Grade 3, feedback has two parts: praise, and a next step.", "Both must be about what is really there."],
                 ["'Your cast shadow looks real. Next, make the highlight brighter.' That fits Lina's apple.",
                  "'Your fish is neat' belongs to a different work."],
                 ["Children only say 'I like it'.", "Say WHAT works, then one thing to try next."],
                 ["Look at the work, then tap the feedback that is about it."]),
             {"works": [
                 work("lina", "An apple in light and shade", "stilllife", ["a cast shadow", "a highlight", "an apple"], owner="Lina", owner_pic="👧🏽"),
                 work("zain", "A clay relief, after Han picture bricks", "relief", ["a raised horse", "a wheel", "pressed dots"], owner="Zain", owner_pic="👦🏾"),
                 work("ravi", "A stitched fish, after kantha", "kantha", ["a fish", "rows of stitches", "red and blue thread"], owner="Ravi", owner_pic="👦🏻"),
                 work("ama", "A mural design, after Ndebele wall painting", "ndebele", ["black outlines", "a doorway", "bold colours"], owner="Ama", owner_pic="👧🏿"),
              ],
              "rounds": [
                  {"work": "lina", "opts": [comment("Your cast shadow looks real. Next, make the highlight brighter.", "a cast shadow"), comment("Your fish is neat. Next, add more rows.", "a fish"), comment("Your bold colours pop. Next, add a door.", "bold colours")], "why": "Lina's apple has a cast shadow. The fish and the bold colours are in other works."},
                  {"work": "zain", "opts": [comment("Your horse stands up well. Next, press the dots deeper.", "a raised horse"), comment("Your highlight is bright. Next, darken the shadow.", "a highlight"), comment("Your doorway stands out. Next, add a zigzag.", "a doorway")], "why": "Zain's relief has a raised horse. The highlight and the doorway belong to other works."},
                  {"work": "ravi", "opts": [comment("Your rows of stitches are even. Next, stitch a second fish.", "rows of stitches"), comment("Your wheel is round. Next, add a cart.", "a wheel"), comment("Your apple is round. Next, add a shadow.", "an apple")], "why": "Ravi's cloth has rows of stitches. The wheel and the apple are in other works."},
                  {"work": "ama", "opts": [comment("Your black outlines make every colour pop. Next, add a row of triangles along the top.", "black outlines"), comment("Your red and blue thread is bright. Next, add a border.", "red and blue thread"), comment("Your pressed dots are neat. Next, add a horse.", "pressed dots")], "why": "Ama's design has black outlines. The thread and the dots belong to other works."},
              ]},
             "You gave praise and a next step, each about what is really in the work."),

        step("refine", "Change one thing", "🔧", "Portfolio polisher", ["3TWA.03", "3R.02"],
             "Before these pieces go in a portfolio, each needs one change. Tap a change and see if it fixes the problem.",
             explain(
                 ["A good artist changes ONE thing at a time, and checks if it worked."],
                 ["A tiny drawing lost on a big page: draw it bigger.", "A label nobody can read: write it neatly with the right facts.",
                  "Loose, uneven stitches: make them small and even."],
                 ["Children start again from nothing.", "Keep what works. Change one thing."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Sofia's building sketch", "pic": "🔍", "fixedPic": "🏛️", "problem": "The drawing is tiny, in one corner of a big page.", "fixed": "Now it fills the page and you can see every pattern."},
                  "needs": "fill",
                  "changes": [
                      change("bigger", "Draw it bigger, to fill the page", "🖼️", "fill", "Big enough to fill the page. Now the patterns show."),
                      change("smaller", "Draw it even smaller", "🔍", "worse", "Even tinier. Now you can hardly see it."),
                      change("frame", "Add a frame round the page", "🔲", "add", "A frame round a page that is still mostly empty."),
                      change("pale", "Use a paler pencil", "✏️", "worse", "Tiny AND pale. Harder to see than ever."),
                  ],
                  "why": "A drawing should be big enough to fill its page."},
                 {"piece": {"title": "Hugo's portfolio label", "pic": "🌀", "fixedPic": "🏷️", "problem": "The label is scribbled, and it does not say what the work is.", "fixed": "Now anyone can read the title, the materials, the artist's name and the date."},
                  "needs": "clear",
                  "changes": [
                      change("rewrite", "Write it neatly: the title, the materials, your name and the date", "🏷️", "clear", "Neat, with the title, the materials, the artist's name and the date."),
                      change("glitter", "Add glitter to the label", "✨", "add", "Sparkly, and still nobody can read it."),
                      change("tiny", "Write it in tiny letters", "🔍", "worse", "Tiny letters are even harder to read."),
                      change("nothing", "Take the label away", "🚫", "worse", "Now nobody knows what the work is at all."),
                  ],
                  "why": "A label must be clear, and give the title, the materials, the artist's name and the date."},
                 {"piece": {"title": "Ama's stitched bookmark", "pic": "🧵", "fixedPic": "🔖", "problem": "The stitches are long, loose and uneven, and they catch.", "fixed": "Small, even stitches. Neat, and nothing catches."},
                  "needs": "neat",
                  "changes": [
                      change("small", "Make the stitches small and even, all the same size", "🪡", "neat", "Small, even stitches lie flat and look neat."),
                      change("longer", "Make the stitches even longer", "📏", "worse", "Longer stitches are looser and catch more."),
                      change("knots", "Add lots of knots", "🪢", "add", "Lumpy knots, and the long stitches still catch."),
                      change("colour", "Use a brighter thread", "🟥", "colour", "Brighter thread, still loose and uneven."),
                  ],
                  "why": "Running stitch should be small and even."},
             ]},
             "You changed one thing in three pieces, and each one is ready for the portfolio."),

        step("journal", "My journal, the whole year", "📒", "Year journal", ["3R.01", "3TWA.03"],
             "This is everything you made in every lesson this year. Which came first? What would you change now?",
             explain(
                 ["Your journal holds everything you made this year.", "Looking back at it shows how much you have learned."],
                 ["Tap the things in the order you made them: the first lesson first.", "Then pick one, and say what you would change now."],
                 ["Children think their first work was bad because it was first.", "It was not bad. It was where you started."],
                 ["Tap the thing you made first."]),
             {"scope": "course",
              "changes": ["make it bigger", "add more tone", "try a complementary scheme", "ask a friend for feedback", "keep it just as it is"]},
             "You looked back over the whole year, and said what you would change. That is an artist reflecting."),

        step("questions", "Portfolio quiz", "💬", "Portfolio spotter", ["3R.01", "3R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about portfolios and feedback."],
                 ["Think about goals, praise and next steps."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Portfolio", "items": [
                 q("What is a portfolio?", "📁", "a collection of an artist's work", ["a kind of paint", "a picture frame"], "A portfolio collects your work and shows how it grew."),
                 q("Good feedback has…", "💛", "praise and a next step", ["only 'I like it'", "only what is wrong"], "Say what works, and one thing to try next."),
                 q("A mural for small children has tiny pictures. Does it meet its goal?", "🧸", "not yet", ["yes", "it has no goal"], "Small children need big pictures."),
                 q("A big clay model that will not fit in your folder goes in the portfolio as…", "📷", "a photo", ["a sketch of the table", "nothing"], "A photo keeps work too big for your folder."),
             ]},
             "You know how to build a portfolio."),

        step("quiz", "Show what you know", "⭐", "Star portfolio artist", ["3E.03", "3M.01", "3R.01", "3R.02", "3TWA.03"],
             "Time to show what you know, about the whole year. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have done this year."],
                 ["Think about sketchbooks, tone, the colour wheel, relief, stitching, murals, artists and your portfolio."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does a 6B pencil draw?", "✏️", "dark, soft lines", ["pale, hard lines", "coloured lines"], "B means black. 6B is soft and dark."),
                 q("Which colour sits opposite orange on the wheel?", "🔵", "blue", ["red", "yellow"], "Orange and blue are complementary."),
                 q("Why keep notes about changes in a portfolio?", "📝", "because they show what you learned and why you changed it", ["because notes are prettier", "because it makes it heavier"], "Notes show your thinking."),
                 q("In a relief, the picture…", "🐎", "stands up from a flat surface", ["floats in the air", "is painted flat"], "A relief is raised from its surface."),
                 q("Why give a next step as well as praise?", "🔜", "so the artist knows what to try next", ["so the artist feels bad", "because praise is not allowed"], "A next step helps the artist improve."),
                 q("What is running stitch?", "🪡", "small, even stitches in a line", ["one long stitch", "glue"], "Running stitch goes in and out, small and even."),
                 q("Whose idea was the swirling night sky?", "🌌", "Vincent van Gogh's", ["Katsushika Hokusai's", "mine"], "Van Gogh painted it in 1889."),
                 q("How do you judge if a piece works?", "🎯", "check it against the goal it was made for", ["check if it is big", "check if it is your favourite"], "Judge work by its goal."),
             ]},
             "That is the whole year finished. You are an artist: you record, you make, you learn from others, and you make your work better."),
    ],
}


LESSON["about"] = [
    "Say what goes in a portfolio, and why.",
    "Check a piece of work against the goal it was made for.",
    "Give praise and a next step about what is really in the work.",
    "Change one thing to make a piece better.",
    "Look back at your whole year.",
]

LESSON["lecture"] = [
    part("📁", "A portfolio",
         "A portfolio is a collection of an artist's work. It holds finished pieces, and also sketches, notes, photos and feedback, because they show how your ideas grew."),
    part("🎯", "Check the goal",
         "Every piece was made for a goal. To review it, remember what it was for, then ask: does it do that yet? If not yet, that tells you what to change next."),
    part("💛", "Praise and a next step",
         "Good feedback has two parts. Say what works, and say one thing to try next. Both must be about what is really in the work."),
    part("🔧", "Change one thing",
         "You do not need to start again. Keep what works, change one thing, and check if it worked. That is how artists make their work better."),
]

LESSON["words"] = [
    word("portfolio", "📁", "A collection of an artist's work, showing how it grew.",
         ["I put my sketches in my portfolio.", "My portfolio shows my whole year."]),
    word("goal", "🎯", "What a piece of work is meant to do.",
         ["The goal was a poster that stands out.", "Does it meet the goal?"]),
    word("feedback", "🗣️", "What people tell you about your work, to help you improve it.",
         ["Zain gave me feedback.", "I used the feedback."]),
    word("next step", "🔜", "One thing to try next, to make the work better.",
         ["My next step is a darker shadow.", "Give a next step with your praise."]),
    word("review", "🔍", "To look carefully at work and decide what works and what to change.",
         ["We reviewed our drawings.", "I review my work against the goal."]),
    word("label", "🏷️", "A card that gives the title, the materials, the artist's name and the date.",
         ["I wrote a label for my relief.", "The label says what it is made with."]),
]

LESSON["home"] = [
    home("Make a portfolio", "A big sheet of card, folded in half, tape and pens",
         ["Fold the card to make a folder.", "Put in three pieces: a sketch, a finished piece and a note about a change.",
          "Write a label for each one."],
         "Which piece shows the most learning?"),
    home("Feedback swap", "One of your pictures and a friend or grown-up",
         ["Ask them for one thing that works and one next step.", "Write both on a sticky note.",
          "Try the next step."],
         "Did the next step make it better?"),
    home("Goal check", "Something you made this year",
         ["Remember what it was for: its goal.", "Ask: does it meet the goal yet?",
          "If not yet, change ONE thing."],
         "What did you change, and did it work?"),
]
