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
                 ["The kettle must boil before the water is poured, because you pour boiling water.", "The bread must be toasted before it is buttered, because butter in a toaster would melt and burn.",
                  "The key goes in before the door opens, because a locked door does not open."],
                 ["Children put steps in the order they thought of them.", "Ask what each step needs from the step before."],
                 ["Tap all five reasons."]),
             {"items": [
                 {"pic": "\u2615", "label": "boil, then pour", "say": "The kettle boils before you pour, because you pour boiling water. Logic."},
                 {"pic": "\U0001F35E", "label": "toast, then butter", "say": "Toast before butter, because butter in the toaster would melt and burn. Logic."},
                 {"pic": "\U0001F511", "label": "unlock, then open", "say": "Unlock before you open, because a locked door does not open. Logic."},
                 {"pic": "\U0001F6B2", "label": "helmet, then ride", "say": "Helmet on before you ride, because a helmet only helps if it is on when you fall. Logic."},
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
                  {"label": "Put on your wellies", "pic": "\U0001F462", "why": "Wellies are for puddles, not for breakfast."},
                  {"label": "Phone a friend", "pic": "\U0001F4DE", "why": "Lovely, but not part of making cereal."},
              ]},
             "Bowl, cereal, milk, spoon, eat: each step where logic puts it."),

        step("whatif", "What will the change do?", "\U0001F52E", "Change predictor", ["3CT.05"],
             "Here is the smoothie algorithm from lesson 1. Each time, ONE change is proposed. Predict what it will do, then watch.",
             explain(
                 ["Predicting means saying what will happen BEFORE it happens, by thinking the steps through."],
                 ["Swap the lid and the blending: the blender starts with no lid on, and the smoothie sprays out.", "Take out the strawberries: a banana smoothie, but still a smoothie.",
                  "Put ice in: a cold smoothie, with the ice blended in."],
                 ["Children guess instead of thinking through.", "Walk the changed steps in your head, one at a time, and see what the kitchen looks like."],
                 ["Read the change, predict, then watch it happen."]),
             {"scene": "smoothie",
              "steps": [s("banana", "Put a banana in the blender", "\U0001F34C"), s("berries", "Add some strawberries", "\U0001F353"), s("milk", "Pour in milk", "\U0001F95B"), s("lid", "Put the lid on tight", "\U0001F512"), s("blend", "Blend it", "\U0001F300"), s("pour", "Pour it into a glass", "\U0001F964")],
              "rounds": [
                  {"change": {"kind": "swap", "a": 3, "b": 4}, "ask": "What will happen when the blender starts?",
                   "opts": [opt("The smoothie sprays out: the lid is not on yet", True), opt("Nothing changes", False), opt("There is no milk", False)],
                   "why": "Blend comes before the lid now, so the blender runs open and the smoothie sprays everywhere."},
                  {"change": {"kind": "remove", "at": 1}, "ask": "What will the smoothie be like?",
                   "opts": [opt("A banana smoothie with no strawberries", True), opt("No smoothie at all", False), opt("A strawberry smoothie with no banana", False)],
                   "why": "Only the strawberry step went. Banana, milk, lid, blend and pour still happen."},
                  {"change": {"kind": "insert", "at": 2, "step": {"id": "ice", "label": "Add some ice", "pic": "\u2744\uFE0F"}}, "ask": "What will the smoothie be like?",
                   "opts": [opt("A cold smoothie, with the ice blended in", True), opt("A smoothie with no fruit", False), opt("Two glasses of milk", False)],
                   "why": "The ice goes in before the lid and the blending, so it is blended with everything else."},
                  {"change": {"kind": "replace", "at": 0, "step": {"id": "mango", "label": "Put a mango in the blender", "pic": "\U0001F96D"}}, "ask": "What will the smoothie be like?",
                   "opts": [opt("A mango and strawberry smoothie", True), opt("A banana, mango and strawberry smoothie", False), opt("No smoothie at all", False)],
                   "why": "Replace means the banana step is gone and mango is in its place."},
              ]},
             "Four changes predicted before they happened."),

        step("whatif", "Predict again: the kite", "\U0001F52E", "Kite predictor", ["3CT.05"],
             "The kite algorithm from lesson 1. One change each time. What will happen?",
             explain(
                 ["The same skill on a different task: think the changed steps through before you see them."],
                 ["Swap the string and the running: you run into the wind before the string is tied, and the wind takes the kite.", "Take out the tail: a kite with no tail."],
                 [],
                 ["Predict, then watch."]),
             {"scene": "kite",
              "steps": [s("sticks", "Cross two sticks", "\u2795"), s("tie", "Tie them together in the middle", "\U0001F9F5"), s("paper", "Glue paper over the sticks", "\U0001F4C4"), s("tail", "Tie on a tail", "\U0001F380"), s("string", "Tie on a long string", "\U0001F9F6"), s("fly", "Run into the wind with it", "\U0001F32C\uFE0F")],
              "rounds": [
                  {"change": {"kind": "swap", "a": 4, "b": 5}, "ask": "What happens when you run into the wind?",
                   "opts": [opt("The wind takes the kite: there is no string yet", True), opt("Nothing changes", False), opt("The kite has no paper", False)],
                   "why": "Running comes before the string now. Nothing holds the kite, so the wind takes it."},
                  {"change": {"kind": "remove", "at": 3}, "ask": "What is different?",
                   "opts": [opt("A kite with no tail", True), opt("A kite with no string", False), opt("No kite at all", False)],
                   "why": "Only the tail step is gone."},
                  {"change": {"kind": "insert", "at": 3, "step": {"id": "face", "label": "Paint a face on the paper", "pic": "\U0001F3A8"}}, "ask": "What is different?",
                   "opts": [opt("A kite with a face on it", True), opt("The paper falls off", False), opt("The kite has two tails", False)],
                   "why": "A new step after the paper; everything else stays."},
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
                  {"pic": "\U0001F9B7", "label": "brush your teeth", "bin": "wash", "why": "Teeth are part of washing."},
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
                 q("Why does toast come before butter?", "\U0001F35E", "butter in the toaster would melt and burn, so the toast is made first", ["butter is yellow", "no reason", "toast is heavier"], "A logical reason places the step."),
                 q("Predicting a change means...", "\U0001F52E", "saying what will happen before you try it", ["trying it and then looking", "guessing at random", "changing every step"], "Think the changed steps through first."),
                 q("Dividing a big task into sections makes it...", "\U0001F9E9", "easier to follow and easier to edit", ["longer", "impossible", "harder to share"], "Short sections, one change in one place."),
             ]},
             "Logic, prediction, sections."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CT.04", "3CT.05", "3CT.06"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about logic, predicting a change, and sections."], [], ["Read, look, tap."]),
             {"items": [
                 q("Which is a LOGICAL reason for an order?", "\U0001F9E0", "unlock the door before opening it, because a locked door will not open", ["open the door first because doors are fun", "it does not matter", "do the longest step first"], "Logic: the step needs what the step before did."),
                 q("Swap 'put the lid on' with 'blend it'. What happens?", "\U0001F300", "the smoothie sprays out of the blender", ["nothing", "there is no fruit", "it is poured twice"], "The blender runs before the lid is on."),
                 q("Take 'tie on a tail' out of the kite algorithm. What is different?", "\U0001F380", "a kite with no tail", ["no string", "no kite", "two tails"], "Only that step is gone."),
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
         "Every step in a good algorithm is where it is for a reason. Boil before pour, because you pour boiling water. Lid before blend, because an open blender sprays everywhere. Reasoning like that is logical thinking, and it is how algorithms are created."),
    part("\U0001F52E", "Predict the change",
         "Before you change a step, think it through: if I swap the lid and the blending, where does the smoothie end up? All over the kitchen. Predicting means walking the changed steps in your head and saying what will happen before it does."),
    part("\U0001F9E9", "Divide the task",
         "A big task is easier as sections. Getting ready for school is wash, dress, breakfast, bag: four short lists instead of one long one. You always know where you are, and a change to breakfast never touches the bag."),
    part("✏️", "Easier to follow, easier to edit",
         "Sections are easier to follow because each one is short. They are easier to edit because a change stays inside its section. And if something goes wrong, you can ask which section it went wrong in."),
]

LESSON["words"] = [
    word("logic", "\U0001F9E0", "Reasoning: this comes here because of that.",
         ["Logic puts the lid on before the blending.", "Use logic to order the steps."]),
    word("predict", "\U0001F52E", "To say what will happen before it happens.",
         ["Predict what the change will do.", "I predict the smoothie sprays everywhere."]),
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
    home("Predict, then try", "A grown-up, a recipe or routine you can change safely",
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

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you cut the waste out of algorithms and wrote the steps that repeat just once, with a repeat."
LESSON["warmup"] = [
    q("Why does the oven go on before the cake goes in?", "\U0001F525", "so it is hot when the cake goes in", ["so the cake can hide", "it does not matter", "to cool the kitchen"], "Order matters: a step gets things ready for the next one."),
    q("A big job like tidying your whole room is easier if you...", "\U0001F9E9", "split it into small parts: toys, books, clothes", ["do it all at once with your eyes shut", "leave it until next year", "tidy one sock"], "Small sections are easier to follow."),
]
