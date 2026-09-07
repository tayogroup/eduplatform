# -*- coding: utf-8 -*-
"""Audit the DEPLOYED Grade 4 maths course (18 units) against Cambridge 0096 Stage 4.

The units declare cambridge {code 0096, stage 4} and map zero objective codes, so
coverage has to be established from what they teach. One discriminating pattern per
objective; a hit records the unit and a snippet so every claim is citable and can be
checked by hand -- which is the point, because a keyword match is a candidate, not proof.
"""
import json, io, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, "math-corpus.py"), encoding="utf-8").read().split("if __name__")[0])

PAT = {
"4Nc.01": r"count(?:ing)? (?:on|back)[^.]{0,90}(?:step|thousand|hundred|zero)|steps of constant size",
"4Nc.02": r"odd \+ odd|even \+ even|odd and even number|sum of two odd|adding[^.]{0,40}odd[^.]{0,30}even",
"4Nc.03": r"unknown (?:quantity|number|value)|represent[^.]{0,50}unknown|missing number",
"4Nc.04": r"term-to-term|non-linear sequence|linear sequence",
"4Nc.05": r"square number",
"4Ni.01": r"(?:read|write)[^.]{0,40}whole number[^.]{0,40}in words|number name(?!s of)",
"4Ni.02": r"estimat[^.]{0,70}(?:add|subtract)|round[^.]{0,50}before[^.]{0,40}(?:add|subtract)",
"4Ni.03": r"associative",
"4Ni.04": r"times table",
"4Ni.05": r"grid method|partition[^.]{0,60}multiply|multiply[^.]{0,60}1-digit",
"4Ni.06": r"short division|divid[^.]{0,60}(?:1-digit|one-digit)|dividing by grouping|repeated subtraction",
"4Ni.07": r"factor pair|multiples and factors|relationship between (?:multiples|factors)",
"4Ni.08": r"divisib",
"4Np.01": r"place value|value of (?:each|the) digit",
"4Np.02": r"by 10 and 100|multiply[^.]{0,40}by 10|divid[^.]{0,40}by 10",
"4Np.03": r"decompos|regroup|compos[^.]{0,40}number",
"4Np.04": r"(?:compare|order)[^.]{0,80}negative|negative number[^.]{0,60}(?:compare|order|greater|less)",
"4Np.05": r"round[^.]{0,50}nearest",
"4Nf.01": r"bigger denominator makes a smaller|same numerator[^.]{0,80}smaller denominator|More pieces are smaller",
"4Nf.02": r"fraction[^.]{0,70}division|numerator[^.]{0,60}divid",
"4Nf.03": r"unit fraction|fraction of an amount|fraction of a (?:number|quantity|set)",
"4Nf.04": r"equivalent fraction",
"4Nf.05": r"same denominator",
"4Nf.06": r"percentage|per cent",
"4Nf.07": r"(?:compare|order)[^.]{0,60}fraction",
"4Gt.01": r"convert[^.]{0,60}(?:time|minute|hour|day|week)|60 minutes|24 hours|units of time",
"4Gt.02": r"24-hour|analogue",
"4Gt.03": r"timetable",
"4Gt.04": r"time interval|how long[^.]{0,40}(?:between|take)|duration|elapsed",
"4Gg.01": r"tessellat",
"4Gg.02": r"compound shape|two areas[^.]{0,40}added|area[^.]{0,40}added together",
"4Gg.03": r"formula[^.]{0,60}(?:area|perimeter)|length\s*[×x]\s*width|area = length",
"4Gg.04": r"irregular shape|part square|whole and part",
"4Gg.05": r"faces of[^.]{0,40}3D|2D face|flat face",
"4Gg.06": r"\bnets?\b",
"4Gg.07": r"lines? of symmetry",
"4Gg.08": r"obtuse",
"4Gg.09": r"read a scale|measuring jug|kitchen scale|partly numbered|only partly numbered",
"4Gp.01": r"cardinal|compass|north[^.]{0,30}south|ordinal point",
"4Gp.02": r"coordinate",
"4Gp.03": r"mirror line|reflect",
"4Ss.01": r"categorical|discrete data|statistical question",
"4Ss.02": r"Venn|Carroll",
"4Ss.03": r"interpret[^.]{0,50}data|similarit|variation[^.]{0,40}data",
"4Sp.01": r"even chance|language of (?:chance|probability)|impossible[^.]{0,60}certain|likelihood",
"4Sp.02": r"trial",
}

def load_stage4():
    """The 46 Stage 4 objectives, read from the framework the repo carries.

    src/curriculum/cambridge-mathematics-0096.json is extracted from Cambridge's PDF by
    tools/extract-cambridge-mathematics-framework.py and validated by validate:frameworks.
    A hand copy beside this file went stale the moment the extractor produced a cleaner
    text (its 4Gt.04 had swallowed the next section heading), so there is no hand copy."""
    fw = os.path.join(HERE, "..", "..", "..", "..", "curriculum",
                      "cambridge-mathematics-0096.json")
    with io.open(fw, encoding="utf-8") as fh:
        return json.load(fh)["objectivesByStage"]["4"]

OBJ = {o["code"]: o["text"] for o in load_stage4()}
assert set(PAT) == set(OBJ), set(PAT) ^ set(OBJ)

if __name__ == "__main__":
    C = build()
    rows, uncovered = [], []
    for code in sorted(OBJ):
        hits = []
        snip = ""
        for u in sorted(C):
            m = re.search(PAT[code], C[u], re.I)
            if m:
                hits.append(u)
                if not snip:
                    s = max(0, m.start() - 55)
                    snip = C[u][s:m.end() + 75].strip()
        rows.append((code, hits, snip))
        if not hits: uncovered.append(code)

    print("objectives: %d | with evidence: %d | with none: %d\n" % (len(rows), len(rows) - len(uncovered), len(uncovered)))
    for code, hits, snip in rows:
        tag = ("U" + ",".join(str(h) for h in hits)) if hits else "NONE"
        print("%-8s %-26s %s" % (code, tag[:26], (snip[:96] + "…") if snip else "-- no match --"))
    json.dump({c: h for c, h, _ in rows}, io.open(os.path.join(HERE, "math-hits.json"), "w", encoding="utf-8"))
