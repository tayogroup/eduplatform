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

  **One owner-approved exception (2026-09-11): the English Grade 5 STANDALONE
  lesson app** (`english/grade-5-app/`) is the Grades 1-4 step-by-step build,
  chosen by the owner for that app only. The Grade 5 shell course keeps its
  page design, and nothing in that app writes to `english/grade-5/data` — its
  README says what Grade 5 switches off and why. It is not a precedent for any
  other grade or subject.
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

## Curriculum validation

Before merging a change to a Cambridge framework file (`src/curriculum/cambridge-english-*.json`) or to unit objective mappings, both of these must exit 0:

```bash
npm run validate:frameworks
npm run validate:curriculum-units -- --strict-cambridge
```

`validate:frameworks` checks a framework file against itself: text misextracted from the source PDF, numbering gaps within a sub-strand, `counts` disagreeing with the arrays. `validate:curriculum-units --strict-cambridge` checks that every objective a unit claims exists in the stage that unit declares.

A framework failure usually means the extracted JSON is wrong, not the unit. The frameworks are parsed out of Cambridge's PDFs and the source documents are not in the repo, so fix the framework before re-pointing any mapping at it.

## Git

- Work on `main` (or feature branches off it). History before 2026-07-16 lived on `codex/*` branches, now merged and deleted.
- Primary remote `origin` → `https://github.com/tayogroup/eduplatform` (private). Push after significant work.
- Local backup remote `backup` → `C:\Users\inawa\Documents\Claude Code\EduPlatform-backup\eduplatform.git`. Refresh both with `git push origin main --follow-tags` and `git push backup --all --follow-tags`.

## Working in this shared checkout

**Several sessions edit this tree at once.** Every rule below was bought by a
real incident; the full account of each is in
[`docs/release-and-repo-history.md`](docs/release-and-repo-history.md), which is
not loaded into context — read it before changing any of this, or when a rule
does not obviously cover the situation in front of you.

### Staging and committing

- **Never `git add -A`, `git add .` or `git commit -a`.** The tree routinely
  holds another session's half-finished work.
- **Run `git status` BARE before every commit.** A pathspec-filtered status is
  not that check — its output is indistinguishable from a clean tree, because it
  cannot tell you "nothing else changed" from "I did not ask".
- **Commit with a pathspec in ONE command**, because the index is shared and
  `git add` is not atomic with `git commit`:

  ```bash
  git commit -F <message-file> -- <paths>
  ```

  Flags go BEFORE the `--`; everything after it is a path, so `git commit --
  <paths> -F-` fails. An untracked file must be `git add`ed first, which reopens
  the window for exactly one command — combine them.
- **Install the pre-commit hook once per clone**: `sh tools/hooks/install.sh`.
  It blocks commits touching `tools/hooks/co-edited-files` until you confirm the
  hunks are yours; `EHEL_COMMIT_REVIEWED=1 git commit …` once you have looked.
  Keep that list short — one that covers everything gets routed around.
- **After every commit, confirm it is yours**: `git show --stat` for the file
  count you asked for, and check the subject line and `Co-Authored-By` trailer.
- **To commit half a co-edited file**: `git diff -U3 -- <path>`, keep your hunks,
  `git apply --cached`. Then grep the STAGED diff for the other session's
  identifiers. Line numbers shift with context width, and "everything after my
  first hunk" is proximity, not ownership.
- **Never revert hunks you did not write** to "clean up". `shell/subjects/english.js`
  is the usual file carrying two sessions' work.
- **Git records no per-session authorship** — every commit is the same identity.
  Say what you can establish and let the gap show; do not infer whose work is
  whose from a subject line.
- **Before reporting anything as pushed, check BOTH remotes**:

  ```bash
  git rev-list origin/main..HEAD
  git rev-list backup/main..HEAD
  ```

  A release archives HEAD, so a commit can be live for learners and on no remote.
  There is no scoped push — your push publishes everyone's ancestors, so say so
  before pushing rather than after.
- **`git show <sha>` answers just as happily for a commit that has been reset
  away.** The question is `git merge-base --is-ancestor <sha> HEAD`.
- **The working copy is not evidence about shipped code.** Another session may be
  rewriting the file as you read it — use `git show HEAD:<path>`.
- **A mutation/repair harness is a WRITER here.** Copy the files it will touch to
  the scratchpad first and `cmp` afterwards; its snapshot-restore is fully
  satisfied by a tree it has just overwritten with a peer's work. Check a bare
  `git status` before starting, and never run a whole-suite mutation over a build
  someone else has open.
- **Scan a staged diff for the UNFAMILIAR, not for a list of known markers.** An
  allowlist of yesterday's accidents only finds yesterday's accidents.

### Releases

- **The release tag is ONE GLOBAL number.** Take the highest `v{N}` across ALL
  six subjects on storage and add one. Listing one subject's directory is right
  about as often as it is wrong, and nothing tells you which case you are in.
  Do not trust the tool's "next free" — it reads a per-worktree manifest.
- **Re-measure the tag at the point of use, not the point of planning.** A
  verified tag goes stale in minutes.
- **Say which tag you are taking, when the release STARTS, and when its pointers
  have flipped.** Announcing is point-to-point and cannot reach a session you
  cannot enumerate, so it reduces the odds rather than preventing the failure —
  the controls are the zone lock and the take-the-global-maximum rule. Announce
  anything that changes shared state, including a content upload that takes no
  lock. An unnamed release stamps all six subjects: announce it as "vNNN, all six".
- **A release packages the working TREE, not HEAD.** Bare `git status` first. If
  it holds someone else's work, build from HEAD with the `git archive` recipe in
  the history doc — do not stash their work or ask them to hurry. That recipe's
  pathspec list includes `src/moodle` and `english/shared`, which look unrelated
  and are load-bearing for the post-deploy checks.
- **HEAD is a cleaner input, not a safety property.** Diff against the LIVE
  copies and ship only if the deploy introduces nothing new.
- **Copy THREE manifests into a release tree** (`.bunny-appver-`,
  `.bunny-content-`, `.bunny-upload-manifest.json`). With any missing, the
  post-deploy tier check has nothing to compare.
- **Merge manifests back; never copy them back.** Keep the copy-in snapshot and
  write only the keys your run changed — a two-way diff cannot tell "I wrote
  this" from "they wrote this", and clobbering a peer's entry surfaces weeks
  later as a file that silently never deploys. Preserve the single-line JSON
  formatting.
- **Never pipe a deploy through `head`** — SIGPIPE kills the upload mid-run, and
  pointers are flipped per subject as each finishes, so a partial release is not
  uniformly partial. Redirect to a file and read the file.
- **Never `tail` a tool's output either.** These tools print their summary first,
  so a pipe keeping the end discards the part that answers your question.
- **`--dry` prints the RELEASE, not the upload set.** It lists every item the
  release contains; the count in the header says what will actually be sent.
- **Diff the BUNDLE with `--plan-json`, never the files on disk** — the build
  rewrites imports, so `course-ui.js` and `course-app.js` are never byte-identical
  to their sources. Only verbatim-copied components compare that way.
- **A marker grep proves presence, not correctness.** It is the cheap necessary
  check that your work survived a peer's release; behaviour against the live
  bundle is the sufficient one.
- **A new `shell/` sibling needs one `--plan-json` before it ships** — the bundler
  derives siblings from imports, and a file imported only by `course-app.js` was
  invisible to it until 2026-09-07.
- **Never test release tooling with a real release.** A `git archive HEAD` tree
  cannot contain the uncommitted change you are exercising, so it tests the old
  tooling — that is how `v262` shipped.
- **A half-written tag is abandoned, not completed and not probed.** Roll forward
  to a fresh tag; a version-path 404 is edge-cached for 37+ hours and the key in
  `.env` cannot purge it.
- **`check:print-sheets` gates every English release and can deadlock** (low CPU,
  long wall clock). `--skip-print-check` needs a per-release justification that no
  commit touched a print path — never a standing one.
- **Exit 3 from a post-deploy check means NOT CHECKED, which is neither agreement
  nor drift.** A tick over a comparison that never ran is this repo's most
  repeated failure. A crashing check exits 1 and is reported as drift it never
  measured.

### Storage, the CDN, and proving absence

- **To prove a file is absent, ask STORAGE with the access key.** A storage read
  is passive; an edge read is a WRITE to the cache. A 404 you mint by checking
  is permanent on a media or version path and cannot be purged from here.
- **Never probe a `v{TAG}/` path before its upload lands.** Entry paths are
  `max-age=300` and cheap to be wrong about; version and media paths are a year.
- **A storage listing of a non-existent directory returns HTTP 200 with an empty
  array.** Read the body and count objects — a status check reports every
  candidate tag as taken, free ones included.
- **A manifest is a claim; storage is the fact.** But that is a method, not a
  rule — the manifest has been accused and been right. To repair, list storage
  and compare, then delete the wrong entries and re-run.
- **Dereference before deleting.** Bunny caches a 404 on a path that cannot be
  purged, so a file deleted while something still asks for it becomes a permanent
  hole. Match exact quoted paths, never substrings.
- **A salt is not a nonce.** `version-lecture-video.js --salt` is deterministic;
  treat any salt as burned once its output has been probed.
- **Re-measure cache-control before relying on any figure** — the window is set by
  an edge rule, not by the path, and it has changed under this repo twice, in both
  directions. The measured table is in the history doc under Global Perspectives
  deployment.

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

## Where the rest of the detail lives

This file used to be 4,385 lines and was loaded into every session in this repo
before anyone typed anything. It was split on 2026-09-12. **Nothing was deleted** —
the material moved into directory-scoped `CLAUDE.md` files, which Claude Code
loads on demand when it reads a file in that directory, and one plain doc that is
read only when asked for.

So: the rules that must hold everywhere are above. The account of how each was
learned is below, and arrives when you are actually working in that area.

| Working on | Loads automatically | Holds |
| --- | --- | --- |
| anything under `src/prototypes/ehel-academy/` | `src/prototypes/ehel-academy/CLAUDE.md` | Wehel and the contract that holds it (daily allowance, token backstop); the tutoring topic index and the derived topbar picker; the two progress stores; the five silent failures of the progress client; the shared subject-pipeline loop; `shell/learner-controls.js` |
| English | `…/english/CLAUDE.md` | narration audio and its four blind checks; the frame-narration rule; the content gate; the four print paths; the illustrated picture books and their two gates; the CDN orphan pruner |
| Science | `…/science/CLAUDE.md` | answer keys vs the booklet; the Cambridge objective gate; reviewed scripts; narration |
| Computing | `…/computing/CLAUDE.md` | booklet answer keys; Stages 1-4 deck-only; reviewed scripts; narration; the word-picture map |
| Global Perspectives | `…/global-perspectives/CLAUDE.md` | the two pack shapes; the unauthored Stages; assigned objective codes; reviewed scripts; narration; which subjects' clips git actually holds; the measured CDN cache-control table |
| Mathematics | `…/mathematics/CLAUDE.md` | why `build:math` needs `--force`; answers checked by arithmetic; the 0096 framework hole |
| Intensive English | `…/intensive-english/CLAUDE.md` | both levels on Cambridge 0057; the standalone lesson build; Level 2's three new traps |
| Moodle plugins | `src/moodle/CLAUDE.md` | the live group board, activity ring, hand-raise and live-class flag; the classroom chat and its screenshot; the v331 poisoning; endpoint CORS contracts; the md5-is-the-only-proof deploy loop; the PHP gate and the p→q corruption |
| Portal pages | `src/portal/CLAUDE.md` | the portal deploy channel and the route allowlist gate |
| Build/deploy tooling | `tools/CLAUDE.md` | the platform CORS gate, and a pointer to the history below |

**Read on demand, loaded by nothing:**

- [`docs/release-and-repo-history.md`](docs/release-and-repo-history.md) — the
  full 61KB account behind every rule in "Working in this shared checkout":
  the shared-index commit failures, the `git archive` release recipe and its
  load-bearing pathspecs, the contended manifests and the merge-not-copy
  argument, `--dry` vs the upload set, the SIGPIPE release, tag sequencing and
  the zone lock, and how to ask storage properly. **Open it before changing
  anything about how releases work.**
- `docs/architecture.md`, `docs/bunny-deploy.md`,
  `docs/eduplatform-admin-runbook.md` — the pre-existing runbooks.

<!--
  Maintainer note (stripped before this file reaches Claude's context).

  When you add a new lesson learned, put it in the directory-scoped file for the
  area it concerns, not here. This root file should stay under ~700 lines; the
  docs recommend under 200, and the Hard rules section alone is 259.

  Only three kinds of thing belong in root:
    1. A rule that applies across subjects or across the whole repo.
    2. A rule that must hold BEFORE any file is read — anything a session could
       violate by going straight to a Bash command. Every release and git rule is
       here for exactly that reason: lazy loading fires on reading a file, and a
       deploy is a command.
    3. A pointer, so the detail can be found.

  Everything else belongs in a subtree CLAUDE.md. Do not use @path imports to
  organise this file: imported files load eagerly at launch, so they save no
  context at all.
-->
