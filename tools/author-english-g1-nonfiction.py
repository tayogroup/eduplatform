# -*- coding: utf-8 -*-
"""Grade 1 English: the non-fiction half of the reading diet.

WHY THIS EXISTS
===============
Every Grade 1 unit shipped with the same three readings -- a story about Amal,
a "Talk about ..." shared passage, and a rhyme. Thirty readings, one shape
repeated ten times, and NO non-fiction text anywhere in the grade. Measured
2026-09-16: the strings "contents page", "index", "caption", "diagram",
"subheading", "non-fiction", "information text", "fact file" and "diary" occur
ZERO times across all ten unit files.

Cambridge Primary English Stage 1 spends its nine units on nine different KINDS
of text on purpose, and six framework objectives are about exactly that. All six
were being claimed against outcomes that cannot deliver them:

    1Ri.03  read a range of simple non-fiction text types
            <- "Name some animals that live in water (fish, frog, turtle, whale)."
    1Ri.04  non-fiction types have different purposes and features
            <- "Make a six-page picture-and-word book."
    1Rs.03  parts of a book, including cover, title and contents
            <- "Choose favourite Grade 1 work."
    1Ws.02  organisational features -- subheadings, labelled diagrams
            <- eight SPEAKING outcomes ("Say 'I'm cutting ___.'")
    1Wp.05  diagrams with typed labels, storyboards with captions
            <- six more of the same
    1Wc.05  relevant information when writing simple non-fiction
            <- "Reflect and name one next English goal."

The citation was real, the stage was right, the count was 90/90, and no machine
read the outcome and the objective together. This tool writes the teaching and
then moves the claims onto it.

POSITION-SAFE, AND THAT IS NOT AN ACCIDENT
==========================================
The owner's constraint (2026-09-16) is that no step may move: the app reports
`sectionsDone` over a step count baked in at build time, and the hub's year bar
is 214 steps, so a new step re-scales both and a child mid-unit watches their
percentage fall.

Everything here lands inside a step that ALREADY EXISTS, because of how
build-lessons.py is written -- verified by reading it, not assumed:

    readings      -> add("story", ...) is called ONCE over the whole list, and
                     unitReadings() renders o.items.length cards. A fourth card.
    comprehension -> add("questions", ...) once; the round robin picks six.
    writing       -> add("writetasks", ...) once over every writing task.
    outcomes      -> add("overview", ...) once; it lists them.
    selfAssessment-> add("reflect", ...) once; it lists them.

So the slide count per page is unchanged. `--check` asserts that after a build.

NO PAID NARRATION (owner, 2026-09-16: "author text only")
=========================================================
Each new reading carries `audio.available: false`, which is this course's
recorded state for "narration is owed". source_of() in build-lessons.py returns
"" for it deliberately, so nothing plays a recording that does not exist and
nothing is billed. The debt is printed by --report so it cannot go quiet the way
the 297 blank-frame descriptors did.

IDEMPOTENT, AND IT ASSERTS THE PRE-STATE
========================================
Re-running changes nothing. It refuses rather than guesses if a unit is not in
the state it expects -- the rule this repo keeps paying for is that a patcher
derived from another patcher's output is how content silently doubles.

    python tools/author-english-g1-nonfiction.py --dry      # what would change
    python tools/author-english-g1-nonfiction.py            # write it
    python tools/author-english-g1-nonfiction.py --report   # narration owed
"""

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                     "grade-1", "data", "units")
FRAMEWORK = os.path.join(ROOT, "src", "curriculum", "cambridge-english-0058.json")

ORIGIN = "Ehel authoring 2026-09-16 (Cambridge Stage 1 non-fiction text types)"
REVIEW = "Needs curriculum review"
SOURCE = "Authored against Cambridge Primary English Stage 1 (LB1/WB1/TR1)"

# ---------------------------------------------------------------------------
# THE TEN TEXTS.
#
# One per unit, each a DIFFERENT non-fiction text type, each using that unit's
# own taught vocabulary (core-words.json: phonics / topic / sight strands) so it
# belongs to the unit rather than sitting beside it.
#
# Paragraphs are separated by a blank line because sentence_pages() splits on
# \n{2,} and pages four paragraphs at a time -- that is how the contents page in
# unit 9 and the chart in unit 6 keep their shape on a child's screen instead of
# being reflowed into prose.
#
# NO PASSAGE MAY OPEN WITH ITS OWN HEADING LINE, and that cost a rendering
# defect found only by looking at the page. Every one of these ten texts first
# began with its title as paragraph one ("Our Town", "My Week", ...). Two things
# then go wrong at once, and no gate can see either:
#
#   - unitReadings() ALREADY prints the title above the body on page 1
#     (`<h3 class="read-title">`), so the title appeared twice.
#   - `.read-page.first > p:first-of-type::first-letter` (lib/lesson.css) floats
#     a 68px drop cap on the first paragraph -- the oldest signal in children's
#     publishing, and exactly right for a story. On a two-word heading line it
#     renders as a giant "O" with "ur Town" wrapped beside it.
#
# So paragraph one is always PROSE, and the headings that carry the teaching
# (unit 4's "What you need", unit 5's three subheadings, unit 8's "Fact 1",
# unit 9's "Contents") sit inside the text where they belong.
#
# UK vocabulary throughout (owner, 2026-08-17).
# ---------------------------------------------------------------------------
TEXTS = [
    {
        "unit": 1,
        "type": "Labels",
        "title": "Our Classroom: Labels",
        "passage": """This is a picture with labels on it. A label is one word. It points at one thing.

door - you come in here

chair - you sit on this

book - you read this

pencil - you write with this

map - you look at this

A label is not a sentence. It is one word, or two. Labels help you find a thing fast.

Now look at your own class. Point at the door. Point at a chair. Say each word out loud.""",
        "outcome": "Read the labels on a picture and say what each one points at.",
        "objectives": ["1Ri.08", "1Rs.04", "1Wp.05"],
        "selfCheck": "I can read labels on a picture and say what each one points at.",
        "questions": [
            ("What does a label point at?", "One thing",
             "A label is one word and it points at one thing in the picture.",
             ["A whole sentence", "Every page"]),
            ("Which label tells you what you write with?", "pencil",
             "The label pencil points at the thing you write with.",
             ["chair", "door"]),
            ("Is a label a whole sentence?", "No, it is one word or two",
             "A label is not a sentence. It is one word, or two, so you can read it fast.",
             ["Yes, it is a long sentence", "Yes, it is a whole page"]),
        ],
        "writing": {
            "title": "Writing 7 - Label your own picture",
            "prompt": "Draw your own classroom. Now put three labels on it, like the labels in the text. Write one word next to each thing: door, chair, book, pencil or map.",
            "model": "door",
            "starter": "",
            "length": "Drawing with 3 labels",
            "example": ["door", "chair", "book"],
        },
    },
    {
        "unit": 2,
        "type": "Diary",
        "title": "My Week: A Diary",
        "passage": """A diary tells what you did. You write it after it happens.

Every day has its own line.

Monday

I got up at seven. Mum made an egg for me.

Tuesday

My sister lost her red pen. We looked under the bed and found it.

Wednesday

Grandma came to see us. She told us two good stories.

Thursday

Dad and my brother fed the hen.

A diary is not a story you make up. A diary is true. It is about your own days.""",
        "outcome": "Read a diary and say what happened on each day.",
        "objectives": ["1Ri.03", "1Rs.02", "1Wc.04"],
        "selfCheck": "I can read a diary and say what happened on each day.",
        "questions": [
            ("What does a diary tell you?", "It tells what you did on each day",
             "A diary tells what you did. You write it after it happens.",
             ["It tells a story someone made up", "It tells you what to buy"]),
            ("On Tuesday, what did the sister lose?", "Her red pen",
             "The diary says the sister lost her red pen and they found it under the bed.",
             ["Her egg", "Her book"]),
            ("Is a diary true or made up?", "True",
             "A diary is not a story you make up. It is about your own days, so it is true.",
             ["Made up", "Half of it is made up"]),
        ],
        "writing": {
            "title": "Writing 7 - Write one diary line",
            "prompt": "Write today's day name at the top, like Monday or Tuesday. Under it write one line about something you really did today.",
            "model": "Monday\nI fed the hen.",
            "starter": "Today I",
            "length": "1 day name and 1 sentence",
            "example": ["Tuesday", "I went to school with my brother."],
        },
    },
    {
        "unit": 3,
        "type": "Instructions",
        "title": "How to Play Jump the Rope",
        "passage": """Instructions tell you how to do something. You do them in order. Step one comes first.

1. Get a long rope and two friends.

2. Two friends hold the rope. One holds each end.

3. They swing the rope low and slow.

4. Run in. Now jump over the rope six times.

5. Swap. It is a friend's turn to jump.

Do the steps in order. If you jump before your friends hold the rope, the game will not work.""",
        "outcome": "Follow a set of instructions in the right order.",
        "objectives": ["1Ri.03", "1Rs.02", "1SLs.01"],
        "selfCheck": "I can follow instructions in the right order.",
        "questions": [
            ("What do instructions tell you?", "How to do something",
             "Instructions tell you how to do something, one step at a time.",
             ["What happened in a story", "Where a place is"]),
            ("How many times do you jump in step four?", "Six",
             "Step four says to run in and jump over the rope six times.",
             ["Two", "Ten"]),
            ("Why must you do the steps in order?", "Or the game will not work",
             "If you jump before your friends hold the rope, the game will not work.",
             ["So it takes longer", "So you can skip step one"]),
        ],
        "writing": {
            "title": "Writing 7 - Write step one",
            "prompt": "Think of a game you like. Write step one for a friend who has never played it. Start with a doing word, like Get or Hold or Run.",
            "model": "1. Get a big ball.",
            "starter": "1.",
            "length": "1 numbered step",
            "example": ["1. Get a big ball and one friend."],
        },
    },
    {
        "unit": 4,
        "type": "Instructions",
        "title": "How to Make a Paper Hat",
        "passage": """What you need

one big sheet of paper

a red pencil

a blue pencil

What you do

1. Fold the paper in half. Press the fold flat.

2. Fold the two top corners down to the middle.

3. Fold the bottom up on both sides.

4. Open the hat and put it on.

5. Draw on it. Draw a green star or an orange dot.

This text has two parts. The list tells you what to get before you start. The steps tell you what to do next. The words What you need and What you do are headings. A heading tells you what that part is about.""",
        "outcome": "Read a What you need list and collect the things on it before starting.",
        "objectives": ["1Ri.08", "1Ws.02", "1Wc.04"],
        "selfCheck": "I can read a list of what I need before I start making something.",
        "questions": [
            ("What does the What you need list tell you?", "What to get before you start",
             "The list tells you what to get before you start. The steps tell you what to do next.",
             ["What to do last", "Where to put the hat"]),
            ("How many pencils are on the list?", "Two",
             "The list has a red pencil and a blue pencil, so that is two pencils.",
             ["One", "Five"]),
            ("What does a heading tell you?", "What that part is about",
             "What you need and What you do are headings. A heading tells you what that part is about.",
             ["How long the text is", "Who wrote it"]),
        ],
        "writing": {
            "title": "Writing 7 - Write a What you need list",
            "prompt": "You are going to draw a picture. Write the heading What you need. Under it, list three things you will need. One thing on each line.",
            "model": "What you need\npaper\na pencil",
            "starter": "What you need",
            "length": "1 heading and 3 list items",
            "example": ["What you need", "paper", "a red pencil", "a box"],
        },
    },
    {
        "unit": 5,
        "type": "Information text",
        "title": "Animals on a Farm",
        "passage": """This is an information text. It tells you true things.

It does not tell a story.

What farm animals eat

A cow eats grass. A hen eats seeds and bugs. A horse eats grass and hay.

Where farm animals sleep

A cow sleeps in a barn. A hen sleeps in a hen house. A horse sleeps in a stable.

What farm animals give us

A cow gives us milk. A hen gives us eggs. A sheep gives us wool.

Each heading tells you what that part is about. You do not have to read all of it. You can read one part and stop.""",
        "outcome": "Use the subheadings in an information text to find the part you want.",
        "objectives": ["1Ri.03", "1Ri.04", "1Ws.02"],
        "selfCheck": "I can use headings to find the part of a text I want.",
        "questions": [
            ("Does an information text tell a story?", "No, it tells true things",
             "An information text tells you true things. It does not tell a story.",
             ["Yes, it tells a long story", "Yes, but only about animals"]),
            ("Where does a cow sleep?", "In a barn",
             "Under the heading Where farm animals sleep, it says a cow sleeps in a barn.",
             ["In a hen house", "In a stable"]),
            ("Which heading would you read to find out what a horse eats?",
             "What farm animals eat",
             "Each heading tells you what that part is about, so that heading holds what the animals eat.",
             ["Where farm animals sleep", "What farm animals give us"]),
        ],
        "writing": {
            "title": "Writing 7 - Write a fact under a heading",
            "prompt": "Write this heading: What farm animals give us. Under it, write one true fact of your own about a farm animal.",
            "model": "What farm animals give us\nA cow gives us milk.",
            "starter": "A",
            "length": "1 heading and 1 sentence",
            "example": ["What farm animals give us", "A hen gives us eggs."],
        },
    },
    {
        "unit": 6,
        "type": "Chart",
        "title": "Our Senses: A Chart",
        "passage": """A chart puts things in groups. You read a chart across the line, not down the page like a story.

Sense - Body part - What it tells us

see - eye - if a thing is big or small

hear - ear - if a sound is loud or soft

smell - nose - if food is good or bad

taste - mouth - if food is sweet or sour

touch - hand - if a shell is rough or smooth

Read one line across. Start at see. Then eye. Then what it tells us.

A chart is quick. You do not have to read all of it to find one thing.""",
        "outcome": "Read a chart across one line to find a single fact.",
        "objectives": ["1Ri.08", "1Rs.04"],
        "selfCheck": "I can read one line of a chart across to find a fact.",
        "questions": [
            ("Which way do you read a chart?", "Across the line",
             "You read a chart across the line, not down the page like a story.",
             ["Down the page", "From the last line up"]),
            ("Which body part goes with smell?", "nose",
             "On the smell line the chart says nose.",
             ["ear", "hand"]),
            ("What does touch tell us about a shell?", "If it is rough or smooth",
             "On the touch line the chart says if a shell is rough or smooth.",
             ["If it is loud or soft", "If it is sweet or sour"]),
        ],
        "writing": {
            "title": "Writing 7 - Add a line to the chart",
            "prompt": "Add one more line to the senses chart. Write a sense, then a body part, then what it tells you. Put a dash between each part, like the lines in the text.",
            "model": "see - eye - if a thing is big or small",
            "starter": "",
            "length": "1 chart line",
            "example": ["hear - ear - if a drum is loud or soft"],
        },
    },
    {
        "unit": 7,
        "type": "Signs and captions",
        "title": "Signs We See",
        "passage": """A sign is very short. It has one job.

It tells you what to do, or where to go.

STOP

This sign tells cars to stop. It is red.

BUS STOP

This sign tells you where to wait for the bus.

WAY OUT

This sign tells you where to go out.

NO BIKES

This sign tells you what you may not do here.

The small words under a sign or a picture are called a caption. A caption tells you more about what you can see.

Look on your own road. How many signs can you find?""",
        "outcome": "Read signs and captions and say what each one tells you.",
        "objectives": ["1Ri.08", "1Wp.05"],
        "selfCheck": "I can read a sign or a caption and say what it tells me.",
        "questions": [
            ("What does a sign tell you?", "What to do, or where to go",
             "A sign is very short and has one job. It tells you what to do, or where to go.",
             ["A long story about a road", "Who lives in a house"]),
            ("What is a caption?", "The small words under a picture",
             "The small words under a sign or a picture are called a caption.",
             ["A big red sign", "The name of a bus"]),
            ("Which sign tells you where to wait for the bus?", "BUS STOP",
             "The BUS STOP sign tells you where to wait for the bus.",
             ["WAY OUT", "NO BIKES"]),
        ],
        "writing": {
            "title": "Writing 7 - Write a caption",
            "prompt": "Draw a picture of something on your road. Under the picture, write a caption. A caption is one short line that tells us what we can see.",
            "model": "A long bus at the bus stop.",
            "starter": "",
            "length": "Drawing with 1 caption",
            "example": ["A red sign by the road."],
        },
    },
    {
        "unit": 8,
        "type": "Fact file",
        "title": "Water: A Fact File",
        "passage": """A fact file gives you facts fast. Every fact is short.

You can read just one fact and stop.

Fact 1

Water has no colour. Milk is white, but water is not.

Fact 2

A duck can swim on water. Its feet push it along.

Fact 3

A tree drinks water through its roots.

Fact 4

Rain is water that falls from a cloud.

Fact 5

We drink water every day. We cannot live without it.

Caption: A duck swims on the pond.

That line under the picture is a caption. It tells you what the picture shows.""",
        "outcome": "Read a fact file and say one fact from it in your own words.",
        "objectives": ["1Ri.03", "1Ri.04", "1Wc.05"],
        "selfCheck": "I can read a fact file and tell someone one fact from it.",
        "questions": [
            ("What colour is water?", "It has no colour",
             "Fact 1 says water has no colour. Milk is white, but water is not.",
             ["White, like milk", "Blue, like the sky"]),
            ("How does a tree drink water?", "Through its roots",
             "Fact 3 says a tree drinks water through its roots.",
             ["Through its leaves", "Through its bark"]),
            ("Why is every fact in a fact file short?", "So you can read just one and stop",
             "A fact file gives you facts fast. Every fact is short, so you can read just one.",
             ["So it fits on one page", "So it rhymes"]),
        ],
        "writing": {
            "title": "Writing 7 - Write two facts",
            "prompt": "Write the heading Fact 1 and then one true fact about water. Then write Fact 2 and another true fact. Keep each one short.",
            "model": "Fact 1\nWe drink water every day.",
            "starter": "Fact 1",
            "length": "2 headings and 2 sentences",
            "example": ["Fact 1", "Rain is water.", "Fact 2", "A duck can swim on water."],
        },
    },
    {
        "unit": 9,
        "type": "Contents page",
        "title": "Our Town: The Contents Page",
        "passage": """Every information book has parts. The cover is on the front. The title is on the cover. The title of this book is Our Town.

Just inside the front is the contents page. It tells you what is in the book, and which page to turn to.

Contents

The shop ....... page 2

The school ....... page 4

The park ....... page 6

The market ....... page 8

Do you want to read about the park? The contents says page 6. So you turn to page 6. You do not read pages 2, 4 and 5 first.

A story book does not need a contents page. You start a story at the beginning and read it all the way to the end.""",
        "outcome": "Use a contents page to find which page to turn to.",
        "objectives": ["1Rs.03", "1Ri.08", "1Rs.04"],
        "selfCheck": "I can use a contents page to find the right page.",
        "questions": [
            ("Where is the title of a book?", "On the cover",
             "The cover is on the front of the book and the title is on the cover.",
             ["On the last page", "Under the contents"]),
            ("Which page tells you about the park?", "Page 6",
             "The contents says The park ....... page 6, so you turn to page 6.",
             ["Page 2", "Page 8"]),
            ("Does a story book need a contents page?", "No",
             "A story book does not need one. You start a story at the beginning and read it all.",
             ["Yes, every book needs one", "Only if it is long"]),
        ],
        "writing": {
            "title": "Writing 7 - Write a contents line",
            "prompt": "You are making a little book about your town. Write the heading Contents. Under it, write two lines. Each line names a place and says which page it is on.",
            "model": "Contents\nThe shop ....... page 2",
            "starter": "Contents",
            "length": "1 heading and 2 contents lines",
            "example": ["Contents", "The park ....... page 2", "The school ....... page 4"],
        },
    },
    {
        "unit": 10,
        "type": "Postcard",
        "title": "A Postcard from Amal",
        "passage": """A postcard is a short letter.

It has a picture on one side. It has your words on the other side.

The picture side shows where you are.

The word side has two parts. Your message is on the left. The address of your friend is on the right.

Hello Samira,

I am at my grandma's house. I am very happy here. We went to the sea and I found five shells. I will show them to you at school.

Goodbye for now,

Amal

A postcard is short because there is not much room. You write only the best bits.""",
        "outcome": "Read a postcard and write a short message of your own.",
        "objectives": ["1Ri.03", "1Wc.04", "1Wc.05"],
        "selfCheck": "I can read a postcard and write a short message of my own.",
        "questions": [
            ("What is a postcard?", "A short letter",
             "A postcard is a short letter with a picture on one side and your words on the other.",
             ["A long story", "A book about a town"]),
            ("How many shells did Amal find?", "Five",
             "Amal's message says she went to the sea and found five shells.",
             ["Three", "Nine"]),
            ("Why is a postcard short?", "There is not much room",
             "A postcard is short because there is not much room, so you write only the best bits.",
             ["Because it is for a baby", "Because it has no picture"]),
        ],
        "writing": {
            "title": "Writing 7 - Write a postcard message",
            "prompt": "Write a short postcard message to a friend. Start with Hello and their name. Write one line about where you are. End with Goodbye for now and your own name.",
            "model": "Hello Samira,\nI am at the sea.\nGoodbye for now,\nAmal",
            "starter": "Hello",
            "length": "3 to 4 short lines",
            "example": ["Hello Leo,", "I am at my grandma's house. I am happy here.",
                        "Goodbye for now,", "Amal"],
        },
    },
]

# ---------------------------------------------------------------------------
# THE CLAIMS TO STRIP.
#
# Each entry is (unit number, outcome suffix, [codes]) -- the mis-claims listed
# in the docstring. They are removed ONLY after the new outcomes above have been
# inserted, and coverage is re-counted afterwards: this tool refuses to leave an
# objective claimed by nobody, which would trade one wrong number for another.
#
# STRIP ONLY WHAT WAS ACTUALLY EVIDENCED. Every entry below is an outcome about
# SPEAKING or naming vocabulary carrying a READING-structure or
# WRITING-presentation objective -- "Say 'I'm cutting ___.'" cannot deliver
# "subheadings, labelled diagrams" under any reading of either.
#
# Two candidates were deliberately NOT stripped, and the reason is the same rule
# from the other side. Unit 10's "Make a six-page picture-and-word book" keeps
# 1Rs.02, 1Rs.04 and 1Wp.05: making a book with pictures and words IS presenting
# text in a different way, and it does engage with how a text is put together.
# Only 1Ri.04 goes, because making one book cannot teach that non-fiction TYPES
# differ from each other. Stripping a defensible claim would be the same
# curriculum assertion as the mis-claim, made in the opposite direction.
#
# An entry that removes nothing FAILS. A strip list that has quietly stopped
# matching is the "green because it did no work" shape this repo keeps paying
# for, and it reads exactly like a clean run.
# ---------------------------------------------------------------------------
STRIP = [
    (1, "lo04", ["1Ri.08", "1Ws.02", "1Wp.05"]),
    (3, "lo03", ["1Ri.08"]),
    (3, "lo04", ["1Ws.02", "1Wp.05"]),
    (4, "lo04", ["1Ws.02"]),
    (5, "lo03", ["1Ri.08"]),
    (5, "lo04", ["1Ws.02"]),
    (6, "lo03", ["1Ri.08"]),
    (6, "lo04", ["1Ws.02"]),
    (7, "lo04", ["1Ws.02"]),
    (7, "lo06", ["1Ri.08", "1Wp.05"]),
    (8, "lo03", ["1Ri.08"]),
    (8, "lo04", ["1Ri.03", "1Ws.02", "1Wp.05"]),
    (9, "lo02", ["1Ri.08"]),
    (9, "lo04", ["1Ws.02", "1Wp.05"]),
    (10, "lo01", ["1Rs.03"]),
    (10, "lo04", ["1Ri.04"]),
    (10, "lo06", ["1Wc.05"]),
]


def paragraphs(script):
    return [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]


def _short(para):
    return len(para.split()) <= 4 and not para.endswith((".", "!", "?"))


def is_heading(paras, i):
    """Is paras[i] a heading -- a short line INTRODUCING the paragraph below it?

    Short and not a sentence is necessary and NOT sufficient, and the difference
    is what stops this crying wolf. A list item and a signature look identical to
    a heading on their own:

        "a red pencil" / "a blue pencil"   the What-you-need list, unit 4
        "Goodbye for now," / "Amal"        the postcard's sign-off, unit 10

    Both were flagged by the first version of this rule, and neither is a defect
    -- nothing of theirs is stranded overleaf, because they carry their whole
    meaning on the line. What separates them from "Tuesday" or "Fact 2" is what
    comes BEFORE: a heading follows a full sentence, while a list item follows
    another list item. So a short line inside a RUN of short lines is a list,
    and only a short line that breaks out of prose is a heading.

    Verified against every case in TEXTS: it catches all six real orphans the
    reader showed (Tuesday, Thursday, Where farm animals sleep, BUS STOP,
    Fact 2/Fact 4, Hello Samira,) and neither false positive.
    """
    if not _short(paras[i]):
        return False
    if i > 0 and _short(paras[i - 1]):
        return False          # inside a run of short lines: a list, not a heading
    return True


def orphaned_headings(script, per_page=4):
    """Headings that would sit LAST on a page, with their content overleaf.

    sentence_pages() in build-lessons.py pages blindly at four paragraphs, so a
    heading can land at the foot of a page while the paragraph it introduces
    starts the next one. The child turns the page and the heading is gone.

    Found by opening the reader and looking, in five of these ten texts at once:
    "Tuesday" alone at the foot of a diary page, "BUS STOP" without its caption,
    "Fact 2" without its fact, and the postcard's "Hello Samira," split from the
    message it greets. Every gate in the repo passed the whole time -- this is a
    property of where the text FALLS, which nothing else here measures.

    Each was fixed by splitting the passage's opening paragraph in two, which
    shifts the whole grid by one. That is why paragraph structure in TEXTS above
    is load-bearing and not just prose style.
    """
    paras = paragraphs(script)
    bad = []
    for i, p in enumerate(paras):
        last_on_page = (i + 1) % per_page == 0
        if last_on_page and i + 1 < len(paras) and is_heading(paras, i):
            bad.append((i + 1, p))
    return bad


ENDS_A_SENTENCE = (".", "!", "?", '"', "”", ":", ";", ",")


def narration_script(passage):
    """What the VOICE should read, where that differs from what the page shows.

    narration() in generate-ehel-english-audio.js collapses every run of
    whitespace to a single space. That is right for a story, whose paragraphs all
    end in a full stop, and wrong for these ten: their lines are headings,
    labels, chart rows and contents entries, and none of them ends in
    punctuation, so the flattened script runs them together.

    Measured on the first recording of these clips (2026-09-16), by transcribing
    what came back:

        page:  door - you come in here / chair - you sit on this / book - ...
        heard: "Door, you come in here, chair. You sit on this book. You read
                this pencil."

    The labels had shifted by one, so a child heard "you sit on this book" -- the
    exact opposite of the lesson, which is that a label names ONE thing. The
    contents page paired the school with page two. The audio contradicted the
    page, and the clips were word-perfect against their script: the script itself
    was the defect.

    Two rules, applied to the SPOKEN copy only:

      - leader dots become a comma. "The shop ....... page 2" is a visual device
        for the eye to travel along; read aloud it wants a pause, not seven dots.
      - a paragraph that does not already end a sentence gains a full stop, so
        the flattening leaves a boundary where the page had a line break.
    """
    out = []
    for para in paragraphs(passage):
        para = re.sub(r"\s*\.{3,}\s*", ", ", para)
        if not para.endswith(ENDS_A_SENTENCE):
            para += "."
        out.append(para)
    return "\n\n".join(out)


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save(path, obj):
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def unit_path(n):
    return os.path.join(UNITS, "unit-%d.json" % n)


def next_seq(items, key):
    best = 0
    for it in items:
        try:
            best = max(best, int(it.get(key) or 0))
        except (TypeError, ValueError):
            pass
    return best + 1


def stage1_codes():
    fw = load(FRAMEWORK)
    by = fw["objectivesByStage"]
    items = by["1"] if isinstance(by, dict) else by[0]
    return {o.get("code") for o in items if o.get("code")}


def claimed_codes():
    """Every Stage 1 code claimed by any Grade 1 outcome, right now on disk."""
    out = {}
    for n in range(1, 11):
        for o in load(unit_path(n)).get("outcomes") or []:
            for code in o.get("cambridgeObjectives") or []:
                out.setdefault(code, []).append((n, o["outcomeId"]))
    return out


def build(spec, unit):
    """The records this unit gains. Pure -- it reads the unit, writes nothing."""
    uid = unit["unit"]["unitId"]                      # eng-g01-t02-u05
    readings = unit["readings"]
    outcomes = unit["outcomes"]
    writing = unit["writing"]
    selfs = unit.get("selfAssessment") or []

    read_id = "%s-read%02d" % (uid, len(readings) + 1)
    out_id = "%s-lo%02d" % (uid, len(outcomes) + 1)
    write_id = "%s-write%02d" % (uid, len(writing) + 1)
    self_id = "%s-self%02d" % (uid, len(selfs) + 1)

    reading = {
        "readingId": read_id,
        "unitId": uid,
        "sequence": next_seq(readings, "sequence"),
        "type": spec["type"],
        "title": spec["title"],
        "genre": spec["type"],
        "theme": "non-fiction text types and their features",
        "setting": "Home, online lesson or Grade 1 classroom",
        "passageScript": spec["passage"],
        # What the page shows and what the voice reads are not the same text
        # here -- see narration_script(). The generator, the transcription audit
        # and the integrity check all prefer this field where a reading sets one.
        "narrationScript": narration_script(spec["passage"]),
        "audioRequired": True,
        # available:false is this course's recorded state for "narration is
        # owed". source_of() returns "" for it, so nothing plays and nothing is
        # billed; --report lists the debt.
        "audio": {
            "provider": "ElevenLabs",
            "available": False,
            "status": "Not recorded - authored 2026-09-16 in a text-only pass",
        },
        "origin": ORIGIN,
        "reviewStatus": REVIEW,
        "sourceFile": SOURCE,
    }

    outcome = {
        "outcomeId": out_id,
        "unitId": uid,
        "sequence": next_seq(outcomes, "sequence"),
        "learningOutcome": spec["outcome"],
        "evidenceOfLearning": ("Observed through reading the non-fiction text aloud or with an "
                               "adult, answering its questions, and one supported written response "
                               "in the same text type."),
        "origin": ORIGIN,
        "reviewStatus": REVIEW,
        "sourceFile": SOURCE,
        "bloomLevel": "Remember and understand",
        "cambridgeObjectives": list(spec["objectives"]),
    }

    comp = []
    for k, (q, a, why, wrong) in enumerate(spec["questions"], start=1):
        comp.append({
            "questionId": "%s-nfq%d" % (uid, k),
            "unitId": uid,
            "readingId": read_id,
            "section": spec["title"],
            "sequence": next_seq(unit["comprehension"], "sequence") + k - 1,
            # "Oral, point or choose" IS the honest label and not a dodge: at
            # Grade 1 the child is read the question and taps an answer. It also
            # has to be one of COMPREHENSION_ORAL_TYPES (english.js), and that
            # is a REAL constraint rather than a formality --
            # check-english-content.mjs fails any Grade 1 comprehension question
            # outside that list, because all 139 of Grade 1's questions are oral
            # and the printed worksheet therefore draws no comprehension section
            # at all. A written type here would put 30 questions with answer
            # lines onto a five-year-old's paper sheet, which is a decision
            # about the paper drawer and nothing to do with text types.
            # The app is unaffected either way: build-lessons.py classifies a
            # question by its ANSWER'S SHAPE (is_factual), never by this field.
            "questionType": "Oral, point or choose",
            "question": q,
            "correctAnswer": a,
            "distractors": list(wrong),
            "explanation": why,
            "marks": 1,
            "outcomeId": out_id,
            "difficulty": "Grade 1 supported",
            "origin": ORIGIN,
            "reviewStatus": REVIEW,
            "sourceFile": SOURCE,
        })

    w = spec["writing"]
    write = {
        "writingId": write_id,
        "unitId": uid,
        "sequence": next_seq(writing, "sequence"),
        "practiceType": "Grade 1 early writing",
        "title": w["title"],
        "promptAndInstructions": w["prompt"],
        "modelText": w["model"],
        "sentenceStarter": w["starter"],
        "expectedLength": w["length"],
        "completedExample": {"items": list(w["example"])},
        "successCriteria": ("I read the text first; I used the same shape as the text; "
                            "I wrote my own words; I read my writing to an adult"),
        "support": ("Adult read-aloud, copying from the text, movable word cards and oral "
                    "rehearsal are allowed."),
        "extension": "Add one more line in the same shape and read the whole thing aloud.",
        "rubricId": "rub-g1-writing-v1",
        "outcomeId": out_id,
        "origin": ORIGIN,
        "reviewStatus": REVIEW,
        "sourceFile": SOURCE,
    }

    check = {
        "selfAssessmentId": self_id,
        "unitId": uid,
        "sequence": next_seq(selfs, "sequence"),
        "statement": spec["selfCheck"],
        "scale": ["Not yet", "With help", "By myself"],
        "outcomeId": out_id,
        "origin": ORIGIN,
        "reviewStatus": REVIEW,
        "sourceFile": SOURCE,
    }

    return reading, outcome, comp, write, check


def main(argv):
    dry = "--dry" in argv
    report = "--report" in argv
    fix_narration = "--fix-narration" in argv
    for a in argv[1:]:
        if a not in ("--dry", "--report", "--fix-narration"):
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    if fix_narration:
        # Bring already-applied units up to date with narration_script(). The
        # ten readings were authored, and recorded, before the field existed.
        changed = 0
        for spec in TEXTS:
            path = unit_path(spec["unit"])
            unit = load(path)
            reading = next((r for r in unit["readings"] if r.get("title") == spec["title"]), None)
            if not reading:
                sys.stderr.write("REFUSED: unit %d has no reading titled %r\n"
                                 % (spec["unit"], spec["title"]))
                return 1
            want = narration_script(reading["passageScript"])
            if reading.get("narrationScript") == want:
                continue
            reading["narrationScript"] = want
            if not dry:
                save(path, unit)
            changed += 1
            print("unit %-2d %s" % (spec["unit"], reading["readingId"]))
        print("\n%d reading(s) %s a narrationScript."
              % (changed, "would gain" if dry else "gained"))
        return 0

    if report:
        owed = []
        for spec in TEXTS:
            unit = load(unit_path(spec["unit"]))
            for r in unit["readings"]:
                a = r.get("audio") or {}
                if a.get("available") is False:
                    owed.append((spec["unit"], r["readingId"], len(r.get("passageScript") or "")))
        total = sum(c for _, _, c in owed)
        print("Narration owed in Grade 1 (audio.available == false):")
        for n, rid, chars in owed:
            print("  unit %-2d  %-28s %5d chars" % (n, rid, chars))
        print("  %d clip(s), %d characters if recorded." % (len(owed), total))
        return 0

    # A heading stranded at the foot of a page is a defect in THIS file's prose,
    # so it is checked before a single unit is opened -- there is no point
    # writing ten units and then discovering the paging is wrong.
    stranded = []
    for spec in TEXTS:
        for pos, para in orphaned_headings(spec["passage"]):
            stranded.append((spec["unit"], pos, para))
    if stranded:
        sys.stderr.write(
            "REFUSED: %d heading(s) would sit last on a page, with the paragraph they "
            "introduce overleaf. Split an earlier paragraph in two to shift the grid.\n"
            % len(stranded))
        for n, pos, para in stranded:
            sys.stderr.write("  unit %-2d paragraph %-3d %r\n" % (n, pos, para))
        return 1

    before = claimed_codes()
    changed = 0
    skipped = 0
    plan = []

    for spec in TEXTS:
        n = spec["unit"]
        path = unit_path(n)
        unit = load(path)
        uid = unit["unit"]["unitId"]

        # --- idempotence: already applied? ---------------------------------
        existing = [r for r in unit["readings"] if r.get("title") == spec["title"]]
        if existing:
            r = existing[0]
            if (r.get("passageScript") or "").strip() != spec["passage"].strip():
                sys.stderr.write(
                    "REFUSED: unit %d already has a reading titled %r and its text differs "
                    "from this tool's. Somebody edited it; resolve by hand.\n" % (n, spec["title"]))
                return 1
            skipped += 1
            continue

        # --- pre-state: refuse anything unexpected -------------------------
        if len(unit["readings"]) != 3:
            sys.stderr.write(
                "REFUSED: unit %d has %d readings, expected the 3 this tool was written "
                "against. Re-read the unit before running this.\n" % (n, len(unit["readings"])))
            return 1
        if any(o["outcomeId"].endswith("-lo07") for o in unit["outcomes"]):
            sys.stderr.write("REFUSED: unit %d already carries an lo07 outcome.\n" % n)
            return 1

        reading, outcome, comp, write, check = build(spec, unit)
        plan.append((n, reading["readingId"], outcome["outcomeId"], len(comp)))

        if not dry:
            unit["readings"].append(reading)
            unit["outcomes"].append(outcome)
            unit["comprehension"].extend(comp)
            unit["writing"].append(write)
            unit.setdefault("selfAssessment", []).append(check)

            # strip the mis-claims belonging to this unit. Each entry MUST
            # remove something: a strip list that has stopped matching passes
            # silently and leaves the wrong claim in place.
            for su, suffix, codes in STRIP:
                if su != n:
                    continue
                target = [o for o in unit["outcomes"] if o["outcomeId"].endswith("-" + suffix)]
                if not target:
                    sys.stderr.write("REFUSED: unit %d has no outcome ending -%s for the strip "
                                     "list.\n" % (n, suffix))
                    return 1
                for o in target:
                    had = o.get("cambridgeObjectives") or []
                    absent = [c for c in codes if c not in had]
                    if absent:
                        sys.stderr.write(
                            "REFUSED: unit %d %s does not claim %s, so this strip entry removes "
                            "nothing. The data moved under the tool.\n"
                            % (n, suffix, ", ".join(absent)))
                        return 1
                    o["cambridgeObjectives"] = [c for c in had if c not in codes]
            save(path, unit)
        changed += 1

    for n, rid, oid, nq in plan:
        print("unit %-2d  + %s (%s)  + %s  + %d questions  + 1 writing  + 1 self-check"
              % (n, rid, next(t["type"] for t in TEXTS if t["unit"] == n), oid, nq))

    if dry:
        print("\n--dry: nothing written. %d unit(s) would change, %d already done."
              % (changed, skipped))
        return 0

    # --- coverage must not fall -------------------------------------------
    after = claimed_codes()
    stage1 = stage1_codes()
    lost = sorted(c for c in stage1 if c in before and c not in after)
    if lost:
        sys.stderr.write("REFUSED (already written): stripping left these objectives claimed by "
                         "nobody: %s\n" % ", ".join(lost))
        return 1
    missing = sorted(c for c in stage1 if c not in after)
    print("\n%d unit(s) changed, %d already done." % (changed, skipped))
    print("Cambridge Stage 1 coverage: %d/%d claimed%s"
          % (len(stage1) - len(missing), len(stage1),
             "" if not missing else " -- MISSING " + ", ".join(missing)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
