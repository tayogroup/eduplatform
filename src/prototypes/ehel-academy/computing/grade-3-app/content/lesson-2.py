# -*- coding: utf-8 -*-
"""Lesson 2 - Concise Algorithms.

0059 Stage 3 Computational Thinking: 3CT.02 efficient algorithms are
concise; 3CT.03 identify steps that are repeated within everyday tasks;
3CT.01 edit linear algorithms.
"""
from _kit import explain, step, opt, q, s, part, word, home

LESSON = {
    "slug": "concise-algorithms",
    "title": "Concise Algorithms",
    "blurb": "Cut the steps a task does not need, find the steps that repeat and write them once with a repeat, and see why a concise algorithm is a better algorithm.",
    "steps": [
        step("context", "Long or concise?", "✂️", "Concise thinker", ["3CT.02"],
             "Two algorithms can do the SAME job. The concise one does it in fewer steps. Tap each pair.",
             explain(
                 ["Efficient means doing the job well without waste.", "For an algorithm, efficient means concise: the fewest steps that still do the whole job."],
                 ["'Open the door. Open the door. Walk in.' Three steps. 'Open the door. Walk in.' Two. Same job.",
                  "'Get a cup. Wave at the cat. Pour the juice.' The wave does nothing for the juice. Cut it."],
                 ["Children think more steps means more careful.", "A step that does nothing for the task is waste, not care."],
                 ["Tap each pair and hear which one is concise."]),
             {"items": [
                 {"pic": "\U0001F6AA", "label": "open the door, open the door, walk in", "say": "Open the door, open the door, walk in. The door is already open after step one. Step two is waste."},
                 {"pic": "\U0001F9C3", "label": "get a cup, wave at the cat, pour the juice", "say": "Get a cup, wave at the cat, pour the juice. Waving at the cat does nothing for the juice. Cut it, and the juice still gets poured."},
                 {"pic": "\U0001F9F9", "label": "sweep, sweep, sweep, sweep the same clean spot", "say": "Sweeping a spot that is already clean is waste. Once is enough."},
                 {"pic": "\U0001F4A1", "label": "switch the light on, switch it off, switch it on again", "say": "Light on, light off, light on. Two of those steps undo each other. Just switch it on."},
                 {"pic": "\u2705", "label": "get a glass, fill it with water, drink it", "say": "Get a glass, fill it, drink it. Three steps and every one does something. That algorithm is already concise."},
             ], "need": 5,
              "then": {"ask": "What does a CONCISE algorithm have?",
                       "opts": [opt("Only the steps the task needs, and no more", True), opt("As many steps as possible, to be safe", False), opt("Steps in any order", False)],
                       "why": "Concise means every step is needed. Fewer steps, same job, no waste."}},
             "Concise: every step is needed."),

        step("trim", "Cut the waste: baking a cake", "\u2702\uFE0F", "Cake trimmer", ["3CT.02", "3CT.01"],
             "This algorithm bakes a cake, but it has steps that do nothing for the cake. Tap each wasteful step to cut it.",
             explain(
                 ["A wasteful step is a step done twice, or a step that does nothing for this task."],
                 ["Mix, mix again: the second mix mixes batter that is already mixed.", "Phone a friend: nice, but it does nothing for the cake.",
                  "Cut them, and the cake still gets baked, in fewer steps."],
                 ["Children cut a step that is needed, because it looks small.", "Ask: if I cut this, does the cake still get baked?"],
                 ["Find every wasteful step and tap it. Then watch the short algorithm work."]),
             {"scene": "cake", "task": "bake a cake",
              "steps": [
                  s("bowl", "Get a big bowl", "\U0001F963"),
                  s("flour", "Put in flour and sugar", "\U0001F33E"),
                  s("phone", "Phone a friend to say you are baking", "\U0001F4DE") | {"waste": "A nice call, but it does nothing for the cake. Cut it."},
                  s("eggs", "Crack in two eggs", "\U0001F95A"),
                  s("mix", "Mix it all together", "\U0001F944"),
                  s("mix", "Mix it again, the same way", "\U0001F944") | {"waste": "It is already mixed. The second mix is waste."},
                  s("hat", "Put on a funny hat", "\U0001F3A9") | {"waste": "A funny hat is fun, but it does nothing for the cake."},
                  s("tin", "Pour it into a cake tin", "\U0001F958"),
                  s("oven", "Bake it in the oven", "\U0001F525"),
                  s("cool", "Let it cool", "\u23F2\uFE0F"),
              ],
              "expect": ["bowl", "flour", "eggs", "mix", "tin", "oven", "cool"]},
             "Ten steps became seven, and the cake is just as good."),

        step("trim", "Cut the waste: wrapping a present", "\u2702\uFE0F", "Present trimmer", ["3CT.02", "3CT.01"],
             "Wrapping a present for Nora, with waste in it. Cut the steps that undo each other or do nothing.",
             explain(
                 ["Two steps that undo each other are both waste: wrap, unwrap, wrap again is one step's work."],
                 ["Box, lid, paper, tape, ribbon, tag: six steps do the job.", "Anything else here is either doing it twice or undoing it."],
                 ["Children keep 'unwrap it to check' because it sounds careful.", "It is careful. It is also waste, because the next step wraps it all again."],
                 ["Tap the waste. Then watch."]),
             {"scene": "present", "task": "wrap a present for Nora",
              "steps": [
                  s("box", "Put the teddy in a box", "\U0001F9F8"),
                  s("lid", "Put the lid on the box", "\U0001F4E6"),
                  s("paper", "Wrap the box in paper", "\U0001F381"),
                  s("unwrap", "Unwrap it to check the teddy is there", "\U0001F440") | {"waste": "You just put the teddy in. Unwrapping undoes the wrapping. Waste."},
                  s("paper", "Wrap it in paper again", "\U0001F381") | {"waste": "The paper was on before the step that took it off. Cut both."},
                  s("tape", "Tape the paper down", "\u2702\uFE0F"),
                  s("ribbon", "Tie a ribbon round it", "\U0001F380"),
                  s("count", "Count to one hundred", "\U0001F522") | {"waste": "Counting does nothing for the present."},
                  s("tag", "Stick on a name tag", "\U0001F3F7\uFE0F"),
              ],
              "expect": ["box", "lid", "paper", "tape", "ribbon", "tag"]},
             "Nine steps became six."),

        step("loopspot", "Find the steps that repeat: three plants", "\U0001F501", "Repeat spotter", ["3CT.03"],
             "Watering three plants, written out long. Some steps happen again and again. Tap the steps of the FIRST time they happen.",
             explain(
                 ["Inside many everyday tasks a few steps happen again and again, back to back.", "Fill the can, pour, walk to the next plant. Fill, pour, walk. Fill, pour, walk."],
                 ["Instead of writing them three times, write them once and say repeat 3 times.", "The algorithm gets shorter and clearer, and it is easier to change: change it once, not three times."],
                 ["Children tap a step that happens only once, like getting the can.", "Look for the run of steps that comes round again."],
                 ["Tap each step of the first run. The page will fold the rest."]),
             {"task": "water three plants",
              "steps": [
                  s("can", "Get the watering can", "\U0001F6BF"),
                  s("fill", "Fill the can", "\U0001F4A7"),
                  s("pour", "Pour on a plant", "\U0001F331"),
                  s("walk", "Walk to the next plant", "\U0001F6B6"),
                  s("fill", "Fill the can", "\U0001F4A7"),
                  s("pour", "Pour on a plant", "\U0001F331"),
                  s("walk", "Walk to the next plant", "\U0001F6B6"),
                  s("fill", "Fill the can", "\U0001F4A7"),
                  s("pour", "Pour on a plant", "\U0001F331"),
                  s("walk", "Walk to the next plant", "\U0001F6B6"),
                  s("away", "Put the can away", "\U0001F6AA"),
              ],
              "run": {"start": 1, "length": 3, "times": 3},
              "then": {"ask": "How many times do the repeated steps happen?",
                       "opts": [opt("3", True), opt("2", False), opt("11", False)],
                       "why": "Fill, pour, walk happens three times: once for each plant."}},
             "Eleven steps written out; five with a repeat."),

        step("loopspot", "Find the steps that repeat: laying the table", "\U0001F501", "Table spotter", ["3CT.03"],
             "Laying the table for four people. Which steps come round again? Tap the first time they happen.",
             explain(
                 ["Four people, four places: the same little run of steps for each one."],
                 ["Plate, fork, knife, cup. Plate, fork, knife, cup. Four times.", "Written with a repeat: repeat 4 times, plate, fork, knife, cup."],
                 ["Children tap 'wipe the table' because it is first.", "It happens once. The repeated run starts after it."],
                 ["Tap the four steps of the first place."]),
             {"task": "lay the table for four",
              "steps": [
                  s("wipe", "Wipe the table", "\U0001F9FD"),
                  s("plate", "Put down a plate", "\U0001F37D️"), s("fork", "Put a fork on the left", "\U0001F374"), s("knife", "Put a knife on the right", "\U0001F52A"), s("cup", "Put a cup at the top", "\U0001F964"),
                  s("plate", "Put down a plate", "\U0001F37D️"), s("fork", "Put a fork on the left", "\U0001F374"), s("knife", "Put a knife on the right", "\U0001F52A"), s("cup", "Put a cup at the top", "\U0001F964"),
                  s("plate", "Put down a plate", "\U0001F37D️"), s("fork", "Put a fork on the left", "\U0001F374"), s("knife", "Put a knife on the right", "\U0001F52A"), s("cup", "Put a cup at the top", "\U0001F964"),
                  s("plate", "Put down a plate", "\U0001F37D️"), s("fork", "Put a fork on the left", "\U0001F374"), s("knife", "Put a knife on the right", "\U0001F52A"), s("cup", "Put a cup at the top", "\U0001F964"),
                  s("jug", "Put the jug in the middle", "\U0001F964"),
              ],
              "run": {"start": 1, "length": 4, "times": 4},
              "then": {"ask": "How many times does the run of four steps repeat?",
                       "opts": [opt("4", True), opt("16", False), opt("1", False)],
                       "why": "Once for each of the four people."}},
             "Eighteen steps became six with a repeat."),

        step("sort", "Waste, or needed?", "\U0001F5C2\uFE0F", "Waste sorter", ["3CT.02"],
             "In an algorithm for making a fruit salad, is this step needed or waste?",
             explain(
                 ["Needed: the fruit salad cannot be made without it.", "Waste: doing it twice, undoing something, or doing something for a different task."],
                 [],
                 [],
                 ["Ask: does the fruit salad need this? Tap."]),
             {"ask": "Needed, or waste?",
              "bins": [{"id": "need", "label": "Needed", "pic": "\u2705"}, {"id": "waste", "label": "Waste", "pic": "\U0001F5D1\uFE0F"}],
              "items": [
                  {"pic": "\U0001F34E", "label": "wash the fruit", "bin": "need", "why": "Fruit is washed before it is eaten."},
                  {"pic": "\U0001F34C", "label": "peel the banana", "bin": "need", "why": "Part of the job."},
                  {"pic": "\U0001F34C", "label": "peel the same banana again", "bin": "waste", "why": "It is already peeled."},
                  {"pic": "\U0001F52A", "label": "cut the fruit into pieces, with a grown-up", "bin": "need", "why": "A fruit salad is pieces of fruit."},
                  {"pic": "\U0001F3AE", "label": "play a video game", "bin": "waste", "why": "Nothing to do with the fruit salad."},
                  {"pic": "\U0001F963", "label": "put the pieces in a bowl", "bin": "need", "why": "That is where a fruit salad goes."},
                  {"pic": "\U0001F963", "label": "tip the pieces out of the bowl, then put them back", "bin": "waste", "why": "Out and back in again does nothing."},
                  {"pic": "\U0001F34A", "label": "squeeze orange juice over it", "bin": "need", "why": "Part of the recipe we set."},
              ]},
             "Needed steps stay. Waste goes."),

        step("questions", "Check: concise", "\U0001F4DD", "Concise checker", ["3CT.02", "3CT.03"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Think about waste, repeats and why concise is better."], [], ["Read, think, tap."]),
             {"items": [
                 q("An efficient algorithm is...", "✂️", "concise: only the steps the task needs", ["as long as possible", "one with no steps at all", "one nobody can follow"], "Efficient means no waste."),
                 q("Fill, pour, walk, fill, pour, walk, fill, pour, walk. What is a shorter way to write it?", "\U0001F501", "repeat 3 times: fill, pour, walk", ["fill 9 times", "walk, pour, fill", "leave it as it is"], "The run of three steps repeats three times."),
                 q("Why is a concise algorithm easier to EDIT?", "✏️", "there are fewer steps to change, and a repeat is changed once", ["it cannot be edited", "long algorithms are always better", "editing is not allowed"], "Change the repeated run once and every repeat changes."),
             ]},
             "Concise, and you can say why."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CT.01", "3CT.02", "3CT.03"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about waste, repeats and concise algorithms."], [], ["Read, look, tap."]),
             {"items": [
                 q("'Open the door, open the door, walk in.' Which step is waste?", "\U0001F6AA", "the second open the door", ["the first open the door", "walk in", "none of them"], "The door is already open."),
                 q("Which algorithm is concise?", "\u2705", "bowl, flour, eggs, mix, tin, oven", ["bowl, bowl, flour, eggs, mix, mix, tin, oven", "bowl, flour, sing, eggs, dance, mix, tin, oven", "bowl, flour, eggs, mix, tin, tin, tin, oven"], "Every step does something, and nothing is done twice."),
                 q("Laying four places: plate, fork, knife, cup, four times. The concise way is...", "\U0001F37D️", "repeat 4 times: plate, fork, knife, cup", ["plate 16 times", "write all 16 steps out", "skip the forks"], "The repeated run is written once with a repeat."),
                 q("Wrap it, unwrap it, wrap it again. How many of those steps are needed?", "\U0001F381", "one", ["three", "two", "none"], "The paper only needs to go on once."),
                 q("What does 'efficient' mean for an algorithm?", "⚡", "does the whole job with no wasted steps", ["done by a robot", "very long", "very fast to say"], "Efficient is about waste, not speed of speaking."),
                 q("If you cut a step and the cake does NOT get baked, that step was...", "\U0001F382", "needed", ["waste", "a repeat", "an input"], "Needed steps cannot be cut."),
                 q("Steps that happen again and again, back to back, in a task are called...", "\U0001F501", "repeated steps", ["linear steps", "wasted steps", "secret steps"], "A repeat block writes them once."),
             ]},
             "That is the whole lesson finished. You can make an algorithm concise and find the steps that repeat."),
    ],
}


LESSON["about"] = [
    "Say what makes an algorithm efficient: it is concise.",
    "Cut the steps a task does not need and see that the task still gets done.",
    "Find the steps that repeat inside an everyday task and write them once with a repeat.",
    "Edit an algorithm to make it shorter without changing what it does.",
]

LESSON["lecture"] = [
    part("⚡", "Efficient means concise",
         "An efficient algorithm does the whole job with no waste. For an algorithm, waste is a step done twice, a step that undoes another, or a step that does nothing for this task. Cut the waste and the algorithm is concise."),
    part("✂️", "Cutting the waste",
         "Mix, mix again: the second mix is waste. Wrap, unwrap, wrap again: two of those are waste. Phone a friend while baking a cake: waste for the cake, however nice the call. The test is simple: cut the step, and does the job still get done?"),
    part("\U0001F501", "Steps that repeat",
         "Inside everyday tasks a run of steps often happens again and again: fill the can, pour, walk to the next plant, three times over. Written once with repeat 3 times, the algorithm is shorter, clearer, and changed in one place instead of three."),
    part("✏️", "Why concise is better",
         "A concise algorithm is easier to follow, because there is less to read; easier to understand, because every step matters; and easier to edit, because a change is made once. Computers like it too: fewer steps, less work."),
]

LESSON["words"] = [
    word("efficient", "⚡", "Doing the whole job with no waste.",
         ["An efficient algorithm has no wasted steps.", "The concise one is more efficient."]),
    word("concise", "✂️", "Short, with only the steps that are needed.",
         ["Make the algorithm concise.", "Seven steps is concise for the cake."]),
    word("waste", "\U0001F5D1️", "A step that does nothing for the task, or does something again.",
         ["The second mix is waste.", "Cut the waste."]),
    word("repeat", "\U0001F501", "To do the same steps again.",
         ["Repeat 3 times: fill, pour, walk.", "Find the steps that repeat."]),
    word("task", "\U0001F4CB", "The job an algorithm is for.",
         ["The task is to bake a cake.", "Every step should help the task."]),
]

LESSON["home"] = [
    home("Spot the waste", "A grown-up, cards, a simple job",
         ["Write the steps of a job on cards, and slip in two that do nothing or say the same thing twice.",
          "Can the child find them and take them out?",
          "Does the job still get done with the short set?"],
         "If the job still gets done, the cut steps were waste."),
    home("Find the repeat", "A job with a part that comes round again (setting the table, brushing every tooth)",
         ["Write out every step, long.",
          "Find the run of steps that happens again and again.",
          "Write it once with 'repeat N times' in front. How many cards did you save?"],
         "Repeated steps are written once."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you followed a linear algorithm exactly, said why each step sits where it does, corrected a wrong step and edited one to make something new."
LESSON["warmup"] = [
    q("Two algorithms do the same job. One has 5 steps and one has 9. Which is quicker to follow?", "\u2702\uFE0F", "the one with 5 steps", ["the one with 9 steps", "both take just as long", "neither can be followed"], "Fewer steps for the same job is quicker to follow."),
    q("Clap, stamp, clap, stamp, clap, stamp. Which steps come round again?", "\U0001F44F", "clap, stamp", ["clap, clap", "stamp, jump", "none of them"], "Clap, stamp comes round three times, back to back."),
]
