# -*- coding: utf-8 -*-
"""Lesson 13 - The Paper Spinner.

The investigation lesson: one fair test from question to conclusion. 0097
Stage 4: 4TWSp.02 the five enquiry types; 4TWSp.04 the variables in a fair
test; 4TWSc.04 repeated measurements give more reliable data; 4TWSc.05
standard units; 4TWSc.03 choose equipment; 4TWSa.04 a dot plot; with
4TWSp.01, 4TWSp.03, 4TWSa.01, 4TWSa.02, 4TWSa.03 and 4TWSc.08.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "the-paper-spinner",
    "title": "The Paper Spinner",
    "blurb": "Run one whole investigation: choose the enquiry, pick the variables, drop a paper spinner three times and see why repeats matter, plot the results as dots, and draw a conclusion.",
    "steps": [
        step("sort", "Which type of enquiry?", "\U0001F50E", "Enquiry picker", ["4TWSp.02", "4TWSp.01"],
             "Five types of enquiry. Which one answers each question? Tap the bin.",
             explain(
                 ["Research, fair test, observing over time, classifying, pattern seeking. The question tells you which."],
                 ["Does a bigger spinner fall slower? Change one thing: fair test.", "How does frogspawn change each week? Observing over time.", "Which of these leaves are oak? Classifying.", "Do taller people jump further? Pattern seeking.", "How far is Mars? Research."],
                 [],
                 ["Read the question, then tap."]),
             {"ask": "Which type of enquiry?",
              "bins": [{"id": "fair", "label": "Fair test", "pic": "⚖️"}, {"id": "time", "label": "Observing over time", "pic": "⏳"}, {"id": "class", "label": "Classifying", "pic": "\U0001F5C2️"}, {"id": "pattern", "label": "Pattern seeking", "pic": "\U0001F4C8"}, {"id": "research", "label": "Research", "pic": "\U0001F4DA"}],
              "items": [
                  {"pic": "\U0001FA81", "label": "Does a spinner with bigger wings fall more slowly?", "bin": "fair", "why": "Change the wings, keep the rest the same. A fair test."},
                  {"pic": "\U0001F438", "label": "How does frogspawn change each week?", "bin": "time", "why": "The same spawn, watched over weeks."},
                  {"pic": "\U0001F343", "label": "Which of these leaves are from an oak?", "bin": "class", "why": "Sorting by features."},
                  {"pic": "\U0001F9B6\U0001F3FE", "label": "Do taller people jump further?", "bin": "pattern", "why": "Measure lots of people, look for a pattern."},
                  {"pic": "\U0001F534", "label": "How far away is Mars?", "bin": "research", "why": "Look it up."},
                  {"pic": "\U0001F319", "label": "Does the Moon look the same every night this month?", "bin": "time", "why": "Observing over time."},
                  {"pic": "\U0001F9F2", "label": "Which of these things are magnetic?", "bin": "class", "why": "Test and sort."},
                  {"pic": "\U0001F4A7", "label": "Does more water make a plant grow taller?", "bin": "fair", "why": "One thing changed, the rest kept the same."},
              ]},
             "The question tells you the enquiry. Today's is a fair test."),

        step("sort", "Change, measure, or keep the same?", "⚖️", "Variables", ["4TWSp.04"],
             "Our question: does a bigger spinner fall more slowly? A fair test has three kinds of variable. Sort each one.",
             explain(
                 ["A variable is anything that could change.", "In a fair test you CHANGE one thing, MEASURE one thing, and KEEP everything else THE SAME."],
                 ["Change: the size of the wings.", "Measure: the time it takes to fall.", "Keep the same: the height you drop from, the paper, the paperclip, who drops it, the room."],
                 ["Children change two things at once.", "Then you cannot tell which one made the difference."],
                 ["Change, measure, or keep the same? Then tap."]),
             {"ask": "Change it, measure it, or keep it the same?",
              "bins": [{"id": "change", "label": "Change", "pic": "\U0001F504"}, {"id": "measure", "label": "Measure", "pic": "⏱️"}, {"id": "same", "label": "Keep the same", "pic": "\U0001F512"}],
              "items": [
                  {"pic": "\U0001FA81", "label": "the size of the wings", "bin": "change", "why": "That is the one thing we change."},
                  {"pic": "⏱️", "label": "how long it takes to fall", "bin": "measure", "why": "That is what we measure."},
                  {"pic": "\U0001F4CF", "label": "the height we drop it from", "bin": "same", "why": "Drop from a different height and the time changes for the wrong reason."},
                  {"pic": "\U0001F4CE", "label": "the paperclip on the bottom", "bin": "same", "why": "Same weight every time."},
                  {"pic": "\U0001F4C4", "label": "the kind of paper", "bin": "same", "why": "Thicker paper would fall differently."},
                  {"pic": "\U0001F9D1\U0001F3FE", "label": "who drops it", "bin": "same", "why": "The same person, the same way."},
                  {"pic": "\U0001F32C️", "label": "whether the window is open", "bin": "same", "why": "A draught would blow it."},
                  {"pic": "\U0001F522", "label": "the number of seconds on the stopwatch", "bin": "measure", "why": "That is the measurement."},
              ]},
             "Change one, measure one, keep the rest the same."),

        step("questions", "Choose the equipment", "\U0001F9F0", "Kit list", ["4TWSc.03", "4TWSc.05"],
             "Which equipment does the job? Tap it.",
             explain(
                 ["The right tool, and a standard unit to measure in."],
                 ["To time the fall: a stopwatch, in seconds.", "To measure the drop height: a tape measure, in centimetres.", "To cut the wings the same: a ruler and scissors."],
                 [],
                 ["Read the job, then tap."]),
             {"label": "Question", "items": [
                 q("To time how long the spinner falls, use...", "⏱️", "a stopwatch, in seconds", ["a ruler", "scales", "a thermometer"], "Time: a stopwatch."),
                 q("To make sure every drop is from the same height, use...", "\U0001F4CF", "a tape measure, in centimetres", ["a stopwatch", "a hand lens"], "Length: a tape measure."),
                 q("Why use seconds and centimetres rather than counting or hand spans?", "\U0001F4CF", "they are standard units, the same for everyone, so results can be compared", ["they sound better", "they are bigger"], "Standard units."),
                 q("To make the two spinners' wings exactly the sizes you planned, use...", "✂️", "a ruler and scissors", ["a stopwatch", "a magnet"], "Cut to a measurement."),
             ]},
             "A stopwatch in seconds, a tape measure in centimetres."),

        step("experiment", "Drop it three times", "\U0001FA81", "Three drops", ["4TWSc.04", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "Drop the spinner from the same height three times. Predict: will all three times be exactly the same?",
             explain(
                 ["One measurement can be wrong: a slow thumb on the stopwatch, a breath of air.", "Repeating it shows which numbers to trust. Three close numbers are reliable."],
                 ["Drop one: 2.1 seconds.", "Drop two: 2.3.", "Drop three: 2.0.", "Close, not the same. The true time is about 2.1."],
                 ["Children think different numbers mean a mistake.", "Small differences are normal. A big odd one is the mistake, and only repeats show it."],
                 ["Predict, drop three times, say what happened, then conclude."]),
             {"sim": "spinner",
              "predict": {"ask": "Will all three times be <b>exactly</b> the same?",
                          "opts": [opt("No, close but a little different", True), opt("Yes, exactly the same", False), opt("Completely different each time", False)]},
              "runAsk": "Press Drop it and time it, three times.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("2.1, 2.3 and 2.0 seconds: close, but not the same", True), opt("All three were exactly 2.1", False), opt("One was 2 seconds and one was 20", False)],
                           "why": "Small things, a thumb, a wobble, a breath of air, change each number a little. Three drops show the true time is about 2.1 seconds."},
              "conclude": {"ask": "Why repeat a measurement?",
                           "opts": [opt("Repeats show which numbers to trust, so the data is more reliable", True), opt("Because it is fun", False), opt("One measurement is always enough", False)],
                           "why": "One number could be the odd one. Three together tell you what is really happening."}},
             "Repeat the measurement. Three close numbers are reliable."),

        step("record", "Record the drops", "\U0001F4CB", "Drop table", ["4TWSc.08", "4TWSc.05"],
             "Fill in the table. How long did <b>%s</b> take?",
             explain(
                 ["Three drops, three times, in a table, in seconds."],
                 [],
                 [],
                 ["Tap the time for each drop."]),
             {"ask": "How long did %s take?",
              "columns": ["Drop", "Time in seconds"],
              "rows": [
                  {"pic": "1️⃣", "label": "drop 1", "answer": "21", "why": "the first drop took 2.1 seconds."},
                  {"pic": "2️⃣", "label": "drop 2", "answer": "23", "why": "the second took 2.3 seconds."},
                  {"pic": "3️⃣", "label": "drop 3", "answer": "20", "why": "the third took 2.0 seconds."},
              ],
              "choices": [{"id": "21", "t": "2.1 s", "pic": "⏱️"}, {"id": "23", "t": "2.3 s", "pic": "⏱️"}, {"id": "20", "t": "2.0 s", "pic": "⏱️"}]},
             "2.1, 2.3, 2.0. A table in standard units."),

        step("graph", "Plot the drops", "\U0001F4CA", "Dot plot", ["4TWSa.04", "4TWSa.02", "4TWSc.04"],
             "A <b>dot plot</b> puts one dot for each measurement above its value. Plot the three drops, then read the pattern.",
             explain(
                 ["A dot plot shows every measurement as a dot. Repeats that land close together pile up; an odd one stands alone."],
                 ["One dot at 2.0, one at 2.1, one at 2.3.", "They cluster round 2.1. That is the reliable answer."],
                 ["Children want a bar chart here.", "A bar chart compares groups. A dot plot shows repeats of the same thing."],
                 ["Add a dot for each drop, then answer."]),
             {"columns_label": "Time in seconds", "value_label": "Drops", "dot": True,
              "columns": [{"pic": "⏱️", "label": "2.0 s", "value": 1}, {"pic": "⏱️", "label": "2.1 s", "value": 1}, {"pic": "⏱️", "label": "2.2 s", "value": 0}, {"pic": "⏱️", "label": "2.3 s", "value": 1}],
              "pattern": {"ask": "Read the dot plot. What does it show?",
                          "opts": [opt("The three drops cluster close to 2.1 seconds, so about 2.1 is the reliable answer", True), opt("The drops were all over the place", False), opt("Only one drop was made", False)],
                          "why": "Dots that sit close together are repeats agreeing with each other."}},
             "A dot plot shows every repeat. The cluster is the answer."),

        step("questions", "Investigation check", "✅", "Enquiry check", ["4TWSp.02", "4TWSp.04", "4TWSc.04", "4TWSc.05", "4TWSa.04"],
             "Tap the answer.",
             explain(
                 ["Enquiry types, variables, repeats, units, dot plots."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Does a bigger spinner fall slower? What type of enquiry?", "⚖️", "a fair test", ["research", "observing over time", "classifying"], "One thing changed."),
                 q("In our fair test, what did we CHANGE?", "\U0001F504", "the size of the wings", ["the drop height", "the stopwatch"], "One variable."),
                 q("What did we KEEP THE SAME?", "\U0001F512", "the height, the paper, the paperclip and who dropped it", ["the wings", "nothing"], "Everything but the one change."),
                 q("Why drop the spinner three times?", "\U0001F522", "repeats show which numbers to trust", ["to use up paper", "one drop is not allowed"], "Reliable data."),
                 q("Why time it in seconds?", "⏱️", "a standard unit everyone can compare", ["seconds are fast", "it is easier to say"], "Standard units."),
                 q("Which chart shows repeated measurements of the same thing?", "\U0001F4CA", "a dot plot", ["a map", "a pie"], "One dot per measurement."),
             ]},
             "You know how to run a fair test."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4TWSp.02", "4TWSp.04", "4TWSc.04", "4TWSa.04", "4TWSa.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which is observing over time?", "⏳", "drawing the Moon every night for a month", ["testing which things float", "looking up how far Mars is"], "Watching change over time."),
                 q("What is a variable?", "\U0001F504", "anything in the test that could change", ["a kind of spinner", "a stopwatch"], "Change, measure, or keep the same."),
                 q("You change the wing size AND the drop height. Is it a fair test?", "❌", "no; you cannot tell which change made the difference", ["yes", "only if you write it down"], "One change at a time."),
                 q("Three drops gave 2.1, 2.3 and 2.0. Was one of them a mistake?", "⏱️", "no; small differences are normal, and the true time is about 2.1", ["yes, 2.3 must be wrong", "all of them"], "Close numbers agree."),
                 q("Three drops gave 2.1, 2.2 and 9.0. Which do you doubt?", "\U0001F914", "the 9.0; it is the odd one out and probably a stopwatch mistake", ["the 2.1", "none"], "Repeats reveal the odd one."),
                 q("What did the dot plot show?", "\U0001F4CA", "the three drops clustering close to 2.1 seconds", ["one tall bar", "nothing"], "The cluster is the answer."),
                 q("What is the conclusion of our test?", "\U0001F4DD", "the spinner takes about 2.1 seconds to fall, and repeating gave a reliable answer", ["spinners cannot fall", "one drop is enough"], "Results, related to the question."),
                 q("Which unit did you measure the drop height in?", "\U0001F4CF", "centimetres", ["hand spans", "seconds"], "A standard unit."),
             ]},
             "That is the whole lesson finished, and the whole of Grade 4 Science. You can run a fair test from question to conclusion."),
    ],
}

LESSON["about"] = [
    "Match a question to one of the five types of enquiry.",
    "Name the variables in a fair test: change one, measure one, keep the rest the same.",
    "Say why repeating a measurement makes the data more reliable.",
    "Record results in standard units and plot them as a dot plot.",
]

LESSON["lecture"] = [
    part("\U0001FA81", "One investigation",
         "Today is one whole investigation, start to finish. The question: does a paper spinner with bigger wings fall more slowly? To answer it, you will do everything a scientist does."),
    part("⚖️", "A fair test",
         "First, which type of enquiry? We change one thing, the wings, and see what happens. That is a fair test. In a fair test you change one variable, measure one variable, and keep every other variable the same: the height, the paper, the paperclip, the person dropping."),
    part("⏱️", "The right kit, the right units",
         "You need a stopwatch to time the fall, in seconds, and a tape measure to set the drop height, in centimetres. Standard units, so anyone anywhere could check your results."),
    part("\U0001F522", "Repeat it",
         "Drop it once and you get a number. But was your thumb slow on the stopwatch? Did a draught catch it? Drop it three times. Three close numbers are reliable. One odd number stands out, and you know to doubt it."),
    part("\U0001F4CA", "Plot it and conclude",
         "Put each drop as a dot above its time: a dot plot. The dots cluster, and the cluster is your answer. Then write the conclusion: what the results say about the question you asked."),
]

LESSON["words"] = [
    word("variable", "\U0001F504", "Anything in a test that could change.",
         ["Wing size is a variable.", "Keep every other variable the same."]),
    word("fair test", "⚖️", "A test where you change one variable and keep all the others the same.",
         ["A fair test changes only the wings.", "Is it a fair test if the height changes too?"]),
    word("reliable", "✅", "Trustworthy. Repeated measurements that agree are reliable.",
         ["Three close times are reliable.", "One measurement is less reliable than three."]),
    word("repeat", "\U0001F522", "To do the same measurement again.",
         ["Repeat the drop three times.", "Repeats show the odd one out."]),
    word("standard unit", "\U0001F4CF", "A unit that is the same for everyone, like a second or a centimetre.",
         ["Seconds are a standard unit.", "Use standard units so others can compare."]),
    word("dot plot", "\U0001F4CA", "A chart with one dot for each measurement, placed above its value.",
         ["The dot plot showed a cluster at 2.1.", "Draw a dot plot of the drops."]),
    word("conclusion", "\U0001F4DD", "What the results tell you about the question you asked.",
         ["Our conclusion: about 2.1 seconds, reliably.", "A conclusion comes from the results."]),
]

LESSON["home"] = [
    home("Make and drop a spinner", "A strip of paper, scissors, a paperclip, a stopwatch or phone timer, a tape measure",
         ["Cut two slits to make two wings; fold them out; put the paperclip on the bottom.",
          "Drop it from exactly one metre, three times, timing each drop.",
          "Write the three times down."],
         "Are they close? Which is the odd one, if any? What is your reliable answer?"),
    home("Change the wings", "Two spinners, one with wings twice as long, the same paper and clip",
         ["Drop each spinner three times from the same height.",
          "Write down all six times.",
          "Compare the two clusters."],
         "That is the fair test. Which spinner fell more slowly? What was the one thing you changed?"),
    home("Dot plot on the fridge", "Paper, a pencil, your six times",
         ["Draw a line and mark times along it: 1.5, 2.0, 2.5, 3.0 seconds.",
          "Put a dot above the line for each drop, one colour per spinner.",
          "Write your conclusion under it."],
         "Two clusters, and the answer to the question, on one sheet."),
]
