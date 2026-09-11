# -*- coding: utf-8 -*-
"""Author the teaching the Grade 3 build found missing (docs/english-g3-
objective-gaps.md), then claim the nineteen Stage 3 objectives it delivers.

WHAT WAS MISSING. Grade 3 claimed 83 of the 102 Stage 3 objectives, and the
gap document searched every learner-facing section for the other nineteen:
not one was taught. What the search found was metadata ("genre":
"Information text"), a word in passing ("What about prepositions?" asked
Amal) or a character nodding. Grade 4 closed the same kind of gap on
2026-09-11 with tools/author-english-g4-stage4-gaps.py; this is that tool's
shape with Grade 3's content.

WHAT THIS ADDS, in shapes the app renders - the "How English works" step shows
every rule, and the two task steps ("taskSteps", on in Grade 3) show every
writing and speaking task:

  story questions   theme across two texts (Unit 5); predict an ending from
                    other stories (Unit 6); two retellings of one story
                    (Unit 9); how a text is organised (Unit 10)
  rules             prepositions, and finding your way round a book (Unit 2);
                    the j and k sounds (Unit 4); exclamation marks (Unit 5);
                    letters that do not say what you expect (Unit 6); to, two,
                    too and right, write (Unit 8); kinds of text (Unit 10)
  writing tasks     a blurb and a review (Unit 2); a spelling log, and a best
                    handwriting page (Unit 10)
  speaking tasks    saying it without words (Unit 1); choosing a book by its
                    blurb (Unit 2); reading in different voices (Unit 4)

Every question is answerable from the text as written and is placed FIRST
among its reading's questions; each unit touched has five readings, so the
story step's first round - one question per reading - reaches it. Every new
item carries an answer-key row; rules and tasks carry an audio descriptor
marked unavailable, so the app speaks their text. Every line quoted from a
unit text was checked against it.

THIS IS AUTHORING. Every new item is flagged "Needs curriculum review" and the
outcomes whose mapping widens move to a re-review flag. Nothing here was read
by a reviewer.

    python tools/author-english-g3-stage3-gaps.py          # dry run
    python tools/author-english-g3-stage3-gaps.py --write

Idempotent: an item whose title or question is already present is left alone;
a code already claimed is not claimed twice.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-3', 'data', 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')
ORIGIN = 'Ehel authoring 2026-09-11 (Stage 3 gaps: theme, prediction, retellings, text organisation, text types, book skills, prepositions, exclamation marks, grapheme sounds, consonant spellings, homophones, spelling log, handwriting, non-verbal communication, reading voices)'
SOURCE = "Authored from the unit's own readings"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-11)'
MAP_FLAG = 'Needs re-review (Cambridge mapping extended with the objectives the unit now teaches, 2026-09-11)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-11; the app speaks the text. Record with the generator when the content is approved.'}

# ------------------------------------------------------------------ content
# Questions: unit -> (readingId suffix, question, answer, explanation)
QUESTIONS = {
    5: [('read05', '‘Helping Hands’ and ‘The Wall Behind the Garden’ share one big idea, a theme. What is it?',
         'Helping each other: Nora helps Omar, and the whole class builds the wall together.',
         'A theme is the big idea under a text. Nora offers to carry Omar’s heavy basket; the class holds the frame in the wind and finishes the wall together, and Amal writes “We offered help.” Both texts are about helping others.')],
    6: [('read05', 'Stories about a lonely new pupil often end with a new friend. Before the end, which clues help you predict who Amal will name?',
         'Amal watched Nora help the girl with the bag and the boy who fell.',
         'Stories about a new child who feels alone usually end in a friendship. This one shows Amal noticing Nora’s kindness again and again - the fallen bag, the boy who tripped - so a reader can predict that she will name Nora before she points at her.')],
    9: [('read01', '‘The Box of Ideas at School’ and ‘The Box of Ideas’ tell the same events. Who tells each one, and who gives Sami advice?',
         'A classmate tells the first and gives the advice; a narrator tells the second, and there Amal gives it.',
         'In the recount the writer says “‘Imagine something better,’ I told him”, and Amal is someone else in the room. In the story a narrator describes everyone, and Amal says “Imagine something better.” The retellings also differ on Sami’s idea: the cliffs and fishing boats in one, waving at his grandfather in the other.')],
    10: [('read02', 'How is ‘The Year 3 Showcase: Project Brief’ organised so that it is easy to follow?',
          'In four numbered parts, each with a short heading and paragraph, done in order.',
          'The brief says it “has four parts, and you complete them in order”, and each part starts with its own label - Part 1: Choose your pages - before a short paragraph. Numbered parts let a reader find their place and see what comes next.')],
}

# Rules for the "How English works" step: unit -> list of dicts
GRAMMAR = {
    2: [dict(
        title='Prepositions: Where, When and Which Way',
        practiceType='Guided application',
        explanation='A preposition is a small word that links one thing to another. Many tell us WHERE something is (in, on, under, beside). Some tell us WHEN (at, on, in, after). Some tell us WHICH WAY or WHO WITH (to, from, across, with). The Grammar Champions taught in, on and under - there are many more.',
        ruleAndExamples='Where: “The teacher’s pen is on the desk.” “The bag is under the table.” “Adam reads in the library.”\nWhen: “The contest is on Friday.” “We have lunch at 1 o’clock.” “We played after the contest.”\nWhich way or who with: “Amal walked to the library with Nora.” “Daniel’s notes came from his sister’s class.”',
        commonMistake='Using the wrong small word for a time: “in Friday” or “on June”. Use on for days (on Friday), in for months (in June) and at for clock times (at 8 o’clock).',
        memoryTip='Picture a box: a ball can be IN it, ON it, UNDER it or BESIDE it. For time, go from small to big: AT a time, ON a day, IN a month.',
        practice='Write in, on, under, at or to in each gap. | 1. The eraser is ______ my pencil case. | 2. The contest is ______ Friday. | 3. The bag is ______ the table. | 4. We have break ______ 10 o’clock. | 5. Adam walks ______ the library. | Check yourself: 1. in 2. on 3. under 4. at 5. to',
        outcome='lo01', key=None),
        dict(
        title='Finding Your Way Round a Book',
        practiceType='Guided recognition',
        explanation='Fiction is a made-up story, like Maya’s book about a clever camel. Non-fiction gives real information, like the grammar book the Grammar Champions used. A library keeps them apart: fiction is shelved in order of the author’s last name, and non-fiction by its subject, with a number on the spine. Inside a non-fiction book, the contents page at the front lists the chapters in page order, and the index at the back lists topics in alphabetical order with their page numbers.',
        ruleAndExamples='Fiction or non-fiction? “A story about a clever camel” is fiction. “A grammar book that explains prepositions” is non-fiction.\nIn the library: fiction by the author’s last name, A to Z; non-fiction by subject and number.\nContents, at the front: chapters in page order - “Chapter 2: Prepositions, page 14”.\nIndex, at the back: topics A to Z - “prepositions 14, 22” means pages 14 and 22.',
        commonMistake='Reading a non-fiction book from page one to find one fact. Go to the index, find the word in alphabetical order, and turn straight to its page.',
        memoryTip='Contents at the front, Index at the end - C comes before I, just as the contents comes before the index.',
        practice='Use this index from a grammar book to answer. | Index: adjectives 8, 30 · full stops 4 · past tense 18, 19 · possessive ’s 25 · prepositions 14, 22 · questions 11 | 1. Which pages tell you about prepositions? | 2. Where would you read about the possessive ’s? | 3. Which topic is on page 4? | 4. Is this book fiction or non-fiction? | Check yourself: 1. pages 14 and 22 2. page 25 3. full stops 4. non-fiction',
        outcome='lo07', key=None)],
    4: [dict(
        title='Spelling the j and k Sounds',
        practiceType='Guided recognition',
        explanation='The sound at the start of jar has three common spellings: j (jar, June), g before e, i or y (giraffe, gentle, village, college), and dge straight after a short vowel sound (bridge, judge). The sound at the start of cat has three too: c (cat, court, college), k before e or i (kitten, kind, market), and ck straight after a short vowel sound (brick, clock, sticks).',
        ruleAndExamples='j sound: j - jar, job, June\ng before e, i or y - giraffe, gentle, village, college\ndge after a short vowel - bridge, judge, badge\nk sound: c - cat, court, college\nk before e or i - kitten, kind, market\nck after a short vowel - brick, clock, sticks',
        commonMistake='Writing j where the word uses g: “jentle”, “villaj”. At the end of a word the j sound is hardly ever spelt j - it is ge (village, age) or dge (bridge, judge).',
        memoryTip='A short vowel sound needs a strong guard: dge or ck (ba-dge, bri-ck). A long vowel sound, or another consonant, takes ge or k (age, park).',
        practice='Choose the right spelling. | 1. The (juj / judge) sat in the big chair. | 2. Goats walk through the (village / villaj). | 3. A (kitten / citten) is a baby cat. | 4. We built a wall of (briks / bricks). | 5. Older students study at the (college / kollege). | Check yourself: 1. judge 2. village 3. kitten 4. bricks 5. college',
        outcome='lo01', key=None)],
    5: [dict(
        title='Exclamation Marks',
        practiceType='Guided recognition',
        explanation='An exclamation mark (!) ends a sentence said with strong feeling: surprise, excitement, thanks, a warning or a loud order. It tells the reader to read that sentence with more force. A question keeps its question mark, even when it is excited.',
        ruleAndExamples='A loud order or a warning: “Hold the frame!” shouted Teacher Yasmin.\nStrong feeling: “We do not want goats in our classroom!”\nExcitement or thanks: “Finally, we will celebrate when the first flower grows!” “Thank you! You have a kind heart.”\nA question keeps its question mark: “What happened here?” asked Leo.',
        commonMistake='Putting an exclamation mark on every sentence, or several in a row (!!!). Use one, and only where the feeling is strong - too many and none of them stand out.',
        memoryTip='An exclamation mark looks like a raised finger over a dot. It says: read this one with feeling.',
        practice='End each sentence with a full stop, a question mark or an exclamation mark. | 1. Watch out, the wall is falling___ | 2. Where is the old fence___ | 3. We planted beans in the garden___ | 4. Hooray, we finished the wall___ | 5. Why did the visitor call it a gift___ | Check yourself: 1. ! 2. ? 3. . 4. ! 5. ?',
        outcome='lo05', key=None)],
    6: [dict(
        title='Same Letters, Different Sounds',
        practiceType='Guided recognition',
        explanation='Some letters are not said the way you first expect. The letter o says u in love, mother and brother, and oo in move and do. The letters ou say ow in loud and out, u in young and cousin, and a short oo in could, would and should - where the l is silent too.',
        ruleAndExamples='o saying u: love, mother, brother, some\no saying oo: move, do, lose\nou saying ow: loud, out, found\nou saying u: young, touch, cousin\nou saying a short oo, with a silent l: could, would, should',
        commonMistake='Reading could to rhyme with loud, or move to rhyme with stove. When a word looks strange, try the other sound its letters can make, and check that you get a word you know.',
        memoryTip='Young cousins touch. Could, would and should are one family - learn them together, silent l and all.',
        practice='Sort these words by the sound their o or ou makes: love, move, loud, young, could, brother, cousin, out, should, do. | u, as in sun: ______ | oo, as in moon: ______ | ow, as in cow: ______ | short oo, as in book: ______ | Check yourself: u: love, young, brother, cousin; oo: move, do; ow: loud, out; short oo: could, should',
        outcome='lo05', key=None)],
    8: [dict(
        title='To, Two, Too and Right, Write',
        practiceType='Guided recognition',
        explanation='Homophones sound the same but are spelt differently and mean different things. To shows where or what comes next (walk to the window, time to measure). Two is the number 2. Too means also, or more than you want (too small). Right means correct, or the opposite of left; write is what you do with a pencil.',
        ruleAndExamples='to: “Walk to the window.” “It is time to measure.”\ntwo: “This shell is 2 metres from the bowl” - two metres.\ntoo: “It is too small.” “I want to count, too.”\nright: “Can you find the right pattern?”\nwrite: “Write a report using these words.”',
        commonMistake='Writing to when you mean too: “It is to heavy.” If you could say very or also in its place, you need too. A spell-checker will not catch this, because to, two and too are all real words.',
        memoryTip='Too has one o too many. Two belongs with twin and twelve - all about numbers. Write has a silent w, like wrap and wrong.',
        practice='Write to, two, too, right or write in each gap. | 1. There are ______ rulers on the table. | 2. This shell is ______ small to measure. | 3. Walk ______ the door and count your steps. | 4. ______ each number next to its unit. | 5. Amal’s team found the ______ answer. | Check yourself: 1. two 2. too 3. to 4. Write 5. right',
        outcome='lo01', key=None)],
    10: [dict(
        title='Kinds of Text',
        practiceType='Guided recognition',
        explanation='Fiction is made up: a story with characters, a setting, a problem and an ending. Fiction comes in genres - a school story, an adventure, a mystery, a fable - and each has its own clues, such as a puzzle to solve in a mystery or talking animals in a fable. Non-fiction gives information, and each type has its own job and its own features: an information text gives facts, instructions tell you how to do something in order, a recount tells what happened in time order, and a report describes something using facts.',
        ruleAndExamples='School story: ‘Amal’s Year of Words’ - characters (Amal, Nora), a setting (the classroom), events in order.\nMystery: ‘The Mystery of the Million Shells’ - a puzzle, and a clue on the board.\nInstructions: ‘The Year 3 Showcase: Project Brief’ - numbered parts and bossy verbs (Pick, Write, Hand in).\nRecount: ‘A Busy Saturday’ - a day told in order with First, Then and Finally.\nInformation text: ‘Our Community’ - facts about the places in a community.\nPoem: ‘Nine Doors’ - lines and verses, with rhyme.',
        commonMistake='Deciding a text is fiction because it has people in it. ‘A Busy Saturday’ has a family in it, but it is written as an account of what happened, in order - a recount. Ask what the text is FOR.',
        memoryTip='Ask two questions of every text: Is it made up, or is it giving me information? What is it for - to tell a story, to give facts, to tell me how, or to tell what happened?',
        practice='Is each text fiction or non-fiction? Then name its type. | 1. The Grammar Champions | 2. The Measuring Challenge | 3. Our Wonderful Nature | 4. The Wall Behind the Garden | 5. A Busy Saturday | Check yourself: 1. fiction, a school story 2. non-fiction, spoken instructions 3. non-fiction, an information text 4. fiction, a story 5. non-fiction, a recount',
        outcome='lo02', key=None)],
}

# Writing tasks: unit -> list of dicts
WRITING = {
    2: [dict(
        title='Writing 7: A Blurb and a Review',
        promptAndInstructions='A blurb on the back of a book tells a reader just enough to want to read it, without giving away the ending. A review tells other readers what you thought of a book, and whether they should choose it.\nChoose a story you have read this year, such as ‘The Grammar Champions’.\nWrite a blurb of three sentences: who the story is about and their problem, a question that makes the reader curious, and an invitation to read it.\nThen write a review of three sentences: what you liked, one thing you did not like, and who should read it.',
        modelText='Blurb: Amal and her friends have until Friday to get ready for the grammar contest. Can three friends and one grammar book beat every other group? Read ‘The Grammar Champions’ to find out.\nReview: I liked the part where Daniel draws a funny cartoon on the board. I wanted to see the other groups’ lessons too. Anyone who likes school stories should choose this book.',
        sentenceStarter='This story is about',
        expectedLength='6 sentences: a 3-sentence blurb and a 3-sentence review',
        completedExample={'items': [
            'Blurb 1 (who, and their problem): Amal and her friends have until Friday to get ready for the grammar contest.',
            'Blurb 2 (a question): Can three friends and one grammar book beat every other group?',
            'Blurb 3 (the invitation): Read ‘The Grammar Champions’ to find out.',
            'Review 1 (what I liked): I liked the funny cartoon Daniel draws on the board.',
            'Review 2 (what I did not like): I wanted to see the other groups’ lessons too.',
            'Review 3 (who should read it): Anyone who likes school stories should choose this book.']},
        successCriteria='My blurb says who the story is about and their problem; it ends with a question or an invitation; it does not give away the ending; my review gives one thing I liked, one I did not, and who should read it.',
        support='Look at the back cover of any book at home or in the library, and copy how its blurb begins.',
        extension='Swap blurbs with a partner. Would you choose their book? Say why, using because.',
        outcome='lo02')],
    10: [dict(
        title='Writing 7: My Spelling Log',
        promptAndInstructions='Start a spelling log: a page that keeps the words you get wrong until you get them right.\nRule three columns: My spelling | Correct spelling | How I will remember it.\nLook through your booklet drafts and find five words you spelt wrongly - the way Nora once spelt million.\nCheck each word with a tool: a paper dictionary (find the first letters in alphabetical order), your unit’s word list, or the red line a screen draws under a misspelt word. A screen will not warn you about to, two and too: all three are real words.\nWrite a way to remember each word, then test yourself on all five at the end of the week.',
        modelText='My spelling | Correct spelling | How I will remember it\nmilion | million | two l’s, like the two ones in 11\ntemprature | temperature | say every part: tem-per-a-ture\nbeacause | because | Big Elephants Can Always Understand Small Elephants\nfreind | friend | a friend to the end\nlibary | library | say the r: li-brar-y',
        sentenceStarter='The word I spelt wrongly was',
        expectedLength='5 words in a three-column log',
        completedExample={'items': [
            'Row 1: milion - million - two l’s, like the two ones in 11.',
            'Row 2: temprature - temperature - say every part: tem-per-a-ture.',
            'Row 3: beacause - because - Big Elephants Can Always Understand Small Elephants.',
            'Checked with: a paper dictionary for rows 1 and 2, the unit word list for row 3.',
            'Friday test: 5 out of 5.']},
        successCriteria='I found five words I really got wrong; I checked each one with a dictionary, a word list or a spell-checker; every word has a way to remember it; I tested myself at the end of the week.',
        support='Ask a partner or a grown-up to read your draft with you and point to any word that looks wrong.',
        extension='Keep the log going into Grade 4. Circle any word you get wrong twice - that one needs learning, not just fixing.',
        outcome='lo04'),
        dict(
        title='Writing 8: My Best Handwriting Page',
        promptAndInstructions='Copy one paragraph from your booklet in your best joined handwriting, for the page visitors will read first.\nSit up straight, hold the pencil lightly, and keep the paper steady with your other hand.\nKeep the small letters the same size on the line; let the tall letters (b, d, h, k, l, t) reach up and the tail letters (g, j, p, q, y) hang down.\nLeave a finger space between words.\nThen write the paragraph once more, a little faster, and check that it is still easy to read.',
        modelText='In January I could hardly write one paragraph. Now I write a whole page, and I read it aloud before I hand it in.',
        sentenceStarter='In January I',
        expectedLength='one paragraph, copied twice',
        completedExample={'items': [
            'Copy 1 (slow and careful): every letter joined, the small letters all the same height.',
            'Copy 2 (a little faster): still easy to read, with the finger spaces kept.',
            'Check: a partner reads every word without having to ask.']},
        successCriteria='The small letters are the same size and sit on the line; tall letters reach up and tail letters hang down; there is a space between words; my faster copy is still easy to read.',
        support='Trace the joins on the handwriting sheet in Student resources before you start.',
        extension='Time your faster copy, then try to beat it next week without losing any neatness.',
        outcome='lo04')],
}

# Speaking tasks: unit -> list of dicts
SPEAKING = {
    1: [dict(
        title='Speaking 7: Say It Without Words',
        activityType='Guided speaking',
        instructionsAndModelLines='We say a lot without words. In ‘Amal’s Big Day’, Teacher Yasmin claps her hands to start the play, Amal steps forward with her chin up, and Teacher Yasmin nods when Amal gives a good answer.\nWith a partner, take turns to show each of these WITHOUT speaking, while your partner guesses what you mean:\nHello - wave and smile.\nI want to speak - raise your hand.\nYes, I agree - nod.\nPlease be quiet - put a finger to your lips.\nI am listening - look at the speaker and turn towards them.\nI feel brave - stand tall with your chin up.\nThen say which of them you would use in a public place, like the market or the classroom, and why.',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, describe one gesture from the list to the tutor and ask it to guess what you meant.',
        outcome='lo07',
        key='Listen for each meaning shown without words and guessed correctly by the partner, and for one sensible reason why a gesture suits a public place (for example, raising a hand instead of shouting). Four of six shown clearly is a pass.')],
    2: [dict(
        title='Speaking 7: Choose a Book by Its Blurb',
        activityType='Guided speaking',
        instructionsAndModelLines='In ‘In the Classroom’, Maya and Daniel talk about the books they read. Here are two blurbs, each with a short review. Read them aloud, choose the book you would read first, and tell a partner why, using because.\nBook 1: The Clever Camel. Blurb: Kamal the camel is the slowest in the caravan, but he is the only one who knows the way to water. When a sandstorm hides the path, will the others trust him? Review: “Very funny, and I cheered at the end.” - Maya\nBook 2: The Girl Who Wanted to Graduate. Blurb: Zara wants to be a scientist, but her village has no school after Grade 6. What will she do to keep learning? Review: “It made me want to study harder.” - Daniel\nSay: I would choose ___ first, because ___.\nThen say one thing the blurb told you, and one thing it kept secret.',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, read one blurb to the tutor and ask it which questions the blurb leaves unanswered.',
        outcome='lo02',
        key='Any choice is right if the reason comes from the blurb or the review (“because I like funny stories”, “because I want to know what Zara does”). Listen for because, one thing the blurb tells, and one thing it keeps secret, such as how the story ends.')],
    4: [dict(
        title='Speaking 7: Read It in Different Voices',
        activityType='Guided speaking',
        instructionsAndModelLines='Read part of ‘From Our Village to the County’ aloud, and give each speaker a voice of their own so that a listener can tell who is talking.\nThe narrator: steady and clear, like a storyteller.\nThe nurse: warm and welcoming.\nOfficer Rami: firm and a little lower, because he is giving orders.\nSami: quick and curious.\nGrandma Hana: slow and gentle.\nRead these lines, changing your voice for each speaker:\nThe nurse smiled. “Doctor Sarah works here. She helps people who are sick.”\nOfficer Rami met them inside. “Sit quietly on the wooden benches,” he said.\n“What is a college?” asked Sami.\nGrandma Hana nodded gently. “Yes. But never forget your village roots.”\nRecord yourself and listen back: can you hear four different speakers and the narrator?',
        recordingRequired=True,
        aiTutorPrompt='With an adult present, tell the tutor which voice was hardest to do, and ask it for one tip to make two of the characters sound different.',
        outcome='lo03',
        key='Listen for a change of voice at each new speaker - speed, loudness or pitch - and a steady narrator between them. Three speakers who sound clearly different is a pass; all four is strong.')],
}

# Which outcome carries which new claim: unit -> {outcome suffix: [codes]}
CLAIMS = {
    1: {'lo07': ['3SLm.04']},
    2: {'lo01': ['3Rg.09', '3Wg.08'], 'lo07': ['3Ri.01', '3Ri.15'], 'lo02': ['3Ra.04']},
    4: {'lo01': ['3Ww.01'], 'lo03': ['3SLp.02']},
    5: {'lo05': ['3Rg.02'], 'lo07': ['3Ri.17']},
    6: {'lo05': ['3Rw.01'], 'lo02': ['3Ri.11']},
    8: {'lo01': ['3Ww.04']},
    9: {'lo06': ['3Ra.05']},
    10: {'lo02': ['3Ri.01', '3Ri.03', '3Ri.05', '3Rs.03'], 'lo04': ['3Ww.06', '3Wp.01']},
}
# the outcome each unit's new QUESTIONS hang off
Q_ANCHOR = {5: 'lo07', 6: 'lo02', 9: 'lo06', 10: 'lo02'}
STAGE = '3'


def sub(c):
    return c[1:c.index('.')]


def strand(c):
    return 'SL' if sub(c).startswith('SL') else sub(c)[0]


def place(cs, c, order):
    same = [i for i, x in enumerate(cs) if sub(x) == sub(c)]
    if same:
        group = sorted([cs[i] for i in same] + [c], key=lambda x: order[x])
        return cs[:same[0]] + group + cs[same[-1] + 1:]
    kin = [i for i, x in enumerate(cs) if strand(x) == strand(c)]
    at = kin[-1] + 1 if kin else len(cs)
    return cs[:at] + [c] + cs[at:]


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    fw = json.load(io.open(FRAMEWORK, encoding='utf-8'))
    stage = [o['code'] for o in fw['objectivesByStage'][STAGE]]
    order = {c: i for i, c in enumerate(stage)}
    for m in CLAIMS.values():
        for codes in m.values():
            for c in codes:
                if c not in order:
                    sys.exit('REFUSED: %s is not a Stage %s objective' % (c, STAGE))

    docs = {}
    for n in range(1, 11):
        p = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(p, encoding='utf-8').read()
        docs[n] = json.loads(raw)
        if json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

    def claimed():
        s = set()
        for d in docs.values():
            for o in d['outcomes']:
                s.update(o.get('cambridgeObjectives') or [])
        return s & set(stage)

    before = claimed()
    added = {'questions': 0, 'grammar': 0, 'writing': 0, 'speaking': 0, 'keys': 0, 'codes': 0, 'flags': 0}
    changed = set()

    for n in sorted(set(QUESTIONS) | set(GRAMMAR) | set(WRITING) | set(SPEAKING) | set(CLAIMS)):
        d = docs[n]
        uid = d['unit']['unitId']
        outcome_ids = {o['outcomeId'] for o in d['outcomes']}

        def outcome_id(suffix):
            oid = '%s-%s' % (uid, suffix)
            if oid not in outcome_ids:
                sys.exit('REFUSED: unit-%d.json has no outcome %s' % (n, suffix))
            return oid

        answer_numbers = [int(a['answerId'].rsplit('-', 1)[1]) for a in d['answerKey'] if a['answerId'].rsplit('-', 1)[1].isdigit()]
        next_answer = [max(answer_numbers) if answer_numbers else 0]

        def key_row(content_id, content_type, text):
            next_answer[0] += 1
            aid = '%s-answer-%03d' % (uid, next_answer[0])
            while any(a['answerId'] == aid for a in d['answerKey']):
                next_answer[0] += 1
                aid = '%s-answer-%03d' % (uid, next_answer[0])
            d['answerKey'].append({'answerId': aid, 'unitId': uid, 'contentId': content_id,
                                   'contentType': content_type, 'answerOrGuidance': text,
                                   'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE})
            added['keys'] += 1

        # story questions, FIRST among their reading's questions
        have_q = {c['question'] for c in d['comprehension']}
        next_id = max(int(c['questionId'].rsplit('cq', 1)[1]) for c in d['comprehension'])
        inserted = 0
        for rsuf, q, a, why in QUESTIONS.get(n, []):
            if q in have_q:
                continue
            r = next(x for x in d['readings'] if x['readingId'].endswith(rsuf))
            sibling = next((c for c in d['comprehension'] if c['readingId'] == r['readingId']), None)
            next_id += 1
            qid = '%s-cq%03d' % (uid, next_id)
            item = {'questionId': qid, 'unitId': uid, 'readingId': r['readingId'],
                    'section': sibling['section'] if sibling else 'Reading and listening',
                    'sequence': 0, 'questionType': 'Evidence and inference', 'question': q,
                    'correctAnswer': a, 'explanation': why, 'marks': 1,
                    'outcomeId': outcome_id(Q_ANCHOR[n]), 'difficulty': 'Core',
                    'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE}
            first = next((i for i, c in enumerate(d['comprehension'])
                          if c['readingId'] == r['readingId'] and c.get('origin') != ORIGIN), len(d['comprehension']))
            d['comprehension'].insert(first, item)
            key_row(qid, 'Comprehension', 'Answer: %s %s Accept the idea in the learner\'s own words.' % (a, why))
            added['questions'] += 1
            inserted += 1
            changed.add(n)
        if inserted:
            for i, c in enumerate(d['comprehension']):
                c['sequence'] = i + 1

        # rules
        have_gram = {g['title'] for g in d['grammar']}
        for g in GRAMMAR.get(n, []):
            if g['title'] in have_gram:
                continue
            gseq = max(x['sequence'] for x in d['grammar']) + 1
            gid = '%s-grammar%02d' % (uid, gseq)
            slug = ''.join(ch if ch.isalnum() else '-' for ch in g['title'].lower()).strip('-')
            while '--' in slug:
                slug = slug.replace('--', '-')
            d['grammar'].append({
                'grammarId': gid, 'conceptId': '%s-concept-%s' % (gid, slug), 'unitId': uid, 'sequence': gseq,
                'practiceType': g['practiceType'], 'title': g['title'], 'explanation': g['explanation'],
                'ruleAndExamples': g['ruleAndExamples'], 'commonMistake': g['commonMistake'],
                'memoryTip': g['memoryTip'], 'practice': g['practice'],
                'outcomeId': outcome_id(g['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG,
                'sourceFile': SOURCE, 'audio': dict(NO_CLIP), 'practiceAudio': dict(NO_CLIP)})
            key_row(gid, 'Language practice',
                    'The practice line carries its own key after "Check yourself". Watch for: %s' % g['commonMistake'])
            added['grammar'] += 1
            changed.add(n)

        # writing
        have_w = {w['title'] for w in d['writing']}
        for w in WRITING.get(n, []):
            if w['title'] in have_w:
                continue
            wseq = max(x['sequence'] for x in d['writing']) + 1
            wid = '%s-write%02d' % (uid, wseq)
            d['writing'].append({
                'writingId': wid, 'unitId': uid, 'sequence': wseq, 'title': w['title'],
                'outcomeId': outcome_id(w['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE,
                'promptAndInstructions': w['promptAndInstructions'], 'modelText': w['modelText'],
                'sentenceStarter': w['sentenceStarter'], 'expectedLength': w['expectedLength'],
                'completedExample': w['completedExample'], 'successCriteria': w['successCriteria'],
                'support': w['support'], 'extension': w['extension'], 'rubricId': 'rub-writing-v1',
                'audio': dict(NO_CLIP)})
            key_row(wid, 'Writing', 'Mark against the success criteria: %s Model: %s' % (w['successCriteria'], w['modelText'].replace('\n', ' / ')))
            added['writing'] += 1
            changed.add(n)

        # speaking
        have_s = {s['title'] for s in d['speaking']}
        for s in SPEAKING.get(n, []):
            if s['title'] in have_s:
                continue
            sseq = max(x['sequence'] for x in d['speaking']) + 1
            sid = '%s-speak%02d' % (uid, sseq)
            d['speaking'].append({
                'speakingId': sid, 'unitId': uid, 'sequence': sseq, 'title': s['title'],
                'outcomeId': outcome_id(s['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE,
                'activityType': s['activityType'], 'instructionsAndModelLines': s['instructionsAndModelLines'],
                'recordingRequired': s['recordingRequired'], 'aiTutorPrompt': s['aiTutorPrompt'],
                'audio': dict(NO_CLIP)})
            key_row(sid, 'Speaking', s['key'])
            added['speaking'] += 1
            changed.add(n)

        # claims
        for suffix, codes in CLAIMS.get(n, {}).items():
            oid = outcome_id(suffix)
            o = next(o for o in d['outcomes'] if o['outcomeId'] == oid)
            cs = list(o.get('cambridgeObjectives') or [])
            new = [c for c in codes if c not in cs]
            if not new:
                continue
            for c in new:
                cs = place(cs, c, order)
            o['cambridgeObjectives'] = cs
            added['codes'] += len(new)
            if o.get('reviewStatus') != MAP_FLAG:
                o['reviewStatus'] = MAP_FLAG
                added['flags'] += 1
            changed.add(n)

    after = claimed()
    if write:
        for n in sorted(changed):
            io.open(os.path.join(UNITS, 'unit-%d.json' % n), 'w', encoding='utf-8', newline='\n').write(
                json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n')

    print('\n  Grade 3 Stage 3 gaps  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    story questions added : %d   (with an answer-key row each)' % added['questions'])
    print('    rules added           : %d' % added['grammar'])
    print('    writing tasks added   : %d' % added['writing'])
    print('    speaking tasks added  : %d' % added['speaking'])
    print('    answer-key rows added : %d' % added['keys'])
    print('    codes claimed         : %d on %d outcome(s) re-flagged' % (added['codes'], added['flags']))
    print('    Stage 3 coverage      : %d/%d (%.0f%%) -> %d/%d (%.0f%%)' % (
        len(before), len(stage), 100.0 * len(before) / len(stage), len(after), len(stage), 100.0 * len(after) / len(stage)))
    print('    still unclaimed       : %s' % (', '.join(sorted(set(stage) - after)) or 'none'))
    print('    units touched         : %s' % ', '.join('u%d' % n for n in sorted(changed)))
    if not write and not changed:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
