# -*- coding: utf-8 -*-
"""Give a lesson build the English shell's two header bars.

The shared version of grade-1-app/add-header-bars.py, which built the header
Grade 1 ships. Grade 2 went out without it and the difference was visible in
one screenshot: no brand, no lesson-progress bar, no lesson picker, no voice
toggle, no Menu, no Full screen, and the class controls floating in the hero
instead of sitting in bar 2.

The honest subset (owner, 2026-09-06). Bar 1 carries the brand, lesson
progress, the lesson picker and the voice toggle; bar 2 carries back, Menu,
the lesson name, and Full screen. Everything there is answered by the page
itself.

The class controls are NOT painted here. They mount themselves into
`.top-actions`, which this tool moves onto bar 2 - so run
wire-platform-controls.py first (or after; both are idempotent) and they land
beside Full screen, the order English already shows. Painting a Class chat
button here would draw a control for a learner the server has not confirmed a
teacher is watching, which is the failure course-app.js guards against: a
child presses something that reaches nobody and then waits instead of asking.

THREE THINGS THIS DOES DIFFERENTLY FROM THE GRADE 1 ORIGINAL, each because
the original was written for one build and this one is not:

1. IT DOES NOT REWRITE A CORRECT <h1>. The Grade 1 tool rewrote every
   heading, because that build's composer had a rename regex that could not
   span the `<em>` and three lessons showed another lesson's name. It imposed
   "the last word carries the em", which is right for `Counting to <em>Twenty
   </em>` and wrong for `Half Past, <em>Quarter To</em>` - a Grade 2 heading
   that is already correct. So the heading is only rewritten when its text
   does not name this lesson, and the em placement an author chose survives.

2. IT FINDS THE LESSON'S IIFE BY CONTENT, not by taking the first <script>.
   In Grade 1 the header went on before the preconnect snippet, so the first
   script WAS the lesson. Here preload-platform.py has already put a script in
   the head, and "the first script" is that one - the JS would land outside
   the closure and `slides`, `done`, `show` and `paintDots` would all be out
   of scope. Anchored on the script that declares `slides` instead.

3. IT MOVES THE CONTROLS HOST. wire-platform-controls.py gives the hero a
   `.top-actions` when there are no bars; with bars, that host belongs on bar
   2. Leaving both would leave an empty container in the hero and make which
   one wins depend on document order.

Idempotent.
"""
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

MARK = "eh-bar1"

# The REAL crest, not a drawn approximation of one. This was a shield-and-star
# inline SVG until 2026-09-10, and the placeholder outlived its excuse: the
# hub's own generator (english/grade-1-app/build-hub.py) has always emitted the
# real asset, so every app drew a hand-made mark on its lesson pages and showed
# the true crest one click away on the unit hub. Fixing the generated HTML by
# hand does not hold - it was done twice on the English Grade 1 pages and this
# tool overwrote it both times, which is the whole reason the fix is here.
#
# alt="" on purpose: .eh-brandtext spells "Ehel Academy / Primary <subject>"
# immediately after it, so naming the image announces the brand twice. That is
# the same intent the aria-hidden on the old <svg> carried.
#
# The path is relative and the depth is uniform - every app.config.json
# `remote` is `Ehel Primary/app/<subject>/<dir>`, so `../../shared/` resolves
# to `app/shared/` from all nine builds. Verify that before adding an app at
# another depth. A root-relative `/shared/...` is NOT available instead: these
# pages are served under the `Ehel Primary/` prefix, not from the zone root.
CREST = ('<img class="eh-crest" src="../../shared/ehel-academy-logo.png" alt="" '
         'width="32" height="32" decoding="async">')

CSS = """
  /* ---- the two header bars, modelled on the English shell ---- */
  .eh-bar1, .eh-bar2 { position: sticky; z-index: 40; display: flex; align-items: center; gap: 12px;
    background: var(--card); border-bottom: 1px solid var(--line); }
  .eh-bar1 { top: 0; padding: 8px 16px; }
  .eh-bar2 { top: 56px; padding: 8px 16px; background: var(--cell); }
  .eh-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); flex: 0 0 auto; }
  .eh-brand svg { width: 30px; height: 32px; color: var(--teal); display: block; }
  .eh-crest { width: 32px; height: 32px; display: block; flex: 0 0 auto; }
  .eh-brandtext { display: flex; flex-direction: column; line-height: 1.15; }
  .eh-brandtext b { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
  .eh-brandtext i { font-style: normal; font-size: 12.5px; font-weight: 700; color: var(--teal); }
  .eh-prog { display: flex; align-items: center; gap: 9px; background: var(--cell); border: 1px solid var(--line);
    border-radius: 999px; padding: 5px 14px 5px 6px; flex: 1 1 auto; max-width: 420px; min-width: 0; }
  .eh-pct { background: var(--teal); color: var(--teal-ink, #06231F); font-weight: 800; font-size: 13px; border-radius: 999px; padding: 4px 9px; }
  /* --ink, not --muted. At 13.5px this is normal text and needs 4.5:1; on the
     English Grade 1 palette --muted measured 4.04:1 on the --cell pill behind
     it and failed. A fixed colour cannot fix that here - the five apps that
     render this bar carry four different --muted values (#566669, #6B7F82,
     #93AABE, #A4B7C8), so each would need its own answer.

     --ink is the one that holds for all of them by construction: it is each
     palette's own text colour against --card and --cell, which is what
     .eh-brand and .eh-picker in this same bar already depend on. It also ends
     an inconsistency rather than making one - this label was the ONLY text in
     either bar not already drawn in --ink or --teal. */
  .eh-progtext { font-size: 13.5px; font-weight: 700; color: var(--ink); white-space: nowrap; }
  .eh-track { flex: 1 1 auto; height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; min-width: 40px; }
  .eh-track i { display: block; height: 100%; width: 0; background: var(--teal); border-radius: 999px; transition: width .3s ease; }
  .eh-b1right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .eh-picker { font: inherit; font-size: 14px; font-weight: 700; color: var(--ink); background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; padding: 8px 10px; max-width: 200px; }
  .eh-icon { width: 40px; height: 40px; border-radius: 999px; border: 1px solid var(--line); background: var(--card);
    color: var(--ink); font-size: 17px; cursor: pointer; }
  /* The focus chip. Emitted empty and hidden; shared/seb-session.js unhides it,
     writes the dot and the word, and sets is-ok / is-warn / is-bad, because that
     file owns the thresholds. A page without focus mode never shows it at all.
     It is a PILL with a label, not a bare dot: the dot-only version measured
     perfectly and could not be found on the page, and colour alone says nothing
     to anyone who cannot separate red from green. */
  .eh-focus { display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto;
    border-radius: 999px; padding: 5px 12px 5px 9px; white-space: nowrap;
    font-size: 12.5px; font-weight: 800; }
  .eh-focus i { width: 9px; height: 9px; border-radius: 999px; background: currentColor; display: block; }
  .eh-focus.is-ok { background: var(--good, #3E9C63); color: var(--good-ink, #06231F); }
  .eh-focus.is-warn { background: var(--gold, #E8B84B); color: var(--gold-ink, #2A1F05); }
  .eh-focus.is-bad { background: var(--bad, #D7584B); color: var(--bad-ink, #2A0A07); }
  .eh-focus b { font-weight: 800; }
  @media (max-width: 620px) { .eh-focus b { display: none; }
    .eh-focus { padding: 6px; gap: 0; } .eh-focus i { width: 11px; height: 11px; } }
  .eh-icon[aria-pressed="true"] { background: var(--cell); color: var(--muted); text-decoration: line-through; }
  .eh-round { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; border: none;
    background: var(--teal); color: var(--teal-ink, #06231F); font: inherit; font-size: 15px; font-weight: 700; padding: 9px 15px;
    cursor: pointer; text-decoration: none; }
  .eh-round.back { padding: 9px 13px; }
  .eh-section { font-size: 15px; font-weight: 700; color: var(--ink); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; }
  .eh-b2right { margin-left: auto; display: flex; gap: 8px; flex: 0 0 auto; }
  .eh-pill { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; border: 1px solid var(--line);
    background: var(--card); color: var(--ink); font: inherit; font-size: 15px; font-weight: 700;
    padding: 9px 15px; cursor: pointer; }
  .eh-steps { position: sticky; top: 104px; z-index: 39; background: var(--card); border-bottom: 1px solid var(--line);
    max-height: 55vh; overflow-y: auto; padding: 8px; }
  .eh-steps button { display: block; width: 100%; text-align: left; font: inherit; font-size: 16px;
    background: none; border: none; border-radius: 10px; padding: 10px 12px; cursor: pointer; color: var(--ink); }
  .eh-steps button:hover { background: var(--cell); }
  .eh-steps button.now { background: var(--teal); color: var(--teal-ink, #06231F); font-weight: 700; }
  .eh-steps button.done::after { content: " \\2713"; color: var(--good); font-weight: 700; }
  .eh-steps button.now.done::after { color: var(--teal-ink, #06231F); }
  .hero .eyebrow { display: none; }   /* the brand bar says Primary Mathematics now */
  @media (max-width: 720px) {
    .eh-progtext, .eh-brandtext { display: none; }
    .eh-bar2 { top: 52px; } .eh-steps { top: 100px; }
    .eh-picker { max-width: 130px; }
  }
"""

JS = """
  /* ================= the two header bars =================
     Everything here is answered by this page. The class controls are not
     painted here - they mount themselves into .top-actions on bar 2, and only
     when the server confirms a teacher is watching. */
  (function () {
    const earnable = slides.length - 1;            // teaching slides + the check
    const pctEl = $("ehPct"), fillEl = $("ehFill");
    function ehPaint() {
      const n = done.slice(0, earnable).filter(Boolean).length;
      const p = earnable ? Math.round((n / earnable) * 100) : 0;
      pctEl.textContent = p + "%";
      fillEl.style.width = p + "%";
      const box = $("ehSteps");
      if (box && !box.hidden) ehSteps();
    }
    function ehSteps() {
      $("ehSteps").innerHTML = slides.map(function (s, i) {
        const h = s.querySelector("h2");
        return '<button type="button" data-i="' + i + '" class="' +
          (i === cur ? "now " : "") + (done[i] ? "done" : "") + '">' +
          (i + 1) + ". " + (h ? h.textContent : "Step " + (i + 1)) + "</button>";
      }).join("");
    }
    $("ehSteps").addEventListener("click", function (e) {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      show(+b.dataset.i, true);
      $("ehSteps").hidden = true;
      $("ehMenu").setAttribute("aria-expanded", "false");
    });
    $("ehMenu").addEventListener("click", function () {
      const box = $("ehSteps"), open = box.hidden;
      if (open) ehSteps();
      box.hidden = !open;
      $("ehMenu").setAttribute("aria-expanded", open ? "true" : "false");
    });
    $("ehPicker").addEventListener("change", function (e) {
      if (e.target.value) location.href = e.target.value + location.search;
    });
    $("ehFull").addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
    document.addEventListener("fullscreenchange", function () {
      $("ehFull").innerHTML = document.fullscreenElement ? "\\u26f6 Leave full screen" : "\\u26f6 Full screen";
    });
    /* the voice toggle mutes what SHE says; it does not touch the Listen
       buttons, which a child presses on purpose */
    let muted = false;
    const realSay = say;
    say = function (t) { if (!muted) realSay(t); };
    $("ehAudio").addEventListener("click", function () {
      muted = !muted;
      if (muted && window.VOICE && VOICE.stop) VOICE.stop();
      $("ehAudio").setAttribute("aria-pressed", muted ? "true" : "false");
      $("ehAudio").title = muted ? "Turn the voice on" : "Turn the voice off";
    });
    /* every completion repaints the rail, so that is where the pill hangs */
    const realPaintDots = paintDots;
    paintDots = function () { realPaintDots(); ehPaint(); };
    const realShow = show;
    show = function (i, speak) { realShow(i, speak); ehPaint(); };
    ehPaint();
  })();
"""

HERO_HOST = re.compile(
    r'<div class="hero-right"><div class="top-actions"></div>(<nav class="dots"[^>]*></nav>)</div>')
# NOT the `slides` declaration: wire-progress.py's module reads the slides too,
# so that anchor matches two scripts. `done` is the lesson's own state array and
# nothing else declares it. The refusal above (found 2, want 1) is what a
# too-loose anchor looks like when it is caught rather than guessed at.
SLIDES_DECL = "const done = new Array(slides.length).fill(false)"


def bar_html(app, title, current):
    opts = "".join(
        '<option value="%s"%s>%s</option>' % (f, " selected" if f == current else "", t)
        for _, f, t in app.lessons)
    return (
        '\n<header class="eh-bar1">\n'
        '  <a class="eh-brand" href="index.html">%s<span class="eh-brandtext"><b>Ehel Academy</b><i>%s</i></span></a>\n'
        '  <div class="eh-prog" title="How much of this lesson you have finished">\n'
        '    <span class="eh-pct" id="ehPct">0%%</span>\n'
        '    <span class="eh-progtext">Lesson progress</span>\n'
        '    <span class="eh-track"><i id="ehFill"></i></span>\n'
        '  </div>\n'
        '  <div class="eh-b1right">\n'
        '    <span id="ehFocus" hidden></span>\n'
        '    <select class="eh-picker" id="ehPicker" aria-label="Choose a lesson">%s</select>\n'
        '    <button type="button" class="eh-icon" id="ehAudio" aria-pressed="false" title="Turn the voice off">♪</button>\n'
        '  </div>\n'
        '</header>\n'
        '<nav class="eh-bar2" aria-label="Lesson">\n'
        '  <a class="eh-round back" href="index.html" aria-label="Back to the lesson list">←</a>\n'
        '  <button type="button" class="eh-round" id="ehMenu" aria-expanded="false" aria-controls="ehSteps">☰ Menu</button>\n'
        '  <span class="eh-section">%s</span>\n'
        '  <span class="eh-b2right top-actions"><button type="button" class="eh-pill" id="ehFull">⛶ Full screen</button></span>\n'
        '</nav>\n'
        '<div class="eh-steps" id="ehSteps" hidden></div>\n'
        # "Primary <subject>" is right for the school builds and wrong for a
        # course that is not a school year at all: Intensive English is adult
        # ESL by CEFR level, and its bar read "Primary Intensive English". A
        # build may name its own line; every other one is unchanged.
        % (CREST, app.cfg.get("brandLine", "Primary %s" % app.subject_label), opts, title))


def patch(app, unit, name, title):
    s = app.read(name)
    if MARK in s:
        print("  skip %-26s already has the bars" % name)
        return True

    # 1 the heading, but only when it does not already name this lesson.
    m = re.search(r"<h1[^>]*>.*?</h1>", s, re.S)
    if not m:
        print("  REFUSED %-24s no <h1>" % name)
        return False
    heading = re.sub(r"<[^>]*>", "", m.group(0)).strip()
    renamed = ""
    if heading.lower() != title.lower():
        parts = title.split(" ")
        em = (" ".join(parts[:-1]) + " <em>" + parts[-1] + "</em>") if len(parts) > 1 else "<em>" + title + "</em>"
        s = s[:m.start()] + "<h1>" + em + "</h1>" + s[m.end():]
        renamed = "  h1 '%s' -> '%s'" % (heading[:22], title)

    i = s.rfind("</style>")
    if i < 0:
        print("  REFUSED %-24s no </style>" % name)
        return False
    s = s[:i] + CSS + s[i:]

    j = s.find('<div class="wrap">')
    if j < 0:
        print("  REFUSED %-24s no .wrap" % name)
        return False
    s = s[:j] + bar_html(app, title, name) + s[j:]

    # the controls host moves to bar 2; the hero goes back to a bare dot rail
    moved = ""
    if HERO_HOST.search(s):
        s = HERO_HOST.sub(r"\1", s, count=1)
        moved = "  controls -> bar 2"

    # the LESSON's IIFE, found by content. Taking the first <script> would land
    # in preload-platform.py's preconnect snippet in the head - see the note at
    # the top of this file.
    blocks = [b for b in re.finditer(r"<script[^>]*>(.*?)</script>", s, re.S)
              if SLIDES_DECL in b.group(1)]
    if len(blocks) != 1:
        print("  REFUSED %-24s found %d scripts declaring slides, want 1" % (name, len(blocks)))
        return False
    body = blocks[0].group(1)
    close = body.rfind("})();")
    if close < 0:
        print("  REFUSED %-24s no IIFE closer to insert before" % name)
        return False
    k = blocks[0].start(1) + close
    s = s[:k] + JS + "\n  " + s[k:]

    app.write(name, s)
    print("  ok   %-26s%s%s" % (name, renamed, moved))
    return True


def main():
    app = load()
    print("\n  Adding the header bars to %s %s\n" % (app.subject_label, app.grade_label))
    ok = all(patch(app, u, f, t) for u, f, t in app.lessons)
    print("\n  %s\n" % ("all %d have the bars" % len(app.lessons) if ok else "SOME FAILED - see above"))
    sys.exit(0 if ok else 1)


main()
