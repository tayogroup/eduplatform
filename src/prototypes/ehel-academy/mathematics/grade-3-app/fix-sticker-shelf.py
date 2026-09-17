# -*- coding: utf-8 -*-
"""Give every inserted step its sticker, and hold the shelf to one invariant.

    python fix-sticker-shelf.py            # report
    python fix-sticker-shelf.py --write

THE SHELF IS POSITIONAL, and that is the whole problem:

    STICKERS.map((s, i) => ... done[i] ? " got" : "" ...)

Sticker i is bound to STEP i. Nothing links them but the index - not a name,
not an id - so inserting a step at index 11 silently re-points sticker 11 at it
and pushes the real owner of that sticker off the end of the array.

Two tools in this build insert steps, add-spot-the-mistake.py and
add-differentiation.py, and NEITHER added a sticker. So after both ran, all
eight Grade 3 lessons were short: five by one and three by two, with every
sticker from the first insertion onwards naming the wrong step. On Rows and
Rules the child who finished "Spot the mistake" lit "The mystery box", and the
last two steps of the lesson could light nothing at all.

The completion line makes it worse rather than milder. The shelf reads

    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    ... got === STICKERS.length ...

so a short array also SHORTENS the slice: the lesson congratulates the child on
finishing every step while the last two are untouched.

WHY THIS INSERTS RATHER THAN REBUILDS. Deriving the whole shelf from each step's
<h2> would be the tidier shape and would change wording a child already sees -
the shelf says "Multiples" where the step says "Multiples of 2, 5 and 10", and
those short forms are chosen for a tile. So only the MISSING entries are added,
at the index of the step they belong to, and every existing label is left alone.

The inserted steps are found by their own markers rather than by matching text,
because the labels are deliberately not the headings:

    #tierT      the Support and Challenge step   add-differentiation.py
    #smM        the Spot the mistake step        add-spot-the-mistake.py

The first version of this looked for #smMsay and found nothing, so the three
pages carrying a Spot the mistake step came out one short of what the arithmetic
below expects and were REFUSED rather than half-written. That is the refusal
doing its job: a marker that has been renamed since is exactly the way a tool
like this rots, and the alternative - inserting what it could find and trusting
the count - is how the shelf got into this state in the first place.

It refuses rather than guesses if a page ends up with a count it cannot explain,
and it is idempotent: a page whose shelf already covers every step is left
untouched.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

# marker inside the step's own <section> -> the sticker it should get
INSERTED = (
    ('id="smM"', ("\U0001F50D", "Spot the mistake")),
    ('id="tierT"', ("\U0001FA9C", "Try this one")),
)

SHELF = re.compile(r"(const STICKERS = \[)([\s\S]*?)(\n  \];)")


def slide_spans(s):
    """(start, end) of every <section class="slide"> ... </section>."""
    out = []
    for m in re.finditer(r'<section class="slide"', s):
        end = s.find("</section>", m.start())
        out.append((m.start(), end if end > 0 else len(s)))
    return out


pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|^_", f))
todo, ok, refused, added = [], 0, 0, 0
for f in pages:
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    m = SHELF.search(s)
    if not m:
        print("  skipped    %-24s no STICKERS shelf" % f[:-5])
        continue

    spans = slide_spans(s)
    steps = len(spans) - 1                      # the shelf's own slide is not a step
    entries = re.findall(r'\["[^"]*", "(?:[^"\\]|\\.)*"\]', m.group(2))
    if len(entries) == steps:
        print("  ok         %-24s %2d stickers for %2d steps" % (f[:-5], len(entries), steps))
        ok += 1
        continue
    if len(entries) > steps:
        print("  REFUSED    %-24s %d stickers for %d steps - more shelf than lesson, "
              "which this cannot explain" % (f[:-5], len(entries), steps))
        refused += 1
        continue

    # which step indices are ours, and what each one should carry
    want = {}
    for i, (a, b) in enumerate(spans):
        for marker, sticker in INSERTED:
            if marker in s[a:b]:
                want[i] = sticker
    if len(entries) + len(want) != steps:
        print("  REFUSED    %-24s %d stickers + %d inserted steps != %d steps. Something "
              "else added a step; name it here rather than letting this guess."
              % (f[:-5], len(entries), len(want), steps))
        refused += 1
        continue

    out = list(entries)
    for i in sorted(want):
        ic, label = want[i]
        out.insert(i, '["%s", "%s"]' % (ic, label))

    # four per line, the shape the shelf is already written in
    lines = []
    for i in range(0, len(out), 4):
        lines.append("    " + ", ".join(out[i:i + 4]) + ("," if i + 4 < len(out) else ""))
    block = m.group(1) + "\n" + "\n".join(lines) + m.group(3)
    new = s[:m.start()] + block + s[m.end():]

    # the invariant, asserted on the bytes about to be written
    m2 = SHELF.search(new)
    got = re.findall(r'\["[^"]*", "(?:[^"\\]|\\.)*"\]', m2.group(2))
    if len(got) != steps:
        print("  REFUSED    %-24s rebuilt to %d, wanted %d" % (f[:-5], len(got), steps))
        refused += 1
        continue
    for i in sorted(want):
        if want[i][1] not in got[i]:
            print("  REFUSED    %-24s sticker %d is not %r" % (f[:-5], i, want[i][1]))
            refused += 1
            break
    else:
        todo.append((p, new))
        added += len(want)
        print("  would      %-24s %2d -> %2d stickers   inserted at %s"
              % (f[:-5], len(entries), len(got),
                 ", ".join("%d (%s)" % (i, want[i][1]) for i in sorted(want))))

if WRITE:
    for p, new in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(new)
print("")
print("  %d sticker(s) across %d page(s) %s, %d already right, %d refused%s"
      % (added, len(todo), "written" if WRITE else "to write", ok, refused,
         "" if WRITE else "   (--write to apply)"))
