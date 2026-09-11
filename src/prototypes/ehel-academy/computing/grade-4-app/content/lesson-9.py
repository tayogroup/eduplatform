# -*- coding: utf-8 -*-
"""Lesson 9 - Databases.

0059 Stage 4 Managing Data: 4MD.07 identify data, records and fields within
a data table; 4MD.05 appropriate data types for a field; 4MD.04 sort data
into a required order, ascending, descending and alphabetical; 4MD.06 use a
database to answer a single question.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "databases",
    "title": "Databases",
    "blurb": "Point to the records, fields and data in a table, choose the right data type for each field, sort the table into any order, and use a filter to answer one question from the data.",
    "steps": [
        step("demo", "Records, fields, data", "\U0001F4CB", "Table reader", ["4MD.07"],
             "A database table has three parts. Press <b>Next</b> to meet them.",
             explain(
                 ["A record is one row: everything about one thing.", "A field is one column: one kind of fact about everything.", "Data is one cell: one fact about one thing."],
                 ["The class pets table. Amal's row is her record.", "The pet column is a field.", "'cat' in Amal's row under pet is one piece of data."],
                 ["Children mix up record and field.", "Record: across, one thing. Field: down, one kind of fact."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F4CB", "cap": "A database <b>table</b>: rows and columns of facts about the class pets.", "say": "A database table: rows and columns of facts. This one is about the class pets."},
                 {"pic": "➡️", "cap": "A <b>record</b> is one row: everything about ONE thing. Amal's record: cat, 9, Hilltown.", "say": "A record is one row: everything about one thing. Amal's record says cat, 9, Hilltown."},
                 {"pic": "⬇️", "cap": "A <b>field</b> is one column: ONE kind of fact about everything. The pet field: cat, dog, fish...", "say": "A field is one column: one kind of fact about everything. The pet field holds cat, dog, fish, and so on."},
                 {"pic": "\U0001F3AF", "cap": "<b>Data</b> is one cell: one fact about one thing. Amal's pet: cat.", "say": "Data is one cell: one fact about one thing. Amal's pet: cat.", "sound": "ding"},
             ]},
             "Record across, field down, data in a cell."),

        step("tableparts", "Tap the record, the field, the data", "\U0001F3AF", "Table tapper", ["4MD.07"],
             "The class pets table. Tap what each task asks for: a whole record, a whole field, or one piece of data.",
             explain(
                 ["Record: tap the name at the start of a row.", "Field: tap the heading at the top of a column.", "Data: tap one cell."],
                 ["Sami's record: tap Sami.", "The age field: tap the age heading.", "Zara's pet: tap the cell in Zara's row under pet."],
                 [],
                 ["Read the task, tap the right thing."]),
             {"rows": [
                 {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "pet": "cat", "age": 9, "town": "Hilltown"},
                 {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "pet": "dog", "age": 8, "town": "Riverside"},
                 {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "pet": "fish", "age": 10, "town": "Hilltown"},
                 {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "pet": "rabbit", "age": 8, "town": "Riverside"},
                 {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "pet": "hamster", "age": 7, "town": "Greenfield"},
              ],
              "fields": [{"id": "pet", "label": "pet"}, {"id": "age", "label": "age"}, {"id": "town", "label": "town"}],
              "tasks": [
                  {"kind": "record", "target": "Sami", "ask": "Tap the <b>record</b> for Sami: everything about him."},
                  {"kind": "field", "target": "age", "ask": "Tap the <b>field</b> that holds everyone's age."},
                  {"kind": "data", "target": ["Zara", "pet"], "ask": "Tap the piece of <b>data</b> that says what pet Zara has."},
                  {"kind": "field", "target": "town", "ask": "Tap the <b>field</b> that holds the towns."},
                  {"kind": "data", "target": ["Omar", "age"], "ask": "Tap the piece of <b>data</b> that says how old Omar is."},
                  {"kind": "record", "target": "Nora", "ask": "Tap Nora's whole <b>record</b>."},
              ]},
             "Records, fields and data, all found."),

        step("sort", "Which data type?", "\U0001F5C2️", "Type chooser", ["4MD.05"],
             "Every field has a data type: text, number, date or currency. Which type should this field have?",
             explain(
                 ["Text: words. Number: a count or a measure you might add or sort. Date: a day, month and year. Currency: money."],
                 ["A pet's name is text.", "Its age is a number.", "Its birthday is a date.", "What its food costs is currency."],
                 ["Children make everything text.", "A number stored as text cannot be sorted or added properly."],
                 ["Read the field, tap its type."]),
             {"ask": "Which data type?",
              "bins": [{"id": "text", "label": "Text", "pic": "\U0001F524"}, {"id": "number", "label": "Number", "pic": "\U0001F522"}, {"id": "date", "label": "Date", "pic": "\U0001F4C5"}, {"id": "currency", "label": "Currency", "pic": "\U0001F4B7"}],
              "items": [
                  {"pic": "\U0001F431", "label": "the pet's name", "bin": "text", "why": "Words."},
                  {"pic": "\U0001F382", "label": "the pet's age in years", "bin": "number", "why": "A count you can sort."},
                  {"pic": "\U0001F4C5", "label": "the day the pet was born", "bin": "date", "why": "Day, month, year."},
                  {"pic": "\U0001F4B7", "label": "what its food costs a week", "bin": "currency", "why": "Money."},
                  {"pic": "⚖️", "label": "its weight in kilograms", "bin": "number", "why": "A measure."},
                  {"pic": "\U0001F3E0", "label": "the town it lives in", "bin": "text", "why": "A word."},
                  {"pic": "\U0001F489", "label": "the date of its last vet visit", "bin": "date", "why": "A date."},
                  {"pic": "\U0001F4B0", "label": "how much the pet cost to buy", "bin": "currency", "why": "Money."},
              ]},
             "Text, number, date, currency: a type for every field."),

        step("datasort", "Sort it into order", "\U0001F522", "Data sorter", ["4MD.04"],
             "Sort the table by a field, ascending or descending, then answer from the top or the bottom of the sorted list.",
             explain(
                 ["Ascending means going up: smallest first, or A first. Descending means going down: biggest first, or Z first.", "Sorting by a field puts every record in that order."],
                 ["Sort by height, descending: the tallest is at the top.", "Sort by age, ascending: the youngest is at the top.", "Sort by pet, ascending: alphabetical, budgie before cat."],
                 ["Children sort the right field the wrong way.", "Ascending goes UP from the top: small to big. Read which way the task wants."],
                 ["Pick the field, pick the direction, press Sort, answer."]),
             {"rows": [
                 {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "age": 9, "height": 134, "pet": "cat"},
                 {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "age": 8, "height": 128, "pet": "dog"},
                 {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "age": 10, "height": 141, "pet": "fish"},
                 {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "age": 8, "height": 125, "pet": "rabbit"},
                 {"name": "Leo", "pic": "\U0001F466\U0001F3FB", "age": 9, "height": 137, "pet": "budgie"},
                 {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "age": 7, "height": 122, "pet": "hamster"},
              ],
              "fields": [{"id": "age", "label": "age", "numeric": True}, {"id": "height", "label": "height (cm)", "numeric": True}, {"id": "pet", "label": "pet"}],
              "tasks": [
                  {"ask": "Sort by <b>height</b>, <b>descending</b> (tallest first).", "field": "height", "dir": "desc", "check": "first",
                   "then": {"ask": "Who is at the TOP: the tallest?", "opts": [opt("Zara", True), opt("Leo", False), opt("Nora", False)], "why": "141 cm is the biggest, so descending puts Zara first."}},
                  {"ask": "Sort by <b>age</b>, <b>ascending</b> (youngest first).", "field": "age", "dir": "asc", "check": "first",
                   "then": {"ask": "Who is at the TOP: the youngest?", "opts": [opt("Nora", True), opt("Zara", False), opt("Sami", False)], "why": "Nora is 7, the smallest age, so ascending puts her first."}},
                  {"ask": "Sort by <b>pet</b>, <b>ascending</b> (A to Z).", "field": "pet", "dir": "asc", "check": "first",
                   "then": {"ask": "Whose pet comes FIRST alphabetically?", "opts": [opt("Leo", True), opt("Amal", False), opt("Omar", False)], "why": "Budgie starts with b, before cat, dog, fish, hamster and rabbit."}},
                  {"ask": "Sort by <b>pet</b>, <b>descending</b> (Z to A).", "field": "pet", "dir": "desc", "check": "first",
                   "then": {"ask": "Whose pet is at the TOP now?", "opts": [opt("Omar", True), opt("Leo", False), opt("Nora", False)], "why": "Rabbit starts with r, the last letter of these, so descending puts it first."}},
              ]},
             "Ascending, descending, alphabetical: any order you need."),

        step("filter", "Answer one question", "\U0001F50D", "Question answerer", ["4MD.06"],
             "A database answers a question when you filter it: choose the field, the test and the value, and only the matching records stay. Answer each question from what is left.",
             explain(
                 ["To answer 'who is older than 8?', filter the age field for more than 8. The records that match stay; count them."],
                 ["Who has a rabbit? Field pet, is, rabbit. One record.", "Who is older than 8? Field age, is more than, 8. Three records."],
                 ["Children filter the right field for the wrong value.", "Read the question twice: which field, which value, which test?"],
                 ["Build the filter, press Filter, count, answer."]),
             {"rows": [
                 {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "pet": "cat", "age": 9, "club": "art"},
                 {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "pet": "dog", "age": 8, "club": "football"},
                 {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "pet": "fish", "age": 10, "club": "music"},
                 {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "pet": "rabbit", "age": 8, "club": "art"},
                 {"name": "Leo", "pic": "\U0001F466\U0001F3FB", "pet": "budgie", "age": 9, "club": "football"},
                 {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "pet": "hamster", "age": 7, "club": "art"},
              ],
              "fields": [
                  {"id": "pet", "label": "pet", "values": ["cat", "dog", "fish", "rabbit", "budgie", "hamster"]},
                  {"id": "age", "label": "age", "values": [7, 8, 9, 10], "numeric": True},
                  {"id": "club", "label": "club", "values": ["art", "football", "music"]},
              ],
              "tasks": [
                  {"ask": "Who is <b>older than 8</b>?", "spec": {"field": "age", "op": "gt", "value": 8},
                   "then": {"ask": "How many children are older than 8?", "opts": [opt("3", True), opt("2", False), opt("4", False)], "why": "Amal 9, Zara 10, Leo 9."}},
                  {"ask": "Who has a <b>rabbit</b>?", "spec": {"field": "pet", "op": "eq", "value": "rabbit"},
                   "then": {"ask": "How many children have a rabbit?", "opts": [opt("1", True), opt("2", False), opt("0", False)], "why": "Only Omar."}},
                  {"ask": "Who goes to the <b>art</b> club?", "spec": {"field": "club", "op": "eq", "value": "art"},
                   "then": {"ask": "How many go to the art club?", "opts": [opt("3", True), opt("1", False), opt("6", False)], "why": "Amal, Omar and Nora."}},
                  {"ask": "Who is <b>younger than 9</b>?", "spec": {"field": "age", "op": "lt", "value": 9},
                   "then": {"ask": "How many children are younger than 9?", "opts": [opt("3", True), opt("2", False), opt("5", False)], "why": "Sami 8, Omar 8, Nora 7."}},
              ]},
             "Four questions, answered by four filters."),

        step("questions", "Check: databases", "\U0001F4DD", "Database checker", ["4MD.04", "4MD.05", "4MD.06", "4MD.07"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Records, fields, data, types, sorting, filtering."], [], ["Read, think, tap."]),
             {"items": [
                 q("One row of a table, everything about one pet, is...", "➡️", "a record", ["a field", "a cell", "a form"], "Record: across."),
                 q("The best data type for 'date of birth' is...", "\U0001F4C5", "date", ["text", "currency", "number"], "Day, month, year."),
                 q("Sorting height ASCENDING puts...", "\U0001F522", "the shortest at the top", ["the tallest at the top", "them in alphabetical order", "nobody at the top"], "Ascending goes up from small."),
             ]},
             "Record, field, type, sort, filter."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4MD.04", "4MD.05", "4MD.06", "4MD.07"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["The parts of a table, data types, sorting and filtering."], [], ["Read, look, tap."]),
             {"items": [
                 q("One column of a table, one kind of fact about everyone, is...", "⬇️", "a field", ["a record", "a database", "a form"], "Field: down."),
                 q("One cell - Amal's pet, cat - is...", "\U0001F3AF", "one piece of data", ["a record", "a field", "a table"], "One fact about one thing."),
                 q("Which field should have the currency type?", "\U0001F4B7", "what the pet's food costs", ["the pet's name", "its birthday", "its weight"], "Money is currency."),
                 q("If ages are stored as TEXT, what goes wrong?", "\U0001F524", "they cannot be sorted or added properly", ["nothing", "they turn into dates", "they disappear"], "Numbers need the number type."),
                 q("Sorting pets Z to A is...", "\U0001F521", "descending alphabetical", ["ascending", "numeric", "a filter"], "Descending goes down from Z."),
                 q("To answer 'who is older than 8?' you...", "\U0001F50D", "filter the age field for more than 8", ["sort by name", "delete the young ones", "guess"], "A filter keeps the matching records."),
                 q("After a filter, the records you see are...", "✅", "only the ones that match", ["all of them", "none of them", "sorted by name"], "Matching records stay."),
             ]},
             "That is the whole lesson finished. You read a table, type its fields, sort it and question it."),
    ],
}


LESSON["about"] = [
    "Point to a record, a field and a piece of data in a table.",
    "Choose the right data type for a field: text, number, date or currency.",
    "Sort a table ascending, descending and alphabetically.",
    "Use a filter to answer a single question from a database.",
]

LESSON["lecture"] = [
    part("\U0001F4CB", "Records, fields, data",
         "A database table is rows and columns. A record is one row: everything about one thing. A field is one column: one kind of fact about everything. Data is one cell: one fact about one thing. Amal's row is a record, the pet column is a field, and 'cat' is data."),
    part("\U0001F524", "Data types",
         "Every field has a type. Text for words, number for counts and measures, date for a day, month and year, currency for money. Store an age as text and the database cannot sort it or add it properly, so choose the type for the job."),
    part("\U0001F522", "Sorting",
         "Sorting by a field puts every record in that field's order. Ascending goes up: smallest first, or A first. Descending goes down: biggest first, or Z first. Sort by height descending and the tallest is at the top; sort by pet ascending and budgie comes before cat."),
    part("\U0001F50D", "Answering a question",
         "A database answers a question when you filter it. Who is older than 8? Field age, test more than, value 8. Only the matching records stay, and you count them. One question, one filter, one answer, straight from the data."),
]

LESSON["words"] = [
    word("record", "➡️", "One row of a table: everything about one thing.",
         ["Amal's record.", "Add a record for the new pet."]),
    word("field", "⬇️", "One column of a table: one kind of fact about everything.",
         ["The age field.", "Sort by the pet field."]),
    word("data type", "\U0001F524", "What kind of thing a field holds: text, number, date or currency.",
         ["Give the field the date type.", "The data type is number."]),
    word("ascending", "\U0001F53C", "Going up: smallest first, or A first.",
         ["Sort ascending: the youngest at the top.", "A to Z is ascending."]),
    word("descending", "\U0001F53D", "Going down: biggest first, or Z first.",
         ["Sort descending: the tallest at the top.", "Z to A is descending."]),
    word("filter", "\U0001F50D", "A test that keeps only the records that match it.",
         ["Filter for age more than 8.", "The filter left three records."]),
]

LESSON["home"] = [
    home("A table of toys", "Paper, a ruler",
         ["Draw a table: one row per toy, with fields for name, colour, size in centimetres and the year you got it.",
          "Point to one record, one field, one piece of data.",
          "Give each field a type. Which field is a number? Which is a date?"],
         "Rows, columns, cells, types."),
    home("Sort the family", "Everyone at home",
         ["Sort everyone by height, descending. Then by birthday, ascending. Then by first name, A to Z.",
          "Who is first each time? Does the order change?",
          "Answer one question with a filter: who is taller than 150 cm?"],
         "Sorting changes the order; a filter picks records."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you compared a paper database with a digital one, collected data with a form, and told raw data from the information it becomes."
LESSON["warmup"] = [
    q("A class list is in alphabetical order. Who comes first: Zara or Amal?", "\U0001F524", "Amal", ["Zara", "they come together", "neither"], "In alphabetical order, names that start with A come first."),
    q("A table of pets shows only the dogs after you choose 'dog'. What did you use?", "\U0001F415", "a filter", ["a sort", "a password", "a delete key"], "A filter hides the rows that do not match."),
]
