# -*- coding: utf-8 -*-
"""Recut Grade 4 into one lesson per Cambridge sub-strand.

WHY. The six lessons were a survey plus its own patches: Four Digits Strong came
first and covered the whole stage, and the five strand lessons were written around
the gaps it left. So it spent 11 steps carrying 6 objectives, re-taught five slides'
worth of material the strand lessons cover at more length, and was the only lesson
that was not about one thing. Grades 1, 2 and 3 all divide by sub-strand (7, 9 and
8 lessons); Grade 4 had 6.

EVERY SPLIT IS WITHIN ONE FILE. That is a hard constraint here, for a sharper reason
than the one ../grade-1-app/compose-lessons.py gives. Grade 1's check arrays are not
portable; Grade 4's are (every quiz is the same {q,o,a,w} shape with one renderer).
What is not portable is the IDS: num-body and g4-lesson-body share 34 of them --
fb1..fb11, work1.., say1.. -- because both number from slide 1. Grafting a slide
across files silently collides. So Four Digits Strong is retired rather than
redistributed, and the six objectives it alone carried are AUTHORED FRESH into the
strand lesson each belongs to (see addons/).

What this rewrites, all of which a split breaks if left alone:
  - the slide badge <span class="n">N</span>
  - finish(i), 0-based, which drives both the dot rail and the sticker shelf
  - ask(N, ...) and its id="askN" placeholder -- ask() calls finish(n - 1), so an
    un-renumbered panel ticks the wrong slide
  - the STICKERS array, parallel to done[]
  - the quiz, partitioned to the slides each lesson keeps
DOM ids are deliberately NOT renumbered: they come from one source file, so they
stay unique, and rewriting them is churn that can only introduce mistakes.
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# out-key, title, source, teaching slides to keep (1-based, in the source), quiz items to keep
STRUCTURE = [
    ("bignum", "Big Numbers and Below Zero", "num",   [9, 10],          [8, 9]),
    ("patterns", "Patterns and Square Numbers", "num", [2, 3, 4, 5],    [2, 3, 4, 5]),
    ("calc", "Ways to Calculate", "num",              [1, 6, 7, 8],     [1, 6, 7, 10]),
    ("frac", "Parts of a Whole", "frac",              None,             None),
    ("time", "Telling the Time", "time",              None,             None),
    ("shape", "Shape and Measures", "shape",          [1, 2, 3, 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8, 9]),
    ("where", "Where Things Are", "shape",            [4, 9],           [10]),
    ("stats", "Asking, Sorting and Chance", "stats",  None,             None),
]

SRC = {"num": "num", "shape": "shape", "frac": "frac", "time": "time", "stats": "stats"}

# The five objectives Four Digits Strong alone carried, moved into the strand lesson
# each belongs to. Its slides ARE portable -- they declare nothing another slide needs
# and build no id dynamically, so every $() call is a literal that can be rewritten --
# but its IDS collide with the target's (both files number from slide 1), so each block
# is prefixed. Its QUIZ is not portable: Four Digits Strong writes {q, opts, a} with the
# answer as a VALUE, while the five write {q, o, a, w} with the answer as an INDEX and
# an explanation. So these five items are authored here rather than moved.
#   (donor slide, sticker, quiz item)
ADDONS = {
    "bignum": [
        (1, "\\U0001f522",
         '{ q: "How many hundreds are there in 4,072?", o: ["0", "4", "7"], a: 0,'
         ' w: "The hundreds place holds a 0. The 4 is thousands and the 7 is tens." }'),
        (2, "\\u2744\\ufe0f",
         '{ q: "It is 3\\u00b0C and it gets 5 degrees colder. What is the temperature?",'
         ' o: ["\\u22122\\u00b0C", "2\\u00b0C", "\\u22128\\u00b0C"], a: 0,'
         ' w: "Count back from 3 through zero: 2, 1, 0, \\u22121, \\u22122." }'),
    ],
    "calc": [
        (6, "\\u2716\\ufe0f",
         '{ q: "Which of these is a factor pair of 24?", o: ["4 and 6", "5 and 5", "3 and 9"], a: 0,'
         ' w: "4 \\u00d7 6 = 24. A factor pair is two numbers that multiply to give the number." }'),
    ],
    "shape": [
        (10, "\\U0001f4d0",
         '{ q: "An angle of 120\\u00b0 is:", o: ["Obtuse", "Acute", "A right angle"], a: 0,'
         ' w: "More than 90\\u00b0 but less than 180\\u00b0 is obtuse. Acute is under 90\\u00b0." }'),
    ],
    "where": [
        (11, "\\U0001f5fa\\ufe0f",
         '{ q: "In the coordinates (3, 5), what does the 3 tell you?",'
         ' o: ["How far along", "How far up", "Which square to shade"], a: 0,'
         ' w: "Go along first, then up. The first number is always the across one." }'),
    ],
}
DONOR_BODY, DONOR_JS = "g4-lesson-body.html", "g4-lesson.js"


def blocks(js):
    """(label, text) per top-level slide block, plus the preamble."""
    marks = [(m.start(), m.group(1) or "ask")
             for m in re.finditer(r"/\* ---- (?:(\d+):|your turn)", js)]
    out, pre = [], js[: marks[0][0]]
    for i, (pos, lab) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(js)
        out.append((lab, js[pos:end]))
    return pre, out


def sections(body):
    """(text) per <section class="slide">, in order."""
    idx = [m.start() for m in re.finditer(r'<section class="slide"', body)]
    end = body.rindex("</section>") + len("</section>")
    out = []
    for i, p in enumerate(idx):
        stop = idx[i + 1] if i + 1 < len(idx) else end
        out.append(body[p:stop])
    return body[: idx[0]], out, body[end:]


def quiz_items(js):
    m = re.search(r"(const Q\d+ = shuffle\(\[)(.*?)(\n  \]\))", js, re.S)
    assert m, "no quiz array found"
    raw = m.group(2)
    parts, depth, cur = [], 0, ""
    for ch in raw:
        cur += ch
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                # every item after the first arrives with the previous item's
                # separating comma still attached; strip it before the shape test
                parts.append(cur.strip().lstrip(",").strip().rstrip(","))
                cur = ""
    got = [p for p in parts if p.startswith("{")]
    assert len(got) == len(parts), "quiz parser dropped %d item(s)" % (len(parts) - len(got))
    return m, got


def declared_names(js):
    """Every name a top-level const/let/var/function in `js` introduces.

    Reads the WHOLE declaration, not the first identifier in it. `let deg10 = 45,
    quiz10 = null, right10 = 0` introduces three names, and a scan that stops at the
    first `=` sees one -- which is how a collision with the check block's own
    `right10` survived both a duplicate-scan and a rename and only surfaced as a
    node --check error two steps later. Commas are split at bracket depth 0 so an
    array or object initialiser cannot be mistaken for a second declarator.
    """
    out = []
    for m in re.finditer(r"^  (?:const|let|var)\s+(.+?);\s*$", js, re.M | re.S):
        text, depth, cur, parts = m.group(1), 0, "", []
        for ch in text:
            if ch in "([{":
                depth += 1
            elif ch in ")]}":
                depth -= 1
            if ch == "," and depth == 0:
                parts.append(cur); cur = ""
            else:
                cur += ch
        parts.append(cur)
        for p in parts:
            n = p.split("=")[0].strip()
            if re.fullmatch(r"[A-Za-z_$][\w$]*", n or ""):
                out.append(n)
    out += re.findall(r"^  function\s+([A-Za-z_$][\w$]*)", js, re.M)
    return out


def donor_slide(no, newpos):
    """One Four Digits Strong slide, ids prefixed so it cannot collide, badge and
    finish() set to its new position. Safe because that file builds no id
    dynamically -- every $() call in these blocks takes a literal."""
    body = io.open(os.path.join(HERE, DONOR_BODY), encoding="utf-8").read()
    js = io.open(os.path.join(HERE, DONOR_JS), encoding="utf-8").read()
    sec = re.split(r'(?=<section class="slide")', body)[1:][no - 1]
    marks = [(m.start(), int(m.group(1))) for m in re.finditer(r"/\* ---- (\d+):", js)]
    pos = [p for p, n in marks if n == no][0]
    nxt = [p for p, n in marks if n == no + 1]
    blk = js[pos:(nxt[0] if nxt else len(js))]

    pre = "d%d_" % no
    for i in sorted(set(re.findall(r'id="([A-Za-z][A-Za-z0-9_]*)"', sec)), key=len, reverse=True):
        sec = sec.replace('id="%s"' % i, 'id="%s%s"' % (pre, i))
        sec = sec.replace('for="%s"' % i, 'for="%s%s"' % (pre, i))
        blk = blk.replace('"%s"' % i, '"%s%s"' % (pre, i))

    # Rename this block's own top-level declarations too. Ids alone are not enough:
    # the donor numbers its variables by slide, so `let deg10 = 0, right10 = 0` from
    # slide 10 collides with the target's check block, which also counts `right10`.
    # Every name in a comma list has to be taken, which is why this reads past the
    # first identifier -- a scan that stops at it reports no duplicates and is wrong.
    names = set(declared_names(blk))
    for n in sorted(names, key=len, reverse=True):
        blk = re.sub(r"\b%s\b" % re.escape(n), pre + n, blk)
    sec = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newpos, sec, count=1)
    blk = re.sub(r"\bfinish\(\s*%d\s*," % (no - 1), "finish(%d," % (newpos - 1), blk)
    return sec, blk


def compose(key, title, srckey, keep, keepq):
    body = io.open(os.path.join(HERE, "%s-body.html" % srckey), encoding="utf-8").read()
    js = io.open(os.path.join(HERE, "%s-slides.js" % srckey), encoding="utf-8").read()
    pre, blks = blocks(js)
    head, secs, tail = sections(body)
    by = {}
    for lab, txt in blks:
        by.setdefault(lab, []).append(txt)
    teach = sorted(int(k) for k in by if k.isdigit())
    n_teach = len(secs) - 2                      # last two are check + stickers
    if keep is None:
        keep = list(range(1, n_teach + 1))
    checkno, stickno = n_teach + 1, n_teach + 2

    adds = ADDONS.get(key, [])
    total = len(keep) + len(adds)

    # ---- body ----
    out_secs, add_blks = [], []
    for new, old in enumerate(keep, start=1):
        s = secs[old - 1]
        s = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % new, s, count=1)
        s = s.replace('id="ask%d"' % old, 'id="ask%d"' % new)
        out_secs.append(s)
    for i, (dno, _st, _q) in enumerate(adds):
        sec, blk = donor_slide(dno, len(keep) + i + 1)
        out_secs.append(sec)
        add_blks.append(blk)
    for extra, newno in ((checkno, total + 1), (stickno, total + 2)):
        s = secs[extra - 1]
        s = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newno, s, count=1)
        out_secs.append(s)
    new_body = head + "\n".join(out_secs) + tail

    # ---- slides js ----
    parts = [pre]
    for new, old in enumerate(keep, start=1):
        blk = by[str(old)][0]
        blk = re.sub(r"\bfinish\(\s*%d\s*," % (old - 1), "finish(%d," % (new - 1), blk)
        parts.append(blk)
    parts.extend(add_blks)
    # check block, with its quiz partitioned and the addons' own items appended
    chk = by[str(checkno)][0]
    m, items = quiz_items(chk)
    if keepq is None:
        keepq = list(range(1, len(items) + 1))
    picked = [items[i - 1] for i in keepq] + [q for _n, _s, q in adds]
    chk = chk[: m.start(2)] + "\n    " + ",\n    ".join(picked) + chk[m.end(2):]
    chk = re.sub(r"\bfinish\(\s*%d\s*," % (checkno - 1), "finish(%d," % total, chk)
    parts.append(chk)
    # stickers, one per teaching slide
    stk = by[str(stickno)][0]
    sm = re.search(r"(const STICKERS = \[)(.*?)(\];)", stk, re.S)
    assert sm, "no STICKERS array"
    allst = [s.strip() for s in re.findall(r'"[^"]*"', sm.group(2))]
    picked_st = [allst[o - 1] for o in keep if o - 1 < len(allst)]
    while len(picked_st) < len(keep):
        picked_st.append('"\\u2b50"')
    picked_st += ['"%s"' % st for _n, st, _q in adds]
    assert len(picked_st) == total, "STICKERS must be parallel to done[]: %d vs %d" % (len(picked_st), total)
    stk = stk[: sm.start(2)] + " " + ", ".join(picked_st) + " " + stk[sm.end(2):]
    stk = re.sub(r"\bfinish\(\s*%d\s*," % (stickno - 1), "finish(%d," % (total + 1), stk)
    parts.append(stk)
    # your-turn panels that belong to a kept slide
    for lab, txt in blks:
        if lab != "ask":
            continue
        head_ask, kept_ask = txt.split("ask(", 1)
        chunks = ("ask(" + kept_ask).split("\n  ask(")
        chunks = [chunks[0]] + ["  ask(" + c for c in chunks[1:]]
        keptc = [head_ask]
        for c in chunks:
            mm = re.match(r"\s*ask\((\d+),", c)
            if not mm:
                continue
            old = int(mm.group(1))
            if old in keep:
                new = keep.index(old) + 1
                keptc.append(re.sub(r"ask\(\s*%d\s*," % old, "ask(%d," % new, c, count=1))
        if len(keptc) > 1:
            parts.append("".join(keptc))
    return new_body, "".join(parts)


def main():
    written = 0
    for key, title, srckey, keep, keepq in STRUCTURE:
        body, js = compose(key, title, srckey, keep, keepq)
        # Catch a name collision HERE rather than as a node --check error on the
        # built page two steps later. All slide code shares one scope, so a repeat
        # breaks the whole lesson at load.
        seen, dup = set(), []
        for n in declared_names(js):
            (dup.append(n) if n in seen else seen.add(n))
        assert not dup, "%s: duplicate top-level declaration(s): %s" % (key, sorted(set(dup)))
        io.open(os.path.join(HERE, "c-%s-body.html" % key), "w", encoding="utf-8").write(body)
        io.open(os.path.join(HERE, "c-%s-slides.js" % key), "w", encoding="utf-8").write(js)
        n = body.count('<section class="slide"')
        print("  %-9s %-30s %d slides (%d teaching) from %s"
              % (key, title, n, n - 2, srckey))
        written += 1
    print("\n%d lesson sources composed (c-*-body.html, c-*-slides.js)" % written)


if __name__ == "__main__":
    main()
