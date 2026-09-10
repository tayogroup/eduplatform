# -*- coding: utf-8 -*-
"""Lesson 5 - Changing Materials.

0097 Stage 2: 2Cc.01 some changes turn a material into a different material;
2Cp.03 testing; with 2TWSp.02, 2TWSa.01, 2TWSc.01, 2TWSc.04, 2TWSc.06 and
2SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "changing-materials",
    "title": "Changing Materials",
    "blurb": "Cook an egg and try to un-cook it, sort changes that make a new material from ones that do not, and learn the safety rules for anything hot.",
    "steps": [
        step("demo", "Same material, or a new one?", "\U0001F373", "New or same", ["2Cc.01"],
             "Some changes make a <b>new material</b>. Some do not. Press <b>Next</b>.",
             explain(
                 ["When ice melts it is still water. Freeze it and you get ice back. The material did not change.",
                  "When an egg cooks, the runny egg becomes solid white. You cannot get the runny egg back. A new material has been made."],
                 ["Ice to water to ice: the same material.", "Raw egg to cooked egg: a new material.", "Wood to ash in a fire: a new material.", "Dough to bread in the oven: a new material."],
                 ["Children think every change makes something new.", "Ask: can you get the first material back? If yes, it is the same material."],
                 ["Press Next and ask each time: can you get it back?"]),
             {"frames": [
                 {"pic": "\U0001F9CA➡️\U0001F4A7", "cap": "Ice melts into water. Freeze it: ice again. <b>Same material.</b>", "say": "Ice melts into water. Put the water in the freezer and it is ice again. Same material, water, all along."},
                 {"pic": "\U0001F95A➡️\U0001F373", "cap": "A raw egg cooks. Can you un-cook it? No. <b>A new material.</b>", "say": "A raw egg cooks and goes white and solid. Can you un-cook it by cooling it down? No. Cooking made a new material."},
                 {"pic": "\U0001FAB5➡️\U0001F525", "cap": "Wood burns into ash and smoke. <b>A new material.</b>", "say": "Wood burns. What is left is ash and smoke. You cannot turn ash back into wood. A new material."},
                 {"pic": "\U0001F35E", "cap": "Dough bakes into bread. <b>A new material.</b>", "say": "Soft dough goes into the oven and bread comes out. A new material; there is no going back to dough."},
                 {"pic": "\U0001F36B➡️\U0001F36B", "cap": "Chocolate melts and sets again. <b>Same material.</b>", "say": "Chocolate melts in the sun and sets hard again in the fridge. Same chocolate. Same material."},
             ]},
             "If you can get the first material back, it is the same material. If you cannot, a new one was made."),

        step("experiment", "Cook an egg, then try to un-cook it", "\U0001F9EA", "Egg test", ["2Cc.01", "2TWSp.02", "2TWSc.04", "2TWSa.01"],
             "Heat the egg until it is cooked, then cool it down. Predict first: will cooling turn it back into a raw egg?",
             explain(
                 ["This experiment asks one question: once the egg is cooked, can you get the raw egg back?"],
                 ["Predict.", "Then press Heat three times and watch the clear runny part turn white and solid.", "Then press Cool it down and look."],
                 ["Children expect cooling to undo heating, because melting and freezing work that way.", "Cooking is different. Cooking makes a new material."],
                 ["Tap your prediction, then heat, then cool, then say what happened."]),
             {"sim": "newMaterial",
              "predict": {"ask": "After the egg is cooked, what will happen when you <b>cool it down</b>?",
                          "opts": [opt("It will stay cooked", True), opt("It will turn back into a raw runny egg", False), opt("It will turn into an ice cube", False)]},
              "runAsk": "Press Heat it three times. Then press Cool it down.",
              "happened": {"ask": "What happened when the cooked egg cooled down?",
                           "opts": [opt("It stayed cooked. It did not go back to raw", True), opt("It went runny and raw again", False), opt("It disappeared", False)],
                           "why": "Cooling did not undo the cooking. Cooking made a new material, and there is no going back."}},
             "Cooking makes a new material. Cooling cannot undo it."),

        step("sort", "New material, or the same one back?", "\U0001F5C2️", "Change sorter", ["2Cc.01", "2TWSc.01"],
             "Does this change make a <b>new material</b>, or can you get the same material back? Tap the bin.",
             explain(
                 ["Two kinds of change.", "Melting and freezing, and bending and squashing, keep the material.", "Cooking and burning make a new material."],
                 ["Ice melting: same.", "Bread toasting brown: new.", "Clay squashed: same, still clay.", "A candle burning: new."],
                 ["Children put melting chocolate in New because it looks so different.", "Let it set and it is chocolate again. Same."],
                 ["Ask: could you get the first material back?"]),
             {"ask": "A new material, or the same one back?",
              "bins": [{"id": "new", "label": "New material", "pic": "\U0001F525"}, {"id": "same", "label": "Same material back", "pic": "\U0001F504"}],
              "items": [
                  {"pic": "\U0001F9CA", "label": "ice melting", "bin": "same", "why": "Melted ice is water; freeze it and it is ice again."},
                  {"pic": "\U0001F35E", "label": "bread toasting brown", "bin": "new", "why": "Toast cannot go back to being bread. A new material."},
                  {"pic": "\U0001F7E4", "label": "clay squashed flat", "bin": "same", "why": "Squashed clay is still clay. Roll it back into a ball."},
                  {"pic": "\U0001F56F️", "label": "a candle burning", "bin": "new", "why": "The burning wax becomes gas and smoke. It cannot come back."},
                  {"pic": "\U0001F36B", "label": "chocolate melting", "bin": "same", "why": "Melted chocolate sets again. Same chocolate."},
                  {"pic": "\U0001F95A", "label": "an egg frying", "bin": "new", "why": "A fried egg cannot become raw again. You saw it."},
                  {"pic": "\U0001F4C4", "label": "paper folded", "bin": "same", "why": "Folded paper is still paper. Unfold it."},
                  {"pic": "\U0001F525", "label": "wood burning", "bin": "new", "why": "Ash and smoke cannot be turned back into wood."},
                  {"pic": "\U0001F4A7", "label": "water freezing", "bin": "same", "why": "Ice melts back into water. Same material."},
                  {"pic": "\U0001F370", "label": "cake mix baking", "bin": "new", "why": "A baked cake cannot go back to being runny mix."},
              ]},
             "Melting, freezing and squashing keep the material. Cooking and burning make a new one."),

        step("record", "Record what heating did", "\U0001F4DD", "Recorded it", ["2TWSc.06", "2Cc.01"],
             "Record what happened to each thing when it was heated. What happened to <b>%s</b>?",
             explain(
                 ["A table holds what happened to each material, side by side."],
                 ["The egg: cooked into a new material.", "The ice: melted, same material.", "The chocolate: melted, same.", "The dough: baked into a new material."],
                 [],
                 ["Fill in each row."]),
             {"ask": "When %s was heated, what happened?",
              "columns": ["Heated", "What happened"],
              "rows": [
                  {"pic": "\U0001F95A", "label": "the egg", "answer": "new", "why": "the egg cooked into a new material."},
                  {"pic": "\U0001F9CA", "label": "the ice", "answer": "melt", "why": "the ice melted, and it was still water."},
                  {"pic": "\U0001F36B", "label": "the chocolate", "answer": "melt", "why": "the chocolate melted, and it was still chocolate."},
                  {"pic": "\U0001F35E", "label": "the dough", "answer": "new", "why": "the dough baked into bread, a new material."},
              ],
              "choices": [{"id": "melt", "t": "Melted, same material", "pic": "\U0001F4A7"}, {"id": "new", "t": "Became a new material", "pic": "\U0001F525"}]},
             "Your table shows which changes made something new."),

        step("explore", "Safe with heat", "\U0001F9E4", "Safe hands", ["2TWSc.04", "2TWSc.02"],
             "Heating changes materials, and heat can hurt. Tap each rule.",
             explain(
                 ["Experiments with heat are done with a grown-up, and there are rules that keep everyone safe."],
                 ["A grown-up does the cooker.", "Oven gloves for anything hot.", "Never touch a pan to see if it is hot.", "Long hair tied back.", "Wait for things to cool before you pick them up."],
                 ["Children think a pan that has stopped steaming is cool.", "Metal stays hot long after it stops steaming."],
                 ["Tap every rule and listen."]),
             {"items": [
                 {"pic": "\U0001F9D1‍\U0001F373", "label": "a grown-up does the heat", "say": "A grown-up works the cooker, the kettle and the oven. You watch and record."},
                 {"pic": "\U0001F9E4", "label": "oven gloves", "say": "Oven gloves for anything that has been heated, even if it looks cool."},
                 {"pic": "✋", "label": "never touch to test", "say": "Never touch a pan or a tray to find out if it is hot. Ask, or wait."},
                 {"pic": "\U0001F487", "label": "hair tied back", "say": "Long hair tied back and sleeves rolled up, away from the heat."},
                 {"pic": "⏳", "label": "wait for it to cool", "say": "Metal stays hot long after it stops steaming. Wait before picking anything up."},
             ], "need": 5,
              "then": {"ask": "The pan has stopped steaming. Is it safe to pick up with bare hands?",
                       "opts": [opt("No. Metal stays hot long after it stops steaming", True), opt("Yes, no steam means it is cool", False), opt("Yes, if you are quick", False)],
                       "why": "No steam does not mean no heat. Use oven gloves or wait."}},
             "Heat changes materials, and heat rules keep hands safe."),

        step("context", "Long ago, and now", "\U0001F56F️", "Long ago", ["2SIC.01"],
             "What people knew about materials has changed. Tap each picture.",
             explain(
                 ["People have always changed materials, by cooking and by fire, long before they knew why."],
                 ["Long ago people found that heating clay made it hard, and made pots.", "Long ago people thought some materials could be turned into gold by heating them. Now we know they cannot.",
                  "Now scientists know exactly what happens inside a material when it is heated."],
                 [],
                 ["Tap each picture and compare then with now."]),
             {"items": [
                 {"pic": "\U0001F3FA", "label": "the first pots", "say": "Thousands of years ago, people found that soft clay baked in a fire became hard and held water. They did not know why. Now we know heating makes it a new material."},
                 {"pic": "\U0001F9EA", "label": "turning things to gold", "say": "Long ago some people spent their lives heating and mixing materials to make gold. They never could, because gold cannot be made from other materials. But their experiments were the beginning of chemistry."},
                 {"pic": "\U0001F52C", "label": "now", "say": "Now scientists can say exactly which changes make a new material and which do not, and they use that to make medicines, plastics and glass."},
                 {"pic": "\U0001F35E", "label": "bread then and now", "say": "People baked bread thousands of years ago and still do. The science is the same; now we understand it."},
             ], "need": 4,
              "then": {"ask": "Long ago, people tried to turn ordinary materials into gold by heating them. What do we know now?",
                       "opts": [opt("Gold cannot be made from other materials, but the experiments started chemistry", True), opt("It worked, and that is where gold comes from", False), opt("Nobody ever tried", False)],
                       "why": "What people knew changed. The trying was not wasted: it was the start of chemistry."}},
             "What people knew has changed, and it changed by testing."),

        step("questions", "Same or new?", "✅", "Same or new", ["2Cc.01"],
             "Does the change make a new material? Tap the answer.",
             explain(
                 ["One question answers every one of these: can you get the first material back?"],
                 ["Melting, freezing, bending, squashing: yes, same material.", "Cooking, baking, burning: no, new material."],
                 [],
                 ["Read the change, ask the question, then tap."]),
             {"label": "Question", "items": [
                 q("Butter melts in a hot pan. Can you get solid butter back?", "\U0001F9C8", "Yes, let it cool. Same material.", ["No, it is a new material", "No, it turns to water"], "Melted butter sets again when it cools."),
                 q("A marshmallow is toasted brown over a fire. Same material?", "\U0001F525", "No. Toasting made a new material.", ["Yes, it is the same", "Yes, it just melted"], "The brown toasted part cannot go back to being white marshmallow."),
                 q("A snowman melts in the sun. What is the water?", "⛄", "the same material as the snow", ["a new material", "gone for ever"], "Snow is frozen water. Melted snow is water. Same material."),
                 q("A match is struck and burns. Same material after?", "\U0001F525", "No. Burning made ash and smoke, new materials.", ["Yes, it is still a match", "Yes, it just got warm"], "Burning always makes new materials."),
             ]},
             "Melt, freeze, squash: same. Cook, bake, burn: new."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Cc.01", "2TWSc.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Ask: can you get the first material back?"],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("You cook an egg. Can you cool it back into a raw egg?", "\U0001F373", "No. Cooking made a new material.", ["Yes, put it in the fridge", "Yes, if you are quick"], "You tried it. Cooling does not undo cooking."),
                 q("Ice melts. Is the water a new material?", "\U0001F9CA", "No. It is the same water, and can freeze again.", ["Yes, water is new", "Yes, it can never be ice"], "Melting and freezing keep the material."),
                 q("Which change makes a NEW material?", "\U0001F525", "burning wood", ["melting chocolate", "folding paper", "squashing clay"], "Burning turns wood into ash and smoke, which cannot become wood again."),
                 q("Which change keeps the SAME material?", "\U0001F504", "melting butter", ["baking a cake", "frying an egg", "burning a candle"], "Melted butter sets again."),
                 q("Dough goes in the oven. What comes out?", "\U0001F35E", "bread, a new material", ["dough, the same", "water"], "Baking makes a new material."),
                 q("Who works the cooker in a heating experiment?", "\U0001F9D1‍\U0001F373", "a grown-up", ["the fastest child", "nobody"], "Heat is a grown-up's job; you watch and record."),
                 q("The pan has stopped steaming. What do you do?", "\U0001F9E4", "wait, or use oven gloves", ["pick it up with bare hands", "touch it to check"], "Metal stays hot long after the steam stops."),
                 q("Long ago people tried to make gold by heating other materials. What happened?", "\U0001F9EA", "It never worked, but it started chemistry", ["They made lots of gold", "They gave up straight away"], "What people knew changed by testing."),
             ]},
             "That is the whole lesson finished. You know which changes make something new."),
    ],
}


# ---- the unit shell (drawn by lesson-kit/_shell.py): what this lesson is about,
#      the lecture, its science words, and things to do at home ----------------
LESSON["about"] = [
    "Say whether a change makes a new material or keeps the same one.",
    "Cook an egg and try to un-cook it.",
    "Record what heating did to four materials.",
    "Say the safety rules for anything hot.",
]

LESSON["lecture"] = [
    part("\U0001F9CA", "Same material back",
         "Ice melts into water. Put the water in the freezer and it is ice again. Melting and freezing keep the same material. You can get it back."),
    part("\U0001F373", "A new material",
         "A raw egg is runny and clear. Cook it and it goes white and solid. Cool it down and it stays cooked. Cooking made a new material. You cannot get the egg back."),
    part("\U0001F525", "Burning",
         "Wood burns. What is left is ash and smoke. You cannot turn ash back into wood. Burning always makes a new material."),
    part("\U0001F35E", "Baking",
         "Soft dough goes into the oven. Bread comes out. A new material: the dough is gone for good. Cake mix does the same."),
    part("\U0001F9E4", "Safe with heat",
         "A grown-up does the heating. Use oven gloves. Never touch to test if it is hot. Tie back hair. Wait for things to cool. Heat changes materials, and heat rules keep hands safe."),
]

LESSON["words"] = [
    word("melt", "\U0001F9CA", "To change from solid to liquid when heated.",
         ["Ice melts in the sun.", "Chocolate melts in your hand."]),
    word("freeze", "\u2744\uFE0F", "To change from liquid to solid when cooled.",
         ["Water freezes into ice.", "Juice freezes into an ice lolly."]),
    word("heat", "\U0001F525", "To make something hotter.",
         ["We heat the pan.", "Heat cooks the egg."]),
    word("cool", "\U0001F32C\uFE0F", "To make something colder.",
         ["Let the pan cool before you touch it.", "Cool the egg and it stays cooked."]),
    word("cook", "\U0001F373", "To heat food until it changes into something new.",
         ["We cook the egg.", "Cooking makes a new material."]),
    word("burn", "\U0001F56F\uFE0F", "To be on fire and turn into ash and smoke.",
         ["The candle burns.", "Wood burns to ash."]),
    word("reversible", "\u21A9\uFE0F", "A change you can undo, getting the same material back.",
         ["Melting ice is reversible.", "Freezing water is reversible too."]),
]

LESSON["home"] = [
    home("Melt it, freeze it", "An ice cube, a plate, an ice tray, a freezer",
         ["Put an ice cube on a plate in a warm room and watch it melt.",
          "Pour the water into the ice tray and put it in the freezer.",
          "Look the next morning."],
         "The same water came back as ice. Reversible."),
    home("Cook an egg with a grown-up", "An egg, a pan, a hob, a grown-up",
         ["Crack the egg into a bowl. Look: runny and clear.",
          "A grown-up cooks it in the pan. Watch it change.",
          "Let it cool. Is it runny again?"],
         "It stays cooked. A new material. You cannot get the egg back."),
    home("Toast test", "A slice of bread, a toaster, a grown-up",
         ["Look at the bread. Soft and pale.",
          "A grown-up toasts it.",
          "Let it cool and look again."],
         "Brown and crisp, and cooling does not make it bread again."),
]
