# -*- coding: utf-8 -*-
"""Lesson 8 - Look Back.

0838 Stage 3 Reflection: 3Fv.01 talk about what has been learned during an
activity and consider how personal ideas have changed; 3Fl.01 identify which
types of activities support learning - here over the whole course, with
every earlier lesson's about lines and the kinds of activity filled in by
the builder as the support. Analysis: 3Ap.01 recognise that people think
different things. Communication: 3Mi.01 present with structure. The look-back
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
        step("demo", "How the six skills grew", "\U0001F9E9", "Six skills", ["3Fv.01"],
             "The same six skills, sharper again. Press <b>Next</b> and see what changed this year.",
             explain(
                 ["Each skill took a step.", "Naming the step helps you say what you learned."],
                 [],
                 [],
                 ["Press Next and follow the steps."]),
             {"frames": [
                 {"pic": "\U0001F50D", "cap": "<b>Finding out.</b> Your own questions; answers located in a source; observing and measuring; charts and diagrams.", "say": "Finding out. Constructing your own questions, locating answers in a source, observing and measuring, and recording in charts and diagrams. Lessons one and two."},
                 {"pic": "\U0001F914", "cap": "<b>Thinking about it.</b> Conclusions the data proves; people thinking differently; causes and consequences for others; actions for others' problems.", "say": "Thinking about it. Conclusions the data proves, people thinking differently, the causes of what we do and its consequences for others, and actions for other people's problems. Lessons three, four and five.", "sound": "pop"},
                 {"pic": "⚖️", "cap": "<b>Choosing and saying why.</b> An author's viewpoint in a source; your opinion of somebody else's view, with reasons.", "say": "Choosing and saying why. Seeing an author's viewpoint in a source, and giving your own opinion about somebody else's view, with reasons. Lesson four.", "sound": "pop"},
                 {"pic": "\U0001F91D", "cap": "<b>Working together.</b> Allocating jobs; bringing ideas; strengths and limitations.", "say": "Working together. Giving out the team's jobs, bringing ideas, and looking honestly at your strengths and limitations. Lesson six.", "sound": "pop"},
                 {"pic": "\U0001F5E3️", "cap": "<b>Talking and listening.</b> A talk with a start, middle and end; relevant ideas and questions.", "say": "Talking and listening. Presenting with a start, a middle and an end, and responding with relevant ideas and questions. Lesson seven.", "sound": "pop"},
                 {"pic": "\u23EA", "cap": "<b>Looking back.</b> How my ideas changed, and which kinds of activity helped me learn. This lesson.", "say": "Looking back. How my ideas changed, and which kinds of activity helped me learn. That is this lesson.", "sound": "tada"},
             ]},
             "Six skills, each one a step further on."),

        step("explore", "Kinds of activity", "\U0001F9E9", "Activity kinds", ["3Fl.01"],
             "This year you learned through different KINDS of activity. Tap each kind to remember it.",
             explain(
                 ["Identifying which kinds of activity help you learn is a skill.", "Not which lesson: which KIND of doing."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F440", "label": "observing and measuring", "say": "Observing and measuring. Counting at the gate, measuring the bean plants. Learning by looking and measuring for yourself."},
                 {"pic": "\U0001F4C4", "label": "reading a source", "say": "Reading a source. Finding the sentence that answers, or the author's viewpoint. Learning by reading closely."},
                 {"pic": "\U0001F4CA", "label": "reading charts and data", "say": "Reading charts and data. Drawing conclusions from bars and numbers. Learning by working things out."},
                 {"pic": "\U0001F442", "label": "listening and responding", "say": "Listening and responding. Hearing a classmate's talk and responding with an idea. Learning from other people."},
                 {"pic": "\U0001F91D", "label": "working in a team", "say": "Working in a team. Giving out jobs, bringing ideas. Learning by doing it with others."},
                 {"pic": "\U0001F3A4", "label": "presenting a talk", "say": "Presenting a talk. Putting what you found into a start, a middle and an end. Learning by explaining it to others."},
             ], "need": 6,
              "then": {"ask": "Counting what passed the school gate: which kind of activity was that?",
                       "opts": [opt("observing and measuring", True), opt("presenting a talk", False), opt("reading a source", False)],
                       "why": "You looked and counted for yourself. Observing."}},
             "Six kinds of activity, and you learned through every one."),

        step("lookback", "What I learned, how my ideas changed, what helped", "\u23EA", "I looked back", ["3Fv.01", "3Fl.01"],
             "Look back over ALL the lessons. Tap three things you learned. Then pick how one of your ideas changed. Then say which kind of activity helped you learn most, and why.",
             explain(
                 ["Three parts: what you learned, how your ideas changed, and which kind of activity helped."],
                 ["Only tap something you really did learn.", "An idea that changed: before I thought this, now I think that.", "Then the kind of activity that helped most, and why."],
                 [],
                 ["Tap the first thing you learned."]),
             {"scope": "course", "mode": "changed", "learned": [], "liked": [], "pick": 3,
              "not": ["how to ride a bike", "the names of all the planets", "how to bake a cake", "how to swim"],
              "changed": [
                  {"before": "A chart is the end of finding out.", "after": "The conclusions come after the chart, and only what the data proves."},
                  {"before": "If two people disagree, one must be wrong.", "after": "People can think differently, and each view has reasons."},
                  {"before": "Looking back means saying what I did well.", "after": "Looking back means saying what I did well AND what took more than one go."},
                  {"before": "Other people's problems are for grown-ups to fix.", "after": "I can take an action of my own, and tell a grown-up when it needs one."},
              ],
              "becauses": ["because I had to do it myself", "because I could see the answer happen", "because I heard other people's ideas",
                           "because I had to think before I tapped", "because we did it as a team", "because I had to explain it to somebody else"]},
             "You looked back over the whole course: what you learned, how your ideas changed, and what helped. That is reflecting."),

        step("know", "Present what you learned", "\U0001F3A4", "Learning presenter", ["3Mi.01"],
             "Present what you learned this year as a talk: a start, a middle and an end, all about finding things out.",
             explain(
                 ["A talk about your own learning has the same shape as any talk."],
                 [],
                 [],
                 ["Tap the start, then the middle, then the end. Then press Give my talk."]),
             {"mode": "structured", "topic": "finding things out this year", "tag": "findingout", "topicPic": "\U0001F50D",
              "slots": [slot("start", "Start", "Say what your talk is about"), slot("middle", "Middle", "Give something you learned"), slot("middle", "Middle", "Give something else you learned"), slot("end", "End", "Say what you will do next, and finish")],
              "cards": [
                  dict(tagged("Today I am going to tell you what I learned this year about finding things out", "findingout", "1️⃣"), say="Today I am going to tell you what I learned this year about finding things out", part="start"),
                  dict(tagged("I learned to observe and measure, not just ask", "findingout", "\U0001F440"), say="I learned to observe and measure, not just ask", part="middle"),
                  dict(tagged("I learned to find the one sentence that answers my question", "findingout", "\U0001F4C4"), say="I learned to find the one sentence that answers my question", part="middle"),
                  dict(tagged("So next year I will make my own questions before I start. Thank you for listening", "findingout", "3️⃣"), say="So next year I will make my own questions before I start. Thank you for listening", part="end"),
                  dict(tagged("Lions live in Africa", "animals", "\U0001F981"), say="Lions live in Africa", aboutLabel="animals"),
                  dict(tagged("Ice cream is cold", "food", "\U0001F366"), say="Ice cream is cold", aboutLabel="food"),
              ]},
             "You presented your own learning with a start, a middle and an end."),

        step("answer", "Teacher Yasmin asks about the year", "\U0001F5E3️", "Learning talker", ["3Ap.01", "3Mi.01"],
             "Teacher Yasmin asks about what we did and who thought what. Tap the answer that tells her what she asked.",
             explain(
                 ["Answer what was asked, and remember that people think different things."],
                 [],
                 [],
                 ["Read the question, then tap the answer about it."]),
             {"asker": YASMIN,
              "rounds": [
                  {"ask": "What did Mr Bello think about dogs in the park, and what did Mrs Adams think?", "about": "the park views", "pic": "\U0001F415",
                   "opts": [tagged("He wanted leads; she wanted dogs to run free on the field.", "the park views"), tagged("The park has a pond with ducks.", "the pond"), tagged("I had toast.", "breakfast")],
                   "why": "Same park, different views: leads for him, the field for her."},
                  {"ask": "How did we find out what passed the school gate?", "about": "observing", "pic": "\U0001F440",
                   "opts": [tagged("We observed and counted for five minutes.", "observing"), tagged("We painted a sign.", "the sign"), tagged("Birds have wings.", "birds")],
                   "why": "She asked how. Observing and counting is how."},
                  {"ask": "What is a strength and what is a limitation of your teamwork?", "about": "strengths", "pic": "\U0001F4AA",
                   "opts": [tagged("A strength is what I did well; a limitation is what took more than one go.", "strengths"), tagged("Our class had a stall at the fair.", "the fair"), tagged("My shoes are blue.", "shoes")],
                   "why": "She asked about strengths and limitations. Both, honestly."},
                  {"ask": "Do people who know the same facts always think the same?", "about": "thinking differently", "pic": "\U0001F4AD",
                   "opts": [tagged("No. They can know the same facts and still think different things.", "thinking differently"), tagged("Mr Bello is the park keeper.", "the park keeper"), tagged("The sea is salty.", "the sea")],
                   "why": "Four people, one park, four views."},
              ]},
             "Four questions about the year, four answers about what was asked."),

        step("sort", "Which skill was it?", "\U0001F9E9", "Skill sorter", ["3Fv.01"],
             "Here are things you did this year. Which skill was each one?",
             explain(
                 ["Sorting what you did by skill is a way of saying what you learned."],
                 [],
                 [],
                 ["Read it, then tap the skill."]),
             {"ask": "Which skill was this?",
              "bins": [{"id": "find", "label": "Finding out", "pic": "\U0001F50D"}, {"id": "think", "label": "Thinking about it", "pic": "\U0001F914"}, {"id": "team", "label": "Working together", "pic": "\U0001F91D"}],
              "items": [
                  {"pic": "\U0001F4CF", "label": "measuring the bean plants with a ruler", "bin": "find", "why": "Measuring is investigating: finding out."},
                  {"pic": "\U0001F4CA", "label": "concluding that more chose fruit than crisps", "bin": "think", "why": "Drawing a conclusion is thinking about the data."},
                  {"pic": "\U0001F4CB", "label": "giving the top edge to Hana because she is tall", "bin": "team", "why": "Allocating jobs is working together."},
                  {"pic": "❓", "label": "constructing questions about where water comes from", "bin": "find", "why": "Own questions are finding out."},
                  {"pic": "\U0001F517", "label": "finding the cause behind Tariq's running", "bin": "think", "why": "Causes and consequences are thinking about it."},
                  {"pic": "\U0001F4A1", "label": "suggesting shiny foil strips to scare the birds off the garden", "bin": "team", "why": "Bringing an idea to the team is working together."},
              ]},
             "You can name the skill you were using. That is knowing what you learned."),

        step("quiz", "Show what you know", "⭐", "Star reflector", ["3Fv.01", "3Fl.01", "3Ap.01", "3Mi.01"],
             "The last quiz. Everything comes from the lessons you did. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in these lessons."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Lesson one: which kind of question helps you understand a topic?", "\U0001F9E0", "one you cannot answer yet, about how the topic works", ["one everybody can answer", "one about you", "a short one"], "Lesson one."),
                 q("Lesson three: what is a conclusion?", "\U0001F4A1", "a sentence the data proves", ["a guess", "an opinion", "a chart"], "Lesson three."),
                 q("Mr Bello and Mrs Adams knew the same facts. Did they think the same?", "\U0001F4AD", "No, they held different views", ["Yes", "Neither had a view"], "Lesson four."),
                 q("Lesson six: what is a limitation of your teamwork?", "\U0001F914", "something that took more than one go, or that you could do better", ["being first in the line", "a job you did not have", "something you did well"], "Lesson six."),
                 q("What are the three parts of a talk?", "\U0001F3A4", "start, middle, end", ["facts, facts, facts", "hello, goodbye", "loud, quiet"], "Lesson seven."),
                 q("Measuring the bean plants with a ruler: which kind of activity was that?", "\U0001F4CF", "observing and measuring", ["presenting a talk", "reading a source", "listening"], "Measuring for yourself."),
                 q("Looking back at this year asks…", "\u23EA", "what I learned, how my ideas changed, and what kind of activity helped", ["only what I liked", "nothing", "who won"], "Three parts."),
                 q("An idea that changed: before, I thought a chart was the end. Now I think…", "\U0001F4CA", "the conclusions come after, and only what the data proves", ["charts are boring", "the chart is still the end"], "That is an idea that moved."),
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
         "You constructed your own questions and located the answers. You observed, measured and recorded. You drew conclusions the data proves. You saw that people think differently and found an author's viewpoint."),
    part("\U0001F91D", "And more",
         "You found causes and consequences, and acted for other people's problems. You allocated a team's jobs and brought ideas. You presented with a start, a middle and an end, and responded with relevant ideas."),
    part("\u23EA", "Looking back at this year",
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
         ["Which activity helped you learn?", "Observing was my best activity."]),
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
