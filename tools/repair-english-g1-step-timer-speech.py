# -*- coding: utf-8 -*-
"""Only the step on screen may speak - now in the games and the book questions.

WHY. The deck's stale-timer race was fixed on 2026-09-10: a check step armed a
2.2-2.7s timer that spoke after the child had pressed Next, and the old step's
line cut off the new step's instruction. finish() and sequence()'s draw() were
guarded with `cur === i` and the bookkeeping left to run.

The validation recorded the games and books timers as UNMEASURED. They are
measured now and they carry the same defect:

    games.js:105  setTimeout(drawRound, 900)     -> six say() sites, through
                                                    the five round drawers
    books.js:470  setTimeout(advance, 900)   \
    books.js:495  setTimeout(advance, 900)    >-- all three reach ONE say(),
    books.js:511  setTimeout(draw, 650)      /    books.js draw()

So seven speech sites behind four timers, none of which asks whether its step
is still showing.

THE GUARD IS ON THE SPEECH, NOT ON THE WORK - the same shape finish() takes.
A game round still draws, a question still advances, the board still repaints;
a child who comes back finds the state they would expect. What no longer
happens is a voice reading a game prompt over a step the child has left.

IT ALSO SILENCES THE LOAD. Every renderer draws once at load, because the deck
paints all its slides and hides them with CSS - which is exactly why
english.js has playHere() for clips. These say() calls had no such guard, so
the drawers spoke at load too. `cur === o.finish` covers both paths with one
condition, and when the child does arrive the first draw speaks normally.

    python tools/repair-english-g1-step-timer-speech.py          # dry run
    python tools/repair-english-g1-step-timer-speech.py --write

Idempotent: it refuses to run twice by checking for its own helper.
"""
import io
import os
import sys

LIB = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-1-app', 'lib')

HELPER = (
    '\n'
    '    /* ONLY THE STEP ON SCREEN MAY SPEAK. Same rule as the deck\'s finish()\n'
    '       and english.js\'s playHere(): the work runs, the voice asks first.\n'
    '       Covers two paths at once - a timer that fires after the child has\n'
    '       moved on, and the draw every renderer does at load while its slide\n'
    '       is still hidden. */\n'
    '    const sayHere = (m) => { if (cur === o.finish) say(m); };\n'
)

# file -> (anchor the helper goes after, [(exact line to replace, how many)])
PLAN = {
    'games.js': (
        '  function gameZone(o) {\n',
        [
            ('        say(plain(round.prompt));\n',
             '        sayHere(plain(round.prompt));\n', 3),
            ('        say(plain(round.clue || round.prompt));\n',
             '        sayHere(plain(round.clue || round.prompt));\n', 1),
            ('        say(plain(round.prompt || "Tap two tiles that go together."));\n',
             '        sayHere(plain(round.prompt || "Tap two tiles that go together."));\n', 1),
            ('        say(plain(round.target || round.prompt));\n',
             '        sayHere(plain(round.target || round.prompt));\n', 1),
        ],
    ),
    'books.js': (
        '  function bookQuestions(o) {\n',
        [
            ('      say(q.kind === "choice" ? q.q + " Is it " + q.options.join(", or ") + "?" : q.q);\n',
             '      sayHere(q.kind === "choice" ? q.q + " Is it " + q.options.join(", or ") + "?" : q.q);\n', 1),
        ],
    ),
}


def main():
    write = '--write' in sys.argv
    for a in sys.argv[1:]:
        if a != '--write':
            sys.exit('REFUSED: unrecognised argument %r.' % a)

    total = 0
    report = []
    for name, (anchor, subs) in PLAN.items():
        path = os.path.join(LIB, name)
        src = io.open(path, encoding='utf-8').read()
        if 'const sayHere' in src:
            report.append((name, 'already guarded', 0))
            continue
        if src.count(anchor) != 1:
            sys.exit('REFUSED: %s has %d copies of its anchor, expected 1.'
                     % (name, src.count(anchor)))
        n = 0
        for old, new, want in subs:
            got = src.count(old)
            if got != want:
                sys.exit('REFUSED: %s expected %d copies of\n    %s\n  found %d. '
                         'The file moved under this tool; re-read it before writing.'
                         % (name, want, old.strip(), got))
            src = src.replace(old, new)
            n += want
        src = src.replace(anchor, anchor + HELPER, 1)
        # nothing may be left speaking unguarded on these paths
        report.append((name, '%d speech site(s) guarded' % n, n))
        total += n
        if write:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(src)

    print('\n  Grade 1 step-timer speech  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    for name, msg, _n in report:
        print('    %-12s %s' % (name, msg))
    print('    total: %d' % total)
    print('')


if __name__ == '__main__':
    main()
