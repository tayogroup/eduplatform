# Grade 2 English — Self-Sufficiency Content Pass

## Mission

Ehel Academy English serves two populations: students with a live teacher, and
homeschool families with no teacher in the loop. The narrated content — readings,
grammar lessons, speaking prompts, and vocabulary — must be **sufficient on its
own** to teach a Grade 2 child the unit's content without a teacher present.
A parent or other adult may be nearby and welcome to help, but the content must
never *require* one to function.

Scope: **Grade 2 only, all 10 units** (`src/prototypes/ehel-academy/english/grade-2/data/units/unit-0.json` .. `unit-9.json`), all four content types (`readings`, `grammar`, `speaking`, `dictionaryLinks`/vocabulary). This is the pilot pass — once validated, the same five fixes repeat for grades 1 and 3–8.

Guardrails that apply to every fix below:
- Preserve the target vocabulary and grammar point each item teaches — never change *what* is being taught, only make the *delivery* self-sufficient.
- Preserve recurring characters (Amal, Leo, Nora, Theo, Maya, Samira, Sami, Teacher Yasmin, etc.) and their established traits/relationships rather than inventing new names, unless a unit's own cast requires one.
- Keep reading level appropriate to Grade 2 (short sentences, high-frequency vocabulary, the same register already used in the stronger existing passages like "Amal's First Week").
- Any item whose *text* changes must have `reviewStatus` reset from `"Approved - curriculum reviewer"` to `"Needs re-review (content updated for self-sufficiency pass)"` — the prior approval was for different text.
- Do not touch `audio.source` / `sentenceAudio` paths or `available`/`status` flags for items whose narrated text is unchanged.
- Where narrated text (`passageScript`, `explanation`, `ruleAndExamples`, `practice`, `instructionsAndModelLines`, `practiceSentences`) *does* change, the existing audio no longer matches it — flag those items so they re-enter the "needs generation" pool (matching the same tracking convention already used elsewhere: `status: "Pending regeneration"`, `available: false`).

---

## Fix 1 — Soften adult-dependency phrasing ("when available")

199 occurrences found in Grade 2 (168 in `dictionaryLinks[].aiTutorPrompt`, 18 in
`speaking[].instructionsAndModelLines`, 8 in `readings[].passageScript`, 5 in
`grammar[].practice`). Rewrite each so an adult's presence is optional, not
assumed. Match the specific phrasing pattern to a natural rewrite — do not
blindly append "when available" if it reads awkwardly; restructure the sentence
instead. Examples of the patterns actually present and how to handle them:

| Pattern found | Rewrite approach |
|---|---|
| "Ask an adult to read it aloud, then read it yourself." | "Ask an adult to read it aloud if one is nearby, or read it aloud yourself." |
| "Work with an adult and take turns to ask six questions..." | "If an adult is available, take turns asking six questions together. If not, ask and answer them yourself, out loud." |
| "Say them to an adult first, then..." | "Say them to an adult first if one is nearby, then..." |
| "Play this colour game with an adult or a friend." | "Play this colour game with an adult, a friend, or by yourself — point at objects and name their colour out loud." |
| "...while an adult listens with you." / "...with an adult beside you." / "...with an adult holding the tablet" | Rework to "...with an adult if one is nearby" and give the tutor itself as the fallback conversational partner (these are `aiTutorPrompt` fields — the AI tutor is already the built-in substitute for a live person, so the adult should read as an optional bonus, not a requirement to use the feature). |

Every rewrite must remain grammatically natural — read each one back before
finalizing, don't run a single global find-replace across all 199.

## Fix 2 — Backfill missing `masterWord`

`dictionaryLinks[].masterWord` is `undefined` on later Grade 2 units (confirmed
on unit 6; check all 10). Backfill from the existing `vocabularyId` /
`dictionaryEntryId` naming convention or the word visible in
`childMeaning`/`exampleSentence`, matching the pattern already correct on unit 1
(`masterWord: "apple"` style — lowercase, no punctuation).

## Fix 3 — Narrate word meanings (new audio category, scripts only — no generation yet)

Today only `practiceSentences` get narrated; `childMeaning` (the actual
definition) never does. Add a `meaningAudio` object to each `dictionaryLinks`
entry, structured like the existing `sentenceAudio` entries (`source`,
`normal`, `slow`, `provider`, `voiceId`, `model`, `slowPlaybackRate`,
`available: false`, `status: "Not yet generated"`), pointing at
`./media/audio/grade-2/vocabulary/{vocabularyId}-meaning.mp3`. Extend
`tools/generate-ehel-english-audio.js`'s vocabulary category to also produce
this clip from `entry.childMeaning`. **Do not call the ElevenLabs API for this
pass** — once the schema/tooling change is in, produce a spreadsheet of every
`childMeaning` script (same format as the existing narration-review workbooks)
for review before any generation runs.

## Fix 4 — Self-check answer keys for grammar/speaking practice

Grammar/speaking `practice` text (e.g. "Write he or she in each gap: 1. This is
my brother. ___ likes running.") has no way to self-check without an adult
grading it. Real interactive grading is an engineering project, out of scope
here — as the content-level fix, append a clearly-labelled answer key to the
end of each `practice` field (e.g. "Check yourself: 1. He 2. She 3. He 4.
She."), so a child can self-verify without anyone else present. Keep the
answer key visually/audibly distinct (its own sentence, after the exercise) so
it doesn't spoil the exercise the moment they start reading.

## Fix 5 — Enrich thin readings

Reading passages vary wildly in depth even within one unit (e.g. unit 1's
5-sentence "Words Around Us" vs. its ~500-word "Amal's First Week"). Identify
readings under roughly 150 words (excluding poems and songs, which are
intentionally short) and expand them into fuller passages at the same
standard as the strongest existing readings — real narrative or dialogue that
models the unit's target vocabulary/grammar in context, not just declarative
sentences. Keep the original teaching intent (title, `sourceFile`, target
concept) intact.

---

## Deliverables for this pass

1. All 10 Grade 2 unit JSON files updated in place with fixes 1, 2, 4, 5, and the fix-3 schema addition.
2. `tools/generate-ehel-english-audio.js` updated to support the new `meaning` narration category.
3. A new spreadsheet (matching the existing narration-review format) listing every `childMeaning` script for Grade 2, for review before generation.
4. A short summary of what changed per unit (counts of adult-phrasing rewrites, readings enriched, items flagged for re-narration).
