# -*- coding: utf-8 -*-
"""Lesson 4 - Me and Others.

0838 Stage 2 Analysis: 2Ac.01 talk about simple, personal consequences of
own actions on others; 2As.01 suggest a personal action that could make a
positive difference to an issue affecting self. The topic is our classroom -
what I do reaches the person next to me, and the problems I have (my book is
always lost, I am always last to be ready) have actions I could take myself.
"""
from _kit import explain, step, opt, q, action, part, word, home

LESSON = {
    "slug": "me-and-others",
    "title": "Me and Others",
    "blurb": "What you do reaches other people. Predict what your action does to a classmate, watch it happen, then suggest something YOU could do about a problem of your own.",
    "steps": [
        step("demo", "What I do reaches you", "\U0001F465", "Reaches others", ["2Ac.01"],
             "Last year you learned what happens to YOU. Now: what happens to OTHERS. Press <b>Next</b>.",
             explain(
                 ["When you do something, it happens to other people too.", "That is a consequence for others."],
                 ["You talk during the story. You miss the story. That is a consequence for you.",
                  "Nora, next to you, cannot hear it either. That is a consequence for Nora."],
                 ["Children think their actions only touch them.", "In a classroom, nearly everything you do reaches somebody else."],
                 ["Press Next and watch who it reaches."]),
             {"frames": [
                 {"pic": "\U0001F4D6", "cap": "Teacher Yasmin is reading the story.", "say": "Teacher Yasmin is reading the story."},
                 {"pic": "\U0001F5E3️", "cap": "Omar starts <b>talking</b> to Sami.", "say": "Omar starts talking to Sami.", "sound": "chatter"},
                 {"pic": "\U0001F466\U0001F3FD", "cap": "Omar misses the story. That is what happens to <b>Omar</b>.", "say": "Omar misses the story. That is what happens to Omar.", "sound": "thud"},
                 {"pic": "\U0001F467\U0001F3FD", "cap": "Nora, next to him, cannot hear it either. That is what happens to <b>Nora</b>.", "say": "But Nora, sitting next to him, cannot hear the story either. That is what happens to Nora. Omar's action reached her.", "sound": "thud"},
                 {"pic": "\U0001F465", "cap": "What you do <b>reaches other people</b>. Think about them too.", "say": "What you do reaches other people. Before you do something, think about them too.", "sound": "tada"},
             ]},
             "What you do reaches other people, not just you."),

        step("consequence", "What happens to them?", "\U0001F52E", "Others predictor", ["2Ac.01"],
             "You do something. Predict what happens to the OTHER person, then see.",
             explain(
                 ["Before you act, ask: what will this do to the person next to me?"],
                 ["You leave the tap running. The next person finds a wet floor and slips.",
                  "You put your coat on the peg. The next person finds room for theirs."],
                 ["Children only predict the bad ones.", "Kind actions reach people too."],
                 ["Read what you do, tap what happens to them, then see."]),
             {"rounds": [
                 {"situation": "You leave your bag in the middle of the classroom floor.", "pic": "\U0001F392",
                  "predict": {"ask": "What happens to the next person walking past?", "opts": [opt("They trip over it", True), opt("They get a new bag", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F915", "say": "Hana tripped over your bag and dropped her paints.", "sound": "thud"},
                  "why": "A bag on the floor is in everybody's way, not only yours."},
                 {"situation": "You share your glue when Tariq's runs out.", "pic": "\U0001F9F4",
                  "predict": {"ask": "What happens to Tariq?", "opts": [opt("He can finish his model", True), opt("He has to stop", False), opt("He gets cross", False)]},
                  "result": {"pic": "\U0001F60A", "say": "Tariq finished his model and said thank you.", "sound": "ding"},
                  "why": "Your sharing reached Tariq: he could finish."},
                 {"situation": "You talk loudly while Amal is reading to the class.", "pic": "\U0001F4E2",
                  "predict": {"ask": "What happens to Amal?", "opts": [opt("Nobody can hear her and she feels upset", True), opt("She reads faster", False), opt("She gets a prize", False)]},
                  "result": {"pic": "\U0001F61F", "say": "Nobody could hear Amal. She stopped reading and looked sad.", "sound": "thud"},
                  "why": "Your noise reached Amal and the whole class."},
                 {"situation": "You put the pencils back in the pot after art.", "pic": "✏️",
                  "predict": {"ask": "What happens to the next class?", "opts": [opt("They find the pencils ready to use", True), opt("They have no pencils", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F60A", "say": "The next class found every pencil in the pot and started straight away.", "sound": "ding"},
                  "why": "Tidying up reaches people you never even see."},
                 {"situation": "You push in front of Sami in the lunch queue.", "pic": "\U0001F6B7",
                  "predict": {"ask": "What happens to Sami?", "opts": [opt("He waits longer and feels it is unfair", True), opt("He gets his lunch first", False), opt("He does not mind", False)]},
                  "result": {"pic": "\U0001F620", "say": "Sami had to wait longer, and he felt it was unfair.", "sound": "thud"},
                  "why": "Pushing in takes Sami's place. It reaches him."},
             ]},
             "Five things you might do, and what each one did to somebody else."),

        step("sort", "Helps others, or hurts others?", "\U0001F914", "Others sorter", ["2Ac.01"],
             "Think about what it does to OTHER people. Does it help them, or hurt them?",
             explain(
                 ["Some actions make things better for the people around you.", "Some make things worse for them."],
                 ["Holding the door: the person behind you gets through. Helps.", "Leaving crumbs on the table: the next person sits in crumbs. Hurts."],
                 [],
                 ["Think about the other person, then tap the bin."]),
             {"ask": "What does it do to other people?",
              "bins": [{"id": "help", "label": "Helps others", "pic": "\U0001F60A"}, {"id": "hurt", "label": "Hurts others", "pic": "\U0001F61F"}],
              "items": [
                  {"pic": "\U0001F6AA", "label": "holding the door open", "bin": "help", "why": "The person behind you gets through easily."},
                  {"pic": "\U0001F35E", "label": "leaving crumbs on the table", "bin": "hurt", "why": "The next person has to sit in your crumbs."},
                  {"pic": "\U0001F91D", "label": "letting Nora go first", "bin": "help", "why": "Nora gets her turn and feels good."},
                  {"pic": "\U0001F4E2", "label": "shouting across the room", "bin": "hurt", "why": "Nobody else can hear or think."},
                  {"pic": "\U0001F9F9", "label": "wiping up your spill", "bin": "help", "why": "Nobody slips on it later."},
                  {"pic": "\U0001F58D️", "label": "taking all the crayons", "bin": "hurt", "why": "Everybody else has none."},
              ]},
             "You can tell what an action does to other people before you do it."),

        step("solve", "Something I could do", "\U0001F4AA", "Action suggester", ["2As.01"],
             "Here is a problem YOU have. Suggest something you could do about it yourself. Tap one and see what happens.",
             explain(
                 ["This year you do not just pick from a list.", "You suggest an action of your own that would make a difference to YOUR problem."],
                 ["I keep forgetting my reading book.", "I could put it in my bag the night before. That fixes it.",
                  "I could ask the teacher to remember for me. That is the teacher's action, not mine. Asking a grown-up for help is always all right, but this one I can fix myself."],
                 ["Children pick the action where somebody else does the work.", "It has to be something YOU do."],
                 ["Tap an action. If it does not fix your problem, try another."]),
             {"rounds": [
                 {"issue": {"title": "I keep forgetting my reading book", "pic": "\U0001F4D5", "say": "Every Monday it is still at home. What could I do?", "fixed": "My book comes to school every day!"},
                  "needs": "remember",
                  "actions": [
                      action("bag", "I could put it in my bag the night before", "\U0001F392", "remember", "You packed it at bedtime. On Monday it was in your bag."),
                      action("teacher", "I could ask the teacher to remember for me", "\U0001F469\U0001F3FE‍\U0001F3EB", "nothing", "The teacher cannot pack your bag at your house, so the book stayed at home. Asking for help is always all right. This one you can fix yourself."),
                      action("hide", "I could hide it under my bed", "\U0001F6CF️", "worse", "Now it is even harder to find."),
                      action("wish", "I could wish really hard", "\U0001F31F", "nothing", "You wished. The book did not move."),
                  ],
                  "why": "Packing it the night before is YOUR action, and it fixes YOUR problem."},
                 {"issue": {"title": "I am always last to be ready for PE", "pic": "\U0001F45F", "say": "My laces take for ever. What could I do?", "fixed": "I am ready with everyone else!"},
                  "needs": "quicker",
                  "actions": [
                      action("practise", "I could practise my laces at home every day", "\U0001F45F", "quicker", "After a week of practice your laces took one minute."),
                      action("skip", "I could skip PE", "\U0001F6AB", "worse", "Now you miss PE altogether. That is worse."),
                      action("wait", "I could wait for somebody to tie them for me", "⏳", "nothing", "You waited. Everyone else went to PE without you."),
                      action("shout", "I could shout that it is not fair", "\U0001F4E2", "nothing", "You shouted. The laces stayed untied."),
                  ],
                  "why": "Practising is YOUR action, and it makes YOU quicker."},
                 {"issue": {"title": "I never have a pencil when I need one", "pic": "✏️", "say": "They keep going missing. What could I do?", "fixed": "I always have a pencil!"},
                  "needs": "keep",
                  "actions": [
                      action("case", "I could keep two pencils in a pencil case with my name on", "\U0001F392", "keep", "Two named pencils in a case. You always had one."),
                      action("borrow", "I could take Sami's pencil when he is not looking", "\U0001F648", "worse", "Now Sami has no pencil, and he is cross with you."),
                      action("wait", "I could wait for somebody to give me one", "⏳", "nothing", "Somebody lent you one, but only for today. Tomorrow there was no pencil again."),
                      action("nothing", "I could do nothing and hope", "\U0001F937", "nothing", "You hoped. Tomorrow there was still no pencil."),
                  ],
                  "why": "A named pencil case is YOUR action, and it keeps YOUR pencils."},
                 {"issue": {"title": "I get tired and grumpy after lunch", "pic": "\U0001F971", "say": "Every afternoon I cannot think. What could I do?", "fixed": "I feel awake in the afternoon!"},
                  "needs": "rest",
                  "actions": [
                      action("bed", "I could go to bed on time, without asking to stay up", "\U0001F6CF️", "rest", "Bed on time every night, and the afternoons felt fine."),
                      action("sweets", "I could eat more sweets at lunch", "\U0001F36C", "worse", "The sweets did not help. You were still tired."),
                      action("blame", "I could say the lessons are boring", "\U0001F644", "nothing", "Saying that did not make you less tired."),
                      action("home", "I could go home at lunchtime", "\U0001F3E0", "nothing", "You cannot go home at lunch. Still tired."),
                  ],
                  "why": "Going to bed on time is YOUR action, and it fixes YOUR tiredness."},
             ]},
             "Four problems of your own, and an action of your own for each one."),

        step("explore", "My action, my difference", "\U0001F4AA", "Action spotter", ["2As.01", "2Ac.01"],
             "An action of your own can make a difference. Tap each one.",
             explain(
                 ["A personal action is something YOU can do, without waiting for somebody else."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F392", "label": "pack my bag at night", "say": "Pack my bag at night. Then nothing is forgotten in the morning."},
                 {"pic": "\U0001F45F", "label": "practise my laces", "say": "Practise my laces. Then I am ready with everyone else."},
                 {"pic": "✏️", "label": "keep spare pencils", "say": "Keep spare pencils in a named case. Then I always have one."},
                 {"pic": "\U0001F6CF️", "label": "go to bed on time", "say": "Go to bed on time. Then I am not grumpy after lunch."},
                 {"pic": "\U0001F4A7", "label": "bring a water bottle", "say": "Bring a water bottle. Then I am not thirsty in the afternoon."},
                 {"pic": "\U0001F5D3️", "label": "check the timetable", "say": "Check the timetable the night before. Then I know when it is PE."},
             ], "need": 6,
              "then": {"ask": "Which of these is an action YOU can take yourself?",
                       "opts": [opt("Pack my bag at night", True), opt("Ask the teacher to pack it", False), opt("Hope it is there", False)],
                       "why": "Packing your own bag is something you do. Nobody else has to."}},
             "Six actions of your own, each making a difference to a problem of your own."),

        step("questions", "Others, and my own actions", "\U0001F4AC", "Action judge", ["2Ac.01", "2As.01"],
             "Think about consequences for others, and your own actions. Tap the answer.",
             explain(
                 ["What you do reaches others.", "A problem of your own has an action of your own."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("You leave your bag on the floor. What happens to the next person?", "\U0001F392", "they trip over it", ["they get a bag", "nothing"], "Your bag is in their way."),
                 q("You share your glue with Tariq. What happens to Tariq?", "\U0001F9F4", "he can finish his model", ["he has to stop", "he loses his glue"], "Your sharing reached him."),
                 q("I keep forgetting my reading book. Which action is MINE to take?", "\U0001F4D5", "pack it the night before", ["ask the teacher to remember", "wish hard"], "Packing your own bag is your action. Asking the teacher is all right too, but she cannot pack your bag at home."),
                 q("Why think about others before you act?", "\U0001F465", "because what you do reaches them", ["because it is a rule", "you do not need to"], "Nearly everything you do in a classroom reaches somebody."),
             ]},
             "You think about others, and you suggest your own actions."),

        step("quiz", "Show what you know", "⭐", "Star thinker", ["2Ac.01", "2As.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Omar talked during the story. What happened to NORA?", "\U0001F467\U0001F3FD", "she could not hear the story", ["she got a prize", "nothing", "she fell asleep"], "Omar's noise reached Nora."),
                 q("You talk loudly while Amal reads. What happens to Amal?", "\U0001F4E2", "nobody can hear her and she feels upset", ["she reads faster", "she wins", "nothing"], "Your noise reached Amal."),
                 q("Which action HELPS other people?", "\U0001F60A", "holding the door open", ["leaving crumbs", "shouting across the room", "taking all the crayons"], "The person behind you gets through."),
                 q("I am always last for PE. Which action is MINE?", "\U0001F45F", "practise my laces at home", ["skip PE", "wait for somebody to tie them", "shout"], "Practising is something you do."),
                 q("What is a personal action?", "\U0001F4AA", "something you can do yourself", ["something the teacher does", "a rule", "a wish"], "You do it, without waiting for somebody else."),
                 q("I get grumpy after lunch. Which action fixes it?", "\U0001F971", "go to bed on time", ["eat more sweets", "say lessons are boring", "go home"], "More sleep, less grumpy."),
                 q("You put the pencils back in the pot. Who does that reach?", "✏️", "the next class", ["nobody", "only you", "the pencils"], "Tidying reaches people you never see."),
                 q("Before you do something in class, what can you ask?", "\U0001F914", "what will this do to the person next to me?", ["what is for lunch?", "nothing", "who is watching?"], "Thinking about others is the skill."),
             ]},
             "That is the whole lesson finished. You think about others, and you take your own actions."),
    ],
}


LESSON["about"] = [
    "Say what an action of yours does to another person.",
    "Predict what will happen to somebody else before you act.",
    "Tell an action that helps others from one that hurts them.",
    "Suggest an action of your own that would fix a problem of your own.",
]

LESSON["lecture"] = [
    part("\U0001F4D6", "Omar and Nora",
         "Omar talked during the story. He missed it, and that happened to Omar. But Nora, next to him, could not hear it either. Omar's action reached Nora."),
    part("\U0001F465", "Consequences for others",
         "What you do reaches other people. A bag on the floor trips the next person. Shared glue lets Tariq finish. Before you act, ask: what will this do to the person next to me?"),
    part("\U0001F914", "Helps or hurts",
         "Some actions make things better for the people around you: holding the door, letting Nora go first, wiping up your spill. Some make things worse: shouting, crumbs, taking all the crayons."),
    part("\U0001F4AA", "My own action",
         "When you have a problem of your own, suggest an action of your own. I keep forgetting my book: I could pack it the night before. Asking the teacher to remember is the teacher's action, and she cannot pack your bag at home. Asking a grown-up for help is always all right; this one you can fix yourself."),
    part("\U0001F31F", "Making a difference",
         "A personal action is something you can do without waiting for anybody. Practise your laces. Keep spare pencils. Go to bed on time. Small actions, real differences."),
]

LESSON["words"] = [
    word("consequence", "➡️", "What happens because of what somebody did.",
         ["Nora missing the story was a consequence of Omar's talking.", "Think about the consequence for others."]),
    word("others", "\U0001F465", "The other people around you.",
         ["What you do reaches others.", "Think about others first."]),
    word("action", "\U0001F4AA", "Something you do.",
         ["Packing my bag is an action.", "Suggest an action of your own."]),
    word("personal", "\U0001F9D1", "Your own; something you do yourself.",
         ["A personal action is one you take yourself.", "It is my personal problem, and my personal action."]),
    word("difference", "\U0001F31F", "A change that makes something better or worse.",
         ["My action made a difference.", "Going to bed on time made a big difference."]),
    word("suggest", "\U0001F4A1", "To say an idea for what could be done.",
         ["Suggest an action for your problem.", "I suggest packing my bag at night."]),
]

LESSON["home"] = [
    home("Who does it reach?", "Everyone at home, for one evening",
         ["When you do something, say out loud who it reaches: I put my shoes away, so nobody trips.",
          "Catch one thing that reached somebody in a bad way, and one in a good way.",
          "Tell everyone at dinner."],
         "Did anything you did today reach somebody you did not see?"),
    home("My own problem, my own action", "A grown-up and a small problem of yours",
         ["Name a small problem you have: losing socks, forgetting your water bottle.",
          "Suggest three actions YOU could take. Not ones for your grown-up.",
          "Pick one and do it for a week."],
         "Did your action make a difference?"),
    home("Help spotting", "A grown-up and a walk to the shops",
         ["Spot three things people do that help others: holding a door, moving aside, tidying.",
          "Spot one thing that hurts others.",
          "Say what each one did to the other people."],
         "Which helpful thing was the smallest? Did it still matter?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "how to bake bread", "the names of the planets"],
}

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("You leave your toys on the stairs. What might happen to somebody else?", "\U0001F9F8", "they might trip over them", ["they get a present", "nothing, ever"], "Toys on the stairs can make somebody trip. What you do reaches other people."),
    q("Your friend looks sad at playtime. What could you do?", "\U0001F622", "ask them to play with you", ["laugh at them", "run away"], "Asking them to play is an action that can help."),
]
