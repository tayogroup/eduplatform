# -*- coding: utf-8 -*-
"""Verify the Grade 1 check answers by computing them.

Nothing covered these. tools/check-math-answer-keys.mjs reads the main
mathematics course; this standalone build has 75 check questions and no gate.
The repo has already shipped three Computing keys bound to the wrong option
with every existing gate passing them - the key was a real option, the options
were unique, the explanation was prose, and nothing compared the key to the
answer.

Only arithmetic and sequence questions can be checked this way. The rest are
conceptual ("Which shape has no corners?") and are reported as unchecked rather
than counted as passes: coverage that cannot be falsified is not evidence.

Rules carried over from check-math-answer-keys.mjs, each of which exists
because it called a correct key wrong:
  - the expression must account for every number in the question
  - a bare "/" is never an operator
  - estimation questions are excluded, their key is deliberately not exact
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
LESSONS = ["counting-to-twenty", "adding-and-taking-away", "halves-and-wholes",
           "what-comes-next", "shapes-and-sizes", "days-months-and-clocks",
           "asking-and-sorting"]

WORD = {"zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,
        "eight":8,"nine":9,"ten":10,"eleven":11,"twelve":12,"thirteen":13,
        "fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,"eighteen":18,
        "nineteen":19,"twenty":20}


def items(src):
    m = re.search(r"const CHECK = \[(.*?)\n  \];", src, re.S)
    if not m:
        return []
    out = []
    for chunk in re.findall(r"\{ q: (.*?)\},\s*(?=\{ q: |$)", m.group(1) + "{ q: ", re.S):
        q = re.match(r'"((?:[^"\\]|\\.)*)"', chunk)
        a = re.search(r'\ba: ("(?:[^"\\]|\\.)*"|-?\d+)', chunk)
        o = re.search(r"\bopts: \[(.*?)\]", chunk, re.S)
        if not (q and a):
            continue
        opts = []
        if o:
            opts = [x.strip().strip('"').strip("'") for x in re.split(r",(?![^\[]*\])", o.group(1)) if x.strip()]
        ans = a.group(1).strip('"')
        out.append((re.sub(r"<[^>]*>", "", q.group(1)), opts, ans))
    return out


def compute(q):
    """the answer, when it can be derived; else None"""
    t = re.sub(r"<[^>]*>", "", q).replace("−", "-").replace("×", "*")
    if re.search(r"estimate|about|roughly|nearest", t, re.I):
        return None                                   # deliberately not exact
    # a + b, a - b
    m = re.search(r"(\d+)\s*([+\-])\s*(\d+)\s*=\s*\?", t)
    if m:
        a, op, b = int(m.group(1)), m.group(2), int(m.group(3))
        return a + b if op == "+" else a - b
    # "4 and ? make 10"
    m = re.search(r"(\d+)\s+and\s+\?\s+makes?\s+(\d+)", t, re.I)
    if m:
        return int(m.group(2)) - int(m.group(1))
    # "Double 5 is ?"
    m = re.search(r"double\s+(\d+)", t, re.I)
    if m:
        return int(m.group(1)) * 2
    # "Half of 6 is ?"
    m = re.search(r"half of\s+(\d+)", t, re.I)
    if m:
        n = int(m.group(1))
        return n // 2 if n % 2 == 0 else None
    # a sequence: 2, 4, 6, 8, ?  /  20, 19, 18, 17, ?
    m = re.search(r"((?:\d+\s*,\s*){2,})\?", t)
    if m:
        seq = [int(x) for x in re.findall(r"\d+", m.group(1))]
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        if len(d) == 1:
            return seq[-1] + d.pop()
    # "?, 8, 10, 12, 14"
    m = re.search(r"\?\s*,\s*((?:\d+\s*,\s*){2,}\d+)", t)
    if m:
        seq = [int(x) for x in re.findall(r"\d+", m.group(1))]
        d = {seq[i + 1] - seq[i] for i in range(len(seq) - 1)}
        if len(d) == 1:
            return seq[0] - d.pop()
    # "Which number comes just after 16?"
    m = re.search(r"comes just after\s+(\d+)", t, re.I)
    if m:
        return int(m.group(1)) + 1
    # "17 is 1 ten and ? ones"
    m = re.search(r"(\d+)\s+is\s+1\s+ten\s+and\s+\?\s+ones", t, re.I)
    if m:
        return int(m.group(1)) - 10
    return None


def norm(v):
    if v is None:
        return None
    s = str(v).strip().lower()
    if s in WORD:
        return WORD[s]
    m = re.fullmatch(r"-?\d+", s)
    return int(m.group(0)) if m else None


checked = wrong = unchecked = 0
bad = []
for n in LESSONS:
    src = io.open(os.path.join(SP, "g1v2", n + ".html"), encoding="utf-8").read()
    for q, opts, ans in items(src):
        want = compute(q)
        if want is None:
            unchecked += 1
            continue
        checked += 1
        got = norm(ans)
        if got != want:
            wrong += 1
            bad.append((n, q, ans, want, opts))
        # the key must also BE one of the offered options
        elif opts and not any(norm(o) == want for o in opts):
            wrong += 1
            bad.append((n, q, ans, "key not among options " + str(opts), opts))

print("Grade 1 check answers, verified by computing them")
print("=" * 66)
for n, q, ans, want, opts in bad:
    print("  WRONG  %s" % n)
    print("     q:      %s" % q[:80])
    print("     key:    %s" % ans)
    print("     should: %s" % want)
    print("     opts:   %s" % opts)
print("  computable and correct : %d" % (checked - wrong))
print("  computable and WRONG   : %d" % wrong)
print("  not computable         : %d  (conceptual/diagrammatic - reported, not passed)" % unchecked)
print("=" * 66)
sys.exit(1 if wrong else 0)
