# -*- coding: utf-8 -*-
"""Lesson 7 - Talk It Through.

0838 Stage 2 Communication: 2Ml.01 listen to others in class discussions
and respond with simple and relevant questions; 2Mi.01 talk about a given
topic, giving relevant information. Research: 2Rq.01 ask focused questions
about a given topic. The topic is moving to a new place and a new pupil
joining our class - a child listens to classmates who have moved, asks
them a relevant question, and gives a talk about our school so a new pupil
would know what to expect.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

AMAL = {"name": "Amal", "pic": "\U0001F467\U0001F3FE"}
SAMI = {"name": "Sami", "pic": "\U0001F466\U0001F3FE"}
NORA = {"name": "Nora", "pic": "\U0001F467\U0001F3FD"}
OMAR = {"name": "Omar", "pic": "\U0001F466\U0001F3FD"}
HANA = {"name": "Hana", "pic": "\U0001F467\U0001F3FF"}
TARIQ = {"name": "Tariq", "pic": "\U0001F466\U0001F3FF"}
LEO = {"name": "Leo, the new pupil", "pic": "\U0001F466\U0001F3FC"}

LESSON = {
    "slug": "talk-it-through",
    "title": "Talk It Through",
    "blurb": "Listen to classmates who have moved to a new place and ask each one a relevant question, give a talk about our school for a new pupil, ask Leo focused questions, and answer his.",
    "steps": [
        step("demo", "A new pupil", "\U0001F466\U0001F3FC", "New pupil", ["2Ml.01"],
             "Leo is joining our class from another town. Press <b>Next</b> and see how the class talks and listens.",
             explain(
                 ["When somebody new arrives, talking and listening is how you find out about them, and how they find out about you."],
                 ["Leo says he has moved from a town by the sea.", "A relevant question is about what he said: what was the sea like?",
                  "Not: do you like ice cream? He did not say anything about ice cream."],
                 ["Children ask the question they already had ready.", "Listen first, then ask about what was said."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "\U0001F466\U0001F3FC", "cap": "This is <b>Leo</b>. He has just moved here from a town by the sea.", "say": "This is Leo. He has just moved here from a town by the sea."},
                 {"pic": "\U0001F442", "cap": "The class <b>listens</b>: a town by the sea, a big move, a new school.", "say": "The class listens. A town by the sea. A big move. A new school.", "sound": "click"},
                 {"pic": "\U0001F467\U0001F3FE", "cap": "Amal asks: <b>what was the sea like?</b> Relevant: it is about what Leo said.", "say": "Amal asks: what was the sea like? That is relevant. It is about what Leo said.", "sound": "ding"},
                 {"pic": "\U0001F466\U0001F3FE", "cap": "Sami asks: <b>do you like ice cream?</b> Hmm. Leo did not say anything about ice cream.", "say": "Sami asks: do you like ice cream? Hmm. Leo did not say anything about ice cream. Not relevant.", "sound": "boing"},
                 {"pic": "\U0001F5E3️", "cap": "Then the class <b>tells Leo about our school</b>, so he knows what to expect.", "say": "Then the class tells Leo about our school, so he knows what to expect. Talking and listening, both ways.", "sound": "tada"},
             ]},
             "Listen, ask about what was said, and tell them about your topic."),

        step("listen", "Listen, then ask something relevant", "\U0001F442", "Relevant asker", ["2Ml.01"],
             "Three classmates have moved to a new place. Listen to each one, then ask a question about what they said.",
             explain(
                 ["A relevant question is about what the person SAID.", "It shows you listened, and it finds out more."],
                 ["Hana says her new flat is on the fifth floor.", "Relevant: can you see far from your window?", "Not relevant: what is your favourite colour?"],
                 ["Children pick a question they like the sound of.", "Pick the one about what was said."],
                 ["Press Listen, hear it all, then tap a question."]),
             {"rounds": [
                 {"speaker": HANA, "talk": ["We moved to a new flat last month.", "It is on the fifth floor, right at the top.", "There is a lift, but I like to race my sister up the stairs."],
                  "topics": ["flat", "stairs", "floor"],
                  "opts": [tagged("Can you see far from your window on the fifth floor?", "floor"), tagged("What is your favourite colour?", "colours"), tagged("Do you have a dog?", "pets")],
                  "why": "Hana talked about living on the fifth floor, so a question about the view is about what she said.",
                  "reply": "Yes! I can see the whole park and the river."},
                 {"speaker": OMAR, "talk": ["My family moved here from a village in the hills.", "My old school had only twelve children in it.", "Here there are twelve children just in our row!"],
                  "topics": ["old school", "village", "hills"],
                  "opts": [tagged("What did you like best about your small school?", "old school"), tagged("Can you swim?", "swimming"), tagged("What is for lunch today?", "lunch")],
                  "why": "Omar talked about his tiny old school, so a question about it is about what he said.",
                  "reply": "Everybody knew everybody. Even the teacher's dog."},
                 {"speaker": LEO, "talk": ["I moved here from a town by the sea.", "Every Saturday we went to the beach, even when it rained.", "I miss the sound of the waves at night."],
                  "topics": ["sea", "beach", "waves"],
                  "opts": [tagged("What did you do at the beach when it rained?", "beach"), tagged("What is your teddy called?", "toys"), tagged("Do you like maths?", "maths")],
                  "why": "Leo talked about going to the beach even in the rain, so a question about that is about what he said.",
                  "reply": "We looked for crabs in the rock pools and ate mandazi under a tree."},
             ]},
             "You listened to three classmates and asked each one a relevant question."),

        step("know", "My talk about our school, for Leo", "\U0001F3EB", "School talker", ["2Mi.01"],
             "Leo does not know our school yet. Give him a talk about it: four things, all about our school.",
             explain(
                 ["A talk for somebody new tells them what they need to know about the topic.", "Everything in it is about the topic."],
                 ["Playtime is at half past ten. About our school.", "We have PE on Thursdays. About our school.",
                  "My cat is called Tiger. Leo does not need that to know our school."],
                 ["Children put in whatever they want to tell Leo.", "Leo asked about the school. Tell him about the school."],
                 ["Tap four things about our school, then press Give my talk."]),
             {"mode": "talk", "topic": "our school", "tag": "school", "topicPic": "\U0001F3EB", "need": 4,
              "cards": [
                  dict(tagged("Playtime is at half past ten", "school", "\U0001F552"), say="Playtime is at half past ten"),
                  dict(tagged("We have PE on Thursdays, so bring your kit", "school", "\U0001F45F"), say="We have PE on Thursdays, so bring your kit"),
                  dict(tagged("Teacher Yasmin reads a story every afternoon", "school", "\U0001F4D6"), say="Teacher Yasmin reads a story every afternoon"),
                  dict(tagged("The library is next to the hall", "school", "\U0001F4DA"), say="The library is next to the hall"),
                  dict(tagged("We line up by the blue door after playtime", "school", "\U0001F6AA"), say="We line up by the blue door after playtime"),
                  dict(tagged("My cat is called Tiger", "pets", "\U0001F431"), say="My cat is called Tiger", aboutLabel="pets"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
                  dict(tagged("I had toast for breakfast", "breakfast", "\U0001F35E"), say="I had toast for breakfast", aboutLabel="breakfast"),
              ]},
             "You gave Leo a talk about our school, and everything in it was about our school."),

        step("askq", "Ask Leo a focused question", "❓", "Focused asker", ["2Rq.01", "2Ml.01"],
             "You want to find out about Leo's old town. Build a focused question, then press <b>Ask it</b>.",
             explain(
                 ["A focused question asks about the exact thing you want to know."],
                 ["You want to know the name of his old school. Who or what? What was your old school called?"],
                 [],
                 ["Read the card, pick the word, pick the ending, press Ask it."]),
             {"topic": "Leo's old town", "words": ["What", "Where", "Who", "When", "Why", "How"],
              "ends": [
                  {"id": "school", "t": "was your old school called?", "words": ["What"], "asks": "the name of his old school"},
                  {"id": "beach", "t": "was the beach in your old town?", "words": ["Where"], "asks": "where the beach was"},
                  {"id": "far", "t": "far was the beach from your house?", "words": ["How"], "asks": "how far away the beach was"},
                  {"id": "friend", "t": "was your best friend there?", "words": ["Who"], "asks": "his best friend"},
                  {"id": "move", "t": "did you move here?", "words": ["When", "Why", "How"], "asks": "the move"},
                  {"id": "miss", "t": "do you miss most?", "words": ["What", "Who", "Where"], "asks": "what he misses"},
              ],
              "rounds": [
                  {"want": "the name of Leo's old school", "pic": "\U0001F3EB", "word": "What", "end": "school", "why": "What asks for a name or a thing."},
                  {"want": "the place the beach was in his old town", "pic": "\U0001F3D6️", "word": "Where", "end": "beach", "why": "Where asks for a place."},
                  {"want": "the person who was his best friend", "pic": "\U0001F9D1", "word": "Who", "end": "friend", "why": "Who asks for a person."},
                  {"want": "the reason his family moved here", "pic": "\U0001F69A", "word": "Why", "end": "move", "why": "Why asks for a reason."},
                  {"want": "the thing he misses most", "pic": "\U0001F30A", "word": "What", "end": "miss", "why": "What asks for a thing."},
              ]},
             "Five focused questions for Leo, each about the exact thing you wanted to know."),

        step("answer", "Leo asks about our school", "\U0001F5E3️", "Good answerer", ["2Mi.01"],
             "Now Leo asks YOU about our school. Tap the answer that gives him the information he asked for.",
             explain(
                 ["A good answer gives the information that was asked for."],
                 ["Where do we line up? By the blue door. That answers it.", "I like the blue door: true, but not where we line up."],
                 [],
                 ["Read Leo's question, then tap the answer about it."]),
             {"asker": LEO,
              "rounds": [
                  {"ask": "Where do we line up after playtime?", "about": "lining up", "pic": "\U0001F6AA",
                   "opts": [tagged("By the blue door, in two lines.", "lining up"), tagged("I like the colour blue.", "colours"), tagged("Playtime is fun.", "playtime")],
                   "why": "Leo asked where you line up. The blue door is the answer."},
                  {"ask": "When is PE?", "about": "PE", "pic": "\U0001F45F",
                   "opts": [tagged("On Thursdays, after lunch.", "PE"), tagged("My trainers are red.", "shoes"), tagged("I can run fast.", "running")],
                   "why": "Leo asked when PE is. Thursdays after lunch answers it."},
                  {"ask": "What happens in the afternoon?", "about": "afternoons", "pic": "\U0001F4D6",
                   "opts": [tagged("Teacher Yasmin reads us a story.", "afternoons"), tagged("I had toast for breakfast.", "breakfast"), tagged("The library has big windows.", "library")],
                   "why": "Leo asked about the afternoon. The story is what happens then."},
                  {"ask": "Who do I ask if I get lost?", "about": "help", "pic": "\U0001F64B",
                   "opts": [tagged("Any teacher, or me. I will show you.", "help"), tagged("The hall is very big.", "the hall"), tagged("I have a blue bag.", "bags")],
                   "why": "Leo asked who to ask. A teacher, or you, is the answer."},
              ]},
             "Four questions from Leo, four answers that told him what he asked."),

        step("sort", "Relevant, or not?", "\U0001F442", "Relevance judge", ["2Ml.01"],
             "Leo said: I moved here from a town by the sea, and I miss the waves. Is this question relevant to what he said?",
             explain(
                 ["Relevant means about what the person said."],
                 ["What was the sea like? Relevant.", "Do you like ice cream? Not relevant. He did not mention it."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Is it about what Leo said?",
              "bins": [{"id": "rel", "label": "Relevant", "pic": "✅"}, {"id": "not", "label": "Not relevant", "pic": "\U0001F645"}],
              "items": [
                  {"pic": "\U0001F30A", "label": "What was the sea like?", "bin": "rel", "why": "Leo talked about the sea."},
                  {"pic": "\U0001F366", "label": "Do you like ice cream?", "bin": "not", "why": "Leo said nothing about ice cream."},
                  {"pic": "\U0001F3D6️", "label": "Did you go to the beach a lot?", "bin": "rel", "why": "The beach is part of a town by the sea."},
                  {"pic": "\U0001F3B8", "label": "Can you play the guitar?", "bin": "not", "why": "Leo did not mention music."},
                  {"pic": "\U0001F634", "label": "Why do you miss the waves at night?", "bin": "rel", "why": "Leo said he misses the waves at night."},
                  {"pic": "\U0001F431", "label": "What is your cat called?", "bin": "not", "why": "Leo did not mention a cat."},
              ]},
             "You can tell a relevant question from one that is not."),

        step("questions", "Talking and listening", "\U0001F4AC", "Talk judge", ["2Mi.01", "2Ml.01", "2Rq.01"],
             "Think about Leo, the talks and the questions. Tap the answer.",
             explain(
                 ["Listen, then ask about what was said. Talk about the topic. Answer what was asked."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Hana said her flat is on the fifth floor. Which question is relevant?", "\U0001F3E2", "Can you see far from your window?", ["What is your favourite colour?", "Do you have a dog?"], "The fifth floor is what she talked about."),
                 q("Which sentence belongs in a talk about our school for Leo?", "\U0001F3EB", "We have PE on Thursdays.", ["My cat is called Tiger.", "Lions live in Africa."], "Leo needs to know about the school."),
                 q("Leo asks where we line up. Which answer tells him?", "\U0001F6AA", "By the blue door.", ["I like blue.", "Playtime is fun."], "He asked WHERE."),
                 q("You want to know WHY Leo's family moved. Which word?", "❓", "Why", ["Where", "Who"], "Why asks for a reason."),
             ]},
             "You listen, ask, talk and answer, all on the topic."),

        step("quiz", "Show what you know", "⭐", "Star communicator", ["2Mi.01", "2Ml.01", "2Rq.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What makes a question RELEVANT?", "\U0001F442", "it is about what the person said", ["it is long", "it is funny", "it starts with Why"], "Relevant means about what was said."),
                 q("Omar said his old school had twelve children. Which question is relevant?", "\U0001F3EB", "What did you like best about your small school?", ["Can you swim?", "What is for lunch?", "Do you like blue?"], "His small school is what he talked about."),
                 q("Sami asked Leo if he likes ice cream. Why was that not relevant?", "\U0001F366", "Leo had not said anything about ice cream", ["ice cream is bad", "Sami was rude", "it was too short"], "Nothing Leo said was about ice cream."),
                 q("A talk about our school for Leo should include…", "\U0001F5E3️", "when playtime is and where we line up", ["your cat's name", "what you had for breakfast", "lions in Africa"], "Things about the school."),
                 q("Leo asks when PE is. Which answer?", "\U0001F45F", "On Thursdays, after lunch.", ["My trainers are red.", "I can run fast.", "PE is fun."], "He asked WHEN."),
                 q("You want to know the NAME of Leo's old school. Which question word?", "❓", "What", ["Where", "Why", "How"], "What asks for a name or a thing."),
                 q("Leo misses the sound of the waves. Which question is about that?", "\U0001F30A", "Why do you miss the waves at night?", ["What is your cat called?", "Can you play the guitar?", "Do you like maths?"], "The waves are what he talked about."),
                 q("Talking and listening go…", "\U0001F91D", "both ways: you listen, then you tell", ["one way only", "nowhere", "only in the hall"], "The class listened to Leo, then told him about the school."),
             ]},
             "That is the whole lesson finished. You listen, ask relevant questions, and talk about a topic."),
    ],
}


LESSON["about"] = [
    "Listen to a classmate and ask a question that is relevant to what they said.",
    "Give a talk about a topic where everything you say is about it.",
    "Build a focused question to find out about somebody.",
    "Answer a question with the information that was asked for.",
]

LESSON["lecture"] = [
    part("\U0001F466\U0001F3FC", "Leo arrives",
         "Leo has just moved here from a town by the sea. He is new, and he does not know our school. Talking and listening is how the class finds out about Leo, and how Leo finds out about us."),
    part("\U0001F442", "A relevant question",
         "Listen first. Leo said he moved from a town by the sea. A relevant question is about what he said: what was the sea like? Not: do you like ice cream? He did not mention ice cream."),
    part("\U0001F3EB", "A talk for Leo",
         "Leo needs to know about our school. A talk for him says things about the school: playtime is at half past ten, PE is on Thursdays, we line up by the blue door. Not your cat's name."),
    part("❓", "Focused questions for Leo",
         "To find out about Leo's old town, ask focused questions. What was your old school called? Where was the beach in your old town? Why did you move here?"),
    part("\U0001F5E3️", "Answer what he asks",
         "And when Leo asks you, answer what he asked. Where do we line up? By the blue door. When is PE? Thursdays. Both ways: listen and ask, tell and answer."),
]

LESSON["words"] = [
    word("relevant", "✅", "About what was said, or about the topic.",
         ["Ask a relevant question.", "That answer was relevant."]),
    word("listen", "\U0001F442", "To look at somebody, stay quiet, and take in what they say.",
         ["Listen to Leo first.", "The class listened."]),
    word("respond", "\U0001F4AC", "To say something back after listening.",
         ["Respond with a relevant question.", "Amal responded by asking about the sea."]),
    word("focused", "\U0001F3AF", "About the exact thing you want to find out.",
         ["A focused question for Leo.", "Stay focused on what you want to know."]),
    word("talk", "\U0001F5E3️", "Telling people about a topic in a few sentences.",
         ["Give Leo a talk about our school.", "My talk had four sentences."]),
    word("new", "\U0001F195", "Just arrived; not known yet.",
         ["Leo is the new pupil.", "Everything at school is new to him."]),
]

LESSON["home"] = [
    home("Listen and ask", "A grown-up and three sentences",
         ["Your grown-up talks for three sentences about a place they used to live.",
          "Ask one question that is about what they said.",
          "Then ask one that is NOT, and laugh about it."],
         "Could you tell the difference straight away?"),
    home("A talk for somebody new", "A grown-up to be the new person",
         ["Pretend your grown-up is new to your street.",
          "Give them a talk about the street: four things they need to know.",
          "They put a hand up if a sentence is not about the street."],
         "What did the new person most need to know?"),
    home("Focused questions", "A grown-up who has been somewhere you have not",
         ["Find out where they went.",
          "Ask five focused questions about it, with five different question words.",
          "Tell somebody else three things you found out."],
         "Which question found out the most?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "how to ride a bike", "the names of the planets"],
}
