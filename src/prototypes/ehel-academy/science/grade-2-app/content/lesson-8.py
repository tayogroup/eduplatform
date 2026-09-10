# -*- coding: utf-8 -*-
"""Lesson 8 - Electricity and Circuits.

0097 Stage 2 Electricity and magnetism, all three: 2Pe.01 how we use
electricity and how to be safe with it; 2Pe.02 the parts of a simple circuit
(cells, wires, lamps); 2Pe.03 building a simple series circuit; with 2TWSm.01,
2TWSm.02 (make and use a model), 2TWSm.03, 2TWSc.02, 2TWSc.04 and 2SIC.02.
"""
from _kit import explain, step, opt, q

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
                 ["A lamp turns electricity into light.", "A kettle turns it into heat.", "A fan turns it into movement.", "A radio turns it into sound.", "A phone stores it in a battery."],
                 ["Children think electricity is only for lights.", "Look around: the fridge, the washing machine and the phone all use it."],
                 ["Tap every picture and say what the electricity is doing."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "lighting", "say": "A lamp turns electricity into light."},
                 {"pic": "\U0001FAD6", "label": "heating", "say": "A kettle and a heater turn electricity into heat."},
                 {"pic": "\U0001F373", "label": "cooking", "say": "An electric cooker and a microwave cook with electricity."},
                 {"pic": "\U0001F9CA", "label": "keeping cold", "say": "A fridge uses electricity to keep food cold."},
                 {"pic": "\U0001F4A8", "label": "moving", "say": "A fan and a washing machine use electricity to make things move."},
                 {"pic": "\U0001F50A", "label": "making sound", "say": "A radio and a speaker turn electricity into sound."},
                 {"pic": "\U0001F4F1", "label": "charging", "say": "A phone charger fills the battery with electricity to use later."},
                 {"pic": "\U0001F4BB", "label": "computing", "say": "A computer and a tablet run on electricity."},
             ], "need": 8},
             "Light, heat, cooking, cold, movement, sound. Electricity does all of it."),

        step("sort", "Safe, or not safe?", "⚠️", "Safe with power", ["2Pe.01", "2TWSc.04", "2TWSc.01"],
             "Electricity is useful and it can hurt. Is this <b>safe</b>, or <b>not safe</b>?",
             explain(
                 ["The electricity in a wall socket is strong enough to hurt you badly.", "Rules keep it useful and keep you safe."],
                 ["Only a plug goes in a socket.", "Wet hands and electricity never mix.", "A broken wire: tell a grown-up, do not touch.", "Never climb a pylon or fly a kite near power lines."],
                 ["Children think a small battery is as dangerous as a socket.", "A little cell is safe to handle; a wall socket is not."],
                 ["Ask: could this let electricity into a person?"]),
             {"ask": "Safe, or not safe?",
              "bins": [{"id": "safe", "label": "Safe", "pic": "✅"}, {"id": "unsafe", "label": "Not safe", "pic": "⚠️"}],
              "items": [
                  {"pic": "\U0001F50C", "label": "a plug in a socket", "bin": "safe", "why": "A plug is the only thing that goes in a socket."},
                  {"pic": "\U0001F4A7\U0001F50C", "label": "wet hands on a switch", "bin": "unsafe", "why": "Water lets electricity through. Dry hands first."},
                  {"pic": "\U0001F50B", "label": "putting a cell in a torch", "bin": "safe", "why": "A small cell is safe to handle."},
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
                 {"scene": {"id": "habitat", "state": 0}, "cap": "A <b>picture</b> shows how something looks.", "say": "A picture shows how a thing looks."},
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
                 q("A circuit has a cell, a lamp and only ONE wire. Does the lamp light?", "➰", "No. The loop is not complete", ["Yes", "Only at night"], "Electricity needs a way back to the cell."),
                 q("You take a wire out of a working circuit. What happens?", "✂️", "the lamp goes out", ["the lamp gets brighter", "nothing"], "A gap breaks the loop. You saw it."),
                 q("Which is safe?", "✅", "putting a small cell in a torch", ["poking a socket", "wet hands on a switch"], "A small cell is safe; sockets and water are not."),
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
                 q("A kettle turns electricity into...", "\U0001FAD6", "heat", ["cold", "sound", "light"], "A kettle heats water with electricity."),
                 q("What goes into a wall socket?", "\U0001F50C", "only a plug", ["a pencil", "a wet finger", "a key"], "Only plugs. Ever."),
                 q("Electric things and water...", "\U0001F4A7", "must stay apart", ["go well together", "make more electricity"], "Water lets electricity through to you."),
                 q("What are the three parts of a simple circuit?", "\U0001F50B", "a cell, wires and a lamp", ["a plug, a socket and a kettle", "a torch, a battery and a switch"], "Cell, wires, lamp."),
                 q("For the lamp to light, the circuit must be...", "➰", "a complete loop", ["very long", "made of plastic", "wet"], "A gap anywhere and the lamp is out."),
                 q("What did you make when you built the circuit?", "\U0001F527", "a model of a torch", ["a real torch", "a picture", "a habitat"], "The circuit is a model: it works like a torch and shows the idea."),
                 q("The circle with a cross in a circuit diagram stands for...", "\U0001F4A1", "the lamp", ["the cell", "a wire", "the switch"], "That symbol is the lamp."),
                 q("What does a switch do?", "\U0001F6CE️", "opens or closes a gap in the loop", ["makes electricity", "stores electricity"], "On closes the loop; off opens a gap."),
             ]},
             "That is the whole lesson finished. You can build a circuit."),
    ],
}
