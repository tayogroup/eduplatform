# -*- coding: utf-8 -*-
"""Mount the real Class chat, Hand up, Join class and Wehel on lesson pages.

NOTHING HERE IS REIMPLEMENTED. The page imports three modules deployed beside
it and calls their entry points:

  learner-controls.js  mountLearnerControls()  -> Class chat, Hand up, Join class
  wehel.js             mountWehelChat()        -> the tutor
  course-shell.js      escapeHtml              -> the one ui helper wehel needs

That is deliberate and it is the reason `learner-controls.js` exists as a
module at all. Its own comment: "MOVED, never cloned. Both controls are
singletons that own polling state and an unread dot; a second copy would poll
twice and disagree with itself about whether a hand is up." Two PAGES each
holding one copy are separate documents and cannot see each other, which is
why deploying the file beside the lessons is a copy of the source rather than
a second implementation.

RUN wire-navigation.py FIRST. Both class controls guard on launchToken and
launchEndpoint and mount nothing without them, so on a page that drops the
launch parameters this tool appears to do nothing at all.

WHERE THE BUTTONS GO. placeLearnerControls() prepends into `.top-actions`, so
this gives the hero one. It does not rebuild the header: Grade 1 has a
two-bar header from its own build and this build has a hero, and porting that
header would be a design change nobody asked for. A container is all the
contract requires.

WHAT YOU WILL AND WILL NOT SEE. Hand up and Class chat mount only when the
server answers `watched` - this learner is in an active class group with a
teacher on it - and Join class only while a session is live. Outside a live
class, hidden is correct, not broken. Wehel appears for every learner with a
launch token, so it is the honest test that the wiring works.

Idempotent.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

MARK = "wire-platform-controls.py"

CSS = """
  /* --- a home for the class controls, and the tutor dock;
         see lesson-app-tools/wire-platform-controls.py --- */
  .hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: 55%; }
  .top-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  .w-dock { position: fixed; right: 14px; bottom: 14px; z-index: 70; display: inline-flex;
    align-items: center; gap: 8px; border: none; border-radius: 999px; cursor: pointer;
    background: var(--plum); color: var(--plum-ink, #fff); font: inherit; font-size: 16px; font-weight: 700;
    padding: 12px 18px; box-shadow: var(--shadow); }
  .w-dock[hidden] { display: none; }
  .w-drawer { position: fixed; right: 14px; bottom: 14px; z-index: 71; width: min(420px, calc(100vw - 28px));
    height: min(620px, calc(100vh - 28px)); background: var(--card); border: 1px solid var(--line);
    border-radius: 18px; box-shadow: var(--shadow); display: flex; flex-direction: column; overflow: hidden; }
  .w-drawer[hidden] { display: none; }
  .w-drawer-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    border-bottom: 1px solid var(--line); font-weight: 800; }
  .w-drawer-head button { margin-left: auto; border: 1px solid var(--line); background: var(--cell);
    color: var(--ink); border-radius: 999px; width: 34px; height: 34px; font-size: 17px; cursor: pointer; }
  .w-drawer-body { flex: 1 1 auto; min-height: 0; overflow: auto; }
  .w-toast { position: fixed; left: 50%; bottom: 88px; transform: translateX(-50%); z-index: 90;
    background: var(--ink); color: var(--ground); padding: 10px 16px; border-radius: 999px;
    font-weight: 700; font-size: 15px; box-shadow: var(--shadow); }
"""

JS = """
<script type="module">
  /* The platform controls - see lesson-app-tools/wire-platform-controls.py.
     learner-controls.js holds the SAME singletons the shell mounts. */
  import { mountLearnerControls } from "./learner-controls.js";
  import { mountWehelChat } from "./wehel.js";
  import { escapeHtml } from "./course-shell.js";

  const q = new URLSearchParams(location.search);
  const launchToken = (q.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
  const launchEndpoint = (q.get("pwsEndpoint") || "").trim();

  let toastEl = null;
  function toast(message) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement("div");
    toastEl.className = "w-toast";
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    setTimeout(() => { if (toastEl) { toastEl.remove(); toastEl = null; } }, 3200);
  }

  /* 1. Class chat, Hand up and the Join class pill. They place themselves into
        .top-actions and mount ONLY when the server says a teacher is watching,
        so nothing appears to a child working alone. */
  try {
    mountLearnerControls({
      token: q.get("pwsToken") || "", launchToken, launchEndpoint,
      progressUnit: "__UNITKEY__",
    });
  } catch (e) { console.error("learner controls:", e); }

  /* 2. Wehel. Mounted on first open, not on load: the panel asks the server for
        the day's allowance, and a lesson nobody opens the tutor on should not
        spend a request. */
  if (launchToken) {
    const dock = document.createElement("button");
    dock.type = "button"; dock.className = "w-dock"; dock.textContent = "\\u{1F4AC} Ask Wehel";
    const drawer = document.createElement("div");
    drawer.className = "w-drawer"; drawer.hidden = true;
    drawer.innerHTML = '<div class="w-drawer-head">Wehel Tutor<button type="button" aria-label="Close">\\u00d7</button></div><div class="w-drawer-body"></div>';
    let panel = null;
    function open() {
      drawer.hidden = false; dock.hidden = true;
      if (panel) return;
      try {
        panel = mountWehelChat({
          container: drawer.querySelector(".w-drawer-body"),
          meta: {
            subject: "__SUBJECT__", subjectLabel: "__SUBJECTLABEL__", grade: __GRADE__,
            unitNo: __UNIT__, unitTitle: "__TITLE__",
            learnerCategory: q.get("category") || "",
          },
          store: {},
          ui: { escapeHtml, toast },
          tutorLabel: "Wehel Tutor",
          placeholder: "Ask about __TITLE__\\u2026",
          quickPrompts: [
            { label: "Explain it simply", message: "Explain this step in a simpler way." },
            { label: "Quiz me", message: "Quiz me on this lesson, one question at a time." },
            { label: "An easier one", message: "Give me an easier question to build up with." },
          ],
        });
      } catch (e) {
        console.error("wehel:", e);
        drawer.hidden = true; dock.hidden = false;
        toast("Wehel is not available on this page.");
      }
    }
    function close() { drawer.hidden = true; dock.hidden = false; }
    dock.addEventListener("click", open);
    drawer.querySelector("button").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) close(); });
    document.body.append(dock, drawer);
  }
</script>
"""

DOTS = re.compile(r'(<nav class="dots"[^>]*></nav>)')


def wire(app, unit, name, title):
    # progressUnit must be the SAME id wire-progress.py writes, or the
    # teacher sees a hand raised from a unit no progress row mentions
    s = app.read(name)
    if MARK in s:
        print("  skip %-26s already wired" % name)
        return True

    if "top-actions" not in s:
        m = DOTS.search(s)
        if not m:
            print("  REFUSED %-24s no .dots nav to hang the hero column on" % name)
            return False
        s = s[:m.start()] + (
            '<div class="hero-right"><div class="top-actions"></div>%s</div>' % m.group(1)
        ) + s[m.end():]

    i = s.rfind("</style>")
    if i < 0:
        print("  REFUSED %-24s no </style>" % name)
        return False
    s = s[:i] + CSS + s[i:]

    js = (JS
          .replace("__UNITKEY__", "%s%02d" % (app.cfg.get("progressUnitPrefix", "u"), unit))
          .replace("__SUBJECT__", app.subject)
          .replace("__SUBJECTLABEL__", app.subject_label)
          .replace("__GRADE__", str(app.grade))
          .replace("__UNIT__", str(unit))
          .replace("__TITLE__", title))
    app.write(name, s.rstrip() + "\n" + js)
    print("  ok   %-26s unit %d, %s" % (name, unit, title))
    return True


def main():
    app = load()
    print("\n  Wiring the platform controls for %s %s\n" % (app.subject_label, app.grade_label))
    missing = [f for _, f, _ in app.lessons if "wire-navigation.py :: carry" not in app.read(f)]
    if missing:
        # the controls guard on the launch params, so wiring them onto a page
        # that drops those makes a feature that is silently unreachable
        sys.exit("  REFUSED: run wire-navigation.py first - these drop the launch\n"
                 "  parameters and the controls would mount nothing:\n    %s"
                 % "\n    ".join(missing))
    ok = all(wire(app, u, f, t) for u, f, t in app.lessons)
    print("\n  %s\n" % ("all %d wired" % len(app.lessons) if ok else "SOME FAILED - see above"))
    sys.exit(0 if ok else 1)


main()
