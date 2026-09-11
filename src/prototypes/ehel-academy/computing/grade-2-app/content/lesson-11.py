# -*- coding: utf-8 -*-
"""Lesson 11 - Computers, Devices and Robots.

0059 Stage 2 Computer Systems, the last three: 2CS.04 tasks computers
complete more effectively than humans; 2CS.05 different devices for
different places and purposes; 2CS.06 robots in fiction against real robots
with a real purpose.

Split out of lesson 10 by the Grade 2 validation (2026-09-11): lesson 10
carried all six Computer Systems objectives in 21 steps, about 60 minutes.
The six steps are unchanged; the quiz, about, lecture, words, home projects,
recap and warm-up are this lesson's own.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "computers-devices-and-robots",
    "title": "Computers, Devices and Robots",
    "blurb": "Race the computer at sums, decide which jobs are for computers and which for people, choose the right device for the place, and sort story robots from real ones.",
    "steps": [
        step("race", "You against the computer", "\U0001F3C1", "Sum racer", ["2CS.04"],
             "Five sums. The stopwatch starts when you tap. The computer's time is next to yours.",
             explain(
                 ["Some jobs a computer does better than a person: faster, and without mistakes."],
                 ["Adding numbers.", "Sorting a thousand names.", "Remembering every book in a library.",
                  "And some jobs it cannot do well at all: comforting a sad friend, deciding what is kind."],
                 ["Children think a computer is cleverer than them.", "It is faster at sums. It does not know your friend is sad."],
                 ["Race, then think about what the computer cannot do."]),
             {"rounds": [
                 {"ask": "24 + 38", "answer": "62", "opts": ["62", "52", "64"]},
                 {"ask": "57 - 29", "answer": "28", "opts": ["28", "32", "26"]},
                 {"ask": "45 + 47", "answer": "92", "opts": ["92", "82", "98"]},
                 {"ask": "83 - 46", "answer": "37", "opts": ["37", "43", "47"]},
                 {"ask": "66 + 25", "answer": "91", "opts": ["91", "81", "89"]},
             ],
              "then": {"ask": "Which job is a PERSON better at than a computer?",
                       "opts": [opt("Comforting a sad friend", True), opt("Adding a hundred numbers", False), opt("Sorting a thousand names", False)],
                       "why": "Sums and sorting are the computer's. Kindness is yours."}},
             "The computer wins the sums. You win the kindness."),

        step("sort", "Computer job, or people job?", "\U0001F9EE", "Job sorter", ["2CS.04"],
             "Some jobs a computer does better than a person. Some a person does better. Which is this?",
             explain(
                 ["A computer is better at jobs that need speed, a huge memory, or the same thing done again and again without mistakes."],
                 ["Adding up two hundred prices: a computer, in a blink.", "Finding one name among a million: a computer.",
                  "Choosing a present Grandma will love: a person. Being fair when two friends want the same toy: a person."],
                 ["Children think a computer is better at everything because it is fast.", "Fast is not the same as kind or fair. Those jobs are ours."],
                 ["Ask: does it need speed and memory, or care and kindness? Then tap."]),
             {"ask": "Computer job, or people job?",
              "bins": [{"id": "pc", "label": "A computer does it better", "pic": "\U0001F4BB"}, {"id": "person", "label": "A person does it better", "pic": "\U0001F9D1"}],
              "items": [
                  {"pic": "\U0001F6D2", "label": "adding up the prices of 200 things in a trolley", "bin": "pc", "why": "Fast and exact, every time."},
                  {"pic": "\U0001F50E", "label": "finding one name among a million names", "bin": "pc", "why": "A computer searches a million names in a blink."},
                  {"pic": "\U0001F697", "label": "counting every car on a road, all day and all night", "bin": "pc", "why": "A computer never gets tired or bored."},
                  {"pic": "\U0001F4DA", "label": "remembering every book in the library and where it is", "bin": "pc", "why": "A computer's memory holds every book at once."},
                  {"pic": "\U0001F917", "label": "giving a hug to a friend who fell over", "bin": "person", "why": "Caring for a friend is a person's job."},
                  {"pic": "\U0001F381", "label": "choosing a present Grandma will love", "bin": "person", "why": "Knowing what someone loves takes a person."},
                  {"pic": "\U0001F91D", "label": "being fair when two friends want the same toy", "bin": "person", "why": "Being fair and kind takes a person."},
                  {"pic": "\U0001F46B", "label": "asking a lonely child to join your game", "bin": "person", "why": "Noticing someone is lonely, and caring, is a person's job."},
              ]},
             "Speed and memory: the computer. Care, fairness and kindness: people."),

        step("ask", "Which device for the job?", "\U0001F4F1", "Device chooser", ["2CS.05"],
             "People choose a device to suit where they are and what they are doing. Which device fits?",
             explain(
                 ["A phone fits in a pocket and works anywhere.", "A laptop is for typing a lot, at a desk or on your knees.",
                  "A desktop stays in one place with a big screen.", "A smart speaker is for hands that are busy."],
                 ["On the bus: the phone.", "Writing a long story: the laptop.", "Cooking with messy hands: ask the speaker."],
                 [],
                 ["Read where they are and what they need, then tap the device."]),
             {"ways": [
                 {"id": "phone", "label": "Phone", "pic": "\U0001F4F2", "wrong": "A phone is for anywhere, in a pocket."},
                 {"id": "laptop", "label": "Laptop", "pic": "\U0001F4BB", "wrong": "A laptop is for typing a lot, at a desk or on your knees."},
                 {"id": "desktop", "label": "Desktop computer", "pic": "\U0001F5A5️", "wrong": "A desktop stays in one place, with a big screen."},
                 {"id": "speaker", "label": "Smart speaker", "pic": "\U0001F50A", "wrong": "A smart speaker is for when your hands are busy."},
             ],
              "questions": [
                  {"ask": "On the bus, and you need to message Mum.", "pic": "\U0001F68C", "answer": "phone", "result": "Message sent from your pocket.", "why": "On a bus you need something small that works anywhere."},
                  {"ask": "Writing a long story at a desk.", "pic": "\U0001F4DD", "answer": "laptop", "result": "A proper keyboard and a screen for a long story.", "why": "Lots of typing wants a real keyboard."},
                  {"ask": "An office worker who uses two big screens all day and never moves.", "pic": "\U0001F3E2", "answer": "desktop", "result": "Two big screens, at one desk, all day.", "why": "A desktop never needs to move and can have the biggest screens."},
                  {"ask": "Cooking with messy hands, and you need a timer.", "pic": "\U0001F373", "answer": "speaker", "result": "Timer set, ten minutes. No hands needed.", "why": "Busy hands, use your voice."},
                  {"ask": "A farmer in a field checking the weather.", "pic": "\U0001F33E", "answer": "phone", "result": "Rain at four. Better hurry.", "why": "In a field, the device that fits in a pocket."},
                  {"ask": "Editing a film with a big screen, at a desk.", "pic": "\U0001F3AC", "answer": "desktop", "result": "A big screen and a big computer for a big job.", "why": "Heavy work at one desk: the desktop."},
              ]},
             "The place and the purpose choose the device."),

        step("questions", "Why that device?", "\U0001F914", "Device detective", ["2CS.05"],
             "People choose a device because of where they are and what it is for. Why this one? Tap the answer.",
             explain(
                 ["Two things choose a device: WHERE you will use it, and WHAT it is for."],
                 ["A nurse walks from bed to bed: something light that goes with her.", "An architect draws a whole building: a big screen at one desk."],
                 ["Children think the newest or biggest device is always best.", "The best device is the one that fits the place and the job."],
                 ["Think where they are and what they need, then tap."]),
             {"label": "Question", "items": [
                 q("A nurse carries a tablet from bed to bed. Why a tablet?", "\U0001F3E5", "it is light and goes where she goes", ["it has the biggest screen", "it never needs charging", "it can make tea"], "She moves all day, so the device has to move with her."),
                 q("An architect draws a whole building on a desktop computer with a very big screen. Why a desktop?", "\U0001F4D0", "a big drawing needs a big screen, and she works at one desk", ["it fits in her pocket", "it works on a bus", "it is the smallest computer"], "A big job at one desk: a big screen that never needs to move."),
                 q("A taxi driver finds the way with a phone on the dashboard. Why a phone?", "\U0001F695", "it is small, goes in the car and knows where it is", ["it has a big keyboard", "it has to stay on a desk", "it prints maps"], "In a moving car you need something small that knows where you are."),
                 q("A shop has a computer fixed to the counter to take the money. Why fixed there?", "\U0001F3EA", "the selling always happens at that counter", ["so it can go for a walk", "because it is a toy", "so nobody can see it"], "The job happens in one place, so the device can stay there."),
             ]},
             "Where you are and what it is for: those choose the device."),

        step("explore", "Robots in stories, robots at work", "\U0001F916", "Robot comparer", ["2CS.06"],
             "Robots in stories and robots in the real world are not the same. Tap each one.",
             explain(
                 ["In stories, robots have feelings, find things funny and act like people.", "Real robots are programmed for a job, and most look like arms, boxes or cars."],
                 ["A story robot butler laughs at your jokes. A real factory arm welds the same joint ten thousand times.",
                  "A story robot has feelings. A real robot vacuum has a bump sensor."],
                 [],
                 ["Tap each one and say: story, or real?"]),
             {"items": [
                 {"pic": "\U0001F916\U0001F3A9", "label": "a robot butler that laughs at your jokes", "sub": "story", "say": "A robot butler that laughs at your jokes because it finds them funny. A story robot. A real robot can say a joke it was given, but nothing is funny to it."},
                 {"pic": "\U0001F9BE", "label": "a factory arm that welds cars", "sub": "real", "say": "A factory arm. Real. It welds the same joint ten thousand times a day, exactly the same each time."},
                 {"pic": "\U0001F97A", "label": "a robot that has feelings", "sub": "story", "say": "A robot that feels sad or happy. A story robot. A real robot has sensors, not feelings."},
                 {"pic": "\U0001F916", "label": "a robot vacuum", "sub": "real", "say": "A robot vacuum. Real. A simple one's program says: forward until a bump, turn, forward again."},
                 {"pic": "\U0001F9BF", "label": "a giant robot that fights", "sub": "story", "say": "A giant fighting robot. A story robot, in films and games."},
                 {"pic": "\U0001F699", "label": "a rover on Mars", "sub": "real", "say": "A rover on Mars. Real. Programmed to drive, dig and take pictures, millions of miles away."},
             ], "need": 6,
              "then": {"ask": "Which is a REAL robot with a real-world job?",
                       "opts": [opt("A factory arm that welds cars", True), opt("A robot butler that laughs at your jokes", False), opt("A robot with feelings", False)],
                       "why": "Real robots are programmed for a job. Feelings, and finding things funny, are for stories."}},
             "Story robots feel and think like people. Real robots have a job and a program."),

        step("sort", "Story robot, or real robot?", "\U0001F5C2️", "Fiction or real", ["2CS.06"],
             "Does this robot exist and do a real job, or is it from a story? Tap the bin.",
             explain(
                 ["Ask: does it have a program and a job? Real. Does it think, feel or laugh like a person? Story."],
                 [],
                 [],
                 ["Read it, decide, tap."]),
             {"ask": "Story robot, or real robot?",
              "bins": [{"id": "story", "label": "In a story", "pic": "\U0001F4D6"}, {"id": "real", "label": "Real, with a job", "pic": "\U0001F3ED"}],
              "items": [
                  {"pic": "\U0001F9BE", "label": "an arm that paints cars in a factory", "bin": "real", "why": "A real robot with one exact job."},
                  {"pic": "\U0001F916\U0001F4AD", "label": "a robot friend who understands your feelings", "bin": "story", "why": "Understanding feelings is a story."},
                  {"pic": "\U0001F4E6", "label": "a warehouse robot that fetches parcels", "bin": "real", "why": "Real, programmed to fetch from shelves."},
                  {"pic": "\U0001F680", "label": "a robot that flies through space and talks to aliens", "bin": "story", "why": "A story."},
                  {"pic": "\U0001F3E5", "label": "a hospital robot that carries medicines", "bin": "real", "why": "Real, following corridors to the right ward."},
                  {"pic": "\U0001F9F9", "label": "a robot that sweeps the floor", "bin": "real", "why": "A robot vacuum. Real."},
                  {"pic": "\U0001F451", "label": "a robot king who rules a city", "bin": "story", "why": "A story."},
                  {"pic": "\U0001F30A", "label": "a robot that explores the deep sea", "bin": "real", "why": "Real, going where people cannot."},
              ]},
             "A program and a job: real. Feelings: a story."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2CS.04", "2CS.05", "2CS.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the race, the jobs, the devices and the robots."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which job does a computer do better than a person?", "\U0001F9EE", "adding a hundred numbers", ["comforting a sad friend", "choosing a kind present", "knowing you are tired"], "Fast and without mistakes at sums; no idea about kindness."),
                 q("Which job needs a person more than a computer?", "\U0001F917", "cheering up a friend who is sad", ["adding up a shopping bill", "finding one name among a million", "counting cars all night"], "Speed and memory are the computer's jobs. Caring is ours."),
                 q("Why is a computer good at counting cars all day and all night?", "\U0001F697", "it never gets tired or bored", ["it likes cars", "it can drive", "it is kind"], "A computer does the same job again and again without getting tired."),
                 q("You are on a bus and need to message Mum. Which device?", "\U0001F68C", "a phone", ["a desktop computer", "a printer", "a smart speaker"], "Small, in a pocket, works anywhere."),
                 q("A delivery driver checks the next address while walking to the door. Which device fits?", "\U0001F4E6", "a phone in a pocket", ["a desktop computer", "a printer", "a smart TV"], "The driver is moving, so the device has to go with them."),
                 q("A robot that feels happy and sad, like a person, is...", "\U0001F4D6", "a story robot", ["a real factory robot", "a robot vacuum", "a rover"], "Real robots have programs and jobs, not feelings."),
                 q("Which is a REAL robot?", "\U0001F3ED", "a warehouse robot that fetches parcels", ["a robot king", "a robot with feelings", "a robot that talks to aliens"], "A real robot has a real job."),
                 q("How does a robot vacuum know it has hit a wall?", "\U0001F916", "a bump sensor tells it", ["it feels sad", "it guesses", "somebody shouts"], "A real robot notices the world with sensors, and its program says what to do next."),
             ]},
             "That is the whole lesson finished. You know what computers do best, how to choose a device, and a story robot from a real one."),
    ],
}


LESSON["about"] = [
    "Say which jobs a computer does better than a person, and which need a person.",
    "Choose a device for a place and a purpose, and say why.",
    "Tell a robot from a story from a real robot with a real job.",
]

LESSON["lecture"] = [
    part("\U0001F3C1", "What computers do better",
         "A computer adds a hundred numbers in a blink and never gets one wrong. It sorts a thousand names before you have said one, and it can count cars all night without getting tired or bored."),
    part("\U0001F917", "What people do better",
         "A computer cannot comfort a sad friend, choose a present Grandma will love, or be fair when two friends want the same toy. Fast is not the same as kind. Those jobs are ours."),
    part("\U0001F4F1", "The right device",
         "People choose a device for where they are and what it is for. A phone fits in a pocket and works anywhere. A laptop is for lots of typing. A desktop stays at one desk with a big screen. A smart speaker is for when your hands are busy."),
    part("\U0001F916", "Story robots and real robots",
         "In stories, robots have feelings, find things funny and act like people. Real robots have a program and a job: an arm that welds cars, a vacuum that turns when it bumps, a rover on Mars. A real robot notices the world with sensors, not feelings."),
]

LESSON["words"] = [
    word("accurate", "✔️", "Right every time, with no mistakes.",
         ["The calculator is fast and accurate.", "An accurate count has no mistakes."]),
    word("device", "\U0001F4F1", "A machine with a computer inside, like a phone, a tablet or a laptop.",
         ["Choose the right device for the job.", "A phone is a device that fits in a pocket."]),
    word("purpose", "\U0001F3AF", "What something is for.",
         ["A laptop's purpose is typing and work.", "Choose a device for its purpose."]),
    word("robot", "\U0001F916", "A machine with a computer inside, programmed to move and do a job.",
         ["A factory robot welds cars.", "A story robot is not a real robot."]),
    word("sensor", "\U0001F4E1", "A part that lets a robot notice something, like a bump.",
         ["The robot vacuum has a bump sensor.", "A sensor tells the robot it has hit something."]),
    word("fiction", "\U0001F4D6", "A story that somebody made up.",
         ["Robots with feelings belong in fiction.", "Fiction is fun, but it is not real."]),
]

LESSON["home"] = [
    home("Race a calculator", "A calculator or a phone, a grown-up, five sums",
         ["Your grown-up gives five sums. You answer; they type into the calculator.",
          "Who was faster? Who made fewer mistakes?",
          "Now find three jobs the calculator cannot do at all."],
         "A calculator cannot tell you a joke or a kind word."),
    home("Which device?", "The phones, tablets, laptops and speakers in your home",
         ["Find every device at home: phones, laptops, a desktop, a speaker, a tablet.",
          "For each one, say where it lives and what it is for.",
          "Why is that device in that place?"],
         "The place and the purpose choose the device."),
    home("Story robot spotting", "A film, a cartoon or a book with a robot in it, and a grown-up",
         ["Watch or read the story together.",
          "What can the story robot do that a real robot cannot?",
          "Name one real robot and the job it does."],
         "Story robots feel and think. Real robots have a program and a job."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you named hardware and software, found the parts of a laptop and a tablet, and sorted input devices from output devices."
LESSON["warmup"] = [
    q("Who adds 38 and 45 faster: a person, or a calculator?", "\U0001F9EE", "a calculator", ["a person, every time", "neither can do it", "they always take the same time"], "A calculator adds in a blink, with no mistakes."),
    q("Robots in films often have feelings. Do real robots?", "\U0001F916", "no, they follow a program", ["yes, like people do", "only happy ones", "only the big ones"], "A real robot has sensors and a program, not feelings."),
]
