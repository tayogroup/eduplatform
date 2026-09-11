# -*- coding: utf-8 -*-
"""Lesson 3 - Sub-routines.

0059 Stage 4 Computational Thinking: 4CT.06 decomposition breaks tasks into
different parts (sub-routines); 4CT.07 use decomposition to break tasks into
parts represented as algorithms; 4CT.08 follow and understand algorithms that
use a sub-routine.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "sub-routines",
    "title": "Sub-routines",
    "blurb": "Break a big task into named sub-routines, write each as its own algorithm, put the calls in order in a main algorithm, and follow an algorithm that jumps into a sub-routine and back.",
    "steps": [
        step("context", "What decomposition is", "\U0001F9E9", "Decomposer", ["4CT.06"],
             "Decomposition means breaking a big task into parts. In an algorithm each part is a <b>sub-routine</b>: a small algorithm with a name. Tap each idea.",
             explain(
                 ["A sub-routine is a named part of an algorithm. The main algorithm says do WASH, and WASH is its own list of steps somewhere else."],
                 ["Getting ready for school: main algorithm - do WASH, do DRESS, do BREAKFAST, do BAG, leave.", "WASH: face, teeth, hair. DRESS: shirt, trousers, socks, shoes. Each is short, named, and can be reused."],
                 ["Children think a sub-routine is a shortcut that skips steps.", "It skips nothing. All the steps are still there, in the sub-routine."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F9E9", "label": "decomposition", "say": "Decomposition: breaking a big task into smaller parts. Getting ready for school becomes wash, dress, breakfast, bag."},
                 {"pic": "\U0001F4E6", "label": "a sub-routine", "say": "A sub-routine: one of those parts, written as its own algorithm with a name. WASH is a sub-routine: face, teeth, hair."},
                 {"pic": "\U0001F4CB", "label": "the main algorithm", "say": "The main algorithm: the short list at the top that calls the sub-routines in order. Do WASH, do DRESS, do BREAKFAST, do BAG."},
                 {"pic": "\U0001F501", "label": "reuse", "say": "Reuse. Once WASH is written, any algorithm can say do WASH: the morning routine, the bedtime routine, after football. Written once, used many times."},
             ], "need": 4,
              "then": {"ask": "What is a sub-routine?",
                       "opts": [opt("A named part of an algorithm, written as its own small algorithm", True), opt("A way of skipping steps", False), opt("A loop that goes on forever", False)],
                       "why": "Named, separate, and called from the main algorithm."}},
             "Big task, named parts."),

        step("sort", "Which sub-routine does it belong to?", "\U0001F5C2️", "Step sorter", ["4CT.07"],
             "Decompose 'a school morning' into four sub-routines. Put each step into the sub-routine it belongs to.",
             explain(
                 ["Decomposing is deciding which steps belong together, and giving each group a name."],
                 ["Teeth, face, hair: WASH. Shirt, socks, shoes: DRESS. Bowl, cereal, milk: BREAKFAST. Books, lunch, coat: BAG."],
                 [],
                 ["Read the step, tap its sub-routine."]),
             {"ask": "Which sub-routine?",
              "bins": [{"id": "wash", "label": "WASH", "pic": "\U0001F9FC"}, {"id": "dress", "label": "DRESS", "pic": "\U0001F455"}, {"id": "breakfast", "label": "BREAKFAST", "pic": "\U0001F963"}, {"id": "bag", "label": "BAG", "pic": "\U0001F392"}],
              "items": [
                  {"pic": "\U0001F9B7", "label": "brush your teeth", "bin": "wash", "why": "WASH."},
                  {"pic": "\U0001F455", "label": "put on your shirt", "bin": "dress", "why": "DRESS."},
                  {"pic": "\U0001F33E", "label": "pour the cereal", "bin": "breakfast", "why": "BREAKFAST."},
                  {"pic": "\U0001F4DA", "label": "pack your reading book", "bin": "bag", "why": "BAG."},
                  {"pic": "\U0001F9F4", "label": "brush your hair", "bin": "wash", "why": "WASH."},
                  {"pic": "\U0001F45F", "label": "put on your shoes", "bin": "dress", "why": "DRESS."},
                  {"pic": "\U0001F95B", "label": "pour on the milk", "bin": "breakfast", "why": "BREAKFAST."},
                  {"pic": "\U0001F371", "label": "pack your lunch box", "bin": "bag", "why": "BAG."},
                  {"pic": "\U0001F9FC", "label": "wash your face", "bin": "wash", "why": "WASH."},
                  {"pic": "\U0001F9E5", "label": "get your coat", "bin": "bag", "why": "BAG: the things you take."},
              ]},
             "Four sub-routines, every step in its place."),

        step("order", "Write the main algorithm", "\U0001F4CB", "Main writer", ["4CT.07"],
             "Now the main algorithm: it calls the sub-routines in order. Tap the calls in the order a school morning happens.",
             explain(
                 ["The main algorithm is short: one call per sub-routine, in the right order, and the odd step of its own."],
                 ["Do WASH, do DRESS, do BREAKFAST, do BAG, leave the house.", "Five lines, and behind them twenty steps."],
                 ["Children put BAG before BREAKFAST.", "BAG ends with your coat on and your bag in your hand: it is the last thing before the door."],
                 ["Tap what comes first."]),
             {"items": [
                 s("wash", "do WASH", "\U0001F9FC"), s("dress", "do DRESS", "\U0001F455"), s("breakfast", "do BREAKFAST", "\U0001F963"), s("bag", "do BAG", "\U0001F392"), s("leave", "Leave the house", "\U0001F6AA"),
             ],
              "extras": [
                  {"label": "do BEDTIME", "pic": "\U0001F6CF️", "why": "BEDTIME is a sub-routine for the evening, not the morning."},
                  {"label": "do HOMEWORK", "pic": "\U0001F4DD", "why": "Homework was last night. Not part of the morning."},
              ]},
             "A main algorithm of five lines, calling four sub-routines."),

        step("subroutine", "Follow the calls", "\U0001F463", "Call follower", ["4CT.08"],
             "Follow the main algorithm. When it says <b>do</b> a sub-routine, tap the call, then that sub-routine's steps, then carry on where you left off.",
             explain(
                 ["Following an algorithm with a sub-routine means jumping into the sub-routine, doing all its steps, and jumping back to the line after the call."],
                 ["Main: do WASH. Jump in: face, teeth, hair. Jump back: do DRESS. Jump in: shirt, trousers, socks, shoes. Back again."],
                 ["Children forget to come back and carry on.", "After the last step of a sub-routine, the next step is the line after its call."],
                 ["Tap the call, the steps, then carry on."]),
             {"rounds": [
                 {"task": "a school morning",
                  "main": [{"kind": "call", "sub": "WASH"}, {"kind": "call", "sub": "DRESS"}, s("leave", "Leave the house", "\U0001F6AA")],
                  "subs": {"WASH": [s("face", "Wash your face", "\U0001F9FC"), s("teeth", "Brush your teeth", "\U0001F9B7"), s("hair", "Brush your hair", "\U0001F9F4")],
                           "DRESS": [s("shirt", "Shirt on", "\U0001F455"), s("trousers", "Trousers on", "\U0001F456"), s("socks", "Socks on", "\U0001F9E6"), s("shoes", "Shoes on", "\U0001F45F")]}},
                 {"task": "a bedtime",
                  "main": [s("pyjamas", "Put on pyjamas", "\U0001F454"), {"kind": "call", "sub": "WASH"}, {"kind": "call", "sub": "STORY"}, s("lights", "Lights off", "\U0001F4A1")],
                  "subs": {"WASH": [s("face", "Wash your face", "\U0001F9FC"), s("teeth", "Brush your teeth", "\U0001F9B7"), s("hair", "Brush your hair", "\U0001F9F4")],
                           "STORY": [s("book", "Choose a book", "\U0001F4D6"), s("read", "Read one chapter", "\U0001F4D6"), s("mark", "Put the bookmark in", "\U0001F516")]}},
             ]},
             "Into the sub-routine, and back to the line after the call."),

        step("context", "Why sub-routines help", "\U0001F4E6", "Sub-routine reasoner", ["4CT.06", "4CT.08"],
             "The same WASH sub-routine appeared in the morning AND at bedtime. Tap each reason sub-routines help.",
             explain(
                 ["A sub-routine is written once and used in many places, so a change to it changes every place at once."],
                 ["Add 'floss' to WASH and both the morning and bedtime algorithms get it, without editing either.",
                  "The main algorithm stays short enough to read in one look.", "Someone else can write DRESS while you write WASH."],
                 [],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F501", "label": "written once, used many times", "say": "Written once, used many times. WASH is called in the morning and at bedtime, and only written once."},
                 {"pic": "✏️", "label": "change it in one place", "say": "Change it in one place. Add flossing to WASH and every algorithm that calls WASH gets flossing."},
                 {"pic": "\U0001F4CB", "label": "the main algorithm stays short", "say": "The main algorithm stays short: five lines you can read at a glance, with the detail tucked away."},
                 {"pic": "\U0001F91D", "label": "share the work", "say": "Share the work. One person writes WASH, another writes DRESS, and the main algorithm joins them."},
             ], "need": 4,
              "then": {"ask": "You add 'floss' to the WASH sub-routine. What happens to the morning and bedtime algorithms?",
                       "opts": [opt("Both get the flossing step, because both call WASH", True), opt("Only the morning one changes", False), opt("Nothing; you have to add it twice", False)],
                       "why": "A sub-routine is one copy. Change it once, and every caller changes."}},
             "One copy, many calls."),

        step("questions", "Check: sub-routines", "\U0001F4DD", "Sub-routine checker", ["4CT.06", "4CT.07", "4CT.08"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Decomposition, sub-routines, following calls."], [], ["Read, think, tap."]),
             {"items": [
                 q("Breaking 'a school morning' into wash, dress, breakfast and bag is...", "\U0001F9E9", "decomposition", ["a loop", "a bug", "encryption"], "Breaking a task into parts."),
                 q("After the last step of the WASH sub-routine, the next step is...", "↩️", "the line after 'do WASH' in the main algorithm", ["the first step of WASH again", "the end", "any step"], "Jump back to after the call."),
                 q("The main algorithm says 'do WASH'. That line is...", "\U0001F4E6", "a call to the WASH sub-routine", ["a bug", "a forever loop", "an input"], "A call runs the named sub-routine."),
             ]},
             "Decompose, name, call, return."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4CT.06", "4CT.07", "4CT.08"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about decomposition, sub-routines and following a call."], [], ["Read, look, tap."]),
             {"items": [
                 q("A sub-routine is...", "\U0001F4E6", "a named part of an algorithm, written as its own algorithm", ["a mistake", "the last step", "a kind of input"], "Named and separate."),
                 q("Which is a call to a sub-routine?", "\U0001F4CB", "do BREAKFAST", ["pour the milk", "repeat 4 times", "if it rains"], "'do NAME' runs the sub-routine."),
                 q("'Pour the cereal' belongs in which sub-routine?", "\U0001F33E", "BREAKFAST", ["WASH", "BAG", "DRESS"], "Decomposition groups steps that belong together."),
                 q("Why write WASH once as a sub-routine instead of in every routine?", "\U0001F501", "so it can be reused and changed in one place", ["to make each routine longer", "because it is a rule", "so it runs faster"], "One copy, many calls."),
                 q("You are following the main algorithm and reach 'do DRESS'. You...", "↪️", "do all of DRESS's steps, then carry on after the call", ["skip it", "stop", "start the main algorithm again"], "Into the sub-routine and back."),
                 q("The main algorithm for a school morning has five lines. Behind them are...", "\U0001F9E9", "all the steps of the sub-routines it calls", ["nothing", "five steps in total", "only the last step"], "Decomposition hides detail, it does not remove it."),
                 q("Who benefits from sub-routines when two people write one algorithm?", "\U0001F91D", "both: each can write a sub-routine and the main joins them", ["nobody", "only the teacher", "only the computer"], "Sub-routines share the work."),
             ]},
             "That is the whole lesson finished. You decompose a task into sub-routines and follow the calls."),
    ],
}


LESSON["about"] = [
    "Explain decomposition: breaking a task into parts called sub-routines.",
    "Decompose a task into sub-routines and write each as an algorithm.",
    "Write a main algorithm that calls sub-routines in order.",
    "Follow an algorithm that calls a sub-routine and returns.",
]

LESSON["lecture"] = [
    part("\U0001F9E9", "Decomposition",
         "A big task is easier in parts. Decomposition breaks a school morning into wash, dress, breakfast and bag. In an algorithm each part becomes a sub-routine: its own short algorithm, with a name."),
    part("\U0001F4CB", "The main algorithm",
         "The main algorithm is the short list at the top: do WASH, do DRESS, do BREAKFAST, do BAG, leave the house. Each 'do' is a call. Five lines you can read at a glance, and behind them all the detail."),
    part("↪️", "Following a call",
         "When you reach a call, jump into that sub-routine, do every one of its steps, and jump back to the line after the call. Do WASH: face, teeth, hair; then do DRESS. Nothing is skipped; it is just kept in its own box."),
    part("\U0001F501", "Written once, used many times",
         "The same WASH sub-routine is called in the morning and at bedtime, and written only once. Add flossing to it and both routines get flossing. Sub-routines are reused, changed in one place, and shared between people."),
]

LESSON["words"] = [
    word("decomposition", "\U0001F9E9", "Breaking a big task into smaller parts.",
         ["Decomposition turns a morning into four parts.", "Use decomposition before you write the algorithm."]),
    word("sub-routine", "\U0001F4E6", "A named part of an algorithm, written as its own small algorithm.",
         ["WASH is a sub-routine.", "Write each part as a sub-routine."]),
    word("main algorithm", "\U0001F4CB", "The top-level algorithm that calls the sub-routines.",
         ["The main algorithm has five lines.", "Start with the main algorithm."]),
    word("call", "↪️", "A line that runs a sub-routine: do WASH.",
         ["'Do DRESS' is a call.", "Follow the call into the sub-routine."]),
    word("return", "↩️", "Coming back to the line after the call when the sub-routine is finished.",
         ["Return to the main algorithm.", "After WASH, return to do DRESS."]),
]

LESSON["home"] = [
    home("Boxes on the wall", "Paper, a pen",
         ["Write 'getting ready' as a main list of calls: do WASH, do DRESS, do BAG.",
          "Write each sub-routine in its own box.",
          "Follow the main list for a week, jumping into each box and back."],
         "Into the box, out of the box, carry on."),
    home("Reuse a sub-routine", "The same boxes",
         ["Write a bedtime main list that also calls do WASH.",
          "Add one step to the WASH box.",
          "Which routines changed? (Both.)"],
         "One copy, many calls."),
]
