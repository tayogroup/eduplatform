# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

EduPlatform / Quraan Academy — a learning platform with three main parts:

1. **Static learner app** — lesson units (Arabic alphabet, tajweed rules, etc.) served from Bunny CDN. Source in `src/`, built into `dist/pre_quraan/`.
2. **Moodle plugins** — `src/moodle/local_prequran`, `local_hubredirect` (hub/launch/BBB live classes), `local_ehelhome` (landing). Deployed to a Moodle server separately; PHP code here is the source of truth.
3. **SQA automation** — a large Playwright e2e suite (`tests/e2e/`) that exercises student/teacher/parent/admin journeys against a live Moodle instance.

## Commands

```bash
npm run dev                      # Vite dev server, http://127.0.0.1:5173
npm test                         # = check:alphabet (rebuild runtime bundle + syntax check)
npm run validate:units           # validate every unit.config.js against the schema
npm run env:local-dev            # validate + build + verify production-path output locally
npm run preview:bunny:production # serve dist/ at http://127.0.0.1:4173/pre_quraan/
npm run test:e2e                 # full Playwright suite (needs EDUPLATFORM_* env, live Moodle)
```

Environment promotion (each step validates + builds + verifies, deploy steps are dry-run):

```bash
npm run env:local-dev -> env:local-unit -> env:integration -> env:staging -> env:production:dry-run
```

Real uploads are `npm run deploy:integration|staging|production`. **Never run a real deploy unless the user explicitly asks.** Production deploy prompts for confirmation. The build stamps `dist/pre_quraan/.bunny-build.json` with the base path; deploy refuses to upload if it doesn't match the target — so always build for the same target you deploy to.

## Architecture

- `src/units/<unit-key>/` — one folder per lesson unit, always exactly: `index.html`, `unit.config.js`, `unit.css`, `unit.messages.js`, `unit.runtime.js`. "alphabet" is the golden unit; new units are cloned from it (`npm run create:unit`, see `docs/cloning-guide.md`).
- `src/shared/js/runtime/*.js` — semantic runtime fragments (`speak.js`, `grid.js`, `playback.js`, `progress.js`, ...).
- `src/shared/js/runtime/runtime.bundle.js` — **GENERATED. Never hand-edit.** Rebuilt from the fragment manifest in `tools/build-unit-runtime-bundle.js` via `npm run check:alphabet`. Commit changed fragments and the regenerated bundle together.
- `src/app-shell/` — the app shell (menu, config, design system CSS).
- `src/media/` — source media (audio/video/images), ~1.4 GB. It is deploy input copied by the Bunny build, not disposable output.
- `src/scripts/` — static lesson/game compatibility pages copied into Bunny output.
- `tools/` — Node/Python/PowerShell scripts for build, deploy, media generation (ElevenLabs/OpenAI — cost real money, don't run casually), and SQA packaging.
- `docs/` — extensive runbooks and implementation plans. Start with `docs/architecture.md`, `docs/bunny-deploy.md`, `docs/eduplatform-admin-runbook.md`.

## Hard rules

- **Grades/Stages 5-8 keep their design**: the full-screen slide deck (`gc-*`, `shell/deck.js`) is for Grades/Stages 1-4 only. By Grade 5 a learner scans a page rather than being walked through it one item at a time, so the grids, tabs and two-column labs there are the intended design, not a backlog waiting to be converted. Gate on stage number, in ONE constant per subject, never per section — the name differs by subject — `DECK_MAX_STAGE` in Science, Mathematics and Global Perspectives, `BOTH_DESIGNS_MAX_STAGE` in Computing, `BOTH_DESIGNS` in English (a boolean, `gradeNumber <= 4`) — but the line is 4 in every one of them; keep every grid renderer byte-identical and give it only a one-line early return (Computing is the exception and says why below: showing both designs at once forced its originals to query inside a region, so they moved into `…Classic` functions behind a dispatcher — the upper stages still reach them unchanged); scope deck CSS to deck-only classes (`.gc-*`, `.wc-*`, `.<subject>-gc-*`) so no rule can match an upper-stage page. Verify at an upper stage in the browser — zero `gc-*` nodes and `body.gc-full` never set — not just by reading the diff. The upper stages carry known cosmetic defects that look like invitations (Science's `.method-example > strong` is 70px serif, a Mathematics size for `24 + 8`, applied to a whole investigation): flag them, never fix them in passing.
- **Generated bundle**: never edit `runtime.bundle.js` directly (`docs/generated-bundle-policy.md`).
- **Stable filenames**: active JS/CSS filenames never contain versions, dates, or `locked`. Versions live in git tags (`alphabet-v1.0.0`, `shared-v1.0.0`) and manifests (`docs/naming-versioning.md`).
- **Unit config schema**: `unit.config.js` must pass `npm run validate:units`; schema documented in `docs/unit-config-schema.md`.
- **Two unit validators, different targets**: `validate:units` checks `unit.config.js` schemas under `src/units/`; `validate:curriculum-units` checks Cambridge objective mappings for **English only** — its glob is `english/grade-*/data/units/*.json`, and `validate-unit.mjs` is English-shaped besides (it requires readings, grammar, speaking and writing sections, and reads objectives from a per-outcome `cambridgeObjectives` field). Pointing it at another subject reports dozens of failures about a schema that subject never claimed. Science's mapping lives at `unit.cambridge` and is checked by `check:science-cambridge`; Computing has no objective mapping at all.
- **Teacher-voice → learner-voice lives in `tools/lib/ehel-learner-voice.js`**, shared by the Computing and Global Perspectives builders. The grammar is shared; each subject passes its own vocabulary. Widening the *default* word lists changes what an already-gated subject produces — add new words in the calling subject's options instead.
- **Secrets**: `.env` holds Bunny storage keys and TTS API keys — never commit it or copy values into source. E2e credentials are `EDUPLATFORM_*` env vars (template: `.env.e2e.example`).
- Windows environment; some docs write commands as `npm.cmd run ...` — plain `npm run ...` works in both shells.

## Curriculum validation

Before merging a change to a Cambridge framework file (`src/curriculum/cambridge-english-*.json`) or to unit objective mappings, both of these must exit 0:

```bash
npm run validate:frameworks
npm run validate:curriculum-units -- --strict-cambridge
```

`validate:frameworks` checks a framework file against itself: text misextracted from the source PDF, numbering gaps within a sub-strand, `counts` disagreeing with the arrays. `validate:curriculum-units --strict-cambridge` checks that every objective a unit claims exists in the stage that unit declares.

A framework failure usually means the extracted JSON is wrong, not the unit. The frameworks are parsed out of Cambridge's PDFs and the source documents are not in the repo, so fix the framework before re-pointing any mapping at it.

## Ehel Academy subject pipelines

Science, Computing and Global Perspectives are built from Word source packs in `~/Downloads`, not hand-edited. Each is `extract → build → check`:

```bash
npm run extract:computing-content && npm run build:computing && npm run check:computing
```

**Never hand-edit `src/prototypes/ehel-academy/{science,computing,global-perspectives}/grade-*/data/`** — it is generated, and the next build overwrites it. Fix the builder instead.

All three subjects export from Google Drive as `Year <n>-<UTC stamp>-<part>.zip`, so a Downloads folder holds three subjects under indistinguishable filenames. The Computing and Global Perspectives extractors classify each archive by what its documents say and accept only their own. The science extractor still picks by name alone, so **check which subject a `Year N` zip actually contains before running `extract:science-content`.**

Computing spans Stages 1-8 (Cambridge Primary Computing 0672, Lower Secondary 0868) — the Stage 8 pack was exported later than the rest and all eight stages are published in `catalog.json`. Stages 1-4 ship as Teacher & Parent Guides, so the builder rewrites their prose into learner-facing explainers (`learnerVoice`); Stages 5-8 ship student lesson books carried across as written. `check:computing` is the gate on that conversion — it fails on adult-addressed text, classroom staging, truncated explainers and modules duplicated across units.

#### Answer keys are checked against the booklet, not just for shape

Three quiz keys shipped bound to the wrong option — a flowchart decision keyed
`oval`, an integer question keyed `3.14`, a micro:bit OUTPUT keyed
`the shake sensor`. Every existing gate passed them: the key was a real option,
the options were unique, the explanation was prose. Nothing compared the key to
the booklet it came from. `check-computing-answer-keys.mjs` does, and is wired
into `check:computing`.

Only **booklet-derived** questions can fail it — 188 of 768. The other 580 are
built from the unit's own content (`Which of these describes "X"?` from
concepts, `What should you do when this happens:` from the debugging table,
`What does "X" mean in computing?` from the glossary) as
`options: [row.answer, ...distractors], answer: row.answer`. The key *is* the
object the question was generated from, so it cannot disagree with itself and
there is nothing external to compare it against. Don't read the 580 as unchecked;
read them as unfalsifiable.

**Ground truth is a committed fixture** (`computing/data/booklet-answer-keys.json`),
not the content model. `outputs/` is gitignored, so a gate reading the model
would find nothing on a fresh clone and pass having compared nothing. Regenerate
after re-running `extract:computing-content`:

```bash
node tools/check-computing-answer-keys.mjs --write-fixture
```

When the model *is* present the gate re-derives every key and fails if the
fixture has drifted from it, so the committed copy cannot quietly go stale. On a
machine without the model that cross-check cannot run — the fixture is trusted,
and its diff is the review surface.

Two traps, both found by the fixture disagreeing with itself between runs:

- **An unnumbered key run binds by position**, so it is only trustworthy when it
  is the same length as the question run. One question that fails to parse
  shifts every later answer onto the wrong question, and the fixture then
  asserts the wrong key with complete confidence. Where the counts disagree the
  section is skipped and reported instead. A gap is recoverable; wrong ground
  truth inside the gate is not.
- **A stem filter that counts words rejects real questions.** "Bandwidth is:",
  "Encryption means:" and "Phishing is:" are two words each, and dropping them
  caused exactly the shift above. The filter exists only to reject the
  underscore runs the booklets print as write-in lines, so it asks for letters,
  not for word count.

The packs write keys five ways (`1 (b)`, `1: (c)`, `1. (b)`, bare `(b)`, `B - `)
and options three ways (`(a)`, `a)`, `A)`), and one layout gives the key run the
**same section name as the questions**, separable only by position. Each variant
was found by a unit silently going unchecked, so narrowing any of them drops
that unit from the gate without saying so.

#### Computing Stages 1-4 show BOTH designs

Every section that has a deck renders the original page first and the same
content as an inline deck under it — thirteen sections, gated by
`BOTH_DESIGNS_MAX_STAGE` in `shell/subjects/computing.js`. There is no
deck-instead-of-original stage: a stage either has both or has the original
alone. The pack division is the reason 4 is the line, the same one Cambridge
draws — Guides below it, student lesson books above.

Two things follow, and both are load-bearing:

- **Each half queries inside its own region.** Both designs draw the same
  section, so both carry `#word-search`, `[data-check]`, `[data-hint]`,
  `[data-activity-done]` and thirty-odd writes to `#app`. The original paints
  first, so a document-wide lookup from either half reaches the other's
  controls. The original uses `c$`/`c$$`/`cRoot()`, the deck uses `d$`/`d$$`,
  and both region variables are cleared in `onBeforeRender` — they point into
  the page being replaced. A new control added to either half must use its
  half's helpers, or it will silently drive the other design.
- **A deck slide draws its diagram flat** (`deckDiagram`, `interactive: false`).
  The original above it already builds the interactive WebGL model, and Build It
  at Stage 4 has eight activities: interactive on both halves was sixteen live
  contexts on one page, against a browser cap of about sixteen.

Word cards carry a picture from `computing/shared/computing-word-pictures.js` —
Computing's OWN map, deliberately not English's `shell/subjects/word-pictures.js`.
This subject redefines ordinary words (a mouse is a pointing device, a key is
part of a keyboard, a table is rows and columns, a bug is a mistake in a
program), so one shared map would put an animal beside "mouse" in one subject or
a computer part beside it in the other. Same rule as English's file: the picture
must BE the word, and a word with no honest picture shows none — which is most
of this vocabulary, because most of it is abstract. About a third of cards are
pictured.

### Global Perspectives

Global Perspectives spans Stages 1-8 (Cambridge Primary 0838, Lower Secondary 1129 — note 1129, not an 08xx code). It teaches six transferable **skills** rather than a body of knowledge, and from Stage 4 each unit is one skill end to end (Research, Analysis, Evaluation, Reflection, Collaboration, Communication).

```bash
npm run extract:global-perspectives-content && npm run build:global-perspectives && npm run check:global-perspectives
```

**The source packs are preserved in `inputs/ehel-global-perspectives-source/`** (extracted `.docx`, the same shape `inputs/ehel-grade*-source/` uses). The extractor prefers a fresh export in `~/Downloads` and falls back to that tree, so a re-export always wins but the pipeline still runs once the zips have been tidied away — which happened, and left the extractor with nothing to read. `source-manifest.json` records which archive each year came from, so provenance in the built units stays the export's own filename.

**Year 5 holds Units 1-2 only** (Research, Analysis), and **Stage 5 is withdrawn from the app because of it** (`WITHDRAWN_STAGES` in `shell/subjects/global-perspectives.js`).

**Evaluation, Reflection, Collaboration and Communication have not been authored** — confirmed by the school on 2026-08-11. **Do not re-export Drive to close this**, and do not go looking for the files: they do not exist. One was taken on 2026-08-09 and returned the same two units byte for byte (8/8 SHA-256 identical to `inputs/ehel-global-perspectives-source/Year 5/`), and a full local sweep found no Global Perspectives source under any other name. This gap closes when four units are written, not found — a content commission, not a pipeline run.

One trap if you search anyway: `~/Downloads/Year 5-20260720T212141Z-1-001.zip` **does** hold Units 1-6, and it is **Science** — its pack shape is Lesson / Experiments / Practice / Reference, where Global Perspectives uses Lesson / Skills Toolkit / Activities & Discussion / Practice & Reflection.

Two pack shapes, one runtime:

- **Stages 1-3 (guided)** — Teacher & Parent Guide + Activity Sheet + Mini-Project & Reflection.
- **Stages 4-8 (self-study)** — Lesson + Skills Toolkit + Activities & Discussion + Practice & Reflection.

**The Stage 1-3 guide is not converted into learner prose.** That was tried, the way Computing converts its Teacher Guides, and it produced broken text ("you and you will explore", "hear other you talk about your families") because the guide is genuinely a letter to the parent rather than lesson text with an adult frame around it. So the learner's teaching comes from the **Activity Sheet**, which is already written to the child, and the guide is kept whole in its own voice under `grownUpGuide` — the five-to-eight model has a grown-up in the room by design. `check:global-perspectives` gates the split: adult-addressed prose fails anywhere a learner reads, and is expected inside `grownUpGuide`.

Two things about this subject's voice checks are deliberately *narrower* than the shared ones. "children" is topic vocabulary here (the subject researches how children travel to school), and "your grown-up" is an instruction to the learner, not to an adult. Matching those bare nouns stripped ~65k characters of correct teaching prose out of Stages 1-3. What is diagnostic is the learner as somebody else's charge — "your child", "let the child draw".

Cambridge does not print objective codes in either Global Perspectives framework: the pages are bare bullets under strand and sub-strand headings. `extract-cambridge-global-perspectives-framework.py` therefore **assigns** codes (`1Rq.01`, `5Fv.01`, `7Ml.01`) and records that in the file's `codeScheme` with `codesArePublishedByCambridge: false`. Reflection takes `F` and Communication takes `M` because `R` and `C` belong to Research and Collaboration. Cambridge also writes one set of objectives per stage *pair* ("Stages 3 to 4"), which is published under both stage keys so a Grade 4 unit maps to `4…` rather than borrowing Grade 3's code.

A unit's objectives are resolved from its skill, and the Year 5, 7 and 8 packs print their own `Code | What Cambridge says` table. The build **proves** the skill rule against those tables and refuses to run if they disagree — so a wrong mapping stops the build instead of shipping.

#### Reviewed Global Perspectives scripts

Same loop as Science and Computing, with its own tools. `export-ehel-global-perspectives-scripts.py` flattens every learner-facing line into one sheet per grade (6,407 rows), on the layout of `ehel-english-scripts-complete.xlsx`; the reviewed file comes back from OneDrive and lands in `global-perspectives/data/script-review.json`:

```bash
python tools/apply-ehel-global-perspectives-script-review.py --workbook <reviewed.xlsx> --grades 6   # --dry to preview
npm run build:global-perspectives && npm run check:global-perspectives
```

Two things are done differently here from the Computing equivalent, both because they were the sources of real defects:

- **The apply step keeps no map of the content.** The exporter records the JSON path of every field in a cell (`explainers.4.body`, `practice.11.answer`) and the apply step reads those paths off that module. Computing maintains a parallel list of source values guarded by an `assert`; here there is only one description of the layout, so the two cannot drift. Overrides are keyed by path, so the builder writes them back without either tool reproducing the other's id scheme.
- **A label owns its own line, in brackets** (`[Answer]`), not a `Answer: ` prefix. A Stage 6 toolkit item begins literally "Table: best for holding neat totals…", which the prefix form read as the start of the Table field and split the row in the wrong place.

Table cells escape a literal `|` (the Stage 2 survey tables hold tally marks written as `| | | |`), and multiple tables in one field are separated by a blank line — without that they rendered into one block that could only be read back as a single table, silently merging them.

The round-trip is verified rather than assumed: every row is split and every field's parsed value compared against the real JSON — 6,407 rows and 11,650 fields, all exact. A row that drops a labelled line is held back whole and reported, so a deleted `[Answer]` cannot erase an answer key. A stale override whose path no longer resolves is refused loudly at build time, because silent non-application means the reviewer's correction is simply absent from what ships.

#### Global Perspectives narration

Same model as Science: `tools/lib/ehel-global-perspectives-narration.js` is the one definition, and `check:global-perspectives-audio` holds it to `global-perspectives/shared/course-ui.js`. Four categories carry a Listen button — `overview`, `explainers`, `boxes`, `words`. The toolkit, activities, practice, quiz and grown-up guide are read, not heard; the AI tutor's text does not exist until a learner types.

```bash
node tools/generate-ehel-global-perspectives-audio.js 1 --dry        # characters, nothing sent
node tools/generate-ehel-global-perspectives-audio.js 1 --budget 900 # prove the pipeline first
node tools/generate-ehel-global-perspectives-audio.js 1              # the full grade
node tools/prune-ehel-course-audio.mjs global-perspectives           # report; --delete to remove orphans
```

The generator **rejects an unrecognised argument** rather than ignoring it: a typo silently falls back to the default set, which is every category of every grade, and that mistake is billed per character.

Clips are committed (as Science's are, unlike Computing's and Mathematics'), so an orphan is free to delete while git still holds it. **All eight grades are generated**: 2,684 clips on disk, ~832k characters, and `prune-ehel-course-audio.mjs` reports 0 orphans. The per-grade totals sum to 2,733 rather than 2,684 because a text shared by two grades is one file claimed twice — a dry run reporting more clips than the directory holds is that overlap, not a gap. Guided grades produce no `words` clips — those packs carry no glossary.

Stage 5's 158 clips (40,251 characters) narrate a **withdrawn** stage. Leave them — they are committed, so they cost nothing to keep and would have to be paid for again — but do not regenerate them while the hold stands.

#### Deploying Global Perspectives — what the CDN actually does (re-measured 2026-08-11)

**Every `.js`, `.css` and `.html` under `app/` is now served `max-age=300`, in all five subjects.** Edge Rule 4's general `*/app/*` pattern is live; `docs/bunny-cache-config.md` recorded it as NOT live when it measured on 2026-08-02, so the 30-day exposure the notes below were written about is five minutes today. `current.json` is the exception and is still `max-age=2592000`.

**Measure before trusting either number.** The window is set by an edge rule, not by the path, so it changes under the repo with no commit to notice — which is what happened here. Reading the figure out of a doc instead of the CDN is how a five-minute cache got written up as a thirty-day one:

```bash
curl -sI "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/global-perspectives/shared/grade-redirect.js" | grep -i cache-control
```

- **A `shared/` filename is not immutable on the CDN, dated or not.** Query strings are ignored (a never-before-seen `?probe=` returns `CDN-Cache: HIT` off the bare URL's entry), so `?v=` busting never worked and dated names were the workaround. Only `v{TAG}/` is genuinely immutable. GP's releases go through the versioned flow (`deploy-app-version.js`, `--shell`), never a bare `upload-app-to-bunny.js global-perspectives`.
- **`app/english/shared/course-ui-20260723e.css` is the 1.3 KB local alias, not the full snapshot the convention promises.** It `@import`s the live `app/english/shared/course-ui.css`, so edits to the English stylesheet propagate into every subject importing the dated alias — GP included. The dated name buys nothing; a `v{TAG}/` bundle does. (`deploy-app-version.js` rewrites that `@import` to a bundled `design-system.css`, so a versioned release is already immune.)
- **`app/{subject}/shared/grade-redirect.js` is deliberately not versioned, and that is safe only because of the edge rule above.** `grade-N/index.html` loads `../shared/grade-redirect.js` and that entry path has to stay stable across releases, so `deploy-app-version.js` uploads the stub outside `v{TAG}/`. At `max-age=300` a release ships it within five minutes. If rule 4 is ever narrowed again it silently returns to 30 days, and a release *depending* on new redirect behaviour would work locally and not on the CDN. All five subjects with per-grade stubs share this.

### Science answer keys and Cambridge mapping are gated

Two checks inside `check:science`, both added after the Computing course shipped
three keys bound to the wrong option with every gate passing them.

**`check-science-answer-keys.mjs`** compares each quiz key with the answer key
printed in its own booklet. Science is far more exposed than Computing here:
598 of its 636 questions come from the booklet, where Computing generates 580
of 768 from the unit's own content and only 188 can disagree with anything.
Ground truth is a committed fixture (`science/data/booklet-answer-keys.json`),
not the content model — `outputs/` is gitignored, so a gate reading the model
finds nothing on a fresh clone and passes having compared nothing. Where the
model IS present the keys are re-derived and the fixture must still match.

```bash
node tools/check-science-answer-keys.mjs --write-fixture   # after extract:science-content
```

**Coverage is recorded and may not fall.** 480 of 636 questions are covered;
the fixture stores that as `minimumCovered` and the gate fails if it drops. A
parser that stops recognising one pack's key layout otherwise takes a whole
unit out of the comparison while the gate still prints ✓ — which is exactly how
156 questions can sit unchecked behind a green tick. Coverage is a number that
only goes up.

The 156 uncovered are 13 units, all-or-nothing per unit, and 6 of them are
**Stage 1, which ships no Practice booklet at all** (Activities, Experiments and
Lesson only — and no Reference, so no glossary either). Those have no booklet
key to check against and never will.

The packs write keys five ways — a 3-column table, a whole section packed into
one cell, and three paragraph forms — and one gives the key run the **same
section name as the questions**. Two traps worth keeping:

- **Splitting keys from questions by section name does not work.** The key
  sections are "Section A Answers" (no "Key" in the name) while the QUESTION
  section is "Section A: Choose the Right Answer" — matching on "answer" swaps
  the two. Position works, but only anchored to a question first: one pack
  titles its whole document "Practice Questions and Answer Keys", so an
  unanchored boundary lands at block 1 and swallows the unit.
- **A letter regex must require its bracket.** Allowing a bare `[a-e]` ate the
  first character of every answer starting with one — "clear glass" became
  "lear glass" and read as a mismatch against a correct key.

**`check-science-cambridge-objectives.mjs`** checks the mapping nothing was
checking. Beyond "the code exists in this stage", it compares the objective
**text** stored beside each code against the framework: a code stays valid
while the text beside it goes stale, and the text is what a teacher reads. It
also prints per-stage coverage, so a stage mapped to a fraction of its
objectives is visible rather than passing as "all codes valid" — Stage 8
currently references 26 of 70, Stage 4 18 of 34.

### Reviewed Science scripts

Narration scripts are reviewed in a workbook, not in the repo: `export-ehel-science-scripts.py` flattens every learner-facing line into one sheet per grade, and the reviewed file comes back from OneDrive. Those corrections cannot be hand-applied to `science/grade-*/data/` (generated), so they live in `science/data/script-review.json` and the builder lays them over every rebuild:

```bash
python tools/apply-ehel-science-script-review.py --workbook <reviewed.xlsx>   # --dry to preview
npm run build:science && npm run check:science
```

The apply step **merges** into the existing override file. It finds edits by diffing the workbook against the content on disk, which already carries any earlier review — so a re-run adds newly resolved rows instead of shrinking the file to just those. It also proves its parser on every row against the real JSON before trusting it on an edit, and refuses to apply half of an answer/options pair. Rows it reports as skipped need a human; they are not silently dropped.

### Reviewed Computing scripts

Same loop as Science, with its own tools. `export-ehel-computing-scripts.py` flattens every learner-facing line into one sheet per stage; the reviewed file comes back from OneDrive and lands in `computing/data/script-review.json`:

```bash
python tools/apply-ehel-computing-script-review.py --workbook <reviewed.xlsx> --grades 1   # --dry to preview
npm run build:computing && npm run check:computing
```

Same safety model: the parser is proved against the real JSON on every row before it is trusted on an edit, and answer/option pairs are applied whole or not at all. Two computing-specific wrinkles — a Code Example's "Listing" line is `<title> (<language>)`, of which only the title is writable, and the exporter must force any cell starting with `=`, `+`, `-` or `@` to text or Excel reads the code as a formula and reports the workbook as corrupt.

### Computing narration audio

`generate-ehel-computing-audio.js` mirrors the Science generator, including the rule that its strings must match `computing/shared/course-ui.js` character for character. `check-computing-audio-coverage.mjs` is the gate and runs inside `check:computing`. It also fails when a category's template cannot be read out of the generator source at all — a multi-line `case` used to skip the wording comparison silently, which is how a drift would slip past the check meant to catch it.

```bash
node tools/generate-ehel-computing-audio.js 1 --dry        # characters, nothing sent
node tools/generate-ehel-computing-audio.js 1 --budget 900 # prove the pipeline first
node tools/generate-ehel-computing-audio.js 1              # the full stage
node tools/generate-ehel-computing-audio.js --orphans      # clips no button asks for any more
node tools/generate-ehel-computing-audio.js --orphans --prune
```

Any content change under an already-generated set — a builder fix, a returned review — moves the text, so its hash moves too and the old clip is orphaned. Re-running the generator fills the new hashes (it is idempotent, so nothing already correct is paid for twice); `--orphans` finds the dead files left behind. It refuses a narrowed run, because with a category or grade filter every other stage's clips would look orphaned.

Clips land in `computing/media/audio/tts/<hash>.mp3`, which is where the app looks in local dev; the Bunny build remaps it to the per-stage `media/computing/gNN/` tree. Stage 1 alone is ~1,030 clips / ~201k characters, and ElevenLabs bills per character — always `--dry` first.

**Ask the claim map what is reachable, never a run's own queue.** `--orphans`
built its set from `textsForUnit`/`textsForCapstone`, which leave out Wehel's
stock tutor phrases — no unit owns them, because the tutor speaks them on every
stage, so they are claimed in `hashesForGrade`. All 77 were reported as dead,
and `--prune` would have deleted them: the tutor drops to the paid runtime voice
on every stock phrase, and computing's clip directory is gitignored, so nothing
brings them back but paying again. `prune-ehel-course-audio.mjs` read the claim
map all along and had been answering 0 the whole time. When two tools disagree
about what is reachable, the one using `hashGradeMap` is right.

**`.bunny-upload-manifest.json` is a local cache, not a record of the CDN.**
"already uploaded: N" is a claim; nothing verifies it against storage, and
anything it wrongly records is skipped forever. 630 Computing clips — the 77
tutor phrases on every stage — sat generated-but-undeployed behind it, and a
later run still skipped 14 it wrongly believed were up. To check reality, list
`media/<subject>/gNN/audio/tts/` on storage and compare against
`hashesForGrade`; to repair, delete the wrong entries from the manifest and
re-run the uploader.

### Science narration audio

`generate-ehel-science-audio.js` pre-renders each Listen button to `media/audio/tts/<cyrb53(text)>.mp3`. The hash is over the button's exact text, so the generator's strings must match `science/shared/course-ui.js` character for character — otherwise the app requests a file that was never written, silently falls back to the paid runtime endpoint, and the clip is money spent on a file nobody serves. `check:science` gates this via `check-ehel-audio-coverage.mjs`, which fails when a Listen button appears that no generator category reproduces, when a template drifts, or when the two copies of `cyrb53` diverge. Run the generator with `--dry` first; it reports characters, and ElevenLabs bills per character.

**`tools/lib/ehel-<subject>-narration.js` is the one definition** of what a course narrates and what each clip is called (`ehel-science-narration.js`, `ehel-math-narration.js`, `ehel-global-perspectives-narration.js`; the hash itself lives in `ehel-narration-hash.js`). Three tools must agree exactly and used to hold drifting copies — the generator (what to buy), `upload-media-to-bunny.js` (where each clip belongs in the deploy tree) and `prune-ehel-course-audio.mjs` (what nothing can reach). Change narrated text there, never in a copy.

Mathematics works the same way and is gated by `check:math`. The two courses share a UI, so they share the button shapes; Mathematics simply has no vocabulary word-cards.

The full local loop:

```bash
node tools/generate-ehel-science-audio.js 1 --dry        # cost first, then drop --dry
node tools/prune-ehel-course-audio.mjs science          # report; --delete to remove orphans
BUNNY_KEY=… node tools/upload-media-to-bunny.js science
```

Two paths, one cache: the course reads `./media/audio/tts/<hash>.mp3` in local dev, but `../../media/science/g<NN>/audio/tts/<hash>.mp3` once deployed. The flat local cache is fanned out per grade **at upload time** by `upload-media-to-bunny.js` — there is no copy in `dist/`, so a clip only reaches production through that upload. A text shared by two grades is uploaded under both. Clips no grade claims are skipped with a warning rather than uploaded, since no UI ever requests them.

A content rebuild renames every clip whose text changed, orphaning the old file. Run the pruner after `build:science`, and note the orphans are only free to delete while git still has them.

### English narration audio

English is the exception to everything above. Its clips are named for their
content (`eng-g05-t01-u03-read01.mp3`), not for a hash of their text, and
`generate-ehel-english-audio.js` reuses any mp3 over 1 KB that already exists.
So editing a sentence leaves the old recording in place, still `available:true`,
and nothing notices. Every other subject orphans the clip automatically because
a changed text mints a new filename. This one cost 853 stale clips: 306 found
by listening, and 547 more that only git could see.

Four checks cover it, and each is blind to something the next one sees. Run them
together or you are only covering a third of the failure surface.

```bash
python tools/check-ehel-english-audio-integrity.py   # descriptors, files, format, duration
python tools/check-english-audio-staleness.py        # git: text edited since the recording?
python tools/audit-ehel-english-sentence-audio.py --grades 1 --categories all
python tools/check-english-word-audio.py             # the single-word clips
```

- **Integrity** reads file size and frame headers, needs no model, and runs in
  seconds. It catches a missing file, an HTML error body written to an `.mp3`
  path, and gross truncation. It cannot tell whether a clip says the right
  words: it reported 0 problems across 16,955 clips while five Grade 1 overviews
  were saying "my name is Taken Seat".
- **Staleness** asks git whether the narrated text changed since the commit that
  wrote the mp3. Deterministic, free, no transcription noise, and the only tool
  that finds a rename: a sentence differing only in who it is about scores ~0.95
  by word and sails through the audit. Measured, not guessed — two random
  samples of 344 clips contained roughly 22 such defects between them and the
  audit found one, so expect it to catch about 1 in 20.

  **Check the clip count it reports.** It should say 16,948, and for one day it
  said 1,898 while reporting zero stale, because it keyed clips by
  `readingId`/`speakingId`/… and the 10,355 vocabulary sentences, 2,211 meanings
  and 1,889 dictionary words are bare audio descriptors nested in their parent
  item with no id of their own. 85% of the course went unexamined and 547 stale
  clips sat behind that clean result. It counts what it cannot identify and
  prints the number; a non-trivial figure there means it is skipping work, not
  finding nothing.

  It compares *commits*, so a freshly regenerated clip reads as stale until
  committed. That answer is correct — the CDN still has the old one.
- **The transcription audit** compares the recording to its script by WORD.
  Never by character: difflib cannot realign after a few early differences in a
  long passage, and a Grade 4 reading differing by seven words in 189 scored
  0.48. It reports proper nouns the recording never says, but never fails a clip
  for them — Whisper renders unfamiliar names unpredictably ("Tariq" as
  "Tareek"), and that overlaps the range real drift occupies.
- **The word check** never transcribes. On 0.6 seconds of audio Whisper
  hallucinates ("mouth" comes back as "Please subscribe"), so it asks whether
  the audio ranks the right word above its rivals instead. Homophones are
  undecidable by anything that listens, so a clip passes within a margin.

**A re-recorded clip keeps its filename, so `.bunny-upload-manifest.json` still
lists it as uploaded and the uploader will skip it** — reporting success while
leaving the old audio live. Drop those entries before uploading a repair. This
bit three separate repairs in one session; for a *new* clip the manifest merely
delays a deploy, but for a re-recorded one it preserves the wrong audio forever.

#### The defect no check here can catch: the voice says the wrong word

`toe` in the Grade 2 dictionary was narrated as "two". The entry was right, the
script was right, the dates matched, and re-recording reproduced it exactly — a
fresh render from the correct text still transcribed as "2" and still ranked
`two` (-0.95) far above `toe` (-5.66). ElevenLabs simply mispronounces the word
with this voice.

Nothing above finds that. Staleness sees matching dates; the audit sees a
recording that faithfully matches its script, because it does — the error is
upstream of the text. Only the word check caught it, and only because a
one-word clip gives the error nowhere to hide: the same mispronunciation inside
a sentence is one word in two hundred and scores ~0.99.

**The fix is `speechSpelling` on the dictionary entry**, which changes only the
text sent to ElevenLabs — the learner still sees `displayWord`. `toe` now sends
`tow`, a homophone the voice reads correctly: the clip transcribes as "Toe" and
the word check passes Grade 2 clean. `speechSpellingReason` records why, beside
the data rather than in a commit message.

Find the respelling by testing, never by reasoning about it. What the voice does
with a spelling is not predictable from the spelling, which is the whole defect:
of six candidates, `toh` came back as "So", `toe.` and `Toe` were no better than
the bare word, and only `tow` worked. Each render is three characters, so a
search costs less than one sentence — generate the candidate, rank it with
`check-english-word-audio.py`, keep what ranks the printed word first.

Use it only where a render has been shown to be wrong. It is a way to make the
voice say the printed word, not a way to change the word.

### The English content gate

```bash
npm run check:english     # node tools/check-english-content.mjs
```

English is hand-authored, so it had no builder to hang a gate on and went
without one — which is how six teacher lesson plans came to sit in a Grade 1
learner's Reading section, narrated, with nothing in the repo saying so.

It deliberately does **not** repeat `validate:curriculum-units`, which owns
per-unit structure, xrefs and the Cambridge mapping. This one covers what
nothing read: cross-file agreement (manifest vs unit title, id, term,
`vocabularyCount`), **who the text is written for**, answer keys in both course
assessments, live audio existing on disk, and that every countable section is
non-empty — an empty one can never be completed, and the unit gate then holds
the rest of the grade shut for good.

**The exemption is `audience: "adult"`, never a `type` string.** Adult-addressed
prose is legitimate only in text marked that way (drawn behind the grown-up
panel) or in a unit's `grownUpGuide`. `validate-unit.mjs` already looks for a
leaked teacher-guide header and then exempts any reading whose type matches
`/phonics/i` — and the six Grade 1 plans are typed "Teacher-led phonics text",
so that exemption swallowed every one. A check whose escape hatch is a
free-text label is one the content can talk its way out of.

Two patterns that cost real accuracy, both found by measuring rather than
reasoning:

- **A phoneme pattern must require its brackets.** Bare `/[a-z]{1,3}/` also
  matches the slash ALTERNATIONS grammar teaching is full of — `am/is/are`,
  `he/she/it`, `in/on/at` — and reported 18 of them as narrated defects across
  Grades 4-8, nearly half of the first run's findings. The opening slash may not
  follow a word character and the closing one may not precede one.
- **Options are stored two ways.** Unit quizzes and both course assessments use
  a pipe-separated string (`"see | smell | taste"`); some carry an array. Reading
  only arrays reported all 36 Grade 8 placement questions as having no options.
  `optionsOf()` is the one parser.

**The baseline may only shrink.** The gate was written after the content, so it
opened on 16 real failures; they live in `english/data/content-gate-baseline.json`
so the build stays green and every one stays visible. A failure not in the
baseline fails; a baseline entry that *stops* firing **also** fails, asking to be
deleted — so the file cannot rot into a permanent amnesty. Its diff is the review
surface. Regenerate deliberately, never to get green:

```bash
node tools/check-english-content.mjs --write-baseline
```

## Git

- Work on `main` (or feature branches off it). History before 2026-07-16 lived on `codex/*` branches, now merged and deleted.
- Primary remote `origin` → `https://github.com/tayogroup/eduplatform` (private). Push after significant work.
- Local backup remote `backup` → `C:\Users\inawa\Documents\Claude Code\EduPlatform-backup\eduplatform.git`. Refresh both with `git push origin main --follow-tags` and `git push backup --all --follow-tags`.

## Verification before committing

1. `npm run validate:units` and `npm run check:alphabet` must pass.
2. **If you touched any PHP: `npm run check:php` must pass.** Not in `npm test` because it spawns a parser per file (~23s for 610 files) and most changes here are JS or content — so it is on you to run it when you edit `src/moodle`.
3. If build output matters: `npm run env:local-dev`, then spot-check via `npm run preview:bunny:production`.
4. Playwright e2e only runs against a configured Moodle instance — don't treat missing `EDUPLATFORM_*` env as a code failure.

### The PHP gate, and the corruption it exists for

`src/moodle` is the source of truth for the Moodle plugins, but until this gate
existed nothing in the npm workflow ever parsed it — PHP was first executed on a
server. `sql_tools.php` sat on `main` broken through several commits, and
`deploy/bbb-live-corrupted-q-files-rescue-20260624-v01.zip` records the same
damage being cleaned up once before that.

The damage is always one shape: a botched global replace turns every lowercase
`p` into `q`, so `<?php` becomes `<?qhq`, `strict_types` becomes `strict_tyqes`.
In a large file it is invisible to diff review.

**`php -l` alone does not catch it**, twice over — which is why `check:php` runs
three checks and none is redundant:

1. **Every file opens with `<?php`.** Ini-independent and instant. Needed because
   with `short_open_tag=Off` — the normal production setting — `<?qhq` is not a
   PHP tag at all, so the file is inline HTML, lints perfectly clean, and PHP
   *serves the source instead of running it*. Nothing executes, `require_login()`
   included, so the file goes to whoever requests the URL.
2. **No p→q markers in the body.** Needed because the damage is not always
   whole-file: `a2fd7041d` was partial. `require_once(__DIR__ . "/config.qhq")`
   keeps a valid opening tag *and* parses cleanly, then fatals at runtime.
   Checks 1 and 3 both pass it.
3. **`php -l` with `-d short_open_tag=1` pinned**, so the parser can see the
   corruption too whatever the local ini says.

Every marker was verified zero-hit across all 610 files before being added. Two
words are deliberately **not** markers: bare `qhq` (`dashboard.php` legitimately
has `$pqhq`, `$pqhplatquiet`) and `exqort` — `live_leadership.php` and
`live_teacher_profile.php` accept `?exqort=` on purpose, a compatibility shim
left over from the June 2026 incident when corrupted pages went live and emitted
those links. Flagging it would be flagging the fix rather than the bug.

Removing any of the three checks makes the gate blind to a real shape of the bug
it was written for.

PHP is found via `PHP_BINARY`, then `PATH`, then the winget package directory —
a freshly winget-installed PHP updates the persistent user PATH but not
already-running shells. If no PHP is found the gate **fails** rather than
skipping: a gate that passes without running is worse than none. Install with
`winget install --id PHP.PHP.8.4 --scope user` (the 8.3 manifest currently 404s).
