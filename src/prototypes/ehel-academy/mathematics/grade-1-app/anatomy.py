# -*- coding: utf-8 -*-
"""Anatomy of a lesson file, and the invariants a split depends on.

A lesson is: head (doctype..first slide) | slides | tail | one <script>.
The script is  prelude | activity blocks delimited by /* ---- N: title ---- */ .

Two things must hold before any slide can be moved:
  1. every activity block can be matched to exactly one slide, by the element
     ids it touches (the block numbers themselves are unreliable - up-to-twenty
     has two "2:" and two "14:")
  2. finish(i) inside a block equals that slide's 0-based index, because done[i]
     drives both the dot rail and the sticker shelf
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
LESSONS = ["up-to-twenty", "what-comes-next", "asking-and-sorting",
           "shapes-and-sizes", "halves-and-wholes"]
RE_SEC = re.compile(r"/\*\s*-+\s*\d+\s*:([^*]*?)-*\*/")


def parts(name):
    s = io.open(os.path.join(SP, name + ".html"), encoding="utf-8").read()
    ms = list(re.finditer(r'<section[^>]*class="[^"]*slide[^"]*"[^>]*>.*?</section>', s, re.S))
    head = s[:ms[0].start()]
    tail = s[ms[-1].end():]
    slides = [m.group(0) for m in ms]
    js = re.search(r"<script[^>]*>(.*?)</script>", tail, re.S)
    return s, head, slides, tail, js.group(1) if js else ""


def blocks(js):
    """[(title, text)] - the prelude is returned separately as index -1."""
    marks = [(m.start(), m.end(), m.group(1).strip()) for m in RE_SEC.finditer(js)]
    if not marks:
        return js, []
    out = []
    for i, (st, en, title) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(js)
        out.append((title, js[en:stop]))
    return js[:marks[0][0]], out


def ids_in(html):
    return set(re.findall(r'id="([A-Za-z0-9_-]+)"', html))


def ids_touched(code):
    return set(re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', code)) | \
           set(re.findall(r'getElementById\("([A-Za-z0-9_-]+)"\)', code))


for name in LESSONS:
    s, head, slides, tail, js = parts(name)
    prelude, bl = blocks(js)
    sids = [ids_in(x) for x in slides]
    titles = [re.search(r"<h2[^>]*>(.*?)</h2>", x, re.S) for x in slides]
    titles = [re.sub(r"<[^>]*>", "", t.group(1)).strip() if t else "?" for t in titles]
    print("\n%s  %d slides, %d activity blocks, head %d, prelude %d" %
          (name, len(slides), len(bl), len(head), len(prelude)))
    used, bad = {}, 0
    for bi, (btitle, code) in enumerate(bl):
        touched = ids_touched(code)
        best, score = None, 0
        for si, ids in enumerate(sids):
            ov = len(touched & ids)
            if ov > score:
                best, score = si, ov
        fin = sorted(set(int(x) for x in re.findall(r"finish\((\d+)", code)))
        ok = best is not None and (not fin or fin == [best])
        if not ok:
            bad += 1
        if best is not None:
            used.setdefault(best, []).append(bi)
        print("   %-2s %-46s -> slide %-3s %-26s finish=%s %s" %
              (bi, btitle[:46], (best + 1) if best is not None else "?",
               titles[best][:26] if best is not None else "", fin,
               "" if ok else "  <-- MISMATCH"))
    dupes = {k: v for k, v in used.items() if len(v) > 1}
    unmapped = [i + 1 for i in range(len(slides)) if i not in used]
    print("   slides with >1 block: %s | slides with no block: %s | finish mismatches: %d"
          % (dupes or "none", unmapped or "none", bad))
