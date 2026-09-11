# -*- coding: utf-8 -*-
"""Lesson 6 - Forces Change Things.

0097 Stage 2 Forces and energy, all three: 2Pf.01 forces change movement;
2Pf.02 forces change shape; 2Pf.03 things only speed up, slow down or turn
when something makes them; with 2TWSp.02, 2TWSa.01, 2TWSa.02, 2TWSa.03,
2TWSc.01, 2TWSc.03 and 2TWSc.06.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "forces-change-things",
    "title": "Forces Change Things",
    "blurb": "Push a toy car three ways and graph how far it goes, squash and stretch things to change their shape, and find out that nothing speeds up or stops by itself.",
    "steps": [
        step("demo", "A force changes how things move", "\U0001F4AA", "Forces move", ["2Pf.01", "2Pf.03"],
             "A push or a pull is a <b>force</b>. Press <b>Next</b> to see five things a force can do to a moving thing.",
             explain(
                 ["A force is a push or a pull.", "A force can start a thing moving, make it go faster, slow it down, stop it, or turn it."],
                 ["A still ball: push it and it starts.", "A rolling ball: push it along and it goes faster.", "Push against it and it slows and stops.", "Tap its side and it turns."],
                 ["Children think a rolling ball just stops by itself.", "Something always slows it: the ground rubbing on it, or a wall."],
                 ["Press Next and name what the force did each time."]),
             {"frames": [
                 {"pic": "⚽", "cap": "A still ball. Nothing happens until a force acts.", "say": "A still ball. It will sit there for ever unless a force acts on it."},
                 {"pic": "\U0001F9B6⚽➡️", "cap": "A kick: the force <b>starts</b> it moving.", "say": "A kick. The force starts the ball moving.", "sound": "thud"},
                 {"pic": "⚽\U0001F4A8", "cap": "Push it along as it rolls: it goes <b>faster</b>.", "say": "Push it along while it rolls and it goes faster."},
                 {"pic": "⚽✋", "cap": "Push back against it: it <b>slows</b> and <b>stops</b>.", "say": "Push back against it and it slows down and stops.", "sound": "thud"},
                 {"pic": "⚽↗️", "cap": "Tap its side: it <b>turns</b>.", "say": "Tap it on the side and it changes direction.", "sound": "pop"},
                 {"pic": "\U0001F9F6⚽", "cap": "A pull on a string: it comes <b>towards</b> you.", "say": "A pull on a string brings it towards you. Pushes and pulls are both forces, and forces change movement."},
             ]},
             "A force can start, speed up, slow, stop or turn a thing."),

        step("experiment", "Gentle, medium, hard", "\U0001F9EA", "Push test", ["2Pf.01", "2TWSp.02", "2TWSa.01", "2TWSc.03"],
             "Does a bigger push move the toy car further? Predict, then try all three pushes and count the steps.",
             explain(
                 ["The size of the force changes how far the thing moves.", "You can test it by pushing the same toy car three ways and measuring in steps."],
                 ["Predict.", "Give it a gentle push and count the steps.", "Give it a medium push and count again.", "Give it a hard push and count again.", "Compare."],
                 ["Children think a heavier car goes further than a lighter one whatever the push.", "Here it is the same car, so only the push changes."],
                 ["Tap your prediction, press all three buttons, and compare the steps."]),
             {"sim": "pushBall",
              "thing": "\U0001F697",
              "pushes": [
                  {"label": "Gentle push", "to": 3, "say": "A gentle push. The car rolled three steps and stopped."},
                  {"label": "Medium push", "to": 6, "say": "A medium push. The car rolled six steps."},
                  {"label": "Hard push", "to": 9, "say": "A hard push! The car rolled nine steps. The bigger the push, the further it goes."},
              ],
              "predict": {"ask": "What will a <b>hard</b> push do, compared with a gentle one?",
                          "opts": [opt("Move the car further", True), opt("Move it the same distance", False), opt("Move it a shorter way", False)]},
              "runAsk": "Press all three pushes: gentle, medium, then hard. Count the steps each time.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The harder the push, the further the car went: three steps, then six, then nine", True), opt("Every push moved it three steps", False), opt("The gentle push moved it furthest", False)],
                           "why": "Gentle: three steps. Medium: six. Hard: nine. A bigger force, a bigger change in movement."}},
             "A bigger push, a bigger move."),

        step("record", "Record the pushes", "\U0001F4DD", "Push table", ["2TWSc.06"],
             "Put the results in the table. How far did the car go after a <b>%s</b>?",
             explain(
                 ["A results table puts each push beside how far the car went."],
                 ["A gentle push moved it three steps.", "A medium push moved it six.", "A hard push moved it nine."],
                 [],
                 ["Fill in each row."]),
             {"ask": "How far did the car go after a %s?",
              "columns": ["Push", "Steps rolled"],
              "rows": [
                  {"pic": "\U0001F449", "label": "gentle push", "answer": "3", "why": "the gentle push rolled the car three steps."},
                  {"pic": "\U0001F44A", "label": "medium push", "answer": "6", "why": "the medium push rolled the car six steps, between the other two."},
                  {"pic": "\U0001F4A5", "label": "hard push", "answer": "9", "why": "the hard push rolled it nine steps."},
              ],
              "choices": [{"id": "3", "t": "3 steps", "pic": "3️⃣"}, {"id": "6", "t": "6 steps", "pic": "6️⃣"}, {"id": "9", "t": "9 steps", "pic": "9️⃣"}]},
             "Three pushes, three distances, in a table."),

        step("graph", "Graph the pushes", "\U0001F4CA", "Push graph", ["2TWSa.03", "2TWSa.02"],
             "Build a block graph from your table: one block for each step the car rolled. Then read the pattern.",
             explain(
                 ["A block graph shows the pattern in your results.", "Here the columns go up in steps as the push gets bigger. That is an increasing pattern."],
                 ["Three blocks for the gentle push.", "Six for medium.", "Nine for hard.", "Look at the shape: each column is taller than the last."],
                 ["Children see three columns and stop.", "The pattern is in how they change from left to right."],
                 ["Build the three columns, then say what the pattern is."]),
             {"columns_label": "Push", "value_label": "Steps", "unit": "steps",
              "columns": [
                  {"pic": "\U0001F449", "label": "gentle", "value": 3},
                  {"pic": "\U0001F44A", "label": "medium", "value": 6},
                  {"pic": "\U0001F4A5", "label": "hard", "value": 9},
              ],
              "pattern": {"ask": "What is the pattern in your graph?",
                          "opts": [opt("The bigger the push, the further the car goes: the columns go up", True), opt("The columns all stay the same", False), opt("The bigger the push, the shorter the roll", False)],
                          "why": "Each column is taller than the last. An increasing pattern: bigger push, further roll."}},
             "An increasing pattern: bigger push, further roll."),

        step("experiment", "A force changes shape too", "\U0001F9EA", "Shape changer", ["2Pf.02", "2TWSp.02", "2TWSa.01"],
             "Forces can change the <b>shape</b> of a thing. Predict, then squash, bend, twist and stretch.",
             explain(
                 ["A force does not only move things. Pressing, pulling, bending and twisting are forces too, and they can change a thing's shape."],
                 ["Squash the sponge: your push changes its shape, and it springs back when you let go.",
                  "Bend the paperclip: your force changes its shape, and it stays bent.",
                  "The wooden block: your force is not big enough to change it."],
                 ["Children think the wooden block did not feel a force.", "It did; the force was just too small to change its shape."],
                 ["Tap your prediction, then try two actions on each thing."]),
             {"sim": "shapeChange",
              "things": [
                  {"id": "sponge", "pic": "\U0001F9FD", "label": "a sponge", "changes": True,
                   "says": {"squash": "Squashed flat! Let go, and it springs back.", "bend": "It bends easily, then springs back.",
                            "twist": "It twists round, then untwists.", "stretch": "It stretches a little, then springs back."}},
                  {"id": "clip", "pic": "\U0001F4CE", "label": "a metal paperclip", "changes": True,
                   "says": {"squash": "It squeezed closer together, and it stays that way.", "bend": "It bent, and it stays bent!",
                            "twist": "It twisted out of shape, and it stays twisted.", "stretch": "It pulled out longer, and it stays that way."}},
                  {"id": "block", "pic": "\U0001FAB5", "label": "a wooden block", "changes": False,
                   "says": {"squash": "Nothing happened. The wood kept its shape.", "bend": "It will not bend.",
                            "twist": "It will not twist.", "stretch": "It will not stretch."}},
              ],
              "predict": {"ask": "Which thing will your push and pull change the shape of <b>most</b>?",
                          "opts": [opt("The sponge", True), opt("The wooden block", False), opt("None of them", False)]},
              "runAsk": "Press two actions on each thing. Watch which shapes change.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The sponge and the paperclip changed shape; the wooden block did not", True), opt("Everything changed shape the same", False), opt("Nothing changed", False)],
                           "why": "The sponge changed shape and sprang back. The paperclip changed shape and stayed bent. The wood needs a far bigger force than a hand can give."}},
             "Forces change shape as well as movement."),

        step("sort", "Movement, or shape?", "\U0001F5C2️", "Force sorter", ["2Pf.01", "2Pf.02", "2TWSc.01"],
             "Does this force change how the thing <b>moves</b>, or its <b>shape</b>? Tap the bin.",
             explain(
                 ["A force can change movement, or shape, or both."],
                 ["Kicking a ball: movement.", "Squeezing a sponge: shape.", "Pulling a sledge: movement.", "Stretching a band: shape."],
                 ["Children say squashing the ball changes its movement because it wobbles.", "The big change is its shape."],
                 ["Ask: did the thing go somewhere, or did it change how it looks?"]),
             {"ask": "Changes movement, or changes shape?",
              "bins": [{"id": "move", "label": "Changes movement", "pic": "➡️"}, {"id": "shape", "label": "Changes shape", "pic": "\U0001F7E4"}],
              "items": [
                  {"pic": "⚽", "label": "kicking a ball", "bin": "move", "why": "The kick sends the ball moving."},
                  {"pic": "\U0001F9FD", "label": "squeezing a sponge", "bin": "shape", "why": "The squeeze changes the sponge's shape."},
                  {"pic": "\U0001F6F7", "label": "pulling a sledge", "bin": "move", "why": "The pull moves the sledge along."},
                  {"pic": "➰", "label": "stretching an elastic band", "bin": "shape", "why": "Stretching changes its shape."},
                  {"pic": "\U0001F6D1", "label": "catching a ball", "bin": "move", "why": "Your hands stop the ball moving."},
                  {"pic": "\U0001F7E4", "label": "rolling clay into a snake", "bin": "shape", "why": "Rolling changes the clay's shape."},
                  {"pic": icon("swing"), "label": "pushing a swing", "bin": "move", "why": "The push makes the swing move."},
                  {"pic": "\U0001F4C4", "label": "folding paper", "bin": "shape", "why": "Folding changes the paper's shape."},
              ]},
             "A force changes movement, or shape, or both."),

        step("demo", "Nothing changes by itself", "\U0001F6D1", "Needs a cause", ["2Pf.03"],
             "A thing only speeds up, slows down or turns when <b>something makes it</b>. Press <b>Next</b>.",
             explain(
                 ["This is the big idea.", "A still thing stays still, and a moving thing keeps moving the same way, until a force changes it."],
                 ["The ball on the floor does not start rolling on its own.", "The rolling ball slows because the floor rubs against it. That rubbing is a force.",
                  "A ball in space, with nothing to rub, would keep moving for ever."],
                 ["Children say the ball ran out of go.", "Balls do not have go. The floor and the air pushed against it the whole way."],
                 ["Press Next and find the cause each time."]),
             {"frames": [
                 {"pic": "⚽", "cap": "A still ball stays still. <b>Nothing</b> made it move, so it does not.", "say": "A still ball stays still. Nothing has pushed or pulled it, so it does not move."},
                 {"pic": "\U0001F9B6⚽", "cap": "It moves because a <b>foot</b> pushed it.", "say": "Now it moves, because a foot pushed it. Something caused the change.", "sound": "thud"},
                 {"pic": "⚽\U0001F32C️", "cap": "It slows because the <b>floor rubs</b> against it. Rubbing is a force.", "say": "It slows down because the floor rubs against it all the way along. That rubbing is a force called friction."},
                 {"pic": "⚽\U0001F9F1", "cap": "It stops because the <b>wall</b> pushed back.", "say": "It stops at the wall because the wall pushed back on it.", "sound": "thud"},
                 {"pic": "⚽\U0001F30C", "cap": "In space, with nothing to rub, it would keep moving <b>for ever</b>.", "say": "Out in space, with no floor and no air to rub against it, a ball would keep going for ever. Things only change speed or direction when something makes them."},
             ]},
             "Speed up, slow down, turn: only when something makes it happen."),

        step("questions", "What made it change?", "✅", "Cause finder", ["2Pf.03", "2Pf.01"],
             "Something changed how it moved. What caused it? Tap the answer.",
             explain(
                 ["Every change in movement has a cause: a push, a pull, rubbing, or a bump."],
                 ["The bike slows on grass because the grass rubs harder than the road.", "The swing stops because the air and the chains rub.", "The trolley turns because a hand pushed its side."],
                 [],
                 ["Find the force that caused the change."]),
             {"label": "Question", "items": [
                 q("A bike slows down when it goes onto grass. Why?", "\U0001F6B2", "the grass rubs against the wheels more than the road did", ["the bike ran out of go", "the grass is green"], "Rubbing, friction, is a force that slows things."),
                 q("A ball rolls across the floor and stops. What stopped it?", "⚽", "the floor rubbing against it", ["nothing, it just stopped", "the ball got tired"], "Nothing stops by itself. The floor's rubbing did it."),
                 q("A trolley rolling straight suddenly turns. What happened?", "\U0001F6D2", "something pushed it from the side", ["it decided to turn", "nothing"], "A change of direction needs a sideways force."),
                 q("A swing goes higher. What made it?", icon("swing"), "a push", ["the wind stopped", "nothing, swings go up on their own"], "Speeding up needs a force: a push."),
                 q("A ball sits still on the grass. What will it do if nothing pushes or pulls it?", "⚽", "stay still", ["start rolling", "jump"], "A still thing stays still until a force acts."),
             ]},
             "Every change in movement has a cause."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Pf.01", "2Pf.02", "2Pf.03", "2TWSa.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Forces change movement and shape.", "Nothing changes speed on its own.", "Bigger push, further roll: an increasing pattern."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A goalkeeper catches a moving ball. What does the force from her hands do?", "\U0001F945", "it stops the ball moving", ["it makes the ball go faster", "it changes the ball's colour"], "A force can change how a thing moves. Her hands push against the ball and stop it."),
                 q("You push the toy car harder. It goes...", "🚗", "further", ["a shorter way", "the same distance"], "Bigger push, bigger move. You measured it."),
                 q("What pattern did your graph show?", "\U0001F4CA", "the columns went up as the push got bigger", ["the columns went down", "all the columns were equal"], "An increasing pattern."),
                 q("Squashing clay changes its...", "\U0001F7E4", "shape", ["colour", "habitat", "sound"], "A force can change the shape of a thing."),
                 q("Why does a rolling ball slow down?", "⚽", "the floor rubs against it", ["it runs out of go", "it gets bored"], "Rubbing, friction, is a force that slows things."),
                 q("What does a still ball do if nothing pushes or pulls it?", "⚽", "stays still", ["starts to roll", "spins"], "Nothing changes until a force acts."),
                 q("Which force changes the shape of a thing?", "❓", "stretching an elastic band", ["kicking a ball", "pulling a sledge", "catching a ball"], "Stretching changes shape; the others change movement."),
                 q("A ball turns while rolling. What must have happened?", "↗️", "a force pushed it from the side", ["nothing", "it wanted to"], "A change of direction needs a sideways force."),
                 q("What would happen if you gave the same toy car the same push on thick carpet instead of a smooth floor?", "\U0001F697", "it would stop sooner, because the carpet rubs against it more", ["it would roll on for ever", "it would go further, because the carpet is soft"], "Thick carpet rubs against the wheels more than a smooth floor does, so the car slows down and stops sooner."),
             ]},
             "That is the whole lesson finished. You know what forces do."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say what a force can do to how something moves.",
    "Push a toy car three ways and graph how far it goes.",
    "Say that a force can change shape too.",
    "Say that nothing speeds up, slows down or turns by itself.",
]

LESSON["warmup"] = [
    q("What do you do to open a drawer?", "\U0001F5C4️", "pull it", ["sing to it", "look at it"], "You pull a drawer to open it. A pull is a force."),
    q("What makes a football start to move?", "⚽", "a kick", ["looking at it", "waiting for it"], "A kick is a push. Something has to push a ball to start it moving."),
]

LESSON["lecture"] = [
    part("\u26BD", "A force changes movement",
         "A still ball sits there for ever unless a force acts on it. A kick starts it. Push it along and it speeds up. Push back and it slows and stops. Tap the side and it turns."),
    part("\U0001F4CF", "Bigger push, further roll",
         "Push a toy car gently: it rolls a little way. Medium: further. Hard: furthest. Measure each one and there is a pattern. A bigger push, a bigger move."),
    part("\U0001F4CA", "Graph it",
         "Write the three distances in a table. Then build a block graph, one block for each step. The columns get taller. That is an increasing pattern."),
    part("\U0001F9F6", "A force changes shape",
         "Squash a sponge and it goes flat, then springs back. Bend a paperclip and it stays bent. Push a wooden block and nothing happens. Forces change shape as well as movement."),
    part("\U0001F9F1", "Nothing changes by itself",
         "A ball slows down because the floor rubs against it. It stops at the wall because the wall pushes back. Every change in movement has a cause."),
]

LESSON["words"] = [
    word("force", "\U0001F4AA\U0001F3FE", "A push or a pull.",
         ["A kick is a force.", "A force made the ball move."]),
    word("speed up", "\U0001F3C3\U0001F3FE", "To go faster.",
         ["The ball speeds up when I push it along.", "Bikes speed up going downhill."]),
    word("slow down", "\U0001F422", "To go slower.",
         ["The ball slows down on the grass.", "Brakes make a bike slow down."]),
    word("distance", "\U0001F4CF", "How far something travels.",
         ["The hard push went the biggest distance.", "Measure the distance in steps."]),
    word("pattern", "\U0001F4C8", "Something that happens the same way each time, so you can predict it.",
         ["The pattern is: bigger push, further roll.", "Find the pattern in the table."]),
    word("squash", "\U0001F9F6", "To press something flat.",
         ["Squash the clay.", "You cannot squash a stone."]),
    word("stretch", "\U0001FAA2", "To pull something longer.",
         ["Stretch the elastic band.", "Wool stretches a little."]),
]

LESSON["home"] = [
    home("Three pushes", "A ball, a smooth floor, tape, and your feet or a shoe to measure with",
         ["Mark a start line with tape.",
          "Push gently, then medium, then hard. Measure each roll in foot-lengths or shoe-lengths.",
          "Draw a block graph of the three."],
         "Do the columns get taller each time? That is the pattern."),
    home("Squash, bend, twist, stretch", "Play dough, an elastic band, a stone, a sponge, a wooden spoon",
         ["Try all four actions on each thing.",
          "Say which changed shape and which did not.",
          "Say which went back to its shape by itself."],
         "The band springs back. The play dough does not. The stone never changed."),
    home("What stopped it?", "A toy car or a ball, a carpet, a wooden floor, a wall",
         ["Push the car the same way on carpet and on wood.",
          "Watch where it stops each time.",
          "Push it gently at the wall."],
         "The car goes further on wood. Why? What stopped it at the wall?"),
]
