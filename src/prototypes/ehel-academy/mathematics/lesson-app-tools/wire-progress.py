# -*- coding: utf-8 -*-
"""Make a standalone lesson build REPORT. Until this ran, none of them did.

The Grade 1 README called it "the open question for both builds": no
gradebook, no live-group-board position, no study plan. The consequence was
not abstract - a teacher opening the board during a session saw their Grade 1
maths learners with no app activity at all, not because they were idle but
because the build they are on says nothing. The board's whole sort is "time
since this learner's app last reported", so a silent build renders its
learners as GONE.

Nothing here is a new progress system. The page imports the SAME
shared/progress-client.js every other course writes through, deployed beside
the lessons, and emits the same four event types the shell emits:

  section.completed   durable, posts immediately
  unit.completed      durable
  progress.summary    state - WHERE the learner is, flushed at once (below)
  checkpoint.result   a scored step or ONE ACTIVITY INSIDE ONE, via
                      window.__ehelScore(i, right, total, sub, subTitle) - the
                      only event that becomes a MARK a teacher or parent reads,
                      and the only one the gradebook takes
  attempted           participation without a score, via
                      window.__ehelAttempt(i, answered, total, noun); rides on
                      progress.summary, capped at 20 sections by the server.
                      Carries the learner's own caption for the step and the
                      noun the two numbers count, because the section id is a
                      position and cannot be named server-side
  knownWords          via window.__ehelKnown(words); rides on the summary too

POSITION IS FLUSHED, NOT LEFT TO THE IDLE TIMER. `progress.summary` is a
"state" event and waits up to 20 seconds for a quiet moment, which is right
for resume-across-devices and wrong for a board asking where a learner is
right now. course-app.js learned this on production - a learner moved through
a unit for 14 minutes while the server's pointer sat on the section they had
last COMPLETED. flush() coalesces onto any in-flight request, so clicking
quickly through five steps is one or two POSTs, not five.

=========================== THE UNIT PROBLEM ===========================

These lessons DO NOT map onto the course's units, and this tool deliberately
does not pretend they do.

  shell course     15 units per grade, term-ordered
                   (g02 u01 "Numbers to 100" ... u15 "Symmetry, Position
                   and Movement")
  this build        9 lessons, organised by STRAND
                   ("Tens and Ones" covers u01, u05, u08 and u10)

So emitting `u01` for lesson 1 would write a Grade 2 learner's work into the
slot the gradebook reads as "Numbers to 100" completed - a claim about
curriculum coverage that nobody measured and that is wrong in both
directions. Instead this writes into its own unit namespace, `l01`..`lNN`,
under the SAME course key and student id the shell uses.

What that buys and what it does not:

  buys   the live group board works - timestamps, position, resumeLabel,
         done-counts, the activity ring. Resume across devices works.
  not    the gradebook does not see 15 units' worth of completion, because
         these 9 lessons are not those 15 units.

Mapping lessons onto course units is a curriculum decision, not a wiring one,
and it belongs to whoever owns the Cambridge alignment. When it is made, it
is `unitFor()` below and nothing else.

Idempotent.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

MARK = "wire-progress.py"

# `function finish(i, msg) { ... }` and `function show(i, speak) {` are each
# declared exactly once per lesson. Anchored on the whole signature so a
# refactor that changes them fails loudly rather than being patched blindly.
FINISH = re.compile(
    r"(function finish\(i, msg\) \{ if \(!done\[i\]\) \{ done\[i\] = true; paintDots\(\); \} )"
)
SHOW_TAIL = re.compile(r"(\n    window\.scrollTo\(\{ top: 0, behavior: \"smooth\" \}\);\n  \})")

# Everything a page needs to RESUME, kept as constants because two paths
# install it: wire() for a fresh page, upgrade() for a page wired before the
# hook existed (2026-09-10). The upgrade anchors on the exact text the older
# tool wrote, so a page it cannot recognise is refused, never guessed at.
RESTORE_HOOK = (
        '  /* RESUME ON REOPEN. The stored record already knew which steps were\n'
        '     done and where the learner was; until this hook every reopened\n'
        '     lesson drew an empty dot rail and step 1. Called once, after the\n'
        '     progress document hydrates, and only if the learner has not already\n'
        '     moved off step 1 on their own - hydrate is asynchronous and a child\n'
        '     who tapped Next is not to be yanked back. show() is looked up by\n'
        '     name at call time, so every wrapper the build or the pipeline puts\n'
        '     around it (the header bar\\x27s percentage, a step\\x27s arrival line)\n'
        '     runs exactly as it does for a tap on a dot. */\n'
        '  window.__ehelRestore = function (doneIdx, resumeIdx) {\n'
        '    /* read BEFORE the ticks land: the record\\x27s own step 1 must not\n'
        '       count as the learner having touched it (measured: it did, and the\n'
        '       page stayed on step 1 with the dots restored) */\n'
        '    const untouched = cur === 0 && !done[0];\n'
        '    let changed = false;\n'
        '    for (const i of doneIdx || []) { if (i >= 0 && i < done.length - 1 && !done[i]) { done[i] = true; changed = true; } }\n'
        '    if (changed) paintDots();\n'
        '    const target = Number.isInteger(resumeIdx) && resumeIdx > 0 && resumeIdx < slides.length\n'
        '      ? resumeIdx : done.findIndex((d, i) => !d && i < done.length - 1);\n'
        '    if (untouched && target > 0) show(target, false);\n'
        '    else if (changed) show(cur, false);\n'
        '  };'
)

OLD_HYDRATE = """  let baseAttempted = {};
  let baseKnown = [];
  (async () => {
    try {
      const doc = await ws.hydrate();
      const u = doc && doc.units && doc.units[UNIT];
      if (!u) return;
      if (u.attempted && typeof u.attempted === "object") baseAttempted = u.attempted;
      if (Array.isArray(u.knownWords)) baseKnown = u.knownWords;
    } catch (_) { /* never break the lesson */ }
  })();
"""

NEW_HYDRATE = """  let baseAttempted = {};
  let baseKnown = [];
  /* step-NN -> the slide's 0-based index; anything else -> -1 */
  const indexOf = (id) => {
    const m = /^step-(\\d{2})$/.exec(String(id || ""));
    return m ? Number(m[1]) - 1 : -1;
  };
  (async () => {
    try {
      const doc = await ws.hydrate();
      const u = doc && doc.units && doc.units[UNIT];
      if (!u) return;
      if (u.attempted && typeof u.attempted === "object") baseAttempted = u.attempted;
      if (Array.isArray(u.knownWords)) baseKnown = u.knownWords;
      /* RESUME. The sections the record says are done are done - seeded into
         doneIds too, so unit.completed still fires on the day the LAST step
         is finished even if the first seven were finished last week - and
         the deck is told to tick them and open where the learner was. Without
         this a child who closed the tab reopened to an empty dot rail and
         step 1, while the school's record said otherwise; measured on the
         Science build on 2026-09-10, and true of every build this tool wires. */
      const doneIdx = (Array.isArray(u.sectionsDone) ? u.sectionsDone : []).map(indexOf).filter((i) => i >= 0);
      for (const i of doneIdx) doneIds.add(sectionId(i));
      const resumeIdx = indexOf(u.resume);
      if (window.__ehelRestore && (doneIdx.length || resumeIdx > 0)) {
        try { window.__ehelRestore(doneIdx, resumeIdx); } catch (_) { /* never break the lesson */ }
      }
    } catch (_) { /* never break the lesson */ }
  })();

"""


JS = """
<script type="module">
  /* Progress reporting - see lesson-app-tools/wire-progress.py, especially
     THE UNIT PROBLEM for why this writes l%s and not u%s. */
  import { createProgressClient } from "./progress-client.js";

  const q = new URLSearchParams(location.search);
  const endpoint = (q.get("pwsEndpoint") || "").trim();
  const token = (q.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");

  const COURSE = "__COURSE__";
  const UNIT = "__UNIT__";
  const STUDENT = q.get("studentid") || "local";

  /* Without a launch endpoint the backend is "local": everything still
     reduces into localStorage so resume works, and nothing is sent. That is
     the same rule the shell follows, and it is why opening a lesson as a file
     or an artifact costs nothing and reports nothing. */
  const ws = createProgressClient({
    course: COURSE, student: STUDENT,
    backend: endpoint ? "remote" : "local",
    endpoint: endpoint || undefined,
    token: token || undefined,
    /* A blocked or expired write path is INVISIBLE otherwise - the throw is
       caught, the events queue, and the learner is told nothing while their
       work stops reaching the school. Said on the learner's own screen
       because the server cannot tell a blocked learner from a closed tab. */
    onAuthLost: () => notice("Your session has expired. Your work is saved on this device \\u2014 open the lesson again from your class page."),
    onDeliveryFailing: () => notice(navigator.onLine
      ? "Your work is saved here, but it is not reaching your school right now."
      : "You are offline. Your work is saved here and will be sent when you are back."),
    onDeliveryRecovered: () => clearNotice(),
  });

  const emit = (e) => { try { ws.emit(e); } catch (_) { /* never break the lesson */ } };

  let noticeEl = null;
  function notice(text) {
    if (!noticeEl) {
      noticeEl = document.createElement("p");
      noticeEl.className = "progress-notice";
      noticeEl.setAttribute("role", "status");
      document.querySelector(".wrap")?.prepend(noticeEl);
    }
    noticeEl.textContent = text;
  }
  function clearNotice() { if (noticeEl) { noticeEl.remove(); noticeEl = null; } }

  const slides = [...document.querySelectorAll(".slide")];
  /* The lesson's own arithmetic: show() prints "Step n of slides.length - 1",
     so the last slide is the sticker shelf and not a step. Read from the
     lesson rather than counted here, so the two cannot disagree. */
  const STEPS = Math.max(1, slides.length - 1);
  const sectionId = (i) => "step-" + String(i + 1).padStart(2, "0");
  const labelOf = (i) => (slides[i]?.querySelector("h2")?.textContent || "").trim() || sectionId(i);

  const doneIds = new Set();
  let unitSent = false;

  /* WHERE the learner is, which is not what sectionsDone says: a learner
     stuck twenty minutes into the next step is exactly the one a supervising
     teacher needs to see. `resumeLabel` rides beside the id because a board
     printing "step-04" shows a teacher a word that appears nowhere on the
     child's screen. */
  /* Activity-level participation, {section: {answered, total}}, and the words
     the learner has shown they know. Both ride on progress.summary because the
     reducer keeps them there and nowhere else; both are whole-map
     last-write-wins, so every summary sends everything known so far rather
     than a delta that could strand a count.

     The server caps `attempted` at 20 sections and requires
     ^[a-z0-9][a-z0-9_-]{0,39}$ - no dots, no slashes - so ids are kept in that
     shape here rather than being rejected silently there. */
  const attempted = {};
  const known = new Set();
  let lastAt = 0;

  /* WHAT THE RECORD ALREADY HOLDS FOR THIS UNIT, read once at load.

     Both maps above are REPLACED by the reducer, not merged, and both start
     empty on every page load - so without this the first participation event
     of a new session deletes every section reported in an earlier one. A child
     who read four books on Monday and answered one question on Tuesday would
     have Monday erased by Tuesday's first tick.

     It is kept SEPARATE from the live maps rather than copied into them,
     because hydrate is asynchronous and a report can fire before it lands.
     Merged at send time, an early report sends a partial map and the next one
     repairs it; a seed would simply have missed the window. If hydrate cannot
     be reached at all the baseline stays empty, which is the behaviour without
     it. */
""" + NEW_HYDRATE + """
  function report(i) {
    lastAt = i;
    const ev = {
      type: "progress.summary", unit: UNIT,
      sectionsDone: [...doneIds],
      resume: sectionId(i), resumeLabel: labelOf(i),
      xp: doneIds.size,
    };
    /* This session's answers WIN over the stored ones for the same section -
       a child who re-does a step is telling us something newer. */
    const allAttempted = { ...baseAttempted, ...attempted };
    const allKnown = new Set([...baseKnown, ...known]);
    if (Object.keys(allAttempted).length) ev.attempted = allAttempted;
    if (allKnown.size) ev.knownWords = [...allKnown];
    emit(ev);
    try { ws.flush?.(); } catch (_) { /* never break the lesson */ }
  }

  window.__ehelStep = function (i, done) {
    const id = sectionId(i);
    if (!doneIds.has(id)) {
      doneIds.add(id);
      emit({ type: "section.completed", unit: UNIT, section: id, title: labelOf(i) });
    }
    if (!unitSent && doneIds.size >= STEPS) {
      unitSent = true;
      emit({ type: "unit.completed", unit: UNIT, sectionsDone: [...doneIds], total: STEPS });
    }
    report(i);
  };
  window.__ehelAt = function (i) { lastAt = i; report(i); };

  /* A SCORE, where a step actually produces one.
     checkpoint.result is the only event the reducer turns into something a
     teacher or a parent can read as a mark - the portal's quiz tables and the
     gradebook are both fed from it - and nothing here emitted it, so every
     scored step reported that it was DONE and never how it went.

     ADDITIVE ON PURPOSE. A lesson that never calls this behaves exactly as it
     did, which is what makes it safe in a tool three builds share.

     ONLY WHERE THERE IS A REAL DENOMINATOR. `total` must be the number of
     questions asked; a step that cannot say how many it asked must not call
     this, because a score with an invented denominator is a mark nobody
     measured. Play is deliberately excluded for the same reason the rollup
     drops the Quran app's `games` star counts: a game is for practising. */
  window.__ehelScore = function (i, right, total, sub, subTitle) {
    const n = Number(total) || 0;
    const got = Math.max(0, Math.min(Number(right) || 0, n));
    if (!n) return;
    /* `sub` gives ONE ACTIVITY INSIDE A STEP its own row - a single game out
       of the twelve, say. The reducer keys checkpoints by this string and does
       not validate it, so it is normalised here: lower case, hyphens only, and
       short enough to read in a portal table. */
    const key = sub
      ? sectionId(i) + "-" + String(sub).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28)
      : sectionId(i);
    emit({
      type: "checkpoint.result", unit: UNIT, section: key,
      title: subTitle ? labelOf(i) + ": " + subTitle : labelOf(i),
      score: Math.round((got / n) * 100), correct: got, total: n,
    });
    try { ws.flush?.(); } catch (_) { /* never break the lesson */ }
  };

  /* PARTICIPATION where there is no score to give. "8 of 12 activities
     ticked" is a real fact about a learner and is not a mark; sending it as a
     checkpoint would put a percentage on work nobody assessed, which is the
     thing the rollup already refuses to do for the Quran app's game stars. */
  window.__ehelAttempt = function (i, answered, total, noun) {
    const n = Number(total) || 0;
    if (!n) return;
    /* WHAT THIS IS CALLED, and what the two numbers count. The section id is a
       POSITION here - `step-08` - and the same position is a different
       activity in each app sharing this pipeline, so no reader of the stored
       document can name it. `labelOf(i)` is the caption the learner is looking
       at, the same one resumeLabel carries for the same reason: a surface
       printing the id names a section nobody can find.

       The noun is passed by the call site because only it knows: books, words,
       rules, seconds. Both are optional and the server bounds them. */
    attempted[sectionId(i)] = {
      answered: Math.max(0, Math.min(Number(answered) || 0, n)),
      total: n,
      label: labelOf(i),
      ...(noun ? { noun: String(noun) } : {}),
    };
    report(i);
  };

  /* Words the learner has shown they know, by tapping the right one when it
     was said or pictured. A set, so hearing the same word in two steps counts
     once, and the summary sends the whole list because the reducer replaces
     rather than merges. */
  window.__ehelKnown = function (words) {
    const list = Array.isArray(words) ? words : [words];
    let added = false;
    for (const w of list) {
      const t = String(w || "").trim().toLowerCase();
      if (t && !known.has(t)) { known.add(t); added = true; }
    }
    // `cur` belongs to the deck's IIFE and this block is a separate module,
    // so it is not in scope here - reading it would throw. The last position
    // the deck told us about is, and that is the honest answer anyway.
    if (added) report(lastAt);
  };
</script>
"""

CSS = """
  /* --- said on the learner's own screen when their work is not reaching the
         school; see lesson-app-tools/wire-progress.py --- */
  .progress-notice {
    margin: 0 0 12px; padding: 10px 14px;
    border-radius: 12px;
    background: var(--bad-soft); border: 1px solid var(--bad);
    color: var(--ink);
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: 14px; font-weight: 600;
  }
"""


def upgrade(app, name, s):
    """A page wired before 2026-09-10 reports but does not resume: it reads
    the record back for its attempted/knownWords baseline and ignores
    sectionsDone and resume. Add the hook after show() and swap the hydrate
    block, anchored on the exact text the older tool wrote. Nothing else on
    the page moves, so a build's owner can bring it up to date without a
    rebuild - and without this path the gate's new assertion would turn every
    older build red with no way to green it but a from-scratch rebuild."""
    anchor = '    if (window.__ehelAt) { try { window.__ehelAt(cur); } catch (_) {} }\n  }'
    if s.count(anchor) != 1:
        print("  REFUSED %-24s wired, but show() is not the shape this upgrades (%d matches)" % (name, s.count(anchor)))
        return False
    if s.count(OLD_HYDRATE) != 1:
        print("  REFUSED %-24s wired, but the hydrate block is not the shape this upgrades (%d matches)" % (name, s.count(OLD_HYDRATE)))
        return False
    s = s.replace(anchor, anchor + RESTORE_HOOK, 1).replace(OLD_HYDRATE, NEW_HYDRATE, 1)
    app.write(name, s)
    print("  up   %-26s now resumes on reopen" % name)
    return True


def wire(app, unit, name, title):
    s = app.read(name)
    if MARK in s:
        if "window.__ehelRestore = function" in s:
            print("  skip %-26s already reports and resumes" % name)
            return True
        return upgrade(app, name, s)

    if len(FINISH.findall(s)) != 1:
        print("  REFUSED %-24s finish() is not the shape this patches (%d matches)"
              % (name, len(FINISH.findall(s))))
        return False
    if len(SHOW_TAIL.findall(s)) != 1:
        print("  REFUSED %-24s show() is not the shape this patches (%d matches)"
              % (name, len(SHOW_TAIL.findall(s))))
        return False

    s = FINISH.sub(
        r"\1if (window.__ehelStep) { try { window.__ehelStep(i, done); } catch (_) {} } ", s, count=1)
    s = SHOW_TAIL.sub(
        r"\1", s, count=1)
    # the position report goes at the END of show(), after cur has moved;
    # the restore hook goes right after show(), inside the deck's own scope,
    # because `done`, `paintDots` and `show` live there and nowhere else
    s = s.replace(
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n  }',
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        '    if (window.__ehelAt) { try { window.__ehelAt(cur); } catch (_) {} }\n  }\n' + RESTORE_HOOK,
        1)
    i = s.rfind("</style>")
    if i < 0:
        print("  REFUSED %-24s no </style>" % name)
        return False
    s = s[:i] + CSS + s[i:]

    prefix = app.cfg.get("progressUnitPrefix", "l")
    js = (JS
          .replace("__COURSE__", app.cfg["courseKey"])
          .replace("__UNIT__", "%s%02d" % (prefix, unit))
          % ("NN", "NN"))
    app.write(name, s.rstrip() + "\n" + js)
    print("  ok   %-26s %s%02d  %s" % (name, prefix, unit, title))
    return True


def main():
    app = load()
    if "courseKey" not in app.cfg:
        sys.exit("  REFUSED: app.config.json has no courseKey. It must be the SAME key\n"
                 "  the shell uses for this course (mathematics: ehel-math-gNN), or the\n"
                 "  work lands in a course nothing reads.")
    print("\n  Wiring progress for %s %s -> course %s\n" % (
        app.subject_label, app.grade_label, app.cfg["courseKey"]))
    ok = all(wire(app, u, f, t) for u, f, t in app.lessons)
    print("\n  %s\n" % ("all %d report" % len(app.lessons) if ok else "SOME FAILED - see above"))
    sys.exit(0 if ok else 1)


main()
