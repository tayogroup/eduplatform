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

