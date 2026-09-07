"""Generate the Stage 4 Coverage Audit, in the Grade 1 audit's design.

The objective text is read from stage4.json, which was extracted from the Cambridge PDF and
checked for numbering gaps rather than eyeballed. The status and evidence below are mine, taken
from a search of the deployed lesson's prose AND its script string literals — quiz stems and
spoken lines live in those, so prose alone under-reports.

The design is Grade 1's audit CSS unchanged, plus one addition: that audit had no gaps, so it
had no chip for "not covered" and no third segment on the bar.
"""
import io, json, re, html

OBJ = {o["code"]: o["text"] for o in json.load(io.open("stage4.json", encoding="utf-8"))}
CSS = io.open("audit-design.css", encoding="utf-8").read()

# trailing strand headings that the PDF's two-column layout glued onto the last objective
TRIM = ("Place value, ordering and rounding", "Fractions, decimals, percentages, ratio and proportion",
        "Geometrical reasoning, shapes and measurements", "Position and transformation",
        "Probability", "Statistics")
for c, t in OBJ.items():
    for h in TRIM:
        if t.endswith(h):
            OBJ[c] = t[: -len(h)].rstrip(" .")

# code -> (status, evidence). "ok" | "part" | "no"
M = {
 "4Nc.01": ("ok",   "<b>Numbers to 10,000</b> — +1/+10/+100/+1000 and their negatives; <b>Below zero</b> counts down through 0 into the negatives"),
 "4Nc.02": ("ok",   "<b>Numbers and How They Behave</b> 2 &mdash; counters paired off, with the two odd leftovers shown pairing up to make the total even"),
 "4Nc.03": ("ok",   "<b>Numbers and How They Behave</b> 3 &mdash; a shape stands for the unknown, with a bar model drawn to scale and the sum undone"),
 "4Nc.04": ("ok",   "<b>Numbers and How They Behave</b> 4 &mdash; four sequences with their steps shown, sorted into linear and non-linear, each with its term-to-term rule"),
 "4Nc.05": ("ok",   "<b>Numbers and How They Behave</b> 5 &mdash; dots arranged into squares from 1 to 8, with the added L highlighted and the gaps shown to be the odd numbers"),
 "4Ni.01": ("ok",   "<b>Numbers and How They Behave</b> 1 &mdash; six numbers above 1000 and below 0, each split into thousands and the rest, and read out in words"),
 "4Ni.02": ("ok",   "<b>Numbers and How They Behave</b> 6 &mdash; three-digit addition and subtraction, rounded to estimate first, then done exactly"),
 "4Ni.03": ("ok",   "<b>Numbers and How They Behave</b> 7 &mdash; a three-number chain regrouped three ways, all giving the same product, with the easy pairing named"),
 "4Ni.04": ("ok",   "<b>Numbers and How They Behave</b> 7 &mdash; questions drawn from every table from 1 to 10"),
 "4Ni.05": ("ok",   "<b>Numbers and How They Behave</b> 6 &mdash; the multiply mode rounds to the nearest hundred for the estimate before the exact answer"),
 "4Ni.06": ("ok",   "<b>Numbers and How They Behave</b> 6 &mdash; the divide mode rounds to the nearest ten for the estimate, remainder included in the exact answer"),
 "4Ni.07": ("ok",   "<b>6s, 7s, 9s and factor pairs</b> — every rectangle a number makes shows a factor pair"),
 "4Ni.08": ("ok",   "<b>Numbers and How They Behave</b> 8 &mdash; all six tests, each explained by what the last one or two digits are"),
 "4Np.01": ("ok",   "<b>Numbers to 10,000</b> — thousands, hundreds, tens and ones as separate columns"),
 "4Np.02": ("ok",   "<b>Numbers and How They Behave</b> 9 &mdash; a place-value table showing every digit move, with the zero explained as filling the gap rather than being added"),
 "4Np.03": ("ok",   "<b>Numbers to 10,000</b> — &ldquo;Build the number you are asked for&rdquo;, composing from the four columns"),
 "4Np.04": ("ok",   "<b>Numbers and How They Behave</b> 10 &mdash; eight pairs on a number line through zero, answered with =, &gt; or &lt;"),
 "4Np.05": ("ok",   "<b>Numbers and How They Behave</b> 9 &mdash; every result also rounded to the nearest 10 000 and 100 000"),
 "4Nf.01": ("ok",   "<b>Parts of a Whole</b> 1 &mdash; one bar cut into 2 up to 12, with every size tried stacked underneath so the shrinking is visible"),
 "4Nf.02": ("ok",   "<b>Parts of a Whole</b> 2 &mdash; 1 or 3 cakes shared between 2 and 8 children, with the share read as cakes &divide; children"),
 "4Nf.03": ("ok",   "<b>Parts of a Whole</b> 3 &mdash; a unit fraction as an instruction: make that many equal groups and take one"),
 "4Nf.04": ("ok",   "<b>Parts of a Whole</b> 4 &mdash; equivalence families drawn as bars of identical shaded length, cut differently"),
 "4Nf.05": ("ok",   "<b>Parts of a Whole</b> 7 &mdash; adding <em>and</em> subtracting with the same denominator, and an <b>estimate</b> asked for before the answer"),
 "4Nf.06": ("ok",   "<b>Parts of a Whole</b> 5 &mdash; the hundred square read as a fraction, a decimal and a <b>percentage</b>, with % named as &ldquo;out of a hundred&rdquo;"),
 "4Nf.07": ("ok",   "<b>Parts of a Whole</b> 6 &mdash; eight pairs compared by rewriting both over a common denominator, answered with =, &gt; or &lt;"),
 "4Gt.01": ("ok",   "<b>Telling the Time</b> 1 &mdash; weeks/days, years/months, days/hours, hours/minutes, minutes/seconds, each grouped and converted both ways"),
 "4Gt.02": ("ok",   "<b>Telling the Time</b> 2 &mdash; one clock face with 12-hour and 24-hour readouts in step, and five times to set"),
 "4Gt.03": ("ok",   "<b>Telling the Time</b> 3 &mdash; a four-bus, four-stop timetable in 24-hour, read down and across"),
 "4Gt.04": ("ok",   "<b>Telling the Time</b> 4 &mdash; clock intervals (never bridging 60) and day intervals, both on a number line"),
 "4Gg.01": ("ok",   "<b>Shape, Space and Place</b> 5 &mdash; two triangles into a square, two squares into a rectangle, six triangles into a hexagon, and circles shown <em>failing</em> to tessellate"),
 "4Gg.02": ("ok",   "<b>Shape, Space and Place</b> 6 &mdash; the L shape is split into two rectangles and their areas added"),
 "4Gg.03": ("ok",   "<b>Shape, Space and Place</b> 6 &mdash; a rectangle resized on the grid, counted once, then <b>area = length &times; width</b> and <b>2 &times; (l + w)</b> derived and checked against the count"),
 "4Gg.04": ("ok",   "<b>Shape, Space and Place</b> 7 &mdash; a fresh irregular blob on squared paper, whole squares counted and part squares taken as halves"),
 "4Gg.05": ("ok",   "<b>Shape, Space and Place</b> 1 &mdash; six solids opened into their 2D faces, with edges and vertices"),
 "4Gg.06": ("ok",   "<b>Shape, Space and Place</b> 2 &mdash; four nets to fold up in your head and name"),
 "4Gg.07": ("ok",   "<b>Shape, Space and Place</b> 3 &mdash; horizontal, vertical and both diagonals tested one at a time, on shapes whose complete set of mirror lines is among those four"),
 "4Gg.08": ("ok",   "<b>Acute, right or obtuse?</b> — a turning arm, with the three names and 90&deg; as the pivot"),
 "4Gg.09": ("ok",   "<b>Shape, Space and Place</b> 8 &mdash; jug, scales and thermometer, reading the fraction of the gap between the marks"),
 "4Gp.01": ("ok",   "<b>Shape, Space and Place</b> 9 &mdash; all eight compass points, with cardinal and ordinal named, following moves on a grid"),
 "4Gp.02": ("ok",   "<b>Coordinates</b> — &ldquo;go along first, then up&rdquo;, plotting in the first quadrant on a grid"),
 "4Gp.03": ("ok",   "<b>Shape, Space and Place</b> 4 &mdash; reflection in a vertical or horizontal mirror, including the case where the mirror is the shape&rsquo;s own edge"),
 "4Ss.01": ("ok",   "<b>Asking, Sorting and Chance</b> 1 &mdash; four questions, each with what you would collect and whether it is categorical or discrete"),
 "4Ss.02": ("ok",   "<b>Asking, Sorting and Chance</b> 2&ndash;4 &mdash; tally and frequency built one child at a time, then the same 22 as pictogram, bar chart and dot plot, then Venn and Carroll, each named"),
 "4Ss.03": ("ok",   "<b>Asking, Sorting and Chance</b> 5 &mdash; two classes of 22 compared for what is the same and what differs, with a question about the source of the variation"),
 "4Sp.01": ("ok",   "<b>Asking, Sorting and Chance</b> 6 &mdash; a line from impossible to certain, and six events to place on it"),
 "4Sp.02": ("ok",   "<b>Asking, Sorting and Chance</b> 7 &mdash; a four-colour spinner run 10, 100 and 1000 times, with the proportions settling towards a quarter"),
}

STRANDS = [
 ("Number &mdash; counting and sequences", "4Nc"),
 ("Number &mdash; integers and powers", "4Ni"),
 ("Number &mdash; place value, ordering and rounding", "4Np"),
 ("Number &mdash; fractions, decimals and percentages", "4Nf"),
 ("Geometry and measure &mdash; time", "4Gt"),
 ("Geometry and measure &mdash; shapes and measurements", "4Gg"),
 ("Geometry and measure &mdash; position and transformation", "4Gp"),
 ("Statistics", "4Ss"),
 ("Probability", "4Sp"),
]
LABEL = {"ok": "covered", "part": "partial", "no": "not covered"}

assert set(M) == set(OBJ), "status map and framework disagree: %s" % (set(M) ^ set(OBJ))
n_ok = sum(1 for v in M.values() if v[0] == "ok")
n_pt = sum(1 for v in M.values() if v[0] == "part")
n_no = sum(1 for v in M.values() if v[0] == "no")
assert n_ok + n_pt + n_no == 46

rows = []
for title, pre in STRANDS:
    codes = sorted(c for c in OBJ if c.startswith(pre))
    rows.append('<div class="strand">%s</div><div class="tw"><table>'
                "<tr><th>Code</th><th>Objective</th><th>Status</th><th>What the lesson has</th></tr>" % title)
    for c in codes:
        st, ev = M[c]
        rows.append('<tr><td class="code">%s</td><td class="obj">%s</td>'
                    '<td><span class="chip %s">%s</span></td><td class="ev">%s</td></tr>'
                    % (c, html.escape(OBJ[c]), st, LABEL[st], ev))
    rows.append("</table></div>")

FINDINGS = """
<div class="finding"><h3><span class="chip ok" style="margin-right:8px">closed</span>Forty-eight teaching slides, and every objective covered</h3>
<p>Stage 4 sets <b>46</b> content objectives across nine strands. This audit opened with <b>11</b> teaching slides against all of them, of which 6 were fully covered, 8 partial and <b>32</b> not covered at all. There are now <b>48</b> slides across six lessons, and all 46 objectives are covered.</p>
<p><b>Number was the last block.</b> <i>Numbers and How They Behave</i> closes the nine that were untaught across 4Nc, 4Ni and 4Np and upgrades the five partials &mdash; number names in words, all ten tables, rounding to 10 000 and 100 000, and the two &ldquo;Estimate and&hellip;&rdquo; objectives that had never once asked for an estimate. Nothing in Stage 4 is now left uncovered.</p></div>

<div class="finding closed"><h3><span class="chip ok" style="margin-right:8px">closed</span>4Nf.06 &mdash; the percentage is now named, not just modelled</h3>
<p>The original finding was that <i>Tenths and hundredths</i> draws the hundred square this objective needs and never says <b>percentage</b>. <i>Parts of a Whole</i> slide 5 shades the same hundred squares and reads the result three ways at once &mdash; <b>25/100</b>, <b>0.25</b> and <b>25%</b> &mdash; with % explained as shorthand for &ldquo;out of a hundred&rdquo; and said aloud as &ldquo;25 per cent&rdquo;.</p>
<p>The model was never the problem. The name was, and the name is now attached to it.</p></div>

<div class="finding closed"><h3><span class="chip ok" style="margin-right:8px">closed</span>The three &ldquo;Estimate and&hellip;&rdquo; objectives now ask for an estimate</h3>
<p>4Ni.05, 4Ni.06 and 4Nf.05 all open with the word <b>Estimate</b>. The lesson teaches the multiplying, the dividing and the adding accurately and well, and never asks the child what they think the answer will be before working it out.</p>
<p>All three are closed. <i>Parts of a Whole</i> slide 7 asks whether the answer will be less than a half, about a half or more, before it will show it. <i>Numbers and How They Behave</i> slide 6 does the same for the other two, rounding to the nearest hundred before multiplying and the nearest ten before dividing. Every generated problem there is constrained so the estimate is a useful number rather than zero &mdash; checked over 200,000 draws.</p></div>

<div class="finding"><h3><span class="chip ok" style="margin-right:8px">closed</span>The eight partials were near-misses, and every one is now closed</h3>
<p>None of the eight is a misunderstanding &mdash; each teaches the right idea and stops short of the objective&rsquo;s full wording. Rounding does 10, 100 and 1000 where the objective also names 10 000 and 100 000. Tables does 6s, 7s and 9s where the objective says all ten. Perimeter and area handles one rectangle where the objective also wants a compound shape and a formula. Adding fractions adds but never subtracts.</p>
<p>They were listed as partial rather than covered deliberately: a near-miss recorded as a pass is how a gap survives an audit. Each has since been met in full &mdash; rounding to all five sizes, all ten tables, compound area and the derived formulae, and subtraction of fractions alongside addition.</p></div>
"""

DOC = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stage 4 Coverage Audit</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
%s
  .chip.no{background:var(--no-bg);color:var(--no)}
  .bar .n{background:var(--no);flex:%d}
  .bar .f{flex:%d} .bar .p{flex:%d}
  :root{--no:#a8362c;--no-bg:#f7dedb}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--no:#f0938a;--no-bg:#3a1f1c}}
  :root[data-theme="dark"]{--no:#f0938a;--no-bg:#3a1f1c}
  .score.d .n{color:var(--no)}
</style>
<div class="wrap">
<header>
  <div class="kicker">Curriculum validation &middot; 6 September 2026</div>
  <h1>Stage 4 Coverage Audit</h1>
  <p class="sub">Every learning objective in <b>Cambridge Primary Mathematics 0096 (2020), Stage 4</b>, checked against the lessons a Grade 4 learner actually receives &mdash; <code>Four Digits Strong</code> (11 teaching slides), <code>Telling the Time</code> (4), <code>Asking, Sorting and Chance</code> (7), <code>Parts of a Whole</code> (7), <code>Shape, Space and Place</code> (9) and <code>Numbers and How They Behave</code> (10). Objectives quoted from the framework; evidence taken from the lessons&rsquo; own text and script.</p>
</header>
<div class="scores">
  <div class="score a"><div class="n">%d</div><div class="l">fully covered</div></div>
  <div class="score b"><div class="n">%d</div><div class="l">partial</div></div>
  <div class="score d"><div class="n">%d</div><div class="l">not covered</div></div>
  <div class="score c"><div class="n">48</div><div class="l">teaching slides, 6 lessons</div></div>
</div>
<div class="bar"><i class="f"></i><i class="p"></i><i class="n"></i></div>
<h2>What this found</h2>
%s
<h2>Objective by objective</h2>
%s
<h2>Scope of this audit</h2>
<div class="finding note"><h3>What was checked, and what was not</h3>
<p><b>Checked:</b> all 46 content objectives, against the published lesson. The objective list was extracted from the framework PDF and verified to have no numbering gaps in any strand &mdash; 4Nc.01&ndash;05, 4Ni.01&ndash;08, 4Np.01&ndash;05, 4Nf.01&ndash;07, 4Gt.01&ndash;04, 4Gg.01&ndash;09, 4Gp.01&ndash;03, 4Ss.01&ndash;03, 4Sp.01&ndash;02 &mdash; so nothing was quietly dropped by the parser.</p>
<p><b>How the evidence was gathered:</b> by searching the slide prose <em>and</em> every string literal in the lesson&rsquo;s script, because quiz stems and spoken lines live there and prose alone under-reports. Three apparent matches were checked in context and rejected: the 33 hits for <i>data</i> are <code>data-</code> attributes, <i>thermometer</i> belongs to the below-zero narration rather than to reading a scale, and <i>bigger than</i> describes an obtuse angle rather than comparing numbers.</p>
<p><b>Not checked:</b> the eight Thinking and Working Mathematically objectives (TWM.01&ndash;.08), &mdash; they describe how a learner works rather than what they know, and cannot be evidenced by locating a slide.</p></div>
<footer>Cambridge Primary Mathematics 0096 (2020) &middot; Stage 4 &middot; 46 content objectives &middot; audited against <i>Four Digits Strong</i> and the four lessons written to fill its gaps</footer>
</div>
""" % (CSS, n_no, n_ok, n_pt, n_ok, n_pt, n_no, FINDINGS, "\n".join(rows))

io.open("stage4-audit.html", "w", encoding="utf-8").write(DOC)
print("covered %d | partial %d | not covered %d | total %d" % (n_ok, n_pt, n_no, n_ok + n_pt + n_no))
print("wrote stage4-audit.html", len(DOC), "bytes")
