# -*- coding: utf-8 -*-
"""Lesson 3 - Programs and Repeats.

0059 Stage 2 Programming: 2P.01 programs instruct computers how to run
algorithms; 2P.02 recreate algorithms as programs; 2P.03 develop programs to
produce desired outputs, including the use of the repeat command; 2P.06 the
benefits of regularly testing programs throughout their development.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "programs-and-repeats",
    "title": "Programs and Repeats",
    "blurb": "Turn algorithms into programs, meet the repeat block and use it to say 'jump three times' in two blocks, and find out why programmers test as they go.",
    "steps": [
        step("demo", "A program runs an algorithm", "\U0001F9E9", "Program runner", ["2P.01"],
             "An algorithm is the plan. A program is how the computer runs it. Press <b>Next</b>.",
             explain(
                 ["A program instructs the computer how to run an algorithm.", "The algorithm says what to do; the program says it in blocks the computer can follow."],
                 ["The algorithm: move right, jump, say hello.", "The program: the move right block, the jump block, the say hello block.",
                  "Press Run and the computer does the algorithm, one block at a time."],
                 ["Children think the algorithm and the program are two different jobs.", "They are the same job in two forms: words for us, blocks for the computer."],
                 ["Press Next and watch one become the other."]),
             {"frames": [
                 {"pic": "\U0001F4DD", "cap": "The <b>algorithm</b>: move right, jump, say hello.", "say": "The algorithm: move right, jump, say hello. That is the plan, in words."},
                 {"pic": "\U0001F9E9\U0001F9E9\U0001F9E9", "cap": "The <b>program</b>: the same three steps, as blocks.", "say": "The program: the same three steps, as blocks the computer can follow.", "sound": "click"},
                 {"pic": "▶️", "cap": "Press Run. The program tells the computer <b>how</b> to run the algorithm.", "say": "Press Run. The program instructs the computer how to run the algorithm.", "sound": "click"},
                 {"pic": "\U0001F431➡️⬆️\U0001F4AC", "cap": "Move right. Jump. Hello! The algorithm, done by a computer.", "say": "Move right. Jump. Hello! That is the algorithm, done by a computer, because a program told it how.", "sound": "tada"},
             ]},
             "A program is how a computer runs an algorithm."),

        step("program", "Build the program", "\U0001F431", "Program builder", ["2P.02", "2P.01"],
             "Read the algorithm, build it in blocks, then press <b>Run</b> and check.",
             explain(
                 ["Recreating an algorithm as a program means one block for each step, in the same order."],
                 ["Jump, jump, move left: the jump block, the jump block, the move left block.", "Run it. Did the cat do exactly that?"],
                 ["Children build it and forget to run it.", "Run is the test. A program you have not run is a program you have not tested."],
                 ["Build, run, check."]),
             {"sprite": "\U0001F431", "spriteName": "cat", "blocks": ["right", "left", "jump", "say", "spin", "grow", "shrink"],
              "rounds": [
                  {"algorithm": ["Jump", "Jump", "Move left"], "expect": ["jump", "jump", "left"]},
                  {"algorithm": ["Say hello", "Grow", "Move right", "Move right"], "expect": ["say", "grow", "right", "right"]},
                  {"algorithm": ["Spin", "Shrink", "Jump", "Say hello", "Move left"], "expect": ["spin", "shrink", "jump", "say", "left"]},
              ]},
             "Three algorithms, three programs, three tests."),

        step("explore", "The repeat block", "\U0001F501", "Repeat reader", ["2P.03"],
             "A new kind of block. Tap each one to hear what it does.",
             explain(
                 ["The repeat block repeats the block that comes AFTER it.", "Repeat 3 times, jump: the cat jumps three times, from two blocks instead of three.",
                  "Some other apps have a repeat block that holds several blocks and repeats them all; this one repeats just the block after it."],
                 ["Repeat 2 times, spin: two spins.", "Repeat 4 times, move right: four moves right.", "A repeat block with nothing after it repeats nothing."],
                 ["Children put the repeat block AFTER the block they want repeated.", "It goes before. It says: do the NEXT block this many times."],
                 ["Tap all three and say what each one would do to a jump."]),
             {"items": [
                 {"pic": "\U0001F501", "label": "repeat 2 times", "say": "Repeat 2 times. The block after it happens twice."},
                 {"pic": "\U0001F501", "label": "repeat 3 times", "say": "Repeat 3 times. The block after it happens three times. Repeat 3 times, jump: three jumps."},
                 {"pic": "\U0001F501", "label": "repeat 4 times", "say": "Repeat 4 times. The block after it happens four times."},
             ], "need": 3,
              "then": {"ask": "Repeat 3 times, then jump. What does the cat do?",
                       "opts": [opt("Jumps three times", True), opt("Jumps once", False), opt("Repeats nothing", False)],
                       "why": "The repeat block repeats the block after it: three jumps."}},
             "Repeat goes before the block it repeats."),

        step("program", "Use the repeat block", "\U0001F501", "Repeat programmer", ["2P.03", "2P.02"],
             "Build each algorithm using a <b>repeat</b> block. Then run it and check.",
             explain(
                 ["When a step happens again and again, a repeat block does it in fewer blocks."],
                 ["Jump 3 times: repeat 3 times, jump. Two blocks.", "Move right 4 times, say hello: repeat 4 times, move right, say hello. Three blocks.",
                  "The output is the same as writing jump, jump, jump. The program is shorter."],
                 ["Children build jump, jump, jump and skip the repeat.", "It does the right thing, but the algorithm asked for the repeat block. Use it."],
                 ["Repeat block first, then the block to repeat, then Run."]),
             {"sprite": "\U0001F431", "spriteName": "cat", "blocks": ["right", "left", "jump", "say", "spin", "grow", "repeat2", "repeat3", "repeat4"],
              "rounds": [
                  {"algorithm": ["Jump 3 times"], "expect": ["repeat3", "jump"], "mustRepeat": True},
                  {"algorithm": ["Move right 4 times", "Say hello"], "expect": ["repeat4", "right", "say"], "mustRepeat": True},
                  {"algorithm": ["Spin 2 times", "Grow"], "expect": ["repeat2", "spin", "grow"], "mustRepeat": True},
                  {"given": ["repeat3", "right", "jump"],
                   "predict": {"ask": "What will the cat do when this program runs?",
                               "opts": [opt("Move right 3 times, then jump once", True), opt("Jump 3 times, then move right", False), opt("Move right once", False)],
                               "why": "Repeat 3 times repeats the move right after it. Then one jump."}},
              ]},
             "The repeat block: the same output, fewer blocks."),

        step("sort", "Same output, or different?", "\U0001F5C2️", "Output matcher", ["2P.03"],
             "Two programs. Do they make the cat do the SAME thing? Tap the bin.",
             explain(
                 ["Two programs can look different and do the same thing.", "Repeat 3 times, jump does exactly what jump, jump, jump does."],
                 ["Repeat 2 times, move right: two moves. Right, right, right is three. Different."],
                 ["Children count the blocks instead of the moves.", "Count what the cat DOES."],
                 ["Work out what each program does, then compare."]),
             {"ask": "Same output, or different?",
              "bins": [{"id": "same", "label": "Same output", "pic": "="}, {"id": "diff", "label": "Different output", "pic": "≠"}],
              "items": [
                  {"pic": "\U0001F501⬆️", "label": "A: repeat 3 times, jump. B: jump, jump, jump.", "bin": "same", "why": "Three jumps, both ways."},
                  {"pic": "\U0001F501➡️", "label": "A: repeat 2 times, move right. B: move right, move right, move right.", "bin": "diff", "why": "Two moves against three. Different."},
                  {"pic": "\U0001F501\U0001F504", "label": "A: repeat 4 times, spin. B: spin, spin, spin, spin.", "bin": "same", "why": "Four spins, both ways."},
                  {"pic": "\U0001F501\U0001F4AC", "label": "A: repeat 2 times, say hello. B: say hello.", "bin": "diff", "why": "Two hellos against one. Different."},
                  {"pic": "\U0001F501⬅️", "label": "A: repeat 2 times, move left. B: move left, move left.", "bin": "same", "why": "Two moves left, both ways."},
                  {"pic": "\U0001F501\U0001F53C", "label": "A: repeat 3 times, grow. B: grow, grow.", "bin": "diff", "why": "Three grows against two. Different."},
              ]},
             "Count what the cat does, not the blocks."),

        step("questions", "Test as you go", "\U0001F50E", "Careful tester", ["2P.06"],
             "Programmers test their programs regularly, while they build them. Why? Tap the answer.",
             explain(
                 ["If you build ten blocks and run it once at the end, a bug could be in any of the ten.", "If you run it after every two blocks, a bug can only be in the last two."],
                 ["Build a bit, run it, build a bit more, run it again.", "The bug is always in the newest bit."],
                 [],
                 ["Think about where the bug could hide, then tap."]),
             {"label": "Question", "items": [
                 q("You have built 2 blocks of a 6-block program. What is the best thing to do next?", "\U0001F9E9", "run it now and check, then add more", ["build all 6, then run", "never run it", "delete the 2 blocks"], "Testing after a few blocks means a bug can only be in those few."),
                 q("Sami builds all 10 blocks, runs it once, and it goes wrong. Why is that harder to fix?", "\U0001F914", "the bug could be in any of the 10 blocks", ["10 is too few blocks", "the cat is tired", "it is not harder"], "With ten untested blocks there are ten places to look."),
                 q("When should you test a program?", "⏰", "regularly, while you are building it", ["only when it is finished", "once a year", "never"], "Regular testing finds each bug while it is new."),
                 q("Your program worked after 2 blocks. You add 2 more and now it goes wrong. Where is the bug?", "\U0001F50D", "in the 2 new blocks", ["in the first 2 blocks", "anywhere", "nowhere"], "The first two were tested and worked. The bug is in what you added."),
             ]},
             "Test a bit, build a bit, test again. The bug is always in the newest bit."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2P.01", "2P.02", "2P.03", "2P.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about programs, the repeat block and testing as you go."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does a program do?", "\U0001F9E9", "tells the computer how to run an algorithm", ["draws a cat", "makes the algorithm longer", "nothing"], "A program instructs the computer how to run an algorithm."),
                 q("The algorithm says: jump, say hello. Which program is right?", "\U0001F4DD", "jump block, say hello block", ["say hello block, jump block", "jump block only", "repeat 2, spin"], "Same steps, same order."),
                 q("What does 'repeat 3 times, jump' do?", "\U0001F501", "jumps three times", ["jumps once", "repeats nothing", "spins three times"], "The repeat block repeats the block after it."),
                 q("Which program has the SAME output as 'move right, move right, move right, move right'?", "➡️", "repeat 4 times, move right", ["repeat 3 times, move right", "move right, move right", "repeat 4 times, move left"], "Four moves right, both ways."),
                 q("Where does the repeat block go?", "\U0001F501", "before the block it repeats", ["after the block it repeats", "at the very end", "anywhere"], "Repeat says: do the NEXT block this many times."),
                 q("Why test a program regularly while building it?", "\U0001F50E", "a bug can only be in the newest blocks", ["it makes the cat happy", "so you never need to fix anything", "there is no reason"], "Testing as you go keeps the bug where you can find it."),
                 q("A repeat block with nothing after it...", "❓", "repeats nothing", ["repeats everything", "jumps", "breaks the computer"], "It needs a block after it to repeat."),
                 q("You want the cat to spin twice using the FEWEST blocks. Which?", "\U0001F504", "repeat 2 times, spin", ["spin, spin", "spin, spin, spin", "repeat 3 times, spin"], "Two blocks, two spins."),
             ]},
             "That is the whole lesson finished. You can build programs with repeats and test as you go."),
    ],
}


LESSON["about"] = [
    "Say that a program tells a computer how to run an algorithm.",
    "Build a program from an algorithm and run it to test it.",
    "Use the repeat block to repeat a block several times.",
    "Say why programmers test their programs regularly while building them.",
]

LESSON["lecture"] = [
    part("\U0001F9E9", "Algorithm and program",
         "An algorithm is the plan, in words: move right, jump, say hello. A program is the same plan in blocks the computer can follow. The program tells the computer how to run the algorithm."),
    part("\U0001F3D7️", "Building and running",
         "To build a program, take each step of the algorithm and place its block, in order. Then press Run. The cat does the blocks one at a time. Watching it run is how you test it."),
    part("\U0001F501", "The repeat block",
         "The repeat block repeats the block after it. Repeat 3 times, jump makes three jumps from two blocks. Repeat 4 times, move right makes four moves. The repeat block always goes BEFORE the block it repeats. Some other apps have a repeat block that holds several blocks and repeats them all; this one repeats just the block after it."),
    part("=", "Same output, fewer blocks",
         "Jump, jump, jump and repeat 3 times, jump do exactly the same thing. The output is the same. The second program is shorter, and shorter programs are easier to read and easier to fix."),
    part("\U0001F50E", "Test as you go",
         "Build two blocks, run it, check. Build two more, run it again. If it goes wrong, the bug is in the newest blocks, because the old ones were already tested. Programmers test regularly, all the way through."),
]

LESSON["words"] = [
    word("program", "\U0001F9E9", "Blocks that tell a computer how to run an algorithm.",
         ["Build the program.", "Press Run to run the program."]),
    word("repeat", "\U0001F501", "A block that repeats the block after it a number of times.",
         ["Repeat 3 times, jump.", "Use a repeat block."]),
    word("block", "\U0001F9E9", "One instruction in a program.",
         ["The jump block.", "Three blocks, three moves."]),
    word("run", "▶️", "To make the computer do the program.",
         ["Run it and watch.", "Run the program again."]),
    word("test", "\U0001F50E", "To run a program and check it did what you wanted.",
         ["Test after every few blocks.", "The test found a bug."]),
    word("output", "\U0001F381", "What a program makes happen when it runs.",
         ["The output is three jumps.", "Same output, fewer blocks."]),
]

LESSON["home"] = [
    home("Repeat cards", "Paper cards, a pen, a grown-up",
         ["Write 'jump' on a card and 'repeat 3 times' on another.",
          "Put the repeat card BEFORE the jump card. Your grown-up is the computer and does the cards.",
          "Try repeat 3 times with nothing after it. What happens?"],
         "A repeat repeats the card after it. With nothing after it, it repeats nothing."),
    home("Same output?", "Paper cards",
         ["Lay out: jump, jump, jump, jump.",
          "Lay out: repeat 4 times, jump.",
          "A grown-up runs both. Do they do the same thing?"],
         "Same output, fewer cards."),
    home("Test as you go", "Paper cards, a grown-up",
         ["Build a program two cards at a time. After every two, your grown-up runs it.",
          "Hide one wrong card somewhere. See how fast the test finds it.",
          "Try building all eight cards first, then testing once. Which was faster to fix?"],
         "The bug is always in the newest cards."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you predicted outputs, found and fixed bugs in everyday algorithms, and told a precise instruction from a vague one."
LESSON["warmup"] = [
    q("Jump, jump, jump. What is a shorter way to say it?", "\U0001F501", "jump three times", ["jump", "stop", "jump once, then stop"], "Saying 'three times' repeats the jump. That is what a repeat block does."),
    q("You press Run. What does the computer do?", "▶️", "it follows the program's blocks, one at a time", ["it guesses", "it switches off", "it makes up its own blocks"], "Run tells the computer to follow the program, block by block."),
]
