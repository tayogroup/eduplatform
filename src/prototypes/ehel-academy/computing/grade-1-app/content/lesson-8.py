# -*- coding: utf-8 -*-
"""Lesson 8 - Computers Everywhere.

0059 Stage 1 Computer Systems, all six: 1CS.01 computer systems with
different functions (communication, entertainment, creativity, research,
controlling other technology); 1CS.02 computers run many different
programs; 1CS.03 information and data can be input in many ways; 1CS.04
computers output information in many ways; 1CS.05 everyday devices use
computers to control what they do; 1CS.06 what robots are and where they
are found.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "computers-everywhere",
    "title": "Computers Everywhere",
    "blurb": "Find out what computers are for, open six programs on one tablet, put information in and get it out, find the computers hiding inside everyday things, and meet the robots.",
    "steps": [
        step("explore", "What is a computer for?", "\U0001F4BB", "Computer uses", ["1CS.01"],
             "Computers do many different jobs. Tap each one to hear what kind of job it is.",
             explain(
                 ["A computer is a machine that follows programs, and people use computers for very different things."],
                 ["Talking to Grandma far away: communication.", "Watching a film: entertainment.", "Drawing a picture: creativity.",
                  "Finding out about lions: research.", "A washing machine's computer: controlling a machine."],
                 ["Children think a computer is only for games.", "Games are one job of five."],
                 ["Tap all five kinds of job."]),
             {"items": [
                 {"pic": "\U0001F4DE", "label": "talking to Grandma", "sub": "communication", "say": "A video call to Grandma far away. Computers help people talk to each other. That is communication."},
                 {"pic": "\U0001F3AC", "label": "watching a film", "sub": "entertainment", "say": "Watching a film, or playing a game. Computers entertain us. That is entertainment."},
                 {"pic": "\U0001F3A8", "label": "drawing a picture", "sub": "creativity", "say": "Drawing, making music, writing a story. Computers help us make things. That is creativity."},
                 {"pic": "\U0001F50E", "label": "finding out about lions", "sub": "research", "say": "Finding out about lions, or the weather, or how to spell a word. Computers help us find things out. That is research."},
                 {"pic": "\U0001F9FA", "label": "a washing machine", "sub": "controlling a machine", "say": "The computer inside a washing machine controls it: fill, wash, spin. Computers control other machines."},
             ], "need": 5,
              "then": {"ask": "Which of these is a computer CONTROLLING a machine?",
                       "opts": [opt("The computer inside a washing machine", True), opt("Watching a film", False), opt("Drawing a picture", False)],
                       "why": "A washing machine's computer controls what the machine does. The others are entertainment and creativity."}},
             "Communication, entertainment, creativity, research, control. Five jobs for computers."),

        step("apps", "One computer, many programs", "\U0001F4F1", "App opener", ["1CS.02"],
             "One tablet can run many different programs. Open each one and try it.",
             explain(
                 ["A computer can run many different programs.", "Each program does a different job, on the same machine."],
                 ["Paint lets you draw.", "The ball game is a game.", "Writing lets you type words.", "Videos plays a film.",
                  "Call talks to Grandma.", "Search finds things out.", "Six programs, one tablet."],
                 ["Children think each job needs its own machine.", "One computer, many programs. That is the whole point of a computer."],
                 ["Open every program and do something in each."]),
             {"need": 6, "apps": [
                 {"id": "paint", "label": "Paint", "pic": "\U0001F3A8", "screen": "paint", "say": "Paint is a program for drawing. Tap the white space to paint dots."},
                 {"id": "game", "label": "Ball game", "pic": "⚽", "screen": "game", "say": "The ball game is a program for playing. Catch the ball."},
                 {"id": "write", "label": "Writing", "pic": "✏️", "screen": "write", "say": "Writing is a program for typing words. Press Type Hello."},
                 {"id": "video", "label": "Videos", "pic": "\U0001F3AC", "screen": "video", "say": "Videos is a program for watching. Press Play."},
                 {"id": "call", "label": "Call Grandma", "pic": "\U0001F4DE", "screen": "call", "say": "Call is a program for talking to people far away. Press Call."},
                 {"id": "search", "label": "Search", "pic": "\U0001F50E", "screen": "search", "say": "Search is a program for finding things out. Search for lions."},
             ],
              "then": {"ask": "One tablet ran six different programs. What does that tell you?",
                       "opts": [opt("A computer can run many different programs", True), opt("A tablet can only draw", False), opt("Every job needs a different computer", False)],
                       "why": "One computer, many programs: games, drawing, writing, videos, calls, search."}},
             "Six programs on one computer. A computer can run many."),

        step("sort", "Which program would you open?", "\U0001F4F1", "Program picker", ["1CS.02", "1CS.01"],
             "One tablet runs many programs. Which program would you open to do this job?",
             explain(
                 ["Each program on a computer does a different job."],
                 ["To draw a picture, open Paint.", "To write a story, open Writing.", "To play, open a game.", "To watch a film, open Videos."],
                 ["Children think you need a different tablet for each job.", "The same tablet runs them all. You just open a different program."],
                 ["Read the job, then tap the program."]),
             {"ask": "Which program?",
              "bins": [{"id": "paint", "label": "Paint", "pic": "\U0001F3A8"}, {"id": "write", "label": "Writing", "pic": "✏️"}, {"id": "game", "label": "A game", "pic": "⚽"}, {"id": "video", "label": "Videos", "pic": "\U0001F3AC"}],
              "items": [
                  {"pic": "\U0001F308", "label": "draw a rainbow", "bin": "paint", "why": "Drawing is Paint's job."},
                  {"pic": "✉️", "label": "type a letter to Grandma", "bin": "write", "why": "Typing words is the Writing program's job."},
                  {"pic": "\U0001F3C6", "label": "try to beat your best score", "bin": "game", "why": "A score to beat: that is a game."},
                  {"pic": "\U0001F981", "label": "watch a film about lions", "bin": "video", "why": "Watching a film is the job of Videos."},
                  {"pic": "\U0001F58D️", "label": "colour in a picture of a cat", "bin": "paint", "why": "Colouring in is Paint's job."},
                  {"pic": "\U0001F4DD", "label": "write your name and your age", "bin": "write", "why": "Writing words: the Writing program."},
                  {"pic": "\U0001F9E9", "label": "play a puzzle", "bin": "game", "why": "A puzzle you play is a game."},
                  {"pic": "\U0001F4FA", "label": "watch a cartoon", "bin": "video", "why": "Videos plays films and cartoons."},
              ]},
             "Four programs, one tablet, and a job for each."),

        step("io", "In and out", "\U0001F500", "In and out", ["1CS.03", "1CS.04"],
             "Information goes INTO a computer and comes OUT of it. Tap each device to see which way it goes.",
             explain(
                 ["A computer needs information put IN, and it gives information OUT."],
                 ["A keyboard puts letters in.", "A mouse puts your pointing in.", "A microphone puts your voice in.", "A camera puts a picture in.",
                  "A screen shows things out.", "A speaker plays sound out.", "A printer puts words out on paper."],
                 ["Children think a touchscreen is only for looking at.", "It is both: you tap it, information goes in; it shows things, information comes out."],
                 ["Tap every device and watch the arrow."]),
             {"need": 8, "devices": [
                 {"id": "keyboard", "pic": "⌨️", "label": "keyboard", "kind": "input", "does": "You press the keys and letters go into the computer.", "shows": "h e l l o", "sound": "type"},
                 {"id": "mouse", "pic": "\U0001F5B1️", "label": "mouse", "kind": "input", "does": "You move it and click, and your pointing goes in.", "shows": "\U0001F5B1️ click", "sound": "click"},
                 {"id": "touch", "pic": "\U0001F446", "label": "touchscreen", "kind": "input", "does": "You tap the screen and your tap goes in.", "shows": "\U0001F446 tap", "sound": "pop"},
                 {"id": "mic", "pic": "\U0001F3A4", "label": "microphone", "kind": "input", "does": "You speak and your voice goes in.", "shows": "\U0001F3B5 hello", "sound": "ding"},
                 {"id": "camera", "pic": "\U0001F4F7", "label": "camera", "kind": "input", "does": "It takes a picture and the picture goes in.", "shows": "\U0001F5BC️", "sound": "click"},
                 {"id": "screen", "pic": "\U0001F5A5️", "label": "screen", "kind": "output", "does": "The computer shows you words and pictures.", "shows": "\U0001F5BC️ hello", "sound": "pop"},
                 {"id": "speaker", "pic": "\U0001F50A", "label": "speaker", "kind": "output", "does": "The computer plays sound out loud.", "shows": "\U0001F3B5\U0001F3B6", "sound": "beep"},
                 {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "kind": "output", "does": "The computer prints words and pictures out on paper.", "shows": "\U0001F4C4", "sound": "print"},
             ]},
             "Inputs put information in. Outputs give information out."),

        step("sort", "Input, or output?", "\U0001F5C2️", "Input or output", ["1CS.03", "1CS.04"],
             "Does information go IN through it, or come OUT of it? Tap the bin.",
             explain(
                 ["An input device sends information INTO the computer.", "An output device brings information OUT of it."],
                 ["Keyboard, mouse, microphone, camera, buttons: in.", "Screen, speaker, printer, lights: out."],
                 ["Children guess from where the device sits.", "Ask: does the computer get something from it, or give something through it?"],
                 ["Ask which way the information goes, then tap."]),
             {"ask": "Input, or output?",
              "bins": [{"id": "input", "label": "Input", "pic": "⬇️"}, {"id": "output", "label": "Output", "pic": "⬆️"}],
              "items": [
                  {"pic": "⌨️", "label": "a keyboard", "bin": "input", "why": "Letters go in. Input."},
                  {"pic": "\U0001F5A5️", "label": "a screen", "bin": "output", "why": "Pictures and words come out. Output."},
                  {"pic": "\U0001F3A4", "label": "a microphone", "bin": "input", "why": "Your voice goes in. Input."},
                  {"pic": "\U0001F50A", "label": "a speaker", "bin": "output", "why": "Sound comes out. Output."},
                  {"pic": "\U0001F4F7", "label": "a camera", "bin": "input", "why": "A picture goes in. Input."},
                  {"pic": "\U0001F5A8️", "label": "a printer", "bin": "output", "why": "Words come out on paper. Output."},
                  {"pic": "\U0001F3AE", "label": "the buttons on a games controller", "bin": "input", "why": "Your button presses go in. Input."},
                  {"pic": "\U0001F4A1", "label": "the lights on a robot", "bin": "output", "why": "The computer switches the lights on to tell you something. Output."},
              ]},
             "In or out. Every device is one or the other, and a touchscreen is both."),

        step("sort", "Is there a computer inside?", "\U0001F50D", "Hidden computers", ["1CS.05"],
             "Lots of everyday things have a computer inside, controlling what they do. Does this one?",
             explain(
                 ["A computer does not have to look like a computer.", "Many everyday machines have a small one hidden inside, controlling them."],
                 ["A washing machine, a microwave, traffic lights, a car, a digital watch, a TV: computers inside.",
                  "A wooden spoon, a bicycle, a book, a ball, a candle, scissors: no computer at all."],
                 ["Children think anything with a plug has a computer.", "Ask: does something inside DECIDE what it does? A candle decides nothing."],
                 ["Ask: is something inside controlling it?"]),
             {"ask": "Is there a computer inside?",
              "bins": [{"id": "yes", "label": "Computer inside", "pic": "\U0001F4BB"}, {"id": "no", "label": "No computer", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F9FA", "label": "a washing machine", "bin": "yes", "why": "A computer inside controls fill, wash, spin, drain."},
                  {"pic": "\U0001F944", "label": "a wooden spoon", "bin": "no", "why": "A spoon has nothing inside. No computer."},
                  {"pic": "\U0001F6A6", "label": "traffic lights", "bin": "yes", "why": "A computer controls when each light changes."},
                  {"pic": "\U0001F6B2", "label": "a bicycle", "bin": "no", "why": "You are the control. No computer."},
                  {"pic": "\U0001F697", "label": "a car", "bin": "yes", "why": "A car has many computers inside, controlling the engine and more."},
                  {"pic": "\U0001F4D6", "label": "a book", "bin": "no", "why": "Paper and words. No computer."},
                  {"pic": "⌚", "label": "a digital watch", "bin": "yes", "why": "A tiny computer counts the seconds."},
                  {"pic": "⚽", "label": "a ball", "bin": "no", "why": "A ball decides nothing. No computer."},
                  {"pic": "\U0001F4FA", "label": "a TV", "bin": "yes", "why": "A computer inside picks the channel and draws the picture."},
                  {"pic": "\U0001F56F️", "label": "a candle", "bin": "no", "why": "A flame and wax. No computer."},
                  {"pic": "\U0001F373", "label": "a microwave", "bin": "yes", "why": "A computer counts the time and controls the heat."},
                  {"pic": "✂️", "label": "scissors", "bin": "no", "why": "Two blades. No computer."},
              ]},
             "Computers hide inside washing machines, cars and watches, controlling what they do."),

        step("explore", "What is a robot?", "\U0001F916", "Robot finder", ["1CS.06"],
             "A robot is a machine with a computer inside that can be programmed to move and do jobs. Tap each robot.",
             explain(
                 ["A robot is a machine with a computer inside, programmed to move and do a job."],
                 ["A factory robot arm builds cars.", "A robot vacuum cleans the floor.", "A rover drives about on Mars.",
                  "A delivery robot carries medicines round a hospital.", "A warehouse robot fetches parcels."],
                 ["Children think robots all look like people.", "Most look like arms, boxes or cars. It is what is INSIDE and what it DOES that makes it a robot."],
                 ["Tap each one and hear its job and where it works."]),
             {"items": [
                 {"pic": "\U0001F9BE", "label": "a factory robot arm", "say": "A robot arm in a factory. It is programmed to weld and lift, and it builds cars all day."},
                 {"pic": "\U0001F916", "label": "a robot vacuum", "say": "A robot vacuum at home. Its program steers it round the floor and back to its charger."},
                 {"pic": "\U0001F699", "label": "a Mars rover", "say": "A rover on Mars. Programmed to drive, take pictures and dig, millions of miles away from anyone."},
                 {"pic": "\U0001F3E5", "label": "a hospital delivery robot", "say": "A delivery robot in a hospital, carrying medicines along the corridors to the right ward."},
                 {"pic": "\U0001F4E6", "label": "a warehouse robot", "say": "A warehouse robot, fetching parcels from tall shelves so they can be posted."},
                 {"pic": "\U0001F30A", "label": "an underwater robot", "say": "An underwater robot, exploring the deep sea where people cannot go."},
             ], "need": 6,
              "then": {"ask": "What is a robot?",
                       "opts": [opt("A machine with a computer inside, programmed to move and do jobs", True), opt("A person in a metal costume", False), opt("Any machine with a plug", False)],
                       "why": "A robot is a machine with a computer inside, programmed to move and do a job."}},
             "Robots work in factories, homes, hospitals, warehouses, under the sea and on Mars."),

        step("sort", "Robot, or not?", "\U0001F5C2️", "Robot judge", ["1CS.06"],
             "A robot moves and does a job because a computer inside tells it to. Is this a robot?",
             explain(
                 ["Robot or not: does it have a computer inside, and does it move to do a job?"],
                 ["A robot arm, a robot vacuum, a rover, a delivery robot: robots.",
                  "A teddy bear, a toaster, a bicycle, a broom: not robots. Nothing inside decides how they move."],
                 ["Children think anything that moves is a robot.", "A bicycle moves because YOU pedal it."],
                 ["Ask: is a computer inside making it move and do a job?"]),
             {"ask": "Robot, or not?",
              "bins": [{"id": "robot", "label": "A robot", "pic": "\U0001F916"}, {"id": "not", "label": "Not a robot", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F9BE", "label": "a factory robot arm", "bin": "robot", "why": "A computer inside programs how it moves and builds. A robot."},
                  {"pic": "\U0001F9F8", "label": "a teddy bear", "bin": "not", "why": "Soft and cuddly, but nothing inside moves it. Not a robot."},
                  {"pic": "\U0001F916", "label": "a robot vacuum", "bin": "robot", "why": "Its computer steers it round the floor. A robot."},
                  {"pic": "\U0001F35E", "label": "a toaster", "bin": "not", "why": "A toaster warms bread, but it does not move about. Not a robot."},
                  {"pic": "\U0001F699", "label": "a Mars rover", "bin": "robot", "why": "Programmed to drive and dig on Mars. A robot."},
                  {"pic": "\U0001F6B2", "label": "a bicycle", "bin": "not", "why": "It moves because you pedal. Not a robot."},
                  {"pic": "\U0001F4E6", "label": "a delivery robot", "bin": "robot", "why": "Its computer takes it to the right place with the parcel. A robot."},
                  {"pic": "\U0001F9F9", "label": "a broom", "bin": "not", "why": "A stick and bristles. You do the moving. Not a robot."},
              ]},
             "A robot has a computer inside that makes it move and do a job."),

        step("context", "Computers at work", "\U0001F477", "Computers at work", ["1CS.01", "1CS.05"],
             "People use computer systems in all sorts of jobs. Tap each one.",
             explain(
                 ["Grown-ups use computer systems at work, often to control big machines."],
                 ["A doctor's scanner is a computer that looks inside you.", "A pilot's cockpit is full of computers helping to fly the plane.",
                  "A farmer's tractor has a computer that steers it straight.", "A shop till is a computer that adds up the shopping."],
                 [],
                 ["Tap each one and hear what the computer controls."]),
             {"items": [
                 {"pic": "\U0001F3E5", "label": "a doctor's scanner", "say": "A scanner in a hospital is a computer system. It takes pictures of the inside of your body and shows them to the doctor."},
                 {"pic": "✈️", "label": "a pilot's cockpit", "say": "A pilot's cockpit is full of computers. They help fly the plane and keep it safe."},
                 {"pic": "\U0001F69C", "label": "a farmer's tractor", "say": "A modern tractor has a computer that steers it in a straight line across the field."},
                 {"pic": "\U0001F6D2", "label": "a shop till", "say": "A shop till is a computer. It reads each thing you buy and adds up the money."},
             ], "need": 4,
              "then": {"ask": "A pilot uses the cockpit computers to...",
                       "opts": [opt("Help fly the plane safely", True), opt("Watch films", False), opt("Draw pictures", False)],
                       "why": "In a cockpit the computers control and check the plane. That is a computer controlling a machine."}},
             "Doctors, pilots, farmers and shops all use computer systems."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1CS.01", "1CS.02", "1CS.03", "1CS.04", "1CS.05", "1CS.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the five jobs, the six programs, in and out, hidden computers and robots."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Video calling Grandma is a computer being used for...", "\U0001F4DE", "communication", ["controlling a machine", "cooking", "sleeping"], "Talking to people is communication."),
                 q("Can one computer run many different programs?", "\U0001F4F1", "yes: games, drawing, writing, videos and more", ["no, one program each", "only two", "only games"], "One tablet ran six programs. A computer can run many."),
                 q("Which of these is an INPUT?", "⬇️", "a keyboard", ["a screen", "a printer", "a speaker"], "Letters go in through a keyboard. Input."),
                 q("Which of these is an OUTPUT?", "⬆️", "a printer", ["a mouse", "a microphone", "a camera"], "Words come out on paper. Output."),
                 q("Which of these has a computer inside, controlling it?", "\U0001F4BB", "a washing machine", ["a wooden spoon", "a candle", "a book"], "A computer inside a washing machine controls fill, wash and spin."),
                 q("What is a robot?", "\U0001F916", "a machine with a computer inside, programmed to move and do a job", ["any toy", "a person in a costume", "a very fast bicycle"], "Computer inside, programmed to move and do a job."),
                 q("Where might you find a robot?", "\U0001F3ED", "in a factory, building cars", ["inside a candle", "in a book", "nowhere; robots are only in films"], "Robots work in factories, hospitals, warehouses and even on Mars."),
                 q("A touchscreen is...", "\U0001F446", "both an input and an output", ["only an input", "only an output", "neither"], "You tap it (in) and it shows you things (out)."),
             ]},
             "That is the whole lesson finished. You know what computers are for, and where they hide."),
    ],
}


LESSON["about"] = [
    "Say the different jobs computers do: communication, entertainment, creativity, research and controlling machines.",
    "Say that one computer can run many different programs.",
    "Tell an input from an output.",
    "Spot the computers hiding inside everyday things, and say what a robot is.",
]

LESSON["lecture"] = [
    part("\U0001F4BB", "What computers are for",
         "People use computers for very different things. Talking to Grandma far away. Watching a film. Drawing a picture. Finding out about lions. And controlling machines, like the computer inside a washing machine."),
    part("\U0001F4F1", "Many programs",
         "One tablet can run many programs. A paint program, a game, a writing program, videos, a call, a search. Each program does a different job on the same machine."),
    part("\U0001F500", "In and out",
         "Information goes into a computer through inputs: a keyboard, a mouse, a microphone, a camera, a touch on the screen. It comes out through outputs: the screen, a speaker, a printer, lights."),
    part("\U0001F50D", "Hidden computers",
         "A computer does not have to look like one. A washing machine, a microwave, traffic lights, a car and a watch all have a small computer inside, controlling what they do. A spoon, a book and a candle have none."),
    part("\U0001F916", "Robots",
         "A robot is a machine with a computer inside, programmed to move and do a job. A robot arm builds cars. A robot vacuum cleans floors. A rover drives on Mars. Most robots do not look like people at all."),
]

LESSON["words"] = [
    word("computer", "\U0001F4BB", "A machine that runs programs.",
         ["A tablet is a computer.", "There is a computer inside the car."]),
    word("program", "▶️", "Code a computer runs to do a job.",
         ["Paint is a program.", "The tablet runs many programs."]),
    word("app", "\U0001F4F1", "A program on a phone or a tablet.",
         ["Open the drawing app.", "An app is a program."]),
    word("input", "⬇️", "A way of putting information into a computer.",
         ["A keyboard is an input.", "Your voice goes in through a microphone."]),
    word("output", "⬆️", "A way a computer gives information out.",
         ["A screen is an output.", "The printer is an output."]),
    word("robot", "\U0001F916", "A machine with a computer inside, programmed to move and do a job.",
         ["The robot arm builds cars.", "A robot vacuum cleans the floor."]),
    word("device", "\U0001F4DF", "A machine, usually with a computer inside.",
         ["A phone is a device.", "Connect the device to the router."]),
    word("control", "\U0001F39B️", "To decide what a machine does.",
         ["The computer controls the washing machine.", "Traffic lights are controlled by a computer."]),
]

LESSON["home"] = [
    home("Computer hunt", "A walk round the house with a grown-up",
         ["Find five things with a computer hidden inside: a washing machine, a microwave, a watch, a TV, a car.",
          "For each one, say what the computer controls.",
          "Find five things with no computer at all."],
         "Did anything surprise you? A kettle with buttons might have one; a kettle with a switch does not."),
    home("Inputs and outputs", "A phone or tablet, with a grown-up",
         ["Find every INPUT: the screen you tap, the microphone, the camera, the buttons.",
          "Find every OUTPUT: the screen, the speaker, the little light.",
          "Which one is BOTH?"],
         "The screen is an input when you tap it and an output when it shows you something."),
    home("Robot or not", "Paper and crayons",
         ["Draw a robot doing a job: cleaning, building, exploring.",
          "Say what its computer tells it to do, step by step.",
          "Draw something that moves but is NOT a robot."],
         "A bicycle moves because you pedal it. A robot moves because its program says so."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you built a network and found out that the internet is many computers joined around the world."
LESSON["warmup"] = [
    q("What makes a robot move and do its job?", "\U0001F916", "a computer inside it, following a program", ["a battery all on its own", "magic", "a person hiding inside"], "A computer inside tells a robot what to do."),
    q("A keyboard puts letters into a computer. A screen shows things...", "\U0001F5A5️", "out of the computer", ["into the computer", "under the computer", "nowhere"], "Information goes in through a keyboard and comes out on a screen."),
]
