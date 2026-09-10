# -*- coding: utf-8 -*-
"""Lesson 8 - Energy Everywhere.

0097 Stage 4: 4Pf.01 energy is in all matter and in sound, light and heat;
4Pf.02 energy cannot be made or destroyed, only transferred; 4Pf.03 energy
is needed for any movement or action; 4Pf.04 some energy is transferred to
the surroundings as sound, light or heat; with 4TWSp.03, 4TWSa.01,
4TWSa.03, 4TWSa.04 and 4TWSc.08.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "energy-everywhere",
    "title": "Energy Everywhere",
    "blurb": "Find energy in everything around you, drop a ball and track where its energy goes bounce by bounce, record it, chart it, and learn the rule: energy is never made or lost, only transferred.",
    "steps": [
        step("explore", "Where energy is", "⚡", "Energy hunt", ["4Pf.01", "4Pf.03"],
             "Energy is in everything. Tap each one.",
             explain(
                 ["Energy is what makes things happen. It is in every material, and in sound, light and heat.", "Nothing moves, changes or happens without it."],
                 ["A moving ball has energy.", "A stretched band has energy waiting.", "Sound is energy travelling through air.", "Light and heat are energy from the Sun."],
                 ["Children think energy is only electricity.", "Electricity is one way energy travels. A hot cup, a loud drum and a rolling ball all have it too."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "⚽", "label": "a moving ball", "sub": "movement energy", "say": "A moving ball has energy. That is why it can knock things over. The faster it goes, the more it has."},
                 {"pic": "\U0001FA83", "label": "a stretched band", "sub": "stored energy", "say": "A stretched elastic band has energy stored in it, waiting. Let go and it becomes movement."},
                 {"pic": "\U0001F50A", "label": "sound", "sub": "energy in the air", "say": "Sound is energy travelling through the air as vibrations. A loud drum has more of it than a whisper."},
                 {"pic": "☀️", "label": "light", "sub": "energy from the Sun", "say": "Light is energy. It travels from the Sun to Earth and plants catch it to make food."},
                 {"pic": "\U0001F525", "label": "heat", "sub": "energy in warm things", "say": "Heat is energy. A hot cup has more than a cold one, and it passes into your hands."},
                 {"pic": "\U0001F34E", "label": "food", "sub": "stored energy", "say": "Food has energy stored in it. Your body takes it out to move, grow and stay warm. No food, no action."},
             ], "need": 6,
              "then": {"ask": "What is needed for ANY movement or action to happen?",
                       "opts": [opt("energy", True), opt("electricity", False), opt("water", False)],
                       "why": "Every action needs energy. Electricity is only one way to carry it."}},
             "Energy is in everything, and every action needs it."),

        step("experiment", "Where does the energy go?", "⚽", "Bounce tracker", ["4Pf.02", "4Pf.04", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "Drop a ball three times. Predict what happens to its bounces.",
             explain(
                 ["Energy cannot be made or destroyed. It can only be transferred: moved from one thing, or one form, to another.", "Each bounce, some of the ball's movement energy goes into sound and heat in the surroundings."],
                 ["Bounce one: high, with a thud.", "Bounce two: lower. Some energy left as sound and warmth.", "Bounce three: lower still.", "None of it vanished. It is in the room now."],
                 ["Children say the energy is used up.", "It is never used up. It is transferred somewhere less useful."],
                 ["Predict, drop it three times, say what happened, then conclude."]),
             {"sim": "energyDrop",
              "predict": {"ask": "What will happen to the bounces?",
                          "opts": [opt("Each bounce will be lower than the last", True), opt("Every bounce will be the same height", False), opt("The bounces will get higher", False)]},
              "runAsk": "Press Drop the ball three times. Watch the height, and the bars.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("Each bounce was lower; the movement energy fell as the sound and warmth rose", True), opt("Every bounce was the same", False), opt("The ball bounced higher each time", False)],
                           "why": "The ball's movement energy was transferred, bounce by bounce, into sound you heard and a little warmth in the ball and floor."},
              "conclude": {"ask": "Where did the ball's energy go?",
                           "opts": [opt("It was transferred to the surroundings as sound and heat; none was destroyed", True), opt("It was used up and disappeared", False), opt("It stayed in the ball", False)],
                           "why": "Energy cannot be destroyed. It was transferred out of the ball's movement into the room."}},
             "Energy is never lost. It is transferred, often as sound and heat."),

        step("record", "Record the bounces", "\U0001F4CB", "Bounce table", ["4TWSc.08", "4Pf.04"],
             "Fill in the table. How high was the <b>%s</b>?",
             explain(
                 ["The heights, in a table."],
                 ["First bounce: high, 3 marks.", "Second: 2.", "Third: 1."],
                 [],
                 ["Tap the height for each bounce."]),
             {"ask": "How high was the %s?",
              "columns": ["Bounce", "Height in marks"],
              "rows": [
                  {"pic": "1️⃣", "label": "first bounce", "answer": "3", "why": "the first bounce reached three marks."},
                  {"pic": "2️⃣", "label": "second bounce", "answer": "2", "why": "the second reached two: some energy had gone into sound and heat."},
                  {"pic": "3️⃣", "label": "third bounce", "answer": "1", "why": "the third reached one mark."},
              ],
              "choices": [{"id": "3", "t": "3 marks", "pic": "3️⃣"}, {"id": "2", "t": "2 marks", "pic": "2️⃣"}, {"id": "1", "t": "1 mark", "pic": "1️⃣"}]},
             "Three, two, one. Each bounce lower."),

        step("graph", "Chart the bounces", "\U0001F4CA", "Bounce chart", ["4TWSa.04", "4TWSa.02", "4Pf.04"],
             "Turn the table into a bar chart, then read the pattern.",
             explain(
                 ["A bar chart shows the three heights side by side against a scale."],
                 ["Tap until each bar is right.", "Then say the pattern."],
                 [],
                 ["Build the bars, then answer."]),
             {"columns_label": "Bounce", "value_label": "Height in marks", "unit": "mark", "bar": True,
              "columns": [{"pic": "1️⃣", "label": "first", "value": 3}, {"pic": "2️⃣", "label": "second", "value": 2}, {"pic": "3️⃣", "label": "third", "value": 1}],
              "pattern": {"ask": "What is the pattern?",
                          "opts": [opt("Each bounce is lower than the one before, as energy is transferred away", True), opt("Each bounce is higher", False), opt("There is no pattern", False)],
                          "why": "A falling staircase: three, two, one. Energy leaving the ball each bounce."}},
             "A falling staircase: energy transferred away each bounce."),

        step("demo", "Energy on the move", "\U0001F504", "Transfers", ["4Pf.02", "4Pf.03", "4Pf.04"],
             "Energy is always being transferred from one thing to another. Press <b>Next</b> to follow it.",
             explain(
                 ["Energy moves. It goes from food into your muscles, from your foot into a ball, from a lamp into light.", "And some always leaks into the surroundings as sound, light or heat."],
                 ["Food to muscle.", "Muscle to ball.", "Ball to sound and heat on the floor.", "A lamp: electricity in, light out, and the bulb gets warm."],
                 ["Children think a warm bulb is a broken bulb.", "Every transfer warms something. The warmth is energy that went to the surroundings."],
                 ["Press Next through all five."]),
             {"frames": [
                 {"pic": "\U0001F34E", "cap": "Energy stored in your breakfast.", "say": "Energy starts stored in your breakfast."},
                 {"pic": "\U0001F9B5", "cap": "Your muscles transfer it into movement when you kick.", "say": "Your muscles take it out of the food and transfer it into movement: a kick."},
                 {"pic": "⚽", "cap": "The kick transfers it into the ball, which flies.", "say": "The kick transfers the energy into the ball, which flies across the pitch."},
                 {"pic": "\U0001F50A", "cap": "The ball hits the wall: some energy becomes <b>sound</b>, some <b>warms</b> the wall. It was not lost.", "say": "The ball hits the wall. Thump. Some of its energy became sound, and some warmed the wall a tiny bit. None of it was lost. It was transferred to the surroundings."},
                 {"pic": "\U0001F4A1", "cap": "A lamp: electricity in, light out, and the bulb gets warm. Every transfer leaks a little.", "say": "A lamp is the same. Electricity goes in, light comes out, and the bulb gets warm. Every transfer leaks some energy to the surroundings as heat, light or sound."},
             ]},
             "Energy is transferred from thing to thing, and some always leaks out as sound, light or heat."),

        step("questions", "Energy check", "✅", "Energy check", ["4Pf.01", "4Pf.02", "4Pf.03", "4Pf.04"],
             "Tap the answer.",
             explain(
                 ["Energy everywhere, never lost, always needed, always leaking a little."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which of these has energy?", "⚡", "all of them: a moving ball, a hot cup and a loud drum", ["only the moving ball", "only the hot cup"], "Energy is in everything."),
                 q("Can energy be destroyed?", "\U0001F6D1", "no, only transferred", ["yes, when it is used", "yes, in the cold"], "The rule."),
                 q("Each bounce of the ball was lower because...", "⚽", "energy was transferred to sound and heat", ["the ball got heavier", "the ball got tired"], "Transferred, not lost."),
                 q("A lamp gets warm. Why?", "\U0001F4A1", "some energy leaks to the surroundings as heat", ["it is broken", "light is cold"], "Every transfer leaks."),
                 q("What does every movement need?", "\U0001F3C3\U0001F3FE", "energy", ["light", "sound"], "No energy, no action."),
             ]},
             "You know where energy goes."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Pf.01", "4Pf.02", "4Pf.03", "4Pf.04", "4TWSa.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where does the energy to kick a ball come from?", "\U0001F34E", "your food", ["the ball", "the air"], "Stored in food, taken out by muscles."),
                 q("Sound is...", "\U0001F50A", "energy travelling through the air", ["not energy", "a kind of light"], "Vibrations carrying energy."),
                 q("A stretched elastic band has...", "\U0001FA83", "stored energy waiting to be released", ["no energy", "sound energy"], "Let go and it moves."),
                 q("Energy cannot be made or destroyed. It can only be...", "\U0001F504", "transferred", ["hidden", "eaten"], "Moved from thing to thing."),
                 q("Which chart did you draw of the bounces?", "\U0001F4CA", "a bar chart, three bars getting shorter", ["a map", "a pie"], "A falling staircase."),
                 q("A ball thumps into a wall. The thump is...", "\U0001F50A", "some of the ball's energy transferred as sound", ["the wall making energy", "nothing"], "Sound is energy."),
                 q("Why can a ball never bounce back to the exact height it was dropped from?", "⚽", "some energy always leaks to the surroundings as sound and heat", ["gravity gets stronger", "it can"], "Every transfer leaks."),
                 q("Which has MORE energy?", "\U0001F525", "a hot cup of tea", ["a cold cup of tea"], "Heat is energy."),
             ]},
             "That is the whole lesson finished. Energy is everywhere, and it is never lost."),
    ],
}

LESSON["about"] = [
    "Say where energy is: in everything, and in sound, light and heat.",
    "Say the rule: energy is never made or destroyed, only transferred.",
    "Track where a bouncing ball's energy goes.",
    "Record it in a table and chart it as a bar chart.",
]

LESSON["lecture"] = [
    part("⚡", "Energy everywhere",
         "Energy is what makes things happen. A moving ball has it. A stretched band has it stored. Sound carries it through the air. Light and heat carry it from the Sun. Your food has it. Energy is in everything."),
    part("\U0001F3C3\U0001F3FE", "Nothing moves without it",
         "Every movement, every action, needs energy. Your muscles take it from your food. A lamp takes it from electricity. A plant takes it from light. No energy, and nothing happens at all."),
    part("\U0001F504", "Never made, never lost",
         "Here is the big rule. Energy cannot be made, and it cannot be destroyed. It can only be transferred: moved from one thing to another, or from one form to another. Food to muscle. Muscle to ball."),
    part("⚽", "Where it goes",
         "Drop a ball. Thud. It bounces, but lower. Some of its movement energy became sound, and some warmed the ball and the floor a tiny bit. Bounce by bounce, the energy leaks into the room. It is not lost. It has moved."),
    part("\U0001F4A1", "Leaking out",
         "Every transfer leaks a little into the surroundings as sound, light or heat. That is why a bulb gets warm and a bouncing ball stops. Today you track it, record it and chart it."),
]

LESSON["words"] = [
    word("energy", "⚡", "What makes things happen. It is in everything, and every action needs it.",
         ["A moving ball has energy.", "Food gives you energy."]),
    word("transfer", "\U0001F504", "To move energy from one thing to another, or one form to another.",
         ["The kick transfers energy to the ball.", "Energy is transferred, never lost."]),
    word("stored energy", "\U0001FA83", "Energy kept ready in something, like a stretched band or food.",
         ["A stretched band has stored energy.", "Food is stored energy."]),
    word("movement energy", "⚽", "The energy a moving thing has.",
         ["A rolling ball has movement energy.", "Faster means more movement energy."]),
    word("surroundings", "\U0001F3E0", "Everything around a thing: the air, the floor, the room.",
         ["Some energy leaks to the surroundings.", "The bounce warmed the surroundings a little."]),
    word("sound", "\U0001F50A", "Energy travelling through the air as vibrations.",
         ["The thud was sound energy.", "A drum makes sound energy."]),
    word("heat", "\U0001F525", "Energy in warm things. It passes from hot to cold.",
         ["Heat leaks from the bulb.", "A hot cup has heat energy."]),
]

LESSON["home"] = [
    home("Bounce count", "A ball, a hard floor, a wall with marks or a tape measure",
         ["Drop the ball from shoulder height and watch the first bounce. Mark how high.",
          "Watch the second and third bounces and mark those.",
          "Draw a bar chart of the three heights."],
         "A falling staircase. Say where the energy went after each bounce."),
    home("Feel the leak", "Your hands, a lamp that has been on, a grown-up",
         ["Rub your hands together hard for twenty seconds. Feel them.",
          "Hold your hand NEAR (not on) a lamp that has been on. Feel the warmth.",
          "Say what energy went in, and what came out."],
         "Movement became heat. Electricity became light and heat. Every transfer leaks."),
    home("Energy trail", "Paper and a pencil, one thing you did today",
         ["Pick something you did: ran, kicked, rode a bike.",
          "Draw the energy trail: Sun, plant, food, you, the action, then sound and heat.",
          "Put an arrow on each step."],
         "Every action traces back to the Sun."),
]
