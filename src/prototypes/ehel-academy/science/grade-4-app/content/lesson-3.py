# -*- coding: utf-8 -*-
"""Lesson 3 - Staying Healthy.

0097 Stage 4: 4Bp.01 medicines treat some illnesses, and how to use them
safely; 4Bp.02 plants and animals get infectious diseases, and vaccinations
prevent some; 4Bp.04 movement keeps humans healthy; with 4SIC.02,
4SIC.03 (use science to support a point) and 4SIC.04.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "staying-healthy",
    "title": "Staying Healthy",
    "blurb": "Learn the rules for using medicines safely, see how a vaccine trains a body to fight a disease before it arrives, find out why moving every day matters, and tell evidence from opinion.",
    "steps": [
        step("sort", "Medicines: safe, or not safe?", "\U0001F48A", "Medicine rules", ["4Bp.01"],
             "Medicines treat illness, and they can hurt if used wrongly. Is this <b>safe</b>, or <b>not safe</b>? Tap the bin.",
             explain(
                 ["A medicine is a substance that treats an illness. The right amount helps. The wrong amount, or the wrong person, can harm."],
                 ["A grown-up gives it, the right amount, at the right time: safe.", "Taking your friend's medicine: not safe. It was chosen for their body.", "Medicines kept high up and locked: safe.", "A sweet-looking pill from the floor: never."],
                 ["Children think more medicine means better faster.", "The amount on the label is the safe amount. More can poison you."],
                 ["Ask: is a grown-up in charge, and is it the right medicine and amount?"]),
             {"ask": "Safe, or not safe?",
              "bins": [{"id": "safe", "label": "Safe", "pic": "✅"}, {"id": "unsafe", "label": "Not safe", "pic": "⚠️"}],
              "items": [
                  {"pic": "\U0001F469\U0001F3FE‍⚕️", "label": "a grown-up measures the dose on the label", "bin": "safe", "why": "The label says the safe amount, and a grown-up measures it."},
                  {"pic": "\U0001F48A", "label": "taking a friend's tablets", "bin": "unsafe", "why": "A medicine is chosen for one person's illness and size. Never share."},
                  {"pic": "\U0001F512", "label": "medicines locked away high up", "bin": "safe", "why": "Out of reach of small children and pets."},
                  {"pic": "\U0001F36C", "label": "eating a pill because it looks like a sweet", "bin": "unsafe", "why": "Some medicines look like sweets. Never eat one you find."},
                  {"pic": "\U0001F4C5", "label": "checking the date on the packet", "bin": "safe", "why": "Old medicine can stop working or go bad."},
                  {"pic": "2️⃣", "label": "taking double to get better twice as fast", "bin": "unsafe", "why": "Double the dose can poison you. The label amount is the safe amount."},
                  {"pic": "\U0001F4DD", "label": "finishing the whole course the doctor gave", "bin": "safe", "why": "Some medicines only work if you take all of them, even after you feel better."},
                  {"pic": "\U0001F9F4", "label": "medicine from a bottle with no label", "bin": "unsafe", "why": "Without a label nobody knows what it is or how much is safe."},
              ]},
             "The right medicine, the right amount, a grown-up in charge."),

        step("demo", "Vaccines: training the body", "\U0001F489", "Vaccines", ["4Bp.02"],
             "Plants and animals can catch infectious diseases. Press <b>Next</b> to see how a vaccine stops one.",
             explain(
                 ["An infectious disease is one that spreads from one living thing to another, carried by germs.", "A vaccine shows the body a harmless piece of the germ, so the body learns to fight it before the real one arrives."],
                 ["Germs get in.", "The body makes fighters, but slowly, and you get ill.", "A vaccine trains the fighters in advance.", "Next time the real germ arrives, the body is ready and fights it fast."],
                 ["Children think a vaccine is medicine for when you are ill.", "It is given when you are well, to stop you getting ill."],
                 ["Press Next through all five."]),
             {"frames": [
                 {"pic": "\U0001F9A0", "cap": "Germs cause <b>infectious diseases</b>: they spread from one animal or plant to another.", "say": "Germs are tiny living things. Some cause infectious diseases, which spread from one animal or plant to another: a cold, measles, a blight on potatoes."},
                 {"pic": "\U0001F912", "cap": "The first time a germ gets in, the body is slow to fight it, and you get ill.", "say": "The first time a new germ gets into your body, your body has to work out how to fight it. That takes days, and while it learns, you are ill."},
                 {"pic": "\U0001F489", "cap": "A <b>vaccine</b> shows the body a harmless piece of the germ, so it learns to fight it while you are well.", "say": "A vaccine is a harmless piece of the germ, or a weakened one. Your body learns to fight it, without you getting ill."},
                 {"pic": "\U0001F6E1️", "cap": "Now when the real germ arrives, the body is ready and fights it fast.", "say": "Now if the real germ ever arrives, your body already knows what to do and fights it fast. Most of the time you do not get ill at all, or only a little."},
                 {"pic": "\U0001F415", "cap": "Animals are vaccinated too: puppies, kittens, farm animals. Plants get infectious diseases too, and farmers mostly protect them in other ways.", "say": "Animals are vaccinated as well: puppies, kittens, cows and sheep. Plants get infectious diseases too. Plants are not given injections like animals, so farmers mostly protect crops in other ways: growing kinds that resist the disease, and taking out sick plants before it spreads."},
             ]},
             "A vaccine trains the body to fight a germ before it arrives."),

        step("explore", "Why moving matters", "\U0001F3C3\U0001F3FE", "Move every day", ["4Bp.04"],
             "Moving every day keeps a body healthy. Tap each reason.",
             explain(
                 ["Your body is built to move. Sit still all day and it gets weaker; move and it gets stronger."],
                 ["Muscles get stronger.", "The heart gets stronger, so it pumps more easily.", "Bones stay strong.", "You sleep better and feel better."],
                 ["Children think only sport counts.", "Walking, climbing stairs, dancing and playing all count."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F4AA\U0001F3FE", "label": "stronger muscles", "say": "Muscles that work get stronger. Muscles that never work get weaker and smaller."},
                 {"pic": "❤️", "label": "a stronger heart", "say": "The heart is a muscle. Running and playing make it beat faster, and that makes it stronger, so it pumps more easily the rest of the time."},
                 {"pic": "\U0001F9B4", "label": "strong bones", "say": "Bones get stronger when they carry weight and take knocks. Jumping and running build strong bones."},
                 {"pic": "\U0001F634", "label": "better sleep", "say": "A body that has moved all day sleeps deeper at night."},
                 {"pic": "\U0001F60A", "label": "a better mood", "say": "Moving makes the brain release chemicals that make you feel good. A run can cheer you up."},
             ], "need": 5,
              "then": {"ask": "Which of these is a reason to move every day?",
                       "opts": [opt("It makes the heart stronger", True), opt("It makes you taller", False), opt("It stops germs getting in", False)],
                       "why": "The heart is a muscle, and it strengthens with use."}},
             "Muscles, heart, bones, sleep, mood: moving helps them all."),

        step("sort", "Evidence, or opinion?", "⚖️", "Evidence sort", ["4SIC.03"],
             "Science backs up a point with <b>evidence</b>: something measured or tested. Is this evidence, or just an <b>opinion</b>?",
             explain(
                 ["When you argue for something, science gives you evidence: facts that were tested and measured.", "An opinion is what someone thinks or likes. It might be true, but it was not tested."],
                 ["Doctors measured children's hearts before and after a year of PE. Stronger: evidence.", "I think PE is boring: opinion.", "Vaccinated puppies almost never catch the disease, counted over thousands of puppies: evidence."],
                 ["Children think a loud opinion is evidence.", "Ask: was it measured, counted or tested?"],
                 ["Was it measured or tested? Then tap."]),
             {"ask": "Evidence, or opinion?",
              "bins": [{"id": "evidence", "label": "Evidence", "pic": "\U0001F4CA"}, {"id": "opinion", "label": "Opinion", "pic": "\U0001F4AC"}],
              "items": [
                  {"pic": "❤️", "label": "Doctors measured hearts: children who ran every day had stronger hearts", "bin": "evidence", "why": "Measured. That is evidence."},
                  {"pic": "\U0001F644", "label": "I think PE is boring", "bin": "opinion", "why": "What someone thinks. An opinion."},
                  {"pic": "\U0001F415", "label": "Counted over thousands of puppies, vaccinated ones almost never caught the disease", "bin": "evidence", "why": "Counted. Evidence."},
                  {"pic": "\U0001F5E3️", "label": "My uncle says vaccines are a waste of time", "bin": "opinion", "why": "Somebody's view, not a measurement."},
                  {"pic": "\U0001F634", "label": "Scientists timed sleep: children who moved more fell asleep faster", "bin": "evidence", "why": "Timed. Evidence."},
                  {"pic": "⚽", "label": "Football is the best sport", "bin": "opinion", "why": "A favourite, not a test."},
                  {"pic": "\U0001F48A", "label": "Tests showed the medicine cured 9 out of 10 people with the illness", "bin": "evidence", "why": "Tested and counted. Evidence."},
                  {"pic": "\U0001F922", "label": "Medicine always tastes horrible", "bin": "opinion", "why": "Some do, some do not. A feeling, not a measurement."},
              ]},
             "Evidence is measured or tested. Use it to back up your point."),

        step("context", "Health science near you", "\U0001F3E5", "Health jobs", ["4SIC.04", "4SIC.02", "4Bp.01", "4Bp.02"],
             "People in your area use health science every day. Tap each one.",
             explain(
                 ["Science is not only in a lab. It is used in your own area: in the pharmacy, the vet's and the clinic down the road."],
                 ["A pharmacist knows every medicine and the safe dose.", "A nurse gives vaccines.", "A vet vaccinates pets and farm animals.", "A PE teacher plans movement that keeps a whole school healthy."],
                 [],
                 ["Tap each one and say how they use science."]),
             {"items": [
                 {"pic": "\U0001F48A", "label": "pharmacist", "say": "A pharmacist knows every medicine in the shop: what it treats, how much is safe, and what must never be taken together. They read the science so you do not have to."},
                 {"pic": "\U0001F489", "label": "nurse", "say": "A nurse gives vaccines at the clinic and keeps a record of which ones each child has had."},
                 {"pic": "\U0001F415", "label": "vet", "say": "A vet vaccinates puppies, kittens and farm animals against diseases that spread between animals."},
                 {"pic": "\U0001F3C3\U0001F3FE", "label": "PE teacher", "say": "A PE teacher uses the science of muscles and hearts to plan lessons that make a whole school stronger."},
             ], "need": 4,
              "then": {"ask": "Who would you ask about the safe dose of a medicine?",
                       "opts": [opt("a pharmacist", True), opt("a PE teacher", False), opt("a friend", False)],
                       "why": "A pharmacist's whole job is medicines and safe doses."}},
             "Pharmacists, nurses, vets and PE teachers use health science near you."),

        step("questions", "Health check", "✅", "Health check", ["4Bp.01", "4Bp.02", "4Bp.04"],
             "Tap the answer.",
             explain(
                 ["Medicines, vaccines, movement, and evidence."],
                 [],
                 [],
                 ["Read the question, then tap."]),
             {"label": "Question", "items": [
                 q("What is a medicine for?", "\U0001F48A", "treating an illness", ["making you taller", "eating as a snack", "playing with"], "Treats some illnesses."),
                 q("Who should give a child medicine?", "\U0001F469\U0001F3FE‍⚕️", "a grown-up, measuring the amount on the label", ["a friend", "the child, as much as they like"], "The right amount, a grown-up in charge."),
                 q("What does a vaccine do?", "\U0001F489", "trains the body to fight a germ before it arrives", ["cures you once you are already ill", "makes your muscles stronger"], "Given when well, to stay well."),
                 q("Can a puppy be vaccinated?", "\U0001F415", "yes, animals get infectious diseases too", ["no, only people can be vaccinated", "only cats, never dogs"], "Vets vaccinate animals."),
                 q("Why does moving every day help your heart?", "❤️", "the heart is a muscle, and it gets stronger with use", ["it does not help", "it makes the heart smaller"], "Stronger heart, easier pumping."),
             ]},
             "You know how to stay healthy."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["4Bp.01", "4Bp.02", "4Bp.04", "4SIC.03"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("You feel better halfway through a course of medicine. What should you do?", "\U0001F4DD", "finish the course as the doctor said", ["stop straight away", "take double to be sure"], "Some medicines only work if you take them all."),
                 q("You find a pill on the floor that looks like a sweet. What should you do?", "\U0001F36C", "leave it and tell a grown-up", ["eat it to see what it is", "give it to a friend to try"], "Never eat a medicine you find."),
                 q("What is an infectious disease?", "\U0001F9A0", "one that spreads from one living thing to another", ["a bone that breaks when you fall over", "a headache from reading too long"], "Carried by germs."),
                 q("When is a vaccine given?", "\U0001F489", "when you are well, to protect you", ["when you are ill, to cure you", "only after you have caught the disease"], "Before the germ arrives."),
                 q("Can plants get infectious diseases?", "\U0001F331", "yes, plants catch diseases too", ["no, only animals catch them", "only plants kept indoors"], "Farmers protect crops in other ways."),
                 q("Which counts as moving every day?", "❓", "walking, dancing and playing", ["only football, in a team", "only running races on a track"], "All movement counts."),
                 q("Which is evidence?", "\U0001F4CA", "doctors measured that runners had stronger hearts", ["my friend says running is silly", "a poster says running is the best sport"], "Measured, not just said."),
                 q("Who uses medicine science in your area?", "\U0001F48A", "a pharmacist", ["a bus driver", "a footballer"], "Doses and safety are their job."),
                 q("What would happen if nobody in a town was vaccinated against measles?", "\U0001F914", "measles could spread from person to person much more easily", ["measles would disappear by itself", "everyone would be protected anyway"], "A vaccine trains each body to fight the germ. With nobody protected, the germ passes easily from one person to the next."),
             ]},
             "That is the whole lesson finished. You know how to stay healthy and how to prove it."),
    ],
}

LESSON["about"] = [
    "Say the rules for using medicines safely.",
    "Say how a vaccine stops an infectious disease, in people and in animals.",
    "Say why moving every day keeps you healthy.",
    "Tell evidence from opinion when you make a point.",
]

LESSON["warmup"] = [
    q("An animal without a backbone is called...", "\U0001F50D", "an invertebrate", ["a vertebrate", "a skeleton"], "From the last lesson: no backbone, an invertebrate."),
    q("What should you do before you eat?", "\U0001F9FC", "wash your hands", ["put on a hat", "run round the room"], "Washing your hands gets rid of germs."),
]

LESSON["lecture"] = [
    part("\U0001F48A", "Medicines",
         "A medicine is a substance that treats an illness. The right amount helps. The wrong amount can harm. So a grown-up measures the dose on the label, medicines are kept locked away, and nobody ever takes somebody else's."),
    part("\U0001F9A0", "Infectious diseases",
         "Some illnesses spread from one living thing to another, carried by germs. A cold. Measles. A blight on potatoes. These are infectious diseases, and plants and animals get them as well as people."),
    part("\U0001F489", "Vaccines",
         "A vaccine is a harmless piece of a germ. Your body learns to fight it while you are well. Then if the real germ ever arrives, your body is ready and fights it fast, so you usually do not get ill, or only a little. Puppies, kittens and farm animals are vaccinated too."),
    part("\U0001F3C3\U0001F3FE", "Moving",
         "Your body is built to move. Muscles that work get stronger. The heart is a muscle, and running makes it stronger. Bones stay strong. You sleep better and feel better. Walking, climbing and playing all count."),
    part("⚖️", "Evidence",
         "When you make a point about health, back it up with evidence: something that was measured, counted or tested. I think PE is boring is an opinion. Doctors measured stronger hearts in children who ran is evidence."),
]

LESSON["words"] = [
    word("medicine", "\U0001F48A", "A substance that treats an illness.",
         ["The doctor gave me medicine for my cough.", "Medicine must be measured carefully."]),
    word("dose", "\U0001F944", "The right amount of a medicine to take at one time.",
         ["The label gives the dose.", "A grown-up measures the dose."]),
    word("infectious", "\U0001F9A0", "Spreads from one living thing to another.",
         ["A cold is infectious.", "Wash your hands to stop infectious germs."]),
    word("vaccine", "\U0001F489", "A harmless piece of a germ, given to train the body to fight the real one.",
         ["The nurse gave me a vaccine.", "Puppies get a vaccine too."]),
    word("germ", "\U0001F9A0", "A tiny living thing that can cause disease.",
         ["Germs spread when you cough.", "Soap washes germs away."]),
    word("evidence", "\U0001F4CA", "Facts that were measured, counted or tested.",
         ["Use evidence to back up your point.", "The doctors' measurements are evidence."]),
    word("opinion", "\U0001F4AC", "What somebody thinks or likes. It has not been tested.",
         ["That is your opinion.", "An opinion is not evidence."]),
]

LESSON["home"] = [
    home("Medicine safety check", "A grown-up, the place your family keeps medicines",
         ["With a grown-up, look at where the medicines are kept. Are they high up or locked away?",
          "Read one label together. Find the dose and the date.",
          "Say the rules out loud."],
         "The right medicine, the right amount, a grown-up in charge, out of reach of little ones."),
    home("Heart rate before and after", "A clock or timer with seconds, a grown-up",
         ["Find your pulse: press two fingers gently on the inside of your wrist, below your thumb, or on the side of your neck. Each small beat you feel is one heartbeat. A grown-up can help you find it.",
          "Sit still and count the beats for thirty seconds.",
          "Now move quickly for two minutes in whatever way your body can: run on the spot, march, dance, or wave your arms fast.",
          "Count again. Write both numbers down."],
         "Faster after moving: your heart working harder, which is what makes it stronger. That number is evidence."),
    home("Vaccine record", "A grown-up, your health record or your pet's",
         ["Ask which vaccines you had as a baby.",
          "If you have a pet, find its vaccination card.",
          "List the diseases the vaccines protect against."],
         "Each one is a germ your body, or your pet's, already knows how to beat."),
]
