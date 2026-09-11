# -*- coding: utf-8 -*-
"""Lesson 8 - Presenting Data.

0059 Stage 2 Managing Data: 2MD.02 use computing devices to present
categorical data; 2MD.06 how data may help to solve problems; 2MD.01 the
advantages of storing data on computers.
"""
from _kit import explain, step, opt, q, part, word, home

PLAYGROUND = [
    {"label": "Monday", "pic": "\U0001F9D2", "value": 9},
    {"label": "Tuesday", "pic": "\U0001F9D2", "value": 4},
    {"label": "Wednesday", "pic": "\U0001F9D2", "value": 7},
    {"label": "Thursday", "pic": "\U0001F9D2", "value": 3},
    {"label": "Friday", "pic": "\U0001F9D2", "value": 8},
]

LESSON = {
    "slug": "presenting-data",
    "title": "Presenting Data",
    "blurb": "Turn the party survey into a graph you can read at a glance, build a second graph about how we come to school, and use a data table to solve a real problem.",
    "steps": [
        step("demo", "From a table to a graph", "\U0001F4CA", "Graph maker", ["2MD.02"],
             "A table holds the numbers. A graph SHOWS them. Press <b>Next</b>.",
             explain(
                 ["Presenting data means showing it so people can see the answer at a glance.", "A graph does that: a taller column means more."],
                 ["The fruit table says apple 2, banana 4, orange 1, grapes 1.", "As a graph, banana is the tallest column. You see the answer before you read a number."],
                 ["Children think the graph is decoration.", "The graph IS the data, shown a way eyes are good at."],
                 ["Press Next and watch the table become a graph."]),
             {"frames": [
                 {"pic": "\U0001F4CB", "cap": "The party table: apple 2, banana 4, orange 1, grapes 1.", "say": "The party table. Apple two, banana four, orange one, grapes one. Numbers in rows."},
                 {"pic": "\U0001F34E\U0001F34E", "cap": "Apple: 2 blocks.", "say": "Now the computer draws a column for each fruit. Apple: two blocks.", "sound": "click"},
                 {"pic": "\U0001F34C\U0001F34C\U0001F34C\U0001F34C", "cap": "Banana: 4 blocks. The tallest.", "say": "Banana: four blocks. The tallest column.", "sound": "click"},
                 {"pic": "\U0001F34A\U0001F347", "cap": "Orange: 1. Grapes: 1.", "say": "Orange, one block. Grapes, one block.", "sound": "click"},
                 {"pic": "\U0001F4CA", "cap": "A <b>graph</b>. You can see the most and the fewest at a glance.", "say": "A block graph. Now anyone can see at a glance which fruit won, without reading a single number.", "sound": "tada"},
             ]},
             "A graph shows the data so the answer is seen, not read."),

        step("chart", "Build the party graph", "\U0001F34C", "Party grapher", ["2MD.02", "2MD.06"],
             "The survey gave these numbers. Build a block for each answer, then read the graph.",
             explain(
                 ["Each column shows one category. Each block is one answer.", "A column stops when it has as many blocks as the table says."],
                 ["Apple 2: two blocks.", "Banana 4: four blocks.", "When every column is built, the tallest one answers the party question."],
                 ["Children keep adding blocks after the number is reached.", "The button goes grey when the column is right."],
                 ["Build every column, then answer the question."]),
             {"columns_label": "Fruit", "value_label": "How many chose it",
              "columns": [
                  {"label": "Apple", "pic": "\U0001F34E", "value": 2},
                  {"label": "Banana", "pic": "\U0001F34C", "value": 4},
                  {"label": "Orange", "pic": "\U0001F34A", "value": 1},
                  {"label": "Grapes", "pic": "\U0001F347", "value": 1},
              ],
              "pattern": {"ask": "Which fruit should we buy the most of for the party?", "check": {"kind": "most"},
                          "opts": [opt("Banana", True), opt("Apple", False), opt("Grapes", False)],
                          "why": "Banana is the tallest column: four children chose it."}},
             "The graph answered the party question at a glance."),

        step("chart", "How we come to school", "\U0001F6B6", "School grapher", ["2MD.02"],
             "A new table: how the children in a class come to school. Build the graph, then read it.",
             explain(
                 ["A different table, the same job: one column per category, one block per child."],
                 ["Walk 6, car 3, bus 2, bike 1.", "Build it and the pattern shows itself."],
                 [],
                 ["Build every column, then answer."]),
             {"columns_label": "How", "value_label": "How many children",
              "columns": [
                  {"label": "Walk", "pic": "\U0001F6B6", "value": 6},
                  {"label": "Car", "pic": "\U0001F697", "value": 3},
                  {"label": "Bus", "pic": "\U0001F68C", "value": 2},
                  {"label": "Bike", "pic": "\U0001F6B2", "value": 1},
              ],
              "pattern": {"ask": "How do MOST children in this class come to school?", "check": {"kind": "most"},
                          "opts": [opt("Walk", True), opt("Car", False), opt("Bus", False)],
                          "why": "Walk is the tallest column, six children."}},
             "Another table, another graph, another answer at a glance."),

        step("table", "Use the data to solve a problem", "\U0001F9E9", "Problem solver", ["2MD.06"],
             "The playground is too crowded some days. The table counts how many children played football each day. Use it to decide.",
             explain(
                 ["Data helps solve problems when you ask it the right question."],
                 ["The problem: the playground is too crowded.", "The data: how many played football each day.", "The question: which day is busiest, and which is quietest?",
                  "Then a decision: move football club to the quiet day."],
                 ["Children want to decide before looking at the table.", "Look first, then decide."],
                 ["Find each answer in the table."]),
             {"title": "Children playing football at lunch", "columns": ["Day", "How many"], "rows": PLAYGROUND,
              "items": [
                  {"ask": "The playground is most crowded on which day?", "check": {"kind": "most"},
                   "opts": [opt("Monday", True), opt("Friday", False), opt("Wednesday", False)], "why": "Monday has 9, the biggest number."},
                  {"ask": "Football club should move to the QUIETEST day. Which is it?", "check": {"kind": "least"},
                   "opts": [opt("Thursday", True), opt("Tuesday", False), opt("Monday", False)], "why": "Thursday has 3, the smallest number. The data solved the problem."},
                  {"ask": "How many children played on Friday?", "check": {"kind": "count", "row": "Friday"},
                   "opts": [opt("8", True), opt("7", False), opt("9", False)], "why": "The Friday row says 8."},
                  {"ask": "Did anyone play on Tuesday?", "check": {"kind": "any", "row": "Tuesday"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "The Tuesday row says 4. Yes."},
              ]},
             "The data said Thursday, so football club moves to Thursday. Problem solved."),

        step("explore", "Data solves problems", "\U0001F4A1", "Problem spotter", ["2MD.06"],
             "Grown-ups use data to solve problems every day. Tap each one.",
             explain(
                 ["A shop, a doctor, a city and a school all collect data and then decide."],
                 ["A shop counts what sells and orders more of it.", "A doctor charts a temperature to see if it is going down.",
                  "A city counts cars to decide where a crossing is needed.", "A school counts lunches so the kitchen cooks the right amount."],
                 [],
                 ["Tap each one and find the problem and the decision."]),
             {"items": [
                 {"pic": "\U0001F3EA", "label": "a shop", "say": "A shop counts what it sells each day. Bananas sell out, apples do not. So it orders more bananas. Data, then a decision."},
                 {"pic": "\U0001F469‍⚕️", "label": "a doctor", "say": "A doctor writes down a patient's temperature every hour and draws a graph. The line going down shows the fever is going down."},
                 {"pic": "\U0001F6A6", "label": "a city", "say": "A city counts the cars on a road, and the children crossing it. Lots of both means a crossing is needed there."},
                 {"pic": "\U0001F371", "label": "a school kitchen", "say": "A school counts how many children want a hot lunch, so the kitchen cooks the right amount and nothing is wasted."},
             ], "need": 4,
              "then": {"ask": "The shop's data says bananas sell out every day. What is the decision?",
                       "opts": [opt("Order more bananas", True), opt("Stop selling bananas", False), opt("Ignore the data", False)],
                       "why": "Data shows the problem; the decision solves it."}},
             "Collect the data, read it, decide. That is solving a problem with data."),

        step("questions", "Paper, or computer?", "\U0001F4BB", "Storage thinker", ["2MD.01", "2MD.02"],
             "What can a computer do with the class data that paper cannot? Tap the answer.",
             explain(
                 ["A computer keeps data safe, finds it fast, copies it, sends it, and turns it into a graph in a blink."],
                 [],
                 [],
                 ["Think about what happened to the paper table, then tap."]),
             {"label": "Question", "items": [
                 q("The class list on paper got wet. What about the copy on the computer?", "\U0001F4A7", "still there, and it can be printed again", ["also wet", "gone for ever", "half wet"], "The water only reached the paper. The copy on the computer is still there."),
                 q("You need to find one name out of 500. Which is faster?", "\U0001F50E", "the computer searches it in a blink", ["reading the paper list", "they are the same", "asking everyone"], "Searching is what computers are best at."),
                 q("Two classes need the same table. On a computer you can...", "\U0001F4CB", "copy it in a blink", ["write it out twice", "share one piece of paper", "not do it"], "Copying is instant."),
                 q("You want to turn the table into a graph. Which is faster?", "\U0001F4CA", "the computer draws it in a blink", ["drawing it by hand with a ruler", "they take the same time", "graphs cannot be made"], "Presenting data is a computer's job."),
             ]},
             "Safe, searchable, copyable, sendable, and graphed in a blink."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2MD.02", "2MD.06", "2MD.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the graphs, the playground table and the shop."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("In a block graph, a taller column means...", "\U0001F4CA", "more", ["less", "nothing", "a mistake"], "Each block is one answer; more blocks, more answers."),
                 q("The party graph: banana 4, apple 2. Which fruit do we buy the most of?", "\U0001F34C", "banana", ["apple", "orange", "both the same"], "The tallest column wins."),
                 q("Why present data as a graph?", "\U0001F440", "so people can see the answer at a glance", ["to make it harder to read", "because tables are wrong", "for no reason"], "A graph shows what a table only lists."),
                 q("The playground table showed Thursday had the fewest children. What was the decision?", "\U0001F9E9", "move football club to Thursday", ["move it to Monday", "close the playground", "ignore the table"], "The data pointed at the quiet day."),
                 q("A shop's data says bananas sell out every day. What should it do?", "\U0001F3EA", "order more bananas", ["order fewer", "stop counting", "sell apples only"], "Data, then a decision."),
                 q("Which is a problem data could help solve?", "\U0001F4A1", "where a town needs a new crossing", ["what colour is nicest", "how a cat feels", "none of these"], "Count the cars and the children, and the answer is in the data."),
                 q("What is the first thing to do with data before deciding?", "\U0001F4D6", "read it carefully", ["throw it away", "decide first", "colour it in"], "Look first, then decide."),
                 q("Where is the class data safest?", "\U0001F4BE", "on the computer", ["on a piece of paper by the sink", "in your head", "nowhere"], "A spill on a paper list cannot touch it, a spare copy can be kept, and it can be searched and sent."),
             ]},
             "That is the whole lesson finished. You can present data and use it to decide."),
    ],
}


LESSON["about"] = [
    "Present categorical data as a block graph on a computer.",
    "Read a graph to find the most and the fewest.",
    "Use a data table to solve a real problem.",
    "Say why data is stored on a computer rather than on paper.",
]

LESSON["lecture"] = [
    part("\U0001F4CB", "The table",
         "A table holds the numbers in rows: apple two, banana four, orange one, grapes one. It is exact, but you have to read every number to find the winner."),
    part("\U0001F4CA", "The graph",
         "A block graph shows the same data as columns: one column for each category, one block for each answer. Banana is the tallest, so banana is the answer, and you see it before you read anything."),
    part("\U0001F3D7️", "Building it",
         "The computer builds the graph from the table: two blocks for apple, four for banana. Once every column is the right height, the graph is finished and the pattern shows itself."),
    part("\U0001F9E9", "Solving a problem",
         "The playground is too crowded. The table counts the children each day. Monday is the busiest and Thursday the quietest, so football club moves to Thursday. Read the data, then decide."),
    part("\U0001F3EA", "Data at work",
         "A shop counts what sells and orders more of it. A doctor charts a temperature. A city counts cars before building a crossing. A kitchen counts lunches. Data helps solve problems, everywhere."),
]

LESSON["words"] = [
    word("graph", "\U0001F4CA", "A picture of data, with a column for each category.",
         ["Build the graph.", "The graph shows banana is the most."]),
    word("column", "\U0001F4CF", "One upright stack of blocks in a graph.",
         ["The banana column is the tallest.", "Each column is one category."]),
    word("present", "\U0001F5BC️", "To show data so people can understand it.",
         ["Present the data as a graph.", "The computer presents it in a blink."]),
    word("table", "\U0001F4CB", "Data set out in rows.",
         ["Read the table.", "The table says Thursday has 3."]),
    word("problem", "\U0001F9E9", "Something that needs deciding or fixing.",
         ["The crowded playground is a problem.", "Data helped solve the problem."]),
    word("decision", "✅", "What you choose to do after looking at the data.",
         ["The decision was Thursday.", "Data first, decision second."]),
]

LESSON["home"] = [
    home("Brick graph", "Toy bricks, a table of something you counted",
         ["Count something: shoes by colour, cups by size, cars by colour outside the window.",
          "Build one column of bricks for each category, one brick per thing.",
          "Which column is tallest? Which is shortest?"],
         "A graph shows the most and the fewest at a glance."),
    home("Solve a problem with data", "Paper, a pencil, a week",
         ["Pick a problem: which day is the kitchen busiest, or which toy gets played with most.",
          "Count it every day for a week and write the numbers in a table.",
          "Look at the table and make a decision."],
         "Read first, then decide."),
    home("Data at the shop", "A visit to a shop with a grown-up",
         ["Ask the shopkeeper what they count and why.",
          "What do they order more of? How do they know?",
          "Find one decision the shop made because of its data."],
         "Every shop is a data detective."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you collected the class's answers with a form and sorted the questions that give data you can count."
LESSON["warmup"] = [
    q("Which is quicker to read: a list of numbers, or a picture of them?", "\U0001F5BC\uFE0F", "a picture, like a graph", ["a list, always", "they are the same", "neither"], "A graph shows the answer at a glance."),
    q("The class has 10 juice cartons but 12 children. What does the data tell us?", "\U0001F964", "we need 2 more cartons", ["we have too many", "nothing at all", "juice is orange"], "The numbers show the problem, and the answer: two more."),
]
