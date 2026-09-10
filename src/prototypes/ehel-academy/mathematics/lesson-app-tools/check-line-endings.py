# -*- coding: utf-8 -*-
"""Every lesson file is LF, and differs from HEAD only if its CONTENT differs.

WHY THIS EXISTS. .gitattributes sets `* text=auto eol=lf`, so a stray CR is a
defect here rather than a platform difference - and the repo has been caught by
line endings before: its own comment records a rebuilt bundle showing 16,158
insertions and 16,158 deletions with zero content change, invisible because the
index compared a stat rather than re-hashing.

It is also a working detector, which the obvious shell one-liner is not.
`grep -c $'\\r'` collapses to an EMPTY pattern in Git Bash here: it returns the
LINE COUNT of every file, so a test for "no CR" is never true and reports
nothing whatever the file holds. Four checks were run that way and every one
passed without reading a byte.

    python lesson-app-tools/check-line-endings.py            # all four builds
    python lesson-app-tools/check-line-endings.py --app grade-2-app
"""
import io, os, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.abspath(os.path.join(ROOT, "..", "..", "..", ".."))
APPS = ["grade-1-app/g1v2", "grade-1-app", "grade-2-app", "grade-3-app", "grade-4-app"]

argv = sys.argv[1:]
only = argv[argv.index("--app") + 1] if "--app" in argv else None
bad = 0

for app in ([only] if only else APPS):
    d = os.path.join(ROOT, app)
    if not os.path.isdir(d):
        print("  no such build: %s" % app)
        raise SystemExit(2)
    files = sorted(f for f in os.listdir(d) if f.endswith(".html"))
    if not files:
        print("  %-18s no .html files - refusing to report a pass" % app)
        bad += 1
        continue
    for f in files:
        p = os.path.join(d, f)
        b = io.open(p, "rb").read()
        crlf = b.count(b"\r\n")
        cr = b.count(b"\r") - crlf
        rel = os.path.relpath(p, REPO).replace(os.sep, "/")
        head = subprocess.run(["git", "-C", REPO, "show", "HEAD:" + rel],
                              capture_output=True).stdout
        note = []
        if crlf:
            note.append("%d CRLF" % crlf)
        if cr:
            note.append("%d bare CR" % cr)
        if head and head != b:
            # a real content difference is git's business; a difference that is
            # ONLY line endings is this tool's, and the two look identical to
            # `git diff` under text=auto
            same_text = head.replace(b"\r\n", b"\n").replace(b"\r", b"\n") == \
                b.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
            note.append("differs from HEAD (%s)" %
                        ("LINE ENDINGS ONLY" if same_text else "content"))
        if note:
            print("  FAIL %-18s %-32s %s" % (app, f[:32], ", ".join(note)))
            bad += 1

print("\n%s" % ("%d finding(s)" % bad if bad else
                "every lesson file is LF and matches HEAD"))
raise SystemExit(1 if bad else 0)
