# -*- coding: utf-8 -*-
"""Lesson 10 - Spreadsheets.

0059 Stage 3 Managing Data: 3MD.04 spreadsheets are rows and columns of
cells and data can be entered into the cells; 3MD.05 format cells according
to their purpose - date, currency, text; 3MD.06 select data based on its
characteristics to solve problems; 3MD.03 record data using computing
devices.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "spreadsheets",
    "title": "Spreadsheets",
    "blurb": "Find your way round a spreadsheet by column letter and row number, put data into cells, format them as dates and money, and filter a table to pick out just the rows you need.",
    "steps": [
        step("demo", "Rows, columns, cells", "\U0001F4D1", "Grid reader", ["3MD.04"],
             "A spreadsheet is a grid. Press <b>Next</b> to learn its parts.",
             explain(
                 ["A spreadsheet is a grid of cells. Columns go down and have letters; rows go across and have numbers.", "Every cell has a name: its column letter and its row number."],
                 ["Column B, row 3: cell B3.", "You can put data into any cell: a word, a number, a date, an amount of money."],
                 ["Children say the row first.", "Letter first, then number: B3, never 3B."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F4D1", "cap": "A spreadsheet is a grid of <b>cells</b>.", "say": "A spreadsheet is a grid of cells."},
                 {"pic": "\U0001F1E6\U0001F1E7\U0001F1E8", "cap": "<b>Columns</b> go down. Each has a letter: A, B, C.", "say": "Columns go down. Each one has a letter: A, B, C."},
                 {"pic": "1️⃣2️⃣3️⃣", "cap": "<b>Rows</b> go across. Each has a number: 1, 2, 3.", "say": "Rows go across. Each one has a number: one, two, three."},
                 {"pic": "\U0001F3AF", "cap": "A cell is named by its column and its row: column B, row 3 is cell <b>B3</b>.", "say": "A cell is named by its column and its row. Column B, row 3 is cell B3. Letter first, then number."},
                 {"pic": "✏️", "cap": "Data goes into cells: a name, a number, a date, money.", "say": "Data goes into the cells: a name, a number, a date, an amount of money.", "sound": "type"},
             ]},
             "Columns have letters, rows have numbers, cells have both."),

        step("sheet", "Find, fill, format", "\U0001F4D1", "Cell filler", ["3MD.04", "3MD.03", "3MD.05"],
             "The class pocket-money sheet. Find cells by name, put data in, and format the money column.",
             explain(
                 ["To find a cell, read its column letter across the top and its row number down the side.", "To put data in, tap the cell and choose the value.",
                  "To format, choose what kind of data the cell holds: text, a number, a date, or currency, which is money."],
                 ["Tap the cell that holds Sami: column A, row 3.", "Put 4 in cell C4.", "Format column C as currency, and every amount shows as pounds and pence."],
                 ["Children tap the right row in the wrong column.", "Letter across the top, number down the side. Both."],
                 ["Read the task, find the cell, do it."]),
             {"cols": ["A", "B", "C"], "rows": 4,
              "cells": {"A1": "Name", "B1": "Age", "C1": "Pocket money", "A2": "Amal", "B2": 8, "C2": 2, "A3": "Sami", "B3": 7, "C3": 3, "A4": "Zara", "B4": 8},
              "formats": {"A": "text"},
              "tasks": [
                  {"kind": "find", "ask": "Tap the cell that holds <b>Sami</b>.", "value": "Sami"},
                  {"kind": "enter", "ask": "Zara gets 4 pounds. Put <b>4</b> in cell <b>C4</b>.", "cell": "C4", "value": 4, "values": [4, 8, 2]},
                  {"kind": "format", "ask": "Column C is money. Tap the <b>C</b> at the top and format the column as <b>currency</b>.", "target": "C", "format": "currency", "why": "Money shows as pounds and pence.", "reason": "money", "hint": "Money is currency."},
                  {"kind": "find", "ask": "Tap the cell that holds <b>7</b>.", "value": 7},
                  {"kind": "format", "ask": "Column B holds ages, which are numbers. Format column <b>B</b> as <b>number</b>.", "target": "B", "format": "number", "why": "Numbers line up on the right, ready to add.", "reason": "an age", "hint": "An age is a number."},
              ]},
             "Found, filled, formatted."),

        step("sheet", "Dates and money", "\U0001F4C5", "Date formatter", ["3MD.05", "3MD.04"],
             "The bake-sale sheet. Some cells hold dates and some hold money. Format each for its purpose.",
             explain(
                 ["A cell's format tells the spreadsheet what KIND of thing it holds.", "A date cell knows it is a date; a currency cell shows the pounds sign; a text cell is just words."],
                 ["The sale dates go in column B: format it as date.", "The money raised goes in column C: format it as currency."],
                 ["Children format everything as text.", "Then the spreadsheet cannot add the money or sort the dates. Format for the purpose."],
                 ["Find the cell or column, choose the format."]),
             {"cols": ["A", "B", "C", "D"], "rows": 4,
              "cells": {"A1": "Sale", "B1": "Date", "C1": "Raised", "D1": "Stall", "A2": "Spring", "B2": "12 March", "C2": 18, "D2": "Cakes", "A3": "Summer", "B3": "20 June", "C3": 25, "D3": "Drinks", "A4": "Autumn", "B4": "3 October", "D4": "Books"},
              "formats": {"A": "text", "D": "text"},
              "tasks": [
                  {"kind": "format", "ask": "Column B holds dates. Tap <b>B</b> and format it as <b>date</b>.", "target": "B", "format": "date", "why": "Now the spreadsheet knows these are dates and can put them in order.", "reason": "a date", "hint": "12 March is a date."},
                  {"kind": "enter", "ask": "The autumn sale raised 30 pounds. Put <b>30</b> in cell <b>C4</b>.", "cell": "C4", "value": 30, "values": [30, 18, 3]},
                  {"kind": "format", "ask": "Column C holds money. Tap <b>C</b> and format it as <b>currency</b>.", "target": "C", "format": "currency", "why": "Pounds and pence, and the spreadsheet can add them up.", "reason": "money", "hint": "Money raised is currency."},
                  {"kind": "find", "ask": "Tap the cell that holds <b>Drinks</b>.", "value": "Drinks"},
                  {"kind": "format", "ask": "Cell <b>D4</b> holds the word Books. Tap it and format it as <b>text</b>.", "target": "D4", "format": "text", "why": "Words are text.", "reason": "a word", "hint": "Books is a word."},
              ]},
             "Dates as dates, money as money, words as text."),

        step("filter", "Pick out the rows you need", "\U0001F50D", "Data filterer", ["3MD.06"],
             "A table of children and their facts. Build a filter to select only the rows with a characteristic, then count them.",
             explain(
                 ["Selecting data means picking out the rows that share a characteristic: everyone with a cat, everyone older than 7.", "A filter does that in a blink, however long the table is."],
                 ["Who has a dog? Field: pet. Is: dog. Filter. The rows with a dog light up; count them.",
                  "Who is older than 7? Field: age. Is more than: 7."],
                 ["Children filter the right field for the wrong value.", "Read the question: which fact, and which value?"],
                 ["Build the filter, press Filter, answer the question."]),
             {"rows": [
                 {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "pet": "cat", "age": 8, "club": "art"},
                 {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "pet": "none", "age": 7, "club": "football"},
                 {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "pet": "dog", "age": 8, "club": "music"},
                 {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "pet": "dog", "age": 7, "club": "art"},
                 {"name": "Leo", "pic": "\U0001F466\U0001F3FB", "pet": "cat", "age": 9, "club": "football"},
                 {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "pet": "none", "age": 8, "club": "art"},
              ],
              "fields": [
                  {"id": "pet", "label": "pet", "values": ["cat", "dog", "none"]},
                  {"id": "age", "label": "age", "values": [7, 8, 9], "numeric": True},
                  {"id": "club", "label": "club", "values": ["art", "football", "music"]},
              ],
              "tasks": [
                  {"ask": "Who has a <b>dog</b>?", "spec": {"field": "pet", "op": "eq", "value": "dog"},
                   "then": {"ask": "How many children have a dog?", "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "Zara and Omar."}},
                  {"ask": "Who is <b>older than 7</b>?", "spec": {"field": "age", "op": "gt", "value": 7},
                   "then": {"ask": "How many children are older than 7?", "opts": [opt("4", True), opt("2", False), opt("6", False)], "why": "Amal, Zara, Leo and Nora: ages 8, 8, 9, 8."}},
                  {"ask": "Who goes to the <b>art</b> club?", "spec": {"field": "club", "op": "eq", "value": "art"},
                   "then": {"ask": "How many children go to the art club?", "opts": [opt("3", True), opt("2", False), opt("4", False)], "why": "Amal, Omar and Nora."}},
                  {"ask": "Who has <b>no pet</b>?", "spec": {"field": "pet", "op": "eq", "value": "none"},
                   "then": {"ask": "How many children have no pet?", "opts": [opt("2", True), opt("4", False), opt("0", False)], "why": "Sami and Nora."}},
              ]},
             "Four filters, four answers, straight from the data."),

        step("questions", "Check: spreadsheets", "\U0001F4DD", "Sheet checker", ["3MD.04", "3MD.05", "3MD.06"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Cells, formats, filters."], [], ["Read, think, tap."]),
             {"items": [
                 q("Column C, row 2 is cell...", "\U0001F3AF", "C2", ["2C", "CC", "row C"], "Letter first, then number."),
                 q("A cell holding 3 pounds 50 should be formatted as...", "\U0001F4B7", "currency", ["date", "text", "a picture"], "Money is currency."),
                 q("To pick out only the children with a cat you use...", "\U0001F50D", "a filter: pet is cat", ["a new spreadsheet", "a pictogram", "a repeat block"], "A filter selects rows by a characteristic."),
             ]},
             "Cells, formats, filters."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3MD.03", "3MD.04", "3MD.05", "3MD.06"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about the grid, the formats and the filter."], [], ["Read, look, tap."]),
             {"items": [
                 q("A spreadsheet is made of...", "\U0001F4D1", "rows and columns of cells", ["pages", "slides", "blocks"], "A grid of cells."),
                 q("Columns are named with...", "\U0001F1E6", "letters", ["numbers", "colours", "names"], "A, B, C across the top."),
                 q("Rows are named with...", "1️⃣", "numbers", ["letters", "shapes", "dates"], "1, 2, 3 down the side."),
                 q("Which cell is in column B, row 4?", "\U0001F3AF", "B4", ["4B", "B1", "D2"], "Column letter, then row number."),
                 q("'20 June' should be formatted as...", "\U0001F4C5", "date", ["currency", "number", "picture"], "It is a date."),
                 q("Formatting a money column as currency means...", "\U0001F4B7", "the amounts show as pounds and pence and can be added", ["the numbers disappear", "they become dates", "nothing changes"], "Format for the purpose."),
                 q("Filtering 'age is more than 7' selects...", "\U0001F50D", "only the rows where the age is 8 or more", ["every row", "only age 7", "the names beginning with A"], "Select by characteristic."),
                 q("Putting a number into cell C4 on a tablet is...", "✏️", "recording data in a spreadsheet", ["drawing", "a network", "a bug"], "Data entered into a cell."),
             ]},
             "That is the whole lesson finished. You can find, fill, format and filter a spreadsheet."),
    ],
}


LESSON["about"] = [
    "Name a cell by its column letter and row number, and put data into it.",
    "Format a cell for its purpose: text, number, date or currency.",
    "Select rows from a table by a characteristic, using a filter.",
    "Use a spreadsheet to record data and answer a question.",
]

LESSON["lecture"] = [
    part("\U0001F4D1", "The grid",
         "A spreadsheet is a grid of cells. Columns go down and have letters; rows go across and have numbers. Column B, row 3 is cell B3: letter first, then number. Data goes into the cells - names, numbers, dates, money."),
    part("\U0001F4B7", "Formats",
         "A cell's format says what kind of thing it holds. Text for words. Number for counts. Date for dates, so they can be sorted. Currency for money, so it shows as pounds and pence and can be added up. Format a cell for its purpose."),
    part("\U0001F50D", "Filters",
         "A filter selects the rows that share a characteristic: pet is dog, age is more than 7. The rows that match light up and the rest fade, however long the table is. Then you count, and the problem is solved."),
    part("✏️", "Recording",
         "Typing a value into a cell is recording data on a computing device. Once it is in the sheet it can be formatted, filtered, sorted and added, which is why spreadsheets are where so much of the world's data lives."),
]

LESSON["words"] = [
    word("spreadsheet", "\U0001F4D1", "A grid of cells for holding and working with data.",
         ["Open the spreadsheet.", "The class list is in a spreadsheet."]),
    word("cell", "\U0001F3AF", "One box in a spreadsheet, named by its column and row.",
         ["Put 4 in cell C4.", "Every cell has a name."]),
    word("column", "\U0001F1E6", "A line of cells going down, named with a letter.",
         ["Column C holds the money.", "Format the whole column."]),
    word("row", "1️⃣", "A line of cells going across, named with a number.",
         ["Row 3 is Sami's row.", "Each child has a row."]),
    word("format", "\U0001F4B7", "The kind of thing a cell holds: text, number, date, currency.",
         ["Format the column as currency.", "The date format puts dates in order."]),
    word("filter", "\U0001F50D", "A way of selecting only the rows with a characteristic.",
         ["Filter: pet is dog.", "The filter found two rows."]),
]

LESSON["home"] = [
    home("Paper spreadsheet", "Paper, a ruler, a pen",
         ["Draw a grid: letters across the top, numbers down the side.",
          "Fill it with your family's names, ages and favourite food.",
          "Call out cells (B2!) and read what is in them."],
         "Letter, then number."),
    home("Filter the toy box", "Toys, a grown-up",
         ["Lay out ten toys. Write three facts for each: colour, size, has wheels.",
          "Pick a rule - has wheels - and pull out only the matching toys.",
          "Count them. Try another rule."],
         "A filter selects by a characteristic."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you recorded how many pets each child has and which pet they would most like, and showed each set of data three ways."
LESSON["warmup"] = [
    q("A table has rows going across and what going down?", "\U0001F4CB", "columns", ["circles", "chapters", "wheels"], "Rows go across; columns go down."),
    q("How is six pounds fifty written as money?", "\U0001F4B7", "£6.50", ["650", "6:50", "6/50"], "Money has a £ sign, then the pounds, a dot and the pence."),
]
