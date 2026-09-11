# -*- coding: utf-8 -*-
"""Author the teaching the Grade 4 build found missing (docs/english-g4-
objective-gaps.md), then claim the fourteen Stage 4 objectives it delivers.

WHAT WAS MISSING. Grade 4 claimed 92 of the 106 Stage 4 objectives, and the
fourteen left were not taught anywhere in its ten units - not a line about
predicting an ending, a story's viewpoint, skimming, how a text is organised
in paragraphs, syllable stress, similes, homophones, the -ough spellings,
alternative endings, describing a setting, a character's opinions, a
playscript, or drama. The nearest was a simile offered as an extension prompt
in three writing tasks.

WHAT THIS ADDS, in the shapes the app already renders, so nothing needs a new
step or a paid recording:

  story questions (comprehension)  predict from earlier events (Units 2, 5);
                                   who tells the story (Units 7, 9); what the
                                   details say about when and where it is set
                                   (Units 8, 9); which paragraph holds what
                                   (Units 2, 4); skim for the whole text's
                                   sense (Unit 8)
  grammar rules                    stressed syllables (Unit 1); similes and
                                   alliteration, and the four sounds of -ough
                                   (Unit 2); there / their / they're (Unit 9)
  writing tasks                    a different ending (Unit 5), a playscript
                                   (Unit 7), a setting and a character (Unit
                                   8), a character's diary with opinions
                                   (Unit 9)
  speaking task                    act the queen and the lion with voice,
                                   face and movement (Unit 7)

Every question is answerable from the text as written and is placed FIRST
among its reading's questions so the app's six-question step reaches it (see
the Grade 1 tool, author-english-g1-narrative-and.py, for why); every new item
carries an answer-key row; grammar, writing and speaking items carry an audio
descriptor marked unavailable, so the app speaks their text. The codes are
claimed on the outcome that already carries the unit's nearest claims:

  4Rw.02                  -> Unit 1 lo03
  4Wv.05, 4Ww.06          -> Unit 2 lo01;  4Rs.03 -> lo05;  4Ri.10 -> lo09
  4Rs.03                  -> Unit 4 lo03
  4Ri.10, 4Wc.05          -> Unit 5 lo06, lo07
  4Ri.17                  -> Unit 7 lo08;  4Wc.07, 4SLp.03 -> lo02
  4Ri.13                  -> Unit 8 lo01;  4Ra.04, 4Wc.04 -> lo05
  4Ri.17, 4Wc.06, 4Ra.04  -> Unit 9 lo08;  4Ww.05 -> lo01

THIS IS AUTHORING. Every new item is flagged "Needs curriculum review" and
the outcomes whose mapping widens move to a re-review flag. Nothing here was
read by a reviewer.

    python tools/author-english-g4-stage4-gaps.py          # dry run
    python tools/author-english-g4-stage4-gaps.py --write

Idempotent: an item whose text is already present is left alone; a code
already claimed is not claimed twice.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-4', 'data', 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')
ORIGIN = 'Ehel authoring 2026-09-11 (Stage 4 gaps: prediction, viewpoint, setting, text organisation, stress, figurative language, homophones, -ough, playscript, drama)'
SOURCE = "Authored from the unit's own readings and grammar"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-11)'
MAP_FLAG = 'Needs re-review (Cambridge mapping extended with the objectives the unit now teaches, 2026-09-11)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-11; the app speaks the text. Record with the generator when the content is approved.'}

# ------------------------------------------------------------------ content
# Questions: unit -> (readingId suffix, question, answer, explanation)
QUESTIONS = {
    2: [('read01', '‘Weather Around the World’ has four paragraphs. What is the third paragraph about?',
         'Wild weather: hurricanes, hail and tornadoes.',
         'The third paragraph begins “Not all weather is gentle” and describes a hurricane, hail and a tornado.'),
        ('read05', 'Stop where the wind picks up and the lake ripples. Which earlier clue told you a storm might come?',
         'The sky looked strange and a grey mist covered the path that morning.',
         'The second paragraph says the sky already looked strange and foggy, so a careful reader can predict bad weather before it arrives.')],
    4: [('read01', 'Which paragraph of ‘The Library That Came to Us’ explains what the librarian does every Thursday?',
         'The second paragraph.',
         'The second paragraph says that every Thursday she loads books into a cart and travels along the dusty road to the villages.')],
    5: [('read04', 'Before the dog appears in the cave, which clue helps you predict that an animal is there?',
         'The children hear a soft sound, and Leo says, “That was an animal!”',
         'A careful reader uses what has happened so far: a soft sound, and Leo saying “That was an animal!”, point to a creature before the story shows two eyes and a small dog.')],
    7: [('read02', 'Who is telling ‘Where My Family Comes From’, and how can you tell?',
         'Nora tells it herself, using I, my and we.',
         'The first line is “My name is Nora, and I am proud of who I am”: the text is written in the first person.')],
    8: [('read02', 'Skim ‘A Look at the Stars’ quickly. What is the whole text about?',
         'How a telescope brings the sky closer so we can study it.',
         'Every paragraph returns to the telescope: what it is, what it shows and why it matters. Skimming finds that without reading every word.'),
        ('read05', 'Which details show that ‘The Attic Clue’ happens in a school today, not long ago?',
         'The microwave, the new dishwasher and the toy helicopter the class builds.',
         'The attic holds old tools, but the story itself has a microwave, a dishwasher bought last week and a flying machine that uses clean energy.')],
    9: [('read05', 'Who tells ‘The Day We Got Lost in Mombasa’?',
         'A narrator outside the story, who calls the children Amal and Noah, not I.',
         'The story says “Amal and her cousin Noah were excited”: a narrator describes them from outside, so it is told in the third person.'),
        ('read05', 'Which details show the story is set in a busy modern city?',
         'A train station, a mall with a lift, and an office.',
         'Trains, a mall you ride a lift in and an office building belong to a modern city; the story is set now, in Mombasa.')],
}

# Grammar rules: unit -> list of dicts
GRAMMAR = {
    1: [dict(
        title='Stressed Syllables',
        practiceType='Guided recognition',
        explanation='A word with two or more syllables has one syllable that is said more strongly than the others. That is the stressed syllable. In EF-fort the first part is strong; in re-PORT the second. Hearing the stress helps you say a word clearly and spell it well.',
        ruleAndExamples='Clap each syllable, then say the word again and listen for the strong beat.\nStress on the first syllable: EF-fort, MAS-ter, BAL-ance, IN-ter-view, CIT-i-zen.\nStress on the second syllable: re-PORT, im-PROVE, re-MEM-ber, con-TIN-ue, com-MU-ni-cate.',
        commonMistake='Learners often say every syllable with the same strength, which makes a word hard to catch. Stress can even change the word: a RE-cord is something you keep, and to re-CORD is to save it.',
        memoryTip='Tap the table once for each syllable and hit it harder on the strong one: re-MEM-ber.',
        practice='Say each word aloud, clap the syllables and write which syllable is stressed (1st or 2nd). | 1. effort | 2. report | 3. interview | 4. remember | 5. communicate | 6. balance | Check yourself: 1. 1st 2. 2nd 3. 1st 4. 2nd 5. 2nd 6. 1st',
        outcome='lo03')],
    2: [dict(
        title='Similes and Alliteration',
        practiceType='Guided application',
        explanation='A simile compares one thing with another using like or as: “the mist was as thick as porridge”. Alliteration repeats the same first sound in words that sit close together: “soft snow settles silently”. Both help a reader see and hear the weather you describe.',
        ruleAndExamples='Simile: as + adjective + as + noun, or like + noun. “The hail fell like handfuls of small stones.” “The lake was as flat as glass.”\nAlliteration: two or more nearby words starting with the same sound. “Wild wind whipped the water.” “Thick fog filled the fields.”',
        commonMistake='A simile needs like or as: “The storm was a lion” is a metaphor, not a simile. Alliteration is about the SOUND, not the letter: city and cake start with the same letter but not the same sound.',
        memoryTip='Simile: S for “same as” - look for like or as. Alliteration: All the words Answer with the same sound.',
        practice='Part A: finish each simile with your own idea. | 1. The fog was as grey as ______. | 2. The rain fell like ______. | Part B: write an alliteration for each weather word, using two more words with the same first sound. | 3. wind | 4. snow | 5. hail | Check yourself: any ending that compares (as grey as smoke; like a curtain of beads) and any three words that share a first sound (wild windy weather; soft silent snow; hard hail hits).',
        outcome='lo01'),
        dict(
        title='One Spelling, Many Sounds: -ough',
        practiceType='Guided recognition',
        explanation='Some letter strings look the same but sound different. The letters -ough are said at least four ways: tough (uff), through (oo), though (oh) and plough (ow). You cannot sound these words out; you learn each one by sight, with the word it belongs to.',
        ruleAndExamples='tough, rough, enough - say “uff”: “The wind was tough on the tent.”\nthrough - say “oo”: “Rain came through the roof.”\nthough, although - say “oh”: “We stayed calm, though we were scared.”\nplough, bough - say “ow”: “The farmer drove the plough after the storm.”',
        commonMistake='Spelling these words by their sound: thru, tuff, plow. The sound changes from word to word; the -ough spelling stays the same.',
        memoryTip='Four little sayings, one for each sound: tough stuff; through the blue; although we go; the plough goes down. Learn the word with its saying.',
        practice='Sort these words by the sound of -ough, then say each one: tough, through, though, plough, enough, although, rough, bough. | uff: ______ | oo: ______ | oh: ______ | ow: ______ | Check yourself: uff: tough, enough, rough; oo: through; oh: though, although; ow: plough, bough.',
        outcome='lo01')],
    9: [dict(
        title='There, Their and They’re',
        practiceType='Guided recognition',
        explanation='Three words sound the same and mean different things. There tells a place, or starts “there is” and “there are”. Their means belonging to them. They’re is short for they are.',
        ruleAndExamples='there - a place, or “there is / there are”: “The station is over there.” “There’s a museum by the sea.”\ntheir - belonging to them: “Amal and Noah waited for their uncle.”\nthey’re - they are: “They’re going to the capital, aren’t they?”',
        commonMistake='Writing their for they’re because both start the same way. Test it: say “they are” in its place. If the sentence still makes sense, you need they’re.',
        memoryTip='tHERE has HERE inside it (a place). tHEIR has an I in it - it is theirs. They’re keeps its apostrophe where the a of “are” went.',
        practice='Write there, their or they’re in each gap. | 1. Amal and Noah lost ______ way in the mall. | 2. ______ is a hire stand near the corridor. | 3. ______ waiting at the station with cold drinks. | 4. The museum is ______, beside the sea. | 5. ______ uncle laughed and hugged them. | Check yourself: 1. their 2. There 3. They’re 4. there 5. Their',
        outcome='lo01')],
}

# Writing tasks: unit -> dict
WRITING = {
    5: dict(
        title='Writing 7: A Different Ending for The Spiral Cave',
        promptAndInstructions='Write a new ending for ‘The Spiral Cave’. Start from the moment the children carry the dog out of the cave. Change what happens next: perhaps the dog’s owner is waiting, or the dog runs back into the tunnel, or Talia is not at home. Keep the children the same, and use the past simple.',
        modelText='When they carried the dog out, a girl was standing by the rocks. “Simba!” she cried. “I have looked for you all day!” The dog ran to her and licked her hand. Amal felt happy and a little sad. “He already had a name,” she said. The girl smiled. “Now he has three more friends.”',
        sentenceStarter='When they carried the dog out of the cave,',
        expectedLength='5-7 sentences',
        completedExample={'items': [
            'Sentence 1 (the change): When they carried the dog out, a girl was standing by the rocks.',
            'Sentence 2 (what she said): “Simba!” she cried. “I have looked for you all day!”',
            'Sentence 3 (an action): The dog ran to her and licked her hand.',
            'Sentence 4 (a feeling): Amal felt happy and a little sad.',
            'Sentence 5 (the last line): “Now he has three more friends,” the girl said.']},
        successCriteria='My ending starts where the old one changes; the children stay themselves; every verb is in the past simple; the last line tells the reader how it ends.',
        support='Choose one change first: who is outside the cave, or what the dog does. Say the new ending aloud before you write it.',
        extension='Write a second ending that is sad, and say which ending you prefer and why.',
        outcome='lo07'),
    7: dict(
        title='Writing 7: A Playscript - The Queen and the Lion',
        promptAndInstructions='Write a short playscript for one scene of the school play in ‘The Day of the Play’: the moment the queen stops the wild lion. Put each character’s name in capitals at the start of their line, and put what they DO in brackets, like this: LION: (roars and jumps about) I am the king of this forest! Write six to eight lines.',
        modelText='LION: (roars and jumps about) I am the king of this forest!\nQUEEN: (holds up one hand, calm) Stop. You must not act wild in my kingdom.\nLION: (sits down, surprised) Why not? Everyone is afraid of me.\nQUEEN: (kneels beside him) Because we must be polite and kind. Fear is not the same as respect.\nLION: (quietly) Nobody has ever spoken to me gently before.\nQUEEN: (smiles) Then let today be the first time.',
        sentenceStarter='LION: (roars)',
        expectedLength='6-8 lines of dialogue',
        completedExample={'items': [
            'Line 1 (name in capitals, action in brackets, then the words): LION: (roars and jumps about) I am the king of this forest!',
            'Line 2 (the other character answers): QUEEN: (holds up one hand) Stop. You must not act wild here.',
            'Line 3 (a question keeps the scene going): LION: (sits down) Why not?',
            'Line 4 (the queen’s reason): QUEEN: (kneels beside him) Because we must be polite and kind.',
            'Lines 5 and 6 (an ending): LION: Nobody has spoken to me gently before. QUEEN: (smiles) Then let today be the first time.']},
        successCriteria='Every line starts with a character’s name in capitals; actions are in brackets, not in the spoken words; the two characters take turns; the scene has a beginning and an end.',
        support='Read the play scene in the story again and copy its first two lines as a start.',
        extension='Add a third character - Idris in the audience - with one line, and a stage direction for the lights.',
        outcome='lo02'),
    8: dict(
        title='Writing 7: Picture the Attic',
        promptAndInstructions='Describe the attic in ‘The Attic Clue’ and one person in it so that a reader who has never seen them can picture both. Write two paragraphs: the place (what you see, hear and smell in the dust and the dark), then the person (what Teacher Yasmin or Amal looks like and does there). Use at least three adjectives and one simile.',
        modelText='The attic was low and dark, with dust that tickled our noses and a smell of old paper. A grey curtain hung over something at the back like a ghost that had forgotten to leave. One thin beam of torchlight crossed the floor.\nAmal climbed the ladder first. Her gloves were too big, so she pushed them up her arms, and her eyes shone in the torchlight. She moved slowly, touching each box as if it might speak.',
        sentenceStarter='The attic was',
        expectedLength='2 paragraphs, 6-8 sentences',
        completedExample={'items': [
            'Paragraph 1, sentence 1 (the place, two senses): The attic was low and dark, and the dust tickled our noses.',
            'Sentence 2 (a simile): A grey curtain hung at the back like a ghost that had forgotten to leave.',
            'Sentence 3 (a small detail): One thin beam of torchlight crossed the floor.',
            'Paragraph 2, sentence 1 (the person): Amal climbed the ladder first, her gloves too big for her hands.',
            'Sentence 2 (what they do): She moved slowly and touched each box as if it might speak.']},
        successCriteria='One paragraph for the place and one for the person; three adjectives and one simile; a reader can see, hear or smell something in each paragraph.',
        support='List five things you would notice in a dusty attic before you write.',
        extension='Describe the same attic at night, with the torch off.',
        outcome='lo05'),
    9: dict(
        title='Writing 7: Noah’s Diary',
        promptAndInstructions='Write the diary Noah keeps on the night after ‘The Day We Got Lost in Mombasa’, in the first person (I, we). Give Noah opinions: what he thought of the mall, the museum, the moment they were lost, and his uncle. A reader should be able to tell what Noah is like from what he says.',
        modelText='Dear diary, today I nearly gave Uncle grey hair. The mall was fun, but honestly the museum was better - you learn more from old maps than from keyrings. When we turned round and the sign was blue, my stomach dropped. Amal stayed calm and I did not; I will remember that. Uncle was not even angry. I think he is the kindest person I know.',
        sentenceStarter='Dear diary, today',
        expectedLength='5-7 sentences',
        completedExample={'items': [
            'Sentence 1 (first person, the day): Dear diary, today I nearly gave Uncle grey hair.',
            'Sentence 2 (an opinion about a place): The mall was fun, but the museum was better.',
            'Sentence 3 (a feeling at the key moment): When the sign was blue, my stomach dropped.',
            'Sentence 4 (an opinion about another character): Amal stayed calm and I did not.',
            'Sentence 5 (a closing opinion): I think Uncle is the kindest person I know.']},
        successCriteria='Written as Noah, in the first person; at least two opinions about places and one about a person; the reader learns what Noah is like.',
        support='Find three things Noah says in the story and start from those.',
        extension='Write the same evening as Amal, and show where the two diaries disagree.',
        outcome='lo08'),
}

# Speaking tasks: unit -> dict
SPEAKING = {
    7: dict(
        title='Speaking 7: Act the Scene',
        activityType='Guided speaking',
        instructionsAndModelLines='Act the queen and the lion from ‘The Day of the Play’ with a partner, or play both parts yourself.\nChange your VOICE: the lion roars low and loud; the queen speaks slowly and gently.\nChange your FACE and HANDS: the lion shows his teeth and stretches his claws; the queen keeps her hands still and her chin up.\nChange how you MOVE: the lion prowls in a circle; the queen takes two calm steps and stops.\nSay these lines, then add two of your own:\nLION: I am the king of this forest!\nQUEEN: You must not act wild. We must be polite and kind.\nRecord yourself, then listen back: could someone tell which character was speaking with their eyes closed?',
        recordingRequired=True,
        aiTutorPrompt='With an adult present, describe to the tutor how your voice and movement changed between the lion and the queen, and ask it for one more way to show each character.',
        outcome='lo02'),
}

# Which outcome carries which new claim: unit -> {outcome suffix: [codes]}
CLAIMS = {
    1: {'lo03': ['4Rw.02']},
    2: {'lo01': ['4Wv.05', '4Ww.06'], 'lo05': ['4Rs.03'], 'lo09': ['4Ri.10']},
    4: {'lo03': ['4Rs.03']},
    5: {'lo06': ['4Ri.10'], 'lo07': ['4Wc.05']},
    7: {'lo08': ['4Ri.17'], 'lo02': ['4Wc.07', '4SLp.03']},
    8: {'lo01': ['4Ri.13'], 'lo05': ['4Ra.04', '4Wc.04']},
    9: {'lo08': ['4Ri.17', '4Wc.06', '4Ra.04'], 'lo01': ['4Ww.05']},
}
# the outcome each unit's new QUESTIONS hang off
Q_ANCHOR = {2: 'lo05', 4: 'lo03', 5: 'lo06', 7: 'lo08', 8: 'lo05', 9: 'lo08'}


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
    stage = [o['code'] for o in fw['objectivesByStage']['4']]
    order = {c: i for i, c in enumerate(stage)}
    for m in CLAIMS.values():
        for codes in m.values():
            for c in codes:
                if c not in order:
                    sys.exit('REFUSED: %s is not a Stage 4 objective' % c)

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
        uid = d['unit']['unitId']                       # eng-g04-t01-u02
        outcome_id = lambda suffix: '%s-%s' % (uid, suffix)
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

        # story questions, placed FIRST among their reading's questions -
        # the app's step takes the first questions of each reading in turn
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

        # grammar
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
        if n in WRITING and WRITING[n]['title'] not in {w['title'] for w in d['writing']}:
            w = WRITING[n]
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
        if n in SPEAKING and SPEAKING[n]['title'] not in {s['title'] for s in d['speaking']}:
            s = SPEAKING[n]
            sseq = max(x['sequence'] for x in d['speaking']) + 1
            sid = '%s-speak%02d' % (uid, sseq)
            d['speaking'].append({
                'speakingId': sid, 'unitId': uid, 'sequence': sseq, 'title': s['title'],
                'outcomeId': outcome_id(s['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE,
                'activityType': s['activityType'], 'instructionsAndModelLines': s['instructionsAndModelLines'],
                'recordingRequired': s['recordingRequired'], 'aiTutorPrompt': s['aiTutorPrompt'],
                'audio': dict(NO_CLIP)})
            key_row(sid, 'Speaking', 'Listen for THREE changes between the characters: voice (pitch and volume), face and hands, and movement. Two clear changes is a pass; three is strong.')
            added['speaking'] += 1
            changed.add(n)

        # claims
        for suffix, codes in CLAIMS.get(n, {}).items():
            o = next((o for o in d['outcomes'] if o['outcomeId'] == outcome_id(suffix)), None)
            if o is None:
                sys.exit('REFUSED: unit-%d.json has no outcome %s' % (n, suffix))
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

    print('\n  Grade 4 Stage 4 gaps  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    story questions added : %d   (with an answer-key row each)' % added['questions'])
    print('    grammar rules added   : %d' % added['grammar'])
    print('    writing tasks added   : %d' % added['writing'])
    print('    speaking tasks added  : %d' % added['speaking'])
    print('    answer-key rows added : %d' % added['keys'])
    print('    codes claimed         : %d on %d outcome(s) re-flagged' % (added['codes'], added['flags']))
    print('    Stage 4 coverage      : %d/%d (%.0f%%) -> %d/%d (%.0f%%)' % (
        len(before), len(stage), 100.0 * len(before) / len(stage), len(after), len(stage), 100.0 * len(after) / len(stage)))
    print('    still unclaimed       : %s' % (', '.join(sorted(set(stage) - after)) or 'none'))
    print('    units touched         : %s' % ', '.join('u%d' % n for n in sorted(changed)))
    if not write and not changed:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
