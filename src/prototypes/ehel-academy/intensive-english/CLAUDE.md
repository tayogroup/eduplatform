<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

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
20/20 units, gate green — built and committed, NOT narrated and NOT deployed.
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

### Level 2, rebuilt 2026-09-12 (`1fcf959c7`) — built, NOT shipped

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

**Not narrated and not deployed** — both need the owner, and there is no
`level-2-app` yet either.

