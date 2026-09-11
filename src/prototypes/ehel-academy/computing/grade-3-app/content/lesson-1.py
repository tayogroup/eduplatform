# -*- coding: utf-8 -*-
"""Lesson 1 - Follow, Edit, Correct.

0059 Stage 3 Computational Thinking: 3CT.01 follow, understand, edit and
correct linear algorithms; 3CT.04 logical thinking is used in the creation of
algorithms.
"""
from _kit import explain, step, opt, q, s, choice, part, word, home

LESSON = {
    "slug": "follow-edit-correct",
    "title": "Follow, Edit, Correct",
    "blurb": "Follow a linear algorithm exactly, understand why each step is where it is, correct the one that is wrong, and edit an algorithm to make something new.",
    "steps": [
        step("demo", "A linear algorithm", "\U0001F4CF", "Line follower", ["3CT.01"],
             "A <b>linear</b> algorithm is a straight line of steps: one after another, no jumping about. Press <b>Next</b>.",
             explain(
                 ["Linear means in a line.", "A linear algorithm has a first step, a next step, a next step, and an end, and you go through them in order."],
                 ["Making a smoothie is linear: banana, strawberries, milk, lid, blend, pour.", "You never blend before the lid is on.", "A computer follows a linear program the same way, top to bottom."],
                 ["Children think 'linear' means 'short'.", "It means in order, one after another. A linear algorithm can be long."],
                 ["Press Next and watch the line get followed."]),
             {"frames": [
                 {"scene": {"id": "smoothie", "state": []}, "cap": "Six steps, in a line. Nothing has happened yet.", "say": "Six steps, in a line. Nothing has happened yet."},
                 {"scene": {"id": "smoothie", "state": ["banana"]}, "cap": "Step 1: the banana goes in. We start at the top.", "say": "Step one: the banana goes in. A linear algorithm starts at the top."},
                 {"scene": {"id": "smoothie", "state": ["banana", "berries"]}, "cap": "Step 2: strawberries. The next step, and only the next step.", "say": "Step two: strawberries. The next step, and only the next step."},
                 {"scene": {"id": "smoothie", "state": ["banana", "berries", "milk"]}, "cap": "Step 3: milk. Still going down the line.", "say": "Step three: milk. Still going down the line.", "sound": "splash"},
                 {"scene": {"id": "smoothie", "state": ["banana", "berries", "milk", "lid"]}, "cap": "Step 4: the lid on.", "say": "Step four: the lid on."},
                 {"scene": {"id": "smoothie", "state": ["banana", "berries", "milk", "lid", "blend"]}, "cap": "Step 5: blend.", "say": "Step five: blend.", "sound": "hum"},
                 {"scene": {"id": "smoothie", "state": ["banana", "berries", "milk", "lid", "blend", "pour"]}, "cap": "Step 6: pour. The end. Top to bottom, no skipping, no jumping back.", "say": "Step six: pour. The end. Top to bottom, no skipping, no jumping back. That is a linear algorithm.", "sound": "ding"},
             ]},
             "A linear algorithm goes top to bottom, one step at a time."),

        step("follow", "Follow it exactly", "\U0001F964", "Exact follower", ["3CT.01"],
             "Follow the algorithm for making a smoothie, tapping each step <b>in order</b>. Watch the scene.",
             explain(
                 ["Following an algorithm means doing exactly the step it names next, and nothing else."],
                 ["The lit step says lid. Tap lid, not blend.", "The scene paints what you tap, in the order you tap it."],
                 ["Children tap the step they would do, not the step the algorithm names.", "A computer cannot do that. It does the next step, whatever it is."],
                 ["Read the lit step, then tap it."]),
             {"scene": "smoothie", "steps": [
                 s("banana", "Put a banana in the blender", "\U0001F34C", "A banana in the blender."),
                 s("berries", "Add some strawberries", "\U0001F353", "Strawberries in."),
                 s("milk", "Pour in milk", "\U0001F95B", "Milk in."),
                 s("lid", "Put the lid on tight", "\U0001F512", "The lid on, tight."),
                 s("blend", "Blend it", "\U0001F300", "Blend. Whirr!"),
                 s("pour", "Pour it into a glass", "\U0001F964", "Poured into a glass. Done."),
             ]},
             "Six steps, followed exactly, and a smoothie at the end."),

        step("context", "Why is each step where it is?", "\U0001F914", "Step understander", ["3CT.01", "3CT.04"],
             "Understanding an algorithm means knowing WHY each step is where it is. Tap each step to hear the reason.",
             explain(
                 ["Following an algorithm and understanding it are different.", "Understanding means you could say why step four comes before step five."],
                 ["The lid goes on before blending, because a blender with no lid sprays everywhere.", "Pouring comes last, because you pour what you blended.", "Every step is where it is for a reason. That reason is logic."],
                 ["Children can follow an algorithm they do not understand, and then they cannot fix it when it breaks.", "Ask why, every step."],
                 ["Tap all six and listen for the reason."]),
             {"items": [
                 {"pic": "\U0001F34C", "label": "banana, first", "say": "The fruit goes in first, at the bottom, where the blades can reach it."},
                 {"pic": "\U0001F353", "label": "strawberries, second", "say": "Strawberries next. All the fruit goes in before anything is blended."},
                 {"pic": "\U0001F95B", "label": "milk, third", "say": "Milk third. It helps the fruit turn smooth, so it has to be in before the blending."},
                 {"pic": "\U0001F512", "label": "lid, fourth", "say": "The lid goes on fourth, before the blender starts. Blending with no lid sprays smoothie round the kitchen."},
                 {"pic": "\U0001F300", "label": "blend, fifth", "say": "Blend fifth. Everything it needs is in, and the lid is on."},
                 {"pic": "\U0001F964", "label": "pour, last", "say": "Pour last. Pouring before blending would fill the glass with lumps of fruit."},
             ], "need": 6,
              "then": {"ask": "Why does the lid go on BEFORE you blend?",
                       "opts": [opt("So the smoothie stays in the blender", True), opt("Lids are more fun than blending", False), opt("It does not matter which comes first", False)],
                       "why": "Each step is where it is because of what the next step will do. That is logical thinking."}},
             "You understand why each step is where it is."),

        step("bugs", "Correct the algorithm", "\U0001F41B", "Bug corrector", ["3CT.01"],
             "One step of each algorithm is wrong. Find it, fix it, and watch the corrected algorithm run.",
             explain(
                 ["Correcting an algorithm means finding the step that is wrong and putting the right step in its place."],
                 ["The kite algorithm says: cross the sticks, tie them, cut the paper into tiny pieces. Tiny pieces? The paper has to cover the sticks.",
                  "Find the wrong step, choose what it should say, then watch it run and check the kite flies."],
                 ["Children change a step that was fine.", "Run the algorithm in your head first: where does it go wrong?"],
                 ["Tap the wrong step, choose the fix, watch it run."]),
             {"scene": "kite", "rounds": [
                 {"goal": "make a kite that flies",
                  "steps": [s("sticks", "Cross two sticks", "\u2795"), s("tie", "Tie them together in the middle", "\U0001F9F5"), s("tiny", "Cut the paper into tiny pieces", "\u2702\uFE0F"), s("tail", "Tie on a tail", "\U0001F380"), s("string", "Tie on a long string", "\U0001F9F6"), s("fly", "Run into the wind with it", "\U0001F32C\uFE0F")],
                  "wrong": 2, "why": "Tiny pieces of paper cannot catch the wind. The step should cover the sticks.",
                  "fix": {"opts": [choice("paper", "Glue paper over the sticks", True, "\U0001F4C4"), choice("tail", "Tie on another tail", False, "\U0001F380"), choice("tie", "Tie the sticks again", False, "\U0001F9F5")], "why": "Paper over the sticks. Now the kite has something to catch the wind."}},
                 {"goal": "make a kite that flies",
                  "steps": [s("sticks", "Cross two sticks", "\u2795"), s("paper", "Glue paper over the sticks", "\U0001F4C4"), s("tie", "Tie them together in the middle", "\U0001F9F5"), s("tail", "Tie on a tail", "\U0001F380"), s("string", "Tie on a long string", "\U0001F9F6"), s("fly", "Run into the wind with it", "\U0001F32C\uFE0F")],
                  "wrong": 1, "swap": True, "why": "The paper is glued on before the sticks are tied, so the sticks slide apart. They have to be tied first.",
                  },
                 {"goal": "make a kite that flies",
                  "steps": [s("sticks", "Cross two sticks", "\u2795"), s("tie", "Tie them together in the middle", "\U0001F9F5"), s("paper", "Glue paper over the sticks", "\U0001F4C4"), s("tail", "Tie on a tail", "\U0001F380"), s("string", "Tie on a long string", "\U0001F9F6"), s("bed", "Put it under your bed", "\U0001F6CF\uFE0F")],
                  "wrong": 5, "why": "Under the bed there is no wind to lift it. A kite is flown outside.",
                  "fix": {"opts": [choice("fly", "Run into the wind with it", True, "\U0001F32C\uFE0F"), choice("tail", "Tie on another tail", False, "\U0001F380"), choice("paper", "Glue on more paper", False, "\U0001F4C4")], "why": "Into the wind. Now it can fly."}},
             ]},
             "Three algorithms corrected, and each one flies a kite."),

        step("remix", "Edit the algorithm", "✏️", "Algorithm editor", ["3CT.01"],
             "Editing means changing an algorithm on purpose, to make something different. Change one step to build a different tower.",
             explain(
                 ["Editing is not correcting. Nothing is wrong; you WANT something different, so you change a step."],
                 ["The tower is big, middle, small, flag. To make a tower with a red top, change the small brick to a red one.",
                  "To make it taller, add a brick. To make it shorter, take one away."],
                 ["Children edit two steps when one would do.", "Find the one step that decides the thing you want to change."],
                 ["Tap the step to change, choose what it becomes, watch the new tower."]),
             {"scene": "tower", "steps": [s("big", "Put down the big brick", "\U0001F7E7"), s("middle", "Add the middle brick", "\U0001F7E9"), s("small", "Add the small brick", "\U0001F7E8"), s("flag", "Put the flag on top", "\U0001F6A9")],
              "rounds": [
                  {"kind": "change", "target": "a tower with a red top brick", "change": "small",
                   "opts": [choice("red", "Add the red brick", True, "\U0001F7E5"), choice("blue", "Add the blue brick", False, "\U0001F7E6"), choice("flag", "Put the flag on top", False, "\U0001F6A9")],
                   "why": "The small brick is the top brick, so that is the step to change.", "result": "A red brick on top."},
                  {"kind": "add", "target": "a taller tower",
                   "opts": [choice("purple", "Add the purple brick", True, "\U0001F7EA"), choice("flag", "Put another flag on top", False, "\U0001F6A9")],
                   "why": "One more brick makes it taller.", "result": "The tower is one brick taller."},
                  {"kind": "change", "target": "a tower that starts on a blue brick", "change": "big",
                   "opts": [choice("blue", "Put down the blue brick", True, "\U0001F7E6"), choice("red", "Add the red brick", False, "\U0001F7E5"), choice("small", "Add the small brick", False, "\U0001F7E8")],
                   "why": "The first step decides the bottom brick.", "result": "A blue brick at the bottom."},
              ]},
             "You edited the algorithm three times, and got three different towers."),

        step("sort", "Follow, understand, edit or correct?", "\U0001F5C2️", "Four-verb sorter", ["3CT.01"],
             "Four things you can do with an algorithm. Which one is this?",
             explain(
                 ["Follow: do the steps. Understand: know why. Edit: change it on purpose. Correct: fix a step that is wrong."],
                 ["Doing the steps of a recipe: follow.", "Saying why the oven goes on first: understand.", "Swapping jam for honey because you want honey: edit.", "Spotting that step 3 says 'bake for 3 hours' and fixing it: correct."],
                 ["Children mix up edit and correct.", "Edit is a wanted change. Correct is a needed fix."],
                 ["Read it, decide, tap."]),
             {"ask": "Follow, understand, edit or correct?",
              "bins": [{"id": "follow", "label": "Follow", "pic": "\U0001F463"}, {"id": "understand", "label": "Understand", "pic": "\U0001F4A1"}, {"id": "edit", "label": "Edit", "pic": "✏️"}, {"id": "correct", "label": "Correct", "pic": "\U0001F41B"}],
              "items": [
                  {"pic": "\U0001F373", "label": "doing the steps of a recipe, one by one", "bin": "follow", "why": "Doing the steps in order is following."},
                  {"pic": "\U0001F4A1", "label": "explaining why the oven goes on before the cake goes in", "bin": "understand", "why": "Knowing why a step is where it is: understanding."},
                  {"pic": "\U0001F36F", "label": "swapping jam for honey because you like honey", "bin": "edit", "why": "A change you want: editing."},
                  {"pic": "\U0001F41B", "label": "spotting that 'bake for 3 hours' should be 30 minutes and fixing it", "bin": "correct", "why": "A step that is wrong, fixed: correcting."},
                  {"pic": "\U0001F9F1", "label": "adding a brick so the tower is taller", "bin": "edit", "why": "A change you want: editing."},
                  {"pic": "\U0001F512", "label": "saying the lid goes on before blending, so nothing sprays out", "bin": "understand", "why": "That is the reason for the order: understanding."},
                  {"pic": "\U0001F916", "label": "Robo doing forward, forward, turn, exactly as written", "bin": "follow", "why": "Doing exactly what is written: following."},
                  {"pic": "\U0001F32C\uFE0F", "label": "changing 'run into the wind, then tie on the string' to 'tie on the string, then run'", "bin": "correct", "why": "Running before the string is tied loses the kite. Fixing the order is correcting."},
              ]},
             "Follow, understand, edit, correct: four things to do with one algorithm."),

        step("questions", "Check: linear algorithms", "\U0001F4DD", "Line checker", ["3CT.01", "3CT.04"],
             "Three quick questions about linear algorithms.",
             explain(
                 ["Nothing new here."],
                 ["Think about the line of steps, why each is where it is, and the difference between editing and correcting."],
                 [],
                 ["Read, think, tap."]),
             {"items": [
                 q("What makes an algorithm linear?", "\U0001F4CF", "the steps go in a line, one after another", ["it has only two steps", "it is about drawing lines", "it can be done in any order"], "Linear means in a line: top to bottom, in order."),
                 q("In the smoothie algorithm, why does the lid go on before blending?", "\U0001F512", "so the smoothie stays in the blender", ["lids are fun", "it does not matter", "the lid is heavy"], "Each step is placed by logic: blending needs the lid on first."),
                 q("You change a step because you WANT a different outcome. That is...", "✏️", "editing", ["correcting", "following", "bugging"], "Editing is a wanted change. Correcting is a needed fix."),
             ]},
             "You know the line, the reasons, and the difference."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CT.01", "3CT.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about following, understanding, editing and correcting."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Robo does exactly the steps written down, in order. Robo is...", "\U0001F916", "following the algorithm", ["editing the algorithm", "correcting the algorithm", "ignoring the algorithm"], "Doing the steps as written is following."),
                 q("The kite algorithm said 'cut the paper into tiny pieces'. Changing it to 'glue paper over the sticks' is...", "\U0001F4C4", "correcting", ["following", "editing for fun", "repeating"], "The step was wrong; fixing it is correcting."),
                 q("Changing the small top brick to a red brick because you want a red top is...", "\U0001F7E5", "editing", ["correcting", "following", "a bug"], "Nothing was wrong; the change was wanted. That is editing."),
                 q("Which is a linear algorithm?", "\U0001F4CF", "banana, strawberries, milk, lid, blend, pour", ["do any of these in any order", "blend, then whichever you like", "a circle of steps that never ends"], "One step after another, in order, with an end."),
                 q("Why is pouring the LAST step of the smoothie?", "\U0001F964", "you pour what the blender has made smooth", ["glasses are small", "the blender is tired", "no reason"], "Logical thinking: a step uses what the steps before it made."),
                 q("Understanding an algorithm means...", "\U0001F4A1", "knowing why each step is where it is", ["doing it fast", "memorising it", "never changing it"], "Understanding is knowing the reasons."),
                 q("In the kite algorithm the paper went on BEFORE the sticks were tied. The fix is to...", "\U0001F9F5", "move the paper step after the tie step", ["remove the paper", "add a longer tail", "fly it indoors"], "A right step in the wrong place is corrected by moving it."),
             ]},
             "That is the whole lesson finished. You can follow, understand, edit and correct a linear algorithm."),
    ],
}


LESSON["about"] = [
    "Follow a linear algorithm exactly, one step after another.",
    "Say why each step of an algorithm is where it is.",
    "Correct the step of an algorithm that is wrong.",
    "Edit an algorithm on purpose to make something different.",
]

LESSON["lecture"] = [
    part("\U0001F4CF", "Linear means in a line",
         "A linear algorithm is a line of steps: a first, a next, a next, an end. You go top to bottom and never jump about. Making a smoothie is linear: banana, strawberries, milk, lid, blend, pour."),
    part("\U0001F463", "Following",
         "Following an algorithm means doing the step it names next, and only that. A computer does exactly this, which is why a wrong step in a program makes a wrong thing happen."),
    part("\U0001F4A1", "Understanding",
         "Understanding means knowing why each step is where it is. The lid goes on before blending because a blender with no lid sprays everywhere. That reasoning is called logical thinking, and it is how algorithms get made."),
    part("\U0001F41B", "Correcting",
         "When a step is wrong - cut the paper into tiny pieces instead of gluing it over the sticks - you find it, put the right step in its place, and run the algorithm again to check. That is correcting."),
    part("✏️", "Editing",
         "When nothing is wrong but you want something different - a red top brick, a taller tower - you change a step on purpose. That is editing. Edit is wanted; correct is needed."),
]

LESSON["words"] = [
    word("linear", "\U0001F4CF", "In a line: one step after another, in order.",
         ["Making a smoothie is a linear algorithm.", "A linear program runs top to bottom."]),
    word("follow", "\U0001F463", "To do the steps of an algorithm exactly, in order.",
         ["Follow the recipe.", "Robo follows its program."]),
    word("understand", "\U0001F4A1", "To know why each step of an algorithm is where it is.",
         ["I understand why the lid goes on first.", "Understand it before you change it."]),
    word("edit", "✏️", "To change an algorithm on purpose, to make something different.",
         ["Edit the tower algorithm to add a brick.", "We edited the recipe to use honey."]),
    word("correct", "\U0001F41B", "To fix a step of an algorithm that is wrong.",
         ["Correct the step that cuts the paper into tiny pieces.", "Run it again after you correct it."]),
    word("logical", "\U0001F9E0", "Using reasons: this step comes here because of that.",
         ["Logical thinking puts the lid on before the blending.", "Give a logical reason for the order."]),
]

LESSON["home"] = [
    home("Follow it exactly", "A grown-up, a simple job (pack a school bag, water a plant)",
         ["Write the steps on cards, one per card.",
          "The grown-up follows them EXACTLY, silly mistakes and all.",
          "Did the job get done? If not, which step was wrong?"],
         "A computer follows an algorithm the way your grown-up did."),
    home("Say why", "The same cards",
         ["For each card, say why it comes where it does.",
          "Try swapping two cards. What goes wrong?",
          "That is understanding the algorithm."],
         "Every step has a reason."),
    home("Edit it", "The same cards, one blank card",
         ["Change one card to make something different: a bag for sports day, two plants instead of one.",
          "Say before you do it what will change.",
          "Then follow the edited algorithm."],
         "Edit is a change you want; correct is a fix you need."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["warmup"] = [
    q("What is an algorithm?", "\U0001F4CB", "steps in order that get a job done", ["a kind of robot", "a picture", "a song"], "An algorithm is the steps, in order, that get a job done."),
    q("One step in an algorithm is wrong. What is that called?", "\U0001F41B", "a bug", ["a feature", "a loop", "a key"], "A mistake in an algorithm or a program is a bug."),
]
