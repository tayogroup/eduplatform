# -*- coding: utf-8 -*-
"""Lesson 10 - The Sun Across the Sky.

0097 Stage 2: 2ESs.01 the apparent movement of the Sun during the day; with
2TWSm.02, 2TWSp.02, 2TWSa.01, 2TWSa.02, 2TWSa.03, 2TWSc.03, 2TWSc.04,
2TWSc.06, 2SIC.01 and 2SIC.03.
"""
from _kit import explain, step, opt, q

LESSON = {
    "slug": "the-sun-across-the-sky",
    "title": "The Sun Across the Sky",
    "blurb": "Watch the Sun rise in the east and set in the west, measure a stick's shadow through the day, graph it, and find out what people used to think the Sun was doing.",
    "steps": [
        step("demo", "Sunrise to sunset", "\U0001F305", "Sun watcher", ["2ESs.01"],
             "The Sun seems to move across the sky every day. Press <b>Next</b> and follow it.",
             explain(
                 ["Every day the Sun seems to rise on one side of the sky, climb high, and go down on the other side."],
                 ["It rises in the east, in the morning.", "By midday it is at its highest.", "In the afternoon it sinks towards the west.", "At sunset it disappears in the west."],
                 ["Children think the Sun goes straight up and straight down in the same place.", "It comes up on one side and goes down on the other."],
                 ["Press Next and say where the Sun is each time."]),
             {"frames": [
                 {"scene": {"id": "sky", "state": 0}, "cap": "Night. The Sun is below the ground on the far side of the Earth.", "say": "Night. No Sun in the sky. It is lighting the other side of the Earth."},
                 {"scene": {"id": "sky", "state": 1}, "cap": "<b>Sunrise</b>: the Sun comes up in the <b>east</b>.", "say": "Sunrise. The Sun comes up low in the east."},
                 {"scene": {"id": "sky", "state": 2}, "cap": "<b>Midday</b>: the Sun is at its <b>highest</b>.", "say": "Midday. The Sun has climbed to its highest point."},
                 {"scene": {"id": "sky", "state": 1}, "cap": "<b>Sunset</b>: the Sun goes down in the <b>west</b>.", "say": "Sunset. The Sun sinks down and disappears in the west, the opposite side from where it rose."},
                 {"pic": "\U0001F305➡️☀️➡️\U0001F307", "cap": "East, up high, west. The same path <b>every day</b>.", "say": "East in the morning, high at midday, west in the evening. The same path every single day."},
             ]},
             "The Sun rises in the east, is highest at midday, and sets in the west."),

        step("experiment", "A stick and its shadow", "\U0001F9EA", "Shadow stick", ["2ESs.01", "2TWSp.02", "2TWSa.01", "2TWSc.04"],
             "A stick in the ground makes a shadow. Predict, then watch the Sun and the shadow through the day.",
             explain(
                 ["A shadow is the dark patch where a thing blocks the light.", "As the Sun moves, the shadow moves too, and changes length."],
                 ["Predict where the Sun will be at midday.", "Then press Three hours later and watch both the Sun and the shadow.",
                  "When the Sun is low the shadow is long. When the Sun is high the shadow is short."],
                 ["Children expect the shadow to point at the Sun.", "It points away from the Sun, on the opposite side of the stick."],
                 ["Tap your prediction, then press the button until sunset."]),
             {"sim": "sunPath",
              "predict": {"ask": "Where do you think the Sun will be at <b>midday</b>?",
                          "opts": [opt("High in the sky, at its highest", True), opt("Low in the east", False), opt("Low in the west", False)]},
              "runAsk": "Press Three hours later and watch the Sun and the shadow, until sunset.",
              "happened": {"ask": "What happened to the shadow through the day?",
                           "opts": [opt("Long in the morning, shortest at midday, long again in the evening, and it swung round", True), opt("It stayed the same all day", False), opt("It got longer and longer", False)],
                           "why": "The Sun rose in the east, was highest at midday and set in the west. The shadow was long, then short, then long, and it pointed away from the Sun the whole time."}},
             "As the Sun moves across the sky, the shadow swings round and changes length."),

        step("measure", "Measure the shadow", "\U0001F4CF", "Shadow ruler", ["2TWSc.03", "2ESs.01"],
             "Measure the stick's shadow in <b>hand spans</b>. Lay a hand along it each time.",
             explain(
                 ["A shadow can be measured in hand spans, laid end to end along it."],
                 ["The morning shadow is long: three hands.", "The midday shadow is short: one hand.", "The afternoon shadow is long again: three."],
                 ["Children measure from the wrong end.", "Start at the bottom of the stick and go to the tip of the shadow."],
                 ["Measure all three shadows, then compare."]),
             {"ask": "How long is %s? Lay hands along it.",
              "unit": {"name": "hand spans", "singular": "hand span", "pic": "\U0001F590️", "button": "Lay down a hand"},
              "objects": [
                  {"pic": "\U0001F305", "label": "the 9 o'clock shadow", "units": 3},
                  {"pic": "☀️", "label": "the midday shadow", "units": 1},
                  {"pic": "\U0001F307", "label": "the 3 o'clock shadow", "units": 3},
              ],
              "compare": {"ask": "Morning 3 hands, midday 1 hand, afternoon 3 hands. When was the shadow SHORTEST?",
                          "opts": [opt("at midday, when the Sun was highest", True), opt("at 9 o'clock", False), opt("at 3 o'clock", False)],
                          "why": "1 hand is the shortest. The higher the Sun, the shorter the shadow."}},
             "Long, short, long. The shadow measured in hands."),

        step("record", "Record the shadows", "\U0001F4DD", "Shadow table", ["2TWSc.06"],
             "Put your shadow measurements into the table. How long was the shadow at <b>%s</b>?",
             explain(
                 ["A table holds each time beside its measurement."],
                 ["9 o'clock: three hands.", "Midday: one hand.", "3 o'clock: three hands."],
                 [],
                 ["Fill in each row."]),
             {"ask": "How long was the shadow at %s?",
              "columns": ["Time", "Shadow in hand spans"],
              "rows": [
                  {"pic": "\U0001F305", "label": "9 o'clock", "answer": "3", "why": "at 9 o'clock the shadow was three hands long."},
                  {"pic": "☀️", "label": "midday", "answer": "1", "why": "at midday the shadow was one hand long."},
                  {"pic": "\U0001F307", "label": "3 o'clock", "answer": "3", "why": "at 3 o'clock the shadow was three hands long."},
              ],
              "choices": [{"id": "1", "t": "1 hand", "pic": "1️⃣"}, {"id": "2", "t": "2 hands", "pic": "2️⃣"}, {"id": "3", "t": "3 hands", "pic": "3️⃣"}]},
             "Three times, three lengths, in a table."),

        step("graph", "Graph the shadow", "\U0001F4CA", "Shadow graph", ["2TWSa.03", "2TWSa.02"],
             "Build a block graph from your table: one block for each hand span. Then read the pattern.",
             explain(
                 ["A block graph shows the pattern of the day at a glance."],
                 ["Three blocks in the morning.", "One at midday.", "Three in the afternoon.", "The columns go down and then up again."],
                 ["Children expect the columns to keep going up.", "This pattern dips in the middle, because the Sun is highest at midday."],
                 ["Build the three columns, then read the pattern."]),
             {"columns_label": "Time", "value_label": "Hand spans", "unit": "hands",
              "columns": [
                  {"pic": "\U0001F305", "label": "9 o'clock", "value": 3},
                  {"pic": "☀️", "label": "midday", "value": 1},
                  {"pic": "\U0001F307", "label": "3 o'clock", "value": 3},
              ],
              "pattern": {"ask": "What is the pattern in your graph?",
                          "opts": [opt("The shadow gets shorter towards midday, then longer again", True), opt("The shadow gets longer all day", False), opt("The shadow stays the same", False)],
                          "why": "Down, then up: the shadow is shortest when the Sun is highest, at midday."}},
             "Decreasing, then increasing: shortest at midday."),

        step("order", "A day in order", "\U0001F305", "Day in order", ["2ESs.01"],
             "Put the Sun's day in order. Tap what comes <b>first</b>.",
             explain(
                 ["The Sun's day always happens in the same order."],
                 ["Sunrise in the east.", "Morning, climbing.", "Midday, highest.", "Afternoon, sinking.", "Sunset in the west."],
                 [],
                 ["Tap the five in order from sunrise."]),
             {"items": [
                 {"pic": "\U0001F305", "label": "sunrise in the east", "say": "Sunrise. The Sun comes up in the east."},
                 {"pic": "\U0001F324️", "label": "morning, climbing", "say": "Morning. The Sun climbs higher."},
                 {"pic": "☀️", "label": "midday, highest", "say": "Midday. The Sun is at its highest and shadows are shortest."},
                 {"pic": "\U0001F325️", "label": "afternoon, sinking", "say": "Afternoon. The Sun sinks towards the west."},
                 {"pic": "\U0001F307", "label": "sunset in the west", "say": "Sunset. The Sun goes down in the west."},
             ]},
             "Sunrise, morning, midday, afternoon, sunset. Every day."),

        step("demo", "Make a shadow clock", "\U0001F570️", "Model maker", ["2TWSm.02", "2ESs.01"],
             "You can <b>make a model</b> that shows the Sun's movement: a shadow clock. Press <b>Next</b>.",
             explain(
                 ["A model is something you make that works like the real thing and shows an idea.", "A shadow clock is a model of the Sun's day."],
                 ["A stick in a pot of sand, in a sunny place.", "Every hour, mark where the tip of the shadow is and write the time.",
                  "By evening the marks make a curve, and tomorrow the shadow will touch each mark at the same time."],
                 ["Children move the pot between marks.", "The pot must stay exactly where it is all day, or the marks mean nothing."],
                 ["Press Next, then make one for real on a sunny day."]),
             {"frames": [
                 {"pic": "\U0001FAB4", "cap": "A stick standing up in a pot of sand, in a sunny spot outside.", "say": "Push a stick into a pot of sand and stand it in a sunny spot outside. Do not move the pot all day."},
                 {"pic": "\U0001F305", "cap": "At 9 o'clock, put a stone where the shadow's tip is. Write 9.", "say": "At nine o'clock, put a small stone where the tip of the shadow is, and write nine on it."},
                 {"pic": "☀️", "cap": "Every hour, another stone. The shadow swings round and gets shorter, then longer.", "say": "Every hour, put another stone at the shadow's tip. Watch the shadow swing round and shrink, then grow."},
                 {"pic": "\U0001F570️", "cap": "By evening the stones make a curve: a <b>model</b> of the Sun's day. Tomorrow it tells the time.", "say": "By evening the stones make a curve. That is a model of the Sun's day. Tomorrow, the shadow will touch each stone at the same time, and your model tells the time."},
             ]},
             "A shadow clock is a model you can make of the Sun's movement."),

        step("context", "What people thought the Sun was doing", "\U0001F52D", "Sky watchers", ["2SIC.01", "2SIC.03"],
             "People have always watched the Sun cross the sky. Tap each picture.",
             explain(
                 ["Because the Sun seems to move across the sky, people long ago thought it really did go round the Earth.", "Now we know it is the Earth that turns, and the Sun only seems to move."],
                 ["Long ago people believed the Sun travelled round the Earth every day.", "Now we know the Earth spins once a day, and that spin makes the Sun seem to rise and set.",
                  "Astronomers are the scientists who worked that out, and shadow clocks were among their first tools."],
                 ["Children ask why the Sun looks like it moves if it does not.", "Sit on a roundabout and the playground seems to move. It is you that is turning."],
                 ["Tap each picture and compare then with now."]),
             {"items": [
                 {"pic": "\U0001F30D", "label": "the Sun goes round us", "say": "Long ago people thought the Sun travelled right round the Earth every day, because that is exactly what it looks like."},
                 {"pic": "\U0001F504", "label": "the Earth turns", "say": "Now we know the Earth spins round once every day. That spin is what makes the Sun seem to rise, cross the sky and set."},
                 {"pic": "\U0001F3A0", "label": "the roundabout", "say": "On a roundabout the playground seems to whirl past you. It is you that is turning. The Sun is like that."},
                 {"pic": "\U0001F52D", "label": "astronomers", "say": "Astronomers are the scientists who study the sky. Shadow clocks like yours were among their first tools, thousands of years ago."},
             ], "need": 4,
              "then": {"ask": "Why does the Sun SEEM to move across the sky?",
                       "opts": [opt("Because the Earth is turning", True), opt("Because the Sun flies round us", False), opt("Because of the wind", False)],
                       "why": "What people knew changed: it is the Earth that turns, and the Sun only seems to move."}},
             "It looks as if the Sun moves. It is the Earth that turns."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2ESs.01", "2TWSa.02", "2TWSm.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["East, high, west.", "Long shadow, short shadow, long shadow."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where does the Sun rise?", "\U0001F305", "in the east", ["in the west", "straight overhead", "in the north"], "The Sun rises in the east every day."),
                 q("Where does the Sun set?", "\U0001F307", "in the west", ["in the east", "in the same place it rose"], "The Sun sets in the west, the opposite side."),
                 q("When is the Sun highest in the sky?", "☀️", "at midday", ["at sunrise", "at sunset", "at night"], "The Sun is at its highest at midday."),
                 q("When is a stick's shadow shortest?", "\U0001F4CF", "at midday, when the Sun is highest", ["at 9 o'clock", "at sunset"], "The higher the Sun, the shorter the shadow."),
                 q("Which way does a shadow point?", "\U0001F311", "away from the Sun", ["towards the Sun", "always north"], "The shadow is on the opposite side of the stick from the Sun."),
                 q("What pattern did the shadow graph show?", "\U0001F4CA", "shorter towards midday, then longer again", ["longer all day", "the same all day"], "Down, then up."),
                 q("A shadow clock is a...", "\U0001F570️", "model of the Sun's day", ["real clock with batteries", "picture"], "A model you make that shows the idea."),
                 q("Why does the Sun SEEM to move across the sky?", "\U0001F504", "the Earth is turning", ["the Sun flies round the Earth", "clouds push it"], "It is the Earth that turns; the Sun only seems to move."),
             ]},
             "That is the whole lesson finished, and the whole of Grade 2 Science."),
    ],
}
