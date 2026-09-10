# -*- coding: utf-8 -*-
"""Build a grade's Art & Design hub - the page a learner lands on.

One card per lesson, in the order app.config.json lists them. A card's step
count comes from the BUILT page and its blurb, objectives and answer keys from
the content module, so the hub cannot promise a step the page does not have. A
lesson whose page is not built is drawn as "Coming soon" with no link - a card
that looks like a link and goes nowhere is worse than one that says it is not
ready.

THE TIME ESTIMATE on a card is derived from the kinds of step the lesson has,
at the minutes per kind in MINUTES below - a demo is a minute and a half of
pressing Next and listening, a mark-making step is five minutes of drawing. An
estimate is a claim; it is here so a teacher can plan a session, not so a
child is timed.

THE GROWN-UPS SECTION at the foot of the hub is the teacher-and-parent
support this build otherwise lacks: per lesson, the Cambridge objectives it
reaches (text read from the framework file, not retyped), the do-it-for-real
version of each activity to make at home, and the answer keys - and for the
steps that have no key because a child's own drawing, feeling or idea is the
answer, it says so, because a grown-up who expects a key will otherwise think
the page is broken.

    python ../lesson-kit/build-hub.py --app .     # after build-lessons.py
"""
import importlib.util
import io
import json
import os
import re
import sys

from _rules import mix, tone_order, pattern_period, fits, compare, comment_fits, refinements, paint_texture, journal_fallback
from _shell import expand, finder_words

KIT = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(KIT, "lib")
REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-art-and-design-0067.json")
APP = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
if not os.path.isfile(os.path.join(APP, "app.config.json")):
    sys.exit("REFUSED: no app.config.json in %s. Run from a grade directory or pass --app <dir>." % APP)
CONTENT = os.path.join(APP, "content")

# minutes a six-year-old spends on a step of each kind, including listening
MINUTES = {"demo": 1.5, "explore": 2, "context": 2.5, "sort": 3, "order": 2, "tone": 2.5,
           "source": 3, "mix": 5, "marks": 5, "pattern": 4, "choose": 3, "experiment": 4,
           "compare": 3, "comment": 3, "refine": 4, "journal": 3,
           "questions": 3, "quiz": 4,
           # the unit shell (_shell.py); home projects are done off the screen and cost the page nothing
           "overview": 1, "lecture": 4, "words": 4, "games": 6, "home": 1, "world": 0.5, "resources": 1}

# the do-it-for-real version of each kind of step, for a grown-up to run at home
TOGETHER = {
    "mix": "Put out red, yellow and blue paint and a little white. Before each mix, ask: what do you think it will make? Mix it, look, and say what happened.",
    "marks": "Give the child a pencil, a brush, a sponge and a piece of chalk. Ask for a straight line, a wavy line, a zigzag and lots of dots with each one. Which tool made the thickest mark?",
    "tone": "Mix a little black or white into one colour, four times, and paint four patches. Cut them out and put them in order from light to dark.",
    "pattern": "Make a pattern with things from the kitchen: spoon, fork, spoon, fork. Ask what comes next. Then let the child make one for you to continue.",
    "choose": "Put out five scraps: sandpaper, cotton wool, foil, bubble wrap, felt. Say what you want to make (a rough trunk, a fluffy cloud) and ask which scrap would work, and why.",
    "experiment": "Put a spoon of paint in four cups. Stir rice into one, flour into one, sugar into one, water into one. Predict first, then look and touch.",
    "compare": "Put two pictures side by side (a book page and a photo will do). Ask: what do BOTH have? What does only one have?",
    "comment": "Look at a drawing the child did not make. Ask them to say one kind thing about it that is really there in the picture.",
    "refine": "Look at something the child made. Ask: if you made it again, what one thing would you change? Then, if you can, change it together.",
    "journal": "Keep a scrapbook. Stick in what was made this week, and ask: what did you make first? What would you do differently next time?",
    "source": "Find a picture of art from another country or from long ago (a library book or a museum website). Find three things in it and say what the artist did.",
    "sort": "Sort the pebbles, the buttons or the leaves: by colour, then by rough and smooth, then by big and small. Say why each one goes where it goes.",
}


def load_json(p):
    return json.load(io.open(p, encoding="utf-8"))


def text(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(html))).strip()


def lesson_module(n):
    path = os.path.join(CONTENT, "lesson-%d.py" % n)
    if not os.path.isfile(path):
        return None
    spec = importlib.util.spec_from_file_location("lesson_%d" % n, path)
    mod = importlib.util.module_from_spec(spec)
    if KIT not in sys.path:
        sys.path.insert(0, KIT)
    spec.loader.exec_module(mod)
    return mod.LESSON


def minutes_of(lesson):
    return int(5 * round(sum(MINUTES.get(s["kind"], 2) for s in lesson["steps"]) / 5.0))


CARD = """      <%(tag)s class="card%(cls)s"%(href)s>
        <span class="cardno">Lesson %(n)d</span>
        <h2>%(title)s</h2>
        <p>%(blurb)s</p>
        <span class="cardfoot"><span class="meta">%(meta)s</span>%(cta)s</span>
      </%(tag)s>
"""

SHIELD = ('<svg viewBox="0 0 24 26" aria-hidden="true"><path d="M12 1.5 21.5 5v8.5c0 5.4-4 9.3-9.5 11C6.5 22.8 2.5 18.9 2.5 13.5V5z" '
          'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>'
          '<path d="M12 7.2l1.5 3.1 3.4.5-2.4 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.4-2.4 3.4-.5z" fill="currentColor"></path></svg>')

PAGE = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(gradeLabel)s Art &amp; Design</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s
  /* ---- the hub ---- */
  .hubhead { padding: 26px 4px 18px; }
  .hubhead h1 { font-size: clamp(34px, 7vw, 54px); }
  .hubhead h1 em { font-style: normal; color: var(--teal); }
  .hubhead p { color: var(--muted); max-width: 46ch; margin-top: 10px; font-size: 19px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
  .card { display: flex; flex-direction: column; gap: 10px; padding: 20px;
    border-radius: 22px; border: 1px solid var(--line); background: rgba(20, 43, 62, 0.88);
    box-shadow: var(--shadow); color: var(--ink); text-decoration: none; }
  a.card:hover, a.card:focus-visible { border-color: var(--teal); }
  .card h2 { font-size: 25px; }
  .card p { color: var(--muted); font-size: 16.5px; }
  .cardno { font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--teal); }
  .cardfoot { margin-top: auto; padding-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .meta { color: var(--muted); font-size: 13.5px; font-weight: 700; }
  .go { flex: 0 0 auto; border-radius: 999px; background: var(--gold); color: var(--accent-ink);
    font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 16px; padding: 9px 20px; }
  .soon { flex: 0 0 auto; color: var(--muted); font-size: 13.5px; font-weight: 700; }
  .card.locked { opacity: 0.62; }
  .hubfoot { color: var(--muted); font-size: 14.5px; padding: 26px 4px 0; max-width: 62ch; }
  .strands, .grownups { padding: 30px 4px 0; }
  .strands h2, .grownups h2 { font-size: 26px; margin-bottom: 10px; }
  .strand { display: grid; grid-template-columns: 150px 1fr; gap: 12px; align-items: baseline; padding: 10px 14px;
    border-radius: 14px; border: 1px solid var(--line); background: var(--card); margin-bottom: 8px; font-size: 16px; }
  .strand b { color: var(--teal); font-family: "Inter", "Segoe UI", sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; }
  @media (max-width: 560px) { .strand { grid-template-columns: 1fr; gap: 2px; } }
  .grownups > p { color: var(--muted); font-size: 16px; max-width: 64ch; margin-bottom: 14px; }
  .gu { border: 1px solid var(--line); border-radius: 16px; background: var(--card); margin-bottom: 10px; }
  .gu summary { cursor: pointer; padding: 14px 16px; font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 18px; }
  .gu summary small { color: var(--muted); font-weight: 700; font-size: 13.5px; margin-left: 8px; }
  .gu .body { padding: 0 16px 16px; font-size: 15.5px; display: flex; flex-direction: column; gap: 10px; }
  .gu h3 { font-size: 13px; color: var(--teal); text-transform: uppercase; letter-spacing: .07em; margin: 8px 0 2px; font-family: "Inter", "Segoe UI", sans-serif; }
  .gu ul, .gu ol { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
  .gu code { font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 12.5px; color: var(--teal); }
  .gu .key { color: var(--muted); }
  .gu .key b { color: var(--ink); }
  @media print {
    .eh-bar1, .cards, .strands, .hubhead p { display: none; }
    body::before { display: none; } html, body { background: #fff; }
    .gu { break-inside: avoid; border-color: #999; } .gu summary { list-style: none; }
    .gu .body { display: flex !important; } details:not([open]) .body { display: flex !important; }
  }

  /* ---- the header bar, the same one the lesson pages carry ---- */
  .eh-bar1 { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 12px;
    background: var(--card); border-bottom: 1px solid var(--line); padding: 8px 16px; }
  .eh-brand { display: flex; align-items: center; gap: 10px; color: var(--ink); flex: 0 0 auto; }
  .eh-brand svg { width: 30px; height: 32px; color: var(--teal); display: block; }
  .eh-brandtext { display: flex; flex-direction: column; line-height: 1.15; }
  .eh-brandtext b { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
  .eh-brandtext i { font-style: normal; font-size: 12.5px; font-weight: 700; color: var(--teal); }
  .eh-prog { display: flex; align-items: center; gap: 9px; background: var(--cell); border: 1px solid var(--line);
    border-radius: 999px; padding: 5px 14px 5px 6px; flex: 1 1 auto; max-width: 420px; min-width: 0; }
  .eh-pct { background: var(--teal); color: #06231F; font-weight: 800; font-size: 13px; border-radius: 999px; padding: 4px 9px; }
  .eh-progtext { font-size: 13.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
  .eh-track { flex: 1 1 auto; height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; min-width: 40px; }
  .eh-track i { display: block; height: 100%%; width: 0; background: var(--teal); border-radius: 999px; transition: width .3s ease; }
  .eh-b1right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .eh-picker { font: inherit; font-size: 14px; font-weight: 700; color: var(--ink); background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; padding: 8px 10px; max-width: 200px; }
  .eh-round { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; border: none;
    background: var(--teal); color: #06231F; font: inherit; font-size: 15px; font-weight: 700;
    padding: 9px 13px; cursor: pointer; text-decoration: none; flex: 0 0 auto; }
  @media (max-width: 720px) { .eh-progtext, .eh-brandtext { display: none; } .eh-picker { max-width: 130px; } }
</style>

<header class="eh-bar1">
  <a class="eh-round" id="ehBack" href="#" aria-label="Back" hidden>&larr;</a>
  <div class="eh-brand">%(shield)s<span class="eh-brandtext"><b>Ehel Academy</b><i>Primary Art &amp; Design</i></span></div>
  <div class="eh-prog" id="ehProg">
    <span class="eh-pct" id="ehPct">0%%</span>
    <span class="eh-progtext">Course progress</span>
    <span class="eh-track"><i id="ehFill"></i></span>
  </div>
  <div class="eh-b1right">
    <select class="eh-picker" id="ehPicker" aria-label="Choose a lesson">%(options)s</select>
  </div>
</header>

<div class="wrap">
  <header class="hubhead">
    <p class="eyebrow">Ehel Academy &middot; Art &amp; Design</p>
    <h1>%(gradeLabel)s <em>Art &amp; Design</em></h1>
    <p>%(nlessons)s lessons, in the order they are meant to be done. Every one is about making and looking: paints to mix, marks to make, patterns to build, art from far away to look at, and a journal to keep. About %(total)d minutes in all, one lesson a week - and a screen cannot be paint, so every lesson sends you to make something real at home.</p>
  </header>

  <main class="cards">
%(cards)s  </main>

  <section class="strands">
    <h2>What Stage %(stage)d Art &amp; Design covers</h2>
%(strands)s  </section>

  <section class="grownups" id="grown-ups">
    <h2>For teachers and parents</h2>
    <p>What each lesson teaches, in Cambridge's own words; the do-it-for-real version of each activity to make at home; and the answer keys. Where a step has no key, because the child's own drawing, feeling or idea is the answer, it says so. Open a lesson to read it, or print this page for the lot.</p>
%(grownups)s  </section>

  <p class="hubfoot">Built to Cambridge Primary Art &amp; Design 0067, Stage %(stage)d &mdash; all %(ncodes)d learning objectives across the four strands. Cambridge uses the same ten objectives from Stage 1 to Stage 6; what a Stage %(stage)d learner is expected to show is the framework's own progression text. The stickers are earned, not given.</p>
</div>

<script>
/* ---- the header bar: how far through the course, and the way out ----
   Everything here is answered by the launch URL and by the progress document
   the LESSONS write. This page stores nothing of its own. */
(function () {
  var COURSE = "%(course)s";
  var STEPS  = %(steps)s;     /* lesson id -> slides-1, the lesson's own denominator */
  var FILES  = %(files)s;     /* lesson id -> the page that teaches it */
  var q = new URLSearchParams(location.search);
  var doc = null;
  try {
    doc = JSON.parse(localStorage.getItem(
      "ehel-progress:" + COURSE + ":" + (q.get("studentid") || "local")) || "null");
  } catch (e) { doc = null; }
  var unitOf = function (u) { return (doc && doc.units && doc.units[u]) || null; };
  var done = 0, total = 0;
  Object.keys(STEPS).forEach(function (u) {
    var s = unitOf(u);
    total += STEPS[u];
    done += Math.min((s && s.sectionsDone && s.sectionsDone.length) || 0, STEPS[u]);
  });
  var pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  var pctEl = document.getElementById("ehPct");
  if (pctEl) pctEl.textContent = pct + "%%";
  var fill = document.getElementById("ehFill");
  if (fill) fill.style.width = pct + "%%";
  var prog = document.getElementById("ehProg");
  if (prog) prog.title = done + " of " + total + " steps done across the course";

  /* the picker jumps to a lesson, carrying the launch parameters */
  var picker = document.getElementById("ehPicker");
  if (picker) picker.addEventListener("change", function () {
    if (!picker.value) return;
    var p = new URLSearchParams(location.search);
    p.set("from", "%(from)s");
    location.href = picker.value + "?" + p.toString();
  });

  /* THE WAY OUT, drawn only when the launch gave us one. */
  var exit = q.get("exitUrl");
  var back = document.getElementById("ehBack");
  if (back && exit) { back.setAttribute("href", exit); back.hidden = false; }
})();
</script>
"""


def keys_for(s):
    """The answer key of one step, as list items, or [] where a step has none."""
    d = s["data"]
    k, out = s["kind"], []
    ok_text = lambda opts: next(o["t"] for o in opts if o.get("ok"))   # noqa: E731
    if k in ("quiz", "questions"):
        out.append("<li><b>%s</b><ol>%s</ol></li>" % (text(s["title"]), "".join(
            "<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(plain(it["ask"])), text(ok_text(it["opts"]))) for it in d["items"])))
    elif k == "sort":
        bins = {b["id"]: b["label"] for b in d["bins"]}
        groups = {}
        for it in d["items"]:
            groups.setdefault(bins[it["bin"]], []).append(it["label"])
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), "; ".join(
            "<b>%s</b>: %s" % (text(g), text(", ".join(v))) for g, v in groups.items())))
    elif k == "order":
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), text(" &rarr; ".join(it["label"] for it in d["items"]))))
    elif k == "tone":
        by = {sw["id"]: sw["label"] for sw in d["swatches"]}
        out.append("<li><b>%s</b> <span class=\"key\">light to dark, by the colours' own lightness: <b>%s</b></span></li>" % (text(s["title"]), text(" &rarr; ".join(by[i] for i in tone_order(d["swatches"])))))
    elif k == "source":
        spots = {sp["id"]: sp for sp in d["spots"]}
        bits = ["find: " + "; ".join(sp["fact"] for sp in d["spots"])]
        if d.get("then"):
            keyed = next(o for o in d["then"]["opts"] if o.get("spot"))
            bits.append("%s &rarr; <b>%s</b>" % (text(plain(d["then"]["ask"])), text(keyed["t"])))
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), ". ".join(bits)))
    elif k == "mix":
        out.append("<li><b>%s</b><ul>%s</ul><span class=\"key\">then the child mixes any two they like: no key, the bowl shows what they made</span></li>" % (text(s["title"]), "".join(
            "<li>%s + %s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["a"]), text(rd["b"]), text(mix(rd["a"], rd["b"]))) for rd in d["rounds"])))
    elif k == "marks":
        out.append("<li><b>%s</b> <span class=\"key\">the page judges the stroke itself: %s. Then a free drawing: no key</span></li>" % (
            text(s["title"]), text("; ".join("%s with the %s" % (rd["made"], rd["tool"]) for rd in d["rounds"]))))
    elif k == "pattern":
        tiles = {t["id"]: t["label"] for t in d["tiles"]}
        items = []
        for rd in d["rounds"]:
            p = pattern_period(rd["seq"])
            items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["ask"]), text(", ".join(tiles[rd["seq"][(rd["show"] + j) % p]] for j in range(rd["ask_n"])))))
        out.append("<li><b>%s</b><ul>%s</ul><span class=\"key\">then the child's own pattern: any row that repeats a unit of two or three tiles counts</span></li>" % (text(s["title"]), "".join(items)))
    elif k == "choose":
        items = []
        for rd in d["rounds"]:
            ok = fits(d["materials"], rd["needs"])
            items.append("<li>%s (needs %s) <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["purpose"]), text(rd["needs"]), text(", ".join(m["label"] for m in d["materials"] if m["id"] in ok))))
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(items)))
    elif k == "experiment":
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(
            "<li>add %s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["additive"]), text(paint_texture(rd["additive"]))) for rd in d["rounds"])))
    elif k == "compare":
        both = [c["t"] for c in d["cards"] if compare(d["a"]["features"], d["b"]["features"], c["about"]) == "both"]
        one = [c["t"] for c in d["cards"] if compare(d["a"]["features"], d["b"]["features"], c["about"]) == "one"]
        out.append("<li><b>%s</b> <span class=\"key\">both have: <b>%s</b>; only one has: <b>%s</b>. Which they like more: no key</span></li>" % (text(s["title"]), text(", ".join(both)), text(", ".join(one))))
    elif k == "comment":
        works = {w["id"]: w for w in d["works"]}
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(
            "<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(works[rd["work"]]["title"]), text(next(o["t"] for o in rd["opts"] if comment_fits(o["about"], works[rd["work"]]["features"])))) for rd in d["rounds"])))
    elif k == "refine":
        items = []
        for rd in d["rounds"]:
            good = refinements(rd["changes"], rd["needs"])
            items.append("<li>%s: %s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["piece"]["title"]), text(rd["piece"]["problem"]), text(", ".join(c["t"] for c in rd["changes"] if c["id"] in good))))
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(items)))
    elif k == "journal":
        out.append("<li><b>%s</b> <span class=\"key\">reads the page's own record of what the child made - the order they made them in IS the key; what they would change has none. If the making steps were skipped: %s</span></li>" % (
            text(s["title"]), text("; ".join(x["text"] for x in d["fallback"]))))
    elif k in ("explore", "context") and d.get("then"):
        out.append("<li><b>%s</b> <span class=\"key\">%s &rarr; <b>%s</b></span></li>" % (text(s["title"]), text(plain(d["then"]["ask"])), text(ok_text(d["then"]["opts"]))))
    return out


def grownups_for(n, lesson, codes, minutes, steps, stage):
    """One <details> per lesson: objectives, steps, the do-it-for-real versions, the keys."""
    reached = []
    for s in lesson["steps"]:
        for c in s["objectives"]:
            if c not in reached:
                reached.append(c)
    objectives = "".join("<li><code>%s</code> %s</li>" % (text(c), text(codes.get(c, ""))) for c in reached)
    steplist = "".join("<li>%s <span class=\"key\">&middot; %s</span></li>" % (text(s["title"]), text(plain(s["ask"]))) for s in lesson["steps"])
    home = []
    seen = set()
    for s in lesson["steps"]:
        if s["kind"] in TOGETHER and s["kind"] not in seen:
            seen.add(s["kind"])
            home.append("<li><b>%s.</b> %s</li>" % (text(s["title"]), text(TOGETHER[s["kind"]])))
    for h in lesson.get("home") or []:
        home.append("<li><b>%s.</b> You need: %s. %s Look for: %s</li>" % (
            text(h["title"]), text(h["materials"]), text(" ".join(h["steps"])), text(h["look"])))
    keys = []
    for s in lesson["steps"]:
        keys.extend(keys_for(s))
    return (
        '    <details class="gu"><summary>Lesson %d: %s<small>%d steps &middot; about %d minutes &middot; %d objectives</small></summary>\n'
        '      <div class="body">\n'
        '        <h3>What it teaches (Cambridge Primary Art &amp; Design 0067, Stage %d)</h3><ul>%s</ul>\n'
        '        <h3>The steps</h3><ol>%s</ol>\n'
        '%s'
        '        <h3>Answer keys</h3><ul>%s</ul>\n'
        '      </div>\n    </details>\n'
        % (n, text(lesson["title"]), steps, minutes, len(reached), stage, objectives, steplist,
           ('        <h3>Make it for real</h3><ul>%s</ul>\n' % "".join(home)) if home else "",
           "".join(keys)))


def fill_for_hub(steps, modules_all):
    """The same derived fields build-lessons.py fills, so the keys read here
    describe the page that ships: a tone ladder's order, a journal's record."""
    for k, s in enumerate(steps):
        d = s["data"]
        if s["kind"] == "tone" and not d.get("items"):
            by = {sw["id"]: sw for sw in d["swatches"]}
            d["items"] = [{"id": i, "label": by[i]["label"]} for i in (tone_order(d["swatches"]) or [])]
        if s["kind"] == "journal" and not d.get("fallback"):
            if d.get("scope") == "course":
                d["fallback"] = [dict(en, lesson=m) for m, les in modules_all if les for en in journal_fallback(les["steps"])]
            else:
                d["fallback"] = journal_fallback(steps[:k])


def main():
    cfg = load_json(os.path.join(APP, "app.config.json"))
    stage = int(cfg["stage"])
    fw = load_json(FRAMEWORK) if os.path.isfile(FRAMEWORK) else {"objectivesByStage": {}}
    codes = {o["code"]: o["text"] for o in fw["objectivesByStage"].get(str(stage), [])}
    strands = cfg.get("hubStrands") or []
    prefix = cfg.get("progressUnitPrefix", "l")
    cards, steps, files, options, grownups = "", {}, {}, "", ""
    live, total_minutes = 0, 0
    # The shell steps (_shell.py) wrap every lesson, so the hub counts the
    # same steps the page draws; the word finder needs every lesson's words.
    modules = {n: lesson_module(n) for n, _ in enumerate(cfg["lessons"], 1)}
    finder = finder_words([(n, l["file"], modules[n]) for n, l in enumerate(cfg["lessons"], 1) if modules[n]])
    for n, l in enumerate(cfg["lessons"], 1):
        f = l["file"]
        uid = "%s%02d" % (prefix, n)
        here = os.path.isfile(os.path.join(APP, f))
        lesson = modules[n]
        if lesson:
            expanded = expand(n, lesson, codes, finder, cfg)
            fill_for_hub(expanded, sorted(modules.items()))
            lesson = dict(lesson, steps=expanded)
        if here and lesson:
            live += 1
            page = io.open(os.path.join(APP, f), encoding="utf-8").read()
            count = len(re.findall(r'<section class="slide"', page)) - 1
            minutes = minutes_of(lesson)
            total_minutes += minutes
            steps[uid] = count
            files[uid] = f
            meta = "%d steps &middot; about %d min &middot; stickers" % (count, minutes)
            cta = '<span class="go">Start</span>'
            tag, href, cls = "a", ' href="%s?from=%s"' % (f, cfg["fromParam"]), ""
            options += '<option value="%s">%s</option>' % (f, text(l["title"]))
            grownups += grownups_for(n, lesson, codes, minutes, count, stage)
        else:
            meta, cta = "", '<span class="soon">Coming soon</span>'
            tag, href, cls = "div", "", " locked"
        cards += CARD % {"tag": tag, "href": href, "cls": cls, "n": n, "title": text(l["title"]),
                         "blurb": text((lesson or {}).get("blurb", "")), "meta": meta, "cta": cta}
    css = io.open(os.path.join(LIB, "lesson.css"), encoding="utf-8").read()
    strands_html = "".join('    <div class="strand"><b>%s</b><span>%s</span></div>\n' % (text(a), text(b)) for a, b in strands)
    WORDS = {6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve"}
    page = PAGE % {
        "css": css, "cards": cards, "shield": SHIELD, "strands": strands_html, "ncodes": len(codes),
        "grownups": grownups, "total": total_minutes, "stage": stage,
        "gradeLabel": text(cfg["gradeLabel"]), "nlessons": WORDS.get(len(cfg["lessons"]), str(len(cfg["lessons"]))),
        "course": cfg["courseKey"], "steps": json.dumps(steps), "files": json.dumps(files),
        "from": cfg["fromParam"], "options": '<option value="" selected>Jump to a lesson…</option>' + options,
    }
    io.open(os.path.join(APP, cfg["hub"]), "w", encoding="utf-8", newline="").write(page)
    print("\n  ok   %s  -  %d of %d lessons live, about %d minutes of lessons\n" % (cfg["hub"], live, len(cfg["lessons"]), total_minutes))


main()
