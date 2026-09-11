# -*- coding: utf-8 -*-
"""Put focus mode into pages that were wired before it existed.

    python apply-focus-mode.py <page.html> [...] --dry
    python apply-focus-mode.py <page.html> [...]

wire-platform-controls.py gained `import "./seb-session.js"` - the session bar,
and the only thing in a standalone build that writes course_focus_break and
course_left_early - after Grade 1 and Grade 2 Mathematics were wired, and it
skips a page it has already wired. So those pages were receiving focusMode,
focusEndpoint and exitUrl from course_launch.php and reading none of them: the
live group board's away state could never fire for a learner in them, and a
child had no "I'm leaving" flow. The 2026-09-11 validation found it missing in
every Grade 1 and Grade 2 page.

Four pieces, each read OUT of the tool that owns it rather than restated - two
copies of this wiring would be two builds that disagree about what focus mode
is:

  1. the import, and its comment         wire-platform-controls.py
  2. the CSS that lifts Ask Wehel above  wire-platform-controls.py
     the session bar, and only when the bar is there
  3. the script that MEASURES that lift   wire-platform-controls.py
     (the bar wraps, so its height is a property of the screen)
  4. the modulepreload line               preload-platform.py

It mounts nothing without those launch parameters, so an ordinary launch and
every local run look exactly as before.

A page with no platform controls is reported and left alone (the hub). Every
anchor must match exactly once or the page is refused untouched. Idempotent:
each piece is skipped when already present. deploy.mjs must ship seb-session.js
beside the pages - the shared one does; grade-1-app/deploy.mjs had to be told.
"""
import io
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))


def src(name):
    return io.open(os.path.join(HERE, name), encoding="utf-8", newline="").read()


def cut(s, start, end, label):
    """The text from the line holding `start` through the end of `end`."""
    if s.count(start) != 1:
        sys.exit("cannot read %s out of the wiring tool (%d matches)" % (label, s.count(start)))
    i = s.rfind("\n", 0, s.index(start)) + 1
    j = s.index(end, i) + len(end)
    return s[i:j]


WIRE = src("wire-platform-controls.py")
PIECES = {
    "import": cut(WIRE, "/* Focus mode and the session bar. Imported for its side effect",
                  '  import "./seb-session.js";\n', "the import"),
    "css": cut(WIRE, "/* The session bar (seb-session.js) is a fixed pill",
               "{ bottom: var(--seb-lift, 78px); }\n", "the lift CSS"),
    "lift": cut(WIRE, "/* How far Ask Wehel has to sit above the session bar",
                "  })();\n", "the lift script"),
}
PRELOAD = '<link rel="modulepreload" href="./seb-session.js">\n'
if PRELOAD.strip() not in src("preload-platform.py"):
    sys.exit("preload-platform.py no longer preloads seb-session.js - read it before carrying anything across")
for k, v in PIECES.items():
    if "\\" in v:
        sys.exit("the %s piece carries a backslash; it would need unescaping from the tool's string" % k)

# where each piece goes: (present-test, anchor, insert-before-anchor?)
PLACES = [
    ("import", 'import "./seb-session.js";', '  import { escapeHtml } from "./course-shell.js";\n', False),
    ("css", "body:has(#seb-session-bar) .w-dock", "  .w-dock { position: fixed;", True),
    ("lift", 'getElementById("seb-session-bar")', "  /* 2. Wehel. Mounted on first open", True),
    ("preload", 'href="./seb-session.js"', '<link rel="modulepreload" href="./course-shell.js">\n', False),
]


def apply(path, dry):
    s = io.open(path, encoding="utf-8", newline="").read()
    if 'import { escapeHtml } from "./course-shell.js";' not in s:
        return "no platform controls on this page"
    todo = [p for p in PLACES if p[1] not in s]
    if not todo:
        return "up to date"
    for name, _, anchor, before in todo:
        if s.count(anchor) != 1:
            return "REFUSED: the %s anchor matches %d times" % (name, s.count(anchor))
    for name, _, anchor, before in todo:
        piece = PRELOAD if name == "preload" else PIECES[name]
        if name == "lift":
            piece = piece + "\n"
        s = s.replace(anchor, piece + anchor if before else anchor + piece)
    if not dry:
        io.open(path, "w", encoding="utf-8", newline="").write(s)
    return ("would add " if dry else "added ") + ", ".join(p[0] for p in todo)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            sys.exit("unrecognised flag: %s" % f)
    if not args:
        sys.exit("usage: apply-focus-mode.py <page.html> [...] [--dry]")
    refused = 0
    for p in args:
        r = apply(p, "--dry" in flags)
        refused += r.startswith("REFUSED")
        print("  %-36s %s" % (os.path.basename(p), r))
    if "--dry" in flags:
        print("\n  --dry: nothing written")
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main())
