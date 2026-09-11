# -*- coding: utf-8 -*-
"""Lesson 8 - Our Gallery.

0067 Stage 1: R.01 celebrate - "ordering work into colours or categories",
a tabletop gallery, celebratory comments; R.02 compare works and give a
reason; TWA.03 review and refine, "collectively, so that discoveries ... are
shared", never comparing quality between children; E.01 the four strands as
what artists do; E.03 gather by sorting. The journal here is COURSE-scope:
its record is every lesson's making steps, filled by the builder, so the
child looks back over the whole year.
"""
from _kit import explain, step, opt, q, part, word, home, work, comment, change

LESSON = {
    "slug": "our-gallery",
    "title": "Our Gallery",
    "blurb": "Find out what artists do, sort the gallery by colour, compare two pictures, say kind words about art from far away, make three pieces even better, and look back at everything you made this year.",
    "steps": [
        step("explore", "What artists do", "🧑🏾‍🎨", "Artist ways", ["1R.01", "1TWA.01"],
             "Artists do four things, again and again. Tap each one.",
             explain(
                 ["Being an artist is not one thing. It is four things, round and round."],
                 ["Experiencing: looking, touching, trying.", "Making: doing it, with your hands.",
                  "Reflecting: looking at what you made and celebrating it.", "Thinking and working artistically: having ideas, being brave, making it better."],
                 ["Children think artists only paint.", "Artists look, make, think, and look again."],
                 ["Tap all four and listen."]),
             {"items": [
                 {"pic": "👀", "label": "experiencing", "say": "Experiencing. Looking at art, touching materials, trying tools. Everything you did with lines, colours, textures and shapes."},
                 {"pic": "✋", "label": "making", "say": "Making. Doing it with your hands: mixing, drawing, joining, building. Every mark you made."},
                 {"pic": "💛", "label": "reflecting", "say": "Reflecting. Looking back at what you made, saying kind words, and finding what is the same and different."},
                 {"pic": "💡", "label": "thinking and working like an artist", "say": "Thinking and working like an artist. Having an idea, being brave with new things, and changing one thing to make it better."},
             ], "need": 4,
              "then": {"ask": "Which of these is REFLECTING?",
                       "opts": [opt("looking back at what you made and saying a kind word", True), opt("mixing red and blue", False), opt("cutting with scissors", False)],
                       "why": "Reflecting is looking back and celebrating. Mixing and cutting are making."}},
             "Experiencing, making, reflecting, thinking. That is what artists do."),

        step("sort", "Sort the gallery by colour", "🎨", "Gallery sorter", ["1R.01", "1E.03"],
             "A gallery hangs pictures in groups. Sort these by their main colour.",
             explain(
                 ["One way to celebrate work is to put it in groups.", "By colour is the easiest: everything mostly red together, everything mostly blue together."],
                 ["An apple is mostly red.", "The sea is mostly blue.", "A lemon is mostly yellow."],
                 ["Children sort by what the thing IS.", "Sort by its COLOUR. A red apple and a red fire engine go together."],
                 ["Look at the colour, then tap the bin."]),
             {"ask": "Mostly red, mostly blue, or mostly yellow?",
              "bins": [{"id": "red", "label": "Mostly red", "pic": "🟥"}, {"id": "blue", "label": "Mostly blue", "pic": "🟦"}, {"id": "yellow", "label": "Mostly yellow", "pic": "🟨"}],
              "items": [
                  {"pic": "🍎", "label": "a picture of an apple", "bin": "red", "why": "An apple is mostly red."},
                  {"pic": "🌊", "label": "a picture of the sea", "bin": "blue", "why": "The sea is mostly blue."},
                  {"pic": "☀️", "label": "a picture of the sun", "bin": "yellow", "why": "The sun is mostly yellow."},
                  {"pic": "🚒", "label": "a picture of a fire engine", "bin": "red", "why": "A fire engine is mostly red."},
                  {"pic": "🐳", "label": "a picture of a whale", "bin": "blue", "why": "A whale in the sea is mostly blue."},
                  {"pic": "🍋", "label": "a picture of a lemon", "bin": "yellow", "why": "A lemon is mostly yellow."},
                  {"pic": "🌹", "label": "a picture of a rose", "bin": "red", "why": "A rose is mostly red."},
                  {"pic": "🐥", "label": "a picture of a chick", "bin": "yellow", "why": "A chick is mostly yellow."},
              ]},
             "You sorted the gallery by colour. That is one way to hang a show."),

        step("compare", "Two pictures in the gallery", "⚖️", "Gallery comparer", ["1R.02"],
             "Two pictures hang side by side. Is each thing in BOTH, or only in one?",
             explain(
                 ["When two pictures hang together, people compare them.", "What do both have? What does only one have?"],
                 ["Both have yellow.", "Only one has a face.", "Only one has flowers."],
                 ["Children say 'they are both nice'.", "Say what is the SAME and what is DIFFERENT."],
                 ["Look at both, then tap a bin."]),
             {"a": work("port", "My Sister", "portrait", ["a face", "fluffy hair", "red", "yellow", "a smile"], state="wool"),
              "b": work("flow", "Flowers for Mum", "flowers", ["flowers", "a vase", "pink", "green", "yellow", "stems"]),
              "cards": [
                  comment("yellow", "yellow"),
                  comment("a face", "a face"),
                  comment("flowers", "flowers"),
                  comment("green", "green"),
                  comment("fluffy hair", "fluffy hair"),
                  comment("a vase", "a vase"),
              ]},
             "You compared two pictures in the gallery, and said which you like."),

        step("comment", "Kind words for art from far away", "🌍", "Gallery guide", ["1R.01", "1E.01"],
             "These works were made by artists far away. Say something kind about what is really in each one.",
             explain(
                 ["A kind word is for every artist, near or far.", "Name something that is really in the work."],
                 ["The weaver made stripes. 'I love your red and yellow stripes' is about the cloth.",
                  "'Your dots are lovely' is about a different work."],
                 ["Children say what they WISH was there.", "Look, and say what IS there."],
                 ["Look, then tap the comment that is about it."]),
             {"works": [
                 work("weaver", "A patterned cloth", "cloth", ["stripes", "red", "yellow", "black squares", "pattern"], owner="the weaver", owner_pic="🧑🏿‍🎨"),
                 work("basketmaker", "A woven basket", "basket", ["weaving", "brown", "over and under", "pattern"], owner="the basket maker", owner_pic="👩🏾‍🌾"),
                 work("carver", "A carved mask", "mask", ["carved lines", "eyes", "yellow dots", "wood"], owner="the carver", owner_pic="👨🏾‍🔧"),
              ],
              "rounds": [
                  {"work": "weaver", "opts": [comment("I love your bright red and yellow stripes.", "stripes"), comment("Your dots are lovely.", "dots"), comment("Your carved lines are so neat.", "carved lines")], "why": "The cloth has stripes. The dots and the carved lines are in other works."},
                  {"work": "basketmaker", "opts": [comment("Your over-and-under weaving is so neat.", "over and under"), comment("I like your yellow dots.", "yellow dots"), comment("Your stripes are bright.", "stripes")], "why": "The basket is woven over and under. No dots, no stripes."},
                  {"work": "carver", "opts": [comment("The lines you carved are beautiful.", "carved lines"), comment("I love your stripes.", "stripes"), comment("Your weaving is neat.", "weaving")], "why": "The mask has carved lines. The stripes and the weaving belong to the others."},
              ]},
             "You said kind, true words about art from far away."),

        step("refine", "Make it even better", "🔧", "Gallery mender", ["1TWA.03", "1R.02"],
             "Before the show, three pieces need one change each. Which change? Tap one and see.",
             explain(
                 ["Before a show, artists look at each piece and make it better.", "Not because it is bad. Because it can be even better."],
                 ["The pictures keep falling over: stand them against something.", "Nobody can read the label: write it bigger and darker.",
                  "The pattern stops halfway: add tiles until it reaches the end."],
                 ["Children think 'better' means 'start again'.", "Change ONE thing."],
                 ["Tap a change and see what it does."]),
             {"rounds": [
                 {"piece": {"title": "The tabletop gallery", "pic": "🖼️", "fixedPic": "🏛️", "problem": "The pictures keep falling flat on the table.", "fixed": "Every picture stands up for the show."},
                  "needs": "stand",
                  "changes": [
                      change("prop", "Lean each picture against a book", "📚", "stand", "Propped against a book, every picture stands up and stays up."),
                      change("colour", "Colour the frames red", "🟥", "colour", "Red frames. Still lying flat."),
                      change("smaller", "Cut the pictures smaller", "✂️", "worse", "Smaller pictures, still flat, and now harder to see."),
                      change("hide", "Put them in a drawer", "🗄️", "worse", "In a drawer nobody can see them. That is not a show."),
                  ],
                  "why": "A picture that falls over needs something to stand against."},
                 {"piece": {"title": "The gallery label", "pic": "🏷️", "fixedPic": "🪧", "problem": "Nobody can read the name on it.", "fixed": "Everyone can read it now."},
                  "needs": "readable",
                  "changes": [
                      change("big", "Write it bigger, with a dark pen", "🖊️", "readable", "Big dark letters. Everyone can read it from across the room."),
                      change("yellow", "Write it in yellow on white paper", "🟨", "worse", "Yellow on white. Even harder to read."),
                      change("star", "Draw a star on it", "⭐", "add", "A star, and still nobody can read the name."),
                      change("fold", "Fold it in half", "📄", "smaller", "Folded. Now you cannot see the name at all."),
                  ],
                  "why": "Hard to read needs bigger and darker."},
                 {"piece": {"title": "The pattern strip", "pic": "🟥🟦🟥", "fixedPic": "🟥🟦🟥🟦🟥🟦", "problem": "The pattern stops halfway along the strip.", "fixed": "The pattern goes all the way to the end."},
                  "needs": "continue",
                  "changes": [
                      change("more", "Add more tiles until it reaches the end", "🧱", "continue", "Red, blue, red, blue, right to the end of the strip."),
                      change("colourin", "Colour in the empty half with one colour", "🟨", "colour", "One big yellow block. That is not the pattern any more."),
                      change("cut", "Cut the empty half off", "✂️", "worse", "A shorter strip. The show wanted a long one."),
                      change("fold", "Fold the empty half behind", "📄", "smaller", "Folded away. It still stops halfway."),
                  ],
                  "why": "A pattern that stops needs more of the same pattern, not something else."},
             ]},
             "Three pieces, three changes, all ready for the show."),

        step("journal", "My journal, the whole year", "📒", "Year journal", ["1R.01", "1TWA.03"],
             "This is everything you made in every lesson. Which came first? What would you change now?",
             explain(
                 ["Your journal holds everything you made this year.", "Looking back at it is reflecting, and it is what artists do at the end of a show."],
                 ["Tap the things in the order you made them: the first lesson first.", "Then pick one, and say what you would change now."],
                 ["Children think their first work was bad because it was first.", "It was not bad. It was where you started. Look how far you came."],
                 ["Tap the thing you made first."]),
             {"scope": "course",
              "changes": ["make it bigger", "use a colour I learned later", "add a texture", "make a pattern out of it", "keep it just as it is"]},
             "You looked back over the whole year, and said what you would change. That is an artist reflecting."),

        step("questions", "Gallery quiz", "💬", "Gallery spotter", ["1R.01", "1R.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about the gallery."],
                 ["Think about sorting, comparing, kind words and making things better."],
                 [],
                 ["Read it, then tap."]),
             {"label": "Gallery", "items": [
                 q("One way to hang a gallery is to sort the pictures by…", "🎨", "colour", ["how heavy they are", "who is tallest"], "By colour: the reds together, the blues together."),
                 q("What did the sister picture and the flowers BOTH have?", "🟨", "yellow", ["a face", "a vase"], "Both have yellow. Only one has a face, and only one has a vase."),
                 q("A kind word about the basket should be about…", "🧺", "the weaving", ["the stripes", "the dots"], "The basket is woven. Stripes and dots are in other works."),
                 q("Before a show, artists…", "🔧", "make each piece a little better", ["throw the pieces away", "hide them"], "One change each, to make it even better."),
             ]},
             "You know your way round a gallery."),

        step("quiz", "Show what you know", "⭐", "Star artist", ["1E.01", "1E.03", "1R.01", "1R.02", "1TWA.01", "1TWA.03"],
             "Time to show what you know, about the whole year. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have done in this course."],
                 ["Think about lines, colours, textures, shapes, joining, looking, ideas and the gallery."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Red and blue make…", "🍇", "purple", ["orange", "green"], "Red and blue make purple. You mixed it yourself."),
                 q("Texture is how a thing…", "🖐️", "feels", ["sounds", "smells"], "How it feels when you touch it."),
                 q("A pattern is something that…", "🧱", "repeats", ["is blue", "is big"], "It says the same thing again and again."),
                 q("Wet clay joins…", "🏺", "wet clay", ["dry paper", "glass"], "Wet clay presses onto wet clay."),
                 q("Which of the four things artists do is 'looking back and celebrating'?", "💛", "reflecting", ["making", "experiencing"], "Reflecting is looking back."),
                 q("A kind comment about a picture should be about…", "💬", "something really in it", ["a different picture", "nothing"], "Name the thing that is there."),
                 q("When a piece is not right, an artist…", "🔧", "changes one thing", ["throws it away", "gives up"], "Change one thing, and look again."),
                 q("Your journal is for…", "📒", "keeping what you made, to look back at", ["throwing away", "hiding from everyone"], "A journal keeps your work so you can look back and think."),
             ]},
             "That is the whole year finished. You are an artist: you look, you make, you think, and you look again."),
    ],
}


LESSON["about"] = [
    "Name the four things artists do: experiencing, making, reflecting, and thinking and working like an artist.",
    "Sort pictures into groups by colour, to hang a gallery.",
    "Compare two pictures and say what is the same and what is different.",
    "Say a kind, true word about art from far away.",
    "Make a piece better with one change before a show.",
    "Look back over everything you made this year.",
]

LESSON["lecture"] = [
    part("🧑🏾‍🎨", "What artists do",
         "Artists do four things, round and round. They experience: look, touch, try. They make: mix, draw, join, build. They reflect: look back, celebrate, compare. And they think and work like an artist: have ideas, be brave, make it better. You did all four this year."),
    part("🖼️", "A gallery",
         "A gallery is a place where art is put up for people to see. The pictures hang in groups: by colour, or by what they are about. People walk past and compare them, and say what they like. Your class can make one on a table."),
    part("🔧", "Making it better",
         "Before a show, artists look at every piece and make one change to make it better. Not because it was bad. Nothing you made was bad. Because an artist can always see one more thing to try."),
    part("📒", "Looking back",
         "Your journal holds everything you made. Look back through it. Your first line, your first mix, your first pattern. See how far you came. That is reflecting, and it is the last thing an artist does, and the first thing before the next picture."),
]

LESSON["words"] = [
    word("gallery", "🖼️", "A place where art is put up for people to look at.",
         ["We made a gallery on the table.", "The gallery is open!"]),
    word("journal", "📒", "A book where you keep what you made and what you thought about it.",
         ["I stuck my rubbing in my journal.", "Look back through your journal."]),
    word("review", "🔍", "To look at something again, carefully, to see how it is.",
         ["Let us review the pot before the show.", "Artists review their work."]),
    word("improve", "📈", "To make something better.",
         ["One change can improve a picture.", "How could you improve it?"]),
    word("reflect", "💭", "To think about what you did and how it went.",
         ["Reflect on what you made this year.", "Artists reflect at the end."]),
    word("show", "🎪", "A time when art is put up for everyone to see.",
         ["Our show is on Friday.", "Get the pot ready for the show."]),
]

LESSON["home"] = [
    home("A tabletop gallery", "A table, everything you made this year, and some labels",
         ["Put your work out on the table in groups: by colour, or by what it is.", "Write a label for each one with its name and yours, big and dark.",
          "Invite your family to walk past and look."],
         "Which piece did people stop at longest? What did they say?"),
    home("One change", "One thing you made this year, and the materials to change it",
         ["Look at it for a whole minute.", "Say one thing you would change now that you know more.",
          "Change it, if you can. If you cannot, make a new one with the change."],
         "Is it better? What made the difference?"),
    home("The journal", "A scrapbook or a folder, glue, and everything you made",
         ["Stick your work in, in the order you made it.", "Next to each one, ask a grown-up to write what you say about it.",
          "Turn back to the first page."],
         "How is your last piece different from your first?"),
]
