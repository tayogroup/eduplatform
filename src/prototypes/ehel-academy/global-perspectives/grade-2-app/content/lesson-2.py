# -*- coding: utf-8 -*-
"""Lesson 2 - Interview and Record.

0838 Stage 2 Research: 2Rc.01 conduct simple investigations, using
interviews or questionnaires to find information and opinions; 2Rf.01 record
findings from research in pictograms, simple tables or graphic organisers.
Analysis: 2Ad.01 recognise that graphical and numerical data can show
information about a topic. The topic is playtime - what we play, and whether
playtime should be longer - because one interview finds information and the
other finds opinions, and the same findings can be shown as pictures, bars
and numbers.
"""
from _kit import explain, step, opt, q, part, word, home

CLASS = [
    ("amal", "Amal", "\U0001F467\U0001F3FE"), ("sami", "Sami", "\U0001F466\U0001F3FE"), ("nora", "Nora", "\U0001F467\U0001F3FD"),
    ("omar", "Omar", "\U0001F466\U0001F3FD"), ("hana", "Hana", "\U0001F467\U0001F3FF"), ("tariq", "Tariq", "\U0001F466\U0001F3FF"),
]


def people(answers):
    return [{"id": i, "name": n, "pic": p, "answer": a, "say": s} for (i, n, p), (a, s) in zip(CLASS, answers)]


LESSON = {
    "slug": "interview-and-record",
    "title": "Interview and Record",
    "blurb": "Interview six classmates twice: once to find information, once to find opinions. Record what you find as a pictogram, a bar chart and a table, and see that all three show the same thing.",
    "steps": [
        step("demo", "Information and opinions", "\U0001F399️", "Interviewer", ["2Rc.01"],
             "An interview can find out two kinds of thing. Press <b>Next</b> and hear both.",
             explain(
                 ["An interview is asking somebody questions and recording their answers.", "Some answers are information. Some are opinions."],
                 ["What do you play at playtime? Tag. That is information: a fact about Sami.",
                  "Should playtime be longer? Yes! That is an opinion: what Sami thinks."],
                 ["Children think every answer is a fact.", "What somebody THINKS is an opinion, and it is still worth recording."],
                 ["Press Next and listen for which is which."]),
             {"frames": [
                 {"pic": "\U0001F399️", "cap": "An <b>interview</b> is asking someone questions and recording the answers.", "say": "An interview is asking someone questions and recording the answers."},
                 {"pic": "\U0001F466\U0001F3FE", "cap": "What do you play at playtime? Sami: <b>tag</b>. That is <b>information</b>.", "say": "What do you play at playtime? Sami says: tag. That is information. A fact about Sami.", "sound": "pop"},
                 {"pic": "\U0001F4AD", "cap": "Should playtime be longer? Sami: <b>yes!</b> That is an <b>opinion</b>.", "say": "Should playtime be longer? Sami says: yes! That is an opinion. What Sami thinks.", "sound": "pop"},
                 {"pic": "\U0001F4CA", "cap": "We <b>record</b> both. Pictures, bars, or numbers in a table.", "say": "We record both. As pictures, as bars, or as numbers in a table.", "sound": "click"},
                 {"pic": "\U0001F50D", "cap": "Then the class can <b>see</b> what everyone said.", "say": "Then the class can see what everyone said, all at once.", "sound": "tada"},
             ]},
             "An interview finds information and opinions, and we record both."),

        step("survey", "Interview: what do you play?", "⚽", "Play interviewer", ["2Rc.01", "2Rf.01"],
             "Interview each classmate. Ask, listen, and record the answer in the pictogram.",
             explain(
                 ["This interview finds information: what each person plays."],
                 ["Press Ask. Listen. Tap what they said. Record it.", "One picture per person goes in the row."],
                 ["Children record their OWN game.", "Record what the classmate said."],
                 ["Ask, listen, record, six times."]),
             {"question": "What do you play at playtime?", "pic": "⚽", "columns": ["Game", "How many"],
              "options": [{"id": "ball", "t": "Football", "pic": "⚽"}, {"id": "skip", "t": "Skipping", "pic": "\U0001F9F5"},
                          {"id": "tag", "t": "Tag", "pic": "\U0001F3C3"}, {"id": "quiet", "t": "Quiet games", "pic": "\U0001F9E9"}],
              "people": people([
                  ("ball", "Football, in the middle."),
                  ("tag", "Tag. I am hard to catch."),
                  ("skip", "Skipping with Hana."),
                  ("ball", "Football. Every day."),
                  ("skip", "Skipping. I can cross my arms."),
                  ("ball", "Football, with Amal and Omar."),
              ])},
             "Six classmates interviewed, six answers recorded as pictures."),

        step("pictogram", "The same findings as a bar chart", "\U0001F4CA", "Bar reader", ["2Ad.01", "2Rf.01"],
             "Here is what you found, drawn as bars. A longer bar means more people. Look, then tap.",
             explain(
                 ["The same findings can be drawn different ways.", "A bar chart uses a bar for each answer. The longer the bar, the more people."],
                 ["Football has the longest bar: three people.", "Quiet games has no bar at all: nobody."],
                 ["Children think a bar chart is a different survey.", "It is the SAME answers, drawn as bars instead of pictures."],
                 ["Read the question, look at the bars, tap."]),
             {"fromSurvey": True, "display": "bars", "title": "What we play at playtime",
              "items": [
                  {"ask": "Which game has the LONGEST bar?", "check": {"kind": "most"},
                   "opts": [opt("Football", True), opt("Skipping", False), opt("Tag", False)], "why": "Football has 3, the longest bar."},
                  {"ask": "How many children play skipping?", "check": {"kind": "count", "row": "Skipping"},
                   "opts": [opt("2", True), opt("3", False), opt("1", False)], "why": "The skipping bar reaches 2."},
                  {"ask": "Does anyone play quiet games?", "check": {"kind": "any", "row": "Quiet games"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "Quiet games has no bar at all. Nobody chose it."},
                  {"ask": "Which game did the FEWEST children choose?", "check": {"kind": "least"},
                   "opts": [opt("Quiet games", True), opt("Tag", False), opt("Football", False)], "why": "Nobody chose quiet games: 0."},
              ]},
             "Bars show the same information as pictures. Longer means more."),

        step("survey", "Interview: should playtime be longer?", "\U0001F4AD", "Opinion interviewer", ["2Rc.01", "2Rf.01"],
             "This interview finds opinions. Ask each classmate what they think, and record it.",
             explain(
                 ["An opinion is what somebody thinks.", "You record it just like information."],
                 ["Should playtime be longer? Yes, no, or not sure.", "Each person's opinion goes in the row they chose."],
                 ["Children record what THEY think.", "It is the classmate's opinion. Record theirs."],
                 ["Ask, listen, record."]),
             {"question": "Should playtime be longer?", "pic": "\U0001F4AD", "columns": ["Opinion", "How many"],
              "options": [{"id": "yes", "t": "Yes", "pic": "\U0001F44D"}, {"id": "no", "t": "No", "pic": "\U0001F44E"}, {"id": "unsure", "t": "Not sure", "pic": "\U0001F914"}],
              "people": people([
                  ("yes", "Yes! We never finish our game."),
                  ("yes", "Yes, longer playtime please."),
                  ("no", "No. I like lessons more."),
                  ("yes", "Yes. Definitely yes."),
                  ("unsure", "Not sure. Maybe."),
                  ("yes", "Yes, then we could all play."),
              ])},
             "Six opinions found and recorded. Most of the class says yes."),

        step("pictogram", "The same findings as a table", "\U0001F4CB", "Table reader", ["2Ad.01", "2Rf.01"],
             "Here are the opinions as a table of numbers. Look at the numbers, then tap.",
             explain(
                 ["A table shows the findings as numbers.", "No pictures, no bars: the number says how many."],
                 ["Yes: 4. No: 1. Not sure: 1.", "The biggest number is the opinion most people have."],
                 ["Children look for the longest row.", "In a table there is no long row. Read the number."],
                 ["Read the question, find the number, tap."]),
             {"fromSurvey": True, "display": "table", "title": "Should playtime be longer?",
              "items": [
                  {"ask": "Which opinion has the BIGGEST number?", "check": {"kind": "most"},
                   "opts": [opt("Yes", True), opt("No", False), opt("Not sure", False)], "why": "Yes has 4, the biggest number in the table."},
                  {"ask": "How many children said no?", "check": {"kind": "count", "row": "No"},
                   "opts": [opt("1", True), opt("4", False), opt("0", False)], "why": "The No row says 1: Nora."},
                  {"ask": "Did anyone say not sure?", "check": {"kind": "any", "row": "Not sure"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "Not sure has 1: Hana."},
                  {"ask": "How many children said yes?", "check": {"kind": "count", "row": "Yes"},
                   "opts": [opt("4", True), opt("6", False), opt("2", False)], "why": "The Yes row says 4."},
              ]},
             "A table of numbers shows the same information as pictures or bars."),

        step("organiser", "Information or opinion?", "\U0001F5C2️", "Findings sorter", ["2Rc.01", "2Rf.01"],
             "Record our findings on a chart with two sides: information, and opinions.",
             explain(
                 ["Our interviews found two kinds of thing.", "Information is a fact. An opinion is what somebody thinks."],
                 ["Three children play football: information. We counted it.", "Sami thinks playtime should be longer: opinion. It is what he thinks."],
                 ["Children think a number is always information and words are always opinion.", "Ask: is it a fact, or what somebody thinks?"],
                 ["Read each finding, tap the side."]),
             {"title": "What our interviews found", "ask": "Information, or an opinion?",
              "bins": [{"id": "info", "label": "Information", "pic": "\U0001F4CB"}, {"id": "op", "label": "Opinion", "pic": "\U0001F4AD"}],
              "items": [
                  {"pic": "⚽", "label": "Three children play football", "bin": "info", "why": "We counted it. A fact."},
                  {"pic": "\U0001F44D", "label": "Sami thinks playtime should be longer", "bin": "op", "why": "It is what Sami thinks."},
                  {"pic": "\U0001F9F5", "label": "Two children play skipping", "bin": "info", "why": "We counted it. A fact."},
                  {"pic": "\U0001F44E", "label": "Nora thinks lessons are better than playtime", "bin": "op", "why": "It is what Nora thinks."},
                  {"pic": "\U0001F9E9", "label": "Nobody plays quiet games", "bin": "info", "why": "The row was empty. A fact."},
                  {"pic": "\U0001F914", "label": "Hana is not sure about longer playtime", "bin": "op", "why": "Not sure is still what Hana thinks."},
              ]},
             "Information on one side, opinions on the other. Both recorded."),

        step("explore", "Three ways to show findings", "\U0001F4C8", "Chart spotter", ["2Ad.01"],
             "Pictures, bars, numbers. Tap each one to hear what it shows.",
             explain(
                 ["Graphical data is pictures and bars.", "Numerical data is numbers.", "All of them can show information about a topic."],
                 ["A pictogram: one picture per person.", "A bar chart: a bar for each answer.", "A table: a number for each answer."],
                 [],
                 ["Tap all three, then answer."]),
             {"items": [
                 {"pic": "\U0001F4CA", "label": "a pictogram", "say": "A pictogram. One picture for each person. Count the pictures to find how many."},
                 {"pic": "\U0001F4C8", "label": "a bar chart", "say": "A bar chart. One bar for each answer. The longer the bar, the more people."},
                 {"pic": "\U0001F4CB", "label": "a table", "say": "A table. One number for each answer. Read the number to find how many."},
             ], "need": 3,
              "then": {"ask": "Three children play football. Which of these can show that?",
                       "opts": [opt("A pictogram, a bar chart AND a table", True), opt("Only a pictogram", False), opt("None of them", False)],
                       "why": "All three show the same information. They just draw it differently."}},
             "Pictures, bars and numbers can all show information about a topic."),

        step("questions", "Interviews and findings", "\U0001F4AC", "Findings judge", ["2Rc.01", "2Ad.01"],
             "Think about the two interviews and the three charts. Tap the answer.",
             explain(
                 ["An interview finds information and opinions.", "Findings can be recorded as pictures, bars or numbers."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("What do you play at playtime? Tag. Is that information or an opinion?", "\U0001F3C3", "information", ["an opinion", "neither"], "It is a fact about what Sami plays."),
                 q("Should playtime be longer? Yes! Information or opinion?", "\U0001F44D", "an opinion", ["information", "a number"], "It is what Sami thinks."),
                 q("In a bar chart, a LONGER bar means…", "\U0001F4C8", "more people gave that answer", ["fewer people", "the answer is better"], "Longer bar, more people."),
                 q("In a table, how do you find how many?", "\U0001F4CB", "read the number", ["count the pictures", "measure the bar"], "A table shows the number."),
             ]},
             "You know what an interview finds, and three ways to show it."),

        step("quiz", "Show what you know", "⭐", "Star investigator", ["2Rc.01", "2Rf.01", "2Ad.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is an interview?", "\U0001F399️", "asking someone questions and recording the answers", ["a kind of game", "a bar chart", "a rule"], "Ask, listen, record."),
                 q("Which is an OPINION?", "\U0001F4AD", "Sami thinks playtime should be longer", ["Three children play football", "Nobody plays quiet games", "Two children skip"], "What somebody thinks is an opinion."),
                 q("Which game did the most children play?", "⚽", "football", ["skipping", "tag", "quiet games"], "Football had 3, the longest bar."),
                 q("How many children said playtime should be longer?", "\U0001F44D", "4", ["1", "6", "0"], "The Yes row in the table said 4."),
                 q("A bar chart, a pictogram and a table can all…", "\U0001F4C8", "show the same information", ["show different surveys", "only show opinions"], "Same findings, drawn three ways."),
                 q("In a pictogram, one picture is…", "\U0001F4CA", "one person", ["one bar", "the whole class"], "Each picture stands for one person."),
                 q("Nobody plays quiet games. Where does that go on our chart?", "\U0001F9E9", "information", ["opinion", "nowhere"], "We counted it. A fact."),
                 q("Hana said she was not sure. Should we record that?", "\U0001F914", "yes, not sure is still her opinion", ["no, only yes and no count", "no, she has to choose"], "An interview records what people really said."),
             ]},
             "That is the whole lesson finished. You can interview, record, and read the findings three ways."),
    ],
}


LESSON["about"] = [
    "Interview classmates to find information and opinions.",
    "Record findings in a pictogram, a bar chart and a table.",
    "Say that pictures, bars and numbers can all show the same information.",
    "Tell information from an opinion, and record both.",
]

LESSON["lecture"] = [
    part("\U0001F399️", "Interviews",
         "An interview is asking somebody questions and recording their answers. What do you play at playtime? That finds information, a fact. Should playtime be longer? That finds an opinion, what they think."),
    part("\U0001F4CA", "Recording as pictures",
         "One picture for each person, in a row for each answer. That is a pictogram. Count the pictures to find how many."),
    part("\U0001F4C8", "Recording as bars",
         "The same answers can be drawn as bars. One bar for each answer, and the longer the bar, the more people. Football had the longest bar because three people play it."),
    part("\U0001F4CB", "Recording as numbers",
         "Or as a table. One number for each answer. Yes, four. No, one. Not sure, one. No pictures, no bars, just the number. The biggest number is the opinion most people have."),
    part("\U0001F5C2️", "Information and opinion",
         "Three children play football is information. Sami thinks playtime should be longer is an opinion. An interview finds both, and we record both, on a chart with two sides."),
]

LESSON["words"] = [
    word("interview", "\U0001F399️", "Asking somebody questions and recording their answers.",
         ["We interviewed six classmates.", "An interview finds information and opinions."]),
    word("information", "\U0001F4CB", "Facts about a topic.",
         ["Three children play football is information.", "The interview gave us information."]),
    word("opinion", "\U0001F4AD", "What somebody thinks about something.",
         ["Yes, playtime should be longer, is Sami's opinion.", "Record every opinion."]),
    word("pictogram", "\U0001F4CA", "A chart with one picture for every person.",
         ["Count the pictures in the pictogram.", "The pictogram shows what we play."]),
    word("bar chart", "\U0001F4C8", "A chart with a bar for each answer; the longer the bar, the more people.",
         ["Football has the longest bar on the bar chart.", "Read the bar chart."]),
    word("table", "\U0001F4CB", "Findings set out as numbers in rows.",
         ["The table says four people said yes.", "Read the number in the table."]),
]

LESSON["home"] = [
    home("Interview your family", "Paper, a pencil, everyone at home",
         ["Ask everyone one information question: what do you eat for breakfast?",
          "Ask everyone one opinion question: should we have pancakes at the weekend?",
          "Record both. Put a tick per person for each answer."],
         "Which question found information? Which found opinions?"),
    home("Three ways to show it", "Paper and crayons, and your breakfast findings",
         ["Draw your findings as a pictogram: one picture per person.",
          "Draw them again as bars.",
          "Write them as a table of numbers."],
         "Do all three show the same thing? Which was quickest to read?"),
    home("Count the cars three ways", "A window onto a road, and five minutes",
         ["Make a mark for each car, bus and bike that passes.",
          "Draw the marks as bars.",
          "Write the numbers in a table."],
         "Which went past most? Could you tell from the bars before you counted?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "the names of the planets", "how to tie a shoelace"],
}

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("Which of these is an opinion?", "\U0001F4AD", "Football is the best game.", ["I play football on Mondays.", "A football team has eleven players."], "Best is what somebody thinks. That is an opinion. The others are information."),
    q("You ask six friends a question. How can you remember all their answers?", "\U0001F4DD", "write or draw each answer down", ["try to remember them all", "ask only one friend"], "Recording each answer means nothing gets forgotten."),
]
