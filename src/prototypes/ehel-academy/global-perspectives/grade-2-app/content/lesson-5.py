# -*- coding: utf-8 -*-
"""Lesson 5 - Sources and Reasons.

0838 Stage 2 Evaluation: 2Es.01 suggest sources which might be relevant to
a topic, explaining reasons for relevance; 2Ea.01 express an opinion about a
given topic, giving reasons for opinion. The topic is sharing our planet -
recycling, animals and the sea - because it has several sources at once
(more than one would help, which is what "suggest sources" asks for) and
because everybody has an opinion about it with reasons worth giving.
"""
from _kit import explain, step, opt, q, tagged, source, part, word, home

LESSON = {
    "slug": "sources-and-reasons",
    "title": "Sources and Reasons",
    "blurb": "More than one source can help with a topic. Suggest every source that would help find out about recycling, animals and the sea, say why, then say what you think with two reasons.",
    "steps": [
        step("demo", "More than one source", "\U0001F4DA", "Source suggester", ["2Es.01"],
             "Last year you picked ONE source. This year you suggest ALL the ones that would help. Press <b>Next</b>.",
             explain(
                 ["A topic usually has more than one source that helps.", "Suggesting sources means naming all the ones that would."],
                 ["We want to find out about recycling.", "A book about recycling helps. The recycling bin itself helps. The person who empties it helps.",
                  "A map of the sea does not."],
                 ["Children stop at the first source they find.", "Ask: what ELSE would help?"],
                 ["Press Next and count the sources."]),
             {"frames": [
                 {"pic": "♻️", "cap": "The class wants to find out: <b>what happens to our recycling?</b>", "say": "The class wants to find out: what happens to our recycling?"},
                 {"pic": "\U0001F4D7", "cap": "Amal suggests <b>a book</b> about recycling. That helps.", "say": "Amal suggests a book about recycling. That helps.", "sound": "pop"},
                 {"pic": "\U0001F5D1️", "cap": "Sami suggests <b>looking in the recycling bin</b> itself. That helps too.", "say": "Sami suggests looking in the recycling bin itself, to see what goes in. That helps too.", "sound": "pop"},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F527", "cap": "Nora suggests <b>asking the caretaker</b> who empties it. Three sources!", "say": "Nora suggests asking the caretaker, who empties the bins. Three sources, and each one helps.", "sound": "pop"},
                 {"pic": "\U0001F4DA", "cap": "Suggest <b>every</b> source that would help, and say <b>why</b> each one helps.", "say": "Suggest every source that would help, and say why each one helps.", "sound": "tada"},
             ]},
             "A topic has more than one source. Suggest every one that would help."),

        step("explore", "Kinds of sources", "\U0001F50E", "Source kinds", ["2Es.01"],
             "Six kinds of source. Tap each one to hear when it helps.",
             explain(
                 ["A book, a photo, a person, a film, a real thing, a website with a grown-up.", "Each kind helps with different questions."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F4D7", "label": "a book", "say": "A book. A book about the sea tells you what lives in it."},
                 {"pic": "\U0001F4F7", "label": "a photo", "say": "A photo. A photo of the beach shows you what is there, litter and all."},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F527", "label": "a person who does the job", "say": "A person who does the job. The caretaker knows where the recycling goes."},
                 {"pic": "\U0001F3AC", "label": "a film", "say": "A film. A film about turtles shows them swimming and eating."},
                 {"pic": "\U0001F5D1️", "label": "a real thing", "say": "A real thing. Look in the recycling bin and see what goes in."},
                 {"pic": "\U0001F4BB", "label": "a website, with a grown-up", "say": "A website, with a grown-up to help. The zoo's website tells you which animals it looks after."},
             ], "need": 6,
              "then": {"ask": "You want to know what lives in the sea. Which TWO would help?",
                       "opts": [opt("A book about the sea and a film about turtles", True), opt("A map of the town and a bus ticket", False), opt("A photo of a cake and a football", False)],
                       "why": "Both are about the sea and the things living in it."}},
             "Six kinds of source, and each helps with something."),

        step("sources", "Suggest the sources", "\U0001F3AF", "Source suggester", ["2Es.01"],
             "We want to find out about a topic. Tap EVERY source that would help. Then say why.",
             explain(
                 ["More than one source helps. Find all of them, and leave out the ones that do not."],
                 ["What happens to our recycling? The book about recycling, the recycling bin, the caretaker. All three.",
                  "A map of the sea does not help."],
                 ["Children tap one and stop.", "The page asks: is there another? Keep going until they are all found."],
                 ["Tap every source that helps, then tap the reason."]),
             {"rounds": [
                 {"topic": "what happens to our recycling", "tag": "recycling", "pic": "♻️", "multi": True,
                  "sources": [
                      source("book", "a book about recycling", "\U0001F4D7", ["recycling"], "A book about recycling tells you where paper, glass and tins go."),
                      source("bin", "the recycling bin itself", "\U0001F5D1️", ["recycling"], "The bin shows you exactly what goes in it."),
                      source("care", "the caretaker who empties the bins", "\U0001F9D1\U0001F3FE‍\U0001F527", ["recycling"], "The caretaker knows where the recycling lorry takes it."),
                      source("seamap", "a map of the sea", "\U0001F5FA️", ["places"], "A map of the sea shows the sea, not the recycling."),
                      source("ball", "a football", "⚽", ["football"], "A football is for playing football."),
                  ],
                  "reasons": [opt("because each one tells us something about recycling", True), opt("because there are three of them", False), opt("because they are in the classroom", False)],
                  "why": "Every one of them is about recycling, so every one helps."},
                 {"topic": "which animals live in the sea", "tag": "sea", "pic": "\U0001F420", "multi": True,
                  "sources": [
                      source("seabook", "a book about the sea", "\U0001F4D8", ["sea"], "A book about the sea lists the animals that live in it."),
                      source("film", "a film about turtles", "\U0001F3AC", ["sea"], "A film about turtles shows a sea animal living its life."),
                      source("aquarium", "a visit to the aquarium", "\U0001F41F", ["sea"], "At the aquarium you can see real sea animals."),
                      source("bakery", "the bakery", "\U0001F35E", ["bread"], "The bakery is about bread."),
                      source("bus", "a bus timetable", "\U0001F68C", ["buses"], "A bus timetable is about buses."),
                  ],
                  "reasons": [opt("because each one shows animals that live in the sea", True), opt("because they are all blue", False), opt("because fish are fun", False)],
                  "why": "The book, the film and the aquarium all show sea animals."},
                 {"topic": "why the beach has litter on it", "tag": "beach", "pic": "\U0001F3D6️", "multi": True,
                  "sources": [
                      source("photo", "a photo of the beach", "\U0001F4F7", ["beach"], "A photo of the beach shows the litter and where it is."),
                      source("keeper", "the person who cleans the beach", "\U0001F9F9", ["beach"], "The beach cleaner knows what gets left and by whom."),
                      source("dino", "a book about dinosaurs", "\U0001F4D5", ["dinosaurs"], "Dinosaurs are not on the beach."),
                      source("moon", "a photo of the moon", "\U0001F319", ["the moon"], "A photo of the moon cannot show our beach."),
                  ],
                  "reasons": [opt("because they show or know about the litter on the beach", True), opt("because the beach is nice", False), opt("because photos are pretty", False)],
                  "why": "The photo shows the litter, and the beach cleaner knows about it."},
             ]},
             "Three topics, and every source that helps suggested with a reason."),

        step("opinion", "What do you think, and why?", "\U0001F4AD", "Opinion giver", ["2Ea.01"],
             "What do YOU think about sharing our planet? Say what you think, then give TWO reasons that are about it.",
             explain(
                 ["An opinion is what you think.", "This year you give reasons: two of them, both about the topic."],
                 ["I think we should recycle more, because it saves paper, and because it keeps rubbish out of the sea.",
                  "Because I have a red bike is not about recycling."],
                 ["Children give one reason and stop.", "The page asks for two. Both have to be about the topic."],
                 ["Tap what you think, then two reasons."]),
             {"reasonsNeeded": 2,
              "rounds": [
                 {"topic": "recycling at school", "tag": "recycling", "pic": "♻️", "ask": "What do you think about recycling at school?",
                  "stances": [{"id": "more", "t": "I think we should recycle more"}, {"id": "ok", "t": "I think we recycle enough already"}, {"id": "unsure", "t": "I am not sure about recycling", "mixed": True}],
                  "reasons": [dict(tagged("because it saves paper and trees", "recycling"), supports=['more', 'unsure']), dict(tagged("because it keeps rubbish out of the sea", "recycling"), supports=['more', 'unsure']), dict(tagged("because the bins are sometimes confusing", "recycling"), supports=['unsure']), dict(tagged("because it takes time at the end of the day", "recycling"), supports=['ok', 'unsure']),
                              dict(tagged("because we already fill the recycling bin every day", "recycling"), supports=['ok', 'unsure']),
                              tagged("because I have a red bike", "bikes"), tagged("because it is Tuesday", "days")]},
                 {"topic": "keeping animals in a zoo", "tag": "zoo", "pic": "\U0001F981", "ask": "What do you think about keeping animals in a zoo?",
                  "stances": [{"id": "good", "t": "I think zoos are a good thing"}, {"id": "bad", "t": "I think animals should not be in zoos"}, {"id": "some", "t": "I think it depends on the animal", "mixed": True}],
                  "reasons": [dict(tagged("because a zoo keeps rare animals safe", "zoo"), supports=['good', 'some']), dict(tagged("because animals need space to run", "zoo"), supports=['bad', 'some']), dict(tagged("because we can learn about animals there", "zoo"), supports=['good', 'some']), dict(tagged("because a cage is not a home", "zoo"), supports=['bad', 'some']),
                              tagged("because my shoes are new", "shoes"), tagged("because it rained yesterday", "weather")]},
                 {"topic": "litter on the beach", "tag": "beach", "pic": "\U0001F3D6️", "ask": "What do you think about litter on the beach?",
                  "stances": [{"id": "clean", "t": "I think everyone should take their litter home"}, {"id": "bins", "t": "I think the beach needs more bins"}, {"id": "both", "t": "I think we need both"}],
                  "reasons": [dict(tagged("because litter hurts the sea animals", "beach"), supports=['clean', 'bins', 'both']), dict(tagged("because a clean beach is nicer to play on", "beach"), supports=['clean', 'bins', 'both']), dict(tagged("because bins fill up on a hot day", "beach"), supports=['clean', 'bins', 'both']), dict(tagged("because people forget to bring a bag for their rubbish", "beach"), supports=['bins', 'both']),
                              tagged("because I like ice cream", "food"), tagged("because the bus was late", "buses")]},
             ]},
             "Three opinions, each with two reasons about the topic. That is expressing an opinion."),

        step("sort", "Would it help with our topic?", "\U0001F5C2️", "Source judge", ["2Es.01"],
             "Our topic is <b>animals in danger</b>. Would this source help, or not?",
             explain(
                 ["A source helps when it can tell you something about your topic."],
                 [],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Would it help us find out about animals in danger?",
              "bins": [{"id": "yes", "label": "Would help", "pic": "✅"}, {"id": "no", "label": "Would not", "pic": "\U0001F645"}],
              "items": [
                  {"pic": "\U0001F4D7", "label": "a book about endangered animals", "bin": "yes", "why": "It is about exactly our topic."},
                  {"pic": "\U0001F3AC", "label": "a film about tigers in the wild", "bin": "yes", "why": "Tigers are in danger, and the film shows them."},
                  {"pic": "\U0001F43E", "label": "the zoo keeper", "bin": "yes", "why": "The zoo keeper looks after rare animals every day."},
                  {"pic": "\U0001F68C", "label": "a bus timetable", "bin": "no", "why": "Buses are not animals."},
                  {"pic": "\U0001F4D9", "label": "a cookbook", "bin": "no", "why": "A cookbook is about food."},
                  {"pic": "\U0001F4BB", "label": "the zoo's website, with a grown-up", "bin": "yes", "why": "The zoo's website tells you which animals it protects."},
              ]},
             "You can tell a source that would help from one that would not."),

        step("questions", "Sources and opinions", "\U0001F4AC", "Reason judge", ["2Es.01", "2Ea.01"],
             "Think about suggesting sources and giving reasons. Tap the answer.",
             explain(
                 ["Suggest every source that helps, and say why.", "Give an opinion with reasons that are about the topic."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("We want to know what happens to our recycling. How many of these help: a book about recycling, the bin, the caretaker?", "♻️", "all three", ["only the book", "none of them"], "Each one tells us something about recycling."),
                 q("Why does the caretaker help with recycling?", "\U0001F9D1\U0001F3FE‍\U0001F527", "because the caretaker knows where the recycling goes", ["because the caretaker is tall", "because caretakers have keys"], "The reason is about the topic."),
                 q("I think we should recycle more, because…? Which reason is ABOUT recycling?", "\U0001F4AD", "it keeps rubbish out of the sea", ["I have a red bike", "it is Tuesday"], "It is about what recycling does."),
                 q("How many reasons should an opinion have now?", "\U0001F522", "at least two, all about the topic", ["none", "one about anything"], "At least two reasons, and all of them about the topic."),
             ]},
             "You suggest sources and give reasons."),

        step("quiz", "Show what you know", "⭐", "Star evaluator", ["2Es.01", "2Ea.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does it mean to SUGGEST sources?", "\U0001F4DA", "name all the sources that would help", ["pick the biggest one", "guess the answer", "write a book"], "More than one helps. Name them all."),
                 q("Which source would NOT help with the sea?", "\U0001F5FA️", "the bakery", ["a book about the sea", "a film about turtles", "the aquarium"], "The bakery is about bread."),
                 q("Why does a photo of the beach help with beach litter?", "\U0001F4F7", "because it shows the litter and where it is", ["because photos are pretty", "because beaches are big"], "The reason is about the topic."),
                 q("I think zoos are good because a zoo keeps rare animals safe, and…? Which is a second reason ABOUT zoos?", "\U0001F981", "because we can learn about animals there", ["because my shoes are new", "because it rained"], "Learning about animals is about zoos."),
                 q("An opinion is…", "\U0001F4AD", "what you think, with reasons", ["a fact everyone agrees on", "a kind of source", "a question"], "Your opinion, your reasons."),
                 q("Which is a source for finding out about the sea?", "\U0001F420", "a visit to the aquarium", ["a bus timetable", "a football", "a cookbook"], "Real sea animals live there."),
                 q("A website can be a source if…", "\U0001F4BB", "a grown-up helps you use it", ["it is blue", "it has a game", "nobody helps"], "Only use a website with a grown-up beside you. Then the zoo's website can tell you about its animals."),
                 q("Sami suggests looking in the recycling bin. Why is that a good source?", "\U0001F5D1️", "because it shows what goes in it", ["because bins are big", "because Sami said so"], "A real thing shows you the real answer."),
             ]},
             "That is the whole lesson finished. You suggest sources with reasons, and give opinions with reasons."),
    ],
}


LESSON["about"] = [
    "Suggest every source that would help with a topic.",
    "Say why each source helps.",
    "Say what you think about a topic.",
    "Give two reasons for your opinion that are about the topic.",
]

LESSON["lecture"] = [
    part("♻️", "More than one source",
         "The class wants to know what happens to our recycling. A book about recycling helps. The bin itself helps. The caretaker who empties it helps. Three sources, not one."),
    part("\U0001F50E", "Kinds of source",
         "A book, a photo, a person who does the job, a film, a real thing, a website with a grown-up. Each kind helps with different questions, and often several help at once."),
    part("\U0001F3AF", "Suggest and say why",
         "Suggest every source that would help and leave out the ones that would not. Then say why: because it tells us about recycling. Not: because there are three of them."),
    part("\U0001F4AD", "Opinions with reasons",
         "An opinion is what you think. This year you give two reasons, and both have to be about the topic. I think we should recycle more, because it saves paper, and because it keeps rubbish out of the sea."),
    part("\U0001F30D", "Sharing our planet",
         "Recycling, the sea, animals in danger, litter on the beach. These are things everybody shares. Finding out about them, and saying what you think with reasons, is how we look after them together."),
]

LESSON["words"] = [
    word("suggest", "\U0001F4A1", "To say what could be used or done.",
         ["Suggest a source that would help.", "Nora suggested asking the caretaker."]),
    word("relevant", "✅", "About the topic; able to help with it.",
         ["A book about the sea is relevant to the sea.", "Is it relevant to our topic?"]),
    word("source", "\U0001F4DA", "Somewhere you can find information.",
         ["A film can be a source.", "Suggest three sources."]),
    word("reason", "\U0001F4A1", "The why behind a choice or an opinion.",
         ["Give a reason for each source.", "My reason is that it saves paper."]),
    word("opinion", "\U0001F4AD", "What you think about something.",
         ["My opinion is that zoos are good.", "Give your opinion with two reasons."]),
    word("recycling", "♻️", "Using old paper, glass and tins to make new things instead of throwing them away.",
         ["Recycling saves trees.", "The recycling lorry comes every week."]),
]

LESSON["home"] = [
    home("Suggest the sources", "A grown-up and a topic",
         ["Pick a topic: where our water comes from, or what the birds in the garden eat.",
          "Suggest three sources that would help: a book, a person, a real thing.",
          "Say why each one would help."],
         "Could you find all three sources at home or nearby?"),
    home("Two reasons", "Everyone at dinner",
         ["Ask: what do you think about having a pet?",
          "Everyone gives their opinion and TWO reasons.",
          "Check every reason is about pets."],
         "Did anybody give a reason that was about something else?"),
    home("Look in the real thing", "The rubbish bin at home, and a grown-up",
         ["Stand by the rubbish bin with your grown-up. Let your grown-up open it; keep your hands out.",
          "Say which things in it could be recycled: bottles, tins, paper.",
          "Ask your grown-up where the rubbish goes."],
         "Was the bin a better source than a book for what YOUR family throws away?"),
]

LESSON["lookback"] = {
    "not": ["how to ride a bike", "the names of the planets", "how to swim"],
}
