# -*- coding: utf-8 -*-
"""Lesson 6 - Data Detectives.

0059 Stage 1 Managing Data, all four: 1MD.01 computing devices answer many
different kinds of question in different ways; 1MD.02 computing devices help
to sort and organise data; 1MD.03 record data manually with a form; 1MD.04
questions a data table can answer, limited to categorical data.
"""
from _kit import explain, step, opt, q, part, word, home

FRUIT_ROWS = [
    {"label": "Apple", "pic": "\U0001F34E", "value": 2},
    {"label": "Banana", "pic": "\U0001F34C", "value": 3},
    {"label": "Mango", "pic": "\U0001F96D", "value": 1},
    {"label": "Orange", "pic": "\U0001F34A", "value": 0},
]

LESSON = {
    "slug": "data-detectives",
    "title": "Data Detectives",
    "blurb": "Find out what data is, ask a computer the right way, record six friends' answers on a form, read the table it makes, and watch a computer sort a pile of things in a blink.",
    "steps": [
        step("explore", "What is data?", "\U0001F4CA", "Data spotter", ["1MD.01"],
             "Data is facts and numbers we collect. Tap each one to hear the data in it.",
             explain(
                 ["Data is facts and numbers that we collect and write down.", "Names, colours, how many, how tall, what the weather was."],
                 ["Your name is data.", "Your favourite colour is data.", "How many pets you have is data.",
                  "Once we have collected data, a computer can help us look at it."],
                 ["Children think data has to be numbers.", "Favourite colour is data too. Data can be words."],
                 ["Tap all six and say the data in each one."]),
             {"items": [
                 {"pic": "\U0001F4DB", "label": "names", "say": "Names are data. Amal, Sami, Nora, Omar. A list of names."},
                 {"pic": "\U0001F3A8", "label": "favourite colours", "say": "Favourite colours are data. Red, blue, blue, green. We can count them."},
                 {"pic": "\U0001F436", "label": "how many pets", "say": "How many pets you have is data. One, none, two."},
                 {"pic": "\U0001F326️", "label": "the weather each day", "say": "The weather each day is data. Sunny, sunny, rainy, cloudy."},
                 {"pic": "\U0001F4CF", "label": "how tall you are", "say": "How tall you are is data. A number we measure."},
                 {"pic": "\U0001F371", "label": "what you had for lunch", "say": "What everyone had for lunch is data. Rice, pasta, rice, soup."},
             ], "need": 6,
              "then": {"ask": "What is data?",
                       "opts": [opt("Facts and numbers we collect", True), opt("A kind of computer", False), opt("A game", False)],
                       "why": "Data is facts and numbers we collect: names, colours, counts, the weather."}},
             "Names, colours, counts, weather. All data."),

        step("ask", "Ask a computer the right way", "\U0001F4F1", "Question asker", ["1MD.01"],
             "Different questions need different apps. Pick the one that would answer each question.",
             explain(
                 ["A computer can answer many kinds of question, but each kind is answered a different way."],
                 ["Will it rain tomorrow? The weather app.", "How do you spell elephant? Search the web.",
                  "Which way is the park? The map app.", "How many children in OUR class like apples? Only our own table knows that."],
                 ["Children think the internet knows everything.", "It does not know what your class had for lunch. Our own data does."],
                 ["Read the question, then tap the app that can answer it."]),
             {"ways": [
                 {"id": "weather", "label": "Weather app", "pic": "\U0001F326️", "wrong": "The weather app only knows about the weather."},
                 {"id": "search", "label": "Search the web", "pic": "\U0001F50E", "wrong": "Searching the web finds facts everyone shares. It knows nothing about our class, and the weather app is made for the weather."},
                 {"id": "map", "label": "Map app", "pic": "\U0001F5FA️", "wrong": "A map app answers where things are and which way to go."},
                 {"id": "table", "label": "Our class table", "pic": "\U0001F4CA", "wrong": "Our class table only knows what we recorded in it."},
             ],
              "questions": [
                  {"ask": "Will it rain tomorrow?", "pic": "☔", "answer": "weather", "result": "Tomorrow: rain in the afternoon.", "why": "Weather questions go to the weather app."},
                  {"ask": "How do you spell elephant?", "pic": "\U0001F418", "answer": "search", "result": "elephant: e-l-e-p-h-a-n-t", "why": "A spelling is a fact anyone can search for."},
                  {"ask": "Which way is the park?", "pic": "\U0001F333", "answer": "map", "result": "Turn left, then walk 5 minutes.", "why": "Where things are and which way to go: the map app."},
                  {"ask": "How many children in our class like apples?", "pic": "\U0001F34E", "answer": "table", "result": "Apples: 2 children.", "why": "Only our own table knows about our own class."},
                  {"ask": "What do lions eat?", "pic": "\U0001F981", "answer": "search", "result": "Lions eat meat: zebras and antelopes.", "why": "A fact about lions is on the web."},
                  {"ask": "Is it sunny in Nairobi right now?", "pic": "☀️", "answer": "weather", "result": "Nairobi: sunny, 24 degrees.", "why": "The weather app knows the weather in other places too."},
              ]},
             "Different questions, different apps. You asked each one the right way."),

        step("form", "Record it on the form", "\U0001F4DD", "Form filler", ["1MD.03"],
             "Six friends tell you their favourite fruit. Record each answer on the form and press Submit.",
             explain(
                 ["A form is a way to record data on a computer.", "Each person's answer goes in, and the computer keeps it."],
                 ["Amal says bananas.", "Tap Banana on the form.", "Press Submit.", "The table underneath counts it.",
                  "Six friends, six answers, and the table fills itself."],
                 ["Children tap their OWN favourite.", "Record what the person SAID. That is their data, not yours."],
                 ["Listen to each friend, tap their answer, submit."]),
             {"question": "What is your favourite fruit?", "columns": ["Fruit", "How many"],
              "options": [{"id": "apple", "t": "Apple", "pic": "\U0001F34E"}, {"id": "banana", "t": "Banana", "pic": "\U0001F34C"},
                          {"id": "mango", "t": "Mango", "pic": "\U0001F96D"}, {"id": "orange", "t": "Orange", "pic": "\U0001F34A"}],
              "people": [
                  {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "answer": "banana", "say": "Bananas are my favourite!"},
                  {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "answer": "apple", "say": "I like apples best."},
                  {"name": "Nora", "pic": "\U0001F467\U0001F3FD", "answer": "mango", "say": "Mango. Definitely mango."},
                  {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "answer": "banana", "say": "Banana for me."},
                  {"name": "Hana", "pic": "\U0001F467\U0001F3FF", "answer": "apple", "say": "Apples, please."},
                  {"name": "Tariq", "pic": "\U0001F466\U0001F3FF", "answer": "banana", "say": "I love bananas."},
              ]},
             "Six answers recorded on a form. The computer made the table."),

        step("table", "Read the table", "\U0001F4CA", "Table reader", ["1MD.04"],
             "The table you made can answer questions. Look in it, then tap the answer.",
             explain(
                 ["A data table can answer questions about the data in it.", "Which is the most? How many chose this? Did anyone choose that?"],
                 ["Banana has three. Apple has two. Mango has one. Orange has none.",
                  "So the most is banana.", "Nobody chose orange."],
                 ["Children answer from memory.", "Look IN the table. The answer is written there."],
                 ["Read the question, find the row, tap the answer."]),
             {"title": "Favourite fruit in our class", "columns": ["Fruit", "How many"], "rows": FRUIT_ROWS,
              "items": [
                  {"ask": "Which fruit did the MOST children choose?", "check": {"kind": "most"},
                   "opts": [opt("Banana", True), opt("Apple", False), opt("Mango", False)], "why": "Banana has 3, more than any other row."},
                  {"ask": "How many children chose apple?", "check": {"kind": "count", "row": "Apple"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "The apple row says 2."},
                  {"ask": "Did anyone choose orange?", "check": {"kind": "any", "row": "Orange"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "The orange row says 0. Nobody chose it."},
                  {"ask": "Which fruit did the FEWEST children choose?", "check": {"kind": "least"},
                   "opts": [opt("Orange", True), opt("Mango", False), opt("Banana", False)], "why": "Orange has 0, fewer than any other row."},
                  {"ask": "Did anyone choose mango?", "check": {"kind": "any", "row": "Mango"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "The mango row says 1. Nora chose it."},
              ]},
             "Most, fewest, how many, did anyone. The table answered them all."),

        step("sorter", "The sorting machine", "⚙️", "Sorting machine", ["1MD.02"],
             "A computer can sort data in a blink. Press each button and watch.",
             explain(
                 ["Sorting means putting things into groups.", "You can sort by hand, but a computer sorts a hundred things in a blink."],
                 ["Sort by colour: all the reds together, all the yellows together.", "Sort by type: fruit here, vegetables there.",
                  "The same things, sorted two ways."],
                 ["Children think there is one right way to sort.", "There are many. It depends what question you are asking."],
                 ["Press both buttons and compare."]),
             {"items": [
                 {"pic": "\U0001F34E", "label": "apple", "colour": "red", "type": "fruit"},
                 {"pic": "\U0001F34C", "label": "banana", "colour": "yellow", "type": "fruit"},
                 {"pic": "\U0001F955", "label": "carrot", "colour": "orange", "type": "vegetable"},
                 {"pic": "\U0001F34B", "label": "lemon", "colour": "yellow", "type": "fruit"},
                 {"pic": "\U0001F966", "label": "broccoli", "colour": "green", "type": "vegetable"},
                 {"pic": "\U0001F350", "label": "pear", "colour": "green", "type": "fruit"},
                 {"pic": "\U0001F33D", "label": "corn", "colour": "yellow", "type": "vegetable"},
                 {"pic": "\U0001F353", "label": "strawberry", "colour": "red", "type": "fruit"},
                 {"pic": "\U0001F952", "label": "cucumber", "colour": "green", "type": "vegetable"},
                 {"pic": "\U0001F34A", "label": "orange", "colour": "orange", "type": "fruit"},
                 {"pic": "\U0001F383", "label": "pumpkin", "colour": "orange", "type": "vegetable"},
                 {"pic": "\U0001F34D", "label": "pineapple", "colour": "yellow", "type": "fruit"},
             ],
              "ways": [
                  {"id": "colour", "label": "by colour", "groups": ["red", "yellow", "green", "orange"], "say": "Every colour in its own group."},
                  {"id": "type", "label": "by type", "groups": ["fruit", "vegetable"], "say": "Fruit in one group, vegetables in the other. The same things, sorted a different way."},
              ],
              "then": {"ask": "Sorted by colour, which group is the biggest?",
                       "opts": [opt("Yellow", True), opt("Red", False), opt("Green", False)],
                       "why": "Yellow has four things: banana, lemon, corn and pineapple."}},
             "A computer sorts and organises data, and it can do it more than one way."),

        step("sort", "Can our table answer it?", "\U0001F5C2️", "Table judge", ["1MD.04"],
             "Our fruit table knows some things and not others. Can it answer this question?",
             explain(
                 ["A table can only answer questions about the data that is IN it."],
                 ["How many chose apple? Yes, it is in the table.", "What is Amal's favourite song? No. We never asked about songs.",
                  "How tall is Sami? No. The table is about fruit."],
                 ["Children think a table knows everything about the people in it.", "It knows one thing: what we recorded."],
                 ["Ask: did we record that? Then tap the bin."]),
             {"ask": "Can the fruit table answer it?",
              "bins": [{"id": "yes", "label": "Yes, it is in the table", "pic": "\U0001F4CA"}, {"id": "no", "label": "No, the table does not know", "pic": "\U0001F937"}],
              "items": [
                  {"pic": "\U0001F34E", "label": "how many children chose apple?", "bin": "yes", "why": "The apple row says 2. The table knows."},
                  {"pic": "\U0001F3B5", "label": "what is Amal's favourite song?", "bin": "no", "why": "We asked about fruit, not songs. The table does not know."},
                  {"pic": "\U0001F3C6", "label": "which fruit did most children choose?", "bin": "yes", "why": "Compare the rows: banana. The table knows."},
                  {"pic": "\U0001F4CF", "label": "how tall is Sami?", "bin": "no", "why": "Height was never recorded. The table does not know."},
                  {"pic": "\U0001F34A", "label": "did anyone choose orange?", "bin": "yes", "why": "The orange row says 0. The table knows: nobody."},
                  {"pic": "\U0001F95E", "label": "what did Nora eat for breakfast?", "bin": "no", "why": "Breakfast is not in the fruit table."},
              ]},
             "A table answers questions about the data in it, and nothing else."),

        step("demo", "By hand, or by computer?", "\U0001F4DA", "Blink sorter", ["1MD.02"],
             "A hundred library books need sorting. Press <b>Next</b>.",
             explain(
                 ["Computers are very good at sorting and organising data, and very fast."],
                 ["A hundred books by hand takes all afternoon.", "A computer with the list of titles sorts them in a blink.",
                  "And it can sort them again a different way, just as fast."],
                 [],
                 ["Press Next and compare."]),
             {"frames": [
                 {"pic": "\U0001F4DA", "cap": "A hundred library books, all mixed up.", "say": "A hundred library books, all mixed up. They need sorting by name."},
                 {"pic": "\U0001F9D2\U0001F4DA\U0001F550", "cap": "By hand, it takes <b>all afternoon</b>.", "say": "Sorting them by hand takes all afternoon.", "sound": "click"},
                 {"pic": "\U0001F4BB⚡", "cap": "A computer with the list sorts it in a <b>blink</b>.", "say": "A computer with the list of names sorts it in a blink.", "sound": "whoosh"},
                 {"pic": "\U0001F4BB\U0001F4CF", "cap": "Sort them again by <b>size</b>? Another blink.", "say": "Sort them again by size? Another blink. The same data, organised a new way.", "sound": "whoosh"},
                 {"pic": "\U0001F4CA", "cap": "Computers help us <b>sort and organise</b> data.", "say": "Computers help us sort and organise data. That is one of the things they are best at.", "sound": "tada"},
             ]},
             "By hand, all afternoon. By computer, a blink."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1MD.01", "1MD.02", "1MD.03", "1MD.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about data, the form, the table and the sorting machine."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is data?", "\U0001F4CA", "facts and numbers we collect", ["a kind of fruit", "a robot", "a wire"], "Data is facts and numbers we collect: names, counts, colours."),
                 q("You want to know if it will rain tomorrow. Which app?", "☔", "the weather app", ["the map app", "our fruit table", "a drawing app"], "Weather questions go to the weather app."),
                 q("How do we record six friends' answers on a computer?", "\U0001F4DD", "with a form", ["with a hammer", "by shouting them", "we cannot"], "A form records each answer, and the computer keeps it."),
                 q("The table says: apple 2, banana 3, mango 1. Which fruit did most children choose?", "\U0001F34C", "banana", ["apple", "mango", "orange"], "Banana has 3, the biggest number."),
                 q("Can the fruit table tell you Amal's favourite song?", "\U0001F3B5", "no, songs are not in the table", ["yes, of course", "only on Fridays", "yes, if you ask nicely"], "A table only knows the data that was recorded in it."),
                 q("What does sorting mean?", "⚙️", "putting things into groups", ["throwing things away", "counting to ten", "drawing a picture"], "Sorting puts things into groups: by colour, by type."),
                 q("Who sorts a hundred books faster?", "⚡", "a computer, in a blink", ["a person, by hand", "nobody can", "they are the same"], "Computers sort and organise data very fast."),
                 q("Which of these is a question a computer can help answer?", "❓", "which way is the park?", ["what is my cat thinking?", "is red a nice colour?", "none of them"], "A map app can answer which way the park is."),
             ]},
             "That is the whole lesson finished. You are a data detective."),
    ],
}


LESSON["about"] = [
    "Say what data is, and ask a computer the right way for different kinds of question.",
    "Record answers on a form so a computer can keep them.",
    "Read a data table to answer a question.",
    "Say how a computer helps to sort and organise data.",
]

LESSON["lecture"] = [
    part("\U0001F4CA", "Data",
         "Data is facts and numbers we collect. Names, favourite colours, how many pets, what the weather was. Once we have data, a computer can help us look at it."),
    part("\U0001F4F1", "Asking a computer",
         "A computer can answer many kinds of question, but each kind a different way. The weather app for rain. The map app for the way to the park. A search for how to spell elephant. And our own table for questions about our own class."),
    part("\U0001F4DD", "A form",
         "A form is how we put data into a computer. Each friend says their favourite fruit, you tap it on the form and press Submit. The computer keeps every answer."),
    part("\U0001F4CB", "A table",
         "The computer puts the answers in a table: apple 2, banana 3, mango 1, orange 0. Now the table can answer questions. Which is the most? Did anyone choose orange? Look in the table and it tells you."),
    part("⚙️", "Sorting",
         "Sorting means putting things into groups. A computer sorts a hundred things in a blink, by colour, then by size, then by name. Computers help us sort and organise data."),
]

LESSON["words"] = [
    word("data", "\U0001F4CA", "Facts and numbers we collect.",
         ["Favourite colours are data.", "We collected data about fruit."]),
    word("form", "\U0001F4DD", "A page on a computer where you put in answers.",
         ["Fill in the form.", "The form asks one question."]),
    word("table", "\U0001F4CB", "Data set out in rows, so you can read it.",
         ["Look in the table.", "The table says banana is the most."]),
    word("sort", "⚙️", "To put things into groups.",
         ["Sort the fruit by colour.", "The computer sorted them in a blink."]),
    word("record", "\U0001F4BE", "To write data down so it is kept.",
         ["Record each answer.", "We recorded six answers."]),
    word("question", "❓", "Something you want to find out.",
         ["Ask the table a question.", "Different questions need different apps."]),
    word("organise", "\U0001F5C2️", "To put things in order or in groups so they are easy to find.",
         ["A computer helps organise data.", "Organise the books by size."]),
]

LESSON["home"] = [
    home("Family survey", "Paper, a pencil, your family",
         ["Ask everyone one question with a few answers: what is your favourite fruit?",
          "Tick a box on a paper form for each person.",
          "Count the ticks into a table: apple 2, banana 3."],
         "What question can your table answer? What question can it NOT answer?"),
    home("Sort the socks", "A basket of clean socks",
         ["Sort the socks by colour.",
          "Mix them up and sort them by size.",
          "Mix them up and sort them into pairs."],
         "The same socks, sorted three ways. Which way took longest?"),
    home("Ask a device", "A grown-up with a phone",
         ["Think of three questions: the weather, a spelling, the way somewhere.",
          "With your grown-up, ask each one using the right app.",
          "Ask a question about your own family. Can the phone answer it?"],
         "The phone did not know your family's favourite fruit. Only your table did."),
]
