# Grade 1 Mathematics — the standalone lesson build

Grade 1 Maths does **not** go through `shell/course-app.js` like the other
courses. It is a set of self-contained HTML pages, each carrying its own CSS,
its own activity JS and its own copy of the voice engine, deployed straight to
Bunny and reached by a per-course launch override.

Until this commit none of it was in git — including the five lessons serving
learners. The CDN was the only copy.

## What is where

| | |
| --- | --- |
| `g1v2/` (7 lessons + `g1-index.html`) | the **live** seven-lesson course - what the launch override points Grade 1 at, and byte-identical to `app/mathematics/grade-1-v2` |
| `*.html` (5 lessons + `g1-index.html`) | the superseded five-lesson course, kept as the rollback build. **No longer byte-identical to `app/mathematics/grade-1-preview`** - see below |

The five sit in the root rather than a subfolder because they are
also `compose-lessons.py`'s **inputs** — the seven are derived from them, so the
tools expect them beside the scripts. Moving them breaks the build.

## How Grade 1 is routed

`app/mathematics/index.html` serves all eight stages and takes the stage as a
query parameter, so there is no per-grade pointer on the CDN to flip. The only
place one grade can be sent elsewhere is `pqpg_ehel_app_base()` in
`local_prequran/progress_gatewaylib.php`, which reads a JSON map from the
`local_prequran/ehel_app_url_overrides` setting. Candidates are host-locked to
`https://ehelacademy.b-cdn.net/`.

Grade 1 points at **grade-1-v2** (the seven).
`../lesson-app-tools/repoint-grade.php --grade 1` moves it; it reports by
default and needs `--apply` to write. The per-grade `repoint-grade-1.php` that
lived here is gone - one script now carries every grade, because four copies of
two safety fences is four chances for them to drift apart.

**Rolling back Grade 1 does NOT mean the subject entry.** It means
`grade-1-preview`, the five-lesson build kept complete rather than partial for
exactly this. The shared script prints the override map as it was before the
run, so it restores whatever Grade 1 was on - which is that, not
`app/mathematics/index.html`. That distinction is the one thing the deleted
script knew that the shared one had to be taught.

**The five are one commit ahead of the CDN, deliberately, and cannot be
shipped by anything in this folder.** They carry the contrast fix the seven
carry; `app/mathematics/grade-1-preview` does not. `deploy.mjs` hardcodes
`REMOTE` to `grade-1-v2`, so there is no preview upload path at all - which is
also why the old "kept byte-identical" promise was never enforceable by any
tool here. The alternative was leaving the five defective, and they are
`compose-lessons.py`'s INPUTS: a re-derive would then quietly hand the seven
their failures back. Shipping preview means a `--preview` flag on `deploy.mjs`,
or one line changed by hand; a rollback before then serves the old contrast.

## The tools

```bash
# build, in this order - the patchers are NOT idempotent and each assumes the last
python compose-lessons.py        # derive g1v2/ from the five originals
python build-hub.py              # rebuild g1v2/g1-index.html (7 cards, carries launch params)
python add-header-bars.py        # the two header bars + fix the <h1>s
python add-platform-controls.py  # Class chat, Hand up, Join class, Wehel
python keep-launch-params.py     # carry pwsToken/pwsEndpoint across every in-app link
python preload-platform.py       # modulepreload + preconnect, so the controls are not late

# check
python check-lessons.py              # structure: badges, finish(), stickers, dangling ids
python check-stage1-coverage.py      # slide titles vs the 36 Stage 1 objectives (cheap)
python validate-against-framework.py # the real one: clause by clause, live pages, PDF at run time
python check-answer-keys.py          # every check answer that can be computed
node   run-lessons.mjs               # execute each lesson against its original as control

# ship
node   deploy.mjs                # plan; --upload sends the 8 pages + 3 shell modules
python fix-coverage-gaps.py      # the two curriculum fixes already applied to the live five
```

Every patcher after `compose-lessons.py` edits the files in place and assumes
the previous step ran, so a re-derive means running the whole build list in
order from a clean `g1v2/`. Each one is guarded - it skips a file it has already
touched - so a second run is safe but does nothing.

## What the checks do and do not establish

`validate-against-framework.py` reports **36/36** against the live pages, and
`check-answer-keys.py` computes **23** of the 75 check answers and finds them
right. Both are mutation-tested; a gate nobody has watched fail is not known to
work.

Neither says the teaching is good. Coverage means every objective has a home,
not that the explanation is correct, well pitched, or free of error.

**52 of the 75 check questions cannot be verified by any tool.** "Which shape
has no corners?" has no computable answer, so those are reported as unchecked
rather than counted as passes — coverage that cannot be falsified is not
evidence. A wrong key among them reaches a child in silence. That needs a human
reading, and this build has never had one: English has a reviewed-scripts
workbook process for exactly this and Grade 1 Maths has nothing equivalent.

Three failure modes were found in the validators themselves and every one
under-reported — taught content read as missing, because the extractor took
string literals only, because a lesson's CHECK array belonged to no slide, and
because unplaceable JS blocks were silently dropped. Under-reporting is the
failure that looks responsible. The number is worth exactly what the mutation
test behind it is worth.

## Things that will bite

- **`finish(i)` is the slide's 0-based index**, and `done[i]` drives both the dot
  rail and the sticker shelf. Reordering or removing a slide means renumbering
  every `finish()` in its block and reordering `STICKERS` to match. The composer
  does this; hand edits must too.
- **The JS section markers `/* ---- N: title ---- */` are activity counters, not
  slide numbers.** `up-to-twenty.html` has two `2:` and two `14:`. Map blocks to
  slides by the element ids they touch (`anatomy.py` does, and asserts it).
- **The lesson script is wrapped in an IIFE.** Appending before `</script>` lands
  outside the closure and `slides`/`done`/`show` are out of scope.
- **The palette is dark: `--ink` is `#FFFFFF`.** A "dark pill with white text"
  renders white-on-white. Header controls use `--teal` with `#06231F`.
- **An inline style beats every stylesheet, and this code sets them.** The class
  controls do `button.style.background = "white"` from when the shell was always
  light. Adding CSS to fix their contrast changed nothing until that literal
  became `var(--card, #fff)`. Check `getAttribute("style")` before concluding a
  rule is being overridden by another rule.
- **The launch parameters must survive EVERY hop.** `mountHandRaise` opens with
  `if (!actions || !launchToken || !launchEndpoint || …) return;` so a page
  reached without `?pwsToken` and `?pwsEndpoint` silently mounts nothing - no
  Class chat, no Hand up, no Wehel. The lesson picker carried `location.search`
  and the back arrow and brand logo did not, so pressing Back made all three
  disappear for the rest of the session. `keep-launch-params.py` now carries them
  on every in-app link; do not add a link that hardcodes a bare `href`.
- **Check arrays are not portable between lessons.** `up-to-twenty` writes
  `pic: 7` (a counter count), `shapes-and-sizes` writes `pic: '<svg…>'`,
  `what-comes-next` writes `beads: […]`, each with its own renderer. A slide
  moved across files arrives with no check coverage — which is why every
  composed lesson draws from exactly one base file.

## The platform controls

Class chat, Hand up, Join class and Wehel are mounted, and none of them is
reimplemented here. The pages import the SAME modules the shell mounts,
deployed beside them by `deploy.mjs` with imports flattened to `./x.js`:

| module | entry point |
| --- | --- |
| `learner-controls.js` | `mountLearnerControls()` - Class chat, Hand up, Join class |
| `wehel.js` | `mountWehelChat()` - the tutor |
| `course-shell.js` | `escapeHtml` |

`learner-controls.js` was lifted out of `course-app.js` for this. Its own
comment explains why it could not simply be copied: both controls are
SINGLETONS owning polling state and an unread dot, so two copies in one page
poll twice and disagree about whether a hand is up. Two pages each holding one
copy are separate documents and cannot see each other, which is why deploying
the file beside the lessons is a copy of the source rather than a second
implementation.

**Where the buttons go is not decided here.** `placeLearnerControls()` prepends
into `.top-actions`, so bar 2 carries that class and they land before Full
screen - the order English already shows.

**What you will and will not see.** Hand up and Class chat mount only when the
server answers `watched` - this learner is in an active class group with a
teacher on it - and Join class only while a session is live. Outside a live
class, hidden is correct, not broken. Wehel appears for every learner, so it is
the honest test that the wiring works.

## Progress: it reports now, and what it reports is not the course's units

**Closed 2026-09-07.** This path used to record nothing at all -- no gradebook,
no live-group-board position, no study plan -- so a teacher opening the board
mid-session saw their Grade 1 maths learners with no app activity, not because
they were idle but because the build said nothing. The board's whole sort is
"time since this learner's app last reported", so a silent build renders its
learners as GONE.

`../lesson-app-tools/wire-progress.py` wired it, and nothing about it is new
machinery: the pages import the SAME `shared/progress-client.js` every other
course writes through, deployed beside them by `deploy.mjs`, and emit
`section.completed`, `unit.completed` and `progress.summary`. Position is
flushed rather than left to the 20-second idle timer, for the reason
course-app.js learned on production -- a learner moved through a unit for 14
minutes while the server's pointer sat on the section they had last COMPLETED.

Verified end to end on 2026-09-07 against the live build with a real launch
token: `hydrate()` returned `l01 { sectionsDone: ["step-01"], resume:
"step-01", resumeLabel: "Count to 10", xp: 1 }`.

**THE UNIT PROBLEM, and it is the thing to read before changing any of this.**
These seven lessons are not the course's fifteen units. The shell course for
Grade 1 is fifteen term-ordered units (`math-g01-u01` "Numbers to 10" ...);
these lessons are organised by strand and each covers several. So progress is
written under its own unit namespace, `l01`..`l07`, beneath the SAME course key
(`ehel-math-g01`) and student id the shell uses.

What that buys: the live group board works -- timestamps, position,
resumeLabel, done-counts, the activity ring -- and resume across devices works.
What it does not: the gradebook does not see fifteen units' worth of
completion, because these seven lessons are not those fifteen units. Emitting
`u01` would have been a claim about curriculum coverage nobody measured.

Mapping lessons onto course units is a curriculum decision, not a wiring one.
When somebody makes it, it is one function in wire-progress.py and nothing
else.

The same hydrate showed `u01`, `u02` and `u09` already present for that learner
from their shell-course work, sitting alongside `l01` without collision --
which is the namespace decision demonstrating itself.

Wehel and the class controls are mounted and working; Wehel's daily allowance
is server-side and per learner per day, so it is metered correctly here.
