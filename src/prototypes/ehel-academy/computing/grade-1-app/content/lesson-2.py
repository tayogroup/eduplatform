# -*- coding: utf-8 -*-
"""Lesson 2 - Order Matters.

0059 Stage 1 Computational Thinking: 1CT.06 the order of instructions is
important; 1CT.02 identify single errors in algorithms for everyday tasks;
1CT.07 suggest ways an algorithm can be changed to affect the outcome; with
1CT.01 and 1CT.04.
"""
from _kit import explain, step, opt, q, s, choice, part, word, home

LESSON = {
    "slug": "order-matters",
    "title": "Order Matters",
    "blurb": "Put shoes on before socks and see what happens, make a sandwich in the right order, find the one step that is wrong, and change an algorithm to make something new.",
    "steps": [
        step("demo", "Shoes before socks?", "\U0001F45F", "Order matters", ["1CT.06"],
             "Sami gets dressed in the wrong order. Press <b>Next</b> and see what happens.",
             explain(
                 ["In an algorithm the order of the steps matters.", "The same steps in a different order do a different thing."],
                 ["Shoes, then socks: the socks end up on the OUTSIDE of the shoes.", "Socks, then shoes: that is right.",
                  "Same two steps. Different order. Different outcome."],
                 ["Children think that as long as every step is there, it is fine.", "It is not. Where a step goes matters as much as what it is."],
                 ["Press Next and laugh at the socks."]),
             {"frames": [
                 {"scene": {"id": "dress", "state": []}, "cap": "Sami is getting dressed. Here is the algorithm: shoes, then socks.", "say": "Sami is getting dressed. The algorithm says: put on shoes, then put on socks. Let us follow it."},
                 {"scene": {"id": "dress", "state": ["shoes"]}, "cap": "Step 1: put on <b>shoes</b>.", "say": "Step one. Put on shoes.", "sound": "click"},
                 {"scene": {"id": "dress", "state": ["shoes", "socks"]}, "cap": "Step 2: put on <b>socks</b>. Oh no!", "say": "Step two. Put on socks. Oh no! The socks are on the outside of the shoes.", "sound": "error"},
                 {"scene": {"id": "dress", "state": ["socks"]}, "cap": "Start again. <b>Socks</b> first.", "say": "Start again. Socks first.", "sound": "click"},
                 {"scene": {"id": "dress", "state": ["socks", "shoes"]}, "cap": "Then <b>shoes</b>. The same two steps, the right order.", "say": "Then shoes. The same two steps, in the right order. In an algorithm, the order matters.", "sound": "tada"},
             ]},
             "Same steps, different order, different outcome. Order matters."),

        step("follow", "Make a jam sandwich, in order", "\U0001F35E", "Sandwich maker", ["1CT.01", "1CT.06"],
             "Follow the algorithm for a jam sandwich. Tap the step that comes next.",
             explain(
                 ["A sandwich is an algorithm with four steps, and every one has to be in its place."],
                 ["Bread on the plate.", "Butter on the bread.", "Jam on the butter.", "The top slice on the jam."],
                 ["Children put the top slice on and THEN the jam.", "Then the jam is on the outside, on your fingers."],
                 ["Tap the steps in the order the algorithm shows."]),
             {"scene": "sandwich", "steps": [
                 s("bread", "Put a slice of bread on the plate", "\U0001F35E", "Bread on the plate."),
                 s("butter", "Spread the butter", "\U0001F9C8", "Butter on the bread."),
                 s("jam", "Spread the jam", "\U0001F353", "Jam on top of the butter."),
                 s("top", "Put the top slice on", "\U0001F96A", "Top slice on. A jam sandwich."),
             ]},
             "Bread, butter, jam, top. Every step in its place."),

        step("bugs", "Find the bug", "\U0001F41B", "Bug finder", ["1CT.02"],
             "Each algorithm has ONE step that is wrong. Find it, then fix it.",
             explain(
                 ["A mistake in an algorithm is called a bug.", "One wrong step, or one step in the wrong place, and the job goes wrong."],
                 ["Read every step and ask: does this belong here?", "Pouring milk on the bread does not belong in a jam sandwich.",
                  "The top slice before the jam is a step in the wrong place."],
                 ["Children tap the first step they see.", "Read all of them first. Only ONE is wrong."],
                 ["Tap the step that is the bug."]),
             {"scene": "sandwich", "rounds": [
                 {"goal": "Make a jam sandwich",
                  "steps": [s("bread", "Put bread on the plate", "\U0001F35E"), s("milk", "Pour milk on the bread", "\U0001F95B"), s("jam", "Spread the jam", "\U0001F353"), s("top", "Put the top slice on", "\U0001F96A")],
                  "wrong": 1, "why": "Milk on the bread does not belong in a jam sandwich. That step is the bug.",
                  "fix": {"opts": [choice("butter", "Spread the butter", True, "\U0001F9C8"), choice("ketchup", "Squirt ketchup on it", False, "\U0001F345"), choice("eat", "Eat the bread now", False, "\U0001F60B")],
                          "why": "Butter goes on the bread before the jam."},
                  "done": "Bread, butter, jam, top. Fixed."},
                 {"goal": "Make a jam sandwich",
                  "steps": [s("bread", "Put bread on the plate", "\U0001F35E"), s("butter", "Spread the butter", "\U0001F9C8"), s("top", "Put the top slice on", "\U0001F96A"), s("jam", "Spread the jam", "\U0001F353")],
                  "wrong": 2, "swap": True, "why": "The top slice is too early. The jam has to go on before the top.",
                  "done": "Bread, butter, jam, then the top. The jam is inside now."},
                 {"goal": "Make a jam sandwich",
                  "steps": [s("bread", "Put bread on the plate", "\U0001F35E"), s("butter", "Spread the butter", "\U0001F9C8"), s("jam", "Spread the jam", "\U0001F353"), s("eat", "Throw it in the bin", "\U0001F5D1️")],
                  "wrong": 3, "why": "Throwing it in the bin does not make a sandwich. That step is the bug.",
                  "fix": {"opts": [choice("top", "Put the top slice on", True, "\U0001F96A"), choice("milk", "Pour milk on it", False, "\U0001F95B"), choice("bread", "Put another plate under it", False, "\U0001F37D️")],
                          "why": "The top slice finishes the sandwich."},
                  "done": "A jam sandwich, with nothing in the bin."},
             ]},
             "One wrong step is a bug. You found three and fixed them."),

        step("remix", "Change the algorithm", "\U0001F504", "Algorithm changer", ["1CT.07"],
             "Change one step and the sandwich changes too. Make what the page asks for.",
             explain(
                 ["If you change a step in an algorithm, the outcome changes."],
                 ["Swap jam for cheese and you get a cheese sandwich.", "Add a step, cut it in half, and you get two halves.",
                  "Same algorithm, one change, a different result."],
                 ["Children change the wrong step.", "Ask: which step decides what kind of sandwich it is? Change THAT one."],
                 ["Tap the step to change, then pick the new step."]),
             {"scene": "sandwich",
              "steps": [s("bread", "Put bread on the plate", "\U0001F35E"), s("butter", "Spread the butter", "\U0001F9C8"), s("jam", "Spread the jam", "\U0001F353"), s("top", "Put the top slice on", "\U0001F96A")],
              "rounds": [
                  {"kind": "change", "target": "a cheese sandwich", "change": "jam",
                   "opts": [choice("cheese", "Put cheese on", True, "\U0001F9C0"), choice("water", "Pour water on", False, "\U0001F4A7"), choice("sock", "Put a sock on", False, "\U0001F9E6")],
                   "why": "Changing the jam step to cheese changes what the sandwich is.", "result": "A cheese sandwich!"},
                  {"kind": "add", "target": "two halves",
                   "opts": [choice("cut", "Cut it in half", True, "\U0001F52A"), choice("milk", "Pour milk on it", False, "\U0001F95B"), choice("hat", "Put a hat on it", False, "\U0001F3A9")],
                   "why": "Adding a step at the end changes the outcome too.", "result": "Two halves!"},
                  {"kind": "change", "target": "a banana sandwich", "change": "cheese",
                   "opts": [choice("banana", "Put banana on", True, "\U0001F34C"), choice("ketchup", "Squirt ketchup on", False, "\U0001F345"), choice("top", "Put another top on", False, "\U0001F96A")],
                   "why": "Change the filling step and the filling changes.", "result": "A banana sandwich, in two halves!"},
              ]},
             "Change a step, change the outcome. That is how you make something new."),

        step("order", "Cross the road safely", "\U0001F6B8", "Safe crosser", ["1CT.04", "1CT.06"],
             "Write the algorithm for crossing the road. Tap the step that comes <b>first</b>.",
             explain(
                 ["Some algorithms keep you safe, and then the order really matters."],
                 ["Stop at the kerb.", "Look both ways.", "Listen for cars.", "Walk straight across when it is clear."],
                 ["Children put walk first because walking is the point.", "Walking first is the dangerous order."],
                 ["Tap the four steps in the safe order."]),
             {"items": [
                 {"pic": "\U0001F6D1", "label": "stop at the kerb", "say": "First, stop at the kerb."},
                 {"pic": "\U0001F440", "label": "look both ways", "say": "Look both ways."},
                 {"pic": "\U0001F442", "label": "listen for cars", "say": "Listen for cars."},
                 {"pic": "\U0001F6B6", "label": "walk straight across", "say": "Walk straight across when it is clear."},
             ]},
             "Stop, look, listen, walk. The safe order."),

        step("sort", "Bug, or fine?", "\U0001F5C2️", "Bug sorter", ["1CT.02", "1CT.06"],
             "Read each algorithm. Does it work, or does it have a bug?",
             explain(
                 ["Some of these algorithms work.", "Some have a step in the wrong place, or a step that does not belong."],
                 ["Socks then shoes: fine.", "Shoes then socks: bug.", "Pour the juice then drink: fine.", "Drink then pour: bug. There is nothing to drink yet."],
                 ["Children see the right words and say fine.", "Check the ORDER too."],
                 ["Read it, picture it, then tap the bin."]),
             {"ask": "Does it work, or is there a bug?",
              "bins": [{"id": "fine", "label": "It works", "pic": "✅"}, {"id": "bug", "label": "It has a bug", "pic": "\U0001F41B"}],
              "items": [
                  {"pic": "\U0001F9E6➡️\U0001F45F", "label": "socks, then shoes", "bin": "fine", "why": "Socks first, then shoes over them. That works."},
                  {"pic": "\U0001F45F➡️\U0001F9E6", "label": "shoes, then socks", "bin": "bug", "why": "Shoes first puts the socks on the outside. The order is the bug."},
                  {"pic": "\U0001F9C3➡️\U0001F444", "label": "pour the juice, then drink it", "bin": "fine", "why": "Pour, then drink. That works."},
                  {"pic": "\U0001F444➡️\U0001F9C3", "label": "drink the juice, then pour it", "bin": "bug", "why": "There is nothing to drink until you pour. The order is the bug."},
                  {"pic": "\U0001FAA5➡️\U0001F4A7", "label": "brush your teeth, then rinse", "bin": "fine", "why": "Brush, then rinse. That works."},
                  {"pic": "\U0001F9E5➡️\U0001F6B6", "label": "put on your coat, then go outside", "bin": "fine", "why": "Coat first, then out. That works."},
                  {"pic": "\U0001F35E➡️\U0001F6C1", "label": "put bread on the plate, then wash it in the bath", "bin": "bug", "why": "Washing the bread in the bath does not belong. That step is the bug."},
                  {"pic": "\U0001F6AA➡️\U0001F511", "label": "walk through the door, then unlock it", "bin": "bug", "why": "You cannot walk through a locked door. Unlock first. The order is the bug."},
              ]},
             "A bug is a wrong step, or a right step in the wrong place."),

        step("questions", "What would happen?", "\U0001F52E", "Outcome predictor", ["1CT.07", "1CT.02"],
             "If we change the algorithm, what happens? Tap the answer.",
             explain(
                 ["Before you change a step, you can work out what the change will do."],
                 ["Swap jam for honey: a honey sandwich.", "Leave out the water: the seed does not grow.", "Add a hat at the end of getting dressed: a child with a hat on."],
                 [],
                 ["Picture the new steps, then tap."]),
             {"label": "Question", "items": [
                 q("In the sandwich algorithm we swap 'spread the jam' for 'spread honey'. What do we get?", "\U0001F36F", "a honey sandwich", ["a jam sandwich", "no sandwich at all", "a cup of tea"], "Change the filling step and the filling changes."),
                 q("In the seed algorithm we leave out 'water it'. What happens?", "\U0001F331", "the seed does not grow", ["the seed grows anyway", "the pot breaks", "the soil turns blue"], "A seed needs water. Take that step away and the outcome changes."),
                 q("In the tower algorithm we add 'put another brick on' before the flag. What happens?", "\U0001F9F1", "the tower is taller", ["the tower is shorter", "the tower disappears", "nothing changes"], "Add a step and the outcome changes: one more brick, a taller tower."),
                 q("In the getting-dressed algorithm we take out 'put on your coat'. What happens?", "\U0001F976", "you go out with no coat", ["you go out with two coats", "you cannot put on shoes", "you get a hat"], "Leave a step out and its outcome is missing too."),
             ]},
             "Change a step, and you can predict the new outcome."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1CT.06", "1CT.02", "1CT.07"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the socks, the sandwich, the bugs and the changes."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Shoes, then socks. What happens?", "\U0001F45F", "the socks go on the outside", ["you look smart", "nothing, it is fine", "the shoes disappear"], "Same steps, wrong order, silly outcome. Order matters."),
                 q("A mistake in an algorithm is called a...", "\U0001F41B", "bug", ["flag", "brick", "sandwich"], "A bug is a wrong step, or a step in the wrong place."),
                 q("Which step is the bug? Bread, pour milk on the bread, jam, top slice.", "\U0001F95B", "pour milk on the bread", ["bread", "jam", "top slice"], "Milk does not belong in a jam sandwich."),
                 q("To turn a jam sandwich into a cheese sandwich, which step do you change?", "\U0001F9C0", "spread the jam", ["put bread on the plate", "put the top slice on", "none of them"], "The filling step decides what kind of sandwich it is."),
                 q("We add 'cut it in half' to the end of the sandwich algorithm. What do we get?", "\U0001F52A", "two halves", ["no sandwich", "a bigger sandwich", "a cheese sandwich"], "Adding a step changes the outcome: two halves."),
                 q("Crossing the road: which comes FIRST?", "\U0001F6D1", "stop", ["walk", "listen", "run"], "Stop, look, listen, then walk."),
                 q("Drink the juice, then pour it. Fine or a bug?", "\U0001F9C3", "a bug: the order is wrong", ["fine", "a bug: juice is wrong", "there is no such thing"], "There is nothing to drink until you pour. The order is the bug."),
                 q("If you change one step in an algorithm, what happens to the outcome?", "\U0001F504", "it changes", ["it stays exactly the same", "the algorithm breaks", "nothing happens"], "Change a step, change the outcome. That is how you make something new."),
             ]},
             "That is the whole lesson finished. You know that order matters and how to find a bug."),
    ],
}


LESSON["about"] = [
    "Say why the order of the steps matters.",
    "Find the one step in an algorithm that is wrong.",
    "Fix a bug by putting the right step in its place.",
    "Change a step to change what the algorithm makes.",
]

LESSON["lecture"] = [
    part("\U0001F45F", "Socks and shoes",
         "Two steps: put on socks, put on shoes. Do them in that order and you are ready. Do them the other way round and the socks are on the outside of your shoes. Same steps, different order, different outcome."),
    part("\U0001F35E", "A sandwich in order",
         "Bread on the plate. Butter on the bread. Jam on the butter. Top slice on the jam. Every step has its place. Put the top slice on before the jam and the jam is on the outside."),
    part("\U0001F41B", "A bug",
         "A mistake in an algorithm is called a bug. It might be a step that does not belong, like pouring milk on a sandwich. It might be a right step in the wrong place, like the top slice before the jam. Finding the bug is the first job."),
    part("\U0001F527", "Fixing it",
         "When you find the bug, you fix it. Take the wrong step out and put the right one in. Or move the step to where it belongs. Then run the algorithm again and check."),
    part("\U0001F504", "Changing the outcome",
         "You can change an algorithm on purpose. Swap jam for cheese and you get a cheese sandwich. Add a step, cut it in half, and you get two halves. Change a step, change the outcome."),
]

LESSON["words"] = [
    word("order", "\U0001F522", "Which step comes first, next and last.",
         ["The order matters.", "Put the steps in the right order."]),
    word("bug", "\U0001F41B", "A mistake in an algorithm or a program.",
         ["There is a bug in step two.", "Find the bug and fix it."]),
    word("fix", "\U0001F527", "To put a mistake right.",
         ["Fix the bug.", "We fixed the sandwich algorithm."]),
    word("outcome", "\U0001F381", "What you get at the end of an algorithm.",
         ["The outcome was a cheese sandwich.", "Change a step and the outcome changes."]),
    word("change", "\U0001F504", "To make a step different.",
         ["Change the jam step to cheese.", "One change made a new sandwich."]),
    word("swap", "\U0001F501", "To take one step out and put a different one in its place.",
         ["Swap jam for honey.", "Swap the two steps round."]),
]

LESSON["home"] = [
    home("Silly order", "A grown-up",
         ["Your grown-up says the steps of a job in the wrong order: bed, then pyjamas, then teeth.",
          "You shout STOP when you hear the bug.",
          "Say the right order."],
         "How many bugs can you spot before your grown-up finishes?"),
    home("Change one step", "A bowl, cereal, milk, a spoon",
         ["Say the algorithm for a bowl of cereal.",
          "Change ONE step: milk first, or no spoon, or two lots of cereal.",
          "Say what the outcome will be, then try it."],
         "Was the outcome what you predicted?"),
    home("Bug hunt at bedtime", "Paper and a pencil",
         ["Write or draw your bedtime algorithm with one bug hidden in it.",
          "Give it to a grown-up to find the bug.",
          "Swap: they hide a bug for you."],
         "A bug can be a wrong step OR a right step in the wrong place."),
]
