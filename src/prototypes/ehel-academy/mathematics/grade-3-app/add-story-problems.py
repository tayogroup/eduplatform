# -*- coding: utf-8 -*-
"""A "Story problems" step in every lesson: the maths in a situation.

    python add-story-problems.py            # report
    python add-story-problems.py --write

THE GAP THE BOOKS VS APP COMPARISON NAMED. Grade 1 and Grade 2 each carry a
dedicated word-problem bank (42 and 54 items) measured against the actual
shape of the Cambridge problems at their stages. Grade 3 never had one -
whatever word-problem content exists here is folded ad hoc into a handful of
individual steps, not a systematic per-lesson bank.

THE SHAPE IS MEASURED, NOT GUESSED, from this week's fresh read of the Stage 3
Learner's Book and Workbook: longer than Stage 1's 4-9 words, numbers running
past 1000, named characters from Cambridge's own cast (Jack, Viti, Maris,
Zara, David, Amina), money in shillings, and the object noun repeated in the
question rather than a bare "how many are left?". One genuine two-step example
exists in the Stage 3 material but every item below is one step, matching what
Grade 1 and 2 also chose to keep machine-markable.

ONE QUESTION PER LESSON, not tiered like add-differentiation.py's Support and
Challenge - Grade 1 and 2's own word-problem banks are single questions too,
and a second tier here would be a second thing to validate against a bank that
does not exist at those grades either.

THE STICKER IS INSERTED HERE, in the same tool, not left to a separate repair.
Grade 3's OWN add-differentiation.py had to defer its sticker to
lesson-app-tools/fix-sticker-shelf.py and needed a follow-up fix when the shelf
drifted; Grade 4's version of that tool folded the sticker into itself instead
specifically to avoid repeating that. This tool follows Grade 4's shape.

THE CHALLENGE-STYLE RESTATEMENT CHECK IS KEPT, at a single 0.60 ceiling, for
the same reason add-differentiation.py keeps it: a rewritten copy of a
question already on the page teaches nothing new and the check that would
catch a verbatim copy would not catch a reworded one, so the nearest bank
match is printed on every line regardless of whether it refuses.

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

MARK = "ehel-g3-story"
STICKER = ("\U0001F4D6", "Story problems")


def shelf_span(s):
    """(open, close) bracket indices of const STICKERS = [ ... ], by matching
    brackets rather than a regex - an indentation-shaped pattern has reported a
    real shelf as absent before."""
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
 "up-to-a-thousand": (
   "David has 348 stickers. Zara has 384 stickers. How many more stickers does Zara have than David?",
   [("36", True), ("732", False), ("44", False)],
   "384 take away 348 is 36, so Zara has 36 more stickers."),
 "adding-and-money": (
   "Maris has 350 shillings. She buys a pen for 120 shillings. How many shillings does Maris have left?",
   [("230", True), ("470", False), ("130", False)],
   "350 take away 120 is 230 shillings left."),
 "rows-and-rules": (
   "Jack has 24 mangoes. He shares them equally into 4 baskets. How many mangoes are in each basket?",
   [("6", True), ("20", False), ("4", False)],
   "24 shared into 4 equal baskets is 6 mangoes in each basket."),
 "equal-parts": (
   "Viti has 15 sweets. She gives one third of them to her brother. How many sweets does Viti give her brother?",
   [("5", True), ("3", False), ("10", False)],
   "15 shared into 3 equal thirds is 5 sweets in each third."),
 "shapes-and-symmetry": (
   "Zara draws 3 triangles, 2 squares and 1 hexagon on her paper. How many shapes does Zara draw in total?",
   [("6", True), ("5", False), ("3", False)],
   "3 add 2 add 1 is 6 shapes altogether."),
 "measure-it": (
   "A bottle holds 250 ml of juice. Amina pours in another 180 ml. How many millilitres of juice are in the bottle now?",
   [("430", True), ("70", False), ("330", False)],
   "250 add 180 is 430 millilitres of juice."),
 "time-and-direction": (
   "Ali walks facing north, then turns to face south. How many quarter turns is that in total?",
   [("2", True), ("1", False), ("4", False)],
   "North to south is a half turn, and a half turn is made of two quarter turns."),
 "ask-count-chart": (
   "A survey asks 20 people their favourite fruit. 8 chose mango and 5 chose banana. The rest "
   "chose orange. How many people chose orange?",
   [("7", True), ("13", False), ("3", False)],
   "8 add 5 is 13, and 20 take away 13 is 7 people who chose orange."),
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
     Written in the same idiom as add-differentiation.py's tiered step, so
     nothing later needs renumbering: the slot is read from the DOM, not
     hardcoded. ONE question, no tiers - Grade 1 and 2's own word-problem
     banks are single questions too. */
  (function () {
    const host = document.getElementById("wpG3");
    if (!host) return;
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const IT = %s;
    let live = true;
    document.getElementById("sayWpG3").textContent = IT.q;
    document.getElementById("chWpG3").innerHTML = shuffle(IT.opts.slice())
      .map((o) => '<button type="button" class="choice word" data-ok="' + (o.ok ? 1 : 0)
        + '">' + esc(o.t) + "</button>").join("");
    document.getElementById("chWpG3").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const ok = b.dataset.ok === "1";
      [...document.getElementById("chWpG3").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const fb = document.getElementById("fbWpG3");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not quite. ") + IT.why;
      say(ok ? cheer() : IT.why);
      finish(SLOT, "Story problems teach the same maths in a real situation.");
    });
  })();
"""

STYLE = """<style>/* %s - see add-story-problems.py */
  #fbWpG3 { margin-top: 4px; }
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
        '<!-- %d  Story problems  (Cambridge Stage 3 word-problem shape) -->\n    '
        '<section class="slide" data-twm="specialising" '
        'data-say="Read the story, then work out the answer." '
        "data-explain='%s'>\n"
        '      <div class="slide-head"><span class="n">%d</span><h2>Story problems</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="sayWpG3"></span></div>\n'
        '      <div id="wpG3"></div>\n'
        '      <div class="choices" id="chWpG3"></div>\n'
        '      <p class="fb" id="fbWpG3" role="status" aria-live="polite"></p>\n'
        '    </section>\n    ' % (n, EXPLAIN, n))

    out = s[:at] + slide + s[at:]
    out = re.sub(r"finish\((\d+)", bump, out)
    out = out.replace(anchor, (RUNNER % (MARK, item)).lstrip("\n") + "\n" + anchor, 1)
    out = out.rstrip() + "\n" + STYLE

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
