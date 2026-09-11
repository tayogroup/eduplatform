# -*- coding: utf-8 -*-
"""Lesson 1 - Precise Instructions.

0059 Stage 2 Computational Thinking: 2CT.03 an algorithm is a PRECISE set of
instructions; 2CT.06 develop precise sets of instructions to complete simple
tasks, such as drawing a picture or building a brick tower; 2CT.01 follow and
understand linear algorithms; 2CT.04 identify the steps NEEDED to undertake a
task.
"""
from _kit import explain, step, opt, q, s, choice, part, word, home

LESSON = {
    "slug": "precise-instructions",
    "title": "Precise Instructions",
    "blurb": "Give Robo instructions exact enough to draw a house and a boat, follow two long algorithms step by step, and leave out the steps a task does not need.",
    "steps": [
        step("demo", "Robo does exactly what you say", "\U0001F916", "Exactly what you say", ["2CT.03"],
             "Robo can draw, but only what it is told. Press <b>Next</b>.",
             explain(
                 ["An algorithm has to be precise: exact, with nothing left for the computer to guess."],
                 ["Tell Robo draw a shape, and Robo draws some shape. Any shape.", "Tell Robo draw a big square in the middle, and you get a big square in the middle.",
                  "The second instruction is precise. The first is vague."],
                 ["Children think Robo will work out what they meant.", "It cannot. It only has the words you gave it."],
                 ["Press Next and compare the two drawings."]),
             {"frames": [
                 {"pic": "\U0001F916\U0001F58D️", "cap": "We want Robo to draw a <b>house</b>.", "say": "We want Robo to draw a house. Robo only does what it is told."},
                 {"scene": {"id": "dress", "state": []}, "cap": "We say: <b>draw a shape</b>.", "say": "We say: draw a shape."},
                 {"pic": "〽️", "cap": "Robo draws... a squiggle. A shape is ANY shape.", "say": "Robo draws a squiggle. A shape is any shape. Robo did exactly what we said.", "sound": "error"},
                 {"pic": "\U0001F7E7", "cap": "We say: <b>draw a big square in the middle</b>. That is precise.", "say": "We try again. Draw a big square in the middle. That is precise: it says what, how big, and where.", "sound": "click"},
                 {"pic": "\U0001F3E0", "cap": "Precise instructions, one after another, and Robo draws the house.", "say": "Precise instructions, one after another, and Robo draws the house. An algorithm is a precise set of instructions.", "sound": "tada"},
             ]},
             "An algorithm is precise. It says exactly what to do, with nothing to guess."),

        step("precise", "Tell Robo how to draw a house", "\U0001F3E0", "House architect", ["2CT.03", "2CT.06"],
             "Choose the instruction that is precise. Robo will draw exactly what you say.",
             explain(
                 ["A precise instruction says what to draw, how big, and where."],
                 ["Draw a big square in the middle: precise.", "Draw a shape: not precise. Which shape? Where?",
                  "Draw a roof somewhere: not precise. Robo will put it anywhere."],
                 ["Children pick the shortest instruction.", "Pick the one with nothing left to guess, even if it is longer."],
                 ["Read all three, then tap the precise one."]),
             {"drawing": "house", "rounds": [
                 {"ask": "First, the walls.", "why": "It says what, how big and where. Robo can draw that.",
                  "opts": [choice("walls", "Draw a big square in the middle", True), choice("blob", "Draw a shape", False), choice("tiny-square", "Draw a tiny square at the bottom", False)]},
                 {"ask": "Now the roof.", "why": "On top of the square is exactly where a roof goes.",
                  "opts": [choice("roof", "Draw a triangle on top of the square", True), choice("roof-corner", "Draw a roof somewhere", False), choice("huge-square", "Draw a huge square over everything", False)]},
                 {"ask": "Now the door.", "why": "A small door at the bottom of the square: what, how big, where.",
                  "opts": [choice("door", "Draw a small door at the bottom of the square", True), choice("door-roof", "Draw a door on the roof", False), choice("blob", "Draw a shape", False)]},
                 {"ask": "Now a window.", "why": "On the wall, at the top left. Precise.",
                  "opts": [choice("window", "Draw a window on the wall, at the top left", True), choice("window-grass", "Draw a window on the grass", False), choice("sun-grass", "Draw the sun on the grass", False)]},
                 {"ask": "Last, the sun.", "why": "Top right of the sky. Exactly where the sun should be.",
                  "opts": [choice("sun", "Draw the sun in the top right of the sky", True), choice("sun-grass", "Draw the sun on the grass", False), choice("blob", "Draw a shape", False)]},
             ]},
             "Five precise instructions, and Robo drew a house."),

        step("precise", "Tell Robo how to draw a boat", "⛵", "Boat builder", ["2CT.06", "2CT.03"],
             "Same again, for a boat. Pick the precise instruction each time.",
             explain(
                 ["The order matters too: the hull before the mast, the mast before the sail."],
                 ["Draw the hull on the water.", "Draw a tall mast in the middle of the hull.", "Draw a sail on the right of the mast.", "Draw a flag at the top of the mast."],
                 ["Children say 'draw a sail' and expect it on the mast.", "Say WHERE, or Robo puts it in the sky."],
                 ["Read all three, then tap."]),
             {"drawing": "boat", "rounds": [
                 {"ask": "First, the hull.", "why": "On the water, in the middle. Precise.",
                  "opts": [choice("hull", "Draw the hull on the water, in the middle", True), choice("hull-sky", "Draw the hull up in the sky", False), choice("blob", "Draw a shape", False)]},
                 {"ask": "Now the mast.", "why": "Tall, standing up, in the middle of the hull.",
                  "opts": [choice("mast", "Draw a tall mast standing up from the middle of the hull", True), choice("mast-sea", "Draw a mast lying in the sea", False), choice("blob", "Draw something long", False)]},
                 {"ask": "Now the sail.", "why": "On the right side of the mast, where the wind can catch it.",
                  "opts": [choice("sail", "Draw a sail on the right side of the mast", True), choice("sail-sky", "Draw a sail floating in the sky", False), choice("flag-hull", "Draw a flag on the hull", False)]},
                 {"ask": "Last, the flag.", "why": "At the very top of the mast.",
                  "opts": [choice("flag", "Draw a small flag at the top of the mast", True), choice("flag-hull", "Draw a flag on the hull", False), choice("blob", "Draw a shape", False)]},
             ]},
             "A boat, drawn from precise instructions."),

        step("follow", "Follow the algorithm: a cup of tea", "\U0001F375", "Tea maker", ["2CT.01"],
             "Five steps, in order. Tap the step the algorithm says next and watch the cup.",
             explain(
                 ["A linear algorithm is a straight line of steps: one, then the next, then the next."],
                 ["Get a cup.", "Put a tea bag in it.", "Pour in the hot water.", "Add milk.", "Stir."],
                 ["Children want to pour the water first because it is the exciting bit.", "Water with no cup is a puddle."],
                 ["Tap step one and keep going."]),
             {"scene": "tea", "steps": [
                 s("cup", "Get a cup", "☕", "A cup on the table."),
                 s("bag", "Put a tea bag in the cup", "\U0001F9FA", "Tea bag in."),
                 s("water", "Pour in the hot water", "\U0001F4A7", "Hot water in. The tea goes brown."),
                 s("milk", "Add a little milk", "\U0001F95B", "A little milk."),
                 s("stir", "Stir it with a spoon", "\U0001F944", "Stir. A cup of tea."),
             ]},
             "Five steps in a straight line. That is a linear algorithm."),

        step("follow", "Follow the algorithm: bedtime", "\U0001F6CF️", "Bedtime routine", ["2CT.01"],
             "A bedtime algorithm. Tap the step that comes next.",
             explain(
                 ["Following an algorithm means doing each step as it is written, even the ones you would rather skip."],
                 ["Pyjamas on.", "Brush your teeth.", "Read a story.", "Get into bed.", "Lights off."],
                 ["Children put lights off before the story.", "Then the story is read in the dark."],
                 ["Tap the steps in the order the algorithm shows."]),
             {"scene": "bed", "steps": [
                 s("pyjamas", "Put on pyjamas", "\U0001F454", "Pyjamas on."),
                 s("teeth", "Brush your teeth", "\U0001F9B7", "Teeth brushed."),
                 s("story", "Read a story", "\U0001F4D6", "A story."),
                 s("bed", "Get into bed", "\U0001F6CF️", "Into bed."),
                 s("lights", "Lights off", "\U0001F4A1", "Lights off. Goodnight."),
             ]},
             "Every step, in order, and the lights go off last."),

        step("order", "Only the steps you need: take a photo", "\U0001F4F7", "Step picker", ["2CT.04", "2CT.03"],
             "Some of these steps are NOT part of taking a photo. Tap only the ones you need, in order.",
             explain(
                 ["To write an algorithm, first work out which steps the task needs.", "Then put those steps in order, and leave the rest out."],
                 ["Taking a photo needs the tablet switched on, the camera, pointing, the button, and a look at the photo.", "It does not need a coat, a song, or a watered plant."],
                 ["Children add steps because they are fun.", "A step the task does not need is a step that does not belong."],
                 ["Tap the needed steps in order. Skip the rest."]),
             {"items": [
                 {"id": "on", "pic": "\U0001F4F1", "label": "switch the tablet on", "say": "First, switch the tablet on."},
                 {"id": "camera", "pic": "\U0001F4F7", "label": "open the camera", "say": "Open the camera."},
                 {"id": "point", "pic": "\U0001F431", "label": "point it at the cat", "say": "Point it at the cat."},
                 {"id": "snap", "pic": "\U0001F4F8", "label": "tap the round button", "say": "Tap the round button. Click!"},
                 {"id": "look", "pic": "\U0001F5BC\uFE0F", "label": "look at your photo", "say": "Look at your photo. There is the cat."},
             ], "extras": [
                 {"pic": "\U0001F9E5", "label": "put on your coat", "why": "A coat has nothing to do with taking a photo."},
                 {"pic": "\U0001F3B5", "label": "sing a song", "why": "Singing does not take a photo."},
                 {"pic": "\U0001F331", "label": "water the plant", "why": "The plant is not part of this task."},
             ]},
             "Five needed steps, in order, and three left out. That is writing an algorithm."),

        step("order", "Only the steps you need: post a letter", "\U0001F4EE", "Letter poster", ["2CT.04"],
             "Which steps does posting a letter need? Tap them in order and leave out the rest.",
             explain(
                 ["Ask of every step: does the task need this? If not, it stays out."],
                 ["Write the letter.", "Put it in the envelope.", "Write the address.", "Stick on a stamp.", "Post it in the postbox."],
                 ["Children think more steps make a better algorithm.", "The right steps make a better algorithm."],
                 ["Needed steps only, in order."]),
             {"items": [
                 {"id": "write", "pic": "✏️", "label": "write the letter", "say": "Write the letter."},
                 {"id": "envelope", "pic": "✉️", "label": "put it in the envelope", "say": "Put it in the envelope."},
                 {"id": "address", "pic": "\U0001F3E0", "label": "write the address on the front", "say": "Write the address on the front."},
                 {"id": "stamp", "pic": "\U0001F4EF", "label": "stick on a stamp", "say": "Stick on a stamp."},
                 {"id": "post", "pic": "\U0001F4EE", "label": "post it in the postbox", "say": "Post it in the postbox."},
             ], "extras": [
                 {"pic": "\U0001F4FA", "label": "turn on the television", "why": "The television has nothing to do with a letter."},
                 {"pic": "\U0001F60B", "label": "eat the stamp", "why": "Eating the stamp does not post anything."},
             ]},
             "Only the needed steps, in the right order."),

        step("questions", "Precise, or not?", "\U0001F50D", "Precision judge", ["2CT.03"],
             "Which instruction is precise enough for Robo? Tap it.",
             explain(
                 ["A precise instruction leaves nothing to guess: what, how many, where, which."],
                 ["Take three steps forward: precise.", "Go a bit that way: not precise.", "Put the cup on the table: precise."],
                 [],
                 ["Ask: could Robo do this without asking a question? Then it is precise."]),
             {"label": "Question", "items": [
                 q("Which instruction could Robo actually follow?", "\U0001F463", "Take three steps forward", ["Walk a bit", "Go somewhere", "Move about"], "Three steps forward says exactly how far and which way."),
                 q("Which instruction about the cup is precise?", "☕", "Put the red cup on the table", ["Put it somewhere", "Do something with the cup", "Sort of tidy up"], "It says which cup and where."),
                 q("Which instruction about the bricks is precise?", "\U0001F9F1", "Put the blue brick on top of the red brick", ["Add a brick", "Make it taller", "Put a brick somewhere"], "Which brick, and exactly where."),
                 q("Which instruction is NOT precise?", "\U0001F58D️", "Draw a shape", ["Draw a circle in the middle", "Draw a small triangle on top", "Draw a square at the bottom"], "'Draw a shape' does not say which shape or where."),
             ]},
             "Precise means nothing left to guess."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2CT.01", "2CT.03", "2CT.04", "2CT.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about Robo's drawings, the tea, bedtime and the photo."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("An algorithm is a set of instructions that must be...", "\U0001F4DD", "precise", ["long", "funny", "loud"], "An algorithm is a precise set of instructions."),
                 q("You tell Robo 'draw a shape'. What happens?", "\U0001F916", "Robo draws any shape, anywhere", ["Robo draws a house", "Robo asks you which shape", "Robo draws nothing"], "Robo does exactly what it is told. Any shape is a shape."),
                 q("Which instruction would draw a roof where a roof belongs?", "\U0001F3E0", "draw a triangle on top of the square", ["draw a roof somewhere", "draw a triangle", "make it look nice"], "On top of the square says exactly where."),
                 q("A linear algorithm is...", "➡️", "a straight line of steps, one after another", ["a circle", "a picture", "a list with no order"], "Linear means one step, then the next, in a line."),
                 q("Making a cup of tea: what comes FIRST?", "☕", "get a cup", ["pour the water", "stir", "add milk"], "The cup first, or the water is a puddle."),
                 q("Which step is NOT needed for taking a photo?", "\U0001F4F7", "put on your coat", ["open the camera", "point it at the cat", "tap the round button"], "A coat has nothing to do with taking a photo."),
                 q("Before you write an algorithm, you should...", "\U0001F914", "work out which steps the task needs", ["add as many steps as you can", "guess", "draw a picture of a cat"], "First find the needed steps, then put them in order."),
                 q("Which is the precise instruction?", "\U0001F9F1", "put the blue brick on top of the red brick", ["put a brick somewhere", "add some bricks", "make it taller"], "Which brick and exactly where."),
             ]},
             "That is the whole lesson finished. You can write precise algorithms."),
    ],
}


LESSON["about"] = [
    "Say that an algorithm is a precise set of instructions.",
    "Give instructions precise enough for a robot to draw a picture.",
    "Follow a longer algorithm step by step.",
    "Work out which steps a task needs, and leave the others out.",
]

LESSON["lecture"] = [
    part("\U0001F916", "Exactly what you say",
         "Robo does exactly what it is told and nothing more. Say draw a shape and you get any shape, anywhere. Say draw a big square in the middle and you get exactly that. An algorithm is a precise set of instructions."),
    part("\U0001F3E0", "What, how big, where",
         "A precise instruction says what to draw, how big, and where. A triangle on top of the square. A small door at the bottom. The sun in the top right of the sky. Nothing is left for Robo to guess."),
    part("☕", "A linear algorithm",
         "Get a cup. Put in a tea bag. Pour the hot water. Add milk. Stir. One step after another, in a straight line: that is a linear algorithm, and you follow it exactly as it is written."),
    part("\U0001F4F7", "Only the steps you need",
         "Before you write an algorithm, work out which steps the task needs. A photo needs the tablet switched on, the camera, pointing, the button and a look. It does not need a coat or a song. Leave those out."),
    part("\U0001F9F1", "Building and drawing",
         "The same rule builds a tower or draws a picture: precise steps, in the right order, and nothing that does not belong. Put the blue brick on top of the red brick is precise. Add a brick is not."),
]

LESSON["words"] = [
    word("precise", "\U0001F3AF", "Exact, with nothing left to guess.",
         ["A precise instruction says where.", "Be precise: which cup?"]),
    word("instruction", "\U0001F4E2", "One step that tells you exactly what to do.",
         ["The first instruction is: get a cup.", "Give Robo an instruction."]),
    word("algorithm", "\U0001F4DD", "A precise set of instructions to do a job.",
         ["The tea algorithm has five steps.", "Write an algorithm for taking a photo."]),
    word("linear", "➡️", "In a straight line, one step after another.",
         ["A linear algorithm has no jumping about.", "Follow it in a line."]),
    word("vague", "\U0001F32B️", "Not clear; leaving things to guess.",
         ["'Draw a shape' is vague.", "A vague instruction confuses Robo."]),
    word("needed", "✅", "Something the task cannot be done without.",
         ["The camera is needed for a photo.", "A coat is not needed."]),
]

LESSON["home"] = [
    home("Draw what I say", "Paper, a pencil, a grown-up",
         ["You give instructions for drawing a house. Your grown-up draws EXACTLY what you say and nothing more.",
          "'Draw a shape' gets a shape. 'Draw a roof' with no place gets a roof anywhere.",
          "Swap over."],
         "How many tries until the drawing came out right? Precise instructions get it right first time."),
    home("Tea for a robot", "A grown-up, an empty cup and a spoon. No real water.",
         ["Say the tea algorithm, one step at a time. Your grown-up is the robot and acts each step out with the empty cup.",
          "If you say 'pour the water' before 'get a cup', watch what the robot pretends to do.",
          "Say it again, precisely, in order."],
         "A robot needs the cup BEFORE the water."),
    home("Needed or not", "Paper and a pencil",
         ["Write eight steps for a job, and hide two steps in it that are not needed.",
          "Give it to a grown-up to cross out the ones that do not belong.",
          "Swap over."],
         "A step the task does not need is a step that should not be there."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["warmup"] = [
    q("A friend says 'meet me somewhere'. What is wrong with that?", "\U0001F5FA\uFE0F", "you do not know where to go", ["nothing, it is clear", "it is too loud", "it is too short"], "Somewhere could be anywhere. A good instruction says exactly where."),
    q("To wash your face, which step do you NOT need?", "\U0001F9FC", "tie your shoelaces", ["wet the cloth", "wipe your face", "dry it with a towel"], "Shoelaces have nothing to do with washing your face."),
]
