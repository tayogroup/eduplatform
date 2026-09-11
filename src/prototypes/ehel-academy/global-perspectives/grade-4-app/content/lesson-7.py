# -*- coding: utf-8 -*-
"""Lesson 7 - Energy Talks.

0838 Stage 4 Communication: 4Mi.01 present information about a given topic
clearly and with an appropriate structure; 4Ml.01 listen to others in class
discussions and respond with relevant ideas and questions. Research: 4Rq.01
construct own questions to aid understanding of a topic. The topic is saving
energy at school, which the class investigated with a light-and-computer
count - now they present what they found with a start, a middle and an end,
listen to each other's talks, and respond with ideas as well as questions.
"""
from _kit import explain, step, opt, q, tagged, slot, part, word, home

AMAL = {"name": "Amal", "pic": "\U0001F467\U0001F3FE"}
SAMI = {"name": "Sami", "pic": "\U0001F466\U0001F3FE"}
HANA = {"name": "Hana", "pic": "\U0001F467\U0001F3FF"}
SLOTS = [slot("start", "Start", "Say what your talk is about"), slot("middle", "Middle", "Give a fact you found"), slot("middle", "Middle", "Give another fact"), slot("end", "End", "Say what we should do, and finish")]

LESSON = {
    "slug": "energy-talks",
    "title": "Energy Talks",
    "blurb": "A talk needs a start, a middle and an end. Build two talks with that structure, listen to three classmates present and respond with relevant ideas and questions, and construct questions to understand a talk better.",
    "steps": [
        step("demo", "Start, middle, end", "\U0001F3A4", "Structure spotter", ["4Mi.01"],
             "A talk is not a pile of facts. It has a shape. Press <b>Next</b> and hear one.",
             explain(
                 ["A clear talk has a start, a middle and an end.", "The start says what it is about. The middle gives the facts. The end says what we should do."],
                 ["Start: today I am going to tell you about energy at our school.", "Middle: fourteen empty rooms had their lights on at lunchtime.", "End: so switch off when you leave."],
                 ["Children start with a fact and never say what the talk is about.", "Say the topic first, so people know what they are listening to."],
                 ["Press Next and hear the three parts."]),
             {"frames": [
                 {"pic": "\U0001F3A4", "cap": "Amal is presenting what the class found out about <b>energy at school</b>.", "say": "Amal is presenting what the class found out about energy at school. Listen for the three parts."},
                 {"pic": "1️⃣", "cap": "<b>Start:</b> Today I am going to tell you how our school uses energy, and how we can save it.", "say": "The start. Today I am going to tell you how our school uses energy, and how we can save it. Now everybody knows what the talk is about.", "sound": "pop"},
                 {"pic": "2️⃣", "cap": "<b>Middle:</b> At lunchtime fourteen empty rooms had their lights on. Nine computers were left on all night.", "say": "The middle. At lunchtime on Tuesday, fourteen empty rooms had their lights on. Nine computers were left on all night. The facts, in order.", "sound": "pop"},
                 {"pic": "3️⃣", "cap": "<b>End:</b> So switch off the lights when you leave a room, and shut down your computer. Thank you for listening.", "say": "The end. So switch off the lights when you leave a room, and shut down your computer at the end of the day. Thank you for listening. What we should do, and a finish.", "sound": "pop"},
                 {"pic": "\U0001F44F", "cap": "Start, middle, end. The class knew what it was about, learned the facts, and knows what to do.", "say": "Start, middle, end. The class knew what it was about, learned the facts, and knows what to do. That is a clear talk.", "sound": "tada"},
             ]},
             "A clear talk has a start, a middle and an end."),

        step("know", "Build a talk: saving energy at school", "\U0001F4A1", "Energy presenter", ["4Mi.01"],
             "Build your own talk about saving energy at school. It needs a start, a middle and an end, in that order, and everything in it has to be about energy at school.",
             explain(
                 ["Fill the start first, then the middle, then the end.", "A sentence can be about the topic and still be in the wrong part."],
                 ["Today I am going to tell you about energy at our school: that is a start.", "Fourteen rooms had their lights on: that is a middle fact.",
                  "So switch off when you leave: that is an end."],
                 ["Children put the facts first and the topic last.", "Start with what the talk is about."],
                 ["Tap the sentence for the start, then the middle, then the end. Then press Give my talk."]),
             {"mode": "structured", "topic": "saving energy at school", "tag": "energy", "topicPic": "\U0001F4A1", "slots": SLOTS,
              "cards": [
                  dict(tagged("Today I am going to tell you how our school uses energy, and how we can save it", "energy", "1️⃣"), say="Today I am going to tell you how our school uses energy, and how we can save it", part="start"),
                  dict(tagged("At lunchtime on Tuesday, fourteen empty rooms had their lights on", "energy", "\U0001F4A1"), say="At lunchtime on Tuesday, fourteen empty rooms had their lights on", part="middle"),
                  dict(tagged("Nine computers were left on all night", "energy", "\U0001F4BB"), say="Nine computers were left on all night", part="middle"),
                  dict(tagged("So switch off the lights when you leave, and shut down your computer. Thank you for listening", "energy", "3️⃣"), say="So switch off the lights when you leave, and shut down your computer. Thank you for listening", part="end"),
                  dict(tagged("My hamster is called Biscuit", "pets", "\U0001F439"), say="My hamster is called Biscuit", aboutLabel="pets"),
                  dict(tagged("Whales are mammals", "animals", "\U0001F40B"), say="Whales are mammals", aboutLabel="animals"),
              ]},
             "You built a talk about saving energy with a start, a middle and an end."),

        step("listen", "Listen, then respond with an idea or a question", "\U0001F442", "Responder", ["4Ml.01"],
             "Three classmates present their talks. Listen to each, then respond with something RELEVANT: an idea, or a question, about what they said.",
             explain(
                 ["You respond with ideas as well as questions.", "Both have to be about what the person said."],
                 ["Sami says the hall lights are on all day.", "A relevant idea: a light monitor for each room.", "A relevant question: how many lights are in the hall?", "Do you like football? Not relevant."],
                 ["Children respond with what THEY want to say.", "Respond to what they SAID."],
                 ["Press Listen, hear it all, then tap a response."]),
             {"rounds": [
                 {"speaker": SAMI, "talk": ["I am going to tell you about the lights in the hall.", "They are on from eight in the morning until six at night.", "The hall is empty for four of those hours.", "So I think somebody should be in charge of switching them off."],
                  "topics": ["lights", "hall", "switching off"],
                  "opts": [tagged("You could have a light monitor for each room, with a badge.", "lights"), tagged("Do you like football?", "football"), tagged("What is your favourite colour?", "colours")],
                  "why": "Sami talked about the hall lights, so an idea about a light monitor is relevant.",
                  "reply": "A monitor with a badge! I will ask Teacher Yasmin."},
                 {"speaker": AMAL, "talk": ["My talk is about the air conditioning in the Grade 4 classroom.", "The air conditioners are on full, and three windows were open at the same time.", "We checked at nine, at eleven and at two.", "We think the windows should stay shut while the air conditioning is on."],
                  "topics": ["air conditioning", "windows", "air conditioners"],
                  "opts": [tagged("Were the same three windows open every time you checked?", "windows"), tagged("Can you swim?", "swimming"), tagged("What did you have for breakfast?", "breakfast")],
                  "why": "Amal talked about the open windows, so a question about whether they were the same ones is relevant.",
                  "reply": "Two of them were. That is a good next thing to find out."},
                 {"speaker": HANA, "talk": ["I am presenting about the printer in the office.", "It printed four hundred pages last week.", "Half of them were only printed on one side.", "So we should print on both sides to save paper and energy."],
                  "topics": ["printer", "paper", "both sides"],
                  "opts": [tagged("You could set the printer to print on both sides unless somebody changes it.", "printer"), tagged("What is your teddy called?", "toys"), tagged("Do you like maths?", "maths")],
                  "why": "Hana talked about the printer, so an idea about its settings is relevant.",
                  "reply": "Set it to both sides by default. Yes! Then nobody has to remember."},
             ]},
             "Three talks heard, three relevant responses: ideas and questions about what was said."),

        step("askq", "Questions to understand a talk", "❓", "Understanding asker", ["4Rq.01", "4Ml.01"],
             "Sami said the hall lights are on ten hours a day and the hall is empty for four. Construct questions that would help you UNDERSTAND his talk better.",
             explain(
                 ["After a talk, construct your own questions to understand it more.", "Not any question: one that opens up what was said."],
                 [],
                 [],
                 ["Read the card, pick the word and the ending, press Ask it."]),
             {"topic": "Sami's talk about the hall lights", "words": ["What", "Where", "Why", "How", "How much", "How many"],
              "ends": [
                  {"id": "cost", "t": "does it cost to light the hall for a day?", "words": ["How much", "What"], "asks": "the daily cost"},
                  {"id": "count", "t": "did you work out the hall was empty for four hours?", "words": ["How", "Why"], "asks": "the working out"},
                  {"id": "switch", "t": "is the switch for the hall lights?", "words": ["Where"], "asks": "where the switch is"},
                  {"id": "left", "t": "are they left on when the hall is empty?", "words": ["Why"], "asks": "the reason they stay on"},
                  {"id": "lights", "t": "lights are there in the hall?", "words": ["How many", "What"], "asks": "the lights in the hall"},
              ],
              "rounds": [
                  {"want": "the cost of lighting the hall for a whole day", "pic": "\U0001F4B0", "word": "How much", "end": "cost", "why": "How much asks for an amount of money."},
                  {"want": "the way Sami worked out the empty hours", "pic": "\U0001F552", "word": "How", "end": "count", "why": "How asks for the method. Did he check every hour?"},
                  {"want": "the place the hall light switch is", "pic": "\U0001F50C", "word": "Where", "end": "switch", "why": "Where asks for a place. A monitor would need to know."},
                  {"want": "the number of lights in the hall", "pic": "\U0001F4A1", "word": "How many", "end": "lights", "why": "How many asks for a number."},
              ]},
             "Four questions of your own that open up Sami's talk."),

        step("know", "Build a talk: our class museum", "\U0001F3DB️", "Museum presenter", ["4Mi.01"],
             "Another talk, another structure. Now give a talk about what the class made for the museum about the old town: start, middle, end.",
             explain(
                 ["The same three parts.", "Start with the topic, give the facts in the middle, finish with what we should do."],
                 [],
                 [],
                 ["Tap the start, then the middle, then the end. Then press Give my talk."]),
             {"mode": "structured", "topic": "our class museum", "tag": "museum", "topicPic": "\U0001F3DB️", "slots": SLOTS,
              "cards": [
                  dict(tagged("Today I am going to tell you about our class museum of the old town", "museum", "1️⃣"), say="Today I am going to tell you about our class museum of the old town", part="start"),
                  dict(tagged("We looked at letters from a hundred years ago and found the names of every shop on the high street", "museum", "\U0001F4DC"), say="We looked at letters from a hundred years ago and found the names of every shop on the high street", part="middle"),
                  dict(tagged("Sami built the old bridge from card, and it is glued to a base so it cannot tip", "museum", "\U0001F309"), say="Sami built the old bridge from card, and it is glued to a base so it cannot tip", part="middle"),
                  dict(tagged("So come and see it in the hall on Thursday, and bring your grandparents. Thank you for listening", "museum", "3️⃣"), say="So come and see it in the hall on Thursday, and bring your grandparents. Thank you for listening", part="end"),
                  dict(tagged("I had cereal for breakfast", "breakfast", "\U0001F963"), say="I had cereal for breakfast", aboutLabel="breakfast"),
                  dict(tagged("A bus has big wheels", "vehicles", "\U0001F68C"), say="A bus has big wheels", aboutLabel="buses"),
              ]},
             "A second talk with a start, a middle and an end."),

        step("sort", "Start, middle or end?", "\U0001F5C2️", "Structure sorter", ["4Mi.01"],
             "Here are sentences from talks. Which part of a talk does each belong in?",
             explain(
                 ["Start: what the talk is about.", "Middle: the facts.", "End: what we should do, and a finish."],
                 [],
                 [],
                 ["Read the sentence, then tap the part."]),
             {"ask": "Start, middle or end?",
              "bins": [{"id": "start", "label": "Start", "pic": "1️⃣"}, {"id": "middle", "label": "Middle", "pic": "2️⃣"}, {"id": "end", "label": "End", "pic": "3️⃣"}],
              "items": [
                  {"pic": "\U0001F3A4", "label": "Today I am going to tell you about the printer in the office.", "bin": "start", "why": "It says what the talk is about."},
                  {"pic": "\U0001F5A8️", "label": "It printed four hundred pages last week.", "bin": "middle", "why": "A fact for the middle."},
                  {"pic": "✅", "label": "So print on both sides. Thank you for listening.", "bin": "end", "why": "What we should do, and a finish."},
                  {"pic": "\U0001F3A4", "label": "My talk is about the air conditioning in the Grade 4 classroom.", "bin": "start", "why": "It names the topic."},
                  {"pic": "\U0001F32C\uFE0F", "label": "Three windows were open with the air conditioners on full.", "bin": "middle", "why": "A fact for the middle."},
                  {"pic": "✅", "label": "So keep the windows shut while the air conditioning is on. Thank you.", "bin": "end", "why": "What to do, and a finish."},
              ]},
             "You know which part of a talk a sentence belongs in."),

        step("questions", "Presenting and responding", "\U0001F4AC", "Presenter judge", ["4Mi.01", "4Ml.01", "4Rq.01"],
             "Think about structure, responses and questions. Tap the answer.",
             explain(
                 ["A talk has a start, a middle and an end.", "A response is relevant when it is about what was said."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("What does the START of a talk do?", "1️⃣", "says what the talk is about", ["gives the facts", "says thank you"], "So people know what they are listening to."),
                 q("Sami said the hall lights stay on. Which response is relevant?", "\U0001F4A1", "You could have a light monitor for each room.", ["Do you like football?", "What is your favourite colour?"], "It is an idea about what he said."),
                 q("Which sentence belongs at the END?", "3️⃣", "So switch off the lights when you leave. Thank you for listening.", ["Today I am going to tell you about energy.", "Nine computers were left on all night."], "What we should do, and a finish."),
                 q("After a talk, a question that helps you UNDERSTAND it is…", "❓", "How much does it cost to light the hall for a day?", ["Do you like maths?", "What is your hamster called?"], "It opens up what was said."),
             ]},
             "You can present with a structure, and respond with relevance."),

        step("quiz", "Show what you know", "⭐", "Star presenter", ["4Mi.01", "4Ml.01", "4Rq.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What are the three parts of a clear talk?", "\U0001F3A4", "start, middle, end", ["facts, facts, facts", "loud, quiet, loud", "hello, goodbye"], "Topic, facts, what to do."),
                 q("What goes in the MIDDLE of a talk?", "2️⃣", "the facts you found", ["what the talk is about", "thank you for listening", "a joke"], "Fourteen rooms had their lights on: a middle fact."),
                 q("Amal said three windows were open with the air conditioning on. Which response is a relevant QUESTION?", "\U0001F32C\uFE0F", "Were the same three windows open every time?", ["Can you swim?", "What did you have for breakfast?", "Do you like blue?"], "It asks more about what she said."),
                 q("Hana said half the pages were printed on one side. Which response is a relevant IDEA?", "\U0001F5A8️", "Set the printer to both sides unless somebody changes it.", ["What is your teddy called?", "Do you like maths?", "I like paper."], "An idea about what she said."),
                 q("Why say what the talk is about at the START?", "1️⃣", "so people know what they are listening to", ["because it is a rule", "to make it longer", "you should not"], "The start tells the listener the topic."),
                 q("Which sentence does NOT belong in a talk about the class museum?", "\U0001F963", "I had cereal for breakfast.", ["We looked at letters from a hundred years ago.", "Sami built the old bridge.", "Come and see it on Thursday."], "It is about breakfast."),
                 q("Which question word asks for an AMOUNT of money?", "\U0001F4B0", "How much", ["Where", "Who", "When"], "How much does it cost to light the hall?"),
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
    part("\U0001F4A1", "Amal's talk",
         "Today I am going to tell you how our school uses energy. That is the start. Fourteen empty rooms had their lights on; nine computers were left on all night. That is the middle. So switch off when you leave. That is the end."),
    part("\U0001F442", "Responding",
         "When a classmate presents, listen, then respond with something relevant: an idea about what they said, or a question about it. Sami's hall lights stay on: a light monitor for each room. That is an idea about his talk."),
    part("❓", "Questions to understand",
         "After a talk, construct your own questions to understand it better. How much does it cost to light the hall for a day? Where is the switch? Questions that open up what was said."),
    part("\U0001F44F", "Clear and structured",
         "Start, middle, end. Everything about the topic. Listeners who respond with ideas and questions. That is a class presenting and discussing well."),
]

LESSON["words"] = [
    word("present", "\U0001F3A4", "To tell people about a topic, clearly and in order.",
         ["Amal presented her talk about energy.", "I will present what I found out."], say="to present"),
    word("structure", "\U0001F3D7️", "The shape of a talk: start, middle, end.",
         ["A talk needs a structure.", "The structure helps listeners follow."]),
    word("energy", "\U0001F4A1", "What makes lights shine, computers run and fans turn.",
         ["Our school uses energy all day.", "Switching off saves energy."]),
    word("respond", "\U0001F4AC", "To say something back after listening: an idea or a question.",
         ["Respond with a relevant idea.", "The class responded to Sami's talk."]),
    word("relevant", "✅", "About what was said, or about the topic.",
         ["A relevant question is about the talk.", "Keep your idea relevant."]),
    word("monitor", "\U0001F3F7️", "A person in charge of checking one thing.",
         ["A light monitor switches the lights off.", "Sami wants a monitor for each room."]),
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
    home("Energy at home", "A grown-up and one evening",
         ["Count the lights on in empty rooms at eight o'clock.",
          "Construct three questions about energy at home that you cannot answer yet.",
          "Give a short talk about what you found: start, middle, end."],
         "What did your grown-up respond with: an idea or a question?"),
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
    q("Which sentence would make a good end to a talk about saving water?", "\U0001F4A7", "So let us all turn off the tap while we brush our teeth.", ["Today I will talk about water.", "First, where does our water come from?"], "An end sums up and says what to do. The others are starts."),
    q("Somebody says: the fan in our classroom is always on. Which response is relevant?", "\U0001F32C\ufe0f", "Could we turn it off when we go out?", ["I like mangoes.", "My shoes are new."], "It is about the fan, so it is relevant."),
]
