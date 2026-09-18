# -*- coding: utf-8 -*-
"""A "Story problems" step in every lesson: the maths in a situation.

    python add-story-problems.py            # report
    python add-story-problems.py --write

THE SAME GAP CLOSED IN GRADE 3, NOW HERE TOO. Grade 1 and Grade 2 each carry a
dedicated word-problem bank measured against the actual Cambridge shape at
their stages; Grade 3 and 4 never had one. Grade 3's version of this tool
shipped this morning - see its docstring for the fuller account of what the
books vs app comparison found and why the shape below (one question, not
tiered) was chosen.

THE STAGE 4 SHAPE, measured fresh rather than assumed from Stage 3: fractions
of a quantity ("three quarters of 40 marbles"), money and capacity past 1000,
division with a clean remainder, numbers running well past a thousand and
below zero. Wider than Stage 3's range, matching what this week's book
research found for the Stage 4 Learner's Book and Workbook.

THE STICKER IS INSERTED HERE, in the same tool - copying Grade 4's own
add-differentiation.py shape exactly, which folded step and sticker insertion
together specifically because Grade 3's split version needed a repair
afterwards when the shelf drifted.

THREE QUESTIONS WERE REWRITTEN before a byte was written, because the same
lesson's own spiral-warmup question (shipped this morning) asked the same
shape of question: a first draft asked for a bus's arrival time, a rectangle's
area and a coordinate pair, and all three already exist as spiral items on
Telling the Time, Shape and Measures and Where Things Are. Each rewritten to a
different angle on the same lesson - a film's DURATION rather than an arrival
time, a cuboid's face count rather than an area, a total distance walked
rather than a coordinate pair.

Guarded by a marker; every anchor must match exactly once or the file is
refused rather than half-patched.
"""
import difflib, io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g4-story"
STICKER = ("\U0001F4D6", "Story problems")


def shelf_span(s):
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


# lesson -> (question, [(option, ok)], why) - one step, one question, object
# noun repeated in the question, Cambridge's own cast of names.
WORK = {
 "big-numbers-below-zero": (
   "The temperature is -4 degrees in the morning. By afternoon it has risen by 9 degrees. What is the temperature in the afternoon?",
   [("5 degrees", True), ("13 degrees", False), ("-13 degrees", False)],
   "Starting at -4 and rising 9 degrees: count up nine steps from -4 and you land on 5 degrees."),
 "patterns-and-squares": (
   "Alim arranges 36 chairs into rows to make a square. How many chairs are in each row?",
   [("6", True), ("9", False), ("18", False)],
   "6 times 6 is 36, so 6 rows of 6 chairs make a square of 36."),
 "ways-to-calculate": (
   "A school orders 340 exercise books, then orders 275 more later. How many exercise books has the school ordered in total?",
   [("615", True), ("565", False), ("605", False)],
   "340 add 275 is 615 exercise books."),
 "parts-of-a-whole": (
   "A shop has 200 items in stock. 25% of the items are on sale. How many items are on sale?",
   [("50", True), ("25", False), ("75", False)],
   "25% of 200 is a quarter of 200, which is 50 items on sale."),
 "telling-the-time": (
   "A shop closes at 21:00. What time is that on a 12-hour clock, using a.m. or p.m.?",
   [("9:00 p.m.", True), ("9:00 a.m.", False), ("11:00 p.m.", False)],
   "21:00 minus 12 is 9, and since it is after midday, that is 9:00 p.m."),
 "shape-and-measures": (
   "A cuboid has 6 faces in total. 2 of them are squares. How many of its faces are rectangles that are not squares?",
   [("4", True), ("2", False), ("6", False)],
   "6 faces in total, take away the 2 square faces, leaves 4 rectangular faces "
   "that are not squares."),
 "where-things-are": (
   "Kiki takes 7 steps east and 4 steps north to reach the park. How many steps did Kiki take altogether?",
   [("11", True), ("3", False), ("28", False)],
   "7 add 4 is 11 steps altogether."),
 "asking-sorting-chance": (
   "A class of 28 children is asked if they prefer football or netball. 16 prefer football. How many prefer netball?",
   [("12", True), ("16", False), ("44", False)],
   "28 take away 16 is 12 children who prefer netball."),
}

# ---- audits -----------------------------------------------------------------
for lesson, (q, opts, why) in WORK.items():
    if sum(1 for _, ok in opts) != 3:
        sys.exit("  REFUSED %s: wants 3 options" % lesson)
    if sum(1 for _, ok in opts if ok) != 1:
        sys.exit("  REFUSED %s: wants exactly one key" % lesson)
    for t in (q, why) + tuple(o for o, _ in opts):
        if '"' in t or "\\" in t:
            sys.exit("  REFUSED %s: unsafe text %r" % (lesson, t))


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


RUNNER = """
  /* ==== %s: a story problem, one per lesson ====
     Same idiom as add-differentiation.py's tiered step: the slot is read
     from the DOM, not hardcoded. ONE question, no tiers - Grade 1 and 2's own
     word-problem banks are single questions too. */
  (function () {
    const host = document.getElementById("wpG4");
    if (!host) return;
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const IT = %s;
    let live = true;
    document.getElementById("sayWpG4").textContent = IT.q;
    document.getElementById("chWpG4").innerHTML = shuffle(IT.opts.slice())
      .map((o) => '<button type="button" class="choice word" data-ok="' + (o.ok ? 1 : 0)
        + '">' + esc(o.t) + "</button>").join("");
    document.getElementById("chWpG4").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const ok = b.dataset.ok === "1";
      [...document.getElementById("chWpG4").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const fb = document.getElementById("fbWpG4");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not quite. ") + IT.why;
      say(ok ? cheer() : IT.why);
      finish(SLOT, "Story problems teach the same maths in a real situation.");
    });
  })();
"""

STYLE = """<style>/* %s - see add-story-problems.py */
  #fbWpG4 { margin-top: 4px; }
</style>
""" % MARK

EXPLAIN = ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
           "<s>This one is a story.</s></prosody></mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
           "<s>Read it carefully, and work out what it is asking.</s>"
           "<s>The maths is the same maths you have just been using.</s></mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
           "<s>Have a go.</s></mstts:express-as>")

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
    for nm in ("shuffle", "cheer", "say", "finish"):
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

    STR = r'"((?:[^"\\]|\\.)*)"'

    def norm(t):
        t = re.sub(r"<[^>]+>", " ", t)
        t = re.sub(r"&[a-z#0-9]+;", " ", t)
        return " ".join(re.sub(r"[^a-z0-9 ]", " ", t.lower()).split())

    bank = {norm(m.group(1))
            for m in re.finditer(r"\b(?:q|ask|text|say)\s*:\s*" + STR, s)}
    bank = {b for b in bank if len(b.split()) >= 3}
    q, opts, why = WORK[slug]
    qn = norm(q)
    r, e = max(((difflib.SequenceMatcher(None, qn, b).ratio(), b) for b in bank),
               default=(0.0, ""))
    if r > 0.60:
        print("  REFUSED    %-24s restates the lesson's own bank: %.2f vs %r"
              % (slug, r, e[:64]))
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

    item = ("{ q: %s, why: %s, opts: [%s] }"
            % (lit(q), lit(why),
               ", ".join("{ t: %s, ok: %s }" % (lit(o), "true" if ok else "false")
                         for o, ok in opts)))

    slide = (
        '<!-- %d  Story problems  (Cambridge Stage 4 word-problem shape) -->\n    '
        '<section class="slide" data-twm="specialising" '
        'data-say="Read the story, then work out the answer." '
        "data-explain='%s'>\n"
        '      <div class="slide-head"><span class="n">%d</span><h2>Story problems</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="sayWpG4"></span></div>\n'
        '      <div id="wpG4"></div>\n'
        '      <div class="choices" id="chWpG4"></div>\n'
        '      <p class="fb" id="fbWpG4" role="status" aria-live="polite"></p>\n'
        '    </section>\n    ' % (n, EXPLAIN, n))

    out = s[:at] + slide + s[at:]
    out = re.sub(r"finish\((\d+)", bump, out)
    out = out.replace(anchor, (RUNNER % (MARK, item)).lstrip("\n") + "\n" + anchor, 1)

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
    total += 1
    print("  would      %-24s step %-2d  bank %2d  nearest %.2f   finish shifted: %s"
          % (slug, n, len(bank), r, shifted or "none"))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d item(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
