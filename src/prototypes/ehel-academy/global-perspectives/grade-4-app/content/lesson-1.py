# -*- coding: utf-8 -*-
"""Lesson 1 - Where Food Comes From.

0838 Stage 4 Research: 4Rq.01 construct own questions to aid understanding of
a topic; 4Ri.01 locate relevant information and answers to questions within
sources provided. The topic is the journey of our food: a loaf of bread and a
banana both arrive in the shop from somewhere, and a nine-year-old can build
questions about that journey, then locate the answers in a text and a market.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "where-food-comes-from",
    "title": "Where Food Comes From",
    "blurb": "A loaf and a banana are on the shelf, but where did they come from, and how far did they travel? Construct your own questions about the journey of our food, then locate the answers inside a text and a market.",
    "steps": [
        step("demo", "A question that opens a journey", "\U0001F35E", "Journey asker", ["4Rq.01"],
             "Mr Omar sells bread and bananas. Amal wants to understand how they got there. Press <b>Next</b> and hear the questions she constructs.",
             explain(
                 ["A good question about a topic is one you cannot answer yet, and it opens up a part of the topic you had not thought about.",
                  "Food has a journey. Each question opens one stage of it."],
                 ["Where was the wheat in this bread grown? That opens the start of the journey.",
                  "How many days did the banana travel? That opens the middle.",
                  "Is bread nice? Everybody has an answer. It opens nothing."],
                 ["Children ask about themselves: do I like bananas?", "Ask about the topic: where did the banana come from, and how?"],
                 ["Press Next and follow Amal's questions."]),
             {"frames": [
                 {"pic": "\U0001F3EA", "cap": "Amal is in Mr Omar's shop. A loaf and a bunch of bananas. <b>Where did they come from?</b>", "say": "Amal is in Mr Omar's shop. A loaf and a bunch of bananas. Where did they come from? She wants to understand the journey."},
                 {"pic": "\U0001F33E", "cap": "First question: <b>where was the wheat in this bread grown?</b>", "say": "Her first question: where was the wheat in this bread grown? That opens the start of the bread's journey.", "sound": "ding"},
                 {"pic": "\U0001F6A2", "cap": "Then: <b>how do bananas reach shops across the sea?</b>", "say": "Then: how do bananas reach shops across the sea? Our bananas grow near here, but some bananas travel very far to reach a shop. That opens the middle of the journey.", "sound": "ding"},
                 {"pic": "\U0001F4C5", "cap": "And: <b>how many days does a banana take to reach the shop?</b> A number she can find.", "say": "And: how many days does a banana take to reach the shop? A number she can find out.", "sound": "ding"},
                 {"pic": "\U0001F914", "cap": "Sami asks: <b>are bananas yellow?</b> Look at them. That opens nothing.", "say": "Sami asks: are bananas yellow? Look at them. He can answer it already. It opens nothing.", "sound": "boing"},
                 {"pic": "\U0001F4A1", "cap": "A question helps you understand when you <b>cannot answer it yet</b> and it <b>opens a stage of the journey</b>.", "say": "A question helps you understand when you cannot answer it yet, and it opens a stage of the journey.", "sound": "tada"},
             ]},
             "Construct questions that open a stage of the journey you cannot see yet."),

        step("explore", "The stages of a food journey", "\U0001F69A", "Journey mapper", ["4Rq.01"],
             "Food travels in stages. Tap each stage; each one is a place a question can open.",
             explain(
                 ["Grown, moved, sold, eaten. Four stages.", "A question about each stage opens a different part of the topic."],
                 [],
                 [],
                 ["Tap all four, then answer."]),
             {"items": [
                 {"pic": "\U0001F33E", "label": "grown", "say": "Grown. Wheat in a field, bananas on a tall plant near the equator. Question: where, and by whom?"},
                 {"pic": "\U0001F6A2", "label": "moved", "say": "Moved. By lorry, by ship, by train. Question: how far, and how long did it take?"},
                 {"pic": "\U0001F3EA", "label": "sold", "say": "Sold. In Mr Omar's shop, at the market, in the supermarket. Question: who chose the price?"},
                 {"pic": "\U0001F37D️", "label": "eaten", "say": "Eaten. At our table. Question: what happens to what we do not eat?"},
             ], "need": 4,
              "then": {"ask": "Which question OPENS a stage of the banana's journey?",
                       "opts": [opt("How many days did the banana take to reach the shop?", True), opt("Are bananas yellow?", False), opt("Do I like bananas?", False)],
                       "why": "You cannot answer it yet, and it opens the moving stage."}},
             "Grown, moved, sold, eaten. Four stages, four places for a question."),

        step("askq", "Construct your questions about food", "❓", "Question builder", ["4Rq.01"],
             "You want to understand a stage of the food journey. Construct the question that opens it, then press <b>Ask it</b>.",
             explain(
                 ["Pick the question word that asks for the thing you want to understand, and the ending that names the stage."],
                 ["You want to understand where the wheat was grown.", "Where, plus was the wheat in our bread grown?"],
                 [],
                 ["Read the card, pick the word and the ending, press Ask it."]),
             {"topic": "the journey of our food", "words": ["What", "Where", "Why", "How", "How far", "How many"],
              "ends": [
                  {"id": "wheat", "t": "was the wheat in our bread grown?", "words": ["Where", "How", "Why"], "asks": "the wheat in our bread"},
                  {"id": "ship", "t": "do bananas reach shops across the sea?", "words": ["How", "Why"], "asks": "bananas reaching shops across the sea"},
                  {"id": "days", "t": "days does a banana take to reach the shop?", "words": ["How many"], "asks": "the days a banana travels"},
                  {"id": "far", "t": "away is the farm where the banana grew?", "words": ["How far"], "asks": "the distance to the banana farm"},
                  {"id": "cold", "t": "are bananas kept cold on the ship?", "words": ["Why", "How", "Where"], "asks": "keeping bananas cold on the ship"},
                  {"id": "waste", "t": "happens to the bread the shop does not sell?", "words": ["What"], "asks": "what happens to unsold bread"},
              ],
              "rounds": [
                  {"want": "the place the wheat in our bread was grown", "pic": "\U0001F33E", "word": "Where", "end": "wheat", "why": "Where asks for a place. A farm, a country."},
                  {"want": "the way bananas travel to shops across the sea", "pic": "\U0001F6A2", "word": "How", "end": "ship", "why": "How asks for the way it is done. By ship, in a cold hold."},
                  {"want": "the number of days a banana takes to reach the shop", "pic": "\U0001F4C5", "word": "How many", "end": "days", "why": "How many asks for a number of days."},
                  {"want": "the distance to the farm where a banana grew", "pic": "\U0001F30D", "word": "How far", "end": "far", "why": "How far asks for a distance."},
                  {"want": "the reason bananas are kept cold on the ship", "pic": "\U0001F9CA", "word": "Why", "end": "cold", "why": "Why asks for a reason: so they do not ripen too soon."},
                  {"want": "what becomes of the bread the shop does not sell", "pic": "\U0001F35E", "word": "What", "end": "waste", "why": "What happens next opens the end of the journey."},
              ]},
             "Six questions of your own, each opening a stage of the food journey."),

        step("sort", "Does it open the journey?", "\U0001F9E0", "Question judge", ["4Rq.01"],
             "Our topic is the journey of our food. Would this question help you UNDERSTAND it?",
             explain(
                 ["A question helps when you cannot answer it yet and it opens a stage of the journey."],
                 ["How far does a banana travel? Opens the moving stage. Helps.", "Are bananas yellow? Look at one. Does not help.", "What is my favourite fruit? About you, not the journey."],
                 [],
                 ["Read it, then tap the bin."]),
             {"ask": "Would it help me understand the journey of our food?",
              "bins": [{"id": "yes", "label": "Opens the journey", "pic": "\U0001F9E0"}, {"id": "no", "label": "Opens nothing", "pic": "\U0001F937"}],
              "items": [
                  {"pic": "\U0001F30D", "label": "How far does a banana travel to reach a shop across the sea?", "bin": "yes", "why": "A distance you cannot guess. It opens the moving stage."},
                  {"pic": "\U0001F34C", "label": "Are bananas yellow?", "bin": "no", "why": "Look at one. You can answer it already."},
                  {"pic": "\U0001F33E", "label": "Who grows the wheat for our bread?", "bin": "yes", "why": "It opens the growing stage, and you do not know yet."},
                  {"pic": "\U0001F60B", "label": "What is my favourite fruit?", "bin": "no", "why": "It is about you, not about where food comes from."},
                  {"pic": "\U0001F35E", "label": "What happens to bread the shop does not sell?", "bin": "yes", "why": "It opens the end of the journey."},
                  {"pic": "\U0001F3A8", "label": "What colour is the shop door?", "bin": "no", "why": "You can see it, and it is not about the journey."},
              ]},
             "You can tell a question that opens the journey from one that opens nothing."),

        step("text", "Locate the answers in the text", "\U0001F4C4", "Answer locator", ["4Ri.01"],
             "Teacher Yasmin found a text about the banana's journey. Locate the sentence that answers each of your questions.",
             explain(
                 ["A source holds the answers, but each one is in a different sentence.", "Read the question, then locate the sentence that answers it and nothing else."],
                 ["How many days does the journey take? Locate the sentence with the number of days.",
                  "Why are they kept cold? Locate the sentence with the reason."],
                 ["Children tap the first sentence about bananas.", "Every sentence is about bananas. Locate the one that answers THIS question."],
                 ["Press Read it to me, then tap the sentence that answers."]),
             {"title": "How a banana reaches a shop across the sea",
              "lines": [
                  "Bananas grow on tall plants in hot countries near the equator, such as Uganda, Ecuador and Ghana.",
                  "They are picked while they are still green, so they do not go soft on the way.",
                  "Lorries take the green bananas to a port, where they are loaded onto a ship.",
                  "The ship keeps them cold, at about thirteen degrees, so they do not ripen before they arrive.",
                  "The voyage takes about ten days, and a banana can travel more than eight thousand kilometres.",
                  "In a warm room near the shops the bananas turn yellow, and then they are ready to sell.",
              ],
              "rounds": [
                  {"ask": "Where do bananas grow?", "about": "where bananas grow", "line": 0, "why": "On tall plants in hot countries near the equator. The first sentence."},
                  {"ask": "Why are bananas kept cold on the ship?", "about": "why they are kept cold", "line": 3, "why": "So they do not ripen before they arrive. The sentence with the reason."},
                  {"ask": "How many days does the voyage take?", "about": "the length of the voyage", "line": 4, "why": "About ten days. The sentence with the number of days."},
                  {"ask": "Why are bananas picked while they are green?", "about": "why they are picked green", "line": 1, "why": "So they do not go soft on the way."},
                  {"ask": "Where do bananas turn yellow?", "about": "where they turn yellow", "line": 5, "why": "In a warm room near the shops. The last sentence."},
              ]},
             "Five of your own questions, five answers located inside the text."),

        step("source", "Locate it in the market", "\U0001F3EA", "Market finder", ["4Ri.01"],
             "The market is a source about food journeys too. Explore it, then locate the part that answers each question.",
             explain(
                 ["A picture holds answers as well as a text.", "Look for the PART of the picture that answers your question."],
                 [],
                 [],
                 ["Tap five things, then locate the part for each question."]),
             {"scene": "market", "need": 5, "caption": "Tap the stalls and signs to see what each one tells us about where food comes from.",
              "spots": [
                  spot("bread", "the bread stall", "The baker made this bread at four o'clock this morning, from flour milled thirty kilometres away.", 70, 150, "\U0001F35E"),
                  spot("bananas", "the banana box", "A chalk sign says: picked yesterday at a farm three kilometres up the road.", 160, 155, "\U0001F34C"),
                  spot("apples", "the apple crate", "The crate says: Grown in South Africa. These apples travelled thousands of kilometres.", 250, 150, "\U0001F34E"),
                  spot("van", "the delivery van", "The van brings fruit from the big wholesale market in the city before dawn.", 60, 80, "\U0001F69A"),
                  spot("fish", "the fish counter", "The fish came from the coast overnight, packed in ice to keep it fresh.", 250, 85, "\U0001F41F"),
              ],
              "rounds": [
                  {"ask": "Which part shows food that came from another COUNTRY?", "about": "which food came from another country", "spot": "apples", "why": "The crate says Grown in South Africa."},
                  {"ask": "Which part shows food grown CLOSEST to the market?", "about": "which food was grown closest", "spot": "bananas", "why": "A farm three kilometres up the road."},
                  {"ask": "Which part shows HOW food reaches the market before dawn?", "about": "how food reaches the market", "spot": "van", "why": "The delivery van brings it from the wholesale market."},
                  {"ask": "Which part shows food kept fresh with ICE?", "about": "which food was kept fresh with ice", "spot": "fish", "why": "The fish counter: packed in ice overnight."},
              ]},
             "The market answered four questions, one part each. That is locating information."),

        step("questions", "Questions and journeys", "\U0001F4AC", "Question judge", ["4Rq.01", "4Ri.01"],
             "Think about your own questions and where the answers were. Tap the answer.",
             explain(
                 ["Construct questions that open a stage.", "Locate the part of the source that answers each one."],
                 [],
                 [],
                 ["Read it, then tap."]),
             {"label": "Question", "items": [
                 q("Amal wants to understand how the bread reached Mr Omar's shop. Which question helps?", "\U0001F9E0", "Where was the wheat in this bread grown?", ["Is bread nice?", "What is my favourite bread?"], "She cannot answer it yet, and it opens the start of the bread's journey."),
                 q("Which sentence answered 'why are bananas kept cold'?", "\U0001F9CA", "The ship keeps them cold so they do not ripen before they arrive.", ["Bananas grow in hot countries.", "The voyage takes about ten days."], "The sentence with the reason."),
                 q("Which part of the market showed food grown three kilometres away?", "\U0001F34C", "the banana box", ["the apple crate", "the fish counter"], "A farm three kilometres up the road."),
                 q("Every sentence in the text is about bananas. How do you locate the answer?", "\U0001F50D", "find the one sentence that answers THIS question", ["tap the first sentence", "read the title"], "One sentence answers each question."),
             ]},
             "You construct questions that open a topic, and you locate their answers."),

        step("quiz", "Show what you know", "⭐", "Star researcher", ["4Rq.01", "4Ri.01"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 [],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("A question helps you understand a topic when…", "\U0001F9E0", "you cannot answer it yet and it opens a stage of the topic", ["everybody knows the answer", "it is about you", "it is short"], "Amal's questions each opened a stage of the journey."),
                 q("What are the four stages of a food journey?", "\U0001F69A", "grown, moved, sold, eaten", ["bought, cooked, washed, dried", "big, small, hot, cold", "red, green, yellow, brown"], "Each stage is a place for a question."),
                 q("Which of these places could bananas grow in?", "\U0001F34C", "a hot country near the equator", ["the snow", "the ship", "the shop"], "The first sentence of the text."),
                 q("Why are bananas picked green?", "\U0001F33F", "so they do not go soft on the way", ["because green is prettier", "they are never picked green", "so they taste sour"], "The text said so."),
                 q("About how many days is the voyage?", "\U0001F4C5", "ten", ["two", "a hundred", "one"], "About ten days, more than eight thousand kilometres."),
                 q("Which question word asks for a DISTANCE?", "\U0001F30D", "How far", ["Why", "Who", "When"], "How far does a banana travel?"),
                 q("Sami asked if bananas are yellow. Why did that not help?", "\U0001F914", "he could answer it already by looking", ["bananas are not yellow", "it was rude", "it was too long"], "A question you can already answer opens nothing."),
                 q("Which part of the market showed how food arrives before dawn?", "\U0001F69A", "the delivery van", ["the bread stall", "the apple crate", "the fish counter"], "The van brings fruit from the wholesale market."),
             ]},
             "That is the whole lesson finished. You construct your own questions and locate their answers in a source."),
    ],
}


LESSON["about"] = [
    "Construct your own questions that open a stage of a topic.",
    "Say why a question helps: you cannot answer it yet, and it opens part of the journey.",
    "Locate the one sentence in a text that answers each question.",
    "Locate the part of a picture that answers a question.",
]

LESSON["lecture"] = [
    part("\U0001F3EA", "Amal in the shop",
         "A loaf and a bunch of bananas on Mr Omar's shelf. Amal wants to understand how they got there, so she constructs her own questions about the journey."),
    part("❓", "Questions that open a stage",
         "Where was the wheat grown? How do bananas reach shops across the sea? How many days did they travel? Each one Amal cannot answer yet, and each one opens a stage of the journey. Are bananas yellow? She can see. That opens nothing."),
    part("\U0001F69A", "Grown, moved, sold, eaten",
         "Food travels in four stages. A question about the growing opens the start. A question about the moving opens the middle. A question about what happens to what is not sold opens the end."),
    part("\U0001F4C4", "Locate the answer",
         "A text about the banana's journey holds the answers, one per sentence. Why are they kept cold? Locate the sentence with the reason. How many days? Locate the sentence with the number. Every sentence is about bananas; only one answers your question."),
    part("\U0001F3EA", "A market answers too",
         "The apple crate says Grown in South Africa. The banana sign says a farm three kilometres up the road. The fish is packed in ice from the coast. Locate the part that answers your question."),
]

LESSON["words"] = [
    word("journey", "\U0001F69A", "The way something travels from where it starts to where it ends.",
         ["A banana's journey can cross an ocean.", "Food has a journey in four stages."]),
    word("construct", "\U0001F527", "To build or make something yourself.",
         ["Construct your own question.", "Amal constructed six questions."]),
    word("locate", "\U0001F50D", "To find exactly where something is.",
         ["Locate the sentence that answers.", "We located the banana box in the market."]),
    word("source", "\U0001F4D6", "Somewhere you can find information: a text, a picture, a person, a place.",
         ["The text was our source.", "The market was a source too."]),
    word("equator", "\U0001F30D", "The imaginary line round the middle of the Earth, where the Sun is high in the sky all year round.",
         ["Bananas grow near the equator.", "Ecuador is on the equator."]),
    word("ripen", "\U0001F34C", "To become ready to eat.",
         ["Bananas ripen in a warm room.", "The cold ship stops them ripening too soon."]),
]

LESSON["home"] = [
    home("Where did it come from?", "A grown-up and three things from the kitchen cupboard",
         ["Read each label and find where the food came from.",
          "Construct one question about each one's journey that the label does not answer.",
          "Guess which travelled furthest, then check on a map."],
         "Which food had the longest journey? Did the label say how it travelled?"),
    home("Locate the answer", "A leaflet, a recipe or a food label, and a grown-up",
         ["Your grown-up asks a question the text can answer.",
          "Locate the one sentence that answers it and read it out.",
          "Ask them one the text CANNOT answer, and say what source would."],
         "Was the answer where you expected it to be?"),
    home("The market source", "A shop or market and a grown-up",
         ["Find one food grown near you and one from far away.",
          "Find something that tells you HOW it arrived: a box, a sign, a van.",
          "Tell your grown-up the four stages of one food's journey."],
         "Which stage could you not find out about in the shop?"),
]

LESSON["lookback"] = {
    "not": ["how to swim", "the names of the planets", "how to ride a bike"],
    "changed": [
        {"before": "Food just comes from the shop.", "after": "Food is grown, moved, sold and eaten, and a banana can travel eight thousand kilometres."},
        {"before": "Any question about a topic is worth asking.", "after": "The questions worth asking open a stage I cannot see yet."},
        {"before": "To find an answer I had to go through the whole text.", "after": "I can find the one sentence that answers my question."},
    ],
}

# Before we start: two questions asked BEFORE the teaching, answerable
# without this lesson's story. Not marked - see warmUp in lesson-kit/lib/gp.js.
LESSON["check"] = [
    q("Which question would help you understand how milk gets to the shop?", "\U0001F95B", "Where does the milk go after the cow is milked?", ["Do you like milk?", "Is milk white?"], "It asks about a stage of the milk's journey that you cannot answer yet."),
    q("A box of mangoes has a label: Grown in Kenya. What does the label tell you?", "\U0001F96D", "where the mangoes were grown", ["how much they cost", "who will eat them"], "The label says where they were grown."),
]
