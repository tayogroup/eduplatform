# -*- coding: utf-8 -*-
"""Lesson 1 - Bones and Muscles.

0097 Stage 4: 4Bs.01 the important bones (skull, jaw, rib cage, hip, spine,
leg bones, arm bones); 4Bs.02 bones move because pairs of muscles contract
and relax; 4Bs.03 what skeletons do; with 4Bp.04, 4TWSp.03, 4TWSa.03 and
4SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home, cando

BONES = [
    {"id": "skull", "label": "skull", "say": "The skull. A hard case of bone that protects your brain."},
    {"id": "jaw", "label": "jaw", "say": "The jaw. The only bone in your head that moves. It lets you chew and talk."},
    {"id": "ribcage", "label": "rib cage", "say": "The rib cage. Curved bones that protect your heart and lungs, and move when you breathe."},
    {"id": "spine", "label": "spine", "say": "The spine, or backbone: a chain of small bones that holds you up and lets you bend."},
    {"id": "hip", "label": "hip", "say": "The hip bones. They join your legs to your spine and carry your weight."},
    {"id": "armbones", "label": "arm bones", "say": "The arm bones: one in the upper arm, two in the lower arm."},
    {"id": "legbones", "label": "leg bones", "say": "The leg bones: the thigh bone is the biggest bone in your body."},
]

LESSON = {
    "slug": "bones-and-muscles",
    "title": "Bones and Muscles",
    "blurb": "Find seven important bones, find out what a skeleton is for, bend an arm to see a pair of muscles take turns, and label a diagram of the skeleton.",
    "steps": [
        step("label", "Find the bones", "\U0001F9B4", "Bone finder", ["4Bs.01"],
             "Your skeleton has about two hundred bones. Tap the <b>%s</b>.",
             explain(
                 ["Seven bones every scientist should know."],
                 ["The skull and the jaw in your head.", "The spine down your back.", "The rib cage round your chest.", "The hip at the bottom of the spine.", "The arm bones and the leg bones."],
                 ["Children think the spine is one long bone.", "It is a chain of small bones, which is why you can bend."],
                 ["Listen for the bone, then tap it."]),
             {"figure": "skeleton", "ask": "Tap the %s.", "parts": BONES},
             "Skull, jaw, rib cage, spine, hip, arm bones, leg bones."),

        step("explore", "What a skeleton is for", "\U0001F6E1️", "Skeleton jobs", ["4Bs.03"],
             "A skeleton does four jobs. Tap each one.",
             explain(
                 ["Bones protect, support, move and give shape."],
                 ["The skull protects the brain; the rib cage protects the heart and lungs.", "The spine and legs hold you up.", "Muscles pull on bones to move you.", "Without a skeleton you would be a heap on the floor."],
                 ["Children think bones are dead.", "Bones are alive: they grow, and they mend when they break."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F6E1️", "label": "protecting", "sub": "brain, heart, lungs", "say": "Protecting. The skull is a hard case round your brain. The rib cage is a cage round your heart and lungs. Soft organs, hard bone around them."},
                 {"pic": "\U0001F9CD\U0001F3FE", "label": "supporting", "sub": "holding you up", "say": "Supporting. Your spine, hips and legs hold your body up against gravity. Without them you could not stand."},
                 {"pic": "\U0001F3C3\U0001F3FE", "label": "moving", "sub": "muscles pull on bones", "say": "Moving. Muscles are attached to bones. When a muscle pulls, the bone moves, and so do you."},
                 {"pic": "\U0001F9CD\U0001F3FE", "label": "giving shape", "sub": "the shape of you", "say": "Giving shape. Your skeleton is the frame your body is built on. It is why you are shaped like a person and not a jellyfish."},
             ], "need": 4,
              "then": {"ask": "Which bones protect your heart and lungs?",
                       "opts": [opt("the rib cage", True), opt("the skull", False), opt("the leg bones", False)],
                       "why": "The ribs make a cage round the heart and lungs."}},
             "Protect, support, move, give shape."),

        step("experiment", "Muscles work in pairs", "\U0001F4AA\U0001F3FE", "Muscle pairs", ["4Bs.02", "4TWSp.03", "4TWSa.01", "4TWSa.03"],
             "A muscle can only pull. Predict what happens to the arm when the biceps contracts.",
             explain(
                 ["A muscle contracts: it gets shorter and fatter, and pulls the bone it is attached to.", "It cannot push. So muscles work in pairs: one pulls the bone one way, its partner pulls it back."],
                 ["The biceps is on the front of the upper arm. Contract it and the arm bends.", "The triceps is on the back. Contract it and the arm straightens.", "While one contracts, the other relaxes."],
                 ["Children think a muscle pushes the arm straight.", "No muscle pushes. The triceps pulls it straight from the other side."],
                 ["Predict, then contract each muscle in turn."]),
             {"sim": "muscles",
              "predict": {"ask": "When the <b>biceps</b> contracts, the arm will...",
                          "opts": [opt("bend at the elbow", True), opt("straighten", False), opt("not move", False)]},
              "plan": {"ask": "How shall we find out what each muscle does? Which way is fair?",
                        "opts": [opt("Feel one muscle at a time while the arm bends, then while it straightens", True), opt("Feel both muscles at once and guess which is which", False), opt("Bend the arm as hard and fast as you can", False)],
                        "why": "One muscle, one movement, one thing at a time. Feel both at once and you cannot tell which is pulling."},
              "runAsk": "Contract the biceps, then contract the triceps. Watch both muscles.",
              "happened": {"ask": "What happened to the <b>two muscles</b>?",
                           "opts": [opt("The biceps got short and fat and pulled the arm up; the triceps relaxed. Then they swapped", True), opt("Both muscles contracted at once", False), opt("The muscles pushed the bone", False)],
                           "why": "One contracts and pulls, the other relaxes and stretches. Then they swap. That is a pair of muscles."},
              "conclude": {"ask": "Why do muscles work in pairs?",
                           "opts": [opt("A muscle can only pull, so a partner is needed to pull the bone back", True), opt("One muscle is a spare", False), opt("Bones are heavy", False)],
                           "why": "Pull, never push. Every bone that moves has a pair of muscles pulling it both ways."}},
             "Muscles pull, never push. So they work in pairs.",
             mis=["1.3-m1"]),

        step("diagram", "Label a diagram of the skeleton", "✏️", "Skeleton diagram", ["4Bs.01"],
             "Label the diagram. Tap a label, then tap the bone it belongs to.",
             explain(
                 ["A labelled diagram names the parts. You are labelling one of the skeleton."],
                 ["Skull, jaw, rib cage, spine, hip, arm bones, leg bones. Seven labels, seven places."],
                 ["Children put the hip label on the ribs.", "The hip is at the bottom of the spine, where the legs join."],
                 ["Tap a label, then the bone."]),
             {"figure": "skeleton", "ask": "Tap a label, then tap where it goes.", "parts": BONES},
             "Seven bones labelled. A diagram of the skeleton."),

        step("context", "People who work with bones", "\U0001FA7A", "Bone science", ["4SIC.04", "4Bs.03", "4Bp.04"],
             "Some people use bone and muscle science all day. Tap each one.",
             explain(
                 ["Science is used in your area by people you could meet.", "Moving every day keeps your muscles and bones strong. Muscles that are not used get weak."],
                 ["A physiotherapist helps muscles and joints move again after an injury.", "A radiographer takes X-rays of bones.", "A PE teacher knows which muscles each exercise uses, and why moving every day keeps you healthy.", "A paramedic knows how to move someone with a broken bone safely."],
                 ["Children think only athletes need strong muscles.", "Everybody does. Walking, playing and climbing stairs all keep muscles and bones strong."],
                 ["Tap each one and say what they know."]),
             {"items": [
                 {"pic": "\U0001F9D1\U0001F3FE‍⚕️", "label": "physiotherapist", "say": "A physiotherapist knows every muscle pair. After an injury they give you exercises, because a muscle that is not used gets weak, and moving it makes it strong again."},
                 {"pic": "\U0001F9B4", "label": "radiographer", "say": "A radiographer takes X-ray pictures of your bones, so a doctor can see a break without opening you up."},
                 {"pic": "\U0001F3C3\U0001F3FE", "label": "PE teacher", "say": "A PE teacher knows which muscles each exercise works, and why you warm up before you run. Moving every day makes your muscles stronger and your bones harder, and it keeps your heart healthy."},
                 {"pic": "\U0001F691", "label": "paramedic", "say": "A paramedic knows how to keep a broken bone still while they move you, so the ends of the bone do no more damage."},
             ], "need": 4,
              "then": {"ask": "Why does a physiotherapist need to know about muscle pairs?",
                       "opts": [opt("To make the weak partner strong again, so the joint moves both ways", True), opt("To take X-rays", False), opt("They do not need to", False)],
                       "why": "A joint needs both muscles of its pair working."}},
             "Physiotherapists, radiographers, PE teachers and paramedics all use bone science."),

        step("questions", "Bone check", "✅", "Bone check", ["4Bs.01", "4Bs.02", "4Bs.03"],
             "Tap the answer.",
             explain(
                 ["Seven bones, four jobs, and muscle pairs."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("Which bone protects the brain?", "\U0001F9E0", "the skull", ["the hip", "the rib cage", "the spine"], "A hard case round the brain."),
                 q("Which bone is a chain of small bones down your back?", "\U0001F9B4", "the spine", ["the jaw", "the leg bones"], "That is why you can bend."),
                 q("What does a muscle do when it contracts?", "\U0001F4AA\U0001F3FE", "gets shorter and pulls", ["gets longer and pushes", "nothing"], "Pull, never push."),
                 q("When the biceps contracts, the triceps...", "\U0001F504", "relaxes", ["contracts too", "disappears"], "A pair: one pulls, one rests."),
                 q("Which of these is not a job of the skeleton?", "\U0001F6E1️", "pumping blood", ["protecting organs", "supporting the body", "giving shape"], "The heart pumps blood; bones protect it."),
                 q("Are your bones living?", "\U0001F9B4", "Yes. They grow, and a broken one mends itself.", ["No, bones are like stones", "Only while you are still a child"],
                   "Your bones are far bigger than they were when you were a baby, so they have grown - and growing is a life process."),
                 q("Layla says a skeleton is only there to hold you up. Is she right?", "\U0001F480", "Only partly - it also protects you, and it lets you move", ["Yes, holding you up is all it does", "No, protecting you is its only job"],
                   "Three jobs, not one: support, protection - the skull round your brain, the ribs round your heart - and movement, because muscles pull on bones."),
             ],
              "support": [
                 q("Do you have more than one rib?", "\U0001F9B4", "Yes", ["No"],
                   "The rib cage is built from many ribs, in pairs down your chest."),
                 q("Is a muscle soft or hard?", "\U0001F4AA", "soft", ["hard"],
                   "Muscle is the soft part. Bone is the hard part underneath it."),
              ],
              "extension": [
                 q("A baby is born with about 300 bones and you have about 206. Where did the others go?", "\U0001F476", "some of them joined together as the skeleton grew", ["babies lose bones as they crawl", "the count was simply wrong"],
                   "Bones are living. Some start as separate pieces and fuse into one as a child grows."),
                 q("Your skull is one hard case with no joint in it. Why is that right for the brain and wrong for your arm?", "\U0001F9E0", "a joint is for bending, and the brain needs a box rather than movement", ["the skull should have a joint too", "the arm should be a box as well"],
                   "Where a part must move you need a joint. Where a part must be protected you want no gap at all."),
              ]},
             "You know your bones and muscles.",
             mis=["1.1-m1", "1.2-m1"]),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Bs.01", "4Bs.02", "4Bs.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which is the biggest bone in your body?", "\U0001F9B4", "the thigh bone in the leg", ["the jaw", "a rib", "the skull"], "The thigh bone."),
                 q("Which bone moves when you chew?", "\U0001F37D️", "the jaw", ["the skull", "the hip"], "The only moving bone in the head."),
                 q("Which bones join your legs to your spine?", "\U0001F9CD\U0001F3FE", "the hip bones", ["the ribs", "the arm bones"], "The hip carries your weight."),
                 q("Can a muscle push a bone?", "\U0001F4AA\U0001F3FE", "no, muscles can only pull", ["yes, every muscle can push", "only the leg muscles can push"], "That is why they come in pairs."),
                 q("Which muscle straightens the arm?", "\U0001F504", "the triceps", ["the biceps", "the jaw"], "On the back of the upper arm."),
                 q("What would happen if your triceps stopped working?", "\U0001F914", "you could bend your arm, but not straighten it", ["you could straighten your arm, but not bend it", "your biceps would push the arm straight instead"], "The triceps pulls the arm straight. Without it nothing pulls the arm back, and the biceps cannot push."),
                 q("Why is the rib cage shaped like a cage?", "\U0001F6E1️", "to protect the heart and lungs inside it", ["to make your chest look wider", "to hold your food while you eat"], "Soft organs, hard bones."),
                 q("What would you be without a skeleton?", "\U0001F9CD\U0001F3FE", "a floppy heap that could not stand", ["much taller, with nothing holding you in", "much faster, with less to carry"], "Support, shape, movement."),
                 q("You put seven labels on the skeleton. What did you make?", "✏️", "a labelled diagram", ["a physical model", "an X-ray"], "Labels on a drawing."),
                 q("Why does your arm need two muscles, the biceps and the triceps?", "\U0001F4AA", "a muscle can only pull, so one pulls the arm bent and the other pulls it straight", ["one muscle works while the other rests all day", "two muscles make the arm twice as long"], "Muscles pull and never push. So they work in pairs."),
                 q("A cycle helmet does the same job as one of your bones. Which bone, and why?", "\u26D1\uFE0F", "the skull, because both protect the brain", ["the spine, because both are long", "the rib cage, because both are round"], "The skull is a hard case round the brain. A helmet adds another one."),
             ],
              "support": [
                 q("Which bone protects your brain?", "\U0001F480", "the skull", ["the hip"],
                   "The skull is a hard case round the brain."),
                 q("Can a muscle push?", "\U0001F4AA", "No", ["Yes"],
                   "A muscle can only pull. That is why they come in pairs."),
              ],
              "extension": [
                 q("An insect has no bones at all. How does it move?", "\U0001F41C", "its muscles pull on a hard case on the outside", ["it has no muscles either", "it is pushed along by the air"],
                   "An exoskeleton is a skeleton on the outside. The muscles are inside it, pulling on it - the same idea, turned inside out."),
                 q("An astronaut spends a year in space with almost no weight to carry. What happens to their bones?", "\U0001F680", "they get weaker, because bones need to be worked", ["they get stronger, because nothing presses on them", "nothing changes at all"],
                   "Bones are living and they respond to use. Astronauts exercise for hours a day to slow it down."),
              ]},
             "That is the whole lesson finished. You know your skeleton."),
    ],
}

LESSON["about"] = [
    "Find the skull, jaw, rib cage, spine, hip, arm bones and leg bones.",
    "Say the four jobs a skeleton does.",
    "Say how a pair of muscles moves a bone.",
    "Label a diagram of the skeleton.",
]

LESSON["warmup"] = [
    q("What do people and animals need to stay alive?", "\U0001F37D️", "food, water and air", ["toys and games", "only sunshine"], "Every animal, you included, needs food, water and air."),
    q("Where does your arm bend?", "\U0001F4AA\U0001F3FE", "at the elbow", ["at the knee", "at the ankle"], "The elbow is the joint in the middle of your arm."),
]

LESSON["lecture"] = [
    part("\U0001F9B4", "Your skeleton",
         "Inside you is a frame of about two hundred bones: your skeleton. Seven to know today: the skull, the jaw, the rib cage, the spine, the hip, the arm bones and the leg bones."),
    part("\U0001F6E1️", "Four jobs",
         "Your skeleton protects soft organs: the skull round the brain, the ribs round the heart and lungs. It supports you, holding you up. It gives you your shape. And it lets you move."),
    part("\U0001F4AA\U0001F3FE", "Muscles pull",
         "Muscles are attached to bones. When a muscle contracts it gets shorter and fatter and pulls the bone. A muscle can only pull. It can never push."),
    part("\U0001F504", "In pairs",
         "Because a muscle can only pull, every moving bone has two: a pair. The biceps pulls your arm up. Its partner, the triceps, pulls it straight again. While one contracts, the other relaxes."),
    part("✏️", "Today",
         "Today you find the bones, discover the four jobs, bend an arm to watch the muscle pair take turns, and label a diagram of the whole skeleton."),
]

LESSON["words"] = [
    word("skeleton", "\U0001F9B4", "All the bones of a body, joined together.",
         ["Your skeleton holds you up.", "A skeleton has about two hundred bones."]),
    word("skull", "\U0001F480", "The bones of the head that protect the brain.",
         ["The skull is a hard case round the brain.", "A helmet protects the skull."]),
    word("spine", "\U0001F9B4", "The chain of small bones down your back. Your backbone.",
         ["The spine lets you bend.", "Sit up straight and feel your spine."]),
    word("rib cage", "\U0001F6E1️", "The curved bones round your chest that protect the heart and lungs.",
         ["Your rib cage moves when you breathe.", "Count your ribs through your skin."]),
    word("muscle", "\U0001F4AA\U0001F3FE", "A part of the body that pulls on a bone to move it.",
         ["The biceps is a muscle.", "Muscles get tired."]),
    word("contract", "\U0001F4AA\U0001F3FE", "When a muscle gets shorter and fatter and pulls.",
         ["The biceps contracts to bend the arm.", "Feel your muscle contract."]),
    word("relax", "\U0001F60C", "When a muscle stops pulling and gets longer and thinner again.",
         ["The triceps relaxes while the biceps pulls.", "Let your arm relax."]),
    word("bone", "\U0001F9B4", "A hard living part of your skeleton. It grows, and it mends if it breaks.",
         ["The longest bone is in your thigh.", "A bone is living, not like a stone."]),
    word("joint", "\U0001F91D", "A place where two bones meet and can move.",
         ["Your elbow is a joint.", "Muscles pull the bones at a joint."]),
]

LESSON["cando"] = [
    cando("I can name the important bones in my body.", "4Bs.01"),
    cando("I can say what a skeleton does: it supports me, protects me and lets me move.", "4Bs.03"),
    cando("I can explain how a pair of muscles moves a bone.", "4Bs.02"),
    cando("I know a muscle can only pull, never push.", "4Bs.02"),
    cando("I can say why moving about keeps me healthy.", "4Bp.04"),
    cando("I can name people whose work uses bone and muscle science.", "4SIC.04"),
    cando("I can say whether my results supported my prediction.", "4TWSa.01"),
    cando("I can make a conclusion from my results.", "4TWSa.03"),
]

LESSON["home"] = [
    home("Feel the pair", "Your own arm and your other hand, or a grown-up's arm",
         ["Hold the top of your arm with your other hand. Or hold the top of a grown-up's arm while they bend it.",
          "Bend the arm slowly. Feel the front go short and hard: the biceps contracting.",
          "Straighten it slowly. Feel the back tighten instead: the triceps."],
         "One hard while the other is soft, then they swap. A pair."),
    home("Bone hunt on yourself", "A mirror, a grown-up",
         ["Find your skull, your jaw, your ribs, your spine, your hip and the bones in your arms and legs by pressing gently.",
          "Count how many bones you can feel in one finger, and then in your thumb.",
          "Find a joint where two bones meet."],
         "Three bones in each finger, and two in your thumb. How many joints did you find?"),
    home("Look at a real bone", "A clean bone left over from a meal, or a picture of a bone in a book or on a screen, a grown-up",
         ["Look at the bone. It is hard on the outside.",
          "Look at the ends where it joined other bones.",
          "Draw it and label the hard outside and the joint ends. If you touched a real bone, wash your hands afterwards."],
         "An animal bone is built like yours: hard outside, and shaped at the ends to fit its neighbour."),
]
