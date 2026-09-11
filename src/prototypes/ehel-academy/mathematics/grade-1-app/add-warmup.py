# -*- coding: utf-8 -*-
"""A warm-up at the head of every lesson: a recap of the last one, and one question.

    python add-warmup.py            # report
    python add-warmup.py --write

TWO GAPS FROM THE 2026-09-11 RE-VALIDATION, closed together because they are one
moment in a lesson:
  area 9   no lesson opened with a recap of the one before it;
  area 11  there was no opening check - nothing asked what a child ALREADY knew
           before the lesson started teaching it.
So each lesson now opens with a short spoken line - what the last lesson did -
and one question about today's topic. A right answer is praised; a wrong one
gets "Good try." and the reason, never a red panel: it is a diagnostic, not a
test, and the lesson that follows is where the child learns it.

WHERE IT SITS, and three things it deliberately is NOT:
  - it is at the TOP OF STEP 1, above the step's number and heading, so it is
    what a child meets on opening the lesson and it goes away when they move on;
  - it is NOT a step. It earns no sticker, moves no dot and scores nothing, so no
    finish() index moves - inserting a real slide would renumber every finish(),
    the sticker shelf and explorationSteps in app.config.json;
  - its line does NOT use the .say class. The Explain button finds the step's own
    words with `host.querySelector(".intro, .say > span, ...")`, the FIRST .say in
    the slide - so a warm-up line carrying .say above the step would have made
    step 1's Explain read the warm-up instead of the step. .eh-warm-say mirrors the
    .say rules instead. The 🔊 still works: its handler reads the first <span> in
    the button's parent, whatever that parent's class.

ITS KEY IS CHECKABLE. The question lives in `const WARM = [{ q, opts, a, why }]`,
the shape every check item has, so check-answer-keys.py reads it where it can
compute it - a warm-up with a wrong key would otherwise be the one answer in the
build that nothing checks.

Guarded by a marker; every anchor must match exactly once or the file is refused.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-warmup"

# lesson -> (the spoken line: recap + question, options, answer, reason)
WARM = {
    "counting-to-twenty": (
        "Let's warm up. How many fingers are on one hand?",
        [5, 4, 10], 5,
        "One hand has 5 fingers. Count them: 1, 2, 3, 4, 5."),
    "adding-and-taking-away": (
        "Last lesson, you counted to 20. Warm up: you have 3 apples and get 1 more. How many apples now?",
        [4, 3, 5], 4,
        "3 and 1 more make 4. Today you will add and take away."),
    "halves-and-wholes": (
        "Last lesson, you added and took away. Warm up: a cake is cut into 2 parts the same size. What is each part called?",
        ["a half", "a whole", "a double"], "a half",
        "Two parts that are the same size are halves. Today you will find halves."),
    "what-comes-next": (
        "Last lesson, you found halves. Warm up: red, blue, red, blue. What comes next?",
        ["red", "blue", "green"], "red",
        "Red and blue take turns, so red comes next. Today you will find patterns."),
    "shapes-and-sizes": (
        "Last lesson, you found patterns. Warm up: which shape has 3 sides?",
        ["triangle", "square", "circle"], "triangle",
        "A triangle has 3 straight sides. Today you will look at shapes and sizes."),
    "days-months-and-clocks": (
        "Last lesson, you looked at shapes and sizes. Warm up: how many days are in a week?",
        [7, 5, 12], 7,
        "There are 7 days in a week. Today you will learn the days, the months and the clock."),
    "asking-and-sorting": (
        "Last lesson, you learned the days, the months and the clock. Warm up: which one is a fruit?",
        ["mango", "spoon", "shoe"], "mango",
        "A mango is a fruit. Today you will sort things into groups and ask questions."),
}
for k, (q, opts, a, why) in WARM.items():
    assert a in opts, "%s: the answer must be one of the options" % k
    assert len(set(map(str, opts))) == len(opts), "%s: repeated option" % k
    for t in (q, why) + tuple(map(str, opts)):
        assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe text %r" % (k, t)

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
     step 1 - see add-warmup.py. NOT a step: no sticker, no dot, no score. */
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
<style>/* """ + MARK + """ - see add-warmup.py */
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

cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))
done = skipped = refused = 0
for l in cfg["lessons"]:
    name = l["file"][:-5]
    if name not in WARM:
        print("  REFUSED  %s  no warm-up written for it" % name)
        refused += 1
        continue
    p = os.path.join(G, l["file"])
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    bad = [n for n, x in (("slide 1 heading", HEAD), (".speak wiring", WIRE)) if s.count(x) != 1]
    if not re.search(r"</script>\s*$", s):
        bad.append("page does not end on </script>")
    if bad:
        print("  REFUSED  %s  not exactly once: %s" % (name, ", ".join(bad)))
        refused += 1
        continue
    s = s.replace(HEAD, BOX + HEAD, 1)
    s = s.replace(WIRE, js_for(*WARM[name]), 1)
    s = s.rstrip() + "\n" + STYLE
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %s" % ("wrote   " if WRITE else "would   ", name))
    done += 1

print("\n  %s: %d given a warm-up, %d already done, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused))
sys.exit(1 if refused else 0)
