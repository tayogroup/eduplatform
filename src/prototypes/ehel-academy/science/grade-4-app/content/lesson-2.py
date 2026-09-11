# -*- coding: utf-8 -*-
"""Lesson 2 - Backbone or Not?

0097 Stage 4: 4Bs.05 vertebrates have a backbone, invertebrates do not;
4Bs.04 some animals have an exoskeleton; 4TWSc.02 use a key to identify
living things; with 4TWSc.01 and 4TWSc.07.
"""
from _kit import explain, step, opt, q, part, word, home, icon

KEY = [
    {"id": "legs", "q": "Does it have legs?", "yes": "six", "no": "shell"},
    {"id": "six", "q": "Does it have exactly six legs?", "yes": "wings", "no": "eight"},
    {"id": "wings", "q": "Does it have wings?", "yes": "=butterfly", "no": "=ant"},
    {"id": "eight", "q": "Does it have exactly eight legs?", "yes": "=spider", "no": "=woodlouse"},
    {"id": "shell", "q": "Does it have a shell?", "yes": "=snail", "no": "=worm"},
]

LESSON = {
    "slug": "backbone-or-not",
    "title": "Backbone or Not?",
    "blurb": "Sort animals by whether they have a backbone, meet the animals that wear their skeleton on the outside, and use a branching key to identify six minibeasts one question at a time.",
    "steps": [
        step("explore", "Inside, outside, or no skeleton", "\U0001F9B4", "Skeleton kinds", ["4Bs.05", "4Bs.04"],
             "Not every animal has a skeleton like yours. Tap each kind.",
             explain(
                 ["Animals with a backbone are vertebrates. Animals without are invertebrates.", "Some invertebrates have a hard skeleton on the outside, covering the whole body, with joints so it can bend: an exoskeleton."],
                 ["A cat, a bird, a fish, a frog, a snake and you: backbone inside. Vertebrates.", "A worm, a slug, a jellyfish: no backbone at all.", "An insect, a crab, a spider: a hard, jointed case over the whole body. An exoskeleton."],
                 ["Children think a snail's shell is a backbone, or an exoskeleton.", "A snail has no bones at all. Its shell is a house on its back: its soft body comes out of it, so it does not cover the whole body. A snail is a soft invertebrate that carries a shell."],
                 ["Tap all three."]),
             {"items": [
                 {"pic": "\U0001F415", "label": "vertebrate", "sub": "a backbone inside", "say": "A vertebrate has a backbone, a spine of small bones inside its body. Mammals, birds, fish, reptiles and amphibians are all vertebrates. So are you."},
                 {"pic": "\U0001FAB1", "label": "soft body", "sub": "no backbone, no hard skeleton", "say": "A soft-bodied invertebrate has no backbone and no hard skeleton. A worm, a slug, a jellyfish, an octopus. Most of the animals in the world are invertebrates."},
                 {"pic": "\U0001F980", "label": "exoskeleton", "sub": "a skeleton on the outside", "say": "Some invertebrates have an exoskeleton: a hard case covering the whole outside of the body, with joints so it can bend. Insects, crabs, spiders and woodlice. It protects them, and their muscles pull on it from inside. A snail's shell is not one: the snail's soft body comes out of it."},
             ], "need": 3,
              "then": {"ask": "A crab has a hard shell over its whole body and no bones inside. What is it?",
                       "opts": [opt("an invertebrate with an exoskeleton", True), opt("a vertebrate", False), opt("a fish", False)],
                       "why": "No backbone makes it an invertebrate; the hard outer case is an exoskeleton."}},
             "Vertebrates have a backbone. Invertebrates do not. Some wear a skeleton outside."),

        step("sort", "Vertebrate, or invertebrate?", "\U0001F5C2️", "Backbone sort", ["4Bs.05", "4TWSc.01"],
             "Does this animal have a <b>backbone</b>? Tap the bin.",
             explain(
                 ["Ask: is there a spine of bones inside it?"],
                 ["A dog, a shark, a frog, a lizard, a parrot: yes.", "A snail, a spider, a jellyfish, a bee, an earthworm: no."],
                 ["Children think big means vertebrate.", "A giant squid is an invertebrate. Size is not the test."],
                 ["Bones inside, or not? Then tap."]),
             {"ask": "Vertebrate, or invertebrate?",
              "bins": [{"id": "vert", "label": "Vertebrate", "pic": "\U0001F9B4"}, {"id": "invert", "label": "Invertebrate", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F415", "label": "dog", "bin": "vert", "why": "A dog has a spine. Feel one along its back."},
                  {"pic": "\U0001F40C", "label": "snail", "bin": "invert", "why": "A snail has no bones. It is a soft animal that carries a shell on its back."},
                  {"pic": "\U0001F988", "label": "shark", "bin": "vert", "why": "A shark has a backbone, though it is bendy rather than hard bone."},
                  {"pic": "\U0001F577️", "label": "spider", "bin": "invert", "why": "A spider has an exoskeleton and no backbone."},
                  {"pic": "\U0001F438", "label": "frog", "bin": "vert", "why": "A frog is an amphibian, a vertebrate."},
                  {"pic": "\U0001FABC", "label": "jellyfish", "bin": "invert", "why": "A jellyfish has no bones at all."},
                  {"pic": "\U0001F98E", "label": "lizard", "bin": "vert", "why": "A lizard is a reptile with a spine."},
                  {"pic": "\U0001F41D", "label": "bee", "bin": "invert", "why": "A bee is an insect: an exoskeleton, no backbone."},
                  {"pic": "\U0001F99C", "label": "parrot", "bin": "vert", "why": "A bird has a backbone."},
                  {"pic": "\U0001FAB1", "label": "earthworm", "bin": "invert", "why": "A worm has no bones and no hard case either."},
              ]},
             "Backbone inside: vertebrate. None: invertebrate."),

        step("key", "Use a key", "\U0001F511", "Key user", ["4TWSc.02", "4TWSc.01"],
             "A key identifies a creature by asking yes-or-no questions. Follow it for each minibeast.",
             explain(
                 ["A key is a set of questions. Each answer sends you to the next question, until the key names the creature."],
                 ["Does it have legs? Yes: how many? No: does it have a shell?", "Answer honestly from what you see, and the key does the identifying."],
                 ["Children answer what they think the creature is, not what they see.", "Look at the picture. Count the legs."],
                 ["Answer each question about the creature shown."]),
             {"ask": "Follow the key. Answer each question about this creature.",
              "nodes": KEY,
              "items": [
                  {"pic": "\U0001F98B", "label": "a creature with six legs and wings", "answer": "butterfly", "facts": {"legs": True, "six": True, "wings": True}, "why": "Legs, six of them, and wings: the key says butterfly."},
                  {"pic": "\U0001F41C", "label": "a creature with six legs and no wings", "answer": "ant", "facts": {"legs": True, "six": True, "wings": False}, "why": "Six legs, no wings: an ant."},
                  {"pic": "\U0001F577️", "label": "a creature with eight legs", "answer": "spider", "facts": {"legs": True, "six": False, "eight": True}, "why": "Eight legs: a spider, which is not an insect."},
                  {"pic": "\U0001F40C", "label": "a creature with no legs and a shell", "answer": "snail", "facts": {"legs": False, "shell": True}, "why": "No legs, a shell: a snail."},
                  {"pic": "\U0001FAB1", "label": "a creature with no legs and no shell", "answer": "worm", "facts": {"legs": False, "shell": False}, "why": "No legs, no shell: a worm."},
                  {"pic": icon("woodlouse"), "label": "a creature with fourteen legs", "answer": "woodlouse", "facts": {"legs": True, "six": False, "eight": False}, "why": "More than eight legs: a woodlouse, with fourteen."},
              ]},
             "A key names the creature. You just answer what you see."),

        step("lookup", "Look it up: exoskeletons", "\U0001F4DA", "Shell facts", ["4TWSc.07", "4Bs.04"],
             "Read the fact card, then answer from it.",
             explain(
                 ["A secondary source is what somebody else found out and wrote down."],
                 ["Read the whole card.", "Find each answer in it."],
                 [],
                 ["Read, then tap."]),
             {"source": {"title": "Living in a suit of armour",
                         "lines": ["An <b>exoskeleton</b> is a hard skeleton covering the <b>outside</b> of the whole body, with joints so it can bend. Insects, spiders, crabs and woodlice have one.",
                                   "It <b>protects</b> the soft body inside, and the animal's muscles pull on it from the inside to move.",
                                   "An exoskeleton <b>cannot grow</b>. To get bigger, the animal must <b>shed</b> it and grow a new, larger one. This is called moulting.",
                                   "While the new exoskeleton is still soft, the animal <b>hides</b>, because it is easy to eat.",
                                   "A crab can moult twenty times in its life. A lobster's old shell is sometimes found empty on the beach, looking just like the lobster."]},
              "items": [
                  {"ask": "Where is an exoskeleton?", "opts": [opt("on the outside of the body", True), opt("inside the body", False), opt("in the head only", False)], "why": "The card says on the outside."},
                  {"ask": "Why must an animal shed its exoskeleton?", "opts": [opt("it cannot grow, so a bigger one is needed", True), opt("it gets dirty", False), opt("it gets too heavy", False)], "why": "The card says an exoskeleton cannot grow."},
                  {"ask": "Why does the animal hide after moulting?", "opts": [opt("the new exoskeleton is soft, so it is easy to eat", True), opt("it is shy", False), opt("it is asleep", False)], "why": "The card says it hides while the new one is soft."},
                  {"ask": "What is moulting?", "opts": [opt("shedding the old exoskeleton and growing a new one", True), opt("eating the exoskeleton", False), opt("growing a backbone", False)], "why": "The card calls the shedding moulting."},
              ]},
             "You found every answer in the card."),

        step("questions", "Skeleton check", "✅", "Skeleton check", ["4Bs.04", "4Bs.05", "4TWSc.02"],
             "Tap the answer.",
             explain(
                 ["Vertebrates, invertebrates, exoskeletons, and keys."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("An animal with a backbone is called...", "\U0001F9B4", "a vertebrate", ["an invertebrate", "an exoskeleton", "an insect"], "Vertebrae are the bones of the spine."),
                 q("Which of these is an invertebrate?", "\U0001F50D", "a snail", ["a frog", "a parrot", "a shark"], "No backbone."),
                 q("What is an exoskeleton?", "\U0001F980", "a hard skeleton covering the outside of the body", ["a backbone inside the body", "a kind of shellfish that lives in the sea"], "Exo means outside."),
                 q("Which group of animals has an exoskeleton?", "\U0001F6E1️", "insects", ["mammals", "birds"], "Insects, spiders, crabs."),
                 q("What does a key do?", "\U0001F511", "identifies a creature through yes-or-no questions", ["opens a door into the classroom", "counts the legs for you"], "You answer; the key names it."),
             ]},
             "You know backbones and keys."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Bs.04", "4Bs.05", "4TWSc.02", "4TWSc.07"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Are you a vertebrate?", "\U0001F9D1\U0001F3FE", "yes, you have a backbone", ["no", "only when standing"], "Feel your spine."),
                 q("A jellyfish is...", "\U0001FABC", "an invertebrate with no hard parts", ["a vertebrate with a soft backbone", "an invertebrate with an exoskeleton"], "No bones, no case."),
                 q("Where are a crab's muscles?", "\U0001F980", "inside, pulling on the exoskeleton", ["outside, on top of the shell", "a crab has no muscles at all"], "Muscles pull the hard case from within."),
                 q("Why does a crab moult?", "\U0001F980", "its exoskeleton cannot grow", ["to change its colour", "to help it swim faster"], "A new, bigger case each time."),
                 q("Six legs and wings. The key says...", "\U0001F511", "butterfly", ["spider", "worm"], "You followed it."),
                 q("Eight legs. The key says...", "\U0001F511", "spider", ["ant", "snail"], "Not an insect."),
                 q("Which group has the most kinds of animal in the world?", "\U0001F30D", "invertebrates", ["vertebrates", "mammals"], "Most kinds of animal have no backbone."),
                 q("A snail has a hard shell. Why is it not a vertebrate?", "\U0001F914", "it has no backbone inside its body", ["its shell is too small", "it lives in a garden"], "Vertebrate means a backbone inside. A hard shell on the back is not a backbone."),
                 q("Where did you find the facts about moulting?", "\U0001F4DA", "in a fact card, a secondary source", ["by guessing what might happen", "by watching a crab for a year"], "Research."),
             ]},
             "That is the whole lesson finished. Backbone, no backbone, or a skeleton outside."),
    ],
}

LESSON["about"] = [
    "Say what a vertebrate and an invertebrate are.",
    "Say what an exoskeleton is and which animals have one.",
    "Use a key to identify six minibeasts.",
    "Find answers about exoskeletons in a fact card.",
]

LESSON["warmup"] = [
    q("What is the chain of small bones down your back called?", "\U0001F9B4", "the spine", ["the skull", "the rib cage"], "The spine, or backbone, from the last lesson."),
    q("How many legs does an insect have?", "\U0001F41D", "six", ["four", "ten"], "Every insect has six legs."),
]

LESSON["lecture"] = [
    part("\U0001F9B4", "Vertebrates",
         "You have a backbone: a spine of small bones inside you. So does a dog, a bird, a fish, a frog and a snake. Animals with a backbone are called vertebrates."),
    part("\U0001FAB1", "Invertebrates",
         "A worm has no backbone. Neither does a slug, a jellyfish or an octopus. Animals without a backbone are invertebrates, and most of the animals in the world are invertebrates."),
    part("\U0001F980", "Exoskeletons",
         "Some invertebrates wear their skeleton on the outside: a hard, jointed case over the whole body, called an exoskeleton. Insects, spiders, crabs and woodlice. It protects them, and their muscles pull on it from inside. To grow, they have to shed it. A snail's shell is different: the snail's soft body comes out of it."),
    part("\U0001F511", "A key",
         "Scientists identify creatures with a key: a chain of yes-or-no questions. Does it have legs? Six of them? Wings? Each answer leads to the next question until the key names the creature."),
    part("\U0001F50D", "Today",
         "Today you sort ten animals by backbone, follow a key through six minibeasts, and look up how a crab gets a bigger shell."),
]

LESSON["words"] = [
    word("vertebrate", "\U0001F9B4", "An animal with a backbone.",
         ["A cat is a vertebrate.", "All birds are vertebrates."]),
    word("invertebrate", "\U0001FAB1", "An animal without a backbone.",
         ["A worm is an invertebrate.", "Most animals are invertebrates."]),
    word("backbone", "\U0001F9B4", "The spine: the chain of bones down the back of a vertebrate.",
         ["Feel your backbone.", "A fish has a backbone."]),
    word("exoskeleton", "\U0001F980", "A hard skeleton covering the outside of the body.",
         ["A crab has an exoskeleton.", "An insect's exoskeleton protects it."]),
    word("moult", "\U0001F980", "To shed an old exoskeleton and grow a bigger one.",
         ["Crabs moult to grow.", "The empty shell on the beach was a moult."]),
    word("key", "\U0001F511", "A set of yes-or-no questions that identifies a living thing.",
         ["Use the key to name the minibeast.", "The key asked how many legs it had."]),
    word("identify", "\U0001F50D", "To work out exactly what something is.",
         ["We identified the beetle with a key.", "Can you identify this bird?"]),
]

LESSON["home"] = [
    home("Minibeast key", "A grown-up, a garden, park or school ground, a magnifying glass if you have one, the key from this lesson written on paper",
         ["With a grown-up, look for four small creatures on plants, walls and paths, or under leaves. If you lift a stone, a grown-up helps: lift it slowly and put it back just as it was. Do not pick up or touch the creatures: count their legs by looking.",
          "No outdoor space? Use pictures of minibeasts in a book or on a screen instead.",
          "For each one, follow the key: legs? how many? wings? shell?",
          "Write the name the key gives you. Wash your hands when you come in."],
         "Did the key work for every creature? Which question was hardest to answer?"),
    home("Backbone hunt", "Any animals you can see: pets, birds, a fish tank, a zoo, or pictures in a book",
         ["For each animal, decide: backbone or not?",
          "For the ones without, decide: a hard case over the whole body, or a soft body? A snail goes with the soft ones: it is soft, and carries a shell.",
          "Make three lists."],
         "Vertebrate, exoskeleton, soft invertebrate. Which list is longest?"),
    home("Find a moult", "A grown-up, and a beach, a pond edge or a garden, or a book or website with pictures of moults",
         ["With a grown-up, look for an empty case shaped like a whole crab, or a split insect case on a plant stem. Keep away from deep water.",
          "If you cannot find one, look at a picture of one with a grown-up. Finding a real one takes luck.",
          "That is a moult: the old exoskeleton, left behind. Draw it, and draw what the animal looked like."],
         "The animal grew a bigger case and walked away from this one."),
]
