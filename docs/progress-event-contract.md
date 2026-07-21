# Progress Event Contract (P1.4)

**Draft 2026-07-21 · contract v1.0.** The wire format between the learner app
(Bunny SPA), the edge/cloud filter, and the Moodle progress web service. Designed
so the same client shape works in the pilot (localStorage) and at scale (edge →
Moodle) — adding the edge later is a routing change, not a rewrite.

## Principles

1. **Filter by significance, not volume.** Every event is one of three classes —
   `durable`, `state`, `ephemeral` — and the class decides where it goes.
2. **Batch, don't stream.** The client emits *batches* of events on transitions,
   idle, and page-hide — never per keystroke.
3. **Store state, not history.** Resumable progress is a **last-write-wins upsert**
   of a summary row, not an append of every change.
4. **Idempotent.** Every durable event carries a client-generated `id`; replays are
   no-ops. Safe to retry.
5. **Offline-first.** An on-device outbox flushes when possible; nothing is lost on
   a dropped connection or a closed tab.

## Scope keys

Every event is scoped by four keys (the app already has all of them at launch):

| Key | Example | Source |
|---|---|---|
| `student` | `48213` | launch token (`studentid`) |
| `course` | `ehel-eng-g03` | catalog idnumber (`?course=`) |
| `unit` | `u03` | current unit |
| `section` | `challenge` | section id within the unit (free string; e.g. `lesson`, `reading`, `challenge`, `writing`, `capstone`) |

## Event classes

| Class | Where it goes | Persistence | Frequency |
|---|---|---|---|
| **durable** | Moodle web service → gradebook / completion | authoritative record, idempotent | low |
| **state** | Moodle web service → summary row | last-write-wins upsert (no history) | medium |
| **ephemeral** | analytics sink (sampled) or dropped | never hits the Moodle DB | high |

## Event types

| `type` | Class | Payload fields |
|---|---|---|
| `checkpoint.result` | durable | `score` (0–100), `passed` (bool), `attempt` |
| `unit.completed` | durable | `sectionsDone`, `total` |
| `capstone.submitted` | durable | `artifactRef` (Bunny/upload key), `rubricSelfScore?` |
| `section.completed` | durable | — (marks a section done) |
| `progress.summary` | state | `sectionsDone[]`, `resume` {section, pos}, `knownWords?`, `xp?` |
| `draft.saved` | state | `section`, `text` *(or `blobRef` if large)*, `words` |
| `section.viewed` | ephemeral | `dwellMs?` |
| `media.played` | ephemeral | `mediaId`, `ms` |
| `hint.used` | ephemeral | `itemId` |
| `game.round` | ephemeral | `gameId`, `result` |

> **The taxonomy is load-bearing:** a mis-tagged durable event that gets dropped is
> a real bug. When unsure, tag `durable`. Never let a gradebook-critical result be
> filtered.

## Batch envelope — client → edge (`POST /progress/ingest`)

```json
{
  "contract": "1.0",
  "student": 48213,
  "course": "ehel-eng-g03",
  "session": "b3f1e2a0-…",          // client session id (coalescing + dedup)
  "sentAt": "2026-07-21T14:22:31Z",
  "events": [
    { "id": "e-0f2a…", "type": "checkpoint.result", "unit": "u03", "section": "challenge",
      "seq": 41, "at": "2026-07-21T14:22:10Z", "score": 92, "passed": true, "attempt": 1 },
    { "id": "e-1b7c…", "type": "progress.summary", "unit": "u03", "section": "challenge",
      "seq": 42, "at": "2026-07-21T14:22:12Z",
      "sectionsDone": ["lesson","reading","challenge"], "resume": {"section":"writing","pos":0}, "xp": 120 },
    { "type": "section.viewed", "unit": "u03", "section": "games", "seq": 43,
      "at": "2026-07-21T14:22:20Z", "dwellMs": 8400 }
  ]
}
```

- `seq` — monotonic per session, for ordering within a flush.
- `at` — event timestamp, the **last-write-wins** key for `state` events.
- `id` — required on `durable` events (idempotency); optional on `state`/`ephemeral`.

**Response:**
```json
{ "accepted": 3, "durable": 2, "dropped": 1, "stateVersion": 87, "ok": true }
```

## Hydrate — app launch (`GET /progress/{course}`)

Returns the current state so the app resumes across devices. Auth: launch token.

```json
{
  "course": "ehel-eng-g03", "student": 48213, "stateVersion": 87,
  "units": {
    "u03": { "sectionsDone": ["lesson","reading","challenge"],
             "resume": {"section":"writing","pos":0},
             "checkpoints": {"challenge": {"score":92,"passed":true}},
             "xp": 120, "knownWords": ["respect","duty"] }
  }
}
```

## Edge routing rules (Bunny Edge Script / cloud function)

```
on POST /progress/ingest:
  verify(launchToken)                       # stateless JWT verify — no Moodle call
  reject if token.student != body.student
  split events by class:
    durable  -> forward to Moodle  local_prequran_progress_ingest  (coalesced batch)
    state    -> coalesce: keep latest per (unit, section) by (at, seq) -> forward to Moodle
    ephemeral-> sample(p) -> analytics sink;  else drop            # never Moodle DB
  return { accepted, durable, dropped, stateVersion }
```

The edge does the **coalescing and routing**; Moodle only ever sees low-volume
durable + state upserts.

## Moodle persistence (`local_prequran`)

**Table `local_prequran_progress`** — one row per (student, course, unit, section):

| Column | Notes |
|---|---|
| `studentid`, `coursekey`, `unit`, `section` | composite key (upsert target) |
| `status` | `viewed` / `completed` |
| `score`, `passed`, `attempt` | for checkpoint sections |
| `state` | JSON summary (resume, knownWords, xp) |
| `version` | server counter; LWW guard |
| `eventid` | last applied durable `id` (dedup) |
| `timemodified` | |

- **Upsert** by the composite key; apply only if incoming `at` ≥ stored → last-write-wins.
- **Dedup** durable events on `(studentid, coursekey, eventid)`.
- **Gradebook**: `checkpoint.result` → grade item; `unit.completed` → activity/course completion. Written by the ingest endpoint, not the client.

Two thin web-service endpoints on `local_prequran` externallib:
`local_prequran_progress_ingest(batch)` and `local_prequran_progress_get(course)`.

## Durability & offline

- **Outbox:** the client queues events in IndexedDB/localStorage; a flusher sends
  batches on: section transition · 20 s idle · `visibilitychange: hidden`.
- **Page close:** durable events flush via `navigator.sendBeacon` (fires on tab
  close). Durable flush window is short (≤ a few seconds); ephemeral batches longer.
- **Retry:** exponential backoff; a batch stays in the outbox until a `200`. Because
  ingest is idempotent, resends are safe.

## Auth & security

- Every request carries the **short-lived signed launch token** (minted by
  `course_launch.php`); the edge verifies it statelessly and checks
  `token.student == body.student`. No secrets in the SPA.
- Rate-limit per student/token at the edge.

## Contract versioning

`contract` is sent on every batch. The ingest endpoint accepts the current major
and the one prior; breaking changes bump the major and ship a new `app/vN`.

## Pilot-phase adapter (no Moodle yet)

For the static pilot, ship a `ProgressClient` with two backends behind the **same
interface**: `local` (writes the batch to localStorage, hydrate reads it back) and
`remote` (POST/GET above). The app calls `progress.emit(event)` /
`progress.hydrate()` identically in both. Moving from pilot to scale = switching the
backend + adding the edge route, with **zero app changes**.
