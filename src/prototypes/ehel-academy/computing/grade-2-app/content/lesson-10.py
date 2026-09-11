# -*- coding: utf-8 -*-
"""Lesson 10 - Hardware, Software and Robots.

0059 Stage 2 Computer Systems, all six: 2CS.01 the functions of basic
hardware and software, by name; 2CS.02 features that make digital devices
easy to use; 2CS.03 input devices and output devices; 2CS.04 tasks computers
complete more effectively than humans; 2CS.05 different devices for different
places and purposes; 2CS.06 robots in fiction against real robots with a real
purpose.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "hardware-software-and-robots",
    "title": "Hardware, Software and Robots",
    "blurb": "Name the parts of a laptop and a tablet, tell hardware from software, race the computer at sums, choose the right device for the place, and sort story robots from real ones.",
    "steps": [
        step("explore", "Hardware and software", "\U0001F5A5️", "Hardware and software", ["2CS.01"],
             "Hardware is the parts you can touch. Software is the programs that run on them. Tap each one.",
             explain(
                 ["Hardware: the screen, the keyboard, the mouse, the speaker. You can touch it.", "Software: a game, a drawing app, the software that runs the tablet. You cannot touch it; it is programs."],
                 ["A keyboard is hardware. The writing app you type into is software.", "A speaker is hardware. The music app is software."],
                 ["Children think the app IS the tablet.", "The tablet is hardware. The apps are software running on it."],
                 ["Tap all six and say hardware or software."]),
             {"items": [
                 {"pic": "⌨️", "label": "keyboard", "sub": "hardware", "say": "A keyboard. Hardware: you can touch it. Its job is to put letters in."},
                 {"pic": "\U0001F5A5️", "label": "screen", "sub": "hardware", "say": "A screen. Hardware. Its job is to show you pictures and words."},
                 {"pic": "\U0001F50A", "label": "speaker", "sub": "hardware", "say": "A speaker. Hardware. Its job is to make sound."},
                 {"pic": "\U0001F3AE", "label": "a game", "sub": "software", "say": "A game. Software: a program that runs on the hardware. You cannot touch a game."},
                 {"pic": "\U0001F3A8", "label": "a drawing app", "sub": "software", "say": "A drawing app. Software. It turns your taps on the screen into a picture."},
                 {"pic": "⚙️", "label": "the software that runs the tablet", "sub": "software", "say": "The software that runs the tablet itself: it starts the tablet up and opens the apps. Software too."},
             ], "need": 6,
              "then": {"ask": "Which of these is software?",
                       "opts": [opt("A drawing app", True), opt("A keyboard", False), opt("A speaker", False)],
                       "why": "An app is a program. Keyboards and speakers are hardware you can touch."}},
             "Hardware you can touch. Software is the programs."),

        step("label", "The parts of a laptop", "\U0001F4BB", "Laptop labeller", ["2CS.01", "2CS.02"],
             "Tap the part of the laptop the page names. What does each part do?",
             explain(
                 ["Every part of the hardware has a job."],
                 ["The screen shows.", "The keyboard puts letters in.", "The touchpad moves the pointer.", "The camera takes pictures.",
                  "The speaker makes sound.", "The charging port is where the power goes in."],
                 [],
                 ["Find each part and tap it. You can use Tab and Enter on a keyboard."]),
             {"figure": "laptop", "ask": "Tap the <b>%s</b>.",
              "parts": [
                  {"id": "screen", "label": "screen", "say": "The screen. It shows you pictures and words. An output."},
                  {"id": "keyboard", "label": "keyboard", "say": "The keyboard. Press the keys and letters go in. An input."},
                  {"id": "touchpad", "label": "touchpad", "say": "The touchpad. Slide a finger to move the pointer. An input."},
                  {"id": "camera", "label": "camera", "say": "The camera. It takes pictures and video calls. An input."},
                  {"id": "speaker", "label": "speaker", "say": "The speaker. It makes sound. An output."},
                  {"id": "port", "label": "charging port", "say": "The charging port. The charger plugs in here to fill the battery."},
              ]},
             "Six parts of a laptop, each with a job."),

        step("label", "The parts of a tablet", "\U0001F4F1", "Tablet labeller", ["2CS.02", "2CS.01"],
             "A tablet has fewer parts, and some are made to be easy. Tap the part the page names.",
             explain(
                 ["A tablet is designed to be easy to use: a big touchscreen, a home button that always takes you back to the start, buttons you can feel."],
                 ["The touchscreen is the keyboard, the mouse and the screen in one.", "The home button always goes back to the start, so you can always find your way back.",
                  "The volume buttons stick out so you can find them without looking."],
                 [],
                 ["Find each part and tap it."]),
             {"figure": "tablet", "ask": "Tap the <b>%s</b>.",
              "parts": [
                  {"id": "screen", "label": "touchscreen", "say": "The touchscreen. You tap it and it shows you things: an input and an output in one."},
                  {"id": "home", "label": "home button", "say": "The home button. Wherever you are, it takes you back to the start. That makes the tablet easy to use."},
                  {"id": "camera", "label": "camera", "say": "The camera, at the top. For photos and video calls."},
                  {"id": "volume", "label": "volume buttons", "say": "The volume buttons, on the side. They stick out so you can find them without looking."},
                  {"id": "speaker", "label": "speaker", "say": "The speaker, at the bottom. Sound comes out here."},
                  {"id": "port", "label": "charging port", "say": "The charging port, at the bottom. The charger goes in here."},
              ]},
             "A tablet's parts are made to be found and used easily."),

        step("sort", "Hardware, or software?", "\U0001F5C2️", "Hardware or software", ["2CS.01"],
             "Can you touch it? Then it is hardware. Is it a program? Then it is software.",
             explain(
                 ["Hardware is the physical parts. Software is the programs."],
                 ["A mouse: hardware.", "A writing program: software.", "A printer: hardware.", "A video game: software."],
                 ["Children call the screen software because the software shows on it.", "The screen is hardware. What it shows is made by software."],
                 ["Ask: could I hold it in my hand? Then tap."]),
             {"ask": "Hardware, or software?",
              "bins": [{"id": "hw", "label": "Hardware", "pic": "\U0001F5A5️"}, {"id": "sw", "label": "Software", "pic": "\U0001F4BF"}],
              "items": [
                  {"pic": "\U0001F5B1️", "label": "a mouse", "bin": "hw", "why": "You can hold it. Hardware."},
                  {"pic": "✏️", "label": "a writing program", "bin": "sw", "why": "A program. Software."},
                  {"pic": "\U0001F5A8️", "label": "a printer", "bin": "hw", "why": "A machine you can touch. Hardware."},
                  {"pic": "\U0001F3AE", "label": "a video game", "bin": "sw", "why": "A program. Software."},
                  {"pic": "\U0001F3A7", "label": "headphones", "bin": "hw", "why": "You can hold them. Hardware."},
                  {"pic": "\U0001F5FA️", "label": "a map app", "bin": "sw", "why": "An app is a program. Software."},
                  {"pic": "\U0001F4F7", "label": "a camera", "bin": "hw", "why": "A part you can touch. Hardware."},
                  {"pic": "\U0001F3B5", "label": "a music app", "bin": "sw", "why": "A program that plays music. Software. The speaker it plays through is hardware."},
              ]},
             "Touch it: hardware. A program: software."),

        step("explore", "Made to be easy", "\U0001F44D", "Easy-to-use spotter", ["2CS.02"],
             "Some parts of a device are there to make it easy to use. Tap each one.",
             explain(
                 ["Designers add features so anyone can use a device: a touchscreen, big icons with pictures, a voice you can talk to, a home button, buttons you can feel."],
                 ["Big icons with pictures mean you do not have to read to open an app.", "A handle means you can carry it.", "A voice means you can ask without typing."],
                 [],
                 ["Tap each feature and say who it helps."]),
             {"items": [
                 {"pic": "\U0001F446", "label": "a touchscreen you tap", "say": "A touchscreen. You tap what you want, with no mouse and no keyboard to learn."},
                 {"pic": "\U0001F5BC️", "label": "big icons with pictures", "say": "Big icons with pictures. You can find the drawing app before you can read the word drawing."},
                 {"pic": "\U0001F5E3️", "label": "a voice you can talk to", "say": "A voice you can talk to. Ask it a question without typing anything."},
                 {"pic": "\U0001F3E0", "label": "a home button", "say": "A home button. Wherever you are, one press takes you back to the start."},
                 {"pic": "\U0001F4A1", "label": "a bright, clear screen", "say": "A bright, clear screen with big writing, so it is easy to see."},
                 {"pic": "\U0001F9F1", "label": "a case with rounded edges and a handle", "say": "A case with rounded edges and a handle: easy to hold, hard to break."},
             ], "need": 6,
              "then": {"ask": "Which feature helps someone who cannot read yet find the drawing app?",
                       "opts": [opt("Big icons with pictures", True), opt("A charging port", False), opt("A long password", False)],
                       "why": "A picture on the icon says what the app is before the word can be read."}},
             "Touchscreens, pictures, voices and home buttons make devices easy."),

        step("io", "Input, or output?", "\U0001F500", "In and out", ["2CS.03"],
             "Input devices put information IN. Output devices send it OUT. Tap each device to see which way it goes.",
             explain(
                 ["The difference between an input device and an output device is the direction the information goes."],
                 ["Keyboard, mouse, touchscreen, microphone, camera, game controller: in.", "Screen, speaker, headphones, printer, lights: out."],
                 ["Children think 'input' means 'plugged in'.", "It means information going INTO the computer."],
                 ["Tap all eight, then answer three questions."]),
             {"need": 8, "devices": [
                 {"id": "keyboard", "pic": "⌨️", "label": "keyboard", "kind": "input", "does": "Letters go in when you press the keys.", "shows": "h e l l o", "sound": "type"},
                 {"id": "controller", "pic": "\U0001F3AE", "label": "game controller", "kind": "input", "does": "Your button presses go in.", "shows": "\U0001F3AE press", "sound": "click"},
                 {"id": "mic", "pic": "\U0001F3A4", "label": "microphone", "kind": "input", "does": "Your voice goes in.", "shows": "\U0001F3B5 hello", "sound": "ding"},
                 {"id": "camera", "pic": "\U0001F4F7", "label": "camera", "kind": "input", "does": "A picture goes in.", "shows": "\U0001F5BC️", "sound": "click"},
                 {"id": "screen", "pic": "\U0001F5A5️", "label": "screen", "kind": "output", "does": "Pictures and words come out.", "shows": "\U0001F5BC️ hello", "sound": "pop"},
                 {"id": "headphones", "pic": "\U0001F3A7", "label": "headphones", "kind": "output", "does": "Sound comes out, just for you.", "shows": "\U0001F3B5\U0001F3B6", "sound": "beep"},
                 {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "kind": "output", "does": "Words and pictures come out on paper.", "shows": "\U0001F4C4", "sound": "print"},
                 {"id": "lights", "pic": "\U0001F4A1", "label": "lights", "kind": "output", "does": "The computer switches a light on to tell you something.", "shows": "\U0001F4A1 on", "sound": "ding"},
             ]},
             "Input: information in. Output: information out. That is the difference."),

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

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2CS.01", "2CS.02", "2CS.03", "2CS.04", "2CS.05", "2CS.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about hardware and software, the parts, in and out, the race, the devices and the robots."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which is hardware?", "\U0001F5A5️", "a keyboard", ["a game", "a drawing app", "a map app"], "Hardware is the parts you can touch."),
                 q("Which is software?", "\U0001F4BF", "a video game", ["a mouse", "a printer", "a screen"], "Software is programs."),
                 q("What does the home button on a tablet do?", "\U0001F3E0", "takes you back to the start from anywhere", ["turns the tablet off", "prints", "takes a photo"], "One press, back to the start: easy to use."),
                 q("Which is an OUTPUT device?", "⬆️", "headphones", ["a microphone", "a keyboard", "a camera"], "Sound comes OUT through headphones."),
                 q("Which job does a computer do better than a person?", "\U0001F9EE", "adding a hundred numbers", ["comforting a sad friend", "choosing a kind present", "knowing you are tired"], "Fast and without mistakes at sums; no idea about kindness."),
                 q("You are on a bus and need to message Mum. Which device?", "\U0001F68C", "a phone", ["a desktop computer", "a printer", "a smart speaker"], "Small, in a pocket, works anywhere."),
                 q("A robot that feels happy and sad, like a person, is...", "\U0001F4D6", "a story robot", ["a real factory robot", "a robot vacuum", "a rover"], "Real robots have programs and jobs, not feelings."),
                 q("Which is a REAL robot?", "\U0001F3ED", "a warehouse robot that fetches parcels", ["a robot king", "a robot with feelings", "a robot that talks to aliens"], "A real robot has a real job."),
             ]},
             "That is the whole lesson finished. You know the hardware, the software, and the difference between a story robot and a real one."),
    ],
}


LESSON["about"] = [
    "Name basic hardware and software and say what each is for.",
    "Point to the parts of a laptop and a tablet, and say which features make them easy to use.",
    "Tell an input device from an output device, and say which jobs computers do better than people.",
    "Choose a device for a place and a purpose, and tell a story robot from a real one.",
]

LESSON["lecture"] = [
    part("\U0001F5A5️", "Hardware and software",
         "Hardware is the parts you can touch: the screen, the keyboard, the mouse, the speaker, the camera. Software is the programs that run on them: a game, a drawing app, the software that runs the tablet itself."),
    part("\U0001F44D", "Made to be easy",
         "Devices have features so anyone can use them. A touchscreen you tap. Big icons with pictures. A home button that always takes you back to the start. Buttons you can feel. A voice you can talk to."),
    part("\U0001F500", "In and out",
         "An input device sends information into the computer: keyboard, mouse, microphone, camera, game controller. An output device sends it out: screen, speaker, headphones, printer, lights. The direction is the difference."),
    part("\U0001F3C1", "What computers do better",
         "A computer adds a hundred numbers in a blink and never gets one wrong. It sorts a thousand names before you have said one. But it cannot comfort a sad friend or choose a kind present. Those are yours."),
    part("\U0001F916", "Story robots and real robots",
         "In stories, robots have feelings, find things funny and act like people. Real robots have a program and a job: an arm that welds cars, a vacuum that turns when it bumps, a rover on Mars. People choose a device for the place and the purpose, and they choose a robot for a job."),
]

LESSON["words"] = [
    word("hardware", "\U0001F5A5️", "The parts of a computer you can touch.",
         ["The keyboard is hardware.", "Hardware and software work together."]),
    word("software", "\U0001F4BF", "The programs that run on a computer.",
         ["A game is software.", "Software cannot be touched."]),
    word("input", "⬇️", "A device that puts information into a computer.",
         ["A microphone is an input.", "Inputs go in."]),
    word("output", "⬆️", "A device that sends information out of a computer.",
         ["A printer is an output.", "Outputs come out."]),
    word("feature", "\U0001F44D", "A part of a device that helps you use it.",
         ["A home button is a helpful feature.", "Big icons are a feature for young children."]),
    word("device", "\U0001F4F1", "A machine with a computer inside, like a phone, a tablet or a laptop.",
         ["Choose the right device for the job.", "A phone is a device that fits in a pocket."]),
    word("robot", "\U0001F916", "A machine with a computer inside, programmed to move and do a job.",
         ["A factory robot welds cars.", "A story robot is not a real robot."]),
    word("purpose", "\U0001F3AF", "What something is for.",
         ["A laptop's purpose is typing and work.", "Choose a device for its purpose."]),
]

LESSON["home"] = [
    home("Parts hunt", "A real laptop or tablet, with a grown-up",
         ["Find the screen, the keyboard or touchscreen, the camera, the speaker and the charging port.",
          "Say what each one does.",
          "Find one feature that makes it easy to use."],
         "Hardware you can point at. The apps on it are software."),
    home("Race a calculator", "A calculator or a phone, a grown-up, five sums",
         ["Your grown-up gives five sums. You answer; they type into the calculator.",
          "Who was faster? Who made fewer mistakes?",
          "Now find three jobs the calculator cannot do at all."],
         "A calculator cannot tell you a joke or a kind word."),
    home("Which device?", "A walk round the house",
         ["Find every device at home: phones, laptops, a desktop, a speaker, a tablet.",
          "For each one, say where it lives and what it is for.",
          "Why is that device in that place?"],
         "The place and the purpose choose the device."),
]
