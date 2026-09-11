# -*- coding: utf-8 -*-
"""Lesson 5 - Causes and Actions.

0838 Stage 3 Analysis: 3Ac.01 talk about simple causes of personal actions
and consequences on others; 3As.01 suggest personal actions that could make
a positive difference to an issue affecting others. The topic is our
classroom and our street: why we do what we do, what it does to the people
around us, and what one child could do about a problem that is somebody
else's.

Evaluation: 3Ea.01 express an opinion about another person's viewpoint,
giving reasons - a second application after Lesson 4, on the street's shared
problems.
"""
from _kit import explain, step, opt, q, action, part, word, home, tagged

LESSON = {
    "slug": "causes-and-actions",
    "title": "Causes and Actions",
    "blurb": "Why did you do it, and what did it do to somebody else? Find the cause behind an action and its consequence for others, then suggest actions of your own for problems that are other people's.",
    "steps": [
        step("demo", "Cause, action, consequence", "\U0001F517", "Chain spotter", ["3Ac.01"],
             "Every action has a CAUSE before it and a CONSEQUENCE after it. Press <b>Next</b> and see the chain.",
             explain(
                 ["A cause is the reason you did something.", "A consequence is what it did to somebody else.", "Cause, action, consequence: a chain."],
                 ["Tariq was late, so he ran down the corridor. The cause: being late. The action: running.",
                  "He knocked over Hana's model. The consequence, for Hana."],
                 ["Children see the action and the consequence and skip the cause.", "Ask WHY it happened. The cause is where you can change things."],
                 ["Press Next and follow the chain."]),
             {"frames": [
                 {"pic": "\U0001F552", "cap": "<b>Cause:</b> Tariq was late for class.", "say": "The cause. Tariq was late for class."},
                 {"pic": "\U0001F3C3", "cap": "<b>Action:</b> so he ran down the corridor.", "say": "The action. So he ran down the corridor.", "sound": "pop"},
                 {"pic": "\U0001F4A5", "cap": "<b>Consequence for others:</b> he knocked Hana's model off the table.", "say": "The consequence for others. He knocked Hana's model off the table, and it broke.", "sound": "thud"},
                 {"pic": "\U0001F914", "cap": "Change the <b>cause</b> and the chain changes. Leave earlier, no running, no broken model.", "say": "Change the cause and the whole chain changes. Leave home earlier, no need to run, and Hana's model is fine.", "sound": "ding"},
                 {"pic": "\U0001F517", "cap": "Cause, action, consequence. <b>Find the cause</b> and you can change what happens to others.", "say": "Cause, action, consequence. Find the cause, and you can change what happens to other people.", "sound": "tada"},
             ]},
             "Cause, action, consequence. Find the cause and you can change the chain."),

        step("consequence", "Why did you do it, and what did it do?", "\U0001F517", "Chain follower", ["3Ac.01"],
             "For each action: first say the CAUSE, then predict the consequence for somebody else, then see it.",
             explain(
                 ["First the cause: why did you do it?", "Then the consequence: what did it do to somebody else?"],
                 ["You shouted across the room. Why? Because you could not find your pencil.", "What did it do? Everybody lost their place in the story."],
                 ["Children pick a cause that sounds nice instead of the true one.", "The true cause is the one the story tells you."],
                 ["Read the situation, tap the cause, tap the consequence, then see what happened."]),
             {"rounds": [
                 {"situation": "You could not find your pencil, so you shouted across the room for one.", "pic": "\U0001F4E2",
                  "cause": {"ask": "What was the CAUSE of the shouting?", "opts": [opt("You could not find your pencil", True), opt("You wanted to sing", False), opt("You were happy", False)], "why": "The story tells you: no pencil, so you shouted."},
                  "predict": {"ask": "What did the shouting do to the others?", "opts": [opt("Everyone lost their place in the story", True), opt("Everyone got a pencil", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F615", "say": "Teacher Yasmin stopped reading, and everyone lost their place in the story.", "sound": "thud"},
                  "why": "The cause was a lost pencil. A spare in your case would have changed the whole chain."},
                 {"situation": "You had finished early, so you helped Sami with his sums.", "pic": "\U0001F91D",
                  "cause": {"ask": "What was the CAUSE of helping Sami?", "opts": [opt("You had finished early", True), opt("The teacher told you off", False), opt("It was raining", False)], "why": "You finished early, so you had time to help."},
                  "predict": {"ask": "What did it do to Sami?", "opts": [opt("He finished his sums and understood them", True), opt("He got confused", False), opt("He left the room", False)]},
                  "result": {"pic": "\U0001F60A", "say": "Sami finished all ten sums and said he understood them now.", "sound": "ding"},
                  "why": "A good cause, a good action, a good consequence for Sami."},
                 {"situation": "You stayed up after your bedtime, so you were tired and snapped at Nora when she asked to borrow your rubber.", "pic": "\U0001F971",
                  "cause": {"ask": "What was the CAUSE of snapping at Nora?", "opts": [opt("You stayed up after your bedtime", True), opt("Nora was rude", False), opt("You lost your rubber", False)], "why": "Staying up made you tired and grumpy. Nora only asked."},
                  "predict": {"ask": "What did it do to Nora?", "opts": [opt("She felt hurt and did not ask again", True), opt("She laughed", False), opt("She got a new rubber", False)]},
                  "result": {"pic": "\U0001F61F", "say": "Nora went quiet and did not ask you for anything for the rest of the day.", "sound": "thud"},
                  "why": "The cause was tiredness, not Nora. Going to bed when you are told changes this chain."},
                 {"situation": "You noticed the new girl standing alone at playtime, so you asked her to play tag.", "pic": "\U0001F3C3",
                  "cause": {"ask": "What was the CAUSE of asking her to play?", "opts": [opt("You noticed her standing alone", True), opt("You needed more players", False), opt("The teacher made you", False)], "why": "You noticed she was alone. That was the cause."},
                  "predict": {"ask": "What did it do to her?", "opts": [opt("She joined in and smiled all playtime", True), opt("She went home", False), opt("Nothing", False)]},
                  "result": {"pic": "\U0001F60A", "say": "She joined in, and by the end of playtime she was laughing.", "sound": "ding"},
                  "why": "Noticing was the cause. One small action, a big consequence for her."},
             ]},
             "Four chains followed: the cause, the action, and what it did to somebody else."),

        step("sort", "Which cause could you change?", "\U0001F527", "Cause changer", ["3Ac.01"],
             "Here are causes of actions. Could YOU change this cause, or is it outside your control?",
             explain(
                 ["Some causes are yours to change: staying up after bedtime, a lost pencil, being slow to get ready.", "Some are not: the weather, a fire alarm."],
                 [],
                 [],
                 ["Read the cause, then tap the bin."]),
             {"ask": "Could you change this cause?",
              "bins": [{"id": "mine", "label": "I could change it", "pic": "\U0001F527"}, {"id": "not", "label": "Outside my control", "pic": "\U0001F326️"}],
              "items": [
                  {"pic": "\U0001F319", "label": "staying up after bedtime made me grumpy", "bin": "mine", "why": "Going to bed when you are told, not staying up, is yours to do."},
                  {"pic": "\U0001F327️", "label": "the rain kept us indoors all day", "bin": "not", "why": "Nobody controls the rain."},
                  {"pic": "✏️", "label": "I could not find my pencil", "bin": "mine", "why": "Keeping it in your pencil case fixes that."},
                  {"pic": "\U0001F6A8", "label": "the fire alarm went off", "bin": "not", "why": "That is not yours to change."},
                  {"pic": "\U0001F552", "label": "I was slow getting ready", "bin": "mine", "why": "Getting ready the night before changes it."},
                  {"pic": "\U0001F68C", "label": "the bus broke down", "bin": "not", "why": "The bus is outside your control."},
              ]},
             "You know which causes are yours to change."),

        step("solve", "An action for somebody else's problem", "\U0001F4AA", "Action suggester", ["3As.01"],
             "These problems are other people's. Suggest an action YOU could take that would make a positive difference to THEM.",
             explain(
                 ["Last year the problem was yours. This year it is somebody else's, and the action is still yours."],
                 ["The new girl eats lunch alone. Sit with her. That is your action, and it changes her lunchtime.",
                  "Telling a teacher is good too. This time, find something YOU can do as well."],
                 ["Children only suggest what a grown-up could do.", "Telling a grown-up is good. Find something YOU can do as well."],
                 ["Tap an action. If it does not help them, try another."]),
             {"rounds": [
                 {"issue": {"title": "The new girl eats lunch alone every day", "pic": "\U0001F622", "say": "She does not know anyone yet. What could YOU do?", "fixed": "She has someone to eat with!"},
                  "needs": "company",
                  "actions": [
                      action("sit", "I could sit with her at lunch and ask about her old school", "\U0001F91D", "company", "You sat with her. She talked about her old school for the whole of lunch."),
                      action("smile", "I could smile at her from across the room", "\U0001F642", "nothing", "She smiled back, but she still ate alone."),
                      action("stare", "I could watch her from my table", "\U0001F440", "worse", "Being watched made her feel even more alone."),
                      action("wait", "I could wait for her to come to me", "⏳", "nothing", "She is new and shy. She did not come. Still alone."),
                  ],
                  "why": "Sitting with her is your action, and it changed her lunchtime."},
                 {"issue": {"title": "The class next door cannot hear their story over our noise", "pic": "\U0001F4E2", "say": "Their teacher has asked twice. What could YOU do?", "fixed": "Next door can hear their story."},
                  "needs": "quiet",
                  "actions": [
                      action("voice", "I could use my inside voice and remind my table to do the same", "\U0001F910", "quiet", "You kept your voice down and nudged your table. The wall went quiet."),
                      action("shut", "I could shout at everyone to be quiet", "\U0001F4E2", "worse", "Shouting made it louder. Next door heard that too."),
                      action("blame", "I could say it is the other tables, not mine", "\U0001F937", "nothing", "Every table said that. The noise stayed."),
                      action("door", "I could ask them to shut their door", "\U0001F6AA", "nothing", "The door was already shut. The noise came through the wall."),
                  ],
                  "why": "Your own quiet voice is your action, and it helps the class next door."},
                 {"issue": {"title": "Mr Ali next door cannot carry his shopping up the steps", "pic": "\U0001F474\U0001F3FE", "say": "He is eighty and the bags are heavy. What could YOU do, with a grown-up?", "fixed": "Mr Ali's shopping is in his kitchen."},
                  "needs": "help",
                  "actions": [
                      action("carry", "I could carry a bag up with my mum on shopping day", "\U0001F6CD️", "help", "You and your mum carried the bags up. Mr Ali made you both a cup of tea."),
                      action("council", "I could hope the council builds a ramp", "\U0001F3D7️", "nothing", "Maybe one day. The bags were heavy today."),
                      action("ignore", "I could pretend not to see", "\U0001F648", "worse", "Mr Ali saw you look away. That felt worse for him."),
                      action("advice", "I could tell him to buy less", "\U0001F6D2", "nothing", "He still needs his food. The bags stayed at the bottom."),
                  ],
                  "why": "Carrying a bag with your mum is your action, and it makes a real difference to Mr Ali."},
                 {"issue": {"title": "The Grade 1s cannot reach the water fountain", "pic": "\U0001F6B0", "say": "They go thirsty at playtime. What could YOU do?", "fixed": "The Grade 1s can get a drink!"},
                  "needs": "reach",
                  "actions": [
                      action("fill", "I could fill their bottles for them at playtime", "\U0001F964", "reach", "You filled six little bottles. Six Grade 1s had a drink."),
                      action("laugh", "I could laugh at how small they are", "\U0001F602", "worse", "They felt small AND thirsty."),
                      action("caretaker", "I could wish the caretaker would lower it", "\U0001F527", "nothing", "The caretaker did not know. Still too high."),
                      action("tell", "I could tell the caretaker so he can fit a step", "\U0001F9D1\U0001F3FE‍\U0001F527", "reach", "You told the caretaker. He fitted a step, and now the Grade 1s can reach."),
                      action("nothing", "I could do nothing, it is not my problem", "\U0001F937", "nothing", "You said it was not your problem. They are still thirsty."),
                  ],
                  "why": "Filling their bottles, or telling the caretaker, is your action, and it makes a difference to them."},
             ]},
             "Four problems that were somebody else's, four actions of your own that helped."),

        step("opinion", "What do YOU think of their views?", "\U0001F4AD", "Viewpoint judge", ["3Ea.01"],
             "People on our street have views about shared problems. Say what you think of each view, with two reasons.",
             explain(
                 ["An opinion about somebody else's viewpoint says whether you agree, and why.", "Two reasons, both about the topic."],
                 ["I partly agree with Mr Ali, because a ball can hit a parked car, and because children need somewhere to play.",
                  "One reason for his view and one against: that is partly agreeing."],
                 ["Children agree with whoever spoke last.", "Think about the view itself, then give your reasons."],
                 ["Tap what you think, then two reasons."]),
             {"reasonsNeeded": 2,
              "rounds": [
                 {"topic": "football in the street", "tag": "street", "pic": "\U0001F474\U0001F3FE", "ask": "What do you think of Mr Ali's view?",
                  "view": {"name": "Mr Ali", "pic": "\U0001F474\U0001F3FE", "says": "Children should not play football in the street at all."},
                  "stances": [{"id": "agree", "t": "I agree with Mr Ali"}, {"id": "part", "t": "I partly agree with Mr Ali", "mixed": True}, {"id": "disagree", "t": "I disagree with Mr Ali"}],
                  "reasons": [dict(tagged("because a ball can hit a parked car or somebody walking past", "street"), supports=['agree', 'part']), dict(tagged("because cars come round the corner fast", "street"), supports=['agree', 'part']), dict(tagged("because there is no park near us to play in", "street"), supports=['disagree', 'part']), dict(tagged("because children need somewhere to run and play", "street"), supports=['disagree', 'part']),
                              tagged("because I had eggs for breakfast", "breakfast"), tagged("because my cousin is tall", "cousins")]},
                 {"topic": "tidying the classroom", "tag": "tidying", "pic": "\U0001F467\U0001F3FF", "ask": "What do you think of Hana's view?",
                  "view": {"name": "Hana", "pic": "\U0001F467\U0001F3FF", "says": "Everyone in the class should take a turn tidying the classroom each day."},
                  "stances": [{"id": "agree", "t": "I agree with Hana"}, {"id": "part", "t": "I partly agree with Hana", "mixed": True}, {"id": "disagree", "t": "I disagree with Hana"}],
                  "reasons": [dict(tagged("because then nobody has to do all the tidying alone", "tidying"), supports=['agree', 'part']), dict(tagged("because a tidy room is easier to learn in", "tidying"), supports=['agree', 'part']), dict(tagged("because tidying every day takes time away from lessons", "tidying"), supports=['disagree', 'part']), dict(tagged("because some tidying jobs are too heavy for children", "tidying"), supports=['disagree', 'part']),
                              tagged("because the sea is blue", "the sea"), tagged("because I like the colour red", "colours")]},
                 {"topic": "dropping litter", "tag": "litter", "pic": "\U0001F466\U0001F3FE", "ask": "What do you think of Sami's view?",
                  "view": {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "says": "Anyone who drops litter should have to pick up litter for a whole week."},
                  "stances": [{"id": "agree", "t": "I agree with Sami"}, {"id": "part", "t": "I partly agree with Sami", "mixed": True}, {"id": "disagree", "t": "I disagree with Sami"}],
                  "reasons": [dict(tagged("because then they learn how much work litter makes", "litter"), supports=['agree', 'part']), dict(tagged("because it would keep the street clean", "litter"), supports=['agree', 'part']), dict(tagged("because a whole week is too long for one wrapper", "litter"), supports=['disagree', 'part']), dict(tagged("because the wind can blow litter out of somebody's hand", "litter"), supports=['disagree', 'part']),
                              tagged("because my bag is heavy", "bags"), tagged("because it is Monday", "days")]},
             ]},
             "You gave your opinion about three people's views on shared problems, each with two reasons."),

        step("explore", "Small actions, big differences", "\U0001F31F", "Difference maker", ["3As.01"],
             "Six actions a child can take for somebody else. Tap each one.",
             explain(
                 ["A positive difference does not need to be big.", "It needs to be yours, and for them."],
                 [],
                 [],
                 ["Tap all six, then answer."]),
             {"items": [
                 {"pic": "\U0001F91D", "label": "sit with someone alone", "say": "Sit with someone who is alone. One lunchtime changes for them."},
                 {"pic": "\U0001F910", "label": "keep your voice down", "say": "Keep your voice down. The class next door can hear their story."},
                 {"pic": "\U0001F6CD️", "label": "carry a bag", "say": "Carry a bag with a grown-up. An older neighbour gets their shopping home."},
                 {"pic": "\U0001F964", "label": "fill a bottle", "say": "Fill a small child's water bottle. They get a drink."},
                 {"pic": "\U0001F6AA", "label": "hold the door", "say": "Hold the door for the person behind you with full hands."},
                 {"pic": "\U0001F4DA", "label": "read to a younger child", "say": "Read a book to a younger child who cannot read yet."},
             ], "need": 6,
              "then": {"ask": "Which of these is an action YOU could take for somebody else?",
                       "opts": [opt("Sit with someone who is alone", True), opt("Hope a grown-up fixes it", False), opt("Wait for them to ask", False)],
                       "why": "Sitting with them is yours to do, today."}},
             "Six small actions, six differences for somebody else."),

        step("questions", "Causes and actions", "\U0001F4AC", "Cause judge", ["3Ac.01", "3As.01"],
             "Think about causes, consequences and your actions. Tap the answer.",
             explain(
                 ["Find the cause. See the consequence for others. Suggest your own action for their problem."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Tariq ran down the corridor and broke Hana's model. What was the CAUSE?", "\U0001F552", "he was late for class", ["he wanted to break it", "Hana was rude"], "Being late was why he ran."),
                 q("You snapped at Nora because you were tired. What did that do to Nora?", "\U0001F61F", "she felt hurt and did not ask again", ["she laughed", "nothing"], "Your tiredness reached Nora."),
                 q("The new girl eats alone. Which action of yours would help her most?", "\U0001F91D", "sit with her at lunch", ["smile at her from your table", "wait for her to come to you"], "Sitting with her is something you do. Telling a teacher is good too."),
                 q("Which cause could you change?", "\U0001F527", "staying up after bedtime made me grumpy", ["the rain", "the fire alarm"], "Going to bed when you are told is yours to do."),
             ]},
             "You find causes, see consequences for others, and act for them."),

        step("quiz", "Show what you know", "⭐", "Star thinker", ["3Ac.01", "3As.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a cause?", "\U0001F517", "the reason you did something", ["what happened after", "a kind of action", "a rule"], "Tariq's cause was being late."),
                 q("Cause, action, and then…?", "➡️", "consequence", ["another cause", "nothing", "a question"], "The chain ends with what it did to somebody."),
                 q("Why find the cause?", "\U0001F527", "because changing the cause changes the chain", ["to blame somebody", "you do not need to", "to make it longer"], "Leave earlier, no running, no broken model."),
                 q("You shouted for a pencil. What did it do to the class?", "\U0001F4E2", "everyone lost their place in the story", ["everyone got a pencil", "nothing", "they cheered"], "Your shout reached everybody."),
                 q("Which problem is somebody ELSE'S?", "\U0001F465", "the Grade 1s cannot reach the fountain", ["I keep losing my pencil", "I am tired after lunch", "I am slow at tying my laces"], "The Grade 1s' problem, and your action."),
                 q("Next door cannot hear over our noise. Which action helps?", "\U0001F910", "use my inside voice and remind my table", ["shout at everyone", "blame other tables", "ask them to shut their door"], "Your own quiet voice is yours to give."),
                 q("Mr Ali cannot carry his shopping. Which action of yours, with a grown-up, would help him most?", "\U0001F6CD️", "carry a bag up with my mum", ["hope for a ramp", "tell him to buy less", "pretend not to see"], "Carrying a bag makes a real difference today."),
                 q("Which cause is OUTSIDE your control?", "\U0001F326️", "the rain", ["staying up after bedtime", "a lost pencil", "being slow to get ready"], "Nobody controls the rain."),
             ]},
             "That is the whole lesson finished. You find causes, see what your actions do to others, and act for them."),
    ],
}


LESSON["about"] = [
    "Say the cause behind an action of yours.",
    "Say what an action of yours did to somebody else.",
    "Tell a cause you could change from one outside your control.",
    "Suggest an action of your own for a problem that is somebody else's.",
    "Give your opinion about somebody else's view on a shared problem, with two reasons.",
]

LESSON["lecture"] = [
    part("\U0001F517", "The chain",
         "Tariq was late, so he ran, and he broke Hana's model. Cause, action, consequence. The cause is why. The consequence is what it did to Hana."),
    part("\U0001F914", "Find the cause",
         "If Tariq had left home earlier, he would not have run, and the model would be fine. Change the cause and the whole chain changes. That is why finding the cause matters."),
    part("\U0001F465", "Consequences for others",
         "Staying up after bedtime made you snap at Nora, and Nora went quiet all day. Finishing early let you help Sami, and Sami understood his sums. What you do reaches other people, for better and for worse."),
    part("\U0001F527", "Causes you can change",
         "Some causes are yours: staying up after bedtime, a lost pencil, being slow to get ready. Some are not: the rain, the fire alarm. Work on the ones that are yours."),
    part("\U0001F4AA", "An action for somebody else",
         "The new girl eats alone. Sit with her. Next door cannot hear. Keep your voice down. Mr Ali cannot carry his shopping. Carry a bag with your mum. Their problem, your action, a real difference."),
    part("\U0001F4AD", "What do you think of their view?",
         "Mr Ali thinks children should not play football in the street at all. Do you agree? Say what you think of his view, and give two reasons. If you partly agree, one reason can be for his view and one against."),
]

LESSON["words"] = [
    word("cause", "\U0001F517", "The reason something happened.",
         ["The cause of the running was being late.", "Find the cause."]),
    word("consequence", "➡️", "What happened because of an action.",
         ["The consequence for Hana was a broken model.", "Think about the consequence for others."]),
    word("chain", "⛓️", "Things joined one after another: cause, action, consequence.",
         ["Change the cause and the chain changes.", "Follow the chain."]),
    word("control", "\U0001F527", "Being able to change something yourself.",
         ["Going to bed when I am told is in my control.", "The rain is outside my control."]),
    word("positive", "\U0001F31F", "Good; making things better.",
         ["A positive difference for Mr Ali.", "Sitting with her was positive."]),
    word("issue", "\U0001F6A8", "A problem that affects somebody.",
         ["The fountain is an issue for the Grade 1s.", "Whose issue is it?"]),
]

LESSON["home"] = [
    home("Find the cause", "A grown-up and something that went wrong today",
         ["Say what happened.",
          "Ask: what was the cause? What did it do to somebody else?",
          "Say what would change if the cause changed."],
         "Was the cause something you could change?"),
    home("An action for somebody else", "A grown-up, and a problem that is not yours",
         ["Find a problem somebody else has: a neighbour, a younger child, a busy parent.",
          "Suggest an action YOU could take, and do it with your grown-up.",
          "Do it, and notice what it did for them."],
         "Was it a small action? Did it still make a difference?"),
    home("Causes I can change", "Paper and a pencil",
         ["Write three things that went wrong this week.",
          "Next to each, write the cause.",
          "Circle the causes that are yours to change."],
         "Which one will you change first?"),
]

LESSON["lookback"] = {
    "not": ["how to ride a bike", "the names of the planets", "how to swim"],
    "changed": [
        {"before": "An action just happens.", "after": "Every action has a cause, and changing the cause changes what happens to others."},
        {"before": "Other people's problems are for grown-ups to fix.", "after": "I can take an action of my own, and tell a grown-up when it needs one."},
        {"before": "If I was grumpy, it was the other person's fault.", "after": "The cause was often mine, like staying up when I was told to go to bed, and I can change it."},
    ],
}

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("You forgot your water bottle, so you were thirsty all morning. What was the cause?", "\U0001F4A7", "forgetting the water bottle", ["being thirsty", "the morning"], "The cause is why it happened: you forgot the bottle."),
    q("An older neighbour cannot reach the top shelf in the shop. What could you do?", "\U0001F6D2", "ask if you can help, and reach it for them", ["walk past", "laugh"], "Offering help is an action of yours that makes a difference to somebody else."),
]
