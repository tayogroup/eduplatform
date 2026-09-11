# -*- coding: utf-8 -*-
"""Lesson 2 - Waste Watchers.

0838 Stage 4 Research: 4Rc.01 conduct investigations, using interviews or
questionnaires, making observations and taking appropriate measurements;
4Rf.01 select, organise and record information from sources and findings
from research in simple charts or diagrams. The topic is the waste at our
school: the litter observed on the playground after lunch, a questionnaire
about what we do with an empty carton, the rain gauge read every morning for
the compost project, and every finding recorded by what it is.
"""
from _kit import explain, step, opt, q, glyph, part, word, home

CLASS = [
    ("amal", "Amal", "\U0001F467\U0001F3FE"), ("sami", "Sami", "\U0001F466\U0001F3FE"), ("nora", "Nora", "\U0001F467\U0001F3FD"),
    ("yusuf", "Yusuf", "\U0001F466\U0001F3FD"), ("hana", "Hana", "\U0001F467\U0001F3FF"), ("tariq", "Tariq", "\U0001F466\U0001F3FF"),
]


def people(answers):
    return [{"id": i, "name": n, "pic": p, "answer": a, "say": s} for (i, n, p), (a, s) in zip(CLASS, answers)]


PLAYGROUND = (
    [glyph("\U0001F964", "bottle", "a plastic cup")] * 5 +
    [glyph("\U0001F34E", "core", "an apple core")] * 3 +
    [glyph("\U0001F4C4", "paper", "a piece of paper")] * 4 +
    [glyph("\U0001F9C3", "carton", "a juice carton")] * 2 +
    [glyph("\U0001F342", "leaf", "a fallen leaf")] * 3
)

LESSON = {
    "slug": "waste-watchers",
    "title": "Waste Watchers",
    "blurb": "What does our school throw away? Observe and count the litter after lunch, ask the class what they do with an empty carton, read the rain gauge for the compost project, and record every finding in the right chart.",
    "steps": [
        step("demo", "Choose the way that fits", "\U0001F52C", "Waste investigator", ["4Rc.01"],
             "Observe, ask, measure: you know all three. This year you CHOOSE the one that fits each question. Press <b>Next</b>.",
             explain(
                 ["An investigation picks the way that fits the question.", "What is on the ground: observe. What people do at home: ask. How much rain fell: measure."],
                 ["How many plastic cups are on the playground? You can see them: observe and count.",
                  "What do you do with your carton at home? You cannot see that: ask.",
                  "How much rain fell last night? A gauge measures it in millimetres."],
                 ["Children ask people about things they could count themselves.", "If you can see it, count it. Ask only what you cannot see."],
                 ["Press Next and match each question to its way."]),
             {"frames": [
                 {"pic": "\U0001F5D1️", "cap": "The class is investigating <b>the waste at our school</b>.", "say": "The class is investigating the waste at our school. Three questions, three ways to find out."},
                 {"pic": "\U0001F440", "cap": "<b>What is left on the playground after lunch?</b> You can see it. OBSERVE and count.", "say": "What is left on the playground after lunch? You can see it. Observe and count, one kind at a time.", "sound": "pop"},
                 {"pic": "\U0001F4DD", "cap": "<b>What do you do with an empty carton?</b> You cannot see that. ASK with a questionnaire.", "say": "What do you do with an empty juice carton at home? Nobody can see that. Ask everyone the same question on a questionnaire.", "sound": "pop"},
                 {"pic": "\U0001F327️", "cap": "<b>How much rain fell?</b> The compost heap needs to know. MEASURE with a rain gauge.", "say": "How much rain fell each day this week? The compost heap needs water, so we measure with a rain gauge, in millimetres.", "sound": "pop"},
                 {"pic": "\U0001F4CB", "cap": "Then <b>record</b> each finding in the chart that fits it.", "say": "Then record each finding in the chart that fits it: a bar chart, a table, a diagram.", "sound": "tada"},
             ]},
             "Choose the way that fits the question: observe, ask, or measure."),

        step("observe", "Observe the playground after lunch", "\U0001F440", "Litter counter", ["4Rc.01", "4Rf.01"],
             "Here is everything on the playground after lunch. Count one kind at a time: tap each one. Leaves are not litter, so leave them.",
             explain(
                 ["Observing means counting what is really there, one kind at a time.", "Decide what counts before you start: leaves fell from the tree, so they are not litter."],
                 ["Count the plastic cups: tap every plastic cup. Five.", "Then the apple cores. Then the paper. Then the cartons."],
                 ["Children count everything they see, leaves included.", "Count only what you are looking for."],
                 ["Tap every plastic cup, then every apple core, then every piece of paper, then every carton."]),
             {"title": "Litter on the playground after lunch", "columns": ["Litter", "How many"],
              "scene": PLAYGROUND,
              "rounds": [
                  {"kind": "bottle", "one": "a plastic cup", "label": "Plastic cups", "pic": "\U0001F964", "ask": "Count the plastic cups. Tap each one."},
                  {"kind": "core", "one": "an apple core", "label": "Apple cores", "pic": "\U0001F34E", "ask": "Now the apple cores. Tap each one."},
                  {"kind": "paper", "one": "a piece of paper", "label": "Paper", "pic": "\U0001F4C4", "ask": "Now the pieces of paper. Tap each one."},
                  {"kind": "carton", "one": "a juice carton", "label": "Cartons", "pic": "\U0001F9C3", "ask": "Now the juice cartons. Tap each one."},
              ]},
             "You observed the playground and counted four kinds of litter, leaving the leaves alone."),

        step("pictogram", "What the litter count shows", "\U0001F4CA", "Litter chart reader", ["4Rf.01"],
             "Your litter count as a bar chart. Look, then tap.",
             explain(
                 ["What you counted is now a chart.", "The longest bar is the litter there was most of."],
                 [],
                 [],
                 ["Read the question, look at the bars, tap."]),
             {"fromObserve": True, "display": "bars", "title": "Litter on the playground after lunch",
              "items": [
                  {"ask": "Which litter was there MOST of?", "check": {"kind": "most"},
                   "opts": [opt("Plastic cups", True), opt("Paper", False), opt("Apple cores", False)], "why": "Plastic cups: five, the longest bar."},
                  {"ask": "How many pieces of paper were there?", "check": {"kind": "count", "row": "Paper"},
                   "opts": [opt("4", True), opt("5", False), opt("3", False)], "why": "The paper bar reaches 4."},
                  {"ask": "Were there more cartons than apple cores?", "check": {"kind": "more", "a": "Cartons", "b": "Apple cores"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "Cartons 2, apple cores 3. No, fewer."},
                  {"ask": "How many more plastic cups than cartons?", "check": {"kind": "difference", "a": "Plastic cups", "b": "Cartons"},
                   "opts": [opt("3", True), opt("7", False), opt("2", False)], "why": "5 take away 2 is 3."},
              ]},
             "You turned your own observation into a chart."),

        step("survey", "Ask: what do you do with an empty carton?", "\U0001F4DD", "Questionnaire", ["4Rc.01", "4Rf.01"],
             "What happens to a carton at home is something you cannot observe. ASK. Give each classmate the questionnaire.",
             explain(
                 ["A questionnaire asks everyone the same question with the same choices, so the answers can be counted."],
                 [],
                 [],
                 ["Ask, listen, record, six times."]),
             {"question": "What do you do with an empty juice carton at home?", "pic": "\U0001F9C3", "columns": ["What we do", "How many"],
              "options": [{"id": "recycle", "t": "Put it in the recycling", "pic": "♻️"}, {"id": "bin", "t": "Put it in the bin", "pic": "\U0001F5D1️"}, {"id": "reuse", "t": "Keep it to reuse", "pic": "\U0001F331"}],
              "people": people([
                  ("recycle", "We keep cartons for the recycling collector."),
                  ("bin", "The bin. I did not know cartons could be recycled."),
                  ("recycle", "Recycling. My dad rinses them first."),
                  ("reuse", "I keep them. We grow seeds in them."),
                  ("bin", "In the bin, usually. Nobody told me not to."),
                  ("recycle", "We take them to the recycling point at the market."),
              ])},
             "Six questionnaires answered and recorded. Information you could not have observed."),

        step("pictogram", "The questionnaire as a table", "\U0001F4CB", "Table reader", ["4Rf.01"],
             "The carton answers as a table of numbers. Look, then tap.",
             explain(
                 ["A table records findings as numbers.", "Read the number for each row, and add them for the total."],
                 [],
                 [],
                 ["Read the question, find the number, tap."]),
             {"fromSurvey": True, "display": "table", "title": "What we do with an empty carton",
              "items": [
                  {"ask": "What do MOST of us do with a carton?", "check": {"kind": "most"},
                   "opts": [opt("Put it in the recycling", True), opt("Put it in the bin", False), opt("Keep it to reuse", False)], "why": "Recycling has 3, the biggest number."},
                  {"ask": "How many of us put it in the bin?", "check": {"kind": "count", "row": "Put it in the bin"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "The bin row says 2: Sami and Hana."},
                  {"ask": "How many children answered altogether?", "check": {"kind": "total"},
                   "opts": [opt("6", True), opt("5", False), opt("3", False)], "why": "3 + 2 + 1 = 6."},
                  {"ask": "How many MORE recycle than reuse?", "check": {"kind": "difference", "a": "Put it in the recycling", "b": "Keep it to reuse"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "3 take away 1 is 2."},
              ]},
             "A table showed the questionnaire's findings as numbers."),

        step("pictogram", "Measure the rain for the compost", "\U0001F327️", "Rain measurer", ["4Rc.01", "4Rf.01"],
             "The compost heap needs water. Every morning the class read the rain gauge, in millimetres. Read the measurements, then tap.",
             explain(
                 ["A rain gauge measures how much rain fell, in millimetres.", "The longer the bar, the more rain that day."],
                 ["Tuesday: 12 millimetres. Monday: 4.", "How much more on Tuesday? 12 take away 4: 8 millimetres."],
                 ["Children say 'Tuesday was wetter' and stop.", "Measuring lets you say HOW MUCH wetter."],
                 ["Read the measurements, then tap."]),
             {"display": "ruler", "unit": "mm", "tool": "rain gauge", "title": "Rain in the school gauge this week", "columns": ["Day", "Rain"],
              "rows": [
                  {"label": "Monday", "pic": "\U0001F327️", "value": 4},
                  {"label": "Tuesday", "pic": "\U0001F327️", "value": 12},
                  {"label": "Wednesday", "pic": "☀️", "value": 0},
                  {"label": "Thursday", "pic": "\U0001F327️", "value": 7},
              ],
              "items": [
                  {"ask": "Which day was the WETTEST?", "check": {"kind": "most"},
                   "opts": [opt("Tuesday", True), opt("Thursday", False), opt("Monday", False)], "why": "Tuesday measured 12 mm, the most."},
                  {"ask": "How much rain fell on Thursday, in millimetres?", "check": {"kind": "count", "row": "Thursday"},
                   "opts": [opt("7", True), opt("12", False), opt("4", False)], "why": "The gauge showed 7 mm on Thursday."},
                  {"ask": "How many more millimetres fell on Tuesday than on Monday?", "check": {"kind": "difference", "a": "Tuesday", "b": "Monday"},
                   "opts": [opt("8", True), opt("16", False), opt("4", False)], "why": "12 take away 4 is 8 millimetres."},
                  {"ask": "Which day had NO rain at all?", "check": {"kind": "least"},
                   "opts": [opt("Wednesday", True), opt("Monday", False), opt("Thursday", False)], "why": "Wednesday measured 0 mm: a dry day."},
              ]},
             "You compared four measurements. That is what a gauge is for."),

        step("organiser", "Which bin does it belong in?", "\U0001F5C2️", "Waste sorter", ["4Rf.01"],
             "Everything we found can be recorded by where it should GO. Record each thing under recycling, compost, or rubbish.",
             explain(
                 ["Recording findings means organising them into groups that make sense.", "For waste, the groups are where it should go."],
                 ["A tin can: recycling.", "An apple core: compost. It rots into soil.", "A sweet wrapper: rubbish. It cannot be recycled or composted."],
                 [],
                 ["Read the thing, tap the group."]),
             {"title": "Where our waste should go", "ask": "Recycling, compost, or rubbish?",
              "bins": [{"id": "rec", "label": "Recycling", "pic": "♻️"}, {"id": "comp", "label": "Compost", "pic": "\U0001F331"}, {"id": "rub", "label": "Rubbish", "pic": "\U0001F5D1️"}],
              "items": [
                  {"pic": "\U0001F96B", "label": "a tin can", "bin": "rec", "why": "Tin cans are melted down and made into new cans."},
                  {"pic": "\U0001F34E", "label": "an apple core", "bin": "comp", "why": "It rots into soil for the garden."},
                  {"pic": "\U0001F36C", "label": "a sweet wrapper", "bin": "rub", "why": "Shiny sweet wrappers cannot be recycled here."},
                  {"pic": "\U0001F4C4", "label": "a piece of paper", "bin": "rec", "why": "Paper is recycled into new paper."},
                  {"pic": "\U0001F34C", "label": "a banana skin", "bin": "comp", "why": "It rots down like the apple core."},
                  {"pic": "\U0001F58A️", "label": "a broken pen", "bin": "rub", "why": "Mixed plastic and metal: rubbish."},
              ]},
             "Every kind of waste recorded under where it should go. That is organising findings."),

        step("questions", "Observing, asking, measuring", "\U0001F4AC", "Investigation judge", ["4Rc.01", "4Rf.01"],
             "Think about the three ways to investigate and the charts. Tap the answer.",
             explain(
                 ["Observe what you can see. Ask what you cannot. Measure what has a size."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("How many plastic cups are on the playground? Best way to find out?", "\U0001F964", "observe and count", ["ask the class", "measure with a gauge"], "You can see plastic cups. Count them."),
                 q("What do people do with cartons at home? Best way?", "\U0001F9C3", "ask on a questionnaire", ["count on the playground", "measure with a ruler"], "You cannot see what happens at home."),
                 q("How much rain fell? Best way?", "\U0001F327️", "measure with a rain gauge", ["ask the class", "count the puddles"], "A gauge gives millimetres."),
                 q("Tuesday 12 mm, Monday 4 mm. How much more on Tuesday?", "\U0001F4CF", "8 mm", ["16 mm", "12 mm"], "12 take away 4."),
             ]},
             "You choose the way that fits, and record what it finds."),

        step("quiz", "Show what you know", "⭐", "Star investigator", ["4Rc.01", "4Rf.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Why were the leaves NOT counted as litter?", "\U0001F342", "they fell from the tree, so nobody dropped them", ["they were too small", "they were green", "leaves are always litter"], "Decide what counts before you start."),
                 q("How many pieces of litter were there altogether?", "\U0001F522", "14", ["5", "12", "15"], "5 + 3 + 4 + 2 = 14."),
                 q("What is a questionnaire?", "\U0001F4DD", "the same question and choices given to everyone", ["a gauge", "a chart", "a bin"], "So the answers can be counted."),
                 q("How many of us recycle a carton?", "♻️", "3", ["2", "1", "6"], "Amal, Nora and Tariq."),
                 q("What does a rain gauge measure in?", "\U0001F327️", "millimetres", ["kilograms", "litres per bottle", "minutes"], "Millimetres of rain."),
                 q("Which day was dry?", "☀️", "Wednesday", ["Monday", "Tuesday", "Thursday"], "0 mm."),
                 q("Where should an apple core go?", "\U0001F34E", "compost", ["recycling", "rubbish", "the playground"], "It rots into soil."),
                 q("Why record findings in groups?", "\U0001F5C2️", "so they are organised and easy to read", ["because it is a rule", "you do not need to", "to make more work"], "Organising findings is part of recording them."),
             ]},
             "That is the whole lesson finished. You choose how to investigate, and you record what you find."),
    ],
}


LESSON["about"] = [
    "Choose whether to observe, ask or measure, by what the question needs.",
    "Observe and count one kind of thing at a time, deciding first what counts.",
    "Read a bar chart, a table and a gauge, and say how much more one thing is than another.",
    "Record findings in groups that make sense.",
]

LESSON["lecture"] = [
    part("\U0001F5D1️", "Three questions, three ways",
         "What is on the playground after lunch? Observe. What do people do with a carton at home? Ask. How much rain fell? Measure. Choose the way that fits the question."),
    part("\U0001F440", "Observing",
         "Count one kind of thing at a time, and decide first what counts. Leaves fell from the tree, so they are not litter. Five plastic cups, three apple cores, four pieces of paper, two cartons."),
    part("\U0001F4DD", "Asking",
         "Nobody can see what happens to a carton at home. A questionnaire asks everyone the same question with the same choices: recycle, bin, or reuse. Three, two, one."),
    part("\U0001F327️", "Measuring",
         "The compost heap needs water, so the class reads the rain gauge every morning. Tuesday twelve millimetres, Monday four. Eight more on Tuesday: measuring lets you say how much."),
    part("\U0001F5C2️", "Recording",
         "Each finding goes in the chart that fits it: a bar chart for the count, a table for the questionnaire, a gauge chart for the rain, and a diagram for where each kind of waste should go."),
]

LESSON["words"] = [
    word("observe", "\U0001F440", "To look carefully and count what is really there.",
         ["We observed the playground after lunch.", "Observe one kind at a time."]),
    word("questionnaire", "\U0001F4DD", "The same question, with the same choices, given to everyone.",
         ["Six children answered the questionnaire.", "A questionnaire finds out what you cannot see."]),
    word("gauge", "\U0001F327️", "A tool that measures how much of something there is.",
         ["A rain gauge measures rain.", "We check the gauge every morning."]),
    word("millimetre", "\U0001F4CF", "A very small measure: a thousand make a metre.",
         ["Twelve millimetres of rain fell.", "Written as mm."]),
    word("compost", "\U0001F331", "Food and plant waste that rots down into soil.",
         ["Apple cores go in the compost.", "The compost heap needs water."]),
    word("record", "\U0001F4CB", "To write down or chart what you found, so it is not lost.",
         ["Record each count in the table.", "We recorded the rain every day."], say="to record"),
]

LESSON["home"] = [
    home("Observe the bin", "A grown-up and the kitchen bin at the end of a day",
         ["Decide what counts: packets, peel, paper, plastic.",
          "Count one kind at a time, just by looking. Your grown-up moves things, and you wash your hands after.",
          "Draw a bar for each kind."],
         "Which kind is there most of? Could any of it have gone somewhere else?"),
    home("Ask at home", "Everyone at home",
         ["Ask everyone the same question: what do you do with an empty tin?",
          "Give them three choices and record each answer.",
          "Make a table of the answers."],
         "Did everyone answer the same? What would change the answers?"),
    home("Measure the rain", "A jar, a ruler and a week",
         ["Put a straight-sided jar outside where rain can fall in.",
          "Each morning measure the water in millimetres and write it down.",
          "At the end of the week, find the wettest day and the driest."],
         "How much more fell on the wettest day than the driest?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the oceans", "how to swim"],
    "changed": [
        {"before": "Asking people is the way to find things out.", "after": "I should observe what I can see, ask what I cannot, and measure what has a size."},
        {"before": "Everything on the ground is litter.", "after": "I should decide what counts before I start counting."},
        {"before": "A wetter day is just wetter.", "after": "A gauge lets me say HOW MANY millimetres wetter."},
    ],
}

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("You want to know how many birds visit the tree at break. What should you do?", "\U0001F426", "watch and count them", ["ask one friend to guess", "measure the tree"], "You can see the birds, so observe and count them."),
    q("You want to know what your classmates do with old clothes at home. What should you do?", "\U0001F455", "ask them with a questionnaire", ["watch the playground", "measure the clothes"], "You cannot see what happens at home, so ask."),
]
