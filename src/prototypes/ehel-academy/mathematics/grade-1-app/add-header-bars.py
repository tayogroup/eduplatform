# -*- coding: utf-8 -*-
"""Give the seven Grade 1 Maths lessons the English shell's two header bars.

The honest subset (owner, 2026-09-06). Bar 1 carries the brand, lesson
progress, the lesson picker and the voice toggle; bar 2 carries back, Menu,
the lesson name and Full screen. Everything there is answered by the page
itself.

DELIBERATELY ABSENT: Join class, Class chat, Hand up, XP and the avatar.
All four need the signed launch token and the platform endpoints, which this
standalone build has neither of. course-app.js mounts Hand up only when the
server confirms a teacher is watching (`if (!state || !state.ok ||
!state.watched) return;`) precisely so a child cannot press a control that
reaches nobody and then wait instead of asking for help. Painting them here
would recreate that failure with no server to prevent it.

Also fixes the wrong <h1> in three lessons: the composer's rename regex was
`(<h1[^>]*>)[^<]*(</h1>)` and the headings contain markup
(`<h1>Up to <em>Twenty</em></h1>`), so it silently matched nothing. The tab
title was right, which is why a browser check reading document.title passed.
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.join(SP, "g1v2")

LESSONS = [
    ("counting-to-twenty.html", "Counting to Twenty"),
    ("adding-and-taking-away.html", "Adding and Taking Away"),
    ("halves-and-wholes.html", "Halves and Wholes"),
    ("what-comes-next.html", "What Comes Next"),
    ("shapes-and-sizes.html", "Shapes and Sizes"),
    ("days-months-and-clocks.html", "Days, Months and Clocks"),
    ("asking-and-sorting.html", "Asking and Sorting"),
]

CREST = ('<svg viewBox="0 0 24 26" aria-hidden="true"><path d="M12 1.5 21.5 5v8.5c0 5.4-4 9.3-9.5 11C6.5 22.8 2.5 18.9 2.5 13.5V5z" '
         'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>'
         '<path d="M12 7.2l1.5 3.1 3.4.5-2.4 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.4-2.4 3.4-.5z" fill="currentColor"></path></svg>')

CSS = """
  /* ---- the two header bars, modelled on the English shell ---- */
  .eh-bar1, .eh-bar2 { position: sticky; z-index: 40; display: flex; align-items: center; gap: 12px;
    background: var(--card); border-bottom: 1px solid var(--line); }
  .eh-bar1 { top: 0; padding: 8px 16px; }
  .eh-bar2 { top: 56px; padding: 8px 16px; background: var(--cell); }
  .eh-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); flex: 0 0 auto; }
  .eh-brand svg { width: 30px; height: 32px; color: var(--teal); display: block; }
  .eh-brandtext { display: flex; flex-direction: column; line-height: 1.15; }
  .eh-brandtext b { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
  .eh-brandtext i { font-style: normal; font-size: 12.5px; font-weight: 700; color: var(--teal); }
  .eh-prog { display: flex; align-items: center; gap: 9px; background: var(--cell); border: 1px solid var(--line);
    border-radius: 999px; padding: 5px 14px 5px 6px; flex: 1 1 auto; max-width: 420px; min-width: 0; }
  .eh-pct { background: var(--teal); color: #06231F; font-weight: 800; font-size: 13px; border-radius: 999px; padding: 4px 9px; }
  .eh-progtext { font-size: 13.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
  .eh-track { flex: 1 1 auto; height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; min-width: 40px; }
  .eh-track i { display: block; height: 100%; width: 0; background: var(--teal); border-radius: 999px; transition: width .3s ease; }
  .eh-b1right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .eh-picker { font: inherit; font-size: 14px; font-weight: 700; color: var(--ink); background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; padding: 8px 10px; max-width: 200px; }
  .eh-icon { width: 40px; height: 40px; border-radius: 999px; border: 1px solid var(--line); background: var(--card);
    color: var(--ink); font-size: 17px; cursor: pointer; }
  .eh-icon[aria-pressed="true"] { background: var(--cell); color: var(--muted); text-decoration: line-through; }
  .eh-round { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; border: none;
    background: var(--teal); color: #06231F; font: inherit; font-size: 15px; font-weight: 700; padding: 9px 15px;
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
  .eh-steps button.now { background: var(--teal); color: #06231F; font-weight: 700; }
  .eh-steps button.done::after { content: " \\2713"; color: var(--good); font-weight: 700; }
  .eh-steps button.now.done::after { color: #06231F; }
  .hero .eyebrow { display: none; }   /* the brand bar says Primary Mathematics now */
  @media (max-width: 720px) {
    .eh-progtext, .eh-brandtext { display: none; }
    .eh-bar2 { top: 52px; } .eh-steps { top: 100px; }
    .eh-picker { max-width: 130px; }
  }
"""


def bar_html(title, current):
    opts = "".join(
        '<option value="%s"%s>%s</option>' % (f, " selected" if f == current else "", t)
        for f, t in LESSONS)
    return (
 '\n<header class="eh-bar1">\n'
 '  <a class="eh-brand" href="index.html">%s<span class="eh-brandtext"><b>Ehel Academy</b><i>Primary Mathematics</i></span></a>\n'
 '  <div class="eh-prog" title="How much of this lesson you have finished">\n'
 '    <span class="eh-pct" id="ehPct">0%%</span>\n'
 '    <span class="eh-progtext">Lesson progress</span>\n'
 '    <span class="eh-track"><i id="ehFill"></i></span>\n'
 '  </div>\n'
 '  <div class="eh-b1right">\n'
 '    <select class="eh-picker" id="ehPicker" aria-label="Choose a lesson">%s</select>\n'
 '    <button type="button" class="eh-icon" id="ehAudio" aria-pressed="false" title="Turn the voice off">♪</button>\n'
 '  </div>\n'
 '</header>\n'
 '<nav class="eh-bar2" aria-label="Lesson">\n'
 '  <a class="eh-round back" href="index.html" aria-label="Back to the lesson list">←</a>\n'
 '  <button type="button" class="eh-round" id="ehMenu" aria-expanded="false" aria-controls="ehSteps">☰ Menu</button>\n'
 '  <span class="eh-section">%s</span>\n'
 '  <span class="eh-b2right"><button type="button" class="eh-pill" id="ehFull">⛶ Full screen</button></span>\n'
 '</nav>\n'
 '<div class="eh-steps" id="ehSteps" hidden></div>\n' % (CREST, opts, title))


JS = """
  /* ================= the two header bars =================
     Everything here is answered by this page. Join class, Class chat, Hand up
     and XP are deliberately absent: they need the launch token and the platform
     endpoints, and a control that reaches nobody is worse than no control. */
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


def em_title(t):
    """Match the hero's house style: the last word carries the <em>."""
    parts = t.split(" ")
    return " ".join(parts[:-1]) + " <em>" + parts[-1] + "</em>" if len(parts) > 1 else "<em>" + t + "</em>"


fails = 0
for fname, title in LESSONS:
    p = os.path.join(V2, fname)
    s = io.open(p, encoding="utf-8").read()
    orig = s

    # 1 the heading. The composer's regex could not span the <em>, so three
    #   lessons still show another lesson's name to the child.
    m = re.search(r"<h1[^>]*>.*?</h1>", s, re.S)
    if not m:
        print("  REFUSED %-30s no <h1>" % fname); fails += 1; continue
    before = re.sub(r"<[^>]*>", "", m.group(0)).strip()
    s = s[:m.start()] + "<h1>" + em_title(title) + "</h1>" + s[m.end():]

    # 2 css, appended to the last style block so nothing it overrides can win
    i = s.rfind("</style>")
    if i < 0:
        print("  REFUSED %-30s no </style>" % fname); fails += 1; continue
    s = s[:i] + CSS + s[i:]

    # 3 the bars, immediately before the page wrapper
    j = s.find('<div class="wrap">')
    if j < 0:
        print("  REFUSED %-30s no .wrap" % fname); fails += 1; continue
    s = s[:j] + bar_html(title, fname) + s[j:]

    # 4 the wiring. NOT before </script>: the whole lesson is wrapped in an
    #   IIFE, so appending there lands outside the closure and `slides`,
    #   `done`, `show` and `paintDots` are all out of scope. It goes just
    #   inside that IIFE's own closer instead.
    sm = re.search(r"<script[^>]*>(.*?)</script>", s, re.S)
    if not sm:
        print("  REFUSED %-30s no <script>" % fname); fails += 1; continue
    body = sm.group(1)
    close = body.rfind("})();")
    if close < 0:
        print("  REFUSED %-30s no IIFE closer to insert before" % fname); fails += 1; continue
    k = sm.start(1) + close
    s = s[:k] + JS + "\n  " + s[k:]

    if s == orig:
        print("  REFUSED %-30s nothing changed" % fname); fails += 1; continue
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  ok  %-30s h1 '%s' -> '%s'" % (fname, before[:22], title))

print("\n%s" % ("all seven patched" if not fails else "%d failed" % fails))
sys.exit(1 if fails else 0)
