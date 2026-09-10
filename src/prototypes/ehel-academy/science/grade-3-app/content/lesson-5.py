# -*- coding: utf-8 -*-
"""Lesson 5 - Inside Your Body.

0097 Stage 3: 3Bs.03 the brain, heart, lungs, stomach and intestine and what
each does; 3TWSm.01 diagrams and physical models; 3TWSm.02 make and use a
physical model; 3TWSm.03 draw a diagram; with 3SIC.02 and 3SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home

ORGANS = [
    {"id": "brain", "label": "brain", "say": "The brain, inside your head. It thinks, remembers, and tells every other part what to do."},
    {"id": "lungs", "label": "lungs", "say": "The lungs, two of them, in your chest. They take air in and push it out."},
    {"id": "heart", "label": "heart", "say": "The heart, between the lungs. It pumps blood round your whole body, all day and all night."},
    {"id": "stomach", "label": "stomach", "say": "The stomach. Food goes there after you swallow, and it is churned up and broken down."},
    {"id": "intestine", "label": "intestine", "say": "The intestine, a long coiled tube. It takes the goodness out of the food and into your blood."},
]

LESSON = {
    "slug": "inside-your-body",
    "title": "Inside Your Body",
    "blurb": "Find the brain, heart, lungs, stomach and intestine, say what each one does, draw a labelled diagram, and see how a bottle and a balloon can be a model of your lungs.",
    "steps": [
        step("label", "Find the organs", "\U0001FAC0", "Organ finder", ["3Bs.03"],
             "An organ is a part inside your body with a job. Tap the <b>%s</b>.",
             explain(
                 ["Inside you are organs. Each one has a job it does all day."],
                 ["The brain in your head.", "The lungs in your chest.", "The heart between the lungs.", "The stomach under the ribs.", "The intestine coiled up below it."],
                 ["Children put the heart on the far left.", "It is in the middle of the chest, tilted a little to the left."],
                 ["Listen for the organ, then tap it."]),
             {"figure": "organs", "ask": "Tap the %s.", "parts": ORGANS},
             "Brain, lungs, heart, stomach, intestine. Five organs."),

        step("explore", "What each organ does", "\U0001F9E0", "Organ jobs", ["3Bs.03"],
             "Tap each organ to hear its job.",
             explain(
                 ["Each organ has one main job, and your body needs all of them."],
                 ["Brain: thinks and controls.", "Lungs: breathe.", "Heart: pumps blood.", "Stomach: breaks food down.", "Intestine: takes the goodness out of food."],
                 ["Children think the stomach is the whole tummy.", "The stomach is one bag; the intestine is a long tube below it."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F9E0", "label": "brain", "sub": "thinks and controls", "say": "The brain thinks, remembers and feels. It sends messages down nerves to tell your muscles to move and your heart to beat."},
                 {"pic": "\U0001FAC1", "label": "lungs", "sub": "take in air", "say": "The lungs take in air when you breathe in. Your blood collects what it needs from the air, and you breathe the rest out."},
                 {"pic": "❤️", "label": "heart", "sub": "pumps blood", "say": "The heart is a pump. It squeezes about once a second, pushing blood round your body to carry food and air to every part."},
                 {"pic": "\U0001F372", "label": "stomach", "sub": "breaks down food", "say": "The stomach is a stretchy bag. Food lands in it, and it churns and mixes it with juices that break it down into mush."},
                 {"pic": "\U0001F300", "label": "intestine", "sub": "takes the goodness", "say": "The intestine is a long, coiled tube. As the mush moves along it, the goodness passes through its walls into your blood."},
             ], "need": 5,
              "then": {"ask": "Which organ pumps blood round the body?",
                       "opts": [opt("the heart", True), opt("the lungs", False), opt("the stomach", False)],
                       "why": "The heart is a pump. Feel it: put a hand on your chest."}},
             "Brain thinks, lungs breathe, heart pumps, stomach breaks down, intestine takes the goodness."),

        step("diagram", "Draw a diagram of the organs", "✏️", "Body diagram", ["3TWSm.03", "3Bs.03"],
             "Make a labelled diagram. Tap a label, then tap the organ it belongs to.",
             explain(
                 ["A diagram of the body shows where each organ is and names it."],
                 ["Tap the label brain, then tap the brain.", "Do the same for the lungs, the heart, the stomach and the intestine."],
                 ["Children mix up the stomach and the intestine.", "The stomach is the bag on the left of the picture. The intestine is the coiled tube below."],
                 ["Tap a label, then the organ."]),
             {"figure": "organs", "ask": "Tap a label, then tap where it goes.", "parts": ORGANS},
             "Five labels in five places. That is a diagram of the body."),

        step("demo", "A model of the lungs", "\U0001F388", "Lung model", ["3TWSm.02", "3TWSm.01"],
             "You can make a model of your lungs from a bottle and two balloons. Press <b>Next</b>.",
             explain(
                 ["A physical model is something you can make and touch that works like the real thing."],
                 ["The bottle is your chest.", "The balloon inside is a lung.", "The balloon across the bottom is the muscle under your lungs.", "Pull it down and the lung fills. Let go and it empties."],
                 ["Children think the model IS lungs.", "It is a model: it shows how they work and leaves the rest out."],
                 ["Press Next and watch the model breathe."]),
             {"frames": [
                 {"pic": "\U0001F9F4", "cap": "A plastic bottle with the bottom cut off. This is the <b>chest</b>.", "say": "Take a plastic bottle with the bottom cut off. That is the chest."},
                 {"pic": "\U0001F388", "cap": "A balloon hanging inside from the neck. This is a <b>lung</b>.", "say": "Hang a balloon inside, from the neck of the bottle. That is a lung."},
                 {"pic": "\U0001FA78", "cap": "Another balloon stretched across the bottom. This is the <b>breathing muscle</b>.", "say": "Stretch a second balloon across the open bottom. That is the big muscle under your lungs."},
                 {"pic": "⬇️", "cap": "Pull the bottom balloon down: the lung <b>fills with air</b>. Breathing in.", "say": "Pull the bottom balloon down. The lung inside fills with air. That is breathing in."},
                 {"pic": "⬆️", "cap": "Let go: the lung <b>empties</b>. Breathing out. That is a physical model.", "say": "Let go, and the lung empties. Breathing out. You made a physical model of your lungs: it works like the real thing and shows the idea clearly."},
             ]},
             "A bottle and two balloons: a physical model that breathes."),

        step("questions", "Organ check", "✅", "Organ check", ["3Bs.03", "3TWSm.01"],
             "Tap the answer.",
             explain(
                 ["Five organs and their jobs, and two kinds of model."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which organ thinks and remembers?", "\U0001F9E0", "the brain", ["the heart", "the stomach", "the lungs"], "The brain controls everything."),
                 q("Which organ takes in air?", "\U0001FAC1", "the lungs", ["the intestine", "the heart"], "Lungs breathe in and out."),
                 q("Food goes into a stretchy bag that churns it. Which organ?", "\U0001F372", "the stomach", ["the brain", "the lungs"], "The stomach breaks food down."),
                 q("Which organ is a long coiled tube?", "\U0001F300", "the intestine", ["the heart", "the brain"], "The intestine takes the goodness out."),
                 q("The bottle-and-balloon lungs are which kind of model?", "\U0001F388", "a physical model", ["a diagram", "not a model"], "You can make it and touch it."),
             ]},
             "You know your organs."),

        step("context", "Science that looks inside", "\U0001FA7A", "Body science", ["3SIC.02", "3SIC.03"],
             "Doctors use science to look at your organs without opening you up. Tap each one.",
             explain(
                 ["Science explains how the tools doctors use work."],
                 ["A stethoscope carries the sound of your heart and lungs to the doctor's ears.", "An X-ray shows your bones, and the shape of your lungs.", "A scanner can show every organ.", "A dentist, a nurse and a surgeon all use body science."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001FA7A", "label": "stethoscope", "say": "A stethoscope is a tube that carries sound. The doctor hears your heart beating and your lungs breathing through it."},
                 {"pic": "\U0001F9B4", "label": "X-ray", "say": "An X-ray is a special picture that shows your bones and the shape of your lungs, without opening you up."},
                 {"pic": "\U0001F468\U0001F3FE‍⚕️", "label": "doctor", "say": "A doctor knows where every organ is and what it does, so they know what is wrong when one is not working."},
                 {"pic": "\U0001F469\U0001F3FE‍⚕️", "label": "surgeon", "say": "A surgeon mends organs. They study diagrams and models for years before they ever touch a real one."},
             ], "need": 4,
              "then": {"ask": "How does a stethoscope help a doctor?",
                       "opts": [opt("It carries the sound of the heart and lungs to their ears", True), opt("It takes a picture", False), opt("It makes the heart beat", False)],
                       "why": "A stethoscope carries sound. Science explains how it works."}},
             "Doctors, surgeons and their tools all use body science."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Bs.03", "3TWSm.02", "3TWSm.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where is your brain?", "\U0001F9E0", "in your head", ["in your chest", "in your tummy"], "Inside the skull."),
                 q("What does the heart do?", "❤️", "pumps blood round the body", ["breathes", "thinks"], "A pump, once a second."),
                 q("Which organ is between the lungs?", "\U0001FAC1", "the heart", ["the stomach", "the brain"], "The heart sits between the two lungs."),
                 q("What happens to food in the stomach?", "\U0001F372", "it is churned and broken down", ["it is breathed out", "it goes to the brain"], "Mixed with juices into mush."),
                 q("Where does the goodness from food go into your blood?", "\U0001F300", "in the intestine", ["in the lungs", "in the brain"], "Through the walls of the long tube."),
                 q("In the lung model, what was the balloon inside the bottle?", "\U0001F388", "a lung", ["the heart", "the stomach"], "It filled and emptied like a lung."),
                 q("What is an organ?", "\U0001FAC0", "a part inside the body with a job", ["a bone", "a kind of food"], "Brain, heart, lungs, stomach, intestine."),
                 q("You put five labels on a body picture. What did you make?", "✏️", "a diagram", ["a physical model", "a photograph"], "Labels on a drawing."),
             ]},
             "That is the whole lesson finished. You know what is inside you."),
    ],
}

LESSON["about"] = [
    "Find the brain, heart, lungs, stomach and intestine.",
    "Say what each of the five organs does.",
    "Make a labelled diagram of the organs.",
    "Say how a bottle and two balloons are a physical model of the lungs.",
]

LESSON["lecture"] = [
    part("\U0001FAC0", "Organs",
         "Inside you are organs. An organ is a part of the body with a job. Today you will meet five: the brain, the lungs, the heart, the stomach and the intestine."),
    part("\U0001F9E0", "The brain and the lungs",
         "The brain, in your head, thinks and remembers and tells every other part what to do. The lungs, in your chest, take in air when you breathe in and push it out when you breathe out."),
    part("❤️", "The heart",
         "The heart sits between the lungs. It is a pump. About once a second it squeezes and pushes blood round your body, carrying food and air to every part. Put your hand on your chest and feel it."),
    part("\U0001F372", "The stomach and the intestine",
         "When you swallow, food goes to the stomach, a stretchy bag that churns it into mush. Then it moves into the intestine, a long coiled tube, where the goodness passes into your blood."),
    part("\U0001F388", "Models of the body",
         "Nobody can see inside you, so scientists use models. A diagram with labels shows where each organ is. A bottle with balloons shows how the lungs work. Today you will make both."),
]

LESSON["words"] = [
    word("organ", "\U0001FAC0", "A part inside the body that has a job.",
         ["The heart is an organ.", "Five organs, five jobs."]),
    word("brain", "\U0001F9E0", "The organ in your head that thinks, remembers and controls your body.",
         ["The brain sends messages to the muscles.", "Your brain is inside your skull."]),
    word("lungs", "\U0001FAC1", "The two organs in your chest that take in air.",
         ["The lungs fill when you breathe in.", "A stethoscope hears the lungs."]),
    word("heart", "❤️", "The organ that pumps blood round your body.",
         ["The heart beats about once a second.", "The heart is between the lungs."]),
    word("stomach", "\U0001F372", "The stretchy bag where food is churned and broken down.",
         ["Food goes to the stomach after you swallow.", "The stomach mixes food with juices."]),
    word("intestine", "\U0001F300", "The long coiled tube that takes the goodness out of food.",
         ["The intestine is coiled up below the stomach.", "Goodness passes through the intestine into the blood."]),
    word("pump", "\U0001F4A7", "Something that pushes a liquid along. The heart is a pump.",
         ["The heart pumps blood.", "A bicycle pump pushes air."]),
]

LESSON["home"] = [
    home("Feel your heart", "A clock with a seconds hand, a grown-up",
         ["Sit still and put two fingers on the side of your neck until you feel a beat.",
          "Count the beats for thirty seconds.",
          "Run on the spot for one minute, then count again."],
         "Faster after running: the heart pumps harder when your muscles need more."),
    home("Make the lung model", "A plastic bottle, two balloons, scissors, tape, a grown-up to cut",
         ["A grown-up cuts the bottom off the bottle.",
          "Hang one balloon inside from the neck and tape it. Stretch the other across the bottom and tape it.",
          "Pull the bottom balloon down, then let go."],
         "The inside balloon fills and empties. That is a physical model of a lung."),
    home("Draw a body diagram", "Big paper, a pencil, someone to lie down",
         ["Draw round a person lying on the paper.",
          "Draw the brain, lungs, heart, stomach and intestine where they go.",
          "Label each one with a line and a word."],
         "Is the heart in the middle of the chest? Is the intestine coiled below the stomach?"),
]
