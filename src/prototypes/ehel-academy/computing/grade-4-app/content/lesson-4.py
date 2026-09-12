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
    "blurb": "Follow an algorithm that asks a question about its input and gives each answer its own steps, write one of your own, and build algorithms with a repeat loop in them.",
    "steps": [
        step("context", "One question, two answers", "\U0001F500", "Question thinker", ["4CT.09"],
             "An algorithm can ask a question about its input, and each answer has its own steps. The answer decides. Tap each one.",
             explain(
                 ["A branch is a fork inside an algorithm: one question about the input, and a rule for each answer."],
                 ["Is it raining? Yes: take an umbrella. No: take sunglasses. The weather is the input; what you carry is the output.",
                  "Has the kettle boiled? Yes: pour. No: wait and check again. Is the answer right? Yes: say well done. No: say try again."],
                 ["Children think the algorithm changed.", "The algorithm is the same. The input changed, so the question got a different answer."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F327️", "label": "Is it raining?", "say": "Is it raining? Yes: take an umbrella. No: take sunglasses. Same algorithm, two outputs, and the weather decides."},
                 {"pic": "\u2615", "label": "Has the kettle boiled?", "say": "Has the kettle boiled? Yes: pour the water. No: wait a minute and check again."},
                 {"pic": "✅", "label": "Is the answer right?", "say": "Is the answer right? Yes: say well done. No: say try again. A quiz program has this branch in it."},
                 {"pic": "\U0001F6AA", "label": "Is the door locked?", "say": "Is the door locked? Yes: use the key. No: just push it open."},
                 {"pic": "\U0001F3AE", "label": "Did the player press jump?", "say": "Did the player press jump? Yes: the character jumps. No: it keeps running. The button press is the input."},
             ], "need": 5,
              "then": {"ask": "In 'Is it raining? Yes: take an umbrella. No: take sunglasses', what is the INPUT?",
                       "opts": [opt("Whether it is raining", True), opt("The umbrella", False), opt("The sunglasses", False)],
                       "why": "The input is the thing the question asks about. The output is what you take."}},
             "The input decides the branch."),

        step("branch", "Take the branch", "\U0001F500", "Branch follower", ["4CT.09"],
             "Choose an input, then follow the algorithm through the steps that input's answer takes. Then try the other input.",
             explain(
                 ["Following a branch: do the steps before the question, then ONLY the steps for the answer the input gives, then the steps after."],
                 ["Raining: get dressed, take the umbrella, walk to school.", "Dry: get dressed, take sunglasses, walk to school. Same start, same end, different middle."],
                 ["Children do both branches.", "Only one branch runs. The other is skipped completely."],
                 ["Pick an input, follow the branch, then pick the other."]),
             {"word": "Ask:", "rounds": [
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

        step("branchbuild", "Write the branch", "\U0001F500", "Branch writer", ["4CT.09"],
             "Now you write one. Choose the question the algorithm must ask, put every step where it belongs, then test it with both inputs.",
             explain(
                 ["Writing an algorithm with a branch: decide what happens every time, and what happens only for one answer to the question."],
                 ["Borrowing a book: look on the shelf first, every time. On the shelf: take it to the desk and scan your card. Not there: ask for it to be saved. Then say thank you, every time.",
                  "Test it with both answers. One algorithm, two inputs, two different outputs."],
                 ["Children put a step that happens for both answers inside one branch.", "If it happens whatever the answer, it goes outside the branches: first, or after."],
                 ["Choose the question, then tap a step and tap Put it here. Then Test it."]),
             {"word": "Ask:", "rounds": [
                 {"task": "borrow a library book", "question": "is the book on the shelf?",
                  "questions": ["is the book on the shelf?", "is it raining?", "is the book red?"],
                  "inputs": [{"id": "yes", "label": "Yes, it is on the shelf", "pic": "\U0001F4DA"}, {"id": "no", "label": "No, someone has it", "pic": "\U0001F6AB"}],
                  "before": [s("look", "Look on the shelf for the book", "\U0001F50D")],
                  "yes": [s("desk", "Take it to the desk", "\U0001F4D6"), s("card", "Scan your library card", "\U0001F4C7")],
                  "no": [s("save", "Ask for it to be saved for you", "\U0001F4DD")],
                  "after": [s("thanks", "Say thank you to the librarian", "\U0001F642")]},
                 {"task": "go to lunch", "question": "have you brought a packed lunch?",
                  "questions": ["have you brought a packed lunch?", "is it Friday?", "are your shoes tied?"],
                  "inputs": [{"id": "yes", "label": "Yes, a packed lunch", "pic": "\U0001F96A"}, {"id": "no", "label": "No, a school dinner", "pic": "\U0001F35B"}],
                  "before": [s("line", "Line up at the hall door", "\U0001F6B6")],
                  "yes": [s("box", "Get your lunch box", "\U0001F371")],
                  "no": [s("queue", "Queue at the serving hatch", "\U0001F465"), s("tray", "Take a tray and cutlery", "\U0001F374")],
                  "after": [s("eat", "Sit down and eat", "\U0001F60B")]},
                 {"task": "the player reaches a locked door in a game", "question": "has the player got the key?",
                  "questions": ["has the player got the key?", "is the door green?", "is the music on?"],
                  "inputs": [{"id": "yes", "label": "Yes, the key is found", "pic": "\U0001F511"}, {"id": "no", "label": "No key yet", "pic": "\u274C"}],
                  "before": [s("walk", "Walk up to the door", "\U0001F6B6")],
                  "yes": [s("open", "Open the door", "\U0001F6AA"), s("level", "Go through to the next level", "\u2B50")],
                  "no": [s("find", "Show the message 'Find the key!'", "\U0001F4AC")],
                  "after": [s("save", "Save the game", "\U0001F4BE")]},
             ]},
             "Three algorithms written, each giving a different output for each input."),

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
                  "pool": [s("fill", "Fill the can", "\U0001F4A7"), s("pour", "Pour on a plant", "\U0001F331"), s("walk", "Walk to the next plant", "\U0001F6B6"), s("can", "Get the can out of the shed", "\U0001F6BF")],
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
                  {"pic": "\U0001F6BF", "label": "get the can from the shed", "bin": "out", "why": "Once, before."},
                  {"pic": "\U0001F4A7", "label": "fill the can", "bin": "in", "why": "For every plant."},
                  {"pic": "\U0001F331", "label": "pour on the plant", "bin": "in", "why": "For every plant."},
                  {"pic": "\U0001F6B6", "label": "walk to the next plant", "bin": "in", "why": "For every plant."},
                  {"pic": "\U0001F6AA", "label": "put the can away", "bin": "out", "why": "Once, after."},
                  {"pic": "\U0001F9E4", "label": "put on your gardening gloves", "bin": "out", "why": "Once, before."},
              ]},
             "Every-time steps go inside; once steps stay outside."),

        step("questions", "Check: inputs and loops", "\U0001F4DD", "Branch checker", ["4CT.09", "4CT.10"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Branches and loops you build."], [], ["Read, think, tap."]),
             {"items": [
                 q("'Is it raining? Yes: an umbrella. No: sunglasses.' It is sunny. The output is...", "☀️", "sunglasses", ["an umbrella", "both", "neither"], "The sunny input answers no, so it takes the no steps."),
                 q("Which step goes INSIDE 'repeat 3 times' for watering 3 plants?", "\U0001F501", "pour on a plant", ["get the can", "put the can away", "open the shed"], "It happens for every plant."),
                 q("An algorithm with a question in it gives...", "\U0001F500", "different outputs for different inputs", ["the same output always", "no output", "a random output"], "The answer picks the branch."),
             ]},
             "Question, loop, output."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CT.05", "4CT.09", "4CT.10"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Branches, inputs, outputs, and loops you build."], [], ["Read, look, tap."]),
             {"items": [
                 q("The part of an algorithm where the input decides which steps run is...", "\U0001F500", "a branch", ["a loop", "a sub-routine", "an output"], "One question about the input, and a rule for each answer."),
                 q("In the quiz algorithm, a wrong answer as input gives which output?", "❌", "a cross and a hint", ["a tick and a point", "well done", "nothing"], "A wrong answer takes the no steps."),
                 q("With input 'raining', which steps are SKIPPED?", "\U0001F327️", "the sunny steps: sunglasses and sun hat", ["get dressed", "walk to school", "the umbrella"], "Only one answer's steps run."),
                 q("To water 4 plants with the same loop as 3, you...", "\U0001F522", "change the count to 4", ["add a plant step", "remove the loop", "do it twice"], "The count is the only change."),
                 q("Repeat 5 times: pour, cook, plate. Then serve. How many steps unrolled?", "\U0001F95E", "16", ["4", "5", "15"], "Fifteen in the loop, plus serve."),
                 q("Which belongs OUTSIDE the pancake loop?", "\U0001F963", "mix the batter", ["pour batter in the pan", "cook and flip", "put it on the plate"], "Mixing happens once."),
                 q("Same algorithm, two inputs. The outputs are...", "\U0001F4E4", "different, because the branch is different", ["always the same", "both branches", "an error"], "Inputs decide outputs."),
                 q("You write a branch for borrowing a book. 'Say thank you' happens whatever the answer. Where does it go?", "\U0001F642", "outside the branches, after them", ["only in the on-the-shelf branch", "only in the someone-has-it branch", "in both branches"], "A step that happens for every answer goes outside the branches."),
             ]},
             "That is the whole lesson finished. You follow a branch, write one, and build a loop."),
    ],
}


LESSON["about"] = [
    "Follow an algorithm that asks a question about its input and say how the answer picks the output.",
    "Write an algorithm whose output depends on its input, and test it with both inputs.",
    "Build an algorithm with a repeat loop for a task that repeats.",
    "Decide which steps go inside a loop and which stay outside.",
]

LESSON["lecture"] = [
    part("\U0001F500", "One question, two answers",
         "An algorithm can fork. It asks one question about its input - is it raining? - and each answer has its own steps: yes, a raincoat and an umbrella; no, sunglasses and a hat. The steps before and after are the same for everyone; the middle depends on the answer. Only one answer's steps run."),
    part("\U0001F4E4", "Inputs decide outputs",
         "The same algorithm gives a different output for a different input. Raining in, umbrella out. Sunny in, sunglasses out. A quiz program does the same: right answer in, a tick and a point; wrong answer in, a cross and a hint."),
    part("\u270D\uFE0F", "Writing a branch",
         "To write an algorithm with a branch, first choose the question that decides it. Steps that happen whatever the answer go outside the branches, first or after; steps for one answer go in that answer's branch. Then test it with both answers: a step that turns up for the wrong answer is in the wrong place. (Some languages write this with the words IF and ELSE. You meet those next year; here the question and its two answers are the whole idea.)"),
    part("\U0001F501", "Building a loop",
         "When a task does the same steps for every plant, or every place, or every pancake, those steps go inside a repeat loop with a count. Fill, pour, walk, repeat 3 times. What happens only once - getting the can, putting it away - stays outside."),
    part("\U0001F52E", "Checking it",
         "Unroll your loop to check it: repeat 3 times of three steps is nine steps, with the can fetched once before and put away once after. If the unrolled algorithm does the whole task and nothing extra, the loop is right."),
]

LESSON["words"] = [
    word("branch", "\U0001F500", "A fork in an algorithm where the answer to a question decides which steps run.",
         ["The raincoat is on the raining branch.", "A question makes two branches."]),
    word("question", "❓", "What an algorithm asks about its input to decide which steps to run.",
         ["'Is it raining?' is the question.", "The answer to the question picks the branch."]),
    word("rule", "\U0001F4CB", "What an algorithm does for one answer: this answer, these steps.",
         ["The rule for yes is: take an umbrella.", "Two answers, two rules."]),
    word("repeat", "\U0001F501", "To do the steps in a loop again.",
         ["Repeat 3 times.", "Put the repeating steps in the loop."]),
    word("count", "\U0001F522", "How many times a repeat loop goes round.",
         ["Set the count to 4.", "Change only the count."]),
]

LESSON["home"] = [
    home("Roll for the weather", "A dice, cards",
         ["Write a leaving-the-house algorithm with a question in the middle: odd is raining, even is sunny.",
          "Roll the dice, answer the question, then follow only the steps for that answer.",
          "Roll again. Did the output change?"],
         "Same algorithm, different input, different output."),
    home("Build the loop", "Cards, a real job",
         ["Pick a job that repeats: laying the table, watering plants, hanging washing.",
          "Write the repeating steps once in a 'repeat N times' box; write the once-only steps outside it.",
          "Unroll it out loud. Does it do exactly the job?"],
         "Every-time steps inside, once steps outside."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you broke a big task into sub-routines, wrote a main algorithm that calls them in order, and followed an algorithm into a sub-routine and back."
LESSON["warmup"] = [
    q("When the bell rings you line up; when it is quiet you keep working. The bell rings. What do you do?", "\U0001F3EB", "line up", ["keep working", "go home", "sing a song"], "What you hear decides what you do: one input, one output."),
    q("At a crossing the red person means stop. The green person means...", "\U0001F6B6", "cross, with care", ["stop", "turn round", "run as fast as you can"], "What the light shows decides what you do."),
]
