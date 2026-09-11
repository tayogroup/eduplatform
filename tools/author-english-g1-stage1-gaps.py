# -*- coding: utf-8 -*-
"""Close the last two Stage 1 objectives Grade 1 English did not claim.

docs/english-g1-objective-gaps.md left Grade 1 at 88 of 90 with two open, both
as decisions rather than gaps:

  1Wp.03  join some letters, including to support multi-letter graphemes -
          "covered by the cursive module", which draws joins, but no unit
          asked a child to JOIN anything, and nothing claimed it.
  1Ww.07  ask for support in spelling unfamiliar words, and use spelling logs -
          "a classroom habit ... may belong in the Teacher & Parent Guide".

On 2026-09-11 Grades 2, 3 and 4 were closed by teaching first and claiming
second (tools/author-english-g2-stage2-gaps.py and its siblings), and the
lesson app now shows every writing task ("taskSteps"). So both are closed the
same way, with one Grade 1 writing task each, in the shape of the unit's own
tasks (tracing, a model, the grade's own success criteria and support):

  Unit 6 (sh and ch)  Writing 7 - Join sh and ch: trace, then write, the two
                      letters of each sound joined, in words the unit teaches.
  Unit 9 (city)       Writing 7 - My Word Book: ask a grown-up how to spell a
                      word you need, and keep it on a page of your own.

Flagged "Needs curriculum review"; the two outcomes widened move to a re-review
flag. Idempotent.

    python tools/author-english-g1-stage1-gaps.py          # dry run
    python tools/author-english-g1-stage1-gaps.py --write
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')
ORIGIN = 'Ehel authoring 2026-09-11 (Stage 1 gaps: joining letters for digraphs, a word book)'
SOURCE = "Authored from the unit's own phonics and words"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-11)'
MAP_FLAG = 'Needs re-review (Cambridge mapping extended with the objectives the unit now teaches, 2026-09-11)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-11; the app speaks the text. Record with the generator when the content is approved.'}
G1_CRITERIA = 'I said my idea first; I wrote or picked my letters and words; I used the model; I checked my work with an adult'

WRITING = {
    6: dict(
        title='Writing 7 - Join sh and ch',
        promptAndInstructions='The two letters in sh and ch make one sound, so we join them. Trace sh, then write it three times, joined. Trace ch, then write it three times, joined. Then write ship and chin, joining the two letters at the start.',
        modelText='sh sh sh ship. ch ch ch chin.',
        sentenceStarter='sh',
        expectedLength='Tracing and 2 words',
        completedExample={'items': ['Traced and joined: sh sh sh', 'Traced and joined: ch ch ch', 'Wrote the words: ship, chin']},
        successCriteria='I joined the s to the h, and the c to the h; ' + G1_CRITERIA,
        support='Trace over the joins on the handwriting sheet in Student resources first. An adult may guide your hand for the first join.',
        extension='Write shop and chip, and read them aloud.',
        outcome='lo02',
        key='Look for the two letters of sh and ch written joined, without lifting the pencil between them, in ship and chin. Size and neatness are not marked at this stage.'),
    9: dict(
        title='Writing 7 - My Word Book',
        promptAndInstructions='When you want to write a word and do not know how to spell it, you can ask for help. Choose a place in the city you would like to write about, such as the library or the hospital. Ask a grown-up: "How do you spell library?" Watch as they write it, then copy it into your own word book - a page with your name at the top. Add a small picture next to it. Next time, look in your word book first.',
        modelText='My word book: library, hospital, market.',
        sentenceStarter='My word book:',
        expectedLength='1-3 words with pictures',
        completedExample={'items': ['Asked: How do you spell library?', 'Copied: library, with a picture of books', 'Next time I will look in my word book first.']},
        successCriteria='I asked for help with a word; I copied it into my word book; ' + G1_CRITERIA,
        support='An adult can write the word in big letters for you to copy. Pictures are enough for words you are not ready to write.',
        extension='Add one more place and read your word book aloud.',
        outcome='lo02',
        key='The child asks for the spelling of a word they want, copies it into a page of their own, and adds a picture. Any three city words are fine; the habit is the point, not the spelling test.'),
}
CLAIMS = {6: {'lo02': ['1Wp.03']}, 9: {'lo02': ['1Ww.07']}}


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)
    fw = json.load(io.open(FRAMEWORK, encoding='utf-8'))
    stage = [o['code'] for o in fw['objectivesByStage']['1']]
    order = {c: i for i, c in enumerate(stage)}
    docs = {}
    for n in range(0, 11):
        p = os.path.join(UNITS, 'unit-%d.json' % n)
        if not os.path.exists(p):
            continue
        raw = io.open(p, encoding='utf-8', newline='').read()
        docs[n] = (json.loads(raw), "\r\n" if "\r\n" in raw else "\n")
        if json.dumps(docs[n][0], ensure_ascii=False, indent=2) + '\n' != raw.replace('\r\n', '\n'):
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

    def claimed():
        s = set()
        for n, (d, _) in docs.items():
            if n == 0:
                continue          # Unit 0 is withdrawn; it claims nothing for the grade
            for o in d['outcomes']:
                s.update(o.get('cambridgeObjectives') or [])
        return s & set(stage)

    before = claimed()
    changed, added = set(), {'writing': 0, 'codes': 0}
    for n, w in WRITING.items():
        d = docs[n][0]
        uid = d['unit']['unitId']
        if w['title'] in {x['title'] for x in d['writing']}:
            continue
        wseq = max(int(x['sequence']) for x in d['writing']) + 1
        wid = '%s-write%02d' % (uid, wseq)
        d['writing'].append({
            'writingId': wid, 'unitId': uid, 'sequence': wseq, 'practiceType': 'Grade 1 early writing',
            'title': w['title'], 'promptAndInstructions': w['promptAndInstructions'], 'modelText': w['modelText'],
            'sentenceStarter': w['sentenceStarter'], 'expectedLength': w['expectedLength'],
            'completedExample': w['completedExample'], 'successCriteria': w['successCriteria'],
            'support': w['support'], 'extension': w['extension'], 'rubricId': 'rub-g1-writing-v1',
            'outcomeId': '%s-%s' % (uid, w['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG,
            'sourceFile': SOURCE, 'audio': dict(NO_CLIP)})
        nums = [int(a['answerId'].rsplit('-', 1)[1]) for a in d['answerKey'] if a['answerId'].rsplit('-', 1)[1].isdigit()]
        aid = '%s-answer-%03d' % (uid, (max(nums) if nums else 0) + 1)
        d['answerKey'].append({'answerId': aid, 'unitId': uid, 'contentId': wid, 'contentType': 'Writing',
                               'answerOrGuidance': w['key'], 'origin': ORIGIN, 'reviewStatus': NEW_FLAG,
                               'sourceFile': SOURCE})
        added['writing'] += 1
        changed.add(n)
    for n, m in CLAIMS.items():
        d = docs[n][0]
        uid = d['unit']['unitId']
        for suffix, codes in m.items():
            o = next(o for o in d['outcomes'] if o['outcomeId'] == '%s-%s' % (uid, suffix))
            cs = list(o.get('cambridgeObjectives') or [])
            for c in codes:
                if c in cs:
                    continue
                kin = [i for i, x in enumerate(cs) if x[1:x.index('.')] == c[1:c.index('.')]]
                at = (max(kin) + 1) if kin else len(cs)
                cs.insert(at, c)
                added['codes'] += 1
                o['reviewStatus'] = MAP_FLAG
                changed.add(n)
            o['cambridgeObjectives'] = cs
    after = claimed()
    if write:
        for n in sorted(changed):
            d, nl = docs[n]
            io.open(os.path.join(UNITS, 'unit-%d.json' % n), 'w', encoding='utf-8', newline='').write(
                (json.dumps(d, ensure_ascii=False, indent=2) + '\n').replace('\n', nl))
    print('\n  Grade 1 Stage 1 gaps  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    writing tasks added : %d' % added['writing'])
    print('    codes claimed       : %d' % added['codes'])
    print('    Stage 1 coverage    : %d/%d -> %d/%d' % (len(before), len(stage), len(after), len(stage)))
    print('    still unclaimed     : %s' % (', '.join(sorted(set(stage) - after)) or 'none'))
    if not changed:
        print('    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
