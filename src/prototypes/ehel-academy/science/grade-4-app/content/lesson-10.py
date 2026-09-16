# -*- coding: utf-8 -*-
"""Lesson 10 - Circuits and Switches.

0097 Stage 4: 4Pe.01 a device will not work with a break in the circuit;
4Pe.02 a switch opens and closes a circuit; 4Pe.03 more or different
components make a lamp brighter or dimmer; 4Pe.04 conductors and
insulators; with 4TWSp.03, 4TWSp.05, 4TWSa.01, 4TWSa.03, 4TWSc.03,
4TWSc.06, 4TWSc.08 and 4SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home, icon, cando

LESSON = {
    "slug": "circuits-and-switches",
    "title": "Circuits and Switches",
    "blurb": "Add cells and lamps to a circuit to see the light change, open and close a switch, test eight materials in a gap to find the conductors, and choose the right equipment for the job.",
    "steps": [
        step("experiment", "Brighter, dimmer, off", "\U0001F4A1", "Series circuit", ["4Pe.01", "4Pe.02", "4Pe.03", "4TWSp.03", "4TWSa.01", "4TWSa.03", "4TWSc.06"],
             "One cell, one lamp, one switch. Build it the safe way: cells only, never the plug socket. Predict what adding a second cell will do.",
             explain(
                 ["In a series circuit everything is in one loop.", "More cells push harder: brighter. More lamps share the push: dimmer. Open the switch: a break, and everything stops.",
                  "Build circuits safely: use cells, never the plug socket; dry hands; never join the two ends of a cell with just a wire; and if a wire gets hot, open the switch and tell a grown-up."],
                 ["Add a cell: brighter.", "Add a lamp: each one dimmer.", "Open the switch: off. Close it: on."],
                 ["Children think a switch makes electricity.", "A switch only opens or closes a gap. The cells do the pushing."],
                 ["Dry hands, cells only. Predict, add a cell, add a lamp, open and close the switch, then conclude."]),
             {"sim": "seriesCircuit",
              "predict": {"ask": "Adding a second <b>cell</b> will make the lamp...",
                          "opts": [opt("brighter", True), opt("dimmer", False), opt("go out", False)]},
              "plan": {"ask": "How shall we find out what a second cell does? Which way is fair?",
                        "opts": [opt("The same lamp and the same wires, changing only the number of cells", True), opt("A brighter lamp with the second cell", False), opt("Two cells and two lamps at once", False)],
                        "why": "Only the cells may change. Swap the lamp as well and you will not know which change made the difference."},
              "runAsk": "Add a cell. Add a lamp. Open the switch, then close it. Watch the lamps. With a real circuit, you would open the switch before adding or taking out anything.",
              "happened": {"ask": "What happened to the <b>lamp</b>?",
                           "opts": [opt("A second cell made the lamp brighter; a second lamp made them dimmer; the open switch turned them off", True), opt("Nothing changed, whatever you added or switched", False), opt("More cells made the lamp dimmer, and the switch did nothing", False)],
                           "why": "Cells push. Lamps share the push. A switch is a gap you control."},
              "conclude": {"ask": "Why does opening the switch turn every lamp off?",
                           "opts": [opt("It makes a break in the circuit, so no electricity can flow anywhere in the loop", True), opt("It takes the cells out", False), opt("It makes the wires longer", False)],
                           "why": "A series circuit is one loop. One break anywhere stops it all."}},
             "More cells: brighter. More lamps: dimmer. A break: off. And the safe way to build it: cells only, dry hands, switch open while you change it."),

        step("predictEach", "Conductor, or insulator?", "\U0001F50C", "Conductor test", ["4Pe.04", "4TWSp.03", "4TWSa.01"],
             "Put the <b>%s</b> in the gap. Predict: will the lamp light?",
             explain(
                 ["A conductor lets electricity through. An insulator does not.", "Metals are good conductors. Plastic, rubber, wood and glass are insulators."],
                 ["A copper wire: the lamp lights.", "A plastic ruler: nothing.", "A key: lights.", "A rubber balloon: nothing."],
                 ["Children think anything shiny conducts.", "A shiny plastic lid is an insulator. It is the metal that conducts."],
                 ["Predict for each one, then test it."]),
             {"sim": "conductor", "ask": "Put the %s in the gap. Will the lamp light?", "tryLabel": "Test it",
              "choices": [{"id": "yes", "t": "lights: a conductor", "pic": "\U0001F4A1"}, {"id": "no", "t": "stays off: an insulator", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": icon("wire"), "label": "copper wire", "answer": "yes", "why": "Copper is a metal, and one of the best conductors."},
                  {"pic": "\U0001F4CF", "label": "plastic ruler", "answer": "no", "why": "Plastic is an insulator."},
                  {"pic": "\U0001F511", "label": "steel key", "answer": "yes", "why": "Steel is a metal: a conductor."},
                  {"pic": "\U0001F388", "label": "rubber balloon", "answer": "no", "why": "Rubber is an insulator."},
                  {"pic": icon("foil"), "label": "aluminium foil", "answer": "yes", "why": "Aluminium is a metal. The lamp lights."},
                  {"pic": icon("lollystick"), "label": "wooden lolly stick", "answer": "no", "why": "Wood is an insulator."},
                  {"pic": icon("coin"), "label": "coin", "answer": "yes", "why": "Coins are metal: conductors."},
                  {"pic": icon("glass"), "label": "small glass", "answer": "no", "why": "Glass is an insulator."},
              ]},
             "Metals conduct. Plastic, rubber, wood and glass insulate."),

        step("record", "Record the conductor test", "\U0001F4CB", "Conductor table", ["4TWSc.08", "4Pe.04"],
             "Fill in the table. Was the <b>%s</b> a conductor?",
             explain(
                 ["The results, in a table."],
                 ["Copper wire: conductor.", "Plastic ruler: insulator.", "Coin: conductor.", "Wooden lolly stick: insulator."],
                 [],
                 ["Tap the answer for each row."]),
             {"ask": "Was the %s a conductor or an insulator?",
              "columns": ["Material", "Result"],
              "rows": [
                  {"pic": icon("wire"), "label": "copper wire", "answer": "cond", "why": "the lamp lit. Copper conducts."},
                  {"pic": "\U0001F4CF", "label": "plastic ruler", "answer": "ins", "why": "the lamp stayed off. Plastic insulates."},
                  {"pic": icon("coin"), "label": "coin", "answer": "cond", "why": "the lamp lit. Metal conducts."},
                  {"pic": icon("lollystick"), "label": "wooden lolly stick", "answer": "ins", "why": "the lamp stayed off. Wood insulates."},
              ],
              "choices": [{"id": "cond", "t": "conductor", "pic": "\U0001F4A1"}, {"id": "ins", "t": "insulator", "pic": "\U0001F6AB"}],
              "read": [
                  {"ask": "Read your table. Which materials let the electricity through?",
                   "opts": [opt("the metal ones", True), opt("all four of them", False), opt("none of them", False)],
                   "why": "The conductors are the metals. Plastic and wood are insulators."},
                  {"ask": "What do all the conductors in your table have in common?",
                   "opts": [opt("they are all metals", True), opt("they are all shiny", False), opt("they are all hard", False)],
                   "why": "Glass is hard and shiny and conducts nothing. Being a metal is what matters."},
              ]},
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
                 ["To make a lamp brighter: another cell.", "To turn a circuit on and off: a switch.", "To test a material: a circuit with a gap.", "To cover a bare wire in your cell circuit: plastic tape, an insulator. A damaged wire on anything that plugs into the wall is for a grown-up to deal with, never you."],
                 ["Children reach for more wire to make things brighter.", "Wire carries; cells push."],
                 ["Read the job, then tap the equipment."]),
             {"label": "Question", "items": [
                 q("You want the lamp brighter. Which do you add?", "\U0001F4A1", "another cell", ["another lamp", "a longer wire", "a switch"], "Cells push harder."),
                 q("You want to turn the circuit on and off. Which do you add?", "\U0001F39A️", "a switch", ["a cell", "a lamp"], "A gap you control."),
                 q("You want to test whether a spoon conducts. Which do you use?", "\U0001F944", "a circuit with a gap to put the spoon in", ["a magnet to see if the spoon sticks", "a ruler to measure the spoon"], "The lamp tells you."),
                 q("A wire in your cell circuit has a bare patch. Which do you cover it with?", "\U0001F50B", "plastic tape, an insulator", ["a strip of kitchen foil", "a coin pressed onto it"], "An insulator keeps the electricity in the wire. Only ever do this in a cell circuit: a damaged wire on anything that plugs into the wall is a job for a grown-up."),
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

        step("questions", "Safe with electricity", "\u26A0\uFE0F", "Safety first", ["4TWSp.05"],
             "Spot the risk, and say how to stay safe. Tap the answer.",
             explain(
                 ["Practical work with electricity is safe when you know the risks.", "A cell gives a small, safe push. The socket in the wall does not."],
                 ["Use cells, wires and lamps, never the plug socket.", "Dry your hands before you touch a switch.",
                  "If a wire gets hot, disconnect the cell and tell an adult."],
                 ["Children think a thin wire cannot hurt anyone.", "Mains electricity through the wall can kill. Only plugs go into sockets."],
                 ["Read each one, find the risk, then tap how to stay safe."]),
             {"label": "Question", "items": [
                 q("You want to test a circuit in class. Which is safe to use?", "\U0001F50B", "a cell, some wires and a lamp", ["the plug socket in the wall", "a mains lamp with its cover off"], "A cell gives a small push that is safe. Mains electricity from a socket can kill."),
                 q("Your hands are wet. What should you do before you touch a switch?", "\U0001F4A7", "dry them first", ["touch it quickly", "wipe them on the wire"], "Water can carry electricity. Dry hands, always."),
                 q("A wire in your circuit is getting hot. What should you do?", "\U0001F525", "disconnect the cell and tell an adult", ["keep going", "hold the wire tightly"], "A hot wire is a risk. Break the circuit and get help."),
                 q("Why should you never push anything into a plug socket?", "\U0001F50C", "the electricity there is strong enough to kill", ["it wastes electricity", "it makes the lights flicker"], "Mains electricity is dangerous. Only plugs go into sockets."),
                 q("Your circuit lights a lamp with nothing plugged into a wall. How?", "\U0001F4A1", "the electricity is in the circuit itself", ["a hidden wire runs to the mains", "the lamp stored it up earlier"],
                   "Electricity does not have to come from the mains. A cell and a complete loop of wire are enough."),
                 q("Is the electricity in your class circuit the same as the electricity at home?", "\U0001F50C", "No - the mains push is hundreds of times bigger", ["Yes, electricity is all the same", "Yes, but the wires at home are thicker"],
                   "A cell gives a small, safe push. That is why a cell cannot hurt you and the mains can kill you."),
             ]},
             "You know the risks, and how to stay safe with electricity.",
             mis=["6.1-m2", "6.3-m1"]),

        step("questions", "Circuit check", "✅", "Circuit check", ["4Pe.01", "4Pe.02", "4Pe.03", "4Pe.04"],
             "Tap the answer.",
             explain(
                 ["Breaks, switches, brightness, conductors."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("A wire comes loose in a torch. What happens?", "\U0001F526", "it stops working: a break in the circuit", ["it gets brighter, with less wire to go round", "nothing changes at all"], "A break stops everything."),
                 q("What does a switch do?", "\U0001F39A️", "opens and closes a gap in the circuit", ["makes electricity", "stores electricity"], "A gap you control."),
                 q("Two lamps on one cell, instead of one. Each lamp is...", "\U0001F4A1", "dimmer", ["brighter", "the same"], "The push is shared."),
                 q("Which material is a conductor?", "\U0001F4A1", "a steel key", ["a plastic ruler", "a rubber balloon"], "Metal conducts."),
                 q("Why are wires covered in plastic?", "\U0001F50C", "plastic is an insulator, so the electricity stays in the wire", ["to make the wires look bright and colourful", "because plastic conducts electricity well"], "Safety."),
                 q("What does the cell do in a circuit?", "\U0001F50B", "it pushes the electricity that is already in the wire", ["it makes the electricity", "it stores up the lamp's light"],
                   "The electricity is inside the copper wire all along. What the cell gives it is the push."),
                 q("Why must the wire run all the way back to the cell?", "\U0001F501", "so there is a complete loop for the cell to push round", ["so the lamp does not get too bright", "so the electricity has somewhere to rest"],
                   "The path has to go from one end of the cell to the other. Stop it at the lamp and nothing moves at all."),
             ]},
             "You know your circuits.",
             mis=["6.1-m1", "6.1-m3"]),

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
                 q("What is inside a switch?", "\U0001F39A️", "two metal contacts that touch or part", ["a tiny cell that makes electricity", "a magnet that pulls the wires"], "Closed: touch. Open: gap."),
                 q("A doorbell rings only while you press it because...", "\U0001F6CE️", "the switch closes only while pressed", ["the bell gets tired after one ring", "the cell is too small to ring for long"], "Springs open when you let go."),
                 q("Which is an insulator?", "\U0001F50C", "a small glass", ["a coin", "aluminium foil", "copper wire"], "Glass does not conduct."),
                 q("Every metal you tested...", "\U0001F511", "conducted electricity", ["insulated", "melted"], "Metals are conductors."),
                 q("To turn a lamp on and off you need...", "\U0001F4A1", "a switch", ["another lamp", "a longer wire"], "The right equipment."),
                 q("Who tests a car's headlight circuit for a break?", "\U0001F697", "a mechanic", ["a chef", "a farmer"], "Circuit science at work."),
                 q("Before testing a coin, you touch the two wire ends together and the lamp lights. Why check that first?", "\U0001F914", "to show the circuit works, so a dark lamp means an insulator", ["to make the lamp brighter for the coin", "to use up some of the cell first"], "If the lamp lights with the gap closed, the circuit works. Then a lamp that stays dark with the coin in the gap can only mean the coin does not conduct."),
                 q("The circuit worked before. If the lamp stays dark with a rubber in the gap, what does that show?", "\U0001F4A1", "rubber is an insulator", ["rubber is a conductor", "the cell is too big"], "The circuit was working. So the rubber stopped the electricity."),
                 q("Why do electricians wear rubber gloves?", "\U0001F9E4", "rubber is an insulator, so electricity cannot pass into their hands", ["rubber gloves keep their hands warm", "rubber conducts electricity well"], "An insulator does not let electricity through."),
                 q("Tap water is clean and safe to drink. Is it pure?", "\U0001F6B0", "No - it has other substances dissolved in it", ["Yes, clean water is pure water", "Yes, or it would not be safe to drink"],
                   "Safe to drink is not the same as pure - and those dissolved substances are exactly why tap water conducts electricity."),
             ],
              "support": [
                 q("Is copper a conductor or an insulator?", "\U0001F50C", "a conductor", ["an insulator"],
                   "Metals conduct electricity."),
                 q("Will a lamp light if there is a break in the circuit?", "\U0001F4A1", "No", ["Yes"],
                   "The loop must be complete."),
              ],
              "extension": [
                 q("Why is a bird safe sitting on a bare power line?", "\U0001F426", "the electricity has no loop through it to the ground", ["birds cannot feel electricity", "the line is switched off in the daytime"],
                   "Electricity needs a complete path. Both the bird's feet are on the same wire, so there is no loop through the bird."),
                 q("A torch with two cells has gone dim. You swap just ONE cell for a fresh one. What happens?", "\U0001F526", "a little brighter, but not as bright as two fresh cells", ["as bright as new, because one fresh cell is enough", "nothing changes at all"],
                   "In a series circuit the two cells push together. One tired cell still holds the whole loop back."),
              ]},
             "That is the whole lesson finished. You know how circuits work.",
             mis=["6.2-m1"]),
    ],
}

LESSON["about"] = [
    "Say why a device stops when there is a break in its circuit.",
    "Say how a switch opens and closes a circuit.",
    "Say what makes a lamp brighter or dimmer.",
    "Test materials to find conductors and insulators, and choose the right equipment.",
]

LESSON["warmup"] = [
    q("Light always travels in...", "\U0001F4CF", "straight lines", ["curves", "circles"], "From the last lesson: light goes in straight lines."),
    q("Which of these needs electricity to work?", "\U0001F50C", "a lamp", ["a spoon", "a pencil"], "A lamp needs electricity to light up."),
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
    word("cell", "\U0001F50B", "A part that stores energy in the chemicals inside it and pushes electricity round a circuit.",
         ["Two cells push harder than one.", "The cell is what people call a battery."]),
    word("component", "\U0001F4A1", "One part of a circuit: a cell, a lamp, a switch, a wire.",
         ["A lamp is a component.", "Add a component and the brightness changes."]),
    word("conductor", "\U0001F511", "A material that lets electricity through. Metals are good conductors.",
         ["Copper is a conductor.", "A key is a conductor."]),
    word("insulator", icon("glass"), "A material that does not let electricity through.",
         ["Plastic is an insulator.", "Insulators keep you safe from wires."]),
    word("lamp", "\U0001F4A1", "The little light in a circuit. Scientists say lamp, not bulb.",
         ["The lamp lights when the circuit is complete.", "Two lamps on one cell are dimmer than one."]),
    word("series circuit", "\U0001F501", "A circuit where everything sits in one single loop, one after another.",
         ["In a series circuit the electricity has only one path.", "Add a lamp to a series circuit and both go dimmer."]),
]

LESSON["cando"] = [
    cando("I know that a device stops working if there is a break in the circuit.", "4Pe.01"),
    cando("I can explain how a switch opens and closes a circuit.", "4Pe.02"),
    cando("I can say what makes a lamp brighter or dimmer in a series circuit.", "4Pe.03"),
    cando("I can name good conductors and good insulators.", "4Pe.04"),
    cando("I know that most metals are good conductors.", "4Pe.04"),
    cando("I can choose the right equipment for a test.", "4TWSc.03"),
    cando("I can work safely, and say what the risks are.", "4TWSp.05"),
    cando("I can record my results in a table.", "4TWSc.08"),
]

LESSON["home"] = [
    home("Torch batteries", "A torch that takes two batteries, a grown-up",
         ["Switch it on with both batteries in. Look at the brightness.",
          "Switch it off. With a grown-up, take one battery out, then switch it on again. Does it light?",
          "It stays off. The missing battery leaves a gap: a break in the circuit.",
          "Put the battery back the right way round, and open and close the switch slowly."],
         "In a torch the batteries are part of one loop, so a missing one is a break, just like an open switch. If you have a torch that takes only one battery, compare how bright the two torches are."),
    home("Switch hunt", "Paper and a pencil, one room",
         ["Find every switch: lights, a kettle, a lamp, a games controller.",
          "For each, say what happens inside: contacts touch, or a gap.",
          "Find one that only works while you press it."],
         "A doorbell, a car horn, a games button: closed only while pressed."),
    home("Conductor or insulator?", "A grown-up, a battery in a battery holder, a small bulb in a bulb holder, two wires with clips (borrow a circuit kit from school; if you cannot, do the Switch hunt instead), foil, a coin, a plastic lid, a wooden lolly stick, an eraser",
         ["With a grown-up, clip one wire from the battery holder to the bulb holder. Clip the second wire to the other side of the bulb holder, and leave its far end loose. The gap is between that loose end and the free end of the battery holder.",
          "Close the gap by touching the loose wire end to the battery holder. The bulb lights: the circuit works.",
          "Now put each test thing into the gap, touching the wire end on one side and the battery holder on the other. Does the bulb glow? Make a table.",
          "Never join the two ends of a battery directly with foil or a wire: it gets hot very fast. Always keep the bulb in the loop. Never try any of this with a plug socket."],
         "Metal things light it. Plastic, rubber and wood do not."),
]
