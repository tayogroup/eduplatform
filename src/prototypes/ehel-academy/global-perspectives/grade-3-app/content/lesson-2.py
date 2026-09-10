# -*- coding: utf-8 -*-
"""Lesson 2 - Observe and Measure.

0838 Stage 3 Research: 3Rc.01 conduct investigations, using interviews or
questionnaires, making observations and taking appropriate measurements;
3Rf.01 select, organise and record information from sources and findings
from research in simple charts or diagrams. The topic is the journey to
school and the bean plants on the windowsill: one is observed at the gate
and asked about in a questionnaire, the other is measured with a ruler, and
everything found is sorted by HOW it was found.
"""
from _kit import explain, step, opt, q, glyph, part, word, home

CLASS = [
    ("amal", "Amal", "\U0001F467\U0001F3FE"), ("sami", "Sami", "\U0001F466\U0001F3FE"), ("nora", "Nora", "\U0001F467\U0001F3FD"),
    ("omar", "Omar", "\U0001F466\U0001F3FD"), ("hana", "Hana", "\U0001F467\U0001F3FF"), ("tariq", "Tariq", "\U0001F466\U0001F3FF"),
]


def people(answers):
    return [{"id": i, "name": n, "pic": p, "answer": a, "say": s} for (i, n, p), (a, s) in zip(CLASS, answers)]


GATE = (
    [glyph("\U0001F697", "car", "a car")] * 4 +
    [glyph("\U0001F68C", "bus", "a bus")] * 2 +
    [glyph("\U0001F6B2", "bike", "a bike")] * 3 +
    [glyph("\U0001F6B6", "walker", "a person walking")] * 5 +
    [glyph("\U0001F415", "dog", "a dog")] * 2
)

LESSON = {
    "slug": "observe-and-measure",
    "title": "Observe and Measure",
    "blurb": "Three ways to investigate: observe and count what goes past the school gate, ask the class a questionnaire, and measure the bean plants with a ruler. Then record what you found by how you found it.",
    "steps": [
        step("demo", "Three ways to investigate", "\U0001F52C", "Investigator", ["3Rc.01"],
             "Asking is one way to find out. This year there are three. Press <b>Next</b>.",
             explain(
                 ["An investigation can ask people, observe things, or measure things.", "Each way finds a different kind of information."],
                 ["How many buses pass the gate? Observe and count.", "How long is your journey? Ask a questionnaire.", "How tall is the bean plant? Measure with a ruler."],
                 ["Children ask people things they could observe.", "Do not ask how many buses passed. Stand at the gate and count."],
                 ["Press Next and see all three."]),
             {"frames": [
                 {"pic": "\U0001F52C", "cap": "The class is investigating <b>the journey to school</b>.", "say": "The class is investigating the journey to school. There are three ways to find things out."},
                 {"pic": "\U0001F440", "cap": "<b>Observe.</b> Stand at the gate and COUNT what goes past.", "say": "Observe. Stand at the gate and count what goes past. Cars, buses, bikes, walkers.", "sound": "pop"},
                 {"pic": "\U0001F4DD", "cap": "<b>Ask.</b> A questionnaire: how long is your journey?", "say": "Ask. A questionnaire gives everyone the same question and records every answer. How long is your journey?", "sound": "pop"},
                 {"pic": "\U0001F4CF", "cap": "<b>Measure.</b> A ruler tells you how tall the bean plants have grown.", "say": "Measure. A ruler tells you how tall the bean plants on the windowsill have grown. A number, not a guess.", "sound": "pop"},
                 {"pic": "\U0001F4CB", "cap": "Then <b>record</b> what you found, and say <b>how</b> you found it.", "say": "Then record what you found, and say how you found it: observed, asked, or measured.", "sound": "tada"},
             ]},
             "Observe, ask, measure. Three ways to investigate."),

        step("observe", "Observe at the gate", "\U0001F440", "Gate watcher", ["3Rc.01", "3Rf.01"],
             "Here is everything that went past the gate in five minutes. Count one kind at a time: tap each one.",
             explain(
                 ["Observing means looking carefully and counting what is really there.", "One kind at a time, so nothing is counted twice."],
                 ["Count the cars: tap every car. Four.", "Then the buses. Then the bikes. Then the walkers.", "Each count goes in the table."],
                 ["Children count in their heads and guess.", "Tap each one. The table counts for you."],
                 ["Tap every car, then every bus, then every bike, then every walker."]),
             {"title": "What passed the school gate in five minutes", "columns": ["What we saw", "How many"],
              "scene": GATE,
              "rounds": [
                  {"kind": "car", "label": "Cars", "pic": "\U0001F697", "ask": "Count the cars. Tap each one."},
                  {"kind": "bus", "label": "Buses", "pic": "\U0001F68C", "ask": "Now the buses. Tap each one."},
                  {"kind": "bike", "label": "Bikes", "pic": "\U0001F6B2", "ask": "Now the bikes. Tap each one."},
                  {"kind": "walker", "label": "Walkers", "pic": "\U0001F6B6", "ask": "Now the people walking. Tap each one."},
              ]},
             "You observed the gate and counted four kinds of thing. Every count is recorded."),

        step("pictogram", "What the gate count shows", "\U0001F4CA", "Gate chart reader", ["3Rf.01"],
             "Your gate count as a bar chart. Look, then tap.",
             explain(
                 ["What you counted is now a chart.", "The longest bar is what passed most."],
                 [],
                 [],
                 ["Read the question, look at the bars, tap."]),
             {"fromObserve": True, "display": "bars", "title": "What passed the school gate",
              "items": [
                  {"ask": "What passed the gate MOST?", "check": {"kind": "most"},
                   "opts": [opt("Walkers", True), opt("Cars", False), opt("Bikes", False)], "why": "Walkers: five, the longest bar."},
                  {"ask": "How many buses passed?", "check": {"kind": "count", "row": "Buses"},
                   "opts": [opt("2", True), opt("4", False), opt("3", False)], "why": "The bus bar reaches 2."},
                  {"ask": "Did more bikes pass than buses?", "check": {"kind": "more", "a": "Bikes", "b": "Buses"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "Bikes 3, buses 2. Yes, more bikes."},
              ]},
             "You read your own observation as a chart."),

        step("survey", "Ask: how long is your journey?", "\U0001F4DD", "Questionnaire", ["3Rc.01", "3Rf.01"],
             "Some things you cannot observe at the gate. How long each journey takes: you have to ASK. Give each classmate the questionnaire.",
             explain(
                 ["A questionnaire asks everyone the same question with the same choices.", "You cannot see how long a journey took by watching the gate."],
                 [],
                 [],
                 ["Ask, listen, record, six times."]),
             {"question": "How long is your journey to school?", "pic": "\U0001F552", "columns": ["Journey", "How many"],
              "options": [{"id": "short", "t": "Under 5 minutes", "pic": "\U0001F3C3"}, {"id": "mid", "t": "5 to 15 minutes", "pic": "\U0001F6B6"}, {"id": "long", "t": "Over 15 minutes", "pic": "\U0001F68C"}],
              "people": people([
                  ("mid", "About ten minutes, walking with my mum."),
                  ("long", "Twenty minutes on the bus."),
                  ("short", "Two minutes. I live across the road."),
                  ("mid", "About eight minutes on my bike."),
                  ("long", "Half an hour in the car."),
                  ("mid", "Ten minutes, walking."),
              ])},
             "Six questionnaires answered and recorded. That is information you could not observe."),

        step("pictogram", "The questionnaire as a table", "\U0001F4CB", "Table reader", ["3Rf.01"],
             "The journey answers as a table of numbers. Look, then tap.",
             explain(
                 ["A table records findings as numbers.", "Read the number for each row."],
                 [],
                 [],
                 ["Read the question, find the number, tap."]),
             {"fromSurvey": True, "display": "table", "title": "How long our journeys take",
              "items": [
                  {"ask": "Which journey length did MOST children have?", "check": {"kind": "most"},
                   "opts": [opt("5 to 15 minutes", True), opt("Under 5 minutes", False), opt("Over 15 minutes", False)], "why": "5 to 15 minutes has 3, the biggest number."},
                  {"ask": "How many children have a journey over 15 minutes?", "check": {"kind": "count", "row": "Over 15 minutes"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "The Over 15 row says 2: Sami and Hana."},
                  {"ask": "How many children answered altogether?", "check": {"kind": "total"},
                   "opts": [opt("6", True), opt("3", False), opt("5", False)], "why": "1 + 3 + 2 = 6. All six classmates."},
              ]},
             "A table showed the questionnaire's findings as numbers."),

        step("pictogram", "Measure the bean plants", "\U0001F4CF", "Plant measurer", ["3Rc.01", "3Rf.01"],
             "The bean plants on the windowsill, measured with a ruler in centimetres. Read the measurements, then tap.",
             explain(
                 ["Measuring gives you a number you can compare.", "A ruler in centimetres: the longer the bar, the taller the plant."],
                 ["Nora's plant is 15 centimetres. Sami's is 8.", "How much taller is Nora's? 15 take away 8: 7 centimetres."],
                 ["Children say 'Nora's is taller' and stop.", "Measuring lets you say HOW MUCH taller."],
                 ["Read the measurements, then tap."]),
             {"display": "ruler", "unit": "cm", "title": "Our bean plants after three weeks", "columns": ["Plant", "Height"],
              "rows": [
                  {"label": "Amal's plant", "pic": "\U0001F331", "value": 12},
                  {"label": "Sami's plant", "pic": "\U0001F331", "value": 8},
                  {"label": "Nora's plant", "pic": "\U0001F331", "value": 15},
                  {"label": "Omar's plant", "pic": "\U0001F331", "value": 10},
              ],
              "items": [
                  {"ask": "Whose plant is the TALLEST?", "check": {"kind": "most"},
                   "opts": [opt("Nora's plant", True), opt("Amal's plant", False), opt("Sami's plant", False)], "why": "Nora's plant measures 15 cm, the most."},
                  {"ask": "How tall is Amal's plant, in centimetres?", "check": {"kind": "count", "row": "Amal's plant"},
                   "opts": [opt("12", True), opt("15", False), opt("8", False)], "why": "The ruler shows 12 cm for Amal's plant."},
                  {"ask": "How many centimetres taller is Nora's plant than Sami's?", "check": {"kind": "difference", "a": "Nora's plant", "b": "Sami's plant"},
                   "opts": [opt("7", True), opt("15", False), opt("8", False)], "why": "15 take away 8 is 7 centimetres."},
                  {"ask": "Whose plant is the SHORTEST?", "check": {"kind": "least"},
                   "opts": [opt("Sami's plant", True), opt("Omar's plant", False), opt("Nora's plant", False)], "why": "Sami's plant measures 8 cm, the least."},
              ]},
             "You read four measurements and compared them. That is what a ruler is for."),

        step("organiser", "How did we find it out?", "\U0001F5C2️", "Findings organiser", ["3Rf.01"],
             "Everything we found today was observed, asked, or measured. Record each finding under HOW we found it.",
             explain(
                 ["Recording findings means organising them.", "One good way: by how you found them."],
                 ["Five walkers passed the gate: we observed it.", "Sami's journey is twenty minutes: we asked him.", "Nora's plant is 15 cm: we measured it."],
                 [],
                 ["Read the finding, tap how it was found."]),
             {"title": "What we found, and how", "ask": "Observed, asked, or measured?",
              "bins": [{"id": "obs", "label": "Observed", "pic": "\U0001F440"}, {"id": "ask", "label": "Asked", "pic": "\U0001F4DD"}, {"id": "meas", "label": "Measured", "pic": "\U0001F4CF"}],
              "items": [
                  {"pic": "\U0001F6B6", "label": "Five walkers passed the gate", "bin": "obs", "why": "We stood at the gate and counted. Observed."},
                  {"pic": "\U0001F68C", "label": "Sami's journey takes twenty minutes", "bin": "ask", "why": "We could not see that. We asked him."},
                  {"pic": "\U0001F331", "label": "Nora's plant is 15 cm tall", "bin": "meas", "why": "A ruler gave the number. Measured."},
                  {"pic": "\U0001F697", "label": "Four cars passed the gate", "bin": "obs", "why": "Counted at the gate. Observed."},
                  {"pic": "\U0001F331", "label": "Sami's plant is 8 cm tall", "bin": "meas", "why": "Measured with the ruler."},
                  {"pic": "\U0001F3C3", "label": "Nora lives across the road", "bin": "ask", "why": "She told us on the questionnaire. Asked."},
              ]},
             "Every finding recorded under how it was found. That is organising information."),

        step("questions", "Observing, asking, measuring", "\U0001F4AC", "Investigation judge", ["3Rc.01", "3Rf.01"],
             "Think about the three ways to investigate. Tap the answer.",
             explain(
                 ["Observe what you can see. Ask what you cannot. Measure what has a size."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("How many buses pass the gate? Best way to find out?", "\U0001F68C", "observe and count at the gate", ["ask the class", "measure with a ruler"], "You can see buses. Count them."),
                 q("How long is Sami's journey? Best way?", "\U0001F552", "ask him on a questionnaire", ["count at the gate", "measure with a ruler"], "You cannot see a journey's length from the gate."),
                 q("How tall is a bean plant? Best way?", "\U0001F331", "measure with a ruler", ["ask the plant", "count the leaves"], "A ruler gives a number in centimetres."),
                 q("Nora's plant is 15 cm and Sami's is 8 cm. How much taller is Nora's?", "\U0001F4CF", "7 cm", ["15 cm", "23 cm"], "15 take away 8 is 7."),
             ]},
             "You know which way to investigate, and what each way finds."),

        step("quiz", "Show what you know", "⭐", "Star investigator", ["3Rc.01", "3Rf.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does OBSERVE mean?", "\U0001F440", "look carefully and count what is really there", ["guess", "ask a friend", "draw a picture"], "Standing at the gate and counting is observing."),
                 q("What passed the gate most?", "\U0001F6B6", "walkers", ["cars", "buses", "bikes"], "Five walkers, the longest bar."),
                 q("What is a questionnaire?", "\U0001F4DD", "the same question and choices given to everyone", ["a ruler", "a chart", "a picture"], "Everyone answers the same question, and every answer is recorded."),
                 q("Which finding was MEASURED?", "\U0001F4CF", "Nora's plant is 15 cm tall", ["Four cars passed", "Sami's journey is twenty minutes", "Nora lives across the road"], "A ruler gave that number."),
                 q("How many children answered the questionnaire altogether?", "\U0001F522", "6", ["3", "5", "10"], "1 + 3 + 2 = 6."),
                 q("Whose bean plant was shortest?", "\U0001F331", "Sami's", ["Nora's", "Amal's", "Omar's"], "8 cm, the least."),
                 q("Why measure instead of just saying 'taller'?", "\U0001F4CF", "so you can say HOW MUCH taller", ["because rulers are fun", "you do not need to", "to make it longer"], "Measuring gives a number you can compare."),
                 q("Why record findings by HOW you found them?", "\U0001F5C2️", "so everyone knows which were seen, asked or measured", ["because it looks tidy", "it is a rule", "you do not need to"], "Organising findings is part of recording them."),
             ]},
             "That is the whole lesson finished. You can observe, ask, measure and record."),
    ],
}


LESSON["about"] = [
    "Investigate by observing and counting what is really there.",
    "Investigate by asking a questionnaire for things you cannot see.",
    "Investigate by measuring with a ruler, and compare the numbers.",
    "Record findings organised by how they were found: observed, asked or measured.",
]

LESSON["lecture"] = [
    part("\U0001F52C", "Three ways",
         "An investigation can ask people, observe things, or measure things. The class is investigating the journey to school, and it needs all three."),
    part("\U0001F440", "Observing",
         "Stand at the gate for five minutes and count what goes past. Cars, buses, bikes, walkers. Tap each one so nothing is counted twice, and the table fills itself."),
    part("\U0001F4DD", "Asking",
         "Some things you cannot see from the gate. How long does each journey take? A questionnaire gives everyone the same question and the same choices, and records every answer."),
    part("\U0001F4CF", "Measuring",
         "The bean plants on the windowsill have grown. A ruler tells you how tall each one is, in centimetres. Nora's is 15, Sami's is 8, so Nora's is 7 centimetres taller. Measuring lets you say how much."),
    part("\U0001F5C2️", "Recording by how",
         "Then record what you found, organised by how you found it. Observed, asked, or measured. That way everyone knows where each finding came from."),
]

LESSON["words"] = [
    word("observe", "\U0001F440", "To look carefully and count what is really there.",
         ["We observed the gate for five minutes.", "Observe, do not guess."]),
    word("questionnaire", "\U0001F4DD", "The same question and choices, given to everyone, with every answer recorded.",
         ["Our questionnaire asked how long the journey takes.", "Six classmates filled in the questionnaire."]),
    word("measure", "\U0001F4CF", "To find a size with a ruler, a jug or a clock.",
         ["Measure the bean plant.", "We measured 15 centimetres."]),
    word("centimetre", "\U0001F4CF", "A small measure of length; about the width of your little finger.",
         ["Nora's plant is 15 centimetres.", "The ruler is marked in centimetres."]),
    word("findings", "\U0001F4CB", "The things an investigation found out.",
         ["Record your findings.", "Our findings went in a table."]),
    word("investigate", "\U0001F52C", "To find something out by observing, asking or measuring.",
         ["We investigated the journey to school.", "Let's investigate!"]),
]

LESSON["home"] = [
    home("Observe at a window", "A window onto a road or a path, five minutes, paper and pencil",
         ["Count one kind of thing: red cars, or people with bags, or birds.",
          "Make a mark for each one.",
          "Then count a second kind and draw both as bars."],
         "Which passed more? By how many?"),
    home("A questionnaire at home", "Everyone at home",
         ["Ask everyone the same question with three choices: how long does your journey to work or school take?",
          "Record every answer in a table.",
          "Say which choice most people picked."],
         "Could you have found that out by observing? Why not?"),
    home("Measure and compare", "A ruler and three things: a spoon, a book, a shoe",
         ["Measure each one in centimetres.",
          "Put them in order, shortest to longest.",
          "Say how much longer the longest is than the shortest."],
         "Was your guess before measuring right?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "the names of the planets", "how to tie a shoelace"],
    "changed": [
        {"before": "Finding out means asking somebody.", "after": "Finding out can mean observing, asking, or measuring."},
        {"before": "You can tell which plant is taller just by looking.", "after": "Measuring tells you how MUCH taller, in centimetres."},
        {"before": "A finding is just a fact.", "after": "A finding is a fact and how we found it: observed, asked or measured."},
    ],
}
