# -*- coding: utf-8 -*-
"""Bring the Grade 1 quiz explanations down to the reading level of the
questions they explain.

WHY. The explanations are the feedback a child gets after answering, and they
were written for an adult: all 100 were a SINGLE sentence averaging 17.7 words,
96 of them joining two ideas with a semicolon. Measured over the whole corpus
that is Flesch-Kincaid grade 5.78, against 1.91 for the questions themselves and
1.63 for the reading passages. A six-year-old cannot read their own feedback.

WHAT IT DOES, in two passes:

  1. SPLIT AT THE SEMICOLON. In every one of the 96 the semicolon separates the
     same two ideas - why the right answer is right, then why the others are
     wrong - so splitting is meaning-preserving and needs no judgement. This
     alone takes the corpus from FK 5.78 to 2.40 and words-per-sentence from
     17.7 to 9.0.

  2. FOURTEEN REWRITTEN BY HAND, listed below. These are the ones left with a
     sentence over 15 words after the split, nearly all a three-item list of
     distractor explanations.

WHAT IT DELIBERATELY DOES NOT DO. Splitting those lists mechanically was tried
and rejected. It reaches FK 1.56, and it produces broken English in an English
course: "The others tell an age, point at a thing, or tell what you can do"
becomes "The others tell an age. Point at a thing. Or tell what you can do." -
an imperative and a fragment, because the list items share a subject the split
strands. Where a list is genuinely three independent clauses the hand pass below
splits it; where it is not, it is left as a list.

THE ANSWER KEY MIRRORS THE EXPLANATION and is rewritten with it. Each quiz row
reads "Correct option: <answer>. <explanation>", and the two would otherwise
drift - the teacher would read the old wording and the child hear the new.

No audio is affected: quiz explanations carry no pre-rendered clips and are
spoken by the runtime voice, so nothing needs re-recording.

    python tools/repair-english-g1-quiz-explanations.py          # dry run
    python tools/repair-english-g1-quiz-explanations.py --write

Idempotent: a second run reports nothing to do.
"""
import io
import json
import os
import re
import sys

BASE = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')

# THE APPROVAL DOES NOT SURVIVE THE REWRITE, and saying so is the point of this
# constant. All 100 quiz items read "Approved - curriculum reviewer", and a
# reviewer approved the wording that was there - not this wording. The meaning
# is preserved and the split is mechanical, but "a reviewer signed this off" is
# a claim about text somebody read, so it moves to a re-review flag on the items
# that changed and stays untouched on the three that did not.
#
# Worded to match the 56 items already carrying the house's own form of this,
# "Needs re-review (content updated for self-sufficiency pass)".
REVIEW_FLAG = 'Needs re-review (explanation rewritten to the learner reading level)'

# The fourteen left with a sentence over 15 words after the semicolon split.
# Keyed by questionId; each replaces the split output entirely.
HAND = {
    'eng-g01-t01-u01-quiz01-q02':
        'We sit on a chair. A book is for reading. A clock shows the time. '
        'A ruler helps us measure.',
    'eng-g01-t01-u01-quiz01-q10':
        'Books go back on the shelf. That is how we look after our school things.',
    'eng-g01-t01-u02-quiz01-q02':
        "Your mother's mother is your grandma. A sister is a girl your own age. "
        'A teacher and a neighbour are not family.',
    'eng-g01-t01-u02-quiz01-q04':
        'We say she for a girl. He is for a boy. It is for a thing. '
        'We say they for more than one.',
    'eng-g01-t02-u04-quiz01-q01':
        'A circle is a shape. Yellow is a colour. Glue is a thing we use. '
        'Soft tells how something feels.',
    'eng-g01-t02-u05-quiz01-q01':
        'A goat is an animal. A tractor, a barn and grass are on a farm too. '
        'But they are not animals.',
    'eng-g01-t02-u05-quiz01-q06':
        'A baby hen is a chick. A calf is a baby cow. A lamb is a baby sheep. '
        'A foal is a baby horse.',
    'eng-g01-t03-u07-quiz01-q03':
        'A plane flies. A car and a train stay on the ground. '
        'A boat stays on the water.',
    'eng-g01-t03-u07-quiz01-q07':
        'Cars drive on roads. The sea is for boats. The sky is for planes. '
        'The rails are for trains.',
    'eng-g01-t03-u09-quiz01-q02':
        'Doctors and nurses work at the hospital. We go to the park to play. '
        'We go to the shop to buy things. We go to school to learn.',
    'eng-g01-t03-u09-quiz01-q07':
        'A teacher works at school. A nurse works at a hospital. '
        'A shopkeeper works at a shop. A pilot flies a plane.',
    'eng-g01-t03-u10-quiz01-q02':
        'Can tells what you are able to do. Is and are do not go with I hop. '
        'The is not a doing word.',
    'eng-g01-t03-u10-quiz01-q04':
        'Blue is a colour. A bus is a vehicle. A farm is a place. '
        'Hear is a sense word.',
    'eng-g01-t03-u10-quiz01-q05':
        'Mum is a family member. The other words start with m too. '
        'But they are a place, the sky and a thing.',
}


def upfirst(s):
    """Capitalise the first letter, unless the clause opens with phoneme
    notation - /b/ must not become /B/."""
    if s.startswith('/'):
        return s
    for i, c in enumerate(s):
        if c.isalpha():
            return s[:i] + c.upper() + s[i + 1:]
    return s


def split_semicolons(text):
    if ';' not in text:
        return text
    out = []
    for part in [p.strip() for p in text.split(';')]:
        part = upfirst(part)
        if not part.endswith(('.', '!', '?')):
            part += '.'
        out.append(part)
    return ' '.join(out)


def rewrite(question_id, text):
    if question_id in HAND:
        return HAND[question_id]
    return split_semicolons(text)


def key_line(answer, explanation):
    """The answer key's own format. Some correct answers are whole sentences
    and already end in a full stop; adding a second one is what made an earlier
    reading of this file report 26 false mismatches."""
    stop = '' if answer.rstrip().endswith(('.', '!', '?')) else '.'
    return 'Correct option: %s%s %s' % (answer.rstrip(), stop, explanation)


VOWELS = 'aeiouy'


def syllables(word):
    word = re.sub(r'[^a-z]', '', word.lower())
    n, prev = 0, False
    for ch in word:
        v = ch in VOWELS
        if v and not prev:
            n += 1
        prev = v
    if word.endswith('e') and n > 1:
        n -= 1
    return max(n, 1)


def flesch_kincaid(text):
    sentences = [s for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    words = re.findall(r"[A-Za-z']+", text)
    if not sentences or not words:
        return None, None
    wps = len(words) / float(len(sentences))
    spw = sum(syllables(w) for w in words) / float(len(words))
    return 0.39 * wps + 11.8 * spw - 15.59, wps


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    before_corpus, after_corpus = [], []
    changed_expl = changed_keys = flagged = 0
    hand_seen = set()
    per_file = []

    for n in range(1, 11):
        path = os.path.join(BASE, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)

        # round-trip guard: this writer must reproduce the file byte for byte
        # before it is trusted to change one field in it.
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this '
                     'writer, so writing it would reformat the whole file.' % n)

        quizzes = {q['questionId']: q for q in doc['quizzes']}
        file_changed = 0
        touched = set()

        for q in doc['quizzes']:
            old = q['explanation']
            before_corpus.append(old)
            new = rewrite(q['questionId'], old)
            after_corpus.append(new)
            if q['questionId'] in HAND:
                hand_seen.add(q['questionId'])
            if new != old:
                q['explanation'] = new
                touched.add(q['questionId'])
                changed_expl += 1
                file_changed += 1
            if q['questionId'] in touched and q.get('reviewStatus') != REVIEW_FLAG:
                q['reviewStatus'] = REVIEW_FLAG
                flagged += 1
                file_changed += 1

        for a in doc['answerKey']:
            if a.get('contentType') != 'Quiz':
                continue
            q = quizzes.get(a['contentId'])
            if not q:
                continue
            expected = key_line(q['correctAnswer'], q['explanation'])
            if a['answerOrGuidance'] != expected:
                a['answerOrGuidance'] = expected
                changed_keys += 1
                file_changed += 1
            # the key carries the same rewritten sentence, so it carries the
            # same loss of approval
            if a['contentId'] in touched and a.get('reviewStatus') != REVIEW_FLAG:
                a['reviewStatus'] = REVIEW_FLAG
                flagged += 1
                file_changed += 1

        per_file.append((n, file_changed))
        if write and file_changed:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    missing = set(HAND) - hand_seen
    if missing:
        sys.exit('REFUSED: %d hand-written replacement(s) match no question, so '
                 'they would silently do nothing: %s' % (len(missing), ', '.join(sorted(missing))))

    fb, wb = flesch_kincaid(' '.join(before_corpus))
    fa, wa = flesch_kincaid(' '.join(after_corpus))
    longest = max(len(re.findall(r"[A-Za-z']+", s))
                  for t in after_corpus for s in re.split(r'(?<=[.!?])\s+', t) if s.strip())
    semis = sum(1 for t in after_corpus if ';' in t)

    print('\n  Grade 1 quiz explanations  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    explanations rewritten : %d of %d   (%d by hand)' % (changed_expl, len(before_corpus), len(hand_seen)))
    print('    answer-key rows synced : %d' % changed_keys)
    print('    approval flags moved   : %d   (%r)' % (flagged, REVIEW_FLAG))
    print('    reading level          : FK %.2f -> %.2f' % (fb, fa))
    print('    words per sentence     : %.1f -> %.1f' % (wb, wa))
    print('    longest sentence       : %dw' % longest)
    print('    explanations with a semicolon: %d' % semis)
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if not write and changed_expl == 0 and changed_keys == 0 and flagged == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
