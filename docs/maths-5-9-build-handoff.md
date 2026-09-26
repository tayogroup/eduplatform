# Maths 5–9 Build Handoff

Cambridge Mathematics Grades 5 to 9 — delegating the build to a second account
on a second workstation. Every figure below was measured on the primary machine
on 2026-09-26, not recalled.

Live copy (owner's account): https://claude.ai/artifact/HjLcVMYHdnDp2vbmvXRgrm

## Scope and the state of each grade today

Five grades, two Cambridge frameworks, and five genuinely different jobs. This
is not one task repeated five times — read the last column before estimating
anything.

| Grade | Framework | Objectives in stage | Claimed now | Coverage | What exists today |
| --- | --- | --- | --- | --- | --- |
| 5 | 0096 Primary | 51 | 51 | **100%** | Standalone app, 10 lessons + check. **Done and deployed 2026-09-26.** Still no shell units — the manifest claims 18 and `data/units/` does not exist |
| 6 | 0096 Primary | 54 | 49 | 91% | 17 shell units, mapped. No standalone app |
| 7 | 0862 Lower Sec | 63 | 57 | 90% | 16 shell units, mapped. No standalone app |
| 8 | 0862 Lower Sec | 61 | 55 | 90% | 16 shell units, mapped. No standalone app |
| 9 | 0862 Lower Sec | 55 | 0 | **0%** | Nothing. No units, no app, not in `catalog.json` |

The work splits three ways.

**Grade 5 is finished.** It was at 41% — five whole strands absent — and is now
51/51, live on the CDN and routed. Five lessons and 32 interactive steps were
added on 2026-09-26: Shapes and Angles (`5Gg`), Where Things Are and How They
Move (`5Gp`), Time and How We Write It (`5Gt`), Data and Chance (`5Ss`/`5Sp`)
and Calculating with Wholes and Parts (the remaining `5Ni`/`5Nf`). What it
taught the tooling is in **Building a lesson in grade-5-app** below, and the
second machine should read that before starting Grade 9, which is the same
shape of job.

The 18-unit shell course question is still open and unchanged: a manifest
claiming 18 units over an empty `data/units/` is a live inconsistency that
should be decided rather than left.

**Grades 6, 7 and 8 need the last five or six objectives each**, plus the
curriculum sign-off their mapping has never had. This is now the first work.

**Grade 9 is net new** — 55 objectives, no scaffolding, no catalogue entry.

## Blockers to clear before any authoring starts

Five of these were found by measuring rather than assuming, and two of them will
stop the second machine dead on day one.

### 1. Every Stage 7, 8 and 9 book is an image-only PDF

This is the big one. Tested by sampling five pages from the middle of each book
and counting extracted characters:

| Book | Pages | Extractable text | Verdict |
| --- | --- | --- | --- |
| Primary Maths 5 Teacher's Guide | 202 | 13,754 chars / 5pp | Text OK |
| Primary Maths 6 Teacher's Guide | 200 | 11,295 chars / 5pp | Text OK |
| Maths Learner's Book 7 | 388 | 0 | Needs OCR |
| Primary Maths Teacher's Resources 7 | 222 | 0 | Needs OCR |
| Lower Sec Learner's Book 8 | 395 | 0 | Needs OCR |
| LS Mathematics Workbook 8 | 237 | 0 | Needs OCR |
| LS Maths Learner's Book 9 | 354 | 0 | Needs OCR |
| LS Mathematics Workbook 9 | 205 | 0 | Needs OCR |

That is **1,801 pages across six books** with no text layer. Stages 5 and 6 are
already OCR'd and fine. Until the 7 to 9 books are OCR'd, no extraction, no
answer-key checking and no misconception mining is possible for those grades.

### 2. There is no Teacher's Guide for Stage 8 or Stage 9

Only a Learner's Book and a Workbook exist for each. The Teacher's Guide is what
the misconception tooling mines — the Grade 5 spot-the-mistake tool refuses to
emit an item unless it cites a Guide page, and it found 44 named mistakes in the
Stage 5 Guide. Grades 8 and 9 have no equivalent source, so either those two
books get acquired or that feature is consciously dropped for 8 and 9.

### 3. A full clone is a 24 GB download

`.git` is 28 GB on disk, size-pack 23.79 GiB, because `src/media` (1.4 GB of
audio and video) is tracked rather than ignored. A plain `git clone` over a
normal connection is hours. Use a filtered clone — the recipe is in Phase 0.

### 4. The extracted book JSONs are gone

The Stage 3 to 6 book extractions lived in a session scratchpad and have been
cleared. Nothing in the repo holds them. They are re-derivable from the PDFs, but
budget the re-extraction rather than expecting to find them.

### 5. Some lesson apps are GENERATED, and a rebuild silently deletes hand-applied work

Found on 2026-09-25 while fixing Grade 3, and it is the trap most likely to cost
the second machine a day.

Grade 3's lessons are composed from `grade-3-app/src/l{N}-slides.html` +
`l{N}-content.js` by `src/build.sh`. Most of the tools that add teaching steps
patch the **built** page instead. So:

- Commit `3248172174` added Story problems to all eight lessons.
- Commit `eac9d39980` added the lesson-opener steps and recomposed — which
  rewrote the pages from fragments that had never carried the practice steps.
  **Spot the mistake, Try this one and Story problems vanished from all eight
  lessons**, 9,256 bytes per page, and Grade 3 shipped without them until
  2026-09-25.

The commit reads as purely additive. The loss is visible only if you diff the
list of step headings, which nobody did.

**A second instance is still live.** A plain rebuild of Grade 3 today also
deletes the unit lecture films — `lessonFilm()`, the `<video>` element, its CSS —
because `96b103173f` patched the built pages surgically. The film code went into
`src/add-lesson-opener.py`, but all 16 fragments already carry that tool's
marker, so it skips them and the films never reach `src/`. Measured: rebuilding
drops `rows-and-rules` from 225,564 to 224,291 bytes.

**Before running any build script in a lesson app, check whether the app is
generated**, and diff the step headings before and after. `build-all.sh` states
the rule itself: a tool that patches a built lesson has its work discarded by the
next build unless it is in the build's own chain. Grades 1 and 4 have the same
composed shape. Grade 5 does **not** — it has no `src/`, so pages are authored
directly and there is nothing to lose this way.

## Phase 0 — the second account and machine

These are owner actions. Nobody else can do them, and none of the later phases
work until they are done.

1. **Create the second Claude account** and confirm it has a plan with Claude
   Code access.
2. **Grant that account's GitHub identity write access** to
   `github.com/tayogroup/eduplatform` (private). Read access is not enough — the
   build commits content.
3. **Do not try to reuse the `backup` remote.** It points at a local Windows path
   on the primary machine and is meaningless on a second computer. The second
   machine gets `origin` only.
4. **Match the toolchain:** Node 24.x (currently v24.14.1) and Python 3.13.x
   (currently 3.13.5). Older Node fails on the lesson-app tooling.
5. **Clone without the media history** — a plain clone is 24 GB:

```bash
git clone --filter=blob:none --no-checkout https://github.com/tayogroup/eduplatform.git
```

```bash
git sparse-checkout init --cone && git sparse-checkout set src/prototypes/ehel-academy/mathematics src/curriculum tools docs && git checkout main
```

6. **Transfer `.env` out of band** — a password manager or encrypted transfer,
   never a commit, never chat, never a screenshot. The second machine needs
   `BUNNY_KEY` for storage read-backs. It does not need the TTS keys unless
   narration is in scope, and leaving them off is a deliberate safety margin:
   several generators bill per character even on a bare invocation with no
   arguments.
7. **Install the pre-commit hook** in the new clone: `sh tools/hooks/install.sh`.
   It is per-clone, so a fresh clone has no hook until this runs.
8. **Verify the setup** before any content work, from the repo root:

```bash
npm run validate:units && npm run check:alphabet && npm run check:math-cambridge
```

All three must exit 0 on a clean clone. If `check:math-cambridge` fails on a
fresh clone, that is a real pre-existing failure worth reporting back, not
something to work around.

### Day-one handover checklist

Everything the second account needs in hand before it can start. All of it comes
from the owner; none of it can be obtained from the second machine.

| # | Item | Who | Done when |
| --- | --- | --- | --- |
| 1 | Second Claude account with Claude Code access | owner | signed in |
| 2 | GitHub write access to tayogroup/eduplatform | owner | a test push to a branch succeeds |
| 3 | Node 24.x and Python 3.13.x installed | second machine | versions match |
| 4 | Filtered clone of the repo | second machine | the three gates exit 0 |
| 5 | `.env` with `BUNNY_KEY`, transferred out of band | owner | a storage read-back returns 200 |
| 6 | Pre-commit hook installed in the new clone | second machine | `tools/hooks/install.sh` has run |
| 7 | Cambridge maths PDFs for Stages 5–9 copied over, outside the repo | owner | present and gitignored |
| 8 | Stage 7, 8 and 9 books OCR'd | second machine | 5-page sample extracts thousands of characters |
| 9 | Stage 8 and 9 Teacher's Guides acquired, or the gap accepted in writing | owner | decided either way |
| 10 | This document available to the second account | owner | in the clone, or the link shared |
| 11 | Agreement that mathematics is the second machine's lane | both | stated once, in writing |

Items 7, 8 and 9 are the ones that gate real work. Items 1 to 6 are an afternoon;
item 8 is 1,801 pages of OCR; item 9 may be a purchase.

**The first task to give them is Grades 6, 7 and 8** — five or six objectives
each, against books that are already usable for 6 and need OCR for 7 and 8.
That is a real, finishable piece of work that teaches the repo's conventions
before anyone meets the blank page of Grade 9.

Grade 5 is no longer on that list: it was built out to 51/51 on 2026-09-26 and
is live. Its build is the worked example for Grade 9 and is written up under
**Building a lesson in grade-5-app**.

## Phase 1 — the books, and OCR for Stages 7 to 9

The Cambridge books are **not in the repo**. They sit in the primary machine's
Downloads folder, untracked, and they are the input everything else depends on.
They must be transferred, and most of them must be OCR'd.

### What exists, by stage

| Stage | Learner's Book | Workbook | Teacher's Guide | Text layer |
| --- | --- | --- | --- | --- |
| 5 | yes | yes | yes | OCR'd, good |
| 6 | yes | yes (two copies) | yes | OCR'd, good |
| 7 | yes | yes | yes (Teacher's Resources) | none — OCR needed |
| 8 | yes | yes | **missing** | none — OCR needed |
| 9 | yes | yes | **missing** | none — OCR needed |

Both framework PDFs are also present: 0096 Primary and 0862 Lower Secondary.

### Steps

1. **Transfer the maths PDFs** to the second machine. Keep them outside the repo
   — a folder like `C:/cambridge-books/maths/stage-N/`. They are copyrighted
   texts and large; they must never be committed. Confirm `.gitignore` covers
   wherever they land.
2. **OCR the six image-only books.** `ocrmypdf` is the straightforward option:

```bash
ocrmypdf --skip-text --optimize 1 --output-type pdf in.pdf out_OCR.pdf
```

Budget real time — 1,801 pages. Follow the existing naming convention and suffix
the output `_OCR.pdf`, matching the Stage 5 and 6 files.

3. **Verify each OCR result before trusting it.** Sample five pages from the
   middle and count extracted characters; anything under a few thousand per five
   pages has failed and needs re-running at a higher DPI. A silently bad OCR
   produces confident garbage downstream, which is far worse than a file that
   plainly has no text.
4. **Acquire the Stage 8 and Stage 9 Teacher's Guides**, or record the decision
   to ship those two grades without misconception content. This is a purchasing
   decision, not an engineering one — flag it to the owner rather than quietly
   dropping the feature.
5. **Re-extract the book JSONs** for Stages 5 to 9 once the text layers are
   sound, and this time write them somewhere durable and gitignored rather than a
   scratchpad. The previous extractions were lost to a cleared temp directory.

## Phase 2 — the frameworks are already done

Good news, and the one phase that needs almost nothing. Both Cambridge frameworks
are already extracted, in the repo, and cover all five grades:

| File | Covers | Objectives | Source PDF recorded |
| --- | --- | --- | --- |
| `cambridge-mathematics-0096.json` | Stages 1–6 | 288 | 0096 Primary Curriculum Framework 2020 |
| `cambridge-mathematics-0862.json` | Stages 7–9 | 179 | 0862 Lower Secondary Framework 2020 |

Per-stage totals, which are the denominators for every coverage claim in this
document: **Stage 5 = 51, Stage 6 = 54, Stage 7 = 63, Stage 8 = 61, Stage 9 = 55.**

**Stage 9 is in 0862 already** — 55 objectives — so Grade 9 does not need any new
extraction, only authoring.

**Do not re-point anything at 0845.** That older Primary framework PDF is still
in the Downloads folder and is a superseded edition. The repo deliberately uses
0096. If a framework check fails, fix the framework or the mapping — do not
switch editions to make a gate pass.

If a framework file is ever re-extracted, both of these must exit 0 before it is
merged:

```bash
npm run validate:frameworks && npm run validate:curriculum-units -- --strict-cambridge
```

## Phase 3 — the build, grade by grade

### Grade 5 — DONE, and the worked example for Grade 9

Finished on 2026-09-26: 51/51, deployed, and already routed so it reached
learners on upload. Nothing here is outstanding except the shell-course
decision noted in Scope.

Read this section anyway before building Grade 9. It is the only standalone
maths app anyone has extended, and the two traps below cost real time.

Grade 5 keeps the upper-stage page design — no deck, no scoring, no sticker
shelf. That is the documented rule for Stages 5 and above, not a gap to fill.

**The source pages are already located** — done on the primary machine on
2026-09-25. In
`Cambridge_Primary_Mathematics_5_Learners_Book_Hodder_OCR.pdf` (205 pages, text
layer good):

| Content | Learner's Book pages |
| --- | --- |
| Symmetry | 24–25, 31–32 |
| Angles — acute, obtuse | 26–29 |
| Triangles — isosceles, equilateral, scalene | 30–32 |
| Nets | 69, 138, 140 |
| Perimeter and area | 133–137, 140, 142 |
| Coordinates | 114–116, 142 |
| Translation and reflection | 111, 113, 116, 154–157 |

Unit 2 of the book is "Angles and shapes" and carries the Maths words the lesson
should teach: symmetry, horizontal, vertical, diagonal, symmetrical.

**The lessons are NOT templated.** Each step is a bespoke interactive widget
with its own hand-written JavaScript — a dot grid that rearranges, a chip
picker, a live working panel. Measured: 85–128 KB per lesson, of which about
20–35 KB is genuinely custom; the rest is shared CSS and tool-injected platform
wiring. The five new lessons came to 32 steps and took a full working session
each. Budget the same for Grade 9.

## Building a lesson in grade-5-app

The mechanics, in the order that works. Both traps below were hit on the real
build and neither is documented anywhere in the repo.

1. Write the page: take lines 1–427 of an existing lesson (the `<head>` and the
   shared `<style>`), swap the `<title>`, then author your own `<div class="wrap">`
   with a hero, a `<nav class="steps-nav">` listing only YOUR steps, the
   `<section class="step" id="sN">` blocks, and one `<script>`. Step ids are
   **global across the app**, so continue from the highest one in use.
2. Register it in `app.config.json` with `title`, `blurb`, `materials`,
   `support` and `challenge`. The last three are what the materials-note and
   differentiation tools read; a lesson without them is silently skipped.
3. Add the data the tools need: a `WORK` entry in `add-self-check.py`, a `WORK`
   entry in `add-lesson-opener.py`, and rows in the `STAGES` table inside
   `check-what-you-know.html`.
4. Run the chain **in this order**, from `grade-5-app/`:

```bash
python add-self-check.py --write && python add-lesson-opener.py --write && python add-materials-note.py --write && python add-differentiation.py --write && python add-twm-stamps.py --write && python wire-platform.py --write && python add-lesson-search.py --write
```

5. Add a card to the hub by hand. See the second trap.

### Trap 1 — add-self-check MUST run before add-lesson-opener

`add-self-check.py` asserts that the nav entry count equals the step count, and
it counts nav entries with `<a href="#s`. The opener adds three steps whose
links are `#opener-about`, `#opener-lecture` and `#opener-words`, which do not
match that pattern — so once the opener has run, self-check refuses with
"nav has N entries for M steps before this runs". Run it first and both pass.

This cost two rebuilds on the real build. The page is deterministic from its
parts, so recovering is just re-concatenating the head and the body and running
the chain again, but it is an hour if you do not know why it is refusing.

### Trap 2 — the hub is NOT generated from app.config.json

`grade-5-app/index.html` lists the lessons as hand-written
`<a class="lesson …" href="…?from=g5">` cards. `split-into-lessons.py` built it
once as a one-time migration and it has been hand-maintained since, so the
whole tool chain above wires a lesson **completely** and still leaves it
unreachable: no card, and (after the first one) not even in the "Jump to a
lesson" picker.

All five new lessons shipped into this state before it was noticed. **What
caught it was the deploy plan**: `index.html` came back byte-identical, same
hash, after four lessons had been added. A hub that does not change when the
course grows by four lessons is the tell.

So: after adding a lesson, add its card, add its picker entry, and correct any
count in the lede. Then diff the hub before deploying — if its hash has not
moved, the lesson is not reachable.

### One thing that looks like a bug and is not

`check-what-you-know.html` carries `id="s29"`, and so does
`shapes-and-angles.html`, because the new numbering started at s29 without
checking the check page. It is not a duplicate "Step 29": the check page renders
that section as `<span class="step-num">Check</span>`, not a number, and the
search index is keyed by file as well as anchor. Renumbering would touch a
working page including its `$("s29").scrollIntoView()` retry handler, for no
learner-visible gain. Left alone deliberately.

### Grades 6, 7 and 8 — finish the last five or six objectives each

All three are shell-course only, at 90 to 91%, mapped under `cambridge.objectives`
in each unit JSON. The remaining codes, measured today:

| Grade | Unclaimed objectives |
| --- | --- |
| 6 | `6Gg.03`, `6Nc.01`, `6Nc.03`, `6Sp.02`, `6Ss.04` |
| 7 | `7Ae.01`, `7Gg.03`, `7Gg.11`, `7Gp.01`, `7Ni.02`, `7Sp.01` |
| 8 | `8Ae.05`, `8As.07`, `8Gg.04`, `8Ni.02`, `8Ni.03`, `8Ss.01` |

For each: find the unit where the objective belongs, add teaching content that
genuinely covers it, then add the code and its verbatim framework text to that
unit's `cambridge.objectives`.

**Add the content first and the code second.** A citation gate proves the code is
real and in the right stage; it cannot tell whether anything teaches it. This repo
has already shipped a level reporting 176 of 176 objectives cited where one of
them had zero coverage of its actual subject. To check delivery, grep the units
for the words the objective is about and read what comes back.

### Grade 9 — net new

Nothing exists. This needs a full course: 16 or 17 units against Stage 9's 55
objectives, a `course-manifest.json`, a `catalog.json` entry, and a Moodle course.
Treat Grade 8 as the structural template and copy its shape rather than inventing
one. Do not start this until the Stage 9 books are OCR'd.

## Phase 4 — the gates

Run from the repo root. All must exit 0 before anything ships.

```bash
npm run validate:units && npm run check:alphabet && npm run check:math-cambridge && npm run validate:frameworks
```

If any PHP was touched, `npm run check:php` as well — it is not in `npm test`
because it spawns a parser per file, so running it is on you.

### Two gaps in the gates, both worth knowing

**The framework gate does not read the standalone apps.** `check:math-cambridge`
walks the shell-course units only. The apps make their own objective claims and
nothing validates them. A measured consequence: `grade-1-app` currently declares
`8Wx.31`, a Stage 8 code sitting in a Stage 1 app, and no gate has ever objected.
If the second machine builds app-side objective claims for Grade 5, **a new check
that reads the apps is worth writing** — and would be the single most useful piece
of tooling to come out of this work.

**Answer keys are verified by arithmetic, not provenance.**
`check-math-answer-keys.mjs` computes the answer rather than trusting a booklet,
which is stronger, but it only reaches about 7% of questions — the rest are
conceptual, diagrammatic or word problems and are reported as unchecked. Its
coverage may not fall. Four exclusions exist because each once called a correct
key wrong: estimation questions, algebra, bare `/` read as division, and
expressions that do not account for every number in the question. Do not remove
them.

### Verify in the browser, not only in the diff

For any grade at Stage 5 or above, confirm in a real page that there are zero
`gc-*` nodes under `#app` and that `body.gc-full` is never set. The deck belongs
to Grades 1 to 4 only. A passing script is not evidence about rendering — a UI
drive in this repo once passed while two strings rendered jammed together on
screen.

## Phase 5 — deploy and routing

Two channels, and the second machine controls neither end to end.

### Content and lesson apps — to Bunny CDN

```bash
node lesson-app-tools/deploy.mjs --app ../grade-5-app
```

```bash
node lesson-app-tools/deploy.mjs --app ../grade-5-app --upload > deploy.log 2>&1
```

The plan step costs nothing and lists every file with its hash. After an upload,
the **storage read-back is the proof** — an edge read is not, because an edge read
is itself a write to the cache.

Four rules that were each bought by an incident:

- **Never pipe a deploy through `head` or `tail`.** SIGPIPE kills the upload
  mid-run, and pointers flip per subject as each finishes, so a partial release is
  not uniformly partial. Redirect to a file and read the file.
- **Never invoke a content uploader with an unrecognised flag.** It is treated as
  a real upload of all six subjects.
- **Build for the same target you deploy to.** The build stamps the base path and
  deploy refuses on a mismatch.
- **The release tag is one global number** across all six subjects. Take the
  highest on storage and add one, measured at the moment of use, not at planning
  time. Do not trust a tool's "next free" — it reads a per-worktree manifest.

### PHP and routing — owner and operator only

**There is no SSH to the Moodle box.** Confirmed by attempt: the host answers and
refuses on public key. The only route is the documented loop — stage a script on
the Bunny zone under `Ehel Primary/qa/`, the operator curls it into the docroot,
runs it, and both sides delete their copies. A re-staged fix takes a new dated
filename, because the edge caches the broken first upload.

Routing a new grade is two steps, both the operator's:

1. Add the grade to the `TARGETS` table in
   `lesson-app-tools/repoint-grade.php`, keyed `ehel-math-gNN`, pointing at the
   uploaded directory. Only `https://ehelacademy.b-cdn.net/` URLs are honoured;
   anything else is silently ignored and the learner lands on the shell course.
2. Add the course to `local_hubredirect/standalone_lessons.json` on the server, so
   progress reads as a share of the app's lessons rather than the shell course's
   18 units. Verify with one line:

```bash
grep -c ehel-math-gNN /home/ehelacad/quraantest.academy/local/hubredirect/standalone_lessons.json
```

A result of `1` clears it. Neither the build machine nor the repoint script can
check that, which is why it is written down.

**Deploys are run by the owner, not by Claude** — the safety classifier refuses
them. Hand over a single PowerShell line to paste, then verify the result
afterwards.

## Coordination between the two machines

A second machine removes the worst hazard of this repo — two sessions editing one
working tree — and introduces a different one. Separate checkouts cannot corrupt
each other's index or destroy each other's uncommitted work. But they still share
`origin`, the Bunny storage zone, and one global release counter.

**Mathematics belongs to the second machine, exclusively.** The house rule is one
session per subject, and the second account takes maths 5 to 9. The primary
machine stays off `mathematics/` for the duration; the second machine touches
nothing else. Files outside its lane are off-limits even when they look broken.

**The release tag is the real collision risk.** It is one number across all six
subjects, so the second machine releasing maths while the primary releases English
can both take the same tag. Before any release: announce the tag, take the global
maximum across all six subject directories on storage, and re-measure at the point
of use rather than the point of planning. A verified tag goes stale in minutes. An
unnamed release stamps all six subjects.

**Storage rules that hold regardless of which machine you are on:**

- To prove a file is absent, ask storage with the access key. A storage read is
  passive; an edge read is a write to the cache, and a 404 minted on a version or
  media path is edge-cached for 37+ hours and cannot be purged with the key in
  `.env`.
- A storage listing of a directory that does not exist returns HTTP 200 with an
  empty array. Read the body and count objects — a status check reports every
  candidate tag as taken otherwise.
- Never probe a `v{TAG}/` path before its upload lands.

**Commit discipline still applies**, because `origin` is shared even though the
trees are not:

- Never `git add -A`, `git add .` or `git commit -a`.
- Run `git status` bare before every commit. A pathspec-filtered status cannot
  distinguish "nothing else changed" from "I did not ask".
- Commit with a pathspec in one command: `git commit -F <msg-file> -- <paths>`.
  Note that this commits the **working tree**, not the index.
- Before reporting anything as pushed, check `git rev-list origin/main..HEAD`.
- Pull before starting a session. Two clones drift silently, and maths files are
  only safe from the peer by convention, not by lock.

## Definition of done, and what to report back

A grade is done when all of these hold. Anything short of all of them is in
progress, not done.

| # | Criterion |
| --- | --- |
| 1 | 100% of the stage's objectives claimed, and each claim backed by content that actually teaches it — verified by reading, not by the citation count |
| 2 | Every declared code exists in the right framework at the right stage |
| 3 | All four gates exit 0, plus `check:php` if PHP was touched |
| 4 | Answer keys checked where the arithmetic checker reaches them, coverage not fallen |
| 5 | Deployed, with every file hash matched on a storage read-back |
| 6 | Routed, override read back clean, and `standalone_lessons.json` confirmed on the server |
| 7 | Opened in a browser at that grade: zero `gc-*` nodes under `#app`, `body.gc-full` never set |

### Report back per grade

Four numbers and one sentence:

- objectives claimed / stage total
- objectives whose teaching content was **read** and confirmed, which is a
  different and smaller number
- answer keys checked / total questions
- files uploaded / hashes matched on storage
- one sentence on anything deliberately not done, and why

### Two habits worth carrying over

**State what was measured, not what was inferred.** Silence is not evidence. This
document exists because a claim that Grade 3's differentiation had shipped turned
out to mean the tool was committed and the pages were never patched — the tool's
own report mode said `0 already done` the whole time and nobody ran it.

**A coverage number is not evidence that anything is taught.** When an objective
is about something a course could plausibly skip — a strand like probability, or a
skill like estimation — that is the first place to look, because it is exactly the
kind a unit can cite in passing while teaching around it.
