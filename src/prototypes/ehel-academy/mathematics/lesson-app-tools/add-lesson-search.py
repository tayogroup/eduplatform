# -*- coding: utf-8 -*-
"""Put a lesson-content search field in bar 1, beside the lesson picker.

Asked for on 2026-09-12: standing in Grade 1 Maths, type "addition" or
"subtraction" and find the steps that teach it. WITHIN the grade - the picker
next to it already moves between that grade's lessons, and this searches
inside them.

RUN build-lesson-search.py FIRST. This tool refuses without its index, because
a field that cannot answer anything is worse than no field - the rule
`mountHandRaise` keeps, and the reason the hub picker is derived rather than
listed.

ONE MATCHER, TWO HOSTS. The same JS body goes into the hub and into every
lesson page. It tells them apart by asking the page rather than by being
configured: `typeof show === "function"` is true only inside a lesson's IIFE,
where this block is inserted, so on a lesson page a result in THIS lesson
moves the deck and everywhere else navigates. Two copies of a matcher would
drift, and the drift would be one host answering a query the other does not.

WHY THE MATCH IS WORD-PREFIX AND NOT A SUBSTRING. Measured on this build, a
substring search for "even" answers with "seven" and "eleven" - 20 slides,
almost all of them wrong. Tokenising and requiring each token to start a word
gives "even", "evening" and not "seven". It also makes "add" find "adding",
which is half of why the feature works at all; the other half is the term
expansion the index carries (see build-lesson-search.py).

THE LAUNCH PARAMETERS RIDE ALONG. A result navigates to
`file.html?from=<fromParam>&<the rest>#step-N`, the same carry the hub's own
lesson links perform. Dropping ?pwsToken would leave the learner in a page
whose work never reaches the school, and nothing on screen would say so.

`#step-N` IS N AS THE LEARNER COUNTS IT - the "Step 4 of 12" in bar 2, so a
link a teacher reads and a number a child says are the same. Deliberately not
the bare `#4` that app.config.json's explorationSteps uses for a slide INDEX:
one of them is 0-based and a URL is the wrong place to find out which.

WHAT A DEEP LINK DOES TO RESUME, which is why it calls show() early: on a
lesson page `__ehelRestore` moves a learner to their saved step only while
`untouched` (cur === 0 && !done[0]), so jumping to the step before the
progress document hydrates reads to it as a child who tapped Next, and it
leaves them where the link sent them. `#step-1` is the one case that still
loses to resume, and step 1 is where the lesson opens anyway.

ON A HUB WITH NO BAR IT BUILDS ONE. Mathematics is the subject whose hubs
carry no bar 1 at all ("nothing else on the page", its own comment says); the
owner's answer on 2026-09-12 was that there should be a bar for every grade
and subject, so a hub without one gets brand + search + the lesson picker.
The picker comes too because the request positions the search beside it, and
because it is what the other five subjects' hubs already show. NOT a course
progress bar: the other hubs' is wired by their own builders against the
progress document, and drawing an unwired one would be furniture claiming to
be a measurement.

    python ../lesson-app-tools/build-lesson-search.py
    python ../lesson-app-tools/add-lesson-search.py

Idempotent. Runs after add-header-bars.py, which is where bar 1 comes from.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

MARK = "ehFind"
INDEX = "lesson-search.json"

ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2.2" stroke-linecap="round" aria-hidden="true">'
        '<circle cx="10.5" cy="10.5" r="6.5"></circle>'
        '<path d="M15.4 15.4 21 21"></path></svg>')

# A magnifier drawn rather than typed: this build replaces emoji a school
# tablet cannot draw (see replace-new-emoji-all-grades.py and emojiBaseline),
# and the pages already carry inline SVG for every card mark.
FIELD = (
    '<label class="eh-find">' + ICON +
    '<input id="ehFind" type="search" autocomplete="off" spellcheck="false"'
    ' placeholder="Search the lessons" aria-label="Search the __GRADE__ __SUBJECT__ lessons"'
    ' aria-controls="ehFound" aria-expanded="false"></label>')

PANEL = ('<div class="eh-found" id="ehFound" hidden>'
         '<p class="eh-foundsay" id="ehFoundSay" role="status" aria-live="polite"></p>'
         '<div id="ehFoundList"></div></div>')

CSS = """
  /* ---- the lesson search, beside the picker - add-lesson-search.py ---- */
  .eh-find { display: inline-flex; align-items: center; gap: 6px; flex: 0 1 auto; min-width: 0;
    background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 0 10px; }
  .eh-find svg { width: 17px; height: 17px; color: var(--muted); flex: 0 0 auto; }
  .eh-find input { font: inherit; font-size: 14px; font-weight: 700; color: var(--ink);
    background: none; border: 0; padding: 8px 0; width: 148px; min-width: 0; }
  .eh-find input::placeholder { color: var(--muted); font-weight: 400; }
  .eh-find input:focus { outline: none; }
  .eh-find:focus-within { border-color: var(--teal); }
  .eh-find input::-webkit-search-cancel-button { filter: grayscale(1) brightness(2); }
  .eh-found { position: sticky; top: var(--eh-found-top, 104px); z-index: 41;
    background: var(--card); border-bottom: 1px solid var(--line);
    max-height: 62vh; overflow-y: auto; padding: 8px; }
  .eh-foundsay { margin: 2px 6px 8px; font-size: 13px; font-weight: 700; color: var(--muted); }
  .eh-found button { display: block; width: 100%; text-align: left; font: inherit;
    background: none; border: none; border-radius: 10px; padding: 9px 12px; cursor: pointer; color: var(--ink); }
  .eh-found button:hover, .eh-found button.sel { background: var(--cell); }
  .eh-found button.sel { outline: 2px solid var(--teal); outline-offset: -2px; }
  .eh-found .w { display: block; font-size: 12px; font-weight: 800; color: var(--teal);
    text-transform: uppercase; letter-spacing: .04em; }
  .eh-found .t { display: block; font-size: 16px; font-weight: 700; }
  .eh-found .s { display: block; font-size: 13px; color: var(--muted); font-weight: 400;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .eh-found mark { background: var(--gold); color: #2A1F05; border-radius: 3px; padding: 0 2px; }
  @media (max-width: 720px) {
    .eh-find input { width: 96px; }
    .eh-found { top: var(--eh-found-top-narrow, 100px); }
  }
"""

HUB_CSS = """
  /* ---- bar 1 on the hub - add-lesson-search.py ----
     Mathematics hubs carry no bar; the owner asked for one on every grade and
     subject (2026-09-12). Brand, search, picker: each is answered by this
     page. The other subjects' hubs also show course progress, which is wired
     by their own builders against the progress document - an unwired copy of
     it here would be a measurement nobody took. */
  .eh-bar1 { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 12px;
    padding: 8px 16px; min-height: 52px; background: var(--card);
    border-bottom: 1px solid var(--line); backdrop-filter: blur(6px);
    --eh-found-top: 56px; --eh-found-top-narrow: 56px; }
  .eh-bar1 .eh-brand { display: flex; align-items: center; gap: 9px; color: var(--ink);
    text-decoration: none; flex: 0 0 auto; }
  .eh-crest { width: 32px; height: 32px; border-radius: 8px; flex: 0 0 auto; }
  .eh-brandtext { display: flex; flex-direction: column; line-height: 1.15; }
  .eh-brandtext b { font-size: 14.5px; font-weight: 800; }
  .eh-brandtext i { font-style: normal; font-size: 12.5px; font-weight: 700; color: var(--teal); }
  .eh-b1right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex: 0 1 auto; min-width: 0; }
  .eh-picker { font: inherit; font-size: 14px; font-weight: 700; color: var(--ink); background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; padding: 8px 10px; max-width: 200px; }
  @media (max-width: 720px) {
    .eh-brandtext { display: none; }
    .eh-picker { max-width: 120px; }
  }
"""

JS = """
  /* ================= the lesson search ================= ehel-lesson-search
     One body, two hosts - see add-lesson-search.py. Everything it knows comes
     from lesson-search.json, which is derived from these very pages. */
  (function () {
    var box = document.getElementById("ehFind");
    var panel = document.getElementById("ehFound");
    var say = document.getElementById("ehFoundSay");
    var list = document.getElementById("ehFoundList");
    if (!box || !panel || !say || !list) return;

    var HERE = (location.pathname.split("/").pop() || "");
    var INDEX = null, STATE = "cold", sel = -1, rows = [];
    var esc = function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    };
    /* the curly apostrophe is normalised in the index too, so o’clock and
       o'clock are one word to both sides */
    var flat = function (s) { return String(s).replace(/\\u2019/g, "'").toLowerCase(); };
    var toks = function (s) { return flat(s).match(/[a-z0-9']+/g) || []; };

    /* KEEP THE LAUNCH PARAMETERS. ?from is ours and is put back; everything
       else - pwsToken, pwsEndpoint, studentid - belongs to the launch and a
       result that dropped it would report nothing to the school. */
    function query() {
      var p = new URLSearchParams(location.search);
      p.delete("from");
      var rest = p.toString();
      return "?from=__FROM__" + (rest ? "&" + rest : "");
    }

    /* WAITERS, not an early return. The focus handler starts this fetch with
       nothing to do on arrival, and the first keystroke lands while it is
       still in flight - so a `if (STATE === "loading") return` DROPS that
       query's callback and the panel never opens. Measured: typing "addition"
       on a cold field, index fetched 200, nothing rendered. */
    var waiting = [];
    function load(then) {
      if (STATE === "ready") { then(); return; }
      waiting.push(then);
      if (STATE === "loading") return;
      STATE = "loading";
      fetch("__INDEX__", { credentials: "omit" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (doc) {
          INDEX = [];
          (doc.lessons || []).forEach(function (l) {
            (l.steps || []).forEach(function (s) {
              INDEX.push({
                file: l.file, title: l.title, unit: l.u, i: s.i, h: s.h, t: s.t,
                wh: toks(s.h), wt: toks(s.t),
                wgh: toks(s.gh || ""), wg: toks(s.g || ""),
                gm: s.gm || {}
              });
            });
          });
          STATE = "ready";
          var q = waiting; waiting = [];
          q.forEach(function (f) { f(); });
        })
        .catch(function () {
          STATE = "cold";
          waiting = [];
          /* honest rather than silent: the field stays, and says why it
             cannot answer, because the usual cause is a page opened before
             the index landed and a reload fixes it */
          say.textContent = "The lesson list could not be loaded. Try again in a moment.";
          list.innerHTML = "";
          open(true);
        });
    }

    /* every token must START a word somewhere. Four tiers, best first:
         the step's HEADING says it                       ("Adding")
         the heading IMPLIES it                           ("Adding" -> addition)
         a sentence in the step implies it                (a mention)
         the step's own words say it somewhere
       The middle tier is what puts Adding and Taking Away above a counting
       step that happens to say "add" once - see build-lesson-search.py. */
    /* BOTH directions, or the plural of a term finds nothing. Measured: the
       one-way version (content word starts with the query) answered
       "fractions" with "No step in Grade 1 Mathematics mentions fractions"
       while Halves and Wholes IS the fractions lesson - the tag is
       "fraction", singular - and answered "sorting" with one step while the
       lessons say "sort".

       But a bare reverse prefix is too much: it made "tally" match "tall"
       and answer with Full and empty, Longer or shorter? and Pour and fill,
       where the correct answer is that Grade 1 teaches no tallying. Every
       case the reverse direction is FOR is a suffix inflection, so that is
       what it allows - "sort"+ing, "fraction"+s - and "tall"+y is not one. */
    var SUFFIX = { s: 1, es: 1, ing: 1, ed: 1 };
    function starts(words, k) {
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (w === k) return 2;
        if (w.length > k.length && w.lastIndexOf(k, 0) === 0) return 1;
        if (w.length >= 3 && k.length > w.length && k.lastIndexOf(w, 0) === 0
            && SUFFIX[k.slice(w.length)]) return 1;
      }
      return 0;
    }
    function score(row, ks) {
      var total = 0;
      for (var i = 0; i < ks.length; i++) {
        var k = ks[i];
        var h = starts(row.wh, k);
        var gh = h ? 0 : starts(row.wgh, k);
        var g = (h || gh) ? 0 : starts(row.wg, k);
        var t = (h || gh || g) ? 0 : starts(row.wt, k);
        if (!h && !gh && !g && !t) return 0;   // every token must appear
        total += h ? 12 + h : gh ? 8 + gh : g ? 4 + g : 1 + t;
      }
      return total;
    }
    /* WHAT THE QUERY MATCHED, in the step's own words. A bridged term is not
       in the text - "addition" is why the bridge exists - so fall back to the
       phrase the index recorded for that term ("adding"), and the panel then
       marks the words that actually answered the query instead of rendering
       an unmarked opening line. */
    function target(row, k) {
      var low = flat(row.t), p = low.indexOf(k);
      if (p >= 0) return [p, k];
      for (var name in row.gm) {
        if (starts([name], k)) {
          var w = flat(row.gm[name]), q = low.indexOf(w);
          if (q >= 0) return [q, w];
        }
      }
      return [-1, ""];
    }
    function snippet(row, ks) {
      var low = flat(row.t), at = -1, hit = "";
      for (var i = 0; i < ks.length; i++) {
        var r = target(row, ks[i]), p = r[0];
        if (p >= 0 && (at < 0 || p < at)) { at = p; hit = r[1]; }
      }
      if (at < 0) return esc(row.t.slice(0, 90));
      var a = Math.max(0, at - 34), b = Math.min(row.t.length, at + 60);
      var end = low.indexOf(" ", at + hit.length);
      var word = row.t.slice(at, end > at && end < at + 24 ? end : at + hit.length);
      return (a ? "\\u2026" : "") + esc(row.t.slice(a, at)) + "<mark>" + esc(word) + "</mark>" +
        esc(row.t.slice(at + word.length, b)) + (b < row.t.length ? "\\u2026" : "");
    }

    function open(on) {
      panel.hidden = !on;
      box.setAttribute("aria-expanded", on ? "true" : "false");
      if (!on) { sel = -1; }
    }
    function go(row) {
      /* in THIS lesson: move the deck, and put the step in the URL without a
         hashchange, so the address bar is shareable and nothing runs twice */
      if (row.file === HERE && typeof show === "function") {
        open(false);
        show(row.i, true);
        try { history.replaceState(null, "", query() + "#step-" + (row.i + 1)); } catch (e) {}
        return;
      }
      location.href = row.file + query() + "#step-" + (row.i + 1);
    }
    function paint(ks) {
      rows.sort(function (a, b) {
        return b._s - a._s || a.unit - b.unit || a.i - b.i;
      });
      rows = rows.slice(0, 30);
      list.innerHTML = rows.map(function (r, n) {
        return '<button type="button" data-n="' + n + '">' +
          '<span class="w">' + esc(r.title) + " \\u00b7 Step " + (r.i + 1) + "</span>" +
          '<span class="t">' + esc(r.h || "Step " + (r.i + 1)) + "</span>" +
          '<span class="s">' + snippet(r, ks) + "</span></button>";
      }).join("");
      sel = -1;
    }
    function run() {
      var ks = toks(box.value).filter(function (k) { return k.length > 1; });
      if (!ks.length) { open(false); list.innerHTML = ""; say.textContent = ""; return; }
      rows = [];
      for (var i = 0; i < INDEX.length; i++) {
        var s = score(INDEX[i], ks);
        if (s) { INDEX[i]._s = s; rows.push(INDEX[i]); }
      }
      var n = rows.length;
      paint(ks);
      /* the count is the honest part: "no step" names what was searched, so a
         word this grade never teaches reads as absent rather than broken */
      say.textContent = n
        ? n + (n === 1 ? " step" : " steps") + " in this grade" + (n > 30 ? " - showing 30" : "")
        : "No step in " + "__GRADELABEL__" + " mentions \\u201c" + box.value.trim() + "\\u201d.";
      open(true);
    }

    var wait = null;
    box.addEventListener("input", function () {
      clearTimeout(wait);
      wait = setTimeout(function () { load(run); }, 90);
    });
    box.addEventListener("focus", function () { load(function () {}); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { open(false); box.blur(); return; }
      var bs = list.querySelectorAll("button");
      if (!bs.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        sel = e.key === "ArrowDown"
          ? (sel + 1) % bs.length
          : (sel <= 0 ? bs.length - 1 : sel - 1);
        for (var i = 0; i < bs.length; i++) bs[i].classList.toggle("sel", i === sel);
        bs[sel].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(rows[sel < 0 ? 0 : sel]);
      }
    });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-n]");
      if (b) go(rows[+b.dataset.n]);
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !box.closest(".eh-find").contains(e.target)) open(false);
    });

    /* ---- arriving on a deep link ----
       Only a lesson page can act on one. show() is called now, BEFORE the
       progress document hydrates, because __ehelRestore moves only a learner
       who has not moved themselves - so this reads to it as a tap on Next and
       the link is not overridden by the saved resume step. */
    function fromHash() {
      var m = /^#step-(\\d+)$/.exec(location.hash || "");
      if (!m || typeof show !== "function") return;
      var n = +m[1] - 1;
      if (n >= 0) show(n, false);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
  })();
"""

BAR_RIGHT = re.compile(r'(<div class="eh-b1right">\s*(?:<span id="ehFocus" hidden></span>\s*)?)')
STEPS_PANEL = '<div class="eh-steps" id="ehSteps" hidden></div>'
SLIDES_DECL = "const done = new Array(slides.length).fill(false)"


def fill(s, app):
    return (s.replace("__FROM__", app.from_param)
             .replace("__INDEX__", INDEX)
             .replace("__GRADE__", app.grade_label)
             .replace("__GRADELABEL__", app.grade_label + " " + app.subject_label)
             .replace("__SUBJECT__", app.subject_label))


def add_css(s, css, name):
    i = s.rfind("</style>")
    if i < 0:
        print("  REFUSED %-26s no </style>" % name)
        return None
    return s[:i] + css + s[i:]


def patch_lesson(app, name):
    s = app.read(name)
    if MARK in s:
        print("  skip %-26s already has the search" % name)
        return True
    if 'class="eh-bar1"' not in s:
        print("  REFUSED %-23s no bar 1 - run add-header-bars.py first" % name)
        return False

    s = add_css(s, fill(CSS, app), name)
    if s is None:
        return False

    m = BAR_RIGHT.search(s)
    if not m:
        print("  REFUSED %-23s no .eh-b1right to put the field in" % name)
        return False
    s = s[:m.end()] + fill(FIELD, app) + s[m.end():]

    j = s.find(STEPS_PANEL)
    if j < 0:
        print("  REFUSED %-23s no #ehSteps panel to sit beside" % name)
        return False
    s = s[:j + len(STEPS_PANEL)] + "\n" + PANEL + s[j + len(STEPS_PANEL):]

    # the LESSON's IIFE, by content, exactly as add-header-bars.py finds it -
    # the first <script> is preload-platform.py's preconnect snippet, and
    # `slides` alone matches wire-progress.py's module too
    blocks = [b for b in re.finditer(r"<script[^>]*>(.*?)</script>", s, re.S)
              if SLIDES_DECL in b.group(1)]
    if len(blocks) != 1:
        print("  REFUSED %-23s found %d scripts declaring slides, want 1"
              % (name, len(blocks)))
        return False
    body = blocks[0].group(1)
    close = body.rfind("})();")
    if close < 0:
        print("  REFUSED %-23s no IIFE closer to insert before" % name)
        return False
    k = blocks[0].start(1) + close
    s = s[:k] + fill(JS, app) + "\n  " + s[k:]

    app.write(name, s)
    print("  ok   %-26s field + panel + deep link" % name)
    return True


def patch_hub(app):
    name = app.hub
    s = app.read(name)
    if MARK in s:
        print("  skip %-26s already has the search" % name)
        return True

    made_bar = 'class="eh-bar1"' not in s
    s = add_css(s, fill(CSS, app) + (HUB_CSS if made_bar else ""), name)
    if s is None:
        return False

    if made_bar:
        opts = "".join('<option value="%s">%s</option>' % (f, t)
                       for _, f, t in app.lessons)
        bar = ('\n<header class="eh-bar1">\n'
               '  <img class="eh-crest" src="../../shared/ehel-academy-logo.png" alt=""'
               ' width="32" height="32" decoding="async">\n'
               '  <span class="eh-brandtext"><b>Ehel Academy</b><i>Primary '
               + app.subject_label + '</i></span>\n'
               '  <div class="eh-b1right">' + fill(FIELD, app) +
               '<select class="eh-picker" id="ehPicker" aria-label="Choose a lesson">'
               '<option value="" selected>Jump to a lesson…</option>' + opts +
               '</select></div>\n'
               '</header>\n' + PANEL + '\n')
        j = s.find('<div class="wrap">')
        if j < 0:
            print("  REFUSED %-23s no .wrap to put the bar before" % name)
            return False
        s = s[:j] + bar + s[j:]
        # the hub has no lesson IIFE, so the picker needs its own handler; it
        # carries the launch parameters the way this hub's own link carrier does
        hub_js = ('\n<script>\n'
                  '  /* the hub’s lesson picker - add-lesson-search.py */\n'
                  '  (function () {\n'
                  '    var p = document.getElementById("ehPicker");\n'
                  '    if (!p) return;\n'
                  '    p.addEventListener("change", function () {\n'
                  '      if (!p.value) return;\n'
                  '      var q = new URLSearchParams(location.search);\n'
                  '      q.delete("from");\n'
                  '      var rest = q.toString();\n'
                  '      location.href = p.value + "?from=' + app.from_param +
                  '" + (rest ? "&" + rest : "");\n'
                  '    });\n'
                  '  })();\n'
                  '</script>\n')
        s = s + hub_js
    else:
        m = BAR_RIGHT.search(s)
        if not m:
            print("  REFUSED %-23s bar 1 with no .eh-b1right" % name)
            return False
        s = s[:m.end()] + fill(FIELD, app) + s[m.end():]
        k = s.find("</header>", m.end())
        if k < 0:
            print("  REFUSED %-23s no </header> after bar 1" % name)
            return False
        s = s[:k + 9] + "\n" + PANEL + s[k + 9:]

    s = s + fill('<script>\n' + JS + '</script>\n', app)
    app.write(name, s)
    print("  ok   %-26s %s" % (name, "new bar 1 + field" if made_bar else "field into bar 1"))
    return True


def main():
    app = load()
    for a in sys.argv[1:]:
        if a != "--app" and not os.path.isdir(a):
            sys.exit("  REFUSED unknown argument %r" % a)
    print("\n  Lesson search for %s %s\n" % (app.subject_label, app.grade_label))
    if not os.path.isfile(app.path(INDEX)):
        sys.exit("  REFUSED no %s. Run build-lesson-search.py first - a field\n"
                 "          with no index answers nothing and says nothing.\n" % INDEX)
    ok = all([patch_lesson(app, f) for _, f, _ in app.lessons] + [patch_hub(app)])
    print("\n  %s\n" % ("the hub and all %d lessons can search" % len(app.lessons)
                        if ok else "SOME FAILED - see above"))
    sys.exit(0 if ok else 1)


main()
