<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

## The restructured program in `program/` (owner, 2026-09-18): LIVE and routed

The owner replaced the course's design on 2026-09-18. The same day it went live as six NEW Moodle courses, `ehel-intensive-eng-l10`–`l15`, beside the original course. Its apps are at `app/intensive-english/programme/<level>/`, and its media is in g10–g15. The runbook, with what was verified, is `program/kit/GO-LIVE.md`.

- **Audience:** working adults and general learners.
- **Design principle:** general-purpose language learning. The Cambridge objective contract described below no longer decides what goes into a lesson.
- **Levels:** Letters & Sounds (for non-readers), Starter, Levels 1–3 in 9 months, then Level 4 (B2) in 2 more. Level 5 (Business Communication) is optional and later.
- **Pace:** 2 hours a day with a live class of about 30 minutes.
- **Names:** a level is made of **lessons**, not units. A lesson opens with "What this lesson is about" and "Unit lecture", then five sections and Review & check.

The plan is `inputs/ehel-english-intensive-source/program/program-plan.json`. The kit, with its rules and status, is `program/kit/README.md`:

```bash
python program/kit/build_program.py --check   # then without --check to build program/app
```

Everything below describes the ORIGINAL course (l00–l03, lph), which stays live for its learners. Build the new program only in `program/`. Nothing there touches `level-N/` or `level-N-app/`.

## Intensive English Level 1 is built on Cambridge 0057 (2026-09-11)

```bash
node tools/build-intensive-prompt.js 1 <unit>   # one unit's authoring prompt, every slot filled
node tools/build-intensive-units.js [l1-uNN]    # expand authored JSON + the gate
npm run check:intensive                         # the build + the audio-template check
```

Owner decision: Level 1 = Cambridge Primary **English as a Second Language 0057**
Stages 1-3, **Pre-A1 to A1**. The audience is **adult ESL learners** — the owner
restated it on 2026-09-12 after a draft of this rebuild described the course as
age-neutral, which it is not. **Level 2 = Stages 4-6, A1 to A2, rebuilt the
same way on 2026-09-12** (commit `1fcf959c7`): 176/176 objectives, 585 words,
20/20 units, gate green. Narrated, deployed and routed since; the note at the
foot of this file that said otherwise was true for four days.
It replaced a B1 course, and that gap is why it had to: Level 1 exits at a
secure A1 and Level 2 opened at B1, so nothing taught A1 to B1 and a learner
finishing Level 1 met a course two CEFR levels above them on the first screen.
Its bands mirror Level 1's shape — Stage 4 (units 1-7) is "A1, extending
towards A2" and claims no more than A1, because the level STARTS where Level 1
ends; Stage 5 is "A2, developing", Stage 6 "A2, consolidating".
The earlier Level 1 (A1-A2, adult) is in
`inputs/ehel-english-intensive-source/archive/level-1-a1-a2-2026-08/`, and the
earlier Level 2 (B1-B1+) in `archive/level-2-b1-2026-08/` — that one is the
material **Level 3** wants (Lower Secondary 7-9, 0876, A2 to B1), since B1 is
the level it genuinely belongs to.
`src/curriculum/cambridge-english-0057.json` comes from
`tools/extract-cambridge-esl-framework.py`, run on the official text PDF — the
owner's OneDrive copy is a page capture with no text layer.

**Level 3 is the LAST level, and it is BUILT** (`3b2fd1974`, 2026-09-16). 20
units on Cambridge **0876** Stages 7-9, **A2 to B1**, 159/159 objectives cited,
571 words, gate green. Stage 7 is A2 (units 1-7), Stages 8-9 are B1. The whole
course is 60 units. Sources in
`inputs/ehel-english-intensive-source/authored/l3-u01..20.json`.

It was blocked on ONE FILE until the owner supplied the 0876 PDF that same day:
`src/curriculum/cambridge-english-0876.json` now exists, written by
`tools/extract-cambridge-esl-framework.py` (the same tool that produced 0057).
**`0861` is in the repo and is not a substitute**: it is Lower Secondary English
as a FIRST language, the same distinction that made 0057 the choice over 0058
here. The plan entry said B2, blocked on "Grades 9-12 do not exist", until
2026-09-16 — stale from the era when Level 3 meant a B2 course cut from school
grades, and a B2 Level 3 would have recreated the exact gap the Level 2 rebuild
closed.

**Still owed on Level 3: the deploy, and the routing step after it.** Narration
and the standalone app are done — see "Level 3's standalone build" below.

**Levels 4 (C1) and 5 (C2) were dropped on 2026-09-16** (owner). The course ENDS
at B1, and the reason is in the plan's `whyTheCourseStopsAtB1`: the contract
design stops first. Every framework file in `src/curriculum` stops at stage 9,
and above it Cambridge's ESL route is IGCSE — a qualification syllabus, not the
per-stage objectives `build-intensive-units.js` reads. A Level 4 could not have
been built the way 1-3 are.

**The plan is the contract, and the build holds each unit to it.**
`course-plan.json` places every 0057 objective of the level's stages in exactly
one unit (`esl.use` = the grammar cards, `esl.skills` = the tasks) and allocates
every word to one unit. The build fails a unit whose outcomes do not cite its
placed codes, that teaches a word not allocated to it or drops one, whose
outcome claims above its band, or whose assignment writes marks by hand (marks
are 4 per rubric criterion named). Mutation-tested twelve ways. The level sum
("150/150 objectives cited") is read from the built units, never the plan.

Four things that are not obvious:

- **0057 and 0058 share sub-strand tags** (`1Wc.01` is "Content" in one and
  "Creation of texts" in the other), so they are two indexes and two outcome
  fields: `esl` → runtime `cambridgeObjectives` (+ `cambridgeFramework`),
  `cambridge` → `literacyObjectives`. Never merge them into one map.
- **A narrated blank needs a spoken form** (`passageSpeech` /
  `instructionsSpeech`). This course's audio generator refuses `___`; the
  "a blank is a pause" rule is the ENGLISH generator's. The build now fails a
  narrated blank with no spoken form. Clips are named by the DISPLAYED text's
  hash and record the spoken form — until 2026-09-11 the narration lib named
  them after the spoken form, which the app never requests, so the earlier
  course's three spoken-form clips were never served.
- **`lectureVersion` is written by the builder.** It was stamped afterwards by
  another tool, so every full rebuild stripped it from all 40 units. Level 1
  carries `lessonVersion: "v2"`, so a learner's old lesson ticks reset.
- **Word pictures for this level are `GRADE_WORD_PICTURES.ien1`**, re-audited
  for the new 510 words (a water tap beside "tap" = touch, a teddy bear beside
  "play", a flag beside "country" were live defects of the shared map).

### The standalone lesson build (2026-09-12)

```bash
cd intensive-english/lesson-kit
python build-lessons.py --app ../level-1-app    # one page per unit
python build-hub.py     --app ../level-1-app    # the hub, after the lessons
```

Owner: use the design regular English uses. So Intensive English has its own
kit, like every other subject (`science/lesson-kit`, `computing/lesson-kit`,
…): 20 self-contained pages under `level-1-app/`, live at
`app/intensive-english/level-1-v2/`, built from the course data that already
exists. `lib/lesson.css`, `voice.js` and `deck.js` are lifted verbatim;
`lib/intensive.css` and `lib/intensive.js` are the kit's own.

- **No reward furniture: the learners are adults.** The last slide is the
  unit's can-do list, rated by the learner, and its assignment. The lifted deck
  calls `paintStickers()` there, so the kit defines it as that summary.
- **Three opt-ins were added to the shared pipeline**, each leaving every other
  app byte-identical: a lesson entry may carry its own `unit` (`_app.py` —
  these units are numbered from ZERO, so position + 1 reported the wrong unit),
  `"stickers": false` (`check-lessons.py`), and `"brandLine"`
  (`add-header-bars.py` — the bar said "Primary Intensive English").
- **THE UNIT PROBLEM does not apply here.** These lessons ARE the shell
  course's units, 1:1, so the pages report `u00..u19`, the ids the shell
  already writes, and the gradebook sees the right unit.
- **Audio is resolved at run time**, never baked in: the page computes cyrb53
  of the text it is about to speak, exactly as the shell does.
- **Routing is a server step.** `repoint-grade.php --subject intensive-english
  --grade 1` (report; `--apply` writes) from the docroot. Until then the course
  still opens the shell app.
- Two defects found by opening the page rather than reading the diff: `.stage`
  and `.wordcard` already exist in the lifted design system (the hub's cards
  came out in one 343px column), and a `display` rule beats the `hidden`
  attribute (the quiz showed "Try again" before question one).

**Shipped on the owner's go-ahead, 2026-09-11/12:** narration (2,364 clips,
174,388 characters, recorded in six parallel `--only` runs after one sequential
run proved too slow), the media and content uploads, app **v422** for the shell
course, and the standalone build above. Verified from storage by hash and in a
browser on the live pages.

**ROUTED 2026-09-12.** `repoint-grade.php --subject intensive-english --grade 1
--apply` was run through the CDN-staging loop, taking
`local_prequran/ehel_app_url_overrides` from 22 entries to 23, so
`ehel-intensive-eng-l01` now opens `app/intensive-english/level-1-v2/`. Learner
progress is unaffected: the standalone pages report the same unit ids the shell
writes, `u00`..`u19`. The operator's first attempt failed with "Could not open
input file" — the script lives only in this repo, so it has to be pulled into
the docroot, which is what that loop is for.

**Still needs a person, and it is not an engineering step:** an administrator
must point Moodle's `local_prequran/catalog_source_url` at
`catalog-36265fe0a1.json` and run the catalogue sync (the unit titles changed).
Note the catalogue also lists **Art & Design Stage 3**, committed by another
session and not deployed when this was written — worth checking before that
sync runs.

### Level 2, rebuilt 2026-09-12 (`1fcf959c7`), shipped since

Same pipeline, same prompt, Stages 4-6 and A1 to A2. 176/176 objectives, 585
words, 20/20 units, gate green, 0 sentences over any band's ceiling. Three
things it needed that Level 1 did not, each of which would have been invisible
until it bit:

- **`REGISTER_CEILING` knew only stages 1-3**, and an unlisted stage inherited
  Stage 3's number through a `|| 18` fallback — so every A2 unit would have
  been measured against an A1 ceiling and every ordinary A2 sentence reported
  as over. Stages 4/5/6 are now stated (21/24/27), with lecture and
  reading-length bands to match.
- **Cambridge spirals, so a plan pattern must name its INCREMENT.** Present
  simple, past simple, both continuous forms, the present perfect, the future,
  adjectives, relative clauses, adverbs and prepositions each appear in Stages
  4, 5 AND 6. The build fails two cards in a level whose titles share two
  keywords, and an author writes the plan's own words onto the card — so three
  near-identical plan patterns become three near-identical titles and a red
  gate. Three pairs were word-for-word identical in the first draft. Naming the
  increment took the overlap warnings from 72 to 5.
- **The placement exam was broken and no gate could see it.** It guards the
  entrance to Level 2 and still tested the PREVIOUS Level 1: all fifteen
  remediation pointers named unit titles that no longer existed, and its first
  question turned on "receipt", which the rebuilt Level 1 does not teach.
  A learner failing a section was sent to a unit that is not there.

**Narrated, built and deployed since**: `level-2-app` exists, is routed, and
Level 2's narration shipped with Level 1's.

## The Interchange enhancement pass (2026-09-16)

Both levels measured against Interchange (1, 2 and 3) and four gaps closed.
`docs/ehel-intensive-english-authoring-prompt.md` carries the rules; what is
here is what the measuring taught.

- **Connected speech, section K, a 20-unit map PER LEVEL.** Neither level taught
  any: `intonation` 0 occurrences, `linked sound` 0, `schwa` 0, `rhythm` 0.
  **The two levels are not the same case.** At Stages 1-3, 0057 asks only for
  intelligibility (`1Sc.04`, `2Sc.04`, `3Sc.05`), so Level 1's map is RECEPTIVE
  and an outcome claiming productive stress there would claim above band. At
  Stage 6 it is the CONTRACT: `6Sc.05` names intonation and stress at word,
  phrase and sentence level.
- **Level 2 was BREACHING that contract and no gate could see it.** `6Sc.05` was
  placed in Unit 20 and cited by an outcome about "far, much and a lot", so the
  build reported 176/176. **The gate checks a placed code is NAMED by an
  outcome, never that the outcome is about it.** Unit 20 now teaches it.
- **Survival lexis: L1 +28, L2 +21.** `computer`, `internet` and `passport` had
  been absent from the whole course. **Measure a level against the CUMULATIVE
  list, never its own** — `boil`, `mix`, `cut` and `pour` look like Level 2 gaps
  and are all Level 1 Unit 15.
- **`functions`**: 4-8 named speech acts per unit, so something in the repo
  answers "which speech acts can this learner perform?". Nothing did, which is
  why the lexis gap went unnoticed.
- **The quiz was 480 of 480 "Multiple choice"**, the string hard-coded in the
  builder. 134 items (28%) are now answered by WRITING, with the four options
  beside them as a word bank so the item stays as well defined as it was.
  Derived by the builder (`answerMode`), capped at four per unit, an authored
  `mode` overrules. Dropping the options entirely does NOT work: only 22 of 480
  have four options that are forms of one word.

Four things that cost a check:

- **The lesson pipeline is NOT the two commands above.** Running
  `build-lessons.py` alone stripped the modulepreloads, the `pwsEndpoint`
  preconnect and the `.lesson-back` styles — the shipped pages carry ~17 further
  steps from `../../mathematics/lesson-app-tools`. Six of those tools REFUSE on
  this build (deck shape, or Maths content files it has none of) and
  `self-host-fonts` is deliberately skipped. Validate in a scratch copy by
  diffing against the shipped pages before writing to `level-N-app`.
- **A quiz blank is written TWO ways here**, `___` and `...`, and a detector
  that knew only the first reported six units as having none when three of them
  had thirteen between them. A report that names something is worth opening.
- **`course-manifest.json` is learner-facing.** It carries the level ladder, is
  built FROM `course-plan.json`, and the shell app fetches it — so a plan change
  is not finished until the manifests are rebuilt, committed AND uploaded.
- **Audit the word pictures for every word added.** Four were wrong and shipped
  as-is would have taught nonsense: `back` drew a return arrow and `stomach` a
  pregnancy (ien1); `interview` drew a radio microphone, and `online` and
  `festival` drew the same glyph as `internet` and `celebrate` INSIDE one word
  group (ien2). Blanks are honest; a wrong picture is not.

## Level 3's standalone build (2026-09-17)

```bash
cd intensive-english/lesson-kit
python build-lessons.py --app ../level-3-app    # 20 pages
python build-hub.py     --app ../level-3-app    # the hub, after the lessons
# then the shared pipeline, in ../../mathematics/lesson-app-tools/README.md order
```

`level-3-app/` — 20 pages plus `l3-index.html`, `app.config.json` and
`lesson-search.json`, 23 files, the same shape as Levels 1 and 2. Both gates
green (`check-lessons.py`, `check-lesson-search.py`, 420 indexed steps).

- **`app.config.json` is what tells the kit which level it is building** —
  `LEVEL = int(CFG["level"])`, not a flag — so the config has to exist before
  `build-lessons.py` will run at all. Level 3's `levelLabel` is taken from the
  built course manifest ("Level 3 — Threshold"), not invented, because that
  manifest is learner-facing and already carries the ladder.
- **Exactly six of the shared tools REFUSE here**, as they do on Levels 1 and 2:
  `wire-accessibility` and `build-grownup-section` (deck shape),
  `add-reasoning-step`, `add-explanations` and `add-warmup` (Maths content files
  this build has none of), and `wire-quiet-notice` (anchor). `self-host-fonts`
  is deliberately skipped. **That the refusals are harmless was CHECKED, not
  assumed**: every marker those tools would add was counted across all three
  builds, and the kit already provides `<main>`, `aria-live` and the skip link
  in all 20 pages of all three, while the quiet notice is absent from Levels 1
  and 2 too.
- **A rebuild undoes the wiring.** `build-lessons.py` rewrites each page from
  scratch, so every pipeline step has to run again after it — a page rebuilt
  without re-wiring silently loses the launch parameters, and
  `wire-platform-controls`'s own guard then mounts nothing with no error.
- **The hub says "Primary Intensive English" and the lesson pages do not.**
  `brandLine` fixed `add-header-bars.py`, which writes the lesson pages; the hub
  is built by `build-hub.py` and never got it. It is identical on Levels 1 and 2,
  both live and routed, so Level 3 matching them is the correct state and
  changing it here alone would split the three. Pre-existing; not fixed.

### The word pictures: there was no `ien3`, so the SHARED map answered

Level 3's 571 words fell straight through to `WORD_PICTURES` — 87 drew
something and not one was a per-level judgement. `GRADE_WORD_PICTURES.ien3`
now exists and the audit is clean: 0 glyphs shared inside a word group, 0
shared inside a unit, 78 words drawing a picture.

**Five of its entries were recovered from git history rather than invented.**
The earlier B1 course had overrides for `platform`, `circular`, `maintain`,
`add` and `voice`, deleted — correctly — when Level 2 was rebuilt without those
senses. Level 3 is the course that replaced that B1 material, so it teaches them
again, and the judgements applied again almost word for word.

`platform` is the case worth remembering. The note above `ien2` records it
becoming WRONG for Level 2, whose platform is the railway one in Unit 13. Level
3's is the one content is published on, in Unit 16, and the shared map's 🚉 put
a railway platform beside it. **The same override is wrong for one level and
right for the next**, which is the sharper form of that note: an override is a
claim about a sense, and a sense belongs to a level, never to a word.

The rest close two failures that are not equally bad — a glyph shared inside a
word GROUP destroys the contrast the group exists to teach (`clause`/`warranty`,
`compensation`/`reimburse`, `outlet`/`headline`, `pollutant`/`contamination`,
`habitat`/`ecosystem`), while a glyph shared anywhere in one LEVEL teaches
neither word (`develop`/`gain`, `emissions`/`accelerate`,
`consultant`/`referee`). Four more were the shared map's other sense outright:
`monitor` drew the screen for the verb, `observe` drew eyes for "to remark",
`leak` drew water for an unauthorised disclosure, and `candidate` drew a ballot
box for a job applicant.

