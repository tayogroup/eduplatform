# -*- coding: utf-8 -*-
"""Lesson 11 - Magnets.

0097 Stage 3: 3Pe.01 a magnet has a north pole and a south pole; 3Pe.02 how
magnets interact (attract and repel); 3Pe.03 some materials are magnetic and
many are not; with 3TWSp.03, 3TWSa.01, 3TWSa.03, 3TWSc.06 and 3SIC.02.
"""
from _kit import explain, step, opt, q, part, word, home, icon, cando

# the paperclip count at each part of a bar magnet, as a table and as a bar chart
CLIP_TABLE = ('<svg viewBox="0 0 160 90"><rect width="160" height="90" fill="#0E2434"/>'
              '<g stroke="#93AABE" stroke-width="0.8"><line x1="6" y1="26" x2="154" y2="26"/><line x1="6" y1="46" x2="154" y2="46"/><line x1="6" y1="66" x2="154" y2="66"/><line x1="100" y1="8" x2="100" y2="84"/></g>'
              '<g font-family="Inter, sans-serif" font-size="9" fill="#fff"><text x="10" y="20" fill="#F4C95D" font-weight="700">Part of the magnet</text><text x="106" y="20" fill="#F4C95D" font-weight="700">Paperclips</text>'
              '<text x="10" y="40">north pole</text><text x="124" y="40">8</text><text x="10" y="60">middle</text><text x="124" y="60">1</text>'
              '<text x="10" y="80">south pole</text><text x="124" y="80">8</text></g></svg>')
CLIP_CHART = ('<svg viewBox="0 0 160 90"><rect width="160" height="90" fill="#0E2434"/>'
              '<line x1="28" y1="10" x2="28" y2="72" stroke="#93AABE"/><line x1="28" y1="72" x2="152" y2="72" stroke="#93AABE"/>'
              '<g font-family="Inter, sans-serif" font-size="7" fill="#93AABE"><text x="18" y="75">0</text><text x="18" y="47">4</text><text x="18" y="19">8</text></g>'
              '<rect x="42" y="16" width="24" height="56" fill="#D9473F"/><rect x="78" y="65" width="24" height="7" fill="#93AABE"/><rect x="114" y="16" width="24" height="56" fill="#3B7DD8"/>'
              '<g font-family="Inter, sans-serif" font-size="8" fill="#fff" text-anchor="middle"><text x="54" y="13">8</text><text x="90" y="62">1</text><text x="126" y="13">8</text>'
              '<text x="54" y="84">north</text><text x="90" y="84">middle</text><text x="126" y="84">south</text></g></svg>')

LESSON = {
    "slug": "magnets",
    "title": "Magnets",
    "blurb": "Find the two poles of a magnet, bring two magnets together both ways round and feel them pull and push, test eight materials to see which are magnetic, and see how magnets do jobs for us.",
    "steps": [
        step("demo", "Every magnet has two poles", "\U0001F9F2", "Two poles", ["3Pe.01", "3TWSa.02", "3TWSa.04"],
             "Press <b>Next</b> to look closely at a magnet, and count where the paperclips cling.",
             explain(
                 ["Every magnet has two ends called poles: a north pole and a south pole.", "The pull is strongest at the poles."],
                 ["Bar magnets are often painted red for north and blue for south.", "Even a horseshoe magnet has a north end and a south end.", "Cut a magnet in half and each half has both poles.", "Count the paperclips at each part, put the numbers in a table and a bar chart, and read the pattern."],
                 ["Children think one end is the magnet and the other is not.", "Both ends pull. They are just different poles."],
                 ["Press Next through all six."]),
             {"frames": [
                 {"pic": "\U0001F9F2", "cap": "A bar magnet. One end is the <b>north pole</b>, the other the <b>south pole</b>.", "say": "Here is a bar magnet. One end is called the north pole, marked N. The other end is the south pole, marked S."},
                 {"pic": "\U0001F4CE", "cap": "Dip it in paperclips: they cling to the <b>two ends</b>, hardly at all in the middle.", "say": "Dip it in a pot of paperclips. They cling to the two ends, the poles, and hardly at all to the middle. The pull is strongest at the poles."},
                 {"pic": CLIP_TABLE, "cap": "Count the paperclips at each part and write them in a <b>table</b>: north pole 8, middle 1, south pole 8.", "say": "Count the paperclips hanging from each part of the magnet, and write the numbers in a table. North pole, eight. The middle, one. South pole, eight."},
                 {"pic": CLIP_CHART, "cap": "The same results as a <b>bar chart</b>. The pattern: two tall bars at the poles, a tiny bar in the middle. The pull is strongest at the poles.", "say": "Now show the same numbers as a bar chart. Two tall bars at the ends, and a tiny one in the middle. That is the pattern in the results: the pull is strongest at the poles and weakest in the middle."},
                 {"pic": "\U0001F9ED", "cap": "A compass needle is a tiny magnet. Its north pole swings to point north.", "say": "A compass needle is a tiny magnet that can swing freely. Its north pole always turns to point north. That is how a compass works."},
                 {"pic": "✂️", "cap": "Cut a magnet in half and you get two magnets, each with a north and a south pole.", "say": "If you could cut a magnet in half, you would not get a north piece and a south piece. You would get two smaller magnets, each with both poles. A magnet always has two."},
             ]},
             "North pole, south pole. Every magnet has both."),

        step("experiment", "Attract or repel?", "\U0001F9F2", "Push and pull", ["3Pe.02", "3Pe.01", "3TWSp.03", "3TWSa.01", "3TWSa.03"],
             "Two bar magnets. Predict what happens when north meets north.",
             explain(
                 ["Magnets pull on each other or push each other away, depending on which poles meet."],
                 ["North to south: they snap together. They attract.", "North to north, or south to south: they push apart. They repel."],
                 ["Children think magnets always stick together.", "Flip one round and it pushes the other away. Try it."],
                 ["Predict, try both ways, say what happened, then conclude."]),
             {"sim": "magnetPoles",
              "predict": {"ask": "First, north meets south. Then you flip one magnet, so a <b>north</b> pole meets another <b>north</b> pole. What will happen then?",
                          "opts": [opt("They will push apart", True), opt("They will snap together", False), opt("Nothing will happen", False)]},
              "plan": {"ask": "How shall we find out what the poles do? Which way is fair?",
                        "opts": [opt("The same two magnets, brought together the same way, turning only one of them round", True), opt("Two different magnets each time", False), opt("One magnet and a steel paperclip", False)],
                        "why": "Turning one magnet round changes ONE thing: which poles meet. A paperclip has no poles, so it cannot show you this."},
              "runAsk": "Bring them together: north meets south. Then flip the right magnet, so north meets north, and bring them together again.",
              "happened": {"ask": "What happened when you turned a magnet round?",
                           "opts": [opt("North to south snapped together; north to north pushed apart", True), opt("They stuck together both ways", False), opt("They pushed apart both ways", False)],
                           "why": "Unlike poles attract. Like poles repel. Flip a magnet and the pull becomes a push."},
              "conclude": {"ask": "What is the rule?",
                           "opts": [opt("Unlike poles attract; like poles repel", True), opt("Magnets always attract", False), opt("Only red ends are magnetic", False)],
                           "why": "That is the rule the results show, and it is true for every magnet in the world."}},
             "Unlike poles attract. Like poles repel."),

        step("predictEach", "Will it stick?", "\U0001F4CE", "Magnetic test", ["3Pe.03", "3TWSp.03", "3TWSa.01"],
             "Predict: is the <b>%s</b> magnetic? Then test it.",
             explain(
                 ["Some materials are magnetic: a magnet pulls them. Most are not."],
                 ["Iron and steel are magnetic.", "Copper, aluminium, plastic, wood and paper are not.", "Not all metals are magnetic. Copper wire and a foil sheet do nothing."],
                 ["Children think all metal is magnetic.", "Test the copper wire and the foil. The magnet ignores them."],
                 ["Predict for each one, then test."]),
             {"sim": "magnet", "ask": "Is the %s magnetic? Predict, then test.", "tryLabel": "Bring the magnet",
              "choices": [{"id": "yes", "t": "magnetic", "pic": "\U0001F9F2"}, {"id": "no", "t": "not magnetic", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F4CE", "label": "steel paperclip", "answer": "yes", "why": "Steel is magnetic. It jumped to the magnet."},
                  {"pic": "➰", "label": "copper wire", "answer": "no", "why": "Copper is a metal, but it is not magnetic."},
                  {"pic": "\U0001F96B", "label": "steel food tin", "answer": "yes", "why": "Food tins are made of steel, and steel is magnetic."},
                  {"pic": "\U0001F4CF", "label": "plastic ruler", "answer": "no", "why": "Plastic is never magnetic."},
                  {"pic": "\U0001F529", "label": "iron nail", "answer": "yes", "why": "Iron: magnetic. The magnet pulled it across."},
                  {"pic": icon("foil"), "label": "aluminium foil", "answer": "no", "why": "Aluminium is a metal but not magnetic. The magnet did nothing."},
                  {"pic": "✏️", "label": "wooden pencil", "answer": "no", "why": "Wood is not magnetic."},
                  {"pic": "✂️", "label": "steel scissors", "answer": "yes", "why": "Steel blades: magnetic."},
              ]},
             "Iron and steel are magnetic. Most things, including most metals, are not."),

        step("record", "Record the magnet test", "\U0001F4CB", "Magnet table", ["3TWSc.06", "3Pe.03"],
             "Fill in the table. Was the <b>%s</b> magnetic?",
             explain(
                 ["A table keeps the results of the test."],
                 ["Nail: magnetic.", "Copper wire: not.", "Foil: not.", "Scissors: magnetic."],
                 [],
                 ["Tap the answer for each row."]),
             {"ask": "Was the %s magnetic?",
              "columns": ["Material", "Magnetic?"],
              "rows": [
                  {"pic": "\U0001F529", "label": "iron nail", "answer": "yes", "why": "the iron nail jumped to the magnet."},
                  {"pic": "➰", "label": "copper wire", "answer": "no", "why": "the copper wire did nothing. Copper is not magnetic."},
                  {"pic": icon("foil"), "label": "aluminium foil", "answer": "no", "why": "the foil did nothing. Aluminium is not magnetic."},
                  {"pic": "✂️", "label": "steel scissors", "answer": "yes", "why": "the steel scissors were pulled to the magnet."},
              ],
              "choices": [{"id": "yes", "t": "magnetic", "pic": "\U0001F9F2"}, {"id": "no", "t": "not magnetic", "pic": "\U0001F6AB"}],
              "read": [
                  {"ask": "Read your table. How many of the four materials were magnetic?",
                   "opts": [opt("two", True), opt("all four", False), opt("none of them", False)],
                   "why": "The iron nail and the steel scissors say yes. The copper wire and the aluminium foil say no. Two of four."},
                  {"ask": "Look at the two magnetic rows. What are those two made of?",
                   "opts": [opt("iron and steel", True), opt("metal of any kind", False), opt("the two hardest materials", False)],
                   "why": "Copper and aluminium are metals too, and the magnet ignored both. Only a few metals are magnetic, and iron and steel are the two you meet most."},
              ]},
             "Iron and steel: yes. Copper and aluminium: no."),

        step("context", "Magnets at work", "\U0001F9ED", "Useful magnets", ["3SIC.02", "3Pe.02", "3Pe.03"],
             "Science explains how the magnets around you work. Tap each one.",
             explain(
                 ["Magnets do jobs all over your house and beyond."],
                 ["A fridge door has a magnetic strip that pulls it shut.", "A compass needle points north.", "A scrapyard crane lifts whole cars with a huge magnet.", "A magnetic toy train joins its carriages with magnets."],
                 [],
                 ["Tap each one."]),
             {"items": [
                 {"pic": "\U0001F9CA", "label": "fridge door", "say": "The rubber seal round a fridge door has a magnetic strip inside. It pulls against the fridge's steel frame and holds the door shut."},
                 {"pic": "\U0001F9ED", "label": "compass", "say": "A compass needle is a magnet on a pin. Its north pole swings to point north, so you always know which way you are facing."},
                 {"pic": "\U0001F3D7️", "label": "scrapyard crane", "say": "A scrapyard crane has an enormous magnet that switches on to lift a whole steel car, and off to drop it."},
                 {"pic": "\U0001F682", "label": "magnetic train", "say": "A toy train joins its carriages with a magnet on each end. Turn a carriage round and it repels instead: like poles."},
             ], "need": 4,
              "then": {"ask": "Why does the scrapyard magnet lift cars but not old tyres?",
                       "opts": [opt("Cars are steel, which is magnetic; rubber is not", True), opt("Tyres are too heavy", False), opt("Magnets lift anything", False)],
                       "why": "Only magnetic materials are pulled. Steel yes, rubber no."}},
             "Fridges, compasses, cranes and toys all use magnets."),

        step("questions", "Magnet check", "✅", "Magnet check", ["3Pe.01", "3Pe.02", "3Pe.03"],
             "Tap the answer.",
             explain(
                 ["Poles, attract and repel, and what is magnetic."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What are the two ends of a magnet called?", "\U0001F9F2", "the north pole and the south pole", ["the top and the bottom", "the red and the blue"], "North and south poles."),
                 q("North pole meets south pole. They...", "\U0001F9F2", "attract: pull together", ["repel: push apart", "do nothing"], "Unlike poles attract."),
                 q("South pole meets south pole. They...", "\U0001F9F2", "repel: push apart", ["attract", "melt"], "Like poles repel."),
                 q("Which material is magnetic?", "\U0001F529", "iron", ["copper", "plastic", "wood"], "Iron and steel."),
                 q("Is every metal magnetic?", "➰", "no; copper and aluminium are not", ["yes", "only shiny ones"], "The copper wire and the foil did nothing."),
                 q("How many poles does a round magnet have?", "\U0001F9F2", "two, like every magnet", ["one", "none - it is round"],
                   "Bring a labelled bar magnet up to a round one and you can find its north end and its south end."),
                 q("Are all metals magnetic?", "\U0001F9F2", "No. Only a few, like iron and steel.", ["Yes, all metals are magnetic", "Yes, if they are shiny"],
                   "Test an aluminium can, a copper coin and a gold ring: the magnet ignores all three."),
             ],
              "support": [
                 q("Is steel magnetic?", "\U0001F9F2", "Yes", ["No"],
                   "Steel is magnetic, which is why a scrapyard magnet can lift a car."),
                 q("Does a magnet have to touch a paperclip to pull it?", "\U0001F4CE", "No", ["Yes"],
                   "A magnet pulls across a small gap, without touching at all."),
                 q("Is copper magnetic?", "\U0001FA99", "No", ["Yes"],
                   "Copper is a metal and a magnet does nothing to it."),
                 q("Do unlike poles attract or repel?", "\U0001F9F2", "attract", ["repel"],
                   "North to south pulls together. Like poles push apart."),
              ],
              "extension": [
                 q("Two magnets lie on a table with north facing north, and you let go. Which one moves?", "\U0001F4A5", "both - each one pushes the other away", ["only the stronger one", "neither, they stay where they are"],
                   "A push between two magnets acts on both of them, not just on the one you happened to let go of."),
                 q("You test four objects with a magnet and it picks up two. What have you found out about the other two?", "\U0001F50D", "only that they are not iron or steel, and nothing else", ["that they must all be plastic", "that they are lighter than the first two"],
                   "A magnet answers one question and no others. Two things can both be non-magnetic and have nothing else in common."),
                 q("A fridge magnet holds a note on the fridge and falls off a wooden door. Why?", "\U0001FA9F", "the fridge door is steel and wood is not magnetic", ["the wooden door is too smooth", "the magnet wears out on wood"],
                   "A magnet needs something magnetic to pull against. Wood gives it nothing."),
                 q("Why does a compass go wrong when a strong magnet is held beside it?", "\U0001F9ED", "the magnet pulls harder than the Earth does, so the needle follows it instead", ["the compass breaks permanently", "nothing happens to a compass"],
                   "A compass needle answers to the strongest magnet near it, and usually that is the Earth."),
              ]},
             "You know your magnets.",
             mis=["5.4-m1", "5.5-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["3Pe.01", "3Pe.02", "3Pe.03", "3SIC.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Where is a magnet's pull strongest?", "\U0001F4CE", "at the two poles", ["in the middle", "everywhere the same"], "The paperclips clung to the ends."),
                 q("What does attract mean?", "\U0001F9F2", "pull together", ["push apart", "spin round"], "Unlike poles attract."),
                 q("What does repel mean?", "\U0001F9F2", "push apart", ["pull together", "stick"], "Like poles repel."),
                 q("You flip one magnet round and the pull becomes a push. Why?", "\U0001F504", "now like poles are facing each other", ["the magnet broke", "it got tired"], "Turning it round puts two LIKE poles face to face, and like poles push apart."),
                 q("Which of these is not magnetic?", icon("foil"), "aluminium foil", ["a steel paperclip", "an iron nail", "steel scissors"], "Aluminium is not magnetic."),
                 q("A compass needle points north because...", "\U0001F9ED", "it is a magnet whose north pole turns north", ["it is heavy", "it is painted"], "A tiny free-swinging magnet."),
                 q("Why does a fridge door stay shut?", "\U0001F9CA", "a magnetic strip pulls against the fridge's steel frame", ["it is glued", "gravity"], "Magnet on steel."),
                 q("If you cut a magnet in half, each half has...", "✂️", "a north pole and a south pole", ["only one pole", "no poles"], "Every magnet has two poles."),
                 q("You want to know which of two magnets is stronger. Which is the fair test?", "\U0001F4CE", "count how many paperclips each one picks up from the same pot", ["see which magnet is bigger", "use a different kind of paperclip for each magnet"], "Same paperclips, same test, and only the magnet changes. Then count and compare."),
                 q("If a magnet picks up a steel paperclip but not a piece of copper wire, what does that show?", "\U0001F9F2", "steel is magnetic and copper is not", ["the wire is too heavy to lift", "all metals are magnetic"], "Only some metals are magnetic. Copper is not one of them."),
                 q("Why is a magnet used to sort steel cans from aluminium cans for recycling?", "\U0001F96B", "steel is magnetic, so the magnet pulls out only the steel cans", ["aluminium is magnetic, so it sticks", "the magnet makes the cans lighter"], "Steel is attracted to a magnet. Aluminium is not."),
             ],
              "support": [
                 q("Does a magnet pull an iron nail?", "\U0001F529", "Yes", ["No"],
                   "Iron is magnetic."),
                 q("Does a magnet pull a plastic ruler?", "\U0001F4D0", "No", ["Yes"],
                   "Plastic is not magnetic."),
                 q("Is a fridge door magnetic?", "\U0001FA9F", "Yes", ["No"],
                   "It is steel, which is why a fridge magnet holds a note on it."),
                 q("Does a magnet have two ends that behave differently?", "\U0001F9F2", "Yes", ["No"],
                   "A north pole and a south pole, and they do opposite things."),
              ],
              "extension": [
                 q("A magnet picks up a paperclip, and that paperclip then picks up a second one. How?", "\U0001F587\uFE0F", "the first paperclip became a magnet while the magnet was touching it", ["the magnet is unusually strong", "paperclips are always magnetic to each other"],
                   "Iron and steel become magnets themselves while a magnet is touching them. Take the magnet away and the chain falls apart."),
                 q("A magnet works through a sheet of paper. Will it work through a thick book?", "\U0001F4D5", "No - the pull gets weaker the further away it is", ["Yes, a magnet works through anything", "No, a magnet never works through anything"],
                   "A magnet's pull reaches through materials that are not magnetic, and it fades fast with distance. A sheet of paper is thin enough; a book is not."),
                 q("A steel spoon is not a magnet, and a magnet picks it up. What makes the spoon follow?", "\U0001F944", "the magnet turns the steel into a magnet for as long as it is close", ["the spoon was secretly a magnet all along", "the magnet glues itself on"],
                   "Steel becomes magnetic near a magnet, and mostly stops being so once it is taken away."),
                 q("A recycling plant drops mixed cans past a big magnet. What comes out on each side?", "\u267B\uFE0F", "steel cans pulled aside by the magnet, aluminium ones carrying straight on", ["all the cans pulled aside together", "nothing is separated at all"],
                   "One property, tested at speed on thousands of cans. That is what makes it useful."),
              ]},
             "That is the whole lesson finished. You know how magnets behave."),
    ],
}

LESSON["about"] = [
    "Say that every magnet has a north pole and a south pole.",
    "Say when two magnets attract and when they repel.",
    "Predict and test which materials are magnetic.",
    "Say how magnets do jobs in the things around you.",
]

LESSON["warmup"] = [
    q("Light goes straight through a clear window. The glass is...", "\U0001FA9F", "transparent", ["opaque", "translucent"], "You can see clearly through it: transparent."),
    q("Which of these is made of metal?", "\U0001F511", "a key", ["a cotton sock", "a paper bag"], "A key is made of metal."),
    q("Which tool would you use to separate sand from water?", "\u2615", "a filter", ["a magnet", "a sieve"],
      "The sand grains are too big for the filter's holes, so they stay behind."),
    q("Which organ takes in air?", "\U0001F32C\uFE0F", "the lungs", ["the stomach", "the heart"],
      "The two lungs fill when you breathe in."),
]

LESSON["lecture"] = [
    part("\U0001F9F2", "Two poles",
         "Every magnet has two ends called poles: a north pole and a south pole. The pull is strongest at the poles. Dip a magnet in paperclips and they cling to the ends, hardly at all to the middle."),
    part("\U0001F9F2", "Attract",
         "Bring the north pole of one magnet up to the south pole of another. They snap together. Unlike poles attract."),
    part("\U0001F504", "Repel",
         "Now flip one magnet round so north faces north. Push them together and they push back, hard. Like poles repel."),
    part("\U0001F529", "Magnetic materials",
         "A magnet pulls iron and steel. It does not pull copper, aluminium, plastic, wood or paper. So not every metal is magnetic. Copper wire and a sheet of foil do nothing at all."),
    part("\U0001F9ED", "Magnets at work",
         "A compass needle is a tiny magnet that turns to point north. A fridge door has a magnetic strip to hold it shut. A scrapyard crane lifts whole steel cars with a giant magnet. Today, you test them all."),
]

LESSON["words"] = [
    word("magnet", "\U0001F9F2", "An object that pulls iron and steel towards it.",
         ["The magnet picked up the paperclips.", "A fridge magnet holds up a drawing."]),
    word("pole", "\U0001F9ED", "One of the two ends of a magnet, where the pull is strongest.",
         ["The north pole is often painted red.", "Paperclips cling to the poles."]),
    word("north pole", "\U0001F534", "The end of a magnet that turns to point north.",
         ["The compass needle's north pole points north.", "North pole to north pole: they repel."]),
    word("attract", "\U0001F9F2", "To pull together.",
         ["Unlike poles attract.", "A magnet attracts iron."]),
    word("repel", "\U0001F504", "To push apart.",
         ["Like poles repel.", "The two north poles repelled each other."]),
    word("magnetic", "\U0001F529", "Pulled by a magnet. Iron and steel are magnetic.",
         ["A nail is magnetic.", "Copper is not magnetic."]),
    word("compass", "\U0001F9ED", "A tool with a magnetic needle that points north.",
         ["Use a compass to find north.", "A compass needle is a tiny magnet."]),
    word("south pole", "\U0001F9F2", "The other end of a magnet, often coloured blue.",
         ["The south pole is at the other end.", "A north pole and a south pole attract."]),
    word("aluminium", "\U0001F944", "A very light metal. It is NOT magnetic.",
         ["Foil is made of aluminium.", "A magnet does nothing to aluminium."]),
    word("iron", "\U0001F529", "A strong metal that a magnet pulls.",
         ["An iron nail is magnetic.", "Steel is made from iron, so steel is magnetic too."]),
    word("magnetism", "\u2728", "The force a magnet uses to pull or push, even without touching.",
         ["Magnetism works through a sheet of paper.", "You cannot see magnetism, only what it does."]),
    word("non-magnetic", "\U0001F9F4", "A material a magnet does nothing to.",
         ["Plastic and copper are non-magnetic.", "The magnet left the non-magnetic spoon alone."]),
]

LESSON["cando"] = [
    cando("I can describe the poles of a magnet and say what they do.", "3Pe.01"),
    cando("I can say what happens when two magnets meet.", "3Pe.02"),
    cando("I can name magnetic and non-magnetic materials.", "3Pe.03"),
    cando("I can find a pattern in my results.", "3TWSa.02"),
    cando("I can make a bar chart and read it.", "3TWSa.04"),
    cando("I can use my results to say whether my prediction was right.", "3TWSa.01"),
    cando("I can record my test in a table.", "3TWSc.06"),
    cando("I can explain how a magnet makes something work.", "3SIC.02"),
]

LESSON["home"] = [
    home("Two magnets", "Two bar magnets, if you have them (a school may lend some)",
         ["Bring them together one way. Feel the pull.",
          "Turn one round and bring them together again. Feel the push.",
          "Try to push the repelling ends together."],
         "They push back, hard. Like poles repel."),
    home("Magnet hunt", "A magnet, a tray of things: a coin, a paperclip, a key, foil, a spoon, a plastic lid, a nail, a can",
         ["Predict for each one: magnetic or not.",
          "Test it.",
          "Write a table: material, prediction, result."],
         "Some metals are not magnetic. Which ones surprised you? Keep magnets away from phones and bank cards."),
    home("Find the magnets in your house", "Paper and a pencil",
         ["Look for magnets: the fridge door seal, cupboard catches, a bag clasp, a toy.",
          "Draw each one.",
          "Say what job the magnet is doing."],
         "How many did you find? Many homes have several."),
]
