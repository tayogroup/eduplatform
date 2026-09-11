# -*- coding: utf-8 -*-
"""Lesson 14 - Machines, Things and Robots.

0059 Stage 3 Computer Systems: 3CS.05 computers can be programmed to control
machines and other physical objects; 3CS.06 common 'Internet of Things'
devices in a familiar environment; 3CS.07 the role of robots in
manufacturing.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "machines-things-and-robots",
    "title": "Machines, Things and Robots",
    "blurb": "Find the computers hidden inside machines, meet the everyday things that talk to the internet, and follow a robot down a car factory line.",
    "steps": [
        step("sort", "Is a program controlling it?", "\U0001F5C2️", "Control sorter", ["3CS.05"],
             "Some machines are controlled by a program inside them. Some are just mechanical. Which is this?",
             explain(
                 ["A program controls a machine when a small computer inside decides what the machine does: when to turn, stop, heat, open."],
                 ["A washing machine: a program runs the cycle.", "A bicycle: no computer; your legs do it all.",
                  "Traffic lights: a program times the colours.", "A hand whisk: mechanical, no program."],
                 ["Children think every machine with a plug has a program.", "An old kettle just heats until a spring clicks. No program. A modern one with a temperature setting has one."],
                 ["Read, decide, tap."]),
             {"ask": "Controlled by a program, or not?",
              "bins": [{"id": "prog", "label": "A program controls it", "pic": "\U0001F4BB"}, {"id": "no", "label": "No program", "pic": "\U0001F527"}],
              "items": [
                  {"pic": "\U0001F9FA", "label": "a washing machine running a cycle", "bin": "prog", "why": "A program turns, fills, heats and spins."},
                  {"pic": "\U0001F6B2", "label": "a bicycle", "bin": "no", "why": "Legs and chains. No computer."},
                  {"pic": "\U0001F6A6", "label": "traffic lights", "bin": "prog", "why": "A program times the colours."},
                  {"pic": "\U0001F944", "label": "a hand whisk", "bin": "no", "why": "You turn the handle. Mechanical."},
                  {"pic": "\U0001F3E2", "label": "a lift", "bin": "prog", "why": "A program takes it to the floor you press."},
                  {"pic": "✂️", "label": "scissors", "bin": "no", "why": "No computer inside."},
                  {"pic": "\U0001F6AA", "label": "an automatic door", "bin": "prog", "why": "A sensor and a program open it."},
                  {"pic": "\U0001F9F9", "label": "a broom", "bin": "no", "why": "Just a broom."},
              ]},
             "A program inside, or not."),

        step("explore", "The Internet of Things", "\U0001F310", "Things spotter", ["3CS.06"],
             "Some everyday things have a computer inside AND talk to the internet. That is the Internet of Things. Tap each one.",
             explain(
                 ["An Internet of Things device is an ordinary thing - a bulb, a doorbell, a thermostat - with a small computer in it that connects to the internet."],
                 ["A smart bulb: switch it on from your phone, even from another town.", "A smart doorbell: see who is at the door from anywhere.",
                  "A smart thermostat: the heating knows when you are coming home.", "A smart speaker: asks the internet your question."],
                 ["Children think 'smart' means clever.", "It means connected. A smart bulb is not clever; it is a bulb that listens to the network."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "smart bulb", "say": "A smart bulb. A light with a tiny computer inside, connected to the internet. Switch it on from your phone, even from another town."},
                 {"pic": "\U0001F6CE️", "label": "smart doorbell", "say": "A smart doorbell. It has a camera and a connection. Someone rings, and your phone shows who it is, wherever you are."},
                 {"pic": "\U0001F321️", "label": "smart thermostat", "say": "A smart thermostat. It controls the heating and talks to the internet, so the house can be warm when you get home."},
                 {"pic": "\U0001F50A", "label": "smart speaker", "say": "A smart speaker. Ask it a question and it sends the question over the internet and speaks the answer back."},
                 {"pic": "⌚", "label": "smart watch", "say": "A smart watch. It counts your steps and sends them to your phone and the internet."},
                 {"pic": "\U0001F50C", "label": "smart plug", "say": "A smart plug. Any lamp plugged into it can be switched on and off from a phone, or on a timer."},
             ], "need": 6,
              "then": {"ask": "What makes a bulb an Internet of Things device?",
                       "opts": [opt("A small computer inside it that connects to the internet", True), opt("It is very bright", False), opt("It is expensive", False)],
                       "why": "Things plus computer plus internet: the Internet of Things."}},
             "Ordinary things, connected."),

        step("sort", "Internet of Things, or not?", "\U0001F5C2️", "IoT sorter", ["3CS.06"],
             "Does this thing have a computer inside that connects to the internet?",
             explain(
                 ["IoT: a thing with a computer that connects. Not IoT: no computer, or a computer that does not connect."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Internet of Things, or not?",
              "bins": [{"id": "iot", "label": "Internet of Things", "pic": "\U0001F310"}, {"id": "no", "label": "Not connected", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F4A1", "label": "a smart bulb you switch on from your phone", "bin": "iot", "why": "Connected thing."},
                  {"pic": "\U0001F56F️", "label": "a candle", "bin": "no", "why": "No computer, no connection."},
                  {"pic": "\U0001F6CE️", "label": "a doorbell that shows the visitor on your phone", "bin": "iot", "why": "Camera, computer, connection."},
                  {"pic": "\U0001F514", "label": "an old doorbell that just rings", "bin": "no", "why": "A bell and a wire. No computer."},
                  {"pic": "\U0001F321️", "label": "a thermostat you set from anywhere", "bin": "iot", "why": "Connected."},
                  {"pic": "\U0001F4DF", "label": "a pocket calculator", "bin": "no", "why": "A computer, but it does not connect."},
                  {"pic": "\U0001F50C", "label": "a plug you switch on from your phone", "bin": "iot", "why": "A smart plug is connected."},
                  {"pic": "\U0001F9F8", "label": "a teddy bear", "bin": "no", "why": "No computer inside."},
              ]},
             "Connected things are the Internet of Things."),

        step("order", "A robot builds a car", "\U0001F3ED", "Line orderer", ["3CS.07"],
             "In a car factory, robots do the same steps on every car. Put the steps of the line in order.",
             explain(
                 ["Manufacturing means making things in a factory.", "Robots do the steps that are heavy, exact, dangerous or the same ten thousand times a day."],
                 ["Weld the body, paint it, fit the engine, fit the doors, fit the wheels, test it.", "A welding robot makes the same perfect weld on every car and never gets tired."],
                 ["Children think a robot builds the whole car alone.", "A line of robots each does one step, and people check, program and fix them."],
                 ["Tap what comes first."]),
             {"items": [
                 s("weld", "Robots weld the metal body together", "\U0001F9BE"),
                 s("paint", "A robot paints the body", "\U0001F3A8"),
                 s("engine", "A robot lifts the engine in", "⚙️"),
                 s("doors", "Robots fit the doors", "\U0001F6AA"),
                 s("wheels", "A robot fits the wheels", "\U0001F697"),
                 s("test", "People test the finished car", "✅"),
             ]},
             "Six steps down the line, most of them by robots."),

        step("explore", "Why robots?", "\U0001F916", "Robot reasoner", ["3CS.07"],
             "Why do factories use robots for these jobs? Tap each reason.",
             explain(
                 ["Robots in manufacturing do jobs that are exact, heavy, dangerous or repeated all day."],
                 ["Exact: the same weld, to the millimetre, every time.", "Heavy: an engine weighs more than a person can lift.",
                  "Dangerous: paint fumes and hot metal are safer for a robot.", "Repeated: ten thousand times a day, without getting tired or bored.",
                  "And people are still there: programming the robots, checking the cars, fixing what goes wrong."],
                 ["Children think robots took all the jobs.", "They took the heavy, dangerous and repeated ones. The people program and check."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F3AF", "label": "exact", "say": "Exact. A welding robot puts every weld in the same place to the millimetre, on every car."},
                 {"pic": "\U0001F3CB️", "label": "heavy", "say": "Heavy. An engine is too heavy for a person to lift. A robot arm lifts it in."},
                 {"pic": "⚠️", "label": "dangerous", "say": "Dangerous. Paint fumes, hot metal, sparks. Safer for a robot than a person."},
                 {"pic": "\U0001F501", "label": "repeated", "say": "Repeated. The same step ten thousand times a day. A robot does not get tired or bored, and does not make the mistake that tiredness makes."},
                 {"pic": "\U0001F469‍\U0001F527", "label": "and the people", "say": "And the people. Someone programs each robot, checks every car, and fixes a robot that goes wrong. Robots do the steps; people run the factory."},
             ], "need": 5,
              "then": {"ask": "Which job on the car line is best done by a robot?",
                       "opts": [opt("Lifting the engine in, the same way on every car", True), opt("Deciding what colour cars people will want next year", False), opt("Talking to a customer", False)],
                       "why": "Heavy, exact and repeated: a robot's job. Deciding and talking: people's."}},
             "Exact, heavy, dangerous, repeated."),

        step("context", "A robot is a controlled machine", "\U0001F916", "Robot connector", ["3CS.05", "3CS.07"],
             "A factory robot is a machine controlled by a program: the same idea as Bitsy's motor, much bigger. Tap each part.",
             explain(
                 ["A robot arm has motors (outputs), sensors (inputs) and a program that decides.", "It is a computer controlling a physical object, exactly like the automatic door."],
                 [],
                 [],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F4BB", "label": "the program", "say": "The program. Written by a person, it says: move here, close the gripper, weld, move back. Every step, every car."},
                 {"pic": "⚙️", "label": "the motors", "say": "The motors. Outputs. They move the arm to where the program says."},
                 {"pic": "\U0001F441️", "label": "the sensors", "say": "The sensors. Inputs. They tell the program where the arm is and whether the part is in place."},
                 {"pic": "\U0001F6D1", "label": "the stop button", "say": "The stop button. An input a person presses. Safety first: it stops every motor at once."},
             ], "need": 4,
              "then": {"ask": "What decides what a factory robot does next?",
                       "opts": [opt("Its program", True), opt("It decides for itself, like a person", False), opt("Luck", False)],
                       "why": "A robot is a machine controlled by a program."}},
             "Program, motors, sensors: a controlled machine."),

        step("questions", "Check: machines and things", "\U0001F4DD", "Machine checker", ["3CS.05", "3CS.06", "3CS.07"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Controlled machines, connected things, factory robots."], [], ["Read, think, tap."]),
             {"items": [
                 q("Which machine is controlled by a program?", "\U0001F9FA", "a washing machine", ["a bicycle", "a broom", "scissors"], "A program runs the cycle."),
                 q("A smart bulb is an Internet of Things device because...", "\U0001F4A1", "it has a computer inside that connects to the internet", ["it is bright", "it is round", "it is new"], "Thing plus computer plus internet."),
                 q("Why does a factory use a robot to weld?", "\U0001F9BE", "it is exact and can repeat the same weld all day", ["robots are cheap toys", "people cannot weld", "it is fun"], "Exact and repeated: a robot's job."),
             ]},
             "Controlled, connected, manufacturing."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CS.05", "3CS.06", "3CS.07"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about controlled machines, the Internet of Things and robots in factories."], [], ["Read, look, tap."]),
             {"items": [
                 q("A lift going to floor 3 when you press 3 is...", "\U0001F3E2", "a machine controlled by a program", ["magic", "a person pulling", "a network"], "A program moves it."),
                 q("Which has NO program inside?", "\U0001F527", "a hand whisk", ["traffic lights", "a washing machine", "an automatic door"], "Mechanical only."),
                 q("What does 'smart' mean in 'smart plug'?", "\U0001F50C", "connected to the internet, with a computer inside", ["clever", "expensive", "small"], "Smart means connected."),
                 q("Which is an Internet of Things device?", "\U0001F310", "a doorbell that shows the visitor on your phone", ["a candle", "a teddy bear", "an old bell on a wire"], "Computer inside, connected."),
                 q("Manufacturing means...", "\U0001F3ED", "making things in a factory", ["driving a car", "shopping", "a kind of robot"], "Making things."),
                 q("Which job on the car line is a person's?", "\U0001F469‍\U0001F527", "programming and checking the robots", ["welding every car by hand", "lifting the engine", "painting in the fumes"], "People program, check and fix."),
                 q("A factory robot's motors are its...", "⚙️", "outputs", ["inputs", "program", "network"], "Motors move: output."),
                 q("Why is painting a job for a robot?", "\U0001F3A8", "the fumes are dangerous for a person and the robot paints evenly", ["robots like colours", "people cannot paint", "paint is heavy"], "Dangerous and exact."),
             ]},
             "That is the whole lesson finished. You know the machines a program controls, the things that connect, and the robots that build."),
    ],
}


LESSON["about"] = [
    "Say which machines are controlled by a program inside them.",
    "Spot Internet of Things devices at home.",
    "Explain what robots do in a factory, and why.",
    "Describe a robot as a machine controlled by a program: sensors in, motors out.",
]

LESSON["lecture"] = [
    part("\U0001F4BB", "Programs control machines",
         "A washing machine, traffic lights, a lift, an automatic door: inside each is a small computer following a program that decides when to turn, stop, heat or open. A bicycle, a whisk and a broom have no program. The difference is whether a computer is deciding."),
    part("\U0001F310", "The Internet of Things",
         "An ordinary thing - a bulb, a doorbell, a thermostat, a plug - with a small computer inside that connects to the internet is an Internet of Things device. Smart does not mean clever; it means connected. You can switch the bulb on from another town."),
    part("\U0001F3ED", "Robots in manufacturing",
         "In a car factory, robots weld, paint, lift the engine in, fit the doors and the wheels. They do the jobs that are exact, heavy, dangerous or repeated ten thousand times a day, and they do them the same every time."),
    part("\U0001F469‍\U0001F527", "And the people",
         "Robots do not run the factory. People program them, test every car, and fix a robot that goes wrong. A factory robot is a computer controlling a machine: sensors are its inputs, motors are its outputs, and its program decides."),
]

LESSON["words"] = [
    word("control", "\U0001F3AE", "To decide what a machine does, by a program.",
         ["A program controls the lift.", "Computers control machines."]),
    word("Internet of Things", "\U0001F310", "Everyday things with a computer inside that connect to the internet.",
         ["A smart bulb is part of the Internet of Things.", "The Internet of Things is growing."]),
    word("smart", "\U0001F4A1", "Connected to the internet, with a computer inside.",
         ["A smart doorbell.", "Smart means connected, not clever."]),
    word("manufacturing", "\U0001F3ED", "Making things in a factory.",
         ["Robots are used in manufacturing.", "Car manufacturing uses welding robots."]),
    word("robot", "\U0001F916", "A machine with a program that controls its motors, using its sensors.",
         ["A factory robot welds.", "A robot's program decides its moves."]),
]

LESSON["home"] = [
    home("Program or not?", "A walk round the house",
         ["Find ten machines. For each, ask: is a program deciding what it does?",
          "Sort them into two groups.",
          "Which group is bigger?"],
         "More things have a program inside than you think."),
    home("Connected things", "A grown-up",
         ["Does your home have anything smart: a speaker, a bulb, a plug, a doorbell, a watch?",
          "For each, say what it sends to the internet and what it gets back.",
          "What would happen to it if the internet went off?"],
         "Smart means connected."),
    home("A factory line at home", "Paper, scissors, glue, crayons, a partner",
         ["Make a paper car: fold, cut, colour, stick, draw wheels.",
          "One person does each step, the same way every time, for five cars.",
          "Which step would a robot do best? Which needs a person?"],
         "Exact, heavy, dangerous, repeated: a robot's jobs."),
]
