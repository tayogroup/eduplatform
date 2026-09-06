# -*- coding: utf-8 -*-
"""Mount the real Class chat, Hand up, Join class and Wehel on the lesson pages.

These four were deliberately absent from the header bars because a standalone
page had no launch token and no platform endpoints. Both are now solved: the
hub carries the launch parameters through (build-hub.py), and the two class
controls were lifted out of course-app.js into shell/learner-controls.js so
the lessons mount the SAME singletons rather than a copy.

Nothing here reimplements anything. The page imports three modules deployed
beside it and calls their entry points:

  learner-controls.js  mountLearnerControls()  -> Class chat, Hand up, Join class
  wehel.js             mountWehelChat()        -> the tutor
  course-shell.js      escapeHtml              -> the one ui helper wehel needs

WHERE THE BUTTONS GO IS NOT DECIDED HERE. placeLearnerControls() prepends into
`.top-actions`, so bar 2 is given that class and the controls land before Full
screen - exactly the order English shows: chat, hand, Full screen.

WHAT YOU WILL AND WILL NOT SEE. Hand up and Class chat mount only when the
server answers `watched` - this learner is in an active class group with a
teacher on it - and Join class only while a session is live. Outside a live
class, hidden is correct, not broken. Wehel is the one that appears for every
learner, so it is the honest test that the wiring works.
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.join(SP, "g1v2")
LESSONS = [
    ("counting-to-twenty.html", "Counting to Twenty", 1),
    ("adding-and-taking-away.html", "Adding and Taking Away", 2),
    ("halves-and-wholes.html", "Halves and Wholes", 3),
    ("what-comes-next.html", "What Comes Next", 4),
    ("shapes-and-sizes.html", "Shapes and Sizes", 5),
    ("days-months-and-clocks.html", "Days, Months and Clocks", 6),
    ("asking-and-sorting.html", "Asking and Sorting", 7),
]

CSS = """
  /* --- the tutor dock, and a home for the class controls --- */
  .w-dock { position: fixed; right: 14px; bottom: 14px; z-index: 70; display: inline-flex;
    align-items: center; gap: 8px; border: none; border-radius: 999px; cursor: pointer;
    background: var(--plum); color: #fff; font: inherit; font-size: 16px; font-weight: 700;
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
  /* The platform controls. See add-platform-controls.py for why none of this is
     reimplemented here: learner-controls.js holds the SAME singletons the shell
     mounts, because two copies would poll twice and disagree about whether a
     hand is up. */
  import { mountLearnerControls } from "./learner-controls.js";
  import { mountWehelChat } from "./wehel.js";
  import { escapeHtml } from "./course-shell.js";

  const q = new URLSearchParams(location.search);
  const launchToken = (q.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
  const launchEndpoint = (q.get("pwsEndpoint") || "").trim();

  /* the only ui helper wehel.js needs beyond escapeHtml: ui.css turned out to be
     comments about course-ui.css, and ui.bindVoiceControls is guarded */
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
      progressUnit: "u%02d",
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
            subject: "mathematics", subjectLabel: "Mathematics", grade: 1,
            unitNo: %d, unitTitle: %s,
            learnerCategory: q.get("category") || "",
          },
          store: {},
          ui: { escapeHtml, toast },
          tutorLabel: "Wehel Tutor",
          placeholder: "Ask about %s\\u2026",
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

fails = 0
for fname, title, idx in LESSONS:
    p = os.path.join(V2, fname)
    s = io.open(p, encoding="utf-8").read()
    orig = s
    if "mountLearnerControls" in s:
        print("  skip %-30s already wired" % fname); continue

    # bar 2's right-hand group becomes the home placeLearnerControls looks for
    if 'class="eh-b2right"' not in s:
        print("  REFUSED %-30s no .eh-b2right to host the controls" % fname); fails += 1; continue
    s = s.replace('class="eh-b2right"', 'class="eh-b2right top-actions"', 1)

    i = s.rfind("</style>")
    if i < 0:
        print("  REFUSED %-30s no </style>" % fname); fails += 1; continue
    s = s[:i] + CSS + s[i:]

    js = JS.replace("u%02d", "u%02d" % idx) % (idx, '"' + title + '"', title)
    s = s.rstrip() + "\n" + js
    if s == orig:
        print("  REFUSED %-30s nothing changed" % fname); fails += 1; continue
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  ok   %-30s unit %d, %s" % (fname, idx, title))

print("\n%s" % ("all seven wired" if not fails else "%d failed" % fails))
sys.exit(1 if fails else 0)
