# -*- coding: utf-8 -*-
"""Stage 3's own Support and Challenge, on a step of their own.

    python add-differentiation.py            # report
    python add-differentiation.py --write

WHAT STAGE 3 ACTUALLY OFFERS, measured before anything was written. There is no
"Digging deeper" at Stage 3 - that is the Stage 4 book series, and assuming it
transferred would have sent this looking for a feature the Hodder books do not
have. Stage 3 words its two halves differently:

    Challenge learners        44 notes, the extension half
    Support learners          19, plus "Encourage learners" 80
    Differentiation           41 section headings

THE TWO HALVES HAVE THE SAME CHARACTER AS STAGE 2, which was checked rather
than carried over:

  SUPPORT IS APPARATUS AND SCAFFOLD. "Support learners by providing Template 11:
  Blank Venn diagram." "Support learners by providing headings such as 4
  corners/Not 4 corners." Counted across the Guide: template 216, number line
  111, cubes 104, cards 77, counters 50. It is not a smaller task - it is the
  same task with something to think WITH.

  CHALLENGE IS AN OPEN QUESTION. "Find out what shape you can make with the
  largest number of corners, using only one straight cut." "Find the next
  regular shape after the hexagon and before the octagon."

A screen cannot hand a child cubes, so SUPPORT here does the one thing a screen
can: it puts the aid ON the question and NAMES it, so the adult beside the child
knows what to reach for. The audit requires that naming.

WHAT IS LEFT TO THE TEACHER, and named rather than faked: eleven of the 44
challenge notes ask the child to CREATE something - "create their own 'I am
thinking of a number' puzzles", "write their own inequalities", "draw and colour
their own counting stick". Three buttons cannot mark an invented puzzle. Those
are not attempted here. Grade 2 closed the equivalent gap with a scaffolded
builder (grade-2-app/add-problem-builder.py); the same could be done at Stage 3
and has not been.

NEITHER TIER SCORES. finish() fires on the core question alone, exactly as Grade
2 keeps it: a child who needs the support route is not marked down for taking
it, and one who takes the challenge is not required to get it right.

THE CHALLENGE MAY NOT RESTATE THE LESSON'S OWN QUESTION BANK, and that is gated
below rather than left to judgement. At English Grades 3-4 twelve of seventeen
differentiation defects were extension items that repeated the core bank in
other words, and the gate of the day caught exactly one of them - so every tier
item here is compared against every question its page already asks and the
closest match is printed, whether it refuses or not.

The CEILING IS DELIBERATELY ASYMMETRIC, because the two tiers are answerable to
different things:

    core       no ceiling. It is SUPPOSED to be an ordinary question of the
               lesson's own kind - that is what makes the routing fair.
    support    0.85. It re-asks the core with an aid, so it resembles the core
               by construction; what it must not be is a verbatim bank entry.
    challenge  0.60. This is the one the English finding was about.

One core sits at 0.80 against its bank and is kept on purpose. Shapes and
Symmetry asks "how many lines of symmetry does a square have" (4) and the core
here asks the same of a RECTANGLE (2). That is not the same question with a
word changed, it is the classic over-generalisation - and the support item is
built on it, telling the child to check the diagonals before deciding.

BE EXACT ABOUT WHAT THIS GATE CATCHES, because it is NOT the English failure.
It compares STRINGS, so it catches a copied or lightly edited question and
nothing else. Mutation-tested both ways on Shapes and Symmetry:

    challenge replaced by a bank question verbatim          1.00  REFUSED
    challenge replaced by the same question REWORDED        0.43  passed
      ("A square is folded so both halves match. How many such folds
       are there?" - a different sentence asking for the same 4)

The second is precisely the shape of the twelve English defects, and this gate
would have shipped all twelve. That is why the nearest bank entry is PRINTED on
every line, pass or fail: the refusal handles the careless case, and a person
reading the report against the bank is still the only thing that handles the
real one. One equal-parts core was replaced for exactly that reason, and the
gate had nothing to say about it - it scored 0.67, under every ceiling here.
"""
import difflib, io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g3-tiers"

# The apparatus a Stage 3 support note reaches for. A support item must NAME one:
# the adult beside the child is the one who can fetch it.
AIDS = ("number line", "hundred square", "cubes", "counters", "place value chart",
        "base 10", "ten frame", "squared paper", "ruler", "coins", "template",
        "tally chart", "Venn diagram", "Carroll diagram", "clock face", "array",
        "fraction strip", "paper", "headings")

# lesson -> (core, support, extension) each (question, [(option, ok)], why)
WORK = {
 "up-to-a-thousand": (
   ("Which is bigger, 408 or 480?",
    [("480", True), ("408", False), ("They are the same", False)],
    "Both have 4 hundreds, so look at the tens: 8 tens beats 0 tens."),
   ("Use a place value chart. In 408 the tens digit is 0 and in 480 it is 8. Which is bigger?",
    [("480", True), ("408", False), ("You cannot tell", False)],
    "Write each number into a place value chart, hundreds then tens then ones, and "
    "compare one column at a time from the left."),
   ("Think of a number that rounds to 300 to the nearest 100 AND to the nearest 10. "
    "Which of these works?",
    [("298", True), ("340", False), ("351", False)],
    "298 rounds to 300 both ways. 340 rounds to 300 to the nearest 100 but to 340 to "
    "the nearest 10.  (Teacher's Guide p134)")),
 "adding-and-money": (
   ("What is 70 + 30?",
    [("100", True), ("90", False), ("110", False)],
    "7 tens and 3 tens make 10 tens, which is 100."),
   ("Use a number line marked in 10s. Start at 70 and count on 3 tens. Where do you land?",
    [("100", True), ("90", False), ("73", False)],
    "Counting on in tens along a number line: 70, 80, 90, 100. Three jumps of ten."),
   ("How many cents make up 10 shillings?",
    [("1000", True), ("100", False), ("10", False)],
    "Each shilling is 100 cents, so 10 shillings is 10 lots of 100, which is 1000. "
    " (Teacher's Guide p139)")),
 "rows-and-rules": (
   ("What is 4 x 3?",
    [("12", True), ("7", False), ("43", False)],
    "Four rows of three: 3, 6, 9, 12."),
   ("Lay out cubes in 4 rows of 3 and count them. How many cubes?",
    [("12", True), ("7", False), ("9", False)],
    "Build the array with cubes, then count in threes along the rows: 3, 6, 9, 12."),
   ("3 x 9 is triple 3 x 3. If 3 x 3 is 9, what is 3 x 9?",
    [("27", True), ("18", False), ("12", False)],
    "Three lots of 9 is 27. Tripling 3 x 3 triples the answer too. "
    " (Teacher's Guide p101)")),
 "equal-parts": (
   ("Three friends share a cake equally. What fraction does each one get?",
    [("one third", True), ("one quarter", False), ("one half", False)],
    "Three equal shares means the cake is cut into 3, so each share is one third."),
   ("Fold a strip of paper into 3 equal parts. What is each part called?",
    [("one third", True), ("one quarter", False), ("three", False)],
    "Fold the paper into 3 parts that match exactly. One of 3 equal parts is one "
    "third."),
   ("A paper strip folded into equal parts can make halves, thirds, quarters, fifths "
    "and sixths. Which fold gives the SMALLEST piece?",
    [("sixths", True), ("halves", False), ("thirds", False)],
    "The more equal parts a whole is folded into, the smaller each one is. "
    " (Teacher's Guide p166)")),
 "shapes-and-symmetry": (
   ("How many lines of symmetry has a rectangle?",
    [("2", True), ("1", False), ("4", False)],
    "A rectangle folds onto itself across the middle both ways, but not corner to corner."),
   ("Trace a rectangle on squared paper and fold it every way you can. How many folds "
    "match exactly?",
    [("2", True), ("1", False), ("3", False)],
    "Fold across the middle one way, then the other. Only those two match exactly - "
    "check the diagonals too before you decide."),
   ("Regular shapes go triangle, square, pentagon, hexagon, then octagon. Which shape "
    "comes between the hexagon and the octagon?",
    [("heptagon", True), ("pentagon", False), ("decagon", False)],
    "A heptagon has seven sides, one more than a hexagon and one fewer than an "
    "octagon.  (Teacher's Guide p49)")),
 "measure-it": (
   ("How many centimetres are in 1 metre?",
    [("100", True), ("10", False), ("1000", False)],
    "A metre is 100 centimetres."),
   ("Look at a ruler marked in centimetres. How many centimetre marks fit into a metre?",
    [("100", True), ("10", False), ("50", False)],
    "Lay the ruler along a metre stick, end to end, and count the centimetre marks "
    "as you go. There are 100 of them in one metre."),
   ("Which of these would you weigh in kilograms rather than grams?",
    [("a bag of rice", True), ("a coin", False), ("a feather", False)],
    "Kilograms are for heavy things. A coin and a feather are far lighter than a "
    "kilogram.  (Teacher's Guide p112)")),
 "time-and-direction": (
   ("You face north and turn clockwise a quarter turn. Which way do you face?",
    [("east", True), ("west", False), ("south", False)],
    "Clockwise from north goes to east, then south, then west."),
   ("Use a clock face. North is 12. A quarter turn clockwise lands on 3. Which "
    "direction is that?",
    [("east", True), ("west", False), ("north", False)],
    "Put north at 12 on the clock face. A quarter turn clockwise is three hours "
    "round, which is east."),
   ("From Start you go forward, then turn clockwise a half turn, then forward again. "
    "Which way are you facing at the end?",
    [("back the way you came", True), ("the same way", False), ("a quarter turn round", False)],
    "A half turn is two quarter turns, so you end facing the opposite way. "
    " (Teacher's Guide p122)")),
 "ask-count-chart": (
   ("A tally shows four lines with one across them. How many is that?",
    [("5", True), ("4", False), ("6", False)],
    "Four lines and a fifth across them makes a group of five."),
   ("Use a blank tally chart. Draw four lines, then one across. Count the group. How many?",
    [("5", True), ("4", False), ("10", False)],
    "Tally marks are grouped in fives so they are quick to count: the fifth mark goes "
    "across the other four."),
   ("You want to sort shapes by TWO things at once: 4 corners or not, and blue or not. "
    "Which diagram does that?",
    [("a Carroll diagram", True), ("a tally chart", False), ("a pictogram", False)],
    "A Carroll diagram splits by two properties at once, which is exactly what those "
    "two headings do.  (Teacher's Guide p43)")),
}

# ---- audits -----------------------------------------------------------------
for lesson, tiers in WORK.items():
    for tier_name, (q, opts, why) in zip(("core", "support", "extension"), tiers):
        if sum(1 for _, ok in opts) != 3:
            sys.exit("  REFUSED %s %s: wants 3 options" % (lesson, tier_name))
        if sum(1 for _, ok in opts if ok) != 1:
            sys.exit("  REFUSED %s %s: wants exactly one key" % (lesson, tier_name))
    sup_q, _, sup_why = tiers[1]
    blob = (sup_q + " " + sup_why).lower()
    if not any(a in blob for a in AIDS):
        sys.exit("  REFUSED %s: the support item names no apparatus. Stage 3's support "
                 "notes hand the child something to think WITH - see the docstring."
                 % lesson)


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


RUNNER = """
  /* ==== %s: Stage 3's Support and Challenge ====
     Written in this page's own idiom and deriving its slot the way the
     reasoning step does, so nothing later needs renumbering.

     THE CORE QUESTION ALONE FINISHES THE STEP. A wrong answer brings the
     support route, whose question names the apparatus a Stage 3 support note
     would hand over; a right one offers the challenge AFTER the step is
     already done. Neither tier scores, because a child who needs the aid must
     not be marked down for using it and one who takes the challenge must not
     be punished for trying. */
  (function () {
    const host = document.getElementById("tierT");
    if (!host) return;
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const TIERS = %s;
    let stage = "core", live = false;
    function paint() {
      const it = TIERS[stage];
      document.getElementById("sayT").textContent = it.q;
      document.getElementById("chT").innerHTML = shuffle(it.opts.slice())
        .map((o) => '<button type="button" class="choice word" data-ok="' + (o.ok ? 1 : 0)
          + '">' + esc(o.t) + "</button>").join("");
      document.getElementById("fbT").className = "fb";
      document.getElementById("fbT").textContent = "";
      document.getElementById("scT").textContent =
        stage === "core" ? "" : (stage === "support" ? "A little help" : "A harder one");
      live = true;
    }
    document.getElementById("chT").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = TIERS[stage], ok = b.dataset.ok === "1";
      [...document.getElementById("chT").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const fb = document.getElementById("fbT");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not quite. ") + it.why;
      say(ok ? cheer() : it.why);
      if (stage === "core") {
        /* the step is finished by the core question either way: the tiers are
           a route through it, not a second hurdle */
        finish(SLOT, "You can do this one, and you have seen a harder one.");
        stage = ok ? "extension" : "support";
        later(paint, 3600);
      }
    });
    paint();
  })();
"""

STYLE = """<style>/* %s - see add-differentiation.py */
  #scT { font-size: 12px; letter-spacing: .05em; text-transform: uppercase;
    color: var(--muted, #666); }
</style>
""" % MARK

EXPLAIN = ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
           "<s>This step meets you where you are.</s></prosody></mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
           "<s>Answer the question as it is asked.</s>"
           "<s>If it does not come out, the next one hands you something to think with.</s>"
           "<s>If it does, the next one is harder.</s></mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
           '<prosody rate="-6%"><s>Taking the easier route costs you nothing.</s>'
           "<s>The step is finished either way.</s></prosody></mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
           "<s>Have a go, and see which way it takes you.</s></mstts:express-as>")

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|^_", f))
todo, done, refused, total = [], 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-24s" % slug)
        done += 1
        continue

    bad = []
    for nm in ("shuffle", "cheer", "say", "later", "finish"):
        if not re.search(r"(?:function|const|let|var)\s+%s\b" % nm, s):
            bad.append("no %s()" % nm)
    st = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    chk = [i for i, x in enumerate(st)
           if re.search(r'<span class="n">(&#10003;|✓)</span>',
                        s[x:(st[i + 1] if i + 1 < len(st) else len(s))])]
    if len(chk) != 1:
        bad.append("%d check slides" % len(chk))
    nums = re.findall(r'<div class="slide-head"><span class="n">(\d+)</span>', s)
    anchor = "  show(0, false);"
    if s.count(anchor) != 1:
        bad.append("show(0,false) x%d" % s.count(anchor))
    if bad:
        print("  REFUSED    %-24s %s" % (slug, "; ".join(bad)))
        refused += 1
        continue

    # Does any tier item restate a question this page already asks? See the
    # docstring for why the ceiling differs by tier - and note the bank is read
    # from the page in front of us, so a content fix moves it with no edit here.
    STR = r'"((?:[^"\\]|\\.)*)"'

    def norm(t):
        t = re.sub(r"<[^>]+>", " ", t)
        t = re.sub(r"&[a-z#0-9]+;", " ", t)
        return " ".join(re.sub(r"[^a-z0-9 ]", " ", t.lower()).split())

    bank = {norm(m.group(1))
            for m in re.finditer(r"\b(?:q|ask|text|say)\s*:\s*" + STR, s)}
    bank = {b for b in bank if len(b.split()) >= 3}
    CEIL = (("core", None), ("support", 0.85), ("challenge", 0.60))
    near, over = [], []
    for (tier, ceil), item in zip(CEIL, WORK[slug]):
        q = norm(item[0])
        r, e = max(((difflib.SequenceMatcher(None, q, b).ratio(), b) for b in bank),
                   default=(0.0, ""))
        near.append("%s %.2f" % (tier, r))
        if ceil is not None and r > ceil:
            over.append("%s %.2f > %.2f  vs %r" % (tier, r, ceil, e[:64]))
    if over:
        print("  REFUSED    %-24s restates the lesson's own bank: %s"
              % (slug, "; ".join(over)))
        refused += 1
        continue

    at = st[chk[0]]
    n = max(int(x) for x in nums) + 1
    before = len([x for x in st if x < at])
    shifted = []

    def bump(m):
        i = int(m.group(1))
        if i >= before:
            shifted.append(i)
            return "finish(%d" % (i + 1)
        return m.group(0)

    core, sup, ext = WORK[slug]
    def js_tier(t):
        q, opts, why = t
        return ("{ q: %s, why: %s, opts: [%s] }"
                % (lit(q), lit(why),
                   ", ".join("{ t: %s, ok: %s }" % (lit(o), "true" if ok else "false")
                             for o, ok in opts)))
    tiers = ("{\n      core: %s,\n      support: %s,\n      extension: %s\n    }"
             % (js_tier(core), js_tier(sup), js_tier(ext)))

    slide = (
        '<!-- %d  Support and Challenge  (Stage 3 Teacher\'s Guide) -->\n    '
        '<section class="slide" data-twm="specialising" '
        'data-say="Answer this one. Where it takes you next depends on how it goes." '
        "data-explain='%s'>\n"
        '      <div class="slide-head"><span class="n">%d</span><h2>Try this one</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="sayT"></span></div>\n'
        '      <div id="tierT"></div>\n'
        '      <div class="choices" id="chT"></div>\n'
        '      <p class="fb" id="fbT" role="status" aria-live="polite"></p>\n'
        '      <p class="score" id="scT"></p>\n'
        '    </section>\n    ' % (n, EXPLAIN, n))

    out = s[:at] + slide + s[at:]
    out = re.sub(r"finish\((\d+)", bump, out)
    out = out.replace(anchor, (RUNNER % (MARK, tiers)).lstrip("\n") + "\n" + anchor, 1)
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2:
        print("  REFUSED    %-24s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue
    todo.append((p, out))
    total += 3
    print("  would      %-24s step %-2d  bank %2d  nearest: %s   finish shifted: %s"
          % (slug, n, len(bank), "  ".join(near), shifted or "none"))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d item(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
