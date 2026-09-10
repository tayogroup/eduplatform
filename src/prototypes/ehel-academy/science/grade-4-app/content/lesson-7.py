# -*- coding: utf-8 -*-
"""Lesson 7 - Changes and Reactions.

0097 Stage 4: 4Cc.01 freezing and melting in the particle model; 4Cc.02 a
change of state is a physical process; 4Cc.03 some substances react to make
new substances, a chemical reaction; 4TWSp.05 risks and staying safe;
4TWSc.06 practical work carried out safely; with 4TWSp.03, 4TWSa.01,
4TWSa.03, 4TWSc.01 and 4TWSc.08.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "changes-and-reactions",
    "title": "Changes and Reactions",
    "blurb": "See melting and freezing as particles changing their arrangement, mix sand into water and vinegar into bicarbonate to tell a mixture from a reaction, record which changes make something new, and plan to stay safe.",
    "steps": [
        step("demo", "Melting and freezing, particle by particle", "\U0001F9CA", "State change", ["4Cc.01", "4Cc.02"],
             "Press <b>Next</b> to watch water change state, and see what its particles do.",
             explain(
                 ["Melting and freezing are changes of state. The particles change how they are arranged, not what they are.", "That makes a change of state a physical process: nothing new is made, and it can be undone."],
                 ["Ice: particles in rows, vibrating.", "Heat: they break free and slide. Melted.", "Cool: they lock back into rows. Frozen.", "Same water particles the whole time."],
                 ["Children think melted ice is a new substance.", "It is the same substance, water, in a different state."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F9CA", "cap": "Ice: a solid. Its particles sit in rows, vibrating on the spot.", "say": "Ice is solid water. Its particles sit in rows, vibrating on the spot."},
                 {"pic": "\U0001F525", "cap": "Heat it: the particles gain energy, break out of their rows and slide. <b>Melting</b>.", "say": "Warm it up. The particles gain energy, vibrate harder, and break out of their rows to slide past each other. The ice has melted into liquid water."},
                 {"pic": "❄️", "cap": "Cool it: the particles lose energy and lock back into rows. <b>Freezing</b>.", "say": "Cool it down. The particles lose energy, slow, and lock back into rows. The water has frozen into ice again."},
                 {"pic": "\U0001F504", "cap": "Same particles all the way through. A change of state is a <b>physical process</b>: nothing new is made, and it can be undone.", "say": "The same water particles the whole time. Nothing new was made, and you can go back and forth as often as you like. That is what makes a change of state a physical process."},
             ]},
             "Melting and freezing rearrange the particles. Nothing new is made."),

        step("experiment", "Mixture, or reaction?", "\U0001F9EA", "Reaction test", ["4Cc.03", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "Two beakers. Sand into water, and vinegar into bicarbonate of soda. Predict which one makes something new.",
             explain(
                 ["Mixing keeps the substances: you can get them back.", "A chemical reaction makes NEW substances, which were not there before, and you cannot get the old ones back."],
                 ["Sand in water: sand and water, still. A mixture.", "Vinegar on bicarbonate: it fizzes. The bubbles are a gas that did not exist a moment ago. A reaction."],
                 ["Children think fizzing is just air escaping.", "The gas is being MADE, by the two substances reacting."],
                 ["Predict, try both, say what happened, then conclude."]),
             {"sim": "reaction",
              "predict": {"ask": "Which one will make a <b>new</b> substance?",
                          "opts": [opt("Vinegar added to bicarbonate of soda", True), opt("Sand added to water", False), opt("Both", False)]},
              "runAsk": "Press both buttons and watch each beaker closely.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The sand just sank in the water; the vinegar and bicarbonate fizzed and made a gas", True), opt("Both beakers fizzed", False), opt("Nothing happened in either", False)],
                           "why": "The sand and water stayed sand and water. The vinegar and bicarbonate reacted and made a gas that was not there before."},
              "conclude": {"ask": "How do you know a chemical reaction happened in the second beaker?",
                           "opts": [opt("A new substance appeared, the gas, that was not there before", True), opt("It got wet", False), opt("It did not; it was just mixing", False)],
                           "why": "New substances are the mark of a chemical reaction. The fizz was a gas being made."}},
             "A mixture keeps its substances. A reaction makes new ones."),

        step("sort", "Physical change, or chemical reaction?", "\U0001F5C2️", "Change sorter", ["4Cc.02", "4Cc.03", "4TWSc.01"],
             "Does this change keep the same substance, or make a <b>new</b> one? Tap the bin.",
             explain(
                 ["Physical: the same substance, just changed in state, shape or mixed. Can be undone.", "Chemical reaction: new substances. Cannot be undone."],
                 ["Ice melting: physical.", "Wood burning to ash and smoke: chemical.", "Chocolate melting: physical.", "A cake baking: chemical. You cannot un-bake it.", "Iron going rusty: chemical. Rust is a new substance."],
                 ["Children think anything with heat is a reaction.", "Melting chocolate uses heat and is physical. Ask: is anything NEW made?"],
                 ["Is a new substance made? Then tap."]),
             {"ask": "Physical change, or chemical reaction?",
              "bins": [{"id": "physical", "label": "Physical change", "pic": "\U0001F9CA"}, {"id": "chemical", "label": "Chemical reaction", "pic": "\U0001F525"}],
              "items": [
                  {"pic": "\U0001F9CA", "label": "ice melting", "bin": "physical", "why": "Same water, different state. Freeze it and it is back."},
                  {"pic": "\U0001F525", "label": "wood burning", "bin": "chemical", "why": "Ash and smoke are new substances. No way back to wood."},
                  {"pic": "\U0001F36B", "label": "chocolate melting", "bin": "physical", "why": "Still chocolate. Cool it and it sets."},
                  {"pic": "\U0001F382", "label": "a cake baking", "bin": "chemical", "why": "The runny mix becomes a spongy new substance. You cannot un-bake it."},
                  {"pic": "\U0001F529", "label": "iron going rusty", "bin": "chemical", "why": "Rust is a new substance made from iron and air."},
                  {"pic": "\U0001F9C2", "label": "salt dissolving in water", "bin": "physical", "why": "The salt is still there. Dry the water off and it is back."},
                  {"pic": "\U0001F373", "label": "an egg frying", "bin": "chemical", "why": "Clear runny egg becomes white solid egg. New substances."},
                  {"pic": "\U0001F4A7", "label": "water boiling into steam", "bin": "physical", "why": "Steam is water as a gas. Cool it and it is water again."},
                  {"pic": "\U0001F9EA", "label": "vinegar fizzing on bicarbonate", "bin": "chemical", "why": "A gas is made that was not there before."},
                  {"pic": "\U0001F4DD", "label": "paper being torn", "bin": "physical", "why": "Smaller pieces, but still paper."},
              ]},
             "Physical: the same substance. Chemical: something new."),

        step("record", "Record the changes", "\U0001F4CB", "Change table", ["4TWSc.08", "4Cc.02", "4Cc.03"],
             "Fill in the table. Can the <b>%s</b> be undone?",
             explain(
                 ["A table keeps what you found.", "Physical changes can be undone. Chemical reactions cannot."],
                 ["Ice melting: yes, freeze it.", "Wood burning: no.", "Salt dissolving: yes, dry the water off.", "Egg frying: no."],
                 [],
                 ["Tap yes or no for each row."]),
             {"ask": "Can the %s be undone?",
              "columns": ["Change", "Can it be undone?"],
              "rows": [
                  {"pic": "\U0001F9CA", "label": "ice melting", "answer": "yes", "why": "freeze the water and the ice is back. Physical."},
                  {"pic": "\U0001F525", "label": "wood burning", "answer": "no", "why": "ash and smoke never turn back into wood. Chemical."},
                  {"pic": "\U0001F9C2", "label": "salt dissolving", "answer": "yes", "why": "let the water dry and the salt is left behind. Physical."},
                  {"pic": "\U0001F373", "label": "egg frying", "answer": "no", "why": "a cooked egg stays cooked. Chemical."},
              ],
              "choices": [{"id": "yes", "t": "yes, it can be undone", "pic": "\U0001F504"}, {"id": "no", "t": "no, new substances were made", "pic": "\U0001F6D1"}]},
             "Undo it: physical. Cannot: chemical."),

        step("sort", "Plan to stay safe", "⚠️", "Risk planner", ["4TWSp.05", "4TWSc.06"],
             "Before practical work, a scientist spots each risk and plans what to do. Match each risk to the right plan.",
             explain(
                 ["Spotting a risk is half the job. The other half is the plan that removes it."],
                 ["Vinegar could splash in eyes: goggles.", "Hot things could burn: a grown-up handles the heat.", "Glass could break: carry it low with two hands, and no running.", "Unknown powder: never taste it."],
                 ["Children think being careful is the whole plan.", "A plan is a specific action: goggles, gloves, distance, a grown-up."],
                 ["Read the risk, tap the plan."]),
             {"ask": "Which plan removes this risk?",
              "bins": [{"id": "goggles", "label": "Wear goggles", "pic": "\U0001F97D"}, {"id": "adult", "label": "A grown-up does it", "pic": "\U0001F9D1\U0001F3FE‍\U0001F373"}, {"id": "carry", "label": "Carry low, walk", "pic": "\U0001F6B6\U0001F3FE"}, {"id": "notaste", "label": "Never taste or sniff close", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F9EA", "label": "vinegar could splash into eyes", "bin": "goggles", "why": "Goggles keep splashes out."},
                  {"pic": "\U0001F525", "label": "the pan is hot enough to burn", "bin": "adult", "why": "Heat is for the grown-up."},
                  {"pic": "\U0001F9F4", "label": "a glass beaker could drop and smash", "bin": "carry", "why": "Two hands, held low, walking."},
                  {"pic": "\U0001F9C2", "label": "a white powder you do not know", "bin": "notaste", "why": "It might not be sugar."},
                  {"pic": "\U0001F4A8", "label": "a strong smell from the reaction", "bin": "notaste", "why": "Waft it towards you; never sniff at the beaker."},
                  {"pic": "\U0001F373", "label": "frying the egg", "bin": "adult", "why": "Hot oil spits."},
                  {"pic": "\U0001F4A5", "label": "the fizz could spray upwards", "bin": "goggles", "why": "Eyes first, always."},
                  {"pic": "\U0001F3C3\U0001F3FE", "label": "carrying a tray of jars across the room", "bin": "carry", "why": "Walk, low, both hands."},
              ]},
             "Spot the risk, then a plan that removes it."),

        step("questions", "Change check", "✅", "Change check", ["4Cc.01", "4Cc.02", "4Cc.03"],
             "Tap the answer.",
             explain(
                 ["Changes of state, physical changes, and chemical reactions."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What happens to the particles when ice melts?", "\U0001F9CA", "they break out of their rows and slide", ["they vanish", "they turn into air"], "Rearranged, not replaced."),
                 q("Is melting a physical process or a chemical reaction?", "\U0001F504", "a physical process: the same substance, and it can be undone", ["a chemical reaction", "neither"], "Nothing new is made."),
                 q("What is the sign of a chemical reaction?", "\U0001F525", "a new substance is made", ["it gets wet", "it gets smaller"], "Something that was not there before."),
                 q("Vinegar on bicarbonate fizzes. What is the fizz?", "\U0001F9EA", "a gas being made by the reaction", ["air escaping", "the vinegar boiling"], "A new substance."),
                 q("Which of these CANNOT be undone?", "\U0001F382", "baking a cake", ["melting chocolate", "freezing water"], "New substances."),
             ]},
             "You know changes and reactions."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Cc.01", "4Cc.02", "4Cc.03", "4TWSp.05"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("When water freezes, its particles...", "❄️", "lose energy and lock into rows", ["gain energy and fly apart", "disappear"], "Rows again."),
                 q("Melted ice is...", "\U0001F4A7", "the same substance, water, as a liquid", ["a new substance", "not water any more"], "Physical change."),
                 q("Sand stirred into water is...", "\U0001F3D6️", "a mixture; nothing new is made", ["a chemical reaction", "a new substance"], "You could filter it out."),
                 q("Rust on an iron gate is...", "\U0001F529", "a new substance made by a chemical reaction", ["iron that got wet", "paint"], "Iron and air reacted."),
                 q("Which is a physical change?", "\U0001F36B", "chocolate melting", ["a cake baking", "wood burning"], "Cool it and it sets."),
                 q("Can you get the vinegar back after it reacts with bicarbonate?", "\U0001F9EA", "no; new substances were made", ["yes, by cooling", "yes, by stirring"], "Reactions cannot be undone."),
                 q("Vinegar could splash in your eyes. The plan?", "\U0001F97D", "wear goggles", ["close your eyes", "hope"], "A specific action."),
                 q("Who handles the hot pan in the experiment?", "\U0001F9D1\U0001F3FE‍\U0001F373", "a grown-up", ["the fastest child", "nobody"], "Heat is for the grown-up."),
             ]},
             "That is the whole lesson finished. You know a change from a reaction."),
    ],
}

LESSON["about"] = [
    "Describe melting and freezing with the particle model.",
    "Say why a change of state is a physical process.",
    "Say how to tell a chemical reaction from a mixture.",
    "Spot the risks in practical work and plan to remove them.",
]

LESSON["lecture"] = [
    part("\U0001F9CA", "Melting",
         "Ice is solid water: particles in rows, vibrating. Warm it, and the particles gain energy, break out of their rows and slide. The ice has melted. Same particles, different arrangement."),
    part("❄️", "Freezing",
         "Cool the water and the particles lose energy, slow down and lock back into rows. It has frozen. You can melt and freeze the same water a thousand times. Nothing new is ever made. That is a physical process."),
    part("\U0001F3D6️", "Mixing",
         "Stir sand into water. Sand and water. Still both, and you could filter the sand back out. Mixing is physical too: the substances keep themselves."),
    part("\U0001F9EA", "A chemical reaction",
         "Now pour vinegar onto bicarbonate of soda. It fizzes. Bubbles of a gas pour out that did not exist a moment ago. New substances have been made, and you cannot get the old ones back. That is a chemical reaction."),
    part("⚠️", "Staying safe",
         "Fizz can spray. Beakers can smash. Pans burn. Before any practical work, a scientist lists the risks and makes a plan for each: goggles, two hands, a grown-up for the heat. Today you plan, then you test."),
]

LESSON["words"] = [
    word("change of state", "\U0001F504", "A change between solid, liquid and gas, like melting or freezing.",
         ["Melting is a change of state.", "A change of state can be undone."]),
    word("physical process", "\U0001F9CA", "A change where no new substance is made. It can usually be undone.",
         ["Melting is a physical process.", "Dissolving is a physical process."]),
    word("chemical reaction", "\U0001F9EA", "A change that makes one or more new substances. It cannot be undone.",
         ["Burning is a chemical reaction.", "The fizz showed a chemical reaction."]),
    word("substance", "\U0001F4A7", "One pure kind of stuff.",
         ["Water is a substance.", "A reaction makes a new substance."]),
    word("react", "\U0001F525", "To change into new substances when substances meet.",
         ["Vinegar reacts with bicarbonate of soda.", "Iron reacts with air to make rust."]),
    word("risk", "⚠️", "Something that could hurt someone.",
         ["A splash in the eye is a risk.", "Plan for every risk."]),
    word("goggles", "\U0001F97D", "Eye protection worn for practical work.",
         ["Goggles on before you pour.", "Goggles stop splashes."]),
]

LESSON["home"] = [
    home("Fizz in the kitchen", "A spoon of bicarbonate of soda, a splash of vinegar, a cup, goggles or sunglasses, a grown-up",
         ["Goggles on. Put the bicarbonate in the cup.",
          "Pour in the vinegar and watch.",
          "Try to get the vinegar back out."],
         "The fizz is a new gas. You cannot un-react it."),
    home("Melt and freeze again", "Chocolate or butter, a bowl, a warm windowsill, the fridge",
         ["Let the chocolate melt in the warmth.",
          "Put it in the fridge and let it set.",
          "Taste it. Is it still chocolate?"],
         "Still chocolate. A physical change, undone."),
    home("Risk plan for cooking", "A grown-up, one recipe",
         ["Before cooking, list every risk: heat, sharp, slippery, splashing.",
          "Write a plan for each one.",
          "Cook, following the plan."],
         "That is exactly what a scientist does before an experiment."),
]
