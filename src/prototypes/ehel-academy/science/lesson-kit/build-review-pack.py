# -*- coding: utf-8 -*-
"""One page holding every question in this build, for the human read it needs.

WHY THIS EXISTS. check-coverage.py proves a key is SINGLE and EXPLAINED. It
cannot prove a key is RIGHT. And Science's other gate cannot help here:
check-science-answer-keys.mjs compares each key against the one printed in its
own booklet, and these standalone builds author their own questions rather than
taking them from a booklet - so their keys have no external ground truth and
never will. They are authored claims until a person reads them.

So this writes review-pack.html: every question in the build, grouped by
lesson, JUDGEMENT ITEMS FIRST - the ones where a wrong key is a wrong opinion
rather than a wrong fact, which is where a reviewer's time is worth most. Items
added by the Cambridge depth pass are marked, and each misconception item names
the Cambridge topic it came from.

    python ../lesson-kit/build-review-pack.py --app .

Reads the BUILT pages, so it reviews what ships. It lived in grade-1-app until
Grade 2 needed the same read; everything grade-specific now comes out of
app.config.json. Two things changed with the move and neither is cosmetic: the
lede no longer claims "Stage 1 ships no Practice booklet" (true, and true only
of Stage 1 - the reason these keys have no ground truth is that the build
authors its own questions), and the collector now reads a GRAPH step's
read-off list, which Grade 2 has three of and Grade 1 none. Missing that would
have dropped real questions out of the pack silently, which is the one failure
a review pack cannot have.
"""
import io
import json
import os
import re
import sys

LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)
# a key that rests on judgement rather than a fact a reviewer can look up
JUDGEMENT = re.compile(
    r"\b(is (?:he|she|it) right|are (?:they|these) right|what would you say|why |"
    r"what does that (?:tell|show)|what went wrong|is that right|which is best|"
    r"what should|most likely|would it be|fair)\b", re.I)

HEAD = """<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>@GRADE@ Science - question review pack</title>
<style>
 :root{--ink:#16211f;--paper:#f4f6f5;--card:#fff;--line:#d5ded9;--muted:#5d6d66;
       --new:#8a5a10;--newbg:#fdf3dd;--judge:#8f3a26;--judgebg:#fbe9e4}
 body{margin:0;background:var(--paper);color:var(--ink);
      font:15px/1.55 "Segoe UI",system-ui,sans-serif}
 .wrap{max-width:900px;margin:0 auto;padding:32px 20px 80px}
 h1{font-size:28px;margin:0 0 6px}
 .lede{color:var(--muted);margin:0 0 26px;max-width:66ch}
 h2{font-size:20px;margin:34px 0 4px;padding-top:14px;border-top:2px solid var(--line)}
 .lcount{color:var(--muted);font-size:13px;margin:0 0 14px}
 .q{background:var(--card);border:1px solid var(--line);border-radius:4px;
    padding:14px 16px;margin:0 0 10px}
 .q.j{border-left:4px solid var(--judge)}
 .tags{font:11px/1.4 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;
       color:var(--muted);margin:0 0 6px;display:flex;gap:8px;flex-wrap:wrap}
 .tag{padding:2px 7px;border-radius:3px;background:#eef2f0}
 .tag.new{background:var(--newbg);color:var(--new)}
 .tag.judge{background:var(--judgebg);color:var(--judge)}
 .ask{font-weight:600;margin:0 0 8px}
 ul{margin:0 0 8px;padding-left:20px}
 li{margin:0 0 3px}
 li.key{font-weight:700}
 li.key::after{content:" \\2190 the key";font-weight:400;color:var(--muted);font-size:13px}
 .why{color:var(--muted);font-size:14px;margin:0}
 .why b{color:var(--ink)}
 .sum{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:16px 18px;margin:0 0 8px}
 .sum table{border-collapse:collapse;width:100%;font-size:14px}
 .sum td{padding:4px 10px 4px 0}
 .sum td:last-child{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
</style>
<div class="wrap">
<h1>@GRADE@ Science - question review pack</h1>
<p class="lede">Every question in the @COUNT@ lessons. <b>Judgement items come
first in each lesson</b>: those are the keys where being wrong means holding a
wrong opinion rather than misremembering a fact, so they are where a reader's
time is worth most. Items added by the Cambridge depth pass are tagged
<span class="tag new">new</span>, and each one that answers a Cambridge
misconception names its topic. No gate can check whether these keys are right -
this build authors its own questions rather than taking them from a Cambridge
booklet, so there is no printed answer key to compare with.</p>
"""

WORDS = {8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen"}


def collect(app):
    cfg = json.load(io.open(os.path.join(app, "app.config.json"), encoding="utf-8"))
    mis_path = os.path.abspath(os.path.join(app, "..", "data",
                                            "cambridge-stage%d-misconceptions.json" % int(cfg["stage"])))
    mis = {}
    if os.path.isfile(mis_path):
        doc = json.load(io.open(mis_path, encoding="utf-8"))
        mis = {m["id"]: m for m in doc["misconceptions"]}
    out = []
    for n, entry in enumerate(cfg["lessons"], 1):
        p = os.path.join(app, entry["file"])
        if not os.path.isfile(p):
            sys.exit("REFUSED: %s is not built" % entry["file"])
        m = LESSON_RE.search(io.open(p, encoding="utf-8").read())
        if not m:
            sys.exit("REFUSED: no LESSON data in %s" % entry["file"])
        data = json.loads(m.group(1))
        qs = []
        for st in data["steps"]:
            d = st.get("data") or {}
            topics = sorted({mis[i]["topic"] for i in (st.get("mis") or []) if i in mis})
            def add(item, where, tier=""):
                if not item or not item.get("opts"):
                    return
                qs.append({"ask": item["ask"], "opts": item["opts"], "why": item.get("why", ""),
                           "where": where, "tier": tier, "codes": st["objectives"],
                           "topics": topics, "step": st["title"]})
            if st["kind"] in ("questions", "quiz"):
                for it in d.get("items") or []:
                    add(it, st["kind"])
                for t in ("support", "extension"):
                    for it in d.get(t) or []:
                        add(it, st["kind"], t)
            if st["kind"] == "experiment":
                for k in ("predict", "plan", "happened", "conclude"):
                    add(d.get(k), "experiment " + k)
            if st["kind"] in ("record", "graph"):
                for it in d.get("read") or []:
                    add(it, st["kind"] + " read-off")
            if st["kind"] == "measure":
                add(d.get("compare"), "measure compare")
            if st["kind"] in ("explore", "context"):
                add(d.get("then"), st["kind"] + " question")
            if st["kind"] == "ask":
                add((d.get("findOut") or None), "ask findOut")
        out.append((n, entry["title"], qs))
    return out, cfg


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def main():
    app = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
    lessons, cfg = collect(app)
    NEW = {"experiment plan", "experiment conclude", "record read-off", "graph read-off"}
    html = [HEAD.replace("@GRADE@", cfg["gradeLabel"])
                .replace("@COUNT@", WORDS.get(len(cfg["lessons"]), str(len(cfg["lessons"]))))]
    tot = judge = new = 0
    for n, title, qs in lessons:
        for q in qs:
            q["isJudge"] = bool(JUDGEMENT.search(q["ask"]))
            q["isNew"] = q["where"] in NEW or bool(q["tier"])
        qs.sort(key=lambda q: (not q["isJudge"], q["where"]))
        tot += len(qs)
        judge += sum(1 for q in qs if q["isJudge"])
        new += sum(1 for q in qs if q["isNew"])
        html.append('<h2>Lesson %d &middot; %s</h2>' % (n, esc(title)))
        html.append('<p class="lcount">%d questions, %d of them judgement items</p>'
                    % (len(qs), sum(1 for q in qs if q["isJudge"])))
        for q in qs:
            tags = ['<span class="tag">%s</span>' % esc(q["where"])]
            if q["tier"]:
                tags.append('<span class="tag new">%s tier</span>' % esc(q["tier"]))
            elif q["isNew"]:
                tags.append('<span class="tag new">new</span>')
            if q["isJudge"]:
                tags.append('<span class="tag judge">judgement</span>')
            if q["codes"]:
                tags.append('<span class="tag">%s</span>' % esc(" ".join(q["codes"])))
            if q["topics"]:
                tags.append('<span class="tag">Cambridge %s</span>' % esc(", ".join(q["topics"])))
            html.append('<div class="q%s">' % (" j" if q["isJudge"] else ""))
            html.append('<p class="tags">%s</p>' % "".join(tags))
            html.append('<p class="ask">%s</p>' % q["ask"])
            html.append("<ul>%s</ul>" % "".join(
                '<li class="%s">%s</li>' % ("key" if o.get("ok") else "", esc(o["t"])) for o in q["opts"]))
            if q["why"]:
                html.append('<p class="why"><b>Why:</b> %s</p>' % esc(q["why"]))
            html.append("</div>")
    summary = ('<div class="sum"><table>'
               '<tr><td>Questions in the build</td><td>%d</td></tr>'
               '<tr><td>Judgement items (read these first)</td><td>%d</td></tr>'
               '<tr><td>Added by the Cambridge depth pass</td><td>%d</td></tr>'
               '<tr><td>Keys any gate can verify as RIGHT</td><td>0</td></tr>'
               '</table></div>' % (tot, judge, new))
    html.insert(1, summary)
    out = os.path.join(app, "review-pack.html")
    io.open(out, "w", encoding="utf-8", newline="\n").write("\n".join(html) + "\n</div>\n")
    print("  wrote %s" % out)
    print("  %d questions, %d judgement items, %d new, 0 machine-verifiable" % (tot, judge, new))


main()
