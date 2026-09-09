# -*- coding: utf-8 -*-
"""Stop the Grade 1 Mathematics lessons narrating themselves on page load.

Same defect and same fix as the Grade 1 English build (commit 271e8c551): the
deck puts every slide in the DOM at once, so a renderer that speaks as it draws
speaks on load, and a page with several of them speaks several at once, over
each other. Measured here before writing anything: 19 sound attempts on
halves-and-wholes, 12 on counting-to-twenty, several of them paid TTS fetches.
Grade 3 Mathematics measured 0 on two pages and is NOT touched.

These pages are hand-maintained -- no builder in this directory writes their
script -- so the gate is patched into the pages themselves rather than into a
template.

say() is the funnel every spoken line goes through, so gating it covers every
renderer without touching one. The flag is cleared immediately before
show(0, false), the deck's last statement, so ONLY the draw pass is silent:
instructions, answers and the speaker buttons all fire after it.

Idempotent; --dry writes nothing.
"""
import io, os, sys

SET = "  window.__ehelPainting = true;"
CLEAR = "  window.__ehelPainting = false;   /* the draw pass is over: sound is allowed */"
SAY_OLD = "  function say(text) { VOICE.speak(text); }"
SAY_NEW = ("  /* Silent while the deck paints -- see window.__ehelPainting above. */\n"
           "  function say(text) { if (window.__ehelPainting) return; VOICE.speak(text); }")
NOTE = [
    "",
    "  /* SILENT WHILE THE DECK PAINTS. Every renderer draws once at load,",
    "     because the deck puts all its slides in the DOM at once -- so a step",
    "     that speaks as it draws speaks on page load, several at a time and",
    "     over each other. Cleared before show(0, false) below, so only the",
    "     draw pass is affected. Measured, not assumed: 19 sound attempts on",
    "     this build before the gate, 0 after. */",
    SET,
]


def patch(path, dry):
    s = io.open(path, encoding="utf-8", newline="", errors="surrogateescape").read()
    # ASK "have I already run?" FIRST. The other test looks for the UN-gated
    # say(), which this tool replaces -- so on a second run it is absent and
    # the page reads as having no deck script at all. A guard that reports the
    # wrong reason is worse than one that fails: it sent me looking for a
    # missing script on a page that was already correct.
    if SET in s:
        return "up to date"
    if SAY_OLD not in s or "show(0, false);" not in s:
        return "no deck script on this page"
    lines = s.split("\n")
    i = next((n for n, l in enumerate(lines) if l == "(function () {"), None)
    if i is None:
        return "REFUSED - no IIFE to open the gate in"
    j = next((n for n, l in enumerate(lines) if l == "  show(0, false);"), None)
    if j is None:
        return "REFUSED - no show(0, false) to close it at"
    lines[j:j] = [CLEAR]
    lines[i + 1:i + 1] = NOTE
    out = "\n".join(lines).replace(SAY_OLD, SAY_NEW)
    if not dry:
        io.open(path, "w", encoding="utf-8", newline="", errors="surrogateescape").write(out)
    return "silenced"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            print("unknown argument %s" % f)
            return 2
    if not args:
        print("usage: silence-load-narration.py <page.html> [...] [--dry]")
        return 2
    for path in args:
        print("  %-30s %s" % (os.path.basename(path), patch(path, "--dry" in flags)))
    if "--dry" in flags:
        print("\n  --dry: nothing written")
    return 0


sys.exit(main())
