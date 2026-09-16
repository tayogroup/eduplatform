# -*- coding: utf-8 -*-
"""Build a grade's Global Perspectives hub - the page a learner lands on.

One card per lesson, in the order app.config.json lists them. A card's step
count comes from the BUILT page and its blurb, objectives and answer keys from
the content module, so the hub cannot promise a step the page does not have. A
lesson whose page is not built is drawn as "Coming soon" with no link - a card
that looks like a link and goes nowhere is worse than one that says it is not
ready.

THE TIME ESTIMATE on a card comes from a play-through of the lesson, recorded
in the grade's timing.json: every step driven to completion, with the words
the page actually spoke (ask lines, frames, feedback, lecture parts, word
cards) and the taps it asked for. Minutes are those words at the voice's pace
(TIMING_WPM), a response time per tap at the grade's stage (TAP_SECONDS), and
a moment to arrive at each step (STEP_SECONDS). So a lesson that grows a step,
or a lecture that grows a paragraph, moves its own estimate.

It is a model, not a measurement of children. TAP_SECONDS and STEP_SECONDS are
the two numbers timing two real children would correct; the per-kind MINUTES
table below is kept only for a grade with no timing.json yet. A timing.json
whose steps do not match the lesson as built is REFUSED, because a card that
states minutes for a lesson it no longer describes is a wrong claim to a
teacher planning a session. Regenerate it with the timing play-through
(drive-gp-mods.mjs with TIMING set) after any content change.

An estimate is a claim; it is here so a teacher can plan a session, not so a
child is timed.

THE GROWN-UPS SECTION at the foot of the hub is the teacher-and-parent
support this build otherwise lacks: per lesson, the Cambridge objectives it
reaches (text read from the framework file, not retyped), the talk-together
version of each activity to do at home, and the answer keys - and for the
steps that have no key because a child's own opinion or own reflection is the
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

from _rules import survey_counts, observe_counts, pictogram_answer, relevant, relevant_sources, solutions, share_outcome, allocations
from _shell import expand, finder_words

KIT = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(KIT, "lib")
REPO = os.path.abspath(os.path.join(KIT, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-global-perspectives-0838.json")
APP = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
if not os.path.isfile(os.path.join(APP, "app.config.json")):
    sys.exit("REFUSED: no app.config.json in %s. Run from a grade directory or pass --app <dir>." % APP)
CONTENT = os.path.join(APP, "content")

# minutes a six-year-old spends on a step of each kind, including listening
MINUTES = {"demo": 1.5, "explore": 2, "context": 2.5, "sort": 3, "order": 2,
           "askq": 4, "source": 3, "text": 3, "survey": 5, "observe": 4, "pictogram": 3, "organiser": 3, "strengths": 3,
           "know": 3, "answer": 3, "listen": 4, "consequence": 3, "solve": 4,
           "sources": 4, "opinion": 3, "team": 5, "contrib": 3, "lookback": 3,
           "questions": 3, "quiz": 4,
           # the unit shell (_shell.py); home projects are done off the screen and cost the page nothing
           "overview": 1, "warmup": 2, "lecture": 4, "words": 4, "games": 6, "home": 1, "world": 0.5, "resources": 1}

# the talk-together version of each kind of step, for a grown-up to run at home
TOGETHER = {
    "askq": "Pick a topic (pets, the park, dinner). Take turns asking a question about it that starts with What, Where, Who, When, Why or How. Count how many different questions you can ask.",
    "source": "Look at one photo or picture book page together. Ask: what does this picture tell us? Find three things in it and say a fact about each.",
    "text": "Read a short page of a non-fiction book together. Ask a question, and let the child find the ONE sentence that answers it and read it out.",
    "observe": "Stand at a window or a gate for five minutes and count one kind of thing - red cars, people with dogs, buses. Make a mark for each. Then count a second kind and compare.",
    "strengths": "After a job done together, ask: what did you do well? What would you do differently next time? One of each, honestly.",
    "survey": "Ask everyone at home one question with a few answers (how do you get to work or school?). Draw one small picture per person in a row for each answer.",
    "pictogram": "Look at the picture rows you made. Ask: which row is the longest? How many chose this? Did anyone choose that?",
    "organiser": "Draw two big circles or two columns on paper and sort what you found out into them, one fact at a time, saying why each goes where it goes.",
    "know": "Name a topic and take turns saying one thing you already know about it. Stop and laugh when somebody says something that is about a different topic.",
    "answer": "Ask the child a question and listen for whether the answer is ABOUT the question. Swap: they ask, you answer with something off the point, and they catch you.",
    "listen": "Talk for three sentences about your day. Then ask the child to ask you one question about what you said - not about something else.",
    "consequence": "Talk about a small choice and what happens next: if you leave your coat, if you go to bed late, if you share your snack. What happens to YOU?",
    "solve": "Name a small problem at home (toys everywhere, a thirsty plant) and offer three things you could do. Which one actually fixes it? Try it.",
    "sources": "Put a book, a photo, a map and an object on the table. Name a topic and ask which one would help you find out about it, and why.",
    "opinion": "Ask: what do you think about ___? Listen for an opinion AND a reason, and make sure the reason is about the topic.",
    "team": "Do one small job together where you have to share something - the crayons, the sticky tape, the water. Talk about what happened when you shared.",
    "contrib": "After doing a job together, ask: what did YOU do that helped? What did I do? One thing each.",
    "lookback": "At the end of the day ask: what did you learn today? What did you like best, and why?",
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


# the play-through model (see THE TIME ESTIMATE above)
TIMING_WPM = 140                         # the course voice at the house pace (SSML rate -8%)
TAP_SECONDS = {1: 8, 2: 7, 3: 6, 4: 6}   # read the choices, think, tap - by stage
STEP_SECONDS = 20                        # arrive at a step, look at it, move on
TIMING = load_json(os.path.join(APP, "timing.json")) if os.path.isfile(os.path.join(APP, "timing.json")) else None


def minutes_of(lesson, n=None, stage=1):
    if TIMING is None:
        return int(5 * round(sum(MINUTES.get(s["kind"], 2) for s in lesson["steps"]) / 5.0))
    rec = TIMING["lessons"].get(str(n)) or []
    built = [s["kind"] for s in lesson["steps"]]
    if [x["kind"] for x in rec] != built:
        sys.exit("REFUSED: timing.json does not describe lesson %d as built (%d steps recorded, %d built).\n"
                 "  Re-run the timing play-through and rewrite timing.json - see THE TIME ESTIMATE in this file." % (n, len(rec), len(built)))
    tap = TAP_SECONDS.get(int(stage), 6)
    secs = sum(x["words"] * 60.0 / TIMING_WPM + x["taps"] * tap + STEP_SECONDS for x in rec)
    return max(5, int(5 * round(secs / 60.0 / 5.0)))


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
<title>%(gradeLabel)s Global Perspectives</title>
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
  <div class="eh-brand">%(shield)s<span class="eh-brandtext"><b>Ehel Academy</b><i>Primary Global Perspectives</i></span></div>
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
    <p class="eyebrow">Ehel Academy &middot; Global Perspectives</p>
    <h1>%(gradeLabel)s <em>Global Perspectives</em></h1>
    <p>%(nlessons)s lessons, in the order they are meant to be done. Every one is about finding things out and talking about them: a question to build, a classmate to ask, a picture to read, a problem to solve, a garden to plant together. About %(total)d minutes in all, one lesson a week.</p>
  </header>

  <main class="cards">
%(cards)s  </main>

  <section class="strands">
    <h2>What Stage %(stage)d Global Perspectives covers</h2>
%(strands)s  </section>

  <section class="grownups" id="grown-ups">
    <h2>For teachers and parents</h2>
    <p>What each lesson teaches, in Cambridge's own words; the talk-together version of each activity to do at home; and the answer keys. Where a step has no key, because the child's own opinion or own reflection is the answer, it says so. Open a lesson to read it, or print this page for the lot.</p>
%(grownups)s  </section>

  <p class="hubfoot">Built to Cambridge Primary Global Perspectives 0838, Stage %(stage)d &mdash; all %(ncodes)d learning objectives across the six skills. The stickers are earned, not given.</p>
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
    elif k in ("sort", "organiser"):
        bins = {b["id"]: b["label"] for b in d["bins"]}
        groups = {}
        for it in d["items"]:
            groups.setdefault(bins[it["bin"]], []).append(it["label"])
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), "; ".join(
            "<b>%s</b>: %s" % (text(g), text(", ".join(v))) for g, v in groups.items())))
    elif k == "warmup":
        out.append("<li><b>%s</b> <span class=\"key\">a starting check, not marked: %s</span></li>" % (text(s["title"]), "; ".join(
            "%s &rarr; <b>%s</b>" % (text(plain(it["ask"])), text(ok_text(it["opts"]))) for it in d["check"])))
    elif k == "order":
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), text(" &rarr; ".join(it["label"] for it in d["items"]))))
    elif k == "askq":
        ends = {e["id"]: e["t"] for e in d["ends"]}
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(
            "<li>%s <span class=\"key\">&rarr; <b>%s %s</b></span></li>" % (text(rd["want"]), text(rd["word"]), text(ends[rd["end"]])) for rd in d["rounds"])))
    elif k == "source":
        spots = {sp["id"]: sp for sp in d["spots"]}
        bits = ["find: " + "; ".join(sp["fact"] for sp in d["spots"])]
        for rd in d.get("rounds") or []:
            bits.append("%s &rarr; <b>%s</b>" % (text(plain(rd["ask"])), text(spots[rd["spot"]]["label"])))
        if d.get("then"):
            keyed = next(o for o in d["then"]["opts"] if o.get("spot"))
            bits.append("%s &rarr; <b>%s</b>" % (text(plain(d["then"]["ask"])), text(keyed["t"])))
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), ". ".join(bits)))
    elif k == "text":
        items = ["<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(plain(rd["ask"])), text(d["lines"][rd["line"]])) for rd in d["rounds"]]
        if d.get("then"):
            items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(plain(d["then"]["ask"])), text(ok_text(d["then"]["opts"]))))
        out.append("<li><b>%s</b><ol>%s</ol></li>" % (text(s["title"]), "".join(items)))
    elif k == "observe":
        rows = observe_counts(d["scene"], d["rounds"])
        out.append("<li><b>%s</b> <span class=\"key\">%s</span></li>" % (text(s["title"]), "; ".join("%s <b>%d</b>" % (text(r["label"]), r["value"]) for r in rows)))
    elif k == "strengths":
        out.append("<li><b>%s</b> <span class=\"key\">reads the team step's own record: what the child got right first time is a strength, what took more than one go is a limitation%s</span></li>" % (
            text(s["title"]), (". Then: %s &rarr; <b>%s</b>" % (text(plain(d["then"]["ask"])), text(ok_text(d["then"]["opts"])))) if d.get("then") else ""))
    elif k == "survey":
        names = {x["id"]: x["t"] for x in d["options"]}
        rows = survey_counts(d["people"], d["options"])
        out.append("<li><b>%s</b> <span class=\"key\">%s. Pictogram: %s</span></li>" % (text(s["title"]), "; ".join(
            "%s: <b>%s</b>" % (text(p["name"]), text(names[p["answer"]])) for p in d["people"]),
            "; ".join("%s <b>%d</b>" % (text(r["label"]), r["value"]) for r in rows)))
    elif k == "pictogram":
        out.append("<li><b>%s</b><ol>%s</ol></li>" % (text(s["title"]), "".join(
            "<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(plain(it["ask"])), text(pictogram_answer(d["rows"], it["check"]))) for it in d["items"])))
    elif k == "know":
        on = relevant(d["cards"], d["tag"])
        out.append("<li><b>%s</b> <span class=\"key\">about %s: <b>%s</b>; not about it: %s</span></li>" % (
            text(s["title"]), text(d["topic"]), text(", ".join(d["cards"][i]["t"] for i in on)),
            text(", ".join(c["t"] for i, c in enumerate(d["cards"]) if i not in on))))
    elif k == "answer":
        out.append("<li><b>%s</b><ol>%s</ol></li>" % (text(s["title"]), "".join(
            "<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["ask"]), text(rd["opts"][relevant(rd["opts"], rd["about"])[0]]["t"])) for rd in d["rounds"])))
    elif k == "listen":
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(
            "<li>%s says: %s <span class=\"key\">&rarr; ask <b>%s</b></span></li>" % (text(rd["speaker"]["name"]), text(" ".join(rd["talk"])), text(rd["opts"][relevant(rd["opts"], rd["topics"])[0]]["t"])) for rd in d["rounds"])))
    elif k == "consequence":
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(
            "<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["situation"]), text(ok_text(rd["predict"]["opts"]))) for rd in d["rounds"])))
    elif k == "solve":
        items = []
        for rd in d["rounds"]:
            fixes = solutions(rd["actions"], rd["needs"])
            items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["issue"]["title"]), text(", ".join(a["t"] for a in rd["actions"] if a["id"] in fixes))))
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(items)))
    elif k == "sources":
        items = []
        for rd in d["rounds"]:
            sids = relevant_sources(rd["sources"], rd["tag"])
            labels = ", ".join(x["label"] for x in rd["sources"] if x["id"] in sids)
            items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b>, %s</span></li>" % (text(rd["topic"]), text(labels), text(ok_text(rd["reasons"]))))
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(items)))
    elif k == "opinion":
        out.append("<li><b>%s</b> <span class=\"key\">no key: any opinion is right. The REASON must be about the topic - %s</span></li>" % (
            text(s["title"]), text("; ".join("%s: %s" % (rd["topic"], ", ".join(rd["reasons"][i]["t"] for i in relevant(rd["reasons"], rd["tag"]))) for rd in d["rounds"]))))
    elif k == "team":
        items = []
        for rd in d["rounds"]:
            if rd["kind"] == "share":
                good = next(o for o in rd["opts"] if share_outcome(rd["you"], o["give"], rd["need"]) == "both")
                items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b> (then you both have enough)</span></li>" % (text(rd["ask"]), text(good["t"])))
            elif rd["kind"] in ("work", "idea"):
                items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["situation"]), text(next(o["t"] for o in rd["opts"] if o.get("good")))))
            elif rd["kind"] == "task":
                items.append("<li>%s <span class=\"key\">&rarr; <b>%s</b></span></li>" % (text(rd["job"]), text(" &rarr; ".join(st["t"] for st in rd["steps"]))))
            elif rd["kind"] == "allocate":
                names = {m["id"]: m["name"] for m in rd["members"]}
                who = allocations(rd["tasks"], rd["members"])
                items.append("<li>give out the jobs <span class=\"key\">&rarr; %s</span></li>" % "; ".join("%s: <b>%s</b>" % (text(t["t"]), text(names[who[t["id"]][0]])) for t in rd["tasks"]))
        out.append("<li><b>%s</b><ul>%s</ul></li>" % (text(s["title"]), "".join(items)))
    elif k == "contrib":
        out.append("<li><b>%s</b> <span class=\"key\">reads the team step's own record - what the child chose IS the key. If the team step was skipped: %s</span></li>" % (
            text(s["title"]), text("; ".join(("you" if x["who"] == "you" else x["who"]) + ": " + x["text"] for x in d["fallback"]))))
    elif k == "lookback":
        out.append("<li><b>%s</b> <span class=\"key\">no key for what was liked. Things learned today: <b>%s</b>; not today: %s</span></li>" % (
            text(s["title"]), text("; ".join((x["t"] if isinstance(x, dict) else x) for x in d["learned"])), text("; ".join(d["not"]))))
    elif k in ("explore", "context") and d.get("then"):
        out.append("<li><b>%s</b> <span class=\"key\">%s &rarr; <b>%s</b></span></li>" % (text(s["title"]), text(plain(d["then"]["ask"])), text(ok_text(d["then"]["opts"]))))
    return out


def grownups_for(n, lesson, codes, minutes, steps, stage):
    """One <details> per lesson: objectives, steps, the talk-together versions, the keys."""
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
        '        <h3>What it teaches (Cambridge Primary Global Perspectives 0838, Stage %d)</h3><ul>%s</ul>\n'
        '        <h3>The steps</h3><ol>%s</ol>\n'
        '%s'
        '        <h3>Answer keys</h3><ul>%s</ul>\n'
        '      </div>\n    </details>\n'
        % (n, text(lesson["title"]), steps, minutes, len(reached), stage, objectives, steplist,
           ('        <h3>Do it together, for real</h3><ul>%s</ul>\n' % "".join(home)) if home else "",
           "".join(keys)))


def fill_for_hub(steps, modules_all):
    """The same derived fields build-lessons.py fills, so the keys read here
    describe the page that ships: a pictogram from its survey, a contribution
    record from its team step, the course look-back from every lesson."""
    for k, s in enumerate(steps):
        d = s["data"]
        if s["kind"] == "pictogram" and d.get("fromObserve") and not d.get("rows"):
            ob = [x for x in steps[:k] if x["kind"] == "observe"][-1]["data"]
            d["rows"] = observe_counts(ob["scene"], ob["rounds"])
        if s["kind"] == "strengths" and not d.get("fallback"):
            d["fallback"] = [{"who": "you", "text": "what you did", "missed": False}]
        if s["kind"] == "pictogram" and d.get("fromSurvey") and not d.get("rows"):
            sv = [x for x in steps[:k] if x["kind"] == "survey"][-1]["data"]
            d["rows"] = survey_counts(sv["people"], sv["options"])
        if s["kind"] == "contrib" and not d.get("fallback"):
            t = [x for x in steps[:k] if x["kind"] == "team"][-1]["data"]
            names = {f["id"]: f["name"] for f in t["friends"]}
            fb = []
            for rd in t["rounds"]:
                if rd["kind"] == "share":
                    good = next(o for o in rd["opts"] if share_outcome(rd["you"], o["give"], rd["need"]) == "both")
                    fb.append({"who": "you", "text": rd.get("log") or good["t"]})
                elif rd["kind"] in ("work", "idea"):
                    fb.append({"who": "you", "text": rd.get("log") or next(o["t"] for o in rd["opts"] if o.get("good"))})
                elif rd["kind"] == "task":
                    fb.append({"who": "you", "text": rd.get("log") or ("You " + rd["job"][:1].lower() + rd["job"][1:])})
                elif rd["kind"] == "allocate":
                    fb.append({"who": "you", "text": rd.get("log") or "You gave every job to the right person."})
                else:
                    fb.append({"who": rd["who"], "text": rd.get("log") or (names[rd["who"]] + " " + rd["did"])})
            d["fallback"] = fb
            d.setdefault("friends", t["friends"])
        if s["kind"] == "lookback" and d.get("scope") == "course" and not d.get("learned"):
            d["learned"] = [{"t": a, "lesson": m} for m, les in modules_all if les for a in (les.get("about") or [])]


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
            minutes = minutes_of(lesson, n, stage)
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
    print("\n  ok   %s  -  %d of %d lessons live, about %d minutes of lessons (%s)\n" % (
        cfg["hub"], live, len(cfg["lessons"]), total_minutes,
        "from the play-through in timing.json" if TIMING else "from MINUTES per kind of step: no timing.json"))


main()
