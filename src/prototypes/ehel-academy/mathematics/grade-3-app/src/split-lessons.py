# -*- coding: utf-8 -*-
"""Five Grade 3 lessons become eight, by splitting the two portmanteaus.

WHY. Two of the five carried 17 teaching steps and 3-4 Cambridge strands each -
31 of the 53 objectives between them - while three carried 8 to 11 steps and one
strand. "Sides, Sizes and Seconds" said so in its own title. That imbalance is
not only untidy: the lesson IS the progress unit, so a teacher reading the live
group board saw "in Up to a Thousand" for a child who might be at place value or
at giving change, 17 steps apart, and the unit gate made a child finish all 17
before reaching money.

WHAT IS AND IS NOT MOVED. Not a single teaching step is rewritten. The split
falls on seams that already existed - the `/* ---- N: name ---- objective */`
markers in the content and the matching sections in the slides - so every step
keeps its markup, its narration, its element ids and its activity code. What
changes is which file a step lives in, the finish() index it reports, and which
check questions and stickers travel with it.

ELEMENT IDS ARE DELIBERATELY NOT RENUMBERED. Lesson 2 keeps fb12..fb17 rather
than becoming fb1..fb6. They only have to be unique within one page, and
renumbering them would mean rewriting both the slides and the content in step,
which is a whole class of silent mismatch bought for cosmetics.

RUN ONCE. It reads the five committed fragment pairs and writes eight. It is
kept for provenance, the way the repair-ehel-math-* tools are.
"""
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

# ---------------------------------------------------------------------------
# the Convincing step is inserted by ../convince/build.py, which is re-run over
# all eight afterwards. Strip it out first so nothing is inserted twice.
# ---------------------------------------------------------------------------
SLIDE_RE = re.compile(r"    <!-- how do you know -->[\s\S]*?</section>\n\n")
JS_RE = re.compile(r"\n  /\* =+\n     CONVINCING[\s\S]*?\n  \}\)\(\);\n")
STICKER_RE = re.compile(r",?\n    \[\"\\ud83e\\udd14\", \"How do you know\"\]")


def read(p):
    return io.open(p, encoding="utf-8").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8", newline="").write(s)


def strip_convincing(slides, content):
    return SLIDE_RE.sub("", slides), STICKER_RE.sub("", JS_RE.sub("", content))


SECTION_RE = re.compile(r"(    <!--[^\n]*-->\n)?(    <section class=\"slide\"[\s\S]*?\n    </section>\n)")


def parse_slides(text):
    """-> (header, [section_text, ...]).  Sections keep their own comment."""
    parts, last, out = [], 0, []
    for m in SECTION_RE.finditer(text):
        parts.append((m.start(), m.group(0)))
    header = text[:parts[0][0]]
    for _, block in parts:
        out.append(block)
    return header, out


BLOCK_RE = re.compile(r"\n  /\* ---- ")


def parse_content(text):
    """-> (preamble, [block, ...], tail).  Blocks are the /* ---- N: ---- */ runs."""
    idx = [m.start() for m in BLOCK_RE.finditer(text)]
    preamble = text[:idx[0]]
    blocks = []
    for i, s in enumerate(idx):
        e = idx[i + 1] if i + 1 < len(idx) else None
        blocks.append(text[s:e] if e else text[s:])
    # the final block (stickers) still carries the file tail
    tail_at = blocks[-1].find("\n  show(0, false);")
    tail = blocks[-1][tail_at:]
    blocks[-1] = blocks[-1][:tail_at]
    return preamble, blocks, tail


def remap_indices(js, mapping):
    """finish(N, ...), makeColumnStep(N, ...), unitStep(N, ...) all carry a slide
       index as their first argument. Rewrite every one, and refuse on any index
       that is not in the map - an unmapped call is a step landing on the wrong
       sticker, which nothing downstream would report."""
    seen = []

    def sub(m):
        fn, n = m.group(1), int(m.group(2))
        seen.append(n)
        if n not in mapping:
            raise SystemExit("  index %d in %s(...) is not in the map" % (n, fn))
        return "%s(%d" % (fn, mapping[n])

    out = re.sub(r"\b(finish|makeColumnStep|unitStep)\((\d+)", sub, js)
    return out, sorted(set(seen))


def rebuild_check(block, keep, extra, threshold, finish_index):
    """Keep the listed question generators, append any authored ones, and move
       the pass mark and the finish() index with them."""
    gens = re.findall(r"^    \(\) => \{.*$", block, re.M)
    if not gens:
        raise SystemExit("  no question generators found in the check block")
    # the LAST generator in the source array carries no trailing comma, so any
    # line kept from the end of it and then followed by another is a syntax
    # error. Normalise every line to end with one; JS allows the trailing comma.
    chosen = [g.rstrip().rstrip(",") + "," for g in ([gens[i] for i in keep] + list(extra))]
    old = block[block.index("  const QS = ["):block.index("\n  ];", block.index("  const QS = [")) + 4]
    new = "  const QS = [\n" + "\n".join(chosen) + "\n  ];\n"
    block = block.replace(old, new)
    block = re.sub(r"got18 >= \d+", "got18 >= %d" % threshold, block)
    block = re.sub(r"got17 >= \d+", "got17 >= %d" % threshold, block)
    block = re.sub(r"\bfinish\(\d+, \"You have finished the check", 'finish(%d, "You have finished the check' % finish_index, block)
    return block


def rebuild_stickers(block, entries, done_line):
    arr = "  const STICKERS = [\n" + "".join("    [%s, %s],\n" % (repr(e[0]).replace("'", '"'), repr(e[1]).replace("'", '"')) for e in entries)
    arr = arr.rstrip(",\n") + "\n  ];\n"
    old = block[block.index("  const STICKERS = ["):block.index("\n  ];", block.index("  const STICKERS = [")) + 5]
    block = block.replace(old, arr)
    return re.sub(r'stickers! [^"]*"', 'stickers! %s"' % done_line, block)


# ---------------------------------------------------------------------------
# Authored check questions. The split left three lessons short, and one gap was
# there before it: the old lesson 1 had NO check question on column addition or
# column subtraction, its two hardest steps.
# ---------------------------------------------------------------------------
Q_ADD = [
    '    () => { const a = rnd(126, 498), b = rnd(126, 498); return { q: a + " + " + b + " = ?", opts: [a + b, a + b - 10, a + b + 10], a: a + b, why: "Work the ones, then the tens, then the hundreds: " + (a + b) + "." }; },',
    '    () => { const a = rnd(320, 940), b = rnd(118, 285); return { q: a + " − " + b + " = ?", opts: [a - b, a - b - 10, a - b + 100], a: a - b, why: "Fetch a ten where the top digit is too small: " + (a - b) + "." }; },',
    '    () => { const p = rnd(12, 48), c = 100 - p, r = rnd(11, 39); return { q: "Which two would you add first in " + p + " + " + r + " + " + c + "?", opts: [p + " and " + c, p + " and " + r, r + " and " + c], a: p + " and " + c, why: p + " + " + c + " = 100, which leaves an easy sum." }; },',
]
Q_SHAPE = [
    '    () => { return { q: "How many lines of symmetry does a square have?", opts: [4, 2, 1], a: 4, why: "Two through the sides and two through the corners." }; },',
    '    () => { return { q: "A shape is reflected in a mirror line. What happens to its size?", opts: ["it stays the same", "it doubles", "it halves"], a: "it stays the same", why: "A reflection turns a shape round; it does not resize it." }; },',
]
Q_MEASURE = [
    '    () => { const st = [10, 100][rnd(0, 1)]; const b = rnd(2, 7) * st; return { q: "A scale is marked every " + st + " g. The pointer is halfway between " + b + " and " + (b + st) + ". What does it read?", opts: [b + st / 2, b + st, b + st / 10], a: b + st / 2, why: "One space is " + st + " g, so halfway is " + (st / 2) + " g past " + b + "." }; },',
    '    () => { return { q: "Which unit would you use for the length of a classroom?", opts: ["metres", "millimetres", "kilometres"], a: "metres", why: "A classroom is a few metres across." }; },',
]
Q_TIME = [
    '    () => { const h = rnd(1, 11); return { q: "What is quarter past " + h + " on a digital clock?", opts: [h + ":15", h + ":25", h + ":45"], a: h + ":15", why: "A quarter of an hour is 15 minutes, because a quarter of 60 is 15." }; },',
    '    () => { const h = rnd(8, 10), m = rnd(0, 3) * 10, gap = rnd(2, 5) * 10; const t = m + gap; return { q: "A bus leaves at " + h + ":" + two(m) + " and arrives at " + (h + Math.floor(t / 60)) + ":" + two(t % 60) + ". How long is the journey?", opts: [gap + " minutes", (gap + 10) + " minutes", (gap - 10) + " minutes"], a: gap + " minutes", why: "Count on from " + h + ":" + two(m) + " to the arrival time." }; },',
    '    () => { return { q: "You are facing west and you turn to your right. Which way are you facing?", opts: ["north", "south", "east"], a: "north", why: "Going clockwise from west comes north." }; },',
    '    () => { return { q: "At half past 8, where is the hour hand?", opts: ["between 8 and 9", "on the 8", "on the 6"], a: "between 8 and 9", why: "The hour hand creeps all the time, so by half past it is halfway to 9." }; },',
]

# out, slug, eyebrow, h1, source, slide sections, content blocks, index remap,
# check questions kept, authored questions, pass mark, sticker rows, shelf line
PLAN = [
    dict(out="l1", slug="up-to-a-thousand", eyebrow="Number and place value",
         h1="Up to a <em>Thousand</em>", src="l1",
         slides=list(range(0, 11)), blocks=list(range(0, 11)),
         remap={i: i for i in range(11)} | {17: 11},
         qs=[0, 1, 2, 4, 5, 6, 7], extra=[], pass_mark=5,
         stickers=list(range(0, 11)) + [17], done="You know your numbers to a thousand."),

    dict(out="l2", slug="adding-and-money", eyebrow="Calculation and money",
         h1="Adding, Taking Away and <em>Money</em>", src="l1",
         slides=list(range(11, 17)), blocks=[11, 12, 13, 14, 15],
         remap={11: 0, 12: 1, 13: 2, 14: 3, 15: 4, 16: 5, 17: 6},
         qs=[3, 8, 9], extra=Q_ADD, pass_mark=4,
         stickers=list(range(11, 17)) + [17], done="You can add, take away and give change."),

    dict(out="l3", slug="rows-and-rules", src="l2", copy=True),
    dict(out="l4", slug="equal-parts", src="l3", copy=True),

    dict(out="l5", slug="shapes-and-symmetry", eyebrow="Shape and symmetry",
         h1="Shapes and <em>Symmetry</em>", src="l4",
         slides=list(range(0, 8)), blocks=list(range(0, 8)),
         remap={i: i for i in range(8)} | {17: 8},
         qs=[0, 1, 6, 9], extra=Q_SHAPE, pass_mark=4,
         stickers=list(range(0, 8)) + [17], done="You know your shapes inside out."),

    dict(out="l6", slug="measure-it", eyebrow="Measurement",
         h1="Measure <em>It</em>", src="l4",
         slides=list(range(8, 13)), blocks=[8, 9, 10],
         remap={8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 17: 5},
         qs=[2, 3, 4, 5], extra=Q_MEASURE, pass_mark=4,
         stickers=list(range(8, 13)) + [17], done="You can measure length, mass and capacity."),

    dict(out="l7", slug="time-and-direction", eyebrow="Time and position",
         h1="Time and <em>Direction</em>", src="l4",
         slides=list(range(13, 17)), blocks=[11, 12, 13, 14],
         remap={13: 0, 14: 1, 15: 2, 16: 3, 17: 4},
         qs=[7, 8], extra=Q_TIME, pass_mark=4,
         stickers=list(range(13, 17)) + [17], done="You can read a clock, a timetable and a compass."),

    dict(out="l8", slug="ask-count-chart", src="l5", copy=True),
]

SRC = {}
for p in ("l1", "l2", "l3", "l4", "l5"):
    s, c = strip_convincing(read(p + "-slides.html"), read(p + "-content.js"))
    header, sections = parse_slides(s)
    preamble, blocks, tail = parse_content(c)
    stickers = re.findall(r'\[("(?:[^"\\]|\\.)*"), ("(?:[^"\\]|\\.)*")\]', blocks[-1])
    SRC[p] = dict(header=header, sections=sections, preamble=preamble, blocks=blocks, tail=tail,
                  stickers=[(a[1:-1], b[1:-1]) for a, b in stickers])
    print("  read %s: %d sections, %d blocks, %d stickers" % (p, len(sections), len(blocks), len(stickers)))

NUM_RE = re.compile(r'(<span class="n">)(\d+)(</span>)')
out_files = {}

for spec in PLAN:
    s = SRC[spec["src"]]
    if spec.get("copy"):
        out_files[spec["out"] + "-slides.html"] = s["header"] + "".join(s["sections"])
        out_files[spec["out"] + "-content.js"] = s["preamble"] + "".join(s["blocks"]) + s["tail"]
        print("  %s <- %s unchanged" % (spec["out"], spec["src"]))
        continue

    head = re.sub(r'(<p class="eyebrow">)[^<]*(</p>)', lambda m: m.group(1) + "Mathematics · Grade 3 · " + spec["eyebrow"] + m.group(2), s["header"])
    head = re.sub(r"<h1>[\s\S]*?</h1>", "<h1>" + spec["h1"] + "</h1>", head)

    picked, n = [], 0
    for i in spec["slides"]:
        sec = s["sections"][i]
        n += 1
        sec = NUM_RE.sub(lambda m, k=n: m.group(1) + str(k) + m.group(3), sec, count=1)
        picked.append(sec)
    slides = head + "".join(picked) + s["sections"][-2] + s["sections"][-1]

    body = ""
    for i in spec["blocks"]:
        js, _ = remap_indices(s["blocks"][i], spec["remap"])
        body += js
    # rebuild_check sets the check's own finish() index directly, so it must NOT
    # then be run through remap_indices - that would try to map an already-mapped
    # number and fail, which is how this was caught rather than shipped
    check = rebuild_check(s["blocks"][-2], spec["qs"], spec["extra"], spec["pass_mark"], spec["remap"][17])
    shelf = rebuild_stickers(s["blocks"][-1], [s["stickers"][i] for i in spec["stickers"]], spec["done"])

    out_files[spec["out"] + "-slides.html"] = slides
    out_files[spec["out"] + "-content.js"] = s["preamble"] + body + check + shelf + s["tail"]
    print("  %s %-22s %2d steps, %d check questions, %d stickers"
          % (spec["out"], spec["slug"], len(spec["slides"]), len(spec["qs"]) + len(spec["extra"]), len(spec["stickers"])))

for p in ("l1", "l2", "l3", "l4", "l5"):
    for suffix in ("-slides.html", "-content.js"):
        os.rename(p + suffix, "_old_" + p + suffix)
for name, text in out_files.items():
    write(name, text)
print("\n  wrote %d files; the five originals are now _old_*" % len(out_files))
