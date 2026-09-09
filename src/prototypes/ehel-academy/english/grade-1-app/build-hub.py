# -*- coding: utf-8 -*-
"""Build the Grade 1 English hub - the page a learner lands on.

Ten cards, one per unit of the course, in the order the course teaches them.
The card's blurb and its step count come from the built lesson page rather
than from a list written here, so the hub cannot promise a step the page does
not have.

A unit whose page has not been built yet is drawn as a card with no link and
"Coming soon" where the Start button goes. A card that looks like a link and
goes nowhere is worse than a card that says it is not ready - the same rule
the lesson build follows about a control that reaches nobody.

    python build-hub.py
"""
import importlib.util
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ACADEMY, "english", "grade-1", "data")
LIB = os.path.join(HERE, "lib")

# What each unit is about, in a sentence a six-year-old's grown-up can read at
# a glance. Drawn from the unit's own unitOverview, first sentence, because a
# hand-written blurb goes stale the first time the content is corrected.
# The year's schedule comes from build-lessons.py :: unit_schedule(), which
# asks shell/study-plan.js - the school's real 2026-27 calendar and the one
# place it is defined. The hub does not re-derive it and does not keep a copy.
_spec = importlib.util.spec_from_file_location(
    "ehel_g1_lessons", os.path.join(HERE, "build-lessons.py"))
_lessons = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lessons)


def blurb(unit_json):
    t = (unit_json.get("unit", {}).get("unitOverview") or "").strip()
    t = re.sub(r"\s+", " ", t)
    parts = re.split(r"(?<=[.!?])\s+", t)
    # the first sentence is a welcome on unit 1 ("Welcome to your first unit
    # of Year 1 English"), which says nothing about the unit; take the one
    # that names what is taught
    for p in parts:
        if re.search(r"\byou will\b|\blearn\b|\bpractis|\bread\b", p, re.I):
            return p.strip()
    return (parts[0] if parts else "").strip()


CARD = """      <%(tag)s class="card%(cls)s"%(href)s>
        <span class="cardno">Unit %(n)d</span>
        <h2>%(title)s</h2>
        <p>%(blurb)s</p>
        <span class="cardfoot"><span class="meta">%(meta)s</span>%(cta)s</span>
      </%(tag)s>
"""

# THE DOCTYPE IS NOT DECORATION. Without it the browser renders in QUIRKS mode
# (document.compatMode "BackCompat"), a legacy box model these pages were never
# written for -- they were simply never given one. Measured before adding it:
# every element's box, font size, line height and padding is identical either
# way on this build, so the mode flip moves nothing.
#
# lang="en-GB" is what a screen reader reads the page WITH. Without it the
# reader guesses, and may pronounce English with another language's rules --
# on a course whose subject is English. British English, matching the course's
# own standing spelling rule.
PAGE = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grade 1 English</title>
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
  .hubfoot { color: var(--muted); font-size: 14.5px; padding: 26px 4px 0; max-width: 60ch; }
  .yearplan { padding: 34px 4px 0; }
  .yearplan h2 { font-size: 30px; }
  .yearnote { color: var(--muted); font-size: 16px; margin: 8px 0 18px; max-width: 62ch; }
  .term { margin-bottom: 18px; padding: 16px 18px; border-radius: 20px;
    border: 1px solid var(--line); background: rgba(20, 43, 62, 0.88); }
  .term h3 { font-size: 19px; }
  .term .termdates { color: var(--teal); font-family: "Inter", "Segoe UI", sans-serif;
    font-weight: 800; font-size: 12.5px; text-transform: uppercase; letter-spacing: .07em; }
  .term ol { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
  .term li { display: grid; grid-template-columns: 92px 1fr; gap: 12px; align-items: baseline;
    padding: 8px 12px; border-radius: 12px; background: var(--card); }
  .term li .wk { color: var(--teal); font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 13px; }
  .term li .when { display: block; color: var(--muted); font-weight: 400; font-size: 12.5px; }
  @media (max-width: 560px) { .term li { grid-template-columns: 1fr; gap: 2px; } }

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
  .eh-pct { background: var(--teal); color: var(--teal-ink, #06231F); font-weight: 800; font-size: 13px; border-radius: 999px; padding: 4px 9px; }
  .eh-progtext { font-size: 13.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
  .eh-track { flex: 1 1 auto; height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; min-width: 40px; }
  .eh-track i { display: block; height: 100%%; width: 0; background: var(--teal); border-radius: 999px; transition: width .3s ease; }
  .eh-b1right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .eh-picker { font: inherit; font-size: 14px; font-weight: 700; color: var(--ink); background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; padding: 8px 10px; max-width: 200px; }
  .eh-round { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; border: none;
    background: var(--teal); color: var(--teal-ink, #06231F); font: inherit; font-size: 15px; font-weight: 700;
    padding: 9px 13px; cursor: pointer; text-decoration: none; flex: 0 0 auto; }
  .eh-bar1 .hubhead-spacer { display: none; }
  @media (max-width: 720px) {
    .eh-progtext, .eh-brandtext { display: none; }
    .eh-picker { max-width: 130px; }
  }
</style>

<header class="eh-bar1">
  <a class="eh-round" id="ehBack" href="#" aria-label="Back" hidden>&larr;</a>
  <div class="eh-brand"><svg viewBox="0 0 24 26" aria-hidden="true"><path d="M12 1.5 21.5 5v8.5c0 5.4-4 9.3-9.5 11C6.5 22.8 2.5 18.9 2.5 13.5V5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path><path d="M12 7.2l1.5 3.1 3.4.5-2.4 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.4-2.4 3.4-.5z" fill="currentColor"></path></svg><span class="eh-brandtext"><b>Ehel Academy</b><i>Primary English</i></span></div>
  <div class="eh-prog" id="ehProg">
    <span class="eh-pct" id="ehPct">0%%</span>
    <span class="eh-progtext">Lesson progress</span>
    <span class="eh-track"><i id="ehFill"></i></span>
  </div>
  <div class="eh-b1right">
    <select class="eh-picker" id="ehPicker" aria-label="Choose a unit"><option value="welcome-to-school.html">Welcome to School</option><option value="family-time.html">Family Time</option><option value="fun-and-games.html">Fun and Games</option><option value="making-things.html">Making Things</option><option value="on-the-farm.html">On the Farm</option><option value="my-five-senses.html">My Five Senses</option><option value="let-s-go.html">Let's Go!</option><option value="wonderful-water.html">Wonderful Water</option><option value="city-places.html">City Places</option><option value="my-first-english-world.html">My First English World</option></select>
  </div>
</header>

<div class="wrap">
  <header class="hubhead">
    <p class="eyebrow">Ehel Academy &middot; English</p>
    <h1>Grade 1 <em>English</em></h1>
    <p>Ten units, in the order they are meant to be done. Start at the top &mdash; each one gets you ready for the next.</p>
  </header>

  <main class="cards">
%(cards)s  </main>

  <section class="yearplan">
    <h2>The year at a glance</h2>
    <p class="yearnote">%(yearnote)s</p>
%(terms)s  </section>

  <p class="hubfoot">Every word, story and recording here is the Grade 1 English course content, shown a different way.</p>
</div>

<script>
/* ---- the header bar: which unit, how far through it, and the way out ----
   Everything here is answered by the launch URL and by the progress document
   the LESSONS write. This page stores nothing of its own. */
(function () {
  var COURSE = "ehel-eng-g01";
  var STEPS  = {"u01": 22, "u02": 22, "u03": 22, "u04": 21, "u05": 22, "u06": 22, "u07": 22, "u08": 21, "u09": 21, "u10": 19};     /* unit id -> slides-1, the lesson's own denominator */
  var FILES  = {"u01": "welcome-to-school.html", "u02": "family-time.html", "u03": "fun-and-games.html", "u04": "making-things.html", "u05": "on-the-farm.html", "u06": "my-five-senses.html", "u07": "let-s-go.html", "u08": "wonderful-water.html", "u09": "city-places.html", "u10": "my-first-english-world.html"};     /* unit id -> the page that teaches it */
  var q = new URLSearchParams(location.search);
  var id = function (n) { return "u" + (n < 10 ? "0" : "") + n; };
  var N = Object.keys(FILES).length;

  /* the progress document the lessons write through shared/progress-client.js;
     a missing or unreadable one is "nothing done yet", never an error. */
  var doc = null;
  try {
    doc = JSON.parse(localStorage.getItem(
      "ehel-progress:" + COURSE + ":" + (q.get("studentid") || "local")) || "null");
  } catch (e) { doc = null; }
  var unitOf = function (u) { return (doc && doc.units && doc.units[u]) || null; };

  /* WHICH UNIT. The launch URL wins when it names one - that is how a teacher
     links to a unit. With no ?unit=, fall back to the furthest unit the learner
     has actually touched, so a bare hub link opens where they left off. */
  var n = parseInt(q.get("unit"), 10);
  if (!(n >= 1 && n <= N)) {
    n = 1;
    for (var i = N; i >= 1; i--) {
      var st = unitOf(id(i));
      if (st && ((st.sectionsDone && st.sectionsDone.length) || st.resume)) { n = i; break; }
    }
  }
  var cur = id(n);

  /* HOW FAR. sectionsDone against this unit's own step count - the same
     arithmetic the lesson page's bar does, so the two always agree. */
  var st = unitOf(cur);
  var done = (st && st.sectionsDone && st.sectionsDone.length) || 0;
  var total = STEPS[cur] || 0;
  var pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  var pctEl = document.getElementById("ehPct");
  if (pctEl) pctEl.textContent = pct + "%%";
  var fill = document.getElementById("ehFill");
  if (fill) fill.style.width = pct + "%%";
  var prog = document.getElementById("ehProg");
  if (prog) prog.title = done + " of " + total + " steps done in this unit";

  /* THE PICKER names the current unit and moves to another. It reuses the card
     link's href rather than rebuilding the query string, so the picker and the
     cards carry the launch parameters identically - one definition, not two.
     Read at change time, after wire-navigation's carrier has rewritten them. */
  var pick = document.getElementById("ehPicker");
  if (pick) {
    pick.value = FILES[cur] || "";
    pick.addEventListener("change", function () {
      var f = pick.value;
      if (!f) return;
      var card = document.querySelector('a.card[href^="' + f + '"]');
      location.href = card ? card.getAttribute("href") : f;
    });
  }

  /* THE WAY OUT, drawn only when the launch gave us one. */
  var exit = q.get("exitUrl");
  var back = document.getElementById("ehBack");
  if (back && exit) { back.setAttribute("href", exit); back.hidden = false; }
})();
</script>
"""


def main():
    manifest = json.load(io.open(os.path.join(DATA, "course-manifest.json"), encoding="utf-8"))
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    built = {l["file"]: l for l in cfg["lessons"]}

    def slug(t):
        s = t.lower().replace("&", "and")
        return re.sub(r"[^a-z0-9]+", "-", s).strip("-") + ".html"

    cards = ""
    live = 0
    for u in manifest["units"]:
        unit = json.load(io.open(os.path.join(DATA, "units", "unit-%d.json" % u["number"]), encoding="utf-8"))
        f = slug(u["title"])
        here = os.path.isfile(os.path.join(HERE, f))
        if here and f in built:
            live += 1
            page = io.open(os.path.join(HERE, f), encoding="utf-8").read()
            steps = len(re.findall(r'<section class="slide"', page)) - 1
            meta = "%d steps &middot; stickers" % steps
            cta = '<span class="go">Start</span>'
            tag, href, cls = "a", ' href="%s?from=%s"' % (f, cfg["fromParam"]), ""
        else:
            meta, cta = "", '<span class="soon">Coming soon</span>'
            tag, href, cls = "div", "", " locked"
        cards += CARD % {
            "tag": tag, "href": href, "cls": cls, "n": u["number"],
            "title": u["title"], "blurb": blurb(unit), "meta": meta, "cta": cta,
        }

    css = io.open(os.path.join(LIB, "lesson.css"), encoding="utf-8").read()
    # ---- the year at a glance -------------------------------------------
    sched = _lessons.unit_schedule(manifest)
    by_term = {}
    for unit in manifest["units"]:
        row = sched.get(str(unit["number"])) or sched.get(unit["number"])
        if not row:
            continue
        by_term.setdefault(row["term"], []).append((unit, row))
    year = next(iter(sched.values()), {}).get("year", "")
    total_weeks = sum(r["weeks"] for _, r in
                      [(u, r) for rows in by_term.values() for u, r in rows])
    year_note = ("Ten units across three terms of the %s school year, %d teaching weeks in all. "
                 "The dates are the school's, half terms taken out. Nobody is behind: if a unit "
                 "takes longer, it takes longer." % (year, total_weeks))
    terms_html = ""
    for term_no in sorted(by_term):
        rows = by_term[term_no]
        items = ""
        for unit, row in rows:
            weeks = ("Week %d" % row["from"]) if row["from"] == row["to"] else ("Weeks %d–%d" % (row["from"], row["to"]))
            items += ('        <li><span class="wk">%s<span class="when">%s</span></span>'
                      '<span><strong>Unit %d: %s</strong></span></li>\n'
                      % (weeks, _lessons.text(row["fromDate"]), unit["number"], _lessons.text(unit["title"])))
        terms_html += ('    <div class="term"><span class="termdates">Term %d &middot; %s</span>'
                       '<h3>%d unit%s</h3>\n      <ol>\n%s      </ol></div>\n'
                       % (term_no, _lessons.text(rows[0][1]["termDates"]), len(rows),
                          "" if len(rows) == 1 else "s", items))

    io.open(os.path.join(HERE, cfg["hub"]), "w", encoding="utf-8", newline="").write(
        PAGE % {"css": css, "cards": cards,
                "yearnote": year_note, "terms": terms_html})
    print("\n  ok   %s  -  %d of %d units live\n" % (cfg["hub"], live, len(manifest["units"])))


main()
