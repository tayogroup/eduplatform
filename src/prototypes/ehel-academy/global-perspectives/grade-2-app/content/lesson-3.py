# -*- coding: utf-8 -*-
"""Lesson 3 - Who Knows What.

0838 Stage 2 Analysis: 2Ap.01 recognise that different people know
different things about a topic. Communication: 2Mi.01 talk about a given
topic, giving relevant information. The topic is our town - the baker knows
about bread and the bus driver knows about the buses, which is the whole
point of Identifying perspectives at this stage, and a child can give a short
talk about their town where everything said is about the town.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}

LESSON = {
    "slug": "who-knows-what",
    "title": "Who Knows What",
    "blurb": "Different people know different things about our town. Work out who would know what, then give a short talk about the town where everything you say is about it.",
    "steps": [
        step("demo", "Nobody knows everything", "\U0001F4A1", "Who knows", ["2Ap.01"],
             "The class is finding out about our town. Press <b>Next</b> and see who knows what.",
             explain(
                 ["Different people know different things about the same topic.", "So to find out about a topic, you ask the right person."],
                 ["The baker knows how bread is made.", "The bus driver knows where the buses go.",
                  "The librarian knows which books the town has.", "None of them knows everything."],
                 ["Children think one grown-up knows everything.", "Everybody knows their own part."],
                 ["Press Next and listen for who knows what."]),
             {"frames": [
                 {"pic": "\U0001F3D8️", "cap": "Our topic: <b>our town</b>. Who knows about it?", "say": "Our topic: our town. Who knows about it?"},
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F373", "cap": "The <b>baker</b> knows how bread is made. But not where the buses go.", "say": "The baker knows how bread is made. But she does not know where the buses go.", "sound": "pop"},
                 {"pic": "\U0001F468\U0001F3FE‍✈️", "cap": "The <b>bus driver</b> knows every bus stop. But not how bread is made.", "say": "The bus driver knows every bus stop. But he does not know how bread is made.", "sound": "pop"},
                 {"pic": "\U0001F469\U0001F3FD‍\U0001F4BC", "cap": "The <b>librarian</b> knows which books the town has.", "say": "The librarian knows which books the town has, and when the library opens.", "sound": "pop"},
                 {"pic": "\U0001F4A1", "cap": "Different people know <b>different things</b>. Ask the one who knows.", "say": "Different people know different things about the same topic. To find out, ask the one who knows.", "sound": "tada"},
             ]},
             "Different people know different things. Ask the one who knows."),

        step("answer", "Who would know?", "\U0001F9D1\U0001F3FE‍\U0001F373", "Right-person finder", ["2Ap.01"],
             "Teacher Yasmin has a question about the town. Who would know the answer? Tap the person.",
             explain(
                 ["To find something out, ask the person whose job it is to know."],
                 ["How is bread made? The baker.", "Which bus goes to the market? The bus driver.", "When does the library open? The librarian."],
                 ["Children ask their favourite person.", "Ask the one whose job it is."],
                 ["Read the question, then tap the person who would know."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "How is bread made?", "about": "bread", "pic": "\U0001F35E",
                   "opts": [tagged("The baker", "bread", "\U0001F469\U0001F3FE‍\U0001F373"), tagged("The bus driver", "buses", "\U0001F468\U0001F3FE‍✈️"), tagged("The librarian", "books", "\U0001F469\U0001F3FD‍\U0001F4BC")],
                   "why": "The baker makes bread every day, so the baker knows."},
                  {"ask": "Which bus goes to the market?", "about": "buses", "pic": "\U0001F68C",
                   "opts": [tagged("The bus driver", "buses", "\U0001F468\U0001F3FE‍✈️"), tagged("The baker", "bread", "\U0001F469\U0001F3FE‍\U0001F373"), tagged("The doctor", "health", "\U0001F469\U0001F3FF‍⚕️")],
                   "why": "The bus driver drives the buses, so the bus driver knows the routes."},
                  {"ask": "When does the library open?", "about": "books", "pic": "\U0001F4DA",
                   "opts": [tagged("The librarian", "books", "\U0001F469\U0001F3FD‍\U0001F4BC"), tagged("The farmer", "farming", "\U0001F468\U0001F3FD‍\U0001F33E"), tagged("The bus driver", "buses", "\U0001F468\U0001F3FE‍✈️")],
                   "why": "The librarian works at the library, so the librarian knows when it opens."},
                  {"ask": "What should I do about a sore throat?", "about": "health", "pic": "\U0001FA7A",
                   "opts": [tagged("The doctor", "health", "\U0001F469\U0001F3FF‍⚕️"), tagged("The baker", "bread", "\U0001F469\U0001F3FE‍\U0001F373"), tagged("The librarian", "books", "\U0001F469\U0001F3FD‍\U0001F4BC")],
                   "why": "The doctor knows about being ill and getting better."},
                  {"ask": "When are the strawberries ready to pick?", "about": "farming", "pic": "\U0001F353",
                   "opts": [tagged("The farmer", "farming", "\U0001F468\U0001F3FD‍\U0001F33E"), tagged("The doctor", "health", "\U0001F469\U0001F3FF‍⚕️"), tagged("The bus driver", "buses", "\U0001F468\U0001F3FE‍✈️")],
                   "why": "The farmer grows the strawberries, so the farmer knows when they are ready."},
              ]},
             "Five questions, five people who would know. You asked the right person every time."),

        step("explore", "People in our town", "\U0001F3D8️", "Town people", ["2Ap.01"],
             "Six people who know six different things about our town. Tap each one.",
             explain(
                 ["Every person in the town knows something the others do not."],
                 ["Tap each one and hear what they know.", "Then say who would know about the park."],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F373", "label": "the baker", "say": "The baker knows how bread is made, and what time it comes out of the oven."},
                 {"pic": "\U0001F468\U0001F3FE‍✈️", "label": "the bus driver", "say": "The bus driver knows every bus stop, and which bus goes where."},
                 {"pic": "\U0001F469\U0001F3FD‍\U0001F4BC", "label": "the librarian", "say": "The librarian knows every book in the library, and when it opens."},
                 {"pic": "\U0001F469\U0001F3FF‍⚕️", "label": "the doctor", "say": "The doctor knows how to help you when you are ill."},
                 {"pic": "\U0001F468\U0001F3FD‍\U0001F33E", "label": "the farmer", "say": "The farmer knows what grows in the fields, and when it is ready."},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "label": "the park keeper", "say": "The park keeper knows every tree in the park, and where the ducks nest."},
             ], "need": 6,
              "then": {"ask": "Who would know where the ducks nest in the park?",
                       "opts": [opt("The park keeper", True), opt("The baker", False), opt("The doctor", False)],
                       "why": "The park keeper works in the park every day, so the park keeper knows."}},
             "Six people, six different things known. That is a town."),

        step("know", "My talk about our town", "\U0001F5E3️", "Town talker", ["2Mi.01"],
             "Give a short talk about our town. Tap four things to say. Everything in your talk has to be ABOUT the town.",
             explain(
                 ["A talk about a topic says things that are about that topic.", "Not about something else, however true."],
                 ["Our town has a market on Saturdays. About the town.", "The bus goes to the market from the school. About the town.",
                  "My cat is called Tiger. True, but about cats."],
                 ["Children put in their favourite fact about anything.", "Every sentence in a talk about the town is about the town."],
                 ["Tap four things about our town, then press Give my talk."]),
             {"mode": "talk", "topic": "our town", "tag": "town", "topicPic": "\U0001F3D8️", "need": 4,
              "cards": [
                  dict(tagged("Our town has a market on Saturdays", "town", "\U0001F9FA"), say="Our town has a market on Saturdays"),
                  dict(tagged("The bus goes from the school to the market", "town", "\U0001F68C"), say="The bus goes from the school to the market"),
                  dict(tagged("The library is next to the park", "town", "\U0001F4DA"), say="The library is next to the park"),
                  dict(tagged("The baker opens at seven in the morning", "town", "\U0001F35E"), say="The baker opens at seven in the morning"),
                  dict(tagged("There are ducks on the park pond", "town", "\U0001F986"), say="There are ducks on the park pond"),
                  dict(tagged("My cat is called Tiger", "pets", "\U0001F431"), say="My cat is called Tiger", aboutLabel="pets"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
                  dict(tagged("I like ice cream", "food", "\U0001F366"), say="I like ice cream", aboutLabel="what I like"),
              ]},
             "You gave a talk about our town, and every sentence was about the town."),

        step("sort", "Who would know that?", "\U0001F9E9", "Knower sorter", ["2Ap.01"],
             "Here are things somebody in the town knows. Who knows it?",
             explain(
                 ["Match the thing known to the person whose job it is."],
                 ["How much flour goes in a loaf: the baker.", "Which stop is nearest the school: the bus driver."],
                 [],
                 ["Read it, then tap the person."]),
             {"ask": "Who would know this?",
              "bins": [{"id": "baker", "label": "The baker", "pic": "\U0001F469\U0001F3FE‍\U0001F373"}, {"id": "driver", "label": "The bus driver", "pic": "\U0001F468\U0001F3FE‍✈️"}, {"id": "keeper", "label": "The park keeper", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E"}],
              "items": [
                  {"pic": "\U0001F35E", "label": "how much flour goes in a loaf", "bin": "baker", "why": "Bread is the baker's job."},
                  {"pic": "\U0001F68F", "label": "which bus stop is nearest the school", "bin": "driver", "why": "The bus driver knows every stop."},
                  {"pic": "\U0001F333", "label": "how old the big oak tree is", "bin": "keeper", "why": "The park keeper looks after the trees."},
                  {"pic": "\U0001F950", "label": "what time the buns come out of the oven", "bin": "baker", "why": "The baker bakes them."},
                  {"pic": "\U0001F986", "label": "where the ducks nest", "bin": "keeper", "why": "The park keeper sees the ducks every day."},
                  {"pic": "\U0001F3AB", "label": "how much a bus ticket costs", "bin": "driver", "why": "The bus driver sells the tickets."},
              ]},
             "You matched six things to the people who know them."),

        step("questions", "Knowing and talking", "\U0001F4AC", "Town judge", ["2Ap.01", "2Mi.01"],
             "Think about who knows what, and your talk. Tap the answer.",
             explain(
                 ["Different people know different things.", "A talk about a topic stays on the topic."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Does the baker know where the buses go?", "\U0001F469\U0001F3FE‍\U0001F373", "No, that is the bus driver's job", ["Yes, bakers know everything", "Nobody knows"], "Different people know different things."),
                 q("You want to know when the library opens. Who do you ask?", "\U0001F4DA", "the librarian", ["the farmer", "the doctor"], "The librarian works there."),
                 q("Which sentence belongs in a talk about our town?", "\U0001F3D8️", "The library is next to the park.", ["My cat is called Tiger.", "Lions live in Africa."], "It is about the town."),
                 q("Why do we ask different people about different things?", "\U0001F4A1", "because each person knows their own part", ["because it is polite", "because one person is enough"], "Nobody knows everything."),
             ]},
             "You know who knows what, and how to talk about a topic."),

        step("quiz", "Show what you know", "⭐", "Star talker", ["2Ap.01", "2Mi.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Who knows how bread is made?", "\U0001F35E", "the baker", ["the bus driver", "the librarian", "the park keeper"], "Bread is the baker's job."),
                 q("Who knows which bus goes to the market?", "\U0001F68C", "the bus driver", ["the baker", "the doctor", "the farmer"], "The bus driver drives the routes."),
                 q("Do different people know different things about a topic?", "\U0001F4A1", "Yes, each knows their own part", ["No, everyone knows the same", "Only teachers know things"], "That is why we ask the right person."),
                 q("Who would know where the ducks nest?", "\U0001F986", "the park keeper", ["the baker", "the librarian", "the bus driver"], "The park keeper is in the park every day."),
                 q("A talk about our town should say…", "\U0001F5E3️", "only things about the town", ["anything true", "things about pets", "one word"], "Everything in a talk about a topic is about that topic."),
                 q("Which sentence does NOT belong in a talk about our town?", "\U0001F431", "My cat is called Tiger.", ["The market is on Saturdays.", "The library is next to the park.", "The bus stops at the school."], "It is true, but it is about a cat."),
                 q("When are the strawberries ready? Who knows?", "\U0001F353", "the farmer", ["the doctor", "the librarian", "the bus driver"], "The farmer grows them."),
                 q("Nobody knows everything. So to find out, you…", "\U0001F50D", "ask the person whose job it is", ["ask anyone", "guess", "ask your cat"], "Ask the one who knows."),
             ]},
             "That is the whole lesson finished. You know who knows what, and how to give a talk."),
    ],
}


LESSON["about"] = [
    "Say that different people know different things about a topic.",
    "Work out who would know the answer to a question.",
    "Give a short talk about a topic where everything you say is about it.",
    "Match things known to the people whose job it is to know them.",
]

LESSON["lecture"] = [
    part("\U0001F3D8️", "Our town",
         "Our topic is our town. Lots of people live and work in it, and each one knows a different part of it."),
    part("\U0001F469\U0001F3FE‍\U0001F373", "Who knows what",
         "The baker knows how bread is made. The bus driver knows where the buses go. The librarian knows the books. The doctor knows about being ill. Nobody knows everything."),
    part("\U0001F50D", "Ask the right person",
         "So when you want to find something out, ask the person whose job it is to know. How is bread made? The baker. Which bus goes to the market? The bus driver."),
    part("\U0001F5E3️", "A talk about the town",
         "When you give a talk about our town, everything you say has to be about the town. The market is on Saturdays. The library is next to the park. Not: my cat is called Tiger."),
    part("\U0001F4A1", "Putting it together",
         "Ask the right people, and then you know a lot about the town. Put it in a talk, and the class knows it too."),
]

LESSON["words"] = [
    word("topic", "\U0001F3AF", "The thing we are finding out and talking about.",
         ["Our topic is our town.", "Stay on the topic."]),
    word("know", "\U0001F4A1", "To have something true in your head.",
         ["The baker knows how bread is made.", "Who would know?"]),
    word("job", "\U0001F4BC", "The work a person does every day.",
         ["Baking is the baker's job.", "Ask the person whose job it is."]),
    word("talk", "\U0001F5E3️", "Telling people about a topic, in a few sentences.",
         ["Give a talk about our town.", "My talk had four sentences."]),
    word("relevant", "✅", "About the topic, not about something else.",
         ["The market is relevant to our town.", "Keep your talk relevant."]),
    word("librarian", "\U0001F469\U0001F3FD‍\U0001F4BC", "The person who looks after the books in a library.",
         ["The librarian knows every book.", "Ask the librarian when it opens."]),
]

LESSON["home"] = [
    home("Who knows what at home?", "Everyone at home",
         ["Think of three questions: how does the washing machine work, what is for dinner, where is the nearest bus stop.",
          "For each one, say who at home would know best.",
          "Ask them and see if you were right."],
         "Did the same person know all three?"),
    home("A talk about our street", "A grown-up to listen",
         ["Give a talk about your street: four sentences.",
          "Your grown-up puts a hand up if a sentence is not about the street.",
          "Try again until all four are about the street."],
         "Which sentence was hardest to keep on the topic?"),
    home("Ask a person who knows", "A walk with a grown-up",
         ["On a walk, find a person doing a job: a shopkeeper, a driver, a gardener.",
          "With your grown-up, ask them one question about their job.",
          "Tell somebody at home what you found out."],
         "Could anybody else have answered that question as well?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "how to swim", "the names of the planets"],
}
