# -*- coding: utf-8 -*-
"""Verify every check answer that can be verified, and say what cannot.

The repo has shipped three Computing keys bound to the wrong option with every
gate passing them - the key was a real option, the options were unique, the
explanation was prose, and nothing compared the key to the thing the question
was about. This compares them.

WHAT THIS DOES THAT grade-1-app/check-answer-keys.py DID NOT, and why the
number moved from 23 of 75 to what it now reports:

  - IT READS BOTH IDIOMS. That one read `const CHECK = [...]` only, so
    halves-and-wholes - which builds its check with sequence({items:[...]}) -
    contributed nothing and its nine questions were not in the 75 at all. Two
    Grade 1 lessons are built that way.

  - IT READS THE ITEM'S OWN DATA, not just the question text. "How many
    counters?" is unanswerable from the words and trivial from `pic: 7`.
    "Which one is heavier?" carries `pic: balance(1, "melon", "strawberry")`,
    and the 1 IS the answer. Same for jug fills and position scenes.

WHAT IT DELIBERATELY DOES NOT CLAIM. Deriving the expected answer from the
argument that drew the picture verifies the KEY IS BOUND TO THE RIGHT ITEM. It
does not verify that balance(1, ...) draws the melon lower, because that is a
drawing question, not a key question. Binding is the failure that has actually
happened here; say only that.

Rules carried from tools/check-math-answer-keys.mjs, each of which exists
because it called a CORRECT key wrong:
  - the expression must account for every number in the question
  - a bare "/" is never an operator
  - estimation questions are excluded; their key is deliberately not exact

Usage:  python ../lesson-app-tools/check-answer-keys.py           # from a build
        python ../lesson-app-tools/check-answer-keys.py --app ../grade-1-app/g1v2
"""
import io, os, re, sys, json, html, unicodedata

sys.stdout.reconfigure(encoding="utf-8")

argv = sys.argv[1:]
app = argv[argv.index("--app") + 1] if "--app" in argv else "."
SRC = os.path.abspath(app)

cfgp = os.path.join(SRC, "app.config.json")
if os.path.exists(cfgp):
    cfg = json.load(io.open(cfgp, encoding="utf-8"))
    FILES = [l["file"] for l in cfg["lessons"]]
    LABEL = "%s %s" % (cfg.get("subjectLabel", ""), cfg.get("gradeLabel", ""))
else:
    # ALL FOUR LIVE BUILDS CARRY A CONFIG, g1v2 included - it got one in
    # b5721d234 (2026-09-07), and this tool reads it: the lesson ORDER and the
    # "Mathematics Grade 1" label both come from there. An earlier version of
    # this comment said g1v2 had none and was the one build predating them,
    # which was simply wrong when written and made the branch below look like
    # g1v2's path when it has never once been g1v2's path.
    #
    # What it IS for: a directory with no config, which here means
    # ../grade-1-app itself - the superseded FIVE-lesson build sitting above
    # g1v2, alongside the tools that built it. Pointing at it is a real thing
    # to do and it reports a real finding: that build still holds the
    # uncorrected balance(-1) and the inverted rotation sign that 0ba4a9cad
    # fixed in g1v2, so its "Which one is lighter?" comes back WRONG. Left
    # alone deliberately; nothing deploys from there.
    #
    # Order is alphabetical here rather than curricular, so the unit numbers a
    # config would give are not available - which is another reason to prefer
    # pointing at a configured build.
    FILES = sorted(f for f in os.listdir(SRC)
                   if f.endswith(".html") and not f.endswith("index.html"))
    LABEL = os.path.basename(SRC)

WORD = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
        "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
        "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
        "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
        "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "hundred": 100}
DICE = {"⚀": 1, "⚁": 2, "⚂": 3, "⚃": 4, "⚄": 5, "⚅": 6}


def plain(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", "", str(s)))).strip()


def norm(v):
    """compare answers as values, not as strings: 7 == '7' == 'seven' == '7 sh'"""
    if v is None:
        return None
    s = plain(v).lower().strip().rstrip(".")
    # A UNIT FOLLOWS A NUMBER. Without that lookbehind this ate the last
    # letter of any answer ending in one of these: jug -> "ju", dog -> "do",
    # ball -> "bal", small -> "smal". It survived because the prefix test in
    # same() forgives a one-letter truncation on both sides at once - so the
    # comparison agreed for the wrong reason, and a rule returning "jug"
    # against options ["Ruler", "Jug"] found no match at all.
    s = re.sub(r"(?<=[\d\s])(sh|shillings?|cm|mm|m|kg|g|ml|l)\b\.?$", "", s).strip()
    if s in WORD:
        return WORD[s]
    m = re.fullmatch(r"-?\d+", s)
    return int(m.group(0)) if m else s


def same(key, want):
    """A derived answer names the THING; the option label often names it and
    then says it again in words - balance() is given "🍉" while the option
    reads "🍉 melon". Equal-after-normalising is right for numbers and too
    strict for those, so a derived answer that is a prefix or a whole word of
    the key counts as a match. Not a substring test in general: "one half" must
    not match "the whole".
    """
    a, b = norm(key), norm(want)
    if a == b:
        return True
    if isinstance(a, str) and isinstance(b, str):
        if a.startswith(b) or b.startswith(a):
            return True
        return b in a.split() or a in b.split()
    return False


def balanced(js, i):
    open_c = js[i]; close_c = {"[": "]", "{": "}", "(": ")"}[open_c]
    depth, j, q = 0, i, None
    while j < len(js):
        c = js[j]
        if q:
            if c == "\\":
                j += 2; continue
            if c == q:
                q = None
        elif c in "\"'`":
            q = c
        elif c == open_c:
            depth += 1
        elif c == close_c:
            depth -= 1
            if depth == 0:
                return js[i:j + 1]
        j += 1
    return js[i:]


def objects_in(block):
    out, depth, start = [], 0, None
    q = None
    for i, c in enumerate(block):
        if q:
            if c == "\\":
                continue
            if c == q:
                q = None
            continue
        if c in "\"'":
            q = c; continue
        if c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and start is not None:
                out.append(block[start:i + 1]); start = None
    return out


# ---------------------------------------------------------------------------
# THE DATA-HANDLING LESSON DRAWS ITS QUESTIONS FROM A DATASET, so the dataset
# is the answer. "How many children said banana?" is unanswerable from the
# words and settled by the array the block graph was drawn from - the same
# principle as reading `pic: 7`, one level up. Nothing here interprets
# JavaScript in general: it recognises the two forms these builds use to
# declare a dataset, resolves the item's own `pic:` to one of them, and
# declines whenever the resolution is not unique.
#
# UPPERCASE NAMES ONLY, and that is not a style preference. `const built =
# [0, 0, 0, 0]` beside `const PETC = [6, 4, 4, 2]` is the graph the CHILD
# fills in, mutated as they add blocks; reading it as a dataset would verify
# every question against zeroes.
_DS_CACHE = {}


def dataset_index(js):
    """{pairs: [(counts, cats)], defs: {name: source}} for one lesson."""
    if id(js) in _DS_CACHE:
        return _DS_CACHE[id(js)]

    cats, counts, defs = {}, {}, {}
    for m in re.finditer(r"\bconst\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\[", js):
        name, block = m.group(1), balanced(js, js.index("[", m.end() - 1))
        rows = objects_in(block[1:-1])
        pairs = []
        for o in rows:
            e = re.search(r"\bemoji:\s*\"([^\"]*)\"", o)
            w = re.search(r"\bname:\s*\"([^\"]*)\"", o)
            if not (e and w):
                pairs = []
                break
            pairs.append((e.group(1), w.group(1)))
        if pairs:
            cats[name] = pairs
        elif re.fullmatch(r"[\s\d,]+", block[1:-1]) and block[1:-1].strip():
            counts[name] = [int(x) for x in re.findall(r"\d+", block)]

    # COUNTS = FRUIT.map((f, i) => CLASS.filter((k) => k.f === i).length)
    for m in re.finditer(
            r"\bconst\s+([A-Z][A-Za-z0-9_]*)\s*=\s*([A-Z][A-Za-z0-9_]*)\.map\("
            r"[^)]*\)\s*=>\s*([A-Z][A-Za-z0-9_]*)\.filter\(\s*\(([A-Za-z_]\w*)\)"
            r"\s*=>\s*\4\.(\w+)\s*===\s*i\s*\)\.length", js):
        name, catn, recs, _, field = m.groups()
        rm = re.search(r"\bconst\s+" + recs + r"\s*=\s*\[", js)
        if catn not in cats or not rm:
            continue
        tally = {}
        for o in objects_in(balanced(js, js.index("[", rm.end() - 1))[1:-1]):
            f = re.search(r"\b" + field + r":\s*(\d+)", o)
            if f:
                tally[int(f.group(1))] = tally.get(int(f.group(1)), 0) + 1
        counts[name] = [tally.get(i, 0) for i in range(len(cats[catn]))]

    # which counts array belongs to which categories: from the derivation
    # above, and from any call that passes the two together
    pairs = set()
    for m in re.finditer(r"\bconst\s+([A-Z][A-Za-z0-9_]*)\s*=\s*([A-Z][A-Za-z0-9_]*)\.map\(", js):
        if m.group(1) in counts and m.group(2) in cats:
            pairs.add((m.group(1), m.group(2)))
    for m in re.finditer(r"\(\s*([A-Z][A-Za-z0-9_]*)\s*,\s*([A-Z][A-Za-z0-9_]*)\s*[,)]", js):
        if m.group(1) in counts and m.group(2) in cats:
            pairs.add((m.group(1), m.group(2)))
    pairs = [(c, k) for c, k in pairs if len(counts[c]) == len(cats[k])]

    for m in re.finditer(r"\bconst\s+([A-Za-z_]\w*)\s*=\s*([^\n]*)", js):
        defs.setdefault(m.group(1), m.group(2))
    for m in re.finditer(r"\bfunction\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{", js):
        defs.setdefault(m.group(1), balanced(js, js.index("{", m.end() - 1)))

    out = {"pairs": pairs, "defs": defs, "counts": counts, "cats": cats}
    _DS_CACHE[id(js)] = out
    return out


def dataset_for(js, item):
    """the (counts, categories) the item's own picture was drawn from, or None.

    Resolves `pic:` through one hop of const/function definitions - `pic: g10`
    is `graphBlock(PETC, PETS, 6)`, `pic: p6` is `pictoHtml(COUNTS)` - and
    answers only when exactly one dataset is named.
    """
    ix = dataset_index(js)
    if not ix["pairs"]:
        return None
    m = re.search(r"\bpic:\s*(.*?),\s*\n?\s*(?:opts|a):", item, re.S)
    if not m:
        return None
    seen = set(re.findall(r"[A-Za-z_]\w*", m.group(1)))
    for nm in list(seen):
        if nm in ix["defs"]:
            seen |= set(re.findall(r"[A-Za-z_]\w*", ix["defs"][nm]))
    hit = {(c, k) for c, k in ix["pairs"] if c in seen or k in seen}
    if len(hit) != 1:
        return None
    c, k = hit.pop()
    return ix["counts"][c], ix["cats"][k]


def graph_answer(low, counts, cats, opts=()):
    """the answer a block graph, pictogram, table or list makes true, or None.

    A category is named by its emoji or its word; the count is the dataset's.
    Every rule requires the categories it needs to be named UNAMBIGUOUSLY and
    the extreme it reports to be UNIQUE - two columns tied for tallest make
    "which is the tallest?" a bad question, not a 50/50 guess.
    """
    named = [(e, w, counts[i]) for i, (e, w) in enumerate(cats)
             if e in low or re.search(r"\b" + re.escape(w) + r"s?\b", low)]
    total = sum(counts)

    if re.search(r"\b(more|fewer|less)\b.*\bthan\b", low) and len(named) == 2:
        if re.search(r"how many|how much", low):
            return abs(named[0][2] - named[1][2])
    if re.search(r"\bmore\b.*\bor\b", low) and len(named) == 2:
        a, b = named[0], named[1]
        return a[1] if a[2] > b[2] else b[1] if b[2] > a[2] else None
    if re.search(r"\bhow many\b", low) and re.search(r"altogether|in total|in all", low):
        return total
    if re.search(r"\bhow many\b", low) and len(named) == 1 and not re.search(r"\bthan\b", low):
        return named[0][2]

    if re.search(r"\bwhich\b", low):
        top = max(counts)
        low_ = min(counts)
        if re.search(r"\b(most|tallest|longest|biggest|greatest|highest)\b", low):
            if counts.count(top) == 1:
                return cats[counts.index(top)][1]
        if re.search(r"\b(least|fewest|shortest|smallest|lowest)\b", low):
            if counts.count(low_) == 1:
                return cats[counts.index(low_)][1]
        # "Which two have the SAME number?" is answered by an option naming a
        # pair, so the data picks the option rather than producing the words
        if re.search(r"\btwo\b.*\bsame\b", low):
            hit = []
            for o in opts:
                named = [i for i, (e, w) in enumerate(cats)
                         if e in o or re.search(r"\b" + re.escape(w) + r"s?\b", o.lower())]
                if len(named) == 2 and counts[named[0]] == counts[named[1]]:
                    hit.append(o)
            return hit[0] if len(hit) == 1 else None
    return None


# ---------------------------------------------------------------------------
# AUTHORED GROUND TRUTH, AND IT IS A DIFFERENT KIND OF CLAIM FROM EVERYTHING
# ABOVE. Every other rule here DERIVES the answer from the item's own data, so
# it cannot be wrong about the maths without the lesson being wrong too. These
# tables are things I am asserting: a hexagon has six sides, a sphere has no
# edges, a thermometer measures how hot. If a row here is wrong the tool
# reports a CORRECT key as wrong, which is the one failure this file exists to
# avoid - so the tables are small, flat and reviewable, and their diff is the
# review surface. Same standing as the committed booklet-answer-key fixtures.
SIDES = {"circle": 0, "triangle": 3, "square": 4, "rectangle": 4, "oblong": 4,
         "pentagon": 5, "hexagon": 6, "heptagon": 7, "octagon": 8}
SOLIDS = {                       # faces, edges, corners
    "cube": (6, 12, 8), "cuboid": (6, 12, 8), "sphere": (1, 0, 0),
    "cylinder": (3, 2, 0), "cone": (2, 1, 1), "pyramid": (5, 8, 5),
}
TOOL_FOR = {"long": "ruler", "tall": "ruler", "wide": "ruler", "high": "ruler",
            "heavy": "scales", "hot": "thermometer", "cold": "thermometer",
            "much milk": "jug", "much water": "jug", "much juice": "jug"}
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
MONTHS = ["january", "february", "march", "april", "may", "june", "july",
          "august", "september", "october", "november", "december"]
SPANS = ["second", "minute", "hour", "day", "week", "month", "year"]
# rotational symmetry order; 12 stands in for the circle's infinity because
# every turn this asks about divides it
ROT_ORDER = {"circle": 12, "square": 4, "rectangle": 2, "oblong": 2,
             "triangle": 3, "pentagon": 5, "hexagon": 6, "octagon": 8}


def facts_answer(low, opts):
    """a Grade 1 fact the tables above state independently of the key."""
    m = re.search(r"how many (sides|corners) does an? (\w+) have", low)
    if m and m.group(2) in SIDES:
        return SIDES[m.group(2)]
    m = re.search(r"how many (faces|edges|corners) does an? (\w+) have", low)
    if m and m.group(2) in SOLIDS:
        return SOLIDS[m.group(2)]["faces edges corners".split().index(m.group(1))]
    if re.search(r"which .*\bshape\b.* no corners", low):
        hit = [o for o in opts if norm(o) in SIDES and SIDES[norm(o)] == 0]
        return hit[0] if len(hit) == 1 else None
    if re.search(r"which .*solid.* no edges", low):
        hit = [o for o in opts if norm(o) in SOLIDS and SOLIDS[norm(o)][1] == 0]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"is an? (\w+) flat or solid", low)
    if m:
        return "solid" if m.group(1) in SOLIDS else "flat" if m.group(1) in SIDES else None
    m = re.search(r"which (day|month) comes (after|before) (\w+)", low)
    if m:
        ring = DAYS if m.group(1) == "day" else MONTHS
        if m.group(3) in ring:
            i = ring.index(m.group(3)) + (1 if m.group(2) == "after" else -1)
            return ring[i % len(ring)]
    if re.search(r"how many (months|days) (are there )?in a (year|week)", low):
        return 12 if "month" in low else 7
    m = re.search(r"which is the (shortest|longest)", low)
    if m and all(re.sub(r"^an? ", "", norm(o)) in SPANS for o in opts):
        rank = sorted(opts, key=lambda o: SPANS.index(re.sub(r"^an? ", "", norm(o))))
        return rank[0] if m.group(1) == "shortest" else rank[-1]
    # the long hand says o'clock or half past; the short hand says which hour
    m = re.search(r"long hand is on (\d+).*short hand is (?:just past |on )(\d+)", low)
    if m:
        lon, hour = int(m.group(1)), int(m.group(2))
        if lon == 12:
            return "%d o'clock" % hour
        if lon == 6:
            return "half past %d" % hour
        return None
    m = re.search(r"which tool", low)
    if m:
        for k, v in TOOL_FOR.items():
            if re.search(r"how " + k + r"\b", low):
                hit = [o for o in opts if v in norm(o)]
                return hit[0] if len(hit) == 1 else None
    # A is taller than B. B is taller than C. Who is the tallest?
    m = re.search(r"(\w+) is (\w+er) than (\w+)\. \3 is \2 than (\w+)\.\s*who is the (\w+est)", low)
    if m:
        a, cmp_, c = m.group(1), m.group(2), m.group(4)
        return a if m.group(5) == cmp_[:-2] + "est" else c
    # the measuring vocabulary, stated once here rather than per question
    if re.search(r"side that goes down", low):
        return "heavier"
    if re.search(r"no water in it", low):
        return "empty"
    if re.search(r"pour .*\bout\b.*now it holds", low):
        return "less"
    if re.search(r"pour .*\bin\b.*now it holds", low):
        return "more"
    m = re.search(r"is (?:below|under)(?: the)? (\w+)\. so", low)
    if m:
        return "under the " + m.group(1)
    m = re.search(r"is above(?: the)? (\w+)\. so", low)
    if m:
        return "on the " + m.group(1)
    # A shape with rotational symmetry of order n looks the same after a
    # turn of 360/n, so a quarter turn needs n divisible by 4 and a half turn
    # n divisible by 2: a square yes, an oblong no, a hexagon no.
    m = re.search(r"an? (\w+) is turned a (quarter|half) turn\. does it look the same", low)
    if m and m.group(1) in ROT_ORDER:
        turns = {"quarter": 4, "half": 2}[m.group(2)]
        return "yes" if ROT_ORDER[m.group(1)] % turns == 0 else "no"
    return None


def beads_answer(low, item):
    """the bead pattern IS the answer: `beads:` carries the whole row.

    One period does all three questions the lesson asks of it - what comes
    next, how many beads repeat, and which one is missing from the middle -
    and a row with no period at all answers none of them.
    """
    m = re.search(r"\bbeads:\s*\[", item)
    if not m:
        return None
    block = balanced(item, item.index("[", m.end() - 1))
    seq = []
    for chunk in re.findall(r"\{[^{}]*\}|null", block):
        if chunk == "null":
            seq.append(None)
            continue
        c = re.search(r"\bc:\s*\"([^\"]*)\"", chunk)
        s = re.search(r"\bs:\s*\"([^\"]*)\"", chunk)
        seq.append((c.group(1) if c else "", s.group(1) if s else ""))
    if len(seq) < 4:
        return None
    period = None
    for p in range(1, len(seq) // 2 + 1):
        if all(seq[i] is None or seq[i - p] is None or seq[i] == seq[i - p]
               for i in range(p, len(seq))):
            period = p
            break
    if not period:
        return None

    def name(b):
        shapes = {x[1] for x in seq if x}
        return b[0] if len(shapes) == 1 else b[0] + " " + b[1]

    if re.search(r"how many beads repeat", low):
        return period
    if re.search(r"missing", low):
        gaps = [i for i, b in enumerate(seq) if b is None]
        if len(gaps) != 1:
            return None
        g = gaps[0]
        src = seq[g - period] if g >= period else seq[g + period]
        return name(src) if src else None
    if re.search(r"comes next", low) and None not in seq:
        return name(seq[len(seq) - period])
    return None


def harvest(js):
    """(question, options, key, item-source) for every check question"""
    qs = []
    for m in re.finditer(r"const CHECK\s*=\s*\[", js):
        for o in objects_in(balanced(js, m.end() - 1)[1:-1]):
            q = re.search(r'\bq:\s*"((?:[^"\\]|\\.)*)"', o)
            a = re.search(r'\ba:\s*("(?:[^"\\]|\\.)*"|-?\d+)', o)
            if not (q and a):
                continue
            om = re.search(r"\bopts:\s*(?:shuffle\()?\[", o)
            opts = []
            if om:
                body = balanced(o, o.index("[", om.start()))[1:-1]
                opts = [x.strip().strip("\"'") for x in re.split(r",(?![^\[\]]*\])", body) if x.strip()]
            qs.append((plain(q.group(1)), opts, a.group(1).strip('"'), o))
    for m in re.finditer(r"\bitems:\s*\[", js):
        for o in objects_in(balanced(js, m.end() - 1)[1:-1]):
            q = re.search(r'\bask:\s*"((?:[^"\\]|\\.)*)"', o)
            om = re.search(r"\bopts:\s*(?:shuffle\()?\[", o)
            if not (q and om):
                continue
            opts, key = [], None
            for oo in objects_in(balanced(o, o.index("[", om.start()))[1:-1]):
                t = re.search(r'\bt:\s*("(?:[^"\\]|\\.)*"|-?\d+)', oo)
                if not t:
                    continue
                v = plain(t.group(1).strip('"'))
                opts.append(v)
                if re.search(r"\bok:\s*true", oo):
                    key = v
            if opts and key is not None:
                qs.append((plain(q.group(1)), opts, key, o))
    return qs


def nums(t):
    return [int(x) for x in re.findall(r"(?<![\w.])\d+(?![\w.])", t)]


def expected(q, opts, item, js=""):
    """the answer, when it can be derived; else None. Conservative by design."""
    t = plain(q).replace("−", "-").replace("×", "*")
    low = t.lower()
    if re.search(r"estimate|about|roughly|nearest|guess", low):
        return None                                   # deliberately not exact

    pic = re.search(r"\bpic:\s*(-?\d+)\b", item)
    picn = int(pic.group(1)) if pic else None

    # ---- the picture's own construction carries the answer -----------------
    ds = dataset_for(js, item) if js else None
    if ds:
        got = graph_answer(low, ds[0], ds[1], opts)
        if got is not None:
            return got

    b = re.search(r"balance\(\s*(-?\d+)\s*,\s*\"([^\"]*)\"\s*,\s*\"([^\"]*)\"", item)
    if b:
        sign, first, second = int(b.group(1)), b.group(2), b.group(3)
        if re.search(r"\blevel\b|what does that tell", low):
            # the answer is a sentence, so pick it out of the options: a level
            # beam is sign 0, and the option that says so is the only one the
            # picture supports
            if sign != 0:
                return None
            hit = [o for o in opts if re.search(r"same|equal", norm(o))]
            return hit[0] if len(hit) == 1 else None
        # THE OPTIONS SAY WHICH KIND OF ANSWER IS WANTED. "Which one is
        # heavier?" is answered with an ITEM and the sign picks the side; "The
        # bag of rice goes down. So the bag of rice is..." already names the
        # side and is answered with the PROPERTY, so returning an emoji there
        # reported a correct key as wrong. A thing that goes down is heavier
        # whichever pan it sits on, so this branch needs no sign at all.
        if all(norm(o) in ("heavier", "lighter") for o in opts):
            if re.search(r"goes down|\bdown\b", low):
                return "heavier"
            if re.search(r"goes up|\bup\b", low):
                return "lighter"
            return None
        if re.search(r"heavier|more on it|goes down|is it\b.*down", low):
            return first if sign > 0 else second if sign < 0 else None
        if re.search(r"lighter|less on it", low):
            return second if sign > 0 else first if sign < 0 else None
        return None
    j = re.search(r"jugRow\(\s*\[(.*?)\]\s*\)", item, re.S)
    if j:
        pairs = re.findall(r"\[\s*([0-9.]+)\s*,\s*\"([^\"]*)\"\s*\]", j.group(1))
        if pairs:
            vals = [(float(v), lab) for v, lab in pairs]
            if re.search(r"\bfull\b", low) and not re.search(r"half full", low):
                hit = [l for v, l in vals if v >= 0.999]
                return hit[0] if len(hit) == 1 else None
            if re.search(r"\bempty\b", low):
                hit = [l for v, l in vals if v <= 0.001]
                return hit[0] if len(hit) == 1 else None
            if re.search(r"holds more|which jug is fuller", low):
                return max(vals)[1] if len(vals) == 2 else None
            if re.search(r"holds less", low):
                return min(vals)[1] if len(vals) == 2 else None
        # NO `return None` HERE. It used to stop, which meant an item drawn
        # with a jug could never reach any later rule - "Pour a little out.
        # Now it holds..." is about the pouring, not about the jug's fill.
    sc = re.search(r"scene\(\s*\"([a-z]+)\"", item)
    if sc and re.search(r"where is the ball", low):
        return {"on": "on the box", "under": "under the box", "in": "in the box",
                "left": "next to the box"}.get(sc.group(1))
    if sc and re.search(r"\bleft\b.*\bor\b.*\bright\b", low):
        return sc.group(1) if sc.group(1) in ("left", "right") else None

    got = beads_answer(low, item)
    if got is not None:
        return got

    # shapeSvg(kind, cut, at, on) - `at` is where the cut falls and `on` is
    # which parts are coloured, so the picture states both answers exactly
    sh = re.search(r"shapeSvg\(\s*\"[a-z]+\"\s*,\s*\"[a-z]+\"\s*,\s*([0-9.]+)\s*,\s*\[([^\]]*)\]", item)
    if sh:
        at = float(sh.group(1))
        on = [x for x in sh.group(2).split(",") if x.strip()]
        if re.search(r"two parts equal", low):
            return "yes" if abs(at - 0.5) < 1e-9 else "no"
        if re.search(r"how much of this shape is coloured", low) and abs(at - 0.5) < 1e-9:
            return {0: "none", 1: "one half", 2: "the whole"}.get(len(on))

    # ---- the words --------------------------------------------------------
    # `low`, not `t`: the question opens "A dice shows", so the lowercase
    # pattern never matched the capital and this rule had never once fired.
    m = re.search(r"a dice shows (.)", low)
    if m and m.group(1) in DICE:
        return DICE[m.group(1)]
    got = facts_answer(low, opts)
    if got is not None:
        return got
    if picn is not None and re.search(r"^how many\b", low) and not nums(t):
        return picn                                   # "How many counters?" + pic: N
    if re.search(r"\bno .* left\b|are none left", low) and re.search(r"which number", low):
        return 0
    m = re.search(r"which word says (\d+)", low)
    if m:
        n = int(m.group(1))
        for w, v in WORD.items():
            if v == n:
                return w
        return None
    m = re.search(r"which digits do you press to write (\w+)", low)
    if m and m.group(1) in WORD:
        d = str(WORD[m.group(1)])
        return " then ".join(d) if len(d) > 1 else None
    m = re.search(r"which is (more|bigger|greater|less|fewer|smaller),?\s*(\d+) or (\d+)", low)
    if m:
        a, b2 = int(m.group(2)), int(m.group(3))
        return max(a, b2) if m.group(1) in ("more", "bigger", "greater") else min(a, b2)
    m = re.search(r"is (\d+) odd or even", low)
    if m:
        return "odd" if int(m.group(1)) % 2 else "even"
    m = re.search(r"(\d+)\s*\w*\s*and\s*(\d+)\s*\w*\.?\s*how many more .* than", low)
    if m:
        return abs(int(m.group(1)) - int(m.group(2)))
    m = re.search(r"shares (\d+) .* (?:with her brother|with his brother|between two|fairly with one)", low)
    if m and int(m.group(1)) % 2 == 0:
        return int(m.group(1)) // 2
    # a chain of amounts with one unit: 10 sh + 5 sh + 2 sh = ?
    m = re.match(r"^([\d\s\+shcmkgml]+)=\s*\?$", low.replace(" sh", "sh"))
    if m and "+" in m.group(1):
        parts = re.findall(r"(\d+)", m.group(1))
        if len(parts) >= 2:
            return sum(int(p) for p in parts)
    m = re.search(r"in the line ([a-z](?:, [a-z])+),? who is (\d+)(?:st|nd|rd|th)", low)
    if m:
        seq = [x.strip() for x in m.group(1).split(",")]
        i = int(m.group(2))
        return seq[i - 1].upper() if 1 <= i <= len(seq) else None

    # ---- arithmetic -------------------------------------------------------
    m = re.search(r"(\d+)\s*([+\-])\s*(\d+)\s*=\s*\?", t)
    if m:
        a, op, b2 = int(m.group(1)), m.group(2), int(m.group(3))
        return a + b2 if op == "+" else a - b2
    m = re.search(r"(\d+)\s+and\s+\?\s+makes?\s+(\d+)", low)
    if m:
        return int(m.group(2)) - int(m.group(1))
    m = re.search(r"\bdouble\s+(\d+)", low)
    if m:
        return int(m.group(1)) * 2
    m = re.search(r"\bhalf of\s+(\d+)", low)
    if m:
        n = int(m.group(1))
        return n // 2 if n % 2 == 0 else None
    m = re.search(r"((?:\d+\s*,\s*){2,})\?", t)
    if m:
        seq = nums(m.group(1))
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        if len(d) == 1:
            return seq[-1] + d.pop()
        # A REPEAT IS A PATTERN TOO. "3, 8, 3, 8, 3, ?" has no constant
        # difference, and the rule above correctly declines it - but the whole
        # lesson is about repeating patterns, so the period answers it.
        for p in range(2, len(seq) // 2 + 1):
            if all(seq[i] == seq[i - p] for i in range(p, len(seq))):
                return seq[len(seq) - p]
    # the gap at the FRONT: "?, 8, 10, 12, 14"
    m = re.match(r"^\?\s*,\s*((?:\d+\s*,\s*)+\d+)$", t)
    if m:
        seq = nums(m.group(1))
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        if len(d) == 1:
            return seq[0] - d.pop()
    # the function machine: "The machine does +2. 6 goes in. What comes out?"
    m = re.search(r"machine does ([+-])\s*(\d+)\.\s*(\d+) goes in", low)
    if m:
        n, x = int(m.group(2)), int(m.group(3))
        return x + n if m.group(1) == "+" else x - n
    # a growing pattern stated in words, extended to the term it asks for
    steps = re.findall(r"pattern (\d+) (?:has )?(\d+)", low)
    m = re.search(r"how many .*\bin pattern (\d+)", low)
    if m and len(steps) >= 2:
        pts = sorted((int(a), int(b)) for a, b in steps)
        d = {pts[i + 1][1] - pts[i][1] for i in range(len(pts) - 1)}
        gaps = {pts[i + 1][0] - pts[i][0] for i in range(len(pts) - 1)}
        want = int(m.group(1))
        if len(d) == 1 and gaps == {1} and want > pts[-1][0]:
            return pts[-1][1] + d.pop() * (want - pts[-1][0])
    # every whole takes two halves
    m = re.search(r"how many halves make (\w+) whole", low)
    if m:
        n = norm(m.group(1))
        if isinstance(n, int):
            return 2 * n
    # A PICTOGRAM STATES ITS SCALE IN WORDS, so the pictures on the page are
    # the key times the count, never the count. Carried from
    # tools/check-math-answer-keys.mjs, where reading the glyphs as the
    # quantity was a real defect.
    m = re.search(r"one \S+ stands for (\w+) child.*there are (\w+)\b.*how many", low)
    if m:
        per, seen = norm(m.group(1)), norm(m.group(2))
        if isinstance(per, int) and isinstance(seen, int):
            return per * seen
    # two quantities stated in the question, and an option that names one
    m = re.search(r"(\d+) \w+ have an? (\w+) and (\d+) have an? (\w+)", low)
    if m and re.search(r"which is (?:true|right)", low):
        big = m.group(2) if int(m.group(1)) > int(m.group(3)) else m.group(4)
        if int(m.group(1)) != int(m.group(3)):
            hit = [o for o in opts if re.search(r"\bmore\b", norm(o)) and big in norm(o)]
            return hit[0] if len(hit) == 1 else None
    m = re.search(r"comes just after\s+(\d+)", low)
    if m:
        return int(m.group(1)) + 1
    m = re.search(r"(\d+) is 1 ten and \? ones", low)
    if m:
        return int(m.group(1)) - 10
    return None


tot = ver = wrong = 0
bad, unver = [], []
print("\n  Check answers, verified against the question and the item  -  %s\n" % LABEL)
for f in FILES:
    p = os.path.join(SRC, f)
    if not os.path.exists(p):
        continue
    js = "\n".join(re.findall(r"<script[^>]*>(.*?)</script>",
                              io.open(p, encoding="utf-8").read(), re.S))
    n = v = w = 0
    for q, opts, key, item in harvest(js):
        n += 1; tot += 1
        want = expected(q, opts, item, js)
        if want is None:
            unver.append((f, q)); continue
        v += 1; ver += 1
        if not same(key, want):
            w += 1; wrong += 1
            bad.append((f, q, key, want, opts))
        elif opts and not any(same(o, want) for o in opts):
            w += 1; wrong += 1
            bad.append((f, q, key, "key not among options", opts))
    print("  %-4s %-32s %3d asked  %3d verified  %d wrong" % ("ok" if not w else "FAIL", f[:32], n, v, w))

print("\n  %d questions, %d verified, %d WRONG, %d not verifiable" % (tot, ver, wrong, tot - ver))
for f, q, key, want, opts in bad:
    print("\n  WRONG  %s" % f)
    print("     q:      %s" % q[:100])
    print("     key:    %r" % key)
    print("     should: %r" % want)
    print("     opts:   %s" % opts)

if "--list-unverified" in argv:
    print("\n  not verifiable by any rule here:")
    for f, q in unver:
        print("     %-30s %s" % (f[:30], q[:78]))

if tot == 0:
    sys.exit("\n  REFUSED: no questions found. A checker that reads nothing is not a pass.")
print("")
sys.exit(1 if wrong else 0)
