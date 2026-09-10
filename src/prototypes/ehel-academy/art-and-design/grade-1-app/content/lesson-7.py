# -*- coding: utf-8 -*-
"""Lesson 7 - My Picture, My Idea.

0067 Stage 1: TWA.01 generate and communicate ideas ("a painting that shares
their personal feelings on a particular classroom topic"; "add collage to a
painting to show texture, such as to create their subject's hair"); M.02
choose media "to represent an object or feeling"; TWA.02 embrace a new thing
("different textures of paint by adding ... sand"); TWA.03 refine; E.03
record by mark making; R.01 celebrate. Every wrong pick says what the choice
WAS, and the child's own idea is never marked.
"""
from _kit import explain, step, opt, q, part, word, home, material, change, work, comment

LESSON = {
    "slug": "my-picture-my-idea",
    "title": "My Picture, My Idea",
    "blurb": "Find out where ideas come from, choose the paint for a feeling, add something to a picture to show what you mean, draw the wind, try new things in the paint, and celebrate your friends' ideas.",
    "steps": [
        step("explore", "Where do ideas come from?", "💡", "Idea finder", ["1TWA.01"],
             "An idea for a picture can come from anywhere. Tap each one to hear how.",
             explain(
                 ["Every picture starts with an idea.", "An idea can come from a feeling, a place, a story, a song, or the weather."],
                 ["A windy day: bending trees and flying leaves.", "My family: the people I love.", "A story: the part I liked best.",
                  "A song: how it makes me feel.", "The market: colours and noise.", "Feeling happy: bright, warm colours."],
                 ["Children wait for someone to tell them what to draw.", "Look around you. Ideas are everywhere."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🌬️", "label": "a windy day", "say": "A windy day. Trees bending, leaves flying, hair everywhere. Draw the wind!"},
                 {"pic": "👨‍👩‍👧", "label": "my family", "say": "My family. The people you love are a picture waiting to happen."},
                 {"pic": "📖", "label": "a story", "say": "A story. Draw the part you liked best, or the part you wish had happened."},
                 {"pic": "🎵", "label": "a song", "say": "A song. Fast or slow, happy or sad. Draw how it makes you feel."},
                 {"pic": "🏪", "label": "the market", "say": "The market. Piles of fruit, bright cloth, people shouting. So much to draw."},
                 {"pic": "😊", "label": "feeling happy", "say": "Feeling happy. Warm bright colours and big round shapes say happy."},
             ], "need": 6,
              "then": {"ask": "Where can an idea for a picture come from?",
                       "opts": [opt("anywhere: a feeling, a place, a story", True), opt("only from a teacher", False), opt("only from a book", False)],
                       "why": "Ideas come from everywhere: a feeling, a place, a story, a song, the weather."}},
             "Six places to find an idea. There are hundreds more."),

        step("choose", "The paint for the feeling", "🎨", "Feeling chooser", ["1M.02", "1TWA.01"],
             "You want your picture to FEEL a certain way. Which paint would do it? Tap it.",
             explain(
                 ["Materials have feelings too.", "Bright paint feels happy. Dark charcoal feels stormy. Soft chalk feels calm."],
                 ["A happy picture wants something bright.", "A calm picture wants something soft and pale.",
                  "A stormy picture wants something dark.", "A party picture wants something shiny."],
                 ["Children use their favourite paint for everything.", "Choose the one that FEELS like the picture."],
                 ["Read the feeling, then tap the material."]),
             {"materials": [
                 material("bright", "Bright paint", "🟥", ["bright", "wet"], "Bright paint is loud and cheerful."),
                 material("chalk", "Pastel chalk", "🩵", ["soft", "pale"], "Pastel chalk is soft and pale."),
                 material("charcoal", "Charcoal", "⬛", ["dark", "smudgy"], "Charcoal is dark and smudgy."),
                 material("glitter", "Glitter glue", "✨", ["shiny", "sticky"], "Glitter glue is shiny and sparkly."),
                 material("sand", "Sand in paint", "🏖️", ["rough", "grainy"], "Sand in paint is rough and grainy."),
              ],
              "rounds": [
                  {"purpose": "a happy picture", "needs": "bright", "pic": "😊", "why": "Happy wants bright."},
                  {"purpose": "a quiet, calm picture", "needs": "soft", "pic": "😌", "why": "Calm wants soft and pale."},
                  {"purpose": "a stormy picture", "needs": "dark", "pic": "⛈️", "why": "A storm wants dark."},
                  {"purpose": "a sparkly party picture", "needs": "shiny", "pic": "🎉", "why": "A party wants sparkle."},
                  {"purpose": "a picture of the beach you can feel", "needs": "rough", "pic": "🏝️", "why": "A beach wants something grainy, like sand."},
              ]},
             "You chose the material for the feeling, five times."),

        step("refine", "Add something to show it", "✨", "Idea improver", ["1TWA.01", "1TWA.03"],
             "A picture is nearly right, but something is missing. What could you add or change? Tap one and see.",
             explain(
                 ["When a picture does not say what you mean, you can add something.", "Cambridge's own example: stick on wool to make hair look fluffy."],
                 ["The hair looks flat. Add wool and it looks fluffy.", "The sky ran. Next time, less water.",
                  "You cannot tell it is windy. Add bending trees and flying leaves."],
                 ["Children start again from scratch.", "Do not start again. Add one thing."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "My picture of my sister", "scene": "portrait", "state": "flat", "fixedState": "wool", "problem": "Her hair looks flat. I want it to look fluffy.", "fixed": "Now her hair is fluffy!"},
                  "needs": "texture",
                  "changes": [
                      change("wool", "Stick on curly wool for the hair", "🧶", "texture", "The wool stands up off the paper. Fluffy!"),
                      change("blue", "Paint the hair blue", "🟦", "colour", "Blue hair. Still flat."),
                      change("small", "Make the face smaller", "🔍", "size", "A smaller face, with the same flat hair."),
                      change("rub", "Rub the hair out", "🧽", "worse", "No hair at all now. That is not what you wanted."),
                  ],
                  "why": "Flat needs texture. Wool has texture, so wool is the change."},
                 {"piece": {"title": "My house picture", "scene": "housepainting", "state": "runny", "fixedState": "fixed", "problem": "The sky paint ran down the picture.", "fixed": "The sky stays where it should."},
                  "needs": "dry",
                  "changes": [
                      change("less", "Use less water and let it dry flat", "☀️", "dry", "Thicker paint, dried flat. No drips."),
                      change("more", "Add more water", "💧", "worse", "Even runnier. It ran off the paper."),
                      change("green", "Paint the house green", "🟩", "colour", "A green house under a sky that still runs."),
                      change("flip", "Turn the paper upside down", "🔃", "turn", "Now it runs the other way."),
                  ],
                  "why": "Runny paint needs less water and time to dry."},
                 {"piece": {"title": "My windy day", "pic": "🌳", "fixedPic": "🌬️", "problem": "You cannot tell it is windy.", "fixed": "Now you can feel the wind!"},
                  "needs": "show",
                  "changes": [
                      change("bend", "Add bending trees and flying leaves", "🍃", "show", "Bending trees and flying leaves. Now everyone can see the wind."),
                      change("sun", "Add a sun", "☀️", "add", "A sunny picture now. Still not windy."),
                      change("smaller", "Make everything smaller", "🔍", "size", "Smaller, and still not windy."),
                      change("blue", "Paint it all blue", "🟦", "colour", "All blue. You cannot see the wind in blue."),
                  ],
                  "why": "To show wind, show what wind DOES: bending and flying."},
             ]},
             "You added the right thing to three pictures, so they say what you meant."),

        step("marks", "Draw the wind", "🌬️", "Wind drawer", ["1E.03", "1TWA.02"],
             "You cannot see the wind, but you can draw what it does. Make the marks.",
             explain(
                 ["The wind is invisible.", "So artists draw what it does: swooshes, bending, flying."],
                 ["A wavy line with the brush is a gust of wind.", "A long swoosh with the crayon is wind rushing past.",
                  "Dots with your finger are leaves flying."],
                 ["Children draw a straight line and say it is wind.", "Wind curves and swoops. Make it move."],
                 ["Draw a wavy gust with the brush."]),
             {"tools": ["brush", "crayon", "finger", "chalk"],
              "rounds": [
                  {"tool": "brush", "want": "wavy", "made": "a gust of wind", "ask": "Draw a gust of wind: a wavy line with the brush.", "pic": "🌬️", "why": "Up and down, swooping. That is a gust."},
                  {"tool": "crayon", "want": "long", "made": "a long swoosh", "ask": "Draw a long swoosh, right across the paper.", "pic": "💨", "why": "All the way across. Wind rushing past."},
                  {"tool": "finger", "want": "dots", "made": "flying leaves", "ask": "Make flying leaves: lots of dots with your finger.", "pic": "🍂", "why": "Dot, dot, dot. Leaves everywhere."},
              ]},
             "You drew the wind, three ways, and a windy picture of your own."),

        step("experiment", "Try something new", "🧪", "Brave tryer", ["1TWA.02", "1E.02"],
             "Artists try new things. Guess what each one will do to the paint, then add it and look.",
             explain(
                 ["Trying something new is brave, and it is how you find things out."],
                 ["Sand makes paint rough.", "Glue makes paint shiny.", "Water makes it runny.",
                  "Guess first. Then add. Then look at what really happened."],
                 ["Children only try what they already know.", "Try the one you have never tried."],
                 ["Tap your guess, then press Add."]),
             {"colour": "green",
              "rounds": [
                  {"additive": "sand", "pic": "🏖️", "opts": ["rough", "runny", "shiny"], "why": "Every grain of sand makes the paint rough to touch."},
                  {"additive": "glue", "pic": "🧴", "opts": ["shiny", "gritty", "bumpy"], "why": "Glue dries clear and shiny, so the paint shines."},
                  {"additive": "water", "pic": "💧", "opts": ["runny", "thick", "rough"], "why": "Water thins the paint until it runs."},
              ]},
             "You tried three new things in the paint and saw what each one did."),

        step("comment", "Celebrate your friends' ideas", "🎉", "Idea celebrator", ["1R.01"],
             "Your friends had ideas too. Say something kind about what is really in each picture.",
             explain(
                 ["When a friend has an idea and makes it, celebrate it.", "Name the thing they did."],
                 ["Amal added wool for the hair. 'I love the fluffy hair' is about her idea.",
                  "'I like your boat' is about a different picture."],
                 ["Children say 'good' and walk off.", "Say WHAT is good."],
                 ["Look, then tap the comment that is about the picture."]),
             {"works": [
                 work("amal", "My sister", "portrait", ["a face", "fluffy hair", "red", "yellow"], owner="Amal", owner_pic="👧🏾", state="wool"),
                 work("sami", "Flowers for Mum", "flowers", ["flowers", "a vase", "pink", "green"], owner="Sami", owner_pic="👦🏽"),
                 work("nadia", "The Night", "night", ["a moon", "stars", "dark blue", "hills"], owner="Nadia", owner_pic="👧🏻"),
              ],
              "rounds": [
                  {"work": "amal", "opts": [comment("I love the fluffy hair you made.", "fluffy hair"), comment("Your stars are lovely.", "stars"), comment("I like your vase.", "a vase")], "why": "Amal's idea was the fluffy hair. The stars and the vase are in other pictures."},
                  {"work": "sami", "opts": [comment("Your pink flowers are so bright.", "flowers"), comment("I like your moon.", "a moon"), comment("Your face is smiling.", "a face")], "why": "Sami painted flowers. No moon, no face."},
                  {"work": "nadia", "opts": [comment("Your dark blue night is beautiful.", "dark blue"), comment("I like your fluffy hair.", "fluffy hair"), comment("Your flowers are pretty.", "flowers")], "why": "Nadia's picture is the dark blue night. The hair and the flowers belong to other pictures."},
              ]},
             "You celebrated three friends' ideas with kind words about what they made."),

        step("questions", "Idea quiz", "💬", "Idea spotter", ["1TWA.01", "1M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about ideas and how to show them."],
                 ["Think about where ideas come from, the paint for a feeling, and what you added."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Ideas", "items": [
                 q("A happy picture wants…", "😊", "bright paint", ["dark charcoal", "grey chalk"], "Bright colours feel happy."),
                 q("The hair looked flat. What made it fluffy?", "🧶", "sticking on wool", ["painting it blue", "rubbing it out"], "Wool has texture. It stands up off the paper."),
                 q("How do you draw the wind?", "🌬️", "draw what it does: bending and flying", ["draw a straight line", "leave the paper white"], "You cannot see wind, so draw what it does."),
                 q("What did glue do to the paint?", "✨", "made it shiny", ["made it bumpy", "made it rough"], "Glue dries clear and shiny."),
             ]},
             "You know how to show an idea."),

        step("quiz", "Show what you know", "⭐", "Star idea maker", ["1E.02", "1E.03", "1M.02", "1R.01", "1TWA.01", "1TWA.02", "1TWA.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about ideas, feelings, adding things, the wind, the paint and kind words."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where do ideas for pictures come from?", "💡", "anywhere: feelings, places, stories, songs", ["only from teachers", "only from television"], "Ideas are everywhere."),
                 q("A stormy picture wants…", "⛈️", "dark charcoal", ["bright paint", "glitter glue"], "A storm wants dark."),
                 q("The sky paint ran. Next time…", "💧", "use less water and let it dry flat", ["add more water", "turn the paper over"], "Runny needs less water."),
                 q("You cannot tell the picture is windy. Add…", "🍃", "bending trees and flying leaves", ["a sun", "more blue"], "Show what the wind does."),
                 q("What does sand do to paint?", "🏖️", "makes it rough", ["makes it shiny", "makes it runny"], "Sand makes paint rough to touch."),
                 q("Trying something new in your art is…", "🧪", "brave, and how you find things out", ["not allowed", "a waste of paint"], "Trying is how artists learn."),
                 q("Amal stuck wool on her picture. Why?", "🧶", "to make the hair look fluffy", ["because she had no paint", "to hide the face"], "Wool has texture, and hair is fluffy."),
                 q("A good kind comment says…", "💛", "what is really in the picture", ["'nice' and nothing else", "what is in a different picture"], "Name the thing they made."),
             ]},
             "That is the whole lesson finished. You have ideas, and you know how to show them."),
    ],
}


LESSON["about"] = [
    "Say where an idea for a picture can come from.",
    "Choose the paint or material that feels like the picture you want to make.",
    "Add or change something so a picture says what you meant.",
    "Draw what the wind does, with three kinds of mark.",
    "Try something new in the paint and say what it did.",
    "Celebrate a friend's idea with a kind word about what they made.",
]

LESSON["lecture"] = [
    part("💡", "An idea",
         "Every picture starts with an idea. It can come from a feeling, like being happy. From a place, like the market. From a story, a song, or the weather. You do not wait for an idea. You look around and find one."),
    part("🎨", "The material for the feeling",
         "Once you have an idea, choose what to make it with. Bright paint for a happy picture. Soft pale chalk for a calm one. Dark charcoal for a storm. Glitter for a party. The material helps say what you mean."),
    part("✨", "Adding something",
         "Sometimes a picture does not say what you meant. The hair looks flat. You cannot tell it is windy. An artist does not start again. They add one thing: wool for the hair, bending trees for the wind."),
    part("🧪", "Trying something new",
         "Artists try things they have never tried. Sand in the paint. Glue in the paint. Guess what it will do, try it, and look. Being brave with materials is how you find out what they can do."),
]

LESSON["words"] = [
    word("idea", "💡", "A thought about what to make, before you make it.",
         ["My idea is a windy day.", "Where did your idea come from?"]),
    word("feeling", "😊", "How you feel inside: happy, calm, excited, sad.",
         ["Bright colours show a happy feeling.", "What feeling is your picture?"]),
    word("collage", "🧶", "A picture made by sticking things on: paper, wool, cloth.",
         ["I made a collage with wool for hair.", "Collage gives a picture texture."]),
    word("add", "➕", "To put one more thing in.",
         ["Add flying leaves to show the wind.", "What could you add?"]),
    word("stormy", "⛈️", "Dark and wild, like a storm.",
         ["A stormy picture wants dark colours.", "The sky looks stormy."]),
    word("brave", "💪", "Doing something even though it is new or hard.",
         ["Be brave and try the sand.", "It was brave to try a new colour."]),
]

LESSON["home"] = [
    home("A feeling picture", "Paint, chalk, or crayons, and a big piece of paper",
         ["Choose a feeling: happy, calm, excited or sleepy.", "Choose the colours that feel like it.",
          "Make a picture with those colours. It does not have to be OF anything."],
         "Can a grown-up guess the feeling just from the colours?"),
    home("Collage hair", "A drawing of a face, glue, and scraps: wool, string, cotton wool, shredded paper",
         ["Draw a face with no hair.", "Choose a scrap that feels like the hair you want: curly, fluffy, straight.",
          "Glue it on."],
         "Does the hair stand up off the paper now?"),
    home("Draw the wind", "Paper and a brush or a crayon, on a windy day",
         ["Go outside and watch what the wind does to trees, washing and leaves.", "Come in and draw what it DID: bending, flying, swooshing.",
          "Do not draw the wind itself. You cannot see it."],
         "Can someone tell it is windy just by looking?"),
]

LESSON["journal"] = {
    "changes": ["add more flying leaves", "make the swoosh longer", "try charcoal for a storm", "stick on more wool", "keep it just as it is"],
}
