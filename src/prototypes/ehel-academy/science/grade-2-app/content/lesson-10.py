# -*- coding: utf-8 -*-
"""Lesson 10 - The Sun Across the Sky.

0097 Stage 2: 2ESs.01 the apparent movement of the Sun during the day; with
2TWSc.02, 2TWSp.02, 2TWSa.01, 2TWSa.02, 2TWSa.03, 2TWSc.03, 2TWSc.04,
2TWSc.06, 2SIC.01 and 2SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home

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
                 {"scene": {"id": "sky", "state": 0}, "cap": "Night. Our side of the Earth is turned away from the Sun.", "say": "Night. No Sun in the sky. Our side of the Earth is turned away from the Sun, and the Sun is lighting the other side."},
                 {"scene": {"id": "sky", "state": 1}, "cap": "<b>Sunrise</b>: the Sun comes up in the <b>east</b>.", "say": "Sunrise. The Sun comes up low in the east."},
                 {"scene": {"id": "sky", "state": 2}, "cap": "<b>Midday</b>: the Sun is at its <b>highest</b>.", "say": "Midday. The Sun has climbed to its highest point."},
                 {"scene": {"id": "sky", "state": 4}, "cap": "<b>Sunset</b>: the Sun goes down in the <b>west</b>.", "say": "Sunset. The Sun sinks down and disappears in the west, the opposite side from where it rose."},
                 {"pic": "\U0001F305➡️☀️➡️\U0001F307", "cap": "East, up high, west. Nearly the same path <b>each day</b>.", "say": "East in the morning, high at midday, west in the evening. Nearly the same path each day."},
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
              "compare": {"ask": "Morning 3 hands, midday 1 hand, afternoon 3 hands. When was the shadow <b>shortest</b>?",
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

        step("demo", "Make a shadow clock", "\U0001F570️", "Clock maker", ["2TWSc.02", "2ESs.01", "2TWSm.02"],
             "You can make a <b>shadow clock</b> that uses the Sun's movement to tell the time. Press <b>Next</b>.",
             explain(
                 ["A shadow clock is a simple tool that tells the time from the Sun's shadow.", "It only needs a stick, a pot and some stones, used the right way."],
                 ["A stick in a pot of sand, in a sunny place.", "Every hour, mark where the tip of the shadow is and write the time.",
                  "By evening the marks make a curve, and tomorrow the shadow will touch each mark at the same time."],
                 ["Children move the pot between marks.", "The pot must stay exactly where it is all day, or the marks mean nothing."],
                 ["Press Next, then make one for real on a sunny day."]),
             {"frames": [
                 {"pic": "\U0001FAB4", "cap": "A stick standing up in a pot of sand, in a sunny spot outside.", "say": "Push a stick into a pot of sand and stand it in a sunny spot outside. Do not move the pot all day."},
                 {"pic": "\U0001F305", "cap": "At 9 o'clock, put a stone where the shadow's tip is. Write 9.", "say": "At nine o'clock, put a small stone where the tip of the shadow is, and write nine on it."},
                 {"pic": "☀️", "cap": "Every hour, another stone. The shadow swings round and gets shorter, then longer.", "say": "Every hour, put another stone at the shadow's tip. Watch the shadow swing round and shrink, then grow."},
                 {"pic": "\U0001F570️", "cap": "By evening the stones make a curve that follows the Sun's day. Tomorrow it tells the <b>time</b>.", "say": "By evening the stones make a curve that follows the Sun across the sky. Tomorrow, the shadow will touch each stone at the same time, and your shadow clock tells the time."},
                 {"pic": "🔦", "cap": "No sun today? Make a <b>model</b>: a torch is the Sun, a pencil in play dough is the stick.", "say": "No sun today? Make a model of the Sun's day. A torch is the Sun, and a pencil standing in play dough is the stick. Hold the torch low on one side, then high over the top, then low on the other side, and watch the pencil's shadow swing round and change length."},
             ]},
             "A shadow clock uses the Sun's moving shadow to tell the time."),

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
              "then": {"ask": "Why does the Sun <b>seem</b> to move across the sky?",
                       "opts": [opt("Because the Earth is turning", True), opt("Because the Sun flies round us", False), opt("Because of the wind", False)],
                       "why": "What people knew changed: it is the Earth that turns, and the Sun only seems to move."}},
             "It looks as if the Sun moves. It is the Earth that turns."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2ESs.01", "2TWSa.02"],
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
                 q("A shadow clock tells the time using...", "\U0001F570️", "the shadow made by the Sun", ["batteries inside it", "the light of the Moon at midday"], "As the Sun moves across the sky, the shadow moves round, so the shadow shows the time."),
                 q("Why does the Sun seem to move across the sky?", "\U0001F504", "the Earth is turning", ["the Sun flies round the Earth", "clouds push it"], "It is the Earth that turns; the Sun only seems to move."),
                 q("Why is your shadow short at midday?", "☀️", "the Sun is high in the sky", ["the Sun is low in the east", "your body shrinks at lunchtime"], "When the Sun is high, its light comes from above you, so your shadow is short."),
             ]},
             "That is the whole lesson finished, and the whole of Grade 2 Science."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say where the Sun rises, where it is at midday, and where it sets.",
    "Measure a shadow through the day and record it.",
    "Graph the shadows and read the pattern.",
    "Put a day's events in order.",
]

LESSON["warmup"] = [
    q("When is it dark outside?", "\U0001F319", "at night", ["at midday", "in the afternoon"], "At night our side of the Earth is turned away from the Sun."),
    q("What makes your shadow on a sunny day?", "\U0001F464", "your body blocking the Sun's light", ["the wind", "the grass"], "A shadow is the dark shape where something blocks the light."),
]

LESSON["lecture"] = [
    part("\U0001F305", "Sunrise",
         "In the morning the Sun comes up low in the east. Long shadows stretch across the ground, pointing west."),
    part("\u2600\uFE0F", "Midday",
         "By midday the Sun has climbed to its highest point. Shadows are short, the shortest all day."),
    part("\U0001F307", "Sunset",
         "In the evening the Sun sinks low in the west and disappears. Shadows are long again, pointing east. The Sun rises in the east and sets in the west, every day."),
    part("\U0001F4CA", "Measuring shadows",
         "Stand a stick in the sun. Measure its shadow at nine, at midday and at three. Long, short, long. Write it in a table and graph it."),
    part("\U0001F30D", "It is the Earth that turns",
         "It looks as if the Sun moves across the sky. It does not. The Earth turns, once a day, and that swings us past the Sun. Scientists worked that out by watching and measuring."),
]

LESSON["words"] = [
    word("sunrise", "\U0001F305", "When the Sun first comes up in the morning, in the east.",
         ["Sunrise was at six o'clock.", "At sunrise the shadows are long."]),
    word("sunset", "\U0001F307", "When the Sun goes down in the evening, in the west.",
         ["We watched the sunset.", "After sunset it gets dark."]),
    word("midday", "\u2600\uFE0F", "The middle of the day, when the Sun is highest.",
         ["At midday my shadow is short.", "We eat lunch at midday."]),
    word("east", "\U0001F9ED", "The side of the sky where the Sun rises.",
         ["The Sun rises in the east.", "My window faces east."]),
    word("west", "\U0001F5FA\uFE0F", "The side of the sky where the Sun sets.",
         ["The Sun sets in the west.", "The shadow pointed west in the morning."]),
    word("shadow", "\U0001F464", "A dark shape on the ground where something blocks the Sun's light.",
         ["The stick's shadow points west.", "Shadows are shortest at midday."]),
    word("turn", "\U0001F300", "To go round. The Earth turns once a day.",
         ["The Earth turns.", "Turn the globe slowly."]),
]

LESSON["home"] = [
    home("Shadow clock", "A stick, a pot of sand or soil, some small stones, a sunny day",
         ["Never look straight at the Sun. Look at the shadow on the ground instead.",
          "Stand the stick in the pot in a sunny place.",
          "Every hour, put a stone at the tip of the shadow.",
          "By evening, look at the curve of stones."],
         "The shadow swings round and changes length. Shortest at midday."),
    home("Sunrise and sunset watch", "A window, a grown-up, a clock",
         ["Never look straight at the Sun, not even through a window.",
          "Note where in the sky the Sun comes up. Which side of the house?",
          "Note where it sets. Which side?",
          "Do it again the next day."],
         "The same sides both days. East and west."),
    home("Measure your own shadow", "A sunny day, a friend, chalk",
         ["Never look straight at the Sun. Look at your shadow on the ground instead.",
          "At nine, midday and three, stand on the same spot.",
          "A friend marks the end of your shadow.",
          "Measure each one in foot-lengths and write them down."],
         "Long, short, long."),
]
