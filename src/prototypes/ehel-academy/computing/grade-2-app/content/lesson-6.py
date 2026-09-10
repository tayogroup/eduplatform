# -*- coding: utf-8 -*-
"""Lesson 6 - Bee-Bot Journeys.

0059 Stage 2 Programming: 2P.08 enter directional instructions into a
physical computing device to enable it to reach a specific destination; with
2CT.05 (predict where a program stops) and 2CT.01 (follow a linear
algorithm). Robo on the grid keeps the floor robot's own rules.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "bee-bot-journeys",
    "title": "Bee-Bot Journeys",
    "blurb": "A floor robot remembers every button you press and runs them when you press GO. Take it to the shop, home, and school on a bigger grid, and predict where a program will leave it.",
    "steps": [
        step("demo", "Meet the floor robot", "\U0001F41D", "Floor robot", ["2P.08"],
             "A floor robot has buttons on its back. Press <b>Next</b> and see how it works.",
             explain(
                 ["A floor robot is a small robot you program by pressing the buttons on its back."],
                 ["Forward, backwards, turn left, turn right.", "Every press is remembered.", "GO runs them all, in order.",
                  "CLEAR wipes the memory so you can start a new program."],
                 ["Children forget to press CLEAR and the old program runs first.", "Clear, then enter, then GO."],
                 ["Press Next and learn the buttons."]),
             {"frames": [
                 {"pic": "\U0001F41D", "cap": "A <b>floor robot</b>. It drives on a grid of squares on the floor.", "say": "This is a floor robot. It drives on a grid of squares on the floor, one square at a time."},
                 {"pic": "⬆️⬇️↺↻", "cap": "On its back: forward, backwards, turn left, turn right.", "say": "On its back are the buttons: forward, backwards, turn left, turn right.", "sound": "click"},
                 {"pic": "\U0001F9E0", "cap": "Every press is <b>remembered</b>. That is the program.", "say": "Every press is remembered, in order. That list of presses is the program.", "sound": "beep"},
                 {"pic": "\U0001F7E2", "cap": "<b>GO</b> runs the whole program.", "say": "Press GO and the robot runs the whole program, one square at a time.", "sound": "robot"},
                 {"pic": "\U0001F5D1️", "cap": "<b>CLEAR</b> wipes the memory before a new program.", "say": "Press CLEAR to wipe the memory before a new program. Otherwise the old presses run first.", "sound": "click"},
             ]},
             "Clear, enter the presses, GO. The robot remembers them all."),

        step("robot", "Take the robot to the shop, home and school", "\U0001F41D", "Journey maker", ["2P.08", "2CT.01"],
             "Enter the instructions to reach the destination. Then press <b>Go</b>. Undo and Clear are there if you need them.",
             explain(
                 ["A bigger grid, longer journeys, and a destination each time."],
                 ["Count the squares. Turn when you need to. Go round a wall.",
                  "If the robot stops in the wrong place, Clear and enter a better program."],
                 ["Children enter the turn AFTER the square they wanted to turn on.", "Turn first, then go forward."],
                 ["Enter the presses, then Go."]),
             {"rows": 5, "cols": 5, "levels": [
                 {"title": "Journey 1: to the shop", "start": [0, 4], "facing": "up", "target": [0, 1], "targetPic": "\U0001F3EA", "targetName": "shop", "solution": ["F", "F", "F"],
                  "hint": "The shop is straight ahead."},
                 {"title": "Journey 2: home", "start": [0, 4], "facing": "up", "target": [2, 2], "targetPic": "\U0001F3E0", "targetName": "house", "solution": ["F", "F", "R", "F", "F"],
                  "hint": "Up two, turn, along two."},
                 {"title": "Journey 3: round the wall to the park", "start": [4, 4], "facing": "up", "target": [1, 1], "targetPic": "\U0001F333", "targetName": "park", "walls": [[4, 2]],
                  "solution": ["F", "L", "F", "F", "F", "R", "F", "F"], "hint": "A wall is in the way. Turn before you reach it."},
                 {"title": "Journey 4: to school", "start": [2, 4], "facing": "up", "target": [2, 1], "targetPic": "\U0001F3EB", "targetName": "school", "walls": [[2, 2]],
                  "solution": ["F", "L", "F", "R", "F", "F", "R", "F"], "hint": "Go round the wall and come back to the middle."},
             ]},
             "Four journeys, four destinations reached."),

        step("robot", "Where will the robot stop?", "\U0001F52E", "Journey predictor", ["2CT.05", "2P.08"],
             "Read the program. Tap the square where the robot will stop, then press <b>Go</b> to check.",
             explain(
                 ["Predicting where a program ends is following it in your head, one press at a time."],
                 ["Move your finger square by square.", "A turn spins the robot but does not move it.", "Backwards goes the opposite way to the arrow, without turning."],
                 ["Children forget which way the robot faces after a turn.", "Follow the yellow arrow in your head."],
                 ["Read, point, tap, then Go."]),
             {"rows": 5, "cols": 5, "levels": [
                 {"title": "Program 1", "predict": True, "start": [0, 0], "facing": "down", "target": [1, 2], "targetPic": "\U0001F3EA", "targetName": "shop", "program": ["F", "F", "L", "F"], "answer": [1, 2]},
                 {"title": "Program 2", "predict": True, "start": [4, 4], "facing": "up", "target": [2, 1], "targetPic": "\U0001F3E0", "targetName": "house", "program": ["F", "F", "F", "L", "F", "F"], "answer": [2, 1]},
                 {"title": "Program 3", "predict": True, "start": [2, 2], "facing": "right", "target": [0, 4], "targetPic": "\U0001F3EB", "targetName": "school", "program": ["B", "B", "R", "F"], "answer": [0, 3]},
             ]},
             "You predicted three journeys before pressing Go."),

        step("questions", "Which button?", "\U0001F518", "Button chooser", ["2P.08"],
             "Which buttons on the robot's back do the job? Tap the answer.",
             explain(
                 ["Each button does one thing.", "GO runs what is remembered. CLEAR forgets it."],
                 ["To reach a shop three squares ahead: forward, forward, forward, then GO.", "To face the door on your left without moving: turn left."],
                 [],
                 ["Picture the robot's back, then tap."]),
             {"label": "Question", "items": [
                 q("The shop is 3 squares straight ahead. Which presses?", "\U0001F3EA", "forward, forward, forward, then GO", ["turn left three times", "GO, GO, GO", "backwards three times"], "Three squares ahead, three forwards, then GO to run them."),
                 q("You entered a program, it went wrong, and you want to start again. Which button first?", "\U0001F5D1️", "CLEAR", ["GO", "forward", "turn right"], "CLEAR wipes the old presses so they do not run first."),
                 q("The robot must face the door on its left without moving. Which press?", "↺", "turn left", ["forward", "backwards", "GO"], "A turn spins the robot on its square."),
                 q("Which button makes the robot start driving?", "\U0001F7E2", "GO", ["CLEAR", "forward", "turn right"], "GO runs the remembered program."),
                 q("You forgot to press CLEAR before the new program. What happens?", "❓", "the old presses run first, then the new ones", ["nothing", "the robot explodes", "only the new presses run"], "The robot remembers everything until CLEAR."),
             ]},
             "Forward, backwards, the turns, CLEAR and GO. You know the robot's back."),

        step("context", "Floor robots at work", "\U0001F916", "Robot spotter", ["2P.08"],
             "Grown-up robots follow directional programs too. Tap each one.",
             explain(
                 ["A floor robot in the classroom and a robot in a warehouse follow the same kind of program: a path, a square at a time."],
                 ["A warehouse robot drives to shelf 14 and back.", "A hospital robot carries medicines along a corridor and turns at the right door.",
                  "A robot vacuum turns when it bumps.", "A delivery robot follows the pavement to a house number."],
                 [],
                 ["Tap each one and hear its journey."]),
             {"items": [
                 {"pic": "\U0001F4E6", "label": "a warehouse robot", "say": "A warehouse robot is given a destination: shelf fourteen. It drives forward, turns, and stops there."},
                 {"pic": "\U0001F3E5", "label": "a hospital robot", "say": "A hospital delivery robot follows the corridor, turns left at the right ward, and stops at the door."},
                 {"pic": "\U0001F916", "label": "a robot vacuum", "say": "A robot vacuum goes forward until it bumps, then turns and goes forward again."},
                 {"pic": "\U0001F6F5", "label": "a delivery robot", "say": "A delivery robot follows the pavement, square by square, to the right house number."},
             ], "need": 4,
              "then": {"ask": "What does a warehouse robot need before it can drive to a shelf?",
                       "opts": [opt("A destination and the instructions to reach it", True), opt("A cup of tea", False), opt("Nothing; it guesses", False)],
                       "why": "A robot reaches a destination because a program tells it every turn."}},
             "From the classroom floor to a warehouse: directions, then GO."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2P.08", "2CT.05", "2CT.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the buttons, the journeys, and predicting."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How do you give a floor robot its program?", "\U0001F41D", "press the buttons on its back, in order", ["shout at it", "draw on it", "push it along"], "Every press is remembered as one instruction."),
                 q("What does GO do?", "\U0001F7E2", "runs all the remembered presses in order", ["forgets everything", "turns the robot round", "makes it go faster"], "GO runs the program."),
                 q("What does CLEAR do?", "\U0001F5D1️", "wipes the remembered presses", ["cleans the floor", "runs the program", "turns left"], "CLEAR empties the memory for a new program."),
                 q("The robot faces up. Forward, forward, turn right. Which way does it face now?", "↻", "right", ["up", "left", "down"], "Two forwards do not change the facing; the right turn does."),
                 q("A turn button makes the robot...", "↺", "spin on its square without moving", ["move one square sideways", "go backwards", "stop for ever"], "A turn changes the facing only."),
                 q("The house is two squares ahead and then two to the right. Which program?", "\U0001F3E0", "forward, forward, turn right, forward, forward", ["forward, forward", "turn right, forward, forward", "backwards, backwards"], "Up two, turn right, along two."),
                 q("The robot stopped in the wrong square. What do you do?", "\U0001F527", "CLEAR, enter a better program, GO", ["carry it to the right square", "press GO again and hope", "give up"], "Fix the program, not the robot."),
                 q("Predicting where a program ends means...", "\U0001F52E", "following every press in your head before GO", ["guessing a square", "pressing GO first", "asking the robot"], "Move your finger square by square."),
             ]},
             "That is the whole lesson finished. You can program a floor robot to a destination."),
    ],
}


LESSON["about"] = [
    "Enter directional instructions into a floor robot to reach a destination.",
    "Use CLEAR and GO the right way round.",
    "Go round a wall by turning before you reach it.",
    "Predict where a program will leave the robot before pressing GO.",
]

LESSON["lecture"] = [
    part("\U0001F41D", "The floor robot",
         "A floor robot drives on a grid of squares on the floor. On its back are buttons: forward, backwards, turn left, turn right. Every press is remembered, in order. That list of presses is the program."),
    part("\U0001F7E2", "CLEAR, then GO",
         "Press CLEAR first, to wipe the old program. Then press the buttons for the journey. Then press GO, and the robot runs them all, one square at a time. Forget CLEAR and the old presses run first."),
    part("\U0001F3EA", "A destination",
         "Every journey has a destination: the shop, home, school. Count the squares to it. Turn before you go along. If a wall is in the way, turn before you reach it and go round."),
    part("\U0001F52E", "Predict first",
         "Before GO, follow the program in your head, moving your finger one square per forward. A turn spins the robot but does not move it. Say where it will stop. Then GO, and see."),
    part("\U0001F4E6", "Robots at work",
         "A warehouse robot, a hospital robot and a delivery robot all follow the same kind of program: a path to a destination, one turn at a time. What you do with the floor robot is what they do all day."),
]

LESSON["words"] = [
    word("floor robot", "\U0001F41D", "A small robot you program with the buttons on its back.",
         ["The floor robot drove to the shop.", "Press the floor robot's buttons in order."]),
    word("destination", "\U0001F3EA", "The place a journey ends.",
         ["The shop is the destination.", "Enter the presses to reach the destination."]),
    word("GO", "\U0001F7E2", "The button that runs the remembered program.",
         ["Press GO and watch.", "GO runs every press."]),
    word("CLEAR", "\U0001F5D1️", "The button that wipes the remembered presses.",
         ["Press CLEAR before a new program.", "CLEAR, then enter, then GO."]),
    word("forward", "⬆️", "One square the way the robot faces.",
         ["Forward three times.", "Forward moves it one square."]),
    word("turn", "↻", "To spin on the spot and face a new way.",
         ["Turn right, then forward.", "A turn does not move the robot."]),
    word("program", "\U0001F4DD", "The list of presses the robot remembers and runs.",
         ["Enter the program.", "The program took the robot home."]),
]

LESSON["home"] = [
    home("Floor grid journeys", "Masking tape or paper squares, a toy, a grown-up",
         ["Make a five-by-five grid on the floor.",
          "Put a toy on a square: the destination. Stand on another square.",
          "A grown-up presses the buttons on your back by saying them. You remember them all, then do them on GO."],
         "Did the grown-up say CLEAR first? What happened if not?"),
    home("Be the robot", "The grid, a friend",
         ["Your friend enters a program by tapping your shoulder: one tap forward, two taps turn right, three taps turn left.",
          "You do nothing until they say GO. Then run every tap in order.",
          "Swap."],
         "The robot cannot start until GO, and cannot skip a press."),
    home("Predict, then press", "The grid, a toy",
         ["A grown-up writes a program: forward, forward, turn right, forward.",
          "Put your finger on the square where you think it ends.",
          "Run it and check."],
         "Move your finger one square for every forward. A turn only spins."),
]
