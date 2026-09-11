# -*- coding: utf-8 -*-
"""Lesson 6 - Team Roles.

0838 Stage 3 Collaboration: 3Cc.01 the team allocate given tasks to team
members to achieve a shared outcome; 3Ct.01 the team member introduces ideas
and works positively with other team members. Reflection: 3Fc.01 identify
strengths and limitations of personal contribution to teamwork; 3Ft.01
identify how working together improved the shared outcome achieved. The
topics are the sign for our class fair stall and the recycling garden - two
shared outcomes with jobs that need different people, and a look back at
what the child did well and what took more than one go, read from their
own play.
"""
from _kit import explain, step, opt, q, person, task, part, word, home

SIGN_FRIENDS = [person("sami", "Sami", "\U0001F466\U0001F3FE", ["carrying heavy things"]), person("hana", "Hana", "\U0001F467\U0001F3FF", ["reaching high"]), person("omar", "Omar", "\U0001F466\U0001F3FD", ["counting"])]
SIGN_MEMBERS = [person("you", "You", "\U0001F9D2", ["neat writing"])] + SIGN_FRIENDS
GARDEN_FRIENDS = [person("amal", "Amal", "\U0001F467\U0001F3FE", ["digging"]), person("tariq", "Tariq", "\U0001F466\U0001F3FF", ["carrying water"]), person("nora", "Nora", "\U0001F467\U0001F3FD", ["drawing"])]
GARDEN_MEMBERS = [person("you", "You", "\U0001F9D2", ["planting"])] + GARDEN_FRIENDS

LESSON = {
    "slug": "team-roles",
    "title": "Team Roles",
    "blurb": "A team gives out its jobs so each goes to the person who can do it. Allocate the jobs for the fair sign and the recycling garden, bring ideas when the team is stuck, then look honestly at what you did well and what took more than one go.",
    "steps": [
        step("demo", "The right job for the right person", "\U0001F4CB", "Job giver", ["3Cc.01"],
             "A team has jobs, and people who are good at different things. Press <b>Next</b> and see the jobs given out.",
             explain(
                 ["Allocating tasks means giving each job to the team member who can do it best.", "The tall one reaches the top. The neat one paints the letters."],
                 ["The sign for the fair stall needs four jobs.", "Hana is tall, so she paints the top edge.", "You have neat writing, so you paint the letters.",
                  "Give the top edge to the shortest person and the sign takes twice as long."],
                 ["Children give the best job to their best friend.", "Give each job to the person whose skill it needs."],
                 ["Press Next and watch the jobs go out."]),
             {"frames": [
                 {"pic": "\U0001F3AA", "cap": "The class fair is on Saturday. Our stall needs a <b>big painted sign</b>.", "say": "The class fair is on Saturday. Our stall needs a big painted sign. That is a job for a team."},
                 {"pic": "\U0001F4CB", "cap": "Four jobs: <b>carry the board, paint the top edge, paint the letters, count the coins</b> for paint.", "say": "Four jobs: carry the heavy board, paint the top edge, paint the letters neatly, and count the coins to buy the paint.", "sound": "pop"},
                 {"pic": "\U0001F466\U0001F3FE", "cap": "Sami is <b>strong</b>: he carries the board. Hana is <b>tall</b>: she paints the top.", "say": "Sami is strong, so he carries the board. Hana is tall, so she paints the top edge.", "sound": "pop"},
                 {"pic": "\U0001F9D2", "cap": "You have <b>neat writing</b>: the letters are yours. Omar is good with <b>numbers</b>: he counts the coins.", "say": "You have neat writing, so the letters are yours. Omar is good with numbers, so he counts the coins.", "sound": "pop"},
                 {"pic": "\U0001F91D", "cap": "Every job with the <b>right person</b>. That is how a team gets a big job done well.", "say": "Every job with the right person. That is how a team gets a big job done, and done well.", "sound": "tada"},
             ]},
             "Give each job to the person whose skill it needs."),

        step("team", "Paint the sign for our stall", "\U0001F3A8", "Sign team", ["3Cc.01", "3Ct.01"],
             "You and three friends are making the fair sign. Give out the jobs, bring ideas when the team is stuck, and work kindly. Watch the sign fill up.",
             explain(
                 ["First the team gives out its jobs. Then each person does theirs. When the team is stuck, somebody brings an idea."],
                 ["Carry the board: Sami is strong.", "The paint runs out: mix it with white, or send Omar to count for more."],
                 ["Children give every job to themselves.", "Look at what each job NEEDS, and who has it."],
                 ["Tap the right person for each job, then play on."]),
             {"goal": "paint the sign for our fair stall", "scene": "mural", "friends": SIGN_FRIENDS,
              "rounds": [
                  {"kind": "allocate", "who": "sami", "members": SIGN_MEMBERS, "log": "You gave each sign job to the right person.", "why": "Each job needed a skill, and each went to the person who had it.",
                   "tasks": [task("board", "Carry the heavy board to the hall", "\U0001F5BC️", "carrying heavy things"), task("top", "Paint the top edge nobody else can reach", "\U0001F58C️", "reaching high"),
                             task("letters", "Paint the letters neatly", "✍️", "neat writing"), task("coins", "Count the coins for the paint", "\U0001F4B0", "counting")]},
                  {"kind": "friend", "who": "sami", "did": "carried the board to the hall on his own, so the rest of us could start mixing paint.", "log": "Sami carried the board.", "pic": "\U0001F5BC️"},
                  {"kind": "idea", "who": "hana", "situation": "The blue paint has run out halfway through the sky, and the shop is shut. The team is stuck.", "pic": "\U0001F7E6",
                   "opts": [{"t": "Let's mix the last blue with white for a lighter sky, and it will go further.", "good": True, "log": "Your idea: mix the blue with white."},
                            {"t": "Let's paint the rest of the sky red.", "good": False, "why": "Half blue, half red is not a sky. The team is still stuck."},
                            {"t": "Let's stop and finish next week.", "good": False, "why": "The fair is on Saturday. Next week is too late."}],
                   "why": "Mixing makes the paint go further. Your idea got the team unstuck."},
                  {"kind": "work", "who": "omar", "situation": "Omar counted the coins twice and got two different answers. He looks upset.", "pic": "\U0001F4B0",
                   "opts": [{"t": "Let's count them together, in piles of ten.", "good": True, "log": "You helped Omar count the coins in tens."},
                            {"t": "You are useless at counting.", "good": False, "why": "Omar feels worse, and the coins are still uncounted."},
                            {"t": "Give them to me, I will do it.", "good": False, "why": "Counting was Omar's job. Taking it off him is not teamwork."}],
                   "why": "Helping a team member with their job, without taking it away, is working positively."},
                  {"kind": "friend", "who": "hana", "did": "stood on the step and painted the whole top edge while the rest of us did the letters.", "log": "Hana painted the top edge.", "pic": "\U0001F58C️"},
                  {"kind": "idea", "who": "omar", "situation": "The letters are painted, but nobody can read them from the back of the hall. The team is stuck.", "pic": "\U0001F453",
                   "opts": [{"t": "Let's paint a black outline round each letter so it stands out.", "good": True, "log": "Your idea: outline the letters in black."},
                            {"t": "Let's make everybody stand closer.", "good": False, "why": "You cannot move the whole hall closer. Still unreadable."},
                            {"t": "Let's paint over the letters and leave the sign blank.", "good": False, "why": "A blank sign says nothing about our stall."}],
                   "why": "An outline makes the letters stand out. Your idea finished the sign."},
              ]},
             "The sign is done: jobs given out, ideas when it was stuck, and everyone kept working."),

        step("strengths", "What I did well, and what took two goes", "\U0001F4AA", "Honest reflector", ["3Fc.01", "3Ft.01"],
             "Look back at YOUR part in the sign team. Which things did you get right first time? Which took more than one go? Then: what did working together make possible?",
             explain(
                 ["A strength is something you did well, first time.", "A limitation is something that took more than one go, or that you could do better.",
                  "Both are true at once, and saying both is honest."],
                 ["You gave out the jobs right first time: a strength.", "The paint idea took two goes: a limitation, and knowing it is how you improve."],
                 ["Children say everything was a strength.", "The page remembers what took two goes. Be honest; it is not a mark."],
                 ["Tap what you got right first time. Then what took two goes."]),
             {"limits": ["Listen to what the job needs before I tap a person", "Think about the whole team before I choose an idea", "Ask a friend what they are good at, instead of guessing", "Try the idea that helps everyone, not the funny one"],
              "then": {"ask": "What did working TOGETHER make possible that one person could not have done?",
                       "opts": [opt("A board carried, a top edge reached, letters painted and coins counted, all before Saturday", True), opt("Nothing; one person could have done it all just as well", False), opt("A sign with no letters", False)],
                       "why": "Four jobs needing four different skills, done at once. Working together made the sign possible and made it better."}},
             "You said what you did well, what took two goes, and what the team made possible."),

        step("team", "Plant the recycling garden", "\U0001F331", "Garden team", ["3Cc.01", "3Ct.01"],
             "A new team, a new job: the recycling garden, where plants grow in old tyres and tins. Give out the jobs and bring ideas.",
             explain(
                 ["The same three things: allocate, do your part, bring ideas."],
                 [],
                 [],
                 ["Tap the right person for each job, then play on."]),
             {"goal": "plant the recycling garden", "scene": "garden", "friends": GARDEN_FRIENDS,
              "rounds": [
                  {"kind": "allocate", "who": "amal", "members": GARDEN_MEMBERS, "log": "You gave each garden job to the right person.", "why": "Digging, carrying, drawing, planting: four skills, four people.",
                   "tasks": [task("dig", "Dig the soil into the old tyres", "\U0001F573️", "digging"), task("water", "Carry the watering cans from the tap", "\U0001F4A7", "carrying water"),
                             task("signs", "Draw the picture labels for each tyre", "\U0001F3F7️", "drawing"), task("plant", "Plant the seedlings", "\U0001F331", "planting")]},
                  {"kind": "friend", "who": "amal", "did": "dug the soil into all four tyres before anyone else had found the trowels.", "log": "Amal dug the tyres.", "pic": "\U0001F573️"},
                  {"kind": "idea", "who": "tariq", "situation": "The tap is at the far end of the field and the cans are heavy. Tariq is worn out after two trips. The team is stuck.", "pic": "\U0001F4A7",
                   "opts": [{"t": "Let's take turns carrying, two people per can.", "good": True, "log": "Your idea: take turns, two per can."},
                            {"t": "Let's leave the plants dry today.", "good": False, "why": "Dry seedlings wilt. The garden would fail on day one."},
                            {"t": "Let's tell Tariq to go faster.", "good": False, "why": "He is worn out. Going faster is not an idea, it is a complaint."}],
                   "why": "Sharing the carrying is an idea that keeps the team going."},
                  {"kind": "work", "who": "nora", "situation": "Nora's labels got splashed and the pictures have run. She wants to give up.", "pic": "\U0001F3F7️",
                   "opts": [{"t": "They are still lovely, Nora. Let's redo the two that ran, together.", "good": True, "log": "You helped Nora redo the splashed labels."},
                            {"t": "I told you to keep them away from the water.", "good": False, "why": "Nora feels worse, and the labels are still smudged."},
                            {"t": "Fine, we will have no labels.", "good": False, "why": "Then nobody knows which tyre is which."}],
                   "why": "Kind help keeps a team member in the team."},
                  {"kind": "friend", "who": "nora", "did": "redrew the two splashed labels, one picture for each plant.", "log": "Nora redrew the splashed labels.", "pic": "\U0001F3F7️"},
                  {"kind": "idea", "who": "amal", "situation": "The birds are already pecking at the seedlings. The team is stuck.", "pic": "\U0001F426",
                   "opts": [{"t": "Let's hang strips of shiny foil from old crisp packets above the tyres to scare the birds.", "good": True, "log": "Your idea: hang shiny foil strips to scare the birds."},
                            {"t": "Let's stand guard all night.", "good": False, "why": "Nobody can stand guard all night. The birds win."},
                            {"t": "Let's pull the seedlings up so the birds cannot have them.", "good": False, "why": "Then there is no garden at all."}],
                   "why": "Shiny strips scare birds, and they are recycled too. Your idea finished the garden."},
              ]},
             "The recycling garden is planted, watered, labelled and protected. A team did it."),

        step("contrib", "Who did what in the garden?", "\U0001F64B", "Garden rememberer", ["3Ft.01", "3Fc.01"],
             "The garden is done. Which of these were YOURS, and what did each friend do?",
             explain(
                 ["Looking back at a team job: what was mine, what was a friend's.", "And together it was more than any of us alone."],
                 [],
                 [],
                 ["Tap yours, then each friend's."]),
             {},
             "You said what you did and what each friend did. Together, the garden got done."),

        step("questions", "Jobs, ideas and looking back", "\U0001F4AC", "Team judge", ["3Cc.01", "3Ct.01", "3Fc.01", "3Ft.01"],
             "Think about the sign, the garden and your honest look back. Tap the answer.",
             explain(
                 ["Give jobs to the right people. Bring ideas. Say what you did well and what you could do better."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Who should paint the top edge of the sign?", "\U0001F58C️", "Hana, because she is tall", ["Omar, because he likes blue", "whoever asks first"], "The job needs height. Give it to the tall one."),
                 q("The blue paint ran out. Which idea got the team unstuck?", "\U0001F7E6", "mix it with white so it goes further", ["paint the rest red", "finish next week"], "Mixing makes the paint go further."),
                 q("What is a LIMITATION of your teamwork?", "\U0001F914", "something that took more than one go, or that you could do better", ["something you did well", "a job you did not have"], "Knowing it is how you improve."),
                 q("What did working together make possible for the sign?", "\U0001F91D", "four jobs needing four skills, done at once, before Saturday", ["nothing", "a sign with no letters"], "One person could not carry, reach, paint and count all at once."),
             ]},
             "You know how a team allocates, brings ideas, and looks back honestly."),

        step("quiz", "Show what you know", "⭐", "Star team player", ["3Cc.01", "3Ct.01", "3Fc.01", "3Ft.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does it mean to ALLOCATE tasks?", "\U0001F4CB", "give each job to the team member who can do it best", ["do every job yourself", "do the jobs in alphabetical order", "give the best job to your friend"], "The strong one carries, the tall one reaches."),
                 q("Who should carry the heavy board?", "\U0001F5BC️", "Sami, because he is strong", ["Omar, because he is good with numbers", "you, because you have neat writing", "anyone"], "The job needs strength."),
                 q("Omar counted the coins wrong and was upset. What is working positively?", "\U0001F4B0", "count them together in tens", ["tell him he is useless", "take the job off him", "ignore him"], "Help with the job, without taking it away."),
                 q("Nobody could read the letters from the back. Which idea helped?", "\U0001F453", "outline them in black", ["make everyone stand closer", "paint over them", "give up"], "An outline makes letters stand out."),
                 q("What is a STRENGTH of your teamwork?", "\U0001F4AA", "something you did well, first time", ["something that took three goes", "a job you skipped", "being first in the line"], "Giving out the jobs right first time was a strength."),
                 q("Why be honest about what took two goes?", "\U0001F914", "because knowing it is how you get better", ["to get told off", "you should not be", "to win"], "A limitation you know about is one you can work on."),
                 q("The tap was far away and the cans were heavy. Which idea helped the garden team?", "\U0001F4A7", "take turns, two people per can", ["leave the plants dry", "tell Tariq to go faster", "stop"], "Sharing the carrying keeps the team going."),
                 q("How did working together make the sign BETTER, not just possible?", "\U0001F31F", "each part was done by the person best at it", ["it was slower", "it was not better", "only one person worked"], "Neat letters, a reached top edge, correct coins: each by the right person."),
             ]},
             "That is the whole lesson finished. You allocate, bring ideas, and look back honestly at your teamwork."),
    ],
}


LESSON["about"] = [
    "Give out a team's jobs so each goes to the person whose skill it needs.",
    "Bring an idea to the team when it is stuck, and work kindly with everyone.",
    "Say what you did well in a team, and what took more than one go.",
    "Say how working together made the shared outcome possible and better.",
]

LESSON["lecture"] = [
    part("\U0001F4CB", "Giving out the jobs",
         "The fair sign needs four jobs: carry the board, paint the top edge, paint the letters, count the coins. Sami is strong, Hana is tall, you have neat writing, Omar is good with numbers. Each job to the person whose skill it needs."),
    part("\U0001F4A1", "Ideas when the team is stuck",
         "The blue paint runs out. Nobody can read the letters from the back. Each time the team is stuck, a team member brings an idea: mix with white, outline in black. Ideas keep a team moving."),
    part("\U0001F91D", "Working positively",
         "Omar counted wrong and was upset. Count together in tens. Nora's labels got splashed. Redo them together. Help with a job without taking it away, and nobody leaves the team."),
    part("\U0001F4AA", "Strengths and limitations",
         "Then look back honestly. What did you get right first time? That is a strength. What took two goes? That is a limitation, and knowing it is how you get better. Both are true at once."),
    part("\U0001F31F", "Better together",
         "Four jobs needing four skills, all before Saturday. One person could not carry, reach, paint and count at once. Working together made the sign possible, and each part done by the right person made it better."),
]

LESSON["words"] = [
    word("allocate", "\U0001F4CB", "To give out jobs, each to the person who can do it.",
         ["The team allocated four jobs.", "Allocate the top edge to Hana."]),
    word("skill", "\U0001F9E9", "Something a person is good at.",
         ["Sami's skill is carrying heavy things.", "Match the job to the skill."]),
    word("strength", "\U0001F4AA", "Something you do well.",
         ["Giving out jobs was a strength.", "Name one strength."]),
    word("limitation", "\U0001F914", "Something you could do better.",
         ["Rushing my idea was a limitation.", "Knowing a limitation helps you improve."]),
    word("outcome", "\U0001F3AF", "What the team makes or achieves together.",
         ["The sign was the shared outcome.", "A better outcome, together."]),
    word("improve", "\U0001F4C8", "To make something better.",
         ["Working together improved the sign.", "Knowing what took two goes helps me improve."]),
]

LESSON["home"] = [
    home("Give out the jobs", "Everyone at home and a shared job: dinner, a picnic, tidying a room",
         ["List the jobs.",
          "Say what each job needs, and who at home is good at that.",
          "Give out the jobs, do them, and see how quickly it gets done."],
         "Did every job go to the person who could do it best?"),
    home("Strengths and limitations", "A grown-up, after a job done together",
         ["Say one thing you did well.",
          "Say one thing that took more than one go, or that you would do differently.",
          "Ask your grown-up to do the same about themselves."],
         "Was the limitation hard to say? It gets easier."),
    home("Ideas when stuck", "A grown-up and a pretend problem",
         ["Your grown-up says: we are stuck, the paint has run out and the shop is shut.",
          "Bring two ideas that would get the team going.",
          "Say which idea helps EVERYONE, not just you."],
         "Which idea would really have worked?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to swim"],
    "changed": [
        {"before": "The best job should go to my best friend.", "after": "Each job should go to the person whose skill it needs."},
        {"before": "Looking back means saying what I did well.", "after": "Looking back means saying what I did well AND what took more than one go."},
        {"before": "A team is just more people doing the same thing.", "after": "A team is better because each part is done by the person best at it."},
    ],
}
