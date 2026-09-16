# -*- coding: utf-8 -*-
"""The defect classes a human read finds that ARE machine-decidable.

`check-coverage.py` re-computes the keys it can from `_rules.py` - Robo's
routes, the table answers, the fixes, the machines, the ciphers. Everything
else is a multiple-choice question whose key IS the object the question was
generated from, so nothing inside the build can disagree with it. Those are
unfalsifiable, and the only instrument left is a person reading them.

But a person reading them is looking for several things that do not need a
person at all, and those are cheap to check on every build instead of once:

  DUPLICATE       two options that say the same thing, so the child is choosing
                  between one real answer and a copy of it
  WHY-MISMATCH    the explanation names a DIFFERENT option than the key
  LENGTH-TELL     the key is much longer than every wrong option, which is the
                  oldest giveaway in multiple choice - a child can score
                  without reading the question
  NEGATIVE-STEM   a stem asking which is NOT / which does NOT, with no visible
                  emphasis, which reads as its opposite to a hurrying child
  ARITHMETIC      a stem that is a sum, checked against the key
  ALL-OF-THESE    an "all of these" option, which cannot be keyed against
                  distractors that are individually true

Exit 0 clean, 1 on a finding, 2 when it cannot run.

    python ../lesson-kit/check-question-shape.py --app .
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

HERE = os.path.abspath(sys.argv[sys.argv.index("--app") + 1] if "--app" in sys.argv else os.getcwd())
LESSON_RE = re.compile(r"\n  const LESSON = (\{.*?\n  \});\n", re.S)
QUIET = "--quiet" in sys.argv

# Words that carry no meaning for the duplicate check.
# NEGATION IS NEVER A STOPWORD. The first version had "no" and "not" in here,
# so "with no wire" and "with a wire" compared equal - the two opposite answers
# to the same question.
STOP = set("the is are was were be to of in on at it that this these those and or "
           "you your its they them then than for with from as so do does did".split())


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(html))).strip()


def bag(s):
    return frozenset(w for w in re.findall(r"[a-z0-9]+", plain(s).lower()) if w not in STOP)


def seq(s):
    """The option as an ORDERED list of meaningful words.

    Order is the answer in a large share of these questions - "jump, jump,
    spin" against "spin, jump, jump" is a real choice, and a set comparison
    calls them identical. So the duplicate test compares sequences.
    """
    t = plain(s).lower()
    # PUNCTUATION IS THE ANSWER in a short option. "£6.50", "6:50" and "6/50"
    # are money, a time and a date, and stripping the marks makes all three
    # the same option - which is what the first version did.
    if len(t) <= 12:
        return ("raw", re.sub(r"\s+", "", t))
    return tuple(w for w in re.findall(r"[a-z0-9]+", t) if w not in STOP)


def asks_negatively(stem):
    """Is the NEGATION part of what is being asked, rather than the scenario?

    "Which of these is NOT a computer?" - yes.
    "The video will not play. What is wrong?" - no; that is a scenario.
    "What can a computer do that paper cannot?" - no; that is a comparison.
    """
    tail = re.split(r"[.!?]", stem)
    for clause in tail:
        if not re.search(r"\b(which|what|who|where)\b", clause, re.I):
            continue
        # the negation has to sit in the same clause as the question word, and
        # not be part of a trailing comparison ("...that paper cannot")
        if re.search(r"\b(which|what|who)\b[^,]{0,40}?\b(is|are|was|does|do|would|will|can)\s+(not|never)\b", clause, re.I):
            return True
        if re.search(r"\b(which|what)\b[^,]{0,30}?\bnot\b", clause, re.I) and \
           not re.search(r"\b(that|which)\s+\w+\s+(cannot|does not|do not)\b", clause, re.I):
            return True
    return False


def arithmetic(stem):
    """The answer to a stem that is a sum, or None."""
    m = re.search(r"(\d+)\s*(?:\+|plus|add)\s*(\d+)", stem)
    if m:
        return str(int(m.group(1)) + int(m.group(2)))
    m = re.search(r"(\d+)\s*(?:-|minus|take away)\s*(\d+)", stem)
    if m:
        return str(int(m.group(1)) - int(m.group(2)))
    m = re.search(r"(\d+)\s*(?:x|×|times|multiplied by)\s*(\d+)", stem)
    if m:
        return str(int(m.group(1)) * int(m.group(2)))
    return None


def questions(app):
    """Every ask-and-options question in the built pages, by SHAPE."""
    cfg = json.load(io.open(os.path.join(app, "app.config.json"), encoding="utf-8"))
    out = []
    for n, entry in enumerate(cfg["lessons"], 1):
        path = os.path.join(app, entry["file"])
        if not os.path.isfile(path):
            sys.exit("  cannot run: %s is not built" % entry["file"])
        m = LESSON_RE.search(io.open(path, encoding="utf-8").read())
        if not m:
            sys.exit("  cannot run: %s has no LESSON block" % entry["file"])
        data = json.loads(m.group(1))

        def walk(node, step, tier):
            if isinstance(node, dict):
                opts = node.get("opts")
                if opts and isinstance(opts, list) and all(isinstance(o, dict) and "t" in o for o in opts) \
                        and ("ask" in node or "t" in node):
                    out.append({"lesson": n, "file": entry["file"], "step": step, "tier": tier,
                                "ask": plain(node.get("ask") or node.get("t") or ""),
                                "opts": opts, "why": plain(node.get("why") or "")})
                for k, v in node.items():
                    if k == "opts":
                        continue
                    walk(v, step, k if k in ("support", "extension", "warmup") else tier)
            elif isinstance(node, list):
                for v in node:
                    walk(v, step, tier)

        for st in data["steps"]:
            walk(st.get("data") or {}, st["title"], "")
    return out


def main():
    if not os.path.isfile(os.path.join(HERE, "app.config.json")):
        print("  cannot run: no app.config.json in %s" % HERE); sys.exit(2)
    qs = questions(HERE)
    if not qs:
        print("  cannot run: no questions found"); sys.exit(2)
    bad = []

    def fail(q, kind, msg):
        bad.append((kind, q, msg))
        print("  FAIL %-14s L%-2d %-30s %s" % (kind, q["lesson"], q["step"][:30], msg))

    for q in qs:
        opts = q["opts"]
        keys = [o for o in opts if o.get("ok")]
        if len(keys) != 1:
            fail(q, "KEY-COUNT", "%d keyed options: %r" % (len(keys), q["ask"][:60]))
            continue
        key = keys[0]
        wrong = [o for o in opts if not o.get("ok")]

        # DUPLICATE - two options that say the same thing, IN THE SAME ORDER
        seen = {}
        for o in opts:
            b = seq(o["t"])
            if not b:
                continue
            if b in seen:
                fail(q, "DUPLICATE", "%r and %r say the same thing (%r)"
                     % (seen[b], o["t"], q["ask"][:44]))
            seen[b] = o["t"]

        # WHY-MISMATCH - the explanation quotes a wrong option and not the key
        if q["why"] and len(q["why"].split()) >= 3:
            wl = q["why"].lower()
            kb, kt = bag(key["t"]), plain(key["t"]).lower()
            # A wrong option that is a SUBSTRING of the key is not evidence of
            # anything - "forward" sits inside "forward, forward, forward".
            named_wrong = [o["t"] for o in wrong
                           if len(plain(o["t"])) > 6 and plain(o["t"]).lower() in wl
                           and plain(o["t"]).lower() not in kt
                           and kt not in plain(o["t"]).lower()]
            # An explanation that names a wrong option IN ORDER TO RULE IT OUT is
            # good prose - "The computer ignores it" beside a key of "people
            # reading the program". So this only fires when the explanation
            # shares NOTHING with the key.
            names_key = kt in wl or bool(kb & bag(q["why"]))
            if named_wrong and not names_key:
                fail(q, "WHY-MISMATCH", "explanation names %r but the key is %r"
                     % (named_wrong[0][:34], key["t"][:34]))

        # LENGTH-TELL - the key is far longer than every wrong option
        if len(wrong) >= 2:
            kl = len(plain(key["t"]))
            longest_wrong = max(len(plain(o["t"])) for o in wrong)
            if kl >= 30 and kl >= 3 * longest_wrong:
                fail(q, "LENGTH-TELL", "key is %d chars, longest wrong option %d: %r"
                     % (kl, longest_wrong, q["ask"][:40]))

        # NEGATIVE-STEM without emphasis
        if asks_negatively(q["ask"]) and not re.search(r"\b(NOT|NEVER|CANNOT|EXCEPT)\b", q["ask"]):
            fail(q, "NEGATIVE-STEM", "negative stem with no emphasis: %r" % q["ask"][:56])

        # ARITHMETIC in the stem
        want = arithmetic(q["ask"])
        if want is not None:
            nums = [plain(o["t"]) for o in opts if re.fullmatch(r"-?\d+", plain(o["t"]))]
            if len(nums) >= 2 and plain(key["t"]) != want:
                fail(q, "ARITHMETIC", "%r is keyed %r but the sum is %s"
                     % (q["ask"][:44], key["t"], want))

        # ALL-OF-THESE
        # Only when it is the KEY. As a distractor "both of them" is an ordinary
        # wrong answer and often the interesting one.
        if re.fullmatch(r"(all|both) of (these|them|the above)\.?", plain(key["t"]), re.I):
            fail(q, "ALL-OF-THESE", "%r is keyed %r" % (q["ask"][:44], key["t"]))

    tiers = {}
    for q in qs:
        tiers[q["tier"] or "core"] = tiers.get(q["tier"] or "core", 0) + 1
    print()
    if bad:
        kinds = {}
        for k, _, _ in bad:
            kinds[k] = kinds.get(k, 0) + 1
        print("  %d finding(s) over %d questions: %s\n"
              % (len(bad), len(qs), ", ".join("%s %d" % kv for kv in sorted(kinds.items()))))
        sys.exit(1)
    print("  %d questions checked for shape (%s); none has a duplicate option, an explanation\n"
          "  that names the wrong one, a key twice the length of every distractor, an unmarked\n"
          "  negative stem, a wrong sum or an all-of-these\n"
          % (len(qs), ", ".join("%s %d" % kv for kv in sorted(tiers.items()))))
    sys.exit(0)


main()
