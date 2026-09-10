# -*- coding: utf-8 -*-
"""Lesson 11 - Magnets.

0097 Stage 3: 3Pe.01 a magnet has a north pole and a south pole; 3Pe.02 how
magnets interact (attract and repel); 3Pe.03 some materials are magnetic and
many are not; with 3TWSp.03, 3TWSa.01, 3TWSa.03, 3TWSc.06 and 3SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "magnets",
    "title": "Magnets",
    "blurb": "Find the two poles of a magnet, bring two magnets together both ways round and feel them pull and push, test eight materials to see which are magnetic, and see how magnets do jobs for us.",
    "steps": [
        step("demo", "Every magnet has two poles", "\U0001F9F2", "Two poles", ["3Pe.01"],
             "Press <b>Next</b> to look closely at a magnet.",
             explain(
                 ["Every magnet has two ends called poles: a north pole and a south pole.", "The pull is strongest at the poles."],
                 ["Bar magnets are painted red for north and blue for south.", "Even a horseshoe magnet has a north end and a south end.", "Cut a magnet in half and each half has both poles."],
                 ["Children think one end is the magnet and the other is not.", "Both ends pull. They are just different poles."],
                 ["Press Next through all four."]),
             {"frames": [
                 {"pic": "\U0001F9F2", "cap": "A bar magnet. One end is the <b>north pole</b>, the other the <b>south pole</b>.", "say": "Here is a bar magnet. One end is called the north pole, marked N. The other end is the south pole, marked S."},
                 {"pic": "\U0001F4CE", "cap": "Dip it in paperclips: they cling to the <b>two ends</b>, hardly at all in the middle.", "say": "Dip it in a pot of paperclips. They cling to the two ends, the poles, and hardly at all to the middle. The pull is strongest at the poles."},
                 {"pic": "\U0001F9ED", "cap": "A compass needle is a tiny magnet. Its north pole swings to point north.", "say": "A compass needle is a tiny magnet that can swing freely. Its north pole always turns to point north. That is how a compass works."},
                 {"pic": "✂️", "cap": "Cut a magnet in half and you get two magnets, each with a north AND a south pole.", "say": "If you could cut a magnet in half, you would not get a north piece and a south piece. You would get two smaller magnets, each with both poles. A magnet always has two."},
             ]},
             "North pole, south pole. Every magnet has both."),

        step("experiment", "Attract or repel?", "\U0001F9F2", "Push and pull", ["3Pe.02", "3Pe.01", "3TWSp.03", "3TWSa.01", "3TWSa.03"],
             "Two bar magnets. Predict what happens when north meets north.",
             explain(
                 ["Magnets pull on each other or push each other away, depending on which poles meet."],
                 ["North to south: they snap together. They attract.", "North to north, or south to south: they push apart. They repel."],
                 ["Children think magnets always stick together.", "Flip one round and it pushes the other away. Try it."],
                 ["Predict, try both ways, say what happened, then conclude."]),
             {"sim": "magnetPoles",
              "predict": {"ask": "Bring a <b>north</b> pole up to another <b>north</b> pole. What will happen?",
                          "opts": [opt("They will push apart", True), opt("They will snap together", False), opt("Nothing will happen", False)]},
              "runAsk": "Bring them together. Then flip the right magnet and bring them together again.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("North to south snapped together; north to north pushed apart", True), opt("They stuck together both ways", False), opt("They pushed apart both ways", False)],
                           "why": "Unlike poles attract. Like poles repel. Flip a magnet and the pull becomes a push."},
              "conclude": {"ask": "What is the rule?",
                           "opts": [opt("Unlike poles attract; like poles repel", True), opt("Magnets always attract", False), opt("Only red ends are magnetic", False)],
                           "why": "That is the rule the results show, and it is true for every magnet in the world."}},
             "Unlike poles attract. Like poles repel."),

        step("predictEach", "Will it stick?", "\U0001F4CE", "Magnetic test", ["3Pe.03", "3TWSp.03", "3TWSa.01"],
             "Predict: is the <b>%s</b> magnetic? Then test it.",
             explain(
                 ["Some materials are magnetic: a magnet pulls them. Most are not."],
                 ["Iron and steel are magnetic.", "Copper, aluminium, plastic, wood and paper are not.", "Not all metals are magnetic. A copper coin and a foil sheet do nothing."],
                 ["Children think all metal is magnetic.", "Test the coin and the foil. The magnet ignores them."],
                 ["Predict for each one, then test."]),
             {"sim": "magnet", "ask": "Is the %s magnetic? Predict, then test.", "tryLabel": "Bring the magnet",
              "choices": [{"id": "yes", "t": "magnetic", "pic": "\U0001F9F2"}, {"id": "no", "t": "not magnetic", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F4CE", "label": "steel paperclip", "answer": "yes", "why": "Steel is magnetic. It jumped to the magnet."},
                  {"pic": "\U0001FA99", "label": "copper coin", "answer": "no", "why": "Copper is a metal, but it is not magnetic."},
                  {"pic": "\U0001F944", "label": "steel spoon", "answer": "yes", "why": "Steel: magnetic."},
                  {"pic": "\U0001F4CF", "label": "plastic ruler", "answer": "no", "why": "Plastic is never magnetic."},
                  {"pic": "\U0001F529", "label": "iron nail", "answer": "yes", "why": "Iron: magnetic. The magnet pulled it across."},
                  {"pic": "\U0001F9FB", "label": "aluminium foil", "answer": "no", "why": "Aluminium is a metal but not magnetic. The magnet did nothing."},
                  {"pic": "✏️", "label": "wooden pencil", "answer": "no", "why": "Wood is not magnetic."},
                  {"pic": "✂️", "label": "steel scissors", "answer": "yes", "why": "Steel blades: magnetic."},
              ]},
             "Iron and steel are magnetic. Most things, including most metals, are not."),

        step("record", "Record the magnet test", "\U0001F4CB", "Magnet table", ["3TWSc.06", "3Pe.03"],
             "Fill in the table. Was the <b>%s</b> magnetic?",
             explain(
                 ["A table keeps the results of the test."],
                 ["Nail: magnetic.", "Coin: not.", "Foil: not.", "Scissors: magnetic."],
                 [],
                 ["Tap the answer for each row."]),
             {"ask": "Was the %s magnetic?",
              "columns": ["Material", "Magnetic?"],
              "rows": [
                  {"pic": "\U0001F529", "label": "iron nail", "answer": "yes", "why": "the iron nail jumped to the magnet."},
                  {"pic": "\U0001FA99", "label": "copper coin", "answer": "no", "why": "the copper coin did nothing. Copper is not magnetic."},
                  {"pic": "\U0001F9FB", "label": "aluminium foil", "answer": "no", "why": "the foil did nothing. Aluminium is not magnetic."},
                  {"pic": "✂️", "label": "steel scissors", "answer": "yes", "why": "the steel scissors were pulled to the magnet."},
              ],
              "choices": [{"id": "yes", "t": "magnetic", "pic": "\U0001F9F2"}, {"id": "no", "t": "not magnetic", "pic": "\U0001F6AB"}]},
             "Iron and steel: yes. Copper and aluminium: no."),

        step("context", "Magnets at work", "\U0001F9ED", "Useful magnets", ["3SIC.02", "3Pe.02", "3Pe.03"],
             "Science explains how the magnets around you work. Tap each one.",
             explain(
                 ["Magnets do jobs all over your house and beyond."],
                 ["A fridge door has a magnetic strip that pulls it shut.", "A compass needle points north.", "A scrapyard crane lifts whole cars with a huge magnet.", "A magnetic toy train joins its carriages with magnets."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F9CA", "label": "fridge door", "say": "The rubber seal round a fridge door has a magnetic strip inside. It pulls against the steel door and holds it shut."},
                 {"pic": "\U0001F9ED", "label": "compass", "say": "A compass needle is a magnet on a pin. Its north pole swings to point north, so you always know which way you are facing."},
                 {"pic": "\U0001F3D7️", "label": "scrapyard crane", "say": "A scrapyard crane has an enormous magnet that switches on to lift a whole steel car, and off to drop it."},
                 {"pic": "\U0001F682", "label": "magnetic train", "say": "A toy train joins its carriages with a magnet on each end. Turn a carriage round and it repels instead: like poles."},
             ], "need": 4,
              "then": {"ask": "Why does the scrapyard magnet lift cars but not old tyres?",
                       "opts": [opt("Cars are steel, which is magnetic; rubber is not", True), opt("Tyres are too heavy", False), opt("Magnets lift anything", False)],
                       "why": "Only magnetic materials are pulled. Steel yes, rubber no."}},
             "Fridges, compasses, cranes and toys all use magnets."),

        step("questions", "Magnet check", "✅", "Magnet check", ["3Pe.01", "3Pe.02", "3Pe.03"],
             "Tap the answer.",
             explain(
                 ["Poles, attract and repel, and what is magnetic."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What are the two ends of a magnet called?", "\U0001F9F2", "the north pole and the south pole", ["the top and the bottom", "the red and the blue"], "North and south poles."),
                 q("North pole meets south pole. They...", "\U0001F9F2", "attract: pull together", ["repel: push apart", "do nothing"], "Unlike poles attract."),
                 q("South pole meets south pole. They...", "\U0001F9F2", "repel: push apart", ["attract", "melt"], "Like poles repel."),
                 q("Which material is magnetic?", "\U0001F529", "iron", ["copper", "plastic", "wood"], "Iron and steel."),
                 q("Is every metal magnetic?", "\U0001FA99", "no; copper and aluminium are not", ["yes", "only shiny ones"], "The coin and the foil did nothing."),
             ]},
             "You know your magnets."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Pe.01", "3Pe.02", "3Pe.03", "3SIC.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where is a magnet's pull strongest?", "\U0001F4CE", "at the two poles", ["in the middle", "everywhere the same"], "The paperclips clung to the ends."),
                 q("What does attract mean?", "\U0001F9F2", "pull together", ["push apart", "spin round"], "Unlike poles attract."),
                 q("What does repel mean?", "\U0001F9F2", "push apart", ["pull together", "stick"], "Like poles repel."),
                 q("You flip one magnet round and the pull becomes a push. Why?", "\U0001F504", "now like poles are facing each other", ["the magnet broke", "it got tired"], "Like poles repel."),
                 q("Which of these is NOT magnetic?", "\U0001F9FB", "aluminium foil", ["a steel spoon", "an iron nail", "steel scissors"], "Aluminium is not magnetic."),
                 q("A compass needle points north because...", "\U0001F9ED", "it is a magnet whose north pole turns north", ["it is heavy", "it is painted"], "A tiny free-swinging magnet."),
                 q("Why does a fridge door stay shut?", "\U0001F9CA", "a magnetic strip pulls against the steel door", ["it is glued", "gravity"], "Magnet on steel."),
                 q("If you cut a magnet in half, each half has...", "✂️", "a north pole and a south pole", ["only one pole", "no poles"], "Every magnet has two poles."),
             ]},
             "That is the whole lesson finished. You know how magnets behave."),
    ],
}

LESSON["about"] = [
    "Say that every magnet has a north pole and a south pole.",
    "Say when two magnets attract and when they repel.",
    "Predict and test which materials are magnetic.",
    "Say how magnets do jobs in the things around you.",
]

LESSON["lecture"] = [
    part("\U0001F9F2", "Two poles",
         "Every magnet has two ends called poles: a north pole and a south pole. The pull is strongest at the poles. Dip a magnet in paperclips and they cling to the ends, hardly at all to the middle."),
    part("\U0001F9F2", "Attract",
         "Bring the north pole of one magnet up to the south pole of another. They snap together. Unlike poles attract."),
    part("\U0001F504", "Repel",
         "Now flip one magnet round so north faces north. Push them together and they push back. You cannot make them touch. Like poles repel."),
    part("\U0001F529", "Magnetic materials",
         "A magnet pulls iron and steel. It does not pull copper, aluminium, plastic, wood or paper. So not every metal is magnetic. A copper coin and a sheet of foil do nothing at all."),
    part("\U0001F9ED", "Magnets at work",
         "A compass needle is a tiny magnet that turns to point north. A fridge door has a magnetic strip to hold it shut. A scrapyard crane lifts whole steel cars with a giant magnet. Today, you test them all."),
]

LESSON["words"] = [
    word("magnet", "\U0001F9F2", "A piece of metal that pulls iron and steel towards it.",
         ["The magnet picked up the paperclips.", "A fridge magnet holds up a drawing."]),
    word("pole", "\U0001F9ED", "One of the two ends of a magnet, where the pull is strongest.",
         ["The north pole is painted red.", "Paperclips cling to the poles."]),
    word("north pole", "\U0001F534", "The end of a magnet that turns to point north.",
         ["The compass needle's north pole points north.", "North pole to north pole: they repel."]),
    word("attract", "\U0001F9F2", "To pull together.",
         ["Unlike poles attract.", "A magnet attracts iron."]),
    word("repel", "\U0001F504", "To push apart.",
         ["Like poles repel.", "The two north poles repelled each other."]),
    word("magnetic", "\U0001F529", "Pulled by a magnet. Iron and steel are magnetic.",
         ["A nail is magnetic.", "Copper is not magnetic."]),
    word("compass", "\U0001F9ED", "A tool with a magnetic needle that points north.",
         ["Use a compass to find north.", "A compass needle is a tiny magnet."]),
]

LESSON["home"] = [
    home("Two magnets", "Two fridge magnets or two bar magnets",
         ["Bring them together one way. Feel the pull.",
          "Turn one round and bring them together again. Feel the push.",
          "Try to make the repelling sides touch."],
         "You cannot make like poles touch, however hard you push."),
    home("Magnet hunt", "A magnet, a tray of things: a coin, a paperclip, a key, foil, a spoon, a plastic lid, a nail, a can",
         ["Predict for each one: magnetic or not.",
          "Test it.",
          "Write a table: material, prediction, result."],
         "Some metals are not magnetic. Which ones surprised you? Keep magnets away from phones and bank cards."),
    home("Find the magnets in your house", "Paper and a pencil",
         ["Look for magnets: the fridge door seal, cupboard catches, a bag clasp, a toy.",
          "Draw each one.",
          "Say what job the magnet is doing."],
         "How many did you find? Most houses have more than ten."),
]
