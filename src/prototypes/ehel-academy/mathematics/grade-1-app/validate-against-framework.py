# -*- coding: utf-8 -*-
"""Validate the LIVE Grade 1 lessons against Cambridge 0096 Stage 1.

Two things make this stronger than check-stage1-coverage.py, which matches
slide titles:

  - the objectives are read from the framework file, not typed here, so the
    thing being validated against is the framework rather than my memory of it
    (the committed extraction of Cambridge's PDF - see framework() for why it
    is no longer the PDF itself)
  - each objective is broken into the clauses Cambridge actually names, and
    each clause is looked for in the SLIDE that teaches it, not anywhere in the
    course. A whole-course search scores ~100% on false positives: "taking
    turns" satisfies rotation, "flattened to plain text" satisfies flat-or-
    curved faces.

Source is the deployed CDN pages by default (what a learner receives), or
--local for the repo copies.

The PDF extraction hazards this file once handled itself - sub-bullets arriving
as the letter "o" (`counting on o combining two sets`), the next section heading
bleeding onto the end of an objective - are now the extractor's job, handled
once in tools/extract-cambridge-mathematics-framework.py for every stage.
"""
import re, io, os, sys, json, urllib.request, html

SP = os.path.dirname(os.path.abspath(__file__))
# the committed extraction of Cambridge's 0096 PDF - see framework()
FRAMEWORK = os.path.normpath(os.path.join(SP, "..", "..", "..", "..", "curriculum",
                                          "cambridge-mathematics-0096.json"))
CDN = "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/grade-1-v2/"
LOCAL = "--local" in sys.argv

LESSONS = ["counting-to-twenty", "adding-and-taking-away", "halves-and-wholes",
           "what-comes-next", "shapes-and-sizes", "days-months-and-clocks",
           "asking-and-sorting"]



def framework():
    """Cambridge 0096 Stage 1, from the COMMITTED extraction of Cambridge's PDF.

    This used to open the PDF in ~/Downloads at run time. The PDF was tidied
    away, and from that day the validator could not run at all - it exited 1
    on a FileNotFoundError, which a gate reading exit codes reports as a
    FAILURE of the build rather than as a tool that did no work. The whole
    coverage claim then rested on audit-stage-coverage.py, which checks the
    objective codes written onto the pages - and annotate-objectives.py wrote
    those codes FROM this validator's own MAP. A check on its own authorship.

    src/curriculum/cambridge-mathematics-0096.json is the same PDF extracted by
    the repo's own tools/extract-cambridge-mathematics-framework.py, committed,
    so it is present on a fresh clone. It moves no verdict: the framework text
    is used for exactly two things here - checking MAP names the same 36 codes,
    and printing an objective when a clause is missing. Every OK/PART comes from
    MAP's own per-slide patterns.
    """
    if not os.path.exists(FRAMEWORK):
        print("CANNOT RUN: framework file missing: %s" % FRAMEWORK)
        sys.exit(2)
    data = json.load(io.open(FRAMEWORK, encoding="utf-8"))
    return {o["code"]: o["text"] for o in data["objectivesByStage"]["1"]}


def page(name):
    if LOCAL:
        return io.open(os.path.join(SP, "g1v2", name + ".html"), encoding="utf-8").read()
    return urllib.request.urlopen(CDN + name + ".html", timeout=30).read().decode("utf-8")


def tag_end(s, i):
    """The '>' that closes the tag opening at i, read QUOTE-AWARE: a slide's
    data-explain holds SSML, and SSML is full of '>'."""
    q = None
    while i < len(s):
        c = s[i]
        if q:
            if c == q:
                q = None
        elif c in "\"'":
            q = c
        elif c == ">":
            return i
        i += 1
    return -1


def attr(tag, name):
    m = re.search(r"\b%s=(\"|')(.*?)\1" % re.escape(name), tag, re.S)
    return m.group(2) if m else ""


LINKS = {"to their slide": 0, "to no slide": 0}


def slides_of(src):
    """(SHOWN, titles, SPOKEN), each keyed by slide index.

    SHOWN is what the slide puts in front of a child: its visible text, its own
    activity block(s), and the lesson's check. SPOKEN is what it says aloud -
    data-say when the child arrives, data-explain when they press Explain - kept
    apart, so a clause that is only ever HEARD is reported as such instead of
    being counted as on the screen.

    TWO FAULTS UNTIL 2026-09-11, and both made this more generous than its claim
    of looking "in the SLIDE that teaches it":

      - NO BLOCK WAS EVER LINKED TO ITS SLIDE. Each slide's element ids were
        read from its text AFTER every tag had been stripped out of it, so every
        id set was empty, all 96 activity blocks took the fallback below, and
        each lesson's whole script counted as evidence for every one of its
        slides. The check was per LESSON. Worst case found: 1Nc.01's
        "conservation" clause was being satisfied by a CSS comment - "squeezed
        to 187 px wide" - in a notice's styling, which no child ever sees.
      - THE SLIDE TAG WAS CUT AT THE FIRST '>' INSIDE ITS SSML, so the tail of
        the Explain script was read as the slide's visible text. Measured with
        both faults fixed: every objective still passes on what is SHOWN except
        1Nc.01's conservation clause, which is taught only in the Explain script
        (slides 3 and 10, "six big things spread out is still fewer than eight
        little things squeezed together"). It is reported, not hidden: OK* and
        a line saying which clause is only spoken.

    Blocks are linked by the ids they touch: $("id"), getElementById("id"), and
    the ids named in an `el: {...}` map - the shared runners sequence() and
    orderer() are handed their slide that way, and 12 blocks name no other.
    """
    body = re.sub(r"<style[^>]*>.*?</style>", " ", src, flags=re.S | re.I)
    js = " ".join(re.findall(r"<script[^>]*>(.*?)</script>", body, re.S | re.I))
    markup = re.sub(r"<script[^>]*>.*?</script>", " ", body, flags=re.S | re.I)
    out, titles, spoken, ids = {}, {}, {}, {}
    i = 0
    for m in re.finditer(r"<section\b", markup):
        gt = tag_end(markup, m.start())
        tag = markup[m.start():gt + 1]
        if gt < 0 or not re.search(r'\bclass="[^"]*\bslide\b', tag):
            continue
        i += 1
        s = markup[gt + 1:markup.index("</section>", gt)]
        h = re.search(r"<h2[^>]*>(.*?)</h2>", s, re.S)
        titles[i] = html.unescape(re.sub(r"<[^>]*>", "", h.group(1))).strip() if h else "?"
        out[i] = html.unescape(re.sub(r"<[^>]*>", " ", s))
        spoken[i] = html.unescape(re.sub(r"<[^>]*>", " ", attr(tag, "data-say") + " " + attr(tag, "data-explain")))
        ids[i] = set(re.findall(r'id="([A-Za-z0-9_-]+)"', s))
    # the activity blocks, matched to slides by the element ids they touch
    marks = [(m.start(), m.end()) for m in re.finditer(r"/\*\s*-+\s*\d+\s*:[^*]*?-*\*/", js)]
    for k, (st, en) in enumerate(marks):
        stop = marks[k + 1][0] if k + 1 < len(marks) else len(js)
        blk = js[en:stop]
        touched = set(re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', blk)) | \
            set(re.findall(r'getElementById\("([A-Za-z0-9_-]+)"\)', blk)) | \
            set(re.findall(r'"([A-Za-z0-9_-]+)"', " ".join(re.findall(r"\bel:\s*\{([^}]*)\}", blk))))
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
            # but it is evidence, where silence was a false negative. It is
            # COUNTED now and printed, because until 2026-09-11 every block took
            # this path and nothing said so.
            LINKS["to no slide"] += 1
            for i in out:
                out[i] += " " + html.unescape(blk)
        else:
            LINKS["to their slide"] += 1
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
    squash = lambda d: {i: re.sub(r"\s+", " ", v) for i, v in d.items()}
    return squash(out), titles, squash(spoken)


L = "counting-to-twenty"; A = "adding-and-taking-away"; H = "halves-and-wholes"
W = "what-comes-next"; S = "shapes-and-sizes"; D = "days-months-and-clocks"; K = "asking-and-sorting"

# objective -> [(lesson, slide)...] and the clauses Cambridge names
MAP = {
 "1Nc.01": ([(L,1),(L,3),(L,10)], [("count objects to 20", r"count"),
            ("conservation", r"still (the same|there)|same number|spread out|squeezed"),
            ("one-to-one", r"one .{0,14}(each|at a time)|pair them off|one to one")]),
 "1Nc.02": ([(L,2),(L,17)], [("without counting", r"without counting|straight away|do not count")]),
 "1Nc.03": ([(L,15),(L,16)], [("estimate", r"estimate|guess"), ("check by counting", r"count")]),
 "1Nc.04": ([(L,7),(L,8),(W,10)], [("on in twos", r"twos|2, ?4"), ("on in tens", r"tens|10, ?20"),
            ("back in ones", r"\-1|back"), ("back in tens", r"\-10|back.{0,30}tens")]),
 "1Nc.05": ([(L,9),(L,19)], [("odd and even", r"odd|even"), ("every other", r"every other|in twos|left (alone|over)")]),
 "1Nc.06": ([(W,1),(W,2)], [("describe sequences", r"pattern|comes next|repeat")]),
 "1Ni.01": ([(L,4),(L,5)], [("number names", r"eleven|twelve|thirteen|fifteen|twenty"),
            ("read", r"read|which number|says"), ("write", r"write|type|digits")]),
 "1Ni.02": ([(A,1),(A,9)], [("counting on", r"count on|counting on|count up"),
            ("combining two sets", r"two groups|together|altogether|combine")]),
 "1Ni.03": ([(A,2),(A,3)], [("counting back", r"count back|counting back"),
            ("take away", r"take away"), ("difference", r"difference|how many more")]),
 "1Ni.04": ([(A,4),(A,10)], [("complements of 10", r"make(s)? 10|makes ten|to make 10|bond")]),
 "1Ni.05": ([(A,1),(A,2),(A,5)], [("add", r"add|plus|\+"), ("subtract", r"take away|minus|\u2212")]),
 "1Ni.06": ([(A,6),(A,7)], [("doubles", r"double"), ("to double 10", r"double 10|double ten|20")]),
 "1Nm.01": ([(A,8),(A,11)], [("local currency", r"coin|money|\bsh\b|shilling|pence|cent")]),
 "1Np.01": ([(L,6),(L,18)], [("zero is none", r"zero|none|nothing")]),
 "1Np.02": ([(L,3),(L,7)], [("ten and some ones", r"ten and|one ten|tens and ones|10 and"),
            ("compose/decompose", r"make|build|split|regroup|frame")]),
 "1Np.03": ([(L,10),(L,11),(L,12),(L,13)], [("compare", r"more|fewer|less|bigger|smaller"),
            ("order", r"order|smallest|largest|first")]),
 "1Np.04": ([(L,14),(L,20)], [("ordinals", r"first|second|third"), ("to tenth", r"tenth|10th")]),
 "1Nf.01": ([(H,1),(H,2)], [("two equal parts", r"equal parts|two equal"),
            ("two unequal parts", r"unequal|not equal|not the same size|different size")]),
 "1Nf.02": ([(H,3),(H,4)], [("half of a quantity or set", r"half of|half the")]),
 "1Nf.03": ([(H,5),(H,6)], [("half as operator", r"half of \d|halve|half of the number")]),
 "1Nf.04": ([(H,7),(H,8)], [("halves combine to wholes", r"two halves|make a whole|whole")]),
 "1Gt.01": ([(D,3),(D,5)], [("units of time", r"second|minute|hour|day|week|year"),
            ("familiar language", r"longer|shorter|longest|shortest")]),
 "1Gt.02": ([(D,1),(D,2)], [("days of the week", r"monday|wednesday|saturday"),
            ("months of the year", r"january|september|december")]),
 "1Gt.03": ([(D,4),(D,6)], [("to the hour", r"o.?clock"), ("half hour", r"half past")]),
 "1Gg.01": ([(S,1),(S,2)], [("number of sides", r"sides"), ("curved or straight", r"curved|straight"),
            ("sort", r"sort|rule|goes in")]),
 "1Gg.02": ([(S,6),(S,14)], [("long/longer/longest", r"longer|longest"),
            ("short/tall", r"shorter|shortest|taller|tallest"), ("thin", r"thin")]),
 "1Gg.03": ([(S,3),(S,11)], [("faces", r"faces"), ("edges", r"edges"),
            ("flat or curved", r"flat|curved"), ("sort/identify by property", r"sort|which .{0,20}(has|have)|no edges")]),
 "1Gg.04": ([(S,7),(S,15)], [("mass language", r"heavy|heavier|light|lighter"), ("less and more", r"more|less|same")]),
 "1Gg.05": ([(S,8),(S,16)], [("full and empty", r"full|empty"), ("less and more", r"more|less|holds")]),
 "1Gg.06": ([(S,4),(S,12)], [("2D vs 3D", r"flat|solid")]),
 "1Gg.07": ([(S,5),(S,13)], [("as it rotates", r"turn|rotate"), ("looks identical", r"looks the same|same|identical")]),
 "1Gg.08": ([(S,9),(S,17)], [("length", r"ruler|tape"), ("mass", r"scales"), ("capacity", r"jug"),
            ("temperature", r"thermometer|hot|cold"), ("numbered scales", r"numbers|scale")]),
 "1Gp.01": ([(S,10),(S,18)], [("position", r"above|below|beside|behind|under|between"),
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
print("framework read from %s: %d objectives" % (os.path.basename(FRAMEWORK), len(fw)))
if missing_from_pdf:
    print("MISMATCH between the framework and this map: %s" % missing_from_pdf); sys.exit(2)
print("=" * 78)

full, partial, heard_only = [], [], []
for code in sorted(MAP, key=lambda c: (c[1:3], c)):
    where, clauses = MAP[code]
    shown = " ".join(pages[l][0].get(i, "") for l, i in where)
    said = " ".join(pages[l][2].get(i, "") for l, i in where)
    # a clause is SHOWN (on the slide or in its activity), only SPOKEN, or missing
    got = [(n, "shown" if re.search(p, shown, re.I) else "spoken" if re.search(p, said, re.I) else None)
           for n, p in clauses]
    ok = sum(1 for _, v in got if v)
    heard = [n for n, v in got if v == "spoken"]
    heard_only += ["%s %s" % (code, n) for n in heard]
    tag = ", ".join("%s#%d" % (l.split("-")[0][:6], i) for l, i in where)
    if ok == len(got):
        full.append(code)
        print("  OK%s  %-8s %-34s %d/%d" % ("*" if heard else " ", code, tag[:34], ok, len(got)))
    else:
        partial.append(code)
        print("  PART %-8s %-34s %d/%d" % (code, tag[:34], ok, len(got)))
    for n, v in got:
        if v == "spoken":
            print("         only spoken, never shown: %s" % n)
        elif not v:
            print("         missing clause: %s" % n)
            print("         framework says: %s" % fw[code][:120])

print("=" * 78)
print("activity blocks: %d linked to their slide, %d to no slide (counted for every slide of their lesson)"
      % (LINKS["to their slide"], LINKS["to no slide"]))
print("covered %d/36   partial %d   %s" % (len(full), len(partial), " ".join(partial) or ""))
if heard_only:
    # covered, because a child who presses Explain hears it - but not on the
    # screen and not in any activity, which is a claim this report will not make
    print("* taught only in what a slide SAYS (its Explain script or arrival line): %s" % "; ".join(heard_only))
sys.exit(1 if partial else 0)
