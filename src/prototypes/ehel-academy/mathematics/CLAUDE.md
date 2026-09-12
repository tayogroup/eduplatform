<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

### Mathematics: rebuilding is destructive, and answers are checked by arithmetic

**`build:math` refuses to run without `--force`.** About twenty
`repair-ehel-math-*` tools edit the built units IN PLACE — answer ordinals,
truncated explainers, duplicate titles, exploration pairing — and none of that
work is in the content model, so a rebuild silently discards all of it. Their
only other copy is git history.

The guard is a flag, not a timestamp. Comparing the model's mtime against the
units' was tried and is worthless: copying the model to a new path refreshes its
mtime, the model then looks newer, and the check waves through the rebuild it
exists to stop. That happened and overwrote 125 units.

**The model now lives at `outputs/math-content/math-content-model.json`.** It
used to be read from `outputs/<uuid>/`, a one-off session directory — gitignored,
so reproducible on exactly one machine and only until somebody cleared it. The
builder still reads the old path as a fallback. Note `build:math` defaults to
grades **1 3 4 5 6 7 8**: grade 2 is deliberately excluded as the untouched
reference implementation.

**Answer keys cannot be audited against a booklet here.** The Practice booklets
hold worksheet tasks with prose keys ("Section 1: 1) a) 3,000 b) 3 tenths"), and
the 1,596 MCQs the app asks appear in them nowhere — they are authored, not
extracted. In these booklets `a) b) c)` are the PARTS of one task, not answer
options, so a parser carried over from Science or Computing misreads every
question it touches.

`check-math-answer-keys.mjs` computes the answer instead, which is stronger than
provenance and cannot be fooled by a booklet that was wrong. It reaches 109 of
1,596; the rest are conceptual, diagrammatic or word problems and are reported as
unchecked rather than counted as passes. Coverage may not fall.

Four rules keep it honest, each added after it called a correct key wrong:

- **The expression must account for every number in the question.** Otherwise
  "Work out 6 + 7 + 4" verifies as 6+7=13.
- **A bare `/` is never an operator** — "What is 1/5 of 25?" is not 0.2.
- **Estimation questions are excluded.** "Estimate 3,872 + 5,145 to the nearest
  thousand" keys 9,000 on purpose; the exact sum is 9,017.
- **Algebra is excluded.** The y-intercept of `y = 7 - 2x` is 7, not 5.

Counting glyphs has its own trap: a pictogram states its scale in words ("Key:
one 📚 = 2 books, row shows 4 symbols"), so the glyphs printed on the page are the
key, not the quantity. And count code points, not `.length` — an emoji is a
surrogate pair, so seven buttons measure as fourteen.

### The Cambridge Mathematics framework, and the 0096 hole

`cambridge-mathematics-0862.json` is extracted from Cambridge's published PDF by
`extract-cambridge-mathematics-framework.py` and covers Stages 7-9. Stages 7-8
units declare 0862, so those match.

**Stages 1-6 declare 0096 and that framework is not published here.** The only
Primary maths framework available is 0845, a different and superseded edition;
extracting it and labelling it 0096 would assert an alignment nobody checked. So
Stages 1-6 have no framework, and `check:math-cambridge` says so rather than
passing quietly.

**All 133 units map zero objectives.** The gate records that as a ceiling that
may fall but not rise, checks stage↔code agreement (1-6 Primary, 7-8 Lower
Secondary), and validates any code that does appear — so the first mapping
authored is checked the moment it lands.

Two extraction traps worth keeping:

- **"Index" is not a section marker.** Maths objectives talk about "index laws",
  and matching it truncated 8Ni.05 and 9Ni.02 mid-sentence.
- **The Glossary heading arrives with its page number glued on** ("4 Glossary
  This glossary…"), so an anchored word match never sees it and the last
  objective of Stage 9 absorbed the entire glossary — 4,161 characters.

`validate-curriculum-framework.mjs` gained `maxTextChars` for this file: maths
prints nested `o` bullets as part of the objective above them, so a few
legitimately run past the 340 that flags a swallowed section elsewhere. Its
filename glob and `CODE_RE` now cover mathematics too — without that, the new
framework file was silently not validated at all.

The full local loop:

```bash
node tools/generate-ehel-science-audio.js 1 --dry        # cost first, then drop --dry
node tools/prune-ehel-course-audio.mjs science          # report; --delete to remove orphans
BUNNY_KEY=… node tools/upload-media-to-bunny.js science
```

Two paths, one cache: the course reads `./media/audio/tts/<hash>.mp3` in local dev, but `../../media/science/g<NN>/audio/tts/<hash>.mp3` once deployed. The flat local cache is fanned out per grade **at upload time** by `upload-media-to-bunny.js` — there is no copy in `dist/`, so a clip only reaches production through that upload. A text shared by two grades is uploaded under both. Clips no grade claims are skipped with a warning rather than uploaded, since no UI ever requests them.

A content rebuild renames every clip whose text changed, orphaning the old file. Run the pruner after `build:science`, and note the orphans are only free to delete while git still has them.

