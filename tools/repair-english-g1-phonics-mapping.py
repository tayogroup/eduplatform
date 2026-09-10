# -*- coding: utf-8 -*-
"""Claim the three Stage 1 phonics objectives the Grade 1 course already
teaches but maps to no outcome.

WHY. The Grade 1 validation (area 5) found 75 of the stage's 90 objectives
claimed and, among the 15 unclaimed, three that the course delivers anyway:
the phonics spine runs short vowels in Units 1-5, then sh/ch (Unit 6),
th/ng (Unit 7), ck/qu (Unit 8) and blends - flag, swim, stop, step, drum,
tent, nest, sand - in Unit 9. That is 1Ww.02 (graphemes for consonant
digraphs and adjacent consonants) in each of those four units, and in Unit 9
also 1Rw.03 (blend adjacent consonants) and 1Rw.06 (use phonic knowledge to
sound out unfamiliar words). The fix is to map, not to author.

WHERE THE CLAIM GOES. Each unit's outcomes are topic outcomes, none of them
"the phonics one", so the codes join the outcome that already carries that
unit's word-level reading claim: Unit 6's lo02 (1Rw.02, consonant digraphs),
Unit 7's lo02 (1Rw.05, decodable words), Unit 8's lo02 and Unit 9's lo02
(1Rw.07 sight words, 1Ww.05 graphemes). A new code joins the outcome's
existing codes for the same sub-strand, kept in number order, or follows the
last code of its strand - so every code already there stays where it is and
the diff is the added codes alone. (The lists are NOT in the framework's
order - 38 of 60 are not - so sorting them was tried and refused.)

THE APPROVAL DOES NOT SURVIVE. A reviewer approved each outcome with the
mapping it had, so the four touched outcomes move to a re-review flag, as
the text repairs do. Nothing a learner sees changes: grade-1-v2 renders an
outcome's wording and never its codes.

    python tools/repair-english-g1-phonics-mapping.py          # dry run
    python tools/repair-english-g1-phonics-mapping.py --write

Idempotent. Refuses an outcome id it cannot find and a code the Stage 1
framework does not carry, and prints Stage 1 coverage before and after.
"""
import io
import json
import os
import sys

BASE = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data')
UNITS = os.path.join(BASE, 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')

REVIEW_FLAG = 'Needs re-review (Cambridge mapping extended with the phonics objectives the unit teaches)'

MAP = {
    (6, 'eng-g01-t02-u06-lo02'): ['1Ww.02'],
    (7, 'eng-g01-t03-u07-lo02'): ['1Ww.02'],
    (8, 'eng-g01-t03-u08-lo02'): ['1Ww.02'],
    (9, 'eng-g01-t03-u09-lo02'): ['1Rw.03', '1Rw.06', '1Ww.02'],
}


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    fw = json.load(io.open(FRAMEWORK, encoding='utf-8'))
    stage1 = [o['code'] for o in fw['objectivesByStage']['1']]
    order = {c: i for i, c in enumerate(stage1)}
    for codes in MAP.values():
        for c in codes:
            if c not in order:
                sys.exit('REFUSED: %s is not a Stage 1 objective in %s' % (c, FRAMEWORK))

    docs = {}
    raws = {}
    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raws[n] = io.open(path, encoding='utf-8').read()
        docs[n] = json.loads(raws[n])
        if json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n' != raws[n]:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

    def claimed():
        s = set()
        for d in docs.values():
            for o in d['outcomes']:
                s.update(o.get('cambridgeObjectives') or [])
        return s & set(stage1)

    def sub(c):      # '1Rw.03' -> 'Rw'
        return c[1:c.index('.')]

    def strand(c):   # '1Rw.03' -> 'R', '1SLm.02' -> 'SL'
        return 'SL' if sub(c).startswith('SL') else sub(c)[0]

    def place(cs, c):
        """Insert c without moving any existing code."""
        same = [i for i, x in enumerate(cs) if sub(x) == sub(c)]
        if same:
            group = sorted([cs[i] for i in same] + [c], key=lambda x: order[x])
            return cs[:same[0]] + group + cs[same[-1] + 1:]
        kin = [i for i, x in enumerate(cs) if strand(x) == strand(c)]
        at = kin[-1] + 1 if kin else len(cs)
        return cs[:at] + [c] + cs[at:]

    before = claimed()
    added = flagged = 0
    changed_units = set()
    for (n, oid), codes in MAP.items():
        outcome = next((o for o in docs[n]['outcomes'] if o['outcomeId'] == oid), None)
        if outcome is None:
            sys.exit('REFUSED: unit-%d.json has no outcome %s' % (n, oid))
        cs = list(outcome.get('cambridgeObjectives') or [])
        new = [c for c in codes if c not in cs]
        if not new:
            continue
        for c in new:
            cs = place(cs, c)
        outcome['cambridgeObjectives'] = cs
        print('    %s: %s' % (oid, ', '.join(cs)))
        added += len(new)
        changed_units.add(n)
        if outcome.get('reviewStatus') != REVIEW_FLAG:
            outcome['reviewStatus'] = REVIEW_FLAG
            flagged += 1
    after = claimed()

    if write:
        for n in sorted(changed_units):
            io.open(os.path.join(UNITS, 'unit-%d.json' % n), 'w', encoding='utf-8', newline='\n').write(
                json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n')

    print('\n  Grade 1 phonics mapping  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    codes added          : %d across %s' % (added, ', '.join('u%d' % n for n in sorted(changed_units)) or 'no unit'))
    print('    approval flags moved : %d' % flagged)
    print('    Stage 1 coverage     : %d/%d (%.0f%%) -> %d/%d (%.0f%%)' % (
        len(before), len(stage1), 100.0 * len(before) / len(stage1),
        len(after), len(stage1), 100.0 * len(after) / len(stage1)))
    print('    still unclaimed      : %s' % ', '.join(sorted(set(stage1) - after)))
    if not write and added == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
