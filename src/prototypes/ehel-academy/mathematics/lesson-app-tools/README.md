# Standalone lesson-build tools

One set of tools for every standalone lesson build — pages that carry their own
CSS, activity JS and voice engine and do **not** go through
`shell/course-app.js`. Currently that is `../grade-1-app` (live) and
`../grade-2-app` (not deployed).

Each build describes itself in `app.config.json` beside its lessons; no tool
here hardcodes a directory or a lesson list. That is the whole reason these
exist: the Grade 1 originals were correct and grade-agnostic in every respect
except two lines each — `os.path.join(SP, "g1v2")` and a literal list of seven
filenames — and those two lines were enough to make them single-use.

```bash
cd ../grade-2-app

python ../lesson-app-tools/wire-navigation.py         # hub links, a way back, launch params
python ../lesson-app-tools/wire-platform-controls.py  # Class chat, Hand up, Join class, Wehel
python ../lesson-app-tools/preload-platform.py        # modulepreload + preconnect
python ../lesson-app-tools/check-lessons.py           # the gate
node   ../lesson-app-tools/deploy.mjs --app .         # plan; --upload writes
```

**Run them in that order.** Each is idempotent and each refuses rather than
half-working, but the order is not cosmetic:

- `wire-platform-controls.py` refuses outright until navigation is wired.
  `mountHandRaise` and `mountClassChat` open with a guard on `launchToken` and
  `launchEndpoint`, so on a page that drops the launch parameters they mount
  **nothing** — no error, no console warning, just absence. Grade 1 shipped
  that and it was reported as "Class chat and Hand up are not displaying
  consistently"; the inconsistency was navigational, not intermittent.
- `preload-platform.py` refuses on a page with no imports, because preloading
  three modules nothing imports is a download nobody uses.

## `app.config.json`

```json
{ "grade": 2, "gradeLabel": "Grade 2",
  "subject": "mathematics", "subjectLabel": "Mathematics",
  "fromParam": "g2", "backLabel": "Grade 2 Maths",
  "hub": "g2-index.html",
  "remote": "Ehel Primary/app/mathematics/grade-2-lessons",
  "lessons": [ { "file": "…html", "title": "…" } ] }
```

**Order in `lessons` IS the unit number** — unit N is `lessons[N-1]` — so a
lesson's index is not a second fact that can drift from the one in the hub.
`_app.py` refuses to load a config naming a file that is not there, because
otherwise a tool reports "all 9 wired" having quietly done eight.

## The gate, and the mutation that found a bug in it

`check-lessons.py` asserts what this pipeline guarantees, and every assertion
is something that has actually been wrong in one of these builds. It was
mutation-tested six ways — a dropped carry marker, a hub card pointing at a
missing file, a removed `.top-actions`, a dropped import, a dropped preload, a
wrong unit number — and **one of the six survived the first version.**

Deleting `import { escapeHtml } from "./course-shell.js"` left the gate green,
because the check tested for the substring `"./course-shell.js"` and the
`<link rel="modulepreload" href="./course-shell.js">` added by the previous
step contains it. A true fact about the wrong property. It now tests for
`from "./x.js"`, and the mutation fails as it should.

## What these tools do NOT do

- **Design.** `wire-platform-controls.py` gives the hero a `.top-actions`
  container because `placeLearnerControls()` prepends into one. It does not
  port Grade 1's two-bar header; that is a design change, not a contract.
- **Route a learner anywhere.** The launch override
  (`local_prequran/ehel_app_url_overrides`, read by `pqpg_ehel_app_base()`) is
  a Moodle setting reached through the staged-script + cPanel loop. Uploading
  a build makes it reachable by URL and by nobody's course.
- **Record progress.** No gradebook, no live-group-board position, no study
  plan, no placement exam. That is a property of being off the standard content
  path and it is true of every build here — see `../grade-1-app/README.md`.

## Grade 1 has not been migrated onto these

Its five tools still sit in `../grade-1-app` and still work. They are the
record of how `g1v2` was composed, and two of them (`compose-lessons.py`,
`build-hub.py`) are genuinely Grade-1-specific rather than merely hardcoded.
Moving the other three is a safe, unforced change on a **live** build; it is
worth doing next time that build is touched, not for its own sake.
