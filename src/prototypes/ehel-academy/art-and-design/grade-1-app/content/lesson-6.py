# -*- coding: utf-8 -*-
"""Lesson 6 - Looking at Art.

0067 Stage 1: E.01 encounter and respond to art "from different times and
cultures" (a cave wall, a carved mask, a woven basket, a patterned cloth, a
tiled wall, a dot painting - drawn in the manner of traditional and ancient
art, never a copy of a named artist's work); R.02 connect works "by being
asked to describe the similarities and differences and to give a reason" -
computed from what each work contains; R.01 celebrate a friend's work with
a comment about something that is actually in it; E.03 record by ordering
(tone) and mark making.
"""
from _kit import explain, step, opt, q, spot, part, word, home, work, comment, swatch

LESSON = {
    "slug": "looking-at-art",
    "title": "Looking at Art",
    "blurb": "Look at art from long ago and far away, find what is in a mask and a dot painting, say what is the same and different in two pictures, say something kind and true about a friend's picture, and make marks like the artists did.",
    "steps": [
        step("explore", "Art from long ago and far away", "🌍", "Art traveller", ["1E.01"],
             "People everywhere make art, and always have. Tap each one to hear about it.",
             explain(
                 ["Art is made all over the world, and it has been made for thousands of years."],
                 ["A cave wall, painted long ago.", "A basket, woven from grass.", "A cloth, woven in stripes.",
                  "A mask, carved from wood.", "A wall of tiles.", "A painting made only of dots."],
                 ["Children think art is only paintings in frames.", "A basket is art. A cloth is art. A wall can be art."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"scene": "cave", "label": "a cave wall", "say": "A cave wall, painted thousands of years ago, with animals, handprints and dots."},
                 {"scene": "basket", "label": "a basket", "say": "A basket, woven over and under, over and under, from strips of grass or reed."},
                 {"scene": "cloth", "label": "a cloth", "say": "A cloth, woven in bright stripes that repeat. Cloth like this is worn on special days."},
                 {"scene": "mask", "label": "a mask", "say": "A mask, carved from wood, with lines cut in and dots painted on. Masks are worn for dances and stories."},
                 {"scene": "tiles", "label": "a tiled wall", "say": "A wall of tiles, blue and white, with a star in every one."},
                 {"scene": "dots", "label": "a dot painting", "say": "A painting made only of dots, in rings and in a winding line."},
             ], "need": 6,
              "then": {"ask": "Which of these is made by weaving over and under?",
                       "opts": [opt("the basket", True), opt("the cave wall", False), opt("the dot painting", False)],
                       "why": "A basket is woven, over and under. The cave wall was painted."}},
             "Six works of art, from six places and times."),

        step("source", "Look closely: the mask", "🎭", "Mask looker", ["1E.01", "1R.02"],
             "Look closely at the mask. Tap the things in it to find out what the carver did.",
             explain(
                 ["Looking closely means finding the parts.", "Every part of this mask was carved or painted on purpose."],
                 ["Tap the eyes.", "Tap the mouth.", "Tap the carved lines.", "Tap the dots."],
                 ["Children look for a second and say 'a face'.", "Look longer. Find four things."],
                 ["Tap four things and listen."]),
             {"scene": "mask", "need": 4, "caption": "Tap the eyes, the mouth, the lines and the dots.",
              "spots": [
                  spot("eyes", "the eyes", "Two eye shapes, cut right through the wood so the wearer can see out.", 160, 95, "👀"),
                  spot("mouth", "the mouth", "A mouth cut as a triangle. A shape, not a smile.", 160, 158, "👄"),
                  spot("lines", "the carved lines", "Curved lines carved across the forehead. The carver cut them with a sharp tool.", 104, 68, "〰️"),
                  spot("dots", "the yellow dots", "Yellow dots painted on the dark wood. Warm dots on a cool, dark colour.", 200, 40, "🟡"),
              ],
              "then": {"ask": "How did the artist make the lines on the mask?",
                       "opts": [{"t": "carved them into the wood", "spot": "lines"}, {"t": "drew them with a pencil"}, {"t": "stuck them on with tape"}],
                       "why": "The lines are cut into the wood with a sharp tool. That is carving."}},
             "You looked closely at a mask and found what the carver did."),

        step("source", "Look closely: the dot painting", "🎨", "Dot looker", ["1E.01"],
             "This whole painting is made of dots. Tap the parts to find out how.",
             explain(
                 ["Some artists paint with dots and nothing else.", "Each dot is one touch of a stick dipped in paint."],
                 ["Tap the rings of dots.", "Tap the winding line of dots.", "Tap the colours."],
                 ["Children think dots are easy.", "Thousands of dots, each one placed on purpose. That is patience."],
                 ["Tap three things and listen."]),
             {"scene": "dots", "need": 3, "caption": "Tap the rings, the winding line and the colours.",
              "spots": [
                  spot("rings", "the rings of dots", "Rings of dots, one inside another. Yellow, then orange, then white.", 80, 80, "⭕"),
                  spot("snake", "the winding line", "A line of dots that winds along the bottom, like a path or a snake.", 170, 205, "🐍"),
                  spot("colours", "the colours", "Warm colours - yellow, orange, red - on a dark brown ground.", 240, 70, "🟠"),
              ],
              "then": {"ask": "What is this painting made of?",
                       "opts": [{"t": "dots, and only dots", "spot": "rings"}, {"t": "long brush strokes"}, {"t": "cut paper"}],
                       "why": "Every mark is a dot. The rings are dots and the winding line is dots."}},
             "You found the dots, the rings and the winding line."),

        step("compare", "The same and different", "⚖️", "Same and different", ["1R.02"],
             "Here are two pictures. Is each thing in BOTH of them, or only in one?",
             explain(
                 ["Artists compare pictures.", "They ask what is the same and what is different, and say why."],
                 ["Both pictures have the sky.", "Only one has a sun.", "Only one has wavy lines."],
                 ["Children say 'they are different' and stop.", "Say WHAT is different. That is the skill."],
                 ["Look at both pictures, then tap a bin."]),
             {"a": work("sun", "A Sunny Day", "sunpainting", ["a sun", "a tree", "yellow", "green", "blue", "the sky", "flowers"]),
              "b": work("sea", "Out at Sea", "seapainting", ["wavy lines", "blue", "a boat", "fish", "the sky", "orange"]),
              "cards": [
                  comment("blue paint", "blue"),
                  comment("a sun", "a sun"),
                  comment("wavy lines", "wavy lines"),
                  comment("the sky", "the sky"),
                  comment("a boat", "a boat"),
                  comment("a tree", "a tree"),
              ]},
             "You found what is the same and what is different, and said which one you like."),

        step("comment", "Say something kind", "💛", "Kind words", ["1R.01"],
             "A friend made a picture. Say something kind about it. It has to be about something that is really there.",
             explain(
                 ["Artists celebrate each other's work.", "A kind word about something that is really there is the best kind."],
                 ["Amal painted a sun. 'I like your bright yellow sun' is about something in her picture.",
                  "'I love your boat' is kind, but there is no boat. That would be about a different picture."],
                 ["Children say 'it is nice'.", "Say WHAT is nice. Name a thing in the picture."],
                 ["Look at the picture, then tap the comment that is about it."]),
             {"works": [
                 work("amal", "A Sunny Day", "sunpainting", ["a sun", "a tree", "yellow", "green", "flowers"], owner="Amal", owner_pic="👧🏾"),
                 work("sami", "Out at Sea", "seapainting", ["wavy lines", "blue", "a boat", "fish"], owner="Sami", owner_pic="👦🏽"),
                 work("nadia", "Flowers for Mum", "flowers", ["flowers", "a vase", "pink", "green"], owner="Nadia", owner_pic="👧🏻"),
                 work("leo", "The Night", "night", ["a moon", "stars", "dark blue", "hills"], owner="Leo", owner_pic="👦🏿"),
              ],
              "rounds": [
                  {"work": "amal", "opts": [comment("I like your big yellow sun.", "a sun"), comment("I love your boat.", "a boat"), comment("Your stars are so bright.", "stars")], "why": "There is a sun in Amal's picture. There is no boat and there are no stars."},
                  {"work": "sami", "opts": [comment("Your wavy lines look just like the sea.", "wavy lines"), comment("I like your tree.", "a tree"), comment("Your flowers are lovely.", "flowers")], "why": "Sami painted wavy lines for the sea. No tree, no flowers."},
                  {"work": "nadia", "opts": [comment("Your pink flowers are beautiful.", "flowers"), comment("I like your fish.", "fish"), comment("Your moon is so round.", "a moon")], "why": "Nadia painted flowers. The fish and the moon are in other pictures."},
                  {"work": "leo", "opts": [comment("I love the stars in your dark sky.", "stars"), comment("Your sun is bright.", "a sun"), comment("Your vase is nice.", "a vase")], "why": "Leo painted stars. The sun and the vase are not in his picture."},
              ]},
             "You said something kind and true about four pictures. That is celebrating."),

        step("tone", "Light and dark in the night picture", "🌙", "Night tones", ["1E.01", "1E.03"],
             "Leo's night picture has light bits and dark bits. Put the colours in order, from lightest to darkest.",
             explain(
                 ["A picture of the night is all about tone: light and dark.", "The moon is the lightest thing. The hills are the darkest."],
                 ["Find the palest colour first.", "Then the next.", "End with the darkest."],
                 ["Children put blue before pale yellow because they like blue.", "Look at how PALE each one is."],
                 ["Tap the lightest one first."]),
             {"swatches": [
                 swatch("star", "star white", "#FFFFFF", say="Star white. The lightest of all."),
                 swatch("moon", "moon yellow", "#FBE99A", say="Moon yellow. Pale and glowing."),
                 swatch("mid", "mid blue", "#2D6CDF", say="Mid blue. The lighter part of the sky."),
                 swatch("sky", "night sky", "#1B3A75", say="Night sky. Dark blue."),
                 swatch("hills", "hills", "#0B1D2C", say="The hills. Nearly black."),
             ]},
             "From the star to the hills. That is the tone in a night picture."),

        step("marks", "Make marks like the artists", "✋", "Old marks", ["1E.03", "1M.01"],
             "The cave artist made dots. The dot painter made a winding line. Now you.",
             explain(
                 ["Looking at art gives you ideas for your own.", "Make the marks the artists made."],
                 ["The dot painter's winding line: a wavy line with your finger.", "The cave artist's dots: tap, tap, tap.",
                  "The mask carver's curved lines: a wavy line with the pencil."],
                 ["Children copy exactly.", "You are not copying. You are trying the SAME KIND of mark, your way."],
                 ["Draw a wavy line with your finger."]),
             {"tools": ["finger", "pencil", "brush"],
              "rounds": [
                  {"tool": "finger", "want": "wavy", "made": "a winding line like the dot painting", "ask": "Draw a winding line with your finger, like the dot painting.", "pic": "🐍", "why": "A winding line, up and down. The dot painter made one in dots."},
                  {"tool": "finger", "want": "dots", "made": "dots like the cave wall", "ask": "Make dots with your finger, like the cave wall.", "pic": "🐾", "why": "Tap, tap, tap. The cave artist did the same, thousands of years ago."},
                  {"tool": "pencil", "want": "wavy", "made": "curved lines like the mask", "ask": "Draw a curved line with the pencil, like the lines on the mask.", "pic": "🎭", "why": "A curved line, like the carver cut across the mask."},
              ]},
             "You made the marks the artists made, your own way."),

        step("questions", "Looking quiz", "💬", "Art spotter", ["1E.01", "1R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the art you looked at."],
                 ["Think about the six works, the mask, the dots, and the two pictures."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Looking", "items": [
                 q("The lines on the mask were…", "🎭", "carved into the wood", ["drawn in pencil", "stuck on with tape"], "Cut into the wood with a sharp tool."),
                 q("The dot painting is made of…", "🎨", "dots and only dots", ["long brush strokes", "cut paper"], "Every mark is a dot."),
                 q("What did the sunny picture and the sea picture BOTH have?", "🌤️", "the sky", ["a boat", "a sun"], "Both have the sky. Only one has a sun, and only one has a boat."),
                 q("A kind comment about a picture should be about…", "💛", "something that is really in it", ["a different picture", "nothing at all"], "Name something that is there."),
             ]},
             "You know how to look at art."),

        step("quiz", "Show what you know", "⭐", "Star art looker", ["1E.01", "1E.03", "1M.01", "1R.01", "1R.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the six works, looking closely, same and different, kind words and tone."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which of these is made by weaving?", "🧺", "a basket", ["a cave painting", "a mask"], "A basket is woven over and under."),
                 q("Where was the cave art made?", "🪨", "on a cave wall, long ago", ["on a computer", "in a shop"], "On the wall of a cave, thousands of years ago."),
                 q("What is in every tile on the tiled wall?", "🔷", "a star", ["a fish", "a face"], "A star, repeated on every tile."),
                 q("Which is the lightest tone in the night picture?", "🌙", "star white", ["night sky", "the hills"], "White is the lightest of all."),
                 q("Sami's sea picture and Amal's sunny picture are different because…", "⚖️", "only one has a boat", ["both have a boat", "both are the same"], "Only Sami's picture has a boat."),
                 q("Which is a kind AND true thing to say about Nadia's flowers?", "💐", "'Your pink flowers are beautiful'", ["'I like your fish'", "'Your moon is round'"], "There are pink flowers in her picture. No fish, no moon."),
                 q("Looking at art can give you…", "💡", "ideas for your own", ["a headache", "nothing"], "The marks the artists made became your marks."),
                 q("A mask is worn for…", "🎭", "dances and stories", ["swimming", "sleeping"], "Masks are worn to dance and to tell stories."),
             ]},
             "That is the whole lesson finished. You can look at art, and talk about it."),
    ],
}


LESSON["about"] = [
    "Name six kinds of art from different times and places: a cave wall, a basket, a cloth, a mask, tiles and a dot painting.",
    "Look closely at a work of art and find the parts of it.",
    "Say what is the same and what is different in two pictures.",
    "Say something kind about a friend's picture that is really in it.",
    "Make the kinds of mark the artists made.",
]

LESSON["lecture"] = [
    part("🌍", "Art everywhere",
         "People everywhere make art, and they always have. Someone painted animals on a cave wall thousands of years ago. Someone wove a basket. Someone carved a mask. Someone made a whole painting out of dots. Art is not only pictures in frames."),
    part("👀", "Looking closely",
         "To look at art, look for the parts. What lines did the artist make? What shapes? What colours? A quick look says 'a face'. A long look says 'two eyes cut through the wood, a triangle mouth, curved lines carved across the forehead'."),
    part("⚖️", "The same and different",
         "Put two pictures side by side. What do both have? What does only one have? Saying what is the same and what is different, and why, is how artists talk about art."),
    part("💛", "Kind words",
         "When a friend shows you their picture, say something kind about it. Name something that is really there: 'I like your big yellow sun.' That is celebrating, and every artist needs it."),
]

LESSON["words"] = [
    word("artist", "🧑🏾‍🎨", "A person who makes art.",
         ["The cave artist made dots.", "You are an artist too."]),
    word("mask", "🎭", "A face you wear over your own face, often carved or painted.",
         ["The mask is made of wood.", "People wear the mask to dance."]),
    word("weave", "🧺", "To make something by going over and under with strips or threads.",
         ["You weave a basket.", "The cloth is woven in stripes."]),
    word("same", "🟰", "Alike. Both pictures have it.",
         ["Both pictures have the sky. That is the same.", "Find what is the same."]),
    word("different", "↔️", "Not alike. Only one picture has it.",
         ["Only one picture has a boat. That is different.", "Find what is different."]),
    word("celebrate", "🎉", "To show you are glad about something someone did.",
         ["We celebrate each other's pictures.", "Say a kind word to celebrate."]),
]

LESSON["home"] = [
    home("An art corner", "A shelf or a table, and three things: a patterned cloth or scarf, a basket or a woven mat, and a picture from a book or a postcard",
         ["Put the three things together where you can see them.", "Look at each one for a whole minute.",
          "Find three things in each one: a line, a shape, a colour."],
         "Which one did you want to touch? Which one did you want to keep looking at?"),
    home("Same and different at home", "Two pictures: two book pages, two postcards, or two of your own drawings",
         ["Put them side by side.", "Say three things that are in BOTH.",
          "Say three things that are only in one."],
         "Which one do you like more, and why?"),
    home("Kind words", "A drawing by someone else in your family",
         ["Look at it for a whole minute.", "Say one kind thing about something that is really in it.",
          "Ask them to say one kind thing about a drawing of yours."],
         "How did it feel to hear a kind word about your picture?"),
]

LESSON["journal"] = {
    "changes": ["make more dots", "use a darker colour for the hills", "make the winding line longer", "try it with a brush", "keep it just as it is"],
}
