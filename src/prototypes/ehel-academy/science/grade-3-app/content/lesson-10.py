# -*- coding: utf-8 -*-
"""Lesson 10 - Light and Shadows.

0097 Stage 3: 3Ps.01 light passes through some materials and is blocked by
others (transparent, translucent, opaque); 3Ps.02 shadows form when light
from a source is blocked; 3Ps.03 the size of a shadow depends on where the
object and the light source are; with 3TWSp.03, 3TWSa.03, 3TWSc.01,
3TWSp.01 and 3SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "light-and-shadows",
    "title": "Light and Shadows",
    "blurb": "Shine a torch through eight materials and sort them into transparent, translucent and opaque, see how a shadow is made, move a toy towards the torch and watch its shadow grow, and find out what people used to think about light.",
    "steps": [
        step("predictEach", "Will the light get through?", "\U0001F526", "Light tester", ["3Ps.01", "3TWSp.03", "3TWSa.01"],
             "Shine the torch at the <b>%s</b>. Predict: will the light go through?",
             explain(
                 ["Light goes straight through some materials, gets partly through others, and is blocked by the rest."],
                 ["Glass: straight through. Transparent.", "Tracing paper: some gets through, blurred. Translucent.", "A book: none. Opaque."],
                 ["Children think thin means see-through.", "Thin does not always mean see-through: thin foil is opaque."],
                 ["Predict for each one, then shine the torch."]),
             {"sim": "lightThrough", "ask": "Shine the torch at the %s. Will the light get through?", "tryLabel": "Shine the torch",
              "choices": [{"id": "through", "t": "all through", "pic": "☀️"}, {"id": "some", "t": "some through", "pic": "\U0001F324️"}, {"id": "blocked", "t": "blocked", "pic": "\U0001F311"}],
              "items": [
                  {"pic": "\U0001FA9F", "label": "window glass", "answer": "through", "why": "Light goes straight through glass. Transparent."},
                  {"pic": "\U0001F4C4", "label": "tracing paper", "answer": "some", "why": "Some light gets through, but blurred. Translucent."},
                  {"pic": "\U0001F4D5", "label": "a book", "answer": "blocked", "why": "No light gets through a book. Opaque."},
                  {"pic": icon("bottle"), "label": "a clear plastic bottle", "answer": "through", "why": "Clear plastic lets light straight through. Transparent."},
                  {"pic": icon("window"), "label": "a frosted bathroom window", "answer": "some", "why": "Light gets through, but you cannot see shapes clearly. Translucent."},
                  {"pic": "\U0001F6AA", "label": "a wooden door", "answer": "blocked", "why": "Wood blocks light completely. Opaque."},
                  {"pic": icon("tissue"), "label": "a sheet of tissue paper", "answer": "some", "why": "Tissue paper lets some light through, blurred. Translucent."},
                  {"pic": "\U0001F9F1", "label": "a brick", "answer": "blocked", "why": "A brick blocks all the light. Opaque."},
              ]},
             "Transparent, translucent, opaque: all through, some through, none."),

        step("sort", "Transparent, translucent or opaque?", "\U0001F5C2️", "Light sorter", ["3Ps.01", "3TWSc.01"],
             "Which word describes this material? Tap the bin.",
             explain(
                 ["Three science words for how light gets through."],
                 ["Transparent: all the light, and you can see clearly through it.", "Translucent: some light, blurred, no clear shapes.", "Opaque: no light at all."],
                 ["Children call tissue paper transparent.", "Hold it up. You see light, but not shapes. Translucent."],
                 ["Can you see clearly through it, a bit, or not at all?"]),
             {"ask": "Transparent, translucent or opaque?",
              "bins": [{"id": "trans", "label": "Transparent", "pic": "\U0001F453"}, {"id": "lucent", "label": "Translucent", "pic": "\U0001F324️"}, {"id": "opaque", "label": "Opaque", "pic": "\U0001F311"}],
              "items": [
                  {"pic": "\U0001F4A7", "label": "clear water", "bin": "trans", "why": "You can see straight through clear water."},
                  {"pic": "\U0001F4C4", "label": "greaseproof paper", "bin": "lucent", "why": "Light gets through, blurred."},
                  {"pic": "\U0001F944", "label": "a metal spoon", "bin": "opaque", "why": "No light gets through metal."},
                  {"pic": "\U0001FA9F", "label": "a window", "bin": "trans", "why": "Window glass is transparent."},
                  {"pic": "\U0001F9F1", "label": "a brick wall", "bin": "opaque", "why": "A wall blocks all light."},
                  {"pic": icon("clingfilm"), "label": "cling film", "bin": "trans", "why": "Clear film lets light straight through."},
                  {"pic": icon("tissue"), "label": "a paper tissue", "bin": "lucent", "why": "Hold it to the light: glow, but no shapes."},
                  {"pic": "\U0001FAA8", "label": "a stone", "bin": "opaque", "why": "Stone blocks light completely."},
                  {"pic": "\U0001F3EE", "label": "a paper lampshade", "bin": "lucent", "why": "It glows when the lamp is on, but you cannot see the bulb clearly through it."},
              ]},
             "Transparent, translucent, opaque."),

        step("demo", "How a shadow is made", "\U0001F464", "Shadow maker", ["3Ps.02"],
             "Press <b>Next</b> to see where a shadow comes from.",
             explain(
                 ["A shadow is a dark shape made where something opaque blocks the light from a source."],
                 ["Torch on, wall bright.", "Put a hand in the way: the hand blocks the light, and a dark hand shape appears on the wall.", "Torch off: no light, no shadow."],
                 ["Children think a shadow is something the object gives out.", "A shadow is the absence of light. Nothing is given out; light is blocked."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F526", "cap": "A torch shines on a wall. The wall is bright.", "say": "A torch shines on a wall. Light from the torch reaches the wall, so the wall is bright."},
                 {"pic": "✋\U0001F3FE", "cap": "A hand goes in the way. It <b>blocks</b> some of the light.", "say": "Put your hand between the torch and the wall. Your hand is opaque. It blocks some of the light."},
                 {"pic": "\U0001F464", "cap": "Where the light is blocked, the wall stays dark: a <b>shadow</b>, the same shape as the hand.", "say": "Where the light is blocked, the wall stays dark. That dark shape is a shadow. It is the same shape as your hand, because your hand is what blocked the light."},
                 {"pic": "\U0001F311", "cap": "Torch off: no light, no shadow.", "say": "Switch the torch off. No light, so nothing to block, so no shadow. A shadow needs a light source and something opaque in the way."},
             ]},
             "A shadow is where an opaque object blocks the light from a source."),

        step("experiment", "Big shadow, small shadow", "\U0001F9F8", "Shadow size", ["3Ps.03", "3TWSp.03", "3TWSa.03"],
             "A torch, a toy and a wall. Predict what happens to the shadow when the toy moves nearer the torch.",
             explain(
                 ["The size of a shadow depends on where the object is between the light and the wall."],
                 ["Near the torch, the toy blocks a lot of the light: big shadow.", "Near the wall, it blocks only a little of what reaches the wall: small shadow."],
                 ["Children think the shadow is always the size of the object.", "Move the toy and watch. The toy does not change; the shadow does."],
                 ["Predict, move it both ways, say what happened, then conclude."]),
             {"sim": "shadowSize",
              "predict": {"ask": "When the toy moves <b>nearer the torch</b>, the shadow will...",
                          "opts": [opt("Get bigger", True), opt("Get smaller", False), opt("Stay the same size", False)]},
              "runAsk": "Move the toy nearer the torch, then nearer the wall. Watch the shadow.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("Nearer the torch, the shadow grew. Nearer the wall, it shrank", True), opt("The shadow stayed the same", False), opt("Nearer the torch, the shadow shrank", False)],
                           "why": "Near the torch the toy blocks more of the light, so the shadow on the wall is big. Near the wall it blocks less, so the shadow is small."},
              "conclude": {"ask": "What changes the size of a shadow?",
                           "opts": [opt("Where the object is between the light source and the wall", True), opt("The colour of the object", False), opt("Nothing; shadows are always the same size as the object", False)],
                           "why": "The object stayed the same. Its position changed, and that changed the shadow."}},
             "Nearer the light source, bigger shadow. Nearer the wall, smaller."),

        step("ask", "Ask a question about shadows", "❓", "Shadow questions", ["3TWSp.01", "3Ps.03"],
             "Pick a question about shadows you could test, then say how you would test it.",
             explain(
                 ["A good scientific question can be tested.", "Pick one, then plan the test."],
                 ["Does the shadow get bigger if the torch moves further away? You can test that.", "Does a translucent object make a fainter shadow? You can test that."],
                 ["Change only one thing in the test.", "Move the torch, or move the toy, not both."],
                 ["Pick a question, then pick how to find out."]),
             {"pic": "\U0001F526",
              "questions": ["Does the shadow get bigger if the torch moves further away?", "Does a translucent object make a fainter shadow than an opaque one?", "Does the shadow change shape if you turn the toy round?"],
              "findOut": {"ask": "You want to know if a translucent object makes a fainter shadow. How would you find out?",
                          "opts": [opt("Shine the same torch at a book, then at tracing paper, from the same place, and compare the shadows", True), opt("Guess", False), opt("Ask a friend", False)],
                          "why": "Same torch, same place, only the object changes. A fair test that answers the question."},
              "findOuts": [
                  {"ask": "You want to know if the shadow changes when the torch moves further away. How would you find out?",
                   "opts": [opt("Keep the toy and the wall still, move only the torch back, and look at the shadow each time", True), opt("Move the toy and the torch together", False), opt("Guess", False)],
                   "why": "Change only where the torch is. Keep the toy and the wall where they are. That is a fair test."},
                  {"ask": "You want to know if a translucent object makes a fainter shadow. How would you find out?",
                   "opts": [opt("Shine the same torch at a book, then at tracing paper, from the same place, and compare the shadows", True), opt("Guess", False), opt("Ask a friend", False)],
                   "why": "Same torch, same place, only the object changes. A fair test that answers the question."},
                  {"ask": "You want to know if the shadow changes shape when you turn the toy round. How would you find out?",
                   "opts": [opt("Keep the torch and the toy in the same place, turn only the toy, and draw round the shadow each time", True), opt("Move the torch nearer each time you turn the toy", False), opt("Ask a friend", False)],
                   "why": "Change one thing, the way the toy faces, and keep the rest the same. Drawing round the shadow lets you compare the shapes."},
              ]},
             "Ask, then test, changing only one thing."),

        step("context", "What people thought about light", "\U0001F4DC", "Light long ago", ["3SIC.01", "3Ps.02"],
             "Ideas about light have changed. Tap each one.",
             explain(
                 ["What people know changes when they test their ideas."],
                 ["Long ago, some people thought eyes sent out beams to see things.", "Testing showed light comes from a source into the eye.",
                  "People used shadows to tell the time with sundials.", "Shadow puppets are thousands of years old."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F441️", "label": "beams from the eyes", "say": "Long ago, some people thought our eyes sent out beams that touched things so we could see them. It seemed sensible. It was wrong."},
                 {"pic": "\U0001F526", "label": "light into the eye", "say": "Testing showed the truth: light comes from a source, bounces off things, and goes into your eye. In a dark room, your eyes cannot see, however hard they look."},
                 {"pic": "\U0001F55B", "label": "a sundial", "say": "Thousands of years ago people told the time with a sundial: a stick whose shadow swings round as the Sun seems to cross the sky."},
                 {"pic": "\U0001F3AD", "label": "shadow puppets", "say": "Shadow puppets are opaque shapes held between a lamp and a screen. People have told stories with them for over two thousand years."},
             ], "need": 4,
              "then": {"ask": "Why can you not see in a completely dark room?",
                       "opts": [opt("There is no light to go into your eyes", True), opt("Your eyes are switched off", False), opt("Your eye beams are too weak", False)],
                       "why": "Seeing needs light from a source. Eyes do not send out beams."}},
             "What people knew about light changed when they tested it."),

        step("questions", "Light check", "✅", "Light check", ["3Ps.01", "3Ps.02", "3Ps.03"],
             "Tap the answer.",
             explain(
                 ["Three words for materials, how a shadow forms, and what changes its size."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Light goes straight through it and you see clearly. The material is...", "\U0001FA9F", "transparent", ["translucent", "opaque"], "All the light, clear view."),
                 q("Some light gets through, but blurred. The material is...", "\U0001F324️", "translucent", ["transparent", "opaque"], "Some light, no clear shapes."),
                 q("No light gets through. The material is...", "\U0001F311", "opaque", ["transparent", "translucent"], "Blocked completely."),
                 q("What is a shadow?", "\U0001F464", "a dark shape where an object blocks the light", ["light the object gives out", "a reflection"], "Blocked light."),
                 q("To make a shadow bigger, move the object...", "\U0001F9F8", "nearer the light source", ["nearer the wall", "nowhere; it cannot change"], "Nearer the torch, bigger shadow."),
             ]},
             "You know light and shadows."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Ps.01", "3Ps.02", "3Ps.03", "3SIC.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which material is transparent?", "\U0001FA9F", "window glass", ["a brick", "tracing paper", "a wooden door"], "All the light gets through."),
                 q("Which material is opaque?", "\U0001F311", "a metal spoon", ["clear water", "cling film"], "No light through metal."),
                 q("A frosted bathroom window is...", icon("window"), "translucent", ["transparent", "opaque"], "Light, but no clear shapes."),
                 q("What two things do you need to make a shadow?", "\U0001F526", "a light source and something opaque to block it", ["two torches", "a mirror and water"], "Light, and something in its way."),
                 q("Torch off. What happens to the shadow?", "\U0001F311", "it disappears; no light, no shadow", ["it gets bigger", "it stays"], "A shadow is blocked light."),
                 q("The toy moves nearer the wall. The shadow...", "\U0001F9F8", "gets smaller", ["gets bigger", "stays the same"], "Less light blocked at the wall."),
                 q("What did some people long ago think about seeing?", "\U0001F441️", "that eyes sent out beams", ["that light comes from a source", "that shadows were alive"], "Testing showed it was wrong."),
                 q("Why is a shadow the same shape as the object?", "\U0001F464", "the object blocks the light in its own shape", ["the light copies it", "it is a reflection"], "Blocked in its own outline."),
                 q("Why does a clear window make almost no shadow?", "\U0001FA9F", "light goes straight through it, so almost nothing is blocked", ["windows are too cold", "windows are too big"], "A shadow needs something that blocks the light. Transparent glass lets it through."),
                 q("What will happen to the shadow if you move the torch further away from the toy?", "\U0001F526", "the shadow gets smaller", ["the shadow gets bigger", "the shadow disappears"], "It is like moving the toy nearer the wall: the shadow shrinks."),
                 q("Why do blackout curtains keep a bedroom dark on a summer morning?", "\U0001F6CF\uFE0F", "they are opaque, so no light gets through", ["they are transparent, so light goes straight through", "they are translucent, so the light is only blurred"], "Opaque materials block all the light."),
             ]},
             "That is the whole lesson finished. You know how light and shadows work."),
    ],
}

LESSON["about"] = [
    "Sort materials into transparent, translucent and opaque.",
    "Say how a shadow is made.",
    "Predict and test what happens to a shadow when the object moves.",
    "Say how ideas about light have changed.",
]

LESSON["warmup"] = [
    q("Which way does gravity pull things?", "⚽", "towards the centre of the Earth", ["up into the sky", "sideways"], "Gravity pulls everything towards the centre of the Earth."),
    q("Which of these gives out its own light?", "\U0001F526", "a torch", ["a mirror", "a book"], "A torch makes its own light. A mirror only bounces light back."),
]

LESSON["lecture"] = [
    part("\U0001FA9F", "Three kinds of material",
         "Shine a torch at glass and the light goes straight through: transparent. Shine it at tracing paper and some gets through, blurred: translucent. Shine it at a book and none gets through: opaque."),
    part("\U0001F464", "A shadow",
         "Put your hand between a torch and a wall. Your hand is opaque, so it blocks the light. Where the light is blocked, the wall stays dark. That dark shape is a shadow, and it is the shape of your hand."),
    part("\U0001F9F8", "Big and small shadows",
         "Move a toy towards the torch and its shadow grows. Move it towards the wall and its shadow shrinks. The toy has not changed. Where it is has changed, and that changes how much light it blocks."),
    part("\U0001F526", "Light into the eye",
         "You see because light from a source bounces off things and goes into your eye. In a completely dark room you see nothing, however hard you look. There is no light to see by."),
    part("\U0001F4DC", "What people used to think",
         "Long ago, some people thought eyes sent out beams to see with. It seemed sensible. But testing showed light comes from a source into the eye. Science changes when people test their ideas."),
]

LESSON["words"] = [
    word("transparent", "\U0001FA9F", "Lets all the light through, so you can see clearly through it.",
         ["Glass is transparent.", "Clear water is transparent."]),
    word("translucent", "\U0001F324️", "Lets some light through, blurred, so you cannot see shapes clearly.",
         ["Tracing paper is translucent.", "A frosted window is translucent."]),
    word("opaque", "\U0001F311", "Lets no light through at all.",
         ["A brick is opaque.", "Your hand is opaque, so it makes a shadow."]),
    word("shadow", "\U0001F464", "A dark shape made where an object blocks the light from a source.",
         ["My shadow is on the wall.", "A shadow is the shape of what blocks the light."]),
    word("light source", "\U0001F526", "Something that makes its own light, like a torch or the Sun.",
         ["The torch is the light source.", "Without a light source there is no shadow."]),
    word("block", "\U0001F6D1", "To stop light getting through.",
         ["The book blocks the light.", "An opaque object blocks light completely."]),
    word("sundial", "\U0001F55B", "A clock that tells the time from the shadow of a stick in the Sun.",
         ["People used a sundial long ago.", "The sundial's shadow moves as the Sun seems to move."]),
]

LESSON["home"] = [
    home("Torch test", "A torch, a dark room, a tray of things: a clear plastic cup, greaseproof paper, a book, a cloudy white plastic bag, a spoon, a piece of kitchen foil",
         ["Shine the torch through each thing at the wall.",
          "Say: all through, some through, or none.",
          "Sort them into three piles."],
         "Transparent, translucent, opaque. Which pile is biggest? Is thin foil opaque?"),
    home("Shadow puppets", "A torch, a wall, your hands, a dark room",
         ["Make a rabbit or a dog with your hands between the torch and the wall.",
          "Move your hands nearer the torch. Then nearer the wall.",
          "Try a translucent thing, like a tissue, and see what shadow it makes."],
         "Nearer the torch, bigger. A translucent thing makes a faint grey shadow."),
    home("Make a sundial", "A stick or a pencil, a pot of soil or play dough, a sunny windowsill or garden, small stones",
         ["Stand the stick up in the pot in the sun. Never look straight at the Sun.",
          "Every hour, put a stone at the tip of the shadow.",
          "Look at the curve of stones at the end of the day."],
         "The shadow swings round as the Sun seems to move across the sky. That is how people told the time long ago."),
]
