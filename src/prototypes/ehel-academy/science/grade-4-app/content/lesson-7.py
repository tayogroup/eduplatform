# -*- coding: utf-8 -*-
"""Lesson 7 - Changes and Reactions.

0097 Stage 4: 4Cc.01 freezing and melting in the particle model; 4Cc.02 a
change of state is a physical process; 4Cc.03 some substances react to make
new substances, a chemical reaction; 4TWSp.05 risks and staying safe;
4TWSc.06 practical work carried out safely (the reaction experiment); with 4TWSp.03, 4TWSa.01,
4TWSa.03, 4TWSc.01 and 4TWSc.08.
"""
from _kit import explain, step, opt, q, part, word, home, icon, cando

LESSON = {
    "slug": "changes-and-reactions",
    "title": "Changes and Reactions",
    "blurb": "See melting and freezing as particles changing their arrangement, mix sand into water and vinegar into bicarbonate to tell a mixture from a reaction, record which changes make something new, and plan to stay safe.",
    "steps": [
        step("demo", "Melting and freezing, particle by particle", "\U0001F9CA", "State change", ["4Cc.01", "4Cc.02"],
             "Press <b>Next</b> to watch water change state, and see what its particles do.",
             explain(
                 ["Melting and freezing are changes of state. The particles change how they are arranged, not what they are.", "That makes a change of state a physical process: nothing new is made, and you can change it back."],
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

        step("experiment", "Mixture, or reaction?", "\U0001F9EA", "Reaction test", ["4Cc.03", "4TWSp.03", "4TWSa.01", "4TWSa.03", "4TWSc.06"],
             "Two beakers. Sand into water, and vinegar into bicarbonate of soda. Goggles on first. Predict which one makes something new.",
             explain(
                 ["Mixing keeps the substances: you can get them back.", "A chemical reaction makes new substances, which were not there before, and you usually cannot get the old ones back.",
                  "Do it safely, the way a scientist does: goggles on before you pour, the beakers standing on a tray, pour slowly, and never taste anything."],
                 ["Sand in water: sand and water, still. A mixture.", "Vinegar on bicarbonate: it fizzes. The bubbles are a gas that did not exist a moment ago. A reaction."],
                 ["Children think fizzing is just air escaping.", "The gas is being made, by the two substances reacting."],
                 ["Goggles on. Predict, try both, say what happened, then conclude."]),
             {"sim": "reaction",
              "predict": {"ask": "Which one will make a <b>new</b> substance?",
                          "opts": [opt("Vinegar added to bicarbonate of soda", True), opt("Sand added to water", False), opt("Both", False)]},
              "plan": {"ask": "How shall we find out whether a new substance was made? Which way is fair?",
                        "opts": [opt("Try to get the first substances back again", True), opt("Look at the colour and decide", False), opt("Smell it and decide", False)],
                        "why": "That is the test that settles it. If you can separate them again, nothing new was made; if you cannot, a reaction happened."},
              "runAsk": "Goggles on, beakers on the tray. Press both buttons, pour slowly, and watch each beaker closely from the side, not from above.",
              "happened": {"ask": "What happened in the <b>two beakers</b>?",
                           "opts": [opt("The sand just sank in the water; the vinegar and bicarbonate fizzed and made a gas", True), opt("Both beakers fizzed", False), opt("Nothing happened in either", False)],
                           "why": "The sand and water stayed sand and water. The vinegar and bicarbonate reacted and made a gas that was not there before."},
              "conclude": {"ask": "How do you know a chemical reaction happened in the second beaker?",
                           "opts": [opt("A new substance appeared, the gas, that was not there before", True), opt("It got wet", False), opt("It did not; it was just mixing", False)],
                           "why": "New substances are the mark of a chemical reaction. The fizz was a gas being made."}},
             "A mixture keeps its substances. A reaction makes new ones. And you did it safely: goggles, a tray, and no tasting."),

        step("sort", "Physical change, or chemical reaction?", "\U0001F5C2️", "Change sorter", ["4Cc.02", "4Cc.03", "4TWSc.01"],
             "Does this change keep the same substance, or make a <b>new</b> one? Tap the bin.",
             explain(
                 ["The test is one question: is a new substance made?", "Physical: the same substance, just changed in state, in shape, or mixed. Often you can change it back.", "Chemical reaction: new substances are made. Usually you cannot get the old ones back."],
                 ["Ice melting: physical.", "Wood burning to ash and smoke: chemical.", "Chocolate melting: physical.", "A cake baking: chemical. You cannot un-bake it.", "Iron going rusty: chemical. Rust is a new substance.", "Paper torn up: physical. You cannot mend it perfectly, but it is still paper."],
                 ["Children think anything with heat is a reaction.", "Melting chocolate uses heat and is physical. Ask: is anything new made?"],
                 ["Is a new substance made? Then tap."]),
             {"ask": "Physical change, or chemical reaction?",
              "bins": [{"id": "physical", "label": "Physical change", "pic": "\U0001F504"}, {"id": "chemical", "label": "Chemical reaction", "pic": "\U0001F195"}],
              "items": [
                  {"pic": "\U0001F9CA", "label": "ice melting", "bin": "physical", "why": "Same water, different state. Freeze it and it is back."},
                  {"pic": "\U0001F525", "label": "wood burning", "bin": "chemical", "why": "Ash and smoke are new substances. No way back to wood."},
                  {"pic": "\U0001F36B", "label": "chocolate melting", "bin": "physical", "why": "Still chocolate. Cool it and it sets."},
                  {"pic": "\U0001F382", "label": "a cake baking", "bin": "chemical", "why": "The runny mix becomes a spongy new substance. You cannot un-bake it."},
                  {"pic": "\U0001F529", "label": "iron going rusty", "bin": "chemical", "why": "Rust is a new substance, made when iron reacts with water and air."},
                  {"pic": "\U0001F9C2", "label": "salt dissolving in water", "bin": "physical", "why": "The salt is still there. Dry the water off and it is back."},
                  {"pic": "\U0001F373", "label": "an egg frying", "bin": "chemical", "why": "Clear runny egg becomes white solid egg. New substances."},
                  {"pic": "\U0001F4A7", "label": "water boiling into steam", "bin": "physical", "why": "Steam is water as a gas. Cool it and it is water again."},
                  {"pic": "\U0001F9EA", "label": "vinegar fizzing on bicarbonate", "bin": "chemical", "why": "A gas is made that was not there before."},
                  {"pic": "\U0001F4DD", "label": "paper being torn", "bin": "physical", "why": "Smaller pieces, but still paper. You cannot mend it perfectly, but nothing new was made, so it is physical."},
              ]},
             "Physical: the same substance. Chemical: something new."),

        step("record", "Record the changes", "\U0001F4CB", "Change table", ["4TWSc.08", "4Cc.02", "4Cc.03"],
             "Fill in the table. Can the <b>%s</b> be undone?",
             explain(
                 ["A table keeps what you found.", "Ask: can you get the same substance back? After melting or dissolving, yes. After a chemical reaction, usually not, because new substances were made."],
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
              "choices": [{"id": "yes", "t": "yes, it can be undone", "pic": "\U0001F504"}, {"id": "no", "t": "no, new substances were made", "pic": "\U0001F6D1"}],
              "read": [
                  {"ask": "Read your table. How many of the changes could be undone?",
                   "opts": [opt("two", True), opt("all four", False), opt("none of them", False)],
                   "why": "Melting and dissolving can be undone. Burning and rusting cannot."},
                  {"ask": "Look at the two that could NOT be undone. What had happened to those?",
                   "opts": [opt("a new substance had been made", True), opt("they had been heated more", False), opt("they were the heaviest ones", False)],
                   "why": "That is the test for a chemical reaction: a new substance, and no way back."},
              ]},
             "The same substance back: physical. New substances made: chemical."),

        step("sort", "Plan to stay safe", "⚠️", "Risk planner", ["4TWSp.05"],
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
                  {"pic": icon("glass"), "label": "a glass beaker could drop and smash", "bin": "carry", "why": "Two hands, held low, walking."},
                  {"pic": "\U0001F9C2", "label": "a white powder you do not know", "bin": "notaste", "why": "It might not be sugar."},
                  {"pic": "\U0001F4A8", "label": "a strong smell from the reaction", "bin": "notaste", "why": "Waft it towards you; never sniff at the beaker."},
                  {"pic": "\U0001F373", "label": "frying the egg", "bin": "adult", "why": "Hot oil spits."},
                  {"pic": "\U0001F4A5", "label": "the fizz could spray upwards", "bin": "goggles", "why": "Eyes first, always."},
                  {"pic": "\U0001F96B", "label": "carrying a tray of jars across the room", "bin": "carry", "why": "Walk, low, both hands."},
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
                 q("Is melting a physical process or a chemical reaction?", "\U0001F504", "a physical process: nothing new is made", ["a chemical reaction: a new substance is made", "neither of them"], "The same substance, and you can freeze it back."),
                 q("What is the sign of a chemical reaction?", "\U0001F525", "a new substance is made", ["it gets wet", "it gets smaller"], "Something that was not there before."),
                 q("Vinegar on bicarbonate fizzes. What is the fizz?", "\U0001F9EA", "a gas being made by the reaction", ["air escaping", "the vinegar boiling"], "A new substance."),
                 q("Which of these cannot be undone?", "↩️", "baking a cake", ["melting chocolate", "freezing water"], "New substances were made."),
                 q("You melt a square of chocolate. Is it still chocolate?", "\U0001F36B", "Yes - melting changes the form, not the substance", ["No, heating always makes a new substance", "No, it is a different material now"],
                   "It still tastes of chocolate, and it sets back into chocolate as it cools."),
             ],
              "support": [
                 q("Can you freeze water and then melt it again?", "\U0001F9CA", "Yes", ["No"],
                   "Freezing and melting make nothing new, so they go both ways."),
                 q("Does toast turn back into bread as it cools?", "\u2697\uFE0F", "No", ["Yes"],
                   "Toasting made new substances. Letting it cool changes none of them back."),
                 q("Is melting ice a physical change?", "\U0001F9CA", "Yes", ["No"],
                   "The water is still water. Nothing new was made."),
                 q("Can you unburn a burnt piece of paper?", "\U0001F525", "No", ["Yes"],
                   "Burning makes new substances, and they do not go back."),
              ],
              "extension": [
                 q("Iron rusts in damp air and hardly at all in dry air. What does that tell you the reaction needs?", "\U0001F529", "water, as well as the iron and the air", ["only the air", "nothing - rust simply appears in time"],
                   "A reaction needs every one of its ingredients. Take one away and it does not happen."),
                 q("Vinegar and bicarbonate react straight away at room temperature, with no heating at all. What does that show?", "\U0001F9C2", "a chemical reaction does not have to be started by heat", ["they must have been warmed without you noticing", "every reaction needs heat, so this is not one"],
                   "Heat speeds many reactions up and is needed by some. Plenty of others, like this one, happen cold."),
                 q("A new substance appeared and a gas fizzed off. How many signs of a reaction is that?", "\u2697\uFE0F", "two, and either one on its own would be enough", ["none - fizzing is not a sign", "one, because they are the same sign"],
                   "A new substance is the sign. A gas appearing where there was none is one way of seeing it."),
                 q("Cooking joins flour, water and heat into bread. Which of the three is NOT a substance?", "\U0001F35E", "the heat - it is energy, not stuff", ["the flour", "the water"],
                   "A reaction needs its ingredients and often needs energy too. Energy is not one of the ingredients."),
              ]},
             "You know changes and reactions.",
             mis=["3.3-m1", "3.4-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Cc.01", "4Cc.02", "4Cc.03", "4TWSp.05"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("When water freezes, its particles...", "❄️", "lose energy and lock into rows", ["gain energy and fly apart", "disappear one by one"], "Rows again."),
                 q("Melted ice is...", "\U0001F4A7", "the same substance, water, as a liquid", ["a new substance made by the heat", "not water any more"], "Physical change."),
                 q("Sand stirred into water is...", "\U0001F3D6️", "a mixture; nothing new is made", ["a chemical reaction", "a new substance"], "You could filter it out."),
                 q("Rust on an iron gate is...", "\U0001F529", "a new substance made by a chemical reaction", ["dirt stuck to the gate", "old paint peeling off"], "Iron, water and air reacted."),
                 q("Which is a physical change?", "\U0001F50D", "chocolate melting", ["a cake baking", "wood burning"], "Cool it and it sets."),
                 q("Can you get the vinegar back after it reacts with bicarbonate?", "\U0001F9EA", "no; new substances were made", ["yes, by cooling it down", "yes, by stirring it hard"], "The vinegar was used up making new substances."),
                 q("Vinegar could splash in your eyes. The plan?", "⚠️", "wear goggles", ["close your eyes", "stand closer to see"], "A specific action."),
                 q("Who should handle a hot pan?", "\U0001F525", "a grown-up", ["the fastest child", "nobody"], "Heat is for the grown-up."),
                 q("Why is burning wood a chemical reaction, but melting chocolate is not?", "\U0001FAB5", "burning makes new substances; melting does not", ["burning is much hotter than melting", "wood is much harder than chocolate"], "Ash and smoke are new substances. Melted chocolate is still chocolate."),
                 q("What will happen if you put melted chocolate in the fridge?", "\U0001F36B", "it goes solid again, because melting can be undone", ["it stays runny, because melting cannot be undone", "it turns into a new substance"], "Melting is a physical change. Cool the chocolate and it sets again."),
                 q("If salt stirred into water seems to vanish, how could you show it is still there?", "\U0001F9C2", "let the water dry up, and the salt is left behind", ["stir it faster until it fizzes", "shine a torch through the water"], "Dissolving is a physical change. The salt was there all along."),
             ],
              "support": [
                 q("Can melted chocolate be turned back into solid chocolate?", "\U0001F36B", "Yes", ["No"],
                   "Melting is a physical change; it can be undone."),
                 q("Can burnt wood be turned back into wood?", "\U0001F525", "No", ["Yes"],
                   "Burning is a chemical reaction. It makes new substances."),
                 q("Does freezing water make a new substance?", "\u2744\uFE0F", "No", ["Yes"],
                   "Ice is still water, and it melts back."),
                 q("Is rust the same substance as iron?", "\U0001F529", "No", ["Yes"],
                   "Rust is something new, made by a reaction with air and water."),
              ],
              "extension": [
                 q("Rusting takes months and burning takes seconds. Are both chemical reactions?", "\U0001F529", "Yes - speed has nothing to do with it", ["No, a reaction must be fast", "No, rusting is only dirt"],
                   "What makes it a reaction is that a NEW substance forms and you cannot get the old one back. Rust is a new substance; it just takes its time."),
                 q("A candle burns away to almost nothing. Where did it go?", "\U0001F56F\uFE0F", "into new substances in the air, which you cannot see", ["it was destroyed completely", "it turned into the light"],
                   "Nothing is destroyed. The wax reacted with the air and the new substances floated away as gases."),
                 q("Mixing sand into water and mixing vinegar into bicarbonate look similar for a second. What tells them apart?", "\U0001F9C2", "one makes a gas that was not there before, and the other makes nothing new", ["nothing tells them apart", "the sand one is faster"],
                   "Watch for a new substance. That single test separates a mixture from a reaction every time."),
                 q("Why does a cook need to know which changes can be undone?", "\U0001F373", "because a physical change can be corrected and a reaction cannot", ["cooks do not need to know any science", "so they can cook faster"],
                   "Melted chocolate can be set again. A burnt pan of it cannot be rescued."),
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

LESSON["warmup"] = [
    q("Particles in a solid are packed in rows. What do they do all the time?", "\U0001F7E2", "vibrate on the spot", ["stay perfectly still", "fly about freely"], "From the last lesson: particles are always moving."),
    q("What happens to chocolate held in a warm hand?", "\U0001F36B", "it melts", ["it freezes", "it turns into water"], "Warmth melts chocolate."),
    q("An animal that eats only plants is a...", "\U0001F411", "herbivore", ["carnivore", "omnivore"],
      "Only plants means herbivore."),
    q("Which bone protects your brain?", "\U0001F9E0", "the skull", ["the spine", "the ribs"],
      "The skull is a hard case round the brain."),
]

LESSON["lecture"] = [
    part("\U0001F9CA", "Melting",
         "Ice is solid water: particles in rows, vibrating. Warm it, and the particles gain energy, break out of their rows and slide. The ice has melted. Same particles, different arrangement."),
    part("❄️", "Freezing",
         "Cool the water and the particles lose energy, slow down and lock back into rows. It has frozen. You can melt and freeze the same water a thousand times. Nothing new is ever made. That is a physical process."),
    part("\U0001F3D6️", "Mixing",
         "Stir sand into water. Sand and water. Still both, and you could filter the sand back out. Mixing is physical too: the substances keep themselves."),
    part("\U0001F9EA", "A chemical reaction",
         "Now pour vinegar onto bicarbonate of soda. It fizzes. Bubbles of a gas pour out that did not exist a moment ago. New substances have been made, and you usually cannot get the old ones back. That is a chemical reaction."),
    part("⚠️", "Staying safe",
         "Fizz can spray. Beakers can smash. Pans burn. Before any practical work, a scientist lists the risks and makes a plan for each: goggles, two hands, a grown-up for the heat. Today you plan, then you test."),
]

# The unit lecture film (tools/create-ehel-unit-lecture.js; storyboard and
# pictures in lecture-video/changes-and-reactions.json). The lecture step draws it
# above the parts; build-lessons.py refuses a path that is not on disk AND in
# app.config.json :: extraPages, and a --draft render.
LESSON["video"] = {
    "src": "lecture-video/changes-and-reactions.336f1e62.mp4",
    "captions": "lecture-video/changes-and-reactions.b2936609.vtt",
    "poster": "lecture-video/changes-and-reactions.91970d68.jpg",
    "note": "About three minutes. Watch it through, then go back over it a part at a time below.",
}

LESSON["words"] = [
    word("change of state", "\U0001F504", "A change between solid, liquid and gas, like melting or freezing.",
         ["Melting is a change of state.", "A change of state can be undone."]),
    word("physical process", "\U0001F9CA", "A change where no new substance is made. It can usually be undone.",
         ["Melting is a physical process.", "Dissolving is a physical process."]),
    word("chemical reaction", "\U0001F9EA", "A change that makes one or more new substances. It usually cannot be undone.",
         ["Burning is a chemical reaction.", "The fizz showed a chemical reaction."]),
    word("substance", "\U0001F4A7", "One pure kind of stuff.",
         ["Water is a substance.", "A reaction makes a new substance."]),
    word("react", "\U0001F525", "To change into new substances when substances meet.",
         ["Vinegar reacts with bicarbonate of soda.", "Iron reacts with water and air to make rust."]),
    word("risk", "⚠️", "Something that could hurt someone.",
         ["A splash in the eye is a risk.", "Plan for every risk."]),
    word("goggles", "\U0001F97D", "Eye protection worn for practical work.",
         ["Goggles on before you pour.", "Goggles stop splashes."]),
    word("freeze", "\u2744\uFE0F", "To change from a liquid to a solid as it cools.",
         ["Water freezes into ice.", "Freezing is a physical change, so it can be undone."]),
    word("property", "\U0001F4CB", "Something about a material you can test: how hard it is, whether it floats, whether it conducts.",
         ["Each material keeps its own properties in a mixture.", "Rust has different properties from iron."]),
]

LESSON["cando"] = [
    cando("I can describe melting and freezing using particles.", "4Cc.01"),
    cando("I know that a change of state is a physical change, not a new substance.", "4Cc.02"),
    cando("I know that a reaction makes one or more NEW substances.", "4Cc.03"),
    cando("I can tell a physical change from a chemical reaction.", "4Cc.03"),
    cando("I can record what happened in a table.", "4TWSc.08"),
    cando("I can say what the risks are and how to stay safe.", "4TWSp.05"),
    cando("I can make a conclusion from my results.", "4TWSa.03"),
]

LESSON["home"] = [
    home("Fizz in the kitchen", "A spoon of bicarbonate of soda, a splash of vinegar, a cup, goggles or sunglasses, a grown-up",
         ["Goggles on. Put the bicarbonate in the cup.",
          "Pour in the vinegar and watch.",
          "Try to get the vinegar back out."],
         "The fizz is a new gas. You cannot un-react it."),
    home("Melt and freeze again", "Chocolate or butter, a small bowl, somewhere warm, somewhere cool, a grown-up",
         ["Let the chocolate melt somewhere warm: in the sun, or in a bowl standing in warm water, with a grown-up.",
          "Move it somewhere cool, a fridge or a shady room, and let it set.",
          "Snap it and look at it. Is it still chocolate? Eat it only if your grown-up says so."],
         "Still chocolate. A physical change, undone."),
    home("Risk plan for cooking", "A grown-up, one recipe",
         ["Before cooking, list every risk: heat, sharp, slippery, splashing.",
          "Write a plan for each one.",
          "Cook, following the plan."],
         "That is exactly what a scientist does before an experiment."),
]
