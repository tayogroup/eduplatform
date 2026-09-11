# -*- coding: utf-8 -*-
"""Lesson 13 - Software, Sensors and Files.

0059 Stage 4 Computer Systems: 4CS.02 the functions of application and
systems software; 4CS.03 data recorded by input devices, including sensors
and data loggers; 4CS.04 information communicated by output devices; 4CS.05
different types of file have different sizes.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "software-sensors-and-files",
    "title": "Software, Sensors and Files",
    "blurb": "Split software into the applications you use and the system software underneath, watch input devices record data and output devices communicate information, and put files in order of size.",
    "steps": [
        step("context", "Two kinds of software", "\U0001F4BF", "Software sorter", ["4CS.02"],
             "<b>Application software</b> does a job for you: draw, write, play. <b>Systems software</b> runs the computer itself so applications can work. Tap each.",
             explain(
                 ["An application is a program you choose to use for a task. Systems software is the program underneath that starts the computer, runs the screen and keyboard, keeps the files and shares the machine between applications."],
                 ["Paint, a browser, a game: applications.", "The operating system - the thing that starts up when you press power - is systems software.", "A printer driver, which lets the computer talk to the printer, is systems software too."],
                 ["Children think the operating system is just the desktop picture.", "It is the program that runs everything else."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F3A8", "label": "application: Paint", "say": "Paint. An application: a program you open to do a job, drawing."},
                 {"pic": "\U0001F310", "label": "application: a browser", "say": "A browser. An application for reading web pages. Games and writing programs are applications too."},
                 {"pic": "⚙️", "label": "systems: the operating system", "say": "The operating system. Systems software. It starts when you press power, runs the screen, the keyboard and the mouse, keeps the files in folders, and lets applications run."},
                 {"pic": "\U0001F5A8️", "label": "systems: a driver", "say": "A driver. Systems software that lets the computer talk to one piece of hardware, like a printer or a camera."},
                 {"pic": "\U0001F4C2", "label": "systems: the file manager", "say": "The file manager. Systems software that keeps every file in its folder and finds it again."},
             ], "need": 5,
              "then": {"ask": "What does systems software do?",
                       "opts": [opt("Runs the computer itself so applications can work", True), opt("Draws pictures", False), opt("Plays games", False)],
                       "why": "Applications do jobs for you; systems software runs the machine underneath."}},
             "Applications do jobs; systems software runs the machine."),

        step("sort", "Application, or systems software?", "\U0001F5C2️", "Software sorter", ["4CS.02"],
             "Is this a program you use for a job, or software that runs the computer itself?",
             explain(
                 ["Application: you open it to do something.", "Systems: it runs underneath, whether you open anything or not."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Application, or systems software?",
              "bins": [{"id": "app", "label": "Application", "pic": "\U0001F3A8"}, {"id": "sys", "label": "Systems software", "pic": "⚙️"}],
              "items": [
                  {"pic": "\U0001F3A8", "label": "a drawing program", "bin": "app", "why": "A job for you."},
                  {"pic": "⚙️", "label": "the operating system that starts the computer", "bin": "sys", "why": "Runs the machine."},
                  {"pic": "\U0001F3AE", "label": "a game", "bin": "app", "why": "You open it to play."},
                  {"pic": "\U0001F5A8️", "label": "the driver that talks to the printer", "bin": "sys", "why": "Hardware talk, underneath."},
                  {"pic": "\U0001F310", "label": "a web browser", "bin": "app", "why": "A job: reading pages."},
                  {"pic": "\U0001F4C2", "label": "the program that keeps files in folders", "bin": "sys", "why": "The file manager runs underneath."},
                  {"pic": "✏️", "label": "a writing program", "bin": "app", "why": "You open it to write."},
                  {"pic": "\U0001F504", "label": "the program that shares the screen between open apps", "bin": "sys", "why": "Part of the operating system."},
              ]},
             "Open it for a job: application. Runs underneath: systems."),

        step("io", "Data in, information out", "\U0001F500", "In-out recorder", ["4CS.03", "4CS.04"],
             "Input devices RECORD data, including sensors and data loggers that record by themselves. Output devices COMMUNICATE information. Tap each device.",
             explain(
                 ["An input device records data: letters from a keyboard, a temperature from a sensor, a whole day of readings from a data logger.",
                  "An output device communicates information: words and pictures on a screen, sound from a speaker, a page from a printer."],
                 ["A data logger is a sensor with a memory: it records the temperature every minute all night, so you can see when the greenhouse got cold.",
                  "A warning light is an output: one red light tells you the battery is low."],
                 ["Children think only keyboards are inputs.", "Sensors and loggers are inputs that record without a person."],
                 ["Tap all nine, then answer."]),
             {"need": 9, "devices": [
                 {"id": "keyboard", "pic": "⌨️", "label": "keyboard", "kind": "input", "does": "Records the letters a person types.", "shows": "h e l l o", "sound": "type"},
                 {"id": "thermo", "pic": "\U0001F321️", "label": "temperature sensor", "kind": "input", "does": "Records how warm it is, by itself: one reading.", "shows": "21°C", "sound": "ding"},
                 {"id": "logger", "pic": "\U0001F4C8", "label": "data logger", "kind": "input", "does": "Records reading after reading, all day and all night, and keeps them.", "shows": "20° 21° 21° 22°", "sound": "ding"},
                 {"id": "motion", "pic": "\U0001F3C3", "label": "motion sensor", "kind": "input", "does": "Records that something moved in front of it.", "shows": "moved!", "sound": "pop"},
                 {"id": "camera", "pic": "\U0001F4F7", "label": "camera", "kind": "input", "does": "Records a picture as data.", "shows": "\U0001F5BC️", "sound": "click"},
                 {"id": "mic", "pic": "\U0001F3A4", "label": "microphone", "kind": "input", "does": "Records sound as data.", "shows": "\U0001F3B5 hello", "sound": "ding"},
                 {"id": "screen", "pic": "\U0001F5A5️", "label": "screen", "kind": "output", "does": "Communicates words and pictures: today it is 22 degrees.", "shows": "22°C today", "sound": "pop"},
                 {"id": "speaker", "pic": "\U0001F50A", "label": "speaker", "kind": "output", "does": "Communicates sound: a beep, a voice, music.", "shows": "\U0001F514 ding", "sound": "beep"},
                 {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "kind": "output", "does": "Communicates information on paper.", "shows": "\U0001F4C4", "sound": "print"},
             ]},
             "Inputs record data; outputs communicate information."),

        step("sort", "Recorded, or communicated?", "\U0001F5C2️", "In-out sorter", ["4CS.03", "4CS.04"],
             "Is this DATA being recorded by an input device, or INFORMATION being communicated by an output device?",
             explain(
                 ["Recorded: it goes IN, from a person or a sensor.", "Communicated: it comes OUT, to a person."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Recorded by an input, or communicated by an output?",
              "bins": [{"id": "in", "label": "Recorded (input)", "pic": "\U0001F4E5"}, {"id": "out", "label": "Communicated (output)", "pic": "\U0001F4E4"}],
              "items": [
                  {"pic": "\U0001F321️", "label": "a sensor records 21 degrees", "bin": "in", "why": "Data in."},
                  {"pic": "\U0001F5A5️", "label": "the screen shows the weather map", "bin": "out", "why": "Information out."},
                  {"pic": "\U0001F4C8", "label": "a data logger records the temperature every minute all night", "bin": "in", "why": "Readings in, over time."},
                  {"pic": "\U0001F50A", "label": "the speaker says 'battery low'", "bin": "out", "why": "Told to you."},
                  {"pic": "\U0001F4F7", "label": "the camera takes a photo", "bin": "in", "why": "A picture recorded."},
                  {"pic": "\U0001F5A8️", "label": "the printer prints the class list", "bin": "out", "why": "On paper, for you."},
                  {"pic": "\U0001F3C3", "label": "a motion sensor notices someone at the door", "bin": "in", "why": "Recorded, by itself."},
                  {"pic": "\U0001F534", "label": "a red light warns the fridge door is open", "bin": "out", "why": "One light, one piece of information."},
              ]},
             "In records; out communicates."),

        step("context", "File sizes", "\U0001F4E6", "Size thinker", ["4CS.05"],
             "Different types of file take up different amounts of space. Tap each to see roughly how big it is.",
             explain(
                 ["File size is measured in bytes: a kilobyte is about a thousand, a megabyte about a million, a gigabyte about a thousand million."],
                 ["A page of text is a few kilobytes: letters are small.", "A photo is a few megabytes: millions of coloured dots.",
                  "A song is a few megabytes: thousands of sounds a second.", "A film is gigabytes: many pictures every second, plus the sound.", "A game can be a few megabytes or many gigabytes."],
                 ["Children think a long story is bigger than a photo.", "A whole book of text is smaller than one photo."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F4C4", "label": "text: kilobytes", "sub": "a story, about 20 KB", "say": "A text file. A story of ten pages is about twenty kilobytes. Letters take almost no space."},
                 {"pic": "\U0001F5BC️", "label": "image: megabytes", "sub": "a photo, about 3 MB", "say": "An image file. A photo is about three megabytes: millions of coloured dots, each one stored."},
                 {"pic": "\U0001F3B5", "label": "audio: megabytes", "sub": "a song, about 5 MB", "say": "An audio file. A three-minute song is about five megabytes: thousands of sound samples every second."},
                 {"pic": "\U0001F3AC", "label": "video: gigabytes", "sub": "a film, about 2 GB", "say": "A video file. A film is about two gigabytes: a picture twenty-five times a second, plus the sound, for two hours."},
                 {"pic": "\U0001F3AE", "label": "game: megabytes to gigabytes", "sub": "a game, from a few MB to 50 GB", "say": "A game file. A small puzzle game is a few megabytes; a big console game can be fifty gigabytes, because it holds pictures, sounds, music and the program together."},
             ], "need": 5,
              "then": {"ask": "Of these three, which is usually the BIGGEST file?",
                       "opts": [opt("A video", True), opt("A text story", False), opt("A photo", False)],
                       "why": "Pictures every second plus sound: gigabytes."}},
             "Text is tiny; video is huge."),

        step("order", "Smallest to biggest", "\U0001F4CF", "Size orderer", ["4CS.05"],
             "Put the four files in order of size, smallest first.",
             explain(
                 ["Text, then a picture, then a song, then a film."],
                 ["A story: kilobytes. A photo: a few megabytes. A song: a few more megabytes. A film: gigabytes."],
                 ["Children put the long story last because it has the most pages.", "Pages of letters are still tiny beside one photo."],
                 ["Tap the smallest first."]),
             {"items": [
                 s("text", "story.txt: a ten-page story", "\U0001F4C4"),
                 s("image", "photo.jpg: one photo", "\U0001F5BC️"),
                 s("audio", "song.mp3: a three-minute song", "\U0001F3B5"),
                 s("video", "film.mp4: a two-hour film", "\U0001F3AC"),
             ],
              "extras": [
                  {"label": "an empty folder", "pic": "\U0001F4C1", "why": "An empty folder holds no file, so it has no size to order."},
              ]},
             "Text, image, audio, video: small to large."),

        step("questions", "Check: software, sensors, files", "\U0001F4DD", "System checker", ["4CS.02", "4CS.03", "4CS.04", "4CS.05"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Two kinds of software, in and out, file sizes."], [], ["Read, think, tap."]),
             {"items": [
                 q("The operating system is...", "⚙️", "systems software that runs the computer", ["an application for drawing", "a game", "a file"], "It runs underneath everything."),
                 q("A data logger...", "\U0001F4C8", "records readings over time by itself", ["prints pages", "shows the weather", "plays music"], "A sensor with a memory."),
                 q("Which file is smallest?", "\U0001F4C4", "a ten-page story", ["a photo", "a song", "a film"], "Text is tiny."),
             ]},
             "Software, data, information, size."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CS.02", "4CS.03", "4CS.04", "4CS.05"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Application and systems software, inputs and outputs, file sizes."], [], ["Read, look, tap."]),
             {"items": [
                 q("A web browser is...", "\U0001F310", "application software", ["systems software", "a driver", "hardware"], "A program for a job."),
                 q("The driver that lets the computer talk to the printer is...", "\U0001F5A8️", "systems software", ["application software", "a game", "a file"], "It runs underneath."),
                 q("Which input device records by itself, without a person?", "\U0001F321️", "a temperature sensor", ["a keyboard", "a mouse", "a touchscreen"], "A sensor."),
                 q("Which is INFORMATION communicated by an output device?", "\U0001F5A5️", "the screen showing 22 degrees", ["a sensor reading 22 degrees", "a key being pressed", "a photo being taken"], "Out, to a person."),
                 q("A file of one photo is about...", "\U0001F5BC️", "a few megabytes", ["a few kilobytes", "a few gigabytes", "nothing"], "Millions of dots."),
                 q("A two-hour film is about...", "\U0001F3AC", "gigabytes", ["kilobytes", "one megabyte", "the same as a story"], "Pictures every second plus sound."),
                 q("From smallest to biggest, the usual order is...", "\U0001F4CF", "text, image, audio, video", ["video, audio, image, text", "image, text, video, audio", "audio, text, image, video"], "Letters, dots, sounds, moving pictures."),
             ]},
             "That is the whole lesson finished. You know the two kinds of software, what goes in and out, and how big files are."),
    ],
}


LESSON["about"] = [
    "Tell application software from systems software and say what each does.",
    "Name the data that input devices, sensors and data loggers record.",
    "Name the information that output devices communicate.",
    "Put text, image, audio and video files in order of size.",
]

LESSON["lecture"] = [
    part("\U0001F3A8", "Application software",
         "An application is a program you open to do a job: Paint to draw, a browser to read pages, a game to play, a writing program to write. Applications do jobs for you."),
    part("⚙️", "Systems software",
         "Systems software runs the computer itself. The operating system starts when you press power, runs the screen, keyboard and mouse, keeps files in folders and shares the machine between applications. Drivers let it talk to the printer or the camera. It runs underneath, whether you open anything or not."),
    part("\U0001F500", "Data in, information out",
         "Input devices record data: a keyboard records letters, a sensor records a temperature, a data logger records reading after reading all night. Output devices communicate information: a screen shows the weather, a speaker says battery low, a printer puts the class list on paper."),
    part("\U0001F4E6", "File sizes",
         "Different files are different sizes. A story is kilobytes: letters are tiny. A photo is megabytes: millions of dots. A song is megabytes: thousands of sounds a second. A film is gigabytes: pictures every second plus sound. Text, image, audio, video, smallest to biggest."),
]

LESSON["words"] = [
    word("application software", "\U0001F3A8", "A program you open to do a job.",
         ["Paint is application software.", "A browser is an application."]),
    word("systems software", "⚙️", "The software that runs the computer itself, such as the operating system.",
         ["The operating system is systems software.", "Systems software runs underneath."]),
    word("operating system", "\U0001F5A5️", "The systems software that starts the computer and runs everything else.",
         ["The operating system starts up first.", "Every computer has an operating system."]),
    word("data logger", "\U0001F4C8", "A sensor that records readings over time and keeps them.",
         ["The data logger recorded all night.", "Read the data logger in the morning."]),
    word("kilobyte", "\U0001F4C4", "About a thousand bytes: the size of a page of text.",
         ["A story is a few kilobytes.", "KB is short for kilobyte."]),
    word("megabyte", "\U0001F5BC️", "About a million bytes: the size of a photo or a song.",
         ["A photo is three megabytes.", "MB is short for megabyte."]),
    word("gigabyte", "\U0001F3AC", "About a thousand million bytes: the size of a film.",
         ["A film is two gigabytes.", "GB is short for gigabyte."]),
]

LESSON["home"] = [
    home("Find the sizes", "A computer, a grown-up",
         ["With a grown-up, find a text file, a photo, a song and a video on the computer.",
          "Look at each file's size: KB, MB or GB?",
          "Put them in order. Was the long story really the smallest?"],
         "Text, image, audio, video."),
    home("Application or systems?", "A tablet, a grown-up",
         ["List every app on the home screen. Those are applications.",
          "Ask a grown-up what the operating system is called.",
          "What happens when it updates? That is systems software changing underneath."],
         "Apps on top, systems underneath."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you wrote and read messages in the Caesar and Pigpen ciphers, and saw that the key is what makes a cipher work and what makes it fail."
LESSON["warmup"] = [
    q("Which usually takes up more space on a tablet: a photo or a short note?", "\U0001F4F7", "the photo", ["the note", "they are always the same size", "neither takes any space"], "A picture holds far more data than a few words of text."),
    q("A weather station records the temperature every hour all night, with nobody there. What is recording it?", "\U0001F4C8", "a data logger with a temperature sensor", ["a person with a pencil", "the moon", "a printer"], "A data logger records a sensor's readings by itself, over time."),
]
