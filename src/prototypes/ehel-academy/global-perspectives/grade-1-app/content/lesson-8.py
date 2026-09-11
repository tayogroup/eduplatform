# -*- coding: utf-8 -*-
"""Lesson 8 - Look Back.

0838 Stage 1 Reflection: 1Fv.01 talk about what has been learned during an
activity with support; 1Fl.01 talk about something liked in a particular
activity - here over the whole course, so the support is every earlier
lesson's own about lines and titles, filled in by the builder. Analysis:
1Ap.01 say something known about a topic (the topic is finding things out,
which is what the course was). Communication: 1Mi.01 answer questions with
relevant information. The look-back over every lesson is authored HERE as a
content step, so the shell adds no second one to this lesson.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}

LESSON = {
    "slug": "look-back",
    "title": "Look Back",
    "blurb": "Seven lessons of finding out, thinking, choosing, working together and talking. Look back over all of them: what did you learn, what did you like, and what do you know now?",
    "steps": [
        step("demo", "Six skills", "\U0001F9E9", "Six skills", ["1Fv.01"],
             "Everything you did in these lessons was one of six skills. Press <b>Next</b> and meet them.",
             explain(
                 ["Global Perspectives is six skills.", "You have been using all six."],
                 ["Finding out. Thinking about it. Choosing and saying why.", "Working together. Talking and listening. And looking back."],
                 ["Children think a skill is something you can do once.", "A skill is something you get better at every time."],
                 ["Press Next and see which skill each lesson was."]),
             {"frames": [
                 {"pic": "\U0001F50D", "cap": "<b>Finding out.</b> Asking questions, reading pictures, surveys and pictograms.", "say": "Finding out. Asking questions, reading pictures, doing surveys and making pictograms. Lessons one and two."},
                 {"pic": "\U0001F914", "cap": "<b>Thinking about it.</b> What we know, what happens next, what would fix it.", "say": "Thinking about it. What we know, what happens next, and what would fix a problem. Lessons three and four.", "sound": "pop"},
                 {"pic": "⚖️", "cap": "<b>Choosing and saying why.</b> The source that helps, and what you think.", "say": "Choosing and saying why. Which source helps, and what you think. Lesson five.", "sound": "pop"},
                 {"pic": "\U0001F91D", "cap": "<b>Working together.</b> Sharing, and being kind in a team.", "say": "Working together. Sharing, and being kind in a team. Lesson six.", "sound": "pop"},
                 {"pic": "\U0001F5E3️", "cap": "<b>Talking and listening.</b> Answering what was asked, and asking about what was said.", "say": "Talking and listening. Answering what was asked, and asking about what was said. Lesson seven.", "sound": "pop"},
                 {"pic": "\U0001FA9E", "cap": "<b>Looking back.</b> What did I learn? What did I like? That is this lesson.", "say": "Looking back. What did I learn? What did I like? That is this lesson.", "sound": "tada"},
             ]},
             "Six skills, and you have used every one of them."),

        step("explore", "Which skill is it?", "\U0001F9E9", "Skill spotter", ["1Fv.01"],
             "Tap each skill to hear what it is. Then say which one asking a classmate is.",
             explain(
                 ["Each skill has a name.", "Knowing the names helps you say what you learned."],
                 ["Finding out is asking and looking.", "Looking back is saying what you learned and liked."],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F50D", "label": "Finding out", "say": "Finding out. Asking questions, reading a picture, asking the class and recording the answers."},
                 {"pic": "\U0001F914", "label": "Thinking about it", "say": "Thinking about it. Saying what we know, what happens next, and what would fix a problem."},
                 {"pic": "⚖️", "label": "Choosing and saying why", "say": "Choosing and saying why. Picking the source that helps, and saying what you think."},
                 {"pic": "\U0001F91D", "label": "Working together", "say": "Working together. Sharing what you have, and being kind in a team."},
                 {"pic": "\U0001F5E3️", "label": "Talking and listening", "say": "Talking and listening. Answering what was asked, and asking about what was said."},
                 {"pic": "\U0001FA9E", "label": "Looking back", "say": "Looking back. Saying what you learned, and what you liked."},
             ], "need": 6,
              "then": {"ask": "Asking every classmate how they get to school. Which skill is that?",
                       "opts": [opt("Finding out", True), opt("Looking back", False), opt("Working together", False)],
                       "why": "Asking the class to find the answer is finding out."}},
             "Six skills with six names. Now you can say what you learned."),

        step("lookback", "What I learned, what I liked", "\U0001FA9E", "I looked back", ["1Fv.01", "1Fl.01"],
             "Look back over ALL the lessons. What did you learn? Tap three things. Then tap the lesson you liked best, and say why.",
             explain(
                 ["Looking back is a skill.", "At the end of a big piece of work, you say what you learned and what you liked."],
                 ["First: I learned that. Tap three things you really did learn in these lessons.",
                  "Then: I liked. Tap the lesson you liked best, and say why."],
                 ["Children tap something that sounds nice but was never in the lessons.", "Only say you learned it if you did it."],
                 ["Tap the first thing you learned."]),
             {"scope": "course", "learned": [], "liked": [], "pick": 3,
              "not": ["how to ride a bike", "the names of all the planets", "how to bake a cake", "how to swim"],
              "becauses": ["because it was fun", "because I got to tap and try things", "because I found something out",
                           "because I did it with friends", "because it made me think", "because I like talking about it"]},
             "You looked back over the whole course: what you learned, and what you liked. That is reflecting."),

        step("know", "What do we know about finding things out?", "\U0001F50D", "Finding-out expert", ["1Ap.01"],
             "You know a lot about finding things out now. Put what you know on the board.",
             explain(
                 ["The topic this time is finding things out.", "You did it for seven lessons. What do you know about it?"],
                 ["A question is how you find out. On the board.", "A pictogram shows what the class said. On the board.",
                  "Lions live in Africa. True, but that is about animals."],
                 [],
                 ["Tap four things about finding things out, then say one out loud."]),
             {"topic": "finding things out", "tag": "findingout", "topicPic": "\U0001F50D", "need": 4,
              "cards": [
                  dict(tagged("A question is how you find something out", "findingout", "❓"), say="A question is how you find something out"),
                  dict(tagged("A survey asks everyone the same question", "findingout", "\U0001F5E3️"), say="A survey asks everyone the same question"),
                  dict(tagged("A pictogram shows what everyone said", "findingout", "\U0001F4CA"), say="A pictogram shows what everyone said"),
                  dict(tagged("A picture is a source you can read", "findingout", "\U0001F4D6"), say="A picture is a source you can read"),
                  dict(tagged("The best source is the one about your topic", "findingout", "\U0001F3AF"), say="The best source is the one about your topic"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
                  dict(tagged("A bus has big wheels", "vehicles", "\U0001F68C"), say="A bus has big wheels", aboutLabel="buses"),
                  dict(tagged("Ice cream is cold", "food", "\U0001F366"), say="Ice cream is cold", aboutLabel="food"),
              ]},
             "You know a lot about finding things out, and you said it out loud."),

        step("answer", "Teacher Yasmin asks about your learning", "\U0001F5E3️", "Learning talker", ["1Mi.01"],
             "Teacher Yasmin asks what you did in these lessons. Tap the answer that tells her what she asked.",
             explain(
                 ["Talking about your learning is answering questions about it.", "Answer what was asked."],
                 ["What did you do to find out how we get to school? We asked everyone and made a pictogram.",
                  "Not: I had toast. That is true, but it is about breakfast."],
                 [],
                 ["Read the question, then tap the answer about it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "What did you do to find out how we get to school?", "about": "the survey", "pic": "\U0001F3EB",
                   "opts": [tagged("We asked everyone and made a pictogram.", "the survey"), tagged("We painted the sky blue.", "the mural"), tagged("I had toast for breakfast.", "breakfast")],
                   "why": "She asked about finding out how we get to school. The survey and the pictogram is what we did."},
                  {"ask": "What did the team do together?", "about": "the team", "pic": "\U0001F91D",
                   "opts": [tagged("We planted a garden and shared the seeds.", "the team"), tagged("I went to the dentist.", "the dentist"), tagged("Birds have wings.", "birds")],
                   "why": "She asked about the team. Planting the garden together is what the team did."},
                  {"ask": "How do you show good listening?", "about": "listening", "pic": "\U0001F442",
                   "opts": [tagged("I ask a question about what they said.", "listening"), tagged("I like bananas.", "food"), tagged("My shoes are blue.", "shoes")],
                   "why": "She asked about listening. A question about what was said shows you listened."},
                  {"ask": "Which source helped Nora find out about bread?", "about": "the baker", "pic": "\U0001F35E",
                   "opts": [tagged("The baker, because the baker makes bread.", "the baker"), tagged("The sea is salty.", "the sea"), tagged("I have a red bike.", "bikes")],
                   "why": "She asked about the source for bread. The baker is the answer."},
              ]},
             "Four questions about your learning, four answers about what was asked."),

        step("sort", "Which skill was it?", "\U0001F9E9", "Skill sorter", ["1Fv.01"],
             "Here are things you did. Which skill was each one?",
             explain(
                 ["Every activity was one of the skills.", "Sorting them is a way of saying what you learned."],
                 ["Asking the class is finding out.", "Sharing seeds is working together.", "Saying what you liked is looking back."],
                 [],
                 ["Read it, then tap the skill."]),
             {"ask": "Which skill was this?",
              "bins": [{"id": "find", "label": "Finding out", "pic": "\U0001F50D"}, {"id": "team", "label": "Working together", "pic": "\U0001F91D"}, {"id": "back", "label": "Looking back", "pic": "\U0001FA9E"}],
              "items": [
                  {"pic": "\U0001F5E3️", "label": "asking every classmate a question", "bin": "find", "why": "Asking the class to find the answer is finding out."},
                  {"pic": "\U0001F331", "label": "sharing your seeds with Sami", "bin": "team", "why": "Sharing so both can finish is working together."},
                  {"pic": "\U0001FA9E", "label": "saying what you liked best", "bin": "back", "why": "Saying what you liked is looking back."},
                  {"pic": "\U0001F4CA", "label": "making a pictogram", "bin": "find", "why": "Recording what you found is finding out."},
                  {"pic": "\U0001F4A7", "label": "being kind when Nora spilt the water", "bin": "team", "why": "Working kindly with others is working together."},
                  {"pic": "\U0001F4A1", "label": "saying what you learned today", "bin": "back", "why": "Saying what you learned is looking back."},
              ]},
             "You can name the skill you were using. That is knowing what you learned."),

        step("quiz", "Show what you know", "⭐", "Star reflector", ["1Fv.01", "1Fl.01", "1Ap.01", "1Mi.01"],
             "The last quiz. Everything comes from the lessons you did. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in these lessons."],
                 ["Think about all seven lessons."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("How many skills are there in Global Perspectives?", "\U0001F9E9", "six", ["two", "ten", "one"], "Finding out, thinking about it, choosing and saying why, working together, talking and listening, and looking back."),
                 q("What is looking back?", "\U0001FA9E", "saying what you learned and what you liked", ["turning around", "a kind of source", "a survey"], "Looking back is saying what you learned and liked."),
                 q("Which skill is asking the class how they get to school?", "\U0001F50D", "finding out", ["looking back", "working together", "choosing"], "Asking to find the answer is finding out."),
                 q("Which skill is sharing your seeds so Sami can plant?", "\U0001F91D", "working together", ["looking back", "finding out", "listening"], "Sharing so both can finish is working together."),
                 q("What does a pictogram show?", "\U0001F4CA", "what everyone said, one picture per person", ["a map of the town", "a story", "the weather"], "Every picture is one person's answer."),
                 q("Teacher Yasmin asks what the team did. Which answer is about the team?", "\U0001F331", "We planted a garden and shared the seeds.", ["I went to the dentist.", "Birds have wings.", "I like toast."], "She asked about the team."),
                 q("Can somebody tell you what you liked best is wrong?", "\U0001F4AD", "No, what you liked is yours", ["Yes, always", "Only the teacher can"], "What you liked is your own opinion."),
                 q("What is the best source for a topic?", "\U0001F3AF", "the one that is about your topic", ["the biggest one", "the newest one", "the red one"], "A source helps when it is about your topic."),
             ]},
             "That is the whole course finished. You looked back, and you know what you learned."),
    ],
}


LESSON["about"] = [
    "Name the six skills of Global Perspectives.",
    "Say what you learned across all the lessons.",
    "Say which lesson you liked best, and why.",
    "Say what you know now about finding things out.",
]

LESSON["lecture"] = [
    part("\U0001F9E9", "Six skills",
         "Everything you did in these lessons was one of six skills: finding out, thinking about it, choosing and saying why, working together, talking and listening, and looking back."),
    part("\U0001F50D", "What you did",
         "You built questions and read pictures. You asked the class and made pictograms. You said what you knew, thought about what happens next, and chose actions that fixed problems."),
    part("\U0001F91D", "And more",
         "You chose the source that helps and said why. You said what you think. You planted a garden and painted a mural with a team. You listened, and asked, and answered."),
    part("\U0001FA9E", "Looking back",
         "Now the last skill. Looking back means saying what you learned, and what you liked. Only say you learned something if you really did it. And what you liked is yours: nobody can say it is wrong."),
    part("\U0001F31F", "What you know now",
         "You know that a question is how you find out. You know a pictogram shows what the class said. You know the best source is the one about your topic. You know a lot."),
]

LESSON["words"] = [
    word("skill", "\U0001F9E9", "Something you can do, and get better at every time.",
         ["Finding out is a skill.", "You used six skills."]),
    word("learn", "\U0001F4A1", "To come to know or be able to do something new.",
         ["I learned to ask a question.", "What did you learn today?"]),
    word("look back", "\U0001FA9E", "To think about what you did and say what you learned and liked.",
         ["Look back over the lesson.", "We looked back at the garden."]),
    word("remember", "\U0001F9E0", "To keep something in your head from before.",
         ["Remember what we did in lesson two.", "I remember the pictogram."]),
    word("favourite", "\U0001F31F", "The one you like best.",
         ["My favourite lesson was the garden.", "Which was your favourite?"]),
    word("proud", "\U0001F60A", "Happy about something you did.",
         ["I am proud that I asked a good question.", "Be proud of what you learned."]),
]

LESSON["home"] = [
    home("Tell somebody what you learned", "A grown-up",
         ["Tell your grown-up three things you learned in these lessons.",
          "Say which lesson you liked best, and why.",
          "Ask them what they learned when they were small."],
         "Could you remember three things without looking?"),
    home("A skill at home", "Everyone at home, for one day",
         ["Pick one skill: finding out, working together, or talking and listening.",
          "Use it at home today, on purpose.",
          "At bedtime, say how you used it."],
         "Which skill did you use without noticing?"),
    home("My learning picture", "Paper and crayons",
         ["Draw the lesson you liked best.",
          "Draw yourself doing the thing you learned.",
          "Show somebody and say: I learned to…"],
         "What would you like to find out about next?"),
]
