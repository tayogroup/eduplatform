# Grade 2 Mathematics — the standalone lesson build

Nine self-contained lesson pages plus a hub, on the same model as
`../grade-1-app`: each carries its own CSS, its own activity JS and its own
copy of the voice engine, and none of it goes through `shell/course-app.js`.

Built by the shared tools in `../lesson-app-tools`, which read
`app.config.json` beside these files. **Order in that config IS the unit
number.**

```bash
python ../lesson-app-tools/check-lessons.py       # the gate
node   ../lesson-app-tools/deploy.mjs --app .     # plan; --upload writes
```

## Status: wired, gated, NOT deployed and NOT routed

| | grade-1-v2 (live) | here |
| --- | --- | --- |
| deck, `finish()`, stickers | ✓ | ✓ |
| design template + ink tokens | ✓ | ✓ |
| a `.top-actions` for the controls | ✓ | ✓ |
| Class chat / Hand up / Join class | ✓ | ✓ |
| Wehel | ✓ | ✓ |
| launch params carried across links | ✓ | ✓ |
| hub links | siblings | ✓ siblings |
| deploy path | own `deploy.mjs` | ✓ shared |
| **on the CDN** | ✓ | **no** |
| **a learner can reach it** | ✓ | **no** |

Nothing has been uploaded. `remote` names
`app/mathematics/grade-2-lessons`, which does not exist on the zone yet, and
even once it does no learner reaches it until the launch override
(`local_prequran/ehel_app_url_overrides`, read by `pqpg_ehel_app_base()`) names
it — a Moodle setting through the staged-script + cPanel loop, like
`../grade-1-app/repoint-grade-1.php`.

Note the shell course at `app/mathematics/grade-2/` is untouched and still
serves Grade 2 on v415. This build is an alternative to it, not a patch on it.

## Measured, not assumed

- **Contrast**: 0 failures across all nine lessons and the hub, dark, poked
  through every answered / wrong / revealed state — re-run after the wiring,
  because the controls add a tutor dock and a toast with colours of their own.
- **No 375px overflow.**
- **`check-lessons.py` passes**, and was mutation-tested six ways. One mutation
  survived its first version and is written up in the tools README; the short
  form is that a substring test for `"./course-shell.js"` was satisfied by the
  `<link rel="modulepreload">` while the import itself was gone.

## Two things that were wrong before they were checked

- Nine lessons matching `location.search` read as partial launch plumbing. It
  is `PLATFORM_VOICE` resolving the TTS endpoint and has nothing to do with
  carrying the token onto the next page. A count of a string is not evidence of
  the feature that string usually belongs to.
- These files arrived CRLF and were normalised to LF. `git status` then
  reported all ten as modified while `git diff` was empty and the bytes were
  identical to their blobs — a stale index stat, the same mechanism
  `.gitattributes` documents from the other direction. `git add` settled it;
  there was nothing to commit.

## Progress: it reports, and what it reports is not the course's units

Wired 2026-09-07 by `../lesson-app-tools/wire-progress.py`, at the same time as
Grade 1. Nothing new: the pages import the SAME `shared/progress-client.js`
every other course writes through and emit `section.completed`,
`unit.completed` and `progress.summary`, with position flushed rather than left
to the 20-second idle timer.

**THE UNIT PROBLEM.** These nine lessons are not the course's fifteen units.
The shell Grade 2 course is fifteen term-ordered units (`math-g02-u01` "Numbers
to 100" … `u15` "Symmetry, Position and Movement"); these are organised by
strand, and "Tens and Ones" alone covers u01, u05, u08 and u10. So progress is
written under its own namespace, `l01`..`l09`, beneath the SAME course key
(`ehel-math-g02`) and student id the shell uses. Emitting `u01` would have put
a learner's work in the slot the gradebook reads as "Numbers to 100" completed
— a claim about curriculum coverage nobody measured.

The board works; the gradebook does not see fifteen units' worth of completion,
because these nine lessons are not those fifteen units. Mapping them is a
curriculum decision and belongs to whoever owns the Cambridge alignment.

**Tested on the live upload and it correctly REFUSED.** With a Grade 1 launch
token (`course: ehel-math-g01`) the gateway answered 403 to a client writing
`ehel-math-g02`, the outbox held the events rather than dropping them, and the
learner-facing notice rendered: "Your session has expired. Your work is saved
on this device". That is the separation working, and it means a full green
end-to-end test of this build needs a Grade 2 token — the Grade 1 build was
verified instead, on the same code path.
