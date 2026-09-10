# -*- coding: utf-8 -*-
"""Replace the long words outside the Grade 1 dictionary in the text the
grade-1-v2 app puts in front of a child.

WHY. The Grade 1 validation (area 6, the third of its three required changes)
counted words of three or more syllables and eight or more letters that are
in neither the master dictionary nor the core-word list, across the seven
text categories it measured reading levels on: 47 distinct words, 180
occurrences, 133 of them rendered by grade-1-v2. Most are plurals and
compounds the metric cannot see past - "something", "together", "sentences",
"pictures", "alphabet" - and a child who cannot read them yet meets them in
the one sentence that tells them what to do.

WHAT IT REWRITES, and what it leaves. Every occurrence in a field the app
renders that is NOT a story: the quiz questions and explanations, the
grammar explanations, the activity instructions and the one unit overview
line the app shows. The story passages are left alone on purpose: they are
the teaching text the review praised at FK 1.63, each is one whole-story
recording, and the words flagged there are a town (Hargeisa), a song (Old
MacDonald), a day (Saturday) and a handful of everyday words - not worth
rewriting a story and paying to re-record it. The poems, the learning paths
and the other nine overviews are not rendered by the app and are left too.

THE AUDIO. Quiz text is spoken by the runtime voice, so those changes cost
nothing. Grammar explanations and activity instructions carry pre-rendered
clips, and a clip named for its slot keeps its name when the words change -
so each changed one is marked `available: false` with a status saying why.
The app's builder then leaves the clip out and the page speaks the new words
itself; the legacy shell shows them as pending. Re-recording is a separate,
paid step:

    node tools/generate-ehel-english-audio.js grammar 1 --dry
    node tools/generate-ehel-english-audio.js activities 1 --dry

The quiz answer keys mirror their explanations ("Correct option: X. <why>")
and are rewritten with them, exactly as repair-english-g1-quiz-explanations.py
does, so the teacher's key and the child's feedback cannot drift.

    python tools/repair-english-g1-long-words.py          # dry run
    python tools/repair-english-g1-long-words.py --write

Idempotent: a second run reports nothing to do. A rule whose old text is
found nowhere AND whose new text is found nowhere refuses the run, so a
drifted source cannot be silently half-fixed.
"""
import importlib.util
import io
import json
import os
import re
import sys

BASE = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data')
UNITS = os.path.join(BASE, 'units')

REVIEW_FLAG = 'Needs re-review (long words replaced for the learner reading level)'
AUDIO_STATUS = ('Needs re-record - text rewritten on 2026-09-10 (long words replaced for the '
                'learner reading level); the clip on disk says the old words. The generator '
                'reuses an existing mp3, so re-record with --force.')

# key_line() is the quiz tool's, imported rather than copied: the key format
# has one definition.
_spec = importlib.util.spec_from_file_location(
    'qx', os.path.join('tools', 'repair-english-g1-quiz-explanations.py'))
_qx = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_qx)
key_line = _qx.key_line

ALL = None

# (unit or ALL, top-level key, field, old substring, new substring).
# Substrings, not whole fields, so a boilerplate line shared by ten units is
# one rule, and a rule can never overwrite words it was not written for.
RULES = [
    (ALL, 'activities', 'instructionsAndItems',
     'This one brings the unit together. Do each part.',
     'This one uses the whole unit. Do each part.'),
    (ALL, 'activities', 'instructionsAndItems',
     'Say the alphabet to help you.',
     'Say your ABC to help you.'),
    (1, 'activities', 'instructionsAndItems',
     'Then match each circle to something in the room of the same colour and say its name.',
     'Then find a thing in the room that is the same colour as each circle, and say its name.'),
    (1, 'activities', 'instructionsAndItems',
     '3. Something you wear on your head to keep warm or shady.',
     '3. A thing you wear on your head to keep warm or shady.'),
    (1, 'grammar', 'explanation',
     'After naming something, tell us about it.',
     'After you name a thing, tell us about it.'),
    (1, 'grammar', 'explanation',
     'Use this sentence whenever you meet someone new.',
     'Use this sentence each time you meet someone new.'),
    (1, 'grammar', 'explanation',
     "Share something you enjoy. Say 'I like' and then add the thing or the activity.",
     "Share a thing you enjoy. Say 'I like' and then add the thing you like, or what you like to do."),
    (1, 'quizzes', 'question',
     'Which word names something you find in your classroom?',
     'Which word names a thing you find in your classroom?'),
    (1, 'quizzes', 'explanation',
     'The other sentences do not describe what he is holding.',
     'The other ones do not say what he is holding.'),
    (1, 'quizzes', 'explanation',
     'The other sentences only name things or a person.',
     'The other ones only name things or a person.'),
    (1, 'quizzes', 'question',
     'Which sentence tells something you are able to do?',
     'Which sentence tells what you are able to do?'),
    (1, 'quizzes', 'question',
     'Where should you put your book when the lesson has finished?',
     'Where should you put your book when the lesson is over?'),
    (2, 'activities', 'instructionsAndItems', '4. grandmother.', '4. grandma.'),
    (2, 'activities', 'instructionsAndItems',
     '2. We count to ______ together.',
     '2. We all count to ______.'),
    (2, 'grammar', 'explanation',
     'Count first, then say the number and the thing together.',
     'Count first. Then say the number, then the thing.'),
    (ALL, 'quizzes', 'question', 'Which word completes the sentence:', 'Which word fills the gap:'),
    (3, 'quizzes', 'question', 'Which word completes the instruction:', 'Which word fills the gap:'),
    (2, 'quizzes', 'question',
     'Which sentence about counting your family is written correctly?',
     'Which sentence about counting your family is right?'),
    (ALL, 'quizzes', 'explanation',
     'Only this one asks something and ends with a question mark.',
     'Only this one asks a question and ends with a question mark.'),
    (3, 'quizzes', 'explanation', 'The others are telling sentences.', 'The others just tell us things.'),
    (3, 'activities', 'instructionsAndItems', 'Look at the animal pictures.', 'Look at each animal picture.'),
    (3, 'activities', 'instructionsAndItems',
     '4. To knock something with your hand or with a bat.',
     '4. To knock a thing with your hand or with a bat.'),
    (3, 'grammar', 'explanation',
     "Put a ball somewhere, then tell us where it sits. 'On' means it is resting on top of something.",
     "Put a ball down, then tell us where it sits. 'On' means it is on top of a thing."),
    (3, 'grammar', 'explanation',
     'Talk about what is happening this very moment.',
     'Talk about what is going on right now.'),
    (3, 'quizzes', 'explanation', 'Jump is something your body does.', 'Jump is a thing your body does.'),
    (3, 'quizzes', 'question',
     'Which word is an action word, something you do?',
     'Which word is an action word, a thing you do?'),
    (3, 'quizzes', 'question',
     'Which action do you do by putting your two hands together?',
     'Which action do you do when your two hands meet?'),
    (3, 'quizzes', 'explanation',
     'Sleeping, eating and writing are not ball movements.',
     'Sleeping, eating and writing are not ways a ball moves.'),
    (3, 'quizzes', 'explanation',
     'Running is fast leg movement. Sitting is still, and looking and listening use your eyes and ears.',
     'Running is your legs moving fast. Sitting is still. Looking uses your eyes and hearing uses your ears.'),
    (3, 'quizzes', 'explanation', 'Under is the position word.', 'Under is the word that tells where.'),
    (3, 'quizzes', 'explanation',
     'The other sentences would leave a friend out.',
     'The other ones would leave a friend out.'),
    (3, 'unit', 'unitOverview',
     'the words that say where something is:',
     'the words that say where a thing is:'),
    (4, 'activities', 'instructionsAndItems',
     'Draw something you made this week.',
     'Draw a thing you made this week.'),
    (4, 'activities', 'instructionsAndItems',
     '3. A container with straight sides for keeping things inside.',
     '3. A thing with straight sides that you keep things in.'),
    (4, 'grammar', 'explanation',
     'The describing word comes first.',
     'The word that tells what it is like comes first.'),
    (4, 'quizzes', 'explanation', 'Soft tells how something feels.', 'Soft tells how a thing feels.'),
    (4, 'quizzes', 'question',
     'Which of these words tells you the colour of something?',
     'Which of these words tells you the colour of a thing?'),
    (4, 'quizzes', 'explanation', 'Red and yellow together make orange.', 'Red mixed with yellow makes orange.'),
    (4, 'quizzes', 'question',
     'Sami has made a red square. Which sentence describes it?',
     'Sami has made a red square. Which sentence tells about it?'),
    (4, 'quizzes', 'question',
     'Which thing do you use to stick two pieces of paper together?',
     'Which thing do you use to stick one piece of paper to another?'),
    (4, 'quizzes', 'explanation',
     'Making, cutting and painting are things you do before it is finished.',
     'Making, cutting and painting are things you do before it is done.'),
    (5, 'quizzes', 'explanation',
     'The -ing word running shows an action happening now.',
     'The -ing word running shows an action going on now.'),
    (5, 'quizzes', 'explanation', 'First shows the beginning.', 'First shows the start.'),
    (5, 'quizzes', 'question',
     'Which word do we use to tell what happens at the beginning of a story?',
     'Which word do we use to tell what happens at the start of a story?'),
    (6, 'activities', 'instructionsAndItems',
     'Draw something you love to look at, such as the night sky.',
     'Draw a thing you love to look at, such as the night sky.'),
    (6, 'activities', 'instructionsAndItems', 'Play a listening game.', 'Play a game with sounds.'),
    (6, 'grammar', 'explanation',
     'Cup your ears with your hands and listen carefully.',
     'Cup your ears with your hands and listen hard.'),
    (6, 'grammar', 'explanation',
     'Touch something safely, then describe it.',
     'Touch a thing safely, then tell us about it.'),
    (6, 'grammar', 'explanation',
     'Hold one thing in each hand and compare them. Add -er to your describing word.',
     'Hold one thing in each hand and say which is more. Add -er to the word: big, bigger.'),
    (6, 'grammar', 'explanation',
     'Ask this question, then work out the answer together:',
     'Ask this question, then work out the answer with your grown-up:'),
    (6, 'quizzes', 'explanation', 'so the other sentences are mixed up.', 'so the other ones are mixed up.'),
    (6, 'quizzes', 'explanation',
     'The word than compares two things. The other sentences only describe one box.',
     'The word than sets two things side by side. The other ones only tell about one box.'),
    (6, 'quizzes', 'question',
     'Which sentence compares two things?',
     'Which sentence talks about two things at once?'),
    (7, 'grammar', 'explanation', 'a bus, an aeroplane.', 'a bus, an old car.'),
    (7, 'grammar', 'explanation',
     "Use 'we' when you and other people do something.",
     "Use 'we' when you and other people do a thing."),
    (7, 'quizzes', 'explanation',
     'A window, an apple and a cloud do not take you anywhere.',
     'A window, an apple and a cloud do not take you on a trip.'),
    (7, 'quizzes', 'explanation',
     'The other sentences have the words in the wrong order or the wrong form.',
     'The other ones have the words in the wrong order or the wrong form.'),
    (7, 'quizzes', 'explanation',
     'Fast means quick. Slow is the opposite, heavy tells weight and quiet tells sound.',
     'Fast means quick. Slow is not fast at all, heavy tells weight and quiet tells sound.'),
    (7, 'quizzes', 'question',
     'Which word tells you that something moves very quickly?',
     'Which word tells you that a thing moves very quickly?'),
    (7, 'quizzes', 'explanation',
     'Stopping, looking and listening keeps you safe. The other choices are all dangerous.',
     'Stop, look and listen keeps you safe. The other choices could hurt you.'),
    (7, 'quizzes', 'explanation', 'to show it is happening now.', 'to show it is going on now.'),
    (8, 'activities', 'instructionsAndItems',
     'Choose drinking, washing or watering the plants.',
     'Choose drinking, washing or giving the plants a drink.'),
    (8, 'grammar', 'explanation',
     'Drop something safely into water and watch.',
     'Drop a thing safely into water and watch.'),
    (8, 'grammar', 'explanation',
     "'Must not' tells us something we should never do.",
     "'Must not' tells us a thing we should never do."),
    (8, 'quizzes', 'explanation',
     'Rain makes clothes wet. Dry is the opposite, and hot and loud do not describe rainy clothes.',
     'Rain makes clothes wet. Dry is not wet at all, and hot and loud do not tell us about rainy clothes.'),
    (8, 'quizzes', 'explanation', 'Dry is the opposite of wet.', 'Dry means not wet.'),
    (8, 'quizzes', 'question', 'Which word means the opposite of wet?', 'Which word means not wet?'),
    (8, 'quizzes', 'explanation',
     'The other sentences have the words muddled up.',
     'The other ones have the words muddled up.'),
    (9, 'grammar', 'explanation',
     "Use 'please' when you ask for something,",
     "Use 'please' when you ask for a thing,"),
    (9, 'quizzes', 'explanation', 'and wet describes something.', 'and wet tells what a thing is like.'),
    (9, 'quizzes', 'explanation',
     'The library is where books are kept and borrowed.',
     'The library is where you go to get books to read.'),
    (9, 'quizzes', 'explanation',
     'Under, inside and in tell us something different.',
     'Under, inside and in tell us other places.'),
    (9, 'quizzes', 'explanation',
     'The other sentences are missing it or muddled.',
     'The other ones are missing it or muddled.'),
    (10, 'activities', 'instructionsAndItems', '2. a picture you coloured,', '2. a picture you made with colours,'),
    (10, 'activities', 'instructionsAndItems',
     'Put four story pictures in order.',
     'Put four picture cards from the story in order.'),
    (10, 'grammar', 'explanation',
     'add your favourite thing or activity.',
     'add your favourite thing, or what you love to do.'),
    (10, 'grammar', 'explanation', 'Name anything near you.', 'Name a thing near you.'),
    (10, 'quizzes', 'explanation',
     'The other actions are dangerous or unkind.',
     'The other actions are not safe, or unkind.'),
    (10, 'quizzes', 'explanation',
     'Practising and checking helps you share your best work.',
     'Doing it again and checking helps you share your best work.'),
]

# Blocks whose pre-rendered clip narrates the words being changed: the grammar
# clip reads explanation + ruleAndExamples, the activity clip reads
# instructionsAndItems (generate-ehel-english-audio.js). A quiz has no clip;
# the unit overview's clip belongs to the legacy shell and the app does not
# play it.
CLIP_KEYS = {'grammar', 'activities'}

VOWELS = 'aeiouy'


def syllables(word):
    n, prev = 0, False
    for ch in word:
        v = ch in VOWELS
        if v and not prev:
            n += 1
        prev = v
    if word.endswith('e') and n > 1:
        n -= 1
    return max(n, 1)


def known_words():
    dic = json.load(io.open(os.path.join(BASE, 'master-dictionary.grade1.json'), encoding='utf-8'))
    known = set()
    for e in dic['entries']:
        for k in ('lemma', 'displayWord'):
            if e.get(k):
                known.add(e[k].lower())
    cw = json.load(io.open(os.path.join(BASE, 'core-words.json'), encoding='utf-8'))
    for u in cw.get('units', []):
        for g in u.get('groups', []):
            for w in g.get('words', []):
                known.add((w if isinstance(w, str) else w.get('word', '')).lower())
    return known


def long_words(text, known):
    out = []
    for t in re.findall(r"[A-Za-z']+", text):
        w = re.sub(r'[^a-z]', '', t.lower().replace("'s", ''))
        if len(w) >= 8 and syllables(w) >= 3 and w not in known:
            out.append(w)
    return out


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    known = known_words()
    applied = {i: 0 for i in range(len(RULES))}
    already = {i: 0 for i in range(len(RULES))}
    per_file = []
    totals = {'fields': 0, 'flags': 0, 'clips': 0, 'keys': 0}
    before = after = 0

    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

        changed_items = set()   # (key, index)
        file_changed = 0
        for i, (unit, key, field, old, new) in enumerate(RULES):
            if unit is not ALL and unit != n:
                continue
            items = [doc['unit']] if key == 'unit' else doc.get(key, [])
            for j, item in enumerate(items):
                text = item.get(field)
                if not isinstance(text, str):
                    continue
                if old in text:
                    before += len(long_words(text, known))
                    item[field] = text.replace(old, new)
                    after += len(long_words(item[field], known))
                    applied[i] += 1
                    changed_items.add((key, j))
                    file_changed += 1
                elif new in text:
                    already[i] += 1

        # the approval, the clip and the answer key all belong to the old words
        quizzes = {q['questionId']: q for q in doc.get('quizzes', [])}
        touched_quiz = set()
        for key, j in changed_items:
            if key == 'unit':
                continue
            item = doc[key][j]
            if item.get('reviewStatus') != REVIEW_FLAG:
                item['reviewStatus'] = REVIEW_FLAG
                totals['flags'] += 1
                file_changed += 1
            if key == 'quizzes':
                touched_quiz.add(item['questionId'])
            a = item.get('audio')
            if key in CLIP_KEYS and a and a.get('available') is not False:
                a['available'] = False
                a['status'] = AUDIO_STATUS
                totals['clips'] += 1
                file_changed += 1
        for a in doc.get('answerKey', []):
            if a.get('contentType') != 'Quiz':
                continue
            q = quizzes.get(a['contentId'])
            if not q:
                continue
            expected = key_line(q['correctAnswer'], q['explanation'])
            if a['answerOrGuidance'] != expected:
                a['answerOrGuidance'] = expected
                totals['keys'] += 1
                file_changed += 1
            if a['contentId'] in touched_quiz and a.get('reviewStatus') != REVIEW_FLAG:
                a['reviewStatus'] = REVIEW_FLAG
                totals['flags'] += 1
                file_changed += 1

        totals['fields'] += len(changed_items)
        per_file.append((n, file_changed))
        if write and file_changed:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    dead = [i for i in applied if applied[i] == 0 and already[i] == 0]
    if dead:
        sys.exit('REFUSED: %d rule(s) match nothing, old or new - the source has drifted: %s'
                 % (len(dead), '; '.join(repr(RULES[i][3][:50]) for i in dead)))

    print('\n  Grade 1 long words  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    fields rewritten     : %d' % totals['fields'])
    print('    long words in them   : %d -> %d' % (before, after))
    print('    approval flags moved : %d' % totals['flags'])
    print('    clips marked stale   : %d   (grammar + activities; re-record with --force)' % totals['clips'])
    print('    answer keys re-mirrored: %d' % totals['keys'])
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if not write and totals['fields'] == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
