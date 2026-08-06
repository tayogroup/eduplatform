# Ehel Academy × EduPlatform — 2:00 infomercial

**Runtime** 120s exactly · **Format** 1920×1080, 30 or 60fps · **VO** 250 words, ~126 wpm average
**Audio** self-scoring — music and effects synthesised in-browser, no files
**Playable film** [ehel-academy-infomercial.html](ehel-academy-infomercial.html) — open it in a browser and press Play.

The film is the HTML file, not a storyboard of one. This document is the companion
for whoever records the voice-over, scores it, or cuts a shorter version.

---

## The idea

One child asks a good question at the wrong moment, and the system has no room to
answer it. Everything Ehel Academy sells — the curriculum, the tutor, the narration,
the live classes — is framed as an answer to that one question. The product only ever
appears as a consequence of a child's need, never as a feature list.

The girl is never seen. She is a voice-over and a progress bar, so any family watching
can put their own child in the frame.

---

## Timeline

Every timing below is read from the `SCENES` and `VO` arrays at the bottom of the HTML.
Change them there and the film changes; this table is downstream of that file.

| # | In | Out | Scene | On screen | Voice-over |
|---|----|-----|-------|-----------|------------|
| 1 | 0:00 | 0:10 | **Cold open** | Near-black. A question types itself in, word by word, in serif. Gold caret blinks. | *"At 8:14 on a Tuesday morning, a nine-year-old asks the best question of her life."* … *"And there is nobody free to answer it."* |
| 2 | 0:10 | 0:22 | **The problem** | 34 grey dots resolve in; one turns gold and pulses. A 40:00 clock burns down to zero and goes red, then the arithmetic lands: **= 70 seconds of attention each.** | *"One teacher. Thirty-four children. Forty minutes."* / *"The question loses. It always loses."* / *"So we built the school around the question."* |
| 3 | 0:22 | 0:31 | **Logo reveal** | Crest scales in over slow-rotating light rays. Wordmark resolves out of a blur. Gold rule draws. Tagline. | *"Ehel Academy. Kindergarten through grade 12, online."* / *"One community at a time."* |
| 4 | 0:31 | 0:48 | **The curriculum** | Five subject cards cascade in with Cambridge syllabus codes. Three counters tick up: 42 / 410 / 1–8. | *"Five Cambridge-aligned subjects…"* / *"Stage one through Stage eight. Forty-two courses. Four hundred and ten units."* / *"Every unit mapped to a published Cambridge objective. Every single one."* |
| 5 | 0:48 | 1:03 | **Wehel** | Chat panel. Learner: *"Why does ice float?"* Typing dots, then Wehel's reply types out live — a question back, not an answer. | *"And in every lesson, Wehel is waiting…"* / *"Wehel will not simply hand her the answer. It asks her what she thinks first."* |
| 6 | 1:03 | 1:15 | **Heard, not read** | A "Listen to this page" button, then a 30-bar waveform dances. Three language chips land: English / العربية / Soomaali. | *"Every explanation can be heard, not only read — narrated, word for word."* / *"With vocabulary in Arabic and Somali — because no child should leave her language at the door."* |
| 7 | 1:15 | 1:27 | **Placed, not guessed** | Parent dashboard. Four subject bars fill. A green tick stamps: *Unit 11 "The Big Sky" completed — 14 minutes ago.* | *"She starts with a placement check, not a guess about her age."* / *"And you see every unit she finishes — the moment she finishes it, on your phone."* |
| 8 | 1:27 | 1:39 | **EduPlatform** | A LIVE class card with a pulsing red dot and a Join button, then four role tiles: Learner / Teacher / Parent / School. | *"Because a curriculum is not a school. EduPlatform is the rest of it."* / *"Live classes with real teachers. One login for the learner, the teacher, the parent and the school."* |
| 9 | 1:39 | 1:49 | **Quraan Academy** | Five Arabic letters pop in, then the basmala in colour-coded tajweed. | *"Alongside all of it, Quraan Academy: the Arabic alphabet, then tajweed."* / *"Colour-coded, letter by letter, at her own pace."* |
| 10 | 1:49 | 2:00 | **Close** | Crest, wordmark, tagline, pulsing gold CTA, URL lockup with *powered by EduPlatform*. | *"Ehel Academy, on EduPlatform. A whole school, built around one child at a time."* / *"Enrolment is open now."* |

---

## Voice-over direction

One voice, warm, unhurried, mid-register. **Not** a hard-sell announcer — the first
twenty seconds are a story about a child, and an announcer read kills them. Think
documentary narrator who happens to be selling something.

- **0:00–0:22** — quiet, close-mic, almost confiding. Real pauses. Let the clock breathe.
- **0:22–0:31** — the turn. Warmth arrives with the crest.
- **0:31–1:39** — confident and clear. This is the proof section; the numbers should sound like facts, not boasts.
- **1:39–1:49** — soften again for Quraan Academy. Reverent, not solemn.
- **1:49–2:00** — direct address. "Enrolment is open now" is the only line that may sound like an advert.

Recommended pickups: the numbers in scene 4 ("forty-two courses, four hundred and ten
units") — get three reads, the meaning changes a lot with emphasis.

---

## Scene 2, explained

The second scene is arithmetic, not a slogan, and it is the load-bearing idea of the
whole film:

> **One teacher. Thirty-four children. Forty minutes.** → `00:00` → **= 70 seconds of attention each.**

Forty minutes shared across thirty-four children is about seventy seconds per child, and
the clock running to `00:00` is that time expiring. It is the reason the question in
scene 1 never gets answered — not a bad teacher, just arithmetic. Every product beat
afterwards is an answer to those seventy seconds.

The "= 70 seconds of attention each" line was added because the sum didn't read on
its own; viewers shouldn't have to do division to follow the premise.

---

## Music and sound design

**The film already scores itself.** Music and effects are synthesised live in the browser
with the Web Audio API — no audio files, so the page stays portable. Press **M** or the
🎵 button to mute.

The score is a step sequencer at 96bpm in D minor / F major, locked to the film's master
clock: scrub the film and the music scrubs with it. Its shape:

| Time | Score |
|------|-------|
| 0:00 | A near-silent low drone. A faint riser under the question. Almost no music. |
| 0:10 | Kick and hats enter. A clock ticks in real time, once every half second, for fifteen ticks. |
| 0:21 | **Everything cuts to silence** for one second, and a riser sweeps up. The silence is the transition. |
| 0:22 | Low boom + shimmer chime as the crest lands. Warm pad, no percussion yet. |
| 0:31 | Full arrangement: kick, hats, arpeggio. A blip per subject card, a chime when the counters land. |
| 0:48 | Thins out. Soft blip per chat bubble; the typewriter clicks a key every third letter. |
| 1:03 | Percussion drops to a soft pulse, a counter-melody carries the section. Blips on the language chips. |
| 1:15 | Steady again. A rising whoosh as the progress bars fill, a chime on the completion tick. |
| 1:27 | Bright. A sting on the pulsing LIVE dot, blips across the four role tiles. |
| 1:39 | **No percussion at all** under Quraan Academy — pad and a single melodic line only. |
| 1:49 | Full arrangement returns. Final boom and chime resolve on F at 1:58.6. |

If you replace this with a licensed track and a real voice-over, mute the built-in sound
and duck the music about −18dB under VO.

**Capturing the audio:** OBS must record system/desktop audio, not just the display.
Browsers won't produce sound until you interact with the page, so press **Play** (not just
Space on a freshly loaded tab) before you start recording.

---

## Exporting a video file

The HTML plays itself; you record it.

1. Open `ehel-academy-infomercial.html` in Chrome or Edge.
2. Press **H** for record mode — this hides the transport bar and the progress hairline.
3. Press **C** if you want the burned-in captions off (leave them on for silent autoplay on social).
4. Press **R** to restart, and capture with OBS (Display or Window capture, 1920×1080, 60fps, **plus desktop audio**).
5. Stop at 2:00 — the film freezes on the final frame and the clock stops.

**Keep the browser tab in the foreground while recording.** Browsers suspend animation
in background tabs; the film clamps its clock so it can't jump, but a hidden tab simply
won't advance.

The whole timeline lives in two arrays at the bottom of the file — `SCENES` (what plays
when) and `VO` (the script and its timecodes). Captions render straight from `VO`, so
editing a line updates the subtitle and the scratch track together.

**Scratch track:** the `🔇 VO off` button toggles browser speech synthesis reading the
script in time. It sounds robotic — it exists to check pacing before you book a voice
artist, not to ship.

---

## Claims in this film, and where they come from

Everything factual is read from `src/prototypes/ehel-academy/catalog.json`. If the
catalogue grows, these numbers are stale — recount before re-cutting.

| Claim | Source | Status |
|-------|--------|--------|
| 42 courses, 410 units | `catalog.json`, counted | ✅ accurate today |
| Stages 1–8 | `catalog.json` stage range | ✅ |
| Mathematics 133 · English 81 · Computing 64 · Science 53 · Global Perspectives 39 units | `catalog.json` per-subject totals | ✅ |
| Cambridge codes 0096/0862, 0058/0861, 0672/0868, 0846/0893, 0838/1129 | `catalog.json` `cambridgeCode` | ✅ |
| Wehel asks before answering | `wehel_prompt.json` | ✅ behavioural, worth a legal read |
| Narration on explanations | per-subject `course-ui.js` Listen buttons | ✅ |
| Arabic + Somali vocabulary | Somali vocabulary-only support | ⚠️ see below |
| Live classes | `local_hubredirect` / BigBlueButton | ✅ |
| Kindergarten through grade 12 | — | ⚠️ ahead of the catalogue, see below |
| `EHELACADEMY.ORG` | client-supplied | ✅ in the film |

**Two things to keep an eye on:**

1. **"Kindergarten through grade 12" is a wider claim than the catalogue.** The
   catalogue holds Stages 1–8; there are no Stage 9–12 courses in it today. This wording
   was chosen deliberately by the client, and it is recorded here so nobody later reads
   it as a counting error. The rest of the film stays inside the catalogue — the on-screen
   numbers, the subject cards and the Cambridge codes are all real — so the exposure is
   this one line. Revisit it when the upper stages ship, or if the advert has to satisfy
   an advertising standards review.
2. **Somali is vocabulary-only**, not full-course translation. The line "with vocabulary
   in Arabic and Somali" is worded to stay true. Don't let it drift to "taught in Somali".

The child, the class size, "Ms. Nuur", "Amina" and the dashboard percentages are
illustrative — normal for an advert, but if you need them to read as a real testimonial
they must become one.

---

## Cutdowns

The scene structure is built to be cut without re-animating anything.

- **:60** — scenes 1 (shortened to 6s), 3, 4, 5, 8, 10. Keeps the hook, the proof, the tutor and the platform.
- **:30** — scenes 3, 4, 5, 10. Pure product.
- **:15 / social** — scene 5 alone (the Wehel exchange), captions on, no audio needed. It's the strongest single idea in the film.

To cut, edit the `SCENES` array and re-time `VO`; everything else follows.
