# -*- coding: utf-8 -*-
"""Lesson 6 - Murals and Messages.

0067 Stage 3: TWA.01 "a mural design to enhance a wall ... how they changed
their mural design after they had considered both their audience and their
intended message" - the progression text's own example; M.02 "making
mock-up designs, creating plans or reflecting on developments using
annotations or peer review" - the planning steps, in order; TWA.03 refine a
design with others' help; R.02 connect the design to how others responded;
E.01 encounter a house wall painted in the manner of the Ndebele of South
Africa. The step up from Grade 2: Grade 2 made art for itself and a friend;
Grade 3 makes art for an audience, with a message, and changes it because of
them.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material, change

LESSON = {
    "slug": "murals-and-messages",
    "title": "Murals and Messages",
    "blurb": "Find out what murals are and who they are for, plan a mural in the right order, choose pictures that carry a message, change three designs after thinking about who will see them, and look closely at a painted house wall.",
    "steps": [
        step("explore", "Walls that speak", "🧱", "Mural finder", ["3TWA.01", "3E.01"],
             "A mural is a picture painted on a wall. Tap each one to hear what it is for.",
             explain(
                 ["A mural is art for everyone who walks past.", "Most murals have a message or a job to do."],
                 ["A school mural can welcome visitors.", "A street mural can ask people to recycle.",
                  "A hospital mural can cheer people up.", "People have painted walls for thousands of years."],
                 ["Children think a mural is just a big painting.", "A mural is for a place and for the people there."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🏫", "label": "a school mural", "say": "A school mural. It can welcome visitors and show what the school cares about."},
                 {"pic": "🏠", "label": "a painted house", "say": "A painted house. In South Africa, Ndebele artists paint their homes with bold shapes and black outlines."},
                 {"pic": "♻️", "label": "a recycling mural", "say": "A street mural about recycling. It asks everyone who walks past to help."},
                 {"pic": "🧩", "label": "a mosaic wall", "say": "A mosaic wall, made of small pieces of tile or glass stuck together."},
                 {"pic": "🏥", "label": "a hospital mural", "say": "A hospital mural. Bright pictures cheer up people who are waiting."},
                 {"pic": "🪨", "label": "a cave wall", "say": "A cave wall from long ago. People have painted walls for thousands of years."},
             ], "need": 6,
              "then": {"ask": "What is a mural?",
                       "opts": [opt("a picture painted on a wall", True), opt("a small picture in a book", False), opt("a clay pot", False)],
                       "why": "A mural is painted on a wall, for everyone who passes by."}},
             "Six walls, and each one has a job to do."),

        step("order", "Plan a mural, in order", "📋", "Mural planner", ["3M.02", "3TWA.01"],
             "A big mural starts small. Tap the planning steps in the order you would do them.",
             explain(
                 ["A mural is big, so mistakes are hard to fix. Artists plan it first."],
                 ["Decide the message, and who will see it.", "Sketch ideas and make a small mock-up.",
                  "Ask people what they think, and change it.", "Only then paint it big."],
                 ["Children start painting the wall straight away.", "The small plan saves the big wall."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "💬", "label": "decide the message and who it is for", "say": "First, decide the message, and who will see it: small children, grown-ups, visitors?"},
                 {"pic": "✏️", "label": "sketch some ideas", "say": "Sketch some ideas in your sketchbook."},
                 {"pic": "📐", "label": "make a small mock-up", "say": "Make a small mock-up: a mini version of the mural on paper."},
                 {"pic": "🗣️", "label": "ask people what they think", "say": "Show the mock-up and ask people what they think."},
                 {"pic": "🔧", "label": "change the design", "say": "Change the design, using what they said."},
                 {"pic": "🖌️", "label": "paint it big", "say": "Now paint it big on the wall."},
             ]},
             "Message, audience, sketch, mock-up, ask, change, paint. That is how a mural is planned."),

        step("choose", "Pictures for the message", "🧰", "Picture chooser", ["3M.02", "3TWA.01"],
             "Each mural has a message. Which picture would carry it best? Tap one.",
             explain(
                 ["A mural's pictures should tell its message, even to someone who cannot read."],
                 ["Saving water wants a tap and water drops.", "A welcome wants people waving.",
                  "Healthy food wants fruit and vegetables.", "Road safety wants a crossing."],
                 ["Children paint what they like to paint.", "Paint what the MESSAGE needs."],
                 ["Read the message, then tap the picture."]),
             {"materials": [
                 material("tap", "A tap with water drops", "🚰", ["water"], "A tap and drops say 'water'."),
                 material("wave", "Children waving", "👋", ["welcome"], "Waving says 'welcome'."),
                 material("food", "Fruit and vegetables", "🥕", ["food"], "Fruit and vegetables say 'healthy food'."),
                 material("cross", "A zebra crossing", "🚸", ["safety"], "A crossing says 'cross the road safely'."),
                 material("rocket", "A rocket", "🚀", ["space"], "A rocket says 'space'."),
              ],
              "rounds": [
                  {"purpose": "a mural about saving water", "needs": "water", "pic": "💧", "why": "A tap and water drops tell the message without any words."},
                  {"purpose": "a welcome mural by the school gate", "needs": "welcome", "pic": "🏫", "why": "Children waving say welcome to everyone."},
                  {"purpose": "a mural about healthy lunches", "needs": "food", "pic": "🥗", "why": "Fruit and vegetables show healthy food."},
                  {"purpose": "a road safety mural near a crossing", "needs": "safety", "pic": "🛑", "why": "A crossing reminds people to cross safely."},
              ]},
             "You chose the picture that carries each message."),

        step("refine", "Think about who will see it", "🔧", "Mural improver", ["3TWA.01", "3TWA.03", "3R.02"],
             "People looked at these mock-ups and said something was wrong. Which change fixes each one? Tap one and see.",
             explain(
                 ["A mural is for its audience: the people who will see it.", "When they say it does not work, change it."],
                 ["Small children cannot read long words: use big pictures.", "If nobody can tell the message, show it more clearly.",
                  "In a dark corridor, dark colours disappear: use bright ones."],
                 ["Children feel hurt when someone suggests a change.", "Their help makes the mural better for everyone."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "The nursery class mural", "pic": "📝", "fixedPic": "🧸", "problem": "The small children cannot read the long words on it.", "fixed": "Now the small children understand it."},
                  "needs": "young",
                  "changes": [
                      change("pics", "Use big pictures and very few words", "🖼️", "young", "Big pictures speak to children who cannot read yet."),
                      change("smaller", "Make the writing smaller", "🔍", "worse", "Smaller writing is even harder to read."),
                      change("more", "Add more words to explain it", "📜", "worse", "More words, and the children still cannot read them."),
                      change("grey", "Paint it grey", "🩶", "colour", "A grey mural, still full of long words."),
                  ],
                  "why": "Think about the audience: young children need pictures, not words."},
                 {"piece": {"title": "The recycling mural", "pic": "🌳", "fixedPic": "♻️", "problem": "Nobody can tell that it is about recycling.", "fixed": "Now the message is clear."},
                  "needs": "message",
                  "changes": [
                      change("bins", "Add recycling bins and arrows going round in a circle", "♻️", "message", "Bins and a circle of arrows say 'recycle' at once."),
                      change("trees", "Add more trees", "🌳", "add", "More trees, and still no sign of recycling."),
                      change("bigger", "Make it bigger", "🔍", "size", "A bigger mural with the same unclear message."),
                      change("dark", "Paint the sky darker", "🌑", "colour", "A darker sky, and still no recycling."),
                  ],
                  "why": "Show the message clearly: bins and arrows mean recycling."},
                 {"piece": {"title": "The corridor mural", "pic": "🌑", "fixedPic": "🌈", "problem": "The corridor is dark, and the dark colours are hard to see.", "fixed": "It stands out in the dim corridor."},
                  "needs": "visible",
                  "changes": [
                      change("bright", "Use bright, light colours", "🌈", "visible", "Bright, light colours stand out even in a dim corridor."),
                      change("black", "Add more black", "⬛", "worse", "Even darker. It disappears completely."),
                      change("small", "Make the pictures smaller", "🔍", "worse", "Smaller and dark: even harder to see."),
                      change("words", "Add a title", "📝", "add", "A title nobody can see in the dark."),
                  ],
                  "why": "Think about the place: a dark corridor needs bright, light colours."},
             ]},
             "You changed three murals because of who will see them and where."),

        step("source", "A painted house wall", "🏠", "Wall looker", ["3E.01", "3R.02"],
             "This wall is drawn in the manner of Ndebele house painting, from South Africa. Tap the parts to find out what the artist did.",
             explain(
                 ["In South Africa, Ndebele women have painted their homes with bold shapes for many years, and still do today.",
                  "The designs are passed down from mothers to daughters."],
                 ["Tap the thick black outlines.", "Tap the stepped shape and the diamond.", "Tap the doorway."],
                 ["Children see bright colours and stop.", "Look at how the black outlines hold every shape."],
                 ["Tap three things and listen."]),
             {"scene": "ndebele", "need": 3, "caption": "Tap the outlines, the steps and the doorway.",
              "spots": [
                  spot("outlines", "the black outlines", "Every shape has a thick black outline. It makes each colour stand out strongly.", 72, 124, "⬛"),
                  spot("steps", "the stepped shape", "The top goes up in steps, like a staircase. Steps and zigzags are common in these designs.", 160, 52, "🪜"),
                  spot("diamond", "the diamond", "A diamond inside a panel, outlined in black, repeated on the other side.", 40, 70, "🔷"),
                  spot("door", "the doorway", "The doorway is framed with bright colour, so the entrance stands out.", 160, 140, "🚪"),
              ],
              "then": {"ask": "What makes every colour on this wall stand out?",
                       "opts": [{"t": "the thick black outlines", "spot": "outlines"}, {"t": "the colours are pale"}, {"t": "the shapes are tiny"}],
                       "why": "Thick black outlines around bold colours make every shape stand out."}},
             "You found the outlines, the steps, the diamonds and the doorway."),

        step("questions", "Mural spotter", "💬", "Mural spotter", ["3TWA.01", "3M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about murals.", "You have met every one of them."],
                 ["Think about messages, audiences and planning."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Murals", "items": [
                 q("What is a mock-up?", "📐", "a small version of the design, made first", ["the finished mural", "a kind of paint"], "A mock-up is a mini version to try the idea."),
                 q("Which picture says 'save water'?", "🚰", "a tap with water drops", ["a rocket", "children waving"], "A tap and drops show water."),
                 q("Who is a mural's audience?", "👥", "the people who will see it", ["only the artist", "nobody"], "The audience is everyone who will see it."),
                 q("What do you do before painting a mural big?", "📋", "plan it and make a mock-up", ["paint straight on the wall", "buy a frame"], "Plan small first."),
             ]},
             "You know how to plan a mural."),

        step("quiz", "Show what you know", "⭐", "Star muralist", ["3E.01", "3M.02", "3R.02", "3TWA.01", "3TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about walls, planning, messages, audiences and the painted house."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A mural is painted…", "🧱", "on a wall", ["in a sketchbook", "on a clay tile"], "Murals are wall paintings."),
                 q("Why make a mock-up first?", "📐", "so you can try the idea and change it before painting it big", ["because walls are small", "because paint is free"], "It is easier to change a small plan than a big wall."),
                 q("Why use big pictures in a mural for the nursery class?", "🧸", "because small children cannot read many words yet", ["because pictures are faster to paint", "because words are not allowed"], "Think about the audience."),
                 q("What should you do when someone says your mock-up is unclear?", "🗣️", "listen, and change the design", ["ignore them", "give up"], "Their view helps the mural work for everyone."),
                 q("Which picture says 'welcome'?", "👋", "children waving", ["a rocket", "a tap"], "Waving says welcome."),
                 q("Why use bright colours in a dark corridor?", "🌈", "because dark colours disappear in a dark place", ["because bright paint is cheaper", "because corridors are always bright"], "Think about the place."),
                 q("Who paints Ndebele house designs?", "🏠", "Ndebele women in South Africa", ["painters in France", "printmakers in Japan"], "Ndebele women paint their homes, and pass the designs to their daughters."),
                 q("What holds every shape on a Ndebele wall?", "⬛", "a thick black outline", ["glitter", "tape"], "Thick black outlines make every colour stand out."),
             ]},
             "That is the whole lesson finished. You can plan a mural for an audience, with a message."),
    ],
}


LESSON["about"] = [
    "Say what a mural is and who it is for.",
    "Plan a mural in order, with a mock-up.",
    "Choose pictures that carry a message.",
    "Change a design after thinking about who will see it.",
    "Find what a Ndebele house painter did.",
]

LESSON["lecture"] = [
    part("🧱", "What is a mural?",
         "A mural is a picture painted on a wall. It is for everyone who walks past, and it usually has a job: to welcome, to cheer, or to ask people to do something."),
    part("📐", "Plan it small",
         "A mural is too big to get wrong. So decide the message, think about who will see it, sketch ideas, and make a small mock-up. Then ask people what they think."),
    part("👥", "Think about the audience",
         "The audience is the people who will see your mural. Small children need big pictures, not long words. A dark corridor needs bright colours. Change your design for them."),
    part("🏠", "Painted houses",
         "In South Africa, Ndebele women paint their homes with bold shapes and thick black outlines. The designs are passed down from mothers to daughters, and they make each home stand out."),
]

LESSON["words"] = [
    word("mural", "🧱", "A picture painted on a wall.",
         ["Our class painted a mural.", "The mural welcomes visitors."]),
    word("message", "💬", "What you want people to think or do.",
         ["The message is 'save water'.", "My mural has a clear message."]),
    word("audience", "👥", "The people who will see your work.",
         ["The audience is the nursery class.", "Think about your audience."]),
    word("mock-up", "📐", "A small version of a design, made first to test it.",
         ["I made a mock-up on paper.", "We changed the mock-up."]),
    word("outline", "⬛", "A line around the edge of a shape.",
         ["The shapes have black outlines.", "I drew a thick outline."]),
    word("feedback", "🗣️", "What people tell you about your work, to help you improve it.",
         ["My friend gave me feedback.", "I used the feedback to change my design."]),
]

LESSON["home"] = [
    home("Mini mural", "A long strip of paper, pencils and paints",
         ["Choose a message for your home: 'Switch off the lights' or 'Welcome'.",
          "Think about who will see it.", "Sketch a mock-up with big pictures and very few words."],
         "Can someone guess the message without reading?"),
    home("Ask for feedback", "Your mini mural and a grown-up or a friend",
         ["Show your mock-up.", "Ask: what do you think it says? What would make it clearer?",
          "Change one thing because of what they said."],
         "What did you change, and why?"),
    home("Bold outlines", "Paper, crayons or paints, and a thick black pen",
         ["Draw big shapes: steps, zigzags and diamonds.", "Colour them in bold colours.",
          "Outline every shape with thick black, the way Ndebele house painters do."],
         "How do the black outlines change the colours?"),
]

LESSON["journal"] = {
    "changes": ["use bigger pictures", "make the message clearer", "use brighter colours", "ask more people for feedback", "keep it just as it is"],
}
