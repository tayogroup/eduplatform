# -*- coding: utf-8 -*-
"""Write the level hub: one card per unit, grouped by Cambridge stage.

    python build-hub.py --app ../level-1-app

Run it AFTER build-lessons.py: the cards count the steps in the pages that are
actually there, so a hub can never advertise a step a page does not have.

No time estimate on a card. The English hub prints "about N min" from a
measured `learningTime` in that course's data; this course has no such figure,
and inventing one from a step count would be a number about nothing. The card
says what it can count: steps, words, and the patterns the unit teaches.
"""

from __future__ import unicode_literals

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", ".."))
LIB = os.path.join(HERE, "lib")

ARGV = sys.argv[1:]
if "--app" in ARGV:
    OUT = os.path.abspath(os.path.join(os.getcwd(), ARGV[ARGV.index("--app") + 1]))
else:
    OUT = os.path.abspath(os.path.join(HERE, "..", "level-1-app"))
CFG = json.load(io.open(os.path.join(OUT, "app.config.json"), encoding="utf-8"))
LEVEL = int(CFG["level"])
DATA = os.path.join(ACADEMY, "intensive-english", "level-%d" % LEVEL, "data")
MANIFEST = json.load(io.open(os.path.join(DATA, "course-manifest.json"), encoding="utf-8"))


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def page_facts(name):
    """Steps and words, counted in the built page rather than the data.

    The page is the thing the learner opens, so it is the honest source for
    what is on it. A hub built from the data would keep advertising a step the
    builder had stopped emitting.
    """
    path = os.path.join(OUT, name)
    if not os.path.isfile(path):
        sys.exit("REFUSED: %s is not built yet - run build-lessons.py first" % name)
    html = io.open(path, encoding="utf-8").read()
    steps = html.count('<section class="slide"')
    words = 0
    m = re.search(r'"groups": (\[.*?\n \]),\n "patterns"', html, re.S)
    if m:
        try:
            words = sum(len(g["words"]) for g in json.loads(m.group(1)))
        except ValueError:
            words = 0
    patterns = len(re.findall(r'"title": "[^"]*",\n +"explanation"', html))
    return steps, words, patterns


BANDS = {b["stage"]: b for b in (MANIFEST["level"].get("cefrBands") or [])}


def card(entry):
    unit = entry["unit"]
    steps, words, patterns = page_facts(entry["file"])
    meta = next((u for u in MANIFEST["units"] if u["number"] == unit), {})
    return (
        '      <a class="card" href="%s?from=%s">\n'
        '        <span class="num">Unit %d</span>\n'
        "        <h2>%s</h2>\n"
        '        <p class="band">CEFR %s</p>\n'
        '        <p class="facts">%d steps &middot; %d words &middot; %d patterns</p>\n'
        "      </a>\n"
        % (esc(entry["file"]), esc(CFG["fromParam"]), unit, esc(entry["title"]),
           esc(meta.get("cefr", "")), steps - 1, words, patterns)
    )


HUB = """<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(levelLabel)s</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s
  .hubwrap { max-width: 1040px; margin: 0 auto; padding: 28px 20px 60px; }
  .hubhead h1 { font-size: 40px; margin: 6px 0 10px; text-wrap: balance; }
  .hubhead p { color: var(--muted); max-width: 62ch; }
  .hub-stage { margin: 30px 0 10px; }
  .hub-stage h2 { font-size: 22px; margin: 0 0 2px; }
  .hub-stage p { color: var(--muted); margin: 0 0 12px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .card {
    display: block; background: var(--card); border: 1px solid var(--line); border-radius: 16px;
    padding: 16px 18px; text-decoration: none; color: inherit; box-shadow: var(--shadow);
  }
  .card:hover { border-color: var(--teal); transform: translateY(-2px); }
  .card .num { color: var(--muted); font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
  .card h2 { font-size: 21px; margin: 4px 0 8px; }
  .card .band { display: inline-block; background: var(--teal-soft); color: var(--ink); border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; margin: 0 0 8px; }
  .card .facts { color: var(--muted); font-size: 14px; margin: 0; }
</style>

<div class="hubwrap">
  <header class="hubhead">
    <p class="eyebrow">Ehel Academy &middot; Intensive English</p>
    <h1>%(levelLabel)s</h1>
    <p>%(exit)s</p>
  </header>
%(stages)s
</div>
"""


def main():
    css = io.open(os.path.join(LIB, "lesson.css"), encoding="utf-8").read()
    by_stage = {}
    for entry in CFG["lessons"]:
        meta = next((u for u in MANIFEST["units"] if u["number"] == entry["unit"]), {})
        by_stage.setdefault(meta.get("stage", 0), []).append(entry)

    blocks = []
    for stage in sorted(by_stage):
        band = BANDS.get(stage, {})
        blocks.append(
            '  <section class="hub-stage">\n'
            "    <h2>Stage %s &middot; %s</h2>\n"
            "    <p>%s</p>\n"
            '    <div class="cards">\n%s    </div>\n'
            "  </section>\n"
            % (stage, esc(band.get("cefrName", "")), esc(band.get("canDo", "")),
               "".join(card(e) for e in by_stage[stage]))
        )

    html = HUB % {
        "levelLabel": esc(CFG["levelLabel"]),
        "css": css,
        "exit": esc(MANIFEST["level"].get("exitDescriptor", "")),
        "stages": "".join(blocks),
    }
    with io.open(os.path.join(OUT, CFG["hub"]), "w", encoding="utf-8", newline="") as fh:
        fh.write(html)
    print("  %s: %d cards across %d stage(s)" % (CFG["hub"], len(CFG["lessons"]), len(by_stage)))


if __name__ == "__main__":
    main()
