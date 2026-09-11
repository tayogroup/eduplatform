# -*- coding: utf-8 -*-
"""Lesson 7 - Present It.

0838 Stage 3 Communication: 3Mi.01 present information about a given topic
clearly and with an appropriate structure; 3Ml.01 listen to others in class
discussions and respond with relevant ideas and questions. Research: 3Rq.01
construct own questions to aid understanding of a topic. The topic is saving
water at school, which the class investigated in Lesson 1 - now they
present what they found with a start, a middle and an end, listen to each
other's talks, and respond with ideas as well as questions.
"""
from _kit import explain, step, opt, q, tagged, slot, part, word, home

AMAL = {"name": "Amal", "pic": "\U0001F467\U0001F3FE"}
SAMI = {"name": "Sami", "pic": "\U0001F466\U0001F3FE"}
HANA = {"name": "Hana", "pic": "\U0001F467\U0001F3FF"}
SLOTS = [slot("start", "Start", "Say what your talk is about"), slot("middle", "Middle", "Give a fact you found"), slot("middle", "Middle", "Give another fact"), slot("end", "End", "Say what we should do, and finish")]

LESSON = {
    "slug": "present-it",
    "title": "Present It",
    "blurb": "A talk needs a start, a middle and an end. Build two talks with that structure, listen to three classmates present and respond with relevant ideas and questions, and construct questions to understand a talk better.",
    "steps": [
        step("demo", "Start, middle, end", "\U0001F3A4", "Structure spotter", ["3Mi.01"],
             "A talk is not a pile of facts. It has a shape. Press <b>Next</b> and hear one.",
             explain(
                 ["A clear talk has a start, a middle and an end.", "The start says what it is about. The middle gives the facts. The end says what we should do."],
                 ["Start: today I am going to tell you about water at our school.", "Middle: we use about four thousand litres a day.", "End: so turn the taps off tightly."],
                 ["Children start with a fact and never say what the talk is about.", "Say the topic first, so people know what they are listening to."],
                 ["Press Next and hear the three parts."]),
             {"frames": [
                 {"pic": "\U0001F3A4", "cap": "Amal is presenting what the class found out about <b>water at school</b>.", "say": "Amal is presenting what the class found out about water at school. Listen for the three parts."},
                 {"pic": "1️⃣", "cap": "<b>Start:</b> Today I am going to tell you how our school uses water, and how we can save it.", "say": "The start. Today I am going to tell you how our school uses water, and how we can save it. Now everybody knows what the talk is about.", "sound": "pop"},
                 {"pic": "2️⃣", "cap": "<b>Middle:</b> We use about four thousand litres a day. Most goes on toilets and hand washing. A dripping tap wastes twenty litres a day.", "say": "The middle. We use about four thousand litres a day. Most of it goes on the toilets and hand washing. A dripping tap wastes twenty litres a day. The facts, in order.", "sound": "pop"},
                 {"pic": "3️⃣", "cap": "<b>End:</b> So turn taps off tightly, and tell a teacher about drips. Thank you for listening.", "say": "The end. So turn taps off tightly, and tell a teacher about any drips. Thank you for listening. What we should do, and a finish.", "sound": "pop"},
                 {"pic": "\U0001F44F", "cap": "Start, middle, end. The class knew what it was about, learned the facts, and knows what to do.", "say": "Start, middle, end. The class knew what it was about, learned the facts, and knows what to do. That is a clear talk.", "sound": "tada"},
             ]},
             "A clear talk has a start, a middle and an end."),

        step("know", "Build a talk: saving water at school", "\U0001F6B0", "Water presenter", ["3Mi.01"],
             "Build your own talk about saving water at school. It needs a start, a middle and an end, in that order, and everything in it has to be about water at school.",
             explain(
                 ["Fill the start first, then the middle, then the end.", "A sentence can be about the topic and still be in the wrong part."],
                 ["Today I am going to tell you about water at our school: that is a start.", "A dripping tap wastes twenty litres: that is a middle fact.",
                  "So turn taps off tightly: that is an end."],
                 ["Children put the facts first and the topic last.", "Start with what the talk is about."],
                 ["Tap the sentence for the start, then the middle, then the end. Then press Give my talk."]),
             {"mode": "structured", "topic": "saving water at school", "tag": "water", "topicPic": "\U0001F6B0", "slots": SLOTS,
              "cards": [
                  dict(tagged("Today I am going to tell you how our school uses water, and how we can save it", "water", "1️⃣"), say="Today I am going to tell you how our school uses water, and how we can save it", part="start"),
                  dict(tagged("Our school uses about four thousand litres of water a day", "water", "\U0001F4A7"), say="Our school uses about four thousand litres of water a day", part="middle"),
                  dict(tagged("A dripping tap wastes twenty litres a day", "water", "\U0001F6B0"), say="A dripping tap wastes twenty litres a day", part="middle"),
                  dict(tagged("So turn the taps off tightly, and tell a teacher about drips. Thank you for listening", "water", "3️⃣"), say="So turn the taps off tightly, and tell a teacher about drips. Thank you for listening", part="end"),
                  dict(tagged("My cat is called Tiger", "pets", "\U0001F431"), say="My cat is called Tiger", aboutLabel="pets"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
              ]},
             "You built a talk about saving water with a start, a middle and an end."),

        step("listen", "Listen, then respond with an idea or a question", "\U0001F442", "Responder", ["3Ml.01"],
             "Three classmates present their talks. Listen to each, then respond with something RELEVANT: an idea, or a question, about what they said.",
             explain(
                 ["This year you respond with ideas as well as questions.", "Both have to be about what the person said."],
                 ["Sami says the drinking fountain drips all day.", "A relevant idea: put a sign on it saying press gently.", "A relevant question: how much does it waste?", "Do you like football? Not relevant."],
                 ["Children respond with what THEY want to say.", "Respond to what they SAID."],
                 ["Press Listen, hear it all, then tap a response."]),
             {"rounds": [
                 {"speaker": SAMI, "talk": ["I am going to tell you about the drinking fountain by the hall.", "It drips all day, even when nobody is using it.", "I counted forty drips in one minute.", "So I think it needs fixing, or a sign saying press gently."],
                  "topics": ["fountain", "drips", "sign"],
                  "opts": [tagged("You could ask the caretaker to fit a new washer; that stops drips.", "fountain"), tagged("Do you like football?", "football"), tagged("What is your favourite colour?", "colours")],
                  "why": "Sami talked about the dripping fountain, so an idea about fixing it is relevant.",
                  "reply": "A washer! I will ask him tomorrow."},
                 {"speaker": AMAL, "talk": ["My talk is about the taps in the Grade 3 toilets.", "Three of the six taps are left running after hand washing.", "We watched at playtime and it happened eleven times.", "We think a poster above the sinks would help."],
                  "topics": ["taps", "poster", "toilets"],
                  "opts": [tagged("How many times did it happen after lunch, when it is busiest?", "taps"), tagged("Can you swim?", "swimming"), tagged("What did you have for breakfast?", "breakfast")],
                  "why": "Amal talked about taps left running, so a question about when it happens most is relevant.",
                  "reply": "We did not count after lunch yet. That is a good next step."},
                 {"speaker": HANA, "talk": ["I am presenting about the water we use on the school garden.", "The garden gets two full watering cans every morning.", "But the rainwater tank by the shed is always full and nobody uses it.", "So we should water the garden from the rainwater tank."],
                  "topics": ["garden", "rainwater tank", "watering"],
                  "opts": [tagged("You could put a tap on the rainwater tank so the cans fill faster.", "rainwater tank"), tagged("What is your teddy called?", "toys"), tagged("Do you like maths?", "maths")],
                  "why": "Hana talked about the rainwater tank nobody uses, so an idea about using it is relevant.",
                  "reply": "A tap on the tank. Yes! Then the cans fill quickly."},
             ]},
             "Three talks heard, three relevant responses: ideas and questions about what was said."),

        step("askq", "Questions to understand a talk", "❓", "Understanding asker", ["3Rq.01", "3Ml.01"],
             "Sami said the fountain drips forty times a minute. Construct questions that would help you UNDERSTAND his talk better.",
             explain(
                 ["After a talk, construct your own questions to understand it more.", "Not any question: one that opens up what was said."],
                 [],
                 [],
                 ["Read the card, pick the word and the ending, press Ask it."]),
             {"topic": "Sami's talk about the fountain", "words": ["What", "Where", "Why", "How", "How much", "How many"],
              "ends": [
                  {"id": "waste", "t": "water does the fountain waste in a day?", "words": ["How much"], "asks": "the daily waste"},
                  {"id": "count", "t": "did you count the drips?", "words": ["How", "Why", "Where"], "asks": "the counting"},
                  {"id": "goes", "t": "does the dripping water go?", "words": ["Where"], "asks": "where the water goes"},
                  {"id": "fix", "t": "would it cost to fix the fountain?", "words": ["What", "How much"], "asks": "the cost of fixing"},
                  {"id": "children", "t": "children use the fountain each day?", "words": ["How many"], "asks": "how many use it"},
              ],
              "rounds": [
                  {"want": "the amount of water the fountain wastes in a whole day", "pic": "\U0001F4A7", "word": "How much", "end": "waste", "why": "How much asks for an amount. Forty drips a minute, all day, is a lot."},
                  {"want": "the way Sami counted the drips", "pic": "\U0001F522", "word": "How", "end": "count", "why": "How asks for the method. Did he use a timer?"},
                  {"want": "the place the dripping water goes", "pic": "\U0001F30A", "word": "Where", "end": "goes", "why": "Where asks for a place. Down the drain, wasted."},
                  {"want": "the number of children who use the fountain each day", "pic": "\U0001F9D2", "word": "How many", "end": "children", "why": "How many asks for a number."},
              ]},
             "Four questions of your own that open up Sami's talk."),

        step("know", "Build a talk: our park", "\U0001F3DE️", "Park presenter", ["3Mi.01"],
             "Another talk, another structure. Now give a talk about what the class found out about our park: start, middle, end.",
             explain(
                 ["The same three parts.", "Start with the topic, give the facts in the middle, finish with what we should do."],
                 [],
                 [],
                 ["Tap the start, then the middle, then the end. Then press Give my talk."]),
             {"mode": "structured", "topic": "our park", "tag": "park", "topicPic": "\U0001F3DE️", "slots": SLOTS,
              "cards": [
                  dict(tagged("Today I am going to tell you what we found out about Riverside Park", "park", "1️⃣"), say="Today I am going to tell you what we found out about Riverside Park", part="start"),
                  dict(tagged("We counted twelve dogs in the park in one afternoon, and nine were off the leash", "park", "\U0001F415"), say="We counted twelve dogs in the park in one afternoon, and nine were off the leash", part="middle"),
                  dict(tagged("Three duck nests were lost this year", "park", "\U0001F986"), say="Three duck nests were lost this year", part="middle"),
                  dict(tagged("So we think the park needs a fenced dog area away from the pond. Thank you for listening", "park", "3️⃣"), say="So we think the park needs a fenced dog area away from the pond. Thank you for listening", part="end"),
                  dict(tagged("I had toast for breakfast", "breakfast", "\U0001F35E"), say="I had toast for breakfast", aboutLabel="breakfast"),
                  dict(tagged("A bus has big wheels", "vehicles", "\U0001F68C"), say="A bus has big wheels", aboutLabel="buses"),
              ]},
             "A second talk with a start, a middle and an end."),

        step("sort", "Start, middle or end?", "\U0001F5C2️", "Structure sorter", ["3Mi.01"],
             "Here are sentences from talks. Which part of a talk does each belong in?",
             explain(
                 ["Start: what the talk is about.", "Middle: the facts.", "End: what we should do, and a finish."],
                 [],
                 [],
                 ["Read the sentence, then tap the part."]),
             {"ask": "Start, middle or end?",
              "bins": [{"id": "start", "label": "Start", "pic": "1️⃣"}, {"id": "middle", "label": "Middle", "pic": "2️⃣"}, {"id": "end", "label": "End", "pic": "3️⃣"}],
              "items": [
                  {"pic": "\U0001F3A4", "label": "Today I am going to tell you about the school garden.", "bin": "start", "why": "It says what the talk is about."},
                  {"pic": "\U0001F331", "label": "The garden gets two watering cans every morning.", "bin": "middle", "why": "A fact for the middle."},
                  {"pic": "✅", "label": "So we should water it from the rainwater tank. Thank you for listening.", "bin": "end", "why": "What we should do, and a finish."},
                  {"pic": "\U0001F3A4", "label": "My talk is about the taps in the Grade 3 toilets.", "bin": "start", "why": "It names the topic."},
                  {"pic": "\U0001F6B0", "label": "Three of the six taps are left running.", "bin": "middle", "why": "A fact for the middle."},
                  {"pic": "✅", "label": "So a poster above the sinks would help. Thank you.", "bin": "end", "why": "What to do, and a finish."},
              ]},
             "You know which part of a talk a sentence belongs in."),

        step("questions", "Presenting and responding", "\U0001F4AC", "Presenter judge", ["3Mi.01", "3Ml.01", "3Rq.01"],
             "Think about structure, responses and questions. Tap the answer.",
             explain(
                 ["A talk has a start, a middle and an end.", "A response is relevant when it is about what was said."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("What does the START of a talk do?", "1️⃣", "says what the talk is about", ["gives the facts", "says thank you"], "So people know what they are listening to."),
                 q("Sami said the fountain drips. Which response is relevant?", "\U0001F6B0", "You could ask the caretaker to fit a new washer.", ["Do you like football?", "What is your favourite colour?"], "It is an idea about what he said."),
                 q("Which sentence belongs at the END?", "3️⃣", "So turn the taps off tightly. Thank you for listening.", ["Today I am going to tell you about water.", "We use four thousand litres a day."], "What we should do, and a finish."),
                 q("After a talk, a question that helps you UNDERSTAND it is…", "❓", "How much water does the fountain waste in a day?", ["Do you like maths?", "What is your cat called?"], "It opens up what was said."),
             ]},
             "You can present with a structure, and respond with relevance."),

        step("quiz", "Show what you know", "⭐", "Star presenter", ["3Mi.01", "3Ml.01", "3Rq.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What are the three parts of a clear talk?", "\U0001F3A4", "start, middle, end", ["facts, facts, facts", "loud, quiet, loud", "hello, goodbye"], "Topic, facts, what to do."),
                 q("What goes in the MIDDLE of a talk?", "2️⃣", "the facts you found", ["what the talk is about", "thank you for listening", "a joke"], "We use four thousand litres a day: a middle fact."),
                 q("Amal said three taps are left running. Which response is a relevant QUESTION?", "\U0001F6B0", "How many times did it happen after lunch?", ["Can you swim?", "What did you have for breakfast?", "Do you like blue?"], "It asks more about what she said."),
                 q("Hana said the rainwater tank is never used. Which response is a relevant IDEA?", "\U0001F327️", "Put a tap on the rainwater tank so the cans fill faster.", ["What is your teddy called?", "Do you like maths?", "I like rain."], "An idea about what she said."),
                 q("Why say what the talk is about at the START?", "1️⃣", "so people know what they are listening to", ["because it is a rule", "to make it longer", "you should not"], "The start tells the listener the topic."),
                 q("Which sentence does NOT belong in a talk about our park?", "\U0001F35E", "I had toast for breakfast.", ["We counted twelve dogs.", "Three nests were lost.", "The park needs a fenced area."], "It is about breakfast."),
                 q("Which question word asks for an AMOUNT of water?", "\U0001F4A7", "How much", ["Where", "Who", "When"], "How much water does the fountain waste?"),
                 q("Responding to a talk means…", "\U0001F442", "an idea or a question about what was said", ["saying whatever you want", "clapping only", "changing the subject"], "Relevant means about what was said."),
             ]},
             "That is the whole lesson finished. You can present with a structure, and respond with relevant ideas and questions."),
    ],
}


LESSON["about"] = [
    "Build a talk with a start, a middle and an end.",
    "Say which part of a talk a sentence belongs in.",
    "Listen to a talk and respond with a relevant idea or question.",
    "Construct your own questions to understand a talk better.",
]

LESSON["lecture"] = [
    part("\U0001F3A4", "A talk has a shape",
         "A clear talk is not a pile of facts. It has a start, a middle and an end. The start says what it is about. The middle gives the facts. The end says what we should do, and finishes."),
    part("\U0001F6B0", "Amal's talk",
         "Today I am going to tell you how our school uses water. That is the start. We use about four thousand litres a day; a dripping tap wastes twenty. That is the middle. So turn the taps off tightly. That is the end."),
    part("\U0001F442", "Responding",
         "When a classmate presents, listen, then respond with something relevant: an idea about what they said, or a question about it. Sami's fountain drips: you could ask the caretaker for a new washer. That is an idea about his talk."),
    part("❓", "Questions to understand",
         "After a talk, construct your own questions to understand it better. How much water does the fountain waste in a day? Where does the water go? Questions that open up what was said."),
    part("\U0001F44F", "Clear and structured",
         "Start, middle, end. Everything about the topic. Listeners who respond with ideas and questions. That is a class presenting and discussing well."),
]

LESSON["words"] = [
    word("present", "\U0001F3A4", "To tell people about a topic, clearly and in order.",
         ["Amal presented her talk about water.", "I will present what I found out."], say="to present"),
    word("structure", "\U0001F3D7️", "The shape of a talk: start, middle, end.",
         ["A talk needs a structure.", "The structure helps listeners follow."]),
    word("start", "1️⃣", "The first part of a talk, which says what it is about.",
         ["Say the topic at the start.", "Her start was clear."]),
    word("respond", "\U0001F4AC", "To say something back after listening: an idea or a question.",
         ["Respond with a relevant idea.", "The class responded to Sami's talk."]),
    word("relevant", "✅", "About what was said, or about the topic.",
         ["A relevant question is about the talk.", "Keep your idea relevant."]),
    word("idea", "\U0001F4A1", "A suggestion about what could be done.",
         ["Your idea was a new washer.", "Respond with an idea."]),
]

LESSON["home"] = [
    home("A one-minute talk", "A grown-up to listen, and a topic you know about",
         ["Give a one-minute talk with a start, a middle and an end.",
          "Your grown-up says which part they are hearing as you go.",
          "Try it again with the parts in the wrong order and see how confusing it is."],
         "Did the start help your grown-up know what was coming?"),
    home("Respond to a talk", "A grown-up who tells you about their day for three sentences",
         ["Listen to all three sentences.",
          "Respond with one IDEA about what they said, and one QUESTION.",
          "Check both are about what they actually said."],
         "Which was easier to think of: the idea or the question?"),
    home("Questions to understand", "A grown-up and a short news story or a page of a book",
         ["Your grown-up reads it out.",
          "Construct three questions that would help you understand it better.",
          "Find out the answers together."],
         "Did your questions open up the story?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "how to ride a bike", "the names of the planets"],
    "changed": [
        {"before": "A talk is a list of facts.", "after": "A talk has a start, a middle and an end."},
        {"before": "Responding means saying what I want to say.", "after": "Responding means an idea or a question about what was said."},
        {"before": "I understand a talk when it is over.", "after": "My own questions after a talk help me understand it more."},
    ],
}

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("Which sentence would make a good start to a talk about bees?", "\U0001F41D", "Today I will tell you about bees.", ["So that is why we need bees.", "Thank you for listening."], "A start says what the talk is about. The others are endings."),
    q("Your friend gives a talk about her garden. Which question is relevant?", "\U0001F33B", "How often do you water it?", ["What did you have for breakfast?", "Is your bike fast?"], "A question about her garden is relevant to her talk."),
]
