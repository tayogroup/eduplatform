# -*- coding: utf-8 -*-
"""Lesson 7 - Talk and Listen.

0838 Stage 1 Communication: 1Ml.01 listen to others in class discussions and
respond with simple questions; 1Mi.01 answer questions with relevant
information about a given topic. Research: 1Rq.01 ask basic questions about
a given topic, because the response to a classmate is a question, and a
question is built. The topic is my family, which every child can talk about
and every child has questions about.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

AMAL = {"name": "Amal", "pic": "\U0001F467\U0001F3FE"}
SAMI = {"name": "Sami", "pic": "\U0001F466\U0001F3FE"}
NORA = {"name": "Nora", "pic": "\U0001F467\U0001F3FD"}
OMAR = {"name": "Omar", "pic": "\U0001F466\U0001F3FD"}
HANA = {"name": "Hana", "pic": "\U0001F467\U0001F3FF"}
TARIQ = {"name": "Tariq", "pic": "\U0001F466\U0001F3FF"}
YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}

LESSON = {
    "slug": "talk-and-listen",
    "title": "Talk and Listen",
    "blurb": "Listen to three classmates talk about their families, ask each one a question about what they said, answer questions about your own family with the information that was asked for, and build questions of your own.",
    "steps": [
        step("demo", "Ears and mouths", "\U0001F442", "Ears and mouths", ["1Ml.01"],
             "Talking is one half. Listening is the other. Press <b>Next</b>.",
             explain(
                 ["When somebody talks, you listen.", "Listening means looking, staying quiet, and remembering what they said."],
                 ["Amal talks about her family.", "Sami looks at her, stays still, and listens.",
                  "Then he asks a question about what she SAID. That shows he was listening."],
                 ["Children think listening is just being quiet.", "It is also remembering. Then you can ask about it."],
                 ["Press Next and watch Sami listen."]),
             {"frames": [
                 {"pic": "\U0001F467\U0001F3FE", "cap": "Amal is telling the class about her <b>family</b>.", "say": "Amal is telling the class about her family."},
                 {"pic": "\U0001F440", "cap": "Sami <b>looks</b> at Amal. He sits still.", "say": "Sami looks at Amal. He sits still.", "sound": "click"},
                 {"pic": "\U0001F442", "cap": "He <b>listens</b>: four people, a baby brother called Yusuf.", "say": "He listens. Four people. A baby brother called Yusuf.", "sound": "pop"},
                 {"pic": "❓", "cap": "Then he asks: <b>what does Yusuf like to play with?</b>", "say": "Then he asks: what does Yusuf like to play with? A question about what Amal said.", "sound": "chatter"},
                 {"pic": "\U0001F60A", "cap": "Amal smiles. She knows Sami was <b>listening</b>.", "say": "Amal smiles. She knows Sami was listening.", "sound": "tada"},
             ]},
             "Look, stay still, remember, then ask about it. That is listening."),

        step("listen", "Listen, then ask", "\U0001F442", "Good listener", ["1Ml.01"],
             "A classmate is going to talk about their family. Listen, then ask them a question about what they said.",
             explain(
                 ["A good question after listening is about what the person SAID."],
                 ["Amal says she has a baby brother.", "A good question: what does your brother like to play with?",
                  "A question about your favourite colour is not about what she said."],
                 ["Children ask the question they already had in their head.", "Listen first. Then ask about THAT."],
                 ["Press Listen, hear it all, then tap a question."]),
             {"rounds": [
                 {"speaker": AMAL, "talk": ["My family has four people: my mum, my dad, my baby brother and me.", "My baby brother is called Yusuf.", "He is one year old, and he laughs when I make faces."],
                  "topics": ["brother", "family"],
                  "opts": [tagged("What does Yusuf like to play with?", "brother"), tagged("What is your favourite colour?", "colours"), tagged("Do you have a cat?", "pets")],
                  "why": "Amal talked about her baby brother, so a question about Yusuf is about what she said.",
                  "reply": "He likes his red ball best!"},
                 {"speaker": SAMI, "talk": ["I live with my grandma.", "She cooks the best rice in the world.", "At the weekend we go to the market together to buy vegetables."],
                  "topics": ["grandma", "market", "rice"],
                  "opts": [tagged("What do you buy at the market?", "market"), tagged("Which school do you go to?", "school"), tagged("Can you swim?", "swimming")],
                  "why": "Sami talked about going to the market with his grandma, so asking about the market is about what he said.",
                  "reply": "Tomatoes, onions and a big bag of rice."},
                 {"speaker": HANA, "talk": ["My big sister is eight.", "She helps me with my reading every night.", "We share a bedroom, and she lets me have the top bunk."],
                  "topics": ["sister", "reading", "bedroom"],
                  "opts": [tagged("What book is your sister reading with you?", "reading"), tagged("What is your cat called?", "pets"), tagged("Do you like the rain?", "weather")],
                  "why": "Hana talked about reading with her sister, so a question about the book is about what she said.",
                  "reply": "A book about a dragon who cannot fly."},
             ]},
             "You listened to three classmates and asked each one about what they said."),

        step("answer", "Tell them what they asked", "\U0001F5E3️", "Good answerer", ["1Mi.01"],
             "Now it is Omar's turn to talk. His classmates ask about his family. Tap the answer Omar should give: the one that tells them what they asked.",
             explain(
                 ["A good answer gives the information that was asked for."],
                 ["Nora asks Omar: who lives in your house? My mum, my dad and my brother. That answers it.",
                  "My house has a red door. That is about the house, not the people in it."],
                 ["Children answer with the first true thing they think of.", "Listen to the question. Answer THAT."],
                 ["Read the question, then tap the answer that is about it."]),
             {"rounds": [
                 {"asker": NORA, "ask": "Omar, who lives in your house?", "about": "family", "pic": "\U0001F3E0",
                  "opts": [tagged("My mum, my dad and my brother live in my house.", "family"), tagged("My house has a red door.", "the house"), tagged("I like ice cream.", "food")],
                  "why": "Nora asked WHO lives there. The people are the answer."},
                 {"asker": AMAL, "ask": "Omar, what does your family do at the weekend?", "about": "the weekend", "pic": "\U0001F3DE️",
                  "opts": [tagged("We go to the park and have a picnic.", "the weekend"), tagged("My dad is very tall.", "dad"), tagged("I have a blue school bag.", "bags")],
                  "why": "Amal asked about the weekend. The park and the picnic is what Omar's family does at the weekend."},
                 {"asker": TARIQ, "ask": "Omar, what is your grandma like?", "about": "grandma", "pic": "\U0001F475\U0001F3FE",
                  "opts": [tagged("She is kind and she tells funny stories.", "grandma"), tagged("It is sunny today.", "the weather"), tagged("I can count to twenty.", "counting")],
                  "why": "Tariq asked about Omar's grandma. Kind and funny is about her."},
                 {"asker": YASMIN, "ask": "Omar, who helps you at home?", "about": "helpers", "pic": "\U0001F64B",
                  "opts": [tagged("My brother helps me with my reading.", "helpers"), tagged("My favourite colour is green.", "colours"), tagged("We have a goldfish.", "pets")],
                  "why": "Teacher Yasmin asked who helps Omar. His brother helping with reading is the answer."},
             ]},
             "Four questions about Omar's family, four answers that told them what they asked."),

        step("askq", "Ask about a family", "❓", "Family asker", ["1Rq.01", "1Ml.01"],
             "You want to find out about a classmate's family. Build the question, then press <b>Ask it</b>.",
             explain(
                 ["To find out about somebody, you ask them a question.", "A question word, and the rest."],
                 ["You want to know who lives in Omar's house.", "Who, plus lives in your house? Who lives in your house?"],
                 ["Children pick the question they like instead of the one they need.", "Read the card first."],
                 ["Read the card, pick the word, pick the ending, press Ask it."]),
             {"topic": "families", "words": ["What", "Where", "Who", "When", "Why", "How"],
              "ends": [
                  {"id": "lives", "t": "lives in your house?", "words": ["Who", "What"], "asks": "who or what lives in the house"},
                  {"id": "sunday", "t": "does your family do at the weekend?", "words": ["What"], "asks": "what the family does"},
                  {"id": "grandma", "t": "does your grandma live?", "words": ["Where"], "asks": "the place grandma lives"},
                  {"id": "cousins", "t": "do you visit your cousins?", "words": ["When", "Why", "How", "Where"], "asks": "visiting the cousins"},
                  {"id": "help", "t": "do you help at home?", "words": ["How", "When", "Why", "Who"], "asks": "helping at home"},
              ],
              "rounds": [
                  {"want": "which people live in Omar's house", "pic": "\U0001F3E0", "word": "Who", "end": "lives", "why": "Who asks for people."},
                  {"want": "what Nora's family does at the weekend", "pic": "\U0001F4C5", "word": "What", "end": "sunday", "why": "What asks for a thing they do."},
                  {"want": "the place Tariq's grandma lives", "pic": "\U0001F4CD", "word": "Where", "end": "grandma", "why": "Where asks for a place."},
                  {"want": "the time Hana visits her cousins", "pic": "\U0001F552", "word": "When", "end": "cousins", "why": "When asks for a time."},
                  {"want": "the way Sami helps at home", "pic": "\U0001F9F9", "word": "How", "end": "help", "why": "How asks for the way it is done."},
              ]},
             "Five questions about families, built by you."),

        step("sort", "Good listening?", "\U0001F442", "Listening judge", ["1Ml.01"],
             "Is this good listening, or not?",
             explain(
                 ["Good listening is looking, staying still, waiting your turn, and asking about what was said."],
                 ["Looking at the person: good listening.", "Talking over them: not listening."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Good listening, or not?",
              "bins": [{"id": "good", "label": "Good listening", "pic": "\U0001F442"}, {"id": "bad", "label": "Not listening", "pic": "\U0001F649"}],
              "items": [
                  {"pic": "\U0001F440", "label": "looking at the person talking", "bin": "good", "why": "Looking shows you are listening."},
                  {"pic": "\U0001FA91", "label": "sitting still", "bin": "good", "why": "Sitting still helps you hear."},
                  {"pic": "\U0001F5E3️", "label": "talking over them", "bin": "bad", "why": "If you talk, you cannot hear them."},
                  {"pic": "\U0001F6B6", "label": "walking away", "bin": "bad", "why": "You cannot listen from another room."},
                  {"pic": "✋", "label": "waiting for your turn", "bin": "good", "why": "Waiting means they get to finish."},
                  {"pic": "❓", "label": "asking a question about what they said", "bin": "good", "why": "A question about it proves you listened."},
              ]},
             "You know what good listening looks like."),

        step("questions", "Talking and listening", "\U0001F4AC", "Talk judge", ["1Mi.01", "1Ml.01"],
             "Think about listening and answering. Tap the answer.",
             explain(
                 ["Listen, then ask about what was said.", "Answer with what was asked for."],
                 ["Think about Amal's brother, Sami's grandma and Hana's sister."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Amal said she has a baby brother called Yusuf. Which question is about what she said?", "\U0001F476", "What does Yusuf like to play with?", ["What is your favourite colour?", "Do you have a cat?"], "Yusuf is what she talked about."),
                 q("Nora asks Omar: who lives in your house? Which answer tells her?", "\U0001F3E0", "My mum, my dad and my brother.", ["My house has a red door.", "I like ice cream."], "She asked WHO. The people are the answer."),
                 q("Which of these is good listening?", "\U0001F442", "looking at the person and sitting still", ["talking over them", "walking away"], "Looking and staying still help you hear and remember."),
                 q("How do you show somebody you were listening?", "❓", "ask a question about what they said", ["ask about something else", "say nothing and leave"], "A question about it proves you listened."),
             ]},
             "You know how to listen, and how to answer."),

        step("quiz", "Show what you know", "⭐", "Star listener", ["1Mi.01", "1Ml.01", "1Rq.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the three talks, the four questions and the question builder."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does listening mean?", "\U0001F442", "looking, staying still and remembering what was said", ["talking loudly", "walking about", "closing your eyes"], "Listening is looking, staying still and remembering."),
                 q("Sami said he goes to the market with his grandma. Which question is about what he said?", "\U0001F9FA", "What do you buy at the market?", ["Can you swim?", "Which school do you go to?", "Do you like rain?"], "The market is what he talked about."),
                 q("Hana said her sister reads with her. Which question is about that?", "\U0001F4D6", "What book is your sister reading with you?", ["What is your cat called?", "Do you like the rain?", "How old are you?"], "Reading with her sister is what she said."),
                 q("Amal asks Omar what his family does at the weekend. Which answer?", "\U0001F3DE️", "We go to the park and have a picnic.", ["My dad is tall.", "I have a blue bag.", "It is sunny."], "She asked about the weekend."),
                 q("Which word asks about the PLACE grandma lives?", "\U0001F4CD", "Where", ["Who", "What", "Why"], "Where asks for a place."),
                 q("Which is NOT listening?", "\U0001F649", "talking over the person", ["looking at them", "waiting your turn", "asking about what they said"], "You cannot hear while you talk."),
                 q("Teacher Yasmin asks Omar who helps him at home. Which answer?", "\U0001F64B", "My brother helps me read.", ["My favourite colour is green.", "We have a goldfish.", "I am five."], "She asked WHO helps."),
                 q("Why did Amal smile when Sami asked about Yusuf?", "\U0001F60A", "because she knew he had been listening", ["because she was tired", "because it was home time"], "A question about what she said proved he listened."),
             ]},
             "That is the whole lesson finished. You can listen, ask, and answer what was asked."),
    ],
}


LESSON["about"] = [
    "Listen to a classmate: look, stay still, and remember what they said.",
    "Ask a classmate a simple question about what they said.",
    "Answer a question about a family with the information that was asked for.",
    "Build a question to find out about somebody's family.",
]

LESSON["lecture"] = [
    part("\U0001F442", "Listening",
         "When somebody talks, you listen. Listening is looking at them, staying still, and remembering what they said. Sami looked at Amal, sat still, and remembered: four people, a baby brother called Yusuf."),
    part("❓", "Ask about what they said",
         "After listening, you can ask a question. A good question is about what the person said. Amal talked about her brother, so Sami asked what Yusuf likes to play with. That shows he listened."),
    part("\U0001F5E3️", "Answer what was asked",
         "When it is your turn to talk, answer what was asked. Nora asked Omar who lives in his house. My mum, my dad and my brother, he said. Not: my house has a red door. That is true, but it is not who."),
    part("\U0001F3E0", "Families",
         "Every family is different. Amal has a baby brother. Sami lives with his grandma. Hana shares a bedroom with her big sister. Talking and listening is how we find out about each other."),
    part("\U0001F60A", "Both halves",
         "Talking is one half and listening is the other. A good talker listens, and a good listener asks. Do both, and the class finds out a lot."),
]

LESSON["words"] = [
    word("listen", "\U0001F442", "To look at somebody, stay still, and take in what they say.",
         ["Listen to Amal.", "Sami listened and remembered."]),
    word("respond", "\U0001F4AC", "To say something back after listening.",
         ["Respond with a question.", "Sami responded by asking about Yusuf."]),
    word("question", "❓", "Words that ask for something you want to know.",
         ["Ask a question about what she said.", "Who lives in your house? is a question."]),
    word("answer", "\U0001F5E3️", "What you say back to a question.",
         ["Give an answer about your family.", "Omar's answer was about the people in his house."]),
    word("family", "\U0001F46A", "The people you live with and belong to.",
         ["Amal's family has four people.", "Tell us about your family."]),
    word("remember", "\U0001F9E0", "To keep something in your head after you heard or saw it.",
         ["Remember what Hana said.", "Sami remembered the baby's name."]),
]

LESSON["home"] = [
    home("Listen and ask", "A grown-up and a quiet minute",
         ["Your grown-up talks for three sentences about their day.",
          "Look at them and stay still while they talk.",
          "Then ask them one question about what they said, not about something else."],
         "Could you remember what they said without asking again?"),
    home("Family questions", "Everyone at home",
         ["Ask each person one question about the family: who, what, where, when, why or how.",
          "Listen to every answer.",
          "Tell somebody one thing you found out that you did not know."],
         "Which question got the most surprising answer?"),
    home("Answer what was asked", "A grown-up",
         ["Your grown-up asks you three questions about your day.",
          "Answer each one with something that is really about the question.",
          "Now swap: you ask, and check their answers are about the question too."],
         "Did anyone answer about something else? Laugh and try again."),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "how to ride a bike", "the names of the planets"],
}
