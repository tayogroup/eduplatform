# -*- coding: utf-8 -*-
"""Lesson 4 - What Happens Next.

0838 Stage 1 Analysis: 1Ac.01 talk about simple, personal consequences of
own actions; 1As.01 choose a possible solution to an issue from a range of
actions given. The topic is looking after things - water, coats, plants and
the playground - because the framework's Stage 1 consequence is what happens
TO THE CHILD, and a wet coat, a wet floor and a droopy plant are consequences
a five-year-old can see.
"""
from _kit import explain, step, opt, q, action, part, word, home

LESSON = {
    "slug": "what-happens-next",
    "title": "What Happens Next",
    "blurb": "Every action has a next thing. Predict what will happen to you, watch it happen, then choose the action that would really fix a problem.",
    "steps": [
        step("demo", "If you do this…", "➡️", "If, then", ["1Ac.01"],
             "Every action has a next thing. Press <b>Next</b> and see.",
             explain(
                 ["When you DO something, something HAPPENS next.", "That next thing is called a consequence."],
                 ["You leave the tap running. The sink fills up. The water goes over the top.",
                  "The consequence of leaving the tap on is a wet floor."],
                 ["Children think a consequence is a punishment.", "It is not. It is just what happens next, good or bad."],
                 ["Press Next and watch what happens."]),
             {"frames": [
                 {"pic": "\U0001F6B0", "cap": "Sami turns the tap on to wash his hands.", "say": "Sami turns the tap on to wash his hands."},
                 {"pic": "⚽", "cap": "Then he sees his friends playing and <b>runs off</b>. The tap is still on.", "say": "Then he sees his friends playing and runs off. The tap is still on.", "sound": "drip"},
                 {"pic": "\U0001F4A6", "cap": "The sink fills up. And up. And <b>over the top</b>.", "say": "The sink fills up. And up. And over the top.", "sound": "splash"},
                 {"pic": "\U0001F9F9", "cap": "Now Sami has to mop a <b>wet floor</b>. That is what happened next.", "say": "Now Sami has to mop a wet floor. That is what happened next.", "sound": "thud"},
                 {"pic": "➡️", "cap": "What happens next because of what you do is a <b>consequence</b>.", "say": "What happens next because of what you do is a consequence. Good things and bad things.", "sound": "tada"},
             ]},
             "Do something, and something happens next. That is a consequence."),

        step("consequence", "What happens to you?", "\U0001F52E", "Next-thing predictor", ["1Ac.01"],
             "Something happens. Predict what will happen to YOU, then see if you were right.",
             explain(
                 ["Before you do something, you can think: what will happen to me?"],
                 ["It is raining and you leave your coat at home.", "What happens to you? You get wet and cold.",
                  "You share your crayons. What happens? Your friend is happy, and you draw together."],
                 ["Children only think about the bad ones.", "Sharing has a consequence too, and it is a nice one."],
                 ["Read what happens, tap what you think, then press See what happens."]),
             {"rounds": [
                 {"situation": "It is raining. You leave your coat at home.", "pic": "\U0001F327️",
                  "predict": {"ask": "What will happen to you?", "opts": [opt("I will get wet and cold", True), opt("I will stay warm and dry", False), opt("I will get a new coat", False)]},
                  "result": {"pic": "\U0001F976", "say": "You got wet and cold on the way to school.", "sound": "drip"},
                  "why": "No coat in the rain means a wet, cold you."},
                 {"situation": "You leave the tap running and go off to play.", "pic": "\U0001F6B0",
                  "predict": {"ask": "What will happen?", "opts": [opt("The sink overflows and the floor gets wet", True), opt("The tap turns itself off", False), opt("Nothing at all", False)]},
                  "result": {"pic": "\U0001F4A6", "say": "The sink overflowed. You had to mop the floor.", "sound": "splash"},
                  "why": "A tap left on keeps running. That water has to go somewhere."},
                 {"situation": "You stay up very late playing.", "pic": "\U0001F319",
                  "predict": {"ask": "What will happen to you tomorrow?", "opts": [opt("I will be tired at school", True), opt("I will be full of energy", False), opt("I will be taller", False)]},
                  "result": {"pic": "\U0001F971", "say": "You were so tired at school that you could not listen.", "sound": "thud"},
                  "why": "Less sleep tonight means a tired you tomorrow."},
                 {"situation": "You share your crayons with Nora.", "pic": "\U0001F58D️",
                  "predict": {"ask": "What will happen?", "opts": [opt("Nora is happy, and we draw together", True), opt("Nora runs away", False), opt("My crayons disappear", False)]},
                  "result": {"pic": "\U0001F60A", "say": "Nora smiled, and you drew together.", "sound": "ding"},
                  "why": "Sharing has a consequence too: a happy friend to draw with."},
                 {"situation": "You leave your toys all over the stairs.", "pic": "\U0001F9F8",
                  "predict": {"ask": "What will happen to you?", "opts": [opt("I will trip over them in the dark", True), opt("The toys will tidy themselves", False), opt("I will get more toys", False)]},
                  "result": {"pic": "\U0001F915", "say": "You tripped over your own teddy on the stairs. Ouch.", "sound": "thud"},
                  "why": "Toys on the stairs are there for you to trip on later."},
             ]},
             "Five things you might do, and what happened to you next. You can think ahead now."),

        step("sort", "Good for me, or not?", "\U0001F914", "Consequence sorter", ["1Ac.01"],
             "Think about what happens to YOU next. Is it good for you, or not?",
             explain(
                 ["Some actions lead to good things for you.", "Some lead to things you would rather not have."],
                 ["Drinking water: you feel well. Good for me.", "Running into the road: you could get hurt. Not good for me."],
                 ["Children sort by whether it is FUN.", "Sort by what happens to you afterwards."],
                 ["Think about the next thing, then tap the bin."]),
             {"ask": "What happens to me next? Good for me, or not?",
              "bins": [{"id": "good", "label": "Good for me", "pic": "\U0001F60A"}, {"id": "bad", "label": "Not good for me", "pic": "\U0001F61F"}],
              "items": [
                  {"pic": "\U0001F4A7", "label": "drinking water", "bin": "good", "why": "You feel well and your body works. Good for you."},
                  {"pic": "\U0001F6A6", "label": "running into the road", "bin": "bad", "why": "You could get hurt. Not good for you."},
                  {"pic": "\U0001F9E2", "label": "wearing a hat in the hot sun", "bin": "good", "why": "Your head stays cool and safe. Good for you."},
                  {"pic": "\U0001F371", "label": "forgetting your lunch", "bin": "bad", "why": "You will be hungry all afternoon."},
                  {"pic": "\U0001F91D", "label": "sharing with a friend", "bin": "good", "why": "Your friend is happy, and you play together."},
                  {"pic": "\U0001F6B7", "label": "pushing in the line", "bin": "bad", "why": "People get cross with you, and you might get sent to the back."},
              ]},
             "You can tell a good next thing from a bad one before it happens."),

        step("solve", "Fix it!", "\U0001F527", "Problem fixer", ["1As.01"],
             "Here is a problem. Some actions would fix it and some would not. Tap one and see what happens.",
             explain(
                 ["A problem needs an action that FIXES it.", "Not just any action. The right one."],
                 ["The plants are droopy. They need water.", "Singing to them is nice. It does not give them water.",
                  "Watering them fixes it."],
                 ["Children pick the funniest action.", "Ask: would this actually fix the problem?"],
                 ["Tap an action. If it does not fix it, try another."]),
             {"rounds": [
                 {"issue": {"title": "The class plants are droopy", "pic": "\U0001F940", "say": "They have not had a drink for days. What could we do?", "fixed": "The plants are standing up again!"},
                  "needs": "water",
                  "actions": [
                      action("water", "Give them some water", "\U0001F4A7", "water", "You watered them, and by the afternoon the leaves were standing up."),
                      action("sing", "Sing them a song", "\U0001F3B6", "nothing", "You sang beautifully. The plants are still droopy. Songs are not water."),
                      action("cupboard", "Put them in the dark cupboard", "\U0001F6AA", "worse", "In the dark they drooped even more. Plants need light AND water."),
                      action("hat", "Give them a hat", "\U0001F3A9", "nothing", "A very smart plant. Still droopy. A hat is not a drink."),
                  ],
                  "why": "The plants needed water, so watering was the action that fixed it."},
                 {"issue": {"title": "The playground is covered in litter", "pic": "\U0001F5D1️", "say": "Wrappers and cups everywhere. What could we do?", "fixed": "The playground is clean!"},
                  "needs": "clean",
                  "actions": [
                      action("bin", "Pick it up with a grown-up and put it in the bin", "\U0001F6AE", "clean", "You and a grown-up picked it all up and put it in the bin. The playground is clean."),
                      action("kick", "Kick it into the corner", "\U0001F9B6", "nothing", "Now the litter is in the corner. The playground still has litter in it."),
                      action("shout", "Shout at the litter", "\U0001F4E2", "nothing", "You shouted very loudly. The litter did not move."),
                      action("sweets", "Bring more sweets to eat outside", "\U0001F36C", "worse", "More sweets meant more wrappers. Now there is even more litter."),
                  ],
                  "why": "Litter needs picking up and binning. That is what cleaned the playground."},
                 {"issue": {"title": "The tap is dripping and wasting water", "pic": "\U0001F4A7", "say": "Drip, drip, drip, all day. What could we do?", "fixed": "The dripping has stopped!"},
                  "needs": "off",
                  "actions": [
                      action("tight", "Turn it off properly, and tell a grown-up if it still drips", "\U0001F6B0", "off", "You turned it off properly and told a grown-up. The dripping stopped."),
                      action("bowl", "Put a bowl under it and leave it", "\U0001F963", "nothing", "The bowl filled up, and then it spilled over the top. Water is still being wasted."),
                      action("more", "Turn the tap on more", "\U0001F30A", "worse", "Now it is not dripping. It is pouring. That is even more water wasted."),
                      action("nobody", "Say nothing and walk away", "\U0001F6B6", "nothing", "You walked away. Drip, drip, drip. Nothing changed."),
                  ],
                  "why": "Turn it off properly, and tell a grown-up if it still drips. That stopped the waste."},
                 {"issue": {"title": "Sami has no crayons and cannot draw", "pic": "\U0001F622", "say": "Everyone else is drawing. What could we do?", "fixed": "Sami is drawing with a big smile!"},
                  "needs": "share",
                  "actions": [
                      action("share", "Share some of your crayons", "\U0001F58D️", "share", "You gave Sami half of your crayons. Now you are both drawing."),
                      action("draw", "Draw Sami's picture for him", "\U0001F3A8", "nothing", "You drew a lovely picture. But Sami still did not get to draw anything."),
                      action("hide", "Hide your crayons so he does not ask", "\U0001F648", "worse", "Sami saw you hide them and felt even sadder."),
                      action("tell", "Tell him drawing is boring", "\U0001F644", "nothing", "Sami does not think it is boring. He still has no crayons."),
                  ],
                  "why": "Sami needed crayons. Sharing yours was the action that fixed it."},
             ]},
             "Four problems, four actions that fixed them. You can choose a solution."),

        step("explore", "What is water for?", "\U0001F4A7", "Water spotter", ["1Ac.01"],
             "We use water for so many things. Tap each one.",
             explain(
                 ["Water is for drinking, washing, cooking, and more.", "If we waste it, there is less for all of that."],
                 ["Tap each thing water is for.", "Then think: what happens if the tap is left running?"],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F964", "label": "drinking", "say": "Drinking. Every person needs water to drink every day."},
                 {"pic": "\U0001F6C1", "label": "washing", "say": "Washing ourselves, our clothes and our dishes."},
                 {"pic": "\U0001F372", "label": "cooking", "say": "Cooking. Rice, pasta and soup all need water."},
                 {"pic": "\U0001F331", "label": "plants", "say": "Plants. The garden and the farm need water to grow food."},
                 {"pic": "\U0001F410", "label": "animals", "say": "Animals. Pets and farm animals need water too."},
                 {"pic": "\U0001F9F9", "label": "cleaning", "say": "Cleaning the floor, the classroom and the streets."},
             ], "need": 6,
              "then": {"ask": "If we leave taps running and waste water, what happens?",
                       "opts": [opt("There is less water for drinking, washing and plants", True), opt("More water appears", False), opt("Nothing changes", False)],
                       "why": "Water that runs down the drain is gone. Wasting it means less for everything it is for."}},
             "Water is for so much. That is why what we do with a tap matters."),

        step("questions", "Next things and fixes", "\U0001F4AC", "Next-thing judge", ["1Ac.01", "1As.01"],
             "Think about consequences and solutions. Tap the answer.",
             explain(
                 ["A consequence is what happens next.", "A solution is the action that fixes a problem."],
                 ["Think about the tap, the coat, the plants and the litter."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("You leave your coat at home in the rain. What happens to you?", "\U0001F327️", "you get wet and cold", ["you stay dry", "you get a hat"], "No coat, rain, wet you."),
                 q("The plants are droopy. Which action fixes it?", "\U0001F940", "give them water", ["sing to them", "give them a hat"], "Droopy plants need a drink."),
                 q("What is a consequence?", "➡️", "what happens next because of what you did", ["a kind of tap", "a game"], "Do something, and something happens next. That is a consequence."),
                 q("The playground has litter. Which action fixes it?", "\U0001F5D1️", "pick it up and bin it", ["kick it into the corner", "shout at it"], "Litter in the bin is a clean playground. Ask a grown-up to help, and never touch anything sharp."),
             ]},
             "You know what happens next, and what fixes a problem."),

        step("quiz", "Show what you know", "⭐", "Star thinker", ["1Ac.01", "1As.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about Sami's tap, the five situations and the four problems."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Sami left the tap on and ran off. What happened next?", "\U0001F6B0", "the sink overflowed and the floor got wet", ["the tap turned itself off", "the sink got smaller", "nothing"], "A tap left on keeps running until the water goes over the top."),
                 q("You stay up very late. What happens to you tomorrow?", "\U0001F319", "you are tired at school", ["you are taller", "you are full of energy", "you get a prize"], "Less sleep means a tired you."),
                 q("You share your crayons with Nora. What happens?", "\U0001F58D️", "Nora is happy, and you draw together", ["Nora runs away", "the crayons vanish", "you get told off"], "Sharing has a happy consequence."),
                 q("Which of these is GOOD for you?", "\U0001F60A", "wearing a hat in the hot sun", ["running into the road", "forgetting your lunch", "pushing in the line"], "A hat keeps your head cool and safe."),
                 q("The tap is dripping. Which action fixes it?", "\U0001F4A7", "turn it off properly, and tell a grown-up if it still drips", ["turn it on more", "walk away", "put a bowl under it and leave it"], "Turning it off properly stops the waste, and a grown-up can fix a tap that still drips."),
                 q("Sami has no crayons. Which action fixes it?", "\U0001F622", "share some of yours", ["hide yours", "draw his picture for him", "tell him drawing is boring"], "Sami needed crayons, so sharing fixed it."),
                 q("What is water for?", "\U0001F4A7", "drinking, washing, cooking and plants", ["only for swimming", "nothing much", "only for cars"], "Water is for so many things, which is why we should not waste it."),
                 q("Before you do something, what is a good question to ask yourself?", "\U0001F914", "what will happen to me next?", ["what is for lunch?", "nothing", "what colour is it?"], "Thinking about the next thing is thinking ahead."),
             ]},
             "That is the whole lesson finished. You can think about what happens next, and choose what would fix a problem."),
    ],
}


LESSON["about"] = [
    "Say what happens to you next because of something you do.",
    "Predict a consequence before it happens.",
    "Tell a good next thing from a bad one.",
    "Choose the action that would really fix a problem.",
]

LESSON["lecture"] = [
    part("\U0001F6B0", "Sami's tap",
         "Sami turned the tap on and ran off to play. The sink filled up and went over the top. Now Sami has a wet floor to mop. That is what happened next."),
    part("➡️", "Consequences",
         "What happens next because of what you do is called a consequence. Leave your coat at home in the rain, and you get wet. Share your crayons, and your friend smiles and you draw together. Good ones and bad ones."),
    part("\U0001F52E", "Think ahead",
         "Before you do something, you can ask: what will happen to me? If I stay up late, I will be tired. If I leave my toys on the stairs, I will trip over them. Thinking ahead is a skill."),
    part("\U0001F527", "Fixing a problem",
         "A problem needs an action that really fixes it. Droopy plants need water, not a song. Litter needs picking up, not kicking into a corner. Choose the action that fixes it."),
    part("\U0001F4A7", "Water",
         "Water is for drinking, washing, cooking, plants and animals. Water that runs down the drain is gone. So turn the tap off, and there is more left for everything else."),
]

LESSON["words"] = [
    word("action", "\U0001F9B6", "Something you do.",
         ["Turning the tap off is an action.", "Choose an action that fixes it."]),
    word("consequence", "➡️", "What happens next because of what you did.",
         ["A wet floor was the consequence.", "Sharing has a happy consequence."]),
    word("predict", "\U0001F52E", "To say what you think will happen before it happens.",
         ["Predict what will happen to you.", "I predict I will get wet."]),
    word("problem", "\U0001F6A8", "Something that is wrong and needs fixing.",
         ["The droopy plants are a problem.", "What is the problem?"]),
    word("solution", "\U0001F527", "The action that fixes a problem.",
         ["Water was the solution for the plants.", "Choose the solution."]),
    word("waste", "\U0001F4A7", "To use up something for nothing.",
         ["A dripping tap wastes water.", "Do not waste it."]),
]

LESSON["home"] = [
    home("If, then", "A grown-up and a quiet minute",
         ["Say something you might do: leave my shoes by the door, or eat all the sweets.",
          "Your grown-up says: and then what happens to you?",
          "Swap over. They say an action, you say what happens next."],
         "Was every next thing a bad one? Find a happy one."),
    home("Water watch", "Everyone at home, for one day",
         ["Watch for taps left running, all day.",
          "Every time you find one, turn it off and say: that fixes it!",
          "Count how many you turned off."],
         "How many taps did you catch?"),
    home("Fix it at home", "A grown-up and a small problem",
         ["Find a small problem at home: toys everywhere, or a thirsty plant.",
          "Say three things you could do about it.",
          "Choose the one that really fixes it, and do it."],
         "Did your action fix the problem, or just move it?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "how to bake bread", "the names of the planets"],
}
