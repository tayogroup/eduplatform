# -*- coding: utf-8 -*-
"""Lesson 2 - Bugs and Predictions.

0059 Stage 2 Computational Thinking: 2CT.02 identify AND correct a single
error in algorithms for everyday tasks; 2CT.05 predict the outputs of
algorithms; 2CT.01 follow and understand linear algorithms; 2CT.03 precise
instructions.
"""
from _kit import explain, step, opt, q, s, choice, part, word, home

LESSON = {
    "slug": "bugs-and-predictions",
    "title": "Bugs and Predictions",
    "blurb": "Work out what an algorithm will produce before it runs, find and correct the one wrong step in a cup of tea and a bedtime, and tell a precise instruction from a vague one.",
    "steps": [
        step("demo", "Predict the output", "\U0001F52E", "Output predictor", ["2CT.05"],
             "An algorithm has an OUTPUT: what you have at the end. Press <b>Next</b> and predict it.",
             explain(
                 ["The output of an algorithm is what you get when every step is done.", "You can work it out BEFORE you do the steps. That is predicting."],
                 ["Take two apples. Take three more. Give one to Sami.", "Two, then five, then four.", "The output is four apples."],
                 ["Children guess the output from the last step only.", "Follow every step with your finger, from the first."],
                 ["Press Next and count along."]),
             {"frames": [
                 {"pic": "\U0001F4DD", "cap": "The algorithm: 1. take 2 apples. 2. take 3 more. 3. give 1 to Sami.", "say": "Here is an algorithm. One: take two apples. Two: take three more. Three: give one to Sami. What is the output? Let us follow it."},
                 {"pic": "\U0001F34E\U0001F34E", "cap": "Step 1: <b>2</b> apples.", "say": "Step one. Two apples.", "sound": "pop"},
                 {"pic": "\U0001F34E\U0001F34E\U0001F34E\U0001F34E\U0001F34E", "cap": "Step 2: 2 + 3 = <b>5</b> apples.", "say": "Step two. Three more. Five apples.", "sound": "pop"},
                 {"pic": "\U0001F34E\U0001F34E\U0001F34E\U0001F34E", "cap": "Step 3: give one away. <b>4</b> apples. That is the output.", "say": "Step three. Give one to Sami. Four apples. Four is the output of this algorithm.", "sound": "tada"},
             ]},
             "Follow every step with your finger and you can predict the output."),

        step("questions", "What is the output?", "\U0001F9EE", "Output detective", ["2CT.05", "2CT.01"],
             "Follow each algorithm in your head. What is the output? Tap the answer.",
             explain(
                 ["Read every step. Keep count as you go. The output is where you end up."],
                 ["Start with 5 counters, take 2 away, add 4: five, three, seven.", "Turn right four times and you face where you started."],
                 ["Children stop reading after the first two steps.", "The last step changes the answer as much as the first."],
                 ["Finger on the first step, then the next, then tap."]),
             {"label": "Question", "items": [
                 q("<ol><li>Start with 5 counters.</li><li>Take 2 away.</li><li>Add 4.</li></ol>How many counters at the end?", "\U0001F7E2", "7", ["3", "9", "5"], "Five, take two is three, add four is seven."),
                 q("<ol><li>Stand facing the door.</li><li>Turn right.</li><li>Turn right.</li><li>Turn right.</li><li>Turn right.</li></ol>Which way are you facing?", "\U0001F6AA", "the door", ["the window", "the wall", "the floor"], "Four right turns is a whole circle. You face the door again."),
                 q("<ol><li>Draw a big circle.</li><li>Draw a small circle inside it.</li><li>Colour the small circle red.</li></ol>What have you drawn?", "\U0001F3AF", "a target with a red middle", ["a red square", "a face", "two red circles"], "A circle inside a circle, red in the middle: a target."),
                 q("<ol><li>Say hop.</li><li>Say hop.</li><li>Say hop.</li><li>Say stop.</li></ol>What is the LAST word you say?", "\U0001F5E3️", "stop", ["hop", "go", "nothing"], "The last step says stop."),
                 q("<ol><li>Put on one sock.</li><li>Put on the other sock.</li><li>Take one sock off.</li></ol>How many socks are on?", "\U0001F9E6", "1", ["2", "0", "3"], "Two on, one off, one left on."),
             ]},
             "You predicted five outputs by following the steps."),

        step("bugs", "Find the bug and fix it: a cup of tea", "☕", "Tea debugger", ["2CT.02", "2CT.03"],
             "Each tea algorithm has one wrong step. Find it, then choose what it should be, and watch the fixed algorithm run.",
             explain(
                 ["Finding the bug is half the job. Correcting it is the other half."],
                 ["A sock in the cup does not belong: change it to a tea bag.", "Water before the cup is a step in the wrong place: move it.",
                  "Then run the fixed algorithm and check the cup."],
                 ["Children find the bug and stop.", "An algorithm with a bug you have found is still an algorithm with a bug. Fix it."],
                 ["Tap the bug, then fix it."]),
             {"scene": "tea", "rounds": [
                 {"goal": "Make a cup of tea",
                  "steps": [s("cup", "Get a cup", "☕"), s("sock", "Put a sock in the cup", "\U0001F9E6"), s("water", "Pour in the hot water", "\U0001F4A7"), s("milk", "Add a little milk", "\U0001F95B")],
                  "wrong": 1, "why": "A sock in the cup does not belong in a tea algorithm. That step is the bug.",
                  "fix": {"opts": [choice("bag", "Put a tea bag in the cup", True, "\U0001F9FA"), choice("stir", "Stir the empty cup", False, "\U0001F944"), choice("cake", "Put a cake in the cup", False, "\U0001F370")],
                          "why": "A tea bag in the cup is the step that was missing."},
                  "done": "Cup, tea bag, water, milk. Tea."},
                 {"goal": "Make a cup of tea",
                  "steps": [s("water", "Pour in the hot water", "\U0001F4A7"), s("cup", "Get a cup", "☕"), s("bag", "Put a tea bag in the cup", "\U0001F9FA"), s("milk", "Add a little milk", "\U0001F95B")],
                  "wrong": 0, "swap": True, "why": "Pouring the water comes too early: there is no cup yet, so it goes on the table.",
                  "done": "Cup first, then the water goes IN it."},
                 {"goal": "Make a cup of tea",
                  "steps": [s("cup", "Get a cup", "☕"), s("bag", "Put a tea bag in the cup", "\U0001F9FA"), s("water", "Pour in the hot water", "\U0001F4A7"), s("milk", "Add a little milk", "\U0001F95B"), s("shoe", "Stir it with a shoe", "\U0001F45F")],
                  "wrong": 4, "why": "Stirring with a shoe is the wrong step. A shoe does not belong in tea.",
                  "fix": {"opts": [choice("stir", "Stir it with a spoon", True, "\U0001F944"), choice("sock", "Put a sock in it", False, "\U0001F9E6"), choice("water", "Pour in more water", False, "\U0001F4A7")],
                          "why": "A spoon stirs the tea."},
                  "done": "Stirred with a spoon. A proper cup of tea."},
             ]},
             "Three bugs found, three bugs corrected."),

        step("bugs", "Find the bug and fix it: bedtime", "\U0001F6CF️", "Bedtime debugger", ["2CT.02"],
             "One wrong step in each bedtime algorithm. Find it and fix it.",
             explain(
                 ["A bug can be a wrong step, or a right step in the wrong place."],
                 ["A big cake at bedtime does not belong.", "Lights off before you are in bed is a right step too early."],
                 [],
                 ["Read every step first. Only one is wrong."]),
             {"scene": "bed", "rounds": [
                 {"goal": "Get ready for bed",
                  "steps": [s("pyjamas", "Put on pyjamas", "\U0001F454"), s("cake", "Eat a big cake", "\U0001F370"), s("story", "Read a story", "\U0001F4D6"), s("bed", "Get into bed", "\U0001F6CF️"), s("lights", "Lights off", "\U0001F4A1")],
                  "wrong": 1, "why": "A big cake at bedtime does not belong. That step is the bug.",
                  "fix": {"opts": [choice("teeth", "Brush your teeth", True, "\U0001F9B7"), choice("tv", "Watch television for an hour", False, "\U0001F4FA"), choice("coat", "Put on your coat", False, "\U0001F9E5")],
                          "why": "Brushing your teeth is the step that belongs there."},
                  "done": "Pyjamas, teeth, story, bed, lights off."},
                 {"goal": "Get ready for bed",
                  "steps": [s("pyjamas", "Put on pyjamas", "\U0001F454"), s("teeth", "Brush your teeth", "\U0001F9B7"), s("story", "Read a story", "\U0001F4D6"), s("lights", "Lights off", "\U0001F4A1"), s("bed", "Get into bed", "\U0001F6CF️")],
                  "wrong": 3, "swap": True, "why": "Lights off comes too early. You would be climbing into bed in the dark.",
                  "done": "Into bed, THEN lights off."},
             ]},
             "You found the bug and corrected it, both ways round."),

        step("sort", "Precise, or vague?", "\U0001F5C2️", "Precise or vague", ["2CT.03"],
             "Could Robo follow this without asking a question? Precise, or vague?",
             explain(
                 ["A precise instruction leaves nothing to guess.", "A vague one leaves Robo asking: which? where? how many?"],
                 ["Turn left at the shop: precise.", "Go somewhere: vague.", "Add two spoons of sugar: precise.", "Add some stuff: vague."],
                 ["Children think a long instruction is always precise.", "Ask whether anything is left to guess."],
                 ["Read it, ask 'anything to guess?', then tap the bin."]),
             {"ask": "Precise, or vague?",
              "bins": [{"id": "precise", "label": "Precise", "pic": "\U0001F3AF"}, {"id": "vague", "label": "Vague", "pic": "\U0001F32B️"}],
              "items": [
                  {"pic": "\U0001F3EA", "label": "turn left at the shop", "bin": "precise", "why": "Which way and where. Precise."},
                  {"pic": "\U0001F937", "label": "go somewhere", "bin": "vague", "why": "Where? Vague."},
                  {"pic": "\U0001F463", "label": "take three steps forward", "bin": "precise", "why": "How many and which way. Precise."},
                  {"pic": "\U0001F6B6", "label": "walk a bit", "bin": "vague", "why": "How far? Which way? Vague."},
                  {"pic": "☕", "label": "put the cup on the table", "bin": "precise", "why": "What and where. Precise."},
                  {"pic": "\U0001F449", "label": "put it there", "bin": "vague", "why": "Put what, where? Vague."},
                  {"pic": "\U0001F944", "label": "add two spoons of sugar", "bin": "precise", "why": "How much of what. Precise."},
                  {"pic": "\U0001F4E6", "label": "add some stuff", "bin": "vague", "why": "Some of what? Vague."},
              ]},
             "Precise leaves nothing to guess. Vague leaves everything."),

        step("follow", "Follow it exactly: a cheese sandwich", "\U0001F9C0", "Exact follower", ["2CT.01"],
             "Five steps this time, including cutting it in half. Tap the step that comes next.",
             explain(
                 ["Understanding an algorithm means knowing what each step does AND why it comes where it does."],
                 ["Bread, butter, cheese, top slice, then cut it in half.", "You cannot cut a sandwich that has no top yet."],
                 [],
                 ["Tap the steps in the order the algorithm shows."]),
             {"scene": "sandwich", "steps": [
                 s("bread", "Put a slice of bread on the plate", "\U0001F35E", "Bread on the plate."),
                 s("butter", "Spread the butter", "\U0001F9C8", "Butter on."),
                 s("cheese", "Put the cheese on", "\U0001F9C0", "Cheese on the butter."),
                 s("top", "Put the top slice on", "\U0001F96A", "Top slice on."),
                 s("cut", "Cut it in half", "\U0001F52A", "Cut in half. Two halves."),
             ]},
             "Followed exactly, in a straight line, to two halves."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2CT.02", "2CT.05", "2CT.01", "2CT.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about outputs, bugs and precise instructions."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("The OUTPUT of an algorithm is...", "\U0001F381", "what you have when every step is done", ["the first step", "the picture on the page", "a kind of bug"], "The output is what the algorithm produces at the end."),
                 q("Start with 3 sweets. Add 2. Eat 1. What is the output?", "\U0001F36C", "4 sweets", ["5 sweets", "3 sweets", "6 sweets"], "Three, five, four."),
                 q("A bug in an algorithm is...", "\U0001F41B", "a step that is wrong, or in the wrong place", ["the last step", "an insect on the page", "a good step"], "A wrong step, or a right step in the wrong place."),
                 q("You found the bug. What comes next?", "\U0001F527", "correct it, then run the algorithm again", ["nothing, finding it is enough", "start a new algorithm", "shout"], "Finding is half the job; correcting is the other half."),
                 q("Water before the cup. What kind of bug is that?", "☕", "a right step in the wrong place", ["a step that does not belong", "not a bug", "a spelling mistake"], "Pouring water is right; doing it before the cup is wrong."),
                 q("Which instruction is vague?", "\U0001F32B️", "go somewhere", ["turn left at the shop", "take three steps forward", "put the cup on the table"], "Somewhere could be anywhere."),
                 q("Turn right four times. Which way do you face?", "\U0001F504", "the way you started", ["left", "backwards", "up"], "Four right turns make a full circle."),
                 q("A linear algorithm is followed...", "➡️", "one step after another, in a line", ["backwards", "all at once", "in any order"], "Linear: a straight line of steps."),
             ]},
             "That is the whole lesson finished. You can predict outputs and correct bugs."),
    ],
}


LESSON["about"] = [
    "Predict what an algorithm will produce by following its steps.",
    "Find the one wrong step in an algorithm and correct it.",
    "Tell a precise instruction from a vague one.",
    "Follow and understand a longer linear algorithm.",
]

LESSON["lecture"] = [
    part("\U0001F52E", "Output",
         "The output of an algorithm is what you have when every step is done. Take two apples, take three more, give one away: the output is four apples. You can work it out before you do it, by following each step with your finger."),
    part("\U0001F41B", "A bug",
         "A bug is a step that is wrong, or a right step in the wrong place. A sock in the cup is a wrong step. Water before the cup is a right step too early. Both are bugs, and both stop the tea."),
    part("\U0001F527", "Correcting it",
         "Finding the bug is half the job. Then you correct it: swap the wrong step for the right one, or move the early step to where it belongs. Then run the algorithm again to check."),
    part("\U0001F3AF", "Precise, not vague",
         "Turn left at the shop is precise. Go somewhere is vague. A precise instruction leaves nothing to guess. Robo can follow a precise one. A vague one makes Robo guess, and Robo guesses badly."),
    part("➡️", "Linear algorithms",
         "A linear algorithm is a straight line of steps: bread, butter, cheese, top, cut. Understanding it means knowing what each step does and why it comes where it does. You cannot cut a sandwich with no top."),
]

LESSON["words"] = [
    word("output", "\U0001F381", "What an algorithm produces when every step is done.",
         ["The output is four apples.", "Predict the output."]),
    word("predict", "\U0001F52E", "To say what will happen before it happens.",
         ["Predict the output of the algorithm.", "My prediction was right."]),
    word("bug", "\U0001F41B", "A step that is wrong, or in the wrong place.",
         ["The sock is the bug.", "Find the bug."]),
    word("correct", "\U0001F527", "To put a mistake right.",
         ["Correct the bug, then run it again.", "She corrected the algorithm."]),
    word("precise", "\U0001F3AF", "Exact, with nothing left to guess.",
         ["Turn left at the shop is precise.", "Be precise."]),
    word("vague", "\U0001F32B️", "Not clear; leaving things to guess.",
         ["Go somewhere is vague.", "Robo cannot follow a vague instruction."]),
]

LESSON["home"] = [
    home("Predict, then do", "Counters, buttons or sweets",
         ["A grown-up writes a three-step algorithm: start with 6, take away 2, add 3.",
          "Say the output BEFORE you touch the counters.",
          "Then do the steps and check."],
         "Did your prediction match? Try a four-step one."),
    home("Bug in the routine", "A grown-up",
         ["Your grown-up says a routine with one bug in it: cup, water, tea bag, milk.",
          "Say which step is the bug and whether it is wrong or just too early.",
          "Say the corrected routine."],
         "Some bugs are wrong steps; some are right steps in the wrong place."),
    home("Precise or vague hunt", "A day at home",
         ["Listen out for instructions people give: 'put it there', 'tidy up a bit', 'put the cup on the table'.",
          "Say which ones are precise and which are vague.",
          "Make a vague one precise."],
         "'Tidy up a bit' becomes 'put the books on the shelf'."),
]
