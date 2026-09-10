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
import io, os, re, sys, json, html, hashlib, unicodedata

sys.stdout.reconfigure(encoding="utf-8")

argv = sys.argv[1:]
app = argv[argv.index("--app") + 1] if "--app" in argv else "."
SRC = os.path.abspath(app)

# ---------------------------------------------------------------------------
# --rule-hits: WHICH RULE ANSWERED, AND WHICH ANSWERED NOTHING.
#
# A rule that never matches looks exactly like a question that cannot be
# answered: both leave the count where it was. Six rules in this file had never
# once fired - a pattern that missed the question, a comparison that could not
# succeed, a selector that matched two options and disqualified itself - and
# each was found days apart by noticing a number had not moved. This reports it
# in one run.
#
# It counts RETURN STATEMENTS, not functions, because that is the granularity
# the problem lives at: every one of those six sat inside a function that fired
# happily for other questions, so a per-function tally would have shown it busy.
# Tracing costs nothing when the flag is off and needs no edit to any rule.
RULE_FUNCS = {
    "expected", "facts_answer", "graph_answer", "money_answer",
    "fraction_answer", "units_answer", "clock_answer", "turn_answer",
    "pattern_answer", "chart_answer", "stage34_number", "stage34_shape",
    "stage34_place", "stage34_time", "named_chart_answer", "beads_answer",
    "calc_answer", "words_answer", "term_rule_answer", "estimate_answer",
    "part_square_answer",
}
RULE_HITS = "--rule-hits" in argv
_hits = {}


def _trace(frame, event, arg):
    if event == "call":
        return _trace if frame.f_code.co_name in RULE_FUNCS else None
    if event == "return" and arg is not None:
        k = (frame.f_code.co_name, frame.f_lineno)
        _hits[k] = _hits.get(k, 0) + 1
    return _trace

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

WORD = {"zero": 0, "none": 0,
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
        "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
        "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
        "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
        "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "hundred": 100}
DICE = {"⚀": 1, "⚁": 2, "⚂": 3, "⚃": 4, "⚄": 5, "⚅": 6}
NEG = re.compile(r"\b(not|no|never|none|neither|nobody|nothing)\b|n't")


def plain(s):
    # A JS STRING LITERAL'S ESCAPES ARE PART OF THE LITERAL, NOT THE TEXT.
    # Grade 4 writes `q: "What is 623 − 187?"`, so reading the literal
    # verbatim gives a question containing the six characters − rather
    # than a minus sign - no arithmetic rule could match it, and the
    # unverified list printed the escape, which reads as the terminal quoting
    # the output rather than as the data itself. That misreading cost a round.
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), str(s))
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", "", s))).strip()


def norm(v):
    """compare answers as values, not as strings: 7 == '7' == 'seven' == '7 sh'"""
    if v is None:
        return None
    s = plain(v).lower().strip().rstrip(".").replace("−", "-")
    # A UNIT FOLLOWS A NUMBER. Without that lookbehind this ate the last
    # letter of any answer ending in one of these: jug -> "ju", dog -> "do",
    # ball -> "bal", small -> "smal". It survived because the prefix test in
    # same() forgives a one-letter truncation on both sides at once - so the
    # comparison agreed for the wrong reason, and a rule returning "jug"
    # against options ["Ruler", "Jug"] found no match at all.
    # A UNIT FOLLOWS A NUMBER, AND THE WHOLE STRING IS THE TWO OF THEM. The
    # lookbehind this replaced allowed any space, so widening the list ate the
    # noun out of "an hour" and "a minute" - which are ANSWERS in the
    # duration questions, not measurements - and four Grade 2 questions
    # silently stopped verifying. Anchoring the number makes the rule say what
    # it means. The list stays a list: stripping any trailing word would
    # collapse "24 squares" and "24 apples", and two options differing only in
    # their unit would become one.
    m = re.fullmatch(r"(-?\d[\d,. ]*?)\s*(?:sh|shillings?|cm|mm|m|kg|g|ml|l"
                     r"|squares?|degrees?|weeks?|days?|hours?|minutes?|mins?"
                     r"|seconds?|secs?|months?|years?|cents?|c|°c|°f|°)\.?", s)
    if m:
        s = m.group(1).strip()
    if s in WORD:
        return WORD[s]
    # A THOUSANDS SEPARATOR IS PUNCTUATION, NOT A LIST. Grade 4 writes its
    # options as "4,700" and "47,000", so without this the key stayed a string
    # while the arithmetic produced an int and every four-figure answer was
    # reported wrong. The grouping is required strictly - "2, 4, 6" is a
    # sequence and must not collapse into 246.
    # a thousands separator is written both ways here: "4,700" and "60 000"
    if re.fullmatch(r"-?\d{1,3}(?:[, ]\d{3})+", s):
        return int(s.replace(",", "").replace(" ", ""))
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
        # A NEGATION IS NOT A NEAR MISS, IT IS THE OPPOSITE ANSWER. The word
        # test below matches "fair" against "not fair" - "fair" is a whole word
        # inside it - so a key bound to the negated option compared EQUAL to
        # the derived answer and the tool reported the pair as correct. Found
        # by mutation: re-binding the spinner key to "not fair" survived.
        if bool(NEG.search(a)) != bool(NEG.search(b)):
            return False
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
# CACHE ON id() AND HOLD THE STRING, because id() alone is WRONG. A CPython id
# is unique among LIVE objects only, so once one lesson's script is freed the
# next one can be allocated at the same address - measured in this very build,
# three of seven lessons reused an earlier lesson's id. Keyed on the bare id,
# a lesson could be handed another lesson's datasets, or an empty index, and
# the graph rules would silently stop firing for it. It surfaced as a Grade 1
# mutation "surviving" once and passing on the next run, which is the worst
# way for a checker to be wrong: the tick is real, the work is not.
#
# Storing the string in the entry fixes both halves - the `is` test rejects a
# recycled id, and holding the reference stops that id being recycled at all
# while the entry lives.
_DS_CACHE = {}


def dataset_index(js):
    """{pairs: [(counts, cats)], defs: {name: source}} for one lesson."""
    hit = _DS_CACHE.get(id(js))
    if hit is not None and hit[0] is js:
        return hit[1]

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
    _DS_CACHE[id(js)] = (js, out)          # the string, so the id cannot recycle
    return out


def named_counts(js):
    """{varname: {category: count}} for a dataset written as ONE object.

    Grade 4 declares its chart as `const A4 = { Walk: 9, Bus: 6, Car: 4,
    Bike: 3 }` - categories and counts in the same literal. dataset_index
    above only knows Grade 1's shape, a `[{emoji, name}]` array paired with a
    separate counts array, so it reported this file as having no data at all
    and every question that reads the chart went unverified. Two or more
    fields, all of them plain integers: that is a dataset, whatever it is
    called.
    """
    out = {}
    for m in re.finditer(r"\bconst\s+([A-Za-z_]\w*)\s*=\s*\{", js):
        body = balanced(js, js.index("{", m.end() - 1))[1:-1]
        if not body.strip() or "{" in body or "[" in body:
            continue
        fields = re.findall(r"([A-Za-z_]\w*|\"[^\"]+\")\s*:\s*(-?\d+)\s*(?:,|$)", body)
        if len(fields) >= 2 and len(fields) == len([x for x in body.split(",") if x.strip()]):
            out[m.group(1)] = {k.strip('"').lower(): int(v) for k, v in fields}
    return out


def dataset_labels(js, names):
    """{varname: label} taken from the call that DRAWS each dataset.

    `bars5(A4, "Class 4A - ...")` is what ties the variable to the words a
    question uses, and nothing else in the file does. Without it "most common
    in Class 4B" cannot pick between two datasets that are otherwise alike.
    """
    out = {}
    for n in names:
        m = re.search(r"\b\w+\s*\(\s*" + re.escape(n) + r"\s*,\s*\"([^\"]+)\"", js)
        if m:
            # THE LABEL IS THE HEADING, NOT THE WHOLE CAPTION. It is written
            # `"Class 4A · " + totalOf(A4) + " children"`, so the literal ends
            # in the separator - and "class 4a ·" is not a substring of a
            # question that says "in Class 4A", so every lookup missed.
            lab = plain(m.group(1)).lower()
            lab = re.sub(r"[\s·:,;|/-]+$", "", lab)
            if lab:
                out[n] = lab
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
    span_of = lambda o: re.sub(r"^an? ", "", str(norm(o)))
    m = re.search(r"which (?:one )?is the (shortest|longest)", low)
    if m and all(span_of(o) in SPANS for o in opts):
        rank = sorted(opts, key=lambda o: SPANS.index(span_of(o)))
        return rank[0] if m.group(1) == "shortest" else rank[-1]
    # THE SAME QUESTION ASKED OF TWO, which is the form Grade 1 uses: "Which is
    # longer: a week or a day?". The superlative rule above needs a set to rank
    # and this one names its pair in the question, so neither covers the other.
    m = re.search(r"which is (longer|shorter)[:,]?\s*(.+?)\s+or\s+(.+?)\s*\??$", low)
    if m:
        # strip the comma HERE, not at each use: "100 minutes," carried it into
        # norm(), which then would not read the number and matched no option
        a, b = (re.sub(r"^an? ", "", x).strip().rstrip(",")
                for x in (m.group(2), m.group(3)))
        if a in SPANS and b in SPANS and a != b:
            want = (max if m.group(1) == "longer" else min)(a, b, key=SPANS.index)
            hit = [o for o in opts if span_of(o) == want]
            return hit[0] if len(hit) == 1 else None
        # NAMED SPANS RANK; MEASURED ONES MUST BE CONVERTED. "100 minutes, or
        # 1 hour" is not a pair of span WORDS, and comparing them by name would
        # answer the wrong way - 100 minutes is the longer.
        ma, mb = measure(a), measure(b)
        if ma and mb and ma[0] == mb[0] == "time" and ma[1] != mb[1]:
            want_big = m.group(1) == "longer"
            keep = a if (ma[1] > mb[1]) == want_big else b
            hit = [o for o in opts if norm(o) == norm(keep)]
            return hit[0] if len(hit) == 1 else None
    # "Shortest first, which order is right?" - the OPTION is the ordering
    m = re.search(r"(shortest|longest) first, which order is right", low)
    if m:
        up = m.group(1) == "shortest"
        hit = []
        for o in opts:
            names = [re.sub(r"^an? ", "", x.strip()) for x in str(norm(o)).split(",")]
            if len(names) >= 2 and all(n in SPANS for n in names):
                idx = [SPANS.index(n) for n in names]
                if idx == (sorted(idx) if up else sorted(idx, reverse=True)):
                    hit.append(o)
        return hit[0] if len(hit) == 1 else None
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
    # a shape described by its sides and corners
    m = re.search(r"a shape with (\d+) (equal )?sides and \1 (square|right) corners is", low)
    if m:
        want = "square" if m.group(2) and m.group(1) == "4" else \
               "rectangle" if m.group(1) == "4" else None
        hit = [o for o in opts if want and norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    # the everyday object a solid is named for
    LIKE = {"ball": "sphere", "tin": "cylinder", "can": "cylinder",
            "box": "cuboid", "dice": "cube", "die": "cube",
            "party hat": "cone", "ice cream cone": "cone"}
    m = re.search(r"which solid is like an? ([\w ]+?)\??$", low)
    if m and m.group(1).strip() in LIKE:
        hit = [o for o in opts if norm(o) == LIKE[m.group(1).strip()]]
        return hit[0] if len(hit) == 1 else None
    # position said two ways
    m = re.search(r"is (?:sitting )?on top of the (\w+)\. the \w+ is", low)
    if m:
        hit = [o for o in opts if re.search(r"\babove\b|\bon\b", norm(o))]
        return hit[0] if len(hit) == 1 else None
    if re.search(r"in the middle of the two\b", low):
        hit = [o for o in opts if "between" in norm(o)]
        return hit[0] if len(hit) == 1 else None
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


# ---------------------------------------------------------------------------
# MONEY AND FRACTIONS ANSWER WITH AN OPTION, NOT WITH A NUMBER, and that is
# forced rather than stylistic. norm() strips a trailing unit only for the list
# it knows, so norm("80 sh") is 80 and norm("100 c") is the STRING "100 c" -
# and same("100 c", 100) is False. A rule returning the bare arithmetic would
# therefore report a perfectly good key as wrong on every question answered in
# cents, in mixed units ("2 sh 50 c") or as a fraction ("3/4").
#
# So these derive the VALUE and let the options supply the wording: compute,
# then return the one option that carries that value, and decline when more
# than one does. Same shape as the no-corners and equal-columns rules.
FRACWORD = {"half": 2, "halves": 2, "third": 3, "thirds": 3, "quarter": 4,
            "quarters": 4, "fifth": 5, "fifths": 5, "sixth": 6, "sixths": 6,
            "eighth": 8, "eighths": 8, "ninth": 9, "ninths": 9,
            "tenth": 10, "tenths": 10, "twelfth": 12, "twelfths": 12,
            "hundredth": 100, "hundredths": 100}
PLACE = {"ones": 1, "units": 1, "tens": 10, "hundreds": 100,
         "thousands": 1000, "ten thousands": 10000}


def fval(s):
    """the value of a fraction as these lessons write it, or None.

    Reads "3/4", "4/4", "2/4", "1 whole and 1/4", "5 wholes" and the bare
    words ("one quarter"). Deliberately NOT "the whole" or "none" - those are
    Grade 1 wordings whose questions are answered from the picture long before
    anything here runs, and giving them a value would put this rule in front of
    the one that reads the drawing.
    """
    t = plain(s).lower().strip()
    total, seen = 0.0, False
    m = re.match(r"^(\d+)\s+whole", t)
    if m:
        total, seen, t = total + int(m.group(1)), True, t[m.end():]
    for m in re.finditer(r"(\d+)\s*/\s*(\d+)", t):
        n, d = int(m.group(1)), int(m.group(2))
        if d == 0:
            return None
        total, seen = total + n / d, True
    if seen:
        return total
    # GRADE 4 WRITES ITS OPTIONS IN WORDS - "Six eighths", "Four and a half",
    # "Fifty hundredths" - so a reader that only knows figures matches none of
    # them and every word-fraction rule declines in silence.
    m = re.fullmatch(r"(\w+) and (?:a|one) (" + "|".join(FRACWORD) + r")", t)
    if m and isinstance(norm(m.group(1)), int):
        return norm(m.group(1)) + 1.0 / FRACWORD[m.group(2)]
    m = re.fullmatch(r"(\w+)\s+(" + "|".join(FRACWORD) + r")", t)
    if m:
        k = norm(m.group(1))
        if isinstance(k, int):
            return k / FRACWORD[m.group(2)]
    m = re.fullmatch(r"(?:one|1|a|an)?\s*(" + "|".join(FRACWORD) + r")", t)
    if m:
        return 1.0 / FRACWORD[m.group(1)]
    # a bare number word, so "Nine" can be compared with 9
    n = norm(t)
    if isinstance(n, int):
        return float(n)
    # a percentage IS a fraction of a hundred
    m = re.fullmatch(r"(\d+(?:\.\d+)?)\s*%", t)
    return float(m.group(1)) / 100 if m else None


def pick(opts, want, read):
    """the one option whose value is `want`, or None if that is not unique."""
    if want is None:
        return None
    hit = [o for o in opts if read(o) is not None and abs(read(o) - want) < 1e-9]
    return hit[0] if len(hit) == 1 else None


def amount(s):
    """the leading amount of an option like "80 sh", "100 c", "50 + 20".

    A THOUSANDS SEPARATOR IS PART OF THE NUMBER, the same rule expected()
    applies to the question. Without it nums() splits "About 2,400" and this
    returned 2.0, so every four-figure option silently failed to match and the
    question read as unverifiable - amount() and norm() disagreed about the
    same string ("1,000 g" was 1.0 here and 1000 there). It costs coverage
    rather than correctness, which is why nothing reported it.
    """
    n = nums(re.sub(r"(?<=\d),(?=\d{3}(?!\d))", "", plain(s)))
    return float(n[0]) if n else None


def expr_value(s):
    """an option that IS a sum: "8 x 50" -> 400. None if it is not one.

    Stage 4 asks "16 x 25 is the same as:" and offers arithmetic as the
    options, so the comparison is between two VALUES rather than two strings -
    amount() would read "8 x 50" as 8 and pick the wrong one.
    """
    t = plain(s).replace("×", "*").replace("÷", "/").replace("−", "-")
    m = re.fullmatch(r"\s*(-?[\d,]+)\s*([+\-*/])\s*([\d,]+)\s*", t)
    if not m:
        return None
    a, op, b = (int(m.group(1).replace(",", "")), m.group(2),
                int(m.group(3).replace(",", "")))
    if op == "+":
        return float(a + b)
    if op == "-":
        return float(a - b)
    if op == "*":
        return float(a * b)
    return float(a) / b if b else None


_ONES = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
         "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
         "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
         "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
         "nineteen": 19}
_TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
         "seventy": 70, "eighty": 80, "ninety": 90}


def words_to_int(s):
    """"Four thousand two hundred and seven" -> 4207. None if it is not a number.

    THE OPTIONS ARE PARSED RATHER THAN THE ANSWER SPELLED. Generating one
    canonical spelling and comparing strings would fail on every choice the
    content is free to make - "and" or no "and", a hyphen in "twenty-seven",
    a capital - and each of those would report a correct key as wrong.
    """
    t = plain(s).lower().replace("-", " ").replace(",", " ")
    words = [w for w in re.findall(r"[a-z]+", t) if w != "and"]
    if not words or any(w not in _ONES and w not in _TENS and
                        w not in ("hundred", "thousand", "million") for w in words):
        return None
    total = run = 0
    for w in words:
        if w in _ONES:
            run += _ONES[w]
        elif w in _TENS:
            run += _TENS[w]
        elif w == "hundred":
            run = (run or 1) * 100
        else:
            total += (run or 1) * (1000 if w == "thousand" else 1000000)
            run = 0
    return total + run


def minutes_of(s):
    """an option read as a number of MINUTES, however it is spelled.

    "45 minutes", "2 h 25 min", "1 hour 45 min", "2 hours" all resolve; a
    string with no time in it does not, so an option list of something else
    simply fails to match rather than matching by accident.
    """
    t = plain(s).lower()
    total, seen = 0, False
    m = re.search(r"(\d+)\s*(?:h\b|hours?\b)", t)
    if m:
        total, seen = total + int(m.group(1)) * 60, True
    m = re.search(r"(\d+)\s*(?:min\b|mins\b|minutes?\b)", t)
    if m:
        total, seen = total + int(m.group(1)), True
    if seen:
        return float(total)
    return None


def money_answer(low, opts):
    """what the shopping arithmetic makes true, named by one of the options."""
    money = lambda o: amount(o)

    if re.search(r"how many cents? (?:make|are in|in)\b.*\bone shilling", low):
        return pick(opts, 100.0, money)
    m = re.search(r"(\d+) cents? written in shillings", low)
    if m:
        # mixed units: the option must carry BOTH figures, in order
        n = int(m.group(1))
        want = [n // 100, n % 100]
        hit = [o for o in opts if nums(plain(o)) == want]
        return hit[0] if len(hit) == 1 else None
    # a purse read out: "A 50 and a 20 and a 10. How much altogether?"
    if re.search(r"how much altogether|how much is that|how much in all", low):
        coins = re.findall(r"\ba (\d+)\b", low)
        if len(coins) >= 2:
            return pick(opts, float(sum(int(c) for c in coins)), money)
    # two prices and a total
    m = re.search(r"(\d+) sh\b.*?\band\b.*?(\d+) sh\b.*\b(?:total|altogether)", low)
    if m:
        return pick(opts, float(int(m.group(1)) + int(m.group(2))), money)
    # change from what you paid
    m = re.search(r"costs? (\d+).*you pay (\d+).*change", low)
    if m:
        return pick(opts, float(int(m.group(2)) - int(m.group(1))), money)
    # what is left after spending
    m = re.search(r"have (\d+).*spend (\d+).*(?:left|remain)", low)
    if m:
        return pick(opts, float(int(m.group(1)) - int(m.group(2))), money)
    # unit cost
    m = re.search(r"(\d+) \w+ for (\d+).*what does one cost", low)
    if m:
        n, tot = int(m.group(1)), int(m.group(2))
        return pick(opts, tot / n, money) if n and tot % n == 0 else None
    # repeated saving
    # \2, not \3 - the backreference must name the PERIOD ("week"), and group 3
    # is the count. Written as \3 it asked for "after 4 4s" and never fired.
    m = re.search(r"save (\d+) \w+ a (week|day|month).*after (\d+) \2s", low)
    if m:
        return pick(opts, float(int(m.group(1)) * int(m.group(3))), money)
    # FEWEST PIECES: every option is a way of making the amount, so the
    # question is answered by counting the pieces in each and taking the
    # smallest - but only among the ones that really do make it.
    m = re.search(r"fewest (?:pieces|coins|notes) for (\d+)", low)
    if m:
        target, made = int(m.group(1)), []
        for o in opts:
            txt = plain(o).replace("×", "*").replace("x", "*")
            mm = re.fullmatch(r"\s*(\d+)\s*\*\s*(\d+)\s*", txt)
            if mm:
                a, b = int(mm.group(1)), int(mm.group(2))
                pieces, total = b, a * b
            elif re.fullmatch(r"[\d\s+]+", txt):
                parts = [int(x) for x in re.findall(r"\d+", txt)]
                pieces, total = len(parts), sum(parts)
            else:
                continue
            if total == target:
                made.append((pieces, o))
        if made:
            made.sort()
            if len(made) == 1 or made[0][0] < made[1][0]:
                return made[0][1]
    # which side is worth more, each side written as a sum
    m = re.search(r"which is worth more:?\s*(.+?),?\s*\bor\b\s*(.+)", low)
    if m:
        a = sum(int(x) for x in re.findall(r"(\d+)\s*sh", m.group(1))) or None
        b = sum(int(x) for x in re.findall(r"(\d+)\s*sh", m.group(2))) or None
        if a and b and a != b:
            return pick(opts, float(max(a, b)), money)
    return None


def fraction_answer(low, opts):
    """what the fraction arithmetic makes true, named by one of the options."""
    if re.search(r"how many (\w+) make (?:one|1|a) whole", low):
        w = re.search(r"how many (\w+) make", low).group(1)
        if w in FRACWORD:
            return pick(opts, float(FRACWORD[w]), lambda o: amount(o))
    # "5 quarters is the same as..."
    m = re.search(r"(\d+) (\w+) is the same as", low)
    if m and m.group(2) in FRACWORD:
        return pick(opts, int(m.group(1)) / FRACWORD[m.group(2)], fval)
    # "Which is the same as 1/2?"
    m = re.search(r"which is the same as (\d+\s*/\s*\d+)", low)
    if m:
        return pick(opts, fval(m.group(1)), fval)
    # "Which is bigger: 3/4 or 2/4?"
    # "1/2 is the same as which fraction?" - the same question the other way up
    m = re.search(r"(\d+\s*/\s*\d+) is the same as which fraction", low)
    if m:
        return pick(opts, fval(m.group(1)), fval)
    # a comma may stand where the colon does: "Which is bigger, 1/4 or 1/10?"
    m = re.search(r"which is (bigger|larger|smaller|less)[:,]?\s*(\d+\s*/\s*\d+)\s*or\s*(\d+\s*/\s*\d+)", low)
    if m:
        a, b = fval(m.group(2)), fval(m.group(3))
        if a is not None and b is not None and a != b:
            want = max(a, b) if m.group(1) in ("bigger", "larger") else min(a, b)
            return pick(opts, want, fval)
    # "1/4 + 2/4 = ?" - the value is picked out of the options, so a lesson
    # keying 2/4 and a lesson keying 1/2 are both answered correctly
    m = re.search(r"(\d+\s*/\s*\d+)\s*([+\-])\s*(\d+\s*/\s*\d+)\s*=\s*\?", low)
    if m:
        a, b = fval(m.group(1)), fval(m.group(3))
        if a is not None and b is not None:
            return pick(opts, a + b if m.group(2) == "+" else a - b, fval)
    # A FRACTION OF A QUANTITY, IN A WORD PROBLEM. "A quarter of 12" is
    # handled by the ladder; these name the quantity in one sentence and the
    # fraction in the next - "Amina has 20 shillings and spends a quarter",
    # "A class has 24 learners. Three quarters walk to school" - which is the
    # form Grade 2 actually asks and no rule read. The quantity must be the
    # ONLY number in the question, so nothing here guesses which one to divide.
    m = re.search(r"\b(?:has|holds|is|reads|of)\s+(?:a\s+)?(\d+)[\s\w]*?\b"
                  r"(?:.*?\b(\w+)\s+(halves|thirds|quarters|fifths|tenths)\b"
                  r"|.*?\ba (half|third|quarter|fifth|tenth)\b)", low)
    if m and re.search(r"how (?:many|much)", low):
        n = int(m.group(1))
        if m.group(3):                                   # "three quarters"
            k, d = norm(m.group(2)), FRACWORD[m.group(3)]
        else:                                            # "a quarter"
            k, d = 1, FRACWORD[m.group(4)]
        if isinstance(k, int) and d and n % d == 0 and len(nums(low)) == 1:
            want = float(n // d * k)
            got = pick(opts, want, lambda o: amount(o))
            if got is not None:
                return got
    # the same, with the fraction written in figures: "1/4 of a 20 page book"
    m = re.search(r"(\d+)\s*/\s*(\d+) of an? (\d+)", low)
    if m and re.search(r"how (?:many|much)", low):
        k, d, n = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if d and n % d == 0:
            return pick(opts, float(n // d * k), lambda o: amount(o))
    # a fraction of a UNIT quantity, where the answer changes unit
    m = re.search(r"holds (\d+) (\w+).*?\b(?:drinks|pours|uses|takes) (?:an?\s+)?"
                  r"(half|third|quarter|fifth|tenth).*how many (\w+) are left", low)
    if m:
        whole, unit, frac, want_unit = m.groups()
        base = measure("%s %s" % (whole, unit))
        one = measure("1 %s" % want_unit)
        if base and one and one[1] and base[0] == one[0]:
            total = base[1] / one[1]
            left = total * (1 - 1.0 / FRACWORD[frac])
            return pick(opts, left, lambda o: amount(o))
    # how much of a whole is LEFT after some equal pieces go
    m = re.search(r"cut into (\d+) equal (?:slices|pieces|parts)\.\s*\w+ (?:eats|takes) (\w+)\.", low)
    if m:
        d = int(m.group(1))
        gone = norm(m.group(2))
        if isinstance(gone, int) and 0 <= gone <= d:
            kept = re.search(r"what fraction (?:is left|remains)", low)
            return pick(opts, (d - gone) / d if kept else gone / d, fval)
    m = re.search(r"cut into (\d+) equal (?:slices|pieces|parts)\.\s*(\w+) (?:is|are) eaten", low)
    if m:
        d, gone = int(m.group(1)), norm(m.group(2))
        if isinstance(gone, int) and 0 <= gone <= d:
            return pick(opts, (d - gone) / d, fval)
    # fractions written in WORDS, which is how Stage 4 asks them
    m = re.search(r"which is the bigger piece,? an? (\w+) or an? (\w+) of the same", low)
    if m and m.group(1) in FRACWORD and m.group(2) in FRACWORD:
        a, b = 1.0 / FRACWORD[m.group(1)], 1.0 / FRACWORD[m.group(2)]
        if a != b:
            want = m.group(1) if a > b else m.group(2)
            hit = [o for o in opts if re.search(r"\b" + want + r"\b", norm(o))]
            return hit[0] if len(hit) == 1 else None
    m = re.search(r"what is (\w+) (\w+) add (\w+) (\w+)", low)
    if m and m.group(2).rstrip("s") + "s" in FRACWORD and isinstance(norm(m.group(1)), int):
        d = FRACWORD[m.group(2).rstrip("s") + "s"]
        n1, n3 = norm(m.group(1)), norm(m.group(3))
        if isinstance(n3, int) and m.group(4).rstrip("s") == m.group(2).rstrip("s"):
            return pick(opts, (n1 + n3) / d, lambda o: fval(o) if fval(o) is not None
                        else (norm(o) if isinstance(norm(o), float) else None))
    # N things shared between M, answered as a fraction
    m = re.search(r"(\w+) \w+ shared fairly between (\w+)", low)
    if m and isinstance(norm(m.group(1)), int) and isinstance(norm(m.group(2)), int):
        n, k = norm(m.group(1)), norm(m.group(2))
        if k:
            return pick(opts, n / k, fval)
    m = re.search(r"which fraction is equivalent to (\w+) (\w+)", low)
    if m and m.group(2).rstrip("s") + "s" in FRACWORD and isinstance(norm(m.group(1)), int):
        return pick(opts, norm(m.group(1)) / FRACWORD[m.group(2).rstrip("s") + "s"], fval)
    # a hundred square IS the percentage
    m = re.search(r"(\d+) squares? of a hundred square (?:is|are) shaded.*percentage", low)
    if m:
        return pick(opts, float(m.group(1)), lambda o: amount(o))
    # which comparison sign belongs between two fractions in words
    m = re.search(r"which sign belongs between (\w+) (\w+) and (\w+) (\w+)", low)
    if m:
        def wordfrac(a, b):
            b = b.rstrip("s") + "s"
            n = norm(a)
            return n / FRACWORD[b] if b in FRACWORD and isinstance(n, int) else None
        a, b = wordfrac(m.group(1), m.group(2)), wordfrac(m.group(3), m.group(4))
        if a is not None and b is not None and a != b:
            want = "<" if a < b else ">"
            hit = [o for o in opts if norm(o) == want]
            return hit[0] if len(hit) == 1 else None
    # THE ODD ONE OUT. "Half of a hundred square is shaded. Which of these is
    # NOT another name for it?" is answered by the option that does NOT equal
    # the value - so the derivation is the same one, read the other way. It
    # needs exactly one mismatch, or the question has more than one answer.
    m = re.search(r"(half|a half|third|quarter|fifth|tenth) of a hundred square is shaded"
                  r".*which of these is not another name", low)
    if m:
        want = 1.0 / FRACWORD[m.group(1).replace("a ", "")]
        odd = [o for o in opts if fval(o) is not None and abs(fval(o) - want) > 1e-9]
        unreadable = [o for o in opts if fval(o) is None]
        if len(odd) == 1 and not unreadable:
            return odd[0]
    # equal parts are what make a fraction; unequal pieces make none
    if re.search(r"different sizes.*is one piece a (\w+)", low):
        hit = [o for o in opts if norm(o) in ("no", "not a quarter", "none")]
        return hit[0] if len(hit) == 1 else None
    return None


# ---------------------------------------------------------------------------
# Measures, clocks, turns, patterns and charts. Same contract as money and
# fractions above: derive the VALUE, then return the option that carries it,
# because "500 ml" and "2 hours" normalise as strings and a bare number would
# report a correct key as wrong.
# BOTH THE SYMBOL AND THE WORD. The options say "900 g" and the questions say
# "How many grams are in 1 kilogram?", so a table of symbols alone answers the
# comparisons and silently declines every conversion question.
SCALES = {                                   # quantity -> unit -> size in a base
    "length": {"mm": 1, "millimetre": 1, "millimetres": 1,
               "cm": 10, "centimetre": 10, "centimetres": 10,
               "m": 1000, "metre": 1000, "metres": 1000,
               "km": 1000000, "kilometre": 1000000, "kilometres": 1000000},
    "mass": {"g": 1, "gram": 1, "grams": 1,
             "kg": 1000, "kilogram": 1000, "kilograms": 1000},
    "capacity": {"ml": 1, "millilitre": 1, "millilitres": 1,
                 "l": 1000, "litre": 1000, "litres": 1000},
    "time": {"second": 1, "seconds": 1, "minute": 60, "minutes": 60,
             "hour": 3600, "hours": 3600, "day": 86400, "days": 86400,
             "week": 604800, "weeks": 604800},
}
HEAVIER = {"heavier": "mass", "lighter": "mass", "longer": "length",
           "shorter": "length", "taller": "length", "holds more": "capacity"}


def measure(s):
    """(quantity, size) for "900 g", "1 kg", "half a litre", or None."""
    t = plain(s).lower().strip()
    m = re.fullmatch(r"(?:(\d+(?:\.\d+)?)\s*|(half|a quarter of)\s+an?\s+)([a-z]+)", t)
    if not m:
        return None
    unit = m.group(3)
    for q, table in SCALES.items():
        if unit in table:
            n = (float(m.group(1)) if m.group(1)
                 else 0.5 if m.group(2) == "half" else 0.25)
            return q, n * table[unit]
    return None


def units_answer(low, opts):
    """conversions and comparisons between units."""
    # "How many grams are in 1 kilogram?", "How many minutes in half an hour?"
    m = re.search(r"how many (\w+) (?:are )?in (?:(\d+)|half an?|an?|one)\s*(\w+)", low)
    if m:
        small, big = m.group(1), m.group(3)
        n = float(m.group(2)) if m.group(2) else (0.5 if "half" in m.group(0) else 1.0)
        for table in SCALES.values():
            if small in table and big in table and table[small]:
                v = n * table[big] / table[small]
                if v == int(v):
                    return pick(opts, float(int(v)), lambda o: amount(o)) or int(v)
        return None
    # "How many minutes in quarter of an hour?", and the same conversion asked
    # the other way round - "Three quarters of an hour is how many minutes?".
    # Only "half an hour" was ever read.
    small = frac = big = None
    parts = 1
    m = re.search(r"how many (\w+) in (?:an? )?(half|third|quarter|fifth|tenth)"
                  r" (?:of )?an? (\w+)", low)
    if m:
        small, frac, big = m.group(1), m.group(2), m.group(3)
    else:
        m = re.search(r"(\w+) (halves|thirds|quarters|fifths|tenths) of an? (\w+)"
                      r" is how many (\w+)", low)
        if m and isinstance(norm(m.group(1)), int):
            parts, big, small = norm(m.group(1)), m.group(3), m.group(4)
            frac = m.group(2)
    if small and frac in FRACWORD:
        for table in SCALES.values():
            if small in table and big in table and table[small]:
                v = table[big] / table[small] / FRACWORD[frac] * parts
                if v == int(v):
                    return pick(opts, float(int(v)), lambda o: amount(o)) or int(v)
        return None
    # "Half a litre is..." - the option carries the unit, so compare sizes
    m = re.search(r"^(half an? \w+|a quarter of an? \w+) is", low)
    if m:
        got = measure(m.group(1))
        if got:
            return pick(opts, got[1], lambda o: (measure(o) or (None, None))[1])
    # "Which is heavier: 1 kg or 900 g?"
    m = re.search(r"which is (heavier|lighter|longer|shorter|taller):?\s*(.+?)\s+or\s+(.+?)\??$", low)
    if m and m.group(1) in HEAVIER:
        a, b = measure(m.group(2)), measure(m.group(3))
        if a and b and a[0] == b[0] and a[1] != b[1]:
            big = m.group(1) in ("heavier", "longer", "taller")
            return pick(opts, max(a[1], b[1]) if big else min(a[1], b[1]),
                        lambda o: (measure(o) or (None, None))[1])
    # a length read off a ruler is a DIFFERENCE, not the far end
    m = re.search(r"from (\d+) (\w+) to (\d+) \2 on a ruler.*how long", low)
    if m:
        return pick(opts, float(int(m.group(3)) - int(m.group(1))), lambda o: amount(o))
    # a duration between two clock times
    m = re.search(r"starts at (\d+):(\d+).*ends at (\d+):(\d+).*how long", low)
    if m:
        a = int(m.group(1)) * 60 + int(m.group(2))
        b = int(m.group(3)) * 60 + int(m.group(4))
        if b > a and (b - a) % 60 == 0:
            return pick(opts, float((b - a) // 60), lambda o: amount(o))
    return None


CLOCKFACE = {12: "o'clock", 6: "half past", 3: "quarter past", 9: "quarter to"}


def clock_answer(low, opts):
    """what the hands say, and the same time written the other way."""
    if re.search(r"which hand shows the hour", low):
        hit = [o for o in opts if "short" in norm(o)]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"long hand points to (\d+)\. that is", low)
    if m and int(m.group(1)) in CLOCKFACE:
        want = CLOCKFACE[int(m.group(1))]
        hit = [o for o in opts if norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    # "Quarter to 5 is the same as..." -> 4:45
    m = re.search(r"(quarter to|quarter past|half past) (\d+) is the same as", low)
    if m:
        h, kind = int(m.group(2)), m.group(1)
        h24, mins = (h - 1 if h > 1 else 12, 45) if kind == "quarter to" else (h, 15 if kind == "quarter past" else 30)
        want = "%d:%02d" % (h24, mins)
        hit = [o for o in opts if norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    # "What is 3:20 in words?"
    m = re.search(r"what is (\d+):(\d+) in words", low)
    if m:
        h, mins = int(m.group(1)), int(m.group(2))
        inw = {v: k for k, v in WORD.items()}
        if mins == 0:
            want = "%s o'clock" % inw.get(h, h)
        elif mins <= 30:
            want = "%s past %s" % (inw.get(mins, mins), inw.get(h, h))
        else:
            nxt = h + 1 if h < 12 else 1
            want = "%s to %s" % (inw.get(60 - mins, 60 - mins), inw.get(nxt, nxt))
        hit = [o for o in opts if norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    # the same weekday a whole number of weeks later
    m = re.search(r"the (\d+)(?:st|nd|rd|th) of \w+ is an? (\w+)\. what day is the (\d+)", low)
    if m and m.group(2) in DAYS:
        step = int(m.group(3)) - int(m.group(1))
        return DAYS[(DAYS.index(m.group(2)) + step) % 7]
    return None


FACING = ["up", "right", "down", "left"]      # clockwise
PAGE = {"top": "up", "bottom": "down", "right": "right", "left": "left"}
TURNS = {"quarter": 1, "half": 2, "three-quarter": 3, "whole": 4, "full": 4}
TURNNAME = {0: "no turn", 1: "a quarter turn", 2: "a half turn",
            3: "a three-quarter turn", 4: "a full turn"}


def turn_answer(low, opts):
    """turns compose, and a turn from a heading gives a heading."""
    # "Two quarter turns the same way make..."
    m = re.search(r"(\w+) (quarter|half|three-quarter) turns the same way make", low)
    if m and isinstance(norm(m.group(1)), int):
        q = norm(m.group(1)) * TURNS[m.group(2)]
        want = TURNNAME.get(q % 4 or 4)
        hit = [o for o in opts if norm(o).replace("whole", "full") == want]
        return hit[0] if len(hit) == 1 else None
    # "Facing up, you make a half turn. Now you face..."
    m = re.search(r"facing (\w+),? you make a (quarter|half|three-quarter) turn", low)
    if m and m.group(1) in FACING:
        i = (FACING.index(m.group(1)) + TURNS[m.group(2)]) % 4
        hit = [o for o in opts if norm(o) == FACING[i]]
        return hit[0] if len(hit) == 1 else None
    # "The robot faces the top of the page and turns right. It now faces..."
    m = re.search(r"faces the (\w+) of the page and turns (right|left)", low)
    if m and m.group(1) in PAGE:
        i = (FACING.index(PAGE[m.group(1)]) + (1 if m.group(2) == "right" else -1)) % 4
        side = [k for k, v in PAGE.items() if v == FACING[i]]
        hit = [o for o in opts if side and side[0] in norm(o)]
        return hit[0] if len(hit) == 1 else None
    return None


def period_of(seq):
    """the shortest repeat length, or None if the run does not repeat."""
    for p in range(1, len(seq) // 2 + 1):
        if all(seq[i] == seq[i - p] for i in range(p, len(seq))):
            return p
    return None


def pattern_answer(low, t, opts):
    """repeats, rules, nth terms and membership."""
    # "In the pattern ABB ABB ABB, how long is the part that repeats?" - read
    # from `t`, not `low`, because the letters ARE the data and lowercasing
    # them would merge A with a; matched case-insensitively so the capital at
    # the start of the sentence does not stop it.
    m = re.search(r"in the pattern ([A-Za-z ]+?), how long is the part that repeats",
                  plain(t), re.I)
    if m:
        p = period_of(m.group(1).replace(" ", ""))
        return p if p else None
    # a word run: "Circle, square, circle, square, circle... what comes next?"
    m = re.search(r"^([a-z]+(?:,\s*[a-z]+){2,})\s*(?:\.{2,}|…)\s*what comes next", low)
    if m:
        seq = [w.strip() for w in m.group(1).split(",")]
        p = period_of(seq)
        return seq[len(seq) - p] if p else None
    # "4, 7, 10, 13... what is the rule?"
    m = re.search(r"((?:\d+\s*,\s*){2,}\d+)\s*(?:\.{2,}|…)\s*what is the rule", t)
    if m:
        seq = nums(m.group(1))
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        if len(d) == 1:
            step = d.pop()
            want = ("add %d" if step > 0 else "subtract %d") % abs(step)
            hit = [o for o in opts if norm(o) == want]
            return hit[0] if len(hit) == 1 else None
    # "Pattern 1 has 3 blocks and each adds 2. Pattern 5 has..."
    m = re.search(r"pattern (\d+) has (\d+) \w+ and each adds (\d+)\. pattern (\d+) has", low)
    if m:
        start, first, step, want = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
        return first + step * (want - start)
    # "A growing pattern goes 1, 4, 7, 10. Is 15 in it?"
    m = re.search(r"growing pattern goes ((?:\d+\s*,\s*)+\d+)\.\s*is (\d+) in it", low)
    if m:
        seq, n = nums(m.group(1)), int(m.group(2))
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        if len(d) == 1:
            step = d.pop()
            inside = step and n >= seq[0] and (n - seq[0]) % step == 0
            hit = [o for o in opts if norm(o) == ("yes" if inside else "no")]
            return hit[0] if len(hit) == 1 else None
    # "Which is a repeating pattern?" - the options are the evidence
    if re.search(r"which is a repeating pattern", low):
        hit = []
        for o in opts:
            toks = [x for x in re.split(r"[,\s]+", plain(o)) if x]
            if len(toks) >= 3 and period_of(toks):
                hit.append(o)
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"from pattern (\d+) to pattern (\d+), how many jumps", low)
    if m:
        return int(m.group(2)) - int(m.group(1))
    return None


LIKELIHOOD = {"definitely happen": "certain", "never happen": "impossible",
              "certainly happen": "certain"}


def chart_answer(low, opts):
    """tallies, keys, steps and the likelihood words."""
    if re.search(r"in a tally.*crossed through stand for", low):
        return pick(opts, 5.0, lambda o: amount(o)) or 5
    # a pictogram or bar KEY multiplies; the pictures are never the quantity
    m = re.search(r"one \S+ = (\d+).*how many \w+ do (\d+) pictures show", low)
    if m:
        return pick(opts, float(int(m.group(1)) * int(m.group(2))), lambda o: amount(o))
    m = re.search(r"each step is (\d+).*reaching the (\d+)(?:st|nd|rd|th) step", low)
    if m:
        return pick(opts, float(int(m.group(1)) * int(m.group(2))), lambda o: amount(o))
    m = re.search(r"bar chart shows ((?:\d+[,\s]+)+(?:and\s+)?\d+).*how many altogether", low)
    if m:
        return pick(opts, float(sum(nums(m.group(1)))), lambda o: amount(o))
    # "A bag has 8 red and 1 blue. Which are you most likely to pull out?"
    m = re.search(r"has (\d+) (\w+) and (\d+) (\w+).*most likely", low)
    if m:
        a, b = int(m.group(1)), int(m.group(3))
        if a != b:
            want = m.group(2) if a > b else m.group(4)
            hit = [o for o in opts if norm(o) == want]
            return hit[0] if len(hit) == 1 else None
    for phrase, word in LIKELIHOOD.items():
        if re.search(r"which word means it will " + phrase, low):
            hit = [o for o in opts if norm(o) == word]
            return hit[0] if len(hit) == 1 else None
    if re.search(r"fair coin, heads is", low):
        hit = [o for o in opts if re.search(r"even chance|equally likely|fifty", norm(o))]
        return hit[0] if len(hit) == 1 else None
    # equal shares of a spinner make a fair game
    m = re.search(r"spinner is half (\w+), half (\w+).*game on \1 or \2 is", low)
    if m:
        hit = [o for o in opts if norm(o) == "fair"]
        return hit[0] if len(hit) == 1 else None
    # a spinner split into named fractions: the biggest share comes up most
    if re.search(r"spinner is .*which colou?r comes up most", low):
        share = {}
        for f, c in re.findall(r"an? (half|third|quarter|fifth|tenth) (\w+)", low):
            share[c] = share.get(c, 0) + 1.0 / FRACWORD[f]
        for f, c in re.findall(r"\b(half) (\w+)", low):
            share.setdefault(c, 0.5)
        if len(share) > 1:
            top = max(share.values())
            win = [c for c, v in share.items() if v == top]
            if len(win) == 1:
                hit = [o for o in opts if norm(o) == win[0]]
                return hit[0] if len(hit) == 1 else None
    # A CARROLL BOX IS TWO CONDITIONS, so the option that satisfies both is the
    # answer - read from the numbers rather than from the wording.
    m = re.search(r"carroll diagram box says '(not )?even' and '(not )?more than (\d+)'", low)
    if m:
        want_even, want_more, n = not m.group(1), not m.group(2), int(m.group(3))
        hit = []
        for o in opts:
            v = norm(o)
            if isinstance(v, int) and (v % 2 == 0) == want_even and (v > n) == want_more:
                hit.append(o)
        return hit[0] if len(hit) == 1 else None
    # BOTH CONDITIONS TRUE MEANS THE OVERLAP OF TWO RINGS. The filter said
    # "middle|overlap|both", and bare "both" also matched the DISTRACTOR
    # "outside both hoops" - so two options matched, the rule declined, and it
    # read as a question nothing could answer rather than as a filter that was
    # too loose. "in both" is the wording that means the overlap; "outside
    # both" is its opposite and must not match it.
    if re.search(r"both .* and .* go on a venn diagram", low) or \
       re.search(r"both\b.*\band\b.*venn", low):
        hit = [o for o in opts if re.search(r"middle|overlap|in both", str(norm(o)))]
        return hit[0] if len(hit) == 1 else None
    # a tally's crossing line, asked the other way round
    if re.search(r"tally.*line drawn across four marks", low):
        return pick(opts, 5.0, lambda o: amount(o)) or 5
    # a pictogram key, both directions
    m = re.search(r"one picture (?:=|stands for) (\d+) \w+.*how many is half a picture", low)
    if m and int(m.group(1)) % 2 == 0:
        return pick(opts, float(int(m.group(1)) // 2), lambda o: amount(o))
    m = re.search(r"one picture (?:=|stands for) (\d+) (\w+).*how many pictures show (\d+)", low)
    if m:
        per, n = int(m.group(1)), int(m.group(3))
        if per:
            want = n / per
            return pick(opts, want, lambda o: fval(o) if fval(o) is not None
                        else (float(norm(o)) if isinstance(norm(o), int) else None))
    # LIKELIHOOD FROM THE NUMBERS, not from the wording. An outcome the dice
    # cannot show is impossible; a 9-in-10 draw is likely.
    m = re.search(r"(?:rolling a|how likely is a) (\d+).*?(\w+)-sided dice|dice.*how likely is a (\d+)", low)
    if m:
        face = int(m.group(1) or m.group(3))
        sides = norm(m.group(2)) if m.group(2) else 6
        if not isinstance(sides, int):
            sides = 6
        if face > sides:
            hit = [o for o in opts if re.search(r"impossible|will not happen|cannot happen", norm(o))]
            return hit[0] if len(hit) == 1 else None
    if re.search(r"toss a coin.*how likely is heads", low):
        hit = [o for o in opts if re.search(r"might happen|even chance|equally likely", norm(o))]
        return hit[0] if len(hit) == 1 else None
    # TWO GROUPS OF THE SAME SIZE, so a bigger count is a bigger SHARE and the
    # comparison is the whole answer: "Two classes both have 22 children. 4A
    # walks 9 and 4B walks 5." The equal totals are what make it derivable -
    # the distractor "4A is bigger" is false precisely because they match.
    m = re.search(r"both have (\d+) \w+\.\s*(\w+) \w+ (\d+) and (\w+) \w+ (\d+)", low)
    if m and re.search(r"what can you say", low):
        one, a, two, b = m.group(2), int(m.group(3)), m.group(4), int(m.group(5))
        if a != b:
            win = one if a > b else two
            hit = [o for o in opts if re.search(r"\bmore\b", str(norm(o)))
                   and re.search(r"\b" + re.escape(win) + r"\b", str(norm(o)))]
            return hit[0] if len(hit) == 1 else None
    m = re.search(r"bag holds (\d+) (\w+) counters and (\d+) (\w+).*taking an? \2", low)
    if m:
        a, b = int(m.group(1)), int(m.group(3))
        want = "likely" if a > b else "unlikely" if a < b else "an even chance"
        hit = [o for o in opts if norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    return None


# ---------------------------------------------------------------------------
# STAGE 3 AND 4. Same contract as everything above: derive the value, return
# the option that carries it, decline when more than one does.
COMPASS = ["north", "north-east", "east", "south-east",
           "south", "south-west", "west", "north-west"]
SYMMETRY = {"square": 4, "rectangle": 2, "oblong": 2, "circle": 99,
            "equilateral triangle": 3, "isosceles triangle": 1,
            "parallelogram": 0, "rhombus": 2, "regular pentagon": 5,
            "regular hexagon": 6, "kite": 1, "scalene triangle": 0}
CALENDAR = {("months", "year"): 12, ("days", "week"): 7, ("hours", "day"): 24,
            ("minutes", "hour"): 60, ("seconds", "minute"): 60,
            ("days", "year"): 365, ("weeks", "year"): 52}
MONTHNAMES = ["january", "february", "march", "april", "may", "june", "july",
              "august", "september", "october", "november", "december"]
MONTHLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


COMPASS_ABBR = {"n": "north", "ne": "north-east", "e": "east", "se": "south-east",
                "s": "south", "sw": "south-west", "w": "west", "nw": "north-west"}


def compass_of(s):
    """the 8-point compass bearing named by a string, or None.

    The ABBREVIATIONS are how Grade 4 writes its options - "SW", "SE", "NW" -
    so a reader that only knows the spelled-out names matches none of them.
    """
    t = norm(s)
    if not isinstance(t, str):
        return None
    t = t.replace("northeast", "north-east").replace("southeast", "south-east")
    t = t.replace("southwest", "south-west").replace("northwest", "north-west")
    if t in COMPASS_ABBR:
        return COMPASS_ABBR[t]
    return t if t in COMPASS else None


def stage34_number(low, t, opts):
    """Stage 3-4 arithmetic, place value and number properties."""
    # "What is 347 + 185?" - the ladder above wants a trailing "= ?"
    m = re.search(r"what is\s+(-?\d+)\s*([+\-*/])\s*(\d+)\s*\??$", low)
    if m and len(nums(t)) == 2:
        a, op, b = int(m.group(1)), m.group(2), int(m.group(3))
        if op == "+":
            return a + b
        if op == "-":
            return a - b
        if op == "*":
            return a * b
        if b and a % b == 0:
            return a // b
        # a remainder is written out, so let the options say how
        if b:
            want = "%d r %d" % (a // b, a % b)
            # norm() returns an int for a bare number, so str() first
            hit = [o for o in opts if str(norm(o)).replace("remainder", "r") == want]
            return hit[0] if len(hit) == 1 else None
    # a missing addend behind a shape: "If 38 + ? = 62, what is ?"
    m = re.search(r"if\s+(\d+)\s*\+\s*\W\s*=\s*(\d+)", low)
    if m:
        return int(m.group(2)) - int(m.group(1))
    m = re.search(r"if\s+\W\s*-\s*(\d+)\s*=\s*(\d+)", low)
    if m:
        return int(m.group(1)) + int(m.group(2))
    m = re.search(r"if\s+(\W)\s*\+\s*\1\s*\+\s*\1\s*=\s*(\d+)", low)
    if m and int(m.group(2)) % 3 == 0:
        return int(m.group(2)) // 3
    # what a digit is WORTH: its place value, not the digit
    m = re.search(r"what is the (\d) worth in (\d+)", low)
    if m:
        d, n = m.group(1), m.group(2)
        if n.count(d) == 1:
            return int(d) * 10 ** (len(n) - n.index(d) - 1)
    # negatives: comparison and a fall in temperature
    m = re.search(r"which is (bigger|larger|smaller|colder|warmer),?\s*(-?\d+)\s*(?:or|and)\s*(-?\d+)", low)
    if m:
        a, b = int(m.group(2)), int(m.group(3))
        if a != b:
            return max(a, b) if m.group(1) in ("bigger", "larger", "warmer") else min(a, b)
    m = re.search(r"it is (-?\d+)\s*\W?c and it gets (\d+) degrees (colder|warmer)", low)
    if m:
        a, d = int(m.group(1)), int(m.group(2))
        return a - d if m.group(3) == "colder" else a + d
    # odd/even algebra, which is a property rather than a sum
    m = re.search(r"an odd number (added to|take away|minus|plus) an odd number", low)
    if m:
        hit = [o for o in opts if norm(o) in ("even", "an even number")]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"an odd number (?:added to|plus) an even number", low)
    if m:
        hit = [o for o in opts if norm(o) in ("odd", "an odd number")]
        return hit[0] if len(hit) == 1 else None
    if re.search(r"which of these is a square number", low):
        hit = [o for o in opts if isinstance(norm(o), int)
               and norm(o) >= 0 and int(norm(o) ** 0.5 + 0.5) ** 2 == norm(o)]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"which of these is a factor pair of (\d+)", low)
    if m:
        target, hit = int(m.group(1)), []
        for o in opts:
            f = nums(plain(o))
            if len(f) == 2 and f[0] * f[1] == target:
                hit.append(o)
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"does (\d+) divide exactly by (\d+)", low)
    if m:
        yes = int(m.group(1)) % int(m.group(2)) == 0
        hit = [o for o in opts if norm(o) == ("yes" if yes else "no")]
        return hit[0] if len(hit) == 1 else None
    # "Which list is in order, smallest first?"
    m = re.search(r"which list is in order,?\s*(smallest|largest|biggest) first", low)
    if m:
        want_up = m.group(1) == "smallest"
        hit = []
        for o in opts:
            # SIGNED, because the lesson is about negatives: nums() drops the
            # minus, so "-8, -3, 0, 5" read as 8, 3, 0, 5 and the correctly
            # ordered option looked unsorted.
            txt = plain(o).replace("−", "-").replace(",", " ")
            v = [int(x) for x in re.findall(r"-?\d+", txt)]
            if len(v) >= 3 and v == (sorted(v) if want_up else sorted(v, reverse=True)):
                hit.append(o)
        return hit[0] if len(hit) == 1 else None
    # "Which of these is the same number as 4,208?" - the options are written
    # as PLACE VALUE ("3 thousands, 12 hundreds, 0 tens, 8 ones"), which is the
    # point: the digits need not match, the value must. A "+" was required
    # before, and none of these carry one.
    m = re.search(r"which of these is the same number as (\d+)", low)
    if m:
        target, hit = int(m.group(1)), []
        for o in opts:
            txt = plain(o).lower()
            places = re.findall(r"(\d+)\s+(ten thousands|thousands|hundreds|tens|ones|units)", txt)
            if places:
                if sum(int(n) * PLACE[p] for n, p in places) == target:
                    hit.append(o)
            elif "+" in txt and sum(nums(txt.replace(",", ""))) == target:
                hit.append(o)
        return hit[0] if len(hit) == 1 else None
    # a square grid growing by one on each side
    m = re.search(r"how many dots turn a (\d+) by \1 square into a (\d+) by \2 one", low)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        return b * b - a * a
    # linear or not: a constant step is linear
    m = re.search(r"((?:\d+\s*,\s*){2,}\d+)\s*(?:\.{2,}|…)\s*is this (linear|non-linear)", low)
    if m:
        seq = nums(m.group(1))
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        want = "linear" if len(d) == 1 else "non-linear"
        hit = [o for o in opts if norm(o).replace("nonlinear", "non-linear") == want]
        return hit[0] if len(hit) == 1 else None
    return None


def stage34_shape(low, opts):
    """area, perimeter, symmetry, solids and angles."""
    m = re.search(r"(\d+) squares? wide and (\d+) (?:squares? )?(?:tall|high).*area", low)
    if m:
        return int(m.group(1)) * int(m.group(2))
    m = re.search(r"(\d+) by (\d+).*perimeter", low)
    if m:
        return 2 * (int(m.group(1)) + int(m.group(2)))
    m = re.search(r"(\d+) squares? wide and (\d+) (?:squares? )?(?:tall|high).*perimeter", low)
    if m:
        return 2 * (int(m.group(1)) + int(m.group(2)))
    # lines of symmetry, with the shape named in whatever words the item uses
    if re.search(r"lines of symmetry", low):
        named = [(k, v) for k, v in SYMMETRY.items() if re.search(r"\b" + k + r"\b", low)]
        if named:
            k, v = max(named, key=lambda kv: len(kv[0]))     # prefer the longest name
            if re.search(r"not a square", low) and k == "rectangle":
                pass                                          # the aside confirms it
            return v if v != 99 else None
    # a solid named by more than one word
    m = re.search(r"how many (?:flat )?(faces|edges|corners|vertices) does an? ([\w -]+?) have", low)
    if m:
        want = m.group(1).replace("vertices", "corners")
        for name, (f, e, c) in SOLIDS.items():
            if re.search(r"\b" + name + r"\b", m.group(2)):
                return {"faces": f, "edges": e, "corners": c}[want]
    if re.search(r"two circular faces and a curved surface", low):
        hit = [o for o in opts if re.search(r"\bcylinder\b", str(norm(o)))]
        return hit[0] if len(hit) == 1 else None
    if re.search(r"six squares in a cross fold up", low):
        hit = [o for o in opts if re.search(r"\bcube\b", str(norm(o)))]
        return hit[0] if len(hit) == 1 else None
    # right angles make a straight line, and a quarter turn is one of them
    m = re.search(r"how many right angles make a (straight line|full turn|whole turn)", low)
    if m:
        return 2 if m.group(1) == "straight line" else 4
    # A RADIUS IS THE SAME ALL THE WAY ROUND - that is what makes it a circle,
    # so the distance asked for is the distance given.
    m = re.search(r"edge of a circle is (\d+) (\w+) from the centre.*how far", low)
    if m:
        return pick(opts, float(m.group(1)), lambda o: amount(o))
    if re.search(r"what do we call the middle point of a circle", low):
        hit = [o for o in opts if "centre" in str(norm(o)) or "center" in str(norm(o))]
        return hit[0] if len(hit) == 1 else None
    # counting the squares a shape covers is what AREA means
    if re.search(r"covers \d+ squares on a grid.*what is that called", low):
        hit = [o for o in opts if norm(o) in ("area", "its area", "the area")]
        return hit[0] if len(hit) == 1 else None
    # a reflection is congruent
    # A REFLECTION IS CONGRUENT AND EQUIDISTANT - two properties, and the
    # OPTIONS say which one is being asked. The rule read only "what happens to
    # its size", so the same fact worded as "the reflection is..." went
    # unverified, and the equidistance half was not stated at all. Branching on
    # the options rather than on the phrasing is what makes this one rule
    # instead of a list of sentences.
    if re.search(r"\breflect(?:ion|ed)\b", low):
        if any(re.search(r"\bsize\b|bigger|smaller|doubles|halves", str(norm(o))) for o in opts):
            hit = [o for o in opts
                   if re.search(r"stays the same|same size|does not change|unchanged", str(norm(o)))]
        elif any(re.search(r"distance|further|nearer", str(norm(o))) for o in opts):
            hit = [o for o in opts if re.search(r"same distance", str(norm(o)))]
        else:
            hit = []
        if len(hit) == 1:
            return hit[0]
    if re.search(r"look different but each has half shaded.*is the shaded amount the same", low):
        hit = [o for o in opts if norm(o) in ("yes", 1) or str(norm(o)).startswith("yes")]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"an angle of (\d+)", low)
    if m:
        a = int(m.group(1))
        want = ("acute" if a < 90 else "a right angle" if a == 90
                else "obtuse" if a < 180 else "reflex")
        hit = [o for o in opts if want in norm(o)]
        return hit[0] if len(hit) == 1 else None
    # a scale divided into equal parts
    m = re.search(r"marked every (\d+) (\w+) with (\w+) small marks between.*one small (?:mark|step)", low)
    if m and isinstance(norm(m.group(3)), int):
        step, parts = int(m.group(1)), norm(m.group(3)) + 1
        if step % parts == 0:
            return pick(opts, float(step // parts), lambda o: amount(o)) or step // parts
    return None


def stage34_place(low, opts):
    """the compass, coordinates and turns at Stage 3-4."""
    m = re.search(r"opposite of (\w+(?:-\w+)?)", low)
    c = compass_of(m.group(1)) if m else None
    if c:
        return COMPASS[(COMPASS.index(c) + 4) % 8]
    m = re.search(r"fac(?:ing|e) (\w+(?:-\w+)?)[, ].*(quarter|half) turn (clockwise|anticlockwise|to your right|to your left|right|left)", low)
    if not m:
        m = re.search(r"fac(?:ing|e) (\w+(?:-\w+)?) and you turn to your (right|left)", low)
        if m:
            c = compass_of(m.group(1))
            if c:
                step = 2 if m.group(2) == "right" else -2
                return COMPASS[(COMPASS.index(c) + step) % 8]
    else:
        c = compass_of(m.group(1))
        if c:
            quarters = 1 if m.group(2) == "quarter" else 2
            back = m.group(3) in ("anticlockwise", "to your left", "left")
            step = quarters * 2 * (-1 if back else 1)
            return COMPASS[(COMPASS.index(c) + step) % 8]
    m = re.search(r"which point lies between (\w+) and (\w+)", low)
    if m:
        a, b = compass_of(m.group(1)), compass_of(m.group(2))
        if a and b:
            ia, ib = COMPASS.index(a), COMPASS.index(b)
            mid = COMPASS[(ia + ((ib - ia) % 8) // 2) % 8]
            hit = [o for o in opts if compass_of(o) == mid]
            return hit[0] if len(hit) == 1 else None
    if re.search(r"ordinal point of the compass", low):
        hit = [o for o in opts if compass_of(o) in COMPASS[1::2]]
        return hit[0] if len(hit) == 1 else None
    # coordinates
    m = re.search(r"in the coordinates \((\d+),\s*(\d+)\), what does the (\d+) tell you", low)
    if m:
        which = r"across|along" if m.group(3) == m.group(1) else r"\bup\b"
        hit = [o for o in opts if re.search(which, str(norm(o)))]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"is \((\d+),\s*(\d+)\) the same place as \((\d+),\s*(\d+)\)", low)
    if m:
        same_pt = (m.group(1), m.group(2)) == (m.group(3), m.group(4))
        hit = [o for o in opts if norm(o) == ("yes" if same_pt else "no")]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"go (\d+) (east|west|north|south) then (\d+) (east|west|north|south).*how far (east|west|north|south)", low)
    if m:
        legs = {m.group(2): int(m.group(1)), m.group(4): int(m.group(3))}
        return legs.get(m.group(5))
    # THE OTHER TWO CORNERS OF AN AXIS-ALIGNED RECTANGLE are the two mixed
    # pairs: opposite corners (1,1) and (4,3) give (4,1) and (1,3).
    m = re.search(r"rectangle has corners at \((\d+),\s*(\d+)\) and \((\d+),\s*(\d+)\)"
                  r".*what are the other two", low)
    if m:
        x1, y1, x2, y2 = (int(g) for g in m.groups())
        want = {(x2, y1), (x1, y2)}
        hit = []
        for o in opts:
            pts = {(int(a), int(b)) for a, b in re.findall(r"\((\d+),\s*(\d+)\)", plain(o))}
            if pts == want:
                hit.append(o)
        return hit[0] if len(hit) == 1 else None
    return None


def stage34_time(low, opts):
    """24-hour time, durations in hours and minutes, and the calendar."""
    m = re.search(r"how many (\w+) (?:are there |are )?in (\d+) (\w+?)s?\b", low)
    if m:
        n = int(m.group(2))
        r = CALENDAR.get((m.group(1), m.group(3)))
        if r:
            return n * r
    m = re.search(r"how many (\w+?)s? is (\d+) (\w+)", low)
    if m:
        r = CALENDAR.get((m.group(3), m.group(1)))
        if r and int(m.group(2)) % r == 0:
            return int(m.group(2)) // r
    # 12-hour to 24-hour and back
    m = re.search(r"(\d+):(\d+)\s*(am|pm).*24-hour|24-hour.*?(\d+):(\d+)\s*(am|pm)", low)
    if m:
        g = [x for x in m.groups() if x is not None]
        h, mins, ap = int(g[0]), int(g[1]), g[2]
        h24 = (0 if h == 12 else h) if ap == "am" else (12 if h == 12 else h + 12)
        want = "%02d:%02d" % (h24, mins)
        hit = [o for o in opts if norm(o).replace(" ", "") == want]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"12-hour.*?(\d{1,2}):(\d{2})|(\d{1,2}):(\d{2}).*12-hour", low)
    if m:
        g = [x for x in m.groups() if x is not None]
        h, mins = int(g[0]), int(g[1])
        ap = "am" if h < 12 else "pm"
        h12 = h % 12 or 12
        want = "%d:%02d %s" % (h12, mins, ap)
        hit = [o for o in opts if norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    # a duration that is not a whole number of hours
    m = re.search(r"(?:starts|leaves) at (\d+):(\d+).*?(?:ends|arrives) at (\d+):(\d+)", low)
    if m:
        a = int(m.group(1)) * 60 + int(m.group(2))
        b = int(m.group(3)) * 60 + int(m.group(4))
        if b > a:
            # COMPARE MINUTES, NOT SPELLINGS. This built a set of strings and
            # matched norm(option) against it - but norm("45 minutes") strips
            # the unit and returns the INT 45, so the set never matched and a
            # rule I had written was declining every duration question in
            # silence. Reading each option as a number of minutes handles
            # "45 minutes", "2 h 25 min" and "1 hour 45 min" alike.
            return pick(opts, float(b - a), minutes_of)
    # dates within one year
    m = re.search(r"from (\d+) (\w+) to (\d+) \2 is how many weeks", low)
    if m:
        days = int(m.group(3)) - int(m.group(1))
        if days > 0 and days % 7 == 0:
            return days // 7
    m = re.search(r"it is (\d+) (\w+)\. what is the date (\d+) days later", low)
    if m and m.group(2) in MONTHNAMES:
        mi = MONTHNAMES.index(m.group(2))
        d = int(m.group(1)) + int(m.group(3))
        if d > MONTHLEN[mi]:
            d -= MONTHLEN[mi]
            mi = (mi + 1) % 12
        want = "%d %s" % (d, MONTHNAMES[mi])
        hit = [o for o in opts if norm(o) == want]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"how many months from (\w+) (\d{4}) to (\w+) (\d{4})", low)
    if m and m.group(1) in MONTHNAMES and m.group(3) in MONTHNAMES:
        a = int(m.group(2)) * 12 + MONTHNAMES.index(m.group(1))
        b = int(m.group(4)) * 12 + MONTHNAMES.index(m.group(3))
        return b - a
    # at half past, the hour hand has moved halfway to the NEXT hour
    m = re.search(r"at half past (\d+), where is the hour hand", low)
    if m:
        h = int(m.group(1))
        nxt = h + 1 if h < 12 else 1
        hit = [o for o in opts if re.search(r"between %d and %d" % (h, nxt), norm(o))]
        return hit[0] if len(hit) == 1 else None
    # the hands, when the hour hand sits between two numbers
    m = re.search(r"short hand is between (\d+) and (\d+), and the long hand points at (\d+)", low)
    if m:
        h, mins = int(m.group(1)), int(m.group(3)) * 5
        want = "%d:%02d" % (h, mins)
        hit = [o for o in opts if norm(o).replace(" ", "") == want]
        return hit[0] if len(hit) == 1 else None
    # the latest departure that still arrives in time
    m = re.search(r"at ((?:\d+:\d+[,\s]*(?:and\s*)?)+).*by (\d+):(\d+)", low)
    if m and re.search(r"must be there|latest", low):
        deadline = int(m.group(2)) * 60 + int(m.group(3))
        times = re.findall(r"(\d+):(\d+)", m.group(1))
        ok = [h + ":" + mm for h, mm in times if int(h) * 60 + int(mm) <= deadline]
        if ok:
            # the option is a SENTENCE round the time ("The one arriving
            # 09:25"), so look for the time inside it rather than equalling it
            want = ok[-1]
            hit = [o for o in opts if re.search(re.escape(want), plain(o))]
            return hit[0] if len(hit) == 1 else None
    return None


def named_chart_answer(low, opts, js):
    """questions read off a dataset written as a named-count object.

    ONLY WHAT THE NUMBERS DECIDE. "What is the same in both classes?" offers
    three prose CLAIMS ("The same number come by car", "The most common
    answer", "Nobody cycles"), and picking the true one needs a predicate per
    wording - which is restating the key, not deriving it, and would find
    nothing a new wording had not already broken. That one is left alone.
    """
    if not js:
        return None
    data = named_counts(js)
    if not data:
        return None
    labels = dataset_labels(js, data)

    # which dataset does the question name?
    named = [n for n, lab in labels.items() if lab and re.search(re.escape(lab), low)]
    if len(named) != 1:
        # a bare variable name is a label too: "in 4B"
        named = [n for n in data if re.search(r"\b" + re.escape(n.lower()) + r"\b", low)]
    if len(named) != 1:
        return None
    d = data[named[0]]

    m = re.search(r"\b(most|least|fewest) common\b", low)
    if m:
        want = (max if m.group(1) == "most" else min)(d.values())
        if list(d.values()).count(want) != 1:
            return None
        cat = [k for k, v in d.items() if v == want][0]
        hit = [o for o in opts if re.search(r"\b" + re.escape(cat) + r"\b", str(norm(o)))]
        return hit[0] if len(hit) == 1 else None
    m = re.search(r"how many .*\bby (\w+)\b|how many (\w+)\b", low)
    if m:
        cat = (m.group(1) or m.group(2) or "").lower()
        if cat in d:
            return pick(opts, float(d[cat]), lambda o: amount(o)) or d[cat]
    if re.search(r"how many .*(altogether|in total|in all)", low):
        return pick(opts, float(sum(d.values())), lambda o: amount(o)) or sum(d.values())
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


def literal_run(s):
    """true when a value is written out rather than computed.

    A generated question interpolates - `q: "A tally shows " + n + " bundles"` -
    and reading only the first literal chunk would harvest a TRUNCATED question
    and could report a correct key as wrong. Strings are blanked first, so what
    is left is the structure: a concatenation, call or index means the value is
    computed at runtime and this file cannot know it. `shuffle` is not such a
    marker - shuffling options does not change a key matched by value, and the
    one build that keys by INDEX is checked separately for that below.
    """
    bare = re.sub(r'"(?:[^"\\]|\\.)*"', '""', s)
    bare = re.sub(r"'(?:[^'\\]|\\.)*'", "''", bare)
    return not re.search(r"\+|\b(?:rnd|Math)\b|\b(?!shuffle\b)[A-Za-z_]\w*\s*[\(\[]", bare)


def field_is_literal(obj, end):
    """is the value that ENDS at `end` complete, or is it concatenated on?"""
    return not re.match(r"\s*\+", obj[end:])


def split_top(body):
    """split an array literal on its OWN commas.

    The comma inside "4,700" is not a separator, and splitting on it turned
    `o: ["4,700", "4,600", "5,000"]` into six options - so an index key of 0
    resolved to "4" and the tool reported a correct Grade 4 key as wrong. The
    old guard only knew about commas inside nested brackets.
    """
    out, depth, q, cur = [], 0, None, ""
    for c in body:
        if q:
            cur += c
            if c == q:
                q = None
            continue
        if c in "\"'":
            q, cur = c, cur + c
            continue
        if c in "[{(":
            depth += 1
        elif c in "]})":
            depth -= 1
        if c == "," and depth == 0:
            out.append(cur)
            cur = ""
            continue
        cur += c
    if cur.strip():
        out.append(cur)
    return [x.strip().strip("\"'") for x in out if x.strip()]


def only_nums(t, wanted):
    """THE EXPRESSION MUST ACCOUNT FOR EVERY NUMBER IN THE QUESTION.

    Carried from tools/check-math-answer-keys.mjs and needed again here: "Half
    of 8 is 4. So 4 and 4 make..." was answered 4 by the half-of rule, which
    read the 8 and ignored the two 4s that are the actual ask.
    """
    return sorted(nums(t)) == sorted(wanted)


def harvest(js):
    """(question, options, key, item-source) for every check question.

    THE ARRAY IS FOUND BY SHAPE, NOT BY NAME. This read `const CHECK` only, so
    Grade 3's `const QS` and Grade 4's `const Q5` were invisible - 135 readable
    questions checked by nothing because of a variable name, while the tool
    refused with "no questions found" and that refusal was read as a fact about
    the CONTENT. A list of names would need editing every time a build picks a
    new one; a question object is recognisable on its own: a `q:` string, an
    options array, and a key.
    """
    qs, generated = [], 0
    spans = []
    for m in re.finditer(r"=\s*(?:shuffle\s*\()?\s*\[", js):
        i = js.index("[", m.end() - 1)
        if any(s <= i < e for s, e in spans):
            continue                      # an array nested in one already read
        block = balanced(js, i)
        spans.append((i, i + len(block)))
        for o in objects_in(block[1:-1]):
            # an element may BE the question, or be a function returning it
            r = re.search(r"\breturn\s*\{", o)
            obj = balanced(o, o.index("{", r.end() - 1)) if r else o
            # QUESTION-SHAPED FIRST, READABLE SECOND. Requiring all three
            # fields to PARSE before counting anything dropped 28 of Grade 3's
            # 33 generated questions in silence - their key is written
            # `a: String(sum)`, which the value regex cannot match, so they
            # were neither read nor reported. Anything with a `q:` and an
            # options array is a question; if it cannot be read in full it is
            # counted as generated rather than forgotten.
            om = re.search(r"\b(opts|o):\s*(?:shuffle\s*\()?\[", obj)
            if not (re.search(r'\bq:\s*"', obj) and om):
                continue
            q = re.search(r'\bq:\s*"((?:[^"\\]|\\.)*)"', obj)
            a = re.search(r'\ba:\s*("(?:[^"\\]|\\.)*"|-?\d+)', obj)
            if not (q and a):
                generated += 1
                continue
            body = balanced(obj, obj.index("[", om.start()))[1:-1]
            # ONLY THE FIELDS THAT CARRY THE KEY. Testing the whole object
            # disqualified ten perfectly readable Grade 1 questions whose
            # PICTURE is computed - `pic: '<svg>' + flatSvg(FLAT[1]) + '</svg>'`
            # - while their q, options and answer are all written out. What the
            # picture is made of has nothing to do with whether the key is
            # bound to the right option.
            if not (field_is_literal(obj, q.end()) and field_is_literal(obj, a.end())
                    and literal_run(body)):
                generated += 1
                continue
            # plain() HERE, not at each use: the options carry the same JS
            # escapes the question does, so a raw option compares against a
            # decoded answer and never matches - and the escape then printed
            # into the WRONG report, where it reads as a tooling artefact
            # rather than as the data.
            opts = [plain(x) for x in split_top(body)]
            key = plain(a.group(1).strip('"'))
            if om.group(1) == "o":
                # THE KEY IS AN INDEX HERE, NOT A VALUE. Grade 4 writes
                # `o: [...], a: 0`, and a wrong index is exactly the mis-bound
                # key this file exists to find - so resolve it, and refuse if
                # it points outside the options rather than guessing.
                if not re.fullmatch(r"-?\d+", key) or not 0 <= int(key) < len(opts):
                    continue
                key = opts[int(key)]
            qs.append((plain(q.group(1)), opts, key, obj))
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
    return qs, generated


def nums(t):
    return [int(x) for x in re.findall(r"(?<![\w.])\d+(?![\w.])", t)]


def calc_answer(low, t, opts):
    """Stage 4's "ways to calculate": the METHOD questions, answered by arithmetic.

    These read as opinion ("easiest", "the same as", "true about") and are not:
    each one has a determinate answer that can be COMPUTED from the numbers in
    the question. That distinction is the whole point - a rule that recognised
    the right option by its wording would pass any key, including a wrong one.
    """
    # "16 x 25 is the same as:" - the option with the same VALUE.
    m = re.search(r"(-?[\d,]+\s*[+\-*/]\s*[\d,]+)\s*"
                  r"(?:is the same as|is equal to|equals)", low)
    if m:
        return pick(opts, expr_value(m.group(1)), expr_value)

    # "4 x 25 x 3 is easiest if you first work out:" - the pair making a round
    # number, which IS the strategy the lesson teaches rather than a preference.
    if re.search(r"easiest if you (?:first|start)", low):
        have = nums(t)
        good = []
        for o in opts:
            v = expr_value(o)
            # the pair must be the question's OWN numbers: an option built from
            # numbers that are not in the sum is not a regrouping of it
            if v is None or v % 10 or not all(n in have for n in nums(plain(o))):
                continue
            good.append(o)
        return good[0] if len(good) == 1 else None

    # "Which sentence is true about 6 and 24?" - every option is a CLAIM about
    # divisibility, so each is evaluated and the true one wins. Answers only
    # when EVERY option parses: an unreadable option might be the true one, and
    # answering from the rest would report a correct key as wrong.
    if re.search(r"which (?:sentence|statement) is true", low):
        true = []
        for o in opts:
            m = re.fullmatch(r"\s*(\d+) is a (factor|multiple) of (\d+)\.?\s*",
                             plain(o).lower())
            if not m:
                return None
            a, kind, b = int(m.group(1)), m.group(2), int(m.group(3))
            if (b % a == 0) if kind == "factor" else (a % b == 0):
                true.append(o)
        return true[0] if len(true) == 1 else None
    return None


def words_answer(low, t, opts):
    """"How do you write 4,207 in words?" - the options are read as numbers."""
    m = re.search(r"(?:write|spell)\s+(-?[\d,]+)\s+in words", low)
    if not m:
        return None
    want = int(m.group(1).replace(",", ""))
    hit = [o for o in opts if words_to_int(o) == want]
    return hit[0] if len(hit) == 1 else None


def term_rule_answer(low, t, opts):
    """"2, 5, 9, 14 ... what is the term-to-term rule?" - the sequence decides.

    The rule is CLASSIFIED from the differences and only then matched to an
    option, so the arithmetic does the work: a constant difference is "add n",
    a constant SECOND difference is "one more each time", a constant ratio is
    doubling. A sequence that is none of those is declined.
    """
    if not re.search(r"term.to.term rule", low):
        return None
    seq = nums(t)
    if len(seq) < 4:
        return None
    d = [b - a for a, b in zip(seq, seq[1:])]
    dd = {b - a for a, b in zip(d, d[1:])}
    if len(set(d)) == 1:
        want = r"add\s+%d\b" % d[0]
    elif len(dd) == 1 and dd != {0}:
        step = dd.pop()
        want = (r"(?:one|1) more each time" if step == 1
                else r"%d more each time" % step)
    elif all(a and b % a == 0 for a, b in zip(seq, seq[1:])) and \
            len({b // a for a, b in zip(seq, seq[1:])}) == 1:
        r = seq[1] // seq[0]
        want = r"\bdouble\b" if r == 2 else r"multiply by %d\b" % r
    else:
        return None
    hit = [o for o in opts if re.search(want, plain(o).lower())]
    return hit[0] if len(hit) == 1 else None


def estimate_answer(low, t, opts):
    """AN ESTIMATE IS DETERMINATE WHEN ITS OPTIONS ARE FAR APART.

    expected() declines estimates, because "Estimate 3,872 + 5,145 to the
    nearest thousand" keys 9,000 and the exact sum is 9,017 - the key is
    deliberately not the arithmetic. But "Roughly, what is 412 x 6?" offers
    2,400 / 240 / 24,000, an order of magnitude apart, and the exact 2,472
    settles it beyond argument. So the test is not "is the key exact" but "is
    ONE option unambiguously nearest": within a quarter of the true value, and
    at least three times nearer than the runner-up. Anything closer than that
    is a judgement about rounding and is left alone.
    """
    m = re.search(r"(?:roughly|about|estimate),?\s+(?:what is|how much is)\s+"
                  r"(-?[\d,]+\s*[+\-*/]\s*[\d,]+)", low)
    if not m:
        return None
    exact = expr_value(m.group(1))
    vals = [(o, amount(o)) for o in opts]
    if exact in (None, 0) or any(v is None for _, v in vals):
        return None
    vals.sort(key=lambda x: abs(x[1] - exact))
    best, second = vals[0], vals[1]
    if abs(best[1] - exact) > 0.25 * abs(exact):
        return None
    if abs(second[1] - exact) < 3 * max(abs(best[1] - exact), 1e-9):
        return None
    return best[0]


def part_square_answer(low, opts):
    """"9 whole squares and 6 part squares" - a part square counts as a half.

    That is the method these lessons teach for the area of an odd shape, so it
    is arithmetic rather than an opinion, even though the question says
    "roughly" and the guard in expected() would otherwise decline it.
    """
    m = re.search(r"(\d+)\s+whole squares?\s+and\s+(\d+)\s+part squares?", low)
    if not m:
        return None
    return pick(opts, int(m.group(1)) + int(m.group(2)) / 2.0, amount)


def expected(q, opts, item, js=""):
    """the answer, when it can be derived; else None. Conservative by design."""
    t = plain(q).replace("−", "-").replace("×", "*").replace("÷", "/")
    # A THOUSANDS SEPARATOR IS PART OF THE NUMBER. Stage 4 writes "3,406" and
    # "1,240, 1,290, 1,340", which nums() read as 3 and 406, and as six numbers
    # rather than three - so every rule downstream saw the wrong arithmetic.
    # Merged only for a comma sitting between digits with exactly three after
    # it, so the sequence "2, 4, 6" is untouched.
    t = re.sub(r"(?<=\d),(?=\d{3}(?!\d))", "", t)
    low = t.lower()
    # ESTIMATING IS EXCLUDED; ROUNDING IS NOT. The guard exists because
    # "Estimate 3,872 + 5,145 to the nearest thousand" keys 9,000 on purpose
    # and the exact sum is 9,017 - the key is deliberately not the arithmetic.
    # Matching "nearest" alone also took "Round 63 to the nearest 10", where
    # the key IS exact and IS the whole question, so the guard was skipping the
    # rounding questions rather than the estimates. Ask for the estimating.
    # THE TWO RULES THAT CAN PROVE AN ESTIMATE RUN BEFORE THE GUARD BELOW.
    # The guard is right in general and would otherwise decline these two
    # before any rule saw them - it is placed by WORDING ("roughly"), and these
    # are the cases where the wording says estimate and the options are still
    # decisive. Each proves its own determinacy rather than trusting the phrase.
    got = estimate_answer(low, t, opts)
    if got is not None:
        return got
    got = part_square_answer(low, opts)
    if got is not None:
        return got
    if re.search(r"\bestimate|\broughly\b|\bguess\b|\babout how", low):
        return None                                   # deliberately not exact
    m = re.search(r"round\s+([\d,]+)\s+to the nearest\s+([\d,]+|ten|hundred|thousand)", low)
    if m and not re.search(r"[+\-*/×]", m.group(1)):
        n = int(m.group(1).replace(",", ""))
        step = {"ten": 10, "hundred": 100, "thousand": 1000}.get(
            m.group(2), None) or int(m.group(2).replace(",", ""))
        # round half UP, which is the convention every one of these lessons
        # teaches ("5 or more, round up")
        return ((n + step // 2) // step) * step

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
    for rule in (money_answer, fraction_answer, units_answer,
                 clock_answer, turn_answer, chart_answer,
                 stage34_shape, stage34_place, stage34_time):
        got = rule(low, opts)
        if got is not None:
            return got
    for rule in (pattern_answer, stage34_number):
        got = rule(low, t, opts)
        if got is not None:
            return got
    got = named_chart_answer(low, opts, js)
    if got is not None:
        return got
    got = calc_answer(low, t, opts)
    if got is not None:
        return got
    got = words_answer(low, t, opts)
    if got is not None:
        return got
    got = term_rule_answer(low, t, opts)
    if got is not None:
        return got
    if picn is not None and re.search(r"^how many\b", low) and not nums(t):
        return picn                                   # "How many counters?" + pic: N
    if re.search(r"\bno .* left\b|are none left", low) and re.search(r"which number", low):
        return 0
    # ALL OF THEM LEAVE, SO NONE ARE LEFT. The rule above answers "which number
    # says there are none left"; this answers the count itself. The repeated
    # number is required - "5 birds ... all 5 fly away" - so an ordinary
    # take-away ("5 birds ... 2 fly away") falls through to the arithmetic
    # ladder rather than being answered 0.
    m = re.search(r"(\d+) \w+ (?:are|is)\b.*?\ball \1\b.*?\bhow many (?:are )?left", low)
    if m:
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
    # THE NUMBERS ARE IN THE OPTIONS, not in the question. Every comparison
    # rule above reads the pair out of the sentence, so "Which is the smallest
    # of these numbers?" - whose whole content is the option list - had nothing
    # to read. Answered only when every option is a number and the extreme is
    # unique; the question must carry none of its own, so the rule above keeps
    # the cases it already handles.
    m = re.search(r"which is the (smallest|lowest|biggest|largest|greatest|highest)"
                  r"(?: of these)?(?: numbers?)?\s*\??$", low)
    if m and opts and not nums(t):
        vals = [norm(o) for o in opts]
        if all(isinstance(v, int) for v in vals):
            want = min(vals) if m.group(1) in ("smallest", "lowest") else max(vals)
            if vals.count(want) == 1:
                return want
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
    if m and only_nums(t, [int(m.group(1))]):
        n = int(m.group(1))
        return n // 2 if n % 2 == 0 else None
    # times, and only where BOTH numbers are in the question - the ladder's
    # standing rule that the expression must account for every number in it
    m = re.search(r"(\d+)\s*\*\s*(\d+)\s*=\s*\?", t)
    if m and len(nums(t)) == 2:
        return int(m.group(1)) * int(m.group(2))
    # a unit fraction OF a quantity: "A quarter of 12 is ?", "1/4 of 12"
    m = re.search(r"\b(?:a\s+)?(half|third|quarter|fifth|tenth)\s+of\s+(\d+)", low)
    if m:
        d = {"half": 2, "third": 3, "quarter": 4, "fifth": 5, "tenth": 10}[m.group(1)]
        n = int(m.group(2))
        if not only_nums(t, [n]):
            return None
        return n // d if n % d == 0 else None
    m = re.search(r"\bwhat is 1/(\d+) of (\d+)", low)
    if m:
        d, n = int(m.group(1)), int(m.group(2))
        if not only_nums(t, [1, d, n]):
            return None
        return n // d if d and n % d == 0 else None
    # one more / one less, and the counting-on form beside it
    m = re.search(r"\b(\w+) (more|less|fewer) than (\d+) is\b", low)
    if m and isinstance(norm(m.group(1)), int):
        step = norm(m.group(1))
        return int(m.group(3)) + (step if m.group(2) == "more" else -step)
    # SHARING, by the shape of the sentence rather than by one phrasing. The
    # old rule named the sharer ("with her brother", "between two"), so
    # "12 shared between 3 is ? each" - the form Grade 2 actually uses - missed.
    m = re.search(r"(\d+)\s+shared\s+(?:between|by|among)\s+(\d+)", low)
    if m:
        n, k = int(m.group(1)), int(m.group(2))
        return n // k if k and n % k == 0 else None
    # "HOW MANY HUNDREDS ARE IN 4,072" HAS TWO TAUGHT READINGS and they differ:
    # 40 if it means how many hundreds the number CONTAINS, 0 if it means the
    # hundreds DIGIT. I first declined above a hundred for that reason, then
    # decided the division reading was the real one - and this build keys the
    # DIGIT, with options 0, 4, 7 that cannot even express 40. Neither fixed
    # choice is right, so let the OPTIONS settle it: compute both, and answer
    # only when exactly one of them is on offer. Below a hundred they coincide,
    # so nothing there depends on this.
    m = re.search(r"how many (tens|ones|units|hundreds|thousands) (?:are )?(?:there )?in ([\d,]+)", low)
    if m:
        n, place = int(m.group(2).replace(",", "")), PLACE[m.group(1)]
        contained, digit = n // place, n // place % 10
        vals = {norm(o) for o in opts}
        if contained == digit:
            return contained
        can = [v for v in (contained, digit) if v in vals]
        return can[0] if len(can) == 1 else None
    # THE RUN NEED NOT BE FOLLOWED IMMEDIATELY BY THE "?". "12, 14, 16, ?"
    # matched and "5, 10, 15, 20... what comes next?" did not, though they ask
    # the same thing - the ellipsis and four words sat between the numbers and
    # the question mark. Allow that gap, but only when the words are asking
    # what comes NEXT: "4, 7, 10, 13... what is the rule?" wants "add 3", and
    # continuing the run would answer a question nobody asked.
    m = (re.search(r"((?:\d+\s*,\s*){2,})\?", t)
         or (re.search(r"((?:\d+\s*,\s*){2,}\d+\s*)(?:\.{2,}|…)\s*what comes next", t + " ")
             if re.search(r"what comes next", low) else None))
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


tot = ver = wrong = gen = 0
bad, unver = [], []
if RULE_HITS:
    sys.settrace(_trace)
print("\n  Check answers, verified against the question and the item  -  %s\n" % LABEL)
for f in FILES:
    p = os.path.join(SRC, f)
    if not os.path.exists(p):
        continue
    js = "\n".join(re.findall(r"<script[^>]*>(.*?)</script>",
                              io.open(p, encoding="utf-8").read(), re.S))
    n = v = w = 0
    items, g = harvest(js)
    gen += g
    for q, opts, key, item in items:
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
    print("  %-4s %-32s %3d asked  %3d verified  %d wrong%s"
          % ("ok" if not w else "FAIL", f[:32], n, v, w,
             "   (+%d generated)" % g if g else ""))

if RULE_HITS:
    sys.settrace(None)
print("\n  %d questions, %d verified, %d WRONG, %d not verifiable" % (tot, ver, wrong, tot - ver))
if gen:
    # SAY IT, do not let it be an absence. A question built at runtime has no
    # key this file can read, and leaving it out of every number would make a
    # build look smaller and better-covered than it is.
    print("  %d more are generated at runtime and cannot be read from source" % gen)
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

if RULE_HITS:
    import ast

    src_lines = io.open(__file__, encoding="utf-8").read().splitlines()
    tree = ast.parse("\n".join(src_lines))
    sites = []                       # every return that can carry an answer
    for fn in tree.body:
        if isinstance(fn, ast.FunctionDef) and fn.name in RULE_FUNCS:
            for node in ast.walk(fn):
                # `return None` is a DECLINE, not a rule - counting it as one
                # put 40-odd lines in the dead list that could never fire by
                # construction and buried the sites worth reading
                if not isinstance(node, ast.Return) or node.value is None:
                    continue
                if isinstance(node.value, ast.Constant) and node.value.value is None:
                    continue
                sites.append((fn.name, node.lineno))

    def text(ln):
        return src_lines[ln - 1].strip()[:74]

    # A DISPATCH LINE IS NOT A RULE. `return got` in expected() fires whenever
    # any sub-rule answers, so counting it as a rule would report the busiest
    # line in the file and say nothing about coverage.
    def dispatch(name, ln):
        return name == "expected" and re.match(r"return (got|picn)\b", text(ln))

    sites = [s for s in sites if not dispatch(*s)]

    # ACCUMULATE ACROSS BUILDS, because a rule dead HERE is usually just a rule
    # for another grade: 170 of Grade 2's 245 sites are Stage 3-4 rules, and a
    # list that long is one nobody reads. Sites dead in EVERY build are the
    # ones worth looking at. The file is per-checkout scratch, not shared.
    tally = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".rule-hits.json")
    fp = hashlib.sha1(io.open(__file__, "rb").read()).hexdigest()
    seen, carried = {}, None
    if os.path.exists(tally):
        try:
            old = json.load(io.open(tally, encoding="utf-8"))
            # A SITE IS A LINE NUMBER, AND EDITING THIS FILE MOVES EVERY ONE OF
            # THEM. A tally written against different source does not report
            # less, it reports the WRONG rules - the counts land on whatever now
            # occupies those lines. So it is discarded rather than migrated, and
            # the discard is announced: re-running the four builds costs three
            # seconds and is the only thing that makes the dead list mean
            # anything. (Adding the two comment lines that fixed the bug below
            # was itself enough to shift every site in the file.)
            carried = old.get("#source") == fp
            if carried:
                # int(), because the line number goes through JSON as a STRING
                # and ("facts_answer", "532") never matches ("facts_answer", 532):
                # every reload looked like a fresh tally, so the first version of
                # this reported 151 sites dead including ones seen firing minutes
                # earlier. Exactly the failure the whole feature exists to catch.
                seen = {(k.rsplit("@", 1)[0], int(k.rsplit("@", 1)[1])): v
                        for k, v in old.items() if k != "#source"}
        except Exception:
            seen, carried = {}, False

    # A HIT THAT MATCHES NO SITE IS A BROKEN TALLY, NOT A BUSY RULE. The trace
    # keys on frame.f_lineno and the site list on ast.Return.lineno; if those
    # two ever disagree - a return whose expression spans lines, a decorator, a
    # future Python - every affected rule fires, is counted under a key nothing
    # looks up, and reads as DEAD. Counted and printed, because the number being
    # zero is the only evidence that the two halves are talking about the same
    # thing at all.
    ghosts = 0
    for s, n in _hits.items():
        if s in sites:
            seen[s] = seen.get(s, 0) + n
        elif not dispatch(*s):
            ghosts += 1
    out = {"%s@%s" % k: v for k, v in seen.items()}
    out["#source"] = fp
    io.open(tally, "w", encoding="utf-8").write(json.dumps(out, indent=0))

    here_live = [(s, _hits[s]) for s in sites if s in _hits]
    ever_dead = [s for s in sites if s not in seen]

    print("\n  RULES THAT ANSWERED HERE: %d of %d sites" % (len(here_live), len(sites)))
    for (name, ln), n in sorted(here_live, key=lambda x: -x[1])[:10]:
        print("     %4d  %-18s :%-5d %s" % (n, name, ln, text(ln)))
    if len(here_live) > 10:
        print("     ... and %d more" % (len(here_live) - 10))

    if ghosts:
        print("\n  %d hit(s) matched NO site. The dead list below is not to be"
              " trusted -" % ghosts)
        print("  the trace and the source agree about fewer rules than they should.")

    if carried is False:
        print("\n  TALLY RESET: it was written against a different version of this")
        print("  file, so its line numbers name other rules now. Only this build's")
        print("  hits are counted below - run the other builds before reading it.")
    print("\n  NEVER ANSWERED IN ANY BUILD %s: %d"
          % ("RUN SO FAR" if carried else "(THIS BUILD ONLY)", len(ever_dead)))
    print("  (accumulated in .rule-hits.json - run every --app to make this mean")
    print("  anything; delete the file to start the tally again)")
    for name, ln in sorted(ever_dead, key=lambda s: s[1]):
        print("     %-18s :%-5d %s" % (name, ln, text(ln)))
    print("\n  A dead site is not automatically a defect - some are the `else`")
    print("  half of a live rule. It is a LIST TO READ, not a number to zero.")

if tot == 0:
    sys.exit("\n  REFUSED: no questions found. A checker that reads nothing is not a pass.")
print("")
sys.exit(1 if wrong else 0)
