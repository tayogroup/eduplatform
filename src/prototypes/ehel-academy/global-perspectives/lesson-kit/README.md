# The Global Perspectives lesson kit — one generator for every grade

The standalone Global Perspectives builds (`../grade-1-app`, …) are
self-contained HTML pages in the design of the Grade 1 Mathematics, English,
Science and Computing standalone builds, bypassing `shell/course-app.js`.
Everything that draws a page lives here; each grade directory holds only
`app.config.json` and `content/lesson-N.py`.

**It is the Computing kit's shape, as a separate copy, on purpose.**
`../../computing/lesson-kit` and `../../science/lesson-kit` are each live or
about to be for their own grades, and the Science kit's safety proof was a
byte-identical rebuild of its own pages. Teaching either a second subject
would have put a Global Perspectives change on the path to a live page of
another subject. The three design files are copied verbatim (same sha1 as the
Science and Computing kits' on 2026-09-10: `lesson.css` `232e43fc…`, `voice.js`
`7921e8b4…`, `deck.js` `de9591d0…`); everything else here is this subject's
own. If the Mathematics engine changes, re-copy `voice.js` and `deck.js` here
as in every other build; nothing will notice on its own.

| | |
| --- | --- |
| `build-lessons.py --app <dir>` | writes `<slug>.html` per lesson from the content; refuses a bad objective code, a quiz with no single key, a sort into a missing bin, and every relationship in `_rules.py` that the content gets wrong |
| `build-hub.py --app <dir>` | writes the hub: cards with step counts and time estimates, the six-skills panel, the printable teachers-and-parents section with the talk-together version of every activity and the answer keys — saying so where a step has no key because the child's own opinion or reflection IS the answer |
| `check-coverage.py --app <dir>` | the curriculum gate on the BUILT pages: every objective of the stage reached, per-lesson floors, keys single, and every relationship RE-COMPUTED from the shipped data |
| `_rules.py` | the relationships the kit computes rather than trusts, imported by the builder AND the gate so they cannot disagree |
| `_kit.py` | `step()`, `explain()`, `q()`, `opt()`, `tagged()`, `source()`, `spot()`, `action()`, `person()`, and `part()`, `word()`, `home()` — the vocabulary the content is written in |
| `_shell.py` | the unit shell: the steps drawn AROUND every lesson (overview, lecture, words, look-back, games, home, world, resources), and the games derived from the lesson's own content; used by both builders so the hub and the page agree |
| `lib/lesson.css` | the Mathematics design system, verbatim via the Science kit's copy |
| `lib/gp.css` | this kit's own styles; no new hue |
| `lib/voice.js`, `lib/deck.js` | lifted verbatim (the deck **unwired** — see the Grade 1 README) |
| `lib/gp.js` | the renderers, the picture scenes, the growing team scenes and the synthesiser |

Grade-specific facts live in the app's `app.config.json`: `grade`, `gradeLabel`,
`stage`, `courseKey`, `objectiveFloors` (recorded at the measured value, may
rise and not fall), `hubStrands`, the lesson list. The stage decides which
codes the builder accepts and which the gate demands.

## What is computed rather than trusted

Global Perspectives at Stage 1 is a skills subject, so what `_rules.py` can
compute is not arithmetic on a grid but the RELATIONSHIPS the skills are about.
Every one of them is checked by the builder before a page is written and
re-checked by the gate on the shipped bytes:

| rule | what it decides | objective |
| --- | --- | --- |
| `survey_counts` | the pictogram a survey produces, from the classmates' own answers | 1Rc.01 → 1Rf.01 |
| `pictogram_answer` | the most, the fewest, how many of one, whether any — a tie is refused | 1Ad.01 |
| `relevant` | which options are ABOUT the topic, by tag, never by an authored `ok` | 1Mi.01, 1Ml.01, 1Ap.01, 1Ea.01 |
| `relevant_sources` | which source can tell you about the topic (exactly one per round) | 1Es.01 |
| `solutions` | which given actions have the effect the issue needs (some must, some must not) | 1As.01 |
| `share_outcome` | who can finish after a share: both, you, the partner, or neither (exactly one option is "both") | 1Cc.01 |
| `question_fits` | whether a question word and an ending make the question the card asked for | 1Rq.01 |

Three fields are DERIVED by the builder rather than authored, so a claim
about the course is never typed twice: a `pictogram` step with `fromSurvey`
takes its rows from the survey before it; a `contrib` step takes its fallback
record and its `teamStep` index from the team step before it; a `lookback`
step with `scope: "course"` takes its "I learned…" cards from every lesson's
`about` lines and its "I liked…" cards from every lesson's title. The
per-lesson look-back is drawn by `_shell.py` from the lesson's own about lines
and step titles; a lesson that authors its own gets no second.

## Step kinds

| kind | renderer | what the child does |
| --- | --- | --- |
| `demo` | `demo` | presses Next through a drawn scene that changes state |
| `explore` / `context` | `tapCards` | taps cards to hear each; a question can follow |
| `sort` | `sortBins` | one thing at a time into two to six bins, a reason for every verdict |
| `organiser` | `organiser` | the same, into the columns of a graphic organiser that keeps every placed card visible (1Rf.01) |
| `order` | `order` | taps things in the order they happen |
| `askq` | `questionBuilder` | builds a question from a question word and an ending for the thing the card wants to know, and hears it read back (1Rq.01) |
| `source` | `pictureSource` | finds the things in a picture and hears what each tells us; then a question keyed by a spot in the picture (1Ri.01) |
| `survey` | `survey` | asks six classmates in turn, hears each answer, records it into a pictogram that fills as it goes (1Rc.01, 1Rf.01) |
| `pictogram` | `pictogramRead` | answers questions from a pictogram that stays on screen; keys computed (1Ad.01) |
| `know` | `knowBoard` | puts things that are ABOUT the topic on the board, and says one out loud (1Ap.01) |
| `answer` | `relevantAnswer` | picks the answer that is about the question asked; relevance is the tag (1Mi.01) |
| `listen` | `listenAsk` | hears a classmate's talk line by line, then asks a question about what was SAID (1Ml.01) |
| `consequence` | `consequences` | predicts what will happen to them, then sees it happen (1Ac.01) |
| `solve` | `solveIt` | tries an action on an issue and sees what it did; only the action with the needed effect fixes it (1As.01) |
| `sources` | `pickSource` | picks the source that is about the topic, then the reason (1Es.01) |
| `opinion` | `opinion` | states an opinion — never marked — and a reason that has to be about the topic (1Ea.01) |
| `team` | `teamBuild` | shares by arithmetic, responds kindly, sees a friend's contribution; the garden or mural grows one stage per round played well; everything is logged (1Cc.01, 1Ct.01) |
| `contrib` | `contributions` | reads that log: which of these did YOU do, and what did each friend do (1Fc.01, 1Ft.01) |
| `lookback` | `lookBack` | "I learned that…" from the lesson's own about lines, "I liked…" from its own steps (1Fv.01, 1Fl.01) |
| `questions` / `quiz` | `sequence` | the Mathematics build's own, with pictures |
| `overview` … `resources` (shell) | as in Computing | the unit shell |

Scenes: picture backgrounds `market`, `vet`, `park`, `kitchen`, `classroom`,
`street`, `home`, `playground` (the things to find come from the content as
spots, so one background can carry several lessons' sources), and the growing
team scenes `garden` and `mural` (a function of rounds played well, 0 to 6).
The builder reads the scene names and the sound bank out of `gp.js` by name,
so a scene or sound written into a content module that does not exist fails
the build rather than the page.

## Rules that cost something to learn

- **Nothing waits on `requestAnimationFrame`** — a hidden tab never paints,
  and a sim that did froze a step in the Science kit. Timers only.
- **A hand-over disables its buttons** while it waits; a fast child can press
  a third action inside the beat and skip an item otherwise.
- **`show` is looked up by name** in every renderer, so the wrappers the
  pipeline puts around it (header percentage, progress reporting, resume) all
  run.
- **Never name a pipeline tool's filename** in anything that ends up in a
  page; each tool's filename is its idempotence marker.
- **A team step's log is keyed by the step's index** (`window.__gpTeamLogs`),
  and the builder writes that index into the `contrib` step as `teamStep`.
  The first version kept one global log, and with two team steps on one page
  the second one's empty array overwrote the first's at load, so the garden's
  reflection would have read the mural's log. Two team steps per page are
  normal here (Lesson 6 has a garden and a mural).
- **The button's index, not the card's.** `knowBoard` shuffles copies of the
  cards and tags each copy with `k`; the click handler must take the index
  from the button's `data-k`, because the ORIGINAL card carries no `k`. The
  first version pushed `undefined` onto the board and the step never finished.
  Found by the driver, not by reading.
- **Relevance tags are compared as strings**, so an `about` written "Food" and
  a topic written "food" are different topics. Keep them lower-case and exact.
- **A share round has to make exactly one "both".** With `you: 3, need: 1`,
  giving 1 and giving 2 BOTH let both children finish, and the builder
  refuses. Pick `you` and `need` so one share is right.
- **Adding a grade** is a directory with `app.config.json` and `content/`, and
  the same pipeline (`../../mathematics/lesson-app-tools`) run in the same
  order as the Grade 1 README shows.
