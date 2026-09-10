# -*- coding: utf-8 -*-
"""Lesson 1 - Living, Once Alive, Never Alive.

0097 Stage 3: 3Bp.01 living, once alive and never alive; 3Bp.02 the life
processes plants and animals share (nutrition, growth, movement,
reproduction); 3TWSp.02 the five types of scientific enquiry; with
3TWSp.01, 3TWSc.01 and 3SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "living-once-alive-never-alive",
    "title": "Living, Once Alive, Never Alive",
    "blurb": "Find the four things every living thing does, sort things that are alive from things that once were and things that never were, and meet the five ways scientists find things out.",
    "steps": [
        step("explore", "Four life processes", "\U0001F9EC", "Life processes", ["3Bp.02"],
             "Every plant and every animal does these four things. Tap each one.",
             explain(
                 ["Plants and animals look very different, but they all do the same four things: they take in food, they grow, they move, and they make more of their own kind."],
                 ["Nutrition: a cat eats; a plant makes its food from sunlight.", "Growth: a kitten grows into a cat; a seedling grows into a tree.",
                  "Movement: a cat runs; a plant turns its leaves towards the light.", "Reproduction: cats have kittens; a plant makes seeds."],
                 ["Children think plants do not move.", "They do, slowly: a sunflower turns to follow the Sun all day."],
                 ["Tap all four and say which one a plant does too."]),
             {"items": [
                 {"pic": "\U0001F37D️", "label": "nutrition", "sub": "taking in food", "say": "Nutrition means taking in food. Animals eat. Plants make their own food from sunlight, water and air."},
                 {"pic": "\U0001F4C8", "label": "growth", "sub": "getting bigger", "say": "Growth. A kitten grows into a cat. A seedling grows into a tree. Every living thing grows."},
                 {"pic": "\U0001F3C3\U0001F3FE", "label": "movement", "sub": "moving by itself", "say": "Movement. A cat runs. A plant turns its leaves towards the light, slowly, all by itself."},
                 {"pic": "\U0001F423", "label": "reproduction", "sub": "making more", "say": "Reproduction means making more of your own kind. Hens lay eggs. Plants make seeds."},
             ], "need": 4,
              "then": {"ask": "A sunflower turns its head to follow the Sun. Which life process is that?",
                       "opts": [opt("movement", True), opt("reproduction", False), opt("nutrition", False)],
                       "why": "Turning by itself is movement. Plants move too, just slowly."}},
             "Nutrition, growth, movement, reproduction. Plants and animals all do them."),

        step("sort", "Living, once alive, or never alive?", "\U0001F5C2️", "Three-way sort", ["3Bp.01", "3TWSc.01"],
             "Is this <b>living</b>, was it <b>once alive</b>, or has it <b>never</b> been alive? Tap the bin.",
             explain(
                 ["There are three groups, not two.", "A wooden chair is not alive, but the wood was once part of a living tree.", "A stone never was."],
                 ["A cat: living.", "A wooden chair: once alive, because it was a tree.", "A stone: never alive.",
                  "A leather shoe: once alive, because leather is animal skin.", "A plastic cup: never alive. It was made in a factory."],
                 ["Children put wood and paper with never alive.", "Ask: where did it come from? Wood and paper come from trees."],
                 ["Ask where it came from, then tap."]),
             {"ask": "Living, once alive, or never alive?",
              "bins": [{"id": "living", "label": "Living", "pic": "\U0001F431"}, {"id": "once", "label": "Once alive", "pic": "\U0001FAB5"}, {"id": "never", "label": "Never alive", "pic": "\U0001FAA8"}],
              "items": [
                  {"pic": "\U0001F431", "label": "a cat", "bin": "living", "why": "A cat eats, grows, moves and can have kittens. Living."},
                  {"pic": "\U0001FA91", "label": "a wooden chair", "bin": "once", "why": "Wood comes from a tree, which was alive."},
                  {"pic": "\U0001FAA8", "label": "a stone", "bin": "never", "why": "A stone never ate, grew or moved by itself."},
                  {"pic": "\U0001F45E", "label": "a leather shoe", "bin": "once", "why": "Leather is the skin of an animal that was alive."},
                  {"pic": "\U0001F964", "label": "a plastic cup", "bin": "never", "why": "Plastic is made in a factory. It was never alive."},
                  {"pic": "\U0001F333", "label": "an oak tree", "bin": "living", "why": "A tree takes in food, grows and makes acorns. Living."},
                  {"pic": "\U0001F4D6", "label": "a paper book", "bin": "once", "why": "Paper is made from mashed-up wood, from trees."},
                  {"pic": "\U0001F9F4", "label": "a glass bottle", "bin": "never", "why": "Glass is made by melting sand. Never alive."},
                  {"pic": "\U0001F9F6", "label": "a woollen jumper", "bin": "once", "why": "Wool grew on a living sheep."},
                  {"pic": "\U0001F344", "label": "a mushroom", "bin": "living", "why": "A mushroom grows, feeds and makes spores. It is living."},
              ]},
             "Living, once alive, never alive. Ask where it came from."),

        step("demo", "Where once-alive things come from", "\U0001FAB5", "Once alive", ["3Bp.01"],
             "Press <b>Next</b> to follow a chair and a jumper back to where they came from.",
             explain(
                 ["Once alive means the material came from a living thing that is no longer alive."],
                 ["A chair was a tree.", "A jumper was a sheep's wool.", "A book was a tree too.", "A stone, a metal spoon and a glass were never alive."],
                 ["Children think once alive means broken.", "It means the material came from something that lived."],
                 ["Press Next and follow each one back."]),
             {"frames": [
                 {"pic": "\U0001F333", "cap": "A tree, alive: it grows, feeds and makes seeds.", "say": "Here is a tree. It is alive. It grows, makes its own food, and drops acorns."},
                 {"pic": "\U0001FA93", "cap": "It is cut down. The wood is no longer alive.", "say": "The tree is cut down. The wood is no longer alive, but it came from something that was."},
                 {"pic": "\U0001FA91", "cap": "The wood becomes a chair: <b>once alive</b>.", "say": "The wood is made into a chair. The chair was once alive."},
                 {"pic": "\U0001F411", "cap": "A sheep grows wool. The wool is cut and made into a jumper: <b>once alive</b>.", "say": "A sheep grows wool. The wool is cut off and made into a jumper. The jumper was once alive."},
                 {"pic": "\U0001FAA8", "cap": "A stone, a metal spoon, a glass: <b>never alive</b>.", "say": "A stone was never alive. Neither was a metal spoon or a glass. They never grew, fed or moved."},
             ]},
             "Wood, paper, wool and leather were once alive. Rock, metal and glass never were."),

        step("explore", "Five ways to find out", "\U0001F50E", "Five enquiries", ["3TWSp.02"],
             "Scientists find things out in five ways. Tap each one.",
             explain(
                 ["There are five types of scientific enquiry, and you will use every one of them this year."],
                 ["Research: look it up in a book or on a trusted website.", "Fair test: change one thing and keep everything else the same.",
                  "Observing over time: watch something change, day after day.", "Identifying and classifying: sort things into groups by what they are like.",
                  "Pattern seeking: measure lots of things and look for a pattern."],
                 ["Children think science is always experiments.", "Looking something up carefully is science too."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F4DA", "label": "research", "sub": "look it up", "say": "Research. Find the answer in a book, a fact card or a trusted website. How far away is the Moon? Look it up."},
                 {"pic": "⚖️", "label": "fair test", "sub": "change one thing", "say": "A fair test. Change one thing, keep everything else the same, and measure what happens. Does more water make a plant grow taller?"},
                 {"pic": "⏳", "label": "observing over time", "sub": "watch it change", "say": "Observing over time. Watch something change over days or weeks. How does a tadpole change each week?"},
                 {"pic": "\U0001F5C2️", "label": "identifying and classifying", "sub": "sort into groups", "say": "Identifying and classifying. Look closely and sort things into groups. Which of these animals are insects?"},
                 {"pic": "\U0001F4C8", "label": "pattern seeking", "sub": "look for a pattern", "say": "Pattern seeking. Measure lots of things and look for a pattern. Do taller children have bigger feet?"},
             ], "need": 5,
              "then": {"ask": "You want to know how a bean changes over two weeks. Which type of enquiry is that?",
                       "opts": [opt("observing over time", True), opt("research", False), opt("a fair test", False)],
                       "why": "Watching the same bean change day after day is observing over time."}},
             "Research, fair test, observing over time, classifying, pattern seeking. Five ways."),

        step("sort", "Which type of enquiry?", "\U0001F9EA", "Enquiry sorter", ["3TWSp.02", "3TWSp.01"],
             "Read the question. Which type of enquiry would answer it? Tap the bin.",
             explain(
                 ["The question tells you which type of enquiry you need."],
                 ["Does more water make it grow taller? Change one thing: fair test.", "How does it change each week? Observing over time.",
                  "Which of these are insects? Classifying.", "Do bigger people have bigger hands? Pattern seeking.", "How far is the Moon? Research."],
                 ["Two questions can sound alike and need different enquiries.", "Which surface is slipperiest is a fair test; which surfaces are rough is classifying."],
                 ["Read it twice, then tap."]),
             {"ask": "Which type of enquiry?",
              "bins": [{"id": "fair", "label": "Fair test", "pic": "⚖️"}, {"id": "time", "label": "Observing over time", "pic": "⏳"},
                       {"id": "class", "label": "Classifying", "pic": "\U0001F5C2️"}, {"id": "pattern", "label": "Pattern seeking", "pic": "\U0001F4C8"}, {"id": "research", "label": "Research", "pic": "\U0001F4DA"}],
              "items": [
                  {"pic": "\U0001F331", "label": "Does a plant grow taller with more water?", "bin": "fair", "why": "Change one thing, the water, and keep the rest the same. A fair test."},
                  {"pic": "\U0001F438", "label": "How does a tadpole change each week?", "bin": "time", "why": "Watching the same tadpole week after week is observing over time."},
                  {"pic": "\U0001F41C", "label": "Which of these animals are insects?", "bin": "class", "why": "Sorting animals into groups is classifying."},
                  {"pic": "\U0001F9B6\U0001F3FE", "label": "Do taller children have bigger feet?", "bin": "pattern", "why": "Measure lots of children and look for a pattern."},
                  {"pic": "\U0001F319", "label": "How far away is the Moon?", "bin": "research", "why": "You cannot measure that in class. Look it up."},
                  {"pic": "\U0001F9CA", "label": "Which surface is the slipperiest?", "bin": "fair", "why": "Same push, same block, different surface. A fair test."},
                  {"pic": "\U0001FAA8", "label": "Sort these rocks by how hard they are", "bin": "class", "why": "Sorting into groups by a property is classifying."},
                  {"pic": "\U0001F315", "label": "Does the Moon look the same every night?", "bin": "time", "why": "Look every night for a month: observing over time."},
              ]},
             "The question tells you the enquiry."),

        step("ask", "Ask a question you can test", "❓", "Good questions", ["3TWSp.01", "3TWSp.02"],
             "A scientist's question can be investigated. Pick a question about snails, then say how you would find out.",
             explain(
                 ["A scientific question is one you can find an answer to by looking, testing, measuring or looking up."],
                 ["Do snails move faster on wet ground? You can test that.", "Which food do woodlice like best? You can test that too.", "Are snails nice? You cannot test that."],
                 ["Children ask questions nobody could test.", "Ask: how would I find out?"],
                 ["Pick a question, then pick how to find out."]),
             {"pic": "\U0001F40C",
              "questions": ["Do snails move faster on wet ground or dry ground?", "Which food do woodlice like best?", "How many legs does a woodlouse have?"],
              "findOut": {"ask": "You want to know whether snails move faster on wet ground or dry. How would you find out?",
                          "opts": [opt("A fair test: same snail, same distance, wet then dry, and time it", True), opt("Guess", False), opt("Ask the snail", False)],
                          "why": "Change one thing, the wetness, and keep everything else the same. That is a fair test, and it answers the question."}},
             "A good question is one you can find out."),

        step("context", "Everyone uses science", "\U0001F468\U0001F3FE‍\U0001F33E", "Science at work", ["3SIC.03"],
             "Some people use science all day at work. Everyone uses it a bit. Tap each one.",
             explain(
                 ["Everyone uses science: a cook checking food is cooked, a parent reading a thermometer.", "Some people use it as their whole job."],
                 ["A vet uses science on animals.", "A farmer uses it on crops and soil.", "A nurse uses it on people.", "A cook uses it on food."],
                 [],
                 ["Tap each one and say what science they use."]),
             {"items": [
                 {"pic": "\U0001F469\U0001F3FE‍⚕️", "label": "vet", "say": "A vet knows what each animal needs to stay alive and healthy, and what to do when it is ill."},
                 {"pic": "\U0001F468\U0001F3FE‍\U0001F33E", "label": "farmer", "say": "A farmer knows what plants need to grow: water, light, warmth and good soil."},
                 {"pic": "\U0001F469\U0001F3FE‍⚕️", "label": "nurse", "say": "A nurse measures temperature and heartbeats, and knows what a healthy body does."},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F373", "label": "cook", "say": "A cook uses science every day: how heat changes food, and what keeps it safe to eat."},
             ], "need": 4,
              "then": {"ask": "Who uses science?",
                       "opts": [opt("Everyone, and some people all day at work", True), opt("Only scientists in white coats", False), opt("Nobody outside school", False)],
                       "why": "Everyone uses science. Vets, farmers, nurses and cooks use it professionally."}},
             "Everyone uses science. Some people use it all day."),

        step("questions", "Alive, or not?", "✅", "Life check", ["3Bp.01", "3Bp.02", "3TWSp.02"],
             "Tap the answer.",
             explain(
                 ["The four life processes, the three groups, and the five enquiries."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which of these do plants AND animals do?", "\U0001F9EC", "grow", ["talk", "read", "drive"], "Growth is a life process every living thing shares."),
                 q("A wooden spoon is...", "\U0001F944", "once alive", ["living", "never alive"], "Wood came from a living tree."),
                 q("A metal key is...", "\U0001F511", "never alive", ["living", "once alive"], "Metal comes from rock. It never lived."),
                 q("You want to know which paper towel soaks up the most water. Which enquiry?", "\U0001F4A7", "a fair test", ["research", "observing over time"], "Same amount of water, different towels: change one thing."),
                 q("Making more of your own kind is called...", "\U0001F423", "reproduction", ["nutrition", "movement"], "Reproduction: eggs, babies, seeds."),
             ]},
             "You know what living things do."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Bp.01", "3Bp.02", "3TWSp.02", "3SIC.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How many life processes did you learn?", "\U0001F9EC", "four: nutrition, growth, movement, reproduction", ["two: eating and sleeping", "one: breathing"], "Four, shared by plants and animals."),
                 q("A leather belt is...", "\U0001F45E", "once alive", ["living", "never alive"], "Leather is animal skin."),
                 q("A mushroom is...", "\U0001F344", "living", ["once alive", "never alive"], "It grows, feeds and makes spores."),
                 q("Which of these was NEVER alive?", "\U0001FAA8", "a glass bottle", ["a paper bag", "a cotton T-shirt", "a wooden pencil"], "Glass is melted sand. The others came from plants."),
                 q("How does a plant move?", "\U0001F33B", "it turns its leaves and flowers towards the light", ["it walks", "it does not move at all"], "Slowly, but by itself."),
                 q("Drawing the Moon every night for a month is...", "\U0001F319", "observing over time", ["a fair test", "research"], "Watching the same thing change over time."),
                 q("Sorting leaves into groups by their shape is...", "\U0001F343", "identifying and classifying", ["pattern seeking", "a fair test"], "Putting things into groups by what they are like."),
                 q("Who uses science at work?", "\U0001F469\U0001F3FE‍⚕️", "vets, farmers, nurses and cooks", ["nobody", "only teachers"], "Everyone uses science. Many people use it all day."),
             ]},
             "That is the whole lesson finished. You know what makes something alive."),
    ],
}

LESSON["about"] = [
    "Name the four life processes every plant and animal shares.",
    "Sort things into living, once alive and never alive.",
    "Name the five types of scientific enquiry and match a question to one.",
    "Ask a question that can be investigated.",
]

LESSON["lecture"] = [
    part("\U0001F9EC", "What every living thing does",
         "Every living thing does four things. It takes in food. It grows. It moves by itself. And it makes more of its own kind. A cat does all four. So does a tree, only slowly."),
    part("\U0001FAB5", "Once alive",
         "Some things are not alive now, but they came from something that was. A wooden chair was a tree. A woollen jumper was a sheep's coat. A paper book was a tree too. We say these were once alive."),
    part("\U0001FAA8", "Never alive",
         "A stone, a metal spoon, a glass bottle, a plastic cup. None of these ever ate, grew, moved by itself or had young. They were never alive."),
    part("\U0001F50E", "Five ways to find out",
         "Scientists find things out in five ways. They look it up. They do a fair test, changing one thing. They watch something change over time. They sort things into groups. And they measure lots of things to find a pattern."),
    part("❓", "A question you can test",
         "A scientist's question is one you can answer by looking, testing or looking up. Do snails move faster on wet ground? You can test that. Are snails nice? You cannot. Today, you will ask a question you can test."),
]

LESSON["words"] = [
    word("life process", "\U0001F9EC", "One of the things every living thing does: nutrition, growth, movement and reproduction.",
         ["Growth is a life process.", "Plants and animals share the same life processes."]),
    word("nutrition", "\U0001F37D️", "Taking in food. Animals eat; plants make their own food.",
         ["A cat gets its nutrition from its food.", "A plant's nutrition comes from sunlight, water and air."]),
    word("reproduction", "\U0001F423", "Making more of your own kind: eggs, babies or seeds.",
         ["Laying eggs is reproduction.", "A plant's seeds are its reproduction."]),
    word("living", "\U0001F431", "Alive now. It does all four life processes.",
         ["A cat is living.", "A tree is a living thing."]),
    word("once alive", "\U0001FAB5", "Not alive now, but made from something that was.",
         ["A wooden table was once alive.", "Leather and wool were once alive."]),
    word("enquiry", "\U0001F50E", "A way of finding something out in science.",
         ["A fair test is one type of enquiry.", "Which enquiry answers your question?"]),
    word("fair test", "⚖️", "An enquiry where you change one thing and keep everything else the same.",
         ["In a fair test, only the water changes.", "Time both snails the same way, so it is a fair test."]),
]

LESSON["home"] = [
    home("Living, once alive, never alive hunt", "Paper and a pencil, your kitchen",
         ["Find ten things in the kitchen.",
          "For each one, ask: is it alive now? Did it come from something alive? Or neither?",
          "Draw three lists."],
         "Wooden spoons, paper, cotton cloths and leather were all once alive."),
    home("Watch a bean over time", "A dried bean, a jar, wet kitchen paper, a notebook",
         ["Put the bean between wet paper and the glass of the jar.",
          "Every day, draw what you see and write the date.",
          "Keep going for two weeks."],
         "That is observing over time. Which day did the root appear? Which day the shoot?"),
    home("A fair test with paper towels", "Two different paper towels, a spoon, water, a tray",
         ["Put a piece of each towel on the tray.",
          "Put exactly one spoonful of water on each.",
          "Lift each towel and see how much water is left on the tray."],
         "Change only the towel. Keep the water the same. That is what makes it fair."),
]
