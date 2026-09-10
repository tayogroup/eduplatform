# -*- coding: utf-8 -*-
"""Lesson 3 - Think It Through.

0059 Stage 3 Computational Thinking: 3CT.04 logical thinking is used in the
creation of algorithms; 3CT.05 predict the outcome of a change to an
algorithm presented as a sequence of steps; 3CT.06 many tasks can be divided
into smaller sections to make them easier to follow and to edit.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "think-it-through",
    "title": "Think It Through",
    "blurb": "Put steps in a logical order and say why, predict what one change to an algorithm will do before it happens, and divide a big task into small sections that are easier to follow and to edit.",
    "steps": [
        step("context", "Logical thinking", "\U0001F9E0", "Logical thinker", ["3CT.04"],
             "Making an algorithm takes logical thinking: this step goes here BECAUSE of that. Tap each reason.",
             explain(
                 ["Logical thinking is reasoning: if this, then that. This step needs what that step made."],
                 ["The kettle must boil before the water is poured, because you pour boiling water.", "The bread must be toasted before it is buttered, because butter melts on hot toast.",
                  "The key goes in before the door opens, because a locked door does not open."],
                 ["Children put steps in the order they thought of them.", "Ask what each step needs from the step before."],
                 ["Tap all five reasons."]),
             {"items": [
                 {"pic": "\U0001F9CB", "label": "boil, then pour", "say": "The kettle boils before you pour, because you pour boiling water. Logic."},
                 {"pic": "\U0001F35E", "label": "toast, then butter", "say": "Toast before butter, because butter melts on hot toast. Logic."},
                 {"pic": "\U0001F511", "label": "unlock, then open", "say": "Unlock before you open, because a locked door does not open. Logic."},
                 {"pic": "\U0001F45F", "label": "socks, then shoes", "say": "Socks before shoes, because a sock cannot go over a shoe. Logic."},
                 {"pic": "\U0001F4BB", "label": "switch on, then log in", "say": "Switch the computer on before you log in, because a computer that is off shows no login screen. Logic."},
             ], "need": 5,
              "then": {"ask": "What is logical thinking, when you make an algorithm?",
                       "opts": [opt("Putting each step where it is for a reason", True), opt("Putting steps in any order", False), opt("Making the algorithm as long as possible", False)],
                       "why": "Every step has a reason to be where it is. That is logic."}},
             "Every step, a reason."),

        step("order", "Order it with logic", "\U0001F9E0", "Logical orderer", ["3CT.04"],
             "Put the steps for a bowl of cereal in a logical order. Ask what each step needs from the one before.",
             explain(
                 ["Bowl first, because everything goes in the bowl.", "Cereal before milk, or the milk splashes.", "Spoon last, because you eat last.", "Three steps are not needed at all."],
                 [],
                 ["Children put the milk in first.", "Cereal first: it needs a dry bowl to land in."],
                 ["Tap what comes first, then next. Leave out what is not needed."]),
             {"items": [
                 s("bowl", "Get a bowl", "\U0001F963"), s("cereal", "Pour in cereal", "\U0001F33E"), s("milk", "Pour on milk", "\U0001F95B"), s("spoon", "Get a spoon", "\U0001F944"), s("eat", "Eat", "\U0001F60B"),
             ],
              "extras": [
                  {"label": "Put the bowl in the bath", "pic": "\U0001F6C1", "why": "Cereal is not made in the bath."},
                  {"label": "Boil the milk", "pic": "\U0001F525", "why": "Cereal takes cold milk."},
                  {"label": "Phone a friend", "pic": "\U0001F4DE", "why": "Lovely, but not part of making cereal."},
              ]},
             "Bowl, cereal, milk, spoon, eat: each step where logic puts it."),

        step("whatif", "What will the change do?", "\U0001F52E", "Change predictor", ["3CT.05"],
             "Here is the sandwich algorithm. Each time, ONE change is proposed. Predict what it will do, then watch.",
             explain(
                 ["Predicting means saying what will happen BEFORE it happens, by thinking the steps through."],
                 ["Swap jam and top slice: the jam goes on top of the sandwich, not inside it.", "Take out butter: a sandwich with no butter, but still a sandwich.",
                  "Put cheese in: a cheese and jam sandwich."],
                 ["Children guess instead of thinking through.", "Walk the changed steps in your head, one at a time, and see what the plate looks like."],
                 ["Read the change, predict, then watch it happen."]),
             {"scene": "sandwich",
              "steps": [s("bread", "Put down a slice of bread", "\U0001F35E"), s("butter", "Spread butter", "\U0001F9C8"), s("jam", "Spread jam", "\U0001F353"), s("top", "Put the top slice on", "\U0001F35E"), s("cut", "Cut it in half", "\U0001F52A")],
              "rounds": [
                  {"change": {"kind": "swap", "a": 2, "b": 3}, "ask": "What will the sandwich be like?",
                   "opts": [opt("The jam ends up on TOP of the sandwich", True), opt("Nothing changes", False), opt("There is no jam", False)],
                   "why": "The top slice goes on first, then the jam is spread on it: jam on the outside."},
                  {"change": {"kind": "remove", "at": 1}, "ask": "What will the sandwich be like?",
                   "opts": [opt("A jam sandwich with no butter", True), opt("A sandwich with no bread", False), opt("The jam falls out", False)],
                   "why": "Only the butter step went. Bread, jam, top, cut still happen."},
                  {"change": {"kind": "insert", "at": 3, "step": {"id": "cheese", "label": "Add a slice of cheese", "pic": "\U0001F9C0"}}, "ask": "What will the sandwich be like?",
                   "opts": [opt("A cheese and jam sandwich", True), opt("A plain cheese sandwich", False), opt("A sandwich with two top slices", False)],
                   "why": "Cheese goes in after the jam and before the top: both fillings inside."},
                  {"change": {"kind": "replace", "at": 2, "step": {"id": "banana", "label": "Add sliced banana", "pic": "\U0001F34C"}}, "ask": "What will the sandwich be like?",
                   "opts": [opt("A banana sandwich instead of a jam one", True), opt("A jam AND banana sandwich", False), opt("No sandwich at all", False)],
                   "why": "Replace means the jam step is gone and banana is in its place."},
              ]},
             "Four changes predicted before they happened."),

        step("whatif", "Predict again: bedtime", "\U0001F52E", "Bedtime predictor", ["3CT.05"],
             "The bedtime algorithm. One change each time. What will happen?",
             explain(
                 ["The same skill on a different task: think the changed steps through before you see them."],
                 ["Swap lights and story: the lights go off, then someone tries to read in the dark.", "Take out teeth: bed with unbrushed teeth."],
                 [],
                 ["Predict, then watch."]),
             {"scene": "bed",
              "steps": [s("pyjamas", "Put on pyjamas", "\U0001F454"), s("teeth", "Brush teeth", "\U0001FAA5"), s("story", "Read a story", "\U0001F4D6"), s("bed", "Get into bed", "\U0001F6CF️"), s("lights", "Lights off", "\U0001F4A1")],
              "rounds": [
                  {"change": {"kind": "swap", "a": 2, "b": 4}, "ask": "What happens at story time?",
                   "opts": [opt("The lights are off, so the story is read in the dark", True), opt("Nothing changes", False), opt("There is no bed", False)],
                   "why": "Lights off comes before the story now. Reading in the dark does not work."},
                  {"change": {"kind": "remove", "at": 1}, "ask": "What is different?",
                   "opts": [opt("Bed with unbrushed teeth", True), opt("No pyjamas", False), opt("Two stories", False)],
                   "why": "Only the teeth step is gone."},
                  {"change": {"kind": "insert", "at": 2, "step": {"id": "drink", "label": "Have a drink of water", "pic": "\U0001F4A7"}}, "ask": "What is different?",
                   "opts": [opt("A drink of water before the story", True), opt("The story is skipped", False), opt("The lights stay on all night", False)],
                   "why": "A new step in the middle; everything else stays."},
              ]},
             "You can predict a change before it happens."),

        step("sort", "Divide the task into sections", "\U0001F9E9", "Task divider", ["3CT.06"],
             "Getting ready for school is a BIG task. Sort each step into its section: wash, dress, breakfast, bag.",
             explain(
                 ["A big task with twenty steps is hard to follow and hard to edit.", "Divided into small sections, each section is short, and you can change one section without touching the others."],
                 ["Wash: face, teeth, hair. Dress: shirt, trousers, socks, shoes. Breakfast: bowl, cereal, milk. Bag: books, lunch, coat."],
                 ["Children think dividing a task makes more work.", "It makes the same work easier to follow, and easier to change: swap one breakfast step and the dress section is untouched."],
                 ["Each step goes in one section. Tap."]),
             {"ask": "Which section?",
              "bins": [{"id": "wash", "label": "Wash", "pic": "\U0001F9FC"}, {"id": "dress", "label": "Dress", "pic": "\U0001F455"}, {"id": "breakfast", "label": "Breakfast", "pic": "\U0001F963"}, {"id": "bag", "label": "Bag", "pic": "\U0001F392"}],
              "items": [
                  {"pic": "\U0001FAA5", "label": "brush your teeth", "bin": "wash", "why": "Teeth are part of washing."},
                  {"pic": "\U0001F455", "label": "put on your shirt", "bin": "dress", "why": "Getting dressed."},
                  {"pic": "\U0001F33E", "label": "pour the cereal", "bin": "breakfast", "why": "Breakfast."},
                  {"pic": "\U0001F4DA", "label": "pack your reading book", "bin": "bag", "why": "Packing the bag."},
                  {"pic": "\U0001F9FC", "label": "wash your face", "bin": "wash", "why": "Washing."},
                  {"pic": "\U0001F45F", "label": "put on your shoes", "bin": "dress", "why": "Dressing."},
                  {"pic": "\U0001F95B", "label": "pour on the milk", "bin": "breakfast", "why": "Breakfast."},
                  {"pic": "\U0001F371", "label": "pack your lunch box", "bin": "bag", "why": "The bag."},
                  {"pic": "\U0001F9F4", "label": "brush your hair", "bin": "wash", "why": "Washing and tidying."},
                  {"pic": "\U0001F9E6", "label": "put on socks", "bin": "dress", "why": "Dressing."},
              ]},
             "Four short sections instead of one long list."),

        step("context", "Why sections help", "\U0001F9E9", "Section explainer", ["3CT.06"],
             "Why divide a task into sections? Tap each reason.",
             explain(
                 ["Sections make a task easier to follow and easier to edit."],
                 ["Easier to follow: you do one section at a time and know where you are.", "Easier to edit: change breakfast from cereal to toast without touching wash, dress or bag.",
                  "Easier to check: if you are late, which section took too long?"],
                 [],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F463", "label": "easier to follow", "say": "Easier to follow. Four short sections, one at a time, and you always know where you are."},
                 {"pic": "✏️", "label": "easier to edit", "say": "Easier to edit. Change the breakfast section to toast, and wash, dress and bag do not change at all."},
                 {"pic": "\U0001F50D", "label": "easier to find a problem", "say": "Easier to find a problem. If you are late, you can ask which section took too long."},
                 {"pic": "\U0001F91D", "label": "easier to share", "say": "Easier to share. One person can do the bag section while another does breakfast."},
             ], "need": 4,
              "then": {"ask": "You want to change breakfast from cereal to toast. Which sections do you have to change?",
                       "opts": [opt("Only the breakfast section", True), opt("All four sections", False), opt("The bag section", False)],
                       "why": "That is the point of sections: a change stays inside its section."}},
             "Sections: easier to follow, easier to edit."),

        step("questions", "Check: think it through", "\U0001F4DD", "Thinking checker", ["3CT.04", "3CT.05", "3CT.06"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Logic, prediction, sections."], [], ["Read, think, tap."]),
             {"items": [
                 q("Why does toast come before butter?", "\U0001F35E", "butter melts on hot toast, so the toast must be made first", ["butter is yellow", "no reason", "toast is heavier"], "A logical reason places the step."),
                 q("Predicting a change means...", "\U0001F52E", "saying what will happen before you try it", ["trying it and then looking", "guessing at random", "changing every step"], "Think the changed steps through first."),
                 q("Dividing a big task into sections makes it...", "\U0001F9E9", "easier to follow and easier to edit", ["longer", "impossible", "harder to share"], "Short sections, one change in one place."),
             ]},
             "Logic, prediction, sections."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CT.04", "3CT.05", "3CT.06"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about logic, predicting a change, and sections."], [], ["Read, look, tap."]),
             {"items": [
                 q("Which is a LOGICAL reason for an order?", "\U0001F9E0", "unlock the door before opening it, because a locked door will not open", ["open the door first because doors are fun", "it does not matter", "do the longest step first"], "Logic: the step needs what the step before did."),
                 q("Swap 'spread jam' with 'put the top on'. What happens?", "\U0001F353", "the jam ends up on top of the sandwich", ["nothing", "no bread", "the sandwich is cut twice"], "The top goes on, then jam is spread on the top."),
                 q("Take 'brush teeth' out of the bedtime algorithm. What is different?", "\U0001FAA5", "bed with unbrushed teeth", ["no story", "no bed", "two stories"], "Only that step is gone."),
                 q("'Getting ready for school' divided into wash, dress, breakfast, bag is...", "\U0001F9E9", "a big task divided into sections", ["four different tasks", "a bug", "a repeat"], "One task, four sections."),
                 q("To change cereal to toast you change...", "\U0001F35E", "only the breakfast section", ["every section", "the wash section", "nothing"], "A change stays in its section."),
                 q("Cereal goes in the bowl before the milk because...", "\U0001F33E", "cereal needs a dry bowl to land in and milk would splash", ["milk is white", "it is quicker to say", "no reason"], "Logical thinking places the steps."),
                 q("Before you change a step, the sensible thing to do is...", "\U0001F52E", "predict what the change will do", ["change two steps at once", "delete the algorithm", "skip to the end"], "Predict first, then change, then check."),
             ]},
             "That is the whole lesson finished. You think an algorithm through: logic, prediction and sections."),
    ],
}


LESSON["about"] = [
    "Use logical thinking to put the steps of an algorithm where they belong, and say why.",
    "Predict what one change to an algorithm will do before it happens.",
    "Divide a big task into smaller sections.",
    "Say why sections make a task easier to follow and to edit.",
]

LESSON["lecture"] = [
    part("\U0001F9E0", "Logical thinking",
         "Every step in a good algorithm is where it is for a reason. Boil before pour, because you pour boiling water. Socks before shoes, because a sock cannot go over a shoe. Reasoning like that is logical thinking, and it is how algorithms are created."),
    part("\U0001F52E", "Predict the change",
         "Before you change a step, think it through: if I swap jam and the top slice, where does the jam end up? On top. Predicting means walking the changed steps in your head and saying what will happen before it does."),
    part("\U0001F9E9", "Divide the task",
         "A big task is easier as sections. Getting ready for school is wash, dress, breakfast, bag: four short lists instead of one long one. You always know where you are, and a change to breakfast never touches the bag."),
    part("✏️", "Easier to follow, easier to edit",
         "Sections are easier to follow because each one is short. They are easier to edit because a change stays inside its section. And if something goes wrong, you can ask which section it went wrong in."),
]

LESSON["words"] = [
    word("logic", "\U0001F9E0", "Reasoning: this comes here because of that.",
         ["Logic puts the tap before the soap.", "Use logic to order the steps."]),
    word("predict", "\U0001F52E", "To say what will happen before it happens.",
         ["Predict what the change will do.", "I predict the jam ends up on top."]),
    word("change", "\U0001F504", "To make a step different: swap, remove, add or replace.",
         ["One change at a time.", "Predict the change first."]),
    word("section", "\U0001F9E9", "A small part of a big task.",
         ["The breakfast section has three steps.", "Divide the task into sections."]),
    word("divide", "➗", "To split something big into smaller parts.",
         ["Divide the task into four sections.", "Dividing makes it easier to follow."]),
]

LESSON["home"] = [
    home("Say the reason", "A grown-up, a routine",
         ["Say the steps of a routine (making toast, going to bed).",
          "For every step, say 'because': it comes here because...",
          "Find one step whose order does not matter. Most do."],
         "Logic is the 'because'."),
    home("Predict, then try", "A recipe or routine you can change safely",
         ["Pick one change: swap two steps, or leave one out.",
          "Say out loud what will happen.",
          "Try it. Were you right?"],
         "Predicting before trying is what programmers do."),
    home("Sections on the wall", "Paper, a pen",
         ["Write 'getting ready for school' as four sections: wash, dress, breakfast, bag.",
          "Put it on the wall and follow it for a week.",
          "Change one section (a new breakfast). Did the others need changing?"],
         "A change stays in its section."),
]
