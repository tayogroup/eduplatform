# -*- coding: utf-8 -*-
"""Lesson 9 - Light and Seeing.

0097 Stage 4: 4Ps.01 light travels in straight lines, shown with ray
diagrams; 4Ps.02 light reflects off surfaces; 4Ps.03 how we see things that
are not light sources; 4TWSm.03 draw a ray diagram (the first demo); with 4TWSp.03, 4TWSa.01,
4TWSa.03, 4TWSc.01 and 4SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home, cando

RAY = [
    {"id": "source", "label": "light source", "say": "The light source: the torch. Every ray starts here."},
    {"id": "ray", "label": "ray", "say": "A ray: a straight line with an arrow, showing which way the light travels."},
    {"id": "mirror", "label": "mirror", "say": "The mirror. The ray reflects off it, bouncing away in a new straight line."},
    {"id": "eye", "label": "eye", "say": "The eye. You see something when light from it reaches your eye."},
]

LESSON = {
    "slug": "light-and-seeing",
    "title": "Light and Seeing",
    "blurb": "Bounce a torch beam off a mirror into an eye, find out how you see things that make no light of their own, draw and label a ray diagram, and see how the old idea of seeing was overturned.",
    "steps": [
        step("demo", "Light goes in straight lines", "\U0001F4CF", "Straight lines", ["4Ps.01", "4TWSm.03"],
             "Press <b>Next</b> to see how light travels, and how to draw it as a diagram.",
             explain(
                 ["Light travels in straight lines. It cannot bend round a corner.", "Scientists draw light as rays: straight lines with arrows. That drawing is a ray diagram, and you can draw one of any real scene: a lamp, a book and your eye."],
                 ["A torch beam through dusty air is dead straight.", "Sunlight through a gap in the clouds: straight lines.", "You cannot see round a corner because light will not turn.", "To draw it: the source first, then a ruler line to what the light hits, then a ruler line from there to the eye. An arrow on every line, pointing the way the light goes."],
                 ["Children draw light as wiggles, or point the arrows the wrong way.", "Wiggles are for sound. Light is a straight line, and every arrow points away from the source."],
                 ["Press Next through all six."]),
             {"frames": [
                 {"pic": "\U0001F526", "cap": "A torch beam in dusty air: a <b>straight</b> line.", "say": "Shine a torch through dusty air and you can see the beam. It is dead straight. Light travels in straight lines."},
                 {"pic": "⛅", "cap": "Sunlight through a gap in the clouds: straight lines.", "say": "Sunlight coming through a gap in the clouds makes straight lines down to the ground. Same rule."},
                 {"pic": "\U0001F6AA", "cap": "You cannot see round a corner, because light will not <b>bend</b> round it.", "say": "You cannot see round a corner. Light from the thing round the corner travels straight, and straight does not reach your eye."},
                 {"pic": "➡️", "cap": "A <b>ray diagram</b>: straight lines with arrows, showing the way the light goes.", "say": "Scientists draw light as rays: straight lines with an arrow pointing the way the light travels. A drawing made of rays is a ray diagram."},
                 {"pic": "✏️", "cap": "Now draw one on paper, of a lamp and a book: draw the lamp, the book and the eye. With a <b>ruler</b>, draw a straight line from the lamp to the book.", "say": "Take paper and a pencil and draw a ray diagram now, of you reading a book by a lamp. Draw the lamp, the book and an eye. Then take a ruler and draw a straight line from the lamp to the book. Light never wobbles, so neither does the line."},
                 {"pic": "\U0001F4DD", "cap": "Draw a second straight line from the book to the eye. Put an <b>arrow</b> on each line, pointing away from the lamp.", "say": "Now draw a second straight line, from the book to the eye. Last, put an arrow on each line, pointing the way the light travels: away from the lamp, and into the eye. That is your ray diagram of how you see the book."},
             ]},
             "Light travels in straight lines. A ray diagram draws them: ruler lines, arrows pointing away from the source."),

        step("experiment", "Bounce it into an eye", "\U0001FA9E", "Mirror bounce", ["4Ps.02", "4Ps.03", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "A torch, a mirror and an eye. Predict what happens when the ray hits the mirror.",
             explain(
                 ["Light reflects off surfaces: it bounces. A mirror bounces it neatly, in a new straight line.", "You see the torch in the mirror when the bounced ray reaches your eye."],
                 ["Turn the mirror until the reflected ray reaches the eye.", "Then put a book in the way and watch what the eye gets."],
                 ["Children think the eye reaches out to the mirror.", "Light travels into the eye. The eye does nothing but receive it."],
                 ["Predict, turn the mirror, block the ray, then conclude."]),
             {"sim": "rayMirror",
              "predict": {"ask": "When the ray hits the mirror, it will...",
                          "opts": [opt("bounce off in a new straight line", True), opt("stop dead", False), opt("bend round in a curve", False)]},
              "plan": {"ask": "How shall we find out where the reflected ray goes? Which way is fair?",
                        "opts": [opt("Keep the mirror still and shine the ray in at the same angle each time", True), opt("Move the mirror and the torch together", False), opt("Shine it in the dark and remember where it went", False)],
                        "why": "One thing at a time, and mark where the ray lands rather than trusting your memory."},
              "runAsk": "Turn the mirror until the ray reaches the eye. Then put the book in the way.",
              "happened": {"ask": "What happened to the <b>ray</b>?",
                           "opts": [opt("The ray bounced off the mirror in a straight line and, at the right angle, reached the eye; the book blocked it", True), opt("The ray stopped dead when it hit the mirror", False), opt("The ray curved round the book and still reached the eye", False)],
                           "why": "Light reflects off a mirror in a straight line. When that line reaches the eye, you see the torch in the mirror. Block the line and you cannot see the torch in the mirror, though you can still see the book, by the light it reflects."},
              "conclude": {"ask": "How do you see the torch in the mirror?",
                           "opts": [opt("Light from the torch reflects off the mirror and travels into your eye", True), opt("Your eye sends a beam to the mirror", False), opt("The mirror makes its own light", False)],
                           "why": "Seeing is light arriving at the eye. The mirror only bounces it."}},
             "Light reflects off a mirror. You see when the reflected light reaches your eye."),

        step("explore", "Seeing things that make no light", "\U0001F441️", "How we see", ["4Ps.03", "4Ps.02"],
             "A book makes no light, and you can see it. Tap each step to find out how.",
             explain(
                 ["Only light sources make light. Everything else you see by reflected light.", "Light from a source bounces off the thing, and some of it travels into your eye."],
                 ["The lamp lights the book.", "The book reflects some of that light in every direction.", "Some reaches your eye. You see the book.", "Switch the lamp off and there is nothing to reflect. Darkness."],
                 ["Children think eyes glow or send out beams.", "In total darkness you see nothing, however hard you look. The light must come to the eye."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "a source lights it", "say": "First, a light source, like a lamp or the Sun, shines on the book."},
                 {"pic": "\U0001F4D5", "label": "the book reflects light", "say": "The book is not a source. But it reflects some of the lamp's light off its surface, in every direction. Not as neatly as a mirror, but it reflects."},
                 {"pic": "\U0001F441️", "label": "light enters your eye", "say": "Some of that reflected light travels in a straight line into your eye. That is the moment you see the book."},
                 {"pic": "\U0001F311", "label": "no source, no seeing", "say": "Switch the lamp off. No light reaches the book, so none reflects, so none reaches your eye. You cannot see it, however wide you open your eyes."},
             ], "need": 4,
              "then": {"ask": "Why can you see the Moon, which makes no light of its own?",
                       "opts": [opt("It reflects the Sun's light into your eye", True), opt("Your eyes light it up", False), opt("It makes its own light", False)],
                       "why": "Sunlight reflects off the Moon and travels to your eye."}},
             "You see things by the light they reflect into your eye."),

        step("diagram", "Label a ray diagram", "✏️", "Ray diagram", ["4Ps.01", "4Ps.02"],
             "Label the ray diagram. Tap a label, then tap the part it belongs to.",
             explain(
                 ["A ray diagram has a source, rays with arrows, and whatever the rays hit: a mirror, an eye."],
                 ["Light source, ray, mirror, eye. Four labels."],
                 ["Children point the arrow at the source.", "The arrow points away from the source, the way the light travels."],
                 ["Tap a label, then the part."]),
             {"figure": "ray", "ask": "Tap a label, then tap where it goes.", "parts": RAY},
             "Source, ray, mirror, eye. A ray diagram."),

        step("sort", "Reflects, or makes its own light?", "\U0001F5C2️", "Source sort", ["4Ps.03", "4TWSc.01"],
             "Is this a <b>light source</b>, or something you see only by <b>reflected</b> light? Tap the bin.",
             explain(
                 ["A source makes light. Everything else is seen by reflection."],
                 ["The Sun, a lamp, a candle, a campfire: sources.", "The Moon, a mirror, a book, a sheet of white paper: reflectors."],
                 ["Children think a mirror is a source because it is bright.", "Take a mirror into a totally dark room. You cannot see it at all. It only reflects."],
                 ["Would it glow in a totally dark room? Then tap."]),
             {"ask": "Light source, or seen by reflected light?",
              "bins": [{"id": "source", "label": "Light source", "pic": "\U0001F506"}, {"id": "reflect", "label": "Seen by reflected light", "pic": "↩️"}],
              "items": [
                  {"pic": "☀️", "label": "the Sun", "bin": "source", "why": "The biggest light source of all."},
                  {"pic": "\U0001F315", "label": "the Moon", "bin": "reflect", "why": "It reflects sunlight. With no sunlight on it, it would be dark."},
                  {"pic": "\U0001FA9E", "label": "a mirror", "bin": "reflect", "why": "It reflects beautifully, but makes nothing."},
                  {"pic": "\U0001F56F️", "label": "a candle", "bin": "source", "why": "A flame makes its own light."},
                  {"pic": "\U0001F4D5", "label": "a red book", "bin": "reflect", "why": "It reflects red light from the lamp."},
                  {"pic": "\U0001F4A1", "label": "a lamp", "bin": "source", "why": "Electricity makes light in the bulb."},
                  {"pic": "\U0001F525", "label": "a campfire", "bin": "source", "why": "Burning wood gives out its own light."},
                  {"pic": "\U0001F4C4", "label": "a sheet of white paper", "bin": "reflect", "why": "White reflects most of the light that hits it, but makes none of its own."},
              ]},
             "Sources make light. Everything else you see by reflection."),

        step("context", "How the idea of seeing changed", "\U0001F4DC", "Seeing long ago", ["4SIC.01", "4Ps.03"],
             "For a thousand years, people were sure the eye sent out beams. Evidence changed that. Tap each one.",
             explain(
                 ["Scientific knowledge changes when new evidence comes from enquiry."],
                 ["The old idea: eyes send out rays that touch things.", "The problem: then why can we not see in the dark?", "About a thousand years ago a scientist called Ibn al-Haytham tested it with dark rooms and pinholes, and showed light comes into the eye.", "Evidence beat the old idea."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F441️", "label": "the old idea", "say": "For a thousand years, many clever people believed the eye sent out beams that touched what you looked at. It sounded right."},
                 {"pic": "\U0001F311", "label": "the problem", "say": "But if eyes sent out beams, why could nobody see in a dark room? Why did your eyes hurt looking at the Sun? The old idea could not explain it."},
                 {"pic": "\U0001F52C", "label": "the enquiry", "say": "About a thousand years ago, a scientist called Ibn al-Haytham built dark rooms with tiny holes and showed that light from outside came in through the hole and made a picture. Light travels into the eye, not out of it."},
                 {"pic": "\U0001F4DA", "label": "knowledge changed", "say": "His evidence changed what everyone knew. That is how science works: an idea lasts until enquiry finds evidence against it."},
             ], "need": 4,
              "then": {"ask": "What changed the old idea about seeing?",
                       "opts": [opt("Evidence from enquiry: dark rooms and pinholes", True), opt("A vote", False), opt("Nothing; people still believe it", False)],
                       "why": "Scientific knowledge changes through evidence gained by enquiry."}},
             "Evidence from enquiry changes what we know."),

        step("questions", "Light check", "✅", "Light check", ["4Ps.01", "4Ps.02", "4Ps.03"],
             "Tap the answer.",
             explain(
                 ["Straight lines, reflection, and seeing."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("How does light travel?", "\U0001F4CF", "in straight lines", ["in curves", "in wiggles", "in circles"], "Always straight."),
                 q("What does a mirror do to light?", "\U0001FA9E", "reflects it: bounces it off in a new straight line", ["makes brand new light of its own", "swallows all of the light"], "Reflection."),
                 q("How do you see a book?", "\U0001F4D5", "light reflects off it into your eye", ["your eye sends a beam to it", "the book glows"], "Reflected light arriving at the eye."),
                 q("What does the arrow on a ray show?", "➡️", "which way the light travels", ["how bright it is", "the colour"], "Direction, away from the source."),
                 q("Why can you see nothing in a totally dark room?", "\U0001F311", "no light reaches your eye", ["your eyes are closed", "the room is too big"], "No light in, no seeing."),
                 q("Can you see your face in still, clear water?", "\U0001F4A7", "Yes - light reflects off far more things than mirrors", ["No, only a mirror reflects light", "No, because water is see-through"],
                   "A window, a polished spoon and still water all reflect light. A mirror is simply the best at it."),
             ],
              "support": [
                 q("Is the Sun a light source?", "\u2600\uFE0F", "Yes", ["No"],
                   "The Sun makes its own light, so it is a light source."),
                 q("Can light bend round a corner by itself?", "\U0001F4D0", "No", ["Yes"],
                   "Light travels in straight lines, which is why you cannot see round a corner."),
                 q("Does a shadow form because something blocks the light?", "\U0001F464", "Yes", ["No"],
                   "Light travels straight, so whatever is in the way leaves a dark patch behind it."),
                 q("Does a mirror make its own light?", "\U0001FA9E", "No", ["Yes"],
                   "It only sends on light that arrived from somewhere else."),
              ],
              "extension": [
                 q("You hold a mirror to see round a corner, and light still travels only in straight lines. How does that work?", "\U0001FA9E", "a straight line to the mirror, then a new straight line to your eye", ["the mirror bends the light round the corner", "the mirror makes light of its own"],
                   "A reflection is two straight lines with a turn at the mirror. Light never curves."),
                 q("A torch looks bright close up and dim from across the playground. Is it making less light?", "\U0001F56F\uFE0F", "no - the same light is spread over a far bigger area by the time it reaches you", ["yes, a torch makes less light further away", "the air uses the light up on the way"],
                   "The torch has not changed at all. What has changed is how much of its light lands in your eye."),
                 q("You see a book. Draw the journey the light took, in order.", "\U0001F4D6", "from a source, to the book, then into your eye", ["from your eye, to the book, and back", "from the book on its own, into your eye"],
                   "Three stages, always in that order. The book is a stop on the way, never the start."),
                 q("Still water shows your face and a rough puddle does not. What does the surface decide?", "\U0001F4A7", "whether the light stays in order after it bounces", ["how much light bounces off", "what colour the light becomes"],
                   "A smooth surface keeps the rays in their pattern, and a rough one scatters them."),
              ]},
             "You know how light travels and how you see.",
             mis=["5.3-m1", "5.1-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Ps.01", "4Ps.02", "4Ps.03", "4TWSm.03", "4SIC.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Why can you not see round a corner?", "\U0001F6AA", "light travels in straight lines", ["it is always too dark round corners", "light moves too slowly to get there"], "Straight only. It will not bend round."),
                 q("What is a ray diagram?", "✏️", "a drawing of light as straight lines with arrows", ["a photograph of a beam of light", "a map of the room with the lamps on it"], "Rays, arrows, source."),
                 q("You see the torch in the mirror because...", "\U0001FA9E", "its light reflects off the mirror into your eye", ["the mirror makes its own light", "your eye shines a light on the mirror"], "Reflected into the eye."),
                 q("Which is a light source?", "\U0001F50D", "a candle", ["the Moon", "a mirror", "a sheet of white paper"], "It makes its own light."),
                 q("Which do you see only by reflected light?", "\U0001F441️", "the Moon", ["the Sun", "a lamp", "a firefly"], "Sunlight bouncing off it."),
                 q("A book blocks the ray. What does the eye see?", "\U0001F4D5", "not the torch: its light never arrives", ["the torch, but more faintly", "the book glowing with its own light"], "Blocked light does not reach the eye."),
                 q("Who showed that light comes into the eye?", "\U0001F52C", "Ibn al-Haytham, with dark rooms and pinholes", ["nobody has ever shown it", "a king who ordered it to be true"], "Evidence from enquiry."),
                 q("Why did people stop believing that eyes send out beams?", "\U0001F4DA", "new evidence from enquiry showed light comes into the eye", ["people just got bored of the old idea", "the loudest people said so"], "Evidence changed what people knew."),
                 q("A mirror looks bright in a sunny room. How could you test whether it is a light source?", "\U0001F914", "look for it in a totally dark room", ["shine a torch on it", "look at it in the sunshine"], "A source would glow in the dark. A mirror only reflects, so in the dark you cannot see it."),
                 q("White paper and black paper lie side by side in a dim room. Which is easier to see, and why?", "\U0001F4C4", "the white paper, because it reflects more light into your eye", ["the black paper, because it makes its own light", "both the same, because neither is a light source"], "Neither makes light. White reflects more of it, so more reaches your eye."),
                 q("You shine a torch at a mirror. What happens to the beam if you tilt the mirror?", "\U0001F526", "it bounces off in a new direction, still in a straight line", ["it bends round in a curve", "it stops being light"], "A mirror reflects light. Tilt it and the straight beam goes a new way."),
             ],
              "support": [
                 q("Does light travel in straight lines?", "\U0001F526", "Yes", ["No, it bends round corners"],
                   "Always straight. That is why there are shadows."),
                 q("Can you see in a room with no light at all?", "\U0001F311", "No", ["Yes, after a while"],
                   "Seeing needs light reaching your eye."),
                 q("Does light bounce off a mirror?", "\U0001FA9E", "Yes", ["No"],
                   "It bounces off in a new straight line. That is reflection."),
                 q("Does a lamp make light of its own?", "\U0001F4A1", "Yes", ["No"],
                   "A lamp is a source. A mirror and a book are not."),
              ],
              "extension": [
                 q("You can see a torch beam in a dusty room, but not in clean air. Why?", "\U0001F4A8", "the light bounces off the dust into your eye", ["dust makes the light brighter", "clean air blocks the light"],
                   "You only ever see light that enters your eye. In clean air the beam goes straight past you; dust scatters some of it sideways, to you."),
                 q("A mirror gives a clear picture and a white wall does not, though both reflect. Why?", "\U0001FA9E", "the mirror is smooth, so the light stays in order", ["the wall reflects no light at all", "the mirror makes its own light"],
                   "A rough surface scatters the light in all directions, so the picture is broken up. A smooth one keeps the rays in the same arrangement."),
                 q("Ibn al-Haytham used a dark room and a pinhole. What did that let him show?", "\U0001F52D", "that light comes INTO the eye, because with none coming in you see nothing", ["that eyes send out beams after all", "that pinholes make their own light"],
                   "A dark room is the test: if eyes sent out beams you would see in it, and you do not."),
                 q("White paper looks brighter than black paper in the same dim room. What is the paper doing differently?", "\U0001F4C4", "the white reflects far more of the light that lands on it", ["the white makes a little light of its own", "the black absorbs your eyesight"],
                   "Neither makes light. They differ in how much of it they send back to you."),
              ]},
             "That is the whole lesson finished. You know how you see.",
             mis=["5.2-m1"]),
    ],
}

LESSON["about"] = [
    "Say that light travels in straight lines and draw it as rays.",
    "Say what happens when light hits a mirror.",
    "Explain how you see things that make no light of their own.",
    "Draw and label a ray diagram, and say how evidence changed the old idea of seeing.",
]

LESSON["warmup"] = [
    q("Energy cannot be made or destroyed. What can happen to it?", "\U0001F504", "it can be transferred", ["it can vanish", "it can be used up for ever"], "From the last lesson: energy is only ever transferred."),
    q("What makes a shadow?", "\U0001F464", "something blocking the light", ["a mirror making light", "the wind"], "An object in the way of the light makes a shadow behind it."),
    q("In which state are the particles furthest apart?", "\U0001F4A8", "a gas", ["a solid", "a liquid"],
      "Big gaps in a gas, almost none in a solid."),
    q("Who should give a child medicine?", "\U0001F48A", "a grown-up, measuring it from the label", ["the child, on their own", "a friend"],
      "The label says how much, and a grown-up reads it."),
]

LESSON["lecture"] = [
    part("\U0001F4CF", "Straight lines",
         "Light travels in straight lines. A torch beam through dust is dead straight. Sunlight through the clouds comes down in straight lines. You cannot see round a corner because light will not bend. Scientists draw light as rays: straight lines with arrows."),
    part("\U0001FA9E", "Reflection",
         "When light hits a surface, some of it bounces off. That is reflection. A mirror reflects neatly, in one new straight line. A book reflects roughly, in every direction. Pale and shiny surfaces reflect most of the light. Dark ones soak most of it up, which is why they look dark."),
    part("\U0001F441️", "Seeing",
         "Only a source makes light. You see everything else by reflected light. The lamp shines on the book, the book reflects some of it, and a little travels straight into your eye. Switch the lamp off and there is nothing to reflect, so you see nothing."),
    part("\U0001F4DC", "The old idea",
         "For a thousand years people believed the eye sent out beams to touch things. Then a scientist called Ibn al-Haytham built dark rooms with tiny holes and showed light comes into the eye, not out of it. His evidence changed what everyone knew."),
    part("✏️", "Today",
         "Today you bounce a torch beam off a mirror into an eye, work out how a book is seen, sort sources from reflectors, and learn to draw and label a ray diagram."),
]

# The unit lecture film (tools/create-ehel-unit-lecture.js; storyboard and
# pictures in lecture-video/light-and-seeing.json). The lecture step draws it
# above the parts; build-lessons.py refuses a path that is not on disk AND in
# app.config.json :: extraPages, and a --draft render.
LESSON["video"] = {
    "src": "lecture-video/light-and-seeing.aab15887.mp4",
    "captions": "lecture-video/light-and-seeing.8afea494.vtt",
    "poster": "lecture-video/light-and-seeing.3b78a2c5.jpg",
    "note": "About three minutes. Watch it through, then go back over it a part at a time below.",
}

LESSON["words"] = [
    word("ray", "➡️", "A straight line with an arrow, drawn to show which way light travels.",
         ["Draw the ray from the torch to the mirror.", "The arrow on a ray points away from the source."]),
    word("ray diagram", "✏️", "A drawing of light as rays.",
         ["The ray diagram shows the light bouncing.", "Label your ray diagram."]),
    word("reflect", "\U0001FA9E", "To bounce off a surface.",
         ["A mirror reflects light.", "The Moon reflects the Sun's light."]),
    word("reflection", "\U0001F315", "Light bouncing off a surface.",
         ["You see the Moon by reflection.", "Reflection sends the ray to the eye."]),
    word("light source", "\U0001F4A1", "Something that makes its own light.",
         ["A candle is a light source.", "The Sun is our biggest light source."]),
    word("surface", "\U0001F9F1", "The outside of a thing, where light hits it.",
         ["A pale surface reflects most of the light that hits it.", "A shiny surface reflects neatly."]),
    word("evidence", "\U0001F52C", "Facts from enquiry that show whether an idea is right.",
         ["Evidence changed the idea of seeing.", "Scientists look for evidence."]),
    word("straight line", "\U0001F4D0", "The only path light travels along. It never bends round a corner.",
         ["Light travels in straight lines.", "A ray diagram draws light as straight lines."]),
    word("shadow", "\U0001F464", "The dark shape where something blocks the light.",
         ["A shadow falls behind the object.", "No light, no shadow."]),
]

LESSON["cando"] = [
    cando("I know that light travels in straight lines, and I can draw that as a ray diagram.", "4Ps.01"),
    cando("I know that light reflects off surfaces, not only off mirrors.", "4Ps.02"),
    cando("I can explain how I see something that makes no light of its own.", "4Ps.03"),
    cando("I can sort things into light sources and things that only reflect.", "4TWSc.01"),
    cando("I can draw a diagram of something real.", "4TWSm.03"),
    cando("I can say how people's ideas about light have changed.", "4SIC.01"),
    cando("I can make a prediction and see whether I was right.", "4TWSa.01"),
]

LESSON["home"] = [
    home("Torch and mirror", "A torch, a small mirror, a dark room, a friend",
         ["Shine the torch at the mirror and find the bright spot on the wall.",
          "Turn the mirror slowly until the spot reaches your friend's tummy. Never their eyes.",
          "Put a book in the way and watch the spot vanish."],
         "Straight in, straight out. Block the line and the light is gone."),
    home("Dark room test", "A room you can make very dark, a grown-up, a torch, a mirror, a book, a glow-in-the-dark star or sticker if you have one",
         ["Hold the glow star under a bright lamp for a minute first, so it soaks up light to give out later.",
          "Put the mirror, the book and the glow star on a table. Switch off the lights and close the curtains. Wait a minute. What can you see?",
          "Now shine the torch on the mirror, then on the book."],
         "In the dark, only the glow star shows: it gives out the light it soaked up. The mirror and the book appear only when the torch lights them, because they only reflect."),
    home("Draw a ray diagram", "Paper, a pencil, a ruler",
         ["Draw a lamp, a book and an eye.",
          "Draw a straight ray from the lamp to the book, with an arrow.",
          "Draw a straight ray from the book to the eye, with an arrow."],
         "Two rays, two arrows, both pointing away from where the light came from. That is how you see the book."),
]
