# -*- coding: utf-8 -*-
"""Lesson 3 - My Body and My Senses.

0097 Stage 1: 1Bs.03 the major external parts of the body; 1Bs.02 the five
senses, what they detect and which body part; 1Bp.04 how humans are similar
to and different from each other; with 1TWSp.01, 1TWSc.01, 1TWSc.03,
1TWSc.05 and 1SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home

BODY_PARTS = [
    {"id": "head", "label": "head", "say": "Your head is at the top. Your brain is inside it."},
    {"id": "eyes", "label": "eyes", "say": "Two eyes, for seeing."},
    {"id": "ears", "label": "ears", "say": "Two ears, one on each side, for hearing."},
    {"id": "nose", "label": "nose", "say": "Your nose is in the middle of your face, for smelling and breathing."},
    {"id": "mouth", "label": "mouth", "say": "Your mouth, for eating, tasting and talking."},
    {"id": "arms", "label": "arms", "say": "Two arms. They bend at the elbow."},
    {"id": "hands", "label": "hands", "say": "Two hands, with five fingers each, for holding and touching."},
    {"id": "tummy", "label": "tummy", "say": "Your tummy is in the middle of your body."},
    {"id": "legs", "label": "legs", "say": "Two legs, for walking and running. They bend at the knee."},
    {"id": "feet", "label": "feet", "say": "Two feet, with five toes each, for standing on."},
]

LESSON = {
    "slug": "my-body-and-my-senses",
    "title": "My Body and My Senses",
    "blurb": "Name the parts of your body, find out what each of your five senses can tell you, and measure your friends in hand spans.",
    "steps": [
        step("label", "Tap the body part", "\U0001F9D2", "Body parts", ["1Bs.03"],
             "Find each part on the child. Tap the <b>%s</b>.",
             explain(
                 ["Your body has parts, and every part has a name."],
                 ["The head is at the top.", "The arms come out from the shoulders and the hands are at the end of them.",
                  "The legs are underneath, and the feet are at the end of the legs.", "On the face are the eyes, ears, nose and mouth."],
                 ["Children tap the hand when asked for the arm.", "The hand is only the end part, with the fingers. The arm is the long part."],
                 ["Listen for the part, find it on the picture, then tap it. Touch the same part on yourself too."]),
             {"figure": "body", "ask": "Tap the %s.", "parts": BODY_PARTS},
             "You found all ten parts. Now touch each one on yourself."),

        step("demo", "Move your body", "\U0001F483", "Wiggled it", ["1Bs.03"],
             "Press <b>Next</b> and do what the picture says. Really do it!",
             explain(
                 ["The best way to learn the parts of your body is to move them."],
                 ["When it says wave your hands, wave your hands.", "When it says stamp your feet, stamp them.",
                  "You will use your head, your arms, your hands, your legs and your feet."],
                 [],
                 ["Stand up if you can, press Next, and do each one."]),
             {"frames": [
                 {"pic": "\U0001F44B", "cap": "Wave your <b>hands</b> in the air!", "say": "Wave your hands in the air!"},
                 {"pic": "\U0001F9B6", "cap": "Stamp your <b>feet</b>: one, two, one, two.", "say": "Stamp your feet. One, two, one, two."},
                 {"pic": "\U0001F646", "cap": "Put your <b>arms</b> up over your <b>head</b>.", "say": "Put your arms up, high over your head."},
                 {"pic": "\U0001F9B5", "cap": "Bend your <b>legs</b> at the knees and jump!", "say": "Bend your legs at the knees, and jump!"},
                 {"pic": "\U0001F443", "cap": "Touch your <b>nose</b>, then your <b>ears</b>, then your <b>mouth</b>.", "say": "Touch your nose. Now your ears. Now your mouth."},
                 {"pic": "\U0001F44F", "cap": "Clap your <b>hands</b>. You know your body!", "say": "Clap your hands. You know your body!"},
             ]},
             "Head, arms, hands, legs, feet, nose, ears and mouth. You moved them all."),

        step("demo", "Five senses", "\U0001F440", "Five senses", ["1Bs.02"],
             "You have <b>five senses</b>. Each one uses a body part. Press <b>Next</b>.",
             explain(
                 ["A sense is a way your body finds out about the world.", "You have five, and each one uses a different part of you."],
                 ["Your eyes see.", "Your ears hear.", "Your nose smells.", "Your tongue tastes.", "Your skin feels, and it is all over your body, so your hands feel and so do your feet."],
                 ["Children think touch is only in the fingers.", "Skin covers your whole body. You can feel a stone with your foot."],
                 ["Press Next for each sense and touch the body part it uses."]),
             {"frames": [
                 {"pic": "\U0001F441️", "cap": "<b>Sight.</b> Your eyes see colours, shapes and light.", "say": "Sight. Your eyes see colours, shapes and light. Close them and it goes dark."},
                 {"pic": "\U0001F442", "cap": "<b>Hearing.</b> Your ears hear sounds, loud and quiet.", "say": "Hearing. Your ears hear sounds. Cover them and sounds go quiet."},
                 {"pic": "\U0001F443", "cap": "<b>Smell.</b> Your nose smells bread, smoke and flowers.", "say": "Smell. Your nose smells bread baking, smoke, and flowers."},
                 {"pic": "\U0001F445", "cap": "<b>Taste.</b> Your tongue tastes sweet, salty and sour.", "say": "Taste. Your tongue tastes sweet, salty and sour things."},
                 {"pic": "✋", "cap": "<b>Touch.</b> Your skin feels hot, cold, rough and smooth.", "say": "Touch. Your skin feels hot, cold, rough and smooth. Your skin is all over you."},
             ]},
             "Eyes, ears, nose, tongue, skin. Five senses."),

        step("questions", "Which sense is it?", "\U0001F9E0", "Sense detective", ["1Bs.02"],
             "Something is happening. Which body part tells you about it? Tap it.",
             explain(
                 ["Every sense detects something different, and each one uses its own body part."],
                 ["If you know bread is baking before you see it, that was your nose smelling.",
                  "If you hear a dog bark, that was your ears.", "If you feel the sand is hot, that was your skin, through your feet."],
                 ["Children answer with the thing, not the body part.", "The question asks which part of you told you."],
                 ["Read what is happening, then tap the body part that noticed it."]),
             {"label": "Question", "items": [
                 q("You know bread is baking before you see it. Which part told you?", "\U0001F35E", "nose", ["ears", "eyes", "tongue"], "Your nose smelled the bread. That is the sense of smell."),
                 q("A dog barks behind you. Which part told you?", "\U0001F415", "ears", ["eyes", "nose", "hands"], "Your ears heard it. That is hearing."),
                 q("The sand is hot under your feet. Which part told you?", "\U0001F3D6️", "skin", ["eyes", "ears", "nose"], "Your skin felt the heat. That is touch, and skin covers your feet too."),
                 q("You see a red bird in the tree. Which part told you?", "\U0001F426", "eyes", ["ears", "tongue", "nose"], "Your eyes saw the bird. That is sight."),
                 q("The lemon is sour! Which part told you?", "\U0001F34B", "tongue", ["ears", "eyes", "nose"], "Your tongue tasted it. That is taste."),
                 q("The blanket feels soft. Which part told you?", "\U0001F9F6", "skin", ["ears", "eyes", "tongue"], "Your skin felt it, through your hands. That is touch."),
                 q("Thunder rumbles far away. Which part told you?", "⛈️", "ears", ["tongue", "nose", "hands"], "Your ears heard the thunder."),
                 q("Smoke! Which sense warns you first, before you see the fire?", "\U0001F525", "smell, with your nose", ["taste, with your tongue", "touch, with your feet"], "Smell warns you of smoke. Senses keep us safe."),
             ]},
             "Your senses tell you about the world, and they keep you safe."),

        step("questions", "The feely bag", "\U0001F45C", "Feely bag", ["1Bs.02"],
             "Your hand is in the bag. You cannot see. What is inside? Tap it.",
             explain(
                 ["When you cannot see, your sense of touch can still tell you a lot."],
                 ["Your fingers feel whether a thing is hard or soft, rough or smooth, warm or cold, round or pointy.",
                  "Soft and furry: that is a woolly hat.", "Hard, cold and round: that is a marble."],
                 ["Children guess before feeling all the clues.", "Use every clue the fingers give."],
                 ["Read what your fingers feel, then tap what is in the bag."]),
             {"label": "Bag", "items": [
                 q("It feels soft and furry.", "\U0001F45C", "a woolly hat", ["a stone", "a spoon", "a cup"], "Soft and furry: a woolly hat. Your skin felt that."),
                 q("It feels hard, cold, small and round.", "\U0001F45C", "a marble", ["a sponge", "a banana", "a feather"], "Hard, cold and round: a marble."),
                 q("It feels rough and bumpy, like sandpaper.", "\U0001F45C", "a rock", ["a silk scarf", "an egg", "a balloon"], "Rough and bumpy: a rock. Smooth things have no bumps."),
                 q("It feels light, soft and tickly.", "\U0001F45C", "a feather", ["a brick", "a key", "a bottle"], "Light and tickly: a feather."),
                 q("It feels smooth, cold and hard, and it has a handle.", "\U0001F45C", "a metal spoon", ["a sock", "a leaf", "a pillow"], "Smooth, cold, hard, with a handle: a spoon."),
             ]},
             "Touch told you what was there, without your eyes."),

        step("explore", "Same and different", "\U0001F46B", "Same and different", ["1Bp.04"],
             "Look at the friends. Tap each one. What is the same about them? What is different?",
             explain(
                 ["All people are the same in some ways and different in others."],
                 ["Everybody here has two eyes, one nose, two arms and two legs.", "That is the same.",
                  "But one has curly hair and one has straight hair.", "One is taller.", "One wears glasses.", "Those are differences."],
                 ["Children think different means better or worse.", "It does not. It just means not the same."],
                 ["Tap each friend and listen for what is the same and what is different."]),
             {"items": [
                 {"pic": "\U0001F467\U0001F3FE", "label": "Amal", "say": "Amal has curly black hair and brown eyes. Two eyes, one nose, two hands, like most people."},
                 {"pic": "\U0001F466\U0001F3FD", "label": "Sami", "say": "Sami is the tallest. He has short hair and brown eyes. Two eyes, one nose, two hands, like most people."},
                 {"pic": "\U0001F467\U0001F3FB", "label": "Nora", "say": "Nora is the shortest and wears glasses. Two eyes, one nose, two hands, like most people."},
                 {"pic": "\U0001F466\U0001F3FF", "label": "Omar", "say": "Omar has a gap where a tooth fell out. Two eyes, one nose, two hands, like most people."},
             ], "need": 4,
              "then": {"ask": "What is the <b>same</b> about all four friends?",
                       "opts": [opt("They all have two eyes, one nose and two hands", True), opt("They are all the same height", False), opt("They all wear glasses", False)],
                       "why": "Most people have the same body parts. Height, hair and glasses are differences."}},
             "The same body parts, but nobody is exactly the same."),

        step("sort", "Everyone, or not everyone?", "\U0001F5C2️", "Sorted people", ["1Bp.04", "1TWSc.01"],
             "Does <b>everyone</b> have this, or only <b>some people</b>? Tap the right bin.",
             explain(
                 ["Some things are true of every person.", "Other things are true of some people and not others."],
                 ["Everyone has a nose.", "Only some people have curly hair.", "Everyone has skin.", "Only some people wear glasses."],
                 ["Children put brown eyes in Everyone because everyone they know has brown eyes.", "Some people have blue or green eyes."],
                 ["For each one ask: does every person in the world have this?"]),
             {"ask": "Everyone, or only some people?",
              "bins": [{"id": "all", "label": "Everyone", "pic": "\U0001F465"}, {"id": "some", "label": "Some people", "pic": "\U0001F9D1"}],
              "items": [
                  {"pic": "\U0001F443", "label": "a nose", "bin": "all", "why": "Every person has a nose."},
                  {"pic": "\U0001F9D1‍\U0001F9B1", "label": "curly hair", "bin": "some", "why": "Some people have curly hair, some straight."},
                  {"pic": "\U0001F464", "label": "a head", "bin": "all", "why": "Every person has a head."},
                  {"pic": "\U0001F453", "label": "glasses", "bin": "some", "why": "Only some people need glasses."},
                  {"pic": "\U0001F91A", "label": "skin", "bin": "all", "why": "Every person has skin, all over their body."},
                  {"pic": "\U0001F7EB", "label": "brown eyes", "bin": "some", "why": "Many people have brown eyes, but some have blue or green."},
                  {"pic": "\U0001F9B7", "label": "a missing tooth", "bin": "some", "why": "Only some children have a tooth missing right now."},
                  {"pic": "\U0001FAC0", "label": "a heart", "bin": "all", "why": "Every person has a heart, beating inside them."},
              ]},
             "Everyone shares some things. The details are different."),

        step("measure", "How tall? Measure in hands", "\U0001F590️", "Hand spans", ["1TWSc.03", "1Bp.04"],
             "Measure <b>%s</b> in hand spans. Press to lay down a hand each time.",
             explain(
                 ["You can measure how tall a friend is with your hands, one hand span at a time."],
                 ["Put a hand at the feet. That is one.", "Put the next hand just above it. Two.", "Keep going to the top of the head.",
                  "The number of hands is how tall they are, in hand spans."],
                 ["Children leave gaps between the hands, or overlap them.", "Each hand starts exactly where the last one ended."],
                 ["Measure all three friends, then say who is tallest."]),
             {"ask": "How tall is %s in hand spans? Lay down hands from feet to head.",
              "unit": {"name": "hand spans", "singular": "hand span", "pic": "\U0001F590️", "button": "Lay down a hand"},
              "objects": [
                  {"pic": "\U0001F467\U0001F3FE", "label": "Amal", "units": 5},
                  {"pic": "\U0001F466\U0001F3FD", "label": "Sami", "units": 6},
                  {"pic": "\U0001F467\U0001F3FB", "label": "Nora", "units": 4},
              ],
              "compare": {"ask": "Amal is 5 hands, Sami is 6 hands, Nora is 4 hands. Who is tallest?",
                          "opts": [opt("Sami", True), opt("Amal", False), opt("Nora", False)],
                          "why": "6 hands is the most, so Sami is the tallest."}},
             "You measured your friends in hand spans."),

        step("record", "Write down the heights", "\U0001F4DD", "Height table", ["1TWSc.05"],
             "Put each friend's height into the table. How tall was <b>%s</b>?",
             explain(
                 ["A measurement is only useful if you write it down.", "A table keeps every friend's height in one place."],
                 ["Amal was five hand spans.", "Sami was six.", "Nora was four.", "Tap each row and choose the right number."],
                 ["Children write the number they remember best for everybody.", "Each row needs its own number."],
                 ["Fill in all three rows."]),
             {"ask": "How tall was %s?",
              "columns": ["Friend", "Height in hand spans"],
              "rows": [
                  {"pic": "\U0001F467\U0001F3FE", "label": "Amal", "answer": "5", "why": "Amal measured 5 hand spans."},
                  {"pic": "\U0001F466\U0001F3FD", "label": "Sami", "answer": "6", "why": "Sami measured 6 hand spans."},
                  {"pic": "\U0001F467\U0001F3FB", "label": "Nora", "answer": "4", "why": "Nora measured 4 hand spans."},
              ],
              "choices": [{"id": "4", "t": "4 hands", "pic": "4️⃣"}, {"id": "5", "t": "5 hands", "pic": "5️⃣"}, {"id": "6", "t": "6 hands", "pic": "6️⃣"}]},
             "Three heights, written down in a table."),

        step("context", "How does that work?", "\U0001F453", "How it works", ["1SIC.02", "1Bs.02"],
             "Science explains how things we use every day work. Tap each one.",
             explain(
                 ["Lots of things we use are built to help our senses."],
                 ["Glasses bend the light so the eyes can see clearly.", "A hearing aid makes sounds louder for the ears.",
                  "A torch makes light so the eyes can see in the dark.", "Sun cream protects the skin from the sun."],
                 [],
                 ["Tap each one and hear which sense it helps."]),
             {"items": [
                 {"pic": "\U0001F453", "label": "glasses", "say": "Glasses bend the light before it reaches the eyes, so blurry things look sharp. They help the sense of sight."},
                 {"pic": "\U0001F9BB", "label": "hearing aid", "say": "A hearing aid makes sounds louder before they reach the ear. It helps the sense of hearing."},
                 {"pic": "\U0001F526", "label": "torch", "say": "A torch makes light. Eyes need light to see, so a torch helps you see in the dark."},
                 {"pic": "\U0001F9F4", "label": "sun cream", "say": "Sun cream sits on the skin and stops the sun burning it. It protects your skin, the part you touch with."},
             ], "need": 4,
              "then": {"ask": "Nora cannot read the board clearly. What helps her eyes?",
                       "opts": [opt("glasses", True), opt("a hearing aid", False), opt("sun cream", False)],
                       "why": "Glasses help the eyes see clearly."}},
             "Science explains how the things we use work."),

        step("ask", "Ask a question about your body", "❓", "Asked why", ["1TWSp.01"],
             "Tap a question you would like to ask about your body.",
             explain(
                 ["Scientists ask questions about themselves too."],
                 ["Why do we blink? How many times do we breathe in a minute? Why do fingers go wrinkly in the bath?",
                  "For a counting question, the way to find out is to count."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F9D2",
              "questions": ["How many times do I breathe in one minute?", "Why do my fingers go wrinkly in the bath?", "Why do I blink?"],
              "findOut": {"ask": "You want to know how many times you breathe in a minute. How could you find out?",
                          "opts": [opt("Count your breaths while a grown-up times one minute", True), opt("Guess a big number", False), opt("Ask your tummy", False)],
                          "why": "Counting and timing is measuring. Scientists measure to find out."}},
             "Ask, then count or watch. That is science."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Bs.02", "1Bs.03", "1Bp.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["If it asks about a sense, think which body part does that job.", "If it asks about people, think what everyone has."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which body part do we use to see?", "\U0001F441️", "eyes", ["ears", "nose", "hands"], "Eyes see. That is the sense of sight."),
                 q("Which body part do we use to hear?", "\U0001F442", "ears", ["eyes", "mouth", "feet"], "Ears hear. That is the sense of hearing."),
                 q("We smell a flower with our...", "\U0001F33A", "nose", ["ears", "hands", "feet"], "The nose smells."),
                 q("How many senses do we have?", "❓", "five", ["two", "ten", "one"], "Sight, hearing, smell, taste and touch. Five."),
                 q("We taste an orange with our...", "\U0001F34A", "tongue", ["ears", "eyes", "feet"], "The tongue tastes."),
                 q("Which is at the end of your leg?", "\U0001F9B6", "your foot", ["your hand", "your head", "your ear"], "Feet are at the end of the legs."),
                 q("What does every person have?", "\U0001F465", "a head and a body", ["curly hair", "glasses", "a missing tooth"], "Every person has a head and a body. Curly hair, glasses and a missing tooth are things only some people have."),
                 q("Sami is 6 hand spans tall and Nora is 4. Who is shorter?", "\U0001F590️", "Nora", ["Sami", "they are the same"], "4 is less than 6, so Nora is shorter."),
                 q("Why would it be hard to find the marble in the feely bag if you wore thick gloves?", "\U0001F9E4", "The gloves stop your skin feeling the shape", ["The gloves make your ears quiet", "The gloves make the marble melt"], "You feel with your skin. Thick gloves cover the skin on your hands, so you cannot feel the shape as well."),
             ]},
             "That is the whole lesson finished. You know your body and your senses."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Name the main parts of your body.",
    "Say what each of your five senses tells you.",
    "Say how people are the same and how they are different.",
    "Measure a friend in hand spans and write it in a table.",
]

LESSON["warmup"] = [
    q("Where is your nose?", "\U0001F443", "in the middle of your face", ["on your foot", "on your back"], "Your nose is in the middle of your face. You smell with it."),
    q("Do all your friends look exactly the same?", "\U0001F46B", "no, everyone is a bit different", ["yes, exactly the same"], "People are alike in lots of ways, and different in others."),
]

LESSON["lecture"] = [
    part("\U0001F9CD", "Parts of the body",
         "Head, arms, hands, tummy, legs, feet. Eyes, ears, nose, mouth. Most people have all these parts. Touch each one as I say it."),
    part("\U0001F440", "Five senses",
         "You have five senses. Eyes see. Ears hear. Your nose smells. Your tongue tastes. Your skin feels. Your senses tell you about the world."),
    part("\u26A0\uFE0F", "Senses keep you safe",
         "Your senses keep you safe. Your ears hear a car coming. Your nose smells smoke. Your skin feels that a cup is too hot, before it burns you."),
    part("\U0001F467\U0001F3FE", "Same and different",
         "Most people have two eyes. Some eyes are brown and some are green. Most people have hair. Some hair is curly and some is straight. We are alike, and we are different."),
    part("\u270B", "Measuring in hands",
         "Long ago, people measured with their hands and feet. You can too. A hand span is from your thumb to your little finger. Today you measure your friends in hand spans."),
]

LESSON["words"] = [
    word("senses", "\U0001F440", "The five ways your body finds out about the world: seeing, hearing, smelling, tasting and touching.",
         ["I use my senses to find my way.", "Which sense tells you the soup is hot?"]),
    word("sight", "\U0001F441\uFE0F", "Seeing, with your eyes.",
         ["Sight tells me the sky is blue.", "Glasses help some people's sight."]),
    word("hearing", "\U0001F442\U0001F3FE", "The sense that uses your ears.",
         ["My hearing told me a car was coming.", "Cover your ears and your hearing goes quiet."]),
    word("smell", "\U0001F443\U0001F3FE", "The sense that uses your nose.",
         ["I can smell bread baking.", "Smell warns you of smoke."]),
    word("taste", "\U0001F445", "The sense that uses your tongue.",
         ["Lemons taste sour.", "My tongue tastes sweet, salty and sour things."]),
    word("touch", "\u270B\U0001F3FE", "The sense that uses your skin, to feel things.",
         ["Touch tells me the ice is cold.", "In the feely bag, only touch could help."]),
    word("hand span", "\u270B", "The distance from your thumb to your little finger, stretched wide.",
         ["Nora is four hand spans tall.", "We measured the table in hand spans."]),
]

LESSON["home"] = [
    home("The feely bag", "A bag or a pillowcase, and a few small things, like a spoon, a sponge, a key and a potato. Nothing sharp.",
         ["A grown-up puts the things in the bag without showing you. Nothing sharp.",
          "Put your hand in and feel one, without looking.",
          "Say what it is, then pull it out and check."],
         "Which sense told you? Touch. What tricked you?"),
    home("Measure your family in hands", "Your hand, a wall, a pencil, paper",
         ["Stand each person against the wall and mark their height with a pencil.",
          "Measure from the floor to the mark in your hand spans.",
          "Ask a grown-up to measure the same mark with their hand.",
          "Write each name and number in a table."],
         "Who is tallest? Why does a grown-up's hand span give a smaller number?"),
    home("Same and different survey", "Paper and a pencil, three people",
         ["Ask three people: what colour are your eyes? Is your hair curly or straight?",
          "Draw a table with a row for each person.",
          "Count what is the same and what is different."],
         "Most people have the same parts. The details are different."),
]
