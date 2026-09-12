<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

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

### The daily allowance: minutes of Wehel per learner per day (2026-08-28)

Owner decision. Wehel is capped per learner per DAY, by how old the learner is:

| grade | 1-2 | 3-4 | 5-6 | 7-8 | 9 and above |
| --- | --- | --- | --- | --- | --- |
| minutes | 10 | 15 | 20 | 25 | 30 |

Two exceptions, both decided at the same time and both for reasons the grade
number cannot carry:

- **Intensive English is off that table entirely** — 30 minutes at Levels 1-2,
  an hour above. It sends its CEFR LEVEL as `grade` (`grade: levelNumber` in
  `shell/subjects/intensive-english.js`), so reading it as a school year hands
  an adult beginner a Grade 1 allowance. This is the trap to know before
  touching the bands: the field is called grade in the payload and is not one
  for one of the six subjects.
- **A tutoring-support learner gets DOUBLE** whatever their course allows
  (20/30/40/50/60, and 60/120 in Intensive English). They are paying for the
  tutor rather than getting it beside a lesson.

**Minutes are wall-clock time between the learner's own requests, derived
server-side from timestamps — never from anything the client reports.** Each
request charges the gap since that learner's previous one, capped at
`WEHEL_IDLE_GAP_SECONDS` (60); the first request of the day charges nothing. So
an unbroken conversation costs exactly as long as it lasts, a learner who walks
away with the tab open is charged one minute for the pause rather than the
afternoon, and the four-round tool loop — which re-posts the same conversation —
costs the seconds it actually takes instead of four turns' worth. The ledger is
a user preference (`local_hubredirect_wehel_time`, `"YYYYMMDD|used|last"`), the
same shape and for the same reasons as the attachment one beside it: no schema,
survives sessions, resets itself at midnight.

**The gap cap is what lets the on-screen timer be honest.** The panel shows the
server's own count plus the seconds since the question was sent, capped by the
same number — so the client is doing the server's arithmetic on the server's
data, not keeping a second clock that could disagree with it. Change the cap in
one file and the timer starts lying in one direction or the other; the contract
gate holds all three copies equal for exactly that reason.

**Four specs, three files, one string each.** `WEHEL_DAILY_BANDS`,
`WEHEL_INTENSIVE_BANDS`, `WEHEL_TUTORING_MULTIPLIER` and
`WEHEL_IDLE_GAP_SECONDS` live in `shell/wehel.js`, `wehel_chat.php` and
`tools/lib/wehel-dev-chat.js`. The bands are **strings** (`"2:10,4:15,6:20,8:25,99:30"`,
read as "up to grade 2, 10 minutes") precisely so the three can be compared: a
table written three times in three languages cannot be, one string parsed three
ways can. `check:wehel-contract` compares the specs AND resolves the owner's
table for every grade, because a parser that keeps the string and misreads it
would pass the first check alone.

**The timer survives a page load.** The panel caches the server's last reading
in `localStorage` under the day it was read (`wehel-time-v1`), so a learner who
opens a second subject or comes back after lunch is not shown a full allowance
until their next question corrects it — a timer that resets on every page load
is not a timer. It is a cache of the server's answer and never a second
authority: the server charges and refuses whatever it says, a cleared cache
costs the learner nothing, and a ledger dated yesterday is discarded rather than
carried, because the server resets at midnight too.

**Percentage is displayed; tokens are MEASURED, not converted (2026-08-28).**
Asked for "the allocated time converted to tokens and percentage used
displayed". Half of that holds and half does not, and the half that does not is
worth knowing before anyone tries again:

- **Minutes and tokens do not convert.** Measured across all 410 units, one
  question carries a median ~21k input tokens (p90 31k, max 48k) — the unit
  JSON. So a day's cost is driven by how many QUESTIONS are asked, not by how
  long the learner sits there: the same ten minutes is four questions for a
  slow reader and twenty for a quick one, a 5× spread on one allowance. Any
  minutes→tokens ratio is a guess that is wrong per learner in both directions,
  which is why nothing here derives one and the gate fails a client that tries.
- **Because the unit prompt is cached, RAW tokens are a question counter in
  disguise** — roughly 21k per question whatever was asked. The figure that
  carries meaning is cost-weighted, so both are recorded: `tokens` (everything
  the exchange moved) and `weighted` (the same exchange in equivalent
  fresh-input tokens — a cache read is a tenth of one, a cache write 1.25,
  output five times one).
- **The measurement is free and was already on the wire.** The Messages API
  returns `usage` in the reply `wehel_chat.php` already parses, and nothing
  read it. No extra call, no estimate.
- **The cost-weighted figure now CAPS the day too** (owner, 2026-08-28), and it
  is DERIVED from the minutes rather than listed: `WEHEL_WEIGHTED_TOKENS_PER_MINUTE`
  (50,000) times the allowance, so there is no second table, and the tutoring
  doubling and the Intensive English bands carry through for free. The ledger
  holds both figures (`YYYYMMDD|used|last|tokens|weighted`).

  **It is a BACKSTOP, not a second product limit, and the gate enforces that.**
  The minutes are what a learner feels and watches counting down; this exists so
  a runaway day — a stuck client, an unlucky loop, a learner opening unit after
  unit — cannot cost unbounded money. The rate comes from the measurement above:
  ~50k weighted for each new unit opened, ~6k per question after it, so a Grade
  1's ten minutes buys about ten fresh units or a hundred follow-ups. A floor in
  the gate fails the build if the ceiling is ever tightened to where an ordinary
  day would hit it — and that floor is not decoration: dropping the rate in all
  three files at once is invisible to the mirror check, and the floor is the only
  thing that catches it (mutation-tested, both ways).

  It refuses with its own code, `token-limit`, never the clock's: telling a
  learner their time is up while a visible timer says otherwise is a lie they
  can see. The panel closes with its own wording, and — the part the gate could
  not reach — **the ticking clock has to trigger that repaint too.** Testing
  only `left <= 0` left a spent budget showing "That is all for today" on the
  chip above a composer that still accepted questions the endpoint could only
  refuse. The gate checks the ledger flag; only opening the page found the
  panel. Checked against the ceiling ALREADY spent, not including the current
  request, whose usage does not exist until the API answers — so the request
  that crosses the line is served and the next is refused, which is the right
  way round for a backstop.

On screen the learner sees the clock and the share of the day gone —
`15:58 left · 36% used` — with the chip itself as the bar (`--w-used` is the
fill, so the percentage and the bar are one number and cannot disagree).

**From Grade 7 up the token count joins them on the chip's face**
(`19:59 left · 20% used · 78.5k tokens`); below that it stays in the title.
Owner, 2026-08-28. A percentage of time is something a Grade 1 can read off a
bar; a token count is a number about our API bill rather than about their
lesson. `WEHEL_TOKENS_ON_CHIP_FROM_GRADE` and `wehelShowsTokenCount` are
client-only — the server sends the count to everyone either way — so there is
nothing to mirror and no server behaviour hangs on it.

**Intensive English is excluded at every level, and that is the same trap as
the bands.** It sends its CEFR LEVEL as the grade, so `grade >= 7` cannot mean
"an older learner" there; a Level 5 adult would be compared against a number
that means something else entirely. The exclusion is explicit in
`wehelShowsTokenCount` rather than left to arithmetic, and the gate asserts it
at levels 1, 5 and 7. Note the consequence before changing it: no Intensive
English learner sees the count on the chip, even though that course is already
treated as adult for the allowance itself. That is the literal reading of "from
Grade 7", not an oversight — widening it is one clause, and a decision.

**The ledger is written TWICE per question and the two are not
interchangeable**: the clock before the API call (so a refused or failed
question still costs the time it took) and the token totals after it (they do
not exist until the API answers). The gate names each by the field that differs
between them, because a rule matching "the ledger is written somewhere" is
satisfied by either one while the other is gone — mutation-tested, and the
loose version passed a deleted clock write.

**A spent allowance is refused with a CODE, not a bare 429**, and this is the
one piece of prior art that had to be respected: the 20/min rate limit was
switched off in 2026-08 because the panel renders an uncoded 429 as the same
"Wehel could not be reached" bubble as a real outage, so a cap read as a
breakage. `code: "time-limit"` is answered as an ordinary reply from the tutor,
the retry is skipped (a retry is a second request, and a second request charges
a second gap), and the compose row is replaced by a sentence saying when Wehel
comes back rather than a disabled input with no explanation.

Mutation-tested twenty-one ways — every spec drifting in either server, a renamed
define the gate can no longer read, an off-by-one band parser, a spec that
parses to nothing, a timer that ignores the gap cap, a percentage computed off
the server's stale figure instead of the ticking clock, a client that invents a
token count from the minutes or stops reading the ledger back or starts
retrying, either server dropping the usage measurement, and each half of the PHP
ledger torn out — all caught, and the gate passes again on restore. Four
mutations had to be REWRITTEN before they meant anything: three replaced only
the first of two occurrences and one was a no-op that evaluated identically, so
each "survived" a gate that was in fact fine. **A mutation that survives is a
claim about the gate and about the mutation, and the mutation is the cheaper
thing to be wrong about — check it first.**

**And the harness itself failed in the way this file keeps documenting: it
reported everything as caught while doing no work.** It read each file at the
top of its own iteration and treated that as the original, which is correct
only while every restore succeeds. One restore did not land, that mutated file
silently became the next iteration's baseline, and from there every mutation
was applied to — and "restored" to — a broken tree. It printed `ok` twelve
times in a row and left two files mutated on disk, including `wehel_chat.php`
with a renamed define.

Two tells, both cheap: **every failure line was IDENTICAL** (a real suite fails
for a different reason each time — 22 distinct messages across 24 mutations
once fixed), and the run ended saying the tree was still mutated rather than
being believed on its ticks. The rebuilt harness snapshots every file ONCE up
front, verifies each restore against that snapshot and aborts if one does not
land, and refuses to start if the gate is already red. A harness that cannot
prove it put the tree back is not evidence about anything it printed.

**One blind spot is recorded in the gate itself rather than papered over**: the PHP half is checked
by reading source, so dead code reads as live code — wrapping the ledger write
in `if (false)` leaves every pattern matching and the allowance unenforced.
Nothing short of running the PHP against a Moodle catches that, and the pure
functions that could be tested that way are not where the enforcement lives.
The client half IS behavioural (its functions are imported and run), which is
why the timer's arithmetic is exercised rather than matched.

Two things this does NOT cover, both worth knowing before assuming a learner is
capped:

- **An unidentifiable caller is not charged**, exactly as `pqh_api_rate_limit_ok`
  does not rate-limit one. Every learner resolves — the launch token names one
  and a session names one — so in practice this is the configured shared
  `ws_token`, an operator credential rather than a child.
- **`wehel_speak.php` and `wehel_listen.php` are not metered.** A voice question
  goes through `wehel_chat.php` like any other, so voice tutoring is charged;
  the TTS of a reply and the transcription of a question are not separately
  billed against the clock, because they belong to a turn that already was.

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
omission.** It authors no `grade-capstone.json`: Unit 10 IS its capstone and is
already indexed as a unit, so a capstone topic there would be a second card
leading to content the index already describes. Global Perspectives and
Intensive English author no capstone at all. If a `grade-capstone.json` is ever
written for English, `capstoneTopics` picks it up with no change. (This
paragraph used to describe the row as "a DOOR rather than a project, showing
Unit 10's own launch page". The row has changed -- see the section below -- and
this conclusion has not.)

### English's `capstone` row is now the UNIT's recap, "What I learned" (2026-08-31)

Owner decision, and it REPLACES the row's previous job rather than adding to it.
The row was added on 2026-08-27 as a door to the grade's Unit 10 project, drawn
in every unit -- and `renderCapstone` read only the manifest and the unit gate,
so a learner standing in Unit 3 opened "Capstone project" and met four bullets
about Unit 10 under "This opens when you reach Unit 10". Nothing on it was about
Unit 3. The owner's intention for the row had always been a summary of what the
unit taught.

`renderUnitRecap` (`shell/subjects/english.js`) draws that: the unit's outcomes,
the taught vocabulary groups and how many of their words are known, the grammar
titles, the reading titles, and which countable sections carry a tick. All of it
is READ from the unit JSON, so a content fix reaches the page with no edit in the
shell.

Four things to know before touching it:

- **An unanswered outcome is left unmarked, and the page says so.** The only
  per-outcome signal a learner has actually given is the self-assessment from My
  progress (`progress.self`, keyed by selfAssessmentId, tied to an outcome by
  `outcomeId`), so that is what is shown -- four marks for four claims, one per
  point of the authored scale plus a dashed circle for "not asked yet". The
  tempting alternative is to infer a tick from the sections finished, and
  `evidenceOfLearning` is prose ("Word Wall ticked for all twelve months, and
  the Activity 1 month order completed correctly"); parsing it would put a
  confident claim on a child's page about something nobody measured. Same rule
  the group board's activity ring keeps.
- **Two "at a glance" panels, two different word counts, and that is correct.**
  The Overview's panel prints `course.dictionaryLinks.length` -- the unit's whole
  word list including the story glossary, 158 in Grade 3 Unit 3 -- and the recap
  counts `taughtWords()`, the 31 that Core words asks the learner to know and
  gates on. So the recap's panel is called "How far you have got", its three
  figures are all about the LEARNER, and its words figure names its own section
  rather than saying a bare "words". Do not "reconcile" them by making one read
  the other; they answer different questions.
- **The grade project keeps its route.** `capstoneDoorPanel()` is the old page's
  content as a panel at the foot of the right column, in three states -- in it,
  open, locked -- and the locked one carries no button, because a control that
  cannot go anywhere reads as the lock being broken. It is the only thing on the
  page that consults the unit gate.
- **The `capstone` clause in `sectionUnlocked` is GONE, not moved.** The row used
  to lock until the learner reached Unit 10 (owner, 2026-08-27, so a child could
  see the year coming without jumping to it); the page now describes the unit the
  learner is standing in, so it is open exactly when that unit is. No clause was
  needed for that: `capstone` is absent from `SECTION_CHAIN`, `indexOf` answers
  -1, and the existing `index <= 0` line reads that as "not a step" and opens it.
  The `if (id === "capstone") return renderCapstone()` guard in
  `renderLockedSection` became unreachable with it and is deleted rather than
  left to look load-bearing.

The route id stays `capstone` -- the nav, the progress store, get-help's section
search and course-app's `TUTORING_HIDDEN` all speak it, so renaming it would be a
migration rather than a label change. It is still `nonCountable` and still absent
from `SECTION_CHAIN`: a row in all ten units that summarises rather than teaches
cannot decide whether any of them is finished.

**Tutoring learners still do not see it**, because `capstone` is in
`TUTORING_HIDDEN` (`shell/course-app.js`), which is shared by all six subjects
and where the other five still mean a whole-stage project. That is unchanged and
untouched here -- a decision waiting to be asked, not an oversight.

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

## The Ehel Academy shell keeps TWO progress stores per learner, and only one drives the UI

Shared across all six subjects (`shell/course-app.js` + `shared/progress-client.js`), found while seeding `localStorage` in the browser to test a completion-card wording change and finding more keys than expected.

- **`config.keys(grade, unit).progress`** — a per-subject, per-UNIT key (English: `ehel-english-g{g}-u{u}-progress-v1`). Holds the `progress` object directly: `completed` (the array everything gates on), `knownWords`, `self`, `writing`, `games`. Written by `saveProgress()` on every completion action. **This is the only store anything reads.** Nav ticks, `sectionUnlocked()`, the unit gate, the progress bar %, and the "Next up" / "Go back to" completion card all read `progress.completed` from this key alone. To reproduce a progress state for testing, seed THIS key and reload the page (a hash-only `location.href` change is a same-document navigation and will not re-read it — use `location.reload()` or a fresh tab).
- **`ehel-progress:{course}:{student}`** (`shared/progress-client.js`) — one key per COURSE (English: `ehel-eng-g{gg}`, `student` from `?studentid=` or `"local"`), holding the P1.4 Progress Event Contract's reduced document: `{course, student, stateVersion, units: {u01: {sectionsDone, resume, checkpoints, xp, knownWords}, ...}}`. Populated by reducing `emitProgress()` events (`section.completed`, `unit.completed`, `progress.summary`, ...) through `applyEvent()`. `saveProgress()` calls `emitProgressSummary()`, so both stores are written together on every save — but they are shaped differently and keyed at different granularity, so they are never byte-comparable.

**The second store is write-only in local-dev and in a plain student launch.** `hydrateRemoteResume()` (`course-app.js`) reads it back to seed `progress.completed` — but it opens with `if (progressWS.backend !== "remote") return`, and the backend is `"remote"` only when the launch URL carries `pwsEndpoint`/`pwsToken` (the school's actual production launch path through Moodle). Without a launch token — which is every local-dev session and every console experiment — the backend is `"local"`, so `ehel-progress:{course}:{student}` accumulates a faithful mirror of every event ever emitted and nothing in the app ever reads it back. Writing to it does nothing observable; a UI change has to go through the per-unit key.

A third key, `ehel-progress-outbox:{course}:{student}`, exists only for the remote backend (durable events queue there until a POST to `/progress/ingest` succeeds; the local backend applies events straight into its document instead). Irrelevant to local testing for the same reason.

## The progress client failed silently in FIVE ways, and every one was live (2026-08-29)

`shared/progress-client.js` is the write path for all six subjects. Its
top-level rule is right — **never break the lesson** — and its implementation
read that as *say nothing*, including when the thing to say was that a child's
work was not reaching the school.

None of these were new. They surfaced together because the live group board is
the first consumer that needs a position report PROMPTLY, so making navigation
flush finally pressed paths that had never been pressed. Eleven releases
(v317-v327) went out in a day; one carried the features and ten carried these.

| fault | what a learner saw | fix |
| --- | --- | --- |
| `flush()` coalesced onto an in-flight promise | events queued during a POST were never sent | `followUp` re-flushes after it settles |
| a 401 threw and requeued for ever | app works, nothing reports, board says GONE | `authLost`: stop retrying, tell them once |
| `sendBeacon` returning false was ignored while the outbox was cleared | a refused beacon on tab-hide DELETED unsent work | honour the return, keep the queue |
| no timeout on `fetch` | one stalled request wedged `flushing` for ever — ONE attempt, then silence for the session | `AbortController` at 15s, on persist AND hydrate |
| **the flush lock was set after the code that clears it** | exactly two updates, then silence until reload | clear from `.then()`, and never take the lock for an empty queue |

**The last one is a JavaScript semantics trap and the most valuable line here.**
It was written as

```js
flushing = (async () => {
  const batch = loadOutbox();
  if (!batch.length) return { accepted: 0, ok: true };   // no await on this path
  try { … } finally { flushing = null; }
})();
```

An async body runs **synchronously to its first `await`**, and the empty path
has none — so the body completed and `flushing = null` fired BEFORE the
assignment stored the settled promise. Every later flush hit
`if (flushing) return flushing`, sent nothing, and the `.then()` that would have
retried had already run.

Always exactly two updates: two navigations flush and clear normally, then the
20s idle timer fires on the outbox they just drained, takes the empty path, and
wedges the client. **Moving the empty check inside the `try` does NOT fix it** —
tried, still two — because the path is still synchronous.

### `keepalive: true` is why ad blockers ate the writes

Not the path. The measurement, same URL, same tab, seconds apart:

```
plain fetch                  POST …/progress/save   401
the app's fetch (keepalive)  POST …/progress/save   ERR_BLOCKED_BY_CLIENT
```

`keepalive` marks a request beacon-type — the shape analytics SDKs use to
exfiltrate on unload — so ad-block engines refuse it **by request type**,
whatever the URL says. Renaming `/progress/ingest` to `/progress/save` (v322)
therefore changed nothing; the gateway accepts both for ever because
already-open tabs still post to the old one, but it was not the fix. `keepalive`
bought nothing either: it exists to outlive a page, and the unload case is the
sendBeacon branch.

**ERR_BLOCKED_BY_CLIENT is invisible server-side.** No request, no access-log
line, no status code. Every server-side check will report the stored data as
correct, because the writes never arrived to be wrong. That cost most of a day
of chasing a reporting chain that was fine throughout.

**It needed no domain change.** A cross-site POST from `ehelacademy.b-cdn.net`
to `ehelacademy.org` reaches the server normally — proved by the plain fetch
getting its 401. Do not move the app onto the Moodle domain or proxy the gateway
through the CDN for this reason.

### The durable half: say it out loud, on the learner's screen

`onDeliveryFailing` fires after **three** consecutive failed flushes — not one, a
single failure is a phone changing cells and alarming a child mid-lesson is its
own harm. Reported once, cleared on recovery, queue never touched.

**Offline gets its own sentence.** A learner on a train has lost nothing; one
whose extension is eating the writes needs to know the school cannot see their
work. Identical to the code, opposite to a family.

**The board deliberately says nothing.** A server receiving nothing cannot tell a
blocked learner from a closed tab, so a tile claiming "unreported" would be a
claim with no evidence behind it — the detection would have to travel the path
that is broken. The learner's screen is the only honest place.

### Two testing rules this bought the hard way

- **A control derived from the thing under test is not a control.** The first
  test of the wedge fix built its "before" fixture by string-patching the
  CURRENT file, which already had the fix, so it compared two fixed versions and
  reported 5 and 5. Take the fixture from `git show HEAD:<path>` — the bytes
  actually shipped.
- **Three of the fixes were wrong and only tests caught them**: the path rename,
  the empty-check move, and that test. Each was obvious, reasoned, and would
  have shipped on argument alone.

### `resume` and `resumeLabel`: the tile must speak the learner's vocabulary

`resume` had been declared in the progress contract, honoured by `apply_event`
and returned by `public_state()` since it was written, and **nothing had ever
emitted it** — dead plumbing, null on every row. The shell now sends it on
navigation.

`resumeLabel` rides beside it because the route id is not what the learner sees:
English's `dictionary` is captioned **Vocabulary**, `lecture` is "Video lesson",
`teacherguide` is "Teacher & Parent Guide". A tile printing the id names a
section the teacher cannot find, so a CORRECT position reads as a stuck board —
which cost three false investigations before anyone checked what the child's own
screen called it.

**The trap for the next person: english.js has TWO section lists.** The one
`config.sections` passes is an array of ARRAYS — `["dictionary", "book-a",
"Vocabulary"]`, with an optional fourth availability predicate — and all six
subjects use that shape. Near the bottom of the same file is a list of nav CARDS
which are OBJECTS (`{ route, title, blurb }`). Reading the object list and
writing `entry.route`/`entry.title` matched nothing, returned `""` for every
route, and shipped a field that was never once sent across four releases —
while the server reported `resumeLabel: null` the whole time and that was read
as a stale bundle. `sectionLabelOf` now accepts both shapes.

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

### The shell's learner controls are a module now, and the deploy scan had a hole

`shell/learner-controls.js` (2026-09-07) holds `placeLearnerControls`,
`mountHandRaise` and `mountClassChat` — the last of which carries Join class,
the screenshot capture, the polling and the unread dot. They were 693 lines
inside `course-app.js`; the standalone Grade 1 Maths lesson pages needed them,
and that file's own comment forbids the obvious answer: **"MOVED, never cloned.
Both controls are singletons that own polling state and an unread dot; a second
copy would poll twice and disagree with itself about whether a hand is up."**

`course-app.js` imports it and destructures `placeLearnerControls` back out,
because `mountDeck()` rebuilds `.gc-top` with `innerHTML` and a button parented
there is destroyed by the next mount. The boundary was small — the region took
seven names from `course-app` scope and nothing else — and `HAND_ENDPOINT` /
`CHAT_ENDPOINT` stay assigned from `platformUrl()` at module top level, because
that is the shape `check-platform-cors.mjs` parses to discover endpoints. It
globs `shell/*.js`, so the new file is scanned and the gate still probes all
nine.

**The move exposed a real hole in `deploy-app-version.js`, and it is the
interesting half.** `shellComponents()` derived which shell siblings to bundle
into `v{TAG}/` by reading the SUBJECT module's imports. That was complete only
by accident: `course-app.js` had never imported a shell sibling that some
subject module did not also import (`wehel.js`). `learner-controls.js` is the
first it imports **alone**, so a release would have shipped an entry module
importing a file absent from the version path — a 404 on `course-app.js`'s own
import, every subject dead at boot, and no console error the app can show. It
now scans both, with the right base for each: `./x.js` means `shell/subjects/`
from a subject module and `shell/` from `course-app.js`. Concatenating the two
sources sends `course-app`'s siblings to the wrong directory, which was the
first attempt.

Caught by `--plan-json`, not by a gate: the release plan simply did not list the
file. **A new `shell/` sibling is worth one `--plan-json` before it ships.**

**An inline style beats every stylesheet, and these controls set them.** The
buttons do `button.style.background = "white"`, hardcoded from when the shell
was always light, so they render white-on-white on any dark host — the Grade 1
pages, and the shell's own topbar case (`placeLearnerControls({toTopbar:true})`,
on leaving a deck), where the `.gc-top .in-deck-header` rule does not apply. The
module now carries its own baseline the way `wehel.js` carries `PANEL_STYLE`,
and the literal is `var(--card, #fff)`. `course-ui.css` defines no `--card`, so
the shell falls back to white and is unchanged. Adding CSS alone fixed nothing
and was deployed before that was noticed — **read `getAttribute("style")` before
concluding one rule is losing to another.**

