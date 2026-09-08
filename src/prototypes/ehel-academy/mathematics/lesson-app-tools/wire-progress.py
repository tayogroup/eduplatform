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
  checkpoint.result   a scored step, via window.__ehelScore(i, right, total)
                      - the only event that becomes a MARK a teacher or
                        parent reads, and the only one the gradebook takes

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
  function report(i) {
    emit({
      type: "progress.summary", unit: UNIT,
      sectionsDone: [...doneIds],
      resume: sectionId(i), resumeLabel: labelOf(i),
      xp: doneIds.size,
    });
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
  window.__ehelAt = function (i) { report(i); };

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
  window.__ehelScore = function (i, right, total) {
    const n = Number(total) || 0;
    const got = Math.max(0, Math.min(Number(right) || 0, n));
    if (!n) return;
    emit({
      type: "checkpoint.result", unit: UNIT, section: sectionId(i), title: labelOf(i),
      score: Math.round((got / n) * 100), correct: got, total: n,
    });
    try { ws.flush?.(); } catch (_) { /* never break the lesson */ }
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


def wire(app, unit, name, title):
    s = app.read(name)
    if MARK in s:
        print("  skip %-26s already reports" % name)
        return True

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
    # the position report goes at the END of show(), after cur has moved
    s = s.replace(
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n  }',
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        '    if (window.__ehelAt) { try { window.__ehelAt(cur); } catch (_) {} }\n  }',
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
