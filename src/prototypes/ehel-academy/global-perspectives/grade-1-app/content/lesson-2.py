# -*- coding: utf-8 -*-
"""Lesson 2 - Find Out.

0838 Stage 1 Research: 1Rc.01 begin to participate in simple investigations
and ask basic questions to find information and opinions; 1Rf.01 record
information on a given topic in pictograms or simple graphic organisers.
Analysis: 1Ad.01 talk about information recorded in pictograms or graphic
organisers. The topic is how we get to school and what we play - two
questions a class can actually answer about itself, which is what a Stage 1
investigation is (the framework: "a whole-class survey and asking basic
questions to other class members").
"""
from _kit import explain, step, opt, q, part, word, home

CLASS = [
    ("amal", "Amal", "\U0001F467\U0001F3FE"), ("sami", "Sami", "\U0001F466\U0001F3FE"), ("nora", "Nora", "\U0001F467\U0001F3FD"),
    ("omar", "Omar", "\U0001F466\U0001F3FD"), ("hana", "Hana", "\U0001F467\U0001F3FF"), ("tariq", "Tariq", "\U0001F466\U0001F3FF"),
]


def people(answers):
    """Six classmates, each with an answer id and the words they say."""
    return [{"id": i, "name": n, "pic": p, "answer": a, "say": s} for (i, n, p), (a, s) in zip(CLASS, answers)]


LESSON = {
    "slug": "find-out",
    "title": "Find Out",
    "blurb": "The class wants to know how everyone gets to school. Do not guess: ask everyone, record each answer in a pictogram, and then talk about what the pictogram shows.",
    "steps": [
        step("demo", "Teacher Yasmin's big question", "\U0001F469\U0001F3FE‍\U0001F3EB", "The big question", ["1Rc.01"],
             "The class has a question about itself. Press <b>Next</b> and see how they find out.",
             explain(
                 ["When you want to know about a group of people, you ask every one of them.", "That is called an investigation."],
                 ["Teacher Yasmin asks: how does everyone get to school?", "Nobody knows the answer for the whole class.",
                  "So the class asks everyone, one at a time, and writes it down."],
                 ["Children think one loud voice is the answer for everyone.", "One person is one answer. You need them all."],
                 ["Press Next and count how many people get asked."]),
             {"frames": [
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F3EB", "cap": "Teacher Yasmin asks: <b>how does everyone get to school?</b>", "say": "Teacher Yasmin asks: how does everyone get to school?"},
                 {"pic": "\U0001F914", "cap": "Amal thinks: <b>I walk</b>. But does everyone?", "say": "Amal thinks: I walk. But does everyone?", "sound": "click"},
                 {"pic": "\U0001F5E3️", "cap": "We cannot guess. We <b>ask</b> everyone, one by one.", "say": "We cannot guess. We ask everyone, one by one.", "sound": "chatter"},
                 {"pic": "✏️", "cap": "We <b>record</b> each answer with a picture.", "say": "We record each answer with a picture, so we do not forget.", "sound": "pop"},
                 {"pic": "\U0001F4CA", "cap": "The pictures make a <b>pictogram</b>. Now we can see the answer!", "say": "The pictures make a pictogram. Now we can see the answer for the whole class.", "sound": "tada"},
             ]},
             "Ask everyone, record each answer, look at the pictogram. That is finding out."),

        step("explore", "Ways to find out", "\U0001F50D", "Finder outer", ["1Rc.01"],
             "There are lots of ways to find things out. Tap each one.",
             explain(
                 ["Different questions need different ways of finding out."],
                 ["To know about the people in our class, we ask them.", "To know how many cars go past, we look and count.",
                  "To know about dinosaurs, we look in a book.", "To know about long ago, we ask a grown-up."],
                 ["Children think a book knows about our class.", "No book knows how Sami gets to school. Only Sami does."],
                 ["Tap all four, then answer the question."]),
             {"items": [
                 {"pic": "\U0001F5E3️", "label": "ask people", "say": "Ask people. If you want to know about the people in your class, ask them. That is a survey."},
                 {"pic": "\U0001F440", "label": "look and count", "say": "Look and count. How many red cars go past? Stand and count them."},
                 {"pic": "\U0001F4D6", "label": "look in a book", "say": "Look in a book. A book about dinosaurs tells you about dinosaurs."},
                 {"pic": "\U0001F475\U0001F3FE", "label": "ask a grown-up", "say": "Ask a grown-up. Grandma knows what school was like long ago."},
             ], "need": 4,
              "then": {"ask": "We want to know how OUR class gets to school. What is the best way to find out?",
                       "opts": [opt("Ask everyone in the class", True), opt("Look in a book about buses", False), opt("Guess", False)],
                       "why": "Only the people in our class know how they get here. So we ask them."}},
             "Ask people, look and count, look in a book, ask a grown-up. Four ways to find out."),

        step("survey", "Ask the class: how do you get to school?", "\U0001F3EB", "Class survey", ["1Rc.01", "1Rf.01"],
             "Ask each classmate. Listen to the answer. Then record it in the pictogram.",
             explain(
                 ["A survey is asking everyone the same question and recording every answer."],
                 ["Press Ask Amal.", "Amal says: I walk with my mum.", "Tap Walk, then press Record it.",
                  "One more picture goes in the Walk row.", "Six classmates, six pictures."],
                 ["Children record their OWN answer.", "Record what the person SAID. That is their answer, not yours."],
                 ["Ask, listen, record. Six times."]),
             {"question": "How do you get to school?", "pic": "\U0001F3EB", "columns": ["How we get here", "How many"],
              "options": [{"id": "walk", "t": "Walk", "pic": "\U0001F6B6"}, {"id": "bus", "t": "Bus", "pic": "\U0001F68C"},
                          {"id": "car", "t": "Car", "pic": "\U0001F697"}, {"id": "bike", "t": "Bike", "pic": "\U0001F6B2"}],
              "people": people([
                  ("walk", "I walk with my mum."),
                  ("bus", "I come on the big bus."),
                  ("car", "My dad drives me in the car."),
                  ("walk", "I walk. My house is near."),
                  ("bike", "I ride my bike!"),
                  ("walk", "I walk with my big sister."),
              ])},
             "Six classmates asked, six answers recorded. The pictogram is full."),

        step("pictogram", "Talk about our pictogram", "\U0001F4CA", "Pictogram talker", ["1Ad.01"],
             "The pictogram shows what the class said. Look at it, then tap the answer.",
             explain(
                 ["A pictogram is a picture for every person, in rows.", "The longest row is the answer most people gave."],
                 ["Walk has three pictures.", "Bus has one. Car has one. Bike has one.", "So most of the class walks."],
                 ["Children answer from memory.", "Count the pictures. The answer is IN the pictogram."],
                 ["Read the question, count the row, tap the answer."]),
             {"fromSurvey": True, "title": "How we get to school",
              "items": [
                  {"ask": "How do MOST of the class get to school?", "check": {"kind": "most"},
                   "opts": [opt("Walk", True), opt("Bus", False), opt("Bike", False)], "why": "The Walk row has 3 pictures, more than any other row."},
                  {"ask": "How many children walk?", "check": {"kind": "count", "row": "Walk"},
                   "opts": [opt("3", True), opt("1", False), opt("6", False)], "why": "Count the pictures in the Walk row: three."},
                  {"ask": "Does anyone come by car?", "check": {"kind": "any", "row": "Car"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "The Car row has one picture. Nora comes by car."},
                  {"ask": "How many children ride a bike?", "check": {"kind": "count", "row": "Bike"},
                   "opts": [opt("1", True), opt("3", False), opt("0", False)], "why": "One picture in the Bike row: Hana."},
              ]},
             "Most, how many, did anyone. The pictogram told you all of it."),

        step("organiser", "Record it on a chart", "\U0001F4CB", "Chart maker", ["1Rf.01"],
             "Another way to record what we found: a chart with two sides. Put each classmate on the right side.",
             explain(
                 ["A chart is another way to record what you found out.", "This one has two sides: on foot, and on wheels."],
                 ["Amal walks. That is on foot.", "Sami's bus has wheels. That is on wheels.", "Every classmate goes on one side."],
                 ["Children put a bike on the foot side because you push with your feet.", "A bike has wheels. Wheels side."],
                 ["Read each one, tap the side."]),
             {"title": "How we get to school", "ask": "On foot, or on wheels?",
              "bins": [{"id": "foot", "label": "On foot", "pic": "\U0001F9B6"}, {"id": "wheels", "label": "On wheels", "pic": "\U0001F6DE"}],
              "items": [
                  {"pic": "\U0001F467\U0001F3FE", "label": "Amal walks", "bin": "foot", "why": "Walking is on foot."},
                  {"pic": "\U0001F68C", "label": "Sami's bus", "bin": "wheels", "why": "A bus has wheels."},
                  {"pic": "\U0001F697", "label": "Nora's car", "bin": "wheels", "why": "A car has wheels."},
                  {"pic": "\U0001F466\U0001F3FD", "label": "Omar walks", "bin": "foot", "why": "Walking is on foot."},
                  {"pic": "\U0001F6B2", "label": "Hana's bike", "bin": "wheels", "why": "A bike has two wheels."},
                  {"pic": "\U0001F466\U0001F3FF", "label": "Tariq walks", "bin": "foot", "why": "Walking is on foot."},
              ]},
             "Three on foot, three on wheels. The chart shows it in one look."),

        step("survey", "Ask again: what do you play at playtime?", "⚽", "Playtime survey", ["1Rc.01", "1Rf.01"],
             "A new question. Ask each classmate and record what they say.",
             explain(
                 ["You can ask the same people a new question and get a new pictogram."],
                 ["What do you play at playtime?", "Skipping, tag, football, or the sandpit.", "Ask, listen, record, six times."],
                 ["Children tap the game THEY like.", "It is the classmate's answer. Listen to it."],
                 ["Ask, listen, record."]),
             {"question": "What do you play at playtime?", "pic": "⚽", "columns": ["Game", "How many"],
              "options": [{"id": "skip", "t": "Skipping", "pic": "\U0001F9F5"}, {"id": "tag", "t": "Tag", "pic": "\U0001F3C3"},
                          {"id": "ball", "t": "Football", "pic": "⚽"}, {"id": "sand", "t": "Sandpit", "pic": "\U0001F3D6️"}],
              "people": people([
                  ("skip", "Skipping. I can do twenty!"),
                  ("tag", "Tag. I am the fastest."),
                  ("skip", "Skipping, with Amal."),
                  ("ball", "Football, every day."),
                  ("skip", "Skipping. I like the rhyme."),
                  ("tag", "Tag, with Sami."),
              ])},
             "A second survey, a second pictogram. Skipping is the favourite."),

        step("pictogram", "Talk about the playtime pictogram", "\U0001F9F5", "Pictogram reader", ["1Ad.01"],
             "What does this pictogram show? Look, then tap.",
             explain(
                 ["The same skill, a new pictogram.", "Count the pictures in each row."],
                 ["Skipping has three.", "Tag has two.", "Football has one.", "The sandpit has none at all."],
                 ["A row with no pictures still tells you something: nobody chose it."],
                 ["Count, then tap."]),
             {"fromSurvey": True, "title": "What we play at playtime",
              "items": [
                  {"ask": "Which game do MOST children play?", "check": {"kind": "most"},
                   "opts": [opt("Skipping", True), opt("Tag", False), opt("Football", False)], "why": "Skipping has 3 pictures, the longest row."},
                  {"ask": "Does anyone play in the sandpit?", "check": {"kind": "any", "row": "Sandpit"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "The Sandpit row is empty. Nobody chose it."},
                  {"ask": "How many children play tag?", "check": {"kind": "count", "row": "Tag"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "Two pictures in the Tag row: Sami and Tariq."},
                  {"ask": "Which game did the FEWEST children choose?", "check": {"kind": "least"},
                   "opts": [opt("Sandpit", True), opt("Football", False), opt("Skipping", False)], "why": "The Sandpit row has 0, fewer than any other."},
              ]},
             "You read a pictogram twice. You can talk about what one shows."),

        step("questions", "Finding out", "\U0001F4AC", "Finding-out judge", ["1Rc.01", "1Ad.01"],
             "Think about what we did. Tap the answer.",
             explain(
                 ["We asked. We recorded. We looked at the pictogram."],
                 ["Asking everyone is a survey.", "One picture is one person.", "The longest row is the most."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("We wanted to know how the class gets to school. What did we do?", "\U0001F5E3️", "asked everyone and recorded the answers", ["guessed", "asked one person"], "That is a survey: ask everyone, record every answer."),
                 q("In a pictogram, one picture is…", "\U0001F6B6", "one person", ["the whole class", "one bus"], "Every picture stands for one person who gave that answer."),
                 q("The longest row in a pictogram shows…", "\U0001F4CA", "the answer most people gave", ["the tallest child", "the first person asked"], "The longest row has the most pictures, so the most people."),
                 q("A row with no pictures means…", "\U0001F3D6️", "nobody gave that answer", ["everybody gave that answer", "the survey is broken"], "An empty row is still information: nobody chose it."),
             ]},
             "Ask, record, read. You know how an investigation works."),

        step("quiz", "Show what you know", "⭐", "Star investigator", ["1Rc.01", "1Rf.01", "1Ad.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the two surveys, the pictograms and the chart."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a survey?", "\U0001F5E3️", "asking everyone the same question and recording the answers", ["a kind of bus", "a picture of a school", "a game of tag"], "A survey asks everyone and records every answer."),
                 q("Why do we record each answer?", "✏️", "so we do not forget it", ["because it is fun to draw", "so the teacher can go home", "we do not need to"], "Six answers are too many to remember. Recording keeps them."),
                 q("What is a pictogram?", "\U0001F4CA", "a picture for every person, in rows", ["a photo of the class", "a story about a bus", "a big map"], "A pictogram is pictures in rows, one for each person."),
                 q("How did most of the class get to school?", "\U0001F6B6", "walk", ["bus", "car", "bike"], "The Walk row had three pictures."),
                 q("Who should you ask to find out about YOUR class?", "\U0001F3EB", "the people in your class", ["a book about classes", "the bus driver", "a dinosaur"], "Only the people in the class know their own answers."),
                 q("On our chart, where does Hana's bike go?", "\U0001F6B2", "on wheels", ["on foot", "in the sandpit", "nowhere"], "A bike has wheels."),
                 q("Nobody chose the sandpit. What does the sandpit row look like?", "\U0001F3D6️", "empty, no pictures", ["the longest row", "full of pictures"], "No answers, no pictures."),
                 q("What did we record the playtime answers in?", "\U0001F9F5", "a pictogram", ["a bus", "a book about dinosaurs", "a sandpit"], "A picture for every person, in rows."),
             ]},
             "That is the whole lesson finished. You can find out, record it, and read what you recorded."),
    ],
}


LESSON["about"] = [
    "Find out about our class by asking everyone the same question.",
    "Record each answer in a pictogram, one picture for one person.",
    "Record what we found on a chart with two sides.",
    "Talk about what a pictogram shows: the most, how many, and did anyone.",
]

LESSON["lecture"] = [
    part("\U0001F469\U0001F3FE‍\U0001F3EB", "The big question",
         "Teacher Yasmin wants to know how everyone gets to school. Nobody knows that for the whole class. You cannot guess it. You have to ask."),
    part("\U0001F5E3️", "Ask everyone",
         "Asking everyone the same question is a survey. You ask one person, listen, and record what they said. Then the next person. It is their answer, not yours."),
    part("\U0001F4CA", "A pictogram",
         "Every answer becomes a picture in a row. One picture is one person. When everyone is asked, the rows show the answer for the whole class. The longest row is the most."),
    part("\U0001F4CB", "A chart",
         "A chart is another way to record. This one has two sides: on foot, and on wheels. Every classmate goes on one side, and you can see the answer in one look."),
    part("\U0001F440", "Talk about it",
         "Now the pictogram can answer questions. Which is the most? How many chose this? Did anyone choose that? Count the pictures and it tells you."),
]

LESSON["words"] = [
    word("survey", "\U0001F5E3️", "Asking everyone the same question and recording the answers.",
         ["We did a survey about getting to school.", "A survey asks everyone."]),
    word("record", "✏️", "To write or draw an answer down so it is kept.",
         ["Record what Amal said.", "We recorded six answers."]),
    word("pictogram", "\U0001F4CA", "A picture for every person, in rows.",
         ["The pictogram shows most of us walk.", "One picture is one person."]),
    word("chart", "\U0001F4CB", "A page with sides or boxes to record things in.",
         ["Our chart has two sides.", "Put the bike on the wheels side of the chart."]),
    word("count", "\U0001F522", "To find how many.",
         ["Count the pictures in the row.", "We counted three walkers."]),
    word("investigate", "\U0001F50D", "To find something out by asking, looking or counting.",
         ["We investigated how we get to school.", "Let's investigate!"]),
]

LESSON["home"] = [
    home("Family survey", "Paper, a pencil, everyone at home",
         ["Ask everyone the same question: how do you get to work or school?",
          "Draw one small picture for each person, in a row for each answer.",
          "Look at your pictogram. Which row is longest?"],
         "Did anyone give an answer you did not expect?"),
    home("Count the cars", "A window that looks onto a road, and a grown-up",
         ["Watch the road for five minutes.",
          "Make a mark for each car, each bus and each bike that goes past.",
          "Count the marks. Which went past most?"],
         "How many went past altogether?"),
    home("Breakfast pictogram", "Paper and crayons",
         ["Ask everyone at home what they had for breakfast.",
          "Draw a row for each kind of breakfast.",
          "Tell somebody what your pictogram shows."],
         "Which breakfast was the most? Did anyone have something nobody else had?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "the names of the planets", "how to tie a shoelace"],
}
