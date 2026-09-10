# -*- coding: utf-8 -*-
"""Lesson 7 - Bitsy Loops.

0059 Stage 4 Programming: 4P.08 develop programs for a physical computing
device to produce outputs from its input devices, including sensors; 4P.09
programs for a physical device using count-controlled and forever loops;
Computer Systems 4CS.01 identify examples where a control system is used.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "bitsy-loops",
    "title": "Bitsy Loops",
    "blurb": "Program Bitsy from its temperature and light sensors, put a repeat loop and a forever loop into a device program, and spot the control systems that run things around you the same way.",
    "steps": [
        step("explore", "Bitsy's sensors", "\U0001F321️", "Sensor finder", ["4P.08"],
             "Bitsy has two sensors as well as its button, shake sensor and microphone. A sensor is an input that senses by itself. Tap each input.",
             explain(
                 ["A sensor is an input device that measures something without anyone pressing it: heat, light, movement, sound."],
                 ["The temperature sensor feels how warm it is. When it gets hot, a program can start a fan.", "The light sensor sees how bright it is. When it gets dark, a program can turn on a light."],
                 ["Children think a sensor is a button.", "Nobody presses a sensor. It senses, all the time."],
                 ["Tap all five inputs."]),
             {"items": [
                 {"pic": "\U0001F170️", "label": "button A", "sub": "input: pressed", "say": "Button A. An input a person presses."},
                 {"pic": "\U0001FAE8", "label": "shake sensor", "sub": "input: a shake", "say": "The shake sensor. It feels a shake."},
                 {"pic": "\U0001F3A4", "label": "microphone", "sub": "input: a clap", "say": "The microphone. It hears a clap."},
                 {"pic": "\U0001F321️", "label": "temperature sensor", "sub": "input: hot or cold", "say": "The temperature sensor. It feels how warm it is, all by itself. When it gets hot, the program can act."},
                 {"pic": "\U0001F319", "label": "light sensor", "sub": "input: bright or dark", "say": "The light sensor. It sees how bright it is. Cover it and it gets dark, and the program can act."},
             ], "need": 5,
              "then": {"ask": "What makes a sensor different from a button?",
                       "opts": [opt("A sensor senses by itself; nobody has to press it", True), opt("A sensor is an output", False), opt("A sensor is bigger", False)],
                       "why": "Heat and light are sensed automatically, all the time."}},
             "Five inputs, two of them sensors."),

        step("device", "When it gets hot, when it gets dark", "\U0001F321️", "Sensor programmer", ["4P.08"],
             "Build each program: a <b>when</b> block for the sensor first, then the outputs. Then warm Bitsy or cover it and watch.",
             explain(
                 ["A program for a sensor starts with WHEN the sensor senses something: when it gets hot, when it gets dark."],
                 ["When it gets hot, turn the motor, show a smile: a fan that starts itself.", "When it gets dark, all lights on, beep: a night light."],
                 ["Children press A to test a sensor program.", "The program is waiting for heat or dark, not a press. Use the right input."],
                 ["When block, outputs, then the right input."]),
             {"rounds": [
                 {"algorithm": ["When it gets hot", "Turn the motor", "Show a smile"], "expect": ["whenHot", "motor", "smile"]},
                 {"algorithm": ["When it gets dark", "All lights on", "Beep"], "expect": ["whenDark", "light", "beep"]},
                 {"algorithm": ["When it gets hot", "Beep", "Ring the bell", "All lights on"], "expect": ["whenHot", "beep", "bell", "light"]},
             ]},
             "Two sensors, three programs: a fan and a night light."),

        step("device", "Loops on the device", "\U0001F501", "Loop programmer", ["4P.09", "4P.08"],
             "Now with loops. A <b>repeat</b> block repeats the output after it a counted number of times; a <b>forever</b> block repeats everything after it until you press Stop.",
             explain(
                 ["On a device a count-controlled loop beeps three times and stops.", "A forever loop keeps going: lights on, wait, lights off, wait, round and round, until Stop."],
                 ["When A is pressed, repeat 3 times, beep: three beeps.", "When it gets dark, forever: lights on, wait, lights off, wait. A flashing light that never stops on its own."],
                 ["Children put the loop block last.", "A loop needs something after it to repeat."],
                 ["When block, loop, outputs, then test. Press Stop to end a forever loop."]),
             {"rounds": [
                 {"algorithm": ["When button A is pressed", "Repeat 3 times", "Beep"], "expect": ["whenA", "repeat3", "beep"]},
                 {"algorithm": ["When it gets dark", "Forever", "All lights on", "Wait a moment", "All lights off", "Wait a moment"], "expect": ["whenDark", "forever", "light", "wait", "dark", "wait"]},
                 {"algorithm": ["When it is shaken", "Repeat 4 times", "Ring the bell", "Show a heart"], "expect": ["whenShake", "repeat4", "bell", "heart"]},
             ]},
             "A counted loop, a forever loop, and a Stop."),

        step("context", "Control systems", "\U0001F39B️", "Control spotter", ["4CS.01"],
             "A <b>control system</b> senses something, decides with a program, and makes something happen. Bitsy's fan is one. Tap each real one.",
             explain(
                 ["Sensor in, program decides, output out. That loop is a control system, and it runs all around you."],
                 ["A thermostat: too cold, heating on; warm enough, heating off.", "Traffic lights: a program cycles the colours, and a sensor spots a waiting car.",
                  "A greenhouse: too hot, the window opens. A street lamp: dark, light on."],
                 ["Children think a control system is a remote control.", "A remote is a person controlling. A control system decides by itself, from a sensor."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "\U0001F321️", "label": "a thermostat", "say": "A thermostat. Sensor: the room temperature. Program: below 20, heating on; above, off. Output: the heating."},
                 {"pic": "\U0001F6A6", "label": "traffic lights", "say": "Traffic lights. A program runs the colours in a forever loop, and a sensor under the road tells it a car is waiting."},
                 {"pic": "\U0001F33F", "label": "a greenhouse window", "say": "A greenhouse. Sensor: temperature. Too hot, the motor opens the window. Cooler, it closes."},
                 {"pic": "\U0001F4A1", "label": "a street lamp", "say": "A street lamp. Sensor: the light sensor. Dark, lamp on. Morning, lamp off. Nobody flicks a switch."},
                 {"pic": "\U0001F9FA", "label": "a washing machine", "say": "A washing machine. Sensors for water level and heat; a program that fills, heats, turns, spins; motors and valves as outputs."},
                 {"pic": "\U0001F6D7", "label": "a lift", "say": "A lift. Input: the buttons and a sensor in the door. The program decides which floor. Output: the motor and the doors."},
             ], "need": 6,
              "then": {"ask": "What are the three parts of a control system?",
                       "opts": [opt("A sensor, a program that decides, and an output", True), opt("A screen, a keyboard and a mouse", False), opt("A person, a switch and a light", False)],
                       "why": "Sense, decide, act. Bitsy's night light has all three."}},
             "Sense, decide, act: a control system."),

        step("sort", "Control system, or not?", "\U0001F5C2️", "Control sorter", ["4CS.01"],
             "Does a sensor and a program decide what this does, or does a person?",
             explain(
                 ["Control system: a sensor and a program decide.", "Not: a person decides every time, or nothing decides."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Control system, or not?",
              "bins": [{"id": "cs", "label": "Control system", "pic": "\U0001F39B️"}, {"id": "no", "label": "Not one", "pic": "\U0001F590️"}],
              "items": [
                  {"pic": "\U0001F321️", "label": "heating that turns on when the room gets cold", "bin": "cs", "why": "A sensor and a program decide."},
                  {"pic": "\U0001F56F️", "label": "a candle", "bin": "no", "why": "No sensor, no program."},
                  {"pic": "\U0001F6AA", "label": "a door that opens when it sees you", "bin": "cs", "why": "Sensor, program, motor."},
                  {"pic": "\U0001F6B2", "label": "a bicycle", "bin": "no", "why": "You decide everything."},
                  {"pic": "\U0001F4A1", "label": "a lamp that comes on at dusk by itself", "bin": "cs", "why": "A light sensor decides."},
                  {"pic": "\U0001F58D️", "label": "a pencil", "bin": "no", "why": "Nothing senses or decides."},
                  {"pic": "\U0001F9CA", "label": "a fridge keeping itself cold", "bin": "cs", "why": "Too warm, the motor runs; cold enough, it stops."},
                  {"pic": "\U0001F4FB", "label": "a radio you switch on by hand", "bin": "no", "why": "A person decides every time."},
              ]},
             "A sensor and a program decide: a control system."),

        step("questions", "Check: Bitsy loops", "\U0001F4DD", "Bitsy checker", ["4P.08", "4P.09", "4CS.01"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Sensors, device loops, control systems."], [], ["Read, think, tap."]),
             {"items": [
                 q("'When it gets dark, all lights on.' What is the input?", "\U0001F319", "the light sensor sensing dark", ["button A", "the lights", "a clap"], "The when block names the input."),
                 q("'When A is pressed, repeat 3 times, beep.' How many beeps?", "\U0001F50A", "3", ["1", "4", "forever"], "Count-controlled: three."),
                 q("A forever loop on Bitsy stops when...", "\U0001F6D1", "you press Stop", ["it has counted to 3", "the beep ends", "it never can be stopped"], "Something outside stops it."),
             ]},
             "Sense, loop, control."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4P.08", "4P.09", "4CS.01"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Sensors as inputs, loops on a device, control systems."], [], ["Read, look, tap."]),
             {"items": [
                 q("Which is a sensor?", "\U0001F321️", "the temperature sensor", ["button A", "the speaker", "the motor"], "It senses heat by itself."),
                 q("A program that starts a fan when it gets hot begins with...", "\U0001F32C️", "when it gets hot", ["turn the motor", "forever", "beep"], "The when block comes first."),
                 q("Which loop is count-controlled?", "\U0001F522", "repeat 4 times", ["forever", "when it is shaken", "wait a moment"], "It counts, then stops."),
                 q("'Forever: lights on, wait, lights off, wait' makes...", "\U0001F4A1", "a light that keeps flashing until Stop", ["one flash", "four flashes", "no light"], "Forever repeats until stopped."),
                 q("A control system is...", "\U0001F39B️", "a sensor, a program that decides, and an output", ["a person with a remote", "a screen", "a game"], "Sense, decide, act."),
                 q("Which is a control system?", "\U0001F6AA", "a door that opens when a sensor sees you", ["a candle", "a pencil", "a bicycle"], "Sensor, program, motor."),
                 q("Traffic lights cycle red, amber, green all day. That is...", "\U0001F6A6", "a forever loop in a control system", ["a count-controlled loop", "a person pressing buttons", "not a program"], "Round and round until switched off."),
             ]},
             "That is the whole lesson finished. You program sensors and loops, and spot control systems."),
    ],
}


LESSON["about"] = [
    "Program Bitsy to respond to its temperature and light sensors.",
    "Use a count-controlled loop and a forever loop in a device program.",
    "Name the three parts of a control system.",
    "Spot control systems in everyday machines.",
]

LESSON["lecture"] = [
    part("\U0001F321️", "Sensors",
         "Bitsy's button needs a press. Its temperature sensor and light sensor need nothing: they sense heat and light all the time, by themselves. A program starts with WHEN the sensor senses something - when it gets hot, when it gets dark - and then lists the outputs."),
    part("\U0001F501", "Loops on a device",
         "A repeat block repeats the output after it a counted number of times: repeat 3 times, beep. A forever block repeats everything after it until Stop is pressed: lights on, wait, lights off, wait, a flashing light that never ends by itself."),
    part("\U0001F39B️", "Control systems",
         "A control system senses something, decides with a program, and makes something happen. A thermostat senses cold and turns the heating on. A street lamp senses dark and lights up. A greenhouse senses heat and opens its window. Sense, decide, act."),
    part("\U0001F590️", "Not a control system",
         "A candle, a pencil, a bicycle: nothing senses and nothing decides. A radio you switch on by hand: a person decides every time. A control system decides by itself, from a sensor."),
]

LESSON["words"] = [
    word("sensor", "\U0001F321️", "An input device that senses something by itself: heat, light, movement.",
         ["The light sensor senses dark.", "A sensor needs no press."]),
    word("count-controlled loop", "\U0001F522", "A loop that runs a set number of times, then stops.",
         ["Repeat 3 times, beep, is count-controlled.", "Three times, then done."]),
    word("forever loop", "♾️", "A loop that runs until something stops it.",
         ["The flashing light is a forever loop.", "Press Stop to end a forever loop."]),
    word("control system", "\U0001F39B️", "A sensor, a program that decides, and an output, working together.",
         ["A thermostat is a control system.", "Bitsy's night light is a small control system."]),
    word("thermostat", "\U0001F321️", "A control system that keeps a room at a set temperature.",
         ["The thermostat turned the heating on.", "Set the thermostat to 20."]),
]

LESSON["home"] = [
    home("Find the control systems", "A walk round the house",
         ["Find three things that sense and decide by themselves: the fridge, the heating, a night light, the oven timer.",
          "For each, say the sensor, the decision and the output.",
          "Find three things a person controls every time."],
         "Sense, decide, act."),
    home("Be Bitsy", "A friend, a torch",
         ["Your friend is Bitsy. Write a program: when it gets dark, forever: hands up, wait, hands down, wait.",
          "Cover their eyes with the torch off. They run the loop until you say Stop.",
          "Now write a repeat 3 times program and test that too."],
         "A forever loop needs a Stop."),
]
