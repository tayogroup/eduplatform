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

# out-key, title, source, ORDERED slide sequence, quiz items to keep
#
# The sequence is the teaching order and mixes both origins: an int is a slide of the
# source file, ("d", n) is Four Digits Strong's slide n. It has to be explicit because
# appending the donor slides put "Numbers to 10,000" third in Big Numbers, behind two
# slides that assume it -- a lesson whose foundation arrives after the things built on
# it. None means "the whole source, in its own order".
STRUCTURE = [
    ("bignum", "Big Numbers and Below Zero", "num",
     [("d", 1), 9, ("d", 2), 10], [8, 9]),
    ("patterns", "Patterns and Square Numbers", "num",
     [2, 3, 4, 5], [2, 3, 4, 5]),
    ("calc", "Ways to Calculate", "num",
     [1, 6, ("d", 6), 7, 8], [1, 6, 7, 10]),
    ("frac", "Parts of a Whole", "frac", None, None),
    ("time", "Telling the Time", "time", None, None),
    ("shape", "Shape and Measures", "shape",
     [1, 2, 3, ("d", 10), 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8, 9]),
    # Direction is taught before it is used, coordinates are introduced before the
    # order of the pair is argued about, and the mirror-on-the-edge case comes after
    # an ordinary reflection rather than before it.
    ("where", "Where Things Are", "shape",
     [("n", 1), ("n", 2), 9, ("n", 3), ("d", 11), ("n", 4), ("n", 5), 4, ("n", 6)], [10]),
    ("stats", "Asking, Sorting and Chance", "stats", None, None),
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
DONOR_EXTRAS = {
    1: ("\\U0001f522",
         '{ q: "How many hundreds are there in 4,072?", o: ["0", "4", "7"], a: 0,'
         ' w: "The hundreds place holds a 0. The 4 is thousands and the 7 is tens." }'),
    2: ("\\u2744\\ufe0f",
         '{ q: "It is 3\\u00b0C and it gets 5 degrees colder. What is the temperature?",'
         ' o: ["\\u22122\\u00b0C", "2\\u00b0C", "\\u22128\\u00b0C"], a: 0,'
         ' w: "Count back from 3 through zero: 2, 1, 0, \\u22121, \\u22122." }'),
    6: ("\\u2716\\ufe0f",
         '{ q: "Which of these is a factor pair of 24?", o: ["4 and 6", "5 and 5", "3 and 9"], a: 0,'
         ' w: "4 \\u00d7 6 = 24. A factor pair is two numbers that multiply to give the number." }'),
    10: ("\\U0001f4d0",
         '{ q: "An angle of 120\\u00b0 is:", o: ["Obtuse", "Acute", "A right angle"], a: 0,'
         ' w: "More than 90\\u00b0 but less than 180\\u00b0 is obtuse. Acute is under 90\\u00b0." }'),
    11: ("\\U0001f5fa\\ufe0f",
         '{ q: "In the coordinates (3, 5), what does the 3 tell you?",'
         ' o: ["How far along", "How far up", "Which square to shade"], a: 0,'
         ' w: "Go along first, then up. The first number is always the across one." }'),
}
DONOR_BODY, DONOR_JS = "g4-lesson-body.html", "g4-lesson.js"

# Slides written for THIS build rather than cut from an existing lesson, one pair of
# files per lesson (new-<key>-body.html / new-<key>-slides.js). They exist because the
# grade was thin: 42 teaching slides against Grade 2's 104 and Grade 3's 72, with
# several objectives sharing one slide where Grade 2 gives each skill its own. They
# need no id prefixing -- everything in them is already prefixed w -- and no your-turn
# panel, because each one judges the learner directly.
#   lesson -> {slide number in the new file: (sticker, quiz item)}
NEW_EXTRAS = {
    "where": {
        1: ("\\U0001f9ed",
            '{ q: "You face north and make a quarter turn clockwise. Which way now?",'
            ' o: ["East", "West", "South"], a: 0,'
            ' w: "The points run north, east, south, west, so one quarter turn moves you on one." }'),
        2: ("\\u2197\\ufe0f",
            '{ q: "Which point lies between south and west?", o: ["SW", "SE", "NW"], a: 0,'
            ' w: "Join the two names: south-west, written SW. The north or south part comes first." }'),
        3: ("\\U0001f6b6",
            '{ q: "From a square you go 3 east then 2 north. How far east are you?", o: ["3", "5", "1"], a: 0,'
            ' w: "Only the first move went east. Going north changes the row, not the column." }'),
        4: ("\\u2195\\ufe0f",
            '{ q: "Is (2, 6) the same place as (6, 2)?", o: ["No", "Yes", "Only on a big grid"], a: 0,'
            ' w: "The first number is along and the second is up, so swapping them moves the point." }'),
        5: ("\\u25fb\\ufe0f",
            '{ q: "A rectangle has corners at (1, 1) and (4, 3). What are the other two?",'
            ' o: ["(4, 1) and (1, 3)", "(1, 4) and (3, 1)", "(4, 4) and (1, 1)"], a: 0,'
            ' w: "The corners share their numbers: each one takes an along from one and an up from the other." }'),
        6: ("\\U0001fa9e",
            '{ q: "The mirror line runs along the edge of a shape. Where does the reflection sit?",'
            ' o: ["Touching the shape", "One square away", "On top of the shape"], a: 0,'
            ' w: "A square against the mirror has no distance to cross, so its partner sits right beside it." }'),
    },
}


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


def new_slide(key, no, newpos):
    """One slide written for this build, from new-<key>-{body.html,slides.js}.

    No id prefixing and no declaration renaming: everything in those files is already
    prefixed w, which is checked by the duplicate assertion in main() rather than
    assumed here."""
    body = io.open(os.path.join(HERE, "new-%s-body.html" % key), encoding="utf-8").read()
    js = io.open(os.path.join(HERE, "new-%s-slides.js" % key), encoding="utf-8").read()
    sec = re.split(r'(?=<section class="slide")', body)[1:][no - 1]
    marks = [(m.start(), int(m.group(1))) for m in re.finditer(r"/\* ---- (\d+):", js)]
    pos = [p for p, n in marks if n == no][0]
    nxt = [p for p, n in marks if n == no + 1]
    blk = js[pos:(nxt[0] if nxt else len(js))]
    pre = js[: marks[0][0]] if no == min(n for _p, n in marks) else ""
    sec = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newpos, sec, count=1)
    blk = re.sub(r"\bfinish\(\s*%d\s*," % (no - 1), "finish(%d," % (newpos - 1), blk)
    return sec, pre + blk


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

    seq = keep
    total = len(seq)
    newpos = {}          # source slide number -> its position in this lesson

    # ---- body and slide js, walked in the ORDERED sequence ----
    out_secs, slide_blks = [], []
    for new, item in enumerate(seq, start=1):
        if isinstance(item, tuple) and item[0] == "d":    # a Four Digits Strong slide
            sec, blk = donor_slide(item[1], new)
        elif isinstance(item, tuple) and item[0] == "n":  # a slide written for this build
            sec, blk = new_slide(key, item[1], new)
        else:
            newpos[item] = new
            sec = secs[item - 1]
            sec = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % new, sec, count=1)
            sec = sec.replace('id="ask%d"' % item, 'id="ask%d"' % new)
            blk = by[str(item)][0]
            blk = re.sub(r"\bfinish\(\s*%d\s*," % (item - 1), "finish(%d," % (new - 1), blk)
        out_secs.append(sec)
        slide_blks.append(blk)
    for extra, newno in ((checkno, total + 1), (stickno, total + 2)):
        s = secs[extra - 1]
        s = re.sub(r'(<span class="n">)\d+(</span>)', r"\g<1>%d\g<2>" % newno, s, count=1)
        out_secs.append(s)
    new_body = head + "\n".join(out_secs) + tail

    # ---- slides js ----
    parts = [pre] + slide_blks
    # check block, with its quiz partitioned and each donor slide's own item added
    chk = by[str(checkno)][0]
    m, items = quiz_items(chk)
    if keepq is None:
        keepq = list(range(1, len(items) + 1))
    picked = [items[i - 1] for i in keepq]
    picked += [DONOR_EXTRAS[d[1]][1] for d in seq if isinstance(d, tuple) and d[0] == "d"]
    picked += [NEW_EXTRAS[key][d[1]][1] for d in seq if isinstance(d, tuple) and d[0] == "n"]
    chk = chk[: m.start(2)] + "\n    " + ",\n    ".join(picked) + chk[m.end(2):]
    chk = re.sub(r"\bfinish\(\s*%d\s*," % (checkno - 1), "finish(%d," % total, chk)
    parts.append(chk)
    # stickers, one per teaching slide, in sequence order so they stay parallel to done[]
    stk = by[str(stickno)][0]
    sm = re.search(r"(const STICKERS = \[)(.*?)(\];)", stk, re.S)
    assert sm, "no STICKERS array"
    allst = [s.strip() for s in re.findall(r'"[^"]*"', sm.group(2))]
    picked_st = []
    for item in seq:
        if isinstance(item, tuple):
            table = DONOR_EXTRAS if item[0] == "d" else NEW_EXTRAS[key]
            picked_st.append('"%s"' % table[item[1]][0])
        else:
            picked_st.append(allst[item - 1] if item - 1 < len(allst) else '"\\u2b50"')
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
            if old in newpos:            # its slide survived; move the panel with it
                keptc.append(re.sub(r"ask\(\s*%d\s*," % old,
                                    "ask(%d," % newpos[old], c, count=1))
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
