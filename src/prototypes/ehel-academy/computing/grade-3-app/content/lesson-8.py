# -*- coding: utf-8 -*-
"""Lesson 8 - Mistakes Make Programs Better.

0059 Stage 3 Programming: 3P.09 test and debug programs so that they run and
produce the desired output; 3P.08 programmers use their mistakes to inform
the programs they create; 3P.07 the benefits of working with others when
creating programs.
"""
from _kit import explain, step, opt, q, choice, part, word, home

LESSON = {
    "slug": "mistakes-make-programs-better",
    "title": "Mistakes Make Programs Better",
    "blurb": "Run, look, think, fix, run again: debug programs with two bugs in them, ask a partner when you are stuck, and turn each mistake into a rule for next time.",
    "steps": [
        step("context", "The debugging habit", "\U0001F41E", "Habit builder", ["3P.09", "3P.08"],
             "Programmers debug the same way every time. Tap each step of the habit.",
             explain(
                 ["Debugging is not luck. It is a habit with steps: run, look, think, fix, run again."],
                 ["Run: see what it really does.", "Look: where did it go wrong?", "Think: which block would do that?", "Fix: change that block.", "Run again: was the fix right?"],
                 ["Children skip 'look' and change the first block they see.", "Watch where it went wrong. The bug is there."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "▶️", "label": "run it", "say": "Run it. You cannot fix what you have not seen. Run the program and watch what it actually does."},
                 {"pic": "\U0001F440", "label": "look", "say": "Look. Where did it go wrong? The cat spun when it should have jumped. That is the moment."},
                 {"pic": "\U0001F914", "label": "think", "say": "Think. Which block made the cat spin? The one after the repeat. That block is the bug."},
                 {"pic": "\U0001F527", "label": "fix", "say": "Fix. Change that one block. Not the whole program: just the block that did the wrong thing."},
                 {"pic": "\U0001F501", "label": "run again", "say": "Run again. A fix you have not tested is a guess. Run it and check. If there is another bug, go round again."},
             ], "need": 5,
              "then": {"ask": "You fixed a bug. What comes next?",
                       "opts": [opt("Run the program again to test the fix", True), opt("Stop; it must be right now", False), opt("Fix every other block too", False)],
                       "why": "Run again. A program can have more than one bug, and a fix can be wrong."}},
             "Run, look, think, fix, run again."),

        step("debug", "Two bugs, and a partner", "\U0001F41B", "Two-bug debugger", ["3P.09", "3P.07"],
             "Each program has bugs; some have two. Run it, find one, fix it, run again, find the other. Ask your partner if you are stuck.",
             explain(
                 ["A program can have more than one bug. Fix one, run again, and the second one shows itself."],
                 ["The cat should move right twice then jump. It moves right, then left, then spins. Two blocks are wrong.",
                  "Fix the left: run again: it still spins. Fix the spin: run again: right."],
                 ["Children fix one bug and stop.", "The run after the fix tells you if there is another."],
                 ["Run, find, fix, run, find, fix, run."]),
             {"sprite": "\U0001F431",
              "rounds": [
                  {"goal": "move right twice, then jump", "program": ["right", "left", "spin"], "bugs": [1, 2], "expect": ["right", "right", "jump"],
                   "whys": {"1": "The second block moves left. We wanted a second move right.", "2": "The last block spins. We wanted a jump."},
                   "fixes": {"1": {"opts": [choice("right", "move right", True), choice("hide", "hide", False), choice("shrink", "shrink", False)], "why": "Move right, move right. Run it again: is that everything?"},
                             "2": {"opts": [choice("jump", "jump", True), choice("grow", "grow", False), choice("say", "say hello", False)], "why": "Jump. Run it again to test."}},
                   "partner": {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "hint": "I think there is more than one bug. Fix one, run it, and look again."}},
                  {"goal": "jump 3 times, then say hello, then grow", "program": ["repeat3", "spin", "say", "shrink"], "bugs": [1, 3], "expect": ["repeat3", "jump", "say", "grow"],
                   "whys": {"1": "The repeat repeats a spin. We wanted jumps.", "3": "The last block shrinks. We wanted grow."},
                   "fixes": {"1": {"opts": [choice("jump", "jump", True), choice("right", "move right", False), choice("hide", "hide", False)], "why": "Repeat 3 times, jump. Run it again."},
                             "3": {"opts": [choice("grow", "grow", True), choice("spin", "spin", False), choice("left", "move left", False)], "why": "Grow. Run it and check."}},
                   "partner": {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "hint": "Watch what comes after the repeat block, and watch the very last block."}},
                  {"goal": "go home, move left, spin twice", "program": ["home", "left", "repeat2", "jump"], "bug": 3, "expect": ["home", "left", "repeat2", "spin"],
                   "why": "The repeat repeats a jump. We wanted two spins.",
                   "fix": {"opts": [choice("spin", "spin", True), choice("right", "move right", False), choice("grow", "grow", False)], "why": "Spin. Run it again."}},
              ]},
             "Five bugs across three programs, every fix tested."),

        step("sort", "What did the mistake teach?", "\U0001F5C2️", "Lesson sorter", ["3P.08"],
             "A programmer made a mistake. What rule should they take from it? Tap the rule.",
             explain(
                 ["A mistake becomes a rule for next time. That is how it informs the next program."],
                 ["The cat started in the wrong place: rule, reset first.", "The repeat repeated the wrong block: rule, check the block after every repeat.",
                  "The fix did not work: rule, run again after every fix.", "The dog did nothing: rule, check whose script you are building."],
                 [],
                 ["Read the mistake, tap the rule."]),
             {"ask": "Which rule does this mistake teach?",
              "bins": [{"id": "reset", "label": "Reset first", "pic": "\U0001F3E0"}, {"id": "repeat", "label": "Check after the repeat", "pic": "\U0001F501"}, {"id": "test", "label": "Run again after a fix", "pic": "▶️"}, {"id": "tab", "label": "Check whose script", "pic": "\U0001F431"}],
              "items": [
                  {"pic": "\U0001F3E0", "label": "the cat began two squares along and ended in the wrong place", "bin": "reset", "why": "It was not reset. Go home first."},
                  {"pic": "\U0001F501", "label": "repeat 3 times spun instead of jumping", "bin": "repeat", "why": "The block after the repeat was wrong."},
                  {"pic": "▶️", "label": "I fixed the bug but never ran it, and it was still wrong", "bin": "test", "why": "An untested fix is a guess."},
                  {"pic": "\U0001F436", "label": "the dog did nothing because all the blocks went on the cat", "bin": "tab", "why": "The wrong object's script."},
                  {"pic": "\U0001F3E0", "label": "the second run started where the first one finished", "bin": "reset", "why": "Initialisation was missing."},
                  {"pic": "▶️", "label": "there was a second bug I did not see until I ran it again", "bin": "test", "why": "Running again showed it."},
              ]},
             "Every mistake, a rule."),

        step("context", "Debugging with a partner", "\U0001F91D", "Pair debugger", ["3P.07"],
             "Two people debug better than one. Tap each reason.",
             explain(
                 ["Your partner did not write your program, so they read it fresh.", "They see the block you keep skipping over."],
                 ["Explain your program to your partner, block by block. Often you find the bug yourself while explaining.",
                  "Your partner can run it while you watch. Two pairs of eyes see more than one."],
                 [],
                 ["Tap all three."]),
             {"items": [
                 {"pic": "\U0001F440", "label": "fresh eyes", "say": "Fresh eyes. Your partner did not write the program, so they are not sure it is right. They look at every block. You skip the ones you are sure about, and one of those is the bug."},
                 {"pic": "\U0001F5E3️", "label": "explain it out loud", "say": "Explain it out loud, block by block. Halfway through you say, and then it spins, and stop: it should not spin. You found it yourself, by saying it."},
                 {"pic": "\U0001F91D", "label": "one runs, one watches", "say": "One person presses Run, the other only watches the cat. The watcher sees the exact moment it goes wrong."},
             ], "need": 3,
              "then": {"ask": "Why does explaining your program out loud to a partner help?",
                       "opts": [opt("Saying each block makes you notice the one that is wrong", True), opt("It makes the program run faster", False), opt("It does not help", False)],
                       "why": "Programmers call it rubber-ducking, and it finds bugs."}},
             "Fresh eyes, said out loud, one runs and one watches."),

        step("questions", "Check: debugging", "\U0001F4DD", "Debug checker", ["3P.07", "3P.08", "3P.09"],
             "Three quick questions.",
             explain(["Nothing new here."], ["The habit, the rules, the partner."], [], ["Read, think, tap."]),
             {"items": [
                 q("The first step of debugging is...", "▶️", "run it and watch what it really does", ["delete a block", "ask for a new program", "change every block"], "You cannot fix what you have not seen."),
                 q("After you fix one bug, the run shows another. That means...", "\U0001F41B", "programs can have more than one bug; fix it and run again", ["the fix broke it", "the computer is wrong", "give up"], "Round the habit again."),
                 q("A mistake informs your next program when you...", "\U0001F4DD", "turn it into a rule you follow next time", ["forget it", "blame the computer", "never program again"], "Reset first, check after the repeat: rules from mistakes."),
             ]},
             "The habit, the rule, the partner."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3P.07", "3P.08", "3P.09"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about the debugging habit, mistakes and partners."], [], ["Read, look, tap."]),
             {"items": [
                 q("Run, look, think, fix, and then...", "\U0001F501", "run again", ["stop", "delete", "add a wait"], "A fix is tested by a run."),
                 q("The cat spun when it should have jumped. The bug is...", "\U0001F440", "the block that made it spin", ["the first block", "the cat", "the Run button"], "Look where it went wrong; the bug is there."),
                 q("The program still goes wrong after your fix. The best next step is...", "\U0001F914", "look again: there may be a second bug, or the fix was wrong", ["give up", "run it ten more times without changing anything", "start a different program"], "Round the habit again."),
                 q("'The cat began in the wrong place' teaches the rule...", "\U0001F3E0", "reset first", ["never use the cat", "add more jumps", "use a bigger stage"], "A mistake becomes a rule."),
                 q("Your partner reads your program fresh and finds the bug. Why could they see it?", "\U0001F440", "they did not write it, so they checked every block", ["they are cleverer", "luck", "they changed it"], "Fresh eyes do not skip."),
                 q("Explaining your program out loud, block by block, is called...", "\U0001F5E3️", "rubber-ducking, and it finds bugs", ["cheating", "a repeat", "initialisation"], "Saying it makes you notice."),
                 q("A program that runs and produces the output we wanted is...", "✅", "tested and working", ["untested", "buggy", "static"], "Tested by running, and right."),
             ]},
             "That is the whole lesson finished. You debug with a habit, learn from mistakes, and work with a partner."),
    ],
}


LESSON["about"] = [
    "Test a program by running it, and debug it until it produces the output we want.",
    "Find and fix more than one bug in a program.",
    "Turn a mistake into a rule for the next program.",
    "Say why debugging with a partner works.",
]

LESSON["lecture"] = [
    part("\U0001F41E", "The habit",
         "Debugging is a habit: run it and watch what it really does; look for the moment it goes wrong; think which block did that; fix that one block; run again. If the run shows another bug, go round again."),
    part("\U0001F41B", "More than one bug",
         "Programs often have two bugs, and the second hides behind the first. Fix one, run again, and the second shows itself. That is why the run after the fix is never skipped."),
    part("\U0001F4DD", "Mistakes inform the next program",
         "Every programmer makes mistakes. Good ones write them down as rules: the cat started in the wrong place, so reset first; the repeat repeated the wrong block, so check the block after it. The next program is better because of the last one's mistakes."),
    part("\U0001F91D", "A partner",
         "Your partner did not write your program, so they read every block instead of skipping the ones you are sure about. Explain it to them out loud and you often find the bug yourself. One runs, one watches, and the watcher sees the moment it goes wrong."),
]

LESSON["words"] = [
    word("debug", "\U0001F41E", "To find and fix what is wrong in a program.",
         ["Debug it before you show it.", "We debugged two bugs."]),
    word("bug", "\U0001F41B", "A mistake in a program that makes it do the wrong thing.",
         ["The bug is the spin block.", "There are two bugs."]),
    word("habit", "\U0001F501", "Something you do the same way every time.",
         ["Debugging is a habit: run, look, think, fix, run.", "Make testing a habit."]),
    word("rule", "\U0001F4CF", "Something you always do, learned from a mistake.",
         ["Rule: reset first.", "A mistake becomes a rule."]),
    word("fresh eyes", "\U0001F440", "Someone looking at a program they did not write.",
         ["Fresh eyes find bugs.", "Ask a partner for fresh eyes."]),
]

LESSON["home"] = [
    home("Bug hunt in pairs", "A partner, cards",
         ["Write a five-card program with two wrong cards.",
          "Your partner acts it out; you watch for the moment it goes wrong.",
          "Fix one card, act it out again, find the other."],
         "Fix, run again, find the next."),
    home("The rule book", "A notebook",
         ["Write three rules from mistakes you have made this week: in programming or anywhere.",
          "Say what the mistake was, and what the rule is.",
          "Read the rules before you start something new."],
         "Mistakes inform what you make next."),
]
