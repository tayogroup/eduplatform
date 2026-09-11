# -*- coding: utf-8 -*-
"""Give every lesson of a build a "How do you know?" step.

    python add-reasoning-step.py --app ../grade-2-app            # report
    python add-reasoning-step.py --app ../grade-2-app --write

The 2026-09-11 validation found that of the four Maths builds only Grade 3
ever asks a child WHY: every Grade 3 lesson ends on grade-3-app/convince/'s
step, and the Grade 2 and Grade 4 reports both asked for "a 'How do you
know?' step (Grade 3's convince/ is the model)". This is that step, for any
build. The markup, the behaviour, the sticker and the spoken explanation are
Grade 3's - a child moving from Grade 2 to 3 to 4 meets one feature, not three.

WHAT IT ASKS. Cambridge's Thinking and Working Mathematically names
Convincing: "presenting evidence to justify or challenge a mathematical idea
or solution". A tap-to-answer deck cannot ask a child to write a
justification, so it asks them to RECOGNISE one - a claim that is true, and
three reasons for it, only one of which does the work. Each wrong reason is
either the misconception the lesson teaches against, or something perfectly
TRUE that explains nothing ("7 add 5 is 12" as the reason two odd numbers
ALWAYS make an even one). The second kind is the point of the step. It is an
approximation of the characteristic, and recorded as one.

THE CLAIMS ARE THE BUILD'S OWN, in reasoning_banks.py beside app.config.json:
    BANKS = { "<lesson file without .html>": [
        (claim, the reason that works, [two that do not], what makes the difference),
        ... ] }
At least five per lesson: the sticker is earned at four right, and the deck
reshuffles the bank when it runs out, so a child is never stuck.

WHERE IT GOES, and why nothing moves. Between the check and the sticker
shelf - the one place a slide can be added without moving any existing
index: every finish(i) refers to a slide before it, and the shelf carries no
index of its own. The step works out its own index from the DOM. Grade 2 is
routed and records progress by position, so this is the one place it can take
a new step: a learner's stored steps keep their meaning, and the lesson simply
has one more to finish. (A child who had finished a lesson meets one new step
- the same trade Grade 1's second steps made, which the owner accepted.)

Runs once on Grade 2 (hand-edited pages); Grade 4 runs it in build-all.sh
after every build, because its pages are generated. Idempotent: a page that
already has the step (id="clW") is left alone. Refuses a page whose anchors
do not match exactly once, or whose shelf would then repeat a face.
"""
import importlib.util
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402
from _emoji import stickers, repeated_faces  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
argv = sys.argv[1:]
WRITE = "--write" in argv
rest = [a for a in argv if a != "--write"]
if "--app" in rest:
    i = rest.index("--app")
    rest = rest[:i] + rest[i + 2:]
if rest:
    sys.exit("unrecognised argument: %s" % rest[0])
app = load(argv)

# Grade 3's words (grade-3-app/convince/banks.py EXPLAIN), unchanged: the idea
# is identical in every lesson and every grade, so the script is too
EXPLAIN = (
    '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
    '<s>Getting the right answer is only half of it.</s><s>Knowing why it is right is the other half.</s>'
    '</prosody></mstts:express-as><break time="330ms"/>'
    '<mstts:express-as style="friendly" styledegree="1.25">'
    '<s>Here is something that is true.</s><s>Underneath are three reasons somebody gave for it.</s>'
    '<s>Only one of them actually explains it.</s></mstts:express-as><break time="330ms"/>'
    '<mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%">'
    '<s>Watch for a reason that is true and still explains nothing.</s>'
    '<s>Both numbers are small can be perfectly true and tell you nothing about why the answer is what it is.</s>'
    '</prosody></mstts:express-as><break time="330ms"/>'
    '<mstts:express-as style="cheerful" styledegree="1.45">'
    '<s>Read all three, then pick the one that really does the work.</s></mstts:express-as>'
)

SLIDE = '''    <!-- how do you know -->
    <section class="slide" data-explain='%s' data-say="Only one of these three reasons really explains it. Which one?">
      <div class="slide-head"><span class="n">?</span><h2>How do you know?</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="sayW">Which reason really explains it?</span></div>
      <div class="stage">
        <p class="fb" id="clW" style="font-size:21px"></p>
        <div class="choices" id="chW"></div>
        <p class="fb" id="fbW"></p>
        <p class="score" id="scW"></p>
      </div>
    </section>

''' % EXPLAIN

JS = '''  /* ==================================================================
     CONVINCING - "presenting evidence to justify or challenge a
     mathematical idea or solution" (Cambridge TWM.04). See
     lesson-app-tools/add-reasoning-step.py: a true claim and three
     reasons, only one of which does the work. It works out its own slide
     index from the DOM, so it moved no other step.
     ================================================================== */
  (function () {
    const BANK = %s;
    const host = document.getElementById("clW");
    if (!host) return;
    ["fbW", "scW", "clW"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    let got = 0, asked = 0, order = shuffle(BANK), qi = 0, live = false;
    function paint() {
      if (qi >= order.length) { order = shuffle(BANK); qi = 0; }
      const it = order[qi];
      document.getElementById("clW").textContent = it[0];
      document.getElementById("sayW").textContent = it[0] + " Which reason really explains it?";
      document.getElementById("chW").innerHTML = shuffle([it[1]].concat(it[2]))
        .map((o) => '<button type="button" class="choice word" data-v="' + esc(o) + '">' + esc(o) + "</button>").join("");
      document.getElementById("fbW").className = "fb";
      document.getElementById("fbW").textContent = "";
      live = true;
    }
    document.getElementById("chW").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = order[qi];
      const ok = b.dataset.v === it[1];
      [...document.getElementById("chW").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.v === it[1]) x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      asked++; if (ok) got++;
      const fb = document.getElementById("fbW");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not that one. ") + it[3];
      say(ok ? cheer() : it[3]);
      document.getElementById("scW").textContent = got + " right out of " + asked + (got >= 4 ? " - sticker earned!" : "");
      if (got >= 4) finish(SLOT, "");
      qi++;
      setTimeout(paint, 3400);
    });
    paint();
  })();

'''

STICKER = '["\\ud83e\\udd14", "How do you know"]'
ANCHOR = "  show(0, false);"


def find_array_end(s, start_token):
    i = s.find(start_token)
    k = i + len(start_token)
    depth = 1
    while depth:
        c = s[k]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                break
        k += 1
    return i, k


def append_sticker(s):
    i, k = find_array_end(s, "const STICKERS = [")
    j = k
    while s[j - 1] in " \t\r\n":
        j -= 1
    # "],," is an elision: a HOLE that pushes this entry one index past its
    # slide, so its sticker never lights (grade-3-app/convince/build.py)
    sep = "" if s[j - 1] in "[," else ","
    return s[:j] + sep + " " + STICKER + s[j:], s[i:k].count('["')


def unhardcode_total(s, n):
    """Some shelves write their total as a literal; point them at the array."""
    i = s.find("function paintStickers")
    if i < 0:
        return s
    j = s.find('$("restart")', i)
    if j < 0:
        j = i + 900
    body = s[i:j]
    body = re.sub(r"done\.slice\(0, %d\)" % n, "done.slice(0, STICKERS.length)", body)
    body = re.sub(r"got === %d\b" % n, "got === STICKERS.length", body)
    body = re.sub(r'"All %d stickers' % n, '"All " + STICKERS.length + " stickers', body)
    body = re.sub(r'" of %d stickers' % n, '" of " + STICKERS.length + " stickers', body)
    return s[:i] + body + s[j:]


def load_banks():
    p = app.path("reasoning_banks.py")
    if not os.path.isfile(p):
        sys.exit("no reasoning_banks.py in %s" % app.root)
    spec = importlib.util.spec_from_file_location("reasoning_banks", p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.BANKS


def bank_problems(bank):
    out = []
    if len(bank) < 5:
        out.append("%d item(s) - five at least, the sticker needs four right" % len(bank))
    for n, it in enumerate(bank, 1):
        if len(it) != 4 or not isinstance(it[2], (list, tuple)) or len(it[2]) != 2:
            out.append("item %d is not (claim, reason, [two wrong reasons], note)" % n)
            continue
        claim, right, wrong, note = it
        if right in wrong or wrong[0] == wrong[1]:
            out.append("item %d repeats a reason" % n)
        for t in [claim, right, note] + list(wrong):
            if not t.strip() or not re.search(r"[.?!]$", t.strip()):
                out.append("item %d: %r does not end a sentence" % (n, t[:40]))
    return out


banks = load_banks()
stale = sorted(set(banks) - set(f[:-5] for _, f, _ in app.lessons))
done = skipped = refused = 0
for unit, f, title in app.lessons:
    name = f[:-5]
    s = app.read(f)
    if 'id="clW"' in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    bad = []
    if name not in banks:
        bad.append("no bank in reasoning_banks.py")
    else:
        bad += bank_problems(banks[name])
    if s.count(ANCHOR) != 1:
        bad.append("show(0, false) is there %d times" % s.count(ANCHOR))
    if s.count("const STICKERS = [") != 1:
        bad.append("not exactly one STICKERS array")
    if bad:
        print("  REFUSED  %s  %s" % (name, "; ".join(bad)))
        refused += 1
        continue
    last = s.rfind('<section class="slide"')
    line = s.rfind("\n", 0, last) + 1
    t = s[:line] + SLIDE + s[line:]
    t, n = append_sticker(t)
    t = unhardcode_total(t, n)
    rows = [[c, r, list(w), note] for (c, r, w, note) in banks[name]]
    t = t.replace(ANCHOR, JS % json.dumps(rows, ensure_ascii=False, indent=6) + ANCHOR, 1)
    shelf = stickers(t)
    if not shelf or repeated_faces(shelf):
        print("  REFUSED  %s  its shelf would repeat %s - give the other sticker a new face"
              % (name, " ".join(repeated_faces(shelf)) if shelf else "(unreadable)"))
        refused += 1
        continue
    if WRITE:
        app.write(f, t)
    print("  %s %s  (%d claims)" % ("wrote   " if WRITE else "would   ", name, len(banks[name])))
    done += 1

for k in stale:
    print("  REFUSED  a bank names no lesson: %s" % k)
print("\n  %s: %d given the step, %d already had it, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused + len(stale)))
sys.exit(1 if (refused or stale) else 0)
