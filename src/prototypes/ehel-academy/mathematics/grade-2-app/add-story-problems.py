# -*- coding: utf-8 -*-
""""Story problems" - word problems in the measured Cambridge Stage 2 shape.

    python add-story-problems.py            # report
    python add-story-problems.py --write

THE SHAPE IS MEASURED, NOT CARRIED OVER. 48 word problems were pulled out of the
Stage 2 Learner's Book and counted: **median 21 words, 2-3 sentences, the
question always its own sentence, and not one number over 100.** Stage 1's
measured shape was different (4-9 word sentences, answers never past 20), so
reusing it would have written Stage 1 problems in a Stage 2 course.

TWO-STEP PROBLEMS EXIST HERE, AND DID NOT AT STAGE 1. The Stage 1 finding was
flat - "there is no two-step problem in Stage 1" - and it does not transfer: the
Stage 2 Teacher's Guide works one through on p109, chained rather than combined
("Zara's tomato weighed 65 - 10 = 55g, so Jack's tomato weighed 55 + 20 = 75g").
It is rare, though: one mention in the Guide and none in the Learner's Book. So
this allows AT MOST ONE per lesson and the audit enforces that, rather than
banning them (which would be Stage 1's answer) or spreading them (which would
be a harder course than Cambridge asks for).

A two-step item must show BOTH steps in its explanation. A child who gets a
two-step problem wrong is usually right about one half of it, and an explanation
that jumps to the answer tells them nothing about which half.

IT NEEDS THE RUNNER add-spot-the-mistake.py INSTALLS, and refuses a lesson
without it rather than writing a step that cannot run.

IT MOVES THE CHECK, by one, for the same reason that tool does: progress is by
step POSITION. The index is found through the CHECK array, never by position -
every line of script sits after every slide in these pages, so searching forward
from the check SLIDE finds step 1's finish() instead.

Guarded by a marker; every anchor must match exactly once or the file is refused.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-story-problems"
CEILING = 100
FINISH = "  function finish(i, msg)"
MAX_WORDS = 45

# lesson -> (objective code, [(question, [(option, right)], why, is_two_step)])
WORK = {
    "tens-and-ones": ("2Ni.01", [
        ("A farmer has 34 goats. He buys 20 more goats at the market. How many goats does he have now?",
         [("54", True), ("36", False), ("14", False)],
         "Add the tens: 30 and 20 make 50. The 4 ones stay, so it is 54.", False),
        ("There are 62 mangoes in a crate. 30 of them are sold. How many mangoes are left in the crate?",
         [("32", True), ("92", False), ("42", False)],
         "Take away the tens: 60 take away 30 is 30. The 2 ones stay, so 32 are left.", False),
        ("Amina arranges her stickers in 4 rows. Each row has 5 stickers. How many stickers does Amina have?",
         [("20", True), ("9", False), ("45", False)],
         "An array of 4 rows of 5 is 5, 10, 15, 20. Counting in fives is quicker than counting one by one.", False),
        ("Musa shares 18 beans equally between 3 friends. How many beans does each friend get?",
         [("6", True), ("15", False), ("3", False)],
         "Sharing 18 into 3 equal groups gives 6 in each group, because 6 and 6 and 6 make 18.", False),
        ("A shop has 48 loaves in the morning. It sells 20 before lunch and 8 after lunch. "
         "How many loaves are left at the end of the day?",
         [("20", True), ("28", False), ("40", False)],
         "Two steps. First 48 take away 20 is 28. Then 28 take away 8 is 20. Do the tens, then the ones.", True),
        ("Hodan counts her marbles in tens and gets 7 tens and 5 left over. How many marbles has Hodan?",
         [("75", True), ("57", False), ("12", False)],
         "7 tens is 70, and 5 more makes 75. The tens digit comes first when you write it.", False),
    ]),
    "coins-and-change": ("2Nm.02", [
        ("Ali buys a pencil for 25 sh and a rubber for 15 sh. How much does Ali spend altogether?",
         [("40 sh", True), ("30 sh", False), ("10 sh", False)],
         "25 and 15: the tens make 30 and the ones make 10, so it is 40 sh.", False),
        ("Kiki has 50 sh. She buys a mango for 35 sh. How much money does Kiki have left?",
         [("15 sh", True), ("25 sh", False), ("85 sh", False)],
         "Count on from 35 to 50: 5 more makes 40, then 10 more makes 50. That is 15 sh.", False),
        ("Musa has three 20 sh coins. How much money does Musa have?",
         [("60 sh", True), ("23 sh", False), ("40 sh", False)],
         "Count in twenties: 20, 40, 60. Three 20 sh coins make 60 sh.", False),
        ("A book costs 45 sh. Amina has 20 sh. How much more money does Amina need?",
         [("25 sh", True), ("65 sh", False), ("35 sh", False)],
         "Count on from 20 to 45: 20 more makes 40, then 5 more makes 45. She needs 25 sh.", False),
        ("Hodan has 80 sh. She buys a pen for 30 sh and a book for 25 sh. How much has she left?",
         [("25 sh", True), ("50 sh", False), ("55 sh", False)],
         "Two steps. The pen and book cost 30 and 25, which is 55 sh. Then 80 take away 55 is 25 sh.", True),
        ("Ali pays for a 40 sh ruler with a 50 sh note. What is the fewest coins he can get as change?",
         [("one 10 sh coin", True), ("two 5 sh coins", False), ("ten 1 sh coins", False)],
         "The change is 10 sh. One 10 sh coin pays it in a single piece, which is the fewest.", False),
    ]),
    "fair-shares": ("2Nf.03", [
        ("There are 12 sweets in a bag. Amina eats half of them. How many sweets does Amina eat?",
         [("6", True), ("12", False), ("2", False)],
         "Half of 12 means two equal groups. 6 and 6 make 12, so half of 12 is 6.", False),
        ("A cake is cut into 4 equal pieces. Musa eats 1 piece. What fraction of the cake does Musa eat?",
         [("one quarter", True), ("one half", False), ("one third", False)],
         "Four equal pieces means each one is a quarter, and Musa ate one of them.", False),
        ("Hodan has 20 beads. She gives one quarter of them to Kiki. How many beads does Kiki get?",
         [("5", True), ("4", False), ("10", False)],
         "A quarter means four equal groups. 20 shared into 4 groups is 5 in each group.", False),
        ("There are 15 oranges. One third of them are ripe. How many oranges are ripe?",
         [("5", True), ("3", False), ("10", False)],
         "A third means three equal groups. 15 shared into 3 groups is 5 in each group.", False),
        ("Ali has 16 marbles. He gives half to his brother, then finds 4 more. How many marbles has Ali now?",
         [("12", True), ("8", False), ("20", False)],
         "Two steps. Half of 16 is 8, so he has 8 left. Then 8 and 4 more makes 12.", True),
        ("A ribbon is cut into 2 equal parts. Amina joins both parts back together. What does she have?",
         [("one whole ribbon", True), ("two whole ribbons", False), ("half a ribbon", False)],
         "Two halves fit back together into the one ribbon she started with.", False),
    ]),
    "patterns-that-grow": ("2Nc.04", [
        ("Musa saves 5 sh every week. How much has Musa saved after 4 weeks?",
         [("20 sh", True), ("9 sh", False), ("45 sh", False)],
         "Count on in fives: 5, 10, 15, 20. Four weeks of 5 sh is 20 sh.", False),
        ("A plant is 12 cm tall. It grows 2 cm every week. How tall is the plant after 3 weeks?",
         [("18 cm", True), ("14 cm", False), ("36 cm", False)],
         "Count on in twos from 12: 14, 16, 18. After 3 weeks it is 18 cm tall.", False),
        ("Hodan starts at 90 and counts back in tens. What is the third number Hodan says?",
         [("60", True), ("87", False), ("70", False)],
         "Counting back in tens: 80, 70, 60. The third number she says is 60.", False),
        ("A pattern goes red, red, blue, red, red, blue. How many beads are in the part that repeats?",
         [("3", True), ("2", False), ("6", False)],
         "The part that comes round again is red, red, blue. That is 3 beads.", False),
        ("Amina builds steps. The first has 2 blocks, the second 4, the third 6. How many blocks in the fifth step?",
         [("10", True), ("8", False), ("12", False)],
         "Two steps. The pattern goes up by 2 each time, so the fourth is 8. Then 8 and 2 more makes 10.", True),
        ("Ali counts in tens from 30 and stops at 70. How many tens did Ali count on?",
         [("4", True), ("40", False), ("5", False)],
         "From 30 the tens go 40, 50, 60, 70. That is 4 jumps of ten.", False),
    ]),
    "sides-and-corners": ("2Gg.01", [
        ("Kiki draws a shape with 4 straight sides that are all the same length. What shape has Kiki drawn?",
         [("a square", True), ("a rectangle", False), ("a triangle", False)],
         "Four straight sides all the same length, with square corners, makes a square.", False),
        ("Musa has a solid shape with 6 faces, and every face is a square. What is the shape?",
         [("a cube", True), ("a cylinder", False), ("a cone", False)],
         "Six flat faces that are all squares make a cube.", False),
        ("Amina folds a square in half so the two halves match exactly. What has Amina found?",
         [("a line of symmetry", True), ("a corner", False), ("a curved side", False)],
         "A fold where both halves land exactly on top of each other is a line of symmetry.", False),
        ("Hodan has 3 triangles and 2 squares. How many straight sides do all her shapes have altogether?",
         [("17", True), ("5", False), ("12", False)],
         "Two steps. Three triangles have 3, 6, 9 sides. Two squares have 8 sides. 9 and 8 make 17.", True),
        ("Ali turns a rectangle a quarter turn. How many sides does the rectangle have now?",
         [("4", True), ("2", False), ("8", False)],
         "Turning a shape moves it round but does not change it. A rectangle always has 4 sides.", False),
        ("A tin of milk sits on the table. Which solid shape is the tin like?",
         [("a cylinder", True), ("a cube", False), ("a sphere", False)],
         "A tin has two flat circle faces and one curved surface, so it is a cylinder.", False),
    ]),
    "which-way-from-here": ("2Gp.01", [
        ("Musa walks 3 squares forward, then turns and walks 2 squares. How many squares has Musa walked?",
         [("5", True), ("6", False), ("1", False)],
         "3 squares and 2 more squares make 5 squares walked in total.", False),
        ("Amina faces the window and makes a half turn. What is Amina facing now?",
         [("the way she came", True), ("the window still", False), ("the ceiling", False)],
         "A half turn takes you halfway round, so you face back the way you came.", False),
        ("A robot is told: forward, forward, left, forward. How many forward moves does the robot make?",
         [("3", True), ("4", False), ("1", False)],
         "Count only the forwards: forward, forward, then one more after the turn. That is 3.", False),
        ("Hodan puts the ball so the box is on one side of it and the chair on the other. Where is the ball?",
         [("between them", True), ("behind the box", False), ("under the chair", False)],
         "Between means one thing on each side of it, which is exactly where the ball is.", False),
        ("Ali makes a quarter turn, then another quarter turn the same way. What has Ali made altogether?",
         [("a half turn", True), ("a whole turn", False), ("a quarter turn", False)],
         "Two steps. One quarter turn, then another, and two quarter turns together make a half turn.", True),
        ("A shape is drawn on one side of a mirror line. What is true about the mirror picture?",
         [("it is flipped over", True), ("it is the same way round", False), ("it is upside down", False)],
         "In a mirror the picture turns over, so the side nearest the line stays nearest the line.", False),
    ]),
    "how-much-how-long": ("2Gg.03", [
        ("A pencil is 9 cm long. A crayon is 6 cm long. How much longer is the pencil than the crayon?",
         [("3 cm", True), ("15 cm", False), ("6 cm", False)],
         "Count on from 6 to 9: 7, 8, 9. That is 3 cm longer.", False),
        ("A jug holds 2 litres. Amina pours in 1 litre. How much more will the jug hold?",
         [("1 litre", True), ("3 litres", False), ("2 litres", False)],
         "The jug holds 2 litres in total and 1 is already in, so 1 more litre will fit.", False),
        ("A bag of rice weighs 50 g. A bag of beans weighs 30 g. How much do they weigh together?",
         [("80 g", True), ("20 g", False), ("60 g", False)],
         "50 and 30: the tens make 80, so together they weigh 80 g.", False),
        ("Zara's tomato weighs 65 g. Jack's tomato weighs 20 g more than Zara's. How heavy is Jack's tomato?",
         [("85 g", True), ("45 g", False), ("20 g", False)],
         "65 and 20 more: the tens make 80 and the 5 ones stay, so Jack's tomato is 85 g.", False),
        ("A ribbon is 40 cm long. Musa cuts off 10 cm, then cuts off 20 cm more. How much ribbon is left?",
         [("10 cm", True), ("30 cm", False), ("20 cm", False)],
         "Two steps. 40 take away 10 is 30. Then 30 take away 20 is 10 cm left.", True),
        ("Hodan measures her desk in cubes and it takes 12. Ali measures his in the same cubes and it takes 9. "
         "Whose desk is longer?",
         [("Hodan's desk", True), ("Ali's desk", False), ("they are the same", False)],
         "They used the SAME cubes, so the counts can be compared. 12 cubes is longer than 9.", False),
    ]),
    "half-past-quarter-to": ("2Gt.02", [
        ("A lesson starts at 9 o'clock and lasts half an hour. What time does the lesson end?",
         [("half past 9", True), ("10 o'clock", False), ("half past 10", False)],
         "Half an hour after 9 o'clock is half past 9, when the long hand points down at the 6.", False),
        ("Musa's film starts at 2 o'clock and ends at 3 o'clock. How long is the film?",
         [("one hour", True), ("half an hour", False), ("two hours", False)],
         "From one o'clock time to the next o'clock time is a whole hour.", False),
        ("The long hand is on the 9 and the short hand is just before the 5. What time is it?",
         [("quarter to 5", True), ("quarter past 5", False), ("9 o'clock", False)],
         "The long hand on the 9 means quarter TO, and the hour coming next is 5.", False),
        ("Amina's bus leaves at quarter past 8. She arrives at the stop at 8 o'clock. How long does she wait?",
         [("15 minutes", True), ("half an hour", False), ("8 minutes", False)],
         "Quarter past is a quarter of the way round the clock, and a quarter of an hour is 15 minutes.", False),
        ("A cake bakes for half an hour. Hodan puts it in at 4 o'clock and eats it 15 minutes after it comes out. "
         "What time does Hodan eat it?",
         [("quarter to 5", True), ("half past 4", False), ("5 o'clock", False)],
         "Two steps. Half an hour after 4 is half past 4. Then 15 minutes more is quarter to 5.", True),
        ("There are 60 minutes in an hour. How many minutes are there in half an hour?",
         [("30", True), ("60", False), ("15", False)],
         "Half of 60 is 30, because 30 and 30 make 60.", False),
    ]),
    "count-it-chart-it": ("2Ss.02", [
        ("In a block graph, 8 children chose mango and 5 chose banana. How many more chose mango?",
         [("3", True), ("13", False), ("5", False)],
         "Count on from 5 to 8: 6, 7, 8. That is 3 more children.", False),
        ("Musa's tally shows three gates of five and 2 more marks. How many is that altogether?",
         [("17", True), ("15", False), ("32", False)],
         "Each gate is 5, so three gates are 5, 10, 15. Then 2 more makes 17.", False),
        ("A pictogram key says one picture stands for 2 children. Amina counts 6 pictures. How many children is that?",
         [("12", True), ("6", False), ("8", False)],
         "Read the key first. Six pictures of 2 children each is 2, 4, 6, 8, 10, 12.", False),
        ("Hodan asks 20 children. 12 say football and the rest say running. How many say running?",
         [("8", True), ("12", False), ("32", False)],
         "Count on from 12 to 20: that is 8 children who said running.", False),
        ("A class of 30 is asked. 10 choose red, 12 choose blue and the rest choose green. How many choose green?",
         [("8", True), ("22", False), ("18", False)],
         "Two steps. Red and blue together are 10 and 12, which is 22. Then 30 take away 22 is 8.", True),
        ("Ali spins a spinner with 4 equal colours. Is he certain to land on red?",
         [("no, it might be another colour", True), ("yes, red is certain", False),
          ("no, red is impossible", False)],
         "All four colours are equally likely, so red might happen but is not certain.", False),
    ]),
}

cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
ORDER = [l["file"][:-5] for l in cfg["lessons"]]

# ---- the audit ---------------------------------------------------------------
assert sorted(WORK) == sorted(ORDER), "every lesson needs a bank"
for key, (code, items) in WORK.items():
    assert re.fullmatch(r"2[A-Z][a-z]\.\d\d", code), "%s: %r is not a Stage 2 code" % (key, code)
    assert len(items) == 6, "%s: six problems per lesson" % key
    two = 0
    for ask, opts, why, is_two in items:
        assert len(opts) == 3 and sum(1 for _t, ok in opts if ok) == 1, "%s: one right of three" % key
        assert len(set(t for t, _ in opts)) == 3, "%s: repeated option" % key
        assert ask.rstrip().endswith("?"), "%s: the question must be its own sentence" % key
        n_sent = len(re.findall(r"[.?!]", ask))
        assert 2 <= n_sent <= 3, "%s: %d sentences, the measured shape is 2-3: %r" % (key, n_sent, ask[:50])
        assert len(ask.split()) <= MAX_WORDS, "%s: %d words is past the measured shape" % (key, len(ask.split()))
        if is_two:
            two += 1
            # a child who gets a two-step wrong is usually right about one half
            assert "Two steps." in why, "%s: a two-step problem must show both steps" % key
        for t in (ask, why) + tuple(t for t, _ in opts):
            assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe text %r" % (key, t)
            for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", t):
                assert int(n) <= CEILING, "%s: %s is past Stage 2's ceiling of %d" % (key, n, CEILING)
    assert two <= 1, "%s: %d two-step problems; Stage 2 works one through, so at most one" % (key, two)


def lit(t):
    return '"%s"' % t


done_n = skipped = refused = 0
for l in cfg["lessons"]:
    name, key = l["file"], l["file"][:-5]
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    code, items = WORK[key]

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
    sid = "sp%d" % n
    at = st[chk[0]]
    slide = (
        '<!-- %d  %s  Story problems -->\n    '
        '<section class="slide" data-say="Read the story. Work out the answer. Then tap it.">\n'
        '      <div class="slide-head"><span class="n">%d</span><h2>Story problems</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="%ssay">Read the story, work out the answer, then tap it.'
        '</span></div>\n'
        '      <div class="stage" id="%sst"></div>\n'
        '      <div class="choices" id="%sch"></div>\n'
        '      <p class="fb" id="%sfb" role="status" aria-live="polite"></p>\n'
        '      <div class="bigbtns"><button type="button" class="big small teal" id="%snx" hidden>'
        'Next story</button></div>\n'
        '      <p class="score" id="%ssc"></p>\n'
        '    </section>\n    ' % (n, code, n, sid, sid, sid, sid, sid, sid))

    rows = []
    for ask, opts, why, is_two in items:
        rows.append('      { ask: %s, pic: "",\n        opts: [%s],\n        why: %s },'
                    % (lit(ask),
                       ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false")
                                 for t, ok in opts),
                       lit(why)))
    # NOTE the outer parentheses: % binds tighter than +, so without them the
    # format applies to the LAST fragment alone and raises on the first %d.
    call = (("""
  /* ---- %d: story problems - """ + MARK + """, the measured Stage 2 shape.
     See add-story-problems.py. ---- */
  secondStep({
    el: { say: $("%ssay"), stage: $("%sst"), ch: $("%sch"), fb: $("%sfb"), score: $("%ssc"), next: $("%snx") },
    label: "Story",
    items: [
%s
    ],
    finish: %d,
    done: "You can read a story and work out the maths in it.",
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
    s = s[:ins] + call.lstrip("\n") + s[ins:]

    # `assert ... or True` is never false. The first version of this line was
    # exactly that, so the marker was never checked AND never written, and a
    # second run added a second Story problems step to every lesson instead of
    # skipping - the guard at the top of the loop had nothing to find.
    assert s.count(MARK) == 1, "the marker was not written, so this cannot be idempotent"
    assert s.count('id="%ssay"' % sid) == 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-26s step %-2d  6 stories (%d two-step), check finish(%d)->finish(%d)"
          % ("wrote  " if WRITE else "would  ", name, n,
             sum(1 for _a, _o, _w, t in items if t), fi, fi + 1))
    done_n += 1

print("\n  %d story problem(s) across %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(i) for _c, i in WORK.values()), done_n, "written" if WRITE else "to write",
         skipped, refused, "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
