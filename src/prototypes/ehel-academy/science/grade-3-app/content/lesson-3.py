# -*- coding: utf-8 -*-
"""Lesson 3 - Animal Groups.

0097 Stage 3: 3Bs.02 the distinguishing features of fish, reptiles, mammals,
birds, amphibians and insects; with 3TWSc.01 (sort and classify), 3TWSc.05
(a secondary source), 3TWSm.01 (a diagram is a kind of model) and 3SIC.03.
"""
from _kit import explain, step, opt, q, part, word, home, icon

INSECT = [
    {"id": "head", "label": "head", "say": "The head, with the eyes and the mouth."},
    {"id": "thorax", "label": "thorax", "say": "The thorax, the middle part. All six legs join here."},
    {"id": "abdomen", "label": "abdomen", "say": "The abdomen, the back part, where the food goes."},
    {"id": "legs", "label": "six legs", "say": "Six legs. Every adult insect has six legs."},
    {"id": "wings", "label": "wings", "say": "Wings. Most insects have them, on the thorax."},
    {"id": "antennae", "label": "antennae", "say": "Two antennae, for feeling and smelling."},
]

LESSON = {
    "slug": "animal-groups",
    "title": "Animal Groups",
    "blurb": "Learn what marks out a fish, an amphibian, a reptile, a bird, a mammal and an insect, sort animals into their groups, look up the tricky ones, and label a diagram of an insect.",
    "steps": [
        step("explore", "Six groups of animals", "\U0001F43E", "Six groups", ["3Bs.02"],
             "Scientists put animals into groups by their features. Tap each group.",
             explain(
                 ["A feature is something an animal has or does. Groups are made from features."],
                 ["Fish: scales, fins, gills, live in water.", "Amphibians: smooth damp skin, start life in water.", "Reptiles: dry scales, and most lay eggs on land.",
                  "Birds: feathers, a beak, lay eggs.", "Mammals: fur or hair, feed their young milk.", "Insects: six legs, three body parts."],
                 ["Children think anything that swims is a fish.", "A whale is a mammal. A frog is an amphibian. Look at the features, not where it lives."],
                 ["Tap all six and say the key feature of each."]),
             {"items": [
                 {"pic": "\U0001F41F", "label": "fish", "sub": "scales, fins, gills", "say": "Fish have scales and fins, and they breathe through gills, so they live in water."},
                 {"pic": "\U0001F438", "label": "amphibians", "sub": "smooth damp skin", "say": "Amphibians have smooth, damp skin. They start life in water, as tadpoles, and later live on land too. Frogs, toads and newts."},
                 {"pic": "\U0001F98E", "label": "reptiles", "sub": "dry, scaly skin", "say": "Reptiles have dry, scaly skin, and most lay their eggs on land. Snakes, lizards, tortoises and crocodiles."},
                 {"pic": "\U0001F426", "label": "birds", "sub": "feathers, beak, eggs", "say": "Birds have feathers and a beak, and they lay eggs. Every bird has feathers, even the ones that cannot fly."},
                 {"pic": "\U0001F415", "label": "mammals", "sub": "fur or hair, milk", "say": "Mammals have fur or hair, and they feed their babies milk. Dogs, whales, bats, and you."},
                 {"pic": "\U0001F41C", "label": "insects", "sub": "six legs, three parts", "say": "Insects have six legs and a body in three parts: head, thorax and abdomen. Ants, bees, beetles and butterflies."},
             ], "need": 6,
              "then": {"ask": "A whale lives in the sea and has no scales. It feeds its baby milk. Which group?",
                       "opts": [opt("mammal", True), opt("fish", False), opt("amphibian", False)],
                       "why": "Milk for its young makes it a mammal, whatever the sea says."}},
             "Fish, amphibians, reptiles, birds, mammals, insects."),

        step("sort", "Which group?", "\U0001F5C2️", "Group sorter", ["3Bs.02", "3TWSc.01"],
             "Look at the features. Which group does this animal belong to? Tap the bin.",
             explain(
                 ["Ask about the features: skin, legs, how it breathes, how it feeds its young."],
                 ["A salmon: scales and gills. Fish.", "A frog: smooth damp skin. Amphibian.", "A tortoise: dry scales, eggs on land. Reptile.",
                  "A penguin: feathers. Bird, even though it swims.", "A bat: fur and milk. Mammal, even though it flies.", "A bee: six legs. Insect."],
                 ["Children sort by where the animal lives or how it moves.", "Sort by features. A bat flies but it is a mammal."],
                 ["Look at the skin and the legs, then tap."]),
             {"ask": "Which group?",
              "bins": [{"id": "fish", "label": "Fish", "pic": "\U0001F420"}, {"id": "amph", "label": "Amphibians", "pic": icon("tadpole")}, {"id": "rept", "label": "Reptiles", "pic": "\U0001F98E"},
                       {"id": "bird", "label": "Birds", "pic": "\U0001F426"}, {"id": "mammal", "label": "Mammals", "pic": "\U0001F415"}, {"id": "insect", "label": "Insects", "pic": "\U0001F41C"}],
              "items": [
                  {"pic": "\U0001F41F", "label": "salmon", "bin": "fish", "why": "Scales, fins and gills. A fish."},
                  {"pic": "\U0001F438", "label": "frog", "bin": "amph", "why": "Smooth damp skin, and it started as a tadpole. An amphibian."},
                  {"pic": "\U0001F40D", "label": "snake", "bin": "rept", "why": "Dry, scaly skin. A reptile."},
                  {"pic": "\U0001F985", "label": "eagle", "bin": "bird", "why": "Feathers and a beak. A bird."},
                  {"pic": "\U0001F40B", "label": "whale", "bin": "mammal", "why": "No scales, and it feeds its calf milk. A mammal that lives in the sea."},
                  {"pic": "\U0001F41D", "label": "bee", "bin": "insect", "why": "Six legs, three body parts, wings. An insect."},
                  {"pic": "\U0001F988", "label": "shark", "bin": "fish", "why": "Fins, and gills to breathe under water. A fish, a very big one."},
                  {"pic": "\U0001F422", "label": "tortoise", "bin": "rept", "why": "Dry scaly skin and eggs on land. A reptile."},
                  {"pic": "\U0001F427", "label": "penguin", "bin": "bird", "why": "Feathers and a beak. A bird that swims instead of flying."},
                  {"pic": "\U0001F987", "label": "bat", "bin": "mammal", "why": "Fur, and milk for its young. A mammal that flies."},
              ]},
             "Sort by features, not by where it lives or how it moves."),

        step("lookup", "Look it up: reptile or amphibian?", "\U0001F4DA", "Fact finder", ["3TWSc.05", "3Bs.02"],
             "Some groups are easy to mix up. Read the fact card, then answer from it.",
             explain(
                 ["A secondary source is information somebody else found out and wrote down.", "A fact card, a book, a trusted website."],
                 ["Read the whole card first.", "Then find the answer to each question in the card."],
                 ["Children answer from memory and get it wrong.", "The answer is on the card. Find it."],
                 ["Read, then tap."]),
             {"source": {"title": "Reptiles and amphibians: what is the difference?",
                         "lines": ["Reptiles have <b>dry, scaly</b> skin. Amphibians have <b>smooth, damp</b> skin with no scales.",
                                   "Most reptiles lay eggs with <b>tough shells</b> on <b>land</b>. Amphibians lay soft eggs in <b>water</b>, like frogspawn.",
                                   "A baby reptile looks like a small adult. A baby amphibian is a <b>tadpole</b> that changes shape as it grows.",
                                   "A <b>newt</b> looks like a lizard but has smooth damp skin and starts life in water, so it is an amphibian.",
                                   "A <b>crocodile</b> spends its days in rivers but has dry scales and lays its eggs on land, so it is a reptile."]},
              "items": [
                  {"ask": "What kind of skin does a reptile have?", "opts": [opt("dry and scaly", True), opt("smooth and damp", False), opt("feathery", False)], "why": "The card says reptiles have dry, scaly skin."},
                  {"ask": "Where does an amphibian lay its eggs?", "opts": [opt("in water", True), opt("on land", False), opt("in a nest in a tree", False)], "why": "The card says amphibians lay soft eggs in water, like frogspawn."},
                  {"ask": "A newt looks like a lizard. Which group is it?", "opts": [opt("amphibian", True), opt("reptile", False), opt("fish", False)], "why": "The card says a newt has smooth damp skin and starts life in water: an amphibian."},
                  {"ask": "Why is a crocodile a reptile, even though it lives in rivers?", "opts": [opt("dry scales, and eggs laid on land", True), opt("it can swim", False), opt("it is big", False)], "why": "The card gives both features: dry scales, eggs on land."},
              ]},
             "You found every answer in the card. That is using a secondary source."),

        step("diagram", "Label a diagram of an insect", "✏️", "Insect diagram", ["3TWSm.01", "3Bs.02"],
             "Label the diagram. Tap a label, then tap the part of the beetle it belongs to.",
             explain(
                 ["A diagram is a drawing with labels that name the parts.", "A diagram is one kind of model in science. You are going to label one."],
                 ["Tap the label that says head, then tap the head.", "Do the same for the thorax, the abdomen, the legs, the wings and the antennae.",
                  "When every label is on, your diagram is finished."],
                 ["Children label the thorax as the body.", "The body has three parts, and the thorax is the middle one, where the legs join."],
                 ["Tap a label, then the part."]),
             {"figure": "insect", "ask": "Tap a label, then tap where it goes.", "parts": INSECT},
             "Head, thorax, abdomen, six legs, wings, antennae. That is a labelled diagram."),

        step("questions", "Which group?", "✅", "Group check", ["3Bs.02"],
             "Tap the answer.",
             explain(
                 ["Six groups, six sets of features."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which group feeds its young milk?", "\U0001F95B", "mammals", ["birds", "reptiles", "fish"], "Milk is the mammal feature."),
                 q("Which group has feathers?", "\U0001FAB6", "birds", ["mammals", "insects"], "Every bird has feathers."),
                 q("How many legs does an adult insect have?", "\U0001F41C", "six", ["four", "eight"], "Every adult insect has six legs. Spiders have eight, so they are not insects."),
                 q("Which group breathes through gills all its life?", "\U0001F41F", "fish", ["amphibians", "reptiles"], "Gills are how fish breathe."),
                 q("A frog's smooth damp skin makes it a...", "\U0001F438", "amphibian", ["reptile", "fish"], "Smooth damp skin, and a tadpole start."),
                 q("A snake's dry scales make it a...", "\U0001F40D", "reptile", ["fish", "amphibian"], "Dry, scaly skin."),
             ]},
             "You can put animals in their groups."),

        step("context", "People who work with animal groups", "\U0001F469\U0001F3FE‍\U0001F52C", "Animal jobs", ["3SIC.03"],
             "Knowing the groups is part of many jobs. Tap each one.",
             explain(
                 ["Everyone uses science, and these people use animal science all day."],
                 ["A vet needs to know a reptile from an amphibian: they need different care.", "A zookeeper feeds each group differently.", "A marine biologist studies fish and sea mammals.", "A park ranger counts and protects the animals in a habitat."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F415", "label": "vet", "say": "A vet treats every group. A tortoise needs a warm lamp; a frog needs damp skin. Knowing the group tells the vet what to do."},
                 {"pic": "\U0001F418", "label": "zookeeper", "say": "A zookeeper feeds, cleans and cares for animals from every group, each in the right way."},
                 {"pic": "\U0001F93F", "label": "marine biologist", "say": "A marine biologist studies the sea: fish, and the mammals that live there, like whales and dolphins."},
                 {"pic": "\U0001F333", "label": "park ranger", "say": "A park ranger counts the birds, mammals, reptiles and insects in a park and protects their homes."},
             ], "need": 4,
              "then": {"ask": "Why does a vet need to know which group an animal belongs to?",
                       "opts": [opt("Each group needs different care", True), opt("To know its name", False), opt("It does not matter", False)],
                       "why": "A reptile needs warmth; an amphibian needs damp skin. The group tells you the care."}},
             "Vets, zookeepers, marine biologists and rangers use animal groups every day."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Bs.02", "3TWSc.01", "3TWSm.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A bat flies. Which group is it?", "\U0001F987", "mammal: it has fur and feeds its young milk", ["bird: it flies", "insect: it has wings"], "Features, not movement."),
                 q("A penguin swims. Which group is it?", "\U0001F427", "bird: it has feathers and a beak", ["fish: it swims", "mammal: it is warm"], "Feathers make it a bird."),
                 q("Which group starts life in water and changes shape as it grows?", "\U0001F438", "amphibians", ["reptiles", "mammals"], "Tadpole to frog."),
                 q("The three parts of an insect's body are...", "\U0001F41C", "head, thorax, abdomen", ["head, tummy, tail", "top, middle, bottom"], "Head, thorax, abdomen."),
                 q("A spider has eight legs. Is it an insect?", "\U0001F577️", "no, insects have six legs", ["yes", "only small ones"], "Eight legs: not an insect."),
                 q("Where do most reptiles lay their eggs?", "\U0001F95A", "on land", ["in water", "in the air"], "Tough-shelled eggs on land."),
                 q("What is a diagram?", "✏️", "a drawing with labels naming the parts", ["a photograph", "a story"], "You labelled one of a beetle. A diagram is a kind of model."),
                 q("Where did you find the answers about newts and crocodiles?", "\U0001F4DA", "in the fact card, a secondary source", ["by guessing", "by asking a newt"], "Reading a source for an answer is research."),
                 q("A dolphin lives in the sea and feeds its baby milk. Why is it not a fish?", "\U0001F42C", "feeding its young milk makes it a mammal", ["it is too big to be a fish", "it lives in the sea"], "Group by features, not by where it lives. Milk makes a dolphin a mammal."),
             ]},
             "That is the whole lesson finished. You can sort any animal into its group."),
    ],
}

LESSON["about"] = [
    "Name the six groups of animals and one feature of each.",
    "Sort animals into their groups by their features, not by where they live.",
    "Find answers in a fact card.",
    "Label a diagram of an insect.",
]

LESSON["warmup"] = [
    q("Which part of a flowering plant makes seeds?", "\U0001F33C", "the flower", ["the roots", "the stem"], "The flower's job is making seeds."),
    q("Which animal is covered in fur?", "\U0001F415", "a dog", ["a goldfish", "a snake"], "A dog has fur. A fish has scales, and so does a snake."),
]

LESSON["lecture"] = [
    part("\U0001F43E", "Groups from features",
         "Scientists put animals into groups by their features. A feature is something the animal has: scales, feathers, fur, six legs. Not where it lives. Not how it moves."),
    part("\U0001F41F", "Fish and amphibians",
         "Fish have scales, fins and gills, and live in water all their lives. Amphibians have smooth damp skin. They start life in water as tadpoles and come onto land when they are grown."),
    part("\U0001F98E", "Reptiles and birds",
         "Reptiles have dry, scaly skin, and most lay tough eggs on land: snakes, lizards, tortoises. Birds have feathers and a beak and lay eggs. Every bird has feathers, even a penguin."),
    part("\U0001F415", "Mammals and insects",
         "Mammals have fur or hair and feed their babies milk. Dogs, whales, bats and you. Insects have six legs and a body in three parts: head, thorax, abdomen. Ants, bees and beetles."),
    part("✏️", "Look closely, then draw",
         "To put an animal in its group, look at its features. Today you will sort ten animals, look up the tricky ones in a fact card, and label a diagram of a beetle."),
]

LESSON["words"] = [
    word("feature", "\U0001F50D", "Something an animal has, like scales, fur or six legs, that helps put it in a group.",
         ["Feathers are a feature of birds.", "Look at the features, not where it lives."]),
    word("amphibian", "\U0001F438", "An animal with smooth damp skin that starts life in water.",
         ["A frog is an amphibian.", "A newt is an amphibian, not a lizard."]),
    word("reptile", "\U0001F98E", "An animal with dry scaly skin. Most reptiles lay eggs on land.",
         ["A snake is a reptile.", "A tortoise is a reptile with a shell."]),
    word("mammal", "\U0001F415", "An animal with fur or hair that feeds its babies milk.",
         ["A whale is a mammal.", "You are a mammal too."]),
    word("insect", "\U0001F41C", "An animal with six legs and a body in three parts.",
         ["A bee is an insect.", "A spider is not an insect: it has eight legs."]),
    word("thorax", "\U0001FAB2", "The middle part of an insect's body, where the legs and wings join.",
         ["All six legs join the thorax.", "Label the thorax on the diagram."]),
    word("secondary source", "\U0001F4DA", "Information somebody else found out and wrote down, like a fact card or a book.",
         ["I found the answer in a secondary source.", "A fact card is a secondary source."]),
]

LESSON["home"] = [
    home("Minibeast groups", "A garden or park, a grown-up, a magnifying glass, paper",
         ["With a grown-up, find five small creatures under stones and leaves. A grown-up lifts each stone and puts it back. Look, do not touch. Wash your hands afterwards.",
          "Count the legs on each one.",
          "Say which are insects (six legs) and which are not."],
         "Woodlice have fourteen legs and spiders eight. Neither is an insect."),
    home("Group the pets", "Paper and a pencil",
         ["Write down every pet you know or have seen: at home, in your street, at a friend's or in a book.",
          "Next to each, write its group and the feature that tells you.",
          "Find one animal from a group nobody has as a pet."],
         "Most pets are mammals. Which groups are missing?"),
    home("Draw a diagram", "Any animal picture, paper, a pencil, a ruler",
         ["Draw the animal simply.",
          "Draw a straight line from each part to the edge of the paper.",
          "Write the name of the part at the end of each line."],
         "A diagram names the parts. Did you label at least four?"),
]
