# -*- coding: utf-8 -*-
"""Lesson 7 - Press, Shake, Clap.

0059 Stage 3 Programming: 3P.06 programs that produce an output from an
input device; 3P.10 programs for a physical computing device to produce
outputs; 3P.09 test and debug; Computer Systems 3CS.05 computers can be
programmed to control machines and other physical objects.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "press-shake-clap",
    "title": "Press, Shake, Clap",
    "blurb": "Meet Bitsy, a small physical computer with lights, a speaker and a motor, and program it so that a press, a shake or a clap makes something happen.",
    "steps": [
        step("explore", "Meet Bitsy", "\U0001F4DF", "Bitsy explorer", ["3P.10", "3P.06"],
             "Bitsy is a tiny computer you can hold. It has inputs you press and outputs it makes. Tap each part.",
             explain(
                 ["A physical computing device is a small computer with real inputs and outputs on it: buttons, sensors, lights, a speaker."],
                 ["Button A is an input: you press it.", "The shake sensor is an input: it feels a shake.", "The microphone is an input: it hears a clap.",
                  "The lights, the speaker, the motor and the bell are outputs: the program makes them do something."],
                 ["Children think a device with no screen is not a computer.", "It runs programs. It is a computer."],
                 ["Tap all seven parts."]),
             {"items": [
                 {"pic": "\U0001F170️", "label": "button A", "sub": "input", "say": "Button A. An input. Press it and the program can feel it."},
                 {"pic": "\U0001F4F3", "label": "shake sensor", "sub": "input", "say": "The shake sensor. An input. Shake Bitsy and the program knows."},
                 {"pic": "\U0001F3A4", "label": "microphone", "sub": "input", "say": "The microphone. An input. Clap, and the program hears it."},
                 {"pic": "\U0001F4A1", "label": "the 25 lights", "sub": "output", "say": "Twenty-five little lights in a grid. An output. The program can draw a heart or a smile on them."},
                 {"pic": "\U0001F50A", "label": "the speaker", "sub": "output", "say": "The speaker. An output. It beeps when the program says so."},
                 {"pic": "⚙️", "label": "the motor", "sub": "output", "say": "The motor. An output. It can turn a wheel, a fan, a door."},
                 {"pic": "\U0001F514", "label": "the bell", "sub": "output", "say": "The bell. An output. It rings when the program tells it to."},
             ], "need": 7,
              "then": {"ask": "Which of these is an INPUT on Bitsy?",
                       "opts": [opt("Button A", True), opt("The lights", False), opt("The motor", False)],
                       "why": "You press button A: information goes IN. Lights and motors are outputs."}},
             "Inputs you press; outputs it makes."),

        step("device", "When you press A", "\U0001F170️", "Bitsy programmer", ["3P.06", "3P.10", "3P.09"],
             "Build the program: a <b>when</b> block first, then the outputs. Then press that input on Bitsy and watch.",
             explain(
                 ["A program for a device starts with WHEN: when button A is pressed, when it is shaken, when it hears a clap. That is the input.", "Then come the outputs: show a heart, beep."],
                 ["When button A is pressed, show a heart, beep.", "Build it, then press A on the board. If you shake it instead, nothing happens: the program is waiting for A."],
                 ["Children put the when block at the end.", "It goes first. Nothing can start before the input."],
                 ["When block, outputs, then press the right input."]),
             {"rounds": [
                 {"algorithm": ["When button A is pressed", "Show a heart", "Beep"], "expect": ["whenA", "heart", "beep"]},
                 {"algorithm": ["When it is shaken", "All lights on", "Beep", "All lights off"], "expect": ["whenShake", "light", "beep", "dark"]},
                 {"algorithm": ["When it hears a clap", "Show a smile", "Beep"], "expect": ["whenClap", "smile", "beep"]},
             ]},
             "Three inputs, three programs, outputs every time."),

        step("explore", "Computers that control machines", "\U0001F3ED", "Machine controller", ["3CS.05"],
             "A computer can control real machines and physical things. Tap each one.",
             explain(
                 ["A program does not only draw on a screen. Through a motor, a switch or a valve it can move real things."],
                 ["Traffic lights: a program decides when red turns to green.", "An automatic door: a sensor sees you, a program opens it.",
                  "A washing machine: a program turns the drum, lets in water, heats it.", "A lift: a program takes it to the floor you pressed."],
                 ["Children think a machine 'just works'.", "Inside is a small computer following a program."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "\U0001F6A6", "label": "traffic lights", "say": "Traffic lights. A program switches red, amber, green in order, and holds green longer on the busy road."},
                 {"pic": "\U0001F6AA", "label": "an automatic door", "say": "An automatic door. A sensor is the input; the program turns a motor and the door opens."},
                 {"pic": "\U0001F9FA", "label": "a washing machine", "say": "A washing machine. Its program turns the drum, lets water in, heats it, spins. You chose the setting: that was the input."},
                 {"pic": "\U0001F3E2", "label": "a lift", "say": "A lift. You press 3, the input. The program moves the lift to floor 3 and opens the doors."},
                 {"pic": "\U0001F4A1", "label": "a smart light", "say": "A smart light. A program turns it on at sunset and off at bedtime."},
                 {"pic": "\U0001F6B2", "label": "a robot lawnmower", "say": "A robot lawnmower. A program drives it round the grass and back to its charger."},
             ], "need": 6,
              "then": {"ask": "What does the computer inside a washing machine do?",
                       "opts": [opt("Follows a program that controls the drum, the water and the heat", True), opt("Washes the clothes by hand", False), opt("Nothing; the machine just works", False)],
                       "why": "A program controls the machine's parts, one instruction at a time."}},
             "A program can move real things."),

        step("device", "Control a machine", "⚙️", "Machine programmer", ["3CS.05", "3P.10", "3P.06"],
             "Bitsy's motor and bell are machines. Program an input to control them.",
             explain(
                 ["The motor and the bell are physical things. A program turns them on, the way a program opens an automatic door."],
                 ["When button A is pressed, turn the motor, ring the bell: a fan that spins and a bell that rings, from one press.",
                  "When it hears a clap, all lights on, turn the motor: clap, and a machine starts."],
                 [],
                 ["When block, outputs, press the input."]),
             {"rounds": [
                 {"algorithm": ["When button A is pressed", "Turn the motor", "Ring the bell"], "expect": ["whenA", "motor", "bell"]},
                 {"algorithm": ["When it hears a clap", "All lights on", "Turn the motor"], "expect": ["whenClap", "light", "motor"]},
                 {"algorithm": ["When it is shaken", "Ring the bell", "Show a heart", "Ring the bell"], "expect": ["whenShake", "bell", "heart", "bell"]},
             ]},
             "An input controls a machine."),

        step("sort", "Input, or output?", "\U0001F5C2️", "Bitsy sorter", ["3P.06", "3P.10"],
             "On a physical device, is this an input (goes in) or an output (comes out)?",
             explain(
                 ["Input: something the device senses. Output: something the device does."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Input, or output?",
              "bins": [{"id": "in", "label": "Input", "pic": "\U0001F4E5"}, {"id": "out", "label": "Output", "pic": "\U0001F4E4"}],
              "items": [
                  {"pic": "\U0001F170️", "label": "a button you press", "bin": "in", "why": "The device senses the press: input."},
                  {"pic": "\U0001F4A1", "label": "a light that comes on", "bin": "out", "why": "The device does it: output."},
                  {"pic": "\U0001F4F3", "label": "a shake", "bin": "in", "why": "Sensed: input."},
                  {"pic": "\U0001F50A", "label": "a beep", "bin": "out", "why": "Made: output."},
                  {"pic": "\U0001F3A4", "label": "a clap heard by the microphone", "bin": "in", "why": "Sensed: input."},
                  {"pic": "⚙️", "label": "a motor turning", "bin": "out", "why": "Done: output."},
                  {"pic": "\U0001F321️", "label": "a temperature sensor feeling cold", "bin": "in", "why": "Sensed: input."},
                  {"pic": "\U0001F514", "label": "a bell ringing", "bin": "out", "why": "Done: output."},
              ]},
             "Sensed: input. Done: output."),

        step("questions", "Check: Bitsy", "\U0001F4DD", "Bitsy checker", ["3P.06", "3P.10", "3CS.05"],
             "Three quick questions.",
             explain(["Nothing new here."], ["When blocks, inputs, outputs, machines."], [], ["Read, think, tap."]),
             {"items": [
                 q("A device program starts with...", "\U0001F170️", "a when block that names the input", ["a beep", "the lights", "the end"], "Nothing starts before the input."),
                 q("The program says 'when button A is pressed'. You shake Bitsy. What happens?", "\U0001F4F3", "nothing: the program is waiting for A", ["a heart appears", "it beeps", "the motor turns"], "The wrong input starts nothing."),
                 q("A program turning a motor to open a door is an example of...", "\U0001F6AA", "a computer controlling a physical object", ["a game", "a spreadsheet", "a network"], "Programs can control real things."),
             ]},
             "When, input, output, machine."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3P.06", "3P.09", "3P.10", "3CS.05"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about Bitsy's inputs and outputs, when blocks and machines."], [], ["Read, look, tap."]),
             {"items": [
                 q("Bitsy is...", "\U0001F4DF", "a small physical computer with inputs and outputs on it", ["a toy with no computer inside", "a kind of screen", "a network"], "It runs programs: it is a computer."),
                 q("Which is an OUTPUT on Bitsy?", "\U0001F4E4", "the speaker", ["button A", "the shake sensor", "the microphone"], "The speaker makes sound: output."),
                 q("'When it hears a clap, show a smile.' The input is...", "\U0001F3A4", "the clap", ["the smile", "the lights", "the motor"], "The when block names the input."),
                 q("Where does the when block go?", "1️⃣", "first", ["last", "in the middle", "anywhere"], "The input starts the program."),
                 q("A lift going to the floor you pressed is...", "\U0001F3E2", "a computer controlling a machine from an input", ["magic", "a person pulling a rope", "a network"], "Press is the input; the program moves the lift."),
                 q("You built the program and pressed A, but the outputs were wrong. You should...", "\U0001F41E", "change the blocks and press A again to test", ["give up", "shake it harder", "add another when block"], "Test, fix, test again."),
                 q("Which of these can a program control?", "⚙️", "a motor, a light, a bell", ["only a screen", "nothing real", "only sounds"], "Programs control physical objects through outputs."),
             ]},
             "That is the whole lesson finished. You program a physical device: an input in, outputs out."),
    ],
}


LESSON["about"] = [
    "Name the inputs and outputs on a physical computing device.",
    "Write a program that produces an output when an input device is used.",
    "Program a physical device to make outputs: lights, sound, a motor.",
    "Explain that computers can be programmed to control machines.",
]

LESSON["lecture"] = [
    part("\U0001F4DF", "A computer you can hold",
         "Bitsy is a physical computing device: a small computer with real inputs and outputs on it. Button A, a shake sensor and a microphone are inputs. Twenty-five lights, a speaker, a motor and a bell are outputs."),
    part("\U0001F170️", "When",
         "A device program starts with a when block: when button A is pressed, when it is shaken, when it hears a clap. That names the input. Then come the outputs. Press the wrong input and nothing happens, because the program is waiting for the right one."),
    part("\U0001F4A1", "Outputs",
         "Show a heart, beep, all lights on, turn the motor, ring the bell. Each output block makes the device do one real thing, in order, when its input arrives."),
    part("\U0001F3ED", "Controlling machines",
         "A program is not only for screens. Through a motor or a switch it moves real things: traffic lights change, an automatic door opens, a washing machine spins, a lift climbs. Inside each is a small computer following a program."),
]

LESSON["words"] = [
    word("device", "\U0001F4DF", "A small computer with inputs and outputs you can hold.",
         ["Bitsy is a physical computing device.", "Program the device."]),
    word("sensor", "\U0001F4F3", "An input that senses something: a shake, a sound, heat.",
         ["The shake sensor is an input.", "A sensor tells the program what is happening."]),
    word("when", "\U0001F170️", "The block that names the input that starts a program.",
         ["When button A is pressed.", "The when block goes first."]),
    word("motor", "⚙️", "An output that turns, to move something.",
         ["The motor opens the door.", "Turn the motor."]),
    word("control", "\U0001F3AE", "To make a machine do what the program says.",
         ["A program controls the traffic lights.", "Computers control machines."]),
]

LESSON["home"] = [
    home("Input, output hunt", "A walk round the house",
         ["Find five machines with a computer inside: a microwave, a washing machine, a TV, a thermostat.",
          "For each, say the input (what you press or it senses) and the output (what it does).",
          "Which one has the most outputs?"],
         "Every machine with a program has inputs and outputs."),
    home("Be Bitsy", "A partner",
         ["Agree a program: when I clap, you jump; when I tap your shoulder, you say beep.",
          "Give the inputs in a random order. Does your partner give only the right output?",
          "Swap."],
         "The right input, the right output."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you ran two programs at once, kept one object still, and saw why programmers work together and learn from mistakes."
LESSON["warmup"] = [
    q("You press a button on a toy and it lights up. The press is the...", "\U0001F518", "input", ["output", "battery", "box"], "The press goes in; the light comes out."),
    q("Which of these has a small computer inside it running a program?", "\U0001F9FA", "a washing machine", ["a wooden spoon", "a pebble", "a paper cup"], "A program inside runs each wash."),
]
