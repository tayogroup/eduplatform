# -*- coding: utf-8 -*-
"""Lesson 3 - Forward, Back, Left, Right.

0059 Stage 1: 1CT.03 give simple instructions using directional language
(forward, backwards, left, right) to navigate a path; with 1P.02 (the
instructions are a program Robo runs), 1P.03 (predict where Robo will stop),
1P.05 (run it to test whether it reached the flower) and 1CT.06.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "forward-back-left-right",
    "title": "Forward, Back, Left, Right",
    "blurb": "Learn the four instructions, drive Robo across a grid to the flower, and predict where a program will make Robo stop before you press Go.",
    "steps": [
        step("explore", "The four instructions", "\U0001F9ED", "Four directions", ["1CT.03"],
             "Robo understands four instructions. Tap each one to hear what it does.",
             explain(
                 ["To move something along a path you need direction words.", "Forward, backwards, left, right."],
                 ["Forward: one square the way you are facing.", "Backwards: one square the other way.",
                  "Turn left: spin to your left without moving.", "Turn right: spin to your right without moving."],
                 ["Children think turn left means move left.", "A turn only spins you round. You stay on the same square."],
                 ["Tap all four and do them with your own body."]),
             {"items": [
                 {"pic": "⬆️", "label": "forward", "say": "Forward. Move one square the way you are facing."},
                 {"pic": "⬇️", "label": "backwards", "say": "Backwards. Move one square the other way, without turning round."},
                 {"pic": "↺", "label": "turn left", "say": "Turn left. Spin to your left. You stay on the same square."},
                 {"pic": "↻", "label": "turn right", "say": "Turn right. Spin to your right. You stay on the same square."},
             ], "need": 4,
              "then": {"ask": "Which instruction makes Robo spin round without moving to a new square?",
                       "opts": [opt("Turn left, or turn right", True), opt("Forward", False), opt("Backwards", False)],
                       "why": "A turn spins Robo on the spot. Forward and backwards are the ones that move it."}},
             "Forward, backwards, turn left, turn right. Four instructions."),

        step("demo", "Meet Robo", "\U0001F916", "Robo's rules", ["1CT.03", "1P.02"],
             "Robo lives on a grid and only does what it is told. Press <b>Next</b>.",
             explain(
                 ["Robo is a robot on a grid of squares.", "It has a yellow arrow that shows which way it is facing."],
                 ["Forward moves Robo one square the way the arrow points.", "Turn right spins the arrow. Robo does not move.",
                  "Then forward moves it in the NEW direction.", "A list of these instructions is a program, and Robo runs it."],
                 ["Children forget which way Robo is facing after a turn.", "Look at the yellow arrow before every forward."],
                 ["Press Next and watch the arrow."]),
             {"frames": [
                 {"pic": "\U0001F916⬆️", "cap": "This is <b>Robo</b>. The yellow arrow shows which way it is facing.", "say": "This is Robo. The yellow arrow shows which way Robo is facing."},
                 {"pic": "\U0001F916➡️□", "cap": "<b>Forward</b> moves Robo one square the way it faces.", "say": "Forward moves Robo one square the way it is facing.", "sound": "beep"},
                 {"pic": "\U0001F916↻", "cap": "<b>Turn right</b> spins Robo. It stays on its square.", "say": "Turn right spins Robo round. It stays on the same square.", "sound": "click"},
                 {"pic": "\U0001F916⬇️□", "cap": "Now <b>forward</b> goes the new way.", "say": "Now forward goes the new way, because Robo is facing a new way.", "sound": "beep"},
                 {"pic": "\U0001F9F1", "cap": "A <b>wall</b> stops Robo. Bump!", "say": "A wall stops Robo. Bump! Robo cannot go through it.", "sound": "buzz"},
                 {"pic": "\U0001F4DD▶️", "cap": "A list of instructions is a <b>program</b>. Press Go and Robo runs it.", "say": "A list of instructions for Robo is a program. Press Go and Robo runs it, one instruction at a time.", "sound": "tada"},
             ]},
             "Robo faces a way, moves one square at a time, and runs the program you give it."),

        step("robot", "Drive Robo to the flower", "\U0001F338", "Robo driver", ["1CT.03", "1P.02", "1P.05"],
             "Give Robo the instructions to reach the flower. Then press <b>Go</b> and see if it gets there.",
             explain(
                 ["You are writing a program for Robo.", "Tap the arrows to add instructions, then press Go to run it."],
                 ["Count the squares to the flower.", "If Robo needs to go a different way, turn it first, then go forward.",
                  "If Robo stops in the wrong place, change the program and press Go again."],
                 ["Children press Go before they have counted.", "Count the squares first. Then build the program. Then test it."],
                 ["Build the program, then press Go."]),
             {"rows": 4, "cols": 5, "levels": [
                 {"title": "Level 1: straight ahead", "start": [0, 3], "facing": "right", "target": [3, 3], "solution": ["F", "F", "F"],
                  "hint": "Count the squares between Robo and the flower."},
                 {"title": "Level 2: one turn", "start": [0, 3], "facing": "right", "target": [2, 1], "solution": ["F", "F", "L", "F", "F"],
                  "hint": "Go forward, then turn left, then forward again."},
                 {"title": "Level 3: round the wall", "start": [0, 1], "facing": "right", "target": [2, 2], "walls": [[2, 1]], "solution": ["F", "R", "F", "L", "F"],
                  "hint": "The wall is in the way. Go round it."},
                 {"title": "Level 4: backwards", "start": [1, 1], "facing": "up", "target": [3, 3], "solution": ["B", "B", "R", "F", "F"],
                  "hint": "The flower is behind Robo. Try backwards."},
             ]},
             "You drove Robo to the flower four times with forward, backwards, left and right."),

        step("robot", "Where will Robo stop?", "\U0001F52E", "Robo predictor", ["1P.03", "1CT.03"],
             "Read the program. Tap the square where you think Robo will stop. Then press <b>Go</b> and see.",
             explain(
                 ["A good programmer can read a program and say what it will do BEFORE running it.", "That is called predicting."],
                 ["Read each instruction.", "Move your finger along the grid as you read.", "Remember: a turn spins Robo but does not move it.",
                  "Tap the square where your finger ends up. Then press Go and check."],
                 ["Children forget that after a turn, forward goes a new way.", "Follow the yellow arrow in your head."],
                 ["Read, point, tap, then Go."]),
             {"rows": 4, "cols": 5, "levels": [
                 {"title": "Program 1", "predict": True, "start": [0, 0], "facing": "right", "target": [3, 0], "program": ["F", "F", "F"], "answer": [3, 0]},
                 {"title": "Program 2", "predict": True, "start": [0, 3], "facing": "up", "target": [1, 1], "program": ["F", "F", "R", "F"], "answer": [1, 1]},
                 {"title": "Program 3", "predict": True, "start": [4, 3], "facing": "left", "target": [2, 1], "program": ["F", "F", "R", "F"], "answer": [2, 2]},
             ]},
             "You read a program and predicted where Robo would stop."),

        step("sort", "Left or right?", "\U0001F5C2️", "Left and right", ["1CT.03"],
             "Which way is it turning? Tap the bin.",
             explain(
                 ["Left and right are the two ways you can turn.", "Your left hand makes an L shape when you hold it up."],
                 ["An arrow curling this way is a left turn.", "An arrow curling the other way is a right turn.", "A car turning left, a car turning right."],
                 ["Children mix up left and right when the picture faces them.", "Hold up your left hand and match the arrow to it."],
                 ["Look at which way it curls, then tap the bin."]),
             {"ask": "Left, or right?",
              "bins": [{"id": "left", "label": "Turn left", "pic": "↺"}, {"id": "right", "label": "Turn right", "pic": "↻"}],
              "items": [
                  {"pic": "↺", "label": "an arrow curling left", "bin": "left", "why": "That arrow curls to the left."},
                  {"pic": "↻", "label": "an arrow curling right", "bin": "right", "why": "That arrow curls to the right."},
                  {"pic": "⬅️", "label": "an arrow pointing left", "bin": "left", "why": "It points left, so you turn left to face it."},
                  {"pic": "➡️", "label": "an arrow pointing right", "bin": "right", "why": "It points right, so you turn right to face it."},
                  {"pic": "↰", "label": "a road that bends left", "bin": "left", "why": "The road bends to the left."},
                  {"pic": "↱", "label": "a road that bends right", "bin": "right", "why": "The road bends to the right."},
              ]},
             "Left curls one way, right curls the other."),

        step("context", "Directions at work", "\U0001F9ED", "Direction givers", ["1CT.03"],
             "People and machines give directions all day. Tap each one.",
             explain(
                 ["Forward, backwards, left and right are not just for Robo."],
                 ["A sat-nav tells a driver: in one hundred metres, turn left.", "A warehouse robot follows a path to the right shelf.",
                  "A treasure map says: ten steps forward, turn right.", "A dance teacher says: step left, step right."],
                 [],
                 ["Tap each one and listen for the direction words."]),
             {"items": [
                 {"pic": "\U0001F697", "label": "a sat-nav", "say": "A sat-nav gives a driver directions: go forward, then turn left at the lights."},
                 {"pic": "\U0001F916", "label": "a warehouse robot", "say": "A warehouse robot follows a program along the floor: forward, forward, turn right, to the right shelf."},
                 {"pic": "\U0001F5FA️", "label": "a treasure map", "say": "A treasure map is a program too: ten steps forward, turn right, dig."},
                 {"pic": "\U0001F483", "label": "a dance teacher", "say": "A dance teacher calls out directions: step left, step right, turn round."},
             ], "need": 4,
              "then": {"ask": "A sat-nav says: turn left. What does the driver do?",
                       "opts": [opt("Turns the car to the left", True), opt("Drives backwards", False), opt("Stops for ever", False)],
                       "why": "Turn left means turn to the left. The same word works for a car, a dancer and Robo."}},
             "Direction words drive cars, robots and dancers."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1CT.03", "1P.03", "1P.05"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the four instructions, and about what a turn does."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which instruction moves Robo one square the way it is facing?", "⬆️", "forward", ["turn left", "turn right", "stop"], "Forward moves Robo one square the way the arrow points."),
                 q("What does 'turn right' do to Robo?", "↻", "spins it to the right, on the same square", ["moves it one square right", "moves it backwards", "makes it jump"], "A turn spins Robo. It does not move to a new square."),
                 q("The flower is 3 squares in front of Robo. What program gets it there?", "\U0001F338", "forward, forward, forward", ["turn left, turn left, turn left", "backwards, backwards, backwards", "forward"], "Three squares, three forwards."),
                 q("Robo bumps into a wall. What happens?", "\U0001F9F1", "it stops; the program stops", ["it goes through the wall", "it flies over", "it turns into a flower"], "Robo cannot go through a wall. The program stops there."),
                 q("What is a list of instructions for Robo called?", "\U0001F4DD", "a program", ["a flower", "a wall", "a grid"], "A list of instructions Robo runs is a program."),
                 q("Before you press Go, a good programmer...", "\U0001F52E", "predicts where Robo will stop", ["closes their eyes", "presses Go twice", "moves the flower"], "Reading the program and predicting first is what programmers do."),
                 q("Robo faces up. It does 'backwards'. Which way does it move?", "⬇️", "down, one square", ["up, one square", "left", "it spins round"], "Backwards moves one square the opposite way to the arrow, without turning."),
                 q("Robo stopped in the wrong place. What do you do?", "\U0001F527", "change the program and press Go again", ["give up", "move Robo with your hand", "press Go with no change"], "Change the program, then test it again. That is how programmers work."),
             ]},
             "That is the whole lesson finished. You can give directions, and predict where they lead."),
    ],
}


LESSON["about"] = [
    "Use the four instructions: forward, backwards, turn left, turn right.",
    "Give a robot the instructions to reach a place on a grid.",
    "Predict where a program will make the robot stop.",
    "Run a program to test it, and change it when it does not work.",
]

LESSON["lecture"] = [
    part("\U0001F9ED", "Four instructions",
         "To move along a path you need four instructions. Forward: one square the way you face. Backwards: one square the other way. Turn left and turn right: spin round, and stay on your square."),
    part("\U0001F916", "Robo on the grid",
         "Robo is a robot on a grid of squares. A yellow arrow shows which way Robo faces. Forward moves Robo one square that way. A turn spins the arrow. Then forward goes the new way."),
    part("\U0001F4DD", "A program for Robo",
         "You tap the arrows to make a list of instructions. That list is a program. Press Go and Robo runs it, one instruction at a time, until the list ends or it bumps into a wall."),
    part("\U0001F52E", "Predict first",
         "A good programmer reads the program before running it and says where Robo will stop. Move your finger along the squares as you read. Then press Go and see if you were right."),
    part("\U0001F527", "Test it, fix it",
         "If Robo stops in the wrong place, the program is not right yet. Change it: add a turn, take away a forward. Press Go again. Testing and fixing is what programmers do all day."),
]

LESSON["words"] = [
    word("forward", "⬆️", "One square the way you are facing.",
         ["Robo, go forward.", "Two forwards, two squares."]),
    word("backwards", "⬇️", "One square the other way, without turning.",
         ["Robo went backwards to the flower.", "Backwards is the opposite of forward."]),
    word("left", "↺", "One of the two ways you can turn.",
         ["Turn left at the wall.", "Your left hand makes an L."]),
    word("right", "↻", "The other way you can turn.",
         ["Turn right, then go forward.", "The flower is on the right."]),
    word("turn", "\U0001F504", "To spin round and face a new way, staying on the same square.",
         ["A turn does not move Robo.", "Turn, then go forward."]),
    word("robot", "\U0001F916", "A machine that follows a program.",
         ["Robo is a robot.", "The robot only does what it is told."]),
    word("program", "\U0001F4DD", "A list of instructions a computer or a robot runs.",
         ["Build a program for Robo.", "Press Go to run the program."]),
    word("grid", "\U0001F533", "Squares in rows, like a chessboard.",
         ["Robo moves on a grid.", "Count the squares on the grid."]),
]

LESSON["home"] = [
    home("Blindfold robot", "A grown-up, a scarf, a safe room with a toy on the floor",
         ["The grown-up is the robot and wears the scarf over their eyes.",
          "You give ONLY these instructions: forward, backwards, turn left, turn right.",
          "Guide the robot to the toy."],
         "What happens when you say turn left and the robot faces you? Their left is not your left."),
    home("Floor grid", "Masking tape or sheets of paper, a toy",
         ["Make a grid of squares on the floor, four by four.",
          "Put a toy on one square. Stand on another.",
          "A grown-up gives you a program. Do exactly what it says. Did you reach the toy?"],
         "One square per forward. A turn spins you but you stay on your square."),
    home("Treasure path", "Paper, a pencil, a sticker",
         ["Draw a grid of squares and put a sticker on one square: the treasure.",
          "Draw Robo on another square with an arrow for which way it faces.",
          "Write the program: F for forward, L and R for the turns."],
         "Give it to a grown-up. Can they follow it to the treasure without asking you anything?"),
]
