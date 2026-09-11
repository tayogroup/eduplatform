# -*- coding: utf-8 -*-
"""Lesson 3 - What the Data Says.

0838 Stage 3 Analysis: 3Ad.01 draw simple conclusions from graphical or
numerical data. Research: 3Rf.01 select, organise and record information in
simple charts or diagrams. The topic is the snacks we eat at break, because
a snack survey gives bars and numbers a child can draw a conclusion FROM -
more fruit than crisps, six children altogether - and a Venn diagram can
sort snacks by liked, healthy, or both.
"""
from _kit import explain, step, opt, q, part, word, home

CLASS = [
    ("amal", "Amal", "\U0001F467\U0001F3FE"), ("sami", "Sami", "\U0001F466\U0001F3FE"), ("nora", "Nora", "\U0001F467\U0001F3FD"),
    ("omar", "Omar", "\U0001F466\U0001F3FD"), ("hana", "Hana", "\U0001F467\U0001F3FF"), ("tariq", "Tariq", "\U0001F466\U0001F3FF"),
]


def people(answers):
    return [{"id": i, "name": n, "pic": p, "answer": a, "say": s} for (i, n, p), (a, s) in zip(CLASS, answers)]


LESSON = {
    "slug": "what-the-data-says",
    "title": "What the Data Says",
    "blurb": "A chart is not the end of an investigation. Survey the class about snacks, draw conclusions the data proves, tell a conclusion from a guess, and sort snacks on a Venn diagram.",
    "steps": [
        step("demo", "A conclusion is a sentence the data proves", "\U0001F4A1", "Concluder", ["3Ad.01"],
             "Last year you read charts. This year you draw CONCLUSIONS from them. Press <b>Next</b>.",
             explain(
                 ["A conclusion is a sentence you can say because the data proves it.", "If the numbers do not show it, it is not a conclusion."],
                 ["Fruit 3, crisps 1. Conclusion: more children chose fruit than crisps.",
                  "Fruit is the tastiest snack? The chart does not show taste. That is an opinion, not a conclusion."],
                 ["Children say what they think the chart SHOULD say.", "Say only what it DOES say."],
                 ["Press Next and see a conclusion drawn."]),
             {"frames": [
                 {"pic": "\U0001F4CA", "cap": "The class asked: <b>what is your favourite break-time snack?</b> Here is the chart.", "say": "The class asked: what is your favourite break-time snack? Here is the chart."},
                 {"pic": "\U0001F34E", "cap": "Fruit: 3. Crisps: 1. Yoghurt: 2. Sweets: 0.", "say": "Fruit, three. Crisps, one. Yoghurt, two. Sweets, none.", "sound": "pop"},
                 {"pic": "✅", "cap": "Amal: <b>more children chose fruit than crisps.</b> The numbers prove it. A conclusion.", "say": "Amal says: more children chose fruit than crisps. Three is more than one. The numbers prove it. That is a conclusion.", "sound": "ding"},
                 {"pic": "\U0001F914", "cap": "Omar: <b>fruit is the tastiest snack.</b> Hmm. The chart says nothing about taste.", "say": "Omar says: fruit is the tastiest snack. Hmm. The chart says nothing about taste. That is an opinion, not a conclusion.", "sound": "boing"},
                 {"pic": "\U0001F4A1", "cap": "A <b>conclusion</b> is a sentence the data <b>proves</b>. Nothing more, nothing less.", "say": "A conclusion is a sentence the data proves. Nothing more, nothing less.", "sound": "tada"},
             ]},
             "A conclusion is a sentence the data proves."),

        step("survey", "Survey: your favourite break-time snack", "\U0001F34E", "Snack surveyor", ["3Rf.01"],
             "Ask each classmate and record the answer. This data is what we will draw conclusions from.",
             explain(
                 ["First the data. Then the conclusions."],
                 [],
                 [],
                 ["Ask, listen, record, six times."]),
             {"question": "What is your favourite break-time snack?", "pic": "\U0001F34E", "columns": ["Snack", "How many"],
              "options": [{"id": "fruit", "t": "Fruit", "pic": "\U0001F34E"}, {"id": "crisps", "t": "Crisps", "pic": "\U0001F954"},
                          {"id": "yog", "t": "Yoghurt", "pic": "\U0001F963"}, {"id": "sweets", "t": "Sweets", "pic": "\U0001F36C"}],
              "people": people([
                  ("fruit", "An apple. Or a banana."),
                  ("crisps", "Crisps, salt and vinegar."),
                  ("yog", "A yoghurt, strawberry."),
                  ("fruit", "Grapes, usually."),
                  ("fruit", "A pear from our tree."),
                  ("yog", "Yoghurt, the one with the crunchy bits."),
              ])},
             "Six answers recorded. Now the data can be asked what it proves."),

        step("pictogram", "Draw conclusions from the bars", "\U0001F4C8", "Bar concluder", ["3Ad.01"],
             "Here is the snack data as bars. Each question asks for a conclusion the bars PROVE. Look, then tap.",
             explain(
                 ["A conclusion compares, adds up, or counts.", "More than, how many altogether, how many more."],
                 ["Fruit 3, crisps 1. More children chose fruit than crisps: yes.", "3 + 1 + 2 + 0: six children altogether.", "Fruit has 1 more than yoghurt."],
                 ["Children answer from what they think.", "Every answer is in the bars."],
                 ["Read the question, look at the bars, tap."]),
             {"fromSurvey": True, "display": "bars", "title": "Our favourite break-time snacks",
              "items": [
                  {"ask": "Did MORE children choose fruit than crisps?", "check": {"kind": "more", "a": "Fruit", "b": "Crisps"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "Fruit 3, crisps 1. More chose fruit. The bars prove it."},
                  {"ask": "How many children answered ALTOGETHER?", "check": {"kind": "total"},
                   "opts": [opt("6", True), opt("4", False), opt("5", False)], "why": "3 + 1 + 2 + 0 = 6."},
                  {"ask": "How many MORE children chose fruit than yoghurt?", "check": {"kind": "difference", "a": "Fruit", "b": "Yoghurt"},
                   "opts": [opt("1", True), opt("3", False), opt("2", False)], "why": "Fruit 3, yoghurt 2. One more."},
                  {"ask": "Which snack did NOBODY choose?", "check": {"kind": "least"},
                   "opts": [opt("Sweets", True), opt("Crisps", False), opt("Yoghurt", False)], "why": "Sweets has no bar at all: zero."},
                  {"ask": "Did more children choose yoghurt than crisps?", "check": {"kind": "more", "a": "Yoghurt", "b": "Crisps"},
                   "opts": [opt("Yes", True), opt("No", False)], "why": "Yoghurt 2, crisps 1. Yes."},
              ]},
             "Five conclusions, every one proved by the bars."),

        step("pictogram", "Conclusions from a table of numbers", "\U0001F4CB", "Table concluder", ["3Ad.01"],
             "The tuck shop counted what it sold in one week. Draw conclusions from the numbers.",
             explain(
                 ["Numbers in a table can be compared, added and taken away, just like bars."],
                 [],
                 [],
                 ["Read the question, find the numbers, tap."]),
             {"display": "table", "title": "Snacks the tuck shop sold in one week", "columns": ["Snack", "Sold"],
              "rows": [
                  {"label": "Apples", "pic": "\U0001F34E", "value": 24},
                  {"label": "Bananas", "pic": "\U0001F34C", "value": 18},
                  {"label": "Crisps", "pic": "\U0001F954", "value": 30},
                  {"label": "Flapjacks", "pic": "\U0001F36A", "value": 12},
              ],
              "items": [
                  {"ask": "Which snack sold the MOST?", "check": {"kind": "most"},
                   "opts": [opt("Crisps", True), opt("Apples", False), opt("Bananas", False)], "why": "Crisps: 30, the biggest number."},
                  {"ask": "How many more apples than flapjacks were sold?", "check": {"kind": "difference", "a": "Apples", "b": "Flapjacks"},
                   "opts": [opt("12", True), opt("36", False), opt("6", False)], "why": "24 take away 12 is 12."},
                  {"ask": "Did the shop sell more bananas than crisps?", "check": {"kind": "more", "a": "Bananas", "b": "Crisps"},
                   "opts": [opt("No", True), opt("Yes", False)], "why": "Bananas 18, crisps 30. No, fewer."},
                  {"ask": "How many snacks were sold altogether?", "check": {"kind": "total"},
                   "opts": [opt("84", True), opt("72", False), opt("90", False)], "why": "24 + 18 + 30 + 12 = 84."},
              ]},
             "Four conclusions from a table of numbers."),

        step("sort", "Conclusion, or just a guess?", "⚖️", "Conclusion judge", ["3Ad.01"],
             "Our snack chart says: fruit 3, crisps 1, yoghurt 2, sweets 0. Does the data PROVE this sentence?",
             explain(
                 ["A conclusion is proved by the data.", "A guess or an opinion is not, however sensible it sounds."],
                 ["More children chose fruit than any other snack: proved. Three is the biggest.", "Fruit is the tastiest: not proved. The chart does not measure taste."],
                 [],
                 ["Read the sentence, then tap the bin."]),
             {"ask": "Does the chart prove it?",
              "bins": [{"id": "yes", "label": "A conclusion: the data proves it", "pic": "✅"}, {"id": "no", "label": "Not proved by the data", "pic": "\U0001F937"}],
              "items": [
                  {"pic": "\U0001F34E", "label": "More children chose fruit than any other snack", "bin": "yes", "why": "Fruit has 3, the most. Proved."},
                  {"pic": "\U0001F60B", "label": "Fruit is the tastiest snack", "bin": "no", "why": "The chart does not measure taste. An opinion."},
                  {"pic": "\U0001F36C", "label": "Nobody chose sweets", "bin": "yes", "why": "Sweets: zero. Proved."},
                  {"pic": "\U0001F3EB", "label": "Every class in the school likes fruit best", "bin": "no", "why": "We only asked OUR class. The data cannot say that."},
                  {"pic": "\U0001F522", "label": "Six children answered", "bin": "yes", "why": "3 + 1 + 2 + 0 = 6. Proved."},
                  {"pic": "\U0001F954", "label": "Crisps are bad for you", "bin": "no", "why": "The chart counts choices. It says nothing about health."},
              ]},
             "You can tell a conclusion the data proves from a sentence it does not."),

        step("organiser", "Liked, healthy, or both?", "\U0001F5C2️", "Venn sorter", ["3Rf.01"],
             "A diagram with two circles that overlap. Some snacks we like, some are healthy, some are both. Record each snack in the right part.",
             explain(
                 ["A Venn diagram has two circles that overlap.", "Only in the left circle, only in the right, or in the middle where they cross."],
                 ["An apple: we like it AND it is healthy. The middle.", "Crisps: we like them, but not healthy. Left only.", "Carrot sticks: healthy, but nobody chose them. Right only."],
                 ["Children put everything in the middle.", "The middle is only for snacks that are BOTH."],
                 ["Read the snack, tap the part of the diagram."]),
             {"title": "Snacks we like and snacks that are healthy", "ask": "Liked only, both, or healthy only?", "venn": True,
              "bins": [{"id": "like", "label": "We like it", "pic": "\U0001F60B"}, {"id": "both", "label": "Both", "pic": "\U0001F91D"}, {"id": "healthy", "label": "It is healthy", "pic": "\U0001F4AA"}],
              "items": [
                  {"pic": "\U0001F34E", "label": "an apple", "bin": "both", "why": "Three chose fruit, and an apple is healthy. Both."},
                  {"pic": "\U0001F954", "label": "crisps", "bin": "like", "why": "Somebody chose them, but they are not a healthy snack. Liked only."},
                  {"pic": "\U0001F955", "label": "carrot sticks", "bin": "healthy", "why": "Healthy, but nobody in our survey chose them. Healthy only."},
                  {"pic": "\U0001F963", "label": "a yoghurt", "bin": "both", "why": "Two chose it, and yoghurt is healthy. Both."},
                  {"pic": "\U0001F34C", "label": "a banana", "bin": "both", "why": "Fruit was chosen three times, and a banana is healthy. Both."},
                  {"pic": "\U0001F966", "label": "broccoli", "bin": "healthy", "why": "Very healthy, but not a snack anybody chose. Healthy only."},
              ]},
             "Six snacks recorded on a Venn diagram. That is organising information."),

        step("questions", "Conclusions and diagrams", "\U0001F4AC", "Data judge", ["3Ad.01", "3Rf.01"],
             "Think about conclusions and the Venn diagram. Tap the answer.",
             explain(
                 ["A conclusion is proved by the data.", "A Venn diagram shows what is in one group, the other, or both."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Fruit 3, crisps 1. Which is a conclusion the data proves?", "\U0001F4CA", "More children chose fruit than crisps", ["Fruit is the tastiest", "Crisps are bad for you"], "Three is more than one. Proved."),
                 q("What goes in the MIDDLE of a Venn diagram?", "\U0001F91D", "things that are in both groups", ["things in neither group", "the biggest things"], "The middle is where the circles overlap: both."),
                 q("The tuck shop sold 24 apples and 12 flapjacks. How many more apples?", "\U0001F34E", "12", ["36", "24"], "24 take away 12."),
                 q("We asked only our class. Can we conclude every class likes fruit best?", "\U0001F3EB", "No, the data is only about our class", ["Yes", "Yes, if we like fruit"], "A conclusion cannot go further than the data."),
             ]},
             "You draw conclusions the data proves, and record on a diagram."),

        step("quiz", "Show what you know", "⭐", "Star analyst", ["3Ad.01", "3Rf.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a conclusion?", "\U0001F4A1", "a sentence the data proves", ["a guess", "an opinion", "a kind of chart"], "Nothing more, nothing less than what the data shows."),
                 q("Sami said fruit is the tastiest snack. Why was that not a conclusion?", "\U0001F60B", "the chart does not measure taste", ["fruit is not tasty", "Sami was wrong about fruit", "it was too short"], "The data only counted choices."),
                 q("How many more children chose yoghurt than sweets?", "\U0001F963", "2", ["0", "1", "6"], "Yoghurt 2, sweets 0. 2 take away 0 is 2."),
                 q("Which snack did the tuck shop sell most?", "\U0001F954", "crisps", ["apples", "bananas", "flapjacks"], "30, the biggest number."),
                 q("How many more children chose fruit than crisps?", "\U0001F34E", "2", ["1", "3", "4"], "Fruit 3, crisps 1. 3 take away 1 is 2."),
                 q("Where does an apple go on the liked-and-healthy Venn diagram?", "\U0001F34E", "the middle: both", ["liked only", "healthy only", "nowhere"], "We like it, and it is healthy."),
                 q("Where do carrot sticks go?", "\U0001F955", "healthy only", ["the middle", "liked only", "nowhere"], "Healthy, but nobody chose them."),
                 q("A conclusion can say…", "✅", "only what the data shows", ["anything sensible", "what the teacher thinks", "what most people believe"], "If the numbers do not show it, it is not a conclusion."),
             ]},
             "That is the whole lesson finished. You draw conclusions from data, and record on diagrams."),
    ],
}


LESSON["about"] = [
    "Draw a conclusion from bars or numbers: more than, how many altogether, how many more.",
    "Tell a conclusion the data proves from a guess or an opinion.",
    "Read a table of numbers and compare them.",
    "Record information on a Venn diagram: one group, the other, or both.",
]

LESSON["lecture"] = [
    part("\U0001F4CA", "The snack chart",
         "The class asked what everyone's favourite break-time snack is. Fruit three, crisps one, yoghurt two, sweets none. That is the data."),
    part("\U0001F4A1", "A conclusion",
         "A conclusion is a sentence the data proves. More children chose fruit than crisps: three is more than one, proved. Six children answered: three plus one plus two plus zero, proved."),
    part("\U0001F914", "Not a conclusion",
         "Fruit is the tastiest snack? The chart does not measure taste. Every class likes fruit best? We only asked our class. Those sound sensible, but the data does not prove them."),
    part("\U0001F4CB", "Numbers in a table",
         "A table works the same way. The tuck shop sold 30 packets of crisps and 24 apples. Crisps sold most. Twelve more apples than flapjacks. Eighty-four snacks altogether."),
    part("\U0001F5C2️", "A Venn diagram",
         "Two circles that overlap. Snacks we like on one side, healthy snacks on the other, and in the middle the ones that are both. An apple is both. Crisps are liked only. Carrot sticks are healthy only."),
]

LESSON["words"] = [
    word("conclusion", "\U0001F4A1", "A sentence the data proves.",
         ["My conclusion is that more chose fruit.", "Draw a conclusion from the bars."]),
    word("data", "\U0001F4CA", "The numbers and facts an investigation collected.",
         ["The snack survey gave us data.", "What does the data say?"]),
    word("prove", "✅", "To show that something is true with evidence.",
         ["The numbers prove it.", "The chart does not prove that fruit is tasty."]),
    word("compare", "⚖️", "To look at two things and say which is more, bigger or the same.",
         ["Compare fruit and crisps.", "Measuring lets you compare."]),
    word("altogether", "\U0001F522", "All of them added up.",
         ["Six children altogether.", "How many were sold altogether?"]),
    word("Venn diagram", "\U0001F91D", "Two overlapping circles that show one group, the other, or both.",
         ["Put the apple in the middle of the Venn diagram.", "A Venn diagram organises things by group."]),
]

LESSON["home"] = [
    home("Conclusions at home", "Everyone at home, paper and a pencil",
         ["Ask everyone their favourite fruit and draw the answers as bars.",
          "Say three conclusions the bars prove: the most, how many altogether, how many more.",
          "Say one sentence the bars do NOT prove, and why."],
         "Could somebody argue with your conclusions? Not if the data proves them."),
    home("A Venn diagram of toys", "Paper, a pencil, and a box of toys",
         ["Draw two overlapping circles: toys with wheels, toys that are soft.",
          "Put each toy in the right part. A soft toy car goes in the middle.",
          "Count how many are in each part."],
         "Was the middle empty, or full?"),
    home("Read a real table", "A bus timetable, a food label or a football table, and a grown-up",
         ["Find two numbers you can compare.",
          "Say which is bigger, and by how much.",
          "Say one conclusion the table proves."],
         "Did you need the whole table, or just two numbers?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "how to ride a bike", "the names of the planets"],
    "changed": [
        {"before": "A chart is the end of finding out.", "after": "A chart is data, and the conclusions come after."},
        {"before": "If it sounds sensible, the data proves it.", "after": "The data only proves what the numbers show."},
        {"before": "A thing is in one group or the other.", "after": "A thing can be in both, and a Venn diagram has a place for it."},
    ],
}
