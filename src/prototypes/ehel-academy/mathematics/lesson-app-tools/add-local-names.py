# -*- coding: utf-8 -*-
"""Put named, local people and places into Grades 3 and 4.

    python add-local-names.py            # report
    python add-local-names.py --write    # then rebuild Grades 3 and 4

The 2026-09-11 validation, area 18 (Cultural Relevance): Grade 3 had "no named
people at all" and asked for "some named, local characters"; Grade 4 had "no
named people or local settings (contexts are generic)" and asked for "a few
local contexts". Grades 1 and 2 already speak of Amina, Musa and Hodan and
count in Kenyan shillings; 3 and 4 said "you".

The new steps written the same day (grade-3-app/src/add-second-steps.py and
Grade 4's new-frac/new-stats/new-shape slides) are about named children from
the start. This does the rest: the places in the existing lessons that
already describe a situation - a survey, a timetable, a share, a walk, a cold
night - where "you" becomes somebody, and "it is 3 degrees" becomes a night on
Mount Kenya, the one place near these children where it really does go below
zero. Where the numbers are the whole question (place value, the tables,
sequences) nothing is invented around them.

Only the words change. Every item's numbers, options and key are exactly as
they were, so no answer moves - check-answer-keys.py and the drives say so.

Every anchor must match exactly once or the file is left alone; a second run
changes nothing. The pages are generated: rebuild both grades afterwards.
"""
import io, os, sys

sys.stdout.reconfigure(encoding="utf-8")
MATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

G3, G4 = "grade-3-app/src/", "grade-4-app/"
EDITS = {
    G3 + "l3-content.js": [
        ('$("say7").innerHTML = "Share <b>" + total + "</b> between <b>" + g + "</b>. "',
         '$("say7").innerHTML = ["Nadia", "Musa", "Hodan", "Omar"][rnd(0, 3)] + " shares <b>" + total + "</b> sweets between <b>" + g + "</b> friends. "'),
    ],
    G3 + "l4-content.js": [
        ('$("say4").innerHTML = "What is " + fracHTML(n, d) + " of <b>" + total + "</b>?";',
         '$("say4").innerHTML = ["Zara", "Yusuf", "Leila", "Ali"][rnd(0, 3)] + " has <b>" + total + "</b> beads. What is " + fracHTML(n, d) + " of them?";'),
        ('$("say6").innerHTML = "What is " + fracHTML(n, d) + " of <b>" + total + "</b>?";',
         '$("say6").innerHTML = ["Amina", "Omar", "Hodan", "Musa"][rnd(0, 3)] + " has <b>" + total + "</b> shillings. What is " + fracHTML(n, d) + " of that?";'),
    ],
    G3 + "l8-content.js": [
        ('q: "You are standing by the road counting cars as they drive past, as fast as they come.",',
         'q: "Musa is standing by the road, counting cars as they drive past as fast as they come.",'),
        ('q: "You have the totals already, and you want to see at a glance which fruit was most popular.",',
         'q: "Hodan has the totals already, and wants to see at a glance which fruit was most popular.",'),
        ('q: "You want to show how many children chose each drink, using one picture to stand for five children.",',
         'q: "Omar wants to show how many children chose each drink, using one picture to stand for five children.",'),
        ('q: "Some children play football, some play chess, and you especially want the ones who do both to stand out.",',
         'q: "Some children play football, some play chess, and Amina wants the ones who do both to stand out.",'),
        ('q: "You want to sort numbers by two yes-or-no questions, with a box for every combination including neither.",',
         'q: "Yusuf wants to sort numbers by two yes-or-no questions, with a box for every combination, including neither.",'),
        ('q: "You have finished counting and want the totals written down neatly, ready to read off.",',
         'q: "Leila has finished counting and wants the totals written down neatly, ready to read off.",'),
        ('q: "You roll an ordinary six-sided dice. Will you get a 7?"', 'q: "Zara rolls an ordinary six-sided dice. Will she get a 7?"'),
        ('q: "You toss a coin. Will it land on heads?"', 'q: "Ali tosses a coin. Will it land on heads?"'),
    ],
    G4 + "new-time-slides.js": [
        ('$("tmq4").innerHTML = "You must be at <b>" + TM_STOPS[P.stop] + "</b> by <b>" + tm24(P.by) +\n'
         '      "</b>. Which bus do you catch &mdash; the <b>latest</b> one that still gets you there?";',
         '$("tmq4").innerHTML = "Musa must be at <b>" + TM_STOPS[P.stop] + "</b> by <b>" + tm24(P.by) +\n'
         '      "</b>. Which bus should he catch &mdash; the <b>latest</b> one that still gets him there?";'),
    ],
    G4 + "time-slides.js": [
        ('{ q: "You must be at School by 09:00. Which is the latest bus you can take?", a: 1,',
         '{ q: "Hodan must be at School by 09:00. Which is the latest bus she can take?", a: 1,'),
        ('{ q: "You arrive at Riverside at 09:45. Which is the next bus?", a: 2,',
         '{ q: "Omar arrives at Riverside at 09:45. Which is the next bus?", a: 2,'),
    ],
    G4 + "g4-lesson.js": [
        ('$("task2").textContent = "It is " + sg(T.from) + "°C. It gets "',
         '$("task2").textContent = "On Mount Kenya it is " + sg(T.from) + "°C. In the night it gets "'),
    ],
    G4 + "compose-lessons.py": [
        ("""'{ q: "It is 3\\\\u00b0C and it gets 5 degrees colder. What is the temperature?",'""",
         """'{ q: "On Mount Kenya it is 3\\\\u00b0C, and in the night it gets 5 degrees colder. What is the temperature now?",'"""),
        ("""' Which do you catch?", o: [""", """' Which one should Leila catch?", o: ["""),
        ("""09:45. You must be there by 09:30.""", """09:45. Leila must be there by 09:30."""),
        ("""'{ q: "What is 87 \\\\u00f7 5?", o: ["17 remainder 2", "17", "18 remainder 2"], a: 0,'""",
         """'{ q: "Omar shares 87 sweets equally among 5 friends. How many does each friend get, and how many are left over?",'
            ' o: ["17 each, 2 left over", "17 each, none left over", "18 each, 2 left over"], a: 0,'"""),
        ("""'{ q: "From a square you go 3 east then 2 north. How far east are you?", o: ["3", "5", "1"], a: 0,'""",
         """'{ q: "Hodan starts on a square and walks 3 squares east, then 2 north. How many squares east of her start is she?", o: ["3", "5", "1"], a: 0,'"""),
    ],
}

bad = changed = 0
for rel, edits in EDITS.items():
    p = os.path.join(MATH, rel)
    s = io.open(p, encoding="utf-8", newline="").read()
    t = s
    refused = None
    for old, new in edits:
        if old not in t and new in t:
            continue
        if t.count(old) != 1:
            refused = "an anchor matches %d times: %s" % (t.count(old), old[:80].replace("\n", " "))
            break
        t = t.replace(old, new)
    if refused:
        print("  REFUSED  %s: %s" % (rel, refused))
        bad += 1
        continue
    if t != s:
        changed += 1
        if WRITE:
            io.open(p, "w", encoding="utf-8", newline="").write(t)
    print("  %s  %s" % (("changed " if WRITE else "would change") if t != s else "already ", rel))
print("\n  %d file(s) %s, %d refused" % (changed, "changed" if WRITE else "to change", bad))
sys.exit(1 if bad else 0)
