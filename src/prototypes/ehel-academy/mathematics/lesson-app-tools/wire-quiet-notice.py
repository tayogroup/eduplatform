# -*- coding: utf-8 -*-
"""Tell the child when the sound is not working, instead of saying nothing.

    python lesson-app-tools/wire-quiet-notice.py --app grade-1-app/g1v2          # report
    python lesson-app-tools/wire-quiet-notice.py --app grade-1-app/g1v2 --write

WHAT WAS WRONG, stated precisely because the first description of it was not.
The 2026-09-11 re-validation said "nothing plays if the endpoint is
unreachable". That is false: every lesson's voice engine already falls back -
"the endpoint first, the browser's own voice if it refuses" - so a server that
is down is read by the device's own voice. What IS true is narrower: when BOTH
voices fail (a device with no speech voice, a muted or blocked audio context,
the endpoint down on a machine without speechSynthesis), the child taps the
speaker and hears nothing, and nothing on the screen says why. A five-year-old
reads that as "I did it wrong".

HOW IT DETECTS, and why not the obvious way. The voice engine's promise chain
has a failure branch at every step, and every one of them is ambiguous: a clip
that stops because the child moved to the next step rejects exactly like a clip
that failed. Hooking those would report a child's own navigation as a broken
speaker. So this watches the OUTCOME instead:

  - it records the moment any audio actually STARTS - the platform clip's
    `playing` event, or a browser utterance's `onstart` - in window.__ehelHeard;
  - when the child explicitly asks (the speaker or the Explain button), it looks
    again a few seconds later, and only if nothing started since the tap AND the
    child is still on the same step does it show the notice.

It shows once per page, in a role="status" region, and never blocks the lesson.
The wording is "Can't hear it?", which stays true even in the rare case that a
very slow clip arrives after the notice: the child could not hear it yet.

Guarded by a marker, so a second run changes nothing. Each file must carry every
anchor exactly once or it is refused untouched - the engine is copied into each
lesson, and a copy that has drifted must not be half-patched.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
argv = sys.argv[1:]
if "--app" not in argv:
    sys.exit("usage: wire-quiet-notice.py --app <build dir> [--write]")
APP = os.path.abspath(argv[argv.index("--app") + 1])
WRITE = "--write" in argv
for a in argv:
    if a.startswith("--") and a not in ("--app", "--write"):
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-quiet-notice"
WAIT_MS = 6000     # the platform clip is fetched then played; a cached one is instant

# 1. the platform voice: record when a clip actually starts playing
A_OLD = 'const el = typeof Audio === "function" ? new Audio() : null;'
A_NEW = (A_OLD + '\n    /* ' + MARK + ': a clip that STARTS is sound the child heard */\n'
         '    if (el) el.addEventListener("playing", function () { window.__ehelHeard = Date.now(); });')

# 2. the browser voice: record when an utterance actually starts
B_OLD = "u.onend = next;"
B_NEW = ("u.onend = next;\n"
         "      u.onstart = function () { window.__ehelHeard = Date.now(); };   /* " + MARK + " */")

# 3. the notice itself, above the deck
C_OLD = '<div class="deck" id="deck" role="main">'
C_NEW = ('<div class="eh-quiet" id="ehQuiet" role="status" aria-live="polite" hidden>'
         '<span class="eh-quiet-msg"></span>'
         '<button type="button" class="eh-quiet-ok">OK</button></div>\n  ' + C_OLD)

# 4. the style and the watcher, APPENDED as their own blocks after the page's last
#    </script>. These lessons never close <body> or <html> - they end on the final
#    </script>, which HTML allows - so a "</body>" anchor matched nothing, and the
#    guard refused all seven rather than guess. Appending a NEW top-level block is
#    also what keeps it outside the lesson's IIFE, where nothing here needs to be.
TAIL = """
<style>/* """ + MARK + """ */
  /* IN THE FLOW, under the line the child tapped - never an overlay. The first
     version floated (position: fixed) and, measured at 375 px, sat on top of the
     day cards the child had to tap, squeezed to 187 px wide by the left: 50%
     shrink-to-fit trap. These pages scroll on a phone, so any overlay covers
     whatever happens to be in view. The card surface, not --accent-soft: in the
     dark theme that token is translucent, and the activity showed through it. */
  .eh-quiet { display: flex; gap: 12px; align-items: center; margin: 12px 0;
    padding: 12px 14px 12px 16px; border-radius: 14px;
    background: var(--card, #FFFFFF); color: var(--ink, #1B1410);
    border: 2px solid var(--accent, #E9744F); font-size: 17px; line-height: 1.35; }
  .eh-quiet[hidden] { display: none; }
  .eh-quiet-msg { flex: 1 1 auto; }
  .eh-quiet-ok { flex: 0 0 auto; min-width: 56px; min-height: 44px; border-radius: 10px;
    border: 0; font: inherit; font-weight: 700; cursor: pointer;
    background: var(--accent, #E9744F); color: var(--accent-ink, #1B1410); }
  .eh-quiet-ok:focus-visible { outline: 4px solid var(--ink, #1B1410); outline-offset: 2px; }
</style>
<script>/* """ + MARK + """ */
(function () {
  var box = document.getElementById("ehQuiet");
  if (!box) return;
  var shown = false;
  box.querySelector(".eh-quiet-ok").addEventListener("click", function () { box.hidden = true; });
  function active() { return document.querySelector("section.slide.active"); }
  document.addEventListener("click", function (e) {
    var tap = e.target.closest && e.target.closest(".speak, .explain");
    if (shown || !tap) return;
    var asked = Date.now(), slide = active();
    /* where the child is looking: the spoken line the speaker sits in */
    var at = tap.closest(".say") || tap.parentElement;
    setTimeout(function () {
      if (shown || (window.__ehelHeard || 0) >= asked) return;   /* something played */
      if (active() !== slide) return;                             /* the child moved on */
      shown = true;
      box.querySelector(".eh-quiet-msg").textContent =
        "Can't hear it? The sound is not working just now. You can read the words on the screen.";
      if (at && at.isConnected) at.insertAdjacentElement("afterend", box);
      box.hidden = false;
    }, """ + str(WAIT_MS) + """);
  }, true);
})();
</script>
"""

EDITS = [("platform voice hook", A_OLD, A_NEW), ("browser voice hook", B_OLD, B_NEW),
         ("notice element", C_OLD, C_NEW)]

cfg = os.path.join(APP, "app.config.json")
if not os.path.exists(cfg):
    sys.exit("no app.config.json in %s" % APP)
import json
lessons = [l["file"] for l in json.load(io.open(cfg, encoding="utf-8"))["lessons"]]

done = skipped = refused = 0
for f in lessons:
    p = os.path.join(APP, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % f)
        skipped += 1
        continue
    bad = [n for n, old, _ in EDITS if s.count(old) != 1]
    # the page must END on its last </script>, or "the end" is not where we think
    if not re.search(r"</script>\s*$", s):
        bad.append("page does not end on </script>")
    if bad:
        print("  REFUSED  %s  anchor not found exactly once: %s" % (f, ", ".join(bad)))
        refused += 1
        continue
    for _, old, new in EDITS:
        s = s.replace(old, new, 1)
    s = s.rstrip() + "\n" + TAIL
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %s" % ("wrote   " if WRITE else "would   ", f))
    done += 1

print("\n  %s: %d patched, %d already done, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused))
sys.exit(1 if refused else 0)
