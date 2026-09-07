# -*- coding: utf-8 -*-
"""Split the two bespoke lesson checkers to match the eight lessons.

The assertions themselves are NOT rewritten. Each checker is a run of
`// ---- slide N ---- / await go(N)` sections, and the split preserved every
element id (fb12, ch14, ...), so a section keeps working wherever its step
landed. What changes is which file the checker opens, which sections it keeps,
and the index each go() asks for.

That matters because these are the only checks that recompute the maths
independently of what the page claims - the ones that caught a subtraction
under-reporting its exchanges and a rounding step keying the wrong option. A
generic "click the right answer" sweep would have replaced them with something
that cannot fail for the right reason.
"""
import io
import os
import re

os.chdir(os.path.dirname(os.path.abspath(__file__)))

SEC = re.compile(r"^// ---- .*$", re.M)


def sections(text):
    """-> (header, [(text, first_go_index_or_None), ...])"""
    marks = [m.start() for m in SEC.finditer(text)]
    header = text[:marks[0]]
    out = []
    for i, s in enumerate(marks):
        e = marks[i + 1] if i + 1 < len(marks) else len(text)
        body = text[s:e]
        m = re.search(r"await go\((\d+)\)", body)
        out.append((body, int(m.group(1)) if m else None))
    return header, out


def port(src, dest, lesson, keep, remap, stickers, shelf_min):
    text = io.open(src, encoding="utf-8").read()
    header, secs = sections(text)
    header = re.sub(r'const LESSON = "[^"]+";', 'const LESSON = "%s";' % lesson, header)

    body = ""
    for sec, idx in secs:
        tag = sec.splitlines()[0]
        keepit = idx in keep if idx is not None else ("stickers" in tag or "responsive" in tag or "done" in tag)
        if not keepit:
            continue
        if idx is not None:
            sec = re.sub(r"await go\((\d+)\)", lambda m: "await go(%d)" % remap[int(m.group(1))], sec)
        body += sec

    body = re.sub(r"if \(g\.n !== \d+\)", "if (g.n !== %d)" % stickers, body)
    body = re.sub(r"if \(g\.got < \d+\)", "if (g.got < %d)" % shelf_min, body)
    io.open(dest, "w", encoding="utf-8", newline="").write(header + body)
    print("  %-22s <- %s  (%d sections, %d stickers)" % (dest, src, body.count("// ---- "), stickers))


# --- old lesson 1 -> up-to-a-thousand (steps 1-11) + adding-and-money (12-17)
port("check-l1.mjs", "_new-l1.mjs", "up-to-a-thousand.html",
     keep={0, 1, 5, 6, 7, 9, 17}, remap={0: 0, 1: 1, 5: 5, 6: 6, 7: 7, 9: 9, 17: 11},
     stickers=13, shelf_min=5)
port("check-l1.mjs", "_new-l2.mjs", "adding-and-money.html",
     keep={11, 16, 17}, remap={11: 0, 16: 5, 17: 6},
     stickers=8, shelf_min=2)

# Old lesson 4's checker is NOT split here. It uses a different section comment
# style and two parameterised go() calls (a whole-deck loop, and the UNITS
# table), so an automatic split would either drop its measure assertions or
# retarget them silently. Left to check-runtime.mjs plus a hand port - recorded
# in the README as owed rather than quietly lost.
