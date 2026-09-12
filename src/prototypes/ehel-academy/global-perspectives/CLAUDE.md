<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

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

**Global Perspectives quizzes are not scored, and carry no `passPercent`.** All
312 questions are `responseMode: "text"`: the learner writes an answer and
compares it with a model answer the page reveals. Nothing marks that, so a
percentage has no input. The units used to declare `passPercent: 80` anyway,
carried over from the multiple-choice subjects and read by nothing — Science
references `passPercent` eight times and draws a score ring from it, Global
Perspectives referenced it zero times, in its own runtime and in the shared
shell. The field is gone from the builder.

Do not add it back as a way to give the section a mastery target. A pass mark
computed from self-marking reports mastery nobody measured, which is worse than
reporting none. If the section ever needs a completion signal it wants a
"questions attempted" count, not a score. The **placement exams are different** —
those 233 questions do carry options and are auto-scorable, and they are where a
threshold belongs if one is wanted.

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

#### Which subjects' clips git actually holds

"An orphan is free to delete while git still holds it" is true per subject, not
in general. Measured 2026-08-24, after Intensive English's 848 were brought in:

| subject | in git | on disk | outside git |
| --- | --- | --- | --- |
| english | 93,065 | 93,065 | 0 |
| science | 6,483 | 6,483 | 0 |
| global-perspectives | 2,685 | 2,685 | 0 |
| intensive-english | 5,592 | 5,592 | 0 |
| mathematics | 0 | 17,806 | all |
| computing | 0 | 7,827 | all |

Mathematics and Computing being wholly untracked is deliberate and recorded in
`.gitignore` beside each rule. **Intensive English used to be the one that
misled**, and the shape of that is worth keeping because it can recur wherever an
ignore rule is added to a directory that already has tracked files in it.

It was the only MIXED case: `git ls-files …/intensive-english/media/audio`
returned 4,744 clips, which reads as "this subject's audio is in git", while 848
files beside them were not. `git status` cannot show that either — ignored files
are precisely what it does not print — so three separate signals all read "fine".

The cause was an ignore rule written against a state that had already changed.
`345966ad4` (2026-08-02) ignored the tree on the stated basis that the clips
"were untracked and undecided: 5,275 files, 507 MB"; 4,752 of them had been
committed the day before in `54ca560d5`. gitignore does not retroactively
untrack, so the rule only ever hid the remainder plus everything generated
afterwards. **Check `git ls-files <dir>` before adding an ignore rule for a
directory** — an empty result is the only thing that makes the rule mean what it
says.

Closed on 2026-08-24 by removing the rule and committing the 848 (163.9 MB), so
the subject now matches Science, Global Perspectives and English. Untracking the
4,744 instead would not have shrunk history by a byte — the blobs stay — so it
would have bought only a stop to future growth while leaving the audio on one
copy. Before the fix all 848 did have a CDN copy, so nothing was ever at risk of
being lost outright; what they lacked was a second one.

The practical consequence is in the pruner. `prune-ehel-course-audio.mjs`
"refuses to remove anything git cannot restore unless `--force`" — so for
Mathematics, Computing and these 848, an orphan is **not** free to delete, and a
`--force` there is spending money to undo a mistake, not tidying. That guard is
the reason the distinction is worth knowing before reaching for the flag.

Stage 5's 158 clips (40,251 characters) narrate a **withdrawn** stage. Leave them — they are committed, so they cost nothing to keep and would have to be paid for again — but do not regenerate them while the hold stands.

#### Deploying Global Perspectives — what the CDN actually does (re-measured 2026-08-24)

**The split is by PATH SHAPE, not by file extension: unversioned entry paths are
`max-age=300`, and `v{TAG}/` bundles are `max-age=31536000`.** Measured across
three subjects on 2026-08-24:

| path | cache-control |
| --- | --- |
| `app/{subject}/` (the directory form) | `max-age=300` |
| `app/{subject}/index.html` | `max-age=300` |
| `app/{subject}/current.json` | `max-age=300` |
| `app/{subject}/shared/*.js`, `shared/*.css` | `max-age=300` |
| `app/{subject}/v{TAG}/*.js`, `v{TAG}/*.css` | **`max-age=31536000`** |
| `content/{subject}/gNN/*.json` | `max-age=300` |
| `media/…/*.mp3` | `max-age=31536000` |

That is the design working: the pointers are short so a release is visible in
five minutes, and the bundles are pinned for a year so a version path can be
treated as immutable.

**Two things this file said until 2026-08-24 were wrong, and both were stale
rather than wrong when written.** They are recorded because the shape of the
error matters more than the numbers:

- "Every `.js`, `.css` and `.html` under `app/` is now served `max-age=300`" —
  true of the entry paths, false of `v{TAG}/`, which is the half the whole
  immutable-release scheme rests on. Read literally it says a released bundle
  refreshes in five minutes; it is pinned for a year, which is exactly why a bad
  release is abandoned and rolled forward under a new tag rather than overwritten.
- "`current.json` is the exception and is still `max-age=2592000`" — it is 300,
  on english, science and computing alike. The 30-day warning attached to it (it
  "can misreport the live version for up to 30 days") no longer holds. What DOES
  still hold is the reason not to trust it: **nothing in the app reads
  `current.json`.** `index.html` is the pointer, and the app loading is the proof.

Also corrected: "all five subjects" — `app/` holds **six** (computing, english,
global-perspectives, intensive-english, mathematics, science), plus `shared/`
and `shell/`, which are not subjects.

**Measure before trusting any of the numbers above, including these.** The window
is set by an edge rule, not by the path, so it changes under the repo with no
commit to notice — which has now happened twice, in both directions. Reading the
figure out of a doc instead of the CDN is how a five-minute cache got written up
as a thirty-day one, and then how a one-year cache got written up as five
minutes:

```bash
curl -sI "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/global-perspectives/shared/grade-redirect.js" | grep -i cache-control
curl -sI "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/english/current.json" | grep -i cache-control
```

- **A `shared/` filename is not immutable on the CDN, dated or not.** Query strings are ignored (a never-before-seen `?probe=` returns `CDN-Cache: HIT` off the bare URL's entry), so `?v=` busting never worked and dated names were the workaround. Only `v{TAG}/` is genuinely immutable. GP's releases go through the versioned flow (`deploy-app-version.js`, `--shell`), never a bare `upload-app-to-bunny.js global-perspectives`.
- **`app/english/shared/course-ui-20260723e.css` is the 1.3 KB local alias, not the full snapshot the convention promises.** It `@import`s the live `app/english/shared/course-ui.css`, so edits to the English stylesheet propagate into every subject importing the dated alias — GP included. The dated name buys nothing; a `v{TAG}/` bundle does. (`deploy-app-version.js` rewrites that `@import` to a bundled `design-system.css`, so a versioned release is already immune.)
- **`app/{subject}/shared/grade-redirect.js` is deliberately not versioned, and that is safe only because of the edge rule above.** `grade-N/index.html` loads `../shared/grade-redirect.js` and that entry path has to stay stable across releases, so `deploy-app-version.js` uploads the stub outside `v{TAG}/`. At `max-age=300` a release ships it within five minutes — measured again 2026-08-24, still 300. If the rule is ever narrowed it silently returns to 30 days, and a release *depending* on new redirect behaviour would work locally and not on the CDN. Every subject with per-grade stubs shares this.

