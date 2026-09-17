# -*- coding: utf-8 -*-
"""Every English answer key on one page per grade, for a reader who did not write them.

WHY
===
Cambridge publishes no Stage 1-4 answer booklet for English. There is therefore
no printed key to compare against, and **not one of the 629 comprehension keys
is machine-verifiable** - unlike Mathematics, where a gate recomputes what it
can derive. What the content gate CAN catch it already catches: an item with two
right answers, a boilerplate answer repeated across a section, a question
anchored to a passage it cannot be answered from. What it cannot do is read.

So the only instrument left is a person, and this builds the thing they read.
It is deliberately NOT deployed: it is a review surface, not a learner page.

HOW IT IS ORDERED
=================
Unverifiable first. A question whose answer is an open template ("any true
colour"), or whose options are absent, cannot be checked by anything and is
where a reader's attention is worth most. Then the rest, by unit.

Each question shows the text it is asked about, so the reader can answer it
before looking - which is the only way to catch a key that is wrong in the same
way its explanation is wrong.

    python tools/build-english-review-pack.py            # all four grades
    python tools/build-english-review-pack.py --grade 3
"""

import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:      # pragma: no cover
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGLISH = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english")
OUT = os.path.join(ROOT, "docs")

OPEN_ANSWER = re.compile(r"\(\s*(any|or|accept)\b|^\s*any\b|___", re.I)


def esc(s):
    return (str(s if s is not None else "")
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def load(p):
    with io.open(p, encoding="utf-8") as fh:
        return json.load(fh)


def options_of(q):
    o = q.get("options")
    if isinstance(o, list):
        return [str(x) for x in o]
    if isinstance(o, str) and o.strip():
        return [x.strip() for x in o.split("|") if x.strip()]
    d = q.get("distractors")
    if isinstance(d, list) and d:
        return [str(q.get("correctAnswer") or "")] + [str(x) for x in d]
    return []


def collect(grade):
    D = os.path.join(ENGLISH, "grade-%d" % grade, "data", "units")
    rows = []
    for n in range(1, 11):
        p = os.path.join(D, "unit-%d.json" % n)
        if not os.path.isfile(p):
            continue
        u = load(p)
        texts = {r["readingId"]: r for r in u.get("readings") or []}
        for c in u.get("comprehension") or []:
            rows.append({
                "unit": n, "unitTitle": u["unit"]["unitTitle"], "kind": "comprehension",
                "id": c.get("questionId"), "q": c.get("question"),
                "a": c.get("correctAnswer"), "why": c.get("explanation"),
                "opts": options_of(c), "type": c.get("questionType") or "",
                "source": (texts.get(c.get("readingId")) or {}).get("title") or "",
                "passage": (texts.get(c.get("readingId")) or {}).get("passageScript") or "",
                "review": c.get("reviewStatus") or "",
            })
        for q in u.get("quizzes") or []:
            rows.append({
                "unit": n, "unitTitle": u["unit"]["unitTitle"], "kind": "quiz",
                "id": q.get("questionId"), "q": q.get("question"),
                "a": q.get("correctAnswer"), "why": q.get("explanation"),
                "opts": options_of(q), "type": q.get("questionType") or "",
                "source": q.get("quizTitle") or "", "passage": "",
                "review": q.get("reviewStatus") or "",
            })
    for r in rows:
        r["unverifiable"] = bool(OPEN_ANSWER.search(str(r["a"] or ""))) or not r["opts"]
    return rows


CSS = """
:root{--ground:#FBFAF8;--card:#fff;--ink:#1A2129;--muted:#5F6D79;--rule:#E3E0DA;
 --flag:#A8431C;--flag-bg:#FBEFE9;--ok:#12756B}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--ground:#12161A;--card:#1A2026;
 --ink:#ECEFF2;--muted:#9BA7B2;--rule:#2B333B;--flag:#E2926F;--flag-bg:#2B1D16;--ok:#5FCDBE}}
:root[data-theme=dark]{--ground:#12161A;--card:#1A2026;--ink:#ECEFF2;--muted:#9BA7B2;
 --rule:#2B333B;--flag:#E2926F;--flag-bg:#2B1D16;--ok:#5FCDBE}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);
 font:16px/1.6 "Segoe UI",system-ui,-apple-system,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px 80px}
h1{font-size:29px;margin:0 0 6px;line-height:1.15}
.sub{color:var(--muted);margin:0 0 22px}
.note{background:var(--flag-bg);border:1px solid var(--rule);border-left:3px solid var(--flag);
 border-radius:4px;padding:15px 17px;margin:0 0 26px;font-size:15px}
h2{font-size:19px;margin:34px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--rule)}
.q{background:var(--card);border:1px solid var(--rule);border-radius:4px;padding:14px 16px;margin:0 0 12px}
.q.flag{border-left:3px solid var(--flag)}
.meta{font:12px/1.5 ui-monospace,Consolas,monospace;color:var(--muted);margin:0 0 6px}
.ask{font-weight:600;margin:0 0 7px}
.opts{margin:0 0 7px;font-size:14.5px;color:var(--muted)}
.opts b{color:var(--ok)}
.why{font-size:14.5px;color:var(--muted);margin:0}
details{margin:7px 0 0}
summary{cursor:pointer;font-size:13px;color:var(--muted)}
pre{white-space:pre-wrap;font:13px/1.55 "Segoe UI",sans-serif;background:var(--ground);
 border-radius:3px;padding:10px 12px;margin:7px 0 0;color:var(--ink)}
"""


def render(grade, rows):
    flagged = [r for r in rows if r["unverifiable"]]
    rest = [r for r in rows if not r["unverifiable"]]
    p = ['<!doctype html><html lang="en-GB"><head><meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         "<title>Grade %d English &mdash; every answer key</title><style>%s</style></head><body>"
         % (grade, CSS), '<div class="wrap">']
    p.append("<h1>Grade %d English &mdash; every answer key</h1>" % grade)
    p.append('<p class="sub">%d questions: %d comprehension, %d quiz. '
             "Nothing here is machine-verifiable &mdash; Cambridge publishes no Stage 1&ndash;4 "
             "answer booklet for English.</p>"
             % (len(rows), sum(1 for r in rows if r["kind"] == "comprehension"),
                sum(1 for r in rows if r["kind"] == "quiz")))
    p.append('<div class="note"><b>Read these %d first.</b> Their answer is an open template, or '
             "they carry no options, so no checker can say anything about them at all. Answer each "
             "question yourself from the text before you look at the key &mdash; a key that is wrong "
             "in the same way its explanation is wrong is invisible to any other method.</div>"
             % len(flagged))

    def block(r):
        cls = "q flag" if r["unverifiable"] else "q"
        out = ['<div class="%s">' % cls]
        out.append('<p class="meta">%s &middot; unit %d &middot; %s%s</p>'
                   % (esc(r["id"]), r["unit"], esc(r["type"] or r["kind"]),
                      (" &middot; " + esc(r["source"])) if r["source"] else ""))
        out.append('<p class="ask">%s</p>' % esc(r["q"]))
        if r["opts"]:
            out.append('<p class="opts">' + " &nbsp;|&nbsp; ".join(
                ("<b>%s</b>" % esc(o)) if str(o).strip() == str(r["a"]).strip() else esc(o)
                for o in r["opts"]) + "</p>")
        else:
            out.append('<p class="opts">answer: <b>%s</b></p>' % esc(r["a"]))
        if r["why"]:
            out.append('<p class="why">%s</p>' % esc(r["why"]))
        if r["passage"]:
            out.append("<details><summary>the text it is asked about</summary><pre>%s</pre></details>"
                       % esc(r["passage"]))
        out.append("</div>")
        return "".join(out)

    p.append("<h2>Not checkable by anything (%d)</h2>" % len(flagged))
    p += [block(r) for r in flagged]
    cur = None
    for r in rest:
        if r["unit"] != cur:
            cur = r["unit"]
            p.append("<h2>Unit %d &mdash; %s</h2>" % (cur, esc(r["unitTitle"])))
        p.append(block(r))
    p.append("</div></body></html>")
    return "\n".join(p)


def main(argv):
    grades = [1, 2, 3, 4]
    if "--grade" in argv:
        grades = [int(argv[argv.index("--grade") + 1])]
    for a in argv[1:]:
        if a not in ("--grade",) and not a.isdigit():
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2
    os.makedirs(OUT, exist_ok=True)
    total = flagged = 0
    for g in grades:
        rows = collect(g)
        if not rows:
            sys.stderr.write("REFUSED: grade %d yielded no questions\n" % g)
            return 1
        path = os.path.join(OUT, "english-g%d-answer-key-review.html" % g)
        io.open(path, "w", encoding="utf-8", newline="\n").write(render(g, rows) + "\n")
        f = sum(1 for r in rows if r["unverifiable"])
        total += len(rows); flagged += f
        print("  grade %d: %4d questions (%d not checkable) -> %s"
              % (g, len(rows), f, os.path.relpath(path, ROOT)))
    print("\n%d questions across %d grade(s); %d of them no checker can speak to."
          % (total, len(grades), flagged))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
