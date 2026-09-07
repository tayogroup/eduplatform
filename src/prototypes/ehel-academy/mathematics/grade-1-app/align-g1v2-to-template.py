# Bring the SEVEN live Grade 1 lessons (grade-1-v2) onto the same design
# template the nine Grade 2 lessons carry.
#
# This is the same change as align-g1-to-template.py, which was applied to the
# wrong build: the five root lessons are grade-1-preview, kept intact for
# rollback, and grade-1-v2 -- these seven, composed from those five -- is what
# the launch override actually points Grade 1 at.
#
# TWO PALETTE BLOCKS, and only one of them is live for the tokens this touches.
# Each file declares the dark palette TWICE: an original block (--ground
# #0B1D2C, "Ehel coral, lifted") and a later refresh that overrides only
# --ground/--card/--cell/--line. So --accent and --muted still come from the
# FIRST block while the card a learner sees comes from the second. Rather than
# edit either, this appends one final block: later in the file wins, both
# originals stay as the record of what was tried, and there is no chance of
# editing the dead half of a pair.
#
# Every selector in EXTRA is one whose background is a light chip in EVERY
# state it can be in -- .coin is one of four light coin colours, .numgrid
# button.even and .bondbar button.b are always --teal, a .pos badge is teal /
# --good / --bad and all three are light. That is what makes it safe to apply a
# rule to a file whose sweep currently reports zero failures: the poke does not
# reach every state, and colouring text for a background it does not sit on is
# how the first pass of this change broke two things it had not measured.
#
# Idempotent behind MARK.
import re
import sys

MARK = "/* ==== template alignment: ink for coloured chips ==== */"

COMMON = """
  /* ==== template alignment: ink for coloured chips ==== */
  /* The Grade 2 template's re-solved accent, plus the ink tokens it declares so
     text sitting ON a coloured chip stops being hardcoded white. Appended after
     both earlier palette blocks, which is the only place that is certain to win
     - see the note at the top of align-g1v2-to-template.py. */
  :root, :root:not([data-theme="light"]), :root[data-theme="dark"] {
    --muted: #A4B7C8;
    --accent: #ED8E70;
    --teal-ink: #06231F;
    --plum-ink: #241733;
    --gold-ink: #2A1F05;
  }

  .slide-head .n { color: var(--teal-ink); }
  .say button { color: var(--teal-ink); }
  .big.teal { color: var(--teal-ink); }
"""

HERO_GUARD = """
  /* This layer widens the eyebrow's tracking and the base sets it nowrap, so a
     longer eyebrow would push the step dots off a phone. These do not overflow
     at 375px today; the guard is here so a longer one cannot. */
  @media (max-width: 520px) {
    .hero { flex-wrap: wrap; }
    .eyebrow { white-space: normal; }
    .dots { max-width: 100%; justify-content: flex-start; }
  }
"""

# selector -> the ink it should take, applied only where the selector exists
CHIPS = [
    (".card .pos, .picbox .pos", "teal-ink", ".picbox .pos {"),
    (".bondbar button.b", "teal-ink", ".bondbar button.b {"),
    (".numgrid button.even", "teal-ink", ".numgrid button.even {"),
    (".chiprow button.on", "teal-ink", ".chiprow button.on {"),
    # a coin's numeral is dark on a real coin too, and white on gold read at
    # 1.79:1 - the worst failure measured in this build
    (".coin", "gold-ink", ".coin {"),
    (".field .star b", "gold-ink", ".field .star b {"),
    # the machine box is plum ONLY while it is .mystery; the revealed state is
    # #07131D and keeps var(--ink). Scoping this to .box cost a 1.11:1 the
    # first time round.
    (".machine .box.mystery", "plum-ink", ".machine .box.mystery {"),
]

PLUM_TEXT = """
  /* One hoop label is drawn in plum ON the card, where --plum reads 4.30:1
     against the 4.5 it needs. Lifted for TEXT only: the hoop's own border and
     every plum surface keep --plum, so nothing else in the set moves. */
  :root, :root:not([data-theme="light"]), :root[data-theme="dark"] { --plum-text: #BC92D4; }
"""

# Edits no stylesheet can make: the fill is written into an SVG string, or the
# colour is an inline style attribute, which outranks every rule.
JS_EDITS = {
    "asking-and-sorting.html": [
        ('<span class="hlab" style="color:var(--plum)">',
         '<span class="hlab" style="color:var(--plum-text)">', 1),
    ],
    "shapes-and-sizes.html": [
        # the ruler's whole body is --gold and 0, 5 and 10 sit on it
        ('if (i % 5 === 0) t += \'<text x="\' + x + \'" y="48" font-size="11" text-anchor="middle" font-family="Inter" fill="var(--ink)">\' + i + "</text>";',
         'if (i % 5 === 0) t += \'<text x="\' + x + \'" y="48" font-size="11" text-anchor="middle" font-family="Inter" fill="var(--gold-ink)">\' + i + "</text>";',
         1),
        # the beaker's liquid fills y 68 to 120. Labels sit at baseline
        # 108 - i*20 + 4, so 100 (92) is on the teal and 200 (72) is not - its
        # glyph box tops out above the surface. Measured; guessed wrong once.
        ("""      t += '<line x1="20" y1="' + y + '" x2="40" y2="' + y + '" stroke="var(--ink)" stroke-width="2"></line>' +
        '<text x="46" y="' + (y + 4) + '" font-size="11" font-family="Inter" fill="var(--ink)">' + (i * 100) + "</text>";""",
         """      const onLiquid = i <= 1;
      t += '<line x1="20" y1="' + y + '" x2="40" y2="' + y + '" stroke="var(--ink)" stroke-width="2"></line>' +
        '<text x="46" y="' + (y + 4) + '" font-size="11" font-family="Inter" fill="' +
        (onLiquid ? "var(--teal-ink)" : "var(--ink)") + '">' + (i * 100) + "</text>";""",
         1),
    ],
}

FILES = [
    "g1-index.html",
    "counting-to-twenty.html",
    "adding-and-taking-away.html",
    "halves-and-wholes.html",
    "what-comes-next.html",
    "shapes-and-sizes.html",
    "days-months-and-clocks.html",
    "asking-and-sorting.html",
]


def patch(name):
    with open(name, encoding="utf-8") as fh:
        s = fh.read()
    if MARK in s:
        print("%-30s already aligned" % name)
        return
    before = len(s)

    for old, new, want in JS_EDITS.get(name, []):
        n = s.count(old)
        if n != want:
            sys.exit("%s: expected %d of %r, found %d" % (name, want, old[:70], n))
        s = s.replace(old, new)

    block = COMMON
    took = []
    for selector, ink, probe in CHIPS:
        if probe in s:
            block += "  %s { color: var(--%s); }\n" % (selector, ink)
            took.append(selector)
    if 'style="color:var(--plum-text)"' in s:
        block += PLUM_TEXT
        took.append("--plum-text")
    # the eyebrow is nowrap in the base sheet and this layer widens its tracking
    if re.search(r"\.eyebrow \{[^}]*white-space: nowrap", s):
        block += HERO_GUARD
        took.append("hero guard")

    at = s.rindex("</style>")  # the LAST one, so nothing later can override it
    s = s[:at] + block + s[at:]

    with open(name, "w", encoding="utf-8", newline="") as fh:
        fh.write(s)
    print("%-30s +%-5d %s" % (name, len(s) - before, ", ".join(took) or "common only"))


# Default to the seven; a filename list runs it over another build - the five
# grade-1-preview originals take the identical patch, because every rule is
# chosen by whether its selector is present rather than by which file it is.
for f in (sys.argv[1:] or FILES):
    patch(f)
