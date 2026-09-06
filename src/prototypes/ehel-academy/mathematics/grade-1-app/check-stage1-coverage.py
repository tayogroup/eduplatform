# -*- coding: utf-8 -*-
"""Does the seven-lesson set still cover all 36 Stage 1 objectives?

The restructure deleted five slides as duplicates. Each was carrying part of
an objective somewhere, so the question is not "is the slide gone" but "does
the objective still have a home". Every objective is pinned to the slide
TITLE that teaches it; the title must appear in one of the seven files.
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.join(SP, "g1v2")
FILES = ["counting-to-twenty.html", "adding-and-taking-away.html",
         "halves-and-wholes.html", "what-comes-next.html",
         "shapes-and-sizes.html", "days-months-and-clocks.html",
         "asking-and-sorting.html"]

titles = {}
for f in FILES:
    s = io.open(os.path.join(V2, f), encoding="utf-8").read()
    for h in re.findall(r"<h2[^>]*>(.*?)</h2>", s, re.S):
        titles.setdefault(re.sub(r"<[^>]*>", "", h).strip(), []).append(f.replace(".html", ""))

# objective -> the slide title(s) that carry it; any one is enough
OBJ = {
 "1Nc.01": ["Count to 10", "Then to 20", "More or fewer?"],
 "1Nc.02": ["See how many"],
 "1Nc.03": ["Guess, then count", "Estimate to 20"],
 "1Nc.04": ["Counting in twos", "Counting in tens", "My own number pattern"],
 "1Nc.05": ["Odd and even"],
 "1Nc.06": ["What comes next?", "The part that repeats"],
 "1Ni.01": ["Read the number", "Write the number"],
 "1Ni.02": ["Adding"],
 "1Ni.03": ["Taking away", "How many more?"],
 "1Ni.04": ["Making 10"],
 "1Ni.05": ["Adding", "Taking away", "Through 10"],
 "1Ni.06": ["Doubles", "Doubles to 20"],
 "1Nm.01": ["Money to 20"],
 "1Np.01": ["Zero means none"],
 "1Np.02": ["Then to 20", "Counting in tens"],
 "1Np.03": ["More or fewer?", "Put them in order", "Numbers to 20", "Compare to 20"],
 "1Np.04": ["First, second, third"],
 "1Nf.01": ["Two equal parts", "Cut it in half"],
 "1Nf.02": ["Colour one half", "Half of a group"],
 "1Nf.03": ["Half of a number", "Halve it in your head"],
 "1Nf.04": ["Two halves make a whole", "How many halves?"],
 "1Gt.01": ["Short times and long times"],
 "1Gt.02": ["Days of the week", "Months of the year"],
 "1Gt.03": ["Telling the time"],
 "1Gg.01": ["Flat shapes", "Sort the shapes"],
 "1Gg.02": ["Long, longer, longest"],
 "1Gg.03": ["Solid shapes"],
 "1Gg.04": ["Heavy and light"],
 "1Gg.05": ["Full and empty"],
 "1Gg.06": ["Flat or solid?"],
 "1Gg.07": ["Turn it round"],
 "1Gg.08": ["Which tool measures it?"],
 "1Gp.01": ["Where is it?"],
 "1Ss.01": ["Ask everyone", "Answer the question"],
 "1Ss.02": ["Write a list", "Make a table", "Build a block graph",
            "Make a pictogram", "A Venn diagram", "A Carroll diagram"],
 "1Ss.03": ["Read the block graph", "What can we say?"],
}

missing = []
print("Stage 1 coverage of the SEVEN-lesson set\n" + "=" * 62)
for code in sorted(OBJ):
    found = [(t, titles[t][0]) for t in OBJ[code] if t in titles]
    if not found:
        missing.append(code)
        print("  GAP  %-8s none of %s survived" % (code, OBJ[code]))
    else:
        print("  ok   %-8s %-28s %s" % (code, found[0][0][:28], found[0][1]))
print("=" * 62)
print("covered %d/36   missing: %s" % (36 - len(missing), missing or "none"))

# the five deleted slides, and where their objective now lives
print("\nDeleted as duplicates, and the lesson that still teaches the objective:")
for gone, obj, home in [("Halves (UtT 19)", "1Nf.02", "Colour one half"),
                        ("Halves to 20 (UtT 20)", "1Nf.03", "Half of a number"),
                        ("Two halves make one whole (UtT 21)", "1Nf.04", "Two halves make a whole"),
                        ("Number patterns (UtT 27)", "1Nc.06", "Jump patterns"),
                        ("Telling the time (UtT 29)", "1Gt.03", "Telling the time")]:
    where = titles.get(home, ["MISSING"])[0]
    print("  %-36s %-8s -> %-26s %s" % (gone, obj, home, where))
sys.exit(1 if missing else 0)
