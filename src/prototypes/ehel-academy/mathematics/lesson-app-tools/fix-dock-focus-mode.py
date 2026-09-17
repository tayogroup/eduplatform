# -*- coding: utf-8 -*-
"""The dock's footer lift is discarded in focus mode. Carry it into both launches.

    python fix-dock-focus-mode.py --app <build>            # report
    python fix-dock-focus-mode.py --app <build> --write

WHAT IS WRONG. Commit 64b4cfd3c lifted the Ask Wehel dock clear of the Back/Next
footer with one rule:

    .w-dock, .w-drawer { bottom: calc(14px + var(--wehel-foot-lift, 0px)); }

Every one of these pages already carried, earlier in the same stylesheet:

    body:has(#seb-session-bar) .w-dock,
    body:has(#seb-session-bar) .w-drawer { bottom: var(--seb-lift, 78px); }

`body:has(#seb-session-bar) .w-dock` is specificity (1,1,1). A bare `.w-dock` is
(0,1,0). Source order never gets a say, so the moment #seb-session-bar exists the
footer lift is thrown away and the dock drops back onto Next - the exact bug the
commit fixed, in the FOCUS MODE launch, which is the live-class and exam flow.

MEASURED on the live Grade 2 page (its own stylesheet, the dock element supplied
the way wehel.js injects it, --wehel-foot-lift set to 120px, --seb-lift to 94px):

    normal launch   bottom: 134px   = 14 + 120     the lift is applied
    focus mode      bottom:  94px   = --seb-lift   the lift is GONE

THE FIX is one more rule, composing the two offsets instead of letting one
replace the other, placed immediately after the existing seb rule so that at
equal specificity it wins on source order:

    body:has(#seb-session-bar) .w-dock,
    body:has(#seb-session-bar) .w-drawer {
      bottom: calc(var(--seb-lift, 78px) + var(--wehel-foot-lift, 0px)); }

Nothing else changes. The original one-rule fix stays exactly where it is and
keeps answering the normal launch, where it is correct and is already live; the
measuring script that sets --wehel-foot-lift is untouched and already runs.

SCOPE. `--app` is required and this refuses a build that does not already carry
BOTH the seb rule and the partial fix - it repairs that specific shipped state
and is not a general dock patcher.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
argv = sys.argv[1:]
WRITE = "--write" in argv
APP = None
if "--app" in argv:
    APP = argv[argv.index("--app") + 1]
    argv = [a for a in argv if a not in ("--app", APP)]
for a in argv:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)
if not APP:
    sys.exit("--app <build directory> is required")

MARK = "ehel-dock-foot-lift-focus"

SEB = re.compile(
    r"body:has\(#seb-session-bar\) \.w-dock,\s*\n"
    r"\s*body:has\(#seb-session-bar\) \.w-drawer \{[^}]*\}")
PARTIAL = ".w-dock, .w-drawer { bottom: calc(14px + var(--wehel-foot-lift, 0px)); }"

ADD = """

  /* %s: AND THE SAME LIFT IN FOCUS MODE.
     The rule directly above is specificity (1,1,1); the `.w-dock, .w-drawer`
     rule further down that spends --wehel-foot-lift is (0,1,0), so with a
     session bar on screen the footer lift was being thrown away entirely and
     the dock sat back on top of Next. Measured on the live page before this
     went in: 134px without the bar (correct), 94px with it (the lift gone).
     This composes the two offsets rather than letting one replace the other,
     and sits after the rule above so it wins on source order at equal
     specificity. */
  body:has(#seb-session-bar) .w-dock,
  body:has(#seb-session-bar) .w-drawer {
    bottom: calc(var(--seb-lift, 78px) + var(--wehel-foot-lift, 0px)); }""" % MARK

pages = sorted(f for f in os.listdir(APP)
               if f.endswith(".html") and "review-pack" not in f)
todo, done, skipped, refused = [], 0, 0, 0
for f in pages:
    p = os.path.join(APP, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if ".w-dock {" not in s and ".w-dock{" not in s:
        skipped += 1
        continue
    if MARK in s:
        print("  already  %s" % f)
        done += 1
        continue
    m = SEB.search(s)
    if not m:
        print("  REFUSED  %-28s no seb rule to sit after" % f)
        refused += 1
        continue
    if PARTIAL not in s:
        print("  REFUSED  %-28s does not carry the partial fix this repairs" % f)
        refused += 1
        continue
    out = s[:m.end()] + ADD + s[m.end():]
    if out.count(MARK) != 1:
        print("  REFUSED  %-28s marker count %d" % (f, out.count(MARK)))
        refused += 1
        continue
    todo.append((p, out))
    print("  would    %s" % f)

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)

print("")
print("  %d page(s) %s, %d already done, %d without a dock, %d refused%s"
      % (len(todo), "written" if WRITE else "to write", done, skipped, refused,
         "" if WRITE else "   (--write to apply)"))
