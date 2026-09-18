# -*- coding: utf-8 -*-
"""What to have to hand, folded away under the page's own header until asked
for - the same closeable gap Grades 1-4 already closed, now here too.

    python add-materials-note.py            # report
    python add-materials-note.py --write

WHY THIS BUILD NEEDS ITS OWN TOOL, NOT G4'S. Grade 5 has no deck: it is a
scrolling page of <section class="step"> blocks under one <header
class="hero">, no .say instruction bar to anchor under (app.config.json's own
_comment says so - no deck, no finish(), no .dots nav). The insertion point
here is the end of that header, before the lesson's step list starts, which is
this build's one page-level place a note "for the grown-up" can sit without
opening a child's first step on forty words they are not meant to read.

ONE SOURCE, same discipline as every other grade: the text is read from
app.config.json :: lessons[].materials. A lesson with none (real-life.html,
check-what-you-know.html) is skipped rather than given an invented note -
matching the book research this comparison did: Cambridge's own "Real Life"
equivalent keeps its context inside the question, not in a materials box.

WHY IT PATCHES THE BUILT PAGE. Every other authoring tool in this directory
(add-self-check.py, add-spot-the-mistake.py) already does the same, for the
same reason the root CLAUDE.md gives for the shell course's repair-ehel-math-*
tools: there is no separate source fragment here to rebuild from.

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

MARK = "ehel-g5-materials-note"
cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))

CSS = """  .kit { margin: 14px 0 0; border: 1px dashed var(--line); border-radius: 12px;
    padding: 0 14px; background: transparent; }
  .kit[open] { padding-bottom: 12px; }
  .kit > summary { cursor: pointer; list-style: none; padding: 9px 0; min-height: 44px;
    display: flex; align-items: center; gap: 8px;
    font-family: inherit; font-size: 14px; font-weight: 700; color: var(--muted); }
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

    header = re.search(r'<header class="hero">[\s\S]*?</header>', s)
    if not header:
        print("  REFUSED  %-30s no <header class=\"hero\"> to sit under" % name)
        refused += 1
        continue

    note = ('\n  <details class="kit">'
            '<summary>For the grown-up: what to have to hand</summary>'
            '<p>%s</p></details>' % esc(l["materials"]))
    s = s[:header.end()] + note + s[header.end():]
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-materials-note.py */\n" + CSS + "</style>\n"

    assert s.count(MARK) >= 1 and s.count('class="kit"') == 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s %d words, folded under the header"
          % ("wrote  " if WRITE else "would  ", name, len(l["materials"].split())))
    done += 1

print("\n  %d lesson(s) %s, %d skipped, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
