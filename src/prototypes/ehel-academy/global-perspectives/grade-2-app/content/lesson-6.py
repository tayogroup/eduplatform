# -*- coding: utf-8 -*-
"""Lesson 6 - Our Team's Ideas.

0838 Stage 2 Collaboration: 2Cc.01 carry out a task in order to contribute
to a shared outcome; 2Ct.01 work positively with others, contributing to a
shared outcome. Reflection: 2Fc.01 identify personal contribution in the
form of an IDEA intended to help achieve a shared outcome; 2Ft.01 identify
an idea that someone else contributed. The topics are the school vegetable
patch and the backdrop for our class assembly - two shared outcomes where a
child does their own job AND the team gets stuck and needs an idea.
"""
from _kit import explain, step, opt, q, person, part, word, home

PATCH_FRIENDS = [person("sami", "Sami", "\U0001F466\U0001F3FE"), person("nora", "Nora", "\U0001F467\U0001F3FD"), person("omar", "Omar", "\U0001F466\U0001F3FD")]
BACKDROP_FRIENDS = [person("hana", "Hana", "\U0001F467\U0001F3FF"), person("tariq", "Tariq", "\U0001F466\U0001F3FF"), person("amal", "Amal", "\U0001F467\U0001F3FE")]

LESSON = {
    "slug": "our-teams-ideas",
    "title": "Our Team's Ideas",
    "blurb": "Plant the school vegetable patch and paint the assembly backdrop with a team. Do your own job, suggest an idea when the team is stuck, and then say which idea was yours and which was a friend's.",
    "steps": [
        step("demo", "A job and an idea", "\U0001F4A1", "Idea spotter", ["2Ct.01"],
             "Last year the team shared things. This year each person does a JOB, and when the team gets stuck, somebody has an IDEA. Press <b>Next</b>.",
             explain(
                 ["A team finishes a shared job when everyone does their part.", "And when the team gets stuck, an idea gets it moving again."],
                 ["Omar digs. Nora waters. You plant. That is everyone doing their job.",
                  "The birds eat the seeds. You have an idea: a scarecrow. That is an idea for the team."],
                 ["Children think an idea is the same as doing.", "A job is something you DO. An idea is something you SUGGEST that helps everyone."],
                 ["Press Next and spot the idea."]),
             {"frames": [
                 {"pic": "\U0001F331", "cap": "The class is planting a <b>vegetable patch</b>. Everyone has a job.", "say": "The class is planting a vegetable patch. Everyone has a job."},
                 {"pic": "\U0001F466\U0001F3FD", "cap": "Omar's job: <b>dig</b>. Nora's job: <b>water</b>. Your job: <b>plant</b>.", "say": "Omar's job is to dig. Nora's job is to water. Your job is to plant.", "sound": "pop"},
                 {"pic": "\U0001F426", "cap": "Then the birds come and <b>eat the seeds</b>. The team is stuck.", "say": "Then the birds come and eat the seeds. The team is stuck.", "sound": "buzz"},
                 {"pic": "\U0001F4A1", "cap": "You have an <b>idea</b>: make a scarecrow! Everybody says yes.", "say": "You have an idea: make a scarecrow! Everybody says yes.", "sound": "ding"},
                 {"pic": "\U0001F91D", "cap": "Jobs get the work done. <b>Ideas</b> get the team unstuck. A team needs both.", "say": "Jobs get the work done. Ideas get the team unstuck. A team needs both.", "sound": "tada"},
             ]},
             "Everyone does a job, and an idea gets the team unstuck."),

        step("team", "Plant the vegetable patch", "\U0001F955", "Patch team", ["2Cc.01", "2Ct.01"],
             "You and three friends are planting the school vegetable patch. Do your job, help when things go wrong, and suggest an idea when the team is stuck.",
             explain(
                 ["Your job has steps. Do them in order and the patch moves on.", "When the team is stuck, suggest the idea that would get it moving."],
                 ["Your job: plant the seeds. Make a small hole, drop a seed in, cover it with soil.",
                  "The birds eat the seeds. A scarecrow keeps them off. Shouting at the birds does not."],
                 ["Children suggest the funniest idea.", "Suggest the one that would actually get the team unstuck."],
                 ["Read what is happening, do your job, tap your idea, watch the patch grow."]),
             {"goal": "plant the school vegetable patch", "scene": "garden", "friends": PATCH_FRIENDS,
              "rounds": [
                  {"kind": "friend", "who": "omar", "did": "dug four rows for the seeds, one for each of us.", "log": "Omar dug the rows.", "pic": "\U0001F573️"},
                  {"kind": "task", "who": "sami", "job": "Plant your row of seeds", "pic": "\U0001F331",
                   "steps": [{"id": "hole", "t": "Make a small hole", "pic": "\U0001F573️"}, {"id": "seed", "t": "Drop a seed in", "pic": "\U0001F330"}, {"id": "cover", "t": "Cover it with soil", "pic": "\U0001F7EB"}],
                   "log": "You planted your row of seeds.", "why": "Your row is planted, so the patch is one row further on."},
                  {"kind": "idea", "who": "nora", "situation": "The birds keep landing and eating the seeds. The team is stuck.", "pic": "\U0001F426",
                   "opts": [{"t": "Let's make a scarecrow to keep the birds off.", "good": True, "log": "Your idea: make a scarecrow."},
                            {"t": "Let's shout at the birds all day.", "good": False, "why": "The birds come back the moment you stop. The seeds are still eaten."},
                            {"t": "Let's give up on the patch.", "good": False, "why": "Then there is no patch at all. That does not get the team unstuck."}],
                   "why": "A scarecrow keeps the birds off all day. That idea gets the team moving."},
                  {"kind": "friend", "who": "nora", "did": "filled the watering can and watered every row.", "log": "Nora watered every row.", "pic": "\U0001F4A7"},
                  {"kind": "work", "who": "sami", "situation": "Sami drops the seed packet and the seeds spill everywhere.", "pic": "\U0001F330",
                   "opts": [{"t": "Never mind, Sami. Let's pick them up together.", "good": True, "log": "You helped Sami pick up the spilt seeds."},
                            {"t": "You have wasted all the seeds!", "good": False, "why": "Sami feels terrible and the seeds are still on the ground."},
                            {"t": "That is your problem, not mine.", "good": False, "why": "If nobody helps, the seeds stay spilt and the row stays empty."}],
                   "why": "Helping when something goes wrong keeps the team working."},
                  {"kind": "idea", "who": "omar", "situation": "Nobody can remember which row is carrots and which is beans. The team is stuck.", "pic": "\U0001F3F7️",
                   "opts": [{"t": "Let's put a label with a picture on each row.", "good": True, "log": "Your idea: a picture label on every row."},
                            {"t": "Let's pull them all up and start again.", "good": False, "why": "Then the planting is wasted, and you still would not know which is which."},
                            {"t": "Let's just guess.", "good": False, "why": "Guessing does not tell anybody which row is which."}],
                   "why": "A picture label tells everyone which row is which. That idea gets the team unstuck."},
              ]},
             "The patch is dug, planted, watered, protected and labelled. A team did it with jobs and ideas."),

        step("contrib", "Who did what in the patch?", "\U0001F64B", "Patch helper", ["2Fc.01", "2Ft.01"],
             "The patch is done. Which of these did YOU do or suggest? And what did each friend do?",
             explain(
                 ["Looking back, you can say what you did, and which idea was yours.", "And which idea, or which job, was a friend's."],
                 ["Your idea: a scarecrow. That was you.", "Omar dug the rows. That was Omar."],
                 [],
                 ["Tap yours, then each friend's."]),
             {},
             "You said what you did, which ideas were yours, and what your friends did."),

        step("sort", "A job or an idea?", "\U0001F4A1", "Job-or-idea sorter", ["2Cc.01", "2Fc.01"],
             "Some of these are jobs the team did. Some are ideas the team had. Which is it?",
             explain(
                 ["A job is something you DO with your hands.", "An idea is something you SUGGEST that changes what the team does."],
                 ["Digging the rows: a job.", "Making a scarecrow to stop the birds: an idea."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "A job, or an idea?",
              "bins": [{"id": "job", "label": "A job", "pic": "\U0001F6E0️"}, {"id": "idea", "label": "An idea", "pic": "\U0001F4A1"}],
              "items": [
                  {"pic": "\U0001F573️", "label": "digging the rows", "bin": "job", "why": "Omar did it with a spade. A job."},
                  {"pic": "\U0001F426", "label": "make a scarecrow to stop the birds", "bin": "idea", "why": "Somebody suggested it, and it changed what the team did. An idea."},
                  {"pic": "\U0001F4A7", "label": "watering every row", "bin": "job", "why": "Nora did it with the can. A job."},
                  {"pic": "\U0001F3F7️", "label": "put a picture label on each row", "bin": "idea", "why": "Somebody suggested it. An idea."},
                  {"pic": "\U0001F331", "label": "planting the seeds", "bin": "job", "why": "You did it with your hands. A job."},
                  {"pic": "\U0001F4A1", "label": "paint the sky first so it dries", "bin": "idea", "why": "Somebody suggested the order. An idea."},
              ]},
             "Jobs are done. Ideas are suggested. A team needs both."),

        step("team", "Paint the assembly backdrop", "\U0001F3A8", "Backdrop team", ["2Ct.01", "2Cc.01"],
             "A new team, a new job: the big painting behind our class assembly. This time the team keeps getting stuck, and it needs ideas.",
             explain(
                 ["When a team is stuck, the idea that helps is the one that gets everyone working again."],
                 ["The paint is running out. Mix what is left with white and it goes further.", "Nobody can reach the top. A step stool."],
                 ["Children suggest the idea that helps only themselves.", "An idea for the team helps everyone finish."],
                 ["Read, suggest, and watch the backdrop fill up."]),
             {"goal": "paint the assembly backdrop", "scene": "mural", "friends": BACKDROP_FRIENDS,
              "rounds": [
                  {"kind": "friend", "who": "hana", "did": "had the idea to paint the sky first, so it would be dry before the hills went on.", "log": "Hana's idea: paint the sky first so it dries.", "pic": "\U0001F4A1"},
                  {"kind": "idea", "who": "tariq", "situation": "The green paint is nearly gone, and the hills are only half done. The team is stuck.", "pic": "\U0001F7E9",
                   "opts": [{"t": "Let's mix the last green with white so it goes further.", "good": True, "log": "Your idea: mix the green with white to make it go further."},
                            {"t": "Let's leave the hills half painted.", "good": False, "why": "A half-painted backdrop is not finished. The team is still stuck."},
                            {"t": "Let's paint the hills red instead.", "good": False, "why": "There is no red paint, and the hills in our picture are green. The team is still stuck."}],
                   "why": "Mixing the paint with white makes it go further. That idea finishes the hills."},
                  {"kind": "friend", "who": "tariq", "did": "had the idea to use a step stool so somebody could reach the top for the sun.", "log": "Tariq's idea: a step stool to reach the top.", "pic": "\U0001F4A1"},
                  {"kind": "idea", "who": "amal", "situation": "Everyone wants to paint a house, but there is only room for two. The team is stuck.", "pic": "\U0001F3E0",
                   "opts": [{"t": "Let's paint two houses and take turns doing the windows and doors.", "good": True, "log": "Your idea: two houses, and take turns on the windows and doors."},
                            {"t": "Let's paint six tiny houses on top of each other.", "good": False, "why": "Six houses on top of each other is a mess, and nobody can see them."},
                            {"t": "Let's argue until somebody gives up.", "good": False, "why": "Arguing does not paint a house. The team is still stuck."}],
                   "why": "Two houses with turns for the details lets everyone paint. That idea gets the team unstuck."},
                  {"kind": "friend", "who": "amal", "did": "had the idea to paint the people last, in front of everything else.", "log": "Amal's idea: paint the people last, in front.", "pic": "\U0001F4A1"},
                  {"kind": "idea", "who": "hana", "situation": "The backdrop looks empty at the top. The team wants something there but cannot agree. Stuck.", "pic": "\U0001F308",
                   "opts": [{"t": "Let's paint birds and a rainbow so the sky is not empty.", "good": True, "log": "Your idea: birds and a rainbow in the sky."},
                            {"t": "Let's leave it empty and go home.", "good": False, "why": "The team wanted something there. Going home does not decide it."},
                            {"t": "Let's paint over the whole thing.", "good": False, "why": "Painting over it wastes everything the team has done."}],
                   "why": "Birds and a rainbow fill the sky, and everyone agrees. That idea finishes the backdrop."},
              ]},
             "The backdrop is finished. Every time the team was stuck, an idea got it going."),

        step("contrib", "Whose idea was it?", "\U0001F4A1", "Idea rememberer", ["2Fc.01", "2Ft.01"],
             "The backdrop is done, and it took six ideas. Which ideas were YOURS? And which was each friend's?",
             explain(
                 ["A team finishes with ideas from lots of people.", "Looking back, you can say which idea was yours, and which was a friend's."],
                 ["Mixing the green with white: your idea.", "Painting the sky first: Hana's idea."],
                 [],
                 ["Tap your ideas, then each friend's."]),
             {"what": "idea"},
             "You said which ideas were yours, and which idea each friend had. That is reflecting on teamwork."),

        step("questions", "Jobs, ideas and teams", "\U0001F4AC", "Team judge", ["2Cc.01", "2Ct.01", "2Fc.01", "2Ft.01"],
             "Think about the patch and the backdrop. Tap the answer.",
             explain(
                 ["Do your job. Suggest an idea when the team is stuck. Say whose idea was whose."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("The birds were eating the seeds. Which idea got the team unstuck?", "\U0001F426", "make a scarecrow", ["shout at the birds", "give up"], "A scarecrow keeps the birds off all day."),
                 q("Whose idea was it to paint the sky first?", "\U0001F4A1", "Hana's", ["yours", "Tariq's"], "Hana suggested it so the sky would be dry."),
                 q("What is a JOB in a team?", "\U0001F6E0️", "something you do with your hands, like digging", ["something you suggest", "a kind of paint"], "A job is done. An idea is suggested."),
                 q("The green paint was running out. Which idea helped?", "\U0001F7E9", "mix it with white so it goes further", ["paint the hills red", "leave them half done"], "Mixing makes the paint go further."),
             ]},
             "You know jobs from ideas, and whose idea was whose."),

        step("quiz", "Show what you know", "⭐", "Star team player", ["2Cc.01", "2Ct.01", "2Fc.01", "2Ft.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What does a team need to finish a shared job?", "\U0001F91D", "everyone doing their job, and ideas when it gets stuck", ["one person doing everything", "nobody doing anything", "only ideas"], "Jobs get the work done. Ideas get the team unstuck."),
                 q("Your job was to plant your row. What came FIRST?", "\U0001F331", "make a small hole", ["cover it with soil", "drop the seed in", "water it"], "Hole, seed, cover."),
                 q("Nobody could remember which row was which. Which idea helped?", "\U0001F3F7️", "a picture label on each row", ["pull them all up", "just guess", "plant more"], "A label tells everyone."),
                 q("Sami spilt the seeds. What keeps the team working?", "\U0001F330", "Never mind, let's pick them up together.", ["You wasted them all!", "That is your problem.", "Go home."], "Helping keeps the team going."),
                 q("Which of these is an IDEA, not a job?", "\U0001F4A1", "make a scarecrow to stop the birds", ["digging the rows", "watering every row", "planting the seeds"], "Somebody suggested it. That is an idea."),
                 q("Whose idea was the step stool?", "\U0001FA91", "Tariq's", ["Hana's", "yours", "Amal's"], "Tariq suggested it to reach the top."),
                 q("Everyone wanted to paint a house, but there was room for two. Which idea helped?", "\U0001F3E0", "two houses, and take turns on the windows and doors", ["six tiny houses on top of each other", "argue", "no houses"], "Turns let everyone paint."),
                 q("Why say whose idea was whose?", "\U0001F64B", "because a team finishes with ideas from lots of people", ["because it is a rule", "to win a prize", "you do not need to"], "Everyone's idea helped, and looking back says so."),
             ]},
             "That is the whole lesson finished. You do your job, suggest ideas, and say whose idea was whose."),
    ],
}


LESSON["about"] = [
    "Do your own job so the team's shared work gets done.",
    "Work kindly with the team when something goes wrong.",
    "Suggest an idea that gets the team unstuck.",
    "Say which idea was yours and which idea was a friend's.",
]

LESSON["lecture"] = [
    part("\U0001F331", "Jobs",
         "A team finishes a shared job when everyone does their part. Omar digs. Nora waters. You plant. Each job has its steps, done in order."),
    part("\U0001F426", "Stuck",
         "Then something goes wrong. The birds eat the seeds. The green paint is running out. Nobody can reach the top. The team is stuck, and doing your job harder does not fix it."),
    part("\U0001F4A1", "Ideas",
         "An idea gets the team unstuck. A scarecrow for the birds. Mix the paint with white so it goes further. A step stool for the top. An idea is something you suggest that changes what the team does."),
    part("\U0001F91D", "Kind when it goes wrong",
         "Sami spills the seeds. Never mind, let's pick them up together. Kind words keep the team working. Cross words stop it."),
    part("\U0001F64B", "Whose idea",
         "When it is done, look back. Your idea was the scarecrow. Hana's idea was to paint the sky first. A team finishes with ideas from lots of people, and saying whose was whose is fair."),
]

LESSON["words"] = [
    word("idea", "\U0001F4A1", "Something you suggest that changes what the team does.",
         ["Your idea was a scarecrow.", "Whose idea was that?"]),
    word("job", "\U0001F6E0️", "The part of the work that is yours to do.",
         ["Your job is to plant the seeds.", "Everyone had a job."]),
    word("team", "\U0001F91D", "People working together on one shared thing.",
         ["Our team planted the patch.", "The team was stuck."]),
    word("stuck", "\U0001F6A7", "Not able to carry on until something changes.",
         ["The team was stuck when the birds came.", "An idea gets you unstuck."]),
    word("suggest", "\U0001F5E3️", "To say an idea out loud for the team.",
         ["Suggest an idea.", "You suggested labels."]),
    word("contribute", "\U0001F381", "To give something, a job or an idea, to the team's work.",
         ["Everyone contributed to the backdrop.", "You contributed an idea."]),
]

LESSON["home"] = [
    home("A job each", "Everyone at home and a shared job: making dinner, or tidying a room",
         ["Give everyone a job. Say the steps of yours before you start.",
          "Do your job in order.",
          "When it is done, say what each person's job was."],
         "Did the job get done faster because everyone had a part?"),
    home("Stuck! Ideas please", "A grown-up and a pretend problem",
         ["Your grown-up says: we are stuck, the paint has run out. What is your idea?",
          "Suggest an idea that would get the team going again.",
          "Swap: you say a stuck, they suggest an idea."],
         "Which idea would really have worked?"),
    home("Whose idea was it?", "Everyone at dinner",
         ["Think of something your family did together this week.",
          "Say one idea somebody had that helped.",
          "Say whose idea it was."],
         "Was the best idea from the person you expected?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to swim"],
}
