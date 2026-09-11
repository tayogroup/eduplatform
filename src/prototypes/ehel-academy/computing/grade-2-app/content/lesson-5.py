# -*- coding: utf-8 -*-
"""Lesson 5 - Debugging Together.

0059 Stage 2 Programming: 2P.07 debug programs so that they run and produce
the desired output; 2P.05 the benefits of working with others when
debugging; 2P.06 the benefits of testing regularly; with 2P.02.
"""
from _kit import explain, step, opt, q, choice, part, word, home

LESSON = {
    "slug": "debugging-together",
    "title": "Debugging Together",
    "blurb": "Programs with one bug, then programs with two; a partner to ask when you are stuck; and the habit that finds every bug: run it again after every fix.",
    "steps": [
        step("demo", "Two heads", "\U0001F465", "Two heads", ["2P.05"],
             "Sami is stuck on a bug. Press <b>Next</b> and see what helps.",
             explain(
                 ["When you have looked at your own program for a long time, you stop seeing it.", "A partner sees it fresh."],
                 ["Sami has read his program ten times and cannot find the bug.", "Amal looks once and says: the second block spins.",
                  "Explaining your program out loud to someone finds bugs too, because you hear what it really says."],
                 ["Children think asking for help means they failed.", "Programmers ask each other all day. It is how programs get fixed."],
                 ["Press Next and watch the bug get found."]),
             {"frames": [
                 {"pic": "\U0001F466\U0001F3FE\U0001F4BB", "cap": "Sami has a bug. He has looked ten times and cannot see it.", "say": "Sami's program has a bug. He has looked at it ten times and cannot see it."},
                 {"pic": "\U0001F467\U0001F3FE\U0001F440", "cap": "Amal looks once. <b>Fresh eyes</b> see what tired eyes miss.", "say": "Amal comes to look. Fresh eyes see what tired eyes miss.", "sound": "click"},
                 {"pic": "\U0001F5E3️", "cap": "Sami explains each block out loud, and HEARS the bug himself.", "say": "Sami explains each block out loud. Move right. Jump. Spin. And he hears it himself: spin? We wanted jump!", "sound": "ding"},
                 {"pic": "\U0001F527▶️", "cap": "Fix it together. Run it again. Test it together.", "say": "They fix it together, run it again, and test it together.", "sound": "tada"},
             ]},
             "Two heads find a bug faster than one. Explaining it out loud helps too."),

        step("debug", "Find the bug, fix it, run it again", "\U0001F436", "Debugger", ["2P.07", "2P.05", "2P.06"],
             "Press <b>Run</b>. Find the bug and fix it. Some programs have TWO bugs, so run it again after every fix. A friend is there if you get stuck.",
             explain(
                 ["Run it first and watch. Then find the block that went wrong. Fix it. Then RUN IT AGAIN."],
                 ["Some programs have two bugs.", "After the first fix, the program is better but still wrong.", "Only running it again shows you that.",
                  "If you cannot see the bug, press Ask, and your friend gives you a hint."],
                 ["Children fix one bug and press Next without running.", "A fix you have not tested is a guess."],
                 ["Run, find, fix, run again. Ask a friend if you are stuck."]),
             {"sprite": "\U0001F436", "rounds": [
                 {"goal": "grow, then jump twice", "program": ["grow", "spin", "jump"], "bug": 1, "expect": ["grow", "jump", "jump"],
                  "why": "The second block spins. We wanted a jump.",
                  "fix": {"opts": [choice("jump", "jump", True), choice("shrink", "shrink", False), choice("left", "move left", False)], "why": "Grow, jump, jump. Fixed."},
                  "partner": {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "hint": "Watch the second block. It spins, and we wanted a jump."}},
                 {"goal": "move left twice, then say hello", "program": ["left", "right", "spin"], "bugs": [1, 2], "expect": ["left", "left", "say"],
                  "whys": {"1": "The second block goes right. We wanted a second move left.", "2": "The last block spins. We wanted say hello."},
                  "fixes": {"1": {"opts": [choice("left", "move left", True), choice("hide", "hide", False), choice("shrink", "shrink", False)], "why": "Move left, move left. Now run it again."},
                            "2": {"opts": [choice("say", "say hello", True), choice("jump", "jump", False), choice("grow", "grow", False)], "why": "And hello at the end."}},
                  "partner": {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "hint": "I think there is more than one bug. Fix one, run it, and look again."}},
                 {"goal": "say hello, grow, then spin twice", "program": ["say", "shrink", "repeat2", "jump"], "bugs": [1, 3], "expect": ["say", "grow", "repeat2", "spin"],
                  "whys": {"1": "The second block shrinks. We wanted grow.", "3": "The repeat block repeats a jump. We wanted it to repeat a spin."},
                  "fixes": {"1": {"opts": [choice("grow", "grow", True), choice("hide", "hide", False), choice("right", "move right", False)], "why": "Grow. Run it again and check the rest."},
                            "3": {"opts": [choice("spin", "spin", True), choice("say", "say hello", False), choice("left", "move left", False)], "why": "Repeat 2 times, spin. Two spins."}},
                  "partner": {"name": "Nora", "pic": "\U0001F467\U0001F3FD", "hint": "Say each block out loud. Which word is not in the goal?"}},
                 {"goal": "jump 3 times, then hide", "program": ["repeat3", "jump", "home"], "bug": 2, "expect": ["repeat3", "jump", "hide"],
                  "why": "The last block goes home. We wanted hide.",
                  "fix": {"opts": [choice("hide", "hide", True), choice("spin", "spin", False), choice("grow", "grow", False)], "why": "Three jumps, then hide. Fixed."},
                  "partner": {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "hint": "The repeat is fine. Look at the very last block."}},
             ]},
             "Six bugs across four programs, every fix tested by running it again."),

        step("sort", "Good debugging habit, or not?", "\U0001F5C2️", "Habit sorter", ["2P.05", "2P.06"],
             "Some habits find bugs. Some hide them. Which is this?",
             explain(
                 ["Good habits: run it after every fix, ask a friend, explain it out loud, change one thing at a time."],
                 ["Fixing three blocks at once without running: if it still fails, which fix was wrong?", "Hiding the program: nobody can help with what they cannot see."],
                 [],
                 ["Ask: does this help find the bug, or hide it?"]),
             {"ask": "Good debugging habit, or not?",
              "bins": [{"id": "good", "label": "Good habit", "pic": "✅"}, {"id": "bad", "label": "Not a good habit", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F465", "label": "ask a friend to look at your program", "bin": "good", "why": "Fresh eyes see what tired eyes miss."},
                  {"pic": "\U0001F648", "label": "hide the program so nobody sees the bug", "bin": "bad", "why": "Nobody can help with what they cannot see."},
                  {"pic": "▶️", "label": "run it again after every fix", "bin": "good", "why": "Running it is the only way to know the fix worked."},
                  {"pic": "\U0001F527\U0001F527\U0001F527", "label": "change three blocks at once without running", "bin": "bad", "why": "If it still fails, you cannot tell which change was wrong."},
                  {"pic": "\U0001F5E3️", "label": "explain each block out loud", "bin": "good", "why": "Saying it out loud lets you hear the wrong block."},
                  {"pic": "\U0001F3F3️", "label": "give up and delete it", "bin": "bad", "why": "A bug is a job to do, not a reason to stop."},
                  {"pic": "\U0001F91D", "label": "take turns: one reads, one watches the cat", "bin": "good", "why": "Two jobs, two people. Each sees something different."},
                  {"pic": "\U0001F449", "label": "blame the computer", "bin": "bad", "why": "The computer did exactly what the program said. The bug is in the program."},
              ]},
             "Run it, ask, explain, change one thing. Those are the habits that find bugs."),

        step("questions", "Why work together?", "\U0001F91D", "Team thinker", ["2P.05"],
             "What does a partner bring to debugging? Tap the answer.",
             explain(
                 ["A partner brings fresh eyes, different knowledge, and someone to explain to."],
                 ["They might know a block you do not.", "They can watch the cat while you read the blocks.", "Explaining to them makes you read your own program slowly."],
                 [],
                 ["Think about Sami and Amal, then tap."]),
             {"label": "Question", "items": [
                 q("Sami has looked at his program ten times. Why might Amal find the bug faster?", "\U0001F440", "fresh eyes see what tired eyes miss", ["she is taller", "she has never seen a program", "she cannot"], "After ten looks you stop seeing your own program. A fresh look helps."),
                 q("Explaining your program out loud to a friend helps because...", "\U0001F5E3️", "you hear what each block really says", ["it is loud", "the friend fixes it for you", "it makes the cat move"], "Saying 'spin' out loud when the goal says 'jump' is how you catch it."),
                 q("Two people debugging: what is a good way to share the job?", "\U0001F91D", "one reads the blocks, one watches what the cat does", ["both watch the cat", "both close their eyes", "one leaves"], "Two jobs, two people, and each sees something different."),
                 q("Your friend knows a block you have never used. That helps because...", "\U0001F9E9", "they can suggest a block you did not know about", ["it does not help", "they will do all the work", "blocks are secret"], "Different people know different things."),
             ]},
             "Fresh eyes, a second brain, and someone to explain to."),

        step("context", "Programmers work together", "\U0001F469‍\U0001F4BB", "Team programmers", ["2P.05", "2P.07"],
             "Real programmers debug together every day. Tap each one.",
             explain(
                 ["Big programs are made by teams, and teams find bugs together."],
                 ["Two programmers share one screen: one types, one watches.", "A programmer reads a friend's program to look for bugs before it is used.",
                  "A team makes a game; a tester's whole job is finding bugs.", "A friend plays your game and finds a door that will not open."],
                 [],
                 ["Tap each one and hear how the team finds the bugs."]),
             {"items": [
                 {"pic": "\U0001F469‍\U0001F4BB\U0001F468‍\U0001F4BB", "label": "pair programming", "say": "Two programmers share one screen. One types, one watches for bugs. Then they swap."},
                 {"pic": "\U0001F4D6", "label": "reading a friend's program", "say": "Before a program is used, another programmer reads it carefully, looking for bugs the writer missed."},
                 {"pic": "\U0001F3AE", "label": "a games team", "say": "A team makes a game. One person's whole job is to play it and find every bug before you do."},
                 {"pic": "\U0001F9D2", "label": "a friend testing your program", "say": "A friend plays your game and finds a door that will not open. Now you know where to look."},
             ], "need": 4,
              "then": {"ask": "Why do programmers read each other's programs?",
                       "opts": [opt("To find bugs the writer missed", True), opt("To copy them", False), opt("Because they are bored", False)],
                       "why": "A second reader finds what the first one stopped seeing."}},
             "Programmers debug together. So can you."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2P.07", "2P.05", "2P.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about two bugs, running it again, and asking a friend."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("You fixed one bug. What must you do next?", "▶️", "run the program again", ["press Next", "fix another block without looking", "close the program"], "Only running it shows whether the fix worked and whether another bug is left."),
                 q("A program can have...", "\U0001F41B\U0001F41B", "more than one bug", ["only one bug", "no bugs, ever", "bugs only on Mondays"], "Programs can have two bugs, or more."),
                 q("After one fix the dog moves left twice but spins instead of saying hello. What does that tell you?", "\U0001F436", "there is another bug", ["the program is finished", "the dog is broken", "the first fix was wrong"], "Better but not right means another bug is still there."),
                 q("You cannot see the bug. What is a good thing to do?", "\U0001F465", "ask a friend to look", ["hide the program", "give up", "delete everything"], "Fresh eyes find what tired eyes miss."),
                 q("Explaining each block out loud helps you...", "\U0001F5E3️", "hear the block that is wrong", ["run faster", "make the cat bigger", "add more blocks"], "You hear 'spin' when the goal says 'jump'."),
                 q("Which is the BAD debugging habit?", "\U0001F6AB", "changing three blocks at once without running", ["running after every fix", "asking a friend", "explaining out loud"], "If it still fails you cannot tell which change was wrong."),
                 q("A program goes wrong. Where is the bug?", "\U0001F4BB", "in the program: the computer did what it was told", ["in the computer", "in the cat", "nowhere"], "The computer did exactly what the program said."),
                 q("What does debugging mean?", "\U0001F527", "finding and fixing bugs so the program does what we wanted", ["writing a new program", "drawing insects", "switching off"], "Debugging is finding and fixing the errors."),
             ]},
             "That is the whole lesson finished. You can debug, and you know why two heads are better than one."),
    ],
}


LESSON["about"] = [
    "Debug a program so that it runs and does what we wanted.",
    "Find two bugs in one program by running it again after each fix.",
    "Say why working with a partner helps when debugging.",
    "Say why testing regularly keeps bugs small.",
]

LESSON["lecture"] = [
    part("\U0001F41B", "Run it first",
         "When a program does not do what we wanted, run it and watch. Seeing the dog go wrong tells you where to look. Then find the block, fix it, and run it again."),
    part("\U0001F41B\U0001F41B", "Two bugs",
         "Some programs have two bugs. After the first fix the program is better but still wrong. You only know that if you run it again. Fix one thing, run it, look again."),
    part("\U0001F465", "Two heads",
         "When you have looked at your own program ten times you stop seeing it. A partner sees it fresh. One person can read the blocks while the other watches the dog. Ask, and listen to the hint."),
    part("\U0001F5E3️", "Say it out loud",
         "Explaining your program out loud to someone is a way of debugging. Move right. Jump. Spin. Spin? We wanted jump. You hear the bug yourself."),
    part("\U0001F469‍\U0001F4BB", "Programmers do it too",
         "Real programmers work in pairs and teams. They read each other's programs looking for bugs, and some people's whole job is testing. Debugging together is how big programs get made."),
]

LESSON["words"] = [
    word("debug", "\U0001F527", "To find the bugs in a program and fix them.",
         ["Let us debug it together.", "She debugged both bugs."]),
    word("partner", "\U0001F465", "Someone you work with.",
         ["Ask your partner to look.", "My partner found the bug."]),
    word("hint", "\U0001F4A1", "A small clue that helps you find the answer yourself.",
         ["Amal gave me a hint.", "The hint said: look at the last block."]),
    word("test", "▶️", "To run a program and check it did what you wanted.",
         ["Test it after every fix.", "The second test found another bug."]),
    word("fix", "\U0001F527", "To put a wrong block right.",
         ["Fix the second block.", "One fix at a time."]),
    word("explain", "\U0001F5E3️", "To say clearly what something does.",
         ["Explain each block out loud.", "Explaining found the bug."]),
]

LESSON["home"] = [
    home("Debug with a grown-up", "Paper cards with blocks written on them",
         ["A grown-up writes a five-card program with TWO wrong cards.",
          "Run it (act it out), find one bug, fix it, run it AGAIN.",
          "Find the second bug the same way."],
         "After the first fix it was better but still wrong. Only running it again showed that."),
    home("Explain it out loud", "Any program you have made, on paper or on a tablet",
         ["Explain every block to a grown-up, one at a time: this block does this.",
          "Listen to yourself.",
          "Did you hear a block that does not match the plan?"],
         "Saying it slowly out loud is a way of testing."),
    home("Swap and check", "Two people, two paper programs",
         ["Each of you writes a program with one bug hidden in it.",
          "Swap. Find the bug in the other person's program.",
          "Say what it should be."],
         "Fresh eyes find bugs faster than the eyes that wrote them."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you planned the blocks for each object in a program, then built and tested each one."
LESSON["warmup"] = [
    q("You are stuck on a hard puzzle. Who could help?", "\U0001F91D", "a friend, who sees it with fresh eyes", ["nobody, ever", "the puzzle", "a sleeping cat"], "A friend sees what you have stopped seeing."),
    q("When a program does not do what we wanted, it has...", "\U0001F41B", "a bug", ["a sticker", "a song", "a nap"], "A mistake in a program is called a bug."),
]
