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

- **Generated bundle**: never edit `runtime.bundle.js` directly (`docs/generated-bundle-policy.md`).
- **Stable filenames**: active JS/CSS filenames never contain versions, dates, or `locked`. Versions live in git tags (`alphabet-v1.0.0`, `shared-v1.0.0`) and manifests (`docs/naming-versioning.md`).
- **Unit config schema**: `unit.config.js` must pass `npm run validate:units`; schema documented in `docs/unit-config-schema.md`.
- **Two unit validators, different targets**: `validate:units` checks `unit.config.js` schemas under `src/units/`; `validate:curriculum-units` checks Cambridge objective mappings under `src/prototypes/ehel-academy/`. Neither covers the other's files.
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

Computing spans Stages 1-7 (Cambridge Primary Computing 0672, Lower Secondary 0868). Stages 1-4 ship as Teacher & Parent Guides, so the builder rewrites their prose into learner-facing explainers (`learnerVoice`); Stages 5-7 ship student lesson books carried across as written. `check:computing` is the gate on that conversion — it fails on adult-addressed text, classroom staging, truncated explainers and modules duplicated across units.

### Global Perspectives

Global Perspectives spans Stages 1-8 (Cambridge Primary 0838, Lower Secondary 1129 — note 1129, not an 08xx code). It teaches six transferable **skills** rather than a body of knowledge, and from Stage 4 each unit is one skill end to end (Research, Analysis, Evaluation, Reflection, Collaboration, Communication).

```bash
npm run extract:global-perspectives-content && npm run build:global-perspectives && npm run check:global-perspectives
```

**The source packs are preserved in `inputs/ehel-global-perspectives-source/`** (extracted `.docx`, the same shape `inputs/ehel-grade*-source/` uses). The extractor prefers a fresh export in `~/Downloads` and falls back to that tree, so a re-export always wins but the pipeline still runs once the zips have been tidied away — which happened, and left the extractor with nothing to read. `source-manifest.json` records which archive each year came from, so provenance in the built units stays the export's own filename.

**Year 5 holds Units 1-2 only** (Research, Analysis). Evaluation, Reflection, Collaboration and Communication were never in the export; that gap needs a re-export from Google Drive, not a code change.

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

Clips are committed (as Science's are, unlike Computing's and Mathematics'), so an orphan is free to delete while git still holds it. Grade 1 is generated: 59 clips, 11,419 characters. Guided grades produce no `words` clips — those packs carry no glossary.

#### Deploying Global Perspectives — two traps verified on the live CDN (2026-08-02)

- **The undated `app/global-perspectives/shared/course-ui.css` / `.js` on the CDN are the day-one versions**, served `max-age=2592000` with query strings ignored. The live release points at the dated `course-ui-20260802a.*` files instead. If a release repoints `index.html` at plain `./shared/…` paths and ships through the plain uploader, learners get the month-old skin and runtime for up to 30 days. GP's next release goes through the versioned flow (`deploy-app-version.js`, `v{TAG}/` bundle), never a bare `upload-app-to-bunny.js global-perspectives` from a tree whose `index.html` references undated names.
- **The CDN copy of `app/english/shared/course-ui-20260723e.css` is the 1.3 KB local alias, not the full snapshot the convention promises.** It `@import`s the live `app/english/shared/course-ui.css`, so the dated name is not immutable on the CDN: edits to the live English stylesheet propagate into every subject that imports the dated alias — GP included — on the shared file's own cache schedule. Don't rely on snapshot immutability until a full snapshot is re-uploaded to the dated path (or subjects move to versioned bundles).

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

## Git

- Work on `main` (or feature branches off it). History before 2026-07-16 lived on `codex/*` branches, now merged and deleted.
- Primary remote `origin` → `https://github.com/tayogroup/eduplatform` (private). Push after significant work.
- Local backup remote `backup` → `C:\Users\inawa\Documents\Claude Code\EduPlatform-backup\eduplatform.git`. Refresh both with `git push origin main --follow-tags` and `git push backup --all --follow-tags`.

## Verification before committing

1. `npm run validate:units` and `npm run check:alphabet` must pass.
2. If build output matters: `npm run env:local-dev`, then spot-check via `npm run preview:bunny:production`.
3. Playwright e2e only runs against a configured Moodle instance — don't treat missing `EDUPLATFORM_*` env as a code failure.
