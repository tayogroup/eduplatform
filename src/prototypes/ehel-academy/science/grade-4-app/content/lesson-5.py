# -*- coding: utf-8 -*-
"""Lesson 5 - Habitats and Survival.

0097 Stage 4: 4Be.01 different animals are found in, and suited to, different
habitats; 4Be.02 plants and animals can survive outside their habitats;
4TWSc.07 a secondary source; 4TWSp.01 a question that can be investigated;
4SIC.02 science in the local area; 4SIC.05 positive and negative effects of
science and technology nearby; with 4TWSc.01.
"""
from _kit import explain, step, opt, q, part, word, home, icon

LESSON = {
    "slug": "habitats-and-survival",
    "title": "Habitats and Survival",
    "blurb": "Match animals to the habitats they suit, see the features that suit them, look up how living things survive outside their habitats, and weigh up what science and technology do to the living things near you.",
    "steps": [
        step("sort", "Which habitat suits it?", "\U0001F5C2️", "Habitat sort", ["4Be.01", "4TWSc.01"],
             "Each animal is suited to one habitat. Tap the bin.",
             explain(
                 ["A habitat is where an animal naturally lives, and each animal has features that suit it there."],
                 ["A camel's wide feet and hump suit the desert.", "A polar bear's thick fur suits the Arctic.", "A monkey's grasping hands suit the rainforest.", "A whale's tail and blubber suit the ocean."],
                 ["Children put the penguin in the Arctic.", "Penguins live at the South Pole, in the Antarctic. Polar bears live at the North."],
                 ["Think about the animal's features, then tap."]),
             {"ask": "Desert, Arctic, rainforest or ocean?",
              "bins": [{"id": "desert", "label": "Desert", "pic": "\U0001F3DC️"}, {"id": "arctic", "label": "Arctic", "pic": "\U0001F9CA"}, {"id": "forest", "label": "Rainforest", "pic": "\U0001F334"}, {"id": "ocean", "label": "Ocean", "pic": "\U0001F30A"}],
              "items": [
                  {"pic": "\U0001F42A", "label": "camel", "bin": "desert", "why": "Wide feet for sand, a hump of fat, and it can go days without water."},
                  {"pic": icon("polarbear"), "label": "polar bear", "bin": "arctic", "why": "Thick fur and fat for the cold, white to hide on the ice."},
                  {"pic": "\U0001F412", "label": "monkey", "bin": "forest", "why": "Grasping hands and a tail for the trees."},
                  {"pic": "\U0001F40B", "label": "whale", "bin": "ocean", "why": "A tail for swimming and blubber for the cold sea."},
                  {"pic": "\U0001F98E", "label": "desert lizard", "bin": "desert", "why": "Scaly skin keeps water in; it hides from the midday heat."},
                  {"pic": "\U0001F9AD", "label": "seal", "bin": "arctic", "why": "Blubber and flippers for icy water."},
                  {"pic": "\U0001F99C", "label": "parrot", "bin": "forest", "why": "A strong beak for nuts and fruit, bright colours among the leaves."},
                  {"pic": "\U0001F419", "label": "octopus", "bin": "ocean", "why": "Eight arms and gills; it cannot live out of water."},
                  {"pic": "\U0001F98A", "label": "Arctic fox", "bin": "arctic", "why": "Small ears to keep heat in, and a white winter coat."},
                  {"pic": "\U0001F438", "label": "tree frog", "bin": "forest", "why": "Sticky toes for leaves and damp skin for the wet air."},
              ]},
             "Every animal has features that suit its habitat."),

        step("explore", "Suited to the place", "\U0001F42A", "Suited features", ["4Be.01"],
             "A feature that suits a habitat helps an animal survive there. Tap each one.",
             explain(
                 ["Suited means the animal's body fits the place: it can find food, keep the right temperature and stay safe there."],
                 ["A camel's hump stores fat for days without food.", "A polar bear's fur is thick and its skin is black to soak up heat.", "A fish's gills take air from water.", "A cactus stores water in its stem."],
                 ["Children think the animal chose its features.", "It was born with them. Animals born with features that suit the place survive; the others do not."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F42A", "label": "camel", "sub": "hump, wide feet, long lashes", "say": "A camel stores fat in its hump, walks on sand with wide feet, and keeps sand out of its eyes with long lashes. Every feature suits the desert."},
                 {"pic": icon("polarbear"), "label": "polar bear", "sub": "thick fur, fat, white coat", "say": "A polar bear has thick fur over a layer of fat, so the Arctic cold does not reach it. Its white coat hides it on the ice."},
                 {"pic": "\U0001F41F", "label": "fish", "sub": "gills, fins, scales", "say": "A fish breathes with gills, which take air out of water. Fins steer it. Take it out of the ocean and it cannot breathe."},
                 {"pic": "\U0001F335", "label": "cactus", "sub": "stores water, spines", "say": "A cactus stores water in its thick stem and has spines instead of leaves, so it loses very little water in the desert heat."},
             ], "need": 4,
              "then": {"ask": "Why would a polar bear struggle in a desert?",
                       "opts": [opt("Its thick fur and fat would make it far too hot", True), opt("It does not like sand", False), opt("It would not struggle", False)],
                       "why": "The features that suit the Arctic are exactly wrong for the desert."}},
             "Suited means the body fits the place."),

        step("lookup", "Look it up: living outside the habitat", "\U0001F4DA", "Survivor facts", ["4Be.02", "4TWSc.07"],
             "Can a living thing survive somewhere that is not its habitat? Read the fact card, then answer from it.",
             explain(
                 ["A living thing is suited to its habitat, but it can sometimes survive somewhere else, if the things it needs are provided."],
                 ["A goldfish lives in a bowl if someone feeds it and keeps the water clean.", "Camels brought to Australia survive there because it is hot and dry, like their home.", "A rainforest plant survives on a windowsill if it is watered and kept warm."],
                 ["Children think an animal outside its habitat always dies.", "Sometimes it survives; sometimes it even spreads. The card says which."],
                 ["Read, then tap."]),
             {"source": {"title": "Surviving away from home",
                         "lines": ["A living thing is <b>suited</b> to its habitat, but it can often survive somewhere else if it can still get <b>food, water, the right temperature and shelter</b>.",
                                   "A <b>goldfish</b> lives in a bowl for years because a person feeds it and keeps the water clean. In a wild river it would probably be eaten.",
                                   "<b>Camels</b> taken to Australia over a hundred years ago survived so well in its hot dry centre that there are now hundreds of thousands living wild.",
                                   "A <b>rainforest plant</b> on a windowsill survives if it is watered and kept warm. Put it outside in winter and it dies.",
                                   "<b>Zoos</b> keep animals alive far from their habitats by copying what the habitat gives them: a heated house for the reptiles, a pool for the seals."]},
              "items": [
                  {"ask": "What must a living thing still get to survive outside its habitat?", "opts": [opt("food, water, the right temperature and shelter", True), opt("nothing at all", False), opt("a passport", False)], "why": "The card lists food, water, temperature and shelter."},
                  {"ask": "Why does a goldfish survive in a bowl?", "opts": [opt("a person feeds it and keeps the water clean", True), opt("it prefers bowls", False), opt("it is not really a fish", False)], "why": "The card says a person provides what it needs."},
                  {"ask": "Why did camels survive in Australia?", "opts": [opt("its centre is hot and dry, like the camels' home", True), opt("Australians fed them", False), opt("they did not survive", False)], "why": "The card says the hot dry centre suited them."},
                  {"ask": "How does a zoo keep a seal alive far from the sea?", "opts": [opt("by giving it a pool, copying its habitat", True), opt("by teaching it to walk", False), opt("it cannot", False)], "why": "The card says zoos copy what the habitat gives."},
              ]},
             "Outside its habitat, a living thing survives if what it needs is provided."),

        step("ask", "Ask a question about a habitat near you", "❓", "Habitat questions", ["4TWSp.01", "4Be.01"],
             "Pick a question you could investigate in a habitat near you, then say how.",
             explain(
                 ["A scientific question can be investigated: by observing, counting, testing or looking up."],
                 ["Which minibeasts live under the stones in the playground? Count them.", "Do more birds visit the feeder in the morning or the afternoon? Watch and tally.", "Are woodlice found in damp places more than dry ones? Compare."],
                 ["Change one thing at a time when you compare.", "Same time of day, same size of patch."],
                 ["Pick a question, then pick how to find out."]),
             {"pic": "\U0001F333",
              "questions": ["Which minibeasts live under the stones in the playground?", "Do more birds visit the feeder in the morning or the afternoon?", "Are more woodlice found in damp places than dry ones?"],
              "findOut": {"ask": "You want to know whether woodlice prefer damp places. How would you find out?",
                          "opts": [opt("Count the woodlice under a damp patch and a dry patch of the same size, at the same time", True), opt("Guess", False), opt("Ask a woodlouse", False)],
                          "why": "Same size, same time, only the dampness differs. A fair comparison that answers the question."}},
             "A good question about a habitat is one you can go and check."),

        step("context", "Science and technology near you", "\U0001F3D8️", "Local effects", ["4SIC.05", "4SIC.02", "4Be.01"],
             "Science and technology change the habitats near you, for better and for worse. Tap each one.",
             explain(
                 ["Science is used all over your local area, and every use has effects on the living things there."],
                 ["A new road: faster journeys, but a habitat cut in two.", "Streetlights: safer streets, but they confuse moths and bats.", "A recycling centre: less digging, less waste.", "A park pond: a new habitat for frogs and dragonflies."],
                 ["Children think technology is either all good or all bad.", "Most has both. Science helps us see both sides."],
                 ["Tap each one and say a good effect and a bad one."]),
             {"items": [
                 {"pic": "\U0001F6E3️", "label": "a new road", "say": "A new road makes journeys faster and brings shops and jobs. But it cuts a habitat in two, and animals crossing it get hurt. Some roads now have tunnels underneath for hedgehogs and toads."},
                 {"pic": "\U0001F4A1", "label": "streetlights", "say": "Streetlights make streets safer at night. But moths fly round them until they drop, and bats and birds get confused. Some towns now dim the lights after midnight."},
                 {"pic": "♻️", "label": "a recycling centre", "say": "A recycling centre means less rubbish buried and less rock dug up for new metal and glass. Better for every habitat nearby."},
                 {"pic": "\U0001F438", "label": "a park pond", "say": "A pond dug in a park is a new habitat. Within a year there are frogs, dragonflies and pondweed where there was mown grass."},
             ], "need": 4,
              "then": {"ask": "What is a good way to think about a new road?",
                       "opts": [opt("List its good effects AND its bad effects on the living things nearby", True), opt("Roads are always good", False), opt("Roads are always bad", False)],
                       "why": "Science lets you see both sides and decide."}},
             "Science and technology near you help some living things and harm others."),

        step("questions", "Back it up with science", "\U0001F5E3\uFE0F", "Backed by science", ["4SIC.03", "4Be.01"],
             "Someone makes a point. Which reason uses science to support it? Tap it.",
             explain(
                 ["A point is stronger when a scientific reason supports it.", "A scientific reason is about what living things need, or about evidence."],
                 ["Keep the hedge: birds nest in it. That is science.", "Keep the hedge: it is a nice colour. That is not."],
                 ["Children pick the reason they like best.", "Ask: does this reason use what we know about living things?"],
                 ["Read the point, then find the scientific reason."]),
             {"label": "Question", "items": [
                 q("\"We should keep the old hedge by the school.\" Which reason uses science?", "\U0001F333", "birds nest in it: it is their habitat", ["it is a nice colour", "it has always been there"], "A scientific reason is about what living things need."),
                 q("\"Move the fish tank away from the sunny window.\" Which reason uses science?", "\U0001F41F", "the water would get too warm for the fish", ["the window looks better empty", "the fish get bored of the view"], "A habitat has to stay right for what lives in it."),
                 q("\"Leave the woodlice under the log.\" Which reason uses science?", icon("woodlouse"), "woodlice need damp, dark places to survive", ["woodlice are too small to matter", "the log is heavy to lift"], "Woodlice are suited to damp, dark places and dry out in the sun."),
                 q("\"A cactus is suited to the desert.\" Which evidence supports that?", "🌵", "it stores water in its thick stem and has spines, not wide leaves", ["it is green", "it grows slowly in a pot"], "Features that help it survive in its habitat are the evidence."),
             ]},
             "You backed up a point with science."),

        step("questions", "Habitat check", "✅", "Habitat check", ["4Be.01", "4Be.02"],
             "Tap the answer.",
             explain(
                 ["Suited features, and surviving outside the habitat."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which feature suits a camel to the desert?", "\U0001F42A", "a hump that stores fat", ["thick white fur", "gills", "sticky toes"], "Fat for days without food."),
                 q("Which feature suits a polar bear to the Arctic?", icon("polarbear"), "thick fur over a layer of fat", ["a hump", "a long tail for climbing"], "Keeps the cold out."),
                 q("Can a goldfish survive outside a river?", "\U0001F41F", "yes, in a bowl, if a person gives it what it needs", ["no, never", "only in the sea"], "Food and clean water provided."),
                 q("Why can a zoo keep a seal far from the sea?", "\U0001F9AD", "it copies the habitat with a pool", ["seals do not need water", "it cannot"], "Provide what the habitat gives."),
                 q("Why would a fish not survive in a desert?", "\U0001F3DC️", "its gills need water to breathe", ["it would get too cold", "it would"], "No water, no breathing."),
             ]},
             "You know what suits an animal to its habitat."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Be.01", "4Be.02", "4SIC.05", "4TWSp.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does suited to a habitat mean?", "\U0001F42A", "the animal's features fit the place, so it can survive there", ["the animal likes it there", "the animal is big"], "Features that fit."),
                 q("Which animal is suited to the rainforest?", "\U0001F412", "a monkey with grasping hands and a tail", ["a polar bear", "a camel"], "Built for trees."),
                 q("Why did camels spread across Australia?", "\U0001F3DC️", "its hot dry centre is like their desert home", ["they were fed", "they swam there"], "A habitat like their own."),
                 q("A rainforest plant on a windowsill survives if...", "\U0001F331", "it is watered and kept warm", ["it is put outside in winter", "it is never watered"], "The needs are provided."),
                 q("Which is a BAD effect of streetlights on living things?", "\U0001F4A1", "moths and bats get confused by them", ["streets are safer", "people can see"], "Good for people, bad for moths."),
                 q("Which is a GOOD effect of a park pond?", "\U0001F438", "a new habitat for frogs and dragonflies", ["it floods the path", "nothing lives in it"], "A habitat made by people."),
                 q("Which question about a habitat could you investigate?", "❓", "are more woodlice found in damp places than dry?", ["are woodlice happy?", "which woodlouse is the nicest?"], "Countable."),
                 q("What do you need to survive outside your habitat?", "\U0001F3E0", "food, water, the right temperature and shelter", ["nothing", "a map"], "The card said so."),
             ]},
             "That is the whole lesson finished. You know what suits a living thing to its home."),
    ],
}

LESSON["about"] = [
    "Match animals to the habitats their features suit.",
    "Say how a living thing can survive outside its habitat.",
    "Ask a question about a habitat near you that you could investigate.",
    "Say a good effect and a bad effect of technology on living things nearby.",
]

LESSON["lecture"] = [
    part("\U0001F42A", "Suited to the place",
         "A camel has a hump of fat, wide feet for sand and long lashes against the wind. Every feature suits the desert. A polar bear has thick fur over fat. Every feature suits the Arctic. An animal is suited to its habitat."),
    part("\U0001F41F", "Why it matters",
         "Put a polar bear in the desert and its fur would cook it. Put a fish in the desert and its gills have no water to breathe. The features that suit one place are wrong for another."),
    part("\U0001F3E0", "Surviving somewhere else",
         "But a living thing can sometimes survive outside its habitat. A goldfish lives in a bowl because a person feeds it. A rainforest plant lives on a windowsill because a person waters it. Provide what the habitat gave, and it survives."),
    part("\U0001F3D8️", "Science near you",
         "Science and technology are all over your area: roads, streetlights, recycling centres, park ponds. Each one changes the habitats nearby. A road brings shops and cuts a habitat in two. A pond makes a new one."),
    part("⚖️", "Both sides",
         "Most technology helps some living things and harms others. Science lets you see both sides and decide. Today you will sort, look up, ask a question you could test near you, and weigh up what technology does to your area."),
]

LESSON["words"] = [
    word("habitat", "\U0001F333", "The place where a living thing naturally lives.",
         ["The desert is a camel's habitat.", "A pond is a habitat."]),
    word("suited", "\U0001F42A", "Having features that fit a place, so the living thing can survive there.",
         ["A polar bear is suited to the cold.", "Gills make a fish suited to water."]),
    word("feature", icon("polarbear"), "A part of a living thing's body, like thick fur or wide feet.",
         ["Thick fur is a feature for the cold.", "Which feature suits the desert?"]),
    word("survive", "\U0001F3E0", "To stay alive.",
         ["A goldfish survives in a bowl.", "Camels survived in Australia."]),
    word("environment", "\U0001F30D", "Everything around a living thing: the land, water, air and other living things.",
         ["A road changes the environment.", "Recycling helps the environment."]),
    word("technology", "\U0001F4A1", "Things people make and use, like roads, lights and machines.",
         ["Streetlights are technology.", "Technology can help or harm habitats."]),
    word("investigate", "\U0001F50D", "To find out the answer to a question by observing, counting or testing.",
         ["We investigated where woodlice live.", "Can you investigate that question?"]),
]

LESSON["home"] = [
    home("Damp or dry?", "Two patches of ground, one damp and shady, one dry and sunny, a stone or a piece of wood for each, a week",
         ["Leave a stone on each patch for a week.",
          "Lift both at the same time and count the woodlice under each. Put them back.",
          "Write the two numbers down."],
         "More under the damp one? That is an investigation with a fair comparison."),
    home("Suited features", "A pet, or a picture of an animal, paper",
         ["Draw the animal.",
          "Label three features: feet, covering, mouth, tail.",
          "Next to each, write how it suits where the animal lives."],
         "A cat's claws, whiskers and night eyes suit a hunter."),
    home("Good and bad near you", "A walk round your street, paper",
         ["Find three things people have built: a road, lights, a pond, a bin.",
          "For each, write one good effect on living things and one bad effect.",
          "Decide which one has done the most good."],
         "Science helps you see both sides before you decide."),
]
