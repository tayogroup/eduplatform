# -*- coding: utf-8 -*-
"""Lesson 6 - Better Together.

0838 Stage 1 Collaboration: 1Cc.01 share resources with others while
working independently or with a partner; 1Ct.01 work positively with
others. Reflection: 1Fc.01 identify personal contribution in the form of an
action intended to help achieve a shared outcome; 1Ft.01 identify an action
that someone else contributed to achieve a shared outcome. The topic is the
class garden and the class mural - two jobs one child cannot finish alone,
which is what makes a shared outcome shared.
"""
from _kit import explain, step, opt, q, person, part, word, home

GARDEN_FRIENDS = [person("sami", "Sami", "\U0001F466\U0001F3FE"), person("nora", "Nora", "\U0001F467\U0001F3FD"), person("omar", "Omar", "\U0001F466\U0001F3FD")]
MURAL_FRIENDS = [person("hana", "Hana", "\U0001F467\U0001F3FF"), person("tariq", "Tariq", "\U0001F466\U0001F3FF"), person("amal", "Amal", "\U0001F467\U0001F3FE")]

LESSON = {
    "slug": "better-together",
    "title": "Better Together",
    "blurb": "Plant a garden and paint a mural with three friends. Share what you have so everyone can finish, be kind when things go wrong, and then say what you did and what each friend did.",
    "steps": [
        step("demo", "One person, or a team?", "\U0001F91D", "Team spotter", ["1Ct.01"],
             "Some jobs are too big for one person. Press <b>Next</b> and see.",
             explain(
                 ["A big job gets done when people work together.", "That is a team."],
                 ["One child cannot dig, plant, water and label a whole garden before home time.",
                  "Four children can, if they share the jobs and share the things."],
                 ["Children think a team means everyone does the same thing.", "A team is everyone doing a bit, so it all gets done."],
                 ["Press Next and watch the garden get planted."]),
             {"frames": [
                 {"pic": "\U0001F469\U0001F3FE‍\U0001F3EB", "cap": "Teacher Yasmin says: <b>let's plant a class garden!</b>", "say": "Teacher Yasmin says: let's plant a class garden!"},
                 {"pic": "\U0001F9D2", "cap": "One child tries to do it all. Digging, planting, watering… it is <b>too much</b>.", "say": "One child tries to do it all. Digging, planting, watering. It is too much.", "sound": "thud"},
                 {"pic": "\U0001F91D", "cap": "So four friends do it <b>together</b>. Omar digs. Sami plants.", "say": "So four friends do it together. Omar digs. Sami plants.", "sound": "pop"},
                 {"pic": "\U0001F4A7", "cap": "Nora waters. You put on the labels. Everyone <b>shares</b> the seeds and the tools.", "say": "Nora waters. You put on the labels. Everyone shares the seeds and the tools.", "sound": "pop"},
                 {"pic": "\U0001F33B", "cap": "The garden is done before home time. <b>Better together.</b>", "say": "The garden is done before home time. Better together.", "sound": "tada"},
             ]},
             "A big job gets done when a team shares the work and shares the things."),

        step("team", "Plant the class garden", "\U0001F331", "Garden team", ["1Cc.01", "1Ct.01"],
             "You and three friends are planting the class garden. Share, be kind, and watch it grow.",
             explain(
                 ["Working together means sharing what you have, and being kind when things go wrong."],
                 ["Sami has no seeds and you have four. You both need two. Give him two, and you can both plant.",
                  "Nora spills the water. Do not shout. Say: never mind, let's fill it again together."],
                 ["Children give ALL their seeds away to be kind, and then cannot plant their own.", "Share so that BOTH of you have enough."],
                 ["Read what is happening, tap what you would do, and watch the garden grow."]),
             {"goal": "plant the class garden", "scene": "garden", "friends": GARDEN_FRIENDS,
              "rounds": [
                  {"kind": "friend", "who": "omar", "did": "dug four holes in the soil, one for each of us.", "log": "Omar dug the holes for everyone.", "pic": "\U0001F573️"},
                  {"kind": "share", "who": "sami", "resource": {"id": "seeds", "label": "seeds", "pic": "\U0001F331"}, "you": 4, "need": 2,
                   "ask": "Sami has no seeds. You have 4 seeds, and you each need 2 to plant.",
                   "opts": [{"give": 2, "t": "Give Sami 2 of your seeds"}, {"give": 0, "t": "Keep all 4 seeds for yourself"}, {"give": 4, "t": "Give Sami all 4 seeds"}],
                   "why": "Two each means you can both plant.", "log": "You shared your seeds with Sami."},
                  {"kind": "work", "who": "nora", "situation": "Nora trips and spills the whole watering can.", "pic": "\U0001F4A7",
                   "opts": [{"t": "Never mind, Nora! Let's fill it up again together.", "good": True, "log": "You helped Nora fill the watering can again."},
                            {"t": "You ruined it! Now we have no water.", "good": False, "why": "Nora feels terrible, and the water is still spilt. Shouting does not fill the can."},
                            {"t": "I am not playing any more.", "good": False, "why": "If you walk away, nobody waters the garden. The job stops."}],
                   "why": "Being kind when something goes wrong keeps the team going."},
                  {"kind": "friend", "who": "nora", "did": "filled the can again and watered everyone's seeds, including yours.", "log": "Nora watered everyone's seeds.", "pic": "\U0001F4A7"},
                  {"kind": "share", "who": "omar", "resource": {"id": "sticks", "label": "label sticks", "pic": "\U0001F3F7️"}, "you": 2, "need": 1,
                   "ask": "Omar has no stick to label his plant. You have 2 label sticks, and you each need 1.",
                   "opts": [{"give": 1, "t": "Give Omar 1 of your sticks"}, {"give": 0, "t": "Keep both sticks"}, {"give": 2, "t": "Give Omar both sticks"}],
                   "why": "One each, and both plants get a label.", "log": "You gave Omar a stick for his label."},
                  {"kind": "work", "who": "sami", "situation": "Sami is sad. His seed will not go into the hole.", "pic": "\U0001F622",
                   "opts": [{"t": "Let me help you push it in gently.", "good": True, "log": "You helped Sami plant his seed."},
                            {"t": "That is easy. You are silly.", "good": False, "why": "Sami feels worse, and his seed is still on the ground."},
                            {"t": "Do it yourself.", "good": False, "why": "Sami is stuck, and the garden has an empty hole."}],
                   "why": "Helping a friend who is stuck is working positively together."},
              ]},
             "The garden is planted, watered and labelled. Four friends did it together."),

        step("contrib", "Who did what in the garden?", "\U0001F64B", "Garden helper", ["1Fc.01", "1Ft.01"],
             "The garden is done. Which of these did YOU do? And what did each friend do?",
             explain(
                 ["Looking back at a team job, you can say what YOU did to help.", "And you can say what a friend did."],
                 ["You shared your seeds with Sami. That was you.", "Omar dug the holes. That was Omar.",
                  "Everybody did something, and that is why it got done."],
                 ["Children say they did everything.", "Say the things you really did. Your friends did the rest."],
                 ["Tap the things you did. Then tap what each friend did."]),
             {},
             "You said what you did, and what your friends did. Everyone helped."),

        step("sort", "Team words", "\U0001F4AC", "Team talker", ["1Ct.01"],
             "Some things you say help a team. Some stop it. Which is it?",
             explain(
                 ["The words you use can help a team or stop it."],
                 ["Let's do it together: helps.", "That's mine, go away: stops."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Does it help the team, or stop it?",
              "bins": [{"id": "help", "label": "Helps the team", "pic": "\U0001F91D"}, {"id": "stop", "label": "Stops the team", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F91D", "label": "Let's do it together.", "bin": "help", "why": "Together is what a team is."},
                  {"pic": "\U0001F381", "label": "You can have some of mine.", "bin": "help", "why": "Sharing means everyone can finish."},
                  {"pic": "\U0001F44F", "label": "Well done, Nora!", "bin": "help", "why": "Kind words keep a team happy."},
                  {"pic": "\U0001F6AB", "label": "That's mine. Go away.", "bin": "stop", "why": "Nobody can work with someone who says that."},
                  {"pic": "\U0001F645", "label": "I will not help.", "bin": "stop", "why": "If one person will not help, the job is harder for everyone."},
                  {"pic": "\U0001F504", "label": "Let's take turns.", "bin": "help", "why": "Turns mean everyone gets a go."},
              ]},
             "Kind words help a team. Unkind words stop it."),

        step("team", "Paint the class mural", "\U0001F3A8", "Mural team", ["1Cc.01", "1Ct.01"],
             "A new team, a new job: a big painting for the classroom wall. Share, be kind, watch it fill up.",
             explain(
                 ["The same skills, a different job.", "Share the brushes and the paint. Be kind when a mistake happens."],
                 ["Tariq has no brush. You have two. Give him one.", "Amal paints over your hills by mistake. Say: it is all right, let's do it again together."],
                 ["Children think a mistake by a friend ruins everything.", "A mistake is fixed together. A quarrel is not."],
                 ["Read, tap, and watch the mural fill up."]),
             {"goal": "paint the class mural", "scene": "mural", "friends": MURAL_FRIENDS,
              "rounds": [
                  {"kind": "friend", "who": "hana", "did": "painted the whole sky blue while the rest of us mixed the paints.", "log": "Hana painted the sky.", "pic": "\U0001F3A8"},
                  {"kind": "share", "who": "tariq", "resource": {"id": "brush", "label": "brushes", "pic": "\U0001F58C️"}, "you": 2, "need": 1,
                   "ask": "Tariq has no brush. You have 2 brushes, and you each need 1.",
                   "opts": [{"give": 1, "t": "Give Tariq 1 of your brushes"}, {"give": 0, "t": "Keep both brushes"}, {"give": 2, "t": "Give Tariq both brushes"}],
                   "why": "One brush each, and you can both paint.", "log": "You shared a brush with Tariq."},
                  {"kind": "work", "who": "amal", "situation": "Amal paints a green stripe right over the hills you just painted. It was a mistake.", "pic": "\U0001F58C️",
                   "opts": [{"t": "It is all right, Amal. Let's paint the hills again together.", "good": True, "log": "You helped Amal paint the hills again."},
                            {"t": "You spoiled it! Go away.", "good": False, "why": "Amal is upset and the hills are still spoiled. Now there are two problems."},
                            {"t": "Now I will paint something else on my own.", "good": False, "why": "Going off on your own leaves the hills spoiled and Amal alone. Painting them again together fixes it."}],
                   "why": "Fixing a mistake together is working positively."},
                  {"kind": "friend", "who": "tariq", "did": "stood on the step to paint the sun at the top, where nobody else could reach.", "log": "Tariq painted the sun at the top.", "pic": "☀️"},
                  {"kind": "share", "who": "amal", "resource": {"id": "yellow", "label": "pots of yellow paint", "pic": "\U0001F7E1"}, "you": 4, "need": 2,
                   "ask": "Amal's yellow paint has run out. You have 4 pots of yellow, and you each need 2 for the houses.",
                   "opts": [{"give": 2, "t": "Give Amal 2 pots"}, {"give": 0, "t": "Keep all 4 pots"}, {"give": 4, "t": "Give Amal all 4 pots"}],
                   "why": "Two pots each, and both houses get painted.", "log": "You shared your yellow paint with Amal."},
                  {"kind": "work", "who": "hana", "situation": "Hana wants to paint the people, and so do you. There is one space left.", "pic": "\U0001F9D2",
                   "opts": [{"t": "Let's paint one person each, side by side.", "good": True, "log": "You and Hana painted the people together."},
                            {"t": "I was here first. Go and paint something else.", "good": False, "why": "Hana feels pushed out, and the mural has one person instead of two."},
                            {"t": "Fine. I am not painting at all.", "good": False, "why": "Now nobody paints the people, and the mural is not finished."}],
                   "why": "Sharing a space so you both get a go is teamwork."},
              ]},
             "The mural is finished. Four friends painted it together."),

        step("contrib", "Who did what on the mural?", "\U0001F64C", "Mural helper", ["1Fc.01", "1Ft.01"],
             "The mural is done. Tap the things YOU did, then what each friend did.",
             explain(
                 ["Look back again: what did you do, and what did a friend do?"],
                 ["You shared a brush with Tariq. That was you.", "Hana painted the sky. That was Hana."],
                 [],
                 ["Tap yours, then each friend's."]),
             {},
             "You looked back at the mural and said who did what. That is reflecting on teamwork."),

        step("questions", "Teamwork", "\U0001F4AC", "Team judge", ["1Cc.01", "1Ct.01", "1Fc.01", "1Ft.01"],
             "Think about the garden and the mural. Tap the answer.",
             explain(
                 ["Share so both can finish. Be kind when things go wrong. Say what you did, and what a friend did."],
                 ["Those are the four things this lesson is about."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Sami has no seeds. You have 4, and you each need 2. What do you do?", "\U0001F331", "give Sami 2", ["keep all 4", "give Sami all 4"], "Two each means you can both plant."),
                 q("Nora spills the water. What do you say?", "\U0001F4A7", "Never mind, let's fill it again together.", ["You ruined it!", "I am not playing."], "Kind words keep the team going."),
                 q("Who dug the holes in the garden?", "\U0001F573️", "Omar", ["you", "Nora"], "Omar dug the holes for everyone. That was his part."),
                 q("Why did the garden get done before home time?", "\U0001F33B", "because four friends shared the work", ["because one child did it all", "because nobody helped"], "A team shares the jobs and the things, so it all gets done."),
             ]},
             "You know how a team works, and who did what."),

        step("quiz", "Show what you know", "⭐", "Star team player", ["1Cc.01", "1Ct.01", "1Fc.01", "1Ft.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the garden, the mural, and who did what."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a team?", "\U0001F91D", "people working together on one job", ["one person doing everything", "a kind of garden", "a paintbrush"], "A team shares the work so it all gets done."),
                 q("You have 2 brushes and Tariq has none. You each need 1. What do you do?", "\U0001F58C️", "give Tariq 1 brush", ["keep both", "give Tariq both"], "One each, and you can both paint."),
                 q("If you give ALL your seeds away, what happens?", "\U0001F331", "you cannot plant your own", ["everyone is happy", "you get more seeds"], "Share so that BOTH of you have enough."),
                 q("Amal paints over your hills by mistake. What helps the team?", "\U0001F3A8", "Let's paint them again together.", ["You spoiled it!", "I will paint on my own.", "Go away."], "Fixing a mistake together keeps the team going."),
                 q("Which words STOP a team?", "\U0001F6AB", "That's mine, go away.", ["Let's take turns.", "Well done!", "You can have some of mine."], "Nobody can work with someone who says that."),
                 q("Who painted the sun at the top of the mural?", "☀️", "Tariq", ["Hana", "you", "Amal"], "Tariq stood on the step to reach it."),
                 q("What does it mean to say what YOU did to help?", "\U0001F64B", "naming the things you really did", ["saying you did everything", "saying nothing"], "Say the things you really did. Your friends did the rest."),
                 q("Why is a job better together?", "\U0001F33B", "everyone does a bit, so it all gets done", ["it takes longer", "nobody has to do anything"], "Four friends finished the garden before home time."),
             ]},
             "That is the whole lesson finished. You can share, work kindly, and say who did what."),
    ],
}


LESSON["about"] = [
    "Share what you have so that both of you can finish.",
    "Work kindly with others when something goes wrong.",
    "Say what you did to help the team finish a job.",
    "Say what a friend did to help the team.",
]

LESSON["lecture"] = [
    part("\U0001F91D", "A team",
         "Some jobs are too big for one person. A garden needs digging, planting, watering and labelling. Four friends can do it before home time if each one does a bit. That is a team."),
    part("\U0001F331", "Sharing",
         "Sami has no seeds and you have four. You each need two. Give him two and you can both plant. Give him all four and you cannot plant yours. Share so that both of you have enough."),
    part("\U0001F4A7", "When things go wrong",
         "Nora spills the water. Shouting does not fill the can. Walking away stops the job. Saying never mind, let's fill it together, is what keeps the team going."),
    part("\U0001F64B", "What I did",
         "When the job is done, look back. What did you do to help? You shared your seeds. You helped Sami plant his. Say the things you really did."),
    part("\U0001F64C", "What a friend did",
         "And say what a friend did. Omar dug the holes. Nora watered the seeds. Everybody did something, and that is why the garden got done."),
]

LESSON["words"] = [
    word("team", "\U0001F91D", "People who work together on one job.",
         ["Our team planted the garden.", "A team shares the work."]),
    word("share", "\U0001F381", "To give some of what you have to somebody who needs it.",
         ["Share your seeds with Sami.", "We shared the brushes."]),
    word("together", "\U0001F465", "With other people, not alone.",
         ["We painted the mural together.", "Let's do it together."]),
    word("help", "\U0001F64B", "To do something that makes a job easier for somebody.",
         ["Help Sami plant his seed.", "Omar helped by digging."]),
    word("kind", "\U0001F49B", "Friendly and gentle to other people.",
         ["Be kind when Nora spills the water.", "Kind words help a team."]),
    word("turn", "\U0001F504", "Your go, when everyone takes it in turns.",
         ["It is your turn to water.", "Let's take turns."]),
]

LESSON["home"] = [
    home("A job together", "A grown-up and a small job: laying the table, or tidying the toys",
         ["Do the job together. Each person does a bit.",
          "Share the things you need: the spoons, the toy box.",
          "When it is done, say what YOU did and what your grown-up did."],
         "Was it quicker together than on your own?"),
    home("Share the pencils", "A grown-up, some pencils, and two pieces of paper",
         ["Count the pencils. Give your grown-up enough to draw with, and keep enough for yourself.",
          "Both of you draw a picture.",
          "Say: we both had enough because we shared."],
         "What would have happened if you kept them all?"),
    home("Kind words", "Everyone at home",
         ["When something goes wrong today, say something kind instead of something cross.",
          "Notice what happens next.",
          "Tell somebody about it at dinner."],
         "Did the kind words help fix the problem?"),
]

LESSON["lookback"] = {
    "not": ["how to bake bread", "the names of the planets", "how to swim"],
}
