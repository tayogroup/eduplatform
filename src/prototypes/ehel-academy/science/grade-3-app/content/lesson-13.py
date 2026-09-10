# -*- coding: utf-8 -*-
"""Lesson 13 - The Moon.

0097 Stage 3: 3ESs.01 the Moon's regular change in position and appearance;
3ESs.02 the relative movement of the Earth and Moon; 3ESs.03 the Earth,
Sun and Moon as approximately spherical; 3TWSm.02 make and use a physical
model; with 3TWSp.02, 3TWSp.03, 3TWSa.03 and 3SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "the-moon",
    "title": "The Moon",
    "blurb": "See that the Earth, the Sun and the Moon are all spheres, watch the Moon change through a month, put its phases in order, build a model of the Moon going round the Earth, and find out what people used to think.",
    "steps": [
        step("demo", "Three spheres", "\U0001F30D", "Three balls", ["3ESs.03", "3SIC.01"],
             "The Earth, the Sun and the Moon are all shaped like balls. Press <b>Next</b>.",
             explain(
                 ["A sphere is a ball shape.", "The Earth, the Sun and the Moon are all roughly spheres."],
                 ["The Earth looks flat from where you stand because it is so big.", "From space it is a blue ball.", "The Moon is a smaller grey ball.", "The Sun is a huge ball of fire."],
                 ["Children think the Moon is a flat disc because it looks flat.", "It is a ball. The shadow across it curves, and that is a ball's shadow."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"scene": {"id": "globe", "state": 0}, "cap": "The <b>Earth</b>: a sphere, seen from space.", "say": "The Earth is a sphere: a ball. It looks flat from where you stand because it is so big, but from space it is a round blue ball."},
                 {"pic": "\U0001F315", "cap": "The <b>Moon</b>: a smaller sphere of rock.", "say": "The Moon is a sphere too, a smaller ball of grey rock. Look at the full Moon: the edge is a curve all the way round."},
                 {"scene": {"id": "sky", "state": 3}, "cap": "The <b>Sun</b>: a huge sphere of burning gas.", "say": "The Sun is a sphere as well, a huge ball of burning gas, far bigger than the Earth. Never look straight at it."},
                 {"pic": "\U0001F4DC", "cap": "Long ago, many people thought the Earth was <b>flat</b>. Ships, shadows and, later, photographs from space showed it is a sphere.", "say": "Long ago, many people thought the Earth was flat. Sailors noticed ships disappear bottom first over the horizon. The Earth's shadow on the Moon is always curved. And now we have photographs from space. The Earth is a sphere."},
             ]},
             "Earth, Sun and Moon: three spheres."),

        step("experiment", "The Moon through a month", "\U0001F319", "Moon watch", ["3ESs.01", "3TWSp.03", "3TWSa.03", "3TWSp.02"],
             "Watch the Moon every three nights for a month. Predict what you will see.",
             explain(
                 ["The Moon looks different every night, and the changes repeat every month.", "That is observing over time."],
                 ["New Moon: dark.", "Crescent: a thin slice.", "Half Moon.", "Full Moon: the whole face lit.", "Then back down to new."],
                 ["Children think the Moon really changes shape.", "It is always a ball. We see different amounts of its sunlit side."],
                 ["Predict, watch the month, say what happened, then conclude."]),
             {"sim": "moonPhases",
              "predict": {"ask": "Over a month, what will the Moon do?",
                          "opts": [opt("Look bigger night by night, then smaller again", True), opt("Look exactly the same every night", False), opt("Disappear for good", False)]},
              "runAsk": "Press Three days later, eight times, and watch the Moon change.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("More of it was lit each night until it was full, then less each night, back to new", True), opt("It stayed a full circle all month", False), opt("It changed colour", False)],
                           "why": "New, crescent, half, gibbous, full, and back again. A regular pattern, about four weeks long."},
              "conclude": {"ask": "Does the Moon really change shape?",
                           "opts": [opt("No. It is always a sphere; we see different amounts of its sunlit side", True), opt("Yes, it grows and shrinks", False), opt("Yes, it is a different Moon each week", False)],
                           "why": "The Moon is a ball lit by the Sun. As it goes round the Earth, we see more or less of the lit half."}},
             "The Moon's shape seems to change in a regular pattern, every month."),

        step("order", "The phases in order", "\U0001F311", "Moon phases", ["3ESs.01"],
             "Put the Moon's phases in order, starting from the new Moon.",
             explain(
                 ["The phases always come in the same order."],
                 ["New Moon: dark.", "Crescent: a thin curve on the right.", "Half Moon: the right half lit.", "Full Moon: all lit."],
                 ["Children put the full Moon first.", "Start from new, when it is dark, and watch it grow."],
                 ["Tap the new Moon first."]),
             {"items": [
                 {"pic": "\U0001F311", "label": "new Moon", "say": "New Moon. The side facing us is dark. You can hardly see it."},
                 {"pic": "\U0001F312", "label": "crescent", "say": "A crescent: a thin lit curve on the right."},
                 {"pic": "\U0001F313", "label": "half Moon", "say": "Half Moon: the right half is lit."},
                 {"pic": "\U0001F315", "label": "full Moon", "say": "Full Moon: the whole face is lit. Then it shrinks back to new."},
             ]},
             "New, crescent, half, full. Then back again."),

        step("build", "Build a model: Earth and Moon", "\U0001F527", "Moon model", ["3ESs.02", "3TWSm.02", "3ESs.03"],
             "Make a physical model. Tap the Earth, the Moon and the Moon's path, then make it move.",
             explain(
                 ["The Moon goes round the Earth. The Earth spins.", "A model shows both clearly."],
                 ["Add the Earth.", "Add the Moon.", "Add the path the Moon follows.", "Turn one month: the Moon goes right round the Earth.", "Spin one day: the Earth turns once."],
                 ["Children think the Moon goes round once a day.", "It takes about four weeks. The EARTH turns once a day."],
                 ["Tap the three parts, then press both buttons."]),
             {"sim": "earthMoon",
              "parts": [
                  {"id": "earth", "label": "the Earth", "pic": "\U0001F30D"},
                  {"id": "moon", "label": "the Moon", "pic": "\U0001F315"},
                  {"id": "orbit", "label": "the Moon's path", "pic": "\U0001F504"},
              ]},
             "The Moon goes round the Earth once a month. The Earth spins once a day."),

        step("context", "What people thought about the sky", "\U0001F4DC", "Sky history", ["3SIC.01", "3ESs.02"],
             "Ideas about the Earth, Sun and Moon have changed. Tap each one.",
             explain(
                 ["What people know changes when they look more carefully."],
                 ["People thought the Earth was flat.", "People thought the Sun went round the Earth.", "Telescopes showed the Moon is a rocky ball with mountains.", "Astronauts stood on the Moon and looked back at the round Earth."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F5FA️", "label": "a flat Earth", "say": "Long ago, many people thought the Earth was flat, like a plate, because that is how it looks from the ground."},
                 {"pic": "☀️", "label": "the Sun going round us", "say": "People watched the Sun cross the sky and thought it went round the Earth. It is the Earth that turns. It took careful measuring to prove it."},
                 {"pic": "\U0001F52D", "label": "the telescope", "say": "About four hundred years ago, telescopes showed the Moon is a rocky ball with mountains and craters, not a smooth disc."},
                 {"pic": "\U0001F468\U0001F3FE‍\U0001F680", "label": "astronauts", "say": "In 1969 astronauts stood on the Moon and photographed the Earth: a round blue ball hanging in space."},
             ], "need": 4,
              "then": {"ask": "Why did people think the Earth was flat?",
                       "opts": [opt("Because it looks flat from the ground, and they had not looked from space", True), opt("Because it was flat then", False), opt("Because the Moon told them", False)],
                       "why": "It looks flat because it is so big. Better looking changed the idea."}},
             "Better looking changes what we know."),

        step("questions", "Moon check", "✅", "Moon check", ["3ESs.01", "3ESs.02", "3ESs.03"],
             "Tap the answer.",
             explain(
                 ["Spheres, phases, and who goes round whom."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What shape are the Earth, the Sun and the Moon?", "\U0001F30D", "spheres, like balls", ["flat discs", "cubes"], "All three are spheres."),
                 q("What goes round what?", "\U0001F504", "the Moon goes round the Earth", ["the Earth goes round the Moon", "neither moves"], "The Moon orbits the Earth."),
                 q("How long does the Moon take to go round the Earth once?", "\U0001F319", "about a month", ["one day", "one year"], "About four weeks."),
                 q("Which phase comes after the new Moon?", "\U0001F312", "a crescent", ["a full Moon", "a half Moon"], "A thin curve first."),
                 q("Why does the Moon seem to change shape?", "\U0001F315", "we see different amounts of its sunlit side", ["it really grows and shrinks", "clouds cover it"], "Always a ball, differently lit."),
             ]},
             "You know your Moon."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3ESs.01", "3ESs.02", "3ESs.03", "3TWSm.02", "3SIC.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Why does the Earth look flat from the ground?", "\U0001F5FA️", "because it is so big", ["because it is flat", "because of the clouds"], "A huge ball looks flat up close."),
                 q("Put in order: full Moon, new Moon, crescent.", "\U0001F311", "new Moon, crescent, full Moon", ["full Moon, new Moon, crescent", "crescent, full Moon, new Moon"], "New, crescent, half, full."),
                 q("What lights the Moon?", "☀️", "the Sun", ["the Earth", "its own fire"], "The Moon shines back the Sun's light."),
                 q("How long does the Earth take to spin round once?", "\U0001F30D", "one day", ["one month", "one year"], "Once a day: that makes day and night."),
                 q("What did you build?", "\U0001F527", "a physical model of the Earth and Moon", ["a real Moon", "a diagram of the Sun"], "A model you could make move."),
                 q("How many times does the Earth spin while the Moon goes round once?", "\U0001F504", "about 28 times", ["once", "a hundred times"], "A day is one spin; a month is about 28 days."),
                 q("What did telescopes show about the Moon?", "\U0001F52D", "it is a rocky ball with mountains and craters", ["it is made of cheese", "it is flat"], "Better looking, better knowing."),
                 q("Which is the biggest?", "☀️", "the Sun", ["the Earth", "the Moon"], "The Sun is far bigger than the Earth."),
             ]},
             "That is the whole lesson finished, and the whole of Grade 3 Science."),
    ],
}

LESSON["about"] = [
    "Say that the Earth, the Sun and the Moon are spheres.",
    "Describe how the Moon's appearance changes through a month, in order.",
    "Say how the Earth and the Moon move.",
    "Build and use a physical model of the Earth and the Moon.",
]

LESSON["lecture"] = [
    part("\U0001F30D", "Three spheres",
         "The Earth, the Sun and the Moon are all shaped like balls: spheres. The Earth looks flat from where you stand because it is so big. From space it is a round blue ball."),
    part("\U0001F319", "The Moon's month",
         "Look at the Moon every night and it seems to change. A thin crescent, then a half Moon, then a full circle, then back down to nothing. It takes about four weeks and then it starts again."),
    part("\U0001F315", "Always a ball",
         "The Moon does not really change shape. It is always a ball, and the Sun lights one half of it. As the Moon goes round the Earth, we see more or less of that lit half."),
    part("\U0001F504", "Round and round",
         "The Moon goes round the Earth once a month. The Earth spins once a day, and that gives us day and night. Today you will build a model that does both."),
    part("\U0001F4DC", "What people used to think",
         "Long ago people thought the Earth was flat and the Sun went round it. Careful measuring, telescopes and finally photographs from space changed all that. Science changes when people look more carefully."),
]

LESSON["words"] = [
    word("sphere", "\U0001F30D", "A ball shape.",
         ["The Earth is a sphere.", "The Moon is a smaller sphere."]),
    word("Moon", "\U0001F315", "The ball of rock that goes round the Earth once a month.",
         ["The Moon shines back the Sun's light.", "The Moon goes round the Earth."]),
    word("phase", "\U0001F313", "How much of the Moon looks lit on one night: new, crescent, half, full.",
         ["Tonight's phase is a crescent.", "The phases repeat every month."]),
    word("crescent", "\U0001F312", "A thin curved slice of lit Moon.",
         ["A crescent Moon came after the new Moon.", "The crescent grew into a half Moon."]),
    word("full Moon", "\U0001F315", "The phase when the whole face of the Moon is lit.",
         ["A full Moon lit up the garden.", "After the full Moon it shrinks again."]),
    word("orbit", "\U0001F504", "The path something takes going round something else.",
         ["The Moon's orbit round the Earth takes a month.", "We drew the orbit as a dotted line."]),
    word("spin", "\U0001F30D", "To turn round on the spot. The Earth spins once a day.",
         ["The Earth spins, so we get day and night.", "Spin the globe slowly."]),
]

LESSON["home"] = [
    home("Moon diary", "A clear night sky, a notebook, a pencil",
         ["Every night you can see the Moon, draw its shape and write the date.",
          "Keep going for four weeks.",
          "Look at the row of drawings."],
         "New, crescent, half, full, and back. Observing over time."),
    home("A lamp and a ball", "A lamp in a dark room, a ball, you",
         ["Stand with the lamp on one side. The lamp is the Sun; the ball is the Moon; you are the Earth.",
          "Hold the ball out and turn slowly on the spot.",
          "Watch how much of the lit side of the ball you can see."],
         "The ball is always a ball. You see a crescent, a half, a full, just like the Moon."),
    home("Ships and the horizon", "A beach or a big lake, a grown-up, a sunny day",
         ["Watch a boat sail away.",
          "See which part disappears first: the bottom or the top.",
          "Say why."],
         "The bottom goes first, because the Earth curves away. That is what sailors noticed long ago."),
]
