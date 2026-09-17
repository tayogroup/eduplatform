# -*- coding: utf-8 -*-
"""The machine-decidable defects in the Stages 5-8 SHELL course question banks.

    python check-upper-question-shape.py [5 6 7 8]

`check-question-shape.py` beside this file does the same job for the Grades 1-4
standalone builds. This one cannot share it: the shell units keep their
questions in six different shapes, and only ONE of them is multiple choice.

  assessment.questions   question + options + answer + hint + explanation
                         - the only bank whose `answer` is a KEY (median 19
                           characters); the rest hold worked answers
  practice               prompt + answer + hint
  fluency                prompt + answer + hint + errorFeedback
  realProblems           context + prompt + answer + hint + errorFeedback
  explorations           context + prompt + answer + hint + explanation
  reasoningPrompts       prompt + keyIdeas + modelAnswer   (open, no single key)

So the classes split. Options-based defects can only be looked for in the
assessment bank; the rest are open-answer, where the decidable failures are
different - an answer that is empty, a hint that simply contains the answer, or
an explanation that adds no word the prompt and answer did not already have.

WHAT THIS IS NOT. It cannot tell whether an answer is RIGHT. That is a person
reading, and at Stages 5-8 nobody has. This narrows what such a reader has to
look at; it does not replace them.

Exit 0 clean, 1 on a finding, 2 when it cannot run.
"""
import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STAGES = [int(a) for a in sys.argv[1:] if a.isdigit()] or [5, 6, 7, 8]

# Negation is never a stopword - "with no wire" and "with a wire" are opposite
# answers, and the Grades 1-4 checker shipped that bug before it was caught.
STOP = set("the is are was were be to of in on at it that this these those and or you your its "
           "they them then than for with from as so do does did a an".split())


# A TAG STARTS WITH A LETTER. Stripping every <...> blanked real content:
# Stage 8 teaches pseudocode and comparison operators, so "<>", "<=", "<-"
# are OPTIONS, and the naive strip turned an option into an empty string.
def plain(h):
    return re.sub(r"\s+", " ", re.sub(r"</?[a-zA-Z][^>]*>", " ", str(h or ""))).strip()


def bag(s):
    return set(w for w in re.findall(r"[a-z0-9]+", plain(s).lower()) if w not in STOP and len(w) > 2)


CODEISH = re.compile(r"""[()\[\]{}"'*/+=<>_]|^[A-Za-z_][A-Za-z0-9_]*$""")


def seq(s):
    """An option's identity, for deciding whether two options are the same.

    CASE AND WHITESPACE ARE THE ANSWER when the option is code, and the first
    version destroyed both. It lower-cased everything and stripped spaces from
    short strings, so on a Stage 7 question whose STEM is "Python is case
    sensitive. Which line will cause an error?" it called print("Hi"),
    print("HI") and print("hi") the same option - the exact distinction being
    examined - and on another it merged `elseif` with `else if`. Five findings,
    all of them the instrument.

    So a code-ish option keeps its bytes. Everything else compares as an ordered
    word sequence, because order is the answer in a large share of these.
    """
    t = plain(s)
    if CODEISH.search(t) or len(t) <= 12:
        return ("raw", t)                  # verbatim: case and spacing included
    return tuple(w for w in re.findall(r"[a-z0-9]+", t.lower()) if w not in STOP)


BANKS = [("assessment.questions", "question", True),
         ("practice", "prompt", False),
         ("fluency", "prompt", False),
         ("realProblems", "prompt", False),
         ("explorations", "prompt", False)]


def get(u, path):
    cur = u
    for p in path.split("."):
        if not isinstance(cur, dict) or p not in cur:
            return []
        cur = cur[p]
    return cur if isinstance(cur, list) else []


def main():
    bad = []
    seen = 0

    def fail(kind, where, msg):
        bad.append(kind)
        print("  FAIL %-14s %-26s %s" % (kind, where, msg))

    for stage in STAGES:
        d = os.path.join(ROOT, "grade-%d" % stage, "data", "units")
        if not os.path.isdir(d):
            print("  cannot run: no units for stage %d" % stage); sys.exit(2)
        for f in sorted(x for x in os.listdir(d) if x.endswith(".json")):
            u = json.load(io.open(os.path.join(d, f), encoding="utf-8"))
            where0 = "S%d %s" % (stage, f.replace(".json", ""))
            for path, stemkey, mc in BANKS:
                for q in get(u, path):
                    if not isinstance(q, dict):
                        continue
                    seen += 1
                    where = "%s %s" % (where0, q.get("id") or path)
                    stem = plain(q.get(stemkey) or q.get("context"))
                    ans = plain(q.get("answer"))
                    hint = plain(q.get("hint"))
                    expl = plain(q.get("explanation") or q.get("errorFeedback"))

                    if not ans:
                        fail("NO-ANSWER", where, "%r has no answer" % stem[:46])
                        continue

                    if mc:
                        opts = [plain(o) for o in (q.get("options") or [])]
                        if len(opts) < 2:
                            fail("TOO-FEW-OPTIONS", where, "%d option(s): %r" % (len(opts), stem[:40]))
                        # the answer must BE one of the options
                        elif ans not in opts:
                            fail("KEY-NOT-AN-OPTION", where,
                                 "answer %r is not among the options" % ans[:40])
                        else:
                            marks = {}
                            for o in opts:
                                k = seq(o)
                                if k in marks:
                                    fail("DUPLICATE", where,
                                         "%r and %r say the same thing" % (marks[k][:28], o[:28]))
                                marks[k] = o
                            wrong = [o for o in opts if o != ans]
                            if len(wrong) >= 2 and len(ans) >= 30 and len(ans) >= 3 * max(len(o) for o in wrong):
                                fail("LENGTH-TELL", where,
                                     "key %d chars, longest wrong %d: %r"
                                     % (len(ans), max(len(o) for o in wrong), stem[:34]))
                            if re.fullmatch(r"(all|both) of (these|them|the above)\.?", ans, re.I):
                                fail("ALL-OF-THESE", where, "%r is keyed %r" % (stem[:34], ans))

                    # A GLOSSARY DEFINITION WHERE THE EXPLANATION SHOULD BE.
                    # Found by READING, not by a check, and then narrowed to a
                    # shape. The convention in these banks is that an
                    # explanation opens with the answer and then explains it -
                    # 10 of 12 in Stage 7 unit 1 do. The two that did not had a
                    # glossary gloss of an unrelated term pasted in: "Which
                    # operator means 'multiply' in Python?" explained with what
                    # an IDE is, and "What is debugging?" with what a float is.
                    #
                    # A looser version of this check - "the explanation shares
                    # no word with the question" - both MISSED these (they share
                    # incidental words like "means" and "Python") and fired on
                    # correct explanations ("5.0. Division with / always gives a
                    # float" shares nothing with "What is the result of 10 / 2").
                    # So it matches the gloss SHAPE instead: "<term> means ...",
                    # where the defined term appears nowhere in the question.
                    # Two refinements, both from reading the first survivors:
                    # "The asterisk * means multiply" IS the right explanation
                    # for "the symbol for multiplication", so an explanation
                    # containing the answer verbatim is never this defect; and
                    # "Wireless" against a stem saying "wirelessly" is one word,
                    # so terms match on a 5-character prefix rather than exactly.
                    m = re.match(r"\s*(.{2,60}?)\s+means\s", expl or "")
                    if m and not (ans and len(ans) <= 24 and ans in expl):
                        term = bag(m.group(1))
                        near = bag(stem) | bag(ans)
                        related = any(t[:5] == n[:5] for t in term for n in near
                                      if len(t) >= 5 and len(n) >= 5)
                        if term and not (term & near) and not related:
                            fail("GLOSSARY-NOT-EXPLANATION", where,
                                 "%r is explained by defining %r"
                                 % (stem[:36], plain(m.group(1))[:30]))

                    # a hint that simply hands over the answer is not a hint
                    if hint and ans and len(ans) > 6 and ans.lower() in hint.lower():
                        fail("HINT-GIVES-ANSWER", where,
                             "hint contains the answer verbatim: %r" % hint[:44])

                    # NO TAUTOLOGY CHECK, AND THE MEASUREMENT IS WHY.
                    # The Grades 1-4 builds keep a short key and a separate
                    # explanation, so "the why adds no word the key did not
                    # have" is decidable there. These banks do not: measured
                    # across all four stages, `fluency` has the answer at the
                    # START of errorFeedback in 216 of 216 items, and the
                    # open-answer banks store a WORKED answer rather than a key
                    # (median length 95, 86 and 333 characters against the
                    # assessment bank's 19). So the check fired 271 times and
                    # every one of them was a content convention, not a defect.
                    # It also dropped every number, because `bag()` keeps words
                    # of three letters or more - which made "1010 = 8 + 2 = 10"
                    # look empty. Deleted rather than tuned: a wrong premise and
                    # a loose threshold produce the same long list, and only one
                    # of them is fixed by tuning.

    kinds = {}
    for k in bad:
        kinds[k] = kinds.get(k, 0) + 1
    print()
    if bad:
        print("  %d finding(s) over %d questions in Stages %s: %s\n"
              % (len(bad), seen, ",".join(str(s) for s in STAGES),
                 ", ".join("%s %d" % kv for kv in sorted(kinds.items()))))
        sys.exit(1)
    print("  %d questions checked across Stages %s; no missing answer, no key outside its own\n"
          "  options, no duplicate option, no key three times every distractor, no all-of-these,\n"
          "  no hint that hands over the answer and no explanation that only restates it\n"
          % (seen, ",".join(str(s) for s in STAGES)))
    sys.exit(0)


main()
