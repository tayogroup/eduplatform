# -*- coding: utf-8 -*-
"""Support and Challenge, closing Grade 5's one 0% row on the books-vs-app
comparison - every other grade already carries a differentiation feature.

    python add-differentiation.py            # report
    python add-differentiation.py --write

WHY THIS IS PROSE, NOT G1-4's BRANCHING QUIZ. G1-4's differentiation
(add-differentiation.py in those directories) hooks a wrong/right answer on a
SCORED deck question to route to an easier or harder follow-up question -
finish(), a sticker shelf, .dots nav. Grade 5 has none of that (see this
build's own app.config.json _comment): it is a scrolling page of
<section class="step">, no scoring, no finish(). Forcing G1-4's branching
mechanic onto a page shaped nothing like a deck would mean redesigning this
build's whole progress model for one feature.

Cambridge's OWN Differentiation box is prose too - a Support sentence and a
Challenge sentence in the Teacher's Guide, not a branching mechanic (see the
comparison's own book research: "a Differentiation box... inline
Support/Challenge/Encourage learners... sentences"). This closes the SAME gap
the book has, the way the book actually does it, rather than the way a
different grade's different architecture happens to.

ONE SOURCE. Text is read from app.config.json :: lessons[].support and
.challenge. A lesson with neither (check-what-you-know.html, the self-check
review - matching how the book itself does not tier its own Quiz page,
per this comparison's Self-assessment finding) is skipped, not invented.

INSERTED AFTER THE MATERIALS NOTE where one exists, so the grown-up's kit
list and the two learning routes read top to bottom without interleaving,
and STANDALONE (right after the header) where a lesson has no materials
note (real-life.html, check-what-you-know.html).

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

MARK = "ehel-g5-differentiation"
MATERIALS_MARK = "ehel-g5-materials-note"
cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))

CSS = """  .tiers { margin: 14px 0 0; border: 1px dashed var(--line); border-radius: 12px;
    padding: 0 14px; background: transparent; }
  .tiers[open] { padding-bottom: 12px; }
  .tiers > summary { cursor: pointer; list-style: none; padding: 9px 0; min-height: 44px;
    display: flex; align-items: center; gap: 8px;
    font-family: inherit; font-size: 14px; font-weight: 700; color: var(--muted); }
  .tiers > summary::-webkit-details-marker { display: none; }
  .tiers > summary::after { content: "+"; margin-left: auto; font-size: 18px; }
  .tiers[open] > summary::after { content: "\\2013"; }
  .tiers .tier { margin: 10px 0 0; }
  .tiers .tier:first-child { margin-top: 0; }
  .tiers .tier b { display: block; font-size: 12px; letter-spacing: .05em;
    text-transform: uppercase; color: var(--teal); margin: 0 0 3px; }
  .tiers .tier p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--ink); }
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
    if not l.get("support") or not l.get("challenge"):
        print("  skip     %-30s no support/challenge in app.config.json" % name)
        skipped += 1
        continue

    note = ('\n  <details class="tiers">'
            '<summary>Support and challenge</summary>'
            '<div class="tier"><b>An easier way in</b><p>%s</p></div>'
            '<div class="tier"><b>A harder challenge</b><p>%s</p></div>'
            '</details>' % (esc(l["support"]), esc(l["challenge"])))

    if MATERIALS_MARK in s:
        anchor = re.search(r'<details class="kit">.*?</details>', s)
        if not anchor:
            print("  REFUSED  %-30s has the materials marker but no <details class=\"kit\">" % name)
            refused += 1
            continue
        s = s[:anchor.end()] + note + s[anchor.end():]
    else:
        header = re.search(r'<header class="hero">[\s\S]*?</header>', s)
        if not header:
            print("  REFUSED  %-30s no <header class=\"hero\"> to sit under" % name)
            refused += 1
            continue
        s = s[:header.end()] + note + s[header.end():]

    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-differentiation.py */\n" + CSS + "</style>\n"

    assert s.count(MARK) >= 1 and s.count('class="tiers"') == 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s support %d words, challenge %d words"
          % ("wrote  " if WRITE else "would  ", name,
             len(l["support"].split()), len(l["challenge"].split())))
    done += 1

print("\n  %d lesson(s) %s, %d skipped, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
