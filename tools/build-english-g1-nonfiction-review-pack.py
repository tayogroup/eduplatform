# -*- coding: utf-8 -*-
"""One page carrying every item author-english-g1-nonfiction.py added, for a human read.

Neither the Science nor the Mathematics Stage 1 pass could machine-verify a
Grade 1 answer key, and neither can this one: Cambridge ships no Stage 1
answer booklet for English, so there is no printed key to compare against.
What a checker CAN say is that a question is anchored to its passage, that its
answer is short enough to become an option, and that no two questions are
identical. Whether a six-year-old can answer it, and whether the answer is the
one a teacher would accept, is a person's judgement.

So this exists to be READ, not to pass. It prints the ten texts with their
questions underneath, the writing task each unit gained, and the objectives the
new outcome now carries -- everything in one scroll, with the answer beside the
question rather than at the back, because the reader here is checking the key
and not sitting the test.

    python tools/build-english-g1-nonfiction-review-pack.py
    -> docs/english-g1-nonfiction-review-pack.html

Deliberately NOT part of any deploy set.
"""

import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                     "grade-1", "data", "units")
OUT = os.path.join(ROOT, "docs", "english-g1-nonfiction-review-pack.html")

MARK = "Cambridge Stage 1 non-fiction text types"


def esc(s):
    return (str(s or "").replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def main():
    units = []
    for n in range(1, 11):
        with io.open(os.path.join(UNITS, "unit-%d.json" % n), encoding="utf-8") as fh:
            units.append(json.load(fh))

    rows = []
    n_read = n_q = n_write = 0
    for u in units:
        uid = u["unit"]["unitId"]
        reading = next((r for r in u["readings"] if MARK in (r.get("origin") or "")), None)
        if not reading:
            continue
        outcome = next((o for o in u["outcomes"] if MARK in (o.get("origin") or "")), None)
        qs = [c for c in u["comprehension"] if MARK in (c.get("origin") or "")]
        write = next((w for w in u["writing"] if MARK in (w.get("origin") or "")), None)
        check = next((s for s in u.get("selfAssessment") or []
                      if MARK in (s.get("origin") or "")), None)
        n_read += 1
        n_q += len(qs)
        n_write += 1 if write else 0
        rows.append((u, reading, outcome, qs, write, check))

    parts = ["""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grade 1 English &mdash; the non-fiction texts, for review</title>
<style>
 :root{--ink:#16202b;--mut:#5a6876;--rule:#d9e0e7;--bg:#f6f8fa;--card:#fff;--ok:#2c6650;--acc:#0f5c7a}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--ink);
      font:16px/1.6 "Segoe UI",system-ui,-apple-system,sans-serif}
 .wrap{max-width:900px;margin:0 auto;padding:32px 20px 80px}
 h1{font-size:30px;margin:0 0 6px;line-height:1.15}
 .sub{color:var(--mut);margin:0 0 28px}
 .unit{background:var(--card);border:1px solid var(--rule);border-radius:4px;
       padding:22px 24px;margin:0 0 22px}
 .unit h2{font-size:20px;margin:0 0 2px}
 .meta{font:13px/1.5 ui-monospace,Consolas,monospace;color:var(--mut);margin:0 0 16px}
 .kind{display:inline-block;background:#e8f0f4;color:var(--acc);border-radius:2px;
       padding:2px 8px;font:12px/1.5 ui-monospace,monospace;letter-spacing:.04em}
 .passage{white-space:pre-wrap;background:var(--bg);border-left:3px solid var(--rule);
          padding:14px 16px;margin:0 0 18px;font-size:15px}
 h3{font:600 12px/1.5 ui-monospace,monospace;letter-spacing:.09em;text-transform:uppercase;
    color:var(--mut);margin:20px 0 8px}
 ol{margin:0;padding-left:20px}
 li{margin:0 0 12px}
 .ans{color:var(--ok);font-weight:600}
 .why{color:var(--mut);font-size:14px;display:block}
 .wrong{color:var(--mut);font-size:14px;display:block}
 .task{background:var(--bg);border-radius:3px;padding:14px 16px;font-size:15px}
 .task b{display:block;margin-bottom:4px}
 table{border-collapse:collapse;width:100%;font-size:14px;margin:0 0 6px}
 td,th{text-align:left;padding:6px 10px 6px 0;border-bottom:1px solid var(--rule);
       vertical-align:top}
 th{font:600 12px/1.5 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;
    color:var(--mut)}
 .note{background:#fff8e6;border:1px solid #e8d9a8;border-radius:4px;padding:16px 18px;
       margin:0 0 26px;font-size:15px}
</style></head><body><div class="wrap">"""]

    parts.append("<h1>Grade 1 English &mdash; the non-fiction texts</h1>")
    parts.append('<p class="sub">%d texts, %d questions and %d writing tasks added on '
                 "2026-09-16, one per unit, each a different Cambridge Stage 1 "
                 "non-fiction text type. Every item below is marked "
                 "<em>Needs curriculum review</em>.</p>" % (n_read, n_q, n_write))
    parts.append('<div class="note"><b>What a checker could not decide, and you can.</b> '
                 "Cambridge ships no Stage 1 answer booklet for English, so not one of these "
                 "%d answers is machine-verifiable as right. What has been checked: every "
                 "question is anchored to its own passage (it shares wording with it), every "
                 "answer is short enough to become a tappable option, and no question repeats "
                 "another. What has not: whether a six-year-old can answer it, and whether the "
                 "answer is the one you would accept.</div>" % n_q)

    for u, reading, outcome, qs, write, check in rows:
        no = u["unit"]["unitNo"]
        parts.append('<div class="unit">')
        parts.append("<h2>Unit %d &middot; %s</h2>" % (no, esc(u["unit"]["unitTitle"])))
        parts.append('<p class="meta">%s &nbsp; <span class="kind">%s</span></p>'
                     % (esc(reading["readingId"]), esc(reading["type"])))
        parts.append('<h3>The text &mdash; %s</h3>' % esc(reading["title"]))
        parts.append('<div class="passage">%s</div>' % esc(reading["passageScript"]))

        if outcome:
            parts.append("<h3>The outcome it delivers</h3>")
            parts.append("<table><tr><th>Outcome</th><th>Cambridge</th></tr>"
                         "<tr><td>%s</td><td>%s</td></tr></table>"
                         % (esc(outcome["learningOutcome"]),
                            esc(", ".join(outcome.get("cambridgeObjectives") or []))))

        if qs:
            parts.append("<h3>Questions (%d)</h3><ol>" % len(qs))
            for c in qs:
                parts.append("<li>%s<br><span class='ans'>%s</span>"
                             "<span class='wrong'>also offered: %s</span>"
                             "<span class='why'>%s</span></li>"
                             % (esc(c["question"]), esc(c["correctAnswer"]),
                                esc(" / ".join(c.get("distractors") or [])),
                                esc(c.get("explanation"))))
            parts.append("</ol>")

        if write:
            parts.append("<h3>Writing task</h3>")
            parts.append('<div class="task"><b>%s</b>%s<br><br>'
                         "<i>Model:</i> %s<br><i>Expected:</i> %s</div>"
                         % (esc(write["title"]), esc(write["promptAndInstructions"]),
                            esc(write.get("modelText")), esc(write.get("expectedLength"))))

        if check:
            parts.append("<h3>Self-check</h3><p>%s</p>" % esc(check["statement"]))
        parts.append("</div>")

    parts.append("</div></body></html>")

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(parts) + "\n")
    print("wrote %s" % os.path.relpath(OUT, ROOT))
    print("  %d texts, %d questions, %d writing tasks" % (n_read, n_q, n_write))


if __name__ == "__main__":
    main()
