# -*- coding: utf-8 -*-
"""What to have to hand, on the lesson's first step, folded away until asked for.

    python add-materials-note.py            # report
    python add-materials-note.py --write

THE SAME GAP CLOSED IN GRADE 3, NOW HERE TOO. The books vs app comparison for
Mathematics Stages 1-4 named this row "Cambridge leads" for Grade 3 and 4
specifically - Grade 1 and 2 already had this file, and neither Grade 3 nor 4
did until this week. Stage 4's own apparatus (per the comparison's book
research) is a fraction strip and a geoboard new to this stage, arrays and the
number line well established, base-10 receding as numbers outgrow physical
blocks - none of it in this build until now.

WHY IT PATCHES THE BUILT PAGE, not a fragment. This build's own README says
these eight lessons are wired by build-all.sh and the toolchain in
../lesson-app-tools, and every tool that has added teaching here since the
depth pass (add-spot-the-mistake.py, add-twm-stamps.py, add-differentiation.py,
add-self-check.py) patches the BUILT .html directly, for the reason the root
CLAUDE.md documents for the shell course's own repair-ehel-math-* tools: a
rebuild discards anything not in the model it rebuilds from.

ONE SOURCE. The text is read from app.config.json :: lessons[].materials, the
same field build-grownup-section.py renders in the hub's "What to have to
hand" panel.

WHY FOLDED, AND WHY STEP 1 ONLY: identical reasoning to Grade 1, 2 and 3. The
sentence is addressed to the adult, so a child's first step should not open
with forty words they are not meant to read.

Guarded by a marker; every anchor must match exactly once or the file is
refused rather than half-patched.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = HERE
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-materials-note"
cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))

CSS = """  .kit { margin: 10px 0 0; border: 1px dashed var(--line); border-radius: 12px;
    padding: 0 14px; background: transparent; }
  .kit[open] { padding-bottom: 12px; }
  .kit > summary { cursor: pointer; list-style: none; padding: 9px 0; min-height: 44px;
    display: flex; align-items: center; gap: 8px;
    font-family: "Inter", "Segoe UI", sans-serif; font-size: 14px; font-weight: 700;
    color: var(--muted); }
  .kit > summary::-webkit-details-marker { display: none; }
  .kit > summary::after { content: "+"; margin-left: auto; font-size: 18px; }
  .kit[open] > summary::after { content: "\\2013"; }
  .kit p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--ink); }
"""


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


done = skipped = refused = 0
for l in cfg["lessons"]:
    name = l["file"]
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    if not l.get("materials"):
        print("  skip     %-30s no materials in app.config.json" % name)
        skipped += 1
        continue

    first = re.search(r'<section class="slide"[\s\S]*?</section>', s)
    bad = []
    if not first:
        bad.append("no slides")
    else:
        bar = re.search(r'<div class="say">[\s\S]*?</div>', first.group(0))
        if not bar:
            bad.append("step 1 has no instruction bar to sit under")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    note = ('\n      <details class="kit">'
            '<summary>For the grown-up: what to have to hand</summary>'
            '<p>%s</p></details>' % esc(l["materials"]))
    whole = first.group(0)
    patched = whole.replace(bar.group(0), bar.group(0) + note, 1)
    s = s[:first.start()] + patched + s[first.end():]
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-materials-note.py */\n" + CSS + "</style>\n"

    assert s.count(MARK) >= 1 and s.count('class="kit"') == 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s %d words, folded away on step 1"
          % ("wrote  " if WRITE else "would  ", name, len(l["materials"].split())))
    done += 1

print("\n  %d lesson(s) %s, %d skipped, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
