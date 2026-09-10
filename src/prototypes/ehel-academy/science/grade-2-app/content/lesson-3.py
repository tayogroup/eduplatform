# -*- coding: utf-8 -*-
"""Lesson 3 - Habitats.

0097 Stage 2 Ecosystems, all three: 2Be.01 a habitat is where a plant or
animal naturally lives; 2Be.02 different habitats hold different plants and
animals; 2Be.03 compare local environments (hot, cold, dry, wet, many or few
plants and animals); with 2TWSc.01, 2TWSc.05, 2TWSa.02, 2TWSa.03, 2TWSp.01
and 2SIC.04.
"""
from _kit import explain, step, opt, q

LESSON = {
    "slug": "habitats",
    "title": "Habitats",
    "blurb": "Visit a pond, a desert, a forest and the icy Arctic, sort the animals that live in each, compare hot and cold and wet and dry places, and build a block graph of what you counted.",
    "steps": [
        step("demo", "Where things live", "\U0001F3E1", "Habitats", ["2Be.01", "2Be.02"],
             "A <b>habitat</b> is the place a plant or animal naturally lives. Press <b>Next</b> to visit four.",
             explain(
                 ["A habitat is the place where a plant or animal naturally lives, and where it finds what it needs."],
                 ["A frog's habitat is a pond: water, insects to eat, plants to hide in.", "A camel's habitat is the desert: hot, dry, sandy.",
                  "A deer's habitat is a forest: trees, shade, leaves to eat.", "A polar bear's habitat is the icy Arctic."],
                 ["Children think a habitat is a house.", "It is the whole place: the water, the ground, the weather, the food."],
                 ["Press Next and look at what lives in each place."]),
             {"button": "Next place ▶", "frames": [
                 {"scene": {"id": "habitat", "state": 0}, "cap": "A <b>pond</b>: wet. Frogs, ducks, fish and water plants live here.", "say": "A pond. It is wet. Frogs, ducks, fish and water plants live here. The pond is their habitat."},
                 {"scene": {"id": "habitat", "state": 1}, "cap": "A <b>desert</b>: hot and dry. Camels, lizards, scorpions and cactus plants.", "say": "A desert. Hot and dry, with sand. Camels, lizards, scorpions and cactus plants live here."},
                 {"scene": {"id": "habitat", "state": 2}, "cap": "A <b>forest</b>: shady, many plants. Deer, birds, mushrooms.", "say": "A forest. Shady, with many trees and plants. Deer, birds and mushrooms live here."},
                 {"scene": {"id": "habitat", "state": 3}, "cap": "The <b>Arctic</b>: cold and icy. Polar bears and penguins.", "say": "The icy Arctic. Very cold. A polar bear's thick fur suits it here. A camel would not last a day."},
                 {"pic": "\U0001F30D", "cap": "Different habitats hold <b>different</b> plants and animals.", "say": "Different habitats hold different plants and animals, because each animal suits the place it lives in."},
             ]},
             "A habitat is where a living thing naturally lives. Different habitats, different living things."),

        step("sort", "Who lives where?", "\U0001F5C2️", "Habitat sorter", ["2Be.02", "2TWSc.01"],
             "Which habitat does this animal or plant live in? Tap the right bin.",
             explain(
                 ["Each plant and animal suits its habitat.", "A fish needs water, so it lives in a pond, not a desert."],
                 ["A frog: pond.", "A camel: desert.", "A polar bear: the Arctic.", "A deer: forest."],
                 ["Children put the penguin in the pond because it swims.", "Penguins live where it is icy cold."],
                 ["Think about what the animal needs: water, heat, cold, trees."]),
             {"ask": "Pond, desert, forest, or Arctic?",
              "bins": [{"id": "pond", "label": "Pond", "pic": "\U0001F438"}, {"id": "desert", "label": "Desert", "pic": "\U0001F335"},
                       {"id": "forest", "label": "Forest", "pic": "\U0001F333"}, {"id": "arctic", "label": "Arctic", "pic": "❄️"}],
              "items": [
                  {"pic": "\U0001F41F", "label": "fish", "bin": "pond", "why": "A fish needs water. Pond."},
                  {"pic": "\U0001F42A", "label": "camel", "bin": "desert", "why": "A camel can go for days without water in the hot desert."},
                  {"pic": "\U0001F43B‍❄️", "label": "polar bear", "bin": "arctic", "why": "Thick fur and fat for the icy Arctic."},
                  {"pic": "\U0001F98C", "label": "deer", "bin": "forest", "why": "A deer eats leaves and hides among trees. Forest."},
                  {"pic": "\U0001F335", "label": "cactus", "bin": "desert", "why": "A cactus stores water and lives in the dry desert."},
                  {"pic": "\U0001F986", "label": "duck", "bin": "pond", "why": "A duck swims and feeds on a pond."},
                  {"pic": "\U0001F427", "label": "penguin", "bin": "arctic", "why": "Penguins live where it is icy cold."},
                  {"pic": "\U0001F344", "label": "mushroom", "bin": "forest", "why": "Mushrooms grow in the damp shade of a forest."},
                  {"pic": "\U0001F98E", "label": "lizard", "bin": "desert", "why": "A lizard warms up on hot desert rocks."},
                  {"pic": "\U0001F43F️", "label": "squirrel", "bin": "forest", "why": "A squirrel lives in the trees of a forest."},
              ]},
             "Every plant and animal lives in the habitat that suits it."),

        step("questions", "Hot, cold, wet, dry", "\U0001F321️", "Place compared", ["2Be.03"],
             "Compare two places near you. Which words describe them? Tap the answer.",
             explain(
                 ["You can compare places with a few words: hot or cold, wet or dry, many plants or few, many animals or few."],
                 ["A garden is wet after rain and has many plants.", "A car park is dry and has few plants and few animals.",
                  "A pond is wet with many animals.", "A sandy beach is dry with few plants."],
                 ["Children think a place with no animals in sight has none.", "Look under a stone: a car park has a few, a garden has many more."],
                 ["Picture the two places, then tap the words that fit."]),
             {"label": "Compare", "items": [
                 q("A garden and a car park. Which has MORE plants?", "\U0001F33F", "the garden", ["the car park", "they have the same"], "A garden is full of plants; a car park has a few weeds in the cracks."),
                 q("A pond and a sandy beach. Which is WETTER?", "\U0001F4A7", "the pond", ["the beach sand", "they are the same"], "A pond is water; sand dries in the sun."),
                 q("A desert and a forest. Which is HOTTER and DRIER?", "☀️", "the desert", ["the forest", "they are the same"], "A desert is hot and dry; a forest is shady and damp."),
                 q("Where would you find MORE animals?", "\U0001F41C", "under a log in a garden", ["on a concrete playground", "on a tarmac road"], "Damp dark places under logs are full of small animals."),
                 q("A snowy mountain top. Which words fit?", "\U0001F3D4️", "cold, few plants", ["hot, many plants", "wet, many animals"], "It is cold up high, and few plants can grow there."),
                 q("A shady forest floor. Which words fit?", "\U0001F333", "damp, many plants, many animals", ["dry, no plants", "hot, no animals"], "A forest is damp and full of plants and small animals."),
             ]},
             "Hot or cold, wet or dry, many or few. That is how scientists compare places."),

        step("lookup", "Look it up: the pond", "\U0001F4D6", "Fact finder", ["2TWSc.05", "2Be.02"],
             "Read the fact card about a pond, then answer <b>from the card</b>.",
             explain(
                 ["A fact card is a secondary source: somebody else looked, and wrote down what they found."],
                 ["Find the question's words in the card and read the answer next to them."],
                 [],
                 ["Read the card, then answer each question from it."]),
             {"source": {"title": "Life in a pond",
                         "lines": ["A pond is a small area of still, fresh water. Its edges are <b>shallow</b> and its middle is deeper.",
                                   "Plants grow at the edge and on the water: <b>reeds</b>, <b>water lilies</b> and tiny green <b>duckweed</b>.",
                                   "Frogs lay their eggs in the pond. The eggs hatch into <b>tadpoles</b>, which grow legs and become frogs.",
                                   "<b>Dragonflies</b> hunt over the water. <b>Pond snails</b> eat the plants. Small fish eat insects.",
                                   "A pond can <b>dry up</b> in a hot summer, and then many of its animals die or move away."]},
              "items": [
                  {"ask": "What do frog eggs hatch into?", "opts": [opt("tadpoles", True), opt("ducklings", False), opt("dragonflies", False)], "why": "The card says the eggs hatch into tadpoles, which grow legs and become frogs."},
                  {"ask": "Name a plant that grows on a pond.", "opts": [opt("water lilies", True), opt("cactus", False), opt("an oak tree", False)], "why": "Reeds, water lilies and duckweed are the pond plants in the card."},
                  {"ask": "What does a pond snail eat?", "opts": [opt("plants", True), opt("fish", False), opt("frogs", False)], "why": "The card says pond snails eat the plants."},
                  {"ask": "What can happen to a pond in a hot summer?", "opts": [opt("It can dry up", True), opt("It freezes", False), opt("It fills with sand", False)], "why": "A pond can dry up in a hot summer, and its animals die or move away."},
              ]},
             "You found every answer in the card."),

        step("graph", "Count and graph the animals", "\U0001F4CA", "Block graph", ["2TWSa.03", "2TWSa.02"],
             "A class counted the animals they found in four places. Build the <b>block graph</b>: one block for each animal.",
             explain(
                 ["A block graph shows numbers as stacks of blocks, so you can see at a glance which is most and which is least."],
                 ["The table says the pond had eight animals, so the pond column needs eight blocks.", "Tap plus until each column matches its number.",
                  "Then look: the tallest column is the place with the most animals."],
                 ["Children stop stacking too early or go one too far.", "Count the blocks against the table number each time."],
                 ["Build all four columns, then read the graph."]),
             {"columns_label": "Place", "value_label": "Animals found",
              "columns": [
                  {"pic": "\U0001F438", "label": "pond", "value": 8},
                  {"pic": "\U0001F33F", "label": "garden", "value": 6},
                  {"pic": "\U0001F3DE️", "label": "park", "value": 4},
                  {"pic": "\U0001F697", "label": "car park", "value": 1},
              ],
              "pattern": {"ask": "Look at your graph. Where did the class find the MOST animals?",
                          "opts": [opt("the pond, the tallest column", True), opt("the car park, the shortest column", False), opt("they were all the same", False)],
                          "why": "The pond column is the tallest: eight animals. The car park, with one, is the shortest. Wetter places with more plants had more animals."}},
             "A block graph shows the most and the least at a glance."),

        step("ask", "Ask a question about a habitat", "❓", "Asked why", ["2TWSp.01"],
             "Look at the desert. Tap a question you would like to ask about it.",
             explain(
                 ["Every habitat is full of questions."],
                 ["How does a camel go so long without water? Why does a cactus have spines? What comes out at night?",
                  "Some of these you can answer by looking, some by looking it up."],
                 [],
                 ["Tap a question, then tap the best way to find its answer."]),
             {"pic": "\U0001F3DC️",
              "questions": ["How does a camel go so long without a drink?", "Why does a cactus have spines instead of leaves?", "Which desert animals come out at night?"],
              "findOut": {"ask": "You want to know which desert animals come out at night. How could you find out?",
                          "opts": [opt("Watch the desert at night with a red torch, or look it up in a fact book", True), opt("Guess", False), opt("Ask a cactus", False)],
                          "why": "Watching is observing; a fact book is a secondary source. Both are ways scientists find out."}},
             "Ask, then watch or look it up."),

        step("context", "Looking after habitats", "\U0001F49A", "Habitat carer", ["2SIC.04", "2Be.01"],
             "What people do can change a habitat. Tap each picture.",
             explain(
                 ["Because we know what living things need from their habitat, we can see how what we do affects them."],
                 ["Rubbish in a pond can hurt the frogs and fish.", "Cutting down a forest takes away the deer's home.",
                  "Planting flowers gives bees a habitat.", "A pile of logs in a corner gives beetles somewhere to live."],
                 [],
                 ["Tap each picture, then answer the question."]),
             {"items": [
                 {"pic": "\U0001F5D1️", "label": "rubbish in the pond", "say": "Rubbish thrown in a pond can trap and poison the animals that live there. Science shows us the harm."},
                 {"pic": "\U0001FA93", "label": "cutting down a forest", "say": "Cut down a forest and the deer, birds and squirrels lose their habitat."},
                 {"pic": "\U0001F33B", "label": "planting flowers", "say": "Plant flowers and bees and butterflies get a habitat with food in it."},
                 {"pic": "\U0001FAB5", "label": "a log pile", "say": "A pile of logs left in a corner becomes a habitat for beetles, woodlice and hedgehogs."},
             ], "need": 4,
              "then": {"ask": "Which of these HELPS the animals in a habitat?",
                       "opts": [opt("Leaving a log pile and planting flowers", True), opt("Throwing rubbish in the pond", False), opt("Cutting down all the trees", False)],
                       "why": "Log piles and flowers give living things a place to live and food to eat."}},
             "What we do changes habitats. Science helps us see how."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Be.01", "2Be.02", "2Be.03", "2TWSa.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["A habitat is where a living thing naturally lives.", "Different habitats, different living things.", "Compare places with hot, cold, wet, dry, many, few."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a habitat?", "\U0001F3E1", "the place where a plant or animal naturally lives", ["a kind of food", "a pet's name", "a kind of weather"], "A habitat is where a living thing naturally lives and finds what it needs."),
                 q("Which animal lives in a pond?", "\U0001F438", "a frog", ["a camel", "a polar bear", "a squirrel"], "Frogs need water; a pond is their habitat."),
                 q("Which habitat is hot and dry?", "☀️", "a desert", ["a pond", "the Arctic", "a forest"], "Deserts are hot and dry."),
                 q("A polar bear has thick fur and fat. Which habitat suits it?", "\U0001F43B‍❄️", "the icy Arctic", ["a desert", "a pond", "a garden"], "Thick fur and fat keep it warm in the cold."),
                 q("A garden and a car park. Which has MORE animals?", "\U0001F41C", "the garden", ["the car park", "the same"], "More plants means more food and hiding places, so more animals."),
                 q("In a block graph, the tallest column shows...", "\U0001F4CA", "the biggest number", ["the smallest number", "the wettest place"], "Taller column, bigger number."),
                 q("Which of these HARMS a pond habitat?", "\U0001F5D1️", "throwing rubbish in it", ["planting reeds beside it", "leaving it alone"], "Rubbish traps and poisons pond animals."),
                 q("Why does a forest hold different animals from a desert?", "\U0001F333", "each animal suits the place it lives in", ["animals choose at random", "all animals live everywhere"], "Different habitats hold different living things because each suits its place."),
             ]},
             "That is the whole lesson finished. You know where living things live."),
    ],
}
