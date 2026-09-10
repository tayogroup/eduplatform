# -*- coding: utf-8 -*-
"""Replace phoneme notation in the Grade 1 text a child reads or hears with
the sound named in words.

WHY. The Grade 1 validation (areas 1 and 19) found slash notation - /b/,
/sh/, /s/, /op/, /z/ - in quiz explanations and grammar notes across five
live units. It is teacher notation: a five-year-old cannot read it, and the
voice cannot say it - the browser voice reads /m/ as the letter name or
skips it, and the speakable-frames rule drops a slash altogether. The same
sentence written as "the b sound" reads and narrates as intended.

WHAT IT TOUCHES: the quiz explanations and the grammar `commonMistake` and
`memoryTip` notes - the fields the app renders. The quiz answer keys mirror
their explanations ("Correct option: X. <why>") and are rewritten with them,
exactly as repair-english-g1-quiz-explanations.py does. The grammar answer
keys quote the old `commonMistake` inside a "Watch for:" line written to the
teacher; those are left as they are, because the notation is right for a
teacher and wrong only for a child.

NO AUDIO IS AFFECTED: the grammar clip narrates explanation + ruleAndExamples,
never the two notes, and a quiz has no clip.

    python tools/repair-english-g1-phoneme-notation.py          # dry run
    python tools/repair-english-g1-phoneme-notation.py --write

Idempotent: a second run reports nothing to do. A rule whose old text and
new text are both absent refuses the run, so a drifted source cannot be
half-fixed in silence. It also re-scans every learner-facing field afterwards
and refuses to report success while any notation is left in one.
"""
import importlib.util
import io
import json
import os
import re
import sys

BASE = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data')
UNITS = os.path.join(BASE, 'units')

REVIEW_FLAG = 'Needs re-review (phoneme notation replaced with the sound named in words)'

_spec = importlib.util.spec_from_file_location(
    'qx', os.path.join('tools', 'repair-english-g1-quiz-explanations.py'))
_qx = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_qx)
key_line = _qx.key_line

# The gate's own pattern: a slash that is not part of a word or a path.
NOTATION = re.compile(r'(?<![\w/])/([a-z]{1,3})/(?![\w/])')

# The fields a child reads or hears. answerKey is the teacher's and is not here.
LEARNER_FIELDS = [('quizzes', 'question'), ('quizzes', 'explanation'),
                  ('grammar', 'explanation'), ('grammar', 'ruleAndExamples'),
                  ('grammar', 'commonMistake'), ('grammar', 'memoryTip'), ('grammar', 'practice'),
                  ('activities', 'instructionsAndItems'), ('readings', 'passageScript'),
                  ('comprehension', 'question'), ('comprehension', 'explanation'),
                  ('fluency', 'question'), ('fluency', 'explanation'),
                  ('speaking', 'instructionsAndModelLines'), ('writing', 'promptAndInstructions')]

# (unit, top-level key, field, old substring, new substring)
RULES = [
    (1, 'quizzes', 'explanation',
     'Book and bag both start with /b/. Pen starts with /p/, cup with /k/ and mat with /m/.',
     'Book and bag both start with the b sound. Pen starts with the p sound, cup with the c sound '
     'and mat with the m sound.'),
    (2, 'grammar', 'commonMistake',
     "Listen for the /sh/: girls and women take 'she'.",
     "Listen for the sh sound: girls and women take 'she'."),
    (2, 'grammar', 'memoryTip',
     "'She' begins with /sh/, like Samira's quiet shhh.",
     "'She' begins with the sh sound, like Samira's quiet shhh."),
    (2, 'quizzes', 'explanation',
     'Sister and sun both start with /s/. Mat, dog and pen start with /m/, /d/ and /p/.',
     'Sister and sun both start with the s sound. Mat, dog and pen start with the m, d and p sounds.'),
    (3, 'quizzes', 'explanation',
     'Hop and top both end with the /op/ sound. Hat, hen and sun end in different sounds.',
     'Hop and top both end with the same sound: op. Hat, hen and sun end in other sounds.'),
    (6, 'grammar', 'commonMistake',
     "say 'eyes' with a /z/ sound at the end.",
     "say 'eyes' with a z sound at the end."),
    (8, 'grammar', 'commonMistake',
     "'A plant need water' misses the /s/.",
     "'A plant need water' misses the s at the end."),
    (8, 'grammar', 'memoryTip',
     'Listen for that little /s/ sound at the end.',
     'Listen for that little s sound at the end.'),
    (9, 'grammar', 'commonMistake',
     "'A doctor work at the clinic' misses the /s/.",
     "'A doctor work at the clinic' misses the s at the end."),
    (9, 'grammar', 'memoryTip',
     'One worker gets an /s/ on the end: works, teaches, helps.',
     'One worker gets an s on the end: works, teaches, helps.'),
]


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    applied = {i: 0 for i in range(len(RULES))}
    already = {i: 0 for i in range(len(RULES))}
    per_file = []
    fields = flags = keys = 0
    before = after = 0
    left = []

    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

        for key, field in LEARNER_FIELDS:
            for item in doc.get(key, []):
                if isinstance(item.get(field), str):
                    before += len(NOTATION.findall(item[field]))

        changed = set()
        file_changed = 0
        for i, (unit, key, field, old, new) in enumerate(RULES):
            if unit != n:
                continue
            for j, item in enumerate(doc.get(key, [])):
                text = item.get(field)
                if not isinstance(text, str):
                    continue
                if old in text:
                    item[field] = text.replace(old, new)
                    applied[i] += 1
                    changed.add((key, j))
                    file_changed += 1
                elif new in text:
                    already[i] += 1

        touched_quiz = set()
        for key, j in changed:
            item = doc[key][j]
            if not str(item.get('reviewStatus', '')).startswith('Needs re-review'):
                item['reviewStatus'] = REVIEW_FLAG
                flags += 1
                file_changed += 1
            if key == 'quizzes':
                touched_quiz.add(item['questionId'])
        quizzes = {q['questionId']: q for q in doc.get('quizzes', [])}
        for a in doc.get('answerKey', []):
            if a.get('contentType') != 'Quiz':
                continue
            q = quizzes.get(a['contentId'])
            if not q:
                continue
            expected = key_line(q['correctAnswer'], q['explanation'])
            if a['answerOrGuidance'] != expected:
                a['answerOrGuidance'] = expected
                keys += 1
                file_changed += 1
            if a['contentId'] in touched_quiz and not str(a.get('reviewStatus', '')).startswith('Needs re-review'):
                a['reviewStatus'] = REVIEW_FLAG
                flags += 1
                file_changed += 1

        for key, field in LEARNER_FIELDS:
            for j, item in enumerate(doc.get(key, [])):
                if isinstance(item.get(field), str):
                    hits = NOTATION.findall(item[field])
                    after += len(hits)
                    for h in hits:
                        left.append('u%d %s.%d.%s /%s/' % (n, key, j, field, h))

        fields += len(changed)
        per_file.append((n, file_changed))
        if write and file_changed:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    dead = [i for i in applied if applied[i] == 0 and already[i] == 0]
    if dead:
        sys.exit('REFUSED: %d rule(s) match nothing, old or new - the source has drifted: %s'
                 % (len(dead), '; '.join(repr(RULES[i][3][:50]) for i in dead)))

    print('\n  Grade 1 phoneme notation  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    fields rewritten      : %d' % fields)
    print('    notations, learner text: %d -> %d' % (before, after))
    print('    approval flags moved  : %d' % flags)
    print('    answer keys re-mirrored: %d' % keys)
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if left:
        print('    STILL IN LEARNER TEXT: ' + '; '.join(left))
    if not write and fields == 0:
        print('\n    nothing to do - already applied.')
    print('')
    if left:
        sys.exit(1)


if __name__ == '__main__':
    main()
