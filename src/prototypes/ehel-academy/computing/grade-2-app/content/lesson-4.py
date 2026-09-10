# -*- coding: utf-8 -*-
"""Lesson 4 - Objects and Plans.

0059 Stage 2 Programming: 2P.04 plan the instructions for objects within
programs; with 2P.02 (recreate the algorithm for each object), 2P.06 (test as
you build) and 2P.01.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "objects-and-plans",
    "title": "Objects and Plans",
    "blurb": "A program can have more than one character in it, and each one needs its own plan. Plan the cat's blocks and the dog's, build them, and test each one.",
    "steps": [
        step("demo", "Two characters, two plans", "\U0001F431\U0001F436", "Two characters", ["2P.04"],
             "A program can have more than one object in it. Press <b>Next</b>.",
             explain(
                 ["An object is a thing in a program that can be given its own instructions: a cat, a dog, a ball.",
                  "Each object needs its own plan, and the plans can be different."],
                 ["The cat walks to the tree and says hello.", "The dog jumps twice and spins.", "Two objects, two algorithms, two programs."],
                 ["Children give one program to everything.", "Every object gets its own blocks. The tree gets none: it does not move."],
                 ["Press Next and meet both plans."]),
             {"frames": [
                 {"pic": "\U0001F431\U0001F436", "cap": "A cat and a dog. Two <b>objects</b>, on one stage.", "say": "A cat and a dog. Two objects on one stage. Each can be given its own instructions."},
                 {"pic": "\U0001F431\U0001F4DD", "cap": "The cat's plan: move right, move right, say hello.", "say": "The cat's plan: move right, move right, say hello.", "sound": "click"},
                 {"pic": "\U0001F436\U0001F4DD", "cap": "The dog's plan: jump, jump, spin.", "say": "The dog's plan: jump, jump, spin. A different plan, because it is a different object.", "sound": "click"},
                 {"pic": "\U0001F333", "cap": "The tree gets <b>no</b> plan. It does not move.", "say": "The tree gets no plan at all. It does not move, so it needs no instructions."},
                 {"pic": "\U0001F9E9\U0001F9E9", "cap": "One program for each object. Plan each one before you build it.", "say": "One program for each object. Plan each one before you build it, then build it, then test it.", "sound": "tada"},
             ]},
             "Every object that moves gets its own plan."),

        step("questions", "Who needs which blocks?", "\U0001F914", "Object planner", ["2P.04"],
             "Plan the instructions for each object. Which blocks does it need? Tap the answer.",
             explain(
                 ["Planning means deciding what each object should do BEFORE you touch a block."],
                 ["The cat must walk to the tree, two spaces right: move right, move right.", "The dog must say hello twice: repeat 2 times, say hello.",
                  "The tree must do nothing: no blocks."],
                 [],
                 ["Read what the object must do, then pick its blocks."]),
             {"label": "Question", "items": [
                 q("The cat must walk two spaces to the right. Which blocks?", "\U0001F431", "move right, move right", ["jump, jump", "say hello", "move left, move left"], "Two spaces right: two move right blocks, or repeat 2 times, move right."),
                 q("The dog must say hello twice. Which blocks use the repeat block?", "\U0001F436", "repeat 2 times, say hello", ["say hello, repeat 2 times", "jump, jump", "repeat 2 times, spin"], "Repeat goes first, then the block it repeats."),
                 q("The cat should hide when the dog arrives. Which block?", "\U0001F648", "hide", ["grow", "spin", "say hello"], "Hide is the block that makes the cat disappear."),
                 q("Which object needs NO blocks?", "\U0001F333", "the tree, because it does not move", ["the cat", "the dog", "all of them need blocks"], "An object that does nothing needs no plan."),
                 q("The dog must grow, then spin 3 times. Which blocks?", "\U0001F436", "grow, repeat 3 times, spin", ["repeat 3 times, grow, spin", "spin, grow", "grow, spin"], "Grow first, then the repeat and its spin."),
             ]},
             "A plan for each object, before a single block is placed."),

        step("program", "Program the cat, then the dog", "\U0001F431\U0001F436", "Two-object programmer", ["2P.04", "2P.02"],
             "Two characters on the stage. Build the program for the one the algorithm names, then run it.",
             explain(
                 ["Each round names an object. Build THAT object's program.", "The other object stays still: it has no blocks in this round."],
                 ["The cat: move right, say hello.", "The dog: jump, jump, spin.", "Watch which one moves when you press Run."],
                 ["Children build the dog's blocks when the round asks for the cat.", "Read whose program it is first."],
                 ["Build the named object's program, run it, check."]),
             {"sprites": ["\U0001F431", "\U0001F436"], "spriteNames": ["cat", "dog"], "blocks": ["right", "left", "jump", "say", "spin", "grow", "hide", "repeat2", "repeat3"],
              "rounds": [
                  {"object": 0, "algorithm": ["Move right", "Say hello"], "expect": ["right", "say"]},
                  {"object": 1, "algorithm": ["Jump", "Jump", "Spin"], "expect": ["jump", "jump", "spin"]},
                  {"object": 1, "algorithm": ["Move left 3 times"], "expect": ["repeat3", "left"], "mustRepeat": True},
                  {"object": 0, "algorithm": ["Grow", "Say hello", "Hide"], "expect": ["grow", "say", "hide"]},
              ]},
             "Two objects, and each one got its own program."),

        step("order", "Plan, build, test", "\U0001F4CB", "Program planner", ["2P.04", "2P.06"],
             "What is the order for making a program with two objects? Tap the needed steps in order.",
             explain(
                 ["Plan first, then build, then test, then fix.", "Some of these steps are not part of making a program at all."],
                 ["Decide what each object should do.", "Write each object's algorithm.", "Build the blocks.", "Run it and test it.", "Fix any bug and run it again."],
                 ["Children build first and plan never.", "Building without a plan is how programs get ten bugs at once."],
                 ["Needed steps only, in order."]),
             {"items": [
                 {"id": "decide", "pic": "\U0001F914", "label": "decide what each object should do", "say": "First, decide what each object should do."},
                 {"id": "algo", "pic": "\U0001F4DD", "label": "write each object's algorithm", "say": "Write each object's algorithm in words."},
                 {"id": "build", "pic": "\U0001F9E9", "label": "build the blocks for each object", "say": "Build the blocks for each object."},
                 {"id": "test", "pic": "▶️", "label": "run it and test it", "say": "Run it and test it."},
                 {"id": "fix", "pic": "\U0001F527", "label": "fix any bug and run it again", "say": "Fix any bug and run it again."},
             ], "extras": [
                 {"pic": "\U0001F5A5️", "label": "switch the computer off first", "why": "You need the computer on to build a program."},
                 {"pic": "\U0001F3A8", "label": "colour the screen in", "why": "Colouring the screen is not part of making a program."},
             ]},
             "Plan, build, test, fix. In that order."),

        step("context", "Programs with many objects", "\U0001F3AE", "Object spotter", ["2P.04", "2P.01"],
             "Real programs have lots of objects, each with its own instructions. Tap each one.",
             explain(
                 ["A game has a player and enemies. An animation has several characters. Each object has its own program inside the big program."],
                 ["In a game, the player's blocks say: move when a key is pressed. The enemy's blocks say: walk left and right, over and over.",
                  "A traffic light has three lights, each with its own plan."],
                 [],
                 ["Tap each one and count the objects."]),
             {"items": [
                 {"pic": "\U0001F3AE", "label": "a game", "say": "A game. The player is one object, with blocks that move it when you press a key. Each enemy is another object, with blocks that make it walk back and forth."},
                 {"pic": "\U0001F3AC", "label": "an animation", "say": "An animation with three characters. Each character has its own program, and they all run at once."},
                 {"pic": "\U0001F6A6", "label": "a traffic light", "say": "A traffic light has three lights: red, amber, green. Each light is an object with its own plan for when to be on."},
                 {"pic": "\U0001F3B5", "label": "a music program", "say": "A music program with a drum and a piano. Each instrument is an object with its own notes to play."},
             ], "need": 4,
              "then": {"ask": "In a game, the player and an enemy...",
                       "opts": [opt("Are different objects with different programs", True), opt("Share one program", False), opt("Need no program", False)],
                       "why": "Each object in a program has its own instructions."}},
             "Games, animations and traffic lights are programs with many objects."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2P.04", "2P.02", "2P.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about objects, plans, and plan-build-test."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is an object in a program?", "\U0001F431", "a thing that can be given its own instructions", ["a bug", "a kind of block", "the screen"], "A cat, a dog, a ball: each can have its own blocks."),
                 q("The cat and the dog are on the same stage. How many programs?", "\U0001F431\U0001F436", "one for each object", ["one for both", "none", "ten"], "Each object gets its own program."),
                 q("What should you do BEFORE building an object's blocks?", "\U0001F914", "plan what that object should do", ["run the program", "delete the object", "nothing"], "Plan first, then build."),
                 q("The tree in the program does not move. How many blocks does it need?", "\U0001F333", "none", ["one", "three", "the same as the cat"], "An object that does nothing needs no plan."),
                 q("The dog's plan is: jump, jump, spin. Which blocks?", "\U0001F436", "jump, jump, spin", ["spin, jump, jump", "jump, spin", "repeat 3 times, jump"], "Same steps, same order."),
                 q("After building the cat's program, what next?", "▶️", "run it and test it", ["build the dog's program without testing", "switch off", "colour the screen"], "Test each object's program as you build it."),
                 q("The dog must move left 3 times. Which is shortest?", "⬅️", "repeat 3 times, move left", ["move left, move left, move left", "move left", "repeat 2 times, move left"], "Two blocks for three moves."),
                 q("Plan, build, test, fix. What is this the order for?", "\U0001F4CB", "making a program", ["making toast", "getting dressed", "reading a story"], "Programmers plan, build, test and fix, in that order."),
             ]},
             "That is the whole lesson finished. You can plan the instructions for every object in a program."),
    ],
}


LESSON["about"] = [
    "Say that a program can have more than one object, each with its own instructions.",
    "Plan what each object should do before building its blocks.",
    "Build and run a program for the object the algorithm names.",
    "Put plan, build, test and fix in the right order.",
]

LESSON["lecture"] = [
    part("\U0001F431\U0001F436", "Objects",
         "A program can have more than one thing in it: a cat, a dog, a ball. Each one is called an object, and each object can be given its own instructions. The cat's blocks move the cat. The dog's blocks move the dog."),
    part("\U0001F4DD", "A plan for each object",
         "Before you build, plan. What should the cat do? Walk to the tree and say hello. What should the dog do? Jump twice and spin. What should the tree do? Nothing, so it gets no blocks at all."),
    part("\U0001F9E9", "Build one, test one",
         "Build the cat's program and run it. Did the cat do its plan? Then build the dog's program and run that. Testing each object's program as you build it keeps every bug small."),
    part("\U0001F501", "Repeats for objects too",
         "An object's plan can use the repeat block like any other program. The dog must move left three times: repeat 3 times, move left. Two blocks."),
    part("\U0001F3AE", "Real programs",
         "A game has a player and enemies. An animation has several characters. A traffic light has three lights. Each is an object with its own program, and they all run together inside the big program."),
]

LESSON["words"] = [
    word("object", "\U0001F431", "A thing in a program that can be given its own instructions.",
         ["The cat is an object.", "Each object has its own blocks."]),
    word("plan", "\U0001F4CB", "To decide what should happen before you build it.",
         ["Plan the dog's moves first.", "A good plan means fewer bugs."]),
    word("character", "\U0001F436", "An object in a program that is a person or an animal.",
         ["The game has two characters.", "Each character has a plan."]),
    word("program", "\U0001F9E9", "Blocks that tell a computer how to run an algorithm.",
         ["One program for each object.", "Run the cat's program."]),
    word("test", "▶️", "To run a program and check it did what you planned.",
         ["Test the cat's program before the dog's.", "The test passed."]),
    word("stage", "\U0001F3AD", "The place on the screen where the objects are.",
         ["The cat and the dog are on the stage.", "Watch the stage when you run it."]),
]

LESSON["home"] = [
    home("Two toys, two plans", "Two toys, paper cards, a grown-up",
         ["Write a plan for each toy: the bear jumps twice; the car moves forward three times.",
          "Your grown-up runs the bear's cards, then the car's.",
          "Did each toy do its own plan and nothing else?"],
         "Each object gets its own program. The bear's cards never move the car."),
    home("The object that does nothing", "Three toys",
         ["Choose which toy moves and which toy stays still.",
          "Write blocks for the ones that move. Write nothing for the one that stays.",
          "Run it."],
         "An object that does nothing needs no plan."),
    home("Plan, build, test", "Paper cards",
         ["Plan a four-card program for a toy, out loud, before you write anything.",
          "Build the cards. Run it after two cards, then after four.",
          "Fix anything that went wrong and run it again."],
         "Plan, build, test, fix. Every time."),
]
