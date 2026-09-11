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
LIB = os.path.join(HERE, "lib")

# What each unit is about, in a sentence a six-year-old's grown-up can read at
# a glance. Drawn from the unit's own unitOverview, first sentence, because a
# hand-written blurb goes stale the first time the content is corrected.
# The year's schedule comes from build-lessons.py :: unit_schedule(), which
# asks shell/study-plan.js - the school's real 2026-27 calendar and the one
# place it is defined. The hub does not re-derive it and does not keep a copy.
# build-lessons.py resolves --app from sys.argv on import, so the two builders
# always describe the same app: OUT, DATA and the labels come from it.
_spec = importlib.util.spec_from_file_location(
    "ehel_english_lessons", os.path.join(HERE, "build-lessons.py"))
_lessons = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lessons)
OUT, DATA = _lessons.OUT, _lessons.DATA
GRADE_LABEL = _lessons.GRADE_LABEL


def shared_bar_css():
    """The CSS literal out of mathematics/lesson-app-tools/add-header-bars.py.

    READ, NOT IMPORTED: that tool runs its main() at import and would patch
    the lesson pages of whatever app sys.argv names. ast finds the one
    assignment and evaluates only the string, so nothing in it executes."""
    import ast
    path = os.path.join(ACADEMY, "mathematics", "lesson-app-tools", "add-header-bars.py")
    tree = ast.parse(io.open(path, encoding="utf-8").read())
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "CSS" for t in node.targets):
            css = ast.literal_eval(node.value)
            if ".eh-bar1" not in css or ".eh-progtext" not in css:
                sys.exit("REFUSED: add-header-bars.py's CSS no longer holds the bar rules")
            return css.rstrip("\n") + "\n"
    sys.exit("REFUSED: no CSS = ... in add-header-bars.py; the hub cannot draw its bar")


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
<title>%(gradeLabel)s English</title>
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

  /* ---- the header bar: the SHARED rules, then only what the hub adds ----
     The rules below are add-header-bars.py's own CSS, read out of that file at build
     time. The hub used to carry a copy of these rules, and the copy drifted:
     the shared tool's contrast fix of 2026-09-10 (--muted to --ink on the
     progress label, 4.04:1 to 9.72:1) never reached the hub, and the Grade 1
     validation of 2026-09-11 found the live hub failing AA (areas 14 and 15).
     One source now, so a fix to the bar reaches the hub on its next build. */
%(barcss)s
  /* what only the hub has: no second bar, a Back link that must not shrink,
     the spacer, and the year bar beside the unit bar */
  .eh-round { flex: 0 0 auto; }
  .eh-bar1 .hubhead-spacer { display: none; }
  @media (max-width: 720px) {
    .eh-progtext, .eh-brandtext { display: none; }
    .eh-picker { max-width: 130px; }
  }
  /* the second bar is the YEAR; it yields space before the unit bar does */
  .eh-year .eh-pct { background: var(--gold, #E8B84B); color: var(--gold-ink, #2A1F05); }
  .eh-year { max-width: 300px; }
  @media (max-width: 900px) { .eh-year .eh-track, .eh-year .eh-progtext { display: none; }
    .eh-year { flex: 0 0 auto; max-width: none; padding: 5px 6px; } }
  @media (max-width: 620px) { .eh-year { display: none; } }
</style>

<script type="module">import "./seb-session.js";</script>
<header class="eh-bar1">
  <a class="eh-round back" id="ehBack" href="#" aria-label="Back" hidden>&larr;</a>
  <div class="eh-brand"><img class="eh-crest" src="../../shared/ehel-academy-logo.png" alt="" width="32" height="32" decoding="async"><span class="eh-brandtext"><b>Ehel Academy</b><i>Primary English</i></span></div>
  <div class="eh-prog" id="ehProg">
    <span class="eh-pct" id="ehPct">0%%</span>
    <span class="eh-progtext">Lesson progress</span>
    <span class="eh-track"><i id="ehFill"></i></span>
  </div>
  <div class="eh-prog eh-year" id="ehYear">
    <span class="eh-pct eh-yearpct" id="ehYearPct">0%%</span>
    <span class="eh-progtext">Year progress</span>
    <span class="eh-track"><i id="ehYearFill"></i></span>
  </div>
  <div class="eh-b1right">
    <span id="ehFocus" hidden></span>
    <select class="eh-picker" id="ehPicker" aria-label="Choose a unit">%(picker)s</select>
  </div>
</header>

<div class="wrap">
  <header class="hubhead">
    <p class="eyebrow">Ehel Academy &middot; English</p>
    <h1>%(gradeLabel)s <em>English</em></h1>
    <p>Ten units, in the order they are meant to be done. Start at the top &mdash; each one gets you ready for the next.</p>
  </header>

  <main class="cards">
%(cards)s  </main>

  <section class="yearplan">
    <h2>The year at a glance</h2>
    <p class="yearnote">%(yearnote)s</p>
%(terms)s  </section>

  <p class="hubfoot">Every word, story and recording here is the %(gradeLabel)s English course content, shown a different way.</p>
</div>

<script>
/* ---- the header bar: which unit, how far through it, and the way out ----
   Everything here is answered by the launch URL and by the progress document
   the LESSONS write. This page stores nothing of its own. */
(function () {
  var COURSE = "%(courseKey)s";
  var STEPS  = %(stepsmap)s;     /* unit id -> slides-1, the lesson's own denominator */
  var FILES  = %(filesmap)s;     /* unit id -> the page that teaches it */
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

  /* THE YEAR. The same arithmetic summed over every unit, so the two bars are
     one measurement at two scales and cannot contradict each other. */
  var yDone = 0, yTotal = 0;
  for (var k = 1; k <= N; k++) {
    var u = id(k), s = unitOf(u);
    yTotal += STEPS[u] || 0;
    yDone += Math.min((s && s.sectionsDone && s.sectionsDone.length) || 0, STEPS[u] || 0);
  }
  var ypct = yTotal ? Math.min(100, Math.round((yDone / yTotal) * 100)) : 0;
  var ypctEl = document.getElementById("ehYearPct");
  if (ypctEl) ypctEl.textContent = ypct + "%%";
  var yfill = document.getElementById("ehYearFill");
  if (yfill) yfill.style.width = ypct + "%%";
  var yearEl = document.getElementById("ehYear");
  if (yearEl) yearEl.title = yDone + " of " + yTotal + " steps done across the year";

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
    cfg = _lessons.CFG
    built = {l["file"]: l for l in cfg["lessons"]}

    def slug(t):
        s = t.lower().replace("&", "and")
        return re.sub(r"[^a-z0-9]+", "-", s).strip("-") + ".html"

    cards = ""
    live = 0
    steps_map, files_map = {}, {}
    for u in manifest["units"]:
        unit = json.load(io.open(os.path.join(DATA, "units", "unit-%d.json" % u["number"]), encoding="utf-8"))
        f = slug(u["title"])
        here = os.path.isfile(os.path.join(OUT, f))
        if here and f in built:
            live += 1
            page = io.open(os.path.join(OUT, f), encoding="utf-8").read()
            steps = len(re.findall(r'<section class="slide"', page)) - 1
            # the header script's two maps, from the page itself. They were
            # typed into PAGE as Grade 1's (welcome-to-school.html, 22 steps),
            # so every other grade's hub - the live Grade 2 one included - could
            # not select its current unit in the picker and divided its
            # progress by Grade 1's step counts. Found building Grade 3.
            uid = "%s%02d" % (cfg.get("progressUnitPrefix") or "u", u["number"])
            steps_map[uid] = steps
            files_map[uid] = f
            meta = "%d steps &middot; stickers" % steps
            # The unit's own learning-time estimate, on the card a parent
            # plans from - the Grade 1 validation (area 17) found it held as
            # data and shown nowhere; Science's hub already shows its figure.
            # "about", and a title naming it provisional, because nobody has
            # been timed doing these units yet.
            lt = unit.get("learningTime") or {}
            if lt.get("selfPacedMinutes"):
                meta += (' &middot; <span title="Estimated from the unit\'s content, '
                         'not yet timed with learners">about %d min</span>' % lt["selfPacedMinutes"])
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

    io.open(os.path.join(OUT, cfg["hub"]), "w", encoding="utf-8", newline="").write(
        PAGE % {"css": css, "cards": cards, "gradeLabel": GRADE_LABEL,
                "barcss": shared_bar_css(),
                "stepsmap": json.dumps(steps_map), "filesmap": json.dumps(files_map),
                "courseKey": cfg["courseKey"],
                # the unit picker: this grade's lessons, in order, from the
                # same config the cards and FILES come from - it used to be a
                # typed list of Grade 1's titles, which Grade 2's hub inherited
                "picker": "".join('<option value="%s">%s</option>'
                                  % (_lessons.attr(l["file"]), _lessons.text(l["title"]))
                                  for l in cfg["lessons"]),
                "yearnote": year_note, "terms": terms_html})
    print("\n  ok   %s  -  %d of %d units live\n" % (cfg["hub"], live, len(manifest["units"])))


main()
