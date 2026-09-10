# -*- coding: utf-8 -*-
"""Lesson 3 - What We Know.

0838 Stage 1 Analysis: 1Ap.01 say something known about a topic.
Communication: 1Mi.01 answer questions with relevant information about a
given topic. The topic is keeping healthy - every five-year-old already
knows something about it, which is the point of Identifying perspectives at
this stage ("learners will share knowledge ... in order to understand that
people do not all know the same things"), and it gives questions whose
answers can be about the question or plainly about something else.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}

LESSON = {
    "slug": "what-we-know",
    "title": "What We Know",
    "blurb": "Everybody knows something. Put what you know about keeping healthy on the class board, say one thing out loud, and answer questions with the information that was actually asked for.",
    "steps": [
        step("demo", "Everybody knows something", "\U0001F4A1", "Everybody knows", ["1Ap.01"],
             "The class is talking about keeping healthy. Press <b>Next</b> and hear what each person knows.",
             explain(
                 ["When a class talks about a topic, everybody knows something about it.", "Not the same thing. Something."],
                 ["Amal knows you should wash your hands.", "Sami knows you need sleep.", "Nora knows fruit is good for you.",
                  "Put it all together and the class knows a lot."],
                 ["Children think they know nothing about a new topic.", "You always know something. Say it."],
                 ["Press Next and listen to each one."]),
             {"frames": [
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F3EB", "cap": "Teacher Yasmin says: <b>our topic is keeping healthy</b>. What do we know?", "say": "Teacher Yasmin says: our topic is keeping healthy. What do we know?"},
                 {"pic": "\U0001F467\U0001F3FE", "cap": "Amal: <b>I know you wash your hands before you eat.</b>", "say": "Amal says: I know you wash your hands before you eat.", "sound": "pop"},
                 {"pic": "\U0001F466\U0001F3FE", "cap": "Sami: <b>I know you need sleep every night.</b>", "say": "Sami says: I know you need sleep every night.", "sound": "pop"},
                 {"pic": "\U0001F467\U0001F3FD", "cap": "Nora: <b>I know fruit is good for you.</b>", "say": "Nora says: I know fruit is good for you.", "sound": "pop"},
                 {"pic": "\U0001F466\U0001F3FD", "cap": "Omar: <b>I know… that my cat is called Tiger.</b> Hmm. That is about cats!", "say": "Omar says: I know that my cat is called Tiger. Hmm. That is about cats, not about keeping healthy.", "sound": "boing"},
                 {"pic": "\U0001F4A1", "cap": "Everybody knew something. Together, the class knows <b>a lot</b>.", "say": "Everybody knew something about the topic. Together, the class knows a lot.", "sound": "tada"},
             ]},
             "Everybody knows something about a topic. Say what you know, and keep it about the topic."),

        step("know", "What do we know about keeping healthy?", "\U0001F34E", "Board builder", ["1Ap.01"],
             "Put things you know about <b>keeping healthy</b> on the board. Tap a card that is about our topic.",
             explain(
                 ["Saying what you know is a skill.", "The thing you say has to be ABOUT the topic."],
                 ["Our topic is keeping healthy.", "Washing your hands is about keeping healthy. On the board.",
                  "Lions live in Africa. That is true, but it is about animals. Not on this board."],
                 ["Children put on anything they know.", "True is not enough. It has to be about the topic."],
                 ["Tap four things about keeping healthy, then say one out loud."]),
             {"topic": "keeping healthy", "tag": "healthy", "topicPic": "\U0001F34E", "need": 4,
              "cards": [
                  dict(tagged("We wash our hands before we eat", "healthy", "\U0001F9FC"), say="We wash our hands before we eat"),
                  dict(tagged("Fruit and vegetables help us grow", "healthy", "\U0001F966"), say="Fruit and vegetables help us grow"),
                  dict(tagged("Running and playing makes our hearts strong", "healthy", "\U0001F3C3"), say="Running and playing makes our hearts strong"),
                  dict(tagged("We need sleep every night", "healthy", "\U0001F634"), say="We need sleep every night"),
                  dict(tagged("Brushing our teeth keeps them clean", "healthy", "\U0001FAA5"), say="Brushing our teeth keeps them clean"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
                  dict(tagged("A bus has big wheels", "vehicles", "\U0001F68C"), say="A bus has big wheels", aboutLabel="buses"),
                  dict(tagged("The sea is salty", "the sea", "\U0001F30A"), say="The sea is salty", aboutLabel="the sea"),
              ]},
             "You said what you know about keeping healthy, and you kept it about the topic."),

        step("answer", "Answer what was asked", "\U0001F5E3️", "Good answerer", ["1Mi.01"],
             "Teacher Yasmin asks a question. Every answer is true. Only one tells her what she asked. Tap it.",
             explain(
                 ["A good answer is ABOUT the question.", "It gives the information that was asked for."],
                 ["What do you eat to stay healthy? I eat fruit and vegetables. That answers it.",
                  "I go to bed at seven. That is true, but it is about bedtime, not food."],
                 ["Children say something true and think that is enough.", "Listen to what was ASKED, then answer that."],
                 ["Read the question, then find the answer that is about it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "What do you eat to stay healthy?", "about": "food", "pic": "\U0001F34E",
                   "opts": [tagged("I eat fruit and vegetables.", "food"), tagged("I go to bed at seven o'clock.", "bedtime"), tagged("My bike is red.", "bikes")],
                   "why": "She asked about food. Fruit and vegetables is about food."},
                  {"ask": "How do you keep your teeth clean?", "about": "teeth", "pic": "\U0001FAA5",
                   "opts": [tagged("I brush them in the morning and at night.", "teeth"), tagged("I like apples best.", "food"), tagged("I have a cat called Tiger.", "pets")],
                   "why": "She asked about teeth. Brushing them is about teeth."},
                  {"ask": "What do you do to keep your body strong?", "about": "exercise", "pic": "\U0001F3C3",
                   "opts": [tagged("I run and play outside every day.", "exercise"), tagged("My name is Amal.", "names"), tagged("The sky is blue today.", "the sky")],
                   "why": "She asked about keeping strong. Running and playing is exercise."},
                  {"ask": "When do you wash your hands?", "about": "washing hands", "pic": "\U0001F9FC",
                   "opts": [tagged("Before I eat, and after the toilet.", "washing hands"), tagged("I sleep in a bunk bed.", "sleep"), tagged("I like the colour green.", "colours")],
                   "why": "She asked when you wash your hands. Before eating and after the toilet answers it."},
                  {"ask": "Why do we drink water?", "about": "water", "pic": "\U0001F4A7",
                   "opts": [tagged("Because our bodies need water to work.", "water"), tagged("Because I have a blue cup.", "cups"), tagged("Because it is Monday.", "days")],
                   "why": "She asked why we drink water. Our bodies need it is the reason."},
              ]},
             "Five questions, five answers about the thing that was asked. That is good communicating."),

        step("sort", "About our topic?", "\U0001F3AF", "Topic keeper", ["1Ap.01"],
             "Is this about <b>keeping healthy</b>, or about something else?",
             explain(
                 ["Talking about a topic means staying ON the topic."],
                 ["Eating vegetables: about keeping healthy.", "A red car: about cars.", "Both are fine things to say. Only one belongs in this talk."],
                 ["Children think anything they like is on the topic.", "Ask: is it about keeping healthy?"],
                 ["Read it, then tap the bin."]),
             {"ask": "About keeping healthy, or something else?",
              "bins": [{"id": "on", "label": "About keeping healthy", "pic": "\U0001F34E"}, {"id": "off", "label": "About something else", "pic": "\U0001F937"}],
              "items": [
                  {"pic": "\U0001F966", "label": "eating vegetables", "bin": "on", "why": "Vegetables help us stay healthy. On the topic."},
                  {"pic": "\U0001F697", "label": "a red car", "bin": "off", "why": "A car is about cars, not about keeping healthy."},
                  {"pic": "\U0001F634", "label": "going to bed on time", "bin": "on", "why": "Sleep keeps us healthy. On the topic."},
                  {"pic": "\U0001F3B8", "label": "playing the guitar", "bin": "off", "why": "Music is lovely, but it is about music."},
                  {"pic": "\U0001F9FC", "label": "washing your hands", "bin": "on", "why": "Clean hands keep germs away. On the topic."},
                  {"pic": "\U0001F9F8", "label": "a teddy bear's name", "bin": "off", "why": "A teddy's name is about toys."},
              ]},
             "You kept the talk on the topic. That is what a good talker does."),

        step("explore", "Healthy helpers", "\U0001F4AA", "Healthy helpers", ["1Ap.01", "1Mi.01"],
             "Six things that help us stay healthy. Tap each one and hear why.",
             explain(
                 ["Now you know even more about the topic."],
                 ["Water, fruit, sleep, running, washing, and the doctor.", "Each one helps in its own way."],
                 [],
                 ["Tap all six, then answer the question."]),
             {"items": [
                 {"pic": "\U0001F4A7", "label": "water", "say": "Water. Our bodies need water to work. Drink some every day."},
                 {"pic": "\U0001F34E", "label": "fruit and vegetables", "say": "Fruit and vegetables. They help us grow and keep us well."},
                 {"pic": "\U0001F634", "label": "sleep", "say": "Sleep. Our bodies grow and rest while we sleep."},
                 {"pic": "\U0001F3C3", "label": "running and playing", "say": "Running and playing. It makes our hearts and legs strong."},
                 {"pic": "\U0001F9FC", "label": "washing", "say": "Washing. Clean hands keep germs away from our food."},
                 {"pic": "\U0001F469\U0001F3FE‍⚕️", "label": "the doctor", "say": "The doctor. A doctor checks we are growing well and helps us when we are ill."},
             ], "need": 6,
              "then": {"ask": "Sami asks: why do we need sleep? Which answer is ABOUT sleep?",
                       "opts": [opt("Our bodies grow and rest while we sleep", True), opt("I have a green toothbrush", False), opt("Water is wet", False)],
                       "why": "Sami asked about sleep. Growing and resting while we sleep is about sleep."}},
             "Six healthy helpers, and one more answer that was about the question."),

        step("questions", "Knowing and answering", "\U0001F4AC", "Knowing judge", ["1Ap.01", "1Mi.01"],
             "Think about the board and the questions. Tap the answer.",
             explain(
                 ["Say what you know. Keep it about the topic. Answer what was asked."],
                 ["Those are the three things this lesson is about."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Our topic is keeping healthy. Which of these belongs on the board?", "\U0001F34E", "We need sleep every night", ["A bus has big wheels", "The sea is salty"], "Sleep is about keeping healthy. The others are true, but about other things."),
                 q("Nora asks: what do you eat for breakfast? Which answer is about the question?", "\U0001F95E", "I eat porridge and a banana.", ["My shoes are new.", "I can hop."], "She asked about breakfast. Porridge and a banana is breakfast."),
                 q("Omar said his cat is called Tiger. Was that about keeping healthy?", "\U0001F431", "No, it was about cats", ["Yes, cats are healthy", "Yes, Tiger is a good name"], "It was true, but it was about cats. Not the topic."),
                 q("When everybody says what they know, the class…", "\U0001F4A1", "knows a lot together", ["gets confused", "knows nothing"], "Everybody knows something, and together that is a lot."),
             ]},
             "You know what belongs on the board, and what answers the question."),

        step("quiz", "Show what you know", "⭐", "Star talker", ["1Ap.01", "1Mi.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the board, Teacher Yasmin's questions and the healthy helpers."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What was our topic today?", "\U0001F3AF", "keeping healthy", ["cats", "buses", "the sea"], "Keeping healthy was the topic on the board."),
                 q("Which of these is ABOUT keeping healthy?", "\U0001F34E", "washing your hands before eating", ["a red car", "a teddy's name", "lions in Africa"], "Clean hands keep germs away. That is about keeping healthy."),
                 q("Teacher Yasmin asks what you eat to stay healthy. Which answer is about the question?", "\U0001F966", "I eat fruit and vegetables.", ["I go to bed at seven.", "My bike is red.", "It is Monday."], "She asked about food. Fruit and vegetables is food."),
                 q("A good answer is…", "\U0001F5E3️", "about the question that was asked", ["very long", "about your favourite thing", "always about cats"], "A good answer gives the information that was asked for."),
                 q("Why do we drink water?", "\U0001F4A7", "our bodies need it to work", ["because cups are blue", "because it is Monday", "we do not need to"], "Water keeps our bodies working."),
                 q("What does sleep do for us?", "\U0001F634", "our bodies grow and rest", ["it makes us hungry", "nothing", "it cleans our teeth"], "While we sleep, our bodies grow and rest."),
                 q("Sami asks how you keep your teeth clean. Which answer?", "\U0001FAA5", "I brush them morning and night.", ["I like apples best.", "I have a cat.", "I am five."], "He asked about teeth. Brushing is about teeth."),
                 q("Omar knows about cats. Amal knows about washing hands. Do they know the same things?", "\U0001F4A1", "No, people know different things", ["Yes, everybody knows the same", "Nobody knows anything"], "Different people know different things. Put them together and the class knows a lot."),
             ]},
             "That is the whole lesson finished. You know how to say what you know, and how to answer what was asked."),
    ],
}


LESSON["about"] = [
    "Say something you know about a topic.",
    "Keep what you say about the topic, not about something else.",
    "Answer a question with the information that was asked for.",
    "Say why water, fruit, sleep, exercise and washing keep us healthy.",
]

LESSON["lecture"] = [
    part("\U0001F4A1", "Everybody knows something",
         "When a class talks about a topic, everybody knows something about it. Amal knows about washing hands. Sami knows about sleep. Not the same thing, but something. Together, the class knows a lot."),
    part("\U0001F3AF", "Stay on the topic",
         "The thing you say has to be about the topic. Lions live in Africa is true, but it is about animals. If the topic is keeping healthy, say something about keeping healthy."),
    part("\U0001F5E3️", "Answer what was asked",
         "When somebody asks you a question, a good answer is about that question. What do you eat to stay healthy? Fruit and vegetables. Not: I go to bed at seven. That is true, but it is about bedtime."),
    part("\U0001F4AA", "Healthy helpers",
         "Water keeps our bodies working. Fruit and vegetables help us grow. Sleep lets us rest. Running makes our hearts strong. Washing keeps germs away. And the doctor checks we are well."),
    part("\U0001F469\U0001F3FE‍\U0001F3EB", "Saying it out loud",
         "Knowing something is good. Saying it out loud so the class can hear is better. That is how we share what we know."),
]

LESSON["words"] = [
    word("know", "\U0001F4A1", "To have something in your head that is true.",
         ["I know that fruit is good for me.", "What do you know about it?"]),
    word("fact", "✅", "Something that is true.",
         ["It is a fact that we need sleep.", "Put a fact on the board."]),
    word("topic", "\U0001F3AF", "The thing we are talking about.",
         ["Our topic is keeping healthy.", "Stay on the topic."]),
    word("healthy", "\U0001F34E", "Well and strong in your body.",
         ["Fruit helps you stay healthy.", "A healthy body can run and play."]),
    word("answer", "\U0001F5E3️", "What you say back when somebody asks a question.",
         ["Give an answer that is about the question.", "Amal's answer was about food."]),
    word("share", "\U0001F91D", "To let other people have or hear something of yours.",
         ["Share what you know with the class.", "We shared our facts on the board."]),
]

LESSON["home"] = [
    home("What do we know?", "Everyone at home, and a topic",
         ["Pick a topic: the sea, or birds, or bread.",
          "Everyone says one thing they know about it.",
          "If somebody says something about a different topic, laugh and say: that is about something else!"],
         "Did everyone know a different thing?"),
    home("Answer the question", "A grown-up",
         ["Your grown-up asks you a question: what did you do at school today?",
          "Answer with something that is really about it.",
          "Now you ask them a question, and listen to whether their answer is about it."],
         "Was every answer about the question?"),
    home("Healthy day", "Paper and crayons",
         ["Draw five things you did today that kept you healthy.",
          "Tell somebody what each one is.",
          "Say which one you know the most about."],
         "Which healthy helper did you forget? Add it tomorrow."),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "how to ride a bike", "the names of the planets"],
}
