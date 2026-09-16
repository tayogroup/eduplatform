# -*- coding: utf-8 -*-
""""Will it always work?" - specialising, then generalising.

    python add-always-true.py            # report
    python add-always-true.py --write

THE TWO CHARACTERISTICS. Cambridge's Stage 2 Guide names all eight Thinking and
Working Mathematically characteristics; specialising (trying particular cases)
and generalising (saying what holds in every case) are the pair a multiple-choice
build can actually carry, and they only work in that order. Each claim is tested
on TWO examples and only then judged: specialise, specialise, generalise.

ONE CLAIM IN EACH PAIR IS FALSE ON PURPOSE. If every claim held, "always" would
answer a question the child never has to think about - and the false claim
carries the real lesson, that ONE counterexample settles a claim however many
examples supported it. The audit enforces exactly two claims, three items each,
and exactly one claim holding.

EVERY BREAKING EXAMPLE IS SOMETHING THE LESSON ALREADY TEACHES. A counterexample
a child has never met is a trick; one they have met is a lesson. 5 times 1 is
still 5; 1 quarter is smaller than 1 half; 1, 3, 6, 10 grows by a different
amount each time; a spinner does not remember its last spin.

THE CHANCE CLAIM IS STAGE 2 CONTENT, not a borrowed one: Stage 2 teaches chance
(2Sp) and Stage 1 does not, so "if it has not happened for a while it is more
likely next" is a misconception these learners can now actually hold.

Guarded by a marker; it uses the runner add-spot-the-mistake.py installs and
refuses a lesson without it.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-always-true"
CEILING = 100
FINISH = "  function finish(i, msg)"

# lesson -> (code, [(who, claim, holds?, [(ask, [(opt, right)], why) x3])] x2)
WORK = {
    "tens-and-ones": ("2Nc.01", [
        ("Amina", "Every number that ends in a zero is even.", True, [
            ("Amina tries 20. Is 20 even?", [("Yes, 20 is even", True), ("No, 20 is odd", False)],
             "20 goes into pairs with none left over. The idea holds so far."),
            ("Now she tries 70. Is 70 even?", [("Yes, 70 is even", True), ("No, 70 is odd", False)],
             "70 also goes into pairs with none left over. The idea has held twice now."),
            ("So does Amina's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "A number ending in zero is a whole number of tens, and every ten splits into two fives."),
        ]),
        ("Musa", "When you multiply, the answer is always bigger than both numbers.", False, [
            ("Musa tries 2 times 5, which is 10. Is 10 bigger than both 2 and 5?",
             [("Yes, 10 is bigger than both", True), ("No, it is not", False)],
             "10 is bigger than 2 and bigger than 5. Musa's idea has worked once."),
            ("Now try 5 times 1, which is 5. Is 5 bigger than 5?",
             [("No, it is the same", True), ("Yes, it is bigger", False)],
             "Multiplying by 1 leaves a number exactly as it was. That one example breaks the idea."),
            ("So does Musa's idea always work?",
             [("No, it does not always work", True), ("Yes, it always works", False),
              ("It never works", False)],
             "One example that breaks an idea is enough to settle it, however many supported it."),
        ]),
    ]),
    "coins-and-change": ("2Nm.02", [
        ("Hodan", "If you pay with more than the price, you always get change.", True, [
            ("A pen costs 20 sh and Hodan pays 50 sh. Does she get change?",
             [("Yes, 30 sh", True), ("No, none", False)],
             "50 is more than 20, so 30 sh comes back. The idea holds so far."),
            ("A book costs 45 sh and she pays 50 sh. Does she get change?",
             [("Yes, 5 sh", True), ("No, none", False)],
             "50 is more than 45, so 5 sh comes back. The idea has held twice now."),
            ("So does Hodan's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "Paying more than the price always leaves something over, and what is left over is the change."),
        ]),
        ("Ali", "More coins always means more money.", False, [
            ("Ali has four 10 sh coins and Kiki has two 10 sh coins. Has Ali more money?",
             [("Yes, 40 sh beats 20 sh", True), ("No, Kiki has more", False)],
             "Four tens is 40 and two tens is 20. Ali's idea has worked once."),
            ("Now Ali has five 1 sh coins and Kiki has one 20 sh coin. Has Ali more money?",
             [("No, Kiki has more", True), ("Yes, five coins beats one", False)],
             "Five 1 sh coins is only 5 sh, and Kiki has 20 sh. That breaks the idea."),
            ("So does Ali's idea always work?",
             [("No, it does not always work", True), ("Yes, it always works", False),
              ("It never works", False)],
             "It is what the coins are WORTH that counts, not how many of them there are."),
        ]),
    ]),
    "fair-shares": ("2Nf.01", [
        ("Kiki", "Four quarters always make one whole.", True, [
            ("Kiki puts four quarters of an orange together. Does she get one whole orange?",
             [("Yes, one whole orange", True), ("No, two oranges", False)],
             "The four equal parts fit back into the one orange she started with. The idea holds so far."),
            ("She puts four quarters of a cake together. Does she get one whole cake?",
             [("Yes, one whole cake", True), ("No, half a cake", False)],
             "Four quarters of anything fit back together into one whole of it. Held twice now."),
            ("So does Kiki's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "A quarter means one of four equal parts, so all four put back together is the whole again."),
        ]),
        ("Musa", "The bigger the bottom number, the bigger the fraction.", False, [
            ("Musa compares one half and one quarter. Is one half bigger?",
             [("Yes, one half is bigger", True), ("No, one quarter is bigger", False)],
             "Cut the same cake into 2 instead of 4 and each piece is bigger. His idea has failed once already."),
            ("He compares one quarter and one third. Is one third bigger?",
             [("Yes, one third is bigger", True), ("No, one quarter is bigger", False)],
             "Three parts are bigger than four parts of the same thing. It breaks again."),
            ("So does Musa's idea always work?",
             [("No, it never works that way round", True), ("Yes, it always works", False),
              ("It works sometimes", False)],
             "The more equal parts you cut something into, the SMALLER each part gets."),
        ]),
    ]),
    "patterns-that-grow": ("2Nc.04", [
        ("Amina", "When you count on in tens, the ones digit never changes.", True, [
            ("Amina starts at 23 and counts on ten to 33. Did the ones digit change?",
             [("No, it is still 3", True), ("Yes, it changed", False)],
             "23 and 33 both end in 3. Only the tens digit moved. The idea holds so far."),
            ("She counts on ten again to 43. Did the ones digit change?",
             [("No, it is still 3", True), ("Yes, it changed", False)],
             "43 ends in 3 as well. The idea has held twice now."),
            ("So does Amina's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "Adding ten adds a whole ten and no ones at all, so the ones digit has nothing to change by."),
        ]),
        ("Hodan", "A pattern that grows always goes up by the same amount.", False, [
            ("Hodan looks at 5, 10, 15, 20. Does it go up by the same amount each time?",
             [("Yes, 5 every time", True), ("No, the jumps change", False)],
             "Every jump is 5. Hodan's idea has worked once."),
            ("Now she looks at 1, 3, 6, 10. Does it go up by the same amount each time?",
             [("No, the jumps are 2, 3 and 4", True), ("Yes, 2 every time", False)],
             "The jumps get bigger each time, and it is still a growing pattern. That breaks the idea."),
            ("So does Hodan's idea always work?",
             [("No, it does not always work", True), ("Yes, it always works", False),
              ("It never works", False)],
             "A growing pattern only has to get bigger. The jump may grow as well."),
        ]),
    ]),
    "sides-and-corners": ("2Gg.01", [
        ("Ali", "A shape always has the same number of corners as sides.", True, [
            ("Ali counts a triangle: 3 sides. How many corners?",
             [("3 corners", True), ("4 corners", False)],
             "Each corner is where two sides meet, so a triangle has 3 of each. Holds so far."),
            ("He counts a rectangle: 4 sides. How many corners?",
             [("4 corners", True), ("3 corners", False)],
             "A rectangle has 4 sides and 4 corners. The idea has held twice now."),
            ("So does Ali's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "Every side ends at a corner and every corner joins two sides, so the counts always match."),
        ]),
        ("Kiki", "A shape with more sides is always bigger.", False, [
            ("Kiki compares a small triangle and a big square. Has the square more sides?",
             [("Yes, 4 beats 3", True), ("No, fewer", False)],
             "The square has 4 sides and the triangle has 3. Her idea has worked once."),
            ("Now she compares a huge triangle and a tiny shape with 5 sides. Is the 5-sided shape bigger?",
             [("No, the huge triangle is bigger", True), ("Yes, more sides means bigger", False)],
             "A tiny shape can have many sides. Size and number of sides are different things."),
            ("So does Kiki's idea always work?",
             [("No, it does not always work", True), ("Yes, it always works", False),
              ("It never works", False)],
             "How many sides a shape has says nothing about how much room it takes up."),
        ]),
    ]),
    "which-way-from-here": ("2Gp.01", [
        ("Musa", "Four quarter turns always bring you back to where you started.", True, [
            ("Musa faces the door and makes four quarter turns. Does he face the door again?",
             [("Yes, the door again", True), ("No, the window", False)],
             "Four quarter turns is one whole turn, all the way round. Holds so far."),
            ("He faces the window and makes four quarter turns. Does he face the window again?",
             [("Yes, the window again", True), ("No, the door", False)],
             "Four quarter turns is a whole turn whichever way you start. Held twice now."),
            ("So does Musa's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "A whole turn finishes exactly where it started, and four quarters make one whole turn."),
        ]),
        ("Amina", "A mirror picture always looks exactly the same as the original.", False, [
            ("Amina holds a circle up to a mirror line. Does it look the same?",
             [("Yes, it looks the same", True), ("No, it is flipped", False)],
             "A circle looks the same either way round. Her idea has worked once."),
            ("Now she holds up a shape like the letter F. Does it look the same?",
             [("No, it is flipped over", True), ("Yes, it looks the same", False)],
             "The F faces the other way in the mirror. That one example breaks the idea."),
            ("So does Amina's idea always work?",
             [("No, it does not always work", True), ("Yes, it always works", False),
              ("It never works", False)],
             "A mirror turns a picture over. Some shapes look the same turned over, and most do not."),
        ]),
    ]),
    "how-much-how-long": ("2Gg.03", [
        ("Hodan", "If two things are measured with the same unit, the bigger number is longer.", True, [
            ("A pencil takes 9 cubes and a crayon takes 5 cubes. Is the pencil longer?",
             [("Yes, the pencil is longer", True), ("No, the crayon is longer", False)],
             "Same cubes both times, so the counts can be compared. Holds so far."),
            ("A desk takes 30 cubes and a chair takes 20 cubes. Is the desk longer?",
             [("Yes, the desk is longer", True), ("No, the chair is longer", False)],
             "The same cubes again, so 30 is longer than 20. Held twice now."),
            ("So does Hodan's idea always work?",
             [("Yes, as long as the unit is the same", True), ("It never works", False),
              ("It works with any units", False)],
             "The unit must be the SAME both times. Different units make the counts mean different things."),
        ]),
        ("Ali", "A bigger object is always heavier.", False, [
            ("Ali compares a big stone and a small stone. Is the big one heavier?",
             [("Yes, the big stone", True), ("No, the small one", False)],
             "Two stones of the same kind: the bigger is heavier. His idea has worked once."),
            ("Now he compares a big bag of feathers and a small bag of stones. Is the big bag heavier?",
             [("No, the stones are heavier", True), ("Yes, the big bag is heavier", False)],
             "A big bag of feathers weighs less than a small bag of stones. That breaks the idea."),
            ("So does Ali's idea always work?",
             [("No, it does not always work", True), ("Yes, it always works", False),
              ("It never works", False)],
             "Size does not tell you the mass. You have to weigh it to know."),
        ]),
    ]),
    "half-past-quarter-to": ("2Gt.01", [
        ("Kiki", "Every hour has 60 minutes, whatever time of day it is.", True, [
            ("Kiki counts the minutes from 2 o'clock to 3 o'clock. How many?",
             [("60", True), ("30", False)],
             "One whole turn of the long hand is 60 minutes. Holds so far."),
            ("She counts from 9 o'clock to 10 o'clock. How many minutes?",
             [("60", True), ("100", False)],
             "The same again: an hour is an hour whenever it happens. Held twice now."),
            ("So does Kiki's idea always work?",
             [("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
             "An hour is defined as 60 minutes, so it never changes with the time of day."),
        ]),
        ("Musa", "When the long hand moves to the next number, one minute has passed.", False, [
            ("The long hand moves from 12 to 1. Has one minute passed?",
             [("No, five minutes", True), ("Yes, one minute", False)],
             "There are five small marks between the numbers, so it is 5 minutes. It fails at once."),
            ("It moves from 1 to 2. Has one minute passed?",
             [("No, five minutes again", True), ("Yes, one minute", False)],
             "Every gap between two numbers is 5 minutes. It fails again."),
            ("So does Musa's idea always work?",
             [("No, it never works", True), ("Yes, it always works", False),
              ("It works sometimes", False)],
             "Count round the clock face in fives: 5, 10, 15. Each number is five minutes on."),
        ]),
    ]),
    "count-it-chart-it": ("2Ss.02", [
        ("Amina", "On a block graph where one block is one child, the tallest bar has the most children.", True, [
            ("6 chose mango and 4 chose banana, so mango is taller. Did more choose mango?",
             [("Yes, 6 is more than 4", True), ("No, banana", False)],
             "Each block is one child, so a taller stack is more children. Holds so far."),
            ("2 chose apple and 5 chose orange, so orange is taller. Did more choose orange?",
             [("Yes, 5 is more than 2", True), ("No, apple", False)],
             "Taller again means more. The idea has held twice now."),
            ("So does Amina's idea always work?",
             [("Yes, when one block is one child", True), ("It never works", False),
              ("It works whatever the key says", False)],
             "It rests on the key. If one block stood for two children you would have to count differently."),
        ]),
        ("Hodan", "If something has not happened for a while, it is more likely to happen next.", False, [
            ("A coin lands on heads three times. Is tails now certain?",
             [("No, it is still just as likely as heads", True), ("Yes, tails is certain", False)],
             "The coin does not remember. Her idea has failed once already."),
            ("A spinner misses red five times. Is red now more likely?",
             [("No, every colour is still equally likely", True), ("Yes, red is due", False)],
             "Each spin is on its own, exactly like the first one. It fails again."),
            ("So does Hodan's idea always work?",
             [("No, it never works", True), ("Yes, it always works", False),
              ("It works sometimes", False)],
             "A coin and a spinner have no memory. What happened before changes nothing about the next go."),
        ]),
    ]),
}

cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
ORDER = [l["file"][:-5] for l in cfg["lessons"]]

# ---- the audit ---------------------------------------------------------------
assert sorted(WORK) == sorted(ORDER), "every lesson needs a pair of claims"
for key, (code, claims) in WORK.items():
    assert len(claims) == 2, "%s: two claims" % key
    holds = 0
    for who, claim, does_hold, items in claims:
        if does_hold:
            holds += 1
        assert len(items) == 3, "%s: specialise, specialise, generalise" % key
        assert items[2][0].lstrip().startswith("So does"), \
            "%s: the third item must be the verdict" % key
        for ask, opts, why in items:
            assert 2 <= len(opts) <= 3, "%s: two or three options" % key
            assert sum(1 for _t, ok in opts if ok) == 1, "%s: one right option" % key
            assert len(set(t for t, _ in opts)) == len(opts), "%s: repeated option" % key
            for t in (who, claim, ask, why) + tuple(t for t, _ in opts):
                assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe %r" % (key, t)
                for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", t):
                    assert int(n) <= CEILING, "%s: %s is past the ceiling" % (key, n)
    # exactly one of the pair holds - see the docstring
    assert holds == 1, "%s: %d of the two claims hold, and exactly one must" % (key, holds)


def lit(t):
    return '"%s"' % t


CLAIM = """
  /* """ + MARK + """: the claim under test, kept on screen while it is tested */
  const atClaim = (who, idea) => '<div class="at-claim"><p class="at-k">The idea we are testing</p>' +
    '<p class="at-i">' + idea + '</p><p class="at-w">' + who + '</p></div>';
"""

STYLE = """
<style>/* """ + MARK + """ - see add-always-true.py */
  .at-claim { max-width: min(92%, 470px); margin: 0 auto; background: var(--card);
    border: 3px solid var(--gold, #E8B44A); border-radius: 18px; padding: 13px 18px 10px; }
  .at-k { margin: 0 0 4px; font-family: "Inter", "Segoe UI", sans-serif; font-size: 11px;
    letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .at-i { margin: 0; font-size: 20px; line-height: 1.45; color: var(--ink); font-weight: 700; }
  .at-w { margin: 6px 0 0; font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800;
    font-size: 16px; color: var(--muted); text-align: right; }
</style>
"""

done_n = skipped = refused = 0
for l in cfg["lessons"]:
    name, key = l["file"], l["file"][:-5]
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    code, claims = WORK[key]

    bad = []
    if "function secondStep" not in s:
        bad.append("no secondStep runner - run add-spot-the-mistake.py first")
    if s.count(FINISH) != 1:
        bad.append("no single finish()")
    st = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    chk = [i for i, a in enumerate(st)
           if '<span class="n">✓</span>' in s[a:(st[i + 1] if i + 1 < len(st) else len(s))]]
    if len(chk) != 1:
        bad.append("found %d check slides" % len(chk))
    fm = re.search(r"const CHECK\s*=\s*\[[\s\S]*?finish\((\d+)", s)
    if not fm:
        bad.append("no CHECK array with a finish()")
    if bad:
        print("  REFUSED  %-26s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    fi = int(fm.group(1))
    n = max(int(x) for x in re.findall(r'<div class="slide-head"><span class="n">(\d+)</span>', s)) + 1
    sid = "at%d" % n
    at = st[chk[0]]
    slide = (
        '<!-- %d  %s  Will it always work? -->\n    '
        '<section class="slide" data-twm="specialising generalising" '
        'data-say="Somebody has an idea. Test it on each example, then say whether it always works.">\n'
        '      <div class="slide-head"><span class="n">%d</span><h2>Will it always work?</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="%ssay">Test the idea on each example. Then say whether it '
        'always works.</span></div>\n'
        '      <div class="stage" id="%sst"></div>\n'
        '      <div class="choices" id="%sch"></div>\n'
        '      <p class="fb" id="%sfb" role="status" aria-live="polite"></p>\n'
        '      <div class="bigbtns"><button type="button" class="big small teal" id="%snx" hidden>'
        'Next test</button></div>\n'
        '      <p class="score" id="%ssc"></p>\n'
        '    </section>\n    ' % (n, code, n, sid, sid, sid, sid, sid, sid))

    rows = []
    for who, claim, _h, items in claims:
        for ask, opts, why in items:
            rows.append(
                '      { ask: %s,\n        pic: atClaim(%s, %s),\n        opts: [%s],\n        why: %s },'
                % (lit(ask), lit(who), lit(claim),
                   ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false")
                             for t, ok in opts),
                   lit(why)))
    call = (("""
  /* ---- %d: will it always work? - """ + MARK + """, specialising then generalising.
     See add-always-true.py. ---- */
  secondStep({
    el: { say: $("%ssay"), stage: $("%sst"), ch: $("%sch"), fb: $("%sfb"), score: $("%ssc"), next: $("%snx") },
    label: "Test",
    items: [
%s
    ],
    finish: %d,
    done: "You can test an idea and say whether it always works.",
  });
""") % (n, sid, sid, sid, sid, sid, sid, "\n".join(rows), fi))

    s = s[:at] + slide + s[at:]
    ck = s.index("const CHECK")
    head, tailtxt = s[:ck], s[ck:]
    if tailtxt.count("finish(%d" % fi) != 1:
        print("  REFUSED  %-26s finish(%d) appears %d times from CHECK on, not once"
              % (name, fi, tailtxt.count("finish(%d" % fi)))
        refused += 1
        continue
    s = head + tailtxt.replace("finish(%d" % fi, "finish(%d" % (fi + 1), 1)
    ins = s.index(FINISH)
    s = s[:ins] + CLAIM.lstrip("\n") + call.lstrip("\n") + s[ins:]
    s = s.rstrip() + "\n" + STYLE

    assert s.count(MARK) == 3 and s.count('id="%ssay"' % sid) == 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-26s step %-2d  2 claims x 3, check finish(%d)->finish(%d)"
          % ("wrote  " if WRITE else "would  ", name, n, fi, fi + 1))
    done_n += 1

print("\n  %d claim(s), %d item(s) across %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(c) for _k, c in WORK.values()),
         sum(len(i) for _k, c in WORK.values() for _w, _cl, _h, i in c),
         done_n, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
