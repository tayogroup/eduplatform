# -*- coding: utf-8 -*-
"""Give every Grade 1 English unit a learning-time estimate.

WHY THIS EXISTS. The content validation of 2026-09-09 searched all ten units
for `duration`, `minutes`, `estimatedTime`, `timeEstimate` and `screenTime` and
found none of them. The only time anywhere in the data was `durationMin: 30` on
the six live sessions per unit, which describes a teacher-led class, not
self-paced work. A parent planning an afternoon, a teacher planning a week and
a learner deciding whether to start had nothing to plan against.

WHAT THIS IS NOT. These are not measured times. Nobody has been timed doing
these lessons. They are an arithmetic estimate from the content that is
actually there, using the rate table below, and every unit is written with
`"status": "provisional"` so no surface can present them as observed fact.
Replace the rates with real observation when you have it: change RATES, re-run,
and every unit updates together.

THE RATES ARE THE JUDGEMENT, and they are in one place on purpose. They are
what a reviewer should argue with -- not the arithmetic, which is trivial, and
not the counts, which are measured. Each is seconds per item for a Stage 1
learner working with support, and each carries the reasoning for its number.

    python estimate-learning-time.py --dry     # report, write nothing
    python estimate-learning-time.py           # write learningTime into each unit
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.join(HERE, "..", "grade-1", "data", "units")

# seconds per item -- see the note above before changing one
RATES = {
    # heard, repeated, and checked against a picture; the word show gives each
    # word its own beat rather than running a list past the child
    "vocabulary_word": 20,
    # 60 words per minute is supported Stage 1 reading -- the child is following
    # a narrated line, not decoding alone -- plus 30s to settle into the passage
    "reading_wpm": 60,
    "reading_setup": 30,
    # most are oral: the child answers aloud to an adult, which is slower than
    # tapping and is the point of the section
    "comprehension_q": 45,
    "quiz_q": 40,
    # deliberate revision of something already met, so faster than first contact
    "fluency_q": 30,
    "activity": 60,
    "speaking": 60,
    # the only section where a six-year-old is forming letters
    "writing": 90,
    "grammar": 60,
}


def count_words(text):
    return len(re.findall(r"[A-Za-z']+", text or ""))


def estimate(unit):
    """Seconds per section, from what the unit actually contains."""
    sec = {}
    sec["vocabulary"] = sum(
        len(g.get("vocabularyIds") or []) for g in unit.get("vocabularyGroups") or []
    ) * RATES["vocabulary_word"]
    reading = 0
    for r in unit.get("readings") or []:
        w = count_words(r.get("passageScript"))
        reading += RATES["reading_setup"] + round(w * 60 / RATES["reading_wpm"])
    sec["readings"] = reading
    sec["comprehension"] = len(unit.get("comprehension") or []) * RATES["comprehension_q"]
    sec["quiz"] = len(unit.get("quizzes") or []) * RATES["quiz_q"]
    sec["fluency"] = len(unit.get("fluency") or []) * RATES["fluency_q"]
    sec["activities"] = len(unit.get("activities") or []) * RATES["activity"]
    sec["speaking"] = len(unit.get("speaking") or []) * RATES["speaking"]
    sec["writing"] = len(unit.get("writing") or []) * RATES["writing"]
    sec["grammar"] = len(unit.get("grammar") or []) * RATES["grammar"]
    return sec


def block(unit):
    sec = estimate(unit)
    total = sum(sec.values())
    live = sum(int(s.get("durationMin") or 0) for s in unit.get("liveSessions") or [])
    return {
        "status": "provisional",
        "basis": "arithmetic from the unit's own counts using the rate table in "
                 "grade-1-app/estimate-learning-time.py; not observed timings",
        "generatedFrom": "content",
        "sectionMinutes": {k: max(1, round(v / 60)) for k, v in sorted(sec.items()) if v},
        "selfPacedMinutes": round(total / 60),
        "liveSessionMinutes": live,
        "totalMinutes": round(total / 60) + live,
    }


def main():
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            print("unknown argument %s" % f)
            return 2
    dry = "--dry" in flags
    paths = sorted(
        (p for p in os.listdir(UNITS) if re.fullmatch(r"unit-\d+\.json", p)),
        key=lambda p: int(re.search(r"\d+", p).group()),
    )
    print("  unit   self-paced   live   total   sections")
    tot_self = tot_all = 0
    for name in paths:
        p = os.path.join(UNITS, name)
        unit = json.load(io.open(p, encoding="utf-8"))
        b = block(unit)
        tot_self += b["selfPacedMinutes"]
        tot_all += b["totalMinutes"]
        print("  %-8s %5d min %6d %7d   %s" % (
            name.replace(".json", ""), b["selfPacedMinutes"], b["liveSessionMinutes"],
            b["totalMinutes"], ", ".join("%s %d" % (k, v) for k, v in b["sectionMinutes"].items())))
        if not dry:
            if unit.get("learningTime") == b:
                continue
            unit["learningTime"] = b
            io.open(p, "w", encoding="utf-8", newline="\n").write(
                json.dumps(unit, ensure_ascii=False, indent=2) + "\n")
    print("")
    print("  grade total: %d min self-paced (%.1f h), %d min with live classes (%.1f h)"
          % (tot_self, tot_self / 60, tot_all, tot_all / 60))
    print("  across 10 units over a school year")
    if dry:
        print("\n  --dry: nothing written")
    return 0


sys.exit(main())
