# -*- coding: utf-8 -*-
"""Lesson 1 - Our Own Questions.

0838 Stage 3 Research: 3Rq.01 construct own questions to aid understanding of
a topic; 3Ri.01 locate relevant information and answers to questions within
sources provided. The topic is water where we live: where it comes from,
where it goes and how much we use - a topic with real answers inside a text
and a picture, which is what a Stage 3 source is for.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "our-own-questions",
    "title": "Our Own Questions",
    "blurb": "Water comes out of the tap, but where from, and where does it go? Construct your own questions to understand it, then find the answers inside a text and a picture.",
    "steps": [
        step("demo", "Questions that help me understand", "\U0001F4A7", "Understanding asker", ["3Rq.01"],
             "Amal wants to UNDERSTAND water, not just know a fact about it. Press <b>Next</b> and hear the questions she makes.",
             explain(
                 ["This year you make your own questions, and the good ones help you understand the topic.",
                  "Understanding means knowing how it works, not just one fact."],
                 ["Where does our tap water come from? That helps you understand.",
                  "What happens to the water after we pull the plug? That helps too.",
                  "Is water wet? Everybody knows. It does not help."],
                 ["Children ask the easy question they can already answer.", "Ask the one you cannot answer yet, about how it works."],
                 ["Press Next and listen to Amal's questions."]),
             {"frames": [
                 {"pic": "\U0001F6B0", "cap": "Amal turns on the tap. Water comes out. But <b>from where?</b>", "say": "Amal turns on the tap. Water comes out. But from where? She does not know, and she wants to understand."},
                 {"pic": "❓", "cap": "She makes a question: <b>where does our tap water come from?</b>", "say": "She makes a question: where does our tap water come from? She cannot answer it yet, so it will help her understand.", "sound": "ding"},
                 {"pic": "\U0001F30A", "cap": "Then: <b>what happens to the water after we pull the plug?</b>", "say": "Then another: what happens to the water after we pull the plug? Another question she cannot answer yet.", "sound": "ding"},
                 {"pic": "\U0001F6C1", "cap": "And: <b>how much water does a bath use?</b> A number she can find out.", "say": "And: how much water does a bath use? A number she can find out.", "sound": "ding"},
                 {"pic": "\U0001F914", "cap": "Sami asks: <b>is water wet?</b> Everybody knows. That does not help you understand.", "say": "Sami asks: is water wet? Everybody already knows that. It does not help anybody understand water.", "sound": "boing"},
                 {"pic": "\U0001F4A1", "cap": "Your own question helps when you <b>cannot answer it yet</b> and it is about <b>how the topic works</b>.", "say": "Your own question helps when you cannot answer it yet, and it is about how the topic works.", "sound": "tada"},
             ]},
             "Make questions you cannot answer yet, about how the topic works."),

        step("explore", "Three kinds of own question", "\U0001F50D", "Question kinds", ["3Rq.01"],
             "Three kinds of question help you understand a topic. Tap each one.",
             explain(
                 ["Where-from questions, what-happens questions, and how-much questions.", "Each one opens up a different part of the topic."],
                 [],
                 [],
                 ["Tap all three, then answer."]),
             {"items": [
                 {"pic": "\U0001F4CD", "label": "where does it come from?", "say": "Where does it come from? Where does our tap water come from? A river, a lake, under the ground. That opens up the start of the story."},
                 {"pic": "➡️", "label": "what happens next?", "say": "What happens next? What happens to the water after we use it? Down the drain, to a cleaning works, back to the river. That opens up the end of the story."},
                 {"pic": "\U0001F522", "label": "how much, how many?", "say": "How much, how many? How much water does a bath use? A number you can measure or look up."},
             ], "need": 3,
              "then": {"ask": "Which of these questions helps you UNDERSTAND water?",
                       "opts": [opt("What happens to the water after we pull the plug?", True), opt("Is water wet?", False), opt("Do you like water?", False)],
                       "why": "You cannot answer it yet, and it is about how water works. That helps you understand."}},
             "Where from, what happens next, how much. Three kinds of question that open up a topic."),

        step("askq", "Make your own questions about water", "❓", "Question maker", ["3Rq.01"],
             "You want to understand something about water. Make the question that would help, then press <b>Ask it</b>.",
             explain(
                 ["You are making your own questions now.", "Pick the question word that asks for the thing you want to understand."],
                 ["You want to understand where tap water starts.", "Where, plus does our tap water come from?"],
                 [],
                 ["Read the card, pick the word and the ending, press Ask it."]),
             {"topic": "water where we live", "words": ["What", "Where", "Why", "How", "How much", "How many"],
              "ends": [
                  {"id": "from", "t": "does our tap water come from?", "words": ["Where"], "asks": "where the water starts"},
                  {"id": "after", "t": "happens to water after we use it?", "words": ["What"], "asks": "what happens after"},
                  {"id": "bath", "t": "water does a bath use?", "words": ["How much"], "asks": "the amount a bath uses"},
                  {"id": "clean", "t": "do they clean dirty water?", "words": ["How", "Why", "Where"], "asks": "the cleaning of water"},
                  {"id": "litres", "t": "litres does our school use in a day?", "words": ["How many"], "asks": "the school's daily litres"},
                  {"id": "winter", "t": "is the river higher in the rainy season?", "words": ["Why", "How much", "Where"], "asks": "the river in the rainy season"},
              ],
              "rounds": [
                  {"want": "where our tap water starts", "pic": "\U0001F6B0", "word": "Where", "end": "from", "why": "Where asks for the place it starts. A river, a lake, under the ground."},
                  {"want": "what becomes of water after we have used it", "pic": "\U0001F30A", "word": "What", "end": "after", "why": "What happens next opens up the end of the story."},
                  {"want": "the amount of water a bath uses", "pic": "\U0001F6C1", "word": "How much", "end": "bath", "why": "How much asks for an amount. About eighty litres."},
                  {"want": "the way dirty water is cleaned", "pic": "\U0001F9FC", "word": "How", "end": "clean", "why": "How asks for the way it is done."},
                  {"want": "the number of litres our school uses in a day", "pic": "\U0001F3EB", "word": "How many", "end": "litres", "why": "How many asks for a number you can count."},
                  {"want": "the reason the river is higher in the rainy season", "pic": "\U0001F327️", "word": "Why", "end": "winter", "why": "Why asks for a reason: more rain."},
              ]},
             "Six questions of your own about water, each one helping you understand a bit more."),

        step("sort", "Does it help me understand?", "\U0001F9E0", "Question judge", ["3Rq.01"],
             "Our topic is water where we live. Would this question help you UNDERSTAND it?",
             explain(
                 ["A question helps you understand when you cannot answer it yet and it is about how the topic works."],
                 ["Where does the water go after the plug? Helps.", "Is water wet? Everybody knows. Does not help.", "What is my favourite drink? About me, not about water where we live."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Would it help me understand water where we live?",
              "bins": [{"id": "yes", "label": "Helps me understand", "pic": "\U0001F9E0"}, {"id": "no", "label": "Does not help", "pic": "\U0001F937"}],
              "items": [
                  {"pic": "\U0001F30A", "label": "Where does the water go after I pull the plug?", "bin": "yes", "why": "You cannot answer it yet, and it is about how water works."},
                  {"pic": "\U0001F4A7", "label": "Is water wet?", "bin": "no", "why": "Everybody knows. It does not help you understand anything new."},
                  {"pic": "\U0001F3EB", "label": "How many litres does our school use in a day?", "bin": "yes", "why": "A number you can find out that tells you how much we use."},
                  {"pic": "\U0001F964", "label": "What is my favourite drink?", "bin": "no", "why": "It is about you, not about water where we live."},
                  {"pic": "\U0001F9FC", "label": "How is dirty water made clean again?", "bin": "yes", "why": "How it works, and you cannot answer it yet."},
                  {"pic": "\U0001F3A8", "label": "What colour is my water bottle?", "bin": "no", "why": "You already know, and it is not about how water works."},
              ]},
             "You can tell a question that helps you understand from one that does not."),

        step("text", "Find the answers in the text", "\U0001F4C4", "Answer finder", ["3Ri.01"],
             "Teacher Yasmin found a text about water where we live. Your questions have answers in it. Find the sentence that answers each one.",
             explain(
                 ["A source holds the answers to your questions, but not all in one place.", "Read the question, then find the sentence that answers it."],
                 ["Where does our tap water come from? Find the sentence about the river.",
                  "How much does a bath use? Find the sentence with the number."],
                 ["Children answer from what they think they know.", "The answer is IN the text. Find the sentence."],
                 ["Press Read it to me, then tap the sentence that answers."]),
             {"title": "Water where we live",
              "lines": [
                  "The water in our taps starts in the river outside the town.",
                  "At the water works it is cleaned, so it is safe to drink.",
                  "Pipes under the road carry it to every house and to our school.",
                  "A bath uses about eighty litres of water, and a shower about forty.",
                  "When we pull the plug, the water goes down a drain to a second works, where it is cleaned again.",
                  "Then it goes back into the river, and the river carries it to the sea.",
              ],
              "rounds": [
                  {"ask": "Where does our tap water come from?", "about": "where the water starts", "line": 0, "why": "It starts in the river outside the town. The first sentence tells us."},
                  {"ask": "How much water does a bath use?", "about": "how much a bath uses", "line": 3, "why": "About eighty litres. The sentence with the number."},
                  {"ask": "What happens to the water after we pull the plug?", "about": "what happens after the plug", "line": 4, "why": "Down a drain to a second works, where it is cleaned again."},
                  {"ask": "How does the water get to our school?", "about": "how the water reaches school", "line": 2, "why": "Pipes under the road carry it."},
                  {"ask": "Where does the river carry the water in the end?", "about": "where the river carries it", "line": 5, "why": "To the sea. The last sentence."},
              ]},
             "Five of your own questions, five answers found inside the text."),

        step("source", "Find it in the kitchen", "\U0001F373", "Kitchen finder", ["3Ri.01"],
             "A kitchen is a source about water too. Explore it, then find the part that answers each question.",
             explain(
                 ["A picture holds answers as well as a text.", "Look for the PART that answers your question."],
                 [],
                 [],
                 ["Tap five things, then find the part for each question."]),
             {"scene": "kitchen", "need": 5, "caption": "Tap the things in the kitchen to see what each one tells us about water.",
              "spots": [
                  spot("tap", "the tap", "The tap brings clean water from the pipes under the road.", 160, 130, "\U0001F6B0"),
                  spot("sink", "the sink and its plughole", "Used water goes down the plughole to the drain.", 100, 175, "\U0001F30A"),
                  spot("kettle", "the kettle", "The kettle heats water for tea. It holds about one and a half litres.", 250, 130, "☕"),
                  spot("bottle", "the water bottle", "In our town the water works makes tap water safe, so we can fill a bottle. Always ask a grown-up if your tap water is safe.", 60, 120, "\U0001F964"),
                  spot("plant", "the plant on the windowsill", "Plants need water too. This one gets a cup every day.", 160, 60, "\U0001F331"),
              ],
              "rounds": [
                  {"ask": "Where does the used water go?", "about": "where used water goes", "spot": "sink", "why": "Down the plughole to the drain."},
                  {"ask": "Where does clean water come INTO the kitchen?", "about": "where clean water comes in", "spot": "tap", "why": "Through the tap, from the pipes."},
                  {"ask": "Which thing shows we drink water from the tap?", "about": "that we drink water from the tap", "spot": "bottle", "why": "We fill a bottle from the tap and drink it. Always ask a grown-up if your tap water is safe."},
                  {"ask": "Which thing uses water that is not for people?", "about": "water for something other than people", "spot": "plant", "why": "The plant drinks a cup a day."},
              ]},
             "A picture answered four questions, one part each. That is locating information."),

        step("questions", "Questions and answers", "\U0001F4AC", "Question judge", ["3Rq.01", "3Ri.01"],
             "Think about your own questions and where the answers were. Tap the answer.",
             explain(
                 ["Make questions you cannot answer yet.", "Find the part of the source that answers each one."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("You want to understand how water reaches our taps. Which question helps?", "\U0001F9E0", "Where does our tap water come from?", ["Is water wet?", "What colour is my bottle?"], "You cannot answer it yet, and it is about how water works."),
                 q("Which sentence answered 'how much water does a bath use'?", "\U0001F6C1", "A bath uses about eighty litres of water.", ["The water starts in the river.", "Then it goes back into the river."], "The sentence with the number."),
                 q("Which part of the kitchen showed where used water goes?", "\U0001F30A", "the plughole in the sink", ["the kettle", "the plant"], "Down the plughole to the drain."),
                 q("When you look for an answer in a text, you…", "\U0001F50D", "find the sentence that answers your question", ["read every sentence twice", "guess from the title"], "One sentence answers. Locate it."),
             ]},
             "You make your own questions, and you find their answers."),

        step("quiz", "Show what you know", "⭐", "Star researcher", ["3Rq.01", "3Ri.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A question helps you understand a topic when…", "\U0001F9E0", "you cannot answer it yet and it is about how the topic works", ["everybody already knows the answer", "it is very short", "it is about you"], "Amal's questions were ones she could not answer yet."),
                 q("Where does our tap water start?", "\U0001F6B0", "in the river outside the town", ["in the kettle", "in the sea", "in the bath"], "The text said so, in its first sentence."),
                 q("Why is the water cleaned at the water works?", "\U0001F9FC", "so it is safe to drink", ["so it is warm", "so it is blue", "it is not cleaned"], "The second sentence: cleaned so it is safe to drink."),
                 q("What happens to water after we pull the plug?", "\U0001F30A", "it goes down a drain to a second works and is cleaned again", ["it disappears", "it goes straight to the tap", "it stays in the sink"], "The text told us: a drain, a second works, cleaned again."),
                 q("Which question word asks for a NUMBER of litres?", "\U0001F522", "How many", ["Where", "Why", "Who"], "How many litres does our school use in a day?"),
                 q("Sami asked if water is wet. Why did that not help?", "\U0001F914", "everybody already knew the answer", ["it was too long", "water is not wet", "it was rude"], "A question you can already answer does not help you understand."),
                 q("How does water get from the works to our school?", "\U0001F3EB", "through pipes under the road", ["in buckets", "by lorry", "it rains into the school"], "Pipes under the road carry it to every house and the school."),
                 q("Where in the kitchen does clean water come in?", "\U0001F6B0", "at the tap", ["at the plughole", "in the plant pot", "in the kettle"], "The tap brings clean water from the pipes."),
             ]},
             "That is the whole lesson finished. You make your own questions and find their answers in a source."),
    ],
}


LESSON["about"] = [
    "Make your own questions that help you understand a topic.",
    "Say why a question helps you understand: you cannot answer it yet, and it is about how the topic works.",
    "Find the sentence in a text that answers each of your questions.",
    "Find the part of a picture that answers a question.",
]

LESSON["lecture"] = [
    part("\U0001F4A7", "Amal and the tap",
         "Amal turns on the tap and water comes out. But from where? She does not know, and she wants to understand. So she makes her own questions."),
    part("❓", "Questions that help you understand",
         "Where does our tap water come from? What happens after we pull the plug? How much does a bath use? Each one Amal cannot answer yet, and each one is about how water works. Is water wet? Everybody knows. That one does not help."),
    part("\U0001F50D", "Three kinds",
         "Where does it come from, opens the start of the story. What happens next, opens the end. How much and how many, gives you a number. Three kinds of question that open up a topic."),
    part("\U0001F4C4", "The answers are in the source",
         "A text about water has the answers, but not all in one place. Read your question, then find the sentence that answers it. A bath uses about eighty litres: there it is, in the sentence with the number."),
    part("\U0001F373", "A picture answers too",
         "A kitchen is a source about water. The tap is where clean water comes in. The plughole is where used water goes. Find the part that answers your question."),
]

LESSON["words"] = [
    word("understand", "\U0001F9E0", "To know how something works, not just one fact about it.",
         ["I want to understand where water comes from.", "A good question helps you understand."]),
    word("construct", "\U0001F527", "To build or make something yourself.",
         ["Construct your own question.", "Amal constructed three questions."]),
    word("source", "\U0001F4D6", "Somewhere you can find information: a text, a picture, a person.",
         ["The text was our source.", "The kitchen was a source too."]),
    word("locate", "\U0001F50D", "To find exactly where something is.",
         ["Locate the sentence that answers.", "We located the plughole in the picture."]),
    word("litre", "\U0001F964", "A measure of how much water: a big bottle holds about one litre.",
         ["A bath uses eighty litres.", "The kettle holds one and a half litres."]),
    word("drain", "\U0001F30A", "The pipe that takes used water away.",
         ["Used water goes down the drain.", "The drain leads to the cleaning works."]),
]

LESSON["home"] = [
    home("Questions I cannot answer yet", "A grown-up and a topic at home: the fridge, the post, the bins",
         ["Make three questions about it that you cannot answer yet.",
          "Say which is a where-from, a what-happens or a how-much question.",
          "Ask your grown-up, or find out together."],
         "Did the answers help you understand how it works?"),
    home("Find the answer in the text", "A leaflet, a label or a page, and a grown-up",
         ["Your grown-up asks a question the text can answer.",
          "Find the one sentence that answers it and read it out.",
          "Ask them one that the text CANNOT answer, and say where you would look instead."],
         "Which sentence held the answer? Was it where you expected?"),
    home("Water at home", "A grown-up, a measuring jug and the kitchen",
         ["Find where clean water comes into your home.",
          "Find where used water goes out.",
          "Measure how much water fills the kettle."],
         "How many litres? Was it more or less than you guessed?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to ride a bike"],
    "changed": [
        {"before": "Water just comes from the tap.", "after": "Water starts in a river, is cleaned at the works, and comes through pipes."},
        {"before": "Any question about a topic is a good one.", "after": "The best questions are ones I cannot answer yet, about how the topic works."},
        {"before": "I had to read all of a text to find an answer.", "after": "I can find the one sentence that answers my question."},
    ],
}
