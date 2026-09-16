<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

#### Answer keys are checked against the booklet, not just for shape

Three quiz keys shipped bound to the wrong option — a flowchart decision keyed
`oval`, an integer question keyed `3.14`, a micro:bit OUTPUT keyed
`the shake sensor`. Every existing gate passed them: the key was a real option,
the options were unique, the explanation was prose. Nothing compared the key to
the booklet it came from. `check-computing-answer-keys.mjs` does, and is wired
into `check:computing`.

Only **booklet-derived** questions can fail it — 188 of 768. The other 580 are
built from the unit's own content (`Which of these describes "X"?` from
concepts, `What should you do when this happens:` from the debugging table,
`What does "X" mean in computing?` from the glossary) as
`options: [row.answer, ...distractors], answer: row.answer`. The key *is* the
object the question was generated from, so it cannot disagree with itself and
there is nothing external to compare it against. Don't read the 580 as unchecked;
read them as unfalsifiable.

**Ground truth is a committed fixture** (`computing/data/booklet-answer-keys.json`),
not the content model. `outputs/` is gitignored, so a gate reading the model
would find nothing on a fresh clone and pass having compared nothing. Regenerate
after re-running `extract:computing-content`:

```bash
node tools/check-computing-answer-keys.mjs --write-fixture
```

When the model *is* present the gate re-derives every key and fails if the
fixture has drifted from it, so the committed copy cannot quietly go stale. On a
machine without the model that cross-check cannot run — the fixture is trusted,
and its diff is the review surface.

Two traps, both found by the fixture disagreeing with itself between runs:

- **An unnumbered key run binds by position**, so it is only trustworthy when it
  is the same length as the question run. One question that fails to parse
  shifts every later answer onto the wrong question, and the fixture then
  asserts the wrong key with complete confidence. Where the counts disagree the
  section is skipped and reported instead. A gap is recoverable; wrong ground
  truth inside the gate is not.
- **A stem filter that counts words rejects real questions.** "Bandwidth is:",
  "Encryption means:" and "Phishing is:" are two words each, and dropping them
  caused exactly the shift above. The filter exists only to reject the
  underscore runs the booklets print as write-in lines, so it asks for letters,
  not for word count.

The packs write keys five ways (`1 (b)`, `1: (c)`, `1. (b)`, bare `(b)`, `B - `)
and options three ways (`(a)`, `a)`, `A)`), and one layout gives the key run the
**same section name as the questions**, separable only by position. Each variant
was found by a unit silently going unchecked, so narrowing any of them drops
that unit from the gate without saying so.

#### Computing Stages 1-4 show the deck alone

Thirteen sections have a deck, gated by `BOTH_DESIGNS_MAX_STAGE` in
`shell/subjects/computing.js`, and since 2026-08-26 each of them renders the
slides and nothing else (`deckOnlyPage`). They rendered the original page first
and the same content as an inline deck under it until then — see the hard rule
above for why that ended and what it cost. The pack division is the reason 4 is
the line, the same one Cambridge draws — Guides below it, student lesson books
above.

Two things follow, and both are load-bearing:

- **Each design queries inside its own region.** The two no longer share a page,
  so the collision this was written for cannot happen — but the regions are what
  make `cRoot()`/`c$`/`c$$` and `d$`/`d$$` mean "my half" at every call site, and
  the section is written to them throughout. A new control still uses its own
  half's helpers. `classicRegion` is now null on a deck page and both are cleared
  in `onBeforeRender`.
- **A deck slide draws its diagram flat** (`deckDiagram`, `interactive: false`),
  because every slide is in the DOM at once — Build It at Stage 4 has eight
  activities, against a browser cap of about sixteen on desktop and commonly
  eight on mobile. This used to be free (the original above built the interactive
  model), and since 2026-08-26 it is a straight loss at Stages 1-4: nothing there
  draws an interactive model, and the per-word WebGL explainer
  (`computing-word-scenes.js`) is unreachable with it.

Word cards carry a picture from `computing/shared/computing-word-pictures.js` —
Computing's OWN map, deliberately not English's `shell/subjects/word-pictures.js`.
This subject redefines ordinary words (a mouse is a pointing device, a key is
part of a keyboard, a table is rows and columns, a bug is a mistake in a
program), so one shared map would put an animal beside "mouse" in one subject or
a computer part beside it in the other. Same rule as English's file: the picture
must BE the word, and a word with no honest picture shows none — which is most
of this vocabulary, because most of it is abstract. About a third of cards are
pictured.

**A PICTURE OVERRIDE IS A CLAIM ABOUT A SENSE, AND A SENSE BELONGS TO A COURSE
THAT CAN BE REPLACED UNDER IT** (2026-09-12, found in Intensive English but
true of every per-grade override in these maps). `GRADE_WORD_PICTURES.ien2`
held seven entries written for a B1 course. When Level 2 was rebuilt on
Cambridge 0057, six of them named words the new level does not teach — dead,
and harmless. The seventh had stopped being stale and become **wrong**:
`platform` was overridden to a laptop because the B1 course taught the
publishing sense, and the rebuilt Unit 13 teaches it beside departure, arrival
and luggage, where the shared map's railway station was already correct. The
override was replacing a right picture with a wrong one, and deleting it was
the whole fix.

The note above that block warns about one subject's pass breaking ANOTHER
subject's word. This is the same failure reached from inside a single subject,
and it is the more likely one, because nothing reports it: the override goes on
applying, the gate has nothing to check it against, and the content it was
written for is gone. So **re-run the audit whenever a level's vocabulary is
rebuilt, not only when the shared map is edited** — and run it the way `ien1`
was audited: print every word beside the picture the function returns AND the
meaning the unit actually authored, because the authored meaning is the only
thing that settles which sense is being taught. Reading the map alone cannot
find this; seven further wrong senses turned up that way in one pass (a jar of
preserve for a traffic jam, a stop sign for a block of flats and again for
freezing water, a traffic light for a phone signal, two people for assembling
parts, theatre masks for the place something happened, a heartbeat for a pump).

### The Cambridge Learner's Book arm on the standalone builds (2026-09-16)

Grades 1-4 already reached **every** 0059 objective of their stage before this
pass - `check-coverage.py` was green on all four. What they did not have was
what the four Cambridge Primary Computing Learner's Books carry AROUND the
objectives, and the measurement that made the case is worth keeping:

| Cambridge feature | occurrences S1/S2/S3/S4 | what the build had |
| --- | --- | --- |
| Get started, You will learn, Warm up | 3/12/15/9 and 3/6/14/7 | the overview and a 2-question warm-up on all 47 lessons |
| Learn, Practise | 29/71/104/54 | the lecture, the demos and 731 questions |
| **Go further, Challenge yourself!** | 4/8/16/3 and 4/13/15/7 | **nothing** |
| **What can you do?** | 4/12/15/9 | **nothing** |
| **Did you know?** | 4/12/16/10 | **nothing** |
| Keywords / Glossary | 26/37/54 terms | 47/62/75/73 word cards, **29 Cambridge terms absent entirely** |
| real-world context | throughout | **"Computing world is not built yet", in all 47 lessons** |

Three findings from that pass, each of which cost something:

- **The register fell as the stage rose.** Grade 3 said "mistake" 306 times and
  "error" NEVER, while 3P.09 is written as "test and debug" and *error* is a
  Stage 3 Cambridge glossary word. Grade 4 owns 4P.07 - "identify and debug
  errors" - and said *debug* **once**, against 25/32/41 in Grades 1-3. Counting
  a synonym is not the same as counting the term the syllabus is written in.
- **Grade 4 was the thinnest build** (5-7 of its own teaching steps per lesson)
  against the densest Cambridge book. The deck's furniture hides this: every
  lesson looks 13-15 steps long because seven of them are the shell.
- **Coverage green is not depth green, and nothing in the repo could see the
  difference** until the fixture existed.

`computing/data/cambridge-stage-features.json` is that fixture - 118 entries,
each naming the ONE lesson that must answer it and the literal strings that
must appear in *that lesson's* teaching text. `check-coverage.py` grew the arm
that reads it, plus a floor of three self-check claims per lesson and a
single-key check on both tier banks. **Mutation-tested 7 of 7**, tree restored
byte-identical, plus two builder refusals (an unknown computational-thinking
move, a tier question with a repeated option).

**Everything the pass added is position-safe, and that was the design
constraint rather than a nicety** - all four grades are live and routed, so a
new teaching step would shift every stored section id after it and a child's
saved record would tick the wrong dots. So: the self-check went on the sticker
shelf (not a step), the tiers hang off the check step and `finish()` still
fires at the end of the CORE bank, Computing world filled a step that already
existed, and the vocabulary went into word cards and lecture parts. **All 47
lessons rebuild with the same step count, the same kinds in the same order and
the same titles** - verified by diffing the `const LESSON` payloads against
HEAD, which is the right instrument here because the shared pipeline rewrites
the page bytes.

Two traps met on the way, both already in the kit README and both worth knowing
from here:

- **The student-resources drawer is not the lesson's teaching.** It carries
  `finder` - every word of every lesson in the grade - so a gate that reads the
  whole payload thinks every lesson teaches every word. A mutation reassigning
  an entry to lesson 1 survived because of it, and fixing it immediately
  exposed a real gap the leak had hidden.
- **Check the mutation before believing the gate.** Three of the first seven
  "survivors" were the harness, not the arm.

Still open and stated plainly: **no human has read the keys.**
`build-review-pack.py` writes `review-pack.html` per grade - 146/220/259/254
questions per grade that are unfalsifiable from inside the build, because the
key IS the object the question was generated from. It is deliberately not in
the deploy set.

### What the gap measurement found, and what it cost (2026-09-16, later)

Measuring the REMAINING distance to the books, after the depth pass had shipped,
found a defect the pass itself had created and two closures worth making.

**`LED` was not taught at Grade 4 and the gate said it was.** The word appeared
zero times in the grade; the fixture entry claimed lesson 7 taught it and the
word card was never written. It was green because the Cambridge arm tested each
required string as a plain SUBSTRING, and `"led"` sits inside
`"count-controlled"`. Re-run with word boundaries: **140 of 141 held, 1 did
not**, and that 1 was the genuinely untaught term. `word_in()` now matches whole
words with LETTER-only lookarounds, so `1 = a`, `micro:bit` and `sub-task` still
work. The lesson now names Bitsy's twenty-five lights as LEDs — the kit's
renderer has called that grid `LED` since it was written, and only the learner
had not been told.

**The measured shape of the remaining gap**, which is worth keeping because it
is a POSITION rather than a backlog:

| | |
| --- | --- |
| maker units / all units | S1 7/11 · S2 7/11 · S3 7/12 · **S4 12/12** |
| share of book pages inside a maker unit | 64% · 65% · 60% · **100%** |
| make-something steps here | 9 · 10 · 16 · 16 (of 59 · 69 · 90 · 87 own steps) |
| "in pairs / in groups" in the books | S2 46 · S3 60 · S4 56 |
| "discuss / explain to somebody" | S2 17 · S3 32 · S4 37 |
| learner words, build as a share of book | S2 103% · S3 67% · S4 75% |

Cambridge is a MAKING curriculum delivered by a teacher: most units are named
"Be a game developer", "Be a musician", and the child builds one artefact across
the unit in real software. This build is a practice curriculum delivered by a
page, and it makes things only in its own simulators. That is the teaching-spine
decision, seen from the content side; **do not read the 60-100% as a backlog.**

**Two things WERE closed, both position-safe**: the two spoken prompts per
lesson on the teachers' page, and the real block names beside this build's own.
Both are in the kit README.

**The thin-objective count is not the finding it looks like.** 33 objectives are
carried by two teaching steps or fewer; **29 of those are a driven machine plus
an eight-item sort or a keyed question**, which is not thin. Four have neither a
question nor a sort under them — 1DC.01, 1MD.03, 2CT.04 and 4P.04 — and in each
the child DOES the thing (builds the network, fills the form, orders the steps,
builds the program) and is simply never asked about it in a step that names the
code. Recorded as an asymmetry, not corrected: for "know how to record data
using a form", filling the form IS the objective.

**Three of the measurement's own instruments were wrong before they were
right**, which is the reason its numbers are worth anything: a task regex
compiled without `re.M` returned 1 everywhere; case-insensitive tool counting
read "from scratch" as Scratch and "word" as Microsoft Word; and `^\s{0,3}`
stepped off the line `re.M` had just anchored. The numbered-task count is
**unusable and must not be quoted** — 72 / 513 / 43 across three stages is OCR
layout loss, not curriculum. Only Stage 3's scan preserves list indentation, so
only its figure (about 62 tasks per unit) is real.

### A person has now read every key, and what that did and did not settle (2026-09-16)

The previous section ended "**no human has read the keys**". That is now done:
all **914** questions across the four grades, read one at a time against
`review-pack.html`. **No key is wrong.** Every arithmetic claim, every Caesar
shift, every Pigpen pen, every Robo route and every data-table count that could
be checked by hand was checked and held.

What the read found instead was the shape of the questions, and most of it was
mechanisable - which is the useful part, because a read cannot be re-run on
every build. `check-question-shape.py` now runs inside `rebuild.sh` and decides
the machine-decidable half: a duplicated option, an explanation that names a
wrong option and affirms nothing, a key three times the length of every
distractor, an unmarked negative stem, a stem whose sum disagrees with its key,
an all-of-these. **It went in at zero findings on all four grades**, so anything
it ever reports is a question authored after the read - the only thing a gate
wired in after the fact can honestly claim.

Two classes of real finding came out of it:

- **One explanation ruled out and never affirmed.** Grade 4 Lesson 5, "A comment
  beside a block is for... = people reading the program", explained as "The
  computer ignores it." - which names the distractor and says nothing about the
  key. Now "People read it. The computer skips it."
- **46 questions could be answered without reading the stem.** The key was the
  only option that was a sentence; the distractors were two-word nouns. The fix
  is NOT to shorten the key - the key is the option that teaches - so all 132
  distractors were rewritten into full statements of real misconceptions ("the
  beds the patients sleep in", "any toy that moves when you push it"). The
  measured trap: making the container shrink is not enough on its own, and
  neither is trusting the first version of the checker - see the kit README for
  the four false-positive classes it had to be repaired through.

**What the read did NOT settle**: it was one person reading for correctness and
shape, not a teacher reading for whether the question is worth asking. 879 of
the 914 remain unfalsifiable from inside the build - the key IS the object the
question was generated from - so the review packs are still the review surface,
and a teacher's read is still owed. Same position as Science Grade 1.

### The fourteen thinnest lessons, and why thin was the right word

Measured per grade against that grade's own median lesson: Grade 3's *Input
Machines* ran 2445 words where the median was 2947, on 4 lecture parts and 5
word cards where 6 and 7 are normal. **Every objective was already reached** -
`check-coverage.py` was green throughout - so this was never coverage. It was
how much explaining a child gets for the same objective.

The additions are checkable rather than decorative: **every word card added is a
term the lesson already used in its own teaching text and never defined.**
Measured on the built payload, the *Databases* lesson never said what a database
is; *Input Machines* leaned on "rule" fourteen times with no card; *Press, Shake,
Clap* said input or output 157 times having carded neither. 31 cards and 17
lecture parts across 14 lessons; the worst gap closed from -17% to -10% and
nothing is now worse than -10%, against four lessons at -12% or worse before.

**The new prose was measured and was wrong the first time, in the same way as
last time.** It came out at F-K 5.31 and 13.8 words a sentence, against builds
that run 3.88-5.17 at 9.4-11.1 - harder than the lessons it was joining, and in
Grade 1 by a year and a half. Re-said in shorter sentences with nothing cut: F-K
2.70 at 7.3 words a sentence, 58 words lighter. **Write the prose, then measure
it against the build it joins** - the intention to write simply is not evidence
that you did.

All of it is position-safe, verified the only way that counts here: the `const
LESSON` payloads diffed against HEAD, with **no step count, kind or title
changed in any of the 47 lessons**.

### The mutation harness leaves the pages unwired, and every gate stays green

2026-09-16, found by `drive-lessons.mjs --record` and by nothing else. The
harness calls `build-lessons.py` each iteration, and that writes every page
from scratch - so it throws away everything the shared pipeline added. Run
after the final `rebuild.sh`, it left all fourteen Grade 4 pages with no
`wire-progress` and no `wire-platform-controls`.

**Every gate was green.** All 39 objectives reached, every key single, the
Cambridge fixture fully answered, `check-lessons.py` content, the page bytes
perfectly valid. The pages would have deployed and reported NOTHING to the
school - no progress, no resume, no percentage in the header - and nothing in
the repo would have said so.

The tell, on every lesson at once: `header n/a`, `record 0/14 stored, NOT
complete`, and `reload lands on step 1` instead of where the drive left off.
The cheap check is a grep: `wire-progress` and `wire-platform-controls` should
appear in every lesson page of a grade, not just the hub.

So: **the harness runs BEFORE the final rebuild, or the pipeline runs again
after it.** And the drive that matters is the recorded one - a plain drive
would have passed this, because the deck itself was perfect.

### Reviewed Computing scripts

Same loop as Science, with its own tools. `export-ehel-computing-scripts.py` flattens every learner-facing line into one sheet per stage; the reviewed file comes back from OneDrive and lands in `computing/data/script-review.json`:

```bash
python tools/apply-ehel-computing-script-review.py --workbook <reviewed.xlsx> --grades 1   # --dry to preview
npm run build:computing && npm run check:computing
```

Same safety model: the parser is proved against the real JSON on every row before it is trusted on an edit, and answer/option pairs are applied whole or not at all. Two computing-specific wrinkles — a Code Example's "Listing" line is `<title> (<language>)`, of which only the title is writable, and the exporter must force any cell starting with `=`, `+`, `-` or `@` to text or Excel reads the code as a formula and reports the workbook as corrupt.

### Computing narration audio

`generate-ehel-computing-audio.js` mirrors the Science generator, including the rule that its strings must match `computing/shared/course-ui.js` character for character. `check-computing-audio-coverage.mjs` is the gate and runs inside `check:computing`. It also fails when a category's template cannot be read out of the generator source at all — a multi-line `case` used to skip the wording comparison silently, which is how a drift would slip past the check meant to catch it.

```bash
node tools/generate-ehel-computing-audio.js 1 --dry        # characters, nothing sent
node tools/generate-ehel-computing-audio.js 1 --budget 900 # prove the pipeline first
node tools/generate-ehel-computing-audio.js 1              # the full stage
node tools/generate-ehel-computing-audio.js --orphans      # clips no button asks for any more
node tools/generate-ehel-computing-audio.js --orphans --prune
```

Any content change under an already-generated set — a builder fix, a returned review — moves the text, so its hash moves too and the old clip is orphaned. Re-running the generator fills the new hashes (it is idempotent, so nothing already correct is paid for twice); `--orphans` finds the dead files left behind. It refuses a narrowed run, because with a category or grade filter every other stage's clips would look orphaned.

Clips land in `computing/media/audio/tts/<hash>.mp3`, which is where the app looks in local dev; the Bunny build remaps it to the per-stage `media/computing/gNN/` tree. Stage 1 alone is ~1,030 clips / ~201k characters, and ElevenLabs bills per character — always `--dry` first.

**Ask the claim map what is reachable, never a run's own queue.** `--orphans`
built its set from `textsForUnit`/`textsForCapstone`, which leave out Wehel's
stock tutor phrases — no unit owns them, because the tutor speaks them on every
stage, so they are claimed in `hashesForGrade`. All 77 were reported as dead,
and `--prune` would have deleted them: the tutor drops to the paid runtime voice
on every stock phrase, and computing's clip directory is gitignored, so nothing
brings them back but paying again. `prune-ehel-course-audio.mjs` read the claim
map all along and had been answering 0 the whole time. When two tools disagree
about what is reachable, the one using `hashGradeMap` is right.

**`.bunny-upload-manifest.json` is a local cache, not a record of the CDN.**
"already uploaded: N" is a claim; nothing verifies it against storage, and
anything it wrongly records is skipped forever. 630 Computing clips — the 77
tutor phrases on every stage — sat generated-but-undeployed behind it, and a
later run still skipped 14 it wrongly believed were up. To check reality, list
`media/<subject>/gNN/audio/tts/` on storage and compare against
`hashesForGrade`; to repair, delete the wrong entries from the manifest and
re-run the uploader.

