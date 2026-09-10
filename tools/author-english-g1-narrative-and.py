# -*- coding: utf-8 -*-
"""Author the teaching the Grade 1 validation found missing (area 5, the
second half): narrative structure, and joining with "and" - then claim the
nine Stage 1 objectives that teaching delivers.

WHAT WAS MISSING. After the phonics mapping, twelve Stage 1 objectives were
still unclaimed. Nine of them are one gap: nothing in the course asked a
child who a story is about, where it happens, what the problem is and how it
ends; nothing stopped mid-story to guess what comes next; nothing compared a
story with the child's own life; nothing started a story with "Once upon a
time" or asked the child to make one; and no rule taught "and". The course
already teaches the two-clause shape ("First we feed the hens, then we
collect the eggs"), so "and" is a variation on something met, not a new
structure.

WHAT THIS ADDS, in the shapes the app already renders, so nothing needs a
new step or a paid recording:

  story questions (comprehension)  who / where / the problem / the end, on
                                    the story of Units 1, 3, 5, 8 and 10, and
                                    two on Unit 10's project brief, which is
                                    the course's one non-fiction text
  activities                        "Stop and guess" (Units 3, 5), "Like my
                                    life?" (Units 1, 8), "Once upon a time"
                                    and "Tell a tiny story" (Units 3, 10)
  grammar rules                     "and" in Units 2, 5 and 7; "Once upon a
                                    time" in Unit 10

Every question is answerable from the story text as written; every new item
carries the answer-key row the others carry; new grammar and activity items
carry an audio descriptor marked unavailable, so the app speaks their text
itself. The codes are then claimed on the outcome that already carries each
unit's story or grammar claims:

  1Ri.01, 1Ri.02, 1Ra.06 -> Units 1 and 8 (story outcome)
  1Ri.02, 1Ri.10         -> Units 3 and 5 (story outcome); 1Ri.02 -> Unit 10
  1Wc.01, 1Wv.02         -> Units 3 and 10
  1Ri.04                 -> Unit 10 (the project brief)
  1Rg.04, 1Wg.05         -> Units 2, 5 and 7 (grammar outcome)

THIS IS AUTHORING. Every new item is flagged "Needs curriculum review" and
the outcomes whose mapping widens move to a re-review flag. Nothing here
was read by a reviewer.

    python tools/author-english-g1-narrative-and.py          # dry run
    python tools/author-english-g1-narrative-and.py --write

Idempotent: an item whose id is already present is left alone; a code
already claimed is not claimed twice.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')

ORIGIN = 'Ehel authoring 2026-09-10 (narrative structure and the conjunction and)'
SOURCE = "Authored from the unit's own story and grammar"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-10)'
MAP_FLAG = 'Needs re-review (Cambridge mapping extended with the narrative and joining objectives the unit now teaches)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-10; the app speaks the text. Record with the generator when the content is approved.'}

# ------------------------------------------------------------------ content
# Questions: (reading index, question, answer, explanation)
QUESTIONS = {
    1: [(0, 'Who is this story about?', 'Amal',
         'The story follows Amal on her first day at school.'),
        (0, 'Where is Amal for most of this story?', 'At school, in the classroom',
         "It is Amal's first day at school, and most of the story is in the classroom."),
        (0, 'At the end of the story, what does Amal tell her mother?', 'She learned new words and made a friend',
         'On the way home she says she learned new words, made a friend and can sing the alphabet song.'),
        (0, 'Look at the pictures in the book. Who do you see with Amal at school?', 'Her teacher and Adam',
         'The pictures show the kind teacher at the door and Adam, the boy who becomes her friend.')],
    3: [(0, 'Who is in this story?', 'Amal, Samira, Leo and Adam',
         'Amal plays with Samira and little Leo, and big brother Adam comes to help.'),
        (0, 'What is the problem in the story?', 'The ball gets stuck in a tree',
         'Leo throws the ball, it goes up into a big tree and sticks on a branch.'),
        (0, 'How is the problem solved?', 'Adam shakes the branch',
         'Adam is tall. He shakes the branch and the ball comes down.'),
        (0, 'At the end of the story, what does Amal say is the best game of all?', 'Sharing',
         'The three friends play all day, and when the sun goes down Amal says sharing is the best game of all.')],
    5: [(0, 'Who is in this story?', 'Amal, Grandma and Adam',
         'Amal visits Grandma on the farm, and her big brother Adam drives past on the tractor.'),
        (0, 'Where do Amal and Grandma spend the day?', "On Grandma's farm",
         "Amal lives near a small farm where her grandma keeps animals."),
        (0, 'At the end of the day, what does Amal eat and drink?', 'Warm bread and fresh milk',
         'That night Amal eats warm bread, drinks fresh milk from the cow and tells Grandma she loves the farm.')],
    8: [(0, 'Who is in this story?', 'Amal, Adam, Mama and Hodan',
         'Amal walks to the well with Adam; at home Mama cooks and little Hodan drinks.'),
        (0, 'What is the problem in the story?', 'No rain comes and the well gets low',
         'The land is dry, the grass turns brown and the well is getting low, so the village must share.'),
        (0, 'How does the story end?', 'The rain comes and fills the well',
         'Big clouds come, it rains, the river and the well fill up and the grass turns green again.'),
        (0, 'Look at the pictures in the book. What do the children do when the rain comes?', 'They dance in the rain',
         'The story says the children ran outside and danced in the rain.')],
    10: [(0, 'Who is this story about?', 'Amal',
          'The story is about Amal looking back at her year and sharing her new book.'),
         (0, 'How does Amal feel at the end of the story?', 'Proud',
          'When Amal finishes reading from her book, everyone claps and she feels very proud.'),
         (1, "What is 'My Capstone Steps' for?", 'It tells you how to make your book',
          'It is not a story. It is a set of steps, so it tells you what to do, in order.'),
         (1, 'Which word in the steps tells you what to do first?', 'First',
          'The steps use First, Next, Then and Finally to show the order.')],
}

# Activities: unit -> list of (title, type, instructions, answer summary for the grown-up)
ACTIVITIES = {
    1: [('Like my life?', 'Talk about the text',
         "Talk about “Amal's First Day” with your grown-up.\n1. What is the same as your own first day: a new teacher, a new friend, a song?\n2. What is different?\n3. Say one thing: 'In the story, Amal ___. I ___.'",
         "Any honest match or difference is right. The point is noticing that a story can be like real life and not exactly like it. Accept pointing or one word.")],
    3: [('Stop and guess', 'Talk about the text',
         "Read or listen to “Amal and the Big Ball” and STOP when the ball is stuck in the tree.\n1. Ask: What will happen next?\n2. Say your guess: 'I think ___.'\n3. Read on. Was your guess right?",
         "Any guess made before the page turns is a good guess - guessing is the skill. Then check it against the story: Adam comes and shakes the branch, and the ball comes down."),
        ('Once upon a time', 'Draw and tell',
         "Make up a tiny story about a ball. Say it in three parts.\n1. 'Once upon a time there was a ___.'\n2. 'One day ___.'\n3. 'In the end ___.'\nThen write the first line on paper, or copy it from your grown-up's writing.",
         "A story with a start, a middle and an end, however short. 'Once upon a time there was a red ball. One day it got stuck. In the end Adam got it down.' is perfect. Copying the first line counts as writing.")],
    5: [('Stop and guess', 'Talk about the text',
         "Read or listen to “Amal and the Little Hen” and STOP when Amal sees something warm in the straw.\n1. Ask: What will it be?\n2. Say your guess: 'I think it is ___.'\n3. Read on. Was your guess right?",
         "Any guess is a good guess before the page turns. Then check: it is a little white egg. Praise the guessing, not only a right guess.")],
    8: [('Like my life?', 'Talk about the text',
         "Talk about “The Well in the Village” with your grown-up.\n1. Where does your water come from: a well, a tap, a river?\n2. What in the story is like your home? What is different?\n3. Say one thing: 'In the story ___. At my home ___.'",
         "Any honest match or difference is right - a tap instead of a well is exactly the kind of difference to notice. Accept pointing or one word.")],
    10: [('Tell a tiny story', 'Capstone workshop',
          "Make up a tiny story for your book.\n1. Say: 'Once upon a time there was a ___.'\n2. Say what happened one day.\n3. Say how it ended.\n4. Write the first line on a page of your book, or copy it from your grown-up's writing.",
          "A story with a start, a middle and an end, in the child's own words. Copying the first line counts as writing; a drawing with one written line is a fine page.")],
}

# Grammar rules: unit -> (title, explanation, pattern, common mistake, memory tip, practice, practice type)
GRAMMAR = {
    2: ("Join two people with 'and'",
        "Say two people or two things together. Put 'and' in the middle.",
        'This is my mum and my dad.',
        "Some children say 'mum, dad' with nothing between. Put 'and' in the middle: 'mum and dad'.",
        "Hold up one finger for mum and one for dad. Press them together for 'and'.",
        'Say three: my mum and my dad. bread and milk. We eat and we talk.',
        'Say, build and use'),
    5: ("Join two jobs with 'and'",
        "Say two farm jobs in one sentence. Put 'and' in the middle.",
        'We feed the hens and we collect the eggs.',
        "Some children stop after the first job. Add 'and' and the second job: 'We feed the hens and we collect the eggs.'",
        "Two jobs, one 'and'. Clap once for the 'and'.",
        'Say three: I feed the hens and I plant a seed. The cow eats and the duck swims. Grandma works and Amal helps.',
        'Say, build and use'),
    7: ("Join two parts of a trip with 'and'",
        "Tell two parts of a trip in one sentence. Put 'and' in the middle.",
        'We walk and we take the bus.',
        "Some children say two short sentences: 'We walk. We take the bus.' Join them: 'We walk and we take the bus.'",
        "Walk two fingers along your arm, then say 'and' when the bus comes.",
        'Say three: I walk and I run. We ride the bus and we sing. First we walk and then we take the bus.',
        'Say, build and use'),
    10: ('Start a story: Once upon a time',
         "Many stories start with 'Once upon a time'. Say it, then say who the story is about.",
         'Once upon a time there was a / an ___.',
         "Some children start with 'And then'. Start with 'Once upon a time', then say who.",
         'Say it like a storyteller: slow, and a little bit magic.',
         'Tell a tiny story in three parts: Once upon a time there was a / an ___. One day ___. In the end ___.',
         'Say, build and use'),
}

# Which outcome carries which new claim: unit -> {outcome suffix: [codes]}
CLAIMS = {
    1: {'lo05': ['1Ri.01', '1Ri.02', '1Ra.06']},
    2: {'lo05': ['1Rg.04', '1Wg.05']},
    3: {'lo01': ['1Ri.02', '1Ri.10', '1Wc.01', '1Wv.02']},
    5: {'lo05': ['1Rg.04', '1Wg.05'], 'lo06': ['1Ri.02', '1Ri.10']},
    7: {'lo06': ['1Rg.04', '1Wg.05']},
    8: {'lo06': ['1Ri.01', '1Ri.02', '1Ra.06']},
    10: {'lo03': ['1Ri.02'], 'lo04': ['1Ri.04', '1Wc.01', '1Wv.02']},
}
# the outcome each unit's new items hang off (the same anchors as above)
ANCHOR = {1: 'lo05', 2: 'lo05', 3: 'lo01', 5: 'lo06', 7: 'lo06', 8: 'lo06', 10: 'lo03'}
GRAMMAR_ANCHOR = {2: 'lo05', 5: 'lo05', 7: 'lo06', 10: 'lo04'}
ACTIVITY_ANCHOR = {1: 'lo05', 3: 'lo01', 5: 'lo06', 8: 'lo06', 10: 'lo04'}


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
    stage1 = [o['code'] for o in fw['objectivesByStage']['1']]
    order = {c: i for i, c in enumerate(stage1)}
    for m in CLAIMS.values():
        for codes in m.values():
            for c in codes:
                if c not in order:
                    sys.exit('REFUSED: %s is not a Stage 1 objective' % c)

    docs, raws = {}, {}
    for n in range(1, 11):
        p = os.path.join(UNITS, 'unit-%d.json' % n)
        raws[n] = io.open(p, encoding='utf-8').read()
        docs[n] = json.loads(raws[n])
        if json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n' != raws[n]:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

    def claimed():
        s = set()
        for d in docs.values():
            for o in d['outcomes']:
                s.update(o.get('cambridgeObjectives') or [])
        return s & set(stage1)

    before = claimed()
    added = {'questions': 0, 'activities': 0, 'grammar': 0, 'keys': 0, 'codes': 0, 'flags': 0}
    changed = set()

    for n in sorted(set(QUESTIONS) | set(ACTIVITIES) | set(GRAMMAR) | set(CLAIMS)):
        d = docs[n]
        uid = d['unit']['unitId']                       # eng-g01-t01-u03
        outcome_id = lambda suffix: '%s-%s' % (uid, suffix)
        have_ids = {x.get('questionId') for x in d['comprehension']} | {x.get('activityId') for x in d['activities']} \
            | {x.get('grammarId') for x in d['grammar']} | {x.get('answerId') for x in d['answerKey']}
        next_answer = [max(int(a['answerId'].rsplit('-', 1)[1]) for a in d['answerKey'])]

        def key_row(content_id, content_type, text):
            next_answer[0] += 1
            aid = '%s-answer-%03d' % (uid, next_answer[0])
            d['answerKey'].append({'answerId': aid, 'unitId': uid, 'contentId': content_id,
                                   'contentType': content_type, 'answerOrGuidance': text,
                                   'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE})
            added['keys'] += 1

        # story questions. Ids continue the unit's numbering, but each new
        # question is placed FIRST among its reading's questions: the app's
        # story step takes the first questions of each reading in turn until
        # it has six, so a question appended at the end never reaches a child.
        # The sequence numbers are then renumbered in list order.
        # Idempotence is by the item's own text, not by id: ids are minted from
        # the current maximum, so an id-based check would mint a fresh id and
        # add every item a second time.
        have_q = {c['question'] for c in d['comprehension']}
        have_act = {a['title'] for a in d['activities']}
        have_gram = {g['title'] for g in d['grammar']}
        next_id = max(int(c['questionId'].rsplit('cq', 1)[1]) for c in d['comprehension'])
        inserted = 0
        for ridx, q, a, why in QUESTIONS.get(n, []):
            if q in have_q:
                continue
            next_id += 1
            qid = '%s-cq%02d' % (uid, next_id)
            r = d['readings'][ridx]
            item = {'questionId': qid, 'unitId': uid, 'readingId': r['readingId'], 'section': r['title'],
                    'sequence': 0, 'questionType': 'Oral, point or choose', 'question': q,
                    'correctAnswer': a, 'explanation': why, 'marks': 1,
                    'outcomeId': outcome_id(ANCHOR[n]), 'difficulty': 'Grade 1 supported',
                    'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE}
            # before the first EXISTING question of this reading, after any new one already placed
            first = next((i for i, c in enumerate(d['comprehension'])
                          if c['readingId'] == r['readingId'] and c.get('origin') != ORIGIN), len(d['comprehension']))
            d['comprehension'].insert(first, item)
            key_row(qid, 'Comprehension', 'Answer: %s. %s Accept the idea in the child\'s own words, spoken or pointed to.' % (a, why))
            added['questions'] += 1
            inserted += 1
            changed.add(n)
        if inserted:
            for i, c in enumerate(d['comprehension']):
                c['sequence'] = i + 1

        # activities
        aseq = max(x['sequence'] for x in d['activities'])
        mode = d['activities'][0].get('deliveryMode')
        for title, kind, text, summary in ACTIVITIES.get(n, []):
            if title in have_act:
                continue
            aseq += 1
            aid = '%s-act%02d' % (uid, aseq)
            d['activities'].append({
                'activityId': aid, 'unitId': uid, 'sequence': aseq, 'title': title, 'activityType': kind,
                'instructionsAndItems': text, 'answerSummary': summary,
                'outcomeId': outcome_id(ACTIVITY_ANCHOR[n]), 'deliveryMode': mode,
                'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE, 'audio': dict(NO_CLIP)})
            key_row(aid, 'Activity', summary)
            added['activities'] += 1
            changed.add(n)

        # grammar
        if n in GRAMMAR and GRAMMAR[n][0] not in have_gram:
            gseq = max(g['sequence'] for g in d['grammar']) + 1
            gid = '%s-grammar%02d' % (uid, gseq)
            if True:
                title, expl, pattern, mistake, tip, practice, ptype = GRAMMAR[n]
                d['grammar'].append({
                    'grammarId': gid, 'unitId': uid, 'conceptId': '%s-language-%d' % (uid, gseq), 'sequence': gseq,
                    'practiceType': ptype, 'title': title, 'explanation': expl, 'ruleAndExamples': pattern,
                    'commonMistake': mistake, 'memoryTip': tip, 'practice': practice,
                    'outcomeId': outcome_id(GRAMMAR_ANCHOR[n]), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG,
                    'sourceFile': SOURCE, 'audio': dict(NO_CLIP), 'practiceAudio': dict(NO_CLIP)})
                key_row(gid, 'Language practice',
                        'Accept any correct sentence built on the pattern “%s”. Model answers: %s Watch for: %s'
                        % (pattern, practice.split(': ', 1)[-1], mistake))
                added['grammar'] += 1
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

    print('\n  Grade 1 narrative structure and "and"  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    story questions added : %d   (with an answer-key row each)' % added['questions'])
    print('    activities added      : %d' % added['activities'])
    print('    grammar rules added   : %d' % added['grammar'])
    print('    answer-key rows added : %d' % added['keys'])
    print('    codes claimed         : %d on %d outcome(s) re-flagged' % (added['codes'], added['flags']))
    print('    Stage 1 coverage      : %d/%d (%.0f%%) -> %d/%d (%.0f%%)' % (
        len(before), len(stage1), 100.0 * len(before) / len(stage1), len(after), len(stage1), 100.0 * len(after) / len(stage1)))
    print('    still unclaimed       : %s' % ', '.join(sorted(set(stage1) - after)))
    print('    units touched         : %s' % ', '.join('u%d' % n for n in sorted(changed)))
    if not write and not changed:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
