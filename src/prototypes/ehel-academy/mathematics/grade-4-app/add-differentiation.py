# -*- coding: utf-8 -*-
"""Stage 4's own Support and Challenge, on a step of their own.

    python add-differentiation.py            # report
    python add-differentiation.py --write

WHAT STAGE 4 OFFERS, measured before anything was written, and it is not what
Stage 3 offers:

    surface              Stage 3            Stage 4
    Digging deeper       0                  67   (Ready to Go, NOT the Guide)
    Challenge learners   42                 36 Guide + 16 Ready to Go
    Support learners     19                 10
    Differentiation      41 headings        51 headings

SUPPORT IS APPARATUS HERE TOO, which was checked rather than carried over. All
ten Stage 4 support notes hand something over, and they name it: "Support
learners by providing copies of Template 1: Number lines -10 to 10", Template 5
and 6 place value charts, Template 13 and 14 Venn diagrams, Template 25 Carroll
diagram, Templates 26-29 tally charts, pictograms, dot plots and bar charts,
Template 51 Gattegno charts. A screen cannot hand a child a template, so support
here puts the aid ON the question and NAMES it, for the adult beside them. The
audit requires that naming.

BUT SUPPORT IS HALF AS THICK AS AT STAGE 3 - ten notes against nineteen, across
a longer book. That is the number to keep in view: the support items below lean
on the templates Stage 4 does name, and no aid is invented for a lesson where
Stage 4 names none.

DIGGING DEEPER IS NOT USED, and this is the one Stage 4-only feature that had to
be turned down. All 67 are in Ready to Go, printed in a column beside the
Support column, and the extractor interleaves the two:

    "Digging deeper for learning Support: During the Main activity, give
     learners Ask the learners: a copy of PowerPoint 2, slides 3 or 4, so that
     What shape can we make if we put two they have a guide to use when
     creating their triangles together?"

Two different notes shuffled into one another. Separating them is guessing at
which words belong to which column, so the challenge items come from the
Guide's "Challenge learners" notes, which are clean, and Digging deeper is
recorded here as available in the book and unusable from the PDF.

NEITHER TIER SCORES. finish() fires on the core question alone: a child who
needs the support route is not marked down for taking it, and one who takes the
challenge is not required to get it right.

THE CHALLENGE MAY NOT RESTATE THE LESSON'S OWN QUESTION BANK, gated below rather
than left to judgement, after twelve of seventeen English differentiation
defects turned out to be extension items repeating the core bank. The ceiling is
asymmetric because the tiers answer to different things: the core has none - it
is SUPPOSED to be an ordinary question of the lesson's kind - support is 0.85
because it re-asks the core with an aid, and the challenge is 0.60.

Be exact about what that gate catches: it compares STRINGS, so it catches a
copied or lightly edited question and nothing else. At Grade 3 it was
mutation-tested both ways - a verbatim bank question refused at 1.00, the same
question REWORDED passed at 0.43 - which is the English shape exactly. That is
why the nearest bank entry is PRINTED on every line, pass or fail.

THE STICKER IS INSERTED HERE. The shelf is positional - STICKERS[i] is bound to
done[i] - so a tool that adds a step and not a sticker silently re-points every
sticker after it. Grade 3's version of this tool did exactly that and needed a
repair afterwards; this one does not.
"""
import difflib, io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g4-tiers"
STICKER = ("\U0001F4DD", "Try this one")


def shelf_span(s):
    """(open, close) bracket indices of const STICKERS = [ ... ], by matching
    brackets rather than by a regex - Grade 2 writes the whole array on one line
    and Grade 3 over several, and an indentation-shaped pattern reported eight
    of nine Grade 2 lessons as having no shelf at all."""
    i = s.find("const STICKERS")
    if i < 0:
        return None
    i = s.find("[", i)
    if i < 0:
        return None
    depth, j, instr, esc_, quote = 0, i, False, False, ""
    while j < len(s):
        c = s[j]
        if instr:
            if esc_:
                esc_ = False
            elif c == "\\":
                esc_ = True
            elif c == quote:
                instr = False
        elif c in "\"'":
            instr, quote = True, c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return i, j
        j += 1
    return None


def entries(body):
    """The top-level [...] entries of the array body, verbatim."""
    out, d, start, instr, esc_, quote = [], 0, None, False, False, ""
    for k, c in enumerate(body):
        if instr:
            if esc_:
                esc_ = False
            elif c == "\\":
                esc_ = True
            elif c == quote:
                instr = False
            continue
        if c in "\"'":
            instr, quote = True, c
        elif c == "[":
            if d == 0:
                start = k
            d += 1
        elif c == "]":
            d -= 1
            if d == 0:
                out.append(body[start:k + 1])
    return out

# The apparatus a Stage 4 support note reaches for, every one of them named in
# the Guide's own support notes. A support item must NAME one: the adult beside
# the child is the one who can fetch it.
AIDS = ("number line", "place value chart", "base 10", "Venn diagram",
        "Carroll diagram", "tally chart", "pictogram", "dot plot", "bar chart",
        "Gattegno chart", "squared paper", "grid paper", "cubes", "ruler",
        "counters", "clock face", "calendar", "compass", "template", "paper")

# lesson -> (core, support, extension) each (question, [(option, ok)], why)
WORK = {
 "big-numbers-below-zero": (
   ("What is the value of the 4 in 3,472?",
    [("4 hundreds", True), ("4 tens", False), ("4 thousands", False)],
    "Reading from the right: 2 ones, 7 tens, 4 hundreds, 3 thousands."),
   ("Write 3,472 into a place value chart, one digit per column. Which column "
    "does the 4 land in?",
    [("hundreds", True), ("tens", False), ("thousands", False)],
    "Fill a place value chart from the right: ones, tens, hundreds, thousands. "
    "The 4 sits in the hundreds column, so it is worth 4 hundreds."),
   ("Does 13,052 round to 10,000 or to 20,000 to the nearest 10,000?",
    [("10,000", True), ("20,000", False), ("13,000", False)],
    "Halfway is 15,000. 13,052 is below that, so it rounds down to 10,000. "
    " (Teacher's Guide p37)"),
 ),
 "patterns-and-squares": (
   ("Is 6 + 7 odd or even?",
    [("odd", True), ("even", False), ("neither", False)],
    "Even plus odd is always odd. 6 + 7 = 13."),
   ("Use cubes. Make a row of 6 and a row of 7, then pair them all up. Is one "
    "cube left over?",
    [("yes, so the total is odd", True), ("no, they all pair up", False),
     ("two are left over", False)],
    "Pair the cubes off. An even number pairs exactly; the odd row leaves one "
    "over, so the total is odd."),
   ("6 + 7 is odd. Now add 2 more, so 6 + 7 + 2. Is the total still odd?",
    [("yes, adding an even number keeps it odd", True),
     ("no, it becomes even", False), ("you cannot tell", False)],
    "13 + 2 = 15, which is odd. Adding an even number never changes odd to even. "
    " (Teacher's Guide p114)"),
 ),
 "ways-to-calculate": (
   ("What is 225 + 98?",
    [("323", True), ("313", False), ("333", False)],
    "225 + 100 = 325, and 98 is 2 less than 100, so take 2 off: 323."),
   ("Use a number line. Jump from 225 to 325, then step back 2. Where do you land?",
    [("323", True), ("327", False), ("325", False)],
    "Adding 100 is one easy jump on a number line. Then step back the 2 you added "
    "too many."),
   ("Alim adds 47 + 53 by rounding. Which pair is easiest to round the same way?",
    [("98 and 102", True), ("47 and 53", False), ("12 and 9", False)],
    "98 is 2 below 100 and 102 is 2 above, so the 2s cancel and the total is 200. "
    " (Teacher's Guide p53)"),
 ),
 "parts-of-a-whole": (
   ("Which is the same as one quarter?",
    [("25%", True), ("4%", False), ("40%", False)],
    "A quarter of 100 is 25, so one quarter is 25%."),
   ("Take squared paper and ring a 10 by 10 grid, which is 100 small squares. "
    "Shade one quarter of it. How many small squares have you shaded?",
    [("25", True), ("4", False), ("50", False)],
    "100 shared into 4 equal parts gives 25 each, so a quarter of the square is 25 "
    "of the 100 parts, which is 25%."),
   ("Why is 25% the same as one quarter?",
    [("25 goes into 100 exactly four times", True),
     ("because 25 is a quarter of 50", False),
     ("because both have a 2 in them", False)],
    "Per cent means out of 100. 100 divided by 25 is 4, so 25% is one of four "
    "equal parts.  (Teacher's Guide p194)"),
 ),
 "telling-the-time": (
   ("What is 15:45 on a 12-hour clock?",
    [("3:45 p.m.", True), ("5:45 p.m.", False), ("3:45 a.m.", False)],
    "Take 12 off the hours: 15 - 12 = 3, and it is after midday, so 3:45 p.m."),
   ("Use a clock face. Count on from 12 noon: 13:00 is 1 o'clock, 14:00 is 2. What "
    "is 15:45?",
    [("3:45 p.m.", True), ("4:45 p.m.", False), ("15 minutes to 4", False)],
    "Each hour past 12 noon counts on by one: 13 is 1, 14 is 2, 15 is 3. The "
    "minutes do not change."),
   ("Which of these is another way of saying 15:45?",
    [("quarter to four in the afternoon", True),
     ("quarter past four in the afternoon", False),
     ("quarter to four in the morning", False)],
    "45 minutes past 3 is the same as 15 minutes before 4, and 15:00 is in the "
    "afternoon.  (Teacher's Guide p64)"),
 ),
 "shape-and-measures": (
   ("How many faces has a cube?",
    [("6", True), ("8", False), ("12", False)],
    "A cube has 6 square faces, 12 edges and 8 corners."),
   ("Look at a net of a cube on squared paper, before it is folded. How many "
    "squares are there?",
    [("6", True), ("8", False), ("4", False)],
    "A net shows every face laid flat. Count the squares and you have counted the "
    "faces: 6."),
   ("What shape is each face of a cube?",
    [("a square", True), ("a rectangle that is not a square", False),
     ("a triangle", False)],
    "Every face of a cube is a square, which is what makes it a cube rather than "
    "a cuboid.  (Teacher's Guide p123)"),
 ),
 "where-things-are": (
   ("You face east and make a quarter turn ANTICLOCKWISE. Which way do you face?",
    [("north", True), ("south", False), ("west", False)],
    "Anticlockwise is the way clock hands do not go. From east that is back to "
    "north."),
   ("Use a compass drawing with north at the top. Put your finger on east and move "
    "it one quarter of the way round, against the way clock hands go. Where does "
    "it stop?",
    [("north", True), ("south", False), ("north-east", False)],
    "A quarter of a full turn is one of the four main points. Going anticlockwise "
    "from east, that is north."),
   ("A quarter turn is the same as which of these?",
    [("a right angle", True), ("a straight line", False), ("a full turn", False)],
    "A quarter turn is 90 degrees, which is exactly a right angle. "
    " (Teacher's Guide p140)"),
 ),
 "asking-sorting-chance": (
   ("A tally shows four lines with one across them. How many is that?",
    [("5", True), ("4", False), ("6", False)],
    "Four lines with a fifth across them makes a group of five."),
   ("Use a blank tally chart. Draw four lines, then one across them. Count the "
    "group. How many?",
    [("5", True), ("4", False), ("10", False)],
    "Tally marks are grouped in fives so they are quick to count: the fifth mark "
    "goes across the other four."),
   ("You want to show the same survey twice, once as a bar chart and once another "
    "way. Which also shows how big each group is?",
    [("a bar model", True), ("a list of names", False),
     ("a photograph of the class", False)],
    "A bar model shows each group as a length, so the sizes can be compared at a "
    "glance, just as a bar chart does.  (Teacher's Guide p165)"),
 ),
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
    const host = document.getElementById("tierG");
    if (!host) return;
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const TIERS = %s;
    let stage = "core", live = false;
    function paint() {
      const it = TIERS[stage];
      document.getElementById("sayG4").textContent = it.q;
      document.getElementById("chG4").innerHTML = shuffle(it.opts.slice())
        .map((o) => '<button type="button" class="choice word" data-ok="' + (o.ok ? 1 : 0)
          + '">' + esc(o.t) + "</button>").join("");
      document.getElementById("fbG4").className = "fb";
      document.getElementById("fbG4").textContent = "";
      document.getElementById("scG4").textContent =
        stage === "core" ? "" : (stage === "support" ? "A little help" : "A harder one");
      live = true;
    }
    document.getElementById("chG4").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = TIERS[stage], ok = b.dataset.ok === "1";
      [...document.getElementById("chG4").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const fb = document.getElementById("fbG4");
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
  #scG4 { font-size: 12px; letter-spacing: .05em; text-transform: uppercase;
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
    near, over, close = [], [], []
    for (tier, ceil), item in zip(CEIL, WORK[slug]):
        q = norm(item[0])
        r, e = max(((difflib.SequenceMatcher(None, q, b).ratio(), b) for b in bank),
                   default=(0.0, ""))
        near.append("%s %.2f" % (tier, r))
        # The docstring says the nearest bank entry is printed, and at Grade 3
        # only the SCORE was - which is not the same thing at all, because a
        # score cannot be read against the question it is scoring. Anything
        # close enough to be worth a human look prints the pair.
        if r >= 0.55:
            close.append("      %-9s %.2f\n        MINE: %s\n        BANK: %s"
                         % (tier, r, q[:88], e[:88]))
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
        '&#128266;</button><span id="sayG4"></span></div>\n'
        '      <div id="tierG"></div>\n'
        '      <div class="choices" id="chG4"></div>\n'
        '      <p class="fb" id="fbG4" role="status" aria-live="polite"></p>\n'
        '      <p class="score" id="scG4"></p>\n'
        '    </section>\n    ' % (n, EXPLAIN, n))

    out = s[:at] + slide + s[at:]
    out = re.sub(r"finish\((\d+)", bump, out)
    out = out.replace(anchor, (RUNNER % (MARK, tiers)).lstrip("\n") + "\n" + anchor, 1)

    # The sticker, at the index of the step it belongs to. The docstring said
    # this happened before the code did it: the tool was copied from Grade 3's,
    # whose version relies on a separate repair, and only the prose was updated.
    # The shelf audit caught it on all eight pages - which is the whole reason
    # that audit exists as something other than a fixer.
    sp2 = shelf_span(out)
    if not sp2:
        print("  REFUSED    %-24s no STICKERS shelf to insert into" % slug)
        refused += 1
        continue
    shelf_body = out[sp2[0] + 1:sp2[1]]
    ent = entries(shelf_body)
    ent.insert(before, '["%s", "%s"]' % STICKER)
    if "\n" in shelf_body.strip():
        lines = ["    " + ", ".join(ent[k:k + 4]) + ("," if k + 4 < len(ent) else "")
                 for k in range(0, len(ent), 4)]
        new_shelf = "\n" + "\n".join(lines) + "\n  "
    else:
        new_shelf = ", ".join(ent)
    out = out[:sp2[0] + 1] + new_shelf + out[sp2[1]:]

    steps_now = out.count('<section class="slide"') - 1
    sp3 = shelf_span(out)
    got = entries(out[sp3[0] + 1:sp3[1]])
    if len(got) != steps_now:
        print("  REFUSED    %-24s shelf %d for %d steps after the insert"
              % (slug, len(got), steps_now))
        refused += 1
        continue
    if STICKER[1] not in got[before]:
        print("  REFUSED    %-24s the sticker did not land on the new step" % slug)
        refused += 1
        continue

    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2:
        print("  REFUSED    %-24s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue
    todo.append((p, out))
    total += 3
    for c in close:
        print(c)
    print("  would      %-24s step %-2d  bank %2d  nearest: %s   finish shifted: %s"
          % (slug, n, len(bank), "  ".join(near), shifted or "none"))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d item(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
