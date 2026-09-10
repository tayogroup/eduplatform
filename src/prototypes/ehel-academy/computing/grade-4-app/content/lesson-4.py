# -*- coding: utf-8 -*-
"""Lesson 4 - Inputs Decide Outputs.

0059 Stage 4 Computational Thinking: 4CT.09 develop algorithms that produce
different outputs based on different inputs; 4CT.10 develop algorithms that
include repetition; 4CT.05 predict the outcome of algorithms containing
repetition.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "inputs-decide-outputs",
    "title": "Inputs Decide Outputs",
    "blurb": "Follow an algorithm with an IF in it and see one input take one branch and another input take the other, then build algorithms of your own with a repeat loop in them.",
    "steps": [
        step("context", "If this, then that", "\U0001F500", "If thinker", ["4CT.09"],
             "An algorithm can have a fork in it: IF something is true, do these steps; otherwise do those. The input decides. Tap each one.",
             explain(
                 ["A branch is a choice inside an algorithm. The same algorithm gives a different output for a different input."],
                 ["IF it is raining, take an umbrella; otherwise take sunglasses. The weather is the input; what you carry is the output.",
                  "IF the kettle has boiled, pour; otherwise wait. IF the answer is right, say well done; otherwise say try again."],
                 ["Children think the algorithm changed.", "The algorithm is the same. The input changed, so it took the other branch."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F327️", "label": "IF it is raining", "say": "IF it is raining, take an umbrella; otherwise take sunglasses. Same algorithm, two outputs, and the weather decides."},
                 {"pic": "\U0001F9CB", "label": "IF the kettle has boiled", "say": "IF the kettle has boiled, pour the water; otherwise wait a minute and check again."},
                 {"pic": "✅", "label": "IF the answer is right", "say": "IF the answer is right, say well done; otherwise say try again. A quiz program has this branch in it."},
                 {"pic": "\U0001F6AA", "label": "IF the door is locked", "say": "IF the door is locked, use the key; otherwise just push it open."},
                 {"pic": "\U0001F3AE", "label": "IF the player presses jump", "say": "IF the player presses jump, the character jumps; otherwise it keeps running. The button press is the input."},
             ], "need": 5,
              "then": {"ask": "In 'IF it is raining, take an umbrella; otherwise take sunglasses', what is the INPUT?",
                       "opts": [opt("Whether it is raining", True), opt("The umbrella", False), opt("The sunglasses", False)],
                       "why": "The input is the thing the IF looks at. The output is what you take."}},
             "The input decides the branch."),

        step("branch", "Take the branch", "\U0001F500", "Branch follower", ["4CT.09"],
             "Choose an input, then follow the algorithm through the branch that input takes. Then try the other input.",
             explain(
                 ["Following a branch: do the steps before the IF, then ONLY the branch that matches the input, then the steps after."],
                 ["Raining: get dressed, take the umbrella, walk to school.", "Dry: get dressed, take sunglasses, walk to school. Same start, same end, different middle."],
                 ["Children do both branches.", "Only one branch runs. The other is skipped completely."],
                 ["Pick an input, follow the branch, then pick the other."]),
             {"rounds": [
                 {"task": "leave for school", "question": "is it raining?",
                  "inputs": [{"id": "yes", "label": "Yes, it is raining", "pic": "\U0001F327️"}, {"id": "no", "label": "No, it is sunny", "pic": "☀️"}],
                  "before": [s("dress", "Get dressed", "\U0001F455"), s("bag", "Pick up your bag", "\U0001F392")],
                  "yes": [s("coat", "Put on your raincoat", "\U0001F9E5"), s("umbrella", "Take the umbrella", "☂️")],
                  "no": [s("glasses", "Put on sunglasses", "\U0001F576️"), s("hat", "Take a sun hat", "\U0001F452")],
                  "after": [s("walk", "Walk to school", "\U0001F6B6")]},
                 {"task": "answer a quiz question", "question": "is the answer right?",
                  "inputs": [{"id": "right", "label": "Yes, it is right", "pic": "✅"}, {"id": "wrong", "label": "No, it is wrong", "pic": "❌"}],
                  "before": [s("read", "Read the answer", "\U0001F440")],
                  "yes": [s("tick", "Show a tick", "✅"), s("point", "Add a point", "⭐"), s("welldone", "Say well done", "\U0001F389")],
                  "no": [s("cross", "Show a cross", "❌"), s("hint", "Show a hint", "\U0001F4A1")],
                  "after": [s("next", "Go to the next question", "➡️")]},
             ]},
             "One algorithm, two inputs, two outputs."),

        step("loopbuild", "Build an algorithm with a repeat", "\U0001F501", "Loop builder", ["4CT.10", "4CT.05"],
             "The task needs the same steps done several times. Put those steps in the repeat box, set how many times, and run it.",
             explain(
                 ["Developing an algorithm with repetition means spotting what repeats, putting it in a loop, and setting the count."],
                 ["Water 3 plants: repeat 3 times, fill the can, pour on a plant, walk to the next. Then put the can away.",
                  "The page unrolls your loop and checks it does the whole task, not more and not less."],
                 ["Children put 'get the can' inside the loop.", "You get the can once. Only what happens for every plant goes in the loop."],
                 ["Tap steps into the box, set the count, run."]),
             {"rounds": [
                 {"task": "water 3 plants, then put the can away",
                  "pool": [s("fill", "Fill the can", "\U0001F4A7"), s("pour", "Pour on a plant", "\U0001FAB4"), s("walk", "Walk to the next plant", "\U0001F6B6"), s("can", "Get the can out of the shed", "\U0001FAA3")],
                  "after": [s("away", "Put the can away", "\U0001F6AA")],
                  "expect": {"times": 3, "body": ["fill", "pour", "walk"]}, "hint": "Fill, pour, walk happen for every plant. Getting the can does not."},
                 {"task": "lay 4 places at the table",
                  "pool": [s("plate", "Put down a plate", "\U0001F37D️"), s("fork", "Fork on the left", "\U0001F374"), s("knife", "Knife on the right", "\U0001F52A"), s("wipe", "Wipe the table", "\U0001F9FD")],
                  "after": [s("jug", "Jug in the middle", "\U0001F964")],
                  "expect": {"times": 4, "body": ["plate", "fork", "knife"]}, "hint": "Plate, fork, knife for every place. Wiping the table is once, before."},
                 {"task": "make 5 pancakes",
                  "pool": [s("pour", "Pour batter in the pan", "\U0001F373"), s("cook", "Cook and flip", "\U0001F95E"), s("plate", "Put it on the plate", "\U0001F37D️"), s("mix", "Mix the batter", "\U0001F963")],
                  "after": [s("serve", "Serve them", "\U0001F60B")],
                  "expect": {"times": 5, "body": ["pour", "cook", "plate"]}, "hint": "Pour, cook, plate for every pancake. Mixing is once."},
             ]},
             "Three algorithms with a repeat, built and checked."),

        step("sort", "In the loop, or outside it?", "\U0001F5C2️", "Loop placer", ["4CT.10"],
             "For 'water all the plants in the garden', does this step go INSIDE the repeat loop or OUTSIDE it?",
             explain(
                 ["Inside the loop: anything that happens for every plant.", "Outside: anything that happens once, before or after."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Inside the loop, or outside?",
              "bins": [{"id": "in", "label": "Inside the loop", "pic": "\U0001F501"}, {"id": "out", "label": "Outside (once)", "pic": "1️⃣"}],
              "items": [
                  {"pic": "\U0001FAA3", "label": "get the can from the shed", "bin": "out", "why": "Once, before."},
                  {"pic": "\U0001F4A7", "label": "fill the can", "bin": "in", "why": "For every plant."},
                  {"pic": "\U0001FAB4", "label": "pour on the plant", "bin": "in", "why": "For every plant."},
                  {"pic": "\U0001F6B6", "label": "walk to the next plant", "bin": "in", "why": "For every plant."},
                  {"pic": "\U0001F6AA", "label": "put the can away", "bin": "out", "why": "Once, after."},
                  {"pic": "\U0001F9E4", "label": "put on your gardening gloves", "bin": "out", "why": "Once, before."},
              ]},
             "Every-time steps go inside; once steps stay outside."),

        step("questions", "Check: inputs and loops", "\U0001F4DD", "Branch checker", ["4CT.09", "4CT.10"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Branches and loops you build."], [], ["Read, think, tap."]),
             {"items": [
                 q("'IF it is raining take an umbrella, otherwise sunglasses.' It is sunny. The output is...", "☀️", "sunglasses", ["an umbrella", "both", "neither"], "The sunny input takes the otherwise branch."),
                 q("Which step goes INSIDE 'repeat 3 times' for watering 3 plants?", "\U0001F501", "pour on a plant", ["get the can", "put the can away", "open the shed"], "It happens for every plant."),
                 q("An algorithm with an IF gives...", "\U0001F500", "different outputs for different inputs", ["the same output always", "no output", "a random output"], "The input picks the branch."),
             ]},
             "If, loop, output."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CT.05", "4CT.09", "4CT.10"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Branches, inputs, outputs, and loops you build."], [], ["Read, look, tap."]),
             {"items": [
                 q("The part of an algorithm where the input decides which steps run is...", "\U0001F500", "a branch, an IF", ["a loop", "a sub-routine", "an output"], "IF this, then that; otherwise the other."),
                 q("In the quiz algorithm, a wrong answer as input gives which output?", "❌", "a cross and a hint", ["a tick and a point", "well done", "nothing"], "The wrong input takes the otherwise branch."),
                 q("With input 'raining', which steps are SKIPPED?", "\U0001F327️", "the sunny branch: sunglasses and sun hat", ["get dressed", "walk to school", "the umbrella"], "Only one branch runs."),
                 q("To water 4 plants with the same loop as 3, you...", "\U0001F522", "change the count to 4", ["add a plant step", "remove the loop", "do it twice"], "The count is the only change."),
                 q("Repeat 5 times: pour, cook, plate. Then serve. How many steps unrolled?", "\U0001F95E", "16", ["4", "5", "15"], "Fifteen in the loop, plus serve."),
                 q("Which belongs OUTSIDE the pancake loop?", "\U0001F963", "mix the batter", ["pour batter in the pan", "cook and flip", "put it on the plate"], "Mixing happens once."),
                 q("Same algorithm, two inputs. The outputs are...", "\U0001F4E4", "different, because the branch is different", ["always the same", "both branches", "an error"], "Inputs decide outputs."),
             ]},
             "That is the whole lesson finished. You follow a branch and build a loop."),
    ],
}


LESSON["about"] = [
    "Follow an algorithm with an IF branch and say how the input picks the output.",
    "Show that one algorithm gives different outputs for different inputs.",
    "Build an algorithm with a repeat loop for a task that repeats.",
    "Decide which steps go inside a loop and which stay outside.",
]

LESSON["lecture"] = [
    part("\U0001F500", "The IF branch",
         "An algorithm can fork: IF it is raining, put on a raincoat and take an umbrella; otherwise sunglasses and a hat. The steps before and after are the same for everyone; the middle depends on the input. Only one branch runs."),
    part("\U0001F4E4", "Inputs decide outputs",
         "The same algorithm gives a different output for a different input. Raining in, umbrella out. Sunny in, sunglasses out. A quiz program does the same: right answer in, a tick and a point; wrong answer in, a cross and a hint."),
    part("\U0001F501", "Building a loop",
         "When a task does the same steps for every plant, or every place, or every pancake, those steps go inside a repeat loop with a count. Fill, pour, walk, repeat 3 times. What happens only once - getting the can, putting it away - stays outside."),
    part("\U0001F52E", "Checking it",
         "Unroll your loop to check it: repeat 3 times of three steps is nine, plus one after is ten. If the unrolled algorithm does the whole task and nothing extra, the loop is right."),
]

LESSON["words"] = [
    word("branch", "\U0001F500", "A fork in an algorithm where the input decides which steps run.",
         ["The raincoat is on the raining branch.", "An IF makes a branch."]),
    word("condition", "❓", "The question an IF asks about the input.",
         ["'Is it raining?' is the condition.", "A true condition takes the first branch."]),
    word("otherwise", "↪️", "The branch taken when the condition is not true.",
         ["Otherwise, take sunglasses.", "The otherwise branch ran."]),
    word("repeat", "\U0001F501", "To do the steps in a loop again.",
         ["Repeat 3 times.", "Put the repeating steps in the loop."]),
    word("count", "\U0001F522", "How many times a repeat loop goes round.",
         ["Set the count to 4.", "Change only the count."]),
]

LESSON["home"] = [
    home("Roll for the weather", "A dice, cards",
         ["Write a leaving-the-house algorithm with an IF: odd is raining, even is sunny.",
          "Roll the dice, then follow only the branch it gives you.",
          "Roll again. Did the output change?"],
         "Same algorithm, different input, different output."),
    home("Build the loop", "Cards, a real job",
         ["Pick a job that repeats: laying the table, watering plants, hanging washing.",
          "Write the repeating steps once in a 'repeat N times' box; write the once-only steps outside it.",
          "Unroll it out loud. Does it do exactly the job?"],
         "Every-time steps inside, once steps outside."),
]
