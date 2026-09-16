# -*- coding: utf-8 -*-
"""What the end-to-end read of the Grade 2 answer keys found, fixed.

    python fix-read-findings.py            # report
    python fix-read-findings.py --write

THE READ. check-answer-keys.py recomputes every key it can derive and reports
the rest as unverified rather than counting them as passes. That left 324 items
in the review pack whose key rests on the author alone, and they were read
question by question against the objective each belongs to.

Most of what the read turned up was MY INSTRUMENT, not the content, and those
fixes are in build-review-pack.py rather than here: 26 questions appeared to
tell the child nothing on answering, and 7 of them in fact carry a `w: [...]`
array the pack did not know to read - the runner shows both lines and speaks
the first. A reviewer told "no explanation" would have gone hunting for a defect
that was not there.

TWO REAL DEFECTS, and one of them reaches a child:

  1. "You have one 20 sh and two 10 sh coins. How many different amounts can
     you pay exactly?" was keyed 7. Seven is how many GROUPS of coins you can
     make; the question asks how many different AMOUNTS, and those are 10, 20,
     30 and 40 - four. The explanation listed six sums, so it agreed with
     neither. The question now asks what it meant to ask.

  2. Nineteen questions in "Seconds to years" carry no explanation at all -
     answering one gets "The answer is 60." and nothing else. Every key is
     right; what is missing is the teaching. That step is the one place in the
     build where a child who guesses wrong learns only what the answer was, and
     it undercuts the one row this course clearly leads on. Each now says why,
     and the runner shows it.

Guarded on exact text; refuses if a target is not there exactly once.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

# ---- 1. the key that answered a different question --------------------------
COINS = [(
    "coins-and-change.html",
    '{ ask: "You have one 20 sh and two 10 sh coins. How many different amounts can you pay exactly?", pic: "",\n'
    '        opts: [{ t: "7", ok: true }, { t: "3", ok: false }, { t: "40", ok: false }],\n'
    '        why: "Try every group: 10, 20, 20, 30, 30, 40. Listing them all is how you know you have them all." },',
    '{ ask: "You have one 20 sh and two 10 sh coins. How many different amounts can you pay exactly?", pic: "",\n'
    '        opts: [{ t: "4", ok: true }, { t: "3", ok: false }, { t: "7", ok: false }],\n'
    '        why: "The amounts are 10, 20, 30 and 40. There are seven groups of coins you could pick up, '
    'but two of them make 20 and two make 30, so only four different amounts." },',
    "it was keyed 7, which is how many GROUPS of coins there are; the question "
    "asks how many different AMOUNTS, and those are 10, 20, 30 and 40",
)]

# ---- 2. nineteen questions that said only what the answer was ---------------
WHYS = {
    "How many minutes in an hour?": "One whole turn of the long hand is 60 minutes.",
    "How many hours in a day?": "24 hours is a whole day and night: 12 hours twice round the clock.",
    "How many days in a week?": "Monday to Sunday is seven days.",
    "How many months in a year?": "January to December is twelve months.",
    "How many minutes in half an hour?": "Half of 60 is 30, because 30 and 30 make 60.",
    "How many minutes in quarter of an hour?": "A quarter of 60 is 15, because four 15s make 60.",
    "About how long to brush your teeth?": "Minutes are the right unit. A second is far too short and "
                                           "an hour is far too long.",
    "About how long is a night's sleep?": "A night's sleep is measured in hours, not minutes or days.",
    "About how long to blink?": "A blink is over before you can say it, so seconds are the right unit.",
    "How many hours in half a day?": "Half of 24 is 12, because 12 and 12 make 24.",
    "Which is the longest?": "A week holds seven days, and each day holds 24 hours.",
    "Which is the shortest?": "Seconds make minutes, and minutes make hours, so a second is the smallest.",
    "Shortest first, which order is right?": "60 minutes make an hour and 24 hours make a day, so "
                                             "minute comes first and day last.",
    "Which is longer: 100 minutes, or 1 hour?": "An hour is only 60 minutes, and 100 is more than 60.",
    "How many minutes are in 3 hours?": "Count on in sixties: 60, 120, 180.",
    "How many hours are in 2 days?": "Two lots of 24: 24 and 24 make 48.",
    "How many days are in 3 weeks?": "Count on in sevens: 7, 14, 21.",
    "How many seconds are in 4 minutes?": "Count on in sixties: 60, 120, 180, 240.",
}
# both statements sit on ONE line, separated by "; " - not on two, which is what
# the first version of this anchor assumed and why it matched nothing
FB_OLD = ('$("fb7").textContent = (ok ? cheer() + " " : "") + "The answer is " + Q.a + "."; '
          'say((ok ? cheer() + " " : "") + "The answer is " + Q.a);')
FB_NEW = ('$("fb7").textContent = (ok ? cheer() + " " : "") + "The answer is " + Q.a + ". " '
          '+ (Q.why || ""); '
          'say((ok ? cheer() + " " : "") + "The answer is " + Q.a + ". " + (Q.why || ""));')

done = skipped = refused = 0

for name, old, new, why in COINS:
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if new in s:
        print("  already  %-26s %s" % (name, why[:46]))
        skipped += 1
        continue
    if s.count(old) != 1:
        print("  REFUSED  %-26s the item is there %d times, not once" % (name, s.count(old)))
        refused += 1
        continue
    s = s.replace(old, new, 1)
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-26s %s" % ("wrote  " if WRITE else "would  ", name, why))
    done += 1

p = os.path.join(HERE, "half-past-quarter-to.html")
s = io.open(p, encoding="utf-8", newline="").read()
if "Q.why" in s:
    print("  already  %-26s the nineteen explanations" % "half-past-quarter-to.html")
    skipped += 1
else:
    bad = []
    if s.count(FB_OLD) != 1:
        bad.append("the feedback line is there %d times, not once" % s.count(FB_OLD))
    missing = [q for q in WHYS if ('{ q: "%s"' % q.replace('"', '\\"')) not in s]
    if missing:
        bad.append("%d question(s) not found: %s" % (len(missing), missing[0][:40]))
    if bad:
        print("  REFUSED  %-26s %s" % ("half-past-quarter-to.html", "; ".join(bad)))
        refused += 1
    else:
        n = 0
        for q, w in WHYS.items():
            # the item ends at the first `] }` or `], kind: "..." }` after its opts
            pat = re.compile(r'(\{ q: "%s", a: "[^"]*", opts: \[[^\]]*\](?:, kind: "\w+")?) \}'
                             % re.escape(q))
            m = pat.search(s)
            assert m, q
            s = s[:m.start()] + m.group(1) + ', why: "%s" }' % w + s[m.end():]
            n += 1
        s = s.replace(FB_OLD, FB_NEW, 1)
        if WRITE:
            io.open(p, "w", encoding="utf-8", newline="").write(s)
        print("  %s %-26s %d questions in Seconds to years now say WHY, not just what"
              % ("wrote  " if WRITE else "would  ", "half-past-quarter-to.html", n))
        done += 1

print("\n  %d fix(es) %s, %d already applied, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
