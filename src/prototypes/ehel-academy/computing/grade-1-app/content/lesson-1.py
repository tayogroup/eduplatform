# -*- coding: utf-8 -*-
"""Lesson 1 - What Is an Algorithm?

0059 Stage 1 Computational Thinking: 1CT.05 an algorithm is a set of
instructions to complete a task; 1CT.01 follow the steps in algorithms for
everyday tasks; 1CT.04 suggest sets of ordered instructions for simple tasks;
1CT.06 the order matters; with 1P.01, that a computer follows algorithms too,
written as code.
"""
from _kit import explain, step, opt, q, s, part, word, home, swatch

LESSON = {
    "slug": "what-is-an-algorithm",
    "title": "What Is an Algorithm?",
    "blurb": "Watch a robot make toast, find the algorithms in your own day, follow two of them step by step, and put the steps of two jobs in order.",
    "steps": [
        step("demo", "Robo makes toast", "\U0001F916", "Robo's toast", ["1CT.05"],
             "Robo only does what it is told. Press <b>Next</b> and watch Robo follow the steps.",
             explain(
                 ["A set of steps to do a job is called an algorithm."],
                 ["Robo wants toast.", "Robo cannot guess.", "Robo needs the steps, one at a time, in order.",
                  "Take the bread. Put it in the toaster. Push the lever. Wait. Spread the butter.", "That list is an algorithm."],
                 ["Children think a robot is clever on its own.", "It is not. It only does the steps it is given."],
                 ["Press Next and count the steps."]),
             {"frames": [
                 {"pic": "\U0001F916", "cap": "Robo wants <b>toast</b>. But Robo only does what it is told.", "say": "Robo wants toast. But Robo only does what it is told. Robo needs the steps."},
                 {"pic": "\U0001F35E", "cap": "Step 1: <b>take</b> a slice of bread.", "say": "Step one. Take a slice of bread.", "sound": "click"},
                 {"pic": "\U0001F35E➡️\U0001F50C", "cap": "Step 2: <b>put</b> it in the toaster.", "say": "Step two. Put it in the toaster.", "sound": "click"},
                 {"pic": "\U0001F447", "cap": "Step 3: <b>push</b> the lever down.", "say": "Step three. Push the lever down.", "sound": "thud"},
                 {"pic": "⏳", "cap": "Step 4: <b>wait</b> for it to pop up.", "say": "Step four. Wait for it to pop up.", "sound": "pop"},
                 {"pic": swatch("butter"), "cap": "Step 5: <b>spread</b> the butter.", "say": "Step five. Spread the butter.", "sound": "click"},
                 {"pic": "\U0001F35E✨", "cap": "Toast! Those five steps are an <b>algorithm</b>.", "say": "Toast! Those five steps, in that order, are an algorithm. An algorithm is a set of steps to do a job.", "sound": "tada"},
             ]},
             "An algorithm is a set of steps to do a job. Robo followed one."),

        step("explore", "Algorithms all around you", "\U0001F50D", "Algorithm spotter", ["1CT.05"],
             "You follow algorithms every day. Tap each one to hear its steps.",
             explain(
                 ["An algorithm is not only for robots.", "Every time you do a job in steps, you are following an algorithm."],
                 ["A recipe is an algorithm for cooking.", "Getting dressed is an algorithm.", "Brushing your teeth is an algorithm.",
                  "Even a dance is an algorithm: step, step, clap, turn."],
                 ["Children think an algorithm has to be hard.", "It can be three steps long. It just has to be steps, in order."],
                 ["Tap all six and listen for the steps in each one."]),
             {"items": [
                 {"pic": "\U0001F373", "label": "a recipe", "say": "A recipe is an algorithm. Crack the egg. Beat it. Cook it in the pan."},
                 {"pic": "\U0001F455", "label": "getting dressed", "say": "Getting dressed is an algorithm. Socks, then shoes, then coat."},
                 {"pic": "\U0001F9B7", "label": "brushing teeth", "say": "Brushing your teeth is an algorithm. Paste on the brush. Brush. Rinse."},
                 {"pic": "\U0001F483", "label": "a dance", "say": "A dance is an algorithm. Step, step, clap, turn. The same steps every time."},
                 {"pic": "\U0001F6B8", "label": "crossing the road", "say": "Crossing the road is an algorithm. Stop. Look. Listen. Walk."},
                 {"pic": "\U0001F9F1", "label": "building a tower", "say": "Building a tower is an algorithm. Big brick first, then the next, then the next."},
             ], "need": 6,
              "then": {"ask": "What is an algorithm?",
                       "opts": [opt("A set of steps to do a job, in order", True), opt("A kind of robot", False), opt("A picture of a computer", False)],
                       "why": "An algorithm is a set of steps to do a job or solve a problem. Robots follow them, and so do you."}},
             "Recipes, dressing, dances, crossing the road. Algorithms are everywhere."),

        step("follow", "Follow the algorithm: get dressed", "\U0001F9E6", "Dressed in order", ["1CT.01"],
             "Do the steps in the order the algorithm says. Tap the step that comes next.",
             explain(
                 ["To follow an algorithm, you do step one, then step two, then step three.", "Never skip, never jump ahead."],
                 ["The algorithm is on the left.", "The next step is lit up.", "Find that step in the buttons and tap it.", "Watch the child get dressed."],
                 ["Children tap the step they like best.", "The algorithm decides, not you. Look at which step is lit."],
                 ["Tap step one."]),
             {"scene": "dress", "steps": [
                 s("socks", "Put on socks", "\U0001F9E6", "Socks on."),
                 s("shoes", "Put on shoes", "\U0001F45F", "Shoes on, over the socks."),
                 s("coat", "Put on your coat", "\U0001F9E5", "Coat on."),
                 s("hat", "Put on your hat", "\U0001F3A9", "Hat on. Ready to go out."),
             ]},
             "You followed the algorithm, step by step."),

        step("follow", "Follow the algorithm: wash your hands", "\U0001F9FC", "Clean hands", ["1CT.01"],
             "Five steps this time. Tap the step the algorithm says next.",
             explain(
                 ["A longer algorithm is followed the same way: one step at a time, in order."],
                 ["Turn the tap on.", "Soap.", "Rub.", "Rinse.", "Dry.", "Five steps, and clean hands at the end."],
                 ["Children want to dry their hands before they rinse.", "Follow the steps as they are written, even when you think you know."],
                 ["Tap step one and keep going."]),
             {"scene": "handwash", "steps": [
                 s("tap", "Turn the tap on", "\U0001F6B0", "Tap on. Water running."),
                 s("soap", "Put soap on your hands", "\U0001F9FC", "Soap on."),
                 s("rub", "Rub your hands together", "\U0001F450", "Rub, rub, rub. Bubbles everywhere."),
                 s("rinse", "Rinse under the water", "\U0001F4A7", "Rinse the bubbles away."),
                 s("dry", "Dry them on the towel", "\U0001F9FB", "Dry. Clean hands."),
             ]},
             "Five steps, in order. That is following an algorithm."),

        step("order", "Put the steps in order: plant a seed", "\U0001F331", "Seed planter", ["1CT.04", "1CT.06"],
             "You write the algorithm now. Tap the step that comes <b>first</b>, then the next.",
             explain(
                 ["Now you make the algorithm.", "Think about what has to happen first, and what cannot happen until something else has."],
                 ["You cannot put soil in a pot you have not got.", "You cannot plant a seed in soil that is not there yet.",
                  "Pot, soil, seed, water."],
                 ["Children want to water first because watering is fun.", "Water what? There is no seed yet."],
                 ["Tap the four steps in order and watch the plant grow."]),
             {"scene": "plant", "items": [
                 {"id": "pot", "pic": "\U0001F3FA", "label": "get a pot", "say": "First, get a pot."},
                 {"id": "soil", "pic": swatch("soil"), "label": "put soil in it", "say": "Put soil in the pot."},
                 {"id": "seed", "pic": "\U0001F330", "label": "plant the seed", "say": "Plant the seed in the soil."},
                 {"id": "water", "pic": "\U0001F4A7", "label": "water it", "say": "Water it. Now it can grow."},
             ]},
             "Pot, soil, seed, water. Your algorithm grew a plant."),

        step("order", "Put the steps in order: build a tower", "\U0001F9F1", "Tower builder", ["1CT.04", "1CT.06"],
             "Build a tower that will not fall over. Which brick goes down <b>first</b>?",
             explain(
                 ["A good algorithm puts the steps in the order that works."],
                 ["The biggest brick goes at the bottom, or the tower falls.", "Then the middle brick.", "Then the small one.", "The flag goes on last, at the top."],
                 ["Children start with the flag because it is the best bit.", "A flag with nothing under it is on the floor."],
                 ["Tap the bricks in order, bottom to top."]),
             {"scene": "tower", "items": [
                 {"id": "big", "pic": swatch("brick", "#E9744F"), "label": "the big brick", "say": "The big brick goes down first."},
                 {"id": "middle", "pic": swatch("brick", "#35BFB2"), "label": "the middle brick", "say": "The middle brick goes on top of it."},
                 {"id": "small", "pic": swatch("brick", "#F4C95D"), "label": "the small brick", "say": "The small brick goes on top of that."},
                 {"id": "flag", "pic": "\U0001F6A9", "label": "the flag", "say": "The flag goes on last, at the very top."},
             ]},
             "Big, middle, small, flag. An algorithm for a tower."),

        step("context", "Who follows algorithms?", "\U0001F469‍\U0001F373", "Algorithm users", ["1CT.05", "1P.01"],
             "People follow algorithms at work, and so do computers. Tap each one.",
             explain(
                 ["Lots of people use algorithms at work.", "A computer uses them too."],
                 ["A cook follows a recipe.", "A builder follows a plan.", "A nurse follows the steps to check you are well.",
                  "A computer follows an algorithm that is written in code, and then it is called a program."],
                 ["Children think computers think of things by themselves.", "They do not. Somebody wrote the steps."],
                 ["Tap each one and listen for the steps."]),
             {"items": [
                 {"pic": "\U0001F469‍\U0001F373", "label": "a cook", "say": "A cook follows a recipe. Chop, stir, cook, serve. An algorithm for dinner."},
                 {"pic": "\U0001F477", "label": "a builder", "say": "A builder follows a plan. Foundations first, then walls, then the roof."},
                 {"pic": "\U0001F469‍⚕️", "label": "a nurse", "say": "A nurse follows steps to check you are well. Temperature, then pulse, then a look at your throat."},
                 {"pic": "\U0001F4BB", "label": "a computer", "say": "A computer follows algorithms too. The steps are written in code the computer understands. Then it is called a program."},
             ], "need": 4,
              "then": {"ask": "A computer follows an algorithm too. How are the steps written for a computer?",
                       "opts": [opt("As code, in a program", True), opt("With a paintbrush", False), opt("They are not written; the computer guesses", False)],
                       "why": "An algorithm can be written as code. A computer runs that code as a program."}},
             "Cooks, builders, nurses and computers all follow algorithms."),

        step("questions", "Algorithm or not?", "❓", "Algorithm judge", ["1CT.05"],
             "Is this an algorithm? Tap the answer.",
             explain(
                 ["An algorithm is steps, in order, to do a job.", "If it is not steps, it is not an algorithm."],
                 ["A list of steps to make tea: yes.", "A photo of a cat: no. It is a picture, not steps.", "Directions to the park: yes, they are steps."],
                 [],
                 ["Ask: is it steps to do a job? Then tap."]),
             {"label": "Question", "items": [
                 q("Steps to make a cup of tea: boil water, put in a tea bag, pour, wait, take the bag out.", "\U0001F375", "Yes, an algorithm", ["No, it is not"], "Steps, in order, to do a job. That is an algorithm."),
                 q("A photo of a cat.", "\U0001F431", "No, it is not", ["Yes, an algorithm"], "A photo is a picture, not steps to do something."),
                 q("Directions to the park: go out of the gate, turn left, walk to the corner, cross at the lights.", "\U0001F333", "Yes, an algorithm", ["No, it is not"], "Directions are steps in order. An algorithm for getting somewhere."),
                 q("A big red ball.", "\U0001F534", "No, it is not", ["Yes, an algorithm"], "A ball is a thing, not a set of steps."),
                 q("The rules of a game: roll the dice, move that many squares, if you land on a snake slide down.", "\U0001F3B2", "Yes, an algorithm", ["No, it is not"], "The rules of a game are steps to follow. An algorithm."),
             ]},
             "Steps, in order, to do a job. That is an algorithm, and you can spot one."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1CT.05", "1CT.01", "1CT.04", "1CT.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about Robo's toast, getting dressed, the seed and the tower."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is an algorithm?", "\U0001F916", "a set of steps to do a job", ["a kind of toast", "a big computer", "a sock"], "An algorithm is a set of steps, in order, to do a job or solve a problem."),
                 q("Robo wants toast. What does Robo need?", "\U0001F35E", "the steps, in order", ["a hat", "nothing, Robo can guess", "a photo of toast"], "Robo only does what it is told. It needs the steps."),
                 q("Getting dressed: what goes on FIRST?", "\U0001F9E6", "socks", ["shoes", "hat", "coat"], "Socks first, then shoes over them."),
                 q("Planting a seed: what comes LAST?", "\U0001F331", "water it", ["get a pot", "put soil in", "plant the seed"], "Pot, soil, seed, and then water."),
                 q("Building a tower: which brick goes at the bottom?", "\U0001F9F1", "the big brick", ["the small brick", "the flag", "the middle brick"], "The big brick goes first, at the bottom, so the tower does not fall."),
                 q("Which of these is an algorithm?", "❓", "a recipe", ["a spoon", "a photo", "a red ball"], "A recipe is steps in order. An algorithm."),
                 q("You are following an algorithm. What do you do?", "\U0001F449", "one step at a time, in order", ["all the steps at once", "the fun steps only", "the last step first"], "Step one, then step two, then step three. Never skip."),
                 q("Who follows an algorithm?", "\U0001F469‍\U0001F373", "cooks, builders and computers", ["only robots", "nobody", "only computers"], "People follow algorithms at work, and computers follow them as programs."),
             ]},
             "That is the whole lesson finished. You know what an algorithm is."),
    ],
}


LESSON["about"] = [
    "Say what an algorithm is: a set of steps to do a job.",
    "Spot algorithms in your own day.",
    "Follow an algorithm one step at a time, in order.",
    "Put the steps of a job in the right order yourself.",
]

LESSON["lecture"] = [
    part("\U0001F916", "Robo needs steps",
         "Robo wants toast. But Robo cannot guess. Robo needs to be told every step: take the bread, put it in the toaster, push the lever, wait, spread the butter. A set of steps to do a job is called an algorithm."),
    part("\U0001F50D", "Algorithms all around",
         "You follow algorithms every day. Getting dressed is one. Brushing your teeth is one. A recipe is one. A dance is one. Steps, in order, to do a job."),
    part("\U0001F449", "Following an algorithm",
         "To follow an algorithm you do step one, then step two, then step three. You never skip a step and you never jump ahead. Socks, then shoes. Soap, then rub, then rinse."),
    part("\U0001F9F1", "Making an algorithm",
         "You can write an algorithm too. Think about what has to happen first. The big brick goes at the bottom. The seed goes in after the soil. The order has to work."),
    part("\U0001F4BB", "Computers follow algorithms",
         "A computer follows algorithms too. The steps are written in code, in words the computer understands. Then it is called a program. Somebody always writes the steps."),
]

LESSON["words"] = [
    word("algorithm", "\U0001F4DD", "A set of steps to do a job or solve a problem.",
         ["A recipe is an algorithm.", "Robo followed the algorithm for toast."]),
    word("step", "\U0001F463", "One thing you do in an algorithm.",
         ["Step one: put on socks.", "Do the steps one at a time."]),
    word("order", "\U0001F522", "Which step comes first, next and last.",
         ["The order of the steps matters.", "Put the bricks in order."]),
    word("task", "✅", "A job to do.",
         ["Making toast is a task.", "The algorithm finishes the task."]),
    word("follow", "\U0001F449", "To do the steps, one at a time, as they are written.",
         ["Follow the algorithm.", "Robo follows every step."]),
    word("instruction", "\U0001F4E2", "A step that tells you what to do.",
         ["The first instruction is: get a pot.", "Give Robo an instruction."]),
]

LESSON["home"] = [
    home("Toast algorithm", "A grown-up, a kitchen, some bread",
         ["Tell your grown-up every step for making toast, one at a time.",
          "Your grown-up does EXACTLY what you say, and nothing you did not say.",
          "If you forget a step, watch what happens."],
         "Did you say 'take the bread out of the bag'? A computer would not know."),
    home("Robot grown-up", "A grown-up and a pair of shoes",
         ["Your grown-up is a robot. It only does what you say.",
          "Give the steps for putting on shoes.",
          "Say the steps in a different order and see what the robot does."],
         "The order matters. Shoes before socks looks very silly."),
    home("Draw an algorithm", "Paper and crayons",
         ["Pick a job: making a sandwich, brushing teeth, feeding a pet.",
          "Draw one picture for each step, in a row.",
          "Number the pictures 1, 2, 3, 4."],
         "Could somebody follow your pictures without asking you anything?"),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["warmup"] = [
    q("What do you think an algorithm is?", "\U0001F9E9", "a set of steps to do a job", ["a kind of animal", "a colour", "a song"], "An algorithm is a set of steps to do a job."),
    q("To make toast, what do you do first?", "\U0001F35E", "take a slice of bread", ["spread the butter", "eat it", "wait for it to pop up"], "The bread comes first. Every job has a first step."),
]
