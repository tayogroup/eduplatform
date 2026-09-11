# -*- coding: utf-8 -*-
"""Lesson 8 - Look Back.

0838 Stage 4 Reflection: 4Fv.01 talk about what has been learned during an
activity and consider how personal ideas have changed; 4Fl.01 identify which
types of activities support learning - here over the whole course, with
every earlier lesson's about lines and the kinds of activity filled in by
the builder as the support. Analysis: 4Ap.01 recognise that people think
different things. Communication: 4Mi.01 present with structure. The look-back
over every lesson is authored HERE as a content step, so the shell adds no
second one.
"""
from _kit import explain, step, opt, q, tagged, slot, part, word, home

YASMIN = {"name": "Teacher Yasmin", "pic": "\U0001F469\U0001F3FE‍\U0001F3EB"}

LESSON = {
    "slug": "look-back",
    "title": "Look Back",
    "blurb": "Seven lessons of investigating, thinking, weighing up, working together and presenting. Look back over all of them: what did you learn, how did your ideas change, and which kinds of activity helped you learn?",
    "steps": [
        step("demo", "How the six skills grew", "\U0001F9E9", "Six skills", ["4Fv.01"],
             "The same six skills, sharper again. Press <b>Next</b> and see what changed this year.",
             explain(
                 ["Each skill took a step.", "Naming the step helps you say what you learned."],
                 [],
                 [],
                 ["Press Next and follow the steps."]),
             {"frames": [
                 {"pic": "\U0001F50D", "cap": "<b>Finding out.</b> Questions that open a journey; choosing to observe, ask or measure; a rain gauge; a Venn diagram.", "say": "Finding out. Constructing questions that open a stage of a journey, choosing whether to observe, ask or measure, reading a rain gauge, and recording on a Venn diagram. Lessons one to three."},
                 {"pic": "\U0001F914", "cap": "<b>Thinking about it.</b> Conclusions that go exactly as far as the data; views from where people stand; causes in shared spaces; actions for others.", "say": "Thinking about it. Conclusions that go exactly as far as the data and no further, views that come from where each person stands, causes that reach twenty people in a shared space, and actions for other people's problems. Lessons three, four and five.", "sound": "pop"},
                 {"pic": "⚖️", "cap": "<b>Choosing and saying why.</b> A leaflet's author wants something; your opinion of somebody else's view, with two reasons.", "say": "Choosing and saying why. Seeing that a leaflet's author wants something from you, and giving your own opinion about somebody else's view, with two reasons. Lesson four.", "sound": "pop"},
                 {"pic": "\U0001F91D", "cap": "<b>Working together.</b> Allocating by skill; ideas when stuck; strengths and limitations.", "say": "Working together. Giving out the team's jobs by skill, bringing ideas when the team is stuck, and looking honestly at your strengths and limitations. Lesson six.", "sound": "pop"},
                 {"pic": "\U0001F5E3️", "cap": "<b>Talking and listening.</b> A talk with a start, middle and end; relevant ideas and questions.", "say": "Talking and listening. Presenting with a start, a middle and an end, and responding with relevant ideas and questions. Lesson seven.", "sound": "pop"},
                 {"pic": "\u23EA", "cap": "<b>Looking back.</b> How my ideas changed, and which kinds of activity helped me learn. This lesson.", "say": "Looking back. How my ideas changed, and which kinds of activity helped me learn. That is this lesson.", "sound": "tada"},
             ]},
             "Six skills, each one a step further on."),

        step("explore", "Kinds of activity", "\U0001F9E9", "Activity kinds", ["4Fl.01"],
             "This year you learned through different KINDS of activity. Tap each kind to remember it.",
             explain(
                 ["Identifying which kinds of activity help you learn is a skill.", "Not which lesson: which KIND of doing."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F440", "label": "observing and measuring", "say": "Observing and measuring. Counting the litter, reading the rain gauge. Learning by looking and measuring for yourself."},
                 {"pic": "\U0001F4C4", "label": "reading a source", "say": "Reading a source. Locating the sentence that answers, or the author's viewpoint in a leaflet. Learning by reading closely."},
                 {"pic": "\U0001F4CA", "label": "reading charts and data", "say": "Reading charts and data. Drawing conclusions from bars and tables. Learning by working things out."},
                 {"pic": "\U0001F442", "label": "listening and responding", "say": "Listening and responding. Hearing a classmate's talk and responding with an idea. Learning from other people."},
                 {"pic": "\U0001F91D", "label": "working in a team", "say": "Working in a team. Giving out jobs, bringing ideas. Learning by doing it with others."},
                 {"pic": "\U0001F3A4", "label": "presenting a talk", "say": "Presenting a talk. Putting what you found into a start, a middle and an end. Learning by explaining it to others."},
             ], "need": 6,
              "then": {"ask": "Reading the rain gauge every morning: which kind of activity was that?",
                       "opts": [opt("observing and measuring", True), opt("presenting a talk", False), opt("reading a source", False)],
                       "why": "You measured for yourself. Observing and measuring."}},
             "Six kinds of activity, and you learned through every one."),

        step("lookback", "What I learned, how my ideas changed, what helped", "\u23EA", "I looked back", ["4Fv.01", "4Fl.01"],
             "Look back over ALL the lessons. Tap three things you learned. Then pick how one of your ideas changed. Then say which kind of activity helped you learn most, and why.",
             explain(
                 ["Three parts: what you learned, how your ideas changed, and which kind of activity helped."],
                 ["Only tap something you really did learn.", "An idea that changed: before I thought this, now I think that.", "Then the kind of activity that helped most, and why."],
                 [],
                 ["Tap the first thing you learned."]),
             {"scope": "course", "mode": "changed", "learned": [], "liked": [], "pick": 3,
              "not": ["how to ride a bike", "the names of all the planets", "how to bake a cake", "how to swim"],
              "changed": [
                  {"before": "A conclusion is anything that sounds true.", "after": "A conclusion goes exactly as far as the data, and no further."},
                  {"before": "If people disagree, somebody has the facts wrong.", "after": "People can know the same facts and think differently, from where each stands."},
                  {"before": "A leaflet tells me what is true.", "after": "A leaflet has an author who wants something from me."},
                  {"before": "What I do only affects the person next to me.", "after": "In a shared space one small cause can reach twenty people."},
              ],
              "becauses": ["because I had to do it myself", "because I could see the answer happen", "because I heard other people's ideas",
                           "because I had to think before I tapped", "because we did it as a team", "because I had to explain it to somebody else"]},
             "You looked back over the whole course: what you learned, how your ideas changed, and what helped. That is reflecting."),

        step("know", "Present what you learned", "\U0001F3A4", "Learning presenter", ["4Mi.01"],
             "Present what you learned this year as a talk: a start, a middle and an end, all about finding things out.",
             explain(
                 ["A talk about your own learning has the same shape as any talk."],
                 [],
                 [],
                 ["Tap the start, then the middle, then the end. Then press Give my talk."]),
             {"mode": "structured", "topic": "what I learned about finding things out", "tag": "findingout", "topicPic": "\U0001F50D",
              "slots": [slot("start", "Start", "Say what your talk is about"), slot("middle", "Middle", "Give something you learned"), slot("middle", "Middle", "Give something else you learned"), slot("end", "End", "Say what you will do next, and finish")],
              "cards": [
                  dict(tagged("Today I am going to tell you what I learned this year about finding things out", "findingout", "1️⃣"), say="Today I am going to tell you what I learned this year about finding things out", part="start"),
                  dict(tagged("I learned to choose whether to observe, ask or measure", "findingout", "\U0001F440"), say="I learned to choose whether to observe, ask or measure", part="middle"),
                  dict(tagged("I learned to locate the one sentence that answers my question", "findingout", "\U0001F4C4"), say="I learned to locate the one sentence that answers my question", part="middle"),
                  dict(tagged("So next year I will ask who wrote a source before I believe it. Thank you for listening", "findingout", "3️⃣"), say="So next year I will ask who wrote a source before I believe it. Thank you for listening", part="end"),
                  dict(tagged("Whales are mammals", "animals", "\U0001F40B"), say="Whales are mammals", aboutLabel="animals"),
                  dict(tagged("Ice cream is cold", "food", "\U0001F366"), say="Ice cream is cold", aboutLabel="food"),
              ]},
             "You presented your own learning with a start, a middle and an end."),

        step("answer", "Teacher Yasmin asks about the year", "\U0001F5E3️", "Learning talker", ["4Ap.01", "4Mi.01"],
             "Teacher Yasmin asks about what we did and who thought what. Tap the answer that tells her what she asked.",
             explain(
                 ["Answer what was asked, and remember that people think different things."],
                 [],
                 [],
                 ["Read the question, then tap the answer about it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "What did Mr Omar think about the supermarket, and what did Mrs Farah think?", "about": "the field views", "pic": "\U0001F3EA",
                   "opts": [tagged("He thought it would close small shops; she thought food would be cheaper and closer.", "the field views"), tagged("They both wanted a car park.", "a car park"), tagged("I had cereal.", "breakfast")],
                   "why": "Same field, different views: shops for him, prices for her."},
                  {"ask": "How did we find out how much rain fell each day?", "about": "measuring", "pic": "\U0001F327️",
                   "opts": [tagged("We measured it with a rain gauge every morning.", "measuring"), tagged("We painted a sign.", "the sign"), tagged("Birds have wings.", "birds")],
                   "why": "She asked how. Measuring with a gauge is how."},
                  {"ask": "What is a strength and what is a limitation of your teamwork?", "about": "strengths", "pic": "\U0001F4AA",
                   "opts": [tagged("A strength is what I did well; a limitation is what took more than one go.", "strengths"), tagged("A strength is being the tallest.", "height"), tagged("My shoes are blue.", "shoes")],
                   "why": "She asked about strengths and limitations. Both, honestly."},
                  {"ask": "Do people who know the same facts always think the same?", "about": "thinking differently", "pic": "\U0001F4AD",
                   "opts": [tagged("No. They can know the same facts and still think different things, from where they stand.", "thinking differently"), tagged("Yes, always.", "always"), tagged("The sea is salty.", "the sea")],
                   "why": "Four people, one field, four views."},
              ]},
             "Four questions about the year, four answers about what was asked."),

        step("sort", "Which skill was it?", "\U0001F9E9", "Skill sorter", ["4Fv.01"],
             "Here are things you did this year. Which skill was each one?",
             explain(
                 ["Sorting what you did by skill is a way of saying what you learned."],
                 [],
                 [],
                 ["Read it, then tap the skill."]),
             {"ask": "Which skill was this?",
              "bins": [{"id": "find", "label": "Finding out", "pic": "\U0001F50D"}, {"id": "think", "label": "Thinking about it", "pic": "\U0001F914"}, {"id": "team", "label": "Working together", "pic": "\U0001F91D"}],
              "items": [
                  {"pic": "\U0001F327️", "label": "reading the rain gauge in millimetres", "bin": "find", "why": "Measuring is investigating: finding out."},
                  {"pic": "\U0001F4CA", "label": "concluding that half the class slept 8 to 10 hours", "bin": "think", "why": "Drawing a conclusion is thinking about the data."},
                  {"pic": "\U0001F4CB", "label": "giving the bridge to Sami because he makes models", "bin": "team", "why": "Allocating jobs is working together."},
                  {"pic": "❓", "label": "constructing questions about the banana's journey", "bin": "find", "why": "Own questions are finding out."},
                  {"pic": "\U0001F517", "label": "finding the cause behind the push in the lunch queue", "bin": "think", "why": "Causes and consequences are thinking about it."},
                  {"pic": "\U0001F4A1", "label": "suggesting pebbles in a saucer for the bees", "bin": "team", "why": "Bringing an idea to the team is working together."},
              ]},
             "You can name the skill you were using. That is knowing what you learned."),

        step("quiz", "Show what you know", "⭐", "Star reflector", ["4Fv.01", "4Fl.01", "4Ap.01", "4Mi.01"],
             "The last quiz. Everything comes from the lessons you did. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in these lessons."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Lesson one: which kind of question helps you understand a topic?", "\U0001F9E0", "you cannot answer it yet and it opens a stage of the topic", ["everybody knows the answer", "it is about you", "it is short"], "Lesson one."),
                 q("How far does a conclusion go?", "\U0001F4A1", "exactly as far as the data, and no further", ["as far as sounds true", "to the whole world", "nowhere"], "Lesson three."),
                 q("Mr Omar and Mrs Farah knew the same facts. Did they think the same?", "\U0001F4AD", "No, they held different views from where each stood", ["Yes", "Neither had a view"], "Lesson four."),
                 q("Lesson six: what is a limitation of your teamwork?", "\U0001F914", "something that took more than one go, or that you could do better", ["being the tallest", "a job you did not have", "something you did well"], "Lesson six."),
                 q("What are the three parts of a talk?", "\U0001F3A4", "start, middle, end", ["facts, facts, facts", "hello, goodbye", "loud, quiet"], "Lesson seven."),
                 q("Counting litter on the playground: which kind of activity was that?", "\U0001F440", "observing and measuring", ["presenting a talk", "reading a source", "listening"], "Looking and counting for yourself."),
                 q("Looking back this year asks…", "\u23EA", "what I learned, how my ideas changed, and what kind of activity helped", ["only what I liked", "nothing", "who won"], "Three parts."),
                 q("An idea that changed: before, I thought a leaflet told me the truth. Now I think…", "\U0001F4CB", "a leaflet has an author who wants something from me", ["leaflets are boring", "leaflets are always true"], "That is an idea that moved."),
             ]},
             "That is the whole course finished. You looked back, and you know how your ideas changed."),
    ],
}


LESSON["about"] = [
    "Say how each of the six skills grew this year.",
    "Name the kinds of activity you learned through.",
    "Say what you learned, how an idea changed, and which kind of activity helped.",
    "Present your own learning with a start, a middle and an end.",
]

LESSON["lecture"] = [
    part("\U0001F9E9", "Six skills, sharper again",
         "Finding out, thinking about it, choosing and saying why, working together, talking and listening, looking back. The same six as every year, and each one took a step."),
    part("\U0001F50D", "What you did",
         "You constructed questions that opened a food journey and located the answers. You chose to observe, ask or measure, and read a rain gauge. You drew conclusions that went exactly as far as the data. You saw that people think differently from where they stand, and that a leaflet's author wants something."),
    part("\U0001F91D", "And more",
         "You followed a cause through a shared space to twenty people, and acted for other people's problems. You allocated a team's jobs by skill and brought ideas. You presented with a start, a middle and an end, and responded with relevant ideas."),
    part("\u23EA", "Looking back",
         "Now the last skill, with three parts. What did you learn? How did an idea change: before I thought this, now I think that? And which kind of activity helped you learn most: observing, reading, listening, a team, a talk?"),
    part("\U0001F31F", "Next year",
         "Every skill will take another step next year. Knowing what you learned, how your ideas changed and what helps you learn is how you take it."),
]

LESSON["words"] = [
    word("skill", "\U0001F9E9", "Something you can do, and get better at every time.",
         ["Finding out is a skill.", "Six skills, each one sharper."]),
    word("reflect", "\u23EA", "To think back over what you did and what you learned.",
         ["Reflect on the whole year.", "We reflected on the team job."]),
    word("changed", "\U0001F504", "Different from before.",
         ["My idea changed.", "Before I thought this; now I think that."]),
    word("activity", "\U0001F3AF", "One kind of thing you did to learn: observing, reading, a team job, a talk.",
         ["Which activity helped you learn?", "Measuring was my best activity."]),
    word("support", "\U0001F91D", "To help something happen.",
         ["Working in a team supported my learning.", "Which activities support learning?"]),
    word("present", "\U0001F3A4", "To tell people about a topic, clearly and in order.",
         ["Present what you learned.", "A talk with a start, a middle and an end."]),
]

LESSON["home"] = [
    home("Before and after", "A grown-up",
         ["Tell your grown-up one thing you thought before this year, and what you think now.",
          "Say what changed your mind.",
          "Ask them about an idea of theirs that changed."],
         "Was it a lesson, a person or a chart that changed your idea?"),
    home("Which kind helps me learn?", "Paper and a pencil",
         ["Write the six kinds of activity: observing, reading, charts, listening, a team, a talk.",
          "Put a star by the two that help you learn most.",
          "Tell somebody why."],
         "Would you choose the same two for maths?"),
    home("Present your year", "Everyone at home",
         ["Give a one-minute talk about what you learned this year: start, middle, end.",
          "Everyone responds with one relevant question or idea.",
          "Answer each one."],
         "Did your start tell them what the talk was about?"),
]
