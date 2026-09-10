# -*- coding: utf-8 -*-
"""Build a grade's Science hub - the page a learner lands on.

One card per lesson, in the order app.config.json lists them. A
card's step count comes from the BUILT page and its blurb, objectives and
answer keys from the content module, so the hub cannot promise a step the page
does not have. A lesson whose page is not built is drawn as "Coming soon" with
no link - a card that looks like a link and goes nowhere is worse than one
that says it is not ready.

THE TIME ESTIMATE on a card is derived from the kinds of step the lesson has,
at the minutes per kind in MINUTES below - a demo is a minute and a half of
pressing Next and listening, a predict-for-each is five minutes of eight
predictions and eight drops. Measured against the auto-driver's forced waits
(two to four minutes of pure animation per lesson) plus a six-year-old's
reading and listening, and rounded to five. An estimate is a claim; it is
here so a teacher can plan a session, not so a child is timed.

THE GROWN-UPS SECTION at the foot of the hub is the teacher-and-parent
support this build otherwise lacks: per lesson, the Cambridge objectives it
reaches (text read from the framework file, not retyped), the experiment to
do for real with things from home, and the answer keys. It rides inside the
hub because deploy.mjs ships the hub and the lessons and nothing else, and a
second page would need the shared deploy tool taught about it.

    python ../lesson-kit/build-hub.py --app .     # after build-lessons.py
"""
import importlib.util
import io
import json
import os
import re
import sys

KIT = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(KIT, "lib")
REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-science-0097.json")
APP = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
if not os.path.isfile(os.path.join(APP, "app.config.json")):
    sys.exit("REFUSED: no app.config.json in %s. Run from a grade directory or pass --app <dir>." % APP)
CONTENT = os.path.join(APP, "content")

# minutes a six-year-old spends on a step of each kind, including listening
MINUTES = {"demo": 1.5, "explore": 2, "context": 2.5, "sort": 3, "experiment": 4, "predictEach": 5,
           "record": 2, "measure": 2.5, "label": 3, "tester": 3, "ask": 1.5, "questions": 3, "quiz": 4}

# the real-world version of each experiment, for a grown-up to run at home
AT_HOME = {
    "plantWater": "Two small plants or two cuttings in cups. Water one every day and not the other. Look every day for a week and talk about what changes.",
    "plantLight": "Two small plants. Put one on a sunny windowsill and one inside a cupboard, and water both. Look after a few days: the one in the dark goes pale.",
    "pushBall": "A ball on a smooth floor and some tape marks a step apart. Push gently, then hard, and count how many marks the ball passes each time.",
    "floatSink": "A bowl of water and eight things from the kitchen (an apple, a stone, a coin, a cork, a leaf, a spoon). Predict out loud before each one goes in.",
    "magnet": "A fridge magnet and a tray of things (paperclip, wooden spoon, plastic cup, key, kitchen foil, nail). Predict, then test. Keep the magnet away from phones and cards.",
    "soundFar": "One person rings a bell or taps a spoon on a cup while the other walks away, one step at a time, saying loud, medium or quiet.",
    "shapeChange": "A ball of play dough, an elastic band and a stone. Squash, bend, twist and stretch each one. Which changed shape? Which did not?",
    "globeCatch": "Any ball with blue and green paper stuck on (or a real globe). Throw and catch it ten times and see whether a fingertip lands on water or land.",
    "sunShade": "Two cups of water, one in the sun and one in the shade. Feel them with a fingertip after an hour. Never look straight at the Sun.",
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
<title>%(gradeLabel)s Science</title>
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
  <div class="eh-brand">%(shield)s<span class="eh-brandtext"><b>Ehel Academy</b><i>Primary Science</i></span></div>
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
    <p class="eyebrow">Ehel Academy &middot; Science</p>
    <h1>%(gradeLabel)s <em>Science</em></h1>
    <p>%(nlessons)s lessons, in the order they are meant to be done. Every one has a real experiment in it: predict, try it, say what happened. About %(total)d minutes in all, one lesson a week.</p>
  </header>

  <main class="cards">
%(cards)s  </main>

  <section class="strands">
    <h2>What Stage %(stage)d science covers</h2>
%(strands)s  </section>

  <section class="grownups" id="grown-ups">
    <h2>For teachers and parents</h2>
    <p>What each lesson teaches, in Cambridge's own words; the experiment to do for real with things from home; and the answer keys. Open a lesson to read it, or print this page for the lot.</p>
%(grownups)s  </section>

  <p class="hubfoot">Built to Cambridge Primary Science 0097, Stage %(stage)d &mdash; all %(ncodes)d learning objectives, including Thinking and Working Scientifically and Science in Context. The stickers are earned, not given.</p>
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

def grownups_for(n, lesson, codes, minutes, steps, stage):
    """One <details> per lesson: objectives, steps, the experiment at home, the keys."""
    reached = []
    for s in lesson["steps"]:
        for c in s["objectives"]:
            if c not in reached:
                reached.append(c)
    objectives = "".join("<li><code>%s</code> %s</li>" % (text(c), text(codes.get(c, ""))) for c in reached)
    steplist = "".join("<li>%s <span class=\"key\">&middot; %s</span></li>" % (text(s["title"]), text(plain(s["ask"]))) for s in lesson["steps"])
    home = []
    for s in lesson["steps"]:
        sim = s["data"].get("sim") if s["kind"] in ("experiment", "predictEach") else None
        if sim and sim in AT_HOME:
            home.append("<li><b>%s.</b> %s</li>" % (text(s["title"]), text(AT_HOME[sim])))
    keys = []
    for s in lesson["steps"]:
        d = s["data"]
        if s["kind"] in ("quiz", "questions"):
            keys.append("<li><b>%s</b><ol>%s</ol></li>" % (text(s["title"]), "".join(
                "<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(plain(it["ask"])), text(next(o["t"] for o in it["opts"] if o["ok"])))
                for it in d["items"])))
        elif s["kind"] == "sort":
            bins = {b["id"]: b["label"] for b in d["bins"]}
            groups = {}
            for it in d["items"]:
                groups.setdefault(bins[it["bin"]], []).append(it["label"])
            keys.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), "; ".join(
                "<b>%s</b>: %s" % (text(k), text(", ".join(v))) for k, v in groups.items())))
        elif s["kind"] == "predictEach":
            ch = {c["id"]: c["t"] for c in d["choices"]}
            keys.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), "; ".join(
                "%s: <b>%s</b>" % (text(it["label"]), text(ch[it["answer"]])) for it in d["items"])))
        elif s["kind"] == "experiment":
            keys.append("<li><b>%s</b> <span class=\"key\">prediction: <b>%s</b>; what happened: <b>%s</b></span></li>" % (
                text(s["title"]), text(next(o["t"] for o in d["predict"]["opts"] if o["ok"])),
                text(next(o["t"] for o in d["happened"]["opts"] if o["ok"]))))
    return (
        '    <details class="gu"><summary>Lesson %d: %s<small>%d steps &middot; about %d minutes &middot; %d objectives</small></summary>\n'
        '      <div class="body">\n'
        '        <h3>What it teaches (Cambridge Primary Science 0097, Stage %d)</h3><ul>%s</ul>\n'
        '        <h3>The steps</h3><ol>%s</ol>\n'
        '%s'
        '        <h3>Answer keys</h3><ul>%s</ul>\n'
        '      </div>\n    </details>\n'
        % (n, text(lesson["title"]), steps, minutes, len(reached), stage, objectives, steplist,
           ('        <h3>Do the experiment for real</h3><ul>%s</ul>\n' % "".join(home)) if home else "",
           "".join(keys)))


def main():
    cfg = load_json(os.path.join(APP, "app.config.json"))
    stage = int(cfg["stage"])
    fw = load_json(FRAMEWORK) if os.path.isfile(FRAMEWORK) else {"objectivesByStage": {}}
    codes = {o["code"]: o["text"] for o in fw["objectivesByStage"].get(str(stage), [])}
    strands = cfg.get("hubStrands") or []
    prefix = cfg.get("progressUnitPrefix", "l")
    cards, steps, files, options, grownups = "", {}, {}, "", ""
    live, total_minutes = 0, 0
    for n, l in enumerate(cfg["lessons"], 1):
        f = l["file"]
        uid = "%s%02d" % (prefix, n)
        here = os.path.isfile(os.path.join(APP, f))
        lesson = lesson_module(n)
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
