# -*- coding: utf-8 -*-
"""Lesson 4 - Input Machines.

0059 Stage 3 Computational Thinking: 3CT.07 identify the inputs to
algorithms; 3CT.08 develop linear algorithms to produce an output based on an
input; 3CT.04 logical thinking in the creation of algorithms.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "input-machines",
    "title": "Input Machines",
    "blurb": "Find the input an algorithm starts from, build machines that turn an input into an output, feed them numbers and words, and work out what comes out.",
    "steps": [
        step("context", "What goes in?", "\U0001F4E5", "Input finder", ["3CT.07"],
             "Most algorithms start with an INPUT: something that goes in. Tap each algorithm to find its input.",
             explain(
                 ["The input is what the algorithm is given to work on.", "Change the input and the same algorithm gives a different output."],
                 ["A recipe's input is the ingredients.", "A sum's input is the numbers.", "A search's input is the word you type.",
                  "Robo's input is the program you give it."],
                 ["Children think the input is the first step.", "The input is not a step. It is the thing the steps work ON."],
                 ["Tap all five and find the input."]),
             {"items": [
                 {"pic": "\U0001F373", "label": "a recipe", "say": "A recipe. The input is the ingredients: eggs, flour, sugar. Different ingredients, different cake."},
                 {"pic": "➕", "label": "adding two numbers", "say": "Adding. The input is the two numbers. Give it 3 and 4 and the output is 7. Give it 5 and 5 and the output is 10."},
                 {"pic": "\U0001F50D", "label": "a search", "say": "A search. The input is the word you type. Type 'lions' and lions come out. Type 'tigers' and tigers do."},
                 {"pic": "\U0001F916", "label": "Robo on the grid", "say": "Robo. The input is the program of arrows you give it. A different program, a different journey."},
                 {"pic": "\U0001F9FA", "label": "a washing machine", "say": "A washing machine. The input is the dirty clothes and the setting you choose. The output is clean clothes."},
             ], "need": 5,
              "then": {"ask": "What is the INPUT to an algorithm?",
                       "opts": [opt("The thing the algorithm is given to work on", True), opt("The last step", False), opt("The answer at the end", False)],
                       "why": "Input goes in at the start; the steps work on it; the output comes out at the end."}},
             "The input is what goes in."),

        step("sort", "Input, step or output?", "\U0001F5C2️", "In-step-out sorter", ["3CT.07"],
             "For the algorithm 'make a cup of squash', is this the input, a step, or the output?",
             explain(
                 ["Input: what you start with. Step: something you do. Output: what you end with."],
                 ["Squash and water: input.", "Pour, stir: steps.", "A cup of squash: output."],
                 ["Children call the output a step.", "The output is the RESULT, not something you do."],
                 ["Read it, decide, tap."]),
             {"ask": "Input, step, or output?",
              "bins": [{"id": "in", "label": "Input", "pic": "\U0001F4E5"}, {"id": "step", "label": "Step", "pic": "\U0001F463"}, {"id": "out", "label": "Output", "pic": "\U0001F4E4"}],
              "items": [
                  {"pic": "\U0001F9F4", "label": "the bottle of squash", "bin": "in", "why": "You start with it. Input."},
                  {"pic": "\U0001F4A7", "label": "the water", "bin": "in", "why": "Something you start with. Input."},
                  {"pic": "\U0001F964", "label": "pour a little squash into the cup", "bin": "step", "why": "Something you do. A step."},
                  {"pic": "\U0001F6B0", "label": "fill the cup with water", "bin": "step", "why": "Something you do. A step."},
                  {"pic": "\U0001F944", "label": "stir it", "bin": "step", "why": "A step."},
                  {"pic": "\U0001F9C3", "label": "a cup of squash, ready to drink", "bin": "out", "why": "The result. Output."},
                  {"pic": "\U0001F522", "label": "the two numbers you want to add", "bin": "in", "why": "For adding, the numbers are the input."},
                  {"pic": "7️⃣", "label": "the answer, 7", "bin": "out", "why": "The result of the adding. Output."},
              ]},
             "Input in, steps in the middle, output out."),

        step("inout", "Build a number machine", "⚙️", "Machine builder", ["3CT.08", "3CT.04"],
             "Build each machine by putting its steps in order. Then feed it inputs and watch what comes out.",
             explain(
                 ["An algorithm can be a machine: input in, steps in the middle, output out.", "The same steps, a different input, a different output."],
                 ["The doubling machine: take the number in, add it to itself, send the answer out.", "Put 3 in: 3 plus 3, 6 comes out. Put 5 in: 10 comes out.",
                  "Once you know the steps, you can say the output for an input you have never tried."],
                 ["Children think the machine remembers one answer.", "It follows its steps on WHATEVER goes in."],
                 ["Order the steps, feed it every input, then work out the last one yourself."]),
             {"rounds": [
                 {"name": "The doubling machine", "rule": "double",
                  "steps": ["Take the number in", "Add the number to itself", "Send the answer out"],
                  "inputs": [2, 3, 5],
                  "then": {"ask": "If the input is 7, what comes out?", "input": 7, "opts": [opt("14", True), opt("7", False), opt("9", False)], "why": "7 added to itself is 14. Same steps, new input."}},
                 {"name": "The add-3 machine", "rule": "add:3",
                  "steps": ["Take the number in", "Add 3 to it", "Send the answer out"],
                  "inputs": [1, 4, 6],
                  "then": {"ask": "If the input is 10, what comes out?", "input": 10, "opts": [opt("13", True), opt("10", False), opt("30", False)], "why": "10 plus 3 is 13."}},
                 {"name": "The times-4 machine", "rule": "times:4",
                  "steps": ["Take the number in", "Multiply it by 4", "Send the answer out"],
                  "inputs": [1, 2, 3],
                  "then": {"ask": "If the input is 5, what comes out?", "input": 5, "opts": [opt("20", True), opt("9", False), opt("54", False)], "why": "5 times 4 is 20."}},
             ]},
             "Three machines built, every output worked out."),

        step("inout", "Build a word machine", "\U0001F524", "Word machine builder", ["3CT.08", "3CT.07"],
             "An input does not have to be a number. Build machines that take a WORD in.",
             explain(
                 ["Inputs can be words, pictures, sounds: anything the steps can work on."],
                 ["The letter counter: take the word in, count its letters, send the count out.", "Put 'cat' in: 3. Put 'hello' in: 5."],
                 ["Children count the wrong thing: words instead of letters.", "Read the step. It says letters."],
                 ["Order the steps, feed it words, work out the last one."]),
             {"rounds": [
                 {"name": "The letter counter", "rule": "letters",
                  "steps": ["Take the word in", "Count its letters, one by one", "Send the count out"],
                  "inputs": ["cat", "hello", "a"],
                  "then": {"ask": "If the input is the word 'computer', what comes out?", "input": "computer", "opts": [opt("8", True), opt("1", False), opt("7", False)], "why": "c-o-m-p-u-t-e-r: eight letters."}},
                 {"name": "The halving machine", "rule": "half",
                  "steps": ["Take the number in", "Share it into two equal parts", "Send one part out"],
                  "inputs": [2, 6, 10],
                  "then": {"ask": "If the input is 8, what comes out?", "input": 8, "opts": [opt("4", True), opt("16", False), opt("8", False)], "why": "Half of 8 is 4."}},
             ]},
             "Words in, counts out. Numbers in, halves out."),

        step("questions", "Check: inputs and outputs", "\U0001F4DD", "Machine checker", ["3CT.07", "3CT.08"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Inputs, steps, outputs, and what a machine does with a new input."], [], ["Read, think, tap."]),
             {"items": [
                 q("A search engine's input is...", "\U0001F50D", "the word you type in", ["the list of results", "the computer", "the mouse"], "What goes in is the input."),
                 q("The doubling machine gets 9. What comes out?", "⚙️", "18", ["9", "11", "81"], "9 added to itself is 18."),
                 q("Same machine, different input. The output is...", "\U0001F4E4", "different, because the steps worked on a different input", ["always the same", "nothing", "a bug"], "The steps do not change; the input does."),
             ]},
             "Inputs, steps, outputs."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3CT.04", "3CT.07", "3CT.08"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about inputs, machines and outputs."], [], ["Read, look, tap."]),
             {"items": [
                 q("What is the input to a recipe?", "\U0001F373", "the ingredients", ["the oven timer", "the finished cake", "the plate"], "The ingredients are what the recipe works on."),
                 q("In 'make a cup of squash', which is the OUTPUT?", "\U0001F9C3", "the cup of squash, ready to drink", ["the bottle", "stir it", "the tap"], "The output is the result."),
                 q("The add-3 machine gets 20. What comes out?", "➕", "23", ["20", "3", "60"], "20 plus 3."),
                 q("The letter counter gets 'dog'. What comes out?", "\U0001F524", "3", ["dog", "1", "4"], "d-o-g: three letters."),
                 q("An algorithm that produces an output from an input has...", "⚙️", "an input, steps in order, and an output", ["only an output", "no steps", "a random answer"], "In, steps, out."),
                 q("You give the doubling machine a new number it has never had. It...", "\U0001F914", "follows the same steps and doubles it", ["refuses", "gives the last answer again", "guesses"], "The steps work on whatever goes in."),
                 q("Which is an input to Robo?", "\U0001F916", "the program of arrows you give it", ["the flower", "the grid's colour", "the sound it makes"], "The program is what Robo works on."),
             ]},
             "That is the whole lesson finished. You know what goes in, what happens, and what comes out."),
    ],
}


LESSON["about"] = [
    "Find the input an algorithm starts from.",
    "Tell an input from a step from an output.",
    "Build a linear algorithm that turns an input into an output.",
    "Work out the output for an input you have not tried.",
]

LESSON["lecture"] = [
    part("\U0001F4E5", "The input",
         "Most algorithms start with an input: the thing they are given to work on. A recipe's input is the ingredients, a sum's input is the numbers, a search's input is the word you type. The input is not a step; it is what the steps work on."),
    part("⚙️", "The machine",
         "Think of an algorithm as a machine: input in one side, steps in the middle, output out the other. The doubling machine takes a number in, adds it to itself, and sends the answer out."),
    part("\U0001F4E4", "The output",
         "The output is the result: the answer, the cake, the search results. Same machine, different input, different output - because the steps worked on something different."),
    part("\U0001F52E", "Working it out",
         "Once you know the steps, you can say the output for an input you have never tried. The add-3 machine with 10 in gives 13 out. You did not need to see it; you followed the steps in your head. That is logical thinking again."),
]

LESSON["words"] = [
    word("input", "\U0001F4E5", "What an algorithm is given to work on.",
         ["The input to the recipe is the ingredients.", "Type the input and press go."]),
    word("output", "\U0001F4E4", "What an algorithm produces at the end.",
         ["The output of the doubling machine is 14.", "Input in, output out."]),
    word("machine", "⚙️", "A picture of an algorithm: in one side, out the other.",
         ["The add-3 machine.", "Build the machine from its steps."]),
    word("double", "✖️", "To add a number to itself.",
         ["Double 6 is 12.", "The doubling machine doubles its input."]),
    word("count", "\U0001F522", "To find how many.",
         ["Count the letters in the word.", "The count of 'cat' is 3."]),
]

LESSON["home"] = [
    home("Be the machine", "A grown-up, paper",
         ["The grown-up is a machine with a secret rule (add 2, double, take away 1).",
          "You say an input; the grown-up says the output. Try five inputs.",
          "Work out the rule. Then swap."],
         "From the inputs and outputs you can find the steps."),
    home("Spot the input", "Things at home",
         ["A kettle, a toaster, a washing machine, a torch.",
          "For each one, say the input (what goes in) and the output (what comes out).",
          "Change the input: what changes about the output?"],
         "Every machine has an input and an output."),
]
