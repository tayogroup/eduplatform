# -*- coding: utf-8 -*-
"""Validate the LIVE Grade 1 lessons against Cambridge 0096 Stage 1.

Two things make this stronger than check-stage1-coverage.py, which matches
slide titles:

  - the objectives are read from the PDF at run time, not typed here, so the
    thing being validated against is the framework rather than my memory of it
  - each objective is broken into the clauses Cambridge actually names, and
    each clause is looked for in the SLIDE that teaches it, not anywhere in the
    course. A whole-course search scores ~100% on false positives: "taking
    turns" satisfies rotation, "flattened to plain text" satisfies flat-or-
    curved faces.

Source is the deployed CDN pages by default (what a learner receives), or
--local for the repo copies.

Extraction hazards handled: sub-bullets come through as the letter "o"
(`counting on o combining two sets`), and the next section heading bleeds onto
the end of an objective.
"""
import re, io, os, sys, json, urllib.request, html

SP = os.path.dirname(os.path.abspath(__file__))
PDF = "C:/Users/inawa/Downloads/657068559-0096-Primary-Mathematics-Curriculum-Framework-2020-tcm142-592530.pdf"
CDN = "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/grade-1-v2/"
LOCAL = "--local" in sys.argv

LESSONS = ["counting-to-twenty", "adding-and-taking-away", "halves-and-wholes",
           "what-comes-next", "shapes-and-sizes", "days-months-and-clocks",
           "asking-and-sorting"]

HEADINGS = ["Integers and powers", "Money", "Place value, ordering and rounding",
            "Fractions, decimals, percentages, ratio and proportion",
            "Geometry and Measure", "Time", "Geometrical reasoning, shapes and measurements",
            "Position and transformation", "Statistics and Probability", "Statistics",
            "Counting and sequences", "Number"]


def framework():
    import pdfplumber
    with pdfplumber.open(PDF) as pdf:
        t = "\n".join((pdf.pages[i].extract_text() or "") for i in (19, 20, 21))
    t = re.sub(r"Back to contents page.*", "", t)
    t = re.sub(r"Cambridge Primary Mathematics 0096[^\n]*", "", t)
    out = {}
    parts = re.split(r"(?=\b1[A-Z][a-z]{1,2}\.\d{2}\b)", t)
    for p in parts:
        m = re.match(r"(1[A-Z][a-z]{1,2}\.\d{2})\s+(.*)", p, re.S)
        if not m:
            continue
        body = re.sub(r"\s+", " ", m.group(2)).strip().rstrip("\u2022 ").strip()
        for h in HEADINGS:                       # the next heading bleeds in
            body = re.sub(re.escape(h) + r"\s*$", "", body).strip()
        out[m.group(1)] = body.rstrip("\u2022 ").strip()
    return out


def page(name):
    if LOCAL:
        return io.open(os.path.join(SP, "g1v2", name + ".html"), encoding="utf-8").read()
    return urllib.request.urlopen(CDN + name + ".html", timeout=30).read().decode("utf-8")


def slides_of(src):
    """slide index -> its visible text plus the string literals of its own JS block"""
    body = re.sub(r"<style[^>]*>.*?</style>", " ", src, flags=re.S | re.I)
    js = " ".join(re.findall(r"<script[^>]*>(.*?)</script>", body, re.S | re.I))
    markup = re.sub(r"<script[^>]*>.*?</script>", " ", body, flags=re.S | re.I)
    out, titles = {}, {}
    for i, s in enumerate(re.findall(
            r'<section[^>]*class="[^"]*slide[^"]*"[^>]*>(.*?)</section>', markup, re.S), 1):
        h = re.search(r"<h2[^>]*>(.*?)</h2>", s, re.S)
        titles[i] = html.unescape(re.sub(r"<[^>]*>", "", h.group(1))).strip() if h else "?"
        out[i] = html.unescape(re.sub(r"<[^>]*>", " ", s))
    # the activity blocks, matched to slides by the element ids they touch
    marks = [(m.start(), m.end()) for m in re.finditer(r"/\*\s*-+\s*\d+\s*:[^*]*?-*\*/", js)]
    ids = {i: set(re.findall(r'id="([A-Za-z0-9_-]+)"', t)) for i, t in out.items()}
    for k, (st, en) in enumerate(marks):
        stop = marks[k + 1][0] if k + 1 < len(marks) else len(js)
        blk = js[en:stop]
        touched = set(re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', blk))
        best, score = None, 0
        for i, idset in ids.items():
            n = len(touched & idset)
            if n > score:
                best, score = i, n
        if best is None:
            # An unattached block is content that still belongs to the LESSON,
            # and dropping it makes an objective look uncovered. anatomy.py
            # already reports that this id-overlap match fails for several
            # blocks (7 in shapes-and-sizes), and both objectives that survived
            # to the end of this validator's first run - the -10 jump button and
            # the "forwards, then backwards" option - were in dropped blocks.
            # Falling back to every slide is weaker evidence than a slide match,
            # but it is evidence, where silence was a false negative.
            for i in out:
                out[i] += " " + html.unescape(blk)
        else:
            # the WHOLE block, not just its string literals. Taking literals only
            # made five objectives look uncovered when every one of them was
            # taught: the jump buttons are a numeric array [1,2,10,-1,-10], the
            # thermometer is a function name, and a solid's edges are a numeric
            # field (edges: 0). None of those is a string.
            out[best] += " " + html.unescape(blk)
    # a lesson's CHECK questions test that lesson and are evidence for it, but
    # they live in their own block and would otherwise belong to no slide
    chk = re.search(r"const CHECK = \[(.*?)\n  \];", js, re.S)
    if chk:
        for i in out:
            out[i] += " " + html.unescape(chk.group(1))
    return {i: re.sub(r"\s+", " ", v) for i, v in out.items()}, titles


L = "counting-to-twenty"; A = "adding-and-taking-away"; H = "halves-and-wholes"
W = "what-comes-next"; S = "shapes-and-sizes"; D = "days-months-and-clocks"; K = "asking-and-sorting"

# objective -> [(lesson, slide)...] and the clauses Cambridge names
MAP = {
 "1Nc.01": ([(L,1),(L,3),(L,10)], [("count objects to 20", r"count"),
            ("conservation", r"still (the same|there)|same number|spread out|squeezed"),
            ("one-to-one", r"one .{0,14}(each|at a time)|pair them off|one to one")]),
 "1Nc.02": ([(L,2)], [("without counting", r"without counting|straight away|do not count")]),
 "1Nc.03": ([(L,15),(L,16)], [("estimate", r"estimate|guess"), ("check by counting", r"count")]),
 "1Nc.04": ([(L,7),(L,8),(W,10)], [("on in twos", r"twos|2, ?4"), ("on in tens", r"tens|10, ?20"),
            ("back in ones", r"\-1|back"), ("back in tens", r"\-10|back.{0,30}tens")]),
 "1Nc.05": ([(L,9)], [("odd and even", r"odd|even"), ("every other", r"every other|in twos|left (alone|over)")]),
 "1Nc.06": ([(W,1),(W,2)], [("describe sequences", r"pattern|comes next|repeat")]),
 "1Ni.01": ([(L,4),(L,5)], [("number names", r"eleven|twelve|thirteen|fifteen|twenty"),
            ("read", r"read|which number|says"), ("write", r"write|type|digits")]),
 "1Ni.02": ([(A,1)], [("counting on", r"count on|counting on|count up"),
            ("combining two sets", r"two groups|together|altogether|combine")]),
 "1Ni.03": ([(A,2),(A,3)], [("counting back", r"count back|counting back"),
            ("take away", r"take away"), ("difference", r"difference|how many more")]),
 "1Ni.04": ([(A,4)], [("complements of 10", r"make(s)? 10|makes ten|to make 10|bond")]),
 "1Ni.05": ([(A,1),(A,2),(A,5)], [("add", r"add|plus|\+"), ("subtract", r"take away|minus|\u2212")]),
 "1Ni.06": ([(A,6),(A,7)], [("doubles", r"double"), ("to double 10", r"double 10|double ten|20")]),
 "1Nm.01": ([(A,8)], [("local currency", r"coin|money|\bsh\b|shilling|pence|cent")]),
 "1Np.01": ([(L,6)], [("zero is none", r"zero|none|nothing")]),
 "1Np.02": ([(L,3),(L,7)], [("ten and some ones", r"ten and|one ten|tens and ones|10 and"),
            ("compose/decompose", r"make|build|split|regroup|frame")]),
 "1Np.03": ([(L,10),(L,11),(L,12),(L,13)], [("compare", r"more|fewer|less|bigger|smaller"),
            ("order", r"order|smallest|largest|first")]),
 "1Np.04": ([(L,14)], [("ordinals", r"first|second|third"), ("to tenth", r"tenth|10th")]),
 "1Nf.01": ([(H,1),(H,2)], [("two equal parts", r"equal parts|two equal"),
            ("two unequal parts", r"unequal|not equal|not the same size|different size")]),
 "1Nf.02": ([(H,3),(H,4)], [("half of a quantity or set", r"half of|half the")]),
 "1Nf.03": ([(H,5),(H,6)], [("half as operator", r"half of \d|halve|half of the number")]),
 "1Nf.04": ([(H,7),(H,8)], [("halves combine to wholes", r"two halves|make a whole|whole")]),
 "1Gt.01": ([(D,3)], [("units of time", r"second|minute|hour|day|week|year"),
            ("familiar language", r"longer|shorter|longest|shortest")]),
 "1Gt.02": ([(D,1),(D,2)], [("days of the week", r"monday|wednesday|saturday"),
            ("months of the year", r"january|september|december")]),
 "1Gt.03": ([(D,4)], [("to the hour", r"o.?clock"), ("half hour", r"half past")]),
 "1Gg.01": ([(S,1),(S,2)], [("number of sides", r"sides"), ("curved or straight", r"curved|straight"),
            ("sort", r"sort|rule|goes in")]),
 "1Gg.02": ([(S,6)], [("long/longer/longest", r"longer|longest"),
            ("short/tall", r"shorter|shortest|taller|tallest"), ("thin", r"thin")]),
 "1Gg.03": ([(S,3)], [("faces", r"faces"), ("edges", r"edges"),
            ("flat or curved", r"flat|curved"), ("sort/identify by property", r"sort|which .{0,20}(has|have)|no edges")]),
 "1Gg.04": ([(S,7)], [("mass language", r"heavy|heavier|light|lighter"), ("less and more", r"more|less|same")]),
 "1Gg.05": ([(S,8)], [("full and empty", r"full|empty"), ("less and more", r"more|less|holds")]),
 "1Gg.06": ([(S,4)], [("2D vs 3D", r"flat|solid")]),
 "1Gg.07": ([(S,5)], [("as it rotates", r"turn|rotate"), ("looks identical", r"looks the same|same|identical")]),
 "1Gg.08": ([(S,9)], [("length", r"ruler|tape"), ("mass", r"scales"), ("capacity", r"jug"),
            ("temperature", r"thermometer|hot|cold"), ("numbered scales", r"numbers|scale")]),
 "1Gp.01": ([(S,10)], [("position", r"above|below|beside|behind|under|between"),
            ("direction", r"forwards|backwards|towards|left|right")]),
 "1Ss.01": ([(K,1),(K,10)], [("non-statistical question", r"ask|question|favourite|which")]),
 "1Ss.02": ([(K,1),(K,2),(K,3),(K,4),(K,6),(K,7),(K,8),(K,9)],
            [("practical resources and drawings", r"draw|counter|cube|picture|sticker"),
             ("lists", r"\blist\b"), ("tables", r"\btable\b"),
             ("Venn", r"venn"), ("Carroll", r"carroll"),
             ("block graphs", r"block graph"), ("pictograms", r"pictogram")]),
 "1Ss.03": ([(K,5),(K,11)], [("more/less/most/least", r"most|least|more|less|fewest"),
            ("discuss conclusions", r"what can we say|true|tells us|conclusion")]),
}

fw = framework()
missing_from_pdf = sorted(set(MAP) ^ set(fw))
pages = {}
for n in LESSONS:
    pages[n] = slides_of(page(n))

print("=" * 78)
print("Cambridge 0096 Stage 1 vs the %s Grade 1 lessons" % ("LOCAL" if LOCAL else "LIVE"))
print("framework read from the PDF at run time: %d objectives" % len(fw))
if missing_from_pdf:
    print("MISMATCH between the PDF and this map: %s" % missing_from_pdf); sys.exit(2)
print("=" * 78)

full, partial = [], []
for code in sorted(MAP, key=lambda c: (c[1:3], c)):
    where, clauses = MAP[code]
    scope = " ".join(pages[l][0].get(i, "") for l, i in where)
    got = [(n, bool(re.search(p, scope, re.I))) for n, p in clauses]
    ok = sum(1 for _, v in got if v)
    tag = ", ".join("%s#%d" % (l.split("-")[0][:6], i) for l, i in where)
    if ok == len(got):
        full.append(code)
        print("  OK   %-8s %-34s %d/%d" % (code, tag[:34], ok, len(got)))
    else:
        partial.append(code)
        print("  PART %-8s %-34s %d/%d" % (code, tag[:34], ok, len(got)))
        for n, v in got:
            if not v:
                print("         missing clause: %s" % n)
                print("         framework says: %s" % fw[code][:120])

print("=" * 78)
print("covered %d/36   partial %d   %s" % (len(full), len(partial), " ".join(partial) or ""))
sys.exit(1 if partial else 0)
