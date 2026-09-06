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

Currently Grade 1 points at **grade-1-preview** (the five). `repoint-grade-1.php`
is a CLI script that moves it to `grade-1-v2`; it reports by default and needs
`--apply` to write. Rolling back is the same setting.

## The tools

```bash
python compose-lessons.py        # derive g1v2/ from the five originals
python build-hub.py              # rebuild g1v2/g1-index.html (7 cards)
python add-header-bars.py        # add the two header bars + fix the <h1>s
python check-lessons.py          # structure: badges, finish(), stickers, dangling ids
python check-stage1-coverage.py  # all 36 Cambridge 0096 Stage 1 objectives
node   run-lessons.mjs           # execute each lesson against its original as control
node   deploy.mjs                # plan; --upload to send to grade-1-v2
python fix-coverage-gaps.py      # the two curriculum fixes already applied to the live five
```

`compose-lessons.py` and `add-header-bars.py` are **not idempotent** — they
rewrite `g1v2/` from the originals, so run them in that order from a clean
`g1v2/` if you re-derive.

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
- **Check arrays are not portable between lessons.** `up-to-twenty` writes
  `pic: 7` (a counter count), `shapes-and-sizes` writes `pic: '<svg…>'`,
  `what-comes-next` writes `beads: […]`, each with its own renderer. A slide
  moved across files arrives with no check coverage — which is why every
  composed lesson draws from exactly one base file.

## What the header bars deliberately omit

`add-header-bars.py` builds brand, lesson progress, lesson picker, voice toggle,
back, Menu, lesson name and Full screen. It does **not** build Join class, Class
chat, Hand up or XP. Those need the signed launch token and the platform
endpoints, which this standalone build has neither of, and `course-app.js`
mounts Hand up only when the server confirms a teacher is watching — precisely
so a child cannot press a control that reaches nobody and then wait instead of
asking for help.

## Known limitation

**This path records no progress.** No gradebook, no live-group-board position,
no Wehel, no study plan, no placement exam. Progress shown in the header is
computed from the lesson's own `done[]` and stays in the tab. That is a property
of being off the standard content path, not of the restructure, and it is the
open question for both builds.
