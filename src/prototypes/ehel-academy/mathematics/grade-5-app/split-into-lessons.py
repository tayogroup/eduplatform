"""Split the one-page unit into a Grade 1-shaped build: a hub of cards, and a page per lesson.

The unit was one 53,000px scroll of 28 steps. Grade 1 is not organised that way and neither should
this be: g1v2 is a hub of seven lesson cards, each lesson its own page. The four blocks already
marked in the nav become the four lessons, and the check becomes a fifth card.

Two decisions worth knowing:

  Step numbers stay GLOBAL. Step 21 is still "Step 21" on the third page rather than becoming
  step 1 of it. Twenty-five pieces of prose refer to other steps by number ("Step 17 already
  explained why"), and a unit split into parts keeps one numbering for the same reason a book
  keeps one chapter sequence. Renumbering per page would falsify every one of them.

  The word problems ride with lesson four, because "Real life" IS step 28 and its JS is the
  problem set. Only the quiz, the recap cards and the Cambridge table move to the check page.
  Partitioning 36 questions and 29 cards across four lessons would mean guessing which step each
  came from, and that mapping was never recorded.

usage: python split-into-lessons.py
"""
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "squares-and-steps.html")
s = io.open(SRC, encoding="utf-8", newline="").read()

LESSONS = [
    {"meta": "7 steps", "file": "squares-cubes-and-roots.html", "title": "Squares, Cubes and Roots", "steps": (1, 7),
     "strand": "Number and shape", "cls": "c-number",
     "covers": "Build a square out of dots and watch it grow by odd numbers, test whether a number is square, undo a square to get its root, stack a cube and take it apart again, and build a triangle of dots.",
     "icon": '<rect x="3" y="3" width="8" height="8" rx="1.5"></rect><rect x="13" y="3" width="8" height="8" rx="1.5"></rect><rect x="3" y="13" width="8" height="8" rx="1.5"></rect><rect x="13" y="13" width="8" height="8" rx="1.5"></rect>'},
    {"meta": "6 steps", "file": "rules-and-patterns.html", "title": "Rules and Patterns", "steps": (8, 13),
     "strand": "Patterns", "cls": "c-pattern",
     "covers": "Run a rule forwards to make a sequence, work a rule out backwards from its terms, find two unknown numbers from two facts, catch the squares and cubes hiding in a sequence, count matchstick patterns, and jump along a number line.",
     "icon": '<path d="M3 17l4-4 4 4 4-8 6 6"></path><circle cx="7" cy="13" r="1.6"></circle><circle cx="15" cy="9" r="1.6"></circle>'},
    {"meta": "7 steps", "file": "how-whole-numbers-are-built.html", "title": "How Whole Numbers Are Built", "steps": (14, 20),
     "strand": "Number", "cls": "c-number",
     "covers": "Add up the odd numbers and then the even ones, learn which operation comes first, pair up the factors of a number, find what two numbers share, spot a factor at a glance, and sieve out the primes.",
     "icon": '<path d="M4 20V9M9 20V4M14 20v-7M19 20V6"></path>'},
    {"meta": "7 steps", "file": "past-the-whole-numbers.html", "title": "Past the Whole Numbers", "steps": (21, 27),
     "strand": "Number", "cls": "c-frac",
     "covers": "Round a number to a size you can say out loud, read the numbers below zero, fill in the gaps between the whole ones, move the digits by ten, cut a whole into equal parts, and compare two shares out of a hundred.",
     "icon": '<path d="M6 18L18 6"></path><circle cx="7.5" cy="7.5" r="3"></circle><circle cx="16.5" cy="16.5" r="3"></circle>'},
    {"meta": "27 problems", "file": "real-life.html", "title": "Real Life", "steps": (28, 28),
     "strand": "Problems", "cls": "c-shape",
     "covers": "Twenty-seven problems, one at a time. Each one asks you to pick the tool first and only then work it out, because choosing the method is the part that is actually hard.",
     "icon": '<path d="M4 7h16M4 12h10M4 17h13"></path><circle cx="18.5" cy="16.5" r="3.2"></circle>'},
    {"meta": "36 questions &middot; 29 recap cards", "file": "check-what-you-know.html", "title": "Check What You Know", "steps": None,
     "strand": "Practice", "cls": "c-data",
     "covers": "Thirty-six quick questions across the whole unit, twenty-nine things to take away, and the Cambridge mapping that says which stage every step belongs to.",
     "icon": '<path d="M4 12.5l5 5L20 6.5"></path>'},
]

# ------------------------------------------------------------------ carve the source up
head, rest = s.split('<div class="wrap">\n', 1)
hero_a = rest.index("  <header class=\"hero\">")
route_a = rest.index('  <p class="route">')
nav_a = rest.index('  <nav class="steps-nav"')
nav_b = rest.index("  </nav>\n") + len("  </nav>\n")
hero = rest[hero_a:route_a]
body = rest[nav_b:]

secs_src, after = body.split("  <!-- CHECK -->\n", 1)
parts = [p for p in re.split(r"(?=  <!-- STEP \d+ -->\n)", secs_src) if p.strip()]
assert len(parts) == 28, len(parts)
SEC = {int(re.match(r"  <!-- STEP (\d+) -->", p).group(1)): p for p in parts}
SPLIT = "</div>\n\n<script>"          # there is a blank line between the body and the script
check_html = "  <!-- CHECK -->\n" + after[: after.index(SPLIT)]
tail = s[s.index(SPLIT):]

js_a = tail.index("  /* ---- Step 1: ")
helpers = tail[: js_a]
js_region = tail[js_a: tail.index("  /* ---- The voice bar")]
# the stage block was inserted inside a step's JS, so it would travel with that one page only
STAGE_BLOCK = re.compile(r"  /\* ---- Stage labels.*?\n  \}\n\n", re.S)
js_region = STAGE_BLOCK.sub("", js_region, count=1)
assert "const STAGES" not in js_region, "stage block still embedded"

# Two helpers are declared inside a step block and used from OTHER step blocks. That was harmless
# while everything sat in one file and is a ReferenceError once the pages are split: gcd lives in
# step 18 and is called by 25, 26 and 27, which are now a page away. Lift both into the preamble
# every page carries, which is where a cross-block helper belonged all along.
SHARED = ""
for pat in (r"  const factorsOf = [^\n]*\n", r"  const gcd = [^\n]*\n"):
    m = re.search(pat, js_region)
    assert m, "shared helper not found: " + pat
    SHARED += m.group(0)
    js_region = js_region.replace(m.group(0), "", 1)
assert "const gcd =" not in js_region and "const factorsOf =" not in js_region
jparts = [p for p in re.split(r"(?=  /\* ---- Step \d+: )", js_region) if p.strip()]
assert len(jparts) == 28, len(jparts)
JS = {int(re.match(r"  /\* ---- Step (\d+): ", p).group(1)): p for p in jparts}
voice_js = tail[tail.index("  /* ---- The voice bar"): tail.index("  /* ---- Check ---- */")]
check_js = tail[tail.index("  /* ---- Check ---- */"): tail.rindex("})();")]

stages = re.search(r"  const STAGES = \[\n(.*?)  \];\n", tail, re.S).group(1)
STAGE_ROWS = re.findall(r'    \["([^"]+)", "([^"]+)", "([^"]+)"\],\n', stages)
assert len(STAGE_ROWS) == 28
nav_labels = re.findall(r'<a href="#s(\d+)"><b>\d+</b> ([^<]+)</a>', rest[nav_a:nav_b])
LABEL = {int(n): t for n, t in nav_labels}

BADGES = """  /* ---- Stage labels ---- */
  const STAGES = [
%s  ];
  {
    const heads = [...document.querySelectorAll('section.step[id] .step-head')];
    const navs = [...document.querySelectorAll(".steps-nav a")].map((a) => a.textContent.replace(/^\\d+\\s*/, "").trim());
    const kind = (st) => (st.indexOf("Beyond") === 0 ? "beyond" : st.indexOf("6") >= 0 ? "up" : "");
    STAGES.forEach(([title, st], i) => {
      const h = heads[i];
      if (!h || navs[i] !== title) return;
      h.insertAdjacentHTML("beforeend", '<span class="stage ' + kind(st) + '">' + st + "</span>");
    });
    const tbl = document.getElementById("cambridge");
    if (tbl) tbl.innerHTML = '<thead><tr><th class="num">Step</th><th>What it teaches</th><th>Stage</th><th>Objectives</th></tr></thead><tbody>'
      + STAGES.map(([title, st, codes], i) => "<tr><td class=\\"num\\">" + (i + 1) + "</td><td>" + title + '</td><td class="how">' + st + '</td><td class="how">' + codes + "</td></tr>").join("")
      + "</tbody>";
  }

"""

BACK = ('  <p class="backlink"><a href="index.html">&larr; Grade 5 Mathematics</a></p>\n')
# The step nav scrolls sideways because it was built for 28 chips. At six or seven it should simply
# wrap: on a lesson page the last chip sat off the right edge with nothing to say it was there.
BACKCSS = ("  .steps-nav { flex-wrap: wrap; overflow-x: visible; }\n"
           "  .backlink { margin: 0 0 12px; }\n"
           '  .backlink a { color: var(--teal); text-decoration: none; font-weight: 700; font-size: 15px; }\n'
           "  .backlink a:hover { text-decoration: underline; }\n")
CLOSE = "\n</style>"          # no indent on that line; asserted, because a silent miss ships unstyled
assert head.count(CLOSE) == 1, "the </style> anchor moved"
head = head.replace(CLOSE, "\n" + BACKCSS + "</style>")


def page(title, eyebrow, lede, inner, js, stage_rows, nav_items):
    nav = '  <nav class="steps-nav" aria-label="Steps in this lesson">\n'
    for n in nav_items:
        nav += '    <a href="#s%d"><b>%d</b> %s</a>\n' % (n, n, LABEL[n])
    nav += "  </nav>\n"
    h = head.replace("<title>Squares and Steps</title>", "<title>%s</title>" % title)
    hero_html = ('  <header class="hero">\n    <div>\n      <p class="eyebrow">%s</p>\n'
                 "      <h1>%s</h1>\n      <p class=\"lede\">%s</p>\n    </div>\n"
                 # #heroMini has to exist: a shared helper paints the little square into it
                 '    <div class="hero-mini" aria-hidden="true" id="heroMini"></div>\n  </header>\n' % (eyebrow, title, lede))
    stg = BADGES % "".join('    ["%s", "%s", "%s"],\n' % r for r in stage_rows) if stage_rows else ""
    return (h + '<div class="wrap">\n' + BACK + hero_html + (nav if nav_items else "")
            + inner + "</div>\n\n<script>\n" + helpers.split("<script>\n", 1)[1] + SHARED
            + js + stg + voice_js + "})();\n</script>\n</body>\n</html>\n")


TEACHING = len([L for L in LESSONS if L["steps"]])
written = []
for L in LESSONS:
    if L["steps"]:
        a, b = L["steps"]
        nums = list(range(a, b + 1))
        inner = "".join(SEC[n] for n in nums)
        js = "".join(JS[n] for n in nums)
        rows = [STAGE_ROWS[n - 1] for n in nums]
        # derived, because "of 4" was written when the split was four lessons and it is five
        eyebrow = "Mathematics · Grade 5 · Part %d of %d" % (LESSONS.index(L) + 1, TEACHING)
        lede = L["covers"]
    else:
        nums, inner, js, rows = [], check_html, check_js, STAGE_ROWS
        eyebrow = "Mathematics · Grade 5 · The whole unit"
        lede = L["covers"]
    out = os.path.join(HERE, L["file"])
    io.open(out, "w", encoding="utf-8", newline="").write(page(L["title"], eyebrow, lede, inner, js, rows, nums))
    written.append((L["file"], len(nums)))

# ------------------------------------------------------------------ the hub, in the Grade 1 card shape
cards = ""
for i, L in enumerate(LESSONS, 1):
    cards += ('    <a class="lesson %s" href="%s?from=g5">\n'
              '      <span class="mark" aria-hidden="true">\n'
              '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">%s</svg>\n'
              "      </span>\n"
              '      <span class="strand">%s</span>\n      <h2>%s</h2>\n'
              '      <p class="covers">%s</p>\n'
              '      <span class="foot"><span class="steps">%s</span><span class="go">Start</span></span>\n'
              "    </a>\n\n" % (L["cls"], L["file"], L["icon"], L["strand"], L["title"], L["covers"], L["meta"]))

HUBCSS = """
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
  a.lesson { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; padding: 22px; text-decoration: none; color: var(--ink);
    background: rgba(20, 43, 62, 0.88); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow); }
  a.lesson:hover { border-color: var(--teal); }
  .mark { width: 62px; height: 62px; border-radius: 20px; display: grid; place-items: center; color: var(--sel-ink); }
  .mark svg { width: 34px; height: 34px; display: block; }
  .c-number .mark { background: var(--teal); }
  .c-pattern .mark { background: var(--gold); color: var(--accent-ink); }
  .c-frac .mark { background: var(--accent); color: var(--accent-ink); }
  .c-data .mark { background: var(--plum); color: #1B1030; }
  .c-shape .mark { background: var(--good); }
  .strand { font: 700 12px "Inter", "Segoe UI", sans-serif; letter-spacing: 0.09em; text-transform: uppercase; color: var(--teal); }
  a.lesson h2 { font-size: 24px; }
  .covers { color: #C3D3DF; font-size: 17px; margin: 0; }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 12px;
    width: 100%; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--line); }
  .steps { font: 600 14px "Inter", "Segoe UI", sans-serif; color: var(--muted); }
  .go { font: 800 16px "Inter", "Segoe UI", sans-serif; padding: 10px 20px; border-radius: 999px;
    background: var(--gold); color: var(--accent-ink); box-shadow: 0 4px 0 var(--gold-press); }
"""
hub = (head.replace("<title>Squares and Steps</title>", "<title>Grade 5 Mathematics</title>")
           .replace(CLOSE, "\n" + HUBCSS + "</style>")
       + '<div class="wrap">\n  <header class="hero">\n    <div>\n'
       + '      <p class="eyebrow">Ehel Academy · Mathematics</p>\n'
       + "      <h1>Grade 5 <em>Mathematics</em></h1>\n"
       + '      <p class="lede">Squares and Steps, in five parts and then a check, in the order they are meant to be done. '
         "Start at the top &mdash; each one gets you ready for the next, and the last one checks the lot. "
         "Twenty-eight steps altogether, which is about eight sessions rather than one sitting.</p>\n"
       + "    </div>\n  </header>\n\n"
       + '  <div class="grid">\n' + cards + "  </div>\n</div>\n</body>\n</html>\n")
assert "a.lesson {" in hub, "hub CSS did not land"
io.open(os.path.join(HERE, "index.html"), "w", encoding="utf-8", newline="").write(hub)

print("hub + %d pages: %s" % (len(written), ", ".join("%s (%d steps)" % w for w in written)))
