# -*- coding: utf-8 -*-
"""Take the semicolon out of the Grade 1 text a CHILD reads.

WHY. The validation asked for the semicolon-heavy explanations to be rewritten
(areas 12 and 19). The quiz explanations were done on 2026-09-10; the
re-validation that evening found the job half-finished, and found it only
because the first sweep had been measured over too narrow a set of fields.
Measured across every string in the ten unit files: 453 semicolons, of which
these are the ones a six-year-old actually meets.

WHAT IS DELIBERATELY LEFT ALONE, because "reaching the learner" is the test:

    agenda            240   live-session plans, written for the teacher
    successCriteria   180   FIXED HERE - the child reads these
    basis              10   learningTime metadata, read by nobody in the app
    answerOrGuidance    9   answer-key guidance, written for the adult marking
    answerSummary       6   the same
    body                2   the grown-up guide, in its own adult voice

A semicolon is good punctuation for an adult and unreadable to a five-year-old.
Removing it everywhere would be a style edit; removing it where a child reads
is the finding.

THE SUCCESS CRITERIA GET MORE THAN THEIR PUNCTUATION FIXED. Two strings carry
all 180, repeated across 60 writing items, and both also changed person
mid-sentence ("I said the idea first; formed or selected meaningful letters")
and used curriculum register a child cannot read. They become short sentences
in the child's own voice. "or picked" is kept deliberately: at Grade 1 some
children SELECT letters from cards rather than write them, and dropping that
would quietly raise the bar on a pre-writing child.

    python tools/repair-english-g1-learner-semicolons.py          # dry run
    python tools/repair-english-g1-learner-semicolons.py --write

Idempotent: every rule is keyed on the exact text it replaces, so a second run
finds nothing.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')

# field -> [(exact old, new)]  — exact, so a partial earlier fix cannot double-apply
RULES = {
    # THE SEMICOLON HERE IS A DELIMITER, NOT PUNCTUATION, AND IT STAYS.
    # english.js :: writingCriteria() splits this field on ";" to build the
    # Writer's checklist, one checkbox per part. A child never sees the
    # character; they see four boxes. Replacing it with full stops - which this
    # tool did in its first version - collapsed four checkboxes into one, and
    # the built pages are what showed it: the new wording appeared in 0 of 10.
    #
    # What WAS wrong here is the wording, and that is fixed: the first string
    # changed person mid-sentence ("I said the idea first; formed or selected")
    # and used curriculum register a six-year-old cannot read. "or picked" is
    # kept deliberately - at Grade 1 some children select letters from cards
    # rather than write them.
    'successCriteria': [
        ('I said the idea first; formed or selected meaningful letters and words; '
         'used the model; checked my work with an adult',
         'I said my idea first; I wrote or picked my letters and words; '
         'I used the model; I checked my work with an adult'),
        ('The picture and words match; I said the idea first; I used the model; '
         'I read or repeated it aloud',
         'My picture and my words match; I said my idea first; I used the model; '
         'I read it out loud'),
        # and back out of this tool's own first version, so a tree already
        # written by it converges rather than being stranded mid-migration
        ('I said my idea first. I wrote or picked my letters and words. '
         'I used the model. I checked my work with an adult.',
         'I said my idea first; I wrote or picked my letters and words; '
         'I used the model; I checked my work with an adult'),
        ('My picture and my words match. I said my idea first. I used the model. '
         'I read it out loud.',
         'My picture and my words match; I said my idea first; I used the model; '
         'I read it out loud'),
    ],
    'commonMistake': [
        ("On means on top; in means inside.", "On means on top. In means inside."),
        ("Floats means it stays on top; sinks means it goes down.",
         "Floats means it stays on top. Sinks means it goes down."),
    ],
    'explanation': [
        ("Amal walks to the well with Adam; at home Mama cooks and little Hodan drinks.",
         "Amal walks to the well with Adam. At home Mama cooks and little Hodan drinks."),
    ],
    # one sentence, three copies: the outcome, the self-assessment statement a
    # child ticks, and the recap list. A semicolon between two example PAIRS is
    # a comma's job, which is what every other pair list in this course uses.
    'learningOutcome': [("(tall / taller; sweet / sweeter)", "(tall / taller, sweet / sweeter)")],
    'statement': [("(tall / taller; sweet / sweeter)", "(tall / taller, sweet / sweeter)")],
    'items': [("(tall / taller; sweet / sweeter)", "(tall / taller, sweet / sweeter)")],
}

# Fields whose semicolons must survive the run: adult-facing prose, metadata,
# and successCriteria, whose semicolon is the checklist's delimiter rather than
# punctuation a child reads.
KEEP = {'agenda', 'basis', 'answerOrGuidance', 'answerSummary', 'body', 'successCriteria'}
SKIP_KEYS = {'audio', 'sentenceAudio', 'overviewAudio'}


def walk(node, fix, counts):
    """Rewrite in place. Returns nothing; counts is mutated."""
    if isinstance(node, list):
        for i, v in enumerate(node):
            if isinstance(v, str):
                continue
            walk(v, fix, counts)
        return
    if not isinstance(node, dict):
        return
    for k, v in list(node.items()):
        if k in SKIP_KEYS or k.endswith('Audio'):
            continue
        rules = RULES.get(k)
        if rules and isinstance(v, str):
            nv = v
            for old, new in rules:
                if old in nv:
                    nv = nv.replace(old, new)
            if nv != v:
                node[k] = nv
                counts[k] = counts.get(k, 0) + 1
        elif rules and isinstance(v, list):
            out, hit = [], False
            for x in v:
                if isinstance(x, str):
                    nx = x
                    for old, new in rules:
                        if old in nx:
                            nx = nx.replace(old, new)
                    hit = hit or nx != x
                    out.append(nx)
                else:
                    out.append(x)
            if hit:
                node[k] = out
                counts[k] = counts.get(k, 0) + 1
        else:
            walk(v, fix, counts)


def learner_semicolons(doc):
    """Semicolons in fields a child reads — the number this tool must zero."""
    n = 0

    def go(o, key=''):
        nonlocal n
        if isinstance(o, str):
            if key not in KEEP and key not in SKIP_KEYS:
                n += o.count(';')
        elif isinstance(o, list):
            for x in o:
                go(x, key)
        elif isinstance(o, dict):
            for k, v in o.items():
                if k in SKIP_KEYS or k.endswith('Audio'):
                    continue
                go(v, k)
    go(doc)
    return n


def main():
    write = '--write' in sys.argv
    for a in sys.argv[1:]:
        if a != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or nothing for a dry run.' % a)

    total_before = total_after = 0
    counts = {}
    kept = 0
    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)
        total_before += learner_semicolons(doc)
        walk(doc, RULES, counts)
        after = learner_semicolons(doc)
        total_after += after
        kept += sum(str(v).count(';') for k, v in _flat(doc) if k in KEEP)
        if write:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    print('\n  Grade 1 learner-facing semicolons  (%s)'
          % ('WRITING' if write else 'dry run - add --write'))
    print('    before : %d' % total_before)
    print('    after  : %d' % total_after)
    print('    fields rewritten: %s' % (', '.join('%s x%d' % (k, v)
                                                  for k, v in sorted(counts.items())) or 'none'))
    print('    kept on purpose (adult-facing): %d' % kept)
    if total_after and write:
        sys.exit('\n  REFUSED TO CALL THIS DONE: %d learner-facing semicolons remain.\n'
                 % total_after)
    print('')


def _flat(o, key=''):
    if isinstance(o, str):
        yield key, o
    elif isinstance(o, list):
        for x in o:
            yield from _flat(x, key)
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from _flat(v, k)


if __name__ == '__main__':
    main()
