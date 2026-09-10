# -*- coding: utf-8 -*-
"""Give each Grade 1 unit one reasoning question.

WHY. The validation (area 11) found every scored question in the grade to be
a four-option recall or application choice worth one mark: 350 items, one
cognitive move. Nothing asked a child to work anything out - to apply a rule
to a new case, to infer from an attribute, to follow a cause to its effect,
or to put two facts together.

WHAT THIS ADDS. One question per unit, ten in all, each a genuine reasoning
move at Stage 1 and each drawn from that unit's own content:

    u1  sort by category      table / chair / book / RED - which is not a thing?
    u2  one-to-one            five people, one bowl each, how many bowls?
    u3  infer from attribute  who reaches the high branch, and why
    u4  apply the unit's own lesson about trying again
    u5  cause and effect      a seed with water and sun
    u6  reason under a constraint - which sense works in the dark
    u7  order a safety rule   what must come FIRST before crossing
    u8  apply the story's lesson about sharing a low well
    u9  match a need to a place
    u10 order the pages of a book she is making

WHERE THEY LAND. The builder splits a unit's ten quiz items by difficulty -
"Supported recall" to the mid check, everything else to the end check - and
fills each check to ten from the unit's game rounds. A "Supported reasoning"
item therefore joins the END quiz and displaces one generated round, so the
child still meets ten questions and one of them now asks them to think.

Each carries its answer-key row, and each is flagged for curriculum review:
this is new content and nobody has read it.

    python tools/author-english-g1-reasoning-items.py          # dry run
    python tools/author-english-g1-reasoning-items.py --write

Idempotent, keyed on the question text.
"""
import importlib.util
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')

ORIGIN = 'Ehel authoring 2026-09-10 (reasoning tier)'
SOURCE = "Authored from the unit's own content"
FLAG = 'Needs curriculum review (new content, 2026-09-10)'
DIFFICULTY = 'Supported reasoning'

_spec = importlib.util.spec_from_file_location(
    'qx', os.path.join('tools', 'repair-english-g1-quiz-explanations.py'))
_qx = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_qx)
key_line = _qx.key_line

# unit -> (question, options in order, correct answer, explanation)
Q = {
    1: ('Which one does not belong with the others?',
        ['table', 'chair', 'book', 'red'], 'red',
        'A table, a chair and a book are things in your classroom. Red is a colour, not a thing.'),
    2: ('Grandma gives one bowl to each person. There are five people. How many bowls does she need?',
        ['Five', 'One', 'Two', 'Ten'], 'Five',
        'One bowl for each person. Five people need five bowls.'),
    3: ('The ball is high in the tree. Who can reach it best?',
        ['Adam, because he is tall', 'Leo, because he is small', 'Samira, because she is kind',
         'Nobody can reach it'], 'Adam, because he is tall',
        'You need to be tall to reach something high up. Being small or being kind does not help you reach.'),
    4: ("Amal's first mat came out bumpy. What is the best thing to do next?",
        ['Try again', 'Throw it away', 'Ask Adam to make it', 'Stop making things'], 'Try again',
        'Amal took a deep breath and tried again, and the next mat was better. Trying again is how work gets better.'),
    5: ('You put a seed in the ground and give it water and sun. What will happen?',
        ['It will grow into a plant', 'It will turn into an egg', 'It will become a hen',
         'Nothing will happen'], 'It will grow into a plant',
        'A seed grows into a plant with water and sun. A chick comes from an egg, not from a seed.'),
    6: ('It is dark and Amal cannot see her shoes. Which sense will help her find them?',
        ['Touch, with her hands', 'Sight, with her eyes', 'Taste, with her tongue',
         'Smell, with her nose'], 'Touch, with her hands',
        'In the dark your eyes cannot help you. Your hands can feel where things are.'),
    7: ('Amal is going to cross the road. What must she do first?',
        ['Stop and look', 'Run across', 'Close her eyes', 'Wave to Adam'], 'Stop and look',
        'Stop, look and listen keeps you safe. You do it before you cross, not after.'),
    8: ('No rain has come and the well is low. What is the kind thing to do?',
        ['Share the water and use only a little', 'Take a lot before it is gone',
         'Pour some water away', 'Wash your hands ten times'], 'Share the water and use only a little',
        'The whole village shared and nobody wasted a drop, so there was enough for everyone.'),
    9: ('Your friend has hurt her arm. Where should she go?',
        ['The hospital', 'The market', 'The library', 'The park'], 'The hospital',
        'The doctor works at the hospital and helps people who are hurt. The market is for shopping and the library is for books.'),
    10: ('You are making your book. Which page comes first?',
         ['The page with your name on it', 'The page about the weather',
          'The page about your next goal', 'The page about a place you know'],
         'The page with your name on it',
         'Page 1 is the cover and it has your name on it. Your next goal goes on the last page.'),
}


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    added = already = keys = 0
    per_file = []
    for n in range(1, 11):
        path = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

        question, options, answer, why = Q[n]
        if answer not in options:
            sys.exit('REFUSED: unit %d answer is not among its own options.' % n)
        if question in {q['question'] for q in doc['quizzes']}:
            already += 1
            per_file.append((n, 0))
            continue

        model = doc['quizzes'][-1]
        seq = max(q['sequence'] for q in doc['quizzes']) + 1
        qid = '%s-q%02d' % (model['quizId'], seq)
        item = {
            'quizId': model['quizId'], 'questionId': qid, 'unitId': doc['unit']['unitId'],
            'quizTitle': model['quizTitle'], 'sequence': seq,
            'questionType': 'Picture or word choice', 'question': question,
            'options': ' | '.join(options), 'correctAnswer': answer, 'explanation': why,
            'marks': 1, 'outcomeId': model['outcomeId'], 'difficulty': DIFFICULTY,
            'origin': ORIGIN, 'reviewStatus': FLAG, 'sourceFile': SOURCE,
        }
        doc['quizzes'].append(item)
        nxt = max(int(a['answerId'].rsplit('-', 1)[1]) for a in doc['answerKey']) + 1
        doc['answerKey'].append({
            'answerId': '%s-answer-%03d' % (doc['unit']['unitId'], nxt),
            'unitId': doc['unit']['unitId'], 'contentId': qid, 'contentType': 'Quiz',
            'answerOrGuidance': key_line(answer, why),
            'origin': ORIGIN, 'reviewStatus': FLAG, 'sourceFile': SOURCE,
        })
        added += 1
        keys += 1
        per_file.append((n, 1))
        if write:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    print('\n  Grade 1 reasoning items  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    reasoning questions added : %d   (one per unit)' % added)
    print('    answer-key rows added     : %d' % keys)
    print('    already present           : %d' % already)
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if not write and added == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
