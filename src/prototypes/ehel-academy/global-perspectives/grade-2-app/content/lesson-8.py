# -*- coding: utf-8 -*-
"""Lesson 8 - Look Back.

0838 Stage 2 Reflection: 2Fv.01 talk about what has been learned during an
activity; 2Fl.01 talk about a particular activity that supported learning -
here over the whole course, with every earlier lesson's about lines and
titles filled in by the builder as the support. Analysis: 2Ap.01 recognise
that different people know different things. Communication: 2Mi.01 talk
about a given topic, giving relevant information. The look-back over every
lesson is authored HERE as a content step, so the shell adds no second one.
"""
from _kit import explain, step, opt, q, tagged, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}

LESSON = {
    "slug": "look-back",
    "title": "Look Back",
    "blurb": "Seven lessons of finding out, thinking, choosing, working together and talking. Look back over all of them: what did you learn, and which activity helped you learn it?",
    "steps": [
        step("demo", "Six skills, one year on", "\U0001F9E9", "Six skills", ["2Fv.01"],
             "You used all six skills again this year, and each one got sharper. Press <b>Next</b>.",
             explain(
                 ["The six skills are the same every year.", "What changes is how well you do them."],
                 ["Last year you asked questions. This year you asked FOCUSED ones.", "Last year you picked a source. This year you SUGGESTED all the ones that help."],
                 [],
                 ["Press Next and see how each skill grew."]),
             {"frames": [
                 {"pic": "\U0001F50D", "cap": "<b>Finding out.</b> Focused questions, finding the part that answers, interviews, tables and bars.", "say": "Finding out. Focused questions, finding the part of a source that answers, interviews, and findings as pictures, bars and tables. Lessons one and two."},
                 {"pic": "\U0001F914", "cap": "<b>Thinking about it.</b> Who knows what, what my actions do to others, what I could do myself.", "say": "Thinking about it. Who knows what, what my actions do to others, and what I could do about a problem of my own. Lessons three and four.", "sound": "pop"},
                 {"pic": "⚖️", "cap": "<b>Choosing and saying why.</b> Suggesting every source that helps, and opinions with two reasons.", "say": "Choosing and saying why. Suggesting every source that helps, and opinions with two reasons. Lesson five.", "sound": "pop"},
                 {"pic": "\U0001F91D", "cap": "<b>Working together.</b> Doing my job, and ideas when the team is stuck.", "say": "Working together. Doing my own job, and having ideas when the team is stuck. Lesson six.", "sound": "pop"},
                 {"pic": "\U0001F5E3️", "cap": "<b>Talking and listening.</b> Relevant questions, and talks that stay on the topic.", "say": "Talking and listening. Relevant questions after listening, and talks that stay on the topic. Lesson seven.", "sound": "pop"},
                 {"pic": "\u23EA", "cap": "<b>Looking back.</b> What I learned, and which activity helped me learn it. That is this lesson.", "say": "Looking back. What I learned, and which activity helped me learn it. That is this lesson.", "sound": "tada"},
             ]},
             "Six skills, and every one of them sharper than last year."),

        step("explore", "Which skill grew?", "\U0001F9E9", "Skill spotter", ["2Fv.01"],
             "Tap each skill to hear how it grew this year.",
             explain(
                 ["Naming the skill helps you say what you learned."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F50D", "label": "Finding out", "say": "Finding out. Last year, any question. This year, a focused question, and finding the exact part of a source that answers it."},
                 {"pic": "\U0001F914", "label": "Thinking about it", "say": "Thinking about it. Last year, what happens to me. This year, what my actions do to others, and what I could do myself."},
                 {"pic": "⚖️", "label": "Choosing and saying why", "say": "Choosing and saying why. Last year, one source. This year, every source that helps, and two reasons for an opinion."},
                 {"pic": "\U0001F91D", "label": "Working together", "say": "Working together. Last year, sharing. This year, doing my own job, and ideas when the team is stuck."},
                 {"pic": "\U0001F5E3️", "label": "Talking and listening", "say": "Talking and listening. Last year, a question about what was said. This year, a relevant one, and a whole talk on the topic."},
                 {"pic": "\u23EA", "label": "Looking back", "say": "Looking back. Last year, what I liked. This year, which activity helped me learn."},
             ], "need": 6,
              "then": {"ask": "Suggesting every source that would help with a topic. Which skill is that?",
                       "opts": [opt("Choosing and saying why", True), opt("Looking back", False), opt("Working together", False)],
                       "why": "Suggesting sources and saying why is choosing and saying why."}},
             "Six skills, each one grown."),

        step("lookback", "What I learned, and what helped", "\u23EA", "I looked back", ["2Fv.01", "2Fl.01"],
             "Look back over ALL the lessons. What did you learn? Tap three things. Then tap the lesson that helped you learn most, and say why.",
             explain(
                 ["Looking back is a skill.", "At the end of a big piece of work, you say what you learned, and which activity helped you learn it."],
                 ["First: I learned that. Tap three things you really did learn in these lessons.",
                  "Then: the part that helped me learn most. Tap the lesson, and say why it helped."],
                 ["Children tap the lesson that was most fun.", "Fun is fine, but this asks which one HELPED you learn."],
                 ["Tap the first thing you learned."]),
             {"scope": "course", "mode": "helped", "learned": [], "liked": [], "pick": 3,
              "not": ["how to ride a bike", "the names of all the planets", "how to bake a cake", "how to swim"],
              "becauses": ["because I had to try it myself", "because I could see it happen", "because we talked about it",
                           "because I did it with friends", "because I got to choose", "because it made me think hard"]},
             "You looked back over the whole course: what you learned, and what helped you learn it. That is reflecting."),

        step("know", "My talk about finding things out", "\U0001F50D", "Finding-out expert", ["2Mi.01"],
             "Give a short talk about finding things out. Four things, all about finding out.",
             explain(
                 ["You have been finding things out all year. Now say it."],
                 ["A focused question is about the exact problem. About finding out.", "Lions live in Africa. True, but not about finding out."],
                 [],
                 ["Tap four things about finding things out, then press Give my talk."]),
             {"mode": "talk", "topic": "finding things out", "tag": "findingout", "topicPic": "\U0001F50D", "need": 4,
              "cards": [
                  dict(tagged("A focused question is about the exact problem", "findingout", "\U0001F3AF"), say="A focused question is about the exact problem"),
                  dict(tagged("A source answers a question in one part, not all of it", "findingout", "\U0001F4D6"), say="A source answers a question in one part, not all of it"),
                  dict(tagged("An interview finds information and opinions", "findingout", "\U0001F399️"), say="An interview finds information and opinions"),
                  dict(tagged("Pictures, bars and numbers can all show the same findings", "findingout", "\U0001F4CA"), say="Pictures, bars and numbers can all show the same findings"),
                  dict(tagged("Different people know different things, so ask the right one", "findingout", "\U0001F4A1"), say="Different people know different things, so ask the right one"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
                  dict(tagged("A bus has big wheels", "vehicles", "\U0001F68C"), say="A bus has big wheels", aboutLabel="buses"),
                  dict(tagged("Ice cream is cold", "food", "\U0001F366"), say="Ice cream is cold", aboutLabel="food"),
              ]},
             "You gave a talk about finding things out, and every sentence was about it."),

        step("answer", "Who would know, and what did we learn?", "\U0001F5E3️", "Learning talker", ["2Ap.01", "2Mi.01"],
             "Teacher Yasmin asks about your learning, and about who knows what. Tap the answer that tells her what she asked.",
             explain(
                 ["Talking about your learning is answering questions about it.", "And remember: different people know different things."],
                 [],
                 [],
                 ["Read the question, then tap the answer about it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "How did we find out what the class plays at playtime?", "about": "the interview", "pic": "\U0001F399️",
                   "opts": [tagged("We interviewed everyone and recorded it as pictures and bars.", "the interview"), tagged("We painted the sky first.", "the backdrop"), tagged("I had toast.", "breakfast")],
                   "why": "She asked how we found out. The interview is how."},
                  {"ask": "Who would know when the mangoes are ready?", "about": "mangoes", "pic": "\U0001F96D",
                   "opts": [tagged("The farmer, because the farmer grows them.", "mangoes"), tagged("The bus driver, because buses are fast.", "the bus driver"), tagged("The sea is salty.", "the sea")],
                   "why": "Different people know different things. The farmer grows the mangoes."},
                  {"ask": "What got the team unstuck when the birds ate the seeds?", "about": "the scarecrow idea", "pic": "\U0001F426",
                   "opts": [tagged("An idea: make a scarecrow.", "the scarecrow idea"), tagged("I went to the dentist.", "the dentist"), tagged("Birds have wings.", "birds")],
                   "why": "She asked what got the team unstuck. The scarecrow idea did."},
                  {"ask": "What makes a question relevant after listening?", "about": "relevance", "pic": "\U0001F442",
                   "opts": [tagged("It is about what the person said.", "relevance"), tagged("It is very long.", "length"), tagged("My shoes are blue.", "shoes")],
                   "why": "She asked what makes it relevant. Being about what was said is the answer."},
              ]},
             "Four questions about your learning, four answers about what was asked."),

        step("sort", "Which skill was it?", "\U0001F9E9", "Skill sorter", ["2Fv.01"],
             "Here are things you did this year. Which skill was each one?",
             explain(
                 ["Sorting what you did by skill is a way of saying what you learned."],
                 [],
                 [],
                 ["Read it, then tap the skill."]),
             {"ask": "Which skill was this?",
              "bins": [{"id": "find", "label": "Finding out", "pic": "\U0001F50D"}, {"id": "team", "label": "Working together", "pic": "\U0001F91D"}, {"id": "say", "label": "Choosing and saying why", "pic": "⚖️"}],
              "items": [
                  {"pic": "\U0001F399️", "label": "interviewing classmates about playtime", "bin": "find", "why": "An interview finds things out."},
                  {"pic": "\U0001F426", "label": "suggesting a scarecrow when the team was stuck", "bin": "team", "why": "An idea for the team is working together."},
                  {"pic": "\U0001F4DA", "label": "suggesting three sources about recycling", "bin": "say", "why": "Choosing sources and saying why."},
                  {"pic": "\U0001F4C4", "label": "finding the sentence in the rules that answers", "bin": "find", "why": "Locating information is finding out."},
                  {"pic": "\U0001F4AD", "label": "giving two reasons for my opinion about zoos", "bin": "say", "why": "An opinion with reasons is saying why."},
                  {"pic": "\U0001F331", "label": "planting my row of seeds for the patch", "bin": "team", "why": "Doing your job for a shared outcome is working together."},
              ]},
             "You can name the skill you were using. That is knowing what you learned."),

        step("quiz", "Show what you know", "⭐", "Star reflector", ["2Fv.01", "2Fl.01", "2Ap.01", "2Mi.01"],
             "The last quiz. Everything comes from the lessons you did. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in these lessons."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("The problem: the book corner is messy. Which question is focused on it?", "\U0001F3AF", "Where do the books get left?", ["What is a library?", "Do you like red?", "Is the moon far away?"], "About the topic, about the problem, and you can find out."),
                 q("Three children play football. The football pictures, the football bar and the number 3 all…", "\U0001F4CA", "show the same finding", ["show different surveys", "only show opinions", "disagree"], "One finding, drawn three ways."),
                 q("Who knows most about how bread is made?", "\U0001F469\U0001F3FE‍\U0001F373", "the baker", ["the bus driver", "the librarian", "the doctor"], "Ask the person whose job it is."),
                 q("Omar talked during the story. Who else did that reach?", "\U0001F467\U0001F3FD", "Nora, who could not hear it", ["nobody", "only Omar", "the bus driver"], "What you do reaches others."),
                 q("I think we should recycle more, because it saves paper. What does my opinion still need?", "\U0001F4AD", "another reason about recycling that backs it up", ["a reason about my bike", "nothing", "a picture"], "At least two reasons, all about the topic."),
                 q("What got the team unstuck when the paint was running out?", "\U0001F7E9", "an idea: mix it with white", ["giving up", "arguing", "painting the hills red"], "An idea gets the team unstuck."),
                 q("What is looking back at this year?", "\u23EA", "saying what you learned and which activity helped", ["turning around", "a survey", "a kind of source"], "What I learned, and what helped me learn it."),
                 q("Leo said he went to the beach every Saturday. Which question is relevant?", "\U0001F3D6️", "What did you do at the beach?", ["Do you like maths?", "What is your cat called?", "Can you ride a bike?"], "It is about what he said."),
             ]},
             "That is the whole course finished. You looked back, and you know what helped you learn."),
    ],
}


LESSON["about"] = [
    "Say how each of the six skills grew this year.",
    "Say what you learned across all the lessons.",
    "Say which lesson helped you learn most, and why.",
    "Give a short talk about finding things out.",
]

LESSON["lecture"] = [
    part("\U0001F9E9", "The same six skills",
         "Finding out, thinking about it, choosing and saying why, working together, talking and listening, and looking back. The same six skills as last year, and every one of them sharper."),
    part("\U0001F50D", "What grew",
         "You asked focused questions and found the exact part of a source that answers. You interviewed classmates and showed the findings as pictures, bars and numbers. You worked out who knows what, and what your actions do to others."),
    part("\U0001F91D", "And more",
         "You suggested every source that helps and gave opinions with two reasons. You did your job for the vegetable patch and had ideas when the team was stuck. You asked relevant questions and gave a talk for Leo."),
    part("\u23EA", "Looking back",
         "Now the last skill. Looking back means saying what you learned, and which activity helped you learn it. Not the most fun one: the one that helped. Only say you learned something if you really did."),
    part("\U0001F31F", "What you can do now",
         "You can find things out properly. You can think about others. You can choose and say why. You can work in a team with ideas. You can talk and listen. And you can look back and say so."),
]

LESSON["words"] = [
    word("skill", "\U0001F9E9", "Something you can do, and get better at every time.",
         ["Finding out is a skill.", "Six skills, each one sharper."]),
    word("learn", "\U0001F4A1", "To come to know or be able to do something new.",
         ["I learned to ask focused questions.", "What did you learn this year?"]),
    word("look back", "\u23EA", "To think about what you did and say what you learned and what helped.",
         ["Look back over the course.", "We looked back at the patch."]),
    word("activity", "\U0001F3AF", "One thing you did in a lesson: an interview, a team job, a talk.",
         ["Which activity helped you learn most?", "The interview was my favourite activity."]),
    word("helped", "\U0001F91D", "Made something easier to learn or do.",
         ["The interview helped me learn about surveys.", "Which part helped most?"]),
    word("sharper", "✏️", "Better and more exact than before.",
         ["My questions are sharper this year.", "Every skill got sharper."]),
]

LESSON["home"] = [
    home("Tell somebody what you learned", "A grown-up",
         ["Tell your grown-up three things you learned in these lessons.",
          "Say which lesson helped you learn most, and why it helped.",
          "Ask them which activity helped THEM learn when they were at school."],
         "Was the lesson that helped most also the most fun?"),
    home("A skill at home", "Everyone at home, for one day",
         ["Pick one skill: focused questions, working together, or relevant questions.",
          "Use it at home today, on purpose.",
          "At bedtime, say how you used it."],
         "Which skill did you use without noticing?"),
    home("My learning picture", "Paper and crayons",
         ["Draw the activity that helped you learn most.",
          "Draw yourself doing the thing you learned.",
          "Show somebody and say: this helped me learn to…"],
         "What would you like to find out about next year?"),
]

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("You want to know when the library opens. Which question is focused on that?", "\U0001F3AF", "What time does the library open?", ["Do you like books?", "Is the library big?"], "It asks exactly what you want to find out: the time it opens."),
    q("Which one is information, not an opinion?", "\U0001F4CB", "Six children walk to school.", ["Walking is the best way.", "Buses are boring."], "Six children walk is information you can count. Best and boring are opinions."),
]
