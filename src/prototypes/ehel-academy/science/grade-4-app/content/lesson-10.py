# -*- coding: utf-8 -*-
"""Lesson 10 - Circuits and Switches.

0097 Stage 4: 4Pe.01 a device will not work with a break in the circuit;
4Pe.02 a switch opens and closes a circuit; 4Pe.03 more or different
components make a lamp brighter or dimmer; 4Pe.04 conductors and
insulators; with 4TWSp.03, 4TWSa.01, 4TWSa.03, 4TWSc.03, 4TWSc.08 and
4SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "circuits-and-switches",
    "title": "Circuits and Switches",
    "blurb": "Add cells and lamps to a circuit to see the light change, open and close a switch, test eight materials in a gap to find the conductors, and choose the right equipment for the job.",
    "steps": [
        step("experiment", "Brighter, dimmer, off", "\U0001F4A1", "Series circuit", ["4Pe.01", "4Pe.02", "4Pe.03", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "One cell, one lamp, one switch. Predict what adding a second cell will do.",
             explain(
                 ["In a series circuit everything is in one loop.", "More cells push harder: brighter. More lamps share the push: dimmer. Open the switch: a break, and everything stops."],
                 ["Add a cell: brighter.", "Add a lamp: each one dimmer.", "Open the switch: off. Close it: on."],
                 ["Children think a switch makes electricity.", "A switch only opens or closes a gap. The cells do the pushing."],
                 ["Predict, add a cell, add a lamp, open and close the switch, then conclude."]),
             {"sim": "seriesCircuit",
              "predict": {"ask": "Adding a second <b>cell</b> will make the lamp...",
                          "opts": [opt("brighter", True), opt("dimmer", False), opt("go out", False)]},
              "runAsk": "Add a cell. Add a lamp. Open the switch, then close it. Watch the lamps.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("A second cell made the lamp brighter; a second lamp made them dimmer; the open switch turned them off", True), opt("Nothing changed", False), opt("More cells made it dimmer", False)],
                           "why": "Cells push. Lamps share the push. A switch is a gap you control."},
              "conclude": {"ask": "Why does opening the switch turn every lamp off?",
                           "opts": [opt("It makes a break in the circuit, so no electricity can flow anywhere in the loop", True), opt("It takes the cells out", False), opt("It makes the wires longer", False)],
                           "why": "A series circuit is one loop. One break anywhere stops it all."}},
             "More cells: brighter. More lamps: dimmer. A break: off."),

        step("predictEach", "Conductor, or insulator?", "\U0001F50C", "Conductor test", ["4Pe.04", "4TWSp.03", "4TWSa.01"],
             "Put the <b>%s</b> in the gap. Predict: will the lamp light?",
             explain(
                 ["A conductor lets electricity through. An insulator does not.", "Metals are good conductors. Plastic, rubber, wood and glass are insulators."],
                 ["A copper wire: the lamp lights.", "A plastic ruler: nothing.", "A key: lights.", "An eraser: nothing."],
                 ["Children think anything shiny conducts.", "A shiny plastic lid is an insulator. It is the metal that conducts."],
                 ["Predict for each one, then test it."]),
             {"sim": "conductor", "ask": "Put the %s in the gap. Will the lamp light?", "tryLabel": "Test it",
              "choices": [{"id": "yes", "t": "lights: a conductor", "pic": "\U0001F4A1"}, {"id": "no", "t": "stays off: an insulator", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F9F5", "label": "copper wire", "answer": "yes", "why": "Copper is a metal, and one of the best conductors."},
                  {"pic": "\U0001F4CF", "label": "plastic ruler", "answer": "no", "why": "Plastic is an insulator."},
                  {"pic": "\U0001F511", "label": "steel key", "answer": "yes", "why": "Steel is a metal: a conductor."},
                  {"pic": "\U0001F9FD", "label": "rubber eraser", "answer": "no", "why": "Rubber is an insulator. That is why it covers wires."},
                  {"pic": "\U0001F9FB", "label": "aluminium foil", "answer": "yes", "why": "Aluminium is a metal. The lamp lights."},
                  {"pic": "✏️", "label": "wooden pencil", "answer": "no", "why": "Wood is an insulator."},
                  {"pic": "\U0001FA99", "label": "a coin", "answer": "yes", "why": "Coins are metal: conductors."},
                  {"pic": "\U0001F9F4", "label": "a glass bead", "answer": "no", "why": "Glass is an insulator."},
              ]},
             "Metals conduct. Plastic, rubber, wood and glass insulate."),

        step("record", "Record the conductor test", "\U0001F4CB", "Conductor table", ["4TWSc.08", "4Pe.04"],
             "Fill in the table. Was the <b>%s</b> a conductor?",
             explain(
                 ["The results, in a table."],
                 ["Copper wire: conductor.", "Plastic ruler: insulator.", "Coin: conductor.", "Wooden pencil: insulator."],
                 [],
                 ["Tap the answer for each row."]),
             {"ask": "Was the %s a conductor or an insulator?",
              "columns": ["Material", "Result"],
              "rows": [
                  {"pic": "\U0001F9F5", "label": "copper wire", "answer": "cond", "why": "the lamp lit. Copper conducts."},
                  {"pic": "\U0001F4CF", "label": "plastic ruler", "answer": "ins", "why": "the lamp stayed off. Plastic insulates."},
                  {"pic": "\U0001FA99", "label": "coin", "answer": "cond", "why": "the lamp lit. Metal conducts."},
                  {"pic": "✏️", "label": "wooden pencil", "answer": "ins", "why": "the lamp stayed off. Wood insulates."},
              ],
              "choices": [{"id": "cond", "t": "conductor", "pic": "\U0001F4A1"}, {"id": "ins", "t": "insulator", "pic": "\U0001F6AB"}]},
             "Metals: conductors. The rest: insulators."),

        step("demo", "A switch is a gap you control", "\U0001F39A️", "Switches", ["4Pe.02", "4Pe.01"],
             "Press <b>Next</b> to see inside a switch.",
             explain(
                 ["A switch is two metal contacts. Closed, they touch and the circuit is complete. Open, there is a gap and nothing flows."],
                 ["A light switch on the wall.", "A push button on a doorbell: closed only while you press.", "A torch slider.", "All of them: a gap, opened and closed."],
                 ["Children think off means the electricity is gone.", "The cells are still full. The path is broken."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F39A️", "cap": "Inside a switch: two metal contacts.", "say": "Inside every switch are two pieces of metal, called contacts."},
                 {"pic": "\U0001F4A1", "cap": "<b>Closed</b>: the contacts touch. The circuit is complete and the lamp lights.", "say": "Press the switch on and the contacts touch. The circuit is one complete loop, electricity flows, and the lamp lights."},
                 {"pic": "\U0001F311", "cap": "<b>Open</b>: a gap between the contacts. A break in the circuit. Nothing flows.", "say": "Press it off and the contacts part. Now there is a gap, a break in the circuit. Nothing can flow, so the lamp is dark. The cells are still full; the path is broken."},
                 {"pic": "\U0001F6CE️", "cap": "A doorbell button is a switch that closes only while you press it.", "say": "A doorbell button is a switch that stays open until you press it, closes while your finger is on it, and springs open again when you let go."},
             ]},
             "A switch opens and closes a gap in the circuit."),

        step("questions", "Choose the equipment", "\U0001F9F0", "Right kit", ["4TWSc.03", "4Pe.03", "4Pe.04"],
             "Which piece of equipment does the job? Tap it.",
             explain(
                 ["Choosing the right equipment is part of doing science."],
                 ["To make a lamp brighter: another cell.", "To turn a circuit on and off: a switch.", "To test a material: a circuit with a gap.", "To cover a bare wire safely: plastic tape, an insulator."],
                 ["Children reach for more wire to make things brighter.", "Wire carries; cells push."],
                 ["Read the job, then tap the equipment."]),
             {"label": "Question", "items": [
                 q("You want the lamp brighter. Which do you add?", "\U0001F4A1", "another cell", ["another lamp", "a longer wire", "a switch"], "Cells push harder."),
                 q("You want to turn the circuit on and off. Which do you add?", "\U0001F39A️", "a switch", ["a cell", "a lamp"], "A gap you control."),
                 q("You want to test whether a spoon conducts. Which do you use?", "\U0001F944", "a circuit with a gap to put the spoon in", ["a magnet", "a ruler"], "The lamp tells you."),
                 q("You need to cover a bare wire safely. Which do you use?", "\U0001F9F5", "plastic tape, an insulator", ["foil", "a coin"], "An insulator keeps the electricity in the wire."),
                 q("You want to measure how long a wire is. Which do you use?", "\U0001F4CF", "a ruler, in centimetres", ["a cell", "a lamp"], "Length: a ruler."),
             ]},
             "The right equipment for the job."),

        step("context", "Electricians", "\U0001F9D1\U0001F3FE‍\U0001F527", "Circuit jobs", ["4SIC.04", "4Pe.04", "4Pe.02"],
             "People near you work with circuits every day. Tap each one.",
             explain(
                 ["Circuit science is a job in every town."],
                 ["An electrician wires houses and knows every switch and fuse.", "A lighting technician makes a stage bright or dim on cue.", "A car mechanic finds the break when a headlight fails.", "A phone repairer works with circuits smaller than a fingernail."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F527", "label": "electrician", "say": "An electrician wires a whole house: switches, sockets and lamps, all in circuits, with insulators everywhere a person might touch."},
                 {"pic": "\U0001F3AD", "label": "lighting technician", "say": "A lighting technician at a theatre makes the stage bright or dim on cue, using exactly what you just did: more or less push to each lamp."},
                 {"pic": "\U0001F697", "label": "car mechanic", "say": "When a headlight fails, a mechanic tests the circuit for a break: a blown bulb, a broken wire, a switch stuck open."},
                 {"pic": "\U0001F4F1", "label": "phone repairer", "say": "A phone repairer works with circuits so small you need a lens, but the rules are the same: a break, and it stops."},
             ], "need": 4,
              "then": {"ask": "A headlight has stopped working. What is the mechanic looking for?",
                       "opts": [opt("A break somewhere in the circuit", True), opt("A bigger car", False), opt("More petrol", False)],
                       "why": "A device will not work with a break in its circuit."}},
             "Electricians, technicians, mechanics and repairers all use circuit science."),

        step("questions", "Circuit check", "✅", "Circuit check", ["4Pe.01", "4Pe.02", "4Pe.03", "4Pe.04"],
             "Tap the answer.",
             explain(
                 ["Breaks, switches, brightness, conductors."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("A wire comes loose in a torch. What happens?", "\U0001F526", "it stops working: a break in the circuit", ["it gets brighter", "nothing"], "A break stops everything."),
                 q("What does a switch do?", "\U0001F39A️", "opens and closes a gap in the circuit", ["makes electricity", "stores electricity"], "A gap you control."),
                 q("Two lamps on one cell, instead of one. Each lamp is...", "\U0001F4A1", "dimmer", ["brighter", "the same"], "The push is shared."),
                 q("Which material is a conductor?", "\U0001F511", "a steel key", ["a plastic ruler", "a rubber eraser"], "Metal conducts."),
                 q("Why are wires covered in plastic?", "\U0001F9F5", "plastic is an insulator, so the electricity stays in the wire", ["it looks nice", "plastic conducts"], "Safety."),
             ]},
             "You know your circuits."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Pe.01", "4Pe.02", "4Pe.03", "4Pe.04", "4TWSc.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("You add a second cell. The lamp gets...", "\U0001F50B", "brighter", ["dimmer", "no different"], "More push."),
                 q("You add a third lamp to the loop. The lamps get...", "\U0001F4A1", "dimmer", ["brighter", "hotter"], "Push shared three ways."),
                 q("What is inside a switch?", "\U0001F39A️", "two metal contacts that touch or part", ["a tiny cell", "a magnet"], "Closed: touch. Open: gap."),
                 q("A doorbell rings only while you press it because...", "\U0001F6CE️", "the switch closes only while pressed", ["the bell is tired", "the cell is small"], "Springs open when you let go."),
                 q("Which is an insulator?", "\U0001F9F4", "a glass bead", ["a coin", "aluminium foil", "copper wire"], "Glass does not conduct."),
                 q("Every metal you tested...", "\U0001F9F5", "conducted electricity", ["insulated", "melted"], "Metals are conductors."),
                 q("To turn a lamp on and off you need...", "\U0001F39A️", "a switch", ["another lamp", "a longer wire"], "The right equipment."),
                 q("Who tests a car's headlight circuit for a break?", "\U0001F697", "a mechanic", ["a chef", "a farmer"], "Circuit science at work."),
             ]},
             "That is the whole lesson finished. You know how circuits work."),
    ],
}

LESSON["about"] = [
    "Say why a device stops when there is a break in its circuit.",
    "Say how a switch opens and closes a circuit.",
    "Say what makes a lamp brighter or dimmer.",
    "Test materials to find conductors and insulators, and choose the right equipment.",
]

LESSON["lecture"] = [
    part("\U0001F50B", "One loop",
         "A series circuit is one loop: cell, wires, lamp, and back to the cell. Electricity flows round the whole loop. Break it anywhere, a loose wire, a blown bulb, and it all stops."),
    part("\U0001F39A️", "A switch",
         "A switch is a break you control. Inside are two metal contacts. Closed, they touch and the loop is complete. Open, there is a gap and nothing flows. The cells are still full. The path is broken."),
    part("\U0001F4A1", "Brighter and dimmer",
         "Cells push electricity round the loop. Add a cell and the push is bigger, so the lamp is brighter. Add a lamp and the same push is shared, so each lamp is dimmer."),
    part("\U0001F50C", "Conductors and insulators",
         "Some materials let electricity through: conductors. Metals are the best. Some do not: insulators. Plastic, rubber, wood and glass. That is why wires are copper inside and plastic outside."),
    part("\U0001F9F0", "Today",
         "Today you add cells and lamps and watch the light change, open and close a switch, put eight materials in a gap to find the conductors, and choose the right equipment for each job."),
]

LESSON["words"] = [
    word("circuit", "\U0001F501", "A complete loop that electricity can flow round.",
         ["A break stops the circuit.", "A switch is part of the circuit."]),
    word("break", "✂️", "A gap in a circuit that stops electricity flowing.",
         ["A loose wire is a break.", "Find the break and the lamp will light."]),
    word("switch", "\U0001F39A️", "Two contacts that open or close a gap in a circuit.",
         ["Flick the switch to close the circuit.", "An open switch is a break."]),
    word("cell", "\U0001F50B", "A store of electrical energy that pushes electricity round a circuit.",
         ["Two cells push harder than one.", "The cell is what people call a battery."]),
    word("component", "\U0001F4A1", "One part of a circuit: a cell, a lamp, a switch, a wire.",
         ["A lamp is a component.", "Add a component and the brightness changes."]),
    word("conductor", "\U0001F9F5", "A material that lets electricity through. Metals are good conductors.",
         ["Copper is a conductor.", "A key is a conductor."]),
    word("insulator", "\U0001F9F4", "A material that does not let electricity through.",
         ["Plastic is an insulator.", "Insulators keep you safe from wires."]),
]

LESSON["home"] = [
    home("Torch batteries", "A torch that takes two batteries, a grown-up",
         ["Switch it on with both batteries. Look at the brightness.",
          "Take one out. Does it still light? Is it dimmer?",
          "Put it back and open and close the switch slowly."],
         "Two cells push harder than one. The switch is the gap."),
    home("Switch hunt", "Paper and a pencil, one room",
         ["Find every switch: lights, a kettle, a lamp, a games controller.",
          "For each, say what happens inside: contacts touch, or a gap.",
          "Find one that only works while you press it."],
         "A doorbell, a car horn, a games button: closed only while pressed."),
    home("Conductor or insulator?", "A torch that opens, a grown-up, foil, a coin, a plastic lid, a pencil, an eraser",
         ["With a grown-up, take the torch apart and find the battery and bulb.",
          "Bridge them with foil. Does the bulb glow?",
          "Try each other thing and make a table."],
         "Metal things light it. Plastic, rubber and wood do not. Never try this with a socket."),
]
