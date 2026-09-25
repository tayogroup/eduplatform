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
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))


def school_root(app_dir):
    here = app_dir
    for _ in range(6):
        if os.path.exists(os.path.join(here, "school.config.json")):
            return here
        here = os.path.dirname(here)
    sys.exit("NOT CHECKED: no school.config.json above %s" % app_dir)

# Criterion -> the words a page must actually use if it teaches it.
# Deliberately short and deliberately incomplete: a probe that guesses is
# worse than no probe. Absent from this map means "not probed", which is
# reported as such rather than counted as a pass.
PROBES = {
    # --- Digital Skills for the Workshop ---
    # One word per criterion that the TEACHING cannot avoid if it is really
    # there. Not a word from the criterion's own title, which a page can
    # satisfy by quoting itself: "embedded" is in the criterion AND is the
    # idea, whereas probing DS.01.6 for "shared" would pass on the step
    # heading alone, so it probes "log out" instead.
    # Home Repair, added 2026-09-25 with the tiling lesson. Each probe is a
    # word the LESSON must use, not a word the criterion uses: "goggles"
    # rather than "protective equipment", "bevel side down" rather than
    # "chisel technique". A probe that restates the criterion passes on the
    # criterion being copied into the page, which proves nothing.
    # HR.02, the tap lesson, added 2026-09-25.
    "ADOW-HR-HR.02.1": ["washerless"],
    "ADOW-HR-HR.02.2": ["run dry"],
    "ADOW-HR-HR.02.3": ["OPEN direction"],
    "ADOW-HR-HR.02.4": ["gland packing"],
    "ADOW-HR-HR.02.5": ["brass screw"],
    "ADOW-HR-HR.02.6": ["dress"],
    "ADOW-HR-HR.02.7": ["wound"],
    "ADOW-HR-HR.02.8": ["half a turn"],

    "ADOW-HR-HR.01.1": ["goggles"],
    "ADOW-HR-HR.01.2": ["masonry"],
    "ADOW-HR-HR.01.3": ["raked"],
    "ADOW-HR-HR.01.4": ["centre outwards"],
    "ADOW-HR-HR.01.5": ["bevel side down"],
    "ADOW-HR-HR.01.6": ["rocks"],
    "ADOW-HR-HR.01.7": ["sparingly"],
    "ADOW-HR-HR.01.8": ["curing"],

    "ADOW-DS-DS.01.1": ["output"],
    "ADOW-DS-DS.01.2": ["probe"],
    "ADOW-DS-DS.01.3": ["embedded"],
    "ADOW-DS-DS.01.4": ["compressor"],
    "ADOW-DS-DS.01.5": ["customer"],
    "ADOW-DS-DS.01.6": ["log out"],
    "ADOW-DS-DS.01.7": ["expected"],
    "ADOW-DS-DS.02.1": ["local network"],
    "ADOW-DS-DS.02.2": ["router"],
    "ADOW-DS-DS.02.3": ["interference"],
    "ADOW-DS-DS.02.4": ["guest"],
    "ADOW-DS-DS.02.5": ["reboot"],
    "ADOW-DS-DS.02.6": ["firewall"],
    "ADOW-DS-DS.02.7": ["sync"],
    "ADOW-DS-DS.03.1": ["intermittent"],
    "ADOW-DS-DS.03.2": ["firmware"],
    "ADOW-DS-DS.03.3": ["actuator"],
    "ADOW-DS-DS.03.4": ["sensor-driven"],
    "ADOW-DS-DS.03.5": ["lock off"],
    "ADOW-DS-DS.03.6": ["repetition"],
    "ADOW-DS-DS.03.7": ["one change at a time"],

    # --- Shapes and Measurements ---
    # SM.07 and SM.08 added 2026-09-24 with lesson 4. Each probe is a word
    # the teaching cannot avoid, and none of them is a word from the
    # criterion's own title: SM.07.3 probes "thickness" rather than
    # "development", because a page can satisfy the latter by naming the
    # step it is on.
    "ADOW-SM-SM.07.1": ["vertex"],
    "ADOW-SM-SM.07.2": ["circumference"],
    "ADOW-SM-SM.07.3": ["thickness"],
    "ADOW-SM-SM.07.4": ["bend"],
    "ADOW-SM-SM.08.1": ["obtuse"],
    "ADOW-SM-SM.08.2": ["protractor"],
    "ADOW-SM-SM.08.3": ["sliding bevel"],
    "ADOW-SM-SM.08.4": ["halve"],
    "ADOW-SM-SM.01.1": ["millimetre"],
    "ADOW-SM-SM.01.2": ["datum"],
    "ADOW-SM-SM.01.3": ["tolerance"],
    "ADOW-SM-SM.01.4": ["sag"],
    "ADOW-SM-SM.02.1": ["1000 mm"],
    "ADOW-SM-SM.02.2": ["one unit"],
    "ADOW-SM-SM.02.3": ["litres"],
    "ADOW-SM-SM.02.4": ["wrong kind"],
    "ADOW-SM-SM.03.1": ["perimeter"],
    "ADOW-SM-SM.03.2": ["triangle", "circle"],
    "ADOW-SM-SM.03.3": ["split"],
    "ADOW-SM-SM.03.4": ["openings"],
    "ADOW-SM-SM.04.1": ["cylinder"],
    "ADOW-SM-SM.04.2": ["litres"],
    "ADOW-SM-SM.04.3": ["density"],
    "ADOW-SM-SM.04.4": ["trench"],
    "ADOW-SM-SM.05.1": ["plumb"],
    "ADOW-SM-SM.05.2": ["bubble"],
    "ADOW-SM-SM.05.3": ["diagonals"],
    "ADOW-SM-SM.05.4": ["revers"],
    "ADOW-SM-SM.06.1": ["3-4-5"],
    "ADOW-SM-SM.06.2": ["tiles"],
    "ADOW-SM-SM.06.3": ["allowance"],
    "ADOW-SM-SM.06.4": ["estimate"],
    # --- Carpentry ---
    "ADOW-CJ-CF.01.1": ["planing", "striking"],
    "ADOW-CJ-CF.01.4": ["mallet"],
    "ADOW-CJ-CF.02.1": ["inspect"],
    "ADOW-CJ-CF.02.2": ["mushroom", "split"],
    "ADOW-CJ-CF.02.3": ["hone"],
    "ADOW-CJ-CF.02.4": ["stored"],
    "ADOW-CJ-CF.03.3": ["guard", "isolate"],
    "ADOW-CJ-CF.03.4": ["gloves"],
    "ADOW-CJ-CF.03.5": ["floor"],
    "ADOW-CJ-CF.04.1": ["large enough"],
    "ADOW-CJ-CF.04.2": ["allowance"],
    "ADOW-CJ-CF.04.4": ["gauge"],
    "ADOW-CJ-CF.04.5": ["gauge lines"],
    "ADOW-CJ-TJ.01.1": ["corner", "widening", "lengthening"],
    "ADOW-CJ-TJ.01.2": ["dovetail", "mortise"],
    "ADOW-CJ-TJ.01.3": ["load"],
    "ADOW-CJ-TJ.01.4": ["table top"],
    "ADOW-CJ-TJ.03.2": ["low angle", "thumb"],
    "ADOW-CJ-TJ.03.3": ["far face"],
    "ADOW-CJ-TJ.03.4": ["break-out"],
    "ADOW-CJ-TJ.04.1": ["oval brad", "lost head"],
    "ADOW-CJ-TJ.04.2": ["two thirds", "pilot hole"],
    "ADOW-CJ-TJ.04.3": ["countersunk", "coach screw"],
    "ADOW-CJ-TJ.04.4": ["squeeze-out"],
    "ADOW-CJ-TJ.05.4": ["drawing"],
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

    with open(os.path.join(app_dir, "app.config.json"), encoding="utf-8") as fh:
        app_cfg = json.load(fh)
    standards = os.path.join(REPO, app_cfg["standards"].replace("/", os.sep))
    with open(standards, encoding="utf-8") as fh:
        fw = json.load(fh)

    # The named app's standards decide what is REPORTED as coverage.
    published = {}
    for mod in fw["modules"]:
        for unit in mod["units"]:
            for c in unit["criteria"]:
                published[c["code"]] = (mod["title"], unit["code"], c["assessmentMode"])

    # But this walks every page in the school, and the school has more than
    # one standards file — Shapes and Measurements is a cross-trade module
    # with its own. Validating every page against ONE file made each module
    # fail on the other's codes. A claim is real if ANY of the school's
    # standards publishes it; coverage is still reported against this app's.
    known = set()
    curriculum = os.path.join(REPO, "src", "curriculum")
    for name in sorted(os.listdir(curriculum)):
        if not (name.startswith("adow-") and name.endswith(".json")):
            continue
        with open(os.path.join(curriculum, name), encoding="utf-8") as fh:
            other = json.load(fh)
        for mod in other["modules"]:
            for unit in mod["units"]:
                for c in unit["criteria"]:
                    known.add(c["code"])

    # EVERY app in the prototype, not just the one named. The two modules
    # are one course and a lesson cites criteria from the other module
    # freely, so a per-app check would report a module as under-taught
    # because the teaching lives next door.
    root = school_root(app_dir)
    pages = []
    for d, _dirs, files in os.walk(root):
        if "app.config.json" not in files:
            continue
        with open(os.path.join(d, "app.config.json"), encoding="utf-8") as fh:
            hub = json.load(fh)["hub"]
        for f in sorted(files):
            if f.endswith(".html") and f != hub:
                pages.append(os.path.relpath(os.path.join(d, f), root))
    if not pages:
        sys.exit("NOT CHECKED: no built lesson pages under %s — run build.py first." % root)

    claimed = {}
    problems = []
    for page in pages:
        with open(os.path.join(root, page), encoding="utf-8") as fh:
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
            if code not in known:
                problems.append("%s claims %s, which no standards file in this school publishes" % (page, code))
                continue
            if code not in published:
                continue  # a real code, but from the other module's standards
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
