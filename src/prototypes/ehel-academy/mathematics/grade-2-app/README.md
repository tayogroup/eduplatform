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

## Status: LIVE — on the CDN, and Grade 2 learners are routed here

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
| **a learner can reach it** | ✓ | ✓ |

**Both rows in this table said "no" until 2026-09-09, and both were wrong.**
The build is uploaded — `Ehel Primary/app/mathematics/grade-2-lessons`, listed
on storage with the access key rather than probed through the edge — and Grade
2 learners are ROUTED to it. `local_prequran/ehel_app_url_overrides` reads:

```json
{"ehel-math-g01":".../mathematics/grade-1-v2/index.html",
 "ehel-math-g02":".../mathematics/grade-2-lessons/index.html",
 "ehel-eng-g01":".../english/grade-1-v2/index.html"}
```

A per-grade `repoint-grade-2.php` was written to make that change and, run on
2026-09-09, reported "Already pointed at grade-2-lessons. Nothing to do." - the
run that proved the routing had been live all along. It has been replaced by
`../lesson-app-tools/repoint-grade.php --grade 2`, which reports the same way
and prints the same rollback.

**How this file came to be wrong is the part worth keeping.** The setting cannot
be read from this repo, so "not routed" was never a measurement — it was an
assumption that got written down as a status, and then repeated by
`../lesson-app-tools/deploy.mjs`, which closes every run with "Nothing routes a
learner here yet". Two independent-looking sources, one origin. The only thing
that can answer it is the Moodle setting, and that means the cPanel loop.

The consequence was real rather than theoretical: this build served Grade 2
learners the whole time it carried the out-of-stage material below, and the
2026-09-09 deploy that removed it went live to them on the spot — not to a
dormant path, which is what the deploy was announced as at the time.

Note the shell course at `app/mathematics/grade-2/` is untouched and still
serves Grade 2 on v415. This build is an alternative to it, not a patch on it.

## 2026-09-11: the validation, and what changed because of it

The section after this one says every step was Stage 2 after 2026-09-09. **The
2026-09-11 validation found that was not true**: 16 items from Stages 3-5 were
still being taught (the table is in the report — the robot facing north, "1000 g
make 1 kg", "the rule is add 3", "Is the game fair?", thirds and sixths in the
step that also crashed). Each is fixed now, and fixed IN PLACE:

- **`hold-stage-2.py` rewrote the steps without adding or removing any.** Progress
  is recorded by step POSITION (`step-NN`) and this build is live, so a step
  inserted or deleted would move every learner's record after it. Nine lessons
  keep their step counts; what a step teaches changed where it had to (Count It
  #4 is now a Carroll diagram, #7 tosses a coin, #8 spins and records, #9 runs a
  small survey; Patterns #5-#9 count on and back in steps; Coins #6 is "how much
  more", #7 writes money; How Much #8 compares capacity in cups, #9 estimates
  then measures). A learner who had finished old step 7 is shown step 7 as done.
- **The same probes, re-run after, found three more** that the report's table
  had not listed — "half a kilogram, because 1000 g make 1 kg" on the balance,
  `4/3` offered as a wrong answer in Fair Shares, and 400 sh and 250 sh as wrong
  answers in Coins — and those are gone too. What the probes still match was
  read hit by hit: lesson titles in the nav ("Coins and Change", "Fair Shares"),
  ordinals ("third", "every fifth mark"), "the part that repeats", and scale and
  jug readings in hundreds of grams and millilitres, which are kept — reading
  the number on a labelled mark is `2Gg.06`/`2Gg.07`/`2Gg.12`.
- **The three gaps are taught**: `2Sp.02` (toss a coin, spin and record),
  `2Nc.04` (count on and back in 1s, 2s, 5s and 10s from any number), `2Ss.01`
  (ask a question, collect the answers, answer it).
- **Fair Shares no longer crashes.** Step 8 picked its denominator from a list
  the stage line had emptied of everything but halves and quarters, and on 4 of
  6 live loads threw before the rail drew. It picks from `[2, 4]`.

And what the rest of the build gained the same day:

| what | how | checked by |
| --- | --- | --- |
| the check completes the lesson only at 75% (6 of 8, 7 of 9, 8 of 10); below it, the score, how many are needed, and **Try again** | `gate-and-explain-check.py` | all nine answered all wrong (Try again, not completed) then all right (completed), in a browser |
| every check answer explained, on screen and aloud | the same, and `why` on each item | the same run: every reason shown |
| **48 of 48** objectives declared, no other stage's code | `annotate-objectives.py` — each step's code read off its slide; notes about removed content now say "Stage 3's Nc.05" in prose, as Grade 1 does | `audit-stage-coverage.py` passes |
| focus mode and the session bar | `../lesson-app-tools/apply-focus-mode.py` | served with its modules: the bar mounts only with `focusMode=1`, and Ask Wehel lifts above it |
| doctype and `lang`, feedback announced, skip link, main landmark, fonts from our CDN, the "Can't hear it?" notice | the shared tools, in the order the notice needs (`wire-accessibility` puts the `role="main"` it anchors on) | each tool re-run: nothing to change |
| step dots own a 24 x 24 px cell on a phone (22 px wide before) | `wire-accessibility.py`, 8 px gap | hit-tested at 375 px |
| the fraction bars in Fair Shares #5 have names | direct edit | a probe of every step for unnamed controls: 0 |
| "For teachers and parents" on the hub: objectives, steps, pass mark, answers with reasons, one thing to try at home; minutes on every card and a total | `../lesson-app-tools/build-grownup-section.py` (at-home text in `app.config.json`) | rendered |

`app.config.json :: explorationSteps` lost `tens-and-ones.html#1`, which judges
now. **None of this is live until the build is deployed** — and because Grade 2
learners are routed here, a deploy reaches them the same minute.

## 2026-09-11 (later): the teaching the report asked for

The report: "Missing: authored explanations or worked examples (the Explain
button falls back to a derived one), a review or warm-up, any 'how do you
know?'". Authored explanation words: Grade 1 9,327, Grade 3 6,309, **here 0**.

| what | where | how it was checked |
| --- | --- | --- |
| an authored explanation on every slide: 103 of 103, about 6,500 words, in the four moves Grades 1 and 3 use - name the idea, show one example from the step, warn about the mistake children make there, hand back one thing to try | `explanations.txt`, written by `../lesson-app-tools/add-explanations.py` | every body parsed as the engine parses it: 0 refused |
| a warm-up at the top of step 1 of every lesson: last lesson in a sentence, one question about today's | each lesson's `warmUp` in `app.config.json`, `../lesson-app-tools/add-warmup.py` | answered in a browser, all nine |
| a "How do you know?" step after every check: a true claim, three reasons, one that works | `reasoning_banks.py`, `../lesson-app-tools/add-reasoning-step.py` | four right in a browser earns the sticker and reports the step, all nine |
| no emoji past Emoji 5.0 and no two stickers alike on one shelf, gated | `../lesson-app-tools/replace-new-emoji-all-grades.py`; `emojiBaseline`, `uniqueStickers` in `app.config.json` | the gate, mutation-tested 11 ways |

**What it costs a learner who has already finished a lesson**: progress is kept
by step POSITION, and the new step comes after the check - the one place no
stored position moves - so nothing a child has done changes meaning; the lesson
simply has one more step to finish. The warm-up is not a step at all. The same
trade Grade 1's second steps made, which the owner accepted.

In the shop, "a juice" and "a bar of soap" are a cup of tea and a balloon, and
in measuring the thread, the worm and the bottle are a spoon, a caterpillar and
a coconut - same numbers, older glyphs. The window and the ice cube among the
real-thing shapes are a picture frame and a dice.

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

**Coverage did not move: 47 of 48 objectives, before and after.** The one gap
was `2Ni.07`, and it is closed by the step below, which takes this build to
**48 of 48**.

### 2Ni.07 was the last gap: "Know them by heart", step 14 of Tens and Ones

`2Ni.07` says KNOW the 1, 2, 5 and 10 times tables, and know is recall. The
arrays step is `2Ni.05` — multiplication AS an array — and its own comment
already named `2Ni.07`, because it ends with three multiplication questions.
That is not the same thing: the array is still on screen while the child
answers and the multiplier only runs to 6, so it asks them to WORK IT OUT with
the manipulative in front of them. Reading that comment and stopping is how the
gap stayed invisible.

The new step asks the fact on its own. No array, the full table to ten, and the
skip-count behind a **Count it up** button the child presses when stuck rather
than shown by default — the crutch offered, not imposed. Six correct to finish.

Three details that are decisions rather than defaults:

- **The tables rotate; they are not picked at random.** `ORDER7` cycles
  2, 1, 5, 10, 2, 5, 10 … because a random pick over six rounds can miss a
  table entirely, and the 1s — which 0096 names, and which are trivial — should
  appear once rather than a quarter of the time. Checked by playing it through:
  six questions, all four tables met.
- **The distractors are the errors the fact invites** — one step further along
  the table, one step short, and adding instead of multiplying.
- **They are capped at 100**, because Stage 2 numbers stop there and the top of
  the 10s reaches it. Without the cap `10 × 10` offers 110: the one fact where
  "one step further" runs out of the stage. All 40 facts the step can generate
  were checked exhaustively — every answer and every distractor at or below
  100, and every fact still has two distinct wrong options.

It takes Tens and Ones to 17 steps and the build to 87. (Both figures moved
again when the fractions and money steps came out of that lesson -- see below.)

Three lessons are now much shorter — 16 steps became 6 in *Half Past, Quarter
To*, 13 became 5 in *Which Way From Here*, 13 became 11 in *Sides and Corners*.
That is what Stage 2 actually asks for in those strands (time has three
objectives, position two). With the times-table step added back the build stands
at 87 teaching steps against 104 before (105 sections against 122, counting each
lesson's check and sticker pages), and the whole grade already held only about
three weeks of a thirty-five-week year.

## Tens and Ones is about number now: the fractions and money steps came out

Every step in this build was Stage 2 after 2026-09-09, and Tens and Ones was
still the one lesson that was not about ONE thing. Its last two steps taught
fractions and money, and this build has a nine-step fractions lesson and a
nine-step money lesson:

| Tens and Ones | the lesson that owns it |
| --- | --- |
| 16 *Halves and quarters* — cut the bar into equal parts, tap to shade | *Fair Shares* 1 *Equal parts first*, 2 *Top number, bottom number* |
| 17 *Money* — pay for it with coins, tap until exactly right | *Coins and Change* 3 *Make this exact amount* |

The same activity twice, the second time in more depth. `recut-tens-and-ones.py`
removes them; the lesson goes 17 steps to **15** and the build 87 to **85** (103
sections). It is idempotent and reports what it changed, so its output is the
review surface.

**Coverage did not move — 23 of 48 declared, before and after — and the
ANNOTATIONS had to move for that to be true.** `2Nf.01`, `2Nf.02` and `2Nf.04`
were written down on the step that was cut and NOWHERE else in the build; Fair
Shares annotated only `2Nf.05`. Deleting the step would have deleted the only
record that this grade teaches them while leaving the teaching in place, so the
three codes are now on the Fair Shares steps that actually teach them — equal
parts, a fraction of a group, and fractions in real life. A coverage figure that
lives on the one step you are about to cut is not a fact about the course.

**THE MONEY BLOCK OWNED TWO HELPERS THAT SEVEN OTHER STEPS CALL.** `choices()`
and `reveal()` were declared at top level inside it, and *Tables by heart*, *A
quick look*, *Numbers in words*, *Which is more*, *First second third*, *Make 20
make 100* and *One undoes the other* all call them — 11 and 7 call sites. They
are hoisted function declarations, so nothing reads as though it depends on
where they live, and no static check would have said a word: the page parses,
the gate passes, and seven steps throw on the first tap. They are moved up
beside `lines()` before the block is deleted. This is the same failure the
section below records from 2026-09-09, which is why it was looked for rather
than found.

Verified in a browser rather than by reading: all seven of those steps draw
their options and mark them right/wrong on a tap, with zero page errors; the
check completes and earns its sticker through the renumbered `finish(15)`; the
shelf carries 16 stickers with no fractions or money entry; and Fair Shares
still draws its nine steps, since the annotations are HTML comments.

The hub card's step count is DERIVED by the script now. It said 17 while the
lesson had 15 — the same drift Grade 4's card had when a lesson grew, and there
is no `build-hub.py` here to prevent it.

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

What the owner DID decide (2026-09-11) is how the platform reads `l01`..`l09`:
as this build's lessons. `local_hubredirect/standalone_lessons.json`, generated
from this `app.config.json` by `tools/build-standalone-lesson-map.mjs`, lets the
family portal and the boards say "Lesson 3: Fair Shares" and count 3 of 9
lessons - where they used to count against the shell course's fifteen units,
so a child who had done every lesson read as 60%. It takes effect when the
server has the map and the code that reads it.

**Tested on the live upload and it correctly REFUSED.** With a Grade 1 launch
token (`course: ehel-math-g01`) the gateway answered 403 to a client writing
`ehel-math-g02`, the outbox held the events rather than dropping them, and the
learner-facing notice rendered: "Your session has expired. Your work is saved
on this device". That is the separation working, and it means a full green
end-to-end test of this build needs a Grade 2 token — the Grade 1 build was
verified instead, on the same code path.
