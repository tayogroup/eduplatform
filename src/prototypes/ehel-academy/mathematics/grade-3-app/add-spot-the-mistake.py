# -*- coding: utf-8 -*-
"""Spot the mistake, Grade 3 - and only where Stage 3's books name one.

    python add-spot-the-mistake.py            # report
    python add-spot-the-mistake.py --write

WHAT THE BOOKS ACTUALLY SUPPORT, which is the whole scope of this tool. The
Stage 3 Teacher's Guide mentions a misconception 21 times. Ten of those are
front-matter boilerplate - the same introduction paragraph, with the same Unit 5
division example, that the Stage 2 Guide carries - leaving 11 in the teaching
notes. Read in full, those 11 are FIVE distinct misconceptions: p94 and p131 are
the same one said twice, and four of the remainder are difficulties ("some
learners may find it difficult to trace the line") or observations ("some
learners may notice the doorways have curved arches") rather than a wrong idea a
child could hold.

So this writes FIVE items across THREE lessons, and five of the eight lessons
get no step at all. Grade 2 shipped 54 items across 9 lessons; Stage 3's Guide
does not evidence anything like that, and inventing the other 49 would attribute
to Cambridge what Cambridge does not say. Each item carries its source page.

WHERE THEY LAND is decided by the misconception, not by spreading them evenly:
they cluster in number and fractions because that is where the Guide names them.

GRADE 3 IS NOT GRADE 2, and the differences here cost a rewrite rather than a
port:
  - no `const CHECK`; the check is `QS` and its finish index is hardcoded
  - the reasoning step derives its own slot
    (`[...document.querySelectorAll(".slide")].indexOf(...)`), so inserting a
    slide before it moves nothing - but the HARDCODED finish indices after the
    insertion point do move, and the check's is the one that matters
  - each lesson carries its own helpers; there is no shared runner to call
This mirrors the reasoning step's own idiom instead of importing Grade 2's.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g3-spot-the-mistake"

# lesson -> [(who, the wrong claim, the ask, [(option, correct)], why, source)]
WORK = {
 "up-to-a-thousand": [
  ("Kiki", "150 to the nearest 100 is 100.",
   "Kiki rounds 150 to the nearest 100 and says 100. What went wrong?",
   [("150 is exactly halfway, so it rounds up to 200", True),
    ("150 rounds down to 0", False),
    ("Kiki is right", False)],
   "150 sits exactly between 100 and 200, so neither one is nearer. When a "
   "number is exactly in the middle we round to the bigger one, so 150 goes to 200.",
   "Teacher's Guide p95"),
  ("Musa", "I count in 1s from 0 to find 700 on the line.",
   "Musa counts in 1s from 0 along a 0 to 1000 number line to find 700. What went wrong?",
   [("The line is marked in 100s, so count in 100s", True),
    ("He should count backwards from 1000", False),
    ("Counting in 1s is the only way", False)],
   "Counting in 1s squashes every number into the last bit of the line. Find the "
   "100s marks first, then count on: 100, 200, 300 and so on to 700.",
   "Teacher's Guide p94 and p131"),
 ],
 "equal-parts": [
  ("Amina", "Fold it in half, then in half again, and there will be 3 parts.",
   "Amina folds a sheet in half, then in half again, and predicts 3 parts. What went wrong?",
   [("Each fold doubles the parts, so 1, 2, then 4", True),
    ("Folding never changes the number of parts", False),
    ("Amina is right", False)],
   "It goes 1, then 2, then 4, because every fold doubles what is there. Amina "
   "was counting 1, 2, 3. A prediction that turns out wrong still teaches you "
   "something, so it was worth making.",
   "Teacher's Guide p125"),
  ("Ali", "One quarter add one quarter is two eighths.",
   "Ali adds one quarter and one quarter and says two eighths. What went wrong?",
   [("The bottom number stays the same; only the top is added", True),
    ("He should add the tops and take away the bottoms", False),
    ("Two eighths is right", False)],
   "The bottom number says how many equal parts the whole is cut into, and "
   "adding does not cut it into more. One quarter and one quarter make two "
   "quarters, which is one half.",
   "Teacher's Guide p166"),
 ],
 "rows-and-rules": [
  ("Hodan", "15 shared between 5 is written 5 divided by 15.",
   "Hodan writes the division for 15 beans shared between 5 friends as 5 divided by 15. What went wrong?",
   [("The whole group of 15 is written first", True),
    ("She should write 15 divided by 3", False),
    ("Division works either way round", False)],
   "15 is the total being shared out, so it comes first: 15 divided by 5 is 3. "
   "The divide symbol says how the total is grouped or shared.",
   "Teacher's Guide p59"),
 ],
}

# no step at all, and the tool says so rather than inventing one
NO_SOURCE = ["adding-and-money", "ask-count-chart", "measure-it",
             "shapes-and-symmetry", "time-and-direction"]

W1 = '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
W2 = '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
W3 = ('<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
      '<prosody rate="-6%">')
W4 = '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
CP, CE = "</prosody></mstts:express-as>", "</mstts:express-as>"
STRIPPED = ("elses", "oclock", "dont", "cant", "wont", "isnt", "doesnt", "didnt",
            "thats", "heres", "theres", "youre", "lets", "shes", "hes")

EXPLAIN = {
 "up-to-a-thousand": (
  ["Finding a mistake somebody else made is its own skill."],
  ["Kiki rounds 150 to the nearest 100 and says 100.",
   "But 150 sits exactly between 100 and 200.",
   "When a number is exactly in the middle, we round to the bigger one."],
  ["A mistake usually starts from a sensible idea.",
   "Kiki looked at the hundreds digit, which works every other time."],
  ["Read what the child says. Work it out yourself before you choose."]),
 "equal-parts": (
  ["A wrong answer about fractions usually comes from a sensible pattern."],
  ["Amina folds a sheet in half, then in half again.",
   "She predicts 3 parts, counting 1, then 2, then 3.",
   "Every fold doubles what is there, so it goes 1, 2, then 4."],
  ["A prediction that turns out wrong still teaches you something.",
   "It is always better to predict than to wait and be told."],
  ["Read what the child says. Work it out yourself before you choose."]),
 "rows-and-rules": (
  ["In a division, the order the numbers are written in carries meaning."],
  ["Hodan writes 15 shared between 5 as 5 divided by 15.",
   "The total being shared out is 15, so 15 goes first.",
   "15 divided by 5 is 3."],
  ["Both numbers are in the question, so either order looks possible.",
   "The divide symbol says how the TOTAL is grouped or shared."],
  ["Read what the child says. Work it out yourself before you choose."]),
}


def build_explain(moves, where):
    j = lambda ss: "".join("<s>" + x + "</s>" for x in ss)
    sc = (W1 + j(moves[0]) + CP + W2 + j(moves[1]) + CE
          + W3 + j(moves[2]) + CP + W4 + j(moves[3]) + CE)
    bad = []
    if "'" in sc:
        bad.append("apostrophe would close the attribute")
    for w in STRIPPED:
        if re.search(r"\b" + w + r"\b", sc.lower()):
            bad.append("stripped contraction %r" % w)
    if sc.count("<break") != 3:
        bad.append("%d breaks" % sc.count("<break"))
    if re.findall(r'style="(\w+)"', sc) != ["calm", "friendly", "empathetic", "cheerful"]:
        bad.append("move order")
    n = sc.count("<s>")
    if sc.count("</s>") != n or not 5 <= n <= 9:
        bad.append("%d sentences" % n)
    if not 201 <= len(sc) <= 901:
        bad.append("%d characters" % len(sc))
    if bad:
        sys.exit("  REFUSED %s: %s" % (where, "; ".join(bad)))
    return sc


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


RUNNER = """
  /* ==== %s: spot the mistake ====
     Written in this page's own idiom - the reasoning step's shape, its class
     names and its derived slot - rather than imported from Grade 2, whose
     pages carry a different generation of runner.

     SLOT is derived from DOM position exactly as the reasoning step derives
     its own, so this step's finish() needs no hardcoded index and nothing
     later has to be renumbered when it moves. */
  (function () {
    const host = document.getElementById("smM");
    if (!host) return;
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const ITEMS = %s;
    let got = 0, asked = 0, order = shuffle(ITEMS.slice()), qi = 0, live = false;
    function paint() {
      if (qi >= order.length) { order = shuffle(ITEMS.slice()); qi = 0; }
      const it = order[qi];
      document.getElementById("clM").innerHTML =
        '<span class="who">' + esc(it.who) + '</span><q>' + esc(it.claim) + '</q>';
      document.getElementById("sayM").textContent = it.ask;
      document.getElementById("chM").innerHTML = shuffle(it.opts.slice())
        .map((o) => '<button type="button" class="choice word" data-ok="' + (o.ok ? 1 : 0)
          + '">' + esc(o.t) + "</button>").join("");
      document.getElementById("fbM").className = "fb";
      document.getElementById("fbM").textContent = "";
      live = true;
    }
    document.getElementById("chM").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = order[qi], ok = b.dataset.ok === "1";
      [...document.getElementById("chM").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      asked++; if (ok) got++;
      const fb = document.getElementById("fbM");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not that one. ") + it.why;
      say(ok ? cheer() : it.why);
      document.getElementById("scM").textContent =
        got + " right out of " + asked + (got >= ITEMS.length ? " - sticker earned!" : "");
      if (got >= ITEMS.length) finish(SLOT, "You can find the mistake and say what went wrong.");
      qi++;
      later(paint, 3400);
    });
    paint();
  })();
"""

STYLE = """<style>/* %s - see add-spot-the-mistake.py */
  #clM { text-align: center; margin: 6px 0 10px; }
  #clM .who { display: block; font-size: 13px; letter-spacing: .04em;
    text-transform: uppercase; color: var(--muted, #666); margin: 0 0 4px; }
  #clM q { display: block; font-size: 20px; line-height: 1.4; max-width: 30ch;
    margin: 0 auto; padding: 10px 14px; border-radius: 10px;
    background: var(--cell, var(--card, #fff)); border: 1px solid var(--line, #ddd); }
</style>
""" % MARK

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack", f))
todo, done, refused, skipped, total = [], 0, 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug in NO_SOURCE:
        print("  no source  %-24s Stage 3 names no misconception for this lesson" % slug)
        skipped += 1
        continue
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
    if not nums:
        bad.append("no numbered steps")
    if bad:
        print("  REFUSED    %-24s %s" % (slug, "; ".join(bad)))
        refused += 1
        continue

    at = st[chk[0]]
    n = max(int(x) for x in nums) + 1
    # every hardcoded finish index at or after the new slide's position moves on
    # by one. The reasoning step derives its own and is untouched by design.
    before = len([x for x in st if x < at])
    shifted = []

    def bump(m):
        i = int(m.group(1))
        if i >= before:
            shifted.append((i, i + 1))
            return "finish(%d" % (i + 1)
        return m.group(0)

    items = WORK[slug]
    js = "[\n" + ",\n".join(
        "      { who: %s, claim: %s, ask: %s, why: %s,\n        opts: [%s] }"
        % (lit(w), lit(c), lit(a), lit(y),
           ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false")
                     for t, ok in o))
        for w, c, a, o, y, _src in items) + "\n    ]"

    explain = build_explain(EXPLAIN[slug], slug)
    slide = (
        '<!-- %d  Spot the mistake  (Stage 3 Teacher\'s Guide) -->\n    '
        '<section class="slide" data-twm="critiquing improving" '
        'data-say="Read what the child says. Work it out yourself. Then tap what went wrong." '
        "data-explain='%s'>\n"
        '      <div class="slide-head"><span class="n">%d</span><h2>Spot the mistake</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="sayM">Read what the child says, work it out yourself, '
        'then tap what went wrong.</span></div>\n'
        '      <div id="smM"><div id="clM"></div></div>\n'
        '      <div class="choices" id="chM"></div>\n'
        '      <p class="fb" id="fbM" role="status" aria-live="polite"></p>\n'
        '      <p class="score" id="scM"></p>\n'
        '    </section>\n    ' % (n, explain, n))

    out = s[:at] + slide + s[at:]
    out = re.sub(r"finish\((\d+)", bump, out)
    # the runner goes in the same script scope the reasoning step lives in
    anchor = "  show(0, false);"
    if out.count(anchor) != 1:
        print("  REFUSED    %-24s show(0,false) appears %d times" % (slug, out.count(anchor)))
        refused += 1
        continue
    out = out.replace(anchor, (RUNNER % (MARK, js)).lstrip("\n") + "\n" + anchor, 1)
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2:
        print("  REFUSED    %-24s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue

    todo.append((p, out))
    total += len(items)
    print("  would      %-24s step %-2d  %d item(s)  finish shifted: %s"
          % (slug, n, len(items), shifted or "none"))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d item(s) across %d lesson(s) %s, %d already done, %d with no source in the "
      "books, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, skipped, refused,
         "" if WRITE else "   (--write to apply)"))
