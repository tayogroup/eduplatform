# -*- coding: utf-8 -*-
"""A "Will it always work?" step: the TWM skills of specialising and generalising.

    python add-always-true.py            # report
    python add-always-true.py --write

WHAT IT CLOSES. Cambridge names eight Thinking and Working Mathematically
characteristics and flags individual questions with them; the Stage 1 Guide
carries a 113-row index. This build deliberately exercised two: convincing,
through "How do you know?", and critiquing with improving, through "Spot the
mistake". It also does characterising and classifying in substance without ever
saying so - Sort the shapes, Sort into a hoop, the Venn and Carroll diagrams,
Flat or solid, Faces and edges and Odd and even are all "find the property, then
group by it".

The three genuinely missing were SPECIALISING, GENERALISING and CONJECTURING.
The Guide's own definitions are what this step is built from, verbatim:

    Specialising   Choosing an example and checking if it satisfies or does not
                   satisfy specific mathematical criteria
    Generalising   Recognising an underlying pattern by identifying many examples
                   that satisfy the same mathematical criteria

So each claim is tested on TWO examples and then judged in general: specialise,
specialise, generalise. That order is the whole design and is why the verdict
question comes last rather than first.

ONE CLAIM IN EACH PAIR IS FALSE, and that is the mathematics rather than a
flourish. If every claim held, "always true" would be the answer to a question
the child never has to think about - the same reason Spot the mistake keeps one
correct item. A false claim also teaches the thing that makes generalising
mathematics: ONE example that breaks a claim settles it, however many supported
it. The false claims here are chosen so the breaking example is one the lesson
has already taught - 12 has a 1 in it and is even; 5 add 0 is not bigger than 5.

CONJECTURING IS ONLY PARTLY REACHED, and the honest reading is that this step
does not close it. Forming a question or an idea of one's own is not something a
multiple choice can carry; the nearest this gets is asking a child to predict
before testing. Recorded so nobody later reads "3 of 3" into it - it is 2, and
the eighth characteristic stays open.

WHERE IT GOES: after the lesson's own steps and before the check, the owner's
standing choice since 2026-09-11, with the same accepted cost - progress is by
step POSITION, so a child who has finished the lesson finds the check reopened.

Guarded by a marker; every anchor must match exactly once or the file is
refused. Written with the Write tool, never a heredoc.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-always-true"
CHECK_BADGE = '<span class="n">✓</span>'
FINISH = "  function finish(i, msg) {"
STICK_TAIL = '["✅", "Show what I know"]'


def ssml(calm, friendly, empathetic, cheerful):
    s = lambda xs: "".join("<s>%s</s>" % x for x in xs)
    return ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">%s</mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">%s</mstts:express-as>'
            % (s(calm), s(friendly), s(empathetic), s(cheerful)))


CLAIM_JS = r'''  /* ehel-always-true: the claim under test, kept on screen while it is tested */
  const atClaim = (who, idea) => '<div class="at-claim"><p class="at-k">The idea we are testing</p>' +
    '<p class="at-i">' + idea + '</p><p class="at-w">' + who + '</p></div>';
'''

CSS = """  .at-claim { max-width: min(92%, 470px); margin: 0 auto; background: var(--card); border: 3px solid var(--gold);
    border-radius: 18px; padding: 13px 18px 10px; }
  .at-k { margin: 0 0 4px; font-family: "Inter", "Segoe UI", sans-serif; font-size: 11px; letter-spacing: .08em;
    text-transform: uppercase; font-weight: 800; color: var(--gold); }
  .at-i { margin: 0; font-size: clamp(18px, 4.2vw, 23px); line-height: 1.35; color: var(--ink); }
  .at-w { margin: 6px 0 0; font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 16px;
    color: var(--muted); text-align: right; }
"""

EXPLAIN = ssml(
    ["Somebody has an idea about numbers. Your job is to test it."],
    ["Testing an idea is not the same as agreeing with it.",
     "You try it on one example, then on another.",
     "If it works both times, you ask the big question: does it ALWAYS work?",
     "And if you find even one example where it does not work, then it does not always work."],
    ["Children often decide after one try.",
     "One try is not enough to say always.",
     "But one try IS enough to say NOT always, if that try breaks the idea."],
    ["So test it twice, then say whether it always works."])

SAY = "Somebody has an idea. Test it on each example, then say whether it always works."
PROMPT = "Test the idea on each example. Then say whether it always works."
DONE = "You can test an idea and say whether it always works."
TITLE = "Will it always work?"
STICKER = ("🔬", "Testing an idea")

# ---------------------------------------------------------------------------
# Two claims per lesson, one that holds and one that does not. Each is tested on
# two examples and then judged - specialise, specialise, generalise.
# ---------------------------------------------------------------------------
COUNTING = [
    dict(who="Amina", claim="When you count in twos from 2, every number you land on is even.",
         ask="Amina counts in twos and lands on 6. Is 6 even?",
         opts=[("Yes, 6 is even", True), ("No, 6 is odd", False)],
         why="6 goes into pairs with none left over, so it is even. The idea holds so far."),
    dict(who="Amina", claim="When you count in twos from 2, every number you land on is even.",
         ask="She counts on and lands on 14. Is 14 even?",
         opts=[("Yes, 14 is even", True), ("No, 14 is odd", False)],
         why="14 goes into pairs with none left over. The idea has held twice now."),
    dict(who="Amina", claim="When you count in twos from 2, every number you land on is even.",
         ask="So does Amina's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="Counting in twos from 2 lands on 2, 4, 6, 8 and on, and every one of them makes pairs with none left over."),
    dict(who="Musa", claim="Every number with a 1 in it is odd.",
         ask="Musa tries 1. Is 1 odd?",
         opts=[("Yes, 1 is odd", True), ("No, 1 is even", False)],
         why="1 cannot be put into pairs, so it is odd. Musa's idea has worked once."),
    dict(who="Musa", claim="Every number with a 1 in it is odd.",
         ask="Now try 12. It has a 1 in it. Is 12 odd?",
         opts=[("No, 12 is even", True), ("Yes, 12 is odd", False)],
         why="12 goes into pairs with none left over, so it is EVEN. That one example breaks the idea."),
    dict(who="Musa", claim="Every number with a 1 in it is odd.",
         ask="So does Musa's idea always work?",
         opts=[("No, it does not always work", True), ("Yes, it always works", False),
               ("It never works", False)],
         why="12 has a 1 in it and is even, so the idea is not always true. One example that breaks an idea is enough to settle it."),
]

ADDING = [
    dict(who="Hodan", claim="When you add 1 to a number, you get the next number you say when counting.",
         ask="Hodan works out 7 add 1 and gets 8. Is 8 the next number after 7?",
         opts=[("Yes, 8 comes next", True), ("No, 8 does not come next", False)],
         why="Counting goes 6, 7, 8. Adding 1 moves you on by exactly one number. The idea holds so far."),
    dict(who="Hodan", claim="When you add 1 to a number, you get the next number you say when counting.",
         ask="Now she works out 15 add 1 and gets 16. Is 16 the next number after 15?",
         opts=[("Yes, 16 comes next", True), ("No, 16 does not come next", False)],
         why="Counting goes 14, 15, 16. The idea has held twice now."),
    dict(who="Hodan", claim="When you add 1 to a number, you get the next number you say when counting.",
         ask="So does Hodan's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="Adding 1 always moves you on by one number, wherever you start. That is what adding 1 means."),
    dict(who="Ali", claim="Adding always makes the answer bigger than both of the numbers.",
         ask="Ali tries 3 add 4, which is 7. Is 7 bigger than both 3 and 4?",
         opts=[("Yes, 7 is bigger than both", True), ("No, it is not", False)],
         why="7 is bigger than 3 and bigger than 4. Ali's idea has worked once."),
    dict(who="Ali", claim="Adding always makes the answer bigger than both of the numbers.",
         ask="Now try 5 add 0, which is 5. Is 5 bigger than 5?",
         opts=[("No, it is the same", True), ("Yes, it is bigger", False)],
         why="Adding zero adds nothing at all, so the answer stays 5. That one example breaks the idea."),
    dict(who="Ali", claim="Adding always makes the answer bigger than both of the numbers.",
         ask="So does Ali's idea always work?",
         opts=[("No, it does not always work", True), ("Yes, it always works", False),
               ("It never works", False)],
         why="Adding zero leaves a number exactly as it was, so the answer is not always bigger. One example that breaks an idea settles it."),
]

HALVES = [
    dict(who="Amina", claim="Two halves always make one whole.",
         ask="Amina puts two halves of an orange together. Does she get one whole orange?",
         opts=[("Yes, one whole orange", True), ("No, two whole oranges", False)],
         why="The two halves fit back together into the one orange she started with. The idea holds so far."),
    dict(who="Amina", claim="Two halves always make one whole.",
         ask="She puts two halves of a chapati together. Does she get one whole chapati?",
         opts=[("Yes, one whole chapati", True), ("No, half a chapati", False)],
         why="Two halves of anything fit back together into one whole of it. The idea has held twice now."),
    dict(who="Amina", claim="Two halves always make one whole.",
         ask="So does Amina's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="A half means one of two equal parts, so putting both back together always gives you the whole again."),
    dict(who="Musa", claim="If a shape is cut into two parts, each part is a half.",
         ask="Musa cuts a square straight down the middle. Is each part a half?",
         opts=[("Yes, both parts match", True), ("No, they do not match", False)],
         why="Down the middle leaves two parts the same size, so each one is a half. Musa's idea has worked once."),
    dict(who="Musa", claim="If a shape is cut into two parts, each part is a half.",
         ask="Now he cuts a paper strip near one end. Is each part a half?",
         opts=[("No, one part is bigger", True), ("Yes, there are two parts", False)],
         why="Two parts is not enough. They have to be the SAME SIZE, and a cut near the end leaves a thin part and a fat one. That breaks the idea."),
    dict(who="Musa", claim="If a shape is cut into two parts, each part is a half.",
         ask="So does Musa's idea always work?",
         opts=[("No, it does not always work", True), ("Yes, it always works", False),
               ("It never works", False)],
         why="Only two EQUAL parts are halves. Cutting anywhere else still makes two parts, but not two halves."),
]

PATTERNS = [
    dict(who="Kiki", claim="When you count in tens from 0, every number ends in a zero.",
         ask="Kiki counts in tens and lands on 10. Does 10 end in a zero?",
         opts=[("Yes, it ends in 0", True), ("No, it does not", False)],
         why="10 is one ten and no ones, so it ends in a zero. The idea holds so far."),
    dict(who="Kiki", claim="When you count in tens from 0, every number ends in a zero.",
         ask="She counts on and lands on 20. Does 20 end in a zero?",
         opts=[("Yes, it ends in 0", True), ("No, it does not", False)],
         why="20 is two tens and no ones. The idea has held twice now."),
    dict(who="Kiki", claim="When you count in tens from 0, every number ends in a zero.",
         ask="So does Kiki's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="Counting in tens lands on whole tens with no ones left over, and a number with no ones ends in a zero."),
    dict(who="Ali", claim="A repeating pattern always uses two things.",
         ask="Ali looks at red, blue, red, blue. Does that pattern use two things?",
         opts=[("Yes, red and blue", True), ("No, it uses three", False)],
         why="Red and blue, over and over. Ali's idea has worked once."),
    dict(who="Ali", claim="A repeating pattern always uses two things.",
         ask="Now look at red, blue, yellow, red, blue, yellow. Does that pattern use two things?",
         opts=[("No, it uses three", True), ("Yes, it uses two", False)],
         why="The part that repeats here is red, blue, yellow. That is three things, and it is still a pattern. That breaks the idea."),
    dict(who="Ali", claim="A repeating pattern always uses two things.",
         ask="So does Ali's idea always work?",
         opts=[("No, it does not always work", True), ("Yes, it always works", False),
               ("It never works", False)],
         why="The part that repeats can be 2, 3, 4 or more things long. It just has to come round again."),
]

SHAPES = [
    dict(who="Hodan", claim="If two things are measured with the same cubes, the one that needs more cubes is longer.",
         ask="A pencil takes 5 cubes and a crayon takes 3 cubes. Is the pencil longer?",
         opts=[("Yes, the pencil is longer", True), ("No, the crayon is longer", False)],
         why="Same cubes both times, so the counts can be compared. 5 cubes is longer than 3. The idea holds so far."),
    dict(who="Hodan", claim="If two things are measured with the same cubes, the one that needs more cubes is longer.",
         ask="A book takes 9 cubes and a ruler takes 7 cubes. Is the book longer?",
         opts=[("Yes, the book is longer", True), ("No, the ruler is longer", False)],
         why="Again the same cubes, so 9 is longer than 7. The idea has held twice now."),
    dict(who="Hodan", claim="If two things are measured with the same cubes, the one that needs more cubes is longer.",
         ask="So does Hodan's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="As long as the SAME cubes measure both, more cubes always means longer. Different units would spoil it."),
    dict(who="Kiki", claim="A shape with four sides is always a square.",
         ask="Kiki looks at a square. It has four sides. Is it a square?",
         opts=[("Yes, it is a square", True), ("No, it is not", False)],
         why="Four straight sides, all the same length, and square corners. Kiki's idea has worked once."),
    dict(who="Kiki", claim="A shape with four sides is always a square.",
         ask="Now she looks at a rectangle that is long and thin. It has four sides. Is it a square?",
         opts=[("No, its sides are not all the same", True), ("Yes, it is a square", False)],
         why="A rectangle has four sides too, but two are long and two are short. A square needs all four the same. That breaks the idea."),
    dict(who="Kiki", claim="A shape with four sides is always a square.",
         ask="So does Kiki's idea always work?",
         opts=[("No, it does not always work", True), ("Yes, it always works", False),
               ("It never works", False)],
         why="Four sides is not enough to be a square. All four sides have to be the same length."),
]

DAYS = [
    dict(who="Amina", claim="At every o'clock time, the long hand points at the 12.",
         ask="It is 3 o'clock. Does the long hand point at the 12?",
         opts=[("Yes, straight up at 12", True), ("No, it points at the 3", False)],
         why="At o'clock the long hand is always straight up. The short hand is the one pointing at the 3."),
    dict(who="Amina", claim="At every o'clock time, the long hand points at the 12.",
         ask="Now it is 9 o'clock. Does the long hand point at the 12?",
         opts=[("Yes, straight up at 12", True), ("No, it points at the 9", False)],
         why="Straight up again. The idea has held twice now."),
    dict(who="Amina", claim="At every o'clock time, the long hand points at the 12.",
         ask="So does Amina's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="O'clock means no minutes have passed yet, and that is exactly where the long hand sits: straight up at 12."),
    dict(who="Musa", claim="Everything that takes a long time is measured in years.",
         ask="Musa thinks about growing from a baby into a child. Is that measured in years?",
         opts=[("Yes, that takes years", True), ("No, that takes minutes", False)],
         why="Growing up takes years, so the idea has worked once."),
    dict(who="Musa", claim="Everything that takes a long time is measured in years.",
         ask="A whole school day feels long. Is a school day measured in years?",
         opts=[("No, it is measured in hours", True), ("Yes, it takes years", False)],
         why="A school day is long for a child, but it is hours, not years. That breaks the idea."),
    dict(who="Musa", claim="Everything that takes a long time is measured in years.",
         ask="So does Musa's idea always work?",
         opts=[("No, it does not always work", True), ("Yes, it always works", False),
               ("It never works", False)],
         why="Long things can be hours, days or weeks as well as years. You pick the unit that fits."),
]

DATA = [
    dict(who="Ali", claim="On a block graph, the tallest bar is the one the most children chose.",
         ask="6 children chose mango and 4 chose banana, so the mango bar is taller. Did more children choose mango?",
         opts=[("Yes, 6 is more than 4", True), ("No, banana was more popular", False)],
         why="A taller bar means more children. The idea holds so far."),
    dict(who="Ali", claim="On a block graph, the tallest bar is the one the most children chose.",
         ask="2 chose apple and 5 chose orange, so the orange bar is taller. Did more children choose orange?",
         opts=[("Yes, 5 is more than 2", True), ("No, apple was more popular", False)],
         why="Taller again means more. The idea has held twice now."),
    dict(who="Ali", claim="On a block graph, the tallest bar is the one the most children chose.",
         ask="So does Ali's idea always work?",
         opts=[("Yes, it always works", True), ("It works sometimes", False), ("It never works", False)],
         why="Each block stands for one child, so the tallest stack is always the most children."),
    dict(who="Hodan", claim="If you write the same answers in a table instead of a graph, the numbers change.",
         ask="The graph shows 6 mangoes. Hodan writes the same answers in a table. How many mangoes does the table show?",
         opts=[("6, the same", True), ("More than 6", False), ("Fewer than 6", False)],
         why="The answers did not change, only the way they are drawn. The idea has not worked once yet."),
    dict(who="Hodan", claim="If you write the same answers in a table instead of a graph, the numbers change.",
         ask="The graph shows 4 bananas. How many bananas does her table show?",
         opts=[("4, the same", True), ("More than 4", False), ("Fewer than 4", False)],
         why="The same again. Drawing the answers another way never changes them."),
    dict(who="Hodan", claim="If you write the same answers in a table instead of a graph, the numbers change.",
         ask="So does Hodan's idea always work?",
         opts=[("No, it never works", True), ("Yes, it always works", False),
               ("It works sometimes", False)],
         why="A list, a table, a block graph and a pictogram can all show the very same answers. Only the drawing changes, never the numbers."),
]

PLAN = {
    "counting-to-twenty.html": dict(items=COUNTING, code="1Nc.05"),
    "adding-and-taking-away.html": dict(items=ADDING, code="1Ni.05"),
    "halves-and-wholes.html": dict(items=HALVES, code="1Nf.01"),
    "what-comes-next.html": dict(items=PATTERNS, code="1Nc.06"),
    "shapes-and-sizes.html": dict(items=SHAPES, code="1Gg.01"),
    "days-months-and-clocks.html": dict(items=DAYS, code="1Gt.03"),
    "asking-and-sorting.html": dict(items=DATA, code="1Ss.02"),
}
MAX_NUMBER = 20


def audit(name, items):
    for it in items:
        for k in ("ask", "why", "claim", "who"):
            assert '"' not in it[k] and "\\" not in it[k], "%s: a quote or backslash in %s" % (name, k)
            assert "<" not in it[k] and ">" not in it[k], "%s: markup in %s" % (name, k)
        oks = [o for _, o in it["opts"] if o]
        assert len(oks) == 1, "%s: %d right answers in %r" % (name, len(oks), it["ask"][:40])
        ts = [t for t, _ in it["opts"]]
        assert len(ts) == len(set(ts)) >= 2, "%s: repeated options %r" % (name, ts)
        assert it["ask"].rstrip().endswith("?"), "%s: not a question: %r" % (name, it["ask"][:40])
        for n in re.findall(r"\b\d+\b", it["ask"] + " " + it["claim"] + " " + " ".join(ts)):
            assert int(n) <= MAX_NUMBER, "%s: %s is past Stage 1" % (name, n)
    # the shape IS the teaching: two examples, then the verdict, for each claim
    claims = []
    for it in items:
        if not claims or claims[-1][0] != it["claim"]:
            claims.append([it["claim"], []])
        claims[-1][1].append(it)
    assert len(claims) == 2, "%s: %d claims, expected one that holds and one that does not" % (name, len(claims))
    for claim, group in claims:
        assert len(group) == 3, "%s: claim %r has %d items, expected two tests and a verdict" % (name, claim[:30], len(group))
        assert "always work" in group[2]["ask"], "%s: the third item is not the verdict" % name
    # one claim must FAIL, or "always" is answerable without thinking
    verdicts = [g[2] for _, g in claims]
    holds = [v for v in verdicts if v["opts"][0][0].startswith("Yes, it always")]
    assert len(holds) == 1, "%s: %d of the 2 claims hold; exactly one should" % (name, len(holds))


def items_js(items):
    out = []
    for it in items:
        opts = ", ".join('{ t: "%s"%s }' % (t, ", ok: true" if ok else "") for t, ok in it["opts"])
        out.append('\n      { ask: "%s",\n'
                   '        pic: atClaim("%s", "%s"),\n'
                   '        opts: [%s],\n'
                   '        why: "%s" },' % (it["ask"], it["who"], it["claim"], opts, it["why"]))
    return "".join(out)


def section(n, code):
    return ('<!-- %d  %s  %s -->\n'
            '<section class="slide" data-explain=\'%s\' data-say="%s">\n'
            '      <div class="slide-head"><span class="n">%d</span><h2>%s</h2></div>\n'
            '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button>'
            '<span id="at%dsay">%s</span></div>\n'
            '      <div class="stage" id="at%dst"></div>\n'
            '      <div class="choices" id="at%dch"></div>\n'
            '      <p class="fb" id="at%dfb" role="status" aria-live="polite"></p>\n'
            '      <div class="bigbtns"><button type="button" class="big small teal" id="at%dnx" hidden>Next test</button></div>\n'
            '      <p class="score" id="at%dsc"></p>\n'
            '    </section>\n') % (n, code, TITLE, EXPLAIN, SAY, n, TITLE, n, PROMPT, n, n, n, n, n)


def block(n, idx, items):
    return ('  /* ---- %d: will it always work - specialising then generalising ---- */\n'
            '  secondStep({\n'
            '    el: { say: $("at%dsay"), stage: $("at%dst"), ch: $("at%dch"), fb: $("at%dfb"), score: $("at%dsc"), next: $("at%dnx") },\n'
            '    label: "Test",\n'
            '    items: [%s\n'
            '    ],\n'
            '    finish: %d,\n'
            '    done: "%s",\n'
            '  });\n\n') % (n, n, n, n, n, n, n, items_js(items), idx, DONE)


done = skipped = refused = 0
for name in sorted(PLAN):
    plan = PLAN[name]
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    audit(name, plan["items"])

    badges = [x for x in re.findall(r'<span class="n">(.*?)</span>', s)]
    teach = len([b for b in badges if b.isdigit()])
    bad = []
    if [b for b in badges if b.isdigit()] != [str(i) for i in range(1, teach + 1)]:
        bad.append("step badges do not run 1..%d" % teach)
    if s.count(CHECK_BADGE) != 1:
        bad.append("check badge found %d times" % s.count(CHECK_BADGE))
    if s.count("function secondStep(") != 1:
        bad.append("secondStep declared %d times; this tool installs none" % s.count("function secondStep("))
    if s.count(FINISH) != 1:
        bad.append("finish() found %d times" % s.count(FINISH))
    if s.count(STICK_TAIL) != 1:
        bad.append("the check sticker found %d times" % s.count(STICK_TAIL))
    if STICKER[0] in s or STICKER[1] in s:
        bad.append("this lesson already uses the %s sticker" % STICKER[1])
    paren, colon = "finish(%d, " % teach, "finish: %d," % teach
    form = paren if s.count(paren) == 1 else (colon if s.count(colon) == 1 else None)
    if form is None:
        bad.append("the check finish(%d) is not present exactly once in either shape" % teach)
    if not re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s):
        bad.append("no STICKERS declaration")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    n = teach + 1
    at = s.rindex('<section class="slide"', 0, s.index(CHECK_BADGE))
    s = s[:at] + section(n, plan["code"]) + s[at:]
    eol = s.index("\n", s.index(FINISH))
    s = s[:eol + 1] + CLAIM_JS + s[eol + 1:]
    stick = re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s)
    s = s[:stick.start()] + block(n, teach, plan["items"]) + s[stick.start():]
    s = s.replace(form, form.replace(str(teach), str(teach + 1), 1), 1)
    s = s.replace(STICK_TAIL, '["%s", "%s"], %s' % (STICKER[0], STICKER[1], STICK_TAIL), 1)
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-always-true.py */\n" + CSS + "</style>\n"

    assert s.count(MARK) >= 2
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s step %d added, 2 claims x (2 tests + a verdict)"
          % ("wrote  " if WRITE else "would  ", name, n))
    done += 1

print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
