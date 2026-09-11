# -*- coding: utf-8 -*-
"""Lesson 8 - Electricity and Circuits.

0097 Stage 2 Electricity and magnetism, all three: 2Pe.01 how we use
electricity and how to be safe with it; 2Pe.02 the parts of a simple circuit
(cells, wires, lamps); 2Pe.03 building a simple series circuit; with 2TWSm.01,
2TWSm.02 (make and use a model), 2TWSm.03, 2TWSc.02, 2TWSc.04 and 2SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home, icon

CIRCUIT_PARTS = [
    {"id": "cell", "label": "cell", "say": "The cell. It is what people call a battery. It pushes the electricity round the circuit."},
    {"id": "wire", "label": "wires", "say": "The wires. Electricity travels along them, from the cell to the lamp and back."},
    {"id": "lamp", "label": "lamp", "say": "The lamp. When electricity flows through it, it lights up."},
]

LESSON = {
    "slug": "electricity-and-circuits",
    "title": "Electricity and Circuits",
    "blurb": "See what electricity does for us, learn the rules that keep you safe with it, name the parts of a circuit, and build one that really lights a lamp.",
    "steps": [
        step("explore", "What electricity does for us", "\U0001F50C", "Electric helpers", ["2Pe.01"],
             "We use electricity in lots of ways. Tap each picture.",
             explain(
                 ["Electricity does jobs for us all day: it lights, it heats, it cooks, it charges, it makes things move and makes sound."],
                 ["A lamp turns electricity into light.", "A kettle turns it into heat.", "A fan turns it into movement.", "A radio turns it into sound.", "A charger charges a phone's battery, so the phone works later."],
                 ["Children think electricity is only for lights.", "Look around: the fridge, the washing machine and the phone all use it."],
                 ["Tap every picture and say what the electricity is doing."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "lighting", "say": "A lamp turns electricity into light."},
                 {"pic": icon("kettle"), "label": "heating", "say": "A kettle and a heater turn electricity into heat."},
                 {"pic": "\U0001F373", "label": "cooking", "say": "An electric cooker and a microwave cook with electricity."},
                 {"pic": "\U0001F9CA", "label": "keeping cold", "say": "A fridge uses electricity to keep food cold."},
                 {"pic": "\U0001F4A8", "label": "moving", "say": "A fan and a washing machine use electricity to make things move."},
                 {"pic": "\U0001F50A", "label": "making sound", "say": "A radio and a speaker turn electricity into sound."},
                 {"pic": "\U0001F4F1", "label": "charging", "say": "A charger charges the phone's battery, so the phone works later."},
                 {"pic": "\U0001F4BB", "label": "computing", "say": "A computer and a tablet run on electricity."},
             ], "need": 8},
             "Light, heat, cooking, cold, movement, sound. Electricity does all of it."),

        step("sort", "Safe, or not safe?", "⚠️", "Safe with power", ["2Pe.01", "2TWSc.04", "2TWSc.01"],
             "Electricity is useful and it can hurt. Is this <b>safe</b>, or <b>not safe</b>?",
             explain(
                 ["The electricity in a wall socket is strong enough to hurt you badly.", "Rules keep it useful and keep you safe."],
                 ["Only a plug goes in a socket.", "Wet hands and electricity never mix.", "A broken wire: tell a grown-up, do not touch.", "Never climb a pylon or fly a kite near power lines."],
                 ["Children think a small battery is as dangerous as a socket.", "A little cell is safe to handle, but never put a cell in your mouth, and never break one open. A wall socket is not safe to touch at all."],
                 ["Ask: could this let electricity into a person?"]),
             {"ask": "Safe, or not safe?",
              "bins": [{"id": "safe", "label": "Safe", "pic": "✅"}, {"id": "unsafe", "label": "Not safe", "pic": "⚠️"}],
              "items": [
                  {"pic": "\U0001F50C", "label": "a plug in a socket", "bin": "safe", "why": "A plug is the only thing that goes in a socket."},
                  {"pic": "\U0001F4A7\U0001F50C", "label": "wet hands on a switch", "bin": "unsafe", "why": "Water lets electricity through. Dry hands first."},
                  {"pic": "\U0001F50B", "label": "putting a cell in a torch", "bin": "safe", "why": "A small cell is safe to handle. Never put a cell in your mouth, and never break one open."},
                  {"pic": "\U0001F58A️", "label": "poking a socket with a pencil", "bin": "unsafe", "why": "Nothing but a plug goes in a socket. Ever."},
                  {"pic": "\U0001FA81", "label": "flying a kite near power lines", "bin": "unsafe", "why": "Power lines carry very strong electricity. Stay well away."},
                  {"pic": "\U0001F9D1‍\U0001F527", "label": "telling a grown-up about a broken wire", "bin": "safe", "why": "Do not touch a broken wire. Telling a grown-up is the right thing."},
                  {"pic": "\U0001F6C1\U0001F4F1", "label": "a phone charging by the bath", "bin": "unsafe", "why": "Electric things stay away from water."},
                  {"pic": "\U0001F4A1", "label": "switching a lamp off before bed", "bin": "safe", "why": "Switching things off is safe and saves electricity."},
              ]},
             "Only plugs in sockets, dry hands, tell a grown-up about broken wires."),

        step("label", "The parts of a circuit", "\U0001F50B", "Circuit parts", ["2Pe.02"],
             "A torch is a circuit inside. Tap the <b>%s</b>.",
             explain(
                 ["A simple circuit has three parts: a cell, wires, and a lamp.", "The cell pushes the electricity, the wires carry it, and the lamp uses it."],
                 ["The cell is the box on the left with the long and short lines.", "The wires are the yellow lines going round.", "The lamp is the circle with the cross inside."],
                 ["Children call the cell a battery.", "That is fine at home; scientists say cell for one, battery for several joined together."],
                 ["Listen for the part, find it in the diagram, then tap it."]),
             {"figure": "circuit", "ask": "Tap the %s.", "parts": CIRCUIT_PARTS},
             "Cell, wires, lamp. The three parts of a simple circuit."),

        step("build", "Build a circuit", "\U0001F527", "Circuit builder", ["2Pe.03", "2TWSm.02", "2TWSc.02"],
             "Make a <b>model</b> of a torch: tap the parts to build the circuit. When the loop is complete, the lamp lights.",
             explain(
                 ["A circuit only works as a complete loop.", "Electricity goes out of the cell, along a wire, through the lamp, and back along the other wire to the cell."],
                 ["Add the cell.", "Add a wire.", "Add the lamp.", "Add the second wire to close the loop, and the lamp lights.",
                  "Then take a wire out. There is a gap, the loop is broken, and the lamp goes out."],
                 ["Children think the lamp should light with one wire.", "One wire is a dead end. Electricity needs a way back to the cell."],
                 ["Tap the four parts, watch the lamp, then break the loop and mend it."]),
             {"sim": "circuit",
              "parts": [
                  {"id": "cell", "label": "cell", "pic": "\U0001F50B"},
                  {"id": "wire1", "label": "a wire", "pic": "➰"},
                  {"id": "lamp", "label": "lamp", "pic": "\U0001F4A1"},
                  {"id": "wire2", "label": "another wire", "pic": "➰"},
              ]},
             "A complete loop lights the lamp. A gap anywhere and it goes out."),

        step("demo", "The diagram is a model", "\U0001F4D0", "Diagram model", ["2TWSm.01", "2TWSm.03", "2Pe.02"],
             "The circuit you built is a drawing, a <b>diagram</b>. Press <b>Next</b> to see how it stands for the real thing.",
             explain(
                 ["The circuit drawing is a model: it shows the idea of the loop clearly, with simple symbols, and leaves out how the real parts look."],
                 ["In the real torch the cell is a round battery, the wires are tiny metal strips, and the lamp is a little bulb.", "The diagram draws each one as a symbol so anyone can read it."],
                 ["Children think the diagram is a picture of the torch.", "It is a diagram: symbols and lines, not a picture."],
                 ["Press Next and match each symbol to the real part."]),
             {"frames": [
                 {"pic": "\U0001F526", "cap": "A real torch. Inside are a battery, metal strips and a bulb.", "say": "A real torch. Inside it are a battery, two metal strips and a little bulb."},
                 {"pic": "\U0001F526", "cap": "A <b>picture</b> of a torch shows how it looks, not what is inside.", "say": "A picture of a torch shows how the torch looks. It does not show the loop inside."},
                 {"pic": "\U0001F50B", "cap": "The <b>cell symbol</b>: a long line and a short line. It stands for the battery.", "say": "In the diagram the battery is drawn as a long line and a short line. That symbol stands for the cell."},
                 {"pic": "\U0001F4A1", "cap": "The <b>lamp symbol</b>: a circle with a cross. It stands for the bulb.", "say": "The bulb is drawn as a circle with a cross inside. That symbol stands for the lamp."},
                 {"pic": "\U0001F4D0", "cap": "The diagram is a <b>model</b> of the torch: the idea of the loop, without the look.", "say": "So the circuit diagram is a model of the torch. It shows the loop clearly and leaves out what the parts look like. Every electrician in the world can read it."},
             ]},
             "A circuit diagram is a model: symbols for the parts, lines for the loop."),

        step("context", "How a torch works", "\U0001F526", "How it works", ["2SIC.02", "2Pe.03"],
             "Science explains how the electric things you use work. Tap each one.",
             explain(
                 ["Everything with a switch is a circuit.", "The switch is a gap you can open and close."],
                 ["A torch switch closes the loop: on. Opens it: off.", "A light switch on the wall does the same for the room lamp.", "A doorbell closes a circuit while you press it."],
                 [],
                 ["Tap each one and find the loop inside it."]),
             {"items": [
                 {"pic": "\U0001F526", "label": "torch", "say": "Inside a torch is your circuit: a cell, wires and a lamp. The switch closes the loop to turn it on, and opens a gap to turn it off."},
                 {"pic": "\U0001F4A1", "label": "light switch", "say": "The light switch on the wall is a gap in a circuit. Flick it and the loop closes and the lamp lights."},
                 {"pic": "\U0001F6CE️", "label": "doorbell", "say": "A doorbell button closes a circuit only while your finger presses it. Let go, the gap opens, the ringing stops."},
                 {"pic": "\U0001F697", "label": "toy car", "say": "A battery toy car has a circuit with a motor instead of a lamp. The switch closes the loop and the motor turns the wheels."},
             ], "need": 4,
              "then": {"ask": "What does a switch do in a circuit?",
                       "opts": [opt("Opens or closes a gap in the loop", True), opt("Makes the electricity", False), opt("Makes the wires longer", False)],
                       "why": "A switch is a gap you can close (on) or open (off)."}},
             "Everything with a switch is a circuit with a gap you control."),

        step("questions", "Circuit check", "✅", "Circuit check", ["2Pe.01", "2Pe.02", "2Pe.03"],
             "Tap the answer.",
             explain(
                 ["Cell, wires, lamp, and a complete loop."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which part pushes the electricity round the circuit?", "\U0001F50B", "the cell", ["the lamp", "the wire", "the switch"], "The cell pushes the electricity round."),
                 q("Which part lights up?", "\U0001F4A1", "the lamp", ["the cell", "the wire"], "The lamp lights when electricity flows through it."),
                 q("A wire is joined only to the cell, and not to the lamp. Does the lamp light?", "➰", "No. The loop is not complete", ["Yes", "Only at night"], "Electricity needs a complete loop, from the cell, through the lamp, and back to the cell."),
                 q("You take a wire out of a working circuit. What happens?", "✂️", "the lamp goes out", ["the lamp gets brighter", "nothing"], "A gap breaks the loop. You saw it."),
                 q("Which is safe?", "✅", "putting a small cell in a torch", ["poking a socket", "wet hands on a switch"], "A small cell is safe to handle, but never in your mouth and never broken open. Sockets and water are not safe."),
             ]},
             "You know your circuits."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Pe.01", "2Pe.02", "2Pe.03", "2TWSm.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A kettle turns electricity into...", icon("kettle"), "heat", ["cold", "sound", "light"], "A kettle heats water with electricity."),
                 q("You see a wire with its plastic cover broken and the metal showing. What should you do?", "⚠️", "leave it alone and tell a grown-up", ["pick it up and fix it", "poke it with a stick"], "Never touch a broken wire. Telling a grown-up keeps everyone safe."),
                 q("Electric things and water...", "\U0001F4A7", "must stay apart", ["go well together", "make more electricity"], "Water lets electricity through to you."),
                 q("What are the three parts of a simple circuit?", "\U0001F50B", "a cell, wires and a lamp", ["a plug, a socket and a kettle", "a torch, a battery and a switch"], "Cell, wires, lamp."),
                 q("For the lamp to light, the circuit must be...", "➰", "a complete loop", ["very long", "made of plastic", "wet"], "A gap anywhere and the lamp is out."),
                 q("What did you make when you built the circuit?", "\U0001F527", "a model of a torch", ["a real torch", "a picture", "a habitat"], "The circuit is a model: it works like a torch and shows the idea."),
                 q("The circle with a cross in a circuit diagram stands for...", "\U0001F4A1", "the lamp", ["the cell", "a wire", "the switch"], "That symbol is the lamp."),
                 q("What does a switch do?", "\U0001F6CE️", "opens or closes a gap in the loop", ["makes electricity", "stores electricity"], "On closes the loop; off opens a gap."),
                 q("Why does a torch go dark when you switch it off?", "\U0001F526", "the switch opens a gap, so the loop is broken", ["the cell is used up at once", "the lamp falls out"], "Switching off opens a gap in the circuit. Electricity cannot flow round a broken loop, so the lamp goes out."),
             ]},
             "That is the whole lesson finished. You can build a circuit."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say what electricity does for us.",
    "Say the rules that keep you safe with electricity.",
    "Name the parts of a simple circuit.",
    "Build a circuit that lights a lamp, and break it.",
]

LESSON["warmup"] = [
    q("Which of these needs electricity to work?", "❓", "a lamp", ["a book", "a spoon"], "A lamp needs electricity to make light."),
    q("What is inside a torch that makes it light up?", "\U0001F526", "a battery", ["water", "sand"], "A battery inside the torch makes the lamp light."),
]

LESSON["lecture"] = [
    part("\U0001F4A1", "What electricity does",
         "Electricity lights lamps, heats rooms, cooks food, keeps the fridge cold, makes toys move and makes sound. It does all of it."),
    part("\u26A0\uFE0F", "Staying safe",
         "Only plugs in sockets. Dry hands on switches. Never poke a socket. Never fly a kite near power lines. If a wire is broken, tell a grown-up."),
    part("\U0001F50B", "The parts of a circuit",
         "A cell, which is a small battery. Wires. A lamp. Join them in a loop and the lamp lights. That loop is a circuit."),
    part("\U0001F50C", "A gap breaks it",
         "Take one wire out. The lamp goes out. Electricity can only flow round a complete loop. A gap anywhere, and it stops."),
    part("\U0001F4DD", "The diagram is a model",
         "A circuit diagram uses symbols: a long line and a short line for the cell, a circle with a cross for the lamp, straight lines for the wires. It is a model of the real circuit."),
]

LESSON["words"] = [
    word("circuit", "\U0001F501", "A complete loop that electricity can flow round.",
         ["The lamp lights when the circuit is complete.", "A gap breaks the circuit."]),
    word("cell", "\U0001F50B", "A small battery that pushes electricity round a circuit.",
         ["Put the cell in the torch.", "The cell is one part of the circuit."]),
    word("wire", "\U0001F50C", "A thin metal strand that carries electricity.",
         ["Join the wire to the lamp.", "Never touch a broken wire."]),
    word("lamp", "\U0001F4A1", "The part of a circuit that lights up.",
         ["The lamp glows.", "A torch has a lamp inside."]),
    word("switch", "\U0001F39A\uFE0F", "A part that opens or closes a gap in a circuit.",
         ["Flick the switch and the lamp lights.", "A switch makes a gap you control."]),
    word("symbol", "\u2B55", "A simple sign that stands for a part in a diagram.",
         ["The symbol for a lamp is a circle with a cross.", "Learn the symbol for a cell."]),
    word("socket", "\U0001F3E0", "The holes in a wall that electricity comes out of.",
         ["Only plugs go in a socket.", "Keep water away from the socket."]),
]

LESSON["home"] = [
    home("Inside a torch", "A torch that opens, a grown-up",
         ["Open the torch and take out the battery.",
          "Find the metal strips and the little bulb.",
          "Put it back together and switch it on."],
         "Cell, wires, lamp, switch. A torch is a circuit in a tube."),
    home("Switch hunt", "Paper and a pencil",
         ["Find every switch in one room.",
          "For each, say what it switches on: a lamp, a fan, a kettle.",
          "Say what the switch does to the circuit."],
         "A switch is a gap you control."),
    home("Safety walk with a grown-up", "A grown-up, one room",
         ["Check every socket: only plugs in it?",
          "Check every wire: none broken?",
          "Check that nothing electric is near water."],
         "Say the rules out loud together."),
]
