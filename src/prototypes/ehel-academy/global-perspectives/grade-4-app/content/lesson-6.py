# -*- coding: utf-8 -*-
"""Lesson 6 - The Class Museum.

0838 Stage 4 Collaboration: 4Cc.01 the team allocate given tasks to team
members to achieve a shared outcome; 4Ct.01 the team member introduces ideas
and works positively with other team members. Reflection: 4Fc.01 identify
strengths and limitations of personal contribution to teamwork; 4Ft.01
identify how working together improved the shared outcome achieved. The
topics are the class museum display about the old town and the bee garden -
two shared outcomes with jobs that need different people, and a look back at
what the child did well and what took more than one go, read from their own
play.
"""
from _kit import explain, step, opt, q, person, task, part, word, home

MUSEUM_FRIENDS = [person("sami", "Sami", "\U0001F466\U0001F3FE", ["making models"]), person("hana", "Hana", "\U0001F467\U0001F3FF", ["drawing"]), person("yusuf", "Yusuf", "\U0001F466\U0001F3FD", ["speaking clearly"])]
MUSEUM_MEMBERS = [person("you", "You", "\U0001F9D2", ["reading old writing"])] + MUSEUM_FRIENDS
GARDEN_FRIENDS = [person("amal", "Amal", "\U0001F467\U0001F3FE", ["digging"]), person("tariq", "Tariq", "\U0001F466\U0001F3FF", ["carrying water"]), person("nora", "Nora", "\U0001F467\U0001F3FD", ["painting signs"])]
GARDEN_MEMBERS = [person("you", "You", "\U0001F9D2", ["planting seeds"])] + GARDEN_FRIENDS

LESSON = {
    "slug": "the-class-museum",
    "title": "The Class Museum",
    "blurb": "A team gives out its jobs so each goes to the person who can do it. Allocate the jobs for the class museum about the old town and for the bee garden, bring ideas when the team is stuck, then look honestly at what you did well and what took more than one go.",
    "steps": [
        step("demo", "Match the job to the skill", "\U0001F4CB", "Job giver", ["4Cc.01"],
             "A team has jobs, and people who are good at different things. Press <b>Next</b> and see the jobs given out.",
             explain(
                 ["Allocating tasks means giving each job to the team member whose skill it needs.", "The one who can read old handwriting reads the old letters. The one who draws well draws the high street."],
                 ["The class museum about the old town needs four jobs.", "Sami makes models, so he builds the old bridge.", "Yusuf speaks clearly, so he reads the labels at the opening.",
                  "Give the reading to the one who cannot read old writing and the museum opens a week late."],
                 ["Children give the best job to their best friend.", "Give each job to the person whose skill it needs."],
                 ["Press Next and watch the jobs go out."]),
             {"frames": [
                 {"pic": "\U0001F3DB️", "cap": "The class is making a <b>museum display about the old town</b> for parents' evening.", "say": "The class is making a museum display about the old town, for parents' evening. That is a job for a team."},
                 {"pic": "\U0001F4CB", "cap": "Four jobs: <b>read the old letters, draw the old high street, build the model bridge, read the labels aloud</b>.", "say": "Four jobs: read the old letters to find the facts, draw the old high street, build a model of the old bridge, and read the labels aloud at the opening.", "sound": "pop"},
                 {"pic": "\U0001F9D2", "cap": "You can <b>read old handwriting</b>: the letters are yours. Hana <b>draws</b>: the high street is hers.", "say": "You can read old handwriting, so the letters are yours. Hana draws beautifully, so the high street is hers.", "sound": "pop"},
                 {"pic": "\U0001F466\U0001F3FE", "cap": "Sami <b>makes models</b>: the bridge. Yusuf <b>speaks clearly</b>: the labels at the opening.", "say": "Sami makes models, so the bridge is his. Yusuf speaks clearly and loudly, so he reads the labels at the opening.", "sound": "pop"},
                 {"pic": "\U0001F91D", "cap": "Every job with the <b>right person</b>. That is how a team makes a museum in a week.", "say": "Every job with the right person. That is how a team makes a whole museum in a week.", "sound": "tada"},
             ]},
             "Give each job to the person whose skill it needs."),

        step("team", "Build the class museum", "\U0001F3DB️", "Museum team", ["4Cc.01", "4Ct.01"],
             "You and three friends are making the museum display. Give out the jobs, bring ideas when the team is stuck, and work kindly. Watch the display fill up.",
             explain(
                 ["First the team gives out its jobs. Then each person does theirs. When the team is stuck, somebody brings an idea."],
                 ["Build the bridge: Sami makes models.", "The paint will not stick to the shiny card: paint on paper and glue it on."],
                 ["Children give every job to themselves.", "Look at what each job NEEDS, and who has it."],
                 ["Tap the right person for each job, then play on."]),
             {"goal": "make the class museum about the old town", "scene": "mural", "friends": MUSEUM_FRIENDS,
              "rounds": [
                  {"kind": "allocate", "who": "sami", "members": MUSEUM_MEMBERS, "log": "You gave each museum job to the right person.", "why": "Each job needed a skill, and each went to the person who had it.",
                   "tasks": [task("letters", "Read the old letters to find the facts", "\U0001F4DC", "reading old writing"), task("street", "Draw the old high street", "\U0001F3A8", "drawing"),
                             task("bridge", "Build a model of the old bridge", "\U0001F309", "making models"), task("labels", "Read the labels aloud at the opening", "\U0001F5E3️", "speaking clearly")]},
                  {"kind": "friend", "who": "sami", "did": "cut every strut for the bridge before the rest of us had found the glue.", "log": "Sami cut the bridge struts.", "pic": "\U0001F309"},
                  {"kind": "idea", "who": "hana", "situation": "The paint will not stick to the shiny display card. Hana's high street keeps sliding off. The team is stuck.", "pic": "\U0001F3A8",
                   "opts": [{"t": "Let's paint on paper first and glue the paper to the card.", "good": True, "log": "Your idea: paint on paper, then glue it on."},
                            {"t": "Let's leave the high street out.", "good": False, "why": "The high street is half the museum. Leaving it out is giving up."},
                            {"t": "Let's use more paint.", "good": False, "why": "More paint slides off just the same. Still stuck."}],
                   "why": "Paper takes paint; card takes glue. Your idea got the team unstuck."},
                  {"kind": "work", "who": "yusuf", "situation": "Yusuf is worried about reading the labels aloud in front of all the parents. He says he will get the words wrong.", "pic": "\U0001F5E3️",
                   "opts": [{"t": "Let's practise together at lunchtime, and I will hold the labels for you.", "good": True, "log": "You practised the labels with Yusuf."},
                            {"t": "Then I will read them instead.", "good": False, "why": "Reading was Yusuf's job. Taking it off him is not teamwork."},
                            {"t": "Do not be silly, it is easy.", "good": False, "why": "Yusuf feels worse, and he still has not practised."}],
                   "why": "Helping a team member with their job, without taking it away, is working positively."},
                  {"kind": "friend", "who": "hana", "did": "drew every shop on the old high street, with the names from your letters.", "log": "Hana drew the high street.", "pic": "\U0001F3A8"},
                  {"kind": "idea", "who": "yusuf", "situation": "The model bridge keeps tipping over every time somebody walks past the table. The team is stuck.", "pic": "\U0001F309",
                   "opts": [{"t": "Let's glue the bridge to a wide card base so it cannot tip.", "good": True, "log": "Your idea: glue the bridge to a wide base."},
                            {"t": "Let's tell everyone to stop walking past.", "good": False, "why": "Parents will walk past all evening. Still tipping."},
                            {"t": "Let's put the bridge in a cupboard.", "good": False, "why": "A museum nobody can see is not a museum."}],
                   "why": "A wide base stops the tipping. Your idea finished the museum."},
              ]},
             "The museum is done: jobs given out, ideas when it was stuck, and everyone kept working."),

        step("strengths", "What I did well, and what took two goes", "\U0001F4AA", "Honest reflector", ["4Fc.01", "4Ft.01"],
             "Look back at YOUR part in the museum team. Which things did you get right first time? Which took more than one go? Then: what did working together make possible?",
             explain(
                 ["A strength is something you did well, first time.", "A limitation is something that took more than one go, or that you could do better.",
                  "Both are true at once, and saying both is honest."],
                 ["You gave out the jobs right first time: a strength.", "The paint idea took two goes: a limitation, and knowing it is how you improve."],
                 ["Children say everything was a strength.", "The page remembers what took two goes. Be honest; it is not a mark."],
                 ["Tap what you got right first time. Then what took two goes."]),
             {"limits": ["Read what each job needs before I tap a person", "Think about the whole team before I choose an idea", "Ask a friend what they are good at, instead of guessing", "Try the idea that helps everyone, not the quickest one"],
              "then": {"ask": "What did working TOGETHER make possible that one person could not have done?",
                       "opts": [opt("Old letters read, a high street drawn, a bridge built and labels read aloud, all in one week", True), opt("Nothing; one person could have done it all just as well", False), opt("A museum with no bridge", False)],
                       "why": "Four jobs needing four different skills, done at once. Working together made the museum possible and made it better."}},
             "You said what you did well, what took two goes, and what the team made possible."),

        step("team", "Plant the bee garden", "\U0001F41D", "Garden team", ["4Cc.01", "4Ct.01"],
             "A new team, a new job: the bee garden by the field, full of flowers bees love. Give out the jobs and bring ideas.",
             explain(
                 ["The same three things: allocate, do your part, bring ideas."],
                 [],
                 [],
                 ["Tap the right person for each job, then play on."]),
             {"goal": "plant the bee garden", "scene": "garden", "friends": GARDEN_FRIENDS,
              "rounds": [
                  {"kind": "allocate", "who": "amal", "members": GARDEN_MEMBERS, "log": "You gave each garden job to the right person.", "why": "Digging, carrying, painting, planting: four skills, four people.",
                   "tasks": [task("dig", "Dig the beds along the fence", "\U0001F573️", "digging"), task("water", "Carry the watering cans from the tap", "\U0001F4A7", "carrying water"),
                             task("signs", "Paint the flower name signs", "\U0001F3F7\uFE0F", "painting signs"), task("sow", "Plant the wildflower seeds", "\U0001F33B", "planting seeds")]},
                  {"kind": "friend", "who": "amal", "did": "dug all three beds before anyone else had found the trowels.", "log": "Amal dug the beds.", "pic": "\U0001F573️"},
                  {"kind": "idea", "who": "tariq", "situation": "The bees need water too, but a bowl of water is deep enough to drown them. The team is stuck.", "pic": "\U0001F41D",
                   "opts": [{"t": "Let's put pebbles in a saucer of water so the bees can land on them.", "good": True, "log": "Your idea: pebbles in a saucer of water."},
                            {"t": "Let's give them no water.", "good": False, "why": "Bees need to drink. The garden would not be for bees."},
                            {"t": "Let's use a deeper bucket.", "good": False, "why": "Deeper is worse. Still stuck."}],
                   "why": "Pebbles give the bees a place to land. Your idea kept the team going."},
                  {"kind": "work", "who": "tariq", "situation": "Tariq spilled a whole can of water over the seed packets and wants to give up.", "pic": "\U0001F4A7",
                   "opts": [{"t": "Wet seeds still grow, Tariq. Let's dry the packets on the wall and plant them now.", "good": True, "log": "You helped Tariq rescue the wet seeds."},
                            {"t": "You have ruined everything.", "good": False, "why": "Tariq feels worse, and the seeds are still wet."},
                            {"t": "Fine, no seeds then.", "good": False, "why": "Then there is no bee garden at all."}],
                   "why": "Kind help keeps a team member in the team."},
                  {"kind": "friend", "who": "nora", "did": "painted a sign for every flower, with a bee on each one.", "log": "Nora painted the signs.", "pic": "\U0001F3F7\uFE0F"},
                  {"kind": "idea", "who": "amal", "situation": "The cats from the houses next door are digging up the seed beds every night. The team is stuck.", "pic": "\U0001F408",
                   "opts": [{"t": "Let's lay twigs across the soil so the cats cannot dig.", "good": True, "log": "Your idea: twigs across the soil."},
                            {"t": "Let's stand guard all night.", "good": False, "why": "Nobody can stand guard all night. The cats win."},
                            {"t": "Let's dig up the seeds so the cats cannot.", "good": False, "why": "Then there is no garden."}],
                   "why": "Twigs stop the digging. Your idea finished the garden."},
              ]},
             "The bee garden is dug, watered, labelled and protected. A team did it."),

        step("contrib", "Who did what in the garden?", "\U0001F64B", "Garden rememberer", ["4Ft.01", "4Fc.01"],
             "The garden is done. Which of these were YOURS, and what did each friend do?",
             explain(
                 ["Looking back at a team job: what was mine, what was a friend's.", "And together it was more than any of us alone."],
                 [],
                 [],
                 ["Tap yours, then each friend's."]),
             {},
             "You said what you did and what each friend did. Together, the garden got done."),

        step("questions", "Jobs, ideas and looking back", "\U0001F4AC", "Team judge", ["4Cc.01", "4Ct.01", "4Fc.01", "4Ft.01"],
             "Think about the museum, the garden and your honest look back. Tap the answer.",
             explain(
                 ["Give jobs to the right people. Bring ideas. Say what you did well and what you could do better."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Who should read the labels aloud at the opening?", "\U0001F5E3️", "Yusuf, because he speaks clearly", ["Hana, because she likes museums", "whoever asks first"], "The job needs a clear voice. Give it to the one who has it."),
                 q("The paint would not stick to the card. Which idea got the team unstuck?", "\U0001F3A8", "paint on paper and glue it on", ["leave the high street out", "use more paint"], "Paper takes paint; card takes glue."),
                 q("What is a LIMITATION of your teamwork?", "\U0001F914", "something that took more than one go, or that you could do better", ["something you did well", "a job you did not have"], "Knowing it is how you improve."),
                 q("What did working together make possible for the museum?", "\U0001F91D", "four jobs needing four skills, done in one week", ["nothing", "a museum with no bridge"], "One person could not read, draw, build and present all at once."),
             ]},
             "You know how a team allocates, brings ideas, and looks back honestly."),

        step("quiz", "Show what you know", "⭐", "Star team player", ["4Cc.01", "4Ct.01", "4Fc.01", "4Ft.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does it mean to ALLOCATE tasks?", "\U0001F4CB", "give each job to the team member whose skill it needs", ["do every job yourself", "do the jobs in alphabetical order", "give the best job to your friend"], "The model maker builds, the clear speaker presents."),
                 q("Who should build the model bridge?", "\U0001F309", "Sami, because he makes models", ["Yusuf, because he speaks clearly", "you, because you read old writing", "anyone"], "The job needs model-making."),
                 q("Yusuf was worried about reading aloud. What is working positively?", "\U0001F5E3️", "practise with him at lunchtime", ["read the labels instead of him", "tell him not to be silly", "ignore him"], "Help with the job, without taking it away."),
                 q("The bridge kept tipping over. Which idea helped?", "\U0001F309", "glue it to a wide base", ["tell everyone to stop walking", "put it in a cupboard", "give up"], "A wide base cannot tip."),
                 q("What is a STRENGTH of your teamwork?", "\U0001F4AA", "something you did well, first time", ["something that took three goes", "a job you skipped", "being the loudest"], "Giving out the jobs right first time was a strength."),
                 q("Why be honest about what took two goes?", "\U0001F914", "because knowing it is how you get better", ["to get told off", "you should not be", "to win"], "A limitation you know about is one you can work on."),
                 q("The bees needed water without drowning. Which idea helped?", "\U0001F41D", "pebbles in a saucer of water", ["no water", "a deeper bucket", "a bath"], "Pebbles give bees a place to land."),
                 q("How did working together make the museum BETTER, not just possible?", "\U0001F31F", "each part was done by the person best at it", ["it was slower", "it was not better", "only one person worked"], "Letters read, street drawn, bridge built, labels spoken: each by the right person."),
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
         "The class museum needs four jobs: read the old letters, draw the high street, build the bridge, read the labels aloud. You read old handwriting, Hana draws, Sami makes models, Yusuf speaks clearly. Each job to the person whose skill it needs."),
    part("\U0001F4A1", "Ideas when the team is stuck",
         "The paint will not stick to the card. The bridge keeps tipping. Each time the team is stuck, a team member brings an idea: paint on paper, glue to a wide base. Ideas keep a team moving."),
    part("\U0001F91D", "Working positively",
         "Yusuf is worried about reading aloud. Practise with him. Tariq spilled water on the seeds. Dry them and plant them together. Help with a job without taking it away, and nobody leaves the team."),
    part("\U0001F4AA", "Strengths and limitations",
         "Then look back honestly. What did you get right first time? That is a strength. What took two goes? That is a limitation, and knowing it is how you get better. Both are true at once."),
    part("\U0001F31F", "Better together",
         "Four jobs needing four skills, all in one week. One person could not read, draw, build and present at once. Working together made the museum possible, and each part done by the right person made it better."),
]

LESSON["words"] = [
    word("allocate", "\U0001F4CB", "To give out jobs, each to the person who can do it.",
         ["The team allocated four jobs.", "Allocate the bridge to Sami."]),
    word("skill", "\U0001F9E9", "Something a person is good at.",
         ["Hana's skill is drawing.", "Match the job to the skill."]),
    word("strength", "\U0001F4AA", "Something you do well.",
         ["Giving out jobs was a strength.", "Name one strength."]),
    word("limitation", "\U0001F914", "Something you could do better.",
         ["Rushing my idea was a limitation.", "Knowing a limitation helps you improve."]),
    word("outcome", "\U0001F3AF", "What the team makes or achieves together.",
         ["The museum was the shared outcome.", "A better outcome, together."]),
    word("display", "\U0001F3DB️", "Things arranged so people can look at them.",
         ["The museum display was ready for parents' evening.", "Hana's high street went on the display."]),
]

LESSON["home"] = [
    home("Give out the jobs", "Everyone at home and a shared job: a meal, a tidy-up, a trip to pack for",
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
         ["Your grown-up says: we are stuck, the paint will not stick and the glue has gone.",
          "Bring two ideas that would get the team going.",
          "Say which idea helps EVERYONE, not just you."],
         "Which idea would really have worked?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to swim"],
    "changed": [
        {"before": "The best job should go to my best friend.", "after": "Each job should go to the person whose skill it needs."},
        {"before": "Looking back means saying what I did well.", "after": "Looking back means saying what I did well AND what took more than one go."},
        {"before": "A team just shares the jobs out any old way.", "after": "A team is better because each part is done by the person best at it."},
    ],
}
