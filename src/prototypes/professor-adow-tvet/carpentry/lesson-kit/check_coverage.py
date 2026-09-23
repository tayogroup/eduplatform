#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The coverage gate, run on the BUILT pages.

    python check_coverage.py --app ../tools-and-joints-app

Reads the criterion codes back out of the emitted HTML (data-criteria),
not out of the content source, so a step that is dropped or fails to
render takes its claim with it. That is the whole reason the Science kit
checks built pages rather than source, and the reason is worth repeating
here: the source says what was intended, the page says what shipped.

WHAT THIS PROVES, AND — MORE IMPORTANTLY — WHAT IT DOES NOT.

It proves that every code claimed by a page exists in the standards, and
it reports how much of each module the build reaches. It does NOT prove
the step teaches the criterion. This repo has the worked example: an
English level reported a clean 176/176 objectives cited while one of
them, on pronunciation and stress, had ZERO occurrences of `intonation`,
`stress` or `schwa` across twenty units. A coverage number means every
criterion has a citation. It never means anything is taught.

So this gate also prints a KEYWORD PROBE: for criteria whose subject can
be named in a word, it greps the built page for that word and reports
what it finds. A criterion cited by a page that never says its central
word is the exact shape of that failure, and the probe makes it visible
rather than leaving it for someone to notice a year later.
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
STANDARDS = os.path.join(REPO, "src", "curriculum", "adow-carpentry-foundation.json")

# Criterion -> the words a page must actually use if it teaches it.
# Deliberately short and deliberately incomplete: a probe that guesses is
# worse than no probe. Absent from this map means "not probed", which is
# reported as such rather than counted as a pass.
PROBES = {
    "ADOW-CJ-TJ.02.1": ["face side", "face edge"],
    "ADOW-CJ-TJ.02.2": ["try square", "shoulder"],
    "ADOW-CJ-TJ.02.3": ["gauge"],
    "ADOW-CJ-TJ.02.4": ["waste"],
    "ADOW-CJ-TJ.03.1": ["waste side", "kerf"],
    "ADOW-CJ-TJ.05.1": ["dry"],
    "ADOW-CJ-TJ.05.2": ["tight", "slack"],
    "ADOW-CJ-TJ.05.3": ["diagonal"],
    "ADOW-CJ-CF.01.2": ["stock", "blade"],
    "ADOW-CJ-CF.01.3": ["tenon saw", "rip saw"],
    "ADOW-CJ-CF.03.1": ["eye protection"],
    "ADOW-CJ-CF.03.2": ["cramp"],
    "ADOW-CJ-CF.04.3": ["plane"],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app", required=True)
    args = ap.parse_args()
    app_dir = os.path.abspath(os.path.join(os.getcwd(), args.app))

    with open(STANDARDS, encoding="utf-8") as fh:
        fw = json.load(fh)
    with open(os.path.join(app_dir, "app.config.json"), encoding="utf-8") as fh:
        cfg = json.load(fh)

    published = {}
    for mod in fw["modules"]:
        for unit in mod["units"]:
            for c in unit["criteria"]:
                published[c["code"]] = (mod["title"], unit["code"], c["assessmentMode"])

    pages = [f for f in os.listdir(app_dir)
             if f.endswith(".html") and f != cfg["hub"]]
    if not pages:
        sys.exit("NOT CHECKED: no built lesson pages in %s — run build.py first." % app_dir)

    claimed = {}
    problems = []
    for page in sorted(pages):
        with open(os.path.join(app_dir, page), encoding="utf-8") as fh:
            html = fh.read()
        text = re.sub(r"<[^>]+>", " ", html).lower()
        codes = set()
        for m in re.finditer(r'data-criteria="([^"]*)"', html):
            for code in m.group(1).split(","):
                if code:
                    codes.add(code)
        if not codes:
            problems.append("%s claims no criteria at all" % page)
        for code in sorted(codes):
            if code not in published:
                problems.append("%s claims %s, which the standards do not publish" % (page, code))
                continue
            claimed.setdefault(code, []).append(page)
            for word in PROBES.get(code, []):
                if word.lower() not in text:
                    problems.append(
                        "%s claims %s but never uses the word %r — a citation is not teaching"
                        % (page, code, word))

    print("Built pages: %d" % len(pages))
    total = len(published)
    print("Criteria claimed by the build: %d of %d" % (len(claimed), total))

    probed = [c for c in claimed if c in PROBES]
    print("Of those, keyword-probed: %d; NOT probed: %d (absence of a probe is "
          "not a pass)" % (len(probed), len(claimed) - len(probed)))

    for mod in fw["modules"]:
        got = sum(1 for u in mod["units"] for c in u["criteria"] if c["code"] in claimed)
        n = sum(len(u["criteria"]) for u in mod["units"])
        print("  %-26s %d of %d" % (mod["title"], got, n))

    if problems:
        print("\nPROBLEMS")
        for p in problems:
            print("  x " + p)
        sys.exit(1)
    print("\nCoverage check passed. This says every claim is real and every probed "
          "criterion's words appear. It does not say the teaching is good.")


if __name__ == "__main__":
    main()
