# -*- coding: utf-8 -*-
"""Re-derive g1v2/ from the five-lesson build, in a TEMPORARY copy, and say how
the result differs from the committed build. It never writes g1v2/.

    python rebuild-g1v2.py              # rebuild in a temp dir, compare, delete it
    python rebuild-g1v2.py --keep DIR   # rebuild into DIR and leave it there

THE ORDER BELOW IS THE BUILD, and it is the README's list in executable form, so
the two cannot drift apart again. The README named six steps for most of a week
while more than twenty had been applied, and "a re-derive means running the
whole build list in order" was advice that failed at its third step: nothing
written down put two of the seven lessons into g1v2/ at all.

It was run for real on 2026-09-11 and the result compared byte for byte. The hub
comes back identical; every lesson comes back different in four known ways,
none of which is today's work being lost:

  1. two CSS blocks (the template alignment, fix-review-findings) sit in a
     different place, because the five-lesson build already carries the
     alignment block and the composer brings it in early. Computed colours were
     compared in all seven lessons: identical.
  2. the crest. add-header-bars.py now draws the logo image; the committed build
     still has the older inline SVG.
  3. the resume hook. wire-progress.py now records whether the child has really
     started; the committed build still reads done[0]. No Grade 1 lesson marks a
     step done at load, so the older hook resumes correctly here today.
  4. comment wording edited in the committed build alone: two comments in
     Halves and Wholes (Stage 2 codes replaced by words), one in Shapes and
     Sizes (the balance note).

2 and 3 are the lesson of this file: a guarded patcher applies ONCE, so
improving the tool afterwards does not reach a build it has already patched.
The committed g1v2/ is the source; change it by running a new guarded patcher
over it, and use this to see what a from-scratch build would change.
"""
import io, os, shutil, subprocess, sys, tempfile, difflib

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
MATHS = os.path.dirname(HERE)
REPO_SRC = os.path.abspath(os.path.join(MATHS, "..", "..", ".."))       # .../src
LESSONS = ["counting-to-twenty.html", "adding-and-taking-away.html", "halves-and-wholes.html",
           "what-comes-next.html", "shapes-and-sizes.html", "days-months-and-clocks.html",
           "asking-and-sorting.html"]
PAGES = ["g1v2/" + f for f in LESSONS]
T = "../lesson-app-tools/"

# (tool, arguments). "COPY" is the step nobody had written down; a tool marked
# "g1v2:" opens its pages by bare name and must run from inside g1v2/.
STEPS = [
    ("compose-lessons.py", []),                          # five of the seven, from the five-lesson build
    ("COPY", ["halves-and-wholes.html", "asking-and-sorting.html"]),   # the two it leaves "unchanged"
    ("build-hub.py", []),
    ("add-header-bars.py", []),
    ("add-platform-controls.py", []),
    ("keep-launch-params.py", []),
    ("preload-platform.py", []),
    ("g1v2:../align-g1v2-to-template.py", []),
    (T + "apply-wehel-panel-theme.py", PAGES),
    (T + "apply-wehel-prompts.py", PAGES),
    ("silence-load-narration.py", PAGES),
    (T + "add-page-doctype-lang.py", PAGES + ["g1v2/g1-index.html"]),
    (T + "wire-progress.py", ["--app", "g1v2"]),
    ("fix-review-findings.py", ["--write"]),
    (T + "wire-accessibility.py", ["--app", "g1v2", "--write"]),
    ("annotate-objectives.py", ["--write"]),
    (T + "wire-quiet-notice.py", ["--app", "g1v2", "--write"]),
    (T + "self-host-fonts.py", ["--app", "g1v2", "--write"]),
    ("gate-and-explain-check.py", ["--write"]),
    ("add-warmup.py", ["--write"]),
    ("add-second-steps.py", ["--write"]),
    ("fix-turn-and-tree.py", ["--write"]),
    # two more from the same evening that never reached this list, found by
    # running it: step 1's "Mix them up" (1Nc.01), and focus mode
    ("show-conservation.py", ["--write"]),
    (T + "apply-focus-mode.py", PAGES),
    # emoji a school tablet can draw: Grade 1's own six, then the rest of the
    # 2026-09-11 sweep - after add-second-steps.py, whose steps some of them
    # redraw, and before the hub, whose answer keys quote a picture
    ("replace-new-emoji.py", ["--write"]),
    (T + "replace-new-emoji-all-grades.py", ["--only", "grade-1-app/", "--write"]),
    ("build-grownup-section.py", ["--write"]),
]

argv = sys.argv[1:]
keep = argv[argv.index("--keep") + 1] if "--keep" in argv else None
for a in argv:
    if a.startswith("--") and a != "--keep":
        sys.exit("unrecognised argument: %s" % a)

root = os.path.abspath(keep) if keep else tempfile.mkdtemp(prefix="g1v2-rebuild-")
if os.path.exists(os.path.join(root, "src")):
    sys.exit("REFUSED: %s already holds a rebuild; give an empty directory" % root)
# the repo-relative layout the tools expect, and only what they read
mirror = os.path.join(root, "src", "prototypes", "ehel-academy")
ign = shutil.ignore_patterns("__pycache__", "*.pyc")
shutil.copytree(HERE, os.path.join(mirror, "mathematics", "grade-1-app"), ignore=ign)
shutil.copytree(os.path.join(MATHS, "lesson-app-tools"), os.path.join(mirror, "mathematics", "lesson-app-tools"), ignore=ign)
shutil.copytree(os.path.join(REPO_SRC, "prototypes", "ehel-academy", "shared", "fonts"), os.path.join(mirror, "shared", "fonts"))
shutil.copytree(os.path.join(REPO_SRC, "prototypes", "ehel-academy", "shell"), os.path.join(mirror, "shell"), ignore=ign)
os.makedirs(os.path.join(root, "src", "curriculum"))
shutil.copyfile(os.path.join(REPO_SRC, "curriculum", "cambridge-mathematics-0096.json"),
                os.path.join(root, "src", "curriculum", "cambridge-mathematics-0096.json"))
G1 = os.path.join(mirror, "mathematics", "grade-1-app")
for f in os.listdir(os.path.join(G1, "g1v2")):
    if f.endswith(".html"):
        os.remove(os.path.join(G1, "g1v2", f))              # app.config.json is an input and stays

env = dict(os.environ, PYTHONIOENCODING="utf-8")
failed = None
for tool, args in STEPS:
    if tool == "COPY":
        for f in args:
            shutil.copyfile(os.path.join(G1, f), os.path.join(G1, "g1v2", f))
        print("  %-36s copied %s" % ("(copy from the five-lesson build)", ", ".join(args)))
        continue
    cwd = G1
    if tool.startswith("g1v2:"):
        cwd, tool = os.path.join(G1, "g1v2"), tool[5:]
    r = subprocess.run([sys.executable, tool] + args, cwd=cwd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=env)
    last = ([l.strip() for l in (r.stdout + r.stderr).splitlines() if l.strip()] or [""])[-1]
    print("  %-36s exit %d  %s" % (tool.replace(T, "shared/").replace("../", ""), r.returncode, last[:80]))
    if r.returncode:
        failed = tool
        print((r.stdout + r.stderr)[-1500:])
        break

same = 0
if not failed:
    print("\n  the rebuild against the committed g1v2/:")
    for f in LESSONS + ["g1-index.html"]:
        a = io.open(os.path.join(HERE, "g1v2", f), encoding="utf-8", newline="").read().splitlines()
        b = io.open(os.path.join(G1, "g1v2", f), encoding="utf-8", newline="").read().splitlines()
        if a == b:
            same += 1
            print("    identical  %s" % f)
            continue
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        hunks = [op for op in sm.get_opcodes() if op[0] != "equal"]
        print("    differs    %-28s %d hunk(s)" % (f, len(hunks)))
        for op, i1, i2, j1, j2 in hunks:
            side = (b[j1:j2] or a[i1:i2])
            print("                 %-7s line %-5d %s" % (op, i1 + 1, " ".join(x.strip() for x in side)[:90]))
    print("\n  %d of 8 pages identical - the four known differences are in this file's docstring" % same)
if keep:
    print("  kept: %s" % G1)
else:
    shutil.rmtree(root, ignore_errors=True)
sys.exit(1 if failed else 0)
