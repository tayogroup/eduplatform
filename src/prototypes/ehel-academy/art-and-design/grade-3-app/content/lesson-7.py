# -*- coding: utf-8 -*-
"""Lesson 7 - Learning from Artists.

0067 Stage 3: E.01 encounter art from different times and cultures - a
painting from France in 1889 and a woodblock print from Japan around 1831,
each drawn here in the artist's manner, never copied; R.02 analyse and
connect: what the two works share and what only one has, computed from their
feature tags; TWA.01 connect experiencing and making: borrow a technique and
use it in your own marks; TWA.02 embrace a challenge - try a way of working
that is not your own; R.01 celebrate. The step up from Grade 2: Grade 2
compared two works; Grade 3 names what an artist DID, borrows it, and says
whose idea it was.
"""
from _kit import explain, step, opt, q, spot, part, word, home, work, comment

LESSON = {
    "slug": "learning-from-artists",
    "title": "Learning from Artists",
    "blurb": "Look closely at a swirling night sky painted in France and a great wave printed in Japan, find what they share and what only one has, borrow each artist's way of making marks, and say whose idea you borrowed.",
    "steps": [
        step("source", "A swirling night sky", "🌌", "Sky looker", ["3E.01", "3R.02"],
             "This picture is drawn in the manner of Vincent van Gogh's painting of a starry night, from France in 1889. Tap the parts to find out what he did.",
             explain(
                 ["Vincent van Gogh painted a starry night in 1889 in France. He based it on the view from his window, and added a village from his imagination.",
                  "He painted with thick paint and short, curling brush strokes."],
                 ["Tap the big swirl in the sky.", "Tap a star with rings of light round it.", "Tap the moon and the dark tree."],
                 ["Children see a night sky and stop.", "Look at HOW it is painted: every stroke curls."],
                 ["Tap three things and listen."]),
             {"scene": "swirlnight", "need": 3, "caption": "Tap the swirl, a star, the moon and the tree.",
              "spots": [
                  spot("swirl", "the swirl", "The sky swirls like wind or water. Van Gogh painted it with curling brush strokes, one next to another.", 150, 76, "🌀"),
                  spot("star", "a glowing star", "Each star has rings of light round it, so it seems to glow and shimmer.", 40, 40, "⭐"),
                  spot("moon", "the moon", "A bright yellow moon, glowing in the corner of the sky.", 272, 44, "🌙"),
                  spot("tree", "the dark tree", "A tall, dark tree stands in front, reaching up like a flame. It makes the sky look far away.", 62, 176, "🌲"),
              ],
              "then": {"ask": "How did van Gogh make the sky look like it is moving?",
                       "opts": [{"t": "with curling, swirling brush strokes", "spot": "swirl"}, {"t": "with straight ruler lines"}, {"t": "by leaving it white"}],
                       "why": "The curling strokes make the whole sky swirl and move."}},
             "You found the swirl, the glowing stars, the moon and the tree."),

        step("source", "A great wave", "🌊", "Wave looker", ["3E.01", "3R.02"],
             "This picture is drawn in the manner of Katsushika Hokusai's print of a great wave, from Japan around 1831. Tap the parts to find out what he did.",
             explain(
                 ["Katsushika Hokusai made his great wave around 1831 in Japan.",
                  "It is a print: Hokusai drew the picture, skilled carvers cut it into blocks of wood, and each block printed one colour."],
                 ["Tap the white foam at the top of the wave.", "Tap the tiny mountain far away.", "Tap the little boats."],
                 ["Children think the mountain is another wave.", "Look again: it has snow on top. It is a mountain, far away."],
                 ["Tap three things and listen."]),
             {"scene": "greatwave", "need": 3, "caption": "Tap the foam, the mountain, the boats and the wave.",
              "spots": [
                  spot("foam", "the foam", "The foam at the top of the wave curls over like claws, reaching down.", 176, 56, "🤍"),
                  spot("mountain", "the mountain", "A small mountain with snow on top, far away: Mount Fuji. The huge wave makes it look tiny.", 252, 134, "🗻"),
                  spot("boats", "the boats", "Little boats, tossed by the huge sea.", 80, 196, "🚣"),
                  spot("wave", "the great wave", "The wave is flat, bold blue, with curling edges. That is how a woodblock print looks.", 110, 120, "🌊"),
              ],
              "then": {"ask": "Why does the mountain look so small?",
                       "opts": [{"t": "because it is far away, behind a huge wave", "spot": "mountain"}, {"t": "because it is a toy"}, {"t": "because the paint ran out"}],
                       "why": "Things far away look small. Next to the great wave, the mountain looks tiny."}},
             "You found the foam, the mountain, the boats and the wave."),

        step("compare", "Two artists, far apart", "⚖️", "Artist connector", ["3R.02", "3E.01"],
             "A painter in France and a printmaker in Japan. Is each thing in BOTH pictures, or only in one?",
             explain(
                 ["Two artists who never met can share an idea.", "Look for what is the same, then what is different."],
                 ["Both use curling lines.", "Both use lots of blue.", "Only one has a moon. Only one has boats.",
                  "One was painted with a brush. The other was printed from wood."],
                 ["Children only see the differences.", "Look for what they SHARE, too."],
                 ["Look at both, then tap a bin."]),
             {"a": work("night", "The swirling night", "swirlnight", ["curling lines", "lots of blue", "the sky", "stars", "a moon", "a tree", "painted with a brush"]),
              "b": work("wave", "The great wave", "greatwave", ["curling lines", "lots of blue", "the sky", "a snowy mountain", "boats", "printed from wood"]),
              "cards": [
                  comment("curling lines", "curling lines"),
                  comment("lots of blue", "lots of blue"),
                  comment("a moon", "a moon"),
                  comment("boats", "boats"),
                  comment("a snowy mountain", "a snowy mountain"),
                  comment("painted with a brush", "painted with a brush"),
                  comment("printed from wood", "printed from wood"),
              ]},
             "You connected two artists from far apart, and found the idea they share."),

        step("marks", "Borrow a technique", "🖌️", "Technique borrower", ["3TWA.01", "3TWA.02", "3M.01"],
             "Try each artist's way of making marks. Use the tool the card asks for.",
             explain(
                 ["Artists learn from other artists.", "You can borrow HOW they made marks, and use it in your own picture."],
                 ["Van Gogh's sky: round, curling strokes.", "Hokusai's wave: a wavy, rolling line.",
                  "Van Gogh's stars: dabs and dots of paint.", "The far edge of the sea: one long line right across."],
                 ["Children copy the whole picture.", "Borrow one technique, then make your OWN picture with it."],
                 ["Make the first mark."]),
             {"tools": ["brush", "crayon", "pencil"],
              "rounds": [
                  {"tool": "brush", "want": "round", "made": "a van Gogh swirl", "ask": "With the brush, paint one swirl, going all the way round, like van Gogh's sky.", "pic": "🌀", "why": "All the way round. That is a swirl, like van Gogh's."},
                  {"tool": "brush", "want": "wavy", "made": "a Hokusai wave", "ask": "With the brush, paint a wavy line that rolls up and down, like Hokusai's wave.", "pic": "🌊", "why": "Up and down, rolling along. That is a wave, like Hokusai's."},
                  {"tool": "crayon", "want": "dots", "made": "glowing stars", "ask": "With the crayon, make dots for stars, like van Gogh's dabs of paint.", "pic": "⭐", "why": "Little dots, like stars in the sky."},
                  {"tool": "pencil", "want": "long", "made": "a far-away sea line", "ask": "With the pencil, draw one long line across for the far-away sea.", "pic": "🌅", "why": "Long and flat, right across. The sea, far away."},
              ]},
             "You borrowed two artists' techniques and made them your own marks."),

        step("sort", "Whose idea did I borrow?", "🗂️", "Idea finder", ["3R.02", "3TWA.01"],
             "When you borrow an idea, say whose it was. Tap the artist each idea came from.",
             explain(
                 ["It is good to learn from other artists, and honest to say who you learned from."],
                 ["Swirling skies and glowing stars: van Gogh.", "Claw-like foam and a tiny far mountain: Hokusai.",
                  "Thick dabs of paint: van Gogh.", "Flat colours printed from wood: Hokusai."],
                 ["Children say 'I made it up' when they borrowed it.", "Borrowing is fine. Say whose idea it was."],
                 ["Read the idea, then tap the artist."]),
             {"ask": "Van Gogh or Hokusai?",
              "bins": [{"id": "vangogh", "label": "Van Gogh", "pic": "🌌"}, {"id": "hokusai", "label": "Hokusai", "pic": "🌊"}],
              "items": [
                  {"pic": "🌀", "label": "a sky that swirls", "bin": "vangogh", "why": "Van Gogh painted the swirling sky."},
                  {"pic": "🤍", "label": "foam that curls like claws", "bin": "hokusai", "why": "Hokusai's wave has claw-like foam."},
                  {"pic": "⭐", "label": "stars with rings of light", "bin": "vangogh", "why": "Van Gogh's stars glow with rings round them."},
                  {"pic": "🗻", "label": "a tiny mountain far away", "bin": "hokusai", "why": "Hokusai put a tiny mountain behind the wave."},
                  {"pic": "🖌️", "label": "thick dabs of paint", "bin": "vangogh", "why": "Van Gogh painted with thick paint."},
                  {"pic": "🪵", "label": "flat colours printed from wood", "bin": "hokusai", "why": "Hokusai's picture is a woodblock print."},
                  {"pic": "🚣", "label": "little boats tossed by the sea", "bin": "hokusai", "why": "Hokusai's boats are tossed by the wave."},
              ]},
             "You said whose idea each one was."),

        step("questions", "Artist spotter", "💬", "Artist spotter", ["3E.01", "3R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the two artists.", "You have met every one of them."],
                 ["Think about swirls, waves, painting and printing."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Artists", "items": [
                 q("Who painted a swirling starry night?", "🌌", "Vincent van Gogh", ["Katsushika Hokusai", "a weaver from Ghana"], "Van Gogh painted it in France in 1889."),
                 q("Who made the print of a great wave?", "🌊", "Katsushika Hokusai", ["Vincent van Gogh", "nobody"], "Hokusai made it in Japan around 1831."),
                 q("What do both pictures share?", "🔁", "curling lines and lots of blue", ["boats", "a moon"], "Both use curling lines and blue."),
                 q("How was the great wave made?", "🪵", "printed from carved wood blocks", ["painted on a wall", "made of clay"], "It is a woodblock print."),
             ]},
             "You know the two artists and what they did."),

        step("quiz", "Show what you know", "⭐", "Star art detective", ["3E.01", "3R.01", "3R.02", "3TWA.01", "3TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the two pictures, what they share, the marks you borrowed, and whose ideas they were."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where did van Gogh paint his starry night?", "🇫🇷", "in France", ["in Japan", "in Ghana"], "He painted it in France in 1889."),
                 q("Where was the great wave printed?", "🇯🇵", "in Japan", ["in France", "in Ghana"], "Hokusai made it in Japan around 1831."),
                 q("Why does van Gogh's sky seem to move?", "🌀", "because every brush stroke curls and swirls", ["because it is a video", "because it is blank"], "Curling strokes make it swirl."),
                 q("Why does Hokusai's mountain look tiny?", "🗻", "because it is far away behind a huge wave", ["because it is a pebble", "because he forgot it"], "Far things look small."),
                 q("What is in BOTH pictures?", "🔁", "curling lines", ["a moon", "boats"], "Both artists used curling lines."),
                 q("Why say whose idea you borrowed?", "🗣️", "because it is honest to name who you learned from", ["because it is a rule for grown-ups only", "because the idea is then yours"], "Borrow the idea, and say whose it was."),
                 q("Which mark did you borrow from van Gogh's sky?", "🖌️", "a round swirl", ["a long flat line", "a zigzag"], "Van Gogh's sky swirls round."),
                 q("Claw-like foam was whose idea?", "🤍", "Hokusai's", ["van Gogh's", "mine, I made it up"], "Hokusai drew the foam like claws."),
             ]},
             "That is the whole lesson finished. You can learn from an artist, and say what you borrowed."),
    ],
}


LESSON["about"] = [
    "Find what van Gogh did in his swirling night sky.",
    "Find what Hokusai did in his great wave.",
    "Say what the two pictures share and what only one has.",
    "Borrow each artist's way of making marks.",
    "Say whose idea you borrowed.",
]

LESSON["lecture"] = [
    part("🌌", "A starry night",
         "In 1889, in France, Vincent van Gogh painted a night sky based on the view from his window, adding a village from his imagination. He used thick paint and short, curling strokes, so the whole sky seems to swirl."),
    part("🌊", "A great wave",
         "Around 1831, in Japan, Katsushika Hokusai designed a print of a huge wave. Skilled carvers cut the picture into blocks of wood, and it was printed one colour at a time. Far behind the wave sits a tiny mountain."),
    part("🔁", "The same and different",
         "The two artists never met. But both used curling lines and lots of blue. One painted with a brush; the other printed from wood. One has stars and a moon; the other has boats and a snowy mountain. Van Gogh collected Japanese prints like Hokusai's, and learned from them."),
    part("🖌️", "Borrow, and say so",
         "Artists learn from other artists. You can borrow a technique, like a swirl or a rolling wave, and use it in your own picture. When you do, say whose idea it was."),
]

LESSON["words"] = [
    word("artist", "🧑‍🎨", "A person who makes art.",
         ["Van Gogh was an artist.", "I am an artist too."]),
    word("technique", "🖌️", "A way of doing something, like a way of making marks.",
         ["I borrowed van Gogh's technique.", "Swirling is a technique."]),
    word("swirl", "🌀", "A shape that curls round and round.",
         ["The sky is full of swirls.", "I painted a swirl."]),
    word("woodblock print", "🪵", "A picture carved into wood, then printed with ink.",
         ["The great wave is a woodblock print.", "Each block printed one colour."]),
    word("borrow", "🤝", "To take an idea from someone and use it, and say whose it was.",
         ["I borrowed Hokusai's wave.", "It is fine to borrow an idea."]),
    word("influence", "💡", "When one artist's work gives another artist ideas.",
         ["Hokusai was an influence on me.", "Who is your influence?"]),
]

LESSON["home"] = [
    home("Swirling sky", "Paper, blue and yellow paints or crayons, and a brush",
         ["Fill the sky with curling, swirling strokes, one next to another.", "Add stars with rings of light round them.",
          "Draw something of your own underneath: your house, your street."],
         "Whose technique did you borrow?"),
    home("My great wave", "Paper, a blue crayon and a white crayon",
         ["Draw a huge curling wave.", "Add foam at the top, like claws.", "Put something tiny far away behind it."],
         "What looks far away, and why?"),
    home("Artist hunt", "A book, a website with a grown-up, or a visit to a gallery",
         ["Find one work of art you like.", "Say one thing the artist did: their technique.",
          "Try that technique in your sketchbook."],
         "Whose idea did you borrow? How did you make it your own?"),
]

LESSON["journal"] = {
    "changes": ["add more swirls", "make the wave bigger", "put something far away", "try the other artist's technique", "keep it just as it is"],
}
