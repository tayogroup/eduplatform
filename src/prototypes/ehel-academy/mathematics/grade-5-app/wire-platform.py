# -*- coding: utf-8 -*-
"""Wire Grade 5 into the platform: hand-raise, class chat, Wehel and progress.

    python wire-platform.py            # report
    python wire-platform.py --write

WHY THIS EXISTS AND WHY IT IS NOT wire-platform-controls.py /
wire-progress.py. app.config.json's own comment states the fact plainly:
"UNLIKE grades 1 to 4, this one is NOT wired to the platform shell". Those two
shared tools REFUSE outright without a deck's own primitives -
wire-progress.py requires `finish(i, msg)` and `show(i, speak)` in the page's
own idiom and reads `.slide`; wire-platform-controls.py requires a `.dots` nav
to hang the header column on. Grade 5 has none of that: eight
`<section class="step">` blocks read top to bottom, no finish(), no scoring,
no dot rail - the upper-stage "scan the page" shape the root CLAUDE.md
documents for Grades 5-8, not a deck with a check at the end. So this is a
new tool rather than a repair to either shared one.

THE PROGRESS MODEL IS INVENTED HERE, DELIBERATELY, because Grade 1-4's model
does not transfer: "finished this step, passed this check" has no counterpart
on a page with no check. What IS available is which sections a learner has
actually scrolled to - Owner decision, 2026-09-18: track that with an
IntersectionObserver, one entry per <section class="step">, firing once each
section is first seen and never again. `unit.completed` fires the same way
every other grade's does: when every section has been seen, matching G1-4's
convention that the last finish() closes the unit, rather than inventing a
different completion rule for one grade.

WHERE THE SHARED MODULES COME FROM. deploy.mjs already uploads
learner-controls.js, wehel.js, course-shell.js, progress-client.js and
seb-session.js to this build's remote directory unconditionally (per
app.config.json's own comment) - nothing has ever imported them. Local copies
for testing are flattened exactly as deploy.mjs flattens them
(`../shared/x.js?query` -> `./x.js`), from git HEAD rather than the working
tree, because another session was mid-edit on shell/wehel.js when this was
written - see feedback_derive_from_head_when_committing_shared_files.

`.top-actions` DOES NOT EXIST ON ANY GRADE 5 PAGE, and mountHandRaise /
mountLearnerControls both silently no-op without it (learner-controls.js
checks `$(".top-actions")` and returns early) - not a loud failure, so a page
missing the container would look fine and simply never show the controls.
This tool adds one, as its own row at the foot of the existing `.hero`
grid rather than disturbing the two-column layout `.hero-mini` already
occupies.

Guarded by a marker; every anchor must match exactly once or the file is
refused rather than half-patched.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g5-platform"
cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
COURSE = cfg["courseKey"]

TOP_ACTIONS_CSS = """
  .hero { position: relative; }
  .top-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: flex-end; margin-top: 4px; }
  .top-actions button { font: inherit; font-size: 13.5px; font-weight: 700;
    padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line);
    background: var(--card, #fff); color: var(--ink); cursor: pointer; }
"""

TOP_ACTIONS_HTML = '\n    <div class="top-actions"></div>'


def wire_js(unit, title, index_1based):
    return """
<!-- WIRE-JS-START """ + MARK + """ -->
<script type="module">
  /* Hand-raise, class chat, Wehel - see wire-platform.py. No deck exists here,
     so this mounts the same singletons G1-4 mount, without a deck-header
     home for them: placeLearnerControls() falls back to .top-actions when
     there is no .gc-top, which is always true on this build. */
  import { mountLearnerControls } from "./learner-controls.js";
  import { mountWehelChat, stopBrowserSpeech } from "./wehel.js";
  import { escapeHtml } from "./course-shell.js";
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

  try {
    mountLearnerControls({
      token: q.get("pwsToken") || "", launchToken, launchEndpoint,
      progressUnit: \"""" + unit + """\",
    });
  } catch (e) { console.error("learner controls:", e); }

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
            subject: "mathematics", subjectLabel: "Mathematics", grade: 5,
            unitNo: """ + str(index_1based) + """, unitTitle: \"""" + esc_js(title) + """\",
            learnerCategory: q.get("category") || "",
          },
          store: {},
          ui: { escapeHtml, toast },
          tutorLabel: "Wehel Tutor",
          placeholder: "Ask about """ + esc_js(title) + """\\u2026",
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

    window.__ehelTutorQuiet = stopBrowserSpeech;
    let tutorReading = false;
    new MutationObserver(() => {
      const now = !!drawer.querySelector(".voice-button.is-playing");
      if (now && !tutorReading && window.__ehelVoiceStop) window.__ehelVoiceStop();
      tutorReading = now;
    }).observe(drawer, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  }
</script>
<!-- WIRE-JS-END """ + MARK + """ -->

<script type="module">
  /* Progress reporting for a page with no deck and no check - see
     wire-platform.py. "Section reached" replaces "step finished": an
     IntersectionObserver marks a step section seen the first time any part
     of it enters the viewport, and unit.completed fires once every
     section has been seen, the same rule every other grade's last finish()
     closes the unit with. */
  import { createProgressClient } from "./progress-client.js";

  const q = new URLSearchParams(location.search);
  const endpoint = (q.get("pwsEndpoint") || "").trim();
  const token = (q.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");

  const COURSE = \"""" + COURSE + """\";
  const UNIT = \"""" + unit + """\";
  const STUDENT = q.get("studentid") || "local";

  const ws = createProgressClient({
    course: COURSE, student: STUDENT,
    backend: endpoint ? "remote" : "local",
    endpoint: endpoint || undefined,
    token: token || undefined,
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

  const sections = [...document.querySelectorAll("section.step")];
  const STEPS = Math.max(1, sections.length);
  const sectionId = (i) => "step-" + String(i + 1).padStart(2, "0");
  const labelOf = (i) => (sections[i]?.querySelector("h2, h3")?.textContent || "").trim() || sectionId(i);

  const doneIds = new Set();
  let unitSent = false;

  /* NOT SENT UNTIL THE BASELINE HAS LANDED. progress.summary REPLACES the
     unit's sectionsDone rather than merging into it (the same contract every
     other grade's wire-progress.py relies on), so a report sent before
     hydrate() resolves would tell the server "only the section just seen is
     done" and erase a completed lesson's record the moment it is reopened -
     the exact failure the shared progress-client.js docs warn a new
     session's first event can cause. Measured locally hydrate() resolves
     near-instantly (backend "local" just reads localStorage), which hid this
     the first time it was tested; a real launch's network round trip would
     not be as forgiving, so this waits regardless of how fast hydrate looks
     in a browser with nothing else to do. */
  let ready = false;
  let pendingIndex = null;

  function report(i) {
    const ev = {
      type: "progress.summary", unit: UNIT,
      sectionsDone: [...doneIds],
      resume: sectionId(i), resumeLabel: labelOf(i),
      xp: doneIds.size,
    };
    emit(ev);
    if (doneIds.size >= STEPS && !unitSent) {
      unitSent = true;
      emit({ type: "unit.completed", unit: UNIT });
    }
  }

  function markSeen(i) {
    const id = sectionId(i);
    if (doneIds.has(id)) return;
    doneIds.add(id);
    if (ready) report(i);
    else pendingIndex = i;             /* flushed once hydrate has landed */
  }

  /* Seen once, reported once - a section scrolled past twice (a learner
     re-reading) must not re-fire and must not un-finish the unit. threshold
     0 fires the instant any pixel is visible, which matches "reached" rather
     than "read": a section a learner scrolls straight past still counts, the
     same honesty a step's finish() has always had - a tap counts the moment
     it happens, not after a dwell time nothing here can honestly measure.
     Observing starts immediately, before hydrate resolves, because the
     FIRST section is often already on screen at load and markSeen() queues
     rather than sends - nothing is lost by starting early, only reported
     early. */
  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        markSeen(sections.indexOf(en.target));
      }
    }, { threshold: 0 });
    sections.forEach((s) => io.observe(s));
  }

  (async () => {
    try {
      const doc = await ws.hydrate();
      const u = doc && doc.units && doc.units[UNIT];
      if (u) {
        const doneIdx = (Array.isArray(u.sectionsDone) ? u.sectionsDone : [])
          .map((id) => { const m = /^step-(\\d{2})$/.exec(String(id || "")); return m ? Number(m[1]) - 1 : -1; })
          .filter((i) => i >= 0);
        for (const i of doneIdx) doneIds.add(sectionId(i));
      }
    } catch (_) { /* never break the lesson - proceed with whatever was seen locally */ }
    ready = true;
    if (pendingIndex !== null) report(pendingIndex);
  })();
</script>
"""


def esc_js(t):
    return t.replace("\\", "\\\\").replace('"', '\\"')


HUB_MARK = "ehel-g5-hub-launch-passthrough"
HUB_JS = """
<script>/* """ + HUB_MARK + """ - see wire-platform.py
   Every lesson link is written statically ("squares-cubes-and-roots.html?from=g5"),
   so a real launch's pwsToken/pwsEndpoint/studentid/category - present on THIS
   page's own URL - would otherwise be dropped the moment a learner clicks into
   a lesson, and every control wire-platform.py just added would find no launch
   token and stay silent. Runs once, merges rather than overwrites: from=g5 is
   kept, the launch params are added beside it. */
  (function () {
    var carry = ["pwsToken", "pwsEndpoint", "studentid", "category"];
    var src = new URLSearchParams(location.search);
    var extra = [];
    carry.forEach(function (k) { if (src.get(k)) extra.push(k + "=" + encodeURIComponent(src.get(k))); });
    if (!extra.length) return;
    document.querySelectorAll("a.lesson[href]").forEach(function (a) {
      var url = new URL(a.getAttribute("href"), location.href);
      carry.forEach(function (k) { if (src.get(k)) url.searchParams.set(k, src.get(k)); });
      a.setAttribute("href", url.pathname.split("/").pop() + "?" + url.searchParams.toString());
    });
  })();
</script>
"""

hub_path = os.path.join(HERE, cfg["hub"])
hub_s = io.open(hub_path, encoding="utf-8", newline="").read()
if HUB_MARK in hub_s:
    print("  already  %s (hub launch passthrough)" % cfg["hub"])
elif 'a class="lesson' not in hub_s:
    print("  REFUSED  %s: no a.lesson links found" % cfg["hub"])
else:
    hub_s = hub_s.rstrip() + "\n" + HUB_JS
    assert hub_s.count(HUB_MARK) == 1
    if WRITE:
        io.open(hub_path, "w", encoding="utf-8", newline="").write(hub_s)
    print("  %s %s (hub launch passthrough)" % ("wrote  " if WRITE else "would  ", cfg["hub"]))

done = skipped = refused = 0
for i, l in enumerate(cfg["lessons"]):
    name = l["file"]
    unit = "l%02d" % (i + 1)
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue

    hero = re.search(r'<header class="hero">[\s\S]*?</header>', s)
    if not hero or hero.group(0).count('class="hero-mini"') != 1:
        print("  REFUSED  %-30s no single .hero header to anchor on" % name)
        refused += 1
        continue
    if 'class="top-actions"' in hero.group(0):
        print("  REFUSED  %-30s .hero already has a top-actions" % name)
        refused += 1
        continue

    steps = s.count('<section class="step"')
    if steps < 1:
        print("  REFUSED  %-30s no section.step to track" % name)
        refused += 1
        continue

    patched_hero = hero.group(0).replace("</header>", TOP_ACTIONS_HTML + "\n  </header>")
    s = s[:hero.start()] + patched_hero + s[hero.end():]

    if "</style>" not in s:
        print("  REFUSED  %-30s no </style> to add the top-actions CSS after" % name)
        refused += 1
        continue
    last_style = s.rindex("</style>")
    s = (s[:last_style] + "\n" + TOP_ACTIONS_CSS + s[last_style:])

    s = s.rstrip() + "\n" + wire_js(unit, l["title"], i + 1)

    assert s.count(MARK) >= 2 and s.count('class="top-actions"') == 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s unit %s, %d step(s) tracked"
          % ("wrote  " if WRITE else "would  ", name, unit, steps))
    done += 1

print("\n  %d lesson(s) %s, %d skipped, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
