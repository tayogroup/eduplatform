# -*- coding: utf-8 -*-
"""Lesson 6 - Many Things at Once.

0059 Stage 3 Programming: 3P.03 programs with more than one algorithm
running at the same time; 3P.04 programs with more than one object,
including a static object; 3P.07 the benefits of working with others when
creating programs; 3P.08 programmers use their mistakes to inform the
programs they create.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "many-things-at-once",
    "title": "Many Things at Once",
    "blurb": "Give the cat, the dog and a tree their own programs and run them all at the same time, keep the tree still, and find out why programmers work in pairs and learn from their mistakes.",
    "steps": [
        step("demo", "Two programs, one Run", "\U0001F431\U0001F436", "Two-at-once watcher", ["3P.03"],
             "A computer can run more than one algorithm at the SAME time. Press <b>Next</b>.",
             explain(
                 ["A program can have several scripts, one for each object, and they all run at once when you press Run."],
                 ["The cat's script: move right, jump. The dog's script: jump, jump.", "Press Run and both start together: the cat's first block and the dog's first block in the same beat."],
                 ["Children think the dog waits for the cat to finish.", "They run side by side, at the same time. That is what 'at the same time' means."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F431 \U0001F436", "cap": "Two objects on the stage: a cat and a dog. Each has its own script.", "say": "Two objects on the stage: a cat and a dog. Each has its own script."},
                 {"pic": "➡️ ⬆️", "cap": "Beat 1: the cat moves right WHILE the dog jumps. Same beat.", "say": "Beat one: the cat moves right while the dog jumps. At the same time.", "sound": "pop"},
                 {"pic": "⬆️ ⬆️", "cap": "Beat 2: the cat jumps WHILE the dog jumps again.", "say": "Beat two: the cat jumps while the dog jumps again.", "sound": "boing"},
                 {"pic": "\U0001F3AC", "cap": "Two algorithms, running at the same time, from one press of Run.", "say": "Two algorithms, running at the same time, from one press of Run.", "sound": "tada"},
             ]},
             "More than one algorithm, at the same time."),

        step("parallel", "Cat and dog together", "\U0001F431\U0001F436", "Parallel programmer", ["3P.03", "3P.04"],
             "Build the cat's program AND the dog's program (tap each tab). Then press <b>Run all at once</b>.",
             explain(
                 ["Each object has its own algorithm. You build each one, and Run starts them all together."],
                 ["Cat: move right, jump. Dog: jump, jump.", "Tap the cat's tab, build its blocks; tap the dog's tab, build its blocks; run."],
                 ["Children build both algorithms on one object.", "Check the tab. Whose program are you building?"],
                 ["Tab, build, tab, build, run."]),
             {"sprites": ["\U0001F431", "\U0001F436"], "spriteNames": ["cat", "dog"], "blocks": ["right", "left", "jump", "spin", "say", "grow", "shrink", "repeat2", "repeat3"],
              "rounds": [
                  {"scripts": [{"algorithm": ["Move right", "Jump"], "expect": ["right", "jump"]}, {"algorithm": ["Jump", "Jump"], "expect": ["jump", "jump"]}]},
                  {"scripts": [{"algorithm": ["Spin", "Move left", "Say hello"], "expect": ["spin", "left", "say"]}, {"algorithm": ["Move right", "Grow"], "expect": ["right", "grow"]}]},
                  {"scripts": [{"algorithm": ["Jump 3 times"], "expect": ["repeat3", "jump"]}, {"algorithm": ["Say hello", "Spin 2 times"], "expect": ["say", "repeat2", "spin"]}]},
              ]},
             "Two objects, two programs, one Run."),

        step("parallel", "Add a static object", "\U0001F333", "Static programmer", ["3P.04", "3P.03"],
             "Now there is a tree too. A tree is a <b>static</b> object: it does not move, but it can still have a program.",
             explain(
                 ["A static object stays where it is. It has no move blocks, but it can say things, grow, or hide."],
                 ["The tree's program: say hello, grow. It never moves.", "The cat and the dog move around it, all three running at once."],
                 ["Children try to give the tree a move block.", "A static object has no moves in its palette. It stays put; that is what static means."],
                 ["Build all three, then run."]),
             {"sprites": ["\U0001F431", "\U0001F436", "\U0001F333"], "spriteNames": ["cat", "dog", "tree"], "static": [2],
              "blocks": ["right", "left", "jump", "spin", "say", "grow", "shrink", "repeat2", "repeat3"],
              "rounds": [
                  {"scripts": [{"algorithm": ["Move right", "Jump"], "expect": ["right", "jump"]}, {"algorithm": ["Move left", "Spin"], "expect": ["left", "spin"]}, {"algorithm": ["Say hello", "Grow"], "expect": ["say", "grow"]}]},
                  {"scripts": [{"algorithm": ["Jump 2 times", "Say hello"], "expect": ["repeat2", "jump", "say"]}, {"algorithm": ["Grow", "Move right"], "expect": ["grow", "right"]}, {"algorithm": ["Shrink", "Say hello"], "expect": ["shrink", "say"]}]},
              ]},
             "Two movers and one static object, all at once."),

        step("context", "Why work with others?", "\U0001F91D", "Team programmer", ["3P.07"],
             "Programmers often work in pairs or teams. Tap each reason why.",
             explain(
                 ["When you make a program with someone else, you get things you cannot get alone."],
                 ["Two people have twice the ideas.", "A partner spots the bug you cannot see, because they did not write it.",
                  "You can share the work: you build the cat's script, your partner builds the dog's.", "Saying your plan out loud to someone makes it clearer in your own head."],
                 ["Children think asking for help means they cannot do it.", "Real programmers ask all the time. It is how good programs get made."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "more ideas", "say": "More ideas. Two people think of things one person would not."},
                 {"pic": "\U0001F41B", "label": "a second pair of eyes", "say": "A second pair of eyes. Your partner spots the bug you keep missing, because they did not write it."},
                 {"pic": "\U0001F9E9", "label": "share the work", "say": "Share the work. You build the cat's script while your partner builds the dog's, and the program is done in half the time."},
                 {"pic": "\U0001F5E3️", "label": "say it out loud", "say": "Saying your plan out loud to a partner makes it clearer in your own head. Programmers call this rubber-ducking, and it works even with a rubber duck."},
             ], "need": 4,
              "then": {"ask": "Your partner finds a bug in the script you wrote. That is...",
                       "opts": [opt("A benefit of working together: they saw what you could not", True), opt("Rude", False), opt("Proof you are a bad programmer", False)],
                       "why": "Fresh eyes see fresh things. That is why programmers work together."}},
             "Together: more ideas, more eyes, shared work."),

        step("sort", "Which benefit is that?", "\U0001F5C2️", "Benefit sorter", ["3P.07"],
             "Something good happened when two people programmed together. Which benefit is it?",
             explain(
                 ["More ideas, a second pair of eyes, or shared work."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Which benefit?",
              "bins": [{"id": "ideas", "label": "More ideas", "pic": "\U0001F4A1"}, {"id": "eyes", "label": "A second pair of eyes", "pic": "\U0001F440"}, {"id": "share", "label": "Shared work", "pic": "\U0001F9E9"}],
              "items": [
                  {"pic": "\U0001F436", "label": "Sami suggested giving the dog a program too", "bin": "ideas", "why": "An idea one person did not have."},
                  {"pic": "\U0001F41B", "label": "Amal noticed the repeat block was repeating the wrong thing", "bin": "eyes", "why": "A bug spotted by fresh eyes."},
                  {"pic": "\U0001F431\U0001F436", "label": "Zara built the cat's script while Omar built the dog's", "bin": "share", "why": "The work was shared."},
                  {"pic": "\U0001F333", "label": "Leo said, what if the tree could talk?", "bin": "ideas", "why": "A new idea."},
                  {"pic": "\U0001F440", "label": "Nora saw that the go home block was missing", "bin": "eyes", "why": "A second pair of eyes."},
                  {"pic": "\U0001F9E9", "label": "one person did the drawing, the other did the blocks", "bin": "share", "why": "Shared work."},
              ]},
             "Three benefits of working together."),

        step("context", "Mistakes make better programmers", "\U0001F4A1", "Mistake learner", ["3P.08"],
             "Programmers make mistakes all the time, and they USE them. Tap each one.",
             explain(
                 ["A mistake is information. It tells you something you did not know about your program."],
                 ["The cat ended in the wrong place: now you know to reset first.", "The repeat repeated the wrong block: now you check what comes after every repeat.",
                  "Programmers keep a note of the mistakes they make, and their next program is better because of it."],
                 ["Children hide a mistake or start again from nothing.", "Look at it. Ask what it tells you. Then fix it."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F3E0", "label": "the cat started in the wrong place", "say": "The cat started in the wrong place. Now I know: reset first. Every program I write from now on starts with go home."},
                 {"pic": "\U0001F501", "label": "the repeat repeated the wrong block", "say": "The repeat repeated a spin instead of a jump. Now I know: the block AFTER the repeat is the one that repeats. I check it every time."},
                 {"pic": "\U0001F436", "label": "the dog did nothing", "say": "The dog did nothing, because I built both programs on the cat. Now I know: check whose tab I am on."},
                 {"pic": "\U0001F4DD", "label": "the mistake notebook", "say": "Programmers write their mistakes down. Not to feel bad, but so the next program does not have them."},
             ], "need": 4,
              "then": {"ask": "Your program went wrong. The best thing to do is...",
                       "opts": [opt("Look at what it did, work out why, and use that next time", True), opt("Delete everything and pretend it never happened", False), opt("Give up programming", False)],
                       "why": "A mistake understood is a lesson learned. That is how programmers get better."}},
             "Mistakes are information."),

        step("questions", "Check: many things at once", "\U0001F4DD", "Parallel checker", ["3P.03", "3P.04", "3P.07", "3P.08"],
             "Three quick questions.",
             explain(["Nothing new here."], ["At the same time, static objects, partners, mistakes."], [], ["Read, think, tap."]),
             {"items": [
                 q("When the cat's script and the dog's script run at the same time...", "\U0001F431\U0001F436", "both start together, block by block, side by side", ["the dog waits for the cat to finish", "only one can run", "the cat runs twice"], "That is what running at the same time means."),
                 q("A static object...", "\U0001F333", "stays where it is but can still say or grow", ["cannot have a program", "moves the fastest", "is invisible"], "Static means it does not move."),
                 q("A mistake in your program is...", "\U0001F4A1", "information you use to make the next program better", ["the end", "something to hide", "always someone else's fault"], "Programmers learn from mistakes."),
             ]},
             "At the same time, static, together, learning."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3P.03", "3P.04", "3P.07", "3P.08"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about parallel programs, static objects, partners and mistakes."], [], ["Read, look, tap."]),
             {"items": [
                 q("One press of Run starts the cat's program and the dog's program. They run...", "▶️", "at the same time", ["one after the other", "on different days", "only if the tree moves"], "More than one algorithm at once."),
                 q("Which object is static?", "\U0001F333", "the tree, which stays where it is", ["the cat, which moves right", "the dog, which jumps", "the flower that Robo drives to"], "Static means not moving."),
                 q("Can a static object have a program?", "\U0001F4AC", "yes: it can say hello or grow, but not move", ["no, never", "only if it moves", "only on Fridays"], "Static objects have look blocks, not move blocks."),
                 q("Your partner spots a bug you missed. Which benefit of working together is that?", "\U0001F440", "a second pair of eyes", ["more homework", "shared snacks", "a longer program"], "Fresh eyes see what yours cannot."),
                 q("You build the cat's script while your partner builds the dog's. That is...", "\U0001F9E9", "sharing the work", ["cheating", "a bug", "a static object"], "Shared work is a benefit of a team."),
                 q("The cat ended in the wrong place because it was not reset. A programmer who learns from this will...", "\U0001F3E0", "start the next program with a go home block", ["never use the cat again", "hide the program", "blame the dog"], "The mistake informs the next program."),
                 q("Why do programmers write their mistakes down?", "\U0001F4DD", "so the next program does not have them", ["to feel bad", "because they must", "to make the program longer"], "A mistake noted is a mistake not repeated."),
             ]},
             "That is the whole lesson finished. Programs at the same time, static objects, partners and mistakes that teach."),
    ],
}


LESSON["about"] = [
    "Build a program where more than one algorithm runs at the same time.",
    "Give a program more than one object, including one that stays still.",
    "Say why programmers work with others.",
    "Use a mistake to make the next program better.",
]

LESSON["lecture"] = [
    part("\U0001F431\U0001F436", "At the same time",
         "A program can have a script for each object, and one press of Run starts them all together. The cat's first block and the dog's first block happen in the same beat. That is more than one algorithm running at the same time."),
    part("\U0001F333", "Static objects",
         "Not every object moves. A tree, a sun, a house is static: it stays where it is. It can still have a program - say hello, grow, hide - but there are no move blocks in its palette, because static means still."),
    part("\U0001F91D", "Working with others",
         "Programmers work in pairs and teams because it helps: more ideas, a second pair of eyes to spot a bug, and the work shared out - one builds the cat, one builds the dog. Even saying your plan out loud to someone makes it clearer."),
    part("\U0001F4A1", "Mistakes",
         "Every programmer makes mistakes, and good ones use them. The cat started in the wrong place: now reset first. The repeat repeated the wrong block: now check what follows every repeat. A mistake understood is a lesson the next program gets for free."),
]

LESSON["words"] = [
    word("script", "\U0001F4DC", "The program that belongs to one object.",
         ["The cat's script has two blocks.", "Build a script for each object."]),
    word("static", "\U0001F333", "Staying still; not moving.",
         ["The tree is a static object.", "A static object can still say hello."]),
    word("object", "\U0001F431", "A thing on the stage that a program controls.",
         ["Three objects: cat, dog, tree.", "Each object has its own script."]),
    word("partner", "\U0001F91D", "Someone you work with.",
         ["My partner built the dog's script.", "Ask your partner to look for the bug."]),
    word("mistake", "\U0001F4A1", "Something that went wrong, which tells you what to change.",
         ["A mistake is information.", "Write the mistake down."]),
]

LESSON["home"] = [
    home("Two programs at once", "Two people, cards, a clap",
         ["Write a card program for each person: 'step, jump, turn' and 'jump, jump, clap'.",
          "A third person claps a beat. On each clap, BOTH do their next card.",
          "What happens when one program finishes first?"],
         "Both run at the same time, block by block."),
    home("Pair programming", "A partner, a program to build",
         ["One person builds, the other watches and says what they see.",
          "Swap after every three blocks.",
          "Did the watcher spot something the builder missed?"],
         "A second pair of eyes finds bugs."),
    home("The mistake notebook", "A notebook",
         ["Every time a program goes wrong, write one line: what happened, and what you will do next time.",
          "Read it before you start a new program.",
          "Which mistake have you stopped making?"],
         "Mistakes inform the next program."),
]
