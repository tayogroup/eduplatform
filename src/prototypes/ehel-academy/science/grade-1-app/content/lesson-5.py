# -*- coding: utf-8 -*-
"""Lesson 5 - Pushes, Pulls and Floating.

0097 Stage 1 Forces and energy, all three: 1Pf.01 the movement of familiar
objects; 1Pf.02 pushes and pulls as forces; 1Pf.03 some objects float and
some sink; with 1TWSp.01, 1TWSp.02, 1TWSc.01, 1TWSc.03, 1TWSc.04, 1TWSc.05,
1TWSa.01 and 1SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "pushes-pulls-and-floating",
    "title": "Pushes, Pulls and Floating",
    "blurb": "See how things move, push a ball gently and hard, and drop eight things into a tank to find out which float and which sink.",
    "steps": [
        step("explore", "How does it move?", "⚽", "Movers", ["1Pf.01"],
             "Things move in different ways. Tap each one and hear the word for how it moves.",
             explain(
                 ["Things move in different ways, and there is a word for each way."],
                 ["A ball rolls.", "A swing swings backwards and forwards.", "A top spins round and round.",
                  "A snail slides slowly.", "A kite flies up in the wind.", "A door swings open on its hinges."],
                 ["Children say everything just moves.", "Scientists say how it moves: rolls, slides, spins, swings, bounces."],
                 ["Tap every picture and say the moving word out loud."]),
             {"items": [
                 {"pic": "⚽", "label": "ball", "sub": "rolls", "say": "A ball rolls along the ground, turning over and over."},
                 {"pic": "\U0001F3A0", "label": "swing", "sub": "swings", "say": "A swing swings backwards and forwards."},
                 {"pic": "\U0001F300", "label": "spinning top", "sub": "spins", "say": "A spinning top spins round and round on one point."},
                 {"pic": "\U0001F40C", "label": "snail", "sub": "slides", "say": "A snail slides slowly along on its foot."},
                 {"pic": "\U0001FA81", "label": "kite", "sub": "flies", "say": "A kite flies up when the wind pushes it."},
                 {"pic": "\U0001F3C0", "label": "basketball", "sub": "bounces", "say": "A basketball bounces up when it hits the ground."},
                 {"pic": "\U0001F6F7", "label": "sledge", "sub": "slides", "say": "A sledge slides down the slope without turning over."},
                 {"pic": "\U0001F6AA", "label": "door", "sub": "swings", "say": "A door swings open and shut on its hinges."},
             ], "need": 8},
             "Rolls, swings, spins, slides, flies, bounces. Moving words."),

        step("sort", "Push or pull?", "\U0001F5C2️", "Push or pull", ["1Pf.02", "1TWSc.01"],
             "A push moves a thing <b>away</b> from you. A pull brings it <b>towards</b> you. Which is this?",
             explain(
                 ["A push and a pull are both forces.", "A force is what makes something start moving, stop, or change direction."],
                 ["Kicking a ball sends it away from you: that is a push.", "Opening a drawer brings it towards you: that is a pull.",
                  "Pressing a doorbell: a push.", "Tugging a rope: a pull."],
                 ["Children think a push has to be hard.", "A gentle tap on a doorbell is still a push."],
                 ["Ask: does it go away from me, or come towards me?"]),
             {"ask": "Push, or pull?",
              "bins": [{"id": "push", "label": "Push", "pic": "\U0001F449"}, {"id": "pull", "label": "Pull", "pic": "\U0001F448"}],
              "items": [
                  {"pic": "⚽", "label": "kicking a ball", "bin": "push", "why": "Your foot pushes the ball away from you."},
                  {"pic": "\U0001F5C4️", "label": "opening a drawer", "bin": "pull", "why": "You pull the drawer towards you."},
                  {"pic": "\U0001F6CE️", "label": "pressing a doorbell", "bin": "push", "why": "Your finger pushes the button in."},
                  {"pic": "\U0001FAA2", "label": "tug of war", "bin": "pull", "why": "You pull the rope towards you."},
                  {"pic": "\U0001F6D2", "label": "pushing a trolley", "bin": "push", "why": "You push the trolley away, in front of you."},
                  {"pic": "\U0001F415", "label": "pulling a dog back on its lead", "bin": "pull", "why": "The lead pulls the dog back towards you."},
                  {"pic": "\U0001F3A0", "label": "pushing a swing", "bin": "push", "why": "You push the swing away and it swings back."},
                  {"pic": "\U0001F6AA", "label": "pulling a door open", "bin": "pull", "why": "You pull the door towards you to open it."},
              ]},
             "Pushes and pulls are forces. They make things move."),

        step("experiment", "Push gently, push hard", "\U0001F9EA", "Big push", ["1Pf.02", "1Pf.01", "1TWSp.02", "1TWSc.03", "1TWSa.01"],
             "Does a bigger push move the ball further? Predict, then push the ball two ways and count the steps.",
             explain(
                 ["A bigger push gives a bigger move.", "You can test that by pushing the same ball two ways and measuring how far it rolls."],
                 ["Predict first.", "Then push gently and count how many steps the ball rolls.", "Then push hard and count again.",
                  "The steps along the track are how we measure it."],
                 ["Children think a big ball always moves further than a small one.", "It is the size of the push that matters here, not the ball."],
                 ["Tap your prediction, then press both buttons and compare the steps."]),
             {"sim": "pushBall",
              "predict": {"ask": "What do you think a <b>hard</b> push will do, compared with a gentle one?",
                          "opts": [opt("The ball will roll further", True), opt("The ball will roll the same distance", False), opt("The ball will roll a shorter way", False)]},
              "runAsk": "Press <b>Push gently</b>, then <b>Push hard</b>. Count the steps each time.",
              "happened": {"ask": "What happened with the hard push?",
                           "opts": [opt("The ball rolled further, nine steps instead of three", True), opt("The ball rolled the same three steps", False), opt("The ball did not move", False)],
                           "why": "The gentle push moved the ball three steps. The hard push moved it nine. A bigger force, a bigger move."}},
             "A bigger push makes a bigger move."),

        step("demo", "Stop it, turn it", "\U0001F6D1", "Stop and turn", ["1Pf.01", "1Pf.02"],
             "Forces can also <b>stop</b> a moving thing or <b>change its direction</b>. Press <b>Next</b>.",
             explain(
                 ["A push or a pull can start a thing moving.", "It can also make it go faster, slow it down, stop it, or send it a new way."],
                 ["A ball rolls towards you.", "Put your hand in front and push back: it stops.",
                  "Tap it on the side as it rolls: it turns and goes a different way.", "Push it along as it rolls: it goes faster."],
                 ["Children think a moving ball stops on its own by magic.", "Something always pushes on it: your hand, the wall, or the rough ground rubbing."],
                 ["Press Next and watch what each push does."]),
             {"frames": [
                 {"pic": "⚽➡️", "cap": "A ball is rolling along.", "say": "A ball is rolling along."},
                 {"pic": "⚽✋", "cap": "Push back against it and it <b>stops</b>.", "say": "Put your hand in front and push back. It stops. A push can stop a moving thing.", "sound": "thud"},
                 {"pic": "⚽↗️", "cap": "Tap it on the side and it <b>changes direction</b>.", "say": "Tap the rolling ball on the side. It turns and goes a new way. A push can change direction.", "sound": "pop"},
                 {"pic": "⚽\U0001F4A8", "cap": "Push it along as it rolls and it goes <b>faster</b>.", "say": "Push it along as it rolls and it goes faster.", "sound": "boing"},
                 {"pic": "\U0001F9F6⚽", "cap": "Pull it back on a string and it comes <b>towards</b> you.", "say": "Tie a string on and pull. It comes towards you. A pull moves things too."},
             ]},
             "Forces start, stop, speed up, slow down and turn things."),

        step("predictEach", "Float or sink?", "\U0001F30A", "Float or sink", ["1Pf.03", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Will the %s float or sink? Predict, then drop it in the tank and see.",
             explain(
                 ["Some things float on top of water.", "Some things sink to the bottom.", "The only way to be sure is to try it."],
                 ["Look at the thing.", "Predict: float or sink?", "Then drop it in and watch.",
                  "An apple floats.", "A stone sinks.", "Sometimes a big thing floats and a small thing sinks, so predictions can surprise you."],
                 ["Children think heavy things always sink and light things always float.", "A big wooden log floats. A tiny coin sinks. Test, do not guess."],
                 ["Predict for each one, drop it in, and see if you were right."]),
             {"sim": "floatSink", "tryLabel": "Drop it in", "ask": "Will the %s float or sink?",
              "choices": [{"id": "float", "t": "Float", "pic": "⬆️"}, {"id": "sink", "t": "Sink", "pic": "⬇️"}],
              "items": [
                  {"pic": "\U0001F34E", "label": "apple", "answer": "float", "why": "An apple floats on the water."},
                  {"pic": "\U0001FAA8", "label": "stone", "answer": "sink", "why": "A stone sinks straight to the bottom."},
                  {"pic": "\U0001FAB5", "label": "wooden log", "answer": "float", "why": "Wood floats, even a big heavy log."},
                  {"pic": "\U0001F511", "label": "metal key", "answer": "sink", "why": "A metal key sinks, even though it is small."},
                  {"pic": "\U0001F343", "label": "leaf", "answer": "float", "why": "A leaf floats on top of the water."},
                  {"pic": "\U0001FA99", "label": "coin", "answer": "sink", "why": "A coin is metal. It sinks."},
                  {"pic": "\U0001F9F4", "label": "empty plastic bottle", "answer": "float", "why": "An empty bottle with its lid on floats. It is full of air."},
                  {"pic": "\U0001F9F1", "label": "brick", "answer": "sink", "why": "A brick sinks to the bottom."},
              ]},
             "Some things float, some things sink, and testing is how you know."),

        step("record", "Record the results", "\U0001F4DD", "Results table", ["1TWSc.05", "1Pf.03"],
             "Write your results in the table. Did <b>%s</b> float or sink?",
             explain(
                 ["A results table lets you see all the answers at once, and lets other people check your work."],
                 ["Think back to the tank.", "Apple: float.", "Stone: sink.", "Leaf: float.", "Coin: sink.", "Tap each row and pick what happened."],
                 ["Children write down their prediction instead of the result.", "The table holds what happened."],
                 ["Fill in every row."]),
             {"ask": "Did %s float or sink?",
              "columns": ["Thing", "Float or sink?"],
              "rows": [
                  {"pic": "\U0001F34E", "label": "the apple", "answer": "float", "why": "the apple floated."},
                  {"pic": "\U0001FAA8", "label": "the stone", "answer": "sink", "why": "the stone sank."},
                  {"pic": "\U0001F343", "label": "the leaf", "answer": "float", "why": "the leaf floated."},
                  {"pic": "\U0001FA99", "label": "the coin", "answer": "sink", "why": "the coin sank."},
                  {"pic": "\U0001FAB5", "label": "the log", "answer": "float", "why": "the wooden log floated."},
              ],
              "choices": [{"id": "float", "t": "Float", "pic": "⬆️"}, {"id": "sink", "t": "Sink", "pic": "⬇️"}]},
             "Your results are written down."),

        step("context", "Pushes and pulls all around us", "\U0001F6B2", "Everyday forces", ["1SIC.02", "1Pf.02"],
             "Science explains how the things we use work. Tap each one.",
             explain(
                 ["Every machine you use works with pushes and pulls."],
                 ["On a bicycle your feet push the pedals round, and your hands pull the brakes to stop.",
                  "A wheelbarrow is pushed.", "A wagon is pulled.", "A boat floats because of what you just found out."],
                 [],
                 ["Tap each one and listen for the push or the pull inside it."]),
             {"items": [
                 {"pic": "\U0001F6B2", "label": "bicycle", "say": "Your feet push the pedals to go. Your hands pull the brakes to stop. Push to go, pull to stop."},
                 {"pic": "\U0001F6D2", "label": "shopping trolley", "say": "You push the trolley along in front of you. A bigger push and it goes faster."},
                 {"pic": "\U0001F6F6", "label": "boat", "say": "A boat floats because it is shaped to sit on top of the water, like the empty bottle."},
                 {"pic": "\U0001FA81", "label": "kite", "say": "The wind pushes the kite up, and the string pulls it back so it does not fly away."},
             ], "need": 4,
              "then": {"ask": "On a bicycle, what do your hands do to stop?",
                       "opts": [opt("Pull the brakes", True), opt("Push the pedals", False), opt("Pull the wheels", False)],
                       "why": "Pulling the brake lever makes the brakes push on the wheel and stop it."}},
             "Pushes and pulls are inside everything that moves."),

        step("ask", "Ask a question about the sea", "❓", "Asked why", ["1TWSp.01"],
             "Look at the boat. Tap a question you would like to ask.",
             explain(
                 ["Big questions often start small, by looking at something ordinary, like a boat on the water."],
                 ["Why does a heavy boat float? Would it float with more people in it? What if it was made of stone?",
                  "You can find out with a bowl of water and some things to try."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F6F6",
              "questions": ["Why does a heavy boat float?", "Would a boat made of stone float?", "How many people can a boat carry before it sinks?"],
              "findOut": {"ask": "How could we find out?",
                          "opts": [opt("Make little boats and test them in a bowl of water", True), opt("Guess", False), opt("Ask the boat", False)],
                          "why": "Testing in a bowl of water is an experiment. That is how scientists find out."}},
             "Ask, then test. That is what scientists do."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Pf.01", "1Pf.02", "1Pf.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Away from you is a push; towards you is a pull.", "If it asks about floating, remember the tank."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Kicking a ball away from you is a...", "⚽", "push", ["pull", "float", "spin"], "Your foot pushes the ball away. That is a push."),
                 q("Opening a drawer towards you is a...", "\U0001F5C4️", "pull", ["push", "bounce", "roll"], "You pull the drawer towards you."),
                 q("A push or a pull is called a...", "\U0001F4AA", "force", ["material", "sense", "plant"], "Pushes and pulls are forces."),
                 q("You push the ball harder. It goes...", "⚽", "further", ["a shorter way", "the same distance", "backwards"], "A bigger push, a bigger move. You measured it in steps."),
                 q("Which of these sinks in water?", "\U0001F30A", "a stone", ["an apple", "a leaf", "a wooden log"], "A stone sank straight to the bottom of the tank."),
                 q("Which of these floats?", "\U0001F30A", "an apple", ["a coin", "a brick", "a key"], "The apple floated on top of the water."),
                 q("A ball rolls towards you. You put your hand in front. What happens?", "✋", "it stops", ["it goes faster", "it floats", "it spins"], "A push back against a moving thing stops it."),
                 q("How does a spinning top move?", "\U0001F300", "it spins round and round", ["it slides", "it bounces", "it flies"], "A top spins."),
                 q("Omar pushed the same ball twice. It rolled further the second time. Why?", "⚽", "He pushed it harder the second time", ["The ball changed colour", "The ball was tired the first time"], "It was the same ball, so the push made the difference. A bigger push makes a bigger move."),
             ]},
             "That is the whole lesson finished. You know pushes, pulls, floating and sinking."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say how things move: roll, swing, spin, slide, bounce.",
    "Tell a push from a pull.",
    "Say what a bigger push does.",
    "Predict and test which things float and which sink.",
]

LESSON["warmup"] = [
    q("What happens to a ball when you kick it?", "⚽", "it moves away from you", ["it stays still", "it comes towards you"], "A kick is a push. It sends the ball away from you."),
    q("What does a boat do on the water?", "\U0001F6F6", "it floats", ["it sinks"], "A boat floats on top of the water."),
]

LESSON["lecture"] = [
    part("\u26BD", "Pushes and pulls",
         "A push moves something away from you. A pull moves it towards you. Kicking a ball is a push. Opening a drawer is a pull. Pushes and pulls are forces."),
    part("\U0001F4A8", "A bigger push",
         "Push a ball gently and it rolls a little way. Push it hard and it rolls a long way. A bigger push makes a bigger move."),
    part("\U0001F6D1", "Stop it, turn it",
         "A push can start something moving. A push can stop it too. Put your hand in front of a rolling ball and it stops. Tap it on the side and it turns."),
    part("\U0001F34E", "Float or sink",
         "Drop an apple into water and it floats on top. Drop a stone and it sinks to the bottom. You cannot always tell by looking. You have to test."),
    part("\U0001F6B2", "Forces all around",
         "A bicycle moves because you push the pedals. A boat floats because the water pushes up on it. Pushes and pulls are inside everything that moves."),
]

LESSON["words"] = [
    word("push", "\U0001F450", "A force that moves something away from you.",
         ["I push the trolley.", "Kicking a ball is a push."]),
    word("pull", "\U0001FAA2", "A force that moves something towards you.",
         ["I pull the drawer open.", "Tug of war is a pull."]),
    word("force", "\U0001F4AA\U0001F3FE", "A push or a pull. It makes things start, stop, speed up, slow down or turn.",
         ["A force made the ball move.", "A bigger force, a bigger move."]),
    word("float", "\U0001F34E", "To stay on top of the water.",
         ["An apple floats.", "The boat floats on the sea."]),
    word("sink", "\U0001FAA8", "To go down under the water.",
         ["A stone sinks.", "The key sank to the bottom."]),
    word("predict", "\U0001F52E", "To say what you think will happen, before you test it.",
         ["I predict the leaf will float.", "Predict first, then test."]),
    word("roll", "\u26BD", "To move by turning over and over.",
         ["The ball rolls down the hill.", "Round things roll."]),
]

LESSON["home"] = [
    home("Float or sink in the sink", "A bowl of water and eight things from the kitchen: an apple, a stone, a coin, a cork, a leaf, a spoon, a lid, a grape",
         ["Do this with a grown-up. Before each one goes in, say: float or sink.",
          "Drop it in gently and watch.",
          "Put the floaters in one pile and the sinkers in another."],
         "Which prediction was wrong? Heavy things do not always sink."),
    home("Gentle push, hard push", "A ball, a smooth floor, some tape",
         ["Stick tape marks on the floor a step apart.",
          "Push the ball gently and count the marks it passes.",
          "Push it hard and count again."],
         "How many more marks the hard push passed."),
    home("Push or pull hunt", "Paper and a pencil",
         ["Walk round the house and find ten things you push or pull: doors, drawers, taps, switches.",
          "Draw each one.",
          "Write push or pull next to it."],
         "Some things need a push and a pull. A drawer is both."),
]
