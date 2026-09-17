# -*- coding: utf-8 -*-
"""Give every inserted step its sticker, and hold the shelf to one invariant.

    python fix-sticker-shelf.py --app ../grade-2-app            # report
    python fix-sticker-shelf.py --app ../grade-2-app --write
    python fix-sticker-shelf.py --audit                         # every app

THE SHELF IS POSITIONAL, and that is the whole problem:

    STICKERS.map((s, i) => ... done[i] ? " got" : "" ...)

Sticker i is bound to STEP i. Nothing links them but the index - not a name, not
an id - so inserting a step at index 9 silently re-points sticker 9 at it and
pushes the real owner of that sticker off the end of the array.

Six step-inserting tools across two builds did exactly that and not one added a
sticker:

    Grade 2   Spot the mistake, Story problems, Will it always work?,
              Make up a problem                       all nine lessons, short by 4
    Grade 3   Spot the mistake, Try this one          eight lessons, short by 1 or 2

Grades 1 and 4 are clean, checked rather than assumed.

The completion line makes it worse rather than milder. The shelf reads

    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    ... got === STICKERS.length ...

so a short array also SHORTENS the slice: the lesson congratulates the child on
finishing every step while the last ones are untouched. On Grade 2's Which Way
From Here the sticker that says "Show what I know" lights when the child
finishes Spot the mistake, four steps earlier.

WHY THIS INSERTS RATHER THAN REBUILDS. Deriving the whole shelf from each step's
<h2> would be the tidier shape and would change wording a child already sees -
Grade 3's shelf says "Multiples" where the step says "Multiples of 2, 5 and 10",
and those short forms are chosen to fit a tile. So only the MISSING entries are
added, at the index of the step they belong to, and every existing label is left
exactly as it is, byte for byte.

The inserted steps are found by their own ids rather than by matching text,
because the labels deliberately are not the headings. A first attempt to match
labels against headings walked the two lists in step, desynced at the first
short form, and then flagged everything after it - naming six headings on a page
that is short by four.

IT REFUSES RATHER THAN GUESSES. If the number of marked steps does not account
for the shortfall exactly, the page is left alone and says so. The Grade 3
version of this looked for an id that had since been renamed, found nothing, and
refused three pages - which is the whole difference between this and the tools
that caused the problem.

THE ARRAY IS PARSED BY MATCHING BRACKETS, not by a regex. The audit that found
this originally used

    const STICKERS = \\[([\\s\\S]*?)\\n  \\];

and reported "no STICKERS" for eight of the nine Grade 2 lessons, which all have
one - Grade 2 writes the whole array on a single line. The instrument was
measuring an indentation habit and reporting the difference as an absence, in
the direction that hides work.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))

# app -> the steps that tools inserted without a sticker, as (id pattern, icon,
# label). The id is what identifies the step; the label is what the tile says.
APPS = {
 "grade-2-app": (
   (r'id="sm\d+say"', "\U0001F50D", "Spot the mistake"),
   (r'id="sp\d+say"', "\U0001F4D6", "Story problems"),
   (r'id="at\d+say"', "\U0001F501", "Will it always work?"),
   (r'id="pb\d+say"', "✏️", "Make up a problem"),
 ),
 "grade-3-app": (
   (r'id="smM"', "\U0001F50D", "Spot the mistake"),
   (r'id="tierT"', "\U0001F4DD", "Try this one"),
 ),
}

args = sys.argv[1:]
AUDIT = "--audit" in args
WRITE = "--write" in args
app = None
if "--app" in args:
    app = os.path.basename(os.path.normpath(args[args.index("--app") + 1]))
for a in args:
    if a not in ("--write", "--audit", "--app") and a != (args[args.index("--app") + 1]
                                                          if "--app" in args else None):
        sys.exit("unrecognised argument: %s" % a)
if not AUDIT and not app:
    sys.exit("  --app <dir> is required (or --audit to look at every build)")
if app and app not in APPS:
    sys.exit("  %s has no entry in APPS. Add the ids of the steps its tools insert, "
             "rather than letting this guess." % app)


def shelf_span(s):
    """(open_bracket_index, close_bracket_index) of const STICKERS = [ ... ]."""
    i = s.find("const STICKERS")
    if i < 0:
        return None
    i = s.find("[", i)
    if i < 0:
        return None
    depth, j, instr, esc, quote = 0, i, False, False, ""
    while j < len(s):
        c = s[j]
        if instr:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                instr = False
        elif c in "\"'":
            instr, quote = True, c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return i, j
        j += 1
    return None


def entries(body):
    """The top-level [...] entries of the array body, verbatim."""
    out, d, start, instr, esc, quote = [], 0, None, False, False, ""
    for k, c in enumerate(body):
        if instr:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                instr = False
            continue
        if c in "\"'":
            instr, quote = True, c
        elif c == "[":
            if d == 0:
                start = k
            d += 1
        elif c == "]":
            d -= 1
            if d == 0:
                out.append(body[start:k + 1])
    return out


def slide_spans(s):
    out = []
    for m in re.finditer(r'<section class="slide"', s):
        e = s.find("</section>", m.start())
        out.append((m.start(), e if e > 0 else len(s)))
    return out


def audit(appdir):
    d = os.path.join(HERE, "..", appdir)
    bad = 0
    for f in sorted(x for x in os.listdir(d) if x.endswith(".html")
                    and not re.search(r"index|review-pack|audit|^_|-body\.html$", x)):
        s = io.open(os.path.join(d, f), encoding="utf-8", newline="").read()
        sp = shelf_span(s)
        if not sp:
            print("   %-28s no shelf" % f)
            continue
        n = len(entries(s[sp[0] + 1:sp[1]]))
        steps = s.count('<section class="slide"') - 1
        bad += n != steps
        print("   %-28s stickers %2d   steps %2d   %s"
              % (f, n, steps, "OK" if n == steps else "SHORT BY %d" % (steps - n)))
    return bad


if AUDIT:
    total = 0
    for a in ("grade-1-app", "grade-2-app", "grade-3-app", "grade-4-app"):
        if os.path.isdir(os.path.join(HERE, "..", a)):
            print("== %s" % a)
            total += audit(a)
    print("\n   %d page(s) where the shelf does not match the lesson" % total)
    sys.exit(1 if total else 0)

D = os.path.join(HERE, "..", app)
pages = sorted(f for f in os.listdir(D) if f.endswith(".html")
               and not re.search(r"index|review-pack|audit|^_|-body\.html$", f))
todo, ok, refused, added = [], 0, 0, 0
for f in pages:
    p = os.path.join(D, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    sp = shelf_span(s)
    if not sp:
        print("  skipped    %-26s no STICKERS shelf" % f[:-5])
        continue
    body = s[sp[0] + 1:sp[1]]
    ent = entries(body)
    spans = slide_spans(s)
    steps = len(spans) - 1              # the shelf's own slide is not a step

    if len(ent) == steps:
        print("  ok         %-26s %2d stickers for %2d steps" % (f[:-5], len(ent), steps))
        ok += 1
        continue
    if len(ent) > steps:
        print("  REFUSED    %-26s %d stickers for %d steps - more shelf than lesson, "
              "which this cannot explain" % (f[:-5], len(ent), steps))
        refused += 1
        continue

    want = {}
    for i, (a, b) in enumerate(spans[:-1]):
        for pat, icon, label in APPS[app]:
            if re.search(pat, s[a:b]):
                want[i] = (icon, label)
    if len(ent) + len(want) != steps:
        print("  REFUSED    %-26s %d stickers + %d marked steps != %d steps. Something "
              "else added a step; name its id in APPS rather than letting this guess."
              % (f[:-5], len(ent), len(want), steps))
        refused += 1
        continue

    out = list(ent)
    for i in sorted(want):
        icon, label = want[i]
        out.insert(i, '["%s", "%s"]' % (icon, label))

    # keep the file's own shape: one line if it was one line, four per line if not
    if "\n" in body.strip():
        lines = ["    " + ", ".join(out[k:k + 4]) + ("," if k + 4 < len(out) else "")
                 for k in range(0, len(out), 4)]
        new_body = "\n" + "\n".join(lines) + "\n  "
    else:
        new_body = ", ".join(out)
    new = s[:sp[0] + 1] + new_body + s[sp[1]:]

    # the invariant, asserted on the bytes about to be written
    sp2 = shelf_span(new)
    got = entries(new[sp2[0] + 1:sp2[1]])
    if len(got) != steps:
        print("  REFUSED    %-26s rebuilt to %d, wanted %d" % (f[:-5], len(got), steps))
        refused += 1
        continue
    if [e for e in got if e not in out]:
        print("  REFUSED    %-26s an entry changed on the way through" % f[:-5])
        refused += 1
        continue
    # every pre-existing entry must survive byte for byte, in its original order
    if [e for e in got if e in ent] != ent:
        print("  REFUSED    %-26s the existing labels were not preserved in order" % f[:-5])
        refused += 1
        continue
    bad = [i for i in sorted(want) if want[i][1] not in got[i]]
    if bad:
        print("  REFUSED    %-26s sticker %d is not the step's own" % (f[:-5], bad[0]))
        refused += 1
        continue

    todo.append((p, new))
    added += len(want)
    print("  would      %-26s %2d -> %2d   inserted at %s"
          % (f[:-5], len(ent), len(got),
             ", ".join("%d (%s)" % (i, want[i][1]) for i in sorted(want))))

if WRITE:
    for p, new in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(new)
print("")
print("  %d sticker(s) across %d page(s) %s, %d already right, %d refused%s"
      % (added, len(todo), "written" if WRITE else "to write", ok, refused,
         "" if WRITE else "   (--write to apply)"))
