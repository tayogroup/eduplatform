# -*- coding: utf-8 -*-
"""Lesson 6 - Sounds Near and Far.

0097 Stage 1 Light and sound: 1Ps.01 sources of sound; 1Ps.02 sound gets
quieter as it travels from its source; with 1Bs.02 (the ear), 1TWSp.02,
1TWSc.01, 1TWSc.02, 1TWSc.03, 1TWSc.04, 1TWSc.05, 1TWSa.01, 1SIC.02 and
1SIC.03. The sounds are synthesised on the page - tap a drum and it thuds.
"""
from _kit import explain, step, opt, q

LESSON = {
    "slug": "sounds-near-and-far",
    "title": "Sounds Near and Far",
    "blurb": "Tap things to hear the sounds they make, find out what makes a sound, and walk away from a bell to hear it get quieter.",
    "steps": [
        step("explore", "Where does the sound come from?", "\U0001F514", "Sound sources", ["1Ps.01", "1Bs.02"],
             "Tap each picture and <b>listen</b>. The thing making the sound is called the <b>source</b>.",
             explain(
                 ["Every sound comes from somewhere.", "The thing making the sound is called the source."],
                 ["Tap the drum. Boom. The drum is the source.", "Tap the bird. Tweet. The bird is the source.",
                  "Your ears hear the sound, but the source is the thing that made it."],
                 ["Children say the sound comes from their ears.", "Ears hear it. The drum makes it."],
                 ["Tap every picture, listen, and say what the source is."]),
             {"items": [
                 {"pic": "\U0001F941", "label": "drum", "sound": "drum", "say": "Boom. The drum is the source of that sound."},
                 {"pic": "\U0001F514", "label": "bell", "sound": "bell", "say": "Ding. The bell is the source."},
                 {"pic": "\U0001F426", "label": "bird", "sound": "bird", "say": "Tweet tweet. The bird is the source."},
                 {"pic": "\U0001F697", "label": "car horn", "sound": "horn", "say": "Honk. The car horn is the source."},
                 {"pic": "\U0001F44F", "label": "clapping hands", "sound": "clap", "say": "Clap. Your hands are the source of that one."},
                 {"pic": "\U0001F431", "label": "cat", "sound": "cat", "say": "Miaow. The cat is the source."},
                 {"pic": "\U0001F327️", "label": "rain", "sound": "rain", "say": "Pitter patter. The rain is the source."},
                 {"pic": "\U0001F3B5", "label": "whistle", "sound": "whistle", "say": "Wheee. The whistle is the source."},
             ], "need": 8},
             "Every sound has a source. Your ears find it."),

        step("sort", "Who or what made it?", "\U0001F5C2️", "Sound sorter", ["1Ps.01", "1TWSc.01"],
             "Was that sound made by an <b>animal or person</b>, or by a <b>thing</b>? Tap the right bin.",
             explain(
                 ["Sound sources can be sorted into groups.", "Some sounds come from living things, some from objects and machines."],
                 ["A cow mooing: an animal.", "A bell ringing: a thing.", "A baby crying: a person.", "A car horn: a machine."],
                 [],
                 ["Think about what made the sound, then tap its bin."]),
             {"ask": "Animal or person, or a thing?",
              "bins": [{"id": "living", "label": "Animal or person", "pic": "\U0001F42E"}, {"id": "thing", "label": "A thing or machine", "pic": "\U0001F514"}],
              "items": [
                  {"pic": "\U0001F42E", "label": "moo", "bin": "living", "why": "A cow moos. An animal made it."},
                  {"pic": "\U0001F514", "label": "ding", "bin": "thing", "why": "A bell rings. A thing made it."},
                  {"pic": "\U0001F476", "label": "waaah", "bin": "living", "why": "A baby cries. A person made it."},
                  {"pic": "\U0001F697", "label": "honk", "bin": "thing", "why": "A car horn honks. A machine made it."},
                  {"pic": "\U0001F415", "label": "woof", "bin": "living", "why": "A dog barks. An animal made it."},
                  {"pic": "\U0001F941", "label": "boom", "bin": "thing", "why": "A drum booms. A thing made it, when somebody hit it."},
                  {"pic": "\U0001F3A4", "label": "singing", "bin": "living", "why": "A person sings."},
                  {"pic": "⏰", "label": "ring ring", "bin": "thing", "why": "An alarm clock rings. A machine made it."},
              ]},
             "Sounds come from animals, people, things and machines."),

        step("demo", "What makes a sound?", "\U0001F3B8", "Shake it", ["1Ps.01"],
             "A sound is made when something <b>shakes</b> very fast. Press <b>Next</b> and listen.",
             explain(
                 ["A sound happens when something shakes very fast.", "Scientists call that fast shaking vibrating."],
                 ["Pluck a rubber band and watch it.", "It goes blurry because it is shaking, and you hear a twang.",
                  "Hit a drum and touch the skin: you can feel it shaking.", "Hum, and put your hand on your throat: it buzzes."],
                 ["Children think the sound is in the air by itself.", "Stop the band shaking with your finger and the sound stops too."],
                 ["Press Next, listen, and try the throat one for real."]),
             {"frames": [
                 {"pic": "➰", "cap": "Pluck a rubber band. It <b>shakes</b> and you hear a twang.", "say": "Pluck a rubber band. It shakes so fast it looks blurry, and you hear a twang.", "sound": "pluck"},
                 {"pic": "\U0001F941", "cap": "Hit a drum. The skin <b>shakes</b>. Touch it and feel!", "say": "Hit a drum. The skin shakes. Put your hand on it and you can feel the shaking.", "sound": "drum"},
                 {"pic": "\U0001F41D", "cap": "A bee's wings <b>shake</b> very fast. Buzz!", "say": "A bee's wings shake very fast. That is the buzz.", "sound": "buzz"},
                 {"pic": "\U0001F5E3️", "cap": "Hum. Put your hand on your throat. It <b>shakes</b>!", "say": "Now hum, and put your hand flat on your throat. Feel it shaking? That is your voice.", "sound": "hum"},
                 {"pic": "✋➰", "cap": "Stop the shaking and the sound <b>stops</b>.", "say": "Touch the rubber band to stop it shaking, and the sound stops too. No shaking, no sound."},
             ]},
             "Sound is made when something shakes very fast."),

        step("experiment", "Near and far", "\U0001F9EA", "Near and far", ["1Ps.02", "1TWSp.02", "1TWSc.03", "1TWSc.04", "1TWSa.01"],
             "What happens to a sound as you walk away from it? Predict, then ring the bell and step back.",
             explain(
                 ["As you get further from the source, the sound gets quieter."],
                 ["Predict first.", "Then ring the bell right next to it and listen.", "Take a step back and ring it again.",
                  "Keep going, six steps.", "Watch the loudness meter and listen to the bell."],
                 ["Children think a bell is just as loud from anywhere.", "Try it. Six steps away it is much quieter."],
                 ["Tap your prediction, then ring, step back, ring, step back."]),
             {"sim": "soundFar",
              "predict": {"ask": "What do you think the bell will sound like when you are <b>six steps away</b>?",
                          "opts": [opt("Quieter than when I am next to it", True), opt("Louder than when I am next to it", False), opt("Exactly the same", False)]},
              "runAsk": "Ring the bell. Take a step back. Ring it again. Keep going to six steps.",
              "happened": {"ask": "What happened to the bell's sound as you walked away?",
                           "opts": [opt("It got quieter with every step", True), opt("It got louder", False), opt("It stayed the same", False)],
                           "why": "The further you were from the bell, the quieter it sounded. Sound gets quieter as it travels away from its source."}},
             "Sound gets quieter the further it travels."),

        step("record", "How loud was it?", "\U0001F4DD", "Loudness table", ["1TWSc.05", "1Ps.02"],
             "Record how loud the bell was at each distance. How loud was it <b>%s</b>?",
             explain(
                 ["A table can hold measurements as words: loud, medium, quiet."],
                 ["One step away the bell was loud.", "Three steps away it was medium.", "Six steps away it was quiet."],
                 [],
                 ["Fill in each row from what you heard."]),
             {"ask": "How loud was the bell %s?",
              "columns": ["Distance", "How loud?"],
              "rows": [
                  {"pic": "1️⃣", "label": "1 step away", "answer": "loud", "why": "one step away the bell was loud."},
                  {"pic": "3️⃣", "label": "3 steps away", "answer": "medium", "why": "three steps away it was medium."},
                  {"pic": "6️⃣", "label": "6 steps away", "answer": "quiet", "why": "six steps away it was quiet."},
              ],
              "choices": [{"id": "loud", "t": "Loud", "pic": "\U0001F50A"}, {"id": "medium", "t": "Medium", "pic": "\U0001F509"}, {"id": "quiet", "t": "Quiet", "pic": "\U0001F508"}]},
             "Loud, medium, quiet. Your table shows the sound fading."),

        step("explore", "Use the sound makers safely", "\U0001F3B6", "Safe ears", ["1TWSc.02", "1TWSc.04"],
             "Sound makers are tools. Tap each one to hear how to use it safely.",
             explain(
                 ["Loud sounds can hurt your ears, so sound makers have rules."],
                 ["A drum is hit with the stick, gently, never near somebody's ear.", "A whistle is blown outdoors, not right next to a friend.",
                  "A shaker is shaken by the handle.", "If a sound hurts, cover your ears and move away."],
                 ["Children think louder is always better.", "Very loud sounds can damage ears for good."],
                 ["Tap every sound maker and listen to its rule."]),
             {"items": [
                 {"pic": "\U0001F941", "label": "drum", "sound": "drum", "say": "Hit the drum with the stick, gently. Never bang it next to somebody's ear."},
                 {"pic": "\U0001F3B5", "label": "whistle", "sound": "whistle", "say": "Blow the whistle outside, and never right next to a friend."},
                 {"pic": "\U0001FA87", "label": "shaker", "sound": "shake", "say": "Hold the shaker by the handle and shake it. Do not throw it."},
                 {"pic": "\U0001F514", "label": "bell", "sound": "bell", "say": "Ring the bell once and listen. Keep it away from ears."},
                 {"pic": "\U0001F442", "label": "your ears", "say": "If a sound hurts your ears, cover them and move away. Ears do not grow back."},
             ], "need": 5,
              "then": {"ask": "A sound is so loud it hurts. What should you do?",
                       "opts": [opt("Cover your ears and move away", True), opt("Get closer to hear it better", False), opt("Shout back", False)],
                       "why": "Loud sounds can damage your ears. Cover them and move away from the source."}},
             "Use sound makers carefully and look after your ears."),

        step("context", "Sound at work", "\U0001F3B7", "Sound jobs", ["1SIC.02", "1SIC.03"],
             "Science explains how sound things work, and some people use sound science all day. Tap each one.",
             explain(
                 ["Because we know how sound works, we can make instruments, and some people make sound their job."],
                 ["A guitar works because plucked strings shake.", "A musician uses that all day.",
                  "A doctor uses a stethoscope to hear your heart, because the sound travels up the tube.", "A person who checks ears is an audiologist."],
                 [],
                 ["Tap each one and hear how sound science is used."]),
             {"items": [
                 {"pic": "\U0001F3B8", "label": "guitar", "sound": "pluck", "say": "A guitar works because plucked strings shake. Thick strings shake slowly for low notes, thin ones fast for high notes."},
                 {"pic": "\U0001F3B7", "label": "musician", "say": "A musician uses sound science every day, making strings, drums and air shake in just the right way."},
                 {"pic": "\U0001FA7A", "label": "doctor's stethoscope", "say": "A stethoscope carries the tiny sound of your heartbeat up a tube to the doctor's ears."},
                 {"pic": "\U0001F9BB", "label": "ear doctor", "say": "An audiologist tests how well people hear and helps them with hearing aids. Everyone uses science; this is their job."},
             ], "need": 4,
              "then": {"ask": "How does a guitar make a sound?",
                       "opts": [opt("The strings shake when you pluck them", True), opt("The guitar is painted brown", False), opt("The sound is stored inside it", False)],
                       "why": "A plucked string shakes very fast, and that shaking is the sound."}},
             "People use sound science at work every day."),

        step("quiz", "Show what you know", "⭐", "Star scientist", ["1Ps.01", "1Ps.02", "1Bs.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["If it asks where a sound comes from, name the thing that made it.", "If it asks about far away, remember the bell getting quieter."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("We hear with our...", "\U0001F442", "ears", ["eyes", "nose", "feet"], "Ears hear. That is the sense of hearing."),
                 q("A drum booms. What is the source of the sound?", "\U0001F941", "the drum", ["your ears", "the air", "the floor"], "The drum made the sound. It is the source."),
                 q("A sound is made when something...", "➰", "shakes very fast", ["gets wet", "goes dark", "sits still"], "Shaking very fast, vibrating, is what makes a sound."),
                 q("You walk away from a ringing bell. The sound gets...", "\U0001F514", "quieter", ["louder", "higher", "faster"], "Sound gets quieter as it travels away from its source. You tested it."),
                 q("Which of these is a source of sound?", "❓", "a barking dog", ["a sleeping cat", "a still stone", "an empty room"], "A barking dog makes a sound. The dog is the source."),
                 q("You hum and feel your throat. What do you feel?", "\U0001F5E3️", "shaking", ["nothing", "cold", "wet"], "Your voice is your throat shaking."),
                 q("A sound hurts your ears. What should you do?", "\U0001F442", "cover your ears and move away", ["get closer", "shout louder"], "Loud sounds can hurt ears. Move away from the source."),
                 q("Stop a rubber band shaking with your finger. What happens to the sound?", "✋", "it stops", ["it gets louder", "it gets higher"], "No shaking, no sound."),
             ]},
             "That is the whole lesson finished. You know where sounds come from."),
    ],
}
