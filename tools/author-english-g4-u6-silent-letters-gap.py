# -*- coding: utf-8 -*-
"""Author real teaching for 4Ww.01 in Grade 4 Unit 6 ('People in Society').

WHAT WAS WRONG. 4Ww.01 ("Explore and use silent letters (e.g. knife, lamb)
and different spellings of words with vowel phonemes (e.g. short vowel
phonemes: umbrella, young and love ('o' before 'v'); long vowel phonemes
after 'w': want, war, water, word)") was already CITED on outcome
eng-g04-t02-u06-lo01 before this script ever ran - so the 2026-09-11 gap
sweep (author-english-g4-stage4-gaps.py), which only detects UNCITED
objectives, never saw it as missing. But lo01 and every item hung off it
teach jobs vocabulary and the Present Simple; nothing in the unit - checked
by grep for "silent letter" and "vowel phoneme" across the whole file -
taught silent letters or the w-changes-a-vowel pattern. A citation that
doesn't share a single line with what it names is worth zero: same shape as
the dead-but-cited codes documented in CLAUDE.md's "citation gate" lesson.

THE FIX adds one real grammar item to Unit 6, in the shape the other Stage
1-4 gap-closing passes already used for this exact objective family (compare
Grade 2 Unit 7 "One Spelling, Two Sounds: ow and o", Grade 2 Unit 9 "Magic e:
Split Digraphs", Grade 3 Unit 6 "Same Letters, Different Sounds", Grade 5
Unit 8 "Same Letters, Different Sounds" - all bundle a phonics/spelling
micro-lesson onto an outcome whose headline sentence is about something else,
tied only by outcomeId). It is claimed on the SAME outcome (lo01) that
already carries the code - the citation was never wrong about WHERE, only
about WHAT was taught there - so no cambridgeObjectives edit is needed, only
real content. Every framework example word (knife, lamb, umbrella, young,
love, want, war, water, word) appears in the new item.

The audio descriptor is marked unavailable, so the app speaks the text via
its runtime TTS fallback until a recording is commissioned - no paid TTS
call is made by this script.

    python tools/author-english-g4-u6-silent-letters-gap.py           # dry run
    python tools/author-english-g4-u6-silent-letters-gap.py --write

Idempotent: if a grammar item with this title already exists, nothing changes.
"""
import io
import json
import os
import sys

ROOT = os.path.join('src', 'prototypes', 'ehel-academy', 'english')
UNIT_PATH = os.path.join(ROOT, 'grade-4', 'data', 'units', 'unit-6.json')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')
CODE = '4Ww.01'
OUTCOME_ID = 'eng-g04-t02-u06-lo01'
ORIGIN = 'Ehel authoring 2026-09-17 (4Ww.01 was cited on lo01 with no matching content - closing that gap)'
SOURCE = "Authored from the Cambridge 0058 objective's own example words"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-17)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-17; the app speaks the text. Record with the generator when the content is approved.'}

GRAMMAR_ITEM = dict(
    title='Silent Letters and Tricky Vowels',
    practiceType='Guided recognition',
    explanation="Some letters are written but never said - they are silent. And some vowels do not make the sound you expect, especially straight after v, or anywhere in a word that starts with w. You cannot always spell these words by their sound alone; you learn the pattern, then the word.",
    ruleAndExamples="Silent letters: knife, know, knee (silent k); lamb, comb, thumb (silent b).\n'o' or 'ou' saying a short u, as in cup: love, glove, above (o before v); young, touch, country (ou).\nAfter w, a vowel changes to a sound you don't expect: want, watch, wasp; war, warm, reward; water; word, work, world.",
    commonMistake="Sounding a word out letter by letter and putting the silent letter back in - “k-nife”, “lam-b” - or spelling want and word as they sound, “wont” and “wurd”. After w, trust the pattern in the spelling, not the sound in your ear.",
    memoryTip="Silent letters hide and never speak: knife, lamb. And w is a magic letter - stand it in front of a vowel and the vowel changes its mind: want, war, water, word.",
    practice="Sort these words into three groups: knife, lamb, love, young, want, war, water, word. | has a silent letter: ______ | 'o' or 'ou' says a short u, as in cup: ______ | changes after w, not what the spelling suggests: ______ | Check yourself: silent letter: knife, lamb; short u sound: love, young; changes after w: want, war, water, word.",
)


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    fw = json.load(io.open(FRAMEWORK, encoding='utf-8'))
    stage4 = {o['code']: o['text'] for o in fw['objectivesByStage']['4']}
    if CODE not in stage4:
        sys.exit('REFUSED: %s is not a Stage 4 objective in %s' % (CODE, FRAMEWORK))
    print('  %s: %s' % (CODE, stage4[CODE]))

    raw = io.open(UNIT_PATH, encoding='utf-8').read()
    d = json.loads(raw)
    if json.dumps(d, ensure_ascii=False, indent=2) + '\n' != raw:
        sys.exit('REFUSED: unit-6.json does not round-trip through this writer.')

    outcome = next((o for o in d['outcomes'] if o['outcomeId'] == OUTCOME_ID), None)
    if outcome is None:
        sys.exit('REFUSED: no outcome %s in unit-6.json' % OUTCOME_ID)
    if CODE not in (outcome.get('cambridgeObjectives') or []):
        sys.exit('REFUSED: %s is not currently cited on %s - this script only ADDS content for an '
                  'existing citation, it does not move the citation. Re-check before editing.' % (CODE, OUTCOME_ID))

    have = {g['title'] for g in d['grammar']}
    if GRAMMAR_ITEM['title'] in have:
        print('\n  nothing to do - "%s" already exists in unit-6.json.\n' % GRAMMAR_ITEM['title'])
        return

    uid = d['unit']['unitId']
    gseq = max(x['sequence'] for x in d['grammar']) + 1
    gid = '%s-grammar%02d' % (uid, gseq)
    slug = ''.join(ch if ch.isalnum() else '-' for ch in GRAMMAR_ITEM['title'].lower()).strip('-')
    while '--' in slug:
        slug = slug.replace('--', '-')

    d['grammar'].append({
        'grammarId': gid, 'conceptId': '%s-concept-%s' % (gid, slug), 'unitId': uid, 'sequence': gseq,
        'practiceType': GRAMMAR_ITEM['practiceType'], 'title': GRAMMAR_ITEM['title'],
        'explanation': GRAMMAR_ITEM['explanation'], 'ruleAndExamples': GRAMMAR_ITEM['ruleAndExamples'],
        'commonMistake': GRAMMAR_ITEM['commonMistake'], 'memoryTip': GRAMMAR_ITEM['memoryTip'],
        'practice': GRAMMAR_ITEM['practice'], 'outcomeId': OUTCOME_ID, 'origin': ORIGIN,
        'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE,
        'audio': dict(NO_CLIP), 'practiceAudio': dict(NO_CLIP),
    })

    answer_numbers = [int(a['answerId'].rsplit('-', 1)[1]) for a in d['answerKey'] if a['answerId'].rsplit('-', 1)[1].isdigit()]
    next_answer = (max(answer_numbers) if answer_numbers else 0) + 1
    aid = '%s-answer-%03d' % (uid, next_answer)
    while any(a['answerId'] == aid for a in d['answerKey']):
        next_answer += 1
        aid = '%s-answer-%03d' % (uid, next_answer)
    d['answerKey'].append({
        'answerId': aid, 'unitId': uid, 'contentId': gid, 'contentType': 'Language practice',
        'answerOrGuidance': 'The practice line carries its own key after "Check yourself". Watch for: %s' % GRAMMAR_ITEM['commonMistake'],
        'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE,
    })

    if write:
        io.open(UNIT_PATH, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(d, ensure_ascii=False, indent=2) + '\n')

    print('\n  Grade 4 Unit 6 - 4Ww.01 gap  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    grammar item added : 1 (%s, sequence %d)' % (gid, gseq))
    print('    answer-key row added: 1 (%s)' % aid)
    print('    outcome             : %s (citation unchanged, now evidenced)' % OUTCOME_ID)
    print('')


if __name__ == '__main__':
    main()
