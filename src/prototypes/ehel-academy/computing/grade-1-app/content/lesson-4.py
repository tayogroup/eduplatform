# -*- coding: utf-8 -*-
"""Lesson 4 - Algorithm to Program.

0059 Stage 1 Programming: 1P.01 algorithms can be recreated as code on
computers; 1P.02 recreate algorithms as programs to perform simple tasks;
1P.03 predict what is likely to happen when programs are run; 1P.05 run
programs to test whether they produce the desired result; with 1CT.05 and
1CS.05 (the everyday things that run a program).
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "algorithm-to-program",
    "title": "Algorithm to Program",
    "blurb": "Turn an algorithm in words into blocks a computer can run, press Run and see whether the cat did what the algorithm said, and predict what a program will do before it runs.",
    "steps": [
        step("demo", "Words a computer understands", "\U0001F9E9", "Code and program", ["1P.01"],
             "An algorithm is words. A computer needs code. Press <b>Next</b> to see how one becomes the other.",
             explain(
                 ["An algorithm can be written as code.", "Code is instructions in a form the computer understands.", "Code the computer runs is a program."],
                 ["Our algorithm says: move right, jump, say hello.", "The computer cannot read our sentences.",
                  "So we use blocks. One block is one instruction.", "Blocks in a row are a program. Press Run and the computer does it."],
                 ["Children think the computer understands English.", "It understands its own code. We write the algorithm AS code."],
                 ["Press Next and watch the words turn into blocks."]),
             {"frames": [
                 {"pic": "\U0001F4DD", "cap": "An <b>algorithm</b> in words: move right, jump, say hello.", "say": "Here is an algorithm in words. Move right. Jump. Say hello."},
                 {"pic": "\U0001F4BB❓", "cap": "A computer cannot read our sentences.", "say": "A computer cannot read our sentences. It needs the steps in its own way.", "sound": "error"},
                 {"pic": "\U0001F9E9", "cap": "So we use <b>blocks</b>. One block is one instruction. That is <b>code</b>.", "say": "So we use blocks. One block is one instruction. Blocks are code the computer understands.", "sound": "click"},
                 {"pic": "\U0001F9E9\U0001F9E9\U0001F9E9", "cap": "Blocks in a row are a <b>program</b>.", "say": "Blocks in a row are a program. The same steps as the algorithm, in code.", "sound": "click"},
                 {"pic": "▶️\U0001F431", "cap": "Press <b>Run</b>, and the computer does the steps.", "say": "Press Run, and the computer does the steps. Move right. Jump. Hello!", "sound": "tada"},
             ]},
             "An algorithm becomes code; code that runs is a program."),

        step("explore", "The blocks", "\U0001F9E9", "Block reader", ["1P.01", "1P.02"],
             "These are the blocks the cat understands. Tap each one to hear what it makes the cat do.",
             explain(
                 ["Each block is one instruction the cat can do."],
                 ["Move right and move left slide the cat along.", "Jump makes it hop.", "Say hello makes a speech bubble.",
                  "Spin turns it round.", "Grow and shrink change its size."],
                 ["Children think a block can do two things.", "One block, one instruction. Two things need two blocks."],
                 ["Tap every block and picture the cat doing it."]),
             {"items": [
                 {"pic": "➡️", "label": "move right", "say": "Move right. The cat slides one space to the right."},
                 {"pic": "⬅️", "label": "move left", "say": "Move left. The cat slides one space to the left."},
                 {"pic": "⬆️", "label": "jump", "say": "Jump. The cat hops up and lands again."},
                 {"pic": "\U0001F4AC", "label": "say hello", "say": "Say hello. A speech bubble appears with hello in it."},
                 {"pic": "\U0001F504", "label": "spin", "say": "Spin. The cat turns all the way round."},
                 {"pic": "\U0001F53C", "label": "grow", "say": "Grow. The cat gets bigger."},
                 {"pic": "\U0001F53D", "label": "shrink", "say": "Shrink. The cat gets smaller."},
             ], "need": 7},
             "Seven blocks, seven instructions the cat can do."),

        step("program", "Build the program", "\U0001F431", "Programmer", ["1P.02", "1P.05"],
             "Read the algorithm, build it out of blocks, then press <b>Run</b> and check the cat did it.",
             explain(
                 ["You turn the algorithm into a program by picking the block for each step, in order."],
                 ["The algorithm says: move right, jump.", "So tap the move right block, then the jump block.", "Then press Run.",
                  "Watch the cat. Did it do what the algorithm said? That is testing."],
                 ["Children put the blocks in the wrong order.", "The program does the blocks in the order they are placed, so match the algorithm."],
                 ["Build it, run it, check it."]),
             {"sprite": "\U0001F431", "spriteName": "cat", "blocks": ["right", "left", "jump", "say", "spin", "grow", "shrink"],
              "rounds": [
                  {"algorithm": ["Move right", "Jump"], "expect": ["right", "jump"]},
                  {"algorithm": ["Jump", "Say hello", "Spin"], "expect": ["jump", "say", "spin"]},
                  {"algorithm": ["Move right", "Move right", "Grow"], "expect": ["right", "right", "grow"]},
                  {"algorithm": ["Spin", "Shrink", "Move left", "Say hello"], "expect": ["spin", "shrink", "left", "say"]},
              ]},
             "You wrote four programs and tested every one."),

        step("program", "What will it do?", "\U0001F52E", "Program predictor", ["1P.03"],
             "This program is already written. Say what the cat will do, then press <b>Run</b> to find out.",
             explain(
                 ["A programmer reads a program and predicts what it will do before running it."],
                 ["Read the blocks in order, left to right.", "Say the moves out loud: move right, move right, jump.", "Then tap the prediction that matches.",
                  "Then press Run and watch. Were you right?"],
                 ["Children read only the first block.", "Read every block. The program does all of them."],
                 ["Read, predict, then Run."]),
             {"sprite": "\U0001F431", "spriteName": "cat",
              "rounds": [
                  {"given": ["right", "right", "jump"],
                   "predict": {"ask": "What will the cat do when this program runs?",
                               "opts": [opt("Move right twice, then jump", True), opt("Jump, then move left twice", False), opt("Say hello and spin", False)],
                               "why": "The blocks run in order: right, right, jump."}},
                  {"given": ["say", "spin"],
                   "predict": {"ask": "What will the cat do when this program runs?",
                               "opts": [opt("Say hello, then spin", True), opt("Spin, then say hello", False), opt("Grow, then shrink", False)],
                               "why": "The first block is say hello, the second is spin. That order."}},
                  {"given": ["grow", "grow", "shrink"],
                   "predict": {"ask": "What will the cat do when this program runs?",
                               "opts": [opt("Grow twice, then shrink once", True), opt("Shrink three times", False), opt("Move right and jump", False)],
                               "why": "Two grows make it big, then one shrink makes it a little smaller again."}},
              ]},
             "You predicted three programs before they ran."),

        step("sort", "Algorithm, or program?", "\U0001F5C2️", "Algorithm or program", ["1P.01", "1CT.05"],
             "An algorithm is steps in words or pictures. A program is code a computer runs. Which is this?",
             explain(
                 ["An algorithm and a program are the same steps in two forms."],
                 ["A recipe on a card: an algorithm.", "Blocks on a tablet that the computer runs: a program.",
                  "Directions you say out loud: an algorithm.", "The code inside a traffic light: a program."],
                 ["Children think everything on a screen is a program.", "Ask: is a COMPUTER running it? Then it is a program."],
                 ["Ask: words for people, or code for a computer?"]),
             {"ask": "Algorithm, or program?",
              "bins": [{"id": "algo", "label": "Algorithm", "pic": "\U0001F4DD"}, {"id": "prog", "label": "Program", "pic": "\U0001F9E9"}],
              "items": [
                  {"pic": "\U0001F4D6", "label": "a recipe on a card", "bin": "algo", "why": "Steps in words for a person to follow. An algorithm."},
                  {"pic": "\U0001F9E9", "label": "blocks on a tablet that the cat runs", "bin": "prog", "why": "Code a computer runs. A program."},
                  {"pic": "\U0001F5E3️", "label": "the rules of tag, said out loud", "bin": "algo", "why": "Steps for people, in words. An algorithm."},
                  {"pic": "\U0001F3AE", "label": "a game on a tablet", "bin": "prog", "why": "A game is a program the tablet runs."},
                  {"pic": "\U0001F5FA️", "label": "directions to school, written down", "bin": "algo", "why": "Steps in words for a person. An algorithm."},
                  {"pic": "\U0001F6A6", "label": "the code inside a traffic light", "bin": "prog", "why": "A computer in the traffic light runs that code. A program."},
                  {"pic": "\U0001F483", "label": "a dance", "bin": "algo", "why": "Steps for a person to follow. An algorithm."},
                  {"pic": "\U0001F916", "label": "the code inside a robot vacuum", "bin": "prog", "why": "The robot's computer runs it. A program."},
              ]},
             "Words for people: an algorithm. Code for a computer: a program."),

        step("context", "Programs everywhere", "\U0001F30D", "Program spotter", ["1P.01", "1CS.05"],
             "Lots of everyday things have a computer inside, running a program. Tap each one.",
             explain(
                 ["A program does not only run on a tablet.", "Many everyday things have a small computer inside that runs a program."],
                 ["A traffic light runs a program: red, then amber, then green.", "A washing machine runs a program: fill, wash, spin, drain.",
                  "A robot vacuum runs a program that steers it round the room.", "A game is a program too."],
                 [],
                 ["Tap each one and listen for the steps its program does."]),
             {"items": [
                 {"pic": "\U0001F6A6", "label": "a traffic light", "say": "A traffic light has a computer running a program: red, wait, red and amber, green, wait, amber, red. Over and over."},
                 {"pic": "\U0001F9FA", "label": "a washing machine", "say": "A washing machine runs a program: fill with water, wash, rinse, spin, drain."},
                 {"pic": "\U0001F916", "label": "a robot vacuum", "say": "A robot vacuum runs a program: forward until a bump, turn, forward again, back to the charger."},
                 {"pic": "\U0001F3AE", "label": "a game", "say": "A game is a program. When you press the button, the program moves your character."},
             ], "need": 4,
              "then": {"ask": "What follows the steps inside a washing machine?",
                       "opts": [opt("A computer inside it, running a program", True), opt("A tiny person", False), opt("Nothing; it guesses", False)],
                       "why": "Everyday machines have a computer inside that runs a program."}},
             "Traffic lights, washing machines, robots and games all run programs."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1P.01", "1P.02", "1P.03", "1P.05"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about words and blocks, building, predicting and running."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("An algorithm written in a form a computer understands is called...", "\U0001F9E9", "code", ["a recipe", "a picture", "a cat"], "Code is the algorithm in the computer's own form."),
                 q("Code that a computer runs is called a...", "▶️", "program", ["sandwich", "grid", "flag"], "A program is code the computer runs."),
                 q("The algorithm says: jump, then say hello. Which program is right?", "\U0001F4DD", "jump block, then say hello block", ["say hello block, then jump block", "just a jump block", "grow block, shrink block"], "Match the blocks to the steps, in the same order."),
                 q("How many things does one block do?", "\U0001F9E9", "one", ["two", "as many as you like", "none"], "One block, one instruction."),
                 q("The program is: move right, move right, jump. What will the cat do?", "\U0001F431", "move right twice, then jump", ["jump, then move right", "spin", "nothing"], "Read the blocks in order. That is predicting."),
                 q("You press Run to...", "▶️", "test whether the program does what you wanted", ["delete the program", "make the cat bigger", "make the algorithm longer"], "Running the program is how you test it."),
                 q("The cat did NOT do what the algorithm said. What now?", "\U0001F527", "change the blocks and run it again", ["give up", "shout at the cat", "close the tablet"], "Change the program, then test it again."),
                 q("Which of these runs a program?", "\U0001F6A6", "a traffic light", ["a wooden spoon", "a stone", "a paper recipe"], "A traffic light has a computer inside running a program."),
             ]},
             "That is the whole lesson finished. You can turn an algorithm into a program, predict it, and test it."),
    ],
}


LESSON["about"] = [
    "Say that an algorithm can be written as code, and that code a computer runs is a program.",
    "Build a program out of blocks to match an algorithm.",
    "Predict what a program will do before it runs.",
    "Run a program to test whether it did what you wanted.",
]

LESSON["lecture"] = [
    part("\U0001F4DD", "Words and code",
         "An algorithm is steps in words: move right, jump, say hello. A computer cannot read our sentences. So we write the same steps as code, in a form the computer understands. Code the computer runs is a program."),
    part("\U0001F9E9", "Blocks",
         "Our code is made of blocks. One block is one instruction: move right, jump, say hello, spin, grow, shrink. Put blocks in a row and you have a program. The computer does them in that order."),
    part("\U0001F3D7️", "Building a program",
         "To build a program, read the algorithm and pick the block for each step, in the same order. Move right, then jump means the move right block first and the jump block second."),
    part("\U0001F52E", "Predicting",
         "Before you press Run, read the blocks and say what the cat will do. Move right, move right, jump. That is predicting. Programmers do it all the time."),
    part("▶️", "Running and testing",
         "Press Run and watch. Did the cat do what the algorithm said? If yes, the program works. If not, change the blocks and run it again. Running a program to check it is called testing."),
]

LESSON["words"] = [
    word("code", "\U0001F9E9", "Instructions written in a form a computer understands.",
         ["Blocks are code.", "We wrote the algorithm as code."]),
    word("program", "▶️", "Code that a computer runs.",
         ["Press Run to run the program.", "A game is a program."]),
    word("block", "\U0001F7E6", "One instruction in our code.",
         ["Tap the jump block.", "Three blocks, three instructions."]),
    word("run", "\U0001F3C3", "To make the computer do the program.",
         ["Run the program and watch.", "The cat runs the blocks in order."]),
    word("test", "\U0001F50E", "To run a program and check it did what you wanted.",
         ["Test it before you trust it.", "The test showed a mistake."]),
    word("predict", "\U0001F52E", "To say what will happen before it happens.",
         ["Predict what the cat will do.", "My prediction was right."]),
    word("computer", "\U0001F4BB", "A machine that runs programs.",
         ["A tablet is a computer.", "There is a computer inside a washing machine."]),
]

LESSON["home"] = [
    home("Paper program", "Paper cut into cards, a pen, a grown-up",
         ["Write one instruction on each card: move right, jump, say hello, spin, clap.",
          "Lay four cards in a row. That is your program.",
          "Your grown-up is the computer. They do the cards in order, and nothing else."],
         "Did the computer do exactly what your program said? Swap two cards and run it again."),
    home("Program a dance", "Space to move, some music",
         ["Make up a dance with four moves: step, clap, turn, jump.",
          "Say the moves out loud, in order. That is the algorithm.",
          "Now do it to music. Running it is the program."],
         "Predict what happens if you swap the last two moves, then try it."),
    home("Spot the programs", "A walk round the house",
         ["Find five things that have a computer inside running a program.",
          "Say what steps the program does: fill, wash, spin.",
          "Find one thing with no computer inside."],
         "A microwave counts down. A toaster with a dial might not have a computer at all."),
]
