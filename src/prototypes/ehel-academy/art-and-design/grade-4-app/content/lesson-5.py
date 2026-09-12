# -*- coding: utf-8 -*-
"""Lesson 5 - Build It Strong.

0067 Stage 4: M.02 the progression text's own example, word for word -
"learners recognise that the parts of a model that come under stress will need
to be made of thicker cardboard" - and its second, "a photographic diary of
sculptural development ... to revise construction techniques for model making
in a later project"; M.01 judge a material against the job; TWA.01 build for a
purpose and explain the stages; TWA.03 review a model that failed, with
others; E.03 record the build as it happens. The step up from Grade 2 and
Grade 3: Grade 2 made a sculpture stand up, Grade 3 built a relief on a flat
tile; Grade 4 asks WHERE the force goes, and builds that part strongest.
"""
from _kit import explain, step, opt, q, spot, material, change, part, word, home

LESSON = {
    "slug": "build-it-strong",
    "title": "Build It Strong",
    "blurb": "Watch a model fail and be fixed, read a figure built on a wire skeleton, sort strong shapes from weak ones, choose the material for each part, mend three models, and keep a photo diary of a build.",
    "steps": [
        step("demo", "Why it fell over", "🏗️", "Build watcher", ["4M.02", "4M.01"],
             "Press <b>Next</b> and watch a model fail, then get stronger.",
             explain(
                 ["Every model has parts that carry weight. Those parts are under stress."],
                 ["A single flat piece of card bends at once.",
                  "Fold it, or roll it into a tube, and the same card holds.",
                  "A wire inside lets a thin part stand.",
                  "A wide base stops the whole thing tipping."],
                 ["Children make everything out of the same thin card and wonder why it sags.",
                  "Make the part that carries the weight thicker or folded."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "📄", "cap": "One flat piece of card, standing up. It <b>bends</b> straight away.", "say": "One flat piece of card, standing up. It bends straight away."},
                 {"pic": "📐", "cap": "<b>Fold</b> the same card into a triangle. Now it holds.", "say": "Fold the same card into a triangle. Now it holds.", "sound": "click"},
                 {"pic": "🧻", "cap": "Roll it into a <b>tube</b>: stronger still, and it carries weight on top.", "say": "Roll it into a tube. Stronger still, and it carries weight on top."},
                 {"pic": "➰", "cap": "A <b>wire</b> inside a thin arm lets it stand out from the body.", "say": "A wire inside a thin arm lets it stand out from the body."},
                 {"pic": "⬛", "cap": "A <b>wide, heavy base</b>, and the whole model stops tipping.", "say": "A wide, heavy base, and the whole model stops tipping."},
             ]},
             "Fold it, roll it, put wire inside it, sit it on a wide base."),

        step("source", "A figure on a wire skeleton", "🦴", "Model reader", ["4M.02", "4E.03"],
             "This model is built on a wire skeleton, called an armature. Tap the parts to find out how it stands.",
             explain(
                 ["An armature is the skeleton inside a model. You build the body around it."],
                 ["Tap the wire arm: it holds a thin part out in the air.",
                  "Tap the head: light, so the model is not top-heavy.",
                  "Tap the legs, where the card is doubled, and the base."],
                 ["Children build the outside first and then wonder what holds it up.",
                  "The skeleton comes first."],
                 ["Tap three things and listen."]),
             {"scene": "armature", "need": 3, "caption": "Tap the wire arm, the head, the thick legs and the base.",
              "spots": [
                  spot("wire", "the wire arm", "A wire arm holds itself out in the air. Card that thin would flop straight down.", 120, 92, "➰"),
                  spot("head", "the head", "A loop of wire with a light paper ball in it. The head is made light on purpose: a heavy head high up makes the whole model want to fall.", 160, 40, "🙂"),
                  spot("legs", "the thick legs", "The legs carry the whole model, so the card here is doubled: two layers instead of one.", 139, 170, "💪"),
                  spot("base", "the base", "A wide base spreads the weight and stops the model tipping over.", 200, 192, "⬛"),
              ],
              "then": {"ask": "Why is the card doubled at the legs?",
                       "opts": [{"t": "because the legs carry the weight, so they are under the most stress", "spot": "legs"}, {"t": "because it looks better"}, {"t": "to use up spare card"}],
                       "why": "The part under the most stress is the part you build strongest."}},
             "You found the wire, the light head, the doubled legs and the base."),

        step("sort", "Strong or weak?", "🗂️", "Strength sorter", ["4M.01", "4M.02"],
             "Same card, different shapes. Which of these holds, and which gives way? Tap the bin.",
             explain(
                 ["Strength is not only what a thing is made of. It is the SHAPE you make it."],
                 ["Flat and tall: weak. It bends at once.",
                  "Folded, rolled or triangular: strong.",
                  "Wide at the bottom: steady. Narrow at the bottom: tippy."],
                 ["Children add more tape.", "Change the shape instead."],
                 ["Read it, then tap the bin."]),
             {"ask": "Does it hold up, or give way?",
              "bins": [{"id": "strong", "label": "Holds up", "pic": "💪"}, {"id": "weak", "label": "Gives way", "pic": "🫠"}],
              "items": [
                  {"pic": "📄", "label": "one flat sheet of card standing on its edge", "bin": "weak", "why": "Flat and tall gives way at once."},
                  {"pic": "🧻", "label": "the same card rolled into a tube", "bin": "strong", "why": "A tube carries far more than a flat sheet."},
                  {"pic": "📐", "label": "card folded into a triangle", "bin": "strong", "why": "A triangle cannot squash out of shape."},
                  {"pic": "🔲", "label": "a tall tower that topples when you nudge it", "bin": "weak", "why": "Tall and narrow at the bottom. It gives way at the first nudge."},
                  {"pic": "⬛", "label": "a model on a wide, heavy base", "bin": "strong", "why": "A wide base spreads the weight."},
                  {"pic": "🥤", "label": "legs made of rolled paper straws", "bin": "strong", "why": "Tubes again: a straw holds more than flat paper."},
                  {"pic": "🎈", "label": "a heavy head on a thin neck", "bin": "weak", "why": "Weight high up on a thin part is where models break."},
              ]},
             "You sorted seven builds into strong and weak."),

        step("choose", "The right stuff for the part", "🧰", "Material chooser", ["4M.01", "4M.02"],
             "Each part of a model needs something different. Tap what fits.",
             explain(
                 ["Choose a material for what the part has to DO, not for what is nearest."],
                 ["Thick card holds weight.", "Wire bends and stays bent, so it holds a pose.",
                  "Thin paper is light, for parts that must not add weight up high.",
                  "Masking tape makes a hinge that can move."],
                 ["Children use thick card everywhere and the model gets heavy and top-heavy."],
                 ["Read the part, then tap."]),
             {"materials": [
                 material("thick", "Thick card", "🟫", ["holds weight"], "Thick card holds weight without bending."),
                 material("wire", "Wire", "➰", ["holds a pose"], "Wire bends and stays where you bend it."),
                 material("thin", "Thin paper", "📄", ["light"], "Thin paper adds almost no weight."),
                 material("tape", "Masking tape", "🩹", ["bends and holds"], "A tape hinge lets two pieces move and stay joined."),
                ],
              "rounds": [
                  {"purpose": "the legs, which carry the whole model", "needs": "holds weight", "pic": "🦵", "why": "The legs are under the most stress, so they get the strongest material."},
                  {"purpose": "an arm that has to point out into the air", "needs": "holds a pose", "pic": "💪", "why": "Wire holds a pose. Card that thin would flop."},
                  {"purpose": "a flag high up at the very top", "needs": "light", "pic": "🚩", "why": "Weight up high tips a model. Keep the top light."},
                  {"purpose": "a door that has to open and shut", "needs": "bends and holds", "pic": "🚪", "why": "A tape hinge bends again and again without coming apart."},
              ]},
             "You chose a material for four parts, each for its own reason."),

        step("refine", "Three models that failed", "🔧", "Model mender", ["4TWA.03", "4M.02", "4R.02"],
             "Each model went wrong in its own way. Work out where the force is going, then tap the change that fixes it.",
             explain(
                 ["A model fails at the part under the most stress. Find that part first."],
                 ["Bending in the middle: the card is too thin there.",
                  "Tipping forward: the base is too small for what is above it.",
                  "A wobbly joint: nothing is stopping it folding up."],
                 ["Children wrap the whole thing in tape.",
                  "Fix the one part the force is going through."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "Ama's giraffe", "pic": "🫠", "fixedPic": "🦒", "problem": "The long neck bends over in the middle.", "fixed": "The neck holds its head up."},
                  "needs": "stiffen",
                  "changes": [
                      change("roll", "Roll the neck into a tube, with a wire inside it", "🧻", "stiffen", "A tube with wire inside is stiff. The neck holds."),
                      change("tape", "Wrap tape round the bend", "🩹", "worse", "Tape round a bend does not stop it bending again."),
                      change("shorter", "Cut the neck shorter", "✂️", "add", "Now it holds, but it is not a giraffe any more."),
                      change("paint", "Paint it a stronger colour", "🎨", "colour", "Colour changes nothing about the bending."),
                  ],
                  "why": "A thin flat part bends. Roll it, fold it, or put wire inside."},
                 {"piece": {"title": "Hugo's tower", "pic": "🗼", "fixedPic": "🏢", "problem": "It tips forward whenever anyone walks past.", "fixed": "It stands steady."},
                  "needs": "base",
                  "changes": [
                      change("base", "Stand it on a wide, heavy base", "⬛", "base", "A wide, heavy base spreads the weight and stops it tipping."),
                      change("taller", "Build it taller", "⬆️", "worse", "Taller and tippier."),
                      change("thin", "Make the top heavier", "🪨", "worse", "Weight up high is exactly what tips it over."),
                      change("tape", "Tape it to the wall", "🩹", "add", "It is held up by the wall, not by itself."),
                  ],
                  "why": "Tipping is about the base, not the top."},
                 {"piece": {"title": "Sofia's chair", "pic": "🪑", "fixedPic": "💺", "problem": "The legs fold up sideways when anything is put on it.", "fixed": "The legs hold firm."},
                  "needs": "brace",
                  "changes": [
                      change("triangle", "Add a card triangle across each corner", "📐", "brace", "A triangle cannot squash out of shape, so the corner holds."),
                      change("glue", "Add more glue to the joints", "🧴", "worse", "A glued joint can still fold. The shape is what gives way."),
                      change("legs", "Make the legs longer", "📏", "worse", "Longer legs fold more easily."),
                      change("cushion", "Add a cushion on top", "🛋️", "add", "More weight on legs that already fold."),
                  ],
                  "why": "A square folds; a triangle does not. That is what a brace is for."},
             ]},
             "You found where the force was going in three models, and fixed each one."),

        step("order", "Keep a photo diary", "📷", "Build recorder", ["4E.03", "4M.02", "4TWA.01"],
             "Photographs of a build are notes you can use next time. Tap the steps in order.",
             explain(
                 ["A model gets covered up as you build it. A photo keeps what is underneath."],
                 ["Photograph the skeleton before the body hides it.",
                  "Photograph each stage as you go.",
                  "Write beside each photo what you changed and why.",
                  "Read the diary before your NEXT build, and do the fix from the start."],
                 ["Children take one photo of the finished model.",
                  "The useful photos are the ones of the stages nobody can see any more."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "✏️", "label": "sketch the plan", "say": "First, sketch your plan in your journal."},
                 {"pic": "🦴", "label": "photograph the skeleton", "say": "Photograph the armature before the body covers it up."},
                 {"pic": "📸", "label": "photograph each stage", "say": "Photograph each stage as you build."},
                 {"pic": "📝", "label": "write what you changed and why", "say": "Beside each photo, write what you changed and why you changed it."},
                 {"pic": "🔍", "label": "look back before the next build", "say": "Before your next model, read the diary: last time's fix becomes this time's plan."},
             ]},
             "Plan, photograph the skeleton, photograph the stages, write why, and use it next time."),

        step("questions", "Strength spotter", "💬", "Strength spotter", ["4M.01", "4M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about building strong.", "You have met every one of them."],
                 ["Think about stress, shapes, armatures and bases."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Building", "items": [
                 q("An armature is…", "🦴", "the skeleton inside a model", ["the paint on the outside", "a kind of glue"], "You build the body around the armature."),
                 q("Which shape is strongest?", "📐", "a triangle", ["a flat sheet standing on its edge", "a square that can fold"], "A triangle cannot squash out of shape."),
                 q("A model tips over. What do you change?", "⬛", "the base", ["the colour", "the name"], "Tipping is about the base."),
                 q("Which part needs the thickest card?", "🦵", "the part carrying the weight", ["the flag at the top", "the smallest part"], "Thickest where the stress is."),
             ]},
             "You know how to make a model stand up."),

        step("quiz", "Show what you know", "⭐", "Star builder", ["4E.03", "4M.01", "4M.02", "4R.02", "4TWA.01", "4TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about stress, folds and tubes, wire, bases and the photo diary."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Parts of a model that come under stress should be…", "💪", "thicker or folded", ["thinner", "painted"], "Build the part under stress strongest."),
                 q("Why does rolling card into a tube make it stronger?", "🧻", "because a curved shape cannot bend as easily as a flat one", ["because it gets heavier", "because tubes are magic"], "The shape does the work."),
                 q("What is wire for in a model?", "➰", "holding a thin part out in a pose", ["making it heavier", "colouring it"], "Wire bends and stays bent."),
                 q("Why keep the top of a tall model light?", "🚩", "because weight high up makes it tip", ["because light things cost less", "because tops must be paper"], "Weight up high tips a model over."),
                 q("Why photograph the skeleton before you cover it?", "📸", "because once the body is on, nobody can see how it was built", ["because photos are fun", "so it dries faster"], "A photo keeps what is hidden later."),
                 q("A square corner folds up. What fixes it?", "📐", "a triangle brace across the corner", ["more glue", "longer legs"], "A triangle cannot fold."),
                 q("What is a photo diary of a build FOR?", "🔍", "so the next build starts with what you learned", ["so it looks tidy", "so you can throw the model away"], "Last time's fix becomes this time's plan."),
                 q("Which model is steadiest?", "⬛", "a model on a wide, heavy base", ["a tall model on a narrow bottom", "a model taped to a wall"], "A wide base spreads the weight."),
             ]},
             "That is the whole lesson finished. You can build a model that stands up, and say why it does."),
    ],
}


LESSON["about"] = [
    "Say which parts of a model are under stress.",
    "Tell a strong shape from a weak one.",
    "Choose a material for what a part has to do.",
    "Mend a model that bends, tips or folds.",
    "Keep a photo diary of a build, and use it next time.",
]

LESSON["lecture"] = [
    part("🏗️", "Where the force goes",
         "Every model has parts that carry weight: the legs of a figure, the bottom of a tower, the neck under a heavy head. Those parts are under stress, and they are the parts you build strongest."),
    part("📐", "Shape is strength",
         "The same card is weak flat and strong folded. A tube carries weight. A triangle cannot squash out of shape. Before you reach for more tape, change the shape."),
    part("🦴", "The skeleton first",
         "An armature is the wire skeleton inside. Bend it into the pose, then build the body around it. A thin arm held out in the air needs wire inside, or it flops."),
    part("📷", "A diary of the build",
         "Photograph the skeleton before the body hides it, and each stage as you go, with a note of what you changed and why. Read it before the next model, and last time's fix becomes this time's plan."),
]

LESSON["words"] = [
    word("armature", "🦴", "The skeleton inside a model, usually wire.",
         ["I bent an armature first.", "The armature holds the pose."]),
    word("stress", "💪", "The pull or push on a part that is carrying weight.",
         ["The legs are under the most stress.", "That joint takes a lot of stress."]),
    word("brace", "📐", "A piece added across a corner to stop it folding.",
         ["I braced each corner with a triangle.", "A brace makes the frame rigid."]),
    word("base", "⬛", "The bottom a model stands on.",
         ["A wide base stops it tipping.", "I weighted the base."]),
    word("top-heavy", "🎈", "Heavier at the top than the bottom, so it tips.",
         ["The model was top-heavy.", "A heavy head makes it top-heavy."]),
    word("construction", "🏗️", "Building something out of separate parts.",
         ["My construction has six parts.", "This is a construction, not a carving."]),
]

LESSON["home"] = [
    home("Paper tower", "Five sheets of paper, tape and a book",
         ["Build the tallest tower you can that holds the book.",
          "Try flat sheets, then folded ones, then rolled tubes.",
          "Photograph each try."],
         "Which shape held the book, and which gave way?"),
    home("A wire figure", "Garden wire or pipe cleaners, foil, tape and a card base",
         ["Bend a wire skeleton with two legs, two arms and a head.",
          "Stand it on a card base and make the base wide.",
          "Wrap foil round the body, leaving the wire showing at the arms."],
         "What happened when you made the head bigger?"),
    home("A photo diary", "A camera or a tablet, and anything you are making",
         ["Photograph your build at the start, in the middle and at the end.",
          "Write one line beside each photo: what you changed and why.",
          "Keep it with your journal."],
         "What would you do differently next time?"),
]

LESSON["journal"] = {
    "changes": ["roll it into a tube", "make the base wider", "put wire inside", "brace the corners", "keep it just as it is"],
}
