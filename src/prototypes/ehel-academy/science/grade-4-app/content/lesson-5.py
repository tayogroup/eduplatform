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
                 ["A habitat is where an animal lives in the wild. Each animal has features that suit it there."],
                 ["A camel's wide feet and hump suit the desert.", "A polar bear's thick fur suits the Arctic.", "A monkey's grasping hands suit the rainforest.", "A whale's tail and blubber suit the ocean."],
                 ["Children put the penguin in the Arctic.", "No penguins live in the Arctic. They live in the south of the world, around Antarctica and on southern coasts. Polar bears live in the Arctic, in the far north."],
                 ["Think about the animal's features, then tap."]),
             {"ask": "Desert, Arctic, rainforest or ocean?",
              "bins": [{"id": "desert", "label": "Desert", "pic": "\U0001F3DC️"}, {"id": "arctic", "label": "Arctic", "pic": "\U0001F9CA"}, {"id": "forest", "label": "Rainforest", "pic": "\U0001F334"}, {"id": "ocean", "label": "Ocean", "pic": "\U0001F30A"}],
              "items": [
                  {"pic": "\U0001F42A", "label": "camel", "bin": "desert", "why": "It has wide feet for sand and a hump of fat. It can go days without water."},
                  {"pic": icon("polarbear"), "label": "polar bear", "bin": "arctic", "why": "It has thick fur and fat for the cold. Its white coat hides it on the ice."},
                  {"pic": "\U0001F412", "label": "monkey", "bin": "forest", "why": "Grasping hands and a tail for the trees."},
                  {"pic": "\U0001F40B", "label": "whale", "bin": "ocean", "why": "A tail for swimming and blubber for the cold sea."},
                  {"pic": "\U0001F98E", "label": "desert lizard", "bin": "desert", "why": "Scaly skin keeps water in. It hides from the midday heat."},
                  {"pic": "\U0001F98C", "label": "reindeer", "bin": "arctic", "why": "It has a thick coat for the cold. Its wide hooves do not sink into the snow."},
                  {"pic": "\U0001F99C", "label": "parrot", "bin": "forest", "why": "It has a strong beak for nuts and fruit. Its bright colours fit in among the leaves."},
                  {"pic": "\U0001F419", "label": "octopus", "bin": "ocean", "why": "It has eight arms and gills. It cannot live out of water."},
                  {"pic": icon("arcticfox"), "label": "Arctic fox", "bin": "arctic", "why": "Small ears keep heat in. A thick white winter coat hides it in the snow."},
                  {"pic": "\U0001F438", "label": "tree frog", "bin": "forest", "why": "Sticky toes for leaves and damp skin for the wet air."},
              ]},
             "Every animal has features that suit its habitat."),

        step("explore", "Suited to the place", "\U0001F42A", "Suited features", ["4Be.01"],
             "A feature that suits a habitat helps an animal survive there. Tap each one.",
             explain(
                 ["Suited means the animal's body fits the place. It can find food there, keep at the right temperature and stay safe."],
                 ["A camel's hump stores fat for days without food.", "A polar bear's fur is thick and its skin is black to soak up heat.", "A fish's gills take oxygen out of the water.", "A cactus stores water in its stem."],
                 ["Children think the animal chose its features.", "It was born with them. Animals born with features that suit the place survive. The others do not."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F42A", "label": "camel", "sub": "hump, wide feet, long lashes", "say": "A camel stores fat in its hump. It walks on sand with wide feet. Long lashes keep sand out of its eyes. Every feature suits the desert."},
                 {"pic": icon("polarbear"), "label": "polar bear", "sub": "thick fur, fat, white coat", "say": "A polar bear has thick fur over a layer of fat. So the Arctic cold does not reach it. Its white coat hides it on the ice."},
                 {"pic": "\U0001F41F", "label": "fish", "sub": "gills, fins, scales", "say": "A fish breathes with gills. They take oxygen out of the water. Fins steer it. Take it out of the water and it cannot breathe."},
                 {"pic": "\U0001F335", "label": "cactus", "sub": "stores water, spines", "say": "A cactus stores water in its thick stem. It has spines, not leaves. So it loses very little water in the desert heat."},
             ], "need": 4,
              "then": {"ask": "Why would a polar bear struggle in a desert?",
                       "opts": [opt("Its thick fur and fat would make it far too hot", True), opt("It does not like sand", False), opt("It would not struggle", False)],
                       "why": "The features that suit the Arctic are wrong for the desert. It would be far too hot."}},
             "Suited means the body fits the place."),

        step("lookup", "Look it up: living outside the habitat", "\U0001F4DA", "Survivor facts", ["4Be.02", "4TWSc.07"],
             "Can a living thing survive somewhere that is not its habitat? Read the fact card, then answer from it.",
             explain(
                 ["A living thing is suited to its habitat. But it can sometimes survive somewhere else, if it gets the things it needs."],
                 ["A goldfish lives in a bowl if someone feeds it and keeps the water clean.", "Camels brought to Australia survive there because it is hot and dry, like their home.", "A rainforest plant survives on a windowsill if it is watered and kept warm."],
                 ["Children think an animal outside its habitat always dies.", "Sometimes it survives; sometimes it even spreads. The card says which."],
                 ["Read, then tap."]),
             {"source": {"title": "Surviving away from home",
                         "lines": ["A living thing is <b>suited</b> to its habitat. But it can often survive somewhere else. It must still get <b>food, water, the right temperature and shelter</b>.",
                                   "A <b>goldfish</b> lives in a bowl for years because a person feeds it and keeps the water clean. Goldfish let go in wild ponds and rivers often survive too. Some grow big and spread. They eat the food the wild animals there need. That is why a pet fish must never be let go.",
                                   "<b>Camels</b> were taken to Australia over a hundred years ago. Australia's centre is hot and dry, like their home. They survived so well there that hundreds of thousands now live wild.",
                                   "A <b>rainforest plant</b> on a windowsill survives if it is watered and kept warm. Put it somewhere freezing and it dies.",
                                   "<b>Zoos</b> keep animals alive far from their habitats. They copy what the habitat gives them. The reptiles get a heated house. The seals get a pool."]},
              "items": [
                  {"ask": "What must a living thing still get to survive outside its habitat?", "opts": [opt("food, water, the right temperature and shelter", True), opt("nothing at all", False), opt("a passport", False)], "why": "The card lists food, water, temperature and shelter."},
                  {"ask": "Why does a goldfish survive in a bowl?", "opts": [opt("a person feeds it and keeps the water clean", True), opt("it prefers bowls", False), opt("it is not really a fish", False)], "why": "The card says a person gives it what it needs."},
                  {"ask": "Why did camels survive in Australia?", "opts": [opt("its centre is hot and dry, like the camels' home", True), opt("Australians fed them", False), opt("they did not survive", False)], "why": "The card says the hot dry centre suited them."},
                  {"ask": "How does a zoo keep a seal alive far from the sea?", "opts": [opt("by giving it a pool, copying its habitat", True), opt("by teaching it to walk", False), opt("it cannot", False)], "why": "The card says zoos copy what the habitat gives."},
              ]},
             "Outside its habitat, a living thing can survive if it gets what it needs."),

        step("ask", "Ask a question about a habitat near you", "❓", "Habitat questions", ["4TWSp.01", "4Be.01"],
             "Pick a question you could investigate in a habitat near you. Then say how.",
             explain(
                 ["A scientific question can be investigated: by observing, counting, testing or looking up."],
                 ["Which minibeasts live under the stones in the playground? Count them.", "Do more birds visit the feeder in the morning or the afternoon? Watch and tally.", "Are woodlice found in damp places more than dry ones? Compare."],
                 ["Change one thing at a time when you compare.", "Same time of day, same size of patch."],
                 ["Pick a question, then pick how to find out."]),
             {"pic": "\U0001F333",
              "questions": ["Which minibeasts live under the stones in the playground?", "Do more birds visit the feeder in the morning or the afternoon?", "Are more woodlice found in damp places than dry ones?"],
              "findOut": {"ask": "You want to know whether woodlice prefer damp places. How would you find out?",
                          "opts": [opt("Count the woodlice under a damp patch and a dry patch of the same size, at the same time", True), opt("Guess", False), opt("Ask a woodlouse", False)],
                          "why": "Same size, same time. Only the dampness is different. That is a fair test, and it answers the question."}},
             "A good question about a habitat is one you can go and check."),

        step("context", "Science and technology near you", "\U0001F3D8️", "Local effects", ["4SIC.05", "4SIC.02", "4Be.01"],
             "Science and technology change the habitats near you. Some changes are good and some are bad. Tap each one.",
             explain(
                 ["Science is used all over your local area, and every use has effects on the living things there."],
                 ["A new road: faster journeys, but a habitat cut in two.", "Streetlights: safer streets, but they confuse moths and bats.", "A recycling centre: less digging and less waste, but busy lorries.", "A park pond: a new habitat for frogs and dragonflies, but the grassland that was there is dug up."],
                 ["Children think technology is either all good or all bad.", "Most has both. Science helps us see both sides."],
                 ["Tap each one and say a good effect and a bad one."]),
             {"items": [
                 {"pic": "\U0001F6E3️", "label": "a new road", "say": "A new road makes journeys faster. It brings shops and jobs. But it cuts a habitat in two, and animals crossing it get hurt. Some roads now have tunnels under them for hedgehogs and toads."},
                 {"pic": "\U0001F4A1", "label": "streetlights", "say": "Streetlights make streets safer at night. But moths fly round them until they drop. Bats and birds get confused. Some towns now dim the lights after midnight."},
                 {"pic": "♻️", "label": "a recycling centre", "say": "A recycling centre means less rubbish is buried. Less rock is dug up for new metal and glass. That is good for habitats. But the lorries that bring the rubbish make noise and dirty air on the roads nearby."},
                 {"pic": "\U0001F438", "label": "a park pond", "say": "A pond dug in a park is a new habitat. Within a year there are frogs, dragonflies and pondweed. But digging it destroys the patch of grass. The minibeasts that lived there are lost too."},
             ], "need": 4,
              "then": {"ask": "What is a good way to think about a new road?",
                       "opts": [opt("List its good effects and its bad effects on the living things nearby", True), opt("Decide roads are always good, whatever they do", False), opt("Decide roads are always bad, whatever they do", False)],
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
                 q("\"We should keep the old hedge by the school.\" Which reason uses science?", "\U0001F333", "birds nest in it: it is their habitat", ["it is a nice colour", "it has always been there"], "Birds need it for their nests. A reason from science is about what living things need."),
                 q("\"Move the fish tank away from the sunny window.\" Which reason uses science?", "\U0001F41F", "the water would get too warm for the fish", ["the window looks better empty", "the fish get bored of the view"], "Warm water could harm the fish. A habitat has to stay right for what lives in it."),
                 q("\"Leave the woodlice under the log.\" Which reason uses science?", icon("woodlouse"), "woodlice need damp, dark places to survive", ["woodlice are too small to matter", "the log is heavy to lift"], "Woodlice are suited to damp, dark places. They dry out in the sun."),
                 q("\"A cactus is suited to the desert.\" Which evidence supports that?", "🌵", "it stores water in its thick stem and has spines", ["it is green, like most plants", "it grows slowly in a pot indoors"], "These features help it survive in the desert. That is the evidence."),
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
                 q("Which feature suits a polar bear to the Arctic?", icon("polarbear"), "thick fur over a layer of fat", ["a hump", "a long tail for climbing"], "It keeps the cold out."),
                 q("Can a pet goldfish survive in a bowl?", "\U0001F41F", "yes, if a person feeds it and keeps the water clean", ["no, a fish can never live in a bowl", "only if the bowl is filled with sea water"], "A person gives it food and clean water."),
                 q("Why can a zoo keep a seal far from the sea?", "\U0001F9AD", "it copies the habitat with a pool", ["seals do not need water", "it cannot"], "The zoo copies what the sea gives it."),
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
                 q("What does suited to a habitat mean?", "\U0001F42A", "its features fit the place, so it survives there", ["the animal chose it because it likes it", "the animal is the biggest one living there"], "Features that fit."),
                 q("Which animal is suited to the rainforest?", "\U0001F333", "a monkey", ["a polar bear", "a camel"], "Grasping hands and a tail help it climb trees."),
                 q("Camels from Asia now live wild in Australia. What made that possible?", "\U0001F3DC️", "its hot dry centre is like their desert home", ["people fed them every day", "they swam there from Africa"], "A habitat like their own."),
                 q("A rainforest plant on a windowsill survives if...", "\U0001F331", "it is watered and kept warm", ["it is put somewhere freezing", "it is never watered"], "It gets what it needs."),
                 q("Which is a bad effect of streetlights on living things?", "\U0001F4A1", "moths and bats get confused by them", ["streets are safer at night", "people can see where they walk"], "Good for people, bad for moths."),
                 q("Which is a good effect of a park pond?", "\U0001F438", "a new habitat for frogs and dragonflies", ["it floods the path in the rain", "the grass that was there is dug up"], "A habitat made by people."),
                 q("Which question about a habitat could you investigate?", "❓", "are more woodlice found in damp places than dry?", ["are woodlice happy?", "which woodlouse is the nicest?"], "You can go and count them."),
                 q("A zoo keeps a penguin far from its home. What must the zoo give it?", "\U0001F3E0", "food, water, the right temperature and shelter", ["only a bigger space to run about in", "just sunlight and a quiet place"], "The card said so. A zoo must copy what the habitat gives."),
                 q("Why should you never let a pet goldfish go in a pond or river?", "\U0001F914", "it can survive there and eat food the wild animals need", ["it would turn into a different kind of fish", "goldfish cannot swim in moving water"], "Goldfish often survive in the wild and spread. They take food from the animals that live there."),
                 q("If you find 20 woodlice in a damp patch and 2 in a dry patch of the same size, at the same time, what does that show?", icon("woodlouse"), "more woodlice live in damp places", ["woodlice like dry places best", "damp or dry makes no difference"], "Only the dampness was different. Far more were in the damp patch."),
                 q("Which is the fair test of whether more birds visit the feeder in the morning?", "\U0001F426", "watch the same feeder for ten minutes in the morning and ten in the afternoon", ["watch for ten minutes in the morning and an hour in the afternoon", "watch one feeder in the morning and a different one in the afternoon"], "Same feeder, same length of time. Only the time of day changes."),
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

LESSON["warmup"] = [
    q("A rabbit eats only plants. It is a...", "\U0001F407", "herbivore", ["carnivore", "omnivore"], "From the last lesson: plants only, a herbivore."),
    q("Where does a fish live?", "\U0001F41F", "in water", ["in a tree", "in the desert sand"], "A fish needs water to live."),
]

LESSON["lecture"] = [
    part("\U0001F42A", "Suited to the place",
         "A camel has a hump of fat. It has wide feet for sand and long lashes against the wind. Every feature suits the desert. A polar bear has thick fur over fat. Every feature suits the Arctic. An animal is suited to its habitat."),
    part("\U0001F41F", "Why it matters",
         "Put a polar bear in the desert and its fur would cook it. Put a fish in the desert and its gills have no water to breathe. The features that suit one place are wrong for another."),
    part("\U0001F3E0", "Surviving somewhere else",
         "But a living thing can sometimes survive outside its habitat. A goldfish lives in a bowl because a person feeds it. A rainforest plant lives on a windowsill because a person waters it. Give it what the habitat gave, and it survives."),
    part("\U0001F3D8️", "Science near you",
         "Science and technology are all over your area. Think of roads, streetlights, recycling centres and park ponds. Each one changes the habitats nearby. A road brings shops and cuts a habitat in two. A pond makes a new one."),
    part("⚖️", "Both sides",
         "Most technology helps some living things. It harms others. Science lets you see both sides and decide. Today you will sort animals and look things up. You will ask a question you could test near you. Then you will weigh up what technology does to your area."),
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
    home("Damp or dry?", "A grown-up, two patches of ground side by side in the same shade, two flat pieces of wood the same size, a cup of water, a week",
         ["With a grown-up, put a piece of wood on each patch. No ground outside? Do it in a park with a grown-up, or choose another project.",
          "Every day, pour a cup of water on one patch to keep it damp. Leave the other patch dry.",
          "After a week, a grown-up lifts both pieces at the same time. Count the woodlice under each, then put the wood back gently.",
          "Write the two numbers down, and wash your hands."],
         "More under the damp one? Same shade, same size, same time. Only the dampness was different. That is a fair comparison."),
    home("Suited features", "A pet, or a picture of an animal, paper",
         ["Draw the animal.",
          "Label three features: feet, covering, mouth, tail.",
          "Next to each, write how it suits where the animal lives."],
         "A cat's claws, whiskers and night eyes suit a hunter."),
    home("Good and bad near you", "A walk round your street with a grown-up, paper",
         ["With a grown-up, find three things people have built: a road, lights, a pond, a bin.",
          "For each, write one good effect on living things and one bad effect.",
          "Decide which one has done the most good."],
         "Science helps you see both sides before you decide."),
]
