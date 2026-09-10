# -*- coding: utf-8 -*-
"""Lesson 1 - Ask Away.

0838 Stage 1 Research: 1Rq.01 ask basic questions about a given topic;
1Ri.01 talk about information on a given topic in sources provided. The
topic is pets and the animals we meet - a five-year-old has questions about
them already, and a vet's room and a park are pictures a child can read.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "ask-away",
    "title": "Ask Away",
    "blurb": "Find out what a question is, meet the six question words, build your own questions about pets, and read two pictures to find out what they tell us.",
    "steps": [
        step("demo", "Wanda wonders", "\U0001F914", "Wanda wonders", ["1Rq.01"],
             "Wanda wants to know things. Press <b>Next</b> and see what she does.",
             explain(
                 ["When you want to find something out, you ask a question."],
                 ["Wanda sees a rabbit.", "She wonders: what does it eat?", "She does not guess.", "She asks.",
                  "A question is how you find out."],
                 ["Children think you have to know things already.", "Nobody knows everything. Asking is how we all find out."],
                 ["Press Next and watch Wanda ask."]),
             {"frames": [
                 {"pic": "\U0001F467\U0001F3FE", "cap": "This is <b>Wanda</b>. Wanda wonders about everything.", "say": "This is Wanda. Wanda wonders about everything."},
                 {"pic": "\U0001F430", "cap": "Wanda sees a rabbit. She wants to know: <b>what does it eat?</b>", "say": "Wanda sees a rabbit. She wants to know: what does it eat?", "sound": "pop"},
                 {"pic": "\U0001F914", "cap": "She could guess. But a guess might be <b>wrong</b>.", "say": "She could guess. But a guess might be wrong.", "sound": "click"},
                 {"pic": "\U0001F5E3️", "cap": "So she <b>asks</b>: What does a rabbit eat?", "say": "So she asks. What does a rabbit eat?", "sound": "chatter"},
                 {"pic": "\U0001F955", "cap": "The vet says: <b>carrots, grass and leaves.</b> Now Wanda knows.", "say": "The vet says: carrots, grass and leaves. Now Wanda knows.", "sound": "ding"},
                 {"pic": "❓", "cap": "A <b>question</b> is how you find out. Ask away!", "say": "A question is how you find out. Ask away!", "sound": "tada"},
             ]},
             "A question is how you find out. Wanda asked, and now she knows."),

        step("explore", "The six question words", "❓", "Question words", ["1Rq.01"],
             "Every question starts with a question word. Tap each one to hear what it asks for.",
             explain(
                 ["There are six question words.", "Each one asks for a different kind of answer."],
                 ["What asks for a thing.", "Where asks for a place.", "Who asks for a person.",
                  "When asks for a time.", "Why asks for a reason.", "How asks for the way something is done."],
                 ["Children mix up Where and When.", "Where is a place. When is a time."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "\U0001F4E6", "label": "What", "say": "What asks for a thing. What does a rabbit eat? Carrots."},
                 {"pic": "\U0001F4CD", "label": "Where", "say": "Where asks for a place. Where does the cat sleep? On the sofa."},
                 {"pic": "\U0001F9D1", "label": "Who", "say": "Who asks for a person. Who feeds the fish? Grandpa."},
                 {"pic": "\U0001F552", "label": "When", "say": "When asks for a time. When do we walk the dog? After school."},
                 {"pic": "\U0001F4AD", "label": "Why", "say": "Why asks for a reason. Why does the dog bark? Because someone is at the door."},
                 {"pic": "\U0001F527", "label": "How", "say": "How asks for the way something is done. How do you wash a dog? With warm water and a brush."},
             ], "need": 6,
              "then": {"ask": "Which question word asks about a PLACE?",
                       "opts": [opt("Where", True), opt("When", False), opt("Who", False)],
                       "why": "Where asks for a place. Where does the cat sleep? On the sofa."}},
             "What, Where, Who, When, Why, How. Six words for six kinds of finding out."),

        step("askq", "Build a question about pets", "\U0001F43E", "Question builder", ["1Rq.01"],
             "You want to find something out. Build the question that would find it out, then press <b>Ask it</b>.",
             explain(
                 ["A question is made of a question word and the rest of the question."],
                 ["You want to know what a rabbit eats.", "Pick What.", "Pick: do rabbits eat?", "What do rabbits eat? That question finds it out."],
                 ["Children pick a question they LIKE instead of the one they need.", "Read the card: it says what you want to know."],
                 ["Read the card, pick the word, pick the ending, press Ask it."]),
             {"topic": "pets", "words": ["What", "Where", "Who", "When", "Why", "How"],
              "ends": [
                  {"id": "eat", "t": "do rabbits eat?", "words": ["What"], "asks": "what rabbits eat"},
                  {"id": "sleep", "t": "does the cat sleep?", "words": ["Where", "When"], "asks": "the cat's sleeping"},
                  {"id": "look", "t": "looks after the dog?", "words": ["Who"], "asks": "who looks after the dog"},
                  {"id": "bark", "t": "does the dog bark?", "words": ["Why", "When"], "asks": "the dog barking"},
                  {"id": "wash", "t": "do you wash a dog?", "words": ["How", "When"], "asks": "washing a dog"},
                  {"id": "feed", "t": "do we feed the fish?", "words": ["When", "How", "What"], "asks": "feeding the fish"},
              ],
              "rounds": [
                  {"want": "what a rabbit eats", "pic": "\U0001F430", "word": "What", "end": "eat", "why": "What asks for a thing: the food."},
                  {"want": "the place where the cat sleeps", "pic": "\U0001F431", "word": "Where", "end": "sleep", "why": "Where asks for a place."},
                  {"want": "which person looks after the dog", "pic": "\U0001F436", "word": "Who", "end": "look", "why": "Who asks for a person."},
                  {"want": "the reason the dog barks", "pic": "\U0001F415", "word": "Why", "end": "bark", "why": "Why asks for a reason."},
                  {"want": "the way to wash a dog", "pic": "\U0001F6C1", "word": "How", "end": "wash", "why": "How asks for the way it is done."},
                  {"want": "the time we feed the fish", "pic": "\U0001F41F", "word": "When", "end": "feed", "why": "When asks for a time."},
              ]},
             "You built six questions about pets, each one for the thing you wanted to know."),

        step("sort", "Question or telling?", "\U0001F5E3️", "Question spotter", ["1Rq.01"],
             "Some of these ask. Some of these tell. Which is it?",
             explain(
                 ["A question ASKS for something you do not know.", "Telling gives something you already know."],
                 ["What does a rabbit eat? That asks. It is a question.", "My cat is black. That tells. It is not a question.",
                  "A question usually starts with a question word and ends with a question mark."],
                 ["Children think anything about a pet is a question.", "Listen for the asking."],
                 ["Read it, listen for the asking, tap the bin."]),
             {"ask": "Is it a question, or is it telling?",
              "bins": [{"id": "q", "label": "A question", "pic": "❓"}, {"id": "t", "label": "Telling", "pic": "\U0001F4AC"}],
              "items": [
                  {"pic": "\U0001F430", "label": "What does a rabbit eat?", "bin": "q", "why": "It asks for a thing. That is a question."},
                  {"pic": "\U0001F408", "label": "My cat is black.", "bin": "t", "why": "It tells you something. Nobody is asking."},
                  {"pic": "\U0001F426", "label": "Where do birds sleep?", "bin": "q", "why": "It asks for a place. A question."},
                  {"pic": "\U0001F415", "label": "I have a dog.", "bin": "t", "why": "It tells you. Not a question."},
                  {"pic": "\U0001F41F", "label": "Who feeds the fish?", "bin": "q", "why": "It asks for a person. A question."},
                  {"pic": "\U0001F4A7", "label": "Fish live in water.", "bin": "t", "why": "It tells a fact. Not a question."},
              ]},
             "A question asks. Telling tells. You can hear the difference."),

        step("source", "Read the picture: at the vet", "\U0001F3E5", "Picture reader", ["1Ri.01"],
             "A picture can tell you things. Tap the things in it to find out what they tell us.",
             explain(
                 ["A picture is a source.", "A source is something you can find information in."],
                 ["This is the vet's room.", "Tap the dog.", "Tap the cat.", "Every thing you tap tells you something about what happens here."],
                 ["Children look at a picture and say only what colour it is.", "Look at what is HAPPENING in it."],
                 ["Tap five things and listen to what each one tells you."]),
             {"scene": "vet", "need": 5,
              "spots": [
                  spot("dog", "the dog on the table", "The vet is checking the dog's ears.", 160, 118, "\U0001F415"),
                  spot("cat", "the cat in the basket", "A cat is waiting for its turn.", 60, 160, "\U0001F431"),
                  spot("scales", "the scales", "The vet weighs every animal to see if it is growing well.", 260, 160, "⚖️"),
                  spot("medicine", "the medicine shelf", "Medicine helps a poorly pet get better.", 225, 62, "\U0001F48A"),
                  spot("vet", "the vet", "The vet is a doctor for animals.", 110, 70, "\U0001F469\U0001F3FE‍⚕️"),
              ],
              "then": {"ask": "What does this picture tell us?",
                       "opts": [{"t": "A vet is a doctor who helps animals get better", "spot": "vet"},
                                {"t": "This is a place to buy shoes"},
                                {"t": "Animals live here for ever"}],
                       "why": "The picture shows a vet checking a dog, medicine on the shelf and a cat waiting. A vet helps animals get better."}},
             "You read a picture and said what it tells us. That is using a source."),

        step("source", "Read the picture: at the park", "\U0001F333", "Park reader", ["1Ri.01"],
             "Another picture, another source. Tap the animals and the sign to find out about them.",
             explain(
                 ["A different picture tells you different things."],
                 ["This is the park.", "There are ducks on the pond.", "There is a dog on a lead.", "There is a sign, and a sign tells you something too."],
                 ["Children forget that words in a picture are information.", "Read the sign."],
                 ["Tap four things and listen."]),
             {"scene": "park", "need": 4, "caption": "Tap the animals and the sign.",
              "spots": [
                  spot("ducks", "the ducks", "Ducks live on the pond. They eat plants and seeds from the water.", 200, 200, "\U0001F986"),
                  spot("dog", "the dog on a lead", "Dogs in the park stay on a lead so they do not chase the ducks.", 120, 190, "\U0001F415"),
                  spot("nest", "the nest in the tree", "A bird made a nest in the tree to keep its eggs safe.", 47, 62, "\U0001FABA"),
                  spot("sign", "the sign", "The sign says: please do not feed the ducks bread. Bread is bad for them.", 230, 110, "\U0001FAA7"),
                  spot("squirrel", "the squirrel", "A squirrel is looking for nuts to hide for winter.", 267, 150, "\U0001F43F️"),
              ],
              "then": {"ask": "What does this picture tell us about the ducks?",
                       "opts": [{"t": "They live on the pond and should not be fed bread", "spot": "ducks"},
                                {"t": "They sleep in the tree"},
                                {"t": "They are on a lead"}],
                       "why": "The ducks are on the pond, and the sign says not to feed them bread. The picture told us both."}},
             "Two pictures read. A source can be a picture, and you can talk about what it tells you."),

        step("questions", "Ask the right question", "\U0001F4AC", "Question picker", ["1Rq.01", "1Ri.01"],
             "Which question would find it out? Tap the answer.",
             explain(
                 ["The question word decides what kind of answer you get."],
                 ["If you want a place, ask Where.", "If you want a person, ask Who.", "If you want a reason, ask Why."],
                 [],
                 ["Read what you want to know, then tap the question that asks for it."]),
             {"label": "Question", "items": [
                 q("You want to know the PLACE the hamster sleeps. Which question?", "\U0001F439", "Where does the hamster sleep?", ["Why does the hamster sleep?", "What is a hamster?"], "A place needs Where."),
                 q("You want to know the PERSON who walks the dog. Which question?", "\U0001F415", "Who walks the dog?", ["When is the dog?", "How is a dog?"], "A person needs Who."),
                 q("You want to know the REASON the cat hides. Which question?", "\U0001F408", "Why does the cat hide?", ["Where is a cat?", "What colour is the cat?"], "A reason needs Why."),
                 q("A picture shows a vet holding a rabbit. What does it tell us?", "\U0001F430", "The vet is looking after the rabbit", ["Rabbits can fly", "The vet is asleep"], "Look at what is happening: the vet is holding the rabbit to look after it."),
             ]},
             "You picked the question that finds it out, every time."),

        step("quiz", "Show what you know", "⭐", "Star asker", ["1Rq.01", "1Ri.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about Wanda, the six question words, the vet and the park."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a question for?", "❓", "finding something out", ["telling a story", "going to sleep", "eating lunch"], "A question is how you find out something you do not know."),
                 q("Which word asks about a PERSON?", "\U0001F9D1", "Who", ["Where", "When", "What"], "Who asks for a person. Who feeds the fish?"),
                 q("Which word asks about a TIME?", "\U0001F552", "When", ["Why", "How", "Who"], "When asks for a time. When do we walk the dog?"),
                 q("Which of these is a question?", "\U0001F5E3️", "Where do birds sleep?", ["Birds have wings.", "I like birds.", "A bird is small."], "It asks for a place. That is a question."),
                 q("What is a source?", "\U0001F4D6", "something you can find information in", ["a kind of sauce", "a pet", "a question word"], "A picture, a book or a person can be a source of information."),
                 q("The vet picture showed medicine on a shelf. What did that tell us?", "\U0001F48A", "medicine helps poorly pets get better", ["the vet sells sweets", "pets do not get ill"], "Medicine on the shelf tells us the vet helps poorly animals."),
                 q("The park sign said: do not feed the ducks bread. Why?", "\U0001FAA7", "bread is bad for ducks", ["ducks do not like the park", "bread is for dogs"], "The sign told us bread is bad for them."),
                 q("Wanda wants to know how to brush a dog. Which question?", "\U0001F415", "How do you brush a dog?", ["Who is a dog?", "Where is a brush?"], "The way something is done needs How."),
             ]},
             "That is the whole lesson finished. You can ask away, and read a picture too."),
    ],
}


LESSON["about"] = [
    "Say what a question is for: finding something out.",
    "Use the six question words: What, Where, Who, When, Why and How.",
    "Build a question about a topic to find out the thing you want to know.",
    "Read a picture and talk about what it tells us.",
]

LESSON["lecture"] = [
    part("\U0001F914", "Wanda wonders",
         "Wanda sees a rabbit and wants to know what it eats. She could guess, but a guess might be wrong. So she asks. A question is how you find out."),
    part("❓", "Six question words",
         "What asks for a thing. Where asks for a place. Who asks for a person. When asks for a time. Why asks for a reason. How asks for the way something is done."),
    part("\U0001F43E", "Building a question",
         "A question is a question word and the rest. What, plus do rabbits eat, makes: What do rabbits eat? Pick the word that asks for the thing you want to know."),
    part("\U0001F4D6", "A picture is a source",
         "A source is something you can find information in. A picture is a source. Look at what is happening in it, and read any words, and it will tell you things."),
    part("\U0001F5E3️", "Ask away",
         "Nobody knows everything. Asking is how everybody finds out. So when you wonder something, ask away."),
]

LESSON["words"] = [
    word("question", "❓", "Words that ask for something you do not know.",
         ["What does a rabbit eat? That is a question.", "Wanda asked a question."]),
    word("answer", "\U0001F4A1", "What you find out when a question is asked.",
         ["The answer was carrots.", "The vet gave Wanda an answer."]),
    word("find out", "\U0001F50D", "To learn something you did not know.",
         ["Wanda wanted to find out.", "We find out by asking."]),
    word("source", "\U0001F4D6", "Something you can find information in, like a picture, a book or a person.",
         ["A picture is a source.", "The vet was a source too."]),
    word("information", "\U0001F4CB", "The things a source tells you.",
         ["The picture gave us information.", "Information is facts."]),
    word("topic", "\U0001F3AF", "The thing you are finding out about.",
         ["Our topic is pets.", "Ask a question about the topic."]),
]

LESSON["home"] = [
    home("Three questions", "A grown-up who has a pet, or a favourite animal",
         ["Ask your grown-up three questions about their pet or favourite animal.",
          "Use a different question word each time: What, Where, Who, When, Why or How.",
          "Listen to each answer and say it back."],
         "Did each question word get a different kind of answer?"),
    home("Question walk", "A grown-up and a walk outside",
         ["On a walk, point at something and ask a question about it.",
          "Your grown-up asks one back.",
          "Count how many questions you asked together."],
         "Which question word did you use most?"),
    home("Read a picture together", "A picture book with a busy picture in it",
         ["Open a page with lots happening.",
          "Take turns to tap a thing in the picture and say what it tells you.",
          "Find something you did not notice the first time."],
         "What did the picture tell you that the words did not?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to ride a bike"],
}
