# -*- coding: utf-8 -*-
"""Lesson 8 - Electricity and Circuits.

0097 Stage 2 Electricity and magnetism, all three: 2Pe.01 how we use
electricity and how to be safe with it; 2Pe.02 the parts of a simple circuit
(cells, wires, lamps); 2Pe.03 building a simple series circuit; with 2TWSm.01,
2TWSm.02 (make and use a model), 2TWSm.03, 2TWSc.02, 2TWSc.04 and 2SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home, icon, cando

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
                 ["In the real torch the cell is a round battery, the wires are tiny metal strips, and the lamp is the little glass light.", "The diagram draws each one as a symbol so anyone can read it."],
                 ["Children think the diagram is a picture of the torch.", "It is a diagram: symbols and lines, not a picture."],
                 ["Press Next and match each symbol to the real part."]),
             {"frames": [
                 {"pic": "\U0001F526", "cap": "A real torch. Inside are a battery, metal strips and a lamp.", "say": "A real torch. Inside it are a battery, two metal strips and a little lamp."},
                 {"pic": "\U0001F526", "cap": "A <b>picture</b> of a torch shows how it looks, not what is inside.", "say": "A picture of a torch shows how the torch looks. It does not show the loop inside."},
                 {"pic": "\U0001F50B", "cap": "The <b>cell symbol</b>: a long line and a short line. It stands for the battery.", "say": "In the diagram the battery is drawn as a long line and a short line. That symbol stands for the cell."},
                 {"pic": "\U0001F4A1", "cap": "The <b>lamp symbol</b>: a circle with a cross. It stands for the lamp.", "say": "The lamp is drawn as a circle with a cross inside. Some people call a lamp a bulb. Scientists say lamp."},
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
              "then": {"ask": "Why does a torch need a cell of its own, when a lamp at home does not?",
                       "opts": [opt("A torch has to work anywhere, with no wire to the wall", True), opt("A torch's lamp is bigger", False), opt("A home lamp is too old to need one", False)],
                       "why": "A torch carries its electricity with it, in the cell. A lamp at home gets its electricity from the mains, along a wire in the wall."}},
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
                 q("A wind-up clock ticks all day. Does it use electricity?", "\U0001F570️", "No. It has no plug and no cell.", ["Yes, everything that works uses electricity", "Yes, because it moves"], "Look for a plug or a cell. No plug and no cell means no electricity."),
                 q("Is every electrical thing too dangerous to touch?", "\U0001F526", "No. A torch with its cells covered is made to be handled.", ["Yes, never touch anything electrical", "Yes, unless a grown-up is there"], "Mains electricity from the wall is the dangerous one. Cell-powered things are made for you to hold. Follow the rules and you are safe."),
                 q("What do scientists call the little light in a circuit?", "\U0001F4A1", "a lamp", ["a bulb", "a torch", "a cell"], "It is a lamp. Using the right word now saves confusion later on."),
                 q("You join just one end of the lamp to the cell. Does it light?", "\U0001F50B", "No. The electricity has to go all the way round and back.", ["Yes, one wire is enough", "Yes, if the cell is new"], "One connection leaves a gap, and a gap means no light. A circuit has to be a complete loop."),
             ],
              "support": [
                 q("Does a torch need a cell?", "\U0001F526", "Yes", ["No"],
                   "The cell gives the torch its electricity."),
                 q("Will a lamp light if a wire is missing?", "\U0001F4A1", "No", ["Yes"],
                   "The loop has to be complete all the way round."),
                 q("Does electricity flow through plastic?", "\U0001F9F4", "No", ["Yes"],
                   "Plastic stops it, which is why it is wrapped round the outside of a wire."),
                 q("Must a circuit be a complete loop?", "\U0001F501", "Yes", ["No"],
                   "Break the loop anywhere and the lamp goes out."),
              ],
              "extension": [
                 q("Why is the metal inside a wire covered in plastic?", "\U0001F50C", "the metal carries the electricity and the plastic keeps it in", ["to give the wire a nicer colour", "so that the wire bends more easily"],
                   "Metal where you want the electricity to travel, plastic where you do not. Every wire in your house is built that way."),
                 q("A switch in a circuit is turned off. What has it actually done?", "\U0001F501", "made a gap in the loop, so nothing can go round", ["used up the electricity in the cell", "made the lamp too weak to light"],
                   "A switch is a gap you can open and close on purpose. Closed, the loop is whole; open, it is broken."),
                 q("Your circuit works. You swap the cell for a flat one. What happens and why?", "❌", "the lamp goes out, because a flat cell has no push left", ["the lamp gets brighter", "nothing changes at all"],
                   "The loop is still complete. What is missing is the push, and that comes from the cell."),
                 q("Why does a torch have a switch instead of you taking the cell out each time?", "\U0001F50B", "a switch opens and closes the loop quickly, without taking it apart", ["a switch makes more electricity", "the cell would wear out faster"],
                   "A switch is a gap you can open and close on purpose. That is all it is."),
              ]},
             "You know your circuits.",
             mis=["6.1-m1", "6.2-m1", "rtg-17", "rtg-18"]),

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
                 q("How does the electricity get to the lamp?", "\U0001F526", "it flows all the way round the loop and back to the cell", ["it comes out of both ends of the cell and crashes in the lamp", "it jumps across the gap"], "It goes round one way, through the lamp, and back into the cell."),
                 q("Your wire has red plastic on it and your friend's is blue. Does that change anything?", "\U0001F534", "No. The metal inside is the same.", ["Yes, red wires work better", "Yes, blue is for cells only"], "Colour only matters in big complicated wiring. In your circuit, any colour works."),
                 q("Does a long wire let the electricity leak out?", "\U0001F50C", "No. Electricity cannot leak out of a wire.", ["Yes, keep wires short", "Yes, if the wire is bent"], "A long wire works exactly as well as a short one."),
             ],
              "support": [
                 q("Does a torch need a cell?", "\U0001F526", "Yes", ["No"],
                   "The cell gives the torch its electricity."),
                 q("May you put anything except a plug into a socket?", "\U0001F50C", "No", ["Yes"],
                   "Only a plug. Anything else is dangerous."),
                 q("Should electrical things be kept away from water?", "\U0001F4A7", "Yes", ["No"],
                   "Water and electricity must stay apart."),
                 q("What does a cell give a circuit?", "\U0001F50B", "electricity", ["light"],
                   "The cell gives the push; the lamp gives the light."),
              ],
              "extension": [
                 q("Your lamp will not light. The cell is new and the lamp is fine. What would you check next?", "\U0001F50D", "whether the loop is complete, with no loose wire", ["whether the wires are the right colour", "whether the wires are short enough"],
                   "A gap anywhere in the loop stops the lamp, and a loose connection is the usual cause."),
                 q("On a circuit diagram a lamp is a circle with a cross. Why not draw the lamp itself?", "\U0001F4D0", "so that anybody, anywhere, reads it the same way", ["because drawing is too hard", "because the symbol looks nicer"],
                   "That is what a diagram is for. A picture shows what a thing looks like; a diagram shows how it works."),
                 q("Two lamps in one loop are both dimmer than one lamp was. What does that tell you about the cell's push?", "\U0001F4A1", "there is only so much of it, and now it is shared", ["the cell got weaker when you added a lamp", "the second lamp is broken"],
                   "The cell pushes just as hard. Each lamp simply gets a smaller share of it."),
                 q("A circuit diagram uses the same symbols everywhere in the world. Why is that worth having?", "\U0001F310", "anybody can read the plan, whatever language they speak", ["the symbols are quicker to draw", "it stops people copying"],
                   "A shared set of symbols is what lets one person's circuit be built by another."),
              ]},
             "That is the whole lesson finished. You can build a circuit.",
             mis=["6.3-m1", "6.3-m2", "6.3-m3"]),
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
    word("plug", "\u26A1", "The part you push into a socket to join something to the mains.",
         ["Only a plug goes into a socket.", "Ask a grown-up to put the plug in."]),
    word("complete", "\U0001F517", "Nothing missing. A circuit has to be a complete loop.",
         ["The lamp lights when the circuit is complete.", "One loose wire and the loop is not complete."]),
    word("flow", "\U0001F30A", "To move along, the way water moves along a pipe.",
         ["Electricity flows round the circuit.", "Electricity cannot flow across a gap."]),
    word("electricity", "\u26A1", "What flows round a circuit and makes a lamp light.",
         ["Electricity flows only round a complete circuit.", "A cell pushes the electricity round."]),
    word("connection", "\U0001F517", "A place where two parts of a circuit join.",
         ["Check every connection if the lamp will not light.", "A loose connection breaks the circuit."]),
    word("mains electricity", "\U0001F50C", "The very powerful electricity in the sockets of a building.",
         ["Mains electricity is far too strong to play with.", "A cell is safe; mains electricity is not."]),
]

LESSON["cando"] = [
    cando("I can say how we use electricity, and how to be safe with it.", "2Pe.01"),
    cando("I can name the parts of a simple circuit.", "2Pe.02"),
    cando("I can build a circuit with a cell, wires and a lamp.", "2Pe.03"),
    cando("I can say what a circuit diagram is a model of.", "2TWSm.01"),
    cando("I can make a model of something real.", "2TWSm.02"),
    cando("I can say how a diagram is different from a picture.", "2TWSm.03"),
    cando("I can follow the safety rules when I build a circuit.", "2TWSc.04"),
    cando("I can explain how a torch works.", "2SIC.02"),
]

LESSON["home"] = [
    home("Inside a torch", "A torch that opens, a grown-up",
         ["Open the torch and take out the battery.",
          "Find the metal strips and the little lamp.",
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
