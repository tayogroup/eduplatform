# -*- coding: utf-8 -*-
"""Turn the straight double-quotes in Grade 1 learner-facing text into the
curly pairs the rest of the course uses.

WHY. The Grade 1 validation (areas 4 and 19) counted straight double-quotes
mixed with curly ones - 632 curly, 196 straight in 98 strings - in a course
that teaches what a speech mark looks like. All 98 are one of two shapes: the
sixty fluency questions, `Which sentence uses the pattern "I can ___."?`, and
38 dictionary sentences of dialogue, `"Come, Amal," said her mum.`, copied
from stories whose own text is curly.

WHAT IT DOES. In every learner-facing string of the ten units, each straight
double-quote becomes an opening or a closing curly quote by alternation, and
a string whose quotes do not pair - an odd count, or a closer where an opener
is due - is refused rather than guessed at. Keys that are ids, paths, audio
descriptors, review metadata or written to the grown-up are never touched.

NO REVIEW FLAG MOVES. Every other repair in this series moved an approved
item to a re-review flag because a reviewer approved the words that were
there. A quote glyph is not a word: the reviewer read the same sentence, and
the 38 dialogue sentences have recordings that say exactly what they said
before. For the same reason the audio staleness checker folds straight and
curly quotes before comparing, so this change does not report 38 clips stale
that a listener could not tell apart.

    python tools/repair-english-g1-straight-quotes.py          # dry run
    python tools/repair-english-g1-straight-quotes.py --write

Idempotent: a second run reports nothing to do.
"""
import io
import json
import os
import re
import sys

BASE = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data')
UNITS = os.path.join(BASE, 'units')

OPEN, CLOSE = '“', '”'

# Not learner-facing, or not prose: never rewritten.
SKIP_KEYS = {
    'audio', 'audioPath', 'path', 'hash', 'voiceId', 'status', 'id', 'unitId', 'gradeId',
    'termId', 'subject', 'origin', 'sourceFile', 'reviewStatus', 'readingId', 'speakingId',
    'writingId', 'grammarId', 'quizId', 'questionId', 'activityId', 'outcomeId', 'vocabularyId',
    'selfAssessmentId', 'dictionaryEntryId', 'lemma', 'language', 'cambridgeObjectives',
    'grownUpGuide', 'teacherGuide', 'teacherNotes', 'answerSummary', 'aiTutorPrompt',
    'evidenceOfLearning', 'lectureVideo', 'poster', 'video', 'src', 'url', 'kind', 'type',
    'strand', 'skill', 'partOfSpeech', 'schemaVersion', 'audience', 'answerKey', 'rubrics',
    'assignments', 'curriculumFramework', 'cambridge', 'dictionaryVersion', 'templateVersion',
    'overviewAudio', 'learningTime', 'masterWord', 'audioStatus', 'meaningAudio',
    'sentenceAudio', 'practiceAudio', 'groupId', 'reviewOf', 'deliveryMode', 'activityType',
    'practiceType', 'questionType', 'submissionType', 'bloomLevel', 'difficulty', 'genre',
    'setting', 'theme', 'scale', 'visual',
}


def curly(text):
    """Straight double-quotes to curly pairs by alternation, or None if they
    do not pair."""
    if '"' not in text:
        return text
    if text.count('"') % 2:
        return None
    out, opening = [], True
    for ch in text:
        if ch == '"':
            out.append(OPEN if opening else CLOSE)
            opening = not opening
        else:
            out.append(ch)
    return ''.join(out)


def walk(node, path, adult, hits, refused):
    if isinstance(node, dict):
        adult_here = adult or str(node.get('audience', '')).lower() == 'adult'
        for k, v in node.items():
            if k in SKIP_KEYS:
                continue
            if isinstance(v, str) and not adult_here and '"' in v:
                fixed = curly(v)
                if fixed is None:
                    refused.append('.'.join(map(str, path + [k])))
                else:
                    node[k] = fixed
                    hits.append(('.'.join(map(str, path + [k])), v.count('"')))
            else:
                walk(v, path + [k], adult_here, hits, refused)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            if isinstance(v, str) and not adult and '"' in v:
                fixed = curly(v)
                if fixed is None:
                    refused.append('.'.join(map(str, path + [i])))
                else:
                    node[i] = fixed
                    hits.append(('.'.join(map(str, path + [i])), v.count('"')))
            else:
                walk(v, path + [i], adult, hits, refused)


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    total_strings = total_quotes = 0
    by_field = {}
    per_file = []
    refused_all = []
    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)
        hits, refused = [], []
        walk(doc, [], False, hits, refused)
        for p, c in hits:
            f = re.sub(r'\.\d+', '', p)
            by_field[f] = by_field.get(f, 0) + c
        total_strings += len(hits)
        total_quotes += sum(c for _, c in hits)
        refused_all += ['u%d %s' % (n, p) for p in refused]
        per_file.append((n, len(hits)))
        if write and hits:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    if refused_all:
        sys.exit('REFUSED: quotes do not pair in %d string(s): %s' % (len(refused_all), '; '.join(refused_all)))

    print('\n  Grade 1 straight quotes  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    strings rewritten : %d   (%d quote marks, %d pairs)' % (total_strings, total_quotes, total_quotes // 2))
    for f, c in sorted(by_field.items(), key=lambda kv: -kv[1]):
        print('      %-40s %d' % (f, c))
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if not write and total_strings == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
