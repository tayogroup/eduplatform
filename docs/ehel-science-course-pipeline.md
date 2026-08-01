# Ehel Academy Science — course pipeline

Science courses are **generated**, not hand-edited. Everything under
`src/prototypes/ehel-academy/science/*/data/` is build output: editing a unit
JSON by hand is lost on the next build. Change the source documents or
`tools/build-ehel-science-runtime.js` instead.

## The chain

```
Year <n>-<stamp>.zip  (Google Drive export, in ~/Downloads)
   │  tools/extract-ehel-science-content.py
   ▼
outputs/science-content/science-content-model.json   (block-level model)
   │  tools/build-ehel-science-runtime.js
   ▼
src/prototypes/ehel-academy/science/grade-<n>/data/  (units, capstone, manifest)
```

```bash
npm run extract:science-content   # re-read the source zips
npm run build:science             # regenerate all 53 units
npm run check:science             # content + WebGL acceptance gates
```

The extractor keeps **the newest zip per year**. Google Drive exports are
stamped `Year 5-20260731T212927Z-1-001.zip` and a new export does not replace
the old one, so several stamps for the same year sit in Downloads together.
Pinning one stamp silently rebuilds from stale source — this bit us once, so the
selection is now automatic (`newest_archive_per_year`).

## Curriculum frameworks

Two published Cambridge frameworks back these courses:

| Stages | Framework | File |
|---|---|---|
| 1–6 | Cambridge Primary Science **0846** | `src/curriculum/cambridge-science-0846.json` |
| 7–9 | Cambridge Lower Secondary Science **0893** | `src/curriculum/cambridge-science-0893.json` |

Stages 1–6 were previously recorded as code `0097`. The document Cambridge
publishes for these stages is titled *Cambridge Primary Science 0846 Curriculum
Framework*, so 0846 is what the units, the shell and the catalogue now declare.

Regenerate from the PDFs (they are not in the repo — point at your copies):

```bash
SCIENCE_0846_PDF=~/Downloads/0846_Primary_Science_Curriculum_Framework_2018.pdf \
SCIENCE_0893_PDF=~/Downloads/Science+Curriculum+Framework+0893.pdf \
npm run extract:science-frameworks && npm run validate:frameworks
```

Two quirks are handled in the extractor and worth knowing about:

- **0846 house style.** Its objectives are unpunctuated fragments, some very
  short ("Make predictions"). That is the publisher's style, not extraction
  damage, so the file declares `objectiveStyle` and the validator honours it
  rather than reading them as truncated bullets.
- **Source typos.** 0893 misspells two codes as `7TSWa.05` / `8TSWa.05`
  (should be `TWSa`). The extractor normalises them and prints a warning.

## Why the builder looks the way it does

These courses are used **without a teacher**, which drives most of the
non-obvious logic:

- **No truncation of teaching prose.** Explainers previously ran through
  `sentence(text, 520)`, which clipped 53% of them mid-sentence, and only the
  first two paragraphs were taken. Concept explanations and worked solutions now
  carry the full source prose, paragraphs joined by a blank line. Consumers
  split on that blank line to render one `<p>` per paragraph.
- **Three heading conventions.** Concepts are marked as `Part 2 - ...`,
  `Big Idea 1: ...` or plain `3. ...` depending on the year, and some books stop
  numbering partway through and continue with plain headings. All three are
  recognised; units matching none of them fall back to objective-derived
  concepts, which restate an objective instead of teaching it.
- **Concept bodies are bounded.** Only the final concept of a unit has no
  following heading, so only it is cut at the first non-teaching heading
  (`LESSON_TAIL` / `isSectionHeading`). Applying that cut to every concept
  truncates bodies at their own sub-headings and drops the prose beneath.
- **Grade 1 is authored, not extracted.** Its source is a *Teacher & Parent
  Guide* whose prose addresses the adult ("Goal: your child learns…", "Take your
  child outside"). Showing that to a five-year-old teaches nothing when no adult
  is reading, so `GRADE1_CONCEPTS` and `GRADE1_OVERVIEWS` carry child-facing text
  following the guide's own lesson order and local examples.
- **Adult-addressed text is filtered.** `ADULT_ADDRESSED` strips supervisor
  briefings from every learner-facing field. Genuine safety supervision
  ("an adult uses the knife") is deliberately kept.

## Acceptance gates

`npm run check:science` runs two gates and both must exit 0 before committing:

- `tools/check-science-content.mjs` — explainers complete and long enough to
  teach unaided, no adult-addressed text, no teacher-only dead ends, quizzes
  answerable, none of the sections the app renders left empty.
- `tools/check-science-webgl-scenes.mjs` — every scene named by a diagram exists,
  produces geometry across its animation, and emits only finite transforms and
  known meshes. A scene wired up wrongly renders a silently blank canvas, which
  nothing else catches.

Known, accepted warning: Grade 2 Unit 4 ships 12 three-option questions. Those
are the source book's own age-appropriate items, not a parsing artefact.

### Module variety

Two of those checks exist because whole modules once read identically in every
grade. The builder emitted constant strings for hints and derived several
"different" fields from the same source sentence, so **Explore the Concept**
showed one hint across all 53 units and repeated its own context back as the
explanation on 194 of 227 items.

- `VARIED_FIELDS` — no single value may fill more than 40% of a field across all
  grades. Hints are built from the unit's own glossary and investigation steps.
- `DISTINCT_PAIRS` — fields within one item may not hold identical text. In
  Explore the three reveal fields have distinct jobs: `context` is what the
  investigation is for, `answer` is what you should have found, `explanation` is
  the science behind it.

Mathematics had the same defect and, being unrebuildable, was patched in place
by `npm run refresh:math-modules -- --write`. It replaces only values that are
exactly the known boilerplate, so authored text is untouched by construction.

## Interactive WebGL

`science/shared/science-webgl.js` defines 23 scenes; `science-visuals.js` names
one on a diagram via `scene: "<id>"`. 24 of 33 diagrams carry a scene. The two
files are only connected by that string, so the acceptance gate above checks
both directions — a referenced-but-undefined scene and a defined-but-unused one
both fail.

Both the shell (`shell/subjects/science.js`) and the standalone course app
(`science/shared/course-ui.js`) render science. **Changes must be made in both**
— they are twins, and only `course-ui.js` serves the `grade-<n>/` pages. Bump
the `?v=science-<date><letter>` cache keys in both plus `science/index.html`
whenever these modules change.

## The same bug in Mathematics

`build-ehel-math-runtime.js` carried the identical defect and has been fixed the
same way. Mathematics could **not** be rebuilt to apply it: its generated units
hold hand-authored work that exists nowhere else — extra concepts, extra
outcomes, manually completed solutions — and a rebuild would discard all of it.

Two one-off repair tools patched the existing files in place instead. Both are
dry-run by default and only touch text they can prove is untouched generated
output:

```bash
npm run repair:math-truncation -- --write   # restore text clipped at 520 chars
npm run extend:math-explainers -- --write   # recover paragraphs body.slice(0,2) dropped
```

They are kept for reference, not for routine use — once Mathematics can be
regenerated safely, the fixed builder produces this output directly.

Both tools have converged; re-running them changes nothing. What is left:

- **44 concepts** were reworded by hand and are deliberately skipped by both
  tools. Their text is not in the source model, so nothing can be restored
  automatically without overwriting an author's work.
- **43 fields still end mid-sentence.** They belong to those hand-reworded
  concepts, so only an author can complete them. `repair:math-truncation`
  reports them on every run.
- **34 fields end in an ellipsis on purpose** — the source document itself
  writes them that way, marking a sequence the learner continues
  ("counting on in fours gives 1, 5, 9, 13, 17, 21…"). These are correct and
  must not be "fixed".
