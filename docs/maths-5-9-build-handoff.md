# Maths 5–9: Build Record and Reference

Cambridge Mathematics Grades 5 to 9. Every figure below was measured, not
recalled; where a figure came from a tool the tool is named so it can be re-run.

**This file began on 2026-09-26 as a handoff brief for delegating the build to a
second Claude account on a second workstation. The owner cancelled the delegation
the same day and the work was done in-session instead.** The two phases that only
described that arrangement — creating the second account, and coordinating two
machines against one `origin` — have been removed. Everything else was kept,
because it is about this repo rather than about who is typing, and most of it was
bought by an incident.

Live copy (owner's account): https://claude.ai/artifact/HjLcVMYHdnDp2vbmvXRgrm —
**stale as of 2026-09-26**, still showing Grades 6/7/8 at 90–91% and Grade 9 at
zero. Refresh or retire it.

## Where the five grades stand

| Grade | Framework | Objectives | Claimed | Coverage | State |
| --- | --- | --- | --- | --- | --- |
| 5 | 0096 Primary | 51 | 51 | **100%** | Standalone app, 10 lessons + check. Deployed and routed 2026-09-26 |
| 6 | 0096 Primary | 54 | 54 | **100%** | 17 shell units. Closed 2026-09-26 (`2c5c4447da`), deployed |
| 7 | 0862 Lower Sec | 63 | 63 | **100%** | 16 shell units. Closed 2026-09-26 (`05526cf574`), deployed |
| 8 | 0862 Lower Sec | 61 | 61 | **100%** | 16 shell units. Closed 2026-09-26 (`9605e5fb03`), deployed |
| 9 | 0862 Lower Sec | 55 | 55 | **100%** | **15 shell units, authored 2026-09-26. Committed, NOT deployed** |

All five grades are at full objective coverage against their stage. That sentence
is worth reading narrowly — see **A coverage number is not evidence** at the end.

### What is still outstanding

Nothing about objective coverage. These are the open items:

| # | Item | Whose |
| --- | --- | --- |
| 1 | **Grade 9 is not deployed.** No `course-manifest.json`, no `catalog.json` entry, no Moodle course, no routing | build + operator |
| 2 | **No unit has been curriculum-reviewed.** Every Grade 9 unit records `reviewStatus: "Not curriculum-reviewed"`, and the Stage 7/8 mappings carry `reviewed: false` | curriculum |
| 3 | **Grade 5's shell course claims 18 units over an empty `data/units/`.** A live inconsistency, unchanged since first noted | decision |
| 4 | **No Teacher's Guide exists for Stage 8 or Stage 9** — see below | purchasing |
| 5 | **145 TWM tags in Grades 6–8 have no regeneration path** — see below | build |

## Grade 9, as built

Fifteen units, one per unit of the Stage 9 Learner's Book, authored 2026-09-26
from the Learner's Book and Workbook. Each unit is produced by a committed
builder and verified by a committed checker:

```
tools/build-ehel-math-g9-unit{N}.mjs --write     # writes grade-9/data/units/unit-{N}.json
tools/check-ehel-math-g9-unit{N}.mjs             # recomputes every claim in it
```

| Unit | Title | Objectives | Checks |
| --- | --- | --- | --- |
| 1 | Number and calculation | 9Ni.01–.04, 9Np.01 | 67 |
| 2 | Expressions and formulae | 9Ae.01–.04 | 82 |
| 3 | Decimals, percentages and rounding | 9Np.01, 9Np.02, 9Nf.05, 9Nf.06 | 133 |
| 4 | Equations and inequalities | 9Ae.05–.07 | 109 |
| 5 | Angles | 9Gg.07–.11 | 163 |
| 6 | Statistical investigations | 9Ss.01, 9Ss.02 | 104 |
| 7 | Shapes and measurements | 9Gg.01–.03 | 128 |
| 8 | Fractions | 9Nf.01–.04 | 135 |
| 9 | Sequences and functions | 9As.01–.03 | 115 |
| 10 | Graphs | 9As.04–.07 | 128 |
| 11 | Ratio and proportion | 9Nf.07, 9Nf.08 | 131 |
| 12 | Probability | 9Sp.01–.04 | 73 |
| 13 | Position and transformation | 9Gp.01–.07 | 122 |
| 14 | Volume, surface area and symmetry | 9Gg.04–.06 | 119 |
| 15 | Interpreting and discussing results | 9Ss.03–.05 | 121 |

**1,730 checks, all passing.** Verify the whole grade in one line:

```bash
for n in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do node tools/check-ehel-math-g9-unit$n.mjs; done
```

Coverage, measured against the framework rather than asserted: 55 of 55 placed,
none missing, none invented. **One objective is claimed by two units and that is
deliberate** — `9Np.01` in units 1 and 3. Unit 1 uses powers of ten in the service
of standard form and the index laws; unit 3's section 3.1 is the skill's own
dedicated section and carries the negative powers at length. Grade 7 already has
this shape with `9Gg.11` in units 8 and 5. Two units teaching one objective is
honest; two units each teaching a third of it and both claiming the whole would
not be.

### Grade 9 has no content package, and that is why it is authored

`build:math` reads `outputs/math-content/math-content-model.json`, which holds
**grades 1–8 only**. There is no Stage 9 pack, so Grade 9 units cannot be
generated and are written by hand. The practical consequence: the builders in
`tools/` are the source of truth, and editing a `unit-{N}.json` directly will be
overwritten the next time its builder runs. Fix the builder.

That also means Grade 9 is immune to the rebuild-deletes-work trap below, in the
same way Grade 5 is — nothing composes it from fragments.

## How the Grade 9 checkers were written, and why it matters

The checkers are not a formality and they are not uniform. Six of them found
real defects in content I had just written, so the design is worth carrying to any
future grade.

**Recompute, never restate.** A checker that asserts the answer the builder wrote
tests nothing. Each of these derives the value independently and compares.

**Test a rule as a rule, not as an instance.** The generalisations are where a
defect hides:

- Unit 5 checks `(n − 2) × 180` against a second, independent derivation
  (`n × 180 − 360`) for every n from 3 to 20, and the exterior-angle total for
  every n up to 100 — the whole content of that claim is its independence from n.
- Unit 10 computes each gradient twice, from the symbolic `−a/b` and by solving at
  two values of x, for 936 combinations of a, b and c.
- Unit 8 checks the terminating-decimal rule against long division for every
  fraction with denominator up to 60 — 1,770 comparisons of a rule against the
  thing it predicts.
- Unit 14 **computes** planes of symmetry by testing which reflections map a
  solid's vertices onto themselves, so the cube's 9 is discovered by the same
  procedure that finds a square prism's 5.
- Unit 13 **implements** the transformations and applies 300 random sequences to a
  triangle, because the claim is "any combination".

**Assert that the loop ran.** Every such loop checks its own iteration count. A
rule check over an empty range is this repo's most repeated silent pass.

**Test a set claim as a partition.** Unit 4's inequalities are the clearest case:
"`3x > 4x + 12` has solution `x < −12`" and the error it guards against
(`x > −12`) *share the boundary*, so a checker confirming the boundary would pass
both. Each inequality is instead sampled across a range, requiring the original
statement to be true throughout the claimed set and false throughout its
complement. Unit 3 does the same for rounding bounds — the claim is that every
value in `[24.5, 25.5)` rounds to 25, not merely that the endpoints are right.

**Use the right arithmetic.** Unit 8 works in exact rationals (numerator and
denominator as integers) because 1/3 has no double representation. Unit 3 uses a
tolerance throughout, because `1.15 × 300` is `344.99999999999994` and a checker
using `===` would report correct content as wrong. Unit 7 implements significant
figures properly rather than reaching for `toFixed`, because 254.469 is 254 to
3 s.f. and 254.5 to 1 d.p. and both appear for the same circle.

**Name the pi.** Unit 7's source uses three values — the calculator's, 3.14 and
3.142 — with three different rounding instructions. An answer is only checkable
against the pi it was computed with; a checker using `Math.PI` throughout would
have failed the correct content.

**Say what you cannot reach.** Unit 6 is mostly judgement, so its checker computes
the numeric claims, structurally checks that every judgement item carries a model
answer, and then *prints the 22 items whose correctness it cannot verify*. A green
tick over that unit would overclaim. This is the same discipline as
`check-math-answer-keys.mjs` reporting unchecked questions rather than counting
them as passes.

### Six defects the checkers caught in content that had just been written

Recorded because they are the argument for the checkers existing:

| Where | Defect |
| --- | --- |
| Unit 7 | A metal strip given as 309 cm; 188.5 + 120 is 308.5, so **308** to 3 s.f. |
| Unit 7 | A diameter given as "9.995 cm, which is 10 cm to 3 s.f."; 31.4/π is 9.9949, which is **9.99** and never 10 |
| Unit 6 | A claim that rounded sample parts "can miss the total", attached to a **two-group** example where they provably never can |
| Unit 9 | Two answers containing self-correcting prose — "Wait − 4 × 8 + 33 = 65" — and an answer arguing with itself about whether a rule overtakes at n = 9 or n = 10 (it is 10) |
| Unit 14 | The checker's own plane-counting enumerated angles over `[0, 2π)`, counting every mirror plane **twice** |
| Unit 15 | The checker's expected true mean was wrong (1545/20 is 77.25, not 77.8) |

The Unit 7 pair are the ones that matter: both were plausible-looking numbers in
an answer a learner would copy, and neither would have survived a second reading
by the person who wrote them, because they *looked* right.

**A guard now exists for the Unit 9 class of defect.** Units 9 to 15 fail if the
built JSON contains `Wait −`, `no wait`, `let me check` or similar. Units 1 to 8
do **not** carry it yet — lifting it into a shared gate across all fifteen is a
small job and is not done.

## Thinking and Working Mathematically: a tag nothing read

Found 2026-09-26 by comparing the Stage 9 Teacher's Resource sample against the
tree. Worth knowing before touching it:

- 145 worked examples in Grades 6–8 carry a `twm` tag, and
  `shell/subjects/mathematics.js` renders it to the learner as
  `Thinking: characterising`.
- **Nothing in the repo read it.** No gate, no builder, and it is absent from
  `math-content-model.json`.
- Six tags read `critiquing improving` — Cambridge's pair name with the
  conjunction dropped, reaching a child's screen as two words jammed together.
  Four of those six were on examples asking for one characteristic, not two.
- `conjecturing` was used **zero** times across all 145 — one of the eight
  characteristics absent from the whole subject.

`npm run check:math-twm` (`tools/check-ehel-math-twm.mjs`, wired into
`check:math`) now validates that every tag is one of the eight characteristics or
one of the four pair names, holds per-grade coverage floors, and asserts that
Grades 1–4 carry none. Grade 9 carries 193 tags, in its **builders**, so a rebuild
keeps them.

**Two things remain open.** The 145 Grades 6–8 tags still have no regeneration
path — a `build:math --force` discards them and git history is their only other
copy, which wants either `twm` carried in the content model or a tool that
reassigns every tag. And `src/curriculum/cambridge-mathematics-0862.json`
contains **no TWM material at all**, so the vocabulary is grounded in the
Teacher's Resource and not yet in the repo.

## The books, and OCR

### Stage 7–9 books are image-only PDFs, and the fix is not ocrmypdf

Six books, 1,801 pages, no text layer. Stages 5 and 6 were already fine.

**The naive OCR silently half-fails.** `ocrmypdf` rasterises each page at a DPI
relative to the page's own box, and the Stage 9 Learner's Book has a page box of
0.87 × 1.08 inches carrying a 3296 × 2331 embedded image — an effective 3805 DPI.
At default settings that page rasterises to a few hundred pixels wide, far too
small to read. Result: 252 of 354 pages came back under 50 characters, and what
did come through was garbled.

`tools/ocr-embedded-images.py` goes at the **embedded images** instead, which are
full resolution and each hold a whole two-page spread. Measured on the same book:
178 unique images for 354 pages, 0 empty, 2,280 characters per spread, 413k
total — the whole book including units 10 to 15, which the broken version had as
blank.

**The check that matters is the blank-page rate, not the average.** That book
averaged 298 characters per page *because* 102 pages were fine and 252 were
empty. A mean hides a bimodal failure completely. Always count how many pages came
back under 50 characters.

```bash
python tools/ocr-embedded-images.py <in.pdf> <out.txt> [--limit N]
```

### The extracted text does not survive the session

Recorded in the first version of this doc as blocker 4, and it happened again
during the Grade 9 build: `lb9-full.txt` lives in a session scratchpad, which is
cleared. **Nothing in the repo holds any book extraction.** They are re-derivable
from the PDFs, but budget the re-OCR — it is about ten minutes of tesseract for a
354-page book — rather than expecting to find them.

### There is no Teacher's Guide for Stage 8 or Stage 9

Only a Learner's Book and a Workbook exist for each. The Guide is what the
misconception tooling mines — the Grade 5 spot-the-mistake tool refuses to emit an
item unless it cites a Guide page, and it found 44 named mistakes in the Stage 5
Guide.

Grade 9's units were written without one. The `reference.commonMistakes` entries
in them are authored from the Learner's Book's own error-finding examples (Ari
adding where he should subtract, Zara's mode argument, Cain's sign slip) and from
the Stage 9 **Teacher's Resource sample**, which is front matter plus Unit 1 only
and carries one flagged misconception for that unit. That is thinner than the
Stage 5 provision, and it is a purchasing decision rather than an engineering one.

## Building a lesson in grade-5-app

Grade 5 is the only standalone maths app anyone has extended, and it is the
template for any future standalone build. Both traps below were hit on the real
build and neither is documented anywhere else in the repo.

The lessons are **not** templated: each step is a bespoke interactive widget with
hand-written JavaScript. Measured at 85–128 KB per lesson, of which 20–35 KB is
genuinely custom. Five lessons came to 32 steps and took a working session each.

Grade 5 keeps the upper-stage page design — no deck, no scoring, no sticker
shelf. That is the documented rule for Stages 5 and above, not a gap.

1. Write the page: take lines 1–427 of an existing lesson (the `<head>` and shared
   `<style>`), swap the `<title>`, then author your own `<div class="wrap">` with a
   hero, a `<nav class="steps-nav">` listing only YOUR steps, the
   `<section class="step" id="sN">` blocks, and one `<script>`. Step ids are
   **global across the app** — continue from the highest in use.
2. Register it in `app.config.json` with `title`, `blurb`, `materials`, `support`
   and `challenge`. The last three are what the materials-note and differentiation
   tools read; a lesson without them is silently skipped.
3. Add a `WORK` entry in `add-self-check.py`, a `WORK` entry in
   `add-lesson-opener.py`, and rows in the `STAGES` table in
   `check-what-you-know.html`.
4. Run the chain **in this order**, from `grade-5-app/`:

```bash
python add-self-check.py --write && python add-lesson-opener.py --write && python add-materials-note.py --write && python add-differentiation.py --write && python add-twm-stamps.py --write && python wire-platform.py --write && python add-lesson-search.py --write
```

5. Add a card to the hub **by hand**. See Trap 2.

### Trap 1 — add-self-check MUST run before add-lesson-opener

`add-self-check.py` asserts the nav entry count equals the step count, counting
entries with `<a href="#s`. The opener adds three steps whose links are
`#opener-about`, `#opener-lecture` and `#opener-words`, which do not match — so
once the opener has run, self-check refuses with "nav has N entries for M steps
before this runs". Run it first and both pass. This cost two rebuilds.

### Trap 2 — the hub is NOT generated from app.config.json

`grade-5-app/index.html` lists lessons as hand-written
`<a class="lesson … href="…?from=g5">` cards. `split-into-lessons.py` built it once
as a migration and it has been hand-maintained since, so the whole chain above
wires a lesson **completely** and still leaves it unreachable.

All five new lessons shipped into that state before it was noticed. **What caught
it was the deploy plan**: `index.html` came back byte-identical, same hash, after
four lessons had been added. A hub that does not change when the course grows by
four lessons is the tell. So after adding a lesson, add its card, add its picker
entry, correct any count in the lede, and diff the hub before deploying.

### One thing that looks like a bug and is not

`check-what-you-know.html` carries `id="s29"` and so does `shapes-and-angles.html`.
It is not a duplicate "Step 29": the check page renders that section as
`<span class="step-num">Check</span>`, and the search index is keyed by file as
well as anchor. Renumbering would touch a working page including its
`$("s29").scrollIntoView()` retry handler for no learner-visible gain. Left alone
deliberately.

## Some lesson apps are GENERATED, and a rebuild silently deletes hand-applied work

Still live. The trap most likely to cost a day.

Grade 3's lessons are composed from `grade-3-app/src/l{N}-slides.html` +
`l{N}-content.js` by `src/build.sh`. Most tools that add teaching steps patch the
**built** page instead. So:

- `3248172174` added Story problems to all eight lessons.
- `eac9d39980` added lesson-opener steps and recomposed — rewriting the pages from
  fragments that had never carried the practice steps. **Spot the mistake, Try
  this one and Story problems vanished from all eight lessons**, 9,256 bytes per
  page, and Grade 3 shipped without them until 2026-09-25.

The commit reads as purely additive. The loss is visible only by diffing the list
of step headings.

**A second instance is still live and was re-confirmed during this work.** A plain
rebuild of Grade 3 today also deletes the unit lecture films — `lessonFilm()`, the
`<video>` element, its CSS — because `96b103173f` patched the built pages
surgically. The film code went into `src/add-lesson-opener.py`, but all 16
fragments already carry that tool's marker, so it skips them and the films never
reach `src/`. Measured: rebuilding drops `rows-and-rules` from 225,564 to 224,291
bytes. Running `build-all.sh` during the Grade 5 work deleted the films in the
working tree and they had to be restored with `git checkout`.

**Before running any build script in a lesson app, check whether the app is
generated**, and diff the step headings before and after. Grades 1, 3 and 4 have
the composed shape. Grade 5 does **not** — no `src/`, so pages are authored
directly. Grade 9's shell units are authored by builders in `tools/`, so the same
rule applies in reverse: edit the builder, never the JSON.

## The gates

```bash
npm run check:math            # the whole maths chain, including the two below
npm run check:math-cambridge  # shell-course units against the frameworks
npm run check:math-twm         # the TWM tags
npm run validate:units && npm run check:alphabet && npm run validate:frameworks
```

If any PHP was touched, `npm run check:php` as well — not in `npm test` because it
spawns a parser per file, so running it is on you.

### What each gate does and does not prove

**`check:math-cambridge` walks the shell-course units only.** It checks that each
unit's stage matches its folder, the framework matches the stage, every claimed
code exists in that framework at that stage, and the stored objective text still
matches the framework's. Its loop bound read `grade <= 8` until 2026-09-26 — right
while Stage 9 did not exist and silently wrong the moment it did, because a unit
nothing validates looks exactly like a unit that passed. It now reads `<= 9`.

**The standalone apps make their own claims**, checked by
`tools/check-ehel-math-app-objectives.mjs`. It requires every code an app names to
exist in a mathematics framework, requires own-stage claims to be in that stage,
holds coverage to a floor, and counts coverage only from files listed in
`app.config.json` so a claim in a retired file cannot inflate it. All five apps
are at 100% of their stage, 234/234, mutation-tested four ways.

**An earlier version of this section made a false claim, and the correction is the
better lesson.** It said `grade-1-app` declares `8Wx.31`, a Stage 8 code in a
Stage 1 app. It does not. `8Wx.31` is in no framework and in no text file of any
maths app: it is a byte sequence inside
`grade-1-app/g1v2/lecture-video/days-months-and-clocks.990f0aab.mp4`, found
because the grep that measured it walked a binary. The gate therefore reads
`.html`, `.json` and `.js` only and never opens a media file — **a gate that reads
binaries invents defects, and an invented defect costs more than a missed one
because somebody acts on it.**

**Answer keys are verified by arithmetic, not provenance.**
`check-math-answer-keys.mjs` computes the answer rather than trusting a booklet,
which is stronger, but reaches only about 7% of questions; the rest are
conceptual, diagrammatic or word problems and are reported as unchecked. Coverage
may not fall. Four exclusions exist because each once called a correct key wrong —
estimation questions, algebra, bare `/` read as division, and expressions that do
not account for every number in the question. Do not remove them.

**No gate reads a Grade 9 unit's teaching quality.** The fifteen unit checkers
verify arithmetic and structure. `check:math-cambridge` verifies the codes.
Nothing verifies that the content teaches what it claims — see the end of this
file.

### Verify in the browser, not only in the diff

For any grade at Stage 5 or above, confirm in a real page that there are zero
`gc-*` nodes under `#app` and that `body.gc-full` is never set. The deck belongs to
Grades 1 to 4 only. A passing script is not evidence about rendering — a UI drive
in this repo once passed while two strings rendered jammed together on screen.

## Deploy and routing

Two channels, and the build machine controls neither end to end.

### Content and lesson apps — to Bunny CDN

```bash
node lesson-app-tools/deploy.mjs --app ../grade-5-app                          # plan
node lesson-app-tools/deploy.mjs --app ../grade-5-app --upload > deploy.log 2>&1
```

Shell-course content goes by `tools/upload-content-to-bunny.js <subject>
[--only <substr>] [--dry]`. The `--only` filter is not optional politeness: the
Grades 6–8 deploy used `--only content/mathematics/gNN` three times because a
plain run would have shipped 48 uncommitted peer files from Grades 1, 2 and 4.

The plan step costs nothing and lists every file with its hash. After an upload,
the **storage read-back is the proof** — an edge read is not, because an edge read
is itself a write to the cache.

Four rules, each bought by an incident:

- **Never pipe a deploy through `head` or `tail`.** SIGPIPE kills the upload
  mid-run, and pointers flip per subject as each finishes, so a partial release is
  not uniformly partial. Redirect to a file and read the file.
- **Never invoke a content uploader with an unrecognised flag.** It is treated as
  a real upload of all six subjects.
- **Build for the same target you deploy to.** The build stamps the base path and
  deploy refuses on a mismatch.
- **The release tag is one global number** across all six subjects. Take the
  highest on storage and add one, measured at the moment of use, not at planning
  time. Do not trust a tool's "next free" — it reads a per-worktree manifest.

Storage rules that hold regardless:

- To prove a file is absent, ask storage with the access key. A storage read is
  passive; an edge read is a write to the cache, and a 404 minted on a version or
  media path is edge-cached for 37+ hours and cannot be purged with the key in
  `.env`.
- A storage listing of a directory that does not exist returns HTTP 200 with an
  empty array. Read the body and count objects.
- Never probe a `v{TAG}/` path before its upload lands.

### PHP and routing — owner and operator only

**There is no SSH to the Moodle box.** Confirmed by attempt: the host answers and
refuses on public key. The only route is the documented loop — stage a script on
the Bunny zone under `Ehel Primary/qa/`, the operator curls it into the docroot,
runs it, and both sides delete their copies. A re-staged fix takes a new dated
filename, because the edge caches the broken first upload.

Routing a new grade is two steps, both the operator's:

1. Add the grade to the `TARGETS` table in
   `lesson-app-tools/repoint-grade.php`, keyed `ehel-math-gNN`, pointing at the
   uploaded directory. Only `https://ehelacademy.b-cdn.net/` URLs are honoured;
   anything else is silently ignored and the learner lands on the shell course.
2. Add the course to `local_hubredirect/standalone_lessons.json` on the server, so
   progress reads as a share of the app's lessons rather than the shell course's
   18 units. Verify with one line:

```bash
grep -c ehel-math-gNN /home/ehelacad/quraantest.academy/local/hubredirect/standalone_lessons.json
```

A result of `1` clears it. Neither the build machine nor the repoint script can
check that, which is why it is written down.

**Deploys are run by the owner, not by Claude** — the safety classifier refuses
them. Hand over a single PowerShell line to paste, then verify the result
afterwards.

## Commit discipline

Several sessions edit this tree at once, so this applies whoever is typing:

- Never `git add -A`, `git add .` or `git commit -a`.
- Run `git status` **bare** before every commit. A pathspec-filtered status cannot
  distinguish "nothing else changed" from "I did not ask". During the Grade 9 work
  the tree held 243 modified files belonging to a peer's Computing build
  throughout.
- Commit with a pathspec in one command: `git commit -F <msg-file> -- <paths>`.
  Note this commits the **working tree**, not the index.
- Before reporting anything as pushed, check both remotes:
  `git rev-list origin/main..HEAD` and `git rev-list backup/main..HEAD`.
- After every commit, confirm it is yours: `git show --stat` for the file count you
  asked for, and check the subject line and `Co-Authored-By` trailer.

## Definition of done

A grade is done when all of these hold. Anything short of all of them is in
progress, not done.

| # | Criterion | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 100% of the stage's objectives claimed | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Each claim backed by content that teaches it, **verified by reading** | ✓ | ✓ | ✓ | ✓ | authored, not reviewed |
| 3 | Every declared code exists in the right framework at the right stage | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | All gates exit 0, plus `check:php` if PHP was touched | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Answer keys checked where the arithmetic checker reaches them | ✓ | ✓ | ✓ | ✓ | 1,730 unit checks |
| 6 | Deployed, every file hash matched on a storage read-back | ✓ | ✓ | ✓ | ✓ | **no** |
| 7 | Routed, override read back clean, `standalone_lessons.json` confirmed | ✓ | n/a | n/a | n/a | **no** |
| 8 | Opened in a browser at that grade: zero `gc-*` nodes, no `body.gc-full` | ✓ | ✓ | ✓ | ✓ | **not yet** |
| 9 | Curriculum-reviewed | **no** | **no** | **no** | **no** | **no** |

Row 9 is unmet for every grade. Rows 6, 7 and 8 are what stands between Grade 9
and learners.

## Two habits worth carrying over

**State what was measured, not what was inferred.** Silence is not evidence. This
document exists because a claim that Grade 3's differentiation had shipped turned
out to mean the tool was committed and the pages were never patched — the tool's
own report mode said `0 already done` the whole time and nobody ran it.

**A coverage number is not evidence that anything is taught.** Every grade above
reads 100%, and that means every objective has a citation backed by content
someone wrote — not that a reviewer has read the content against the objective.
This repo has already shipped a level reporting 176 of 176 objectives cited where
one of them had zero coverage of its actual subject: Cambridge `6Sc.05` is about
intonation and stress, and across twenty units `intonation` appeared 0 times,
`schwa` 0, and every hit for `stress` was the vocabulary word "stressful".

To check delivery rather than citation, grep the units for the words the objective
is about and read what comes back. And when an objective concerns something a
course could plausibly skip — a strand like probability, or a skill like
estimation — look there first, because that is exactly the kind a unit can cite in
passing while teaching around it.
