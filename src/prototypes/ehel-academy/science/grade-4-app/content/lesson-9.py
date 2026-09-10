# -*- coding: utf-8 -*-
"""Lesson 9 - Light and Seeing.

0097 Stage 4: 4Ps.01 light travels in straight lines, shown with ray
diagrams; 4Ps.02 light reflects off surfaces; 4Ps.03 how we see things that
are not light sources; 4TWSm.03 draw a diagram; with 4TWSp.03, 4TWSa.01,
4TWSa.03, 4TWSc.01 and 4SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home

RAY = [
    {"id": "source", "label": "light source", "say": "The light source: the torch. Every ray starts here."},
    {"id": "ray", "label": "ray", "say": "A ray: a straight line with an arrow, showing which way the light travels."},
    {"id": "mirror", "label": "mirror", "say": "The mirror. The ray reflects off it, bouncing away in a new straight line."},
    {"id": "eye", "label": "eye", "say": "The eye. You see something when light from it reaches your eye."},
]

LESSON = {
    "slug": "light-and-seeing",
    "title": "Light and Seeing",
    "blurb": "Bounce a torch beam off a mirror into an eye, find out how you see things that make no light of their own, label a ray diagram, and see how the old idea of seeing was overturned.",
    "steps": [
        step("demo", "Light goes in straight lines", "\U0001F4CF", "Straight lines", ["4Ps.01"],
             "Press <b>Next</b> to see how light travels, and how scientists draw it.",
             explain(
                 ["Light travels in straight lines. It cannot bend round a corner.", "Scientists draw light as rays: straight lines with arrows. That drawing is a ray diagram."],
                 ["A torch beam through dusty air is dead straight.", "Sunlight through a gap in the clouds: straight lines.", "You cannot see round a corner because light will not turn."],
                 ["Children draw light as wiggles.", "Wiggles are for sound. Light is a straight line with an arrow."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F526", "cap": "A torch beam in dusty air: a <b>straight</b> line.", "say": "Shine a torch through dusty air and you can see the beam. It is dead straight. Light travels in straight lines."},
                 {"pic": "⛅", "cap": "Sunlight through a gap in the clouds: straight lines.", "say": "Sunlight coming through a gap in the clouds makes straight lines down to the ground. Same rule."},
                 {"pic": "\U0001F6AA", "cap": "You cannot see round a corner, because light will not <b>bend</b> round it.", "say": "You cannot see round a corner. Light from the thing round the corner travels straight, and straight does not reach your eye."},
                 {"pic": "➡️", "cap": "A <b>ray diagram</b>: straight lines with arrows, showing the way the light goes.", "say": "Scientists draw light as rays: straight lines with an arrow pointing the way the light travels. A drawing made of rays is a ray diagram."},
             ]},
             "Light travels in straight lines. A ray diagram draws them."),

        step("experiment", "Bounce it into an eye", "\U0001FA9E", "Mirror bounce", ["4Ps.02", "4Ps.03", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "A torch, a mirror and an eye. Predict what happens when the ray hits the mirror.",
             explain(
                 ["Light reflects off surfaces: it bounces. A mirror bounces it neatly, in a new straight line.", "You see the torch in the mirror when the bounced ray reaches your eye."],
                 ["Turn the mirror until the reflected ray reaches the eye.", "Then put a book in the way and watch what the eye gets."],
                 ["Children think the eye reaches out to the mirror.", "Light travels INTO the eye. The eye does nothing but receive it."],
                 ["Predict, turn the mirror, block the ray, then conclude."]),
             {"sim": "rayMirror",
              "predict": {"ask": "When the ray hits the mirror, it will...",
                          "opts": [opt("bounce off in a new straight line", True), opt("stop dead", False), opt("bend round in a curve", False)]},
              "runAsk": "Turn the mirror until the ray reaches the eye. Then put the book in the way.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The ray bounced off the mirror in a straight line and, at the right angle, reached the eye; the book blocked it", True), opt("The ray stopped at the mirror", False), opt("The ray curved round the book", False)],
                           "why": "Light reflects off a mirror in a straight line. When that line reaches the eye, you see. Block the line and you see nothing."},
              "conclude": {"ask": "How do you see the torch in the mirror?",
                           "opts": [opt("Light from the torch reflects off the mirror and travels into your eye", True), opt("Your eye sends a beam to the mirror", False), opt("The mirror makes its own light", False)],
                           "why": "Seeing is light arriving at the eye. The mirror only bounces it."}},
             "Light reflects off a mirror. You see when the reflected light reaches your eye."),

        step("explore", "Seeing things that make no light", "\U0001F441️", "How we see", ["4Ps.03", "4Ps.02"],
             "A book makes no light, and you can see it. Tap each step to find out how.",
             explain(
                 ["Only light sources make light. Everything else you see by reflected light.", "Light from a source bounces off the thing, and some of it travels into your eye."],
                 ["The lamp lights the book.", "The book reflects some of that light in every direction.", "Some reaches your eye. You see the book.", "Switch the lamp off and there is nothing to reflect. Darkness."],
                 ["Children think eyes glow or send out beams.", "In total darkness you see nothing, however hard you look. The light must come TO the eye."],
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

        step("diagram", "Label a ray diagram", "✏️", "Ray diagram", ["4TWSm.03", "4Ps.01", "4Ps.02"],
             "Make a ray diagram. Tap a label, then tap the part it belongs to.",
             explain(
                 ["A ray diagram has a source, rays with arrows, and whatever the rays hit: a mirror, an eye."],
                 ["Light source, ray, mirror, eye. Four labels."],
                 ["Children point the arrow at the source.", "The arrow points AWAY from the source, the way the light travels."],
                 ["Tap a label, then the part."]),
             {"figure": "ray", "ask": "Tap a label, then tap where it goes.", "parts": RAY},
             "Source, ray, mirror, eye. A ray diagram."),

        step("sort", "Reflects, or makes its own light?", "\U0001F5C2️", "Source sort", ["4Ps.03", "4TWSc.01"],
             "Is this a <b>light source</b>, or something you see only by <b>reflected</b> light? Tap the bin.",
             explain(
                 ["A source makes light. Everything else is seen by reflection."],
                 ["The Sun, a lamp, a candle, a firefly: sources.", "The Moon, a mirror, a book, a white wall: reflectors."],
                 ["Children think a mirror is a source because it is bright.", "Put a mirror in a dark cupboard. Dark. It only reflects."],
                 ["Would it glow in a dark cupboard? Then tap."]),
             {"ask": "Light source, or seen by reflected light?",
              "bins": [{"id": "source", "label": "Light source", "pic": "\U0001F4A1"}, {"id": "reflect", "label": "Seen by reflected light", "pic": "\U0001F315"}],
              "items": [
                  {"pic": "☀️", "label": "the Sun", "bin": "source", "why": "The biggest light source of all."},
                  {"pic": "\U0001F315", "label": "the Moon", "bin": "reflect", "why": "It reflects sunlight. In a dark cupboard it would be dark."},
                  {"pic": "\U0001FA9E", "label": "a mirror", "bin": "reflect", "why": "It reflects beautifully, but makes nothing."},
                  {"pic": "\U0001F56F️", "label": "a candle", "bin": "source", "why": "A flame makes its own light."},
                  {"pic": "\U0001F4D5", "label": "a red book", "bin": "reflect", "why": "It reflects red light from the lamp."},
                  {"pic": "\U0001F4A1", "label": "a lamp", "bin": "source", "why": "Electricity makes light in the bulb."},
                  {"pic": "\U0001F41B", "label": "a firefly", "bin": "source", "why": "A firefly makes its own light in its body."},
                  {"pic": "\U0001F9F1", "label": "a white wall", "bin": "reflect", "why": "White reflects most of the light that hits it."},
              ]},
             "Sources make light. Everything else you see by reflection."),

        step("context", "How the idea of seeing changed", "\U0001F4DC", "Seeing long ago", ["4SIC.01", "4Ps.03"],
             "For a thousand years, people were sure the eye sent out beams. Evidence changed that. Tap each one.",
             explain(
                 ["Scientific knowledge changes when new evidence comes from enquiry."],
                 ["The old idea: eyes send out rays that touch things.", "The problem: then why can we not see in the dark?", "About a thousand years ago a scientist called Ibn al-Haytham tested it with dark rooms and pinholes, and showed light comes INTO the eye.", "Evidence beat the old idea."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F441️", "label": "the old idea", "say": "For a thousand years, many clever people believed the eye sent out beams that touched what you looked at. It sounded right."},
                 {"pic": "\U0001F311", "label": "the problem", "say": "But if eyes sent out beams, why could nobody see in a dark room? Why did your eyes hurt looking at the Sun? The old idea could not explain it."},
                 {"pic": "\U0001F52C", "label": "the enquiry", "say": "About a thousand years ago, a scientist called Ibn al-Haytham built dark rooms with tiny holes and showed that light from outside came in through the hole and made a picture. Light travels INTO the eye, not out of it."},
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
                 q("What does a mirror do to light?", "\U0001FA9E", "reflects it: bounces it off in a new straight line", ["makes it", "swallows it"], "Reflection."),
                 q("How do you see a book?", "\U0001F4D5", "light reflects off it into your eye", ["your eye sends a beam to it", "the book glows"], "Reflected light arriving at the eye."),
                 q("What does the arrow on a ray show?", "➡️", "which way the light travels", ["how bright it is", "the colour"], "Direction, away from the source."),
                 q("Why can you see nothing in a totally dark room?", "\U0001F311", "no light reaches your eye", ["your eyes are closed", "the room is too big"], "No light in, no seeing."),
             ]},
             "You know how light travels and how you see."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Ps.01", "4Ps.02", "4Ps.03", "4TWSm.03", "4SIC.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Why can you not see round a corner?", "\U0001F6AA", "light travels in straight lines and will not bend round it", ["it is too dark", "corners are opaque"], "Straight only."),
                 q("What is a ray diagram?", "✏️", "a drawing of light as straight lines with arrows", ["a photograph", "a map of the room"], "Rays, arrows, source."),
                 q("You see the torch in the mirror because...", "\U0001FA9E", "its light reflects off the mirror into your eye", ["the mirror makes light", "your eye lights the mirror"], "Reflected into the eye."),
                 q("Which is a light source?", "\U0001F56F️", "a candle", ["the Moon", "a mirror", "a white wall"], "It makes its own light."),
                 q("Which do you see only by reflected light?", "\U0001F315", "the Moon", ["the Sun", "a lamp", "a firefly"], "Sunlight bouncing off it."),
                 q("A book blocks the ray. What does the eye see?", "\U0001F4D5", "nothing from the torch; the ray never arrives", ["the torch, faintly", "the book glowing"], "Blocked light does not reach the eye."),
                 q("Who showed that light comes INTO the eye?", "\U0001F52C", "Ibn al-Haytham, with dark rooms and pinholes", ["nobody", "a vote"], "Evidence from enquiry."),
                 q("What makes scientific knowledge change?", "\U0001F4DA", "evidence gained by enquiry", ["loud opinions", "time passing"], "Evidence."),
             ]},
             "That is the whole lesson finished. You know how you see."),
    ],
}

LESSON["about"] = [
    "Say that light travels in straight lines and draw it as rays.",
    "Say what happens when light hits a mirror.",
    "Explain how you see things that make no light of their own.",
    "Label a ray diagram, and say how evidence changed the old idea of seeing.",
]

LESSON["lecture"] = [
    part("\U0001F4CF", "Straight lines",
         "Light travels in straight lines. A torch beam through dust is dead straight. Sunlight through the clouds comes down in straight lines. You cannot see round a corner because light will not bend. Scientists draw light as rays: straight lines with arrows."),
    part("\U0001FA9E", "Reflection",
         "When light hits a surface it bounces off. That is reflection. A mirror reflects neatly, in one new straight line. A book reflects roughly, in every direction. Either way, the light bounces."),
    part("\U0001F441️", "Seeing",
         "Only a source makes light. You see everything else by reflected light. The lamp shines on the book, the book reflects some of it, and a little travels straight into your eye. Switch the lamp off and there is nothing to reflect, so you see nothing."),
    part("\U0001F4DC", "The old idea",
         "For a thousand years people believed the eye sent out beams to touch things. Then a scientist called Ibn al-Haytham built dark rooms with tiny holes and showed light comes into the eye, not out of it. His evidence changed what everyone knew."),
    part("✏️", "Today",
         "Today you bounce a torch beam off a mirror into an eye, work out how a book is seen, sort sources from reflectors, and label a ray diagram of your own."),
]

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
         ["Light reflects off every surface.", "A shiny surface reflects neatly."]),
    word("evidence", "\U0001F52C", "Facts from enquiry that show whether an idea is right.",
         ["Evidence changed the idea of seeing.", "Scientists look for evidence."]),
]

LESSON["home"] = [
    home("Torch and mirror", "A torch, a small mirror, a dark room, a friend",
         ["Shine the torch at the mirror and find the bright spot on the wall.",
          "Turn the mirror slowly until the spot reaches your friend's tummy. Never their eyes.",
          "Put a book in the way and watch the spot vanish."],
         "Straight in, straight out. Block the line and the light is gone."),
    home("Dark cupboard test", "A cupboard you can shut, a torch, a mirror, a glow star, a book",
         ["Put the mirror in the cupboard and shut the door. Can you see it?",
          "Open the door a crack and shine the torch in.",
          "Try the glow star and the book the same way."],
         "Only the glow star shows in the dark. The mirror needs light to reflect."),
    home("Draw a ray diagram", "Paper, a pencil, a ruler",
         ["Draw a lamp, a book and an eye.",
          "Draw a straight ray from the lamp to the book, with an arrow.",
          "Draw a straight ray from the book to the eye, with an arrow."],
         "Two rays, two arrows, both pointing away from where the light came from. That is how you see the book."),
]
