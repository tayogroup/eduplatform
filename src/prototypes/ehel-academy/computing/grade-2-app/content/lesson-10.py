# -*- coding: utf-8 -*-
"""Lesson 10 - Hardware and Software.

0059 Stage 2 Computer Systems, the first three: 2CS.01 the functions of basic
hardware and software, by name; 2CS.02 features that make digital devices
easy to use; 2CS.03 input devices and output devices.

Until the Grade 2 validation (2026-09-11) this lesson also taught 2CS.04 to
2CS.06 and ran to 21 steps, about 60 minutes; those six steps are lesson 11
now. The page keeps its file name, hardware-software-and-robots.html, so the
address the live course already knows serves this lesson rather than a stale
copy of the old one.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "hardware-and-software",
    "title": "Hardware and Software",
    "blurb": "Name the parts of a laptop and a tablet, tell hardware from software, spot what makes a device easy to use, and sort input devices from output devices.",
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

        step("sort", "Which way does the information go?", "\U0001F500", "Direction detective", ["2CS.03"],
             "Something is happening with a computer. Is information going IN to it, or coming OUT of it? Tap the bin.",
             explain(
                 ["Input and output are about the direction the information goes.", "Into the computer: an input device. Out to you: an output device."],
                 ["You say 'play my song': your voice goes IN through the microphone.", "The song plays: sound comes OUT of the speaker.",
                  "The scanner reads the price: IN. The screen shows the price: OUT."],
                 ["Children sort by the object, not by what it is doing.", "Ask: is the information going in, or coming out?"],
                 ["Read what is happening, then tap the bin."]),
             {"ask": "Information in, or information out?",
              "bins": [{"id": "in", "label": "Information in", "pic": "⬇️"}, {"id": "out", "label": "Information out", "pic": "⬆️"}],
              "items": [
                  {"pic": "\U0001F3A4", "label": "you say 'play my song' to the tablet", "bin": "in", "why": "Your voice goes in, through the microphone."},
                  {"pic": "\U0001F50A", "label": "the tablet plays your song out loud", "bin": "out", "why": "The sound comes out, through the speaker."},
                  {"pic": "\U0001F6D2", "label": "the shop's scanner reads the price on the milk", "bin": "in", "why": "The scanner puts the price into the till."},
                  {"pic": "\U0001F5A5\uFE0F", "label": "the till's screen shows how much to pay", "bin": "out", "why": "The screen shows it to you. Out."},
                  {"pic": "\U0001F3AE", "label": "you press jump on the game controller", "bin": "in", "why": "Your press goes into the game."},
                  {"pic": "\U0001F5A8\uFE0F", "label": "the printer prints your drawing", "bin": "out", "why": "The drawing comes out on paper."},
                  {"pic": "\U0001F4F7", "label": "you take a photo of the cat with the tablet", "bin": "in", "why": "The camera puts the picture in."},
                  {"pic": "\U0001F6A6", "label": "the traffic light turns green", "bin": "out", "why": "A computer switches the green light on to tell drivers to go."},
              ]},
             "Information in, information out: the direction is the difference."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2CS.01", "2CS.02", "2CS.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about hardware and software, the parts of a laptop and a tablet, and in and out."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which is hardware?", "\U0001F5A5️", "a keyboard", ["a game", "a drawing app", "a map app"], "Hardware is the parts you can touch."),
                 q("Which is software?", "\U0001F4BF", "a video game", ["a mouse", "a printer", "a screen"], "Software is programs."),
                 q("Which part of a laptop moves the pointer?", "\U0001F4BB", "the touchpad", ["the speaker", "the charging port", "the camera"], "Slide a finger on the touchpad and the pointer moves."),
                 q("Is the screen hardware or software?", "\U0001F5A5️", "hardware: you can touch it", ["software, because pictures show on it", "it depends on the app", "neither"], "You can touch the screen, so it is hardware. What it shows is made by software."),
                 q("What does the home button on a tablet do?", "\U0001F3E0", "takes you back to the start from anywhere", ["turns the tablet off", "prints", "takes a photo"], "One press, back to the start: easy to use."),
                 q("Why do a tablet's volume buttons stick out?", "\U0001F4F1", "so you can find them without looking", ["so they break easily", "to make it heavier", "to make it print"], "Buttons you can feel make a tablet easy to use."),
                 q("Which is an OUTPUT device?", "⬆️", "headphones", ["a microphone", "a keyboard", "a camera"], "Sound comes OUT through headphones."),
                 q("The library's scanner reads the code on a book. Is that information going in, or coming out?", "\U0001F4DA", "in: the code goes into the computer", ["out: the book comes out", "neither", "both at once"], "The scanner puts the book's code into the computer. In."),
             ]},
             "That is the whole lesson finished. You know the hardware, the software, what makes a device easy to use, and which way information goes."),
    ],
}


LESSON["about"] = [
    "Name basic hardware and software and say what each is for.",
    "Point to the parts of a laptop and a tablet, and say which features make them easy to use.",
    "Tell an input device from an output device by the way the information goes.",
]

LESSON["lecture"] = [
    part("\U0001F5A5️", "Hardware and software",
         "Hardware is the parts you can touch: the screen, the keyboard, the mouse, the speaker, the camera. Software is the programs that run on them: a game, a drawing app, the software that runs the tablet itself."),
    part("\U0001F4BB", "Every part has a job",
         "The screen shows. The keyboard puts letters in. The touchpad moves the pointer. The camera takes pictures, the speaker makes sound, and the charger plugs into the charging port. A tablet's touchscreen is the keyboard, the mouse and the screen in one."),
    part("\U0001F44D", "Made to be easy",
         "Devices have features so anyone can use them. A touchscreen you tap. Big icons with pictures. A home button that always takes you back to the start. Buttons you can feel. A voice you can talk to."),
    part("\U0001F500", "In and out",
         "An input device sends information into the computer: keyboard, mouse, microphone, camera, game controller. An output device sends it out: screen, speaker, headphones, printer, lights. The direction is the difference."),
]

LESSON["words"] = [
    word("hardware", "\U0001F5A5️", "The parts of a computer you can touch.",
         ["The keyboard is hardware.", "Hardware and software work together."]),
    word("software", "\U0001F4BF", "The programs that run on a computer.",
         ["A game is software.", "Software cannot be touched."]),
    word("touchscreen", "\U0001F446", "A screen you tap, which takes information in and shows it too.",
         ["A tablet has a touchscreen.", "Tap the touchscreen to open the app."]),
    word("input", "⬇️", "A device that puts information into a computer.",
         ["A microphone is an input.", "Inputs go in."]),
    word("output", "⬆️", "A device that sends information out of a computer.",
         ["A printer is an output.", "Outputs come out."]),
    word("feature", "\U0001F44D", "A part of a device that helps you use it.",
         ["A home button is a helpful feature.", "Big icons are a feature for young children."]),
]

LESSON["home"] = [
    home("Parts hunt", "A real laptop or tablet, with a grown-up",
         ["Find the screen, the keyboard or touchscreen, the camera, the speaker and the charging port.",
          "Say what each one does.",
          "Find one feature that makes it easy to use."],
         "Hardware you can point at. The apps on it are software."),
    home("In and out hunt", "A grown-up, and the devices you have at home",
         ["Find three devices that put information in: a remote control, a microphone, a keyboard or a camera.",
          "Find three that send information out: a screen, a speaker, headphones or a printer.",
          "For each one, say which way the information goes."],
         "In goes into the computer. Out comes out to you."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you joined devices into a network, told wired from wireless, and decided what to share and what to keep private."
LESSON["warmup"] = [
    q("Is a game something you can touch?", "\U0001F3AE", "no, a game is a program", ["yes, you can hold it", "only the big ones", "only when it is switched on"], "A game is software: a program. You can touch the tablet it runs on."),
    q("You talk to a tablet and it hears you. What does it hear you with?", "\U0001F3A4", "a microphone", ["the charger", "the screen", "the printer"], "A microphone lets your voice into the tablet."),
]
