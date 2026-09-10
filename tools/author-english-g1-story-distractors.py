# -*- coding: utf-8 -*-
"""Give the Grade 1 story questions wrong options worth tapping.

WHY. The app's story step turns oral comprehension questions into taps, and
the builder made the wrong options by borrowing the OTHER questions' answers
about the same reading. So a reading's six questions rotated one small pool
between them. Measured on the deployed Unit 4, which no authoring had
touched:

    What did Grandma make under the big tree?   A mat, from soft grass  <-
                                                A circle
                                                She wove the mat slowly...
    Which shape did Adam cut out in red?        A circle                <-
    What did Amal do slowly?                    She wove the mat slowly <-

Three consecutive questions, the same three options, each correct in turn. A
child who answered two knew the third by elimination. And the categories gave
it away on their own: "Who is in this story?" offered beside a place and a
food is not a question about the story.

WHAT THIS WRITES. Two authored wrong options for each of the sixty questions
the builder actually selects into the story step - same category as the right
answer (people for a "who", places for a "where", feelings for a "how did she
feel"), drawn from the unit's own story world, and each one a plausible
reading of the story rather than a category error. build-lessons.py prefers
them and falls back to the old pool only where a question has none.

WHAT IT DOES NOT CHANGE. The step still reports participation rather than a
mark: these questions are authored "Oral response", written for a child to
answer aloud, and nobody has reviewed them as multiple choice. Better options
make the tap worth making; they do not turn an oral question into an
assessment. That remains a reviewer's call.

    python tools/author-english-g1-story-distractors.py          # dry run
    python tools/author-english-g1-story-distractors.py --write

Idempotent. Refuses a question it cannot find, a distractor equal to its own
answer, and a distractor that is the correct answer of another question in
the same six - which is the defect it exists to remove.
"""
import io
import json
import os
import re
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')

# (unit, question id suffix): two wrong options, same category as the answer
D = {
    # --- unit 1: Amal's First Day -------------------------------------
    (1, 'cq13'): ['Her mother', 'The teacher'],
    (1, 'cq14'): ['At home, in the kitchen', 'At the market'],
    (1, 'cq15'): ['That she was tired and wanted to go home', 'That she lost her new pencil'],
    (1, 'cq16'): ['Her mother and her baby brother', 'Grandma and the hen'],
    (1, 'cq01'): ['Idris', 'Leo'],
    (1, 'cq02'): ['Four years old', 'Ten years old'],
    # --- unit 2: Breakfast at Grandma's House --------------------------
    (2, 'cq01'): ['Adam', 'Leo'],
    (2, 'cq02'): ['Three', 'Six'],
    (2, 'cq03'): ['She washed all the cups', 'She made the pancakes'],
    (2, 'cq04'): ['Cold', 'Loud'],
    (2, 'cq05'): ['She says they are too noisy', 'She says she likes the mango best'],
    (2, 'cq06'): ['Because he sang a funny song', 'Because he hid under the table'],
    # --- unit 3: Amal and the Big Ball ---------------------------------
    (3, 'cq13'): ['Amal, Grandma and the hen', 'Amal, her teacher and Idris'],
    (3, 'cq14'): ['The ball is lost in the long grass', 'Leo does not want to share'],
    (3, 'cq15'): ['Samira climbs the tree', 'They leave the ball and go home'],
    (3, 'cq16'): ['Catching', 'Bouncing'],
    (3, 'cq01'): ['Blue', 'Green'],
    (3, 'cq02'): ['Berbera', 'Borama'],
    # --- unit 4: making things -----------------------------------------
    (4, 'cq01'): ['A hat, from paper', 'A basket, from string'],
    (4, 'cq02'): ['A square', 'A triangle'],
    (4, 'cq03'): ['She counted the shapes one by one', 'She walked home along the long road'],
    (4, 'cq04'): ['She put it away and did something else', 'She asked Adam to finish it for her'],
    (4, 'cq05'): ['Cross, because it was still bumpy', 'Worried, because the work took all day'],
    (4, 'cq06'): ['To show her that he draws better than she does', 'To ask her to help him finish it'],
    # --- unit 5: Amal and the Little Hen -------------------------------
    (5, 'cq13'): ['Amal, Samira and Leo', 'Amal, her teacher and Idris'],
    (5, 'cq14'): ['At the market in town', 'At school, in the classroom'],
    (5, 'cq15'): ['Rice and sweet tea', 'A mango and cold water'],
    (5, 'cq01'): ['The hen', 'The duck'],
    (5, 'cq02'): ['The sheep', 'The chick'],
    (5, 'cq03'): ['A small brown feather', 'A bowl of seed'],
    # --- unit 6: five senses at the market ------------------------------
    (6, 'cq01'): ['Her teacher', 'Her brother Adam'],
    (6, 'cq02'): ['Hearing, with her ears', 'Sight, with her eyes'],
    (6, 'cq03'): ["'Sweet mangoes! Sweet mangoes!'", "'Hot bread! Hot bread!'"],
    (6, 'cq07'): ['I can smell with my nose.', 'I can taste with my tongue.'],
    (6, 'cq09'): ['I can touch with my hands.', 'I can smell with my nose.'],
    (6, 'cq12'): ['These are my hands.', 'The mango is sweet.'],
    # --- unit 7: Amal's Big Bus Ride ------------------------------------
    (7, 'cq01'): ['Blue and white', 'Green and black'],
    (7, 'cq02'): ['Next to the driver', 'At the very back'],
    (7, 'cq03'): ['She went by car', 'She rode a bicycle'],
    (7, 'cq04'): ['Fast and quiet', 'Slow and smooth'],
    (7, 'cq05'): ['Samira', 'Leo'],
    (7, 'cq06'): ['She was waiting at the bus stop with a mango', 'She sang the bus song all the way home'],
    # --- unit 8: The Well in the Village --------------------------------
    (8, 'cq13'): ['Amal, Grandma and the goat', 'Amal, Samira and her teacher'],
    (8, 'cq14'): ['The pot breaks on the way home', 'Adam cannot pull up the rope'],
    (8, 'cq15'): ['They dig a new well near the house', 'They carry water from the river instead'],
    (8, 'cq16'): ['They run inside and shut the door', 'They fill every pot in the village'],
    (8, 'cq08'): ['I use water to wash.', 'I use water to cook.'],
    (8, 'cq10'): ['It is sunny.', 'I use water to drink.'],
    # --- unit 9: places in a town ---------------------------------------
    (9, 'cq01'): ['Go', 'Wait'],
    (9, 'cq02'): ['Shy, because she looked at the ground', 'Cross, because she was in a hurry'],
    (9, 'cq03'): ['The shopkeeper', 'The teacher'],
    (9, 'cq04'): ['He ran away down the road', 'He gave the paper to Amal'],
    (9, 'cq09'): ['Go', 'Near'],
    (9, 'cq12'): ['Give me a mango now.', 'I want that mango.'],
    # --- unit 10: capstone ----------------------------------------------
    (10, 'cq13'): ['Adam', 'Her teacher'],
    (10, 'cq14'): ['Sad', 'Tired'],
    (10, 'cq15'): ["It tells a story about Amal's year", 'It is a song to sing at the celebration'],
    (10, 'cq16'): ['Next', 'Finally'],
    (10, 'cq10'): ['The farm page', 'The weather page'],
    (10, 'cq11'): ["'My mum is a teacher.'", "'This is my mum. She is at work.'"],
}


def is_factual(c):
    """build-lessons.py's own filter, so this authors for the questions the
    app really selects rather than for every comprehension item."""
    q = (c.get('question') or '').strip()
    ans = (c.get('correctAnswer') or '').strip()
    if not ans or not q or '___' in q or '___' in ans:
        return False
    if re.search(r'\(\s*(any|or)\b', ans, re.I) or re.match(r'^\s*any\b', ans, re.I):
        return False
    return len(ans) <= 70


def chosen_six(doc):
    order = {r['readingId']: i for i, r in enumerate(doc['readings'])}
    factual = [c for c in doc['comprehension'] if is_factual(c)]
    by_reading = {}
    for c in factual:
        by_reading.setdefault(c.get('readingId'), []).append(c)
    queues = [by_reading[r] for r in sorted(by_reading, key=lambda r: order.get(r, len(order)))]
    out, k = [], 0
    while len(out) < 6 and any(len(q) > k for q in queues):
        for q in queues:
            if k < len(q) and len(out) < 6:
                out.append(q[k])
        k += 1
    out.sort(key=lambda c: order.get(c.get('readingId'), len(order)))
    return out


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    added = already = 0
    per_file = []
    problems = []
    unmatched = dict(D)
    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

        six = chosen_six(doc)
        answers = {(c.get('correctAnswer') or '').strip().lower() for c in six}
        changed = 0
        for c in six:
            suffix = c['questionId'].rsplit('-', 1)[1]
            key = (n, suffix)
            want = D.get(key)
            if not want:
                sys.exit('REFUSED: unit %d question %s (%s) has no authored distractors; the six the '
                         'builder selects have changed.' % (n, suffix, c['question'][:50]))
            unmatched.pop(key, None)
            own = (c.get('correctAnswer') or '').strip().lower()
            for w in want:
                if w.strip().lower() == own:
                    problems.append('u%-2d %s  distractor equals its own answer: %r'
                                    % (n, suffix, w))
                elif w.strip().lower() in answers:
                    problems.append('u%-2d %s  %r is another of this step\'s six answers (the rotation)'
                                    % (n, suffix, w))
            if c.get('distractors') == want:
                already += 1
                continue
            # keep the key next to the answer it belongs with
            new = {}
            for k, v in c.items():
                new[k] = v
                if k == 'correctAnswer':
                    new['distractors'] = want
            if 'distractors' not in new:
                new['distractors'] = want
            c.clear()
            c.update(new)
            added += 1
            changed += 1

        per_file.append((n, changed))
        if problems:
            continue
        if write and changed:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    if problems:
        sys.exit('REFUSED: %d distractor(s) would reproduce the defect this tool removes:\n  %s'
                 % (len(problems), '\n  '.join(problems)))
    if unmatched:
        sys.exit('REFUSED: %d authored entr(ies) matched no selected question: %s'
                 % (len(unmatched), ', '.join('u%d %s' % k for k in sorted(unmatched))))

    print('\n  Grade 1 story-question distractors  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    questions given authored wrong options : %d' % added)
    print('    already carrying them                  : %d' % already)
    print('    distractor strings                     : %d' % (2 * (added + already)))
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if not write and added == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
