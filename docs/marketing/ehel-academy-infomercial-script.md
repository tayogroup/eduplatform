# Ehel Academy × EduPlatform — 3:00 infomercial

**Runtime** 180s exactly · **Format** 1920×1080, 30 or 60fps · **VO** 362 words, ~121 wpm
**Audio** self-scoring — music and effects synthesised in-browser, no files
**Playable film** [ehel-academy-infomercial.html](ehel-academy-infomercial.html) — open it and press Play.

The film is the HTML file, not a storyboard of one. This document is the companion for
whoever records the voice-over, scores it, or cuts a shorter version.

---

## The idea

One child asks a good question at the wrong moment, and the system has no room to answer
it. Everything the platform does — the curriculum, the two kinds of tutor, the narration,
the focus controls, the exams, the tracking, the live sessions, the dashboards, the
messaging — is framed as an answer to that one question. The product only ever appears as
a consequence of a child's need, never as a feature list.

The girl is never seen. She is a voice-over and a progress bar, so any family watching can
put their own child in the frame.

---

## Scene 2, explained

The second scene is arithmetic, not a slogan, and it is the load-bearing idea of the film:

> **One teacher. Thirty-four children. Forty minutes.** → `00:00` → **= 70 seconds of attention each.**

Forty minutes shared across thirty-four children is about seventy seconds per child, and
the clock running to `00:00` is that time expiring. It is why the question in scene 1 never
gets answered — not a bad teacher, just arithmetic. Every product beat afterwards is an
answer to those seventy seconds.

The "= 70 seconds of attention each" line is on screen because the sum didn't read on its
own; viewers shouldn't have to do division to follow the premise.

---

## Timeline

Every timing is read from the `SCENES` and `VO` arrays at the bottom of the HTML. Change
them there and the film changes; this table is downstream of that file.

| # | In | Out | Scene | On screen | Voice-over |
|---|----|-----|-------|-----------|------------|
| 1 | 0:00 | 0:10 | **Cold open** | Near-black. A question types itself in, word by word. Gold caret blinks. | *"At 8:14 on a Tuesday morning, a nine-year-old asks the best question of her life."* / *"And there is nobody free to answer it."* |
| 2 | 0:10 | 0:22 | **The problem** | 34 dots; one turns gold. A 40:00 clock burns to zero, then **= 70 seconds of attention each.** | *"One teacher. Thirty-four children. Forty minutes."* / *"That is seventy seconds each. The question loses."* |
| 3 | 0:22 | 0:31 | **Logo reveal** | Crest scales in over rotating rays. Wordmark resolves from blur. Gold rule. Tagline. | *"So we built the school around the question."* / *"Ehel Academy. Kindergarten through grade 12, online."* |
| 4 | 0:31 | 0:47 | **The curriculum** | Five subject cards cascade with Cambridge codes. Counters tick to 42 / 410 / 1–8, plus Intensive English. | *"Five Cambridge-aligned subjects…"* / *"Forty-two courses. Four hundred and ten units."* |
| 5 | 0:47 | 1:01 | **Wehel — AI tutor** | Chat panel. *"Why does ice float?"* Wehel's reply types out live — a question back, not an answer. | *"Wehel will not hand her the answer. It asks what she thinks first."* |
| 6 | 1:01 | 1:14 | **On-demand human tutor** | Three tutor cards, each **● Available now**. Partner lockup: Education for Tomorrow · edufortomorrow.com. | *"When a question needs a person, a real tutor is one tap away."* / *"Same login. Same records."* |
| 7 | 1:14 | 1:25 | **Heard, not read** | "Listen to this page", a 30-bar waveform, language chips: English / العربية / Soomaali. | *"Narrated word for word."* / *"With vocabulary in Arabic and Somali."* |
| 8 | 1:25 | 1:38 | **Focus mode** | A browser window; the second tab is swept away. Fullscreen lesson. Counter: **Left lesson 0×**. | *"Focus mode takes the whole screen… every time she leaves it is counted."* / *"With nothing to install."* |
| 9 | 1:38 | 1:51 | **Safe Exam Browser** | Exam card: 45 min, 09:00–11:00 window, proctoring On, **0 focus breaks**, SEB verified. | *"Safe Exam Browser locks the device down. Verified, timed and proctored."* |
| 10 | 1:51 | 2:05 | **Monitoring & tracking** | Placement, then four subject bars filling; green tick: *Unit 11 completed — 14 minutes ago.* | *"A placement check, not a guess."* / *"Attendance, engagement, and who is quietly falling behind."* |
| 11 | 2:05 | 2:18 | **Live sessions** | LIVE card with pulsing red dot and Join. Four tiles: Scheduled / Polled / Recorded / Reviewed. | *"Live sessions with real teachers… recorded, polled and summarised."* |
| 12 | 2:18 | 2:32 | **Role dashboards** | Six tiles with mini charts: Learner, Teacher, Parent, School admin, Leadership, Platform. | *"Everybody gets their own front door… none of them sees the rest."* |
| 13 | 2:32 | 2:44 | **Communications** | Composer to 312 Stage 4 parents. Sent / Delivered / Read / Retrying. Channels: Email, SMS, WhatsApp, In-app. | *"Reach one family or every family… with an audit of every message delivered."* |
| 14 | 2:44 | 2:53 | **Quraan Academy** | Five Arabic letters pop in, then the basmala in colour-coded tajweed. | *"The Arabic alphabet, then tajweed. Letter by letter, at her own pace."* |
| 15 | 2:53 | 3:00 | **Close** | Crest, wordmark, tagline, pulsing CTA, URL lockup with *powered by EduPlatform*. | *"Ehel Academy, on EduPlatform. A whole school, built around one child."* / *"Enrolment is open."* |

**Three VO lines deliberately bridge a cut** — #1 (0.6s), #4 (1.0s) and #17 (0.4s) finish
over the following scene. That is intentional: "So we built the school around the question"
is written to resolve *onto* the crest reveal. Don't "fix" them.

---

## Voice-over direction

One voice, warm, unhurried, mid-register. **Not** a hard-sell announcer — the first
twenty seconds are a story about a child, and an announcer read kills them.

- **0:00–0:22** — quiet, close-mic, confiding. Real pauses. Let the clock breathe.
- **0:22–0:31** — the turn. Warmth arrives with the crest.
- **0:31–1:25** — confident and clear. Numbers should sound like facts, not boasts.
- **1:25–1:51** — this is the trust section (focus, exams). Go *calmer and lower*, not
  sterner. It should reassure a parent, not threaten a child.
- **1:51–2:44** — brisk and practical. This is the operations run; keep it moving.
- **2:44–2:53** — soften for Quraan Academy. Reverent, not solemn.
- **2:53–3:00** — direct address. "Enrolment is open" is the only line that may sound like an advert.

---

## Music and sound design

**The film scores itself.** Music and effects are synthesised live with the Web Audio API —
no audio files, so the page stays portable. Press **M** or the 🎵 button to mute.

A step sequencer at 96bpm in D minor / F major, locked to the master clock: scrub the film
and the score scrubs with it.

| Time | Score |
|------|-------|
| 0:00 | Near-silent drone, faint riser. Almost no music. |
| 0:10 | Kick and hats. A clock ticks in real time, fifteen times. |
| 0:21 | **Everything cuts to silence** for one second; a riser sweeps up. The silence is the transition. |
| 0:22 | Low boom + shimmer chime on the crest. Warm pad, no percussion. |
| 0:31 | Full arrangement, arpeggio. Blip per subject card, chime as counters land. |
| 0:47 | Thins out. Blip per chat bubble; typewriter clicks every third letter. |
| 1:01 | Warm and open for the human tutor. Chime on the partner lockup. |
| 1:14 | Counter-melody carries the narration section. Blips on the language chips. |
| 1:25 | **Minor, watchful, no arpeggio.** A lock-thud as the window goes fullscreen; a sweep as the other tab dies. |
| 1:38 | Tighter still — the exam. Heavier lock, then a verification chime. |
| 1:51 | The light comes back: major, arpeggio returns. Rising whoosh as bars fill. |
| 2:05 | Bright. Sting on the LIVE dot. |
| 2:18 | Full. Six blips, one per dashboard. |
| 2:32 | Composer whoosh, then five channel blips. |
| 2:44 | **No percussion at all** under Quraan Academy — pad and a single melodic line. |
| 2:53 | Full arrangement returns. Final boom and chime resolve on F at 2:58.4. |

If you replace this with a licensed track and a real voice-over, mute the built-in sound
and duck music about −18dB under VO.

**Capturing audio:** OBS must record system/desktop audio. Browsers won't produce sound
until you interact, so press **Play** before you start recording.

---

## Exporting a video file

1. Open `ehel-academy-infomercial.html` in Chrome or Edge.
2. Press **H** for record mode — hides the transport bar and progress hairline.
3. Press **C** to drop the burned-in captions (leave them on for silent autoplay on social).
4. Press **R** to restart, and capture with OBS (1920×1080, 60fps, **plus desktop audio**).
5. Stop at 3:00 — the film freezes on the final frame and the clock stops.

**Keep the tab in the foreground.** Browsers suspend animation in background tabs; the
film clamps its clock so it can't jump, but a hidden tab won't advance.

**Scratch track:** the `🔇 VO off` button toggles browser speech synthesis reading the
script in time. It's robotic — it exists to check pacing before you book a voice artist.

---

## Claims in this film, and where they come from

| Claim | Source in this repo | Status |
|-------|---------------------|--------|
| 42 courses, 410 units, Stages 1–8 | `catalog.json`, counted | ✅ |
| Maths 133 · English 81 · Computing 64 · Science 53 · GP 39 · Intensive English 40 | `catalog.json` per-subject | ✅ |
| Cambridge codes 0096/0862, 0058/0861, 0672/0868, 0846/0893, 0838/1129 | `catalog.json` `cambridgeCode` | ✅ |
| Wehel asks before answering | `wehel_prompt.json` | ✅ |
| Narration on explanations | per-subject `course-ui.js` | ✅ |
| Arabic + Somali vocabulary | Somali is **vocabulary-only** | ⚠️ don't let it drift to "taught in Somali" |
| Focus mode: fullscreen, breaks counted, nothing to install | `shared/seb-session.js` (`mountFocusMode`, blur + `visibilitychange` + fullscreen exit), `local_hubredirect/course_focus_event.php` | ✅ |
| SEB: verified, timed window, quit password, proctoring, focus breaks | `create_seb_exam_tables.sql` (`mode`, `proctoring`, `duration_minutes`, `quitpassword`, `window_start/end`), `alter_seb_exam_focus_mode.sql` (`focus_breaks`, `sebverified`, `seb_proctor`), `portal/seb-exams.html` | ✅ |
| Live sessions scheduled / polled / recorded / reviewed | ~30 `portal/live-*.html` pages incl. `live-monitor`, `live-poll`, `live-recordings`, `live-schedule`, `live-summaries`, `live-quality` | ✅ |
| Six role dashboards | `student-dashboard` ("My dashboard"), `teacher-workspace`, `student-parent-portal`, operations pages, `executive-dashboard`, `platform-dashboard` | ✅ |
| Email / SMS / WhatsApp / in-app + delivery audit | `communications-center.html`, `notification-delivery-audit.html` | ✅ |
| Tracking: attendance, engagement, at-risk | `attendance-operations`, `engagement-report`, `at-risk-report`, `analytics-trends` | ✅ |
| Education for Tomorrow — tutor marketplace on the same platform | `edufortomorrow-multibrand-implementation-plan.md`, seeded consumer + domains in `local_prequran/db/upgradelib.php` | ⚠️ see below |
| Kindergarten through grade 12 | — | ⚠️ ahead of the catalogue |

**Three things to keep an eye on:**

1. **"Kindergarten through grade 12" is a wider claim than the catalogue.** The catalogue
   holds Stages 1–8; there are no Stage 9–12 courses today. The wording is deliberate and
   client-chosen, recorded here so nobody later reads it as a counting error. Everything
   else on screen stays inside the catalogue.
2. **EduForTomorrow is real but only at Phase 1.** It is a genuine consumer of this same
   platform — the teacher/tutor marketplace brand, with seeded consumer records and the
   domains `edufortomorrow.com`, `www.` and `app.` already in `upgradelib.php`. But the
   implementation plan lists *public page routing, intake scoping, marketplace consumer
   filters, login continuity and web-service enforcement* as **not started**. The film
   shows three tutors "available now"; that storefront is not live yet. Either ship it
   before the advert runs, or expect to answer for it.
3. **Somali is vocabulary-only**, not full-course translation.

The child, the tutors, "Ms. Nuur", "Amina", the exam figures and the delivery counts are
illustrative — normal for an advert, but if they must read as real testimony, they have
to become real.

---

## Cutdowns

The scene structure cuts without re-animating anything.

- **2:00** — drop scenes 6, 9, 12 and 13 (human tutor, SEB, dashboards, comms); retime.
- **1:00** — scenes 1 (6s), 3, 4, 5, 11, 15. Hook, proof, tutor, live, close.
- **0:30** — scenes 3, 4, 5, 15. Pure product.
- **0:15 / social** — scene 5 alone (the Wehel exchange), captions on, no audio needed.
- **Schools / B2B cut** — scenes 3, 8, 9, 10, 12, 13, 15. This is the compliance-and-operations
  story: focus, exams, tracking, dashboards, messaging. It sells to a head teacher, not a parent.

To cut, edit the `SCENES` array and re-time `VO`; everything else follows.
