<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

### English narration audio

English is the exception to everything above. Its clips are named for their
content (`eng-g05-t01-u03-read01.mp3`), not for a hash of their text, and
`generate-ehel-english-audio.js` reuses any mp3 over 1 KB that already exists.
So editing a sentence leaves the old recording in place, still `available:true`,
and nothing notices. Every other subject orphans the clip automatically because
a changed text mints a new filename. This one cost 853 stale clips: 306 found
by listening, and 547 more that only git could see.

Four checks cover it, and each is blind to something the next one sees. Run them
together or you are only covering a third of the failure surface.

```bash
python tools/check-ehel-english-audio-integrity.py   # descriptors, files, format, duration
python tools/check-english-audio-staleness.py        # git: text edited since the recording?
python tools/audit-ehel-english-sentence-audio.py --grades 1 --categories all
python tools/check-english-word-audio.py             # the single-word clips
```

- **Integrity** reads file size and frame headers, needs no model, and runs in
  seconds. It catches a missing file, an HTML error body written to an `.mp3`
  path, and gross truncation. It cannot tell whether a clip says the right
  words: it reported 0 problems across 16,955 clips while five Grade 1 overviews
  were saying "my name is Taken Seat".
- **Staleness** asks git whether the narrated text changed since the commit that
  wrote the mp3. Deterministic, free, no transcription noise, and the only tool
  that finds a rename: a sentence differing only in who it is about scores ~0.95
  by word and sails through the audit. Measured, not guessed — two random
  samples of 344 clips contained roughly 22 such defects between them and the
  audit found one, so expect it to catch about 1 in 20.

  **Check the clip count it reports.** It should say 16,948, and for one day it
  said 1,898 while reporting zero stale, because it keyed clips by
  `readingId`/`speakingId`/… and the 10,355 vocabulary sentences, 2,211 meanings
  and 1,889 dictionary words are bare audio descriptors nested in their parent
  item with no id of their own. 85% of the course went unexamined and 547 stale
  clips sat behind that clean result. It counts what it cannot identify and
  prints the number; a non-trivial figure there means it is skipping work, not
  finding nothing.

  It compares *commits*, so a freshly regenerated clip reads as stale until
  committed. That answer is correct — the CDN still has the old one.
- **The transcription audit** compares the recording to its script by WORD.
  Never by character: difflib cannot realign after a few early differences in a
  long passage, and a Grade 4 reading differing by seven words in 189 scored
  0.48. It reports proper nouns the recording never says, but never fails a clip
  for them — Whisper renders unfamiliar names unpredictably ("Tariq" as
  "Tareek"), and that overlaps the range real drift occupies.
- **The word check** never transcribes. On 0.6 seconds of audio Whisper
  hallucinates ("mouth" comes back as "Please subscribe"), so it asks whether
  the audio ranks the right word above its rivals instead. Homophones are
  undecidable by anything that listens, so a clip passes within a margin.

**A re-recorded clip uploads normally, and this note used to say the opposite.**
The manifest stores a CONTENT HASH, and the skip decision is a comparison, not a
lookup:

```js
// tools/upload-media-to-bunny.js
for (const item of all) item.hash = sha1(fs.readFileSync(item.local));
const todo = all.filter((x) => manifest[x.remote] !== x.hash);
```

New bytes mean a new sha1, so a re-recorded clip lands in `todo` even though its
path is in the manifest. Verified rather than reasoned — `upload-media-to-bunny.js
english --dry` after a Grade 8 repair queued both re-recorded clips, including the
one that kept its exact filename. **Do not drop manifest entries before a repair;
there is nothing to drop.**

A narrow legacy case exists in principle — entries written before the manifest
stored hashes carry no hash to compare, so their contents cannot be verified from
here; they upload once, gain a hash, and behave normally afterwards.

**But the tool's own count of them is wrong, and the run above did NOT report a
real one.** `upload-media-to-bunny.js:223` is

```js
const legacy = todo.filter((x) => x.remote in manifest).length;
```

which tests key PRESENCE. A re-recorded clip is in `todo` precisely because its
stored hash no longer matches, and its key is of course still present — so it is
counted and then described as "recorded before the manifest stored hashes", which
is the opposite of its state. The single entry that run reported was the
re-recorded connoisseur clip, whose stored value was
`de8f342ca360ff4c34c358a021da3163979ef586`: forty hex characters, a perfectly
good sha1. Telling the two apart needs a test on the stored VALUE
(`/^[0-9a-f]{40}$/`), not on the key.

The uploads are correct either way; only the sentence is wrong. It is recorded
here because this passage is about not being fooled by a true fact about the
wrong property, and the count fooled the person writing the passage — the "one"
was cited as evidence of the exposed class while being an instance of the class
that had just been proved safe.

The correction is worth the space because of how the wrong version survived. It
was true when written, the behaviour changed under it, and on 2026-08-24 it cost
two sessions a wrong conclusion within minutes — one warned the other about the
trap, the other "confirmed" it, and **both had checked whether the path was
PRESENT in the manifest** when the tool compares hashes. Presence is a true fact
about the wrong property. Agreement between two people checking the same wrong
property is not a second opinion, and it reads exactly like verification.

The same family, one step quieter: a number that is RIGHT, printed at the right
moment, and reported without being interrogated. A release on 2026-08-26 printed
`plan 44 | uploaded 42` — correct, and the difference was exactly the thing being
argued about in the same conversation, unread by the person relaying it. That is
not a gate failure and no check can catch it; it is the reason a figure you are
about to repeat is worth subtracting once first.

**The half of the old note that WAS right is about browsers, not the manifest,
and it is unchanged**: a re-recorded clip that keeps its filename keeps its URL,
so every learner who has already played it holds the old audio for up to a year
whatever the uploader does. `AUDIO_RELEASE` in `shell/subjects/english.js` is the
only lever — see "Re-rendering without a text change strands every learner who
already listened" below. A repair that renames the file is immune to that for
free, which is a real reason to prefer one, and is unrelated to the manifest.

#### A suppression outlives its cause, and nothing is looking for that

A Grade 1 pattern slide read "ElevenLabs audio pending" with no Listen button.
The descriptor said `available: false, status: "Refused - the script is a
fill-in-the-blank frame; needs a spoken form"`, and that was true when it was
written and false for thirteen days before anyone asked.

Two commits, twelve days apart, disagree. `c21fa23c9` (2026-08-06) made the
generator refuse any script holding a run of underscores and deleted the 562
clips already made from one, because ElevenLabs improvises into the gap -- "This
is a dirisan dog". Re-recording could not help while the blank was in the source
text, so the descriptors were kept as a record that narration was owed.
`e7a80279e` (2026-08-18) then fixed the cause: `speakableBlanks()` in
`lib/ehel-tts.js` rewrites `_{2,}` to "blank" in the narrated text alone, leaving
the displayed `___` untouched. `narration()` applies it BEFORE the refusal tests
the text, so the refusal has been unreachable ever since -- and 297 descriptors
went on declaring a need that had been met. 265 clips whose scripts contain
blanks had been live and shipped that way the whole time, which is what makes it
a stale record rather than an open question. Re-recorded 2026-08-31, 85,175
characters.

**Nothing in the repo could report this, and that is the transferable half.**
Every gate passed throughout: `check:english` green, audio integrity green, the
staleness checker green -- a suppressed descriptor is a legitimate state, so a
gate cannot tell "we decided not to narrate this" from "we forgot to come back".
`available: false` is the one descriptor value that means *work is owed*, and
nothing counts them or asks how old they are. The 5,586 `meanings` placeholders
sitting behind the same flag are why a bare count would not do it either.

**And the repair tool goes dangerous in silence when the thing it repairs is
fixed.** `suppress-ehel-english-blank-narration.py` tested the RAW field while
the generator tests `narration(text)`, so the two answered opposite questions
from 2026-08-18 onward -- and the destructive one was in the tool that deletes
files. Run unchanged on 2026-08-31 it proposed to silence **560** working clips
and delete their mp3s. Its own docstring promised the two rules could not
disagree. It now mirrors the transform (`speakable()`), so `--dry` reports 0; the
560 is the mutation test, since that is what the broken version reported.

Nobody was going to run it, which is exactly why it was worth running `--dry`
rather than reasoning about it. Same shape as the dead second gate in Science:
a line that is correct, unreachable, and one upstream change away from meaning
something else.

#### A blank is a pause and a slash is never spoken (owner, 2026-09-03)

```bash
npm run check:speakable-frames   # also chained into check:english, ~10s
```

The owner heard "This is a / an ___" narrated with the slash and the word
"blank" in it and set the rule: **"Fill in the blank: This is a ... Fill in
the blank: This is an ..."** — one sentence per alternative, the blank a pause,
never a "/". `speakableFrames()` in `tools/lib/ehel-tts.js` is the one
definition and REPLACED `speakableBlanks()` in `narration()`; the word "blank"
is no longer narrated anywhere in English. The slash means four things in this
content and each is read as a teacher would read it: a bracketed choice
`(two / too)` → ", two or too,"; two bare alternatives `a / an` → the
expansion above inside a frame with a blank, "a or an" anywhere else; a list
of three or more `am / is / are` → "am, is, are"; a slash after punctuation
(`Stop. / Go.`, poem lines) → dropped. "Fill in the blank:" is said once per
clip unless the clip has already announced the gap ("Write the missing word").

Three things worth knowing before touching it:

- **The Python mirror is `tools/lib/ehel_speakable_frames.py`**, imported by
  the lecture tool and the suppression tool, and the gate runs the same cases
  through both — "keep in step by hand" is only a rule if something checks.
- **The transform inserts private-use characters for the pause and the comma
  it adds, and tidies only those.** The first version tidied every comma and
  ellipsis in the course, and the before/after script diff showed 60 clips
  with no blank and no slash re-recording for nothing. The diff of emitted
  scripts (`--emit-scripts`, before and after) is the review surface for any
  change here; the gate cannot see collateral, only leftovers.
- **Phoneme notation `/m/` is not a slash between words** and the gate strips
  it before looking. It survives only in the withdrawn Grade 1 Unit 0 teacher
  plans, already a recorded finding of `check-english-content`.

Changing the rule moves the fingerprint of every clip whose script it touches,
so the generator re-narrates them on its next run of that category — 745 clips
and ~418k characters at the time of the change. That is a paid step and an
owner decision; the code change alone ships nothing.

#### The defect no check here can catch: the voice says the wrong word

`toe` in the Grade 2 dictionary was narrated as "two". The entry was right, the
script was right, the dates matched, and re-recording reproduced it exactly — a
fresh render from the correct text still transcribed as "2" and still ranked
`two` (-0.95) far above `toe` (-5.66). ElevenLabs simply mispronounces the word
with this voice.

Nothing above finds that. Staleness sees matching dates; the audit sees a
recording that faithfully matches its script, because it does — the error is
upstream of the text. Only the word check caught it, and only because a
one-word clip gives the error nowhere to hide: the same mispronunciation inside
a sentence is one word in two hundred and scores ~0.99.

**The fix is `speechSpelling` on the dictionary entry**, which changes only the
text sent to ElevenLabs — the learner still sees `displayWord`. `toe` now sends
`tow`, a homophone the voice reads correctly: the clip transcribes as "Toe" and
the word check passes Grade 2 clean. `speechSpellingReason` records why, beside
the data rather than in a commit message.

Find the respelling by testing, never by reasoning about it. What the voice does
with a spelling is not predictable from the spelling, which is the whole defect:
of six candidates, `toh` came back as "So", `toe.` and `Toe` were no better than
the bare word, and only `tow` worked. Each render is three characters, so a
search costs less than one sentence — generate the candidate, rank it with
`check-english-word-audio.py`, keep what ranks the printed word first.

Use it only where a render has been shown to be wrong. It is a way to make the
voice say the printed word, not a way to change the word.

#### Re-rendering without a text change strands every learner who already listened

**This is not an English problem. The trigger is "same text, new recording",
whatever the subject.**

Bunny serves media as `Cache-Control: public, max-age=31536000` with no ETag, so
a browser that has played a clip holds it for **a year** and never revalidates.
Whether a repair reaches a learner therefore depends entirely on whether the URL
changes:

- **Text edited** — a hash-named subject (Science, Mathematics, Computing,
  Global Perspectives, Intensive English) mints a new filename, so the URL
  changes and the learner refetches. Safe by construction. **English is not one
  of those subjects and this bullet does not cover it** — see below.
- **Text unchanged, clip re-rendered** — same hash, same filename, same URL. The
  CDN is correct, the manifest hash matches, every check passes, and the learner
  keeps the old audio for a year. Nothing in the repo can see it.

The realistic trigger is a **voice change** (a new `VOICE_ID`, or regenerating a
grade), and `speechSpelling` is the other: it exists to fix a mispronunciation
*without* changing the displayed text, so a respelling applied to a clip already
in production is exactly this case.

**In English the commonest trigger is an ordinary content repair, and it fires
even though the text DID change.** English names its clips for their content slot
(`eng-g05-t01-u03-read01.mp3`, `u7-g1-32-32-connoisseur-meaning.mp3`), not for a
hash of what they say. So correcting a wrong definition re-records onto the same
filename: the words changed, the URL did not, and every learner who already
played it keeps hearing the old wording for a year. The five hash-named subjects
get a new filename from the same edit and are immune; English is the one subject
where "the text changed" does not imply "the URL moved", and it is the one
subject the stamp exists for. Worked example on 2026-08-24: Grade 8 Unit 7's
`connoisseur` had been teaching an invented meaning, `55c0d2ed7` restored it from
source and `08ecfbb66` re-recorded, and `AUDIO_RELEASE` went `20260819a` →
`20260824a` in English v264 — the repair itself reached storage and the edge
correctly and would still have reached nobody who had listened.

**Exposure is per CLIP, not per repair, so ask it of each file.** That same
repair touched two meaning clips and only one of them needed the stamp: the
glossary clip was RENAMED (`32-connoisseur-meaning.mp3` →
`connoisseur-meaning.mp3`), which moves the URL and busts browser caches for
free, while the vocabulary clip kept its filename and did not. One repair, two
clips, two different answers. A rename is the cheaper fix wherever the filename
is not load-bearing; the stamp is what covers the ones that must keep their
name.

English hit the general version of this and carries the fix: `AUDIO_RELEASE` in
`shell/subjects/english.js` stamps audio URLs with `?a=<date>`, bumped whenever
English audio is re-uploaded. It works because the pull zone **ignores query
strings when caching** — verified, not assumed: `?a=20260814` and
`?a=zzz-nonsense` against a clip that had seen neither both returned
`CDN-Cache: HIT`, byte-identical, off the bare path. So it busts browsers and is
invisible to the edge, unlike a version *segment*, which would risk a cached 404
on a path that cannot be purged.

The other five subjects have no such stamp. If one ever re-renders audio without
changing the text, it needs one — copying English's is a few lines — or a purge,
which needs an account-level key that is not in `.env`.

**The stamp does not reach the EDGE, and the edge does not refresh on a storage
overwrite either — measured 2026-09-03.** After the frame-narration re-record
(745 clips under their existing names, stamp bumped twice, v394/v395 live), a
sweep fetched every one of the 745 through the pull zone and compared bytes
with the committed recording: 737 fresh, **8 stale** — all Grade 1, all
`CDN-Cache: HIT` with a `CDN-CachedAt` between 2026-08-26 and 2026-09-02, i.e.
cached by a learner's play BEFORE the new bytes reached storage. Storage held
the new file; the edge kept serving the old one, with the `?a=` stamp on the
request. So "the repair itself reached storage and the edge correctly"
(connoisseur, above) was true of a clip nobody had played, not a property of
the pipeline. The exposure is exactly the clips that were popular before the
repair, which is the worst possible selection. The only remedies are a purge
by URL (dashboard, or the account key) or a rename. **After any same-name
re-upload, sweep the edge** — fetch each clip through the pull zone and compare
sha1 with the file — and hand the stale URLs to whoever holds the account key;
the fact that a stamp went live proves nothing about the edge.

#### The English CDN orphan pruner, and why it needed writing

**`tools/prune-english-audio-on-bunny.mjs`** now covers this. Report by default,
`--delete` to remove, `--json` for the numbers. First run on 2026-08-24: 93,086
files on the zone, 93,591 reachable paths, **57 named by no descriptor (12.4 MB),
all 57 since deleted — the zone reports 0 orphans.**

The 57 were three groups, and their coherence is what made them safe to remove:
36 US spellings stranded by the UK-vocabulary decision of 2026-08-17 (verified,
not inferred — `apartment`/`elevator`/`janitor`/`mold`/`railroad`/`emphasize`
all unclaimed while `flat`/`lift`/`caretaker`/`mould`/`railway`/`emphasise` are
all claimed), 12 `conclusion` clips from the duplicate-word repair, and 9 whose
text moved.

**Reachability is the claim map, and BOTH halves of it.** `clipGradeMap()` is
what the app will play; `suppressed()` is descriptors carrying
`available: false`, and those are NOT orphans — they are the state a repair
leaves between deleting a wrong recording and paying for its replacement.
Mutation-testing that rule is what proved it load-bearing: unprotecting
`suppressed` moves the count 57 → 63, so the tool would have deleted six clips
somebody was about to re-record. Two other mutations must also fail — an
unrecognised argument (exit 2, because the default action here deletes from live
storage) and a claim map that resolves nothing (exit 1 below a 5,000 floor,
rather than reporting the whole course orphaned).

**Run the deployed check separately; the tool cannot do it for you.** It reasons
from the repo, and the repo is not evidence about the CDN — a content file may
not have been re-uploaded. Before the deletion above, all 223 deployed Grade 1-8
content files were enumerated from storage and fetched through the edge: zero
references to any of the 57. Without that, a clip the deployed content still
named would have become a silent fallback to the paid runtime TTS endpoint, on a
404 Bunny caches and the key in `.env` cannot purge.

Why it had to exist at all: both older pruners take the same five subjects, and
English is not one of them:

```js
// tools/prune-ehel-course-audio.mjs  AND  tools/prune-ehel-course-audio-on-bunny.mjs
const SUBJECTS = ["science", "mathematics", "computing", "global-perspectives", "intensive-english"];
```

They also only ever look inside `media/<subject>/g<NN>/audio/tts/`, the
hash-named tree. English clips are named for their content slot and live under
`media/english/g<NN>/audio/{glossary,vocabulary,…}/`, so they are outside the
search path as well as outside the subject list — two independent reasons the
tooling cannot see them.

The consequence is only on the CDN. A stranded English clip on DISK shows up in
`git status`, because English clips are committed; a stranded clip on STORAGE was
reported by nothing, costs a paid upload once and storage for ever, and — the
part that matters — **is the last surviving copy of audio that was deleted for
being wrong.** `32-connoisseur-meaning.mp3` sat on the zone from 2026-08-20
saying an invented definition, through the repair that deleted it locally and
the re-record that replaced it, until it was removed by hand on 2026-08-24.
Doing that by hand is what prompted the tool.

If you ever do it by hand again, getting the ORDER wrong is the thing to avoid. Dereference first,
delete second, because Bunny caches a 404 on a path that cannot be purged with
the key in `.env` — so a file deleted while something still asks for it becomes
a permanent hole rather than a recoverable mistake. The sequence that worked:

1. Confirm zero **exact** references in the repo's data for that grade.
2. Confirm zero exact references in each **deployed** file of that grade —
   `sentence-glossary`, the unit, `master-dictionary`, `games/<unit>`,
   `course-manifest`. The repo is not evidence about the CDN; a file may not
   have been re-uploaded.
3. `DELETE` the object through the storage API, then re-list the directory and
   check the count fell by exactly one.
4. Drop the path from `.bunny-upload-manifest.json` — same reason the math
   pruner does it, so a later regeneration of that exact text uploads instead of
   being skipped as already sent. Splice the entry out rather than
   re-serialising: that file is one 13.8 MB line and several sessions write it.

**Match exact quoted paths, never substrings.** This vocabulary is built to
defeat a substring grep, and it did so three times in one session:
`32-connoisseur-meaning.mp3` is a substring of the live
`u7-g1-32-32-connoisseur-meaning.mp3`, and it differs from the live word clip
`32-connoisseur.mp3` by one suffix. A `grep -c` for the orphan's name reported
references that were not references, in the repo and again in the deployed unit.
Extract `"([^"]*)"` and compare whole paths.

### The English content gate

```bash
npm run check:english     # node tools/check-english-content.mjs
```

English is hand-authored, so it had no builder to hang a gate on and went
without one — which is how six teacher lesson plans came to sit in a Grade 1
learner's Reading section, narrated, with nothing in the repo saying so.

It deliberately does **not** repeat `validate:curriculum-units`, which owns
per-unit structure, xrefs and the Cambridge mapping. This one covers what
nothing read: cross-file agreement (manifest vs unit title, id, term,
`vocabularyCount`), **who the text is written for**, answer keys in both course
assessments, live audio existing on disk, and that every countable section is
non-empty — an empty one can never be completed, and the unit gate then holds
the rest of the grade shut for good.

**The exemption is `audience: "adult"`, never a `type` string.** Adult-addressed
prose is legitimate only in text marked that way (drawn behind the grown-up
panel) or in a unit's `grownUpGuide`. `validate-unit.mjs` already looks for a
leaked teacher-guide header and then exempts any reading whose type matches
`/phonics/i` — and the six Grade 1 plans are typed "Teacher-led phonics text",
so that exemption swallowed every one. A check whose escape hatch is a
free-text label is one the content can talk its way out of.

Two patterns that cost real accuracy, both found by measuring rather than
reasoning:

- **A phoneme pattern must require its brackets.** Bare `/[a-z]{1,3}/` also
  matches the slash ALTERNATIONS grammar teaching is full of — `am/is/are`,
  `he/she/it`, `in/on/at` — and reported 18 of them as narrated defects across
  Grades 4-8, nearly half of the first run's findings. The opening slash may not
  follow a word character and the closing one may not precede one.
- **Options are stored two ways.** Unit quizzes and both course assessments use
  a pipe-separated string (`"see | smell | taste"`); some carry an array. Reading
  only arrays reported all 36 Grade 8 placement questions as having no options.
  `optionsOf()` is the one parser.

**The baseline may only shrink.** The gate was written after the content, so it
opened on 16 real failures; they live in `english/data/content-gate-baseline.json`
so the build stays green and every one stays visible. A failure not in the
baseline fails; a baseline entry that *stops* firing **also** fails, asking to be
deleted — so the file cannot rot into a permanent amnesty. Its diff is the review
surface. Regenerate deliberately, never to get green:

```bash
node tools/check-english-content.mjs --write-baseline
```

#### Writing the gate is what finds the bug — the worked example

The cursive worksheet prints a unit's grammar exercises with lines to write on,
and 149 of its 1,047 practice pieces carry the ANSWER KEY. `english.js` cuts each
piece at the key marker so the answers do not print on the learner's own page.

The first version of that filter was anchored with `^`. It matched the **45**
pieces that START with a key and missed the **104** that append one to the last
question — `5. ______ is your teacher? Check yourself: 1. Who 2. What…`. Those
104 printed the answers, on children's worksheets, in production.

**Nothing found it, because nothing was looking.** The sheet rendered. The page
count was exact to the page. Every other check passed. The only thing inspecting
that filter was the filter itself. It surfaced within an hour of somebody sitting
down to write a gate for it — not from suspecting the filter, but from being made
to state its behaviour precisely enough to test. Every other gate in this file was
written after something broke; this one broke something by being written.

**A floor is only half a gate, and it is the half that cannot find anything new.**
The obvious check is to record the count and fail if it drops. That catches a
pattern which STOPS matching. It cannot catch a new wording in new content,
because the existing matches keep matching and the number never falls. So
`check-english-content.mjs` carries two halves:

- the floor, which tests the filter that was already written, and
- an **independent detector keyed on STRUCTURE, not wording** — a dense run of
  three or more numbered short answers is an answer key whatever it calls itself.

The structural half earned its place immediately, finding `Answer key, Part A: 1.
visited, 2. gave…` where a comma and a part label sit between the words and the
answers so the marker never matched. Keying that detector on wording was tried
and is useless: "then check yourself against the answers" is an ordinary
instruction, and four of five flags were those.

The general rule, and it is the same one the deploy section reaches from the
other direction: **a check that must be told what to look for can only find what
has already gone wrong once.** Structure is what you can test without knowing the
wording; wording is what you can only test in hindsight.

One calibration is recorded in the code and matters if the sheet ever grows: the
answer-run detector runs at Grades 1-4 only, the grades the worksheet prints.
Above that the same shape IS the exercise list, so extending the sheet upward
needs the detector recalibrated first.

**Mutation-tested five ways**, each of which must fail the gate: revert the filter
to the `^`-anchored version, a pattern that matches nothing, drop one wording from
it, drop the comma-and-part-label tolerance, and rename the declaration so the gate
cannot read it. All five caught, and the gate passes again on restore.

**But note what that suite does NOT prove.** Every one of those mutations damages
the PATTERN, so every one lowers the match count, so the floor alone catches all
five — the structural half is redundant against its own mutation suite. The case it
exists for is a new wording in NEW content, where the existing matches keep matching
and the count never moves, and no mutation of the pattern can simulate that.

So the structural half's necessity is not established by the mutations; it is
established by what it actually found — three leaks the pattern had never
anticipated, including the comma form that was printing at Grade 4. Worth stating
plainly, because "mutation-tested, all caught" reads as proof that every part of a
gate is pulling its weight, and here it is not.

### The one print path, and the page count that runs short

`printCursiveWorksheet` in `shell/subjects/english.js` was the **only** thing in
this repo that printed until v390 — the sole `@page` rules, the sole
`window.print()`, the sole `break-inside: avoid`. Everything below was learned
while it had no second example to compare against, which is why it was worth
writing down the first time. There are four print paths now; the other three are
the section after this one, and they are the second example.

**`break-inside: avoid` cannot save an element taller than the page.** The engine
breaks it regardless, and it spans as many pages as it needs. A page counter that
treats every item as unsplittable therefore runs SHORT — it counted one page for
something occupying two. Grade 4's longest grammar item measures 1,697px against
a 1,017px page, and the small sheet came out a page under. The fix is in
`worksheetPageCount` (`if (itemHeight > pageHeight)`, spilling by
`Math.ceil(itemHeight / pageHeight) - 1`).

Two things about how it was found, which is the transferable half:

- It surfaced as an **11-vs-12 mismatch between the estimate and the produced
  sheet**, not by reading the CSS. The stylesheet says `break-inside: avoid` and
  looks correct; the rule is simply not honourable at that size. Reading the
  declaration tells you the intent, never whether the engine can meet it.
- The estimate and the output are two independent computations of the same
  number, which is the only reason a discrepancy could show up at all. Keep them
  independent — a page count derived from the rendered output would have agreed
  with itself and been wrong in silence.

If a second print path is ever added, this is the first thing to check, and
`worksheetPageCount` is the worked example.

### There are FOUR print paths now, and the full sweep is a release step

`printCursiveWorksheet` stopped being the only one in v390. Student resources
draws three more — Core words by week, the Unit plan, the Grade plan — built by
`printSheetCss()` / `openPrintSheet()` in `shell/subjects/english.js`. The
section above still holds for the worksheet; what follows is what the other
three cost to check.

```bash
npm run check:print-sheets      # all 240 sheets, ~2m20s
npm run check:english           # includes --quick: 24 sheets, ~30s
```

**An english release runs the FULL sweep and refuses to upload on a finding**
(owner, 2026-09-02). `deploy-app-version.js` calls `requirePrintSheets(SUBJECTS)`
before the upload AND before the zone lock: before the upload because this is the
one thing here whose damage lands on paper, where nothing reports back and no
rollback reaches the copies already in a folder; before the lock because it
renders for two minutes and asks about the working tree rather than about the
zone, so holding the lock across it would stall every other subject's release.
Its two siblings — `requireTiersInStep`, `requirePlatformCors` — run AFTER the
PUTs, because they ask whether what shipped is usable and the deploy stands
either way. `--skip-print-check` overrides, on the `--skip-route-check`
precedent.

**ENGLISH ONLY, and that is measured**: `data-print` / `printSheetCss` /
`openPrintSheet` appear 2/2/4 times in `shell/subjects/english.js` and **zero**
times in the other five subject modules, Intensive English included. The gate
only ever loads `/english/`, so aiming it at another subject would check nothing
while looking busy.

**The hook runs the full sweep; `check:english` chains `--quick`, and they are
not the same check.** Every assertion but one is a property of the SHEET rather
than of a unit's content — the four CSS rules and the `<thead>` come out of
`printSheetCss()` and the builders, so one sheet exercises them and more samples
add nothing. **Page count is the only thing that varies per unit**: the full
sweep sees Core words span 1-4 pages, `--quick` (unit 1 of each grade, ~30s)
sees 2-3. A Unit or Grade plan that grew onto a second page at unit 7 is exactly
what `--quick` cannot see and exactly what a content release changes.

Exit 1 is findings; **exit 2 means it could not run** (bad argument, no Chromium,
fewer than 12 sheets rendered) and the hook refuses on it too — a tick over a
comparison that never ran is this file's most-repeated failure, and the same rule
as `--after-deploy` exit 3. It renders the WORKING TREE off a static server, so
run it from the repo and not from a `git archive` release tree.

**It prints through Chrome, because nothing else answers the question.** The
gate renders each sheet with Playwright's `page.pdf()` — the same fragmenter
Ctrl+P uses. Two cheaper proxies were tried first and both produced FALSE
defects, which is the transferable half:

- **paged.js** is a JS polyfill that does not implement `table-header-group`, so
  it reported a missing column header on every continuation page and a stranded
  Week 4 heading. Chrome's real output has neither.
- **CSS multicolumn** is Chrome's own fragmenter and still wrong here, because
  print reprints a spanning table's `<thead>` and multicol does not — content
  therefore sits at different offsets and headings fall on different sides of a
  boundary. That version reported 8 orphaned headings across Grades 2-8; all 8
  were checked against the real print output and all 8 were fine.

So the orphan/split question is deliberately NOT asserted. Answering it
faithfully needs a PDF text layer — Chrome writes one glyph id per `Tj` against
a per-font ToUnicode CMap — for a question whose causes are all asserted
already. **A check that reports false failures is worse than an absent one: it
gets routed around, and then so does the rest of the gate.**

Two traps found by mutation-testing it, both bugs in the GATE rather than in the
sheets, and neither reachable by watching it pass:

- **The PDF page tree is NESTED.** A 20-page document carries `/Count` values
  `[8, 8, 4, 20]` — three subtrees and the root — so reading the first one
  returns a subtree size. Take the maximum, and cross-check it against the count
  of `/Type /Page` objects.
- **Row heights must be measured at the page box**, not at a default 1280px
  viewport. Text wraps differently at 182mm, so heights measured in a wide
  viewport describe a page nobody prints — and that assertion is what stands in
  for `break-inside: avoid`'s real limit.

The harness also aborted rather than mutate when the `@page` anchor matched
twice: `worksheetPrintChromeCss()` carries a byte-identical copy of
`@page { size: A4 portrait; margin: 14mm; }`. That is this file's own "a
mutation that survives is a claim about the mutation first" rule, arriving
before it could cost anything.

### The illustrated picture books (English "Books")

Every English unit ends with a shelf of animated picture books, across Grades 1
to 4 only (see the Grade 5 rule above). A unit's shelf holds more than one book,
and how many differs by grade — Grade 4 carries **five per unit** since
2026-08-21 and Grade 1 since 2026-08-27 (Grade 1's withdrawn Unit 0 keeps its
six). Do not hard-code the number anywhere: `unitEbooks()` resolves a
shelf from `ebookCatalog` by grade and unit, and `check-english-ebooks.mjs`
prints the per-grade totals, so ask the catalogue rather than a count written
down here. They are **generated SVG**, not artwork files:

```bash
npm run build:ebooks          # both grades' pages + the companion docs
npm run check:english-ebooks  # catalogue vs disk, and composition
```

Three files, one storyworld:

- `tools/lib/ehel-ebook-kit.js` — the shared palette, the animation stylesheet,
  the whole cast (Musa, Kiki, Duku, Lulu, Miss Twiga …) and the scenery.
- `tools/lib/ehel-ebook-kit-grade2.js` — Grade 2's ADDITIONS: Zuri the meerkat,
  the town, the classroom props, the bugs, the homes, the city, the aquarium.
- `tools/lib/ehel-ebook-kit-grade3.js` — Grade 3's: the HUMAN cast, from one
  parametric `person()`, plus the classroom, coast, forest and mountain.
- `tools/lib/ehel-ebook-kit-grade4.js` — Grade 4's: Maya and Sami, the post
  counter, the storm, the library cart, the cave, the stage, the attic and the
  capital.
- `tools/lib/ehel-ebook-kit-grade4-shelf.js` — the props and the extra cast for
  Grade 4's books two to five: the radio weather desk, the canyon, the bakery,
  the circular news wheel, the bridge under construction, the microwave and its
  worktop, the observatory, the ambulance, the station, the mall — plus Elena,
  Talia, the librarian, the mayor, Karim, the uncle, the governor, the lawyer,
  the caretaker and the labourer, and the four Unit 5 animals.
- `tools/lib/ehel-ebook-kit-grade1-shelf.js` — the props Grade 1's books three
  to five name and no earlier grade did: the rabbit, duck, frog and puppy of
  Unit 3, the whale and crocodile of Unit 8, the crown, clown hat, cape, mask
  and paper chain Unit 4 MAKES, the drum, keyboard and violin of Unit 6's Music
  Man, the aeroplane of Unit 7, and the onions, potatoes and beans of Unit 5.
- `tools/create-{musa,grade2,grade3,grade4}-ebook-illustrations.js` — the pages.
- `tools/create-grade4-shelf-ebook-illustrations.js` — the other forty Grade 4
  pages, one book per remaining reading in each unit.
- `tools/create-grade1-shelf-ebook-illustrations.js` — the other thirty Grade 1
  pages, three per unit for units 1 to 10.

**Grade 1's three added books are three KINDS of book, not three more stories,
and that is forced by the content.** A Grade 1 unit carries only three readings
— Story, Shared reading, Rhyme — and the Story was already book two, so Grade
3's trick of one book per unused text cannot reach five. Book three is the
unit's RHYME acted out, book four fills in the unit's SHARED-READING frame
("This is a ___. It is ___.") with that unit's own vocabulary groups, and book
five is a second animal fable. Book four is where the vocabulary revision
actually lives; do not read it as a picture list.

**Grade 4 is drawn by two generators, not one.** The first book on every unit
comes from `create-grade4-ebook-illustrations.js` and is built on that unit's
closing narrative; books two to five come from
`create-grade4-shelf-ebook-illustrations.js`, one per reading the first book
left undrawn. Four of the forty had no reading left to take (Units 1, 4, 5 and 6
carry four readings, not five) and are the next scene of one that is there —
Omar's second language, Sami's promised story, the posters for Simba, the
caretaker the parade story ends on. `write-english-ebook-docs.mjs` reads the
second generator's own book map to decide which tool an ATTRIBUTION.txt names,
so the list cannot drift from the generator.

**Look at the Grade 3 cast before adding a person.** `CAST` in
`ehel-ebook-kit-grade3.js` is longer than the Grade 4 additions suggest — Leo,
Theo, Daniel, Nadia, Doctor Sarah and Officer Rami are already there. Redefining
one in a later kit makes the same child two different children between shelves;
that was caught in review, not by a gate. Every NEW name needs three edits in
one commit: the preset, `TAP_VOICE_GROUPS` in `shell/subjects/english.js` (or
`check-english-ebooks.mjs` fails on the unresolvable `data-tap`), and the
`EXTENTS` list in `check-ebook-composition.mjs` — that last one silently prints
✓ for a character it has never heard of.

**A scene that draws its own sky furniture cannot also be given one.**
`nightScene()` includes a moon, so the Unit 8 star book — whose whole subject is
looking at the moon — put two moons on four pages. `starrySky()` in the shelf
kit is the same night without one. Same failure as the two suns on the Grade 2
shelf; check what the scene already contains before adding to it.

**Grades 3 and 4 share one cast, and it was not invented.** Amal, her
friend Nora, Teacher Yasmin and Omar the shopkeeper appear 604 times across the
ten units of the Grade 3 readings and carry on through Grade 4, which adds Maya
the young reporter. A shelf starring anybody else would contradict the lesson
beside it. **Read the unit before inventing anything** — nearly every book
borrows its unit's own device: the spelling contest, the calendar on the wall,
the two roads to school, the million shells, the Box of Ideas, the post counter,
the science-fair storm, the travelling library cart, the spiral cave, the
community parade, the school play, the attic telescope, the trip to the capital.

**How the people look was decided by the course's own artwork, not here.**
`english/assets/unit-8-home.png` shows East African children with natural hair
and bright everyday clothes and no headscarf; `english/assets/teacher-nuur.png`
shows the adult teacher in a hijab, cardigan and long skirt. The readings
describe almost nothing (only "Grandma Hana sat in the corner with her reading
glasses"), so the pictures are the source of truth. Check them before changing a
character.

**People carry `data-figure`, not `data-tap`.** A tap value promises a clip
exists, and there are no human voice clips on the shelf — the Grade 3 taps are on
objects and scenery only. The composition lint reads either attribute, so people
are still measured; give a person a `data-tap` only in the same change that adds
the audio.

**Adding to the shared kit is safe; changing it is a content edit.** The Grade 1
pages already shipped, so a tweak to the giraffe there repaints 156 pages a
learner has read. The same goes for `STYLE`, which is embedded verbatim in every
SVG: a new `@keyframes` rewrites all 156 files for a change nobody can see, which
is why Grade 2 motion reuses the existing classes only. When the kit was
extracted out of the Musa generator, the proof it was safe was that all 13 Grade
1 books regenerated **byte-identical** — do that again after any refactor here.

**An `anim-*` class and a `transform` attribute cannot share an element.** The
animation animates the `transform` property, which replaces the attribute
outright, so the element snaps to its parent's origin. Ten colour swatches
stacked into one that way and the page rendered with a single square on a
string. Put the translate on an outer `<g>` and the class on an inner one.

**Story text lives in `ebookCatalog` (`shell/subjects/english.js`) and nowhere
else.** The `STORY.txt` and `ATTRIBUTION.txt` beside each Grade 2 book are
generated from it by `tools/write-english-ebook-docs.mjs`; only the per-book
notes (unit, themes, cameos, vocabulary) are authored there. The Grade 1 folders
still carry hand-typed copies, which is the thing being avoided — a hand copy of
shipped text goes stale the first time a sentence is corrected, and the review
workbook then shows a reviewer a story the app no longer tells.

**Book narration is a pre-recorded clip per page** (`ebooks/<id>/page-NN.mp3`,
`tools/generate-ehel-english-ebook-audio.js`; all 3,430 Grade 1-4 pages since
2026-09-11). The shell reader (`playPageNarration(…, clipUrl)`, the whole-book
pop-up's `playClip`) and the standalone apps play it; only a clip that is
missing or broken falls back to the paid runtime voice (`aiVoiceUrl`). The
generator SKIPS any page whose clip exists, so a corrected page text is not
re-recorded until the old clip is moved aside — a new book's pages need a run
too. Also pre-rendered: the tap-and-story sound effects in `ebooks/tap-sounds/` — 34 clips, and **`playStorySound` takes
the raw key while a tap goes through `TAP_SOUND_ALIASES`**, so a page `sound:`
value that works as a `data-tap` can still be silent. The gate checks both paths
separately for that reason. Zuri has no cue of her own and is aliased to the
chick's chirp; three real ones are a paid ElevenLabs run away, and she must move
into `TAP_SOUND_MOOD_TYPES` in the same commit that adds them, never before —
the mood set asks for `zuri-happy.mp3`, and a missing file taps silently.

#### Two gates, because "the file exists" is not "the page is right"

`check-english-ebooks.mjs` reads the catalogue and the disk: missing
illustrations, a stale `page-NN.svg` left behind when a story got shorter, a
sound cue naming no clip, a `data-tap` that resolves to nothing, a book folder no
entry claims. It carries one recorded exemption — Musa's twelve superseded
`.webp` pages, kept because the (unwired) `validate-ehel-shared-english-ui.js`
still asserts them — and an exemption that stops firing FAILS, so the list cannot
rot.

`check-ebook-composition.mjs` measures whether the characters are inside the
frame. The kit multiplies the caller's `s` by `ANIMAL_SCALE` (2), so a figure at
`s: 1.4` needs ~180px of headroom below its standing point — arithmetic you
cannot eyeball while writing `y: 940`. The first Grade 2 draft had **147**
characters standing with their feet below the bottom edge and every page still
looked like a page. Grade 1 passes it clean, which is what calibrates the limit.

It walks the group tree composing transforms rather than matching a `<g>` and
looking ahead for a `data-tap` to name it. The lookahead version mis-read a small
drawing inside another prop — a picture of Zuri on an easel — as an unrelated
character, and reported four figures off-frame that were nothing of the kind.

**Its `EXTENTS` table is keyed on the ATTRIBUTE VALUE, not on the drawing
function, and for Duku those two names differ — so the gate had never once
looked at him.** `donkey()` draws him and tags him `data-tap="duku"`; the table
held `donkey`. An unknown name is skipped in silence, so 37 placements across
the Grade 1 and Grade 2 farm books resolved to no entry while the gate printed
✓ over them. Found 2026-08-27, while adding the Grade 1 shelf; adding `duku`
measured 37 more characters and all 37 are inside the frame, so nothing was
broken — the point is that the gate was green *because it did no work*, which is
the same shape as the ✓ printed after a skipped tier comparison and the endpoint
floor of 5 that cleared a parse finding 6 of 7. Audit the table against the SVGs
rather than against the kit:

```bash
grep -rho 'data-tap="[a-z0-9-]*"' --include=*.svg src/prototypes/ehel-academy/english/ebooks | sort | uniq -c
```

Every value there that names a CHARACTER needs a row, and a new animal that
carries `data-figure` without a `data-tap` (because no clip has been paid for)
needs one too — that attribute is the only thing making it measurable.

Both gates were mutation-tested: each invariant was broken in turn and the gate
had to fail.

Two repair tools exist for defects the gates found; both are idempotent and both
print what they changed, so their output is the review surface:
`repair-grade2-ebook-standing-lines.mjs` (lift a character back into frame) and
`repair-grade2-ebook-shadow-lines.mjs` (put a cast shadow on its owner's ground
line — which is `y + 112 * s`, not `y`).

**Look at the pages.** Every defect above passed both gates at some point, and
several were only visible in a rendered contact sheet: two suns in the sky on the
pages about where the sun is (`basicScene()` draws one, and the page added
another), a cast shadow that read as a stick, a hut whose walls sat a half-width
left of its roof, a tree house floating above a trunk that stopped short of it, a
white spider web invisible against a pale sky, and an aquarium hanging in a grey
void with the visitors standing on nothing.

### `check:print-sheets` can deadlock, and it gates every English release

Observed 2026-09-07: **25 minutes of wall clock for 19s of CPU**, no output,
Chromium and node both resident. Against its own ~2m20s estimate. It happened
three times running — twice inside `deploy-app-version.js`, which calls
`requirePrintSheets()` before the upload, so the release never started.

Low CPU against long wall clock is what separates deadlocked from slow, and it
is worth measuring before concluding either: an earlier call of "hung" here
rested on a 60-second timeout against a 140-second job, which proved nothing.

The suspected cause is contention — Playwright wants its own Chromium, and this
machine was running five other dev servers. Not diagnosed further. `--skip-print-check`
exists and was used for v413/v414 with the owner's explicit go-ahead, on the
narrow grounds that no commit in those releases touched a print path
(`shell/subjects/english.js` last moved 2026-09-04, by somebody else). **That is
a per-release justification, not a standing one**, and a release gate that
cannot run is the same failure this file keeps recording from the other
direction.

