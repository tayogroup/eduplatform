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

### Grade 5's shell content is RETIRED FROM THE CDN (2026-09-26), and the repo still holds it

Owner decision. `content/mathematics/g05/**` — all 26 files, the 18 units, capstone,
topic-index, placement-exam, course-manifest and 4 tutor-lessons — was deleted from
Bunny storage, and 2,336 of its 2,430 narration clips with it. Grade 5's live product
is the standalone app (`app/mathematics/grade-5-v2/`), which shares none of it.

**94 clips were deliberately kept**: 77 Wehel stock tutor phrases plus 17 from
grade-5's tutor-lessons. `hashesForGrade` claims the Wehel phrases for EVERY grade
regardless of content, which is the trap that once reported all 77 as dead.

**Tutoring now skips Stage 5 maths, gracefully and by design.** `get-help.js` says a
missing `topic-index.json` "404s and is skipped without comment: the index not
existing IS the statement that the stage is not offered" — the same mechanism as
Global Perspectives' withdrawn Stage 5. Nothing is broken; a capability was removed
on purpose.

**THE LOCAL FILES STAY, AND THAT IS NOT AN OVERSIGHT.** `grade-5/data/` keeps
`topic-index.json`, `tutor-lessons/`, `placement-exam.json` and `course-manifest.json`;
only `units/` and `grade-capstone.json` live in `_archive-grade-5-shell-course/`.
`ehel-topic-index.js :: CONTENT_DIR_OVERRIDE["mathematics:5"]` points the DERIVATION
at the archive precisely so the still-local index can be re-verified rather than
"READ but never RE-VERIFIED". Moving those files into the archive was tried on
2026-09-26 and reverted: it drops mathematics to 3,630 topics against a floor of
4,191 and adds a "stage 5 topic-index.json missing" failure. Read that comment before
touching it again.

**So the retirement is NOT durable.** `node tools/upload-content-to-bunny.js mathematics`
will re-deploy all of it from those local files and put Stage 5 back into tutoring
search, silently. The repo has no way to say "retired from the CDN, kept locally" —
`withdrawn-courses.json` would assert the COURSE is withdrawn, which is false, since
`ehel-math-g05` is live via the app. If the retirement must survive a content upload,
that needs a deliberate change to the uploader, not a file move.

### The Cambridge Mathematics frameworks: 0096 and 0862 are both here

Both are extracted from Cambridge's published PDFs by
`extract-cambridge-mathematics-framework.py`, and `check:math-cambridge` loads
every `src/curriculum/cambridge-mathematics-*.json` it finds:

- **`cambridge-mathematics-0096.json`**: Primary, Stages 1-6, 288 objectives,
  from the 2020 PDF. It has been here since 2026-09-07 (`519f4cfa83`), and its
  Stage 4 agreed code for code with a hand extraction (46 of 46). Two gaps in it
  are real curriculum facts, not extraction damage: Nm (Money) stops after
  Stage 3, and Sp (Probability) starts at Stage 2.
- **`cambridge-mathematics-0862.json`**: Lower Secondary, Stages 7-9.

**This section called 0096 "the hole" until 2026-09-18, eleven days after the
file landed.** Before 2026-09-07 that was true, and the reason still holds. The
only Primary maths document then was 0845, a different and superseded edition,
and labelling it 0096 would have asserted an alignment nobody checked. Nobody
updated the note when 0096 arrived. The Grade 4 lecture-film session then took
it at its word and recorded its objective wording as unverifiable, when all ten
texts matched 0096 verbatim.

**What the gate checks.** For each shell-course unit (`grade-N/data/units/`):

- that its stage matches its folder;
- that the framework matches the stage (0096 at 1-6, 0862 at 7-8);
- that every claimed objective code exists in that framework at that stage;
- that the objective TEXT stored beside each code still matches the framework's.

The standalone lesson apps (`grade-N-app/`) make their own objective claims, and
this gate does not read them.

It holds the count of units with no mapping to `MAXIMUM_UNMAPPED`, a ceiling
that may fall but not rise. **Read the ceiling in the gate, not here.** This
section used to say "all 133 units map zero objectives", and that was stale 110
minutes after it was written on 2026-08-12. The Stage 7-8 mapping landed that
night and moved the ceiling to 101, and nothing updated this line. At HEAD on
2026-09-18:

- **Stages 7-8** carry a mapping against 0862. It is a proposal marked
  `reviewed: false` that needs curriculum sign-off before it is shown as
  alignment to anyone.
- **Stages 1-6** carry none. That is now authoring work, not a missing document.

**Do not build a gate that scores coverage by vocabulary.** It was built, and
deleted in `519f4cfa83` because it failed its control:

- It passed two objectives that were genuinely absent, because their other
  words appear elsewhere in the course.
- Tightened until it caught one of them, it raised 7 false alarms on good
  content.

A lesson teaches in child-facing words. The course covers 4Ss.03 with "what is
the same about the books, and what is different", which shares no distinctive
word with the objective's "similarities and variations". The full account is in
`grade-4-app/README.md`.

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

