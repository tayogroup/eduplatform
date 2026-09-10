# -*- coding: utf-8 -*-
"""Lesson 2 - Predict and Compare.

0059 Stage 4 Computational Thinking: 4CT.05 predict the outcome of
algorithms that contain repetition; 4CT.04 compare and contrast algorithms
for the same task to determine which best suits the purpose; 4CT.03
repetition makes algorithms more concise.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "predict-and-compare",
    "title": "Predict and Compare",
    "blurb": "Work out where a looped program leaves Robo before pressing Go, fold a long task into a repeat, and compare three algorithms for one task to pick the best for each purpose.",
    "steps": [
        step("robot", "Where does the loop leave Robo?", "\U0001F52E", "Loop predictor", ["4CT.05"],
             "Robo's program has a <b>repeat</b> loop in it. Unroll it in your head, tap the square where Robo will stop, then press <b>Go</b>.",
             explain(
                 ["To predict a looped program, unroll the loop: do the body that many times in your head, following Robo's facing as you go."],
                 ["Repeat 2 times: forward, forward. That is forward four times.",
                  "Repeat 3 times: forward, turn right, forward, turn left. Each turn moves Robo one up and one along, like stairs."],
                 ["Children do the loop body once.", "Count the turns on your fingers, and watch the arrow."],
                 ["Unroll it, tap the square, press Go."]),
             {"rows": 5, "cols": 5, "levels": [
                 {"title": "Loop 1", "predict": True, "start": [0, 4], "facing": "up", "target": [0, 0], "targetPic": "\U0001F338", "loop": {"times": 2, "body": ["F", "F"]}, "answer": [0, 0]},
                 {"title": "Loop 2: stairs", "predict": True, "start": [0, 4], "facing": "up", "target": [3, 1], "targetPic": "\U0001F3EB", "targetName": "school", "loop": {"times": 3, "body": ["F", "R", "F", "L"]}, "answer": [3, 1]},
                 {"title": "Loop 3, then one more", "predict": True, "start": [4, 4], "facing": "left", "target": [3, 2], "targetPic": "\U0001F3E0", "targetName": "house", "loop": {"times": 2, "body": ["F", "F", "R"]}, "after": ["F"], "answer": [3, 2]},
             ]},
             "Three looped programs, predicted before Go."),

        step("loopspot", "Find the repeat", "\U0001F501", "Repeat finder", ["4CT.03"],
             "Making four pancakes, written out long. Tap the steps of the FIRST pancake; the page folds the rest into one repeat.",
             explain(
                 ["Repetition makes an algorithm concise: the four pancakes are one loop, gone round four times."],
                 ["Pour, cook, flip, cook, plate. Four times. Written once with repeat 4 times: five steps instead of twenty."],
                 [],
                 ["Tap the five steps of the first pancake."]),
             {"task": "make four pancakes",
              "steps": [
                  s("mix", "Mix the batter", "\U0001F963"),
                  s("pour", "Pour batter in the pan", "\U0001F373"), s("cook", "Cook one side", "\U0001F525"), s("flip", "Flip it", "\U0001F95E"), s("cook2", "Cook the other side", "\U0001F525"), s("plate", "Put it on the plate", "\U0001F37D️"),
                  s("pour", "Pour batter in the pan", "\U0001F373"), s("cook", "Cook one side", "\U0001F525"), s("flip", "Flip it", "\U0001F95E"), s("cook2", "Cook the other side", "\U0001F525"), s("plate", "Put it on the plate", "\U0001F37D️"),
                  s("pour", "Pour batter in the pan", "\U0001F373"), s("cook", "Cook one side", "\U0001F525"), s("flip", "Flip it", "\U0001F95E"), s("cook2", "Cook the other side", "\U0001F525"), s("plate", "Put it on the plate", "\U0001F37D️"),
                  s("pour", "Pour batter in the pan", "\U0001F373"), s("cook", "Cook one side", "\U0001F525"), s("flip", "Flip it", "\U0001F95E"), s("cook2", "Cook the other side", "\U0001F525"), s("plate", "Put it on the plate", "\U0001F37D️"),
                  s("serve", "Serve them", "\U0001F60B"),
              ],
              "run": {"start": 1, "length": 5, "times": 4},
              "then": {"ask": "How many times does the pancake loop go round?", "opts": [opt("4", True), opt("5", False), opt("20", False)], "why": "Once per pancake."}},
             "Twenty-two steps became seven with a loop."),

        step("compare", "Which algorithm is best?", "⚖️", "Algorithm comparer", ["4CT.04"],
             "Three algorithms get you from home to school. Each round names a <b>purpose</b>. Tap the algorithm that suits it best.",
             explain(
                 ["When several algorithms do the same task, the best one depends on what you need: fewest steps, quickest, cheapest, safest, driest.",
                  "Compare them on facts, then choose for the purpose."],
                 ["The short cut has the fewest steps but is muddy when wet.", "The bus is quickest but costs money.", "The main road is free and dry but has the most steps."],
                 ["Children pick one favourite for every purpose.", "The purpose changes the answer. Read it every time."],
                 ["Read the purpose, compare the facts, tap."]),
             {"task": "get from home to school",
              "algos": [
                  {"id": "cut", "name": "The short cut", "pic": "\U0001F333", "steps": ["Leave the house", "Cross the park", "Through the gap in the hedge", "In at the side gate"], "facts": {"minutes": 12, "note": "muddy when wet"}},
                  {"id": "bus", "name": "The bus", "pic": "\U0001F68C", "steps": ["Leave the house", "Walk to the stop", "Wait for the bus", "Ride three stops", "Get off", "Cross at the lights"], "facts": {"minutes": 8, "note": "warm and dry; costs money"}},
                  {"id": "road", "name": "The main road", "pic": "\U0001F6E3️", "steps": ["Leave the house", "Walk to the corner", "Along the main road", "Cross at the lights", "In at the front gate"], "facts": {"minutes": 15, "note": "free, no mud, busy road"}},
              ],
              "rounds": [
                  {"purpose": "the fewest steps to remember", "answer": "cut", "check": {"kind": "fewest_steps"}, "why": "The short cut is four steps; the others are five and six."},
                  {"purpose": "getting there quickest", "answer": "bus", "check": {"kind": "fastest"}, "why": "8 minutes on the bus, against 12 and 15 on foot."},
                  {"purpose": "staying dry on a rainy day", "answer": "bus", "why": "The bus is warm and dry; the park is muddy and the road is a long walk in the rain."},
                  {"purpose": "spending no money and getting no mud on your shoes", "answer": "road", "why": "The road is free and has no mud. The bus costs money; the park is muddy."},
              ]},
             "The best algorithm depends on the purpose."),

        step("context", "Compare and contrast", "⚖️", "Contrast thinker", ["4CT.04"],
             "Comparing means finding what is the same; contrasting means finding what is different. Tap each thing to compare algorithms on.",
             explain(
                 ["To choose between algorithms you compare them on the things that matter for the purpose."],
                 ["Steps: how many to remember.", "Time: how long it takes.", "Cost: money or effort.", "Outcome: does it really do the whole job, and how well?"],
                 [],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F522", "label": "how many steps", "say": "How many steps. Fewer steps are easier to remember and quicker to write, but not always quicker to do."},
                 {"pic": "⏱️", "label": "how long it takes", "say": "How long it takes. A short algorithm can be slow if one step takes ages, like waiting for a bus."},
                 {"pic": "\U0001F4B7", "label": "what it costs", "say": "What it costs: money, effort, or something else. The bus costs money; the walk costs energy."},
                 {"pic": "\U0001F3AF", "label": "the outcome", "say": "The outcome. Two algorithms can both get you to school but one leaves you muddy. Does the outcome suit the purpose?"},
             ], "need": 4,
              "then": {"ask": "Two algorithms both do the job. How do you decide which is best?",
                       "opts": [opt("Compare them on the things that matter for the purpose", True), opt("Pick the longest", False), opt("Pick the one you saw first", False)],
                       "why": "Steps, time, cost, outcome: judged against the purpose."}},
             "Compare on what matters for the purpose."),

        step("questions", "Check: predict and compare", "\U0001F4DD", "Compare checker", ["4CT.03", "4CT.04", "4CT.05"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Predicting loops, folding repeats, comparing."], [], ["Read, think, tap."]),
             {"items": [
                 q("Robo runs 'repeat 3 times: forward, forward'. How many squares forward?", "\U0001F916", "6", ["2", "3", "5"], "Two forwards, three turns."),
                 q("Four pancakes, five steps each, written with a loop is...", "\U0001F95E", "repeat 4 times: pour, cook, flip, cook, plate", ["twenty steps written out", "one pancake", "no loop"], "The repeated steps written once, with a count."),
                 q("The quickest way to school is the bus, but it costs money. If the purpose is 'spend nothing'...", "\U0001F4B7", "the bus is not the best algorithm for that purpose", ["the bus is still best", "there is no answer", "walk faster"], "The purpose decides."),
             ]},
             "Unroll, fold, compare."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CT.03", "4CT.04", "4CT.05"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Predicting loops, concise repeats and comparing algorithms."], [], ["Read, look, tap."]),
             {"items": [
                 q("To predict a looped program you...", "\U0001F52E", "unroll the loop in your head, that many times", ["do the body once", "guess", "press Go first"], "Unroll, then predict."),
                 q("'Repeat 2 times: forward, forward, turn right.' After the loop, Robo has turned...", "↻", "twice", ["once", "four times", "never"], "One turn per time round."),
                 q("Which makes the pancake algorithm concise?", "✂️", "writing the five pancake steps once inside repeat 4 times", ["writing them twenty times", "leaving out flipping", "making one pancake"], "Repetition written once."),
                 q("Comparing algorithms means...", "⚖️", "looking at their steps, time, cost and outcome against the purpose", ["choosing the longest", "counting the letters", "picking your favourite"], "Compare on what matters."),
                 q("The short cut has the fewest steps. For 'getting there quickest' it is...", "\U0001F333", "not necessarily best: the bus is quicker", ["always best", "the only option", "the slowest"], "Fewest steps is not quickest."),
                 q("If the purpose is 'stay dry in the rain', which fact matters most?", "\U0001F327️", "whether the route is muddy or covered", ["how many letters are in its name", "the colour of the bus", "nothing"], "The purpose picks the fact."),
                 q("Robo starts facing up and runs 'repeat 2 times: forward, forward'. Where is it?", "⬆️", "4 squares up from where it started", ["2 squares up", "where it started", "4 squares to the right"], "Four forwards, all facing up."),
             ]},
             "That is the whole lesson finished. You predict a loop and choose an algorithm for its purpose."),
    ],
}


LESSON["about"] = [
    "Predict where a program with a repeat loop will leave Robo.",
    "Fold repeated steps into a loop to make an algorithm concise.",
    "Compare algorithms for the same task on steps, time, cost and outcome.",
    "Choose the algorithm that best suits a given purpose.",
]

LESSON["lecture"] = [
    part("\U0001F52E", "Predicting a loop",
         "To predict what a looped program does, unroll the loop: do its body that many times in your head, keeping track of which way Robo faces. Repeat 3 times, forward, turn right, forward, turn left, climbs like stairs: three up and three along."),
    part("\U0001F501", "Folding a repeat",
         "Four pancakes written out long is twenty steps. The same five steps repeated four times fold into one repeat loop: seven steps in all. Repetition makes an algorithm concise, and one change inside the loop changes every pancake."),
    part("⚖️", "Comparing algorithms",
         "Several algorithms can do one task. Compare them on facts: how many steps, how long, what it costs, what the outcome is like. Contrast where they differ: the short cut is muddy, the bus costs money, the main road is long."),
    part("\U0001F3AF", "The purpose decides",
         "There is no best algorithm on its own. For fewest steps, the short cut. For speed, the bus. For staying dry, the bus again. For no money and no mud, the main road. The purpose chooses; your job is to read it and compare."),
]

LESSON["words"] = [
    word("predict", "\U0001F52E", "To say what will happen before it does.",
         ["Predict where Robo stops.", "I predict four squares up."]),
    word("unroll", "\U0001F4DC", "To write out a loop as its plain steps.",
         ["Unroll the loop: forward, forward, forward, forward.", "Unrolled, it is twenty steps."]),
    word("compare", "⚖️", "To look at two or more things and find how they are alike and different.",
         ["Compare the three routes.", "Compare them on time and cost."]),
    word("contrast", "↔️", "To point out how things differ.",
         ["The bus and the walk contrast in cost.", "Compare and contrast the algorithms."]),
    word("purpose", "\U0001F3AF", "What you need the algorithm to do well.",
         ["The purpose is to stay dry.", "Choose for the purpose."]),
]

LESSON["home"] = [
    home("Predict the loop", "A floor grid, a toy, cards",
         ["Write a program with 'repeat 3 times' and two or three arrow cards inside.",
          "Before moving the toy, put a counter on the square you predict it ends on.",
          "Run it, unrolling the loop out loud. Were you right?"],
         "Unroll, then check."),
    home("Two ways to do it", "A grown-up, one job",
         ["Write two algorithms for the same job: two routes to the shop, two ways to tidy a room.",
          "Compare them: steps, time, effort, how well the job gets done.",
          "Say which is best when you are in a hurry, and which when you must not miss anything."],
         "The purpose picks the algorithm."),
]
