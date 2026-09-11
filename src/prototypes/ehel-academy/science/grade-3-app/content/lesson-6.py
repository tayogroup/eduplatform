# -*- coding: utf-8 -*-
"""Lesson 6 - Food Chains.

0097 Stage 3: 3Be.01 simple food chains, where plants are producers and
animals are consumers; 3TWSm.02 make and use a physical model; 3TWSm.03 a
diagram; with 3Bp.02, 3TWSc.01 and 3SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "food-chains",
    "title": "Food Chains",
    "blurb": "See where every animal's food really comes from, build a food chain and break it, put a pond chain in order, sort producers from consumers, and find out how what people do can break a chain.",
    "steps": [
        step("demo", "Who eats whom?", "\U0001F33F", "Producers first", ["3Be.01", "3Bp.02", "3TWSm.02"],
             "Press <b>Next</b> to follow the food from the grass to the fox. Then make a food chain you can hold, now: you need three cards, a pencil and some string.",
             explain(
                 ["A food chain shows who eats whom.", "It always starts with a plant, because plants make their own food from sunlight."],
                 ["Grass makes its food from sunlight: a producer.", "A rabbit eats the grass: a consumer.", "A fox eats the rabbit: a consumer too.", "The arrow means is eaten by.", "Then make the chain now, with three cards on a string, and use it."],
                 ["Children draw the arrow the wrong way.", "The arrow points from the food to the eater: grass, arrow, rabbit."],
                 ["Press Next, follow the arrows, then make the chain with cards as you go."]),
             {"frames": [
                 {"pic": "\U0001F33F", "cap": "Grass makes its own food from sunlight. It is a <b>producer</b>.", "say": "Grass makes its own food from sunlight, water and air. It does not eat anything. It is a producer."},
                 {"pic": "\U0001F407", "cap": "A rabbit eats the grass. It is a <b>consumer</b>.", "say": "A rabbit cannot make food. It eats the grass. An animal that eats is a consumer."},
                 {"pic": "\U0001F98A", "cap": "A fox eats the rabbit. Another <b>consumer</b>.", "say": "A fox eats the rabbit. The fox is a consumer too."},
                 {"pic": "➡️", "cap": "Grass &rarr; rabbit &rarr; fox. The arrow means <b>is eaten by</b>.", "say": "Grass, arrow, rabbit, arrow, fox. The arrow means is eaten by. It points from the food to the eater."},
                 {"pic": "☀️", "cap": "Every chain starts with a plant, and every plant's food starts with the Sun.", "say": "Every food chain starts with a plant, and the plant's food comes from the Sun. So the fox's energy came from the Sun, through the grass and the rabbit."},
                 {"pic": "\U0001F517", "cap": "Make a <b>physical model</b> now. Draw grass, a rabbit and a fox on three cards. Tie the rabbit under the grass, and the fox under the rabbit. Hold the grass card up.", "say": "Now make a food chain you can hold. Draw grass, a rabbit and a fox on three cards. Tie the rabbit card under the grass card, and the fox card under the rabbit card. Hold up the grass card. The whole chain hangs from it. That is a physical model."},
                 {"pic": "\U0001F6AB", "cap": "Use the model: let go of the grass card. The whole chain <b>falls</b>. Without the grass, the rabbit and the fox have nothing to eat.", "say": "Use your model. Let go of the grass card, and watch. The whole chain falls. Without the grass, the rabbit has nothing to eat, so the fox has nothing to eat either. Every link needs the one before it."},
             ]},
             "Producer first, then consumers. The arrow means is eaten by."),

        step("build", "Build a food chain", "\U0001F527", "Chain builder", ["3Be.01", "3TWSm.03"],
             "Make a food chain diagram on the screen: tap the producer and the consumers. Then break it.",
             explain(
                 ["A food chain diagram is a model of who eats whom.", "Build it, then take the plant away and see what happens."],
                 ["Grass: the producer.", "The rabbit, which eats the grass.", "Then the fox, which eats the rabbit.", "Then take the grass away."],
                 ["Children think the fox is the most important.", "Take the grass away and the fox starves. The producer is the start of everything."],
                 ["Tap the three parts, then break the chain."]),
             {"sim": "foodChain",
              "parts": [
                  {"id": "grass", "label": "grass", "pic": "\U0001F33F"},
                  {"id": "rabbit", "label": "rabbit", "pic": "\U0001F407"},
                  {"id": "fox", "label": "fox", "pic": "\U0001F98A"},
              ]},
             "A chain needs every link. Take the producer away and the whole chain falls."),

        step("order", "A pond food chain", "\U0001F438", "Pond chain", ["3Be.01"],
             "Put this pond food chain in order. Tap the producer first.",
             explain(
                 ["A pond has its own food chain, and it starts with a plant too."],
                 ["Pondweed makes food from sunlight.", "A water snail eats the pondweed.", "A frog eats the snail.", "A heron eats the frog."],
                 ["Children start with the biggest animal.", "Start with the plant. Always."],
                 ["Tap the producer, then who eats it, then who eats that."]),
             {"items": [
                 {"pic": "\U0001F33F", "label": "pondweed", "say": "Pondweed: the producer. It makes its food from sunlight."},
                 {"pic": "\U0001F40C", "label": "water snail", "say": "A water snail eats the pondweed."},
                 {"pic": "\U0001F438", "label": "frog", "say": "A frog eats the snail."},
                 {"pic": "\U0001F9A2", "label": "heron", "say": "A heron eats the frog. Four links, one chain."},
             ]},
             "Pondweed, snail, frog, heron. Producer first."),

        step("sort", "Producer, or consumer?", "\U0001F5C2️", "Producer sort", ["3Be.01", "3TWSc.01"],
             "Does this living thing <b>make</b> its own food, or <b>eat</b>? Tap the bin.",
             explain(
                 ["Plants are producers. Animals are consumers.", "That is the whole rule."],
                 ["Grass, an oak tree, seagrass, a dandelion: producers.", "A rabbit, an owl, a fish, a cow: consumers."],
                 ["Children think a cow is a producer because it makes milk.", "A cow eats grass. Eating makes it a consumer."],
                 ["Plant or animal? Then tap."]),
             {"ask": "Producer, or consumer?",
              "bins": [{"id": "producer", "label": "Producer", "pic": "\U0001F331"}, {"id": "consumer", "label": "Consumer", "pic": "\U0001F37D️"}],
              "items": [
                  {"pic": "\U0001F33F", "label": "grass", "bin": "producer", "why": "Grass makes its own food from sunlight."},
                  {"pic": "\U0001F407", "label": "rabbit", "bin": "consumer", "why": "A rabbit eats plants."},
                  {"pic": "\U0001F333", "label": "oak tree", "bin": "producer", "why": "A tree is a plant. It makes its own food."},
                  {"pic": "\U0001F989", "label": "owl", "bin": "consumer", "why": "An owl eats mice. A consumer."},
                  {"pic": "\U0001F33F", "label": "seagrass", "bin": "producer", "why": "Seagrass is a flowering plant that grows under the sea. It makes its food from sunlight."},
                  {"pic": "\U0001F41F", "label": "fish", "bin": "consumer", "why": "A fish eats. A consumer."},
                  {"pic": "\U0001F404", "label": "cow", "bin": "consumer", "why": "A cow eats grass. Making milk does not make it a producer."},
                  {"pic": "\U0001F33C", "label": "dandelion", "bin": "producer", "why": "A dandelion is a plant. Producer."},
              ]},
             "Plants produce. Animals consume."),

        step("context", "Breaking the chain", "\U0001F6A7", "Chains and us", ["3SIC.04", "3Be.01"],
             "What people do can break a food chain, or mend one. Tap each picture.",
             explain(
                 ["Science helps us see what our actions do to living things."],
                 ["Spray the weeds and the caterpillars have nothing to eat, so the birds go hungry.", "Pollute the pond and the pondweed dies, and the whole pond chain with it.",
                  "Plant a hedge and you give the chain a new start.", "Leave a patch of grass long and the insects come back."],
                 [],
                 ["Tap each one and follow the chain."]),
             {"items": [
                 {"pic": "\U0001F9EA", "label": "spraying weedkiller", "say": "Weedkiller kills the plants. No plants, no caterpillars. No caterpillars, no food for the birds that eat them. One spray, three links gone."},
                 {"pic": "\U0001F6E2️", "label": "oil in the pond", "say": "Oil in the pond blocks the light and the pondweed dies. Then the snails, then the frogs, then the heron has nothing to eat."},
                 {"pic": "\U0001F333", "label": "planting a hedge", "say": "Plant a hedge and you plant a producer. Insects come, then birds, then the animals that eat birds. A new chain starts."},
                 {"pic": "\U0001F33E", "label": "leaving grass long", "say": "Leave a patch of grass long and the insects come back, and everything that eats them."},
             ], "need": 4,
              "then": {"ask": "Why does killing the plants hurt the birds that eat caterpillars?",
                       "opts": [opt("The caterpillars the birds eat need the plants for food", True), opt("Birds drink from plants", False), opt("It does not hurt them", False)],
                       "why": "Every link depends on the one before it. Break the producer and the whole chain breaks."}},
             "What we do to the plants reaches every animal in the chain."),

        step("questions", "Chain check", "✅", "Chain check", ["3Be.01"],
             "Tap the answer.",
             explain(
                 ["Producers, consumers, and which way the arrow points."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What does a food chain always start with?", "\U0001F33F", "a plant", ["a fox", "a rabbit", "water"], "A producer, which makes its own food."),
                 q("What does the arrow in a food chain mean?", "➡️", "is eaten by", ["is bigger than", "likes"], "It points from the food to the eater."),
                 q("What is an animal in a food chain called?", "\U0001F407", "a consumer", ["a producer", "a plant"], "Animals consume: they eat."),
                 q("Where does the grass get its food?", "☀️", "it makes it from sunlight", ["it eats insects", "the rabbit gives it some"], "Producers make food from light."),
                 q("Take the grass out of grass, rabbit, fox. Who is affected?", "\U0001F6A7", "the rabbit and the fox", ["only the rabbit", "nobody"], "No grass, no rabbits, no food for the fox."),
             ]},
             "You know how a food chain works."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Be.01", "3TWSm.03", "3SIC.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which is a producer?", "\U0001F33F", "seagrass", ["a fish", "a heron", "a snail"], "Seagrass is a plant."),
                 q("Which is a consumer?", "\U0001F989", "an owl", ["grass", "an oak tree", "a dandelion"], "Owls eat."),
                 q("Pondweed → snail → frog → heron. Who eats the snail?", "\U0001F438", "the frog", ["the heron", "the pondweed"], "The arrow from snail points to frog."),
                 q("Where does the energy in a food chain come from at the very start?", "☀️", "the Sun", ["the fox", "the soil"], "Plants make food from sunlight."),
                 q("The food chain you built on the screen was...", "\U0001F527", "a model of who eats whom", ["a real rabbit", "a picture of a garden"], "A model shows the idea."),
                 q("A cow makes milk. Is it a producer?", "\U0001F404", "no, it eats grass, so it is a consumer", ["yes", "only in summer"], "Producers make food from sunlight. Cows eat."),
                 q("Oil spills into a pond and the pondweed dies. What happens to the heron?", "\U0001F9A2", "it runs out of food, because its whole chain started with the pondweed", ["nothing", "it eats the oil"], "Break the producer, break the chain."),
                 q("Which way does the arrow go?", "➡️", "from the food to the animal that eats it", ["from the eater to the food", "any way you like"], "Grass → rabbit: grass is eaten by rabbit."),
                 q("Why does every food chain start with a plant?", "\U0001F331", "only plants can make their own food, from sunlight", ["plants are the smallest living things", "plants are always green"], "Animals have to eat. A plant makes its own food, so the food in every chain starts there."),
                 q("In grass \u2192 rabbit \u2192 fox, what would happen to the grass if all the rabbits went away?", "\U0001F407", "more grass would grow, because nothing would eat it", ["the grass would die, because rabbits feed it", "the grass would turn into a consumer"], "The rabbit eats the grass. With no rabbits, the grass is left alone."),
                 q("Leaf \u2192 caterpillar \u2192 bird \u2192 cat. If more cats come and eat lots of birds, what happens to the caterpillars?", "\U0001F408", "there will be more caterpillars, because fewer birds eat them", ["there will be fewer caterpillars, because cats eat them", "nothing, because cats do not eat caterpillars"], "Fewer birds means fewer caterpillars get eaten."),
             ]},
             "That is the whole lesson finished. You know who eats whom."),
    ],
}

LESSON["about"] = [
    "Say what a producer and a consumer are.",
    "Build a food chain and say what happens when a link is taken away.",
    "Put a food chain in order, producer first, with the arrows the right way.",
    "Say how what people do can break a chain or start one.",
]

LESSON["warmup"] = [
    q("Which organ breaks food down?", "\U0001F372", "the stomach", ["the lungs", "the brain"], "The stomach churns food and breaks it down."),
    q("What does a leaf use to make a plant's food?", "\U0001F343", "sunlight", ["moonlight", "stones"], "Leaves catch sunlight and use it to make the plant's food."),
]

LESSON["lecture"] = [
    part("\U0001F33F", "Producers",
         "A plant does not eat. It makes its own food from sunlight, water and air. Because it produces food, we call it a producer. Every food chain starts with one."),
    part("\U0001F407", "Consumers",
         "An animal cannot make food. It has to eat. A rabbit eats grass. A fox eats the rabbit. An animal that eats is a consumer."),
    part("➡️", "The arrow",
         "We draw a food chain with arrows. Grass, arrow, rabbit, arrow, fox. The arrow means is eaten by. It points from the food to the animal that eats it."),
    part("\U0001F6A7", "Breaking a link",
         "Take the grass away and the rabbits have nothing to eat. Then the fox has nothing to eat. Every link depends on the one before it, and the whole chain depends on the plant."),
    part("\U0001F333", "Chains and people",
         "Spray the weeds, and the insects and then the birds go hungry. Plant a hedge, and a whole new chain begins. Science shows us what our actions do to living things."),
]

LESSON["words"] = [
    word("food chain", "➡️", "A diagram showing who eats whom, starting with a plant.",
         ["Grass, rabbit, fox is a food chain.", "Every food chain starts with a plant."]),
    word("producer", "\U0001F33F", "A plant that makes its own food from sunlight.",
         ["Grass is a producer.", "Seagrass is a producer in the sea."]),
    word("consumer", "\U0001F407", "An animal that eats plants or other animals.",
         ["A rabbit is a consumer.", "A fox is a consumer that eats other consumers."]),
    word("energy", "☀️", "What living things need to live and move. It comes from food, and at the start, from the Sun.",
         ["The fox's energy came from the grass, through the rabbit.", "Plants get their energy from sunlight."]),
    word("link", "\U0001F517", "One living thing in a food chain.",
         ["The rabbit is the middle link.", "Take a link away and the chain breaks."]),
    word("pondweed", "\U0001F33F", "A plant that grows in ponds. The producer of the pond chain.",
         ["Snails eat pondweed.", "Pondweed makes its food from sunlight."]),
    word("heron", "\U0001F9A2", "A tall grey bird that eats frogs and fish.",
         ["The heron is the last link in the pond chain.", "A heron stands very still to hunt."]),
]

LESSON["home"] = [
    home("A garden food chain", "A garden or park, a grown-up, a magnifying glass, paper",
         ["With a grown-up, find a plant with a hole nibbled in a leaf.",
          "Look for what nibbled it: a caterpillar, a snail, an aphid.",
          "Think about what eats that animal, and draw the chain with arrows."],
         "Plant, then the nibbler, then the bird. The arrow means is eaten by."),
    home("Chain cards", "Old cards or paper, a pencil, string",
         ["Draw a plant, a small animal that eats it, and a bigger animal that eats that, one per card.",
          "Tie them in a row with string, plant first.",
          "Take the plant card off. Which cards now have nothing to eat?"],
         "A physical model of a food chain. Every link needs the one before it."),
    home("What we do", "A walk in your street with a grown-up, paper",
         ["Find one thing people have done that helps the plants and animals: a hedge, a tree, a pond.",
          "Find one thing that harms them: litter, a concreted garden.",
          "Say which food chain each one touches."],
         "Every plant is the start of a chain."),
]
