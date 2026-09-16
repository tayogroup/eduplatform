# -*- coding: utf-8 -*-
"""Three more questions in Days, Months and Clocks' check, so the shortest check
in the build stops being the harshest.

    python lengthen-days-check.py            # report
    python lengthen-days-check.py --write

THE RULE IS ONE PASS MARK; THE LEVER IS LENGTH. Every check in every Maths grade
passes at ceil(total * 0.75) since f6dc0c73a, and that is right - a child should
not need a different score in one lesson than another. But a uniform ratio bites
hardest on a SHORT check: Days asked 5 questions, so ceil(5 * 0.75) is 4, and a
child had to score 80% where a fifteen-question lesson asks 75%. Grade 3 had the
identical problem in five lessons and it was fixed the same way, by lengthening
the check rather than softening the rule (90a85e155).

Measured across the build before this ran:

    counting 15 -> 12 (80%)   adding 11 -> 9 (82%)    halves 10 -> 8 (80%)
    patterns 15 -> 12 (80%)   shapes 13 -> 10 (77%)   data 16 -> 12 (75%)
    days      5 ->  4 (80%) on three objectives - the whole lesson on five questions

Eight questions land on 6, which is 75%, and give each of the lesson's three
objectives more than one asking. The pass mark is not written down anywhere
here: the page computes it from CHECK.length, so adding items moves it by
itself. That is checked below rather than assumed.

WHAT EACH NEW QUESTION IS FOR. The five it had asked days-after, the months
count, the shortest span, o'clock and half past - so 1Gt.01 rested on a single
question and neither ring was ever walked backwards.

    1Gt.02  which month comes after March        the months IN ORDER, not just counted
    1Gt.02  which day comes before Wednesday     the ring walked the other way
    1Gt.01  which is longer, a minute or an hour comparing two units of time

All three are phrased so that check-answer-keys.py can COMPUTE the answer -
it carries rules for "which day/month comes after/before X" and for "which is
longer: A or B" over named spans - so none of them rests on my say-so.

Guarded by a marker, and it refuses unless the check is exactly the five
questions it expects. Written with the Write tool, never a heredoc.
"""
import io, os, re, sys, math

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "g1v2", "days-months-and-clocks.html")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-days-check-8"
TAIL = ('    { q: "The long hand is on <b>6</b> and the short hand is just past <b>4</b>. '
        'What time is it?", pic: "", opts: ["half past 4", "6 o\'clock", "4 o\'clock"], '
        'a: "half past 4", why: "The long hand on 6 means half past, and the short hand is just past 4." },\n')

NEW = (
    '    /* ' + MARK + ' - see grade-1-app/lengthen-days-check.py */\n'
    '    { q: "Which <b>month</b> comes after March?", pic: "", opts: ["April", "February", "May"], '
    'a: "April", why: "The months go January, February, March, April. April comes straight after March." },\n'
    '    { q: "Which day comes <b>before</b> Wednesday?", pic: "", opts: ["Tuesday", "Thursday", "Monday"], '
    'a: "Tuesday", why: "The week goes Monday, Tuesday, Wednesday. Tuesday is the day before Wednesday." },\n'
    '    { q: "Which is <b>longer</b>: a minute or an hour?", pic: "", opts: ["an hour", "a minute", "they are the same"], '
    'a: "an hour", why: "An hour is much longer than a minute. Sixty minutes make one hour." },\n'
)

s = io.open(P, encoding="utf-8", newline="").read()
if MARK in s:
    sys.exit("  already done")

m = re.search(r"const CHECK = \[(.*?)\n  \];", s, re.S)
bad = []
if not m:
    bad.append("no CHECK array")
else:
    n = len(re.findall(r"\{ q: ", m.group(1)))
    if n != 5:
        bad.append("the check holds %d questions, not the 5 this tool was written for" % n)
if s.count(TAIL) != 1:
    bad.append("the last check question is not the one this tool expects (found %d)" % s.count(TAIL))
# the pass mark must be DERIVED, or lengthening the check would not move it
if not re.search(r"rightc >= Math\.ceil\(CHECK\.length \* 0\.75\)", s):
    bad.append("the pass mark is not computed from CHECK.length")
if bad:
    sys.exit("  REFUSED  " + "; ".join(bad))

was = 5
now = was + len(re.findall(r"\{ q: ", NEW))
print("  days-months-and-clocks.html  check %d -> %d questions, pass %d -> %d (%d%% -> %d%%)"
      % (was, now, math.ceil(was * 0.75), math.ceil(now * 0.75),
         round(100 * math.ceil(was * 0.75) / was), round(100 * math.ceil(now * 0.75) / now)))

s = s.replace(TAIL, TAIL + NEW, 1)
assert s.count(MARK) == 1
if WRITE:
    io.open(P, "w", encoding="utf-8", newline="").write(s)
    print("  written")
else:
    print("  dry run -- pass --write")
