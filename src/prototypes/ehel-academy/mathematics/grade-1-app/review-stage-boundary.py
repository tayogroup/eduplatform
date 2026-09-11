# -*- coding: utf-8 -*-
"""Review, not coverage: how much teaching each objective gets, and whether
anything strays above Stage 1.

validate-against-framework.py answers "does every objective have a home". It
cannot answer the two questions a curriculum reviewer would ask next:

  DEPTH        an objective met once in one slide is covered and not taught.
               Reported per objective so a reviewer can see where it is thin.

  OVER-REACH   a Stage 1 course that teaches Stage 2 content is wrong in a way
               coverage never reveals - it scores 36/36 and still confuses a
               five-year-old. The 0096 boundaries that bite at Stage 1:
                 fractions are HALVES only            (1Nf.01-.04; quarters and
                                                       thirds are 2Nf)
                 numbers run 0-20                     (1Nc.01, 1Ni.01/.05, 1Np.03)
                 ordinals stop at tenth               (1Np.04)
                 time is the hour and the half hour   (1Gt.03; quarter past/to is 2Gt)
                 doubles stop at double 10            (1Ni.06)
                 count BACK in ones and tens only     (1Nc.04 - not back in twos)
                 measurement is direct/non-standard   (1Gg.02/.04/.05; cm, g, l are 2Gg)
                 no multiplication or division        (2Ni)

False positives that are NOT over-reach and are excluded by construction:
  "quarter turn"  - rotation is 1Gg.07, and a quarter turn is how you teach it
  "third" in "first, second, third" - ordinals are 1Np.04
  numbers above 20 in a page's own furniture (years, clock minutes, prices in a
  currency, element ids) rather than in what the child is asked to work with
"""
import re, io, os, sys, html

SP = os.path.dirname(os.path.abspath(__file__))
LESSONS = ["counting-to-twenty", "adding-and-taking-away", "halves-and-wholes",
           "what-comes-next", "shapes-and-sizes", "days-months-and-clocks",
           "asking-and-sorting"]


def visible(src):
    """what a child can read: markup text plus JS string literals"""
    body = re.sub(r"<style[^>]*>.*?</style>", " ", src, flags=re.S | re.I)
    js = " ".join(re.findall(r"<script[^>]*>(.*?)</script>", body, re.S | re.I))
    markup = re.sub(r"<script[^>]*>.*?</script>", " ", body, flags=re.S | re.I)
    txt = html.unescape(re.sub(r"<[^>]*>", " ", markup))
    lits = re.findall(r'"([^"]{3,}?)"', js) + re.findall(r"'([^']{3,}?)'", js)
    lits = [x for x in lits if re.search(r"[a-z]{3}", x) and not re.match(r"^[#.\w-]+$", x)]
    return re.sub(r"\s+", " ", txt + " " + html.unescape(" ".join(lits)))


PROBES = [
 ("fractions beyond halves", r"\b(a |one )?(quarter|third)s? of\b|\bthree quarters\b|\bone third\b",
  r"quarter turn|turn.{0,12}quarter"),
 ("quarter past / quarter to", r"quarter (past|to)\b", None),
 ("standard units of length", r"\bcentimetres?\b|\bcm\b|\bmetres?\b(?! away)|\bmillimetres?\b", None),
 ("standard units of mass", r"\bgrams?\b|\bkilograms?\b|\bkg\b", None),
 ("standard units of capacity", r"\blitres?\b|\bmillilitres?\b|\bml\b", None),
 ("multiplication", r"\bmultiply\b|\btimes table\b|\blots of\b|×", None),
 ("division", r"\bdivide[sd]?\b|\bdivision\b|\bshared? between\b|÷", None),
 ("ordinals past tenth", r"\b(eleventh|twelfth|thirteenth|twentieth)\b", None),
 ("doubles past double 10", r"double (1[1-9]|[2-9]\d)\b", None),
 ("counting back in twos", r"back in twos|count back.{0,20}twos", None),
]

print("=" * 74)
print("Grade 1 Maths reviewed against the 0096 Stage 1 boundaries")
print("=" * 74)
print("\nOVER-REACH (content above Stage 1)\n")
found = 0
for label, pat, allow in PROBES:
    hits = []
    for n in LESSONS:
        t = visible(io.open(os.path.join(SP, "g1v2", n + ".html"), encoding="utf-8").read())
        for m in re.finditer(pat, t, re.I):
            ctx = re.sub(r"\s+", " ", t[max(0, m.start() - 55):m.end() + 55]).strip()
            if allow and re.search(allow, ctx, re.I):
                continue
            hits.append((n, ctx))
    if hits:
        found += len(hits)
        print("  FOUND  %s  (%d)" % (label, len(hits)))
        for n, c in hits[:3]:
            print("     %-24s ...%s..." % (n, c[:88]))
    else:
        print("  clear  %s" % label)

# numbers above 20 in what a child is asked to work with
print("\n  numbers above 20 offered to the learner:")
for n in LESSONS:
    t = visible(io.open(os.path.join(SP, "g1v2", n + ".html"), encoding="utf-8").read())
    big = sorted({int(x) for x in re.findall(r"(?<![\w.])(\d{2,3})(?![\w.])", t)
                  if 20 < int(x) < 200})
    # a year, a clock minute count and a sticker count are furniture, not maths
    big = [b for b in big if b not in (24, 30, 31, 60, 100, 2026, 2027)]
    print("     %-24s %s" % (n, big[:14] if big else "none above 20"))

print("\n" + "=" * 74)
print("no over-reach found" if not found else "%d possible over-reach hit(s) above" % found)
