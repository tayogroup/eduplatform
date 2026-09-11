# -*- coding: utf-8 -*-
"""Lesson 5 - Bugs and Debugging.

0059 Stage 1 Programming: 1P.04 programs can contain errors; 1P.05 run
programs to test whether they produce the desired result; 1P.06 identify why
a program does not produce the desired result; 1P.07 'debugging' is the
correction of errors in programs; with 1P.03 and 1CT.02.
"""
from _kit import explain, step, opt, q, s, choice, part, word, home

LESSON = {
    "slug": "bugs-and-debugging",
    "title": "Bugs and Debugging",
    "blurb": "Hear the true story of a real bug found inside a computer, run programs that go wrong, find the block that is the bug, fix it and run it again, and hunt bugs in everyday algorithms too.",
    "steps": [
        step("demo", "The first bug", "\U0001F41B", "The first bug", ["1P.04", "1P.07"],
             "Why do we call a mistake a bug? Press <b>Next</b> and hear a true story.",
             explain(
                 ["A program can have a mistake in it.", "A mistake in a program is called a bug.", "Fixing bugs is called debugging."],
                 ["Long ago, a computer was as big as a room.", "One day it stopped working.", "Inside, the people working on it found a real insect stuck in the machine.",
                  "People already called a mistake in a machine a bug. Now they had found a real one, so they stuck it in their notebook."],
                 ["Children think a bug means the computer is broken.", "Usually the computer is fine. The PROGRAM has a mistake in it."],
                 ["Press Next and meet the real bug."]),
             {"frames": [
                 {"pic": "\U0001F3E2", "cap": "Long ago, a computer was as big as a <b>room</b>.", "say": "Long ago, a computer was as big as a whole room."},
                 {"pic": "❌", "cap": "One day it <b>stopped working</b>.", "say": "One day it stopped working. Nobody knew why.", "sound": "error"},
                 {"pic": "\U0001F41B", "cap": "Inside, they found a real <b>insect</b> stuck in the machine!", "say": "Inside, the people working on it found a real insect stuck in the machine. A moth. A real bug!", "sound": "pop"},
                 {"pic": "\U0001F4DD\U0001F41B", "cap": "People already called a mistake a <b>bug</b>. Now they had a real one! They stuck it in their notebook.", "say": "People already called a mistake in a machine a bug. Now they had found a real one! They stuck the moth in their notebook, and the story made the word famous."},
                 {"pic": "\U0001F527", "cap": "Finding and fixing bugs is called <b>debugging</b>.", "say": "Finding the bug and fixing it is called debugging. Programmers do it every day.", "sound": "tada"},
             ]},
             "A bug is a mistake in a program. Debugging is fixing it."),

        step("debug", "Run it, find the bug, fix it", "\U0001F436", "Debugger", ["1P.04", "1P.05", "1P.06", "1P.07"],
             "Press <b>Run</b> and watch what the dog does. Then find the block that is the bug, and fix it.",
             explain(
                 ["When a program does not do what you wanted, there is a bug in it.", "Run it, watch, find the wrong block, fix it, run it again."],
                 ["We want the dog to move right twice and jump.", "Run it. The dog moves right, then LEFT, then jumps.",
                  "So the second block is the bug: it says move left.", "Change it to move right. Run it again. Now it works."],
                 ["Children guess the bug before running the program.", "Run it first. Watching it go wrong tells you where to look."],
                 ["Run, watch, find, fix, run again."]),
             {"sprite": "\U0001F436", "rounds": [
                 {"goal": "move right twice, then jump", "program": ["right", "left", "jump"], "bug": 1, "expect": ["right", "right", "jump"],
                  "why": "The second block says move left. We wanted a second move right.",
                  "fix": {"opts": [choice("right", "move right", True), choice("spin", "spin", False), choice("shrink", "shrink", False)],
                          "why": "Move right, move right, jump. That is what we wanted."}},
                 {"goal": "say hello, then spin", "program": ["spin", "spin"], "bug": 0, "expect": ["say", "spin"],
                  "why": "The first block spins. We wanted the dog to say hello first.",
                  "fix": {"opts": [choice("say", "say hello", True), choice("jump", "jump", False), choice("left", "move left", False)],
                          "why": "Say hello, then spin. Fixed."}},
                 {"goal": "move right, jump, then grow", "program": ["right", "jump", "shrink"], "bug": 2, "expect": ["right", "jump", "grow"],
                  "why": "The last block shrinks the dog. We wanted it to grow.",
                  "fix": {"opts": [choice("grow", "grow", True), choice("hide", "hide", False), choice("left", "move left", False)],
                          "why": "Move right, jump, grow. Fixed."}},
                 {"goal": "jump, say hello, then jump again", "program": ["jump", "say", "spin"], "bug": 2, "expect": ["jump", "say", "jump"],
                  "why": "The last block spins. We wanted a second jump.",
                  "fix": {"opts": [choice("jump", "jump", True), choice("grow", "grow", False), choice("right", "move right", False)],
                          "why": "Jump, say hello, jump. Fixed."}},
             ]},
             "You ran four programs, found four bugs and fixed them all. That is debugging."),

        step("program", "Test before you trust", "\U0001F431", "Careful tester", ["1P.03", "1P.05"],
             "Build the program, run it, and check the cat did what the algorithm said.",
             explain(
                 ["The way to find out if a program works is to run it and watch.", "Never trust a program you have not tested."],
                 ["Build the blocks for the algorithm.", "Before you run it, say what the cat will do.", "Run it.", "Did it match? Then it works."],
                 ["Children stop after building.", "Building is half. Running it is the test."],
                 ["Build, predict, run, check."]),
             {"sprite": "\U0001F431", "spriteName": "cat", "blocks": ["right", "left", "jump", "say", "spin", "grow", "shrink"],
              "rounds": [
                  {"algorithm": ["Say hello", "Jump"], "expect": ["say", "jump"]},
                  {"algorithm": ["Move left", "Grow", "Spin"], "expect": ["left", "grow", "spin"]},
                  {"given": ["jump", "jump", "say"],
                   "predict": {"ask": "What will the cat do when this program runs?",
                               "opts": [opt("Jump twice, then say hello", True), opt("Say hello, then jump twice", False), opt("Grow and spin", False)],
                               "why": "Jump, jump, say hello. The blocks run in order."}},
              ]},
             "Built, predicted, run, checked. Every program tested."),

        step("bugs", "Bugs in everyday algorithms", "\U0001F9FC", "Bug hunter", ["1CT.02"],
             "Bugs can hide in everyday algorithms too. Find the one wrong step in each.",
             explain(
                 ["An everyday algorithm can have a bug just like a program can."],
                 ["Eating the soap does not belong in washing your hands.", "Rinsing before you rub is a step in the wrong place.",
                  "Find the step, then fix it or move it."],
                 ["Children look for a step that sounds silly.", "Sometimes the bug is a perfectly good step in the wrong place."],
                 ["Read all the steps, then tap the bug."]),
             {"scene": "handwash", "rounds": [
                 {"goal": "Wash your hands",
                  "steps": [s("tap", "Turn the tap on", "\U0001F6B0"), s("soap", "Put soap on your hands", "\U0001F9FC"), s("eat", "Eat the soap", "\U0001F60B"), s("rinse", "Rinse under the water", "\U0001F4A7"), s("dry", "Dry them on the towel", "\U0001F9FB")],
                  "wrong": 2, "why": "Eating the soap does not belong in this algorithm. That step is the bug.",
                  "fix": {"opts": [choice("rub", "Rub your hands together", True, "\U0001F450"), choice("dry", "Dry them on the towel", False, "\U0001F9FB"), choice("tap", "Turn the tap on again", False, "\U0001F6B0")],
                          "why": "Rubbing the soap round is the step that was missing."},
                  "done": "Tap, soap, rub, rinse, dry. Clean hands."},
                 {"goal": "Wash your hands",
                  "steps": [s("tap", "Turn the tap on", "\U0001F6B0"), s("soap", "Put soap on your hands", "\U0001F9FC"), s("rinse", "Rinse under the water", "\U0001F4A7"), s("rub", "Rub your hands together", "\U0001F450"), s("dry", "Dry them on the towel", "\U0001F9FB")],
                  "wrong": 2, "swap": True, "why": "Rinse is too early. Rinsing before rubbing washes the soap away before it has done anything.",
                  "done": "Rub first, then rinse. The right order."},
                 {"goal": "Wash your hands",
                  "steps": [s("tap", "Turn the tap on", "\U0001F6B0"), s("fridge", "Put your hands in the fridge", "\U0001F9CA"), s("rub", "Rub your hands together", "\U0001F450"), s("rinse", "Rinse under the water", "\U0001F4A7"), s("dry", "Dry them on the towel", "\U0001F9FB")],
                  "wrong": 1, "why": "The fridge does not belong in washing your hands. That step is the bug.",
                  "fix": {"opts": [choice("soap", "Put soap on your hands", True, "\U0001F9FC"), choice("dry", "Dry them on the towel", False, "\U0001F9FB"), choice("eat", "Eat a biscuit", False, "\U0001F36A")],
                          "why": "Soap is the step that was missing, before the rubbing."},
                  "done": "Tap, soap, rub, rinse, dry."},
             ]},
             "Bugs hide in everyday algorithms too, and you can find them."),

        step("sort", "Bug, or it works?", "\U0001F5C2️", "Bug or works", ["1P.04", "1P.06"],
             "We wanted one thing and the program did another. Or did it? Tap the bin.",
             explain(
                 ["A program has a bug when it does NOT do what we wanted.", "If it did what we wanted, it works, even if it looks odd."],
                 ["We wanted a jump and it jumped: works.", "We wanted hello and it said nothing: bug.", "We wanted Robo at the flower and Robo hit the wall: bug."],
                 ["Children call anything surprising a bug.", "Compare what happened with what we WANTED. That is the test."],
                 ["Read what we wanted, read what happened, then tap."]),
             {"ask": "Does the program work, or is there a bug?",
              "bins": [{"id": "works", "label": "It works", "pic": "✅"}, {"id": "bug", "label": "A bug", "pic": "\U0001F41B"}],
              "items": [
                  {"pic": "\U0001F436⬆️", "label": "we wanted the dog to jump; it jumped", "bin": "works", "why": "It did what we wanted. It works."},
                  {"pic": "\U0001F431\U0001F4AC", "label": "we wanted the cat to say hello; it said nothing", "bin": "bug", "why": "We wanted hello and got nothing. A bug."},
                  {"pic": "\U0001F916\U0001F9F1", "label": "we wanted Robo at the flower; Robo bumped into the wall", "bin": "bug", "why": "Robo did not reach the flower. A bug in the program."},
                  {"pic": "\U0001F431\U0001F53C", "label": "we wanted the cat to grow; it grew", "bin": "works", "why": "It did what we wanted. It works."},
                  {"pic": "\U0001F916⬆️⬆️", "label": "we wanted three forwards; Robo did two and stopped", "bin": "bug", "why": "One forward is missing. A bug."},
                  {"pic": "\U0001F436➡️", "label": "we wanted the dog to move right; it moved right", "bin": "works", "why": "It did what we wanted. It works."},
              ]},
             "A bug is when the program does not do what we wanted."),

        step("questions", "Why did it go wrong?", "\U0001F50D", "Why detective", ["1P.06"],
             "The program went wrong. Why? Tap the reason.",
             explain(
                 ["Finding a bug means saying WHY the program went wrong.", "Compare the program with what we wanted, block by block."],
                 ["We wanted three forwards and wrote two: one is missing.", "We wanted a jump and wrote move right: the wrong block.",
                  "We wanted a turn before the forward and left it out: a missing block."],
                 [],
                 ["Read the program, read what we wanted, find the difference."]),
             {"label": "Question", "items": [
                 q("We wanted Robo to reach a flower 3 squares ahead. The program was: forward, forward. Why did Robo stop short?", "\U0001F916", "one forward is missing", ["there are too many forwards", "the flower moved", "Robo was tired"], "Three squares need three forwards. The program has two."),
                 q("We wanted the cat to jump. The program was: move right. Why was there no jump?", "\U0001F431", "the block says move right, not jump", ["the cat cannot jump", "jumping is not a block", "the program is too long"], "The wrong block was used. Move right is not jump."),
                 q("We wanted: move right, move right. The cat went right, then left. Why?", "➡️⬅️", "the second block is move left", ["the first block is wrong", "the cat is upside down", "two blocks is too many"], "The second block says left instead of right."),
                 q("We wanted Robo to turn, then go forward. Robo went straight into the wall. Why?", "\U0001F9F1", "the turn block is missing", ["the wall is too big", "forward is the wrong block", "Robo does not like turns"], "Without the turn, forward goes straight on, into the wall."),
             ]},
             "Compare the program with what you wanted. The difference is the bug."),

        step("context", "Real programmers debug", "\U0001F469‍\U0001F4BB", "Real debuggers", ["1P.07", "1P.04"],
             "Every programmer finds bugs in their programs. Tap each one.",
             explain(
                 ["Even expert programmers write programs with bugs.", "The difference is that they test, find the bugs, and fix them."],
                 ["A games maker tests a game and finds a door that will not open.", "An app on a phone crashes, and the programmers send out a fix.",
                  "A car's computer gets an update that fixes a bug.", "Before a rocket launches, its programs are tested again and again."],
                 [],
                 ["Tap each one and hear how the bug was found."]),
             {"items": [
                 {"pic": "\U0001F3AE", "label": "a games maker", "say": "A games maker plays her own game to test it. A door will not open. She finds the bug in the door's program and fixes it."},
                 {"pic": "\U0001F4F1", "label": "an app that crashed", "say": "An app on a phone keeps closing by itself. The programmers find the bug and send everyone a fix. That is an update."},
                 {"pic": "\U0001F697", "label": "a car's computer", "say": "A car has computers inside. When a bug is found, the garage loads a fixed program into the car."},
                 {"pic": "\U0001F680", "label": "a rocket", "say": "A rocket's programs are tested hundreds of times before launch, because a bug cannot be fixed while the rocket is flying."},
             ], "need": 4,
              "then": {"ask": "A programmer finds a bug in a program. What do they do?",
                       "opts": [opt("Find why it went wrong, fix it, and test it again: debugging", True), opt("Throw the computer away", False), opt("Hide the program", False)],
                       "why": "Debugging is finding the error, correcting it, and testing again."}},
             "Every programmer debugs. It is part of the job."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1P.04", "1P.05", "1P.06", "1P.07"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the moth, the dog's programs, and run, find, fix, run again."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A mistake in a program is called a...", "\U0001F41B", "bug", ["flower", "block", "grid"], "A bug is a mistake in a program."),
                 q("Fixing the mistakes in a program is called...", "\U0001F527", "debugging", ["running", "predicting", "sorting"], "Debugging is finding and fixing the bugs."),
                 q("Can a program have a mistake in it?", "❓", "yes, programs can contain errors", ["no, never", "only on Mondays", "only if the computer is old"], "Programs can contain errors. Even expert programmers make them."),
                 q("How do you find out if a program works?", "▶️", "run it and watch", ["look at the blocks and guess", "ask the cat", "wait a day"], "Running the program is how you test it."),
                 q("We wanted: right, right, jump. The dog did: right, left, jump. Which block is the bug?", "\U0001F436", "the second block", ["the first block", "the third block", "none of them"], "The second block says left instead of right."),
                 q("You have fixed the bug. What do you do next?", "\U0001F504", "run the program again to test it", ["nothing, it must be fine", "delete the program", "add more blocks"], "Test again after every fix."),
                 q("Inside an old computer, people once found...", "\U0001F3E2", "a real insect, a moth", ["a cat", "a flower", "a sandwich"], "A real moth was stuck inside. People already called a mistake a bug, so now they had a real one!"),
                 q("A program did exactly what we wanted. Does it have a bug?", "✅", "no, it works", ["yes, every program has bugs", "yes, if it was quick", "maybe, ask a grown-up"], "If it did what we wanted, it works. A bug is when it does not."),
             ]},
             "That is the whole lesson finished. You can find a bug and fix it."),
    ],
}


LESSON["about"] = [
    "Say that a program can have a mistake in it, called a bug.",
    "Run a program to find out whether it does what you wanted.",
    "Say why a program went wrong: which block is the bug.",
    "Fix the bug and run the program again. That is debugging.",
]

LESSON["lecture"] = [
    part("\U0001F41B", "The first bug",
         "Long ago a computer was as big as a room. One day it stopped working, and inside it the people working on it found a real insect, a moth. People already called a mistake in a machine a bug, so now they had a real one! They stuck it in their notebook, and the story made the word famous. Today a mistake in a program is called a bug."),
    part("▶️", "Run it to test it",
         "You cannot tell if a program works by looking at it. You run it and watch. If the dog does what we wanted, the program works. If it does something else, there is a bug."),
    part("\U0001F50D", "Find the bug",
         "Compare the program with what we wanted, block by block. We wanted move right twice and jump. The dog went right, then left. So the second block is the bug. It says left."),
    part("\U0001F527", "Fix it and run again",
         "Change the wrong block for the right one. Then run the program again to check. Finding the bug and fixing it is called debugging."),
    part("\U0001F469‍\U0001F4BB", "Everyone debugs",
         "Every programmer writes bugs, even the experts who make games and rockets. The good ones test their programs, find the bugs and fix them. Debugging is part of the job, not a failure."),
]

LESSON["words"] = [
    word("bug", "\U0001F41B", "A mistake in a program or an algorithm.",
         ["The second block is the bug.", "Every program can have a bug."]),
    word("debug", "\U0001F527", "To find the bugs in a program and fix them.",
         ["Let us debug it.", "She debugged the game."]),
    word("error", "❌", "Another word for a mistake.",
         ["There is an error in step two.", "The program has an error."]),
    word("test", "\U0001F50E", "To run a program and check it did what you wanted.",
         ["Test it before you trust it.", "The test found a bug."]),
    word("run", "\U0001F3C3", "To make the computer do the program.",
         ["Run it and watch.", "Run it again after the fix."]),
    word("program", "▶️", "Code that a computer runs.",
         ["The program has a bug.", "Fix the program and run it."]),
]

LESSON["home"] = [
    home("Debug a grown-up", "Paper cards with instructions, a grown-up",
         ["Write a four-card program for making a drink, with ONE wrong card in it.",
          "Your grown-up runs the program exactly, wrong card and all.",
          "Say which card is the bug. Swap it. Run it again."],
         "Did the drink come out right the second time? That is debugging."),
    home("Test it", "A toy car or a ball, some tape",
         ["Write a program to get the car from the door to the table: forward 3, turn right, forward 2.",
          "Run it by pushing the car one step per instruction.",
          "Did it arrive? If not, find which instruction is wrong."],
         "A program you have not run is a program you have not tested."),
    home("Bug in a song", "A song you know well",
         ["Sing a song you know with one word changed.",
          "A grown-up shouts BUG when they hear it and says the right word.",
          "Swap over."],
         "Finding the bug means saying WHAT is wrong, not just that something is."),
]
