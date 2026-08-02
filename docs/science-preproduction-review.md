# Pre-production health review — Ehel Academy Science

Hand this to a reviewer with no memory of how the course was built. It names the
repo's own tools and the traps that have produced real defects here, because a
generic review misses both.

## Objective

Assess whether the Science course (Stages 1–8, 53 units) is fit to ship to
production. Report findings; do not fix anything unless asked. A finding is
something a learner, teacher, or the deploy would actually hit — not a style
preference.

## Scope

IN: `src/prototypes/ehel-academy/science/**`, its builder
(`tools/build-ehel-science-runtime.js`), its narration definition
(`tools/lib/ehel-science-narration.js`), its gates, and its two deploy tiers on
Bunny (`content/science/gNN/`, `media/science/gNN/audio/tts/`).

OUT: english, mathematics, computing, global-perspectives, intensive-english —
other sessions own these. If you find something in them, report it, don't touch it.

## Severity

- **Blocker** — a learner sees something wrong, or the deploy is inconsistent
  (missing clip, broken answer key, unreachable content, adult-voice text).
- **Risk** — correct today but silently fragile (a check that can't fail, a
  duplicated definition, an unverified assumption).
- **Polish** — cosmetic, no learner impact.

## 1. Content integrity

- Run `npm run check:science`, `npm run validate:curriculum-units`,
  `npm run validate:frameworks`. Report failures **and** report any gate that
  passes vacuously.
  - Specifically: confirm whether `validate:curriculum-units` actually covers
    science. Read its glob in `package.json` before trusting a green result.
- Across all 53 units, check for: empty or truncated required fields; text that
  stops mid-sentence; adult- or teacher-addressed prose on a learner surface;
  scaffolding that leaked from the source pack (column headers, layout tags,
  placeholder titles); duplicated content across units.
- Every assessment/game answer must be among its options. Check `answer`
  vs `options` and `choices` for all questions and rounds.
- `science/data/script-review.json`: every override must still resolve to a live
  item. A stale override is silent — the reviewer's correction simply isn't there.

## 2. Narration

- Every Listen button must resolve to a real file. Derive the button text from
  `science/shared/course-ui.js` itself, not from the generator — otherwise you
  are only proving the generator agrees with itself.
- `node tools/prune-ehel-course-audio.mjs science` → expect 0 orphans.
- `node tools/prune-ehel-course-audio-on-bunny.mjs science` → expect 0 unreachable.
- Clip integrity beyond existence: every file a valid MP3, and **no truncated
  clips**. Existence is not enough — the generator reuses any file over 1 KB, so
  a truncated clip is never re-bought. Flag clips whose duration is implausible
  for their character count (chars-per-second outlier).
- **Hash equality proves the filename, not the audio.** Spot-check that a clip
  actually says its current text, especially any regenerated recently.

## 3. Deploy consistency

- The course reads `./media/audio/tts/<hash>.mp3` in dev but
  `../../media/science/g<NN>/audio/tts/<hash>.mp3` in production. The per-grade
  tree is produced **only at upload time** — there is no copy in `dist/`.
  Verify production paths resolve for every grade, not just locally.
- Content tier: confirm `content/science/gNN/` matches the built data
  (hash manifest, `.bunny-content-manifest.json`).
- Check every asset a unit references actually exists — images, WebGL scenes,
  diagrams — in both dev and production layouts.

## 4. App behaviour

- Load every stage × unit combination. Report console errors, failed network
  requests, and any section that renders empty.
- Exercise each of the ~20 unit sections at least once: quiz scoring and pass
  threshold, games, fluency timer, progress persistence, the AI tutor's failure
  path when the endpoint is unavailable.
- Check keyboard navigation and screen-reader labelling on the Listen buttons and
  quiz controls, and mobile/responsive layout at a phone width.
- Confirm graceful behaviour when a clip 404s (it should fall back, not break).

## 5. Known traps — verify these specifically

These have all produced real defects in this course:

1. **The review overlay outranks the builder.** `script-review.json` is applied
   *after* `buildUnit` and never passes through `tidy()`, so a builder fix cannot
   reach any field a reviewer touched. Check for fixes that appear applied in the
   builder but are overwritten in the output.
2. **Positional ids.** `mistake-N`, `rule-N`, `activity-N` are derived from array
   position. Removing one renumbers the rest and silently invalidates any
   override keyed to it.
3. **Tag stripping vs section detection.** `grab()` ends a section on a heading
   word. Text normalisation that removes a leading tag can turn a paragraph into
   a section boundary and delete the content behind it.
4. **Gates that can't fail.** Confirm each check would actually catch the thing it
   exists to catch — try breaking it deliberately.
5. **Shared working tree.** Other sessions commit to this repo concurrently.
   Confirm the science files in `HEAD` match disk before drawing conclusions.

## Output

A single report, ordered Blocker → Risk → Polish. For each finding:

- what is wrong, and the file/unit/grade where it shows
- how it reaches a learner or the deploy
- the evidence you ran (command + result), not an assertion
- suggested fix, and whether it costs ElevenLabs characters

End with an explicit **ship / don't ship** call and the shortest path to green.
State anything you could not verify and why — an unverified area named is worth
more than a green tick that wasn't earned.
