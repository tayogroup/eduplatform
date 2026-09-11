# -*- coding: utf-8 -*-
"""Lesson 4 - Clay and Sculpture.

0067 Stage 2: M.01 sculpting ("processes such as weaving, felting and
sculpting"), with a real clay join, score and slip; E.02 explore what joins
and what does not; R.02 the progression text's own question, "Why wouldn't
those two items join together?"; TWA.03 review and refine a model that falls
apart or falls over; M.02 choose what to build a sculpture from; E.01
encounter a clay head from long ago (in the manner of Nok terracotta from
Nigeria). The step up from Grade 1's Make It Stick: Grade 1 joined paper and
made a pinch pot; Grade 2 makes things that stand up in the round, and asks
why a join failed.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material, change

LESSON = {
    "slug": "clay-and-sculpture",
    "title": "Clay and Sculpture",
    "blurb": "Find out what makes a sculpture, join clay with score and slip, work out why some things will not join, make wobbly models stand up, choose what to build from, and look closely at a clay head from long ago.",
    "steps": [
        step("explore", "Flat, or all the way round?", "🗽", "Sculpture finder", ["2E.01", "2E.02"],
             "A painting is flat. A sculpture you can walk all the way round. Tap each one to hear about it.",
             explain(
                 ["A painting has one side. You look at it from the front.", "A sculpture has a front, a back and sides. You can walk round it."],
                 ["A clay pot is a sculpture you can hold.", "A statue is a sculpture in a park or a square.",
                  "A snowman and a sandcastle are sculptures too."],
                 ["Children think a sculpture must be big and made of stone.", "Anything you make in the round is a sculpture."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🖼️", "label": "a painting", "say": "A painting. It is flat. You look at it from the front."},
                 {"pic": "🏺", "label": "a clay pot", "say": "A clay pot. You can turn it round and see every side. It is a small sculpture."},
                 {"pic": "🗽", "label": "a statue", "say": "A statue, like the Statue of Liberty in New York. It is made of copper, and you can walk all round it."},
                 {"pic": "📦", "label": "a box model", "say": "A model made of boxes. Building is a way of making a sculpture too."},
                 {"pic": "☃️", "label": "a snowman", "say": "A snowman. A sculpture made of snow. It melts, but it is still a sculpture."},
                 {"pic": "🏰", "label": "a sandcastle", "say": "A sandcastle. A sculpture made of wet sand, with towers and walls."},
             ], "need": 6,
              "then": {"ask": "Which one is flat, and NOT a sculpture?",
                       "opts": [opt("a painting", True), opt("a statue", False), opt("a snowman", False)],
                       "why": "A painting is flat, with one side. A statue and a snowman can be seen from every side."}},
             "Flat pictures, and sculptures you can walk all the way round."),

        step("demo", "Score and slip", "🍴", "Clay joiner", ["2E.02", "2M.01"],
             "Press <b>Next</b> and watch how potters join two pieces of clay so they stay joined.",
             explain(
                 ["In Grade 1 you pressed wet clay onto wet clay.", "That join can fall apart when it dries, so potters use score and slip to join clay for good."],
                 ["Scratch both pieces with a fork. That is scoring.", "Dab on slip: clay mixed with water until it is runny.",
                  "Press them together and smooth the join."],
                 ["Children just squash the pieces together.", "Scratch, slip, press, smooth. Every time."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🟤", "cap": "Two pieces of clay: a body and a leg.", "say": "Two pieces of clay: a body and a leg."},
                 {"pic": "🍴", "cap": "<b>Score</b> both pieces: scratch lines where they will touch.", "say": "Score both pieces: scratch lines where they will touch.", "sound": "rustle"},
                 {"pic": "💧", "cap": "Dab on <b>slip</b>: clay mixed with water, like thick cream.", "say": "Dab on slip: clay mixed with water, like thick cream.", "sound": "squelch"},
                 {"pic": "🤝", "cap": "<b>Press</b> the two pieces together and wiggle a little.", "say": "Press the two pieces together and wiggle a little."},
                 {"pic": "👆", "cap": "<b>Smooth</b> the join with your finger until you cannot see it.", "say": "Smooth the join with your finger until you cannot see it."},
                 {"pic": "✅", "cap": "Now the leg stays on, even when the clay is dry.", "say": "Now the leg stays on, even when the clay is dry.", "sound": "tada"},
             ]},
             "Score, slip, press, smooth. A join that lasts."),

        step("sort", "Will it join?", "🗂️", "Join tester", ["2R.02", "2E.02"],
             "Will each pair join and stay joined? Think about why, then tap the bin.",
             explain(
                 ["When two things will not join, an artist asks why.", "Is it too dry? Too smooth? Is there nothing to hold them?"],
                 ["Scored clay with slip joins.", "Dry clay will not stick to wet clay.", "Two smooth pebbles have nothing to hold them."],
                 ["Children guess.", "Ask WHY it would or would not join."],
                 ["Think why, then tap the bin."]),
             {"ask": "Will it join, or not?",
              "bins": [{"id": "yes", "label": "It joins", "pic": "✅"}, {"id": "no", "label": "It will not join", "pic": "❌"}],
              "items": [
                  {"pic": "🍴", "label": "two pieces of clay, scored and slipped", "bin": "yes", "why": "The scratches and the slip grip each other. It joins."},
                  {"pic": "🏜️", "label": "a dry piece of clay on a wet piece", "bin": "no", "why": "Dry clay has no water to join with. It cracks off."},
                  {"pic": "🪨", "label": "two smooth pebbles, pressed together", "bin": "no", "why": "Pebbles are hard and smooth. Nothing holds them together."},
                  {"pic": "📦", "label": "two boxes and some sticky tape", "bin": "yes", "why": "The tape holds the boxes together."},
                  {"pic": "🥄", "label": "a plastic spoon pushed into dry clay", "bin": "no", "why": "Dry clay is hard. The spoon will not go in, and nothing holds it."},
                  {"pic": "🧻", "label": "a tube glued to a box, left to dry", "bin": "yes", "why": "When the glue dries, the tube stays on the box."},
              ]},
             "You worked out why things join, and why some will not."),

        step("refine", "Make it stand up", "🔧", "Sculpture mender", ["2TWA.03", "2R.02"],
             "These sculptures have a problem. Why did it happen? Which change fixes it? Tap one and see.",
             explain(
                 ["A sculpture has to stand up in the real world.", "When it falls, look for why."],
                 ["A leg that falls off was not scored and slipped.", "A tower that tips over needs a wider bottom.",
                  "A head that droops needs a thicker neck."],
                 ["Children add more clay everywhere.", "Fix the ONE thing that is wrong."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Omar's clay dog", "pic": "🐕", "fixedPic": "🐶", "problem": "A leg fell off when it dried.", "fixed": "All four legs stay on."},
                  "needs": "join",
                  "changes": [
                      change("score", "Score and slip the leg back on", "🍴", "join", "Scored and slipped, the leg stays on for good."),
                      change("paint", "Paint the dog brown", "🟫", "colour", "A brown dog, still with three legs."),
                      change("press", "Just press it back on, dry", "🤏", "worse", "Pressed on dry, it falls off again."),
                      change("tail", "Add a longer tail", "➰", "add", "A longer tail, and a leg still missing."),
                  ],
                  "why": "The leg was never really joined. Score and slip joins it for good."},
                 {"piece": {"title": "Priya's box tower", "pic": "🗼", "fixedPic": "🏯", "problem": "The tower keeps tipping over.", "fixed": "It stands tall and still."},
                  "needs": "base",
                  "changes": [
                      change("wide", "Put the biggest box at the bottom, with a stone inside it", "⬛", "base", "A wide bottom with a stone inside is heavy and steady. The tower stands up."),
                      change("taller", "Add another box on top", "⬆️", "worse", "Taller and even wobblier. It tips again."),
                      change("colour", "Paint it red", "🟥", "colour", "A red tower that still tips over."),
                      change("flag", "Stick a flag on top", "🚩", "add", "A flag on a tower that still falls."),
                  ],
                  "why": "A tower with a small bottom tips. A wide, heavy bottom keeps it up."},
                 {"piece": {"title": "Tomas's clay bird", "pic": "🐦", "fixedPic": "🦜", "problem": "Its head droops down to the table.", "fixed": "The bird holds its head up."},
                  "needs": "support",
                  "changes": [
                      change("neck", "Make the neck shorter and thicker", "💪", "support", "A short, thick neck holds the head up."),
                      change("head", "Make the head bigger", "🔴", "worse", "A bigger, heavier head droops even more."),
                      change("eyes", "Add two eyes", "👀", "add", "It can see now, but its head still droops."),
                      change("blue", "Paint it blue", "🟦", "colour", "A blue bird with a drooping head."),
                  ],
                  "why": "A thin neck cannot hold a heavy head. Shorter and thicker holds it up."},
             ]},
             "You found why three sculptures failed, and fixed each one."),

        step("choose", "What to build it from", "🧰", "Builder", ["2M.02", "2E.02"],
             "Each sculpture needs a different material. Which one would work? Tap one.",
             explain(
                 ["Every material does something different.", "Clay squashes and holds a shape. Boxes are light. Pipe cleaners bend."],
                 ["A tall, light tower wants boxes.", "A snake to hang up wants something bendy and light.",
                  "A shiny robot wants foil.", "A heavy bottom wants stones."],
                 ["Children use clay for everything.", "Choose the material that does the job."],
                 ["Read what it is for, then tap."]),
             {"materials": [
                 material("clay", "Clay", "🟤", ["squashy", "heavy"], "Clay is squashy, and heavy when you use a lot."),
                 material("boxes", "Cardboard boxes", "📦", ["light", "stiff"], "Boxes are light and stiff."),
                 material("pipe", "Pipe cleaners", "〰️", ["bendy", "light"], "Pipe cleaners are bendy and light."),
                 material("foil", "Foil", "🪙", ["shiny", "bendy"], "Foil is shiny, and you can squeeze it into shapes."),
                 material("stones", "Stones", "🪨", ["heavy", "hard"], "Stones are heavy and hard."),
              ],
              "rounds": [
                  {"purpose": "a tall, light tower", "needs": "stiff", "pic": "🗼", "why": "A tall tower needs stiff parts that do not bend: boxes."},
                  {"purpose": "a light, curly snake to hang from a string", "needs": "bendy", "pic": "🐍", "why": "A snake to hang up must be light and bendy: pipe cleaners or foil."},
                  {"purpose": "a shiny robot", "needs": "shiny", "pic": "🤖", "why": "A shiny robot wants foil."},
                  {"purpose": "a heavy bottom so it will not tip", "needs": "heavy", "pic": "⚓", "why": "Something heavy at the bottom keeps a sculpture up: stones or a lump of clay."},
              ]},
             "You chose the material for four sculptures."),

        step("source", "A clay head from long ago", "🗿", "Clay looker", ["2E.01", "2R.02"],
             "This clay head is drawn in the manner of heads made in Nigeria more than two thousand years ago. Tap the parts.",
             explain(
                 ["Long ago, in what is now Nigeria, people made heads from clay and fired them hard.", "Artists of the Nok culture made some of the oldest clay figures in West Africa."],
                 ["Tap the eyes. They were cut into the wet clay.", "Tap the hair. It was pressed in rows.",
                  "Tap the mouth and the ears."],
                 ["Children think the eyes were painted on.", "Look closely. They were cut and pierced."],
                 ["Tap three things and listen."]),
             {"scene": "terracotta", "need": 3, "caption": "Tap the eyes, the hair and the mouth.",
              "spots": [
                  spot("eyes", "the eyes", "Each eye was cut as an almond shape into the wet clay, with a small hole pierced for the middle.", 128, 104, "👁️"),
                  spot("hair", "the hair", "The hair was pressed into the clay in neat rows of lines, all the way over the top of the head.", 160, 48, "〰️"),
                  spot("mouth", "the mouth", "The mouth is open: a hole cut right into the clay.", 160, 170, "👄"),
                  spot("ears", "the ears", "The ears sit on the sides of the head, the same on both sides.", 218, 120, "👂"),
              ],
              "then": {"ask": "How did the maker make the eyes?",
                       "opts": [{"t": "cut almond shapes into the wet clay and pierced holes", "spot": "eyes"}, {"t": "painted them on with a brush"}, {"t": "printed them with a stamp"}],
                       "why": "Look at the eyes: they are cut into the clay, with a hole in the middle. They were shaped while the clay was wet."}},
             "You found how the clay head was made."),

        step("questions", "Sculpture spotter", "💬", "Sculpture spotter", ["2E.02", "2R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about sculpture and joining.", "You have met every one of them."],
                 ["Think about score and slip, what joins, and what makes a sculpture stand."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Sculpture", "items": [
                 q("What is slip?", "💧", "clay mixed with water until it is runny", ["a kind of paint", "a slippery floor"], "Slip is runny clay. It helps two pieces grip."),
                 q("A sculpture is something you can…", "🗽", "walk all the way round", ["only see from the front", "hang on a wall like a painting"], "A sculpture has a front, a back and sides."),
                 q("Which pair will NOT join?", "🪨", "two smooth pebbles", ["two boxes with tape", "scored clay with slip"], "Smooth pebbles have nothing to hold them together."),
                 q("A tower keeps tipping over. What fixes it?", "⬛", "a wide, heavy bottom", ["another box on top", "a flag"], "A wide, heavy bottom keeps it steady."),
             ]},
             "You know how sculptures are joined and made to stand."),

        step("quiz", "Show what you know", "⭐", "Star sculptor", ["2E.01", "2E.02", "2M.01", "2M.02", "2R.02", "2TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about sculptures, score and slip, what joins, the sculptures you fixed and the clay head."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which one is a sculpture?", "☃️", "a snowman", ["a painting", "a drawing"], "A snowman is made in the round. You can walk all round it."),
                 q("Scratching lines on clay before you join it is called…", "🍴", "scoring", ["printing", "weaving"], "Scoring makes rough lines that grip."),
                 q("Why will dry clay not join to wet clay?", "🏜️", "because dry clay has no water left to join with", ["because it is the wrong colour", "because it is too small"], "Clay joins while it is wet. Dry clay just cracks off."),
                 q("Why did Omar's clay dog lose a leg?", "🐕", "because the leg was not scored and slipped", ["because it was painted brown", "because the tail was too short"], "An unjoined leg falls off when the clay dries."),
                 q("Which material would make a light, curly snake to hang up?", "〰️", "pipe cleaners", ["stones", "cardboard boxes"], "Pipe cleaners are light and bend into curls."),
                 q("How were the eyes on the clay head made?", "👁️", "cut into the wet clay", ["painted on", "printed with a stamp"], "They were cut and pierced while the clay was wet."),
                 q("A bird's head droops. What fixes it?", "🐦", "a shorter, thicker neck", ["a bigger head", "blue paint"], "A thick neck holds a heavy head up."),
                 q("Where were the Nok clay heads made?", "🌍", "in what is now Nigeria", ["on the Moon", "in a factory"], "They were made in Nigeria more than two thousand years ago."),
             ]},
             "That is the whole lesson finished. You can join clay, and make a sculpture stand up."),
    ],
}


LESSON["about"] = [
    "Say what makes something a sculpture.",
    "Join two pieces of clay with score and slip.",
    "Work out why two things will or will not join.",
    "Fix a sculpture that falls apart or falls over.",
    "Find how a clay head from long ago was made.",
]

LESSON["lecture"] = [
    part("🗽", "In the round",
         "A painting is flat. You look at it from the front. A sculpture has a front, a back and sides. You can walk all the way round it. A clay pot, a statue, even a snowman is a sculpture."),
    part("🍴", "Score and slip",
         "Two pieces of clay pressed together can fall apart when they dry. So potters score them: they scratch both pieces. Then they add slip, which is runny clay. Press, smooth, and the join lasts."),
    part("❓", "Why won't it join?",
         "When two things will not join, ask why. Dry clay has no water to join with. Smooth pebbles have nothing to grip. Find the reason, and you will find the fix."),
    part("🗿", "Clay from long ago",
         "More than two thousand years ago, in what is now Nigeria, artists of the Nok culture made heads from clay. They cut the eyes, pressed in the hair, and fired the clay hard. Some are still here today."),
]

LESSON["words"] = [
    word("sculpture", "🗽", "Art you can walk all the way round.",
         ["I made a clay sculpture.", "The sculpture stands in the park."]),
    word("score", "🍴", "To scratch lines on clay so it will join.",
         ["Score both pieces first.", "I scored the clay with a fork."]),
    word("slip", "💧", "Clay mixed with water until it is runny.",
         ["Dab on some slip.", "The slip helps the clay join."]),
    word("model", "📦", "A small thing you make to show a bigger thing.",
         ["We built a model of a house.", "My model is made of boxes."]),
    word("base", "⬛", "The bottom part that a sculpture stands on.",
         ["A wide base stops it tipping.", "I made a heavy base."]),
    word("fire", "🔥", "To heat clay in a kiln, a special very hot oven, so it goes hard.",
         ["The clay head was fired.", "Fired clay is hard and strong."]),
]

LESSON["home"] = [
    home("Score and slip animal", "Air-drying clay, a fork, a little water in a cup, and a grown-up",
         ["Make a body from a ball of clay.", "Make legs, ears or a tail as separate pieces.",
          "Score both sides of each join with the fork, dab on a little clay mixed with water, then press and smooth.",
          "Let it dry for a day or two."],
         "Did every part stay on when it dried?"),
    home("Tallest tower", "Empty boxes and tubes, sticky tape, and a grown-up",
         ["Build the tallest tower you can.", "If it tips, try a wider, heavier box at the bottom.", "Tape the joins."],
         "What made your tower stand up?"),
    home("Snow or sand sculpture", "A day with snow, or a sandpit or beach, and a grown-up",
         ["Make a sculpture you can walk all round: an animal, a castle or a face.",
          "Walk round it. Does it look good from every side?"],
         "Which side of your sculpture do you like best?"),
]

LESSON["journal"] = {
    "changes": ["score and slip every join", "make the base wider", "add more detail", "make it taller", "keep it just as it is"],
}
