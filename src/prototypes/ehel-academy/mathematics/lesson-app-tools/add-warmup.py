# -*- coding: utf-8 -*-
"""A warm-up at the head of every lesson: a recap of the last one, and one question.

    python add-warmup.py --app ../grade-2-app            # report
    python add-warmup.py --app ../grade-2-app --write

grade-1-app/add-warmup.py gave Grade 1 this on 2026-09-11, and the same day's
validation asked for it in the other three: Grade 2 ("a review or warm-up"),
Grade 3 ("a warm-up question per lesson") and Grade 4 ("a warm-up"). This is
that tool with the lessons read from app.config.json instead of a list, so it
runs on any build. The markup, the behaviour and the marker are Grade 1's,
byte for byte where they can be, so a warm-up looks and answers the same in
every grade - and a Grade 1 page, which already carries the marker, reads as
done rather than getting a second one.

THE WORDS ARE IN app.config.json, as each lesson's "warmUp":
    { "q": "Last lesson, you ... Warm up: ...?", "opts": [...], "a": ..., "why": "..." }
beside the lesson's title and at-home line, so the one description of a build
holds it too.

Everything Grade 1's docstring says still holds, and the three that matter:
  - it sits at the TOP OF STEP 1 and is NOT a step: no sticker, no dot, no
    score, so no finish() index moves - Grade 2 is routed and records progress
    by position, so this is the one place a question can be added to it freely;
  - its line is NOT a .say, so step 1's Explain button still explains step 1;
  - its key is checkable: `const WARM = [{ q, opts, a, why }]` is the shape
    check-answer-keys.py already reads.

Runs once on Grade 2 (hand-edited pages); Grades 3 and 4 run it in their
build-all.sh, after every build, because their pages are generated.
Guarded by the marker; every anchor must match exactly once or the page is
refused.
"""
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

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

MARK = "ehel-warmup"
HEAD = '<div class="slide-head"><span class="n">1</span>'
BOX = ('<div class="eh-warm" id="ehWarm">'
       '<p class="eh-warm-h">Warm up</p>'
       '<div class="eh-warm-say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button>'
       '<span class="eh-warm-q"></span></div>'
       '<div class="choices eh-warm-ch"></div>'
       '<p class="fb" role="status" aria-live="polite"></p>'
       '</div>\n      ')
WIRE = ('document.querySelectorAll(".speak").forEach((b) => b.addEventListener("click", '
        '() => say(b.parentElement.querySelector("span").textContent)));')


def js_for(q, opts, a, why):
    lit = lambda v: ('"%s"' % v) if isinstance(v, str) else str(v)
    return (WIRE + """

  /* ---- warm-up (areas 9 and 11, 2026-09-11) ---- """ + MARK + """
     A recap of the last lesson and one question about today's, at the head of
     step 1 - see lesson-app-tools/add-warmup.py. NOT a step: no sticker, no
     dot, no score. */
  const WARM = [{ q: """ + lit(q) + """, opts: [""" + ", ".join(lit(o) for o in opts) + """], a: """ + lit(a) + """, why: """ + lit(why) + """ }];
  (function () {
    const w = document.getElementById("ehWarm"); if (!w) return;
    const W = WARM[0], ch = w.querySelector(".eh-warm-ch"), fb = w.querySelector(".fb");
    w.querySelector(".eh-warm-q").textContent = W.q;
    ch.innerHTML = shuffle(W.opts.slice()).map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || b.disabled) return;
      const ok = String(b.dataset.v) === String(W.a);
      ch.querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (String(c.dataset.v) === String(W.a)) c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      const msg = (ok ? cheer() + " " : "Good try. ") + W.why;
      fb.className = "fb" + (ok ? " good" : ""); fb.textContent = msg; say(msg);
    });
  })();""")


STYLE = """
<style>/* """ + MARK + """ - see lesson-app-tools/add-warmup.py */
  .eh-warm { margin: 0 0 18px; padding: 14px 16px 16px; border-radius: 18px;
    border: 2px dashed var(--teal, #2BB3A6); }
  .eh-warm-h { margin: 0 0 10px; font-family: "Inter", "Segoe UI", sans-serif;
    font-weight: 700; font-size: 14px; letter-spacing: .06em; text-transform: uppercase;
    color: var(--teal, #2BB3A6); }
  /* mirrors .say, under its own class so Explain never finds it - see the tool */
  .eh-warm-say { display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    border-radius: 16px; background: var(--teal-soft, #DDF3F0); font-size: 21px; }
  .eh-warm-say button { flex: 0 0 auto; width: 52px; height: 52px; border-radius: 50%;
    border: 0; background: var(--teal, #2BB3A6); color: #06231F; font-size: 24px;
    display: grid; place-items: center; cursor: pointer; }
  .eh-warm-say button:active { transform: scale(0.94); }
  .eh-warm-ch { margin-top: 12px; }
</style>
"""


def problems_of(name, w):
    out = []
    for k in ("q", "opts", "a", "why"):
        if k not in w:
            out.append("warmUp has no %r" % k)
    if out:
        return out
    q, opts, a, why = w["q"], w["opts"], w["a"], w["why"]
    if a not in opts:
        out.append("the answer is not one of the options")
    if len(set(map(str, opts))) != len(opts):
        out.append("an option is repeated")
    if len(opts) < 2:
        out.append("fewer than two options")
    for t in (q, why) + tuple(map(str, opts)):
        # a JS string literal written with double quotes, and an option that
        # becomes an attribute value: none of these may appear in it
        if '"' in t or "\\" in t or "<" in t or "\n" in t:
            out.append("unsafe text %r" % t[:50])
    return out


done = skipped = refused = 0
for unit, f, title in app.lessons:
    name = f[:-5]
    entry = app.cfg["lessons"][unit - 1]
    if "warmUp" not in entry:
        print("  REFUSED  %s  no warmUp in app.config.json" % name)
        refused += 1
        continue
    bad = problems_of(name, entry["warmUp"])
    s = app.read(f)
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    bad += ["not exactly once: %s" % n for n, x in (("slide 1 heading", HEAD), (".speak wiring", WIRE)) if s.count(x) != 1]
    if not re.search(r"</script>\s*$", s):
        bad.append("page does not end on </script>")
    if bad:
        print("  REFUSED  %s  %s" % (name, "; ".join(bad)))
        refused += 1
        continue
    w = entry["warmUp"]
    s = s.replace(HEAD, BOX + HEAD, 1)
    s = s.replace(WIRE, js_for(w["q"], w["opts"], w["a"], w["why"]), 1)
    s = s.rstrip() + "\n" + STYLE
    if WRITE:
        app.write(f, s)
    print("  %s %s" % ("wrote   " if WRITE else "would   ", name))
    done += 1

print("\n  %s: %d given a warm-up, %d already done, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused))
sys.exit(1 if refused else 0)
