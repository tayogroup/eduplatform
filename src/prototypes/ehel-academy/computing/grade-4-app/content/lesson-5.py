# -*- coding: utf-8 -*-
"""Lesson 5 - Programs with Loops.

0059 Stage 4 Programming: 4P.02 develop programs with repetition; 4P.03
develop programs with iteration; 4P.04 programs that produce a desired
output, using the repeat command; 4P.01 add comments to blocks of code and
explain their benefits.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "programs-with-loops",
    "title": "Programs with Loops",
    "blurb": "Build programs with a repeat block, fold a long program into a short one that does the same thing, and add comments that say what each block is for.",
    "steps": [
        step("demo", "The repeat block", "\U0001F501", "Repeat reader", ["4P.02", "4P.03"],
             "A program can repeat too. The <b>repeat</b> block runs the block after it that many times. Press <b>Next</b>.",
             explain(
                 ["Repetition in a program is a repeat block: repeat 3 times, jump, makes the cat jump three times.", "Each time round is one iteration."],
                 ["Repeat 3 times, jump: jump, jump, jump.", "Repeat 4 times, move right: four squares to the right, one per iteration."],
                 ["Children think the repeat block repeats the whole program.", "It repeats the ONE block after it. The loops in lessons 1 and 4 held several steps, and in many apps a repeat can hold several blocks; this one holds one."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F501", "cap": "The <b>repeat</b> block: repeat 3 times.", "say": "The repeat block. Repeat 3 times."},
                 {"pic": "⬆️", "cap": "It runs the block AFTER it that many times: repeat 3 times, <b>jump</b>.", "say": "It runs the block after it that many times. Repeat 3 times, jump."},
                 {"pic": "\U0001F431", "cap": "Jump, jump, jump. Three <b>iterations</b>.", "say": "Jump, jump, jump. Three iterations: three times round.", "sound": "boing"},
                 {"pic": "\U0001F4AC", "cap": "The block after the repeat is done: <b>say hello</b> runs once.", "say": "When the repeat is done, the program carries on. Say hello runs once.", "sound": "pop"},
             ]},
             "Repeat N times: the next block, N times."),

        step("program", "Build it with a repeat", "\U0001F9E9", "Repeat builder", ["4P.02", "4P.03", "4P.04"],
             "Read the algorithm and build the program. When it says a number of times, use a <b>repeat</b> block, then <b>Run</b> it.",
             explain(
                 ["When the algorithm says 'jump 4 times', that is a repeat block and one jump, not four jumps."],
                 ["Jump 4 times, say hello: repeat 4 times, jump, say hello. Three blocks.",
                  "Go home, move right 3 times, grow: go home, repeat 3 times, move right, grow."],
                 ["Children drag four jump blocks.", "It works, but it is not the program the algorithm asked for. Use the repeat."],
                 ["Read, build with a repeat, run."]),
             {"sprite": "\U0001F431", "spriteName": "cat", "blocks": ["home", "right", "left", "jump", "spin", "say", "grow", "shrink", "repeat2", "repeat3", "repeat4"],
              "rounds": [
                  {"algorithm": ["Jump 4 times", "Say hello"], "expect": ["repeat4", "jump", "say"], "mustRepeat": True},
                  {"algorithm": ["Go home", "Move right 3 times", "Grow"], "expect": ["home", "repeat3", "right", "grow"], "mustRepeat": True},
                  {"algorithm": ["Spin 2 times", "Shrink", "Say hello"], "expect": ["repeat2", "spin", "shrink", "say"], "mustRepeat": True},
              ]},
             "Three programs with a repeat, built and run."),

        step("tidy", "Fold it into a loop", "\U0001F9F9", "Loop folder", ["4P.02", "4P.04"],
             "Each program works but repeats itself block by block. Fold the repeats into repeat blocks and take out the waits, then <b>Run</b> it to check it still does the same.",
             explain(
                 ["A program that writes grow, grow, grow can write repeat 3 times, grow instead. Same output, fewer blocks."],
                 ["Grow, grow, grow, wait, say hello: repeat 3 times grow, say hello.",
                  "Run it. The cat grows three times and says hello, exactly as before."],
                 ["Children fold two different blocks into one repeat.", "Only the SAME block, back to back, can be folded."],
                 ["Tap a block, choose, run, check."]),
             {"sprite": "\U0001F431",
              "rounds": [
                  {"goal": "grow 3 times, then say hello", "program": ["grow", "grow", "grow", "wait", "say"], "expect": ["repeat3", "grow", "say"]},
                  {"goal": "go home, jump twice, spin 4 times", "program": ["home", "jump", "jump", "spin", "spin", "spin", "spin"], "expect": ["home", "repeat2", "jump", "repeat4", "spin"]},
                  {"goal": "say hello, then move left 3 times", "program": ["say", "wait", "left", "left", "left", "wait"], "expect": ["say", "repeat3", "left"]},
              ]},
             "Long programs folded into loops, and still doing the same job."),

        step("context", "Why comment your code?", "\U0001F4AC", "Comment reasoner", ["4P.01"],
             "A <b>comment</b> is a note beside a block that says what it is for. The computer ignores it; people read it. Tap each benefit.",
             explain(
                 ["A comment is written for a person, not the computer. It says what a block is for, or why it is there."],
                 ["'Reset the cat' beside go home. 'Do the jump three times' beside the repeat.",
                  "Next week you will have forgotten why the wait is there. The comment remembers.", "A partner reading your program understands it faster."],
                 ["Children write a comment that repeats the block: 'jump' beside jump.", "Say WHY: 'jump over the wall'."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F9E0", "label": "you remember why", "say": "You remember why. Next week you will have forgotten why that wait block is there. The comment tells you."},
                 {"pic": "\U0001F91D", "label": "a partner understands", "say": "A partner understands your program without asking. Comments explain it while you are not there."},
                 {"pic": "\U0001F41B", "label": "bugs are easier to find", "say": "Bugs are easier to find. If the comment says 'jump three times' and the block says repeat 2, you have found the bug."},
                 {"pic": "\U0001F6AB", "label": "the computer ignores it", "say": "The computer ignores comments completely. A comment can never break the program, so you can write as many as you need."},
             ], "need": 4,
              "then": {"ask": "Who is a comment written for?",
                       "opts": [opt("People reading the program, including you later", True), opt("The computer, so it runs faster", False), opt("The cat", False)],
                       "why": "The computer skips comments. People read them."}},
             "Comments are notes for people."),

        step("comment", "Comment the program", "\U0001F4AC", "Code commenter", ["4P.01"],
             "Here is a program and four comments. Tap a comment, then tap the block it explains.",
             explain(
                 ["A comment sits beside the block it explains. Match each note to its block."],
                 ["'Put the cat back at the start' explains go home.", "'Do the next block three times' explains the repeat.", "'Greet the player when the jumps are done' explains say hello."],
                 [],
                 ["Tap a comment, tap its block."]),
             {"program": ["home", "repeat3", "jump", "say"],
              "comments": [
                  {"text": "Put the cat back at the start, so every run begins the same", "block": 0},
                  {"text": "Do the next block three times", "block": 1},
                  {"text": "The jump that gets repeated", "block": 2},
                  {"text": "Greet the player when the jumps are done", "block": 3},
              ],
              "then": {"ask": "The comment says 'do the next block three times' but the block says repeat 2 times. What have you found?",
                       "opts": [opt("A bug: the block does not match what it is meant to do", True), opt("Nothing; comments do not matter", False), opt("A faster program", False)],
                       "why": "A comment that disagrees with its block points straight at a bug."}},
             "Every block explained by its comment."),

        step("sort", "Good comment, or not?", "\U0001F5C2️", "Comment judge", ["4P.01"],
             "A good comment says WHY a block is there, or what it is for. Is this a good comment?",
             explain(
                 ["Good: it says why, or what for.", "Not good: it repeats the block's own words, or it is wrong."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Good comment, or not?",
              "bins": [{"id": "good", "label": "Good comment", "pic": "✅"}, {"id": "bad", "label": "Not helpful", "pic": "❌"}],
              "items": [
                  {"pic": "\U0001F3E0", "label": "beside go home: 'reset the cat so every run starts the same'", "bin": "good", "why": "It says why."},
                  {"pic": "⬆️", "label": "beside jump: 'jump'", "bin": "bad", "why": "It only repeats the block."},
                  {"pic": "\U0001F501", "label": "beside repeat 3 times: 'one jump for each wall in the level'", "bin": "good", "why": "It explains where the 3 comes from."},
                  {"pic": "⏳", "label": "beside wait: 'give the player time to read the message'", "bin": "good", "why": "Why the wait is there."},
                  {"pic": "\U0001F4AC", "label": "beside say hello: 'the cat spins'", "bin": "bad", "why": "It is wrong. A wrong comment is worse than none."},
                  {"pic": "\U0001F53C", "label": "beside grow: 'grow'", "bin": "bad", "why": "Repeats the block."},
              ]},
             "A good comment says why."),

        step("questions", "Check: loops and comments", "\U0001F4DD", "Loop checker", ["4P.01", "4P.02", "4P.03"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Repeat blocks, iteration, comments."], [], ["Read, think, tap."]),
             {"items": [
                 q("Repeat 4 times, jump. How many times does the cat jump?", "\U0001F501", "4", ["1", "2", "8"], "Four iterations."),
                 q("Which block does 'repeat 3 times' repeat?", "\U0001F9E9", "the one block right after it", ["every block in the program", "the block before it", "none"], "The next block only."),
                 q("What does the computer do with a comment?", "\U0001F4AC", "ignores it; it is for people", ["runs it", "repeats it", "deletes the program"], "Comments are notes for people."),
             ]},
             "Repeat, iterate, comment."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4P.01", "4P.02", "4P.03", "4P.04"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Repeat blocks, folding programs, comments."], [], ["Read, look, tap."]),
             {"items": [
                 q("'Jump 4 times, say hello' as a program is...", "\U0001F9E9", "repeat 4 times, jump, say hello", ["jump, say hello", "repeat 4 times, say hello", "say hello, jump"], "The repeat, the jump, then hello."),
                 q("Each time round a repeat block is called...", "\U0001F504", "an iteration", ["a comment", "an input", "a bug"], "Iteration means one time round."),
                 q("Grow, grow, grow folds into...", "\U0001F9F9", "repeat 3 times, grow", ["repeat 3 times, jump", "grow", "wait, grow"], "Same block three times: repeat 3, grow."),
                 q("Can jump, spin, jump be folded into one repeat?", "❓", "no: the blocks are not all the same", ["yes: repeat 3 times, jump", "yes: repeat 2 times, spin", "yes: repeat 3 times, spin"], "Only the same block back to back folds."),
                 q("A comment beside a block is for...", "\U0001F4AC", "people reading the program", ["the computer", "the cat", "making it run faster"], "The computer ignores it."),
                 q("The best comment beside 'wait' is...", "⏳", "'give the player time to read the message'", ["'wait'", "'the cat jumps'", "'block 3'"], "It says why."),
                 q("A comment says 'jump three times' and the block says repeat 2 times. That is...", "\U0001F41B", "a bug you have just found", ["fine", "a faster program", "a new comment"], "Comments help you spot bugs."),
             ]},
             "That is the whole lesson finished. You build with a repeat and comment your code."),
    ],
}


LESSON["about"] = [
    "Build a program with a repeat block from an algorithm that says how many times.",
    "Fold a long program into a shorter one with the same output.",
    "Explain what a comment is and why it helps.",
    "Match comments to the blocks they explain, and judge a good comment.",
]

LESSON["lecture"] = [
    part("\U0001F501", "The repeat block",
         "A program repeats with a repeat block: repeat 3 times, jump, makes the cat jump three times. It repeats the ONE block after it, and each time round is called an iteration. When the count is done, the program carries on."),
    part("\U0001F9F9", "Folding a program",
         "Grow, grow, grow is the same block three times, so it folds into repeat 3 times, grow. Same output, fewer blocks, and a wait that does nothing can go. Only the same block, back to back, can be folded: jump, spin, jump cannot."),
    part("\U0001F4AC", "Comments",
         "A comment is a note beside a block, written for people. The computer skips it. A good comment says why the block is there: 'reset the cat so every run starts the same', 'one jump for each wall'. A comment that only repeats the block's own words helps nobody."),
    part("\U0001F41B", "Why comments help",
         "You remember why next week. A partner understands your program without asking. And when a comment disagrees with its block - 'jump three times' beside repeat 2 - you have found a bug."),
]

LESSON["words"] = [
    word("repeat block", "\U0001F501", "A block that runs the block after it a set number of times.",
         ["Repeat 4 times, jump.", "Use a repeat block instead of four jumps."]),
    word("iteration", "\U0001F504", "One time round a repeat.",
         ["Three iterations of jump.", "Each iteration is one jump."]),
    word("fold", "\U0001F9F9", "To turn the same block written many times into one repeat.",
         ["Fold grow, grow, grow into repeat 3 times, grow.", "Fold the repeats."]),
    word("comment", "\U0001F4AC", "A note beside a block for people to read; the computer ignores it.",
         ["Write a comment that says why.", "The comment explains the wait."]),
    word("output", "\U0001F4E4", "What the program makes happen: the cat's jumps, its words, its size.",
         ["The desired output is three jumps.", "Same output, fewer blocks."]),
]

LESSON["home"] = [
    home("Fold the routine", "Paper, a pen",
         ["Write a real routine long, step by step: brush top, brush bottom, brush top, brush bottom.",
          "Fold every run of the same step into 'repeat N times'.",
          "Count the lines before and after."],
         "Same routine, fewer lines."),
    home("Comment a recipe", "A recipe, sticky notes",
         ["Pick a recipe. Beside each step, write a note that says WHY: 'so the cake rises', 'so it does not burn'.",
          "Give it to someone who has never made it. Can they follow it?",
          "Cross out any note that only repeats the step."],
         "A good comment says why."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you followed and wrote algorithms that give different outputs for different inputs, and built algorithms with a repeat loop in them."
LESSON["warmup"] = [
    q("You write a note on your drawing: 'the red square is the door'. Who is the note for?", "\U0001F4DD", "anyone who looks at the drawing later, even you", ["nobody", "the pencil", "the paper"], "A note that says what a part is for helps the next reader. In a program it is called a comment."),
    q("Robo must go forward 5 squares. With a repeat block and a move forward block, which number goes in the repeat?", "\U0001F501", "5", ["1", "4", "10"], "The number in the repeat says how many times the block after it happens."),
]
