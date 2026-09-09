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

## Status: wired, gated, ON the CDN, NOT routed

| | grade-1-v2 (live) | here |
| --- | --- | --- |
| deck, `finish()`, stickers | ✓ | ✓ |
| design template + ink tokens | ✓ | ✓ |
| the two header bars | ✓ | ✓ |
| controls in bar 2, beside Full screen | ✓ | ✓ |
| Class chat / Hand up / Join class | ✓ | ✓ |
| Wehel | ✓ | ✓ |
| launch params carried across links | ✓ | ✓ |
| hub links | siblings | ✓ siblings |
| deploy path | own `deploy.mjs` | ✓ shared |
| **on the CDN** | ✓ | ✓ |
| **a learner can reach it** | ✓ | **no** |

**It IS uploaded, and this table said otherwise until 2026-09-09.** Storage was
listed with the access key rather than probed through the edge: `Ehel
Primary/app/mathematics/grade-2-lessons` holds 14 objects — 10 pages and the
four platform modules — newest 2026-09-07. `../lesson-app-tools/README.md` had
it right ("uploaded … routed to by nobody") and this file was the stale one.

Being on the zone is not being reachable. No learner arrives until the launch
override (`local_prequran/ehel_app_url_overrides`, read by
`pqpg_ehel_app_base()`) names it — a Moodle setting through the staged-script +
cPanel loop, like `../grade-1-app/repoint-grade-1.php`. That setting cannot be
read from this repo, so whether Grade 2 is routed is **unverified in both
directions** rather than known to be no.

**The deployed copy is the pre-Stage-2-fix build.** Everything below about
removing out-of-stage steps is true of the working tree and of nothing on the
CDN; a learner sent there today still gets the 24-hour clock and four
quadrants.

Note the shell course at `app/mathematics/grade-2/` is untouched and still
serves Grade 2 on v415. This build is an alternative to it, not a patch on it.

## Every step is Stage 2 now, and 18 steps were removed to make that true

This build used to teach well past Stage 2, and it said so on the hub: *"Two of
them keep going past Stage 2 … a Grade 2 child can stop at the check and has
still met everything the stage asks for."* **They could not.** The extra steps
sat in the MIDDLE of each lesson, not after it, so the only route to the Stage 2
material at the end ran through them — *Which Way From Here* taught grid
references, coordinates and all four quadrants as steps 2 to 7, and its Stage 2
position work came afterwards.

Measured against `src/curriculum/cambridge-mathematics-0096.json`, the build
carried **94 verified out-of-stage hits**; it now carries none. What went, and
where 0096 actually puts it:

| removed | belongs at |
| --- | --- |
| tenths and hundredths of a second, "half an hour is 0.5 hours" | decimals, Stage 5 |
| coordinates past zero, all four quadrants | Stage 6 |
| time zones | not in 0096 at any stage |
| unit cost, "which is better value" | proportion, Stage 6 |
| grid references, reading and plotting coordinates | `4Gp.02` |
| translation, rotation about a point | Stage 5 and above |
| am/pm and the 24-hour clock, timetables | `4Gt.02`, `4Gt.03` |
| reading a clock to the very minute | `3Gt.02` |
| a time versus an interval, "what time will it be" | `3Gt.04` |
| cardinal points (north, south, east, west) | `3Gp.01` |
| right angles as a named idea | `3Gg.10` |
| tiling | `4Gg.01` |
| thirds, fifths, sixths, eighths, twelfths | `3Nf` and above |
| regrouping in addition ("swap ten ones for a ten") | `3Ni.04` — `2Ni.04` says *no regrouping* in the objective itself |

Two steps were **rewritten rather than removed**, because the slide had a Stage 2
job the over-reach was standing on: *Which is better value* became *Which purse
is worth more* (`2Nm.02`, compare combinations of coins), and the reflection step
dropped its horizontal and diagonal mirrors to leave `2Gp.02`'s vertical one.
Fair Shares kept all nine of its steps and had every denominator constrained to
halves and quarters.

**Coverage did not move: 47 of 48 objectives, before and after.** The one gap is
`2Ni.07` (know the 1, 2, 5 and 10 times tables) — there is no recall practice
anywhere in the build. It is a gap rather than over-reach, it was here before,
and it is still open.

Three lessons are now much shorter — 16 steps became 6 in *Half Past, Quarter
To*, 13 became 5 in *Which Way From Here*, 13 became 11 in *Sides and Corners*.
That is what Stage 2 actually asks for in those strands (time has three
objectives, position two), but it takes the build from 104 teaching steps to
86 (122 sections to 104, counting each lesson's check and sticker pages), and
the whole grade already held only about three weeks of a thirty-five-week year.

### Removing a step breaks the helper that happened to sit beside it

Two runtime failures came out of this and **neither static check saw either**.
`check-lessons.py` passed and all 55 inline scripts parsed while both lessons
were rendering as an empty frame:

- `const GC = 5, GR = 5` — the map's size — was declared inside the compass
  block. That block is `3Gp.01` and went; the robot and route steps are Stage 2
  and stayed, and both draw maps at `GC` × `GR`.
- `choices()` and `reveal()` — general helpers used by three other steps — were
  declared inside the right-angles block.

Both are now beside the shared helper they belong with. The check that found
them is the browser: load the page and compare `#dots button` against `.slide`.
`show(0, false)` runs at the END of the script, so a throw anywhere in any
activity block leaves the rail empty — **dots == slides is a one-line assertion
that the whole script ran**. Grade 3 has `checks/check-runtime.mjs` for exactly
this; Grade 2 has nothing equivalent, and that is the gap this change ran into.

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
