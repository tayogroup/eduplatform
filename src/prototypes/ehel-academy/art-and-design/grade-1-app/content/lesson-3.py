# -*- coding: utf-8 -*-
"""Lesson 3 - Feel the Texture.

0067 Stage 1: E.01 encounter texture as a formal element; E.02 touch, feel
and experience materials and begin to understand their properties; E.03
gather by sorting (rough, smooth, soft) and record by rubbing; M.02 choose a
material for a purpose from a prepared selection ("materials that show
different textures, e.g. hard, soft, squashy"); TWA.02 investigate "the
creation of different textures of paint by adding rice, flour, sugar, water"
- Cambridge's own example, computed by the kit's own table.
"""
from _kit import explain, step, opt, q, part, word, home, material

LESSON = {
    "slug": "feel-the-texture",
    "title": "Feel the Texture",
    "blurb": "Find out what texture is, sort rough from smooth from soft, make a rubbing, put rice and flour and sugar and water in the paint to see what happens, and choose the right material for the job.",
    "steps": [
        step("explore", "Touch and feel", "🖐️", "Texture toucher", ["1E.02", "1E.01"],
             "Texture is how a thing FEELS. Tap each one to hear about its texture.",
             explain(
                 ["Texture is how something feels when you touch it.", "Rough, smooth, soft, bumpy, squashy, hard."],
                 ["Tree bark is rough.", "Glass is smooth.", "Wool is soft.", "Bubble wrap is bumpy.",
                  "A sponge is squashy.", "A stone is hard."],
                 ["Children say what colour a thing is instead of how it feels.", "Close your eyes and imagine touching it."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🪵", "label": "rough", "say": "Rough. Tree bark is rough. It scratches your fingers a little.", "sound": "rustle"},
                 {"pic": "🪟", "label": "smooth", "say": "Smooth. Glass is smooth. Your finger slides right across it.", "sound": "swish"},
                 {"pic": "🧶", "label": "soft", "say": "Soft. Wool is soft. It squashes gently under your hand.", "sound": "dab"},
                 {"pic": "🫧", "label": "bumpy", "say": "Bumpy. Bubble wrap is bumpy. Lots of little hills.", "sound": "pop"},
                 {"pic": "🧽", "label": "squashy", "say": "Squashy. A sponge is squashy. Press it and it goes in, then comes back.", "sound": "squelch"},
                 {"pic": "🪨", "label": "hard", "say": "Hard. A stone is hard. It does not squash at all.", "sound": "knock"},
             ], "need": 6,
              "then": {"ask": "Which word means how a thing FEELS?",
                       "opts": [opt("texture", True), opt("colour", False), opt("line", False)],
                       "why": "Texture is how a thing feels. Colour is how it looks."}},
             "Rough, smooth, soft, bumpy, squashy, hard. Those are textures."),

        step("sort", "Rough, smooth or soft?", "🗂️", "Texture sorter", ["1E.03", "1E.01"],
             "How does it feel? Tap the bin.",
             explain(
                 ["Sorting by texture is gathering what you notice with your hands.", "Rough scratches. Smooth slides. Soft squashes."],
                 ["Sandpaper is rough.", "A mirror is smooth.", "A kitten is soft."],
                 ["Children think everything hard is rough.", "A mirror is hard AND smooth. Think about your finger sliding on it."],
                 ["Imagine touching it, then tap the bin."]),
             {"ask": "Rough, smooth or soft?",
              "bins": [{"id": "rough", "label": "Rough", "pic": "🪵"}, {"id": "smooth", "label": "Smooth", "pic": "🪟"}, {"id": "soft", "label": "Soft", "pic": "🧶"}],
              "items": [
                  {"pic": "🧻", "label": "sandpaper", "bin": "rough", "why": "Sandpaper is gritty and rough."},
                  {"pic": "🪞", "label": "a mirror", "bin": "smooth", "why": "Your finger slides on a mirror. Smooth."},
                  {"pic": "🐱", "label": "a kitten", "bin": "soft", "why": "Kitten fur squashes gently. Soft."},
                  {"pic": "🧱", "label": "a brick", "bin": "rough", "why": "A brick scratches your fingers. Rough."},
                  {"pic": "🥄", "label": "a spoon", "bin": "smooth", "why": "A metal spoon is smooth and shiny."},
                  {"pic": "🛏️", "label": "a pillow", "bin": "soft", "why": "A pillow squashes. Soft."},
                  {"pic": "🌰", "label": "tree bark", "bin": "rough", "why": "Bark is bumpy and scratchy. Rough."},
                  {"pic": "🧊", "label": "an ice cube", "bin": "smooth", "why": "Ice is slippery and smooth."},
              ]},
             "You sorted by how things feel. That is texture."),

        step("demo", "Make a rubbing", "🖍️", "Rubbing maker", ["1E.03", "1E.02"],
             "A rubbing shows a texture on paper. Press <b>Next</b> and watch how.",
             explain(
                 ["A rubbing is a way of recording a texture.", "You do not draw it. You let the texture draw itself."],
                 ["Put thin paper over something bumpy, like a leaf or a coin.", "Rub the SIDE of a crayon over it, gently.",
                  "The bumps come through. The rest stays pale."],
                 ["Children press the crayon point hard and tear the paper.", "Use the side of the crayon, and rub softly."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🍃", "cap": "Find something bumpy. A <b>leaf</b> has lines and bumps.", "say": "Find something bumpy. A leaf has lines and bumps."},
                 {"pic": "📄", "cap": "Put thin <b>paper</b> on top of it.", "say": "Put thin paper on top of it.", "sound": "rustle"},
                 {"pic": "🖍️", "cap": "Rub the <b>side</b> of a crayon over the paper. Gently!", "say": "Rub the side of a crayon over the paper. Gently!", "sound": "swish"},
                 {"pic": "🌿", "cap": "The bumps come through. The leaf drew itself.", "say": "The bumps come through. The leaf drew itself.", "sound": "tada"},
                 {"pic": "📒", "cap": "Stick it in your <b>journal</b>. That is a texture, recorded.", "say": "Stick it in your journal. That is a texture, recorded.", "sound": "ding"},
             ]},
             "A rubbing records a texture. The bumps draw themselves."),

        step("experiment", "What does it do to the paint?", "🧪", "Paint scientist", ["1TWA.02", "1E.02"],
             "We put things IN the paint. Guess what the paint will be like, then add it and look.",
             explain(
                 ["Paint does not have to be smooth.", "Artists put things in it to change how it feels."],
                 ["Rice makes paint bumpy.", "Flour makes it thick.", "Sugar makes it gritty.", "Water makes it runny.",
                  "Guess first. Then add it. Then look."],
                 ["Children say what they hope, not what they see.", "Look at the paint AFTER. Say what is really there."],
                 ["Tap your guess, then press Add."]),
             {"colour": "blue",
              "rounds": [
                  {"additive": "rice", "pic": "🍚", "opts": ["bumpy", "runny", "thick"], "why": "Every grain of rice makes a little bump."},
                  {"additive": "flour", "pic": "🌾", "opts": ["thick", "gritty", "runny"], "why": "Flour soaks up the wet and makes the paint thick, like cake mix."},
                  {"additive": "sugar", "pic": "🍬", "opts": ["gritty", "bumpy", "shiny"], "why": "Sugar grains are tiny and hard, so the paint feels gritty, like sand."},
                  {"additive": "water", "pic": "💧", "opts": ["runny", "thick", "bumpy"], "why": "Water thins the paint until it runs down the paper."},
              ]},
             "You changed the paint four ways and saw what each one did. That is experimenting."),

        step("choose", "The right material for the job", "🧰", "Material chooser", ["1M.02", "1TWA.02"],
             "You want to make something. Which material FEELS right for it? Tap it.",
             explain(
                 ["Artists choose materials on purpose.", "A rough thing needs a rough material. A fluffy thing needs a soft one."],
                 ["A tree trunk is rough. Sandpaper is rough. So sandpaper for the trunk.",
                  "A cloud is fluffy and soft. Cotton wool is soft. So cotton wool for the cloud."],
                 ["Children pick their favourite material every time.", "Pick the one that FEELS like the thing you are making."],
                 ["Read what you want to make, then tap the material."]),
             {"materials": [
                 material("sandpaper", "Sandpaper", "🧻", ["rough", "brown"], "Sandpaper is rough and scratchy."),
                 material("cotton", "Cotton wool", "☁️", ["soft", "white"], "Cotton wool is soft and fluffy."),
                 material("foil", "Foil", "✨", ["shiny", "smooth"], "Foil is shiny and smooth."),
                 material("bubble", "Bubble wrap", "🫧", ["bumpy", "see-through"], "Bubble wrap is bumpy all over."),
                 material("felt", "Felt", "🟩", ["smooth", "bendy"], "Felt is smooth and bendy."),
              ],
              "rounds": [
                  {"purpose": "a rough tree trunk", "needs": "rough", "pic": "🌳", "why": "A trunk is rough, so it needs a rough material."},
                  {"purpose": "a fluffy cloud", "needs": "soft", "pic": "☁️", "why": "A cloud is soft and fluffy, so it needs a soft material."},
                  {"purpose": "a shiny fish", "needs": "shiny", "pic": "🐟", "why": "A fish shines in the water, so it needs a shiny material."},
                  {"purpose": "a bumpy crocodile back", "needs": "bumpy", "pic": "🐊", "why": "A crocodile's back is bumpy, so it needs a bumpy material."},
              ]},
             "You chose the material that feels like the thing. That is choosing for a purpose."),

        step("questions", "Texture quiz", "💬", "Texture spotter", ["1E.01", "1M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about texture, and you have touched every one."],
                 ["Think about the sorting, the rubbing, the paint and the materials."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Texture", "items": [
                 q("Texture is how a thing…", "🖐️", "feels", ["sounds", "smells"], "Texture is how something feels when you touch it."),
                 q("Which material would you choose for a fluffy cloud?", "☁️", "cotton wool", ["sandpaper", "foil"], "Cotton wool is soft and fluffy, like a cloud."),
                 q("What did rice do to the paint?", "🍚", "made it bumpy", ["made it runny", "made it shiny"], "Every grain made a little bump."),
                 q("To make a rubbing, you rub the crayon…", "🖍️", "on its side, gently", ["on its point, hard", "in water"], "The side of the crayon, gently, so the bumps come through."),
             ]},
             "You know your textures."),

        step("quiz", "Show what you know", "⭐", "Star texture finder", ["1E.01", "1E.02", "1E.03", "1M.02", "1TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about touching, sorting, rubbing, the paint experiment and the materials."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which of these is rough?", "🪵", "tree bark", ["a mirror", "a kitten"], "Bark scratches your fingers. Rough."),
                 q("Which of these is smooth?", "🪞", "a mirror", ["sandpaper", "a brick"], "Your finger slides on a mirror."),
                 q("What does flour do to paint?", "🌾", "makes it thick", ["makes it runny", "makes it bumpy"], "Flour soaks up the wet. Thick, like cake mix."),
                 q("What does water do to paint?", "💧", "makes it runny", ["makes it thick", "makes it gritty"], "Water thins the paint until it runs."),
                 q("Why does a rubbing of a coin show the bumps?", "🪙", "because the crayon catches on the raised parts", ["because the coin is shiny", "because the paper is wet"], "The crayon rubs over the high bumps and skips the low parts. So the bumps show."),
                 q("A rubbing shows…", "🌿", "a texture on paper", ["a colour mix", "a straight line"], "The bumps come through the paper."),
                 q("Why put sandpaper on a picture of a tree trunk?", "🌳", "because a trunk is rough", ["because it is brown", "because it is cheap"], "You choose a material because it FEELS like the thing."),
                 q("Why stick cotton wool on a picture of a cloud?", "☁️", "because a cloud looks soft and fluffy", ["because cotton wool is heavy", "because clouds are rough"], "Cotton wool is soft and fluffy, like a cloud."),
             ]},
             "That is the whole lesson finished. You can feel a texture, and choose one on purpose."),
    ],
}


LESSON["about"] = [
    "Say what texture is: how a thing feels when you touch it.",
    "Sort things into rough, smooth and soft.",
    "Say how to make a rubbing of a texture.",
    "Add rice, flour, sugar and water to paint and say what each one did.",
    "Choose the material that feels right for the thing you are making.",
]

LESSON["lecture"] = [
    part("🖐️", "Texture",
         "Texture is how something feels when you touch it. Tree bark is rough. Glass is smooth. Wool is soft. Bubble wrap is bumpy. A sponge is squashy. A stone is hard. Artists notice texture with their hands, not just their eyes."),
    part("🖍️", "Recording a texture",
         "You can record a texture with a rubbing. Put thin paper over something bumpy and rub the side of a crayon over it, gently. The bumps come through. The texture draws itself."),
    part("🧪", "Changing the paint",
         "Paint does not have to be smooth. Stir rice into it and it goes bumpy. Flour makes it thick. Sugar makes it gritty. Water makes it runny. Guess first, then add it, then look at what really happened."),
    part("🧰", "Choosing a material",
         "When you make a picture, choose materials that feel like the thing. Sandpaper for a rough tree trunk. Cotton wool for a fluffy cloud. Foil for a shiny fish. That is choosing for a purpose."),
]

LESSON["words"] = [
    word("texture", "🖐️", "How a thing feels when you touch it.",
         ["Bark has a rough texture.", "Feel the texture with your fingers."]),
    word("rough", "🪵", "Bumpy and scratchy to touch, like bark or sandpaper.",
         ["Sandpaper is rough.", "The trunk feels rough."]),
    word("smooth", "🪟", "Flat and slippery to touch, like glass.",
         ["A mirror is smooth.", "My finger slides on smooth things."]),
    word("soft", "🧶", "Squashes gently when you press it, like wool.",
         ["Cotton wool is soft.", "The kitten is soft."]),
    word("rubbing", "🖍️", "A picture of a texture, made by rubbing a crayon over paper on top of it.",
         ["I made a rubbing of a leaf.", "The rubbing shows the bumps."]),
    word("material", "🧰", "The stuff you make art with, like paper, foil or wool.",
         ["Foil is a shiny material.", "Choose a material that feels right."]),
]

LESSON["home"] = [
    home("Texture paint", "Four cups with a spoon of paint in each, some rice, some flour, some sugar, some water, and paper",
         ["Stir rice into the first cup, flour into the second, sugar into the third, water into the fourth.",
          "Before each one, say what you think it will do.", "Paint a patch of each on the paper and touch it when it is dry."],
         "Which patch is bumpiest? Which is smoothest?"),
    home("Rubbing hunt", "Thin paper and a crayon with the paper peeled off",
         ["Find five bumpy things: a coin, a leaf, a brick wall, the sole of a shoe, a basket.",
          "Make a rubbing of each one.", "Stick them in a row."],
         "Can a grown-up guess what each rubbing is?"),
    home("A texture picture", "Card, glue, and scraps: sandpaper, cotton wool, foil, bubble wrap, felt, wool",
         ["Draw a simple picture: a tree, a cloud, a fish, the sea.", "For each part, choose the scrap that FEELS like it.",
          "Glue them on."],
         "Close your eyes and feel the picture. Can you tell what each part is?"),
]

LESSON["journal"] = {
    "changes": ["add even more rice", "try sand in the paint", "use a rougher material", "make the cloud fluffier", "keep it just as it is"],
}
