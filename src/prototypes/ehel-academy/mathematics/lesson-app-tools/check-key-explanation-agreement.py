# -*- coding: utf-8 -*-
"""Does the explanation beside a key agree with it, and with itself?

    python check-key-explanation-agreement.py <rows.json>

WHAT THIS IS, AND WHAT IT IS NOT. The answer-key gate recomputes the keys it can
derive from the question. A human cold read judges whether a question is well
pitched and whether the explanation teaches. Between those sits a third thing
neither does: whether the key and the sentence printed beside it CONTRADICT EACH
OTHER.

That is worth a machine because it needs no opinion. "Take away the tens: 60
take away 30 is 30" is either arithmetic that holds or arithmetic that does not,
whatever anyone thinks of the question. And it is the one failure a self-review
is worst at, because the same hand wrote both halves in the same minute and the
eye slides over the agreement it expects.

It CANNOT replace the cold read. Everything about whether the question is right
for a seven-year-old, whether the distractors are the mistakes children actually
make, and whether an idea is wrong in the key AND the explanation in the same
way, is invisible here.

THE PREMISE IS THE THING TO DOUBT. Every check below reports what it MATCHED, so
a rule that fires 400 times is visibly a bad rule rather than 400 defects.
"""
import io, json, re, sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")
if len(sys.argv) != 2:
    sys.exit("usage: check-key-explanation-agreement.py <rows.json>")
ROWS = json.load(io.open(sys.argv[1], encoding="utf-8"))

WORD = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
        "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
        "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
        "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100}


def num(tok):
    tok = tok.strip().lower()
    if re.fullmatch(r"\d+", tok):
        return int(tok)
    return WORD.get(tok)


def nums_in(t):
    return [int(x) for x in re.findall(r"(?<![\w.])(\d{1,3})(?![\d.])", t)]


N = r"(\d{1,3}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)"

# Arithmetic a sentence ASSERTS. Each is (regex, how to combine) and each is
# checked only when every token parses as a number.
# CHAINS, NOT PAIRS. The first version of this rule was two-term, and on
# "2 and 1 and 2 make 5" the regex backtracked onto the trailing "1 and 2 make
# 5" and reported correct content as broken arithmetic. Three of its five
# findings were that bug. A chain pattern matched from the leftmost term sums
# every addend instead - which is what these explanations actually say.
# TWO GUARDS, both added after reading the false positives they caused:
#   "Halfway BETWEEN 10 and 20 is 15"      - a midpoint, not a sum
#   "two of them MAKE 20 and two make 30"  - the 20 ends the previous
#                                            clause; the chain is prose
# So the chain may not follow "between", nor begin immediately after a
# verb that already consumed a total.
# The \b matters as much as the lookbehinds: without it the engine may start
# mid-number. In "between 10 and 20 is 15" it began at the 0 of 10, which
# is not preceded by "between ", so the guard passed and it read
# "0 and 20 is 15". The boundary is what makes the lookbehind mean what it
# looks like it means.
NOT_AFTER = r"(?<!between )(?<!make )(?<!makes )(?<!is )(?<!are )\b"
CHAIN_ADD = re.compile(NOT_AFTER + r"(" + N + r"(?:\s+and\s+" + N
                       + r")+)\s+(?:make|makes|is|are)\s+" + N, re.I)

CLAIMS = [
    (re.compile(N + r"\s+add\s+" + N + r"\s+(?:is|are|makes|make)\s+" + N, re.I), "add"),
    (re.compile(N + r"\s+plus\s+" + N + r"\s+(?:is|are|makes|make)\s+" + N, re.I), "add"),
    (re.compile(N + r"\s+take\s+away\s+" + N + r"\s+(?:is|are|leaves|leave|makes|make)\s+" + N, re.I), "sub"),
    (re.compile(N + r"\s+minus\s+" + N + r"\s+(?:is|are|makes|make)\s+" + N, re.I), "sub"),
    (re.compile(N + r"\s+lots\s+of\s+" + N + r"\s+(?:is|are|makes|make)\s+" + N, re.I), "mul"),
    (re.compile(N + r"\s+times\s+" + N + r"\s+(?:is|are|makes|make)\s+" + N, re.I), "mul"),
    (re.compile(N + r"\s+groups?\s+of\s+" + N + r"\s+(?:is|are|makes|make)\s+" + N, re.I), "mul"),
    (re.compile(r"half\s+of\s+" + N + r"\s+(?:is|are)\s+" + N, re.I), "half"),
    (re.compile(N + r"\s+shared\s+(?:between|into)\s+" + N + r"\s+(?:is|are|gives)\s+" + N, re.I), "div"),
]

findings, matched = [], Counter()
for r in ROWS:
    keys = [o["t"] for o in r["opts"] if o["k"]]
    key = keys[0] if len(keys) == 1 else None
    why, ask = r["why"], r["ask"]
    where = "s%d %s · %s" % (r["stage"], r["lesson"], (r["step"] or "")[:28])

    # ---- 1. arithmetic the explanation asserts about itself ------------------
    for m in CHAIN_ADD.finditer(why):
        terms = [num(t) for t in re.findall(N, m.group(1), re.I)]
        total = num(m.groups()[-1])
        if any(t is None for t in terms) or total is None:
            continue
        matched["add-chain"] += 1
        if sum(terms) != total:
            findings.append(("arithmetic in the explanation does not hold", where,
                             r["ask"], m.group(0).strip(),
                             "%s = %d, not %d" % (" + ".join(str(t) for t in terms),
                                                  sum(terms), total)))
    for rx, op in CLAIMS:
        for m in rx.finditer(why):
            parts = [num(g) for g in m.groups()]
            if any(p is None for p in parts):
                continue
            matched[op] += 1
            if op == "half":
                a, c = parts
                ok = (a / 2 == c)
                expect = a / 2
            else:
                a, b, c = parts
                expect = {"add": a + b, "sub": a - b, "mul": a * b,
                          "div": (a / b if b else None)}[op]
                ok = expect is not None and expect == c
            if not ok:
                findings.append(("arithmetic in the explanation does not hold", where,
                                 r["ask"], m.group(0).strip(), "expected %s" % expect))

    # ---- 2. two options that are the same answer ----------------------------
    seen = {}
    for o in r["opts"]:
        norm = re.sub(r"[^a-z0-9]", "", o["t"].lower())
        if norm and norm in seen:
            findings.append(("two options are the same answer", where, r["ask"],
                             "%r and %r" % (seen[norm], o["t"]), ""))
        seen[norm] = o["t"]

    # ---- 3. exactly one key, and it is one of the options -------------------
    if r["opts"] and len(keys) != 1:
        findings.append(("not exactly one key", where, r["ask"],
                         "%d keyed of %d options" % (len(keys), len(r["opts"])), ""))

print("  %d rows read\n" % len(ROWS))
print("  what the arithmetic rules MATCHED (a rule that never fires is not a")
print("  clean bill of health, it is a rule that is not looking):")
for k, v in sorted(matched.items(), key=lambda x: -x[1]):
    print("     %-6s %4d claims checked" % (k, v))
print("     %-6s %4d total\n" % ("", sum(matched.values())))

by_kind = Counter(f[0] for f in findings)
print("  findings: %d" % len(findings))
for k, v in by_kind.most_common():
    print("     %3d  %s" % (v, k))
print()
for kind, where, ask, detail, extra in findings:
    print("  [%s]" % kind)
    print("     %s" % where)
    print("     Q: %s" % ask[:100])
    print("     > %s  %s" % (detail, extra))
    print()
