# -*- coding: utf-8 -*-
"""Lesson 5 - Tidy Programs.

0059 Stage 3 Programming: 3P.01 editing programs to make them clear and
concise, removing unused commands and combining duplicated ones; 3P.02
programs that reset objects to their original state (initialisation); 3P.05
making a change within a block of code, such as the number of steps a
sprite moves; 3P.09 test and debug programs.
"""
from _kit import explain, step, opt, q, choice, part, word, home

LESSON = {
    "slug": "tidy-programs",
    "title": "Tidy Programs",
    "blurb": "Make a program shorter without changing what it does, start every program by putting the cat back where it belongs, change the number inside a block to hit a target, and test after every change.",
    "steps": [
        step("demo", "Same job, fewer blocks", "\U0001F9F9", "Tidy watcher", ["3P.01"],
             "A program can be long and untidy, or short and clear, and do the SAME thing. Press <b>Next</b>.",
             explain(
                 ["A tidy program has no block that does nothing, and no block written three times when a repeat would do."],
                 ["Jump, jump, jump, wait, say hello: five blocks.", "Repeat 3 times jump, say hello: three blocks. The cat does exactly the same."],
                 ["Children think shorter means it does less.", "It does the same. It is just easier to read and easier to change."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F9E9\U0001F9E9\U0001F9E9\U0001F9E9\U0001F9E9", "cap": "Five blocks: jump, jump, jump, wait, say hello.", "say": "Five blocks: jump, jump, jump, wait, say hello."},
                 {"pic": "⏳", "cap": "The <b>wait</b> block does nothing here. It is unused. Take it out.", "say": "The wait block does nothing here. It is an unused command. Take it out."},
                 {"pic": "\U0001F501", "cap": "Jump, jump, jump is the same block three times. Combine them: <b>repeat 3 times, jump</b>.", "say": "Jump, jump, jump is the same block three times. Combine them into repeat 3 times, jump."},
                 {"pic": "\U0001F9E9\U0001F9E9\U0001F9E9", "cap": "Three blocks. The cat jumps three times and says hello, exactly as before.", "say": "Three blocks now. The cat jumps three times and says hello, exactly as before. Clear and concise.", "sound": "tada"},
             ]},
             "Same job, fewer blocks: clear and concise."),

        step("tidy", "Make it shorter", "\U0001F9F9", "Program tidier", ["3P.01", "3P.09"],
             "Each program works, but it is long. Delete unused blocks, fold repeats, then <b>Run</b> to test that it still does the same thing.",
             explain(
                 ["Tidying a program: remove commands that do nothing, and combine commands that are duplicated."],
                 ["Tap a wait block: delete it.", "Tap the first of three jumps: fold them into a repeat.", "Then run. If the cat does the same thing in fewer blocks, you tidied it right."],
                 ["Children delete a block that mattered.", "Run after every change. The run is the test."],
                 ["Tap a block, choose, run, check."]),
             {"sprite": "\U0001F431",
              "rounds": [
                  {"goal": "jump 3 times, then say hello", "program": ["jump", "jump", "jump", "wait", "say"], "expect": ["repeat3", "jump", "say"]},
                  {"goal": "move right twice, then spin twice", "program": ["right", "wait", "right", "spin", "spin", "wait"], "expect": ["repeat2", "right", "repeat2", "spin"]},
                  {"goal": "say hello, then grow 4 times", "program": ["wait", "say", "grow", "grow", "grow", "grow", "wait"], "expect": ["say", "repeat4", "grow"]},
              ]},
             "Three programs, each shorter, each doing the same thing."),

        step("program", "Start from the same place", "\U0001F3E0", "Resetter", ["3P.02", "3P.09"],
             "The cat is NOT at the start: the last program left it somewhere else. Put a <b>go home</b> block first so the program always starts the same way.",
             explain(
                 ["A program should reset its objects to where they started, or it does something different every time it runs."],
                 ["The cat is two squares along and big, from a program that ran before.", "Move right, jump, from there, ends in the wrong place.",
                  "Go home first: the cat is back at the start, normal size. Now move right, jump ends where it should, every single time."],
                 ["Children build the moves and forget the reset.", "The moves are right and the place is wrong. Go home comes FIRST."],
                 ["Go home, then the algorithm, then Run."]),
             {"sprite": "\U0001F431", "spriteName": "cat", "blocks": ["home", "right", "left", "jump", "say", "spin", "grow", "shrink"],
              "rounds": [
                  {"algorithm": ["Go home", "Move right", "Jump"], "expect": ["home", "right", "jump"], "start": {"x": 2, "scale": 1.4}, "mustReset": True},
                  {"algorithm": ["Go home", "Spin", "Move left"], "expect": ["home", "spin", "left"], "start": {"x": -2, "spin": 180}, "mustReset": True},
                  {"algorithm": ["Go home", "Grow", "Say hello"], "expect": ["home", "grow", "say"], "start": {"x": 1, "scale": 0.5}, "mustReset": True},
              ]},
             "Go home first. That is initialisation."),

        step("tweak", "Change the number", "\U0001F522", "Number changer", ["3P.05", "3P.09"],
             "The program is given. Only the NUMBERS in the blocks can change. Make the cat stop right on the flower.",
             explain(
                 ["Sometimes a program is nearly right, and the fix is a number inside a block: move 2 instead of move 1."],
                 ["Move right 1, jump, move right 1 stops at square 2. The flower is at square 3.", "Change the first number to 2: right 2, jump, right 1 stops at 3. On the flower."],
                 ["Children change every number.", "Run it, read where the cat stopped, and change ONE number."],
                 ["Tap a number, run, read, change again."]),
             {"sprite": "\U0001F431",
              "rounds": [
                  {"goal": "stop on the flower, 3 squares along", "target": 3,
                   "program": [{"id": "right", "n": 1}, {"id": "jump", "n": 1}, {"id": "right", "n": 1}],
                   "expect": [{"id": "right", "n": 2}, {"id": "jump", "n": 1}, {"id": "right", "n": 1}]},
                  {"goal": "stop on the flower, 2 squares along", "target": 2,
                   "program": [{"id": "right", "n": 3}, {"id": "left", "n": 3}],
                   "expect": [{"id": "right", "n": 3}, {"id": "left", "n": 1}]},
                  {"goal": "stop on the flower, 1 square back", "target": -1,
                   "program": [{"id": "left", "n": 3}, {"id": "jump", "n": 1}, {"id": "right", "n": 1}],
                   "expect": [{"id": "left", "n": 2}, {"id": "jump", "n": 1}, {"id": "right", "n": 1}]},
              ]},
             "One number changed, the cat on the flower."),

        step("debug", "Test and debug", "\U0001F41E", "Tester", ["3P.09"],
             "Run each program, find the block that is wrong, fix it, and run it again to test the fix.",
             explain(
                 ["Testing is running the program to see if it does what we wanted.", "Debugging is finding and fixing what went wrong."],
                 ["Run first. Watch. Which block made it go wrong?", "Fix that block, then run again: a fix you have not tested is a fix you do not know works."],
                 ["Children fix the block and move on without running it.", "Run it again. Always."],
                 ["Run, find, fix, run again."]),
             {"sprite": "\U0001F431",
              "rounds": [
                  {"goal": "jump 3 times, then say hello", "program": ["repeat3", "spin", "say"], "bug": 1, "expect": ["repeat3", "jump", "say"],
                   "why": "The repeat repeats a spin. We wanted three jumps.",
                   "fix": {"opts": [choice("jump", "jump", True), choice("grow", "grow", False), choice("right", "move right", False)], "why": "Repeat 3 times, jump. Run it again to test."}},
                  {"goal": "go home, move right twice, grow", "program": ["home", "repeat2", "left", "grow"], "bug": 2, "expect": ["home", "repeat2", "right", "grow"],
                   "why": "The repeat repeats a move LEFT. We wanted right.",
                   "fix": {"opts": [choice("right", "move right", True), choice("jump", "jump", False), choice("hide", "hide", False)], "why": "Repeat 2 times, move right. Run it again to test."}},
                  {"goal": "say hello, then shrink twice", "program": ["say", "repeat2", "grow"], "bug": 2, "expect": ["say", "repeat2", "shrink"],
                   "why": "It grows. We wanted shrink.",
                   "fix": {"opts": [choice("shrink", "shrink", True), choice("spin", "spin", False), choice("say", "say hello", False)], "why": "Shrink. Run it and check."}},
              ]},
             "Every fix tested by running it again."),

        step("questions", "Check: tidy programs", "\U0001F4DD", "Tidy checker", ["3P.01", "3P.02", "3P.05"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Tidying, resetting, changing a number."], [], ["Read, think, tap."]),
             {"items": [
                 q("Jump, jump, jump, jump can be combined into...", "\U0001F501", "repeat 4 times, jump", ["jump 1 time", "wait", "four different blocks"], "Duplicated commands combine into a repeat."),
                 q("Why put a go home block FIRST?", "\U0001F3E0", "so the cat starts from the same place every time", ["it looks nice", "so the cat never moves", "to make the program longer"], "Resetting at the start is initialisation."),
                 q("The cat stops at square 2 and the flower is at 3. What do you change?", "\U0001F522", "a number inside a move block, to go one further", ["delete the program", "the flower", "every block"], "One number, then run again."),
             ]},
             "Tidy, reset, tweak."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3P.01", "3P.02", "3P.05", "3P.09"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about unused blocks, repeats, go home, numbers and testing."], [], ["Read, look, tap."]),
             {"items": [
                 q("A wait block that does nothing for the job is...", "⏳", "an unused command: delete it", ["needed", "a repeat", "an input"], "Unused commands come out."),
                 q("Removing a wait and folding three jumps into a repeat makes the program...", "\U0001F9F9", "shorter, and it still does the same thing", ["do something different", "longer", "run backwards"], "Tidy means same job, fewer blocks."),
                 q("The cat was left two squares along by the last program. To start from the beginning you...", "\U0001F3E0", "put a go home block first", ["move it by hand", "delete the cat", "add more jumps"], "Reset the object first: initialisation."),
                 q("What does 'initialisation' mean?", "\U0001F504", "putting things back to their starting state at the start of a program", ["the end of a program", "a bug", "a kind of sprite"], "Initialise means set up at the start."),
                 q("Move right 1, jump, move right 1 stops at square 2. To stop at 3, change...", "\U0001F522", "one move number from 1 to 2", ["jump to spin", "nothing", "both numbers to 4"], "Change a number inside a block."),
                 q("After you fix a bug you should...", "▶️", "run the program again to test the fix", ["stop", "delete the program", "add a wait block"], "A fix is tested by running it."),
                 q("Which program is clear and concise?", "✅", "repeat 3 times jump, say hello", ["jump, jump, jump, wait, say hello, wait", "wait, wait, wait", "jump, wait, jump, wait, jump"], "No unused blocks, duplicates combined."),
             ]},
             "That is the whole lesson finished. Your programs are tidy, they reset, and you change the right number."),
    ],
}


LESSON["about"] = [
    "Make a program clear and concise by removing unused commands and combining duplicated ones.",
    "Start a program by resetting its objects to where they began.",
    "Change a number inside a block to get the outcome you want.",
    "Test a program by running it, and run it again after every fix.",
]

LESSON["lecture"] = [
    part("\U0001F9F9", "Tidy programs",
         "A tidy program has no block that does nothing and no block written three times when a repeat would do. Delete the unused wait; fold jump, jump, jump into repeat 3 times, jump. The cat does the same thing in fewer blocks, and the program is easier to read and to change."),
    part("\U0001F3E0", "Reset first",
         "A program that ran before can leave the cat somewhere else, bigger, or spun round. If the next program starts from there, it ends in the wrong place even though its moves are right. A go home block at the top puts the cat back to its original state first. That is called initialisation."),
    part("\U0001F522", "Change the number",
         "Sometimes the blocks are right and only a number is wrong. Move right 1 when it needed to be move right 2. Run it, read where the cat stopped, change one number, run it again."),
    part("▶️", "Test, then test again",
         "Testing is running the program to see what it really does. Debugging is fixing what went wrong. After every change - a deleted block, a reset, a new number, a fix - run it again. A change you have not tested is a change you do not know works."),
]

LESSON["words"] = [
    word("unused", "⏳", "A command in a program that does nothing for the job.",
         ["The wait block is unused here.", "Delete unused commands."]),
    word("duplicate", "\U0001F501", "The same command written more than once in a row.",
         ["Jump, jump, jump is a duplicate.", "Combine duplicates into a repeat."]),
    word("initialisation", "\U0001F3E0", "Setting everything back to its starting state at the start of a program.",
         ["Go home first: that is initialisation.", "Without initialisation the cat starts in the wrong place."]),
    word("reset", "\U0001F504", "To put something back the way it started.",
         ["Reset the cat before you run.", "The go home block resets the cat."]),
    word("test", "▶️", "To run a program and see what it really does.",
         ["Test it after every change.", "The run is the test."]),
]

LESSON["home"] = [
    home("Tidy the cards", "Cards with a block on each",
         ["Lay out a long program: jump, jump, jump, wait, say hello, wait.",
          "Take out the cards that do nothing. Fold the three jumps into 'repeat 3 times, jump'.",
          "Act out both versions. Are they the same?"],
         "Same job, fewer cards."),
    home("Start from the same square", "A floor grid, a toy",
         ["Run a program of forward, forward, turn with the toy, and leave it where it stops.",
          "Run it again from THERE. Where does it end now?",
          "Add a 'go to the start square' card at the top and run twice more."],
         "A reset at the top makes every run the same."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you found the input an algorithm starts from, and built machines that turn an input into an output."
LESSON["warmup"] = [
    q("A program says: grow, grow, grow, grow. How could it be shorter?", "\U0001F501", "repeat 4 times, grow", ["grow", "shrink 4 times", "stop"], "One repeat block does the same job with fewer blocks."),
    q("You run a program and it does the wrong thing. What do you do next?", "\U0001F41B", "find the bug, fix it and run it again", ["delete the whole program", "run it again without changing anything", "switch the tablet off"], "Test, fix, and test again."),
]
