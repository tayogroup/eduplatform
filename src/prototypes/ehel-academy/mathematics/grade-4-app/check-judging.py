"""Gate: every teaching slide must have some way of disagreeing with the child.

Credits either an in-block correctness branch (the slides that always had one) or an
ask(N, ...) call anywhere in the file (the your-turn panels, which are appended at the
end and so are NOT inside the slide's own comment block -- the reason judge2 could not
see them).
"""
import io, re
LES=[("time-slides.js","Telling the Time",4),("stats-slides.js","Asking, Sorting and Chance",7),
     ("frac-slides.js","Parts of a Whole",7),("shape-slides.js","Shape, Space and Place",9),
     ("num-slides.js","Numbers and How They Behave",10)]
IDIOM = r'"oops"|"bad"|"wrong"|\bok\s*\?|[Nn]ot quite'
passive=[]; total=0
for f,name,nteach in LES:
    s=io.open(f,encoding="utf-8").read()
    asked = set(int(m) for m in re.findall(r"\bask\((\d+),", s))
    marks=[(m.start(), int(m.group(1))) for m in re.finditer(r"/\* ---- (\d+): .*? ---- \*/", s)]
    for i,(pos,n) in enumerate(marks):
        if n > nteach: continue
        total += 1
        end = marks[i+1][0] if i+1 < len(marks) else len(s)
        if not (re.search(IDIOM, s[pos:end]) or n in asked):
            passive.append((name, n))
print("teaching slides: %d" % total)
print("slides that can never disagree with the child: %d" % len(passive))
for p in passive: print("   %-28s slide %d" % p)
