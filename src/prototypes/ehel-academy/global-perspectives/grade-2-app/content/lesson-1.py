# -*- coding: utf-8 -*-
"""Lesson 1 - Sharp Questions.

0838 Stage 2 Research: 2Rq.01 ask focused questions about a given topic;
2Ri.01 locate relevant information in sources provided. The topic is our
playground and the problem the class has with it - it is crowded and the
football takes all the space - because a Stage 2 question is "focused on the
specific issue in the Challenge" (the framework's progression text), and a
source is read for the PART that answers a question, not for everything in it.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "sharp-questions",
    "title": "Sharp Questions",
    "blurb": "Our playground is crowded at playtime. Ask questions that are focused on that problem, then find the exact part of a picture and the exact sentence of a text that answers each one.",
    "steps": [
        step("demo", "A wide question, a sharp question", "\U0001F3AF", "Sharp asker", ["2Rq.01"],
             "The class has a problem to find out about. Press <b>Next</b> and hear two kinds of question.",
             explain(
                 ["A focused question asks about the exact thing you want to find out.", "A wide question asks about everything at once."],
                 ["The problem: the playground is crowded at playtime.", "What is a playground? That is wide. It does not help with the problem.",
                  "Where do the footballers play? That is focused. It is about the crowding."],
                 ["Children ask the first question about the topic that comes into their head.", "Ask about the PROBLEM, not the whole topic."],
                 ["Press Next and listen for the sharp one."]),
             {"frames": [
                 {"pic": "\U0001F3DF️", "cap": "The class problem: <b>the playground is crowded</b> at playtime.", "say": "The class problem: the playground is crowded at playtime. We want to find out why, and what could help."},
                 {"pic": "\U0001F466\U0001F3FE", "cap": "Sami asks: <b>what is a playground?</b> Hmm. That is a wide question.", "say": "Sami asks: what is a playground? Hmm. That is a wide question. Everybody already knows, and it is not about the crowding.", "sound": "boing"},
                 {"pic": "\U0001F467\U0001F3FE", "cap": "Amal asks: <b>where do the footballers play?</b> That is focused on the problem.", "say": "Amal asks: where do the footballers play? That is focused. It is about the crowding, and we can find out by looking.", "sound": "ding"},
                 {"pic": "\U0001F467\U0001F3FD", "cap": "Nora asks: <b>which part of the playground is fullest?</b> Focused again.", "say": "Nora asks: which part of the playground is fullest? Focused again. We can count and see.", "sound": "ding"},
                 {"pic": "\U0001F3AF", "cap": "A <b>focused</b> question is about the exact problem, and you can find the answer.", "say": "A focused question is about the exact problem, and you can find the answer by looking, asking or counting.", "sound": "tada"},
             ]},
             "Wide questions ask about everything. Focused questions ask about the exact problem."),

        step("explore", "What makes a question focused?", "\U0001F50D", "Focus finder", ["2Rq.01"],
             "A focused question has three things. Tap each one.",
             explain(
                 ["A focused question is about the topic, about the problem, and something you can actually find out."],
                 ["About our topic: the playground, not the moon.", "About the problem: the crowding, not the colour of the fence.",
                  "Findable: you can look, count or ask to answer it."],
                 [],
                 ["Tap all three, then answer the question."]),
             {"items": [
                 {"pic": "\U0001F3DF️", "label": "about our topic", "say": "About our topic. Our topic is the playground. A question about the moon is not about our topic."},
                 {"pic": "\U0001F6A8", "label": "about the problem", "say": "About the problem. The problem is the crowding. A question about the colour of the fence is about the playground, but not about the problem."},
                 {"pic": "\U0001F440", "label": "you can find it out", "say": "You can find it out. Where do the footballers play? Look and see. How many children are in the sand? Count them."},
             ], "need": 3,
              "then": {"ask": "Which question is focused on the crowding problem?",
                       "opts": [opt("Which part of the playground has the most children?", True), opt("What colour is the fence?", False), opt("Is the moon big?", False)],
                       "why": "It is about the playground, about the crowding, and you can count to find out."}},
             "About the topic, about the problem, and findable. That is a focused question."),

        step("askq", "Build a focused question", "❓", "Question builder", ["2Rq.01"],
             "The card says exactly what we want to find out about the crowded playground. Build the question, then press <b>Ask it</b>.",
             explain(
                 ["A focused question needs the right question word AND the ending that is about the problem."],
                 ["We want to know where the footballers play.", "Where, plus do the footballers play?",
                  "Not: what is football? That is wide."],
                 ["Children pick an ending they like instead of the one the card asks for.", "Read the card. It says exactly what we want to find out."],
                 ["Read the card, pick the word, pick the ending, press Ask it."]),
             {"topic": "our crowded playground", "words": ["What", "Where", "Who", "When", "Why", "How many"],
              "ends": [
                  {"id": "footplay", "t": "do the footballers play?", "words": ["Where", "When"], "asks": "the footballers' playing"},
                  {"id": "fullest", "t": "is the playground fullest?", "words": ["When", "Where"], "asks": "when or where it is fullest"},
                  {"id": "sand", "t": "children are in the sandpit?", "words": ["How many"], "asks": "how many are in the sandpit"},
                  {"id": "bench", "t": "sits on the bench?", "words": ["Who"], "asks": "who uses the bench"},
                  {"id": "crowd", "t": "does the corner get so crowded?", "words": ["Why"], "asks": "the reason the corner is crowded"},
                  {"id": "quiet", "t": "could we play in the quiet corner?", "words": ["What"], "asks": "what we could play in the quiet corner"},
              ],
              "rounds": [
                  {"want": "the place the footballers play", "pic": "⚽", "word": "Where", "end": "footplay", "why": "Where asks for a place. Now we can look and see."},
                  {"want": "the time the playground is fullest", "pic": "\U0001F552", "word": "When", "end": "fullest", "why": "When asks for a time. We can watch and see."},
                  {"want": "the number of children in the sandpit", "pic": "\U0001F3D6️", "word": "How many", "end": "sand", "why": "How many asks for a number. We can count."},
                  {"want": "the people who sit on the bench", "pic": "\U0001FA91", "word": "Who", "end": "bench", "why": "Who asks for people. We can look."},
                  {"want": "the reason the corner gets so crowded", "pic": "\U0001F6A8", "word": "Why", "end": "crowd", "why": "Why asks for a reason. We can ask the children there."},
                  {"want": "the games we could play in the quiet corner", "pic": "\U0001F9F9", "word": "What", "end": "quiet", "why": "What asks for a thing. We can ask the class."},
              ]},
             "Six focused questions about the crowded playground, each one findable."),

        step("sort", "Focused, or wide?", "\U0001F3AF", "Focus judge", ["2Rq.01"],
             "Our problem is the crowded playground. Is this question focused on it, or wide?",
             explain(
                 ["Focused is about the problem. Wide is about anything else."],
                 ["Which part is fullest at playtime? Focused.", "What is a playground? Wide.", "Do you like the colour of the slide? About the playground, but not about the crowding. Wide."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Focused on the crowding, or wide?",
              "bins": [{"id": "focus", "label": "Focused on the problem", "pic": "\U0001F3AF"}, {"id": "wide", "label": "Wide", "pic": "\U0001F30D"}],
              "items": [
                  {"pic": "\U0001F465", "label": "Which part of the playground is fullest?", "bin": "focus", "why": "It is about the crowding, and you can count."},
                  {"pic": "\U0001F3DF️", "label": "What is a playground?", "bin": "wide", "why": "Everybody knows, and it is not about the crowding."},
                  {"pic": "⚽", "label": "How much space does the football take?", "bin": "focus", "why": "The football space is part of the crowding problem."},
                  {"pic": "\U0001F3A8", "label": "What colour is the slide?", "bin": "wide", "why": "It is about the playground, but not about the crowding."},
                  {"pic": "\U0001F552", "label": "When is the playground quietest?", "bin": "focus", "why": "Knowing the quiet time helps with the crowding."},
                  {"pic": "\U0001F319", "label": "Is the moon far away?", "bin": "wide", "why": "It is not about the playground at all."},
              ]},
             "You can tell a focused question from a wide one."),

        step("source", "Find it in the picture", "\U0001F3DF️", "Picture finder", ["2Ri.01"],
             "This is our playground at playtime. Look at everything first. Then find the part of the picture that answers each question.",
             explain(
                 ["A picture is a source.", "At Stage 2 you do not just look at it: you find the PART that answers your question."],
                 ["Where do the footballers play? Find the football.", "Which part is empty? Find the quiet corner.",
                  "The answer is in one part of the picture, not the whole of it."],
                 ["Children tap the biggest thing.", "Read the question, then find the part that answers THAT."],
                 ["Tap five things to explore, then find the part for each question."]),
             {"scene": "playground", "need": 5, "caption": "Tap the things in the playground to see what each one tells us.",
              "spots": [
                  spot("ball", "the football game", "The football takes up the whole middle of the playground.", 160, 100, "⚽"),
                  spot("crowd", "the crowd by the slide", "Twelve children are waiting for one slide.", 80, 60, "\U0001F465"),
                  spot("sand", "the sandpit", "Only two children are in the sandpit.", 250, 190, "\U0001F3D6️"),
                  spot("corner", "the quiet corner", "The corner by the bench is empty. Nobody plays there.", 40, 200, "\U0001F9F9"),
                  spot("bench", "the bench", "Two teachers sit on the bench and watch.", 300, 130, "\U0001FA91"),
              ],
              "rounds": [
                  {"ask": "Where do the footballers play?", "about": "where the footballers play", "spot": "ball", "why": "The football is in the middle, and it takes all the space."},
                  {"ask": "Which part of the playground is fullest?", "about": "the fullest part", "spot": "crowd", "why": "Twelve children are waiting by the slide. That is the fullest part."},
                  {"ask": "Which part is empty?", "about": "the empty part", "spot": "corner", "why": "Nobody plays in the quiet corner. That is space we could use."},
                  {"ask": "How many children are in the sandpit?", "about": "how many are in the sandpit", "spot": "sand", "why": "Two. The sandpit has room for more."},
              ]},
             "You found the part of the picture that answers four focused questions."),

        step("text", "Find it in the text", "\U0001F4C4", "Text finder", ["2Ri.01"],
             "Teacher Yasmin wrote down the playground rules. Read them, then find the sentence that answers each question.",
             explain(
                 ["A text is a source too.", "You do not need to remember all of it. You find the sentence that answers your question."],
                 ["When can we use the field? Find the sentence about the field.", "Who may play football? Find the sentence about football."],
                 ["Children tap the first sentence.", "Read the question, then find the sentence about THAT."],
                 ["Press Read it to me, then tap the sentence that answers."]),
             {"title": "Our playground rules",
              "lines": [
                  "Playtime is from half past ten until eleven o'clock.",
                  "Football may only be played in the middle of the playground.",
                  "The field is open when the grass is dry.",
                  "Year 1 and Year 2 may use the sandpit and the quiet corner.",
                  "Ask a teacher on the bench if you need help.",
              ],
              "rounds": [
                  {"ask": "When is the field open?", "about": "when the field is open", "line": 2, "why": "The sentence about the field says: when the grass is dry."},
                  {"ask": "Where may football be played?", "about": "where football may be played", "line": 1, "why": "Football may only be played in the middle."},
                  {"ask": "Who may use the quiet corner?", "about": "who may use the quiet corner", "line": 3, "why": "Year 1 and Year 2 may use the sandpit and the quiet corner. That is us."},
                  {"ask": "What time does playtime start?", "about": "the time playtime starts", "line": 0, "why": "Half past ten. The first sentence tells us."},
              ]},
             "You found the sentence that answers four questions. That is locating information."),

        step("questions", "Sharp questions and where to find the answers", "\U0001F4AC", "Question judge", ["2Rq.01", "2Ri.01"],
             "Think about focused questions and finding answers. Tap the answer.",
             explain(
                 ["A focused question is about the exact problem.", "A source answers it in one part, not all of it."],
                 ["Think about Sami's wide question, Amal's sharp one, the picture and the rules."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Our problem is the crowded playground. Which question is focused on it?", "\U0001F3AF", "Which part of the playground is fullest?", ["What is a playground?", "What colour is the fence?"], "It is about the crowding, and you can count to find out."),
                 q("Where in the picture did we find where the footballers play?", "⚽", "in the middle, where the ball is", ["on the bench", "in the sandpit"], "The football was in the middle and took all the space."),
                 q("Which rule told us when the field is open?", "\U0001F33F", "The field is open when the grass is dry.", ["Playtime is from half past ten.", "Ask a teacher on the bench."], "The sentence about the field is the one that answers."),
                 q("A question you can answer by counting is…", "\U0001F522", "How many children are in the sandpit?", ["Is the moon far away?", "What is a playground?"], "Counting the children in the sandpit answers it."),
             ]},
             "You know what a focused question is, and where an answer lives in a source."),

        step("quiz", "Show what you know", "⭐", "Star researcher", ["2Rq.01", "2Ri.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the crowded playground, the question builder, the picture and the rules."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a focused question?", "\U0001F3AF", "a question about the exact problem, that you can find out", ["any question at all", "a question about the moon", "a very long question"], "About the topic, about the problem, and findable."),
                 q("Sami asked: what is a playground? Why was that wide?", "\U0001F466\U0001F3FE", "it was not about the crowding", ["it was too short", "it was about the sandpit", "it was rude"], "It asked about everything, not the problem."),
                 q("Which question word asks for a NUMBER?", "\U0001F522", "How many", ["Where", "Who", "Why"], "How many children are in the sandpit? A number."),
                 q("We wanted to know where the footballers play. Which part of the picture told us?", "⚽", "the football in the middle", ["the bench", "the quiet corner", "the sandpit"], "The football took the middle of the playground."),
                 q("Which part of the playground was EMPTY?", "\U0001F9F9", "the quiet corner", ["the slide", "the middle", "the bench"], "Nobody played in the quiet corner."),
                 q("Who may use the quiet corner, according to the rules?", "\U0001F4C4", "Year 1 and Year 2", ["only teachers", "nobody", "only footballers"], "The rule said Year 1 and Year 2 may use the sandpit and the quiet corner."),
                 q("When you read a text to answer a question, you look for…", "\U0001F50D", "the sentence that answers it", ["the longest sentence", "the first word", "a picture"], "One sentence answers. Find that one."),
                 q("Which of these is a focused question about our crowded playground?", "❓", "When is the playground quietest?", ["What colour is the slide?", "Is the moon big?", "What is a swing?"], "Knowing the quiet time helps with the crowding."),
             ]},
             "That is the whole lesson finished. You can ask sharp questions and find the answers."),
    ],
}


LESSON["about"] = [
    "Say what makes a question focused: about the topic, about the problem, and findable.",
    "Build a focused question about a problem.",
    "Find the part of a picture that answers a question.",
    "Find the sentence in a text that answers a question.",
]

LESSON["lecture"] = [
    part("\U0001F3DF️", "A problem to find out about",
         "Our playground is crowded at playtime. The class wants to find out why, and what could help. To find out, we ask questions. But not any questions."),
    part("\U0001F3AF", "Focused questions",
         "A focused question is about our topic, about the problem, and something we can find out. Where do the footballers play? Focused. What is a playground? Wide. Everybody knows, and it does not help."),
    part("❓", "Building one",
         "A focused question is a question word and an ending about the problem. Where, plus do the footballers play. How many, plus children are in the sandpit. Pick the word for the kind of answer you need."),
    part("\U0001F440", "Finding it in a picture",
         "A picture is a source. At Stage 2 you find the PART of the picture that answers your question. Where do the footballers play? Find the football. Which part is empty? Find the quiet corner."),
    part("\U0001F4C4", "Finding it in a text",
         "A text is a source too. You do not have to remember all of it. Read the question, then find the one sentence that answers it. When is the field open? The sentence about the field tells you."),
]

LESSON["words"] = [
    word("focused", "\U0001F3AF", "About the exact thing you want to find out.",
         ["A focused question is about the problem.", "Stay focused on the crowding."]),
    word("problem", "\U0001F6A8", "Something that is wrong and needs finding out about.",
         ["The crowded playground is our problem.", "Ask about the problem."]),
    word("source", "\U0001F4D6", "Somewhere you can find information: a picture, a text, a person.",
         ["The picture is a source.", "The rules are a source."]),
    word("locate", "\U0001F50D", "To find exactly where something is.",
         ["Locate the sentence that answers.", "We located the empty corner in the picture."]),
    word("information", "\U0001F4CB", "The facts a source tells you.",
         ["The rules gave us information.", "Find the information you need."]),
    word("answer", "\U0001F4A1", "What you find out when a question is asked.",
         ["The picture had the answer.", "One sentence held the answer."]),
]

LESSON["home"] = [
    home("Sharp questions at home", "A grown-up and a small problem at home",
         ["Pick a problem: the toys are everywhere, or breakfast takes too long.",
          "Ask three questions that are focused on that problem.",
          "Your grown-up says wide or focused for each one."],
         "Could each focused question be answered by looking, counting or asking?"),
    home("Find it in the picture", "A busy picture in a book, and a grown-up",
         ["Your grown-up asks a question about the picture.",
          "Point to the exact part of the picture that answers it.",
          "Swap over and ask them one."],
         "Was the answer in one part of the picture, or the whole picture?"),
    home("Find it in the text", "A leaflet, a menu or a notice, and a grown-up",
         ["Your grown-up asks a question the text can answer.",
          "Find the one sentence that answers it and read it out.",
          "Ask them a question back."],
         "Did you need to read all of it, or just find the right sentence?"),
]

LESSON["lookback"] = {
    "not": ["how to ride a bike", "the names of the planets", "how to bake bread"],
}
