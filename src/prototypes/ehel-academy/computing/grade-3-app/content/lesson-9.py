# -*- coding: utf-8 -*-
"""Lesson 9 - Data Problems.

0059 Stage 3 Managing Data: 3MD.01 problems that can be solved through the
collection and interpretation of data; 3MD.03 record discrete and categorical
data using computing devices; 3MD.02 investigate different ways of
representing discrete and categorical data, using a digital tool.

Until the Grade 3 validation (2026-09-11) categorical data was explained but
never recorded or charted; the favourite-pet form and its three views, after
the pets count, do both.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "data-problems",
    "title": "Data Problems",
    "blurb": "Spot the problems that data can solve, record how many pets each child has and which pet they would most like, then show each set of data three ways: a table, a bar chart and a pictogram.",
    "steps": [
        step("context", "Problems that data can solve", "\U0001F50D", "Problem spotter", ["3MD.01"],
             "Some problems are solved by collecting data and reading it. Tap each problem.",
             explain(
                 ["Collecting data means asking or counting.", "Interpreting data means reading what the numbers say.", "Some problems can only be solved that way."],
                 ["Which snack should the tuck shop sell? Ask everyone, count the answers.", "How many chairs for the concert? Count the parents coming.",
                  "When is the playground busiest? Count children each break."],
                 ["Children think data is only for scientists.", "Every one of these is a school problem, solved by counting."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F36A", "label": "which snack should the tuck shop sell?", "say": "Which snack should the tuck shop sell? Ask every child, count the answers, sell the most popular. Data solves it."},
                 {"pic": "\U0001FA91", "label": "how many chairs for the concert?", "say": "How many chairs for the concert? Count the parents who say they are coming. Data solves it."},
                 {"pic": "\U0001F938", "label": "when is the playground busiest?", "say": "When is the playground busiest? Count the children at each break for a week. Data solves it."},
                 {"pic": "\U0001F4DA", "label": "which books should the library buy?", "say": "Which books should the library buy? Look at which ones are borrowed most. Data solves it."},
                 {"pic": "\U0001F68C", "label": "does the bus need to be bigger?", "say": "Does the school bus need to be bigger? Count how many children ride it each day. Data solves it."},
             ], "need": 5,
              "then": {"ask": "How does data solve the tuck shop problem?",
                       "opts": [opt("Collect everyone's answer and read which snack got the most", True), opt("Guess", False), opt("Buy every snack there is", False)],
                       "why": "Collect, then interpret. That is solving a problem with data."}},
             "Collect, then interpret."),

        step("sort", "Can data solve it?", "\U0001F5C2️", "Data or not sorter", ["3MD.01"],
             "Some problems are solved by collecting data. Some are not. Which is this?",
             explain(
                 ["Data helps when the answer is a count, a most, a least, or a when.", "Data does not decide what is kind, or what a story should be about."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Can collecting data solve it?",
              "bins": [{"id": "yes", "label": "Data can solve it", "pic": "\U0001F4CA"}, {"id": "no", "label": "Not a data problem", "pic": "\U0001F4AD"}],
              "items": [
                  {"pic": "\U0001F34E", "label": "which fruit to put in the fruit bowl", "bin": "yes", "why": "Ask, count, choose the favourite."},
                  {"pic": "\U0001F4D6", "label": "what my story should be about", "bin": "no", "why": "That is imagination, not counting."},
                  {"pic": "\U0001F938", "label": "which day the playground is busiest", "bin": "yes", "why": "Count each day."},
                  {"pic": "\U0001F49B", "label": "how to cheer up a sad friend", "bin": "no", "why": "Kindness is not a count."},
                  {"pic": "\U0001F45F", "label": "how many size-1 shoes the school shop should order", "bin": "yes", "why": "Ask each child their shoe size, then count the size 1s."},
                  {"pic": "\U0001F3A8", "label": "which colour I like best", "bin": "no", "why": "You already know. No collecting needed."},
                  {"pic": "\U0001F327️", "label": "which month has the most rainy days", "bin": "yes", "why": "Record the weather each day, then count."},
                  {"pic": "\U0001F4CF", "label": "whether the classroom needs more coat pegs", "bin": "yes", "why": "Count children, count pegs."},
              ]},
             "Counts, mosts and whens: data problems."),

        step("form", "Record it: how many pets?", "\U0001F4DD", "Data recorder", ["3MD.03"],
             "Eight children say how many pets they have. Record each answer on the form. The number of pets is <b>discrete</b> data: whole numbers you count.",
             explain(
                 ["Discrete data is counted in whole numbers: 0 pets, 1 pet, 2 pets. Never one and a half.", "Categorical data is a category: cat, dog, fish."],
                 ["Amal has 1 pet. Tap 1, submit. The table counts how many children said 1."],
                 ["Children tap the number of children instead of the number of pets.", "The form asks how many pets THIS child has."],
                 ["Listen, tap, submit."]),
             {"question": "How many pets do you have?", "columns": ["Pets", "Children"],
              "options": [{"id": "p0", "t": "0", "pic": "0️⃣"}, {"id": "p1", "t": "1", "pic": "1️⃣"}, {"id": "p2", "t": "2", "pic": "2️⃣"}, {"id": "p3", "t": "3 or more", "pic": "3️⃣"}],
              "people": [
                  {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "say": "I have one pet, a cat.", "answer": "p1"},
                  {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "say": "I have no pets.", "answer": "p0"},
                  {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "say": "Two: a dog and a fish.", "answer": "p2"},
                  {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "say": "One dog.", "answer": "p1"},
                  {"name": "Leo", "pic": "\U0001F466\U0001F3FB", "say": "Three rabbits and a hamster. Four!", "answer": "p3"},
                  {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "say": "None. I would like a cat.", "answer": "p0"},
                  {"name": "Karim", "pic": "\U0001F466\U0001F3FE", "say": "One. A tortoise.", "answer": "p1"},
                  {"name": "Maya", "pic": "\U0001F467\U0001F3FC", "say": "Two cats.", "answer": "p2"},
              ]},
             "Eight answers recorded; the table counted them."),

        step("views", "The same data, three ways", "\U0001F4CA", "View comparer", ["3MD.02"],
             "Here is the pet data. Open the table, the bar chart and the pictogram, then answer from whichever view you like.",
             explain(
                 ["A digital tool can show the same data in different ways.", "A table gives exact numbers. A bar chart shows the biggest at a glance. A pictogram shows one picture per thing, so you can count them."],
                 ["Which is most common? The bar chart shows it fastest.", "Exactly how many children have two pets? The table says."],
                 ["Children think one view is right and the others wrong.", "They are all the same data. Each view is good for a different question."],
                 ["Open all three, then answer."]),
             {"title": "How many pets?", "columns_label": "pets", "value_label": "children",
              "columns": [{"label": "0 pets", "pic": "\U0001F6AB", "value": 2}, {"label": "1 pet", "pic": "\U0001F431", "value": 3}, {"label": "2 pets", "pic": "\U0001F436", "value": 2}, {"label": "3 or more", "pic": "\U0001F430", "value": 1}],
              "questions": [
                  {"ask": "Which number of pets is MOST common?", "check": {"kind": "most"}, "opts": [opt("1 pet", True), opt("0 pets", False), opt("3 or more", False)], "why": "The tallest bar, the most pictures, the biggest number: 1 pet."},
                  {"ask": "How many children have 2 pets?", "check": {"kind": "count", "row": "2 pets"}, "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "The table says 2, and the pictogram shows two pictures."},
                  {"ask": "Which is LEAST common?", "check": {"kind": "least"}, "opts": [opt("3 or more", True), opt("1 pet", False), opt("0 pets", False)], "why": "The shortest bar: 3 or more."},
              ]},
             "Three views, one set of data."),

        step("form", "Record it: which pet would you like?", "\U0001F4DD", "Category recorder", ["3MD.03"],
             "The same eight children say which pet they would most like. Record each answer. A kind of pet is <b>categorical</b> data: a category, not a count.",
             explain(
                 ["Categorical data is a category: cat, dog, fish, rabbit.", "You cannot add a cat to a dog, but you can count how many children chose each."],
                 ["Sami would like a cat. Tap cat, submit. The table counts how many children chose cat."],
                 ["Children tap the pet a child already has.", "The form asks which pet they would most LIKE."],
                 ["Listen, tap, submit."]),
             {"question": "Which pet would you most like?", "columns": ["Pet", "Children"],
              "options": [{"id": "cat", "t": "cat", "pic": "\U0001F431"}, {"id": "dog", "t": "dog", "pic": "\U0001F436"}, {"id": "fish", "t": "fish", "pic": "\U0001F41F"}, {"id": "rabbit", "t": "rabbit", "pic": "\U0001F430"}],
              "people": [
                  {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "say": "A dog, to go with my cat.", "answer": "dog"},
                  {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "say": "A cat, please.", "answer": "cat"},
                  {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "say": "A fluffy cat.", "answer": "cat"},
                  {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "say": "Another dog!", "answer": "dog"},
                  {"name": "Leo", "pic": "\U0001F466\U0001F3FB", "say": "A fish. We have no fish yet.", "answer": "fish"},
                  {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "say": "A cat, like I said.", "answer": "cat"},
                  {"name": "Karim", "pic": "\U0001F466\U0001F3FE", "say": "A rabbit.", "answer": "rabbit"},
                  {"name": "Maya", "pic": "\U0001F467\U0001F3FC", "say": "A third cat!", "answer": "cat"},
              ]},
             "Eight answers recorded, and every one is a category."),

        step("views", "Categories, three ways", "\U0001F4CA", "Category viewer", ["3MD.02"],
             "Here is the favourite-pet data. Open the table, the bar chart and the pictogram, then answer from whichever view you like.",
             explain(
                 ["Categorical data can be shown the same three ways as a count.", "Each category gets its own row in the table, its own bar, and its own row of pictures."],
                 ["Which pet is the favourite? The tallest bar.", "How many chose a dog? The table says exactly."],
                 ["Children think a chart needs numbers along the bottom.", "Categories along the bottom work just as well: cat, dog, fish, rabbit."],
                 ["Open all three, then answer."]),
             {"title": "Which pet would you most like?", "columns_label": "pet", "value_label": "children",
              "columns": [{"label": "cat", "pic": "\U0001F431", "value": 4}, {"label": "dog", "pic": "\U0001F436", "value": 2}, {"label": "fish", "pic": "\U0001F41F", "value": 1}, {"label": "rabbit", "pic": "\U0001F430", "value": 1}],
              "questions": [
                  {"ask": "Which pet is the class's favourite?", "check": {"kind": "most"}, "opts": [opt("cat", True), opt("dog", False), opt("rabbit", False)], "why": "The tallest bar, the most pictures, the biggest number: cat, with 4."},
                  {"ask": "How many children chose a dog?", "check": {"kind": "count", "row": "dog"}, "opts": [opt("2", True), opt("4", False), opt("1", False)], "why": "The table says 2, and the pictogram shows two dogs."},
                  {"ask": "How many children chose a fish?", "check": {"kind": "count", "row": "fish"}, "opts": [opt("1", True), opt("2", False), opt("0", False)], "why": "One fish in the pictogram, the shortest bar, and 1 in the table."},
              ]},
             "Categories in a table, a bar chart and a pictogram."),

        step("context", "Which view for which question?", "\U0001F4CA", "View chooser", ["3MD.02"],
             "Each way of showing data is best for something. Tap each one.",
             explain(
                 ["Table: exact numbers.", "Bar chart: compare sizes at a glance.", "Pictogram: count pictures, good for young readers."],
                 [],
                 [],
                 ["Tap all three."]),
             {"items": [
                 {"pic": "\U0001F4CB", "label": "table", "say": "A table. Every number exact. Best when you need to know precisely how many."},
                 {"pic": "\U0001F4CA", "label": "bar chart", "say": "A bar chart. The tallest bar is the most, at a glance. Best for comparing."},
                 {"pic": "\U0001F431\U0001F431\U0001F431", "label": "pictogram", "say": "A pictogram. One picture for each one. Best for counting by eye, and for people who do not read numbers yet."},
             ], "need": 3,
              "then": {"ask": "You want to see at a glance which is biggest. Which view?",
                       "opts": [opt("The bar chart", True), opt("The table", False), opt("A list of names", False)],
                       "why": "Bars show size by height; the tallest jumps out."}},
             "Each view for its question."),

        step("questions", "Check: data problems", "\U0001F4DD", "Data checker", ["3MD.01", "3MD.02", "3MD.03"],
             "Four quick questions.",
             explain(["Nothing new here."], ["Problems, recording, views."], [], ["Read, think, tap."]),
             {"items": [
                 q("Which problem can data solve?", "\U0001F50D", "which snack the tuck shop should sell", ["what my story should be about", "how to be kind", "which colour I like"], "Ask and count."),
                 q("'How many pets do you have?' collects...", "\U0001F522", "discrete data: whole numbers you count", ["categorical data", "no data", "a story"], "0, 1, 2, 3: counted whole numbers."),
                 q("'Which pet would you most like?' collects...", "\U0001F431", "categorical data: a category, not a count", ["discrete data: numbers you count", "no data", "a story"], "Cat, dog, fish, rabbit: categories."),
                 q("The same data as a table, a bar chart and a pictogram is...", "\U0001F4CA", "one set of data shown three ways", ["three different surveys", "wrong twice", "a bug"], "Different views, same numbers."),
             ]},
             "Problems, recording, views."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3MD.01", "3MD.02", "3MD.03"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about data problems, recording and views."], [], ["Read, look, tap."]),
             {"items": [
                 q("Solving a problem with data means...", "\U0001F4CA", "collecting data and reading what it says", ["guessing quickly", "asking one friend", "drawing a picture"], "Collect, then interpret."),
                 q("Which is discrete data?", "\U0001F522", "the number of pets each child has", ["each child's favourite colour", "a story", "a song"], "Whole numbers you count."),
                 q("Which is categorical data?", "\U0001F3A8", "each child's favourite colour", ["the number of pets", "how tall each child is", "the temperature"], "A category, not a count."),
                 q("You tap each child's answer into a form on a tablet. You are...", "\U0001F4F1", "recording data on a computing device", ["playing a game", "sending an email", "making a mistake"], "The tablet is a computing device, and the form records each answer."),
                 q("Which view shows the biggest at a glance?", "\U0001F4CA", "the bar chart", ["the table", "the alphabet", "the calendar"], "Tallest bar, biggest count."),
                 q("Which view gives the exact number for every row?", "\U0001F4CB", "the table", ["the bar chart", "the pictogram", "a photo"], "Tables hold exact numbers."),
                 q("How many chairs for the concert? The data to collect is...", "\U0001FA91", "how many parents are coming", ["the colour of the chairs", "the songs", "the weather"], "Count what the problem needs."),
             ]},
             "That is the whole lesson finished. You know which problems data solves, how to record it, and three ways to show it."),
    ],
}


LESSON["about"] = [
    "Spot a problem that can be solved by collecting and reading data.",
    "Record discrete data and categorical data with a form on a computing device.",
    "Show the same data as a table, a bar chart and a pictogram.",
    "Choose the view that answers a question best.",
]

LESSON["lecture"] = [
    part("\U0001F50D", "Problems data solves",
         "Which snack to sell, how many chairs to put out, when the playground is busiest: each is answered by collecting data - asking or counting - and interpreting it, reading what the numbers say. Not every problem is a data problem, but these are."),
    part("\U0001F522", "Discrete and categorical",
         "Discrete data is whole numbers you count: 0 pets, 1 pet, 2 pets. Categorical data is a category: cat, dog, fish. The same eight children gave both kinds: how many pets they have, and which pet they would most like. A form on a tablet recorded each, counting the answers as they came in."),
    part("\U0001F4CA", "Three views",
         "A digital tool can show the same data three ways. A table gives exact numbers. A bar chart shows the biggest at a glance. A pictogram draws one picture for each one. Counts and categories both work: a bar for 2 pets, or a bar for cats. The views never disagree, because they are the same data."),
    part("\U0001F914", "Which view?",
         "Choose the view for the question. Exactly how many? The table. Which is biggest? The bar chart. Count them by eye? The pictogram. Interpreting data is reading the right view."),
]

LESSON["words"] = [
    word("data", "\U0001F4CA", "Facts collected by asking or counting.",
         ["The pet data.", "Collect the data first."]),
    word("interpret", "\U0001F50D", "To read what data says.",
         ["Interpret the chart: 1 pet is most common.", "Collect, then interpret."]),
    word("discrete", "\U0001F522", "Data in whole numbers you count.",
         ["Number of pets is discrete data.", "Discrete data never has halves."]),
    word("categorical", "\U0001F3A8", "Data that is a category, like a colour or a kind of pet.",
         ["Favourite pet is categorical data.", "Cat, dog, fish, rabbit: categories."]),
    word("bar chart", "\U0001F4CA", "A chart where a taller bar means a bigger count.",
         ["The bar chart shows 1 pet is biggest.", "Read the bar chart."]),
    word("pictogram", "\U0001F431", "A chart with one picture for each one.",
         ["Count the pictures in the pictogram.", "A pictogram is easy to count."]),
]

LESSON["home"] = [
    home("A problem at home", "A grown-up",
         ["Find a problem at home that counting could solve: which cereal to buy, when the bathroom is busiest.",
          "Collect the data for a week: a tally on the fridge.",
          "Read it. What does it say to do?"],
         "Collect, then interpret."),
    home("Three views of one count", "Paper, bricks, stickers",
         ["Count something: shoes by colour.",
          "Show it as a table of numbers, a bar of bricks per colour, and a row of stickers per shoe.",
          "Which view showed the biggest fastest?"],
         "Same data, three ways."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you debugged programs with two bugs in them, asked a partner when you were stuck, and turned each mistake into a rule."
LESSON["warmup"] = [
    q("To find out which fruit most of the class likes, you could...", "\U0001F34E", "ask each child and keep a tally", ["guess", "ask one friend", "eat all the fruit"], "Asking everyone and tallying is collecting data."),
    q("On a bar chart, what does a taller bar mean?", "\U0001F4CA", "a bigger number", ["a smaller number", "a newer bar", "a different colour"], "The taller the bar, the bigger the count."),
]
