# -*- coding: utf-8 -*-
"""The questions no tool can check, laid out for a teacher who did not write them.

    python build-reviewer-pack.py            # report
    python build-reviewer-pack.py --out <file.html>

WHY THIS EXISTS. Both Cambridge comparison pages carry the same open row:
the answer keys have been read end to end, and both times by the author. A
self-review catches slips - it caught four at Stage 1 and two at Stage 2 - but
it structurally cannot catch an idea that is wrong in the key AND wrong in the
explanation in the same way, because the same hand wrote both in the same
minute. This is the input for the instrument that can: somebody else reading
them cold.

WHAT IS IN IT. Only the questions that rest on the author - the rows the
answer-key gate could not derive:

    Stage 1   313 of 489
    Stage 2   345 of 443   (plus 2 generated fresh each time, kept and marked)

The 272 the gate verifies by arithmetic are deliberately LEFT OUT. A reviewer
with 658 questions in front of them should spend every minute on the ones no
machine has ever checked, and padding the pile with machine-checked arithmetic
is how a review gets abandoned half way.

THE PICTURE PROBLEM, stated here because the pack cannot solve it. Some
questions are about something drawn on the screen - a shape, an array, a clock
face, coins on a table. For those, the words in this document are not enough to
judge the key, and the failure is specifically invisible: the key and the
explanation were written together, so they agree with each other whether or not
either agrees with the picture. This marks the ones it can detect and links
every lesson to its live page so the reviewer can open the step and look. It
does NOT claim the detection is complete - a question with no tell in its
wording can still depend on the screen, which is exactly why the live link is
on every lesson rather than only on the flagged ones.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
MATHS = os.path.dirname(HERE)
OUT = None
argv = sys.argv[1:]
if "--out" in argv:
    OUT = argv[argv.index("--out") + 1]
    argv = [a for a in argv if a != "--out" and a != OUT]
if argv:
    sys.exit("unrecognised argument: %s" % argv[0])

# stage -> (app dir, pack file, live URL base, expected author-dependent rows)
CDN = "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/"
SOURCES = [
    (1, "grade-1-app", "g1-review-pack.html", CDN + "grade-1-v2/", 313),
    (2, "grade-2-app", "g2-review-pack.html", CDN + "grade-2-lessons/", 345),
]

# Wording that means the question is about something the reviewer cannot see on
# paper. Deliberately generous: a false flag costs the reviewer one glance at
# the live step, a missed one costs a defect nobody can catch.
SCREEN = re.compile(
    r"\b(this|these|the)\s+(shape|array|picture|graph|chart|clock|pattern|bar|line|"
    r"diagram|tally|block|group|row|column|spinner|jug|scale|ruler)\b"
    r"|\bshown\b|\bhere (is|are)\b|\blook at\b|\bon the screen\b|\bthe picture\b"
    r"|\bpointer\b|\bhands?\b.*\bpoints?\b|\bdrawn\b|\bshaded\b"
    # added after sampling the rows this MISSED: every one of these points at
    # something on screen without naming it. "Which shape belongs with them?"
    # is unjudgeable on paper and carried none of the tells above.
    r"|\bbelongs? with\b|\bgoes with\b|\bwith them\b|\bdoes ?n[o']t belong\b"
    r"|\bodd one out\b|\bwhich one\b|\bwhich shape\b|\bwhich number comes\b"
    r"|\bcomes next\b|\bthe same as (it|this)\b|\bmatch(es)?\b", re.I)

UNESC = [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'),
         ("&#x27;", "'"), ("&#39;", "'"), ("&mdash;", "—"), ("&nbsp;", " ")]


def unesc(t):
    for a, b in UNESC:
        t = t.replace(a, b)
    return t


def strip_tags(t):
    return re.sub(r"\s+", " ", unesc(re.sub(r"<[^>]+>", "", t))).strip()


def harvest(path, stage, live, want):
    """Every author-dependent row in one pack, in the order a child meets it."""
    s = io.open(path, encoding="utf-8", newline="").read()
    # lesson titles, keyed by the file each <article> names
    titles = {}
    for m in re.finditer(r'<h2 class="lesson" data-file="([^"]+)">(.*?)(?:<span|</h2>)', s):
        titles.setdefault(m.group(1), strip_tags(m.group(2)))

    rows, kinds = [], {}
    for m in re.finditer(r'<article class="q([^"]*)"([^>]*)>([\s\S]*?)</article>', s):
        body, attrs = m.group(3), m.group(2)
        chip = re.search(r'<span class="chip[^"]*">([^<]*)</span>', body)
        chip = chip.group(1) if chip else ""
        kinds[chip] = kinds.get(chip, 0) + 1
        if chip == "key checked":
            continue                      # the gate already proved these
        f = re.search(r'data-file="([^"]+)"', attrs)
        f = f.group(1) if f else "?"
        ask = re.search(r'<p class="ask">([\s\S]*?)</p>', body)
        why = re.search(r'<p class="why">([\s\S]*?)</p>', body)
        step = re.findall(r'<span class="chip[^"]*">[^<]*</span><span>([^<]*)</span>', body)
        opts = [(("k" in c), strip_tags(t))
                for c, t in re.findall(r'<li class="([^"]*)">([\s\S]*?)</li>', body)]
        askt = strip_tags(ask.group(1)) if ask else ""
        whyt = strip_tags(why.group(1)) if why else ""
        whyt = re.sub(r"^Why the child is told:\s*", "", whyt)
        rows.append({
            "stage": stage, "file": f, "lesson": titles.get(f, f),
            "step": strip_tags(step[0]) if step else "",
            "ask": askt, "opts": [{"k": k, "t": t} for k, t in opts],
            "why": whyt, "generated": chip == "made fresh each time",
            "screen": bool(SCREEN.search(askt)) or not opts,
            "live": live + f,
        })

    got = sum(1 for r in rows if not r["generated"])
    if got != want:
        sys.exit("  REFUSED stage %d: %d author-dependent rows, expected %d. "
                 "The pack shape changed - re-measure before trusting this.\n"
                 "  chips seen: %s" % (stage, got, want, kinds))
    return rows, kinds


all_rows = []
for stage, app, pack, live, want in SOURCES:
    p = os.path.join(MATHS, app, pack)
    if not os.path.exists(p):
        sys.exit("  REFUSED: %s is missing. Run %s/build-review-pack.py first." % (p, app))
    rows, kinds = harvest(p, stage, live, want)
    all_rows += rows
    print("  stage %d  %-12s %3d author-dependent, %d generated   (chips: %s)"
          % (stage, app, sum(1 for r in rows if not r["generated"]),
             sum(1 for r in rows if r["generated"]), kinds))

# ---- floors, for the reasons the review packs carry theirs ------------------
if len(all_rows) != 313 + 345 + 2:
    sys.exit("  REFUSED: %d rows in total, expected 660." % len(all_rows))
blank_why = [r for r in all_rows if not r["why"]]
if blank_why:
    sys.exit("  REFUSED: %d rows carry no explanation. A reviewer cannot judge a "
             "key without the reason the child is given." % len(blank_why))
nokey = [r for r in all_rows if r["opts"] and not any(o["k"] for o in r["opts"])]
if nokey:
    sys.exit("  REFUSED: %d rows show no marked key." % len(nokey))

by_stage = {}
for r in all_rows:
    by_stage.setdefault(r["stage"], []).append(r)
print("")
print("  %d questions for the reviewer: stage 1 %d, stage 2 %d"
      % (len(all_rows), len(by_stage[1]), len(by_stage[2])))
print("  %d flagged as needing the screen (%.0f%%)"
      % (sum(1 for r in all_rows if r["screen"]),
         100.0 * sum(1 for r in all_rows if r["screen"]) / len(all_rows)))
print("  %d lessons" % len({(r["stage"], r["file"]) for r in all_rows}))

if OUT:
    io.open(OUT, "w", encoding="utf-8", newline="").write(
        json.dumps(all_rows, ensure_ascii=False, indent=1))
    print("  wrote %s" % OUT)
else:
    print("  (--out <file.json> to write the rows)")
