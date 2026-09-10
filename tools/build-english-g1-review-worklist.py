# -*- coding: utf-8 -*-
"""Build the Grade 1 English reviewer worklist as a single self-contained page.

WHY THIS EXISTS. The Grade 1 English validation left 2,133 items carrying no
curriculum reviewer's approval. A flat list of 2,133 ids is not reviewable;
what makes it reviewable in an afternoon is knowing, per item, WHICH KIND of
reading it needs. Three lanes, and the lane is derived from git rather than
claimed:

    CHANGED   the item existed at the baseline and its text differs now.
              The reviewer compares two columns and says yes or no. Fastest.
    NEW       the item is absent from the baseline. Nobody has read it.
    STANDING  unchanged today, and simply never approved. The largest lane.

Measured across the 371 changed items: a card renders 3.4 fields when only 1.1
of them moved, and 45% of the characters on screen never changed. So the page
puts the moved fields first, word-diffed, and folds the rest away.

    python tools/build-english-g1-review-worklist.py --out <page.html>
    python tools/build-english-g1-review-worklist.py --baseline <sha> --json-only <f>

The baseline defaults to the commit before the 2026-09-10 rewrites.

WHAT IT REFUSES TO DO. It never writes a review status onto any item, and the
page it builds never writes one either. "Approved - curriculum reviewer" is a
claim only a person can make; this tool only lays out what they have to read.
"""
import argparse
import collections
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Forward slashes, always: these are git pathspecs as well as file paths, and
# `git show <sha>:src\prototypes\...` fails on Windows. It fails QUIETLY here,
# because a missing baseline file reads as "this item is new" - which showed up
# as all 2,133 items landing in the NEW lane rather than as an error.
DATA = 'src/prototypes/ehel-academy/english/grade-1/data'
UNITS = DATA + '/units'
MASTER = DATA + '/master-dictionary.grade1.json'
TEMPLATE = os.path.join(ROOT, 'tools', 'english-g1-review-desk.template.html')

# The commit before the 2026-09-10 reading-level, quote, phoneme, phonics,
# narrative and reasoning-tier work. Everything after it is "changed" or "new".
DEFAULT_BASELINE = 'df8022889'

# block -> (id field, [the text fields a reviewer has to read])
BLOCKS = [
    ('outcomes', 'outcomeId', ['learningOutcome', 'evidenceOfLearning', 'cambridgeObjectives']),
    ('readings', 'readingId', ['title', 'type', 'passageScript']),
    ('comprehension', 'questionId', ['question', 'correctAnswer', 'distractors', 'explanation']),
    ('grammar', 'grammarId', ['title', 'explanation', 'ruleAndExamples', 'commonMistake',
                              'memoryTip', 'practice']),
    ('speaking', 'speakingId', ['title', 'instructionsAndModelLines', 'aiTutorPrompt']),
    ('writing', 'writingId', ['title', 'promptAndInstructions', 'modelText', 'successCriteria']),
    ('activities', 'activityId', ['activityType', 'instructionsAndItems', 'answerSummary']),
    ('quizzes', 'questionId', ['question', 'options', 'correctAnswer', 'explanation']),
    ('fluency', 'fluencyId', ['question', 'options', 'correctAnswer', 'explanation']),
    ('answerKey', 'answerId', ['contentType', 'answerOrGuidance']),
    ('selfAssessment', 'selfAssessmentId', ['statement', 'scale']),
    ('dictionaryLinks', 'vocabularyId', ['groupTitle', 'childMeaning', 'exampleSentence',
                                         'practiceSentences']),
]

LABEL = {
    'unitText': 'Unit overview, learning path and guide',
    'outcomes': 'Learning outcomes', 'readings': 'Readings',
    'comprehension': 'Comprehension questions', 'grammar': 'Grammar',
    'speaking': 'Speaking', 'writing': 'Writing', 'activities': 'Activities',
    'quizzes': 'Quiz questions', 'fluency': 'Fluency practice',
    'answerKey': 'Answer key', 'selfAssessment': 'Self-assessment',
    'dictionaryLinks': 'Vocabulary entries',
}

FIELD_LABEL = {
    'heading': 'Section', 'text': 'Text',
    'learningOutcome': 'Learning outcome', 'evidenceOfLearning': 'Evidence of learning',
    'cambridgeObjectives': 'Cambridge objectives',
    'title': 'Title', 'type': 'Type', 'passageScript': 'Passage',
    'question': 'Question', 'correctAnswer': 'Correct answer',
    'distractors': 'Other options', 'explanation': 'Explanation',
    'ruleAndExamples': 'Rule and examples', 'commonMistake': 'Common mistake',
    'memoryTip': 'Memory tip', 'practice': 'Practice',
    'instructionsAndModelLines': 'Instructions and model lines',
    'aiTutorPrompt': 'AI tutor prompt',
    'promptAndInstructions': 'Prompt and instructions', 'modelText': 'Model text',
    'successCriteria': 'Success criteria',
    'activityType': 'Activity type', 'instructionsAndItems': 'Instructions and items',
    'answerSummary': 'Answer summary', 'options': 'Options',
    'contentType': 'Content type', 'answerOrGuidance': 'Answer or guidance',
    'statement': 'Statement', 'scale': 'Scale',
    'groupTitle': 'Word group', 'childMeaning': 'Child meaning',
    'exampleSentence': 'Example sentence', 'practiceSentences': 'Practice sentences',
    'displayWord': 'Word', 'partOfSpeech': 'Part of speech',
    'canonicalMeaning': 'Meaning', 'partOfSpeechDefinition': 'Part of speech, explained',
}

MASTER_FIELDS = ['displayWord', 'partOfSpeech', 'canonicalMeaning', 'partOfSpeechDefinition']


def at(sha, path):
    """The file as it was at <sha>, or None if it did not exist there."""
    try:
        raw = subprocess.check_output(['git', 'show', '%s:%s' % (sha, path)],
                                      stderr=subprocess.PIPE, cwd=ROOT)
    except subprocess.CalledProcessError:
        return None
    return json.loads(raw.decode('utf-8'))


def flat(v):
    if v is None:
        return ''
    if isinstance(v, list):
        return '\n'.join(flat(x) for x in v)
    return str(v)


def lane_of(old_item, new_text, fields):
    """new / changed / standing, plus the OLD text of the fields that moved."""
    if old_item is None:
        return 'new', {}
    old_text = {f: flat(old_item.get(f)) for f in fields if flat(old_item.get(f))}
    moved = {f for f in fields if old_text.get(f, '') != new_text.get(f, '')}
    if not moved:
        return 'standing', {}
    return 'changed', {f: v for f, v in old_text.items() if f in moved}


def check_baseline(baseline):
    """Refuse a baseline that cannot be read.

    An unreadable baseline file is indistinguishable from a file that did not
    exist yet, so every item in it would be reported as NEW - a confident,
    wrong answer rather than an error. Ask for all eleven up front.
    """
    missing = [p for p in ['%s/unit-%d.json' % (UNITS, n) for n in range(1, 11)] + [MASTER]
               if at(baseline, p) is None]
    if missing:
        sys.exit('REFUSED: %d of 11 files cannot be read at baseline %s (e.g. %s).\n'
                 '         Every item would be reported as new. Check the sha, and '
                 'that the paths use forward slashes.'
                 % (len(missing), baseline, missing[0]))


def collect(baseline):
    check_baseline(baseline)
    rows, counts, titles = [], collections.Counter(), {}

    for n in range(1, 11):
        path = '%s/unit-%d.json' % (UNITS, n)
        now = json.load(io.open(os.path.join(ROOT, path), encoding='utf-8'))
        was = at(baseline, path) or {}
        titles[n] = now['unit']['unitTitle']

        # Unit-level prose carries no reviewStatus of its own, so the lane is
        # the whole signal here - and it comes from git, not from a claim.
        g_now, g_was = now.get('grownUpGuide') or {}, was.get('grownUpGuide') or {}
        was_sections = {s.get('title'): s.get('body') for s in (g_was.get('sections') or [])}
        unit_rows = [
            ('overview', 'Unit overview',
             now['unit'].get('unitOverview'), (was.get('unit') or {}).get('unitOverview')),
            ('learning-path', 'Learning path',
             now['unit'].get('learningPath'), (was.get('unit') or {}).get('learningPath')),
            ('guide-intro', 'Teacher & Parent Guide - opening',
             g_now.get('intro'), g_was.get('intro')),
        ]
        for si, sec in enumerate(g_now.get('sections') or [], 1):
            unit_rows.append(('guide-%02d' % si,
                              'Teacher & Parent Guide - %s' % sec.get('title', ''),
                              sec.get('body'), was_sections.get(sec.get('title'))))
        for slug, heading, new_v, old_v in unit_rows:
            if not flat(new_v):
                continue
            if old_v is None:
                lane, old_text = 'new', {}
            elif flat(old_v) != flat(new_v):
                lane, old_text = 'changed', {'text': flat(old_v)}
            else:
                lane, old_text = 'standing', {}
            counts[lane] += 1
            rows.append({'unit': n, 'block': 'unitText', 'id': 'u%02d-%s' % (n, slug),
                         'status': '(no review status)', 'lane': lane,
                         'new': {'heading': heading, 'text': flat(new_v)}, 'old': old_text})

        for block, idf, fields in BLOCKS:
            old_by_id = {it.get(idf): it for it in (was.get(block) or [])
                         if isinstance(it, dict)}
            for it in (now.get(block) or []):
                if not isinstance(it, dict):
                    continue
                status = (it.get('reviewStatus') or '(no review status)').strip()
                if status.startswith('Approved'):
                    counts['approved'] += 1
                    continue
                new_text = {f: flat(it.get(f)) for f in fields if flat(it.get(f))}
                lane, old_text = lane_of(old_by_id.get(it.get(idf) or ''), new_text, fields)
                counts[lane] += 1
                rows.append({'unit': n, 'block': block, 'id': it.get(idf) or '',
                             'status': status, 'lane': lane,
                             'new': new_text, 'old': old_text})

    md = json.load(io.open(os.path.join(ROOT, MASTER), encoding='utf-8'))
    md_old = {e.get('dictionaryEntryId'): e
              for e in (at(baseline, MASTER) or {'entries': []}).get('entries', [])}
    dictionary = []
    for e in md['entries']:
        status = (e.get('reviewStatus') or '(no review status)').strip()
        if status.startswith('Approved'):
            counts['approved'] += 1
            continue
        new_text = {k: flat(e.get(k)) for k in MASTER_FIELDS if flat(e.get(k))}
        lane, old_text = lane_of(md_old.get(e.get('dictionaryEntryId')),
                                 new_text, MASTER_FIELDS)
        counts['md_' + lane] += 1
        dictionary.append({'id': e.get('dictionaryEntryId'), 'status': status,
                           'lane': lane, 'new': new_text, 'old': old_text})

    return rows, dictionary, counts, titles


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--baseline', default=DEFAULT_BASELINE)
    ap.add_argument('--out', help='write the self-contained review page here')
    ap.add_argument('--json-only', help='write just the extracted data here')
    args = ap.parse_args()
    if not args.out and not args.json_only:
        sys.exit('REFUSED: give --out <page.html> or --json-only <data.json>.')

    rows, dictionary, counts, titles = collect(args.baseline)

    ids = [r['id'] for r in rows] + [r['id'] for r in dictionary]
    if '' in ids or None in ids:
        sys.exit('REFUSED: an item has no id, so a verdict could not be keyed to it.')
    dupes = [i for i, c in collections.Counter(ids).items() if c > 1]
    if dupes:
        sys.exit('REFUSED: %d duplicate item id(s), e.g. %s - one verdict would '
                 'silently cover two items.' % (len(dupes), dupes[:3]))

    payload = {
        'baseline': args.baseline,
        'head': subprocess.check_output(
            ['git', 'log', '-1', '--format=%h %ad', '--date=format:%Y-%m-%d %H:%M'],
            cwd=ROOT).decode().strip(),
        'unitTitles': titles, 'labels': LABEL, 'fieldLabels': FIELD_LABEL,
        'fieldOrder': dict([('unitText', ['heading', 'text']),
                            ('dictionary', MASTER_FIELDS)]
                           + [(b, f) for b, _i, f in BLOCKS]),
        'counts': dict(counts), 'items': rows, 'dictionary': dictionary,
    }

    # every field on screen must have a label, or a reviewer meets a raw key
    unlabelled = set()
    for r in rows + [dict(x, block='dictionary') for x in dictionary]:
        for k in list(r['new']) + list(r['old']):
            if k not in FIELD_LABEL:
                unlabelled.add(k)
    if unlabelled:
        sys.exit('REFUSED: no reviewer-facing label for %s.' % sorted(unlabelled))

    blob = json.dumps(payload, ensure_ascii=False)

    if args.json_only:
        io.open(args.json_only, 'w', encoding='utf-8', newline='\n').write(blob)
        print('  wrote %s' % args.json_only)

    if args.out:
        tpl = io.open(TEMPLATE, encoding='utf-8').read()
        if '/*__DATA__*/' not in tpl:
            sys.exit('REFUSED: the template has no /*__DATA__*/ placeholder.')
        # The data rides inside <script type="application/json">, so a literal
        # "</script>" anywhere in the content would end the block early.
        safe = blob.replace('<', '\\u003c')
        if '</script' in safe.lower():
            sys.exit('REFUSED: the escaped data still closes a script block.')
        io.open(args.out, 'w', encoding='utf-8', newline='\n').write(
            tpl.replace('/*__DATA__*/', safe))

        # Check the FINAL bytes, never an intermediate state.
        final = io.open(args.out, encoding='utf-8').read()
        blocks = re.findall(r'<script>(.*?)</script>', final, re.S)
        if len(blocks) != 1:
            sys.exit('REFUSED: expected one runnable script block, found %d.' % len(blocks))
        chk = args.out + '.check.js'
        io.open(chk, 'w', encoding='utf-8', newline='\n').write(blocks[0])
        r = subprocess.run(['node', '--check', chk], capture_output=True)
        os.remove(chk)
        if r.returncode != 0:
            sys.stdout.write(r.stderr.decode('utf-8', 'replace'))
            sys.exit('REFUSED: the built page does not parse.')
        m = re.search(r'<script id="worklist-data" type="application/json">(.*?)</script>',
                      final, re.S)
        back = json.loads(m.group(1))
        if len(back['items']) != len(rows) or len(back['dictionary']) != len(dictionary):
            sys.exit('REFUSED: the embedded data did not round-trip.')
        print('  wrote %s  ({:,} bytes)'.format(os.path.getsize(args.out)) % args.out)
        print('  page script parses, embedded data round-trips')

    lanes = collections.Counter([r['lane'] for r in rows] + [r['lane'] for r in dictionary])
    print('\n  baseline %s -> %s' % (args.baseline, payload['head']))
    print('  to review: %d   (rewritten %d, new %d, standing %d)'
          % (len(ids), lanes['changed'], lanes['new'], lanes['standing']))
    print('  already approved by a reviewer: %d\n' % counts['approved'])


if __name__ == '__main__':
    main()
