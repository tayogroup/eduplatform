# -*- coding: utf-8 -*-
"""Lesson 12 - The Solar System.

0097 Stage 4: 4ESs.01 the spinning Earth explains the Sun's apparent
movement, day and night, and changing shadows; 4ESs.02 the planets;
4ESs.03 the Sun at the centre; 4ESs.04 stars, planets, asteroids and
comets; 4TWSm.02 a model showing scale; with 4TWSp.03, 4TWSa.01, 4TWSa.03
and 4SIC.01.
"""
from _kit import explain, step, opt, q, part, word, home, cando

LESSON = {
    "slug": "the-solar-system",
    "title": "The Solar System",
    "blurb": "Spin the Earth to make day and night and swing the shadows round, put the eight planets in order from the Sun, meet asteroids and comets, and see how evidence put the Sun at the centre.",
    "steps": [
        step("experiment", "Spin the Earth", "\U0001F30D", "Day and night", ["4ESs.01", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "The Sun does not move across the sky. Predict what does.",
             explain(
                 ["The Earth spins once every 24 hours. That spin is what makes the Sun seem to rise, cross the sky and set. It makes day and night, and it swings the shadows round."],
                 ["Spin a quarter: midday, your side faces the Sun.", "Another quarter: sunset.", "Another: night, your side faces away.", "Another: sunrise again."],
                 ["Children think the Sun goes round the Earth.", "It looks that way. The Earth is turning under you."],
                 ["Predict, spin four times, say what happened, then conclude."]),
             {"sim": "dayNight",
              "predict": {"ask": "What makes the Sun seem to move across the sky?",
                          "opts": [opt("The Earth spinning on its axis", True), opt("The Sun flying round the Earth", False), opt("The clouds pushing it", False)]},
              "plan": {"ask": "How shall we find out whether it is the Sun or the Earth that moves? Which way is fair?",
                        "opts": [opt("Model it: keep the lamp still and turn the globe, then see if it matches what we see", True), opt("Watch the Sun all day and decide", False), opt("Turn the lamp round the globe and call it done", False)],
                        "why": "A model lets you try one idea at a time. Turn the globe and the Sun seems to cross the sky - exactly what happens."},
              "runAsk": "Press Spin on six hours, four times. Watch where you are.",
              "happened": {"ask": "What happened as you <b>turned the Earth</b>?",
                           "opts": [opt("As the Earth turned, my side faced the Sun, then turned away: day, then night, and the Sun seemed to move", True), opt("The Sun moved round the Earth while the Earth stayed still", False), opt("Nothing changed; it stayed day all the time", False)],
                           "why": "One spin, one day. The Sun stayed still. You turned past it."},
              "conclude": {"ask": "Why do shadows change through the day?",
                           "opts": [opt("The Earth's spin changes where the Sun appears in the sky, so the shadow swings round and changes length", True), opt("Shadows move about on their own", False), opt("The Sun comes much closer to the Earth at midday", False)],
                           "why": "Where the Sun appears decides where a shadow falls. The spin moves it."}},
             "The Earth spins. That makes day and night, the Sun's path, and the moving shadows.",
             mis=["5.5-m1"]),

        step("order", "The planets, from the Sun", "\U0001FA90", "Planet order", ["4ESs.02", "4ESs.03"],
             "Eight planets go round the Sun. Tap them in order, nearest to the Sun first.",
             explain(
                 ["The Sun is at the centre of the Solar System, and eight planets go round it."],
                 ["Mercury, Venus, Earth, Mars: the four small rocky ones.", "Jupiter, Saturn, Uranus, Neptune: the four giants, far out."],
                 ["Children put the Earth first.", "Earth is third. Two planets are closer to the Sun than we are."],
                 ["Tap the nearest to the Sun first."]),
             {"items": [
                 {"pic": "\U0001F7E4", "label": "Mercury", "say": "Mercury. Nearest the Sun, small and rocky: baking hot by day and freezing cold by night."},
                 {"pic": "\U0001F7E0", "label": "Venus", "say": "Venus. Wrapped in thick cloud, and the hottest planet of all."},
                 {"pic": "\U0001F30D", "label": "Earth", "say": "Earth. Third from the Sun. Ours, with water and air and life."},
                 {"pic": "\U0001F534", "label": "Mars", "say": "Mars. The red planet, rocky and cold, with the biggest volcano in the Solar System."},
                 {"pic": "\U0001F7E1", "label": "Jupiter", "say": "Jupiter. The biggest planet, a giant ball of gas with a storm bigger than the Earth."},
                 {"pic": "\U0001FA90", "label": "Saturn", "say": "Saturn. The one with the great rings of ice and rock."},
                 {"pic": "\U0001F535", "label": "Uranus", "say": "Uranus. A pale blue-green giant, tipped over on its side."},
                 {"pic": "\U0001F535", "label": "Neptune", "say": "Neptune. The farthest planet, deep blue, with the fastest winds anywhere."},
             ]},
             "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune."),

        step("explore", "What else is out there", "☄️", "Space objects", ["4ESs.04", "4ESs.03"],
             "A planetary system holds more than planets. Tap each one.",
             explain(
                 ["The Solar System is a star, the Sun, with everything that goes round it: planets, moons, asteroids and comets."],
                 ["The Sun: a star at the centre.", "Planets: big round worlds going round it.", "Asteroids: lumps of rock, most of them in a belt between Mars and Jupiter.", "Comets: balls of ice and dust that grow a tail when they come near the Sun."],
                 ["Children think a comet is a shooting star.", "A comet is a ball of ice and dust far out in space, going round the Sun. A shooting star is a speck of dust burning up in our air, just above us."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "☀️", "label": "a star", "sub": "the Sun, at the centre", "say": "A star is a huge ball of hot, glowing gas. Our star is the Sun, and it sits at the centre of the Solar System. Everything else goes round it."},
                 {"pic": "\U0001FA90", "label": "planets", "sub": "eight worlds going round it", "say": "Planets are big round worlds that go round a star. Ours has eight. Other stars have planets of their own."},
                 {"pic": "\U0001FAA8", "label": "asteroids", "sub": "lumps of rock", "say": "Asteroids are lumps of rock, some as small as a house, some hundreds of kilometres across. Most go round the Sun in a belt between Mars and Jupiter."},
                 {"pic": "☄️", "label": "comets", "sub": "ice with a tail", "say": "Comets are balls of ice and dust from the cold edge of the Solar System. When one swings near the Sun, the ice turns to gas and streams out as a glowing tail."},
             ], "need": 4,
              "then": {"ask": "Is the Sun a planet or a star?",
                       "opts": [opt("a star", True), opt("a planet", False), opt("both at once", False)],
                       "why": "A star is a huge ball of hot gas that makes its own light. A planet makes none - it only shines back the light of a star."}},
             "A star, planets, asteroids and comets: a planetary system."),

        step("demo", "A model to scale", "\U0001F4CF", "Scale model", ["4TWSm.02", "4ESs.02"],
             "The planets are far smaller and far further apart than any picture shows. Press <b>Next</b>.",
             explain(
                 ["A scale model shrinks everything by the same amount, so the sizes and distances are true to each other.", "At the scale of a football for the Sun, the Earth is a peppercorn 25 metres away."],
                 ["The Sun: a football.", "Earth: a peppercorn, 25 metres off.", "Jupiter: a grape, 130 metres off.", "Neptune: a smaller pea, 750 metres away."],
                 ["Children think the planets are close together, as in the pictures.", "The pictures squeeze them in. To scale, the model would not fit in a classroom."],
                 ["Press Next through all five."]),
             {"frames": [
                 {"pic": "⚽", "cap": "Let the Sun be a <b>football</b>.", "say": "Imagine the Sun as a football, about twenty centimetres across."},
                 {"pic": "\U0001F7E2", "cap": "Then the Earth is a <b>peppercorn</b>, <b>25 metres</b> away.", "say": "At that scale, the Earth is a peppercorn, two millimetres across, and it sits twenty-five metres from the football."},
                 {"pic": "\U0001F347", "cap": "Jupiter is a <b>grape</b>, 130 metres away.", "say": "Jupiter, the biggest planet, is a grape, a hundred and thirty metres from the football."},
                 {"pic": "\U0001F7E2", "cap": "Neptune is a small pea, <b>750 metres</b> away: most of a kilometre.", "say": "Neptune is a small pea, seven hundred and fifty metres away. Most of a kilometre, for one football and a handful of seeds."},
                 {"pic": "\U0001F4CF", "cap": "A <b>scale model</b> keeps the sizes and distances true to each other. Pictures on a page cannot.", "say": "That is a scale model: everything shrunk by the same amount, so the sizes and distances stay true to each other. A picture on a page squeezes the planets together so they fit. It shows the order, not the scale."},
             ]},
             "A scale model keeps sizes and distances true: mostly empty space."),

        step("context", "The Sun at the centre", "\U0001F4DC", "Centre of things", ["4SIC.01", "4ESs.03", "4ESs.01"],
             "For two thousand years people put the Earth at the centre. Evidence moved it. Tap each one.",
             explain(
                 ["Scientific knowledge changes through evidence from enquiry."],
                 ["The old idea: everything goes round the Earth. It matched what you see.", "Copernicus worked out the sums fitted better with the Sun at the centre.", "Galileo's telescope saw moons going round Jupiter, and Venus showing phases like the Moon.", "The evidence won."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F30D", "label": "the old idea", "say": "For two thousand years almost everyone believed the Earth stood still at the centre and the Sun, Moon and planets went round it. It matched what you see every day."},
                 {"pic": "\U0001F4D0", "label": "Copernicus", "say": "About five hundred years ago, Copernicus showed the movements of the planets made much more sense if the Sun was at the centre and the Earth went round it, spinning as it went."},
                 {"pic": "\U0001F52D", "label": "Galileo's telescope", "say": "Galileo pointed one of the first telescopes at the sky. He saw four moons going round Jupiter, so not everything went round the Earth. And he saw Venus change phase like the Moon, which only made sense if Venus went round the Sun."},
                 {"pic": "\U0001F4DA", "label": "knowledge changed", "say": "The evidence piled up until the old idea could not stand. Knowledge changed: the Sun is at the centre, and the Earth spins and goes round it. Today we have photographs from space to prove it."},
             ], "need": 4,
              "then": {"ask": "Why did people believe the Earth was at the centre for so long?",
                       "opts": [opt("It matched what they saw, and nobody had the evidence to test it", True), opt("It was true then", False), opt("They were not clever", False)],
                       "why": "An idea lasts until enquiry brings evidence against it."}},
             "Evidence from telescopes put the Sun at the centre."),

        step("questions", "Space check", "✅", "Space check", ["4ESs.01", "4ESs.02", "4ESs.03", "4ESs.04"],
             "Tap the answer.",
             explain(
                 ["The spinning Earth, the planets, the Sun at the centre."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What causes day and night?", "\U0001F30D", "the Earth spinning on its axis", ["the Sun going round the Earth", "the Moon", "clouds"], "One spin, one day."),
                 q("Which planet is nearest the Sun?", "\U0001F52D", "Mercury", ["Earth", "Neptune"], "First of eight."),
                 q("Which planet is third from the Sun?", "\U0001F522", "Earth", ["Mars", "Venus"], "Mercury, Venus, Earth."),
                 q("What is at the centre of the Solar System?", "\U0001F30C", "the Sun", ["the Earth", "Jupiter"], "A star."),
                 q("A ball of ice that grows a tail near the Sun is...", "✨", "a comet", ["an asteroid", "a planet"], "Ice and dust."),
                 q("Does the Earth make its own light?", "\U0001F30E", "No - it only reflects the light of the Sun", ["Yes, that is why it glows when seen from space", "Yes, its hot core makes the light"],
                   "A photograph from space shows HALF the Earth lit and half of it dark. If it made its own light, all of it would glow."),
             ],
              "support": [
                 q("Does the Moon go round the Earth or round the Sun?", "\U0001F319", "round the Earth", ["round the Sun"],
                   "The Moon circles the Earth, while the Earth circles the Sun."),
                 q("Is the Earth a planet?", "\U0001F30E", "Yes", ["No"],
                   "The Earth is the third planet out from the Sun."),
                 q("Which is bigger, the Sun or the Earth?", "\u2600\uFE0F", "the Sun", ["the Earth"],
                   "Enormously bigger, which is why the football model needs 25 metres of space."),
                 q("Is Mercury closer to the Sun than the Earth is?", "\U0001FA90", "Yes", ["No"],
                   "Mercury is first and the Earth is third."),
              ],
              "extension": [
                 q("Mercury is nearest the Sun and Jupiter is far out. Which takes longer to go round the Sun once?", "\U0001FA90", "Jupiter, because its circle round the Sun is far bigger", ["Mercury, because it is smaller", "they take exactly the same time"],
                   "A bigger circle is a longer journey. Mercury goes round in 88 days; Jupiter takes almost twelve years."),
                 q("A book draws the planets close together in a row. What does the football model get right that the book does not?", "\U0001F52D", "the enormous distances, compared with how small the planets are", ["the colours of the planets", "how fast each planet travels"],
                   "A page is far too small for the real distances, so almost every picture squeezes them. Stepping out 25 metres does not."),
                 q("A comet has a tail near the Sun and none far away. What does the Sun do to it?", "\u2604\uFE0F", "its heat turns the comet's ice to gas, which streams out behind", ["it paints the tail on", "the tail is always there and hard to see"],
                   "No heat, no tail. The tail is the comet being slowly boiled away."),
                 q("Galileo saw moons circling Jupiter. Why did that matter so much?", "\U0001FA90", "it showed something in the sky going round a body that was not the Earth", ["it proved Jupiter was the centre", "it mattered very little"],
                   "One observation can undo an idea everybody held. That is how scientific knowledge changes."),
              ]},
             "You know your Solar System.",
             mis=["5.4-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4ESs.01", "4ESs.02", "4ESs.03", "4ESs.04", "4TWSm.02", "4SIC.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How long does the Earth take to spin once?", "\U0001F30D", "24 hours: one day", ["one month", "one year"], "One spin, one day."),
                 q("Why does a shadow move during the day?", "\U0001F464", "the Earth's spin moves where the Sun appears", ["the shadow walks round by itself", "the Sun gets hotter at midday"], "Spin moves the Sun's position."),
                 q("Which is the biggest planet?", "\U0001F30C", "Jupiter", ["Earth", "Mercury"], "A giant of gas."),
                 q("Which planet has the great rings?", "\U0001F52D", "Saturn", ["Mars", "Venus"], "Rings of ice and rock."),
                 q("Where are most asteroids?", "\U0001FAA8", "in a belt between Mars and Jupiter", ["inside the Sun, where it is hottest", "on the Moon, in its craters"], "The asteroid belt."),
                 q("In the football model, how far away was the Earth?", "⚽", "25 metres", ["25 centimetres", "25 kilometres"], "A peppercorn, far off."),
                 q("What did Galileo see that showed not everything goes round the Earth?", "\U0001F52D", "moons going round Jupiter", ["a comet with a tail", "rings round the Sun"], "Evidence from a telescope."),
                 q("What makes scientific knowledge change?", "\U0001F4DA", "evidence from enquiry", ["arguing louder", "waiting"], "Evidence."),
                 q("It is midday where you are. Why is it night on the far side of the Earth?", "\U0001F914", "that side is turned away from the Sun", ["the Sun has gone behind the Moon", "the Sun switches off there"], "The Earth spins. The half facing the Sun has day; the half turned away has night."),
                 q("In the football model, why must the Earth be tiny and far away?", "\u26BD", "the Sun is far bigger than the Earth, and a long way from it", ["the Earth is bigger than the Sun", "the model gets the sizes wrong on purpose"], "A model to scale keeps the sizes and the distances right."),
                 q("Why do the stars seem to move across the sky during the night?", "\U0001F31F", "the Earth is spinning, so we turn past them", ["the stars go round the Earth every night", "the wind blows them along"], "Like the Sun by day, the stars only seem to move. It is the Earth that turns."),
             ],
              "support": [
                 q("What is at the centre of the Solar System?", "\u2600\uFE0F", "the Sun", ["the Earth"],
                   "The Sun, a star."),
                 q("How long does the Earth take to spin round once?", "\U0001F30D", "one day", ["one year"],
                   "One spin, one day and night."),
                 q("Do all the planets go round the Sun?", "\U0001FA90", "Yes", ["No"],
                   "All of them, with the Sun at the centre of the Solar System."),
                 q("Are asteroids bigger or smaller than planets?", "\u2604\uFE0F", "smaller", ["bigger"],
                   "Much smaller, and most of them lie in a belt between Mars and Jupiter."),
              ],
              "extension": [
                 q("If the Earth stopped spinning but kept going round the Sun, what would a day be like?", "\U0001F311", "half the year in daylight and half in darkness", ["exactly the same as now", "there would be no day or night at all"],
                   "Day and night come from the SPIN. Stop it and only the journey round the Sun is left, so one side would face the Sun for months."),
                 q("A comet grows a tail only when it comes near the Sun. Why?", "\u2604\uFE0F", "the Sun's heat turns its ice into gas and dust that streams away", ["the tail is scorch marks from the heat", "it collects dust as it speeds up"],
                   "A comet is ice and dust. Far out it is a dull lump; near the Sun the ice turns to gas and the Sun blows it out into a tail."),
                 q("Day and night could be explained by the Sun circling us. What evidence rules that out?", "\U0001F30E", "the whole sky turns together, and everything else we can measure fits a spinning Earth", ["nothing rules it out", "the Sun is too heavy to move"],
                   "Two ideas can both fit a single observation. You choose between them with more evidence, not with argument."),
                 q("In the football model the Earth is a speck 25 metres from the Sun. What would a true model of the Solar System need?", "\U0001FA90", "a very great deal of space - the distances dwarf the sizes", ["a bigger football", "nothing more than a page"],
                   "That is exactly why book pictures are wrong: the real thing will not fit on a page."),
              ]},
             "That is the whole lesson finished. You know your place in the Solar System."),
    ],
}

LESSON["about"] = [
    "Explain why the Earth's spin makes day and night and moves the shadows.",
    "Name the eight planets in order from the Sun.",
    "Say what a planetary system holds: a star, planets, asteroids and comets.",
    "Use a scale model, and say how evidence put the Sun at the centre.",
]

LESSON["warmup"] = [
    q("We live on the Earth's thin outer layer. What is it called?", "\U0001F30D", "the crust", ["the core", "the mantle"], "From the last lesson: the crust."),
    q("Where is the Sun in the sky around midday?", "☀️", "high up in the sky", ["under the ground", "behind the Moon"], "The Sun is highest in the sky around midday."),
    q("How does light travel?", "\U0001F4D0", "in straight lines", ["in curves", "in circles"],
      "Always straight, which is why you cannot see round a corner."),
    q("What is everything made of?", "\u269B\uFE0F", "particles too small to see", ["tiny coloured balls", "nothing at all"],
      "Solid, liquid and gas are all particles, arranged differently."),
]

LESSON["lecture"] = [
    part("\U0001F30D", "The spinning Earth",
         "The Sun does not cross the sky. The Earth spins, once every twenty-four hours, and carries you round with it. When your side faces the Sun it is day. When it turns away it is night. The spin swings every shadow round as it goes."),
    part("☀️", "The Sun at the centre",
         "The Sun is a star: a huge ball of hot, glowing gas. It sits at the centre of the Solar System, and eight planets go round it. Mercury, Venus, Earth, Mars, then the giants: Jupiter, Saturn, Uranus, Neptune."),
    part("☄️", "Asteroids and comets",
         "Between Mars and Jupiter is a belt of rocks called asteroids. From the cold edge come comets, balls of ice and dust that grow a glowing tail when they swing near the Sun. A star, planets, asteroids and comets: a planetary system."),
    part("\U0001F4CF", "To scale",
         "Pictures squeeze the planets together to fit the page. To scale, if the Sun were a football, the Earth would be a peppercorn twenty-five metres away and Neptune a pea most of a kilometre off. A scale model keeps sizes and distances true."),
    part("\U0001F52D", "How we found out",
         "For two thousand years people put the Earth at the centre. Then Copernicus did the sums and Galileo's telescope saw moons going round Jupiter. The evidence moved the Sun to the centre. Knowledge changes when enquiry brings evidence."),
]

LESSON["words"] = [
    word("axis", "\U0001F30D", "The imaginary line through the middle of the Earth that it spins around.",
         ["The Earth spins on its axis.", "The axis runs from pole to pole."]),
    word("planet", "\U0001FA90", "A big round world that goes round a star.",
         ["Earth is the third planet.", "Jupiter is the biggest planet."]),
    word("Solar System", "☀️", "The Sun and everything that goes round it.",
         ["There are eight planets in the Solar System.", "The Sun is at the centre of the Solar System."]),
    word("star", "⭐", "A huge ball of hot, glowing gas. The Sun is our star.",
         ["The Sun is a star.", "Other stars have planets too."]),
    word("asteroid", "\U0001FAA8", "A lump of rock going round the Sun, mostly in a belt between Mars and Jupiter.",
         ["An asteroid can be as small as a house.", "The asteroid belt lies past Mars."]),
    word("comet", "☄️", "A ball of ice and dust that grows a tail near the Sun.",
         ["A comet's tail glows.", "Comets come from the edge of the Solar System."]),
    word("scale", "\U0001F4CF", "Shrinking everything by the same amount, so sizes and distances stay true to each other.",
         ["A scale model of the Solar System needs a whole field.", "The football and peppercorn are to scale."]),
    word("orbit", "\U0001F30E", "The path one thing takes as it goes round another.",
         ["The Earth's orbit round the Sun takes a year.", "The Moon is in orbit round the Earth."]),
    word("spin", "\U0001F504", "To turn round on the spot.",
         ["The Earth spins once a day.", "The Earth's spin is what makes day and night."]),
]

LESSON["cando"] = [
    cando("I can explain why the Earth's spin makes the Sun seem to move, and makes day and night.", "4ESs.01"),
    cando("I can name the planets of the Solar System.", "4ESs.02"),
    cando("I know that the Sun is at the centre.", "4ESs.03"),
    cando("I know a planetary system holds stars, planets, asteroids and comets.", "4ESs.04"),
    cando("I can use a model to show scale.", "4TWSm.02"),
    cando("I can make a prediction and check it.", "4TWSp.03"),
    cando("I can make a conclusion from my results.", "4TWSa.03"),
    cando("I can say how our picture of the sky has changed over time.", "4SIC.01"),
]

LESSON["home"] = [
    home("Shadow stick", "A stick in a pot, small stones, a sunny day",
         ["Never look straight at the Sun, not even for a moment: it can harm your eyes. Look down at the shadow instead.",
          "Stand the stick in the sun and mark the tip of its shadow with a stone every hour.",
          "Watch the shadow swing round and change length.",
          "Say what is really moving."],
         "Not the Sun. The Earth, under your feet."),
    home("The peppercorn walk", "A grown-up, a football, a peppercorn, a grape, a tape measure or your steps, a park or a playing field",
         ["Go with a grown-up, and stay where they can see you. Put the football down: the Sun.",
          "Walk 25 metres and put down the peppercorn: the Earth.",
          "Walk 130 metres in all and put down the grape: Jupiter."],
         "Look back at the football. That is the scale of the Solar System: mostly empty."),
    home("Planet order song", "Paper, a pencil, your voice",
         ["Write the eight planets in order from the Sun.",
          "Make up a sentence whose words start with M, V, E, M, J, S, U, N.",
          "Say it until you can list the planets without looking."],
         "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune."),
]
