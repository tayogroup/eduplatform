# -*- coding: utf-8 -*-
"""Lesson 13 - Systems, Inputs and Files.

0059 Stage 3 Computer Systems: 3CS.01 hardware and software combine to form
a working system; 3CS.02 the differences between hardware and software and
the roles they perform; 3CS.03 manual and automatic input devices; 3CS.04
different types of file stored on a hard drive - text, audio, image, video,
games.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "systems-inputs-and-files",
    "title": "Systems, Inputs and Files",
    "blurb": "See hardware and software work together as one system, compare the jobs each does, tell a manual input from an automatic one, and find out what kinds of file a computer keeps.",
    "steps": [
        step("demo", "A working system", "\U0001F5A5️", "System watcher", ["3CS.01"],
             "Hardware and software combine into one working system. Press <b>Next</b> to watch a key press become a letter on the screen.",
             explain(
                 ["Hardware alone does nothing: a keyboard with no software is a box of buttons.", "Software alone does nothing: a program with no hardware has nowhere to run.", "Together they are a system."],
                 ["You press K on the keyboard (hardware).", "The keyboard sends a signal.", "The operating system (software) receives it and passes it to the writing app (software).",
                  "The app puts a K in your document and the screen (hardware) shows it."],
                 ["Children think the letter comes straight from the key to the screen.", "Software is in the middle, every time."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "⌨️", "cap": "You press <b>K</b>. The keyboard is hardware.", "say": "You press K. The keyboard is hardware.", "sound": "type"},
                 {"pic": "⚡", "cap": "The keyboard sends a signal down the wire.", "say": "The keyboard sends a signal down the wire."},
                 {"pic": "⚙️", "cap": "The <b>operating system</b> - software - receives it and passes it to the app that is open.", "say": "The operating system, which is software, receives the signal and passes it to the app that is open."},
                 {"pic": "\U0001F4DD", "cap": "The writing <b>app</b> - software - puts a K in your document.", "say": "The writing app, also software, puts a K in your document."},
                 {"pic": "\U0001F5A5️", "cap": "The <b>screen</b> - hardware - shows the K. Hardware, software, hardware: one system.", "say": "The screen, hardware, shows the K. Hardware, then software, then hardware. One working system.", "sound": "ding"},
             ]},
             "Hardware and software, one system."),

        step("sort", "Whose job is it?", "\U0001F5C2️", "Role sorter", ["3CS.02"],
             "Hardware and software do different jobs. Whose job is this?",
             explain(
                 ["Hardware is the physical parts: it senses, shows, stores, sounds, connects.", "Software is the instructions: it decides, calculates, draws what to show, saves what to store."],
                 ["Showing a picture on the screen: the screen is hardware; the app deciding what picture: software.",
                  "Storing a file: the hard drive is hardware; the program that saves it is software."],
                 ["Children think software is 'the computer' and hardware is 'the extras'.", "Both are the computer. Neither works alone."],
                 ["Read, decide, tap."]),
             {"ask": "Hardware's job, or software's job?",
              "bins": [{"id": "hw", "label": "Hardware", "pic": "\U0001F5A5️"}, {"id": "sw", "label": "Software", "pic": "\U0001F4BF"}],
              "items": [
                  {"pic": "\U0001F5A5️", "label": "lighting up the pixels so you can see the picture", "bin": "hw", "why": "The screen, hardware, does the lighting."},
                  {"pic": "\U0001F3A8", "label": "deciding which picture to show", "bin": "sw", "why": "The app decides: software."},
                  {"pic": "\U0001F4BE", "label": "keeping your files when the power is off", "bin": "hw", "why": "The hard drive holds them: hardware."},
                  {"pic": "\U0001F9EE", "label": "working out 37 + 48", "bin": "sw", "why": "A program does the sum: software running on the processor."},
                  {"pic": "\U0001F50A", "label": "making the sound waves you hear", "bin": "hw", "why": "The speaker: hardware."},
                  {"pic": "\U0001F3B5", "label": "choosing which song plays next", "bin": "sw", "why": "The music app decides: software."},
                  {"pic": "⌨️", "label": "feeling a key being pressed", "bin": "hw", "why": "The keyboard senses it: hardware."},
                  {"pic": "\U0001F4DD", "label": "putting the letter into your document", "bin": "sw", "why": "The writing app: software."},
              ]},
             "Hardware senses, shows and stores. Software decides."),

        step("context", "Different roles, one system", "\U0001F91D", "Role explainer", ["3CS.02", "3CS.01"],
             "Compare the roles. Tap each pair to hear how they share the work.",
             explain(
                 ["For every job the computer does, there is a hardware half and a software half."],
                 ["Taking a photo: the camera (hardware) catches the light; the camera app (software) turns it into a picture file.", "Playing a game: the processor and screen (hardware) draw; the game (software) decides what happens."],
                 [],
                 ["Tap all four pairs."]),
             {"items": [
                 {"pic": "\U0001F4F7", "label": "taking a photo", "say": "Taking a photo. The camera, hardware, catches the light. The camera app, software, turns it into a picture file and saves it."},
                 {"pic": "\U0001F3AE", "label": "playing a game", "say": "Playing a game. The game, software, decides what happens when you press jump. The screen and speaker, hardware, show and sound it."},
                 {"pic": "\U0001F5A8️", "label": "printing", "say": "Printing. The app, software, arranges the page. The printer, hardware, puts the ink on the paper."},
                 {"pic": "\U0001F310", "label": "opening a web page", "say": "Opening a web page. The network card and cable, hardware, carry the data. The browser, software, turns it into a page you can read."},
             ], "need": 4,
              "then": {"ask": "What happens to a computer with hardware but no software?",
                       "opts": [opt("Nothing: there are no instructions for the hardware to follow", True), opt("It works just the same", False), opt("It runs faster", False)],
                       "why": "Hardware follows software. Without instructions it is a box of parts."}},
             "Two roles, one system."),

        step("io", "Manual or automatic input?", "\U0001F500", "Input detective", ["3CS.03"],
             "An input can be MANUAL - a person does it - or AUTOMATIC - a sensor does it by itself. Tap each device.",
             explain(
                 ["A manual input needs a person: press a key, tap a screen, click a mouse.", "An automatic input needs nobody: a sensor feels heat, sees light, hears sound, and sends it in by itself."],
                 ["Keyboard: manual. Thermometer sensor: automatic.", "A barcode scanner at a till reads the code by itself: automatic."],
                 ["Children think automatic means better.", "It means no person. Each kind is right for its job."],
                 ["Tap all eight, then answer."]),
             {"need": 8, "devices": [
                 {"id": "keyboard", "pic": "⌨️", "label": "keyboard", "kind": "input", "does": "A person presses keys. Manual input.", "shows": "h e l l o", "sound": "type"},
                 {"id": "mouse", "pic": "\U0001F5B1️", "label": "mouse", "kind": "input", "does": "A person moves and clicks it. Manual input.", "shows": "\U0001F5B1️ click", "sound": "click"},
                 {"id": "touch", "pic": "\U0001F446", "label": "touchscreen", "kind": "input", "does": "A person taps it. Manual input.", "shows": "\U0001F446 tap", "sound": "click"},
                 {"id": "thermo", "pic": "\U0001F321️", "label": "temperature sensor", "kind": "input", "does": "It feels the heat by itself and sends the number in. Automatic input.", "shows": "21°C", "sound": "ding"},
                 {"id": "light", "pic": "\U0001F506", "label": "light sensor", "kind": "input", "does": "It sees how bright it is, by itself. Automatic input: a street lamp uses one.", "shows": "\U0001F506 bright", "sound": "ding"},
                 {"id": "scanner", "pic": "\U0001F4E6", "label": "barcode scanner", "kind": "input", "does": "It reads the code on a packet by itself. Automatic input.", "shows": "‖‖‖ £1.20", "sound": "beep"},
                 {"id": "screen", "pic": "\U0001F5A5️", "label": "screen", "kind": "output", "does": "Pictures and words come out.", "shows": "\U0001F5BC️", "sound": "pop"},
                 {"id": "speaker", "pic": "\U0001F50A", "label": "speaker", "kind": "output", "does": "Sound comes out.", "shows": "\U0001F3B5", "sound": "beep"},
             ]},
             "Manual inputs need a person. Automatic inputs sense by themselves."),

        step("sort", "Manual, or automatic?", "\U0001F5C2️", "Manual-auto sorter", ["3CS.03"],
             "Does a person work this input, or does it sense by itself?",
             explain(
                 ["Manual: a person does it. Automatic: a sensor does it."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Manual, or automatic?",
              "bins": [{"id": "man", "label": "Manual", "pic": "\U0001F590️"}, {"id": "auto", "label": "Automatic", "pic": "\U0001F916"}],
              "items": [
                  {"pic": "⌨️", "label": "typing on a keyboard", "bin": "man", "why": "A person presses the keys."},
                  {"pic": "\U0001F321️", "label": "a thermometer sending the room temperature", "bin": "auto", "why": "The sensor feels it by itself."},
                  {"pic": "\U0001F3A4", "label": "speaking into a microphone", "bin": "man", "why": "A person speaks."},
                  {"pic": "\U0001F6AA", "label": "a sensor spotting you at an automatic door", "bin": "auto", "why": "Nobody pressed anything; it sensed you."},
                  {"pic": "\U0001F4E6", "label": "a barcode read at the till", "bin": "auto", "why": "The scanner reads the code by itself."},
                  {"pic": "\U0001F5B1️", "label": "clicking a mouse", "bin": "man", "why": "A person clicks."},
                  {"pic": "\U0001F327️", "label": "a rain sensor closing a greenhouse window", "bin": "auto", "why": "It senses the rain on its own."},
                  {"pic": "\U0001F3AE", "label": "pressing a game controller", "bin": "man", "why": "A person presses."},
              ]},
             "Manual: a person. Automatic: a sensor."),

        step("explore", "What is on the hard drive?", "\U0001F4BE", "File explorer", ["3CS.04"],
             "A computer's hard drive keeps files of different types. Tap each type to open one.",
             explain(
                 ["A file is a thing saved on the hard drive. Different kinds of thing are different types of file, and each type opens in a different program."],
                 ["A text file holds words: a story.", "An audio file holds sound: a song.", "An image file holds a picture.", "A video file holds moving pictures and sound.", "A game file holds a game."],
                 ["Children think everything on a computer is 'a file' with no differences.", "The type decides what it holds and what can open it."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F4C4", "label": "text file", "sub": "story.txt", "say": "A text file. Words: a story, a letter, a list. It opens in a writing program."},
                 {"pic": "\U0001F3B5", "label": "audio file", "sub": "song.mp3", "say": "An audio file. Sound: a song, a recording of your voice. It opens in a music player."},
                 {"pic": "\U0001F5BC️", "label": "image file", "sub": "photo.jpg", "say": "An image file. A picture: a photo, a drawing. It opens in a picture viewer."},
                 {"pic": "\U0001F3AC", "label": "video file", "sub": "film.mp4", "say": "A video file. Moving pictures with sound. It opens in a video player."},
                 {"pic": "\U0001F3AE", "label": "game file", "sub": "game.exe", "say": "A game file. A whole game, ready to run. It opens by running it."},
             ], "need": 5,
              "then": {"ask": "You record yourself singing. What type of file is saved?",
                       "opts": [opt("An audio file", True), opt("A text file", False), opt("An image file", False)],
                       "why": "Sound is stored as audio."}},
             "Text, audio, image, video, games: five types of file."),

        step("sort", "Which type of file?", "\U0001F5C2️", "File sorter", ["3CS.04"],
             "Something is saved on the hard drive. Which type of file is it?",
             explain(["Words: text. Sound: audio. Picture: image. Moving pictures: video. A game: game."], [], [], ["Read, decide, tap."]),
             {"ask": "Which type of file?",
              "bins": [{"id": "text", "label": "Text", "pic": "\U0001F4C4"}, {"id": "audio", "label": "Audio", "pic": "\U0001F3B5"}, {"id": "image", "label": "Image", "pic": "\U0001F5BC️"}, {"id": "video", "label": "Video", "pic": "\U0001F3AC"}, {"id": "game", "label": "Game", "pic": "\U0001F3AE"}],
              "items": [
                  {"pic": "\U0001F4D6", "label": "the story you typed", "bin": "text", "why": "Words are text."},
                  {"pic": "\U0001F3A4", "label": "a recording of the class singing", "bin": "audio", "why": "Sound is audio."},
                  {"pic": "\U0001F4F7", "label": "a photo of your dog", "bin": "image", "why": "A picture is an image."},
                  {"pic": "\U0001F3A5", "label": "a film of sports day", "bin": "video", "why": "Moving pictures with sound: video."},
                  {"pic": "\U0001F3AE", "label": "a racing game", "bin": "game", "why": "A game file."},
                  {"pic": "\U0001F3B6", "label": "a song", "bin": "audio", "why": "Sound is audio."},
                  {"pic": "\U0001F3A8", "label": "a drawing you made on the tablet", "bin": "image", "why": "A picture: image."},
                  {"pic": "\U0001F4DD", "label": "your list of spellings", "bin": "text", "why": "Words: text."},
              ]},
             "Every file has a type."),

        step("questions", "Check: systems", "\U0001F4DD", "System checker", ["3CS.01", "3CS.02", "3CS.03", "3CS.04"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Systems, roles, inputs, files."], [], ["Read, think, tap."]),
             {"items": [
                 q("Hardware and software together make...", "\U0001F5A5️", "a working system", ["a network", "a file", "a bug"], "Neither works alone."),
                 q("A thermometer sensor sending the temperature by itself is...", "\U0001F321️", "an automatic input", ["a manual input", "an output", "software"], "No person needed: automatic."),
                 q("A song saved on the hard drive is...", "\U0001F3B5", "an audio file", ["a text file", "a video file", "a game file"], "Sound is audio."),
             ]},
             "System, role, input, file."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CS.01", "3CS.02", "3CS.03", "3CS.04"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about the system, the roles, manual and automatic, and file types."], [], ["Read, look, tap."]),
             {"items": [
                 q("You press K and a K appears on screen. What sits between the key and the screen?", "⚙️", "software: the operating system and the app", ["nothing", "another keyboard", "the printer"], "Software is in the middle."),
                 q("Whose job is deciding which picture to show?", "\U0001F3A8", "software", ["hardware", "the cable", "the desk"], "Deciding is software's role."),
                 q("Whose job is lighting up the pixels?", "\U0001F5A5️", "hardware: the screen", ["software", "the file", "the network"], "Showing is hardware's role."),
                 q("Which is a MANUAL input?", "\U0001F590️", "a keyboard", ["a temperature sensor", "a light sensor", "a barcode scanner"], "A person presses the keys."),
                 q("Which is an AUTOMATIC input?", "\U0001F916", "a sensor that spots you at an automatic door", ["a mouse", "a touchscreen", "a microphone you speak into"], "It senses by itself."),
                 q("A film of sports day is stored as...", "\U0001F3AC", "a video file", ["a text file", "an audio file", "a game"], "Moving pictures and sound."),
                 q("A computer with software but no hardware...", "\U0001F4BF", "cannot run: there is nothing to run it on", ["works perfectly", "is faster", "is a network"], "Software needs hardware."),
                 q("Where are files kept when the computer is off?", "\U0001F4BE", "on the hard drive", ["on the screen", "in the keyboard", "in the air"], "The hard drive stores files."),
             ]},
             "That is the whole lesson finished. You know the system, the roles, the inputs and the files."),
    ],
}


LESSON["about"] = [
    "Explain how hardware and software combine into a working system.",
    "Compare the roles hardware and software perform.",
    "Tell a manual input device from an automatic one.",
    "Name the types of file a computer stores: text, audio, image, video, games.",
]

LESSON["lecture"] = [
    part("\U0001F5A5️", "One system",
         "A keyboard with no software is a box of buttons; a program with no hardware has nowhere to run. Press K and the keyboard (hardware) sends a signal, the operating system and the app (software) decide what it means, and the screen (hardware) shows the K. Hardware and software combine into one working system."),
    part("\U0001F91D", "Different roles",
         "Hardware senses, shows, stores and sounds: the keyboard feels the key, the screen lights the pixels, the hard drive keeps the files. Software decides and calculates: which picture to show, what 37 plus 48 is, where the letter goes. Every job has both halves."),
    part("\U0001F500", "Manual and automatic inputs",
         "A manual input needs a person: a keyboard, a mouse, a touchscreen, a microphone you speak into. An automatic input senses by itself: a thermometer, a light sensor, a barcode scanner, the sensor on an automatic door. Neither is better; each fits its job."),
    part("\U0001F4BE", "Files",
         "The hard drive keeps files, and files have types. Text holds words. Audio holds sound. Image holds a picture. Video holds moving pictures with sound. A game file holds a game. The type decides what the file holds and which program opens it."),
]

LESSON["words"] = [
    word("system", "\U0001F5A5️", "Hardware and software working together as one thing.",
         ["A computer is a system.", "Hardware and software form a working system."]),
    word("operating system", "⚙️", "The software that runs the computer and passes inputs to apps.",
         ["The operating system starts first.", "The operating system received the key press."]),
    word("manual", "\U0001F590️", "Done by a person.",
         ["A keyboard is a manual input.", "Manual means a person does it."]),
    word("automatic", "\U0001F916", "Done by itself, with no person.",
         ["A light sensor is an automatic input.", "The door opened automatically."]),
    word("file", "\U0001F4C4", "A thing saved on a computer: a story, a song, a photo.",
         ["Save the file.", "What type of file is it?"]),
    word("hard drive", "\U0001F4BE", "The hardware that keeps files when the power is off.",
         ["The photos are on the hard drive.", "The hard drive is full."]),
]

LESSON["home"] = [
    home("Follow the key press", "A grown-up, a computer",
         ["Press a key and say each thing that happens, in order: key, signal, operating system, app, screen.",
          "Which parts are hardware? Which are software?",
          "Try it with a tap on a tablet."],
         "Hardware, software, hardware: one system."),
    home("Manual or automatic hunt", "A grown-up, a walk round the house and the street",
         ["Find five inputs. A light switch, a doorbell, a street lamp's light sensor, a thermostat, a phone screen.",
          "For each one: does a person work it, or does it sense by itself?",
          "Which automatic input would you miss most if it were manual?"],
         "Manual needs a person; automatic does not."),
]
