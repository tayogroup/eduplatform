# -*- coding: utf-8 -*-
"""Lesson 5 - Shared Spaces.

0838 Stage 4 Analysis: 4Ac.01 talk about simple causes of personal actions
and consequences on others; 4As.01 suggest personal actions that could make
a positive difference to an issue affecting others. The topic is the spaces
we share: the lunch queue, the library, the assembly hall, the street - where
what one child does for a small reason reaches other people, and where one
child's action can change a problem that belongs to somebody else.
"""
from _kit import explain, step, opt, q, action, part, word, home

LESSON = {
    "slug": "shared-spaces",
    "title": "Shared Spaces",
    "blurb": "In a shared space, what you do for a small reason reaches other people. Find the cause behind an action and its consequence for others in the lunch queue, the library and the hall, then suggest actions of your own for problems that belong to somebody else.",
    "steps": [
        step("demo", "Small cause, shared consequence", "\U0001F517", "Chain spotter", ["4Ac.01"],
             "In a shared space a small cause can have a consequence for a lot of people. Press <b>Next</b> and follow the chain.",
             explain(
                 ["A cause is the reason you did something. A consequence is what it did to somebody else.", "In a shared space the consequence reaches more people than you meant."],
                 ["Hana wanted the window seat, so she pushed to the front of the lunch queue. The cause: wanting the seat.",
                  "The Grade 1 behind her dropped his tray. The consequence, for him, and for the dinner staff who cleaned it up."],
                 ["Children see only the person right next to them.", "Ask who ELSE the chain reached."],
                 ["Press Next and follow the chain."]),
             {"frames": [
                 {"pic": "\U0001F4BA", "cap": "<b>Cause:</b> Hana wanted the seat by the window.", "say": "The cause. Hana wanted the seat by the window before anyone else got it."},
                 {"pic": "\U0001F3C3", "cap": "<b>Action:</b> so she pushed to the front of the lunch queue.", "say": "The action. So she pushed to the front of the lunch queue.", "sound": "pop"},
                 {"pic": "\U0001F4A5", "cap": "<b>Consequence:</b> a Grade 1 behind her dropped his tray, and dinner was late for the whole queue.", "say": "The consequence for others. A Grade 1 behind her lost his balance and dropped his tray. The dinner staff stopped to clean it, and everyone behind waited longer.", "sound": "thud"},
                 {"pic": "\U0001F914", "cap": "One small cause, and the chain reached <b>twenty people</b>.", "say": "One small cause, one push, and the chain reached twenty people who had nothing to do with the window seat.", "sound": "ding"},
                 {"pic": "\U0001F517", "cap": "In a shared space, <b>find the cause</b> and you change what happens to everyone.", "say": "In a shared space, find the cause, and you change what happens to everyone.", "sound": "tada"},
             ]},
             "In a shared space a small cause reaches many people. Find the cause."),

        step("consequence", "Why did you do it, and who did it reach?", "\U0001F517", "Chain follower", ["4Ac.01"],
             "For each action in a shared space: first say the CAUSE, then predict the consequence for somebody else, then see it.",
             explain(
                 ["First the cause: why did you do it?", "Then the consequence: who did it reach, and what did it do to them?"],
                 ["You put the library book back in the wrong place because you were in a hurry. Nora could not find it for her project."],
                 ["Children pick the cause that sounds kind instead of the true one.", "The true cause is the one the story tells you."],
                 ["Read the situation, tap the cause, tap the consequence, then see what happened."]),
             {"rounds": [
                 {"situation": "You were in a hurry to get to football, so you shoved the library book back on any shelf.", "pic": "\U0001F4DA",
                  "cause": {"ask": "What was the CAUSE of putting the book in the wrong place?", "opts": [opt("You were in a hurry to get to football", True), opt("You did not like the book", False), opt("The shelf was full", False)], "why": "The story tells you: the hurry, not the book."},
                  "predict": {"ask": "What did it do to somebody else?", "opts": [opt("Nora could not find the book for her project", True), opt("The book got longer", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F615", "say": "Nora searched the whole library for twenty minutes and had to do her project without it.", "sound": "thud"},
                  "why": "The cause was your hurry. Two seconds at the right shelf would have changed Nora's afternoon."},
                 {"situation": "You saw Mr Ali's bins had blown over in the wind, so you stood them up and picked up the rubbish.", "pic": "\U0001F5D1️",
                  "cause": {"ask": "What was the CAUSE of picking up the rubbish?", "opts": [opt("You saw the bins had blown over", True), opt("You were told off", False), opt("You wanted to be late", False)], "why": "You noticed the bins. That was the cause."},
                  "predict": {"ask": "What did it do to Mr Ali?", "opts": [opt("He did not have to bend down and do it himself", True), opt("He was cross", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F60A", "say": "Mr Ali, who is eighty, came out to a tidy path and did not have to bend for a single wrapper.", "sound": "ding"},
                  "why": "A good cause, a good action, a good consequence for a neighbour."},
                 {"situation": "You were bored in assembly, so you whispered jokes to Tariq.", "pic": "\U0001F971",
                  "cause": {"ask": "What was the CAUSE of the whispering?", "opts": [opt("You were bored", True), opt("Tariq asked you to", False), opt("The hall was cold", False)], "why": "Boredom was the cause. Tariq did not ask."},
                  "predict": {"ask": "Who did it reach?", "opts": [opt("The Grade 2s in front could not hear the story, and Tariq got told off", True), opt("Everyone laughed", False), opt("Nobody", False)]},
                  "result": {"pic": "\U0001F61F", "say": "The Grade 2s in front missed the end of the story, and Tariq was the one sent to sit at the side.", "sound": "thud"},
                  "why": "Your boredom reached a row of Grade 2s and landed on Tariq."},
                 {"situation": "You had two spare pencils, so you gave one to the new boy who had none.", "pic": "✏️",
                  "cause": {"ask": "What was the CAUSE of giving him a pencil?", "opts": [opt("You had two spare and he had none", True), opt("The teacher made you", False), opt("You wanted his rubber", False)], "why": "You had spare and he had none. That was the cause."},
                  "predict": {"ask": "What did it do to him?", "opts": [opt("He could start the work with everyone else", True), opt("He lost his place", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F60A", "say": "He started the maths with everyone else instead of waiting for a pencil to be found.", "sound": "ding"},
                  "why": "Noticing was the cause. One pencil, and his whole lesson went differently."},
             ]},
             "Four chains followed: the cause, the action, and who it reached."),

        step("sort", "Which cause could you change?", "\U0001F527", "Cause changer", ["4Ac.01"],
             "Here are causes of actions. Could YOU change this cause, or is it outside your control?",
             explain(
                 ["Some causes are yours to change: being in a hurry, being bored, wanting the best seat.", "Some are not: the wind, the fire drill, a broken bus."],
                 [],
                 [],
                 ["Read the cause, then tap the bin."]),
             {"ask": "Could you change this cause?",
              "bins": [{"id": "mine", "label": "I could change it", "pic": "\U0001F527"}, {"id": "not", "label": "Outside my control", "pic": "\U0001F32C️"}],
              "items": [
                  {"pic": "⏱️", "label": "I was in a hurry to get to football", "bin": "mine", "why": "Leaving two minutes earlier is yours to choose."},
                  {"pic": "\U0001F32C️", "label": "the wind blew the bins over", "bin": "not", "why": "Nobody controls the wind."},
                  {"pic": "\U0001F971", "label": "I was bored in assembly", "bin": "mine", "why": "Listening for one thing to remember changes it."},
                  {"pic": "\U0001F6A8", "label": "the fire alarm went off for a drill mid-lesson", "bin": "not", "why": "That is not yours to change."},
                  {"pic": "\U0001F4BA", "label": "I wanted the window seat", "bin": "mine", "why": "You can decide the seat is not worth pushing for. That is yours to change."},
                  {"pic": "\U0001F68C", "label": "the bus broke down on the way to the trip", "bin": "not", "why": "The bus is outside your control."},
              ]},
             "You know which causes are yours to change."),

        step("solve", "An action for somebody else's problem", "\U0001F4AA", "Action suggester", ["4As.01"],
             "These problems belong to other people in our shared spaces. Suggest an action YOU could take that would make a positive difference to THEM.",
             explain(
                 ["The problem is somebody else's. The action is still yours.", "It has to be something you do. Telling a grown-up counts; hoping one notices does not."],
                 ["Hana cannot see the board from the back row. Swap seats with her. That is your action, and it changes her lesson."],
                 ["Children hope somebody else will notice.", "Do something yourself. Telling a grown-up counts."],
                 ["Tap an action. If it does not help them, try another."]),
             {"rounds": [
                 {"issue": {"title": "Hana cannot see the board from the back row", "pic": "\U0001F453", "say": "Her new glasses are not ready yet. What could YOU do?", "fixed": "Hana can see every word!"},
                  "needs": "view",
                  "actions": [
                      action("swap", "I could swap seats with her until her glasses come", "\U0001FA91", "view", "You swapped. Hana read the whole board and finished the task first."),
                      action("teacher", "I could tell the teacher that Hana cannot see the board", "\U0001F469\U0001F3FE‍\U0001F3EB", "view", "You told the teacher. She moved Hana to the front."),
                      action("read", "I could shout the board out loud to her", "\U0001F4E2", "worse", "Now nobody could concentrate, and Hana still could not see."),
                      action("wait", "I could wait until her glasses arrive", "⏳", "nothing", "Two weeks of lessons she could not see."),
                  ],
                  "why": "Swapping seats, or telling the teacher, is your action, and it changes Hana's lesson today."},
                 {"issue": {"title": "The caretaker cannot get his trolley past the bikes dumped on the path", "pic": "\U0001F6B2", "say": "Bikes lie across the path every morning. What could YOU do?", "fixed": "The path is clear for the trolley."},
                  "needs": "space",
                  "actions": [
                      action("rack", "I could put my bike in the rack and ask my friends to do the same", "\U0001F6B2", "space", "You racked yours and three friends followed. The trolley rolled straight through."),
                      action("sign", "I could hope somebody puts a sign up", "\U0001F6AB", "nothing", "No sign came. The bikes stayed."),
                      action("blame", "I could say it is the Grade 6s' bikes, not ours", "\U0001F937", "nothing", "Every class said that. The path stayed blocked."),
                      action("kick", "I could kick the bikes out of the way", "\U0001F9B6", "worse", "Two bikes got scratched and their owners were upset."),
                  ],
                  "why": "Racking your own bike, and asking friends, is your action, and it clears the path."},
                 {"issue": {"title": "The Grade 2s lose their ball over the fence every playtime", "pic": "⚽", "say": "They are too small to get it back. What could YOU do?", "fixed": "The Grade 2s have their ball back."},
                  "needs": "return",
                  "actions": [
                      action("fetch", "I could ask a teacher to come with me and fetch it back", "\U0001F91D", "return", "You and Teacher Yasmin fetched it in two minutes. The Grade 2s finished their game."),
                      action("laugh", "I could laugh at how bad their kicking is", "\U0001F602", "worse", "They felt small AND had no ball."),
                      action("ignore", "I could decide it is not my problem", "\U0001F648", "nothing", "You decided it was not your problem. Their ball is still over the fence."),
                      action("keep", "I could get it and keep it for our game", "\U0001F3C3", "worse", "Now they had no ball and knew who had it."),
                  ],
                  "why": "Fetching it, with a grown-up, is your action, and it gives the Grade 2s their game back."},
                 {"issue": {"title": "The librarian cannot keep up with the jumbled shelves", "pic": "\U0001F4DA", "say": "Books are put back anywhere, and she works alone. What could YOU do?", "fixed": "One shelf is in perfect order every day."},
                  "needs": "order",
                  "actions": [
                      action("tidy", "I could tidy one shelf every lunchtime", "\U0001F4DA", "order", "One shelf a day. By Friday the whole fiction wall was in order."),
                      action("complain", "I could complain that the library is a mess", "\U0001F621", "worse", "The librarian felt worse, and the shelves stayed jumbled."),
                      action("helper", "I could hope the school hires another librarian", "\U0001F4B0", "nothing", "No money for that. The shelves stayed jumbled."),
                      action("avoid", "I could stop using the library", "\U0001F6AA", "nothing", "One fewer reader, and the same jumble."),
                  ],
                  "why": "Tidying a shelf a day is your action, and it makes a real difference to the librarian."},
             ]},
             "Four problems that were somebody else's, four actions of your own that helped."),

        step("explore", "Small actions in shared spaces", "\U0001F31F", "Difference maker", ["4As.01"],
             "Six actions a child can take for somebody else in a shared space. Tap each one.",
             explain(
                 ["A positive difference does not need to be big.", "It needs to be yours, and for them."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001FA91", "label": "swap seats", "say": "Swap seats with someone who cannot see. Their lesson changes."},
                 {"pic": "\U0001F6B2", "label": "rack your bike", "say": "Rack your bike, and ask friends to. The caretaker's path is clear."},
                 {"pic": "\U0001F4DA", "label": "tidy one shelf", "say": "Tidy one shelf a day. The librarian's week changes."},
                 {"pic": "⚽", "label": "fetch the ball", "say": "Fetch the little ones' ball, with a grown-up. Their game goes on."},
                 {"pic": "\U0001F6AA", "label": "hold the door", "say": "Hold the door for the person carrying the box."},
                 {"pic": "\U0001F5D1️", "label": "stand the bins up", "say": "Stand a neighbour's blown-over bins up. They do not have to bend."},
             ], "need": 6,
              "then": {"ask": "Which of these is an action YOU could take for somebody else?",
                       "opts": [opt("Tidy one library shelf every lunchtime", True), opt("Hope the school hires another librarian", False), opt("Say the shelves are the Grade 6s' fault", False)],
                       "why": "Tidying a shelf is yours to do, today."}},
             "Six small actions, six differences for somebody else."),

        step("questions", "Causes and actions", "\U0001F4AC", "Cause judge", ["4Ac.01", "4As.01"],
             "Think about causes, consequences and your actions. Tap the answer.",
             explain(
                 ["Find the cause. See who the consequence reached. Suggest your own action for their problem."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Hana pushed to the front of the queue. What was the CAUSE?", "\U0001F4BA", "she wanted the window seat", ["the Grade 1 pushed her", "the queue was short"], "Wanting the seat was why she pushed."),
                 q("You whispered in assembly because you were bored. Who did it reach?", "\U0001F971", "the Grade 2s who could not hear, and Tariq who got told off", ["nobody", "only you"], "In a shared space the chain reaches more people."),
                 q("Hana cannot see the board. Which action is YOURS?", "\U0001FA91", "swap seats with her", ["tell her to squint harder", "wait for her glasses"], "Swapping is something you do. Telling the teacher helps too."),
                 q("Which cause could you change?", "\U0001F527", "I was in a hurry to get to football", ["the wind blew the bins over", "the fire drill"], "Leaving earlier is yours to choose."),
             ]},
             "You find causes, see who a consequence reaches, and act for them."),

        step("quiz", "Show what you know", "⭐", "Star thinker", ["4Ac.01", "4As.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a cause?", "\U0001F517", "the reason you did something", ["what happened after", "a kind of action", "a shared space"], "Hana's cause was wanting the seat."),
                 q("Why does a consequence in a shared space matter more?", "\U0001F465", "it reaches more people than you meant", ["it does not matter", "shared spaces are bigger", "because of the rules"], "One push reached twenty people."),
                 q("Why did Nora not find the library book?", "\U0001F4DA", "it was shoved on the wrong shelf by someone in a hurry", ["it was lost forever", "she did not look", "it was never in the library"], "The cause was a hurry."),
                 q("What did standing the bins up do for Mr Ali?", "\U0001F5D1️", "he did not have to bend down and do it himself", ["nothing", "he was cross", "he had to buy new bins"], "A good consequence for a neighbour."),
                 q("Which problem is somebody ELSE'S?", "⚽", "the Grade 2s lose their ball over the fence", ["I keep losing my pencil", "I am hungry", "my laces are undone"], "Their problem, and your action."),
                 q("The bikes block the caretaker's path. Which action is YOURS?", "\U0001F6B2", "rack my bike and ask my friends to", ["hope for a sign", "say it is the Grade 6s' bikes", "kick them out of the way"], "Something you do, that helps him."),
                 q("Which cause is OUTSIDE your control?", "\U0001F32C️", "the wind blew the bins over", ["I was bored", "I was in a hurry", "I wanted the window seat"], "Nobody controls the wind."),
                 q("Why find the cause?", "\U0001F527", "because changing the cause changes what happens to everyone", ["to blame somebody", "you do not need to", "to make it longer"], "Leave earlier, no hurry, the book on the right shelf."),
             ]},
             "That is the whole lesson finished. You find causes, follow who a consequence reaches, and act for other people."),
    ],
}


LESSON["about"] = [
    "Say the cause behind an action, and who its consequence reached.",
    "Say that in a shared space a consequence reaches more people than you meant.",
    "Tell a cause you could change from one outside your control.",
    "Suggest an action of your own for a problem that belongs to somebody else.",
]

LESSON["lecture"] = [
    part("\U0001F4BA", "One push in the queue",
         "Hana wanted the window seat, so she pushed to the front of the lunch queue. A Grade 1 dropped his tray, the dinner staff stopped to clean it, and twenty people waited longer. One small cause, and the chain reached the whole queue."),
    part("\U0001F517", "Cause, action, consequence",
         "The cause is why you did it. The action is what you did. The consequence is what it did to somebody else. In a shared space, ask who ELSE the chain reached."),
    part("\U0001F527", "Causes you can change",
         "Being in a hurry, being bored, wanting the best seat: yours to change. The wind, the fire drill, a broken bus: not yours. Find the ones that are yours."),
    part("\U0001F4AA", "An action for somebody else",
         "Hana cannot see the board: swap seats. The bikes block the caretaker: rack yours and ask friends. The Grade 2s lose their ball: fetch it with a grown-up. The librarian cannot keep up: tidy a shelf a day. Their problem, your action."),
    part("\U0001F31F", "Small, and yours",
         "Each is something you can do today, and each one changes somebody else's day."),
]

LESSON["words"] = [
    word("cause", "\U0001F517", "The reason something happened.",
         ["The cause of the push was wanting the seat.", "Find the cause first."]),
    word("consequence", "➡️", "What happens because of an action.",
         ["The consequence reached twenty people.", "Every action has a consequence."]),
    word("shared space", "\U0001F465", "A place many people use together: a queue, a library, a hall, a street.",
         ["The lunch queue is a shared space.", "In a shared space your actions reach others."]),
    word("control", "\U0001F527", "Being able to change or decide something.",
         ["The wind is outside my control.", "My hurry is within my control."]),
    word("positive difference", "\U0001F31F", "A change that makes things better for somebody.",
         ["Swapping seats made a positive difference to Hana.", "Suggest an action that makes a positive difference."]),
    word("issue", "❗", "A problem that affects people.",
         ["The blocked path is an issue for the caretaker.", "An issue affecting others."]),
]

LESSON["home"] = [
    home("Follow the chain", "A grown-up",
         ["Tell your grown-up about something you did today in a shared space.",
          "Say the cause: why you did it.",
          "Say who the consequence reached, beyond the person next to you."],
         "Did the chain reach further than you thought?"),
    home("Causes I can change", "Paper and a pencil",
         ["Write three causes of things you did this week that did not go well.",
          "Circle the ones that were yours to change.",
          "Choose one and say what you will do differently."],
         "Was the wind ever to blame, or was it mostly you?"),
    home("Somebody else's problem", "A grown-up and your street or block",
         ["Find one problem that belongs to a neighbour: bins, a gate, a heavy bag.",
          "Suggest an action YOU could take, with a grown-up if needed.",
          "Do it, and notice what it changed for them."],
         "Was it a big action or a small one?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "the names of the planets", "how to bake a cake"],
    "changed": [
        {"before": "What I do only affects the person next to me.", "after": "In a shared space one small cause can reach twenty people."},
        {"before": "Things just happen to me.", "after": "Many causes are mine to change: a hurry, boredom, wanting the best seat."},
        {"before": "Other people's problems are for grown-ups to fix.", "after": "I can take an action of my own, and tell a grown-up when it needs one."},
    ],
}
