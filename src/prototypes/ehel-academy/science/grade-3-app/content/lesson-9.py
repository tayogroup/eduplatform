# -*- coding: utf-8 -*-
"""Lesson 9 - Gravity and Friction.

0097 Stage 3: 3Pf.01 forces can be measured with a forcemeter; 3Pf.02
gravity pulls towards the centre of the Earth; 3Pf.03 friction between
surfaces makes movement harder; 3Pf.04 smooth and rough surfaces give
different amounts of friction; 3TWSa.02 patterns in results; 3TWSa.04 bar
charts; with 3TWSp.03, 3TWSc.06, 3TWSa.01, 3TWSa.03 and 3SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "gravity-and-friction",
    "title": "Gravity and Friction",
    "blurb": "Measure the pull of gravity with a forcemeter, find out which way down is, slide a block over ice, wood and carpet, record and graph the distances, and read the pattern.",
    "steps": [
        step("experiment", "Measure a force", "\U0001F4CF", "Forcemeter", ["3Pf.01", "3Pf.02", "3TWSp.03", "3TWSa.03"],
             "A forcemeter measures a force in <b>newtons</b>. Predict which thing will stretch it most.",
             explain(
                 ["A forcemeter is a spring with a hook and a scale.", "Hang something on it and gravity pulls the thing down, the spring stretches, and the scale reads the force in newtons."],
                 ["Hang the apple: about two newtons.", "Hang the shoe: three.", "Hang the big book: five."],
                 ["Children think the forcemeter weighs the thing in grams.", "It measures the pull on it, in newtons. The pull is gravity."],
                 ["Predict, hang all three, then conclude."]),
             {"sim": "forcemeter",
              "predict": {"ask": "Which will stretch the spring the most?",
                          "opts": [opt("The big book", True), opt("The apple", False), opt("They will all stretch it the same", False)]},
              "runAsk": "Hang each thing on the hook and read the newtons.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("The book stretched it most: five newtons. The apple least: two", True), opt("Everything read two newtons", False), opt("The apple stretched it most", False)],
                           "why": "Two, three, five newtons. The heavier the thing, the harder gravity pulls it down."},
              "conclude": {"ask": "What does a forcemeter measure?",
                           "opts": [opt("The size of a force, in newtons", True), opt("How long something is", False), opt("How hot something is", False)],
                           "why": "A forcemeter measures force. The force here was gravity pulling each thing down."}},
             "A forcemeter measures force in newtons. Gravity is the force pulling things down."),

        step("demo", "Which way is down?", "\U0001F30D", "Gravity", ["3Pf.02"],
             "Press <b>Next</b> to drop a ball on both sides of the world, then see which tool measures a pull.",
             explain(
                 ["Gravity is a pull towards the centre of the Earth.", "That is why down is a different direction in Australia from here, and it is still down."],
                 ["Drop a ball here: it falls towards the ground.", "Drop a ball on the other side of the world: it falls towards the ground there.", "Both fall towards the centre of the Earth.", "The tool that measures a pull is the forcemeter, not the ruler or the thermometer."],
                 ["Children think people in Australia are upside down.", "Down means towards the centre. Wherever you stand, down points to the centre."],
                 ["Press Next through all five."]),
             {"frames": [
                 {"pic": "⚽", "cap": "Drop a ball. It falls <b>down</b>. Gravity pulled it.", "say": "Let go of a ball and it falls down. Nobody pushed it. Gravity pulled it."},
                 {"scene": {"id": "gravity", "state": 0}, "cap": "A person stands on the Earth. Gravity pulls them <b>down</b>: towards the <b>centre</b> of the Earth.", "say": "Here is a person standing on the Earth. The red arrow shows which way gravity pulls them: down, towards the centre of the Earth. Gravity pulls everything towards the middle of the planet."},
                 {"scene": {"id": "gravity", "state": 1}, "cap": "A person on the other side of the world. To us they look upside down, but their down points to the <b>centre</b> too.", "say": "Here is a person on the other side of the world. From here they look upside down, but they stand on the ground just as you do. Their down points to the centre of the Earth, like ours, and a ball they drop falls to their ground."},
                 {"pic": "\U0001F34E", "cap": "The bigger the pull, the more the forcemeter reads. Gravity pulls the book harder than the apple.", "say": "Gravity pulls everything, and it pulls heavier things harder. That is why the book stretched the forcemeter more than the apple."},
                 {"pic": "\U0001F9F0", "cap": "Which tool measures a pull? The <b>forcemeter</b>. Not the ruler, the thermometer or the measuring jug. Hang the thing on the hook, wait until it stops bouncing, then read the newtons.", "say": "Which tool measures a pull? A ruler measures length, a thermometer measures how hot, a measuring jug measures liquid. The forcemeter measures a force. Hang the thing on its hook, wait until the spring stops bouncing, then read the number of newtons."},
             ]},
             "Gravity pulls everything towards the centre of the Earth."),

        step("experiment", "Slide it on three surfaces", "\U0001F9CA", "Friction test", ["3Pf.03", "3Pf.04", "3TWSp.03", "3TWSa.01", "3TWSa.03"],
             "Push a block the same way on ice, smooth wood and rough carpet. Predict where it slides furthest.",
             explain(
                 ["Friction is a force between two surfaces that rub. It makes moving harder.", "Rough surfaces make more friction than smooth ones."],
                 ["Same block, same push. Only the surface changes: a fair test.", "On ice it slides a long way.", "On carpet it stops fast."],
                 ["Children think smooth surfaces have no friction.", "Even ice has a little friction: the block slows down and stops in the end."],
                 ["Predict, push on all three, say what happened, then conclude."]),
             {"sim": "friction",
              "predict": {"ask": "Where will the block slide <b>furthest</b>?",
                          "opts": [opt("On the ice", True), opt("On the carpet", False), opt("The same on all three", False)]},
              "runAsk": "Press Push on each surface. Watch where the block stops.",
              "happened": {"ask": "What happened?",
                           "opts": [opt("Ice: 9 marks. Wood: 6. Carpet: 2. The rougher the surface, the sooner it stopped", True), opt("It slid the same on all three", False), opt("It slid furthest on the carpet", False)],
                           "why": "Nine, six, two. The rough carpet made the most friction and stopped the block fastest."},
              "conclude": {"ask": "What does this tell us about friction?",
                           "opts": [opt("Rough surfaces make more friction, so things slow down faster on them", True), opt("Ice has the most friction", False), opt("Friction makes things speed up", False)],
                           "why": "Friction makes movement harder, and rough surfaces make more of it. That is what the results show."}},
             "Rough surfaces make more friction. Smooth surfaces make less."),

        step("record", "Record the distances", "\U0001F4CB", "Friction table", ["3TWSc.06", "3Pf.04"],
             "Fill in the table. How far did the block slide on the <b>%s</b>?",
             explain(
                 ["Three surfaces, three distances, in a table."],
                 ["Ice: nine marks.", "Smooth wood: six.", "Rough carpet: two."],
                 [],
                 ["Tap the number for each row."]),
             {"ask": "How far did the block slide on the %s?",
              "columns": ["Surface", "Marks slid"],
              "rows": [
                  {"pic": "\U0001F9CA", "label": "ice", "answer": "9", "why": "on the ice it slid nine marks: the least friction."},
                  {"pic": "\U0001FAB5", "label": "smooth wood", "answer": "6", "why": "on the wood it slid six marks."},
                  {"pic": "\U0001F9F6", "label": "rough carpet", "answer": "2", "why": "on the carpet it slid only two marks: the most friction."},
              ],
              "choices": [{"id": "9", "t": "9 marks", "pic": "9️⃣"}, {"id": "6", "t": "6 marks", "pic": "6️⃣"}, {"id": "2", "t": "2 marks", "pic": "2️⃣"}]},
             "Nine, six, two. A table you can compare."),

        step("graph", "Draw a bar chart", "\U0001F4CA", "Bar chart", ["3TWSa.04", "3TWSa.02", "3Pf.04"],
             "Turn your table into a <b>bar chart</b>. Tap + 1 until each bar is right, then read the pattern.",
             explain(
                 ["A bar chart shows results as bars against a scale, so you can compare them at a glance."],
                 ["The scale up the side counts the marks.", "Tap until the ice bar reaches nine, the wood bar six, the carpet bar two.", "Then read the pattern: smoother surface, longer slide."],
                 ["Children read the tallest bar as the most friction.", "The tallest bar is the longest slide, which means the least friction."],
                 ["Build the bars, then answer."]),
             {"columns_label": "Surface", "value_label": "Marks slid", "unit": "marks", "bar": True,
              "columns": [{"pic": "\U0001F9CA", "label": "ice", "value": 9}, {"pic": "\U0001FAB5", "label": "wood", "value": 6}, {"pic": "\U0001F9F6", "label": "carpet", "value": 2}],
              "pattern": {"ask": "Read the bar chart. What is the pattern?",
                          "opts": [opt("The smoother the surface, the further the block slides", True), opt("The rougher the surface, the further it slides", False), opt("There is no pattern", False)],
                          "why": "Ice, the smoothest, has the tallest bar. Carpet, the roughest, the shortest. Smoother surface, less friction, longer slide."}},
             "A bar chart shows the pattern: smoother surface, longer slide."),

        step("context", "Friction at work", "\U0001F6B2", "Useful friction", ["3SIC.02", "3Pf.03"],
             "Science explains how everyday things use friction, or get rid of it. Tap each one.",
             explain(
                 ["Sometimes we want friction. Sometimes we want less of it."],
                 ["Bicycle brakes rub the wheel: friction stops you.", "Shoe soles are rough so you do not slip.", "Ice skates are smooth to slide with almost no friction.", "Oil on a hinge makes it move easily."],
                 [],
                 ["Tap each one and say: more friction, or less?"]),
             {"items": [
                 {"pic": "\U0001F6B2", "label": "bicycle brakes", "say": "Brakes press rubber pads against the wheel. The friction slows the wheel down and stops you. Friction we want."},
                 {"pic": "\U0001F45F", "label": "shoe soles", "say": "The bottoms of shoes are rough and bumpy. That makes friction with the ground, so your feet grip and you do not slip."},
                 {"pic": "⛸️", "label": "ice skates", "say": "A skate has a smooth thin blade on smooth ice. Very little friction, so you glide a long way from one push."},
                 {"pic": "\U0001F6E2️", "label": "oil on a hinge", "say": "A squeaky door hinge has too much friction. A drop of oil makes the surfaces slippery, and the door swings easily."},
             ], "need": 4,
              "then": {"ask": "Why are shoe soles rough?",
                       "opts": [opt("To make more friction so you do not slip", True), opt("To make less friction so you go faster", False), opt("To look nice", False)],
                       "why": "Rough surfaces make more friction, and friction is grip."}},
             "Brakes and soles want friction. Skates and hinges want less."),

        step("questions", "Force check", "✅", "Force check", ["3Pf.01", "3Pf.02", "3Pf.03", "3Pf.04", "3TWSc.02"],
             "Tap the answer.",
             explain(
                 ["Forcemeters, gravity, friction, and rough or smooth.", "And choosing the right tool for the job."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What does a forcemeter measure?", "\U0001F4CF", "force, in newtons", ["length, in centimetres", "temperature", "time"], "Force in newtons."),
                 q("Which way does gravity pull?", "\U0001F30D", "towards the centre of the Earth", ["up into the sky", "sideways"], "Down means towards the centre."),
                 q("Which tool would you choose to measure how hard gravity pulls a bag?", "\U0001F6CD️", "a forcemeter", ["a ruler", "a thermometer", "a measuring jug"], "A forcemeter measures a pull, in newtons. A ruler measures length, a thermometer how hot, a jug how much liquid."),
                 q("What is friction?", "\U0001F9F6", "a force between surfaces that rub, which makes moving harder", ["a kind of magnet", "a pull from the Moon"], "Surfaces rubbing."),
                 q("Which surface gives the most friction?", "\U0001F9F6", "rough carpet", ["smooth ice", "polished wood"], "Rough means more friction."),
                 q("The block slid furthest on the ice because...", "\U0001F9CA", "ice is smooth and gives little friction", ["ice is cold", "ice pushed it"], "Smooth surface, less friction."),
             ]},
             "You know your forces."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Pf.01", "3Pf.02", "3Pf.03", "3Pf.04", "3TWSa.02", "3TWSa.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("The unit of force is the...", "\U0001F4CF", "newton", ["centimetre", "gram", "litre"], "Newtons, on the forcemeter."),
                 q("Which stretched the forcemeter most?", "\U0001F4D5", "the big book, five newtons", ["the apple, two newtons", "the shoe, three newtons"], "Heavier, harder pull."),
                 q("A ball dropped in Australia falls...", "\U0001F30D", "towards the ground, towards the centre of the Earth", ["up into space", "sideways to us"], "Down is always towards the centre."),
                 q("What is the force that pulls a dropped ball down?", "⚽", "gravity", ["friction", "magnetism"], "Gravity pulls it."),
                 q("On which surface did the block stop soonest?", "\U0001F9F6", "the rough carpet", ["the ice", "the smooth wood"], "Most friction, shortest slide."),
                 q("In the bar chart, which bar was tallest?", "\U0001F4CA", "ice, nine marks", ["carpet, two marks", "wood, six marks"], "The longest slide."),
                 q("What pattern did the bar chart show?", "\U0001F4C8", "smoother surface, longer slide", ["rougher surface, longer slide", "no pattern"], "Less friction, further."),
                 q("Why do bicycle brakes work?", "\U0001F6B2", "friction between the pads and the wheel slows it", ["gravity pulls the wheel", "magnets stop it"], "Friction slows movement."),
                 q("You want to find out which shoe grips the floor best. Which is the fair test?", "\U0001F45F", "pull each shoe across the same floor with a forcemeter, changing only the shoe", ["pull one shoe on carpet and the other on ice", "guess by looking at the soles"], "Same floor, same forcemeter, and only the shoe changes. The shoe that needs the biggest pull grips best."),
                 q("Why is sand spread on an icy path?", "\u2744\uFE0F", "it makes the path rougher, so there is more friction and less slipping", ["it melts the ice at once", "it makes gravity pull harder"], "A rough surface gives more friction, so shoes grip."),
                 q("Predict: a block slides on sandpaper instead of smooth wood. What will happen, and why?", "\U0001F4E6", "it stops sooner, because sandpaper is rougher and gives more friction", ["it slides further, because sandpaper is rougher", "it slides the same, because it is the same block"], "Rougher surface, more friction, shorter slide."),
             ]},
             "That is the whole lesson finished. You know gravity and friction."),
    ],
}

LESSON["about"] = [
    "Measure a force with a forcemeter, in newtons.",
    "Say which way gravity pulls.",
    "Test friction on three surfaces and say why the block stopped where it did.",
    "Draw a bar chart of the results and read the pattern.",
]

LESSON["warmup"] = [
    q("Which tool separates iron filings from sand?", "\U0001F9F2", "a magnet", ["a filter", "a thermometer"], "Iron is magnetic and sand is not, so a magnet pulls the filings out."),
    q("What makes a toy car start to move?", "\U0001F697", "a push or a pull", ["looking at it", "its colour"], "A push or a pull is a force, and a force can start something moving."),
]

LESSON["lecture"] = [
    part("\U0001F4CF", "Measuring a force",
         "A forcemeter is a spring with a hook. Hang something on it and the spring stretches. The scale tells you the force in newtons. The heavier the thing, the harder gravity pulls it, and the further the spring stretches."),
    part("\U0001F30D", "Gravity",
         "Let go of a ball and it falls. Gravity pulled it. Gravity pulls everything towards the centre of the Earth. That is what down means. On the other side of the world, down points the other way, and it is still down."),
    part("\U0001F9F6", "Friction",
         "Push a block along the floor and it slows down and stops. Friction did that. Friction is a force between two surfaces that rub together. It makes moving harder."),
    part("\U0001F9CA", "Rough and smooth",
         "Rough surfaces make more friction. Smooth surfaces make less. Push the same block the same way on ice, on wood and on carpet, and it slides furthest on the ice and stops soonest on the carpet."),
    part("\U0001F4CA", "A bar chart",
         "Write your three distances in a table. Then draw them as bars against a scale: that is a bar chart. The tallest bar is the longest slide. Reading the bars, you can see the pattern at a glance."),
]

LESSON["words"] = [
    word("forcemeter", "\U0001F4CF", "A tool with a spring and a hook that measures a force in newtons.",
         ["Hang the apple on the forcemeter.", "The forcemeter read five newtons."]),
    word("newton", "\U0001F34E", "The unit a force is measured in.",
         ["The book pulled with five newtons.", "Gravity pulls the apple with two newtons."]),
    word("gravity", "\U0001F30D", "The force that pulls everything towards the centre of the Earth.",
         ["Gravity pulled the ball down.", "Gravity keeps us on the ground."]),
    word("friction", "\U0001F9F6", "A force between two surfaces that rub together. It makes moving harder.",
         ["Friction stopped the block.", "Brakes use friction."]),
    word("surface", "\U0001FAB5", "The outside of something, the part that touches other things.",
         ["Ice is a smooth surface.", "Carpet is a rough surface."]),
    word("bar chart", "\U0001F4CA", "A graph with bars against a scale, to compare results.",
         ["The bar chart shows ice was the longest slide.", "Draw a bar chart of the distances."]),
    word("pattern", "\U0001F4C8", "Something that happens the same way every time in the results.",
         ["The pattern is: smoother surface, longer slide.", "Look for a pattern in the bar chart."]),
]

LESSON["home"] = [
    home("Slide test", "A toy car or a wooden block, a smooth table, a tea towel, a doormat, a ruler",
         ["Push the car the same way on each surface. Try to push exactly the same each time.",
          "Measure how far it went in centimetres.",
          "Draw a bar chart of the three distances."],
         "Tallest bar on the smoothest surface. That is the pattern."),
    home("Make a forcemeter", "A strong elastic band, a paperclip bent into a hook, a ruler, a bag",
         ["Hang the band from a hook or a door handle, with the paperclip at the bottom.",
          "Keep your face away from the band. A grown-up hangs the bag on the clip and puts an apple in it. Measure how far the band stretches.",
          "The grown-up adds a second apple. Measure again."],
         "Twice the pull, and the band stretches further. A real forcemeter works the same way."),
    home("Drop everything", "A ball, a scrunched paper, a coin, a feather, a grown-up",
         ["Hold each thing up and let go.",
          "Which way does each one go?",
          "Drop the ball and the coin together from the same height."],
         "Everything falls down, towards the centre of the Earth. The feather is slowed by the air."),
]
