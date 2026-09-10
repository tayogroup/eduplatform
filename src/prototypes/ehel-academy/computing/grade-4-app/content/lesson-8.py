# -*- coding: utf-8 -*-
"""Lesson 8 - Data and Information.

0059 Stage 4 Managing Data: 4MD.01 the differences between physical
(paper-based) and digital databases; 4MD.02 the advantages and disadvantages
of using forms when collecting data; 4MD.03 the differences between data and
information.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "data-and-information",
    "title": "Data and Information",
    "blurb": "Compare a paper database with a digital one, collect data with a form and weigh what forms are good and bad at, and tell raw data from the information it becomes.",
    "steps": [
        step("context", "Paper or digital?", "\U0001F5C4️", "Database comparer", ["4MD.01"],
             "A <b>database</b> is an organised collection of data. It can live on paper - a card index, a register - or on a computer. Tap each difference.",
             explain(
                 ["A paper database is cards in a box or a book of lists. A digital database is the same data on a computer."],
                 ["Finding one card in a box of a thousand takes minutes. A digital search takes a blink.",
                  "Paper cannot be sorted without moving every card. Digital sorts by any field at once.", "Paper works with no power and cannot be hacked from far away."],
                 ["Children think digital is better at everything.", "Paper needs no power, no login and no screen. Each has its place."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F50D", "label": "finding", "say": "Finding. Paper: flick through every card. Digital: type a name and it is there in a blink."},
                 {"pic": "\U0001F522", "label": "sorting", "say": "Sorting. Paper: move every card by hand. Digital: sort by name, then by age, then by town, in seconds."},
                 {"pic": "\U0001F4E6", "label": "space", "say": "Space. A thousand paper cards fill a box. A million digital records fit on a chip."},
                 {"pic": "\U0001F4E4", "label": "sharing", "say": "Sharing. Paper is in one place. Digital can be read by many people at once, anywhere on the network."},
                 {"pic": "\U0001F50C", "label": "power and safety", "say": "Power and safety. Paper works with no electricity and cannot be reached from far away. Digital needs power, and needs protecting with passwords and backups."},
             ], "need": 5,
              "then": {"ask": "You need to find one child's record out of a thousand. Which is faster?",
                       "opts": [opt("The digital database: search by name", True), opt("The paper cards: read every one", False), opt("They take the same time", False)],
                       "why": "A search finds it in a blink; paper means flicking through."}},
             "Paper and digital: same data, different strengths."),

        step("sort", "Paper, or digital?", "\U0001F5C2️", "Paper-digital sorter", ["4MD.01"],
             "Is this a strength of a PAPER database or of a DIGITAL one?",
             explain(
                 ["Digital: fast to search, sort and share; small; needs power and protecting.", "Paper: no power, no password, in one place, slow to search."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "A strength of paper, or of digital?",
              "bins": [{"id": "paper", "label": "Paper", "pic": "\U0001F4C7"}, {"id": "digital", "label": "Digital", "pic": "\U0001F4BB"}],
              "items": [
                  {"pic": "\U0001F50D", "label": "finds one record in a second", "bin": "digital", "why": "Search."},
                  {"pic": "\U0001F50C", "label": "works in a power cut", "bin": "paper", "why": "No electricity needed."},
                  {"pic": "\U0001F522", "label": "sorts a thousand records by age in a blink", "bin": "digital", "why": "Sort by any field."},
                  {"pic": "\U0001F465", "label": "can be read by ten people at once in different rooms", "bin": "digital", "why": "Shared over the network."},
                  {"pic": "\U0001F6E1️", "label": "cannot be hacked from far away", "bin": "paper", "why": "It is not on a network."},
                  {"pic": "\U0001F4E6", "label": "a million records fit in a pocket", "bin": "digital", "why": "Tiny storage."},
                  {"pic": "✏️", "label": "needs no login to read", "bin": "paper", "why": "Open the box."},
                  {"pic": "\U0001F4BE", "label": "a copy for safety takes one click", "bin": "digital", "why": "A backup."},
              ]},
             "Each kind has its strengths."),

        step("form", "Collect it with a form", "\U0001F4DD", "Form filler", ["4MD.02"],
             "A <b>form</b> asks everyone the same question with the same choices. Eight children say how they get to school. Record each on the form.",
             explain(
                 ["A form collects data the same way from everyone: the same question, the same choices, so the answers can be counted."],
                 ["Amal walks. Tap walk, submit. The table counts the walkers."],
                 ["Children tap what THEY do, not what the child said.", "Record the answer you heard."],
                 ["Listen, tap, submit."]),
             {"question": "How do you get to school?", "columns": ["Way", "Children"],
              "options": [{"id": "walk", "t": "walk", "pic": "\U0001F6B6"}, {"id": "bike", "t": "bike", "pic": "\U0001F6B2"}, {"id": "car", "t": "car", "pic": "\U0001F697"}, {"id": "bus", "t": "bus", "pic": "\U0001F68C"}],
              "people": [
                  {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "say": "I walk, with my brother.", "answer": "walk"},
                  {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "say": "Bus. Number 12.", "answer": "bus"},
                  {"name": "Zara", "pic": "\U0001F467\U0001F3FD", "say": "Dad drives me in the car.", "answer": "car"},
                  {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "say": "I ride my bike.", "answer": "bike"},
                  {"name": "Leo", "pic": "\U0001F466\U0001F3FB", "say": "I walk. It is only round the corner.", "answer": "walk"},
                  {"name": "Nora", "pic": "\U0001F467\U0001F3FB", "say": "The bus, with Sami.", "answer": "bus"},
                  {"name": "Karim", "pic": "\U0001F466\U0001F3FE", "say": "Walk.", "answer": "walk"},
                  {"name": "Maya", "pic": "\U0001F467\U0001F3FC", "say": "Car, because we live far away.", "answer": "car"},
              ]},
             "Eight answers, one form, counted."),

        step("sort", "Forms: advantage, or disadvantage?", "\U0001F5C2️", "Form weigher", ["4MD.02"],
             "Forms are good at some things and bad at others. Is this an advantage of using a form, or a disadvantage?",
             explain(
                 ["Advantages: everyone answers the same question, answers are easy to count, nothing is missed, and a digital form counts itself.",
                  "Disadvantages: you can only answer with the choices given, a wrong choice list gives wrong data, and a form cannot ask 'why'."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Advantage, or disadvantage?",
              "bins": [{"id": "adv", "label": "Advantage", "pic": "\U0001F44D"}, {"id": "dis", "label": "Disadvantage", "pic": "\U0001F44E"}],
              "items": [
                  {"pic": "\U0001F522", "label": "the answers are easy to count", "bin": "adv", "why": "Same choices, so they add up."},
                  {"pic": "\U0001F6B6", "label": "Maya scooters, and scooter is not a choice", "bin": "dis", "why": "Only the choices given can be answered."},
                  {"pic": "\U0001F465", "label": "everyone is asked exactly the same question", "bin": "adv", "why": "Fair and comparable."},
                  {"pic": "❓", "label": "it cannot ask why", "bin": "dis", "why": "A tick box has no room for a reason."},
                  {"pic": "\U0001F4BB", "label": "a digital form counts the answers itself", "bin": "adv", "why": "No adding up by hand."},
                  {"pic": "\U0001F4DD", "label": "a badly written question gives wrong data from everyone", "bin": "dis", "why": "One mistake, copied a hundred times."},
                  {"pic": "✅", "label": "no question gets forgotten", "bin": "adv", "why": "The form asks every one."},
              ]},
             "Forms count well and cannot ask why."),

        step("context", "Data, or information?", "\U0001F4A1", "Data-info thinker", ["4MD.03"],
             "<b>Data</b> is the raw facts: 3, walk, red. <b>Information</b> is what the data means once it is organised: 'most children walk'. Tap each step from one to the other.",
             explain(
                 ["Data on its own tells you nothing: 3, 2, 2, 1. Organise it, label it, and it becomes information: most children walk to school."],
                 ["'25' is data. '25 degrees, so it is a warm day' is information.", "A list of pets is data. 'Cats are the most common pet in our class' is information."],
                 ["Children use the two words for the same thing.", "Data is the facts. Information is the meaning."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F522", "label": "data: raw facts", "say": "Data: raw facts with no meaning yet. Walk, bus, car, bike, walk, bus, walk, car."},
                 {"pic": "\U0001F4CB", "label": "organised", "say": "Organised: put in a table and counted. Walk 3, bus 2, car 2, bike 1."},
                 {"pic": "\U0001F4A1", "label": "information: the meaning", "say": "Information: what it means. Most children walk to school, and only one cycles."},
                 {"pic": "\U0001F3AF", "label": "used", "say": "Used. The school decides it needs more coat pegs by the door for the walkers, and one bike rack is enough."},
             ], "need": 4,
              "then": {"ask": "'Walk, bus, car, walk' is data. Which of these is INFORMATION made from it?",
                       "opts": [opt("Most of these children walk to school", True), opt("Walk", False), opt("Bus, car", False)],
                       "why": "Information is the meaning you get when data is organised."}},
             "Data is facts; information is meaning."),

        step("sort", "Data, or information?", "\U0001F5C2️", "Data sorter", ["4MD.03"],
             "Is this a raw fact (data) or a meaning made from facts (information)?",
             explain(
                 ["Data: a number, a word, a reading, on its own.", "Information: what organised data tells you."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Data, or information?",
              "bins": [{"id": "data", "label": "Data", "pic": "\U0001F522"}, {"id": "info", "label": "Information", "pic": "\U0001F4A1"}],
              "items": [
                  {"pic": "\U0001F321️", "label": "21", "bin": "data", "why": "A raw number."},
                  {"pic": "☀️", "label": "it is warm enough to play outside", "bin": "info", "why": "Meaning made from the temperature."},
                  {"pic": "\U0001F431", "label": "cat, dog, cat, fish, cat", "bin": "data", "why": "A raw list."},
                  {"pic": "\U0001F4CA", "label": "cats are the most common pet in the class", "bin": "info", "why": "Organised and understood."},
                  {"pic": "\U0001F45F", "label": "size 2, size 1, size 3, size 2", "bin": "data", "why": "Raw readings."},
                  {"pic": "\U0001F6D2", "label": "the shop should order more size 2 shoes", "bin": "info", "why": "A meaning you can act on."},
                  {"pic": "\U0001F6B6", "label": "walk", "bin": "data", "why": "One answer on a form."},
                  {"pic": "\U0001F9E5", "label": "most children walk, so we need more coat pegs", "bin": "info", "why": "The data organised and used."},
              ]},
             "Facts are data; meaning is information."),

        step("questions", "Check: data and information", "\U0001F4DD", "Data checker", ["4MD.01", "4MD.02", "4MD.03"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Paper and digital, forms, data and information."], [], ["Read, think, tap."]),
             {"items": [
                 q("Which database can be searched in a second?", "\U0001F50D", "the digital one", ["the paper one", "neither", "both take the same"], "Search is digital's strength."),
                 q("A form's biggest weakness is...", "\U0001F4DD", "you can only answer with the choices given", ["it is easy to count", "everyone gets the same question", "it is quick"], "No room for scooter, or for why."),
                 q("'Cats are the most common pet here' is...", "\U0001F4A1", "information", ["data", "a form", "a database"], "Meaning made from data."),
             ]},
             "Paper, digital, form, meaning."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4MD.01", "4MD.02", "4MD.03"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Databases on paper and on computers, forms, data and information."], [], ["Read, look, tap."]),
             {"items": [
                 q("A database is...", "\U0001F5C4️", "an organised collection of data", ["a kind of form", "a single number", "a printer"], "Organised data, paper or digital."),
                 q("Which is a strength of a PAPER database?", "\U0001F4C7", "it works with no power", ["it searches in a second", "it sorts by any field", "ten people can read it at once"], "No electricity needed."),
                 q("Which is a strength of a DIGITAL database?", "\U0001F4BB", "it sorts a thousand records in a blink", ["it needs no login", "it cannot be hacked", "it takes up a whole box"], "Fast to search and sort."),
                 q("An advantage of a form is...", "\U0001F44D", "everyone answers the same question, so answers can be counted", ["it can ask why", "any answer is possible", "it is slow"], "Same question, same choices."),
                 q("A disadvantage of a form is...", "\U0001F44E", "you can only pick from the choices given", ["it counts itself", "it forgets no question", "it is fair"], "Scooter was not a choice."),
                 q("'7, 8, 8, 9' on its own is...", "\U0001F522", "data", ["information", "a form", "a database"], "Raw facts."),
                 q("Data becomes information when it is...", "\U0001F4A1", "organised and given meaning", ["deleted", "written twice", "printed"], "Organise it, understand it."),
             ]},
             "That is the whole lesson finished. You compare databases, weigh forms, and know data from information."),
    ],
}


LESSON["about"] = [
    "Compare a paper database with a digital database.",
    "Collect data with a form and count the answers.",
    "Weigh the advantages and disadvantages of forms.",
    "Tell data from information.",
]

LESSON["lecture"] = [
    part("\U0001F5C4️", "Paper and digital databases",
         "A database is an organised collection of data. On paper it is a box of cards or a register; on a computer it is the same data stored digitally. Digital is fast to search, sort and share, and tiny. Paper needs no power or login and cannot be reached from far away. Each has its place."),
    part("\U0001F4DD", "Forms",
         "A form asks everyone the same question with the same choices, so the answers can be counted, and a digital form counts them itself. But a form can only be answered with the choices it offers, it cannot ask why, and a badly written question gives wrong data from everyone."),
    part("\U0001F522", "Data",
         "Data is the raw facts: 21, walk, cat, size 2. On its own it means nothing. Walk, bus, car, walk is a list, and a list tells you nothing until you organise it."),
    part("\U0001F4A1", "Information",
         "Information is what data means once it is organised: most children walk to school; cats are the most common pet; it is warm enough to play outside. Information is what you act on. Data in, information out."),
]

LESSON["words"] = [
    word("database", "\U0001F5C4️", "An organised collection of data, on paper or on a computer.",
         ["The library database.", "A card index is a paper database."]),
    word("digital", "\U0001F4BB", "Stored on a computer.",
         ["A digital database can be searched.", "Digital data needs power."]),
    word("form", "\U0001F4DD", "A set of questions with choices, asked the same way to everyone.",
         ["Fill in the form.", "A form collects data."]),
    word("data", "\U0001F522", "Raw facts: numbers, words, readings.",
         ["21 is data.", "Collect the data first."]),
    word("information", "\U0001F4A1", "The meaning you get when data is organised.",
         ["Most children walk: that is information.", "Turn the data into information."]),
]

LESSON["home"] = [
    home("A form for the family", "Paper, a pen",
         ["Write a form with one question and four choices: favourite fruit, say.",
          "Ask everyone at home. Did anyone want an answer that was not a choice?",
          "Count the answers and write one sentence of information from them."],
         "The form counts; the sentence is information."),
    home("Paper card index", "Index cards, a box",
         ["Make a card for each book on a shelf: title, author, colour.",
          "Find every red book by looking through the cards. Time it.",
          "Now imagine typing 'red' into a search. Which is faster? Which works in a power cut?"],
         "Paper and digital, each with strengths."),
]
