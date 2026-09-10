# -*- coding: utf-8 -*-
"""Lesson 1 - Loops in Algorithms.

0059 Stage 4 Computational Thinking: 4CT.01 follow, understand, edit and
correct algorithms that use repetition, including indefinite (forever) loops;
4CT.02 the same for iteration, including count-controlled loops; 4CT.03
repetition makes algorithms more concise.
"""
from _kit import explain, step, opt, q, s, choice, part, word, home

LESSON = {
    "slug": "loops-in-algorithms",
    "title": "Loops in Algorithms",
    "blurb": "Follow algorithms that go round a repeat loop a counted number of times, or round a forever loop until something stops them; correct a wrong step inside a loop; and see why a loop makes an algorithm shorter.",
    "steps": [
        step("demo", "Two kinds of loop", "\U0001F501", "Loop reader", ["4CT.01", "4CT.02"],
             "An algorithm can go round a loop. A <b>repeat</b> loop goes round a counted number of times. A <b>forever</b> loop never stops on its own. Press <b>Next</b>.",
             explain(
                 ["A loop is a part of an algorithm that happens again and again.", "Repeat 4 times is count-controlled: it counts to 4 and stops. Forever is indefinite: it has no count, so it goes round until something outside stops it."],
                 ["Brushing teeth: repeat 4 times, brush the top, brush the bottom. Four turns, then it stops.", "Traffic lights: forever, red, red and amber, green, amber. They never finish on their own."],
                 ["Children think forever means broken.", "It means the algorithm is meant to keep going: lights, a clock, a game loop."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F501", "cap": "A <b>loop</b>: steps that happen again and again.", "say": "A loop is a part of an algorithm that happens again and again."},
                 {"pic": "4️⃣", "cap": "<b>Repeat 4 times</b>: brush the top, brush the bottom. It counts each turn: 1, 2, 3, 4, then stops. <b>Count-controlled</b>.", "say": "Repeat 4 times: brush the top, brush the bottom. It counts each turn: one, two, three, four, then stops. That is count-controlled iteration."},
                 {"pic": "♾️", "cap": "<b>Forever</b>: red, red and amber, green, amber. No count. It goes round until something stops it. <b>Indefinite</b>.", "say": "Forever: red, red and amber, green, amber. No count. It goes round until something stops it. That is an indefinite loop."},
                 {"pic": "\U0001F6D1", "cap": "The only way out of a forever loop is a <b>stop</b> from outside: a switch, a person, a power cut.", "say": "The only way out of a forever loop is a stop from outside: a switch, a person, a power cut.", "sound": "click"},
             ]},
             "Repeat counts and stops. Forever goes on until stopped."),

        step("loopalgo", "Follow the loops", "\U0001F463", "Loop follower", ["4CT.01", "4CT.02"],
             "Follow each algorithm, tapping the step that comes next. Watch the counter go round the repeat loop; press Stop when the forever loop has gone round twice.",
             explain(
                 ["Following a loop means going back to its first step when you reach its last, and counting the turns."],
                 ["Repeat 4 times, brush top, brush bottom: top, bottom, top, bottom, top, bottom, top, bottom. Then rinse.",
                  "Forever, red, red and amber, green, amber: round and round. Nothing in the loop stops it, so you press Stop."],
                 ["Children leave the loop after one turn.", "Read the count. Four times means four turns."],
                 ["Tap the next step, round and round."]),
             {"rounds": [
                 {"mode": "follow", "task": "brush every tooth",
                  "blocks": [s("paste", "Put paste on the brush", "\U0001FAA5"),
                             {"kind": "repeat", "times": 4, "body": [s("top", "Brush the top teeth", "\U0001F9B7"), s("bottom", "Brush the bottom teeth", "\U0001F9B7")]},
                             s("rinse", "Rinse", "\U0001F4A7")]},
                 {"mode": "follow", "task": "run the traffic lights",
                  "blocks": [{"kind": "forever", "body": [s("red", "Red", "\U0001F534"), s("redamber", "Red and amber", "\U0001F7E0"), s("green", "Green", "\U0001F7E2"), s("amber", "Amber", "\U0001F7E1")]}]},
                 {"mode": "follow", "task": "water three plants",
                  "blocks": [s("can", "Get the watering can", "\U0001FAA3"),
                             {"kind": "repeat", "times": 3, "body": [s("fill", "Fill the can", "\U0001F4A7"), s("pour", "Pour on a plant", "\U0001FAB4"), s("walk", "Walk to the next plant", "\U0001F6B6")]},
                             s("away", "Put the can away", "\U0001F6AA")]},
             ]},
             "Round the repeat loop with a count; round the forever loop until Stop."),

        step("loopalgo", "Correct the loop", "\U0001F41B", "Loop corrector", ["4CT.01", "4CT.02"],
             "One step INSIDE each loop is wrong, so it goes wrong every time round. Find it, fix it, and watch the corrected algorithm run.",
             explain(
                 ["A wrong step inside a loop is worse than one outside: it happens on every turn."],
                 ["Repeat 3 times: fill the can, pour on a plant, tip the can upside down. Every plant gets watered and then the water goes on the floor.",
                  "Fix the one step and all three turns are fixed."],
                 ["Children fix the step outside the loop because it is easier to see.", "Look at what happens every turn."],
                 ["Tap the wrong step, choose the fix, watch."]),
             {"rounds": [
                 {"mode": "fix", "task": "water three plants",
                  "blocks": [s("can", "Get the watering can", "\U0001FAA3"),
                             {"kind": "repeat", "times": 3, "body": [s("fill", "Fill the can", "\U0001F4A7"), s("pour", "Pour on a plant", "\U0001FAB4"), s("tip", "Tip the can upside down", "\U0001F643")]},
                             s("away", "Put the can away", "\U0001F6AA")],
                  "wrong": [1, 2], "why": "Tipping the can upside down empties it on the floor, every time round.",
                  "fix": {"opts": [choice("walk", "Walk to the next plant", True, "\U0001F6B6"), choice("fill", "Fill the can again", False, "\U0001F4A7"), choice("sing", "Sing a song", False, "\U0001F3B5")], "why": "Walk to the next plant. Now every turn waters a plant and moves on."}},
                 {"mode": "fix", "task": "lay the table for four people",
                  "blocks": [s("wipe", "Wipe the table", "\U0001F9FD"),
                             {"kind": "repeat", "times": 4, "body": [s("plate", "Put down a plate", "\U0001F37D️"), s("fork", "Fork on the left", "\U0001F374"), s("hat", "Put a hat on the plate", "\U0001F3A9"), s("cup", "Cup at the top", "\U0001F964")]},
                             s("jug", "Jug in the middle", "\U0001F964")],
                  "wrong": [1, 2], "why": "A hat on every plate. Four hats. Nobody can eat.",
                  "fix": {"opts": [choice("knife", "Knife on the right", True, "\U0001F52A"), choice("wipe", "Wipe the table", False, "\U0001F9FD"), choice("plate", "Another plate", False, "\U0001F37D️")], "why": "Knife on the right. Four proper places."}},
                 {"mode": "fix", "task": "run the traffic lights",
                  "blocks": [{"kind": "forever", "body": [s("red", "Red", "\U0001F534"), s("green", "Green", "\U0001F7E2"), s("greenamber", "Green and amber together", "\U0001F7E2\U0001F7E1"), s("amber", "Amber", "\U0001F7E1")]}],
                  "wrong": [0, 2], "why": "Green and amber together is not a real signal. Drivers would not know whether to go.",
                  "fix": {"opts": [choice("redamber", "Red and amber", True, "\U0001F7E0"), choice("blue", "Blue", False, "\U0001F535"), choice("off", "All off", False, "⚫")], "why": "Red and amber comes after red. Now the loop is right every time round, forever."}},
             ]},
             "One fix inside the loop fixes every turn."),

        step("context", "Repetition makes it concise", "✂️", "Concise thinker", ["4CT.03"],
             "Written out long, the plant algorithm is 11 steps. With a repeat loop it is 5. Tap each reason a loop is better.",
             explain(
                 ["Repetition - a loop - makes an algorithm more concise: the same job in fewer steps."],
                 ["Fill, pour, walk, three times over, is nine steps written out. Repeat 3 times, fill, pour, walk, is four.", "Shorter to read, shorter to write, and one change inside the loop changes every turn."],
                 [],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F4CF", "label": "shorter to read", "say": "Shorter to read. Five lines instead of eleven. You see the whole algorithm at once."},
                 {"pic": "✏️", "label": "shorter to write", "say": "Shorter to write. You write the repeated steps once and say how many times."},
                 {"pic": "\U0001F527", "label": "one change fixes every turn", "say": "One change fixes every turn. Change fill to half-fill inside the loop and all three plants get less water. Written out long, you would change it three times."},
                 {"pic": "\U0001F522", "label": "easy to change the count", "say": "Easy to change the count. Four plants instead of three? Change the 3 to a 4. Written out long, you would add three more steps."},
             ], "need": 4,
              "then": {"ask": "Why does a repeat loop make an algorithm more concise?",
                       "opts": [opt("The repeated steps are written once, with a count, instead of over and over", True), opt("It leaves steps out", False), opt("It makes the steps happen faster", False)],
                       "why": "Same steps, same job, written once. That is concise."}},
             "A loop: written once, done many times."),

        step("sort", "Repeat, or forever?", "\U0001F5C2️", "Loop sorter", ["4CT.01", "4CT.02"],
             "Is this loop count-controlled (repeat, then stop) or indefinite (forever, until stopped)?",
             explain(
                 ["Count-controlled: it knows how many times. Indefinite: it goes on until something outside stops it."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Count-controlled, or forever?",
              "bins": [{"id": "count", "label": "Repeat N times", "pic": "4️⃣"}, {"id": "forever", "label": "Forever", "pic": "♾️"}],
              "items": [
                  {"pic": "\U0001F6A6", "label": "traffic lights changing all day and night", "bin": "forever", "why": "No count. They go on until they are switched off."},
                  {"pic": "\U0001FAA5", "label": "brush the top and bottom teeth 4 times", "bin": "count", "why": "Four times, then stop."},
                  {"pic": "⏰", "label": "a clock ticking", "bin": "forever", "why": "Until the battery goes."},
                  {"pic": "\U0001FAB4", "label": "water each of the 3 plants", "bin": "count", "why": "Three, then stop."},
                  {"pic": "\U0001F3AE", "label": "a game checking for a button press while it is switched on", "bin": "forever", "why": "As long as the game runs."},
                  {"pic": "\U0001F37D️", "label": "lay 6 places at the table", "bin": "count", "why": "Six, then stop."},
                  {"pic": "\U0001F6D1", "label": "a fridge keeping cold until it is unplugged", "bin": "forever", "why": "Indefinite: no count, only a stop from outside."},
                  {"pic": "\U0001F9F1", "label": "add 5 bricks to the tower", "bin": "count", "why": "Five, then stop."},
              ]},
             "A count, or a stop from outside."),

        step("questions", "Check: loops", "\U0001F4DD", "Loop checker", ["4CT.01", "4CT.02", "4CT.03"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Repeat loops, forever loops, concise."], [], ["Read, think, tap."]),
             {"items": [
                 q("Repeat 4 times: brush top, brush bottom. How many brushing steps happen?", "\U0001FAA5", "8", ["2", "4", "16"], "Two steps, four turns."),
                 q("What ends a forever loop?", "♾️", "something outside it, like a switch or a person pressing stop", ["its count", "its last step", "nothing can"], "A forever loop has no count."),
                 q("A wrong step INSIDE a repeat loop...", "\U0001F41B", "goes wrong every time round", ["goes wrong once", "does not matter", "stops the loop"], "It is repeated with the rest."),
             ]},
             "Count, stop, concise."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CT.01", "4CT.02", "4CT.03"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about repeat loops, forever loops and why loops are concise."], [], ["Read, look, tap."]),
             {"items": [
                 q("A loop that counts to 3 and then stops is...", "3️⃣", "count-controlled", ["forever", "broken", "a sub-routine"], "It is controlled by a count."),
                 q("A loop with no count that goes on until stopped is...", "♾️", "indefinite, a forever loop", ["count-controlled", "concise", "a bug"], "Indefinite means no set number."),
                 q("'Repeat 3 times: fill, pour, walk' unrolled is how many steps?", "\U0001FAB4", "9", ["3", "4", "6"], "Three steps, three turns."),
                 q("Which is best written as a forever loop?", "\U0001F6A6", "traffic lights", ["laying 4 places", "brushing 4 times", "adding 5 bricks"], "They never finish on their own."),
                 q("Why is an algorithm with a loop more concise?", "✂️", "the repeated steps are written once", ["it has more steps", "it is slower", "it skips steps"], "Written once, done many times."),
                 q("To water 4 plants instead of 3 with a repeat loop, you change...", "\U0001F522", "the count from 3 to 4", ["every step", "nothing", "the plant"], "One number."),
                 q("In 'repeat 4 times: plate, fork, hat, cup', the hat step...", "\U0001F3A9", "goes wrong four times, once per turn", ["is fine", "only happens once", "stops the loop"], "Inside the loop means every turn."),
             ]},
             "That is the whole lesson finished. You can follow, correct and count a loop, and say why it is concise."),
    ],
}


LESSON["about"] = [
    "Follow an algorithm with a repeat loop, counting the turns.",
    "Follow an algorithm with a forever loop and say what stops it.",
    "Correct a wrong step inside a loop.",
    "Explain why repetition makes an algorithm more concise.",
]

LESSON["lecture"] = [
    part("\U0001F501", "Loops",
         "A loop is a part of an algorithm that happens again and again. When you reach the last step in the loop you go back to the first, and you keep count of the turns."),
    part("4️⃣", "Count-controlled",
         "Repeat 4 times: brush the top, brush the bottom. The loop counts its turns - one, two, three, four - and then it stops. That is iteration with a count-controlled loop."),
    part("♾️", "Forever",
         "Forever: red, red and amber, green, amber. There is no count, so the loop has no end of its own. It goes round until something outside stops it: a switch, a person, a power cut. That is an indefinite loop, and traffic lights, clocks and games all use one."),
    part("✂️", "Concise, and fixable",
         "A loop makes an algorithm concise: the repeated steps are written once with a count instead of over and over. And a wrong step inside a loop goes wrong on every turn, so one fix inside the loop fixes every turn."),
]

LESSON["words"] = [
    word("loop", "\U0001F501", "A part of an algorithm that happens again and again.",
         ["The brushing steps are in a loop.", "Go round the loop four times."]),
    word("iteration", "\U0001F504", "Going round a loop; each time round is one iteration.",
         ["Four iterations of the loop.", "Iteration means repeating."]),
    word("count-controlled", "4️⃣", "A loop that goes round a set number of times, then stops.",
         ["Repeat 4 times is count-controlled.", "A count-controlled loop knows when to stop."]),
    word("forever", "♾️", "A loop with no count, that goes on until something stops it.",
         ["Traffic lights run forever.", "Press stop to end a forever loop."]),
    word("indefinite", "❓", "Without a set number.",
         ["A forever loop is indefinite.", "An indefinite loop needs a stop from outside."]),
    word("concise", "✂️", "Short, with nothing repeated that a loop could do.",
         ["The loop makes it concise.", "Concise algorithms are easier to read."]),
]

LESSON["home"] = [
    home("Loops on cards", "Cards, a grown-up",
         ["Write a routine with a 'repeat 3 times' box: the steps inside on smaller cards.",
          "The grown-up follows it EXACTLY, counting the turns out loud.",
          "Now write one with a 'forever' box. Who has to stop it, and how?"],
         "A count stops a repeat loop; only something outside stops a forever loop."),
    home("Find the forever loops", "A walk round the house",
         ["Find five things that run in a forever loop: a clock, a fridge, a fan, a night light.",
          "For each one, say what stops it.",
          "Find three things that run a counted number of times: a microwave for 2 minutes, a washing machine's three rinses."],
         "Forever loops are everywhere, and each has a stop."),
]
