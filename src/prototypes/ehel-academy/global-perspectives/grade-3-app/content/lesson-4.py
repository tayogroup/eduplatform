# -*- coding: utf-8 -*-
"""Lesson 4 - People Think Differently.

0838 Stage 3 Analysis: 3Ap.01 recognise that people think or believe
different things about a topic. Evaluation: 3Es.01 discuss a source,
recognising that the author has a clear viewpoint on the topic; 3Ea.01
express an opinion about another person's viewpoint, giving reasons for
opinion. The topic is dogs in our park - a topic where the park keeper, a
dog owner, a parent and a runner really do think different things, where a
poster and a letter each carry their author's viewpoint, and where a child
can say what they think of somebody else's view, with reasons.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}
KEEPER = {"name": "Mr Bello, the park keeper", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E"}
OWNER = {"name": "Mrs Adams, who has two dogs", "pic": "\U0001F469\U0001F3FC"}

LESSON = {
    "slug": "people-think-differently",
    "title": "People Think Differently",
    "blurb": "Should dogs run free in our park? The park keeper, a dog owner, a parent and a runner all think differently. Work out who thinks what, find the author's viewpoint in a poster and a letter, and give your own opinion about somebody else's, with reasons.",
    "steps": [
        step("demo", "Four people, four views", "\U0001F415", "View spotter", ["3Ap.01"],
             "Last year you learned that people KNOW different things. This year: people THINK different things. Press <b>Next</b>.",
             explain(
                 ["Knowing is about facts. Thinking is about what you believe should happen.", "People can know the same facts and still think different things."],
                 ["Everybody knows dogs run in the park.", "The park keeper thinks they should be on leads. Mrs Adams thinks they should run free.", "Same facts, different views."],
                 ["Children think one of them must be wrong.", "A view is not a fact. Two people can think differently and both have reasons."],
                 ["Press Next and hear four views."]),
             {"frames": [
                 {"pic": "\U0001F3DE️", "cap": "Our topic: <b>dogs in our park</b>. Should they run free?", "say": "Our topic: dogs in our park. Should they run free, or stay on leads?"},
                 {"pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "cap": "Mr Bello, the park keeper, thinks: <b>dogs should be on leads</b>. They frighten the ducks.", "say": "Mr Bello, the park keeper, thinks dogs should be on leads. They frighten the ducks and dig up the flower beds.", "sound": "pop"},
                 {"pic": "\U0001F469\U0001F3FC", "cap": "Mrs Adams, who has two dogs, thinks: <b>dogs need to run free</b> to be healthy.", "say": "Mrs Adams, who has two dogs, thinks dogs need to run free to be healthy.", "sound": "pop"},
                 {"pic": "\U0001F468\U0001F3FD", "cap": "Mr Khan, a dad with a toddler, thinks: <b>a fenced dog area</b> would suit everyone.", "say": "Mr Khan, a dad with a toddler, thinks a fenced dog area would suit everyone.", "sound": "pop"},
                 {"pic": "\U0001F3C3", "cap": "Leila, a runner, thinks: <b>dogs off the lead trip runners up</b>.", "say": "Leila, a runner, thinks dogs off the lead trip runners up, so leads on the path at least.", "sound": "pop"},
                 {"pic": "\U0001F4AD", "cap": "Same park, same dogs, <b>four different views</b>. Each one has reasons.", "say": "Same park, same dogs, four different views. Each one has reasons. That is what people are like.", "sound": "tada"},
             ]},
             "People think different things about the same topic, and each view has reasons."),

        step("answer", "Who thinks what?", "\U0001F4AD", "View matcher", ["3Ap.01"],
             "Teacher Yasmin describes a view. Who holds it? Tap the person.",
             explain(
                 ["Recognising that people think different things means being able to say WHO thinks WHAT."],
                 ["Dogs should be on leads because of the ducks: that is the park keeper.", "Dogs need to run free: that is Mrs Adams."],
                 [],
                 ["Read the view, then tap the person who holds it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "Who thinks dogs should be on leads because they frighten the ducks?", "about": "dogs on leads", "pic": "\U0001F986",
                   "opts": [tagged("Mr Bello, the park keeper", "dogs on leads", "\U0001F9D1\U0001F3FE‍\U0001F33E"), tagged("Mrs Adams, the dog owner", "dogs running free", "\U0001F469\U0001F3FC"), tagged("Mr Khan, the dad", "a fenced dog area", "\U0001F468\U0001F3FD")],
                   "why": "The park keeper looks after the ducks and the flower beds, and thinks leads protect them."},
                  {"ask": "Who thinks dogs need to run free to be healthy?", "about": "dogs running free", "pic": "\U0001F415",
                   "opts": [tagged("Mrs Adams, the dog owner", "dogs running free", "\U0001F469\U0001F3FC"), tagged("Leila, the runner", "runners on the path", "\U0001F3C3"), tagged("Mr Bello, the park keeper", "dogs on leads", "\U0001F9D1\U0001F3FE‍\U0001F33E")],
                   "why": "Mrs Adams has two dogs and thinks running free keeps them healthy."},
                  {"ask": "Who thinks a fenced dog area would suit everyone?", "about": "a fenced dog area", "pic": "\U0001F6A7",
                   "opts": [tagged("Mr Khan, the dad", "a fenced dog area", "\U0001F468\U0001F3FD"), tagged("Mrs Adams, the dog owner", "dogs running free", "\U0001F469\U0001F3FC"), tagged("Leila, the runner", "runners on the path", "\U0001F3C3")],
                   "why": "Mr Khan has a toddler and thinks a fence keeps dogs and small children apart."},
                  {"ask": "Who thinks dogs off the lead trip runners up on the path?", "about": "runners on the path", "pic": "\U0001F3C3",
                   "opts": [tagged("Leila, the runner", "runners on the path", "\U0001F3C3"), tagged("Mr Bello, the park keeper", "dogs on leads", "\U0001F9D1\U0001F3FE‍\U0001F33E"), tagged("Mr Khan, the dad", "a fenced dog area", "\U0001F468\U0001F3FD")],
                   "why": "Leila runs on the path, and loose dogs get under her feet."},
              ]},
             "Four views matched to the four people who hold them."),

        step("sort", "A fact, or what somebody thinks?", "⚖️", "Fact-or-view judge", ["3Ap.01"],
             "Some of these are facts about the park. Some are what a person THINKS should happen. Which is it?",
             explain(
                 ["A fact is true for everybody.", "A view is what one person thinks should happen. Other people can think differently."],
                 ["The park has a pond with ducks: a fact.", "Dogs should be on leads: what Mr Bello thinks."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "A fact, or a view?",
              "bins": [{"id": "fact", "label": "A fact", "pic": "✅"}, {"id": "view", "label": "What somebody thinks", "pic": "\U0001F4AD"}],
              "items": [
                  {"pic": "\U0001F986", "label": "The park has a pond with ducks on it", "bin": "fact", "why": "Anybody can see the ducks. A fact."},
                  {"pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "label": "Dogs should always be on leads in the park", "bin": "view", "why": "That is what Mr Bello thinks. Mrs Adams thinks differently."},
                  {"pic": "\U0001F415", "label": "Some dogs dig in the flower beds", "bin": "fact", "why": "It happens, and the holes are there to see. A fact."},
                  {"pic": "\U0001F469\U0001F3FC", "label": "Dogs need to run free to be healthy", "bin": "view", "why": "That is what Mrs Adams thinks."},
                  {"pic": "\U0001F6A7", "label": "A fenced dog area would suit everyone", "bin": "view", "why": "That is what Mr Khan thinks. Leila might not agree."},
                  {"pic": "\U0001F3C3", "label": "Runners use the path round the pond", "bin": "fact", "why": "You can watch them do it. A fact."},
              ]},
             "You can tell a fact from what somebody thinks."),

        step("text", "The park keeper's poster", "\U0001F4CB", "Poster reader", ["3Es.01"],
             "Mr Bello put a poster up by the gate. Find the sentences that show what HE thinks. Then say what his viewpoint is.",
             explain(
                 ["A source is written by somebody, and that somebody has a viewpoint.", "Look for the sentences that show what the author thinks should happen."],
                 ["The ducks are frightened by loose dogs: that is the author's reason.", "Please keep your dog on a lead: that is what the author wants."],
                 ["Children read a poster as if it were plain facts.", "Ask: who wrote this, and what do THEY want?"],
                 ["Press Read it to me, then tap the sentences."]),
             {"title": "A poster by the park gate",
              "lines": [
                  "Welcome to Riverside Park.",
                  "The ducks on our pond are frightened by loose dogs, and three nests were lost this year.",
                  "Loose dogs also dig up the flower beds our volunteers plant.",
                  "So please keep your dog on a lead at all times.",
                  "Thank you. Mr Bello, Park Keeper.",
              ],
              "rounds": [
                  {"ask": "Which sentence shows what the author WANTS people to do?", "about": "what the author wants", "line": 3, "why": "Please keep your dog on a lead. That is the author's wish, stated plainly."},
                  {"ask": "Which sentence gives the author's reason about the DUCKS?", "about": "the author's reason about the ducks", "line": 1, "why": "Frightened ducks and lost nests are the reason he gives."},
                  {"ask": "Which sentence tells you WHO the author is?", "about": "who wrote it", "line": 4, "why": "Mr Bello, Park Keeper. Knowing the author helps you see the viewpoint."},
              ],
              "then": {"ask": "What is the author's viewpoint?",
                       "opts": [opt("Dogs should be kept on leads in the park", True), opt("Dogs should run free in the park", False), opt("The park should have no ducks", False)],
                       "why": "Every sentence points the same way: the park keeper thinks dogs should be on leads."}},
             "You found the author's viewpoint in a poster, and the reasons behind it."),

        step("text", "The dog owner's letter", "✉️", "Letter reader", ["3Es.01"],
             "Mrs Adams wrote a letter to the newspaper. Find HER viewpoint. Is it the same as Mr Bello's?",
             explain(
                 ["A different author, a different viewpoint.", "Both are about the same park."],
                 [],
                 [],
                 ["Read it, then tap the sentences."]),
             {"title": "A letter to the newspaper",
              "lines": [
                  "I have walked my two dogs in Riverside Park every morning for ten years.",
                  "Dogs need to run to stay healthy, and a lead does not let them.",
                  "My dogs have never once chased a duck.",
                  "I think the park should let dogs run free on the big field, away from the pond.",
                  "Mrs Adams, Mill Lane.",
              ],
              "rounds": [
                  {"ask": "Which sentence says what the author thinks the park SHOULD do?", "about": "what the author thinks the park should do", "line": 3, "why": "Let dogs run free on the big field. That is her viewpoint."},
                  {"ask": "Which sentence gives her reason about dogs' HEALTH?", "about": "her reason about health", "line": 1, "why": "Dogs need to run to stay healthy."},
                  {"ask": "Which sentence answers Mr Bello's worry about the ducks?", "about": "her answer about the ducks", "line": 2, "why": "Her dogs have never chased a duck, she says."},
              ],
              "then": {"ask": "Do Mr Bello and Mrs Adams have the same viewpoint?",
                       "opts": [opt("No: he wants leads, she wants dogs to run free", True), opt("Yes, they both want leads", False), opt("Yes, they both want dogs to run free", False)],
                       "why": "Two sources, two authors, two different viewpoints about the same park."}},
             "Two sources about one park, and two authors who think differently."),

        step("opinion", "What do YOU think of their views?", "\U0001F4AD", "Viewpoint judge", ["3Ea.01"],
             "Now you. Do you agree with Mr Bello? With Mrs Adams? With Mr Khan? Say what you think of each view, with two reasons.",
             explain(
                 ["An opinion about somebody else's viewpoint says whether you agree, and why.", "Two reasons, both about the topic."],
                 ["I partly agree with Mr Bello, because the ducks do need protecting, and because a dog on a lead cannot get enough exercise.",
                  "Because my shoes are new is not a reason about dogs in the park."],
                 ["Children just say 'I agree' and stop.", "Say why. Twice."],
                 ["Tap what you think, then two reasons."]),
             {"reasonsNeeded": 2,
              "rounds": [
                 {"topic": "dogs on leads in the park", "tag": "leads", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "ask": "What do you think of Mr Bello's view?",
                  "view": {"name": "Mr Bello", "pic": "\U0001F9D1\U0001F3FE‍\U0001F33E", "says": "Dogs should be on leads at all times, for the ducks and the flower beds."},
                  "stances": [{"id": "agree", "t": "I agree with Mr Bello"}, {"id": "part", "t": "I partly agree with Mr Bello", "mixed": True}, {"id": "disagree", "t": "I disagree with Mr Bello"}],
                  "reasons": [dict(tagged("because the ducks and their nests do need protecting", "leads"), supports=['agree', 'part']), dict(tagged("because the flower beds get dug up by loose dogs", "leads"), supports=['agree', 'part']), dict(tagged("because a dog on a lead cannot get enough exercise", "leads"), supports=['disagree', 'part']), dict(tagged("because leads everywhere seem unfair on dogs that behave", "leads"), supports=['disagree', 'part']),
                              tagged("because I like pizza", "food"), tagged("because it is Friday", "days")]},
                 {"topic": "dogs running free on the big field", "tag": "free", "pic": "\U0001F469\U0001F3FC", "ask": "What do you think of Mrs Adams's view?",
                  "view": {"name": "Mrs Adams", "pic": "\U0001F469\U0001F3FC", "says": "Dogs should run free on the big field, away from the pond."},
                  "stances": [{"id": "agree", "t": "I agree with Mrs Adams"}, {"id": "part", "t": "I partly agree with Mrs Adams", "mixed": True}, {"id": "disagree", "t": "I disagree with Mrs Adams"}],
                  "reasons": [dict(tagged("because dogs do need to run to stay healthy", "free"), supports=['agree', 'part']), dict(tagged("because the big field is far from the ducks", "free"), supports=['agree', 'part']), dict(tagged("because not every owner can control their dog", "free"), supports=['disagree', 'part']), dict(tagged("because small children play on the big field too", "free"), supports=['disagree', 'part']),
                              tagged("because my bike is blue", "bikes"), tagged("because the sea is salty", "the sea")]},
                 {"topic": "a fenced dog area", "tag": "fence", "pic": "\U0001F468\U0001F3FD", "ask": "What do you think of Mr Khan's view?",
                  "view": {"name": "Mr Khan", "pic": "\U0001F468\U0001F3FD", "says": "A fenced dog area would suit everyone: dogs run, and everyone else is safe."},
                  "stances": [{"id": "agree", "t": "I agree with Mr Khan"}, {"id": "part", "t": "I partly agree with Mr Khan", "mixed": True}, {"id": "disagree", "t": "I disagree with Mr Khan"}],
                  "reasons": [dict(tagged("because dogs could run and the ducks would still be safe", "fence"), supports=['agree', 'part']), dict(tagged("because toddlers and dogs would be kept apart", "fence"), supports=['agree', 'part']), dict(tagged("because a fence costs money the park may not have", "fence"), supports=['disagree', 'part']), dict(tagged("because a fenced area might be too small for big dogs", "fence"), supports=['disagree', 'part']),
                              tagged("because I had toast for breakfast", "breakfast"), tagged("because the bus was late", "buses")]},
             ]},
             "You gave your opinion about three people's views, each with two reasons."),

        step("questions", "Views and viewpoints", "\U0001F4AC", "Viewpoint judge", ["3Ap.01", "3Es.01", "3Ea.01"],
             "Think about who thinks what, the poster, the letter and your opinions. Tap the answer.",
             explain(
                 ["People think different things. An author has a viewpoint. You can have an opinion about it, with reasons."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Mr Bello and Mrs Adams know the same facts about the park. Do they think the same?", "\U0001F4AD", "No, they hold different views", ["Yes, exactly the same", "Neither has a view"], "Same facts, different views."),
                 q("Who wrote the poster by the gate?", "\U0001F4CB", "Mr Bello, the park keeper", ["Mrs Adams", "Leila the runner"], "It was signed: Mr Bello, Park Keeper."),
                 q("What was the viewpoint in Mrs Adams's letter?", "✉️", "dogs should run free on the big field", ["dogs should be on leads", "the pond should be filled in"], "She thinks the park should let dogs run free on the field."),
                 q("I agree with Mr Bello because…? Which reason is ABOUT dogs in the park?", "\U0001F986", "the ducks need protecting", ["I like pizza", "it is Friday"], "The ducks are part of the topic."),
             ]},
             "You know who thinks what, whose viewpoint a source carries, and how to give your opinion of it."),

        step("quiz", "Show what you know", "⭐", "Star evaluator", ["3Ap.01", "3Es.01", "3Ea.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a viewpoint?", "\U0001F4AD", "what a person thinks should happen about a topic", ["a fact everybody agrees on", "a kind of poster", "a place in the park"], "The park keeper's viewpoint is that dogs should be on leads."),
                 q("Which of these is a FACT, not a view?", "✅", "The park has a pond with ducks", ["Dogs should be on leads", "Dogs need to run free", "A fence would suit everyone"], "Anybody can see the ducks."),
                 q("Mr Khan has a toddler. What does he think the park needs?", "\U0001F6A7", "a fenced dog area", ["no dogs at all", "a bigger pond", "a new path"], "A fence keeps dogs and small children apart."),
                 q("Why does it help to know who wrote a source?", "✍️", "because the author has a viewpoint, and knowing who helps you see it", ["it does not help", "so you can copy their name", "to know their age"], "A park keeper's poster and a dog owner's letter say different things."),
                 q("What did Mr Bello's poster ask people to do?", "\U0001F4CB", "keep dogs on a lead at all times", ["let dogs run free", "feed the ducks", "plant flowers"], "Please keep your dog on a lead at all times."),
                 q("Can you disagree with Mrs Adams and still be fair?", "⚖️", "Yes, if you give reasons about the topic", ["No, never", "Only if she is wrong"], "An opinion about a viewpoint needs reasons, not rudeness."),
                 q("How many reasons should your opinion about a view have?", "\U0001F522", "two, both about the topic", ["none", "one about anything", "twenty"], "Two reasons, on the topic."),
                 q("Four people, one park. What did the lesson show?", "\U0001F3DE️", "people think different things about the same topic", ["one person is always right", "parks are confusing", "dogs are bad"], "Same facts, different views, each with reasons."),
             ]},
             "That is the whole lesson finished. You know that people think differently, and you can say what you think of their views."),
    ],
}


LESSON["about"] = [
    "Say that people can think different things about the same topic, each with reasons.",
    "Tell a fact from what somebody thinks.",
    "Find an author's viewpoint in a poster or a letter, and the reasons behind it.",
    "Give your opinion about somebody else's viewpoint, with two reasons.",
]

LESSON["lecture"] = [
    part("\U0001F3DE️", "One park, four views",
         "Should dogs run free in Riverside Park? Mr Bello the park keeper says leads, for the ducks. Mrs Adams the dog owner says free, for the dogs' health. Mr Khan says a fence. Leila the runner says leads on the path. Same park, four views."),
    part("⚖️", "Facts and views",
         "A fact is true for everybody: the park has a pond with ducks. A view is what one person thinks should happen: dogs should be on leads. Other people can think differently, and that is not the same as being wrong."),
    part("\U0001F4CB", "An author has a viewpoint",
         "A poster or a letter was written by somebody, and that somebody thinks something. Mr Bello's poster asks for leads and gives his reasons. Mrs Adams's letter asks for the big field and gives hers. Find the sentences that show it."),
    part("\U0001F4AD", "Your opinion about their view",
         "Now you. Do you agree with Mr Bello? Partly? Say so, and give two reasons that are about dogs in the park. Because the ducks need protecting. Because the flower beds get dug up. Not: because I like pizza."),
    part("\U0001F91D", "Thinking differently, fairly",
         "People will always think different things. Knowing who thinks what, seeing the viewpoint in what they write, and giving your own opinion with reasons is how a class talks about it fairly."),
]

LESSON["words"] = [
    word("viewpoint", "\U0001F4AD", "What a person thinks should happen about a topic.",
         ["Mr Bello's viewpoint is that dogs should be on leads.", "Find the author's viewpoint."]),
    word("author", "✍️", "The person who wrote a source.",
         ["The author of the poster is the park keeper.", "Who is the author?"]),
    word("fact", "✅", "Something that is true for everybody.",
         ["The park has a pond: a fact.", "Is it a fact or a view?"]),
    word("agree", "\U0001F44D", "To think the same as somebody.",
         ["I agree with Mr Khan.", "Do you agree?"]),
    word("disagree", "\U0001F44E", "To think differently from somebody.",
         ["I disagree with Mrs Adams, because the field is where children play.", "You can disagree and still be fair."]),
    word("reason", "\U0001F4A1", "The why behind an opinion.",
         ["Give two reasons.", "Her reason was the dogs' health."]),
]

LESSON["home"] = [
    home("Who thinks what at home?", "Everyone at home and a question with no right answer",
         ["Ask: should we have a pet? Or: should bedtime be later?",
          "Listen to everyone's view and their reason.",
          "Say who thinks what, without saying who is right."],
         "Did anybody change their view after hearing the others?"),
    home("Find the author's viewpoint", "A leaflet, an advert or a letter, and a grown-up",
         ["Work out who wrote it.",
          "Find the sentence that shows what they want you to think or do.",
          "Say their viewpoint in one sentence."],
         "Would a different author have written it differently?"),
    home("My opinion, two reasons", "A grown-up",
         ["Your grown-up says a view: children should not have sweets on school days.",
          "Say whether you agree, partly agree or disagree.",
          "Give two reasons that are about sweets and school days."],
         "Were both your reasons about the topic?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "how to bake bread", "the names of the planets"],
    "changed": [
        {"before": "If two people disagree, one of them must be wrong.", "after": "Two people can think differently and both have reasons."},
        {"before": "A poster just tells you facts.", "after": "A poster was written by somebody with a viewpoint."},
        {"before": "Saying I agree is enough.", "after": "An opinion about a view needs two reasons about the topic."},
    ],
}
