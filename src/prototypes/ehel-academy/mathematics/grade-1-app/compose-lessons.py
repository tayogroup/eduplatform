# -*- coding: utf-8 -*-
"""Compose the seven-lesson Grade 1 structure from the five live lessons.

Each output lesson is built from ONE base file. That is a hard constraint,
not a simplification: the check arrays are not portable between files -
up-to-twenty writes  pic: 7  (a counter count), shapes-and-sizes writes
pic: '<svg...>'  and what-comes-next writes  beads: [...]  - each with its
own renderer. A slide grafted across files would arrive without its check
coverage and would need its CSS and ids rewritten too.

What the composer rewrites, all of which a split breaks if left alone:
  - the slide number badge   <span class="n">N</span>
  - finish(i), which sets done[i] and so drives BOTH the dot rail and the
    sticker shelf - i is the slide's 0-based index
  - the STICKERS array, which is parallel to done[]
  - done.slice(0, N), the one hardcoded slide count per file
  - the CHECK array, partitioned to the slides the lesson keeps
  - <title> and the topbar lesson name

Structure (teaching slides, excluding each lesson's check and sticker pages):
  1 Counting to Twenty        16   from up-to-twenty
  2 Adding and Taking Away     8   from up-to-twenty
  3 Halves and Wholes          8   unchanged
  4 What Comes Next           14   from what-comes-next, resequenced
  5 Shapes and Sizes          10   from shapes-and-sizes
  6 Days, Months and Clocks    4   from shapes-and-sizes
  7 Asking and Sorting        11   unchanged
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
RE_SEC = re.compile(r"/\*\s*-+\s*\d+\s*:([^*]*?)-*\*/")
RE_SUB = re.compile(r"/\*\s*-+\s*(check|stickers)\s*-+\s*\*/")


def bracket(s, i):
    """index just past the array literal starting at s[i] == '['"""
    d, q, esc = 0, None, False
    while i < len(s):
        c = s[i]
        if esc:
            esc = False
        elif q:
            if c == "\\":
                esc = True
            elif c == q:
                q = None
        elif c in "\"'":
            q = c
        elif c == "[":
            d += 1
        elif c == "]":
            d -= 1
            if d == 0:
                return i + 1
        i += 1
    raise ValueError("unbalanced")


def split_items(body):
    """top-level  { ... },  entries of an array literal"""
    out, d, q, esc, start = [], 0, None, False, None
    for i, c in enumerate(body):
        if esc:
            esc = False; continue
        if q:
            if c == "\\": esc = True
            elif c == q: q = None
            continue
        if c in "\"'":
            q = c; continue
        if c in "[{(":
            if d == 0 and c == "{": start = i
            d += 1
        elif c in "]})":
            d -= 1
            if d == 0 and c == "}":
                out.append(body[start:i + 1])
    return out


class Base:
    def __init__(self, name):
        self.name = name
        self.src = io.open(os.path.join(SP, name + ".html"), encoding="utf-8").read()
        ms = list(re.finditer(r'<section[^>]*class="[^"]*slide[^"]*"[^>]*>.*?</section>',
                              self.src, re.S))
        self.head = self.src[:ms[0].start()]
        self.slides = [m.group(0) for m in ms]
        self.tail = self.src[ms[-1].end():]
        sm = re.search(r"(<script[^>]*>)(.*?)(</script>)", self.tail, re.S)
        self.tail_pre = self.tail[:sm.start()] + sm.group(1)
        self.tail_post = sm.group(3) + self.tail[sm.end():]
        js = sm.group(2)

        marks = [(m.start(), m.end()) for m in RE_SEC.finditer(js)]
        self.prelude = js[:marks[0][0]]
        raw = []
        for i, (st, en) in enumerate(marks):
            stop = marks[i + 1][0] if i + 1 < len(marks) else len(js)
            raw.append(js[st:stop])
        # check / stickers may be their own top-level block, or nested in the last
        self.check_code = self.stick_code = None
        blocks = []
        for b in raw:
            t = RE_SEC.search(b).group(1).strip().lower()
            if t.startswith("check"):
                self.check_code = b; continue
            if t.startswith("stickers"):
                self.stick_code = b; continue
            blocks.append(b)
        if self.check_code is None:                       # nested in the last block
            last = blocks[-1]
            subs = list(RE_SUB.finditer(last))
            assert subs, "no check/stickers found in " + name
            cut = subs[0].start()
            blocks[-1] = last[:cut]
            rest = last[cut:]
            s2 = list(RE_SUB.finditer(rest))
            if len(s2) > 1:
                self.check_code = rest[:s2[1].start()]
                self.stick_code = rest[s2[1].start():]
            else:
                self.check_code = rest
        self.blocks = blocks                              # parallel to slides 1..n
        assert len(self.blocks) >= 1

        m = re.search(r"const CHECK = ", self.check_code)
        i = self.check_code.index("[", m.end())
        j = bracket(self.check_code, i)
        self.check_items = split_items(self.check_code[i + 1:j - 1])
        self.check_pre, self.check_post = self.check_code[:i + 1], self.check_code[j - 1:]

        m = re.search(r"const STICKERS = ", self.stick_code)
        i = self.stick_code.index("[", m.end())
        j = bracket(self.stick_code, i)
        self.stickers = split_items_sticker(self.stick_code[i + 1:j - 1])
        self.stick_pre, self.stick_post = self.stick_code[:i + 1], self.stick_code[j - 1:]


def split_items_sticker(body):
    out, d, q, esc, start = [], 0, None, False, None
    for i, c in enumerate(body):
        if esc: esc = False; continue
        if q:
            if c == "\\": esc = True
            elif c == q: q = None
            continue
        if c in "\"'": q = c; continue
        if c == "[":
            if d == 0: start = i
            d += 1
        elif c == "]":
            d -= 1
            if d == 0: out.append(body[start:i + 1])
    return out


def compose(base, keep, title, check_keep, out_name):
    """keep: 1-based slide numbers of the teaching slides, in the new order."""
    n_teach = len(keep)
    order = list(keep) + [len(base.slides) - 1, len(base.slides)]   # + check + stickers
    slides, blocks, stickers = [], [], []
    for new_i, old_n in enumerate(order):
        old_i = old_n - 1
        html = base.slides[old_i]
        html = re.sub(r'(<span class="n">)\d+(</span>)',
                      lambda m: m.group(1) + str(new_i + 1) + m.group(2), html, count=1)
        slides.append(html)
        # one sticker per earnable slide: the teaching slides and the check.
        # The sticker shelf itself is the last slide and earns nothing.
        if new_i < len(order) - 1:
            stickers.append(base.stickers[old_i])
        if old_i < len(base.blocks):
            code = base.blocks[old_i]
            code = re.sub(r"finish\(%d\b" % old_i, "finish(%d" % new_i, code)
            blocks.append(code)
    # the check slide's own finish() index
    chk = re.sub(r"finish\(\d+", "finish(%d" % n_teach, base.check_code)
    items = [base.check_items[i] for i in check_keep]
    chk = chk[:chk.index("[", chk.index("const CHECK = ")) + 1] + \
          "\n    " + ",\n    ".join(items) + ",\n  " + \
          base.check_post
    chk = re.sub(r"finish\(\d+", "finish(%d" % n_teach, chk)
    st = base.stick_pre + "\n    " + ",\n    ".join(stickers) + ",\n  " + base.stick_post
    st = re.sub(r"done\.slice\(0, ?\d+\)", "done.slice(0, %d)" % (n_teach + 1), st)

    head = base.head
    head = re.sub(r"<title>[^<]*</title>", "<title>%s</title>" % title, head)
    head = re.sub(r'(<div class="topbar-title"[^>]*>)[^<]*(</div>)',
                  lambda m: m.group(1) + title + m.group(2), head)
    head = re.sub(r"(<h1[^>]*>)[^<]*(</h1>)", lambda m: m.group(1) + title + m.group(2), head)

    js = base.prelude + "".join(blocks) + chk + st
    doc = head + "\n".join(slides) + base.tail_pre + js + base.tail_post
    io.open(os.path.join(SP, "g1v2", out_name), "w", encoding="utf-8", newline="").write(doc)
    return doc, n_teach


UP = Base("up-to-twenty")
WC = Base("what-comes-next")
SS = Base("shapes-and-sizes")

PLAN = [
 (UP, "counting-to-twenty.html", "Counting to Twenty",
  [1, 2, 3, 4, 5, 6, 23, 22, 25, 7, 8, 9, 24, 26, 10, 11],
  [0, 1, 2, 3, 4, 5, 6, 14, 21, 22, 23, 24, 25, 26, 27]),
 (UP, "adding-and-taking-away.html", "Adding and Taking Away",
  [12, 13, 14, 16, 15, 17, 18, 28],
  [7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 28]),
 (WC, "what-comes-next.html", "What Comes Next",
  [1, 2, 3, 6, 7, 4, 5, 8, 9, 10, 11, 12, 13, 14],
  list(range(15))),
 (SS, "shapes-and-sizes.html", "Shapes and Sizes",
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  list(range(13))),
 (SS, "days-months-and-clocks.html", "Days, Months and Clocks",
  [11, 12, 13, 14],
  [13, 14, 15, 16, 17]),
]

print("composing:")
for base, out, title, keep, chk in PLAN:
    doc, n = compose(base, keep, title, chk, out)
    print("  %-32s %-26s %2d teaching + check + stickers  %7d bytes"
          % (out, "from " + base.name, n, len(doc)))
print("\n  halves-and-wholes.html and asking-and-sorting.html are unchanged.")
