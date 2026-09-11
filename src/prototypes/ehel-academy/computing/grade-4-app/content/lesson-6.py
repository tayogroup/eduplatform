# -*- coding: utf-8 -*-
"""Lesson 6 - Inputs, Outputs and Parts.

0059 Stage 4 Programming: 4P.05 develop programs that produce different
outputs from different inputs; 4P.06 plan the instructions for objects
within programs, identifying their inputs and outputs; 4P.07 test different
parts of a program systematically to identify and debug errors.
"""
from _kit import explain, step, opt, q, choice, part, word, home

LESSON = {
    "slug": "inputs-outputs-and-parts",
    "title": "Inputs, Outputs and Parts",
    "blurb": "Give one sprite a different script for each input, plan an object by naming its input and its output, and test a program part by part to find exactly where a bug is.",
    "steps": [
        step("context", "Inputs to a program", "\U0001F4E5", "Input spotter", ["4P.05"],
             "A program can wait for an input - a key, a button, a click - and do something different for each. Tap each one.",
             explain(
                 ["In a game, pressing A does one thing and pressing B does another. The input picks which script runs."],
                 ["Press A: the cat jumps. Press B: the cat spins. Same cat, two scripts, and the button decides.",
                  "Click the cat: it says hello. Press the space bar: it hides."],
                 ["Children think one program can only do one thing.", "One program, many inputs, a script for each."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F170️", "label": "press A", "say": "Press A. When the A key is pressed, its script runs: the cat jumps."},
                 {"pic": "\U0001F171️", "label": "press B", "say": "Press B. A different script: the cat spins. The same cat, but a different input runs a different script."},
                 {"pic": "\U0001F5B1️", "label": "click the sprite", "say": "Click the sprite. That is an input too. When the cat is clicked, it says hello."},
                 {"pic": "⌨️", "label": "press the space bar", "say": "Press the space bar. Its script makes the cat hide. Four inputs, four different outputs."},
             ], "need": 4,
              "then": {"ask": "Pressing A makes the cat jump and pressing B makes it spin. What decides which happens?",
                       "opts": [opt("The input: which key was pressed", True), opt("The cat", False), opt("Luck", False)],
                       "why": "Each input has its own script. The input picks the output."}},
             "Each input runs its own script."),

        step("inputprog", "A script for each input", "\U0001F3AE", "Input programmer", ["4P.05"],
             "Build a script for <b>A</b> and a different script for <b>B</b>. Then press each input and watch: each one runs only its own script.",
             explain(
                 ["Choose the input tab, build its script from the algorithm, then choose the other tab and build that one.", "Press A and press B to test. Each input runs only its own script."],
                 ["When A is pressed: jump, say hello. When B is pressed: spin, grow.", "Press A: jump, hello. Press B: spin, grow. Different inputs, different outputs."],
                 ["Children build both scripts under one tab.", "Each tab is one input. Check which tab is lit before you add a block."],
                 ["Tab, build, tab, build, then press both."]),
             {"inputs": [{"id": "a", "label": "the A key is pressed", "pic": "\U0001F170️"}, {"id": "b", "label": "the B key is pressed", "pic": "\U0001F171️"}],
              "blocks": ["right", "left", "jump", "spin", "say", "grow", "shrink", "hide", "repeat2", "repeat3"],
              "rounds": [
                  {"scripts": {"a": {"algorithm": ["Jump", "Say hello"], "expect": ["jump", "say"]},
                               "b": {"algorithm": ["Spin", "Grow"], "expect": ["spin", "grow"]}}},
                  {"scripts": {"a": {"algorithm": ["Move right 2 times"], "expect": ["repeat2", "right"]},
                               "b": {"algorithm": ["Move left 3 times", "Say hello"], "expect": ["repeat3", "left", "say"]}}},
                  {"scripts": {"a": {"algorithm": ["Grow", "Say hello"], "expect": ["grow", "say"]},
                               "b": {"algorithm": ["Shrink", "Hide"], "expect": ["shrink", "hide"]}}},
              ]},
             "Two inputs, two scripts, two outputs."),

        step("plan", "Plan the object", "\U0001F4CB", "Object planner", ["4P.06"],
             "Before you program an object, plan it: what is its INPUT, and what is its OUTPUT? Answer both for each object.",
             explain(
                 ["Planning an object means deciding what it responds to - its input - and what it does - its output - before you build."],
                 ["The cat in a game: input, the A key; output, a jump.", "A door in a game: input, the player touching it; output, it opens and plays a creak."],
                 ["Children plan the output and forget the input.", "Nothing happens without an input. Plan both."],
                 ["Read the goal, pick the input, pick the output."]),
             {"rounds": [
                 {"object": "the cat", "pic": "\U0001F431", "goal": "the cat jumps when the player presses A",
                  "input": {"ask": "What is the cat's INPUT?", "opts": [opt("The A key being pressed", True), opt("The jump", False), opt("The colour of the cat", False)], "why": "The input is what the object responds to: the key press."},
                  "output": {"ask": "What is the cat's OUTPUT?", "opts": [opt("A jump", True), opt("The A key", False), opt("The player", False)], "why": "The output is what the object does: it jumps."}},
                 {"object": "the door", "pic": "\U0001F6AA", "goal": "the door opens with a creak when the player walks into it",
                  "input": {"ask": "What is the door's INPUT?", "opts": [opt("The player touching it", True), opt("The creak", False), opt("The door opening", False)], "why": "The door responds to being touched."},
                  "output": {"ask": "What is the door's OUTPUT?", "opts": [opt("It opens and plays a creak", True), opt("The player walking", False), opt("The A key", False)], "why": "Opening and the creak are what the door does."}},
                 {"object": "the score sign", "pic": "\U0001F522", "goal": "the score sign adds one when the ball hits the goal",
                  "input": {"ask": "What is the score sign's INPUT?", "opts": [opt("The ball hitting the goal", True), opt("The number going up", False), opt("The crowd", False)], "why": "It responds to the ball hitting the goal."},
                  "output": {"ask": "What is the score sign's OUTPUT?", "opts": [opt("The number goes up by one", True), opt("The ball", False), opt("The goal", False)], "why": "Showing the new number is what it does."}},
             ]},
             "Three objects planned: an input and an output each."),

        step("parttest", "Test it part by part", "\U0001F9EA", "Part tester", ["4P.07"],
             "The program is in named parts. Run each part on its own to see which one goes wrong, fix the block in that part, and run the part again.",
             explain(
                 ["Testing systematically means testing one part at a time, so you know exactly which part has the bug."],
                 ["Part 1: reset. Part 2: the jumps. Part 3: the greeting. Run part 1: fine. Run part 2: it spins instead of jumping. The bug is in part 2.",
                  "Fix that block, run part 2 again, then run the whole thing."],
                 ["Children run the whole program, see it go wrong, and guess.", "Run the parts one at a time. The part that fails holds the bug."],
                 ["Run each part, find the one that fails, fix, run again."]),
             {"sprite": "\U0001F431",
              "rounds": [
                  {"goal": "go home, jump twice, then say hello",
                   "parts": [
                       {"name": "Part 1: reset", "wants": "the cat goes home", "program": ["home"], "expect": ["home"]},
                       {"name": "Part 2: the jumps", "wants": "the cat jumps twice", "program": ["repeat2", "spin"], "expect": ["repeat2", "jump"], "bug": 1,
                        "why": "This part spins. We wanted jumps.",
                        "fix": {"opts": [choice("jump", "jump", True), choice("grow", "grow", False), choice("hide", "hide", False)], "why": "Repeat 2 times, jump. Run the part again."}},
                       {"name": "Part 3: the greeting", "wants": "the cat says hello", "program": ["say"], "expect": ["say"]},
                   ]},
                  {"goal": "move right 3 times, grow, then move left 3 times",
                   "parts": [
                       {"name": "Part 1: out", "wants": "the cat moves right three times", "program": ["repeat3", "right"], "expect": ["repeat3", "right"]},
                       {"name": "Part 2: bigger", "wants": "the cat grows", "program": ["shrink"], "expect": ["grow"], "bug": 0,
                        "why": "This part shrinks the cat. We wanted it to grow.",
                        "fix": {"opts": [choice("grow", "grow", True), choice("spin", "spin", False), choice("say", "say hello", False)], "why": "Grow. Run the part again to check."}},
                       {"name": "Part 3: back", "wants": "the cat moves left three times", "program": ["repeat3", "jump"], "expect": ["repeat3", "left"], "bug": 1,
                        "why": "This part jumps three times instead of moving left.",
                        "fix": {"opts": [choice("left", "move left", True), choice("right", "move right", False), choice("hide", "hide", False)], "why": "Repeat 3 times, move left. Two parts had bugs; testing each part found both."}},
                   ]},
              ]},
             "Every part tested, every bug found where it lived."),

        step("sort", "Input, output, or a part to test?", "\U0001F5C2️", "Program sorter", ["4P.05", "4P.06", "4P.07"],
             "In a game program, is this an INPUT the program waits for, an OUTPUT it makes, or a PART you would test on its own?",
             explain(
                 ["Input: something that happens TO the program. Output: something the program does. Part: a chunk of the program you can run alone."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Input, output, or part?",
              "bins": [{"id": "in", "label": "Input", "pic": "\U0001F4E5"}, {"id": "out", "label": "Output", "pic": "\U0001F4E4"}, {"id": "part", "label": "A part to test", "pic": "\U0001F9EA"}],
              "items": [
                  {"pic": "\U0001F170️", "label": "the A key is pressed", "bin": "in", "why": "Something that happens to the program."},
                  {"pic": "⬆️", "label": "the cat jumps", "bin": "out", "why": "Something the program does."},
                  {"pic": "\U0001F3E0", "label": "the reset blocks at the start", "bin": "part", "why": "A chunk you can run on its own."},
                  {"pic": "\U0001F5B1️", "label": "the player clicks the door", "bin": "in", "why": "An input the door waits for."},
                  {"pic": "\U0001F50A", "label": "a creak sound plays", "bin": "out", "why": "The program makes it."},
                  {"pic": "\U0001F501", "label": "the loop that does the three jumps", "bin": "part", "why": "Run it alone to test it."},
                  {"pic": "\U0001F522", "label": "the score goes up by one", "bin": "out", "why": "What the sign does."},
                  {"pic": "⚽", "label": "the ball hits the goal", "bin": "in", "why": "What the sign responds to."},
              ]},
             "Inputs happen to it, outputs come from it, parts are tested alone."),

        step("questions", "Check: inputs, outputs, parts", "\U0001F4DD", "Part checker", ["4P.05", "4P.06", "4P.07"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Scripts per input, planning, testing parts."], [], ["Read, think, tap."]),
             {"items": [
                 q("Pressing A runs the jump script. Pressing B runs...", "\U0001F171️", "its own, different script", ["the jump script too", "nothing ever", "every script"], "Each input has its own script."),
                 q("Planning an object means deciding its...", "\U0001F4CB", "input and its output", ["colour only", "name only", "price"], "What it responds to, what it does."),
                 q("You run each part on its own and part 2 fails. Where is the bug?", "\U0001F9EA", "in part 2", ["in part 1", "in part 3", "nowhere"], "The part that fails holds the bug."),
             ]},
             "Inputs, outputs, parts."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4P.05", "4P.06", "4P.07"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Different outputs from different inputs, planning objects, testing parts."], [], ["Read, look, tap."]),
             {"items": [
                 q("One sprite, two keys, two scripts. What picks the output?", "\U0001F3AE", "which key is pressed", ["the sprite's size", "the time", "the first script always"], "The input picks the script."),
                 q("Which is an INPUT to a game program?", "\U0001F4E5", "the space bar being pressed", ["the cat hiding", "a creak sound", "the score going up"], "Something that happens to the program."),
                 q("Which is an OUTPUT?", "\U0001F4E4", "the door opening", ["the player touching the door", "the A key", "the mouse click"], "Something the program does."),
                 q("Why plan an object's input and output BEFORE building?", "\U0001F4CB", "so you know what it waits for and what it must do", ["to make it slower", "because the computer asks", "so it needs no blocks"], "Plan, then build."),
                 q("Testing systematically means...", "\U0001F9EA", "testing one part at a time", ["running it once and hoping", "testing only the end", "never testing"], "Part by part."),
                 q("A program in three parts fails. Parts 1 and 3 pass alone. The bug is...", "\U0001F41B", "in part 2", ["in part 1", "in part 3", "in all of them"], "The failing part holds it."),
                 q("After fixing a block in part 2, you should...", "\U0001F504", "run part 2 again to check", ["stop", "delete part 2", "fix part 3 too"], "A fix is tested by running it."),
             ]},
             "That is the whole lesson finished. You script inputs, plan objects and test parts."),
    ],
}


LESSON["about"] = [
    "Give one sprite a different script for each input.",
    "Plan an object by naming its input and its output.",
    "Test a program part by part to find which part holds a bug.",
    "Tell inputs, outputs and parts apart in a program.",
]

LESSON["lecture"] = [
    part("\U0001F4E5", "Inputs to a program",
         "A program can wait for an input: a key, a button, a click on a sprite. Each input gets its own script, and only that script runs when that input happens. Press A and the cat jumps; press B and it spins. Same cat, different input, different output."),
    part("\U0001F4CB", "Planning an object",
         "Before building an object, plan it: what is its input, and what is its output? The door's input is the player touching it; its output is opening with a creak. Nothing happens without an input, so plan both."),
    part("\U0001F9EA", "Testing part by part",
         "A program in named parts can be tested one part at a time. Run the reset: fine. Run the jumps: it spins. The bug is in that part, and nowhere else. Systematic testing tells you WHERE, instead of leaving you to guess."),
    part("\U0001F504", "Fix, then run again",
         "Fix the block in the failing part and run that part again. Only when every part passes does the whole program pass. Two bugs in two parts are found one at a time, which is far easier than finding both at once."),
]

LESSON["words"] = [
    word("input", "\U0001F4E5", "Something that happens to a program that it can respond to: a key press, a click.",
         ["The A key is an input.", "Plan the object's input."]),
    word("output", "\U0001F4E4", "Something a program makes happen: a jump, a sound, a number going up.",
         ["The creak is an output.", "Different inputs, different outputs."]),
    word("script", "\U0001F4DC", "The blocks that run for one input.",
         ["The A script makes the cat jump.", "Build a script for each input."]),
    word("plan", "\U0001F4CB", "To decide an object's input and output before building it.",
         ["Plan the door first.", "A plan names the input and the output."]),
    word("systematic", "\U0001F9EA", "Done in order, one part at a time, missing nothing.",
         ["Test systematically.", "A systematic test finds the failing part."]),
]

LESSON["home"] = [
    home("Two buttons", "A friend, two 'buttons' (two coins)",
         ["Decide a script for each coin: tap the gold coin, your friend claps twice; tap the silver coin, they spin.",
          "Tap coins in any order. Does each coin run only its own script?",
          "Add a third input with a new output."],
         "Each input, its own output."),
    home("Test the parts", "A routine in three parts",
         ["Write a job in three parts: get ready, do it, tidy up.",
          "Have someone do ONE part at a time while you check it.",
          "When a part goes wrong, fix only that part and test it again."],
         "One part at a time finds the bug."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you built programs with a repeat block, folded a long program into a short one that does the same thing, and wrote comments that say what each block is for."
LESSON["warmup"] = [
    q("A torch will not light. What is the best way to find the problem?", "\U0001F526", "check one part at a time: the batteries, then the bulb, then the switch", ["throw it away", "shake it harder", "check nothing and hope"], "Testing one part at a time shows exactly which part is broken."),
    q("A doorbell: what goes in, and what comes out?", "\U0001F514", "a press on the button goes in; a ding-dong comes out", ["a ding-dong goes in; a press comes out", "the door goes in; the house comes out", "nothing goes in"], "Press in, sound out: every object has an input and an output."),
]
