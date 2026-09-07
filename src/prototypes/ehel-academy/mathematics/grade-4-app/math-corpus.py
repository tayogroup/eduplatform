"""Build one searchable text corpus per deployed Grade 4 maths unit.

Pulls only teaching-bearing text: the unit title and overview, outcomes, concept titles
and explanations, method/worked-example/exploration titles and prompts, visual-model
titles and purposes, the glossary terms and rules, and practice/fluency prompts.
Deliberately includes answers and hints too -- an objective is often only visible in
what the child is asked to produce.
"""
import json, io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

UNITS = os.path.join(HERE, "..", "grade-4", "data", "units")

def texts(v, out):
    if isinstance(v, str): out.append(v)
    elif isinstance(v, list):
        for x in v: texts(x, out)
    elif isinstance(v, dict):
        for k, x in v.items():
            if k in ("id", "outcomeId", "modelType", "difficulty", "level", "schemaVersion",
                     "generatedAt", "provenance", "media", "unitId"): continue
            texts(x, out)

def build():
    corp = {}
    for i in range(1, 19):
        d = json.load(io.open(os.path.join(UNITS, "unit-%d.json" % i), encoding="utf-8"))
        parts = []
        for k in ("unit", "outcomes", "concepts", "explorations", "visualModels", "methods",
                  "workedExamples", "practice", "activities", "reference", "fluency",
                  "realProblems", "reasoningPrompts", "assessment", "selfAssessment", "games"):
            if k in d: texts(d[k], parts)
        corp[i] = " ".join(" ".join(parts).split())
    return corp

if __name__ == "__main__":
    c = build()
    tot = sum(len(v) for v in c.values())
    print("units: %d | corpus chars: %s" % (len(c), format(tot, ",")))
    for i in sorted(c)[:4]:
        print("  U%-2d %s chars" % (i, format(len(c[i]), ",")))
