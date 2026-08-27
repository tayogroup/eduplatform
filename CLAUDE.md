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

- **Grades/Stages 5-8 keep their design**: the full-screen slide deck (`gc-*`, `shell/deck.js`) is for Grades/Stages 1-4 only. By Grade 5 a learner scans a page rather than being walked through it one item at a time, so the grids, tabs and two-column labs there are the intended design, not a backlog waiting to be converted. Gate on stage number, in ONE constant per subject, never per section — the name differs by subject — `DECK_MAX_STAGE` in Science, Mathematics and Global Perspectives, `BOTH_DESIGNS_MAX_STAGE` in Computing, `BOTH_DESIGNS` in English (a boolean, `gradeNumber <= 4`) — but the line is 4 in every one of them; keep every grid renderer byte-identical and give it only a one-line early return (Computing is the exception and says why below: the stacked designs forced its originals to query inside a region, so they moved into `…Classic` functions behind a dispatcher — the upper stages still reach them unchanged); scope deck CSS to deck-only classes (`.gc-*`, `.wc-*`, `.<subject>-gc-*`) so no rule can match an upper-stage page. Verify at an upper stage in the browser — zero `gc-*` nodes and `body.gc-full` never set — not just by reading the diff. The upper stages carry known cosmetic defects that look like invitations (Science's `.method-example > strong` is 70px serif, a Mathematics size for `24 + 8`, applied to a whole investigation): flag them, never fix them in passing.
- **Grades/Stages 1-4 are the deck ALONE except where the deck DROPPED
  something** — ten sections, listed below.
  Owner, 2026-08-26, across all five deck
  subjects: a section that has a deck renders the slides and nothing above them.
  They used to render the original design first and the same content again as an
  inline deck beneath it; the grid above is the page the deck exists to replace,
  and a young learner met it first on every section. One helper per subject does
  it — `renderDeckOnly` in English, Mathematics, Science and Global Perspectives,
  `deckOnlyPage` in Computing — and the deck still mounts with `fullBleed: false`,
  so the topbar stays and the learner asks for the screen with the deck's own Full
  screen button.

  **The exemptions, all owner-decided on 2026-08-26, all on one rule: a section
  keeps both designs where the deck cannot carry something the page alone had.**
  Ten sections in three subjects — English's Reading & story (narration);
  Science's Explore concept, Visual models, Lesson and Activities, and the same
  four in Computing plus Computing Words (interactive WebGL models, see the
  bullet below). Mathematics and Global Perspectives have NO exemptions and must
  keep none: neither draws a `deckDiagram`, and their decks host no WebGL at all,
  so nothing in them lives only in the grid. Everything else stays deck-only —
  a second copy of the same content is exactly what the deck-only change
  correctly removed.

  **English's Reading & story: the narration case.** `renderReading` calls `renderBothDesigns`, which is
  kept alongside `renderDeckOnly` for it alone. The reason is that this is the one
  section where the two halves are not the same content twice: the e-book carries
  the narration — the recorded clip, the read-along highlight, the print button —
  and the deck deliberately carries none of it, because a reading clip is one
  recording of the whole text and a Listen button on page four would start the
  story from page one (`renderReadingCarousel` says so in the code). Deck-only
  there would remove the only way to hear the story.

  So on the reading page the region plumbing below is LIVE rather than dormant:
  `classicScope()` is what stops the e-book's `$("#app").innerHTML = …` erasing
  the deck under it when the shelf redraws, and what keeps `#reading-filter`
  (deck) and `[data-reading]` (shelf) from answering each other's queries.
  `showReadingInDeck` is a real cross-link — picking a text on the shelf moves the
  deck — while `showWordInDeck`, `showWritingInDeck` and
  `showComprehensionGroupInDeck` stay published and unreached.

  **`.deck-only`, not `#deck-design`, is what "the deck replaced the page" means
  now.** Both wrappers are live, so anything asking "is there a deck above me"
  has to ask which kind. `renderSectionGuide` is the case that matters: it is
  suppressed on a deck-only page (its steps describe furniture the child cannot
  see) and drawn on the reading page, where it describes the shelf sitting right
  above it and carries the "Go to the slides" pointer again. `collectPageNarration`
  needs no such test — it prefers `#classic-design`, which exists only where a
  classic half does.

  **Computing's `aria-hidden` + `untabDeckHalf()` are back, on the restored
  sections ONLY, and the same "which kind" rule is why.** They were deleted with
  the deck-only change because with the grid gone they would have taken the ONLY
  design out of the accessibility tree; on a restored section the original
  condition holds again exactly — the deck is a second presentation of content
  read in full above it. Nothing needed a stage test: `untabDeckHalf()` is scoped
  by the attribute (`#app .deck-design[aria-hidden="true"]`) and is a no-op where
  there is no hidden half, so putting the attribute back in `bothDesignsPage`
  alone is the whole change. Keep its `afterPaint` call — the deck mints fresh
  tabbable controls on `setSlides` and `redrawSlide`, so without it the tab order
  silently repairs itself the first time a learner filters or changes slide
  (verified: filtering the Words deck rebuilt 65 controls to 59, still 0
  reachable). Global Perspectives has the identical pair, still correctly
  deleted — it has no restored sections.

  **Do not flip the gate to do this, in either direction.** `BOTH_DESIGNS` /
  `bothDesigns()` is what ROUTES a stage to the deck, so flipping it sends 1-4
  back to the grid — the opposite change — and it is overloaded besides: in
  English it also decides whether the grade offers the cursive worksheet and
  whether that route resolves at all; in Science it decides the worked-example
  counts. Read it as "does the deck replace the page at this stage". The gate
  stays; what it renders is what changed.

  **The tutoring category is the second exemption, and it is a LEARNER
  exemption rather than a section one** (owner, 2026-08-27). A tutoring-support
  learner gets the ORIGINAL page in every section of every subject, at every
  stage — they are at another school and arrive by search on one problem, so
  they need to scan a section and find the part they came for, which is what the
  grid does and what a deck takes away. Everything above still holds for a
  school learner at 1-4.

  It is one line per subject, beside the stage gate and never at a call site:
  `deckPage()` in Mathematics, Science, Computing and Global Perspectives,
  `DECK_PAGE` in English, each the existing gate AND `learnerCategory !==
  "tutoring"`. The stage gate itself is untouched, for the reason directly
  above — it is overloaded, and English's cursive worksheet and Science's
  worked-example counts must not move for this learner. The category comes from
  `ctx.learnerCategory` (course-app.js, from the signed launch token's claim;
  `?category=tutoring` is the dev door), which the four shell subjects now bind;
  English reads its own `IS_TUTORING`.

  **Science carried a dead second gate that this woke up.** Each of its ten
  renderers had `if (deckStage()) return renderXDeck()` under the both-designs
  line — a full-bleed fallback whose expression was identical to
  `BOTH_DESIGNS()`, so the line above always returned first and it had never
  once been reached. Gating only the first line therefore sent tutoring learners
  to a full-bleed deck, topbar and all: the ONE case where the two expressions
  differ is the case that made the dead line live. All ten are deleted and
  `deckStage` with them. No other subject had a second path. Verified in the
  browser, both ways, in all five subjects — 0 `gc-*` nodes under `#app` and no
  `#deck-design` with `category=tutoring`, the deck unchanged without it.

  **Intensive English is untouched and cannot follow this rule**: its Patterns
  section (`renderGrammar`) is a hand-written `gc-*` carousel with no original
  page behind it, so there is nothing to fall back to. It would need a grid
  written first — flagged, not done.

  Four consequences, each of which cost a check when the change was made:

  - **The section guide must not sit above a deck that REPLACED the page.**
    English's and Mathematics' "How to use this page" describes the ORIGINAL in
    its own furniture ("on the left is the list of the 15 words"), so above a
    deck-only page it is instructions for a page the child cannot see. The deck's
    own "How to use these slides" intro slide (`DECK_INTROS`) says the same
    things. Mathematics returns early on `#deck-design`, which is right there
    because every one of its 1-4 sections is deck-only; **English tests
    `.deck-only`**, because Reading & story still has a classic half for the guide
    to describe — and the pointer under the guide ("under the page there are
    slides") is drawn on that page and nowhere else.
  - **The deck had to be UN-hidden from assistive tech in Computing and Global
    Perspectives.** Both carried `aria-hidden="true"` on the deck half plus an
    `untabDeckHalf()` that set `tabindex="-1"` on every control in it — correct
    while it was a second presentation of content read in full above. With the
    grid gone the same attributes would take the ONLY design out of the
    accessibility tree and the tab order. Both are deleted; `deck.js ::
    syncReachable` already does the per-slide work (one reachable slide, the rest
    `inert`, each with role and label). Keyboard and screen-reader users at 1-4
    used to meet the page half alone, by design; they now meet what everyone else
    does.
  - **"Read this page" would read every slide.** A deck paints all its slides into
    the DOM, so `collectPageNarration` falling back to `#app` narrates the whole
    section — 25 practice questions, or several hundred English words. It now
    prefers `#classic-design`, then the one slide that is not `inert`
    (`shell/course-app.js` and `english.js`, one line each).
  - **The interactive WebGL models at 1-4 were GONE, and have been RESTORED —
    by bringing the grid back on the sections that had them, not by putting
    models in the deck.** Owner, 2026-08-26, later the same day. Deck diagrams
    stay flat (`deckDiagram`, `interactive: false`) because every slide is in the
    DOM at once, so nine sections went back to both designs and only those:
    Science's Explore concept, Visual models, Lesson and Activities; the same
    four in Computing plus Computing Words, which is the only route to the
    per-word explainer (`computing-word-scenes.js`). Mathematics and Global
    Perspectives are untouched and must stay so — neither draws a single
    `deckDiagram`, so neither lost anything.

    **Two measurements in the previous version of this bullet were wrong. Both
    were checked in the browser on 2026-08-26 and both mattered to the fix.**

    "The grid could afford one live context because it showed one topic at a
    time" is true for HALF the sections and false for the other half, and the
    same note's own figure ("up to eight contexts for Stage 4 Build It")
    contradicts it — eight only parses if the grid held eight at once. Measured
    per renderer, `interactive` contexts on one page:

    | section | how the grid draws it | contexts |
    | --- | --- | --- |
    | Explore concept | the ACTIVE discovery | 1 |
    | Visual models | the ACTIVE model | 1 |
    | Computing Words | the ACTIVE word's card | 1 |
    | Lesson | `concepts.map(…)` | one per concept — 6 Science, 5 Computing |
    | Activities | `activities.map(…)` | one per activity — 6 Science, **8** Computing |

    That is the state that shipped for months before deck-only, not a new
    hazard — but it is why the deck half MUST stay flat on a restored section.
    Interactive deck diagrams would double these to 2N and put Activities past
    the cap (about sixteen on desktop, commonly eight on mobile).

    "A 15-word unit would be 15 contexts" is about moving the explainer INTO the
    deck. The grid's word card shows one word and holds ONE context, which is
    why restoring the grid is the cheap way to get the explainer back and moving
    it into the deck is not. `computingWordExplainer(current.term)` — singular,
    the active word.

    Two things to know before touching this again. **Not every diagram index has
    a scene**: `scienceDiagram` returns a static SVG when `diagram.scene` is
    falsy (Science 24 of 33 have one, Computing 19 of 27), so a section legitimately
    shows "Visual example" rather than "Interactive example" at some indices —
    zero canvases at index 0 is data, not a broken restore. And
    `initScienceWebGL` / `initComputingWebGL` mount a renderer for EVERY matching
    canvas in scope with **no cap and no lazy mounting**; the `try/catch` shows a
    fallback only on synchronous creation failure, and there is no
    `webglcontextlost` handler in either file, so a browser that evicts the
    oldest context to honour a new one leaves a silently blank canvas. That is
    pre-existing and unaddressed.

    `check-computing-webgl-scenes.mjs` was the worked example of a gate that is
    green about a feature nobody can reach — its "word explainer coverage:
    grade 1: 88/88 … grades 1-4 must be total" passed the entire time the
    explainer was unreachable. It now describes something a learner can get to,
    which is what makes it a gate again rather than a fact about data.
  - A pre-existing 22px horizontal overflow on a deck page is NOT from this
    change: the deck is 960px in a 946px content column, measured identical with
    the grid half restored in the DOM. It is the shape Global Perspectives'
    stylesheet already describes as shared and wanting a design-system fix.
- **The English picture-book shelf stops at Grade 4.** Decided by the owner on
  2026-08-20, after Grades 1-4 shipped, and it is a decision rather than a gap —
  do not "finish the set" at 5-8. Two reasons, both visible in the content: every
  Grade 5 unit already carries its own serialised story (*The Burrow Discovery*,
  *The Memory Wall*, *The Forgotten Mural* — three parts each), so another book
  per unit would be a second narrative competing with the one the unit tells; and
  Grade 5's units teach text *forms* (fable, information text, haiku, legend,
  instructions, genre, point of view, persuasion, playscript), which ten
  identical twelve-page picture books would flatten. It also sits against the rule
  above: a page-turning book is exactly the one-item-at-a-time walk-through the
  upper stages are meant not to have. `unitEbooks()` already filters by grade, so
  the section simply does not appear at 5-8 and nothing needs gating.

  **The TUTORING category is exempt, at every grade. Owner, 2026-08-27.** A
  tutoring learner gets the whole 146-book library wherever they are standing,
  including Grades 5-8. The seam is `shelfEbooks()` in `shell/subjects/english.js`
  — `IS_TUTORING ? ebookCatalog : unitEbooks()` — and `visibleSections` offers
  Books whenever that is non-empty, which is why the section now appears at Grade 6
  and opens on *Smile Please! · Level 1*.

  This does not soften the rule above for the COURSE, which is untouched:
  `unitEbooks()` still answers every course page, a Grade 5-8 course learner still
  has no shelf, and a Grade 1-4 course learner still gets their own unit's books
  and nobody else's. What changed is only who else may read them.
 
  The reasoning is that the 2026-08-20 decision is about what a page-turning book
  does to upper-stage TEACHING — competing with the unit's own serialised story,
  flattening a unit that teaches text forms. A tutoring learner is not doing that
  teaching. They arrive from a search with a problem and no position, which is the
  same reasoning that gives them a +/-2 grade window and no unit gate, and an
  easier book is often exactly what an older learner stuck on reading needs.
 
  **It was nearly shipped as a side effect, which is the part worth keeping.** It
  arrived inside a picker fix: widening `shelfEbooks()` made `visibleSections`
  keep `ebooks` at every grade, so the nav grew the entry, so the picker offered
  it. Both changes were individually correct and their product crossed a
  documented owner decision that neither of them named. It was caught in review by
  another session, not by any gate — nothing in the repo reads CLAUDE.md — and the
  session that shipped it had verified "146 books at Grade 5 tutoring" and
  recorded it as the feature working.
 
  One consequence to know before touching the picker: the nav filter in
  `course-app.js :: paintTutoringSections` was written to drop Books at Grades 5-8,
  and this exemption means it no longer has that job. Measured at Grade 6 tutoring,
  it currently filters NOTHING for English — all ten section ids survive. It still
  guards the general case (a unit with no game pack draws no `games` entry), but
  do not read it as protecting the Books boundary; that boundary is gone by
  decision.
- **Generated bundle**: never edit `runtime.bundle.js` directly (`docs/generated-bundle-policy.md`).
- **Stable filenames**: active JS/CSS filenames never contain versions, dates, or `locked`. Versions live in git tags (`alphabet-v1.0.0`, `shared-v1.0.0`) and manifests (`docs/naming-versioning.md`).
- **Unit config schema**: `unit.config.js` must pass `npm run validate:units`; schema documented in `docs/unit-config-schema.md`.
- **Two unit validators, different targets**: `validate:units` checks `unit.config.js` schemas under `src/units/`; `validate:curriculum-units` checks Cambridge objective mappings for **English only** — its glob is `english/grade-*/data/units/*.json`, and `validate-unit.mjs` is English-shaped besides (it requires readings, grammar, speaking and writing sections, and reads objectives from a per-outcome `cambridgeObjectives` field). Pointing it at another subject reports dozens of failures about a schema that subject never claimed. Science's mapping lives at `unit.cambridge` and is checked by `check:science-cambridge`; Computing has no objective mapping at all.
- **Teacher-voice → learner-voice lives in `tools/lib/ehel-learner-voice.js`**, shared by the Computing and Global Perspectives builders. The grammar is shared; each subject passes its own vocabulary. Widening the *default* word lists changes what an already-gated subject produces — add new words in the calling subject's options instead.
- **Secrets**: `.env` holds Bunny storage keys and TTS API keys — never commit it or copy values into source. E2e credentials are `EDUPLATFORM_*` env vars (template: `.env.e2e.example`).
- Windows environment; some docs write commands as `npm.cmd run ...` — plain `npm run ...` works in both shells.

## Wehel, the AI tutor, and the contract that holds it

```bash
npm run check:wehel          # phrase-audio drift + the contract below + teacher scripts
npm run check:wehel-contract # the contract alone
npm run check:teacher-scripts # the teacher scripts alone
```

`check-ehel-teacher-scripts.mjs` was chained in on 2026-08-24. It existed, it
passed, and **nothing aggregated it** — it ran only if somebody typed its exact
name, which is a gate that does not run. It was found by accident: a stray
untracked copy of `package.json` in `src/prototypes/ehel-academy/` turned out to
differ from the real one in exactly one script, and that script was a `check:wehel`
with this third step chained on. `git log -S` shows that form never existed in the
repo's history, so somebody had intended it and it never landed.

Worth stating because the discovery route does not generalise and the failure does:
a gate reachable only by hand is indistinguishable from one that is wired, right
up until the day it matters, and nothing in the repo reports the difference.

Wehel spent 2026-08-14 giving learners confidently wrong answers, and **not one
existing gate could see any of it** — every failure was in data the model
receives, which nothing in the repo read. `check-wehel-contract.mjs` imports
the real functions and tests them by behaviour, so a refactor that keeps the
rules passes and one that drops a filter fails.

**The transcript the model sees carries answered pairs and the live question,
and nothing else.** Three separate mechanisms broke that, each surfacing as a
reply that answered a question the learner had not just asked:

- The canned offline hint was sent as an assistant turn, so the model adopted
  it and resumed its off-topic mini-lesson ("day" for "birth**day**", picked by
  substring) on every later turn.
- Hiding the hint but keeping the **question it answered** left an answerless
  turn that merged into the next ask — "Three good questions!" to a learner who
  asked one, the real question served last.
- A tab closed mid-reply saves a question with no answer and no failure flag.
  `localStorage` outlives the tab, so these accumulated; Opus's 7-10s latency
  made abandonment routine. Two adjacent user turns can only mean this — the
  input locks while a reply is pending.

Diagnostic tell for all three: **the reply answers more questions than were
asked**, or says "you asked about". A "fresh launch" does not clear them —
`localStorage` is per-origin, not per-tab.

**A whole unit must reach the tutor.** The cap lives in three files
(`shell/wehel.js` `UNIT_JSON_LIMIT`, `wehel_chat.php`, `tools/lib/wehel-dev-chat.js`)
and the smallest wins silently, so the gate holds them equal. It also strips
every unit with the app's own function and fails if one no longer fits: at the
old 120k cap, **63% of an English unit was audio descriptors** (path, duration,
voiceId, hash per narrated line), so the cut landed just after the word lists
and in all 81 English units the readings, grammar, quizzes and answer keys were
invisible. It taught vocabulary because vocabulary was all it could see. The
strip removes whole `audio`/`*Audio` objects, never fields — a field-by-field
version would catch teaching text that happens to share a name.

This gate was **mutation-tested**: each invariant was broken in turn and the
gate had to fail. One check passed a deliberately broken filter — it asserted
on message *count*, and adjacent same-role turns merge, so four stray questions
became one message that still looked right. Assert on payload **content**. A
gate you have not watched fail is not known to work.

Two things it cannot see, both server-side config: the model
(`local_prequran/wehel_model`) and the suspended rate limit
(`wehel_chat_rate_limit`, 0 = off — the machinery is intact, set it to restore
the cap on a paid endpoint).

## The tutoring topic index

```bash
npm run build:topic-index   # derive <subject>/<stageDir>/data/topic-index.json from the unit JSONs
npm run check:topic-index   # re-derive and byte-compare; withdrawn content absent; sections resolve; floors
```

The tutoring add-on starts from a problem ("percentages homework"), not a
course position, so it needs an answer to "where does Ehel teach this?" —
which nothing else in the repo holds. `tools/lib/ehel-topic-index.js` is the
one definition, shared by builder and gate; the output is a pure function of
the content (no timestamps), so the gate rebuilds and byte-compares — a
content rebuild without a re-run of `build:topic-index` fails it. The files
live inside the `data/` trees the content uploader already walks, so they
deploy as ordinary content-tier files, all 41 of them.

Three decisions are encoded and gated, not just implemented: Global
Perspectives Stage 5 (withdrawn) and English units below 1 are never indexed —
asserted against `withdrawn-courses.json` independently of the lib that
enforces them; every topic's section id must be one its subject's shell
actually renders, read from the shell source (a wrong id is not a 404, it is a
silent landing on the overview — the portal-allowlist failure shape); and
per-subject topic totals may not fall below the recorded floor, because a
parser that quietly stops extracting one category passes every other check.
Mutation-tested six ways (stale byte, deleted file, planted withdrawn file,
bogus section id, unit 0 indexed, dropped category) — all caught.

Product decisions recorded 2026-08-24 for the surfaces this index feeds: the
±2-grade help window is a default view with "show all grades" available, never
a hard cap; tutoring progress is recorded separately from course progress,
always, and must never reach the school's gradebook; and "AI could not unstick
me → book a human tutor" is part of the design, so help sessions keep a record
a handoff can carry.

### The topbar picker is DERIVED. Do not give it a list again (2026-08-27)

`paintTutoringSections` (`shell/course-app.js`) offers the sections a tutoring
learner can search. It used to hold `TUTORING_SECTION_IDS`, one array of ids per
subject, and that table is deleted. It was a hand-kept copy of two vocabularies
that both already knew the answer, and it failed in **both** directions within a
day:

- `glossary` was added to English and was invisible to the picker until somebody
  edited the table to admit it existed — a section that renders and is
  searchable and cannot be picked.
- `ebooks` sat IN the table with no topics behind it, so picking Books answered
  "No Books lessons are indexed for grades 2-6". An entry the table was
  confident about and the searcher had never heard of.

Two sources now, and neither can drift from what it describes:

```
the NAV    which sections THIS GRADE draws, and the order it draws them
the INDEX  which sections the search can actually answer for  (get-help.js :: sectionsWithTopics)
```

Offered = the nav filtered by the index. A new section with topics appears the
moment it renders; a section the index cannot answer for is never offered. The
order is the nav's, which is also how `glossary` ends up last without anyone
deciding it should.

Four things to know before touching it:

- **`sectionsWithTopics()` reads `windowStages()`, not the current stage**, because
  that is precisely the set `searchSection` searches. English draws the Books
  shelf at every grade for a tutoring learner while the catalogue puts the books
  at Grades 1-4, so at Grade 5+ the entry is answerable only out of the
  neighbouring grades. Narrowing it to the current stage silently drops the
  entry whose search works.
- **Null means "not known yet", not "none".** Nothing is painted until the index
  answers. If it cannot be loaded, section search cannot work either, so every
  entry the picker could offer would find nothing — painting none is the honest
  degradation, not a fallback worth adding a table back for.
- **The nav alone is NOT enough, and this is the trap if you read the section
  title and stop.** Mathematics draws **16** sections and 5 carry topics. A
  nav-derived picker with an exclusion list for the obvious non-teaching routes
  still offers 8 dead entries — recreating the Books dead end eight times over,
  in the subject with the most units. The index half is what makes "offered"
  mean "picking this finds something".
- Per-subject differences now fall out of the data. Measured at the change:
  mathematics and science `lesson, words, explore, method, examples`; computing
  the same plus `code`; global-perspectives `lesson, bigideas, models, toolkit,
  words`; intensive-english eight; english eleven. Those are the deleted table's
  contents exactly — the derivation was verified against it in the browser in
  all six subjects before it was deleted, which is the only reason it could be.

`SECTIONS_REPLACE_UNITS` is a separate decision and stays: english and
intensive-english REPLACE the units, the other four ADD sections above them.

**The searcher keeps what the picker said.** `runSearch` used to clear
`activeSection` on the way in, which made the picker and the box two searches
rather than one: choosing Glossary and then typing "milk" dropped the Glossary
half and answered with Vocabulary and Quiz topics out of five other units, the
glossary's own entry ranked third among them. The learner had said two things
and only the second was heard. It narrows now, a chip says the filter is on and
clears it in one click, and under a filter the TOPICS decide rather than the
unit's own score. Reported twice by the owner before it was found, because the
first report was read as being about the glossary page and it was about the
search.

### The stage capstones are indexed, and hidden from tutoring (2026-08-27)

Mathematics, Science and Computing each author a `grade-capstone.json` per stage
— driving question, staged prompts, evidence checklist, rubric, quiz — and none
of it was indexed, so a learner searching "science fair project" got seed
investigations and no route to the Stage 5 Science Fair that IS the project.
48 topics now: 24 `capstone` and 24 `capstonequiz`, 16 per subject across 8
stages, hung off each grade's FIRST indexed unit exactly as the English glossary
is (a capstone belongs to the stage, not to a unit).

Two per stage, not one, because the shells draw two sections and a topic's
section is where picking it LANDS — a quiz question must not drop the learner on
the project page.

**English gets none, deliberately, and it is the case that looks like an
omission.** It has a Capstone row and it is a DOOR rather than a project:
`renderCapstone` shows Unit 10's own launch page, and Unit 10 is already indexed
as a unit, so a topic there would be a second card leading to content the index
already describes. Global Perspectives and Intensive English author no capstone
at all. If a `grade-capstone.json` is ever written for English, `capstoneTopics`
picks it up with no change.

**A floor set at what you had before the last thing you added is a formality.**
The three `TOPIC_FLOORS` were exactly the pre-capstone totals, so extraction
losing every capstone topic would have landed the count precisely on the floor
and passed. Raised to 4183 / 1254 / 1895 with the change. Mutation-tested both
ways, and the two halves catch different things: breaking `capstoneTopics` alone
is caught by the BYTE-COMPARE, and only breaking it *and rebuilding* — where the
files legitimately match a broken derivation — reaches the floor. That run
reported 4167, 1238 and 1879, which are the old floor values, and is the whole
argument for having moved them.

**The search only offers what the learner's own nav will show.** Indexing the
capstones gave a section in `TUTORING_HIDDEN` topics for the first time, and
`get-help` had never had to know about hidden sections — so a tutoring learner
searching "science fair project" got the capstone first and its quiz second, for
a section their nav deliberately omits. `reachable()` now filters every topic
through the shell's `TUTORING_HIDDEN`, passed in through `attachShell` rather
than restated, for the reason the picker derives instead of listing. Applied in
both paths that turn topics into results — `searchSection` too, though the
picker cannot offer a hidden section, because it is reachable from a URL.

Be exact about what that is: **not a broken link.** `#capstone` renders the full
capstone for a tutoring learner — checked before deciding. The page works and is
withheld, because the category arrives with one problem and no course position
and a whole-stage project is not an answer to that. A dead link is a bug to fix
without asking; this needed the owner (2026-08-27), and the difference is why it
was left open rather than inferred.

### The human-tutor handoff, proven on the live marketplace (2026-08-24)

The whole chain was exercised on production with a QA tutor: help-session
wrap-up → "Find a human tutor" (summary copied) → `teacher_marketplace.php`
→ guest "Start a new request" → `marketplace_enrollment.php` → the summary
pasted into Learning goals landed verbatim in `local_prequran_teacher_request`
row `message` — the text a tutor and admin read. So the handoff's delivery
contract is real, and it is the WHOLE contract: the enrollment form serialises
every field into that one message column, guests included (`require_login` is
deliberately absent; a guest gets the request row and admin identity notes,
only the comm thread needs a login).

What gates a tutor into the marketplace, all at once: profile `status=active`
+ `marketplace_visible=1` + `marketplace_status='published'` +
`vetting_status='approved'`, user not suspended/deleted, `consumerid` matching
the consumer context (default resolves to `ehel-k12`, id 8). On test day the
live marketplace had ZERO published tutors in every consumer context — the
handoff lands on a working page with nobody in it until the business publishes
vetted profiles. That is the open item, and it is not an engineering one.

Server-side work on the K-12 Moodle from this machine goes through one loop —
there is no SSH: stage a script on the Bunny zone under `Ehel Primary/qa/`,
the operator curls it in cPanel Terminal INTO THE DOCROOT
(`/home/ehelacad/quraantest.academy` — the script does
`require(__DIR__ . '/config.php')`, so a home-directory run fails loudly),
runs it, and both sides delete their copies after. A re-staged fix must take a
NEW filename: the edge cached the broken first upload, which is this repo's
own same-path-new-bytes lesson arriving on a new tier.

Three traps from that loop, each of which cost a failed run:

- **Identify the install by its DATABASE, never by `$CFG->wwwroot`.** The box
  hosts nine Moodles, and the K-12 config serves many hostnames, so wwwroot is
  host-dependent — from the CLI it reads `https://eduplatform.ai`, and a
  wwwroot guard fires falsely on the RIGHT install. The identity that holds is
  the `ehel-k12` row in `local_prequran_consumer` (db `ehelacad_quraantest`).
  Finding the docroot by grepping config.php for `app.k-12.ehelacademy.org`
  still works — the hostname is in the config's host list, just not in
  CLI-resolved wwwroot.
- **`cli_error()` does not exist after a bare `require(config.php)`** — it
  lives in clilib.php. A CLI helper script should carry its own fail function
  rather than pull in more of Moodle.
- **A destructive row delete on production wants two fences, not an id.** The
  QA request was removed only after the row proved itself twice — addressed to
  the QA tutor's userid AND carrying the QA marker text in its message — with
  refusal the default. An id alone is one typo away from a real family's
  request.

The QA fixtures are kept, withdrawn: user `qa.test.tutor` (#1330, suspended,
random unknown password) and profile row 120 (every visibility gate failed).
A future marketplace test reactivates them by flipping the gates back rather
than creating new rows.

## Curriculum validation

Before merging a change to a Cambridge framework file (`src/curriculum/cambridge-english-*.json`) or to unit objective mappings, both of these must exit 0:

```bash
npm run validate:frameworks
npm run validate:curriculum-units -- --strict-cambridge
```

`validate:frameworks` checks a framework file against itself: text misextracted from the source PDF, numbering gaps within a sub-strand, `counts` disagreeing with the arrays. `validate:curriculum-units --strict-cambridge` checks that every objective a unit claims exists in the stage that unit declares.

A framework failure usually means the extracted JSON is wrong, not the unit. The frameworks are parsed out of Cambridge's PDFs and the source documents are not in the repo, so fix the framework before re-pointing any mapping at it.

## The Ehel Academy shell keeps TWO progress stores per learner, and only one drives the UI

Shared across all six subjects (`shell/course-app.js` + `shared/progress-client.js`), found while seeding `localStorage` in the browser to test a completion-card wording change and finding more keys than expected.

- **`config.keys(grade, unit).progress`** — a per-subject, per-UNIT key (English: `ehel-english-g{g}-u{u}-progress-v1`). Holds the `progress` object directly: `completed` (the array everything gates on), `knownWords`, `self`, `writing`, `games`. Written by `saveProgress()` on every completion action. **This is the only store anything reads.** Nav ticks, `sectionUnlocked()`, the unit gate, the progress bar %, and the "Next up" / "Go back to" completion card all read `progress.completed` from this key alone. To reproduce a progress state for testing, seed THIS key and reload the page (a hash-only `location.href` change is a same-document navigation and will not re-read it — use `location.reload()` or a fresh tab).
- **`ehel-progress:{course}:{student}`** (`shared/progress-client.js`) — one key per COURSE (English: `ehel-eng-g{gg}`, `student` from `?studentid=` or `"local"`), holding the P1.4 Progress Event Contract's reduced document: `{course, student, stateVersion, units: {u01: {sectionsDone, resume, checkpoints, xp, knownWords}, ...}}`. Populated by reducing `emitProgress()` events (`section.completed`, `unit.completed`, `progress.summary`, ...) through `applyEvent()`. `saveProgress()` calls `emitProgressSummary()`, so both stores are written together on every save — but they are shaped differently and keyed at different granularity, so they are never byte-comparable.

**The second store is write-only in local-dev and in a plain student launch.** `hydrateRemoteResume()` (`course-app.js`) reads it back to seed `progress.completed` — but it opens with `if (progressWS.backend !== "remote") return`, and the backend is `"remote"` only when the launch URL carries `pwsEndpoint`/`pwsToken` (the school's actual production launch path through Moodle). Without a launch token — which is every local-dev session and every console experiment — the backend is `"local"`, so `ehel-progress:{course}:{student}` accumulates a faithful mirror of every event ever emitted and nothing in the app ever reads it back. Writing to it does nothing observable; a UI change has to go through the per-unit key.

A third key, `ehel-progress-outbox:{course}:{student}`, exists only for the remote backend (durable events queue there until a POST to `/progress/ingest` succeeds; the local backend applies events straight into its document instead). Irrelevant to local testing for the same reason.

## Ehel Academy subject pipelines

Science, Computing and Global Perspectives are built from Word source packs in `~/Downloads`, not hand-edited. Each is `extract → build → check`:

```bash
npm run extract:computing-content && npm run build:computing && npm run check:computing
```

**Never hand-edit `src/prototypes/ehel-academy/{science,computing,global-perspectives}/grade-*/data/`** — it is generated, and the next build overwrites it. Fix the builder instead.

All three subjects export from Google Drive as `Year <n>-<UTC stamp>-<part>.zip`, so a Downloads folder holds three subjects under indistinguishable filenames. **All three extractors now classify each archive by what its documents say and accept only their own** — science was the last to pick by name alone, and did so until 2026-08-12.

That was not a theoretical risk. Picking the newest stamp per year does not merely risk the wrong pack, it prefers it: Downloads held Year 4 and Year 5 Global Perspectives exports stamped *later* than their science counterparts, so a plain `extract:science-content` would have rebuilt Grades 4 and 5 of Science out of Global Perspectives content. Each extractor now walks a year's candidates newest-first and takes the first that is actually its own subject, reporting what it skipped:

```
  Year 4: skipped Year 4-20260809T160348Z-1-001.zip - it is GlobalPerspectives, not Science
```

A year whose archives are *all* another subject is reported rather than passed over quietly, because the silent version is a grade vanishing from the model and, one build later, from the course.

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

#### Computing Stages 1-4 show the deck alone

Thirteen sections have a deck, gated by `BOTH_DESIGNS_MAX_STAGE` in
`shell/subjects/computing.js`, and since 2026-08-26 each of them renders the
slides and nothing else (`deckOnlyPage`). They rendered the original page first
and the same content as an inline deck under it until then — see the hard rule
above for why that ended and what it cost. The pack division is the reason 4 is
the line, the same one Cambridge draws — Guides below it, student lesson books
above.

Two things follow, and both are load-bearing:

- **Each design queries inside its own region.** The two no longer share a page,
  so the collision this was written for cannot happen — but the regions are what
  make `cRoot()`/`c$`/`c$$` and `d$`/`d$$` mean "my half" at every call site, and
  the section is written to them throughout. A new control still uses its own
  half's helpers. `classicRegion` is now null on a deck page and both are cleared
  in `onBeforeRender`.
- **A deck slide draws its diagram flat** (`deckDiagram`, `interactive: false`),
  because every slide is in the DOM at once — Build It at Stage 4 has eight
  activities, against a browser cap of about sixteen on desktop and commonly
  eight on mobile. This used to be free (the original above built the interactive
  model), and since 2026-08-26 it is a straight loss at Stages 1-4: nothing there
  draws an interactive model, and the per-word WebGL explainer
  (`computing-word-scenes.js`) is unreachable with it.

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

### Mathematics: rebuilding is destructive, and answers are checked by arithmetic

**`build:math` refuses to run without `--force`.** About twenty
`repair-ehel-math-*` tools edit the built units IN PLACE — answer ordinals,
truncated explainers, duplicate titles, exploration pairing — and none of that
work is in the content model, so a rebuild silently discards all of it. Their
only other copy is git history.

The guard is a flag, not a timestamp. Comparing the model's mtime against the
units' was tried and is worthless: copying the model to a new path refreshes its
mtime, the model then looks newer, and the check waves through the rebuild it
exists to stop. That happened and overwrote 125 units.

**The model now lives at `outputs/math-content/math-content-model.json`.** It
used to be read from `outputs/<uuid>/`, a one-off session directory — gitignored,
so reproducible on exactly one machine and only until somebody cleared it. The
builder still reads the old path as a fallback. Note `build:math` defaults to
grades **1 3 4 5 6 7 8**: grade 2 is deliberately excluded as the untouched
reference implementation.

**Answer keys cannot be audited against a booklet here.** The Practice booklets
hold worksheet tasks with prose keys ("Section 1: 1) a) 3,000 b) 3 tenths"), and
the 1,596 MCQs the app asks appear in them nowhere — they are authored, not
extracted. In these booklets `a) b) c)` are the PARTS of one task, not answer
options, so a parser carried over from Science or Computing misreads every
question it touches.

`check-math-answer-keys.mjs` computes the answer instead, which is stronger than
provenance and cannot be fooled by a booklet that was wrong. It reaches 109 of
1,596; the rest are conceptual, diagrammatic or word problems and are reported as
unchecked rather than counted as passes. Coverage may not fall.

Four rules keep it honest, each added after it called a correct key wrong:

- **The expression must account for every number in the question.** Otherwise
  "Work out 6 + 7 + 4" verifies as 6+7=13.
- **A bare `/` is never an operator** — "What is 1/5 of 25?" is not 0.2.
- **Estimation questions are excluded.** "Estimate 3,872 + 5,145 to the nearest
  thousand" keys 9,000 on purpose; the exact sum is 9,017.
- **Algebra is excluded.** The y-intercept of `y = 7 - 2x` is 7, not 5.

Counting glyphs has its own trap: a pictogram states its scale in words ("Key:
one 📚 = 2 books, row shows 4 symbols"), so the glyphs printed on the page are the
key, not the quantity. And count code points, not `.length` — an emoji is a
surrogate pair, so seven buttons measure as fourteen.

### The Cambridge Mathematics framework, and the 0096 hole

`cambridge-mathematics-0862.json` is extracted from Cambridge's published PDF by
`extract-cambridge-mathematics-framework.py` and covers Stages 7-9. Stages 7-8
units declare 0862, so those match.

**Stages 1-6 declare 0096 and that framework is not published here.** The only
Primary maths framework available is 0845, a different and superseded edition;
extracting it and labelling it 0096 would assert an alignment nobody checked. So
Stages 1-6 have no framework, and `check:math-cambridge` says so rather than
passing quietly.

**All 133 units map zero objectives.** The gate records that as a ceiling that
may fall but not rise, checks stage↔code agreement (1-6 Primary, 7-8 Lower
Secondary), and validates any code that does appear — so the first mapping
authored is checked the moment it lands.

Two extraction traps worth keeping:

- **"Index" is not a section marker.** Maths objectives talk about "index laws",
  and matching it truncated 8Ni.05 and 9Ni.02 mid-sentence.
- **The Glossary heading arrives with its page number glued on** ("4 Glossary
  This glossary…"), so an anchored word match never sees it and the last
  objective of Stage 9 absorbed the entire glossary — 4,161 characters.

`validate-curriculum-framework.mjs` gained `maxTextChars` for this file: maths
prints nested `o` bullets as part of the objective above them, so a few
legitimately run past the 340 that flags a swallowed section elsewhere. Its
filename glob and `CODE_RE` now cover mathematics too — without that, the new
framework file was silently not validated at all.

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

**A re-recorded clip uploads normally, and this note used to say the opposite.**
The manifest stores a CONTENT HASH, and the skip decision is a comparison, not a
lookup:

```js
// tools/upload-media-to-bunny.js
for (const item of all) item.hash = sha1(fs.readFileSync(item.local));
const todo = all.filter((x) => manifest[x.remote] !== x.hash);
```

New bytes mean a new sha1, so a re-recorded clip lands in `todo` even though its
path is in the manifest. Verified rather than reasoned — `upload-media-to-bunny.js
english --dry` after a Grade 8 repair queued both re-recorded clips, including the
one that kept its exact filename. **Do not drop manifest entries before a repair;
there is nothing to drop.**

A narrow legacy case exists in principle — entries written before the manifest
stored hashes carry no hash to compare, so their contents cannot be verified from
here; they upload once, gain a hash, and behave normally afterwards.

**But the tool's own count of them is wrong, and the run above did NOT report a
real one.** `upload-media-to-bunny.js:223` is

```js
const legacy = todo.filter((x) => x.remote in manifest).length;
```

which tests key PRESENCE. A re-recorded clip is in `todo` precisely because its
stored hash no longer matches, and its key is of course still present — so it is
counted and then described as "recorded before the manifest stored hashes", which
is the opposite of its state. The single entry that run reported was the
re-recorded connoisseur clip, whose stored value was
`de8f342ca360ff4c34c358a021da3163979ef586`: forty hex characters, a perfectly
good sha1. Telling the two apart needs a test on the stored VALUE
(`/^[0-9a-f]{40}$/`), not on the key.

The uploads are correct either way; only the sentence is wrong. It is recorded
here because this passage is about not being fooled by a true fact about the
wrong property, and the count fooled the person writing the passage — the "one"
was cited as evidence of the exposed class while being an instance of the class
that had just been proved safe.

The correction is worth the space because of how the wrong version survived. It
was true when written, the behaviour changed under it, and on 2026-08-24 it cost
two sessions a wrong conclusion within minutes — one warned the other about the
trap, the other "confirmed" it, and **both had checked whether the path was
PRESENT in the manifest** when the tool compares hashes. Presence is a true fact
about the wrong property. Agreement between two people checking the same wrong
property is not a second opinion, and it reads exactly like verification.

The same family, one step quieter: a number that is RIGHT, printed at the right
moment, and reported without being interrogated. A release on 2026-08-26 printed
`plan 44 | uploaded 42` — correct, and the difference was exactly the thing being
argued about in the same conversation, unread by the person relaying it. That is
not a gate failure and no check can catch it; it is the reason a figure you are
about to repeat is worth subtracting once first.

**The half of the old note that WAS right is about browsers, not the manifest,
and it is unchanged**: a re-recorded clip that keeps its filename keeps its URL,
so every learner who has already played it holds the old audio for up to a year
whatever the uploader does. `AUDIO_RELEASE` in `shell/subjects/english.js` is the
only lever — see "Re-rendering without a text change strands every learner who
already listened" below. A repair that renames the file is immune to that for
free, which is a real reason to prefer one, and is unrelated to the manifest.

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

#### Re-rendering without a text change strands every learner who already listened

**This is not an English problem. The trigger is "same text, new recording",
whatever the subject.**

Bunny serves media as `Cache-Control: public, max-age=31536000` with no ETag, so
a browser that has played a clip holds it for **a year** and never revalidates.
Whether a repair reaches a learner therefore depends entirely on whether the URL
changes:

- **Text edited** — a hash-named subject (Science, Mathematics, Computing,
  Global Perspectives, Intensive English) mints a new filename, so the URL
  changes and the learner refetches. Safe by construction. **English is not one
  of those subjects and this bullet does not cover it** — see below.
- **Text unchanged, clip re-rendered** — same hash, same filename, same URL. The
  CDN is correct, the manifest hash matches, every check passes, and the learner
  keeps the old audio for a year. Nothing in the repo can see it.

The realistic trigger is a **voice change** (a new `VOICE_ID`, or regenerating a
grade), and `speechSpelling` is the other: it exists to fix a mispronunciation
*without* changing the displayed text, so a respelling applied to a clip already
in production is exactly this case.

**In English the commonest trigger is an ordinary content repair, and it fires
even though the text DID change.** English names its clips for their content slot
(`eng-g05-t01-u03-read01.mp3`, `u7-g1-32-32-connoisseur-meaning.mp3`), not for a
hash of what they say. So correcting a wrong definition re-records onto the same
filename: the words changed, the URL did not, and every learner who already
played it keeps hearing the old wording for a year. The five hash-named subjects
get a new filename from the same edit and are immune; English is the one subject
where "the text changed" does not imply "the URL moved", and it is the one
subject the stamp exists for. Worked example on 2026-08-24: Grade 8 Unit 7's
`connoisseur` had been teaching an invented meaning, `55c0d2ed7` restored it from
source and `08ecfbb66` re-recorded, and `AUDIO_RELEASE` went `20260819a` →
`20260824a` in English v264 — the repair itself reached storage and the edge
correctly and would still have reached nobody who had listened.

**Exposure is per CLIP, not per repair, so ask it of each file.** That same
repair touched two meaning clips and only one of them needed the stamp: the
glossary clip was RENAMED (`32-connoisseur-meaning.mp3` →
`connoisseur-meaning.mp3`), which moves the URL and busts browser caches for
free, while the vocabulary clip kept its filename and did not. One repair, two
clips, two different answers. A rename is the cheaper fix wherever the filename
is not load-bearing; the stamp is what covers the ones that must keep their
name.

English hit the general version of this and carries the fix: `AUDIO_RELEASE` in
`shell/subjects/english.js` stamps audio URLs with `?a=<date>`, bumped whenever
English audio is re-uploaded. It works because the pull zone **ignores query
strings when caching** — verified, not assumed: `?a=20260814` and
`?a=zzz-nonsense` against a clip that had seen neither both returned
`CDN-Cache: HIT`, byte-identical, off the bare path. So it busts browsers and is
invisible to the edge, unlike a version *segment*, which would risk a cached 404
on a path that cannot be purged.

The other five subjects have no such stamp. If one ever re-renders audio without
changing the text, it needs one — copying English's is a few lines — or a purge,
which needs an account-level key that is not in `.env`.

#### The English CDN orphan pruner, and why it needed writing

**`tools/prune-english-audio-on-bunny.mjs`** now covers this. Report by default,
`--delete` to remove, `--json` for the numbers. First run on 2026-08-24: 93,086
files on the zone, 93,591 reachable paths, **57 named by no descriptor (12.4 MB),
all 57 since deleted — the zone reports 0 orphans.**

The 57 were three groups, and their coherence is what made them safe to remove:
36 US spellings stranded by the UK-vocabulary decision of 2026-08-17 (verified,
not inferred — `apartment`/`elevator`/`janitor`/`mold`/`railroad`/`emphasize`
all unclaimed while `flat`/`lift`/`caretaker`/`mould`/`railway`/`emphasise` are
all claimed), 12 `conclusion` clips from the duplicate-word repair, and 9 whose
text moved.

**Reachability is the claim map, and BOTH halves of it.** `clipGradeMap()` is
what the app will play; `suppressed()` is descriptors carrying
`available: false`, and those are NOT orphans — they are the state a repair
leaves between deleting a wrong recording and paying for its replacement.
Mutation-testing that rule is what proved it load-bearing: unprotecting
`suppressed` moves the count 57 → 63, so the tool would have deleted six clips
somebody was about to re-record. Two other mutations must also fail — an
unrecognised argument (exit 2, because the default action here deletes from live
storage) and a claim map that resolves nothing (exit 1 below a 5,000 floor,
rather than reporting the whole course orphaned).

**Run the deployed check separately; the tool cannot do it for you.** It reasons
from the repo, and the repo is not evidence about the CDN — a content file may
not have been re-uploaded. Before the deletion above, all 223 deployed Grade 1-8
content files were enumerated from storage and fetched through the edge: zero
references to any of the 57. Without that, a clip the deployed content still
named would have become a silent fallback to the paid runtime TTS endpoint, on a
404 Bunny caches and the key in `.env` cannot purge.

Why it had to exist at all: both older pruners take the same five subjects, and
English is not one of them:

```js
// tools/prune-ehel-course-audio.mjs  AND  tools/prune-ehel-course-audio-on-bunny.mjs
const SUBJECTS = ["science", "mathematics", "computing", "global-perspectives", "intensive-english"];
```

They also only ever look inside `media/<subject>/g<NN>/audio/tts/`, the
hash-named tree. English clips are named for their content slot and live under
`media/english/g<NN>/audio/{glossary,vocabulary,…}/`, so they are outside the
search path as well as outside the subject list — two independent reasons the
tooling cannot see them.

The consequence is only on the CDN. A stranded English clip on DISK shows up in
`git status`, because English clips are committed; a stranded clip on STORAGE was
reported by nothing, costs a paid upload once and storage for ever, and — the
part that matters — **is the last surviving copy of audio that was deleted for
being wrong.** `32-connoisseur-meaning.mp3` sat on the zone from 2026-08-20
saying an invented definition, through the repair that deleted it locally and
the re-record that replaced it, until it was removed by hand on 2026-08-24.
Doing that by hand is what prompted the tool.

If you ever do it by hand again, getting the ORDER wrong is the thing to avoid. Dereference first,
delete second, because Bunny caches a 404 on a path that cannot be purged with
the key in `.env` — so a file deleted while something still asks for it becomes
a permanent hole rather than a recoverable mistake. The sequence that worked:

1. Confirm zero **exact** references in the repo's data for that grade.
2. Confirm zero exact references in each **deployed** file of that grade —
   `sentence-glossary`, the unit, `master-dictionary`, `games/<unit>`,
   `course-manifest`. The repo is not evidence about the CDN; a file may not
   have been re-uploaded.
3. `DELETE` the object through the storage API, then re-list the directory and
   check the count fell by exactly one.
4. Drop the path from `.bunny-upload-manifest.json` — same reason the math
   pruner does it, so a later regeneration of that exact text uploads instead of
   being skipped as already sent. Splice the entry out rather than
   re-serialising: that file is one 13.8 MB line and several sessions write it.

**Match exact quoted paths, never substrings.** This vocabulary is built to
defeat a substring grep, and it did so three times in one session:
`32-connoisseur-meaning.mp3` is a substring of the live
`u7-g1-32-32-connoisseur-meaning.mp3`, and it differs from the live word clip
`32-connoisseur.mp3` by one suffix. A `grep -c` for the orphan's name reported
references that were not references, in the repo and again in the deployed unit.
Extract `"([^"]*)"` and compare whole paths.

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

#### Writing the gate is what finds the bug — the worked example

The cursive worksheet prints a unit's grammar exercises with lines to write on,
and 149 of its 1,047 practice pieces carry the ANSWER KEY. `english.js` cuts each
piece at the key marker so the answers do not print on the learner's own page.

The first version of that filter was anchored with `^`. It matched the **45**
pieces that START with a key and missed the **104** that append one to the last
question — `5. ______ is your teacher? Check yourself: 1. Who 2. What…`. Those
104 printed the answers, on children's worksheets, in production.

**Nothing found it, because nothing was looking.** The sheet rendered. The page
count was exact to the page. Every other check passed. The only thing inspecting
that filter was the filter itself. It surfaced within an hour of somebody sitting
down to write a gate for it — not from suspecting the filter, but from being made
to state its behaviour precisely enough to test. Every other gate in this file was
written after something broke; this one broke something by being written.

**A floor is only half a gate, and it is the half that cannot find anything new.**
The obvious check is to record the count and fail if it drops. That catches a
pattern which STOPS matching. It cannot catch a new wording in new content,
because the existing matches keep matching and the number never falls. So
`check-english-content.mjs` carries two halves:

- the floor, which tests the filter that was already written, and
- an **independent detector keyed on STRUCTURE, not wording** — a dense run of
  three or more numbered short answers is an answer key whatever it calls itself.

The structural half earned its place immediately, finding `Answer key, Part A: 1.
visited, 2. gave…` where a comma and a part label sit between the words and the
answers so the marker never matched. Keying that detector on wording was tried
and is useless: "then check yourself against the answers" is an ordinary
instruction, and four of five flags were those.

The general rule, and it is the same one the deploy section reaches from the
other direction: **a check that must be told what to look for can only find what
has already gone wrong once.** Structure is what you can test without knowing the
wording; wording is what you can only test in hindsight.

One calibration is recorded in the code and matters if the sheet ever grows: the
answer-run detector runs at Grades 1-4 only, the grades the worksheet prints.
Above that the same shape IS the exercise list, so extending the sheet upward
needs the detector recalibrated first.

**Mutation-tested five ways**, each of which must fail the gate: revert the filter
to the `^`-anchored version, a pattern that matches nothing, drop one wording from
it, drop the comma-and-part-label tolerance, and rename the declaration so the gate
cannot read it. All five caught, and the gate passes again on restore.

**But note what that suite does NOT prove.** Every one of those mutations damages
the PATTERN, so every one lowers the match count, so the floor alone catches all
five — the structural half is redundant against its own mutation suite. The case it
exists for is a new wording in NEW content, where the existing matches keep matching
and the count never moves, and no mutation of the pattern can simulate that.

So the structural half's necessity is not established by the mutations; it is
established by what it actually found — three leaks the pattern had never
anticipated, including the comma form that was printing at Grade 4. Worth stating
plainly, because "mutation-tested, all caught" reads as proof that every part of a
gate is pulling its weight, and here it is not.

### The one print path, and the page count that runs short

`printCursiveWorksheet` in `shell/subjects/english.js` is the **only** thing in
this repo that prints — the sole `@page` rules, the sole `window.print()`, the
sole `break-inside: avoid`. So anything learned about pagination here has no
second example to compare against, and is worth writing down the first time.

**`break-inside: avoid` cannot save an element taller than the page.** The engine
breaks it regardless, and it spans as many pages as it needs. A page counter that
treats every item as unsplittable therefore runs SHORT — it counted one page for
something occupying two. Grade 4's longest grammar item measures 1,697px against
a 1,017px page, and the small sheet came out a page under. The fix is in
`worksheetPageCount` (`if (itemHeight > pageHeight)`, spilling by
`Math.ceil(itemHeight / pageHeight) - 1`).

Two things about how it was found, which is the transferable half:

- It surfaced as an **11-vs-12 mismatch between the estimate and the produced
  sheet**, not by reading the CSS. The stylesheet says `break-inside: avoid` and
  looks correct; the rule is simply not honourable at that size. Reading the
  declaration tells you the intent, never whether the engine can meet it.
- The estimate and the output are two independent computations of the same
  number, which is the only reason a discrepancy could show up at all. Keep them
  independent — a page count derived from the rendered output would have agreed
  with itself and been wrong in silence.

If a second print path is ever added, this is the first thing to check, and
`worksheetPageCount` is the worked example.

### The illustrated picture books (English "Books")

Every English unit ends with a shelf of animated picture books, across Grades 1
to 4 only (see the Grade 5 rule above). A unit's shelf holds more than one book,
and how many differs by grade — Grade 4 carries **five per unit** since
2026-08-21 and Grade 1 since 2026-08-27 (Grade 1's withdrawn Unit 0 keeps its
six). Do not hard-code the number anywhere: `unitEbooks()` resolves a
shelf from `ebookCatalog` by grade and unit, and `check-english-ebooks.mjs`
prints the per-grade totals, so ask the catalogue rather than a count written
down here. They are **generated SVG**, not artwork files:

```bash
npm run build:ebooks          # both grades' pages + the companion docs
npm run check:english-ebooks  # catalogue vs disk, and composition
```

Three files, one storyworld:

- `tools/lib/ehel-ebook-kit.js` — the shared palette, the animation stylesheet,
  the whole cast (Musa, Kiki, Duku, Lulu, Miss Twiga …) and the scenery.
- `tools/lib/ehel-ebook-kit-grade2.js` — Grade 2's ADDITIONS: Zuri the meerkat,
  the town, the classroom props, the bugs, the homes, the city, the aquarium.
- `tools/lib/ehel-ebook-kit-grade3.js` — Grade 3's: the HUMAN cast, from one
  parametric `person()`, plus the classroom, coast, forest and mountain.
- `tools/lib/ehel-ebook-kit-grade4.js` — Grade 4's: Maya and Sami, the post
  counter, the storm, the library cart, the cave, the stage, the attic and the
  capital.
- `tools/lib/ehel-ebook-kit-grade4-shelf.js` — the props and the extra cast for
  Grade 4's books two to five: the radio weather desk, the canyon, the bakery,
  the circular news wheel, the bridge under construction, the microwave and its
  worktop, the observatory, the ambulance, the station, the mall — plus Elena,
  Talia, the librarian, the mayor, Karim, the uncle, the governor, the lawyer,
  the caretaker and the labourer, and the four Unit 5 animals.
- `tools/lib/ehel-ebook-kit-grade1-shelf.js` — the props Grade 1's books three
  to five name and no earlier grade did: the rabbit, duck, frog and puppy of
  Unit 3, the whale and crocodile of Unit 8, the crown, clown hat, cape, mask
  and paper chain Unit 4 MAKES, the drum, keyboard and violin of Unit 6's Music
  Man, the aeroplane of Unit 7, and the onions, potatoes and beans of Unit 5.
- `tools/create-{musa,grade2,grade3,grade4}-ebook-illustrations.js` — the pages.
- `tools/create-grade4-shelf-ebook-illustrations.js` — the other forty Grade 4
  pages, one book per remaining reading in each unit.
- `tools/create-grade1-shelf-ebook-illustrations.js` — the other thirty Grade 1
  pages, three per unit for units 1 to 10.

**Grade 1's three added books are three KINDS of book, not three more stories,
and that is forced by the content.** A Grade 1 unit carries only three readings
— Story, Shared reading, Rhyme — and the Story was already book two, so Grade
3's trick of one book per unused text cannot reach five. Book three is the
unit's RHYME acted out, book four fills in the unit's SHARED-READING frame
("This is a ___. It is ___.") with that unit's own vocabulary groups, and book
five is a second animal fable. Book four is where the vocabulary revision
actually lives; do not read it as a picture list.

**Grade 4 is drawn by two generators, not one.** The first book on every unit
comes from `create-grade4-ebook-illustrations.js` and is built on that unit's
closing narrative; books two to five come from
`create-grade4-shelf-ebook-illustrations.js`, one per reading the first book
left undrawn. Four of the forty had no reading left to take (Units 1, 4, 5 and 6
carry four readings, not five) and are the next scene of one that is there —
Omar's second language, Sami's promised story, the posters for Simba, the
caretaker the parade story ends on. `write-english-ebook-docs.mjs` reads the
second generator's own book map to decide which tool an ATTRIBUTION.txt names,
so the list cannot drift from the generator.

**Look at the Grade 3 cast before adding a person.** `CAST` in
`ehel-ebook-kit-grade3.js` is longer than the Grade 4 additions suggest — Leo,
Theo, Daniel, Nadia, Doctor Sarah and Officer Rami are already there. Redefining
one in a later kit makes the same child two different children between shelves;
that was caught in review, not by a gate. Every NEW name needs three edits in
one commit: the preset, `TAP_VOICE_GROUPS` in `shell/subjects/english.js` (or
`check-english-ebooks.mjs` fails on the unresolvable `data-tap`), and the
`EXTENTS` list in `check-ebook-composition.mjs` — that last one silently prints
✓ for a character it has never heard of.

**A scene that draws its own sky furniture cannot also be given one.**
`nightScene()` includes a moon, so the Unit 8 star book — whose whole subject is
looking at the moon — put two moons on four pages. `starrySky()` in the shelf
kit is the same night without one. Same failure as the two suns on the Grade 2
shelf; check what the scene already contains before adding to it.

**Grades 3 and 4 share one cast, and it was not invented.** Amal, her
friend Nora, Teacher Yasmin and Omar the shopkeeper appear 604 times across the
ten units of the Grade 3 readings and carry on through Grade 4, which adds Maya
the young reporter. A shelf starring anybody else would contradict the lesson
beside it. **Read the unit before inventing anything** — nearly every book
borrows its unit's own device: the spelling contest, the calendar on the wall,
the two roads to school, the million shells, the Box of Ideas, the post counter,
the science-fair storm, the travelling library cart, the spiral cave, the
community parade, the school play, the attic telescope, the trip to the capital.

**How the people look was decided by the course's own artwork, not here.**
`english/assets/unit-8-home.png` shows East African children with natural hair
and bright everyday clothes and no headscarf; `english/assets/teacher-nuur.png`
shows the adult teacher in a hijab, cardigan and long skirt. The readings
describe almost nothing (only "Grandma Hana sat in the corner with her reading
glasses"), so the pictures are the source of truth. Check them before changing a
character.

**People carry `data-figure`, not `data-tap`.** A tap value promises a clip
exists, and there are no human voice clips on the shelf — the Grade 3 taps are on
objects and scenery only. The composition lint reads either attribute, so people
are still measured; give a person a `data-tap` only in the same change that adds
the audio.

**Adding to the shared kit is safe; changing it is a content edit.** The Grade 1
pages already shipped, so a tweak to the giraffe there repaints 156 pages a
learner has read. The same goes for `STYLE`, which is embedded verbatim in every
SVG: a new `@keyframes` rewrites all 156 files for a change nobody can see, which
is why Grade 2 motion reuses the existing classes only. When the kit was
extracted out of the Musa generator, the proof it was safe was that all 13 Grade
1 books regenerated **byte-identical** — do that again after any refactor here.

**An `anim-*` class and a `transform` attribute cannot share an element.** The
animation animates the `transform` property, which replaces the attribute
outright, so the element snaps to its parent's origin. Ten colour swatches
stacked into one that way and the page rendered with a single square on a
string. Put the translate on an outer `<g>` and the class on an inner one.

**Story text lives in `ebookCatalog` (`shell/subjects/english.js`) and nowhere
else.** The `STORY.txt` and `ATTRIBUTION.txt` beside each Grade 2 book are
generated from it by `tools/write-english-ebook-docs.mjs`; only the per-book
notes (unit, themes, cameos, vocabulary) are authored there. The Grade 1 folders
still carry hand-typed copies, which is the thing being avoided — a hand copy of
shipped text goes stale the first time a sentence is corrected, and the review
workbook then shows a reviewer a story the app no longer tells.

**Book narration is runtime TTS, not pre-rendered clips.** `renderEbooks` calls
`aiVoiceUrl` per page, so a new book costs nothing to generate and none of the
English audio tooling applies to it. What IS pre-rendered is the tap-and-story
sound effects in `ebooks/tap-sounds/` — 34 clips, and **`playStorySound` takes
the raw key while a tap goes through `TAP_SOUND_ALIASES`**, so a page `sound:`
value that works as a `data-tap` can still be silent. The gate checks both paths
separately for that reason. Zuri has no cue of her own and is aliased to the
chick's chirp; three real ones are a paid ElevenLabs run away, and she must move
into `TAP_SOUND_MOOD_TYPES` in the same commit that adds them, never before —
the mood set asks for `zuri-happy.mp3`, and a missing file taps silently.

#### Two gates, because "the file exists" is not "the page is right"

`check-english-ebooks.mjs` reads the catalogue and the disk: missing
illustrations, a stale `page-NN.svg` left behind when a story got shorter, a
sound cue naming no clip, a `data-tap` that resolves to nothing, a book folder no
entry claims. It carries one recorded exemption — Musa's twelve superseded
`.webp` pages, kept because the (unwired) `validate-ehel-shared-english-ui.js`
still asserts them — and an exemption that stops firing FAILS, so the list cannot
rot.

`check-ebook-composition.mjs` measures whether the characters are inside the
frame. The kit multiplies the caller's `s` by `ANIMAL_SCALE` (2), so a figure at
`s: 1.4` needs ~180px of headroom below its standing point — arithmetic you
cannot eyeball while writing `y: 940`. The first Grade 2 draft had **147**
characters standing with their feet below the bottom edge and every page still
looked like a page. Grade 1 passes it clean, which is what calibrates the limit.

It walks the group tree composing transforms rather than matching a `<g>` and
looking ahead for a `data-tap` to name it. The lookahead version mis-read a small
drawing inside another prop — a picture of Zuri on an easel — as an unrelated
character, and reported four figures off-frame that were nothing of the kind.

**Its `EXTENTS` table is keyed on the ATTRIBUTE VALUE, not on the drawing
function, and for Duku those two names differ — so the gate had never once
looked at him.** `donkey()` draws him and tags him `data-tap="duku"`; the table
held `donkey`. An unknown name is skipped in silence, so 37 placements across
the Grade 1 and Grade 2 farm books resolved to no entry while the gate printed
✓ over them. Found 2026-08-27, while adding the Grade 1 shelf; adding `duku`
measured 37 more characters and all 37 are inside the frame, so nothing was
broken — the point is that the gate was green *because it did no work*, which is
the same shape as the ✓ printed after a skipped tier comparison and the endpoint
floor of 5 that cleared a parse finding 6 of 7. Audit the table against the SVGs
rather than against the kit:

```bash
grep -rho 'data-tap="[a-z0-9-]*"' --include=*.svg src/prototypes/ehel-academy/english/ebooks | sort | uniq -c
```

Every value there that names a CHARACTER needs a row, and a new animal that
carries `data-figure` without a `data-tap` (because no clip has been paid for)
needs one too — that attribute is the only thing making it measurable.

Both gates were mutation-tested: each invariant was broken in turn and the gate
had to fail.

Two repair tools exist for defects the gates found; both are idempotent and both
print what they changed, so their output is the review surface:
`repair-grade2-ebook-standing-lines.mjs` (lift a character back into frame) and
`repair-grade2-ebook-shadow-lines.mjs` (put a cast shadow on its owner's ground
line — which is `y + 112 * s`, not `y`).

**Look at the pages.** Every defect above passed both gates at some point, and
several were only visible in a rendered contact sheet: two suns in the sky on the
pages about where the sun is (`basicScene()` draws one, and the page added
another), a cast shadow that read as a stick, a hut whose walls sat a half-width
left of its roof, a tree house floating above a trunk that stopped short of it, a
white spider web invisible against a pale sky, and an aquarium hanging in a grey
void with the visitors standing on nothing.

### The portal pages are a deploy channel too, and it had no tool

`src/portal/*.html` (~150 pages) are served from Bunny at `platform/portal/`,
the second half of the manual Moodle release — plugin PHP to the server, portal
HTML here. Every other tier had an uploader; this one had none, and the cost was
measurable. On 2026-08-21 the two live pages were serving **2026-07-22 and
2026-07-31** builds, three merged commits behind, including the fix that first
showed families any app quiz score at all. Nothing in the repo could say so.

```bash
node tools/upload-portal-to-bunny.js                       # drift report, uploads nothing
node tools/upload-portal-to-bunny.js --upload <page.html>  # named pages
node tools/upload-portal-to-bunny.js --upload --all        # everything that differs
```

**The default is a drift report, not an upload** — "what is stale?" had no
answer before, and it is the question worth asking most often. Assume nothing
about the other ~150 pages; ask the tool.

#### Routes are gated before the upload, not after

```bash
npm run check:portal-routes                  # offline, deterministic
node tools/check-portal-routes.mjs --cdn     # plus the two CDN-only questions
```

A menu entry is `["portal:live-ops", …]`, which becomes
`portal_launch.php?report=live-ops`, resolved against an explicit `$reports`
allowlist. **A report id missing from that allowlist does not 404** — the
launcher falls through to its default, so the user silently lands on a different
page than the one they clicked. Nothing else reads both sides of that mapping.
`upload-portal-to-bunny.js` runs the gate before any PUT and refuses on failure
(`--skip-route-check` overrides), because once a dead link is on the CDN the
only symptom is somebody saying "that button goes to the wrong place".

It became worth writing when `dashboard.html` shipped after a month of drift and
took its menu from 40 entries to 112 — 99 `portal:` links in one upload, against
an allowlist nothing had ever checked it agreed with.

Mutation-tested: a dead link, a deleted allowlist entry, an entry pointing at no
file, a stale exemption, and a `$reports` format change that makes the parser
match nothing — all five must fail the gate. That last one matters most: a
parser that silently matches nothing passes every other check while comparing
against an empty map, which is green because it did no work. The gate refuses to
run below 50 parsed entries for that reason.

`--cdn` adds what only the CDN can answer. **18 `dashboard-N.html` pages are
live with no source in the repo** — design variants uploaded during the 2026-07
build and never committed — and `portal_launch.php` routes `report=dashboard` at
`dashboard-19.html`, one of them. So that route works and nothing can edit it.
Recorded as the gate's one exemption; an exemption that stops firing is itself a
failure, so it cannot rot.

Two more things learned the hard way here, both now in the tool:

- **Verify storage first, the edge second.** Pages are `max-age=300` with warm
  entries, so straight after a PUT the edge legitimately still serves the old
  copy. The first version checked only the edge and reported a perfectly good
  deploy as `✗ STILL STALE` — a false alarm that, left in, teaches whoever runs
  it to ignore the check. Storage answers "did the write land" immediately; the
  edge answers "what does a parent see" after the TTL.
- **Prove the origin before believing a stale read.** When the edge kept serving
  old bytes after a confirmed write, the decisive test was writing a
  uniquely-named probe file to storage and fetching it through the CDN: it came
  back instantly, which proved the origin was right and the staleness was only
  cache. Without that, the obvious next guess — "I uploaded to the wrong zone" —
  would have sent a re-upload somewhere worse.

### The platform is a tier too, and nothing could see it

```bash
npm run check:platform-cors                                   # the launch host
node tools/check-platform-cors.mjs --host <host>[,<host>]     # somewhere else
```

Runs automatically after an app release and after a content upload, beside the
tier check (`tools/lib/require-platform-cors.js`).

On 2026-08-26 book narration stopped for a day. Nothing here was wrong: the
live bundle was byte-identical to HEAD and the ebook code had not changed in
five days. A browser-integrity challenge had been put in front of the Moodle
box, and it answered **CORS preflights** with a 200 HTML interstitial carrying
no `Access-Control-Allow-Origin`. A preflight is sent with no cookies, ever, so
passing the challenge in a tab never helped the app — every cross-origin call
died before it was made.

Three things hid it, and each is why this gate exists:

- **The failure is a response nobody logs.** A blocked preflight never reaches
  Apache, so the access log showed ZERO narration calls rather than failing
  ones — the block's signature and its alibi at once. "No traffic" and "all
  traffic refused" look identical from the server.
- **Only the runtime surfaces broke.** Every other kind of narration is a
  pre-rendered mp3 on the CDN, and the CDN was healthy. Books are the one
  surface that calls the platform per page, so an outage of the whole API read
  as one broken feature. Wehel and progress saving were down the same day and
  nobody noticed.
- **A probe run ON the box passes.** The challenge layer exempts local traffic:
  `curl` from cPanel Terminal answered `204` with correct CORS headers in the
  same minute an external client got the interstitial. Only an off-box client
  can see this — which is what a deploy step on a laptop is.

It asserts the CONTRACT, never the symptom. The interstitial's wording, vendor
and URL can all change; what cannot is what our own PHP promises an allowed
origin. The challenge fingerprint is used only to make the message name the
cause. Endpoints are read out of the source (`platformUrl("…")`, plus the
gateway's minting line in `progress_gatewaylib.php`), so an endpoint added to
the app is probed by the next release with nobody remembering to add it — and
it refuses to run below 5 of them, the same floor the portal-route gate carries.

**Whether an endpoint needs `Allow-Credentials` is a property of the CALL.** The
six `hubredirect` endpoints send `credentials: "include"`; the progress gateway
authenticates by bearer token alone and correctly omits the header. Asserting it
everywhere fails a healthy gateway — the first run of this gate did exactly
that — so it is read off the `fetch`, with its own floor: if no endpoint parses
as credentialed, the check refuses rather than silently testing less.

Mutation-tested seven ways, all caught: a saved copy of the real challenge page
(exit 1, and it names the challenge), a host with no CORS at all, an
unresolvable host (exit 3 — not checked is not a pass), an unrecognised
argument, a broken endpoint parser, a broken credential parser, and a fixture
serving the correct contract as a positive control (exit 0). Watching a gate
pass proves nothing until you have watched it fail.

One bug it found in itself, worth keeping because the shape recurs: it printed a
correct verdict and then exited **127**. `process.exit()` tore down the process
while undici still held sockets, and on Windows that raced a libuv assertion. A
failing check reporting a code no caller reads as failure is exactly the class
of defect this file is about, so the terminal paths set `process.exitCode` and
let node drain.

**A floor cannot see a partial parse, and this gate proved it on itself.** It
refuses below 5 endpoints; the true number is 7; a release tree missing
`src/moodle/local_prequran` yields 6, which clears the floor. It ran that way
inside a real release on 2026-08-27 and printed a tick over six of seven. Two
guards now cover what the floor cannot: the gateway's source file must be
READABLE (absent → exit 2, naming the archive recipe), and the gateway must
appear in the discovered list even when the file is present (a moved minting
line → exit 2). Both mutation-tested. The general form is worth more than the
fix: **a floor set below the true count is not a floor, it is a formality** —
name the specific thing that must be there.

**What it cannot see**: it probes from wherever it runs. The 2026-08-26 outage
was per-IP — this network was greylisted while other families' calls were
landing all along, which looked like a refutation and was not. A pass here means
*this* machine can reach the platform.

**And it writes to the log you read when something breaks.** Every run puts one
`OPTIONS … 204 0` in the platform's access log per endpoint, so a session that
runs it a few times leaves a tidy row of identical counts — 6 `wehel_chat`,
6 `wehel_speak`, 6 `wehel_listen` — which reads exactly like traffic recovering.
It fooled the person who wrote it, hours after writing it, while checking
whether learners had come back from that same outage. **Identical counts across
unrelated endpoints are the tell**, and the way through is to separate the
preflights from the real calls, because only the second kind is a learner:

```bash
grep "quiz_tts.php" ~/access-logs/<host>-ssl_log | awk '{print $9, $10}' | sort | uniq -c
```

A `204 0` is somebody's preflight, this gate's included. A `200` with a
five-figure byte count is a page of a book actually narrated — which is the only
line in that file that proves the whole chain works, and on the evening of the
outage there was exactly one of them.

## Git

- Work on `main` (or feature branches off it). History before 2026-07-16 lived on `codex/*` branches, now merged and deleted.
- Primary remote `origin` → `https://github.com/tayogroup/eduplatform` (private). Push after significant work.
- Local backup remote `backup` → `C:\Users\inawa\Documents\Claude Code\EduPlatform-backup\eduplatform.git`. Refresh both with `git push origin main --follow-tags` and `git push backup --all --follow-tags`.

### Several sessions share this working tree — stage explicit pathspecs

**Never `git add -A`, `git add .` or `git commit -a` here.** More than one session
works in this checkout at once, so the tree routinely holds somebody else's
half-finished change. Run `git status` before every commit and stage the paths you
actually touched.

**And then commit with a pathspec, because staging them is not enough.** The
index is shared state and `git add` is not atomic with `git commit`, so between
your add and your commit another session can add its own files — and your commit
takes them. Use the one-command form, which reads the working tree for the paths
you name and ignores whatever else is staged:

```bash
git commit -F <message-file> -- <paths>      # flags BEFORE the --
```

Not `git add <paths> && git commit`. The gap between those two is the whole bug,
and it is milliseconds wide rather than theoretically wide: on 2026-08-24 it fired
twice within minutes, in both directions — one `git add` of two files reported
seven staged, a later `git add` of five also reported seven. Note the shape,
because it is not the one the section above describes: **neither session staged
the other's work.** Each added its OWN files to an index that already held
somebody else's. So "check what your add picked up" is the weak version of this
rule, and `EHEL_COMMIT_REVIEWED=1` cannot see it either — the hook fires on paths,
and by then the paths are already wrong.

Two mechanical notes, both of which cost a failed command or a wrong belief:

- `git commit -- <paths> -F-` fails with "pathspec '-F-' did not match any
  file(s)". Everything after `--` is a path. Message first, or in a file.
- An untracked file has to be `git add`ed before a pathspec commit will see it,
  which reopens the window for exactly one command. Put the `add` and the
  `commit` in one invocation.

The full incident, including the verification trap that follows a `reset --soft`
(**an orphaned commit still answers `git show`** — use `git merge-base
--is-ancestor`), is under "Ask storage properly, and ask it late" below. Worth
reading before a release, because the two failures compound: the thing being
swept in and out of commits that night was the release lock.

A pre-commit hook enforces the part of this that can be enforced. It blocks any
commit that stages a file listed in `tools/hooks/co-edited-files`, prints the
hunks going in, and asks you to confirm they are yours:

```bash
sh tools/hooks/install.sh                    # once per clone; hooks are not tracked
EHEL_COMMIT_REVIEWED=1 git commit …          # once you have actually looked
```

It cannot tell whose hunks are whose — git records nothing about that — so it
does not guess: it fires whenever the risk is present and makes you look. Keep
that list short. A list that grows to cover everything gets routed around with
`EHEL_COMMIT_REVIEWED=1` as a reflex, and then it protects nothing. Note it is
installed into `.git/hooks/` rather than via `core.hooksPath`, because Git LFS
owns four hooks in that directory and pointing `hooksPath` elsewhere disables all
four without saying so.

This is not hypothetical. On 2026-08-20 two commits an hour apart
(`b1b2d077c`, `716fcf128` — Grade 3 and Grade 4 picture books) each swept in
another session's uncommitted work on
`src/prototypes/ehel-academy/shell/subjects/english.js`, so a feature shipped
under a commit message about something else and its own commit landed afterwards
describing code already on main.

Two consequences worth knowing:

- **One file can carry two sessions' work** — `shell/subjects/english.js` is the
  usual one. If `git diff` shows hunks you did not write, they are someone's work
  in progress: leave the file out of that commit, or say so in the message. Never
  revert them to "clean up".
- **A release packages the working TREE, not HEAD.** `deploy-app-version.js` reads
  the files on disk, so cutting a release from a shared tree publishes whatever
  else is sitting in it — that is how v218 and v219 put a feature into production
  ahead of its own commit. `git status` before a release, the same as before a
  commit.

  **That check sees work already sitting in the tree. It cannot see work that
  STARTS while you package**, and the gap is the whole width of the upload. On
  2026-08-27, v301 was cut from this tree while another session had just been
  told by its user to revert `a2414f064` — the topbar, `course-app.js` and
  `course-ui.css`. It held off, unasked, purely because it knew a release was in
  flight; had it started, a revert nobody asked for would have shipped under a
  tag whose message is about the tutoring picker. Exactly the v218/v219 shape,
  reached from the other direction: not stale work found in the tree, but fresh
  work arriving after the tree was found clean.

  Nothing in the tooling covers this. `git status` had passed, correctly, and
  would have passed again a minute later while the tree was being rewritten
  underneath. The release lock is per storage ZONE and stops two concurrent
  *releases*; it says nothing about an ordinary edit landing mid-package. So the
  only cover is the announcement — which is a courtesy that reduces the odds,
  not a control, for the reasons already recorded above. **Say when a release
  STARTS and say when its pointers have flipped**, not just which tag you are
  taking: "I am taking v301" tells a peer nothing about when it is safe to edit
  again, and the window they need to know about is the one between those two
  messages.

  **This is not a release rule, and scoping it to releases cost a peer a wrong
  conclusion within the hour.** A content upload takes no tag and no lock, so it
  got none of this treatment — and it changed what everyone else's checks would
  say. The sequence: a session measured 24 files as stale against
  `.bunny-content-manifest.json` and told a peer so; the owner then authorised
  the upload; the peer compared STORAGE forty minutes later, found the files
  identical, and concluded the manifest had lied. It had not — it was accurate
  at both readings, and the missing fact was an upload performed after saying it
  would not be. Note the manifest has now been accused twice in one evening and
  was telling the truth both times: "the manifest is a claim, storage is the
  fact" is a good METHOD and a false RULE, and carrying it as "the manifest
  lies" would mean ignoring an accurate instrument. **Announce anything that
  changes shared state, not only the things that take a lock.**

  The generalisable half is about shelf life. The tag was re-measured from
  storage immediately before use, because this file says a verified tag goes
  stale in minutes — and the TREE was not re-measured, though it is a reading of
  shared state with exactly the same shelf life. One had a rule written about it
  and the other did not, which is not a reason to treat them differently. The
  same applies to HEAD: the session holding v301 had its local `main` move from
  `a2414f064` to `f45ed2f2a` under it mid-task, because somebody pulled in the
  shared checkout. **In this repo, "the tree is clean at `<sha>`" is a
  measurement, not a fact you established.**

If that pre-release check finds someone else's work in the tree, **do not stash
it and do not ask them to hurry** — build the release from HEAD instead:

```bash
git archive HEAD tools package.json src/moodle \
  src/prototypes/ehel-academy/shell src/prototypes/ehel-academy/shared \
  src/prototypes/ehel-academy/english/shared \
  src/prototypes/ehel-academy/<subject> \
  ':(exclude)src/prototypes/ehel-academy/<subject>/media' | tar -x -C <tmpdir>
```

**Two of those paths look unrelated to the subject you are releasing, and both
are load-bearing for the post-deploy tier check:**

- `src/moodle` holds two things a Bunny release turns out to need.
  `local_hubredirect/wehel_prompt.json` is the Wehel phrase bank, and every
  subject EXCEPT English resolves its narration hashes through it
  (`tools/lib/ehel-wehel-phrases.js`, `CLIP_SUBJECTS`); without it the check dies
  on a Moodle path in the middle of a Bunny deploy. And
  `local_prequran/progress_gatewaylib.php` is where `check-platform-cors.mjs`
  reads the progress gateway's path — **this pathspec used to say
  `src/moodle/local_hubredirect`, and the narrower form bought a silently smaller
  sweep**: on 2026-08-27 the platform check ran inside a release from an archive
  tree, printed "Preflighting 6 endpoint(s)" where there are seven, and passed.
  Six of seven, under a green tick, at the moment an operator trusts it most.
  The check now refuses rather than narrowing, so the narrow pathspec fails
  loudly — but widening it here is the actual fix.
- `english/shared` holds `course-ui.css`, which the other subjects `@import`
  and which `deploy-app-version.js` bundles into each release as
  `design-system.css`. Without it `--plan-json` cannot build the release plan,
  so the app tier goes uncompared.

The recipe went years working because English needs neither — it IS the shared
stylesheet, and it is the one subject with no phrase-bank lookup. It broke the
first time a non-English subject was released through it. Verify by running the
check inside `<tmpdir>` and confirming it reports the same file count as the
repo does; anything less means it compared less.

That English stylesheet is also a live coupling worth knowing: an English CSS
change makes every other subject's app tier stale, because their bundled
`design-system.css` came from it. Intensive English v242 went stale exactly that
way an hour after release, when an English commit touched `course-ui.css`.

**But "stale" is not the question. "Can the drift RENDER" is.** Read literally,
the paragraph above says an English CSS commit obliges you to re-release five
other subjects, and on 2026-08-26 that would have been wrong. English v286
carried a comment-only edit to `course-ui.css`; the tier check duly reported all
five other subjects behind in exactly one file, `design-system.css`. Fetching the
live `app/mathematics/v284/design-system.css` and reading it settled it in one
step: it already carried the `.deck-only` rule, and it carried the exact comment
block the commit REPLACED while carrying none of the new one. So the drift was
comments, and comments cannot render.

Releasing the five anyway would have spent five tags and put five untested
bundles in front of learners to synchronise a comment. The English-only release
was correct, and the sentence to carry forward is that the five are "stale on the
shared stylesheet" — which is a different claim from "behind", and one you can
only turn into a decision by fetching the live bundle and diffing it.

The general form is the one this file keeps arriving at from other directions:
`check-ehel-deploy-sync.mjs` compares HASHES, so it answers "are these bytes the
same" and never "does the difference matter". That is the right design — a gate
that tried to judge significance would start passing real drift — but it means
its ✗ is the START of a question. Ask the bundle, not the tick.

then run the deploy from `<tmpdir>`, copying `.env` and the
`.bunny-*-manifest.json` caches in so the uploader still skips what is already on
storage. `git worktree add` is the obvious answer and the wrong one here: a full
checkout of this repo is 1.4 GB of media, it takes minutes, and when it is killed
part-way it leaves `tools/` missing and the index reporting tens of thousands of
files as deleted — which reads as catastrophic damage and is not.

**Copy THREE manifests for an app release, because the upload and the check that
follows it read different ones.** `deploy-app-version.js` skips what is already
on storage using `.bunny-appver-manifest.json` alone; the post-deploy tier check
reads that one **plus** `.bunny-content-manifest.json` and
`.bunny-upload-manifest.json`. Copy only the uploader's — which is what "the two
caches" used to read as — and the check has nothing to compare. English v238 and
v239 both shipped that way; both times the missing one was
`.bunny-upload-manifest.json`. (`.bunny-app-manifest.json` is a fourth file and
belongs to the older `upload-app-to-bunny.js` path — copying it does nothing for
a versioned release, which is a way to believe you have brought the manifests
along when you have not.)

Until 2026-08-22 that failure was **invisible and looked like success**:
`check-ehel-deploy-sync.mjs` exits 0 when the tree has no manifests, which is
correct on its own (a fresh checkout genuinely has deployed nothing), and
`require-tiers-in-step.js` read that 0 as agreement. So a real production upload
ended with

```
No deploy manifests present — nothing has been deployed from this checkout. Skipping.
✓ app, content and audio agree for everything this deploy touched.
```

— a tick over a comparison that never ran, printed at the moment an operator is
most likely to believe it. The tiers were out of step both times.

The check now takes `--after-deploy`, which the wrapper passes: with it a missing
manifest is **exit 3** and the wrapper says the tiers were NOT checked, which is
neither agreement nor drift because either would be a guess. Standalone
behaviour is unchanged. **A release from a temporary tree without all three
manifests therefore ends non-zero now** — the upload still stands, since this is
a post-step, but you no longer get to mistake it for a pass. If you see exit 3,
the answer is to re-run the check from the repo:

```bash
node tools/check-ehel-deploy-sync.mjs english
```

Two more things the archive recipe does not cover, both found by releasing a
NON-English subject through it:

- **`git archive HEAD` as written above is English-shaped.** Intensive English's
  tier check reads `src/moodle/local_hubredirect/wehel_prompt.json` through
  `tools/lib/ehel-intensive-narration.js`, which the pathspec list does not
  include, so the check dies with `ENOENT` after a perfectly good upload. Add
  `src/moodle` to the archive for those subjects, or accept that the check has
  to be run from the repo afterwards.
- **A check that CRASHES is still reported as drift.** The exit-3 path above
  covers a missing manifest; an uncaught exception exits 1, and the wrapper then
  prints "this deploy leaves the tiers out of step", which is a verdict it never
  reached. Same class as the ✓-after-skip, one case short. If you see that
  message with a stack trace above it, the tiers were not compared at all.

#### Committing half a co-edited file: `git apply --cached`

`git add <path>` is all-or-nothing, so the first bullet above — "leave the file
out of that commit" — is the only advice the tooling supports, and it means your
work waits on somebody else finishing theirs. It does not have to. Generate the
diff, classify each hunk, write a patch of your hunks alone, and stage that:

```bash
git diff -U3 -- <path> > /tmp/all.patch     # then keep only your hunks
git apply --cached /tmp/mine.patch          # stages those hunks, tree untouched
```

The working tree keeps the other session's edits; only the index gets yours.

**Then grep the STAGED diff for their identifiers.** This is the step that
matters, and skipping it staged the wrong hunks on 2026-08-24:

```bash
git diff --cached -- <path> | grep -nE 'taughtWords|STORY_GLOSSARY_GROUP|…'
```

Two ways the classification goes wrong, both of which look right while doing it:

- **Line numbers are not stable.** They are a function of the context width, so
  every hunk start shifts the moment you regenerate at a different `-U`. A
  classifier keyed on them silently retargets.
- **"Everything after my first hunk" is proximity pretending to be ownership.**
  It fails on the real layout of these files rather than on a contrived one: in
  `shell/subjects/english.js` the shell's `config` object sits BELOW the
  worksheet code, so another session's `onBeforeRender` edit was *after* the
  first worksheet hunk and sailed through on position alone.

Same shape as the recognition-check trap recorded below — a heuristic that
happens to agree with the answer on the cases you built it from. The difference
is that here you can check it directly, because the index is readable: after
`--cached`, ask what is actually staged rather than what you meant to stage.

#### Git cannot tell you whose commit it is, and three sessions proved it (2026-08-27)

```bash
git log --format='%an <%ae>' -20 | sort | uniq -c
#  20  hwarsame <hassanwarsame@gmail.com>
```

One identity, every commit, because every session commits as the same person.
So **per-session authorship is not recorded and cannot be** — not hard to find,
absent. The only handles are the commit subject line and what a session says
about itself.

That is worth writing down because of what it does to the fix. Three attribution
errors happened in one evening between two sessions — a dirty file attributed to
whoever was in the conversation, a contact inferred from the same fact, and four
unpushed commits assigned to "the tutoring session" from their subject lines.
The reflex reading is carelessness, and it is wrong: **the fact does not exist,
so care cannot supply it**, and "be more careful" against an unavailable fact
just produces a more confident guess.

Every one of those three inferences was also *probably right*, which is what kept
the habit alive through three repetitions. So the correction has to be about the
FORM of the claim rather than its accuracy: say what you can establish and let
the gap show. "One is mine because I made it; three are not mine; whose they are
is unknowable from here" is thinner than "three are the tutoring session's" and
is the only version that survives being wrong. Same move as reporting exit 3
rather than a tick.

The pre-commit hook already works this way and is worth reading as the pattern
rather than as a nuisance: it cannot tell whose hunks are whose, so it does not
guess — it fires whenever the risk is present and makes a human look.

#### A commit can be LIVE and on no remote, and `git status` is silent about it

Found the same evening, after four releases from this checkout. Three commits
were serving learners in v304 and existed on **neither** remote:

```bash
git rev-list origin/main..HEAD    # before any release, and before you report "pushed"
git rev-list backup/main..HEAD    # CLAUDE.md names TWO copies; check both
```

A release archives HEAD, so it publishes whatever is committed locally —
pushing is a separate act nobody's release performs. The deployed bundle is not
a recovery path: `course-app.js` has its imports rewritten by
`deploy-app-version.js` and there is no `english.js` on the CDN at all, so the
only copy of those three features' source was one disk.

Two traps, both hit within minutes of each other:

- **"Is my commit on origin" does not answer "what is riding underneath it".**
  The session that flagged this knew what IT had not pushed and reported that as
  the state of the branch; there were four commits, three of them somebody
  else's, all ancestors of the one being asked about. `is-ancestor` on your own
  sha answers about you. `rev-list origin/main..HEAD` answers about the branch.
- **Checking ONE remote and reporting it as "the remote".** This file names
  `backup` as the second copy precisely for this, and it was exactly as far
  behind as origin — so "not on origin" read as "not backed up anywhere" only by
  luck. Check every remote this file claims as a copy, not the one you push to
  first.

**And there is no scoped push.** Those commits are ancestors, so a push of your
own work publishes everyone's whether you like it or not — git offers no way to
push one and not the other, and cherry-picking onto a side branch to invent one
is worse than the problem. Say so before pushing rather than after: an
instruction to push your work is not authority over anybody else's, beyond what
git forces on you.


### Diff the BUNDLE with --plan-json, never the files on disk

`deploy-app-version.js --plan-json` prints `{remote, sha1}` for every item a
release would write, needs no `BUNNY_KEY`, and uploads nothing. Compare those
hashes against the live `v{TAG}/` equivalents to see what a release actually
changes.

**Comparing a live bundle against its repo source instead gives false
positives**, because the build rewrites imports on the way in:
`shellSubjectModule()` and `shellCore()` (`deploy-app-version.js`) rewrite
`../../{subject}/shared/X.js` and `../../shared/X.js` to `./X.js` so they
resolve inside the version path. So `course-ui.js` and `course-app.js` are NEVER
byte-identical to the files they were built from. Only verbatim-copied
components — `wehel.js`, `deck.js`, `word-pictures.js`, `lucide.min.js` — can be
compared that way, which is exactly why grepping a live bundle for a marker
string appears to work right up until it silently does not.

This is the form of "verify what shipped, not what you wrote" that survives a
build step. The weaker form — grep the deployed file for a string you expect —
is fine for a verbatim component and misleading everywhere else.

#### A marker proves presence, not correctness (2026-08-25)

Marker-grepping has one honest use, and the night of six-plus releases pinned
down exactly where its edges are. When another session's release supersedes
yours — which happened to English three times in one night, twice announced to
nobody who was watching that subject — grepping the LIVE bundle for your
feature's identifiers is the cheap check for "did my work survive at all". It
was run three times that night; all three survived. Use it, with both caveats:

- **Do not derive safety from provenance instead of checking.** "The release
  was built from current HEAD, so it carries my committed work by construction"
  was argued that night and is wrong: a CURRENT tree can carry your feature
  edited, narrowed or deleted by another session that committed properly —
  `shell/subjects/english.js` was edited by four sessions in one night, so this
  is the existence proof, not a hypothetical. Stale trees are one danger case,
  not the only one. This is "HEAD is a cleaner input, not a safety property"
  (above, for content tiers) re-landing on the app tier.
- **A marker is a claim about presence read as a claim about behaviour** — the
  same shape as `uploaded: 2`, HTTP 200 on a missing directory, and
  `already uploaded: N`. Rename a function, narrow a filter by one clause,
  change a constant: marker intact, feature gone.

So the honest ordering: a marker grep is the cheap NECESSARY condition, good
for "did my work survive at all" after somebody else's release; behaviour
exercised against the live bundle is the SUFFICIENT one, worth its cost on
releases you cut yourself and whenever a marker check surprises you. And note
where a typical careful release actually sits: markers against the live bundle
plus behaviour verified in a browser against the same COMMIT is still one build
step short of behaviour against the shipped bundle itself — a small gap, not a
zero one.

One companion practice from the same night, because the superseding releases
were the trigger: **an unnamed release stamps all six subjects, so announce it
as "vNNN, all six".** The v271 announcement named only the subject that
motivated it, and a verified English deployment was superseded with no signal —
nobody did anything wrong, and the take-a-number convention cannot cover it,
because that convention is about who holds a number and this is about who owns
a subject.

### `.bunny-appver-manifest.json` is CONTENDED, and a wrong entry is silent

Several sessions share this checkout, so they share this file, and
`deploy-app-version.js:520` is why that matters:

```js
const todo = all.filter((x) => x.always || manifest[x.remote] !== sha1(x.buf));
```

The manifest decides what a future upload **skips**. A wrong entry is therefore
not noisy — the file simply never goes up, and `--verify` still passes, because
it only confirms that the bytes at that path arrive, not that they are the
current bytes. Identical shape to the `.bunny-upload-manifest.json` trap
recorded above for Computing — "a local cache, not a record of the CDN", where
630 clips sat generated-but-undeployed behind entries claiming they were up —
and to the ✓-after-skip: silence read as success.

Note what this is NOT. Both manifests compare a content hash, so neither can be
fooled by a file whose CONTENTS changed under an unchanged name; that was the
old claim about re-recorded audio and it was wrong (corrected above). The live
failure is the opposite direction — an entry that is *right about the bytes* and
wrong about whether they ever reached storage. Nothing local can tell those
apart, which is why the repair is to list storage and compare, not to reason
about the manifest.

Treat it as shared. Copy it into a release tree and back out again if you must,
but know that writing it while another session is mid-release overwrites their
record of what they just uploaded. That happened on 2026-08-22 with two other
releases in flight; nothing broke, and nothing would have said so if it had.

**So do not copy it BACK. Merge.** The paragraph above names the hazard and then
prescribes the operation that causes it, which is worth fixing in place:
"copy the manifests in and back out" is right on the way in and wrong on the way
out. On the way out, read the repo's CURRENT manifest, apply only the entries
your release wrote, and write that — the other session's entries survive because
you never held a stale copy of them in the first place.

```js
const repo = JSON.parse(fs.readFileSync(".bunny-appver-manifest.json", "utf8"));
const rel  = JSON.parse(fs.readFileSync(`${TMP}/.bunny-appver-manifest.json`, "utf8"));
for (const [k, v] of Object.entries(rel)) if (repo[k] !== v) repo[k] = v;   // yours only
```

**Ask the same comparison which case you were in**, because it is the only thing
that will ever tell you: entries present in the repo's copy but absent from your
release tree's appeared while you were running, and they are somebody else's
release. On v306 (2026-08-27) that count was **0** — 103 entries merged onto
8046, nothing at risk — and a straight copy-back would have been harmless. That
is exactly why it is written down from this release rather than from a bad one.

**The unsafe case leaves no trace at all.** A clobbered entry does not fail the
release that causes it. It fails a FUTURE upload, silently, by claiming a file is
already on storage — so the damage surfaces weeks later as a file that never
deploys, with nothing connecting it back to the release that ate the record.
There is no run to inspect, no log line, no failed check. Which means the merge
is not a refinement of the copy: it is the only version of the operation whose
correctness you can establish at the time you perform it.

Preserve the file's formatting when you write it — it is one single-line JSON
object, and re-serialising it pretty would rewrite 8,000 lines under whoever
reads the diff next.

#### One file is skipped on trust AND verified by nothing

`shared/grade-redirect.js` falls through both safeguards at once, and neither is
broken. Found 2026-08-26 while accounting for English v286.

- The manifest skips it when `manifest[x.remote] === sha1(x.buf)` — the trust
  path this whole section is about, where a wrong entry means the file is never
  sent and nothing says so.
- `--verify` cannot see it. `verifyRelease()` builds its read-back list as
  ``items.map((i) => i.remote).filter((r) => r.includes(`/${TAG}/`))``, and the
  stub is deliberately unversioned so the entry path `grade-N/index.html` stays
  stable across releases.
- The rescue that would otherwise catch it does not reach it either.
  `verifyRelease` also resolves what the ENTRY references rather than only what
  was uploaded — added because `versionIndexHtml()` rewrites computing's
  `brand-fx.js` into `v{TAG}/` while `shared/brand-fx.js` is untracked, so a
  clean checkout points the entry at a file it never sent. But that loop selects
  `/^app\/[^/]+\/index\.html$/`, the SUBJECT entry, and `grade-redirect.js` is
  referenced from `grade-N/index.html`, which the pattern cannot match.

**Half of it is safe and that is why this has never bitten.** The manifest
compares a content hash, so it cannot be wrong about CHANGED bytes: edit the
stub and it uploads. The exposure is the other direction, the same one recorded
above — an entry that is right about the bytes and wrong about whether they ever
reached storage. It bites only a release that DEPENDS on new redirect behaviour,
which would pass 16/16 and be broken on the CDN.

The guard is passive, costs nothing and mints no cached 404, because it reads
STORAGE rather than probing the edge. Take the expected hash from the release
plan, which needs no `BUNNY_KEY`:

```bash
node tools/deploy-app-version.js <tag> --shell --plan-json english   # sha1 per remote, uploads nothing
curl -s -H "AccessKey: $BUNNY_KEY" "https://storage.bunnycdn.com/ehelacademy/Ehel%20Primary/app/english/shared/grade-redirect.js" | sha1sum
```

Run on v286: both `30c9606829b5ef784ea1d6dbcf7d2f869b123058`, 920 bytes.

**Scope this honestly.** It is demonstrated for exactly one file, on one
release, where it did not bite — a real hole, and NOT yet evidence about any
other pair of checks in this repo. What is worth carrying is the shape: two
safeguards that are each complete on their own, with a file between them that
was invisible because each one could point at the other. That is a step past the
failures elsewhere in this file — the ✓ printed after a skip, the gate that is
green about an unreachable feature — because here neither check is doing nothing.
Their union has a hole, and no single check can report it.

#### `--dry` prints the RELEASE, not the upload set

The per-file list under a `--dry` run is every item the release CONTAINS. It is
not what will be sent, and a file appearing in it says nothing about whether the
manifest will skip it:

```js
// tools/deploy-app-version.js
const todo = all.filter((x) => x.always || manifest[x.remote] !== sha1(x.buf));  // :581
console.log(`items: ${all.length} | to upload: ${todo.length} …`);              // :583 — only the COUNT
if (DRY) { for (const item of all) console.log(…); }                            // :585 — iterates `all`
```

Read as an upload list it inverts the answer for exactly the files this section
is about. On 2026-08-26 a science+computing release was planned by reading that
list, and the conclusion drawn was that `app/computing/shared/grade-redirect.js`
was being uploaded while `app/science/shared/grade-redirect.js` was being
skipped. **Both were skipped** — the two stubs are byte-identical
(`17afd85ca4b5…`, 845 B) and both matched the manifest. The inference pointed at
dropping the check on computing's stub, which sits on the identical
invisible-to-`--verify` path as science's, so the file that most needed the
storage comparison was the one the reasoning excused.

**Two compounding errors produced that, and the second is the one to learn
from.** The first is reading `all` as `todo`. The second is that the command was
run as `--dry … | tail -45` against 50 lines of output, and the 5 discarded lines
were:

```
tag: v287 | subjects: science,computing …
items: 44 | to upload: 42 (4 pointer files always sent)   <- the refutation
    34976B  app/science/v287/course-ui.css
    13760B  app/science/v287/geometry-webgl.js
      845B  app/science/shared/grade-redirect.js          <- one of the two files being compared
```

So the asymmetry between the two stubs was **manufactured by the truncation**:
science's line was cut, computing's survived, and two byte-identical files on
identical paths appeared to be treated differently. And `items: 44 | to upload:
42` — the arithmetic that refutes the whole inference — was printed immediately
above the list being misread, at PLAN time, and thrown away by the same pipe.
This was not corroboration discovered afterwards; the refutation was on screen
before the wrong belief was formed.

**`tail` a tool's output and you discard its summary first.** These tools print
counts before detail, so a pipe that keeps the end keeps the least
interrogatable part. Where the question is "what will this do", read the header,
not the list.

Reproducing this today prints `to upload: 4`, not 42: v287 has since been
released, so the manifest records those files and only the four always-sent
pointers remain in `todo`. The 42 is specific to the pre-release run. A count
that does not reproduce is the expected behaviour of a manifest-driven tool, not
a sign this entry has gone stale.

**This is the INVERSE of the rest of this section, and that is why it is worth the
space.** Everything else here is a check that silently does no work: a ✓ after a
skip, a gate green about an unreachable feature, a parser matching nothing. Here
nothing malfunctions and nothing is missing. The output does exactly what it says,
and the reader supplies the error. It shares that shape with the platform probe
writing its own `OPTIONS … 204` lines into the access log it is used to read
(recorded above, same day) — the two failures here that are a PRESENCE rather
than an absence. An absence you can go looking for; a presence has to be
recognised, and the extra data is what misleads you.

To learn what a release will actually SEND, compare `--plan-json`'s `sha1` per
remote against `.bunny-appver-manifest.json` — or skip the inference entirely and
compare the plan against storage after the fact, which is what the guard above
does.

#### `| head` on a deploy does not truncate the output, it KILLS the upload

The section above is about `tail` discarding a tool's summary header. `head` is
the same reflex and a worse failure, because the damage is not to what you read:
`head` exits at its line count, node takes SIGPIPE, and **the upload stops where
it stands.** Redirect the whole run to a file and read the file:

```bash
node tools/deploy-app-version.js vNNN --shell --verify > "$SCRATCH/deploy.log" 2>&1
```

On 2026-08-26 `… v288 --shell --verify | head -40` died at **65 of 126 files** —
and pointers are written per subject as that subject finishes, so
`app/english/index.html` and `current.json` had ALREADY been flipped to v288.
English's live pointer referenced `v288/lucide.min.js`, which never uploaded, so
every icon in the English shell was an empty `<i>` for about twenty minutes.
Mathematics happened to complete before the kill; the other four never had their
pointers flipped and stayed safe on their previous bundles throughout. **A
partial release is not uniformly partial** — which subjects are live on the new
tag is decided by where in the sequence it died.

**Do not complete the half-written tag, and do not probe it.** The manifest is
written back only at the end, so a killed run records nothing, and the retry is
refused by `tagAlreadyWritten` — "identical bytes … but this checkout never
uploaded it" — which is correct: from the manifest's side your own dead run is
indistinguishable from a stranger's release. `--force-tag` would get past it and
is still the wrong move, because a version-path 404 is edge-cached 37+ hours and
cannot be purged with the key in `.env`. If a learner hit the missing file in
those minutes, that miss is cached and overwriting the tag does not reach them —
and checking whether one did is itself the thing that mints it. Roll forward to a
fresh tag, which is the remedy the tool's own error prints first, and leave the
spent tag in place: the v262 precedent, where deleting an orphan would convert it
into an unpurgeable 404.

**And verify from storage, never from the run's own output** — the output is
exactly what a SIGPIPE takes away. Compare `--plan-json`'s remotes against a
storage listing, then read each subject's `index.html` and confirm every
`v{TAG}/` file it references is actually there. That comparison is what found
this; the truncated log looked like a healthy release scrolling past.

### A pre-commit check shaped like recognition cannot see a new feature

Three sessions swept each other's work into their commits over 2026-08-21/22 —
twice a single line, once a whole feature (211 insertions of another session's
grade dictionary, under a commit message about handwriting). The instinct after
the first two was to grep the staged diff for the markers that had already
caught people: `dictionaryPicture`, `wordPicture`, `wehel`. That grep came back
clean on the third, because **an allowlist of yesterday's accidents can only
find yesterday's accidents.**

What worked was the opposite move: reading the hunk headers and stopping at
function names the author did not recognise. Scan for the UNFAMILIAR, and treat
"I do not know what this is" as the signal — it is the only check here that does
not require having been burned by the specific thing first.

The same shape runs through every deploy bug in this file: a check that can only
see what it was told to look for, reporting silence as a pass.

### The release tag is ONE GLOBAL number, shared by every subject

`v{TAG}` is a release number for the platform, not a per-subject counter. A
release with no subject named stamps all six subjects with the same tag, so the
same number exists under several `app/{subject}/v{TAG}/` directories and means
the same release. Naming a subject leaves the others behind, which is where the
gaps come from — on 2026-08-22 English stood at v242 while Mathematics, Science,
Computing and Global Perspectives all sat at v237 from the last full release.

Measured, not inferred: **38 tag numbers exist in both `app/english/` and
`app/intensive-english/`**, and the other four subjects share v233-v237 exactly.
`nextFreeTag()` in `check-ehel-deploy-sync.mjs` matches that — it scans
`app/[a-z-]+/v(\d+)/` across EVERY subject in the manifest and returns the
global maximum plus one.

So the rule is the simple one: **take the highest v{N} across ALL subjects and
add one.** Do not reason from a single subject's own series. Intensive English's
highest was v237 on 2026-08-22 and v238 was NOT free — English was already four
releases past it.

Three ways to get this wrong, all seen the same day:

- **Listing ONE subject's directory and adding one.** This is the trap, because
  it is right about as often as it is wrong and nothing tells you which case you
  are in. Two sessions used exactly this method within an hour: listing
  `app/english/` gave v242, which was correct only because English happened to
  hold the global maximum; listing `app/intensive-english/` gave v238, which was
  four releases stale. Same method, opposite outcomes, decided entirely by which
  subject was in front of you. A number that is right by luck is worse than one
  that is plainly wrong.
- **Trusting the tool's number without checking storage.** It reads
  `.bunny-appver-manifest.json`, which is per-worktree, so it reports whatever
  this checkout happens to have released. It said "next free: v241" while
  English's v241 was already live from another session. The manifest is a local
  cache; storage is the fact. List all six subjects and take the true maximum.
- **Two sessions releasing at once.** Both compute the same next number from the
  same storage state and both write it. That happened: Intensive English v242
  and English v242 were released an hour apart by different sessions, each
  correct in isolation. Nothing broke — the directories never meet, and each
  release verifies clean — but the global sequence now has a duplicate, and
  "v242" no longer identifies a release without naming the subject too. **If
  another session may be releasing, say which tag you are taking before you
  take it.**

#### Ask storage properly, and ask it late (2026-08-24)

Six app releases landed on the night of 2026-08-24 — v257 through v262, four of
them English — from several sessions sharing this checkout, and every rule above
was exercised. What follows is what they added. (How many sessions is
deliberately not stated: peer session names are opaque and two of them claimed
the same tag, so the count is not something that was ever established.)

**A tag verified free has a shelf life measured in MINUTES.** Three separate
"next free" answers went stale that night between being measured and being
used — v259, v261 and v262 — each because another session released in the gap.
One of them was passed to a user as free in the same message it stopped being
true. So re-measure at the point of use, not the point of planning: the listing
belongs immediately before `deploy-app-version.js`, not in the paragraph where
you decided to release.

**Probing a candidate path does not answer the question, and answers it wrongly.**
`GET app/<subject>/v{N}/` returns **HTTP 200 with an empty JSON array** for a
directory that does not exist. Measured: a probe of a then-unwritten tag across
all six subjects returned 200 six times out of six, and the same listing showed
0 objects in every body. So a status check reports EVERY candidate tag as taken,
including free ones. Read the body and
count objects: a real tag holds 15-ish, a free one holds 0. This is the concrete
mechanism behind "list storage, never probe"; the rule was written from the
CDN-side hazard (a probe against the edge mints a cached 404 that cannot be
purged with the key in `.env`) and the storage side fails differently and just
as silently.

**How long that cached 404 lasts depends on the PATH SHAPE, and the gap is five
minutes against at least 37 hours.** Measured 2026-08-26, around the v285/v286
releases: an entry-path 404 carries `max-age=300`, while a version-path 404
survived **37+ hours and was never observed to expire**. The contrast is what
makes "never probe" usable rather than blanket. Never probe a `v{TAG}/` path
before its upload lands — the mistake is effectively permanent, the key in
`.env` cannot purge it, and it has already cost one session a real five-minute
outage and a burned tag. An entry path is cheap to be wrong about, because it
clears itself in five minutes. Storage reads with the access key are passive and
answer the same question without minting anything.

It cuts the other way too, and that half is about `app/shared/fonts/`. Assets
exempted from the version path sit on ENTRY paths, so a correction to one lands
within five minutes instead of waiting on a new tag — but the same fact means a
release's font depends on a short-cached fetch rather than on the immutable
`v{TAG}/` copy the rest of the bundle gets. Good trade, worth knowing you made
it.

Same standing caution as the cache-control table above, and for the same reason:
these are edge-rule numbers, not properties of the path, so they can change
under the repo with no commit to notice. Re-measure before relying on either.

**Announcing is point-to-point, so "I announced" and "nobody was told" are both
true at once.** This is the finding, and it is worth more than the convention it
kills. That night one session announced v261 to a second session — which is the
only reason those two did not collide — and not to a third, which had just told
its user v261 was free. From the third session's side the release was
unannounced and its verified number went stale; from the first session's side it
had announced. Nobody can distinguish "not announced" from "not announced TO
ME", and a convention requiring every session to broadcast to every other fails
silently the first time one pair is missed.

**Then it failed with both parties complying, which is the case that settles
it.** Later the same night two sessions took v263 for English, for the same
commit, minutes apart. Both announced before writing. Both listed all six
subjects on storage and both got the right answer. Both said which subject and
which tag. Each did everything this section asks — and they announced to
DISJOINT sets of peers, so neither heard the other, and both proceeded believing
they had coordinated. It was caught only because a third session happened to
receive both messages and warned them; without that accident the second write
would have gone out. There is no broadcast channel here, and no session can see
the set of sessions, so "I announced" cannot be strengthened into "everyone
knows" by trying harder.

So: **announce anyway** — name the subject, the tag and the moment it lands; it
costs nothing, and it is what stopped the v261 collision. But it is a courtesy
that reduces the odds, not a control that prevents the failure. The controls are
the two things that reach a session nobody can enumerate: the zone lock below,
which is in the tool every release runs, and the take-the-global-maximum rule
above, which is in this file every session reads at startup. A convention lives
only in the messages people remember to send.

**The control is `tools/lib/release-lock.js`**, one lock per storage ZONE, held
from before `.bunny-appver-manifest.json` is read to after it is written back
(the read-modify-write is half of what is being protected). It lives in the OS
temp dir, deliberately NOT in the repo: releases here run from `git archive`
temp trees, so two concurrent releases have two different repo roots and a lock
beside the manifest would be a lock each session held against itself — it would
contend with nothing and pass every test. Stale locks break on a dead pid or a
30-minute TTL and always report it; `--dry` and `--plan-json` neither take it
nor wait for it, because a plan is exactly what somebody blocked by the lock
wants to run.

**Byte equality proves a release is correct, not that it is YOURS.** The old
guard refused a tag that existed with DIFFERENT bytes and let identical bytes
through, reasoning that a retry after a failed upload is not a second release —
true for one writer, false for two. Two sessions told to release english v261
from the same HEAD produced byte-identical bundles, so every check passed for
the second one, and the damage would have been a silently clobbered
`.bunny-appver-manifest.json`, which decides what a FUTURE upload skips: the
loss surfaces weeks later as a file that never deploys. `tagAlreadyWritten` now
takes the manifest and refuses identical bytes that this checkout has no record
of writing, which separates our retry from a stranger's release without breaking
retries. It also makes the temp-tree recipe's "copy the manifests in and back
out" load-bearing rather than housekeeping — a release tree without them now
fails this check, correctly, because it genuinely cannot tell whose release it
is resuming.

**Do not test release tooling with a real release.** `v262` exists because a
session testing a new lock planted a held lock and ran a real release to watch
it refuse — from a `git archive HEAD` tree built BEFORE the lock existed, so the
old tool ran, with a real key and a real tag, and shipped. It is byte-identical
to v261 so nothing regressed, and it is deliberately NOT deleted: a version path
is edge-cached for a year, so deleting it converts a harmless duplicate into an
unpurgeable 404. A spent tag number is much the cheaper failure. The general
trap is that an archive tree is a snapshot of HEAD, so it cannot contain the
uncommitted change you are trying to exercise — testing new tooling from one
tests the old tooling.

**Two of these fixes were swept into somebody else's commit, and then vanished
with it.** `release-lock.js` and the `tagAlreadyWritten` change landed in
`5236df358`, whose message is "English: Grade 8 Unit 7 kept its source list's
numbers inside the words" — release-safety work committed under a message about
vocabulary, because `git add` is not atomic with `git commit` and the index is
shared. Its author then noticed (`git show --stat` reported seven staged files
where five were asked for), ran `reset --soft` and re-committed their own five
as `cbd49170d`. **So `5236df358` is not on main at all** — and for about twenty
minutes neither fix was, while its author believed both were. They are on main
now, re-committed properly scoped as `a73840ab8` ("Refuse to start a release
while another one holds the zone", two files, nothing else swept in).

Two things to take from that, both of which cost somebody an hour:

- **An orphaned commit still answers `git show`.** The lock's author verified
  the committed blobs against their tested copies, got byte-identical, re-ran
  the suite green, and reported the hole closed on main. Every step was correct
  and the conclusion was wrong, because `5236df358` had already been reset out
  of the branch. `git merge-base --is-ancestor <sha> HEAD` is the question;
  `git show <sha>` is not — nor are `git show --stat` or
  `git log --oneline -- <path>`, which answer just as happily for a commit that
  has been reset away. The same trap caught the person writing this section
  down, twice: the paragraph above first claimed the fixes WERE on main, from a
  `git show --stat` run while that commit was still HEAD; the correction then
  went stale within twenty minutes when they genuinely landed. **The shelf-life
  rule this section opens with applies to these notes too** — state the sha and
  let the reader check it, rather than writing a present-tense claim about the
  branch that expires.
- **Explicit pathspecs do not protect the INDEX.** The rule further up — stage
  the paths you actually touched — is about your own `git add`, and it is not
  enough, because the index is shared state and `git add` is not atomic with
  `git commit`. Note the shape carefully: neither session staged the other's
  work. Each added its OWN files to an index that already held somebody else's,
  and it happened in both directions within minutes — one `git add` of two files
  reported seven staged, and a later `git add` of five also reported seven. So
  "check what your add picked up" is the weak version of the rule. `git commit
  -- <paths>` is the form that is safe for both parties; failing that, read
  `git show --stat` after every commit and confirm the file count is the one you
  asked for. That is what caught this one. (Put the message before the `--`, or
  in a file: `git commit -- <paths> -F-` reads the flag as a pathspec and
  fails.)

**And a reading trap that cost a wrong claim that night:** in a tree several
sessions share, the working copy is not evidence about the shipped code. A grep
of `tools/deploy-app-version.js` found a comment line stating the old behaviour
and it was reported as current — but the file was being rewritten at that
moment, and the line survived only as a QUOTATION inside its own replacement,
which existed to say it was wrong. `git show HEAD:<path>` is the check; grep of
the working tree is not, and it is worse than relaying because it comes with a
claim of having verified.

**HEAD is a cleaner input, not a safety property.** The recipe above keeps
somebody else's uncommitted work out of a release. It does NOT make the release
safe, and reading it that way is how the content tier nearly shipped broken on
2026-08-22. What is committed can be just as far from the CDN as what is not:
that day HEAD carried five master-dictionaries and 50 unit JSONs that had never
been deployed, so the "57 committed files" a release was scoped to were 62.

**Diff against the LIVE copies and ship only if the deploy introduces nothing.**
For content, that means resolving every audio path the shipping files reference
against storage, then fetching each file's deployed copy and comparing:

- 272 of 10,535 references pointed at clips not on the CDN — a silent fallback to
  the PAID runtime TTS endpoint, one per reference, that nothing in the repo
  reports.
- Every one of them was **already** broken in the deployed copy. 0 introduced,
  0 fixed. That is what made the deploy safe — not where the tree came from.

Had that number been non-zero, HEAD would have been exactly as unsafe as the
dirty tree. Run the comparison; do not infer it from provenance.

The same day's dirty tree is the other half of the lesson: 8 uncommitted
master-dictionaries had moved from 25 renamed clip references to **8,134 added**
ones (4,774 distinct basenames — a word taught in eight grades is eight
references and one file), essentially all of them 404 on the CDN. A "small
spelling migration" by description; thousands of silent paid fallbacks in fact.
Count the references, never the description.

## Verification before committing

1. `npm run validate:units` and `npm run check:alphabet` must pass.
2. **If you touched any PHP: `npm run check:php` must pass.** Not in `npm test` because it spawns a parser per file (~23s for 610 files) and most changes here are JS or content — so it is on you to run it when you edit `src/moodle`.
3. If build output matters: `npm run env:local-dev`, then spot-check via `npm run preview:bunny:production`.
4. Playwright e2e only runs against a configured Moodle instance — don't treat missing `EDUPLATFORM_*` env as a code failure.

### Splitting one condition into two wakes up whatever was equal to the old one

Worked example, 2026-08-27, from the tutoring deck-only change (the hard rule
near the top of this file). Science had TWO gates that were the same expression:

```js
const deckStage   = () => stageNumber <= DECK_MAX_STAGE;   // and, further down,
const BOTH_DESIGNS = () => stageNumber <= DECK_MAX_STAGE;
```

and each of its ten renderers read

```js
if (BOTH_DESIGNS()) return renderDeckOnly(renderXDeck);   // always returned first
if (deckStage())    return renderXDeck();                 // therefore NEVER reached
```

The second line was dead — extensionally equal to the first, so unreachable on
both sides of the boundary, and it had been that way since Stage 1 shipped.
Adding `deckPage() = BOTH_DESIGNS() && learnerCategory !== "tutoring"` to the
FIRST line made the two diverge, and the dead line woke up on the one input
where they now differ: a tutoring learner got a full-bleed deck with the topbar
gone — the exact opposite of the change's intent, in the only case the change
was for. All ten are deleted and `deckStage` with them.

**A diff structurally cannot show this.** Nothing about that line was edited.
Its MEANING changed because a sibling expression changed; its text did not. So
reviewing the diff harder never reaches it, however carefully — and the edited
call sites, the ones a reviewer does check, are the safe half by construction.

So, when a change splits one condition into two: **grep for every OTHER
expression that was equivalent to the old one, not only the sites you edited.**
The unedited sites are where the meaning silently moved. It is one grep.

Two honest limits on this note:

- **It is demonstrated once, in one subject.** Mathematics, Computing, English
  and Global Perspectives each had a single gate and were unaffected. This is a
  shape worth checking for, not a defect class known to be widespread here.
- **The redundancy is what made it invisible, not the deadness.** A condition
  that plainly does nothing gets deleted. One that is *equal to a live
  condition* tests fine, reads as load-bearing, and is indistinguishable from
  doing work right up until its twin moves.

It was found by opening the page as a tutoring learner and seeing a deck, not by
reading code — which is the same lesson as the `break-inside: avoid` page count
and the two suns in the sky: the declaration tells you the intent, never what
the running thing does.

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

`check:php` also runs `check-progress-attempted.php`, the one behavioural test
of the progress reducer. Global Perspectives has no score to report — its 315
questions are self-marked free text — so it sends `attempted`
(`{section: {answered, total}}`) on `progress.summary` instead. The property
worth gating is that this can never become a grade: a count reaching
`checkpoint.result` is a coloured percentage in the family portal and a row in
the gradebook, reporting mastery nobody measured. That lives in the reducer's
behaviour, not in any file's shape, so the gate loads the real
`externallib_progress.php` and calls its real private statics by reflection —
a copy of the logic would pass while the shipped code was broken.

**Mutation-tested**, and one mutation survived the first version: deleting the
`sanitise_attempted()` call from `apply_event()` entirely changed nothing,
because every `apply_event` case fed an already-clean payload while the
sanitiser was only tested in isolation. The two were never tested as
*connected*. The fix is the hostile-input-through-the-event-path case — assert
on what is STORED, never on what a helper returns on its own. Same lesson as
the Wehel gate's message-count check, found the same way.

It also pins a pre-existing quirk rather than leaving it to be rediscovered:
`apply_event` ends with `$state['checkpoints'] = (array)…`, and
`(array)new stdClass()` is `[]`, so an untouched checkpoints map serialises as
`[]` rather than `{}` once any event lands. `sql/verify_progress_curriculum_map.sql`
check 7 already works around it. `attempted` does not share the quirk — it is
only ever the untouched `stdClass` or a non-empty map — and the gate asserts
both halves of that.
