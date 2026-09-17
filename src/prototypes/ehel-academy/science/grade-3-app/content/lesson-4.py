# -*- coding: utf-8 -*-
"""Lesson 4 - Growing Up.

0097 Stage 3: 3Bp.04 how the offspring of different animals grow into adults
(humans, birds, frogs, butterflies); 3TWSm.01 different types of model
(diagrams and physical models); with 3TWSc.01 and 3TWSc.06.
"""
from _kit import explain, step, opt, q, part, word, home, icon, cando

LESSON = {
    "slug": "growing-up",
    "title": "Growing Up",
    "blurb": "Put a frog's life and a butterfly's life in order, compare them with a chick and a baby, sort animals by how they grow up, and tell a diagram from a physical model.",
    "steps": [
        step("order", "From frogspawn to frog", "\U0001F438", "Frog life", ["3Bp.04"],
             "Tap the stages in the order they happen.",
             explain(
                 ["A frog changes shape completely as it grows.", "It starts as an egg in the water and ends as a frog on land."],
                 ["Frogspawn: hundreds of eggs in jelly.", "A tadpole: a tail, no legs, breathes in water.", "Back legs grow, then front legs.", "A froglet: legs and a short tail.", "A frog: no tail, breathes air."],
                 ["Children think the tadpole is a baby fish.", "It is a baby frog that does not look like a frog yet."],
                 ["Tap what comes first."]),
             {"items": [
                 {"pic": icon("frogspawn"), "label": "frogspawn", "say": "It starts as frogspawn: eggs in jelly, floating in the pond."},
                 {"pic": icon("tadpole"), "label": "tadpole", "say": "A tadpole hatches. It has a tail and no legs, and it breathes in the water."},
                 {"pic": icon("tadpolelegs"), "label": "tadpole with legs", "say": "Back legs grow first, then front legs. The tail starts to shrink."},
                 {"pic": icon("froglet"), "label": "froglet", "say": "A froglet: four legs and a stub of tail. It can climb out of the water."},
                 {"pic": "\U0001F438", "label": "adult frog", "say": "An adult frog. No tail, and it breathes air. It goes back to the pond to lay eggs of its own."},
             ]},
             "Frogspawn, tadpole, legs, froglet, frog. A frog changes shape as it grows."),

        step("order", "From egg to butterfly", "\U0001F98B", "Butterfly life", ["3Bp.04"],
             "Tap the stages in the order they happen.",
             explain(
                 ["A butterfly changes shape completely too, and it does it in four stages."],
                 ["An egg on a leaf.", "A caterpillar that eats and eats.", "A chrysalis, hanging still.", "A butterfly comes out."],
                 ["Children think the caterpillar dies in the chrysalis.", "It is changing inside. It comes out as a butterfly."],
                 ["Tap what comes first."]),
             {"items": [
                 {"pic": "\U0001F343", "label": "egg", "say": "A tiny egg, laid on a leaf."},
                 {"pic": "\U0001F41B", "label": "caterpillar", "say": "A caterpillar hatches and eats leaves all day, growing and growing."},
                 {"pic": icon("chrysalis"), "label": "chrysalis", "say": "It hangs up and becomes a chrysalis. Inside, it is changing completely."},
                 {"pic": "\U0001F98B", "label": "butterfly", "say": "A butterfly comes out, dries its wings, and flies off to lay eggs of its own."},
             ]},
             "Egg, caterpillar, chrysalis, butterfly."),

        step("demo", "Babies and chicks grow bigger", "\U0001F476\U0001F3FE", "Growing bigger", ["3Bp.04"],
             "Not every animal changes shape. Press <b>Next</b> to see a human and a bird grow up.",
             explain(
                 ["A human baby and a chick already look like small versions of the adult.", "They grow bigger and learn new things, but they keep their shape."],
                 ["Baby, child, teenager, adult.", "Egg, chick, fledgling, bird.", "Compare that with tadpole to frog: a whole new shape."],
                 ["Children think all babies look like their parents.", "A caterpillar does not look like a butterfly at all."],
                 ["Press Next through both."]),
             {"frames": [
                 {"pic": "\U0001F476\U0001F3FE", "cap": "A human baby: it cannot walk, talk or feed itself.", "say": "A human baby. It cannot walk or talk, and it drinks milk. But it already has the shape of a person."},
                 {"pic": "\U0001F9D2\U0001F3FE", "cap": "A child: bigger, walking, talking, with teeth.", "say": "A child. Bigger, walking, talking, with teeth. The same shape, grown."},
                 {"pic": "\U0001F9D1\U0001F3FE", "cap": "An adult: fully grown, and able to have children.", "say": "An adult. Fully grown, and able to have children of their own. It took many years."},
                 {"pic": "\U0001F423", "cap": "A chick hatches: fluffy, and fed by its parents.", "say": "A chick hatches from an egg. It is fluffy and its parents feed it. It already has the shape of a bird."},
                 {"pic": "\U0001F426", "cap": "A grown bird: real feathers, and it can fly. Same shape, bigger.", "say": "In a few weeks it has real feathers and can fly. Same shape, bigger. A bird does not change shape like a frog does."},
             ]},
             "Humans and birds grow bigger but keep their shape. Frogs and butterflies change shape completely."),

        step("sort", "Changes shape, or just grows?", "\U0001F5C2️", "How it grows", ["3Bp.04", "3TWSc.01"],
             "Does this baby animal <b>look like a small adult</b>, or does it <b>change shape completely</b>? Tap the bin.",
             explain(
                 ["Two ways to grow up.", "Keep your shape and get bigger, or change into something that looks different."],
                 ["A puppy looks like a small dog: keeps its shape.", "A tadpole looks nothing like a frog: changes shape.", "A caterpillar looks nothing like a butterfly: changes shape."],
                 ["Children think small means baby.", "A small adult animal is not a baby. Look for the change."],
                 ["Picture the baby next to the adult, then tap."]),
             {"ask": "Small adult, or a new shape?",
              "bins": [{"id": "same", "label": "Looks like a small adult", "pic": "\U0001F415"}, {"id": "change", "label": "Changes shape completely", "pic": "\U0001F98B"}],
              "items": [
                  {"pic": "\U0001F436", "label": "puppy", "bin": "same", "why": "A puppy is a small dog. It grows bigger."},
                  {"pic": icon("tadpole"), "label": "tadpole", "bin": "change", "why": "A tadpole grows legs, loses its tail and becomes a frog."},
                  {"pic": "\U0001F41B", "label": "caterpillar", "bin": "change", "why": "A caterpillar becomes a chrysalis, then a butterfly."},
                  {"pic": "\U0001F423", "label": "chick", "bin": "same", "why": "A chick is a small bird. It grows feathers and gets bigger."},
                  {"pic": "\U0001F476\U0001F3FE", "label": "human baby", "bin": "same", "why": "A baby has the shape of a person and grows bigger."},
                  {"pic": "\U0001F40E", "label": "foal", "bin": "same", "why": "A foal is a small horse, standing up within an hour."},
                  {"pic": icon("larva"), "label": "ladybird larva", "bin": "change", "why": "A ladybird larva looks like a tiny crocodile, then changes into a ladybird."},
                  {"pic": "\U0001F431", "label": "kitten", "bin": "same", "why": "A kitten is a small cat."},
              ]},
             "Mammals and birds keep their shape. Frogs, butterflies and ladybirds change it."),

        step("sort", "Diagram, or physical model?", "\U0001F4D0", "Model types", ["3TWSm.01"],
             "Scientists use two kinds of model. Is this a <b>diagram</b> you look at, or a <b>physical model</b> you can touch?",
             explain(
                 ["A model shows an idea clearly. There are two kinds.", "A diagram is a drawing with labels.", "A physical model is a thing you can hold and turn."],
                 ["A labelled drawing of the frog's life cycle: a diagram.", "A plastic butterfly with wings that open: a physical model.", "A globe: a physical model of the Earth."],
                 ["Children think a model has to be small.", "A model is anything that shows the idea and leaves the rest out, any size."],
                 ["Ask: can I hold it, or do I read it?"]),
             {"ask": "Diagram, or physical model?",
              "bins": [{"id": "diagram", "label": "Diagram", "pic": "✏️"}, {"id": "physical", "label": "Physical model", "pic": "\U0001F9F1"}],
              "items": [
                  {"pic": "\U0001F504", "label": "a labelled drawing of the frog's life cycle", "bin": "diagram", "why": "A drawing with labels: a diagram."},
                  {"pic": "\U0001F98B", "label": "a plastic butterfly with wings that open", "bin": "physical", "why": "You can hold it and move it: a physical model."},
                  {"pic": "\U0001F30D", "label": "a globe", "bin": "physical", "why": "A globe is a physical model of the Earth."},
                  {"pic": "\U0001F5FA️", "label": "a map of the pond", "bin": "diagram", "why": "A map is a diagram: a drawing that shows where things are."},
                  {"pic": "\U0001F9B4", "label": "a toy skeleton", "bin": "physical", "why": "A model you can touch and take apart."},
                  {"pic": "➡️", "label": "a food chain drawn with arrows", "bin": "diagram", "why": "Pictures and arrows on paper: a diagram."},
              ]},
             "A diagram you read. A physical model you hold. Both show an idea clearly."),

        step("record", "How long until it is grown?", "\U0001F4CB", "Growing table", ["3TWSc.06", "3Bp.04"],
             "Fill in the table. How long does it take a <b>%s</b> to grow up?",
             explain(
                 ["Different animals take different times to grow up.", "A table lets you compare them."],
                 ["A butterfly: a few weeks.", "A frog: a few months from frogspawn to froglet.", "A human: many years."],
                 [],
                 ["Tap weeks, months or years for each row."]),
             {"ask": "How long does a %s take to grow up?",
              "columns": ["Animal", "Time to grow up"],
              "rows": [
                  {"pic": "\U0001F98B", "label": "butterfly", "answer": "weeks", "why": "egg to butterfly takes only a few weeks."},
                  {"pic": "\U0001F438", "label": "frog", "answer": "months", "why": "frogspawn to froglet: a few months."},
                  {"pic": "\U0001F9D1\U0001F3FE", "label": "human", "answer": "years", "why": "a person takes many years to become an adult."},
              ],
              "choices": [{"id": "weeks", "t": "a few weeks", "pic": "\U0001F4C5"}, {"id": "months", "t": "a few months", "pic": "\U0001F5D3️"}, {"id": "years", "t": "many years", "pic": "\U0001F382"}],
              "read": [
                  {"ask": "Read your table. Which animal takes the longest to grow up?",
                   "opts": [opt("the human", True), opt("the butterfly", False), opt("the frog", False)],
                   "why": "Weeks for the butterfly, months for the frog, years for the human."},
                  {"ask": "Put your three rows in order, quickest first. What is the pattern?",
                   "opts": [opt("the bigger the animal, the longer it takes", True), opt("the smaller the animal, the longer it takes", False), opt("there is no pattern", False)],
                   "why": "Butterfly, frog, human: weeks, months, years. Bigger animals generally take longer to grow up."},
              ]},
             "Weeks, months, years. Every animal grows up at its own speed."),

        step("questions", "Growing up check", "✅", "Growing check", ["3Bp.04", "3TWSm.01"],
             "Tap the answer.",
             explain(
                 ["Two ways to grow up, and two kinds of model."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What hatches from frogspawn?", icon("frogspawn"), "a tadpole", ["a froglet", "a fish", "a frog"], "A tadpole, with a tail and no legs."),
                 q("What comes out of a chrysalis?", icon("chrysalis"), "a butterfly", ["a caterpillar", "an egg"], "The caterpillar changed inside it."),
                 q("Which baby looks like a small version of its parent?", "\U0001F423", "a chick", ["a tadpole", "a caterpillar"], "A chick is a small bird."),
                 q("A globe is which kind of model?", "\U0001F30D", "a physical model", ["a diagram", "not a model"], "You can hold it and turn it."),
                 q("A drawing of the butterfly's life cycle with labels is...", "✏️", "a diagram", ["a physical model", "a photograph"], "Labels on a drawing: a diagram."),
                 q("A caterpillar and a butterfly. How many animals is that?", "\U0001F98B", "one animal, at two stages of its life", ["two different animals", "three, counting the egg as another one"],
                   "Some animals change shape completely as they grow, like a tadpole into a frog. It is one animal all the way through."),
             ],
              "support": [
                 q("Does a tadpole have legs when it hatches?", "\U0001F438", "No", ["Yes"],
                   "A tadpole hatches with a tail and no legs."),
                 q("Is a diagram a kind of model?", "\U0001F4D0", "Yes", ["No"],
                   "A diagram is a model drawn flat on paper."),
                 q("Does a butterfly lay eggs?", "\U0001F98B", "Yes", ["No"],
                   "It does, and that is where the life cycle starts again."),
                 q("Is a model always smaller than the real thing?", "\U0001F4D0", "No", ["Yes"],
                   "A model of a tiny thing is usually made much bigger, so you can see it."),
              ],
              "extension": [
                 q("A caterpillar eats until it is many times its hatching size, then eats nothing at all inside the chrysalis. What was that food for?", "\U0001F37D\uFE0F", "building the butterfly's new body", ["keeping the chrysalis warm", "feeding the eggs it has already laid"],
                   "Nothing feeds inside a chrysalis. Everything the butterfly is built from was eaten before it went in."),
                 q("Why is a life-cycle diagram usually drawn as a circle rather than a line?", "\u267B\uFE0F", "because the cycle starts again with the next generation's eggs", ["because circles are easier to draw", "because the animal goes backwards at the end"],
                   "A line has an end. A life cycle does not: the adult lays the eggs the cycle began with."),
                 q("A tadpole breathes with gills and a frog with lungs. What has to happen in between?", "\U0001F438", "its body changes completely as it grows", ["it holds its breath for weeks", "nothing changes - frogs have gills too"],
                   "Changing shape as you grow means changing the inside as well as the outside."),
                 q("A butterfly lives only a few weeks as an adult. What does that tell you the adult stage is FOR?", "\U0001F98B", "finding a mate and laying eggs", ["eating as much as possible", "growing to full size"],
                   "The eating and growing were the caterpillar's job. The adult has one task left."),
              ]},
             "You know how animals grow up.",
             mis=["4.2-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Bp.04", "3TWSm.01", "3TWSc.06"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Put these in order: tadpole, frog, frogspawn.", "\U0001F438", "frogspawn, tadpole, frog", ["frog, tadpole, frogspawn", "tadpole, frogspawn, frog"], "Egg first, then tadpole, then frog."),
                 q("Which legs grow first on a tadpole?", icon("froglet"), "the back legs", ["the front legs", "all four at once"], "Back legs first, then front."),
                 q("What does a caterpillar do all day?", "\U0001F41B", "eat leaves and grow", ["fly", "sleep in the pond"], "Eating is its whole job."),
                 q("Which animal changes shape completely as it grows?", "\U0001F98B", "a butterfly", ["a puppy", "a chick", "a human"], "Egg, caterpillar, chrysalis, butterfly."),
                 q("How does a human baby become an adult?", "\U0001F9D1\U0001F3FE", "it grows bigger over many years, keeping its shape", ["it becomes a chrysalis", "it grows a tail and loses it"], "Same shape, bigger, over years."),
                 q("Which takes longest to grow up?", "\U0001F382", "a human", ["a butterfly", "a frog"], "Many years."),
                 q("A toy skeleton you can take apart is...", "\U0001F9B4", "a physical model", ["a diagram", "a fair test"], "A model you can touch."),
                 q("Why do scientists use models?", "\U0001F4D0", "to show an idea clearly, leaving the rest out", ["to make things look pretty", "because real things are boring"], "A model shows the important idea."),
                 q("A caterpillar and a butterfly look nothing alike. Why do we say they are the same kind of animal?", "\U0001F41B", "the caterpillar grows and changes into the butterfly", ["they live on the same leaf", "they are both green"], "It is one life: egg, caterpillar, chrysalis, butterfly."),
                 q("A tadpole has just grown its back legs. Predict what will happen next.", "\U0001F914", "its front legs grow, then its tail shrinks", ["it turns back into frogspawn", "it grows wings"], "Back legs, then front legs, then the tail shrinks and it becomes a froglet."),
                 q("Why is a physical model better than a diagram for showing how a skeleton's joints bend?", "\U0001F9B4", "you can hold it and move the joints", ["a physical model always has labels", "a diagram cannot show bones at all"], "A diagram is flat. A physical model can be turned and moved."),
             ],
              "support": [
                 q("What hatches out of a butterfly's egg?", "\U0001F41B", "a caterpillar", ["a butterfly"],
                   "Egg, caterpillar, chrysalis, butterfly."),
                 q("Does a kitten drink milk?", "\U0001F431", "Yes", ["No"],
                   "Mammals feed their young on milk."),
                 q("Does a frog lay its eggs in water?", "\U0001F95A", "Yes", ["No"],
                   "In water, where the tadpoles hatch."),
                 q("Which grows up faster, a mouse or a human?", "\U0001F42D", "a mouse", ["a human"],
                   "A mouse is grown up in weeks. A human takes many years."),
              ],
              "extension": [
                 q("A frog lays hundreds of eggs and a human has one baby at a time. Why the difference?", "\U0001F438", "most frogspawn is eaten before it grows up, so a frog needs a great many", ["frogs are better parents", "human babies are bigger"],
                   "An animal that guards and feeds its young can have very few. One that leaves its eggs has to lay hundreds for a few to survive."),
                 q("A chick looks much like a small hen, but a caterpillar looks nothing like a butterfly. Why the difference?", "\U0001F423", "some animals change shape as they grow and some only get bigger", ["the chick is older than the caterpillar", "hens have no life cycle"],
                   "Both are life cycles. In some the young is a small version of the adult; in others it is a completely different shape."),
                 q("An animal that looks after its young can manage with far fewer of them. Why?", "\U0001F423", "more of each batch survives, so fewer are needed", ["looked-after young grow more slowly", "it makes no difference how many"],
                   "A frog leaves its eggs and loses most of them. A bird guards its few and keeps them."),
                 q("If you keep animals, why is it useful to know how long each takes to grow up?", "\U0001F433", "you know when it will need different food and different care", ["so you can tell its birthday", "it is not useful at all"],
                   "A growing animal's needs change. Knowing the stages is knowing what to give it, and when."),
              ]},
             "That is the whole lesson finished. You know how animals grow up."),
    ],
}

LESSON["about"] = [
    "Put the stages of a frog's life and a butterfly's life in order.",
    "Compare how humans, birds, frogs and butterflies grow up.",
    "Sort baby animals by whether they keep their shape or change it.",
    "Tell a diagram from a physical model.",
]

LESSON["warmup"] = [
    q("Which group does a frog belong to?", "\U0001F438", "amphibians", ["reptiles", "fish"], "Smooth damp skin and a start in water: an amphibian."),
    q("How many legs does a butterfly have?", "\U0001F98B", "six", ["four", "eight"], "A butterfly is an insect, and every insect has six legs."),
    q("Which of these was never alive: a leaf, a shell, or a glass bottle?", "\U0001F37E", "the glass bottle", ["the leaf", "the shell"],
      "A leaf and a shell were both part of a living thing. Glass never was."),
]

LESSON["lecture"] = [
    part(icon("frogspawn"), "The frog",
         "A frog starts as an egg in jelly, floating in a pond. A tadpole hatches, with a tail and no legs. Back legs grow, then front legs, the tail shrinks, and a frog climbs out onto the land."),
    part("\U0001F41B", "The butterfly",
         "A butterfly starts as a tiny egg on a leaf. A caterpillar hatches and eats and eats. Then it hangs up as a chrysalis, changes completely inside, and comes out as a butterfly."),
    part("\U0001F476\U0001F3FE", "Babies and chicks",
         "A human baby cannot walk or talk, but it already has the shape of a person. It grows bigger for many years. A chick hatches fluffy and grows feathers in weeks. Same shape, bigger."),
    part("\U0001F504", "Two ways to grow up",
         "So there are two ways to grow up. Keep your shape and get bigger, like a puppy or a chick. Or change shape completely, like a tadpole or a caterpillar."),
    part("\U0001F4D0", "Two kinds of model",
         "A drawing of the frog's life cycle with labels is a diagram. A plastic frog you can hold is a physical model. Both are models: they show the idea clearly and leave the rest out."),
]

LESSON["words"] = [
    word("offspring", "\U0001F423", "An animal's young.",
         ["A frog's offspring are tadpoles.", "Offspring grow into adults."]),
    word("tadpole", icon("tadpole"), "A baby frog: a tail, no legs, and it lives in water.",
         ["A tadpole hatches from frogspawn.", "The tadpole grew back legs."]),
    word("chrysalis", icon("chrysalis"), "The hard case a caterpillar changes inside to become a butterfly.",
         ["The caterpillar became a chrysalis.", "A butterfly came out of the chrysalis."]),
    word("life cycle", "\U0001F504", "The stages an animal goes through from egg or baby to adult.",
         ["The frog's life cycle has five stages.", "Draw the life cycle of a butterfly."]),
    word("adult", "\U0001F9D1\U0001F3FE", "A fully grown animal that can have young of its own.",
         ["An adult frog lays eggs.", "It takes years to become an adult."]),
    word("diagram", "✏️", "A drawing with labels that shows an idea.",
         ["A life cycle diagram has arrows.", "Label your diagram."]),
    word("physical model", "\U0001F9F1", "A model you can touch and hold, like a globe or a toy skeleton.",
         ["A globe is a physical model.", "We made a physical model of a frog."]),
    word("caterpillar", "\U0001F41B", "The young stage of a butterfly or a moth.",
         ["A caterpillar hatches out of an egg.", "The caterpillar is the same animal as the butterfly."]),
    word("hatch", "\U0001F423", "To break out of an egg.",
         ["A chick hatches out of its egg.", "The caterpillar hatched after five days."]),
    word("baby", "\U0001F476", "An animal soon after it is born.",
         ["A baby grows into a child.", "A baby elephant is called a calf."]),
]

LESSON["cando"] = [
    cando("I can describe and compare how different animals grow up.", "3Bp.04"),
    cando("I can put the stages of a life cycle in order.", "3Bp.04"),
    cando("I can use a diagram to show how a life cycle works.", "3TWSm.01"),
    cando("I can sort animals by the way they grow up.", "3TWSc.01"),
    cando("I can record what I found in a table.", "3TWSc.06"),
]

LESSON["home"] = [
    home("Watch tadpoles", "A pond with frogspawn, when frogs lay eggs (spring, or the rainy season), a grown-up, a notebook. Look, do not take.",
         ["Visit the same pond every week. Stand back from the edge. A grown-up stays beside you.",
          "Draw what you see: spawn, tadpoles, legs, froglets.",
          "Write the date on each drawing."],
         "How many weeks from spawn to froglet? That is observing over time."),
    home("Caterpillar hunt", "Cabbages or other garden plants, a grown-up, a magnifying glass",
         ["With a grown-up, look under leaves for eggs, caterpillars or a chrysalis. Keep away from nettles: they sting.",
          "Do not touch hairy caterpillars. Draw what you find and leave it where it is.",
          "Come back in a week and look again. Wash your hands afterwards."],
         "Nibbled leaves are the clue. Which stage did you find?"),
    home("Make a physical model", "Play dough or paper, a pencil",
         ["Make the four stages of a butterfly's life out of play dough: egg, caterpillar, chrysalis, butterfly.",
          "Put them in a circle with arrows drawn between them.",
          "Now draw the same circle on paper with labels."],
         "You made a physical model and a diagram of the same idea."),
]
