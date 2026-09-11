# -*- coding: utf-8 -*-
"""Lesson 7 - Collecting Data.

0059 Stage 2 Managing Data: 2MD.03 investigate different ways of using
computing devices to collect categorical data for a purpose; 2MD.04 types of
statistical data that can be manually recorded; 2MD.05 the types of data a
question may generate, statistical and non-statistical; 2MD.01 the
advantages of storing data and information on computers.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "collecting-data",
    "title": "Collecting Data",
    "blurb": "Try four ways of collecting the class's answers and see which one gives data a computer can count, sort the questions that give statistical data from the ones that do not, and find out why data lives on computers.",
    "steps": [
        step("explore", "Why keep data on a computer?", "\U0001F4BE", "Data keeper", ["2MD.01"],
             "Data on paper and data on a computer are not the same. Tap each reason.",
             explain(
                 ["Data stored on a computer can do things a piece of paper cannot."],
                 ["A spill or a tear cannot spoil it, and a spare copy can be kept.", "You can search it.", "You can copy it.", "You can send it to someone far away.",
                  "The computer can count it in a blink."],
                 ["Children think paper is safer because you can hold it.", "One cup of juice and the paper data is gone. The computer's copy is still there."],
                 ["Tap all six reasons."]),
             {"items": [
                 {"pic": "\U0001F5C2️", "label": "it is harder to lose", "say": "Paper gets lost, torn and spilt on. Data on a computer is safe from all three, and a spare copy can be kept."},
                 {"pic": "\U0001F50E", "label": "you can search it", "say": "You can search it. One name out of five hundred, found in a blink."},
                 {"pic": "\U0001F4CB", "label": "you can copy it", "say": "You can copy it, so two classes can have the same table without writing it twice."},
                 {"pic": "\U0001F4E4", "label": "you can share it", "say": "You can share it. Send the table to Grandma or to another school in a second."},
                 {"pic": "⚡", "label": "it can be counted in a blink", "say": "The computer counts it for you, in a blink, and never miscounts."},
                 {"pic": "\U0001F4E6", "label": "it takes up almost no room", "say": "A thousand tables fit on one tablet. On paper they would fill a cupboard."},
             ], "need": 6,
              "then": {"ask": "Which is something a computer can do with data that a piece of paper cannot?",
                       "opts": [opt("Search it and count it in a blink", True), opt("Hold it in your hand", False), opt("Fold it", False)],
                       "why": "Searching, copying, sharing and counting are what computers add."}},
             "Stored on a computer, data can be searched, copied, shared and counted."),

        step("survey", "Collect data for a purpose", "\U0001F4CB", "Data collector", ["2MD.03", "2MD.04"],
             "We need to know which fruit to buy for the party. Try each way of collecting the answers.",
             explain(
                 ["Collecting data starts with a purpose: what do we need to find out, and why?",
                  "Then you choose a way to collect it, and not every way works."],
                 ["Shouting gives noise.", "Guessing gives a guess.", "A tally on paper works, but you count the marks yourself.",
                  "A form on a computer records every answer and counts them as they arrive."],
                 ["Children think asking loudly is collecting data.", "Data is answers you can COUNT."],
                 ["Try all four ways, then collect with the form."]),
             {"purpose": "which fruit to buy for the class party",
              "question": "Which fruit do you like best?",
              "options": [{"id": "apple", "t": "Apple", "pic": "\U0001F34E"}, {"id": "banana", "t": "Banana", "pic": "\U0001F34C"},
                          {"id": "orange", "t": "Orange", "pic": "\U0001F34A"}, {"id": "grapes", "t": "Grapes", "pic": "\U0001F347"}],
              "ways": [
                  {"id": "shout", "label": "Everyone shouts at once", "pic": "\U0001F5E3️", "works": False, "outcome": "Banana! Apple! BANANA! Grapes! Nobody could count anything.", "why": "Shouting gives noise, not data."},
                  {"id": "guess", "label": "Just guess", "pic": "\U0001F914", "works": False, "outcome": "You wrote: bananas, probably. That is a guess, not an answer.", "why": "A guess is not data. Data is what people actually said."},
                  {"id": "tally", "label": "A tally on paper", "pic": "\U0001F4DD", "works": True, "outcome": "Apple || Banana |||| Orange | Grapes |. It works, but you count the marks yourself, and paper gets lost.", "why": "A tally is real data. The computer would count it faster and keep it safe."},
                  {"id": "form", "label": "A form on the tablet", "pic": "\U0001F4F1", "works": True, "outcome": "Every answer recorded, counted as it arrives, and kept.", "why": "The form records categorical data - a choice from a list - and the computer counts it."},
              ],
              "people": [
                  {"name": "Amal", "pic": "\U0001F467\U0001F3FE", "answer": "banana"},
                  {"name": "Sami", "pic": "\U0001F466\U0001F3FE", "answer": "apple"},
                  {"name": "Nora", "pic": "\U0001F467\U0001F3FD", "answer": "grapes"},
                  {"name": "Omar", "pic": "\U0001F466\U0001F3FD", "answer": "banana"},
                  {"name": "Hana", "pic": "\U0001F467\U0001F3FF", "answer": "apple"},
                  {"name": "Tariq", "pic": "\U0001F466\U0001F3FF", "answer": "banana"},
                  {"name": "Leila", "pic": "\U0001F467\U0001F3FC", "answer": "orange"},
                  {"name": "Yusuf", "pic": "\U0001F466\U0001F3FC", "answer": "banana"},
              ],
              "then": {"ask": "Which way gave us data the computer could count straight away?",
                       "opts": [opt("The form on the tablet", True), opt("Everyone shouting", False), opt("Guessing", False)],
                       "why": "The form recorded each answer and counted them as they came in."}},
             "A purpose, a question, a form: eight answers, counted."),

        step("questions", "Which device way fits the job?", "\U0001F4F1", "Device picker", ["2MD.03"],
             "There is more than one way to collect data with a device. Which way fits this job? Tap the answer.",
             explain(
                 ["Devices can collect data in different ways: a form, a tally app, a camera, a voice recording.", "The best way depends on the purpose: who you are asking, and where."],
                 ["Cars going past the gate cannot fill in a form: tap a tally app as each one passes.", "Five classes can each fill in the same form, and it counts itself.",
                  "Birds at the feeder at dawn: a camera that takes a photo when one lands."],
                 ["Children choose the form every time.", "A form needs someone to fill it in. Cars and birds cannot."],
                 ["Read the purpose, picture the job, then tap."]),
             {"label": "Question", "items": [
                 q("We want the colour of every car that passes the school gate for an hour. Which device way works best?", "\U0001F697", "a tally app: tap the colour as each car passes", ["a form each driver fills in", "one photo of the road", "asking the cars"], "Drivers cannot stop to fill in a form. A tally app counts each car as it goes by."),
                 q("We want every child in five classes to choose their favourite fruit. Which device way works best?", "\U0001F34E", "a form on each class's tablet that counts itself", ["one child with a tally app in the playground", "a voice note from every child to listen to later", "guessing"], "Every class can answer the same form, and the computer adds them all up."),
                 q("We want to know which birds visit the feeder all week, even at dawn. Which device way works best?", "\U0001F426", "a camera that takes a photo when a bird lands", ["a form the birds fill in", "a tally app in your bag", "watching all week without sleeping"], "The camera watches all day and all night, and the photos show which bird came."),
                 q("Some children cannot read yet. How can they answer 'which colour do you like best?' on a tablet?", "\U0001F3A8", "a form with a coloured picture on every button", ["a form with long words only", "a form in a language nobody reads", "no form at all"], "A picture on every button means you can answer before you can read the words."),
             ]},
             "The purpose picks the device way: a tally app for cars, a form for classes, a camera for birds."),

        step("sort", "Statistical, or not?", "\U0001F5C2️", "Question sorter", ["2MD.05"],
             "Some questions give data we can count or measure. Some give opinions and stories. Which is this?",
             explain(
                 ["A statistical question gives answers you can count or measure: how many, how tall, which one from a list."],
                 ["How many pets do you have? Statistical: a number.", "What is your favourite colour? Statistical: a category we can count.",
                  "Why do you like your dog? Not statistical: a story, different for everyone."],
                 ["Children think every question about people is statistical.", "Ask: could I make a table of the answers?"],
                 ["Ask 'could I count the answers?', then tap the bin."]),
             {"ask": "Statistical, or not?",
              "bins": [{"id": "stat", "label": "Statistical: we can count it", "pic": "\U0001F4CA"}, {"id": "not", "label": "Not statistical: a story or an opinion", "pic": "\U0001F4AC"}],
              "items": [
                  {"pic": "\U0001F436", "label": "how many pets do you have?", "bin": "stat", "why": "A number. We can count and compare."},
                  {"pic": "\U0001F3A8", "label": "what is your favourite colour?", "bin": "stat", "why": "A category from a list. We can count how many chose each."},
                  {"pic": "\U0001F4CF", "label": "how tall are you?", "bin": "stat", "why": "A measurement. Statistical."},
                  {"pic": "❤️", "label": "why do you like your dog?", "bin": "not", "why": "A story, different for everyone. Not something you can count."},
                  {"pic": "\U0001F3D6️", "label": "tell me about your holiday", "bin": "not", "why": "A story. Not statistical."},
                  {"pic": "\U0001F382", "label": "which month is your birthday?", "bin": "stat", "why": "One of twelve categories. We can count them."},
                  {"pic": "\U0001F3B5", "label": "what do you think of this song?", "bin": "not", "why": "An opinion in words. Not statistical."},
                  {"pic": "\U0001F46A", "label": "how many brothers and sisters do you have?", "bin": "stat", "why": "A number. Statistical."},
              ]},
             "Count it or measure it: statistical. A story or an opinion: not."),

        step("sort", "A count, a measurement, or a category?", "\U0001F4CA", "Data typer", ["2MD.04"],
             "Statistical data comes in kinds. Which kind is this?",
             explain(
                 ["A count is how many.", "A measurement is how much, how tall, how heavy.", "A category is a choice from a list: apple, banana, orange."],
                 ["Number of pets: a count.", "Your height: a measurement.", "Favourite fruit: a category.", "All three can be typed into a form."],
                 [],
                 ["Ask: how many, how much, or which one? Then tap."]),
             {"ask": "A count, a measurement, or a category?",
              "bins": [{"id": "count", "label": "A count", "pic": "\U0001F522"}, {"id": "measure", "label": "A measurement", "pic": "\U0001F4CF"}, {"id": "cat", "label": "A category", "pic": "\U0001F3F7️"}],
              "items": [
                  {"pic": "\U0001F436", "label": "the number of pets you have", "bin": "count", "why": "How many. A count."},
                  {"pic": "\U0001F9CD", "label": "how tall you are", "bin": "measure", "why": "How much, measured. A measurement."},
                  {"pic": "\U0001F34E", "label": "your favourite fruit", "bin": "cat", "why": "One choice from a list. A category."},
                  {"pic": "\U0001F441️", "label": "your eye colour", "bin": "cat", "why": "Brown, blue, green: a category."},
                  {"pic": "\U0001F463", "label": "how many steps to the gate", "bin": "count", "why": "How many. A count."},
                  {"pic": "\U0001F392", "label": "how heavy your bag is", "bin": "measure", "why": "Weighed. A measurement."},
                  {"pic": "⚽", "label": "which team you support", "bin": "cat", "why": "A choice from a list. A category."},
                  {"pic": "\U0001F4DA", "label": "how many books you read this month", "bin": "count", "why": "How many. A count."},
                  {"pic": "\U0001F321️", "label": "how warm it is today", "bin": "measure", "why": "Measured in degrees. A measurement."},
              ]},
             "Counts, measurements and categories: three kinds a form can record."),

        step("questions", "What kind of answers will it give?", "❓", "Answer predictor", ["2MD.05", "2MD.04"],
             "Before you ask a question, think what kind of data it will give. Tap the answer.",
             explain(
                 ["A question decides its own data.", "'How many' gives numbers. 'Which one' gives categories. 'Tell me about' gives stories."],
                 ["How many teeth have you lost? Numbers.", "What is your favourite animal? Categories to count.", "What was the best bit of your day? Stories."],
                 [],
                 ["Read the question, imagine the answers, then tap."]),
             {"label": "Question", "items": [
                 q("We ask: 'How many teeth have you lost?' What do we get?", "\U0001F9B7", "numbers we can count", ["stories", "colours", "nothing"], "How many gives a number each time."),
                 q("We ask: 'What is your favourite animal?' What do we get?", "\U0001F43E", "categories we can count", ["long stories", "measurements", "opinions in sentences"], "Each answer is a category; we count how many chose each."),
                 q("We ask: 'What was the best bit of your day?' What do we get?", "\U0001F31E", "stories, not statistical data", ["numbers", "categories", "measurements"], "Everyone's story is different. You cannot count it."),
                 q("We ask: 'How far can you jump?' What do we get?", "\U0001F998", "measurements", ["stories", "categories", "opinions"], "A distance, measured. Statistical."),
                 q("Which question gives data a form can record as a choice from a list?", "\U0001F4DD", "Which fruit do you like best: apple, banana, orange?", ["Why is fruit nice?", "Tell me about a fruit you ate", "What does fruit taste like?"], "A choice from a list is categorical data, and a form records it."),
             ]},
             "Think about the answers before you ask the question."),

        step("demo", "Paper data, computer data", "\U0001F4C4", "Safe data", ["2MD.01"],
             "The same fruit table, on paper and on a computer. Press <b>Next</b>.",
             explain(
                 ["The paper table and the computer table start the same.", "Then things happen."],
                 ["Juice spills on the paper. The computer copy is fine.", "Another class wants the table: the computer copies it in a blink.",
                  "Grandma wants to see it: sent in a second."],
                 [],
                 ["Press Next and see what happens to each."]),
             {"frames": [
                 {"pic": "\U0001F4C4\U0001F4BB", "cap": "The fruit table: on paper, and on the computer.", "say": "The fruit table, written on paper, and typed into the computer. The same data twice."},
                 {"pic": "\U0001F9C3\U0001F4C4", "cap": "Juice spills. The paper table is <b>gone</b>.", "say": "Juice spills across the desk. The paper table is soaked and the writing has run. It is gone.", "sound": "splash"},
                 {"pic": "\U0001F4BB✅", "cap": "The computer table is <b>still there</b>.", "say": "The computer table is still there, exactly as it was.", "sound": "ding"},
                 {"pic": "\U0001F4CB\U0001F4CB", "cap": "Another class wants it: <b>copied</b> in a blink.", "say": "Another class wants the same table. Copied in a blink, no writing it out again.", "sound": "click"},
                 {"pic": "\U0001F4E4\U0001F475\U0001F3FE", "cap": "Grandma wants to see it: <b>sent</b> in a second.", "say": "Grandma wants to see it. Sent in a second, across the world.", "sound": "send"},
                 {"pic": "\U0001F50E", "cap": "And you can <b>search</b> it: who chose grapes? Found.", "say": "And you can search it. Who chose grapes? Nora. Found in a blink.", "sound": "tada"},
             ]},
             "Kept safe, copied, sent, searched. That is why data lives on computers."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2MD.01", "2MD.03", "2MD.04", "2MD.05"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the four ways, the kinds of data, and the paper table."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("We needed to know which fruit to buy. Which way of collecting answers worked best?", "\U0001F4F1", "a form on the tablet", ["everyone shouting", "guessing", "asking the dog"], "The form recorded and counted every answer."),
                 q("Why does collecting data start with a purpose?", "\U0001F3AF", "so you know what to ask and why", ["it does not", "so it takes longer", "purposes are fun"], "The purpose decides the question."),
                 q("Which question is statistical?", "\U0001F4CA", "how many pets do you have?", ["why do you like your dog?", "tell me about your holiday", "what do you think of this song?"], "How many gives a number we can count."),
                 q("Your favourite fruit is what kind of data?", "\U0001F3F7️", "a category", ["a count", "a measurement", "a story"], "A choice from a list is a category."),
                 q("How tall you are is what kind of data?", "\U0001F4CF", "a measurement", ["a count", "a category", "an opinion"], "Measured in centimetres."),
                 q("Which of these can a form record?", "\U0001F4DD", "counts, measurements and categories", ["only stories", "nothing", "only pictures"], "All three kinds of statistical data go into a form."),
                 q("Juice spills on the paper table. What about the computer copy?", "\U0001F4BB", "it is still there", ["it is soaked too", "it disappears", "it turns to juice"], "The juice only reached the paper. The computer's copy was not touched."),
                 q("What can a computer do with data that paper cannot?", "\U0001F50E", "search, copy, send and count it in a blink", ["hold it", "fold it", "nothing"], "That is why data is stored on computers."),
             ]},
             "That is the whole lesson finished. You can collect data, and you know what kind you are collecting."),
    ],
}


LESSON["about"] = [
    "Say why data is stored on computers.",
    "Collect categorical data for a purpose, and compare the ways of collecting it.",
    "Say which kinds of statistical data a form can record: counts, measurements and categories.",
    "Tell a question that gives statistical data from one that does not.",
]

LESSON["lecture"] = [
    part("\U0001F4BE", "Why computers keep data",
         "Data on a computer is safe from spills and tears, and a spare copy can be kept. You can search it, copy it, send it to Grandma, and the computer counts it in a blink. Paper cannot do any of that in a blink."),
    part("\U0001F3AF", "A purpose first",
         "Collecting data starts with a purpose: we need to know which fruit to buy for the party. The purpose decides the question: which fruit do you like best, apple, banana, orange or grapes?"),
    part("\U0001F4F1", "Ways of collecting",
         "Shouting gives noise. Guessing gives a guess. A tally on paper works but you count the marks yourself. A form on a tablet records every answer and counts them as they arrive. The form is the way that works."),
    part("\U0001F4CA", "Statistical or not",
         "A statistical question gives answers you can count or measure: how many pets, how tall, which fruit. Why do you like your dog gives a story, and stories cannot be counted."),
    part("\U0001F3F7️", "Three kinds",
         "Statistical data comes in three kinds a form can record: a count, like how many pets; a measurement, like how tall; and a category, like favourite fruit. Think about the kind before you ask."),
]

LESSON["words"] = [
    word("data", "\U0001F4CA", "Facts and numbers we collect.",
         ["We collected data about fruit.", "Data on a computer is safe."]),
    word("collect", "\U0001F4E5", "To gather answers from people.",
         ["Collect the answers with a form.", "We collected eight answers."]),
    word("purpose", "\U0001F3AF", "The reason you are collecting the data.",
         ["The purpose is to choose the party fruit.", "Start with a purpose."]),
    word("form", "\U0001F4DD", "A page on a computer where people put in their answers.",
         ["Fill in the form.", "The form counted the answers."]),
    word("tally", "\U0001F4CB", "Marks on paper, one for each answer.",
         ["A tally of four marks.", "Count the tally."]),
    word("statistical", "\U0001F522", "Data you can count or measure.",
         ["How many pets is statistical.", "A story is not statistical."]),
    word("category", "\U0001F3F7️", "One choice from a list.",
         ["Banana is a category.", "Favourite colour is categorical data."]),
    word("measurement", "\U0001F4CF", "How much, how tall or how heavy something is.",
         ["Height is a measurement.", "Record the measurement."]),
]

LESSON["home"] = [
    home("Four ways", "Your family, paper, a pencil, a phone if there is one",
         ["Decide a purpose: what to cook on Friday.",
          "Try collecting everyone's answer by shouting, by guessing, by a paper tally, and by typing it into a phone.",
          "Which way gave data you could count?"],
         "Noise is not data. A guess is not data."),
    home("Statistical or not", "A grown-up",
         ["Take turns asking questions.",
          "For each one, say: statistical (we could count it) or not (a story).",
          "Turn a story question into a statistical one."],
         "'Tell me about your pets' becomes 'how many pets do you have?'"),
    home("Three kinds", "Paper and a pencil",
         ["Write one question that gives a count, one that gives a measurement, one that gives a category.",
          "Ask three people each question.",
          "Which answers were easiest to write in a table?"],
         "Counts, measurements and categories all fit in a table."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you drove a floor robot to the shop, home and school, and predicted where a program would leave it."
LESSON["warmup"] = [
    q("We want to know which colour most children like. What should we do?", "\U0001F3A8", "ask everyone and count the answers", ["guess", "ask the paint", "pick our own favourite"], "Data is what people actually say. Counting it gives the answer."),
    q("Which question gives an answer you can count?", "\U0001F522", "how many pencils are in your pencil case?", ["what is your favourite dream?", "tell me a story", "why is the sky nice?"], "'How many' gives a number you can count."),
]
