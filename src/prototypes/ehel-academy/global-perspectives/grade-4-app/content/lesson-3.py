# -*- coding: utf-8 -*-
"""Lesson 3 - Sleep and Screens.

0838 Stage 4 Analysis: 4Ad.01 draw simple conclusions from graphical or
numerical data. Research: 4Rf.01 select, organise and record information in
simple charts or diagrams. The topic is how we spend our evenings: a sleep
survey gives bars a child can draw conclusions FROM, a table of library
loans gives numbers to compare, and a Venn diagram sorts what we do indoors,
outdoors, or both.
"""
from _kit import explain, step, opt, q, part, word, home

CLASS = [
    ("amal", "Amal", "\U0001F467\U0001F3FE"), ("sami", "Sami", "\U0001F466\U0001F3FE"), ("nora", "Nora", "\U0001F467\U0001F3FD"),
    ("yusuf", "Yusuf", "\U0001F466\U0001F3FD"), ("hana", "Hana", "\U0001F467\U0001F3FF"), ("tariq", "Tariq", "\U0001F466\U0001F3FF"),
]


def people(answers):
    return [{"id": i, "name": n, "pic": p, "answer": a, "say": s} for (i, n, p), (a, s) in zip(CLASS, answers)]


LESSON = {
    "slug": "sleep-and-screens",
    "title": "Sleep and Screens",
    "blurb": "How much do we sleep, and what do we do in the evening? Survey the class, draw conclusions the data proves and no further, tell a conclusion from a guess, and sort our evening activities on a Venn diagram.",
    "steps": [
        step("demo", "A conclusion goes exactly as far as the data", "\U0001F4A1", "Careful concluder", ["4Ad.01"],
             "A conclusion is a sentence the data proves. This year: it goes exactly as far as the data, and no further. Press <b>Next</b>.",
             explain(
                 ["The data proves what it proves.", "A conclusion that goes further than the data is a guess wearing a conclusion's clothes."],
                 ["Three of six slept eight to ten hours. Conclusion: half of the children we asked slept eight to ten hours.",
                  "Children everywhere sleep eight to ten hours? We asked six children in one class. Too far."],
                 ["Children stretch a conclusion to the whole world.", "Say what THIS data proves about THESE people."],
                 ["Press Next and see how far a conclusion can go."]),
             {"frames": [
                 {"pic": "\U0001F634", "cap": "The class asked: <b>how many hours did you sleep last night?</b>", "say": "The class asked: how many hours did you sleep last night? Six answers."},
                 {"pic": "\U0001F4CA", "cap": "Less than 8 hours: 2. 8 to 10 hours: 3. More than 10: 1.", "say": "Less than eight hours, two. Eight to ten hours, three. More than ten, one.", "sound": "pop"},
                 {"pic": "✅", "cap": "Nora: <b>half of the children we asked slept 8 to 10 hours.</b> Three of six. The data proves it.", "say": "Nora says: half of the children we asked slept eight to ten hours. Three of six is half. The data proves it.", "sound": "ding"},
                 {"pic": "\U0001F914", "cap": "Tariq: <b>children everywhere sleep 8 to 10 hours.</b> We asked SIX children. Too far.", "say": "Tariq says: children everywhere sleep eight to ten hours. We asked six children in one class. That goes much further than the data.", "sound": "boing"},
                 {"pic": "\U0001F4A1", "cap": "A conclusion goes <b>exactly as far as the data</b>, and no further.", "say": "A conclusion goes exactly as far as the data, and no further.", "sound": "tada"},
             ]},
             "A conclusion goes exactly as far as the data, and no further."),

        step("survey", "Survey: how many hours did you sleep?", "\U0001F634", "Sleep surveyor", ["4Rf.01"],
             "Ask each classmate and record the answer. This is the data our conclusions will come from.",
             explain(
                 ["First the data. Then the conclusions."],
                 [],
                 [],
                 ["Ask, listen, record, six times."]),
             {"question": "How many hours did you sleep last night?", "pic": "\U0001F634", "columns": ["Hours of sleep", "How many"],
              "options": [{"id": "under", "t": "Less than 8 hours", "pic": "\U0001F971"}, {"id": "eight", "t": "8 to 10 hours", "pic": "\U0001F60A"}, {"id": "over", "t": "More than 10 hours", "pic": "\U0001F634"}],
              "people": people([
                  ("eight", "About nine hours. Bed at nine, up at six."),
                  ("under", "Seven, maybe. I was watching a film."),
                  ("eight", "Nine and a half hours."),
                  ("over", "Eleven. I was really tired after football."),
                  ("eight", "Eight and a bit."),
                  ("under", "Six. My baby brother woke everyone up."),
              ])},
             "Six answers recorded. Now the data can be asked what it proves."),

        step("pictogram", "Draw conclusions from the bars", "\U0001F4C8", "Bar concluder", ["4Ad.01"],
             "Here is the sleep data as bars. Each question asks for a conclusion the bars PROVE. Look, then tap.",
             explain(
                 ["A conclusion compares, adds up, or counts.", "More than, how many altogether, how many more."],
                 ["Eight to ten: 3. Less than eight: 2. More slept eight to ten than less than eight: yes.", "2 + 3 + 1: six children altogether."],
                 ["Children answer from what they think happens.", "Every answer is in the bars."],
                 ["Read the question, look at the bars, tap."]),
             {"fromSurvey": True, "display": "bars", "title": "How many hours we slept last night",
              "items": [
                  {"ask": "Did MORE children sleep 8 to 10 hours than less than 8?", "check": {"kind": "more", "a": "8 to 10 hours", "b": "Less than 8 hours"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "8 to 10 hours: 3. Less than 8: 2. Yes, more."},
                  {"ask": "How many children answered ALTOGETHER?", "check": {"kind": "total"},
                   "opts": [opt("6", True), opt("5", False), opt("4", False)], "why": "2 + 3 + 1 = 6."},
                  {"ask": "How many MORE slept 8 to 10 hours than more than 10?", "check": {"kind": "difference", "a": "8 to 10 hours", "b": "More than 10 hours"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "3 take away 1 is 2."},
                  {"ask": "Which answer did the FEWEST children give?", "check": {"kind": "least"},
                   "opts": [opt("More than 10 hours", True), opt("Less than 8 hours", False), opt("8 to 10 hours", False)], "why": "More than 10 hours: only Yusuf."},
                  {"ask": "Did more children sleep more than 10 hours than less than 8?", "check": {"kind": "more", "a": "More than 10 hours", "b": "Less than 8 hours"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "More than 10: 1. Less than 8: 2. No, fewer."},
              ]},
             "Five conclusions, every one proved by the bars."),

        step("pictogram", "Conclusions from a table of numbers", "\U0001F4CB", "Table concluder", ["4Ad.01"],
             "The class library counted the books borrowed each day for evening reading. Draw conclusions from the numbers.",
             explain(
                 ["Numbers in a table can be compared, added and taken away, just like bars."],
                 [],
                 [],
                 ["Read the question, find the numbers, tap."]),
             {"display": "table", "title": "Books borrowed from the class library", "columns": ["Day", "Books"],
              "rows": [
                  {"label": "Monday", "pic": "\U0001F4DA", "value": 9},
                  {"label": "Tuesday", "pic": "\U0001F4DA", "value": 6},
                  {"label": "Wednesday", "pic": "\U0001F4DA", "value": 14},
                  {"label": "Thursday", "pic": "\U0001F4DA", "value": 11},
              ],
              "items": [
                  {"ask": "On which day were the MOST books borrowed?", "check": {"kind": "most"},
                   "opts": [opt("Wednesday", True), opt("Thursday", False), opt("Monday", False)], "why": "Wednesday: 14, the biggest number."},
                  {"ask": "How many more books on Wednesday than on Tuesday?", "check": {"kind": "difference", "a": "Wednesday", "b": "Tuesday"},
                   "opts": [opt("8", True), opt("20", False), opt("6", False)], "why": "14 take away 6 is 8."},
                  {"ask": "Were more books borrowed on Monday than on Thursday?", "check": {"kind": "more", "a": "Monday", "b": "Thursday"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "Monday 9, Thursday 11. No, fewer."},
                  {"ask": "How many books were borrowed altogether over the four days?", "check": {"kind": "total"},
                   "opts": [opt("40", True), opt("34", False), opt("44", False)], "why": "9 + 6 + 14 + 11 = 40."},
              ]},
             "Four conclusions from a table of numbers."),

        step("sort", "Proved, or too far?", "⚖️", "Conclusion judge", ["4Ad.01"],
             "Our sleep chart says: less than 8 hours, 2; 8 to 10, 3; more than 10, 1. Does the data PROVE this sentence, or does it go too far?",
             explain(
                 ["A conclusion is proved by the data and goes no further.", "A sentence about people we did not ask, or things we did not measure, goes too far."],
                 ["Half of the children we asked slept 8 to 10 hours: proved. Three of six.", "Sami is always tired: we asked about ONE night. Too far."],
                 [],
                 ["Read the sentence, then tap the bin."]),
             {"ask": "Does the data prove it?",
              "bins": [{"id": "yes", "label": "Proved by the data", "pic": "✅"}, {"id": "no", "label": "Goes too far", "pic": "\U0001F6D1"}],
              "items": [
                  {"pic": "\U0001F60A", "label": "Half of the children we asked slept 8 to 10 hours", "bin": "yes", "why": "Three of six. Proved."},
                  {"pic": "\U0001F30D", "label": "Children everywhere sleep 8 to 10 hours", "bin": "no", "why": "We asked six children in one class. Much too far."},
                  {"pic": "\U0001F971", "label": "Two children slept less than 8 hours", "bin": "yes", "why": "The less-than-8 bar reaches 2. Proved."},
                  {"pic": "\U0001F634", "label": "Sami is always tired", "bin": "no", "why": "We asked about one night, not always. Too far."},
                  {"pic": "\U0001F522", "label": "Six children answered", "bin": "yes", "why": "2 + 3 + 1 = 6. Proved."},
                  {"pic": "\U0001F4FA", "label": "Screens make children sleep less", "bin": "no", "why": "We did not ask about screens at all. The data cannot say."},
              ]},
             "You can tell a conclusion the data proves from one that goes too far."),

        step("organiser", "Indoors, outdoors, or both?", "\U0001F5C2️", "Venn sorter", ["4Rf.01"],
             "A diagram with two circles that overlap. Some evening activities happen indoors, some outdoors, some both. Record each one in the right part.",
             explain(
                 ["A Venn diagram has two circles that overlap.", "Only in the left, only in the right, or in the middle where both are true."],
                 ["Watching television: indoors. Football: outdoors.", "Reading a comic: you can do it either way. The middle."],
                 ["Children put everything in the middle.", "The middle is only for things that are really BOTH."],
                 ["Read the activity, tap the part of the diagram."]),
             {"title": "What we do in the evening", "ask": "Indoors only, both, or outdoors only?", "venn": True,
              "bins": [{"id": "in", "label": "Indoors", "pic": "\U0001F3E0"}, {"id": "both", "label": "Both", "pic": "\U0001F91D"}, {"id": "out", "label": "Outdoors", "pic": "\U0001F333"}],
              "items": [
                  {"pic": "\U0001F4FA", "label": "watching television", "bin": "in", "why": "The television is in the house."},
                  {"pic": "⚽", "label": "playing football", "bin": "out", "why": "Football needs the park or the garden."},
                  {"pic": "\U0001F4D6", "label": "reading a comic", "bin": "both", "why": "A comic goes anywhere, indoors or out. Both."},
                  {"pic": "\U0001F6CF\uFE0F", "label": "sleeping in bed", "bin": "in", "why": "Your bed is in the house."},
                  {"pic": "\U0001F333", "label": "climbing a tree", "bin": "out", "why": "Trees are outdoors."},
                  {"pic": "\U0001F34E", "label": "eating a snack", "bin": "both", "why": "In the kitchen or on a bench. Both."},
              ]},
             "Six activities recorded on a Venn diagram. That is organising information."),

        step("questions", "Conclusions and diagrams", "\U0001F4AC", "Data judge", ["4Ad.01", "4Rf.01"],
             "Think about conclusions and the Venn diagram. Tap the answer.",
             explain(
                 ["A conclusion goes as far as the data and no further.", "A Venn diagram shows one group, the other, or both."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Three of six slept 8 to 10 hours. Which conclusion is proved?", "\U0001F4CA", "Half of the children we asked slept 8 to 10 hours", ["Children everywhere sleep 8 to 10 hours", "Screens make us sleep less"], "Three of six is half. No further."),
                 q("What goes in the MIDDLE of a Venn diagram?", "\U0001F91D", "things that belong in both groups", ["things in neither group", "the biggest things"], "Where the circles overlap."),
                 q("14 books on Wednesday, 6 on Tuesday. How many more on Wednesday?", "\U0001F4DA", "8", ["20", "14"], "14 take away 6."),
                 q("We asked about ONE night. Can we conclude Sami is always tired?", "\U0001F634", "No, one night proves nothing about always", ["Yes", "Yes, if he yawns"], "A conclusion cannot go further than the data."),
             ]},
             "You draw conclusions that go exactly as far as the data."),

        step("quiz", "Show what you know", "⭐", "Star analyst", ["4Ad.01", "4Rf.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a conclusion?", "\U0001F4A1", "a sentence the data proves, and no further", ["a guess", "an opinion", "a kind of chart"], "Exactly as far as the data."),
                 q("Tariq said children everywhere sleep 8 to 10 hours. Why was that too far?", "\U0001F30D", "we only asked six children in one class", ["children do not sleep", "Tariq was tired", "it was too short"], "The data is about our class only."),
                 q("How many children slept less than 8 hours?", "\U0001F971", "2", ["3", "1", "6"], "Sami and Tariq."),
                 q("How many children slept 8 to 10 hours?", "\U0001F60A", "3", ["1", "2", "6"], "8 to 10 hours: 3 children."),
                 q("How many more books were borrowed on Thursday than on Monday?", "\U0001F4DA", "2", ["9", "11", "20"], "11 take away 9 is 2."),
                 q("How many books were borrowed on Monday and Tuesday together?", "\U0001F522", "15", ["9", "6", "40"], "9 + 6 = 15."),
                 q("Where does 'reading a comic' go on the Venn diagram?", "\U0001F4D6", "the middle: both", ["indoors only", "outdoors only", "nowhere"], "A comic goes anywhere."),
                 q("Screens make children sleep less. Can our sleep data prove it?", "\U0001F4FA", "No, we did not ask about screens", ["Yes", "Yes, if Sami says so"], "The data cannot prove what it did not measure."),
             ]},
             "That is the whole lesson finished. Your conclusions go exactly as far as the data."),
    ],
}


LESSON["about"] = [
    "Draw a conclusion the data proves: more than, how many altogether, how many more.",
    "Say when a sentence goes further than the data can prove.",
    "Draw conclusions from a table of numbers.",
    "Record activities on a Venn diagram: one group, the other, or both.",
]

LESSON["lecture"] = [
    part("\U0001F634", "The sleep survey",
         "How many hours did you sleep last night? Less than eight, two. Eight to ten, three. More than ten, one. Six answers, and a chart."),
    part("✅", "As far as the data",
         "Nora says half of the children we asked slept eight to ten hours. Three of six is half; the data proves it. Tariq says children everywhere sleep eight to ten hours. We asked six children. That goes much further than the data."),
    part("\U0001F4CB", "Numbers in a table",
         "The library counted the books borrowed each day. Wednesday fourteen, Tuesday six: eight more on Wednesday. Nine plus six plus fourteen plus eleven: forty altogether. Numbers can be compared and added like bars."),
    part("⚖️", "Proved, or too far",
         "Two children slept less than eight hours: proved. Sami is always tired: we asked about one night. Screens make children sleep less: we never asked about screens. A conclusion stops where the data stops."),
    part("\U0001F5C2️", "The Venn diagram",
         "Watching television, indoors. Football, outdoors. Reading a comic, both, in the middle where the circles cross. Only things that are really both go in the middle."),
]

LESSON["words"] = [
    word("conclusion", "\U0001F4A1", "A sentence the data proves.",
         ["Half of the children we asked slept eight to ten hours: a conclusion.", "A conclusion goes no further than the data."]),
    word("data", "\U0001F4CA", "The numbers and answers an investigation collects.",
         ["The sleep survey gave us data.", "Read the data before you conclude."]),
    word("prove", "✅", "To show that something is true, with evidence.",
         ["The bars prove it.", "One night cannot prove 'always'."]),
    word("survey", "\U0001F4DD", "Asking a group of people the same question and recording every answer.",
         ["Our sleep survey asked six children.", "A survey is data about the people you asked."]),
    word("Venn diagram", "\U0001F5C2️", "Two overlapping circles that show one group, the other, or both.",
         ["The comic went in the middle of the Venn diagram.", "Sort the activities on a Venn diagram."]),
    word("altogether", "\U0001F522", "All of them added up.",
         ["Six children answered altogether.", "Forty books altogether."]),
]

LESSON["home"] = [
    home("A sleep survey at home", "Everyone at home and a piece of paper",
         ["Ask everyone how many hours they slept last night.",
          "Record the answers as bars.",
          "Say two conclusions the bars prove, and one sentence that would go too far."],
         "Which conclusion surprised you?"),
    home("A table of numbers", "A grown-up and something counted over a week: steps, glasses of water, pages read",
         ["Record one number each day for four days.",
          "Find the biggest day and the smallest.",
          "Work out how many more the biggest day had, and the total."],
         "Could you conclude anything about NEXT week from it?"),
    home("Indoors, outdoors, both", "Paper and a pencil",
         ["Draw two overlapping circles: indoors and outdoors.",
          "Write six things you did this week in the right parts.",
          "Ask a grown-up to add three of theirs."],
         "What went in the middle? Was it hard to decide?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the oceans", "how to swim"],
    "changed": [
        {"before": "If it sounds true, it is a conclusion.", "after": "A conclusion is only what the data proves, and no further."},
        {"before": "A survey of my class tells me about everyone.", "after": "A survey tells me about the people I asked."},
        {"before": "An activity is either indoors or outdoors.", "after": "Some are both, and a Venn diagram has a place for them."},
    ],
}
