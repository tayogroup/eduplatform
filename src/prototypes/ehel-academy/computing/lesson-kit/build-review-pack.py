# -*- coding: utf-8 -*-
"""One page per grade holding every question this build asks, for a human read.

The curriculum gate re-computes the keys it CAN - Robo's routes, the table
answers, the debug fixes, the machines, the ciphers, the filters, the loops and
the sorts - from the same `_rules.py` the builder used. Everything else is a
multiple-choice question whose key was authored, and the key IS the thing the
question was written from, so nothing inside the build can disagree with it.
Those are not unchecked; they are unfalsifiable, and the only instrument left
is a person reading them.

So this prints them, UNVERIFIABLE FIRST, with the stem, every option, which one
is keyed, and the explanation a child is shown after answering. It is not in
the deploy set - it is a working document for whoever does the read.

    python ../lesson-kit/build-review-pack.py --app .
"""
import io
import json
import os
import re
import sys

KIT = os.path.dirname(os.path.abspath(__file__))
HERE = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)

# The step kinds whose keys `check-coverage.py` RE-COMPUTES from _rules.py. A
# question inside one of these has been compared with something outside itself.
COMPUTED_KINDS = {"table", "race", "chart", "datasort", "filter", "cipher", "robot",
                  "debug", "inout", "tweak", "parttest", "views", "sheet", "loopalgo",
                  "loopbuild", "branch", "branchbuild", "subroutine", "compare", "tidy"}

CSS = """
  :root { --ink:#16232b; --muted:#5d6f79; --line:#d5e0e4; --card:#fff; --ground:#eef2f4;
          --key:#1c6b4a; --keybg:#deefe6; --warn:#8a4a1c; --warnbg:#f6e7da; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--ground); color:var(--ink); font:16px/1.55 "Segoe UI",system-ui,sans-serif }
  .wrap { max-width:960px; margin:0 auto; padding:28px 20px 80px }
  h1 { font-size:30px; margin:0 0 6px; line-height:1.15 }
  .sub { color:var(--muted); margin:0 0 22px }
  .counts { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 26px }
  .counts span { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:8px 12px; font-size:14px }
  .counts b { font-variant-numeric:tabular-nums }
  h2 { font-size:15px; letter-spacing:.09em; text-transform:uppercase; color:var(--warn); margin:30px 0 4px }
  h2.ok { color:var(--key) }
  .note { color:var(--muted); font-size:14px; margin:0 0 14px; max-width:70ch }
  .q { background:var(--card); border:1px solid var(--line); border-left:4px solid var(--warn);
       border-radius:8px; padding:14px 16px; margin:0 0 10px }
  .q.ok { border-left-color:var(--key) }
  .where { font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin:0 0 6px }
  .where b { color:var(--ink) }
  .ask { font-weight:600; margin:0 0 8px }
  ul.opts { list-style:none; margin:0 0 8px; padding:0; display:flex; flex-wrap:wrap; gap:6px }
  ul.opts li { border:1px solid var(--line); border-radius:999px; padding:4px 11px; font-size:14px }
  ul.opts li.key { background:var(--keybg); border-color:var(--key); color:var(--key); font-weight:700 }
  .why { color:var(--muted); font-size:14.5px; margin:0 }
  .tierbadge { display:inline-block; font-size:11px; letter-spacing:.05em; text-transform:uppercase;
               background:var(--warnbg); color:var(--warn); border-radius:4px; padding:2px 6px; margin-left:6px }
"""


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(html))).strip()


def harvest(step, lesson_no, lesson_title, out):
    """Every ask-and-options question anywhere in a step, however it is nested.

    By SHAPE, not by the name of the array it sits in - Mathematics lost 135
    questions to a harvester that looked for `items:` and missed `support:`.
    """
    kind = step["kind"]
    computed = kind in COMPUTED_KINDS

    def walk(node, tier):
        if isinstance(node, dict):
            if "opts" in node and ("ask" in node or "t" in node):
                opts = node.get("opts") or []
                if opts and isinstance(opts, list) and all(isinstance(o, dict) and "t" in o for o in opts):
                    out.append({
                        "lesson": lesson_no, "lessonTitle": lesson_title,
                        "step": step["title"], "kind": kind, "tier": tier,
                        "ask": plain(node.get("ask") or node.get("t") or ""),
                        "opts": [(o["t"], bool(o.get("ok"))) for o in opts],
                        "why": plain(node.get("why") or ""),
                        "computed": computed,
                    })
            for k, v in node.items():
                if k in ("opts",):
                    continue
                walk(v, "support" if k == "support" else "extension" if k == "extension"
                     else "warm-up" if k == "warmup" else tier)
        elif isinstance(node, list):
            for v in node:
                walk(v, tier)

    walk(step.get("data") or {}, "")


def main():
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    rows = []
    for n, entry in enumerate(cfg["lessons"], 1):
        path = os.path.join(HERE, entry["file"])
        if not os.path.isfile(path):
            sys.exit("REFUSED: %s is not built" % entry["file"])
        m = LESSON_RE.search(io.open(path, encoding="utf-8").read())
        if not m:
            sys.exit("REFUSED: %s has no LESSON block" % entry["file"])
        data = json.loads(m.group(1))
        for st in data["steps"]:
            harvest(st, n, data["title"], rows)

    unver = [r for r in rows if not r["computed"]]
    comp = [r for r in rows if r["computed"]]
    tiers = sum(1 for r in rows if r["tier"] in ("support", "extension"))

    def card(r):
        return (
            '<div class="q%s"><p class="where">Lesson %d &middot; <b>%s</b> &middot; %s%s</p>'
            '<p class="ask">%s</p><ul class="opts">%s</ul><p class="why">%s</p></div>'
            % (" ok" if r["computed"] else "", r["lesson"], esc(r["lessonTitle"]), esc(r["step"]),
               ('<span class="tierbadge">%s</span>' % esc(r["tier"])) if r["tier"] else "",
               esc(r["ask"]),
               "".join('<li class="%s">%s</li>' % ("key" if ok else "", esc(t)) for t, ok in r["opts"]),
               esc(r["why"])))

    body = (
        '<h1>%s Computing &mdash; every question, for a human read</h1>'
        '<p class="sub">Cambridge Primary Computing 0059, Stage %s. Built from the shipped pages, '
        'not from the content modules.</p>'
        '<p class="counts"><span><b>%d</b> questions</span><span><b>%d</b> in steps whose keys the gate '
        're-computes</span><span><b>%d</b> unfalsifiable from inside the build</span>'
        '<span><b>%d</b> in a support or extension tier</span></p>'
        '<h2>Unfalsifiable &mdash; these need the read</h2>'
        '<p class="note">The key is the object the question was generated from, so nothing in the repo '
        'can disagree with it. Read the stem, the keyed option and the explanation together: the failure '
        'this catches is a question that is fine in shape and wrong in fact.</p>%s'
        '<h2 class="ok">Re-computed by the gate</h2>'
        '<p class="note">These keys are derived again from the shipped data by the same rules the builder '
        'used, every time <code>check-coverage.py</code> runs. Read them if you like; they cannot silently '
        'disagree with the thing they are about.</p>%s'
        % (esc(cfg["gradeLabel"]), esc(cfg["stage"]), len(rows), len(comp), len(unver), tiers,
           "".join(card(r) for r in unver), "".join(card(r) for r in comp)))

    page = ('<!doctype html>\n<html lang="en-GB">\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<title>%s Computing review pack</title>\n<style>%s</style>\n'
            '<div class="wrap">%s</div>\n</html>\n'
            % (esc(cfg["gradeLabel"]), CSS, body))
    out = os.path.join(HERE, "review-pack.html")
    io.open(out, "w", encoding="utf-8", newline="\n").write(page)
    print("  ok   review-pack.html   %d questions (%d re-computed, %d unfalsifiable, %d tiered)  %d bytes"
          % (len(rows), len(comp), len(unver), tiers, len(page)))


main()
