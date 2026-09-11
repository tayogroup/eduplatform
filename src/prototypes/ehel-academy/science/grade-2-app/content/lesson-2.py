# -*- coding: utf-8 -*-
"""Lesson 2 - Teeth and Staying Healthy.

0097 Stage 2: 2Bs.02 types of human teeth, their jobs and their care; 2Bp.01
diet, hygiene and exercise; 2Bp.02 what illness is and its common signs; with
2TWSc.01, 2TWSc.02, 2TWSc.05 (a fact card as a secondary source), 2SIC.02 and
2SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home

TEETH = [
    {"id": "incisors", "label": "incisors", "say": "The incisors are the flat front teeth. They cut food, like biting into an apple."},
    {"id": "canines", "label": "canines", "say": "The canines are the pointed teeth beside the incisors. They tear food."},
    {"id": "molars", "label": "molars", "say": "The molars are the big wide teeth at the back. They grind food into small pieces."},
    {"id": "tongue", "label": "tongue", "say": "The tongue moves food around and tastes it. It is not a tooth."},
]

LESSON = {
    "slug": "teeth-and-staying-healthy",
    "title": "Teeth and Staying Healthy",
    "blurb": "Find the three kinds of teeth in your mouth and what each is for, look after them, and find out what keeps a body healthy and what illness looks like.",
    "steps": [
        step("label", "Find the teeth", "\U0001F9B7", "Tooth finder", ["2Bs.02"],
             "Look in the mouth. Tap the <b>%s</b>.",
             explain(
                 ["You have three kinds of teeth, and each kind has a shape that fits its job."],
                 ["The incisors are at the front: flat, like little spades.", "The canines are next to them: pointed.", "The molars are at the back: wide and bumpy."],
                 ["Children tap a front tooth when asked for molars.", "Molars are right at the back, where you chew."],
                 ["Listen for the name, find that kind of tooth, then tap it. Feel the same teeth with your tongue."]),
             {"figure": "mouth", "ask": "Tap the %s.", "parts": TEETH},
             "Incisors at the front, canines beside them, molars at the back."),

        step("explore", "What each tooth does", "\U0001F34E", "Tooth jobs", ["2Bs.02"],
             "Each kind of tooth has a job. Tap to hear it, then try it with a mouthful of air.",
             explain(
                 ["The shape of a tooth suits its job."],
                 ["Flat incisors cut, like scissors.", "Pointed canines grip and tear.", "Wide bumpy molars grind and mash, like a pestle in a bowl."],
                 ["Children think all teeth do the same thing.", "Bite an apple: the front teeth cut a piece off, the back teeth chew it."],
                 ["Tap all three, then bite and chew the air and notice which teeth you use."]),
             {"items": [
                 {"pic": "\U0001F34E", "label": "incisors cut", "say": "Incisors are flat and sharp at the edge. They cut a bite off an apple."},
                 {"pic": "\U0001F356", "label": "canines tear", "say": "Canines are pointed. They grip and tear tougher food, like meat."},
                 {"pic": "\U0001F95C", "label": "molars grind", "say": "Molars are wide with bumps. They grind and mash food small enough to swallow."},
                 {"pic": "\U0001F445", "label": "tongue moves it", "say": "The tongue pushes food onto the molars and moves it around. Then you swallow."},
             ], "need": 4,
              "then": {"ask": "You bite a piece off a carrot. Which teeth did the cutting?",
                       "opts": [opt("the incisors at the front", True), opt("the molars at the back", False), opt("the tongue", False)],
                       "why": "Incisors are the flat front teeth that cut."}},
             "Incisors cut, canines tear, molars grind."),

        step("lookup", "Look it up: caring for teeth", "\U0001F4D6", "Fact finder", ["2Bs.02", "2TWSc.05"],
             "Scientists look things up. Read the fact card, then answer <b>from the card</b>.",
             explain(
                 ["Not every answer comes from an experiment.", "Some come from a book, a poster or a fact card. That is called a secondary source."],
                 ["The card says how often to brush and for how long.", "Find the question's words in the card, and the answer is beside them."],
                 ["Children answer from memory and get the number wrong.", "The card is right there. Read it."],
                 ["Read the card once, then find each answer in it."]),
             {"source": {"title": "Looking after your teeth",
                         "lines": ["Brush your teeth <b>twice a day</b>: in the morning and before bed.",
                                   "Brush for <b>two minutes</b>, all the way to the back molars.",
                                   "Use a small amount of <b>fluoride toothpaste</b>. It makes the teeth strong.",
                                   "Sugary drinks and sweets feed the germs that make holes in teeth. Have them <b>less often</b>.",
                                   "Visit the <b>dentist</b> to have your teeth checked.",
                                   "Your first teeth fall out and <b>adult teeth</b> grow in their place. Adult teeth have to last your whole life."]},
              "items": [
                  {"ask": "How often should you brush your teeth?", "opts": [opt("twice a day", True), opt("once a week", False), opt("only after sweets", False)], "why": "The card says twice a day: morning and before bed."},
                  {"ask": "How long should you brush for?", "opts": [opt("two minutes", True), opt("ten seconds", False), opt("half an hour", False)], "why": "Two minutes, all the way to the molars."},
                  {"ask": "What makes holes in teeth?", "opts": [opt("germs fed by sugary drinks and sweets", True), opt("brushing", False), opt("water", False)], "why": "Sugar feeds the germs that make holes."},
                  {"ask": "Why do adult teeth matter so much?", "opts": [opt("They have to last your whole life", True), opt("They fall out every year", False), opt("They are made of sugar", False)], "why": "Adult teeth are the last set you get."},
              ]},
             "You found every answer in the card. That is using a secondary source."),

        step("demo", "Brush it right", "\U0001FAA5", "Good brushing", ["2Bs.02", "2TWSc.02"],
             "A toothbrush is a tool. Press <b>Next</b> to see how to use it properly.",
             explain(
                 ["A toothbrush only works if you use it the right way."],
                 ["A pea of toothpaste.", "Small circles on the front teeth, the sides, and the tops of the molars.", "Two minutes.", "Spit, and do not rinse away the toothpaste."],
                 ["Children scrub hard and fast.", "Gentle circles clean better and do not hurt the gums."],
                 ["Press Next and then do the same tonight."]),
             {"frames": [
                 {"pic": "\U0001FAA5", "cap": "A pea-sized blob of toothpaste on the brush.", "say": "Squeeze a pea-sized blob of toothpaste onto the brush."},
                 {"pic": "\U0001F9B7", "cap": "Small <b>circles</b> on the front teeth, gently.", "say": "Brush the front teeth in small gentle circles."},
                 {"pic": "\U0001F504", "cap": "Then the <b>sides</b>, inside and out.", "say": "Then the sides of the teeth, inside and outside."},
                 {"pic": "\U0001F95C", "cap": "Then the <b>tops of the molars</b>, right at the back.", "say": "Then the tops of the molars right at the back, where food gets stuck."},
                 {"pic": "⏱️", "cap": "<b>Two minutes</b> in all. Spit; do not rinse.", "say": "Two minutes in all. Then spit out the toothpaste, and do not rinse, so the fluoride stays on your teeth."},
             ]},
             "A pea of paste, gentle circles, front, sides, backs, two minutes."),

        step("sort", "Healthy or not?", "\U0001F5C2️", "Healthy choices", ["2Bp.01", "2TWSc.01"],
             "To stay healthy a body needs good food, to be clean, and to move. Is this a <b>healthy habit</b>?",
             explain(
                 ["Three things keep a body healthy: what you eat, keeping clean, and moving every day."],
                 ["Fruit and vegetables: healthy.", "Sweets all day: not healthy.", "Washing hands before eating: healthy.", "Running about outside: healthy.", "Sitting still all day: not healthy."],
                 ["Children think healthy means never having a treat.", "A treat now and then is fine. Every day, all day, is not."],
                 ["Think: does this help the body, or not?"]),
             {"ask": "A healthy habit, or not?",
              "bins": [{"id": "yes", "label": "Healthy habit", "pic": "\U0001F4AA"}, {"id": "no", "label": "Not healthy", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F96C", "label": "eating vegetables", "bin": "yes", "why": "Vegetables and fruit give the body what it needs."},
                  {"pic": "\U0001F36C", "label": "sweets all day", "bin": "no", "why": "Sweets all day feed the germs on teeth and give the body nothing it needs."},
                  {"pic": "\U0001F9FC", "label": "washing hands before eating", "bin": "yes", "why": "Clean hands keep germs out of your mouth."},
                  {"pic": "\U0001F3C3", "label": "running and playing outside", "bin": "yes", "why": "Moving every day keeps your heart and muscles strong."},
                  {"pic": "\U0001F4FA", "label": "sitting still all day", "bin": "no", "why": "A body needs to move every day."},
                  {"pic": "\U0001F6CF️", "label": "a good night's sleep", "bin": "yes", "why": "Sleep is when the body mends and grows."},
                  {"pic": "\U0001F964", "label": "fizzy drinks every day", "bin": "no", "why": "Sugary drinks every day harm teeth and the body."},
                  {"pic": "\U0001F6BF", "label": "washing every day", "bin": "yes", "why": "Keeping clean washes germs away."},
                  {"pic": "\U0001F4A7", "label": "drinking water", "bin": "yes", "why": "Water is the best drink for a body."},
              ]},
             "Good food, keeping clean, and moving every day."),

        step("demo", "When you are ill", "\U0001F912", "Signs of illness", ["2Bp.02"],
             "Sometimes a body is ill. Press <b>Next</b> to learn the signs, and what to do.",
             explain(
                 ["Being ill means the body is not working as it should, often because germs have got in.", "There are signs you can see and feel."],
                 ["A hot forehead is a fever.", "A cough, a runny nose, a sore throat.", "Feeling tired and not hungry.", "A rash on the skin.", "A tummy ache."],
                 ["Children hide feeling ill because they do not want to miss out.", "Telling a grown-up early means you get better sooner."],
                 ["Press Next through the signs, and remember: tell a grown-up."]),
             {"frames": [
                 {"pic": "\U0001F912", "cap": "Being <b>ill</b> means your body is not working as it should.", "say": "Being ill means your body is not working as it should. Often germs have got in."},
                 {"pic": "\U0001F975", "cap": "A <b>fever</b>: hot forehead, feeling shivery.", "say": "A fever. Your forehead feels hot and you may feel shivery."},
                 {"pic": "\U0001F927", "cap": "A <b>cough</b>, a runny nose, a sore throat.", "say": "A cough, a runny nose or a sore throat."},
                 {"pic": "\U0001F634", "cap": "Feeling <b>very tired</b> and not hungry.", "say": "Feeling very tired, and not wanting to eat."},
                 {"pic": "\U0001F922", "cap": "A <b>tummy ache</b>, or being sick.", "say": "A tummy ache, or being sick."},
                 {"pic": "\U0001F469‍⚕️", "cap": "<b>Tell a grown-up.</b> Rest, drink water, and see a doctor if it does not get better.", "say": "If you notice these signs, tell a grown-up. Rest, drink water, and a doctor can help if it does not get better."},
             ]},
             "Fever, cough, tiredness, tummy ache: signs of illness. Tell a grown-up."),

        step("questions", "Health check", "✅", "Health check", ["2Bp.01", "2Bp.02", "2Bs.02"],
             "Which is the healthy choice? Tap the answer.",
             explain(
                 ["Now you know what keeps a body healthy and what illness looks like."],
                 ["If it asks about food, think fruit and vegetables.", "If it asks about germs, think washing.", "If it asks about signs, think fever, cough, tired."],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Your friend has a hot forehead and feels shivery. What is that a sign of?", "\U0001F975", "a fever, being ill", ["being healthy", "being hungry", "being cold outside"], "A hot forehead and shivers are a fever, a sign of illness."),
                 q("Before you eat, you should...", "\U0001F9FC", "wash your hands", ["run around", "eat sweets", "watch television"], "Washing hands keeps germs off your food."),
                 q("Which keeps your heart and muscles strong?", "\U0001F3C3", "moving and playing every day", ["sitting all day", "sweets", "staying up late"], "A body needs to move every day."),
                 q("How many times a day should you brush your teeth?", "\U0001FAA5", "two", ["zero", "once a week", "ten"], "Twice a day: morning and before bed."),
                 q("Which teeth grind food at the back of your mouth?", "\U0001F9B7", "molars", ["incisors", "canines", "the tongue"], "The wide molars at the back grind."),
                 q("You feel ill. What should you do first?", "\U0001F912", "tell a grown-up", ["hide it", "eat sweets", "run about"], "Telling a grown-up early means you get better sooner."),
             ]},
             "You know how to keep a body healthy, and what to do when it is not."),

        step("context", "Science that keeps us well", "\U0001FA7A", "Health science", ["2SIC.02", "2SIC.03"],
             "Science explains how the things that keep us healthy work, and some people make it their job. Tap each one.",
             explain(
                 ["Soap, toothpaste and medicine all work because of science, and doctors, dentists and nurses use that science every day."],
                 ["Soap grabs germs and dirt so water can wash them off.", "Toothpaste has fluoride, which makes teeth hard.",
                  "A dentist checks teeth for holes.", "A doctor works out what illness the signs point to."],
                 [],
                 ["Tap each one and hear the science inside it."]),
             {"items": [
                 {"pic": "\U0001F9FC", "label": "soap", "say": "Soap grabs hold of germs and grease so that water can wash them away. Water alone slides off."},
                 {"pic": "\U0001FAA5", "label": "toothpaste", "say": "Toothpaste has fluoride in it. Fluoride makes the outside of a tooth harder, so germs cannot make holes as easily."},
                 {"pic": "\U0001F9B7", "label": "dentist", "say": "A dentist looks at every tooth, finds holes early and mends them. Science is their job."},
                 {"pic": "\U0001F469‍⚕️", "label": "doctor", "say": "A doctor reads the signs, a fever, a cough, a rash, and works out what is wrong and how to help."},
             ], "need": 4,
              "then": {"ask": "Why does soap wash germs off better than water alone?",
                       "opts": [opt("Soap grabs the germs so water can carry them away", True), opt("Soap is warmer", False), opt("Soap smells nice", False)],
                       "why": "Soap holds on to germs and grease; water on its own slides off them."}},
             "Science explains how soap, toothpaste and medicine work."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Bs.02", "2Bp.01", "2Bp.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Teeth: incisors cut, canines tear, molars grind.", "Health: good food, keeping clean, moving.", "Illness: fever, cough, tired, tummy ache."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which teeth are flat and at the front, for cutting?", "\U0001F9B7", "incisors", ["molars", "canines", "wisdom teeth"], "Incisors are the flat front teeth that cut."),
                 q("Which teeth are pointed, for tearing?", "\U0001F9B7", "canines", ["incisors", "molars", "front teeth"], "Canines are the pointed teeth beside the incisors."),
                 q("How long should you brush your teeth for?", "⏱️", "two minutes", ["five seconds", "an hour", "as long as a sneeze"], "Two minutes, all the way to the back."),
                 q("What feeds the germs that make holes in teeth?", "\U0001F36C", "sugar", ["water", "vegetables", "toothpaste"], "Sugary sweets and drinks feed the germs."),
                 q("What are the three things a body needs to stay healthy?", "\U0001F4AA", "good food, keeping clean and moving", ["sweets, television and staying up late", "only sleep"], "Diet, hygiene and exercise."),
                 q("Which is a sign of illness?", "\U0001F912", "a fever and a cough", ["feeling full after dinner", "being tired after a race", "having clean hands"], "A fever and a cough are signs the body is ill."),
                 q("Why do your adult teeth matter so much?", "\U0001F9B7", "they have to last your whole life", ["they fall out soon", "they are softer"], "Adult teeth are the last set you get."),
                 q("Where did you find the answer 'brush for two minutes'?", "\U0001F4D6", "in the fact card, a secondary source", ["by doing an experiment", "by guessing"], "A fact card, a book or a poster is a secondary source."),
                 q("Why do molars have wide, bumpy tops?", "\U0001F9B7", "to grind and mash food into small pieces", ["to cut a bite off an apple", "to make the teeth look nice"], "A wide, bumpy top is good for grinding. The shape of each tooth suits its job."),
             ]},
             "That is the whole lesson finished. Look after those teeth."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Name the three kinds of teeth and what each is for.",
    "Say how to look after your teeth.",
    "Say what keeps a body healthy.",
    "Say what illness looks like and what to do.",
]

LESSON["warmup"] = [
    q("What do you use to clean your teeth?", "\U0001F9B7", "a toothbrush", ["a comb", "a spoon"], "A toothbrush and toothpaste clean your teeth."),
    q("Which is the healthier snack?", "❓", "an apple", ["a bag of sweets", "a fizzy drink"], "Fruit gives your body what it needs, and it is kinder to your teeth than sugar."),
]

LESSON["lecture"] = [
    part("\U0001F9B7", "Three kinds of teeth",
         "Open wide. At the front are incisors, for cutting. Beside them are canines, pointed, for tearing. At the back are molars, big and wide, with bumps, for grinding food."),
    part("\U0001FAA5", "Brushing",
         "Brush twice a day. A pea of paste. Small gentle circles. Front, sides, backs, and the tops of the molars. Two whole minutes."),
    part("\U0001F36C", "Sugar and teeth",
         "Sugar feeds the germs in your mouth, and they make holes in your teeth. Having sweets and fizzy drinks every day can cause holes. Water and fruit are kinder to teeth."),
    part("\U0001F3C3\U0001F3FE", "A healthy body",
         "A healthy body needs good food, water, sleep, washing, and moving every day. Run, play, climb. Then rest."),
    part("\U0001F912", "When you are ill",
         "Being ill means your body is not working as it should. A hot forehead, a cough, feeling very tired. Tell a grown-up, rest, drink water. Your body will mend."),
]

LESSON["words"] = [
    word("incisors", "\U0001F9B7", "The flat front teeth, for cutting food.",
         ["Incisors bite into an apple.", "You have eight incisors."]),
    word("canines", "\U0001F43A", "The pointed teeth beside the incisors, for tearing.",
         ["A dog has big canines.", "Canines tear food."]),
    word("molars", "\U0001F37D\uFE0F", "The big, wide teeth at the back, with bumps, for grinding.",
         ["Molars grind food small.", "Brush the tops of your molars."]),
    word("germs", "\U0001F9A0", "Tiny living things, too small to see, that can make you ill.",
         ["Wash your hands to get rid of germs.", "Germs make holes in teeth."]),
    word("healthy", "\U0001F34E", "Being well, and looking after your body.",
         ["Fruit is a healthy food.", "Playing outside keeps you healthy."]),
    word("illness", "\U0001F912", "Being ill. When your body is not working as it should.",
         ["A cold is an illness.", "Rest helps an illness get better."]),
    word("fever", "\U0001F321\uFE0F", "When your body gets too hot because you are ill.",
         ["A fever makes your forehead hot.", "Tell a grown-up if you have a fever."]),
]

LESSON["home"] = [
    home("The two-minute brush", "A toothbrush, toothpaste, a timer or a two-minute song",
         ["Put a pea of paste on the brush.",
          "Brush in small circles: front, sides, backs, tops. Keep going until the song ends.",
          "Do it morning and night for a week."],
         "Does two minutes feel longer than you thought?"),
    home("The egg and the fizzy drink", "Two boiled eggs still in their shells, a cup of fizzy drink, a cup of water, a grown-up",
         ["Put one egg in the fizzy drink and one in the water.",
          "Leave them overnight.",
          "Rinse them and compare the shells.",
          "Do not eat the eggs afterwards."],
         "Eggshell is a bit like the outside of a tooth. What has the fizzy drink done to it?"),
    home("Healthy day chart", "Paper and a pencil",
         ["Draw a chart with a row for each day of the week.",
          "Each day tick: fruit or vegetables, water, played outside, washed, slept well.",
          "Count the ticks at the end of the week."],
         "Which one was hardest to tick every day?"),
]
