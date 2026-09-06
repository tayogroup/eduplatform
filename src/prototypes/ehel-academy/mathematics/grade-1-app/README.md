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
| `*.html` (5 lessons + `g1-index.html`) | the **live** five-lesson course, byte-identical to `app/mathematics/grade-1-preview` |
| `g1v2/` (7 lessons + `g1-index.html`) | the **staged** seven-lesson restructure, byte-identical to `app/mathematics/grade-1-v2` |

The five live lessons sit in the root rather than a subfolder because they are
also `compose-lessons.py`'s **inputs** — the seven are derived from them, so the
tools expect them beside the scripts. Moving them breaks the build.

## How Grade 1 is routed

`app/mathematics/index.html` serves all eight stages and takes the stage as a
query parameter, so there is no per-grade pointer on the CDN to flip. The only
place one grade can be sent elsewhere is `pqpg_ehel_app_base()` in
`local_prequran/progress_gatewaylib.php`, which reads a JSON map from the
`local_prequran/ehel_app_url_overrides` setting. Candidates are host-locked to
`https://ehelacademy.b-cdn.net/`.

Grade 1 points at **grade-1-v2** (the seven). `repoint-grade-1.php` moves it
between the two builds; it reports by default and needs `--apply` to write.
Rolling back is the same setting, and `grade-1-preview` is kept intact and
current precisely so that rollback is complete rather than partial.

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
python check-lessons.py          # structure: badges, finish(), stickers, dangling ids
python check-stage1-coverage.py  # all 36 Cambridge 0096 Stage 1 objectives
node   run-lessons.mjs           # execute each lesson against its original as control

# ship
node   deploy.mjs                # plan; --upload sends the 8 pages + 3 shell modules
python fix-coverage-gaps.py      # the two curriculum fixes already applied to the live five
```

Every patcher after `compose-lessons.py` edits the files in place and assumes
the previous step ran, so a re-derive means running the whole build list in
order from a clean `g1v2/`. Each one is guarded - it skips a file it has already
touched - so a second run is safe but does nothing.

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

## Known limitation

**This path records no progress.** No gradebook, no live-group-board position,
no study plan, no placement exam. Progress shown in the header is computed from
the lesson's own `done[]` and stays in the tab. That is a property of being off
the standard content path, not of the restructure, and it is the open question
for both builds.

Wehel and the class controls are NOT in that list any more - they are mounted
and working. Wehel's daily allowance is server-side and per learner per day, so
it is metered correctly here even though lesson progress is not.
