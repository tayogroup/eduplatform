# -*- coding: utf-8 -*-
"""Lesson 7 - Electricity and Magnets.

0097 Stage 1 Electricity and magnetism, both: 1Pe.01 things that need
electricity to work; 1Pe.02 what happens when magnets approach and touch
different materials; with 1TWSp.02, 1TWSc.01, 1TWSc.04, 1TWSc.05, 1TWSa.01,
1SIC.01 and 1SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "electricity-and-magnets",
    "title": "Electricity and Magnets",
    "blurb": "Find out which things need electricity to work, learn to stay safe around it, and test which things a magnet will stick to.",
    "steps": [
        step("explore", "Does it need electricity?", "\U0001F4A1", "Electric things", ["1Pe.01"],
             "Tap each thing. Some need <b>electricity</b> to work, some do not.",
             explain(
                 ["Some things only work when electricity flows into them.", "Others work with no electricity at all."],
                 ["A lamp needs electricity. Switch it off and the light goes out.", "A television needs electricity.",
                  "A book needs none. You can read it anywhere.", "A wooden chair needs none."],
                 ["Children think anything with a switch or a button is electric.", "A tap has a handle and needs no electricity."],
                 ["Tap every picture and hear whether it needs electricity."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "lamp", "sub": "needs electricity", "say": "A lamp needs electricity. Press the switch and electricity flows in and the bulb lights up."},
                 {"pic": "\U0001F4FA", "label": "television", "sub": "needs electricity", "say": "A television needs electricity to show pictures."},
                 {"pic": "\U0001F4D6", "label": "book", "sub": "no electricity", "say": "A book needs no electricity. You can read it anywhere, even by the window."},
                 {"pic": "\U0001F9CA", "label": "fridge", "sub": "needs electricity", "say": "A fridge needs electricity to keep food cold."},
                 {"pic": "\U0001FA91", "label": "chair", "sub": "no electricity", "say": "A chair needs no electricity. You just sit on it."},
                 {"pic": "\U0001F526", "label": "torch", "sub": "needs electricity", "say": "A torch needs electricity from its batteries."},
                 {"pic": "\U0001F6B2", "label": "bicycle", "sub": "no electricity", "say": "A bicycle needs no electricity. Your legs push the pedals."},
                 {"pic": "\U0001F4F1", "label": "phone", "sub": "needs electricity", "say": "A phone needs electricity. When its battery is empty it stops working."},
             ], "need": 8},
             "Some things need electricity to work. Some do not."),

        step("sort", "Electricity, or not?", "\U0001F5C2️", "Sorted it", ["1Pe.01", "1TWSc.01"],
             "Does this need <b>electricity</b> to work? Tap the right bin.",
             explain(
                 ["The test is simple: if the electricity went off, would this still work?"],
                 ["A kettle: no electricity, no hot water. It needs it.", "A spoon: works fine. It does not.",
                  "A hair dryer: needs it.", "A ball: does not."],
                 ["Children think a toy car with a battery does not need electricity because there is no plug.", "A battery gives electricity to torches and toys."],
                 ["Ask: would it work if there was no electricity at all?"]),
             {"ask": "Does it need electricity?",
              "bins": [{"id": "yes", "label": "Needs electricity", "pic": "⚡"}, {"id": "no", "label": "No electricity", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001FAD6", "label": "kettle", "bin": "yes", "why": "A kettle needs electricity to heat the water."},
                  {"pic": "\U0001F944", "label": "spoon", "bin": "no", "why": "A spoon works with no electricity at all."},
                  {"pic": "\U0001F4BB", "label": "computer", "bin": "yes", "why": "A computer needs electricity."},
                  {"pic": "⚽", "label": "ball", "bin": "no", "why": "A ball needs no electricity. You kick it."},
                  {"pic": "\U0001F697", "label": "toy car with a battery", "bin": "yes", "why": "The battery gives it electricity. No battery, no go."},
                  {"pic": "✏️", "label": "pencil", "bin": "no", "why": "A pencil needs no electricity."},
                  {"pic": "\U0001F50A", "label": "radio", "bin": "yes", "why": "A radio needs electricity to make sound."},
                  {"pic": "\U0001F9F8", "label": "teddy bear", "bin": "no", "why": "A teddy bear needs no electricity."},
                  {"pic": "\U0001F9F9", "label": "vacuum cleaner", "bin": "yes", "why": "A vacuum cleaner needs electricity for its motor."},
                  {"pic": "\U0001F6B0", "label": "tap", "bin": "no", "why": "A tap has a handle, but it needs no electricity."},
              ]},
             "If it would stop when the power goes off, it needs electricity."),

        step("demo", "Where does it come from? Stay safe", "\U0001F50C", "Safe with power", ["1Pe.01", "1TWSc.04"],
             "Electricity comes from the wall or from batteries. It is useful <b>and</b> it can hurt. Press <b>Next</b>.",
             explain(
                 ["Electricity reaches a lamp through the plug in the wall, or comes from a battery inside a torch.", "It is very useful and it can be dangerous."],
                 ["Never put anything into a wall socket except a plug.", "Keep electric things away from water.", "If a wire is broken, tell a grown-up and do not touch it."],
                 ["Children think a small socket cannot hurt.", "The electricity in a socket can hurt you badly. Only plugs go in."],
                 ["Press Next and learn the three safety rules."]),
             {"frames": [
                 {"pic": "\U0001F50C", "cap": "Electricity comes into the house through wires to the <b>wall socket</b>.", "say": "Electricity comes into the house through wires to the wall socket. A plug takes it to the lamp."},
                 {"pic": "\U0001F50B", "cap": "A <b>battery</b> gives electricity to torches and toys.", "say": "A battery gives electricity to torches, toys and phones."},
                 {"pic": "⚠️\U0001F50C", "cap": "Rule 1: <b>only plugs</b> go into a socket. Never fingers or toys.", "say": "Rule one. Only plugs go into a socket. Never fingers, never toys, never anything else."},
                 {"pic": "\U0001F4A7\U0001F6AB", "cap": "Rule 2: keep electric things <b>away from water</b>.", "say": "Rule two. Keep electric things away from water. Wet hands and electricity do not mix."},
                 {"pic": "\U0001F9D1‍\U0001F527", "cap": "Rule 3: a broken wire? <b>Tell a grown-up</b>. Do not touch.", "say": "Rule three. If you see a broken wire, do not touch it. Tell a grown-up."},
             ]},
             "Only plugs in sockets. Away from water. Tell a grown-up. Three rules."),

        step("context", "Before electricity", "\U0001F56F️", "Long ago", ["1SIC.01"],
             "Long ago there was no electricity in houses. Tap each picture to see what people did instead.",
             explain(
                 ["Not so long ago, houses had no electricity at all.", "People had to do everything another way."],
                 ["For light at night they lit candles and oil lamps.", "To keep food cold they used ice or a cool cellar.",
                  "To wash clothes they scrubbed by hand.", "Today we press a switch. Science changed how we live."],
                 ["Children think it has always been like now.", "Your great-grandparents may have grown up with no electric light."],
                 ["Tap each picture and compare then with now."]),
             {"items": [
                 {"pic": "\U0001F56F️", "label": "light", "say": "Long ago: a candle or an oil lamp, and a dark house at night. Now: press a switch and the room lights up."},
                 {"pic": "\U0001F9CA", "label": "keeping food cold", "say": "Long ago: a block of ice, or a cold cellar under the house. Now: a fridge."},
                 {"pic": "\U0001FAA3", "label": "washing clothes", "say": "Long ago: scrubbing every shirt by hand in a tub. Now: a washing machine."},
                 {"pic": "\U0001F4FB", "label": "hearing the news", "say": "Long ago: somebody read it out loud from a paper. Then came the radio, then the television, and now phones and computers."},
             ], "need": 4,
              "then": {"ask": "Long ago, how did people see at night with no electricity?",
                       "opts": [opt("They lit candles and oil lamps", True), opt("They used an electric torch", False), opt("They switched on a lamp", False)],
                       "why": "Candles and oil lamps gave light before electric light. Science changed that."}},
             "What people knew has changed, and life changed with it."),

        step("demo", "What is a magnet?", "\U0001F9F2", "Magnet!", ["1Pe.02"],
             "A magnet pulls some things towards it without touching them. Press <b>Next</b>.",
             explain(
                 ["A magnet is a special object that pulls iron and steel.", "It pulls some things towards it, and it does not even have to touch them."],
                 ["Hold a magnet near a paperclip.", "The paperclip jumps across and sticks.", "Hold it near a piece of paper.", "Nothing happens.",
                  "Two magnets can pull together, or push each other away."],
                 ["Children think a magnet sticks to everything made of metal.", "It sticks to iron and steel. It does not stick to kitchen foil."],
                 ["Press Next and watch what the magnet does."]),
             {"frames": [
                 {"pic": "\U0001F9F2", "cap": "This is a <b>magnet</b>.", "say": "This is a magnet. It looks like an ordinary piece of metal, but it is special."},
                 {"pic": "\U0001F9F2\U0001F4CE", "cap": "Bring it near a paperclip. The clip <b>jumps</b> to the magnet!", "say": "Bring it near a paperclip. The clip jumps across and sticks, before the magnet even touches it.", "sound": "click"},
                 {"pic": "\U0001F9F2\U0001F4C4", "cap": "Bring it near paper. <b>Nothing</b> happens.", "say": "Bring it near a piece of paper. Nothing happens. Paper is not magnetic."},
                 {"pic": "\U0001F9F2\U0001F9F2", "cap": "Two magnets can <b>pull</b> together...", "say": "Two magnets can pull together with a click.", "sound": "click"},
                 {"pic": "\U0001F9F2↔️\U0001F9F2", "cap": "...or <b>push</b> each other away. Turn one round and feel it!", "say": "Or, turn one round, and they push each other away. You can feel the push in your hands.", "sound": "pop"},
             ]},
             "A magnet pulls some things, pushes some magnets, and ignores the rest."),

        step("predictEach", "Will it stick?", "\U0001F9EA", "Magnet test", ["1Pe.02", "1TWSp.02", "1TWSc.04", "1TWSa.01"],
             "Will the magnet stick to the %s? Predict, then bring the magnet near and see.",
             explain(
                 ["The only way to know if a magnet sticks to something is to try it."],
                 ["Look at the thing.", "Predict: will it stick, or not?", "Then bring the magnet up and watch.",
                  "A paperclip sticks.", "A wooden block does not."],
                 ["Children predict that all metal sticks.", "The iron nail and the steel tin lid stick, but kitchen foil does not. Test, do not guess."],
                 ["Predict for each one, bring the magnet, and see if you were right."]),
             {"sim": "magnet", "tryLabel": "Bring the magnet near", "ask": "Will the magnet stick to the %s?",
              "choices": [{"id": "yes", "t": "Sticks", "pic": "\U0001F9F2"}, {"id": "no", "t": "Does not stick", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F4CE", "label": "steel paperclip", "answer": "yes", "why": "The steel paperclip jumped to the magnet."},
                  {"pic": "\U0001FAB5", "label": "wooden block", "answer": "no", "why": "Wood is not magnetic. Nothing happened."},
                  {"pic": "\U0001F96B", "label": "steel tin lid", "answer": "yes", "why": "The steel tin lid stuck to the magnet."},
                  {"pic": "\U0001F9F4", "label": "plastic cup", "answer": "no", "why": "Plastic is not magnetic."},
                  {"pic": "\U0001F373", "label": "iron frying pan", "answer": "yes", "why": "The iron frying pan stuck."},
                  {"pic": "\U0001F4C4", "label": "paper", "answer": "no", "why": "Paper is not magnetic."},
                  {"pic": "\U0001F9EF", "label": "kitchen foil", "answer": "no", "why": "Kitchen foil is metal, but the magnet did not stick. Not all metals are magnetic!"},
                  {"pic": "\U0001F529", "label": "iron nail", "answer": "yes", "why": "The iron nail stuck fast."},
              ]},
             "A magnet sticks to iron and steel, and to nothing else you tried."),

        step("record", "Record the magnet test", "\U0001F4DD", "Magnet table", ["1TWSc.05", "1Pe.02"],
             "Write the results in the table. Did the magnet stick to <b>%s</b>?",
             explain(
                 ["The table shows every result at once, so you can spot the pattern: which things stuck?"],
                 ["Paperclip: stuck.", "Wooden block: did not.", "Tin lid: stuck.", "Plastic cup: did not.", "Look at the sticks column: every one is steel or iron."],
                 [],
                 ["Fill in each row from what happened."]),
             {"ask": "Did the magnet stick to %s?",
              "columns": ["Thing", "Did it stick?"],
              "rows": [
                  {"pic": "\U0001F4CE", "label": "the paperclip", "answer": "yes", "why": "the paperclip jumped to the magnet."},
                  {"pic": "\U0001FAB5", "label": "the wooden block", "answer": "no", "why": "nothing happened to the wooden block."},
                  {"pic": "\U0001F96B", "label": "the steel tin lid", "answer": "yes", "why": "the tin lid stuck."},
                  {"pic": "\U0001F9F4", "label": "the plastic cup", "answer": "no", "why": "nothing happened to the plastic cup."},
                  {"pic": "\U0001F9EF", "label": "the kitchen foil", "answer": "no", "why": "the kitchen foil did not stick, even though it is metal."},
              ],
              "choices": [{"id": "yes", "t": "Yes, it stuck", "pic": "\U0001F9F2"}, {"id": "no", "t": "No", "pic": "\U0001F6AB"}]},
             "Your table shows the pattern: iron and steel stick."),

        step("context", "Using less electricity", "\U0001F30D", "Switch it off", ["1SIC.04", "1Pe.01"],
             "Making electricity uses up things from the Earth. Tap each picture to see how we can use less.",
             explain(
                 ["Electricity is made in big power stations, and making it often burns fuel dug out of the ground.", "Using less is kinder to the world."],
                 ["Switch off the light when you leave a room.", "Switch off the television when nobody is watching.",
                  "Open the curtains in the day instead of turning on a lamp.", "Some electricity comes from the sun and the wind, which never run out."],
                 [],
                 ["Tap each picture, then answer the question."]),
             {"items": [
                 {"pic": "\U0001F4A1", "label": "lights off", "say": "Leaving a room? Switch the light off. An empty room does not need light."},
                 {"pic": "\U0001F4FA", "label": "TV off", "say": "Nobody watching? Switch the television off, not just to standby."},
                 {"pic": "\U0001F324️", "label": "open the curtains", "say": "In the daytime, open the curtains and let the sun light the room for free."},
                 {"pic": "\U0001F32C️", "label": "sun and wind power", "say": "Solar panels make electricity from sunlight. Wind turbines make it from the wind. Sunshine and wind never run out, and they make no smoke."},
             ], "need": 4,
              "then": {"ask": "You leave your bedroom for the whole day. What should you do?",
                       "opts": [opt("Switch the light off", True), opt("Leave the light on so the room is not dark", False), opt("Turn on the television for the teddy", False)],
                       "why": "An empty room does not need light. Switching off saves electricity."}},
             "Science shows how what we do affects the world, and how to do better."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Pe.01", "1Pe.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["If it asks about electricity, ask: would it work with the power off?", "If it asks about magnets, remember: iron and steel stick."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which of these needs electricity to work?", "⚡", "a lamp", ["a book", "a chair", "a spoon"], "A lamp needs electricity to light up."),
                 q("Which of these works with no electricity?", "\U0001F6AB", "a bicycle", ["a television", "a fridge", "a kettle"], "Your legs push the pedals. No electricity needed."),
                 q("What is a battery?", "\U0001F50B", "a small box that gives electricity", ["a kind of magnet", "a type of wood", "a candle"], "A battery gives electricity to torches, toys and phones."),
                 q("What goes into a wall socket?", "\U0001F50C", "only a plug", ["a finger", "a toy", "a spoon"], "Only plugs. Anything else is dangerous."),
                 q("A magnet is held near a paperclip. What happens?", "\U0001F4CE", "the paperclip jumps to the magnet", ["nothing", "the paperclip melts", "the magnet breaks"], "Steel paperclips are magnetic. The clip jumps across."),
                 q("A magnet is held near a wooden block. What happens?", "\U0001FAB5", "nothing", ["the block sticks", "the block spins"], "Wood is not magnetic."),
                 q("Long ago, with no electricity, people lit their homes with...", "\U0001F56F️", "candles and oil lamps", ["electric torches", "phones", "televisions"], "Candles and oil lamps came before electric light."),
                 q("You leave a room for the day. To use less electricity you should...", "\U0001F4A1", "switch the light off", ["leave the light on", "turn on the radio too"], "An empty room needs no light."),
                 q("Your torch will not light up. What is the most likely reason?", "\U0001F526", "Its batteries have run out", ["It is made of plastic", "It is too dark outside"], "A torch needs electricity, and its batteries give it. When they run out, the torch cannot light up."),
             ]},
             "That is the whole lesson finished. You know electricity and magnets."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say which things need electricity to work.",
    "Say where electricity comes from and how to stay safe with it.",
    "Say what a magnet does.",
    "Predict and test which things a magnet sticks to.",
]

LESSON["warmup"] = [
    q("What makes a lamp light up?", "\U0001F4A1", "electricity", ["water", "sand"], "A lamp needs electricity to light up."),
    q("What can a magnet pick up?", "\U0001F9F2", "a paperclip", ["a piece of paper", "a leaf"], "A magnet pulls a paperclip, because the paperclip is made of steel."),
]

LESSON["lecture"] = [
    part("\U0001F4A1", "What needs electricity",
         "A lamp, a television, a fridge and a phone all need electricity. A book, a chair and a bicycle do not. If it would stop when the power went off, it needs electricity."),
    part("\U0001F50C", "Where it comes from",
         "Electricity comes into your house through wires to the sockets in the wall. A battery gives electricity to torches and toys."),
    part("\u26A0\uFE0F", "Three safety rules",
         "Only plugs go into sockets. Never fingers or toys. Keep electric things away from water. And if a wire is broken, do not touch it. Tell a grown-up."),
    part("\U0001F9F2", "What a magnet does",
         "A magnet pulls some things towards it. Bring it near a paperclip and the clip jumps across. Bring it near paper and nothing happens."),
    part("\U0001F529", "Iron and steel",
         "A magnet sticks to iron and steel. It does not stick to wood, plastic, paper or foil. Today you predict, then test, and see the pattern for yourself."),
]

LESSON["words"] = [
    word("electricity", "\u26A1", "The power that makes lamps, televisions and fridges work.",
         ["The lamp needs electricity.", "Electricity comes through the wires."]),
    word("battery", "\U0001F50B", "A small box that gives electricity to torches and toys.",
         ["The torch needs a new battery.", "Batteries make the toy car go."]),
    word("plug", "\U0001F50C", "The part on the end of a wire that goes into a socket.",
         ["Only a plug goes into a socket.", "Pull it out by the plug, not the wire."]),
    word("socket", "\U0001F3E0", "The holes in the wall that electricity comes out of.",
         ["Never poke anything into a socket.", "The socket is behind the sofa."]),
    word("magnet", "\U0001F9F2", "A special object that pulls iron and steel towards it.",
         ["A fridge magnet holds up my drawing.", "The magnet picked up the paperclips."]),
    word("magnetic", "\U0001F4CE", "Sticks to a magnet.",
         ["A paperclip is magnetic.", "Wood is not magnetic."]),
    word("steel", "\U0001F529", "A strong metal that magnets stick to.",
         ["A tin lid is made of steel.", "Steel paperclips are magnetic."]),
]

LESSON["home"] = [
    home("Magnet hunt", "A fridge magnet and a tray of small things: a paperclip, a wooden spoon, a plastic cup, a key, kitchen foil, a coin, a nail",
         ["Before each one, say: will it stick?",
          "Hold the magnet close to it.",
          "Some spoons, keys and coins stick and some do not. Test them!",
          "Sort them into sticks and does not stick."],
         "The pattern: iron and steel stick, and nothing else. Keep the magnet away from phones and bank cards."),
    home("Electricity hunt", "Paper and a pencil",
         ["Walk round one room and find everything that needs electricity.",
          "Find three things that use a battery instead of a socket.",
          "Find five things that need no electricity at all."],
         "Anything with a plug, a switch or a battery."),
    home("Safety check with a grown-up", "A grown-up, and a look at the plugs and sockets in one room",
         ["Look at each socket. Is anything poked in it that is not a plug? Look only; do not touch.",
          "Look at each wire. Is any wire broken or frayed? Look only; do not touch.",
          "Look for electric things near water."],
         "Say the three rules out loud: only plugs, away from water, tell a grown-up."),
]
