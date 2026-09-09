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
  /* WIRE-CSS-START -- owned by lesson-app-tools/wire-platform-controls.py.
     Everything to WIRE-CSS-END is REPLACED on a re-run: this tool used to skip
     a page it had already wired, so three separate changes to this block --
     the panel surfaces, the dark theme, the canned prompts -- reached nothing
     already built, and each needed its own carry-across tool afterwards. */
  /* --- a home for the class controls, and the tutor dock;
         see lesson-app-tools/wire-platform-controls.py --- */
  .hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: 55%; }
  .top-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  /* The session bar (seb-session.js) is a fixed pill at right:16 bottom:16
     with a z-index above everything, so in focus mode it lands squarely on
     top of Ask Wehel. Lift both above it when it is there, and only then.
     --seb-lift is MEASURED from the bar below, because the bar's contents wrap
     and it is half again as tall on a narrow screen as on a wide one; the
     fallback is only for the instant before the first measurement. */
  body:has(#seb-session-bar) .w-dock,
  body:has(#seb-session-bar) .w-drawer { bottom: var(--seb-lift, 78px); }
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

  /* WEHEL-THEME-START -- the tutor PANEL, dressed in this page's palette.
     The dock and the drawer above already use --card/--line/--ink, so before
     this the drawer was a dark card containing a white sheet: shell/wehel.js
     ships a light panel (--w-bg #fff, --w-ink #17324d) and these pages are
     always dark -- the bare `:root` in their theme selector makes the dark
     block unconditional, so there is no light case to preserve here.
     wehel.js now NAMES its surfaces instead of repeating literals, every
     default being the value it already had, so this block is the whole of the
     change a page needs and the five shell subjects that also load the tutor
     are untouched. Mapped by ROLE, not by hue: panel takes --card, anything
     raised off it takes --cell, so the bubbles, prompt buttons, compose row
     and timer stay readable against the panel rather than against the page. */
  /* DOUBLED selector, and that is load-bearing: wehel.js injects PANEL_STYLE
     with document.head.appendChild at mount, so its own `.wehel-panel{...}`
     always comes after this stylesheet. At equal specificity the later rule
     wins, so the single-class version of this block lost every declaration to
     it and the panel stayed white -- which only rendering it showed. */
  .wehel-panel.wehel-panel {
    --w-bg: var(--card); --w-surface: var(--card); --w-ink: var(--ink);
    --w-line: var(--line);
    --w-teal: var(--teal); --w-teal-2: #2AA79B; --w-teal-soft: var(--teal-soft);
    --w-bubble: var(--cell);
    --w-prompt-bg: var(--cell); --w-prompt-line: var(--line);
    /* NOT var(--teal) here. The page's teal on the prompt buttons' --cell
       ground measures 4.28:1, under the 4.5 floor -- the one surface in the
       panel that failed when this was measured rather than eyeballed. This
       lighter teal is 6.27:1 on the same ground. It is a literal because the
       palette has no light-teal token: --teal-soft is a dark fill (#143A4A),
       and --good (#4FD1A0) is the green that means "correct" in this build,
       which a row of suggestions must not borrow. */
    --w-prompt-ink: #7FE0D6;
    /* the strip along the top of the panel -- timer, Full screen, voice picker */
    --w-row-a: rgba(255, 255, 255, 0.07); --w-row-b: rgba(255, 255, 255, 0.03);
    --w-low-line: rgba(244, 201, 93, 0.55);
    --w-compose-bg: var(--cell);
    --w-timer-bg: var(--cell); --w-timer-track: var(--cell);
    /* the learner's own turn: plum, the page's third accent, so a child can
       tell their words from Wehel's at a glance without reading the label */
    --w-user-a: rgba(183, 139, 209, 0.30); --w-user-b: rgba(183, 139, 209, 0.16);
    --w-user-ink: var(--ink);
    --w-user-avatar-a: var(--plum); --w-user-avatar-b: #8E5AA8;
    /* time nearly up: the page's gold, not the light build's cream */
    --w-warm: var(--gold); --w-low-ink: var(--gold);
    --w-low-fill: rgba(244, 201, 93, 0.32); --w-low-track: rgba(244, 201, 93, 0.12);
  }
  .wehel-panel.wehel-panel .ai-compose input::placeholder { color: var(--muted); }

  /* THE CLASS CHAT, same treatment and a different scope. learner-controls.js
     draws that panel with INLINE styles -- deliberately, so a cosmetic rule in
     course-ui.css cannot make five other subjects' app tiers stale -- and an
     inline style cannot be overridden by a stylesheet. It reads --lc-* through
     var() instead, so this retints it; and the panel is appended to <body>
     rather than to the drawer, so these live at :root and not on a class.

     The bug this fixes is not only the tint. Every bubble set a background and
     NO colour, so the text inherited the page's --ink -- white -- and a child
     read white on #f2f4f6. The compose input was the same, so typing was
     invisible. The defaults in learner-controls.js are course-ui.css's own
     --ink (#17324d), which is exactly what the light subjects inherit today. */
  :root {
    --lc-panel-bg: var(--card); --lc-panel-line: var(--line);
    --lc-head-a: rgba(53, 191, 178, 0.22); --lc-head-b: rgba(53, 191, 178, 0.07);
    --lc-head-ink: var(--ink); --lc-head-sub: var(--muted);
    --lc-form-bg: var(--cell); --lc-form-line: var(--line);
    --lc-field-bg: var(--cell); --lc-field-ink: var(--ink);
    --lc-them-bg: var(--cell); --lc-them-ink: var(--ink);
    /* the learner's own turn in plum, the same signal the tutor panel uses */
    --lc-mine-bg: rgba(183, 139, 209, 0.30); --lc-mine-ink: var(--ink);
    /* "only your teacher sees this" keeps its amber, restated for a dark ground */
    --lc-private-bg: rgba(244, 201, 93, 0.18); --lc-private-line: rgba(244, 201, 93, 0.45);
    --lc-private-ink: var(--gold);
  }
  /* WEHEL-THEME-END */
  /* WIRE-CSS-END */
"""

JS = """
<!-- WIRE-JS-START -->
<script type="module">
  /* The platform controls - see lesson-app-tools/wire-platform-controls.py.
     learner-controls.js holds the SAME singletons the shell mounts. */
  import { mountLearnerControls } from "./learner-controls.js";
  import { mountWehelChat } from "./wehel.js";
  import { escapeHtml } from "./course-shell.js";
  /* Focus mode and the session bar. Imported for its side effect - it mounts
     itself, and mounts NOTHING unless the launch carries focusMode=1 or an
     exitUrl, which is why an ordinary launch and every local run see no
     change. It is what writes course_focus_break / course_left_early, so
     without it the live group board's away state can never fire for a learner
     in this build. */
  import "./seb-session.js";

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

  /* How far Ask Wehel has to sit above the session bar - see --seb-lift in the
     stylesheet. Measured rather than assumed: the bar wraps, so its height is
     a property of the screen. Re-measured on resize because its clock changes
     width every second and its buttons re-flow. */
  (function () {
    const seb = document.getElementById("seb-session-bar");
    if (!seb) return;                       /* no focus mode, nothing to avoid */
    const lift = () => document.documentElement.style
      .setProperty("--seb-lift", (seb.offsetHeight + 30) + "px");
    lift();
    try { new ResizeObserver(lift).observe(seb); } catch (e) { addEventListener("resize", lift); }
  })();

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
          /* The chips a young learner presses, written as the sentence they
             would have said. Four, because a row a six-year-old scans has to
             be short and a fifth makes the other four less likely to be read.

             "Give me a hint" is the one that carries a teaching stance: it
             says "not the answer" in the message itself, so pressing it cannot
             turn the tutor into an answer machine even before the prompt file
             has its say.

             True of every app this tool wires - Grade 1 English and the four
             Mathematics builds - which is why none of them names a word, a
             sentence or a number. */
          quickPrompts: [
            { label: "I do not understand", message: "I do not understand this step. Please explain it again in a simpler way, with a small example." },
            { label: "Give me a hint", message: "Give me a hint for this step, not the answer, so I can try it myself." },
            { label: "Make it easier", message: "This is too hard for me right now. Break it into a smaller, easier step and start me there." },
            { label: "Quiz me", message: "Quiz me on this lesson, one question at a time." },
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
<!-- WIRE-JS-END -->
"""

CSS_START = "/* WIRE-CSS-START"
CSS_END = "/* WIRE-CSS-END */"
JS_START = "<!-- WIRE-JS-START -->"
JS_END = "<!-- WIRE-JS-END -->"

# The two shapes this tool's CSS block opened with before it carried markers.
# The second is the hand-authored Grade 1 Mathematics vintage, which predates
# the tool; it holds the same rules under its own comment.
LEGACY_CSS_OPENERS = (
    "  /* --- a home for the class controls, and the tutor dock;",
    "  /* --- the tutor dock, and a home for the class controls --- */",
)
# The last thing this tool's CSS has ever ended with on a built page. Anything
# after it inside the same <style> belongs to another tool -- add-header-bars.py
# writes .eh-progtext and .hero .eyebrow before the SAME </style> -- so the end
# is found by this marker and never by "the next </style>", which would swallow
# somebody else's rules.
LEGACY_CSS_END = "/* WEHEL-THEME-END */"
LEGACY_JS_OPEN = "The platform controls - see lesson-app-tools/wire-platform-controls.py"


def js_for(app, unit, title):
    """The JS block for one page: one definition, used by insert and update."""
    return (JS
            .replace("__UNITKEY__", "%s%02d" % (app.cfg.get("progressUnitPrefix", "u"), unit))
            .replace("__SUBJECT__", app.subject)
            .replace("__SUBJECTLABEL__", app.subject_label)
            .replace("__GRADE__", str(app.grade))
            .replace("__UNIT__", str(unit))
            .replace("__TITLE__", title))


def _span(s, start_at, end_marker, end_len):
    """The region [line containing start_at .. end of end_marker], or None."""
    i = s.find(start_at)
    if i == -1:
        return None
    a = s.rfind("\n", 0, i) + 1
    j = s.find(end_marker, a)
    if j == -1:
        return None
    return (a, j + end_len)


def _css_span(s):
    span = _span(s, CSS_START, CSS_END, len(CSS_END))
    if span:
        return span, "update"
    for opener in LEGACY_CSS_OPENERS:
        span = _span(s, opener, LEGACY_CSS_END, len(LEGACY_CSS_END))
        if span:
            return span, "migrate"
    return None, None


def _js_span(s):
    span = _span(s, JS_START, JS_END, len(JS_END))
    if span:
        return span, "update"
    i = s.find(LEGACY_JS_OPEN)
    if i == -1:
        return None, None
    a = s.rfind("<script", 0, i)
    j = s.find("</script>", i)
    if a == -1 or j == -1:
        return None, None
    return (a, j + len("</script>")), "migrate"


def rewire(s, name, js):
    """Replace the blocks this tool owns. REFUSES rather than guessing.

    A region whose boundaries cannot be identified is left alone and named,
    because the alternative is editing by position into a page another tool
    also writes into -- which is how a migration eats somebody else's rules.
    """
    notes = []
    span, how = _css_span(s)
    if span is None:
        print("  REFUSED %-24s cannot find the CSS block to update" % name)
        return None, None
    # strip BOTH ends: the span ends immediately after the END marker, so a
    # trailing newline here lands on top of the one already there -- one blank
    # line per run, which is how idempotent quietly stops being true.
    s = s[:span[0]] + CSS.strip("\n") + s[span[1]:]
    notes.append("css:" + how)

    span, how = _js_span(s)
    if span is None:
        # Not fatal: the CSS is the half three separate changes went stale in,
        # and a hand-authored mount block is not this tool's to rewrite blind.
        notes.append("js:LEFT(no marker)")
    else:
        s = s[:span[0]] + js.strip() + s[span[1]:]
        notes.append("js:" + how)
    return s, " ".join(notes)


DOTS = re.compile(r'(<nav class="dots"[^>]*></nav>)')


def wire(app, unit, name, title):
    # progressUnit must be the SAME id wire-progress.py writes, or the
    # teacher sees a hand raised from a unit no progress row mentions
    s = app.read(name)
    if CSS_START in s or MARK in s:
        s, note = rewire(s, name, js_for(app, unit, title))
        if s is None:
            return False
        app.write(name, s)
        print("  %-9s %-26s unit %d, %s" % (note, name, unit, title))
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

    js = js_for(app, unit, title)
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
