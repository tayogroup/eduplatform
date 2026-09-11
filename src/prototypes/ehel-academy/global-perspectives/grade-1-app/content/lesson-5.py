# -*- coding: utf-8 -*-
"""Lesson 5 - Which One Helps?

0838 Stage 1 Evaluation: 1Es.01 select a source relevant to a given topic
and explain reasons for choice; 1Ea.01 state an opinion about a given topic.
The topic is the food we eat, which has sources of every kind a five-year-old
meets - a cookbook, a baker, a basket of fruit, a film about a farm - and
which everybody has an opinion about.
"""
from _kit import explain, step, opt, q, tagged, source, part, word, home

LESSON = {
    "slug": "which-one-helps",
    "title": "Which One Helps?",
    "blurb": "A book, a photo, a map, a person, a real thing: which one would help you find out about food? Choose it and say why, then say what YOU think about the food we eat.",
    "steps": [
        step("demo", "Where do we look?", "\U0001F50E", "Where to look", ["1Es.01"],
             "Nora wants to find out how bread is made. Press <b>Next</b> and see where she looks.",
             explain(
                 ["A source is somewhere you can find information.", "Some sources help with your topic. Some do not."],
                 ["Nora wants to know how bread is made.", "A map of the sea will not tell her.", "The baker next door will."],
                 ["Children think a book is always the answer.", "The best source is the one that is ABOUT your topic."],
                 ["Press Next and see which source helps."]),
             {"frames": [
                 {"pic": "\U0001F467\U0001F3FD", "cap": "Nora wonders: <b>how is bread made?</b>", "say": "Nora wonders: how is bread made?"},
                 {"pic": "\U0001F5FA️", "cap": "She looks at a map of the sea. It shows <b>fish</b>. No bread.", "say": "She looks at a map of the sea. It shows fish. No bread. That source does not help.", "sound": "click"},
                 {"pic": "\U0001F4F7", "cap": "She looks at a photo of a football match. Still <b>no bread</b>.", "say": "She looks at a photo of a football match. Still no bread.", "sound": "click"},
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F373", "cap": "She asks <b>the baker</b>. The baker says: flour, water, yeast, and an oven!", "say": "She asks the baker. The baker says: flour, water, yeast, and a hot oven!", "sound": "ding"},
                 {"pic": "\U0001F35E", "cap": "The baker was the source <b>about bread</b>. Choose the one that is about your topic.", "say": "The baker was the source about bread. Choose the source that is about your topic, and say why.", "sound": "tada"},
             ]},
             "Choose the source that is about your topic. That is how you find the answer."),

        step("explore", "Kinds of sources", "\U0001F4DA", "Source spotter", ["1Es.01"],
             "There are lots of kinds of source. Tap each one to hear what it is good for.",
             explain(
                 ["A source can be a book, a photo, a map, a person, a film, or a real thing."],
                 ["A book tells you facts.", "A photo shows you what something looks like.", "A map shows you where places are.",
                  "A person who knows can tell you.", "A film shows you things happening.", "A real thing you can touch and look at."],
                 [],
                 ["Tap all six, then answer the question."]),
             {"items": [
                 {"pic": "\U0001F4D7", "label": "a book", "say": "A book. A book about breakfasts tells you what people eat for breakfast."},
                 {"pic": "\U0001F4F7", "label": "a photo", "say": "A photo. A photo shows you what something looks like."},
                 {"pic": "\U0001F5FA️", "label": "a map", "say": "A map. A map shows you where places are."},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F373", "label": "a person who knows", "say": "A person who knows. The baker knows how bread is made."},
                 {"pic": "\U0001F3AC", "label": "a film", "say": "A film. A film about a farm shows you the cows being milked."},
                 {"pic": "\U0001F9FA", "label": "a real thing", "say": "A real thing. A basket of fruit from a farm near our town shows you what grows near here."},
             ], "need": 6,
              "then": {"ask": "You want to find out WHERE the market is. Which source helps?",
                       "opts": [opt("A map", True), opt("A book about breakfasts", False), opt("A photo of a cake", False)],
                       "why": "A map shows where places are. That is what you wanted to know."}},
             "Books, photos, maps, people, films and real things. Six kinds of source."),

        step("sources", "Choose a source", "\U0001F3AF", "Source chooser", ["1Es.01"],
             "We want to find out about a topic. Tap the source that would help, then say why.",
             explain(
                 ["The right source is the one that is ABOUT your topic."],
                 ["We want to know about breakfasts around the world.", "A book about breakfasts is about breakfasts.",
                  "A toy car is not. A map of the town is not."],
                 ["Children pick the biggest or the prettiest source.", "Ask: is it about my topic?"],
                 ["Tap the source, then tap the reason."]),
             {"rounds": [
                 {"topic": "what people eat for breakfast around the world", "tag": "breakfast", "pic": "\U0001F95E",
                  "sources": [
                      source("bk", "a book about breakfasts", "\U0001F4D7", ["breakfast", "food"], "A book about breakfasts tells you what people eat in the morning all over the world."),
                      source("map", "a map of the town", "\U0001F5FA️", ["places"], "A map of the town shows streets and places."),
                      source("ball", "a photo of a football match", "\U0001F4F7", ["football"], "A photo of a football match shows a football match."),
                      source("car", "a toy car", "\U0001F697", ["toys"], "A toy car is a toy."),
                  ],
                  "reasons": [opt("because it is about breakfast", True), opt("because it is big and heavy", False), opt("because it has a red cover", False)],
                  "why": "The book is about breakfasts, and breakfasts are our topic."},
                 {"topic": "where our milk comes from", "tag": "milk", "pic": "\U0001F95B",
                  "sources": [
                      source("film", "a film about a dairy farm", "\U0001F3AC", ["milk", "farms"], "A film about a dairy farm shows the cows being milked."),
                      source("dino", "a book about dinosaurs", "\U0001F4D5", ["dinosaurs"], "A book about dinosaurs is about dinosaurs."),
                      source("beach", "a photo of the beach", "\U0001F4F7", ["the beach"], "A photo of the beach shows sand and sea."),
                      source("ticket", "a bus ticket", "\U0001F3AB", ["buses"], "A bus ticket tells you about a bus ride."),
                  ],
                  "reasons": [opt("because it shows the farm where milk comes from", True), opt("because films are fun", False), opt("because it is long", False)],
                  "why": "The film is about the dairy farm, and that is where milk comes from."},
                 {"topic": "what fruit grows near our town", "tag": "fruit", "pic": "\U0001F96D",
                  "sources": [
                      source("basket", "a basket of fruit from a farm near our town", "\U0001F9FA", ["fruit", "food"], "A basket of fruit from a farm near our town is the real fruit that grows near here."),
                      source("seamap", "a map of the sea", "\U0001F5FA️", ["places"], "A map of the sea shows the sea."),
                      source("train", "a picture of a train", "\U0001F686", ["trains"], "A picture of a train shows a train."),
                      source("trains", "a book about trains", "\U0001F4D8", ["trains"], "A book about trains tells you about trains."),
                  ],
                  "reasons": [opt("because it is real fruit from a farm near here", True), opt("because baskets are nice", False), opt("because it is heavy", False)],
                  "why": "The basket holds the real fruit that grows near our town."},
                 {"topic": "how bread is made", "tag": "bread", "pic": "\U0001F35E",
                  "sources": [
                      source("baker", "the baker next door", "\U0001F469\U0001F3FE‍\U0001F373", ["bread", "food"], "The baker makes bread every morning and can tell you how."),
                      source("football", "a football", "⚽", ["football"], "A football is for playing football."),
                      source("moon", "a photo of the moon", "\U0001F319", ["the moon"], "A photo of the moon shows the moon."),
                      source("kite", "a kite", "\U0001FA81", ["toys"], "A kite is a toy for a windy day."),
                  ],
                  "reasons": [opt("because the baker knows how bread is made", True), opt("because the baker lives near us", False), opt("because bakers wear hats", False)],
                  "why": "The baker makes bread, so the baker knows how it is made."},
             ]},
             "Four topics, four sources chosen, four reasons given. You can pick the source that helps."),

        step("opinion", "What do you think?", "\U0001F4AD", "Opinion giver", ["1Ea.01"],
             "What do YOU think about the food we eat? There is no wrong answer. Say what you think, then say why.",
             explain(
                 ["An opinion is what YOU think.", "Other people may think something different, and that is all right."],
                 ["Do you like fruit? Maybe you do. Maybe you do not.", "Say it: I like fruit. Then say why: because it is sweet and juicy.",
                  "The reason has to be about the fruit."],
                 ["Children give a reason about something else.", "I like fruit because my shoes are new. The shoes are not about fruit."],
                 ["Tap what you think, then a reason about it."]),
             {"rounds": [
                 {"topic": "fruit", "tag": "fruit", "pic": "\U0001F34E", "ask": "What do you think about fruit?",
                  "stances": [{"id": "like", "t": "I like fruit"}, {"id": "love", "t": "Fruit is my favourite"}, {"id": "so", "t": "I do not like fruit much"}],
                  "reasons": [dict(tagged("because it is sweet and juicy", "fruit"), supports=['like', 'love']), dict(tagged("because it is good for me", "fruit"), supports=['like', 'love']), dict(tagged("because some fruit is sour", "fruit"), supports=['so']),
                              tagged("because my shoes are new", "shoes"), tagged("because it is raining today", "the weather")]},
                 {"topic": "vegetables", "tag": "vegetables", "pic": "\U0001F966", "ask": "What do you think about vegetables?",
                  "stances": [{"id": "like", "t": "I like vegetables"}, {"id": "some", "t": "I like some vegetables"}, {"id": "no", "t": "I do not like vegetables much"}],
                  "reasons": [dict(tagged("because they are crunchy", "vegetables"), supports=['like', 'some']), dict(tagged("because they help me grow", "vegetables"), supports=['like', 'some']), dict(tagged("because some taste bitter", "vegetables"), supports=['some', 'no']),
                              tagged("because my cat is fluffy", "cats"), tagged("because I have a blue bike", "bikes")]},
                 {"topic": "eating together at the table", "tag": "meals", "pic": "\U0001F37D️", "ask": "What do you think about eating together at the table?",
                  "stances": [{"id": "like", "t": "I like eating together"}, {"id": "ok", "t": "It is all right"}, {"id": "no", "t": "I would rather eat on my own"}],
                  "reasons": [dict(tagged("because we talk about our day", "meals"), supports=['like', 'ok']), dict(tagged("because everyone is there", "meals"), supports=['like', 'ok']), dict(tagged("because it takes a long time", "meals"), supports=['ok', 'no']),
                              tagged("because the bus is late", "buses"), tagged("because the sea is salty", "the sea")]},
             ]},
             "You said what you think about three things, with a reason about each one. That is an opinion."),

        step("sort", "Helps with our topic?", "\U0001F37D️", "Source judge", ["1Es.01"],
             "Our topic is <b>food</b>. Does this source tell us about food, or not?",
             explain(
                 ["A source helps when it is about your topic."],
                 ["A cookbook tells you about food.", "A bus timetable tells you about buses. Not food."],
                 ["Children think everything in the kitchen is about food.", "Ask what the source TELLS you."],
                 ["Read it, then tap the bin."]),
             {"ask": "Does it tell us about food?",
              "bins": [{"id": "yes", "label": "Tells us about food", "pic": "\U0001F37D️"}, {"id": "no", "label": "Does not", "pic": "\U0001F645"}],
              "items": [
                  {"pic": "\U0001F4D9", "label": "a cookbook", "bin": "yes", "why": "A cookbook is all about food and how to make it."},
                  {"pic": "\U0001F4DC", "label": "a menu from a café", "bin": "yes", "why": "A menu lists the food you can eat there."},
                  {"pic": "\U0001F4DD", "label": "a shopping list", "bin": "yes", "why": "A shopping list tells you the food a family buys."},
                  {"pic": "\U0001F4D8", "label": "a book of football rules", "bin": "no", "why": "Football rules are about football."},
                  {"pic": "\U0001F68C", "label": "a bus timetable", "bin": "no", "why": "A timetable tells you when buses come."},
                  {"pic": "\U0001F4F7", "label": "a photo of our dinner", "bin": "yes", "why": "A photo of dinner shows food."},
              ]},
             "You can tell a source that helps with food from one that does not."),

        step("questions", "Sources and opinions", "\U0001F4AC", "Source judge", ["1Es.01", "1Ea.01"],
             "Think about sources and opinions. Tap the answer.",
             explain(
                 ["A source is where you find information.", "An opinion is what you think, with a reason."],
                 ["Think about Nora and the baker, the four topics, and what you said about fruit."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Nora wanted to know how bread is made. Which source helped?", "\U0001F35E", "the baker", ["a map of the sea", "a photo of football"], "The baker makes bread, so the baker knew."),
                 q("You want to know what fruit grows near your town. Which source?", "\U0001F96D", "a basket of fruit from a farm near our town", ["a book about trains", "a map of the sea"], "The basket holds the real fruit from near here."),
                 q("What is an opinion?", "\U0001F4AD", "what you think about something", ["a kind of book", "a fact everyone agrees on"], "An opinion is what YOU think."),
                 q("I like fruit because… Which reason is ABOUT fruit?", "\U0001F34E", "it is sweet and juicy", ["my shoes are new", "it is raining"], "Sweet and juicy is about the fruit."),
             ]},
             "Sources and opinions, both sorted out."),

        step("quiz", "Show what you know", "⭐", "Star chooser", ["1Es.01", "1Ea.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the six kinds of source, the four topics and your opinions."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which of these is a source you could find out from?", "\U0001F4DA", "a person who knows", ["a kind of soup", "a game of tag", "a nap"], "A person who knows can tell you. So can a book, a photo, a map, a film or a real thing."),
                 q("Which source shows you WHERE places are?", "\U0001F5FA️", "a map", ["a cookbook", "a kite", "a football"], "A map shows where places are."),
                 q("You want to know where our milk comes from. Which source helps most?", "\U0001F95B", "a film about a dairy farm", ["a book about dinosaurs", "a bus ticket", "a photo of the beach"], "The dairy farm is where milk comes from."),
                 q("Why was the book about breakfasts a good source for breakfasts?", "\U0001F4D7", "because it is about breakfast", ["because it is heavy", "because it is red", "because it is new"], "The reason is that it is about the topic."),
                 q("Does everybody have the same opinion?", "\U0001F4AD", "No, people can think different things", ["Yes, always", "Only on Mondays"], "Your opinion is what you think. Other people may think something different, and that is all right."),
                 q("I like vegetables because… Which reason is ABOUT vegetables?", "\U0001F966", "they are crunchy", ["my cat is fluffy", "I have a blue bike", "the bus is late"], "Crunchy is about the vegetables."),
                 q("Which of these tells you about food?", "\U0001F37D️", "a menu", ["a bus timetable", "a book of football rules", "a map of the sea"], "A menu lists food."),
                 q("The baker was a good source for bread because…", "\U0001F469\U0001F3FE‍\U0001F373", "the baker knows how bread is made", ["bakers wear hats", "the baker lives next door", "bread is tasty"], "The reason is that the baker knows about the topic."),
             ]},
             "That is the whole lesson finished. You can choose a source and say why, and say what you think."),
    ],
}


LESSON["about"] = [
    "Name six kinds of source: a book, a photo, a map, a person, a film and a real thing.",
    "Choose the source that is about your topic.",
    "Say why the source you chose is a good one.",
    "Say what you think about a topic, with a reason that is about it.",
]

LESSON["lecture"] = [
    part("\U0001F50E", "Where do we look?",
         "Nora wanted to know how bread is made. A map of the sea did not help. A photo of football did not help. The baker did. The baker was the source that was about bread."),
    part("\U0001F4DA", "Kinds of source",
         "A source is somewhere you find information. A book tells facts. A photo shows what things look like. A map shows where places are. A person who knows can tell you. A film shows things happening. A real thing you can hold."),
    part("\U0001F3AF", "Choose and say why",
         "The right source is the one that is about your topic. Choose it, and say why: because it is about breakfast. Not because it is big, or red, or new."),
    part("\U0001F4AD", "An opinion",
         "An opinion is what you think. I like fruit. I do not like vegetables much. Other people may think something different, and that is all right. But your reason has to be about the thing: because it is sweet, not because my shoes are new."),
    part("\U0001F37D️", "Food",
         "Everybody eats, and everybody has opinions about food. That makes food a good topic to find out about, and to talk about."),
]

LESSON["words"] = [
    word("source", "\U0001F4DA", "Somewhere you can find information: a book, a photo, a map, a person, a film or a real thing.",
         ["The baker was a good source.", "Choose a source about your topic."]),
    word("choose", "\U0001F449", "To pick one thing out of several.",
         ["Choose the source that helps.", "I chose the book."]),
    word("reason", "\U0001F4A1", "The why behind a choice or an opinion.",
         ["My reason is that it is about bread.", "Give a reason."]),
    word("opinion", "\U0001F4AD", "What you think about something.",
         ["My opinion is that fruit is lovely.", "Everybody has an opinion."]),
    word("because", "➡️", "The word that joins a reason to what you said.",
         ["I like fruit because it is sweet.", "Say because, then say why."]),
    word("map", "\U0001F5FA️", "A drawing that shows where places are.",
         ["A map shows where the market is.", "Look at the map."]),
]

LESSON["home"] = [
    home("Sources on the table", "A book, a photo, a map and a real thing, and a grown-up",
         ["Put four sources on the table.",
          "Your grown-up names a topic: birds, or the sea, or bread.",
          "Point to the source that would help, and say why."],
         "Was there a topic that none of the four could help with?"),
    home("Opinion time", "Everyone at dinner",
         ["Ask everyone: what do you think about tonight's dinner?",
          "Everyone says what they think, and why.",
          "Check every reason is about the dinner."],
         "Did everybody have the same opinion? Did everybody have a reason?"),
    home("Ask a person who knows", "A grown-up who cooks",
         ["Ask: how do you make my favourite food?",
          "Listen to all the steps.",
          "Say why that person was a good source."],
         "Could a map have told you that? Could a football?"),
]

LESSON["lookback"] = {
    "not": ["how to ride a bike", "the names of the planets", "how to swim"],
}
