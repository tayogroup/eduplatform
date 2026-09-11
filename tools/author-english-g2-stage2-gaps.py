# -*- coding: utf-8 -*-
"""Author the teaching Grade 2 was missing, then claim the twenty-seven Stage 2
objectives it delivers.

WHAT WAS MISSING. Measured 2026-09-11, while closing the Grade 3 and 4 gaps:
Grade 2 claimed 72 of the 99 Stage 2 objectives, and nobody had measured it
before - Grades 1, 3 and 4 each have a gap document and Grade 2 had none, and
it is LIVE. docs/english-g2-objective-gaps.md is written with this tool.

Two kinds of gap, and they are closed differently:

  TAUGHT BUT NEVER CLAIMED. Grade 2's spelling strand (core-words.json, the
  sounds step in the lesson app) teaches ai and ay, ee and oo, igh, oa and ow,
  and the split digraphs a_e, i_e, o_e and u_e - two spellings of one sound
  and the "magic e" - and its writing section already has pupils write poems
  on the pattern of a familiar poem (Unit 1 'Your Own Poem', Unit 8 'Your Own
  Animal Homes Poem'). Those are claimed on the outcome that owns them, with a
  rule that says the pattern out loud where the strand only lists words.

  NOT TAUGHT. Everything else: fiction and non-fiction, story and poem
  features, the contents page, commas in a list, speech marks, special
  plurals, joining words, decoding a long word, retelling, predicting,
  implicit meaning, stories from long ago, choosing a book, pictures that add
  to words, setting and character, handwriting, and three speaking skills.

WHAT THIS ADDS, in shapes the app shows (the "How English works" step shows
every rule; "Write it yourself" and "Talk it through" show every task):

  story questions   implicit meaning (Unit 2); a clue that predicts the ending
                    (Unit 3); a story from long ago and far away (Unit 5);
                    story or fact text (Unit 10)
  rules             one sound, two spellings (Unit 1); commas in a list (Unit
                    2); special plurals (Unit 3); joining words and reading a
                    long new word (Unit 6); ow and o with two sounds (Unit 7);
                    the contents page (Unit 8); magic e (Unit 9); stories,
                    poems and fact texts (Unit 10)
  writing tasks     begin a story with a setting and a character (Unit 4);
                    who said it - speech marks (Unit 9); neatest joined
                    handwriting (Unit 10)
  speaking tasks    choose a book (Unit 1); read the talking parts (Unit 2);
                    retell the race and does it match (Unit 3); what the
                    picture adds (Unit 8); act it out (Unit 9)

Story answers stay within Grade 2's 70-character limit for an option, so the
story step can offer them. A PREDICTION question asks which clue predicts the
end, not what the end will be: the app shows the unit's story as a picture book
before its questions, so "how will it end?" is answered by memory by then.
Every line quoted from a unit text was checked against it.

THIS IS AUTHORING. Every new item is flagged "Needs curriculum review" and the
outcomes whose mapping widens move to a re-review flag.

    python tools/author-english-g2-stage2-gaps.py          # dry run
    python tools/author-english-g2-stage2-gaps.py --write

Idempotent: an item whose title or question is already present is left alone;
a code already claimed is not claimed twice.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-2', 'data', 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')
ORIGIN = 'Ehel authoring 2026-09-11 (Stage 2 gaps: text types and features, contents page, choosing books, stories from other times, pictures, retelling, prediction, implicit meaning, joining words, decoding, grapheme sounds, split digraphs, long vowel spellings, rhyme, plurals, commas, speech marks, setting and character, handwriting, speaking)'
SOURCE = "Authored from the unit's own readings"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-11)'
MAP_FLAG = 'Needs re-review (Cambridge mapping extended with the objectives the unit now teaches, 2026-09-11)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-11; the app speaks the text. Record with the generator when the content is approved.'}
STAGE = '2'

# ------------------------------------------------------------------ content
# Questions: unit -> (readingId suffix, question, answer, explanation)
QUESTIONS = {
    2: [('story01', 'When Omar thanks his neighbours, he wipes his eyes. Why do you think he does that?',
         'He is so happy and thankful that tears come to his eyes.',
         'The story does not say that Omar cries. It says he wipes his eyes while he says “Thank you, my good neighbours” - so a reader works out that he has tears of thanks. That is a meaning the words show without saying it.')],
    3: [('story01', 'Before the race ends, which clue tells you that Amal might help Theo?',
         'She cheered for Leo when he wobbled, so she is kind to others.',
         'Early in the story Amal shouts “Keep going, Leo!” when he nearly falls. A reader who has seen her be kind can predict the ending: she walks back and helps Theo stand up.')],
    5: [('read04', 'Is ‘How People Measured Long Ago’ about today or long ago, and which places does it visit?',
         'Long ago, in Egypt and in Rome.',
         'Teacher Yasmin tells a story about “long, long ago - before rulers and metre sticks were invented”, first in Egypt and then in Rome. Stories can come from other times and other places.')],
    10: [('read02', 'Is ‘The My English World Project Brief’ a story or a fact text? How can you tell?',
          'A fact text: it gives instructions in four numbered parts.',
          'The brief is not made up and has no story events. It says it “has four parts, and you work through them in order”, and each part starts with a label - Part 1: Choose your pages. That is how instructions are built.')],
}

# Rules for the "How English works" step: unit -> list of dicts
GRAMMAR = {
    1: [dict(
        title='One Sound, Different Spellings',
        practiceType='Guided recognition',
        explanation='One sound can be spelt in more than one way. The long a sound in rain is spelt ai in the middle of a word (rain, train, snail) and ay at the end (day, play, stay). Later you will meet a_e (made, name) and even ea (great). Words that rhyme often share a spelling - train, rain, snail - but not always: snail and whale rhyme, and they are spelt differently.',
        ruleAndExamples='ai in the middle of a word: rain, train, snail, tail, wait\nay at the end of a word: day, play, stay, Sunday\na_e, with a silent e: made, name, game\nRhymes that share a spelling: train - rain - snail\nRhymes that do not: snail - whale, day - they',
        commonMistake='Writing ay in the middle of a word (“trayn”) or ai at the end (“dai”). Ask where the sound is: in the middle it is usually ai, at the end it is usually ay.',
        memoryTip='ai stays inside the word; ay goes all the way to the end.',
        practice='Write ai or ay to finish each word. | 1. tr__n | 2. d__ | 3. sn__l | 4. pl__ | 5. w__t | Check yourself: 1. train 2. day 3. snail 4. play 5. wait',
        outcome='lo01')],
    2: [dict(
        title='Commas in a List',
        practiceType='Guided application',
        explanation='When you write a list of three or more things, put a comma between them. Before the last thing, write and instead of a comma.',
        ruleAndExamples='“A firefighter wears boots, a helmet, a mask and gloves.”\n“In my neighbourhood there are grandmas, grandpas, mums and dads.”\n“Karim, Nadia and Rami helped Omar.”',
        commonMistake='Leaving the commas out, so the list runs together: “boots a helmet a mask and gloves”. In our lists, and joins the last two things, with no comma before it.',
        memoryTip='A comma is a little pause for breath between the things in a list. When you reach and, the list is nearly finished.',
        practice='Put the commas in each list. | 1. I can see a fire engine a helmet and a hose. | 2. Leila wears boots gloves and a mask. | 3. Amal Theo and Nora visited the fire station. | Check yourself: 1. a fire engine, a helmet and a hose 2. boots, gloves and a mask 3. Amal, Theo and Nora',
        outcome='lo06')],
    3: [dict(
        title='Special Plurals',
        practiceType='Guided recognition',
        explanation='Most words add s to mean more than one: one arm, two arms. Some common words change instead, and a few stay the same.',
        ruleAndExamples='Change: one foot, two feet; one tooth, two teeth; one child, many children; one man, two men; one mouse, two mice\nStay the same: one sheep, two sheep; one fish, two fish\nAdd s as usual: one hand, two hands; one toe, ten toes',
        commonMistake='Adding s to a word that changes: “foots”, “childrens”, “mouses”, “sheeps”. Say it aloud - “two foots” sounds wrong to an English ear.',
        memoryTip='Foot, tooth and goose all change oo to ee: feet, teeth, geese.',
        practice='Write the word for more than one. | 1. one foot, two ______ | 2. one child, three ______ | 3. one mouse, two ______ | 4. one sheep, four ______ | 5. one tooth, many ______ | Check yourself: 1. feet 2. children 3. mice 4. sheep 5. teeth',
        outcome='lo01')],
    6: [dict(
        title='Joining Words: and, but, because, if, when',
        practiceType='Guided recognition',
        explanation='Small joining words link two ideas into one sentence. And adds another idea. But shows something different. Because gives a reason. If says what could happen. When says the time something happens.',
        ruleAndExamples='and: “Stay calm and do not wave your arms.”\nbut: “A worm has no legs, but it is a good little animal.”\nbecause: “I like trees because they are tall and quiet.”\nif: “If you look closely, the garden is full of little friends.”\nwhen: “When a bee buzzed near her, she ran.”',
        commonMistake='Starting a sentence with because and stopping there: “Because it is raining.” A because part needs the main idea too: “We stayed inside because it was raining.”',
        memoryTip='and - more; but - different; because - why; if - maybe; when - what time.',
        practice='Choose and, but, because, if or when for each gap. | 1. A spider has eight legs, ______ an ant has six. | 2. The bee flew away ______ Amal stayed calm. | 3. ______ you count its legs, you will know. | 4. The garden was quiet ______ the sun went down. | 5. Ants carry seeds ______ work together. | Check yourself: 1. but 2. because 3. If 4. when 5. and',
        outcome='lo05'),
        dict(
        title='Reading a Long New Word',
        practiceType='Guided application',
        explanation='When you meet a word you have never seen, do not guess from its first letter. Chop it into chunks, sound out each chunk with the sounds you know, then blend the chunks together. Last, check that the word makes sense in the sentence.',
        ruleAndExamples='thorax: th - or - ax, thorax\nabdomen: ab - do - men, abdomen\nbutterfly: but - ter - fly, butterfly\nantennae: an - ten - nae, antennae (here ae says ee)',
        commonMistake='Stopping after the first chunk and guessing: reading abdomen as “about”. Say every chunk, then blend.',
        memoryTip='Chop, sound, blend, check.',
        practice='Chop each word into chunks, then blend it. | 1. cricket | 2. insect | 3. nectar | 4. spider | 5. antennae | Check yourself: 1. crick-et 2. in-sect 3. nec-tar 4. spi-der 5. an-ten-nae',
        outcome='lo02')],
    7: [dict(
        title='One Spelling, Two Sounds: ow and o',
        practiceType='Guided recognition',
        explanation='Some letters make more than one sound. The letters ow say ow in cow, how and brown, but oh in low, grow and snow. The letter o says o in hot, but oh in cold, old and go. If one sound does not make a word you know, try the other.',
        ruleAndExamples='ow as in cow: how, now, brown, flower\now as in snow: low, grow, show, slowly\no as in hot: hot, pot, soft\no as in go: cold, old, go, no',
        commonMistake='Reading grow to rhyme with cow, or cold to rhyme with doll. When a word sounds wrong, switch to the other sound.',
        memoryTip='Two sounds for ow: “How now, brown cow” and “Show me the snow”.',
        practice='Sort the words by the sound of ow: how, grow, brown, snow, now, show. | ow as in cow: ______ | ow as in snow: ______ | Check yourself: cow: how, brown, now; snow: grow, snow, show',
        outcome='lo04')],
    8: [dict(
        title='Using a Contents Page',
        practiceType='Guided recognition',
        explanation='A contents page is at the front of a book. It lists what is inside, in order, with the page where each part starts. Use it to go straight to the part you need instead of turning every page. Books that give information, like Teacher Yasmin’s Homes Around the World, often have one.',
        ruleAndExamples='Contents - Homes Around the World\n1. Flats in the city, page 2\n2. Houses with gardens, page 6\n3. Adobe houses, page 10\n4. Houses on stilts, page 14\nTo read about adobe houses, turn straight to page 10.',
        commonMistake='Looking for the contents page at the back of the book. It is at the front, straight after the cover.',
        memoryTip='Contents at the start - C for cover, C for contents.',
        practice='Use the contents page above. | 1. On which page do houses on stilts start? | 2. What is on page 2? | 3. Which part comes after Houses with gardens? | Check yourself: 1. page 14 2. Flats in the city 3. Adobe houses',
        outcome='lo04')],
    9: [dict(
        title='Magic e: Split Digraphs',
        practiceType='Guided recognition',
        explanation='An e at the end of a word can change the vowel before it. The e makes no sound, but it reaches back over one letter and makes the vowel say its name: hop becomes hope, kit becomes kite, cub becomes cube. The two letters work together with another letter in between - that is a split digraph.',
        ruleAndExamples='a_e: mad, made; cap, cape; game, name\ni_e: kit, kite; bike, like, ride\no_e: hop, hope; not, note; home, stone\nu_e: cub, cube; tune, huge',
        commonMistake='Leaving off the e: writing “bik” for bike, or hop when you mean hope. Read it back - without the e, the vowel says its short sound and it is a different word.',
        memoryTip='The magic e is silent, but it makes the vowel say its name.',
        practice='Add a magic e and read the new word. | 1. kit | 2. hop | 3. cub | 4. not | 5. mad | Check yourself: 1. kite 2. hope 3. cube 4. note 5. made',
        outcome='lo05')],
    10: [dict(
        title='Stories, Poems and Fact Texts',
        practiceType='Guided recognition',
        explanation='A story is made up. It has characters (who), a setting (where and when) and events with a beginning, a middle and an end. A poem is written in short lines, often with rhyme and words that repeat. A fact text gives true information; instructions give steps in order, often numbered.',
        ruleAndExamples='Story - ‘Amal’s English Year’: a character (Amal), a setting (her classroom), a beginning (she opens her folder), a middle (she makes her booklet) and an end (she feels proud).\nPoem - ‘Homes’: four short lines, the same pattern in each, and a rhyme (bee, me).\nFact text - ‘What Is an Insect?’: true facts about insects - six legs, three body parts.\nInstructions - ‘The My English World Project Brief’: four numbered parts, in order.',
        commonMistake='Thinking a text is a story because people talk in it. ‘What Is an Insect?’ has Leo and Teacher Yasmin in it, but its job is to teach true facts. Ask what the text is FOR.',
        memoryTip='Story - made up. Poem - short lines. Facts - true. Instructions - steps.',
        practice='Story, poem, fact text or instructions? | 1. The Big Race | 2. A Bug Poem | 3. What Is an Insect? | 4. My Exercise Routine | Check yourself: 1. story 2. poem 3. fact text 4. instructions',
        outcome='lo02')],
}

# Writing tasks: unit -> list of dicts
WRITING = {
    4: [dict(
        title='Writing 7: Where and Who - Begin a Story',
        promptAndInstructions='Begin a story that happens at night under the big sky.\nWrite two sentences about WHERE it happens - the setting: what your character can see and hear.\nThen write two sentences about WHO it is about - the character: what they look like and what they do.\nUse at least three describing words from this unit, such as dark, bright, long or high.',
        modelText='The sky was dark, and the moon was round and bright. Tiny stars shone above the quiet hills. Amal sat on a mat beside Grandma Hana. She had wide eyes and a big smile, and she tried to count the stars.',
        sentenceStarter='The sky was',
        expectedLength='4 sentences',
        completedExample={'items': [
            'Setting 1 (what you see): The sky was dark, and the moon was round and bright.',
            'Setting 2 (more detail): Tiny stars shone above the quiet hills.',
            'Character 1 (who, and where they are): Amal sat on a mat beside Grandma Hana.',
            'Character 2 (how they look and what they do): She had wide eyes and a big smile, and she tried to count the stars.']},
        successCriteria='Two sentences tell where the story happens; two tell who it is about; I used three describing words; every sentence has a capital letter and a full stop.',
        support='Close your eyes and picture the night sky. Say what you see before you write.',
        extension='Write what happens next, in one more sentence.',
        outcome='lo05')],
    9: [dict(
        title='Writing 7: Who Said It? Speech Marks',
        promptAndInstructions='Write the talk between the old man, Adam and Amal from ‘A Big Day in the City’.\nPut the words each person says inside speech marks.\nStart a new line every time a different person speaks.\nWrite four lines.',
        modelText='“Excuse me,” said the old man. “Can you help me? I need to find the hospital.”\n“We can help you,” said Adam. “Walk straight ahead to the traffic light.”\n“Thank you,” said the old man. “But my legs are slow.”\n“Then we will walk with you,” said Amal.',
        sentenceStarter='“Excuse me,” said the old man.',
        expectedLength='4 lines of talk',
        completedExample={'items': [
            'Line 1 (the old man): “Excuse me,” said the old man. “Can you help me?”',
            'Line 2 (a new speaker, a new line): “We can help you,” said Adam.',
            'Line 3 (the old man again, a new line): “Thank you,” said the old man.',
            'Line 4 (Amal): “Then we will walk with you,” said Amal.']},
        successCriteria='The spoken words are inside speech marks; each new speaker starts a new line; I wrote who said it; every line ends with a full stop, a question mark or an exclamation mark.',
        support='Find the lines in the story first and copy them, one speaker at a time.',
        extension='Add one more line: what does the old man say when they reach the hospital?',
        outcome='lo07')],
    10: [dict(
        title='Writing 7: My Neatest Handwriting',
        promptAndInstructions='Copy two sentences from your booklet in your neatest joined handwriting.\nMake your small letters the same size, sitting on the line. Tall letters (b, d, h, k, l, t) reach up; tail letters (g, j, p, q, y) hang below the line.\nJoin the small letters in each word, the way the handwriting sheet in Student resources shows. Leave capital letters unjoined.\nLeave a finger space between words.\nCheck: can a friend read every word?',
        modelText='Welcome to my English world. I can read, write and speak more clearly now.',
        sentenceStarter='Welcome to my',
        expectedLength='2 sentences, copied neatly',
        completedExample={'items': [
            'Small letters all the same size, sitting on the line.',
            'Tall letters up, tail letters down.',
            'The small letters joined; the capital W and I left unjoined.',
            'A finger space between every word.']},
        successCriteria='My small letters are the same size and sit on the line; tall letters reach up and tails hang down; I joined the small letters and left the capitals unjoined; there is a finger space between words.',
        support='Trace the letters on the handwriting sheet in Student resources before you start.',
        extension='Write the two sentences again a little faster, and keep them just as neat.',
        outcome='lo05')],
}

# Speaking tasks: unit -> list of dicts
SPEAKING = {
    1: [dict(
        title='Speaking 7: Which Book Would You Choose?',
        activityType='Guided speaking',
        instructionsAndModelLines='Leo’s favourite book is The Clever Fox. Which book would YOU choose to read for fun?\nListen to what each of these three books is about:\nThe Clever Fox - a fox who tricks the other animals, until one day they trick him back.\nTrains Around the World - real trains, fast and slow, with big photographs.\nThe Monkey Who Could Not Sleep - a funny story about a very busy night.\nChoose one, and tell a partner or say it out loud: I would choose ___ because ___.\nThen find a real book at home or in your classroom that you would like to read next, and say why.',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, tell the tutor which book you chose and why, and ask it to suggest one more book like it.',
        outcome='lo06',
        key='Any choice is right if the child gives a reason with because (“because I like trains”). Listen for the frame I would choose ___ because ___, and for one real book the child would like to read next.')],
    2: [dict(
        title='Speaking 7: Read the Talking Parts',
        activityType='Guided speaking',
        instructionsAndModelLines='Speech marks show the words a person says. When you read aloud, use a different voice for the words inside the speech marks, and your own storyteller voice for the rest.\nRead these lines from ‘The Helpers of Warta Street’:\n“Good morning, Amal!” Karim called. “What are you doing today?”\n“I am watching all the helpers,” said Amal.\n“A fire!” shouted Karim. “Everyone, stay back!”\n“Please stand back, my friends,” said Rami kindly.\nRecord yourself or ask a partner to listen: can they hear which words were inside the speech marks?',
        recordingRequired=True,
        aiTutorPrompt='With an adult present, read one line to the tutor and ask it which words were inside the speech marks.',
        outcome='lo03',
        key='Listen for a change of voice at each pair of speech marks, and back to the storyteller voice for “Karim called”, “said Amal” and “said Rami kindly”. Three lines read with a clear change is a pass.')],
    3: [dict(
        title='Speaking 7: Tell the Race Again',
        activityType='Guided speaking',
        instructionsAndModelLines='Retell ‘The Big Race’ in four steps, using only the main events.\nFirst: It was sports day, and Leo kept going in the hopping race.\nNext: In the relay race, Theo was far in front, waving to the crowd.\nThen: Theo tripped and fell, and Amal ran past him to win.\nLast: Amal went back and helped Theo stand up.\nNow tell it yourself without reading, using First, Next, Then and Last. Leave out the small details and keep the big events.',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, retell the story to the tutor in four sentences and ask it whether you left out a big event.',
        outcome='lo06',
        key='Listen for the four main events in order - the hopping race, the relay, Theo falling, Amal helping him - and the words First, Next, Then and Last. Four events in order is a pass.'),
        dict(
        title='Speaking 8: Does It Match?',
        activityType='Guided speaking',
        instructionsAndModelLines='Our faces and bodies speak too. In ‘The Big Race’, Theo says his legs are the fastest while he waves his arms and jumps up high - his body matches his words. Later he says he is hurt “only a little”, but he is rubbing his knee and looks very sad.\nPlay with a partner. One of you says a sentence with a face and body that MATCH it, or that do NOT match it. The other says “match” or “no match”.\nI am so happy today! (smile, or frown)\nI am not scared at all. (stand tall, or shake and hide)\nThis is delicious! (lick your lips, or pull a face)\nI am very tired. (yawn, or jump about)\nThen talk: when a face does not match the words, which one do you believe?',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, tell the tutor about a time when someone’s face did not match their words, and ask it what the person might really have felt.',
        outcome='lo04',
        key='Listen for correct match and no-match calls, and for the idea that when a face and the words disagree, the face often shows the real feeling - Theo said “only a little”, but he looked very sad.')],
    8: [dict(
        title='Speaking 7: What the Picture Adds',
        activityType='Guided speaking',
        instructionsAndModelLines='Open one of this unit’s picture books.\nChoose one page. Read the words, then look at the picture for a long time.\nTell a partner, or say it out loud:\nThe words say ___.\nThe picture shows ___ too.\nFind one thing the picture shows that the words do not say - what the weather is like, how a character feels, or what is in the room.\nThen say: does the picture help you understand the story? How?',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, describe one picture to the tutor without reading the words, and ask it to guess what is happening.',
        outcome='lo01',
        key='Accept any real detail that is in the picture and not in the words - a colour, a feeling on a face, a thing in the room. Listen for the two sentence frames and one reason the picture helps.')],
    9: [dict(
        title='Speaking 7: Act It Out - The Lost Old Man',
        activityType='Guided speaking',
        instructionsAndModelLines='Act the scene from ‘A Big Day in the City’ where Amal and Adam meet the lost old man. One person is the old man, one is Adam and one is Amal - or play every part yourself.\nThe old man: walk slowly, look worried, and turn the map this way and that.\nAdam: point down the road as you give the directions.\nAmal: speak kindly and offer to walk with him.\nSay these lines, then add one new line for each character:\n“Excuse me. I am lost. Can you help me?”\n“Walk straight ahead to the traffic light. Then turn left.”\n“Then we will walk with you.”\nAfterwards, talk: how do you think the old man felt at the start, and at the end?',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, tell the tutor one new line you gave the old man, and ask it how else he might have felt.',
        outcome='lo07',
        key='Listen for each character acted in a different way (slow and worried, pointing, kind) and one new line for each. For the feelings: worried and lost at the start; happy and thankful at the end.')],
}

# Which outcome carries which new claim: unit -> {outcome suffix: [codes]}
CLAIMS = {
    # 2Wc.01 is claimed where it is ALREADY taught: Unit 1 Writing 2 ('Your
    # Own Poem', on the pattern of 'When I Open Up a Book', lo03) and Unit 8
    # Writing 2 ('Your Own Animal Homes Poem', on the pattern of 'Homes', lo01).
    # 2Ww.01/2Ww.03 and 2Rw.02/2Ww.02 are taught by the spelling strand; the
    # rules added here say its pattern out loud.
    1: {'lo01': ['2Ww.01', '2Ww.03'], 'lo06': ['2Ra.04'], 'lo03': ['2Wc.01']},
    2: {'lo02': ['2Ri.10'], 'lo06': ['2Wg.02'], 'lo03': ['2SLp.02']},
    3: {'lo01': ['2Ww.04'], 'lo03': ['2Ri.11'], 'lo06': ['2Ri.07'], 'lo04': ['2SLr.03']},
    4: {'lo05': ['2Wc.03']},
    5: {'lo07': ['2Ra.05']},
    6: {'lo05': ['2Rg.03'], 'lo02': ['2Rw.05']},
    7: {'lo04': ['2Rw.01']},
    8: {'lo04': ['2Ri.14'], 'lo01': ['2Ri.02', '2Wc.01']},
    9: {'lo05': ['2Rw.02', '2Ww.02'], 'lo07': ['2Wg.03', '2SLp.03']},
    10: {'lo02': ['2Ri.01', '2Ri.03', '2Rs.02'], 'lo05': ['2Wp.01', '2Wp.02']},
}
# the outcome each unit's new QUESTIONS hang off
Q_ANCHOR = {2: 'lo02', 3: 'lo03', 5: 'lo07', 10: 'lo02'}
STORY_ANSWER_MAX = 70   # build-lessons.py: the longest option the story step offers at Grades 1-2


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
    for qs in QUESTIONS.values():
        for _, q, a, _ in qs:
            if len(a) > STORY_ANSWER_MAX:
                sys.exit('REFUSED: answer longer than %d characters, the story step would drop it: %r' % (STORY_ANSWER_MAX, a))

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

        taken = {a['answerId'] for a in d['answerKey']}
        next_answer = [0]

        def key_row(content_id, content_type, text):
            next_answer[0] += 1
            aid = '%s-answer-%03d' % (uid, next_answer[0])
            while aid in taken:
                next_answer[0] += 1
                aid = '%s-answer-%03d' % (uid, next_answer[0])
            taken.add(aid)
            d['answerKey'].append({'answerId': aid, 'unitId': uid, 'contentId': content_id,
                                   'contentType': content_type, 'answerOrGuidance': text,
                                   'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE})
            added['keys'] += 1

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
                    'sequence': 0, 'questionType': 'Short answer', 'question': q,
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

        have_gram = {g['title'] for g in d['grammar']}
        for g in GRAMMAR.get(n, []):
            if g['title'] in have_gram:
                continue
            gseq = max(int(x['sequence']) for x in d['grammar']) + 1
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

        have_w = {w['title'] for w in d['writing']}
        for w in WRITING.get(n, []):
            if w['title'] in have_w:
                continue
            wseq = max(int(x['sequence']) for x in d['writing']) + 1
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

        have_s = {s['title'] for s in d['speaking']}
        for s in SPEAKING.get(n, []):
            if s['title'] in have_s:
                continue
            sseq = max(int(x['sequence']) for x in d['speaking']) + 1
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

    print('\n  Grade 2 Stage 2 gaps  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    story questions added : %d   (with an answer-key row each)' % added['questions'])
    print('    rules added           : %d' % added['grammar'])
    print('    writing tasks added   : %d' % added['writing'])
    print('    speaking tasks added  : %d' % added['speaking'])
    print('    answer-key rows added : %d' % added['keys'])
    print('    codes claimed         : %d on %d outcome(s) re-flagged' % (added['codes'], added['flags']))
    print('    Stage 2 coverage      : %d/%d (%.0f%%) -> %d/%d (%.0f%%)' % (
        len(before), len(stage), 100.0 * len(before) / len(stage), len(after), len(stage), 100.0 * len(after) / len(stage)))
    print('    still unclaimed       : %s' % (', '.join(sorted(set(stage) - after)) or 'none'))
    print('    units touched         : %s' % ', '.join('u%d' % n for n in sorted(changed)))
    if not write and not changed:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
