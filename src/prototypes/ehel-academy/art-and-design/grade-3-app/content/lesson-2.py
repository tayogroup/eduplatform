# -*- coding: utf-8 -*-
"""Lesson 2 - Light and Shade.

0067 Stage 3: E.02 "a range of graphite pencils of various hardness could be
explored to develop the representation of tone ... charcoal could be used to
capture tone" - the progression text's own two examples; M.01 use the
pencils with growing skill and "make simple inferences about effective media
... for a specific task"; M.02 choose the pencil for the job; E.03 record
light and shade from observation; E.01 read a drawing's light and shadow.
The step up from Grades 1-2: tone was a ladder of colours to order; now it is
light falling on a real thing, and a choice of tools to show it.
"""
from _kit import explain, step, opt, q, swatch, spot, part, word, home, material

LESSON = {
    "slug": "light-and-shade",
    "title": "Light and Shade",
    "blurb": "Meet pencils from hard to soft and charcoal, put pencil tones in order, choose the right pencil for each job, find the light, the shade and the cast shadow, and draw light and dark lines of your own.",
    "steps": [
        step("demo", "Hard and soft pencils", "✏️", "Pencil tester", ["3E.02", "3M.01"],
             "Press <b>Next</b> and find out why pencils have letters on them.",
             explain(
                 ["Not every pencil is the same.", "The letter on a pencil tells you how light or dark it draws."],
                 ["H means hard. A hard pencil draws pale, fine lines.", "B means black. A soft B pencil draws dark lines.",
                  "The bigger the number next to B, the darker: 6B is darker than 2B. The bigger the number next to H, the paler.", "Charcoal is wood slowly burnt without air. It makes very dark marks."],
                 ["Children press harder with a hard pencil to get dark.", "Change the pencil instead. A soft pencil does it for you."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "✏️", "cap": "Look at the end of a pencil. It has a <b>letter</b> and sometimes a number.", "say": "Look at the end of a pencil. It has a letter and sometimes a number."},
                 {"pic": "🪨", "cap": "<b>H</b> means hard. An H pencil draws pale, fine lines.", "say": "H means hard. An H pencil draws pale, fine lines."},
                 {"pic": "⬛", "cap": "<b>B</b> means black. A B pencil is soft and draws dark lines.", "say": "B means black. A B pencil is soft and draws dark lines."},
                 {"pic": "🔢", "cap": "The bigger the number next to B, the darker: <b>6B</b> is darker than 2B.", "say": "The bigger the number next to B, the darker: 6B is darker than 2B."},
                 {"pic": "🔥", "cap": "<b>Charcoal</b> is wood slowly burnt without air. It makes very dark, smudgy marks.", "say": "Charcoal is wood slowly burnt without air. It makes very dark, smudgy marks.", "sound": "rustle"},
                 {"pic": "🧽", "cap": "An <b>eraser</b> can lift pencil off, to make a bright shine.", "say": "An eraser can lift pencil off, to make a bright shine.", "sound": "tada"},
             ]},
             "H is hard and pale, B is soft and dark, and charcoal is darkest of all."),

        step("tone", "Pencil tones, light to dark", "🩶", "Tone ladder", ["3E.02", "3E.03"],
             "Each patch was shaded with a different pencil. Put them in order, from the lightest to the darkest.",
             explain(
                 ["Tone means how light or dark something is.", "Different pencils give different tones."],
                 ["The hardest pencil gives the palest grey.", "The softest gives the darkest.", "Put them in order, pale to dark."],
                 ["Children guess from the letters.", "Look at the grey itself."],
                 ["Tap the lightest one first."]),
             {"swatches": [
                 swatch("h2", "2H pencil", "#D9D9D9", "2H, the hardest and palest here."),
                 swatch("h", "H pencil", "#BDBDBD", "H, hard and light."),
                 swatch("hb", "HB pencil", "#9A9A9A", "HB, right in the middle."),
                 swatch("b2", "2B pencil", "#6E6E6E", "2B, soft and darker."),
                 swatch("b6", "6B pencil", "#3A3A3A", "6B, the softest and darkest pencil."),
              ]},
             "You put five pencil tones in order, from 2H to 6B."),

        step("choose", "Which pencil for the job?", "🧰", "Pencil chooser", ["3M.02", "3M.01"],
             "Each part of a drawing needs a different tool. Which would you use? Tap it.",
             explain(
                 ["Artists choose the tool that gives the tone they want."],
                 ["Light guide lines want a hard pencil.", "The darkest shadow wants a very soft pencil or charcoal.",
                  "A shine wants the eraser."],
                 ["Children use one pencil for everything.", "Change pencils as the job changes."],
                 ["Read the job, then tap the tool."]),
             {"materials": [
                 material("h2", "A 2H pencil", "✏️", ["light", "fine"], "2H is hard, pale and fine."),
                 material("hb", "An HB pencil", "✏️", ["middle"], "HB gives a middle grey."),
                 material("b6", "A 6B pencil", "✏️", ["dark", "soft"], "6B is soft and dark."),
                 material("charcoal", "Charcoal", "⬛", ["dark", "big", "smudgy"], "Charcoal is dark and covers big areas fast."),
                 material("eraser", "An eraser", "🧽", ["highlight"], "An eraser lifts pencil off to make a shine."),
              ],
              "rounds": [
                  {"purpose": "light guide lines you can rub out later", "needs": "light", "pic": "📏", "why": "A hard 2H pencil makes pale lines that rub out easily."},
                  {"purpose": "the darkest shadow under an apple", "needs": "dark", "pic": "🍎", "why": "A soft 6B pencil or charcoal gives the darkest tone."},
                  {"purpose": "a big, dark stormy sky, fast", "needs": "big", "pic": "⛈️", "why": "Charcoal covers a big area quickly and darkly."},
                  {"purpose": "the white shine on a shiny apple", "needs": "highlight", "pic": "✨", "why": "The eraser lifts the pencil away, leaving a bright shine."},
                  {"purpose": "an even middle grey", "needs": "middle", "pic": "🩶", "why": "HB is right in the middle."},
              ]},
             "You chose the right tool for five jobs."),

        step("source", "Light and shadow in a drawing", "🍎", "Shadow finder", ["3E.01", "3E.03"],
             "This is a pencil drawing of an apple, with the light coming from one side. Tap the parts to find how the artist showed light.",
             explain(
                 ["When light shines on something, one side is bright and the other is in shade.", "It also throws a shadow."],
                 ["Tap the highlight: the brightest spot.", "Tap the shade: the side away from the light.",
                  "Tap the cast shadow on the table, and the light."],
                 ["Children colour the whole apple the same grey.", "Light on one side, dark on the other. That makes it look round."],
                 ["Tap three things and listen."]),
             {"scene": "stilllife", "need": 3, "caption": "Tap the highlight, the shade and the cast shadow.",
              "spots": [
                  spot("light", "the light", "The light comes from the top left. Everything else in the drawing follows from that.", 30, 36, "☀️"),
                  spot("highlight", "the highlight", "The brightest spot, facing the light. The artist left the paper white here.", 136, 100, "✨"),
                  spot("shade", "the shade", "The side facing away from the light is dark. The artist used a soft pencil and short lines here.", 208, 146, "🌑"),
                  spot("cast", "the cast shadow", "The apple blocks the light, so a dark shadow falls on the table, away from the light.", 266, 192, "⬛"),
              ],
              "then": {"ask": "Where is the light coming from?",
                       "opts": [{"t": "the top left", "spot": "light"}, {"t": "underneath the table"}, {"t": "the right"}],
                       "why": "The highlight is on the left and the shadow falls to the right, so the light comes from the top left."}},
             "You found the light, the highlight, the shade and the cast shadow."),

        step("sort", "Light, shade or cast shadow?", "🗂️", "Light sorter", ["3E.03", "3E.02"],
             "A lamp shines from the left. Is each part in the light, in shade, or a cast shadow? Tap the bin.",
             explain(
                 ["Light, shade and cast shadow are three different things.", "Knowing which is which helps you draw them."],
                 ["A side facing the lamp is in the light.", "A side facing away is in shade.", "In Grade 2, a shade was a colour mixed with black. Here, in shade means turned away from the light.",
                  "The dark shape a thing throws onto something else is a cast shadow."],
                 ["Children mix up shade and shadow.", "Shade is ON the thing. A cast shadow falls on something ELSE."],
                 ["Think where the lamp is, then tap the bin."]),
             {"ask": "In the light, in shade, or a cast shadow?",
              "bins": [{"id": "light", "label": "In the light", "pic": "☀️"}, {"id": "shade", "label": "In shade", "pic": "🌗"}, {"id": "cast", "label": "Cast shadow", "pic": "⬛"}],
              "items": [
                  {"pic": "⚽", "label": "the side of a ball facing the lamp", "bin": "light", "why": "It faces the lamp, so it is lit."},
                  {"pic": "⚽", "label": "the side of the ball facing away from the lamp", "bin": "shade", "why": "It faces away, so it is in shade."},
                  {"pic": "⬛", "label": "the dark shape on the table beside the ball", "bin": "cast", "why": "The ball blocks the light and throws that shadow onto the table."},
                  {"pic": "☕", "label": "the shiny spot on a cup, facing the lamp", "bin": "light", "why": "It faces the lamp. It is the highlight."},
                  {"pic": "📦", "label": "the back of a box, away from the lamp", "bin": "shade", "why": "The back faces away from the light."},
                  {"pic": "🌳", "label": "the dark shape of a tree lying on the grass", "bin": "cast", "why": "The tree blocks the sun, so its shadow falls on the grass."},
                  {"pic": "🧍", "label": "your shadow on the playground", "bin": "cast", "why": "You block the sun, and your shadow falls on the ground."},
              ]},
             "You sorted light, shade and cast shadows."),

        step("marks", "Light and dark lines", "✏️", "Tone drawer", ["3M.01", "3E.02"],
             "Draw each line with the tool the card asks for. Watch how different they look.",
             explain(
                 ["The same line looks very different in a hard pencil and in charcoal."],
                 ["A hard pencil makes a thin, pale line.", "Charcoal makes a thick, dark line.",
                  "A round edge shows the shape of an apple.", "A long, dark line can be a shadow on the table."],
                 ["Children press too hard with charcoal and snap it.", "Hold it gently. It is dark without pressing."],
                 ["Draw the first line."]),
             {"tools": ["pencil", "charcoal", "crayon"],
              "rounds": [
                  {"tool": "pencil", "want": "thin", "made": "a pale guide line", "ask": "With the pencil, draw one light, thin guide line.", "pic": "📏", "why": "Thin and pale. A guide line, easy to rub out."},
                  {"tool": "charcoal", "want": "thick", "made": "a dark charcoal line", "ask": "With the charcoal, draw one thick, dark line.", "pic": "⬛", "why": "Thick and dark. That is charcoal."},
                  {"tool": "pencil", "want": "round", "made": "the round edge of an apple", "ask": "With the pencil, draw the round edge of an apple: all the way round.", "pic": "🍎", "why": "All the way round. That is the apple's edge."},
                  {"tool": "charcoal", "want": "long", "made": "a long cast shadow", "ask": "With the charcoal, draw a long shadow across the table.", "pic": "🌑", "why": "Long and dark, lying along the table. A cast shadow."},
              ]},
             "You drew pale and dark lines with a pencil and charcoal."),

        step("questions", "Tone spotter", "💬", "Tone spotter", ["3E.02", "3M.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about pencils, tone and shadow.", "You have met every one of them."],
                 ["Think about the letters on pencils, the tones, and where the light falls."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Tone", "items": [
                 q("What does the H on a pencil mean?", "✏️", "hard", ["huge", "happy"], "H means hard. It draws pale, fine lines."),
                 q("Which is darker?", "⬛", "a 6B pencil", ["a 2B pencil", "a 2H pencil"], "The bigger the number next to B, the darker."),
                 q("The shadow a ball throws on the table is…", "⬛", "a cast shadow", ["a highlight", "shade"], "A cast shadow falls on something else."),
                 q("Which tool makes a bright shine?", "🧽", "an eraser", ["charcoal", "a 6B pencil"], "The eraser lifts the pencil off."),
             ]},
             "You know your pencils and your shadows."),

        step("quiz", "Show what you know", "⭐", "Star shader", ["3E.01", "3E.02", "3E.03", "3M.01", "3M.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about hard and soft pencils, the tone ladder, choosing, the apple, and light and shadow."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does tone mean?", "🩶", "how light or dark something is", ["what colour something is", "how big something is"], "Tone is lightness and darkness."),
                 q("Which pencil draws the palest line?", "✏️", "2H", ["HB", "6B"], "2H is the hardest and palest."),
                 q("Why draw guide lines with a hard pencil?", "📏", "because pale lines rub out easily later", ["because hard pencils are longer", "because they are the darkest"], "Pale lines are easy to rub out when the drawing is done."),
                 q("What is charcoal made from?", "🔥", "burnt wood", ["plastic", "chalk"], "Charcoal is burnt wood."),
                 q("Why is one side of the apple dark?", "🍎", "because it faces away from the light", ["because the apple is rotten", "because the pencil broke"], "The side away from the light is in shade."),
                 q("Shade is on the thing. A cast shadow…", "⬛", "falls on something else", ["is always white", "is the brightest spot"], "A cast shadow falls on the table, the ground or a wall."),
                 q("Which would you use for a big, dark sky, fast?", "⛈️", "charcoal", ["a 2H pencil", "an eraser"], "Charcoal covers big areas darkly and quickly."),
                 q("The brightest spot, facing the light, is the…", "✨", "highlight", ["cast shadow", "shade"], "The highlight is the brightest spot."),
             ]},
             "That is the whole lesson finished. You can show light and shade with the right tools."),
    ],
}


LESSON["about"] = [
    "Say what H and B on a pencil mean.",
    "Put pencil tones in order, from light to dark.",
    "Choose the right pencil, charcoal or eraser for a job.",
    "Find the highlight, the shade and the cast shadow in a drawing.",
    "Draw pale and dark lines with a pencil and charcoal.",
]

LESSON["lecture"] = [
    part("✏️", "Letters on pencils",
         "Pencils have letters. H means hard: pale, fine lines. B means black: soft, dark lines. The bigger the number, the stronger. A 6B pencil is darker than a 2B."),
    part("🩶", "Tone",
         "Tone means how light or dark something is. With a few pencils and some charcoal, you can make every grey from almost white to almost black."),
    part("☀️", "Light and shade",
         "When light shines on something, the side facing the light is bright. The brightest spot is the highlight. The side facing away is in shade. That is what makes a drawing look round."),
    part("⬛", "Cast shadows",
         "A thing that blocks the light throws a shadow onto something else. That is a cast shadow. It always falls away from the light."),
]

LESSON["words"] = [
    word("tone", "🩶", "How light or dark something is.",
         ["I shaded five tones.", "The tone gets darker at the bottom."]),
    word("graphite", "✏️", "The grey stuff inside a pencil that makes the mark.",
         ["Soft graphite makes dark lines.", "Graphite pencils come in many grades."]),
    word("charcoal", "⬛", "A dark drawing stick made from burnt wood.",
         ["Charcoal smudges easily.", "I drew the storm in charcoal."]),
    word("highlight", "✨", "The brightest spot, where the light hits.",
         ["I rubbed out a highlight.", "The apple has a highlight."]),
    word("shade", "🌗", "The darker side of a thing, facing away from the light.",
         ["The back of the box is in shade.", "I shaded the side of the apple."]),
    word("shadow", "⬛", "A dark shape made when something blocks the light.",
         ["The apple's shadow is on the table.", "My shadow is long in the evening."]),
]

LESSON["home"] = [
    home("Pencil ladder", "Two or three different pencils (like 2H, HB and 4B) and paper",
         ["Draw a row of small boxes.", "Shade the first with the hardest pencil, gently.", "Shade the next ones with softer pencils.",
          "Write the letter under each box."],
         "Which pencil gave the darkest box?"),
    home("Lamp and apple", "An apple or a ball, a lamp or a sunny window, a pencil and paper, and a grown-up",
         ["Put the apple on a table with the light on one side.", "Draw its round edge.",
          "Shade the side away from the light, and draw the cast shadow on the table.", "Leave a white spot for the highlight."],
         "Does your apple look round?"),
    home("Charcoal night", "A stick of charcoal, an eraser, paper, and old clothes",
         ["Cover the paper with charcoal, gently, using the side of the stick.", "Use the eraser to lift out a moon and some stars.",
          "Wash your hands when you finish."],
         "Can you make the moon glow by rubbing out more?"),
]

LESSON["journal"] = {
    "changes": ["make the shadow darker", "leave a bigger highlight", "use a softer pencil", "draw the light coming from the other side", "keep it just as it is"],
}
