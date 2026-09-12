# -*- coding: utf-8 -*-
"""Lesson 8 - Our Exhibition.

0067 Stage 4: TWA.03 the progression text's own group work - "as well as
working by themselves, learners will engage with group work ... helping to
refine ideas, skills and art making together"; R.01 "they begin to do this to
help others and should offer praise and guidance with confidence" - praise AND
guidance, which is Grade 4's step past Grade 3's praise and a next step;
R.02 self-assessment against success criteria; M.02 a plan made and reviewed
with peers; E.03 the journal read back across a whole year. The step up from
Grade 2 and Grade 3: Grade 2 arranged an art corner, Grade 3 kept a portfolio;
Grade 4 hangs a show for other people, together, and judges it against what
the class agreed it had to do.
"""
from _kit import explain, step, opt, q, spot, work, comment, change, part, word, home

LESSON = {
    "slug": "our-exhibition",
    "title": "Our Exhibition",
    "blurb": "Find out what an exhibition needs, read a gallery wall, get a show ready in order, decide what belongs in it, give a friend praise and guidance, fix three problems before the doors open, and look back over your whole year.",
    "steps": [
        step("explore", "What an exhibition needs", "🖼️", "Show planner", ["4TWA.03", "4R.01"],
             "An exhibition is art put up for other people. Tap each thing to hear why a show needs it.",
             explain(
                 ["A pile of pictures is not an exhibition. An exhibition is chosen, ordered and explained."],
                 ["A theme holds it together.", "A label tells you what each work is and who made it.",
                  "Works hang at eye height, so people can see them.",
                  "A title and an invitation bring people in."],
                 ["Children hang everything, anywhere, with no labels.",
                  "Every choice you make is for the person coming to look."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🧵", "label": "a theme", "say": "A theme: one idea that holds the show together, like Patterns Around Us."},
                 {"pic": "🏷️", "label": "a label for each work", "say": "A label for each work: its title, what it is made of, who made it and when."},
                 {"pic": "👀", "label": "hanging at eye height", "say": "Works hung at eye height, so people can actually look at them."},
                 {"pic": "📣", "label": "a title and an invitation", "say": "A title for the show, and an invitation so people know to come."},
                 {"pic": "🚶", "label": "an order to walk round in", "say": "An order to walk round in, so the show makes sense from beginning to end."},
                 {"pic": "💬", "label": "a way to leave a comment", "say": "A book or a card where visitors can leave a comment for the artists."},
             ], "need": 6,
              "then": {"ask": "Who is an exhibition FOR?",
                       "opts": [opt("the people who come to look", True), opt("only the artists", False), opt("nobody, it is just storage", False)],
                       "why": "Every choice in a show is made for the visitor."}},
             "A theme, labels, eye height, a title, an order and a place to reply."),

        step("source", "A gallery wall", "🏛️", "Wall reader", ["4E.01", "4TWA.03"],
             "Look at this exhibition wall. Tap the parts to find out how it was put together.",
             explain(
                 ["Galleries hang work at a height and a spacing that has been thought about."],
                 ["Both framed works sit along one line, level with a visitor's eyes.",
                  "Each has a small label beside or under it.",
                  "A sculpture stands out on a plinth, so you can walk round it.",
                  "There is space between works, so one does not shout over another."],
                 ["Children hang pictures wherever there is a gap.",
                  "Space and height are part of the show."],
                 ["Tap three things and listen."]),
             {"scene": "gallery", "need": 3, "caption": "Tap a framed work, the second work, the plinth and a visitor.",
              "spots": [
                  spot("left", "a framed work", "Framed, with a label under it, and hung so its middle is level with the visitors' eyes.", 152, 144, "🖼️"),
                  spot("middle", "the second work", "The next work along, hung at the same height, with space between them so neither shouts over the other.", 233, 145, "🎯"),
                  spot("plinth", "the plinth", "A plinth lifts a sculpture up to the same height, so you can walk round it and see every side. It has its own label.", 48, 176, "🗿"),
                  spot("visitor", "a visitor", "The show is for this person. Everything is hung at their eye height, with room to stand back and look.", 288, 190, "🚶"),
              ],
              "then": {"ask": "Why are the works hung along one line?",
                       "opts": [{"t": "so they sit at a comfortable height for the people looking", "spot": "visitor"}, {"t": "so they are easier to count"}, {"t": "because the wall is short"}],
                       "why": "Eye height is chosen for the visitor, not for the wall."}},
             "You read the wall: heights, spacing, labels and a plinth."),

        step("order", "Getting the show ready", "📋", "Show organiser", ["4TWA.03", "4M.02"],
             "Your class is putting on a show. Tap the steps in the order you would do them.",
             explain(
                 ["A show is a group job, and the order stops it falling apart on the day."],
                 ["Agree the theme first, or nothing else can be decided.",
                  "Choose the works that fit it.", "Write the labels.",
                  "Plan the wall on paper before you make a single hole.",
                  "Hang it, then invite people."],
                 ["Children start by hanging their own picture in the best spot.",
                  "Everything before the hanging is what makes a show good."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "🧵", "label": "agree the theme", "say": "First, agree the theme together. Everything else follows from it."},
                 {"pic": "🖼️", "label": "choose the works that fit", "say": "Choose the works that fit the theme, as a group."},
                 {"pic": "🏷️", "label": "write the labels", "say": "Write a label for each work: title, materials, artist, date."},
                 {"pic": "📐", "label": "plan the wall on paper", "say": "Plan the wall on paper first: what goes where, and how much space between."},
                 {"pic": "🔨", "label": "hang the show at eye height", "say": "Now hang it, at eye height, with the spacing you planned."},
                 {"pic": "📣", "label": "invite people to come", "say": "Invite people, and leave somewhere for them to write what they thought."},
             ]},
             "Theme, works, labels, plan, hang, invite. In that order."),

        step("sort", "Does it belong in this show?", "🗂️", "Theme keeper", ["4R.02", "4TWA.03"],
             "The theme your class agreed is <b>Patterns Around Us</b>. Does each work belong? Tap the bin.",
             explain(
                 ["A theme is a promise to the visitor. Everything in the show has to keep it."],
                 ["A work belongs if it is about the theme, whatever it is made of.",
                  "Leaving a work out is not a judgement on the artist: it belongs in a different show."],
                 ["Children think 'in' means good and 'out' means bad.",
                  "It means fits the theme, or does not."],
                 ["Read it, then tap the bin."]),
             {"ask": "In this show, or not this time?",
              "bins": [{"id": "in", "label": "Belongs", "pic": "✅"}, {"id": "out", "label": "Not this time", "pic": "↪️"}],
              "items": [
                  {"pic": "🧱", "label": "rubbings of brick walls and paving", "bin": "in", "why": "Patterns found on surfaces around us. It fits."},
                  {"pic": "🖼️", "label": "a printed tile from the class cloth", "bin": "in", "why": "A printed repeat is a pattern."},
                  {"pic": "😀", "label": "a portrait of a friend, beautifully drawn", "bin": "out", "why": "A lovely drawing, and not about patterns. Another show."},
                  {"pic": "🍃", "label": "a photograph of the veins on a leaf", "bin": "in", "why": "A pattern from nature, and photography counts."},
                  {"pic": "🏺", "label": "a coil pot with a stamped band round it", "bin": "in", "why": "The stamped band is a repeating pattern."},
                  {"pic": "🌋", "label": "a painting of a volcano erupting", "bin": "out", "why": "Exciting, but no pattern in it. Not this time."},
                  {"pic": "🧵", "label": "a strip of block-printed cloth", "bin": "in", "why": "A repeat, printed again and again."},
              ]},
             "You kept the promise the theme makes to the visitor."),

        step("comment", "Praise and guidance", "💛", "Helpful critic", ["4R.01", "4R.02"],
             "Your friends are choosing what to show. Say something true that also HELPS. Tap the feedback that fits.",
             explain(
                 ["At Grade 4, feedback has two jobs: to celebrate, and to help.",
                  "Both parts must be about what is really in the work."],
                 ["'Your stitches are even. Hang it lower, so people can see them.' That helps.",
                  "'It is nice' helps nobody."],
                 ["Children say the kind part and stop.",
                  "Guidance is a kindness too: it tells your friend what to do next."],
                 ["Look at the work, then tap the feedback that is about it."]),
             {"works": [
                 work("ravi", "Ravi's stitched fish, after the kantha he studied", "kantha", ["rows of stitches", "a fish", "red and blue thread"], owner="Ravi", owner_pic="👦🏻"),
                 work("ama", "Ama's cloth, printed with her own block", "blockprint", ["a repeat", "two colours", "a border"], owner="Ama", owner_pic="👧🏿"),
                 work("zain", "Zain's pot, after the jar he studied", "amphora", ["a band of figures", "two handles", "a foot"], owner="Zain", owner_pic="👦🏾"),
                 work("lina", "Lina's painting in layers", "mixedmedia", ["pen marks", "stuck paper", "a wash"], owner="Lina", owner_pic="👧🏽"),
              ],
              "rounds": [
                  {"work": "ravi", "opts": [comment("Your rows of stitches are so even. Hang it low, so people can see them close up.", "rows of stitches"), comment("Your repeat is perfect. Put it next to the window.", "a repeat"), comment("Your pen marks are sharp. Give it a wide frame.", "pen marks")], "why": "Ravi's cloth has rows of stitches. The repeat and the pen marks are in other works."},
                  {"work": "ama", "opts": [comment("Your two colours line up beautifully. Say so on the label, so visitors know it was printed twice.", "two colours"), comment("Your band of figures is neat. Put it on a plinth.", "a band of figures"), comment("Your wash is lovely and soft. Hang it away from the light.", "a wash")], "why": "Ama's cloth was printed in two colours. The figures and the wash belong to other works."},
                  {"work": "zain", "opts": [comment("Your two handles balance each other. Put it on a plinth so people can walk round it.", "two handles"), comment("Your stuck paper is bold. Hang it at the entrance.", "stuck paper"), comment("Your red and blue thread sings. Hang it beside the window.", "red and blue thread")], "why": "Zain's pot has two handles. The paper and the thread are in other works."},
                  {"work": "lina", "opts": [comment("Your pen marks give it real texture. Hang it at eye height so people see them.", "pen marks"), comment("Your border is strong. Hang it in the corner.", "a border"), comment("Your fish is full of life. Give it a bigger label.", "a fish")], "why": "Lina's painting has pen marks. The border and the fish are in other works."},
              ]},
             "You gave four friends praise AND something useful to do next."),

        step("refine", "Before the doors open", "🔧", "Show mender", ["4TWA.03", "4M.02", "4R.02"],
             "The class walks round the show and finds three problems. Tap the change that fixes each one.",
             explain(
                 ["Looking at a show together, before anyone else comes, is part of making it."],
                 ["A label nobody can read explains nothing.",
                  "Two loud works side by side fight each other.",
                  "Work hung too high is work nobody looks at."],
                 ["Children take a problem personally.",
                  "It is the SHOW being fixed, not the artist."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Hugo's label", "pic": "🔍", "fixedPic": "🏷️", "problem": "The label is written in tiny pencil and nobody can read it from where they stand.", "fixed": "Visitors can read it without leaning in."},
                  "needs": "readable",
                  "changes": [
                      change("big", "Write it again, bigger and darker, and put it at the same height as the others", "🏷️", "readable", "Big, dark and in line with the rest. Now it can be read."),
                      change("lower", "Move the label down by the skirting board", "⬇️", "worse", "Now nobody can read it AND nobody can find it."),
                      change("more", "Add more words", "📜", "add", "More tiny words, still unreadable."),
                      change("nothing", "Take the label away", "🚫", "worse", "Now the work has nothing to explain it."),
                  ],
                  "why": "A label is for reading, from where a visitor stands."},
                 {"piece": {"title": "Two bright cloths", "pic": "😵", "fixedPic": "🖼️", "problem": "Two loud, busy prints hang side by side and neither can be seen properly.", "fixed": "Each one gets its own space."},
                  "needs": "space",
                  "changes": [
                      change("space", "Move them apart and hang something quiet between them", "↔️", "space", "Space and a quiet work between. Now each print can be looked at."),
                      change("closer", "Move them closer together", "🔍", "worse", "Even more of a clash."),
                      change("bright", "Add a third bright cloth beside them", "🌈", "worse", "Three loud works shouting at once."),
                      change("light", "Turn the lights off", "🌑", "add", "Now nobody can see either of them."),
                  ],
                  "why": "Loud works need space, or a quiet work between them."},
                 {"piece": {"title": "Sofia's drawing", "pic": "⬆️", "fixedPic": "👀", "problem": "It is hung so high that visitors have to tip their heads back.", "fixed": "It hangs where people actually look."},
                  "needs": "height",
                  "changes": [
                      change("eye", "Hang it so its middle is at eye height", "👀", "height", "Its middle at eye height. Now it is looked at instead of squinted at."),
                      change("higher", "Hang it even higher, so everyone can see over heads", "⬆️", "worse", "Higher still, and now nobody can see the detail at all."),
                      change("bigger", "Draw a bigger version", "🔍", "add", "A bigger drawing, still too high."),
                      change("floor", "Lean it on the floor", "⬇️", "worse", "Now people have to crouch."),
                  ],
                  "why": "Eye height is where visitors actually look."},
             ]},
             "You walked the show together and fixed three things before anyone arrived."),

        step("journal", "My journal, the whole year", "📒", "Year journal", ["4R.01", "4TWA.03"],
             "This is everything you made in every lesson this year. Which came first? What would you change now?",
             explain(
                 ["Your journal holds everything you made this year.", "Looking back at it shows how much you have learned."],
                 ["Tap the things in the order you made them: the first lesson first.",
                  "Then pick one, and say what you would change now."],
                 ["Children think their first work was bad because it was first.",
                  "It was not bad. It is where you started, and the distance is the point."],
                 ["Tap the thing you made first."]),
             {"scope": "course",
              "changes": ["measure it before I draw", "mix it to match", "build the strong part first", "add a layer on top", "keep it just as it is"]},
             "You looked back over the whole year, and said what you would change. That is an artist reflecting."),

        step("questions", "Exhibition quiz", "💬", "Show spotter", ["4TWA.03", "4R.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the exhibition."],
                 ["Think about themes, labels, height and helpful feedback."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Exhibition", "items": [
                 q("What does a label tell a visitor?", "🏷️", "the title, the materials, who made it and when", ["how much it cost", "the artist's address"], "That is what a label is for."),
                 q("Work should be hung…", "👀", "at eye height", ["as high as possible", "on the floor"], "Eye height is where people look."),
                 q("A work that does not fit the theme is…", "↪️", "kept for a different show", ["thrown away", "put in the corner"], "Not fitting is not the same as not good."),
                 q("Good feedback at Grade 4 has…", "💛", "praise and guidance", ["praise only", "guidance only"], "Celebrate, then help."),
             ]},
             "You know how to put on a show."),

        step("quiz", "Show what you know", "⭐", "Star curator", ["4E.01", "4E.03", "4M.02", "4R.01", "4R.02", "4TWA.03"],
             "Time to show what you know, about the whole year. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have done this year."],
                 ["Think about drawing, mixing, printing, clay, building, layers, portraits and the show."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Lines going away from you meet at…", "🎯", "the vanishing point", ["the horizon's edge", "the corner"], "One vanishing point, in the distance."),
                 q("To calm a colour that is too bright, add…", "🎡", "a little of its opposite", ["black", "more of the same colour"], "Opposites dull each other."),
                 q("Why does a two-colour print need register marks?", "🎯", "so the second block lands exactly on the first", ["so the ink dries", "to sign the print"], "Register marks line the blocks up."),
                 q("Why are the bottom coils of a tall pot thicker?", "💪", "because they carry the weight above them", ["to save clay", "to look better"], "Strongest where the stress is."),
                 q("Pen marks go…", "🖊️", "on top of dry paint", ["under the wash", "on wet paint"], "Dry first, then pen."),
                 q("Naming what a work is made of means naming its…", "🎨", "medium", ["theme", "label"], "Cast metal, paint, clay: media."),
                 q("Why plan the wall on paper before hanging a show?", "📐", "because it is easier to move a plan than a hung picture", ["because paper is cheap", "because plans look tidy"], "Decide before you make holes in a wall."),
                 q("Why give guidance as well as praise?", "💛", "because it tells your friend what to try next", ["because praise is not allowed", "to find fault"], "Celebrate, then help."),
             ]},
             "That is the whole year finished. You are an artist: you look, you measure, you make, you judge your work, and you help other people with theirs."),
    ],
}


LESSON["about"] = [
    "Say what an exhibition needs, and who it is for.",
    "Read a gallery wall: height, spacing and labels.",
    "Get a show ready in the right order, as a group.",
    "Decide what belongs in a themed show.",
    "Give a friend praise AND guidance.",
]

LESSON["lecture"] = [
    part("🖼️", "A show is chosen",
         "An exhibition is not everything you made. It is the works that fit a theme, put in an order, with labels that say what each one is. Every choice is made for the person who comes to look."),
    part("👀", "Height and space",
         "Hang work so its middle is at eye height, and leave space between pieces so one does not shout over another. A sculpture goes on a plinth, where people can walk round it."),
    part("💛", "Praise and guidance",
         "Grade 4 feedback does two things: it celebrates what is really there, and it tells the artist what to try next. 'Your stitches are even, hang it lower so people can see them' does both. 'It is nice' does neither."),
    part("📒", "Look back at the year",
         "Your journal holds the whole year: the first wobbly drawing and the last careful one. Reading it back is how you see how far you have come, and how you decide what to work on next."),
]

LESSON["words"] = [
    word("exhibition", "🖼️", "Art put up for other people to come and look at.",
         ["Our exhibition opens on Friday.", "The whole class made the exhibition."]),
    word("theme", "🧵", "The one idea that holds a show together.",
         ["Our theme is Patterns Around Us.", "Does it fit the theme?"]),
    word("label", "🏷️", "The card beside a work: title, materials, artist, date.",
         ["I wrote my label in big letters.", "Read the label."]),
    word("plinth", "🗿", "A stand that lifts a sculpture up.",
         ["The pot went on a plinth.", "A plinth lets you walk round it."]),
    word("curate", "🎯", "To choose and arrange the works in a show.",
         ["We curated it together.", "Who is curating the exhibition?"]),
    word("guidance", "💛", "Telling someone what to try next, kindly.",
         ["She gave me guidance, not just praise.", "My guidance was to hang it lower."]),
]

LESSON["home"] = [
    home("A show at home", "Three pieces of your own work, paper for labels, and a wall or a table",
         ["Pick a theme, then pick the three works that fit it.",
          "Write a label for each: title, materials, your name, the date.",
          "Hang or stand them at the eye height of whoever will look."],
         "What did you leave out, and why?"),
    home("Praise and guidance", "Someone else's work, and a sticky note",
         ["Look for a long time before you say anything.",
          "Write one true thing that works, naming what is really there.",
          "Write one thing to try next."],
         "Which half was harder to write?"),
    home("The whole year", "Your journal or portfolio",
         ["Find the first thing you made this year and the last.",
          "Put them side by side.", "Write down three things you can do now that you could not do then."],
         "What do you want to get better at next year?"),
]
