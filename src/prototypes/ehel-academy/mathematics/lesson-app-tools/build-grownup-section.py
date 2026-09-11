# -*- coding: utf-8 -*-
"""Give the adult in the room a page on the hub, and put a time on every lesson.

    python build-grownup-section.py --app ../grade-2-app            # report
    python build-grownup-section.py --app ../grade-2-app --write

The 2026-09-11 validation found the same two gaps in Grades 2, 3 and 4 that
Grade 1's had closed the same day with grade-1-app/build-grownup-section.py:

  Learning-time estimates     no lesson said how long it takes, and no hub
                              said how long the year's lessons take together.
  Teacher and parent support  one paragraph, "For the grown-up", about strand
                              coverage. No objectives, no answer keys, no pass
                              mark, nothing to do at home.

This is that tool made to take --app, for the three builds after Grade 1. The
Grade 1 one stays where it is: it reads Grade 1's own annotation format and its
two check shapes, and its output is live and validated - re-pointing it would
rewrite a page nobody asked to change.

EVERYTHING HERE IS READ, NOT RETYPED.

  the objectives   every code of the build's stage written in the lesson - after
                   audit-stage-coverage.py passes, every one of those is a claim
                   about that lesson - in Cambridge's own words from
                   src/curriculum/cambridge-mathematics-0096.json
  the steps        each step's own <h2> and spoken prompt
  the check        its questions, marked answers and reasons, and the pass mark
                   the lesson's own gate uses
  at home          app.config.json :: lessons[].atHome - the ONE authored part,
                   because nothing in a lesson is an activity for a kitchen table

THREE CHECK SHAPES, AND A FOURTH REFUSES.

  Grade 2   const CHECK = [{ q, opts, a, why }]          a is the answer
  Grade 4   const QN = shuffle([{ q, o, a, w }])         a is an INDEX into o
  Grade 3   const QS = [() => ({ q, opts, a, why })]     made fresh every time

The fixed lists are evaluated by node, not pattern-matched, so a question with
a comma, a quote or a \\u escape in it cannot be half-read; the count read is
cross-checked against an independent count of items. Grade 3's questions are
GENERATED - numbers change on every attempt - so there is no fixed key to
print, and the page says that rather than printing one sample as if it were the
key. A shape this cannot read fails the run: an answer key a parent marks
against must not be quietly one question short.

THE MINUTES ARE AN ESTIMATE AND THE PAGE SAYS SO: 2.5 minutes a step, the same
rate Grade 1 and Science use, rounded to the nearest 5. Nobody has timed a
child yet.

Regenerated between markers, so a re-run replaces the section; idempotent.
Grade 4's hub is REBUILT by build-hub.py, so this runs in its build-all.sh
after the hub - run by hand, it would be wiped by the next build.
"""
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
FRAMEWORK = os.path.join(REPO, "src", "curriculum", "cambridge-mathematics-0096.json")
WRITE = "--write" in sys.argv
for a in sys.argv[1:]:
    if a.startswith("--") and a not in ("--app", "--write"):
        sys.exit("unrecognised argument: %s" % a)

MIN_PER_STEP = 2.5
START = "<!-- GROWNUP:START  built by lesson-app-tools/build-grownup-section.py -->"
END = "<!-- GROWNUP:END -->"
NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
           "eleven", "twelve"]


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def plain(t):
    t = re.sub(r"<[^>]*>", "", str(t))
    for a, b in (("&mdash;", "—"), ("&ndash;", "–"), ("&minus;", "−"), ("&nbsp;", " "),
                 ("&rsquo;", "’"), ("&lsquo;", "‘"), ("&ldquo;", "“"), ("&rdquo;", "”"),
                 ("&times;", "×"), ("&divide;", "÷"), ("&hellip;", "…"),
                 ("&rarr;", "→"), ("&middot;", "·"), ("&quot;", '"'), ("&#39;", "'"), ("&amp;", "&")):
        t = t.replace(a, b)
    return " ".join(t.split())


def minutes(n):
    return max(10, int(round(MIN_PER_STEP * n / 5.0) * 5))


def framework(stage):
    d = json.load(io.open(FRAMEWORK, encoding="utf-8"))
    objs = d["objectivesByStage"][str(stage)]
    return {o["code"]: " ".join(o["text"].split()) for o in objs}


def matching(s, i):
    """Index just past the bracket that closes the one at s[i], skipping strings."""
    pairs = {"[": "]", "(": ")", "{": "}"}
    stack, j, q = [], i, None
    while j < len(s):
        c = s[j]
        if q:
            if c == "\\":
                j += 2
                continue
            if c == q:
                q = None
        elif c in "\"'`":
            q = c
        elif c in pairs:
            stack.append(pairs[c])
        elif c in ")]}":
            if not stack or stack.pop() != c:
                raise ValueError("unbalanced at %d" % j)
            if not stack:
                return j + 1
        j += 1
    raise ValueError("no closing bracket")


def evaluate(src, name):
    """A JS array literal of plain data, as Python data - via node, not a regex."""
    js = "process.stdout.write(JSON.stringify(Function('return ' + require('fs').readFileSync(0, 'utf8'))()))"
    r = subprocess.run(["node", "-e", js], input=src.encode("utf-8"), capture_output=True)
    if r.returncode:
        sys.exit("  REFUSED: %s: its check list is not plain data node can read:\n    %s"
                 % (name, r.stderr.decode("utf-8", "replace").strip().splitlines()[-1][:160]))
    return json.loads(r.stdout.decode("utf-8"))


def read_check(s, name):
    """(kind, id suffix, items [(q, answer, why)], pass mark, total)"""
    m = re.search(r"\n\s*const CHECK = \[", s)
    if m:                                                           # Grade 2
        i = s.index("[", m.start())
        text = s[i:matching(s, i)]
        items = evaluate(text, name)
        if len(items) != len(re.findall(r"\{\s*q:", text)):
            sys.exit("  REFUSED: %s: read %d check items, the list holds %d" % (name, len(items), len(re.findall(r"\{\s*q:", text))))
        k = re.search(r"let c(\d+) = 0, right\1 = 0, lock\1 = false;", s[i:]).group(1)
        g = re.search(r"right%s >= Math\.ceil\(CHECK\.length \* ([0-9.]+)\)" % k, s)
        need = -(-len(items) * float(g.group(1)) // 1) if g else None
        return "fixed", k, [(plain(x["q"]), plain(x["a"]), plain(x.get("why", ""))) for x in items], \
            (int(need) if need else None), len(items)
    m = re.search(r"\n\s*const Q(\d+) = shuffle\(\[", s)
    if m:                                                           # Grade 4
        k = m.group(1)
        i = s.index("[", m.start())
        text = s[i:matching(s, i)]
        items = evaluate(text, name)
        if len(items) != len(re.findall(r"\{\s*q:", text)):
            sys.exit("  REFUSED: %s: read %d check items, the list holds %d" % (name, len(items), len(re.findall(r"\{\s*q:", text))))
        for x in items:
            if not isinstance(x.get("a"), int) or not 0 <= x["a"] < len(x.get("o", [])):
                sys.exit("  REFUSED: %s: a check item's answer index points at no option: %s" % (name, x.get("q", "")[:70]))
        # the gate sits in the round's end-of-list branch, whatever its counter is
        # called (right8 in one lesson, rq in another)
        e = re.search(r"if \(\w+ >= Q%s\.length\) \{" % k, s)
        g = e and re.search(r"if \((\w+) >= (\d+)\) finish\(", s[e.end():e.end() + 600])
        return "fixed", k, [(plain(x["q"]), plain(x["o"][x["a"]]), plain(x.get("w", ""))) for x in items], \
            (int(g.group(2)) if g else None), len(items)
    m = re.search(r"order(\d+) = shuffle\(QS\)", s)
    if m:                                                           # Grade 3
        k = m.group(1)
        qs = s.index("const QS = [")
        n = len(re.findall(r"^\s*\(\) =>", s[qs:matching(s, s.index("[", qs))], re.M))
        g = re.search(r"if \(got%s >= (\d+)\)" % k, s)
        return "generated", k, [], (int(g.group(1)) if g else None), n
    sys.exit("  REFUSED: %s has no check this tool can read" % name)


def read_lesson(app, name, stage):
    s = app.read(name)
    secs = re.split(r'(?=<section class="slide)', s)[1:]
    kind, k, keys, need, total = read_check(s, name)
    ids = ('id="q%s"' % k, 'id="stem%s"' % k, 'id="ch%s"' % k, 'id="choices%s"' % k)
    ci = [i for i, sec in enumerate(secs) if any(x in sec.split("</section>")[0] for x in ids)]
    if len(ci) != 1:
        sys.exit("  REFUSED: %s: cannot tell which slide is the check (%d candidates)" % (name, len(ci)))
    ci = ci[0]
    steps = []
    for i, sec in enumerate(secs[:-1]):                   # the last slide is the sticker board
        if i == ci:
            continue
        h = re.search(r"<h2[^>]*>(.*?)</h2>", sec, re.S)
        say = re.search(r'data-say="(.*?)"', sec)
        steps.append((plain(h.group(1)) if h else "?", plain(say.group(1)) if say else "", i > ci))
    codes = sorted(set(re.findall(r"\b%s(?:Gg|Gp|Gt|Nc|Nf|Ni|Nm|Np|Sp|Ss)\.\d\d\b" % stage, s)))
    return {"steps": steps, "teaching": ci, "minutes": minutes(len(secs) - 1), "codes": codes,
            "kind": kind, "keys": keys, "need": need, "total": total}


def main():
    app = load()
    stage = str(app.cfg.get("stage", app.grade))
    OBJ = framework(stage)
    hub = app.read(app.hub)
    # Grade 1's hub is built by ../grade-1-app/build-grownup-section.py, under its
    # own marker. Writing this one there would add a SECOND teachers-and-parents
    # section beside the first, so a hub carrying another builder's is refused.
    if "<!-- GROWNUP:START" in hub and START not in hub:
        sys.exit("  REFUSED: %s already has a teachers-and-parents section from another builder\n"
                 "  (Grade 1's is ../grade-1-app/build-grownup-section.py) - run that one" % app.hub)
    blocks, changed, total = [], [], 0
    for n, (unit, f, title) in enumerate(app.lessons, 1):
        l = read_lesson(app, f, stage)
        cfg = app.cfg["lessons"][n - 1]
        total += l["minutes"]
        unknown = [c for c in l["codes"] if c not in OBJ]
        if unknown:
            sys.exit("  REFUSED: %s names %s, which Stage %s does not have" % (f, ", ".join(unknown), stage))
        print("  %-30s %2d steps  about %3d min  %2d objectives  check: %s, %d questions, pass at %s"
              % (f, l["teaching"], l["minutes"], len(l["codes"]), l["kind"], l["total"], l["need"]))

        # the card's step count, anchored on the card's own href and found inside
        # that card: Grades 2 and 3 say it in <span class="steps">, Grade 4 in
        # <p class="go">, and either way it is the first "N steps" before </a>
        ca = re.search(r'<a class="lesson[^"]*" href="%s\?from=[^"]*">' % re.escape(f), hub)
        if not ca:
            sys.exit("  REFUSED: no card for %s on the hub" % f)
        cz = hub.index("</a>", ca.end())
        cm = re.compile(r"(\d+) steps(?: &middot; about \d+ min)?").search(hub, ca.end(), cz)
        if not cm:
            sys.exit("  REFUSED: the %s card says nothing about steps" % f)
        want = "%d steps &middot; about %d min" % (l["teaching"], l["minutes"])
        if cm.group(0) != want:
            hub = hub[:cm.start()] + want + hub[cm.end():]
            changed.append("%s card" % f)

        obj = "".join('\n        <li><b>%s</b> %s</li>' % (c, esc(OBJ[c])) for c in l["codes"])
        stp = "".join('\n        <li><b>%s</b>%s &middot; %s</li>'
                      % (esc(t), " <i>(after the check)</i>" if after else "", esc(say))
                      for t, say, after in l["steps"])
        mark = ("It completes the lesson at <b>%d of %d</b> right; below that the child is shown the score "
                "and a Try again button." % (l["need"], l["total"])) if l["need"] else ""
        if l["kind"] == "fixed":
            ans = "".join('\n        <li>%s <b>%s</b>%s</li>' % (esc(q), esc(a), (" &mdash; " + esc(w)) if w else "")
                          for q, a, w in l["keys"])
            check = ('\n      <h4>Check answers</h4>\n      <p class="gu-note">%s The options come in a new '
                     'order each time; the questions do not change.</p>\n      <ul>%s\n      </ul>' % (mark, ans))
        else:
            check = ('\n      <h4>The check</h4>\n      <p class="gu-note">%d questions, with new numbers every '
                     'time, so there is no fixed answer key to print: each answer is marked and explained on '
                     'screen as the child gives it. %s</p>' % (l["total"], mark))
        home = ('\n      <h4>Try at home</h4>\n      <p class="gu-home">%s</p>' % esc(cfg["atHome"])) \
            if cfg.get("atHome") else ""
        blocks.append(
            '\n    <details class="gu">'
            '\n      <summary><b>Lesson %d: %s</b> <span class="gu-meta">%d steps &middot; about %d min '
            '&middot; %d objectives &middot; %d check questions</span></summary>'
            '\n      <h4>What it teaches (Cambridge Primary Mathematics 0096, Stage %s)</h4>'
            '\n      <ul>%s\n      </ul>'
            '\n      <h4>The steps</h4>'
            '\n      <ul>%s\n      </ul>%s%s'
            '\n    </details>'
            % (n, esc(title), l["teaching"], l["minutes"], len(l["codes"]), l["total"], stage, obj, stp, check, home))

    count = NUMBERS[len(app.lessons)] if len(app.lessons) < len(NUMBERS) else str(len(app.lessons))
    section = (
        START +
        '\n  <section class="grownup" id="grownups">'
        '\n    <h3>For teachers and parents</h3>'
        '\n    <p>What each lesson teaches, in Cambridge\'s own words; what every step asks the child to '
        'do; the check at the end, its pass mark and its answers; and one thing to try at home with '
        'things you already have. The %s lessons are listed in the order the course runs them, but each '
        'one stands on its own, so a child can start with any of them. The minutes are an estimate of '
        'about two and a half minutes a step, not yet timed against a real class, so treat them as a '
        'guide to the length of a sitting rather than a plan.</p>' % count
        + "".join(blocks) +
        '\n  </section>\n  ' + END)
    if START in hub:
        i, j = hub.index(START), hub.index(END) + len(END)
        if hub[i:j] != section:
            hub = hub[:i] + section + hub[j:]
            changed.append("teachers-and-parents section (rebuilt)")
    else:
        anchor = '<p class="note"><b>For the grown-up.</b>'
        if hub.count(anchor) != 1:
            sys.exit("  REFUSED: the hub has %d 'For the grown-up' notes; the section goes straight "
                     "after exactly one" % hub.count(anchor))
        k = hub.index(anchor)
        end = hub.index("</p>", k) + 4
        hub = hub[:end] + "\n  " + section + hub[end:]
        changed.append("teachers-and-parents section (new)")

    # the year's total, in the lede
    tot = " About %d minutes in all." % total
    m = re.search(r"(<p class=\"lede\">.*?)( About \d+ minutes in all\.)?(</p>)", hub, re.S)
    if not m:
        sys.exit("  REFUSED: the hub has no lede to put the total in")
    if m.group(2) != tot:
        hub = hub[:m.end(1)] + tot + hub[m.start(3):]
        changed.append("total minutes in the lede")

    if CSS_START in hub:
        i = hub.index(CSS_START)
        j = hub.index(CSS_END, i) + len(CSS_END)
        if hub[i:j] != CSS.strip():
            hub = hub[:i] + CSS.strip() + hub[j:]
            changed.append("styles")
    else:
        i = hub.rindex("</style>")
        hub = hub[:i] + CSS + hub[i:]
        changed.append("styles")

    print("\n  total: about %d minutes across %d lessons" % (total, len(app.lessons)))
    if not changed:
        print("  nothing to change\n")
        return 0
    print("  %s" % "; ".join(changed))
    if WRITE:
        app.write(app.hub, hub)
        print("  written\n")
    else:
        print("  dry run -- pass --write\n")
    return 0


CSS_START = "/* ==== lesson-app-tools/build-grownup-section.py ==== */"
CSS_END = "/* ==== end lesson-app-tools/build-grownup-section.py ==== */"
CSS = """
/* ==== lesson-app-tools/build-grownup-section.py ==== */
/* The adult's half of the hub. Collapsed by default: a child arriving at the
   hub should meet the lessons, not their answer keys. */
.grownup { margin: 26px 0 10px; }
.grownup h3 { font-size: 20px; margin: 0 0 6px; }
.grownup > p { color: var(--muted); font-size: 15px; line-height: 1.5; margin: 0 0 14px; }
details.gu {
  border: 2px solid var(--line); border-radius: 14px; background: var(--card);
  padding: 10px 14px; margin: 0 0 10px;
}
details.gu > summary { cursor: pointer; font-size: 16px; }
details.gu .gu-meta { color: var(--muted); font-weight: 600; font-size: 14px; }
details.gu h4 { font-size: 14px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); margin: 14px 0 6px; }
details.gu ul { margin: 0; padding-left: 20px; }
details.gu li { font-size: 15px; line-height: 1.5; margin: 0 0 4px; }
details.gu .gu-home, details.gu .gu-note { font-size: 15px; line-height: 1.5; margin: 0 0 6px; }
@media print {
  details.gu { break-inside: avoid; }
  details.gu > summary { list-style: none; }
  details.gu[open] > summary::marker { content: ""; }
}
/* ==== end lesson-app-tools/build-grownup-section.py ==== */
"""

if __name__ == "__main__":
    sys.exit(main())
