# -*- coding: utf-8 -*-
"""Give Grade 1 Unit 10 the Teacher & Parent Guide the other nine units have.

WHY. The Grade 1 validation (areas 16 and 24) found Unit 10 - the capstone,
the unit that closes the year - to be the only one of ten with no
`grownUpGuide`. grade-1-v2 draws the guide behind the grown-up panel of the
Student resources step, so its absence is something a routed learner's
parent meets.

WHAT IT WRITES. The same shape and the same nine headings as Units 1-9 -
About this unit, Using the AI Tutor, Tips, What Your Child Will Be Able to
Do, Words We Will Learn, Songs and Rhymes, How to Teach This Unit Step by
Step, Sentence Patterns, Simple Check - plus the Year 1 send-off Unit 9's
guide carries, which belongs here. Every fact in it is read from Unit 10's
own content: the six outcomes, the six book pages (writing), the six
speaking lines, the activities (treasure hunt, thirty-word sort, mini-book,
rehearsal, showcase), the three readings and the core-word groups. Unit 10
has no song of its own, so that section acts out the unit's Celebration
Dialogue and points back to the year's songs rather than inventing one.

THIS IS AUTHORING, NOT REPAIR. Nothing here was reviewed by a curriculum
reviewer; the unit already carries a re-review flag from the overview
rewrite, and this guide is part of what that review should read.

    python tools/author-english-g1-unit10-grownup-guide.py          # dry run
    python tools/author-english-g1-unit10-grownup-guide.py --write

Idempotent: a second run finds the guide in place and does nothing. A guide
already present that differs from this one is refused, not overwritten.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')
TARGET = os.path.join(UNITS, 'unit-10.json')
SHAPE_FROM = os.path.join(UNITS, 'unit-9.json')   # the key goes where the other units keep it

GUIDE = {
    "intro": (
        "In this unit, your child looks back over the whole of Year 1 and makes something of their "
        "own from it: a six-page picture-and-word book called My First English World. They choose "
        "their favourite work from the year, sort and re-read thirty of the words they know best, "
        "listen to Amal remember her year, make the book one page at a time, practise a one-minute "
        "show-and-tell, and share it on celebration day. Then they name one thing they would love "
        "to learn next. The big idea is that everything they have learned this year is theirs to "
        "show. The goal is warm, confident English — not perfect spelling."
    ),
    "label": "Teacher & Parent Guide",
    "sections": [
        {
            "title": "🧭 About this unit (please read first)",
            "body": (
                "Your child is a beginner, about 5–7 years old, and is just starting to read. So YOU "
                "lead this unit — a teacher in class or a parent at home.\n\n"
                "This is the capstone: the last unit of Year 1, and the only one where your child MAKES "
                "something that lasts. There is no new topic to learn. Everything on the pages comes "
                "from the nine units before it.\n\n"
                "Work in short, happy sessions of about 15–20 minutes over two weeks. The book grows one "
                "page at a time, so a session is one page, or one rehearsal, and that is enough.\n\n"
                "This guide tells you what to do. The Child Activity Sheet is what your child draws and "
                "colours. The Story is one you read aloud. Keep the finished book — it is the record of "
                "your child's first year in English."
            ),
        },
        {
            "title": "💬 Using the AI Tutor with a young child",
            "body": (
                "The grown-up holds the device and reads with the child — do not leave a 5-year-old "
                "alone with it.\n\n"
                "Ask the tutor to be the audience: “Please listen to my child's show-and-tell and say "
                "one kind thing.”\n\n"
                "Ask it to help with a page: “Ask my child what they can do now in English.” or “Please "
                "say the word ‘goodbye’ slowly.”\n\n"
                "Ask it for a sentence pattern if your child is stuck: “Give my child a sentence that "
                "starts ‘I like’.”"
            ),
        },
        {
            "title": "🌟 Tips for teaching absolute beginners",
            "body": (
                "Keep it short and playful. Stop while it is still fun.\n\n"
                "Let your child choose. This unit is about THEIR favourites, so the drawing they pick, "
                "the page they read first and the goal they name should all be their own.\n\n"
                "Repeat the show-and-tell many times. Young children get braver each time they say the "
                "same words.\n\n"
                "Praise every try. Confidence matters more than being correct at this stage."
            ),
        },
        {
            "title": "What Your Child Will Be Able to Do",
            "items": [
                "Choose favourite Grade 1 work.",
                "Use review words in short spoken patterns.",
                "Listen and respond to a familiar story.",
                "Make a six-page picture-and-word book.",
                "Present the book with an adult nearby.",
                "Reflect and name one next English goal.",
            ],
        },
        {
            "title": "Words We Will Learn",
            "items": [
                "Feelings and numbers: happy · sad · three · four · five · eight · nine",
                "Polite words: hello · goodbye · please",
                "Words we see everywhere: into · where · should",
                "Thirty review words from the year, sorted into piles: school · family · animals · town",
            ],
        },
        {
            "title": "Songs and Rhymes",
            "body": (
                "There is no new song in this unit. Sing your child's favourites from the year instead — "
                "the traffic-lights rhyme, “Old MacDonald Had a Farm”, “The Wheels on the Bus” — and let "
                "them choose which.\n\n"
                "“Celebration Dialogue” — act it out together\n\n"
                "Teacher: What is your favourite page? / Learner: I like my family page best. / "
                "Teacher: What can you say about it? / Learner: This is my mum. I love my family. / "
                "Teacher: Well done! What is your next goal for English? / Learner: I will read more "
                "words next year.\n\n"
                "You be the teacher and your child is Amal. Then swap. Then your child answers with their "
                "OWN page and their own goal."
            ),
        },
        {
            "title": "How to Teach This Unit, Step by Step",
            "body": (
                "Repeat this simple shape over several short sessions, one page or one rehearsal at a "
                "time:\n\n"
                "1. Warm-up (2–3 min)\n\n"
                "Greet your child: “Hello! Which page shall we make today?”\n\n"
                "Sing a favourite song from the year.\n\n"
                "2. Look back (5 min)\n\n"
                "Open your child's folder from the year. Hunt for their neatest writing, a picture made "
                "with colours, a word list and one piece of work they found hard. Let them choose three "
                "favourites and say why.\n\n"
                "Spread out thirty word cards and sort them into piles: school, family, animals, town. "
                "Read each card aloud together.\n\n"
                "3. Make a page (5–7 min)\n\n"
                "One page a session. Page 1: draw yourself, write “My name is ___” and your age. Page 2: "
                "one thing you learned, “I can ___”. Page 3: your favourite unit, “I like ___”. Page 4: "
                "a place you know, “This is a ___”. Page 5: today's weather, “It is ___”. Page 6: "
                "yourself in Grade 2, “My next goal is ___”.\n\n"
                "Fold three sheets, staple the middle, add the six pages, and draw a cover with your "
                "child's name on it.\n\n"
                "4. Story time (5 min)\n\n"
                "Read “Amal's English Year” aloud, or listen to it. Point to the things Amal remembers and "
                "ask: “What did you make this year?”\n\n"
                "5. Rehearse (5 min)\n\n"
                "Practise the show-and-tell for one minute. Stand tall, speak slowly, hold the book up. "
                "Start with “My name is ___. I am in Grade 1. This is my English book.” Read two pages. "
                "End with “My next goal is ___. Thank you for listening.”\n\n"
                "6. Celebrate and reflect (5 min)\n\n"
                "On the last day, your child shows the book to the family or the class: greet everyone, "
                "read two pages, say the next goal, say thank you. Then ask: “What would you love to "
                "learn next?” Write it on page 6 if it is not there yet. Say “Well done!” and one thing "
                "they did well."
            ),
        },
        {
            "title": "Sentence Patterns to Say Out Loud",
            "body": "Speaking comes before writing. Practise these spoken patterns often — they are the whole year in six lines:",
            "items": [
                "“My name is ______.” “I am in Grade 1.”",
                "“I can ______.” (read ten words, count to twenty, write my name)",
                "“I like ______.” (this page, the farm animals, reading with my father)",
                "“This is a / an ______.” (bus, shop, duck)",
                "“It is ______.” (big, blue and round, my favourite)",
                "“My next goal is ______.” “Thank you for listening.”",
            ],
        },
        {
            "title": "Simple Check — What to Look For",
            "body": "You do not need a test. Just watch and tick when your child can do these:",
            "items": [
                "Chooses three favourite pieces of work and says why.",
                "Reads some of the thirty review words and sorts them into piles.",
                "Makes all six pages, each with a drawing, a label and a pattern sentence.",
                "Says the one-minute show-and-tell holding the book up: name, one page, next goal.",
                "Names one thing they would love to learn next.",
            ],
        },
        {
            "title": "🎉 Well done — your child has finished Year 1!",
            "body": (
                "This is the end of Year 1, and the book in your child's hands is the proof. They started "
                "as a brand-new beginner and can now say their name, name the things around them, count, "
                "describe, read some words on their own, and tell you what they like.\n\n"
                "Keep the book. Read it together now and then. Next year it will show your child how far "
                "they have come.\n\n"
                "In Year 2, your child will build on all of this — reading a little more, writing a little "
                "more, and speaking with more confidence. They are ready!\n\n"
                "From all of us at Ehel Academy: well done to your child, and well done to YOU for "
                "teaching with love. 🌟"
            ),
        },
    ],
}


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    raw = io.open(TARGET, encoding='utf-8').read()
    doc = json.loads(raw)
    if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
        sys.exit('REFUSED: unit-10.json does not round-trip through this writer.')

    present = doc.get('grownUpGuide')
    if present == GUIDE:
        print('\n  Unit 10 grown-up guide: already in place - nothing to do.\n')
        return
    if present:
        sys.exit('REFUSED: unit-10.json already carries a different grownUpGuide; not overwriting it.')

    # Put the key where the other units keep it, so the file reads like theirs.
    shape = json.loads(io.open(SHAPE_FROM, encoding='utf-8').read())
    keys = list(shape.keys())
    before = keys[keys.index('grownUpGuide') - 1]
    out = {}
    for k, v in doc.items():
        out[k] = v
        if k == before:
            out['grownUpGuide'] = GUIDE
    if 'grownUpGuide' not in out:
        out['grownUpGuide'] = GUIDE

    words = sum(len((s.get('body') or '').split()) + sum(len(i.split()) for i in s.get('items', []))
                for s in GUIDE['sections']) + len(GUIDE['intro'].split())
    print('\n  Unit 10 grown-up guide  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    sections : %d   (%d with lists)' % (len(GUIDE['sections']), sum(1 for s in GUIDE['sections'] if s.get('items'))))
    print('    words    : %d' % words)
    print('    placed after key: %s' % before)
    if write:
        io.open(TARGET, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(out, ensure_ascii=False, indent=2) + '\n')
    print('')


if __name__ == '__main__':
    main()
