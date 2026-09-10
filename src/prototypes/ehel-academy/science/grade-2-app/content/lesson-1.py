# -*- coding: utf-8 -*-
"""Lesson 1 - Animals and Their Coverings.

0097 Stage 2: 2Bs.01 how animals, including humans, are similar and different
in body parts and skin covering; 2Bp.03 how young animals change as they grow;
2Bp.04 offspring have a mix of their parents' features; 2TWSm.03 a diagram
versus a picture; with 2TWSc.01, 2TWSp.01 and 2SIC.03.
"""
from _kit import explain, step, opt, q

# a diagram is a drawing that shows the parts and names them; a picture just shows the thing
BIRD_DIAGRAM = ('<svg viewBox="0 0 120 90"><path d="M20 55 q30 -30 60 -10 l20 -6 l-16 14 q-10 22 -44 18z" fill="none" stroke="#fff" stroke-width="2"/>'
                '<circle cx="86" cy="42" r="2" fill="#fff"/><path d="M60 62 l-8 16 M52 62 l-8 16" stroke="#fff" stroke-width="2"/>'
                '<text x="4" y="14" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">wing</text><line x1="22" y1="16" x2="46" y2="40" stroke="#F4C95D" stroke-width="1"/>'
                '<text x="90" y="24" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">beak</text><line x1="98" y1="27" x2="96" y2="40" stroke="#F4C95D" stroke-width="1"/>'
                '<text x="30" y="86" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">legs</text></svg>')
FISH_DIAGRAM = ('<svg viewBox="0 0 120 90"><path d="M20 45 q30 -30 70 0 q-40 30 -70 0z M90 45 l22 -14 v28z" fill="none" stroke="#fff" stroke-width="2"/>'
                '<circle cx="34" cy="42" r="2" fill="#fff"/><path d="M50 30 l8 -12 l8 12" fill="none" stroke="#fff" stroke-width="2"/>'
                '<text x="70" y="12" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">fin</text><line x1="72" y1="14" x2="60" y2="22" stroke="#F4C95D" stroke-width="1"/>'
                '<text x="86" y="82" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">tail</text><line x1="96" y1="72" x2="100" y2="58" stroke="#F4C95D" stroke-width="1"/>'
                '<text x="4" y="82" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">scales</text></svg>')

LESSON = {
    "slug": "animals-and-their-coverings",
    "title": "Animals and Their Coverings",
    "blurb": "Compare fur, feathers, scales and skin, put a chick's life in order, find out why puppies look like their parents, and tell a diagram from a picture.",
    "steps": [
        step("explore", "What covers an animal?", "\U0001F43E", "Coverings", ["2Bs.01"],
             "Tap each animal. What is its body covered with?",
             explain(
                 ["Every animal has a covering on the outside of its body, and different animals have different ones."],
                 ["A cat has fur.", "A bird has feathers.", "A fish has scales.", "A frog has smooth wet skin.", "A tortoise has a hard shell.",
                  "You have skin, with hair on your head."],
                 ["Children think humans are not animals.", "We are. We have skin and hair, two arms, two legs, and we are alike and different from the others."],
                 ["Tap all eight and say the covering out loud."]),
             {"items": [
                 {"pic": "\U0001F431", "label": "cat", "sub": "fur", "say": "A cat is covered in fur. Soft hair all over, to keep it warm."},
                 {"pic": "\U0001F426", "label": "bird", "sub": "feathers", "say": "A bird is covered in feathers. Light and warm, and they help it fly."},
                 {"pic": "\U0001F41F", "label": "fish", "sub": "scales", "say": "A fish is covered in scales. Small hard plates that overlap, and it is slimy so it slips through water."},
                 {"pic": "\U0001F438", "label": "frog", "sub": "smooth skin", "say": "A frog has smooth, wet skin with no fur, feathers or scales."},
                 {"pic": "\U0001F422", "label": "tortoise", "sub": "shell and scales", "say": "A tortoise has a hard shell on its back and scaly legs."},
                 {"pic": "\U0001F40D", "label": "snake", "sub": "scales", "say": "A snake is covered in dry scales. It has no legs at all."},
                 {"pic": "\U0001F9D2", "label": "child", "sub": "skin and hair", "say": "You are an animal too. You have skin, with hair on your head. No fur, no feathers, no scales."},
                 {"pic": "\U0001F418", "label": "elephant", "sub": "thick skin", "say": "An elephant has thick, wrinkly skin with only a few hairs."},
             ], "need": 8},
             "Fur, feathers, scales, skin, shell. Every animal has a covering."),

        step("sort", "Sort by covering", "\U0001F5C2️", "Sorted by skin", ["2Bs.01", "2TWSc.01"],
             "What is this animal covered with? Tap the right bin.",
             explain(
                 ["Sorting by covering puts animals with the same kind of outside together."],
                 ["A dog goes with the cat: fur.", "A duck goes with the bird: feathers.", "A crocodile goes with the snake: scales."],
                 ["Children put a penguin with the fish because it swims.", "A penguin is a bird. Feathers, however well it swims."],
                 ["Look at the outside of the animal, not where it lives."]),
             {"ask": "Fur, feathers, scales, or skin?",
              "bins": [{"id": "fur", "label": "Fur", "pic": "\U0001F431"}, {"id": "feathers", "label": "Feathers", "pic": "\U0001FAB6"},
                       {"id": "scales", "label": "Scales", "pic": "\U0001F41F"}, {"id": "skin", "label": "Bare skin", "pic": "\U0001F438"}],
              "items": [
                  {"pic": "\U0001F415", "label": "dog", "bin": "fur", "why": "A dog is covered in fur."},
                  {"pic": "\U0001F986", "label": "duck", "bin": "feathers", "why": "A duck is a bird. Feathers."},
                  {"pic": "\U0001F40A", "label": "crocodile", "bin": "scales", "why": "A crocodile is covered in hard scales."},
                  {"pic": "\U0001F427", "label": "penguin", "bin": "feathers", "why": "A penguin swims, but it is a bird with feathers."},
                  {"pic": "\U0001F42D", "label": "mouse", "bin": "fur", "why": "A mouse has soft fur."},
                  {"pic": "\U0001F98E", "label": "lizard", "bin": "scales", "why": "A lizard is covered in scales."},
                  {"pic": "\U0001F9D1", "label": "person", "bin": "skin", "why": "People have bare skin, with hair only on the head."},
                  {"pic": "\U0001F42C", "label": "dolphin", "bin": "skin", "why": "A dolphin has smooth bare skin. It is not a fish."},
                  {"pic": "\U0001F413", "label": "hen", "bin": "feathers", "why": "A hen is a bird. Feathers."},
                  {"pic": "\U0001F430", "label": "rabbit", "bin": "fur", "why": "A rabbit has thick soft fur."},
              ]},
             "Fur, feathers, scales or skin. You sorted them by their coverings."),

        step("questions", "Alike and different", "\U0001F50D", "Compared", ["2Bs.01"],
             "How are these animals alike, and how are they different? Tap the answer.",
             explain(
                 ["Animals are alike in some ways and different in others.", "Scientists compare them by counting body parts and looking at coverings."],
                 ["A bird and a bat both have wings, but one has feathers and one has fur.", "A person and a monkey both have two arms and two legs.",
                  "A fish has fins where you have arms."],
                 [],
                 ["Read the question, picture both animals, then tap."]),
             {"label": "Question", "items": [
                 q("A cat and a dog. What do they BOTH have?", "\U0001F431\U0001F415", "fur and four legs", ["feathers", "scales", "wings"], "Both are covered in fur and both walk on four legs."),
                 q("A bird and a fish. What is DIFFERENT?", "\U0001F426\U0001F41F", "feathers and wings, or scales and fins", ["both have two eyes", "both breathe", "both eat"], "A bird has feathers and wings; a fish has scales and fins."),
                 q("You and a monkey. What do you BOTH have?", "\U0001F9D2\U0001F412", "two arms and two legs", ["a tail", "fur all over", "wings"], "People and monkeys both have two arms and two legs."),
                 q("How many legs does a spider have?", "\U0001F577️", "eight", ["four", "six", "two"], "A spider has eight legs. An insect has six."),
                 q("Which animal has NO legs?", "\U0001F40D", "a snake", ["a cat", "a hen", "a frog"], "A snake has no legs and moves by sliding on its scales."),
                 q("What do you have that a fish does not?", "\U0001F9D2", "arms and legs", ["eyes", "a mouth", "a body"], "A fish has fins and a tail instead of arms and legs."),
             ]},
             "Alike in some parts, different in others."),

        step("order", "From egg to hen", "\U0001F95A", "In order", ["2Bp.03"],
             "Put a hen's life in order. Tap what comes <b>first</b>, then next.",
             explain(
                 ["Young animals change as they grow up, in an order that is always the same."],
                 ["A hen starts as an egg.", "The egg hatches into a fluffy chick.", "The chick grows feathers and becomes a young hen.", "The young hen grows into a big hen, which lays eggs of her own."],
                 ["Children put the chick first because it is the smallest living one.", "The egg comes before the chick."],
                 ["Tap the four in order from the very beginning."]),
             {"items": [
                 {"pic": "\U0001F95A", "label": "egg", "say": "It starts as an egg."},
                 {"pic": "\U0001F423", "label": "chick hatching", "say": "The egg hatches. A chick comes out."},
                 {"pic": "\U0001F425", "label": "young chick", "say": "The chick grows bigger and grows feathers."},
                 {"pic": "\U0001F414", "label": "grown hen", "say": "A grown hen. She can lay eggs of her own."},
             ]},
             "Egg, chick, young hen, grown hen. Young animals change as they grow."),

        step("demo", "Growing up", "\U0001F476", "Growing up", ["2Bp.03"],
             "Press <b>Next</b>. Watch how a young animal changes as it gets older.",
             explain(
                 ["A baby animal does not look or act exactly like the grown-up. It changes as it grows."],
                 ["A kitten is tiny, its eyes are shut, and it drinks milk.", "Then it opens its eyes, grows teeth and eats food.", "Then it is a cat.",
                  "A baby person cannot walk or talk.", "A child can.", "A grown-up is taller and has bigger teeth."],
                 ["Children think growing up just means getting bigger.", "It also means new teeth, new food, and learning to walk and talk."],
                 ["Press Next and spot what changes each time."]),
             {"frames": [
                 {"pic": "\U0001F431\U0001F37C", "cap": "A newborn <b>kitten</b>: eyes shut, drinks only milk.", "say": "A newborn kitten. Its eyes are shut and it drinks only its mother's milk."},
                 {"pic": "\U0001F408", "cap": "Weeks later: eyes open, first teeth, starts to eat food.", "say": "A few weeks later its eyes are open, its first teeth have come, and it starts to eat food."},
                 {"pic": "\U0001F408‍⬛", "cap": "A grown <b>cat</b>: bigger, hunts, can have kittens.", "say": "A grown cat. Bigger and stronger, it hunts, and it can have kittens of its own."},
                 {"pic": "\U0001F476", "cap": "A <b>baby</b> cannot walk or talk, and has no teeth.", "say": "A human baby cannot walk or talk yet, and has no teeth."},
                 {"pic": "\U0001F9D2", "cap": "A <b>child</b> walks, talks, and has first teeth.", "say": "A child can walk and talk, and has a set of small first teeth."},
                 {"pic": "\U0001F9D1", "cap": "A <b>grown-up</b> is taller and has big adult teeth.", "say": "A grown-up is taller and has bigger adult teeth. People change as they grow, just like other animals."},
             ]},
             "Young animals change as they grow: bigger, new teeth, new food, new skills."),

        step("explore", "Like mother, like father", "\U0001F46A", "Family features", ["2Bp.04"],
             "Young animals get a <b>mix</b> of features from both parents. Tap each family.",
             explain(
                 ["Babies are not copies of one parent. They get some features from their mother and some from their father."],
                 ["A black cat and a white cat can have black kittens, white kittens, and black and white kittens.",
                  "A child might have their mother's curly hair and their father's brown eyes."],
                 ["Children expect every puppy in a litter to look the same.", "Each one gets its own mix, so they can all be different."],
                 ["Tap each family and listen for the mix."]),
             {"items": [
                 {"pic": "\U0001F408‍⬛\U0001F431\U0001F408", "label": "cat family", "say": "A black mother cat and a ginger father cat. Their kittens are black, ginger, and some of both. Each kitten gets its own mix."},
                 {"pic": "\U0001F415\U0001F436", "label": "dog family", "say": "A spotty mother and a brown father. The puppies: one spotty, one brown, one brown with spots."},
                 {"pic": "\U0001F469\U0001F468\U0001F9D2", "label": "a human family", "say": "A child might have their mother's curly hair and their father's eyes. Features from both."},
                 {"pic": "\U0001F40E\U0001F434", "label": "horse family", "say": "A tall brown mother and a white father. The foal is brown with a white patch, and will grow tall."},
             ], "need": 4,
              "then": {"ask": "A black cat and a white cat have kittens. What are the kittens like?",
                       "opts": [opt("Some black, some white, some black and white", True), opt("All exactly black", False), opt("All grey", False)],
                       "why": "Each kitten gets a mix of features from both parents, so a litter can look different."}},
             "Young animals take after both parents, in their own mix."),

        step("sort", "Diagram, or picture?", "\U0001F4D0", "Diagram spotter", ["2TWSm.03", "2TWSc.01"],
             "A <b>picture</b> shows what a thing looks like. A <b>diagram</b> shows its parts and names them. Which is this?",
             explain(
                 ["Scientists draw diagrams.", "A diagram is a simple drawing with lines and labels that point to the parts.", "A picture or photo just shows how the thing looks."],
                 ["The bird drawing with the words wing, beak and legs is a diagram.", "The photo of a bird sitting on a branch is a picture."],
                 ["Children think the diagram is a worse drawing.", "It leaves out colours on purpose, so the parts and their names stand out."],
                 ["Look for labels and lines pointing at parts. That is a diagram."]),
             {"ask": "Diagram, or picture?",
              "bins": [{"id": "diagram", "label": "Diagram", "pic": "\U0001F4D0"}, {"id": "picture", "label": "Picture", "pic": "\U0001F5BC️"}],
              "items": [
                  {"pic": BIRD_DIAGRAM, "label": "a bird drawing with labels", "bin": "diagram", "why": "Lines and labels naming the wing, beak and legs. A diagram."},
                  {"pic": "\U0001F426", "label": "a photo of a bird", "bin": "picture", "why": "It shows how the bird looks, with no labels. A picture."},
                  {"pic": FISH_DIAGRAM, "label": "a fish drawing with labels", "bin": "diagram", "why": "It names the fin, tail and scales. A diagram."},
                  {"pic": "\U0001F41F", "label": "a photo of a fish", "bin": "picture", "why": "No labels, no lines. A picture."},
                  {"pic": "\U0001F3A8", "label": "a painting of a cat", "bin": "picture", "why": "A painting shows how it looks. A picture."},
              ]},
             "A diagram names the parts. A picture shows the look."),

        step("ask", "Ask a question about an animal", "❓", "Asked why", ["2TWSp.01"],
             "Look at the tortoise. Tap a question you would like to ask.",
             explain(
                 ["Scientists start with a question and then decide how to find the answer."],
                 ["Why does a tortoise have a shell? How long does it live? What does it eat?",
                  "Some answers come from watching; some from a book or a fact card, which is called a secondary source."],
                 [],
                 ["Tap a question, then tap a good way to find its answer."]),
             {"pic": "\U0001F422",
              "questions": ["Why does a tortoise have a hard shell?", "What does a tortoise eat?", "How long does a tortoise live?"],
              "findOut": {"ask": "You want to know how long a tortoise lives. How could you find out?",
                          "opts": [opt("Look it up in a fact book or ask a vet", True), opt("Guess a number", False), opt("Wait and watch it for a hundred years", False)],
                          "why": "Some questions cannot be answered by watching. A book, a fact card or an expert is a secondary source."}},
             "Ask, then watch or look it up. Both are science."),

        step("context", "People who work with animals", "\U0001F469‍⚕️", "Animal jobs", ["2SIC.03", "2Bs.01"],
             "Some people use animal science every day. Tap each one.",
             explain(
                 ["Everyone uses science, and some people use animal science as their job."],
                 ["A vet knows how a cat's body is different from a dog's, so they can treat both.",
                  "A zookeeper knows what each animal's covering needs: a penguin's feathers, a lizard's scales.", "A farmer watches lambs grow into sheep."],
                 [],
                 ["Tap each person and hear how they use what you learned today."]),
             {"items": [
                 {"pic": "\U0001F469‍⚕️", "label": "vet", "say": "A vet knows the parts of every animal that comes in, and how a cat's teeth are different from a rabbit's."},
                 {"pic": "\U0001F9D1‍\U0001F33E", "label": "farmer", "say": "A farmer watches lambs and calves grow, and knows which features they got from their parents."},
                 {"pic": "\U0001F9A9", "label": "zookeeper", "say": "A zookeeper keeps feathers dry, scales warm and fur clean, because each covering needs different care."},
                 {"pic": "\U0001F52C", "label": "animal scientist", "say": "An animal scientist draws diagrams of animals and compares them, to find out how they are alike and different."},
             ], "need": 4,
              "then": {"ask": "Which person would know why a puppy has its mother's spots?",
                       "opts": [opt("a vet or an animal scientist", True), opt("a bus driver", False), opt("a baker", False)],
                       "why": "Vets and animal scientists study how young animals get features from their parents."}},
             "People who work with animals use animal science all day."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["2Bs.01", "2Bp.03", "2Bp.04", "2TWSm.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about coverings, about how young animals change, and about a mix of features from two parents."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a bird covered with?", "\U0001F426", "feathers", ["fur", "scales", "a shell"], "Birds have feathers."),
                 q("What is a fish covered with?", "\U0001F41F", "scales", ["fur", "feathers", "wool"], "Fish have scales."),
                 q("Which animal has bare skin and hair only on its head?", "❓", "a person", ["a cat", "a hen", "a snake"], "People have skin, with hair on the head."),
                 q("What comes FIRST in a hen's life?", "\U0001F414", "an egg", ["a chick", "a grown hen", "feathers"], "A hen starts as an egg."),
                 q("A newborn kitten...", "\U0001F431", "has its eyes shut and drinks milk", ["hunts mice", "has all its teeth", "is as big as a cat"], "A kitten changes a lot before it becomes a cat."),
                 q("A brown dog and a spotty dog have puppies. The puppies are...", "\U0001F436", "a mix: some brown, some spotty, some both", ["all exactly the same", "all grey"], "Each puppy gets its own mix of features from both parents."),
                 q("A drawing of a plant with lines pointing to 'root', 'stem' and 'leaf' is a...", "\U0001F4D0", "diagram", ["picture", "photo", "painting"], "Labels and lines pointing to parts make it a diagram."),
                 q("Which two animals BOTH have four legs and fur?", "❓", "a cat and a dog", ["a bird and a fish", "a snake and a frog", "a hen and a duck"], "Cats and dogs both have fur and four legs."),
             ]},
             "That is the whole lesson finished. You can compare animals like a scientist."),
    ],
}
