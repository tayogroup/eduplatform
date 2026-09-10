# -*- coding: utf-8 -*-
"""Lesson 4 - The Old Field.

0838 Stage 4 Analysis: 4Ap.01 recognise that people think or believe
different things about a topic. Evaluation: 4Es.01 discuss a source,
recognising that the author has a clear viewpoint on the topic; 4Ea.01
express an opinion about another person's viewpoint, giving reasons for
opinion. The topic is a supermarket planned for the old field at the edge of
town - a corner shopkeeper, a mother of four, a farmer and a builder really do
think different things, a leaflet and a letter each carry their author's
viewpoint, and a child can say what they think of somebody else's view, with
reasons.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}
OMAR = {"name": "Mr Omar, the corner shopkeeper", "pic": "\U0001F9D4\U0001F3FE"}
FARAH = {"name": "Mrs Farah, a mother of four", "pic": "\U0001F469\U0001F3FD"}
HASSAN = {"name": "Mr Hassan, the farmer", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E"}
DANA = {"name": "Dana, from the building company", "pic": "\U0001F477\U0001F3FC"}

LESSON = {
    "slug": "the-old-field",
    "title": "The Old Field",
    "blurb": "A supermarket is planned for the old field at the edge of town. The corner shopkeeper, a mother of four, the farmer and the builder all think differently. Work out who thinks what, find the author's viewpoint in a leaflet and a letter, and give your own opinion about somebody else's, with reasons.",
    "steps": [
        step("demo", "One field, four views", "\U0001F3EA", "View spotter", ["4Ap.01"],
             "Everybody knows the same facts about the old field. They still think different things. Press <b>Next</b>.",
             explain(
                 ["People can know the same facts and think different things, because each person is affected differently.",
                  "A shopkeeper, a parent, a farmer and a builder look at the same field from four places."],
                 ["Mr Omar thinks the supermarket will close his shop.", "Mrs Farah thinks it will make food cheaper for her four children.", "Same field, opposite views, and both have reasons."],
                 ["Children decide one person is right and the rest are wrong.", "Ask what each person stands to gain or lose. That is where views come from."],
                 ["Press Next and hear four views."]),
             {"frames": [
                 {"pic": "\U0001F33E", "cap": "Our topic: <b>the old field</b>. A company wants to build a supermarket on it.", "say": "Our topic: the old field at the edge of town. A company wants to build a supermarket on it. Should it?"},
                 {"pic": "\U0001F9D4\U0001F3FE", "cap": "Mr Omar, the corner shopkeeper, thinks: <b>it will close small shops like mine</b>.", "say": "Mr Omar, the corner shopkeeper, thinks it will close small shops like his. Everyone will drive to the big one.", "sound": "pop"},
                 {"pic": "\U0001F469\U0001F3FD", "cap": "Mrs Farah, a mother of four, thinks: <b>food will be cheaper and closer</b>.", "say": "Mrs Farah, a mother of four, thinks food will be cheaper and closer. She takes two buses to the nearest big shop now.", "sound": "pop"},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "cap": "Mr Hassan, the farmer, thinks: <b>my sheep have grazed there for forty years</b>.", "say": "Mr Hassan, the farmer, thinks the field should stay a field. His sheep have grazed there for forty years.", "sound": "pop"},
                 {"pic": "\U0001F477\U0001F3FC", "cap": "Dana, from the building company, thinks: <b>it will bring eighty jobs to town</b>.", "say": "Dana, from the building company, thinks it will bring eighty jobs to the town.", "sound": "pop"},
                 {"pic": "\U0001F4AD", "cap": "Same field, same facts, <b>four different views</b>, each from where that person stands.", "say": "Same field, same facts, four different views, each one from where that person stands.", "sound": "tada"},
             ]},
             "People think different things about the same topic, from where each of them stands."),

        step("answer", "Who thinks what?", "\U0001F4AD", "View matcher", ["4Ap.01"],
             "Teacher Yasmin describes a view. Who holds it? Tap the person.",
             explain(
                 ["Recognising that people think different things means being able to say WHO thinks WHAT, and why they might."],
                 ["The supermarket will close small shops: that is the shopkeeper.", "Eighty jobs: that is the builder."],
                 [],
                 ["Read the view, then tap the person who holds it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "Who thinks the supermarket will close small shops?", "about": "shops", "pic": "\U0001F3EA",
                   "opts": [tagged("Mr Omar, the corner shopkeeper", "shops", "\U0001F9D4\U0001F3FE"), tagged("Mrs Farah, the mother of four", "cheaper", "\U0001F469\U0001F3FD"), tagged("Dana, from the building company", "jobs", "\U0001F477\U0001F3FC")],
                   "why": "Mr Omar runs a small shop. A big one nearby is his worry."},
                  {"ask": "Who thinks food will be cheaper and closer?", "about": "cheaper", "pic": "\U0001F6D2",
                   "opts": [tagged("Mrs Farah, the mother of four", "cheaper", "\U0001F469\U0001F3FD"), tagged("Mr Hassan, the farmer", "sheep", "\U0001F9D1\U0001F3FE‍\U0001F33E"), tagged("Mr Omar, the corner shopkeeper", "shops", "\U0001F9D4\U0001F3FE")],
                   "why": "Mrs Farah feeds four children and takes two buses to shop now."},
                  {"ask": "Who thinks the field should stay a field for the sheep?", "about": "sheep", "pic": "\U0001F411",
                   "opts": [tagged("Mr Hassan, the farmer", "sheep", "\U0001F9D1\U0001F3FE‍\U0001F33E"), tagged("Dana, from the building company", "jobs", "\U0001F477\U0001F3FC"), tagged("Mrs Farah, the mother of four", "cheaper", "\U0001F469\U0001F3FD")],
                   "why": "Mr Hassan's sheep have grazed there for forty years."},
                  {"ask": "Who thinks the supermarket will bring eighty jobs?", "about": "jobs", "pic": "\U0001F477",
                   "opts": [tagged("Dana, from the building company", "jobs", "\U0001F477\U0001F3FC"), tagged("Mr Omar, the corner shopkeeper", "shops", "\U0001F9D4\U0001F3FE"), tagged("Mr Hassan, the farmer", "sheep", "\U0001F9D1\U0001F3FE‍\U0001F33E")],
                   "why": "Dana works for the company that would build it."},
              ]},
             "Four views matched to the four people who hold them."),

        step("sort", "A fact, or what somebody thinks?", "⚖️", "Fact-or-view judge", ["4Ap.01"],
             "Some of these are facts about the old field. Some are what a person THINKS should happen. Which is it?",
             explain(
                 ["A fact is true for everybody.", "A view is what one person thinks should happen. Other people can think differently."],
                 ["The field is at the edge of town: a fact.", "The supermarket should be built: what Dana thinks."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "A fact, or a view?",
              "bins": [{"id": "fact", "label": "A fact", "pic": "✅"}, {"id": "view", "label": "What somebody thinks", "pic": "\U0001F4AD"}],
              "items": [
                  {"pic": "\U0001F33E", "label": "The old field is at the edge of town", "bin": "fact", "why": "Anybody can walk there. A fact."},
                  {"pic": "\U0001F9D4\U0001F3FE", "label": "The supermarket should not be built", "bin": "view", "why": "That is what Mr Omar thinks. Mrs Farah thinks differently."},
                  {"pic": "\U0001F411", "label": "Sheep have grazed the field for forty years", "bin": "fact", "why": "The farm's records show it. A fact."},
                  {"pic": "\U0001F469\U0001F3FD", "label": "Cheaper food matters more than one field", "bin": "view", "why": "That is what Mrs Farah thinks."},
                  {"pic": "\U0001F68C", "label": "The nearest big shop is two bus rides away", "bin": "fact", "why": "You can check the bus map. A fact."},
                  {"pic": "\U0001F477\U0001F3FC", "label": "Eighty jobs are worth losing a field for", "bin": "view", "why": "That is what Dana thinks. Mr Hassan would not agree."},
              ]},
             "You can tell a fact from what somebody thinks."),

        step("text", "The company's leaflet", "\U0001F4CB", "Leaflet reader", ["4Es.01"],
             "The building company posted a leaflet through every door. Find the sentences that show what the AUTHOR thinks. Then say what the viewpoint is.",
             explain(
                 ["A source is written by somebody, and that somebody has a viewpoint.", "Look for the sentences that show what the author wants to happen, and the reasons they give."],
                 ["Eighty new jobs for local people: that is the author's reason.", "We hope you will support the plan: that is what the author wants."],
                 ["Children read a leaflet as plain facts.", "Ask: who wrote this, and what do THEY want from me?"],
                 ["Press Read it to me, then tap the sentences."]),
             {"title": "A leaflet through the door",
              "lines": [
                  "A new supermarket for our town.",
                  "The store will bring eighty new jobs for local people.",
                  "Fresh food will be a short walk away, at prices lower than the shops in town today.",
                  "We will plant a hundred trees along the edge of the car park.",
                  "We hope you will support the plan at the meeting on Tuesday. Greenway Stores Ltd.",
              ],
              "rounds": [
                  {"ask": "Which sentence shows what the author WANTS you to do?", "about": "what the author wants", "line": 4, "why": "Support the plan at the meeting. That is the author's wish."},
                  {"ask": "Which sentence gives the author's reason about JOBS?", "about": "the author's reason about jobs", "line": 1, "why": "Eighty new jobs for local people."},
                  {"ask": "Which sentence tells you WHO the author is?", "about": "who wrote it", "line": 4, "why": "Greenway Stores Ltd, the company that would build it. Knowing that helps you see the viewpoint."},
              ],
              "then": {"ask": "What is the author's viewpoint?",
                       "opts": [opt("The supermarket should be built on the old field", True), opt("The field should stay a field", False), opt("Small shops should close", False)],
                       "why": "Every sentence points the same way: the company wants the plan supported."}},
             "You found the author's viewpoint in a leaflet, and the reasons behind it."),

        step("text", "The shopkeeper's letter", "✉️", "Letter reader", ["4Es.01"],
             "Mr Omar wrote a letter to the town newspaper. Find HIS viewpoint. Is it the same as the leaflet's?",
             explain(
                 ["A different author, a different viewpoint.", "Both are about the same field."],
                 [],
                 [],
                 ["Read it, then tap the sentences."]),
             {"title": "A letter to the town newspaper",
              "lines": [
                  "My family has run the corner shop on Mill Street for thirty years.",
                  "When a supermarket opened in the next town, four of its small shops closed within a year.",
                  "A big store cannot know your name or keep a loaf back for you on a Saturday.",
                  "I think the town should say no to the plan and keep the field, and its small shops.",
                  "Omar Said, Mill Street.",
              ],
              "rounds": [
                  {"ask": "Which sentence says what the author thinks the town SHOULD do?", "about": "what the author thinks the town should do", "line": 3, "why": "Say no to the plan. That is his viewpoint."},
                  {"ask": "Which sentence gives his evidence about the NEXT town?", "about": "his evidence about the next town", "line": 1, "why": "Four small shops closed within a year."},
                  {"ask": "Which sentence gives a reason a SMALL shop is different?", "about": "why a small shop is different", "line": 2, "why": "A big store cannot know your name or keep a loaf back."},
              ],
              "then": {"ask": "Do the leaflet and the letter have the same viewpoint?",
                       "opts": [opt("No: the leaflet wants the store built, the letter wants the field kept", True), opt("Yes, both want the store", False), opt("Yes, both want the field kept", False)],
                       "why": "Two sources, two authors, two opposite viewpoints about the same field."}},
             "Two sources about one field, and two authors who think differently."),

        step("opinion", "What do YOU think of their views?", "\U0001F4AD", "Viewpoint judge", ["4Ea.01"],
             "Now you. Do you agree with Mr Omar? With Mrs Farah? With Mr Hassan? Say what you think of each view, with two reasons.",
             explain(
                 ["An opinion about somebody else's viewpoint says whether you agree, and why.", "Two reasons, both about the topic."],
                 ["I partly agree with Mr Omar, because small shops do close when big ones open, and because he knows his customers.",
                  "Because I like chips is not a reason about the old field."],
                 ["Children just say 'I agree' and stop.", "Say why. Twice."],
                 ["Tap what you think, then two reasons."]),
             {"reasonsNeeded": 2,
              "rounds": [
                 {"topic": "keeping the field and the small shops", "tag": "shops", "pic": "\U0001F9D4\U0001F3FE", "ask": "What do you think of Mr Omar's view?",
                  "view": {"name": "Mr Omar", "pic": "\U0001F9D4\U0001F3FE", "says": "The town should say no to the plan and keep its field and its small shops."},
                  "stances": [{"id": "agree", "t": "I agree with Mr Omar"}, {"id": "part", "t": "I partly agree with Mr Omar"}, {"id": "disagree", "t": "I disagree with Mr Omar"}],
                  "reasons": [tagged("because small shops really did close in the next town", "shops"), tagged("because a shopkeeper who knows your name is worth keeping", "shops"), tagged("because some families cannot afford small-shop prices", "shops"), tagged("because a town can have both big and small shops", "shops"),
                              tagged("because I like chips", "food"), tagged("because it is Tuesday", "days")]},
                 {"topic": "cheaper food closer to home", "tag": "cheaper", "pic": "\U0001F469\U0001F3FD", "ask": "What do you think of Mrs Farah's view?",
                  "view": {"name": "Mrs Farah", "pic": "\U0001F469\U0001F3FD", "says": "Cheaper food a short walk away matters more than one field."},
                  "stances": [{"id": "agree", "t": "I agree with Mrs Farah"}, {"id": "part", "t": "I partly agree with Mrs Farah"}, {"id": "disagree", "t": "I disagree with Mrs Farah"}],
                  "reasons": [tagged("because two bus rides to buy food is too many for a family", "cheaper"), tagged("because lower prices help the families with the least money", "cheaper"), tagged("because once a field is built on it never comes back", "cheaper"), tagged("because the small shops might lower their prices instead", "cheaper"),
                              tagged("because my shoes are new", "shoes"), tagged("because the sea is salty", "the sea")]},
                 {"topic": "keeping the field for the sheep", "tag": "sheep", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "ask": "What do you think of Mr Hassan's view?",
                  "view": {"name": "Mr Hassan", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "says": "The field should stay a field. My sheep have grazed it for forty years."},
                  "stances": [{"id": "agree", "t": "I agree with Mr Hassan"}, {"id": "part", "t": "I partly agree with Mr Hassan"}, {"id": "disagree", "t": "I disagree with Mr Hassan"}],
                  "reasons": [tagged("because a farmer should not lose land he has used for forty years", "sheep"), tagged("because green fields at the edge of town are good for everyone", "sheep"), tagged("because the sheep could graze another field", "sheep"), tagged("because eighty jobs would help more people than one farm", "sheep"),
                              tagged("because I had toast for breakfast", "breakfast"), tagged("because the bus was late", "buses")]},
             ]},
             "You gave your opinion about three people's views, each with two reasons."),

        step("questions", "Views and viewpoints", "\U0001F4AC", "Viewpoint judge", ["4Ap.01", "4Es.01", "4Ea.01"],
             "Think about who thinks what, the leaflet, the letter and your opinions. Tap the answer.",
             explain(
                 ["People think different things. An author has a viewpoint. You can have an opinion about it, with reasons."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Mr Omar and Mrs Farah know the same facts about the field. Do they think the same?", "\U0001F4AD", "No, they hold different views", ["Yes, exactly the same", "Neither has a view"], "Same facts, different views, from where each stands."),
                 q("Who wrote the leaflet?", "\U0001F4CB", "Greenway Stores, the company that would build it", ["Mr Omar", "Mr Hassan"], "It was signed Greenway Stores Ltd."),
                 q("What was the viewpoint in Mr Omar's letter?", "✉️", "the town should say no and keep the field and its shops", ["the store should be built quickly", "the field should be a car park"], "He thinks the town should say no to the plan."),
                 q("I agree with Mrs Farah because…? Which reason is ABOUT the old field?", "\U0001F6D2", "two bus rides to buy food is too many", ["my shoes are new", "the sea is salty"], "It is about shopping in this town."),
             ]},
             "You know who thinks what, whose viewpoint a source carries, and how to give your opinion of it."),

        step("quiz", "Show what you know", "⭐", "Star evaluator", ["4Ap.01", "4Es.01", "4Ea.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Why do four people think differently about one field?", "\U0001F4AD", "each is affected differently, so each looks from where they stand", ["three of them are lying", "they know different facts", "they have not seen the field"], "A shopkeeper, a parent, a farmer and a builder."),
                 q("Which of these is a FACT, not a view?", "✅", "The nearest big shop is two bus rides away", ["The store should be built", "The field should stay a field", "Jobs matter more than sheep"], "You can check the bus map."),
                 q("Who thinks the supermarket will bring eighty jobs?", "\U0001F477", "Dana, from the building company", ["Mr Omar", "Mr Hassan", "Mrs Farah"], "She works for the company."),
                 q("Why does it help to know who wrote a source?", "✍️", "because the author has a viewpoint, and knowing who helps you see it", ["it does not help", "so you can write to them", "to know their age"], "A company's leaflet and a shopkeeper's letter say opposite things."),
                 q("What did the leaflet ask people to do?", "\U0001F4CB", "support the plan at Tuesday's meeting", ["close their shops", "plant a hundred trees", "buy sheep"], "We hope you will support the plan."),
                 q("What evidence did Mr Omar give?", "✉️", "four small shops closed in the next town within a year", ["the field is muddy", "his shop is the biggest", "he has no customers"], "His letter's second sentence."),
                 q("Can you disagree with Mr Hassan and still be fair?", "⚖️", "Yes, if you give reasons about the topic", ["No, never", "Only if he is wrong"], "An opinion about a viewpoint needs reasons."),
                 q("Which reason is NOT about the old field?", "\U0001F937", "because it is Tuesday", ["because small shops closed in the next town", "because the sheep could graze elsewhere", "because prices would be lower"], "The day of the week is not the topic."),
             ]},
             "That is the whole lesson finished. You see who thinks what, whose viewpoint a source carries, and you give your own opinion with reasons."),
    ],
}


LESSON["about"] = [
    "Say who thinks what about a topic, and why they might, from where they stand.",
    "Tell a fact from what somebody thinks.",
    "Find the author's viewpoint in a source, and the reasons the author gives.",
    "Give your opinion about somebody else's viewpoint, with two reasons about the topic.",
]

LESSON["lecture"] = [
    part("\U0001F33E", "The old field",
         "A company wants to build a supermarket on the old field at the edge of town. Everybody knows the same facts about it. They still think different things."),
    part("\U0001F4AD", "Four views",
         "Mr Omar the shopkeeper thinks it will close small shops. Mrs Farah, a mother of four, thinks food will be cheaper and closer. Mr Hassan the farmer thinks the field should stay a field. Dana from the building company thinks it will bring eighty jobs. Each view comes from where that person stands."),
    part("\U0001F4CB", "The leaflet",
         "The company's leaflet says: eighty jobs, cheaper food, a hundred trees, support the plan on Tuesday. Who wrote it? Greenway Stores Ltd, the company that would build it. Knowing the author is how you see the viewpoint."),
    part("✉️", "The letter",
         "Mr Omar's letter says: four small shops closed in the next town, a big store cannot know your name, the town should say no. A different author, an opposite viewpoint, about the same field."),
    part("⚖️", "Your opinion, with reasons",
         "Now you. Do you agree with Mr Omar, partly agree, or disagree? Say why, twice, and make both reasons about the field, the shops, the prices or the jobs. Because it is Tuesday is not a reason."),
]

LESSON["words"] = [
    word("viewpoint", "\U0001F4AD", "What a person thinks should happen about a topic.",
         ["The leaflet's viewpoint is that the store should be built.", "Every author has a viewpoint."]),
    word("author", "✍️", "The person or company that wrote a source.",
         ["The leaflet's author is the building company.", "Knowing the author helps you see the viewpoint."]),
    word("evidence", "\U0001F50D", "Facts that support a view.",
         ["Four shops closing was Mr Omar's evidence.", "Give evidence, not just feelings."]),
    word("opinion", "\U0001F5E3️", "What you think about something, with your reasons.",
         ["My opinion is that I partly agree with Mrs Farah.", "An opinion needs reasons."]),
    word("support", "\U0001F91D", "To be in favour of something and help it happen.",
         ["The leaflet asks people to support the plan.", "Would you support it?"]),
    word("graze", "\U0001F411", "What sheep and cows do when they eat grass in a field.",
         ["The sheep graze the old field.", "They have grazed there for forty years."]),
]

LESSON["home"] = [
    home("Who thinks what at home?", "Everyone at home and a topic people disagree about: bedtime, screens, what to have for dinner",
         ["Ask each person what they think should happen.",
          "Ask each person WHY, and write the reason beside their name.",
          "Say how each person's view comes from where they stand."],
         "Did anyone change their view after hearing the reasons?"),
    home("Find the viewpoint", "A leaflet, an advert or a letter that came through the door, and a grown-up",
         ["Find who wrote it.",
          "Find the sentence that says what the author wants you to do.",
          "Find one reason the author gives."],
         "Would the author gain anything if you did what they asked?"),
    home("My opinion, two reasons", "A grown-up",
         ["Pick one view from the old field: Mr Omar's, Mrs Farah's, Mr Hassan's or Dana's.",
          "Say whether you agree, partly agree or disagree.",
          "Give two reasons, both about the field."],
         "Could your grown-up give a reason on the other side?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to swim"],
    "changed": [
        {"before": "If people disagree, somebody has the facts wrong.", "after": "People can know the same facts and think differently, from where each stands."},
        {"before": "A leaflet tells you what is true.", "after": "A leaflet has an author with a viewpoint, and it wants something from me."},
        {"before": "Saying I agree is an opinion.", "after": "An opinion is what I think AND two reasons about the topic."},
    ],
}
