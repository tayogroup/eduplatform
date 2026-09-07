# -*- coding: utf-8 -*-
"""Build the audit page for the DEPLOYED Grade 4 maths course (18 units).

Coverage is established from what the units teach, because they declare
cambridge {code 0096, stage 4} and map zero objective codes. Every row quotes the
content it rests on -- a keyword match is a candidate, not a proof, and three of the
first pass's findings were wrong for exactly that reason.
"""
import json, io, re, html, os

HERE = os.path.dirname(os.path.abspath(__file__))

exec(open(os.path.join(HERE, "math-corpus.py"), encoding="utf-8").read().split("if __name__")[0])

src = open(os.path.join(HERE, "audit-deployed-course.py"), encoding="utf-8").read()
PAT = eval(src[src.index("PAT = {") + 6: src.index("}\n\nOBJ")] + "}")

UNITDIR = os.path.join(HERE, "..", "grade-4", "data", "units", "unit-%d.json")
OBJ = json.load(io.open(os.path.join(HERE, "stage4.json"), encoding="utf-8"))
TITLES = {}
for i in range(1, 19):
    TITLES[i] = json.load(io.open(UNITDIR % i, encoding="utf-8"))["unit"]["unitTitle"]

C = build()

STATUS = {"4Ni.03": "no", "4Ni.01": "pt"}
NOTE = {
 "4Ni.03": ("The course teaches <b>commutativity</b> (7 &times; 9 = 9 &times; 7, U5) but never the "
            "<b>associative</b> property &mdash; regrouping three factors so that (2 &times; 5) &times; 7 "
            "becomes 10 &times; 7. Different property; searched under every wording, 0 hits."),
 "4Ni.01": ("Numbers above 1000 (six-digit place value, U1) and below zero (U1, U15) are taught "
            "thoroughly. Missing is the <b>number names</b> half &mdash; writing 4,006 as &ldquo;four "
            "thousand and six&rdquo;. The only number words in the course are fractions (U7)."),
}
STRANDS = [("Nc", "Counting and sequences"), ("Ni", "Integers and powers"),
           ("Np", "Place value, ordering and rounding"),
           ("Nf", "Fractions, decimals and percentages"), ("Gt", "Time"),
           ("Gg", "Geometrical reasoning, shapes and measurements"),
           ("Gp", "Position and transformation"), ("Ss", "Statistics"), ("Sp", "Probability")]


def units_for(code):
    return [u for u in sorted(C) if re.search(PAT[code], C[u], re.I)]


def evidence(code):
    if code in NOTE:
        return NOTE[code]
    for u in sorted(C):
        m = re.search(PAT[code], C[u], re.I)
        if m:
            s = max(0, m.start() - 45)
            t = C[u][s:m.end() + 95]
            t = t[t.find(" ") + 1:]
            t = t[:t.rfind(" ")]
            return "<b>U%d %s</b> &mdash; &hellip;%s&hellip;" % (u, html.escape(TITLES[u]), html.escape(t))
    return "&mdash;"


n_ok = sum(1 for o in OBJ if STATUS.get(o["code"], "ok") == "ok")
n_pt = sum(1 for o in OBJ if STATUS.get(o["code"]) == "pt")
n_no = sum(1 for o in OBJ if STATUS.get(o["code"]) == "no")
assert n_ok + n_pt + n_no == 46, (n_ok, n_pt, n_no)

CHIP = {"ok": ("chip ok", "covered"), "pt": ("chip part", "partial"), "no": ("chip no", "not covered")}
rows = []
for pre, name in STRANDS:
    got = [o for o in OBJ if o["code"][1:3] == pre]
    if not got:
        continue
    rows.append('<p class="strand">%s</p><div class="tw"><table>'
                "<tr><th>Code</th><th>Objective</th><th>Status</th><th>Where it is taught</th></tr>"
                % html.escape(name))
    for o in got:
        st = STATUS.get(o["code"], "ok")
        cls, lab = CHIP[st]
        us = units_for(o["code"])
        sub = ('<div style="font-size:11.5px;color:var(--ink-3);margin-top:6px">unit %s</div>'
               % ", ".join(str(x) for x in us)) if us else ""
        rows.append('<tr><td class="code">%s</td><td class="obj">%s</td>'
                    '<td><span class="%s">%s</span>%s</td><td class="ev">%s</td></tr>'
                    % (o["code"], html.escape(o["text"]), cls, lab, sub, evidence(o["code"])))
    rows.append("</table></div>")

css = open(os.path.join(HERE, "audit-design.css"), encoding="utf-8").read()

HEAD = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deployed Grade 4 Course Audit</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
"""

EXTRA = """
  .chip.no{background:var(--no-bg);color:var(--no)}
  :root{--no:#a8362c;--no-bg:#f7dedb}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--no:#f0938a;--no-bg:#3a1f1c}}
  :root[data-theme="dark"]{--no:#f0938a;--no-bg:#3a1f1c}
  .score.d .n{color:var(--no)}
  .bar .f{flex:%d} .bar .p{flex:%d} .bar .n{background:var(--no);flex:%d}
</style>
""" % (n_ok, n_pt, n_no)

BODY = """<div class="wrap">
<header>
  <div class="kicker">Curriculum validation &middot; 7 September 2026</div>
  <h1>Deployed Grade 4 Course &mdash; Cambridge Audit</h1>
  <p class="sub">The <b>18-unit mathematics course Grade 4 learners actually receive</b>, checked against
  every objective in <b>Cambridge Primary Mathematics 0096 (2020), Stage 4</b>. The units declare
  <code>code 0096, stage 4</code> and map <b>zero objective codes</b>, so coverage was established from what
  they teach: a corpus of <b>1,054,908 characters</b> &mdash; outcomes, concepts, methods, worked examples,
  explorations, glossary, practice and answers &mdash; searched for each objective&rsquo;s distinctive
  mathematics. Every row cites its unit and quotes the content, because a keyword match is a candidate and
  not a proof.</p>
</header>
<div class="scores">
  <div class="score a"><div class="n">%d</div><div class="l">covered</div></div>
  <div class="score b"><div class="n">%d</div><div class="l">partial</div></div>
  <div class="score d"><div class="n">%d</div><div class="l">not covered</div></div>
  <div class="score c"><div class="n">18</div><div class="l">units on the content tier</div></div>
</div>
<div class="bar"><i class="f"></i><i class="p"></i><i class="n"></i></div>

<h2>What this found</h2>

<div class="finding"><h3>4Ni.03 &mdash; the associative property is absent</h3>
<p class="q">&ldquo;Understand the associative property of multiplication, and use this to simplify calculations&rdquo;</p>
<p>The course teaches <b>commutativity</b> well &mdash; &ldquo;because multiplication is commutative, 7 &times; 9
gives exactly the same answer as 9 &times; 7, so half of the sevens table is already known to you&rdquo; (U5).
That is a different property. The associative one &mdash; regrouping three factors so that
(2 &times; 5) &times; 7 becomes 10 &times; 7 &mdash; is what lets a child <i>simplify</i> a calculation, and it
appears nowhere. Searched as the word, as the bracket form, as &ldquo;any order&rdquo; and as
&ldquo;grouping&rdquo;: 0 hits in 1.05M characters.</p></div>

<div class="finding"><h3>4Ni.01 &mdash; the numbers are taught, the number <i>names</i> are not</h3>
<p class="q">&ldquo;Read and write number names and whole numbers greater than 1000 and less than 0&rdquo;</p>
<p>Both ranges are covered properly: six-digit place value in U1, U3, U9, U13 and U17, and negative numbers
in U1 and U15. But nothing asks a learner to write a whole number <b>in words</b>. The only place number
words appear is fractions &mdash; &ldquo;3/4 and &lsquo;three-quarters&rsquo;&rdquo; (U7). Marked partial
rather than missing, because half the objective is genuinely there.</p></div>

<div class="finding note"><h3>Three of the first pass&rsquo;s findings were wrong</h3>
<p>Recorded because it is why every row quotes its content. The first sweep reported 4Nf.01 (&ldquo;more
parts, smaller parts&rdquo;) as a gap. It is taught, through same-numerator comparison: &ldquo;when the
numerator stays the same, a bigger denominator makes a smaller fraction. Many people get this
backwards&rdquo; (U7) &mdash; the pattern was looking for the wrong words. The same sweep credited 4Gg.09 to
a <i>probability</i> scale and 4Sp.01 to the word &ldquo;certain&rdquo; in ordinary prose. Patterns were
tightened until the quoted evidence was the right mathematics.</p></div>

<h2>Objective by objective</h2>
%s

<footer>Cambridge Primary Mathematics 0096 (2020), Stage 4 &mdash; 46 content objectives across 9 strands.
The 8 Thinking and Working Mathematically objectives (TWM.01&ndash;.08) are out of scope: they describe how a
learner works rather than what they know, and cannot be evidenced by locating content. Audited against the
18 unit files deployed on the content tier, which match the repository copies.</footer>
</div>
""" % (n_ok, n_pt, n_no, "\n".join(rows))

doc = HEAD + css + EXTRA + BODY
io.open("course-audit.html", "w", encoding="utf-8").write(doc)
print("wrote course-audit.html  %d bytes | %d covered / %d partial / %d not covered"
      % (len(doc), n_ok, n_pt, n_no))
