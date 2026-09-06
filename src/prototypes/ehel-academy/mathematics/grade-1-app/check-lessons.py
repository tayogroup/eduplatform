# -*- coding: utf-8 -*-
"""Validate the composed seven-lesson set before it goes anywhere near a browser."""
import re, io, os, subprocess, sys

SP = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.join(SP, "g1v2")
FILES = ["counting-to-twenty.html", "adding-and-taking-away.html",
         "halves-and-wholes.html", "what-comes-next.html",
         "shapes-and-sizes.html", "days-months-and-clocks.html",
         "asking-and-sorting.html"]
bad = 0
for f in FILES:
    p = os.path.join(V2, f)
    if not os.path.exists(p):
        p = os.path.join(SP, f)                       # the two unchanged lessons
    s = io.open(p, encoding="utf-8").read()
    slides = re.findall(r'<section[^>]*class="[^"]*slide[^"]*"[^>]*>(.*?)</section>', s, re.S)
    js = " ".join(re.findall(r"<script[^>]*>(.*?)</script>", s, re.S))

    # 1 syntax
    tmp = os.path.join(SP, "_syn.mjs")
    io.open(tmp, "w", encoding="utf-8").write(js)
    r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
    syn = "ok" if r.returncode == 0 else "PARSE FAIL"

    # 2 badges run 1..n with no gaps
    badges = [int(x) for x in re.findall(r'<span class="n">(\d+)</span>', s)]
    n_teach = len(slides) - 2      # the check page and sticker page carry no badge
    seq = "ok" if badges == list(range(1, n_teach + 1)) else "BADGES %s want 1..%d" % (badges[:9], n_teach)

    # 3 finish() indices used
    fins = sorted(set(int(x) for x in re.findall(r"finish\((\d+)", js)))
    # done[] spans the teaching slides plus the check page; blocks legitimately
    # differ in whether they call finish() with a literal, so only the range binds
    lim = len(slides) - 2
    fin = "ok" if (fins and min(fins) >= 0 and max(fins) <= lim) else "finish=%s out of 0..%d" % (fins, lim)

    # 4 stickers parallel to done[]
    m = re.search(r"const STICKERS = \[(.*?)\];", js, re.S)
    nst = len(re.findall(r'\["', m.group(1))) if m else -1
    sl = re.search(r"done\.slice\(0, ?(\d+)\)", js)
    slice_n = int(sl.group(1)) if sl else (len(slides) - 1)
    stick = "ok" if nst == len(slides) - 1 and slice_n == len(slides) - 1 \
        else "STICKERS=%d slice=%d slides-1=%d" % (nst, slice_n, len(slides) - 1)

    # 5 check items
    cm = re.search(r"const CHECK = \[(.*?)\n  \];", js, re.S)
    nchk = len(re.findall(r"\{ q: ", cm.group(1))) if cm else 0

    # 6 every id the js reaches for must exist in the markup
    declared = set(re.findall(r'id="([A-Za-z0-9_-]+)"', s))
    touched = set(re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', js))
    missing = sorted(touched - declared)
    ids = "ok" if not missing else "DANGLING %s" % missing[:10]

    ok = all(x == "ok" for x in (syn, seq, fin, stick, ids))
    if not ok:
        bad += 1
    print("%s %-30s %2d slides  check=%-3d | %s | %s | %s | %s | %s"
          % ("  " if ok else "XX", f, len(slides), nchk, syn, seq, fin, stick, ids))
print("\n%s" % ("all seven lessons pass" if not bad else "%d lesson(s) FAILED" % bad))
sys.exit(1 if bad else 0)
