# -*- coding: utf-8 -*-
"""Lesson 4 - Energy for Life.

0097 Stage 4: 4Bp.03 plants and animals need energy; plants get it from
light, animals from eating; 4Be.03 food chains of producers and consumers,
and consumers as herbivores, omnivores, carnivores, predators and prey;
4TWSm.02 use a model to show relationships; 4TWSm.03 draw a food chain
as a diagram; with 4TWSc.01 and 4Pf.03.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "energy-for-life",
    "title": "Energy for Life",
    "blurb": "Follow energy from the Sun into a plant and along a food chain, sort consumers into herbivores, carnivores and omnivores, meet predators and prey, and build a chain as a model of who eats whom.",
    "steps": [
        step("demo", "Where energy for life comes from", "☀️", "Energy trail", ["4Bp.03", "4Pf.03"],
             "Every living thing needs energy to grow, move and stay healthy. Press <b>Next</b> to follow it.",
             explain(
                 ["Nothing lives, grows or moves without energy.", "Plants get theirs from light. Animals get theirs by eating plants, or animals that ate plants."],
                 ["Sunlight lands on a leaf.", "The plant uses it to make food, and stores the energy.", "A rabbit eats the plant and gets the energy.", "A fox eats the rabbit and gets it next."],
                 ["Children think animals get energy from water or air.", "Water and air are needed, but the energy is in the food."],
                 ["Press Next through all five."]),
             {"frames": [
                 {"pic": "☀️", "cap": "Energy arrives as <b>light</b> from the Sun.", "say": "Energy arrives on Earth as light from the Sun. Every living thing's energy starts here."},
                 {"pic": "\U0001F33F", "cap": "A plant catches the light and makes its food. The energy is now stored in the plant.", "say": "A plant catches the light with its leaves and uses it to make food. The energy is now stored inside the plant. Plants get their energy from light."},
                 {"pic": "\U0001F407", "cap": "A rabbit eats the plant. The energy is now in the rabbit.", "say": "A rabbit cannot use light. It eats the plant, and the energy passes into the rabbit. Animals get their energy by eating."},
                 {"pic": "\U0001F98A", "cap": "A fox eats the rabbit. The energy moves again.", "say": "A fox eats the rabbit and the energy moves again. The fox is running on sunlight that came through the grass and the rabbit."},
                 {"pic": "\U0001F3C3\U0001F3FE", "cap": "You need energy to grow, move and stay healthy too, and it comes from your food.", "say": "You are the same. Every move you make, every bit of growing, needs energy, and it all comes from your food. No food, no energy, no movement."},
             ]},
             "Plants get energy from light. Animals get it from eating."),

        step("sort", "Herbivore, carnivore or omnivore?", "\U0001F5C2️", "Eater sort", ["4Be.03", "4TWSc.01"],
             "A consumer eats. What does <b>this</b> one eat? Tap the bin.",
             explain(
                 ["Three words for what a consumer eats.", "Herbivore: plants only. Carnivore: animals only. Omnivore: both."],
                 ["A rabbit eats grass: herbivore.", "A lion eats zebras and other animals: carnivore.", "A bear eats berries and fish: omnivore.", "Most people eat plants and animals: omnivores. Some people choose to eat only plants."],
                 ["Children think big animals must be carnivores.", "An elephant is a herbivore. The biggest land animal eats only plants."],
                 ["Plants, animals, or both? Then tap."]),
             {"ask": "Herbivore, carnivore or omnivore?",
              "bins": [{"id": "herb", "label": "Herbivore", "pic": "\U0001F33F"}, {"id": "carn", "label": "Carnivore", "pic": "\U0001F356"}, {"id": "omni", "label": "Omnivore", "pic": "\U0001F37D️"}],
              "items": [
                  {"pic": "\U0001F407", "label": "rabbit", "bin": "herb", "why": "Grass and leaves only."},
                  {"pic": "\U0001F981", "label": "lion", "bin": "carn", "why": "Zebras, antelope and other animals. Meat only."},
                  {"pic": "\U0001F43B", "label": "bear", "bin": "omni", "why": "Berries, roots, fish and honey."},
                  {"pic": "\U0001F418", "label": "elephant", "bin": "herb", "why": "Grass, leaves and fruit. Hundreds of kilograms a day."},
                  {"pic": "\U0001F988", "label": "shark", "bin": "carn", "why": "Fish and seals."},
                  {"pic": "\U0001F9D1\U0001F3FE", "label": "human", "bin": "omni", "why": "Most people eat plants and animals."},
                  {"pic": "\U0001F40E", "label": "horse", "bin": "herb", "why": "Grass and hay."},
                  {"pic": "\U0001F989", "label": "owl", "bin": "carn", "why": "Mice and voles."},
                  {"pic": "\U0001F416", "label": "pig", "bin": "omni", "why": "Roots, grain, insects, almost anything."},
                  {"pic": "\U0001F40C", "label": "snail", "bin": "herb", "why": "Leaves. Ask any gardener."},
              ]},
             "Herbivore, carnivore, omnivore: plants, animals, both."),

        step("explore", "Predator and prey", "\U0001F989", "Hunter and hunted", ["4Be.03"],
             "In a food chain, some animals hunt and some are hunted. Tap each.",
             explain(
                 ["A predator hunts and eats other animals. Prey is the animal that gets eaten.", "An animal can be both: a frog eats flies and is eaten by a heron."],
                 ["The owl is a predator; the mouse is its prey.", "The mouse eats seeds and small insects, so it is a consumer too.", "The frog is a predator of flies and the prey of the heron."],
                 ["Children think prey means small.", "A zebra is prey to a lion, and it is huge."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F989", "label": "predator", "sub": "hunts other animals", "say": "A predator hunts and eats other animals. An owl, a fox, a shark, a spider."},
                 {"pic": "\U0001F401", "label": "prey", "sub": "gets hunted", "say": "Prey is the animal a predator hunts. A mouse to an owl. A rabbit to a fox. A zebra to a lion."},
                 {"pic": "\U0001F438", "label": "both at once", "sub": "hunter and hunted", "say": "A frog is a predator: it eats flies. And a frog is prey: a heron eats it. Most animals in the middle of a chain are both."},
                 {"pic": "\U0001F33F", "label": "the producer", "sub": "neither", "say": "The plant at the start of the chain is neither predator nor prey. It is the producer, making food from light. But it does get eaten."},
             ], "need": 4,
              "then": {"ask": "In grass, rabbit, fox: which animal is prey?",
                       "opts": [opt("the rabbit", True), opt("the fox", False), opt("the grass", False)],
                       "why": "The fox hunts the rabbit. The rabbit is the prey; the grass is a plant, not an animal."}},
             "Predators hunt. Prey is hunted. Many animals are both."),

        step("build", "A model of who eats whom", "\U0001F527", "Chain model", ["4TWSm.02", "4Be.03", "4Bp.03"],
             "Build a food chain as a model of the relationship between the grass, the rabbit and the fox. Then break it.",
             explain(
                 ["A model can show a relationship: here, who eats whom, and which way the energy goes."],
                 ["Grass: the producer, energy from light.", "Rabbit: a herbivore, and the fox's prey.", "Fox: a consumer and a predator. In this chain it eats the rabbit.", "Then take the grass away and watch the relationship break."],
                 ["Children think the model is the animals themselves.", "It is a model of one relationship. Real foxes also eat fruit, insects and mice, so they are omnivores. The model leaves that out."],
                 ["Tap the three parts, then break the chain."]),
             {"sim": "foodChain",
              "parts": [
                  {"id": "grass", "label": "grass: producer", "pic": "\U0001F33F"},
                  {"id": "rabbit", "label": "rabbit: herbivore, prey", "pic": "\U0001F407"},
                  {"id": "fox", "label": "fox: consumer, predator", "pic": "\U0001F98A"},
              ]},
             "The model shows the relationship: energy goes from producer to consumer to consumer."),

        step("order", "A sea food chain", "\U0001F30A", "Sea chain", ["4Be.03", "4TWSm.03"],
             "Draw this sea food chain as a diagram. Tap the producer first, then each animal that eats the one before. An arrow joins them as you go.",
             explain(
                 ["The sea has food chains too, starting with tiny plants.", "Scientists draw a food chain as a diagram: the names in a row, with an arrow from each living thing to the one that eats it. The arrows show which way the energy goes."],
                 ["Tiny floating plants make food from light.", "A small fish eats them.", "A bigger fish eats the small fish.", "A seal eats the bigger fish."],
                 ["Children start with the seal, or point the arrows at the plants.", "Start with the producer. Always. Each arrow points to the eater."],
                 ["Tap the producer first, and watch the diagram grow."]),
             {"items": [
                 {"pic": "\U0001F33F", "label": "tiny floating plants", "say": "Tiny floating plants, too small to see: the producers of the sea. They make food from sunlight."},
                 {"pic": "\U0001F41F", "label": "small fish", "say": "A small fish eats the tiny plants. A herbivore, and prey."},
                 {"pic": "\U0001F420", "label": "bigger fish", "say": "A bigger fish eats the small fish. A carnivore: predator to the small fish, prey to the seal."},
                 {"pic": "\U0001F9AD", "label": "seal", "say": "A seal eats the bigger fish. A predator at the top of this chain."},
             ]},
             "Your food chain diagram: tiny plants, small fish, bigger fish, seal, with an arrow to each eater. Producer first, then consumers."),

        step("questions", "Energy check", "✅", "Energy check", ["4Bp.03", "4Be.03"],
             "Tap the answer.",
             explain(
                 ["Where energy comes from, and the words for eaters."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Where does a plant get its energy?", "☀️", "from light", ["from eating insects", "from the soil", "from water"], "Light, caught by the leaves."),
                 q("Where does a fox get its energy?", "\U0001F98A", "from eating other animals", ["from sunlight", "from the air"], "Animals eat for energy."),
                 q("An animal that eats only plants is...", "\U0001F407", "a herbivore", ["a carnivore", "an omnivore"], "Herb means plant."),
                 q("An animal that eats both plants and animals is...", "\U0001F43B", "an omnivore", ["a herbivore", "a carnivore"], "Omni means all."),
                 q("An animal that hunts others is called...", "\U0001F989", "a predator", ["prey", "a producer"], "The hunter."),
                 q("Why do you need to eat?", "\U0001F37D️", "for the energy to grow, move and stay healthy", ["to keep your teeth busy all day", "you do not need to eat at all"], "Food is your energy."),
             ]},
             "You know where energy for life comes from."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Bp.03", "4Be.03", "4TWSm.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does every living thing need to grow and move?", "⚡", "energy", ["a shell", "a nest"], "Energy for every action."),
                 q("Which of these is a producer?", "⛓️", "grass", ["a rabbit", "a fox", "a seal"], "Makes food from light."),
                 q("An elephant eats only plants. It is a...", "\U0001F418", "herbivore", ["carnivore", "omnivore"], "Big, and a plant eater."),
                 q("A bear eats berries and fish. It is a...", "\U0001F43B", "omnivore", ["herbivore", "carnivore"], "Both."),
                 q("In the chain seeds → mouse → owl, the mouse is the...", "\U0001F989", "prey", ["predator", "producer"], "Hunted by the owl. The arrow points to the eater."),
                 q("Can an animal be both predator and prey?", "\U0001F438", "yes, a frog eats flies and herons eat frogs", ["no, an animal is only ever one of them", "only fish can be both at once"], "Most middle links are both."),
                 q("What did the food chain you built show?", "\U0001F527", "who eats whom in grass, rabbit and fox", ["how big a real fox grows each year", "how fast a real rabbit can run away"], "A model of a relationship."),
                 q("Where did the fox's energy come from, in the very beginning?", "☀️", "the Sun, through the grass and the rabbit", ["the fox made it from nothing", "the soil, through the fox's feet"], "Light, then plant, then rabbit, then fox."),
                 q("In the chain grass → rabbit → fox, what would happen to the foxes if all the grass died?", "\U0001F914", "they would go hungry, because the rabbits would have nothing to eat", ["nothing, because foxes do not eat grass", "they would have more rabbits to eat"], "Every link needs the one before it. No grass, no rabbits, so no food for the foxes in this chain."),
             ]},
             "That is the whole lesson finished. You know where the energy for life comes from."),
    ],
}

LESSON["about"] = [
    "Say where plants get their energy and where animals get theirs.",
    "Sort consumers into herbivores, carnivores and omnivores.",
    "Say what a predator and prey are.",
    "Build a food chain as a model of who eats whom, and draw one as a diagram.",
]

LESSON["warmup"] = [
    q("What does a vaccine train your body to do?", "\U0001F489", "fight a germ before it makes you ill", ["grow taller", "run faster"], "From the last lesson: a vaccine trains the body in advance."),
    q("What does a plant need from the Sun?", "☀️", "light", ["sound", "wind"], "Plants need light to grow."),
]

LESSON["lecture"] = [
    part("⚡", "Energy for life",
         "Nothing lives without energy. Growing takes energy. Moving takes energy. Even staying warm takes energy. Every living thing has to get energy from somewhere."),
    part("☀️", "Light and food",
         "Plants get their energy from light. Their leaves catch sunlight and use it to make food, and the energy is stored in the plant. Animals cannot use light. They get their energy by eating plants, or by eating animals that ate plants."),
    part("\U0001F37D️", "Three kinds of eater",
         "A consumer that eats only plants is a herbivore: a rabbit, a horse, an elephant. One that eats only animals is a carnivore: a lion, an owl, a shark. One that eats both is an omnivore: a bear, a pig, a fox, and most people."),
    part("\U0001F989", "Predator and prey",
         "A predator hunts and eats other animals. Prey is the animal that gets eaten. An owl is a predator; a mouse is its prey. A frog is both: it hunts flies, and a heron hunts it."),
    part("\U0001F527", "A model of who eats whom",
         "A food chain drawn with arrows is a model. It shows a relationship: who eats whom, and which way the energy travels. Today you build one, and then take away the plant and see what a model can show you."),
]

LESSON["words"] = [
    word("energy", "⚡", "What every living thing needs to grow, move and stay healthy.",
         ["Food gives you energy.", "Plants get energy from light."]),
    word("herbivore", "\U0001F407", "An animal that eats only plants.",
         ["A rabbit is a herbivore.", "Elephants are herbivores."]),
    word("carnivore", "\U0001F981", "An animal that eats only other animals.",
         ["A lion is a carnivore.", "Sharks are carnivores."]),
    word("omnivore", "\U0001F43B", "An animal that eats both plants and animals.",
         ["A bear is an omnivore.", "Most people are omnivores."]),
    word("predator", "\U0001F989", "An animal that hunts and eats other animals.",
         ["The owl is a predator.", "A predator hunts its prey."]),
    word("prey", "\U0001F401", "An animal that is hunted and eaten by a predator.",
         ["The mouse is the owl's prey.", "Rabbits are prey to foxes."]),
    word("relationship", "\U0001F517", "The way two things are connected. A food chain shows who eats whom.",
         ["The model shows the relationship between the fox and the rabbit.", "Arrows show the relationship."]),
]

LESSON["home"] = [
    home("What did you eat?", "Paper and a pencil, your last meal",
         ["Write down everything you ate at your last meal.",
          "Next to each thing, write plant or animal.",
          "Decide: were you a herbivore, a carnivore or an omnivore at that meal?"],
         "Every bit of energy in it started as sunlight."),
    home("Predator watch", "A window or a garden, ten minutes",
         ["Watch for a bird, a cat, a spider or a beetle.",
          "For each one, ask: what does it hunt? What hunts it?",
          "Draw the chain with arrows."],
         "A spider is a predator of flies and prey to a bird. Both at once."),
    home("A food chain model", "Three cards, string, a pencil",
         ["Draw a plant, a herbivore that eats it, and a carnivore that eats that.",
          "Tie them in a line with string, plant first.",
          "Label each: producer, herbivore, carnivore, predator, prey."],
         "Your model shows the relationship. Real animals eat many things; the model leaves that out."),
]
