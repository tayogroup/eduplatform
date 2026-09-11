# -*- coding: utf-8 -*-
"""Lesson 7 - Look, Snap and Move.

0067 Stage 2: M.01 the technologies the progression text lists ("drawing /
animation applications ... computer devices, microscopes ... sound recorders
and cameras"), used with growing skill; M.02 choose the tool for a purpose;
E.03 record experiences by photographing close up or far away, and by
movement ("learners could even manipulate their bodies through dance or
movement") turned into marks; E.02 explore the tools; TWA.01 an idea shown
by movement, and in a flip book. The step up from Grade 1: every Grade 1
tool left paint on paper; Grade 2 meets tools that record, zoom and move.
"""
from _kit import explain, step, opt, q, part, word, home, material

LESSON = {
    "slug": "look-snap-move",
    "title": "Look, Snap and Move",
    "blurb": "Meet art tools that are not brushes, choose the right one for the job, take a good photo in the right order, sort photos into close-up and far away, draw the way you moved, and watch a flip book come alive.",
    "steps": [
        step("explore", "Art tools that are not brushes", "📷", "Tool finder", ["2M.01", "2E.02"],
             "Artists use cameras, tablets and even their own bodies. Tap each one to hear what it does.",
             explain(
                 ["Not every art tool leaves paint on paper.", "Some tools help you see, keep or record."],
                 ["A camera keeps a picture of something.", "A drawing app lets you draw and change it again.",
                  "A magnifying glass shows tiny details.", "A torch makes shadows.", "Your body can dance a line."],
                 ["Children think art on a screen is not real art.", "A photo or a drawing on a tablet is art too."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "📷", "label": "a camera", "say": "A camera. It keeps a picture of what you see. Always ask a person before you take their photo."},
                 {"pic": "📱", "label": "a drawing app", "say": "A drawing app on a tablet. Draw with your finger, and change it again and again."},
                 {"pic": "🔍", "label": "a magnifying glass", "say": "A magnifying glass. It makes tiny things look big, so you can see every detail."},
                 {"pic": "🎙️", "label": "a sound recorder", "say": "A sound recorder. Catch the sound of rain or the sea to go with your picture."},
                 {"pic": "🔦", "label": "a torch", "say": "A torch. Shine it on your hand, and a shadow shape appears on the wall. Never shine a torch into anyone's eyes."},
                 {"pic": "💃", "label": "your body", "say": "Your body. Move, dance and jump, then draw the lines your body made."},
             ], "need": 6,
              "then": {"ask": "What should you always do before you take a photo of a person?",
                       "opts": [opt("ask them first", True), opt("take it quickly before they see", False), opt("share it with everyone", False)],
                       "why": "A photo of a person belongs to them too. Always ask first, and ask a grown-up before sharing any photo."}},
             "Six tools, and not one of them is a brush."),

        step("choose", "Which tool for the job?", "🧰", "Tool chooser", ["2M.02", "2M.01"],
             "Each job needs a different tool. Which one would you use? Tap it.",
             explain(
                 ["Choosing the right tool is part of being an artist."],
                 ["To keep a picture of something, use a camera.", "To see tiny lines, use a magnifying glass.",
                  "To draw and change it, use a drawing app.", "To catch a sound, use a sound recorder."],
                 ["Children use the tablet for everything.", "Pick the one that does the job best."],
                 ["Read the job, then tap the tool."]),
             {"materials": [
                 material("camera", "A camera", "📷", ["keeps"], "A camera keeps a picture."),
                 material("glass", "A magnifying glass", "🔍", ["close-up"], "A magnifying glass makes tiny things big."),
                 material("app", "A drawing app", "📱", ["undo"], "A drawing app lets you change your drawing."),
                 material("mic", "A sound recorder", "🎙️", ["sound"], "A sound recorder catches sounds."),
                 material("torch", "A torch", "🔦", ["shadow"], "A torch makes shadows."),
              ],
              "rounds": [
                  {"purpose": "keeping your sand sculpture before the sea washes it away", "needs": "keeps", "pic": "🏖️", "why": "A camera keeps a picture of it, even after the sea has taken it."},
                  {"purpose": "seeing the tiny lines on a feather", "needs": "close-up", "pic": "🪶", "why": "A magnifying glass makes the tiny lines big."},
                  {"purpose": "a drawing you can change again and again", "needs": "undo", "pic": "✏️", "why": "A drawing app lets you undo and try again."},
                  {"purpose": "the sound of the rain, for your rain picture", "needs": "sound", "pic": "🌧️", "why": "A sound recorder catches the sound."},
                  {"purpose": "a shadow puppet show on the wall", "needs": "shadow", "pic": "🐇", "why": "A torch behind your hand makes the shadow."},
              ]},
             "You chose the right tool for five jobs."),

        step("order", "Take a good photo, in order", "📸", "Photographer", ["2M.01", "2E.03"],
             "Taking a good photo has steps. Tap them in the order you would do them.",
             explain(
                 ["A good photo does not happen by luck.", "Photographers do the same steps every time."],
                 ["First choose what to take.", "Then move close or step back until it fills the screen.",
                  "Hold very still and press the button.", "Look at the photo. If it is blurry, take another."],
                 ["Children press the button while they are still moving.", "Hold still first. Then press."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "👀", "label": "choose what to take", "say": "First, choose what you want to take a photo of."},
                 {"pic": "↔️", "label": "move closer or step back", "say": "Move closer, or step back, until it fills the screen."},
                 {"pic": "🧍", "label": "hold very still", "say": "Hold the camera very still, with both hands."},
                 {"pic": "🔘", "label": "press the button", "say": "Press the button gently."},
                 {"pic": "🔍", "label": "look at the photo", "say": "Look at the photo. If it is blurry, take another one."},
             ]},
             "Choose, move, hold still, press, look. That is how photographers work."),

        step("sort", "Close-up or far away?", "🗂️", "Photo sorter", ["2E.03", "2M.01"],
             "Each photo was taken close up or far away. Which is it? Tap the bin.",
             explain(
                 ["A close-up shows one small thing, very big.", "A far-away photo shows a lot of things, small."],
                 ["The spots on one ladybird filling the photo: close-up.", "A whole mountain: far away."],
                 ["Children think far away means blurry.", "Far away means you can see the whole big thing."],
                 ["Think about how much you can see, then tap the bin."]),
             {"ask": "Close-up, or far away?",
              "bins": [{"id": "close", "label": "Close-up", "pic": "🔍"}, {"id": "far", "label": "Far away", "pic": "🏔️"}],
              "items": [
                  {"pic": "🐞", "label": "one ladybird's spots, filling the photo", "bin": "close", "why": "One small thing, very big. A close-up."},
                  {"pic": "🏔️", "label": "a whole mountain", "bin": "far", "why": "You can see the whole mountain, so you stood far away."},
                  {"pic": "🌸", "label": "one petal, filling the photo", "bin": "close", "why": "One petal, very big. A close-up."},
                  {"pic": "🏖️", "label": "a whole beach with tiny people", "bin": "far", "why": "Lots of things, all small. Far away."},
                  {"pic": "🦋", "label": "the pattern on one butterfly wing", "bin": "close", "why": "The pattern of one wing, very big. A close-up."},
                  {"pic": "🌃", "label": "a whole city at night", "bin": "far", "why": "A whole city fits in the photo, so it was far away."},
              ]},
             "You sorted six photos into close-up and far away."),

        step("marks", "Draw how you moved", "💃", "Movement drawer", ["2E.03", "2TWA.01", "2M.01"],
             "Stand up and move, then draw the line your body made. The card tells you which tool to use.",
             explain(
                 ["When you move, your body draws lines in the air.", "Artists record a movement as a mark."],
                 ["Hopping forward makes a zigzag.", "Spinning round makes a circle.", "Swaying gently makes a wavy line.",
                  "Stamping makes dots.", "Stretching up tall makes a straight line."],
                 ["Children draw the person, not the movement.", "Draw the LINE the movement made."],
                 ["Move first, then draw."]),
             {"tools": ["crayon", "brush", "chalk", "finger", "pencil"],
              "rounds": [
                  {"tool": "crayon", "want": "zigzag", "made": "a hopping zigzag", "ask": "In a clear space, hop forward three times, like a kangaroo. Now draw it: a zigzag.", "pic": "🦘", "why": "Up and forward, down, up and forward, down. That is a hop."},
                  {"tool": "brush", "want": "round", "made": "a spinning circle", "ask": "In a clear space, spin round once, carefully. Now draw it: all the way round.", "pic": "🌀", "why": "All the way round and back. That is a spin."},
                  {"tool": "chalk", "want": "wavy", "made": "a swaying wave", "ask": "Sway gently from side to side. Now draw it: a wavy line.", "pic": "🌊", "why": "Gently side to side, like a wave. That is a sway."},
                  {"tool": "finger", "want": "dots", "made": "stamping dots", "ask": "Stamp your feet. Now draw it: lots of dots.", "pic": "👣", "why": "Stamp, stamp, stamp. Every stamp is a dot."},
                  {"tool": "pencil", "want": "straight", "made": "a tall stretch", "ask": "Stretch up tall. Now draw it: one straight line.", "pic": "🙆", "why": "Straight up, not bending. That is a stretch."},
              ]},
             "You turned five movements into five marks."),

        step("demo", "A flip book", "📖", "Flip book watcher", ["2M.01", "2TWA.01"],
             "Press <b>Next</b> and watch how a flip book makes a picture move.",
             explain(
                 ["A cartoon is lots of pictures, each a tiny bit different, shown very fast.", "That is called animation."],
                 ["Draw a ball at the top of the first page.", "On the next page, draw it a little lower.",
                  "Keep going, a little lower each time.", "Flip the pages fast, and the ball bounces."],
                 ["Children change the picture a lot on each page.", "Change it just a little. Then it moves smoothly."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "📖", "cap": "A <b>flip book</b> is a little book with a drawing on every page.", "say": "A flip book is a little book with a drawing on every page."},
                 {"pic": "⚽", "cap": "Page 1: the ball is at the top.", "say": "Page one: the ball is at the top."},
                 {"pic": "⬇️", "cap": "Page 2: the ball is a little lower.", "say": "Page two: the ball is a little lower."},
                 {"pic": "💥", "cap": "Page 3: the ball touches the ground and squashes.", "say": "Page three: the ball touches the ground and squashes.", "sound": "pop"},
                 {"pic": "⬆️", "cap": "Page 4: the ball goes back up.", "say": "Page four: the ball goes back up."},
                 {"pic": "🎬", "cap": "Flip the pages fast, and the ball <b>bounces</b>. That is <b>animation</b>.", "say": "Flip the pages fast, and the ball bounces. That is animation.", "sound": "tada"},
             ]},
             "Many pictures, each a tiny bit different, flipped fast. That is animation."),

        step("questions", "Tool spotter", "💬", "Tool spotter", ["2M.01", "2M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the new tools.", "You have met every one of them."],
                 ["Think about cameras, close-ups, movement and flip books."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Tools", "items": [
                 q("Which tool keeps a picture of your sand sculpture?", "📷", "a camera", ["a torch", "a sound recorder"], "A camera keeps a picture of it."),
                 q("A photo of one petal filling the whole picture is…", "🌸", "a close-up", ["far away", "a flip book"], "One small thing, very big, is a close-up."),
                 q("Spinning round makes a line that is…", "🌀", "round", ["zigzag", "dotted"], "A spin goes all the way round."),
                 q("What do you do just before you press the camera button?", "🧍", "hold very still", ["run", "shake it"], "Hold still, or the photo will be blurry."),
             ]},
             "You know your new tools."),

        step("quiz", "Show what you know", "⭐", "Star tool user", ["2E.02", "2E.03", "2M.01", "2M.02", "2TWA.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the tools, the photos, the movements and the flip book."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What should you do before you take a photo of a person?", "📷", "ask them first", ["take it quickly", "share it with everyone"], "Always ask first."),
                 q("Which tool shows tiny details?", "🔍", "a magnifying glass", ["a torch", "a sound recorder"], "A magnifying glass makes tiny things big."),
                 q("Why use a drawing app for a drawing you want to change?", "📱", "because you can undo and try again", ["because it is always perfect", "because it is bigger"], "An app lets you undo, so you can change your mind."),
                 q("Why might a photo come out blurry?", "🌫️", "because the camera moved when you pressed", ["because you asked first", "because the thing was blue"], "A moving camera makes a blurry photo. Hold still."),
                 q("A photo of a whole mountain was taken…", "🏔️", "far away", ["close up", "under water"], "You have to stand far away to fit a whole mountain in."),
                 q("Hopping forward like a kangaroo makes a line that is…", "🦘", "zigzag", ["round", "straight"], "Up and forward, down, again and again. A zigzag."),
                 q("Lots of pictures, each a tiny bit different, shown fast, is…", "🎬", "animation", ["weaving", "printing"], "That is how cartoons move."),
                 q("Which tool would catch the sound of the sea?", "🎙️", "a sound recorder", ["a camera", "a torch"], "A sound recorder catches sounds."),
             ]},
             "That is the whole lesson finished. You can choose and use new art tools."),
    ],
}


LESSON["about"] = [
    "Name art tools that are not brushes: a camera, a drawing app, a magnifying glass.",
    "Choose the right tool for a job.",
    "Take a good photo, in the right order, and ask before you photograph a person.",
    "Say whether a photo is a close-up or far away.",
    "Turn a movement into a mark, and see how a flip book moves.",
]

LESSON["lecture"] = [
    part("📷", "Tools that see and keep",
         "Some art tools do not use paint at all. A camera keeps a picture. A magnifying glass shows tiny details. A drawing app lets you draw and change it again. Always ask a person before you take their photo."),
    part("🔍", "Close or far",
         "A close-up photo shows one small thing, very big, like the spots on a ladybird. A far-away photo shows a lot, all small, like a whole mountain. Move closer or step back until it looks right."),
    part("💃", "Move, then draw",
         "When you move, your body makes lines in the air. Hopping forward makes a zigzag. A spin is a circle. A sway is a wavy line. Move first, then draw the line you made."),
    part("🎬", "Make it move",
         "A cartoon is lots of pictures, each a little different, shown very fast. That is animation. A flip book is the simplest kind: draw on every page, then flip."),
]

LESSON["words"] = [
    word("photo", "📷", "A picture taken with a camera.",
         ["I took a photo of my sculpture.", "Ask before you take a photo of a person."]),
    word("close-up", "🔍", "A picture of one small thing, very big.",
         ["I took a close-up of a leaf.", "The close-up shows every line."]),
    word("camera", "📸", "A tool that takes photos.",
         ["Hold the camera still.", "The camera is on the tablet."]),
    word("animation", "🎬", "Pictures shown fast, one after another, so they seem to move.",
         ["My flip book is an animation.", "Cartoons are animations."]),
    word("shadow", "🔦", "A dark shape made when something blocks the light.",
         ["My hand made a shadow.", "The shadow looks like a rabbit."]),
    word("record", "🎙️", "To keep a sound or a picture so you can see or hear it again.",
         ["I recorded the rain.", "We recorded our dance with a camera."]),
]

LESSON["home"] = [
    home("Close-up and far away", "A phone or tablet with a camera, and a grown-up",
         ["Take one close-up: a leaf, a toy or a pattern, filling the whole screen.",
          "Take one far-away photo: a whole tree, a room or a street.", "Hold still each time."],
         "Which photo shows more detail? Which shows more things?"),
    home("Shadow shapes", "A torch, a wall, and a grown-up, in a dim room",
         ["Shine the torch at the wall, never into anyone's eyes.", "Put your hand between the torch and the wall.", "Make a rabbit, a bird or a dog."],
         "What happens to the shadow when your hand moves closer to the torch?"),
    home("Flip book", "A small notebook or a pad of sticky notes, and a pencil",
         ["On the last page, draw a ball at the top.", "On the page before, draw it a little lower.",
          "Keep going, a little lower each page, until it touches the bottom. Then draw it a little higher each page after that.",
          "Flip the pages fast from the back."],
         "Does your ball bounce?"),
]

LESSON["journal"] = {
    "changes": ["hold the camera stiller", "get closer to the thing", "draw the movement bigger", "change each page less", "keep it just as it is"],
}
