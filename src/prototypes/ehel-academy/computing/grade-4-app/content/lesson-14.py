# -*- coding: utf-8 -*-
"""Lesson 14 - Computer Scientists and Service Robots.

0059 Stage 4 Computer Systems: 4CS.06 the role of computer scientists in a
range of industries; 4CS.07 the role of robots in service industries,
including delivery, public transport and health care; 4CS.01 where control
systems are used.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "computer-scientists-and-service-robots",
    "title": "Computer Scientists and Service Robots",
    "blurb": "Meet computer scientists at work in hospitals, farms, banks, games studios and weather stations, and the service robots that deliver parcels, drive trains and help in hospitals, each one a control system.",
    "steps": [
        step("explore", "Computer scientists at work", "\U0001F469\U0001F4BB", "Scientist spotter", ["4CS.06"],
             "A <b>computer scientist</b> designs the programs and systems that other people rely on. They work in almost every industry. Tap each one.",
             explain(
                 ["A computer scientist studies how computers solve problems, then builds the programs that do it. Every industry has problems to solve."],
                 ["In a hospital: the system that keeps patient records safe and finds them in a second.", "On a farm: the program that waters each field only when the soil sensor says it is dry.",
                  "In a bank: the encryption that keeps money safe.", "In a games studio: the game itself.", "At a weather station: the model that turns a million readings into tomorrow's forecast."],
                 ["Children think computer scientists only work at computer companies.", "They work wherever there is a problem a program can solve, which is everywhere."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "\U0001F3E5", "label": "in a hospital", "say": "In a hospital. A computer scientist builds the system that keeps every patient's record safe, and shows a doctor the right one in a second."},
                 {"pic": "\U0001F33E", "label": "on a farm", "say": "On a farm. A computer scientist writes the program that reads soil sensors and waters each field only when it is dry, saving water."},
                 {"pic": "\U0001F3E6", "label": "in a bank", "say": "In a bank. A computer scientist designs the encryption and the checks that keep money safe when it moves."},
                 {"pic": "\U0001F3AE", "label": "in a games studio", "say": "In a games studio. Computer scientists write the game: the physics, the characters, the way it reacts to every press."},
                 {"pic": "\U0001F326️", "label": "at a weather station", "say": "At a weather station. A computer scientist builds the model that turns millions of readings into tomorrow's forecast."},
                 {"pic": "\U0001F697", "label": "in a car company", "say": "In a car company. Computer scientists write the programs that help a car brake in time, park itself, and, in some cities already, drive itself."},
             ], "need": 6,
              "then": {"ask": "What does a computer scientist do in an industry?",
                       "opts": [opt("Designs the programs and systems that solve that industry's problems", True), opt("Mends the keyboards", False), opt("Sells computers", False)],
                       "why": "Wherever a problem can be solved with a program, a computer scientist builds it."}},
             "Programs solve problems in every industry."),

        step("sort", "Which industry needs this?", "\U0001F5C2️", "Industry matcher", ["4CS.06"],
             "A computer scientist built this. Which industry was it for?",
             explain(
                 ["Match the program to the problem it solves, and the problem to the industry."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Which industry?",
              "bins": [{"id": "health", "label": "Health care", "pic": "\U0001F3E5"}, {"id": "farm", "label": "Farming", "pic": "\U0001F33E"}, {"id": "bank", "label": "Banking", "pic": "\U0001F3E6"}, {"id": "games", "label": "Games", "pic": "\U0001F3AE"}],
              "items": [
                  {"pic": "\U0001F4CB", "label": "a system that finds a patient's record in a second", "bin": "health", "why": "Hospitals need records fast."},
                  {"pic": "\U0001F4A7", "label": "a program that waters a field when the soil is dry", "bin": "farm", "why": "Soil sensors and water."},
                  {"pic": "\U0001F512", "label": "encryption that protects money as it moves", "bin": "bank", "why": "Money must travel safely."},
                  {"pic": "\U0001F3C3", "label": "the code that makes a character jump when you press A", "bin": "games", "why": "A game reacting to input."},
                  {"pic": "\U0001FA7A", "label": "software that spots a broken bone in an X-ray", "bin": "health", "why": "Helping doctors see."},
                  {"pic": "\U0001F69C", "label": "a tractor that steers itself along straight rows", "bin": "farm", "why": "A control system on a farm."},
                  {"pic": "\U0001F4B3", "label": "the check that spots a stolen card being used", "bin": "bank", "why": "Protecting accounts."},
                  {"pic": "\U0001F3AD", "label": "the program that makes the enemy in a game hide and chase", "bin": "games", "why": "Game behaviour."},
              ]},
             "Every industry has a program behind it."),

        step("explore", "Service robots", "\U0001F916", "Robot spotter", ["4CS.07"],
             "A <b>service robot</b> does a job for people: delivering, driving, helping in a hospital. Tap each one to see it work.",
             explain(
                 ["A service robot is a robot that works in a service industry: delivery, transport, health care, hotels, cleaning."],
                 ["A delivery robot rolls along the pavement with your shopping and stops at your door.", "A driverless train runs the airport shuttle.",
                  "A hospital robot carries medicines from the pharmacy to the ward.", "A surgical robot holds instruments steadier than any hand."],
                 ["Children think robots look like people.", "Most look like boxes on wheels, arms, or trains. A robot is a machine a program controls."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "\U0001F4E6", "label": "a delivery robot", "sub": "delivery", "say": "A delivery robot. A box on six wheels that rolls along the pavement with your shopping, crosses at the lights, and stops at your door."},
                 {"pic": "\U0001F681", "label": "a delivery drone", "sub": "delivery", "say": "A delivery drone. It flies a parcel to a place a van cannot reach quickly: an island, a farm, a village up a mountain."},
                 {"pic": "\U0001F686", "label": "a driverless train", "sub": "public transport", "say": "A driverless train. The airport shuttle and some city metros have no driver: a control system runs, stops and opens the doors."},
                 {"pic": "\U0001F68C", "label": "a self-driving shuttle bus", "sub": "public transport", "say": "A self-driving shuttle bus. Cameras and sensors see the road; a program steers slowly along a fixed route."},
                 {"pic": "\U0001F48A", "label": "a hospital delivery robot", "sub": "health care", "say": "A hospital robot. It carries medicines and clean sheets from the store to the ward, calling the lift by itself."},
                 {"pic": "\U0001FA7A", "label": "a surgical robot", "sub": "health care", "say": "A surgical robot. A surgeon controls arms that hold tiny instruments steadier than any hand, through a cut the size of a keyhole."},
             ], "need": 6,
              "then": {"ask": "What makes all of these robots?",
                       "opts": [opt("A program controls the machine, using sensors to see and motors to act", True), opt("They look like people", False), opt("They are all on wheels", False)],
                       "why": "A robot is a machine controlled by a program. Its shape depends on its job."}},
             "Delivery, transport, health care: robots that serve."),

        step("sort", "Delivery, transport, or health care?", "\U0001F5C2️", "Robot sorter", ["4CS.07"],
             "Which service industry is this robot working in?",
             explain(
                 ["Delivery: it brings things. Public transport: it moves people. Health care: it helps in a hospital or a clinic."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Delivery, public transport, or health care?",
              "bins": [{"id": "del", "label": "Delivery", "pic": "\U0001F4E6"}, {"id": "trans", "label": "Public transport", "pic": "\U0001F686"}, {"id": "health", "label": "Health care", "pic": "\U0001F3E5"}],
              "items": [
                  {"pic": "\U0001F4E6", "label": "a robot brings a pizza to the door", "bin": "del", "why": "Bringing things."},
                  {"pic": "\U0001F686", "label": "a train with no driver runs between airport terminals", "bin": "trans", "why": "Moving people."},
                  {"pic": "\U0001F48A", "label": "a robot carries medicines to the ward", "bin": "health", "why": "In a hospital."},
                  {"pic": "\U0001F681", "label": "a drone flies a parcel to an island", "bin": "del", "why": "Bringing things."},
                  {"pic": "\U0001FA7A", "label": "robot arms help a surgeon operate", "bin": "health", "why": "In an operating theatre."},
                  {"pic": "\U0001F68C", "label": "a self-driving shuttle carries passengers round a park", "bin": "trans", "why": "Moving people."},
                  {"pic": "\U0001F9F9", "label": "a robot disinfects a hospital room with light", "bin": "health", "why": "Keeping patients safe."},
                  {"pic": "\U0001F3EC", "label": "a warehouse robot fetches your order for posting", "bin": "del", "why": "Part of getting things to you."},
              ]},
             "Three service industries, robots in each."),

        step("context", "A robot is a control system", "\U0001F39B️", "Robot connector", ["4CS.01", "4CS.07"],
             "Every service robot is a control system: sensors in, a program that decides, motors out. Tap each part of the delivery robot.",
             explain(
                 ["Remember the control system from Bitsy: sense, decide, act. A delivery robot is a big one, with a computer scientist's program in the middle."],
                 ["Cameras and a distance sensor see the pavement and the people.", "The program decides: slow down, stop, turn, cross now.", "Motors on the wheels act."],
                 [],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F4F7", "label": "sensors: cameras and distance sensors", "say": "Sensors. Cameras see the pavement, a distance sensor feels how close a person is, and a satellite receiver knows where the robot is."},
                 {"pic": "\U0001F9E0", "label": "the program decides", "say": "The program decides. If a person is close, stop. If the crossing light is green, cross. If the door is reached, open the lid. A computer scientist wrote every rule."},
                 {"pic": "⚙️", "label": "outputs: motors, lights, a lid", "say": "Outputs. Motors turn the wheels, lights show it is about to move, and the lid unlocks when the right person arrives."},
                 {"pic": "\U0001F501", "label": "a forever loop", "say": "A forever loop. Sense, decide, act, again and again, many times a second, until the delivery is done."},
             ], "need": 4,
              "then": {"ask": "A delivery robot stops when someone steps in front of it. Which part of the control system made that happen?",
                       "opts": [opt("A sensor saw the person, the program decided to stop, the motors stopped", True), opt("The person pressed a button on it", False), opt("A driver inside stopped it", False)],
                       "why": "Sense, decide, act: no person needed."}},
             "Sense, decide, act, on wheels."),

        step("questions", "Check: scientists and robots", "\U0001F4DD", "Robot checker", ["4CS.01", "4CS.06", "4CS.07"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Computer scientists, service robots, control systems."], [], ["Read, think, tap."]),
             {"items": [
                 q("A computer scientist on a farm might write...", "\U0001F33E", "a program that waters a field when a soil sensor says it is dry", ["a song", "a menu", "nothing; farms do not use programs"], "Sensors and a program."),
                 q("A driverless train is a robot in...", "\U0001F686", "public transport", ["delivery", "health care", "farming"], "It moves people."),
                 q("A service robot senses, decides and acts. That makes it...", "\U0001F39B️", "a control system", ["a person", "a file", "a form"], "Sense, decide, act."),
             ]},
             "Scientists build; robots serve."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CS.01", "4CS.06", "4CS.07"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Where computer scientists work, what service robots do, and what a control system is."], [], ["Read, look, tap."]),
             {"items": [
                 q("Where do computer scientists work?", "\U0001F469\U0001F4BB", "in almost every industry", ["only at computer companies", "only in schools", "nowhere"], "Wherever a program can solve a problem."),
                 q("In a hospital a computer scientist might build...", "\U0001F3E5", "the system that keeps patient records safe and finds them fast", ["the beds", "the meals", "the uniforms"], "Records, safe and fast."),
                 q("In a bank a computer scientist designs...", "\U0001F3E6", "the encryption and checks that keep money safe", ["the building", "the coins", "the queue"], "Money moves as data."),
                 q("A service robot is...", "\U0001F916", "a machine a program controls, doing a job for people", ["a person in a costume", "any machine with wheels", "a toy"], "Program-controlled, serving."),
                 q("Which robot works in health care?", "\U0001FA7A", "a surgical robot holding instruments steady", ["a delivery drone", "a driverless train", "a warehouse robot"], "In the operating theatre."),
                 q("A delivery robot crosses when the light is green because...", "\U0001F6A6", "its sensors saw green and its program decided to go", ["someone pushed it", "it always crosses", "the light pushed it"], "Sense, decide, act."),
                 q("The three parts of a robot's control system are...", "\U0001F39B️", "sensors, a program that decides, and outputs like motors", ["a screen, a mouse and a keyboard", "wheels, a lid and a box", "a driver, a map and a horn"], "Sense, decide, act."),
             ]},
             "That is the whole lesson finished, and the whole course. You know who builds the programs and what the robots do."),
    ],
}


LESSON["about"] = [
    "Describe what computer scientists do in a range of industries.",
    "Match a program to the industry it was built for.",
    "Describe robots in delivery, public transport and health care.",
    "Explain a service robot as a control system: sense, decide, act.",
]

LESSON["lecture"] = [
    part("\U0001F469\U0001F4BB", "Computer scientists",
         "A computer scientist studies how computers solve problems and builds the programs that do it. In a hospital, the record system. On a farm, the watering program that reads soil sensors. In a bank, the encryption. In a games studio, the game. At a weather station, the forecast model. Every industry has problems a program can solve."),
    part("\U0001F4E6", "Robots that deliver",
         "A delivery robot is a box on wheels that rolls along the pavement with your shopping and stops at your door. A drone flies a parcel to an island. A warehouse robot fetches your order. They bring things."),
    part("\U0001F686", "Robots that move people and help patients",
         "A driverless train runs the airport shuttle. A self-driving shuttle bus steers slowly round a park. In a hospital a robot carries medicines to the ward, and a surgical robot holds instruments steadier than any hand. Public transport and health care."),
    part("\U0001F39B️", "A robot is a control system",
         "Every service robot senses, decides and acts. Cameras and distance sensors see; a program written by a computer scientist decides to stop, turn or cross; motors and lights act. Round and round in a forever loop, many times a second, until the job is done."),
]

LESSON["words"] = [
    word("computer scientist", "\U0001F469\U0001F4BB", "Someone who designs programs and systems that solve problems.",
         ["A computer scientist built the hospital's records system.", "Computer scientists work in every industry."]),
    word("industry", "\U0001F3ED", "A kind of work: farming, banking, health care, transport.",
         ["The games industry.", "Every industry uses programs."]),
    word("service robot", "\U0001F916", "A robot that does a job for people: delivering, driving, helping in a hospital.",
         ["A delivery robot is a service robot.", "Service robots work in hospitals."]),
    word("delivery", "\U0001F4E6", "Bringing things to people.",
         ["A robot made the delivery.", "Delivery drones fly to islands."]),
    word("public transport", "\U0001F686", "Buses, trains and shuttles that carry the public.",
         ["A driverless train is public transport.", "Robots run some public transport."]),
    word("health care", "\U0001F3E5", "Looking after people's health: hospitals, clinics, surgery.",
         ["Robots help in health care.", "A surgical robot works in health care."]),
]

LESSON["home"] = [
    home("Spot the computer scientist", "A day out, or the news",
         ["Everywhere you go, ask: what program is working here? The till, the traffic lights, the bus timetable screen, the hospital.",
          "For each one, a computer scientist wrote it. What problem did it solve?",
          "Pick the one you would most like to have built."],
         "Programs everywhere, each built by someone."),
    home("Design a service robot", "Paper, pens",
         ["Choose a job: delivering library books, guiding visitors, carrying lunch trays.",
          "Draw the robot. Label its sensors, the decisions its program makes, and its outputs.",
          "What should it do if a child steps in front of it?"],
         "Sense, decide, act, safely."),
]
