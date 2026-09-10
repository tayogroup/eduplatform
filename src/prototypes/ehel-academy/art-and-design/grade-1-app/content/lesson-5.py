# -*- coding: utf-8 -*-
"""Lesson 5 - Make It Stick.

0067 Stage 1: E.02 core processes "such as joining and connecting materials
in model making" demonstrated; M.01 basic skills in using glue, tape, string
and clay; M.02 select the join for a purpose (computed: the join's property
is what the job needs); R.02 "Why wouldn't those two items join together?" -
Cambridge's own question - answered by trying a change and seeing what it
did; TWA.03 review and refine a piece with a problem.
"""
from _kit import explain, step, opt, q, part, word, home, material, change

LESSON = {
    "slug": "make-it-stick",
    "title": "Make It Stick",
    "blurb": "See the ways things join, meet the joining tools, pick the right join for the job, fix a model that will not stick, and make a clay pot in the right order.",
    "steps": [
        step("demo", "Ways to join", "🔗", "Join watcher", ["1E.02", "1M.01"],
             "There are lots of ways to join two things. Press <b>Next</b> and watch.",
             explain(
                 ["When you make a model, you have to join things together.", "There is more than one way."],
                 ["Glue sticks flat things.", "Tape is quick and strong.", "String ties and hangs.",
                  "Clay presses together when it is wet.", "Card can slot into card.", "Paper folds."],
                 ["Children think glue does everything.", "Glue does not hold a heavy thing, and it does not tie."],
                 ["Press Next and watch each join."]),
             {"frames": [
                 {"pic": "🧴", "cap": "<b>Glue</b> sticks two flat things together. Spread it thin and press.", "say": "Glue sticks two flat things together. Spread it thin and press.", "sound": "squelch"},
                 {"pic": "🩹", "cap": "<b>Tape</b> is quick and strong. Stick it over the join.", "say": "Tape is quick and strong. Stick it over the join.", "sound": "rustle"},
                 {"pic": "🧵", "cap": "<b>String</b> ties things, and hangs them up.", "say": "String ties things, and hangs them up.", "sound": "swish"},
                 {"pic": "🏺", "cap": "Wet <b>clay</b> presses onto wet clay. Smooth the join with your thumb.", "say": "Wet clay presses onto wet clay. Smooth the join with your thumb.", "sound": "squelch"},
                 {"pic": "🃏", "cap": "Card can <b>slot</b> into card, with a little cut in each.", "say": "Card can slot into card, with a little cut in each.", "sound": "click"},
                 {"pic": "📄", "cap": "Paper <b>folds</b>. A fold is a join with no glue at all.", "say": "Paper folds. A fold is a join with no glue at all.", "sound": "pop"},
             ]},
             "Glue, tape, string, clay, slot and fold. Six ways to join."),

        step("explore", "Joining tools", "🧰", "Tool box", ["1E.02"],
             "These are the tools for joining and cutting. Tap each one to hear what it does.",
             explain(
                 ["Every joining job has a tool.", "And one tool does not join at all: it cuts."],
                 ["A glue stick.", "Sticky tape.", "String.", "A split pin, for things that turn.", "Clay.", "Scissors, which cut."],
                 ["Children walk while holding scissors.", "Scissors are for cutting, and you sit down to use them."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🧴", "label": "glue stick", "say": "A glue stick. Rub it on paper and press. Good for flat things.", "sound": "squelch"},
                 {"pic": "🩹", "label": "sticky tape", "say": "Sticky tape. Quick and strong, on the outside of a join.", "sound": "rustle"},
                 {"pic": "🧵", "label": "string", "say": "String. Ties two things together, or hangs something up.", "sound": "swish"},
                 {"pic": "📌", "label": "split pin", "say": "A split pin. Push it through two pieces of card and they can turn, like a wheel.", "sound": "click"},
                 {"pic": "🏺", "label": "clay", "say": "Clay. Wet clay sticks to wet clay when you press and smooth it.", "sound": "squelch"},
                 {"pic": "✂️", "label": "scissors", "say": "Scissors. They cut. Sit down, and never walk while holding them.", "sound": "click"},
             ], "need": 6,
              "then": {"ask": "Which tool CUTS instead of joining?",
                       "opts": [opt("scissors", True), opt("glue stick", False), opt("string", False)],
                       "why": "Scissors cut. Glue and string join."}},
             "Six tools in the box. Five join, one cuts."),

        step("choose", "Which join for the job?", "🔧", "Join chooser", ["1M.02", "1M.01"],
             "You want to make something. Which join would work? Tap it.",
             explain(
                 ["Choose the join for the job.", "A flat paper join wants glue. A thing that hangs wants string."],
                 ["A paper chain is paper stuck flat: glue.", "A mobile hangs: string.", "A clay handle joins clay: wet clay.",
                  "Two pages held while the glue dries: a paper clip."],
                 ["Children reach for tape every time.", "Tape shows. Sometimes a neater join is better."],
                 ["Read what you want to make, then tap the join."]),
             {"materials": [
                 material("glue", "Glue", "🧴", ["paper", "flat"], "Glue sticks paper flat."),
                 material("tape", "Sticky tape", "🩹", ["paper", "quick"], "Tape sticks paper, quickly."),
                 material("string", "String", "🧵", ["hang", "tie"], "String ties, and hangs things up."),
                 material("clay", "Wet clay", "🏺", ["clay", "press"], "Wet clay presses onto wet clay."),
                 material("clip", "Paper clip", "📎", ["hold", "quick"], "A paper clip holds two pages together for a while."),
              ],
              "rounds": [
                  {"purpose": "a paper chain", "needs": "paper", "pic": "🔗", "why": "Paper stuck to paper. Glue or tape will do it."},
                  {"purpose": "a mobile that hangs from the ceiling", "needs": "hang", "pic": "🪁", "why": "To hang, it needs string."},
                  {"purpose": "a handle on a clay pot", "needs": "clay", "pic": "🏺", "why": "Clay joins clay when both are wet."},
                  {"purpose": "two pages held while the glue dries", "needs": "hold", "pic": "📄", "why": "A paper clip holds them, and comes off again."},
              ]},
             "You chose the right join for four jobs."),

        step("refine", "Why won't it join?", "🤔", "Model mender", ["1TWA.03", "1R.02"],
             "Something has gone wrong with the model. What could you change to fix it? Tap one and see.",
             explain(
                 ["Sometimes a model does not work the first time.", "That is normal. Artists look, think, and change one thing."],
                 ["The wheels fall off the car. Is it the colour? No. Is it the glue? Yes.",
                  "Try a change. If it did not fix it, try another. Every try teaches you something."],
                 ["Children throw the model away.", "Do not throw it away. Change one thing."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "The box car", "pic": "🚗", "fixedPic": "🏎️", "problem": "The wheels keep falling off.", "fixed": "The wheels stay on!"},
                  "needs": "stick",
                  "changes": [
                      change("glue", "Use glue instead of a drop of water", "🧴", "stick", "Glue holds the wheels on. Water never could."),
                      change("paint", "Paint the wheels red", "🎨", "colour", "The wheels are red now. And they still fall off."),
                      change("bigger", "Make the wheels bigger", "⭕", "size", "Bigger wheels. They fall off just the same."),
                      change("push", "Push the car faster", "💨", "speed", "It went faster, and the wheels flew off even sooner."),
                  ],
                  "why": "The wheels were not stuck on. Only glue fixes that."},
                 {"piece": {"title": "The clay pot", "scene": "claypot", "state": "cracked", "fixedState": "smooth", "problem": "A crack has opened in the side.", "fixed": "The crack is gone."},
                  "needs": "smooth",
                  "changes": [
                      change("smooth", "Wet your fingers and smooth the crack", "💧", "smooth", "Wet clay closes over the crack when you smooth it."),
                      change("squash", "Squash the pot flat", "👊", "worse", "Now it is not a pot at all."),
                      change("paint", "Paint over the crack", "🎨", "colour", "Painted, and still cracked underneath."),
                      change("lid", "Add a lid", "🫖", "add", "A lid on a cracked pot. Still cracked."),
                  ],
                  "why": "Clay mends when it is wet and smoothed. Paint only hides it."},
                 {"piece": {"title": "The paper crown", "pic": "👑", "fixedPic": "🤴", "problem": "It is too small for your head.", "fixed": "It fits!"},
                  "needs": "bigger",
                  "changes": [
                      change("strip", "Add a longer strip of paper", "📏", "bigger", "A longer strip goes all the way round your head."),
                      change("cut", "Cut it shorter", "✂️", "worse", "Shorter. Now it is even smaller."),
                      change("gold", "Colour it gold", "🟨", "colour", "Gold! And still too small."),
                      change("fold", "Fold it in half", "📄", "smaller", "Folded. Half the size. That is the wrong way."),
                  ],
                  "why": "Too small needs bigger. A longer strip is the change that does that."},
             ]},
             "You fixed three models by changing the right thing."),

        step("order", "Make a clay pot, in order", "🏺", "Pot maker", ["1M.01", "1E.02"],
             "A clay pot is made in steps. Tap them in the order you would do them.",
             explain(
                 ["A pinch pot is the first pot every potter makes.", "The steps go in an order."],
                 ["First roll the clay into a ball.", "Push your thumb into the middle.", "Pinch the sides up, turning it round.",
                  "Smooth it with wet fingers.", "Let it dry."],
                 ["Children pinch before they push.", "Thumb in first, then pinch."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "⚪", "label": "roll a ball", "say": "First, roll the clay into a smooth ball."},
                 {"pic": "👍", "label": "push your thumb in", "say": "Push your thumb into the middle of the ball."},
                 {"pic": "🤏", "label": "pinch the sides up", "say": "Pinch the sides up, turning the pot round and round."},
                 {"pic": "💧", "label": "smooth it with wet fingers", "say": "Smooth it with wet fingers so there are no cracks."},
                 {"pic": "☀️", "label": "let it dry", "say": "Let it dry in a safe place."},
             ]},
             "Ball, thumb, pinch, smooth, dry. That is a pinch pot."),

        step("questions", "Join quiz", "💬", "Join spotter", ["1E.02", "1M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about joining, and you have seen every join."],
                 ["Think about the ways to join, the tools, and the models you fixed."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Joining", "items": [
                 q("Which join hangs a mobile up?", "🪁", "string", ["glue", "clay"], "String hangs things."),
                 q("Wet clay sticks to…", "🏺", "wet clay", ["dry paper", "glass"], "Wet clay presses onto wet clay."),
                 q("The wheels fell off the car. What was wrong?", "🚗", "they were not stuck on", ["they were the wrong colour", "they were too fast"], "Only glue fixed it, so the join was the problem."),
                 q("Which tool cuts?", "✂️", "scissors", ["a glue stick", "string"], "Scissors cut. The rest join."),
             ]},
             "You know your joins."),

        step("quiz", "Show what you know", "⭐", "Star model maker", ["1E.02", "1M.01", "1M.02", "1R.02", "1TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the joins, the tools, the choosing, the mending and the pot."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Glue is best for…", "🧴", "sticking flat things like paper", ["hanging a mobile", "cutting card"], "Glue sticks flat things."),
                 q("Which join lets two pieces of card turn, like a wheel?", "📌", "a split pin", ["glue", "a fold"], "A split pin goes through both and lets them turn."),
                 q("What do you do with scissors?", "✂️", "sit down and cut", ["walk about with them", "glue with them"], "Scissors cut, and you sit down to use them."),
                 q("The pot cracked. What fixed it?", "🏺", "wet fingers, smoothing the crack", ["painting over it", "adding a lid"], "Wet clay mends when it is smoothed."),
                 q("The crown was too small. What fixed it?", "👑", "a longer strip of paper", ["cutting it shorter", "colouring it gold"], "Too small needs bigger."),
                 q("What is the FIRST step of a pinch pot?", "⚪", "roll a ball", ["let it dry", "pinch the sides"], "Roll the ball first, then thumb in, then pinch."),
                 q("When a model does not work, an artist…", "🤔", "changes one thing and tries again", ["throws it away", "hides it"], "Look, think, change one thing, try again."),
                 q("A fold is…", "📄", "a join with no glue", ["a kind of paint", "a colour"], "Paper folds, and the fold holds."),
             ]},
             "That is the whole lesson finished. You can join things, and mend them when they will not."),
    ],
}


LESSON["about"] = [
    "Name six ways to join things: glue, tape, string, clay, slot and fold.",
    "Use the joining tools safely, and sit down with scissors.",
    "Choose the right join for the job.",
    "Say why a model will not join, and change one thing to fix it.",
    "Make a pinch pot, in the right order.",
]

LESSON["lecture"] = [
    part("🔗", "Joining",
         "A model is lots of pieces joined together. Glue sticks flat things. Tape is quick and strong. String ties and hangs. Wet clay presses onto wet clay. Card slots into card. Paper folds. Six joins, and each one is best at something."),
    part("🧰", "The tools",
         "A glue stick, sticky tape, string, a split pin, clay and scissors. The scissors do not join, they cut. You sit down to use them, and you never walk while holding them. That is the first rule of the art room."),
    part("🤔", "Why won't it join?",
         "Sometimes a join does not hold. The wheels fall off. The pot cracks. An artist does not throw it away. They look, think about why, and change one thing. If that did not fix it, they change another. Every try teaches you something."),
    part("🏺", "A pinch pot",
         "Roll a ball of clay. Push your thumb into the middle. Pinch the sides up, turning it round and round. Smooth it with wet fingers. Let it dry. That is the first pot every potter makes."),
]

LESSON["words"] = [
    word("join", "🔗", "To fix two things together.",
         ["Glue can join paper.", "How will you join the wheels?"]),
    word("glue", "🧴", "Sticky stuff that holds flat things together.",
         ["Spread the glue thin.", "The glue is dry now."]),
    word("model", "🚗", "A small thing you make to look like a bigger thing.",
         ["I made a model car.", "The model is made of boxes."]),
    word("clay", "🏺", "Soft earth you can shape, that goes hard when it dries.",
         ["Wet clay is squashy.", "I made a pot from clay."]),
    word("fold", "📄", "To bend paper over so it stays bent.",
         ["Fold the paper in half.", "A fold is a join with no glue."]),
    word("mend", "🔧", "To fix something that has gone wrong.",
         ["I mended the crack.", "Let us mend the car."]),
]

LESSON["home"] = [
    home("A box model", "Empty boxes, tubes, bottle tops, glue, tape and a grown-up",
         ["Choose a box for the body of a car, a house or an animal.", "Try to join the small parts on with glue. If they fall off, try tape.",
          "Say which join worked for which part."],
         "Which part was hardest to join? What did you change?"),
    home("A pinch pot", "A lump of clay or salt dough, and a little water",
         ["Roll a ball. Push your thumb in. Pinch the sides up, turning it round.", "Smooth it with wet fingers.",
          "Let it dry somewhere safe for two days."],
         "Did any cracks open? What did you do about them?"),
    home("A paper chain", "Strips of coloured paper and a glue stick",
         ["Make a loop with the first strip and glue the ends.", "Thread the next strip through the loop and glue it.",
          "Keep going until the chain reaches across the room."],
         "Did the glue hold? What happened if you did not press?"),
]

LESSON["journal"] = {
    "changes": ["use tape as well as glue", "make the pot bigger", "add wheels that turn", "smooth the clay more", "keep it just as it is"],
}
