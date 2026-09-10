# -*- coding: utf-8 -*-
"""Lesson 7 - Light and Dark.

0097 Stage 2: 2Ps.01 many light sources, including the Sun; 2Ps.02 darkness
is the absence of light; 2TWSm.01 a model represents an idea; with 2TWSp.01,
2TWSp.02, 2TWSa.01, 2TWSc.01 and 2SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home

RAY_MODEL = ('<svg viewBox="0 0 160 90"><rect width="160" height="90" fill="#0E2434"/><circle cx="24" cy="45" r="12" fill="#F4C95D"/>'
             '<g stroke="#F4C95D" stroke-width="2"><line x1="36" y1="45" x2="130" y2="20"/><line x1="36" y1="45" x2="130" y2="45"/><line x1="36" y1="45" x2="130" y2="70"/></g>'
             '<text x="135" y="49" fill="#fff" font-size="16">\U0001F441️</text><text x="6" y="82" fill="#93AABE" font-size="8" font-family="Inter, sans-serif">light travels in straight lines from the source to the eye</text></svg>')

LESSON = {
    "slug": "light-and-dark",
    "title": "Light and Dark",
    "blurb": "Find the things that make light, including the Sun, tell them from things that only shine light back, switch a room to total darkness, and see how scientists model light.",
    "steps": [
        step("explore", "Things that make light", "\U0001F4A1", "Light sources", ["2Ps.01"],
             "A <b>light source</b> makes its own light. Tap each one.",
             explain(
                 ["A light source is anything that makes its own light.", "The biggest one is the Sun."],
                 ["The Sun, a lamp, a candle, a torch, a fire, lightning, a TV screen, a glow-worm.", "Each one makes light. Switch it off, blow it out, and the light stops."],
                 ["Children say the Moon is a light source.", "The Moon makes no light of its own. It only shines back the Sun's light, like a mirror."],
                 ["Tap all eight and say the source out loud."]),
             {"items": [
                 {"pic": "☀️", "label": "the Sun", "say": "The Sun. The biggest light source there is. Daylight is sunlight."},
                 {"pic": "\U0001F4A1", "label": "a lamp", "say": "A lamp makes light from electricity."},
                 {"pic": "\U0001F56F️", "label": "a candle", "say": "A candle flame makes light as the wax burns."},
                 {"pic": "\U0001F526", "label": "a torch", "say": "A torch makes light from its battery."},
                 {"pic": "\U0001F525", "label": "a fire", "say": "A fire makes light and heat as the wood burns."},
                 {"pic": "⚡", "label": "lightning", "say": "Lightning makes a flash of light in a storm."},
                 {"pic": "\U0001F4FA", "label": "a screen", "say": "A television or phone screen makes its own light. That is why you can see it in the dark."},
                 {"pic": "\U0001F41B", "label": "a glow-worm", "say": "A glow-worm is an animal that makes its own light at night."},
             ], "need": 8},
             "A light source makes its own light. The Sun is the biggest."),

        step("sort", "Source, or not?", "\U0001F5C2️", "Source spotter", ["2Ps.01", "2TWSc.01"],
             "Does this <b>make</b> light, or only shine light back? Tap the right bin.",
             explain(
                 ["Some things look bright but make no light of their own.", "They only bounce back light from a real source."],
                 ["A mirror is bright in a sunny room and dark in a dark one. It makes no light.",
                  "The Moon shines back the Sun's light.", "A cat's eyes shine in a torch beam because they bounce the torch light back."],
                 ["Children think shiny means source.", "Put it in a dark cupboard. If it goes dark, it is not a source."],
                 ["Ask: in a dark room, would it still be lit?"]),
             {"ask": "A light source, or not?",
              "bins": [{"id": "yes", "label": "Makes light", "pic": "\U0001F4A1"}, {"id": "no", "label": "Only shines it back", "pic": "\U0001FA9E"}],
              "items": [
                  {"pic": "☀️", "label": "the Sun", "bin": "yes", "why": "The Sun makes its own light."},
                  {"pic": "\U0001F319", "label": "the Moon", "bin": "no", "why": "The Moon only shines back the Sun's light."},
                  {"pic": "\U0001FA9E", "label": "a mirror", "bin": "no", "why": "A mirror bounces light back. In a dark room it is dark."},
                  {"pic": "\U0001F56F️", "label": "a candle", "bin": "yes", "why": "A candle flame makes light."},
                  {"pic": "\U0001F408‍⬛", "label": "a cat's shining eyes", "bin": "no", "why": "A cat's eyes shine back the torch light. In the dark they are dark."},
                  {"pic": "\U0001F526", "label": "a torch", "bin": "yes", "why": "A torch makes light from its battery."},
                  {"pic": "\U0001F4C4", "label": "white paper", "bin": "no", "why": "White paper looks bright because it bounces light back. It makes none."},
                  {"pic": "\U0001F525", "label": "a fire", "bin": "yes", "why": "A fire makes its own light."},
                  {"pic": "\U0001F4FA", "label": "a switched-on screen", "bin": "yes", "why": "A screen makes its own light."},
                  {"pic": "\U0001F48E", "label": "a diamond", "bin": "no", "why": "A diamond sparkles by bouncing light. In a dark box it does not shine."},
              ]},
             "Makes light, or only shines it back. The dark cupboard test tells you."),

        step("experiment", "Total darkness", "\U0001F9EA", "Dark room", ["2Ps.02", "2TWSp.02", "2TWSa.01"],
             "What is darkness? Predict, then close the curtains and switch the lamp off.",
             explain(
                 ["Darkness is not a thing. Darkness is what is left when there is no light."],
                 ["Predict: with the curtains shut and the lamp off, what will you see?",
                  "Then do it. Every source of light in the room gone.", "Then switch the lamp on and it all comes back."],
                 ["Children think darkness comes in, like fog.", "Nothing comes in. The light went out, and darkness is the absence of light."],
                 ["Tap your prediction, close the curtains, switch off the lamp, look, then switch it on again."]),
             {"sim": "darkRoom",
              "predict": {"ask": "Curtains shut AND lamp off. What do you think you will see?",
                          "opts": [opt("Nothing at all. It will be completely dark", True), opt("Everything, just a bit greyer", False), opt("Only the cat", False)]},
              "runAsk": "Close the curtains. Then switch the lamp off. Look. Then switch the lamp back on.",
              "happened": {"ask": "What happened with no light source left?",
                           "opts": [opt("It was completely dark. You could see nothing", True), opt("You could still see everything", False), opt("The cat glowed", False)],
                           "why": "With every light source gone there was nothing to see by. Darkness is the absence of light. Switching the lamp on brought the light, and the seeing, back."}},
             "Darkness is what is left when there is no light."),

        step("demo", "A model of light", "\U0001F4D0", "Model maker", ["2TWSm.01", "2TWSm.03", "2Ps.01"],
             "Light is hard to see moving, so scientists draw a <b>model</b> of it. Press <b>Next</b>.",
             explain(
                 ["A model is a clear way of showing an object or an idea, so that people can think about it.", "It is not the real thing. It leaves things out on purpose."],
                 ["We cannot see light travelling, so scientists draw it as straight lines from the source to the eye.",
                  "That drawing is a model.", "A globe is a model of the Earth.", "A toy car is a model of a car."],
                 ["Children think a model has to look exactly like the thing.", "A good model shows the important idea and leaves out the rest."],
                 ["Press Next and see what each model shows, and what it leaves out."]),
             {"frames": [
                 {"pic": RAY_MODEL, "cap": "A <b>model</b> of light: straight lines from the source to the eye.", "say": "This is a model of light. We draw straight lines from the source to the eye, because that is how light travels. Nobody can see those lines; the drawing shows the idea."},
                 {"scene": {"id": "globe", "state": 0}, "cap": "A globe is a <b>model</b> of the Earth: the shape and the seas, not every house.", "say": "A globe is a model of the Earth. It shows the shape and where the seas are, and leaves out every house and tree."},
                 {"pic": "\U0001F697", "cap": "A toy car is a <b>model</b> of a real car.", "say": "A toy car is a model of a real car. Same shape, same wheels, but it does not have an engine."},
                 {"pic": "\U0001F4D0", "cap": "A model shows the important <b>idea</b> and leaves the rest out.", "say": "A model shows the important idea clearly and leaves the rest out. That is what makes it useful."},
             ]},
             "A model is a clear way of showing an object or an idea."),

        step("ask", "Ask a question about light", "❓", "Asked why", ["2TWSp.01"],
             "Look at the torch beam. Tap a question you would like to ask.",
             explain(
                 ["Light is full of questions, and some of them have puzzled people for thousands of years."],
                 ["Why can you see the beam in fog but not in clear air? How far does the light go? Why does a shadow follow you?",
                  "You can test most of these with a torch in a dark room."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F526",
              "questions": ["Why can I see the beam in the fog but not in clear air?", "How far does the torch light reach?", "Why does my shadow follow me?"],
              "findOut": {"ask": "You want to know how far the torch light reaches. How could you find out?",
                          "opts": [opt("Shine it in a dark place and walk away until you cannot see it", True), opt("Guess", False), opt("Ask the torch", False)],
                          "why": "Trying it and measuring is an experiment. That is how scientists find out."}},
             "Ask, then test it in the dark with a torch."),

        step("context", "What people thought about light", "\U0001F56F️", "Long ago", ["2SIC.01"],
             "People have not always understood light. Tap each picture.",
             explain(
                 ["What people know about light has changed over thousands of years."],
                 ["Long ago some people thought our eyes sent out beams to see with.", "Now we know light comes FROM sources INTO our eyes; in the dark room you saw that with no light you see nothing.",
                  "Long ago the only light after sunset was fire.", "Now we have lamps at the flick of a switch."],
                 [],
                 ["Tap each picture and compare then with now."]),
             {"items": [
                 {"pic": "\U0001F441️", "label": "eyes sending out beams", "say": "Long ago some people thought our eyes sent out beams, like torches, to see with. If that were true you could see in a dark room. You cannot. Light has to come from a source into your eyes."},
                 {"pic": "\U0001F525", "label": "fire for light", "say": "For most of history the only light after sunset was fire: torches, candles, oil lamps. Nights were dark."},
                 {"pic": "\U0001F4A1", "label": "the electric lamp", "say": "About a hundred and fifty years ago people worked out how to make light with electricity. Now a whole city lights up at night."},
                 {"pic": "\U0001F52D", "label": "now", "say": "Now scientists know that light travels in straight lines, very fast, and they can draw a model of it, the one you saw."},
             ], "need": 4,
              "then": {"ask": "Long ago some people thought eyes sent out light. What did the dark room show?",
                       "opts": [opt("With no light source you see nothing, so light must come INTO the eyes", True), opt("Eyes glow in the dark", False), opt("The cat was the light source", False)],
                       "why": "What people knew changed by testing. In total darkness nobody sees anything."}},
             "What people knew about light has changed, by testing."),

        step("questions", "Light or dark?", "✅", "Light check", ["2Ps.01", "2Ps.02"],
             "Tap the answer.",
             explain(
                 ["Sources make light. Darkness is no light."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which is a light source?", "\U0001F4A1", "a candle", ["a mirror", "the Moon", "a white wall"], "A candle makes its own light."),
                 q("Why is the Moon bright at night?", "\U0001F319", "it shines back the Sun's light", ["it makes its own light", "it is on fire"], "The Moon is not a source. It bounces sunlight."),
                 q("What is darkness?", "\U0001F311", "what is left when there is no light", ["a black gas", "a kind of light"], "Darkness is the absence of light."),
                 q("You are in a room with no windows and the lamp off. What can you see?", "\U0001F6AA", "nothing", ["everything, in grey", "only shiny things"], "No light source, nothing to see by."),
                 q("Which is the biggest light source we have?", "☀️", "the Sun", ["a torch", "a fire", "a lamp"], "The Sun lights the whole daytime side of the Earth."),
             ]},
             "Sources make light; with none, it is dark."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Ps.01", "2Ps.02", "2TWSm.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which of these makes its own light?", "❓", "the Sun", ["the Moon", "a mirror", "a diamond"], "The Sun is a light source; the others shine light back."),
                 q("Which of these is NOT a light source?", "❓", "a mirror", ["a torch", "a fire", "a lamp"], "A mirror only bounces light."),
                 q("What is darkness?", "\U0001F311", "the absence of light", ["a black fog", "cold air"], "Darkness is what is left when the light is gone."),
                 q("In the experiment, what made the room completely dark?", "\U0001F6AA", "shutting the curtains AND switching the lamp off", ["only shutting the curtains", "the cat"], "Every light source had to be gone."),
                 q("A drawing of straight lines from a lamp to an eye is a...", "\U0001F4D0", "model of how light travels", ["photo of light", "picture of a lamp"], "A model shows an idea clearly."),
                 q("A globe is a model of...", "\U0001F30D", "the Earth", ["the Sun", "a ball", "the Moon"], "A globe shows the Earth's shape and seas."),
                 q("Long ago some people thought eyes sent out light. Why is that wrong?", "\U0001F441️", "in total darkness you see nothing, so light must come into the eyes", ["because eyes are round", "because torches exist"], "Testing showed light comes from sources into our eyes."),
                 q("Why can you see a screen in a dark room?", "\U0001F4FA", "the screen makes its own light", ["the room is not really dark", "screens are mirrors"], "A switched-on screen is a light source."),
             ]},
             "That is the whole lesson finished. You know where light comes from."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Name things that make their own light.",
    "Tell a light source from something that only shines light back.",
    "Say what darkness is.",
    "Say what a model is and why scientists use them.",
]

LESSON["lecture"] = [
    part("\u2600\uFE0F", "Light sources",
         "The Sun, a lamp, a candle, a torch, a fire. Each one makes its own light. It is a light source. The Sun is the biggest light source we have."),
    part("\U0001F315", "Shining back",
         "The Moon is bright at night, but it makes no light of its own. It shines back the Sun's light. So does a mirror, and white paper. Put them in a dark cupboard and they are dark."),
    part("\U0001F311", "Darkness",
         "Close the curtains. Switch off the lamp. Now it is dark. Darkness is what is left when there is no light. You cannot see anything, because there is no light to see by."),
    part("\U0001F4D0", "A model of light",
         "Scientists draw light as straight lines from the source to your eye. That is a model: a clear way of showing an idea, leaving the rest out. A globe is a model of the Earth."),
    part("\U0001F4A1", "How ideas changed",
         "Long ago some people thought eyes sent out beams. Testing showed that light comes from a source, into the eye. What people know changes when they test it."),
]

LESSON["words"] = [
    word("light", "\u2600\uFE0F", "What lets you see. It comes from a light source.",
         ["Light comes from the Sun.", "Without light you cannot see."]),
    word("light source", "\U0001F526", "Something that makes its own light.",
         ["A torch is a light source.", "The Sun is the biggest light source."]),
    word("dark", "\U0001F311", "No light at all.",
         ["The cupboard is dark inside.", "At night, without lamps, it is dark."]),
    word("reflect", "\U0001FA9E", "To shine light back.",
         ["A mirror reflects light.", "The Moon reflects the Sun's light."]),
    word("shadow", "\U0001F464", "A dark shape made where something blocks the light.",
         ["My shadow is long in the evening.", "A shadow needs a light source."]),
    word("model", "\U0001F310", "A clear way of showing an object or an idea, leaving the rest out.",
         ["A globe is a model of Earth.", "We drew a model of light."]),
    word("torch", "\U0001F526", "A small lamp you carry, with a battery inside.",
         ["Shine the torch in the dark.", "A torch is a light source."]),
]

LESSON["home"] = [
    home("The dark cupboard test", "A torch, a mirror, a shiny spoon, white paper, a glow star, a cupboard you can shut",
         ["Put one thing in the cupboard and shut the door.",
          "Look through a crack: can you see it glowing?",
          "Now switch on the torch inside. What happens?"],
         "Only a light source glows in the dark. The rest need the torch."),
    home("Shadow shapes", "A torch, a wall, a dark room, your hands",
         ["Shine the torch at the wall.",
          "Put your hand between the torch and the wall.",
          "Move your hand nearer the torch, then nearer the wall."],
         "The shadow grows and shrinks. Where is the light coming from?"),
    home("Light source count", "Paper and a pencil, one evening",
         ["When it gets dark, walk round the house.",
          "Count everything that makes its own light.",
          "Then count things that only shine it back: mirrors, windows, shiny taps."],
         "Which list is longer?"),
]
