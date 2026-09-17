# -*- coding: utf-8 -*-
"""Stage 5's own learner mistakes, as a block inside the step they belong to.

    python add-spot-the-mistake.py            # report
    python add-spot-the-mistake.py --write

NOT A STEP OF ITS OWN, WHICH IS THE WHOLE DESIGN QUESTION HERE. At Grades 1-4
this is a slide the child is walked to; Grade 5 is a scrolling page a learner
scans, and the repo's rule is that Grades 5-8 keep that design. So each mistake
sits INSIDE the step that teaches the thing it gets wrong - the triangular
numbers mistake in the triangular numbers step - and reads as part of that
step's own material.

IT STAYS DIAGNOSTIC RATHER THAN BECOMING A NOTE. The tempting compromise was a
"watch out" paragraph in the page's explanatory voice, which would have been
design-compatible and worth much less: the value of this device is that the
child works out what went wrong, not that they are told. The page already has
buttons on every step - the pickers that drive each model - so three buttons
here are in the page's idiom and nothing about the design has to move. There is
no score, because nothing on a Grade 5 page is scored.

SOURCED. Stage 5's Guide names a learner mistake 44 times past the front matter,
and unusually it often names one by working it through - "Suggest that 3 + 5 + 7
will also result in a square number, as these are consecutive odd numbers.
Learners should critique your suggestion and explain the mistake you have made."
That is a teacher deliberately modelling an error for the class to catch, which
is exactly this device, so the eight below are Cambridge's own errors rather
than errors invented to fill a slot.

EVERY KEY CHECKED BY ARITHMETIC, per this subject's rule:

    3 + 5 + 7 = 15, and 15 is not square     1 + 3 + 5 + 7 = 16 is
    triangular numbers are 1, 3, 6, 10, 15, 21, 28   27 is not among them
    10 + 5.7 + 0.3 = 16.0                    so it cannot be 15.73
    4.5 rounds to 5, not 4                   3.7 does round to 4
    62.5 has 5 TENTHS                        not 5 hundredths
    3 + 5 x 2 = 13                           not 16
    1 has one factor, so it is not prime     a prime has exactly two
    12 is a multiple of 4 and not of 8       the implication runs one way only

THREE LESSONS OF FIVE. Rules and Patterns and Real Life get none: Stage 5 names
no mistake this could use for either, and the report says so rather than
inventing one.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g5-spot"

# lesson -> {step id: (what was said, [(option, ok)], why, Guide page)}
WORK = {
 "squares-cubes-and-roots": {
   "s2": ("Your teacher says: 3 + 5 + 7 must make a square number, because they "
          "are consecutive odd numbers.",
          [("The odd numbers have to start at 1", True),
           ("Three numbers are never enough to make a square", False),
           ("Nothing is wrong, 15 is a square number", False)],
          "3 + 5 + 7 = 15, which is not square. Start from 1 and it works: "
          "1 + 3 + 5 + 7 = 16.", "p153"),
   "s7": ("Your teacher says: 27 is a triangular number.",
          [("The triangular numbers jump from 21 to 28", True),
           ("27 is triangular because it is 3 x 9", False),
           ("Every odd number is triangular", False)],
          "Add consecutive numbers from 1: 1, 3, 6, 10, 15, 21, 28. 27 is not on "
          "the list.", "p155"),
 },
 "how-whole-numbers-are-built": {
   "s16": ("Pia works out 3 + 5 x 2 and writes 16.",
           [("She added first, but multiplication comes first", True),
            ("She should have written 30", False),
            ("16 is right, you work left to right", False)],
           "Multiplication and division come before addition and subtraction, so "
           "5 x 2 = 10 first, then 3 + 10 = 13.", "p169"),
   "s19": ("Banko says: every multiple of 4 is also a multiple of 8.",
           [("12 is a multiple of 4 and not of 8", True),
            ("He is right, 4 and 8 always go together", False),
            ("It is true only for even multiples", False)],
           "It works the other way round: every multiple of 8 IS a multiple of 4, "
           "because 8 is made of two 4s. The reverse is not true.", "p159"),
   "s20": ("Banko says: 1 is a prime number, because you can only divide it by 1 "
           "and itself.",
           [("1 and itself are the same number here, so it has one factor", True),
            ("1 is prime, he is right", False),
            ("1 is composite", False)],
           "A prime number has exactly TWO different factors. 1 has only one, so "
           "it is neither prime nor composite.", "p160"),
 },
 "past-the-whole-numbers": {
   "s21": ("Your teacher says: 3.7 and 4.5 both round to 4 to the nearest whole "
           "number.",
           [("4.5 is halfway, and halfway rounds up to 5", True),
            ("3.7 rounds to 3, not 4", False),
            ("Both are right", False)],
           "3.7 does round to 4. 4.5 sits exactly halfway between 4 and 5, and "
           "the rule is to round up, so it goes to 5.", "p99"),
   "s23": ("Pia regroups 15.73 as 10 + 5.7 + 0.3.",
           [("Those parts add up to 16, not 15.73", True),
            ("She should have written 10 + 5 + 0.73", False),
            ("Nothing is wrong with her regrouping", False)],
           "10 + 5.7 + 0.3 = 16.0. The place value parts of 15.73 are "
           "10 + 5 + 0.7 + 0.03.", "p96"),
   "s24": ("Guss sorts 62.5 into the group of numbers with 5 hundredths.",
           [("The 5 in 62.5 is 5 tenths", True),
            ("62.5 has no digits after the point", False),
            ("He is right, 5 is always hundredths", False)],
           "The first place after the point is tenths and the second is "
           "hundredths. 62.5 is 62 and 5 tenths.", "p94"),
 },
}

# ---- audits ------------------------------------------------------------------
for lesson, items in WORK.items():
    for step, (said, opts, why, page) in items.items():
        if len(opts) != 3:
            sys.exit("  REFUSED %s %s: wants 3 options" % (lesson, step))
        if sum(1 for _, ok in opts if ok) != 1:
            sys.exit("  REFUSED %s %s: wants exactly one key" % (lesson, step))
        if not re.match(r"^p\d+$", page):
            sys.exit("  REFUSED %s %s: every item cites its Guide page" % (lesson, step))


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


def block(step, said, opts, why, page):
    return ('\n      <!-- %s -->\n'
            '      <div class="spot" data-spot="%s">\n'
            '        <p class="spot-lab">Spot the mistake</p>\n'
            '        <p class="spot-said">%s</p>\n'
            '        <div class="spot-opts"></div>\n'
            '        <p class="spot-fb" role="status" aria-live="polite"></p>\n'
            '      </div>\n    ' % (MARK, step, said))


def js(lesson, items):
    rows = ", ".join(
        "%s: { opts: [%s], why: %s, p: %s }"
        % (lit(step), ", ".join("{ t: %s, ok: %s }" % (lit(o), "true" if ok else "false")
                                for o, ok in opts), lit(why), lit(page))
        for step, (said, opts, why, page) in items.items())
    return ("""
<script>
/* %s - see add-spot-the-mistake.py.
   Cambridge's own modelled errors, each inside the step that teaches the thing
   it gets wrong. Its own script tag, for the same reason the self-check has
   one: the page's existing closure owns every picker on the page. Nothing here
   is scored - nothing on a Grade 5 page is. */
(function () {
  const ITEMS = { %s };
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const shuf = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  document.querySelectorAll(".spot").forEach((host) => {
    const it = ITEMS[host.dataset.spot];
    if (!it) return;
    const box = host.querySelector(".spot-opts");
    box.innerHTML = shuf(it.opts.slice()).map((o) =>
      '<button type="button" class="spot-opt" data-ok="' + (o.ok ? 1 : 0) + '">'
      + esc(o.t) + "</button>").join("");
    let live = true;
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".spot-opt");
      if (!b || !live) return;
      live = false;
      const ok = b.dataset.ok === "1";
      box.querySelectorAll(".spot-opt").forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const fb = host.querySelector(".spot-fb");
      fb.className = "spot-fb " + (ok ? "good" : "bad");
      fb.innerHTML = (ok ? "Yes. " : "Not quite. ") + esc(it.why)
        + ' <span class="spot-src">Teacher\\'s Guide ' + esc(it.p) + "</span>";
    });
  });
})();
</script>
""" % (MARK, rows))


STYLE = """<style>/* %s - see add-spot-the-mistake.py */
  .spot { margin: 16px 0 4px; padding: 13px 15px; border-radius: 12px;
    border: 1px solid var(--line); background: var(--card); }
  .spot-lab { margin: 0 0 6px; font-size: 12px; letter-spacing: .06em;
    text-transform: uppercase; color: var(--muted); }
  .spot-said { margin: 0 0 10px; font-size: 15.5px; line-height: 1.5; color: var(--ink); }
  .spot-opt { font: inherit; font-size: 14px; text-align: left; padding: 8px 13px;
    margin: 0 8px 8px 0; border-radius: 10px; border: 1px solid var(--line);
    background: var(--ground); color: var(--ink); cursor: pointer; }
  .spot-opt.right { border-color: var(--good); background: var(--good-soft); color: var(--good); }
  .spot-opt.wrong { border-color: var(--bad); background: var(--bad-soft); color: var(--bad); }
  .spot-fb { margin: 4px 0 0; font-size: 14.5px; line-height: 1.5; min-height: 1px; }
  .spot-fb.good { color: var(--good); }
  .spot-fb.bad { color: var(--ink); }
  .spot-src { color: var(--muted); font-size: 12.5px; white-space: nowrap; }
</style>
""" % MARK

pages = sorted(f for f in os.listdir(HERE) if f.endswith(".html"))
todo, done, refused, nosrc, total = [], 0, 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        if slug not in ("index", "squares-and-steps", "check-what-you-know"):
            print("  no source  %-32s Stage 5 names no mistake this could use" % slug)
            nosrc += 1
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-32s" % slug)
        done += 1
        continue

    out, missing = s, []
    for step, (said, opts, why, page) in WORK[slug].items():
        # insert just before this step's closing </section>
        m = re.search(r'<section class="step" id="%s">' % re.escape(step), out)
        if not m:
            missing.append(step)
            continue
        end = out.find("</section>", m.end())
        if end < 0:
            missing.append(step + " (unclosed)")
            continue
        out = out[:end] + block(step, said, opts, why, page) + out[end:]
    if missing:
        print("  REFUSED    %-32s step not found: %s" % (slug, ", ".join(missing)))
        refused += 1
        continue

    k = out.rfind("</script>")
    if k < 0:
        print("  REFUSED    %-32s no </script> to follow" % slug)
        refused += 1
        continue
    out = (out[:k + len("</script>")] + js(slug, WORK[slug])
           + out[k + len("</script>"):])
    out = out.rstrip() + "\n" + STYLE

    n = len(WORK[slug])
    if out.count('class="spot"') != n or out.count(MARK) != n + 2:
        print("  REFUSED    %-32s %d blocks, marker %d (want %d, %d)"
              % (slug, out.count('class="spot"'), out.count(MARK), n, n + 2))
        refused += 1
        continue
    # the step count must NOT change: these sit inside existing steps
    if out.count('<section class="step"') != s.count('<section class="step"'):
        print("  REFUSED    %-32s the step count moved - these go INSIDE a step" % slug)
        refused += 1
        continue

    todo.append((p, out))
    total += n
    print("  would      %-32s %d item(s) in steps %s"
          % (slug, n, ", ".join(sorted(WORK[slug]))))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d item(s) across %d lesson(s) %s, %d already done, %d with no source, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, nosrc, refused,
         "" if WRITE else "   (--write to apply)"))
