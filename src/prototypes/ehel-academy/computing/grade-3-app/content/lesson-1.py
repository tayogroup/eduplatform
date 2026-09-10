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
                 ["Washing your hands is linear: tap on, soap, rub, rinse, dry.", "You never do step four before step two.", "A computer follows a linear program the same way, top to bottom."],
                 ["Children think 'linear' means 'short'.", "It means in order, one after another. A linear algorithm can be long."],
                 ["Press Next and watch the line get followed."]),
             {"frames": [
                 {"scene": {"id": "handwash", "state": []}, "cap": "Five steps, in a line. Nothing has happened yet.", "say": "Five steps, in a line. Nothing has happened yet."},
                 {"scene": {"id": "handwash", "state": ["tap"]}, "cap": "Step 1: tap on. We start at the top.", "say": "Step one: tap on. A linear algorithm starts at the top.", "sound": "splash"},
                 {"scene": {"id": "handwash", "state": ["tap", "soap"]}, "cap": "Step 2: soap. The next step, and only the next step.", "say": "Step two: soap. The next step, and only the next step."},
                 {"scene": {"id": "handwash", "state": ["tap", "soap", "rub"]}, "cap": "Step 3: rub. Still going down the line.", "say": "Step three: rub. Still going down the line."},
                 {"scene": {"id": "handwash", "state": ["tap", "soap", "rub", "rinse"]}, "cap": "Step 4: rinse.", "say": "Step four: rinse."},
                 {"scene": {"id": "handwash", "state": ["tap", "soap", "rub", "rinse", "dry"]}, "cap": "Step 5: dry. The end. Top to bottom, no skipping, no jumping back.", "say": "Step five: dry. The end. Top to bottom, no skipping, no jumping back. That is a linear algorithm.", "sound": "ding"},
             ]},
             "A linear algorithm goes top to bottom, one step at a time."),

        step("follow", "Follow it exactly", "\U0001F9FC", "Exact follower", ["3CT.01"],
             "Follow the algorithm for washing hands, tapping each step <b>in order</b>. Watch the scene.",
             explain(
                 ["Following an algorithm means doing exactly the step it names next, and nothing else."],
                 ["The lit step says rub. Tap rub, not rinse.", "The scene paints what you tap, in the order you tap it."],
                 ["Children tap the step they would do, not the step the algorithm names.", "A computer cannot do that. It does the next step, whatever it is."],
                 ["Read the lit step, then tap it."]),
             {"scene": "handwash", "steps": [
                 s("tap", "Turn the tap on", "\U0001F6B0", "Turn the tap on. Water runs."),
                 s("soap", "Put soap on your hands", "\U0001F9FC", "Soap on your hands."),
                 s("rub", "Rub your hands together", "\U0001F450", "Rub, front and back, for twenty seconds."),
                 s("rinse", "Rinse the soap off", "\U0001F4A7", "Rinse the soap off."),
                 s("dry", "Dry your hands", "\U0001F9FB", "Dry your hands. Done."),
             ]},
             "Five steps, followed exactly."),

        step("context", "Why is each step where it is?", "\U0001F914", "Step understander", ["3CT.01", "3CT.04"],
             "Understanding an algorithm means knowing WHY each step is where it is. Tap each step to hear the reason.",
             explain(
                 ["Following an algorithm and understanding it are different.", "Understanding means you could say why step three comes after step two."],
                 ["Soap comes after the tap because dry hands do not lather.", "Rinse comes after rub because you rinse the soap you rubbed.", "Every step is where it is for a reason. That reason is logic."],
                 ["Children can follow an algorithm they do not understand, and then they cannot fix it when it breaks.", "Ask why, every step."],
                 ["Tap all five and listen for the reason."]),
             {"items": [
                 {"pic": "\U0001F6B0", "label": "tap on, first", "say": "The tap goes on first, because every other step needs water."},
                 {"pic": "\U0001F9FC", "label": "soap, second", "say": "Soap comes second. It needs wet hands to lather, so it has to come after the tap."},
                 {"pic": "\U0001F450", "label": "rub, third", "say": "Rubbing comes third. It spreads the soap that is already on your hands."},
                 {"pic": "\U0001F4A7", "label": "rinse, fourth", "say": "Rinse comes fourth. You rinse off the soap you rubbed in. Rinsing before rubbing would wash the soap away too soon."},
                 {"pic": "\U0001F9FB", "label": "dry, last", "say": "Dry comes last. Drying before rinsing would leave soap on your hands, and the towel would be soapy."},
             ], "need": 5,
              "then": {"ask": "Why does rinse come AFTER rub?",
                       "opts": [opt("You rinse off the soap you have already rubbed in", True), opt("Rinsing is more fun than rubbing", False), opt("It does not matter which comes first", False)],
                       "why": "Each step is where it is because of what the step before it did. That is logical thinking."}},
             "You understand why each step is where it is."),

        step("bugs", "Correct the algorithm", "\U0001F41B", "Bug corrector", ["3CT.01"],
             "One step of each algorithm is wrong. Find it, fix it, and watch the corrected algorithm run.",
             explain(
                 ["Correcting an algorithm means finding the step that is wrong and putting the right step in its place."],
                 ["The seed algorithm says: pot, soil, eat the seed, water. Eat the seed? The seed has to go IN the soil.",
                  "Find the wrong step, choose what it should say, then watch it run and check the plant grows."],
                 ["Children change a step that was fine.", "Run the algorithm in your head first: where does it go wrong?"],
                 ["Tap the wrong step, choose the fix, watch it run."]),
             {"scene": "plant", "rounds": [
                 {"goal": "grow a plant from a seed",
                  "steps": [s("pot", "Get a pot", "\U0001FAB4"), s("soil", "Fill it with soil", "\U0001F7EB"), s("eat", "Eat the seed", "\U0001F60B"), s("water", "Water it", "\U0001F4A7"), s("sun", "Put it in the sun", "☀️")],
                  "wrong": 2, "why": "Eating the seed leaves nothing to grow. The step should plant it.",
                  "fix": {"opts": [choice("seed", "Plant the seed in the soil", True, "\U0001F331"), choice("sun", "Put it in the sun", False, "☀️"), choice("pot", "Get another pot", False, "\U0001FAB4")], "why": "Plant the seed. Now the water and the sun have something to grow."}},
                 {"goal": "grow a plant from a seed",
                  "steps": [s("pot", "Get a pot", "\U0001FAB4"), s("seed", "Plant the seed", "\U0001F331"), s("soil", "Fill it with soil", "\U0001F7EB"), s("water", "Water it", "\U0001F4A7"), s("sun", "Put it in the sun", "☀️")],
                  "wrong": 1, "swap": True, "why": "The seed is planted in an empty pot, with no soil under it. The soil has to go in first.",
                  },
                 {"goal": "grow a plant from a seed",
                  "steps": [s("pot", "Get a pot", "\U0001FAB4"), s("soil", "Fill it with soil", "\U0001F7EB"), s("seed", "Plant the seed", "\U0001F331"), s("water", "Water it", "\U0001F4A7"), s("fridge", "Put it in the fridge", "\U0001F9CA")],
                  "wrong": 4, "why": "A plant in the fridge gets no light and no warmth. It needs the sun.",
                  "fix": {"opts": [choice("sun", "Put it in the sun", True, "☀️"), choice("water", "Water it again", False, "\U0001F4A7"), choice("eat", "Eat it", False, "\U0001F60B")], "why": "In the sun. Now it can grow."}},
             ]},
             "Three algorithms corrected, and each one grows a plant."),

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
                  {"pic": "\U0001F6B0", "label": "saying that soap needs wet hands, so the tap comes first", "bin": "understand", "why": "That is the reason for the order: understanding."},
                  {"pic": "\U0001F916", "label": "Robo doing forward, forward, turn, exactly as written", "bin": "follow", "why": "Doing exactly what is written: following."},
                  {"pic": "\U0001F9E6", "label": "changing 'shoes, then socks' to 'socks, then shoes'", "bin": "correct", "why": "Shoes then socks is wrong. Fixing it is correcting."},
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
                 q("In the hand-washing algorithm, why does the tap go on first?", "\U0001F6B0", "every other step needs water", ["taps are fun", "it does not matter", "the soap is heavy"], "Each step is placed by logic: the others need what the tap gives."),
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
                 q("The seed algorithm said 'eat the seed'. Changing it to 'plant the seed' is...", "\U0001F331", "correcting", ["following", "editing for fun", "repeating"], "The step was wrong; fixing it is correcting."),
                 q("Changing the small top brick to a red brick because you want a red top is...", "\U0001F7E5", "editing", ["correcting", "following", "a bug"], "Nothing was wrong; the change was wanted. That is editing."),
                 q("Which is a linear algorithm?", "\U0001F4CF", "tap on, soap, rub, rinse, dry", ["do any of these in any order", "rub, then whichever you like", "a circle of steps that never ends"], "One step after another, in order, with an end."),
                 q("Why does soap come after the tap?", "\U0001F9FC", "soap needs wet hands to lather", ["soap is yellow", "the tap is bigger", "no reason"], "Logical thinking: the step needs what the step before gave."),
                 q("Understanding an algorithm means...", "\U0001F4A1", "knowing why each step is where it is", ["doing it fast", "memorising it", "never changing it"], "Understanding is knowing the reasons."),
                 q("In the seed algorithm the seed was planted BEFORE the soil went in. The fix is to...", "\U0001F7EB", "move the seed step after the soil step", ["remove the seed", "add more water", "eat the seed"], "A right step in the wrong place is corrected by moving it."),
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
         "A linear algorithm is a line of steps: a first, a next, a next, an end. You go top to bottom and never jump about. Washing your hands is linear: tap, soap, rub, rinse, dry."),
    part("\U0001F463", "Following",
         "Following an algorithm means doing the step it names next, and only that. A computer does exactly this, which is why a wrong step in a program makes a wrong thing happen."),
    part("\U0001F4A1", "Understanding",
         "Understanding means knowing why each step is where it is. Soap comes after the tap because soap needs wet hands. That reasoning is called logical thinking, and it is how algorithms get made."),
    part("\U0001F41B", "Correcting",
         "When a step is wrong - eat the seed instead of plant the seed - you find it, put the right step in its place, and run the algorithm again to check. That is correcting."),
    part("✏️", "Editing",
         "When nothing is wrong but you want something different - a red top brick, a taller tower - you change a step on purpose. That is editing. Edit is wanted; correct is needed."),
]

LESSON["words"] = [
    word("linear", "\U0001F4CF", "In a line: one step after another, in order.",
         ["Hand washing is a linear algorithm.", "A linear program runs top to bottom."]),
    word("follow", "\U0001F463", "To do the steps of an algorithm exactly, in order.",
         ["Follow the recipe.", "Robo follows its program."]),
    word("understand", "\U0001F4A1", "To know why each step of an algorithm is where it is.",
         ["I understand why the tap comes first.", "Understand it before you change it."]),
    word("edit", "✏️", "To change an algorithm on purpose, to make something different.",
         ["Edit the tower algorithm to add a brick.", "We edited the recipe to use honey."]),
    word("correct", "\U0001F41B", "To fix a step of an algorithm that is wrong.",
         ["Correct the step that says eat the seed.", "Run it again after you correct it."]),
    word("logical", "\U0001F9E0", "Using reasons: this step comes here because of that.",
         ["Logical thinking puts the soap after the tap.", "Give a logical reason for the order."]),
]

LESSON["home"] = [
    home("Follow it exactly", "A grown-up, a simple job (make toast, water a plant)",
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
         ["Change one card to make something different: toast with honey, a taller sandwich.",
          "Say before you do it what will change.",
          "Then follow the edited algorithm."],
         "Edit is a change you want; correct is a fix you need."),
]
