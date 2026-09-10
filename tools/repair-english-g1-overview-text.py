# -*- coding: utf-8 -*-
"""Bring the Grade 1 unit overviews and learning paths down to the learner's
reading level.

WHY. These are the two texts a child meets before anything else in a unit, and
they were the highest-reading learner-facing text in the course: the overviews
at Flesch-Kincaid grade 6.38, the learning paths at 9.48 - against 1.91 for the
quiz questions and 1.63 for the reading passages. One learning-path line ran to
45 words in a single sentence, identical in nine units.

THE PATHS ARE BOILERPLATE. Units 1-9 carry the same five lines verbatim, so
PATH_LINES below is keyed by the old line and rewrites all nine at once. Unit 10
has its own six lines, already three to six words each, and is left alone.

THE OVERVIEWS ARE PER UNIT and are written out in full, because each names its
own unit's content and no transform can shorten "you will name the farm animals
and the sounds they make, learn farm words like tractor, barn and field, and
talk about the work people do on a farm" without knowing what it says.

THE FIRST TWO SENTENCES ARE LOAD-BEARING. generate-ehel-english-audio.js takes
`unitOverview.split(". ").slice(0, 2)` for the intro clip, and renderOverview
shows the same two in the page header. Every rewrite below therefore still says
something whole in its first two sentences rather than trailing off mid-idea.

THIS STRANDS AUDIO AND MUST NOT SHIP ALONE. Twenty pre-rendered clips narrate
these two fields - ten intro, ten path, 9,625 characters. Changing the text
without re-recording leaves the voice saying the old words over the new page,
which is worse than leaving it, because today they agree. Re-record before
deploying:

    node tools/generate-ehel-english-audio.js 1 overview --dry    # cost first

    python tools/repair-english-g1-overview-text.py               # dry run
    python tools/repair-english-g1-overview-text.py --write

Idempotent: a second run reports nothing to do.
"""
import io
import json
import os
import re
import sys

BASE = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1', 'data', 'units')

REVIEW_FLAG = 'Needs re-review (overview and path rewritten to the learner reading level)'

# The five lines units 1-9 share verbatim. Keyed by the old line so a unit that
# has drifted from the boilerplate is left untouched rather than overwritten.
PATH_LINES = {
    'Begin with the guided teacher launch and learn a few words through pictures and play.':
        'Start with your teacher. Learn a few new words with pictures and games.',
    'Listen to the Unit story and join in with repeated language.':
        'Listen to the Unit story. Join in with the words you know.',
    'Complete the twelve language, speaking, early-writing and practical activities.':
        'Do the twelve activities. You will speak, write and make things.',
    'If you have access to live teacher sessions, meet your teacher three times each week for two '
    'weeks for extra practice — these are optional, and every skill in this unit is also fully '
    'covered through the teacher launch, story, and speaking and writing activities above.':
        'You may have live lessons with your teacher. They are three times a week, for two weeks. '
        'They are extra practice. You do not have to do them. Everything in this unit is here for '
        'you already.',
    'Finish the ten-question checkpoint, then tell an adult what you can do if one is nearby — or '
    'say it out loud to yourself.':
        'Finish the ten questions. Then tell a grown-up what you can do. If nobody is nearby, say '
        'it out loud to yourself.',
}

OVERVIEWS = {
    1: 'Welcome to your first unit of Year 1 English. You will learn the words for things in your '
       'classroom. You will learn some colour words too. You will say your own name and how old you '
       'are. School is a happy place. This unit helps you feel at home in it. Say the words out loud '
       'and enjoy them. This is about brave first steps, not perfect spelling.',
    2: 'In this unit you will learn the words for the people in your family. They are mum, dad, '
       'sister, brother, grandma and grandpa. You will learn some breakfast and fruit words too. You '
       'will count from 1 to 10. You will talk about who is in your family. You will talk about how '
       'families help each other and have fun. Say the words out loud. This is about talking with '
       'confidence, not perfect spelling.',
    3: 'In this unit you will learn the words for games and play. They are words like bounce, roll, '
       'throw and catch. You will name the parts of your body. You will learn the words that say '
       'where something is: on, under, next to, left and right. You will play simple games. You will '
       'try a game from another country. You will listen to a funny story. You will hear the short '
       "'u' sound in sun, fun and duck. Learn by playing. That is the best way.",
    4: 'In this unit you will learn the words for shapes, colours and clothes. You will make things '
       'from paper shapes. You will make a paper quilt, a picture and a shape animal. You will talk '
       'about what people are wearing. You will dress up in pretend party costumes. You will meet '
       "the short 'e' sound in hen, pen and tent. Making things takes patience. It is fun to try, "
       'try again.',
    5: 'In this unit you will learn about the farm. You will name the farm animals and the sounds '
       'they make. You will learn farm words like tractor, barn and field. You will talk about the '
       'work people do on a farm: feeding, planting and picking. You will see how animals and plants '
       'grow. A chick comes from an egg. A bean comes from a seed. You will hear a gentle story '
       'about helping and working hard. Say the words out loud. This is about speaking with '
       'confidence, not perfect spelling.',
    6: 'In this unit you will learn about your five senses. They are seeing, hearing, smelling, '
       'tasting and touching. You will learn the part of your body you use for each one. You will '
       'learn describing words like soft, loud, sweet and cold. You will begin to compare things. A '
       'tree is tall. A building is taller. Most of all you will explore the world around you. Stay '
       'curious, and be thankful for all the wonderful things you can sense.',
    7: 'In this unit you will learn how we travel and get around. You will meet the words for ways '
       'to travel. They are walk, bus, car, bicycle and boat. You will learn to say how you go to '
       'school. You will talk about journeys. You will go somewhere with the people you love, stay '
       'safe, and enjoy the trip. Say the words out loud. This is about confident everyday English, '
       'not perfect spelling.',
    8: 'In this unit you will learn about water. You will learn where it comes from and where we '
       'find it. You will learn all the ways we use it every day. You will meet rainy and sunny '
       'weather. You will meet animals that live in water. Water is a gift, and we should never '
       'waste it. Say the words out loud. This is about confident English and being thankful for '
       'water, not perfect spelling.',
    9: 'In this unit you will learn the words for places in a town. They are the shop, the market, '
       'the school, the hospital and the library. You will learn about the people who work in these '
       'places. You will learn the words that tell us where something is: near, far and next to. You '
       'will meet the traffic lights too. Red means stop. Green means go. A town is full of helpful '
       'places and kind people. We all help to keep it clean and safe.',
    10: 'This is your capstone. It is a celebration of your first year of English. You will choose '
        'your favourite work for a picture-and-word portfolio. You will make a six-page mini-book. '
        'You will give a one-minute presentation. You will think about what you would like to learn '
        'next. Everything you have learned this year comes together here.',
}

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
    sentences = [s for s in re.split(r'(?<=[.!?])\s+|\n+', text) if s.strip()]
    words = re.findall(r"[A-Za-z']+", text)
    if not sentences or not words:
        return None, None
    wps = len(words) / float(len(sentences))
    spw = sum(syllables(w) for w in words) / float(len(words))
    return 0.39 * wps + 11.8 * spw - 15.59, wps


def rewrite_path(text):
    out = []
    for line in text.split('\n'):
        stripped = line.strip()
        out.append(PATH_LINES.get(stripped, line) if stripped else line)
    return '\n'.join(out)


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    ov_before, ov_after, lp_before, lp_after = [], [], [], []
    changed = flagged = 0
    lines_seen = set()
    per_file = []

    for n in range(1, 11):
        path = os.path.join(BASE, 'unit-%d.json' % n)
        raw = io.open(path, encoding='utf-8').read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

        unit = doc['unit']
        file_changed = 0

        old_ov = unit['unitOverview']
        new_ov = OVERVIEWS.get(n, old_ov)
        ov_before.append(old_ov)
        ov_after.append(new_ov)
        if new_ov != old_ov:
            unit['unitOverview'] = new_ov
            changed += 1
            file_changed += 1

        old_lp = unit['learningPath']
        new_lp = rewrite_path(old_lp)
        lp_before.append(old_lp)
        lp_after.append(new_lp)
        for line in old_lp.split('\n'):
            if line.strip() in PATH_LINES:
                lines_seen.add(line.strip())
        if new_lp != old_lp:
            unit['learningPath'] = new_lp
            changed += 1
            file_changed += 1

        if file_changed and unit.get('reviewStatus') != REVIEW_FLAG:
            unit['reviewStatus'] = REVIEW_FLAG
            flagged += 1
            file_changed += 1

        per_file.append((n, file_changed))
        if write and file_changed:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

    missing = set(PATH_LINES) - lines_seen
    if missing and not write:
        # only meaningful on the first pass; after a write the old lines are gone
        already = all(c == 0 for _, c in per_file)
        if not already:
            sys.exit('REFUSED: %d boilerplate path line(s) match nothing, so they would silently do '
                     'nothing.' % len(missing))

    fo, wo = flesch_kincaid('\n'.join(ov_before))
    fo2, wo2 = flesch_kincaid('\n'.join(ov_after))
    fl, wl = flesch_kincaid('\n'.join(lp_before))
    fl2, wl2 = flesch_kincaid('\n'.join(lp_after))
    longest = max(len(re.findall(r"[A-Za-z']+", s))
                  for t in ov_after + lp_after
                  for s in re.split(r'(?<=[.!?])\s+|\n+', t) if s.strip())

    print('\n  Grade 1 overviews and learning paths  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    fields rewritten    : %d' % changed)
    print('    approval flags moved: %d' % flagged)
    print('    unit overviews      : FK %.2f -> %.2f   (w/sent %.1f -> %.1f)' % (fo, fo2, wo, wo2))
    print('    learning paths      : FK %.2f -> %.2f   (w/sent %.1f -> %.1f)' % (fl, fl2, wl, wl2))
    print('    longest sentence    : %dw' % longest)
    print('    chars to re-record  : %d intro + %d path = %d across 20 clips' % (
        sum(len('. '.join(re.split(r'(?<=[.!?])\s+', t)[:2])) for t in ov_after),
        sum(len(' '.join(l.strip() for l in t.split('\n') if l.strip())) for t in lp_after),
        sum(len('. '.join(re.split(r'(?<=[.!?])\s+', t)[:2])) for t in ov_after)
        + sum(len(' '.join(l.strip() for l in t.split('\n') if l.strip())) for t in lp_after)))
    print('    per unit: %s' % ', '.join('u%d:%d' % r for r in per_file))
    if not write and changed == 0:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
