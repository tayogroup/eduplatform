# -*- coding: utf-8 -*-
"""What to have to hand, on the lesson's first step, folded away until asked for.

    python add-materials-note.py            # report
    python add-materials-note.py --write

WHY IT IS NOT ONLY ON THE HUB. THIS BUILD HAS NO GROWN-UP SECTION YET, so unlike Grade 1 there is nowhere else
the list appears at all. When one is written it should read the same field rather
than carry a second copy. The hub half of Grade 1's argument was that a parent
who opens a lesson from a link never passes the hub's collapsed section, which is the right place
for planning - but that section is a collapsed <details> at the foot of the hub,
and a parent who opens a lesson from a link never passes it. The one moment the
list is worth anything is before the child starts, so it is also on step 1.

WHY IT IS FOLDED. This is the reframe rather than a feature: Cambridge Stage 2 is
physical throughout - cubes, hundred squares, digit cards, coins, rulers, kitchen
scales, measuring jugs and the actual solid shapes - and a screen cannot be any of that. The
honest thing an app can do is say which real things to get out. But that sentence
is addressed to the ADULT, and a child's step should not open with forty words
they are not meant to read. Collapsed, it costs one quiet line; opened, it is the
whole list.

ONE SOURCE. The text is read from app.config.json :: lessons[].materials, the
same field the hub renders. A second copy in the page would be a second thing to
keep true.

STEP 1 ONLY, and that is a judgement rather than a limitation. Nearly every step
in these lessons has a physical equivalent - the ten frames, the number track,
the balance, the jug - and a note on each would be noise a reader learns to skip.
An adult sets up once, at the start.

Guarded by a marker; every anchor must match exactly once or the file is refused.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
# Grade 2 keeps its lessons in the app root, where Grade 1 has a g1v2/ subfolder
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
